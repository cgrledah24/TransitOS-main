import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground relative selection:bg-primary/30">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto relative z-10">
        <header className="sticky top-0 z-20 flex items-center justify-end px-6 py-3 border-b border-white/5 bg-background/60 backdrop-blur-xl">
          <LanguageSelector />
        </header>
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
