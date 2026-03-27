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

const ITEMS_PER_PAGE = 8

// Professional Invoice Template - A4 Portrait, Tally-style format
const FullInvoiceTemplate = ({ invoice }: { invoice: any }) => {
  const currency = invoice.currency || "INR"
  const symbol = CURRENCY_SYMBOLS[currency]

  const numberToWords = (num: number): string => {
    if (currency !== "INR") return "";
    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ]
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ]
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ]
    const integerPart = Math.floor(num)
    if (integerPart === 0) return "Zero Rupees Only"
    function convertTwoDigit(n: number): string {
      if (n < 10) return units[n]
      if (n >= 10 && n < 20) return teens[n - 10]
      return tens[Math.floor(n / 10)] + (n % 10 > 0 ? " " + units[n % 10] : "")
    }
    let word = ""
    let part = Math.floor(integerPart / 10000000); if (part > 0) { word += convertTwoDigit(part) + " Crore "; }
    part = Math.floor(integerPart / 100000) % 100; if (part > 0) { word += convertTwoDigit(part) + " Lakh "; }
    part = Math.floor(integerPart / 1000) % 100; if (part > 0) { word += convertTwoDigit(part) + " Thousand "; }
    part = Math.floor(integerPart / 100) % 10; if (part > 0) { word += units[part] + " Hundred "; }
    part = integerPart % 100; if (part > 0) { word += convertTwoDigit(part) + " "; }
    return word.trim() + " Rupees Only";
  };

  const formatAmount = (n: number) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const amountInWords = numberToWords(invoice.grandTotal || 0)
  const taxableAmountValue =
    invoice.taxableAmount ||
    invoice.lineItems?.reduce(
      (sum: number, item: any) => sum + (item.taxableValue || item.taxable || 0),
      0
    ) ||
    0

  const items = invoice.lineItems || []
  const pages: any[][] = []
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pages.push(items.slice(i, i + ITEMS_PER_PAGE))
  }
  if (pages.length === 0) pages.push([])
  const totalPages = pages.length

  const bankDetails = {
    bankName: "Canara Bank",
    accountNo: "9921201001078",
    ifscCode: "CNRB0002617",
    branch: "Perungudi, Chennai 600096.",
  }

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        @media print {
          .page-break { page-break-after: always; break-after: page; }
        }
      `}</style>

      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className={pageIndex < totalPages - 1 ? "page-break" : ""}
          style={{ width: "210mm", minHeight: "297mm", background: "#fff", margin: "0 auto 40px", padding: "10mm", boxSizing: "border-box", border: "1px solid #ddd", fontFamily: "Arial, sans-serif" }}
        >
          <div style={{ width: "100%", border: "3px solid #000", height: "100%", display: "flex", flexDirection: "column" }}>

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid #000", padding: "10px" }}>
              <img src={fas} width="90" alt="Logo" />
              <div style={{ width: "80%", textAlign: "center" as const }}>
                <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "bold" }}>Fluoro Automation Seals Pvt Ltd</h1>
                <p style={{ margin: "2px 0", fontSize: "12px" }}>3/180, Rajiv Gandhi Road, Mettukuppam, Chennai, Tamil Nadu - 600097</p>
                <p style={{ margin: "2px 0", fontSize: "12px" }}>Phone: +91-9841175097 | Email: fas@fluoroautomationseals.com</p>
              </div>
            </div>

            {pageIndex === 0 && (
              <>
                {/* GST ROW */}
                <div style={{ display: "flex", justifyContent: "space-around", borderBottom: "2px solid #000", padding: "5px", fontWeight: "bold", fontSize: "11px" }}>
                  <div>GSTIN: 33AAECF2716M1ZO</div>
                  <div>PAN: AAECF2716M</div>
                  <div>CIN: U25209TN2020PTC138498</div>
                </div>

                {/* ROW 1: Shipping + Invoice Details 1 */}
                <div style={{ display: "flex", borderBottom: "1px solid #000" }}>
                  <div style={{ width: "50%", padding: "8px", borderRight: "1px solid #000" }}>
                    <strong style={{ fontSize: "12px" }}>Ship To:</strong>
                    <p style={{ margin: "3px 0", fontWeight: "bold", fontSize: "12px" }}>{invoice.customerName}</p>
                    <p style={{ margin: "3px 0", whiteSpace: "pre-wrap", fontSize: "11px" }}>{formatAddress(invoice.shippingAddress || invoice.billingAddress)}</p>
                  </div>
                  <div style={{ width: "50%", padding: "8px", fontSize: "11px" }}>
                    <p style={{ margin: "3px 0" }}><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
                    <p style={{ margin: "3px 0" }}>
                      <strong>Date:</strong> {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "dd-MM-yyyy") : ""}
                    </p>
                    <p style={{ margin: "3px 0" }}><strong>Payment Terms:</strong> {invoice.paymentTerms || "30 Days"}</p>
                    <p style={{ margin: "3px 0" }}><strong>Transporter Name:</strong> {invoice.transporterName || ""}</p>
                    <p style={{ margin: "3px 0" }}><strong>E-Way Bill No. :</strong> {invoice.eWayBillNo || ""}</p>
                    <p style={{ margin: "3px 0" }}><strong>E-Way Bill Date :</strong> {invoice.eWayBillDate || ""}</p>
                  </div>
                </div>

                {/* ROW 2: Billing + Invoice Details 2 */}
                <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
                  <div style={{ width: "50%", padding: "8px", borderRight: "1px solid #000" }}>
                    <strong style={{ fontSize: "12px" }}>Bill To:</strong>
                    <p style={{ margin: "3px 0", fontWeight: "bold", fontSize: "12px" }}>{invoice.customerName}</p>
                    <p style={{ margin: "3px 0", whiteSpace: "pre-wrap", fontSize: "11px" }}>{formatAddress(invoice.billingAddress)}</p>
                  </div>
                  <div style={{ width: "50%", padding: "8px", fontSize: "11px" }}>
                    <p style={{ margin: "3px 0" }}><strong>Transport Mode :</strong> {invoice.transportMode || ""}</p>
                    <p style={{ margin: "3px 0" }}><strong>Vehicle No. :</strong> {invoice.vehicleNo || ""}</p>
                    <p style={{ margin: "3px 0" }}><strong>Place of Supply:</strong> {invoice.placeOfSupply || "Tamil Nadu"}</p>
                    <p style={{ margin: "3px 0" }}><strong>Customer PO No. :</strong> {invoice.customerPONo || ""}</p>
                    <p style={{ margin: "3px 0" }}><strong>Customer PO Date :</strong> {invoice.customerPODate || ""}</p>
                  </div>
                </div>
              </>
            )}

            {pageIndex > 0 && (
              <div style={{ padding: "8px 16px", borderBottom: "2px solid #000" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 900, textAlign: "center", marginBottom: "3px" }}>INVOICE - {invoice.invoiceNumber} (Continued)</h3>
                <p style={{ fontSize: "9px", textAlign: "center", color: "#666", margin: 0 }}>Page {pageIndex + 1} of {totalPages}</p>
              </div>
            )}

            {/* TABLE */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#ffffff" }}>
                <thead style={{ background: "#f2f2f2" }}>
                  <tr style={{ fontSize: "12px" }}>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "3%" }}>S.No</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "25%" }}>Part Code / Description</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "8%" }}>HSN/SAC</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "5%" }}>Qty</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "4%" }}>UOM</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "8%", textAlign: "right" }}>Rate</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "9%", textAlign: "right" }}>Amount</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "4%", textAlign: "right" }}>Disc</th>
                    <th rowSpan={2} style={{ border: "1px solid #000", padding: "2px", width: "9%", textAlign: "right" }}>Taxable Value</th>
                    <th colSpan={2} style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>CGST</th>
                    <th colSpan={2} style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>SGST/UTGST</th>
                    <th colSpan={2} style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>IGST</th>
                  </tr>
                  <tr style={{ fontSize: "12px" }}>
                    <th style={{ border: "1px solid #000", padding: "2px", textAlign: "center", width: "3%" }}>%</th>
                    <th style={{ border: "1px solid #000", padding: "2px", textAlign: "right", width: "6%" }}>Amt</th>
                    <th style={{ border: "1px solid #000", padding: "2px", textAlign: "center", width: "3%" }}>%</th>
                    <th style={{ border: "1px solid #000", padding: "2px", textAlign: "right", width: "6%" }}>Amt</th>
                    <th style={{ border: "1px solid #000", padding: "2px", textAlign: "center", width: "3%" }}>%</th>
                    <th style={{ border: "1px solid #000", padding: "2px", textAlign: "right", width: "6%" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item: any, i: number) => {
                    const globalIndex = pageIndex * ITEMS_PER_PAGE + i
                    const qty = item.qty || item.invoicedQty || 0;
                    const rate = item.rate || item.unitRate || 0;
                    const amount = qty * rate;
                    const taxableValue = item.taxableValue || item.taxable || amount - (item.discount || 0);
                    return (
                      <tr key={i} style={{ fontSize: "12px" }}>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{globalIndex + 1}</td>
                        <td style={{ border: "1px solid #000", padding: "4px" }}>
                          <div style={{ fontWeight: "bold" }}>{item.partCode || item.productCode || ""}</div>
                          <div style={{ fontSize: "12px" }}>{item.description || item.productDescription || ""}</div>
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.hsnCode || item.hsn || ""}</td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>{qty}</td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.uom || "NOS"}</td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(rate)}</td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right", fontWeight: "bold" }}>{formatAmount(amount)}</td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(item.discount || 0)}</td>
                        <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right", fontWeight: "bold" }}>{formatAmount(taxableValue)}</td>
                        <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{item.cgstPercent || 0}</td>
                        <td style={{ border: "1px solid #000", padding: "2px", textAlign: "right" }}>{formatAmount(item.cgstAmount || 0)}</td>
                        <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{item.sgstPercent || 0}</td>
                        <td style={{ border: "1px solid #000", padding: "2px", textAlign: "right" }}>{formatAmount(item.sgstAmount || 0)}</td>
                        <td style={{ border: "1px solid #000", padding: "2px", textAlign: "center" }}>{item.igstPercent || 0}</td>
                        <td style={{ border: "1px solid #000", padding: "2px", textAlign: "right" }}>{formatAmount(item.igstAmount || 0)}</td>
                      </tr>
                    );
                  })}
                  {/* TOTAL ROW inside table */}
                  <tr style={{ backgroundColor: "#f2f2f2", fontWeight: "bold", fontSize: "12px" }}>
                    <td colSpan={6} style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>TOTAL</td>
                    <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(pageItems.reduce((s: number, i: any) => s + ((i.qty || i.invoicedQty || 0) * (i.rate || i.unitRate || 0)), 0))}</td>
                    <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(pageItems.reduce((s: number, i: any) => s + (i.discount || 0), 0))}</td>
                    <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(pageItems.reduce((s: number, i: any) => s + (i.taxableValue || i.taxable || ((i.qty || i.invoicedQty || 0) * (i.rate || i.unitRate || 0)) - (i.discount || 0)), 0))}</td>
                    <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                    <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(pageItems.reduce((s: number, i: any) => s + (i.cgstAmount || 0), 0))}</td>
                    <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                    <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(pageItems.reduce((s: number, i: any) => s + (i.sgstAmount || 0), 0))}</td>
                    <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                    <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatAmount(pageItems.reduce((s: number, i: any) => s + (i.igstAmount || 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {pageIndex === totalPages - 1 && (
              <>
                {/* TOTAL & SUMMARY SECTION */}
                <div style={{ display: "flex", border: "1px solid #000", borderTop: "none", background: "#fff", minHeight: "100px" }}>
                  <div style={{ width: "50%", borderRight: "1px solid #000", padding: "8px", fontSize: "11px" }}>
                    <p style={{ margin: "2px 0" }}>Items Total: <strong>₹{formatAmount(items.reduce((s: number, i: any) => s + ((i.qty || i.invoicedQty || 0) * (i.rate || i.unitRate || 0)), 0))}</strong></p>
                    <p style={{ margin: "2px 0" }}>Taxable Amount: <strong>₹{formatAmount(taxableAmountValue)}</strong></p>
                    {invoice.cgstAmount > 0 && <p style={{ margin: "2px 0", color: "#0066cc" }}>CGST: <strong>₹{formatAmount(invoice.cgstAmount || 0)}</strong></p>}
                    {invoice.sgstAmount > 0 && <p style={{ margin: "2px 0", color: "#0066cc" }}>SGST: <strong>₹{formatAmount(invoice.sgstAmount || 0)}</strong></p>}
                    {invoice.igstAmount > 0 && <p style={{ margin: "2px 0", color: "#0066cc" }}>IGST: <strong>₹{formatAmount(invoice.igstAmount || 0)}</strong></p>}
                    <p style={{ margin: "2px 0" }}>Round Off: <strong>₹{formatAmount(Math.round(invoice.grandTotal || 0))}</strong></p>
                  </div>
                  <div style={{ width: "50%", padding: "8px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>Grand Total: ₹{formatAmount(invoice.grandTotal || 0)}</h2>
                  </div>
                </div>

                <div style={{ padding: "8px", border: "1px solid #000", borderTop: "none", background: "#fff", fontSize: "11px" }}>
                  <p style={{ margin: 0 }}><strong>Amount in Words:</strong> {amountInWords}</p>
                </div>

                <div style={{ padding: "8px", border: "1px solid #000", borderTop: "none", background: "#fff", fontSize: "11px" }}>
                  <p style={{ margin: 0 }}><strong>Remarks:</strong> {invoice.remarks || ""}</p>
                </div>

                <div style={{ padding: "8px", border: "1px solid #000", borderTop: "none", background: "#fff", fontSize: "11px" }}>
                  <p style={{ margin: "0 0 4px 0", textDecoration: "none", fontWeight: "bold" }}>Company's Bank Details</p>
                  <table style={{ borderCollapse: "collapse", fontSize: "11px" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "0 8px 0 0", width: "110px" }}>Bank Name</td>
                        <td style={{ padding: "0 4px" }}>:</td>
                        <td style={{ fontWeight: "normal" }}>{bankDetails.bankName}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "0 8px 0 0" }}>A/c No.</td>
                        <td style={{ padding: "0 4px" }}>:</td>
                        <td style={{ fontWeight: "normal" }}>{bankDetails.accountNo}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "0 8px 0 0" }}>IFSC Code</td>
                        <td style={{ padding: "0 4px" }}>:</td>
                        <td style={{ fontWeight: "normal" }}>{bankDetails.ifscCode}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "0 8px 0 0" }}>Bank Branch</td>
                        <td style={{ padding: "0 4px" }}>:</td>
                        <td style={{ fontWeight: "normal" }}>{bankDetails.branch}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: "8px", border: "1px solid #000", borderTop: "none", background: "#fff", fontSize: "11px", minHeight: "120px", position: "relative" }}>
                  <br /><p style={{ margin: "0px", fontWeight: "bold" }}>TERM & CONDITION OF SALES</p>
                  <p style={{ margin: 0, textAlign: "left", fontSize: "10px" }}>Certified that the Particulars given above are true and correct</p>

                  <div style={{ position: "absolute", bottom: "10px", right: "10px", textAlign: "right" }}>
                    <p style={{ margin: "0", fontWeight: "bold" }}>For Fluoro Automation Seals Pvt Ltd</p>
                    <br />
                    <br />
                    <p style={{ margin: "0", fontWeight: "bold", textDecoration: "overline", display: "inline-block", paddingTop: "5px" }}>Authorized Signatory</p>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      ))}
    </>
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