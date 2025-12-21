import { db } from "./db";
import { 
  clients, customers, invoices, invoiceItems,
  type InsertClient, type Client, 
  type InsertCustomer, type Customer,
  type CreateInvoiceRequest, type Invoice,
  type UpdateInvoiceRequest
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Clients
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient & { userId: string }): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Customers
  getCustomers(clientId: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Invoices
  getInvoices(clientId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: CreateInvoiceRequest & { clientId: number }): Promise<Invoice>;
  updateInvoice(id: number, invoice: UpdateInvoiceRequest): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Clients
  async getClients(userId: string): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.userId, userId));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(insertClient: InsertClient & { userId: string }): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Customers
  async getCustomers(clientId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.clientId, clientId));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Invoices
  async getInvoices(clientId: number): Promise<Invoice[]> {
    const results = await db.query.invoices.findMany({
      where: eq(invoices.clientId, clientId),
      orderBy: [desc(invoices.date)],
      with: {
        customer: true,
        items: true,
      }
    });
    return results;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        customer: true,
        items: true,
      }
    });
    return result;
  }

  async createInvoice(data: CreateInvoiceRequest & { clientId: number }): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const { items, ...invoiceData } = data;
      
      const [newInvoice] = await tx
        .insert(invoices)
        .values(invoiceData)
        .returning();

      if (items && items.length > 0) {
        await tx.insert(invoiceItems).values(
          items.map(item => ({
            ...item,
            invoiceId: newInvoice.id
          }))
        );
      }

      // Re-fetch to return complete object
      const result = await tx.query.invoices.findFirst({
        where: eq(invoices.id, newInvoice.id),
        with: {
          items: true,
          customer: true
        }
      });
      
      return result!;
    });
  }

  async updateInvoice(id: number, data: UpdateInvoiceRequest): Promise<Invoice> {
    return await db.transaction(async (tx) => {
      const { items, ...invoiceData } = data;

      // Update invoice header
      if (Object.keys(invoiceData).length > 0) {
        await tx
          .update(invoices)
          .set(invoiceData)
          .where(eq(invoices.id, id));
      }

      // If items are provided, replace them (simplest approach for MVP)
      // Ideally we would diff them, but full replacement works for document-style editing
      if (items) {
        await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
        if (items.length > 0) {
          await tx.insert(invoiceItems).values(
            items.map(item => ({
              ...item,
              invoiceId: id
            }))
          );
        }
      }

      const result = await tx.query.invoices.findFirst({
        where: eq(invoices.id, id),
        with: {
          items: true,
          customer: true
        }
      });

      return result!;
    });
  }

  async deleteInvoice(id: number): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }
}

export const storage = new DatabaseStorage();
