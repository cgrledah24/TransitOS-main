import { Link } from "wouter";
import { Button } from "@/components/ui/PremiumComponents";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center flex flex-col items-center max-w-md p-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">404</h1>
        <p className="text-muted-foreground mb-8">The page you are looking for doesn't exist or has been moved.</p>
        <Link href="/dashboard" className="w-full sm:w-auto">
          <Button size="lg" className="w-full">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
