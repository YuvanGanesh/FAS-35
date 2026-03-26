import { format } from 'date-fns';
import fas from '../modules/sales/fas.png';

interface Branch {
  id: string;
  branchName: string;
  branchCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isHeadOffice?: boolean;
}

interface QuotationPrintProps {
  quotation: {
    quoteNumber: string;
    quoteDate: string;
    validity: string;
    paymentTerms: string;
    modeOfDispatch: string;
    deliveryTerm: string;
    remarks: string;
    comments: string;
    yourRef?: string;
    ourRef?: string;
    verNo?: string;
    verDate?: string;
    customerName: string;
    customerGST?: string;
    customerPAN?: string;
    customerCIN?: string;
    currency: string;
    currencySymbol: string;
    billingAddress?: Address | null;
    shippingAddress?: Address | null;
    selectedBranch?: Branch | null;
    lineItems: any[];
    subtotal: number;
    cgstAmount: number;
    sgstAmount: number;
    transportCharge: number;
    cgstPercent?: number;
    sgstPercent?: number;
    transportChargePercent?: number;
    grandTotal: number;
    includeGST: boolean;
    isWalkIn: boolean;
  };
}

interface Address {
  label: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

const formatAddress = (addr: Address | null | undefined) => {
  if (!addr) return '—';
  return `${addr.street}${addr.area ? `, ${addr.area}` : ''}\n${addr.city}, ${addr.state} - ${addr.pincode}\n${addr.country}`;
};

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
    if (n === 0) return 'Zero';
    
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
  
  if (paise > 0) {
    words += ' and ' + convertToWords(paise) + ' Paise';
  }
  
  return words + ' Only';
};

const formatBranchAddress = (branch: Branch | null | undefined) => {
  if (!branch) return null;
  return `${branch.branchName} (${branch.branchCode})\n${branch.address}\n${branch.city}, ${branch.state} - ${branch.pincode}\n${branch.country}\nContact: ${branch.contactPerson} | ${branch.phone}`;
};

const fmt = (num: number) => Number(num || 0).toFixed(2);

// Split items into pages
const ITEMS_PER_PAGE = 12;

export default function QuotationPrintTemplate({ quotation }: QuotationPrintProps) {
  if (!quotation) return null;

  const q = quotation;
  const isWalkIn = q.isWalkIn === true;
  const isINR = q.currency === 'INR';
  const symbol = q.currencySymbol || '₹';
  const showGST = q.includeGST && isINR;

  const pages: any[][] = [];
  for (let i = 0; i < q.lineItems.length; i += ITEMS_PER_PAGE) {
    pages.push(q.lineItems.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  const totalPages = pages.length;

  return (
    <>
      <style>{`
        /* A4 Page Setup */
        @page {
          size: A4 landscape;
          margin: 5mm;
        }

        /* Print Styles */
        @media print {
          body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
          }

          .page-break {
            page-break-after: always;
            break-after: page;
          }

          .page {
            width: 297mm;
            min-height: 210mm;
            padding: 5mm;
            background: #fff;
            box-sizing: border-box;
            border: 2px solid #000;
            display: flex;
            flex-direction: column;
            position: relative;
          }

          /* HEADER */
          .company-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2pt solid #000;
            padding-bottom: 3pt;
            margin-bottom: 5pt;
          }

          .company-logo {
            width: 70pt;
            height: auto;
          }

          .company-info {
            text-align: center;
            flex: 1;
          }

          .company-name {
            font-size: 18pt;
            font-weight: bold;
            margin: 0;
          }

          .company-details {
            font-size: 9.5pt;
            margin-top: 1pt;
          }

          .gst-row {
            font-size: 9.5pt;
            display: flex;
            justify-content: space-between;
            background: #f3f4f6;
            padding: 3pt 8pt;
            border: 1pt solid #000;
            font-weight: bold;
          }

          .title {
            font-size: 15pt;
            font-weight: bold;
            text-align: center;
            letter-spacing: 2pt;
            margin: 5pt 0;
            text-decoration: underline;
          }

          /* BILL + META */
          .info-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12pt;
            margin-bottom: 8pt;
          }

          .bill-section,
          .ship-section,
          .meta-section {
            font-size: 9.5pt;
          }

          .section-title {
            font-weight: 900;
            text-decoration: underline;
            margin-bottom: 2pt;
          }

          .meta-table {
            width: 100%;
            border-collapse: collapse;
          }

          .meta-table td {
            padding: 0.5pt 0;
            border: none;
            text-align: left;
          }

          /* TABLE */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5pt;
            font-size: 9.5pt;
            flex: 1;
          }

          .items-table th {
            font-size: 10pt;
            font-weight: bold;
            border: 1.2pt solid #000;
            padding: 4pt;
            text-align: center;
            background: #e5e7eb;
          }

          .items-table td {
            border: 1.2pt solid #000;
            padding: 4pt;
            text-align: center;
            vertical-align: top;
          }

          /* FOOTER */
          .footer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15pt;
            margin-top: 10pt;
            border-top: 1.2pt solid #000;
            padding-top: 8pt;
          }

          .remarks-area {
            font-size: 9.5pt;
          }

          .totals-area {
            font-size: 10pt;
            font-weight: bold;
          }

          .grand-total {
            font-size: 13pt;
            font-weight: bold;
            border-top: 1.5pt solid #000;
            padding-top: 4pt;
            margin-top: 4pt;
          }

          /* AVOID BREAKING */
          table, tr, td {
            page-break-inside: avoid;
          }
        }

        /* Non-print styles for preview */
        .page {
          width: 297mm;
          min-height: 210mm;
          padding: 5mm;
          background: #fff;
          box-sizing: border-box;
          border: 1px solid #000;
          margin: 10px auto;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .company-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1.5pt solid #000;
          padding-bottom: 3pt;
          margin-bottom: 5pt;
        }

        .company-logo { width: 70pt; }
        .company-info { text-align: center; flex: 1; }
        .company-name { font-size: 18pt; font-weight: bold; margin: 0; }
        .company-details { font-size: 9.5pt; margin-top: 1px; }
        .gst-row {
          font-size: 9.5pt;
          display: flex;
          justify-content: space-between;
          background: #f3f4f6;
          padding: 3pt 8pt;
          border: 0.8pt solid #000;
          font-weight: bold;
        }
        .title {
          font-size: 15pt;
          font-weight: bold;
          text-align: center;
          margin: 5pt 0;
          text-decoration: none;
        }
        .info-container {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12pt;
          margin-bottom: 8pt;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5pt;
          font-size: 9.5pt;
          flex: 1;
        }
        .items-table th {
          border: 1pt solid #000;
          padding: 4pt;
          background: #e5e7eb;
        }
        .items-table td {
          border: 1pt solid #000;
          padding: 4pt;
        }
        .footer-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15pt;
          margin-top: 10pt;
          border-top: 1pt solid #000;
          padding-top: 8pt;
        }
        .section-title {
          font-weight: 900;
          text-decoration: underline;
          margin-bottom: 2pt;
        }
        .grand-total {
          font-size: 13pt;
          font-weight: bold;
          border-top: 1.5pt solid #000;
          padding-top: 4pt;
          margin-top: 4pt;
        }
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

          <div className="title">SALES QUOTATION</div>

          <div className="info-container">
            <div className="bill-section">
              <div className="section-title">Bill To:</div>
              <div style={{ fontWeight: 'bold' }}>{q.customerName || '—'}</div>
              {!isWalkIn && q.billingAddress && (
                <div style={{ whiteSpace: 'pre-line', marginTop: '2pt' }}>
                  {formatAddress(q.billingAddress)}
                </div>
              )}
              {!isWalkIn && (
                <div style={{ marginTop: '5pt' }}>
                  <strong>GSTIN:</strong> {q.customerGST || '—'}<br/>
                  <strong>PAN:</strong> {q.customerPAN || '—'}
                </div>
              )}
              {isWalkIn && <div style={{ color: 'red', fontWeight: 'bold', marginTop: '5pt' }}>CASH SALE</div>}
            </div>

            <div className="ship-section">
              <div className="section-title">Ship To:</div>
              {!isWalkIn && q.shippingAddress ? (
                <div style={{ whiteSpace: 'pre-line' }}>{formatAddress(q.shippingAddress)}</div>
              ) : <div>Same as billing</div>}
              
              {!isWalkIn && q.selectedBranch && (
                <div style={{ marginTop: '5pt', padding: '4pt', border: '1pt solid #fb923c', background: '#fff7ed' }}>
                  <strong>Branch:</strong> {q.selectedBranch.branchName}<br/>
                  {q.selectedBranch.city}, {q.selectedBranch.state}
                </div>
              )}
            </div>

            <div className="meta-section">
              <table className="meta-table">
                <tbody>
                  <tr>
                    <td><strong>SQ No:</strong></td>
                    <td style={{ fontSize: '12pt', fontWeight: 'bold' }}>{q.quoteNumber}</td>
                  </tr>
                  <tr>
                    <td><strong>Date:</strong></td>
                    <td>
                      {(() => {
                        try {
                          if (!q.quoteDate) return '—';
                          const d = new Date(q.quoteDate);
                          return isNaN(d.getTime()) ? '—' : format(d, 'dd-MMM-yy');
                        } catch (e) { return '—'; }
                      })()}
                    </td>
                  </tr>
                  <tr><td><strong>Currency:</strong></td><td>{q.currency} {symbol}</td></tr>
                  <tr><td><strong>Validity:</strong></td><td>{q.validity || '30 Days'}</td></tr>
                  <tr><td><strong>Dispatch:</strong></td><td>{q.modeOfDispatch}</td></tr>
                  <tr><td><strong>Payment:</strong></td><td>{q.paymentTerms}</td></tr>
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
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item: any, i: number) => (
                <tr key={i}>
                  <td>{pageIndex * ITEMS_PER_PAGE + i + 1}</td>
                  <td>{item.productCode}</td>
                  <td style={{ textAlign: 'left' }}>
                    {item.productDescription}
                    {item.size && <div style={{ fontSize: '8pt', fontStyle: 'italic' }}>Size: {item.size}</div>}
                  </td>
                  <td>{item.hsnCode}</td>
                  <td>{fmt(item.qty)} {item.uom}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.unitRate)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.netAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageIndex === totalPages - 1 && (
            <div className="footer-section">
              <div className="remarks-area">
                <strong>Remarks:</strong> {q.remarks || 'None'}<br/>
                <strong>Comments:</strong> {q.comments || 'Thank you!'}<br/><br/>
                <div style={{ fontStyle: 'italic' }}>
                  <strong>Amount in Words:</strong> {numberToWords(q.grandTotal)}
                </div>
              </div>

              <div className="totals-area" style={{ textAlign: 'right' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100pt', gap: '5pt' }}>
                  <span>Subtotal:</span><span>{symbol}{fmt(q.subtotal)}</span>
                  {showGST && <>
                    <span>CGST @{q.cgstPercent}%:</span><span>{symbol}{fmt(q.cgstAmount)}</span>
                    <span>SGST @{q.sgstPercent}%:</span><span>{symbol}{fmt(q.sgstAmount)}</span>
                  </>}
                  {q.transportCharge > 0 && 
                    <><span>Transport @{q.transportChargePercent}%:</span><span>{symbol}{fmt(q.transportCharge)}</span></>}
                </div>
                <div className="grand-total">
                  Grand Total ({q.currency}): {symbol}{fmt(q.grandTotal)}
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
