import React, { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./QRCodeGenerator.css";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { QrCode, Download, Save, History, Trash2, Search, Eye, Copy, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../Firebase";

const QRCodeGenerator = () => {
  const [text, setText] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedQRs, setSavedQRs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("generator");
  const qrRef = useRef(null);

  const categories = [
    "Website URL",
    "Contact Info", 
    "WiFi Password",
    "Social Media",
    "Business",
    "Event",
    "Product",
    "Other"
  ];
  const [selectedCategory, setSelectedCategory] = useState("Website URL");

  useEffect(() => {
    fetchSavedQRs();
  }, []);

  const fetchSavedQRs = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "QRCodes"));
      const qrData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort by creation date (newest first)
      qrData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSavedQRs(qrData);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      toast.error("Failed to fetch QR codes");
    }
    setLoading(false);
  };

  const handleGenerate = () => {
    if (!text.trim()) {
      toast.error("Please enter text or URL to generate QR code");
      return;
    }
    setQrValue(text);
    toast.success("QR code generated successfully!");
  };

  const handleSaveQR = async () => {
    if (!qrValue) {
      toast.error("Please generate a QR code first");
      return;
    }
    
    if (!title.trim()) {
      toast.error("Please enter a title for the QR code");
      return;
    }

    setSaving(true);
    try {
      // Generate QR code image as base64
      const canvas = qrRef.current?.querySelector("canvas");
      const qrImageData = canvas ? canvas.toDataURL("image/png") : null;

      await addDoc(collection(db, "QRCodes"), {
        title: title.trim(),
        description: description.trim(),
        content: qrValue,
        category: selectedCategory,
        qrImage: qrImageData, // Save the QR code image as base64
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast.success("QR code saved successfully!");
      
      // Reset form
      setText("");
      setTitle("");
      setDescription("");
      setQrValue("");
      
      // Refresh saved QRs
      fetchSavedQRs();
    } catch (error) {
      console.error("Error saving QR code:", error);
      toast.error("Failed to save QR code");
    }
    setSaving(false);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `${title || 'qrcode'}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    
    toast.success("QR code downloaded successfully!");
  };

  const handleDeleteQR = async (id) => {
    if (!window.confirm("Are you sure you want to delete this QR code?")) return;
    
    try {
      await deleteDoc(doc(db, "QRCodes", id));
      toast.success("QR code deleted successfully!");
      fetchSavedQRs();
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast.error("Failed to delete QR code");
    }
  };

  const handleCopyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard!");
  };

  const handleLoadQR = (qr) => {
    setText(qr.content);
    setTitle(qr.title);
    setDescription(qr.description);
    setSelectedCategory(qr.category);
    setQrValue(qr.content);
    setActiveTab("generator");
    toast.success("QR code loaded for editing!");
  };

  const handleDownloadSavedQR = (qr) => {
    if (qr.qrImage) {
      // Download from saved image data
      const link = document.createElement("a");
      link.download = `${qr.title}.png`;
      link.href = qr.qrImage;
      link.click();
      toast.success("QR code downloaded successfully!");
    } else {
      // Fallback: regenerate and download
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      // This would require regenerating the QR code
      toast.info("Regenerating QR code for download...");
    }
  };

  // Filter saved QRs
  const filteredQRs = savedQRs.filter(qr =>
    qr.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1 style={{ 
            fontSize: "22px", 
            fontWeight: 700, 
            color: "var(--txt-dark)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <QrCode style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            QR Code Generator
          </h1>
        </div>
      </div>

      <div className="qr-generator-main-container">
        {/* Enhanced Tab Navigation */}
        <div className="qr-tabs-navigation">
          <button 
            className={`qr-tab-button ${activeTab === 'generator' ? 'qr-tab-active' : ''}`}
            onClick={() => setActiveTab('generator')}
          >
            <QrCode size={18} />
            Generate QR
          </button>
          <button 
            className={`qr-tab-button ${activeTab === 'history' ? 'qr-tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            Saved QR Codes ({savedQRs.length})
          </button>
        </div>

        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <div className="qr-generator-content">
            <div className="qr-generator-header">
              <h2 className="qr-generator-title">Create QR Code</h2>
              <p className="qr-generator-subtitle">Generate and save QR codes with custom details</p>
            </div>

            <div className="qr-generator-form-section">
              <div className="qr-form-row">
                <div className="qr-form-group qr-form-full">
                  <label className="qr-form-label">Title *</label>
                  <input
                    type="text"
                    className="qr-form-input"
                    placeholder="Enter QR code title (e.g., Company Website)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="qr-form-row">
                <div className="qr-form-group qr-form-half">
                  <label className="qr-form-label">Content *</label>
                  <input
                    type="text"
                    className="qr-form-input"
                    placeholder="Enter text or URL to encode"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <div className="qr-form-group qr-form-half">
                  <label className="qr-form-label">Category</label>
                  <select
                    className="qr-form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="qr-form-row">
                <div className="qr-form-group qr-form-full">
                  <label className="qr-form-label">Description</label>
                  <textarea
                    className="qr-form-textarea"
                    placeholder="Enter description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="qr-form-actions">
                <button 
                  className="qr-generate-btn"
                  onClick={handleGenerate}
                  disabled={!text.trim()}
                >
                  <QrCode size={18} />
                  Generate QR Code
                </button>
              </div>
            </div>

            {/* QR Code Display */}
            {qrValue && (
              <div className="qr-display-section">
                <div className="qr-code-card">
                  <div className="qr-code-header">
                    <h3 className="qr-code-title">{title || "Generated QR Code"}</h3>
                    <div className="qr-code-category">{selectedCategory}</div>
                  </div>
                  
                  <div className="qr-code-canvas" ref={qrRef}>
                    <QRCodeCanvas
                      value={qrValue}
                      size={240}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={true}
                    />
                  </div>
                  
                  <div className="qr-code-details">
                    <div className="qr-code-content">{qrValue}</div>
                    {description && (
                      <div className="qr-code-description">{description}</div>
                    )}
                  </div>

                  <div className="qr-code-actions">
                    <button 
                      className="qr-action-btn qr-download-btn"
                      onClick={handleDownload}
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button 
                      className="qr-action-btn qr-copy-btn"
                      onClick={() => handleCopyToClipboard(qrValue)}
                    >
                      <Copy size={16} />
                      Copy Content
                    </button>
                    <button 
                      className="qr-action-btn qr-save-btn"
                      onClick={handleSaveQR}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="qr-loading-spinner"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save QR Code
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="qr-history-content">
            <div className="qr-history-header">
              <h2 className="qr-history-title">Saved QR Codes</h2>
              <div className="qr-search-container">
                <div className="qr-search-wrapper">
                  <Search size={18} className="qr-search-icon" />
                  <input
                    type="text"
                    className="qr-search-input"
                    placeholder="Search QR codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="qr-loading-container">
                <div className="qr-loading-spinner large"></div>
                Loading QR codes...
              </div>
            ) : filteredQRs.length === 0 ? (
              <div className="qr-empty-state">
                <div className="qr-empty-icon">📱</div>
                <div className="qr-empty-title">
                  {searchTerm ? "No QR codes found" : "No QR codes saved yet"}
                </div>
                <div className="qr-empty-text">
                  {searchTerm 
                    ? `No QR codes match "${searchTerm}". Try a different search term.`
                    : "Create and save your first QR code to get started."
                  }
                </div>
                {searchTerm && (
                  <button 
                    className="qr-empty-button"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="qr-history-grid">
                {filteredQRs.map((qr) => (
                  <div key={qr.id} className="qr-history-card">
                    <div className="qr-history-header">
                      <div className="qr-history-title">{qr.title}</div>
                      <div className="qr-history-category">{qr.category}</div>
                    </div>
                    
                    <div className="qr-history-preview">
                      {qr.qrImage ? (
                        <img 
                          src={qr.qrImage} 
                          alt={qr.title}
                          className="qr-saved-image"
                          width={120}
                          height={120}
                        />
                      ) : (
                        <QRCodeCanvas
                          value={qr.content}
                          size={120}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"H"}
                          includeMargin={true}
                        />
                      )}
                    </div>
                    
                    <div className="qr-history-details">
                      <div className="qr-history-content">{qr.content}</div>
                      {qr.description && (
                        <div className="qr-history-description">{qr.description}</div>
                      )}
                      <div className="qr-history-date">
                        Created: {new Date(qr.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="qr-history-actions">
                      <button 
                        className="qr-history-btn qr-view-btn"
                        onClick={() => handleLoadQR(qr)}
                        title="Load for editing"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="qr-history-btn qr-download-btn"
                        onClick={() => handleDownloadSavedQR(qr)}
                        title="Download QR code"
                      >
                        <Download size={14} />
                      </button>
                      <button 
                        className="qr-history-btn qr-copy-btn"
                        onClick={() => handleCopyToClipboard(qr.content)}
                        title="Copy content"
                      >
                        <Copy size={14} />
                      </button>
                      <button 
                        className="qr-history-btn qr-delete-btn"
                        onClick={() => handleDeleteQR(qr.id)}
                        title="Delete QR code"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default QRCodeGenerator;
