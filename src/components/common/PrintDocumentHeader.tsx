import React from 'react';
import { CompanySettings } from '../../types/storeSales';
import { getTodayFormatted } from '../../utils/formatters';
import { getCachedCompanySettings } from '../../utils/exportCsv';

interface PrintDocumentHeaderProps {
  companySettings?: CompanySettings | null;
  tableName: string;
  date?: string;
  subtitle?: string;
  className?: string;
  showBorder?: boolean;
}

/**
 * Universal Print Document Header.
 * Renders company name, address, phone, email, and NTN, followed by the
 * concerned table name and date. Used for printed reports and print views.
 */
export const PrintDocumentHeader: React.FC<PrintDocumentHeaderProps> = ({
  companySettings,
  tableName,
  date,
  subtitle,
  className = '',
  showBorder = true,
}) => {
  const cs = companySettings || getCachedCompanySettings();
  const compName = (cs?.companyName || 'AL-HAMD COAL MINES & METALS (PVT) LTD.').trim();
  const address = (cs?.address || '').trim();
  const phone = cs?.contactNumber || (cs as any)?.phone || '';
  const email = cs?.email || '';
  const ntn = cs?.ntnNumber || '';
  const dateStr = date || getTodayFormatted();

  return (
    <div
      data-print-header="true"
      className={`print-document-header pb-3 mb-4 ${
        showBorder ? 'border-b-2 border-slate-900' : ''
      } text-slate-900 ${className}`}
    >
      <div className="text-center space-y-0.5">
        <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-wider text-slate-950 font-serif">
          {compName}
        </h1>
        {address && (
          <p className="text-xs text-slate-600 font-medium max-w-2xl mx-auto">
            {address}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-mono flex-wrap pt-0.5">
          {phone && <span>Phone: {phone}</span>}
          {email && <span>Email: {email}</span>}
          {ntn && <span>NTN: {ntn}</span>}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
        <div>
          <span className="uppercase tracking-wider text-slate-950 text-xs sm:text-sm font-black">
            {tableName}
          </span>
          {subtitle && <p className="text-[10px] font-normal text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="text-right font-mono text-[11px] text-slate-700 font-semibold shrink-0">
          <span>Date: {dateStr}</span>
        </div>
      </div>
    </div>
  );
};
