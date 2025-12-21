import { useActiveClient } from "@/hooks/use-active-client";
import { useCustomers } from "@/hooks/use-customers";
import { useLocation } from "wouter";
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
import { Plus, Search, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { CreateCustomerDialog } from "@/components/CreateCustomerDialog"; // We'll create this inline or separate if complex

export default function CustomersList() {
  const { activeClientId } = useActiveClient();
  const [, setLocation] = useLocation();
  const { data: customers, isLoading } = useCustomers(activeClientId || 0);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!activeClientId) {
    setLocation("/");
    return null;
  }

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
           <p className="text-muted-foreground mt-1">Manage client directory</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg shadow-primary/20 gap-2">
          <Plus className="w-5 h-5" /> Add Customer
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or GSTIN..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Customer Name</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers?.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                         No customers found. Add one to get started.
                       </TableCell>
                     </TableRow>
                  )}
                  {filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-base">{customer.name}</span>
                          {customer.address && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                               <MapPin className="w-3 h-3" /> {customer.address}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.gstin ? (
                           <span className="font-mono bg-secondary px-2 py-0.5 rounded text-xs">
                             {customer.gstin}
                           </span>
                        ) : (
                           <span className="text-muted-foreground text-xs italic">Unregistered / B2C</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                           {customer.email && (
                             <div className="flex items-center gap-2 text-muted-foreground">
                               <Mail className="w-3 h-3" /> {customer.email}
                             </div>
                           )}
                           {customer.phone && (
                             <div className="flex items-center gap-2 text-muted-foreground">
                               <Phone className="w-3 h-3" /> {customer.phone}
                             </div>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCustomerDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        clientId={activeClientId} 
      />
    </div>
  );
}
