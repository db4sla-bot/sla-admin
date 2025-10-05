import React, { useState, useEffect } from 'react'
import './AddAppointment.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Calendar, User, Mail, Phone, MapPin, Briefcase, Users, Save, ChevronLeft, ChevronRight } from 'lucide-react'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'

const AddAppointment = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTime, setSelectedTime] = useState('')
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const [appointmentData, setAppointmentData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    appointmentType: '',
    assignedTo: '',
    date: '',
    time: '',
    status: 'New', // Changed default status
    notes: ''
  })

  // Appointment types
  const appointmentTypes = [
    'Installation',
    'Maintenance',
    'Repair',
    'Consultation',
    'Inspection',
    'Follow-up',
    'Other'
  ]

  // Status options
  const statusOptions = [
    'New',
    'In Progress', 
    'Done'
  ]

  // Time slots - 2 hour intervals from 9AM to 7PM
  const timeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00', 
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ]

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees()
  }, [])

  // Update appointment data when date or time changes
  useEffect(() => {
    setAppointmentData(prev => ({
      ...prev,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime
    }))
  }, [selectedDate, selectedTime])

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
      toast.error('Failed to load employees')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAppointmentData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
  }

  const handleSaveAppointment = async () => {
    // Validation
    if (!appointmentData.customerName.trim()) {
      toast.error('Customer name is required!')
      return
    }
    if (!appointmentData.customerPhone.trim()) {
      toast.error('Customer phone is required!')
      return
    }
    if (!appointmentData.appointmentType) {
      toast.error('Please select appointment type!')
      return
    }
    if (!appointmentData.assignedTo) {
      toast.error('Please assign to an employee!')
      return
    }
    if (!selectedTime) {
      toast.error('Please select appointment time!')
      return
    }

    setLoading(true)
    toast.info('Saving appointment...', { autoClose: 1000 })

    try {
      const appointmentToSave = {
        ...appointmentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'Appointments'), appointmentToSave)
      
      toast.success('Appointment created successfully!')
      
      // Reset form
      setAppointmentData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        appointmentType: '',
        assignedTo: '',
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        status: 'Scheduled',
        notes: ''
      })
      
      setSelectedTime('')
      
    } catch (error) {
      console.error('Error saving appointment:', error)
      toast.error('Failed to save appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + direction)
    setCurrentMonth(newMonth)
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    const today = new Date()

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isPast = date < today.setHours(0, 0, 0, 0)
      
      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''} ${isPast ? 'past' : ''}`}
          onClick={() => !isPast && handleDateClick(date)}
        >
          {day}
        </div>
      )
    }

    return days
  }

  return (
    <>
      {/* Top Bar */}
      <div className="appointment-top-bar-container">
        <Hamburger />
        <div className="appointment-breadcrumps-container">
          <h1>Appointment</h1>
        </div>
        <div className="appointment-actions-container">
          {/* Actions can be added here if needed */}
        </div>
      </div>

      <div className="add-appointment-container">
        {/* Header */}
        <div className="appointment-header">
          <h1>Schedule New Appointment</h1>
          <p>Select date and time, then fill customer details</p>
        </div>

        <div className="appointment-main-content">
          {/* Left Side - Calendar */}
          <div className="calendar-section">
            <div className="calendar-header">
              <button 
                className="calendar-nav-btn" 
                onClick={() => navigateMonth(-1)}
              >
                <ChevronLeft />
              </button>
              <h3>
                {currentMonth.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <button 
                className="calendar-nav-btn" 
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight />
              </button>
            </div>

            <div className="calendar-grid">
              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-weekday">{day}</div>
                ))}
              </div>
              <div className="calendar-days">
                {renderCalendar()}
              </div>
            </div>

            {/* Selected Date Display */}
            <div className="selected-date-display">
              <Calendar className="calendar-icon" />
              <div>
                <p className="selected-date-label">Selected Date</p>
                <p className="selected-date-value">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Time Slots */}
            <div className="time-slots-section">
              <h4>Select Time</h4>
              <div className="time-slots-grid">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Customer Details Form */}
          <div className="customer-details-section">
            <div className="form-header">
              <h3>Customer Details</h3>
              <p>Fill in the appointment information</p>
            </div>

            <div className="appointment-form">
              <div className="form-group">
                <label htmlFor="customerName">
                  <User className="form-icon" />
                  Customer Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={appointmentData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerEmail">
                  <Mail className="form-icon" />
                  Customer Email
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={appointmentData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="Enter customer email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerPhone">
                  <Phone className="form-icon" />
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={appointmentData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Enter customer phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customerAddress">
                  <MapPin className="form-icon" />
                  Customer Address
                </label>
                <textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={appointmentData.customerAddress}
                  onChange={handleInputChange}
                  placeholder="Enter customer address"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="appointmentType">
                  <Briefcase className="form-icon" />
                  Appointment Type *
                </label>
                <select
                  id="appointmentType"
                  name="appointmentType"
                  value={appointmentData.appointmentType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select appointment type</option>
                  {appointmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">
                  <Users className="form-icon" />
                  Assigned To *
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={appointmentData.assignedTo}
                  onChange={handleInputChange}
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

              <div className="form-group">
                <label htmlFor="status">
                  <Briefcase className="form-icon" />
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={appointmentData.status}
                  onChange={handleInputChange}
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">
                  <Briefcase className="form-icon" />
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={appointmentData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes or requirements"
                  rows="3"
                />
              </div>

              {/* Appointment Summary */}
              <div className="appointment-summary">
                <h4>Appointment Summary</h4>
                <div className="summary-item">
                  <span className="summary-label">Date:</span>
                  <span className="summary-value">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Time:</span>
                  <span className="summary-value">{selectedTime || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Type:</span>
                  <span className="summary-value">{appointmentData.appointmentType || 'Not selected'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Status:</span>
                  <span className="summary-value">{appointmentData.status}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Assigned:</span>
                  <span className="summary-value">
                    {appointmentData.assignedTo ? 
                      employees.find(emp => emp.id === appointmentData.assignedTo)?.name || 
                      employees.find(emp => emp.id === appointmentData.assignedTo)?.email || 
                      'Selected Employee'
                      : 'Not assigned'
                    }
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <button
                className="save-appointment-btn"
                onClick={handleSaveAppointment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="btn-loader"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="btn-icon" />
                    Schedule Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddAppointment