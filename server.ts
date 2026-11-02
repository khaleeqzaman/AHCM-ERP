import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import {
  dbGetUsers,
  dbSaveUser,
  dbDeleteUser,
  dbGetDemands,
  dbSaveDemand,
  dbDeleteDemand,
  dbGetPurchases,
  dbSavePurchase,
  dbDeletePurchase,
  dbGetChartAccounts,
  dbSaveChartAccount,
  dbGetVouchers,
  dbSaveVoucher,
  dbGetCashBookEntries,
  dbSaveCashBookEntry,
  dbDeleteCashBookEntry,
  dbGetCreditBookEntries,
  dbSaveCreditBookEntry,
  dbDeleteCreditBookEntry,
  dbGetBanks,
  dbSaveBank,
  dbDeleteBank,
  dbGetBankAccounts,
  dbSaveBankAccount,
  dbDeleteBankAccount,
  dbGetPosCoalSales,
  dbSavePosCoalSale,
  dbDeletePosCoalSale,
  dbGetCoalSellRecords,
  dbSaveCoalSellRecord,
  dbDeleteCoalSellRecord,
  dbGetBuyers,
  dbSaveBuyer,
  dbDeleteBuyer,
  dbGetPartners,
  dbSavePartner,
  dbDeletePartner,
  dbGetStockItems,
  dbSaveStockItem,
  dbGetStockEntries,
  dbSaveStockEntry,
  dbDeleteStockEntry,
  dbGetVehicles,
  dbSaveVehicle,
  dbDeleteVehicle,
  dbGetVehicleConsumptions,
  dbSaveVehicleConsumption,
  dbDeleteVehicleConsumption,
  dbGetCompanySettings,
  dbSaveCompanySettings,
  dbGetVehicleConsumptionSummary,
  dbGetItemWiseStockSummary,
} from './src/db/queries.ts';
import { testDatabaseConnection, pool } from './src/db/index.ts';
import { autoMigrateAndSeed } from './src/db/autoMigrate.ts';

import { initialUsers } from './src/data/mockUsers.ts';
import { initialDemands, initialPurchases } from './src/data/mockData.ts';
import { initialChartOfAccounts, initialVouchers } from './src/data/mockAccountingData.ts';
import {
  initialCashBookEntries,
  initialBanks,
  initialBankAccounts,
  initialCreditBookEntries,
} from './src/data/mockTreasuryData.ts';
import {
  initialCompanySettings,
  initialBuyers,
  initialPartners,
  initialPosEntries,
  initialCoalSellRecords,
  initialStockItems,
  initialStockEntries,
  initialVehicles,
  initialVehicleConsumptions,
} from './src/data/mockStoreSalesData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper for error responses
  const handleError = (res: Response, err: unknown, message: string) => {
    console.error(message, err);
    const innerErr = (err as any)?.cause?.cause || (err as any)?.cause || err;
    const details = innerErr?.message || innerErr?.detail || String(innerErr);
    res.status(500).json({ error: message, details: String(details) });
  };

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Supabase / Database Status check
  app.get('/api/database/status', async (_req: Request, res: Response) => {
    const status = await testDatabaseConnection();
    res.json({
      ...status,
      timestamp: new Date().toISOString(),
      provider: process.env.DATABASE_URL?.includes('supabase') ? 'supabase' : 'postgres',
    });
  });

  // Seed and ensure database tables if empty or explicitly called
  const seedIfEmpty = async () => {
    try {
      await autoMigrateAndSeed();
    } catch (err) {
      console.warn('Auto-seed / migration skipped or encountered error:', err);
    }
  };

  // Explicit seed endpoint
  app.post('/api/seed', async (_req: Request, res: Response) => {
    try {
      await autoMigrateAndSeed();
      res.json({ success: true, message: 'Database ready' });
    } catch (err) {
      handleError(res, err, 'Failed to seed database');
    }
  });

  // Bootstrap endpoint: Fetch entire app data in one efficient call
  app.get('/api/bootstrap', async (_req: Request, res: Response) => {
    try {
      await seedIfEmpty();

      const [
        users,
        demands,
        purchases,
        accounts,
        vouchers,
        cashBookEntries,
        creditBookEntries,
        banks,
        bankAccounts,
        companySettings,
        buyers,
        partners,
        posEntries,
        coalSellRecords,
        stockItems,
        stockEntries,
        vehicles,
        vehicleConsumptions,
        vehicleConsumptionSummary,
        itemWiseStockSummary,
      ] = await Promise.all([
        dbGetUsers().catch(() => initialUsers),
        dbGetDemands().catch(() => []),
        dbGetPurchases().catch(() => []),
        dbGetChartAccounts().catch(() => initialChartOfAccounts),
        dbGetVouchers().catch(() => []),
        dbGetCashBookEntries().catch(() => []),
        dbGetCreditBookEntries().catch(() => []),
        dbGetBanks().catch(() => []),
        dbGetBankAccounts().catch(() => []),
        dbGetCompanySettings().catch(() => initialCompanySettings),
        dbGetBuyers().catch(() => []),
        dbGetPartners().catch(() => []),
        dbGetPosCoalSales().catch(() => []),
        dbGetCoalSellRecords().catch(() => []),
        dbGetStockItems().catch(() => []),
        dbGetStockEntries().catch(() => []),
        dbGetVehicles().catch(() => []),
        dbGetVehicleConsumptions().catch(() => []),
        dbGetVehicleConsumptionSummary().catch(() => []),
        dbGetItemWiseStockSummary().catch(() => []),
      ]);

      res.json({
        users: users.length ? users : initialUsers,
        demands: demands || [],
        purchases: purchases || [],
        accounts: accounts.length ? accounts : initialChartOfAccounts,
        vouchers: vouchers || [],
        cashBookEntries: cashBookEntries || [],
        creditBookEntries: creditBookEntries || [],
        banks: banks || [],
        bankAccounts: bankAccounts || [],
        companySettings: companySettings || initialCompanySettings,
        buyers: buyers || [],
        partners: partners || [],
        posEntries: posEntries || [],
        coalSellRecords: coalSellRecords || [],
        stockItems: stockItems || [],
        stockEntries: stockEntries || [],
        vehicles: vehicles || [],
        vehicleConsumptions: vehicleConsumptions || [],
        vehicleConsumptionSummary,
        itemWiseStockSummary,
      });
    } catch (err) {
      handleError(res, err, 'Failed to bootstrap application state');
    }
  });

  // ---- Executive Report Summaries ----
  app.get('/api/reports/vehicle-consumption-summary', async (_req: Request, res: Response) => {
    try {
      const summary = await dbGetVehicleConsumptionSummary();
      res.json(summary);
    } catch (err) {
      handleError(res, err, 'Failed to fetch vehicle consumption summary');
    }
  });

  app.get('/api/reports/item-wise-stock-summary', async (_req: Request, res: Response) => {
    try {
      const summary = await dbGetItemWiseStockSummary();
      res.json(summary);
    } catch (err) {
      handleError(res, err, 'Failed to fetch item-wise stock summary');
    }
  });

  // ---- Users ----
  app.get('/api/users', async (_req: Request, res: Response) => {
    try {
      const users = await dbGetUsers();
      res.json(users);
    } catch (err) {
      handleError(res, err, 'Failed to fetch users');
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveUser(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save user');
    }
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteUser(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete user');
    }
  });

  // ---- Demands ----
  app.get('/api/demands', async (_req: Request, res: Response) => {
    try {
      const items = await dbGetDemands();
      res.json(items);
    } catch (err) {
      handleError(res, err, 'Failed to fetch demands');
    }
  });

  app.post('/api/demands', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveDemand(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save demand');
    }
  });

  app.delete('/api/demands/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteDemand(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete demand');
    }
  });

  // ---- Purchases ----
  app.get('/api/purchases', async (_req: Request, res: Response) => {
    try {
      const items = await dbGetPurchases();
      res.json(items);
    } catch (err) {
      handleError(res, err, 'Failed to fetch purchases');
    }
  });

  app.post('/api/purchases', async (req: Request, res: Response) => {
    try {
      const saved = await dbSavePurchase(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save purchase');
    }
  });

  app.delete('/api/purchases/:id', async (req: Request, res: Response) => {
    try {
      await dbDeletePurchase(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete purchase');
    }
  });

  // ---- Accounting ----
  app.get('/api/accounting/accounts', async (_req: Request, res: Response) => {
    try {
      const accounts = await dbGetChartAccounts();
      res.json(accounts);
    } catch (err) {
      handleError(res, err, 'Failed to fetch chart accounts');
    }
  });

  app.post('/api/accounting/accounts', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveChartAccount(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save chart account');
    }
  });

  app.get('/api/accounting/vouchers', async (_req: Request, res: Response) => {
    try {
      const vouchers = await dbGetVouchers();
      res.json(vouchers);
    } catch (err) {
      handleError(res, err, 'Failed to fetch vouchers');
    }
  });

  app.post('/api/accounting/vouchers', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveVoucher(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save voucher');
    }
  });

  // ---- Treasury: Cash Book ----
  app.get('/api/treasury/cash-book', async (_req: Request, res: Response) => {
    try {
      const entries = await dbGetCashBookEntries();
      res.json(entries);
    } catch (err) {
      handleError(res, err, 'Failed to fetch cash book entries');
    }
  });

  app.post('/api/treasury/cash-book', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveCashBookEntry(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save cash book entry');
    }
  });

  app.delete('/api/treasury/cash-book/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteCashBookEntry(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete cash book entry');
    }
  });

  // ---- Treasury: Credit Book ----
  app.get('/api/treasury/credit-book', async (_req: Request, res: Response) => {
    try {
      const entries = await dbGetCreditBookEntries();
      res.json(entries);
    } catch (err) {
      handleError(res, err, 'Failed to fetch credit book entries');
    }
  });

  app.post('/api/treasury/credit-book', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveCreditBookEntry(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save credit book entry');
    }
  });

  app.delete('/api/treasury/credit-book/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteCreditBookEntry(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete credit book entry');
    }
  });

  // ---- Treasury: Banks & Accounts ----
  app.get('/api/treasury/banks', async (_req: Request, res: Response) => {
    try {
      const banks = await dbGetBanks();
      res.json(banks);
    } catch (err) {
      handleError(res, err, 'Failed to fetch banks');
    }
  });

  app.post('/api/treasury/banks', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveBank(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save bank');
    }
  });

  app.delete('/api/treasury/banks/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteBank(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete bank');
    }
  });

  app.get('/api/treasury/bank-accounts', async (_req: Request, res: Response) => {
    try {
      const accounts = await dbGetBankAccounts();
      res.json(accounts);
    } catch (err) {
      handleError(res, err, 'Failed to fetch bank accounts');
    }
  });

  app.post('/api/treasury/bank-accounts', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveBankAccount(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save bank account');
    }
  });

  app.delete('/api/treasury/bank-accounts/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteBankAccount(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete bank account');
    }
  });

  // ---- Store & Sales ----
  app.get('/api/store-sales/company-settings', async (_req: Request, res: Response) => {
    try {
      const cs = await dbGetCompanySettings();
      res.json(cs || initialCompanySettings);
    } catch (err) {
      handleError(res, err, 'Failed to fetch company settings');
    }
  });

  app.post('/api/store-sales/company-settings', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveCompanySettings(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save company settings');
    }
  });

  app.get('/api/store-sales/buyers', async (_req: Request, res: Response) => {
    try {
      const buyers = await dbGetBuyers();
      res.json(buyers);
    } catch (err) {
      handleError(res, err, 'Failed to fetch buyers');
    }
  });

  app.post('/api/store-sales/buyers', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveBuyer(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save buyer');
    }
  });

  app.delete('/api/store-sales/buyers/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteBuyer(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete buyer');
    }
  });

  app.get('/api/store-sales/partners', async (_req: Request, res: Response) => {
    try {
      const partners = await dbGetPartners();
      res.json(partners);
    } catch (err) {
      handleError(res, err, 'Failed to fetch partners');
    }
  });

  app.post('/api/store-sales/partners', async (req: Request, res: Response) => {
    try {
      const saved = await dbSavePartner(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save partner');
    }
  });

  app.delete('/api/store-sales/partners/:id', async (req: Request, res: Response) => {
    try {
      await dbDeletePartner(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete partner');
    }
  });

  app.get('/api/store-sales/pos', async (_req: Request, res: Response) => {
    try {
      const sales = await dbGetPosCoalSales();
      res.json(sales);
    } catch (err) {
      handleError(res, err, 'Failed to fetch POS coal sales');
    }
  });

  app.post('/api/store-sales/pos', async (req: Request, res: Response) => {
    try {
      const saved = await dbSavePosCoalSale(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save POS coal sale');
    }
  });

  app.delete('/api/store-sales/pos/:id', async (req: Request, res: Response) => {
    try {
      await dbDeletePosCoalSale(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete POS coal sale');
    }
  });

  app.get('/api/store-sales/coal-records', async (_req: Request, res: Response) => {
    try {
      const records = await dbGetCoalSellRecords();
      res.json(records);
    } catch (err) {
      handleError(res, err, 'Failed to fetch coal sell records');
    }
  });

  app.post('/api/store-sales/coal-records', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveCoalSellRecord(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save coal sell record');
    }
  });

  app.delete('/api/store-sales/coal-records/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteCoalSellRecord(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete coal sell record');
    }
  });

  app.get('/api/store-sales/stock-items', async (_req: Request, res: Response) => {
    try {
      const items = await dbGetStockItems();
      res.json(items);
    } catch (err) {
      handleError(res, err, 'Failed to fetch stock items');
    }
  });

  app.post('/api/store-sales/stock-items', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveStockItem(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save stock item');
    }
  });

  app.get('/api/store-sales/stock-entries', async (_req: Request, res: Response) => {
    try {
      const entries = await dbGetStockEntries();
      res.json(entries);
    } catch (err) {
      handleError(res, err, 'Failed to fetch stock entries');
    }
  });

  app.post('/api/store-sales/stock-entries', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveStockEntry(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save stock entry');
    }
  });

  app.delete('/api/store-sales/stock-entries/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteStockEntry(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete stock entry');
    }
  });

  app.get('/api/store-sales/vehicles', async (_req: Request, res: Response) => {
    try {
      const v = await dbGetVehicles();
      res.json(v);
    } catch (err) {
      handleError(res, err, 'Failed to fetch vehicles');
    }
  });

  app.post('/api/store-sales/vehicles', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveVehicle(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save vehicle');
    }
  });

  app.delete('/api/store-sales/vehicles/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteVehicle(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete vehicle');
    }
  });

  app.get('/api/store-sales/consumptions', async (_req: Request, res: Response) => {
    try {
      const items = await dbGetVehicleConsumptions();
      res.json(items);
    } catch (err) {
      handleError(res, err, 'Failed to fetch vehicle consumptions');
    }
  });

  app.post('/api/store-sales/consumptions', async (req: Request, res: Response) => {
    try {
      const saved = await dbSaveVehicleConsumption(req.body);
      res.json(saved);
    } catch (err) {
      handleError(res, err, 'Failed to save vehicle consumption');
    }
  });

  app.delete('/api/store-sales/consumptions/:id', async (req: Request, res: Response) => {
    try {
      await dbDeleteVehicleConsumption(req.params.id);
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      handleError(res, err, 'Failed to delete vehicle consumption');
    }
  });

  // Vite middleware in dev or static serving in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Express server listening on http://0.0.0.0:${PORT}`);
    testDatabaseConnection().then((diag) => {
      console.log(`Database connectivity: ${diag.connected ? 'ONLINE' : 'FALLBACK/OFFLINE'} - ${diag.message}`);
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
