import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import {
  companies, customers, suppliers, products,
  invoices, invoiceItems, purchases, purchaseItems,
  bankAccounts, bankTransactions, receipts, emailSettings,
  type Company, type InsertCompany,
  type Customer, type InsertCustomer,
  type Supplier, type InsertSupplier,
  type Product, type InsertProduct,
  type Invoice, type InsertInvoice,
  type InvoiceItem, type InsertInvoiceItem,
  type Purchase, type InsertPurchase,
  type PurchaseItem, type InsertPurchaseItem,
  type BankAccount, type InsertBankAccount,
  type BankTransaction, type InsertBankTransaction,
  type Receipt, type InsertReceipt,
  type EmailSettings, type InsertEmailSettings,
} from "@shared/schema";

export interface IStorage {
  getCompany(): Promise<Company | undefined>;
  upsertCompany(data: InsertCompany): Promise<Company>;

  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(data: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: number): Promise<void>;

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  getInvoices(type?: string): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(data: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice>;
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(data: InsertInvoiceItem): Promise<InvoiceItem>;
  deleteInvoiceItems(invoiceId: number): Promise<void>;
  getNextInvoiceNumber(type: string, series: string): Promise<string>;

  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  createPurchase(data: InsertPurchase): Promise<Purchase>;
  updatePurchase(id: number, data: Partial<InsertPurchase>): Promise<Purchase>;
  getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]>;
  createPurchaseItem(data: InsertPurchaseItem): Promise<PurchaseItem>;
  deletePurchaseItems(purchaseId: number): Promise<void>;
  getNextPurchaseNumber(type: string): Promise<string>;

  getBankAccounts(): Promise<BankAccount[]>;
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  createBankAccount(data: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, data: Partial<InsertBankAccount>): Promise<BankAccount>;
  getBankTransactions(bankAccountId?: number): Promise<BankTransaction[]>;
  createBankTransaction(data: InsertBankTransaction): Promise<BankTransaction>;

  getReceipts(): Promise<Receipt[]>;
  createReceipt(data: InsertReceipt): Promise<Receipt>;
  getNextReceiptNumber(type: string): Promise<string>;

  getEmailSettings(): Promise<EmailSettings | undefined>;
  upsertEmailSettings(data: InsertEmailSettings): Promise<EmailSettings>;

  getDashboardStats(): Promise<{
    revenue: number;
    expenses: number;
    profit: number;
    revenueYtd: number;
    expensesYtd: number;
    profitYtd: number;
    vatEstimate: number;
    totalReceivable: number;
    totalPayable: number;
    monthlyData: { month: string; revenue: number; expenses: number; profit: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getCompany(): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).limit(1);
    return company;
  }

  async upsertCompany(data: InsertCompany): Promise<Company> {
    const existing = await this.getCompany();
    if (existing) {
      const [updated] = await db.update(companies).set(data).where(eq(companies.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(companies).values(data).returning();
    return created;
  }

  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [supplier] = await db.insert(suppliers).values(data).returning();
    return supplier;
  }

  async updateSupplier(id: number, data: Partial<InsertSupplier>): Promise<Supplier> {
    const [supplier] = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
    return supplier;
  }

  async deleteSupplier(id: number): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getInvoices(type?: string): Promise<Invoice[]> {
    if (type) {
      return db.select().from(invoices).where(eq(invoices.type, type)).orderBy(desc(invoices.date));
    }
    return db.select().from(invoices).orderBy(desc(invoices.date));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return invoice;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(data: InsertInvoiceItem): Promise<InvoiceItem> {
    const [item] = await db.insert(invoiceItems).values(data).returning();
    return item;
  }

  async deleteInvoiceItems(invoiceId: number): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async getNextInvoiceNumber(type: string, series: string): Promise<string> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(and(eq(invoices.type, type), eq(invoices.series, series)));
    const nextNum = (Number(result[0].count) || 0) + 1;
    return `${type} ${series}/${nextNum}`;
  }

  async getPurchases(): Promise<Purchase[]> {
    return db.select().from(purchases).orderBy(desc(purchases.date));
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(data: InsertPurchase): Promise<Purchase> {
    const [purchase] = await db.insert(purchases).values(data).returning();
    return purchase;
  }

  async updatePurchase(id: number, data: Partial<InsertPurchase>): Promise<Purchase> {
    const [purchase] = await db.update(purchases).set(data).where(eq(purchases.id, id)).returning();
    return purchase;
  }

  async getPurchaseItems(purchaseId: number): Promise<PurchaseItem[]> {
    return db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
  }

  async createPurchaseItem(data: InsertPurchaseItem): Promise<PurchaseItem> {
    const [item] = await db.insert(purchaseItems).values(data).returning();
    return item;
  }

  async deletePurchaseItems(purchaseId: number): Promise<void> {
    await db.delete(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId));
  }

  async getNextPurchaseNumber(type: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      VFT: "VFT", VFR: "VFR", VNC: "VNC", VND: "VND"
    };
    const prefix = prefixMap[type] || "VFT";
    const result = await db.select({ count: sql<number>`count(*)` }).from(purchases).where(eq(purchases.type, type));
    const nextNum = (Number(result[0].count) || 0) + 1;
    return `${prefix} 2026/${nextNum}`;
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    return db.select().from(bankAccounts).orderBy(bankAccounts.name);
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [account] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return account;
  }

  async createBankAccount(data: InsertBankAccount): Promise<BankAccount> {
    const [account] = await db.insert(bankAccounts).values(data).returning();
    return account;
  }

  async updateBankAccount(id: number, data: Partial<InsertBankAccount>): Promise<BankAccount> {
    const [account] = await db.update(bankAccounts).set(data).where(eq(bankAccounts.id, id)).returning();
    return account;
  }

  async getBankTransactions(bankAccountId?: number): Promise<BankTransaction[]> {
    if (bankAccountId) {
      return db.select().from(bankTransactions)
        .where(eq(bankTransactions.bankAccountId, bankAccountId))
        .orderBy(desc(bankTransactions.date));
    }
    return db.select().from(bankTransactions).orderBy(desc(bankTransactions.date));
  }

  async createBankTransaction(data: InsertBankTransaction): Promise<BankTransaction> {
    const [transaction] = await db.insert(bankTransactions).values(data).returning();
    return transaction;
  }

  async getReceipts(): Promise<Receipt[]> {
    return db.select().from(receipts).orderBy(desc(receipts.date));
  }

  async createReceipt(data: InsertReceipt): Promise<Receipt> {
    const [receipt] = await db.insert(receipts).values(data).returning();
    return receipt;
  }

  async getNextReceiptNumber(type: string): Promise<string> {
    const prefixMap: Record<string, string> = {
      RC: "RC", NP: "NP", RG: "RG"
    };
    const prefix = prefixMap[type] || "RC";
    const result = await db.select({ count: sql<number>`count(*)` }).from(receipts).where(eq(receipts.type, type));
    const nextNum = (Number(result[0].count) || 0) + 1;
    return `${prefix} 2026/${nextNum}`;
  }

  async getEmailSettings(): Promise<EmailSettings | undefined> {
    const [settings] = await db.select().from(emailSettings).limit(1);
    return settings;
  }

  async upsertEmailSettings(data: InsertEmailSettings): Promise<EmailSettings> {
    const existing = await this.getEmailSettings();
    if (existing) {
      const [updated] = await db.update(emailSettings).set(data).where(eq(emailSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(emailSettings).values(data).returning();
    return created;
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const monthlyInvoices = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`
    }).from(invoices).where(
      and(
        gte(invoices.date, startOfMonth),
        eq(invoices.status, "emitida")
      )
    );

    const ytdInvoices = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`
    }).from(invoices).where(
      and(
        gte(invoices.date, startOfYear),
        eq(invoices.status, "emitida")
      )
    );

    const monthlyPurchases = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`
    }).from(purchases).where(gte(purchases.date, startOfMonth));

    const ytdPurchases = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`
    }).from(purchases).where(gte(purchases.date, startOfYear));

    const vatInvoices = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(vat_total AS NUMERIC)), 0)`
    }).from(invoices).where(
      and(gte(invoices.date, startOfYear), eq(invoices.status, "emitida"))
    );

    const vatPurchases = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(vat_total AS NUMERIC)), 0)`
    }).from(purchases).where(gte(purchases.date, startOfYear));

    const receivable = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(pending AS NUMERIC)), 0)`
    }).from(invoices).where(eq(invoices.status, "emitida"));

    const payable = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(pending AS NUMERIC)), 0)`
    }).from(purchases).where(eq(purchases.status, "registada"));

    const monthlyDataRaw = await db.select({
      monthNum: sql<number>`EXTRACT(MONTH FROM date)`,
      total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`
    }).from(invoices)
      .where(and(gte(invoices.date, startOfYear), eq(invoices.status, "emitida")))
      .groupBy(sql`EXTRACT(MONTH FROM date)`)
      .orderBy(sql`EXTRACT(MONTH FROM date)`);

    const monthlyExpensesRaw = await db.select({
      monthNum: sql<number>`EXTRACT(MONTH FROM date)`,
      total: sql<string>`COALESCE(SUM(CAST(total AS NUMERIC)), 0)`
    }).from(purchases)
      .where(gte(purchases.date, startOfYear))
      .groupBy(sql`EXTRACT(MONTH FROM date)`)
      .orderBy(sql`EXTRACT(MONTH FROM date)`);

    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyData = months.slice(0, now.getMonth() + 1).map((month, idx) => {
      const monthNum = idx + 1;
      const rev = monthlyDataRaw.find(r => Number(r.monthNum) === monthNum);
      const exp = monthlyExpensesRaw.find(r => Number(r.monthNum) === monthNum);
      const revenue = Number(rev?.total || 0);
      const expenses = Number(exp?.total || 0);
      return { month, revenue, expenses, profit: revenue - expenses };
    });

    const revenue = Number(monthlyInvoices[0]?.total || 0);
    const expenses = Number(monthlyPurchases[0]?.total || 0);

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      revenueYtd: Number(ytdInvoices[0]?.total || 0),
      expensesYtd: Number(ytdPurchases[0]?.total || 0),
      profitYtd: Number(ytdInvoices[0]?.total || 0) - Number(ytdPurchases[0]?.total || 0),
      vatEstimate: Number(vatInvoices[0]?.total || 0) - Number(vatPurchases[0]?.total || 0),
      totalReceivable: Number(receivable[0]?.total || 0),
      totalPayable: Number(payable[0]?.total || 0),
      monthlyData,
    };
  }
}

export const storage = new DatabaseStorage();
