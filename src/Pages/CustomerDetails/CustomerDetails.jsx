import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../Firebase";
import './CustomerDetails.css';
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Plus, SquarePen, Trash2, User, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";
import { useAppContext } from "../../Context"; // Import context

const paymentModes = ["UPI", "Cash", "Personal", "Employee"];

// Services list for work dropdown
const servicesList = [
  "Invisible Grills",
  "Mosquito Mesh", 
  "Cloth Hangers",
  "Artificial Grass",
  "Bird Spikes"
];

const CustomerDetails = () => {
  const { customerid } = useParams();
  const { userDetails } = useAppContext();
  const [customer, setCustomer] = useState(null);
  const [stage, setStage] = useState('profile');
  
  // Work section states - Simplified
  const [selectedService, setSelectedService] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [workDescription, setWorkDescription] = useState("");
  
  // Material section states
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialQty, setMaterialQty] = useState("");
  const [manualActivityInput, setManualActivityInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [showWorkDropdown, setShowWorkDropdown] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);

  // Edit customer details
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Payment tab states
  const [selectedPaymentWork, setSelectedPaymentWork] = useState(null);
  const [showPaymentWorkDropdown, setShowPaymentWorkDropdown] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentList, setPaymentList] = useState([]);
  const [paymentMode, setPaymentMode] = useState("");
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);
  const [paymentComment, setPaymentComment] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [openPaymentModeDropdown, setOpenPaymentModeDropdown] = useState(null); // replaces showPaymentModeDropdownIdx
  const [paymentComments, setPaymentComments] = useState({}); // store comment per payment row

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const docRef = doc(db, "Customers", customerid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCustomer(docSnap.data());
        } else {
          toast.error("No such customer!");
        }
      } catch (err) {
        toast.error("Error fetching customer!");
      }
    };
    fetchCustomer();
  }, [customerid]);

  // Fetch materials for dropdown
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Materials"));
        const materialsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaterials(materialsList);
      } catch (error) {
        toast.error("Error fetching materials!");
      }
    };
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (customer) setEditForm(customer);
  }, [customer]);

  useEffect(() => {
    if (customer && customer.payments) {
      setPaymentList(customer.payments);
    }
  }, [customer]);

  // Simplified Add work function
  const handleAddWork = async () => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }
    if (!workDescription.trim()) {
      toast.error("Please enter work description");
      return;
    }
    
    setLoading(true);
    try {
      const docRef = doc(db, "Customers", customerid);
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      const newWorkItem = {
        service: selectedService,
        description: workDescription.trim(),
        addedBy: username,
        date: currentDate,
        time: currentTime
      };
      
      const newWork = [...(customer.work || []), newWorkItem];
      
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "work",
          name: `${selectedService}: ${workDescription.trim()}`,
          service: selectedService,
          description: workDescription.trim(),
          date: currentDate,
          time: currentTime,
          addedBy: username,
        },
      ];
      
      await updateDoc(docRef, { 
        work: newWork,
        activity: newActivity
      });
      
      setCustomer((prev) => ({
        ...prev,
        work: newWork,
        activity: newActivity,
      }));
      
      // Reset form
      setSelectedService("");
      setWorkDescription("");
      setShowServiceDropdown(false);
      
      toast.success("Work added successfully!");
    } catch (err) {
      console.error("Error adding work:", err);
      toast.error("Failed to add work!");
    }
    setLoading(false);
  };

  // Edit customer details handlers
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, "Customers", customerid), { ...editForm });
      setCustomer(editForm);
      setEditMode(false);
      toast.success("Customer details updated!");
    } catch (err) {
      toast.error("Failed to update details!");
    }
    setSavingEdit(false);
  };

  // Add material used (with work)
  const handleAddMaterialUsed = async () => {
    if (!selectedMaterial) {
      toast.error("Please select a material");
      return;
    }
    if (!materialQty || isNaN(materialQty) || materialQty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!selectedWork) {
      toast.error("Please select work for this material");
      return;
    }
    
    // Enhanced quantity validation
    const enteredQty = Number(materialQty);
    const availableStock = selectedMaterial.remaining || selectedMaterial.quantity || 0;
    
    console.log("Material validation:", {
      material: selectedMaterial.name,
      enteredQty,
      availableStock,
      selectedMaterial
    });
    
    if (enteredQty > availableStock) {
      toast.error(
        `Entered quantity (${enteredQty}) is more than available stock (${availableStock}). Please reduce the quantity.`,
        { autoClose: 5000 }
      );
      return;
    }
    
    if (availableStock <= 0) {
      toast.error(`${selectedMaterial.name} is out of stock!`);
      return;
    }
    
    setSavingMaterial(true);
    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      // Update material quantity in Materials collection
      const materialDocRef = doc(db, "Materials", selectedMaterial.id);
      const newQty = availableStock - enteredQty;
      
      // Update both quantity and remaining fields
      await updateDoc(materialDocRef, { 
        quantity: newQty,
        remaining: newQty,
        lastUpdated: new Date(),
        lastUsedBy: username,
        lastUsedDate: currentDate
      });

      // Update customer materialUsed array
      const docRef = doc(db, "Customers", customerid);
      const newMaterialUsed = [
        ...(customer.materialUsed || []),
        {
          materialId: selectedMaterial.id,
          name: selectedMaterial.name,
          quantity: enteredQty,
          work: selectedWork,
          pricePerUnit: selectedMaterial.price || 0,
          totalCost: (selectedMaterial.price || 0) * enteredQty,
          addedBy: username,
          date: currentDate,
          time: currentTime,
          stockBefore: availableStock,
          stockAfter: newQty
        },
      ];

      // Add activity
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "material",
          name: `Used ${enteredQty} ${selectedMaterial.name}`,
          quantity: enteredQty,
          work: selectedWork,
          materialName: selectedMaterial.name,
          stockBefore: availableStock,
          stockAfter: newQty,
          date: currentDate,
          time: currentTime,
          addedBy: username,
        },
      ];

      await updateDoc(docRef, { 
        materialUsed: newMaterialUsed,
        activity: newActivity
      });

      setCustomer((prev) => ({
        ...prev,
        materialUsed: newMaterialUsed,
        activity: newActivity,
      }));

      // Update local materials state to reflect the reduced quantity
      setMaterials((prev) =>
        prev.map((mat) =>
          mat.id === selectedMaterial.id
            ? { 
                ...mat, 
                quantity: newQty, 
                remaining: newQty,
                lastUpdated: new Date(),
                lastUsedBy: username 
              }
            : mat
        )
      );
      
      // Reset form
      setSelectedMaterial(null);
      setMaterialQty("");
      setSelectedWork(null);
      setMaterialDropdownOpen(false);
      setShowWorkDropdown(false);
      
      toast.success(
        `Material added successfully! ${selectedMaterial.name} stock reduced from ${availableStock} to ${newQty}`,
        { autoClose: 4000 }
      );
      
    } catch (err) {
      console.error("Error adding material:", err);
      toast.error("Failed to add material!");
    }
    setSavingMaterial(false);
  };

  const handleAddManualActivity = async () => {
    if (!manualActivityInput.trim()) return;
    setLoading(true);
    try {
      const docRef = doc(db, "Customers", customerid);
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "manual",
          name: manualActivityInput.trim(),
          date: currentDate,
          time: currentTime,
          addedBy: username,
        },
      ];
      
      await updateDoc(docRef, { activity: newActivity });
      setCustomer((prev) => ({
        ...prev,
        activity: newActivity,
      }));
      setManualActivityInput("");
      toast.success("Activity added!");
    } catch (err) {
      toast.error("Failed to add activity!");
    }
    setLoading(false);
  };

  // Payment save handler
  const handleSavePayment = async () => {
    if (!selectedPaymentWork) {
      toast.error("Select work for payment");
      return;
    }
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Enter valid total amount");
      return;
    }
    setSavingPayment(true);
    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      // Save payment info for work
      const newPayments = [
        ...(customer.payments || []),
        {
          work: selectedPaymentWork,
          totalAmount: Number(paymentAmount),
          paid: [],
          addedBy: username,
          date: currentDate,
          time: currentTime,
        },
      ];

      // Add activity
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "payment_setup",
          name: `Payment setup for ${selectedPaymentWork}`,
          amount: Number(paymentAmount),
          work: selectedPaymentWork,
          date: currentDate,
          time: currentTime,
          addedBy: username,
        },
      ];

      await updateDoc(doc(db, "Customers", customerid), { 
        payments: newPayments,
        activity: newActivity
      });

      setCustomer((prev) => ({ 
        ...prev, 
        payments: newPayments,
        activity: newActivity
      }));
      
      setPaymentList(newPayments);
      setSelectedPaymentWork(null);
      setPaymentAmount("");
      toast.success("Payment info saved!");
    } catch (err) {
      toast.error("Failed to save payment info!");
    }
    setSavingPayment(false);
  };

  // Add payment for work (fix index for reversed list)
  const handleAddPayment = async (displayIdx) => {
    // Find the correct index in the original paymentList
    const workIndex = paymentList.length - 1 - displayIdx;
    if (!paymentMode) {
      toast.error("Select payment mode");
      return;
    }
    if (!paymentComments[displayIdx] || !paymentComments[displayIdx].trim()) {
      toast.error("Enter comment");
      return;
    }
    const paidAmount = prompt("Enter paid amount:");
    if (!paidAmount || isNaN(paidAmount) || paidAmount <= 0) {
      toast.error("Enter valid paid amount");
      return;
    }
    setSavingPayment(true);
    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      const paymentsCopy = [...paymentList];
      const newPaymentRecord = {
        amount: Number(paidAmount),
        mode: paymentMode,
        comment: paymentComments[displayIdx],
        date: currentDate,
        time: currentTime,
        addedBy: username,
      };
      paymentsCopy[workIndex].paid.push(newPaymentRecord);

      // Add activity
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "payment",
          name: `Payment received for ${paymentsCopy[workIndex].work}`,
          amount: Number(paidAmount),
          mode: paymentMode,
          comment: paymentComments[displayIdx],
          work: paymentsCopy[workIndex].work,
          date: currentDate,
          time: currentTime,
          addedBy: username,
        },
      ];

      // Store payment record in Payments collection
      const paymentDocData = {
        customerId: customerid,
        customerName: customer.name,
        customerEmail: customer.email || '',
        customerMobile: customer.mobile || '',
        work: paymentsCopy[workIndex].work,
        totalWorkAmount: paymentsCopy[workIndex].totalAmount,
        paidAmount: Number(paidAmount),
        paymentMode: paymentMode,
        comment: paymentComments[displayIdx],
        receivedBy: username,
        paymentDate: new Date(),
        createdAt: new Date(),
        createdDate: currentDate,
        createdTime: currentTime,
        status: 'received'
      };

      // Add to Payments collection
      await addDoc(collection(db, "Payments"), paymentDocData);

      await updateDoc(doc(db, "Customers", customerid), { 
        payments: paymentsCopy,
        activity: newActivity
      });

      setCustomer((prev) => ({ 
        ...prev, 
        payments: paymentsCopy,
        activity: newActivity
      }));
      
      setPaymentList(paymentsCopy);
      setPaymentMode("");
      setPaymentComments((prev) => ({ ...prev, [displayIdx]: "" }));
      setOpenPaymentModeDropdown(null);
      toast.success("Payment added!");
    } catch (err) {
      toast.error("Failed to add payment!");
    }
    setSavingPayment(false);
  };

  if (!customer) return <p>Loading...</p>;

  // Filter materials for dropdown
  const filteredMaterials = materials.filter((mat) =>
    mat.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1>{customer.name}</h1>
        </div>
        <div className="actions-container">
          <button className="saveDetails-btn">
            <Plus /> Add Customer
          </button>
        </div>
      </div>

      <div className="customer-details-main-container">
        <div className="customer-main-details">
          <div className="customer-avatar">
            {customer.name ? customer.name.charAt(0).toUpperCase() : <User className="icon" />}
          </div>
          {editMode ? (
            <>
              <input className="edit-input" name="name" value={editForm.name} onChange={handleEditChange} />
              <input className="edit-input" name="email" value={editForm.email} onChange={handleEditChange} />
              <input className="edit-input" name="mobile" value={editForm.mobile} onChange={handleEditChange} />
              <input className="edit-input" name="address" value={editForm.address} onChange={handleEditChange} />
              <input className="edit-input" name="city" value={editForm.city} onChange={handleEditChange} />
              <input className="edit-input" name="state" value={editForm.state} onChange={handleEditChange} />
              <input className="edit-input" name="country" value={editForm.country} onChange={handleEditChange} />
              <button className="edit-btn" onClick={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <span className="loader-white"></span> : null}
                Save
              </button>
              <button className="delete-btn" onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <>
              <p className="name">{customer.name}</p>
              <p className="email">{customer.email}</p>
              {/* <div className="qualification-con">
                <div className="qualification-item">
                  <p className="left">Mobile :</p>
                  <p className="right">{customer.mobile}</p>
                </div>
                <div className="qualification-item">
                  <p className="left">Address :</p>
                  <p className="right">{customer.address}</p>
                </div>
                <div className="qualification-item">
                  <p className="left">City :</p>
                  <p className="right">{customer.city}</p>
                </div>
                <div className="qualification-item">
                  <p className="left">State :</p>
                  <p className="right">{customer.state}</p>
                </div>
                <div className="qualification-item">
                  <p className="left">Country :</p>
                  <p className="right">{customer.country}</p>
                </div>
                <div className="qualification-item">
                  <p className="left">Looking For :</p>
                  <p className="right">{(customer.lookingFor || []).join(", ")}</p>
                </div>
              </div> */}
              <div className="edit-delete-btn-con">
                <button className="edit-btn" onClick={() => setEditMode(true)}>
                  <SquarePen className="icon" /> Edit
                </button>
              </div>
            </>
          )}
        </div>

        <div className="customer-additional-details">
          <div className="actions-tab-container">
            <button className={`${stage === 'profile' ? 'active' : ''}`} onClick={() => setStage('profile')}>Profile</button>
            <button className={`${stage === 'work' ? 'active' : ''}`} onClick={() => setStage('work')}>Work</button>
            <button className={`${stage === 'material' ? 'active' : ''}`} onClick={() => setStage('material')}>Materials</button>
            <button className={`${stage === 'payment' ? 'active' : ''}`} onClick={() => setStage('payment')}>Payment</button>
            <button className={`${stage === 'activity' ? 'active' : ''}`} onClick={() => setStage('activity')}>Activity</button>
          </div>

          {/* Profile Details */}
          <div className={`profile-details-con ${stage === 'profile' ? '' : 'd-none'}`}>
            <div className="profile-details-item">
              <p className="left">Name :</p>
              <p className="right">{customer.name}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">Mobile :</p>
              <p className="right">{customer.mobile}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">Email :</p>
              <p className="right">{customer.email}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">Address :</p>
              <p className="right">{customer.address}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">City :</p>
              <p className="right">{customer.city}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">State :</p>
              <p className="right">{customer.state}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">Country :</p>
              <p className="right">{customer.country}</p>
            </div>
            <div className="profile-details-item">
              <p className="left">Looking For :</p>
              <p className="right">{(customer.lookingFor || []).join(", ")}</p>
            </div>
          </div>

          {/* Work Tab - Simplified */}
          <div className={`profile-details-con ${stage === 'work' ? '' : 'd-none'}`}>
            <div className="work-list">
              <h4>Work Management</h4>
              <div className="work-add-row">
                {/* Service Dropdown */}
                <div className="material-dropdown-container">
                  <button
                    type="button"
                    className="material-dropdown-header"
                    onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  >
                    <span>
                      {selectedService || "Select Service"}
                    </span>
                    <ChevronDown className="icon" />
                  </button>
                  {showServiceDropdown && (
                    <div className="material-dropdown-list">
                      <div className="material-dropdown-scroll">
                        {servicesList.map((service, idx) => (
                          <div
                            key={idx}
                            className="material-dropdown-item"
                            onClick={() => {
                              setSelectedService(service);
                              setShowServiceDropdown(false);
                            }}
                          >
                            🔧 {service}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Work Description Input */}
                <input
                  type="text"
                  placeholder="Enter work description..."
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  className="work-input"
                />
                
                <button 
                  className="add-btn" 
                  onClick={handleAddWork} 
                  disabled={loading || !selectedService || !workDescription.trim()}
                >
                  {loading ? <span className="loader-white"></span> : null}
                  Add Work
                </button>
              </div>
              
              {(customer.work || []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔧</div>
                  <div className="empty-state-title">No Work Items</div>
                  <div className="empty-state-text">Add work items to track customer projects</div>
                </div>
              ) : (
                // Show latest work items first by reversing the array
                [...(customer.work || [])].reverse().map((work, idx) => (
                  <div key={idx} className="work-item">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--txt-dark)' }}>
                        {work.service || work.name || 'Service Work'}
                      </div>
                      <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {work.service || 'Service'}
                      </span>
                    </div>
                    
                    {(work.description || work.comment) && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--txt-dark)', 
                        marginBottom: '8px',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--blue)'
                      }}>
                        💬 {work.description || work.comment}
                      </div>
                    )}
                    
                    {work.addedBy && (
                      <div style={{ fontSize: '12px', color: 'var(--txt-light)', marginTop: '8px' }}>
                        👤 Added by: <strong>{work.addedBy}</strong> | 📅 {work.date} ⏰ {work.time}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Material Used Tab */}
          <div className={`profile-details-con ${stage === 'material' ? '' : 'd-none'}`}>
            <div className="material-used-list">
              <h4>Materials Management</h4>
              <div className="material-add-row">
                {/* Work Dropdown - Updated to use service names */}
                <div className="material-dropdown-container">
                  <button
                    type="button"
                    className="material-dropdown-header"
                    onClick={() => setShowWorkDropdown((open) => !open)}
                  >
                    <span>
                      {selectedWork || "Choose Work"}
                    </span>
                    <ChevronDown className="icon" />
                  </button>
                  {showWorkDropdown && (
                    <div className="material-dropdown-list">
                      <div className="material-dropdown-scroll">
                        {(customer.work || []).length === 0 ? (
                          <div className="material-dropdown-item">No works found</div>
                        ) : (
                          customer.work.map((work, idx) => (
                            <div
                              key={idx}
                              className="material-dropdown-item"
                              onClick={() => {
                                setSelectedWork(work.service || work.name || 'Service Work');
                                setShowWorkDropdown(false);
                              }}
                            >
                              🔧 {work.service || work.name || 'Service Work'}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Material Dropdown */}
                <div className="material-dropdown-container">
                  <button
                    type="button"
                    className="material-dropdown-header"
                    onClick={() => setMaterialDropdownOpen((open) => !open)}
                  >
                    <span>
                      {selectedMaterial ? 
                        `${selectedMaterial.name} (Stock: ${selectedMaterial.remaining || selectedMaterial.quantity || 0})` 
                        : "Choose Material"
                      }
                    </span>
                    <ChevronDown className="icon" />
                  </button>
                  {materialDropdownOpen && (
                    <div className="material-dropdown-list">
                      <input
                        type="text"
                        className="material-dropdown-search"
                        placeholder="Search material..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                      />
                      <div className="material-dropdown-scroll">
                        {filteredMaterials.length === 0 ? (
                          <div className="material-dropdown-item">No materials found</div>
                        ) : (
                          filteredMaterials.map((mat) => {
                            const stock = mat.remaining || mat.quantity || 0;
                            return (
                              <div
                                key={mat.id}
                                className="material-dropdown-item"
                                onClick={() => {
                                  setSelectedMaterial(mat);
                                  setMaterialDropdownOpen(false);
                                  setMaterialSearch("");
                                }}
                                style={{
                                  background: stock <= 0 ? '#fee2e2' : stock <= 5 ? '#fef3c7' : '',
                                  color: stock <= 0 ? '#dc2626' : stock <= 5 ? '#d97706' : ''
                                }}
                              >
                                📦 {mat.name} 
                                <span style={{ 
                                  fontSize: '12px', 
                                  marginLeft: '8px',
                                  fontWeight: '600',
                                  color: stock <= 0 ? '#dc2626' : stock <= 5 ? '#d97706' : '#22c55e'
                                }}>
                                  (Stock: {stock})
                                  {stock <= 0 && ' - OUT OF STOCK'}
                                  {stock > 0 && stock <= 5 && ' - LOW STOCK'}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="number"
                  className="material-qty-input"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(e.target.value)}
                  min="1"
                  max={selectedMaterial ? (selectedMaterial.remaining || selectedMaterial.quantity || 0) : undefined}
                  placeholder={selectedMaterial ? `Max: ${selectedMaterial.remaining || selectedMaterial.quantity || 0}` : "Quantity"}
                  disabled={!selectedMaterial}
                  style={{
                    borderColor: selectedMaterial && materialQty && Number(materialQty) > (selectedMaterial.remaining || selectedMaterial.quantity || 0) ? '#ef4444' : ''
                  }}
                />
                
                <button
                  className="add-btn"
                  onClick={handleAddMaterialUsed}
                  disabled={
                    !selectedMaterial || 
                    !materialQty || 
                    !selectedWork || 
                    savingMaterial ||
                    (selectedMaterial && Number(materialQty) > (selectedMaterial.remaining || selectedMaterial.quantity || 0))
                  }
                >
                  {savingMaterial ? <span className="loader-white"></span> : null}
                  Add Material
                </button>
              </div>
              
              {/* Stock warning for selected material */}
              {selectedMaterial && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  margin: '8px 0',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: (selectedMaterial.remaining || selectedMaterial.quantity || 0) <= 0 
                    ? '#fee2e2' 
                    : (selectedMaterial.remaining || selectedMaterial.quantity || 0) <= 5 
                    ? '#fef3c7' 
                    : '#dcfce7',
                  color: (selectedMaterial.remaining || selectedMaterial.quantity || 0) <= 0 
                    ? '#dc2626' 
                    : (selectedMaterial.remaining || selectedMaterial.quantity || 0) <= 5 
                    ? '#d97706' 
                    : '#16a34a',
                }}>
                  <span>
                    {(selectedMaterial.remaining || selectedMaterial.quantity || 0) <= 0 
                      ? '⚠️ OUT OF STOCK' 
                      : (selectedMaterial.remaining || selectedMaterial.quantity || 0) <= 5 
                      ? '⚠️ LOW STOCK WARNING' 
                      : '✅ STOCK AVAILABLE'}
                  </span>
                  <span>
                    Available: {selectedMaterial.remaining || selectedMaterial.quantity || 0} units
                  </span>
                </div>
              )}
              
              {(customer.materialUsed || []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-title">No Materials Used</div>
                  <div className="empty-state-text">Track materials used for customer projects</div>
                </div>
              ) : (
                // Show latest material usage first by reversing the array
                [...(customer.materialUsed || [])].reverse().map((mat, idx) => (
                  <div key={idx} className="material-used-item">
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--txt-dark)' }}>
                        📦 {mat.name} - Qty: {mat.quantity}
                      </div>
                      {mat.work && (
                        <span style={{
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          🔧 {mat.work}
                        </span>
                      )}
                    </div>
                    
                    {mat.stockBefore && mat.stockAfter !== undefined && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--txt-light)', 
                        marginBottom: '8px',
                        background: '#f1f5f9',
                        padding: '6px 10px',
                        borderRadius: '6px'
                      }}>
                        📊 Stock: {mat.stockBefore} → {mat.stockAfter} 
                        {mat.totalCost && <span> | 💰 Cost: ₹{mat.totalCost}</span>}
                      </div>
                    )}
                    
                    {mat.addedBy && (
                      <div style={{ fontSize: '12px', color: 'var(--txt-light)', marginTop: '8px' }}>
                        👤 Added by: <strong>{mat.addedBy}</strong> | 📅 {mat.date} ⏰ {mat.time}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Tab */}
          <div className={`profile-details-con ${stage === 'payment' ? '' : 'd-none'}`}>
            <h4>Payment Management</h4>
            
            {/* Payment Summary Cards */}
            {paymentList.length > 0 && (
              <div className="payment-summary-grid">
                <div className="payment-summary-card">
                  <h5>Total Works</h5>
                  <div className="amount">{paymentList.length}</div>
                  <div className="status-text">Active Payment Plans</div>
                </div>
                <div className="payment-summary-card">
                  <h5>Total Amount</h5>
                  <div className="amount">₹{paymentList.reduce((sum, pay) => sum + pay.totalAmount, 0).toLocaleString()}</div>
                  <div className="status-text">Across All Works</div>
                </div>
                <div className="payment-summary-card">
                  <h5>Total Received</h5>
                  <div className="amount">₹{paymentList.reduce((sum, pay) => sum + pay.paid.reduce((paidSum, p) => paidSum + p.amount, 0), 0).toLocaleString()}</div>
                  <div className="status-text">Payment Collected</div>
                </div>
                <div className="payment-summary-card">
                  <h5>Pending Amount</h5>
                  <div className="amount">₹{paymentList.reduce((sum, pay) => sum + (pay.totalAmount - pay.paid.reduce((paidSum, p) => paidSum + p.amount, 0)), 0).toLocaleString()}</div>
                  <div className="status-text">Yet to Collect</div>
                </div>
              </div>
            )}

            {/* Add payment info for work - Updated dropdown */}
            <div className="payment-add-row">
              <div className="material-dropdown-container">
                <button
                  type="button"
                  className="material-dropdown-header"
                  onClick={() => setShowPaymentWorkDropdown((open) => !open)}
                >
                  <span>
                    {selectedPaymentWork ? selectedPaymentWork : "Choose Work"}
                  </span>
                  <ChevronDown className="icon" />
                </button>
                {showPaymentWorkDropdown && (
                  <div className="material-dropdown-list">
                    <div className="material-dropdown-scroll">
                      {(customer.work || []).length === 0 ? (
                        <div className="material-dropdown-item">No works found</div>
                      ) : (
                        customer.work.map((work, idx) => (
                          <div
                            key={idx}
                            className="material-dropdown-item"
                            onClick={() => {
                              setSelectedPaymentWork(work.service || work.name || 'Service Work');
                              setShowPaymentWorkDropdown(false);
                            }}
                          >
                            {work.service || work.name || 'Service Work'}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="number"
                className="material-qty-input"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                min="1"
                placeholder="Total Amount (₹)"
              />
              <button
                className="add-btn"
                onClick={handleSavePayment}
                disabled={!selectedPaymentWork || !paymentAmount || savingPayment}
              >
                {savingPayment ? <span className="loader-white"></span> : null}
                💰 Create Payment Plan
              </button>
            </div>

            {/* Display payments for each work - Show latest payment plans first */}
            {[...(paymentList || [])].reverse().map((pay, displayIdx) => {
              const paidTotal = pay.paid.reduce((sum, p) => sum + p.amount, 0);
              const pending = pay.totalAmount - paidTotal;
              return (
                <div key={displayIdx} className="payment-work-block">
                  <div className="payment-work-row">
                    <div>
                      <div className="payment-work-label">Work Name</div>
                      <div className="payment-work-value">{pay.work}</div>
                    </div>
                    <div>
                      <div className="payment-work-label">Total Amount</div>
                      <div className="payment-work-value">₹{pay.totalAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="payment-work-label">Amount Paid</div>
                      <div className="payment-work-value">₹{paidTotal.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="payment-work-label">Pending Amount</div>
                      <div className="payment-work-value">₹{pending.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="payment-work-label">Payment Status</div>
                      <div className={`payment-status ${pending === 0 ? "done" : "pending"}`}>
                        {pending === 0 ? "✅ Completed" : "⏳ Pending"}
                      </div>
                    </div>
                  </div>

                  {pay.addedBy && (
                    <div className="payment-work-setup-info">
                      💼 Payment plan created by: <strong>{pay.addedBy}</strong> | 📅 {pay.date} ⏰ {pay.time}
                    </div>
                  )}

                  {/* Add payment for this work */}
                  {pending > 0 && (
                    <div className="payment-add-section">
                      <div className="payment-add-row">
                        <div className="material-dropdown-container payment-mode-dropdown" style={{zIndex: 999}}>
                          <button
                            type="button"
                            className="material-dropdown-header"
                            onClick={() => setOpenPaymentModeDropdown(openPaymentModeDropdown === displayIdx ? null : displayIdx)}
                          >
                            <span>
                              {paymentComments[displayIdx + "_mode"] || paymentMode || "Select Payment Mode"}
                            </span>
                            <ChevronDown className="icon" />
                          </button>
                          {openPaymentModeDropdown === displayIdx && (
                            <div className="material-dropdown-list" style={{zIndex: 1000}}>
                              <div className="material-dropdown-scroll">
                                {paymentModes.map((mode, i) => (
                                  <div
                                    key={i}
                                    className="material-dropdown-item"
                                    onClick={() => {
                                      setPaymentMode(mode);
                                      setPaymentComments(prev => ({ ...prev, [displayIdx + "_mode"]: mode }));
                                      setOpenPaymentModeDropdown(null);
                                    }}
                                  >
                                    💳 {mode}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          className="material-qty-input"
                          value={paymentComments[displayIdx] || ""}
                          onChange={(e) => setPaymentComments(prev => ({ ...prev, [displayIdx]: e.target.value }))}
                          placeholder="Enter payment description/comment..."
                        />
                        <button
                          className="add-btn"
                          onClick={() => handleAddPayment(displayIdx)}
                          disabled={!(paymentComments[displayIdx + "_mode"] || paymentMode) || !paymentComments[displayIdx] || savingPayment}
                        >
                          {savingPayment ? <span className="loader-white"></span> : null}
                          💰 Record Payment
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of payments - Show latest payments first */}
                  <div className="payment-records-list">
                    {[...(pay.paid || [])].reverse().map((p, i) => (
                      <div key={i} className="payment-paid-row">
                        <div>
                          <div className="payment-paid-label">💰 Amount Paid</div>
                          <div className="payment-paid-value">₹{p.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="payment-paid-label">💳 Payment Mode</div>
                          <div className="payment-paid-value">{p.mode}</div>
                        </div>
                        <div>
                          <div className="payment-paid-label">💬 Comment</div>
                          <div className="payment-paid-value">{p.comment}</div>
                        </div>
                        <div>
                          <div className="payment-paid-label">📅 Date</div>
                          <div className="payment-paid-value">{p.date}</div>
                        </div>
                        <div>
                          <div className="payment-paid-label">⏰ Time</div>
                          <div className="payment-paid-value">{p.time}</div>
                        </div>
                        {p.addedBy && (
                          <div>
                            <div className="payment-paid-label">👤 Recorded By</div>
                            <div className="payment-paid-value">{p.addedBy}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {paymentList.length === 0 && (
              <div className="payment-empty-state">
                <div className="empty-icon">💰</div>
                <h5>No Payment Plans Created</h5>
                <p>Create a payment plan for your customer's work above to start tracking payments</p>
              </div>
            )}
          </div>

          {/* Activity Tab */}
          <div className={`profile-details-con ${stage === 'activity' ? '' : 'd-none'}`}>
            <div className="activity-list">
              <h4>Activity Timeline</h4>
              <div className="manual-activity-add-row">
                <input
                  type="text"
                  placeholder="Enter activity description..."
                  value={manualActivityInput}
                  onChange={(e) => setManualActivityInput(e.target.value)}
                  className="manual-activity-input"
                />
                <button className="add-btn" onClick={handleAddManualActivity} disabled={loading}>
                  {loading ? <span className="loader-white"></span> : null}
                  Add Activity
                </button>
              </div>
              
              {(customer.activity || []).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No Activities</div>
                  <div className="empty-state-text">Activity timeline will appear here</div>
                </div>
              ) : (
                // Show latest activities first by reversing the array
                [...(customer.activity || [])].reverse().map((act, idx) => (
                  <div key={idx} className="activity-item">
                    <span className="activity-name">{act.name}</span>
                    <span className="activity-type">{act.type}</span>
                    <span className="activity-date">📅 {act.date}</span>
                    <span className="activity-time">⏰ {act.time}</span>
                    {act.quantity && <span className="activity-qty">📦 Qty: {act.quantity}</span>}
                    {act.amount && <span className="activity-qty">💰 Amount: ₹{act.amount}</span>}
                    {act.work && <span className="activity-qty">🔧 Work: {act.work}</span>}
                    {act.mode && <span className="activity-qty">💳 Mode: {act.mode}</span>}
                    {act.addedBy && (
                      <span className="activity-qty" style={{ color: 'var(--blue)', fontWeight: 700 }}>
                        👤 By: {act.addedBy}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDetails;