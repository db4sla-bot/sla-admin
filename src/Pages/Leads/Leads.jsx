/* filepath: c:\Users\Arumulla SivaKrishna\Documents\sla-admin\src\Pages\Leads\Leads.jsx */
import React, { useEffect, useState } from 'react'
import './Leads.css'
import { Search, Filter, Edit, Plus, X, Save, User, Mail, MapPin, Phone, Building, Briefcase, Calendar, Target, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { db } from '../../Firebase'
import { collection, getDocs, updateDoc, doc } from "firebase/firestore"
import Hamburger from '../../Components/Hamburger/Hamburger'
import { toast } from 'react-toastify'
import { NavLink } from 'react-router-dom'

const Leads = () => {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('') // New from date filter
  const [toDateFilter, setToDateFilter] = useState('') // New to date filter
  const [sourceFilter, setSourceFilter] = useState('') // New source filter
  const [subSourceFilter, setSubSourceFilter] = useState('') // New sub source filter
  const [servicesFilter, setServicesFilter] = useState('') // New services filter
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    status: 'New',
    source: '',
    subSource: '',
    requiredServices: [],
    details: '',
    followUpDate: ''
  })
  const [saving, setSaving] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // Lead counts
  const [leadCounts, setLeadCounts] = useState({
    total: 0,
    filtered: 0,
    loading: 0
  })

  const statusOptions = ['New', 'Follow Up', 'Site Visit', 'Quotation', 'Customer', 'Declined']
  const statusColors = {
    'New': 'new',
    'Follow Up': 'followup', 
    'Site Visit': 'sitevisit',
    'Quotation': 'quotation',
    'Customer': 'customer',
    'Declined': 'declined'
  }

  const sourceOptions = [
    'Digital Marketing',
    'Online',
    'Offline Marketing',
    'Reference',
    'Marketing',
    'Interior Designers',
    'Builders',
    'Engineers'
  ]

  const subSourceOptions = [
    'Instagram',
    'Facebook',
    'Google',
    'Just Dial',
    'Google Listing',
    'Existing Customer',
    'Friends',
    'Marketers',
    'Flex',
    'Newspapers',
    'Bike Stickers',
    'Others'
  ]

  const serviceOptions = [
    'Invisible Grills',
    'Mosquito Mesh',
    'Cloth Hangers',
    'Artificial Grass',
    'Bird Spikes'
  ]

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, statusFilter, fromDateFilter, toDateFilter, sourceFilter, subSourceFilter, servicesFilter, leads])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, fromDateFilter, toDateFilter, sourceFilter, subSourceFilter, servicesFilter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setLeadCounts(prev => ({ ...prev, loading: 1 }))
      
      const querySnapshot = await getDocs(collection(db, "Leads"))
      const leadsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Sort leads by creation date (latest first)
      leadsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const aDate = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)
          const bDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)
          return bDate - aDate
        }
        return 0
      })
      
      setLeads(leadsList)
      setFilteredLeads(leadsList)
      
      // Update counts
      setLeadCounts({
        total: leadsList.length,
        filtered: leadsList.length,
        loading: 0
      })
      
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast.error("Failed to fetch leads")
      setLeadCounts({ total: 0, filtered: 0, loading: 0 })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    // Search filter - now includes details field
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.subSource?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    // From date filter
    if (fromDateFilter) {
      filtered = filtered.filter(lead => {
        if (!lead.createdAt) return false
        
        let leadDate;
        if (lead.createdAt.toDate) {
          leadDate = lead.createdAt.toDate();
        } else if (typeof lead.createdAt === 'string') {
          leadDate = new Date(lead.createdAt);
        } else {
          leadDate = new Date(lead.createdAt);
        }
        
        const filterFromDate = new Date(fromDateFilter);
        return leadDate >= filterFromDate;
      });
    }

    // To date filter
    if (toDateFilter) {
      filtered = filtered.filter(lead => {
        if (!lead.createdAt) return false
        
        let leadDate;
        if (lead.createdAt.toDate) {
          leadDate = lead.createdAt.toDate();
        } else if (typeof lead.createdAt === 'string') {
          leadDate = new Date(lead.createdAt);
        } else {
          leadDate = new Date(lead.createdAt);
        }
        
        const filterToDate = new Date(toDateFilter);
        filterToDate.setHours(23, 59, 59, 999); // End of day
        return leadDate <= filterToDate;
      });
    }

    // Source filter
    if (sourceFilter) {
      filtered = filtered.filter(lead => lead.source === sourceFilter)
    }

    // Sub source filter
    if (subSourceFilter) {
      filtered = filtered.filter(lead => lead.subSource === subSourceFilter)
    }

    // Services filter - NEW
    if (servicesFilter) {
      filtered = filtered.filter(lead => {
        if (!lead.requiredServices || !Array.isArray(lead.requiredServices)) return false
        return lead.requiredServices.includes(servicesFilter)
      })
    }

    setFilteredLeads(filtered)
    
    // Update filtered count
    setLeadCounts(prev => ({
      ...prev,
      filtered: filtered.length
    }))
  }

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)

  // Pagination handlers
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const getPaginationNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value)
  }

  const handleFromDateFilter = (e) => {
    setFromDateFilter(e.target.value)
  }

  const handleToDateFilter = (e) => {
    setToDateFilter(e.target.value)
  }

  const handleSourceFilter = (e) => {
    setSourceFilter(e.target.value)
  }

  const handleSubSourceFilter = (e) => {
    setSubSourceFilter(e.target.value)
  }

  const handleServicesFilter = (e) => {
    setServicesFilter(e.target.value)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setSourceFilter('')
    setSubSourceFilter('')
    setServicesFilter('') // Clear services filter
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  const handleEditLead = (lead) => {
    setSelectedLead(lead)
    setEditFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      country: lead.country || 'India',
      status: lead.status || 'New',
      source: lead.source || '',
      subSource: lead.subSource || '',
      requiredServices: lead.requiredServices || [],
      details: lead.details || '',
      followUpDate: lead.followUpDate || ''
    })
    setShowEditModal(true)
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleServiceToggle = (service) => {
    setEditFormData(prev => ({
      ...prev,
      requiredServices: prev.requiredServices.includes(service)
        ? prev.requiredServices.filter(s => s !== service)
        : [...prev.requiredServices, service]
    }))
  }

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.name.trim()) {
      toast.error('Customer name is required!')
      return
    }
    if (!editFormData.phone.trim()) {
      toast.error('Phone number is required!')
      return
    }

    setSaving(true)
    toast.info('Updating lead...', { autoClose: 1000 })

    try {
      const leadRef = doc(db, 'Leads', selectedLead.id)
      const updatedData = {
        ...editFormData,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(leadRef, updatedData)
      
      // Update local state
      setLeads(prev => 
        prev.map(lead => 
          lead.id === selectedLead.id 
            ? { ...lead, ...updatedData }
            : lead
        )
      )
      
      toast.success('Lead updated successfully!')
      setShowEditModal(false)
      setSelectedLead(null)
      
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedLead(null)
    setSaving(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const getStatusClass = (status) => {
    return statusColors[status] || 'new'
  }

  if (loading) {
    return (
      <>
        <div className="leads-top-bar-container">
          <Hamburger />
          <div className="leads-breadcrumps-container">
            <h1>Leads</h1>
          </div>
        </div>
        <div className="leads-loading">
          <div className="leads-loader"></div>
          <p>Loading leads...</p>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Top Bar */}
      <div className="leads-top-bar-container">
        <Hamburger />
        <div className="leads-breadcrumps-container">
          <h1>Leads ({leadCounts.total})</h1>
        </div>
        <div className="leads-actions-container">
          <NavLink to="/addleads" className="leads-add-btn">
            <Plus /> Add Lead
          </NavLink>
        </div>
      </div>

      <div className="leads-main-container">
        {/* Header with Enhanced Counts */}
        <div className="leads-header">
          <div className="leads-header-info">
            <h1>Leads Management</h1>
            <p>Manage and track your leads pipeline</p>
          </div>
          <div className="leads-counts-display">
            <div className="leads-count-card total">
              <div className="leads-count-number">{leadCounts.total}</div>
              <div className="leads-count-label">Total Leads</div>
            </div>
            {(searchTerm || statusFilter || fromDateFilter || toDateFilter || sourceFilter || subSourceFilter || servicesFilter) && (
              <div className="leads-count-card filtered">
                <div className="leads-count-number">{leadCounts.filtered}</div>
                <div className="leads-count-label">Filtered Results</div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="leads-filters">
          <div className="leads-search-container">
            <Search className="leads-search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, address, city, details, source..."
              value={searchTerm}
              onChange={handleSearch}
              className="leads-search-input"
            />
          </div>

          <div className="leads-filter-row">
            <div className="leads-date-filter-group">
              <div className="leads-date-filter">
                <Calendar className="leads-calendar-icon" />
                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={handleFromDateFilter}
                  className="leads-date-input"
                  placeholder="From date"
                />
                <label className="leads-date-label">From</label>
              </div>

              <div className="leads-date-filter">
                <Calendar className="leads-calendar-icon" />
                <input
                  type="date"
                  value={toDateFilter}
                  onChange={handleToDateFilter}
                  className="leads-date-input"
                  placeholder="To date"
                />
                <label className="leads-date-label">To</label>
              </div>
            </div>

            <div className="leads-source-filter">
              <select
                value={sourceFilter}
                onChange={handleSourceFilter}
                className="leads-source-select"
              >
                <option value="">All Sources</option>
                {sourceOptions.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div className="leads-sub-source-filter">
              <select
                value={subSourceFilter}
                onChange={handleSubSourceFilter}
                className="leads-sub-source-select"
              >
                <option value="">All Sub Sources</option>
                {subSourceOptions.map(subSource => (
                  <option key={subSource} value={subSource}>{subSource}</option>
                ))}
              </select>
            </div>

            <div className="leads-services-filter">
              <select
                value={servicesFilter}
                onChange={handleServicesFilter}
                className="leads-services-select"
              >
                <option value="">All Services</option>
                {serviceOptions.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div className="leads-status-filter">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="leads-status-select"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <button className="leads-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Enhanced Results Summary with Pagination Info */}
        <div className="leads-summary">
          <div className="leads-summary-info">
            <p>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, leadCounts.filtered)} of {leadCounts.filtered} leads
              {leadCounts.filtered !== leadCounts.total && (
                <span className="leads-total-info"> (filtered from {leadCounts.total} total)</span>
              )}
            </p>
            {(searchTerm || statusFilter || fromDateFilter || toDateFilter || sourceFilter || subSourceFilter || servicesFilter) && (
              <p className="leads-filter-info">
                {leadCounts.filtered} results match your filters
              </p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="leads-page-info">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Leads Table */}
        <div className="leads-table-container">
          {currentLeads.length > 0 ? (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Services</th>
                  <th>Source</th>
                  <th>Follow Up</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentLeads.map((lead) => {
                  // Format creation date
                  const formatCreatedDate = (createdAt) => {
                    if (!createdAt) return 'N/A';
                    
                    let date;
                    if (createdAt.toDate) {
                      date = createdAt.toDate();
                    } else if (typeof createdAt === 'string') {
                      date = new Date(createdAt);
                    } else {
                      date = new Date(createdAt);
                    }
                    
                    return date.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                  };

                  return (
                    <tr key={lead.id} className="leads-table-row">
                      <td className="leads-customer">
                        <div className="leads-customer-info">
                          <span className="leads-customer-name">
                            {lead.name || 'N/A'}
                          </span>
                          {lead.details && (
                            <span className="leads-customer-email">
                              {lead.details.length > 30 ? `${lead.details.substring(0, 30)}...` : lead.details}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="leads-contact">
                        <span className="leads-phone">
                          {lead.phone || 'N/A'}
                        </span>
                      </td>
                      <td className="leads-address">
                        <div className="leads-address-info">
                          {lead.address && (
                            <span className="leads-address">
                              {lead.address.length > 25 ? `${lead.address.substring(0, 25)}...` : lead.address}
                            </span>
                          )}
                          <span className="leads-city-state">
                            {lead.city && lead.state ? `${lead.city}, ${lead.state}` : 
                             lead.city || lead.state || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="leads-services">
                        <div className="leads-services-info">
                          {lead.requiredServices && lead.requiredServices.length > 0 ? (
                            lead.requiredServices.slice(0, 2).map((service, index) => (
                              <span key={index} className="leads-service-tag">
                                {service}
                              </span>
                            ))
                          ) : (
                            <span className="leads-service-tag">N/A</span>
                          )}
                          {lead.requiredServices && lead.requiredServices.length > 2 && (
                            <span className="leads-service-tag">+{lead.requiredServices.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="leads-source">
                        <div className="leads-source-info">
                          <span className="leads-source">{lead.source || 'N/A'}</span>
                          <span className="leads-sub-source">{lead.subSource || ''}</span>
                        </div>
                      </td>
                      <td className="leads-followup">
                        <span className="leads-followup-date">
                          {formatDate(lead.followUpDate)}
                        </span>
                      </td>
                      <td className="leads-created-date">
                        <span className="leads-date" style={{fontSize: '12px'}}>
                          {formatCreatedDate(lead.createdAt)}
                        </span>
                      </td>
                      <td className="leads-status">
                        <span className={`leads-status-badge ${getStatusClass(lead.status)}`}>
                          {lead.status || 'New'}
                        </span>
                      </td>
                      <td className="leads-actions">
                        <div className="leads-action-buttons">
                          <button
                            className="leads-edit-btn"
                            onClick={() => handleEditLead(lead)}
                            title="Edit Lead"
                          >
                            <Edit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="leads-empty">
              <div className="leads-empty-icon">👥</div>
              <h3>No leads found</h3>
              <p>
                {searchTerm || statusFilter || fromDateFilter || toDateFilter || sourceFilter || subSourceFilter || servicesFilter
                  ? `No leads match your current filters. Try adjusting your search criteria.`
                  : "Start by adding your first lead"}
              </p>
              {leadCounts.total > 0 && (searchTerm || statusFilter || fromDateFilter || toDateFilter || sourceFilter || subSourceFilter || servicesFilter) && (
                <button className="leads-clear-filters-btn" onClick={clearFilters}>
                  <Filter />
                  Clear All Filters to See All {leadCounts.total} Leads
                </button>
              )}
              {leadCounts.total === 0 && (
                <NavLink to="/addleads" className="leads-empty-add-btn">
                  <Plus /> Add New Lead
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="leads-pagination">
            <div className="leads-pagination-info">
              <span>
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, leadCounts.filtered)} of {leadCounts.filtered} leads
              </span>
            </div>
            
            <div className="leads-pagination-controls">
              <button
                className="leads-page-btn leads-page-prev"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              
              <div className="leads-page-numbers">
                {getPaginationNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="leads-page-ellipsis">...</span>
                    ) : (
                      <button
                        className={`leads-page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              <button
                className="leads-page-btn leads-page-next"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Lead Modal */}
      {showEditModal && selectedLead && (
        <div className="leads-edit-modal">
          <div className="leads-edit-overlay" onClick={closeEditModal}></div>
          <div className="leads-edit-content">
            <div className="leads-edit-header">
              <h2>Edit Lead</h2>
              <button 
                className="leads-edit-close-btn" 
                onClick={closeEditModal}
              >
                <X />
              </button>
            </div>

            <div className="leads-edit-form">
              <div className="leads-edit-form-row">
                <div className="leads-edit-form-group">
                  <label htmlFor="edit-name">
                    <User className="leads-form-icon" />
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="leads-edit-form-group">
                  <label htmlFor="edit-phone">
                    <Phone className="leads-form-icon" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditFormChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              <div className="leads-edit-form-row">
                <div className="leads-edit-form-group">
                  <label htmlFor="edit-source">
                    <Target className="leads-form-icon" />
                    Source
                  </label>
                  <select
                    id="edit-source"
                    name="source"
                    value={editFormData.source}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select Source</option>
                    {sourceOptions.map(source => (
                      <option key={source} value={source}>{source}</option>
                    ))}
                  </select>
                </div>

                <div className="leads-edit-form-group">
                  <label htmlFor="edit-subSource">
                    <Target className="leads-form-icon" />
                    Sub Source
                  </label>
                  <select
                    id="edit-subSource"
                    name="subSource"
                    value={editFormData.subSource}
                    onChange={handleEditFormChange}
                  >
                    <option value="">Select Sub Source</option>
                    {subSourceOptions.map(subSource => (
                      <option key={subSource} value={subSource}>{subSource}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="leads-edit-form-row">
                <div className="leads-edit-form-group">
                  <label htmlFor="edit-city">
                    <Building className="leads-form-icon" />
                    City
                  </label>
                  <input
                    type="text"
                    id="edit-city"
                    name="city"
                    value={editFormData.city}
                    onChange={handleEditFormChange}
                    placeholder="Enter city"
                  />
                </div>

                <div className="leads-edit-form-group">
                  <label htmlFor="edit-state">
                    <Building className="leads-form-icon" />
                    State
                  </label>
                  <input
                    type="text"
                    id="edit-state"
                    name="state"
                    value={editFormData.state}
                    onChange={handleEditFormChange}
                    placeholder="Enter state"
                  />
                </div>
              </div>

              <div className="leads-edit-form-row">
                <div className="leads-edit-form-group">
                  <label htmlFor="edit-status">
                    <Briefcase className="leads-form-icon" />
                    Status
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="leads-edit-form-group">
                  <label htmlFor="edit-followUpDate">
                    <Calendar className="leads-form-icon" />
                    Follow Up Date
                  </label>
                  <input
                    type="date"
                    id="edit-followUpDate"
                    name="followUpDate"
                    value={editFormData.followUpDate}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>

              <div className="leads-edit-form-group full-width">
                <label htmlFor="edit-address">
                  <MapPin className="leads-form-icon" />
                  Address
                </label>
                <textarea
                  id="edit-address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditFormChange}
                  placeholder="Enter full address"
                  rows="3"
                />
              </div>

              <div className="leads-edit-form-group full-width">
                <label>
                  <Briefcase className="leads-form-icon" />
                  Required Services
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {serviceOptions.map(service => (
                    <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={editFormData.requiredServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <div className="leads-edit-form-group full-width">
                <label htmlFor="edit-details">
                  <MessageSquare className="leads-form-icon" />
                  Additional Details
                </label>
                <textarea
                  id="edit-details"
                  name="details"
                  value={editFormData.details}
                  onChange={handleEditFormChange}
                  placeholder="Any additional details or notes"
                  rows="3"
                />
              </div>

              <div className="leads-edit-actions">
                <button
                  className="leads-save-btn"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="leads-btn-loader"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="leads-btn-icon" />
                      Update Lead
                    </>
                  )}
                </button>
                <button
                  className="leads-cancel-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Leads