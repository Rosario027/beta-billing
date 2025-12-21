import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateInvoiceRequest } from "@shared/routes";

export function useInvoices(clientId: number) {
  return useQuery({
    queryKey: [api.invoices.list.path, clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const url = buildUrl(api.invoices.list.path, { clientId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return api.invoices.list.responses[200].parse(await res.json());
    },
  });
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [api.invoices.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.invoices.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch invoice");
      return api.invoices.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, ...data }: CreateInvoiceRequest & { clientId: number }) => {
      const url = buildUrl(api.invoices.create.path, { clientId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, clientId }),
        credentials: "include",
      });
      if (!res.ok) {
         if (res.status === 400) {
            // Log the validation error for debugging
            const error = await res.json();
            console.error("Validation error:", error);
            throw new Error(error.message || "Invalid invoice data");
         }
         throw new Error("Failed to create invoice");
      }
      return api.invoices.create.responses[201].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: [api.invoices.list.path, variables.clientId] 
      });
    },
  });
}
