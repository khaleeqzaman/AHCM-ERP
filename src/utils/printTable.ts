/**
 * printTable.ts
 * Universal Print Utility to strictly isolate and print only the concerned table.
 * 
 * Sets body.printing-concerned-table and marks the target container with .print-concerned-table,
 * hiding all global navigation, headers, sidebars, buttons, toolbars, and unrelated DOM nodes.
 */

export const printConcernedTable = (
  containerIdOrElement?: string | HTMLElement | null,
  customTitle?: string
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

  if (target) {
    target.classList.add('print-concerned-table');
    target.classList.add('active-printing-target');
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
      if (customTitle) {
        document.title = originalTitle;
      }
    }, 1200);
  });
};
