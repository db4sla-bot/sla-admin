import React, { useState } from 'react'
import './AddCustomer.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Funnel, Users, User, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from "react-toastify";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../Firebase";

const AddCustomer = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    state: "",
    city: "",
    country: "India"
  });
  const [saving, setSaving] = useState(false);
  const lookingForOptions = [
    "Invisible Grills",
    "Mosquito Mesh",
    "Cloth Hangers",
    "Artificial Grass",
    "Bird Spikes"
  ];
  const [lookingFor, setLookingFor] = useState([]);
  const [showLookingForDropdown, setShowLookingForDropdown] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLookingForSelect = (item) => {
    if (!lookingFor.includes(item)) {
      setLookingFor([...lookingFor, item]);
    }
  };

  const handleLookingForRemove = (item) => {
    setLookingFor(lookingFor.filter((i) => i !== item));
  };

  const handleSaveCustomer = async () => {
    if (!formData.name) {
      toast.error("Customer name is required!");
      return;
    }
    if (!formData.mobile || formData.mobile.length !== 10) {
      toast.error("Valid 10-digit mobile number is required!");
      return;
    }
    setSaving(true);
    try {
      // Check if customer with this mobile number already exists
      let customerId = formData.mobile;
      let counter = 1;
      let customerExists = true;
      
      // Find available ID by checking if document exists
      while (customerExists) {
        const customerRef = doc(db, "Customers", customerId);
        const customerSnap = await getDoc(customerRef);
        
        if (!customerSnap.exists()) {
          // ID is available
          customerExists = false;
        } else {
          // ID exists, try next suffix
          customerId = `${formData.mobile}_${counter}`;
          counter++;
        }
      }
      
      // Use the available customerId (either original mobile or mobile_1, mobile_2, etc.)
      await setDoc(doc(db, "Customers", customerId), {
        ...formData,
        lookingFor, // save lookingFor array
        work: [],
        materialUsed: [],
        activity: [],
        createdAt: new Date().toISOString(), // Add created date
        updatedAt: new Date().toISOString()
      });
      
      if (counter > 1) {
        toast.success(`Customer added successfully! (ID: ${customerId})`);
        toast.info(`Note: A customer with mobile ${formData.mobile} already exists.`);
      } else {
        toast.success("Customer added successfully!");
      }
      
      // Reset form
      setFormData({
        name: "",
        mobile: "",
        address: "",
        state: "",
        city: "",
        country: "India"
      });
      setLookingFor([]);
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer!");
    }
    setSaving(false);
  };

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container d-none d-lg-flex">
          <h1>
            Add Customer
          </h1>
        </div>
        <div className="actions-container">
          <button className="saveDetails-btn" onClick={handleSaveCustomer} disabled={saving}>
            {saving ? (
              <>
                <span className="loader-white"></span> Saving...
              </>
            ) : (
              <>
                <Users style={{width: '18px'}} /> Save Customer
              </>
            )}
          </button>
        </div>
      </div>

      <div className="routes-main-container">
        <form className="add-customer-container">
          <div className="heading-container">
            <h1>Customer Information :</h1>
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

          {/* Mobile Number */}
          <div className="input-container">
            <p className="input-label">Mobile Number :</p>
            <div className="input-con">
              <div className="icon-con">
                <Phone className="icon" />
              </div>
              <input
                type="text"
                placeholder="Mobile Number"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
          </div>

          {/* Looking For Dropdown */}
          <div className="dropdown-container">
            <p className="dropdownlabel">Looking For :</p>
            <div className="drop-down-container">
              <button
                type="button"
                className="dropdown-header"
                onClick={() => setShowLookingForDropdown((s) => !s)}
              >
                <div className="access-tags">
                  {lookingFor.length === 0 && (
                    <span className="access-placeholder">Select Services</span>
                  )}
                  {lookingFor.map((item) => (
                    <span key={item} className="access-tag">
                      {item}
                      <span
                        className="access-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLookingForRemove(item);
                        }}
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
                <span className="icon" style={{marginLeft: "auto"}}>▼</span>
              </button>
              {showLookingForDropdown && (
                <div className="dropdownlist accessDropdown">
                  {lookingForOptions.map((item) => (
                    <div
                      key={item}
                      className={`dropdown-list-item${lookingFor.includes(item) ? " active" : ""}`}
                      onClick={() => handleLookingForSelect(item)}
                    >
                      <div className="text">{item}</div>
                      {lookingFor.includes(item) && (
                        <span className="access-selected-check">✔</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
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

          {/* Email - Optional */}
          <div className="input-container">
            <p className="input-label">Email :</p>
            <div className="input-con">
              <div className="icon-con"><Mail className="icon" /></div>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="Customer Email (Optional)" 
              />
            </div>
          </div>

        </form>
      </div>
    </>
  )
}

export default AddCustomer