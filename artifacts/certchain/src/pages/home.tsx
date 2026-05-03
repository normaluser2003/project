import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Zap, Lock, Database, ShieldCheck, ShieldAlert, Search, Key, AlertCircle, Lock as LockIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useListIssuers, useVerifyCertificate } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Home() {
  const [, navigate] = useLocation();
  const { user, login } = useAuth();

  // Login form state
  const [issuerId, setIssuerId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Verify form state
  const [hash, setHash] = useState("");
  const [verifierName, setVerifierName] = useState("");
  const [verifierOrg, setVerifierOrg] = useState("");

  const { data: issuers } = useListIssuers({});
  const verifyMutation = useVerifyCertificate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!issuerId) { setLoginError("Please select your institution."); return; }
    setLoginLoading(true);
    try {
      await login(parseInt(issuerId), password);
      navigate("/dashboard");
    } catch (err: any) {
      setLoginError(err.message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash || !verifierName || !verifierOrg) return;
    verifyMutation.mutate({
      data: { certificateHash: hash, verifierName, verifierOrganization: verifierOrg }
    });
  };

  const result = verifyMutation.data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">CertChain</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user.name}</span>
            </div>
            <Button size="sm" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-16 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-mono mb-6">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Blockchain-based Authentication
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground max-w-3xl">
            Trust, verified in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300">
              milliseconds
            </span>.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mt-4 leading-relaxed">
            Institutional-grade digital certificates secured on the blockchain.
            Tamper-proof issuance, instant hash-based lookup, and decentralized validation.
          </p>
        </section>

        {/* Two panels */}
        <section className="px-6 md:px-12 pb-12 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Institution Login Panel */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <LockIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Institution Portal</h2>
                  <p className="text-sm text-muted-foreground">Sign in to issue and manage certificates</p>
                </div>
              </div>

              {user ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.type} · {user.country}</p>
                  </div>
                  <Button className="w-full mt-2" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Institution</label>
                    <Select value={issuerId} onValueChange={setIssuerId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select your institution..." />
                      </SelectTrigger>
                      <SelectContent>
                        {issuers?.map((issuer) => (
                          <SelectItem key={issuer.id} value={String(issuer.id)}>
                            {issuer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      required
                      placeholder="Enter your password"
                      className="h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {loginError && (
                    <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {loginError}
                    </div>
                  )}

                  <Button type="submit" className="h-11 w-full" disabled={loginLoading}>
                    {loginLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Default password: <span className="font-mono font-medium text-foreground">Abcd@123</span>
                  </p>
                </form>
              )}
            </div>

            {/* Certificate Verification Panel */}
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Verify Certificate</h2>
                  <p className="text-sm text-muted-foreground">Authenticate any certificate using its blockchain hash</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Certificate Hash</label>
                  <Input
                    placeholder="e.g. 8f4e2b... (64 characters)"
                    className="font-mono text-sm h-11"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input
                      placeholder="Full name"
                      className="h-11"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization</label>
                    <Input
                      placeholder="Your org"
                      className="h-11"
                      value={verifierOrg}
                      onChange={(e) => setVerifierOrg(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-11 w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  disabled={verifyMutation.isPending || !hash || !verifierName || !verifierOrg}
                >
                  {verifyMutation.isPending ? "Authenticating..." : "Verify Certificate"}
                </Button>
              </form>

              {/* Verification Result */}
              {result && (
                <div className={`rounded-xl border-2 p-4 space-y-3 ${
                  result.valid
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : result.found
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-amber-500/50 bg-amber-500/5"
                }`}>
                  <div className="flex items-center gap-2">
                    {result.valid ? (
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    ) : result.found ? (
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                    ) : (
                      <Shield className="h-5 w-5 text-amber-500" />
                    )}
                    <span className="font-semibold">
                      {result.valid ? "Certificate Verified" : result.found ? "Certificate Revoked" : "Not Found"}
                    </span>
                    <div className="flex gap-2 ml-auto">
                      <span className="flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-md font-mono">
                        <Zap className="h-3 w-3 text-primary" /> {result.searchTimeMs.toFixed(2)}ms
                      </span>
                      <span className="flex items-center gap-1 text-xs bg-secondary px-2 py-0.5 rounded-md font-mono">
                        <Key className="h-3 w-3 text-primary" /> {result.bloomFilterHit ? "BLOOM HIT" : "BLOOM MISS"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>

                  {result.certificate && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t border-border/50">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block">Holder</span>
                        <span className="font-medium">{result.certificate.holderName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block">Issuer</span>
                        <span className="font-medium">{result.certificate.issuerName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block">Degree</span>
                        <span className="font-medium">{result.certificate.degree} in {result.certificate.field}</span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block">Status</span>
                        <Badge variant={result.certificate.status === "valid" ? "default" : "destructive"} className="mt-0.5">
                          {result.certificate.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block">Issued</span>
                        <span className="font-medium">{format(new Date(result.certificate.issuedDate), "MMMM d, yyyy")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="px-6 md:px-12 pb-16 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <Zap className="h-7 w-7 text-primary mb-3" />
              <h3 className="text-base font-semibold mb-1">Instant Verification</h3>
              <p className="text-muted-foreground text-sm">Bloom Filter-optimized lookups deliver results before querying the full chain state.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <Lock className="h-7 w-7 text-primary mb-3" />
              <h3 className="text-base font-semibold mb-1">Cryptographic Proof</h3>
              <p className="text-muted-foreground text-sm">Every certificate is hashed and recorded on-chain, making tampering mathematically impossible.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card/50">
              <Database className="h-7 w-7 text-primary mb-3" />
              <h3 className="text-base font-semibold mb-1">Decentralized Registry</h3>
              <p className="text-muted-foreground text-sm">A consortium of verified institutions governs the issuance network, removing single points of failure.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>CertChain Protocol © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
