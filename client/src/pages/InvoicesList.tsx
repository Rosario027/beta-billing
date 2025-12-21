import { useActiveClient } from "@/hooks/use-active-client";
import { useInvoices } from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { useLocation, Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Download, Eye } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function InvoicesList() {
  const { activeClientId } = useActiveClient();
  const [, setLocation] = useLocation();
  const { data: invoices, isLoading } = useInvoices(activeClientId || 0);
  const { data: customers } = useCustomers(activeClientId || 0);
  const [search, setSearch] = useState("");

  if (!activeClientId) {
    setLocation("/");
    return null;
  }

  // Create lookup for customer names
  const customerMap = new Map(customers?.map(c => [c.id, c.name]));

  const filteredInvoices = invoices?.filter(inv => {
    const customerName = customerMap.get(inv.customerId) || "";
    return inv.number.toLowerCase().includes(search.toLowerCase()) || 
           customerName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
           <p className="text-muted-foreground mt-1">Manage and track bills</p>
        </div>
        <Link href="/invoices/new">
          <Button className="shadow-lg shadow-primary/20 gap-2">
            <Plus className="w-5 h-5" /> Create Invoice
          </Button>
        </Link>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by number or customer..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices?.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                         No invoices found.
                       </TableCell>
                     </TableRow>
                  )}
                  {filteredInvoices?.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{invoice.number}</TableCell>
                      <TableCell>{format(new Date(invoice.date), "MMM d, yyyy")}</TableCell>
                      <TableCell className="font-medium">
                        {customerMap.get(invoice.customerId) || "Unknown"}
                      </TableCell>
                      <TableCell>
                         <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border
                            ${invoice.status === 'paid' ? 'bg-success/10 text-success border-success/20' : 
                              invoice.status === 'sent' ? 'bg-warning/10 text-warning border-warning/20' : 
                              'bg-muted text-muted-foreground border-border'}`}>
                            {invoice.status}
                         </span>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        ₹{Number(invoice.total).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
