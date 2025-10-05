import React, { useState, useEffect, useRef } from 'react'
import './Invoices.css'
import { Search, Filter, Eye, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Invoices = () => {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const navigate = useNavigate()

  // Fetch invoices from Firestore
  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const invoicesRef = collection(db, 'Invoices')
      const q = query(invoicesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const invoicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setInvoices(invoicesData)
      setFilteredInvoices(invoicesData)
      // Remove loading toast - just silent loading
    } catch (error) {
      console.error('Error fetching invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  // Filter invoices based on search and date
  useEffect(() => {
    let filtered = [...invoices]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.toName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.toPhone?.includes(searchTerm) ||
        invoice.toEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Date filter
    if (dateFilter.startDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.issueDate)
        const startDate = new Date(dateFilter.startDate)
        startDate.setHours(0, 0, 0, 0) // Start of day
        return invoiceDate >= startDate
      })
    }

    if (dateFilter.endDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt || invoice.issueDate)
        const endDate = new Date(dateFilter.endDate)
        endDate.setHours(23, 59, 59, 999) // End of day
        return invoiceDate <= endDate
      })
    }

    setFilteredInvoices(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, dateFilter, invoices])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

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

  // Handle view invoice - redirect to details page
  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/${invoice.id}`)
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

  if (loading) {
    return (
      <div className="invoices-loading">
        <div className="invoices-loader"></div>
        <p>Loading invoices...</p>
      </div>
    )
  }

  return (
    <div className="invoices-main-container">
      {/* Header */}
      <div className="invoices-header">
        <h1>Invoices Management</h1>
        <div className="invoices-header-actions">
          <button 
            className="invoices-add-btn"
            onClick={() => navigate('/addinvoice')}
          >
            + Add New Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="invoices-filters">
        <div className="invoices-search-container">
          <Search className="invoices-search-icon" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name, phone, or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="invoices-search-input"
          />
        </div>

        <div className="invoices-date-filters">
          <div className="invoices-date-filter">
            <Calendar className="invoices-calendar-icon" />
            <input
              type="date"
              name="startDate"
              value={dateFilter.startDate}
              onChange={handleDateFilter}
              className="invoices-date-input"
              placeholder="Start Date"
            />
          </div>
          <div className="invoices-date-filter">
            <Calendar className="invoices-calendar-icon" />
            <input
              type="date"
              name="endDate"
              value={dateFilter.endDate}
              onChange={handleDateFilter}
              className="invoices-date-input"
              placeholder="End Date"
            />
          </div>
          <button className="invoices-clear-filters" onClick={clearFilters}>
            <Filter />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="invoices-summary">
        <p>Showing {filteredInvoices.length} of {invoices.length} invoices</p>
        {(searchTerm || dateFilter.startDate || dateFilter.endDate) && (
          <p className="invoices-filter-info">Filters applied</p>
        )}
      </div>

      {/* Invoices Table */}
      <div className="invoices-table-container">
        {currentItems.length > 0 ? (
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((invoice) => (
                <tr key={invoice.id} className="invoices-table-row">
                  <td className="invoices-number">
                    <span className="invoices-id">{invoice.invoiceNumber || invoice.id}</span>
                  </td>
                  <td className="invoices-customer">
                    <div className="invoices-customer-info">
                      <span className="invoices-customer-name">{invoice.toName || 'N/A'}</span>
                      <span className="invoices-customer-email">{invoice.toEmail || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="invoices-contact">
                    <span className="invoices-phone">{invoice.toPhone || 'N/A'}</span>
                  </td>
                  <td className="invoices-service">
                    <span className="invoices-service-name">
                      {invoice.invoiceProduct || 'N/A'}
                    </span>
                  </td>
                  <td className="invoices-amount">
                    <span className="invoices-grand-total">
                      {formatCurrency(invoice.grandTotal)}
                    </span>
                  </td>
                  <td className="invoices-date">
                    <span className="invoices-created-date">
                      {formatDate(invoice.createdAt || invoice.issueDate)}
                    </span>
                  </td>
                  <td className="invoices-actions">
                    <div className="invoices-action-buttons">
                      <button
                        className="invoices-view-btn"
                        onClick={() => handleViewInvoice(invoice)}
                        title="View Invoice"
                      >
                        <Eye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="invoices-empty">
            <div className="invoices-empty-icon">🧾</div>
            <h3>No invoices found</h3>
            <p>
              {searchTerm || dateFilter.startDate || dateFilter.endDate
                ? "Try adjusting your search criteria or filters"
                : "Create your first invoice to get started"}
            </p>
            {!searchTerm && !dateFilter.startDate && !dateFilter.endDate && (
              <button 
                className="invoices-empty-add-btn"
                onClick={() => navigate('/addinvoice')}
              >
                + Add New Invoice
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="invoices-pagination">
          <button
            className="invoices-page-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft />
          </button>
          
          <div className="invoices-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`invoices-page-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            className="invoices-page-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}

export default Invoices