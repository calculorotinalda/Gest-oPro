import { storage } from "./storage";
import { db } from "./db";
import { companies, customers, suppliers, products, invoices, invoiceItems, bankAccounts } from "@shared/schema";

export async function seedDatabase() {
  const existingCompany = await storage.getCompany();
  if (existingCompany) return;

  await storage.upsertCompany({
    name: "TechSoluções, Lda",
    nif: "510971946",
    address: "Avenida da República, 50 - 2º",
    city: "Lisboa",
    postalCode: "1050-195",
    country: "Portugal",
    phone: "+351 211 234 567",
    email: "geral@techsolucoes.pt",
    website: "www.techsolucoes.pt",
  });

  const customersData = [
    { name: "MAGONRUPE LDA", nif: "502064803", address: "CRUZ DE PAU", city: "AMORA", postalCode: "2845-545", phone: "+351 212 345 678", email: "info@magonrupe.pt" },
    { name: "Stand Pimenta do Vale", nif: "501234567", address: "Rua das Flores, 25", city: "Porto", postalCode: "4000-123", phone: "+351 222 345 678", email: "geral@pimentavale.pt" },
    { name: "ALKION TERMINAL LISBON", nif: "509876543", address: "Terminal Portuário", city: "Lisboa", postalCode: "1100-200", phone: "+351 213 456 789", email: "info@alkion.pt" },
    { name: "Oliveira Mariscos, Lda", nif: "503456789", address: "Rua do Mar, 10", city: "Sesimbra", postalCode: "2970-100", phone: "+351 212 567 890", email: "geral@oliveiramariscos.pt" },
    { name: "CARLOS JORGE HENRIQUES, LDA", nif: "504567890", address: "Zona Industrial Norte", city: "Setúbal", postalCode: "2900-300", phone: "+351 265 123 456", email: "info@cjh.pt" },
    { name: "Bolinhas Caixilharia de Alumínios, Lda", nif: "505678901", address: "Rua da Indústria, 45", city: "Almada", postalCode: "2800-150", phone: "+351 212 678 901", email: "geral@bolinhas.pt" },
    { name: "Tavares&Paulino, Lda", nif: "506789012", address: "Avenida Central, 78", city: "Barreiro", postalCode: "2830-200", phone: "+351 212 789 012", email: "info@tavpaulino.pt" },
    { name: "ZM CLORO UNIPESSOAL, LDA", nif: "507890123", address: "Parque Empresarial", city: "Palmela", postalCode: "2950-100", phone: "+351 265 234 567", email: "geral@zmcloro.pt" },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const customer = await storage.createCustomer(c);
    createdCustomers.push(customer);
  }

  const suppliersData = [
    { name: "Diginfor - Soluções Informáticas Empresariais, L.", nif: "508901234", address: "Rua Tech, 100", city: "Lisboa", postalCode: "1000-100", phone: "+351 213 901 234", email: "info@diginfor.pt" },
    { name: "Costa Simão Construções, Lda.", nif: "509012345", address: "Rua da Construção, 55", city: "Sintra", postalCode: "2710-300", phone: "+351 219 012 345", email: "geral@costasimao.pt" },
    { name: "Hernani Mesquita Gomes Unipessoal Lda", nif: "510123456", address: "Avenida do Comércio, 30", city: "Oeiras", postalCode: "2780-100", phone: "+351 214 123 456", email: "info@hmg.pt" },
    { name: "Papelaria Central, Lda", nif: "511234567", address: "Rua Augusta, 200", city: "Lisboa", postalCode: "1100-050", phone: "+351 213 234 567", email: "geral@papcentral.pt" },
    { name: "EDP Comercial", nif: "512345678", address: "Avenida 24 de Julho, 12", city: "Lisboa", postalCode: "1249-300", phone: "+351 210 012 345", email: "empresa@edp.pt" },
  ];

  for (const s of suppliersData) {
    await storage.createSupplier(s);
  }

  const productsData = [
    { code: "SERV-10", name: "Serviços de Pedreiro", unit: "un", purchasePrice: "300", salePrice: "500", vatRate: "23", stock: "0", category: "Serviços" },
    { code: "SERV-20", name: "Consultoria Informática", unit: "hora", purchasePrice: "25", salePrice: "50", vatRate: "23", stock: "0", category: "Serviços" },
    { code: "SERV-30", name: "Manutenção de Equipamentos", unit: "un", purchasePrice: "50", salePrice: "110", vatRate: "23", stock: "0", category: "Serviços" },
    { code: "MAT-01", name: "Cimento Portland 25kg", unit: "saco", purchasePrice: "4.50", salePrice: "7.50", vatRate: "23", stock: "150", category: "Materiais" },
    { code: "MAT-02", name: "Tijolo Cerâmico 30x20x15", unit: "un", purchasePrice: "0.35", salePrice: "0.65", vatRate: "23", stock: "2000", category: "Materiais" },
    { code: "MAT-03", name: "Tinta Plástica Interior 15L", unit: "balde", purchasePrice: "22", salePrice: "36.90", vatRate: "23", stock: "45", category: "Materiais" },
    { code: "EQ-01", name: "Computador Desktop i5", unit: "un", purchasePrice: "450", salePrice: "690", vatRate: "23", stock: "12", category: "Equipamentos" },
    { code: "EQ-02", name: "Monitor 27\" Full HD", unit: "un", purchasePrice: "180", salePrice: "290", vatRate: "23", stock: "8", category: "Equipamentos" },
    { code: "EQ-03", name: "Impressora Laser A4", unit: "un", purchasePrice: "120", salePrice: "213.25", vatRate: "23", stock: "5", category: "Equipamentos" },
    { code: "PAP-01", name: "Resma Papel A4 500 folhas", unit: "resma", purchasePrice: "3.20", salePrice: "5.50", vatRate: "23", stock: "200", category: "Papelaria" },
  ];

  for (const p of productsData) {
    await storage.createProduct(p);
  }

  const bankAccountsData = [
    { name: "Conta Corrente Principal", bank: "Millennium BCP", iban: "PT50 0033 0000 4531 2345 6789 5", balance: "15420.50" },
    { name: "Conta Poupança", bank: "Caixa Geral de Depósitos", iban: "PT50 0035 0000 1234 5678 9012 3", balance: "8750.00" },
    { name: "Conta Operacional", bank: "Novo Banco", iban: "PT50 0007 0000 9876 5432 1098 7", balance: "3200.75" },
  ];

  for (const b of bankAccountsData) {
    await storage.createBankAccount(b);
  }

  const invoicesData = [
    { type: "FT", customerId: createdCustomers[0].id, customerName: "MAGONRUPE LDA", customerNif: "502064803", total: "615", subtotal: "500", vatTotal: "115", date: new Date(2026, 2, 6) },
    { type: "FT", customerId: createdCustomers[1].id, customerName: "Stand Pimenta do Vale", customerNif: "501234567", total: "36.90", subtotal: "30", vatTotal: "6.90", date: new Date(2026, 2, 5) },
    { type: "FT", customerId: createdCustomers[2].id, customerName: "ALKION TERMINAL LISBON", customerNif: "509876543", total: "383.19", subtotal: "311.54", vatTotal: "71.65", date: new Date(2026, 0, 30) },
    { type: "FT", customerId: createdCustomers[3].id, customerName: "Oliveira Mariscos, Lda", customerNif: "503456789", total: "492", subtotal: "400", vatTotal: "92", date: new Date(2026, 0, 26) },
    { type: "FT", customerId: createdCustomers[4].id, customerName: "CARLOS JORGE HENRIQUES, LDA", customerNif: "504567890", total: "1230", subtotal: "1000", vatTotal: "230", date: new Date(2026, 0, 26) },
    { type: "FS", customerId: createdCustomers[5].id, customerName: "Bolinhas Caixilharia de Alumínios, Lda", customerNif: "505678901", total: "36.90", subtotal: "30", vatTotal: "6.90", date: new Date(2026, 0, 9) },
    { type: "FT", customerId: createdCustomers[6].id, customerName: "Tavares&Paulino, Lda", customerNif: "506789012", total: "84.87", subtotal: "69", vatTotal: "15.87", date: new Date(2026, 0, 7) },
    { type: "FT", customerId: createdCustomers[7].id, customerName: "ZM CLORO UNIPESSOAL, LDA", customerNif: "507890123", total: "290.28", subtotal: "236", vatTotal: "54.28", date: new Date(2026, 0, 7) },
  ];

  for (const inv of invoicesData) {
    const number = await storage.getNextInvoiceNumber(inv.type, "2026");
    await storage.createInvoice({
      ...inv,
      number,
      series: "2026",
      pending: "0",
      status: "emitida",
    });
  }

  const invoiceItemsToCreate = [
    { invoiceId: 1, productCode: "SERV-10", description: "SERVIÇOS DE PEDREIRO", quantity: "1", unitPrice: "500", vatRate: "23", discount: "0", total: "500" },
    { invoiceId: 2, productCode: "MAT-03", description: "Tinta Plástica Interior 15L", quantity: "1", unitPrice: "36.90", vatRate: "23", discount: "0", total: "30" },
    { invoiceId: 3, productCode: "SERV-20", description: "Consultoria Informática - 6h", quantity: "6", unitPrice: "51.92", vatRate: "23", discount: "0", total: "311.54" },
    { invoiceId: 4, productCode: "MAT-01", description: "Cimento Portland 25kg", quantity: "50", unitPrice: "8", vatRate: "23", discount: "0", total: "400" },
    { invoiceId: 5, productCode: "SERV-10", description: "SERVIÇOS DE PEDREIRO", quantity: "2", unitPrice: "500", vatRate: "23", discount: "0", total: "1000" },
  ];

  for (const item of invoiceItemsToCreate) {
    await storage.createInvoiceItem(item);
  }

  console.log("Database seeded successfully!");
}
