import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { companies, insertCustomerSchema, insertSupplierSchema, insertProductSchema, insertInvoiceSchema, insertInvoiceItemSchema, insertPurchaseSchema, insertPurchaseItemSchema, insertBankAccountSchema, insertBankTransactionSchema, insertReceiptSchema, insertCompanySchema, insertEmailSettingsSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

function toDate(val: unknown, fallback = new Date()): Date {
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/company", async (_req, res) => {
    const company = await storage.getCompany();
    res.json(company || null);
  });

  app.post("/api/company", async (req, res) => {
    const { logo, ...rest } = req.body;
    const data = insertCompanySchema.parse(rest);
    const company = await storage.upsertCompany(data);
    res.json(company);
  });

  app.post("/api/company/logo", async (req, res) => {
    const { logo } = req.body;
    if (typeof logo !== "string") return res.status(400).json({ message: "Logo inválido" });
    if (logo.length > 5 * 1024 * 1024) return res.status(400).json({ message: "Logo demasiado grande (máx. 5MB)" });
    const existing = await storage.getCompany();
    if (!existing) return res.status(404).json({ message: "Empresa não configurada. Guarde os dados da empresa primeiro." });
    const [updated] = await db.update(companies).set({ logo }).where(eq(companies.id, existing.id)).returning();
    res.json({ ok: true, logo: updated.logo });
  });

  app.delete("/api/company/logo", async (_req, res) => {
    const existing = await storage.getCompany();
    if (!existing) return res.status(404).json({ message: "Empresa não configurada" });
    await db.update(companies).set({ logo: null }).where(eq(companies.id, existing.id));
    res.json({ ok: true });
  });

  app.get("/api/customers", async (_req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });

  app.get("/api/customers/:id", async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Cliente não encontrado" });
    res.json(customer);
  });

  app.post("/api/customers", async (req, res) => {
    const data = insertCustomerSchema.parse(req.body);
    const customer = await storage.createCustomer(data);
    res.json(customer);
  });

  app.patch("/api/customers/:id", async (req, res) => {
    const customer = await storage.updateCustomer(Number(req.params.id), req.body);
    res.json(customer);
  });

  app.delete("/api/customers/:id", async (req, res) => {
    await storage.deleteCustomer(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/suppliers", async (_req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    const supplier = await storage.getSupplier(Number(req.params.id));
    if (!supplier) return res.status(404).json({ message: "Fornecedor não encontrado" });
    res.json(supplier);
  });

  app.post("/api/suppliers", async (req, res) => {
    const data = insertSupplierSchema.parse(req.body);
    const supplier = await storage.createSupplier(data);
    res.json(supplier);
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    const supplier = await storage.updateSupplier(Number(req.params.id), req.body);
    res.json(supplier);
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    await storage.deleteSupplier(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Produto não encontrado" });
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    const data = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(data);
    res.json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/invoices", async (req, res) => {
    const type = req.query.type as string | undefined;
    const invoices = await storage.getInvoices(type);
    res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Documento não encontrado" });
    const items = await storage.getInvoiceItems(invoice.id);
    res.json({ ...invoice, items });
  });

  app.post("/api/invoices", async (req, res) => {
    const { items, ...invoiceData } = req.body;
    invoiceData.date = toDate(invoiceData.date);
    if (invoiceData.dueDate) invoiceData.dueDate = toDate(invoiceData.dueDate);
    const number = await storage.getNextInvoiceNumber(invoiceData.type, invoiceData.series || "2026");

    const isCreditNote = invoiceData.type === "NC";
    const isReceiptInvoice = invoiceData.type === "FR";

    const pending = isReceiptInvoice ? "0" : invoiceData.total;
    const status = isReceiptInvoice ? "paga" : "emitida";

    const invoice = await storage.createInvoice({ ...invoiceData, number, pending, status });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await storage.createInvoiceItem({ ...item, invoiceId: invoice.id });
      }
      if (invoiceData.type === "FT" || invoiceData.type === "FS" || invoiceData.type === "FR") {
        for (const item of items) {
          if (item.productId) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Number(product.stock) - Number(item.quantity);
              await storage.updateProduct(item.productId, { stock: String(newStock) });
            }
          }
        }
      }
      if (isCreditNote) {
        for (const item of items) {
          if (item.productId) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Number(product.stock) + Number(item.quantity);
              await storage.updateProduct(item.productId, { stock: String(newStock) });
            }
          }
        }
      }
    }

    const customer = invoice.customerId ? await storage.getCustomer(invoice.customerId) : null;
    if (customer) {
      const balanceChange = isCreditNote
        ? -Number(invoice.total)
        : Number(invoice.total);
      const newBalance = Number(customer.balance) + balanceChange;
      await storage.updateCustomer(customer.id, { balance: String(newBalance) });
    }

    res.json(invoice);
  });

  app.patch("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.updateInvoice(Number(req.params.id), req.body);
    res.json(invoice);
  });

  app.get("/api/invoices/:id/items", async (req, res) => {
    const items = await storage.getInvoiceItems(Number(req.params.id));
    res.json(items);
  });

  app.get("/api/purchases", async (_req, res) => {
    const purchases = await storage.getPurchases();
    res.json(purchases);
  });

  app.get("/api/purchases/:id", async (req, res) => {
    const purchase = await storage.getPurchase(Number(req.params.id));
    if (!purchase) return res.status(404).json({ message: "Compra não encontrada" });
    const items = await storage.getPurchaseItems(purchase.id);
    res.json({ ...purchase, items });
  });

  app.post("/api/purchases", async (req, res) => {
    const { items, ...purchaseData } = req.body;
    purchaseData.date = toDate(purchaseData.date);
    if (purchaseData.dueDate) purchaseData.dueDate = toDate(purchaseData.dueDate);
    const purchaseType = purchaseData.type || "VFT";
    const number = await storage.getNextPurchaseNumber(purchaseType);

    const isCreditNote = purchaseType === "VNC";
    const isReceiptPurchase = purchaseType === "VFR";

    const pending = isReceiptPurchase ? "0" : purchaseData.total;
    const status = isReceiptPurchase ? "paga" : "registada";

    const purchase = await storage.createPurchase({ ...purchaseData, type: purchaseType, number, pending, status });

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await storage.createPurchaseItem({ ...item, purchaseId: purchase.id });
      }
      if (purchaseType === "VFT" || purchaseType === "VFR") {
        for (const item of items) {
          if (item.productId) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Number(product.stock) + Number(item.quantity);
              await storage.updateProduct(item.productId, { stock: String(newStock) });
            }
          }
        }
      }
      if (isCreditNote) {
        for (const item of items) {
          if (item.productId) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const newStock = Number(product.stock) - Number(item.quantity);
              await storage.updateProduct(item.productId, { stock: String(newStock) });
            }
          }
        }
      }
    }

    const supplier = purchase.supplierId ? await storage.getSupplier(purchase.supplierId) : null;
    if (supplier) {
      let balanceChange = 0;
      if (isCreditNote) {
        balanceChange = -Number(purchase.total);
      } else if (isReceiptPurchase) {
        balanceChange = 0;
      } else {
        balanceChange = Number(purchase.total);
      }
      if (balanceChange !== 0) {
        const newBalance = Number(supplier.balance) + balanceChange;
        await storage.updateSupplier(supplier.id, { balance: String(newBalance) });
      }
    }

    res.json(purchase);
  });

  app.get("/api/bank-accounts", async (_req, res) => {
    const accounts = await storage.getBankAccounts();
    res.json(accounts);
  });

  app.get("/api/bank-accounts/:id", async (req, res) => {
    const account = await storage.getBankAccount(Number(req.params.id));
    if (!account) return res.status(404).json({ message: "Conta não encontrada" });
    res.json(account);
  });

  app.post("/api/bank-accounts", async (req, res) => {
    const data = insertBankAccountSchema.parse(req.body);
    const account = await storage.createBankAccount(data);
    res.json(account);
  });

  app.patch("/api/bank-accounts/:id", async (req, res) => {
    const account = await storage.updateBankAccount(Number(req.params.id), req.body);
    res.json(account);
  });

  app.get("/api/bank-transactions", async (req, res) => {
    const bankAccountId = req.query.bankAccountId ? Number(req.query.bankAccountId) : undefined;
    const transactions = await storage.getBankTransactions(bankAccountId);
    res.json(transactions);
  });

  app.post("/api/bank-transactions", async (req, res) => {
    const body = { ...req.body };
    body.date = toDate(body.date);
    const data = insertBankTransactionSchema.parse(body);
    const transaction = await storage.createBankTransaction(data);

    const account = await storage.getBankAccount(data.bankAccountId);
    if (account) {
      const amount = Number(data.amount);
      const newBalance = data.type === "credit"
        ? Number(account.balance) + amount
        : Number(account.balance) - amount;
      await storage.updateBankAccount(account.id, { balance: String(newBalance) });
    }

    res.json(transaction);
  });

  app.get("/api/receipts", async (_req, res) => {
    const receipts = await storage.getReceipts();
    res.json(receipts);
  });

  app.post("/api/receipts", async (req, res) => {
    const receiptType = req.body.type || "RC";
    const receiptAmount = Number(req.body.amount);

    if (!receiptAmount || receiptAmount <= 0) {
      return res.status(400).json({ message: "O montante deve ser superior a zero" });
    }

    if (req.body.invoiceId) {
      const invoice = await storage.getInvoice(req.body.invoiceId);
      if (invoice && receiptAmount > Number(invoice.pending)) {
        return res.status(400).json({ message: `O montante excede o valor pendente da fatura (${invoice.pending} €)` });
      }
    }

    if (req.body.purchaseId) {
      const purchase = await storage.getPurchase(req.body.purchaseId);
      if (purchase && receiptAmount > Number(purchase.pending)) {
        return res.status(400).json({ message: `O montante excede o valor pendente da compra (${purchase.pending} €)` });
      }
    }

    const number = await storage.getNextReceiptNumber(receiptType);
    const receiptData = { ...req.body, type: receiptType, number };
    receiptData.date = toDate(receiptData.date);
    const receipt = await storage.createReceipt(receiptData);

    const typeLabels: Record<string, string> = { RC: "Recibo", NP: "Nota de Pagamento", RG: "Regularização" };
    const label = typeLabels[receiptType] || "Recibo";

    if (receiptType === "RC" || receiptType === "RG") {
      if (req.body.invoiceId) {
        const invoice = await storage.getInvoice(req.body.invoiceId);
        if (invoice) {
          const appliedAmount = Math.min(receiptAmount, Number(invoice.pending));
          const newPending = Number(invoice.pending) - appliedAmount;
          await storage.updateInvoice(invoice.id, {
            pending: String(Math.max(0, newPending)),
            status: newPending <= 0 ? "paga" : "emitida",
          });
        }
      }

      if (req.body.customerId) {
        const customer = await storage.getCustomer(req.body.customerId);
        if (customer) {
          const newBalance = Number(customer.balance) - receiptAmount;
          await storage.updateCustomer(customer.id, { balance: String(newBalance) });
        }
      }
    }

    if (receiptType === "NP" || receiptType === "RG") {
      if (req.body.purchaseId) {
        const purchase = await storage.getPurchase(req.body.purchaseId);
        if (purchase) {
          const appliedAmount = Math.min(receiptAmount, Number(purchase.pending));
          const newPending = Number(purchase.pending) - appliedAmount;
          await storage.updatePurchase(purchase.id, {
            pending: String(Math.max(0, newPending)),
            status: newPending <= 0 ? "paga" : "registada",
          });
        }
      }

      if (req.body.supplierId) {
        const supplier = await storage.getSupplier(req.body.supplierId);
        if (supplier) {
          const newBalance = Number(supplier.balance) - receiptAmount;
          await storage.updateSupplier(supplier.id, { balance: String(newBalance) });
        }
      }
    }

    if (req.body.bankAccountId) {
      const isOutgoing = receiptType === "NP" || (receiptType === "RG" && req.body.supplierId && !req.body.customerId);
      await storage.createBankTransaction({
        bankAccountId: req.body.bankAccountId,
        date: new Date(),
        description: `${label} ${number}`,
        type: isOutgoing ? "debit" : "credit",
        amount: req.body.amount,
        reference: number,
        invoiceId: req.body.invoiceId || null,
        purchaseId: req.body.purchaseId || null,
      });

      const account = await storage.getBankAccount(req.body.bankAccountId);
      if (account) {
        const amt = Number(req.body.amount);
        const newBalance = isOutgoing
          ? Number(account.balance) - amt
          : Number(account.balance) + amt;
        await storage.updateBankAccount(account.id, { balance: String(newBalance) });
      }
    }

    res.json(receipt);
  });

  app.get("/api/dashboard", async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.get("/api/email-settings", async (_req, res) => {
    const settings = await storage.getEmailSettings();
    if (!settings) {
      return res.json({ smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "", smtpFrom: "", smtpSecure: false, enabled: false });
    }
    const { smtpPass: _pass, ...safeSettings } = settings;
    res.json({ ...safeSettings, smtpPassSet: !!_pass });
  });

  app.post("/api/email-settings", async (req, res) => {
    try {
      const data = insertEmailSettingsSchema.parse(req.body);
      const existing = await storage.getEmailSettings();
      if (!req.body.smtpPass && existing?.smtpPass) {
        data.smtpPass = existing.smtpPass;
      }
      const settings = await storage.upsertEmailSettings(data);
      const { smtpPass: _pass, ...safeSettings } = settings;
      res.json({ ...safeSettings, smtpPassSet: !!_pass });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/email/send", async (req, res) => {
    try {
      const { to, subject, body, cc } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ message: "Campos obrigatórios: to, subject, body" });
      }

      const settings = await storage.getEmailSettings();
      if (!settings?.enabled || !settings?.smtpHost || !settings?.smtpUser) {
        return res.status(503).json({ message: "Email não configurado. Configure o servidor SMTP em Configurações." });
      }

      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure || false,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPass || "",
        },
      });

      const company = await storage.getCompany();
      const fromName = company?.name || "Sales-Rotina";
      const fromAddress = settings.smtpFrom || settings.smtpUser;

      await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        cc: cc || undefined,
        subject,
        html: body,
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: `Erro ao enviar email: ${err.message}` });
    }
  });

  app.get("/api/saft/sales", async (req, res) => {
    const invoicesList = await storage.getInvoices();
    const company = await storage.getCompany();
    const customersList = await storage.getCustomers();

    const allItems: any[] = [];
    for (const inv of invoicesList) {
      const items = await storage.getInvoiceItems(inv.id);
      allItems.push({ invoice: inv, items });
    }

    const xml = generateSaftSales(company, customersList, allItems);
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=saft-vendas.xml");
    res.send(xml);
  });

  app.get("/api/saft/inventory", async (_req, res) => {
    const company = await storage.getCompany();
    const productsList = await storage.getProducts();

    const xml = generateSaftInventory(company, productsList);
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=saft-inventario.xml");
    res.send(xml);
  });

  return httpServer;
}

function escXml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSaftSales(company: any, customers: any[], invoiceData: any[]): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const totalCredit = invoiceData
    .filter((d: any) => d.invoice.type !== "NC")
    .reduce((sum: number, d: any) => sum + Number(d.invoice.total), 0);
  const totalDebit = invoiceData
    .filter((d: any) => d.invoice.type === "NC")
    .reduce((sum: number, d: any) => sum + Number(d.invoice.total), 0);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.04_01</AuditFileVersion>
    <CompanyID>${escXml(company?.nif) || "000000000"}</CompanyID>
    <TaxRegistrationNumber>${escXml(company?.nif) || "000000000"}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${escXml(company?.name) || "Empresa"}</CompanyName>
    <CompanyAddress>
      <AddressDetail>${escXml(company?.address)}</AddressDetail>
      <City>${escXml(company?.city)}</City>
      <PostalCode>${escXml(company?.postalCode)}</PostalCode>
      <Country>PT</Country>
    </CompanyAddress>
    <FiscalYear>${now.getFullYear()}</FiscalYear>
    <StartDate>${now.getFullYear()}-01-01</StartDate>
    <EndDate>${now.getFullYear()}-12-31</EndDate>
    <CurrencyCode>EUR</CurrencyCode>
    <DateCreated>${dateStr}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyTaxID>000000000</ProductCompanyTaxID>
    <SoftwareCertificateNumber>0</SoftwareCertificateNumber>
    <ProductID>SalesRotina/1.0</ProductID>
    <ProductVersion>1.0</ProductVersion>
  </Header>
  <MasterFiles>`;

  for (const c of customers) {
    xml += `
    <Customer>
      <CustomerID>${c.id}</CustomerID>
      <AccountID>Desconhecido</AccountID>
      <CustomerTaxID>${escXml(c.nif)}</CustomerTaxID>
      <CompanyName>${escXml(c.name)}</CompanyName>
      <BillingAddress>
        <AddressDetail>${escXml(c.address) || "Desconhecido"}</AddressDetail>
        <City>${escXml(c.city) || "Desconhecido"}</City>
        <PostalCode>${escXml(c.postalCode) || "0000-000"}</PostalCode>
        <Country>${escXml(c.country) || "PT"}</Country>
      </BillingAddress>
      <SelfBillingIndicator>0</SelfBillingIndicator>
    </Customer>`;
  }

  xml += `
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${invoiceData.length}</NumberOfEntries>
      <TotalDebit>${totalDebit.toFixed(2)}</TotalDebit>
      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>`;

  for (const { invoice, items } of invoiceData) {
    const invoiceDate = new Date(invoice.date);
    const isoDate = invoiceDate.toISOString().split("T")[0];
    const isCredit = invoice.type !== "NC";
    xml += `
      <Invoice>
        <InvoiceNo>${escXml(invoice.number)}</InvoiceNo>
        <InvoiceStatus>
          <InvoiceStatus>${invoice.status === "anulada" ? "A" : "N"}</InvoiceStatus>
          <InvoiceStatusDate>${isoDate}T00:00:00</InvoiceStatusDate>
          <SourceID>Utilizador</SourceID>
          <SourceBilling>P</SourceBilling>
        </InvoiceStatus>
        <Hash>${escXml(invoice.hash) || "0"}</Hash>
        <HashControl>1</HashControl>
        <InvoiceDate>${isoDate}</InvoiceDate>
        <InvoiceType>${escXml(invoice.type)}</InvoiceType>
        <SpecialRegimes>
          <SelfBillingIndicator>0</SelfBillingIndicator>
          <CashVATSchemeIndicator>0</CashVATSchemeIndicator>
          <ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator>
        </SpecialRegimes>
        <SourceID>Utilizador</SourceID>
        <SystemEntryDate>${isoDate}T00:00:00</SystemEntryDate>
        <CustomerID>${invoice.customerId || "0"}</CustomerID>
        <DocumentTotals>
          <TaxPayable>${Number(invoice.vatTotal).toFixed(2)}</TaxPayable>
          <NetTotal>${Number(invoice.subtotal).toFixed(2)}</NetTotal>
          <GrossTotal>${Number(invoice.total).toFixed(2)}</GrossTotal>
        </DocumentTotals>`;

    items.forEach((item: any, idx: number) => {
      xml += `
        <Line>
          <LineNumber>${idx + 1}</LineNumber>
          <ProductCode>${escXml(item.productCode)}</ProductCode>
          <ProductDescription>${escXml(item.description)}</ProductDescription>
          <Quantity>${Number(item.quantity).toFixed(2)}</Quantity>
          <UnitOfMeasure>un</UnitOfMeasure>
          <UnitPrice>${Number(item.unitPrice).toFixed(2)}</UnitPrice>
          ${isCredit ? `<CreditAmount>${Number(item.total).toFixed(2)}</CreditAmount>` : `<DebitAmount>${Number(item.total).toFixed(2)}</DebitAmount>`}
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>PT</TaxCountryRegion>
            <TaxCode>NOR</TaxCode>
            <TaxPercentage>${Number(item.vatRate).toFixed(2)}</TaxPercentage>
          </Tax>
        </Line>`;
    });

    xml += `
      </Invoice>`;
  }

  xml += `
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;

  return xml;
}

function generateSaftInventory(company: any, products: any[]): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<StockFile xmlns="urn:StockFile:PT_1.01_01">
  <StockHeader>
    <FileVersion>1.01_01</FileVersion>
    <TaxRegistrationNumber>${escXml(company?.nif) || "000000000"}</TaxRegistrationNumber>
    <FiscalYear>${now.getFullYear()}</FiscalYear>
    <EndDate>${dateStr}</EndDate>
    <NoStock>false</NoStock>
  </StockHeader>`;

  for (const p of products) {
    xml += `
  <Stock>
    <ProductCategory>M</ProductCategory>
    <ProductCode>${escXml(p.code)}</ProductCode>
    <ProductDescription>${escXml(p.name)}</ProductDescription>
    <ProductNumberCode>${escXml(p.code)}</ProductNumberCode>
    <ClosingStockQuantity>${Number(p.stock).toFixed(2)}</ClosingStockQuantity>
    <UnitOfMeasure>${escXml(p.unit) || "un"}</UnitOfMeasure>
    <ClosingStockValue>${(Number(p.stock) * Number(p.purchasePrice)).toFixed(2)}</ClosingStockValue>
  </Stock>`;
  }

  xml += `
</StockFile>`;

  return xml;
}
