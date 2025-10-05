import React, { useState, useEffect, useRef } from 'react'
import './Quotations.css'
import { Search, Filter, Eye, Edit, Download, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Logo from '../../assets/logo.jpg'
import { useNavigate } from 'react-router-dom'

const Quotations = () => {
  const [quotations, setQuotations] = useState([])
  const [filteredQuotations, setFilteredQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [showPreview, setShowPreview] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const previewRef = useRef(null)
  const navigate = useNavigate()

  // Fetch quotations from Firestore
  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const quotationsRef = collection(db, 'Quotations')
      const q = query(quotationsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const quotationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setQuotations(quotationsData)
      setFilteredQuotations(quotationsData)
      // Remove loading toast - just silent loading
    } catch (error) {
      console.error('Error fetching quotations:', error)
      toast.error('Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  // Filter quotations based on search and date
  useEffect(() => {
    let filtered = [...quotations]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(quotation => 
        quotation.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.toName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.toPhone?.includes(searchTerm) ||
        quotation.toEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(quotation => {
        const quotationDate = new Date(quotation.createdAt)
        const startDate = new Date(dateFilter.startDate)
        startDate.setHours(0, 0, 0, 0) // Start of day
        return quotationDate >= startDate
      })
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter(quotation => {
        const quotationDate = new Date(quotation.createdAt)
        const endDate = new Date(dateFilter.endDate)
        endDate.setHours(23, 59, 59, 999) // End of day
        return quotationDate <= endDate
      })
    }

    setFilteredQuotations(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, dateFilter, quotations])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredQuotations.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage)

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  // Handle date filter
  const handleDateFilter = (e) => {
    const { name, value } = e.target
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('')
    setDateFilter({ startDate: '', endDate: '' })
    // Remove this line as it's redundant - the useEffect will handle filtering
  }

  // Handle view quotation
  const handleViewQuotation = (quotation) => {
    setSelectedQuotation(quotation)
    setShowPreview(true)
  }

  // Handle edit quotation
  const handleEditQuotation = (quotationId) => {
    navigate(`/editquotation/${quotationId}`)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!selectedQuotation || !previewRef.current) {
      toast.error('Unable to generate PDF')
      return
    }

    setDownloading(true)
    toast.info('Generating PDF...', { autoClose: 1000 })

    try {
      const element = previewRef.current
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "pt", "a4")
      
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - margin * 2
      const imgWidth = canvas.width
      const imgHeight = canvas.height

      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight)
      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio

      const x = (pageWidth - finalWidth) / 2
      const y = (pageHeight - finalHeight) / 2

      pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight)
      pdf.save(`${selectedQuotation.quotationNumber || selectedQuotation.id}.pdf`)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloading(false)
    }
  }

  // Prepare preview data for selected quotation
  const getPreviewData = (quotation) => {
    if (!quotation) return null
    
    return {
      brand: {
        name: "SLA Invisible Grills",
        address: quotation.fromAddress || "Sapthagiti Colony, Vedyapalem, Minibypass, Nellore-4",
        vat: quotation.gstNumber || ""
      },
      quotation: {
        number: quotation.quotationNumber || quotation.id,
        date: formatDate(quotation.createdAt)
      },
      to: {
        name: quotation.toName || "",
        email: quotation.toEmail || "",
        mobile: quotation.toPhone || "",
        address: quotation.toAddress || ""
      },
      quotationProducts: quotation.quotationProducts || [],
      subTotal: quotation.subTotal || 0,
      tax: { 
        label: `GST (${quotation.gst || 0}%)`, 
        value: quotation.taxAmount || 0 
      },
      grandTotal: quotation.grandTotal || 0,
      notes: quotation.notes || [],
      terms: quotation.terms || [],
      manager: quotation.manager || {
        name: "Sreekanth Chowdary",
        role: "Managing Director",
        date: new Date().toLocaleString()
      }
    }
  }

  if (loading) {
    return (
      <div className="quotations-loading">
        <div className="quotations-loader"></div>
        <p>Loading quotations...</p>
      </div>
    )
  }

  return (
    <div className="quotations-main-container">
      {/* Header */}
      <div className="quotations-header">
        <h1>Quotations Management</h1>
        <div className="quotations-header-actions">
          <button 
            className="quotations-add-btn"
            onClick={() => navigate('/addquotation')}
          >
            + Add New Quotation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="quotations-filters">
        <div className="quotations-search-container">
          <Search className="quotations-search-icon" />
          <input
            type="text"
            placeholder="Search by quotation number, customer name, phone, or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="quotations-search-input"
          />
        </div>

        <div className="quotations-date-filters">
          <div className="quotations-date-filter">
            <Calendar className="quotations-calendar-icon" />
            <input
              type="date"
              name="startDate"
              value={dateFilter.startDate}
              onChange={handleDateFilter}
              className="quotations-date-input"
              placeholder="Start Date"
            />
          </div>
          <div className="quotations-date-filter">
            <Calendar className="quotations-calendar-icon" />
            <input
              type="date"
              name="endDate"
              value={dateFilter.endDate}
              onChange={handleDateFilter}
              className="quotations-date-input"
              placeholder="End Date"
            />
          </div>
          <button className="quotations-clear-filters" onClick={clearFilters}>
            <Filter />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="quotations-summary">
        <p>Showing {filteredQuotations.length} of {quotations.length} quotations</p>
        {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
          <p className="quotations-filter-info">Filters applied</p>
        )}
      </div>

      {/* Quotations Table */}
      <div className="quotations-table-container">
        {currentItems.length > 0 ? (
          <table className="quotations-table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((quotation) => (
                <tr key={quotation.id} className="quotations-table-row">
                  <td className="quotations-number">
                    <span className="quotations-id">{quotation.quotationNumber || quotation.id}</span>
                  </td>
                  <td className="quotations-customer">
                    <div className="quotations-customer-info">
                      <span className="quotations-customer-name">{quotation.toName || 'N/A'}</span>
                      <span className="quotations-customer-email">{quotation.toEmail || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="quotations-contact">
                    <span className="quotations-phone">{quotation.toPhone || 'N/A'}</span>
                  </td>
                  <td className="quotations-products">
                    <span className="quotations-product-count">
                      {quotation.quotationProducts?.length || 0} Products
                    </span>
                  </td>
                  <td className="quotations-amount">
                    <span className="quotations-grand-total">
                      {formatCurrency(quotation.grandTotal)}
                    </span>
                  </td>
                  <td className="quotations-date">
                    <span className="quotations-created-date">
                      {formatDate(quotation.createdAt)}
                    </span>
                  </td>
                  <td className="quotations-actions">
                    <div className="quotations-action-buttons">
                      <button
                        className="quotations-view-btn"
                        onClick={() => handleViewQuotation(quotation)}
                        title="View Quotation"
                      >
                        <Eye />
                      </button>
                      <button
                        className="quotations-edit-btn"
                        onClick={() => handleEditQuotation(quotation.id)}
                        title="Edit Quotation"
                      >
                        <Edit />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="quotations-empty">
            <div className="quotations-empty-icon">📄</div>
            <h3>No quotations found</h3>
            <p>
              {searchTerm || dateFilter.startDate || dateFilter.endDate
                ? "Try adjusting your search criteria or filters"
                : "Create your first quotation to get started"}
            </p>
            {!searchTerm && !dateFilter.startDate && !dateFilter.endDate && (
              <button 
                className="quotations-empty-add-btn"
                onClick={() => navigate('/addquotation')}
              >
                + Add New Quotation
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="quotations-pagination">
          <button
            className="quotations-page-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft />
          </button>
          
          <div className="quotations-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`quotations-page-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className="quotations-page-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight />
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedQuotation && (
        <div className="quotations-preview-modal">
          <div className="quotations-preview-overlay" onClick={() => setShowPreview(false)}></div>
          <div className="quotations-preview-content">
            <div className="quotations-preview-header">
              <h2>Quotation Preview</h2>
              <div className="quotations-preview-actions">
                <button 
                  className="quotations-download-btn" 
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                >
                  {downloading ? (
                    <span className="quotations-loader-white"></span>
                  ) : (
                    <Download />
                  )}
                  {downloading ? "Downloading..." : "Download PDF"}
                </button>
                <button 
                  className="quotations-close-btn" 
                  onClick={() => setShowPreview(false)}
                >
                  <X />
                </button>
              </div>
            </div>

            <div ref={previewRef} className="quotations-preview-body">
              {(() => {
                const previewData = getPreviewData(selectedQuotation)
                if (!previewData) return null

                return (
                  <>
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
                        <div><b>Email:</b> {selectedQuotation.fromEmail}</div>
                        <div><b>Mobile:</b> {selectedQuotation.fromPhone}</div>
                        {selectedQuotation.referredBy && <div><b>Referred By:</b> {selectedQuotation.referredBy}</div>}
                        {selectedQuotation.technician && <div><b>Technician:</b> {selectedQuotation.technician}</div>}
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
                      product.items && product.items.length > 0 && (
                        <div key={product.id} className="quotation-preview-product-section">
                          <div className="quotation-product-display">
                            <h4>Service Category</h4>
                            <span>{product.name}</span>
                          </div>

                          <div className="quotation-preview-items-table">
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
                                {product.items.map((item, idx) => (
                                  <tr key={idx}>
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

                    {/* Notes and Terms */}
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
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quotations