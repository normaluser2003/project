import { useState } from "react";
import { useLocation } from "wouter";
import { useListIssuers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const { data: issuers } = useListIssuers({});

  const [issuerId, setIssuerId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!issuerId) { setError("Please select your institution."); return; }
    setLoading(true);
    try {
      await login(parseInt(issuerId), password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CertChain</h1>
            <p className="text-muted-foreground mt-1">Institution Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-xl p-8 shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Sign in to your institution</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select your institution and enter your password to access the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="Enter your password"
                  className="pl-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading || authLoading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Default password: <span className="font-mono font-medium text-foreground">Abcd@123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
