import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../Firebase";
import './EmployeeDetails.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Plus, SquarePen, User, Save, X, Calendar, CreditCard, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

const EmployeeDetails = () => {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, bank, additional, advances

  // Edit states for each section
  const [editProfile, setEditProfile] = useState(false);
  const [editBank, setEditBank] = useState(false);
  const [editAdditional, setEditAdditional] = useState(false);

  // Form states for each section
  const [profileForm, setProfileForm] = useState({});
  const [bankForm, setBankForm] = useState({});
  const [additionalForm, setAdditionalForm] = useState({});

  // Loading states for each section
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingBank, setLoadingBank] = useState(false);
  const [loadingAdditional, setLoadingAdditional] = useState(false);

  // Advance States
  const [advances, setAdvances] = useState([])
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showClearanceModal, setShowClearanceModal] = useState(false)
  const [selectedAdvance, setSelectedAdvance] = useState(null)
  const [savingAdvance, setSavingAdvance] = useState(false)
  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    paymentMethod: 'Cash',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [clearanceForm, setClearanceForm] = useState({
    clearanceAmount: '',
    paymentMethod: 'Salary Deduction',
    clearanceDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const paymentMethods = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other']
  const clearanceMethods = ['Salary Deduction', 'Cash Return', 'Bank Transfer', 'UPI', 'Other']
  const advanceReasons = [
    'Medical Emergency',
    'Personal Emergency', 
    'Family Function',
    'Education',
    'Home Repair',
    'Vehicle Repair',
    'Festival',
    'Other'
  ]

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const docRef = doc(db, "Employees", employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployee(docSnap.data());
        } else {
          console.log("No such employee!");
          toast.error("Employee not found!");
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
        toast.error("Failed to load employee details");
      }
    };

    if (employeeId) {
      fetchEmployee();
      fetchAdvanceRecords();
    }
  }, [employeeId]);

  useEffect(() => {
    if (employee) {
      setProfileForm({
        name: employee.name || "",
        phone: employee.phone || "",
        email: employee.email || "",
        username: employee.username || "",
        password: employee.password || "",
        designation: employee.designation || "",
      });
      setBankForm({
        bankName: employee.bankName || "",
        accountNumber: employee.accountNumber || "",
        ifscCode: employee.ifscCode || "",
        phonepeNumber: employee.phonepeNumber || "",
        upiId: employee.upiId || "",
      });
      setAdditionalForm({
        dob: employee.dob || "",
        maritalStatus: employee.maritalStatus || "",
        address: employee.address || "",
        city: employee.city || "",
        state: employee.state || "",
        country: employee.country || "",
      });
    }
  }, [employee]);

  const fetchAdvanceRecords = async () => {
    try {
      console.log('Fetching advances for employee:', employeeId)
      
      const advancesRef = collection(db, "EmployeeAdvances")
      const q = query(
        advancesRef, 
        where("employeeId", "==", employeeId)
      )
      
      const querySnapshot = await getDocs(q)
      console.log('Query snapshot size:', querySnapshot.size)
      
      const advancesList = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data
        }
      })
      
      // Sort manually by createdAt in descending order
      advancesList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0)
        const dateB = new Date(b.createdAt || 0)
        return dateB - dateA
      })
      
      setAdvances(advancesList)
      
    } catch (error) {
      console.error("Detailed error fetching advance records:", error)
      setAdvances([])
      
      if (error.code === 'failed-precondition') {
        toast.error("Database index required. Please contact administrator.")
      } else if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check access permissions.")
      } else {
        toast.error(`Failed to load advance records: ${error.message}`)
      }
    }
  }

  const calculateAdvanceTotals = () => {
    let totalTaken = 0
    let totalCleared = 0
    let pendingAmount = 0

    advances.forEach(advance => {
      totalTaken += advance.amount || 0
      totalCleared += advance.clearedAmount || 0
      
      if (advance.status !== 'Cleared') {
        pendingAmount += (advance.amount || 0) - (advance.clearedAmount || 0)
      }
    })

    return {
      totalTaken,
      totalCleared,
      pendingAmount
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankForm(prev => ({ ...prev, [name]: value }));
  };
  const handleAdditionalChange = (e) => {
    const { name, value } = e.target;
    setAdditionalForm(prev => ({ ...prev, [name]: value }));
  };
  const handleAdvanceFormChange = (e) => {
    const { name, value } = e.target
    setAdvanceForm(prev => ({
      ...prev,
      [name]: value
    }))
  }
  const handleClearanceFormChange = (e) => {
    const { name, value } = e.target
    setClearanceForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    try {
      await updateDoc(doc(db, "Employees", employeeId), profileForm);
      setEmployee(prev => ({ ...prev, ...profileForm }));
      setEditProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };
  const handleSaveBank = async () => {
    setLoadingBank(true);
    try {
      await updateDoc(doc(db, "Employees", employeeId), bankForm);
      setEmployee(prev => ({ ...prev, ...bankForm }));
      setEditBank(false);
      toast.success("Bank details updated successfully!");
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast.error("Failed to update bank details");
    } finally {
      setLoadingBank(false);
    }
  };
  const handleSaveAdditional = async () => {
    setLoadingAdditional(true);
    try {
      await updateDoc(doc(db, "Employees", employeeId), additionalForm);
      setEmployee(prev => ({ ...prev, ...additionalForm }));
      setEditAdditional(false);
      toast.success("Additional details updated successfully!");
    } catch (error) {
      console.error("Error updating additional details:", error);
      toast.error("Failed to update additional details");
    } finally {
      setLoadingAdditional(false);
    }
  };
  const handleAddAdvance = async (e) => {
    e.preventDefault()

    // Validation
    if (!advanceForm.amount || advanceForm.amount <= 0) {
      toast.error('Please enter a valid advance amount!')
      return
    }
    if (!advanceForm.reason.trim()) {
      toast.error('Please provide a reason for advance!')
      return
    }
    if (!advanceForm.date) {
      toast.error('Please select a date!')
      return
    }

    setSavingAdvance(true)
    toast.info('Adding advance record...', { autoClose: 1000 })

    try {
      const advanceData = {
        employeeId: employeeId,
        employeeName: employee?.name || '',
        amount: parseFloat(advanceForm.amount),
        paymentMethod: advanceForm.paymentMethod,
        reason: advanceForm.reason,
        date: advanceForm.date,
        notes: advanceForm.notes.trim(),
        status: 'Active',
        clearedAmount: 0,
        clearanceHistory: [],
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      }

      const docRef = await addDoc(collection(db, "EmployeeAdvances"), advanceData)
      
      toast.success('Advance added successfully!')
      setShowAdvanceModal(false)
      setAdvanceForm({
        amount: '',
        paymentMethod: 'Cash',
        reason: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      setTimeout(() => {
        fetchAdvanceRecords()
      }, 1000)
      
    } catch (error) {
      console.error('Error adding advance:', error)
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check access permissions.')
      } else {
        toast.error(`Failed to add advance: ${error.message}`)
      }
    } finally {
      setSavingAdvance(false)
    }
  }
  const handleClearAdvance = async (e) => {
    e.preventDefault()

    const clearanceAmount = parseFloat(clearanceForm.clearanceAmount)
    const remainingAmount = selectedAdvance.amount - selectedAdvance.clearedAmount

    // Validation
    if (!clearanceAmount || clearanceAmount <= 0) {
      toast.error('Please enter a valid clearance amount!')
      return
    }
    if (clearanceAmount > remainingAmount) {
      toast.error(`Clearance amount cannot exceed pending amount of ₹${remainingAmount}!`)
      return
    }

    setSavingAdvance(true)
    toast.info('Processing advance clearance...', { autoClose: 1000 })

    try {
      const newClearedAmount = selectedAdvance.clearedAmount + clearanceAmount
      const newStatus = newClearedAmount >= selectedAdvance.amount ? 'Cleared' : 'Partially Cleared'
      
      const clearanceRecord = {
        amount: clearanceAmount,
        paymentMethod: clearanceForm.paymentMethod,
        date: clearanceForm.clearanceDate,
        notes: clearanceForm.notes.trim(),
        clearedAt: new Date().toISOString(),
        clearedBy: 'Admin'
      }

      const updatedData = {
        clearedAmount: newClearedAmount,
        status: newStatus,
        clearanceHistory: [...(selectedAdvance.clearanceHistory || []), clearanceRecord],
        lastClearedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, "EmployeeAdvances", selectedAdvance.id), updatedData)
      
      toast.success('Advance clearance processed successfully!')
      setShowClearanceModal(false)
      setSelectedAdvance(null)
      setClearanceForm({
        clearanceAmount: '',
        paymentMethod: 'Salary Deduction',
        clearanceDate: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      setTimeout(() => {
        fetchAdvanceRecords()
      }, 1000)
      
    } catch (error) {
      console.error('Error clearing advance:', error)
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please check access permissions.')
      } else {
        toast.error(`Failed to process clearance: ${error.message}`)
      }
    } finally {
      setSavingAdvance(false)
    }
  }

  const openClearanceModal = (advance) => {
    setSelectedAdvance(advance)
    const remainingAmount = advance.amount - advance.clearedAmount
    setClearanceForm(prev => ({
      ...prev,
      clearanceAmount: remainingAmount.toString()
    }))
    setShowClearanceModal(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#f59e0b'
      case 'Partially Cleared': return '#3b82f6'
      case 'Cleared': return '#10b981'
      default: return '#6b7280'
    }
  }

  if (!employee) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Loading...</h1>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div className="emp-loading-spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1>{employee.name}</h1>
        </div>
      </div>

      <div className="employee-details-main-container">
        {/* Enhanced Sidebar */}
        <div className="employee-profile-sidebar">
          <div className="employee-profile-avatar">
            {employee.name ? employee.name.charAt(0).toUpperCase() : <User className="icon" />}
          </div>
          <div className="employee-profile-name">{employee.name}</div>
          <div className="employee-profile-email">{employee.email}</div>

          <div className="employee-quick-info">
            <div className="employee-quick-info-item">
              <span className="employee-quick-info-label">Experience</span>
              <span className="employee-quick-info-value">{employee.yearsExperience || 0}yr</span>
            </div>
            <div className="employee-quick-info-item">
              <span className="employee-quick-info-label">Status</span>
              <span className="employee-quick-info-value" style={{
                background: employee.status === 'Active' ? '#dcfce7' : '#fee2e2',
                color: employee.status === 'Active' ? '#15803d' : '#dc2626'
              }}>
                {employee.status || 'Unknown'}
              </span>
            </div>
            <div className="employee-quick-info-item">
              <span className="employee-quick-info-label">Role</span>
              <span className="employee-quick-info-value">{employee.designation || 'Not Set'}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Content Area */}
        <div className="employee-content-area">
          <div className="employee-tabs-navigation">
            <button 
              className={`employee-tab-button ${activeTab === 'profile' ? 'employee-tab-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button 
              className={`employee-tab-button ${activeTab === 'bank' ? 'employee-tab-active' : ''}`}
              onClick={() => setActiveTab('bank')}
            >
              🏦 Bank Details
            </button>
            <button 
              className={`employee-tab-button ${activeTab === 'additional' ? 'employee-tab-active' : ''}`}
              onClick={() => setActiveTab('additional')}
            >
              📋 Additional
            </button>
            <button 
              className={`employee-tab-button ${activeTab === 'advances' ? 'employee-tab-active' : ''}`}
              onClick={() => setActiveTab('advances')}
            >
              📊 Advances
            </button>
          </div>

          {/* Profile Tab Content */}
          <div className={`employee-tab-content ${activeTab !== 'profile' ? 'employee-tab-hidden' : ''}`}>
            <div className="employee-section-header">
              <h2 className="employee-section-title">Profile Information</h2>
              {!editProfile && (
                <button className="employee-edit-button" onClick={() => setEditProfile(true)}>
                  <SquarePen className="icon" /> Edit Profile
                </button>
              )}
            </div>

            <div className="employee-details-grid">
              <div className="employee-detail-card">
                <label className="employee-detail-label">Full Name</label>
                {editProfile ? (
                  <input 
                    className="employee-detail-input" 
                    name="name" 
                    value={profileForm.name} 
                    onChange={handleProfileChange} 
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.name || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Mobile Number</label>
                {editProfile ? (
                  <input 
                    className="employee-detail-input" 
                    name="phone" 
                    value={profileForm.phone} 
                    onChange={handleProfileChange}
                    placeholder="Enter mobile number"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.phone || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Email Address</label>
                {editProfile ? (
                  <input 
                    className="employee-detail-input" 
                    name="email" 
                    value={profileForm.email} 
                    onChange={handleProfileChange}
                    placeholder="Enter email address"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.email || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Username</label>
                {editProfile ? (
                  <input 
                    className="employee-detail-input" 
                    name="username" 
                    value={profileForm.username} 
                    onChange={handleProfileChange}
                    placeholder="Enter username"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.username || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Password</label>
                {editProfile ? (
                  <input 
                    className="employee-detail-input" 
                    name="password" 
                    type="password"
                    value={profileForm.password} 
                    onChange={handleProfileChange}
                    placeholder="Enter password"
                  />
                ) : (
                  <div className="employee-detail-value">••••••••</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Designation</label>
                {editProfile ? (
                  <input 
                    className="employee-detail-input" 
                    name="designation" 
                    value={profileForm.designation} 
                    onChange={handleProfileChange}
                    placeholder="Enter designation"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.designation || 'Not provided'}</div>
                )}
              </div>
            </div>

            {editProfile && (
              <div className="employee-action-buttons">
                <button className="employee-save-button" onClick={handleSaveProfile} disabled={loadingProfile}>
                  {loadingProfile ? <span className="employee-loading-spinner"></span> : <Save className="icon" />}
                  Save Changes
                </button>
                <button className="employee-cancel-button" onClick={() => setEditProfile(false)} disabled={loadingProfile}>
                  <X className="icon" /> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Bank Details Tab Content */}
          <div className={`employee-tab-content ${activeTab !== 'bank' ? 'employee-tab-hidden' : ''}`}>
            <div className="employee-section-header">
              <h2 className="employee-section-title bank-section">Bank Information</h2>
              {!editBank && (
                <button className="employee-edit-button" onClick={() => setEditBank(true)}>
                  <SquarePen className="icon" /> Edit Bank Details
                </button>
              )}
            </div>

            <div className="employee-details-grid">
              <div className="employee-detail-card">
                <label className="employee-detail-label">Bank Name</label>
                {editBank ? (
                  <input 
                    className="employee-detail-input" 
                    name="bankName" 
                    value={bankForm.bankName} 
                    onChange={handleBankChange}
                    placeholder="Enter bank name"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.bankName || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Account Number</label>
                {editBank ? (
                  <input 
                    className="employee-detail-input" 
                    name="accountNumber" 
                    value={bankForm.accountNumber} 
                    onChange={handleBankChange}
                    placeholder="Enter account number"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.accountNumber || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">IFSC Code</label>
                {editBank ? (
                  <input 
                    className="employee-detail-input" 
                    name="ifscCode" 
                    value={bankForm.ifscCode} 
                    onChange={handleBankChange}
                    placeholder="Enter IFSC code"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.ifscCode || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">PhonePe Number</label>
                {editBank ? (
                  <input 
                    className="employee-detail-input" 
                    name="phonepeNumber" 
                    value={bankForm.phonepeNumber} 
                    onChange={handleBankChange}
                    placeholder="Enter PhonePe number"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.phonepeNumber || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">UPI ID</label>
                {editBank ? (
                  <input 
                    className="employee-detail-input" 
                    name="upiId" 
                    value={bankForm.upiId} 
                    onChange={handleBankChange}
                    placeholder="Enter UPI ID"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.upiId || 'Not provided'}</div>
                )}
              </div>
            </div>

            {editBank && (
              <div className="employee-action-buttons">
                <button className="employee-save-button" onClick={handleSaveBank} disabled={loadingBank}>
                  {loadingBank ? <span className="employee-loading-spinner"></span> : <Save className="icon" />}
                  Save Changes
                </button>
                <button className="employee-cancel-button" onClick={() => setEditBank(false)} disabled={loadingBank}>
                  <X className="icon" /> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Additional Details Tab Content */}
          <div className={`employee-tab-content ${activeTab !== 'additional' ? 'employee-tab-hidden' : ''}`}>
            <div className="employee-section-header">
              <h2 className="employee-section-title additional-section">Additional Information</h2>
              {!editAdditional && (
                <button className="employee-edit-button" onClick={() => setEditAdditional(true)}>
                  <SquarePen className="icon" /> Edit Additional Details
                </button>
              )}
            </div>

            <div className="employee-details-grid">
              <div className="employee-detail-card">
                <label className="employee-detail-label">Date of Birth</label>
                {editAdditional ? (
                  <input 
                    className="employee-detail-input" 
                    name="dob" 
                    type="date"
                    value={additionalForm.dob} 
                    onChange={handleAdditionalChange}
                  />
                ) : (
                  <div className="employee-detail-value">{employee.dob || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Marital Status</label>
                {editAdditional ? (
                  <input 
                    className="employee-detail-input" 
                    name="maritalStatus" 
                    value={additionalForm.maritalStatus} 
                    onChange={handleAdditionalChange}
                    placeholder="Enter marital status"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.maritalStatus || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Address</label>
                {editAdditional ? (
                  <input 
                    className="employee-detail-input" 
                    name="address" 
                    value={additionalForm.address} 
                    onChange={handleAdditionalChange}
                    placeholder="Enter address"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.address || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">City</label>
                {editAdditional ? (
                  <input 
                    className="employee-detail-input" 
                    name="city" 
                    value={additionalForm.city} 
                    onChange={handleAdditionalChange}
                    placeholder="Enter city"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.city || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">State</label>
                {editAdditional ? (
                  <input 
                    className="employee-detail-input" 
                    name="state" 
                    value={additionalForm.state} 
                    onChange={handleAdditionalChange}
                    placeholder="Enter state"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.state || 'Not provided'}</div>
                )}
              </div>

              <div className="employee-detail-card">
                <label className="employee-detail-label">Country</label>
                {editAdditional ? (
                  <input 
                    className="employee-detail-input" 
                    name="country" 
                    value={additionalForm.country} 
                    onChange={handleAdditionalChange}
                    placeholder="Enter country"
                  />
                ) : (
                  <div className="employee-detail-value">{employee.country || 'Not provided'}</div>
                )}
              </div>
            </div>

            {editAdditional && (
              <div className="employee-action-buttons">
                <button className="employee-save-button" onClick={handleSaveAdditional} disabled={loadingAdditional}>
                  {loadingAdditional ? <span className="employee-loading-spinner"></span> : <Save className="icon" />}
                  Save Changes
                </button>
                <button className="employee-cancel-button" onClick={() => setEditAdditional(false)} disabled={loadingAdditional}>
                  <X className="icon" /> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Advances Tab Content */}
          <div className={`employee-tab-content ${activeTab !== 'advances' ? 'employee-tab-hidden' : ''}`}>
            <div className="employee-section-header">
              <h2 className="employee-section-title">Advances Management</h2>
              <button 
                className="employee-edit-button"
                onClick={() => setShowAdvanceModal(true)}
              >
                <Plus className="icon" /> Add Advance
              </button>
            </div>

            {/* Advance Summary Cards */}
            <div className="emp-advance-summary">
              <div className="emp-advance-card total">
                <div className="emp-advance-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="emp-advance-info">
                  <h3>Total Taken</h3>
                  <p>{formatCurrency(calculateAdvanceTotals().totalTaken)}</p>
                </div>
              </div>
              
              <div className="emp-advance-card cleared">
                <div className="emp-advance-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="emp-advance-info">
                  <h3>Total Cleared</h3>
                  <p>{formatCurrency(calculateAdvanceTotals().totalCleared)}</p>
                </div>
              </div>
              
              <div className="emp-advance-card pending">
                <div className="emp-advance-icon">
                  <AlertCircle size={24} />
                </div>
                <div className="emp-advance-info">
                  <h3>Pending Amount</h3>
                  <p>{formatCurrency(calculateAdvanceTotals().pendingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Advances List */}
            <div className="emp-advances-list">
              {advances.length === 0 ? (
                <div className="employee-activity-empty">
                  <div className="employee-activity-empty-icon">💰</div>
                  <div className="employee-activity-empty-title">No Advances Found</div>
                  <div className="employee-activity-empty-text">
                    Employee advance records will appear here. Click "Add Advance" to create the first advance.
                  </div>
                </div>
              ) : (
                advances.map((advance) => (
                  <div key={advance.id} className="emp-advance-item">
                    <div className="emp-advance-main">
                      <div className="emp-advance-details">
                        <div className="emp-advance-header-info">
                          <h4>₹{advance.amount?.toLocaleString()} - {advance.reason}</h4>
                          <span 
                            className="emp-advance-status"
                            style={{ backgroundColor: `${getStatusColor(advance.status)}20`, color: getStatusColor(advance.status) }}
                          >
                            {advance.status}
                          </span>
                        </div>
                        
                        <div className="emp-advance-meta">
                          <span className="emp-advance-date">
                            📅 {formatDate(advance.date)}
                          </span>
                          <span className="emp-advance-method">
                            💳 {advance.paymentMethod}
                          </span>
                          {advance.clearedAmount > 0 && (
                            <span className="emp-advance-cleared">
                              ✅ Cleared: ₹{advance.clearedAmount?.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {advance.notes && (
                          <div className="emp-advance-notes">
                            <strong>Notes:</strong> {advance.notes}
                          </div>
                        )}
                      </div>

                      <div className="emp-advance-actions">
                        {advance.status !== 'Cleared' && (
                          <button
                            className="emp-clear-advance-btn"
                            onClick={() => openClearanceModal(advance)}
                          >
                            Clear Amount
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clearance History */}
                    {advance.clearanceHistory && advance.clearanceHistory.length > 0 && (
                      <div className="emp-clearance-history">
                        <h5>Clearance History:</h5>
                        {advance.clearanceHistory.map((clearance, index) => (
                          <div key={index} className="emp-clearance-item">
                            <span className="emp-clearance-amount">
                              ₹{clearance.amount?.toLocaleString()}
                            </span>
                            <span className="emp-clearance-date">
                              {formatDate(clearance.date)}
                            </span>
                            <span className="emp-clearance-method">
                              via {clearance.paymentMethod}
                            </span>
                            {clearance.notes && (
                              <span className="emp-clearance-notes">
                                - {clearance.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Advance Modal */}
      {showAdvanceModal && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-content">
            <div className="emp-modal-header">
              <h3>Add New Advance</h3>
              <button 
                className="emp-modal-close"
                onClick={() => setShowAdvanceModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form className="emp-modal-form" onSubmit={handleAddAdvance}>
              <div className="emp-form-row">
                <div className="emp-form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={advanceForm.amount}
                    onChange={handleAdvanceFormChange}
                    placeholder="Enter advance amount"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div className="emp-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={advanceForm.date}
                    onChange={handleAdvanceFormChange}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-row">
                <div className="emp-form-group">
                  <label>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={advanceForm.paymentMethod}
                    onChange={handleAdvanceFormChange}
                    required
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div className="emp-form-group">
                  <label>Reason *</label>
                  <select
                    name="reason"
                    value={advanceForm.reason}
                    onChange={handleAdvanceFormChange}
                    required
                  >
                    <option value="">Select reason</option>
                    {advanceReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="emp-form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={advanceForm.notes}
                  onChange={handleAdvanceFormChange}
                  placeholder="Any additional notes..."
                  rows="3"
                />
              </div>

              <div className="emp-form-actions">
                <button 
                  type="button"
                  className="emp-cancel-btn"
                  onClick={() => setShowAdvanceModal(false)}
                  disabled={savingAdvance}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emp-save-btn"
                  disabled={savingAdvance}
                >
                  {savingAdvance ? (
                    <>
                      <div className="emp-loading-spinner"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Advance
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Advance Modal */}
      {showClearanceModal && selectedAdvance && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-content">
            <div className="emp-modal-header">
              <h3>Clear Advance Amount</h3>
              <button 
                className="emp-modal-close"
                onClick={() => setShowClearanceModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="emp-clearance-info">
              <div className="emp-clearance-summary">
                <p><strong>Original Amount:</strong> ₹{selectedAdvance.amount?.toLocaleString()}</p>
                <p><strong>Already Cleared:</strong> ₹{selectedAdvance.clearedAmount?.toLocaleString()}</p>
                <p><strong>Remaining Amount:</strong> ₹{(selectedAdvance.amount - selectedAdvance.clearedAmount)?.toLocaleString()}</p>
              </div>
            </div>

            <form className="emp-modal-form" onSubmit={handleClearAdvance}>
              <div className="emp-form-row">
                <div className="emp-form-group">
                  <label>Clearance Amount *</label>
                  <input
                    type="number"
                    name="clearanceAmount"
                    value={clearanceForm.clearanceAmount}
                    onChange={handleClearanceFormChange}
                    placeholder="Enter clearance amount"
                    min="0.01"
                    max={selectedAdvance.amount - selectedAdvance.clearedAmount}
                    step="0.01"
                    required
                  />
                </div>

                <div className="emp-form-group">
                  <label>Clearance Date *</label>
                  <input
                    type="date"
                    name="clearanceDate"
                    value={clearanceForm.clearanceDate}
                    onChange={handleClearanceFormChange}
                    required
                  />
                </div>
              </div>

              <div className="emp-form-group">
                <label>Clearance Method *</label>
                <select
                  name="paymentMethod"
                  value={clearanceForm.paymentMethod}
                  onChange={handleClearanceFormChange}
                  required
                >
                  {clearanceMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="emp-form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={clearanceForm.notes}
                  onChange={handleClearanceFormChange}
                  placeholder="Any additional notes about the clearance..."
                  rows="3"
                />
              </div>

              <div className="emp-form-actions">
                <button 
                  type="button"
                  className="emp-cancel-btn"
                  onClick={() => setShowClearanceModal(false)}
                  disabled={savingAdvance}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="emp-save-btn"
                  disabled={savingAdvance}
                >
                  {savingAdvance ? (
                    <>
                      <div className="emp-loading-spinner"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Clear Amount
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeDetails;
