import React, { useState, useEffect } from 'react'
import './Inbox.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Phone, Mail, Send, X, MessageSquare, Search, Users, PhoneCall } from 'lucide-react'
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../Firebase"
import { toast } from "react-toastify"

const Inbox = () => {
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  const colors = [
    "linear-gradient(135deg, #667eea, #764ba2)",
    "linear-gradient(135deg, #f093fb, #f5576c)",
    "linear-gradient(135deg, #4facfe, #00f2fe)",
    "linear-gradient(135deg, #43e97b, #38f9d7)",
    "linear-gradient(135deg, #fa709a, #fee140)",
    "linear-gradient(135deg, #a8edea, #fed6e3)",
    "linear-gradient(135deg, #ff9a9e, #fecfef)",
    "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  ]

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    const filtered = employees.filter(employee =>
      employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredEmployees(filtered)
  }, [searchTerm, employees])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "Employees"))
      const employeesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Sort employees by name and filter active ones
      const activeEmployees = employeesData
        .filter(emp => emp.status === 'Active')
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      
      setEmployees(activeEmployees)
      setFilteredEmployees(activeEmployees)
    } catch (error) {
      console.error("Error fetching employees:", error)
      toast.error("Failed to fetch employees")
    }
    setLoading(false)
  }

  const handlePhoneCall = (phoneNumber, employeeName) => {
    if (!phoneNumber) {
      toast.error("Phone number not available")
      return
    }
    
    // Create tel: link to initiate call
    const telLink = `tel:+91${phoneNumber}`
    window.open(telLink, '_self')
    toast.success(`Calling ${employeeName}...`)
  }

  const handleEmailClick = (employee) => {
    if (!employee.email) {
      toast.error("Email address not available")
      return
    }
    
    setSelectedEmployee(employee)
    setEmailData({
      subject: `Message from SLA Invisible Grills`,
      message: ''
    })
    setShowEmailModal(true)
  }

  const handleSendEmail = async () => {
    if (!emailData.message.trim()) {
      toast.error("Please enter a message")
      return
    }

    setSending(true)
    try {
      // Here you would typically integrate with an email service
      // For now, we'll create a mailto link as a fallback
      const mailtoLink = `mailto:${selectedEmployee.email}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.message)}&from=slainvisiblegrills@gmail.com`
      
      // Open default email client
      window.open(mailtoLink)
      
      toast.success(`Email opened in default client for ${selectedEmployee.name}`)
      setShowEmailModal(false)
      setEmailData({ subject: '', message: '' })
      setSelectedEmployee(null)
    } catch (error) {
      console.error("Error sending email:", error)
      toast.error("Failed to send email")
    }
    setSending(false)
  }

  const handleCloseModal = () => {
    setShowEmailModal(false)
    setSelectedEmployee(null)
    setEmailData({ subject: '', message: '' })
  }

  const getEmployeeInitials = (name) => {
    if (!name) return "?"

    const names = name.split(" ")
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }

    return name[0].toUpperCase()
  }

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
              Inbox
            </h1>
          </div>
        </div>
        <div className="inbox-loading">
          <div className="inbox-loading-spinner"></div>
          Loading employees...
        </div>
      </>
    )
  }

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
            <MessageSquare style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Communication Hub
          </h1>
        </div>
      </div>

      <div className="inbox-main-container">
        {/* Header Section */}
        <div className="inbox-header">
          <div className="inbox-header-content">
            <h2 className="inbox-title">Employee Directory</h2>
            <div className="inbox-stats">
              <div className="inbox-stat-badge">
                <Users size={16} />
                Total: {filteredEmployees.length}
              </div>
              <div className="inbox-stat-badge" style={{ background: '#22c55e' }}>
                <PhoneCall size={16} />
                Active: {employees.length}
              </div>
            </div>
          </div>
          
          <div className="inbox-search-section">
            <div className="inbox-search-wrapper">
              <input
                type="text"
                className="inbox-search-input"
                placeholder="🔍 Search employees by name, email or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="inbox-search-icon" />
            </div>
          </div>
        </div>

        {/* Employees Grid */}
        {filteredEmployees.length === 0 ? (
          <div className="inbox-empty-state">
            <div className="inbox-empty-icon">👥</div>
            <div className="inbox-empty-title">
              {searchTerm ? "No employees found" : "No active employees"}
            </div>
            <div className="inbox-empty-text">
              {searchTerm 
                ? `No employees match "${searchTerm}". Try a different search term.`
                : "No active employees available for communication."
              }
            </div>
          </div>
        ) : (
          <div className="inbox-employees-grid">
            {filteredEmployees.map((employee, index) => {
              const bgColor = colors[index % colors.length]
              const initials = getEmployeeInitials(employee.name)
              
              return (
                <div key={employee.id} className="inbox-employee-card">
                  <div className="inbox-employee-header">
                    <div className="inbox-employee-avatar" style={{ background: bgColor }}>
                      {initials}
                    </div>
                    <div className="inbox-employee-status">
                      <span className="inbox-status-indicator active"></span>
                      Active
                    </div>
                  </div>

                  <div className="inbox-employee-info">
                    <h3 className="inbox-employee-name">{employee.name || "Unnamed Employee"}</h3>
                    <p className="inbox-employee-designation">{employee.designation || "Not specified"}</p>
                    <p className="inbox-employee-email">{employee.email || "No email"}</p>
                    <p className="inbox-employee-phone">{employee.phone || "No phone"}</p>
                  </div>

                  <div className="inbox-employee-actions">
                    <button 
                      className="inbox-action-btn inbox-phone-btn"
                      onClick={() => handlePhoneCall(employee.phone, employee.name)}
                      disabled={!employee.phone}
                      title={`Call ${employee.name}`}
                    >
                      <Phone size={18} />
                      Call
                    </button>
                    <button 
                      className="inbox-action-btn inbox-email-btn"
                      onClick={() => handleEmailClick(employee)}
                      disabled={!employee.email}
                      title={`Send email to ${employee.name}`}
                    >
                      <Mail size={18} />
                      Email
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Email Modal */}
        {showEmailModal && selectedEmployee && (
          <div className="inbox-email-modal">
            <div className="inbox-email-overlay" onClick={handleCloseModal}></div>
            <div className="inbox-email-content">
              <div className="inbox-email-header">
                <div className="inbox-email-recipient">
                  <div className="inbox-recipient-avatar" style={{ 
                    background: colors[employees.findIndex(emp => emp.id === selectedEmployee.id) % colors.length] 
                  }}>
                    {getEmployeeInitials(selectedEmployee.name)}
                  </div>
                  <div className="inbox-recipient-info">
                    <h3>Send Email to {selectedEmployee.name}</h3>
                    <p>{selectedEmployee.email}</p>
                  </div>
                </div>
                <button className="inbox-email-close" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>

              <div className="inbox-email-form">
                <div className="inbox-form-group">
                  <label className="inbox-form-label">From:</label>
                  <input 
                    type="email" 
                    className="inbox-form-input" 
                    value="slainvisiblegrills@gmail.com" 
                    disabled 
                  />
                </div>

                <div className="inbox-form-group">
                  <label className="inbox-form-label">Subject:</label>
                  <input
                    type="text"
                    className="inbox-form-input"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject"
                  />
                </div>

                <div className="inbox-form-group">
                  <label className="inbox-form-label">Message:</label>
                  <textarea
                    className="inbox-form-textarea"
                    value={emailData.message}
                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your message here..."
                    rows={8}
                  />
                </div>

                <div className="inbox-email-actions">
                  <button 
                    className="inbox-send-btn"
                    onClick={handleSendEmail}
                    disabled={sending || !emailData.message.trim()}
                  >
                    {sending ? (
                      <>
                        <div className="inbox-loading-spinner small"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Email
                      </>
                    )}
                  </button>
                  <button className="inbox-cancel-btn" onClick={handleCloseModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Inbox