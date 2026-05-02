import { useState } from "react";
import { useListIssuers, useCreateIssuer, useUpdateIssuerStatus, useVoteOnIssuer, getListIssuersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Building2, ThumbsUp, ThumbsDown, Plus } from "lucide-react";

export default function Issuers() {
  const queryClient = useQueryClient();
  const { data: issuers, isLoading } = useListIssuers();
  
  const createIssuerMutation = useCreateIssuer();
  const updateStatusMutation = useUpdateIssuerStatus();
  const voteMutation = useVoteOnIssuer();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "university" as const,
    country: "",
    address: ""
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    createIssuerMutation.mutate({
      data: formData
    }, {
      onSuccess: () => {
        setIsOpen(false);
        queryClient.invalidateQueries({ queryKey: getListIssuersQueryKey() });
      }
    });
  };

  const handleVote = (id: number, vote: 'approve' | 'reject') => {
    voteMutation.mutate({
      id,
      data: { vote, validatorName: "Admin Validator" }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIssuersQueryKey() });
      }
    });
  };

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({
      id,
      data: { status: 'approved' }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIssuersQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issuer Management</h1>
          <p className="text-muted-foreground mt-1">Decentralized governance of the certificate issuance network.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2"><Plus className="h-4 w-4" /> Register Issuer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Institution</DialogTitle>
              <DialogDescription>
                Submit an institution to the network for decentralized approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Institution Name</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Institution Type</label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Input required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createIssuerMutation.isPending}>
                {createIssuerMutation.isPending ? "Registering..." : "Submit Registration"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-card/50">
              <CardHeader className="h-24"></CardHeader>
              <CardContent className="h-20"></CardContent>
            </Card>
          ))
        ) : issuers?.map((issuer) => (
          <Card key={issuer.id} className={`flex flex-col ${issuer.status === 'pending' ? 'border-primary/50 bg-primary/5' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={
                  issuer.status === 'approved' ? 'default' : 
                  issuer.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {issuer.status.toUpperCase()}
                </Badge>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="line-clamp-1">{issuer.name}</CardTitle>
              <CardDescription>{issuer.type} · {issuer.country}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-3 mb-6">
                <div className="text-sm flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Certificates Issued</span>
                  <span className="font-mono font-medium">{issuer.totalCertificates}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate font-mono">
                  PK: {issuer.publicKeyHash}
                </div>
                <div className="text-xs text-muted-foreground">
                  Registered: {format(new Date(issuer.createdAt), 'MMM d, yyyy')}
                </div>
              </div>

              {issuer.status === 'pending' && (
                <div className="space-y-3 pt-4 border-t mt-auto">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-emerald-500"><ThumbsUp className="h-3 w-3" /> {issuer.votesFor}</span>
                    <span className="flex items-center gap-1 text-destructive"><ThumbsDown className="h-3 w-3" /> {issuer.votesAgainst}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500 border-emerald-500/20"
                      onClick={() => handleVote(issuer.id, 'approve')}
                      disabled={voteMutation.isPending}
                    >
                      Vote Apprv
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-destructive/20"
                      onClick={() => handleVote(issuer.id, 'reject')}
                      disabled={voteMutation.isPending}
                    >
                      Vote Rej
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => handleApprove(issuer.id)}
                    disabled={updateStatusMutation.isPending}
                  >
                    Force Approve
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
