import React, { useState } from 'react'
import './AddLeads.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Funnel, Mail, MapPin, Phone, User, UserPlus, Folder } from 'lucide-react'
import Dropdown from '../../Components/Dropdown/Dropdown'
import { LeadStatus, LeadSource } from '../../SLAData'
import { db } from '../../Firebase'
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAppContext } from '../../Context';

const AddLeads = () => {
  const { user, userDetails, userDetailsLoading } = useAppContext(); // Get user and employee details from context
  const [lookingfor, setLookingFor] = useState('Looking For ?')
  const [loading, setLoading] = useState(false); // 🔥 new state for loader
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobilenumber: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    status: "",
    source: ""
  });

  // input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // dropdown select
  const handleDropdown = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // validation
  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return "Enter a valid email";
    if (!formData.mobilenumber.trim()) return "Mobile number is required";
    if (!/^\d{10}$/.test(formData.mobilenumber)) return "Enter a valid 10-digit mobile number";
    if (lookingfor === "Looking For ?") return "Please select a required service";
    return null; // valid
  };

  // Send email function
  const sendEmail = async (emailData) => {
    try {
      const response = await fetch('http://localhost:5000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  };

  // save lead
  const handleSaveLead = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true); // show loader
    try {
      const leadData = {
        ...formData,
        requiredService: lookingfor,
        createdAt: Timestamp.now(),
        createdBy: userDetails?.name || user?.email || 'Unknown User'
      };
      
      // Save to Firebase first
      await addDoc(collection(db, "Leads"), leadData);
      toast.success('Lead saved successfully');

      // Prepare email content
      const currentDate = new Date().toLocaleDateString('en-IN');
      const currentTime = new Date().toLocaleTimeString('en-IN');
      
      // Email to the customer
      const customerEmailData = {
        to: user.email,
        subject: "Lead saved Successfully - SLA Invisible Grills",
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Lead saved Successfully!</h2>
            <p>Dear ${userDetails.name},</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Lead Details:</h3>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Mobile:</strong> ${formData.mobilenumber}</p>
              <p><strong>Service Required:</strong> ${lookingfor}</p>
              <p><strong>Address:</strong> ${formData.address ? formData.address + ', ' : ''}${formData.city ? formData.city + ', ' : ''}${formData.state}</p>
              <p><strong>Created By:</strong> ${userDetails?.name || user?.email || 'Unknown User'}</p>
            </div>
          </div>
        `
      };

      // Email to company
      const companyEmailData = {
        to: "slainvisiblegrills@gmail.com",
        subject: `New Lead: ${formData.name} - ${lookingfor}`,
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">🔥 New Lead Alert!</h2>
            <p>A new lead has been submitted on ${currentDate} at ${currentTime}</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">Lead Details:</h3>
              <p><strong>Name:</strong> ${formData.name}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Mobile:</strong> ${formData.mobilenumber}</p>
              <p><strong>Service Required:</strong> ${lookingfor}</p>
              <p><strong>Address:</strong> ${formData.address ? formData.address + ', ' : ''}${formData.city ? formData.city + ', ' : ''}${formData.state}, ${formData.country}</p>
              <p><strong>Status:</strong> ${formData.status || 'Not Set'}</p>
              <p><strong>Source:</strong> ${formData.source || 'Not Set'}</p>
              <p><strong>Created By:</strong> ${userDetails?.name || user?.email || 'Unknown User'}</p>
              <p><strong>Added by:</strong> ${userDetails ? `${userDetails.name} (${userDetails.email})` : user?.email || 'System'}</p>
              ${userDetails ? `<p><strong>Employee Role:</strong> ${userDetails.role || 'Not specified'}</p>` : ''}
            </div>
            
            <p style="color: #e74c3c;"><strong>Action Required:</strong> Please follow up with this lead as soon as possible.</p>
          </div>
        `
      };

      // Send emails (in parallel)
      try {
        await Promise.all([
          sendEmail(customerEmailData),
          sendEmail(companyEmailData)
        ]);
        toast.success('Emails sent successfully!');
      } catch (emailError) {
        toast.warning('Lead saved but email sending failed. Please check email configuration.');
        console.error('Email error:', emailError);
      }

      // Clear all form fields after successful save
      setFormData({
        name: "",
        email: "",
        mobilenumber: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        status: "",
        source: ""
      });
      setLookingFor("Looking For ?");
      
    } catch (err) {
      toast.error('Something went wrong. Try Again!');
      console.error('Save lead error:', err);
    } finally {
      setLoading(false); // restore button state
    }
  };

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container d-none d-lg-flex">
          <h1>Add Lead</h1>
        </div>
        <div className="actions-container">
          <div className="filter-container">
            <button type="button" className="filter-btn">
              <Funnel className="icon" />
            </button>
          </div>

          {/* Save Button */}
          <button 
            className="saveDetails-btn" 
            onClick={handleSaveLead} 
            disabled={loading} // disable while loading
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <UserPlus style={{ width: '18px' }} /> Save Lead
              </>
            )}
          </button>
        </div>
      </div>

      <div className="add-leads-main-container">
        <div className="add-lead-content-main-con">
          <h1 className="section-heading">Lead Status:</h1>
          <div className="leads-status-section-container">
            <Dropdown data={LeadStatus} label={'Status'} onSelect={(val) => handleDropdown("status", val)} />
            <Dropdown data={LeadSource} label={'Source'} onSelect={(val) => handleDropdown("source", val)} />
          </div>
          <hr />

          <h1 className="section-heading mb-5">Lead Info:</h1>
          <div className="lead-info-details-main-container">
            <form>
              <div className="input-container">
                <p className="input-label">Name :</p>
                <div className="input-con">
                  <div className="icon-con"><User className="icon" /></div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Email :</p>
                <div className="input-con">
                  <div className="icon-con"><Mail className="icon" /></div>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Mobile number :</p>
                <div className="input-con">
                  <div className="icon-con"><Phone className="icon" /></div>
                  <input type="text" name="mobilenumber" value={formData.mobilenumber} onChange={handleChange} placeholder="Mobile number" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Required service :</p>
                <div className="input-con">
                  <div className="icon-con"><Folder className="icon" /></div>
                  <div className="dropdown input-dropdown-container">
                    <button className="btn btn-secondary dropdown-toggle dp-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      {lookingfor}
                    </button>
                    <ul className="dropdown-menu input-drop-con-list">
                      <li onClick={() => setLookingFor('Invisible Grills')}>Invisible Grills</li>
                      <li onClick={() => setLookingFor('Mosquito Mesh')}>Mosquito Mesh</li>
                      <li onClick={() => setLookingFor('Cloth Hangers')}>Cloth Hangers</li>
                      <li onClick={() => setLookingFor('Artificial Grass')}>Artificial Grass</li>
                      <li onClick={() => setLookingFor('Bird Spikes')}>Bird Spikes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Address :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">City :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">State :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Country :</p>
                <div className="input-con">
                  <div className="icon-con"><MapPin className="icon" /></div>
                  <input type="text" name="country" value={formData.country} disabled />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddLeads
