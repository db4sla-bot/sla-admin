// src/pages/Employees/AddEmployee.jsx
import React, { useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { NavLink } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Funnel,
  Link2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  User,
  Banknote,
  GraduationCap,
  Heart,
  Landmark,
  UserPlus,
} from "lucide-react";
import "./AddEmployee.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveEmployee } from "../../Scripts/EmployeeService";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "../../Firebase";
import { MenuItemsData } from "../../SLAData";

const AddEmployee = () => {
  const [status, setStatus] = useState("Select the Status");
  const [statusColor, setStatusColor] = useState("#3454d1");
  const [maritalStatus, setMaritalStatus] = useState("Select Marital Status");

  const [loading, setLoading] = useState(false);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMaritalDropdown, setShowMaritalDropdown] = useState(false);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    designation: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    country: "India",

    // Bank Information
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    phonepeNumber: "",
    upiId: "",

    // Qualification
    highestQualification: "",
    passedOutYear: "",
    yearsExperience: "",

    // Marital Status
    maritalStatus: "",

    // Aadhar Card
    aadharNumber: "", // Add Aadhar number field
  });

  const [access, setAccess] = useState([]); // array of selected ids

  const handleChange = (e) => {
    const { name, value } = e.target;

    // numeric only for phone, phonepe, and aadhar
    if (name === "phone" || name === "phonepeNumber" || name === "aadharNumber") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value, color) => {
    setStatus(value);
    setStatusColor(color);
    setShowStatusDropdown(false);
  };

  const handleMaritalChange = (value) => {
    setMaritalStatus(value);
    setFormData((prev) => ({ ...prev, maritalStatus: value })); // ✅ store in formData
    setShowMaritalDropdown(false);
  };

  const handleAccessSelect = (id) => {
    if (!access.includes(id)) {
      setAccess([...access, id]);
    }
  };

  const handleAccessRemove = (id) => {
    setAccess(access.filter((item) => item !== id));
  };

  const validateForm = () => {
    // Basic info
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) return "Invalid email";
    if (!formData.phone.trim()) return "Phone is required";
    if (!/^\d{10}$/.test(formData.phone)) return "Phone must be 10 digits";
    if (!formData.username.trim()) return "Username is required";
    if (!formData.password.trim()) return "Password is required";
    if (status === "Select the Status") return "Status is required";
    if (!formData.designation.trim()) return "Designation is required";

    // Additional info
    if (!formData.dob) return "Date of Birth is required";
    if (!formData.address.trim()) return "Address is required";
    if (!formData.city.trim()) return "City is required";
    if (!formData.state.trim()) return "State is required";
    if (!formData.maritalStatus.trim()) return "Marital Status is required";

    // Aadhar validation
    if (!formData.aadharNumber.trim()) return "Aadhar Card Number is required";
    if (!/^\d{12}$/.test(formData.aadharNumber)) return "Aadhar Card Number must be 12 digits";

    // Bank info
    if (!formData.bankName.trim()) return "Bank Name is required";
    if (!formData.accountNumber.trim()) return "Account Number is required";
    if (!/^\d{9,18}$/.test(formData.accountNumber)) return "Invalid Account Number";
    if (!formData.ifscCode.trim()) return "IFSC Code is required";
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode))
      return "Invalid IFSC Code format";
    if (!formData.phonepeNumber.trim()) return "PhonePe Number is required";
    if (!/^\d{10}$/.test(formData.phonepeNumber))
      return "PhonePe Number must be 10 digits";
    if (!formData.upiId.trim()) return "UPI ID is required";
    if (!/^[\w.-]+@[\w.-]+$/.test(formData.upiId)) return "Invalid UPI ID";

    // Qualification
    if (!formData.highestQualification.trim())
      return "Highest Qualification is required";
    if (!formData.passedOutYear.trim()) return "Passed Out Year is required";
    if (!/^\d{4}$/.test(formData.passedOutYear))
      return "Passed Out Year must be 4 digits";
    if (!formData.yearsExperience.trim())
      return "Number of Years Experience is required";
    if (isNaN(formData.yearsExperience) || formData.yearsExperience < 0)
      return "Invalid Years of Experience";

    return null;
  };

  const sendEmail = async (to, subject, message) => {
    try {
      const response = await fetch('https://sla-backend-seven.vercel.app/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          message
        })
      });

      if (!response.ok) {
        console.error('Failed to send email:', response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Save employee to Employees collection first
      const employeeData = {
        ...formData,
        status,
        statusColor,
        maritalStatus: formData.maritalStatus,
        access,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      const docRef = await addDoc(collection(db, "Employees"), employeeData);
      console.log("✅ Employee saved to database with ID:", docRef.id);

      // Step 2: Create Firebase user account
      toast.info('Creating user account...', { autoClose: 2000 });
      
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.username, 
          formData.password
        );
        
        const user = userCredential.user;
        console.log("✅ Firebase user created successfully:", user.uid);
        
        // Update employee document with Firebase UID
        await setDoc(doc(db, "Employees", docRef.id), {
          ...employeeData,
          firebaseUid: user.uid,
          userCreated: true
        });
        
        toast.success('User account created successfully!');
        
      } catch (authError) {
        console.error("❌ Error creating Firebase user:", authError);
        
        // Handle specific Firebase auth errors
        let errorMessage = 'Failed to create user account: ';
        switch (authError.code) {
          case 'auth/email-already-in-use':
            errorMessage += 'Email is already registered in the system';
            break;
          case 'auth/weak-password':
            errorMessage += 'Password should be at least 6 characters';
            break;
          case 'auth/invalid-email':
            errorMessage += 'Invalid email address format';
            break;
          default:
            errorMessage += authError.message;
        }
        
        toast.error(errorMessage);
        
        // Update employee record to indicate user creation failed
        await setDoc(doc(db, "Employees", docRef.id), {
          ...employeeData,
          userCreated: false,
          userCreationError: authError.message
        });
        
        // Don't return here - still send notification emails
      }

      // Step 3: Send emails regardless of user creation success/failure
      toast.info('Sending welcome emails...', { autoClose: 2000 });

      // Send welcome email to employee
      const welcomeSubject = "🎉 Welcome to SLA - Your Account Details";
      const welcomeMessage = `
Dear ${formData.name},

Welcome to SLA! We're excited to have you join our team.

Your employee account has been successfully created. Here are your login credentials:

✅ Account Details:
Username: ${formData.email}
Password: ${formData.password}
Employee ID: ${formData.username}
Department: ${formData.designation}
Designation: ${formData.designation}

🔐 Security Information:
- Please keep these credentials secure and confidential
- Change your password after your first login for enhanced security
- Never share your login credentials with anyone

📞 Need Help?
For any questions or assistance, please contact the HR department.

We look forward to working with you!

Best regards,
SLA Admin Team
      `.trim();

      // Send notification email to admin
      const adminSubject = "👤 New Employee Created - SLA Admin Notification";
      const adminMessage = `
A new employee has been successfully added to the SLA system.

📋 Employee Details:
- Name: ${formData.name}
- Email: ${formData.email}
- Employee ID: ${formData.username}
- Designation: ${formData.designation}
- Phone: ${formData.phone}
- Date Created: ${new Date().toLocaleDateString('en-IN')}

💼 Employment Information:
- Status: ${status}
- Bank: ${formData.bankName}
- Qualification: ${formData.highestQualification}
- Experience: ${formData.yearsExperience} years
- Marital Status: ${formData.maritalStatus}

🔐 Account Status:
- Employee Record: ✅ Created Successfully
- Firebase User Account: ${auth.currentUser ? '✅ Created Successfully' : '❌ Creation Failed'}
- Login Credentials: Sent to employee via email

The employee has been notified via email with their login credentials.

Best regards,
SLA System
      `.trim();

      // Send both emails (don't block the success flow if emails fail)
      Promise.all([
        sendEmail(formData.email, welcomeSubject, welcomeMessage),
        sendEmail('db4sla@gmail.com', adminSubject, adminMessage)
      ]).then(([employeeEmailSent, adminEmailSent]) => {
        if (employeeEmailSent) {
          toast.success('📧 Welcome email sent to employee!');
          console.log('✅ Welcome email sent to employee successfully');
        } else {
          toast.warning('⚠️ Employee created but welcome email failed to send');
          console.log('❌ Failed to send welcome email to employee');
        }

        if (adminEmailSent) {
          toast.success('📧 Admin notification sent!');
          console.log('✅ Notification email sent to admin successfully');
        } else {
          console.log('❌ Failed to send notification email to admin');
        }
      }).catch(emailError => {
        console.error('❌ Error in email sending process:', emailError);
        toast.warning('Employee created but some emails failed to send');
      });

      // Show main success message
      toast.success(`✅ Employee "${formData.name}" added successfully! 🎉`);

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        username: "",
        password: "",
        designation: "",
        dob: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        phonepeNumber: "",
        upiId: "",
        highestQualification: "",
        passedOutYear: "",
        yearsExperience: "",
        maritalStatus: "",
        aadharNumber: "",
      });
      setStatus("Select the Status");
      setStatusColor("#3454d1");
      setMaritalStatus("Select Marital Status");
      setAccess([]);

    } catch (err) {
      console.error("❌ Error in employee creation process:", err);
      toast.error(`❌ Error: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container d-none d-lg-flex">
          <h1>
            Add Employees
          </h1>
        </div>
        <button
          className="add-employee-button"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loader-spinner"></div>
              Saving...
            </>
          ) : (
            <>
              <UserPlus className="icon" />
              Add Employee
            </>
          )}
        </button>
      </div>

      <div className="routes-main-container">
        <form className="add-employee-container">
          <div className="heading-container">
            <h1>Employee Information :</h1>
          </div>

          {/* Name */}
          <div className="input-container">
            <p className="input-label">Name :</p>
            <div className="input-con">
              <div className="icon-con">
                <User className="icon" />
              </div>
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div className="input-container">
            <p className="input-label">Email :</p>
            <div className="input-con">
              <div className="icon-con">
                <Mail className="icon" />
              </div>
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="input-container">
            <p className="input-label">Phone :</p>
            <div className="input-con">
              <div className="icon-con">
                <Phone className="icon" />
              </div>
              <input
                type="text"
                placeholder="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
          </div>

          {/* Username */}
          <div className="input-container">
            <p className="input-label">Username :</p>
            <div className="input-con">
              <div className="icon-con">
                <Link2 className="icon" />
              </div>
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="input-container">
            <p className="input-label">Password :</p>
            <div className="input-con">
              <div className="icon-con">
                <LockKeyhole className="icon" />
              </div>
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Status */}
          <div className="dropdown-container">
            <p className="dropdownlabel">Status :</p>
            <div className="drop-down-container">
              <button
                type="button"
                className="dropdown-header"
                onClick={() => setShowStatusDropdown((s) => !s)}
              >
                <div className="label" style={{ background: statusColor }}></div>
                <div className="text">{status}</div>
                <ChevronDown className="icon" />
              </button>

              {showStatusDropdown && (
                <div className="dropdownlist employeeStatusDropdown">
                  <div
                    className="dropdown-list-item"
                    onClick={() => handleStatusChange("Active", "#17c666")}
                  >
                    <div className="label" style={{ background: "#17c666" }}></div>
                    <div className="text">Active</div>
                  </div>

                  <div
                    className="dropdown-list-item"
                    onClick={() => handleStatusChange("In Active", "#ea4d4d")}
                  >
                    <div className="label" style={{ background: "#ea4d4d" }}></div>
                    <div className="text">In Active</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Designation - Change from dropdown to input */}
          <div className="input-container">
            <p className="input-label">Designation :</p>
            <div className="input-con">
              <div className="icon-con">
                <User className="icon" />
              </div>
              <input
                type="text"
                placeholder="Enter designation (e.g., Sales Executive)"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Access Dropdown */}
          <div className="dropdown-container">
            <p className="dropdownlabel">Access :</p>
            <div className="drop-down-container">
              <button
                type="button"
                className="dropdown-header"
                onClick={() => setShowAccessDropdown((s) => !s)}
              >
                {/* Show selected as tags */}
                <div className="access-tags">
                  {access.length === 0 && (
                    <span className="access-placeholder">Select Access</span>
                  )}
                  {access.map((id) => {
                    // find main item only
                    let item = Object.values(MenuItemsData[0]).find(group => group.id === id);
                    return (
                      <span key={id} className="access-tag">
                        {item?.label}
                        <span
                          className="access-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccessRemove(id);
                          }}
                        >
                          ×
                        </span>
                      </span>
                    );
                  })}
                </div>
                <ChevronDown className="icon" />
              </button>
              {showAccessDropdown && (
                <div className="dropdownlist accessDropdown">
                  {Object.values(MenuItemsData[0]).map((group) => (
                    <div
                      key={group.id}
                      className={`dropdown-list-item${access.includes(group.id) ? " active" : ""}`}
                      onClick={() => handleAccessSelect(group.id)}
                    >
                      <div className="text">{group.label}</div>
                      {access.includes(group.id) && (
                        <span className="access-selected-check">✔</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <hr />
          <div className="heading-container">
            <h1>Bank Information :</h1>
          </div>

          {/* Bank Name */}
          <div className="input-container">
            <p className="input-label">Bank Name :</p>
            <div className="input-con">
              <div className="icon-con">
                <Landmark className="icon" />
              </div>
              <input
                type="text"
                placeholder="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Account Number */}
          <div className="input-container">
            <p className="input-label">Account Number :</p>
            <div className="input-con">
              <div className="icon-con">
                <Banknote className="icon" />
              </div>
              <input
                type="text"
                placeholder="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* IFSC Code */}
          <div className="input-container">
            <p className="input-label">IFSC Code :</p>
            <div className="input-con">
              <div className="icon-con">
                <Banknote className="icon" />
              </div>
              <input
                type="text"
                placeholder="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* PhonePe Number */}
          <div className="input-container">
            <p className="input-label">PhonePe Number :</p>
            <div className="input-con">
              <div className="icon-con">
                <Phone className="icon" />
              </div>
              <input
                type="text"
                placeholder="PhonePe Number"
                name="phonepeNumber"
                value={formData.phonepeNumber}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
          </div>

          {/* UPI ID */}
          <div className="input-container">
            <p className="input-label">UPI ID :</p>
            <div className="input-con">
              <div className="icon-con">
                <Banknote className="icon" />
              </div>
              <input
                type="text"
                placeholder="UPI ID"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr />
          <div className="heading-container">
            <h1>Qualification :</h1>
          </div>

          {/* Highest Qualification */}
          <div className="input-container">
            <p className="input-label">Highest Qualification :</p>
            <div className="input-con">
              <div className="icon-con">
                <GraduationCap className="icon" />
              </div>
              <input
                type="text"
                placeholder="Highest Qualification"
                name="highestQualification"
                value={formData.highestQualification}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Passed Out Year */}
          <div className="input-container">
            <p className="input-label">Passed Out Year :</p>
            <div className="input-con">
              <div className="icon-con">
                <Calendar className="icon" />
              </div>
              <input
                type="text"
                placeholder="YYYY"
                name="passedOutYear"
                value={formData.passedOutYear}
                onChange={handleChange}
                maxLength={4}
              />
            </div>
          </div>

          {/* Years Experience */}
          <div className="input-container">
            <p className="input-label">Years of Experience :</p>
            <div className="input-con">
              <div className="icon-con">
                <GraduationCap className="icon" />
              </div>
              <input
                type="number"
                placeholder="Years of Experience"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
              />
            </div>
          </div>

          <hr />
          <div className="heading-container">
            <h1>Additional Information :</h1>
          </div>

          {/* DOB */}
          <div className="input-container">
            <p className="input-label">Date of Birth :</p>
            <div className="input-con">
              <div className="icon-con">
                <Calendar className="icon" />
              </div>
              <input
                type="date"
                placeholder="Date of Birth"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Address */}
          <div className="input-container">
            <p className="input-label">Address :</p>
            <div className="input-con">
              <div className="icon-con">
                <MapPin className="icon" />
              </div>
              <input
                type="text"
                placeholder="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* City */}
          <div className="input-container">
            <p className="input-label">City :</p>
            <div className="input-con">
              <div className="icon-con">
                <MapPin className="icon" />
              </div>
              <input
                type="text"
                placeholder="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* State */}
          <div className="input-container">
            <p className="input-label">State :</p>
            <div className="input-con">
              <div className="icon-con">
                <MapPin className="icon" />
              </div>
              <input
                type="text"
                placeholder="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Country */}
          <div className="input-container">
            <p className="input-label">Country :</p>
            <div className="input-con">
              <div className="icon-con">
                <MapPin className="icon" />
              </div>
              <input
                type="text"
                placeholder="Country"
                name="country"
                value={formData.country}
                disabled
              />
            </div>
          </div>

          {/* Aadhar Card Number - New Field */}
          <div className="input-container">
            <p className="input-label">Aadhar Card Number :</p>
            <div className="input-con">
              <div className="icon-con">
                <User className="icon" />
              </div>
              <input
                type="text"
                placeholder="Enter 12-digit Aadhar Number"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                maxLength={12}
              />
            </div>
          </div>

          {/* Marital Status */}
          <div className="dropdown-container">
            <p className="dropdownlabel">Marital Status :</p>
            <div className="drop-down-container">
              <button
                type="button"
                className="dropdown-header"
                onClick={() => setShowMaritalDropdown((s) => !s)}
              >
                <div className="icon-con">
                  <Heart className="icon" />
                </div>
                <div className="text">{maritalStatus}</div>
                <ChevronDown className="icon" />
              </button>

              {showMaritalDropdown && (
                <div className="dropdownlist maritalStatusDropdown">
                  {["Single", "Married"].map((status) => (
                    <div
                      key={status}
                      className="dropdown-list-item"
                      onClick={() => handleMaritalChange(status)}
                    >
                      <div className="text">{status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddEmployee;
