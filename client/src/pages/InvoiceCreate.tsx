import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { useCreateInvoice } from "@/hooks/use-invoices";
import { useActiveClient } from "@/hooks/use-active-client";
import { useCustomers } from "@/hooks/use-customers";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { 
  Plus, 
  Trash2, 
  Save, 
  Calculator, 
  Calendar as CalendarIcon,
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";

// Extended validation logic - coerce strings to numbers for API
const formSchema = createInvoiceSchema.extend({
  subtotal: z.coerce.number(),
  taxTotal: z.coerce.number(),
  total: z.coerce.number(),
  customerId: z.coerce.number({ required_error: "Customer is required" }),
  items: z.array(
    z.object({
      description: z.string().min(1, "Description required"),
      hsn: z.string().optional(),
      quantity: z.coerce.number().min(0.01, "Qty > 0"),
      rate: z.coerce.number().min(0, "Rate >= 0"),
      amount: z.coerce.number(),
      gstRate: z.coerce.number(),
      igst: z.coerce.number().optional(),
      cgst: z.coerce.number().optional(),
      sgst: z.coerce.number().optional(),
    })
  ).min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof formSchema>;

export default function InvoiceCreate() {
  const { activeClientId } = useActiveClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: customers } = useCustomers(activeClientId || 0);
  const { mutateAsync: createInvoice, isPending } = useCreateInvoice();

  if (!activeClientId) {
    setLocation("/");
    return null;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: activeClientId,
      customerId: undefined,
      number: "INV-" + Date.now().toString().slice(-4), // Mock auto-gen
      date: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 days
      placeOfSupply: "",
      status: "draft",
      subtotal: 0,
      taxTotal: 0,
      total: 0,
      isB2C: false,
      items: [
        { description: "", hsn: "", quantity: 1, rate: 0, amount: 0, gstRate: 18, igst: 0, cgst: 0, sgst: 0 }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculation Logic
  const watchItems = form.watch("items");
  
  useEffect(() => {
    let sub = 0;
    let tax = 0;

    const updatedItems = watchItems.map(item => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const amount = qty * rate;
      
      const gstRate = Number(item.gstRate) || 0;
      const taxAmount = (amount * gstRate) / 100;

      sub += amount;
      tax += taxAmount;

      return { amount, taxAmount };
    });

    // Update totals only if they changed to prevent infinite loops (simple check)
    const currentTotal = form.getValues("total");
    const newTotal = sub + tax;

    if (Math.abs(currentTotal - newTotal) > 0.01) {
      form.setValue("subtotal", Number(sub.toFixed(2)));
      form.setValue("taxTotal", Number(tax.toFixed(2)));
      form.setValue("total", Number(newTotal.toFixed(2)));
    }
  }, [JSON.stringify(watchItems), form]);


  async function onSubmit(data: FormValues) {
    try {
      // Recalculate split taxes before sending
      const finalItems = data.items.map(item => {
        const amount = Number(item.quantity) * Number(item.rate);
        const gstRate = Number(item.gstRate);
        const taxAmt = (amount * gstRate) / 100;
        
        // Simple logic: If Place of Supply differs -> IGST, else CGST+SGST
        // For MVP assuming Intra-state (CGST+SGST) for simplicity unless customized
        return {
          ...item,
          amount: amount.toFixed(2),
          cgst: (taxAmt / 2).toFixed(2),
          sgst: (taxAmt / 2).toFixed(2),
          igst: "0",
        };
      });

      await createInvoice({
        ...data,
        clientId: activeClientId!,
        items: finalItems,
      });

      toast({ title: "Invoice Created", description: "Draft saved successfully" });
      setLocation("/invoices");
    } catch (error) {
      toast({ 
        title: "Error", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <Link href="/invoices" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Invoices
        </Link>
        <h1 className="text-2xl font-bold">New Tax Invoice</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Header Section */}
          <Card className="shadow-md border-t-4 border-t-primary">
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Customer</FormLabel>
                    <Select 
                      onValueChange={(val) => {
                        field.onChange(val);
                        // Auto-fill place of supply
                        const cust = customers?.find(c => c.id.toString() === val);
                        if (cust) form.setValue("placeOfSupply", cust.address || "");
                      }} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers?.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No.</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={clsx("w-full h-11 pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placeOfSupply"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Place of Supply (Address)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="State / City" className="h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="shadow-md">
            <CardHeader className="bg-muted/30 py-4 border-b">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
                <div className="col-span-4">Item Details</div>
                <div className="col-span-2 text-right">HSN/SAC</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate (₹)</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-start px-2 group">
                  <div className="col-span-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Item Description" className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.hsn`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="HSN" className="h-10 text-right font-mono text-xs" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" {...field} className="h-10 text-right" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name={`items.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" {...field} className="h-10 text-right" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 text-right pt-2 font-mono font-medium text-sm">
                     {(form.watch(`items.${index}.quantity`) * form.watch(`items.${index}.rate`)).toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button 
                type="button" 
                variant="outline" 
                className="mt-4 border-dashed border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => append({ description: "", hsn: "", quantity: 1, rate: 0, amount: 0, gstRate: 18, igst: 0, cgst: 0, sgst: 0 })}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Totals Footer */}
          <div className="flex flex-col md:flex-row justify-end gap-8">
            <Card className="w-full md:w-80 shadow-lg border-primary/10">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{form.watch("subtotal").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax Total (Approx 18%)</span>
                  <span className="font-mono">{form.watch("taxTotal").toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Grand Total</span>
                  <span className="font-bold text-xl text-primary font-mono">
                    ₹{form.watch("total").toFixed(2)}
                  </span>
                </div>
                
                <Button type="submit" className="w-full h-12 text-lg shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all" disabled={isPending}>
                  <Save className="w-5 h-5 mr-2" /> 
                  {isPending ? "Saving..." : "Save Invoice"}
                </Button>
              </CardContent>
            </Card>
          </div>

        </form>
      </Form>
    </div>
  );
}
