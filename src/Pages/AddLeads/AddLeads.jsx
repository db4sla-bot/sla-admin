import React, { useState } from 'react'
import './AddLeads.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Funnel, MapPin, Phone, User, UserPlus, Folder, Target, MessageSquare, X } from 'lucide-react'
import Dropdown from '../../Components/Dropdown/Dropdown'
import { LeadStatus } from '../../SLAData'
import { db } from '../../Firebase'
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { useAppContext } from '../../Context';
import notificationService from '../../utils/notificationService'; // Fixed import path

const AddLeads = () => {
  const { user, userDetails, userDetailsLoading } = useAppContext();
  const [selectedServices, setSelectedServices] = useState([]) // Changed to array for multi-select
  const [loading, setLoading] = useState(false);
  
  // New source dropdowns
  const [selectedSource, setSelectedSource] = useState('Select Source')
  const [selectedSubSource, setSelectedSubSource] = useState('Select Sub Source')
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    status: "",
    details: ""
  });

  // Source options
  const sourceOptions = [
    'Digital Marketing',
    'Online',
    'Offline Marketing',
    'Reference',
    'Marketing',
    'Interior Designers',
    'Builders',
    'Engineers'
  ];

  // Sub source options
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
  ];

  // Services options
  const serviceOptions = [
    'Invisible Grills',
    'Mosquito Mesh',
    'Cloth Hangers',
    'Artificial Grass',
    'Bird Spikes'
  ];

  // input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // dropdown select
  const handleDropdown = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle service selection (multi-select)
  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      if (prev.includes(service)) {
        // Remove service if already selected
        return prev.filter(s => s !== service);
      } else {
        // Add service if not selected
        return [...prev, service];
      }
    });
  };

  // Remove individual service
  const removeService = (serviceToRemove) => {
    setSelectedServices(prev => prev.filter(s => s !== serviceToRemove));
  };

  // Clear all selected services
  const clearAllServices = () => {
    setSelectedServices([]);
  };

  // validation
  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.phone.trim()) return "Phone number is required";
    if (!/^\d{10}$/.test(formData.phone)) return "Enter a valid 10-digit phone number";
    if (selectedServices.length === 0) return "Please select at least one service";
    if (selectedSource === "Select Source") return "Please select a source";
    if (selectedSubSource === "Select Sub Source") return "Please select a sub source";
    return null;
  };

  // save lead
  const handleSaveLead = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      const leadData = {
        ...formData,
        requiredServices: selectedServices,
        source: selectedSource,
        subSource: selectedSubSource,
        createdAt: Timestamp.now(),
        createdBy: userDetails?.name || user?.email || 'Unknown User'
      };
      
      // Save to Firebase
      const docRef = await addDoc(collection(db, "Leads"), leadData);
      const savedLeadData = { ...leadData, id: docRef.id };
      
      toast.success('Lead saved successfully! 🎉');

      // Send notification to ALL devices globally (this now works across all devices)
      try {
        console.log('🌐 Sending notifications to all devices...');
        await notificationService.sendLeadNotification(savedLeadData);
        console.log('✅ Notifications sent to all devices successfully');
        
        toast.info('📱 Notifications sent to all devices!', {
          position: "bottom-right",
          autoClose: 3000,
        });
      } catch (notificationError) {
        console.error('❌ Failed to send notification:', notificationError);
      }

      // Clear all form fields after successful save
      setFormData({
        name: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        status: "",
        details: ""
      });
      setSelectedServices([]);
      setSelectedSource("Select Source");
      setSelectedSubSource("Select Sub Source");
      
    } catch (err) {
      toast.error('Something went wrong. Try Again!');
      console.error('Save lead error:', err);
    } finally {
      setLoading(false);
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
            disabled={loading}
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
          {/* Lead Status Section */}
          <h1 className="section-heading">Lead Status:</h1>
          <div className="leads-status-section-container">
            <Dropdown data={LeadStatus} label={'Status'} onSelect={(val) => handleDropdown("status", val)} />
          </div>
          <hr />

          {/* Source Information Section */}
          <h1 className="section-heading mb-5">Source Information:</h1>
          <div className="source-info-container">
            {/* Primary Source */}
            <div className="input-container">
              <p className="input-label">Source :</p>
              <div className="input-con">
                <div className="icon-con"><Target className="icon" /></div>
                <div className="dropdown input-dropdown-container">
                  <button className="btn btn-secondary dropdown-toggle dp-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {selectedSource}
                  </button>
                  <ul className="dropdown-menu input-drop-con-list">
                    {sourceOptions.map((source, index) => (
                      <li key={index} onClick={() => setSelectedSource(source)}>
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Sub Source */}
            <div className="input-container">
              <p className="input-label">Sub Source :</p>
              <div className="input-con">
                <div className="icon-con"><Target className="icon" /></div>
                <div className="dropdown input-dropdown-container">
                  <button className="btn btn-secondary dropdown-toggle dp-btn" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    {selectedSubSource}
                  </button>
                  <ul className="dropdown-menu input-drop-con-list">
                    {subSourceOptions.map((subSource, index) => (
                      <li key={index} onClick={() => setSelectedSubSource(subSource)}>
                        {subSource}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="input-container">
              <p className="input-label">Details :</p>
              <div className="input-con">
                <div className="icon-con"><MessageSquare className="icon" /></div>
                <input 
                  type="text" 
                  name="details" 
                  value={formData.details} 
                  onChange={handleChange} 
                  placeholder="Enter additional details" 
                />
              </div>
            </div>

            {/* Required Services - Multi Select */}
            <div className="input-container">
              <p className="input-label">Required services :</p>
              <div className="input-con services-multi-select-container">
                <div className="icon-con"><Folder className="icon" /></div>
                <div className="services-select-wrapper">
                  <div className="dropdown input-dropdown-container">
                    <button 
                      className="btn btn-secondary dropdown-toggle dp-btn services-dropdown-btn" 
                      type="button" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                      data-count={selectedServices.length}
                    >
                      {selectedServices.length === 0 
                        ? 'Select Required Services' 
                        : selectedServices.length === 1
                        ? `${selectedServices[0]}`
                        : `${selectedServices.length} Services Selected`
                      }
                    </button>
                    <ul className="dropdown-menu input-drop-con-list services-dropdown-list">
                      <li className="services-dropdown-header">
                        <span>📋 Available Services ({selectedServices.length}/{serviceOptions.length})</span>
                        {selectedServices.length > 0 && (
                          <button 
                            type="button" 
                            className="clear-all-services"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearAllServices();
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </li>
                      {serviceOptions.map((service, index) => (
                        <li 
                          key={index} 
                          className={`service-option ${selectedServices.includes(service) ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServiceToggle(service);
                          }}
                        >
                          {/* <input 
                            type="checkbox" 
                            checked={selectedServices.includes(service)}
                            onChange={() => {}} // Controlled by parent click
                            onClick={(e) => e.stopPropagation()}
                          /> */}
                          <span>{service}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Selected Services Display */}
            {selectedServices.length > 0 && (
              <div className="selected-services-display">
                <p className="input-label">Selected Services ({selectedServices.length}):</p>
                <div className="selected-services-tags">
                  {selectedServices.map((service, index) => (
                    <span key={index} className="service-tag">
                      {service}
                      <button 
                        type="button" 
                        className="remove-service"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeService(service);
                        }}
                        title={`Remove ${service}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <hr />

          {/* Customer Details Section */}
          <h1 className="section-heading mb-5">Customer Details:</h1>
          <div className="customer-details-container">
            <form>
              <div className="input-container">
                <p className="input-label">Name :</p>
                <div className="input-con">
                  <div className="icon-con"><User className="icon" /></div>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Customer Name" />
                </div>
              </div>

              <div className="input-container">
                <p className="input-label">Phone :</p>
                <div className="input-con">
                  <div className="icon-con"><Phone className="icon" /></div>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
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
