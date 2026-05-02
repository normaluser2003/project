import { useState } from "react";
import { useVerifyCertificate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, Search, Zap, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Verify() {
  const [hash, setHash] = useState("");
  const [verifierName, setVerifierName] = useState("");
  const [verifierOrg, setVerifierOrg] = useState("");

  const verifyMutation = useVerifyCertificate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash || !verifierName || !verifierOrg) return;
    
    verifyMutation.mutate({
      data: {
        certificateHash: hash,
        verifierName,
        verifierOrganization: verifierOrg
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verify Certificate</h1>
        <p className="text-muted-foreground mt-1">Cryptographically authenticate a certificate using its hash.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hash Lookup</CardTitle>
          <CardDescription>Enter the 64-character SHA-256 certificate hash along with your verifier details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Certificate Hash</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. 8f4e2b... (64 characters)" 
                  className="pl-9 font-mono text-sm"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Verifier Name</label>
                <Input 
                  placeholder="Your Name" 
                  value={verifierName}
                  onChange={(e) => setVerifierName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization</label>
                <Input 
                  placeholder="Your Organization" 
                  value={verifierOrg}
                  onChange={(e) => setVerifierOrg(e.target.value)}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={verifyMutation.isPending || !hash || !verifierName || !verifierOrg}
            >
              {verifyMutation.isPending ? "Authenticating..." : "Verify Certificate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {verifyMutation.data && (
        <Card className={`border-2 ${
          verifyMutation.data.valid 
            ? 'border-emerald-500/50' 
            : verifyMutation.data.found ? 'border-destructive/50' : 'border-amber-500/50'
        }`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {verifyMutation.data.valid ? (
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
              ) : verifyMutation.data.found ? (
                <ShieldAlert className="h-8 w-8 text-destructive" />
              ) : (
                <Shield className="h-8 w-8 text-amber-500" />
              )}
              <div>
                <CardTitle>
                  {verifyMutation.data.valid 
                    ? "Certificate Verified" 
                    : verifyMutation.data.found ? "Certificate Revoked" : "Certificate Not Found"}
                </CardTitle>
                <CardDescription>
                  {verifyMutation.data.message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-md text-sm">
                <Zap className="h-4 w-4 text-primary" />
                Search Time: <span className="font-mono font-bold text-primary">{verifyMutation.data.searchTimeMs.toFixed(2)}ms</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-md text-sm">
                <Key className="h-4 w-4 text-primary" />
                Bloom Filter: <span className="font-mono font-bold text-primary">{verifyMutation.data.bloomFilterHit ? "HIT" : "MISS"}</span>
              </div>
            </div>

            {verifyMutation.data.certificate && (
              <div className="bg-card rounded-lg border p-4 space-y-4">
                <h3 className="font-semibold border-b pb-2">Certificate Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Holder Name</span>
                    <span className="font-medium">{verifyMutation.data.certificate.holderName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Issuer</span>
                    <span className="font-medium">{verifyMutation.data.certificate.issuerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Degree / Field</span>
                    <span className="font-medium">{verifyMutation.data.certificate.degree} in {verifyMutation.data.certificate.field}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Grade</span>
                    <span className="font-medium">{verifyMutation.data.certificate.grade}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Issued Date</span>
                    <span className="font-medium">{format(new Date(verifyMutation.data.certificate.issuedDate), 'MMMM d, yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Status</span>
                    <Badge variant={verifyMutation.data.certificate.status === 'valid' ? 'default' : 'destructive'} className="mt-1">
                      {verifyMutation.data.certificate.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider">Transaction Hash</span>
                  <span className="font-mono text-xs break-all text-primary">{verifyMutation.data.certificate.transactionHash}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
