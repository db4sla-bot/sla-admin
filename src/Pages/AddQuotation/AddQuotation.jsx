import React, { useState, useRef } from 'react'
import './AddQuotation.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Layers, Download, Plus, Trash2 } from 'lucide-react';
import Logo from '../../assets/logo.jpg'
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../../Firebase";
import { toast } from 'react-toastify';

const AddQuotation = () => {
  console.log("AddQuotation component is rendering"); // Add this line for testing

  const [quotationData, setQuotationData] = useState({
    quotationLabel: "SLA Invisible Grills",
    quotationNumber: "",
    fromName: "SLA Invisible Grills",
    fromEmail: "slainvisiblegrills@gmail.com",
    fromPhone: "+91 9885012999",
    referredBy: "",
    technician: "",
    fromAddress: "Sapthagiti Colony, Vedyapalem, Minibypass, Nellore-4",
    gstNumber: "",
    toName: "",
    toEmail: "",
    toPhone: "",
    toAddress: "",
    quotationProducts: [], // Array of products with their items
    subTotal: 0,
    gst: "",
    taxAmount: 0,
    grandTotal: 0,
    customNotes: [],
    customTerms: []
  });
  
  // States for product and item management
  const [currentProduct, setCurrentProduct] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  
  const [newNote, setNewNote] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [quotationCount, setQuotationCount] = useState(null);
  const previewRef = useRef(null);

  // Fetch quotation count for next quotation number
  React.useEffect(() => {
    const fetchQuotationCount = async () => {
      try {
        const snapshot = await getDocs(collection(db, "Quotations"));
        setQuotationCount(snapshot.size);
      } catch (error) {
        console.error("Error fetching quotation count:", error);
        toast.error("Failed to fetch quotation count. Using default numbering.");
        setQuotationCount(0);
      }
    };
    fetchQuotationCount();
  }, [showPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuotationData((prev) => ({ ...prev, [name]: value }));
  };

  const [item, setItem] = useState({ 
    name: "", 
    sqft: "", 
    actualPrice: "", 
    discountedPrice: "", 
    amount: "" 
  });

  // Add new product
  const addProduct = () => {
    if (currentProduct.trim()) {
      const newProduct = {
        id: Date.now(),
        name: currentProduct.trim(),
        items: []
      };
      setQuotationData(prev => ({
        ...prev,
        quotationProducts: [...prev.quotationProducts, newProduct]
      }));
      setCurrentProduct("");
      setSelectedProductId(newProduct.id);
      toast.success(`Product "${newProduct.name}" added successfully!`);
    } else {
      toast.error("Please enter a product name!");
    }
  };

  // Remove product and its items
  const removeProduct = (productId) => {
    const productToRemove = quotationData.quotationProducts.find(p => p.id === productId);
    
    setQuotationData(prev => {
      const updatedProducts = prev.quotationProducts.filter(product => product.id !== productId);
      const newSubTotal = updatedProducts.reduce((total, product) => 
        total + product.items.reduce((sum, item) => sum + Number(item.amount), 0), 0
      );
      const gstPercent = Number(prev.gst) || 0;
      const taxAmount = (newSubTotal * gstPercent) / 100;
      const grandTotal = newSubTotal + taxAmount;
      
      return {
        ...prev,
        quotationProducts: updatedProducts,
        subTotal: newSubTotal,
        taxAmount,
        grandTotal
      };
    });
    
    if (selectedProductId === productId) {
      setSelectedProductId("");
    }
    
    if (productToRemove) {
      toast.success(`Product "${productToRemove.name}" removed successfully!`);
    }
  };

  // Modified item handlers
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    // Validate numeric fields
    if ((name === "sqft" || name === "actualPrice" || name === "discountedPrice") && value) {
      if (parseFloat(value) < 0) {
        toast.error(`${name === "sqft" ? "Square feet" : name === "actualPrice" ? "Actual price" : "Discounted price"} cannot be negative!`);
        return;
      }
    }
    
    let updatedItem = { ...item, [name]: value };
    
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

  const addItem = (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error("Please select a product first!");
      return;
    }
    
    if (!item.name || !item.sqft || !item.actualPrice || !item.discountedPrice || !item.amount) {
      toast.error("Please fill all item fields!");
      return;
    }
    
    const selectedProduct = quotationData.quotationProducts.find(p => p.id === selectedProductId);
    
    setQuotationData(prev => {
      const updatedProducts = prev.quotationProducts.map(product => {
        if (product.id === selectedProductId) {
          return {
            ...product,
            items: [...product.items, { ...item, id: Date.now() }]
          };
        }
        return product;
      });
      
      const newSubTotal = updatedProducts.reduce((total, product) => 
        total + product.items.reduce((sum, item) => sum + Number(item.amount), 0), 0
      );
      const gstPercent = Number(prev.gst) || 0;
      const taxAmount = (newSubTotal * gstPercent) / 100;
      const grandTotal = newSubTotal + taxAmount;
      
      return {
        ...prev,
        quotationProducts: updatedProducts,
        subTotal: newSubTotal,
        taxAmount,
        grandTotal
      };
    });
    
    setItem({ name: "", sqft: "", actualPrice: "", discountedPrice: "", amount: "" });
    toast.success(`Item "${item.name}" added to ${selectedProduct?.name}!`);
  };

  const handleRemoveItem = (productId, itemId) => {
    const product = quotationData.quotationProducts.find(p => p.id === productId);
    const itemToRemove = product?.items.find(i => i.id === itemId);
    
    setQuotationData(prev => {
      const updatedProducts = prev.quotationProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            items: product.items.filter(item => item.id !== itemId)
          };
        }
        return product;
      });
      
      const newSubTotal = updatedProducts.reduce((total, product) => 
        total + product.items.reduce((sum, item) => sum + Number(item.amount), 0), 0
      );
      const gstPercent = Number(prev.gst) || 0;
      const taxAmount = (newSubTotal * gstPercent) / 100;
      const grandTotal = newSubTotal + taxAmount;
      
      return {
        ...prev,
        quotationProducts: updatedProducts,
        subTotal: newSubTotal,
        taxAmount,
        grandTotal
      };
    });
    
    if (itemToRemove) {
      toast.success(`Item "${itemToRemove.name}" removed successfully!`);
    }
  };

  const generateQuotationNumber = () => {
    const year = new Date().getFullYear();
    // Fix the reference to use quotationProducts instead of items
    const num = quotationCount !== null ? quotationCount + 1 : (quotationData.quotationProducts.length || 1);
    return `QUO${year}${num}`;
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setQuotationData(prev => ({
        ...prev,
        customNotes: [...prev.customNotes, newNote.trim()]
      }));
      setNewNote("");
      toast.success("Note added successfully!");
    } else {
      toast.error("Please enter a note!");
    }
  };

  const handleRemoveNote = (index) => {
    const noteToRemove = quotationData.customNotes[index];
    setQuotationData(prev => ({
      ...prev,
      customNotes: prev.customNotes.filter((_, i) => i !== index)
    }));
    toast.success("Note removed successfully!");
  };

  const handleAddTerm = () => {
    if (newTerm.trim()) {
      setQuotationData(prev => ({
        ...prev,
        customTerms: [...prev.customTerms, newTerm.trim()]
      }));
      setNewTerm("");
      toast.success("Term added successfully!");
    } else {
      toast.error("Please enter a term!");
    }
  };

  const handleRemoveTerm = (index) => {
    const termToRemove = quotationData.customTerms[index];
    setQuotationData(prev => ({
      ...prev,
      customTerms: prev.customTerms.filter((_, i) => i !== index)
    }));
    toast.success("Term removed successfully!");
  };

  const previewData = {
    brand: {
      name: "SLA Invisible Grills",
      address: quotationData.fromAddress,
      vat: quotationData.gstNumber
    },
    quotation: {
      number: generateQuotationNumber(),
      date: new Date().toLocaleDateString()
    },
    to: {
      name: quotationData.toName,
      email: quotationData.toEmail,
      mobile: quotationData.toPhone,
      address: quotationData.toAddress,
    },
    quotationProducts: quotationData.quotationProducts,
    subTotal: quotationData.subTotal,
    tax: { label: `GST (${quotationData.gst || 0}%)`, value: quotationData.taxAmount },
    grandTotal: quotationData.grandTotal,
    notes: quotationData.customNotes.length > 0 ? quotationData.customNotes : [
      "Availability of client or someone from client side is mandatory at the site on the day of actual work start.",
      "Advance Payment & Client Approval for FINAL QUOTATION is must to start the work.",
    ],
    terms: quotationData.customTerms.length > 0 ? quotationData.customTerms : [
      "Invisible Grill Tensile Strength will depend on strength of the wall/site construction.",
      "SLA Invisible Grills will not be liable for any form of compensation in case of any damage incurred due to special request (especially when Granite/Marbles involved in designated installation area)",
      "All goods remains property of SLA Invisible Grills until full payment is received.",
      "Please check Warranty Terms & Conditions of your product in your Invoice bill."
    ],
    manager: {
      name: "Sreekanth Chowdary",
      role: "Managing Partner",
      date: new Date().toLocaleString()
    }
  };

  const handleDownloadPDF = async () => {
    // Validation before generating PDF
    if (quotationData.quotationProducts.length === 0) {
      toast.error("Please add at least one product with items before generating quotation!");
      return;
    }
    
    const hasItems = quotationData.quotationProducts.some(product => product.items.length > 0);
    if (!hasItems) {
      toast.error("Please add items to at least one product before generating quotation!");
      return;
    }
    
    if (!quotationData.toName || !quotationData.toEmail || !quotationData.toPhone) {
      toast.error("Please fill in all 'Quotation To' fields!");
      return;
    }
    
    setDownloading(true);
    toast.info("Generating quotation PDF...", { autoClose: 1000 });
    
    try {
      if (!previewRef.current) {
        toast.error("Unable to generate PDF. Please try again.");
        setDownloading(false);
        return;
      }
      
      const element = previewRef.current;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      const x = (pageWidth - finalWidth) / 2;
      const y = (pageHeight - finalHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
      pdf.save(`${previewData.quotation.number}.pdf`);
      
      toast.success("PDF downloaded successfully!");

      // Save to Firestore
      await setDoc(doc(db, "Quotations", previewData.quotation.number), {
        ...quotationData,
        quotationNumber: previewData.quotation.number,
        quotationProducts: previewData.quotationProducts,
        subTotal: previewData.subTotal,
        taxAmount: previewData.tax.value,
        grandTotal: previewData.grandTotal,
        gst: quotationData.gst,
        notes: previewData.notes,
        terms: previewData.terms,
        manager: previewData.manager,
        createdAt: new Date().toISOString()
      });
      
      toast.success("Quotation saved to database successfully!");
      
    } catch (err) {
      console.error("Error saving quotation:", err);
      toast.error("Failed to save quotation. Please try again.");
    } finally {
      setDownloading(false);
      setShowPreview(false);
    }
  };

  // Add validation for GST input
  const handleGSTChange = (e) => {
    const gst = e.target.value.replace(/[^\d.]/g, "");
    
    // Validate GST percentage
    if (gst && (parseFloat(gst) > 100 || parseFloat(gst) < 0)) {
      toast.error("GST percentage should be between 0 and 100!");
      return;
    }
    
    const subTotal = quotationData.subTotal;
    const taxAmount = (subTotal * Number(gst)) / 100;
    const grandTotal = subTotal + taxAmount;
    setQuotationData((prev) => ({
      ...prev,
      gst,
      taxAmount,
      grandTotal,
    }));
    
    if (gst) {
      toast.success(`GST updated to ${gst}%`);
    }
  };

  return (
    <>
      <div className="quotation-top-bar-container">
        <Hamburger />
        <div className="quotation-breadcrumps-container">
          <h1>Quotation Create</h1>
        </div>
        <div className="quotation-actions-container">
          <button className="quotation-template-btn" onClick={() => setShowPreview(true)}>
            Preview Quotation
          </button>
        </div>
      </div>
      
      <div className="add-quotation-main-container single-column">
        <div className="add-quotation-form-container full-width">
          {/* Brand/Logo */}
          <div className="quotation-brand-upload-section">
            <img src={Logo} alt="" className="quotation-logo" />
          </div>
          
          {/* Quotation Label/Number */}
          <div className="quotation-label-row">
            <div className="quotation-label-field">
              <label>Quotation Label</label>
              <input 
                type="text" 
                name="quotationLabel" 
                value={quotationData.quotationLabel} 
                onChange={handleChange} 
                placeholder="SLA Quotation" 
                disabled 
              />
            </div>
            <div className="quotation-label-field">
              <label>Quotation Number</label>
              <input 
                type="text" 
                name="quotationNumber" 
                value={quotationData.quotationNumber} 
                onChange={handleChange} 
                placeholder="#QUO2023" 
                disabled 
              />
            </div>
          </div>
          
          {/* Quotation From/To */}
          <div className="quotation-from-to-row">
            <div className="quotation-from">
              <h3>Quotation From:</h3>
              <span className="quotation-desc">Send a quotation and get business</span>
              <input 
                type="text" 
                name="fromName" 
                value={quotationData.fromName} 
                onChange={handleChange} 
                placeholder="Business Name" 
                disabled 
              />
              <input 
                type="email" 
                name="fromEmail" 
                value={quotationData.fromEmail} 
                onChange={handleChange} 
                placeholder="Email Address" 
                disabled 
              />
              <input 
                type="text" 
                name="fromPhone" 
                value={quotationData.fromPhone} 
                onChange={handleChange} 
                placeholder="Enter Phone" 
                disabled 
              />
              <input 
                type="text" 
                name="referredBy" 
                value={quotationData.referredBy} 
                onChange={handleChange} 
                placeholder="Referred By" 
              />
              <input 
                type="text" 
                name="technician" 
                value={quotationData.technician} 
                onChange={handleChange} 
                placeholder="Technician Name" 
              />
              <textarea 
                name="fromAddress" 
                value={quotationData.fromAddress} 
                onChange={handleChange} 
                placeholder="Enter Address" 
                rows="3"
                disabled 
              />
              <input 
                type="text" 
                name="gstNumber" 
                value={quotationData.gstNumber} 
                onChange={handleChange} 
                placeholder="GST Number" 
                className="quotation-gst-input" 
                disabled 
              />
            </div>
            <div className="quotation-to">
              <h3>Quotation To:</h3>
              <span className="quotation-desc">Send a quotation and get business</span>
              <input 
                type="text" 
                name="toName" 
                value={quotationData.toName} 
                onChange={handleChange} 
                placeholder="Business Name" 
              />
              <input 
                type="email" 
                name="toEmail" 
                value={quotationData.toEmail} 
                onChange={handleChange} 
                placeholder="Email Address" 
              />
              <input 
                type="text" 
                name="toPhone" 
                value={quotationData.toPhone} 
                onChange={handleChange} 
                placeholder="Enter Phone" 
              />
              <textarea 
                name="toAddress" 
                value={quotationData.toAddress} 
                onChange={handleChange} 
                placeholder="Enter Address" 
                rows="3"
              />
            </div>
          </div>

          {/* Products Management */}
          <div className="quotation-products-section">
            <h3>Quotation Products:</h3>
            <span className="quotation-desc">Add products/services to quotation</span>
            <div className="quotation-product-add-row">
              <input
                type="text"
                value={currentProduct}
                onChange={(e) => setCurrentProduct(e.target.value)}
                placeholder="Enter product/service name..."
                className="quotation-product-input"
                onKeyPress={(e) => e.key === 'Enter' && addProduct()}
              />
              <button type="button" onClick={addProduct} className="add-quotation-product-btn">
                <Plus size={16} /> Add Product
              </button>
            </div>
            
            {quotationData.quotationProducts.length > 0 && (
              <div className="quotation-products-list">
                <h4>Added Products:</h4>
                <div className="quotation-product-tags">
                  {quotationData.quotationProducts.map(product => (
                    <div key={product.id} className={`quotation-product-tag ${selectedProductId === product.id ? 'selected' : ''}`}>
                      <span onClick={() => setSelectedProductId(product.id)}>{product.name}</span>
                      <button 
                        className="remove-quotation-product-btn"
                        onClick={() => removeProduct(product.id)}
                        title="Remove Product"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Items Section */}
          <div className="add-quotation-bottom-row">
            <div className="add-quotation-items-main-container bottom-left">
              <h3>Add Items:</h3>
              <span className="quotation-desc">
                {selectedProductId ? 
                  `Add items to: ${quotationData.quotationProducts.find(p => p.id === selectedProductId)?.name}` : 
                  'Select a product first to add items'
                }
              </span>
              
              <form className="add-quotation-item-row" onSubmit={addItem}>
                <input 
                  type="text" 
                  name="name" 
                  value={item.name} 
                  onChange={handleItemChange} 
                  placeholder="Item Name"
                  disabled={!selectedProductId}
                />
                <input 
                  type="number" 
                  name="sqft" 
                  value={item.sqft} 
                  onChange={handleItemChange} 
                  placeholder="Sqft" 
                  min="1"
                  disabled={!selectedProductId}
                />
                <input 
                  type="number" 
                  name="actualPrice" 
                  value={item.actualPrice} 
                  onChange={handleItemChange} 
                  placeholder="Actual Price" 
                  min="0" 
                  step="0.01"
                  disabled={!selectedProductId}
                />
                <input 
                  type="number" 
                  name="discountedPrice" 
                  value={item.discountedPrice} 
                  onChange={handleItemChange} 
                  placeholder="Discounted Price" 
                  min="0" 
                  step="0.01"
                  disabled={!selectedProductId}
                />
                <input 
                  type="number" 
                  name="amount" 
                  value={item.amount} 
                  readOnly 
                  placeholder="Amount" 
                  style={{ background: "#f3f4f6" }} 
                />
                <button 
                  type="submit" 
                  className="add-quotation-item-btn"
                  disabled={!selectedProductId}
                >
                  <Layers /> Add
                </button>
              </form>
              
              {/* Display items grouped by products */}
              {quotationData.quotationProducts.map(product => (
                product.items.length > 0 && (
                  <div key={product.id} className="quotation-product-items-section">
                    <h4 className="quotation-product-items-title">{product.name}</h4>
                    <div className="quotation-items-list">
                      <div className="quotation-item-row quotation-item-row-header">
                        <span>Item Name</span>
                        <span>Sqft</span>
                        <span>Actual Price</span>
                        <span>Discounted Price</span>
                        <span>Amount</span>
                        <span></span>
                      </div>
                      {product.items.map((itm) => (
                        <div key={itm.id} className="quotation-item-row">
                          <span>{itm.name}</span>
                          <span>{itm.sqft}</span>
                          <span>{itm.actualPrice}</span>
                          <span>{itm.discountedPrice}</span>
                          <span>{itm.amount}</span>
                          <span>
                            <button
                              type="button"
                              className="delete-quotation-item-btn"
                              onClick={() => handleRemoveItem(product.id, itm.id)}
                              title="Delete Item"
                            >
                              ×
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
            
            <div className="add-quotation-summary-container bottom-right">
              <h3>Grand Total:</h3>
              <span className="quotation-desc">Grand total quotation</span>
              <table className="quotation-summary-table">
                <tbody>
                  <tr>
                    <td>Sub Total</td>
                    <td>{quotationData.subTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>GST (%)</td>
                    <td>
                      <input
                        type="text"
                        name="gst"
                        value={quotationData.gst}
                        onChange={handleGSTChange}
                        className="quotation-tax-input"
                        placeholder="0"
                      /> %
                    </td>
                  </tr>
                  <tr>
                    <td>Tax Amount</td>
                    <td>{quotationData.taxAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="quotation-grand-total-row">
                    <td>Grand Total</td>
                    <td>{quotationData.grandTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="quotation-notes-section">
            <h3>Notes:</h3>
            <span className="quotation-desc">Add custom notes for the quotation</span>
            <div className="quotation-notes-add-row">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter note..."
                className="quotation-notes-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button type="button" onClick={handleAddNote} className="add-quotation-notes-btn">
                <Layers /> Add Note
              </button>
            </div>
            <div className="quotation-notes-list">
              {quotationData.customNotes.map((note, idx) => (
                <div key={idx} className="quotation-note-item">
                  <span>{note}</span>
                  <button
                    type="button"
                    className="delete-quotation-note-btn"
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
          <div className="quotation-terms-section">
            <h3>Terms & Conditions:</h3>
            <span className="quotation-desc">Add custom terms and conditions</span>
            <div className="quotation-terms-add-row">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Enter term..."
                className="quotation-terms-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
              />
              <button type="button" onClick={handleAddTerm} className="add-quotation-terms-btn">
                <Layers /> Add Term
              </button>
            </div>
            <div className="quotation-terms-list">
              {quotationData.customTerms.map((term, idx) => (
                <div key={idx} className="quotation-term-item">
                  <span>{term}</span>
                  <button
                    type="button"
                    className="delete-quotation-term-btn"
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

      {/* Modal for Preview Quotation */}
      {showPreview && (
        <div className="quotation-preview-modal">
          <div className="quotation-preview-overlay" onClick={() => setShowPreview(false)}></div>
          <div className="quotation-preview-content">
            <div className="quotation-preview-header">
              <h2>Quotation Preview</h2>
              <button className="quotation-preview-close-btn" onClick={() => setShowPreview(false)}>×</button>
              <button className="quotation-preview-save-btn" onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? <span className="quotation-loader-white"></span> : null}
                {downloading ? "Saving..." : "Save & Download"}
              </button>
            </div>
            <div ref={previewRef}>
              <div className="quotation-preview-brand-row">
                <div className="quotation-brand-info">
                  <img src={Logo} alt="" className="quotation-preview-logo" />
                </div>
                <div className="quotation-info">
                  <h2 className="quotation-title">Quotation</h2>
                  <div className="quotation-meta">
                    <div>Quotation: <span className="quotation-blue">{previewData.quotation.number}</span></div>
                    <div>Date: <span>{previewData.quotation.date}</span></div>
                  </div>
                </div>
              </div>
              
              <div className="quotation-preview-to-from-row">
                <div className="quotation-from-section">
                  <h4>Quotation From:</h4>
                  <div><b>Name:</b> {previewData.brand.name}</div>
                  <div><b>Email:</b> {quotationData.fromEmail}</div>
                  <div><b>Mobile:</b> {quotationData.fromPhone}</div>
                  {quotationData.referredBy && <div><b>Referred By:</b> {quotationData.referredBy}</div>}
                  {quotationData.technician && <div><b>Technician:</b> {quotationData.technician}</div>}
                  <div><b>Address:</b> {previewData.brand.address}</div>
                </div>
                <div className="quotation-to-section">
                  <h4>Quotation To:</h4>
                  <div><b>Name:</b> {previewData.to.name}</div>
                  <div><b>Email:</b> {previewData.to.email}</div>
                  <div><b>Mobile:</b> {previewData.to.mobile}</div>
                  <div><b>Address:</b> {previewData.to.address}</div>
                </div>
              </div>

              {/* Products and Items Display */}
              {previewData.quotationProducts.map(product => (
                product.items.length > 0 && (
                  <div key={product.id} className="quotation-preview-product-section">
                    <div className="quotation-product-display">
                      {/* <h4>Service Category</h4> */}
                      <span>{product.name}</span>
                    </div>

                    <div className="quotation-preview-items-table">
                      <table>
                        <thead>
                          <tr>
                            <th>SERVICE DESCRIPTION</th>
                            <th>SQFT</th>
                            <th>ACTUAL PRICE</th>
                            <th>DISCOUNTED PRICE</th>
                            <th>AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.sqft}</td>
                              <td>₹{Number(item.actualPrice).toFixed(2)}</td>
                              <td>₹{Number(item.discountedPrice).toFixed(2)}</td>
                              <td>₹{Number(item.amount).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="quotation-product-subtotal">
                        <div className="quotation-summary-row">
                          <span>{product.name} Subtotal:</span>
                          <span className="quotation-bold">
                            ₹{product.items.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}

              {/* Overall Summary */}
              <div className="quotation-preview-overall-summary">
                <div className="quotation-summary-row">
                  <span>Sub Total</span>
                  <span className="quotation-bold">₹{previewData.subTotal.toFixed(2)}</span>
                </div>
                <div className="quotation-summary-row">
                  <span>{previewData.tax.label}</span>
                  <span>₹{previewData.tax.value.toFixed(2)}</span>
                </div>
                <div className="quotation-summary-row quotation-grand">
                  <span>Grand Amount</span>
                  <span className="quotation-blue quotation-bold">₹{previewData.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* ...existing notes and terms preview... */}
              <div className="quotation-preview-notes">
                <div className="quotation-notes-title">NOTES:</div>
                <div className="quotation-notes-content">
                  {previewData.notes.map((note, idx) => (
                    <div key={idx}>{note}</div>
                  ))}
                </div>
              </div>
              <div className="quotation-preview-terms-manager-row">
                <div className="quotation-terms">
                  <div className="quotation-terms-title">Term & Condition :</div>
                  <div className="quotation-terms-content">
                    {previewData.terms.map((term, idx) => (
                      <div key={idx}># {term}</div>
                    ))}
                  </div>
                </div>
                <div className="quotation-manager">
                  <div className="quotation-manager-sign">{previewData.manager.name}</div>
                  <div className="quotation-manager-role">{previewData.manager.role}</div>
                  <div className="quotation-manager-date">{previewData.manager.date}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddQuotation