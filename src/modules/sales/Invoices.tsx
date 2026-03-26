"use client"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Edit, Trash2, Plus, X, Copy, Search, Calendar, Filter, Eye, Ban } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { getAllRecords, deleteRecord, updateRecord } from "@/services/firebase"
import CreateInvoice from "./CreateInvoice"
import fas from "./fas.png"
import { Textarea } from "@/components/ui/textarea"
import { formatAddress } from "@/utils/addressUtils"

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
}

// Professional Invoice Template - COMPLETE WITH ALL CONTENT VISIBLE
// Professional Invoice Template - A4 Portrait, Tally-style format
const FullInvoiceTemplate = ({ invoice }: { invoice: any }) => {
  const currency = invoice.currency || "INR"
  const symbol = CURRENCY_SYMBOLS[currency]

  const numberToWords = (num: number): string => {
    if (currency !== "INR") return "";
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const integerPart = Math.floor(num);
    if (integerPart === 0) return "INR Zero Rupees Only";
    function convertTwoDigit(n: number): string {
      if (n < 10) return units[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + units[n % 10] : "");
    }
    let word = "";
    let part = Math.floor(integerPart / 10000000); if (part > 0) { word += convertTwoDigit(part) + " Crore "; }
    part = Math.floor(integerPart / 100000) % 100; if (part > 0) { word += convertTwoDigit(part) + " Lakh "; }
    part = Math.floor(integerPart / 1000) % 100; if (part > 0) { word += convertTwoDigit(part) + " Thousand "; }
    part = Math.floor(integerPart / 100) % 10; if (part > 0) { word += units[part] + " Hundred "; }
    part = integerPart % 100; if (part > 0) { word += convertTwoDigit(part) + " "; }
    return "INR " + word.trim() + " Rupees Only";
  };

  const formatAmount = (n: number) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const amountInWords = numberToWords(invoice.grandTotal || 0)
  const transportCharge = Number(invoice.transportCharge || 0)
  const taxableAmount = invoice.taxableAmount || 0

  // Table cell helpers
  const b1 = "1px solid #000"
  const th = (extra: any = {}) => ({ border: b1, padding: "5px 4px", fontWeight: 900, background: "#f0f0f0", fontSize: "11px", ...extra })
  const td = (extra: any = {}) => ({ border: b1, padding: "5px 4px", fontSize: "11px", ...extra })

  return (
    <div style={{ width: "794px", background: "#fff", margin: "0 auto", padding: "8px", fontFamily: "Arial, sans-serif", boxSizing: "border-box" as const, color: "#000" }}>
      <div style={{ border: "2px solid #000" }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", padding: "8px 12px", borderBottom: "2px solid #000" }}>
          <img src={fas} alt="FAS" style={{ width: "55px", margin: "0 auto 3px", display: "block" }} />
          <div style={{ fontSize: "15px", fontWeight: 900 }}>Fluoro Automation Seals Pvt Ltd</div>
          <div style={{ fontSize: "10px", fontWeight: 600, margin: "1px 0" }}>3/180, Rajiv Gandhi Road, Mettukuppam, Chennai Tamil Nadu 600097 India</div>
          <div style={{ fontSize: "10px", fontWeight: 600, margin: "1px 0" }}>Phone: 9841175097 | Email: fas@fluoroautomationseals.com</div>
          <div style={{ fontSize: "10px", fontWeight: 700, margin: "1px 0" }}>GSTIN/UIN: 33AAECF2716M1ZO &nbsp;|&nbsp; State Name: Tamil Nadu, Code: 33</div>
        </div>

        {/* ── INVOICE TITLE ── */}
        <div style={{ textAlign: "center", padding: "4px 0", borderBottom: "2px solid #000", fontWeight: 900, fontSize: "13px", letterSpacing: "1px" }}>
          INVOICE
        </div>

        {/* ── SINGLE META GRID (4 columns: label | value | label | value) ── */}
        <div style={{ borderBottom: "2px solid #000" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ ...td(), width: "18%", color: "#555" }}>Invoice No.</td>
                <td style={{ ...td(), width: "32%", fontWeight: 900, fontSize: "13px" }}>{invoice.invoiceNumber}</td>
                <td style={{ ...td(), width: "18%", color: "#555" }}>Dated</td>
                <td style={{ ...td(), width: "32%", fontWeight: 900, fontSize: "13px" }}>
                  {(() => {
                    try {
                      if (!invoice.invoiceDate) return "";
                      const d = new Date(invoice.invoiceDate);
                      return isNaN(d.getTime()) ? "" : format(d, "d-MMM-yy");
                    } catch (e) {
                      return "";
                    }
                  })()}
                </td>
              </tr>
              <tr>
                <td style={{ ...td(), color: "#555" }}>Delivery Note</td>
                <td style={td()}></td>
                <td style={{ ...td(), color: "#555" }}>Mode/Terms of Payment</td>
                <td style={{ ...td(), fontWeight: 900 }}>{invoice.paymentTerms || "30 Days"}</td>
              </tr>
              <tr>
                <td style={{ ...td(), color: "#555" }}>Customer PO No.</td>
                <td style={{ ...td(), fontWeight: 800 }}>{invoice.customerPO || ""}</td>
                <td style={{ ...td(), color: "#555" }}>Customer PO Date</td>
                <td style={{ ...td(), fontWeight: 800 }}>
                  {(() => {
                    try {
                      if (!invoice.customerPODate) return "";
                      const d = new Date(invoice.customerPODate);
                      return isNaN(d.getTime()) ? "" : format(d, "d-MMM-yy");
                    } catch (e) {
                      return "";
                    }
                  })()}
                </td>
              </tr>
              <tr>
                <td style={{ ...td(), color: "#555" }}>Buyer's Order No.</td>
                <td style={td()}></td>
                <td style={{ ...td(), color: "#555" }}>Dated</td>
                <td style={td()}></td>
              </tr>
              <tr>
                <td style={{ ...td(), color: "#555" }}>Dispatch Doc No.</td>
                <td style={td()}></td>
                <td style={{ ...td(), color: "#555" }}>Delivery Note Date</td>
                <td style={td()}></td>
              </tr>
              <tr>
                <td style={{ ...td(), color: "#555" }}>Dispatched through</td>
                <td style={{ ...td(), fontWeight: 900 }}>{invoice.transportMode || invoice.modeOfDispatch || "Courier"}</td>
                <td style={{ ...td(), color: "#555" }}>Destination</td>
                <td style={{ ...td(), fontWeight: 900 }}>{invoice.placeOfSupply || "Tamil Nadu"}</td>
              </tr>
              <tr>
                <td style={{ ...td(), color: "#555" }}>Terms of Delivery</td>
                <td style={td()}>{invoice.deliveryTerm || ""}</td>
                <td style={{ ...td(), color: "#555" }}>E-Way Bill No.</td>
                <td style={td()}>{invoice.eWayBillNo || ""}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── ADDRESS SECTION: Left=Company+ShipTo | Right=meta already above, so just Bill To ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #000" }}>
          {/* Left: Company address (top) + Ship To (bottom) */}
          <div style={{ borderRight: "1px solid #000", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "6px 8px", borderBottom: "1px solid #ccc", fontSize: "10px" }}>
              <div style={{ fontWeight: 900, fontSize: "11px", marginBottom: "2px" }}>Fluoro Automation Seals Pvt Ltd</div>
              <div style={{ fontWeight: 600, lineHeight: 1.4, color: "#222" }}>
                3/180, Rajiv Gandhi Road, Mettukuppam,<br />
                Chennai Tamil Nadu 600097 India<br />
                Phone: 9841175097 | Email: fas@fluoroautomationseals.com<br />
                GSTIN/UIN: 33AAECF2716M1ZO<br />
                State Name: Tamil Nadu, Code: 33
              </div>
            </div>
            <div style={{ padding: "6px 8px", fontSize: "10px" }}>
              <div style={{ fontWeight: 700, color: "#555", marginBottom: "2px" }}>Ship to Add.</div>
              <div style={{ fontWeight: 900, fontSize: "11px", marginBottom: "2px" }}>{invoice.customerName}</div>
              <pre style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", whiteSpace: "pre-wrap", margin: "0 0 2px 0", fontWeight: 600, lineHeight: 1.3 }}>
                {formatAddress(invoice.shippingAddress || invoice.billingAddress)}
              </pre>
              {invoice.customerGST && <div style={{ fontWeight: 700 }}>GSTIN/UIN: {invoice.customerGST}</div>}
            </div>
          </div>

          {/* Right: Buyer (Bill to) */}
          <div style={{ padding: "6px 8px", fontSize: "10px" }}>
            <div style={{ fontWeight: 700, color: "#555", marginBottom: "2px" }}>Buyer (Bill to)</div>
            <div style={{ fontWeight: 900, fontSize: "11px", marginBottom: "2px" }}>{invoice.customerName}</div>
            <pre style={{ fontFamily: "Arial, sans-serif", fontSize: "10px", whiteSpace: "pre-wrap", margin: "0 0 2px 0", fontWeight: 600, lineHeight: 1.3 }}>
              {formatAddress(invoice.billingAddress)}
            </pre>
            {invoice.customerGST && <div style={{ fontWeight: 700 }}>GSTIN/UIN: {invoice.customerGST}</div>}
            {invoice.billingAddress?.state && <div style={{ fontWeight: 700 }}>State Name: {invoice.billingAddress.state}</div>}
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th rowSpan={2} style={th({ textAlign: "center", verticalAlign: "middle" })}>SI No</th>
              <th rowSpan={2} style={th({ verticalAlign: "middle" })}>Description of Goods and Services</th>
              <th rowSpan={2} style={th({ textAlign: "center", verticalAlign: "middle" })}>HSN/SAC</th>
              <th rowSpan={2} style={th({ textAlign: "center", verticalAlign: "middle" })}>Qty</th>
              <th rowSpan={2} style={th({ textAlign: "center", verticalAlign: "middle" })}>UOM</th>
              <th rowSpan={2} style={th({ textAlign: "right", verticalAlign: "middle" })}>Rate</th>
              <th rowSpan={2} style={th({ textAlign: "center", verticalAlign: "middle" })}>per</th>
              <th rowSpan={2} style={th({ textAlign: "right", verticalAlign: "middle" })}>Disc. ₹</th>
              <th colSpan={2} style={th({ textAlign: "center" })}>CGST</th>
              <th colSpan={2} style={th({ textAlign: "center" })}>SGST/UTGST</th>
              <th rowSpan={2} style={th({ textAlign: "right", verticalAlign: "middle" })}>Total</th>
            </tr>
            <tr>
              <th style={th({ textAlign: "center", fontSize: "10px" })}>%</th>
              <th style={th({ textAlign: "right", fontSize: "10px" })}>Amt</th>
              <th style={th({ textAlign: "center", fontSize: "10px" })}>%</th>
              <th style={th({ textAlign: "right", fontSize: "10px" })}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item: any, i: number) => {
              const qty = item.qty ?? item.invoicedQty ?? 0
              const rate = item.rate || item.unitRate || 0
              const amount = item.amount || (qty * rate) || 0
              const disc = item.discount || 0
              const taxable = item.taxableValue || item.taxable || (amount - disc) || 0
              const lineTotal = taxable + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0)
              return (
                <tr key={i}>
                  <td style={td({ textAlign: "center", fontWeight: 700 })}>{i + 1}</td>
                  <td style={td({ wordWrap: "break-word", whiteSpace: "normal", lineHeight: 1.3 })}>
                    <div style={{ fontWeight: 800 }}>{item.partCode || item.productCode || ""}</div>
                    <div style={{ fontSize: "9px", color: "#333", fontWeight: 500 }}>{item.description || item.productDescription || item.productName || ""}</div>
                  </td>
                  <td style={td({ textAlign: "center", fontWeight: 600 })}>{item.hsnCode || item.hsn || ""}</td>
                  <td style={td({ textAlign: "center", fontWeight: 800 })}>{qty}</td>
                  <td style={td({ textAlign: "center", fontWeight: 600 })}>{item.uom || item.unit || "NOS"}</td>
                  <td style={td({ textAlign: "right", fontWeight: 700 })}>{formatAmount(rate)}</td>
                  <td style={td({ textAlign: "center", fontWeight: 600 })}>{item.uom || item.unit || "NOS"}</td>
                  <td style={td({ textAlign: "right", fontWeight: 700 })}>{formatAmount(disc)}</td>
                  <td style={td({ textAlign: "center", fontWeight: 700 })}>{Number(item.cgstPercent || 0).toFixed(1)}</td>
                  <td style={td({ textAlign: "right", fontWeight: 700 })}>{formatAmount(item.cgstAmount || 0)}</td>
                  <td style={td({ textAlign: "center", fontWeight: 700 })}>{Number(item.sgstPercent || 0).toFixed(1)}</td>
                  <td style={td({ textAlign: "right", fontWeight: 700 })}>{formatAmount(item.sgstAmount || 0)}</td>
                  <td style={td({ textAlign: "right", fontWeight: 900, background: "#fafafa" })}>{formatAmount(lineTotal)}</td>
                </tr>
              )
            })}
            {/* TOTAL ROW */}
            <tr style={{ background: "#f0f0f0", fontWeight: 900 }}>
              <td colSpan={3} style={td({ textAlign: "right", fontWeight: 900, fontSize: "11px" })}>Total</td>
              <td style={td({ textAlign: "center", fontWeight: 900 })}>{invoice.lineItems?.reduce((s: number, i: any) => s + Number(i.qty ?? i.invoicedQty ?? 0), 0) || 0}</td>
              <td colSpan={4} style={td()}></td>
              <td style={td()}></td>
              <td style={td({ textAlign: "right", fontWeight: 900 })}>{formatAmount(invoice.lineItems?.reduce((s: number, i: any) => s + (i.cgstAmount || 0), 0) || 0)}</td>
              <td style={td()}></td>
              <td style={td({ textAlign: "right", fontWeight: 900 })}>{formatAmount(invoice.lineItems?.reduce((s: number, i: any) => s + (i.sgstAmount || 0), 0) || 0)}</td>
              <td style={td({ textAlign: "right", fontWeight: 900 })}>{formatAmount(invoice.grandTotal || 0)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── AMOUNT IN WORDS ── */}
        <div style={{ borderTop: "2px solid #000", padding: "5px 8px", fontSize: "10px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: "2px" }}>Amount Chargeable (in words)</div>
            <div style={{ fontWeight: 900, fontSize: "11px" }}>{amountInWords}</div>
          </div>
          <div style={{ fontWeight: 700, fontSize: "9px", alignSelf: "flex-end" }}>E. &amp; O.E</div>
        </div>

        {/* ── GST SUMMARY TABLE ── */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", borderTop: "2px solid #000" }}>
          <thead style={{ background: "#f0f0f0" }}>
            <tr>
              <th style={th({ textAlign: "left" })}>HSN/SAC</th>
              <th style={th({ textAlign: "right" })}>Taxable Value</th>
              <th colSpan={2} style={th({ textAlign: "center" })}>Central Tax</th>
              <th colSpan={2} style={th({ textAlign: "center" })}>State Tax</th>
              <th style={th({ textAlign: "right" })}>Total Tax Amount</th>
            </tr>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={th()}></th><th style={th()}></th>
              <th style={th({ textAlign: "center" })}>Rate</th>
              <th style={th({ textAlign: "right" })}>Amount</th>
              <th style={th({ textAlign: "center" })}>Rate</th>
              <th style={th({ textAlign: "right" })}>Amount</th>
              <th style={th()}></th>
            </tr>
          </thead>
          <tbody>
            {(invoice.lineItems || []).map((item: any, i: number) => (
              <tr key={i}>
                <td style={td()}>{item.hsnCode || item.hsn || ""}</td>
                <td style={td({ textAlign: "right" })}>{formatAmount(item.taxableValue || item.taxable || 0)}</td>
                <td style={td({ textAlign: "center" })}>{Number(item.cgstPercent || 0).toFixed(1)}%</td>
                <td style={td({ textAlign: "right" })}>{formatAmount(item.cgstAmount || 0)}</td>
                <td style={td({ textAlign: "center" })}>{Number(item.sgstPercent || 0).toFixed(1)}%</td>
                <td style={td({ textAlign: "right" })}>{formatAmount(item.sgstAmount || 0)}</td>
                <td style={td({ textAlign: "right" })}>{formatAmount((item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0))}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 900, background: "#f0f0f0" }}>
              <td style={td({ textAlign: "right" })}>Total</td>
              <td style={td({ textAlign: "right" })}>{formatAmount(invoice.lineItems?.reduce((s: number, i: any) => s + (i.taxableValue || i.taxable || 0), 0) || 0)}</td>
              <td style={td()}></td>
              <td style={td({ textAlign: "right" })}>{formatAmount(invoice.lineItems?.reduce((s: number, i: any) => s + (i.cgstAmount || 0), 0) || 0)}</td>
              <td style={td()}></td>
              <td style={td({ textAlign: "right" })}>{formatAmount(invoice.lineItems?.reduce((s: number, i: any) => s + (i.sgstAmount || 0), 0) || 0)}</td>
              <td style={td({ textAlign: "right" })}>{formatAmount(invoice.lineItems?.reduce((s: number, i: any) => s + (i.cgstAmount || 0) + (i.sgstAmount || 0) + (i.igstAmount || 0), 0) || 0)}</td>
            </tr>
          </tbody>
        </table>

        {/* ── TAX IN DIGITS ── */}
        <div style={{ borderTop: "2px solid #000", padding: "4px 8px", fontSize: "10px", fontWeight: 700 }}>
          Tax Amount (in digits) : <strong>₹{formatAmount((invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0))}</strong>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ borderTop: "2px solid #000", display: "grid", gridTemplateColumns: "1fr 1fr", fontSize: "10px" }}>
          <div style={{ borderRight: "1px solid #000", padding: "6px 8px" }}>
            <div style={{ fontWeight: 800, marginBottom: "3px" }}>Company's PAN: <strong>AAECF2716M</strong></div>
            <div style={{ marginTop: "6px" }}>
              <div style={{ fontWeight: 800, textDecoration: "underline", marginBottom: "2px" }}>Declaration</div>
              <div style={{ fontSize: "9px", fontStyle: "italic", color: "#333", lineHeight: 1.4 }}>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </div>
            </div>
          </div>
          <div style={{ padding: "6px 8px" }}>
            <div style={{ fontWeight: 800, textDecoration: "underline", marginBottom: "3px" }}>Company's Bank Details</div>
            <div style={{ lineHeight: 1.6 }}>
              <div>Bank Name &nbsp;&nbsp;&nbsp;&nbsp;: <strong>HDFC Bank Ltd</strong></div>
              <div>A/c No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <strong>50200021300057</strong></div>
              <div>Branch &amp; IFS Code : <strong>Mettukuppam &amp; HDFC0001000</strong></div>
            </div>
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>for Fluoro Automation Seals Pvt Ltd</div>
              <div style={{ marginTop: "25px", borderTop: "1px solid #000", paddingTop: "3px", fontWeight: 800 }}>Authorised Signatory</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}



// Modal Preview with Download
const InvoicePreviewModal = ({ invoice, onClose }: { invoice: any; onClose: () => void }) => {
  const printRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Use hidden offscreen element - not clipped by modal overflow
      const element = hiddenRef.current;
      if (!element) throw new Error("No element");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.height / canvas.width;
      const imgHeightInPdf = pdfWidth * imgRatio;

      if (imgHeightInPdf <= pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeightInPdf);
      } else {
        let yOffset = 0;
        const pageHeightPx = (pdfHeight / pdfWidth) * canvas.width;
        while (yOffset < canvas.height) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(pageHeightPx, canvas.height - yOffset);
          const ctx = pageCanvas.getContext("2d")!;
          ctx.drawImage(canvas, 0, yOffset, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
          const pageImg = pageCanvas.toDataURL("image/png");
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(pageImg, "PNG", 0, 0, pdfWidth, (pageCanvas.height / canvas.width) * pdfWidth);
          yOffset += pageHeightPx;
        }
      }
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      toast.success("Invoice downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      {/* Hidden offscreen element for PDF capture - not clipped by modal */}
      <div
        ref={hiddenRef}
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          width: "794px",
          background: "#fff",
          zIndex: -1,
        }}
      >
        <FullInvoiceTemplate invoice={invoice} />
      </div>

      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-[900px] max-h-[95vh] overflow-y-auto p-4">
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <DialogTitle className="text-xl font-bold text-blue-900">
                Invoice Preview - {invoice.invoiceNumber}
              </DialogTitle>
              <Button
                className="bg-green-600 hover:bg-green-700 shadow-lg"
                onClick={handleDownload}
                disabled={isDownloading}
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                {isDownloading ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </DialogHeader>

          <div
            ref={printRef}
            className="bg-white rounded-lg overflow-visible shadow-xl"
            style={{ maxWidth: "800px", margin: "0 auto" }}
          >
            <FullInvoiceTemplate invoice={invoice} />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} size="lg">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y)
  }
  return years.sort((a, b) => b - a)
}

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const navigate = useNavigate()
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancellingInvoice, setCancellingInvoice] = useState<any | null>(null);
  const [cancelRemark, setCancelRemark] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const openCancelInvoice = (inv: any) => {
    setCancellingInvoice(inv);
    setCancelRemark('');
    setIsCancelOpen(true);
  };

  const handleCancelInvoice = async () => {
    if (!cancellingInvoice) return;
    if (!cancelRemark.trim()) {
      toast.error('Please enter a cancellation remark');
      return;
    }
    setIsCancelling(true);
    try {
      const now = Date.now();

      // 1. Mark invoice as cancelled
      await updateRecord('sales/invoices', cancellingInvoice.id, {
        status: 'cancelled',
        cancelledAt: now,
        cancelRemark: cancelRemark.trim(),
        updatedAt: now,
      });

      // 2. Unlock the linked sales order (set back to Confirmed so it can be re-invoiced)
      if (cancellingInvoice.orderId) {
        await updateRecord('sales/orderAcknowledgements', cancellingInvoice.orderId, {
          invoiceStatus: 'notgenerated',
          updatedAt: now,
        });
      }

      toast.success(`Invoice ${cancellingInvoice.invoiceNumber} cancelled. Linked order unlocked.`);

      // Update local state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === cancellingInvoice.id
            ? { ...inv, status: 'cancelled', cancelledAt: now, cancelRemark: cancelRemark.trim() }
            : inv
        )
      );

      setIsCancelOpen(false);
      setCancellingInvoice(null);
      setCancelRemark('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoiceData, customerData] = await Promise.all([
          getAllRecords("sales/invoices"),
          getAllRecords("sales/customers"),
        ])

        const sortedInvoices = (invoiceData as any[]).sort(
          (a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)
        )
        setInvoices(sortedInvoices)
        setFilteredInvoices(sortedInvoices)

        const sortedCustomers = (customerData as any[]).sort((a: any, b: any) =>
          a.companyName.localeCompare(b.companyName)
        )
        setCustomers(sortedCustomers)
      } catch (err) {
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    let result = [...invoices]

    if (selectedCustomerId !== "all") {
      result = result.filter((inv: any) => inv.customerId === selectedCustomerId)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((inv: any) => {
        const invoiceNumber = (inv.invoiceNumber || "").toLowerCase()
        const customerName = (inv.customerName || "").toLowerCase()
        return invoiceNumber.startsWith(query) || customerName.startsWith(query)
      })
    }

    if (selectedDate) {
      result = result.filter((inv: any) => {
        const invDate = new Date(inv.invoiceDate).toISOString().split("T")[0]
        return invDate === selectedDate
      })
    }

    setFilteredInvoices(result)
  }, [selectedCustomerId, searchQuery, invoices, selectedDate])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice permanently?")) return

    try {
      await deleteRecord("sales/invoices", id)
      toast.success("Invoice deleted")
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
      setFilteredInvoices((prev) => prev.filter((inv) => inv.id !== id))
    } catch (err) {
      toast.error("Delete failed")
    }
  }

  const handleDuplicate = (id: string) => {
    navigate(`/sales/invoices/edit/${id}?duplicate=true`)
    toast.info("Duplicating invoice - a new invoice number will be generated.")
  }

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCustomerId("all")
    setSelectedDate("")
  }

  const hasActiveFilters = searchQuery || selectedCustomerId !== "all" || selectedDate
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">GST Invoices</h1>
            <p className="text-sm text-gray-600 mt-1">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""} · Total: ₹
              {totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button onClick={() => navigate("/sales/invoices/create")}>
            <Plus className="h-5 w-5 mr-2" />
            Create New Invoice
          </Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">All Invoices</TabsTrigger>
            <TabsTrigger value="create">Create / Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Filters</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="relative flex-1 min-w-[280px]">
                    <Label className="text-sm font-medium mb-2 block">Search</Label>
                    <Search className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by invoice number or customer name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="relative w-[200px]">
                    <Label className="text-sm font-medium mb-2 block">Date</Label>
                    <Calendar className="absolute left-3 top-10 h-5 w-5 text-gray-400" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate("")}
                        className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="w-[220px]">
                    <Label className="text-sm font-medium mb-2 block">Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        {customers.map((cust) => (
                          <SelectItem key={cust.id} value={cust.id}>
                            {cust.companyName} ({cust.customerCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasActiveFilters && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  Found {filteredInvoices.length} result{filteredInvoices.length !== 1 ? "s" : ""}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {selectedCustomerId !== "all" &&
                    ` for ${customers.find((c) => c.id === selectedCustomerId)?.companyName}`}
                  {selectedDate && ` on ${format(new Date(selectedDate), "dd-MM-yyyy")}`}
                </p>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>All Generated Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8">Loading invoices...</p>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {hasActiveFilters ? (
                      <>
                        <p className="text-lg font-medium mb-2">No invoices found</p>
                        <p className="text-sm mb-4">No results match your current filters.</p>
                        <Button variant="outline" onClick={clearFilters}>
                          Clear All Filters
                        </Button>
                      </>
                    ) : (
                      <p>No invoices generated yet. Click "Create New Invoice" to get started.</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cancel Remark</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell className="font-mono font-semibold">
                              {inv.invoiceNumber}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                try {
                                  if (!inv.invoiceDate) return "—";
                                  const d = new Date(inv.invoiceDate);
                                  return isNaN(d.getTime()) ? "Invalid Date" : format(d, "dd-MM-yyyy");
                                } catch (e) {
                                  return "—";
                                }
                              })()}
                            </TableCell>
                            <TableCell>{inv.customerName}</TableCell>
                            <TableCell className="font-medium">
                              ₹{Number(inv.grandTotal || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${inv.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                {inv.status === 'cancelled' ? 'Cancelled' : 'Generated'}
                              </span>
                            </TableCell>
                            <TableCell className="space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewInvoice(inv)}
                                title="View"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDuplicate(inv.id)}
                                title="Duplicate"
                              >
                                <Copy className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/sales/invoices/edit/${inv.id}`)}
                                title={inv.status === 'cancelled' ? 'Cannot edit a cancelled invoice' : 'Edit'}
                                disabled={inv.status === 'cancelled'}
                                className={inv.status === 'cancelled' ? 'opacity-30 cursor-not-allowed' : ''}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {inv.status === 'cancelled' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                  <Ban className="h-3 w-3" />Cancelled
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openCancelInvoice(inv)}
                                  title="Cancel Invoice"
                                >
                                  <Ban className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                            </TableCell>
                            {/* Status cell — already exists, keep it */}
                            <TableCell>
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${inv.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                                }`}>
                                {inv.status === 'cancelled' ? 'Cancelled' : 'Generated'}
                              </span>
                            </TableCell>

                            {/* ADD THIS new cell right after: */}
                            <TableCell className="max-w-[200px]">
                              {inv.status === 'cancelled' && inv.cancelRemark ? (
                                <div className="flex items-start gap-1.5">
                                  <Ban className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                  <span
                                    className="text-xs text-red-700 line-clamp-2"
                                    title={inv.cancelRemark}
                                  >
                                    {inv.cancelRemark}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <CreateInvoice />
          </TabsContent>
        </Tabs>

        {selectedInvoice && (
          <InvoicePreviewModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
        )}
        {/* Cancel Invoice Dialog */}
        {isCancelOpen && cancellingInvoice && (
          <Dialog open={isCancelOpen} onOpenChange={(open) => { if (!open) { setIsCancelOpen(false); setCancelRemark(''); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-700">
                  <Ban className="h-5 w-5" />
                  Cancel Invoice — {cancellingInvoice.invoiceNumber}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Cancelling this invoice will mark it as <strong>Cancelled</strong> and unlock the linked sales order for re-invoicing. This action is recorded and cannot be undone.
                </p>
                <div>
                  <Label>Cancellation Remark <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={cancelRemark}
                    onChange={(e) => setCancelRemark(e.target.value)}
                    placeholder="e.g. Wrong quantity, customer dispute, billing error..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={() => { setIsCancelOpen(false); setCancelRemark(''); }}>
                  Keep Invoice
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleCancelInvoice}
                  disabled={!cancelRemark.trim() || isCancelling}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div >
  )
}