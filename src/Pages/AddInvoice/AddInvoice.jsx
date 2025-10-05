import React, { useState, useRef } from 'react'
import './AddInvoice.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { FileText, Calendar, User, Layers, UploadCloud, Printer, Download, Share2, Mail } from 'lucide-react';
import Logo from '../../assets/logo.jpg'
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../Firebase";

const AddInvoice = () => {
  const [formData, setFormData] = useState({
    invoiceLabel: "SLA Invisible Grills",
    invoiceNumber: "",
    invoiceProduct: "",
    issueDate: "",
    dueDate: "",
    fromName: "SLA Inviisble Grills",
    fromEmail: "slainvisiblegrills@gmail.com",
    fromPhone: "+91 9885012999",
    referredBy: "", // New field
    technician: "", // New field
    fromAddress: "Sapthagiti Colony, Vedyapalem, Minibypass, Nellore-4",
    gstNumber: "",
    toName: "",
    toEmail: "",
    toPhone: "",
    toAddress: "",
    items: [],
    subTotal: 0,
    gst: "",
    taxAmount: 0,
    grandTotal: 0,
    customNotes: [],
    customTerms: []
  });
  
  // New states for notes and terms
  const [newNote, setNewNote] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(null);
  const previewRef = useRef(null);

  // Fetch invoice count for next invoice number
  React.useEffect(() => {
    const fetchInvoiceCount = async () => {
      const snapshot = await getDocs(collection(db, "Invoices"));
      setInvoiceCount(snapshot.size);
    };
    fetchInvoiceCount();
  }, [showPreview]); // update when preview opens

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Item fields: name, sqft, actualPrice, discountedPrice, amount
  const [item, setItem] = useState({ name: "", sqft: "", actualPrice: "", discountedPrice: "", amount: "" });

  // Item change handler
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    let updatedItem = { ...item, [name]: value };
    // Calculate amount if sqft and discountedPrice are present
    if (name === "sqft" || name === "discountedPrice") {
      const sqft = name === "sqft" ? value : updatedItem.sqft;
      const discountedPrice = name === "discountedPrice" ? value : updatedItem.discountedPrice;
      if (sqft && discountedPrice) {
        updatedItem.amount = (parseFloat(sqft) * parseFloat(discountedPrice)).toFixed(2);
      } else {
        updatedItem.amount = "";
      }
    }
    setItem(updatedItem);
  };

  // Add item to items array
  const addItem = (e) => {
    e.preventDefault();
    if (!item.name || !item.sqft || !item.actualPrice || !item.discountedPrice || !item.amount) return;
    const newItems = [...formData.items, item];
    const subTotal = newItems.reduce((sum, i) => sum + Number(i.amount), 0);
    // GST calculation
    const gstPercent = Number(formData.gst) || 0;
    const taxAmount = (subTotal * gstPercent) / 100;
    const grandTotal = subTotal + taxAmount;
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      subTotal,
      taxAmount,
      grandTotal,
    }));
    setItem({ name: "", sqft: "", actualPrice: "", discountedPrice: "", amount: "" });
  };

  // GST change handler
  const handleGSTChange = (e) => {
    const gst = e.target.value.replace(/[^\d.]/g, "");
    const subTotal = formData.subTotal;
    const taxAmount = (subTotal * Number(gst)) / 100;
    const grandTotal = subTotal + taxAmount;
    setFormData((prev) => ({
      ...prev,
      gst,
      taxAmount,
      grandTotal,
    }));
  };

  // Remove item from invoice items
  const handleRemoveItem = (idx) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    const subTotal = newItems.reduce((sum, i) => sum + Number(i.amount), 0);
    const gstPercent = Number(formData.gst) || 0;
    const taxAmount = (subTotal * gstPercent) / 100;
    const grandTotal = subTotal + taxAmount;
    setFormData((prev) => ({
      ...prev,
      items: newItems,
      subTotal,
      taxAmount,
      grandTotal,
    }));
  };

  // Generate invoice number using invoiceCount
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const num = invoiceCount !== null ? invoiceCount + 1 : (formData.items.length || 1);
    return `SLA${year}${num}`;
  };

  // Add custom note
  const handleAddNote = () => {
    if (newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        customNotes: [...prev.customNotes, newNote.trim()]
      }));
      setNewNote("");
    }
  };

  // Remove note
  const handleRemoveNote = (index) => {
    setFormData(prev => ({
      ...prev,
      customNotes: prev.customNotes.filter((_, i) => i !== index)
    }));
  };

  // Add custom term
  const handleAddTerm = () => {
    if (newTerm.trim()) {
      setFormData(prev => ({
        ...prev,
        customTerms: [...prev.customTerms, newTerm.trim()]
      }));
      setNewTerm("");
    }
  };

  // Remove term
  const handleRemoveTerm = (index) => {
    setFormData(prev => ({
      ...prev,
      customTerms: prev.customTerms.filter((_, i) => i !== index)
    }));
  };

  // Preview data for modal
  const previewData = {
    brand: {
      name: "SLA Invisible Grills",
      address: formData.fromAddress,
      vat: formData.gstNumber
    },
    invoice: {
      number: generateInvoiceNumber(),
      dueDate: formData.dueDate,
      issuedDate: formData.issueDate
    },
    to: {
      name: formData.toName,
      email: formData.toEmail,
      mobile: formData.toPhone,
      address: formData.toAddress,
      vat: "",
      country: ""
    },
    payment: {
      totalDue: `₹${formData.grandTotal.toFixed(2)}`,
      status: "Pending",
      cardHolder: formData.fromName,
      method: "Bank Transfer"
    },
    items: formData.items.map(item => ({
      service: item.name,
      sqft: item.sqft,
      actualPrice: item.actualPrice,
      discountedPrice: item.discountedPrice,
      amount: item.amount
    })),
    subTotal: formData.subTotal,
    discount: { label: "", value: 0 },
    tax: { label: `GST (${formData.gst || 0}%)`, value: formData.taxAmount },
    grandTotal: formData.grandTotal,
    notes: formData.customNotes.length > 0 ? formData.customNotes : [
      "All accounts are to be paid within 7 days from receipt of invoice.",
      "To be paid by cheque or credit card or direct payment online.",
      "If account is not paid within 7 days the credits details supplied as confirmation of work undertaken will be charged the agreed quoted fee noted above."
    ],
    terms: formData.customTerms.length > 0 ? formData.customTerms : [
      "All accounts are to be paid within 7 days from receipt of invoice.",
      "To be paid by cheque or credit card or direct payment online.",
      "If account is not paid within 7 days the credits details supplied as confirmation.",
      "This is computer generated receipt and does not require physical signature."
    ],
    manager: {
      name: "Sreekanth Chowdary",
      role: "Managing Director",
      date: new Date().toLocaleString()
    }
  };

  // PDF download handler with loader and Firestore save
  const handleDownloadPDF = async () => {
    setDownloading(true);
    if (!previewRef.current) return;
    const element = previewRef.current;

    // Screenshot and PDF logic
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
    pdf.save(`${previewData.invoice.number}.pdf`);

    // Save to Firestore
    try {
      await setDoc(doc(db, "Invoices", previewData.invoice.number), {
        ...formData,
        invoiceNumber: previewData.invoice.number,
        items: previewData.items,
        subTotal: previewData.subTotal,
        taxAmount: previewData.tax.value,
        grandTotal: previewData.grandTotal,
        gst: formData.gst,
        notes: previewData.notes,
        terms: previewData.terms,
        manager: previewData.manager,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      // Optionally show error
      console.error("Error saving invoice:", err);
    }
    setDownloading(false);
    setShowPreview(false);
  };

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1>Invoice Create</h1>
        </div>
        <div className="actions-container">
          <button className="invoice-template-btn" onClick={() => setShowPreview(true)}>Preview Invoice</button>
        </div>
      </div>
      <div className="add-invoice-main-container single-column">
        {/* Left: Invoice Form (full width) */}
        <div className="add-invoice-form-container full-width">
          {/* Brand/Logo */}
          <div className="brand-upload-section">
            <img src={Logo} alt="" className="invoice-logo" />
          </div>
          {/* Dates */}
          <div className="invoice-dates-row">
            <div className="invoice-date-field">
              <label>Issue Date:</label>
              <input type="date" name="issueDate" value={formData.issueDate} onChange={handleChange} placeholder="Issue date..." />
            </div>
            <div className="invoice-date-field">
              <label>Due Date:</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} placeholder="Due date..." />
            </div>
          </div>
          {/* Invoice Label/Number/Product */}
          <div className="invoice-label-row">
            <div className="invoice-label-field">
              <label>Invoice Label</label>
              <input type="text" name="invoiceLabel" value={formData.invoiceLabel} onChange={handleChange} placeholder="Duralux Invoice" disabled />
            </div>
            <div className="invoice-label-field">
              <label>Invoice Number</label>
              <input type="text" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} placeholder="#NXL2023" disabled />
            </div>
            <div className="invoice-label-field">
              <label>Invoice Product</label>
              <input 
                type="text" 
                name="invoiceProduct" 
                value={formData.invoiceProduct} 
                onChange={handleChange} 
                placeholder="Enter product/service category" 
              />
            </div>
          </div>
          {/* Invoice From/To */}
          <div className="invoice-from-to-row">
            <div className="invoice-from">
              <h3>Invoice From:</h3>
              <span className="desc">Send an invoice and get paid</span>
              <input 
                type="text" 
                name="fromName" 
                value={formData.fromName} 
                onChange={handleChange} 
                placeholder="Business Name" 
                disabled 
              />
              <input 
                type="email" 
                name="fromEmail" 
                value={formData.fromEmail} 
                onChange={handleChange} 
                placeholder="Email Address" 
                disabled 
              />
              <input 
                type="text" 
                name="fromPhone" 
                value={formData.fromPhone} 
                onChange={handleChange} 
                placeholder="Enter Phone" 
                disabled 
              />
              <input 
                type="text" 
                name="referredBy" 
                value={formData.referredBy} 
                onChange={handleChange} 
                placeholder="Referred By" 
              />
              <input 
                type="text" 
                name="technician" 
                value={formData.technician} 
                onChange={handleChange} 
                placeholder="Technician Name" 
              />
              <textarea 
                name="fromAddress" 
                value={formData.fromAddress} 
                onChange={handleChange} 
                placeholder="Enter Address" 
                rows="3"
                disabled 
              />
              <input 
                type="text" 
                name="gstNumber" 
                value={formData.gstNumber} 
                onChange={handleChange} 
                placeholder="GST Number" 
                className="gst-input" 
                disabled 
              />
            </div>
            <div className="invoice-to">
              <h3>Invoice To:</h3>
              <span className="desc">Send an invoice and get paid</span>
              <input 
                type="text" 
                name="toName" 
                value={formData.toName} 
                onChange={handleChange} 
                placeholder="Business Name" 
              />
              <input 
                type="email" 
                name="toEmail" 
                value={formData.toEmail} 
                onChange={handleChange} 
                placeholder="Email Address" 
              />
              <input 
                type="text" 
                name="toPhone" 
                value={formData.toPhone} 
                onChange={handleChange} 
                placeholder="Enter Phone" 
              />
              <textarea 
                name="toAddress" 
                value={formData.toAddress} 
                onChange={handleChange} 
                placeholder="Enter Address" 
                rows="3"
              />
            </div>
          </div>
          {/* Bottom Section: Add Items (left) and Summary (right) in one container, horizontally */}
          <div className="add-invoice-bottom-row">
            <div className="add-items-main-container bottom-left">
              <h3>Add Items:</h3>
              <span className="desc">Add items to invoice</span>
              <form className="add-item-row" onSubmit={addItem}>
                <input type="text" name="name" value={item.name} onChange={handleItemChange} placeholder="Item Name" />
                <input type="number" name="sqft" value={item.sqft} onChange={handleItemChange} placeholder="Sqft" min="1" />
                <input type="number" name="actualPrice" value={item.actualPrice} onChange={handleItemChange} placeholder="Actual Price" min="0" step="0.01" />
                <input type="number" name="discountedPrice" value={item.discountedPrice} onChange={handleItemChange} placeholder="Discounted Price" min="0" step="0.01" />
                <input type="number" name="amount" value={item.amount} readOnly placeholder="Amount" style={{ background: "#f3f4f6" }} />
                <button type="submit" className="add-item-btn"><Layers /> Add</button>
              </form>
              <div className="items-list">
                <div className="item-row item-row-header">
                  <span>Item Name</span>
                  <span>Sqft</span>
                  <span>Actual Price</span>
                  <span>Discounted Price</span>
                  <span>Amount</span>
                  <span></span>
                </div>
                {formData.items.map((itm, idx) => (
                  <div key={idx} className="item-row">
                    <span>{itm.name}</span>
                    <span>{itm.sqft}</span>
                    <span>{itm.actualPrice}</span>
                    <span>{itm.discountedPrice}</span>
                    <span>{itm.amount}</span>
                    <span>
                      <button
                        type="button"
                        className="delete-item-btn"
                        onClick={() => handleRemoveItem(idx)}
                        title="Delete Item"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="add-invoice-summary-container bottom-right">
              <h3>Grand Total:</h3>
              <span className="desc">Grand total invoice</span>
              <table className="summary-table">
                <tbody>
                  <tr>
                    <td>Sub Total</td>
                    <td>{formData.subTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>GST (%)</td>
                    <td>
                      <input
                        type="text"
                        name="gst"
                        value={formData.gst}
                        onChange={handleGSTChange}
                        className="tax-input"
                        placeholder="0"
                      /> %
                    </td>
                  </tr>
                  <tr>
                    <td>Tax Amount</td>
                    <td>{formData.taxAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="grand-total-row">
                    <td>Grand Total</td>
                    <td>{formData.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="invoice-notes-section">
            <h3>Notes:</h3>
            <span className="desc">Add custom notes for the invoice</span>
            <div className="notes-add-row">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter note..."
                className="notes-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button type="button" onClick={handleAddNote} className="add-notes-btn">
                <Layers /> Add Note
              </button>
            </div>
            <div className="notes-list">
              {formData.customNotes.map((note, idx) => (
                <div key={idx} className="note-item">
                  <span>{note}</span>
                  <button
                    type="button"
                    className="delete-note-btn"
                    onClick={() => handleRemoveNote(idx)}
                    title="Delete Note"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Terms & Conditions Section */}
          <div className="invoice-terms-section">
            <h3>Terms & Conditions:</h3>
            <span className="desc">Add custom terms and conditions</span>
            <div className="terms-add-row">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Enter term..."
                className="terms-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
              />
              <button type="button" onClick={handleAddTerm} className="add-terms-btn">
                <Layers /> Add Term
              </button>
            </div>
            <div className="terms-list">
              {formData.customTerms.map((term, idx) => (
                <div key={idx} className="term-item">
                  <span>{term}</span>
                  <button
                    type="button"
                    className="delete-term-btn"
                    onClick={() => handleRemoveTerm(idx)}
                    title="Delete Term"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Preview Invoice */}
      {showPreview && (
        <div className="invoice-preview-modal">
          <div className="invoice-preview-overlay" onClick={() => setShowPreview(false)}></div>
          <div className="invoice-preview-content">
            <div className="invoice-preview-header">
              <h2>Invoice Preview</h2>
              <button className="invoice-preview-close-btn" onClick={() => setShowPreview(false)}>×</button>
              <button className="invoice-preview-save-btn" onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? <span className="loader-white"></span> : null}
                {downloading ? "Saving..." : "Save & Download"}
              </button>
            </div>
            <div ref={previewRef}>
              <div className="invoice-preview-brand-row">
                <div className="brand-info">
                  <img src={Logo} alt="" className="invoice-preview-logo" />
                  {/* <h1 className="brand-name">{previewData.brand.name}</h1>
                  <div className="brand-address">{previewData.brand.address}</div>
                  <div className="brand-vat">GST No: {previewData.brand.vat}</div> */}
                </div>
                <div className="invoice-info">
                  <h2 className="invoice-title">Invoice</h2>
                  <div className="invoice-meta">
                    <div>Invoice: <span className="blue">{previewData.invoice.number}</span></div>
                    <div>Due Date: <span>{previewData.invoice.dueDate}</span></div>
                    <div>Issued Date: <span>{previewData.invoice.issuedDate}</span></div>
                  </div>
                </div>
              </div>
              <div className="invoice-preview-to-from-row">
                <div className="invoice-from">
                  <h4>Invoice From:</h4>
                  <div><b>Name:</b> {previewData.brand.name}</div>
                  <div><b>Email:</b> {formData.fromEmail}</div>
                  <div><b>Mobile:</b> {formData.fromPhone}</div>
                  {formData.referredBy && <div><b>Referred By:</b> {formData.referredBy}</div>}
                  {formData.technician && <div><b>Technician:</b> {formData.technician}</div>}
                  <div><b>Address:</b> {previewData.brand.address}</div>
                </div>
                <div className="invoice-to">
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
                margin: "18px 0",
                textAlign: "center"
              }}>
                <h4 style={{ 
                  fontSize: "15px", 
                  fontWeight: 700, 
                  color: "var(--blue)", 
                  margin: "4px 0" 
                }}>
                  Service Category
                </h4>
                <span style={{ 
                  fontSize: "18px", 
                  fontWeight: 600, 
                  color: "var(--txt-dark)" 
                }}>
                  {formData.invoiceProduct || "Not Selected"}
                </span>
              </div>

              <div className="invoice-preview-items-table">
                <table>
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
                <div className="invoice-preview-summary">
                  <div className="summary-row">
                    <span>Sub Total</span>
                    <span className="bold">₹{previewData.subTotal.toFixed(2)}</span>
                  </div>
                  {previewData.discount.label && (
                    <div className="summary-row">
                      <span>Discount ({previewData.discount.label})</span>
                      <span className="discount">-₹{previewData.discount.value.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>{previewData.tax.label}</span>
                    <span>₹{previewData.tax.value.toFixed(2)}</span>
                  </div>
                  <div className="summary-row grand">
                    <span>Grand Amount</span>
                    <span className="blue bold">₹{previewData.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="invoice-preview-notes">
                <div className="notes-title">NOTES:</div>
                <div className="notes-content">
                  {previewData.notes.map((note, idx) => (
                    <div key={idx}>{note}</div>
                  ))}
                </div>
              </div>
              <div className="invoice-preview-terms-manager-row">
                <div className="invoice-terms">
                  <div className="terms-title">Term & Condition :</div>
                  <div className="terms-content">
                    {previewData.terms.map((term, idx) => (
                      <div key={idx}># {term}</div>
                    ))}
                  </div>
                </div>
                <div className="invoice-manager">
                  <div className="manager-sign">{previewData.manager.name}</div>
                  <div className="manager-role">{previewData.manager.role}</div>
                  <div className="manager-date">{previewData.manager.date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddInvoice