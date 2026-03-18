'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import fas from './fas.png';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Lock,
  PlayCircle,
  PauseCircle,
  Wrench,
  User,
  ClipboardCheck,
  AlertCircle,
  Download,
  X,
  Search,
  Eye,
  Save,
  RotateCcw,
  Calendar,
  Package,
  Ban,
} from 'lucide-react';
import { getAllRecords, createRecord, updateRecord, deleteRecord } from '@/services/firebase';

// ────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────

type SalesOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'In Production'
  | 'QC Pending'
  | 'QC Completed'
  | 'Ready for Dispatch'
  | 'Delivered'
  | 'Invoice Generated'
  | 'Closed';

type ProductionJobStatus = 'notstarted' | 'running' | 'paused' | 'completed';
type QCStatus = 'pending' | 'in-progress' | 'completed';

interface ProductItem {
  category: string;
  group: string;
  hsn: string;
  productCode: string;
  size: {
    height: number;
    heightUnit: string;
    length: number;
    lengthUnit: string;
    weight: number;
    weightUnit: string;
    width: number;
    widthUnit: string;
  };
  stockQty: number;
  type: string;
  unit: string;
  unitPrice: number;
}

interface Product {
  id: string;
  createdAt: number;
  items: ProductItem[];
}

interface Quotation {
  id: string;
  quoteNumber?: string;
  customerId?: string;
  customerName?: string;
  customerGST?: string;
  customerPAN?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentTerms?: string;
  deliveryTerm?: string;
  dispatchMode?: string;
  modeOfDispatch?: string;
  lineItems?: any[];
  grandTotal?: number;
  subtotal?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  transportCharge?: number;
  transportChargePercent?: number;
  status?: string;
  quoteDate?: string;
  currency?: string;
}

interface SalesOrder {
  id: string;
  soNumber: string;
  quotationId: string;
  quotationNumber?: string;
  customerId: string;
  customerName: string;
  customerGST?: string;
  customerPAN?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  soDate: string;
  soTimestamp: number;
  deliveryDate?: string;
  paymentTerms?: string;
  dispatchMode?: string;
  instructions?: string;
  items: any[];
  okQty: number;
  notOkQty: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  cgstPercent: number;
  sgstPercent: number;
  transportCharge: number;
  transportChargePercent: number;
  grandTotal: number;
  currency?: string;
  status: SalesOrderStatus;
  productionStatus: 'pending' | 'inprogress' | 'completed';
  qcStatus: 'pending' | 'inprogress' | 'completed';
  invoiceStatus: 'notgenerated' | 'partial' | 'generated';
  deliveryStatus: 'notdispatched' | 'intransit' | 'delivered';
  createdAt: number;
  updatedAt?: number;
  confirmedAt?: number;
}

interface ProductionJob {
  id: string;
  orderId: string;
  soNumber: string;
  productId: string;
  productName: string;
  qty: number;
  status: ProductionJobStatus;
  operatorName?: string;
  machineId?: string;
  createdAt?: number;
  startTime?: string;
}

interface Inspection {
  id: string;
  orderId: string;
  jobId: string;
  productId?: string;
  productName?: string;
  qcStatus?: QCStatus;
  okQty?: number;
  notOkQty?: number;
  inspectorName?: string;
  rejectionReason?: string;
  remarks?: string;
  inspectionDate?: string;
}

interface ManualOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productDescription: string;
  category: string;
  group: string;
  type: string;
  hsnCode: string;
  qty: number;
  unit: string;
  unitRate: number;
  taxPercentage: number;
  amount: number;
  taxAmount: number;
  netAmount: number;
  size?: {
    length: number;
    lengthUnit: string;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    weight: number;
    weightUnit: string;
  };
  stockQty?: number;
}

// ── NEW: Inventory Item type ──
interface InventoryItem {
  id: string;
  orderId: string;
  soNumber: string;
  jobId: string;
  customerId: string;
  customerName: string;
  productId: string;
  productCode: string;
  productName: string;
  productDescription: string;
  category: string;
  group: string;
  type: string;
  hsnCode: string;
  unit: string;
  unitRate: number;
  orderedQty: number;
  okQty: number;
  notOkQty: number;
  size?: {
    length: number;
    lengthUnit: string;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    weight: number;
    weightUnit: string;
  };
  updatedAt: number;
  createdAt: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

const DEFAULT_STATUS: SalesOrderStatus = 'Pending';
const ITEMS_PER_PAGE = 12;
const fmt = (num: number) => Number(num || 0).toFixed(2);

const numberToWords = (num: number, currency: string): string => {
  if (currency !== "INR") return "";

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  const convertTwoDigit = (n: number): string => {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + units[n % 10] : "");
  };

  if (integerPart === 0 && decimalPart === 0) return "Zero Rupees Only";

  let word = "";
  let part = Math.floor(integerPart / 10000000);
  if (part > 0) word += convertTwoDigit(part) + " Crore ";
  part = Math.floor(integerPart / 100000) % 100;
  if (part > 0) word += convertTwoDigit(part) + " Lakh ";
  part = Math.floor(integerPart / 1000) % 100;
  if (part > 0) word += convertTwoDigit(part) + " Thousand ";
  part = Math.floor(integerPart / 100) % 10;
  if (part > 0) word += units[part] + " Hundred ";
  part = integerPart % 100;
  if (part > 0) word += convertTwoDigit(part) + " ";

  let result = word.trim() + " Rupees";
  if (decimalPart > 0) result += " and " + convertTwoDigit(decimalPart) + " Paise";
  return result + " Only";
};

// ────────────────────────────────────────────────
// PRINT TEMPLATES (unchanged)
// ────────────────────────────────────────────────

const OrderAcknowledgementPrintTemplate = ({ order }: { order: SalesOrder }) => {
  const currencySymbol = CURRENCY_SYMBOLS[order.currency || 'INR'];
  const symbol = currencySymbol || '₹';

  const safeFormatDate = (value?: any, fallback = 'NA') => {
    const d = value ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? format(d, 'dd/MM/yyyy') : fallback;
  };

  const lineItems = order.items || [];
  const pages: any[][] = [];
  for (let i = 0; i < lineItems.length; i += ITEMS_PER_PAGE) {
    pages.push(lineItems.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const totalPages = pages.length;

  const CompanyHeader = () => (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '3px solid #000',
          background: '#ffffff',
          gap: '12px',
        }}
      >
        <img src={fas} alt="FAS Logo" style={{ width: '75px', height: 'auto', flexShrink: 0 }} crossOrigin="anonymous" />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#000', lineHeight: 1.2 }}>
            Fluoro Automation Seals Pvt Ltd
          </h1>
          <p style={{ fontSize: '9.5px', margin: '3px 0 0 0', color: '#000', lineHeight: 1.3, fontWeight: '600' }}>
            3/180, Rajiv Gandhi Road, Mettukuppam, Chennai Tamil Nadu 600097 India<br />
            Phone: +91-841175097 | Email: fas@fluoroautomationseals.com
          </p>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 16px',
          background: '#e5e7eb',
          borderBottom: '3px solid #000',
          fontSize: '9.5px',
          fontWeight: '800',
          gap: '45px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '900' }}>GSTIN:</span>
          <span>33AAECF2716M1ZO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '900' }}>PAN:</span>
          <span>AAECF2716M</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '900' }}>CIN:</span>
          <span>U25209TN2020PTC138498</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .page-break { page-break-after: always; break-after: page; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .order-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .order-table td, .order-table th {
          border: 1.5px solid #000;
          padding: 5px 6px;
          vertical-align: middle;
          font-size: 9px;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .order-table th {
          background: #e5e7eb;
          font-weight: 900;
          padding: 6px 7px;
          text-align: center;
          line-height: 1.2;
        }
        .order-table tbody tr { min-height: 30px; }
        .order-table .description-cell {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 0;
        }
      `}</style>

      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className={pageIndex < totalPages - 1 ? 'page-break' : ''}
          style={{
            width: '297mm',
            height: '210mm',
            background: '#ffffff',
            margin: 0,
            padding: 0,
            fontFamily: 'Arial, sans-serif',
            color: '#000',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              border: '3px solid #000',
              height: '210mm',
              width: '297mm',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <CompanyHeader />
            </div>

            <div style={{ flex: 1, padding: '10px 16px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {pageIndex === 0 && (
                <>
                  <h2 style={{ textAlign: 'center', fontSize: '17px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '1.5px' }}>
                    ORDER ACKNOWLEDGEMENT
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '8.5px', marginBottom: '10px', flexShrink: 0 }}>
                    <div>
                      <p style={{ fontWeight: '900', fontSize: '10px', textDecoration: 'underline', margin: '0 0 3px 0' }}>Customer:</p>
                      <p style={{ fontWeight: '900', fontSize: '10px', margin: '0 0 4px 0' }}>{order.customerName || '—'}</p>
                      <div style={{ fontSize: '7.5px', fontWeight: '700' }}>
                        <p style={{ margin: '1.5px 0' }}><strong>GSTIN:</strong> {order.customerGST || '—'}</p>
                        <p style={{ margin: '1.5px 0' }}><strong>PAN:</strong> {order.customerPAN || '—'}</p>
                      </div>
                    </div>
                    <div>
                      {order.deliveryDate && (
                        <p style={{ margin: '1.5px 0', fontWeight: '700' }}>
                          <strong>Delivery Date:</strong> {safeFormatDate(order.deliveryDate)}
                        </p>
                      )}
                      {order.paymentTerms && (
                        <p style={{ margin: '1.5px 0', fontWeight: '700' }}>
                          <strong>Payment Terms:</strong> {order.paymentTerms}
                        </p>
                      )}
                      {order.dispatchMode && (
                        <p style={{ margin: '1.5px 0', fontWeight: '700' }}>
                          <strong>Dispatch Mode:</strong> {order.dispatchMode}
                        </p>
                      )}
                    </div>
                    <div>
                      <table style={{ width: '100%', fontSize: '8.5px', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ paddingRight: '10px', fontWeight: '700', padding: '2px 0', verticalAlign: 'top' }}>SO No.:</td>
                            <td style={{ fontWeight: '900', fontSize: '12px', padding: '2px 0' }}>{order.soNumber}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>SO Date:</td>
                            <td style={{ padding: '2px 0', fontWeight: '800' }}>{safeFormatDate(order.soDate || order.createdAt)}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>Currency:</td>
                            <td style={{ fontWeight: '900', padding: '2px 0' }}>{order.currency || 'INR'} {symbol}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>Quotation:</td>
                            <td style={{ padding: '2px 0', fontWeight: '800' }}>{order.quotationNumber || '—'}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>Status:</td>
                            <td style={{ padding: '2px 0', fontWeight: '900', color: '#1d4ed8' }}>{order.status}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {pageIndex > 0 && (
                <div style={{ marginBottom: '10px', paddingTop: '8px', flexShrink: 0 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '900', textAlign: 'center', marginBottom: '5px' }}>
                    ORDER ACKNOWLEDGEMENT - {order.soNumber} (Continued)
                  </h3>
                  <p style={{ fontSize: '9px', textAlign: 'center', color: '#666', marginBottom: '8px' }}>
                    Page {pageIndex + 1} of {totalPages}
                  </p>
                </div>
              )}

              <div style={{ flex: 1, marginBottom: '10px', minHeight: 0, overflow: 'hidden' }}>
                <table className="order-table">
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '27%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '13%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>SKU / Code</th>
                      <th>Description</th>
                      <th>HSN</th>
                      <th>UOM</th>
                      <th>Qty</th>
                      <th>Rate<br />({symbol})</th>
                      <th>Amount<br />({symbol})</th>
                      <th>Tax<br />%</th>
                      <th>Net<br />({symbol})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item: any, i: number) => {
                      const globalIndex = pageIndex * ITEMS_PER_PAGE + i;
                      return (
                        <tr key={i}>
                          <td style={{ textAlign: 'center', fontWeight: '800' }}>{globalIndex + 1}</td>
                          <td style={{ fontWeight: '800', fontSize: '8px', wordWrap: 'break-word' }}>{item.productCode || '—'}</td>
                          <td className="description-cell" style={{ textAlign: 'left', fontWeight: '700', fontSize: '8px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                            {item.productDescription || item.productName || '—'}
                            {item.size && (
                              <div style={{ fontSize: '6.5px', color: '#4b5563', marginTop: '2px' }}>
                                L:{item.size.length}{item.size.lengthUnit} × W:{item.size.width}{item.size.widthUnit} × H:{item.size.height}{item.size.heightUnit} × Wt:{item.size.weight}{item.size.weightUnit}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: '700', textAlign: 'center', fontSize: '8px' }}>{item.hsnCode || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: '700' }}>{item.unit || 'Nos'}</td>
                          <td style={{ textAlign: 'right', fontWeight: '800' }}>{Number(item.qty || item.quantity || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(item.unitRate || item.rate || 0)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '800' }}>{fmt(item.amount || 0)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }}>{Number(item.taxPercentage || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '900', background: '#f9fafb' }}>{fmt(item.netAmount || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pageIndex === totalPages - 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flexShrink: 0 }}>
                  <div style={{ fontSize: '8.5px' }}>
                    {order.instructions && (
                      <div style={{ borderTop: '2px solid #000', paddingTop: '5px', marginBottom: '10px' }}>
                        <p style={{ lineHeight: 1.4, margin: 0, fontWeight: '700' }}>
                          <strong style={{ fontWeight: '900' }}>Instructions:</strong> {order.instructions}
                        </p>
                      </div>
                    )}
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontWeight: '900', fontSize: '10px', marginBottom: '20px' }}>For Fluoro Automation Seals Pvt Ltd</p>
                      <div style={{ borderTop: '2px solid #000', width: '150px', paddingTop: '5px' }}>
                        <p style={{ fontWeight: '900', fontSize: '8.5px' }}>Authorised Signatory</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <table style={{ marginLeft: 'auto', borderTop: '2px solid #000', fontSize: '10px', width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>Subtotal</td>
                          <td style={{ fontWeight: '900', paddingLeft: '14px', width: '95px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                            {symbol}{fmt(order.subtotal || 0)}
                          </td>
                        </tr>
                        {order.currency === 'INR' && order.cgstAmount > 0 && (
                          <tr>
                            <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>
                              CGST @ {order.cgstPercent}%
                            </td>
                            <td style={{ fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                              {symbol}{fmt(order.cgstAmount)}
                            </td>
                          </tr>
                        )}
                        {order.currency === 'INR' && order.sgstAmount > 0 && (
                          <tr>
                            <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>
                              SGST @ {order.sgstPercent}%
                            </td>
                            <td style={{ fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                              {symbol}{fmt(order.sgstAmount)}
                            </td>
                          </tr>
                        )}
                        {order.transportCharge > 0 && (
                          <tr>
                            <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>
                              Transport Charge @ {order.transportChargePercent}%
                            </td>
                            <td style={{ fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                              {symbol}{fmt(order.transportCharge)}
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderTop: '2px solid #000' }}>
                          <td style={{ paddingRight: '14px', paddingTop: '6px', paddingBottom: '6px', fontSize: '11px', fontWeight: '900', textAlign: 'right' }}>
                            Total Amount ({order.currency || 'INR'})
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '6px', paddingBottom: '6px' }}>
                            {symbol}{fmt(order.grandTotal || 0)}
                          </td>
                        </tr>
                        {order.currency === 'INR' && (
                          <tr>
                            <td colSpan={2} style={{ paddingTop: '6px', paddingBottom: '4px', fontSize: '9px', fontWeight: '700', textAlign: 'right' }}>
                              Amount in Words: {numberToWords(order.grandTotal || 0, order.currency || 'INR')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

const ProformaInvoicePrintTemplate = ({ order }: { order: SalesOrder }) => {
  const currencySymbol = CURRENCY_SYMBOLS[order.currency || 'INR'];
  const symbol = currencySymbol || '₹';

  const safeFormatDate = (value?: any, fallback = 'NA') => {
    const d = value ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? format(d, 'dd/MM/yyyy') : fallback;
  };

  const lineItems = order.items || [];
  const pages: any[][] = [];
  for (let i = 0; i < lineItems.length; i += ITEMS_PER_PAGE) {
    pages.push(lineItems.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const totalPages = pages.length;

  const CompanyHeader = () => (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '3px solid #000',
          background: '#ffffff',
          gap: '12px',
        }}
      >
        <img src={fas} alt="FAS Logo" style={{ width: '75px', height: 'auto', flexShrink: 0 }} crossOrigin="anonymous" />
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: '#000', lineHeight: 1.2 }}>
            Fluoro Automation Seals Pvt Ltd
          </h1>
          <p style={{ fontSize: '9.5px', margin: '3px 0 0 0', color: '#000', lineHeight: 1.3, fontWeight: '600' }}>
            3/180, Rajiv Gandhi Road, Mettukuppam, Chennai Tamil Nadu 600097 India<br />
            Phone: +91-841175097 | Email: fas@fluoroautomationseals.com
          </p>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 16px',
          background: '#e5e7eb',
          borderBottom: '3px solid #000',
          fontSize: '9.5px',
          fontWeight: '800',
          gap: '45px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '900' }}>GSTIN:</span>
          <span>33AAECF2716M1ZO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '900' }}>PAN:</span>
          <span>AAECF2716M</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontWeight: '900' }}>CIN:</span>
          <span>U25209TN2020PTC138498</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
          .page-break { page-break-after: always; break-after: page; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .proforma-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .proforma-table td, .proforma-table th {
          border: 1.5px solid #000;
          padding: 5px 6px;
          vertical-align: middle;
          font-size: 9px;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .proforma-table th {
          background: #e5e7eb;
          font-weight: 900;
          padding: 6px 7px;
          text-align: center;
          line-height: 1.2;
        }
        .proforma-table tbody tr { min-height: 30px; }
        .proforma-table .description-cell {
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          max-width: 0;
        }
      `}</style>

      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className={pageIndex < totalPages - 1 ? 'page-break' : ''}
          style={{
            width: '297mm',
            height: '210mm',
            background: '#ffffff',
            margin: 0,
            padding: 0,
            fontFamily: 'Arial, sans-serif',
            color: '#000',
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              border: '3px solid #000',
              height: '210mm',
              width: '297mm',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <CompanyHeader />
            </div>

            <div style={{ flex: 1, padding: '10px 16px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
              {pageIndex === 0 && (
                <>
                  <h2 style={{ textAlign: 'center', fontSize: '17px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '1.5px' }}>
                    PROFORMA INVOICE
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '8.5px', marginBottom: '10px', flexShrink: 0 }}>
                    <div>
                      <p style={{ fontWeight: '900', fontSize: '10px', textDecoration: 'underline', margin: '0 0 3px 0' }}>Customer:</p>
                      <p style={{ fontWeight: '900', fontSize: '10px', margin: '0 0 4px 0' }}>{order.customerName || '—'}</p>
                      <div style={{ fontSize: '7.5px', fontWeight: '700' }}>
                        <p style={{ margin: '1.5px 0' }}><strong>GSTIN:</strong> {order.customerGST || '—'}</p>
                        <p style={{ margin: '1.5px 0' }}><strong>PAN:</strong> {order.customerPAN || '—'}</p>
                      </div>
                    </div>
                    <div>
                      {order.deliveryDate && (
                        <p style={{ margin: '1.5px 0', fontWeight: '700' }}>
                          <strong>Delivery Date:</strong> {safeFormatDate(order.deliveryDate)}
                        </p>
                      )}
                      {order.paymentTerms && (
                        <p style={{ margin: '1.5px 0', fontWeight: '700' }}>
                          <strong>Payment Terms:</strong> {order.paymentTerms}
                        </p>
                      )}
                      {order.dispatchMode && (
                        <p style={{ margin: '1.5px 0', fontWeight: '700' }}>
                          <strong>Dispatch Mode:</strong> {order.dispatchMode}
                        </p>
                      )}
                    </div>
                    <div>
                      <table style={{ width: '100%', fontSize: '8.5px', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ paddingRight: '10px', fontWeight: '700', padding: '2px 0', verticalAlign: 'top' }}>PI No.:</td>
                            <td style={{ fontWeight: '900', fontSize: '12px', padding: '2px 0' }}>PI-{order.soNumber}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>PI Date:</td>
                            <td style={{ padding: '2px 0', fontWeight: '800' }}>{safeFormatDate(order.soDate || order.createdAt)}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>Currency:</td>
                            <td style={{ fontWeight: '900', padding: '2px 0' }}>{order.currency || 'INR'} {symbol}</td>
                          </tr>
                          <tr>
                            <td style={{ paddingRight: '10px', padding: '2px 0', verticalAlign: 'top', fontWeight: '700' }}>Reference SO:</td>
                            <td style={{ padding: '2px 0', fontWeight: '800' }}>{order.soNumber}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {pageIndex > 0 && (
                <div style={{ marginBottom: '10px', paddingTop: '8px', flexShrink: 0 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '900', textAlign: 'center', marginBottom: '5px' }}>
                    PROFORMA INVOICE - PI-{order.soNumber} (Continued)
                  </h3>
                  <p style={{ fontSize: '9px', textAlign: 'center', color: '#666', marginBottom: '8px' }}>
                    Page {pageIndex + 1} of {totalPages}
                  </p>
                </div>
              )}

              <div style={{ flex: 1, marginBottom: '10px', minHeight: 0, overflow: 'hidden' }}>
                <table className="proforma-table">
                  <colgroup>
                    <col style={{ width: '3%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '27%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '6%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '13%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Sr.</th>
                      <th>SKU / Code</th>
                      <th>Description</th>
                      <th>HSN</th>
                      <th>UOM</th>
                      <th>Qty</th>
                      <th>Rate<br />({symbol})</th>
                      <th>Amount<br />({symbol})</th>
                      <th>Tax<br />%</th>
                      <th>Net<br />({symbol})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item: any, i: number) => {
                      const globalIndex = pageIndex * ITEMS_PER_PAGE + i;
                      return (
                        <tr key={i}>
                          <td style={{ textAlign: 'center', fontWeight: '800' }}>{globalIndex + 1}</td>
                          <td style={{ fontWeight: '800', fontSize: '8px', wordWrap: 'break-word' }}>{item.productCode || '—'}</td>
                          <td className="description-cell" style={{ textAlign: 'left', fontWeight: '700', fontSize: '8px', wordWrap: 'break-word', whiteSpace: 'normal' }}>
                            {item.productDescription || item.productName || '—'}
                            {item.size && (
                              <div style={{ fontSize: '6.5px', color: '#4b5563', marginTop: '2px' }}>
                                L:{item.size.length}{item.size.lengthUnit} × W:{item.size.width}{item.size.widthUnit} × H:{item.size.height}{item.size.heightUnit} × Wt:{item.size.weight}{item.size.weightUnit}
                              </div>
                            )}
                          </td>
                          <td style={{ fontWeight: '700', textAlign: 'center', fontSize: '8px' }}>{item.hsnCode || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: '700' }}>{item.unit || 'Nos'}</td>
                          <td style={{ textAlign: 'right', fontWeight: '800' }}>{Number(item.qty || item.quantity || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }}>{fmt(item.unitRate || item.rate || 0)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '800' }}>{fmt(item.amount || 0)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700' }}>{Number(item.taxPercentage || 0).toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '900', background: '#f9fafb' }}>{fmt(item.netAmount || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pageIndex === totalPages - 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flexShrink: 0 }}>
                  <div style={{ fontSize: '8.5px' }}>
                    <div style={{ borderTop: '2px solid #000', paddingTop: '5px', marginBottom: '10px' }}>
                      <p style={{ fontWeight: '900', fontSize: '9px', marginBottom: '4px' }}>Bank Details for Payment:</p>
                      <p style={{ margin: '1px 0', fontWeight: '700' }}><strong>Bank:</strong> HDFC Bank</p>
                      <p style={{ margin: '1px 0', fontWeight: '700' }}><strong>A/C:</strong> 50200012345678</p>
                      <p style={{ margin: '1px 0', fontWeight: '700' }}><strong>IFSC:</strong> HDFC0001234</p>
                      <p style={{ margin: '1px 0', fontWeight: '700' }}><strong>Branch:</strong> Chennai Main</p>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ fontWeight: '900', fontSize: '10px', marginBottom: '20px' }}>For Fluoro Automation Seals Pvt Ltd</p>
                      <div style={{ borderTop: '2px solid #000', width: '150px', paddingTop: '5px' }}>
                        <p style={{ fontWeight: '900', fontSize: '8.5px' }}>Authorised Signatory</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <table style={{ marginLeft: 'auto', borderTop: '2px solid #000', fontSize: '10px', width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>Subtotal</td>
                          <td style={{ fontWeight: '900', paddingLeft: '14px', width: '95px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                            {symbol}{fmt(order.subtotal || 0)}
                          </td>
                        </tr>
                        {order.currency === 'INR' && order.cgstAmount > 0 && (
                          <tr>
                            <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>
                              CGST @ {order.cgstPercent}%
                            </td>
                            <td style={{ fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                              {symbol}{fmt(order.cgstAmount)}
                            </td>
                          </tr>
                        )}
                        {order.currency === 'INR' && order.sgstAmount > 0 && (
                          <tr>
                            <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>
                              SGST @ {order.sgstPercent}%
                            </td>
                            <td style={{ fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                              {symbol}{fmt(order.sgstAmount)}
                            </td>
                          </tr>
                        )}
                        {order.transportCharge > 0 && (
                          <tr>
                            <td style={{ paddingRight: '14px', paddingTop: '4px', paddingBottom: '4px', textAlign: 'right', fontWeight: '800' }}>
                              Transport Charge @ {order.transportChargePercent}%
                            </td>
                            <td style={{ fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '4px', paddingBottom: '4px' }}>
                              {symbol}{fmt(order.transportCharge)}
                            </td>
                          </tr>
                        )}
                        <tr style={{ borderTop: '2px solid #000' }}>
                          <td style={{ paddingRight: '14px', paddingTop: '6px', paddingBottom: '6px', fontSize: '11px', fontWeight: '900', textAlign: 'right' }}>
                            Invoice Total ({order.currency || 'INR'})
                          </td>
                          <td style={{ fontSize: '13px', fontWeight: '900', paddingLeft: '14px', textAlign: 'right', paddingTop: '6px', paddingBottom: '6px' }}>
                            {symbol}{fmt(order.grandTotal || 0)}
                          </td>
                        </tr>
                        {order.currency === 'INR' && (
                          <tr>
                            <td colSpan={2} style={{ paddingTop: '6px', paddingBottom: '4px', fontSize: '9px', fontWeight: '700', textAlign: 'right' }}>
                              Amount in Words: {numberToWords(order.grandTotal || 0, order.currency || 'INR')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

// ────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────

// ── Product Search Combobox ──
function ProductSearchCombobox({
  value,
  products,
  onChange,
}: {
  value: string;
  products: (ProductItem & { parentId: string })[];
  onChange: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.productCode === value);

  const filtered = search.trim()
    ? products.filter((p) => {
      const q = search.toLowerCase();
      return (
        p.productCode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.group?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q)
      );
    })
    : products;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => {
          setOpen((prev) => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected
            ? `${selected.productCode} — ${selected.category} / ${selected.group}`
            : 'Type to search product...'}
        </span>
        <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {/* Search input */}
          <div className="flex items-center border-b px-3 py-2 gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search by code, category, group, type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No products match "{search}"
              </div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.productCode}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-2 ${p.productCode === value ? 'bg-accent/60 font-medium' : ''
                    }`}
                  onClick={() => handleSelect(p.productCode)}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono font-semibold text-blue-700 text-xs">
                      {p.productCode}
                    </span>
                    <span className="mx-1.5 text-muted-foreground">—</span>
                    <span>{p.category}</span>
                    {p.group && (
                      <>
                        <span className="mx-1 text-muted-foreground">/</span>
                        <span className="text-muted-foreground">{p.group}</span>
                      </>
                    )}
                    {p.type && (
                      <span className="ml-1 text-xs text-muted-foreground">({p.type})</span>
                    )}
                    <span className="ml-2 text-xs text-muted-foreground">
                      Stock: {p.stockQty} {p.unit}
                    </span>
                  </div>
                  {p.productCode === value && (
                    <CheckCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="border-t px-3 py-1.5 text-xs text-muted-foreground">
              {filtered.length} of {products.length} products
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalesOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flattenedProducts, setFlattenedProducts] = useState<(ProductItem & { parentId: string })[]>([]);

  // ── NEW: inventory state ──
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelRemark, setCancelRemark] = useState('');
  const [cancellingOrder, setCancellingOrder] = useState<SalesOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [soNumber, setSoNumber] = useState('');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'oa' | 'proforma'>('oa');
  const [previewOrder, setPreviewOrder] = useState<SalesOrder | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [orderCreationType, setOrderCreationType] = useState<'quotation' | 'manual'>('quotation');
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [manualCurrency, setManualCurrency] = useState('INR');
  const [manualPaymentTerms, setManualPaymentTerms] = useState('');
  const [manualDispatchMode, setManualDispatchMode] = useState('');
  const [manualDeliveryDate, setManualDeliveryDate] = useState('');
  const [manualInstructions, setManualInstructions] = useState('');
  const [manualItems, setManualItems] = useState<ManualOrderItem[]>([]);

  const [manualCgstPercent, setManualCgstPercent] = useState<number | undefined>(undefined);
  const [manualSgstPercent, setManualSgstPercent] = useState<number | undefined>(undefined);
  const [manualIgstPercent, setManualIgstPercent] = useState<number | undefined>(undefined);
  const [manualTransportChargePercent, setManualTransportChargePercent] = useState<number>(0);

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [tempJobStatus, setTempJobStatus] = useState<ProductionJobStatus>('notstarted');
  const [tempQCStatus, setTempQCStatus] = useState<QCStatus>('pending');
  const [tempOkQty, setTempOkQty] = useState<number | string>('');
  const [tempNotOkQty, setTempNotOkQty] = useState<number | string>('');

  const [isTrackingEditOpen, setIsTrackingEditOpen] = useState(false);
  const [trackingSelectedOrder, setTrackingSelectedOrder] = useState<SalesOrder | null>(null);

  const openTrackingEdit = (order: SalesOrder) => {
    setTrackingSelectedOrder(order);
    setIsTrackingEditOpen(true);
  };


  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-populate GST fields when customer is selected
  useEffect(() => {
    if (!manualCustomerId) {
      setManualCgstPercent(undefined);
      setManualSgstPercent(undefined);
      setManualIgstPercent(undefined);
      return;
    }
    const customer = customers.find((c: any) => c.id === manualCustomerId);
    if (customer) {
      setManualCgstPercent(customer.cgst ? Number(customer.cgst) : undefined);
      setManualSgstPercent(customer.sgst ? Number(customer.sgst) : undefined);
      setManualIgstPercent(customer.igst ? Number(customer.igst) : undefined);
    }
  }, [manualCustomerId, customers]);

  useEffect(() => {
    let filtered = orders;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.soNumber?.toLowerCase().startsWith(query) ||
          order.customerName?.toLowerCase().includes(query)
      );
    }
    if (dateFilter) {
      filtered = filtered.filter((order) => {
        if (!order.soDate) return false;
        const orderDate = format(new Date(order.soDate), 'yyyy-MM-dd');
        return orderDate === dateFilter;
      });
    }
    setFilteredOrders(filtered);
  }, [searchQuery, dateFilter, orders]);

  const hydrateOrder = (raw: any): SalesOrder => {
    const safeStatus = (raw.status as SalesOrderStatus) || DEFAULT_STATUS;
    return {
      id: raw.id,
      soNumber: raw.soNumber || '',
      quotationId: raw.quotationId || '',
      quotationNumber: raw.quotationNumber || '',
      customerId: raw.customerId || '',
      customerName: raw.customerName || 'Unknown Customer',
      customerGST: raw.customerGST || '',
      customerPAN: raw.customerPAN || '',
      customerAddress: raw.customerAddress || '',
      customerPhone: raw.customerPhone || '',
      customerEmail: raw.customerEmail || '',
      soDate: raw.soDate || new Date(raw.createdAt || Date.now()).toISOString().split('T')[0],
      soTimestamp: raw.soTimestamp || raw.createdAt || Date.now(),
      deliveryDate: raw.deliveryDate || '',
      paymentTerms: raw.paymentTerms || '',
      dispatchMode: raw.dispatchMode || '',
      instructions: raw.instructions || '',
      items: raw.items || raw.lineItems || [],
      okQty: Number(raw.okQty) || 0,
      notOkQty: Number(raw.notOkQty) || 0,
      subtotal: Number(raw.subtotal) || 0,
      cgstAmount: Number(raw.cgstAmount) || 0,
      sgstAmount: Number(raw.sgstAmount) || 0,
      cgstPercent: Number(raw.cgstPercent) || 0,
      sgstPercent: Number(raw.sgstPercent) || 0,
      transportCharge: Number(raw.transportCharge) || 0,
      transportChargePercent: Number(raw.transportChargePercent) || 0,
      grandTotal: Number(raw.grandTotal) || 0,
      currency: raw.currency || 'INR',
      status: safeStatus,
      productionStatus: raw.productionStatus || 'pending',
      qcStatus: raw.qcStatus || 'pending',
      invoiceStatus: raw.invoiceStatus || 'notgenerated',
      deliveryStatus: raw.deliveryStatus || 'notdispatched',
      createdAt: raw.createdAt || Date.now(),
      updatedAt: raw.updatedAt,
      confirmedAt: raw.confirmedAt,
    };
  };

  const loadAllData = async () => {
    try {
      const [oaData, quotationsData, jobsData, inspectionsData, customersData, productsData, inventoryData] =
        await Promise.all([
          getAllRecords('sales/orderAcknowledgements'),
          getAllRecords('sales/quotations'),
          getAllRecords('production/jobs'),
          getAllRecords('quality/inspections'),
          getAllRecords('sales/customers'),
          getAllRecords('sales/products'),
          getAllRecords('inventory'), // ── NEW
        ]);

      const hydratedOrders = (oaData as any[]).map(hydrateOrder);
      const sortedOrders = hydratedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);

      const approved = (quotationsData as Quotation[])
        .filter((q) => q.status?.toLowerCase() === 'accepted')
        .map((q) => ({ ...q, currency: q.currency || 'INR' }));
      setQuotations(approved);

      setJobs(jobsData as ProductionJob[]);
      setInspections(inspectionsData as Inspection[]);
      setCustomers(customersData as any[]);

      // ── NEW: set inventory
      setInventoryItems((inventoryData as InventoryItem[]) || []);

      if (productsData) {
        const productsList = productsData as Product[];
        setProducts(productsList);
        const flattened: (ProductItem & { parentId: string })[] = [];
        productsList.forEach((product) => {
          if (product.items && Array.isArray(product.items)) {
            product.items.forEach((item) => {
              flattened.push({ ...item, parentId: product.id });
            });
          }
        });
        setFlattenedProducts(flattened);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
  };

  const formatAmount = (amount: number, currency: string = 'INR') => {
    if (currency === 'INR') {
      return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: SalesOrderStatus) => {
    const map: Record<SalesOrderStatus, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-blue-100 text-blue-800',
      'In Production': 'bg-purple-100 text-purple-800',
      'QC Pending': 'bg-orange-100 text-orange-800',
      'QC Completed': 'bg-teal-100 text-teal-800',
      'Ready for Dispatch': 'bg-indigo-100 text-indigo-800',
      'Delivered': 'bg-cyan-100 text-cyan-800',
      'Invoice Generated': 'bg-lime-100 text-lime-800',
      'Closed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const getProductionSummaryForOrder = (orderId: string) => {
    const orderJobs = jobs.filter((j) => j.orderId === orderId);
    let notStarted = 0, running = 0, paused = 0, completed = 0;
    orderJobs.forEach((job) => {
      const st = job.status || 'notstarted';
      if (st === 'completed') completed++;
      else if (st === 'running') running++;
      else if (st === 'paused') paused++;
      else notStarted++;
    });

    let overall: 'pending' | 'inprogress' | 'completed' = 'pending';
    if (orderJobs.length === 0) overall = 'pending';
    else if (completed === orderJobs.length) overall = 'completed';
    else if (running > 0 || paused > 0 || completed > 0) overall = 'inprogress';

    return { jobs: orderJobs, notStarted, running, paused, completed, total: orderJobs.length, overall };
  };

  const getInspectionForJob = (jobId: string): Inspection | undefined => {
    return inspections.find((i) => i.jobId === jobId);
  };

  const deriveOrderStatus = (order: SalesOrder): SalesOrderStatus => {
    const prod = getProductionSummaryForOrder(order.id);
    if (prod.total === 0) return order.status === 'Pending' ? 'Pending' : 'Confirmed';
    if (prod.overall === 'completed') {
      const orderInspections = inspections.filter((i) => i.orderId === order.id);
      const allQCdone = orderInspections.length === prod.total && orderInspections.every((i) => i.qcStatus === 'completed');
      return allQCdone ? 'QC Completed' : 'QC Pending';
    }
    return 'In Production';
  };

  const openEdit = (order: SalesOrder) => {
    setSelectedOrder(order);
    setSoNumber(order.soNumber);
    setDeliveryDate(order.deliveryDate || '');
    setInstructions(order.instructions || '');
    setIsEditOpen(true);
  };

  const openDelete = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const openCancel = (order: SalesOrder) => {
    setCancellingOrder(order);
    setCancelRemark('');
    setIsCancelOpen(true);
  };

  const openPreview = (order: SalesOrder, type: 'oa' | 'proforma') => {
    setPreviewOrder(order);
    setPreviewType(type);
    setIsPreviewOpen(true);
  };

  const generateSoNumber = () => {
    const base = orders.length + 1001;
    return `SO-${String(base).padStart(4, '0')}`;
  };

  const addManualItem = () => {
    const newItem: ManualOrderItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: '',
      productCode: '',
      productName: '',
      productDescription: '',
      category: '',
      group: '',
      type: '',
      hsnCode: '',
      qty: 1,
      unit: '',
      unitRate: 0,
      taxPercentage: 0,
      amount: 0,
      taxAmount: 0,
      netAmount: 0,
    };
    setManualItems([...manualItems, newItem]);
  };

  const removeManualItem = (itemId: string) => {
    setManualItems(manualItems.filter((item) => item.id !== itemId));
  };

  const updateManualItem = (itemId: string, field: keyof ManualOrderItem, value: any) => {
    setManualItems(
      manualItems.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };

        if (field === 'productCode' && value) {
          const product = flattenedProducts.find((p) => p.productCode === value);
          if (product) {
            updated.productId = product.parentId;
            updated.productCode = product.productCode;
            updated.productName = `${product.category} - ${product.group} (${product.productCode})`;
            updated.productDescription = `${product.category} | ${product.group} | ${product.type}`;
            updated.category = product.category;
            updated.group = product.group;
            updated.type = product.type;
            updated.hsnCode = product.hsn;
            updated.unit = product.unit;
            updated.unitRate = product.unitPrice;
            updated.size = product.size;
            updated.stockQty = product.stockQty;
          }
        }

        const qty = Number(updated.qty) || 0;
        const rate = Number(updated.unitRate) || 0;
        const tax = Number(updated.taxPercentage) || 0;
        updated.amount = qty * rate;
        updated.taxAmount = (updated.amount * tax) / 100;
        updated.netAmount = updated.amount + updated.taxAmount;

        return updated;
      })
    );
  };

  const calculateManualOrderTotals = () => {
    const subtotal = manualItems.reduce((sum, item) => sum + item.amount, 0);
    const cgst = (manualCurrency === 'INR' && manualCgstPercent !== undefined)
      ? subtotal * (manualCgstPercent / 100) : 0;
    const sgst = (manualCurrency === 'INR' && manualSgstPercent !== undefined)
      ? subtotal * (manualSgstPercent / 100) : 0;
    const igst = (manualCurrency === 'INR' && manualIgstPercent !== undefined)
      ? subtotal * (manualIgstPercent / 100) : 0;
    const transportCharge = subtotal * ((manualTransportChargePercent || 0) / 100);
    const grandTotal = subtotal + cgst + sgst + igst + transportCharge;
    return { subtotal, cgst, sgst, igst, transportCharge, grandTotal };
  };

  const handleCreateOrder = async () => {
    if (orderCreationType === 'quotation') {
      if (!selectedQuotationId) { toast.error('Please select a quotation'); return; }
      const selectedQuotation = quotations.find((q) => q.id === selectedQuotationId);
      if (!selectedQuotation) return;

      const now = Date.now();
      const todayISO = new Date().toISOString().split('T')[0];

      const newOrder: Omit<SalesOrder, 'id'> = {
        soNumber: generateSoNumber(),
        quotationId: selectedQuotation.id,
        quotationNumber: selectedQuotation.quoteNumber || '',
        customerId: selectedQuotation.customerId || '',
        customerName: selectedQuotation.customerName || 'Unknown Customer',
        customerGST: selectedQuotation.customerGST || '',
        customerPAN: selectedQuotation.customerPAN || '',
        customerAddress: selectedQuotation.customerAddress || '',
        customerPhone: selectedQuotation.customerPhone || '',
        customerEmail: selectedQuotation.customerEmail || '',
        soDate: todayISO,
        soTimestamp: now,
        deliveryDate: deliveryDate || selectedQuotation.deliveryTerm || todayISO,
        paymentTerms: selectedQuotation.paymentTerms || '',
        dispatchMode: selectedQuotation.modeOfDispatch || selectedQuotation.dispatchMode || '',
        instructions,
        items: selectedQuotation.lineItems || [],
        okQty: 0,
        notOkQty: 0,
        subtotal: selectedQuotation.subtotal || 0,
        cgstAmount: selectedQuotation.cgstAmount || 0,
        sgstAmount: selectedQuotation.sgstAmount || 0,
        cgstPercent: selectedQuotation.cgstPercent || 0,
        sgstPercent: selectedQuotation.sgstPercent || 0,
        transportCharge: selectedQuotation.transportCharge || 0,
        transportChargePercent: selectedQuotation.transportChargePercent || 0,
        grandTotal: selectedQuotation.grandTotal || 0,
        currency: selectedQuotation.currency || 'INR',
        status: 'Pending',
        productionStatus: 'pending',
        qcStatus: 'pending',
        invoiceStatus: 'notgenerated',
        deliveryStatus: 'notdispatched',
        createdAt: now,
      };

      try {
        await createRecord('sales/orderAcknowledgements', newOrder);
        toast.success(`Sales Order ${newOrder.soNumber} created`);
        setIsCreateOpen(false);
        resetForm();
        loadAllData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to create Order');
      }
    } else {
      if (!manualCustomerId) { toast.error('Please select a customer'); return; }
      if (manualItems.length === 0) { toast.error('Please add at least one product'); return; }

      const customer = customers.find((c: any) => c.id === manualCustomerId);
      if (!customer) { toast.error('Customer not found'); return; }

      const totals = calculateManualOrderTotals();
      const now = Date.now();
      const todayISO = new Date().toISOString().split('T')[0];

      const newOrder: Omit<SalesOrder, 'id'> = {
        soNumber: generateSoNumber(),
        quotationId: '',
        quotationNumber: '',
        customerId: manualCustomerId,
        customerName: customer.companyName || 'Unknown Customer',
        customerGST: customer.gst || '',
        customerPAN: customer.pan || '',
        customerAddress: customer.addresses?.[0]?.street || '',
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        soDate: todayISO,
        soTimestamp: now,
        deliveryDate: manualDeliveryDate || todayISO,
        paymentTerms: manualPaymentTerms,
        dispatchMode: manualDispatchMode,
        instructions: manualInstructions,
        items: manualItems,
        okQty: 0,
        notOkQty: 0,
        subtotal: totals.subtotal,
        cgstAmount: totals.cgst,
        sgstAmount: totals.sgst,
        cgstPercent: manualCgstPercent,
        sgstPercent: manualSgstPercent,
        transportCharge: totals.transportCharge,
        transportChargePercent: manualTransportChargePercent,
        grandTotal: totals.grandTotal,
        currency: manualCurrency,
        status: 'Pending',
        productionStatus: 'pending',
        qcStatus: 'pending',
        invoiceStatus: 'notgenerated',
        deliveryStatus: 'notdispatched',
        createdAt: now,
      };

      try {
        await createRecord('sales/orderAcknowledgements', newOrder);
        toast.success(`Sales Order ${newOrder.soNumber} created`);
        setIsCreateOpen(false);
        resetForm();
        loadAllData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to create order');
      }
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    try {
      await updateRecord('sales/orderAcknowledgements', selectedOrder.id, {
        deliveryDate,
        instructions,
        updatedAt: Date.now(),
      });
      toast.success(`${soNumber} updated successfully`);
      setIsEditOpen(false);
      resetForm();
      loadAllData();
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    try {
      await deleteRecord('sales/orderAcknowledgements', selectedOrder.id);
      toast.success(`${selectedOrder.soNumber} deleted permanently`);
      setIsDeleteOpen(false);
      setSelectedOrder(null);
      loadAllData();
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    if (!cancelRemark.trim()) {
      toast.error('Please enter a cancellation remark');
      return;
    }
    try {
      await updateRecord('sales/orderAcknowledgements', cancellingOrder.id, {
        status: 'Cancelled' as any,
        cancelledAt: Date.now(),
        cancelRemark: cancelRemark.trim(),
        updatedAt: Date.now(),
      });
      toast.success(`${cancellingOrder.soNumber} has been cancelled`);
      setIsCancelOpen(false);
      setCancellingOrder(null);
      setCancelRemark('');
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel order');
    }
  };

  const handleConfirmOrder = async (order: SalesOrder) => {
    if (order.status !== 'Pending') { toast.info('Only pending orders can be confirmed'); return; }
    try {
      const items = order.items;
      if (items.length === 0) { toast.error('No items in order'); return; }
      const now = Date.now();
      const jobPromises = items.map(async (item: any, index: number) => {
        const productId = item.productId || item.sku || item.id || `unknown-${index}`;
        const productName = item.productName || item.productDescription || item.name || `${productId} - Item ${index + 1}`;
        const qty = Number(item.qty || item.quantity || 1);
        return createRecord('production/jobs', {
          orderId: order.id,
          soNumber: order.soNumber,
          customerName: order.customerName,
          productId,
          productName,
          productCode: item.productCode || '',
          category: item.category || '',
          group: item.group || '',
          type: item.type || '',
          qty,
          hsnCode: item.hsnCode || '',
          unitRate: item.unitRate || item.rate || 0,
          netAmount: item.netAmount || item.amount || 0,
          deliveryDate: order.deliveryDate,
          priority: 'normal',
          status: 'notstarted',
          createdAt: now,
        });
      });

      await Promise.all(jobPromises);
      await updateRecord('sales/orderAcknowledgements', order.id, {
        status: 'Confirmed',
        productionStatus: 'pending',
        confirmedAt: now,
        updatedAt: now,
      });

      toast.success(`${order.soNumber} confirmed and jobs created`);
      loadAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to confirm order');
    }
  };

  const resetForm = () => {
    setSelectedQuotationId('');
    setDeliveryDate('');
    setInstructions('');
    setSoNumber('');
    setSelectedOrder(null);
    setOrderCreationType('quotation');
    setManualCustomerId('');
    setManualCurrency('INR');
    setManualPaymentTerms('');
    setManualDispatchMode('');
    setManualDeliveryDate('');
    setManualInstructions('');
    setManualItems([]);
    setManualCgstPercent(undefined);
    setManualSgstPercent(undefined);
    setManualIgstPercent(undefined);
    setManualTransportChargePercent(0);
  };

  const getProgressFromStatus = (status: SalesOrderStatus) => {
    const map: Record<SalesOrderStatus, number> = {
      'Pending': 10,
      'Confirmed': 20,
      'In Production': 55,
      'QC Pending': 75,
      'QC Completed': 100,
      'Ready for Dispatch': 90,
      'Delivered': 95,
      'Invoice Generated': 98,
      'Closed': 100,
    };
    return map[status] || 10;
  };

  const canDelete = (order: SalesOrder) => order.status === 'Pending' || order.status === 'Confirmed';

  const selectedManualCustomer = customers.find((c: any) => c.id === manualCustomerId);
  const clearSearch = () => setSearchQuery('');

  const handleExportPDF = async (type: 'oa' | 'proforma') => {
    if (!printRef.current) return;
    try {
      // Find the actual template element inside the wrapper
      const templateEl = printRef.current.querySelector('[data-pdf-template]') as HTMLElement || printRef.current;
      const elWidth = templateEl.scrollWidth || 1122;
      const elHeight = templateEl.scrollHeight || 793;
      const canvas = await html2canvas(templateEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: elWidth,
        height: elHeight,
        windowWidth: elWidth,
        windowHeight: elHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pageHeight = (pdfWidth * imgHeight) / imgWidth;
      const totalPages = Math.ceil(pageHeight / pdfHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const yOffset = -(i * pdfHeight * imgWidth) / pdfWidth;
        pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, (pdfWidth * imgHeight) / imgWidth);
      }
      const filename = type === 'oa'
        ? `${previewOrder?.soNumber}-Order-Acknowledgement.pdf`
        : `${previewOrder?.soNumber}-Proforma-Invoice.pdf`;
      pdf.save(filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('PDF export failed');
    }
  };

  const startEditingJob = (job: ProductionJob) => {
    const insp = getInspectionForJob(job.id);
    setEditingJobId(job.id);
    setTempJobStatus(job.status || 'notstarted');
    setTempQCStatus(insp?.qcStatus || 'pending');
    setTempOkQty(insp?.okQty || '');
    setTempNotOkQty(insp?.notOkQty || '');
  };

  const cancelEdit = () => setEditingJobId(null);

  // ── Re-produce rejected: creates a new production job for notOkQty ──
  const handleReproduceRejected = async (job: ProductionJob, notOkQty: number, order: SalesOrder) => {
    if (notOkQty <= 0) return;
    try {
      const newJob = await createRecord('production/jobs', {
        orderId: order.id,
        soNumber: order.soNumber,
        customerName: order.customerName,
        productId: job.productId,
        productName: job.productName,
        productCode: (job as any).productCode || '',
        category: (job as any).category || '',
        group: (job as any).group || '',
        type: (job as any).type || '',
        qty: notOkQty,
        hsnCode: (job as any).hsnCode || '',
        unitRate: (job as any).unitRate || 0,
        netAmount: 0,
        priority: 'normal',
        status: 'notstarted',
        isReproduction: true,
        reproductionOf: job.id,
        createdAt: Date.now(),
      });
      // Refresh jobs list
      const updatedJobs = await getAllRecords('production/jobs');
      setJobs(updatedJobs as ProductionJob[]);
      toast.success(`Re-production job created for ${notOkQty} unit(s) of ${job.productName}`);
    } catch {
      toast.error('Failed to create re-production job');
    }
  };

  // ────────────────────────────────────────────────
  // ── KEY CHANGE: saveJobChanges now also upserts inventory
  // ────────────────────────────────────────────────
  const saveJobChanges = async (job: ProductionJob, order: SalesOrder) => {
    const okVal = Number(tempOkQty) || 0;
    const notOkVal = Number(tempNotOkQty) || 0;
    if (okVal + notOkVal > job.qty) {
      toast.error(' quantity');
      return;
    }

    try {
      await updateRecord('production/jobs', job.id, {
        status: tempJobStatus,
        updatedAt: Date.now(),
      });

      const existingInsp = getInspectionForJob(job.id);
      const inspPayload = {
        orderId: order.id,
        jobId: job.id,
        productId: job.productId,
        productName: job.productName,
        qcStatus: tempQCStatus,
        okQty: okVal,
        notOkQty: notOkVal,
        inspectionDate: new Date().toISOString(),
        updatedAt: Date.now(),
      };

      if (existingInsp) {
        await updateRecord('quality/inspections', existingInsp.id, inspPayload);
      } else {
        await createRecord('quality/inspections', inspPayload);
      }

      // ── INVENTORY UPSERT ──
      // Find the order item that matches this job's productId
      const matchedOrderItem = order.items.find(
        (item: any) =>
          (item.productId && item.productId === job.productId) ||
          (item.productCode && item.productCode === (job as any).productCode)
      ) || order.items.find((item: any) =>
        (item.productName || item.productDescription || '').toLowerCase() ===
        job.productName.toLowerCase()
      );

      const now = Date.now();
      const inventoryPayload: Omit<InventoryItem, 'id'> = {
        orderId: order.id,
        soNumber: order.soNumber,
        jobId: job.id,
        customerId: order.customerId,
        customerName: order.customerName,
        productId: job.productId,
        productCode: (job as any).productCode || matchedOrderItem?.productCode || '',
        productName: job.productName,
        productDescription: matchedOrderItem?.productDescription || matchedOrderItem?.productName || job.productName,
        category: (job as any).category || matchedOrderItem?.category || '',
        group: (job as any).group || matchedOrderItem?.group || '',
        type: (job as any).type || matchedOrderItem?.type || '',
        hsnCode: (job as any).hsnCode || matchedOrderItem?.hsnCode || (matchedOrderItem as any)?.hsn || '',
        unit: matchedOrderItem?.unit || (matchedOrderItem as any)?.uom || '',
        unitRate: (job as any).unitRate || matchedOrderItem?.unitRate || (matchedOrderItem as any)?.rate || 0,
        orderedQty: job.qty,
        okQty: okVal,
        notOkQty: notOkVal,
        size: matchedOrderItem?.size,
        updatedAt: now,
        createdAt: now,
      };

      // Check if inventory record already exists for this job
      const freshInventory = await getAllRecords('inventory') as InventoryItem[];
      const existingInventory =
        freshInventory.find((inv) => inv.jobId === job.id) ||
        freshInventory.find(
          (inv) => inv.orderId === order.id && inv.productId === job.productId
        );

      if (existingInventory) {
        // Always UPDATE — never create a duplicate
        // Also backfill hsnCode / unit / unitRate if they were saved empty originally
        const resolvedHsn = (job as any).hsnCode || matchedOrderItem?.hsnCode || matchedOrderItem?.hsn || '';
        const resolvedUnit = matchedOrderItem?.unit || matchedOrderItem?.uom || '';
        const resolvedRate = (job as any).unitRate || matchedOrderItem?.unitRate || (matchedOrderItem as any)?.rate || 0;
        await updateRecord('inventory', existingInventory.id, {
          okQty: okVal,
          notOkQty: notOkVal,
          updatedAt: now,
          ...(existingInventory.hsnCode === '' && resolvedHsn ? { hsnCode: resolvedHsn } : {}),
          ...(existingInventory.unit === '' && resolvedUnit ? { unit: resolvedUnit } : {}),
          ...(existingInventory.unitRate === 0 && resolvedRate ? { unitRate: resolvedRate } : {}),
        });
      } else {
        // Only CREATE if truly no record exists for this job/product+order
        const inventoryPayload: Omit<InventoryItem, 'id'> = {
          orderId: order.id,
          soNumber: order.soNumber,
          jobId: job.id,
          customerId: order.customerId,
          customerName: order.customerName,
          productId: job.productId,
          productCode: (job as any).productCode || matchedOrderItem?.productCode || '',
          productName: job.productName,
          productDescription: matchedOrderItem?.productDescription || matchedOrderItem?.productName || job.productName,
          category: (job as any).category || matchedOrderItem?.category || '',
          group: (job as any).group || matchedOrderItem?.group || '',
          type: (job as any).type || matchedOrderItem?.type || '',
          hsnCode: (job as any).hsnCode || matchedOrderItem?.hsnCode || (matchedOrderItem as any)?.hsn || '',
          unit: matchedOrderItem?.unit || (matchedOrderItem as any)?.uom || '',
          unitRate: (job as any).unitRate || matchedOrderItem?.unitRate || (matchedOrderItem as any)?.rate || 0,
          orderedQty: job.qty,
          okQty: okVal,
          notOkQty: notOkVal,
          size: matchedOrderItem?.size,
          updatedAt: now,
          createdAt: now,
        };
        await createRecord('inventory', inventoryPayload);
      }
      // ── END INVENTORY UPSERT ──

      const currentJobs = jobs.filter((j) => j.orderId === order.id);
      const updatedJobs = currentJobs.map((j) => (j.id === job.id ? { ...j, status: tempJobStatus } : j));
      const completedCount = updatedJobs.filter((j) => j.status === 'completed').length;

      const orderInspections = inspections
        .filter((i) => i.orderId === order.id && i.jobId !== job.id)
        .concat([{ ...inspPayload, id: existingInsp?.id || `temp-${Date.now()}` } as Inspection]);

      const allInspected = orderInspections.length === updatedJobs.length;
      const allQCdone = orderInspections.every((i) => i.qcStatus === 'completed');
      const totalOk = orderInspections.reduce((sum, i) => sum + (i.okQty || 0), 0);
      const totalNotOk = orderInspections.reduce((sum, i) => sum + (i.notOkQty || 0), 0);

      let newProdStatus: 'pending' | 'inprogress' | 'completed' = 'pending';
      if (completedCount === updatedJobs.length) newProdStatus = 'completed';
      else if (completedCount > 0 || updatedJobs.some((j) => j.status === 'running' || j.status === 'paused')) newProdStatus = 'inprogress';

      const newQCStatus: 'pending' | 'inprogress' | 'completed' =
        allInspected && allQCdone ? 'completed' : orderInspections.length > 0 ? 'inprogress' : 'pending';

      await updateRecord('sales/orderAcknowledgements', order.id, {
        productionStatus: newProdStatus,
        qcStatus: newQCStatus,
        okQty: totalOk,
        notOkQty: totalNotOk,
        updatedAt: Date.now(),
      });

      toast.success('Job status, QC & Inventory updated successfully');
      setEditingJobId(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save job & QC changes');
    }
  };

  // ── Filtered inventory for search ──
  const filteredInventory = inventoryItems.filter((inv) => {
    if (!inventorySearch.trim()) return true;
    const q = inventorySearch.toLowerCase();
    return (
      inv.productCode?.toLowerCase().includes(q) ||
      inv.productName?.toLowerCase().includes(q) ||
      inv.soNumber?.toLowerCase().includes(q) ||
      inv.customerName?.toLowerCase().includes(q) ||
      inv.category?.toLowerCase().includes(q)
    );
  }).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const selectedQuotation = quotations.find((q) => q.id === selectedQuotationId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Orders</h1>
          <p className="text-muted-foreground">Real-time production & quality tracking</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Sales Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Sales Order</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div>
                <Label>Order Creation Type</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button type="button" variant={orderCreationType === 'quotation' ? 'default' : 'outline'} onClick={() => setOrderCreationType('quotation')} className="w-full">
                    From Approved Quotation
                  </Button>
                  <Button type="button" variant={orderCreationType === 'manual' ? 'default' : 'outline'} onClick={() => setOrderCreationType('manual')} className="w-full">
                    Create Order Manually
                  </Button>
                </div>
              </div>

              {orderCreationType === 'quotation' ? (
                <div className="space-y-4">
                  <div>
                    <Label>Select Approved Quotation</Label>
                    <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
                      <SelectTrigger><SelectValue placeholder="Choose approved quotation..." /></SelectTrigger>
                      <SelectContent>
                        {quotations.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.quoteNumber || q.id} - {q.customerName || 'Unknown'} ({q.currency || 'INR'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedQuotation && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Customer</Label>
                          <p className="text-sm font-medium">{selectedQuotation.customerName}</p>
                          <p className="text-xs text-muted-foreground">GST: {selectedQuotation.customerGST || 'NA'}</p>
                        </div>
                        <div>
                          <Label>Quotation</Label>
                          <p className="text-sm font-medium">{selectedQuotation.quoteNumber || selectedQuotation.id}</p>
                          <p className="text-xs text-muted-foreground">Date: {selectedQuotation.quoteDate}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-lg font-bold text-green-800">
                          Total: {CURRENCY_SYMBOLS[selectedQuotation.currency || 'INR']}{formatAmount(selectedQuotation.grandTotal || 0, selectedQuotation.currency)}
                        </p>
                        <p className="text-sm text-green-700">Currency: {selectedQuotation.currency || 'INR'}</p>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Delivery Date</Label>
                      <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                    </div>
                    <div></div>
                  </div>

                  <div>
                    <Label>Internal Instructions (Optional)</Label>
                    <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Any special packing, priority, or handling notes..." rows={3} />
                  </div>

                  <Button onClick={handleCreateOrder} className="w-full mt-6" size="lg">Create Sales Order</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Select Customer *</Label>
                      <Select value={manualCustomerId} onValueChange={setManualCustomerId}>
                        <SelectTrigger><SelectValue placeholder="Choose customer..." /></SelectTrigger>
                        <SelectContent>
                          {customers.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.companyName || 'Unknown'} {c.gst ? `(${c.gst})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select value={manualCurrency} onValueChange={setManualCurrency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="AED">AED (د.إ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedManualCustomer && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium">{selectedManualCustomer.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        GST: {selectedManualCustomer.gst || 'NA'} | PAN: {selectedManualCustomer.pan || 'NA'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Payment Terms</Label>
                      <Input value={manualPaymentTerms} onChange={(e) => setManualPaymentTerms(e.target.value)} placeholder="e.g., Net 30, Advance Payment" />
                    </div>
                    <div>
                      <Label>Dispatch Mode</Label>
                      <Input value={manualDispatchMode} onChange={(e) => setManualDispatchMode(e.target.value)} placeholder="e.g., Air, Road, Courier" />
                    </div>
                  </div>

                  <div>
                    <Label>Delivery Date</Label>
                    <Input type="date" value={manualDeliveryDate} onChange={(e) => setManualDeliveryDate(e.target.value)} />
                  </div>

                  {manualCurrency === 'INR' &&
                    (manualCgstPercent !== undefined || manualSgstPercent !== undefined || manualIgstPercent !== undefined) && (
                      <Card className="bg-yellow-50 border-yellow-200">
                        <CardHeader>
                          <CardTitle className="text-lg">Tax Configuration (GST)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Show CGST only if customer has CGST set */}
                            {manualCgstPercent !== undefined && (
                              <div>
                                <Label>CGST %</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={manualCgstPercent}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                      setManualCgstPercent(val === '' ? undefined : Number(val));
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {/* Show SGST only if customer has SGST set */}
                            {manualSgstPercent !== undefined && (
                              <div>
                                <Label>SGST %</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={manualSgstPercent}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                      setManualSgstPercent(val === '' ? undefined : Number(val));
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {/* Show IGST only if customer has IGST set */}
                            {manualIgstPercent !== undefined && (
                              <div>
                                <Label>IGST %</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={manualIgstPercent}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                      setManualIgstPercent(val === '' ? undefined : Number(val));
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  <div>
                    <Label>Transport Charge %</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={manualTransportChargePercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setManualTransportChargePercent(val === '' ? undefined : Number(val));
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Product Items</Label>
                      <Button type="button" size="sm" onClick={addManualItem}>
                        <Plus className="h-4 w-4 mr-1" /> Add Product
                      </Button>
                    </div>

                    {manualItems.map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium">Item {index + 1}</h4>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeManualItem(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <Label>Select Product</Label>
                            <ProductSearchCombobox
                              value={item.productCode}
                              products={flattenedProducts}
                              onChange={(code) => updateManualItem(item.id, 'productCode', code)}
                            />
                          </div>

                          {item.productCode && (
                            <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg border">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div><span className="font-semibold">Category:</span> {item.category}</div>
                                <div><span className="font-semibold">Group:</span> {item.group}</div>
                                <div><span className="font-semibold">Type:</span> {item.type}</div>
                                <div><span className="font-semibold">Stock:</span> {item.stockQty} {item.unit}</div>
                                {item.size && (
                                  <>
                                    <div><span className="font-semibold">L:</span> {item.size.length} {item.size.lengthUnit}</div>
                                    <div><span className="font-semibold">W:</span> {item.size.width} {item.size.widthUnit}</div>
                                    <div><span className="font-semibold">H:</span> {item.size.height} {item.size.heightUnit}</div>
                                    <div><span className="font-semibold">Wt:</span> {item.size.weight} {item.size.weightUnit}</div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <Label>Product Description</Label>
                            <Input value={item.productDescription} onChange={(e) => updateManualItem(item.id, 'productDescription', e.target.value)} placeholder="Description" />
                          </div>
                          <div>
                            <Label>HSN Code</Label>
                            <Input value={item.hsnCode} onChange={(e) => updateManualItem(item.id, 'hsnCode', e.target.value)} placeholder="HSN Code" />
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input type="number" min={1} value={item.qty} onChange={(e) => updateManualItem(item.id, 'qty', Number(e.target.value))} />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input value={item.unit} onChange={(e) => updateManualItem(item.id, 'unit', e.target.value)} placeholder="Unit" />
                          </div>
                          <div>
                            <Label>Unit Rate</Label>
                            <Input type="number" min={0} step={0.01} value={item.unitRate} onChange={(e) => updateManualItem(item.id, 'unitRate', Number(e.target.value))} />
                          </div>
                          <div>
                            <Label>Tax %</Label>
                            <Input type="number" min={0} max={100} step={0.1} value={item.taxPercentage} onChange={(e) => updateManualItem(item.id, 'taxPercentage', Number(e.target.value))} />
                          </div>
                          <div>
                            <Label>Amount</Label>
                            <Input value={`${CURRENCY_SYMBOLS[manualCurrency]}${formatAmount(item.amount, manualCurrency)}`} disabled className="bg-muted" />
                          </div>
                          <div>
                            <Label>Tax Amount</Label>
                            <Input value={`${CURRENCY_SYMBOLS[manualCurrency]}${formatAmount(item.taxAmount, manualCurrency)}`} disabled className="bg-muted" />
                          </div>
                          <div>
                            <Label>Net Amount</Label>
                            <Input value={`${CURRENCY_SYMBOLS[manualCurrency]}${formatAmount(item.netAmount, manualCurrency)}`} disabled className="bg-muted font-bold" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {manualItems.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="font-medium">{CURRENCY_SYMBOLS[manualCurrency]}{formatAmount(calculateManualOrderTotals().subtotal, manualCurrency)}</span>
                        </div>
                        {manualCurrency === 'INR' && (
                          <>
                            <div className="flex justify-between">
                              <span>CGST @ {manualCgstPercent}%:</span>
                              <span className="font-medium">{CURRENCY_SYMBOLS[manualCurrency]}{formatAmount(calculateManualOrderTotals().cgst, manualCurrency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>SGST @ {manualSgstPercent}%:</span>
                              <span className="font-medium">{CURRENCY_SYMBOLS[manualCurrency]}{formatAmount(calculateManualOrderTotals().sgst, manualCurrency)}</span>
                            </div>
                          </>
                        )}
                        {manualTransportChargePercent > 0 && (
                          <div className="flex justify-between">
                            <span>Transport Charge @ {manualTransportChargePercent}%:</span>
                            <span className="font-medium">{CURRENCY_SYMBOLS[manualCurrency]}{formatAmount(calculateManualOrderTotals().transportCharge, manualCurrency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-green-800 pt-2 border-t">
                          <span>Grand Total:</span>
                          <span>{CURRENCY_SYMBOLS[manualCurrency]}{formatAmount(calculateManualOrderTotals().grandTotal, manualCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Internal Instructions (Optional)</Label>
                    <Textarea value={manualInstructions} onChange={(e) => setManualInstructions(e.target.value)} placeholder="Any special packing, priority, or handling notes..." rows={3} />
                  </div>

                  <Button onClick={handleCreateOrder} className="w-full mt-6" size="lg" disabled={!manualCustomerId || manualItems.length === 0}>
                    Create Manual Sales Order
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative max-w-md flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by SO number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-6 text-base border-2 border-gray-300 focus:border-blue-500 rounded-lg shadow-sm"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Clear search">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 pr-10 py-6 text-base border-2 border-gray-300 focus:border-blue-500 rounded-lg shadow-sm w-[200px]"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Clear date filter">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        {(searchQuery || dateFilter) && (
          <p className="mt-2 text-sm text-gray-600">
            Found {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}
            {dateFilter && ` for ${format(new Date(dateFilter), 'dd/MM/yyyy')}`}
          </p>
        )}
      </div>

      {/* ── TABS: now 3 tabs ── */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">All Orders</TabsTrigger>
          <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* ── ALL ORDERS TAB ── */}
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Quote No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Production</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        {searchQuery ? (
                          <>
                            <p className="text-lg font-medium mb-2">No orders match your search</p>
                            <p className="text-sm">
                              Try a different search term or{' '}
                              <button onClick={clearSearch} className="text-blue-600 hover:underline">clear search</button>
                            </p>
                          </>
                        ) : (
                          <p>No sales orders yet</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const prodSummary = getProductionSummaryForOrder(order.id);
                      const derivedStatus = deriveOrderStatus(order);
                      const dateObj = order.soDate ? new Date(order.soDate) : new Date(order.createdAt);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-bold text-blue-600">{order.soNumber}</TableCell>
                          <TableCell className="text-sm text-gray-600">{order.quotationNumber || '-'}</TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell>{format(dateObj, 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(derivedStatus)} variant="secondary">{derivedStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {prodSummary.total === 0 ? (
                                <span className="text-muted-foreground">No jobs</span>
                              ) : (
                                <>
                                  {prodSummary.running > 0 && <span className="font-bold text-emerald-700">{prodSummary.running} Running </span>}
                                  {prodSummary.completed > 0 && <span className="font-medium text-green-700">{prodSummary.completed} Done </span>}
                                  {prodSummary.paused > 0 && <span className="text-amber-700">{prodSummary.paused} Paused </span>}
                                  {prodSummary.notStarted > 0 && <span className="text-muted-foreground">{prodSummary.notStarted}</span>}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>
                              <span className="text-lg font-bold">
                                {CURRENCY_SYMBOLS[order.currency || 'INR']}{formatAmount(order.grandTotal, order.currency)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{order.currency || 'INR'}</div>
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1 items-center flex-wrap">
                              {order.status === 'Cancelled' ? (
                                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                  <Ban className="h-3 w-3 mr-1" />Cancelled
                                </Badge>
                              ) : (
                                <>
                                  {(order.status === 'Pending' || order.status === 'Confirmed') && (
                                    <Button size="sm" variant="outline" onClick={() => openEdit(order)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {order.status === 'Pending' && (
                                    <Button size="sm" onClick={() => handleConfirmOrder(order)}>
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-400 text-red-600 hover:bg-red-50"
                                    onClick={() => openCancel(order)}
                                  >
                                    <Ban className="h-4 w-4 mr-1" />Cancel
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-50"
                                onClick={() => openPreview(order, 'oa')}
                              >
                                <Eye className="h-4 w-4 mr-1" />View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LIVE TRACKING TAB ── */}
        <TabsContent value="tracking">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SO Number</TableHead>
                    <TableHead>Quote No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Production</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.filter((o) => o.status !== 'Pending').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No active orders for tracking</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders
                      .filter((o) => o.status !== 'Pending')
                      .map((order) => {
                        const prodSummary = getProductionSummaryForOrder(order.id);
                        const derivedStatus = deriveOrderStatus(order);
                        const dateObj = order.soDate ? new Date(order.soDate) : new Date(order.createdAt);
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-bold text-blue-600">{order.soNumber}</TableCell>
                            <TableCell className="text-sm text-gray-600">{order.quotationNumber || '-'}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{format(dateObj, 'dd MMM yyyy')}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(derivedStatus)} variant="secondary">{derivedStatus}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {prodSummary.total === 0 ? (
                                  <span className="text-muted-foreground">No jobs</span>
                                ) : (
                                  <>
                                    {prodSummary.running > 0 && <span className="font-bold text-emerald-700">{prodSummary.running} Running </span>}
                                    {prodSummary.completed > 0 && <span className="font-medium text-green-700">{prodSummary.completed} Done </span>}
                                    {prodSummary.paused > 0 && <span className="text-amber-700">{prodSummary.paused} Paused </span>}
                                    {prodSummary.notStarted > 0 && <span className="text-muted-foreground">{prodSummary.notStarted}</span>}
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <span className="text-lg font-bold">
                                  {CURRENCY_SYMBOLS[order.currency || 'INR']}{formatAmount(order.grandTotal, order.currency)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">{order.currency || 'INR'}</div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button size="sm" variant="outline" onClick={() => openTrackingEdit(order)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INVENTORY TAB (NEW) ── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Inventory
                    <Badge variant="outline" className="ml-2">{inventoryItems.length} items</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    QC-passed OK quantity items from all orders — updates automatically when QC is edited
                  </p>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search product, SO, customer..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="pl-9"
                  />
                  {inventorySearch && (
                    <button
                      onClick={() => setInventorySearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium mb-1">No inventory records yet</p>
                  <p className="text-sm">
                    {inventorySearch
                      ? 'No items match your search'
                      : 'Inventory is populated automatically when QC OK qty is saved from Live Tracking'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Product Name / Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>HSN</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>SO Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Ordered Qty</TableHead>
                      <TableHead className="text-green-700 font-bold">✅ OK Qty</TableHead>
                      <TableHead className="text-red-600 font-bold">❌ Not OK Qty</TableHead>
                      <TableHead>Unit Rate</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((inv, index) => (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm font-semibold text-blue-700">
                            {inv.productCode || '—'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{inv.productName || '—'}</p>
                            {inv.productDescription && inv.productDescription !== inv.productName && (
                              <p className="text-xs text-muted-foreground">{inv.productDescription}</p>
                            )}
                            {inv.group && (
                              <p className="text-xs text-blue-600">{inv.group}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{inv.category || '—'}</p>
                            {inv.type && <p className="text-xs text-muted-foreground">{inv.type}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{inv.hsnCode || '—'}</TableCell>
                        <TableCell className="text-sm">{inv.unit || '—'}</TableCell>
                        <TableCell>
                          {inv.size ? (
                            <div className="text-xs text-muted-foreground leading-relaxed">
                              <span>L: {inv.size.length}{inv.size.lengthUnit}</span><br />
                              <span>W: {inv.size.width}{inv.size.widthUnit}</span><br />
                              <span>H: {inv.size.height}{inv.size.heightUnit}</span><br />
                              <span>Wt: {inv.size.weight}{inv.size.weightUnit}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600 text-sm">{inv.soNumber}</span>
                        </TableCell>
                        <TableCell className="text-sm">{inv.customerName}</TableCell>
                        <TableCell className="text-center font-medium">{inv.orderedQty}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center bg-green-100 text-green-800 font-bold text-sm rounded-full px-3 py-1 min-w-[40px]">
                            {inv.okQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center font-bold text-sm rounded-full px-3 py-1 min-w-[40px] ${inv.notOkQty > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-500'
                            }`}>
                            {inv.notOkQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {inv.unitRate > 0 ? `₹${Number(inv.unitRate).toFixed(2)}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inv.updatedAt
                            ? format(new Date(inv.updatedAt), 'dd MMM yyyy, hh:mm a')
                            : '—'}
                        </TableCell>
                        <TableCell>
                          {Number(inv.okQty || 0) > 0 ? (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                              onClick={() => navigate(`/sales/invoices/create?orderId=${inv.orderId}`)}
                            >
                              <FileText className="h-3.5 w-3.5 mr-1" />
                              Generate Invoice
                            </Button>
                          ) : Number(inv.notOkQty || 0) > 0 ? (
                            <span className="text-xs text-orange-600 font-medium">
                              {inv.notOkQty} rejected — awaiting re-production
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">✅ Invoiced</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Inventory Summary Cards */}
          {inventoryItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-green-700">
                    {inventoryItems.reduce((sum, inv) => sum + (inv.okQty || 0), 0)}
                  </p>
                  <p className="text-sm font-semibold text-green-600 mt-1">Total OK Qty (All Items)</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-red-600">
                    {inventoryItems.reduce((sum, inv) => sum + (inv.notOkQty || 0), 0)}
                  </p>
                  <p className="text-sm font-semibold text-red-500 mt-1">Total Not OK Qty (All Items)</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-black text-blue-700">
                    {inventoryItems.length}
                  </p>
                  <p className="text-sm font-semibold text-blue-600 mt-1">Total Product Entries</p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Order Dialog */}
      <Dialog open={isTrackingEditOpen} onOpenChange={setIsTrackingEditOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Live Tracking - {trackingSelectedOrder?.soNumber}</DialogTitle>
          </DialogHeader>
          {trackingSelectedOrder && (() => {
            const summary = getProductionSummaryForOrder(trackingSelectedOrder.id);
            const derivedStatus = deriveOrderStatus(trackingSelectedOrder);
            return (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-muted p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                    <p className="font-bold text-sm"><Badge className={getStatusColor(derivedStatus)}>{derivedStatus}</Badge></p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Grand Total</p>
                    <p className="font-bold text-lg">{CURRENCY_SYMBOLS[trackingSelectedOrder.currency || 'INR']}{formatAmount(trackingSelectedOrder.grandTotal, trackingSelectedOrder.currency)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-600 uppercase tracking-wider mb-1">Total OK</p>
                    <p className="font-bold text-xl text-green-700">{trackingSelectedOrder.okQty}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-xs text-red-500 uppercase tracking-wider mb-1">Total Not OK</p>
                    <p className="font-bold text-xl text-red-600">{trackingSelectedOrder.notOkQty}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Ordered Qty</TableHead>
                      <TableHead>Production</TableHead>
                      <TableHead>QC Status</TableHead>
                      <TableHead>OK Qty</TableHead>
                      <TableHead>Not OK Qty</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.jobs.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No production jobs</TableCell></TableRow>
                    ) : (
                      summary.jobs.map((job) => {
                        const inspection = getInspectionForJob(job.id);
                        const isEditingThisJob = editingJobId === job.id;

                        const jobBadge = {
                          notstarted: { color: 'bg-gray-100 text-gray-800', label: 'Not Started' },
                          running: { color: 'bg-emerald-100 text-emerald-900', label: 'Running' },
                          paused: { color: 'bg-amber-100 text-amber-900', label: 'Paused' },
                          completed: { color: 'bg-green-100 text-green-900', label: 'Completed' },
                        }[job.status || 'notstarted'];

                        const qcBadge = {
                          pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
                          'in-progress': { color: 'bg-blue-100 text-blue-900', label: 'In Progress' },
                          completed: {
                            color: (inspection?.notOkQty || 0) > 0 ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900',
                            label: (inspection?.notOkQty || 0) > 0 ? 'Rejected' : 'Passed',
                          },
                        }[inspection?.qcStatus || 'pending'];

                        return (
                          <TableRow key={job.id} className={(job as any).isReproduction ? 'bg-orange-50/40' : undefined}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{job.productName}</span>
                                {(job as any).isReproduction && (
                                  <Badge className="text-[10px] bg-orange-100 text-orange-700 border-none px-1 py-0 shadow-none"><RotateCcw className="h-2.5 w-2.5 mr-1" />Re-production</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">{job.qty}</TableCell>

                            {isEditingThisJob ? (
                              <>
                                <TableCell>
                                  <Select value={tempJobStatus} onValueChange={(v) => setTempJobStatus(v as ProductionJobStatus)}>
                                    <SelectTrigger className="h-9 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="notstarted">Not Started</SelectItem>
                                      <SelectItem value="running">Running</SelectItem>
                                      <SelectItem value="paused">Paused</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Select value={tempQCStatus} onValueChange={(v) => setTempQCStatus(v as QCStatus)}>
                                    <SelectTrigger className="h-9 text-xs w-[140px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in-progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number" min={0} max={job.qty} className="h-9 text-sm w-24 border-green-300 focus-visible:ring-green-500"
                                    value={tempOkQty}
                                    placeholder="OK"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '') setTempOkQty('');
                                      else {
                                        let num = Number(val);
                                        if (num > job.qty) { toast.error(`Max ${job.qty}`); num = job.qty; }
                                        setTempOkQty(num);
                                        setTempNotOkQty(job.qty - num);
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number" min={0} max={job.qty} className="h-9 text-sm w-24 border-red-300 focus-visible:ring-red-500"
                                    value={tempNotOkQty}
                                    placeholder="Not OK"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === '') setTempNotOkQty('');
                                      else {
                                        let num = Number(val);
                                        if (num > job.qty) { toast.error(`Max ${job.qty}`); num = job.qty; }
                                        setTempNotOkQty(num);
                                        setTempOkQty(job.qty - num);
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  <Button size="sm" onClick={() => saveJobChanges(job, trackingSelectedOrder)} className="mr-2 h-9"><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
                                  <Button size="sm" variant="outline" onClick={cancelEdit} className="h-9 px-2"><X className="h-4 w-4" /></Button>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell><Badge className={`text-xs shadow-sm ${jobBadge.color}`}>{jobBadge.label}</Badge></TableCell>
                                <TableCell><Badge className={`text-xs shadow-sm ${qcBadge.color}`}>{qcBadge.label}</Badge></TableCell>
                                <TableCell><span className="text-green-700 font-bold bg-green-50 px-2 py-1 rounded inline-block min-w-[2rem] text-center">{inspection?.okQty ?? 0}</span></TableCell>
                                <TableCell><span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded inline-block min-w-[2rem] text-center">{inspection?.notOkQty ?? 0}</span></TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  <Button size="sm" variant="outline" onClick={() => startEditingJob(job)} className="shadow-sm">
                                    <Edit className="h-4 w-4 mr-1" /> Edit Flow
                                  </Button>
                                  {(inspection?.notOkQty || 0) > 0 && inspection?.qcStatus === 'completed' && (
                                    jobs.some((j) => (j as any).reproductionOf === job.id && j.status !== 'completed') ? (
                                      <Button size="sm" variant="outline" disabled title="Re-production in progress" className="ml-2 opacity-50"><RotateCcw className="h-4 w-4 mr-1" /> Repro</Button>
                                    ) : (
                                      <Button size="sm" variant="outline" className="border-orange-400 text-orange-700 hover:bg-orange-50 ml-2" onClick={() => handleReproduceRejected(job, inspection.notOkQty || 0, trackingSelectedOrder)} title="Re-produce rejected units">
                                        <RotateCcw className="h-4 w-4 mr-1" /> Repro
                                      </Button>
                                    )
                                  )}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sales Order — {soNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Delivery Date</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div>
              <Label>Internal Instructions</Label>
              <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateOrder}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              Cancel Order — {cancellingOrder?.soNumber}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as <strong>Cancelled</strong>. The record will be preserved for audit. Please enter a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label>Cancellation Remark <span className="text-red-500">*</span></Label>
            <Textarea
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              placeholder="e.g. Customer requested cancellation, duplicate order, pricing issue..."
              rows={3}
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setIsCancelOpen(false); setCancelRemark(''); }}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={!cancelRemark.trim()}
            >
              <Ban className="h-4 w-4 mr-1" />Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[1300px] w-full max-h-[95vh] overflow-y-auto p-4">
          <DialogHeader>
            <div className="flex justify-between items-center flex-wrap gap-3">
              <DialogTitle>
                {previewType === 'oa' ? 'Order Acknowledgement' : 'Proforma Invoice'} — {previewOrder?.soNumber}
              </DialogTitle>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={previewType === 'oa' ? 'default' : 'outline'}
                  onClick={() => setPreviewType('oa')}
                >
                  Order Acknowledgement
                </Button>
                <Button
                  size="sm"
                  variant={previewType === 'proforma' ? 'default' : 'outline'}
                  onClick={() => setPreviewType('proforma')}
                >
                  Proforma Invoice
                </Button>
                <Button size="sm" onClick={() => handleExportPDF(previewType)}>
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <FileText className="h-4 w-4 mr-1" />
                  Print
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div
            ref={printRef}
            className="mt-4 overflow-x-auto"
            style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}
          >
            {previewOrder && (
              <div data-pdf-template>
                {previewType === 'oa'
                  ? <OrderAcknowledgementPrintTemplate order={previewOrder} />
                  : <ProformaInvoicePrintTemplate order={previewOrder} />
                }
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


