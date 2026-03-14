import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nif: text("nif").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Portugal"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logo: text("logo"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nif: text("nif").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Portugal"),
  phone: text("phone"),
  email: text("email"),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nif: text("nif").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country").default("Portugal"),
  phone: text("phone"),
  email: text("email"),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").default("un"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).default("0"),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).default("0"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("23"),
  vatExemptionReason: text("vat_exemption_reason"),
  stock: decimal("stock", { precision: 12, scale: 2 }).default("0"),
  minStock: decimal("min_stock", { precision: 12, scale: 2 }).default("0"),
  category: text("category"),
  active: boolean("active").default(true),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // FT, FS, FR, NC, ND
  number: text("number").notNull(),
  series: text("series").default("2026"),
  date: timestamp("date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  customerNif: text("customer_nif"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  vatTotal: decimal("vat_total", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  pending: decimal("pending", { precision: 12, scale: 2 }).default("0"),
  status: text("status").default("emitida"), // emitida, paga, anulada
  notes: text("notes"),
  hash: text("hash"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  productCode: text("product_code"),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("23"),
  vatExemptionReason: text("vat_exemption_reason"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("VFT"),
  number: text("number").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  supplierName: text("supplier_name"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0"),
  vatTotal: decimal("vat_total", { precision: 12, scale: 2 }).default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0"),
  pending: decimal("pending", { precision: 12, scale: 2 }).default("0"),
  status: text("status").default("registada"),
  notes: text("notes"),
});

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  productCode: text("product_code"),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("23"),
  vatExemptionReason: text("vat_exemption_reason"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bank: text("bank").notNull(),
  iban: text("iban"),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  active: boolean("active").default(true),
});

export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  description: text("description").notNull(),
  type: text("type").notNull(), // credit, debit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reference: text("reference"),
  notes: text("notes"),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  purchaseId: integer("purchase_id").references(() => purchases.id),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("RC"),
  number: text("number").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  supplierName: text("supplier_name"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  purchaseId: integer("purchase_id").references(() => purchases.id),
  bankAccountId: integer("bank_account_id").references(() => bankAccounts.id),
  paymentMethod: text("payment_method").default("transferencia"),
  notes: text("notes"),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertPurchaseSchema = createInsertSchema(purchases).omit({ id: true });
export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({ id: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true });
export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({ id: true });
export const insertReceiptSchema = createInsertSchema(receipts).omit({ id: true });

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  smtpHost: text("smtp_host").default(""),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: text("smtp_user").default(""),
  smtpPass: text("smtp_pass").default(""),
  smtpFrom: text("smtp_from").default(""),
  smtpSecure: boolean("smtp_secure").default(false),
  enabled: boolean("enabled").default(false),
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({ id: true });
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
