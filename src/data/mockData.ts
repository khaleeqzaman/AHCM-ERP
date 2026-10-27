import { DemandDocument, PurchaseDocument } from '../types';

export const initialDemands: DemandDocument[] = [
  {
    id: 'dem-001',
    demandType: 'Daily',
    category: 'New',
    date: '2026-10-27',
    referenceNo: 'DEM-2026-1001',
    items: [
      { id: 'di-1', srNo: 1, itemName: 'Stainless Steel Fasteners Grade 316', quantity: 200, rate: 1.5, amount: 300 },
      { id: 'di-2', srNo: 2, itemName: 'Hex Cap Screws M10 x 40mm', quantity: 150, rate: 0.8, amount: 120 },
      { id: 'di-3', srNo: 3, itemName: 'Silicon Sealant Cartridges 300ml', quantity: 20, rate: 6.5, amount: 130 },
    ],
    totalAmount: 550,
    status: 'Submitted for Approval',
    updatedAt: '2026-10-27 08:30',
  },
  {
    id: 'dem-002',
    demandType: 'Monthly',
    category: 'R&M',
    date: '2026-10-26',
    referenceNo: 'DEM-2026-1002',
    items: [
      { id: 'di-4', srNo: 1, itemName: 'Hydraulic Pump Filter Element', quantity: 8, rate: 85, amount: 680 },
      { id: 'di-5', srNo: 2, itemName: 'Industrial Drive V-Belt B-68', quantity: 12, rate: 24, amount: 288 },
      { id: 'di-6', srNo: 3, itemName: 'Lubricating Grease High-Temp 15kg', quantity: 3, rate: 110, amount: 330 },
    ],
    totalAmount: 1298,
    status: 'Finalized',
    updatedAt: '2026-10-26 14:15',
  },
  {
    id: 'dem-003',
    demandType: 'Daily',
    category: 'New',
    date: '2026-10-27',
    referenceNo: 'DEM-2026-1003',
    items: [
      { id: 'di-7', srNo: 1, itemName: 'Soldering Wire Rosin Core 1mm 500g', quantity: 10, rate: 18.5, amount: 185 },
      { id: 'di-8', srNo: 2, itemName: 'Desoldering Braid Copper 2.5mm', quantity: 25, rate: 3.2, amount: 80 },
    ],
    totalAmount: 265,
    status: 'Draft',
    updatedAt: '2026-10-27 09:10',
  },
  {
    id: 'dem-004',
    demandType: 'Monthly',
    category: 'New',
    date: '2026-10-25',
    referenceNo: 'DEM-2026-1004',
    items: [
      { id: 'di-9', srNo: 1, itemName: 'Industrial Pneumatic Cylinder 50mm Bore', quantity: 4, rate: 145, amount: 580 },
    ],
    totalAmount: 580,
    status: 'Approved',
    updatedAt: '2026-10-25 16:40',
  },
];

export const initialPurchases: PurchaseDocument[] = [
  {
    id: 'pur-001',
    paymentType: 'Cheque',
    date: '2026-10-27',
    reference: 'PUR-2026-2001',
    items: [
      { id: 'pi-1', srNo: 1, companyName: 'Apex Hardware Supplies Ltd', itemName: 'Heavy Duty C-Clamps 8-inch', quantity: 15, amount: 450, remarks: 'Immediate delivery dock 2' },
      { id: 'pi-2', srNo: 2, companyName: 'Apex Hardware Supplies Ltd', itemName: 'Steel Wire Rope 10mm 100m spool', quantity: 2, amount: 320, remarks: 'Certified test certificate included' },
    ],
    totalAmount: 770,
    status: 'Submitted for Approval',
    updatedAt: '2026-10-27 08:45',
  },
  {
    id: 'pur-002',
    paymentType: 'Cash',
    date: '2026-10-26',
    reference: 'PUR-2026-2002',
    items: [
      { id: 'pi-3', srNo: 1, companyName: 'City Industrial Lubricants', itemName: 'Compressor Synthetic Oil 20L', quantity: 4, amount: 480, remarks: 'Over-the-counter emergency pickup' },
      { id: 'pi-4', srNo: 2, companyName: 'Delta Tools & Bearing Co', itemName: 'Deep Groove Ball Bearing 6205-2RS', quantity: 10, amount: 160, remarks: 'Fitted into Line 4 gearbox' },
    ],
    totalAmount: 640,
    status: 'Finalized',
    updatedAt: '2026-10-26 15:20',
  },
  {
    id: 'pur-003',
    paymentType: 'Cheque',
    date: '2026-10-27',
    reference: 'PUR-2026-2003',
    items: [
      { id: 'pi-5', srNo: 1, companyName: 'Precision Electricals Corp', itemName: 'Circuit Breaker 3-Phase 63A', quantity: 5, amount: 375, remarks: 'Main distribution panel upgrade' },
    ],
    totalAmount: 375,
    status: 'Draft',
    updatedAt: '2026-10-27 09:15',
  },
  {
    id: 'pur-004',
    paymentType: 'Cash',
    date: '2026-10-24',
    reference: 'PUR-2026-2004',
    items: [
      { id: 'pi-6', srNo: 1, companyName: 'General Packing Depot', itemName: 'Stretch Film Pallet Wrap Roll', quantity: 30, amount: 420, remarks: 'Invoice settled in cash' },
    ],
    totalAmount: 420,
    status: 'Approved',
    updatedAt: '2026-10-24 17:00',
  },
];
