import type { ChartAccount } from '../types/accounting';

export function getAccountCode(acc: Pick<ChartAccount, 'code' | 'accountNo'>): string {
  return String(acc.code || acc.accountNo || '').trim();
}

/**
 * Compares hierarchical Account Codes / Numbers in strict tree-prefix sequence:
 * e.g. "1" -> "11" -> "1101" -> "1101001" -> "1101002" -> "1101003" -> "1102" -> "2"
 * Also supports segmented codes like "1-1-01" -> "1-1-01-001" -> "1-1-01-002".
 */
export function compareAccountCodes(
  a: Pick<ChartAccount, 'code' | 'accountNo'> & { name?: string },
  b: Pick<ChartAccount, 'code' | 'accountNo'> & { name?: string }
): number {
  const codeA = getAccountCode(a).toUpperCase();
  const codeB = getAccountCode(b).toUpperCase();

  if (codeA === codeB) {
    return String(a.name || '').localeCompare(String(b.name || ''));
  }

  const partsA = codeA.split(/[-./\s]+/).filter(Boolean);
  const partsB = codeB.split(/[-./\s]+/).filter(Boolean);
  const minLen = Math.min(partsA.length, partsB.length);

  for (let i = 0; i < minLen; i++) {
    const segA = partsA[i];
    const segB = partsB[i];
    if (segA !== segB) {
      return segA < segB ? -1 : 1;
    }
  }

  if (partsA.length !== partsB.length) {
    return partsA.length - partsB.length;
  }

  return codeA < codeB ? -1 : 1;
}

export function sortAccountsByCode<
  T extends Pick<ChartAccount, 'code' | 'accountNo'> & { name?: string }
>(accounts: T[]): T[] {
  return [...accounts].sort(compareAccountCodes);
}

/**
 * Trial Balance Account Type sequence:
 * 1. Assets
 * 2. Liabilities
 * 3. Capital / Equity
 * 4. Revenue
 * 5. Expenses
 */
export function getAccountTypeSortRank(accountType?: string): number {
  const lower = String(accountType || '').toLowerCase().trim();
  if (lower.includes('asset')) return 1;
  if (lower.includes('liab')) return 2;
  if (lower.includes('capit') || lower.includes('equit')) return 3;
  if (lower.includes('rev') || lower.includes('income') || lower.includes('sale')) return 4;
  if (lower.includes('exp') || lower.includes('cost')) return 5;
  return 6;
}

export function sortAccountsForTrialBalance<
  T extends Pick<ChartAccount, 'accountType' | 'code' | 'accountNo'> & { name?: string }
>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) => {
    const rankDiff = getAccountTypeSortRank(a.accountType) - getAccountTypeSortRank(b.accountType);
    if (rankDiff !== 0) return rankDiff;
    return compareAccountCodes(a, b);
  });
}
