import React, { useState, useEffect } from 'react'
import './Appointments.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Search, Filter, Edit, Calendar, Plus, ChevronLeft, ChevronRight, X, Save, User, Mail, Phone, MapPin, Briefcase, Users } from 'lucide-react'
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../../Firebase'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'

const Appointments = () => {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    appointmentType: '',
    assignedTo: '',
    date: '',
    time: '',
    status: 'New',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [user, authLoading] = useAuthState(auth)
  
  const navigate = useNavigate()

  const statusOptions = ['New', 'In Progress', 'Done']
  const statusColors = {
    'New': '#3b82f6',
    'In Progress': '#f59e0b', 
    'Done': '#10b981'
  }

  const appointmentTypes = [
    'Installation',
    'Maintenance',
    'Repair',
    'Consultation',
    'Inspection',
    'Follow-up',
    'Other'
  ]

  // Time slots
  const timeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00', 
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ]

  useEffect(() => {
    fetchAppointments()
    fetchEmployees()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const appointmentsRef = collection(db, 'Appointments')
      const q = query(appointmentsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setAppointments(appointmentsData)
      setFilteredAppointments(appointmentsData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const employeesSnapshot = await getDocs(collection(db, 'Employees'))
      const employeesList = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setEmployees(employeesList)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  // Filter appointments to show only those assigned to the logged-in user
  const filterAppointmentsByUser = (appointmentsData) => {
    if (!user?.email) return appointmentsData
    
    // Find the current user's employee ID
    const currentEmployee = employees.find(emp => emp.email === user.email || emp.id === user.email)
    
    if (!currentEmployee) {
      // If user is not found in employees list, show all appointments (admin access)
      return appointmentsData
    }
    
    // Filter appointments assigned to current user
    return appointmentsData.filter(appointment => 
      appointment.assignedTo === currentEmployee.id
    )
  }

  // Filter appointments based on search, date and status
  useEffect(() => {
    let filtered = [...appointments]

    // First filter by logged-in user
    filtered = filterAppointmentsByUser(filtered)

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(appointment => 
        appointment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.customerPhone?.includes(searchTerm) ||
        appointment.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.date)
        const filterDate = new Date(dateFilter)
        return appointmentDate.toDateString() === filterDate.toDateString()
      })
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(appointment => 
        appointment.status === statusFilter
      )
    }

    setFilteredAppointments(filtered)
    setCurrentPage(1)
  }, [searchTerm, dateFilter, statusFilter, appointments, employees, user])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAppointments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage)

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value)
  }

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFilter('')
    setStatusFilter('')
  }

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setEditFormData({
      customerName: appointment.customerName || '',
      customerEmail: appointment.customerEmail || '',
      customerPhone: appointment.customerPhone || '',
      customerAddress: appointment.customerAddress || '',
      appointmentType: appointment.appointmentType || '',
      assignedTo: appointment.assignedTo || '',
      date: appointment.date || '',
      time: appointment.time || '',
      status: appointment.status || 'New',
      notes: appointment.notes || ''
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

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.customerName.trim()) {
      toast.error('Customer name is required!')
      return
    }
    if (!editFormData.customerPhone.trim()) {
      toast.error('Customer phone is required!')
      return
    }
    if (!editFormData.appointmentType) {
      toast.error('Please select appointment type!')
      return
    }
    if (!editFormData.assignedTo) {
      toast.error('Please assign to an employee!')
      return
    }
    if (!editFormData.date) {
      toast.error('Please select appointment date!')
      return
    }
    if (!editFormData.time) {
      toast.error('Please select appointment time!')
      return
    }

    setSaving(true)
    toast.info('Updating appointment...', { autoClose: 1000 })

    try {
      const appointmentRef = doc(db, 'Appointments', selectedAppointment.id)
      const updatedData = {
        ...editFormData,
        updatedAt: new Date().toISOString()
      }

      await updateDoc(appointmentRef, updatedData)
      
      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === selectedAppointment.id 
            ? { ...apt, ...updatedData }
            : apt
        )
      )
      
      toast.success('Appointment updated successfully!')
      setShowEditModal(false)
      setSelectedAppointment(null)
      
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Failed to update appointment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedAppointment(null)
    setSaving(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? (employee.name || employee.email) : 'N/A'
  }

  if (loading || authLoading) {
    return (
      <>
        <div className="appointments-top-bar-container">
          <Hamburger />
          <div className="appointments-breadcrumps-container">
            <h1>Appointments</h1>
          </div>
        </div>
        <div className="appointments-loading">
          <div className="appointments-loader"></div>
          <p>Loading appointments...</p>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Top Bar */}
      <div className="appointments-top-bar-container">
        <Hamburger />
        <div className="appointments-breadcrumps-container">
          <h1>Appointments</h1>
        </div>
        <div className="appointments-actions-container">
          <button 
            className="appointments-add-btn"
            onClick={() => navigate('/addappointment')}
          >
            <Plus /> Add Appointment
          </button>
        </div>
      </div>

      <div className="appointments-main-container">
        {/* Header */}
        <div className="appointments-header">
          <h1>My Appointments</h1>
          <p>Manage and track your assigned appointments</p>
        </div>

        {/* Filters */}
        <div className="appointments-filters">
          <div className="appointments-search-container">
            <Search className="appointments-search-icon" />
            <input
              type="text"
              placeholder="Search by customer name, phone, email, or appointment type..."
              value={searchTerm}
              onChange={handleSearch}
              className="appointments-search-input"
            />
          </div>

          <div className="appointments-filter-row">
            <div className="appointments-date-filter">
              <Calendar className="appointments-calendar-icon" />
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateFilter}
                className="appointments-date-input"
                placeholder="Filter by date"
              />
            </div>

            <div className="appointments-status-filter">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="appointments-status-select"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <button className="appointments-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="appointments-summary">
          <p>Showing {filteredAppointments.length} of {filterAppointmentsByUser(appointments).length} appointments assigned to you</p>
          {(searchTerm || dateFilter || statusFilter) && (
            <p className="appointments-filter-info">Filters applied</p>
          )}
        </div>

        {/* Appointments Table */}
        <div className="appointments-table-container">
          {currentItems.length > 0 ? (
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((appointment) => (
                  <tr key={appointment.id} className="appointments-table-row">
                    <td className="appointments-customer">
                      <div className="appointments-customer-info">
                        <span className="appointments-customer-name">
                          {appointment.customerName || 'N/A'}
                        </span>
                        <span className="appointments-customer-email">
                          {appointment.customerEmail || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="appointments-contact">
                      <span className="appointments-phone">
                        {appointment.customerPhone || 'N/A'}
                      </span>
                    </td>
                    <td className="appointments-datetime">
                      <div className="appointments-datetime-info">
                        <span className="appointments-date">
                          {formatDate(appointment.date)}
                        </span>
                        <span className="appointments-time">
                          {formatTime(appointment.time)}
                        </span>
                      </div>
                    </td>
                    <td className="appointments-type">
                      <span className="appointments-type-badge">
                        {appointment.appointmentType || 'N/A'}
                      </span>
                    </td>
                    <td className="appointments-assigned">
                      <span className="appointments-employee">
                        {getEmployeeName(appointment.assignedTo)}
                      </span>
                    </td>
                    <td className="appointments-status">
                      <span 
                        className="appointments-status-badge"
                        style={{ 
                          backgroundColor: `${statusColors[appointment.status] || '#6b7280'}20`,
                          color: statusColors[appointment.status] || '#6b7280',
                          border: `1px solid ${statusColors[appointment.status] || '#6b7280'}40`
                        }}
                      >
                        {appointment.status || 'N/A'}
                      </span>
                    </td>
                    <td className="appointments-actions">
                      <div className="appointments-action-buttons">
                        <button
                          className="appointments-edit-btn"
                          onClick={() => handleEditAppointment(appointment)}
                          title="Edit Appointment"
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
            <div className="appointments-empty">
              <div className="appointments-empty-icon">📅</div>
              <h3>No appointments found</h3>
              <p>
                {searchTerm || dateFilter || statusFilter
                  ? "Try adjusting your search criteria or filters"
                  : "You don't have any appointments assigned to you yet"}
              </p>
              {!searchTerm && !dateFilter && !statusFilter && (
                <button 
                  className="appointments-empty-add-btn"
                  onClick={() => navigate('/addappointment')}
                >
                  <Plus /> Add New Appointment
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="appointments-pagination">
            <button
              className="appointments-page-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft />
            </button>
            
            <div className="appointments-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`appointments-page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              className="appointments-page-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointment && (
        <div className="appointments-edit-modal">
          <div className="appointments-edit-overlay" onClick={closeEditModal}></div>
          <div className="appointments-edit-content">
            <div className="appointments-edit-header">
              <h2>Edit Appointment</h2>
              <button 
                className="appointments-edit-close-btn" 
                onClick={closeEditModal}
              >
                <X />
              </button>
            </div>

            <div className="appointments-edit-form">
              <div className="appointments-edit-form-row">
                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-customerName">
                    <User className="appointments-form-icon" />
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="edit-customerName"
                    name="customerName"
                    value={editFormData.customerName}
                    onChange={handleEditFormChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-customerEmail">
                    <Mail className="appointments-form-icon" />
                    Customer Email
                  </label>
                  <input
                    type="email"
                    id="edit-customerEmail"
                    name="customerEmail"
                    value={editFormData.customerEmail}
                    onChange={handleEditFormChange}
                    placeholder="Enter customer email"
                  />
                </div>
              </div>

              <div className="appointments-edit-form-row">
                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-customerPhone">
                    <Phone className="appointments-form-icon" />
                    Customer Phone *
                  </label>
                  <input
                    type="tel"
                    id="edit-customerPhone"
                    name="customerPhone"
                    value={editFormData.customerPhone}
                    onChange={handleEditFormChange}
                    placeholder="Enter customer phone"
                    required
                  />
                </div>

                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-appointmentType">
                    <Briefcase className="appointments-form-icon" />
                    Appointment Type *
                  </label>
                  <select
                    id="edit-appointmentType"
                    name="appointmentType"
                    value={editFormData.appointmentType}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="">Select appointment type</option>
                    {appointmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="appointments-edit-form-row">
                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-date">
                    <Calendar className="appointments-form-icon" />
                    Date *
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    name="date"
                    value={editFormData.date}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>

                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-time">
                    <Calendar className="appointments-form-icon" />
                    Time *
                  </label>
                  <select
                    id="edit-time"
                    name="time"
                    value={editFormData.time}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="">Select time slot</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="appointments-edit-form-row">
                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-assignedTo">
                    <Users className="appointments-form-icon" />
                    Assigned To *
                  </label>
                  <select
                    id="edit-assignedTo"
                    name="assignedTo"
                    value={editFormData.assignedTo}
                    onChange={handleEditFormChange}
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name || employee.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="appointments-edit-form-group">
                  <label htmlFor="edit-status">
                    <Briefcase className="appointments-form-icon" />
                    Status *
                  </label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditFormChange}
                    required
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="appointments-edit-form-group full-width">
                <label htmlFor="edit-customerAddress">
                  <MapPin className="appointments-form-icon" />
                  Customer Address
                </label>
                <textarea
                  id="edit-customerAddress"
                  name="customerAddress"
                  value={editFormData.customerAddress}
                  onChange={handleEditFormChange}
                  placeholder="Enter customer address"
                  rows="3"
                />
              </div>

              <div className="appointments-edit-form-group full-width">
                <label htmlFor="edit-notes">
                  <Briefcase className="appointments-form-icon" />
                  Additional Notes
                </label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditFormChange}
                  placeholder="Any additional notes"
                  rows="3"
                />
              </div>

              <div className="appointments-edit-actions">
                <button
                  className="appointments-save-btn"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="appointments-btn-loader"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="appointments-btn-icon" />
                      Update Appointment
                    </>
                  )}
                </button>
                <button
                  className="appointments-cancel-btn"
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

export default Appointments