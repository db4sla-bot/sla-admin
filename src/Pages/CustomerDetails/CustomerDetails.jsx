import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { db } from '../../Firebase';
import './CustomerDetails.css';
import Hamburger from '../../Components/Hamburger/Hamburger';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  Save, 
  X,
  Briefcase,
  Package,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Hash,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  ClipboardList
} from 'lucide-react';
import { toast } from 'react-toastify';

const CustomerDetails = () => {
  const { customerid } = useParams();
  const navigate = useNavigate();
  const customerId = customerid; // Map to consistent variable name
  
  // State for customer data
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Edit states
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India'
  });
  
  // Work states
  const [workForm, setWorkForm] = useState({
    workTitle: '',
    category: ''
  });
  const [works, setWorks] = useState([]);
  const [savingWork, setSavingWork] = useState(false);
  
  // Materials states
  const [materials, setMaterials] = useState([]);
  const [selectedWork, setSelectedWork] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialQuantity, setMaterialQuantity] = useState('');
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [customerMaterials, setCustomerMaterials] = useState([]);
  const [savingMaterial, setSavingMaterial] = useState(false);
  
  // Payment states
  const [payments, setPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    workId: '',
    totalAmount: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);
  
  // Installment states
  const [installmentForm, setInstallmentForm] = useState({
    paymentId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    notes: ''
  });
  const [savingInstallment, setSavingInstallment] = useState(false);
  const [showInstallmentForm, setShowInstallmentForm] = useState(false);
  
  // Expenses states
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    workId: '',
    expenseType: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [savingExpense, setSavingExpense] = useState(false);
  
  // Activity states
  const [activities, setActivities] = useState([]);
  const [manualActivityForm, setManualActivityForm] = useState({
    title: '',
    description: '',
    type: 'note'
  });
  const [showActivityForm, setShowActivityForm] = useState(false);
  
  const serviceCategories = [
    'Invisible Grills',
    'Mosquito Mesh',
    'Cloth Hangers',
    'Artificial Grass',
    'Bird Spikes'
  ];
  
  const paymentModes = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque'];
  const expenseTypes = ['Labour', 'Transportation', 'Tools', 'Miscellaneous', 'Other'];

  useEffect(() => {
    fetchCustomerData();
    fetchMaterials();
  }, [customerId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMaterialDropdown && !event.target.closest('.customer-dropdown-container')) {
        setShowMaterialDropdown(false);
      }
    };

    if (showMaterialDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMaterialDropdown]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const customerRef = doc(db, 'Customers', customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (customerSnap.exists()) {
        const data = customerSnap.data();
        setCustomer(data);
        setProfileForm({
          name: data.name || '',
          mobile: data.mobile || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'India'
        });
        setWorks(Array.isArray(data.works) ? data.works : []);
        setCustomerMaterials(Array.isArray(data.materials) ? data.materials : []);
        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
        setActivities(Array.isArray(data.activities) ? data.activities : []);
      } else {
        toast.error('Customer not found!');
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast.error('Failed to load customer data');
    }
    setLoading(false);
  };

  const fetchMaterials = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Materials'));
      const materialsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      materialsList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  // Profile handlers
  const handleProfileSave = async () => {
    try {
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        ...profileForm,
        updatedAt: new Date().toISOString()
      });
      
      setCustomer(prev => ({ ...prev, ...profileForm }));
      setEditProfile(false);
      toast.success('Profile updated successfully!');
      
      // Log activity (don't await to avoid blocking)
      addActivity('profile', 'Profile Updated', `Customer profile information was updated`).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
    }
  };

  // Work handlers
  const handleSaveWork = async () => {
    if (!workForm.workTitle || !workForm.category) {
      toast.error('Please fill all work fields');
      return;
    }
    
    setSavingWork(true);
    try {
      const newWork = {
        id: Date.now().toString(),
        title: workForm.workTitle,
        category: workForm.category,
        createdAt: new Date().toISOString(),
        status: 'ongoing'
      };
      
      const updatedWorks = [...works, newWork];
      
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        works: updatedWorks
      });
      
      setWorks(updatedWorks);
      setWorkForm({ workTitle: '', category: '' });
      toast.success('Work added successfully!');
      
      // Log activity (don't await to avoid blocking)
      addActivity('work', 'Work Added', `New work added: ${newWork.title} (${newWork.category})`).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      console.error('Error adding work:', error);
      toast.error(`Failed to add work: ${error.message}`);
    }
    setSavingWork(false);
  };

  // Material handlers
  const getFilteredMaterials = () => {
    return materials.filter(material =>
      material.name?.toLowerCase().includes(materialSearchTerm.toLowerCase())
    );
  };

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material);
    setShowMaterialDropdown(false);
    setMaterialSearchTerm('');
  };

  const handleSaveMaterial = async () => {
    if (!selectedWork || !selectedMaterial || !materialQuantity) {
      toast.error('Please fill all material fields');
      return;
    }
    
    const qty = parseFloat(materialQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }
    
    // Validate material price
    const unitPrice = Number(selectedMaterial.price) || 0;
    if (unitPrice === 0) {
      toast.warning('Material price is not set. Cost will be recorded as ₹0');
    }
    
    // Check if sufficient quantity is available
    const availableQty = Number(selectedMaterial.quantity) || 0;
    if (qty > availableQty) {
      toast.error(`Insufficient quantity! Available: ${availableQty} units`);
      return;
    }
    
    setSavingMaterial(true);
    try {
      const work = works.find(w => w.id === selectedWork);
      const totalCost = unitPrice * qty;
      
      const newMaterial = {
        id: Date.now().toString(),
        workId: selectedWork,
        workTitle: work?.title || '',
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name || 'Unknown Material',
        category: selectedMaterial.category || 'Uncategorized',
        quantity: qty,
        unitPrice: unitPrice,
        totalCost: totalCost,
        addedAt: new Date().toISOString()
      };
      
      const updatedMaterials = [...customerMaterials, newMaterial];
      
      // Update customer materials
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        materials: updatedMaterials,
        updatedAt: new Date().toISOString()
      });
      
      // Decrease material quantity in Materials collection
      const materialRef = doc(db, 'Materials', selectedMaterial.id);
      const newQuantity = availableQty - qty;
      await updateDoc(materialRef, {
        quantity: newQuantity,
        updatedAt: new Date().toISOString()
      });
      
      // Update local materials state to reflect new quantity
      setMaterials(prevMaterials => 
        prevMaterials.map(m => 
          m.id === selectedMaterial.id 
            ? { ...m, quantity: newQuantity }
            : m
        )
      );
      
      setCustomerMaterials(updatedMaterials);
      setSelectedWork('');
      setSelectedMaterial(null);
      setMaterialQuantity('');
      toast.success(`Material added successfully! Remaining stock: ${newQuantity} units`);
      
      // Log activity (don't await to avoid blocking)
      addActivity('material', 'Material Added', `Added ${qty} units of ${selectedMaterial.name || 'material'} for ${work?.title || 'work'}. Remaining stock: ${newQuantity}`).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error(`Failed to add material: ${error.message}`);
    }
    setSavingMaterial(false);
  };

  // Payment handlers
  const handleSavePayment = async () => {
    if (!paymentForm.workId || !paymentForm.totalAmount) {
      toast.error('Please select work and enter total amount');
      return;
    }
    
    setSavingPayment(true);
    try {
      const work = works.find(w => w.id === paymentForm.workId);
      const newPayment = {
        id: Date.now().toString(),
        workId: paymentForm.workId,
        workTitle: work?.title || '',
        totalAmount: parseFloat(paymentForm.totalAmount),
        installments: [],
        createdAt: new Date().toISOString()
      };
      
      const updatedPayments = [...payments, newPayment];
      
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        payments: updatedPayments,
        updatedAt: new Date().toISOString()
      });
      
      setPayments(updatedPayments);
      setPaymentForm({
        workId: '',
        totalAmount: ''
      });
      toast.success('Payment record created successfully!');
      
      // Log activity (don't await to avoid blocking)
      addActivity('payment', 'Payment Record Created', `Payment record created for ${work?.title} - Total: ₹${newPayment.totalAmount}`).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      console.error('Error creating payment record:', error);
      toast.error(`Failed to create payment record: ${error.message}`);
    }
    setSavingPayment(false);
  };

  const handleSaveInstallment = async () => {
    if (!installmentForm.paymentId || !installmentForm.amount) {
      toast.error('Please enter installment amount');
      return;
    }
    
    setSavingInstallment(true);
    try {
      const payment = payments.find(p => p.id === installmentForm.paymentId);
      if (!payment) {
        toast.error('Payment record not found');
        setSavingInstallment(false);
        return;
      }

      const totalPaid = (payment.installments || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
      const newInstallmentAmount = parseFloat(installmentForm.amount);
      
      if (totalPaid + newInstallmentAmount > Number(payment.totalAmount)) {
        toast.error('Installment amount exceeds remaining balance!');
        setSavingInstallment(false);
        return;
      }

      const newInstallment = {
        id: Date.now().toString(),
        amount: newInstallmentAmount,
        paymentDate: installmentForm.paymentDate,
        paymentMode: installmentForm.paymentMode,
        notes: installmentForm.notes,
        createdAt: new Date().toISOString()
      };
      
      const updatedPayments = payments.map(p => {
        if (p.id === installmentForm.paymentId) {
          return {
            ...p,
            installments: [...(p.installments || []), newInstallment]
          };
        }
        return p;
      });
      
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        payments: updatedPayments,
        updatedAt: new Date().toISOString()
      });
      
      setPayments(updatedPayments);
      setInstallmentForm({
        paymentId: '',
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        notes: ''
      });
      setShowInstallmentForm(false);
      toast.success('Installment added successfully!');
      
      // Log activity (don't await to avoid blocking)
      addActivity('payment', 'Installment Added', `Payment of ₹${newInstallmentAmount} received for ${payment.workTitle}`).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      console.error('Error adding installment:', error);
      toast.error(`Failed to add installment: ${error.message}`);
    }
    setSavingInstallment(false);
  };

  // Expense handlers
  const handleSaveExpense = async () => {
    if (!expenseForm.workId || !expenseForm.expenseType || !expenseForm.amount) {
      toast.error('Please fill all expense fields');
      return;
    }
    
    setSavingExpense(true);
    try {
      const work = works.find(w => w.id === expenseForm.workId);
      const newExpense = {
        id: Date.now().toString(),
        workId: expenseForm.workId,
        workTitle: work?.title || '',
        expenseType: expenseForm.expenseType,
        amount: parseFloat(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
        description: expenseForm.description,
        createdAt: new Date().toISOString()
      };
      
      const updatedExpenses = [...expenses, newExpense];
      
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString()
      });
      
      setExpenses(updatedExpenses);
      setExpenseForm({
        workId: '',
        expenseType: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      toast.success('Expense added successfully!');
      
      // Log activity (don't await to avoid blocking)
      addActivity('expense', 'Expense Added', `${expenseForm.expenseType} expense of ₹${expenseForm.amount} for ${work?.title}`).catch(err => {
        console.error('Failed to log activity:', err);
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error(`Failed to add expense: ${error.message}`);
    }
    setSavingExpense(false);
  };

  // Activity handler
  const addActivity = async (type, title, description) => {
    try {
      const newActivity = {
        id: Date.now().toString(),
        type,
        title,
        description,
        timestamp: new Date().toISOString()
      };
      
      const customerRef = doc(db, 'Customers', customerId);
      await updateDoc(customerRef, {
        activities: arrayUnion(newActivity)
      });
      
      setActivities(prev => [newActivity, ...prev]);
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const handleAddManualActivity = async () => {
    if (!manualActivityForm.title) {
      toast.error('Please enter activity title');
      return;
    }
    
    try {
      await addActivity(manualActivityForm.type, manualActivityForm.title, manualActivityForm.description);
      setManualActivityForm({ title: '', description: '', type: 'note' });
      setShowActivityForm(false);
      toast.success('Activity added successfully!');
    } catch (error) {
      console.error('Error adding manual activity:', error);
      toast.error('Failed to add activity');
    }
  };

  // Analytics calculations
  const getWorkAnalytics = (workId) => {
    const workMaterials = customerMaterials.filter(m => m.workId === workId);
    const workPayments = payments.filter(p => p.workId === workId);
    const workExpenses = expenses.filter(e => e.workId === workId);
    
    const materialsCost = workMaterials.reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0);
    const totalExpenses = workExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCost = materialsCost + totalExpenses;
    
    const totalRevenue = workPayments.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    const totalReceived = workPayments.reduce((sum, p) => {
      const installments = p.installments || [];
      return sum + installments.reduce((iSum, inst) => iSum + (Number(inst.amount) || 0), 0);
    }, 0);
    const balance = totalRevenue - totalReceived;
    
    const profit = totalReceived - totalCost;
    const profitPercentage = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;
    
    return {
      materialsCost,
      totalExpenses,
      totalCost,
      totalRevenue,
      totalReceived,
      balance,
      profit,
      profitPercentage,
      materialsCount: workMaterials.length,
      expensesCount: workExpenses.length
    };
  };

  const getOverallAnalytics = () => {
    const totalMaterialsCost = customerMaterials.reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0);
    const totalExpensesAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCost = totalMaterialsCost + totalExpensesAmount;
    
    const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    const totalReceived = payments.reduce((sum, p) => {
      const installments = p.installments || [];
      return sum + installments.reduce((iSum, inst) => iSum + (Number(inst.amount) || 0), 0);
    }, 0);
    const totalBalance = totalRevenue - totalReceived;
    
    const totalProfit = totalReceived - totalCost;
    const profitPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;
    
    return {
      totalMaterialsCost,
      totalExpensesAmount,
      totalCost,
      totalRevenue,
      totalReceived,
      totalBalance,
      totalProfit,
      profitPercentage
    };
  };

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Customer Details</h1>
          </div>
        </div>
        <div className="customer-details-loading">
          <div className="customer-details-loading-spinner"></div>
          <p>Loading customer details...</p>
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Customer Details</h1>
          </div>
        </div>
        <div className="customer-details-error">
          <AlertCircle size={48} />
          <h3>Customer Not Found</h3>
          <button onClick={() => navigate('/customers')} className="customer-details-back-btn">
            Back to Customers
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1>{customer.name}</h1>
        </div>
      </div>

      <div className="customer-details-container">
        {/* Header Card */}
        <div className="customer-details-header">
          <div className="customer-header-left">
            <div className="customer-avatar">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div className="customer-header-info">
              <h2>{customer.name}</h2>
              <div className="customer-quick-info">
                {customer.mobile && (
                  <span><Phone size={14} /> {customer.mobile}</span>
                )}
                {customer.email && (
                  <span><Mail size={14} /> {customer.email}</span>
                )}
                {customer.city && (
                  <span><MapPin size={14} /> {customer.city}</span>
                )}
              </div>
            </div>
          </div>
          <div className="customer-header-stats">
            <div className="customer-stat-card">
              <Briefcase size={20} />
              <div>
                <p>{works.length}</p>
                <span>Works</span>
              </div>
            </div>
            <div className="customer-stat-card">
              <Package size={20} />
              <div>
                <p>{customerMaterials.length}</p>
                <span>Materials</span>
              </div>
            </div>
            <div className="customer-stat-card">
              <IndianRupee size={20} />
              <div>
                <p>₹{getOverallAnalytics().totalReceived.toLocaleString()}</p>
                <span>Received</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="customer-tabs-navigation">
          <button
            className={`customer-tab-button ${activeTab === 'profile' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profile
          </button>
          <button
            className={`customer-tab-button ${activeTab === 'work' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            <Briefcase size={18} />
            Work
          </button>
          <button
            className={`customer-tab-button ${activeTab === 'materials' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <Package size={18} />
            Materials
          </button>
          <button
            className={`customer-tab-button ${activeTab === 'payment' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <IndianRupee size={18} />
            Payment
          </button>
          <button
            className={`customer-tab-button ${activeTab === 'expenses' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <DollarSign size={18} />
            Expenses
          </button>
          <button
            className={`customer-tab-button ${activeTab === 'analytics' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} />
            Analytics
          </button>
          <button
            className={`customer-tab-button ${activeTab === 'activity' ? 'customer-tab-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={18} />
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="customer-tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="customer-profile-section">
              <div className="customer-section-header">
                <h3>Customer Information</h3>
                {!editProfile ? (
                  <button
                    className="customer-edit-btn"
                    onClick={() => setEditProfile(true)}
                  >
                    <Edit size={16} /> Edit Profile
                  </button>
                ) : (
                  <div className="customer-action-buttons">
                    <button
                      className="customer-save-btn"
                      onClick={handleProfileSave}
                    >
                      <Save size={16} /> Save
                    </button>
                    <button
                      className="customer-cancel-btn"
                      onClick={() => {
                        setEditProfile(false);
                        setProfileForm({
                          name: customer.name || '',
                          mobile: customer.mobile || '',
                          email: customer.email || '',
                          address: customer.address || '',
                          city: customer.city || '',
                          state: customer.state || '',
                          country: customer.country || 'India'
                        });
                      }}
                    >
                      <X size={16} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="customer-profile-grid">
                <div className="customer-form-group">
                  <label>Name</label>
                  <div className="customer-input-wrapper">
                    <User size={18} />
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!editProfile}
                    />
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>Mobile</label>
                  <div className="customer-input-wrapper">
                    <Phone size={18} />
                    <input
                      type="text"
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, mobile: e.target.value }))}
                      disabled={!editProfile}
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>Email</label>
                  <div className="customer-input-wrapper">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!editProfile}
                    />
                  </div>
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Address</label>
                  <div className="customer-input-wrapper">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!editProfile}
                    />
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>City</label>
                  <div className="customer-input-wrapper">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                      disabled={!editProfile}
                    />
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>State</label>
                  <div className="customer-input-wrapper">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={profileForm.state}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value }))}
                      disabled={!editProfile}
                    />
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>Country</label>
                  <div className="customer-input-wrapper">
                    <MapPin size={18} />
                    <input
                      type="text"
                      value={profileForm.country}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                      disabled={!editProfile}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Tab */}
          {activeTab === 'work' && (
            <div className="customer-work-section">
              <div className="customer-section-header">
                <h3>Work Management</h3>
              </div>

              {/* Add Work Form */}
              <div className="customer-add-form">
                <div className="customer-form-row">
                  <div className="customer-form-group">
                    <label>Work Title *</label>
                    <input
                      type="text"
                      placeholder="Enter work title"
                      value={workForm.workTitle}
                      onChange={(e) => setWorkForm(prev => ({ ...prev, workTitle: e.target.value }))}
                    />
                  </div>

                  <div className="customer-form-group">
                    <label>Service Category *</label>
                    <select
                      value={workForm.category}
                      onChange={(e) => setWorkForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="">Select Category</option>
                      {serviceCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="customer-add-btn"
                    onClick={handleSaveWork}
                    disabled={savingWork}
                  >
                    {savingWork ? 'Saving...' : <><Plus size={16} /> Add Work</>}
                  </button>
                </div>
              </div>

              {/* Works List */}
              <div className="customer-works-list">
                <h4>All Works ({works.length})</h4>
                {works.length === 0 ? (
                  <div className="customer-empty-state">
                    <Briefcase size={48} />
                    <p>No works added yet</p>
                  </div>
                ) : (
                  <div className="customer-works-grid">
                    {works.map(work => (
                      <div key={work.id} className="customer-work-card">
                        <div className="customer-work-header">
                          <h5>{work.title}</h5>
                          <span className={`customer-work-status ${work.status}`}>
                            {work.status}
                          </span>
                        </div>
                        <p className="customer-work-category">{work.category}</p>
                        <p className="customer-work-date">
                          <Calendar size={14} />
                          {new Date(work.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="customer-materials-section">
              <div className="customer-section-header">
                <h3>Materials Management</h3>
              </div>

              {/* Add Material Form */}
              <div className="customer-add-form">
                <div className="customer-form-row">
                  <div className="customer-form-group">
                    <label>Select Work *</label>
                    <select
                      value={selectedWork}
                      onChange={(e) => setSelectedWork(e.target.value)}
                    >
                      <option value="">Choose Work</option>
                      {works.map(work => (
                        <option key={work.id} value={work.id}>{work.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="customer-form-group">
                    <label>Material *</label>
                    <div className="customer-dropdown-container">
                      <div
                        className={`customer-dropdown-header ${showMaterialDropdown ? 'active' : ''}`}
                        onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
                      >
                        <span>
                          {selectedMaterial ? `${selectedMaterial.name} (Available: ${Number(selectedMaterial.quantity) || 0})` : 'Select Material'}
                        </span>
                        <ChevronDown size={16} className={showMaterialDropdown ? 'rotated' : ''} />
                      </div>
                      {showMaterialDropdown && (
                        <div className="customer-dropdown-menu">
                          <div className="customer-dropdown-search">
                            <Search size={16} />
                            <input
                              type="text"
                              placeholder="Search materials..."
                              value={materialSearchTerm}
                              onChange={(e) => setMaterialSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="customer-dropdown-options">
                            {getFilteredMaterials().length === 0 ? (
                              <div className="customer-dropdown-empty">No materials found</div>
                            ) : (
                              getFilteredMaterials().map(material => {
                                const availableQty = Number(material.quantity) || 0;
                                const isOutOfStock = availableQty <= 0;
                                
                                return (
                                  <div
                                    key={material.id}
                                    className={`customer-dropdown-option ${isOutOfStock ? 'out-of-stock' : ''}`}
                                    onClick={() => !isOutOfStock && handleMaterialSelect(material)}
                                    style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                                  >
                                    <Package size={14} />
                                    <div>
                                      <p>{material.name}</p>
                                      <span>
                                        ₹{material.price || 0} • {material.category || 'N/A'} • 
                                        <strong style={{ color: isOutOfStock ? '#ef4444' : availableQty < 10 ? '#f59e0b' : '#10b981', marginLeft: '4px' }}>
                                          Stock: {availableQty}
                                        </strong>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="customer-form-group">
                    <label>Quantity * {selectedMaterial && `(Available: ${Number(selectedMaterial.quantity) || 0})`}</label>
                    <input
                      type="number"
                      placeholder="Enter quantity"
                      value={materialQuantity}
                      onChange={(e) => setMaterialQuantity(e.target.value)}
                      min="0"
                      step="0.01"
                      max={selectedMaterial ? Number(selectedMaterial.quantity) || 0 : undefined}
                    />
                  </div>

                  <button
                    className="customer-add-btn"
                    onClick={handleSaveMaterial}
                    disabled={savingMaterial}
                  >
                    {savingMaterial ? 'Saving...' : <><Plus size={16} /> Add Material</>}
                  </button>
                </div>
              </div>

              {/* Materials List */}
              <div className="customer-materials-list">
                <h4>Used Materials ({customerMaterials.length})</h4>
                {customerMaterials.length === 0 ? (
                  <div className="customer-empty-state">
                    <Package size={48} />
                    <p>No materials added yet</p>
                  </div>
                ) : (
                  <div className="customer-table-wrapper">
                    <table className="customer-table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Work</th>
                          <th>Category</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total Cost</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerMaterials.map(material => {
                          const unitPrice = Number(material.unitPrice) || 0;
                          const totalCost = Number(material.totalCost) || 0;
                          
                          return (
                            <tr key={material.id}>
                              <td>{material.materialName}</td>
                              <td>{material.workTitle}</td>
                              <td><span className="customer-badge">{material.category}</span></td>
                              <td>{material.quantity}</td>
                              <td>₹{unitPrice.toLocaleString()}</td>
                              <td className="customer-amount">₹{totalCost.toLocaleString()}</td>
                              <td>{new Date(material.addedAt).toLocaleDateString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {customerMaterials.length > 0 && (
                  <div className="customer-total-summary">
                    <span>Total Materials Cost:</span>
                    <strong>₹{customerMaterials.reduce((sum, m) => sum + (Number(m.totalCost) || 0), 0).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="customer-payment-section">
              <div className="customer-section-header">
                <h3>Payment Management</h3>
              </div>

              {/* Create Payment Record Form */}
              <div className="customer-add-form">
                <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 700 }}>Create Payment Record</h4>
                <div className="customer-form-grid">
                  <div className="customer-form-group">
                    <label>Select Work *</label>
                    <select
                      value={paymentForm.workId}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, workId: e.target.value }))}
                    >
                      <option value="">Choose Work</option>
                      {works.map(work => (
                        <option key={work.id} value={work.id}>{work.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="customer-form-group">
                    <label>Total Work Amount *</label>
                    <div className="customer-input-wrapper">
                      <IndianRupee size={16} />
                      <input
                        type="number"
                        placeholder="Enter total work amount"
                        value={paymentForm.totalAmount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="customer-add-btn customer-add-btn-full"
                  onClick={handleSavePayment}
                  disabled={savingPayment}
                >
                  {savingPayment ? 'Creating...' : <><Plus size={16} /> Create Payment Record</>}
                </button>
              </div>

              {/* Add Installment Form */}
              {showInstallmentForm && (
                <div className="customer-add-form" style={{ marginTop: '24px', background: '#fff3cd', borderColor: '#ffc107' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Add Installment Payment</h4>
                    <button
                      className="customer-cancel-btn"
                      onClick={() => {
                        setShowInstallmentForm(false);
                        setInstallmentForm({
                          paymentId: '',
                          amount: '',
                          paymentDate: new Date().toISOString().split('T')[0],
                          paymentMode: 'Cash',
                          notes: ''
                        });
                      }}
                      style={{ padding: '6px 12px' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="customer-form-grid">
                    <div className="customer-form-group">
                      <label>Select Payment Record *</label>
                      <select
                        value={installmentForm.paymentId}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, paymentId: e.target.value }))}
                      >
                        <option value="">Choose Payment Record</option>
                        {payments.map(payment => {
                          const totalPaid = (payment.installments || []).reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
                          const remaining = Number(payment.totalAmount) - totalPaid;
                          return (
                            <option key={payment.id} value={payment.id}>
                              {payment.workTitle} - Remaining: ₹{remaining.toLocaleString()}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="customer-form-group">
                      <label>Amount Received *</label>
                      <div className="customer-input-wrapper">
                        <IndianRupee size={16} />
                        <input
                          type="number"
                          placeholder="Enter amount received"
                          value={installmentForm.amount}
                          onChange={(e) => setInstallmentForm(prev => ({ ...prev, amount: e.target.value }))}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="customer-form-group">
                      <label>Payment Date *</label>
                      <input
                        type="date"
                        value={installmentForm.paymentDate}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                      />
                    </div>

                    <div className="customer-form-group">
                      <label>Payment Mode *</label>
                      <select
                        value={installmentForm.paymentMode}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                      >
                        {paymentModes.map(mode => (
                          <option key={mode} value={mode}>{mode}</option>
                        ))}
                      </select>
                    </div>

                    <div className="customer-form-group customer-form-full">
                      <label>Notes</label>
                      <input
                        type="text"
                        placeholder="Add notes (optional)"
                        value={installmentForm.notes}
                        onChange={(e) => setInstallmentForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button
                    className="customer-add-btn customer-add-btn-full"
                    onClick={handleSaveInstallment}
                    disabled={savingInstallment}
                  >
                    {savingInstallment ? 'Saving...' : <><Plus size={16} /> Add Installment</>}
                  </button>
                </div>
              )}

              {/* Payments List */}
              <div className="customer-payments-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0 }}>Payment Records ({payments.length})</h4>
                  {payments.length > 0 && !showInstallmentForm && (
                    <button
                      className="customer-add-btn"
                      onClick={() => setShowInstallmentForm(true)}
                      style={{ padding: '8px 16px' }}
                    >
                      <Plus size={16} /> Add Installment
                    </button>
                  )}
                </div>
                {payments.length === 0 ? (
                  <div className="customer-empty-state">
                    <IndianRupee size={48} />
                    <p>No payment records created yet</p>
                  </div>
                ) : (
                  <>
                    <div className="customer-payment-cards">
                      {payments.map(payment => {
                        const totalAmount = Number(payment.totalAmount) || 0;
                        const installments = payment.installments || [];
                        const totalPaid = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
                        const balance = totalAmount - totalPaid;
                        const paymentStatus = balance === 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Pending';
                        
                        return (
                          <div key={payment.id} className="customer-payment-card">
                            <div className="customer-payment-header">
                              <h5>{payment.workTitle}</h5>
                              <span className={`customer-payment-mode ${
                                paymentStatus === 'Paid' ? 'status-paid' : 
                                paymentStatus === 'Partial' ? 'status-partial' : 'status-pending'
                              }`}>
                                {paymentStatus}
                              </span>
                            </div>
                            <div className="customer-payment-details">
                              <div className="customer-payment-row">
                                <span>Total Amount:</span>
                                <strong>₹{totalAmount.toLocaleString()}</strong>
                              </div>
                              <div className="customer-payment-row success">
                                <span>Amount Paid:</span>
                                <strong>₹{totalPaid.toLocaleString()}</strong>
                              </div>
                              <div className={`customer-payment-row ${balance > 0 ? 'warning' : 'success'}`}>
                                <span>Balance:</span>
                                <strong>₹{balance.toLocaleString()}</strong>
                              </div>
                              <div className="customer-payment-row">
                                <span>Installments:</span>
                                <strong>{installments.length}</strong>
                              </div>
                            </div>
                            
                            {installments.length > 0 && (
                              <div className="customer-installments-list">
                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--txt-dark)', margin: '12px 0 8px 0', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                  Installment History:
                                </p>
                                {installments.map((inst, index) => (
                                  <div key={inst.id} className="customer-installment-item">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                      <span style={{ fontSize: '12px', color: 'var(--txt-light)' }}>
                                        #{index + 1} - {inst.paymentMode}
                                      </span>
                                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
                                        ₹{Number(inst.amount).toLocaleString()}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--txt-light)' }}>
                                      <span>{new Date(inst.paymentDate).toLocaleDateString()}</span>
                                      {inst.notes && <span>{inst.notes}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="customer-payment-footer">
                              <span><Calendar size={14} /> Created: {new Date(payment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="customer-payment-summary">
                      <div className="customer-summary-card">
                        <span>Total Revenue</span>
                        <strong>₹{payments.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0).toLocaleString()}</strong>
                      </div>
                      <div className="customer-summary-card success">
                        <span>Total Received</span>
                        <strong>₹{payments.reduce((sum, p) => {
                          const installments = p.installments || [];
                          return sum + installments.reduce((iSum, inst) => iSum + (Number(inst.amount) || 0), 0);
                        }, 0).toLocaleString()}</strong>
                      </div>
                      <div className="customer-summary-card warning">
                        <span>Total Balance</span>
                        <strong>₹{payments.reduce((sum, p) => {
                          const totalAmount = Number(p.totalAmount) || 0;
                          const installments = p.installments || [];
                          const paid = installments.reduce((iSum, inst) => iSum + (Number(inst.amount) || 0), 0);
                          return sum + (totalAmount - paid);
                        }, 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="customer-expenses-section">
              <div className="customer-section-header">
                <h3>Expenses Management</h3>
              </div>

              {/* Add Expense Form */}
              <div className="customer-add-form">
                <div className="customer-form-grid">
                  <div className="customer-form-group">
                    <label>Select Work *</label>
                    <select
                      value={expenseForm.workId}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, workId: e.target.value }))}
                    >
                      <option value="">Choose Work</option>
                      {works.map(work => (
                        <option key={work.id} value={work.id}>{work.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="customer-form-group">
                    <label>Expense Type *</label>
                    <select
                      value={expenseForm.expenseType}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseType: e.target.value }))}
                    >
                      <option value="">Select Type</option>
                      {expenseTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="customer-form-group">
                    <label>Amount *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      min="0"
                    />
                  </div>

                  <div className="customer-form-group">
                    <label>Expense Date *</label>
                    <input
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    />
                  </div>

                  <div className="customer-form-group customer-form-full">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Add description (optional)"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>

                <button
                  className="customer-add-btn customer-add-btn-full"
                  onClick={handleSaveExpense}
                  disabled={savingExpense}
                >
                  {savingExpense ? 'Saving...' : <><Plus size={16} /> Add Expense</>}
                </button>
              </div>

              {/* Expenses List */}
              <div className="customer-expenses-list">
                <h4>All Expenses ({expenses.length})</h4>
                {expenses.length === 0 ? (
                  <div className="customer-empty-state">
                    <DollarSign size={48} />
                    <p>No expenses added yet</p>
                  </div>
                ) : (
                  <>
                    <div className="customer-table-wrapper">
                      <table className="customer-table">
                        <thead>
                          <tr>
                            <th>Work</th>
                            <th>Expense Type</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map(expense => {
                            const amount = Number(expense.amount) || 0;
                            
                            return (
                              <tr key={expense.id}>
                                <td>{expense.workTitle}</td>
                                <td><span className="customer-badge">{expense.expenseType}</span></td>
                                <td className="customer-amount">₹{amount.toLocaleString()}</td>
                                <td>{new Date(expense.expenseDate).toLocaleDateString()}</td>
                                <td>{expense.description || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="customer-total-summary">
                      <span>Total Expenses:</span>
                      <strong>₹{expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="customer-analytics-section">
              <div className="customer-section-header">
                <h3>Financial Analytics</h3>
              </div>

              {/* Overall Analytics */}
              <div className="customer-analytics-overall">
                <h4>Overall Summary</h4>
                <div className="customer-analytics-cards">
                  <div className="customer-analytics-card revenue">
                    <div className="customer-analytics-icon">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p>Total Revenue</p>
                      <h3>₹{getOverallAnalytics().totalRevenue.toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="customer-analytics-card cost">
                    <div className="customer-analytics-icon">
                      <TrendingDown size={24} />
                    </div>
                    <div>
                      <p>Total Cost</p>
                      <h3>₹{getOverallAnalytics().totalCost.toLocaleString()}</h3>
                      <small>Materials: ₹{getOverallAnalytics().totalMaterialsCost.toLocaleString()} | Expenses: ₹{getOverallAnalytics().totalExpensesAmount.toLocaleString()}</small>
                    </div>
                  </div>
                  <div className={`customer-analytics-card ${getOverallAnalytics().totalProfit >= 0 ? 'profit' : 'loss'}`}>
                    <div className="customer-analytics-icon">
                      {getOverallAnalytics().totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    </div>
                    <div>
                      <p>{getOverallAnalytics().totalProfit >= 0 ? 'Total Profit' : 'Total Loss'}</p>
                      <h3>₹{Math.abs(getOverallAnalytics().totalProfit).toLocaleString()}</h3>
                      <small>Margin: {getOverallAnalytics().profitPercentage}%</small>
                    </div>
                  </div>
                  <div className="customer-analytics-card balance">
                    <div className="customer-analytics-icon">
                      <IndianRupee size={24} />
                    </div>
                    <div>
                      <p>Pending Balance</p>
                      <h3>₹{getOverallAnalytics().totalBalance.toLocaleString()}</h3>
                      <small>Received: ₹{getOverallAnalytics().totalReceived.toLocaleString()}</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work-wise Analytics */}
              <div className="customer-work-analytics">
                <h4>Work-wise Analysis</h4>
                {works.length === 0 ? (
                  <div className="customer-empty-state">
                    <Briefcase size={48} />
                    <p>No works to analyze</p>
                  </div>
                ) : (
                  <div className="customer-work-analytics-grid">
                    {works.map(work => {
                      const analytics = getWorkAnalytics(work.id);
                      return (
                        <div key={work.id} className="customer-work-analytics-card">
                          <div className="customer-work-analytics-header">
                            <h5>{work.title}</h5>
                            <span className="customer-work-category-badge">{work.category}</span>
                          </div>
                          <div className="customer-work-analytics-body">
                            <div className="customer-analytics-row">
                              <span>Revenue:</span>
                              <strong>₹{analytics.totalRevenue.toLocaleString()}</strong>
                            </div>
                            <div className="customer-analytics-row">
                              <span>Received:</span>
                              <strong className="success">₹{analytics.totalReceived.toLocaleString()}</strong>
                            </div>
                            {analytics.balance > 0 && (
                              <div className="customer-analytics-row">
                                <span>Balance:</span>
                                <strong className="warning">₹{analytics.balance.toLocaleString()}</strong>
                              </div>
                            )}
                            <div className="customer-analytics-divider"></div>
                            <div className="customer-analytics-row">
                              <span>Materials Cost:</span>
                              <span>₹{analytics.materialsCost.toLocaleString()}</span>
                            </div>
                            <div className="customer-analytics-row">
                              <span>Expenses:</span>
                              <span>₹{analytics.totalExpenses.toLocaleString()}</span>
                            </div>
                            <div className="customer-analytics-row">
                              <span>Total Cost:</span>
                              <strong>₹{analytics.totalCost.toLocaleString()}</strong>
                            </div>
                            <div className="customer-analytics-divider"></div>
                            <div className={`customer-analytics-row ${analytics.profit >= 0 ? 'profit' : 'loss'}`}>
                              <span>{analytics.profit >= 0 ? 'Profit' : 'Loss'}:</span>
                              <strong>₹{Math.abs(analytics.profit).toLocaleString()} ({analytics.profitPercentage}%)</strong>
                            </div>
                          </div>
                          <div className="customer-work-analytics-footer">
                            <span>{analytics.materialsCount} Materials</span>
                            <span>{analytics.expensesCount} Expenses</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="customer-activity-section">
              <div className="customer-section-header">
                <h3>Activity Log</h3>
                <button
                  className="customer-add-btn"
                  onClick={() => setShowActivityForm(!showActivityForm)}
                >
                  <Plus size={16} /> Add Activity
                </button>
              </div>

              {/* Manual Activity Form */}
              {showActivityForm && (
                <div className="customer-activity-form">
                  <div className="customer-form-row">
                    <div className="customer-form-group">
                      <label>Activity Title *</label>
                      <input
                        type="text"
                        placeholder="Enter activity title"
                        value={manualActivityForm.title}
                        onChange={(e) => setManualActivityForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="customer-form-group">
                      <label>Type *</label>
                      <select
                        value={manualActivityForm.type}
                        onChange={(e) => setManualActivityForm(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="note">Note</option>
                        <option value="call">Call</option>
                        <option value="meeting">Meeting</option>
                        <option value="email">Email</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="customer-form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Enter description (optional)"
                      value={manualActivityForm.description}
                      onChange={(e) => setManualActivityForm(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="customer-form-actions">
                    <button className="customer-save-btn" onClick={handleAddManualActivity}>
                      <Save size={16} /> Save Activity
                    </button>
                    <button className="customer-cancel-btn" onClick={() => {
                      setShowActivityForm(false);
                      setManualActivityForm({ title: '', description: '', type: 'note' });
                    }}>
                      <X size={16} /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="customer-activity-timeline">
                {activities.length === 0 ? (
                  <div className="customer-empty-state">
                    <Activity size={48} />
                    <p>No activities yet</p>
                  </div>
                ) : (
                  activities.map(activity => (
                    <div key={activity.id} className={`customer-activity-item ${activity.type}`}>
                      <div className="customer-activity-icon">
                        {activity.type === 'profile' && <User size={16} />}
                        {activity.type === 'work' && <Briefcase size={16} />}
                        {activity.type === 'material' && <Package size={16} />}
                        {activity.type === 'payment' && <IndianRupee size={16} />}
                        {activity.type === 'expense' && <DollarSign size={16} />}
                        {(activity.type === 'note' || activity.type === 'call' || activity.type === 'meeting' || activity.type === 'email' || activity.type === 'other') && <ClipboardList size={16} />}
                      </div>
                      <div className="customer-activity-content">
                        <h5>{activity.title}</h5>
                        <p>{activity.description}</p>
                        <span className="customer-activity-time">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerDetails;
