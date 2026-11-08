/**
 * Universal formatters for whole numbers (no decimal points) and date picker interoperability.
 * Ensures all Amount, Rate, and Quantity figures across the ERP are formatted as whole numbers.
 */

/**
 * Formats any amount, rate, or quantity as a whole number with thousands separators,
 * strictly without decimal points (e.g., 10085.00 -> "10,085", 85.00 -> "85", 100 -> "100").
 */
export function formatWholeNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Formats a currency value as a whole number without decimal points.
 */
export function formatWholeCurrency(val: number | string | null | undefined, prefix = 'PKR '): string {
  return `${prefix}${formatWholeNumber(val)}`;
}

/**
 * Normalizes any date string (whether "DD-MM-YYYY", "YYYY-MM-DD", or ISO timestamp)
 * into standard HTML5 date picker format: "YYYY-MM-DD".
 */
export function toDateInputValue(val: string | null | undefined): string {
  if (!val) return '';
  const str = String(val).trim();
  // Check if DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  }
  // Check if YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  // Fallback to JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

/**
 * Converts an HTML5 date input value ("YYYY-MM-DD") to the application's stored format
 * (defaults to "DD-MM-YYYY", or "YYYY-MM-DD" if specified).
 */
export function fromDateInputValue(
  val: string,
  targetFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD' = 'DD-MM-YYYY'
): string {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    if (targetFormat === 'YYYY-MM-DD') return str;
    const [y, m, d] = str.split('-');
    return `${d}-${m}-${y}`;
  }
  return str;
}

/**
 * Formats the Coal Stock Formula string (Total Coal Stock + Coal Opening Balance).
 * Formula structure: e.g. "500 + 100 + 500 Tons"
 */
export function formatCoalStockFormula(
  productionQuantities: number[],
  openingStock: number,
  soldQuantity: number = 0
): string {
  const parts: string[] = [];

  if (productionQuantities.length === 0) {
    if (openingStock > 0) {
      parts.push(formatWholeNumber(openingStock));
    } else {
      parts.push('0');
    }
  } else if (productionQuantities.length === 1) {
    parts.push(formatWholeNumber(productionQuantities[0]));
    if (openingStock > 0) {
      parts.push(formatWholeNumber(openingStock));
    }
  } else if (productionQuantities.length === 2) {
    // Specifically matches the exact user formula: "500 + 100 + 500 Tons"
    parts.push(formatWholeNumber(productionQuantities[0]));
    if (openingStock > 0) {
      parts.push(formatWholeNumber(openingStock));
    }
    parts.push(formatWholeNumber(productionQuantities[1]));
  } else {
    // 3 or more entries: insert opening stock between first and subsequent production entries
    parts.push(formatWholeNumber(productionQuantities[0]));
    if (openingStock > 0) {
      parts.push(formatWholeNumber(openingStock));
    }
    for (let i = 1; i < Math.min(productionQuantities.length, 3); i++) {
      parts.push(formatWholeNumber(productionQuantities[i]));
    }
    if (productionQuantities.length > 3) {
      const remaining = productionQuantities.slice(3).reduce((a, b) => a + b, 0);
      parts.push(`+${formatWholeNumber(remaining)}`);
    }
  }

  let formula = parts.join(' + ') + ' Tons';
  if (soldQuantity > 0) {
    formula += ` − ${formatWholeNumber(soldQuantity)} Tons`;
  }
  return formula;
}
