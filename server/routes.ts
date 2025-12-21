import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // === Client Routes ===
  
  app.get(api.clients.list.path, async (req, res) => {
    // In a real app, we'd get userId from req.user
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    
    const clients = await storage.getClients(userId);
    res.json(clients);
  });

  app.get(api.clients.get.path, async (req, res) => {
    const client = await storage.getClient(Number(req.params.id));
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    // Check ownership
    if (!req.user || client.userId !== (req.user as any).claims.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(client);
  });

  app.post(api.clients.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;

    try {
      const input = api.clients.create.input.parse(req.body);
      const client = await storage.createClient({ ...input, userId });
      res.status(201).json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.clients.update.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    
    const existing = await storage.getClient(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Client not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.clients.update.input.parse(req.body);
      const client = await storage.updateClient(Number(req.params.id), input);
      res.json(client);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.clients.delete.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userId = (req.user as any).claims.sub;
    
    const existing = await storage.getClient(Number(req.params.id));
    if (!existing) return res.status(404).json({ message: "Client not found" });
    if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteClient(Number(req.params.id));
    res.status(204).send();
  });

  // === Customer Routes ===

  app.get(api.customers.list.path, async (req, res) => {
    const clientId = Number(req.params.clientId);
    // TODO: Validate client ownership here too for security
    const customers = await storage.getCustomers(clientId);
    res.json(customers);
  });

  app.get(api.customers.get.path, async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  app.post(api.customers.create.path, async (req, res) => {
    try {
      // Ensure clientId in body matches URL or validate it
      const input = api.customers.create.input.parse(req.body);
      const customer = await storage.createCustomer(input);
      res.status(201).json(customer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.customers.update.path, async (req, res) => {
    try {
      const input = api.customers.update.input.parse(req.body);
      const customer = await storage.updateCustomer(Number(req.params.id), input);
      res.json(customer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.customers.delete.path, async (req, res) => {
    await storage.deleteCustomer(Number(req.params.id));
    res.status(204).send();
  });

  // === Invoice Routes ===

  app.get(api.invoices.list.path, async (req, res) => {
    const clientId = Number(req.params.clientId);
    const invoices = await storage.getInvoices(clientId);
    res.json(invoices);
  });

  app.get(api.invoices.get.path, async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  });

  app.post(api.invoices.create.path, async (req, res) => {
    try {
      const input = api.invoices.create.input.parse(req.body);
      const invoice = await storage.createInvoice({ ...input, clientId: Number(req.params.clientId) });
      res.status(201).json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.invoices.update.path, async (req, res) => {
    try {
      const input = api.invoices.update.input.parse(req.body);
      const invoice = await storage.updateInvoice(Number(req.params.id), input);
      res.json(invoice);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.invoices.delete.path, async (req, res) => {
    await storage.deleteInvoice(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
