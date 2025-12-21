import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import ClientCreate from "@/pages/ClientCreate";
import CustomersList from "@/pages/CustomersList";
import InvoicesList from "@/pages/InvoicesList";
import InvoiceCreate from "@/pages/InvoiceCreate";

function PrivateRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm font-medium">Loading TaxFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Replit Auth flow: handled by backend/frontend hooks, but if we're here
    // and not user, we show a public landing or redirect
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <h1 className="text-4xl font-display font-bold text-primary">TaxFlow</h1>
        <p className="text-muted-foreground">Secure GST Invoicing for CAs</p>
        <a href="/api/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
          Login with Replit
        </a>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients/new" component={ClientCreate} />
        <Route path="/customers" component={CustomersList} />
        <Route path="/invoices" component={InvoicesList} />
        <Route path="/invoices/new" component={InvoiceCreate} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PrivateRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
