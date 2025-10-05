import React, { useState, useEffect } from 'react'
import './DailyExpenses.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search,
  Edit3,
  Trash2,
  Receipt,
  PieChart,
  BarChart3
} from 'lucide-react';
import { toast } from "react-toastify";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../Firebase";

const DailyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    'Food & Dining',
    'Transportation',
    'Office Supplies',
    'Utilities',
    'Marketing',
    'Equipment',
    'Travel',
    'Entertainment',
    'Healthcare',
    'Miscellaneous'
  ];

  const filterOptions = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'yesterday', label: 'Yesterday', icon: '⏪' },
    { id: 'this-week', label: 'This Week', icon: '📆' },
    { id: 'last-week', label: 'Last Week', icon: '⏮️' },
    { id: 'this-month', label: 'This Month', icon: '🗓️' },
    { id: 'last-month', label: 'Last Month', icon: '📋' },
    { id: 'this-year', label: 'This Year', icon: '🎯' },
    { id: 'last-year', label: 'Last Year', icon: '📊' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [expenses, activeFilter, searchTerm]);

  // ✅ ALREADY WORKING - Fetching from Firebase
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "DailyExpenses"));
      const expensesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      expensesData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...expenses];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Apply date filter
    filtered = filtered.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseDateOnly = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());

      switch (activeFilter) {
        case 'today':
          return expenseDateOnly.getTime() === today.getTime();
        
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return expenseDateOnly.getTime() === yesterday.getTime();
        
        case 'this-week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return expenseDateOnly >= weekStart && expenseDateOnly <= today;
        
        case 'last-week':
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          return expenseDateOnly >= lastWeekStart && expenseDateOnly <= lastWeekEnd;
        
        case 'this-month':
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return expenseDate.getMonth() === lastMonth.getMonth() && expenseDate.getFullYear() === lastMonth.getFullYear();
        
        case 'this-year':
          return expenseDate.getFullYear() === now.getFullYear();
        
        case 'last-year':
          return expenseDate.getFullYear() === now.getFullYear() - 1;
        
        default:
          return true;
      }
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  };

  // ✅ ALREADY WORKING - Saving to Firebase
  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    if (!newExpense.title || !newExpense.amount || !newExpense.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        createdAt: new Date().toISOString()
      };

      if (editingExpense) {
        // ✅ Update existing document
        await updateDoc(doc(db, "DailyExpenses", editingExpense.id), expenseData);
        toast.success("Expense updated successfully!");
      } else {
        // ✅ Add new document
        await addDoc(collection(db, "DailyExpenses"), expenseData);
        toast.success("Expense added successfully!");
      }
      
      // Reset form and refresh data
      setNewExpense({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    }
    setSaving(false);
  };

  const handleEditExpense = (expense) => {
    setNewExpense({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      date: expense.date
    });
    setEditingExpense(expense);
    setShowAddForm(true);
  };

  // ✅ ALREADY WORKING - Deleting from Firebase
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteDoc(doc(db, "DailyExpenses", expenseId));
        toast.success("Expense deleted successfully!");
        fetchExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error("Failed to delete expense");
      }
    }
  };

  const calculateTotalAmount = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getCategoryTotals = () => {
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getFilterLabel = () => {
    return filterOptions.find(option => option.id === activeFilter)?.label || 'All Time';
  };

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
              Daily Expenses
            </h1>
          </div>
        </div>
        <div className="daily-expenses-loading">
          <div className="daily-expenses-loading-spinner"></div>
          Loading expenses...
        </div>
      </>
    );
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
            <Receipt style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Daily Expenses
          </h1>
        </div>
        {/* <div className="daily-expenses-header-actions">
          <button 
            className="daily-expenses-add-btn"
            onClick={() => {
              setShowAddForm(true);
              setEditingExpense(null);
              setNewExpense({
                title: '',
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
              });
            }}
          >
            <Plus style={{ width: "18px", height: "18px" }} />
            Add Expense
          </button>
        </div> */}
      </div>

      <div className="daily-expenses-main-container">
        {/* Statistics Cards */}
        <div className="daily-expenses-stats-grid">
          <div className="daily-expenses-stat-card total">
            <div className="daily-expenses-stat-icon">
              <Receipt size={24} />
            </div>
            <div className="daily-expenses-stat-content">
              <div className="daily-expenses-stat-label">Total Expenses</div>
              <div className="daily-expenses-stat-value">₹{calculateTotalAmount().toFixed(2)}</div>
              <div className="daily-expenses-stat-period">{getFilterLabel()}</div>
            </div>
          </div>

          <div className="daily-expenses-stat-card count">
            <div className="daily-expenses-stat-icon">
              <Receipt size={24} />
            </div>
            <div className="daily-expenses-stat-content">
              <div className="daily-expenses-stat-label">Total Transactions</div>
              <div className="daily-expenses-stat-value">{filteredExpenses.length}</div>
              <div className="daily-expenses-stat-period">{getFilterLabel()}</div>
            </div>
          </div>

          <div className="daily-expenses-stat-card average">
            <div className="daily-expenses-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="daily-expenses-stat-content">
              <div className="daily-expenses-stat-label">Average Amount</div>
              <div className="daily-expenses-stat-value">
                ₹{filteredExpenses.length > 0 ? (calculateTotalAmount() / filteredExpenses.length).toFixed(2) : '0.00'}
              </div>
              <div className="daily-expenses-stat-period">Per Transaction</div>
            </div>
          </div>

          <div className="daily-expenses-stat-card category">
            <div className="daily-expenses-stat-icon">
              <PieChart size={24} />
            </div>
            <div className="daily-expenses-stat-content">
              <div className="daily-expenses-stat-label">Top Category</div>
              <div className="daily-expenses-stat-value">
                {getCategoryTotals()[0]?.[0] || 'None'}
              </div>
              <div className="daily-expenses-stat-period">
                {getCategoryTotals()[0] ? `₹${getCategoryTotals()[0][1].toFixed(2)}` : '₹0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="daily-expenses-controls-section">
          <div className="daily-expenses-filters-container">
            <div className="daily-expenses-filters-label">
              <Filter size={18} />
              Filter by Period:
            </div>
            <div className="daily-expenses-filters-grid">
              {filterOptions.map(option => (
                <button
                  key={option.id}
                  className={`daily-expenses-filter-btn ${activeFilter === option.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(option.id)}
                >
                  <span className="daily-expenses-filter-icon">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="daily-expenses-search-container">
            <div className="daily-expenses-search-wrapper">
              <Search size={18} className="daily-expenses-search-icon" />
              <input
                type="text"
                className="daily-expenses-search-input"
                placeholder="Search expenses by title, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Top Categories */}
        {getCategoryTotals().length > 0 && (
          <div className="daily-expenses-categories-section">
            <h3 className="daily-expenses-categories-title">
              <BarChart3 size={20} />
              Top Categories - {getFilterLabel()}
            </h3>
            <div className="daily-expenses-categories-grid">
              {getCategoryTotals().map(([category, amount], index) => (
                <div key={category} className="daily-expenses-category-item">
                  <div className="daily-expenses-category-rank">#{index + 1}</div>
                  <div className="daily-expenses-category-info">
                    <div className="daily-expenses-category-name">{category}</div>
                    <div className="daily-expenses-category-amount">₹{amount.toFixed(2)}</div>
                  </div>
                  <div className="daily-expenses-category-percentage">
                    {((amount / calculateTotalAmount()) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="daily-expenses-list-section">
          <div className="daily-expenses-list-header">
            <h3 className="daily-expenses-list-title">
              Expense Records - {getFilterLabel()}
            </h3>
            <div className="daily-expenses-list-count">
              {filteredExpenses.length} {filteredExpenses.length === 1 ? 'record' : 'records'}
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="daily-expenses-empty-state">
              <div className="daily-expenses-empty-icon">💸</div>
              <div className="daily-expenses-empty-title">
                {searchTerm || activeFilter !== 'today' ? 'No expenses found' : 'No expenses for today'}
              </div>
              <div className="daily-expenses-empty-text">
                {searchTerm 
                  ? `No expenses match "${searchTerm}" for ${getFilterLabel().toLowerCase()}`
                  : `No expenses recorded for ${getFilterLabel().toLowerCase()}`
                }
              </div>
              {!searchTerm && (
                <button 
                  className="daily-expenses-empty-button"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus size={18} />
                  Add First Expense
                </button>
              )}
            </div>
          ) : (
            <div className="daily-expenses-list-grid">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="daily-expenses-list-item">
                  <div className="daily-expenses-item-header">
                    <div className="daily-expenses-item-title">{expense.title}</div>
                    <div className="daily-expenses-item-amount">₹{expense.amount.toFixed(2)}</div>
                  </div>
                  
                  <div className="daily-expenses-item-meta">
                    <div className="daily-expenses-item-category">{expense.category}</div>
                    <div className="daily-expenses-item-date">
                      {new Date(expense.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  {expense.description && (
                    <div className="daily-expenses-item-description">{expense.description}</div>
                  )}
                  
                  <div className="daily-expenses-item-actions">
                    <button 
                      className="daily-expenses-edit-btn"
                      onClick={() => handleEditExpense(expense)}
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>
                    <button 
                      className="daily-expenses-delete-btn"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {showAddForm && (
        <div className="daily-expenses-modal">
          <div className="daily-expenses-modal-overlay" onClick={() => setShowAddForm(false)}></div>
          <div className="daily-expenses-modal-content">
            <div className="daily-expenses-modal-header">
              <h3>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button 
                className="daily-expenses-modal-close"
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            
            <form className="daily-expenses-form" onSubmit={handleAddExpense}>
              <div className="daily-expenses-form-row">
                <div className="daily-expenses-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newExpense.title}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter expense title"
                    required
                  />
                </div>
                <div className="daily-expenses-form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="daily-expenses-form-row">
                <div className="daily-expenses-form-group">
                  <label>Category *</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="daily-expenses-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* <div className="daily-expenses-form-group">
                <label>Description</label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter expense description (optional)"
                  rows="3"
                />
              </div> */}

              <div className="daily-expenses-form-actions">
                <button 
                  type="button" 
                  className="daily-expenses-cancel-btn"
                  onClick={() => setShowAddForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="daily-expenses-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="daily-expenses-loading-spinner small"></div>
                      {editingExpense ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Receipt size={18} />
                      {editingExpense ? 'Update Expense' : 'Save Expense'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default DailyExpenses