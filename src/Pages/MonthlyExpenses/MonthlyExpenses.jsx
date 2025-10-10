import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, where } from 'firebase/firestore'
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
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true)
  const [employeesList, setEmployeesList] = useState([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)

  // Form state for new monthly expense
  const [newExpenseForm, setNewExpenseForm] = useState({
    expenseName: '',
    expenseAmount: '',
    expenseCategory: 'DTH',
    expenseDescription: '',
    expenseMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
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
    let filtered = [...monthlyExpensesList]

    // Filter by specific month
    if (selectedMonth) {
      filtered = filtered.filter(expense => {
        const expenseMonth = expense.expenseMonth?.substring(5, 7) // Get MM part
        return expenseMonth === selectedMonth
      })
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(expense => {
        const expenseYear = expense.expenseMonth?.substring(0, 4) // Get YYYY part
        return expenseYear === selectedYear
      })
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.expenseCategory === selectedCategory)
    }

    // Filter by employee
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(expense => expense.expensedBy === selectedEmployee)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(expense => 
        expense.expenseName.toLowerCase().includes(searchLower) ||
        expense.expenseCategory.toLowerCase().includes(searchLower) ||
        expense.expensedBy.toLowerCase().includes(searchLower) ||
        (expense.expenseDescription && expense.expenseDescription.toLowerCase().includes(searchLower))
      )
    }

    setFilteredExpensesList(filtered)
    
    // Calculate total
    const total = filtered.reduce((sum, expense) => sum + (expense.expenseAmount || 0), 0)
    setTotalMonthlyAmount(total)
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

  const formatMonthDisplay = (monthString) => {
    if (!monthString) return ''
    const [year, month] = monthString.split('-')
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
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
                onChange={(e) => setSelectedMonth(e.target.value)}
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
                onChange={(e) => setSelectedYear(e.target.value)}
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
                onChange={(e) => setSelectedCategory(e.target.value)}
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
                onChange={(e) => setSelectedEmployee(e.target.value)}
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
            filteredExpensesList.map(expense => (
              <div key={expense.id} className="monthly-expense-card">
                <div className="monthly-card-header">
                  <div className="monthly-category-icon">
                    {categoryIcons[expense.expenseCategory]}
                  </div>
                  <div className="monthly-expense-info">
                    <h3 className="monthly-expense-name">{expense.expenseName}</h3>
                    <span className="monthly-expense-category">{expense.expenseCategory}</span>
                  </div>
                  <div className="monthly-expense-amount">₹{expense.expenseAmount.toLocaleString()}</div>
                </div>
                <div className="monthly-card-body">
                  {expense.expenseDescription && (
                    <p className="monthly-expense-description">{expense.expenseDescription}</p>
                  )}
                  <div className="monthly-expense-meta">
                    <span className="monthly-expense-month">{formatMonthDisplay(expense.expenseMonth)}</span>
                    <span className="monthly-expense-employee">👤 {expense.expensedBy}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating Add Button */}
        <button 
          className="monthly-add-button"
          onClick={() => setShowAddModal(true)}
        >
          <span className="monthly-add-icon">+</span>
        </button>

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
}

export default MonthlyExpenses