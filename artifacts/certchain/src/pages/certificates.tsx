import { useState } from "react";
import { useListCertificates, useIssueCertificate, useUpdateCertificateStatus, getListCertificatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Plus, Search, ShieldOff } from "lucide-react";

export default function Certificates() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  
  const { data: certificates, isLoading } = useListCertificates({ search: search || undefined });
  const issueMutation = useIssueCertificate();
  const updateStatusMutation = useUpdateCertificateStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    holderName: "",
    holderEmail: "",
    issuerId: "1", // Hardcoded default for demo
    degree: "",
    field: "",
    grade: "",
    issuedDate: new Date().toISOString().split('T')[0],
  });

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    issueMutation.mutate({
      data: {
        ...formData,
        issuerId: parseInt(formData.issuerId)
      }
    }, {
      onSuccess: () => {
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
      }
    });
  };

  const handleRevoke = (id: number) => {
    updateStatusMutation.mutate({
      id,
      data: { status: "revoked" }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCertificatesQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Registry</h1>
          <p className="text-muted-foreground mt-1">Manage and view all issued certificates on the network.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2"><Plus className="h-4 w-4" /> Issue Certificate</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue New Certificate</DialogTitle>
              <DialogDescription>
                Cryptographically sign and record a new certificate on the blockchain.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleIssue} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Holder Name</label>
                  <Input required value={formData.holderName} onChange={e => setFormData({...formData, holderName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Holder Email</label>
                  <Input type="email" required value={formData.holderEmail} onChange={e => setFormData({...formData, holderEmail: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Degree</label>
                  <Input required placeholder="e.g. B.Sc." value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field of Study</label>
                  <Input required placeholder="e.g. Computer Science" value={formData.field} onChange={e => setFormData({...formData, field: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade</label>
                  <Input required placeholder="e.g. First Class" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issuer ID</label>
                  <Input required type="number" value={formData.issuerId} onChange={e => setFormData({...formData, issuerId: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={issueMutation.isPending}>
                {issueMutation.isPending ? "Issuing..." : "Sign & Issue Certificate"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 bg-card border rounded-md p-1 pl-3 w-full max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input 
          className="border-0 shadow-none focus-visible:ring-0 px-2 h-9" 
          placeholder="Search by hash, name, or issuer..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Holder</TableHead>
              <TableHead>Degree/Field</TableHead>
              <TableHead>Issuer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="h-16 text-center">
                    <div className="animate-pulse bg-secondary/50 h-6 w-full rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : certificates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No certificates found.
                </TableCell>
              </TableRow>
            ) : (
              certificates?.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.holderName}</TableCell>
                  <TableCell>
                    <div className="text-sm">{cert.degree}</div>
                    <div className="text-xs text-muted-foreground">{cert.field}</div>
                  </TableCell>
                  <TableCell>{cert.issuerName}</TableCell>
                  <TableCell>{format(new Date(cert.issuedDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Badge variant={cert.status === 'valid' ? 'default' : cert.status === 'revoked' ? 'destructive' : 'secondary'}>
                      {cert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-muted-foreground w-32 truncate" title={cert.certificateHash}>
                      {cert.certificateHash.substring(0, 16)}...
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {cert.status === 'valid' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                        onClick={() => handleRevoke(cert.id)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <ShieldOff className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
