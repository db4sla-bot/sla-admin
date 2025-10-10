import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../Firebase'
import './MonthlyExpenses.css'

const MonthlyExpenses = () => {
  const [monthlyExpensesList, setMonthlyExpensesList] = useState([])
  const [filteredExpensesList, setFilteredExpensesList] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [totalMonthlyAmount, setTotalMonthlyAmount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [employeesList, setEmployeesList] = useState([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [renderError, setRenderError] = useState(null)

  // Form state for new monthly expense
  const [newExpenseForm, setNewExpenseForm] = useState({
    expenseName: '',
    expenseAmount: '',
    expenseCategory: 'DTH',
    expenseDescription: '',
    expenseMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
    expensedBy: ''
  })

  // Form state for editing expense
  const [editExpenseForm, setEditExpenseForm] = useState({
    expenseName: '',
    expenseAmount: '',
    expenseCategory: 'DTH',
    expenseDescription: '',
    expenseMonth: new Date().toISOString().slice(0, 7),
    expensedBy: ''
  })

  const expenseCategories = [
    'DTH',
    'Power Bill',
    'Recharges',
    'Provisions',
    'Gas',
    'Cleaning Work',
    'Rent'
  ]

  const categoryIcons = {
    'DTH': '📺',
    'Power Bill': '⚡',
    'Recharges': '📱',
    'Provisions': '🛒',
    'Gas': '🔥',
    'Cleaning Work': '🧹',
    'Rent': '�'
  }

  useEffect(() => {
    loadMonthlyExpenses()
    loadEmployees()
  }, [])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [monthlyExpensesList, selectedMonth, selectedYear, selectedCategory, selectedEmployee, searchTerm])

  const loadMonthlyExpenses = async () => {
    try {
      setIsLoadingExpenses(true)
      const expensesQuery = query(
        collection(db, 'monthlyExpenses'),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(expensesQuery)
      
      const expensesList = []
      querySnapshot.forEach((doc) => {
        expensesList.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })
      })
      
      setMonthlyExpensesList(expensesList)
    } catch (error) {
      console.error('Error loading monthly expenses:', error)
    } finally {
      setIsLoadingExpenses(false)
    }
  }

  const loadEmployees = async () => {
    try {
      setIsLoadingEmployees(true)
      
      // First try without orderBy to see if we can fetch employees at all
      const employeesQuery = collection(db, 'Employees')
      const querySnapshot = await getDocs(employeesQuery)
      
      console.log('Total employees found:', querySnapshot.size)
      
      const employees = []
      querySnapshot.forEach((doc) => {
        const employeeData = doc.data()
        console.log('Employee data:', employeeData)
        
        // Try multiple possible field names for employee name
        const employeeName = 
          employeeData.employeeName || 
          employeeData.name || 
          employeeData.fullName || 
          employeeData.firstName || 
          employeeData.empName ||
          `Employee ${doc.id}`
        
        employees.push({
          id: doc.id,
          name: employeeName,
          ...employeeData
        })
      })
      
      // Sort employees by name after fetching
      employees.sort((a, b) => a.name.localeCompare(b.name))
      
      console.log('Processed employees:', employees)
      setEmployeesList(employees)
      
      // Set default employee for form if employees are loaded
      if (employees.length > 0 && !newExpenseForm.expensedBy) {
        setNewExpenseForm(prev => ({
          ...prev,
          expensedBy: employees[0].name
        }))
      }
    } catch (error) {
      console.error('Error loading employees:', error)
      console.error('Error details:', error.message)
      
      // Fallback to a default employee list if Firebase fails
      const fallbackEmployees = [
        { id: 'fallback-1', name: 'Admin User' },
        { id: 'fallback-2', name: 'Default Employee' }
      ]
      setEmployeesList(fallbackEmployees)
      
      if (!newExpenseForm.expensedBy) {
        setNewExpenseForm(prev => ({
          ...prev,
          expensedBy: fallbackEmployees[0].name
        }))
      }
    } finally {
      setIsLoadingEmployees(false)
    }
  }

  const applyFiltersAndSearch = () => {
    try {
      let filtered = [...monthlyExpensesList]

      // Filter by specific month
      if (selectedMonth) {
        filtered = filtered.filter(expense => {
          try {
            const expenseMonth = expense?.expenseMonth
            if (!expenseMonth || typeof expenseMonth !== 'string') return false
            const monthPart = expenseMonth.substring(5, 7) // Get MM part
            return monthPart === selectedMonth
          } catch (error) {
            console.warn('Error filtering by month:', error, expense)
            return false
          }
        })
      }

      // Filter by year
      if (selectedYear) {
        filtered = filtered.filter(expense => {
          try {
            const expenseMonth = expense?.expenseMonth
            if (!expenseMonth || typeof expenseMonth !== 'string') return false
            const yearPart = expenseMonth.substring(0, 4) // Get YYYY part
            return yearPart === selectedYear
          } catch (error) {
            console.warn('Error filtering by year:', error, expense)
            return false
          }
        })
      }

      // Filter by category
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(expense => {
          try {
            return expense?.expenseCategory === selectedCategory
          } catch (error) {
            console.warn('Error filtering by category:', error, expense)
            return false
          }
        })
      }

      // Filter by employee
      if (selectedEmployee !== 'all') {
        filtered = filtered.filter(expense => {
          try {
            return expense?.expensedBy === selectedEmployee
          } catch (error) {
            console.warn('Error filtering by employee:', error, expense)
            return false
          }
        })
      }

      // Search filter
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim()
        filtered = filtered.filter(expense => {
          try {
            if (!expense) return false
            
            const expenseName = expense.expenseName || ''
            const expenseCategory = expense.expenseCategory || ''
            const expensedBy = expense.expensedBy || ''
            const expenseDescription = expense.expenseDescription || ''
            
            return (
              expenseName.toLowerCase().includes(searchLower) ||
              expenseCategory.toLowerCase().includes(searchLower) ||
              expensedBy.toLowerCase().includes(searchLower) ||
              expenseDescription.toLowerCase().includes(searchLower)
            )
          } catch (error) {
            console.warn('Error in search filter:', error, expense)
            return false
          }
        })
      }

      setFilteredExpensesList(filtered)
      
      // Calculate total with error handling
      const total = filtered.reduce((sum, expense) => {
        try {
          const amount = expense?.expenseAmount
          return sum + (typeof amount === 'number' ? amount : 0)
        } catch (error) {
          console.warn('Error calculating total:', error, expense)
          return sum
        }
      }, 0)
      
      setTotalMonthlyAmount(total)
    } catch (error) {
      console.error('Error in applyFiltersAndSearch:', error)
      // Set safe fallback values
      setFilteredExpensesList([])
      setTotalMonthlyAmount(0)
    }
  }

  const addNewExpense = async (e) => {
    e.preventDefault()
    
    if (!newExpenseForm.expenseName || !newExpenseForm.expenseAmount) {
      alert('Please fill in required fields')
      return
    }

    try {
      const expenseData = {
        expenseName: newExpenseForm.expenseName,
        expenseAmount: parseFloat(newExpenseForm.expenseAmount),
        expenseCategory: newExpenseForm.expenseCategory,
        expenseDescription: newExpenseForm.expenseDescription,
        expenseMonth: newExpenseForm.expenseMonth,
        expensedBy: newExpenseForm.expensedBy,
        createdAt: new Date()
      }

      await addDoc(collection(db, 'monthlyExpenses'), expenseData)
      
      // Reset form and close modal
      setNewExpenseForm({
        expenseName: '',
        expenseAmount: '',
        expenseCategory: 'DTH',
        expenseDescription: '',
        expenseMonth: new Date().toISOString().slice(0, 7),
        expensedBy: employeesList.length > 0 ? employeesList[0].name : ''
      })
      setShowAddModal(false)
      
      // Reload expenses
      await loadMonthlyExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense. Please try again.')
    }
  }

  const openEditModal = (expense) => {
    setEditingExpense(expense)
    setEditExpenseForm({
      expenseName: expense.expenseName || '',
      expenseAmount: expense.expenseAmount?.toString() || '',
      expenseCategory: expense.expenseCategory || 'DTH',
      expenseDescription: expense.expenseDescription || '',
      expenseMonth: expense.expenseMonth || new Date().toISOString().slice(0, 7),
      expensedBy: expense.expensedBy || ''
    })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingExpense(null)
    setEditExpenseForm({
      expenseName: '',
      expenseAmount: '',
      expenseCategory: 'DTH',
      expenseDescription: '',
      expenseMonth: new Date().toISOString().slice(0, 7),
      expensedBy: ''
    })
  }

  const updateExpense = async (e) => {
    e.preventDefault()
    
    if (!editExpenseForm.expenseName || !editExpenseForm.expenseAmount) {
      alert('Please fill in required fields')
      return
    }

    if (!editingExpense?.id) {
      alert('Error: No expense selected for editing')
      return
    }

    try {
      const expenseData = {
        expenseName: editExpenseForm.expenseName,
        expenseAmount: parseFloat(editExpenseForm.expenseAmount),
        expenseCategory: editExpenseForm.expenseCategory,
        expenseDescription: editExpenseForm.expenseDescription,
        expenseMonth: editExpenseForm.expenseMonth,
        expensedBy: editExpenseForm.expensedBy,
        updatedAt: new Date()
      }

      await updateDoc(doc(db, 'monthlyExpenses', editingExpense.id), expenseData)
      
      closeEditModal()
      
      // Reload expenses
      await loadMonthlyExpenses()
      
      alert('Expense updated successfully!')
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Error updating expense. Please try again.')
    }
  }

  const formatMonthDisplay = (monthString) => {
    try {
      if (!monthString || typeof monthString !== 'string') return ''
      
      const parts = monthString.split('-')
      if (parts.length !== 2) return monthString // Return as-is if format is unexpected
      
      const [year, month] = parts
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      
      const monthIndex = parseInt(month) - 1
      if (monthIndex < 0 || monthIndex >= monthNames.length) {
        return monthString // Return as-is if month is invalid
      }
      
      return `${monthNames[monthIndex]} ${year}`
    } catch (error) {
      console.warn('Error formatting month display:', error, monthString)
      return monthString || ''
    }
  }

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    
    // Add current year and last 4 years
    for (let i = 0; i < 5; i++) {
      years.push((currentYear - i).toString())
    }
    
    return years
  }

  const getMonthOptions = () => {
    return [
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ]
  }

  const handleRenderError = (error, errorInfo) => {
    console.error('Render error in MonthlyExpenses:', error, errorInfo)
    setRenderError(error.message || 'An unexpected error occurred')
  }

  const resetError = () => {
    setRenderError(null)
    // Reset filters to default state
    setSelectedMonth('')
    setSelectedYear('')
    setSelectedCategory('all')
    setSelectedEmployee('all')
    setSearchTerm('')
    // Reapply filters safely
    setFilteredExpensesList(monthlyExpensesList)
    setTotalMonthlyAmount(monthlyExpensesList.reduce((sum, expense) => sum + (expense?.expenseAmount || 0), 0))
  }

  if (isLoadingExpenses) {
    return (
      <div className="monthly-expenses-container">
        <div className="monthly-loading-wrapper">
          <div className="monthly-loading-spinner"></div>
          <p className="monthly-loading-text">Loading expenses...</p>
        </div>
      </div>
    )
  }

  if (renderError) {
    return (
      <div className="monthly-expenses-container">
        <div className="monthly-loading-wrapper">
          <div className="monthly-empty-icon">⚠️</div>
          <h3 className="monthly-empty-title">Something went wrong</h3>
          <p className="monthly-empty-message">
            Error: {renderError}
          </p>
          <button 
            className="monthly-submit-btn" 
            onClick={resetError}
            style={{ marginTop: '20px' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="monthly-expenses-container">
        <div className="monthly-expenses-content">
        {/* Header Section */}
        <div className="monthly-header-section">
          <div className="monthly-header-info">
            <h1 className="monthly-page-title">Monthly Expenses</h1>
            <p className="monthly-page-subtitle">Track and manage your monthly spending</p>
          </div>
          <div className="monthly-total-card">
            <div className="monthly-total-amount">₹{totalMonthlyAmount.toLocaleString()}</div>
            <div className="monthly-total-label">Total Amount</div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="monthly-controls-section">
          <div className="monthly-filters-row">
            {/* Month Filter */}
            <div className="monthly-filter-group">
              <label className="monthly-filter-label">Filter by Month</label>
              <select 
                className="monthly-filter-select"
                value={selectedMonth}
                onChange={(e) => {
                  try {
                    setSelectedMonth(e.target.value)
                  } catch (error) {
                    console.warn('Error setting selected month:', error)
                  }
                }}
              >
                <option value="">All Months</option>
                {getMonthOptions().map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="monthly-filter-group">
              <label className="monthly-filter-label">Filter by Year</label>
              <select 
                className="monthly-filter-select"
                value={selectedYear}
                onChange={(e) => {
                  try {
                    setSelectedYear(e.target.value)
                  } catch (error) {
                    console.warn('Error setting selected year:', error)
                  }
                }}
              >
                <option value="">All Years</option>
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="monthly-filter-group">
              <label className="monthly-filter-label">Filter by Category</label>
              <select 
                className="monthly-filter-select"
                value={selectedCategory}
                onChange={(e) => {
                  try {
                    setSelectedCategory(e.target.value)
                  } catch (error) {
                    console.warn('Error setting selected category:', error)
                  }
                }}
              >
                <option value="all">All Categories</option>
                {expenseCategories.map(category => (
                  <option key={category} value={category}>
                    {categoryIcons[category]} {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Filter */}
            <div className="monthly-filter-group">
              <label className="monthly-filter-label">Filter by Employee</label>
              <select 
                className="monthly-filter-select"
                value={selectedEmployee}
                onChange={(e) => {
                  try {
                    setSelectedEmployee(e.target.value)
                  } catch (error) {
                    console.warn('Error setting selected employee:', error)
                  }
                }}
                disabled={isLoadingEmployees}
              >
                <option value="all">
                  {isLoadingEmployees ? 'Loading employees...' : `All Employees (${employeesList.length})`}
                </option>
                {employeesList.length > 0 ? (
                  employeesList.map(employee => (
                    <option key={employee.id} value={employee.name}>
                      👤 {employee.name}
                    </option>
                  ))
                ) : (
                  !isLoadingEmployees && (
                    <option value="" disabled>
                      No employees found
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Search */}
            <div className="monthly-filter-group">
              <label className="monthly-filter-label">Search Expenses</label>
              <input
                type="text"
                className="monthly-search-input"
                placeholder="Search by name, category, employee..."
                value={searchTerm}
                onChange={(e) => {
                  try {
                    setSearchTerm(e.target.value)
                  } catch (error) {
                    console.warn('Error setting search term:', error)
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Expenses Grid */}
        <div className="monthly-expenses-grid">
          {filteredExpensesList.length === 0 ? (
            <div className="monthly-empty-state">
              <div className="monthly-empty-icon">📊</div>
              <h3 className="monthly-empty-title">No Expenses Found</h3>
              <p className="monthly-empty-message">
                {searchTerm || selectedMonth || selectedYear || selectedCategory !== 'all' || selectedEmployee !== 'all' 
                  ? 'No expenses match your current filters'
                  : 'Start by adding your first monthly expense'
                }
              </p>
            </div>
          ) : (
            filteredExpensesList.map(expense => {
              try {
                // Validate expense data
                if (!expense || !expense.id) {
                  console.warn('Invalid expense data:', expense)
                  return null
                }

                const expenseName = expense.expenseName || 'Unnamed Expense'
                const expenseCategory = expense.expenseCategory || 'Other'
                const expenseAmount = expense.expenseAmount || 0
                const expenseDescription = expense.expenseDescription || ''
                const expenseMonth = expense.expenseMonth || ''
                const expensedBy = expense.expensedBy || 'Unknown'
                const categoryIcon = categoryIcons[expenseCategory] || '📋'

                return (
                  <div key={expense.id} className="monthly-expense-card">
                    <div className="monthly-card-header">
                      <div className="monthly-category-icon">
                        {categoryIcon}
                      </div>
                      <div className="monthly-expense-info">
                        <h3 className="monthly-expense-name">{expenseName}</h3>
                        <span className="monthly-expense-category">{expenseCategory}</span>
                      </div>
                      <div className="monthly-expense-amount">
                        ₹{(typeof expenseAmount === 'number' ? expenseAmount : 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="monthly-card-body">
                      {expenseDescription && (
                        <p className="monthly-expense-description">{expenseDescription}</p>
                      )}
                      <div className="monthly-expense-meta">
                        <span className="monthly-expense-month">{formatMonthDisplay(expenseMonth)}</span>
                        <span className="monthly-expense-employee">👤 {expensedBy}</span>
                      </div>
                      <div className="monthly-card-actions">
                        <button 
                          className="monthly-edit-btn"
                          onClick={() => openEditModal(expense)}
                          title="Edit expense"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )
              } catch (error) {
                console.warn('Error rendering expense card:', error, expense)
                return (
                  <div key={expense?.id || Math.random()} className="monthly-expense-card">
                    <div className="monthly-card-header">
                      <div className="monthly-category-icon">⚠️</div>
                      <div className="monthly-expense-info">
                        <h3 className="monthly-expense-name">Error loading expense</h3>
                        <span className="monthly-expense-category">Error</span>
                      </div>
                    </div>
                  </div>
                )
              }
            }).filter(Boolean)
          )}
        </div>

        {/* Floating Add Button */}
        <button 
          className="monthly-add-button"
          onClick={() => setShowAddModal(true)}
        >
          <span className="monthly-add-icon">+</span>
        </button>

        {/* Edit Expense Modal */}
        {showEditModal && editingExpense && (
          <div className="monthly-modal-overlay" onClick={closeEditModal}>
            <div className="monthly-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="monthly-modal-header">
                <h2 className="monthly-modal-title">Edit Monthly Expense</h2>
                <button 
                  className="monthly-modal-close"
                  onClick={closeEditModal}
                >
                  ×
                </button>
              </div>
              <form onSubmit={updateExpense} className="monthly-expense-form">
                <div className="monthly-form-group">
                  <label className="monthly-form-label">Expense Name *</label>
                  <input
                    type="text"
                    className="monthly-form-input"
                    value={editExpenseForm.expenseName}
                    onChange={(e) => setEditExpenseForm({
                      ...editExpenseForm,
                      expenseName: e.target.value
                    })}
                    placeholder="Enter expense name"
                    required
                  />
                </div>

                <div className="monthly-form-row">
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="monthly-form-input"
                      value={editExpenseForm.expenseAmount}
                      onChange={(e) => setEditExpenseForm({
                        ...editExpenseForm,
                        expenseAmount: e.target.value
                      })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Category</label>
                    <select
                      className="monthly-form-select"
                      value={editExpenseForm.expenseCategory}
                      onChange={(e) => setEditExpenseForm({
                        ...editExpenseForm,
                        expenseCategory: e.target.value
                      })}
                    >
                      {expenseCategories.map(category => (
                        <option key={category} value={category}>
                          {categoryIcons[category]} {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="monthly-form-row">
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Month</label>
                    <input
                      type="month"
                      className="monthly-form-input"
                      value={editExpenseForm.expenseMonth}
                      onChange={(e) => setEditExpenseForm({
                        ...editExpenseForm,
                        expenseMonth: e.target.value
                      })}
                    />
                  </div>
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Expensed By</label>
                    <select
                      className="monthly-form-select"
                      value={editExpenseForm.expensedBy}
                      onChange={(e) => setEditExpenseForm({
                        ...editExpenseForm,
                        expensedBy: e.target.value
                      })}
                      disabled={isLoadingEmployees}
                    >
                      {isLoadingEmployees ? (
                        <option value="">Loading employees...</option>
                      ) : employeesList.length > 0 ? (
                        employeesList.map(employee => (
                          <option key={employee.id} value={employee.name}>
                            👤 {employee.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No employees found</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="monthly-form-group">
                  <label className="monthly-form-label">Description</label>
                  <textarea
                    className="monthly-form-textarea"
                    value={editExpenseForm.expenseDescription}
                    onChange={(e) => setEditExpenseForm({
                      ...editExpenseForm,
                      expenseDescription: e.target.value
                    })}
                    placeholder="Enter description (optional)"
                    rows="3"
                  />
                </div>

                <div className="monthly-form-actions">
                  <button 
                    type="button" 
                    className="monthly-cancel-btn"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="monthly-submit-btn">
                    Update Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="monthly-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="monthly-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="monthly-modal-header">
                <h2 className="monthly-modal-title">Add Monthly Expense</h2>
                <button 
                  className="monthly-modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={addNewExpense} className="monthly-expense-form">
                <div className="monthly-form-group">
                  <label className="monthly-form-label">Expense Name *</label>
                  <input
                    type="text"
                    className="monthly-form-input"
                    value={newExpenseForm.expenseName}
                    onChange={(e) => setNewExpenseForm({
                      ...newExpenseForm,
                      expenseName: e.target.value
                    })}
                    placeholder="Enter expense name"
                    required
                  />
                </div>

                <div className="monthly-form-row">
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="monthly-form-input"
                      value={newExpenseForm.expenseAmount}
                      onChange={(e) => setNewExpenseForm({
                        ...newExpenseForm,
                        expenseAmount: e.target.value
                      })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Category</label>
                    <select
                      className="monthly-form-select"
                      value={newExpenseForm.expenseCategory}
                      onChange={(e) => setNewExpenseForm({
                        ...newExpenseForm,
                        expenseCategory: e.target.value
                      })}
                    >
                      {expenseCategories.map(category => (
                        <option key={category} value={category}>
                          {categoryIcons[category]} {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="monthly-form-row">
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Month</label>
                    <input
                      type="month"
                      className="monthly-form-input"
                      value={newExpenseForm.expenseMonth}
                      onChange={(e) => setNewExpenseForm({
                        ...newExpenseForm,
                        expenseMonth: e.target.value
                      })}
                    />
                  </div>
                  <div className="monthly-form-group">
                    <label className="monthly-form-label">Expensed By</label>
                    <select
                      className="monthly-form-select"
                      value={newExpenseForm.expensedBy}
                      onChange={(e) => setNewExpenseForm({
                        ...newExpenseForm,
                        expensedBy: e.target.value
                      })}
                      disabled={isLoadingEmployees}
                    >
                      {isLoadingEmployees ? (
                        <option value="">Loading employees...</option>
                      ) : employeesList.length > 0 ? (
                        employeesList.map(employee => (
                          <option key={employee.id} value={employee.name}>
                            👤 {employee.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No employees found</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="monthly-form-group">
                  <label className="monthly-form-label">Description</label>
                  <textarea
                    className="monthly-form-textarea"
                    value={newExpenseForm.expenseDescription}
                    onChange={(e) => setNewExpenseForm({
                      ...newExpenseForm,
                      expenseDescription: e.target.value
                    })}
                    placeholder="Enter description (optional)"
                    rows="3"
                  />
                </div>

                <div className="monthly-form-actions">
                  <button 
                    type="button" 
                    className="monthly-cancel-btn"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="monthly-submit-btn">
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
  } catch (error) {
    handleRenderError(error, 'Component render error')
    return (
      <div className="monthly-expenses-container">
        <div className="monthly-loading-wrapper">
          <div className="monthly-empty-icon">⚠️</div>
          <h3 className="monthly-empty-title">Something went wrong</h3>
          <p className="monthly-empty-message">
            Please try refreshing the page or contact support.
          </p>
          <button 
            className="monthly-submit-btn" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}

export default MonthlyExpenses