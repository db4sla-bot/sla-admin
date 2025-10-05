import React, { useEffect, useState } from 'react'
import './Leads.css'
import { Search, Pencil, Funnel, Save, X, User, Mail, MapPin, Phone, Building, Briefcase } from 'lucide-react'
import { db } from '../../Firebase'
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore"
import Hamburger from '../../Components/Hamburger/Hamburger'
import { toast } from 'react-toastify'

const STATUS_OPTIONS = [
  "New", "Follow Up", "Site Visit", "Quotation", "Customer", "Declined"
]

const SERVICE_OPTIONS = [
  "Construction", "Interior Design", "Renovation", "Consultation", "Maintenance"
]

const Leads = () => {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [loadingEditId, setLoadingEditId] = useState(null)
  const [loadingLeads, setLoadingLeads] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, search, filterStatus])

  const fetchLeads = async () => {
    setLoadingLeads(true)
    try {
      const querySnapshot = await getDocs(collection(db, "Leads"))
      const leadsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Sort leads by creation date (latest first)
      leadsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate() - a.createdAt.toDate()
        }
        return 0
      })
      
      setLeads(leadsList)
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast.error("Failed to fetch leads")
    }
    setLoadingLeads(false)
  }

  const filterLeads = () => {
    let filtered = leads.filter(lead =>
      (lead.name?.toLowerCase().includes(search.toLowerCase()) ||
       lead.mobilenumber?.toLowerCase().includes(search.toLowerCase()))
      && (filterStatus ? lead.status === filterStatus : true)
    )
    setFilteredLeads(filtered)
  }

  // Edit handlers
  const handleEdit = (lead) => {
    setEditId(lead.id)
    setEditData({
      name: lead.name || '',
      mobilenumber: lead.mobilenumber || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      status: lead.status || 'New',
      requiredService: lead.requiredService || '',
      createdBy: lead.createdBy || ''
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditSave = async (id) => {
    setLoadingEditId(id)
    try {
      await updateDoc(doc(db, "Leads", id), {
        ...editData,
        updatedAt: new Date()
      })
      
      setLeads(prev =>
        prev.map(lead =>
          lead.id === id ? { ...lead, ...editData } : lead
        )
      )
      setEditId(null)
      setEditData({})
      toast.success("Lead updated successfully!")
    } catch (error) {
      console.error("Error updating lead:", error)
      toast.error("Failed to update lead")
    }
    setLoadingEditId(null)
  }

  const handleEditCancel = () => {
    setEditId(null)
    setEditData({})
  }

  const getStatusClass = (status) => {
    if (!status) return "status-new"
    const key = status.toLowerCase().replace(/\s/g, "")
    switch (key) {
      case "new": return "status-new"
      case "followup": return "status-followup"
      case "sitevisit": return "status-sitevisit"
      case "quotation": return "status-quotation"
      case "customer": return "status-customer"
      case "declined": return "status-declined"
      default: return "status-new"
    }
  }

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1 className="leads-page-title">
            <User className="leads-title-icon" />
            Leads Management
          </h1>
        </div>
      </div>

      <div className="leads-page-container">
        {/* Top Section - Search and Filter */}
        <div className="leads-top-section">
          <div className="leads-search-filter-row">
            <div className="leads-search-input-con">
              <input
                type="text"
                name="leadssearch"
                id="searchlead"
                placeholder='Search by name or mobile...'
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Search className='search-icon' />
            </div>

            <div className={`leads-list-status-filter ${showFilterDropdown ? "show" : ""}`}>
              <button
                className={`leads-filter-btn ${filterStatus ? "active" : ""}`}
                type="button"
                onClick={() => setShowFilterDropdown(s => !s)}
                aria-expanded={showFilterDropdown ? "true" : "false"}
              >
                <Funnel size={16} />
                <span>{filterStatus || "All Status"}</span>
              </button>
              {showFilterDropdown && (
                <ul className="dropdown-menu show">
                  <li
                    className={filterStatus === "" ? "active" : ""}
                    onClick={() => {setFilterStatus(""); setShowFilterDropdown(false)}}
                  >
                    All Status
                  </li>
                  {STATUS_OPTIONS.map((status, index) => (
                    <li
                      key={index}
                      className={filterStatus === status ? "active" : ""}
                      onClick={() => {setFilterStatus(status); setShowFilterDropdown(false)}}
                    >
                      {status}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="leads-summary-info">
            <span className="leads-total-count">
              Showing {filteredLeads.length} of {leads.length} leads
            </span>
          </div>
        </div>

        {/* Leads List Container */}
        <div className="leads-list-container">
          {loadingLeads ? (
            <div className="leads-loader-row">
              <div className="loader-spinner"></div>
              <span>Loading leads...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="leads-empty-row">
              <div className="empty-icon">📋</div>
              <h3>No leads found</h3>
              <p>
                {leads.length === 0 
                  ? "No leads have been added yet." 
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className={`lead-list-item ${getStatusClass(lead.status)}`}>
                {editId === lead.id ? (
                  /* Edit Mode */
                  <div className="lead-edit-form">
                    <div className="lead-edit-header">
                      <h3>
                        <User size={20} />
                        Edit Lead Details
                      </h3>
                      <div className="lead-edit-actions">
                        <button 
                          className="lead-save-btn" 
                          onClick={() => handleEditSave(lead.id)} 
                          disabled={loadingEditId === lead.id}
                        >
                          {loadingEditId === lead.id ? (
                            <div className="btn-spinner"></div>
                          ) : (
                            <Save size={16} />
                          )}
                          Save
                        </button>
                        <button 
                          className="lead-cancel-btn" 
                          onClick={handleEditCancel}
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="lead-edit-form-grid">
                      <div className="form-group">
                        <label>
                          <User size={16} />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editData.name}
                          onChange={handleEditChange}
                          placeholder="Enter full name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <Phone size={16} />
                          Mobile Number *
                        </label>
                        <input
                          type="tel"
                          name="mobilenumber"
                          value={editData.mobilenumber}
                          onChange={handleEditChange}
                          placeholder="Enter mobile number"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <Mail size={16} />
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={editData.email}
                          onChange={handleEditChange}
                          placeholder="Enter email address"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <MapPin size={16} />
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={editData.address}
                          onChange={handleEditChange}
                          placeholder="Enter address"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <Building size={16} />
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={editData.city}
                          onChange={handleEditChange}
                          placeholder="Enter city"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <Building size={16} />
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={editData.state}
                          onChange={handleEditChange}
                          placeholder="Enter state"
                        />
                      </div>

                      <div className="form-group">
                        <label>
                          <Briefcase size={16} />
                          Status
                        </label>
                        <select
                          name="status"
                          value={editData.status}
                          onChange={handleEditChange}
                        >
                          {STATUS_OPTIONS.map((status, idx) => (
                            <option key={idx} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>
                          <Briefcase size={16} />
                          Required Service
                        </label>
                        <select
                          name="requiredService"
                          value={editData.requiredService}
                          onChange={handleEditChange}
                        >
                          <option value="">Select Service</option>
                          {SERVICE_OPTIONS.map((service, idx) => (
                            <option key={idx} value={service}>{service}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Display Mode */
                  <div className="lead-display-card">
                    <div className="lead-card-header">
                      <div className="lead-user-info">
                        <div className="lead-avatar">
                          {lead.name ? lead.name.charAt(0).toUpperCase() : "L"}
                        </div>
                        <div className="lead-basic-info">
                          <h3 className="lead-name">{lead.name || 'Unknown'}</h3>
                          <p className="lead-mobile">
                            <Phone size={14} />
                            {lead.mobilenumber || 'No mobile'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="lead-actions">
                        <div className={`lead-status-badge ${getStatusClass(lead.status)}`}>
                          {lead.status || 'New'}
                        </div>
                        <button 
                          className="lead-edit-btn" 
                          onClick={() => handleEdit(lead)}
                          title="Edit Lead"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="lead-details-grid">
                      {lead.email && (
                        <div className="lead-detail-item">
                          <Mail size={16} />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      
                      {lead.address && (
                        <div className="lead-detail-item">
                          <MapPin size={16} />
                          <span>{lead.address}</span>
                        </div>
                      )}
                      
                      {lead.city && (
                        <div className="lead-detail-item">
                          <Building size={16} />
                          <span>{lead.city}, {lead.state || ''}</span>
                        </div>
                      )}
                      
                      {lead.requiredService && (
                        <div className="lead-detail-item">
                          <Briefcase size={16} />
                          <span>{lead.requiredService}</span>
                        </div>
                      )}
                    </div>

                    {lead.createdBy && (
                      <div className="lead-meta-info">
                        <small>Created by: <strong>{lead.createdBy}</strong></small>
                        {lead.createdAt && (
                          <small> • {new Date(lead.createdAt.toDate()).toLocaleDateString()}</small>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export default Leads