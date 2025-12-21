import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCustomer } from "@shared/routes";

export function useCustomers(clientId: number) {
  return useQuery({
    queryKey: [api.customers.list.path, clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const url = buildUrl(api.customers.list.path, { clientId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch customers");
      return api.customers.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, ...data }: InsertCustomer & { clientId: number }) => {
      const url = buildUrl(api.customers.create.path, { clientId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, clientId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create customer");
      return api.customers.create.responses[201].parse(await res.json());
    },
    onSuccess: (data, variables) => {
      // Invalidate the list for the specific client
      queryClient.invalidateQueries({ 
        queryKey: [api.customers.list.path, variables.clientId] 
      });
    },
  });
}
