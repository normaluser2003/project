import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Lock, Database } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">CertChain</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/verify">
            <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">Verify Certificate</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Launch App</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center text-center px-6 pt-24 pb-32">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-mono">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Blockchain-based Authentication
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
            Trust, verified in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300">milliseconds</span>.
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Institutional-grade digital certificates secured on the blockchain. 
            Tamper-proof issuance, instant hash-based lookup, and decentralized validation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
                Access Platform
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 border-border hover:bg-secondary">
                Verify a Certificate
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-32 text-left">
          <div className="p-6 rounded-lg border border-border bg-card/50">
            <Zap className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Verification</h3>
            <p className="text-muted-foreground text-sm">Powered by optimized Bloom Filters, allowing instantaneous lookups before querying the full chain state.</p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card/50">
            <Lock className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cryptographic Proof</h3>
            <p className="text-muted-foreground text-sm">Every certificate is hashed and recorded on-chain, making unauthorized modifications mathematically impossible.</p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card/50">
            <Database className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Decentralized Registry</h3>
            <p className="text-muted-foreground text-sm">A consortium of verified educational institutions governs the issuance network, removing single points of failure.</p>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>CertChain Protocol © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
