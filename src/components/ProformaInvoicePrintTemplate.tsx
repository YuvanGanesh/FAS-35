import { format } from 'date-fns';
import fas from '../modules/sales/fas.png';

interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  customerGST?: string;
  customerPAN?: string;
  customerAddress?: string;
  soDate: string;
  customerPONo?: string;
  customerPODate?: string;
  paymentTerms?: string;
  dispatchMode?: string;
  currency?: string;
  items: any[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  cgstPercent: number;
  sgstPercent: number;
  transportCharge: number;
  transportChargePercent: number;
  grandTotal: number;
}

interface ProformaInvoicePrintProps {
  order: SalesOrder;
  customers: any[];
}

const fmt = (num: number) => Number(num || 0).toFixed(2);

const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  const convertToWords = (n: number): string => {
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;
    let result = '';
    if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder > 0) result += convertLessThanThousand(remainder);
    return result.trim();
  };
  
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let words = convertToWords(rupees);
  if (paise > 0) words += ' and ' + convertToWords(paise) + ' Paise';
  return words + ' Only';
};

const ITEMS_PER_PAGE = 12;

export default function ProformaInvoicePrintTemplate({ order, customers }: ProformaInvoicePrintProps) {
  if (!order) return null;

  const isINR = order.currency === 'INR';
  const symbol = isINR ? '₹' : (order.currency === 'USD' ? '$' : order.currency || '');
  const showGST = isINR;

  const pages: any[][] = [];
  const lineItems = order.items || [];
  for (let i = 0; i < lineItems.length; i += ITEMS_PER_PAGE) {
    pages.push(lineItems.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const totalPages = pages.length;

  const safeFormatDate = (value?: any) => {
    try {
      if (!value) return '—';
      const d = new Date(value);
      return isNaN(d.getTime()) ? '—' : format(d, 'dd-MMM-yy');
    } catch (e) { return '—'; }
  };

  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 5mm; }
        @media print {
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          .page-break { page-break-after: always; break-after: page; }
          .page { width: 297mm; min-height: 210mm; padding: 5mm; background: #fff; box-sizing: border-box; border: 2px solid #000; display: flex; flex-direction: column; position: relative; }
          .company-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2pt solid #000; padding-bottom: 3pt; margin-bottom: 5pt; }
          .company-logo { width: 70pt; height: auto; }
          .company-info { text-align: center; flex: 1; }
          .company-name { font-size: 18pt; font-weight: bold; margin: 0; }
          .company-details { font-size: 9.5pt; margin-top: 1pt; }
          .gst-row { font-size: 9.5pt; display: flex; justify-content: space-between; background: #f3f4f6; padding: 3pt 8pt; border: 1pt solid #000; font-weight: bold; }
          .title { font-size: 15pt; font-weight: bold; text-align: center; margin: 5pt 0; }
          .info-container { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt; margin-bottom: 8pt; }
          .bill-section, .ship-section, .meta-section { font-size: 9.5pt; }
          .section-title { font-weight: 900; text-decoration: underline; margin-bottom: 2pt; }
          .meta-table { width: 100%; border-collapse: collapse; }
          .meta-table td { padding: 0.5pt 0; border: none; text-align: left; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 5pt; font-size: 9.5pt; flex: 1; }
          .items-table th { font-size: 10pt; font-weight: bold; border: 1.2pt solid #000; padding: 4pt; text-align: center; background: #e5e7eb; }
          .items-table td { border: 1.2pt solid #000; padding: 4pt; text-align: center; vertical-align: top; }
          .footer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 15pt; margin-top: 10pt; border-top: 1.2pt solid #000; padding-top: 8pt; }
          .remarks-area { font-size: 9.5pt; }
          .totals-area { font-size: 10pt; font-weight: bold; }
          .grand-total { font-size: 13pt; font-weight: bold; border-top: 1.5pt solid #000; padding-top: 4pt; margin-top: 4pt; }
        }
        .page { width: 297mm; min-height: 210mm; padding: 5mm; background: #fff; box-sizing: border-box; border: 1px solid #000; margin: 10px auto; font-family: Arial, sans-serif; display: flex; flex-direction: column; }
        .company-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5pt solid #000; padding-bottom: 3pt; margin-bottom: 5pt; }
        .company-logo { width: 70pt; }
        .company-info { text-align: center; flex: 1; }
        .company-name { font-size: 18pt; font-weight: bold; margin: 0; }
        .company-details { font-size: 9.5pt; margin-top: 1px; }
        .gst-row { font-size: 9.5pt; display: flex; justify-content: space-between; background: #f3f4f6; padding: 3pt 8pt; border: 0.8pt solid #000; font-weight: bold; }
        .title { font-size: 15pt; font-weight: bold; text-align: center; margin: 5pt 0; }
        .info-container { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt; margin-bottom: 8pt; }
        .section-title { font-weight: 900; text-decoration: underline; margin-bottom: 2pt; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 5pt; font-size: 9.5pt; flex: 1; }
        .items-table th { border: 1pt solid #000; padding: 4pt; background: #e5e7eb; }
        .items-table td { border: 1pt solid #000; padding: 4pt; }
        .footer-section { display: grid; grid-template-columns: 1fr 1fr; gap: 15pt; margin-top: 10pt; border-top: 1pt solid #000; padding-top: 8pt; }
        .grand-total { font-size: 13pt; font-weight: bold; border-top: 1.5pt solid #000; padding-top: 4pt; margin-top: 4pt; }
      `}</style>

      {pages.map((pageItems, pageIndex) => (
        <div key={pageIndex} className={`page ${pageIndex < totalPages - 1 ? 'page-break' : ''}`}>
          <div className="company-header">
            <img src={fas} alt="FAS Logo" className="company-logo" />
            <div className="company-info">
              <h1 className="company-name">Fluoro Automation Seals Pvt Ltd</h1>
              <p className="company-details">
                3/180, Rajiv Gandhi Road, Mettukuppam, Chennai 600097<br/>
                Tamil Nadu, India | Phone: +91-841175097 | Email: fas@fluoroautomationseals.com
              </p>
            </div>
          </div>

          <div className="gst-row">
            <span>GSTIN: 33AAECF2716M1ZO</span>
            <span>PAN: AAECF2716M</span>
            <span>CIN: U25209TN2020PTC138498</span>
          </div>

          <div className="title">PROFORMA INVOICE</div>

          <div className="info-container">
            <div className="bill-section">
              <div className="section-title">Customer:</div>
              <div style={{ fontWeight: 'bold' }}>{order.customerName || '—'}</div>
              <div style={{ whiteSpace: 'pre-line', marginTop: '2pt' }}>{order.customerAddress || '—'}</div>
              <div style={{ marginTop: '5pt' }}>
                <strong>GSTIN:</strong> {order.customerGST || '—'}<br/>
                <strong>PAN:</strong> {order.customerPAN || '—'}
              </div>
            </div>

            <div className="ship-section">
              <div className="section-title">Logistics & Billing:</div>
              <table className="meta-table">
                <tbody>
                  <tr><td><strong>Payment Terms:</strong></td><td>{order.paymentTerms || '—'}</td></tr>
                  <tr><td><strong>Dispatch Mode:</strong></td><td>{order.dispatchMode || '—'}</td></tr>
                  <tr><td><strong>Currency:</strong></td><td>{order.currency} {symbol}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="meta-section">
              <table className="meta-table">
                <tbody>
                  <tr><td><strong>PI No:</strong></td><td style={{ fontSize: '10pt', fontWeight: 'bold' }}>PI-{order.soNumber}</td></tr>
                  <tr><td><strong>PI Date:</strong></td><td>{safeFormatDate(order.soDate)}</td></tr>
                  <tr><td><strong>PO No:</strong></td><td>{order.customerPONo || '—'}</td></tr>
                  <tr><td><strong>PO Date:</strong></td><td>{safeFormatDate(order.customerPODate)}</td></tr>
                  <tr><td><strong>Ref SO No:</strong></td><td>{order.soNumber}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th style={{ width: '40pt' }}>Sr.</th>
                <th>SKU / Code</th>
                <th style={{ width: '30%' }}>Description</th>
                <th>HSN</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item: any, i: number) => (
                <tr key={i}>
                  <td>{pageIndex * ITEMS_PER_PAGE + i + 1}</td>
                  <td>{item.productCode}</td>
                  <td style={{ textAlign: 'left' }}>
                    {item.productDescription || item.productName}
                  </td>
                  <td>{item.hsnCode || '—'}</td>
                  <td>{fmt(item.qty || item.quantity)} {item.unit || 'Nos'}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.unitRate || item.rate)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.netAmount || (item.qty * item.unitRate))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageIndex === totalPages - 1 && (
            <div className="footer-section">
              <div className="remarks-area">
                <div style={{ border: '1pt solid #000', padding: '5pt', background: '#f9fafb' }}>
                  <div className="section-title" style={{ textDecoration: 'none', fontSize: '9pt' }}>Bank Details for Payment:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '60pt 1fr', fontSize: '8.5pt' }}>
                    <strong>Bank:</strong><span>HDFC Bank</span>
                    <strong>A/C Nos:</strong><span>50200012345678</span>
                    <strong>IFSC:</strong><span>HDFC0001234</span>
                    <strong>Branch:</strong><span>Chennai Main</span>
                  </div>
                </div>
                <div style={{ fontStyle: 'italic', marginTop: '8pt' }}>
                  <strong>Amount in Words:</strong> {numberToWords(order.grandTotal)}
                </div>
              </div>

              <div className="totals-area" style={{ textAlign: 'right' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100pt', gap: '5pt' }}>
                  <span>Subtotal:</span><span>{symbol}{fmt(order.subtotal)}</span>
                  {showGST && order.cgstAmount > 0 && <>
                    <span>CGST @{order.cgstPercent}%:</span><span>{symbol}{fmt(order.cgstAmount)}</span>
                    <span>SGST @{order.sgstPercent}%:</span><span>{symbol}{fmt(order.sgstAmount)}</span>
                  </>}
                  {order.transportCharge > 0 && 
                    <><span>Transport @{order.transportChargePercent}%:</span><span>{symbol}{fmt(order.transportCharge)}</span></>}
                </div>
                <div className="grand-total">
                  Total PI Amount ({order.currency}): {symbol}{fmt(order.grandTotal)}
                </div>
                <div style={{ marginTop: '30pt' }}>
                  <div style={{ marginBottom: '40pt' }}>For Fluoro Automation Seals Pvt Ltd</div>
                  <div style={{ borderTop: '1pt solid #000', width: '150pt', marginLeft: 'auto', textAlign: 'center' }}>
                    Authorised Signatory
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
