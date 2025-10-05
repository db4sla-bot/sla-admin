import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../Firebase";
import './EmployeeDetails.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Plus, SquarePen, User, Save, X } from "lucide-react";

const EmployeeDetails = () => {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

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

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const docRef = doc(db, "Employees", employeeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmployee(docSnap.data());
        } else {
          console.log("No such employee!");
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
      }
    };

    fetchEmployee();
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

  // Handlers for edit/save/cancel
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

  const handleSaveProfile = async () => {
    setLoadingProfile(true);
    await updateDoc(doc(db, "Employees", employeeId), profileForm);
    setEmployee(prev => ({ ...prev, ...profileForm }));
    setEditProfile(false);
    setLoadingProfile(false);
  };
  const handleSaveBank = async () => {
    setLoadingBank(true);
    await updateDoc(doc(db, "Employees", employeeId), bankForm);
    setEmployee(prev => ({ ...prev, ...bankForm }));
    setEditBank(false);
    setLoadingBank(false);
  };
  const handleSaveAdditional = async () => {
    setLoadingAdditional(true);
    await updateDoc(doc(db, "Employees", employeeId), additionalForm);
    setEmployee(prev => ({ ...prev, ...additionalForm }));
    setEditAdditional(false);
    setLoadingAdditional(false);
  };

  if (!employee) return <p>Loading...</p>;

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
              className={`employee-tab-button ${activeTab === 'activity' ? 'employee-tab-active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              📊 Activity
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

          {/* Activity Tab Content */}
          <div className={`employee-tab-content ${activeTab !== 'activity' ? 'employee-tab-hidden' : ''}`}>
            <div className="employee-section-header">
              <h2 className="employee-section-title activity-section">Activity Timeline</h2>
            </div>

            <div className="employee-activity-empty">
              <div className="employee-activity-empty-icon">📊</div>
              <div className="employee-activity-empty-title">No Activity Yet</div>
              <div className="employee-activity-empty-text">Employee activity timeline will appear here when available.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeDetails;
