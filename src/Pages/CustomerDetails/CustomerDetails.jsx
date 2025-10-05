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

const CustomerDetails = () => {
  const { customerid } = useParams();
  const { userDetails } = useAppContext(); // Get user details from context
  const [customer, setCustomer] = useState(null);
  const [stage, setStage] = useState('profile');
  const [workInput, setWorkInput] = useState("");
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

  // Add work
  const handleAddWork = async () => {
    if (!workInput.trim()) return;
    setLoading(true);
    try {
      const docRef = doc(db, "Customers", customerid);
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      const newWork = [...(customer.work || []), {
        name: workInput.trim(),
        addedBy: username,
        date: currentDate,
        time: currentTime
      }];
      
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "work",
          name: workInput.trim(),
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
      
      setWorkInput("");
      toast.success("Work added!");
    } catch (err) {
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
    if (!selectedMaterial || !materialQty || isNaN(materialQty) || materialQty <= 0) return;
    
    // Check if there's enough material in stock
    const currentStock = selectedMaterial.remaining || selectedMaterial.quantity || 0;
    if (Number(materialQty) > currentStock) {
      toast.error(`Not enough material in stock. Available: ${currentStock}`);
      return;
    }
    
    setSavingMaterial(true);
    try {
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const username = userDetails?.name || "Unknown User";
      
      // Update material quantity in Materials collection
      const materialDocRef = doc(db, "Materials", selectedMaterial.id);
      const newQty = currentStock - Number(materialQty);
      
      // Update both quantity and remaining fields
      await updateDoc(materialDocRef, { 
        quantity: newQty,
        remaining: newQty
      });

      // Update customer materialUsed array
      const docRef = doc(db, "Customers", customerid);
      const newMaterialUsed = [
        ...(customer.materialUsed || []),
        {
          name: selectedMaterial.name,
          quantity: Number(materialQty),
          work: selectedWork || "",
          addedBy: username,
          date: currentDate,
          time: currentTime,
        },
      ];

      // Add activity
      const newActivity = [
        ...(customer.activity || []),
        {
          type: "material",
          name: selectedMaterial.name,
          quantity: Number(materialQty),
          work: selectedWork || "",
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
            ? { ...mat, quantity: newQty, remaining: newQty }
            : mat
        )
      );
      
      setSelectedMaterial(null);
      setMaterialQty("");
      setSelectedWork(null);
      setMaterialDropdownOpen(false);
      setShowWorkDropdown(false);
      toast.success(`Material added! New stock: ${newQty}`);
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

          {/* Work Tab */}
          <div className={`profile-details-con ${stage === 'work' ? '' : 'd-none'}`}>
            <div className="work-list">
              <h4>Work Management</h4>
              <div className="work-add-row">
                <input
                  type="text"
                  placeholder="Enter work name..."
                  value={workInput}
                  onChange={(e) => setWorkInput(e.target.value)}
                  className="work-input"
                />
                <button className="add-btn" onClick={handleAddWork} disabled={loading}>
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
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--txt-dark)' }}>
                      {typeof work === 'string' ? work : work.name}
                    </div>
                    {typeof work === 'object' && work.addedBy && (
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
                {/* Work Dropdown */}
                <div className="material-dropdown-container">
                  <button
                    type="button"
                    className="material-dropdown-header"
                    onClick={() => setShowWorkDropdown((open) => !open)}
                  >
                    <span>
                      {selectedWork ? (typeof selectedWork === 'string' ? selectedWork : selectedWork.name) : "Choose Work"}
                    </span>
                    <span className="icon">▼</span>
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
                                setSelectedWork(typeof work === 'string' ? work : work.name);
                                setShowWorkDropdown(false);
                              }}
                            >
                              {typeof work === 'string' ? work : work.name}
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
                      {selectedMaterial ? selectedMaterial.name : "Choose Material"}
                    </span>
                    <span className="icon">▼</span>
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
                          filteredMaterials.map((mat) => (
                            <div
                              key={mat.id}
                              className="material-dropdown-item"
                              onClick={() => {
                                setSelectedMaterial(mat);
                                setMaterialDropdownOpen(false);
                                setMaterialSearch("");
                              }}
                            >
                              {mat.name}
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
                  value={materialQty}
                  onChange={(e) => setMaterialQty(e.target.value)}
                  min="1"
                  placeholder="Quantity"
                  disabled={!selectedMaterial}
                />
                <button
                  className="add-btn"
                  onClick={handleAddMaterialUsed}
                  disabled={!selectedMaterial || !materialQty || savingMaterial}
                >
                  {savingMaterial ? <span className="loader-white"></span> : null}
                  Add Material
                </button>
              </div>
              
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
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--txt-dark)' }}>
                      📦 {mat.name} - Qty: {mat.quantity} {mat.work ? `| Work: ${mat.work}` : ""}
                    </div>
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

            {/* Add payment info for work */}
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
                              setSelectedPaymentWork(typeof work === 'string' ? work : work.name);
                              setShowPaymentWorkDropdown(false);
                            }}
                          >
                            {typeof work === 'string' ? work : work.name}
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