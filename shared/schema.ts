import { pgTable, text, serial, integer, boolean, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id), // The CA who owns this client
  name: text("name").notNull(), // Trade/Legal Name
  gstin: text("gstin").notNull(),
  address: text("address").notNull(),
  invoicePrefix: text("invoice_prefix").default("INV-"),
  bankDetails: text("bank_details"), // Simple text for MVP
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  gstin: text("gstin"), // Optional for B2C
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  number: text("number").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date"),
  placeOfSupply: text("place_of_supply"),
  status: text("status", { enum: ["draft", "sent", "paid", "cancelled"] }).default("draft"),
  subtotal: numeric("subtotal").notNull(), // Storing as numeric for simplicity in this MVP, ideally integer minor units
  taxTotal: numeric("tax_total").notNull(),
  total: numeric("total").notNull(),
  isB2C: boolean("is_b2c").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  hsn: text("hsn"),
  quantity: numeric("quantity").notNull(),
  rate: numeric("rate").notNull(),
  amount: numeric("amount").notNull(), // quantity * rate
  gstRate: numeric("gst_rate").notNull(), // e.g. 5, 12, 18, 28
  igst: numeric("igst").default("0"),
  cgst: numeric("cgst").default("0"),
  sgst: numeric("sgst").default("0"),
});

// === RELATIONS ===

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  customers: many(customers),
  invoices: many(invoices),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  client: one(clients, {
    fields: [customers.clientId],
    references: [clients.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, userId: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, invoiceId: true });

// === EXPLICIT API CONTRACT TYPES ===

// Clients
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type CreateClientRequest = InsertClient;
export type UpdateClientRequest = Partial<InsertClient>;

// Customers
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type CreateCustomerRequest = InsertCustomer;
export type UpdateCustomerRequest = Partial<InsertCustomer>;

// Invoices (Complex type including items)
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Invoice = typeof invoices.$inferSelect & {
  items?: InvoiceItem[];
  customer?: Customer;
};

// Request schema for creating an invoice with items
export const createInvoiceSchema = insertInvoiceSchema.extend({
  items: z.array(insertInvoiceItemSchema)
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceRequest = Partial<CreateInvoiceRequest>;

// List responses
export type ClientListResponse = Client[];
export type CustomerListResponse = Customer[];
export type InvoiceListResponse = Invoice[];
