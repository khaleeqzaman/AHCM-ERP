import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import * as schema from './schema.ts';
import type { User } from '../types/user.ts';
import type { DemandDocument, PurchaseDocument } from '../types/index.ts';
import type { ChartAccount, VoucherDocument } from '../types/accounting.ts';
import type { CashBookEntry, CreditBookEntry, BankRecord, BankAccountRecord } from '../types/treasury.ts';
import type { 
  CompanySettings, 
  BuyerRecord, 
  BuyerType,
  PartnerRecord, 
  PosCoalSellEntry, 
  CoalSellRecord, 
  CoalProductionRecord,
  StockItem, 
  StockEntry, 
  VehicleRecord, 
  VehicleConsumptionRecord,
  VehicleConsumptionSummary,
  ItemWiseStockSummary
} from '../types/storeSales.ts';

// ----------------- USERS -----------------
export async function dbGetUsers(): Promise<User[]> {
  try {
    const rows = await db.select().from(schema.appUsers);
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      password: r.password,
      name: r.name,
      email: r.email || '',
      role: r.role as any,
      department: r.department || '',
      status: r.status as 'active' | 'inactive',
      createdAt: r.createdAt || '',
      lastLogin: r.lastLogin || '',
      phone: r.phone || '',
    }));
  } catch (error) {
    console.error('Failed to get users from database:', error);
    throw new Error('Failed to fetch users', { cause: error });
  }
}

export async function dbSaveUser(user: User): Promise<User> {
  try {
    await db
      .insert(schema.appUsers)
      .values({
        id: user.id,
        username: user.username,
        password: user.password,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        phone: user.phone,
      })
      .onConflictDoUpdate({
        target: schema.appUsers.id,
        set: {
          username: user.username,
          password: user.password,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
          lastLogin: user.lastLogin,
          phone: user.phone,
        },
      });
    return user;
  } catch (error) {
    console.error('Failed to save user in database:', error);
    throw new Error('Failed to save user', { cause: error });
  }
}

export async function dbDeleteUser(userId: string): Promise<void> {
  try {
    await db.delete(schema.appUsers).where(eq(schema.appUsers.id, userId));
  } catch (error) {
    console.error('Failed to delete user in database:', error);
    throw new Error('Failed to delete user', { cause: error });
  }
}

// ----------------- DEMANDS -----------------
export async function dbGetDemands(): Promise<DemandDocument[]> {
  try {
    const rows = await db.select().from(schema.demands);
    return rows.map((r) => ({
      id: r.id,
      demandType: r.demandType as any,
      category: r.category as any,
      date: r.date,
      referenceNo: r.referenceNo,
      items: r.items as any,
      totalAmount: r.totalAmount,
      status: r.status as any,
      adminRemark: r.adminRemark || undefined,
      updatedAt: r.updatedAt || '',
    }));
  } catch (error) {
    console.error('Failed to get demands from database:', error);
    throw new Error('Failed to fetch demands', { cause: error });
  }
}

export async function dbSaveDemand(demand: DemandDocument): Promise<DemandDocument> {
  try {
    await db
      .insert(schema.demands)
      .values({
        id: demand.id,
        demandType: demand.demandType,
        category: demand.category,
        date: demand.date,
        referenceNo: demand.referenceNo,
        items: demand.items,
        totalAmount: demand.totalAmount,
        status: demand.status,
        adminRemark: demand.adminRemark,
        updatedAt: demand.updatedAt,
      })
      .onConflictDoUpdate({
        target: schema.demands.id,
        set: {
          demandType: demand.demandType,
          category: demand.category,
          date: demand.date,
          referenceNo: demand.referenceNo,
          items: demand.items,
          totalAmount: demand.totalAmount,
          status: demand.status,
          adminRemark: demand.adminRemark,
          updatedAt: demand.updatedAt,
        },
      });
    return demand;
  } catch (error) {
    console.error('Failed to save demand in database:', error);
    throw new Error('Failed to save demand', { cause: error });
  }
}

export async function dbDeleteDemand(id: string): Promise<void> {
  try {
    await db.delete(schema.demands).where(eq(schema.demands.id, id));
  } catch (error) {
    console.error('Failed to delete demand from database:', error);
    throw new Error('Failed to delete demand', { cause: error });
  }
}

// ----------------- PURCHASES -----------------
export async function dbGetPurchases(): Promise<PurchaseDocument[]> {
  try {
    const rows = await db.select().from(schema.purchases);
    return rows.map((r) => ({
      id: r.id,
      paymentType: r.paymentType as any,
      date: r.date,
      reference: r.reference,
      items: r.items as any,
      totalAmount: r.totalAmount,
      status: r.status as any,
      adminRemark: r.adminRemark || undefined,
      updatedAt: r.updatedAt || '',
    }));
  } catch (error) {
    console.error('Failed to get purchases from database:', error);
    throw new Error('Failed to fetch purchases', { cause: error });
  }
}

export async function dbSavePurchase(purchase: PurchaseDocument): Promise<PurchaseDocument> {
  try {
    await db
      .insert(schema.purchases)
      .values({
        id: purchase.id,
        paymentType: purchase.paymentType,
        date: purchase.date,
        reference: purchase.reference,
        items: purchase.items,
        totalAmount: purchase.totalAmount,
        status: purchase.status,
        adminRemark: purchase.adminRemark,
        updatedAt: purchase.updatedAt,
      })
      .onConflictDoUpdate({
        target: schema.purchases.id,
        set: {
          paymentType: purchase.paymentType,
          date: purchase.date,
          reference: purchase.reference,
          items: purchase.items,
          totalAmount: purchase.totalAmount,
          status: purchase.status,
          adminRemark: purchase.adminRemark,
          updatedAt: purchase.updatedAt,
        },
      });
    return purchase;
  } catch (error) {
    console.error('Failed to save purchase in database:', error);
    throw new Error('Failed to save purchase', { cause: error });
  }
}

export async function dbDeletePurchase(id: string): Promise<void> {
  try {
    await db.delete(schema.purchases).where(eq(schema.purchases.id, id));
  } catch (error) {
    console.error('Failed to delete purchase from database:', error);
    throw new Error('Failed to delete purchase', { cause: error });
  }
}

// ----------------- ACCOUNTING: CHART OF ACCOUNTS -----------------
export async function dbGetChartAccounts(): Promise<ChartAccount[]> {
  try {
    const rows = await db.select().from(schema.chartAccounts);
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      typeDigit: r.typeDigit || 1,
      classDigit: r.classDigit || 1,
      groupCode: r.groupCode || '',
      subCode: r.subCode || '',
      name: r.name,
      accountType: r.accountType as any,
      classification: r.classification || '',
      groupName: r.groupName || '',
      normalBalance: (r.normalBalance || 'Debit') as any,
      openingBalance: r.openingBalance || 0,
      currentBalance: r.currentBalance || 0,
      description: r.description || undefined,
      isActive: r.isActive ?? true,
    }));
  } catch (error) {
    console.error('Failed to get chart accounts from database:', error);
    throw new Error('Failed to fetch chart accounts', { cause: error });
  }
}

export async function dbSaveChartAccount(account: ChartAccount): Promise<ChartAccount> {
  try {
    await db
      .insert(schema.chartAccounts)
      .values({
        id: account.id,
        code: account.code,
        typeDigit: account.typeDigit,
        classDigit: account.classDigit,
        groupCode: account.groupCode,
        subCode: account.subCode,
        name: account.name,
        accountType: account.accountType,
        classification: account.classification,
        groupName: account.groupName,
        normalBalance: account.normalBalance,
        openingBalance: account.openingBalance,
        currentBalance: account.currentBalance,
        description: account.description,
        isActive: account.isActive,
      })
      .onConflictDoUpdate({
        target: schema.chartAccounts.id,
        set: {
          code: account.code,
          name: account.name,
          accountType: account.accountType,
          classification: account.classification,
          groupName: account.groupName,
          normalBalance: account.normalBalance,
          openingBalance: account.openingBalance,
          currentBalance: account.currentBalance,
          description: account.description,
          isActive: account.isActive,
        },
      });
    return account;
  } catch (error) {
    console.error('Failed to save chart account in database:', error);
    throw new Error('Failed to save chart account', { cause: error });
  }
}

// ----------------- ACCOUNTING: VOUCHERS -----------------
export async function dbGetVouchers(): Promise<VoucherDocument[]> {
  try {
    const rows = await db.select().from(schema.vouchers);
    return rows.map((r) => ({
      id: r.id,
      voucherNo: r.voucherNo,
      voucherType: r.voucherType as any,
      typeCode: (r.typeCode as any) || undefined,
      date: r.date,
      referenceNo: r.referenceNo || '',
      narration: r.narration || '',
      lines: r.lines as any,
      totalDebit: r.totalDebit,
      totalCredit: r.totalCredit,
      status: r.status as any,
      preparedBy: r.preparedBy || undefined,
      approvedBy: r.approvedBy || undefined,
      approvedAt: r.approvedAt || undefined,
      postedBy: r.postedBy || undefined,
      postedAt: r.postedAt || undefined,
      reversedBy: r.reversedBy || undefined,
      reversedAt: r.reversedAt || undefined,
      reversalReason: r.reversalReason || undefined,
      reversalVoucherNo: r.reversalVoucherNo || undefined,
      cancelledBy: r.cancelledBy || undefined,
      cancelledAt: r.cancelledAt || undefined,
      cancelReason: r.cancelReason || undefined,
    }));
  } catch (error) {
    console.error('Failed to get vouchers from database:', error);
    throw new Error('Failed to fetch vouchers', { cause: error });
  }
}

export async function dbSaveVoucher(voucher: VoucherDocument): Promise<VoucherDocument> {
  try {
    await db
      .insert(schema.vouchers)
      .values({
        id: voucher.id,
        voucherNo: voucher.voucherNo,
        voucherType: voucher.voucherType,
        typeCode: voucher.typeCode || null,
        date: voucher.date,
        referenceNo: voucher.referenceNo || null,
        narration: voucher.narration || null,
        lines: voucher.lines,
        totalDebit: voucher.totalDebit,
        totalCredit: voucher.totalCredit,
        status: voucher.status,
        preparedBy: voucher.preparedBy || null,
        approvedBy: voucher.approvedBy || null,
        approvedAt: voucher.approvedAt || null,
        postedBy: voucher.postedBy || null,
        postedAt: voucher.postedAt || null,
        reversedBy: voucher.reversedBy || null,
        reversedAt: voucher.reversedAt || null,
        reversalReason: voucher.reversalReason || null,
        reversalVoucherNo: voucher.reversalVoucherNo || null,
        cancelledBy: voucher.cancelledBy || null,
        cancelledAt: voucher.cancelledAt || null,
        cancelReason: voucher.cancelReason || null,
      })
      .onConflictDoUpdate({
        target: schema.vouchers.id,
        set: {
          voucherNo: voucher.voucherNo,
          voucherType: voucher.voucherType,
          typeCode: voucher.typeCode || null,
          date: voucher.date,
          referenceNo: voucher.referenceNo || null,
          narration: voucher.narration || null,
          lines: voucher.lines,
          totalDebit: voucher.totalDebit,
          totalCredit: voucher.totalCredit,
          status: voucher.status,
          preparedBy: voucher.preparedBy || null,
          approvedBy: voucher.approvedBy || null,
          approvedAt: voucher.approvedAt || null,
          postedBy: voucher.postedBy || null,
          postedAt: voucher.postedAt || null,
          reversedBy: voucher.reversedBy || null,
          reversedAt: voucher.reversedAt || null,
          reversalReason: voucher.reversalReason || null,
          reversalVoucherNo: voucher.reversalVoucherNo || null,
          cancelledBy: voucher.cancelledBy || null,
          cancelledAt: voucher.cancelledAt || null,
          cancelReason: voucher.cancelReason || null,
        },
      });
    return voucher;
  } catch (error) {
    console.error('Failed to save voucher in database:', error);
    throw new Error('Failed to save voucher', { cause: error });
  }
}

export async function dbDeleteVoucher(id: string): Promise<boolean> {
  try {
    await db.delete(schema.vouchers).where(eq(schema.vouchers.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete voucher in database:', error);
    throw new Error('Failed to delete voucher', { cause: error });
  }
}

// ----------------- TREASURY: CASH BOOK -----------------
export async function dbGetCashBookEntries(): Promise<CashBookEntry[]> {
  try {
    const rows = await db.select().from(schema.cashBookEntries);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      date: r.date,
      description: r.description,
      credit: r.credit || 0,
      debit: r.debit || 0,
      balance: r.balance || 0,
    }));
  } catch (error) {
    console.error('Failed to get cash book entries:', error);
    throw new Error('Failed to fetch cash book entries', { cause: error });
  }
}

export async function dbSaveCashBookEntry(entry: CashBookEntry): Promise<CashBookEntry> {
  try {
    await db
      .insert(schema.cashBookEntries)
      .values({
        id: entry.id,
        srNo: entry.srNo,
        date: entry.date,
        description: entry.description,
        credit: entry.credit,
        debit: entry.debit,
        balance: entry.balance,
      })
      .onConflictDoUpdate({
        target: schema.cashBookEntries.id,
        set: {
          srNo: entry.srNo,
          date: entry.date,
          description: entry.description,
          credit: entry.credit,
          debit: entry.debit,
          balance: entry.balance,
        },
      });
    return entry;
  } catch (error) {
    console.error('Failed to save cash book entry:', error);
    throw new Error('Failed to save cash book entry', { cause: error });
  }
}

export async function dbDeleteCashBookEntry(id: string): Promise<void> {
  try {
    await db.delete(schema.cashBookEntries).where(eq(schema.cashBookEntries.id, id));
  } catch (error) {
    console.error('Failed to delete cash book entry:', error);
    throw new Error('Failed to delete cash book entry', { cause: error });
  }
}

// ----------------- TREASURY: CREDIT BOOK -----------------
export async function dbGetCreditBookEntries(): Promise<CreditBookEntry[]> {
  try {
    const rows = await db.select().from(schema.creditBookEntries);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      date: r.date,
      name: r.name,
      purpose: r.purpose || '',
      amount: r.amount || 0,
    }));
  } catch (error) {
    console.error('Failed to get credit book entries:', error);
    throw new Error('Failed to fetch credit book entries', { cause: error });
  }
}

export async function dbSaveCreditBookEntry(entry: CreditBookEntry): Promise<CreditBookEntry> {
  try {
    await db
      .insert(schema.creditBookEntries)
      .values({
        id: entry.id,
        srNo: entry.srNo,
        date: entry.date,
        name: entry.name,
        purpose: entry.purpose,
        amount: entry.amount,
      })
      .onConflictDoUpdate({
        target: schema.creditBookEntries.id,
        set: {
          srNo: entry.srNo,
          date: entry.date,
          name: entry.name,
          purpose: entry.purpose,
          amount: entry.amount,
        },
      });
    return entry;
  } catch (error) {
    console.error('Failed to save credit book entry:', error);
    throw new Error('Failed to save credit book entry', { cause: error });
  }
}

export async function dbDeleteCreditBookEntry(id: string): Promise<void> {
  try {
    await db.delete(schema.creditBookEntries).where(eq(schema.creditBookEntries.id, id));
  } catch (error) {
    console.error('Failed to delete credit book entry:', error);
    throw new Error('Failed to delete credit book entry', { cause: error });
  }
}

// ----------------- TREASURY: BANKS & ACCOUNTS -----------------
export async function dbGetBanks(): Promise<BankRecord[]> {
  try {
    const rows = await db.select().from(schema.banks);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      bankName: r.bankName,
      branchName: r.branchName || '',
      branchCode: r.branchCode || '',
      address: r.address || '',
    }));
  } catch (error) {
    console.error('Failed to get banks:', error);
    throw new Error('Failed to fetch banks', { cause: error });
  }
}

export async function dbSaveBank(bank: BankRecord): Promise<BankRecord> {
  try {
    await db
      .insert(schema.banks)
      .values({
        id: bank.id,
        srNo: bank.srNo,
        bankName: bank.bankName,
        branchName: bank.branchName,
        branchCode: bank.branchCode,
        address: bank.address,
      })
      .onConflictDoUpdate({
        target: schema.banks.id,
        set: {
          srNo: bank.srNo,
          bankName: bank.bankName,
          branchName: bank.branchName,
          branchCode: bank.branchCode,
          address: bank.address,
        },
      });
    return bank;
  } catch (error) {
    console.error('Failed to save bank:', error);
    throw new Error('Failed to save bank', { cause: error });
  }
}

export async function dbDeleteBank(id: string): Promise<void> {
  try {
    await db.delete(schema.banks).where(eq(schema.banks.id, id));
  } catch (error) {
    console.error('Failed to delete bank:', error);
    throw new Error('Failed to delete bank', { cause: error });
  }
}

export async function dbGetBankAccounts(): Promise<BankAccountRecord[]> {
  try {
    const rows = await db.select().from(schema.bankAccounts);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      bankId: r.bankId,
      bankName: r.bankName,
      accountNumber: r.accountNumber,
      accountTitle: r.accountTitle,
      openingBalance: r.openingBalance || 0,
      openingBalanceDate: r.openingBalanceDate || '',
      transactions: r.transactions as any,
    }));
  } catch (error) {
    console.error('Failed to get bank accounts:', error);
    throw new Error('Failed to fetch bank accounts', { cause: error });
  }
}

export async function dbSaveBankAccount(acc: BankAccountRecord): Promise<BankAccountRecord> {
  try {
    await db
      .insert(schema.bankAccounts)
      .values({
        id: acc.id,
        srNo: acc.srNo,
        bankId: acc.bankId,
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        accountTitle: acc.accountTitle,
        openingBalance: acc.openingBalance,
        openingBalanceDate: acc.openingBalanceDate,
        transactions: acc.transactions,
      })
      .onConflictDoUpdate({
        target: schema.bankAccounts.id,
        set: {
          srNo: acc.srNo,
          bankId: acc.bankId,
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          accountTitle: acc.accountTitle,
          openingBalance: acc.openingBalance,
          openingBalanceDate: acc.openingBalanceDate,
          transactions: acc.transactions,
        },
      });
    return acc;
  } catch (error) {
    console.error('Failed to save bank account:', error);
    throw new Error('Failed to save bank account', { cause: error });
  }
}

export async function dbDeleteBankAccount(id: string): Promise<void> {
  try {
    await db.delete(schema.bankAccounts).where(eq(schema.bankAccounts.id, id));
  } catch (error) {
    console.error('Failed to delete bank account:', error);
    throw new Error('Failed to delete bank account', { cause: error });
  }
}

// ----------------- STORE & SALES -----------------
export async function dbGetPosCoalSales(): Promise<PosCoalSellEntry[]> {
  try {
    const rows = await db.select().from(schema.posCoalSales);
    return rows.map((r) => ({
      id: r.id,
      date: r.documentDate,
      srNo: r.srNo || 1,
      partnerId: r.partnerId || '',
      partnerName: r.partnerName || '',
      buyerId: r.buyerId || '',
      buyerNTN: r.buyerNTN || '',
      buyerCNIC: r.buyerCNIC || '',
      buyerName: r.buyerName,
      buyerType: (r.buyerType || 'Registered') as any,
      saleOrganization: r.saleOrganization || '',
      documentType: r.documentType || '',
      documentNumber: r.documentNumber || '',
      documentDate: r.documentDate,
      quantity: r.quantity || 0,
      valueExcludingTax: r.valueExcludingTax || 0,
      salesTaxFed: r.salesTaxFed || 0,
      furtherTax: r.furtherTax || 0,
      totalTax: r.totalTax || 0,
      totalValue: r.totalValue || 0,
    }));
  } catch (error) {
    console.error('Failed to get POS coal sales:', error);
    throw new Error('Failed to fetch POS coal sales', { cause: error });
  }
}

export async function dbSavePosCoalSale(entry: PosCoalSellEntry): Promise<PosCoalSellEntry> {
  try {
    await db
      .insert(schema.posCoalSales)
      .values({
        id: entry.id,
        srNo: entry.srNo,
        partnerId: entry.partnerId,
        partnerName: entry.partnerName,
        buyerId: entry.buyerId,
        buyerNTN: entry.buyerNTN,
        buyerCNIC: entry.buyerCNIC,
        buyerName: entry.buyerName,
        buyerType: entry.buyerType,
        saleOrganization: entry.saleOrganization,
        documentType: entry.documentType,
        documentNumber: entry.documentNumber,
        documentDate: entry.documentDate || entry.date || '',
        quantity: entry.quantity ?? entry.quantityTons ?? 0,
        valueExcludingTax: entry.valueExcludingTax,
        salesTaxFed: entry.salesTaxFed,
        furtherTax: entry.furtherTax,
        totalTax: entry.totalTax,
        totalValue: entry.totalValue,
      } as any)
      .onConflictDoUpdate({
        target: schema.posCoalSales.id,
        set: {
          srNo: entry.srNo,
          partnerId: entry.partnerId,
          partnerName: entry.partnerName,
          buyerName: entry.buyerName,
          quantity: entry.quantity,
          valueExcludingTax: entry.valueExcludingTax,
          salesTaxFed: entry.salesTaxFed,
          furtherTax: entry.furtherTax,
          totalTax: entry.totalTax,
          totalValue: entry.totalValue,
        },
      });
    return entry;
  } catch (error) {
    console.error('Failed to save POS coal sale:', error);
    throw new Error('Failed to save POS coal sale', { cause: error });
  }
}

export async function dbDeletePosCoalSale(id: string): Promise<void> {
  try {
    await db.delete(schema.posCoalSales).where(eq(schema.posCoalSales.id, id));
  } catch (error) {
    console.error('Failed to delete POS coal sale:', error);
    throw new Error('Failed to delete POS coal sale', { cause: error });
  }
}

export async function dbGetBuyers(): Promise<BuyerRecord[]> {
  try {
    const rows = await db.select().from(schema.buyers);
    return rows.map((r) => ({
      id: r.id,
      buyerNTN: r.buyerNTN || '',
      buyerCNIC: r.buyerCNIC || '',
      buyerName: r.buyerName,
      buyerType: r.buyerType as any,
      phone: r.phone || '',
      city: r.city || '',
    }));
  } catch (error) {
    console.error('Failed to get buyers:', error);
    throw new Error('Failed to fetch buyers', { cause: error });
  }
}

export async function dbSaveBuyer(b: BuyerRecord): Promise<BuyerRecord> {
  try {
    await db
      .insert(schema.buyers)
      .values({
        id: b.id,
        buyerNTN: b.buyerNTN,
        buyerCNIC: b.buyerCNIC,
        buyerName: b.buyerName,
        buyerType: b.buyerType,
        phone: b.phone,
        city: b.city,
      })
      .onConflictDoUpdate({
        target: schema.buyers.id,
        set: {
          buyerNTN: b.buyerNTN,
          buyerCNIC: b.buyerCNIC,
          buyerName: b.buyerName,
          buyerType: b.buyerType,
          phone: b.phone,
          city: b.city,
        },
      });
    return b;
  } catch (error) {
    console.error('Failed to save buyer:', error);
    throw new Error('Failed to save buyer', { cause: error });
  }
}

export async function dbDeleteBuyer(id: string): Promise<void> {
  try {
    await db.delete(schema.buyers).where(eq(schema.buyers.id, id));
  } catch (error) {
    console.error('Failed to delete buyer:', error);
    throw new Error('Failed to delete buyer', { cause: error });
  }
}

export async function dbGetPartners(): Promise<PartnerRecord[]> {
  try {
    const rows = await db.select().from(schema.partners);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      isActive: r.isActive ?? true,
      showInReport: r.showInReport ?? true,
      notes: r.notes || '',
    }));
  } catch (error) {
    console.error('Failed to get partners:', error);
    throw new Error('Failed to fetch partners', { cause: error });
  }
}

export async function dbSavePartner(p: PartnerRecord): Promise<PartnerRecord> {
  try {
    const partnerCode = p.code || p.name.substring(0, 4).toUpperCase() || 'PART';
    await db
      .insert(schema.partners)
      .values({
        id: p.id,
        name: p.name,
        code: partnerCode,
        isActive: p.isActive,
        showInReport: p.showInReport,
        notes: p.notes,
      })
      .onConflictDoUpdate({
        target: schema.partners.id,
        set: {
          name: p.name,
          code: partnerCode,
          isActive: p.isActive,
          showInReport: p.showInReport,
          notes: p.notes,
        },
      });
    return { ...p, code: partnerCode };
  } catch (error) {
    console.error('Failed to save partner:', error);
    throw new Error('Failed to save partner', { cause: error });
  }
}

export async function dbDeletePartner(id: string): Promise<void> {
  try {
    await db.delete(schema.partners).where(eq(schema.partners.id, id));
  } catch (error) {
    console.error('Failed to delete partner:', error);
    throw new Error('Failed to delete partner', { cause: error });
  }
}

export async function dbGetStockItems(): Promise<StockItem[]> {
  try {
    const rows = await db.select().from(schema.stockItems);
    return rows.map((r) => ({
      id: r.id,
      itemCode: r.itemCode,
      itemName: r.itemName,
      category: r.category || '',
      unit: r.unit,
    }));
  } catch (error) {
    console.error('Failed to get stock items:', error);
    throw new Error('Failed to fetch stock items', { cause: error });
  }
}

export async function dbSaveStockItem(it: StockItem): Promise<StockItem> {
  try {
    await db
      .insert(schema.stockItems)
      .values({
        id: it.id,
        itemCode: it.itemCode,
        itemName: it.itemName,
        category: (it as any).category || (it as any).categoryName || '',
        unit: (it as any).unit || (it as any).unitSymbol || '',
      } as any)
      .onConflictDoUpdate({
        target: schema.stockItems.id,
        set: {
          itemCode: it.itemCode,
          itemName: it.itemName,
          category: (it as any).category || (it as any).categoryName || '',
          unit: (it as any).unit || (it as any).unitSymbol || '',
        },
      });
    return it;
  } catch (error) {
    console.error('Failed to save stock item:', error);
    throw new Error('Failed to save stock item', { cause: error });
  }
}

export async function dbDeleteStockItem(id: string): Promise<boolean> {
  try {
    await db.delete(schema.stockItems).where(eq(schema.stockItems.id, id));
    return true;
  } catch (error) {
    console.error('Failed to delete stock item:', error);
    throw new Error('Failed to delete stock item', { cause: error });
  }
}

export async function dbGetStockEntries(): Promise<StockEntry[]> {
  try {
    const rows = await db.select().from(schema.stockEntries);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      date: r.date,
      itemId: r.itemId,
      itemName: r.itemName,
      itemCode: r.itemCode,
      stockQty: r.stockQty || 0,
      purchaseQty: r.purchaseQty || 0,
      mineQty: r.mineQty || 0,
      vehiclesQty: r.vehiclesQty || 0,
      companyName: r.companyName || '',
      balance: r.balance || 0,
    }));
  } catch (error) {
    console.error('Failed to get stock entries:', error);
    throw new Error('Failed to fetch stock entries', { cause: error });
  }
}

export async function dbSaveStockEntry(se: StockEntry): Promise<StockEntry> {
  try {
    const itemName = se.itemName || 'Stock Item';
    const itemCode = se.itemCode || 'CODE';
    await db
      .insert(schema.stockEntries)
      .values({
        id: se.id,
        srNo: se.srNo,
        date: se.date,
        itemId: se.itemId,
        itemName: itemName,
        itemCode: itemCode,
        stockQty: se.stockQty,
        purchaseQty: se.purchaseQty,
        mineQty: se.mineQty,
        vehiclesQty: se.vehiclesQty,
        companyName: se.companyName,
        balance: se.balance,
      })
      .onConflictDoUpdate({
        target: schema.stockEntries.id,
        set: {
          srNo: se.srNo,
          date: se.date,
          itemName: itemName,
          itemCode: itemCode,
          stockQty: se.stockQty,
          purchaseQty: se.purchaseQty,
          mineQty: se.mineQty,
          vehiclesQty: se.vehiclesQty,
          companyName: se.companyName,
          balance: se.balance,
        },
      });
    return { ...se, itemName, itemCode };
  } catch (error) {
    console.error('Failed to save stock entry:', error);
    throw new Error('Failed to save stock entry', { cause: error });
  }
}

export async function dbDeleteStockEntry(id: string): Promise<void> {
  try {
    await db.delete(schema.stockEntries).where(eq(schema.stockEntries.id, id));
  } catch (error) {
    console.error('Failed to delete stock entry:', error);
    throw new Error('Failed to delete stock entry', { cause: error });
  }
}

export async function dbGetVehicles(): Promise<VehicleRecord[]> {
  try {
    const rows = await db.select().from(schema.vehicles);
    return rows.map((r) => ({
      id: r.id,
      vehicleNo: r.vehicleNo,
      driverName: r.driverName,
      vehicleType: r.vehicleType,
      status: r.status as any,
    }));
  } catch (error) {
    console.error('Failed to get vehicles:', error);
    throw new Error('Failed to fetch vehicles', { cause: error });
  }
}

export async function dbSaveVehicle(v: VehicleRecord): Promise<VehicleRecord> {
  try {
    await db
      .insert(schema.vehicles)
      .values({
        id: v.id,
        vehicleNo: v.vehicleNo,
        driverName: v.driverName,
        vehicleType: v.vehicleType,
        status: v.status,
      })
      .onConflictDoUpdate({
        target: schema.vehicles.id,
        set: {
          vehicleNo: v.vehicleNo,
          driverName: v.driverName,
          vehicleType: v.vehicleType,
          status: v.status,
        },
      });
    return v;
  } catch (error) {
    console.error('Failed to save vehicle:', error);
    throw new Error('Failed to save vehicle', { cause: error });
  }
}

export async function dbDeleteVehicle(id: string): Promise<void> {
  try {
    await db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));
  } catch (error) {
    console.error('Failed to delete vehicle:', error);
    throw new Error('Failed to delete vehicle', { cause: error });
  }
}

export async function dbGetVehicleConsumptions(): Promise<VehicleConsumptionRecord[]> {
  try {
    const rows = await db.select().from(schema.vehicleConsumptions);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      vehicleId: r.vehicleId,
      vehicleNo: r.vehicleNo,
      date: r.date,
      diesel: r.diesel || 0,
      mOil: r.mOil || 0,
      dOil: r.dOil || 0,
      oFltr: r.oFltr || 0,
      dFltr: r.dFltr || 0,
      kOil: r.kOil || 0,
      cOil: r.cOil || 0,
      bOil: r.bOil || 0,
      remarks: r.remarks || '',
    }));
  } catch (error) {
    console.error('Failed to get vehicle consumptions:', error);
    throw new Error('Failed to fetch vehicle consumptions', { cause: error });
  }
}

export async function dbSaveVehicleConsumption(vc: VehicleConsumptionRecord): Promise<VehicleConsumptionRecord> {
  try {
    await db
      .insert(schema.vehicleConsumptions)
      .values({
        id: vc.id,
        srNo: vc.srNo,
        vehicleId: vc.vehicleId,
        vehicleNo: vc.vehicleNo,
        date: vc.date,
        diesel: vc.diesel,
        mOil: vc.mOil,
        dOil: vc.dOil,
        oFltr: vc.oFltr,
        dFltr: vc.dFltr,
        kOil: vc.kOil,
        cOil: vc.cOil,
        bOil: vc.bOil,
        remarks: vc.remarks,
      } as any)
      .onConflictDoUpdate({
        target: schema.vehicleConsumptions.id,
        set: {
          srNo: vc.srNo,
          vehicleNo: vc.vehicleNo,
          date: vc.date,
          diesel: vc.diesel,
          mOil: vc.mOil,
          dOil: vc.dOil,
          oFltr: vc.oFltr,
          dFltr: vc.dFltr,
          kOil: vc.kOil,
          cOil: vc.cOil,
          bOil: vc.bOil,
          remarks: vc.remarks,
        },
      });
    return vc;
  } catch (error) {
    console.error('Failed to save vehicle consumption:', error);
    throw new Error('Failed to save vehicle consumption', { cause: error });
  }
}

export async function dbDeleteVehicleConsumption(id: string): Promise<void> {
  try {
    await db.delete(schema.vehicleConsumptions).where(eq(schema.vehicleConsumptions.id, id));
  } catch (error) {
    console.error('Failed to delete vehicle consumption:', error);
    throw new Error('Failed to delete vehicle consumption', { cause: error });
  }
}

export async function dbGetCompanySettings(): Promise<CompanySettings | null> {
  try {
    const rows = await db.select().from(schema.companySettings).where(eq(schema.companySettings.id, 'default'));
    if (!rows.length) return null;
    return {
      companyName: rows[0].companyName,
      address: rows[0].address,
      ntnNumber: rows[0].ntnNumber || '',
      contactNumber: rows[0].contactNumber || '',
      email: rows[0].email || '',
    };
  } catch (error) {
    console.error('Failed to get company settings:', error);
    throw new Error('Failed to fetch company settings', { cause: error });
  }
}

export async function dbSaveCompanySettings(cs: CompanySettings): Promise<CompanySettings> {
  try {
    await db
      .insert(schema.companySettings)
      .values({
        id: 'default',
        companyName: cs.companyName,
        address: cs.address,
        ntnNumber: cs.ntnNumber,
        contactNumber: cs.contactNumber,
        email: cs.email,
      })
      .onConflictDoUpdate({
        target: schema.companySettings.id,
        set: {
          companyName: cs.companyName,
          address: cs.address,
          ntnNumber: cs.ntnNumber,
          contactNumber: cs.contactNumber,
          email: cs.email,
        },
      });
    return cs;
  } catch (error) {
    console.error('Failed to save company settings:', error);
    throw new Error('Failed to save company settings', { cause: error });
  }
}

// ----------------- COAL SELL RECORDS -----------------
export async function dbGetCoalSellRecords(): Promise<CoalSellRecord[]> {
  try {
    const rows = await db.select().from(schema.coalSellRecords);
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      partnerId: r.partnerId || '',
      partnerName: r.partnerName,
      buyerName: 'Direct Dispatched',
      buyerType: 'Registered' as BuyerType,
      saleOrganization: 'Balochistan',
      documentType: 'Sales Tax Invoice',
      documentNumber: `DISP-${r.id}`,
      quantity: r.quantityTons || 0,
      quantityTons: r.quantityTons || 0,
      valueExcludingTax: 0,
      salesTaxFed: 0,
      furtherTax: 0,
      totalTax: 0,
      totalValue: 0,
      vehicleNo: r.vehicleNo || '',
      remarks: r.remarks || '',
    }));
  } catch (error) {
    console.error('Failed to get coal sell records:', error);
    throw new Error('Failed to fetch coal sell records', { cause: error });
  }
}

export async function dbSaveCoalSellRecord(csr: CoalSellRecord): Promise<CoalSellRecord> {
  try {
    await db
      .insert(schema.coalSellRecords)
      .values({
        id: csr.id,
        date: csr.date,
        partnerId: csr.partnerId,
        partnerName: csr.partnerName,
        quantityTons: csr.quantityTons ?? csr.quantity ?? 0,
        vehicleNo: csr.vehicleNo,
        remarks: csr.remarks,
      } as any)
      .onConflictDoUpdate({
        target: schema.coalSellRecords.id,
        set: {
          date: csr.date,
          partnerId: csr.partnerId,
          partnerName: csr.partnerName,
          quantityTons: csr.quantityTons ?? csr.quantity ?? 0,
          vehicleNo: csr.vehicleNo,
          remarks: csr.remarks,
        },
      });
    return csr;
  } catch (error) {
    console.error('Failed to save coal sell record:', error);
    throw new Error('Failed to save coal sell record', { cause: error });
  }
}

export async function dbDeleteCoalSellRecord(id: string): Promise<void> {
  try {
    await db.delete(schema.coalSellRecords).where(eq(schema.coalSellRecords.id, id));
  } catch (error) {
    console.error('Failed to delete coal sell record:', error);
    throw new Error('Failed to delete coal sell record', { cause: error });
  }
}

// ----------------- COAL PRODUCTION RECORDS -----------------
export async function dbGetCoalProductionRecords(): Promise<CoalProductionRecord[]> {
  try {
    const rows = await db.select().from(schema.coalProductionRecords);
    return rows.map((r) => ({
      id: r.id,
      srNo: r.srNo || 1,
      date: r.date,
      partnerId: r.partnerId || '',
      partnerName: r.partnerName,
      quantity: r.quantityTons || 0,
      quantityTons: r.quantityTons || 0,
      pitheadLocation: r.pitheadLocation || '',
      vehicleNo: r.vehicleNo || '',
      remarks: r.remarks || '',
      createdAt: r.createdAt || undefined,
    }));
  } catch (error) {
    console.error('Failed to get coal production records:', error);
    throw new Error('Failed to fetch coal production records', { cause: error });
  }
}

export async function dbSaveCoalProductionRecord(cpr: CoalProductionRecord): Promise<CoalProductionRecord> {
  try {
    await db
      .insert(schema.coalProductionRecords)
      .values({
        id: cpr.id,
        srNo: cpr.srNo || 1,
        date: cpr.date,
        partnerId: cpr.partnerId || '',
        partnerName: cpr.partnerName,
        quantityTons: Number(cpr.quantity ?? cpr.quantityTons ?? 0),
        pitheadLocation: cpr.pitheadLocation || '',
        vehicleNo: cpr.vehicleNo || '',
        remarks: cpr.remarks || '',
        createdAt: cpr.createdAt || new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: schema.coalProductionRecords.id,
        set: {
          srNo: cpr.srNo || 1,
          date: cpr.date,
          partnerId: cpr.partnerId || '',
          partnerName: cpr.partnerName,
          quantityTons: Number(cpr.quantity ?? cpr.quantityTons ?? 0),
          pitheadLocation: cpr.pitheadLocation || '',
          vehicleNo: cpr.vehicleNo || '',
          remarks: cpr.remarks || '',
        },
      });
    return cpr;
  } catch (error) {
    console.error('Failed to save coal production record:', error);
    throw new Error('Failed to save coal production record', { cause: error });
  }
}

export async function dbDeleteCoalProductionRecord(id: string): Promise<void> {
  try {
    await db.delete(schema.coalProductionRecords).where(eq(schema.coalProductionRecords.id, id));
  } catch (error) {
    console.error('Failed to delete coal production record:', error);
    throw new Error('Failed to delete coal production record', { cause: error });
  }
}

// ----------------- EXECUTIVE SUMMARIES FOR ADMIN DASHBOARD -----------------
export async function dbGetVehicleConsumptionSummary(): Promise<VehicleConsumptionSummary[]> {
  try {
    const [vehiclesList, consumptionsList] = await Promise.all([
      db.select().from(schema.vehicles),
      db.select().from(schema.vehicleConsumptions),
    ]);

    const vehicleMap = new Map<string, {
      vehicleNo: string;
      vehicleType: string;
      driverName: string;
      status: string;
    }>();

    vehiclesList.forEach((v) => {
      vehicleMap.set(v.id, {
        vehicleNo: v.vehicleNo,
        vehicleType: v.vehicleType,
        driverName: v.driverName,
        status: v.status || 'Active',
      });
      vehicleMap.set(v.vehicleNo.trim().toUpperCase(), {
        vehicleNo: v.vehicleNo,
        vehicleType: v.vehicleType,
        driverName: v.driverName,
        status: v.status || 'Active',
      });
    });

    const summaryMap = new Map<string, VehicleConsumptionSummary>();

    vehiclesList.forEach((v) => {
      summaryMap.set(v.id, {
        vehicleId: v.id,
        vehicleNo: v.vehicleNo,
        vehicleType: v.vehicleType,
        driverName: v.driverName,
        status: v.status || 'Active',
        totalDiesel: 0,
        totalMOil: 0,
        totalDOil: 0,
        totalOFltr: 0,
        totalDFltr: 0,
        totalKOil: 0,
        totalCOil: 0,
        totalBOil: 0,
        logsCount: 0,
        lastDate: '',
      });
    });

    consumptionsList.forEach((c) => {
      const vNo = (c.vehicleNo || '').trim().toUpperCase();
      let target = summaryMap.get(c.vehicleId || '');
      if (!target) {
        for (const [_, item] of summaryMap.entries()) {
          if ((item.vehicleNo || '').trim().toUpperCase() === vNo) {
            target = item;
            break;
          }
        }
      }

      if (!target) {
        const vehicleInfo = vehicleMap.get(vNo);
        target = {
          vehicleId: c.vehicleId || `v-${c.vehicleNo || 'veh'}`,
          vehicleNo: c.vehicleNo || 'Unknown',
          vehicleType: vehicleInfo?.vehicleType || 'Fleet Vehicle',
          driverName: vehicleInfo?.driverName || 'Designated Driver',
          status: vehicleInfo?.status || 'Active',
          totalDiesel: 0,
          totalMOil: 0,
          totalDOil: 0,
          totalOFltr: 0,
          totalDFltr: 0,
          totalKOil: 0,
          totalCOil: 0,
          totalBOil: 0,
          logsCount: 0,
          lastDate: '',
        };
        summaryMap.set(target.vehicleId || `v-${c.vehicleNo || 'veh'}`, target);
      }

      target.totalDiesel = (target.totalDiesel || 0) + Number(c.diesel || 0);
      target.totalMOil = (target.totalMOil || 0) + Number(c.mOil || 0);
      target.totalDOil = (target.totalDOil || 0) + Number(c.dOil || 0);
      target.totalOFltr = (target.totalOFltr || 0) + Number(c.oFltr || 0);
      target.totalDFltr = (target.totalDFltr || 0) + Number(c.dFltr || 0);
      target.totalKOil = (target.totalKOil || 0) + Number(c.kOil || 0);
      target.totalCOil = (target.totalCOil || 0) + Number(c.cOil || 0);
      target.totalBOil = (target.totalBOil || 0) + Number(c.bOil || 0);
      target.logsCount = (target.logsCount || 0) + 1;
      if (!target.lastDate || (c.date && c.date > target.lastDate)) {
        target.lastDate = c.date;
      }
    });

    const result = Array.from(summaryMap.values());
    result.sort((a, b) => (b.totalDiesel || 0) - (a.totalDiesel || 0));
    return result;
  } catch (error) {
    console.error('Failed to get vehicle consumption summary:', error);
    throw new Error('Failed to fetch vehicle consumption summary', { cause: error });
  }
}

export async function dbGetItemWiseStockSummary(): Promise<ItemWiseStockSummary[]> {
  try {
    const [itemsList, entriesList] = await Promise.all([
      db.select().from(schema.stockItems),
      db.select().from(schema.stockEntries),
    ]);

    const itemsMap = new Map<string, {
      itemName: string;
      itemCode: string;
      category: string;
      unit: string;
    }>();

    itemsList.forEach((it) => {
      itemsMap.set(it.id, {
        itemName: it.itemName,
        itemCode: it.itemCode,
        category: it.category || 'General',
        unit: it.unit,
      });
      itemsMap.set(it.itemCode.trim().toUpperCase(), {
        itemName: it.itemName,
        itemCode: it.itemCode,
        category: it.category || 'General',
        unit: it.unit,
      });
    });

    const summaryMap = new Map<string, ItemWiseStockSummary>();

    itemsList.forEach((it) => {
      summaryMap.set(it.id, {
        id: it.id,
        itemId: it.id,
        itemCode: it.itemCode,
        itemName: it.itemName,
        category: it.category || 'General',
        unit: it.unit,
        totalOpeningStock: 0,
        totalPurchaseQty: 0,
        totalMineQty: 0,
        totalVehiclesQty: 0,
        currentBalance: 0,
        entriesCount: 0,
        lastDate: '',
        stockStatus: 'In Stock',
      });
    });

    entriesList.forEach((entry) => {
      let target = summaryMap.get(entry.itemId);
      if (!target) {
        for (const [_, item] of summaryMap.entries()) {
          if (item.itemCode.trim().toUpperCase() === entry.itemCode.trim().toUpperCase()) {
            target = item;
            break;
          }
        }
      }

      if (!target) {
        const itemInfo = itemsMap.get(entry.itemCode.trim().toUpperCase());
        target = {
          id: entry.itemId || `it-${entry.itemCode}`,
          itemId: entry.itemId || `it-${entry.itemCode}`,
          itemCode: entry.itemCode,
          itemName: entry.itemName || itemInfo?.itemName || entry.itemCode,
          category: itemInfo?.category || 'General Supplies',
          unit: itemInfo?.unit || 'Units',
          totalOpeningStock: 0,
          totalPurchaseQty: 0,
          totalMineQty: 0,
          totalVehiclesQty: 0,
          currentBalance: 0,
          entriesCount: 0,
          lastDate: '',
          stockStatus: 'In Stock',
        };
        summaryMap.set(target.itemId || `it-${entry.itemCode}`, target);
      }

      if (target) {
        target.totalOpeningStock = (target.totalOpeningStock || 0) + Number(entry.stockQty || 0);
        target.totalPurchaseQty = (target.totalPurchaseQty || 0) + Number(entry.purchaseQty || 0);
        target.totalMineQty = (target.totalMineQty || 0) + Number(entry.mineQty || 0);
        target.totalVehiclesQty = (target.totalVehiclesQty || 0) + Number(entry.vehiclesQty || 0);
        target.entriesCount = (target.entriesCount || 0) + 1;
        if (!target.lastDate || (entry.date && entry.date > target.lastDate)) {
          target.lastDate = entry.date;
        }
      }
    });

    const result = Array.from(summaryMap.values()).map((s) => {
      const net = ((s.totalOpeningStock || 0) + (s.totalPurchaseQty || 0)) - ((s.totalMineQty || 0) + (s.totalVehiclesQty || 0));
      let status: 'In Stock' | 'Low Stock' | 'Critical' = 'In Stock';
      if (net <= 5) {
        status = 'Critical';
      } else if (net <= 25) {
        status = 'Low Stock';
      }
      return {
        ...s,
        currentBalance: Math.round(net),
        stockStatus: status,
      };
    });

    const priority: Record<string, number> = { Critical: 0, 'Low Stock': 1, 'In Stock': 2 };
    result.sort((a, b) => (priority[a.stockStatus] ?? 3) - (priority[b.stockStatus] ?? 3) || a.currentBalance - b.currentBalance);
    return result;
  } catch (error) {
    console.error('Failed to get item-wise stock summary:', error);
    throw new Error('Failed to fetch item-wise stock summary', { cause: error });
  }
}

