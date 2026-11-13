/**
 * printTable.ts
 * Universal Print Utility to strictly isolate and print only the concerned table.
 * 
 * Sets body.printing-concerned-table and marks the target container with .print-concerned-table,
 * hiding all global navigation, headers, sidebars, buttons, toolbars, and unrelated DOM nodes.
 * Automatically injects the standard Document Header (Company Name, Address, Phone, Email, NTN,
 * Concerned Table Name, and Date) if the target container doesn't already contain one.
 */

import { CompanySettings } from '../types/storeSales';
import { getCachedCompanySettings } from './exportCsv';
import { getTodayFormatted } from './formatters';

export interface PrintConcernedTableOptions {
  companySettings?: CompanySettings | null;
  tableName?: string;
  reportDate?: string;
  subtitle?: string;
}

export const printConcernedTable = (
  containerIdOrElement?: string | HTMLElement | null,
  customTitle?: string,
  options?: PrintConcernedTableOptions
) => {
  let target: HTMLElement | null = null;

  if (typeof containerIdOrElement === 'string') {
    target = document.getElementById(containerIdOrElement);
  } else if (containerIdOrElement instanceof HTMLElement) {
    target = containerIdOrElement;
  }

  // Fallback to currently visible active print table container if none specified
  if (!target) {
    target = document.querySelector('.print-concerned-table, .print-stock-table-only') as HTMLElement | null;
  }

  // Remove any previously added temporary class from other elements
  document.querySelectorAll('.active-printing-target').forEach((el) => {
    el.classList.remove('active-printing-target');
  });

  let injectedHeader: HTMLElement | null = null;

  if (target) {
    target.classList.add('print-concerned-table');
    target.classList.add('active-printing-target');

    // Check if target already has an explicit print header
    const existingHeader = target.querySelector('[data-print-header="true"]');
    if (!existingHeader) {
      const cs = options?.companySettings || getCachedCompanySettings();
      const compName = (cs?.companyName || 'AL-HAMD COAL MINES & METALS (PVT) LTD.').trim();
      const address = (cs?.address || '').trim();
      const phone = cs?.contactNumber || (cs as any)?.phone || '';
      const email = cs?.email || '';
      const ntn = cs?.ntnNumber || '';
      const tableName = options?.tableName || customTitle || 'Report Data Table';
      const dateStr = options?.reportDate || getTodayFormatted();
      const subtitle = options?.subtitle || '';

      const escapeHtml = (str: string) =>
        str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const contactParts: string[] = [];
      if (phone) contactParts.push(`Phone: ${escapeHtml(phone)}`);
      if (email) contactParts.push(`Email: ${escapeHtml(email)}`);
      if (ntn) contactParts.push(`NTN: ${escapeHtml(ntn)}`);

      injectedHeader = document.createElement('div');
      injectedHeader.setAttribute('data-print-header', 'true');
      injectedHeader.setAttribute('data-injected-header', 'true');
      injectedHeader.className = 'print-document-header pb-3 mb-4 border-b-2 border-slate-900 text-slate-900';
      injectedHeader.innerHTML = `
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0; color: #020617; font-family: ui-serif, Georgia, serif;">
            ${escapeHtml(compName)}
          </h1>
          ${address ? `<p style="font-size: 11px; color: #475569; margin: 2px 0 0 0; font-weight: 500;">${escapeHtml(address)}</p>` : ''}
          ${contactParts.length > 0 ? `<div style="font-size: 10px; color: #64748b; font-family: ui-monospace, monospace; margin-top: 2px;">${contactParts.join(' &nbsp;|&nbsp; ')}</div>` : ''}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 6px; border-top: 1px solid #cbd5e1; font-size: 11px; font-weight: bold; color: #1e293b;">
          <div>
            <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #020617; letter-spacing: 0.025em;">
              ${escapeHtml(tableName)}
            </span>
            ${subtitle ? `<div style="font-size: 9px; font-weight: normal; color: #64748b;">${escapeHtml(subtitle)}</div>` : ''}
          </div>
          <div style="font-family: ui-monospace, monospace; font-size: 11px; color: #334155; font-weight: 600;">
            Date: ${escapeHtml(dateStr)}
          </div>
        </div>
      `;
      target.insertBefore(injectedHeader, target.firstChild);
    }
  }

  document.body.classList.add('printing-concerned-table');

  const originalTitle = document.title;
  if (customTitle) {
    document.title = customTitle;
  }

  // Ensure DOM updates apply before opening the system print dialog
  requestAnimationFrame(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-concerned-table');
      document.body.classList.remove('printing-stock-table');
      if (target) {
        target.classList.remove('active-printing-target');
      }
      if (injectedHeader && injectedHeader.parentNode) {
        injectedHeader.parentNode.removeChild(injectedHeader);
      }
      if (customTitle) {
        document.title = originalTitle;
      }
    }, 1200);
  });
};
