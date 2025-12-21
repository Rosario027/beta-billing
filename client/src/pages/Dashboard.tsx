import { useActiveClient } from "@/hooks/use-active-client";
import { useClients } from "@/hooks/use-clients";
import { useInvoices } from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { Link } from "wouter";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  ArrowRight,
  Plus,
  Briefcase
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { activeClientId } = useActiveClient();
  const { data: clients, isLoading: isLoadingClients } = useClients();
  const { data: invoices } = useInvoices(activeClientId || 0);
  const { data: customers } = useCustomers(activeClientId || 0);

  const activeClient = clients?.find(c => c.id === activeClientId);

  // Loading State
  if (isLoadingClients) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // GLOBAL DASHBOARD (No Client Selected)
  if (!activeClientId || !activeClient) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome to TaxFlow</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Manage your clients' GST invoicing, customers, and reports from a single powerful dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {clients?.length === 0 ? (
            <div className="md:col-span-2 text-center p-12 border-2 border-dashed border-muted-foreground/20 rounded-2xl bg-muted/5">
              <h3 className="text-xl font-semibold mb-2">No Clients Yet</h3>
              <p className="text-muted-foreground mb-6">Get started by adding your first client workspace.</p>
              <Link href="/clients/new">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" /> Add First Client
                </Button>
              </Link>
            </div>
          ) : (
            <Card className="hover:shadow-lg transition-shadow border-primary/10">
              <CardHeader>
                <CardTitle>Select a Client</CardTitle>
                <CardDescription>Continue working on a client's account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clients?.slice(0, 3).map(client => (
                   <div key={client.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border">
                     <span className="font-medium">{client.name}</span>
                     <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
                       {client.gstin}
                     </span>
                   </div>
                ))}
                <p className="text-xs text-center text-muted-foreground pt-2">
                  Use the sidebar selector to switch clients
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-none shadow-xl shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-primary-foreground/80">Manage your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/clients/new">
                <Button variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-0">
                  <Plus className="w-4 h-4" /> Add New Client
                </Button>
              </Link>
              <Button variant="secondary" className="w-full justify-start gap-2 bg-white/10 hover:bg-white/20 text-white border-0">
                <Users className="w-4 h-4" /> Manage Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // CLIENT DASHBOARD
  const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;
  const pendingInvoices = invoices?.filter(inv => inv.status === 'sent').length || 0;
  
  // Dummy chart data for illustration
  const chartData = [
    { name: 'Jan', total: 4000 },
    { name: 'Feb', total: 3000 },
    { name: 'Mar', total: 2000 },
    { name: 'Apr', total: 2780 },
    { name: 'May', total: 1890 },
    { name: 'Jun', total: 2390 },
    { name: 'Jul', total: 3490 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{activeClient.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">GSTIN: {activeClient.gstin}</p>
        </div>
        <Link href="/invoices/new">
          <Button size="lg" className="shadow-lg shadow-primary/25 gap-2">
            <Plus className="w-5 h-5" /> Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime collected</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-accent hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-warning hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Section */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest transactions for this client</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices?.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{invoice.number}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{Number(invoice.total).toLocaleString()}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide 
                      ${invoice.status === 'paid' ? 'bg-success/10 text-success' : 
                        invoice.status === 'sent' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!invoices || invoices.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices created yet.
                </div>
              )}
            </div>
            {invoices && invoices.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/invoices">
                  <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-primary">
                    View All Invoices <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
