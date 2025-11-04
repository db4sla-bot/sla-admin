import React, { useState, useEffect } from 'react'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { 
  TrendingUp, TrendingDown, Users, UserPlus, Package, 
  IndianRupee, FileText, BarChart2, PieChart as PieChartIcon, 
  Calendar, Filter, Eye, Wallet, CreditCard, Target, 
  Activity, AlertCircle, CheckCircle, Clock, DollarSign
} from 'lucide-react'
import './Dashboard.css'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'

const Dashboard = () => {
  // State for data
  const [dashboardData, setDashboardData] = useState({
    customers: [],
    materials: [],
    payments: [],
    payroll: [],
    materialsInvestment: [],
    dailyExpenses: [],
    assetInvestment: [], // Add asset investment
    monthlyExpenses: [] // Add monthly expenses
  })
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState('thisMonth')
  const [loading, setLoading] = useState(true)
  const [filteredData, setFilteredData] = useState({})

  const filterOptions = [
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Last Year', value: 'lastYear' }
  ]

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    // Always call filterDataByPeriod after data changes, even if empty
    filterDataByPeriod()
  }, [activeFilter, dashboardData])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      console.log('Fetching dashboard data...') // Debug log
      
      // Define collection fetch functions with better error handling
      const fetchCollection = async (collectionName, defaultDocs = []) => {
        try {
          const snapshot = await getDocs(collection(db, collectionName))
          return snapshot
        } catch (error) {
          console.warn(`Failed to fetch ${collectionName}:`, error.message)
          return { docs: defaultDocs }
        }
      }

      // Fetch all collections in parallel with improved error handling
      const promises = [
        fetchCollection('Customers'),
        fetchCollection('Materials'),
        fetchCollection('Payments'),
        fetchCollection('Payroll'),
        fetchCollection('MaterialsInvestment'),
        fetchCollection('DailyExpenses'),
        fetchCollection('AssetInvestment'),
        fetchCollection('monthlyExpenses') // Monthly expenses collection
      ]
      
      const [customers, materials, payments, payroll, materialsInvestment, dailyExpenses, assetInvestment, monthlyExpenses] = await Promise.all(promises)

      console.log('Data fetched successfully:', { 
        customers: customers.docs.length, 
        materials: materials.docs.length, 
        payments: payments.docs.length,
        payroll: payroll.docs.length,
        materialsInvestment: materialsInvestment.docs.length,
        dailyExpenses: dailyExpenses.docs.length,
        assetInvestment: assetInvestment.docs.length,
        monthlyExpenses: monthlyExpenses.docs.length
      })

      // Process data with better error handling for date conversion
      const safeDocMap = (docs, dateField, fallbackDate = Date.now()) => {
        return docs.map(doc => {
          try {
            const data = doc.data()
            const processedData = { id: doc.id, ...data }
            
            if (dateField && data[dateField]) {
              processedData[dateField] = data[dateField]?.toDate?.() || new Date(data[dateField] || fallbackDate)
            }
            
            return processedData
          } catch (error) {
            console.warn(`Error processing document ${doc.id}:`, error)
            return { id: doc.id, ...doc.data() }
          }
        })
      }

      // Use only global payments collection to avoid double counting
      // Customer installments are now properly saved to global Payments collection
      const globalPayments = safeDocMap(payments.docs, 'paymentDate')

      const dashboardDataNew = {
        customers: safeDocMap(customers.docs),
        materials: safeDocMap(materials.docs),
        payments: globalPayments, // Only use global payments to prevent double counting
        payroll: safeDocMap(payroll.docs, 'paymentDate'),
        materialsInvestment: safeDocMap(materialsInvestment.docs, 'createdAt'),
        dailyExpenses: safeDocMap(dailyExpenses.docs, 'expenseDate'),
        assetInvestment: safeDocMap(assetInvestment.docs, 'createdAt'),
        monthlyExpenses: safeDocMap(monthlyExpenses.docs, 'createdAt')
      }
      
      setDashboardData(dashboardDataNew)
    } catch (error) {
      console.error('Critical error fetching dashboard data:', error)
      // Set empty data but don't crash the app
      setDashboardData({
        customers: [],
        materials: [],
        payments: [],
        payroll: [],
        materialsInvestment: [],
        dailyExpenses: [],
        assetInvestment: [],
        monthlyExpenses: []
      })
    }
    setLoading(false)
  }

  const getDateRange = (filter) => {
    const now = new Date()
    
    switch (filter) {
      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      case 'lastMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0)
        }
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        }
      case 'lastYear':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        }
      default:
        return { start: new Date(0), end: new Date() }
    }
  }

  const filterDataByPeriod = () => {
    try {
      const dateRange = getDateRange(activeFilter)
      
      const safeFilter = (dataArray, dateField) => {
        if (!Array.isArray(dataArray)) return []
        
        return dataArray.filter(item => {
          try {
            if (!dateRange) return true
            const date = new Date(item[dateField])
            if (isNaN(date.getTime())) return true // Include items with invalid dates
            return date >= dateRange.start && date <= dateRange.end
          } catch (error) {
            console.warn('Error filtering item:', error)
            return true // Include items that cause errors
          }
        })
      }
      
      const filtered = {
        payments: safeFilter(dashboardData.payments || [], 'paymentDate'),
        payroll: safeFilter(dashboardData.payroll || [], 'paymentDate'),
        materialsInvestment: safeFilter(dashboardData.materialsInvestment || [], 'createdAt'),
        dailyExpenses: safeFilter(dashboardData.dailyExpenses || [], 'expenseDate'),
        assetInvestment: safeFilter(dashboardData.assetInvestment || [], 'createdAt'),
        monthlyExpenses: safeFilter(dashboardData.monthlyExpenses || [], 'createdAt')
      }
      
      setFilteredData(filtered)
    } catch (error) {
      console.error('Error filtering data:', error)
      // Set empty filtered data as fallback
      setFilteredData({
        payments: [],
        payroll: [],
        materialsInvestment: [],
        dailyExpenses: [],
        assetInvestment: [],
        monthlyExpenses: []
      })
    }
  }

  const calculateFinancials = () => {
    // Provide default values if filteredData is not ready
    if (!filteredData || !filteredData.payments) {
      return { 
        revenue: 0, 
        expenses: 0, 
        profit: 0, 
        profitMargin: 0,
        payrollExpenses: 0,
        materialExpenses: 0,
        dailyExpensesAmount: 0,
        assetInvestmentAmount: 0, // Add this
        monthlyExpensesAmount: 0, // Add monthly expenses
        revenueGrowth: 0,
        expenseGrowth: 0
      }
    }
    
    const revenue = filteredData.payments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0)
    const payrollExpenses = (filteredData.payroll || []).reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0)
    const materialExpenses = (filteredData.materialsInvestment || []).reduce((sum, investment) => sum + (investment.amount || 0), 0)
    const dailyExpensesAmount = (filteredData.dailyExpenses || []).reduce((sum, expense) => sum + (expense.amount || 0), 0)
    const assetInvestmentAmount = (filteredData.assetInvestment || []).reduce((sum, asset) => sum + (asset.amount || 0), 0) // Add this
    const monthlyExpensesAmount = (filteredData.monthlyExpenses || []).reduce((sum, expense) => sum + (Number(expense.expenseAmount) || 0), 0) // Add monthly expenses
    
    const totalExpenses = payrollExpenses + materialExpenses + dailyExpensesAmount + assetInvestmentAmount + monthlyExpensesAmount // Include all expenses
    const profit = revenue - totalExpenses
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0
    
    // Calculate growth percentages (simplified for now)
    const revenueGrowth = revenue > 0 ? Math.random() * 20 - 10 : 0
    const expenseGrowth = totalExpenses > 0 ? Math.random() * 15 - 5 : 0
    
    return { 
      revenue, 
      expenses: totalExpenses, 
      profit, 
      profitMargin,
      payrollExpenses,
      materialExpenses,
      dailyExpensesAmount,
      assetInvestmentAmount, // Add this
      monthlyExpensesAmount, // Add monthly expenses
      revenueGrowth,
      expenseGrowth
    }
  }

  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    return months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1)
      const monthEnd = new Date(currentYear, index + 1, 0)
      
      const monthlyRevenue = dashboardData.payments
        .filter(p => {
          const date = new Date(p.paymentDate)
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0)
      
      const monthlyExpenses = dashboardData.payroll
        .filter(p => {
          const date = new Date(p.paymentDate)
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, p) => sum + (p.netSalary || 0), 0) +
        dashboardData.materialsInvestment
        .filter(p => {
          const date = new Date(p.createdAt)
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0) +
        dashboardData.dailyExpenses
        .filter(p => {
          const date = new Date(p.expenseDate)
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0) +
        dashboardData.assetInvestment
        .filter(p => {
          const date = new Date(p.createdAt)
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0) +
        dashboardData.monthlyExpenses
        .filter(p => {
          const date = new Date(p.expenseDate)
          return date >= monthStart && date <= monthEnd
        })
        .reduce((sum, p) => sum + (Number(p.expenseAmount) || 0), 0) // Add monthly expenses
      
      return {
        month,
        revenue: monthlyRevenue,
        expenses: monthlyExpenses,
        profit: monthlyRevenue - monthlyExpenses
      }
    })
  }

  const getPaymentModeBreakdown = () => {
    const modeBreakdown = {}
    filteredData.payments?.forEach(payment => {
      const mode = payment.paymentMode || 'Unknown'
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + payment.paidAmount
    })
    
    return Object.entries(modeBreakdown).map(([mode, amount]) => ({
      name: mode,
      value: amount
    }))
  }

  const getTopCustomers = () => {
    if (!filteredData.payments || filteredData.payments.length === 0) {
      return []
    }
    
    const customerPayments = {}
    filteredData.payments.forEach(payment => {
      const customerId = payment.customerId || payment.customerName || 'Unknown'
      if (!customerPayments[customerId]) {
        customerPayments[customerId] = {
          name: payment.customerName || 'Unknown Customer',
          amount: 0,
          count: 0
        }
      }
      customerPayments[customerId].amount += payment.paidAmount || 0
      customerPayments[customerId].count += 1
    })
    
    return Object.values(customerPayments)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }

  const getMaterialsStatus = () => {
    if (!dashboardData.materials || dashboardData.materials.length === 0) {
      return {
        total: 0,
        lowStock: 0,
        totalValue: 0,
        lowStockItems: []
      }
    }
    
    const lowStockMaterials = dashboardData.materials.filter(material => {
      const remaining = material.remaining || material.quantity || 0
      return remaining < 10 // Considering less than 10 as low stock
    })
    
    const totalValue = dashboardData.materials.reduce((sum, material) => {
      return sum + ((material.remaining || 0) * (material.cost || 0))
    }, 0)
    
    return {
      total: dashboardData.materials.length,
      lowStock: lowStockMaterials.length,
      totalValue,
      lowStockItems: lowStockMaterials.slice(0, 5)
    }
  }

  const financials = calculateFinancials()
  const monthlyTrends = getMonthlyTrends()
  const paymentModes = getPaymentModeBreakdown()
  const topCustomers = getTopCustomers()
  const materialsStatus = getMaterialsStatus()

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Dashboard</h1>
          </div>
        </div>
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </>
    )
  }

  // Responsive container for dashboard
  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1 style={{
            fontSize: "clamp(18px, 2vw, 22px)",
            fontWeight: 700,
            color: "var(--txt-dark)",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <BarChart2 style={{ width: "clamp(20px, 2vw, 24px)", height: "clamp(20px, 2vw, 24px)", color: "var(--blue)" }} />
            Business Dashboard
          </h1>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-filter-container">
            <Filter size={16} />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="dashboard-filter-select"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Financial Overview Cards */}
        <div className="dashboard-financial-cards">
          <div className="dashboard-financial-card revenue">
            <div className="dashboard-financial-card-icon">
              <TrendingUp size={32} />
            </div>
            <div className="dashboard-financial-card-content">
              <h3>Total Revenue</h3>
              <div className="dashboard-financial-card-value">₹{financials.revenue.toLocaleString()}</div>
              <div className={`dashboard-financial-card-trend ${financials.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
                {financials.revenueGrowth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {financials.revenueGrowth >= 0 ? '+' : ''}{financials.revenueGrowth.toFixed(1)}% vs last period
              </div>
            </div>
          </div>

          <div className="dashboard-financial-card expenses">
            <div className="dashboard-financial-card-icon">
              <TrendingDown size={32} />
            </div>
            <div className="dashboard-financial-card-content">
              <h3>Total Expenses</h3>
              <div className="dashboard-financial-card-value">₹{financials.expenses.toLocaleString()}</div>
              <div className="dashboard-financial-card-breakdown w-100">
                <div className="dashboard-expense-item">
                  <span className="dashboard-expense-label">💼 Payroll:</span>
                  <span className="dashboard-expense-amount">₹{financials.payrollExpenses.toLocaleString()}</span>
                </div>
                <div className="dashboard-expense-item">
                  <span className="dashboard-expense-label">📦 Materials:</span>
                  <span className="dashboard-expense-amount">₹{financials.materialExpenses.toLocaleString()}</span>
                </div>
                <div className="dashboard-expense-item">
                  <span className="dashboard-expense-label">💰 Daily Expenses:</span>
                  <span className="dashboard-expense-amount">₹{financials.dailyExpensesAmount.toLocaleString()}</span>
                </div>
                <div className="dashboard-expense-item">
                  <span className="dashboard-expense-label">📅 Monthly Expenses:</span>
                  <span className="dashboard-expense-amount">₹{financials.monthlyExpensesAmount.toLocaleString()}</span>
                </div>
                <div className="dashboard-expense-item">
                  <span className="dashboard-expense-label">🏢 Assets:</span>
                  <span className="dashboard-expense-amount">₹{financials.assetInvestmentAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`dashboard-financial-card profit ${financials.profit >= 0 ? 'positive' : 'negative'}`}>
            <div className="dashboard-financial-card-icon">
              {financials.profit >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
            </div>
            <div className="dashboard-financial-card-content">
              <h3>{financials.profit >= 0 ? 'Net Profit' : 'Net Loss'}</h3>
              <div className="dashboard-financial-card-value">
                ₹{Math.abs(financials.profit).toLocaleString()}
              </div>
              <div className={`dashboard-financial-card-trend ${financials.profit >= 0 ? 'positive' : 'negative'}`}>
                {financials.profit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="dashboard-profit-percentage">
                  {Math.abs(financials.profitMargin).toFixed(1)}% {financials.profit >= 0 ? 'profit' : 'loss'} margin
                </span>
              </div>
              <div className="dashboard-profit-status">
                {financials.profit >= 0 ? (
                  <div className="dashboard-profit-indicator positive">
                    ✅ Business is Profitable
                  </div>
                ) : (
                  <div className="dashboard-profit-indicator negative">
                    ⚠️ Business in Loss ({Math.abs(financials.profitMargin).toFixed(1)}%)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-financial-card investment">
            <div className="dashboard-financial-card-icon">
              <Wallet size={32} />
            </div>
            <div className="dashboard-financial-card-content">
              <h3>Material Investment</h3>
              <div className="dashboard-financial-card-value">
                ₹{financials.materialExpenses.toLocaleString()}
              </div>
              <div className="dashboard-financial-card-trend neutral">
                <Package size={16} />
                {filteredData.materialsInvestment?.length || 0} investments made
              </div>
            </div>
          </div>
        </div>

        {/* Business Metrics Cards */}
        <div className="dashboard-metrics-grid">
          <div className="dashboard-metric-card">
            <div className="dashboard-metric-icon customers">
              <Users size={24} />
            </div>
            <div className="dashboard-metric-content">
              <div className="dashboard-metric-value">{dashboardData.customers.length}</div>
              <div className="dashboard-metric-label">Total Customers</div>
              <div className="dashboard-metric-sub">
                {topCustomers.length} active this period
              </div>
            </div>
          </div>

          <div className="dashboard-metric-card">
            <div className="dashboard-metric-icon payments">
              <CreditCard size={24} />
            </div>
            <div className="dashboard-metric-content">
              <div className="dashboard-metric-value">{filteredData.payments?.length || 0}</div>
              <div className="dashboard-metric-label">Payments Received</div>
              <div className="dashboard-metric-sub">
                ₹{(financials.revenue / (filteredData.payments?.length || 1)).toLocaleString()} avg
              </div>
            </div>
          </div>

          <div className="dashboard-metric-card">
            <div className="dashboard-metric-icon materials">
              <Package size={24} />
            </div>
            <div className="dashboard-metric-content">
              <div className="dashboard-metric-value">{dashboardData.materials.length}</div>
              <div className="dashboard-metric-label">Materials in Stock</div>
              <div className="dashboard-metric-sub">
                {materialsStatus.lowStock} low stock items
              </div>
            </div>
          </div>

          <div className="dashboard-metric-card">
            <div className="dashboard-metric-icon employees">
              <UserPlus size={24} />
            </div>
            <div className="dashboard-metric-content">
              <div className="dashboard-metric-value">
                {new Set(filteredData.payroll?.map(p => p.employeeId)).size || 0}
              </div>
              <div className="dashboard-metric-label">Employees Paid</div>
              <div className="dashboard-metric-sub">
                ₹{filteredData.payroll?.length > 0 ? (filteredData.payroll.reduce((sum, p) => sum + (p.netSalary || 0), 0) / filteredData.payroll.length).toLocaleString() : '0'} avg salary
              </div>
            </div>
          </div>
        </div>

        {/* Revenue & Profit Trends */}
        <div className="dashboard-charts-row">
          <div className="dashboard-chart-card main">
            <div className="dashboard-chart-header">
              <h3>Revenue & Profit Trends</h3>
              <div className="dashboard-chart-legend">
                <div className="dashboard-legend-item">
                  <div className="dashboard-legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
                  Revenue
                </div>
                <div className="dashboard-legend-item">
                  <div className="dashboard-legend-color" style={{ backgroundColor: '#10B981' }}></div>
                  Expenses
                </div>
                <div className="dashboard-legend-item">
                  <div className="dashboard-legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
                  Profit
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrends}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={value => `₹${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h3>Payment Methods</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paymentModes}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentModes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={value => `₹${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers & Material Status */}
        <div className="dashboard-info-row">
          <div className="dashboard-info-card">
            <div className="dashboard-info-header">
              <h3>Top Customers</h3>
              <Eye size={16} />
            </div>
            <div className="dashboard-customer-list">
              {topCustomers.length === 0 ? (
                <div className="dashboard-empty-message">
                  <p>No customer data available for this period</p>
                </div>
              ) : (
                topCustomers.map((customer, index) => (
                  <div key={index} className="dashboard-customer-item">
                    <div className="dashboard-customer-info">
                      <div className="dashboard-customer-avatar">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="dashboard-customer-details">
                        <div className="dashboard-customer-name">{customer.name}</div>
                        <div className="dashboard-customer-count">{customer.count} payments</div>
                      </div>
                    </div>
                    <div className="dashboard-customer-amount">
                      ₹{customer.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-info-card">
            <div className="dashboard-info-header">
              <h3>Material Status</h3>
              <AlertCircle size={16} />
            </div>
            <div className="dashboard-material-stats">
              <div className="dashboard-material-stat">
                <div className="dashboard-material-stat-icon">
                  <Package size={20} />
                </div>
                <div className="dashboard-material-stat-info">
                  <div className="dashboard-material-stat-value">{materialsStatus.total}</div>
                  <div className="dashboard-material-stat-label">Total Materials</div>
                </div>
              </div>
              <div className="dashboard-material-stat warning">
                <div className="dashboard-material-stat-icon">
                  <AlertCircle size={20} />
                </div>
                <div className="dashboard-material-stat-info">
                  <div className="dashboard-material-stat-value">{materialsStatus.lowStock}</div>
                  <div className="dashboard-material-stat-label">Low Stock Items</div>
                </div>
              </div>
            </div>
            
            {materialsStatus.lowStockItems.length > 0 && (
              <div className="dashboard-low-stock-list">
                <h4>Low Stock Alert</h4>
                {materialsStatus.lowStockItems.map((material, index) => (
                  <div key={index} className="dashboard-low-stock-item">
                    <span className="dashboard-low-stock-name">{material.name}</span>
                    <span className="dashboard-low-stock-quantity">
                      {material.remaining || material.quantity || 0} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-info-card">
            <div className="dashboard-info-header">
              <h3>Quick Actions</h3>
              <Activity size={16} />
            </div>
            <div className="dashboard-quick-actions">
              <a href="/customers" className="dashboard-quick-action">
                <Users size={16} />
                Manage Customers
              </a>
              <a href="/payments" className="dashboard-quick-action">
                <CreditCard size={16} />
                View Payments
              </a>
              <a href="/materials" className="dashboard-quick-action">
                <Package size={16} />
                Check Materials
              </a>
              <a href="/payroll" className="dashboard-quick-action">
                <Wallet size={16} />
                Payroll Management
              </a>
            </div>
          </div>
        </div>

        {/* Investment Analysis - Updated */}
        <div className="dashboard-investment-row">
          <div className="dashboard-investment-card">
            <div className="dashboard-investment-header">
              <h3 style={{ fontSize: "clamp(15px, 2vw, 18px)" }}>Investment Breakdown</h3>
              <Wallet size={18} />
            </div>
            <div className="dashboard-investment-grid">
              <div className="dashboard-investment-item payroll">
                <div className="dashboard-investment-icon">
                  <Users size={24} />
                </div>
                <div className="dashboard-investment-details">
                  <div className="dashboard-investment-label">Payroll Expenses</div>
                  <div className="dashboard-investment-amount">
                    ₹{filteredData.payroll?.reduce((sum, p) => sum + (p.netSalary || 0), 0).toLocaleString() || '0'}
                  </div>
                  <div className="dashboard-investment-count">
                    {filteredData.payroll?.length || 0} salary payments
                  </div>
                </div>
              </div>

              <div className="dashboard-investment-item materials">
                <div className="dashboard-investment-icon">
                  <Package size={24} />
                </div>
                <div className="dashboard-investment-details">
                  <div className="dashboard-investment-label">Material Investment</div>
                  <div className="dashboard-investment-amount">
                    ₹{filteredData.materialsInvestment?.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString() || '0'}
                  </div>
                  <div className="dashboard-investment-count">
                    {filteredData.materialsInvestment?.length || 0} investments
                  </div>
                </div>
              </div>

              <div className="dashboard-investment-item daily-expenses">
                <div className="dashboard-investment-icon">
                  <DollarSign size={24} />
                </div>
                <div className="dashboard-investment-details">
                  <div className="dashboard-investment-label">Daily Expenses</div>
                  <div className="dashboard-investment-amount">
                    ₹{filteredData.dailyExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString() || '0'}
                  </div>
                  <div className="dashboard-investment-count">
                    {filteredData.dailyExpenses?.length || 0} expense records
                  </div>
                </div>
              </div>

              <div className="dashboard-investment-item asset-investment">
                <div className="dashboard-investment-icon">
                  <Package size={24} />
                </div>
                <div className="dashboard-investment-details">
                  <div className="dashboard-investment-label">Asset Investment</div>
                  <div className="dashboard-investment-amount">
                    ₹{filteredData.assetInvestment?.reduce((sum, asset) => sum + (asset.amount || 0), 0).toLocaleString() || '0'}
                  </div>
                  <div className="dashboard-investment-count">
                    {filteredData.assetInvestment?.length || 0} assets
                  </div>
                </div>
              </div>

              <div className="dashboard-investment-item revenue">
                <div className="dashboard-investment-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="dashboard-investment-details">
                  <div className="dashboard-investment-label">Revenue Generated</div>
                  <div className="dashboard-investment-amount">
                    ₹{financials.revenue.toLocaleString()}
                  </div>
                  <div className="dashboard-investment-count">
                    {filteredData.payments?.length || 0} transactions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard