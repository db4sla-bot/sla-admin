import React, { useEffect, useState, useRef } from 'react'
import { useParams } from "react-router-dom";
import './InvoiceDetails.css'
import { Download } from 'lucide-react'
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../Firebase";
import Logo from '../../assets/logo.jpg'
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const InvoiceDetails = () => {
  // Use correct param name (check your route: /invoices/:id or /invoices/:invoiceId)
  const params = useParams();
  const invoiceId = params.invoiceid || params.id; // support both param names

  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "Invoices", invoiceId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInvoiceData(docSnap.data());
        } else {
          setInvoiceData(null);
        }
      } catch (err) {
        setInvoiceData(null);
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [invoiceId]);

  // PDF download handler
  const handleDownloadPDF = async () => {
    setDownloading(true);
    if (!previewRef.current) return;
    const element = previewRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    const x = margin;
    const y = margin;
    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    pdf.save(`${invoiceData.invoiceNumber || invoiceId}.pdf`);
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="invoice-details-main-container">
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading invoice...</div>
      </div>
    );
  }
  if (!invoiceData) {
    return (
      <div className="invoice-details-main-container">
        <div style={{ textAlign: "center", padding: "2rem" }}>Invoice not found.</div>
      </div>
    );
  }

  // Prepare previewData for UI
  const previewData = {
    brand: {
      name: "SLA Invisible Grills",
      address: invoiceData.fromAddress,
      vat: invoiceData.gstNumber
    },
    invoice: {
      number: invoiceData.invoiceNumber || invoiceId,
      dueDate: invoiceData.dueDate,
      issuedDate: invoiceData.issueDate
    },
    to: {
      name: invoiceData.toName,
      email: invoiceData.toEmail,
      mobile: invoiceData.toPhone,
      address: invoiceData.toAddress,
      vat: "",
      country: ""
    },
    payment: {
      totalDue: `₹${Number(invoiceData.grandTotal || 0).toFixed(2)}`,
      status: "Pending",
      cardHolder: invoiceData.fromName,
      method: "Bank Transfer"
    },
    items: invoiceData.items || [],
    subTotal: invoiceData.subTotal || 0,
    discount: invoiceData.discount || { label: "", value: 0 },
    tax: { label: `GST (${invoiceData.gst || 0}%)`, value: invoiceData.taxAmount || 0 },
    grandTotal: invoiceData.grandTotal || 0,
    notes: invoiceData.notes || [],
    terms: invoiceData.terms || [],
    manager: invoiceData.manager || {
      name: "",
      role: "",
      date: ""
    }
  };

  return (
    <div className="invoice-details-main-container">
      <div className="invoice-details-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h2 style={{ fontWeight: 700, fontSize: "22px", margin: 0 }}>Invoice Details</h2>
        <button
          className="invoice-details-download-btn"
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            background: "var(--blue)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          {downloading ? <span className="loader-white"></span> : <Download style={{ width: "18px" }} />}
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>
      <div ref={previewRef} className="invoice-details-preview-content">
        <div className="invoice-details-brand-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px dashed #e5e7eb", paddingBottom: "18px", marginBottom: "18px", gap: "18px" }}>
          <div className="brand-info">
            <img src={Logo} alt="" style={{ width: "370px", borderRadius: "12px", marginBottom: "8px" }} />
            {/* <h1 className="brand-name">{previewData.brand.name}</h1>
            <div className="brand-address">{previewData.brand.address}</div>
            <div className="brand-vat">GST No: {previewData.brand.vat}</div> */}
          </div>
          <div className="invoice-info" style={{ textAlign: "right" }}>
            <h2 className="invoice-title">Invoice</h2>
            <div className="invoice-meta">
              <div>Invoice: <span className="blue">{previewData.invoice.number}</span></div>
              <div>Due Date: <span>{previewData.invoice.dueDate}</span></div>
              <div>Issued Date: <span>{previewData.invoice.issuedDate}</span></div>
            </div>
          </div>
        </div>
        <div className="invoice-details-to-from-row" style={{ display: "flex", justifyContent: "space-between", gap: "32px", marginBottom: "18px" }}>
          <div className="invoice-from" style={{ flex: 1, background: "#f8fafc", borderRadius: "8px", padding: "16px", fontSize: "14px", color: "var(--txt-dark)" }}>
            <h4>Invoice From:</h4>
            <div><b>Name:</b> {previewData.brand.name}</div>
            <div><b>Email:</b> {invoiceData.fromEmail}</div>
            <div><b>Mobile:</b> {invoiceData.fromPhone}</div>
            <div><b>Referred By:</b> {invoiceData.referredBy}</div>
            <div><b>Technician:</b> {invoiceData.technician}</div>
            <div><b>Address:</b> {previewData.brand.address}</div>
          </div>
          <div className="invoice-to" style={{ flex: 1, background: "#f8fafc", borderRadius: "8px", padding: "16px", fontSize: "14px", color: "var(--txt-dark)" }}>
            <h4>Invoice To:</h4>
            <div><b>Name:</b> {previewData.to.name}</div>
            <div><b>Email:</b> {previewData.to.email}</div>
            <div><b>Mobile:</b> {previewData.to.mobile}</div>
            <div><b>Address:</b> {previewData.to.address}</div>
          </div>
        </div>

        {/* Invoice Product Display */}
        <div className="invoice-product-display" style={{ 
          background: "#f8fafc", 
          borderRadius: "8px", 
          padding: "12px 16px", 
          marginBottom: "18px",
          textAlign: "center"
        }}>
          <h4 style={{ 
            fontSize: "15px", 
            fontWeight: 700, 
            color: "var(--blue)", 
            margin: "0 0 4px 0" 
          }}>
            Service Category
          </h4>
          <span style={{ 
            fontSize: "18px", 
            fontWeight: 600, 
            color: "var(--txt-dark)" 
          }}>
            {invoiceData.invoiceProduct || "Not Selected"}
          </span>
        </div>

        <div className="invoice-details-items-table" style={{ marginTop: "18px", background: "#f8fafc", borderRadius: "8px", padding: "18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
            <thead>
              <tr>
                <th>SERVICE</th>
                <th>SQFT</th>
                <th>ACTUAL PRICE</th>
                <th>DISCOUNTED PRICE</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {previewData.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.service}</td>
                  <td>{item.sqft}</td>
                  <td>₹{Number(item.actualPrice).toFixed(2)}</td>
                  <td>₹{Number(item.discountedPrice).toFixed(2)}</td>
                  <td>₹{Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="invoice-details-summary" style={{ marginTop: "12px", maxWidth: "350px", marginLeft: "auto", background: "#fff", borderRadius: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", padding: "16px" }}>
            <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "15px", marginBottom: "8px" }}>
              <span>Sub Total</span>
              <span className="bold">₹{Number(previewData.subTotal).toFixed(2)}</span>
            </div>
            {previewData.discount.label && (
              <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "15px", marginBottom: "8px" }}>
                <span>Discount ({previewData.discount.label})</span>
                <span className="discount">-₹{Number(previewData.discount.value).toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "15px", marginBottom: "8px" }}>
              <span>{previewData.tax.label}</span>
              <span>₹{Number(previewData.tax.value).toFixed(2)}</span>
            </div>
            <div className="summary-row grand" style={{ fontSize: "16px", fontWeight: 700, color: "var(--blue)", background: "#f3f4f6", borderRadius: "6px", padding: "8px 0" }}>
              <span>Grand Amount</span>
              <span className="blue bold">₹{Number(previewData.grandTotal).toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="invoice-details-notes" style={{ background: "#fff7ed", border: "1px dashed #fdba74", borderRadius: "8px", padding: "16px", marginTop: "18px", marginBottom: "18px" }}>
          <div className="notes-title" style={{ fontSize: "13px", fontWeight: 700, color: "#f59e42", marginBottom: "6px" }}>NOTES:</div>
          <div className="notes-content" style={{ fontSize: "13px", color: "#f59e42" }}>
            {previewData.notes.map((note, idx) => (
              <div key={idx}>{note}</div>
            ))}
          </div>
        </div>
        <div className="invoice-details-terms-manager-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "18px" }}>
          <div className="invoice-terms" style={{ flex: 2 }}>
            <div className="terms-title" style={{ fontSize: "13px", fontWeight: 700, color: "var(--txt-dark)", marginBottom: "6px" }}>Term & Condition :</div>
            <div className="terms-content" style={{ fontSize: "13px", color: "var(--txt-light)" }}>
              {previewData.terms.map((term, idx) => (
                <div key={idx}># {term}</div>
              ))}
            </div>
          </div>
          <div className="invoice-manager" style={{ flex: 1, textAlign: "right" }}>
            <div className="manager-sign" style={{ fontFamily: "'Dancing Script', cursive", fontSize: "20px", fontWeight: 700, color: "var(--txt-dark)" }}>{previewData.manager.name}</div>
            <div className="manager-role" style={{ fontSize: "13px", color: "var(--txt-dark)", fontWeight: 600 }}>{previewData.manager.role}</div>
            <div className="manager-date" style={{ fontSize: "12px", color: "var(--txt-light)" }}>{previewData.manager.date}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetails