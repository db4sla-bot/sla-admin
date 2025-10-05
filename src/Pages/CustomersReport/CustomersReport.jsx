import React, { useState, useEffect } from 'react'
import './CustomersReport.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  BarChart3,
  PieChart,
  Eye,
  User,
  X,
  ChevronDown,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck
} from 'lucide-react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

const CustomersReport = () => {
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [employees, setEmployees] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('thisMonth')
  const [showFilters, setShowFilters] = useState(false)

  const dateFilterOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Last Year', value: 'lastYear' }
  ]

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [customers, payments, dateFilter, searchTerm])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      
      // Fetch customers - Fix the query to handle missing createdAt
      const customersQuery = query(collection(db, 'Customers'))
      const customersSnapshot = await getDocs(customersQuery)
      const customersList = customersSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          // Handle different date field formats
          createdAt: data.createdAt?.toDate?.() || 
                    (data.createdDate ? new Date(data.createdDate) : new Date())
        }
      })
      
      console.log('Fetched customers:', customersList) // Debug log
      
      // Fetch payments
      const paymentsQuery = query(collection(db, 'Payments'), orderBy('paymentDate', 'desc'))
      const paymentsSnapshot = await getDocs(paymentsQuery)
      const paymentsList = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate?.() || new Date()
      }))
      
      // Fetch employees
      const employeesSnapshot = await getDocs(collection(db, 'Employees'))
      const employeesList = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setCustomers(customersList)
      setPayments(paymentsList)
      setEmployees(employeesList)
      
      console.log('Set customers state:', customersList.length) // Debug log
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = (filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      case 'thisWeek':
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        return {
          start: startOfWeek,
          end: new Date()
        }
      case 'lastWeek':
        const lastWeekStart = new Date(today)
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        return {
          start: lastWeekStart,
          end: lastWeekEnd
        }
      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date()
        }
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: lastMonth,
          end: lastMonthEnd
        }
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date()
        }
      case 'lastYear':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        }
      default:
        return null
    }
  }

  const applyFilters = () => {
    let filtered = [...customers]
    let filteredPaymentsList = [...payments]

    // Debug log
    console.log('Applying filters to customers:', customers.length)
    console.log('Date filter:', dateFilter)

    // Date filter - Only apply if not 'all' and customers have valid dates
    if (dateFilter !== 'all' && dateFilter !== 'thisMonth') {
      const dateRange = getDateRange(dateFilter)
      if (dateRange) {
        filtered = filtered.filter(customer => {
          const customerDate = new Date(customer.createdAt)
          // Validate date
          if (isNaN(customerDate.getTime())) {
            return true // Include customers with invalid dates
          }
          return customerDate >= dateRange.start && customerDate <= dateRange.end
        })
        
        filteredPaymentsList = filteredPaymentsList.filter(payment => {
          const paymentDate = new Date(payment.paymentDate)
          if (isNaN(paymentDate.getTime())) {
            return true // Include payments with invalid dates
          }
          return paymentDate >= dateRange.start && paymentDate <= dateRange.end
        })
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile?.includes(searchTerm) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    console.log('Filtered customers result:', filtered.length) // Debug log
    
    setFilteredCustomers(filtered)
    setFilteredPayments(filteredPaymentsList)
  }

  const getStatistics = () => {
    // Basic counts - Use customers array directly for total count
    const totalCustomers = customers.length // Use full customers array
    const filteredCustomersCount = filteredCustomers.length // Use filtered for display
    const totalEmployees = employees.length
    
    console.log('Statistics - Total customers:', totalCustomers, 'Filtered:', filteredCustomersCount) // Debug log
    
    // Payment calculations
    const totalAmountReceived = filteredPayments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0)
    
    // Customer payment status - use filteredCustomers for calculations
    const customersWithPayments = new Set(filteredPayments.map(p => p.customerId))
    const paymentCompletedCustomers = filteredCustomers.filter(customer => {
      if (!customer.payments || customer.payments.length === 0) return false
      return customer.payments.every(payment => {
        const totalPaid = payment.paid?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        return totalPaid >= payment.totalAmount
      })
    }).length
    
    const pendingPaymentCustomers = filteredCustomers.filter(customer => {
      if (!customer.payments || customer.payments.length === 0) return false
      return customer.payments.some(payment => {
        const totalPaid = payment.paid?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        return totalPaid < payment.totalAmount
      })
    }).length
    
    // Calculate pending amount
    const totalPendingAmount = filteredCustomers.reduce((sum, customer) => {
      if (!customer.payments) return sum
      return sum + customer.payments.reduce((paySum, payment) => {
        const totalPaid = payment.paid?.reduce((pSum, p) => pSum + (p.amount || 0), 0) || 0
        return paySum + Math.max(0, payment.totalAmount - totalPaid)
      }, 0)
    }, 0)

    return {
      totalCustomers: filteredCustomersCount, // Show filtered count in display
      totalEmployees,
      totalAmountReceived,
      totalPendingAmount,
      paymentCompletedCustomers,
      pendingPaymentCustomers,
      customersWithPayments: customersWithPayments.size,
      customersWithoutPayments: filteredCustomersCount - customersWithPayments.size
    }
  }

  const getChartData = () => {
    // Monthly customer registration data
    const monthlyData = {}
    const now = new Date()
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      monthlyData[monthKey] = { 
        month: monthName, 
        customers: 0, 
        payments: 0,
        amount: 0
      }
    }

    // Count customers by month
    filteredCustomers.forEach(customer => {
      const customerDate = new Date(customer.createdAt)
      const monthKey = customerDate.toISOString().slice(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].customers++
      }
    })

    // Count payments by month
    filteredPayments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate)
      const monthKey = paymentDate.toISOString().slice(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].payments++
        monthlyData[monthKey].amount += payment.paidAmount || 0
      }
    })

    return Object.values(monthlyData)
  }

  const getPaymentStatusData = () => {
    const stats = getStatistics()
    return [
      { name: 'Payment Completed', value: stats.paymentCompletedCustomers, color: '#10b981' },
      { name: 'Payment Pending', value: stats.pendingPaymentCustomers, color: '#f59e0b' },
      { name: 'No Payments', value: stats.customersWithoutPayments, color: '#ef4444' }
    ]
  }

  const exportData = () => {
    try {
      const csvContent = [
        ['Customer Name', 'Email', 'Mobile', 'City', 'Registration Date', 'Payment Status', 'Total Amount', 'Paid Amount', 'Pending Amount'],
        ...filteredCustomers.map(customer => {
          const totalAmount = customer.payments?.reduce((sum, p) => sum + p.totalAmount, 0) || 0
          const paidAmount = customer.payments?.reduce((sum, p) => 
            sum + (p.paid?.reduce((pSum, paid) => pSum + paid.amount, 0) || 0), 0) || 0
          const pendingAmount = totalAmount - paidAmount
          
          let paymentStatus = 'No Payments'
          if (totalAmount > 0) {
            paymentStatus = pendingAmount <= 0 ? 'Completed' : 'Pending'
          }
          
          return [
            customer.name || '',
            customer.email || '',
            customer.mobile || '',
            customer.city || '',
            new Date(customer.createdAt).toLocaleDateString(),
            paymentStatus,
            totalAmount,
            paidAmount,
            pendingAmount
          ]
        })
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers_report_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      alert('Customer report exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    }
  }

  const statistics = getStatistics()
  const chartData = getChartData()
  const paymentStatusData = getPaymentStatusData()
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Customers Report</h1>
          </div>
        </div>
        <div className="customers-report-loading">
          <div className="customers-report-loading-spinner"></div>
          Loading customer data...
        </div>
      </>
    )
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
            <BarChart3 style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Customers Report
          </h1>
        </div>
        <div className="customers-report-header-actions">
          <button 
            className="customers-report-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <button 
            className="customers-report-export-btn"
            onClick={exportData}
            disabled={filteredCustomers.length === 0}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="customers-report-container">
        {/* Statistics Cards */}
        <div className="customers-report-stats-grid">
          <div className="customers-report-stat-card">
            <div className="customers-report-stat-icon total-customers">
              <Users size={24} />
            </div>
            <div className="customers-report-stat-content">
              <div className="customers-report-stat-value">{statistics.totalCustomers}</div>
              <div className="customers-report-stat-label">Total Customers</div>
              <div className="customers-report-stat-sub">Registered in system</div>
            </div>
          </div>

          <div className="customers-report-stat-card">
            <div className="customers-report-stat-icon total-employees">
              <UserCheck size={24} />
            </div>
            <div className="customers-report-stat-content">
              <div className="customers-report-stat-value">{statistics.totalEmployees}</div>
              <div className="customers-report-stat-label">Total Employees</div>
              <div className="customers-report-stat-sub">Active in system</div>
            </div>
          </div>

          <div className="customers-report-stat-card">
            <div className="customers-report-stat-icon amount-received">
              <IndianRupee size={24} />
            </div>
            <div className="customers-report-stat-content">
              <div className="customers-report-stat-value">₹{statistics.totalAmountReceived.toLocaleString()}</div>
              <div className="customers-report-stat-label">Amount Received</div>
              <div className="customers-report-stat-sub">Total payments collected</div>
            </div>
          </div>

          <div className="customers-report-stat-card">
            <div className="customers-report-stat-icon pending-amount">
              <Clock size={24} />
            </div>
            <div className="customers-report-stat-content">
              <div className="customers-report-stat-value">₹{statistics.totalPendingAmount.toLocaleString()}</div>
              <div className="customers-report-stat-label">Pending Amount</div>
              <div className="customers-report-stat-sub">Yet to be collected</div>
            </div>
          </div>

          <div className="customers-report-stat-card">
            <div className="customers-report-stat-icon completed-customers">
              <CheckCircle size={24} />
            </div>
            <div className="customers-report-stat-content">
              <div className="customers-report-stat-value">{statistics.paymentCompletedCustomers}</div>
              <div className="customers-report-stat-label">Payment Completed</div>
              <div className="customers-report-stat-sub">Customers with full payment</div>
            </div>
          </div>

          <div className="customers-report-stat-card">
            <div className="customers-report-stat-icon pending-customers">
              <AlertCircle size={24} />
            </div>
            <div className="customers-report-stat-content">
              <div className="customers-report-stat-value">{statistics.pendingPaymentCustomers}</div>
              <div className="customers-report-stat-label">Payment Pending</div>
              <div className="customers-report-stat-sub">Customers with pending payment</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="customers-report-charts-section">
          <div className="customers-report-chart-card">
            <div className="customers-report-chart-header">
              <h3>Customer Registration & Payment Trends</h3>
              <div className="customers-report-chart-legend">
                <span className="customers-report-legend-item">
                  <span className="customers-report-legend-color" style={{ backgroundColor: '#3b82f6' }}></span>
                  Customers
                </span>
                <span className="customers-report-legend-item">
                  <span className="customers-report-legend-color" style={{ backgroundColor: '#10b981' }}></span>
                  Payments
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="customers" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="payments" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="customers-report-chart-card">
            <div className="customers-report-chart-header">
              <h3>Payment Status Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="customers-report-filters-section">
            <div className="customers-report-filters-header">
              <h3>
                <Filter size={20} />
                Filter Customers
              </h3>
              <button 
                className="customers-report-close-filters"
                onClick={() => setShowFilters(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="customers-report-filters-grid">
              {dateFilterOptions.map(option => (
                <button
                  key={option.value}
                  className={`customers-report-filter-option ${dateFilter === option.value ? 'active' : ''}`}
                  onClick={() => setDateFilter(option.value)}
                >
                  <Calendar size={16} />
                  {option.label}
                </button>
              ))}
            </div>

            <div className="customers-report-search-section">
              <div className="customers-report-search-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by name, email, mobile, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="customers-report-search-input"
                />
              </div>
            </div>

            <div className="customers-report-filter-summary">
              <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="customers-report-list-section">
          <div className="customers-report-list-header">
            <h3 className="customers-report-list-title">
              <Eye size={20} />
              Customer Records ({filteredCustomers.length})
            </h3>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="customers-report-empty-state">
              <div className="customers-report-empty-icon">👥</div>
              <div className="customers-report-empty-title">No customers found</div>
              <div className="customers-report-empty-text">
                {customers.length === 0 
                  ? "No customers have been registered yet."
                  : "Try adjusting your filters to see more data."}
              </div>
            </div>
          ) : (
            <div className="customers-report-grid">
              {filteredCustomers.map((customer) => {
                const totalAmount = customer.payments?.reduce((sum, p) => sum + p.totalAmount, 0) || 0
                const paidAmount = customer.payments?.reduce((sum, p) => 
                  sum + (p.paid?.reduce((pSum, paid) => pSum + paid.amount, 0) || 0), 0) || 0
                const pendingAmount = totalAmount - paidAmount
                
                let paymentStatus = 'no-payments'
                let statusText = 'No Payments'
                if (totalAmount > 0) {
                  paymentStatus = pendingAmount <= 0 ? 'completed' : 'pending'
                  statusText = pendingAmount <= 0 ? 'Payment Completed' : 'Payment Pending'
                }

                return (
                  <div key={customer.id} className="customers-report-card">
                    <div className="customers-report-card-header">
                      <div className="customers-report-card-avatar">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div className="customers-report-card-info">
                        <h4 className="customers-report-card-name">{customer.name}</h4>
                        <div className="customers-report-card-date">
                          <Calendar size={12} />
                          Registered: {new Date(customer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`customers-report-payment-status ${paymentStatus}`}>
                        {paymentStatus === 'completed' && <CheckCircle size={16} />}
                        {paymentStatus === 'pending' && <Clock size={16} />}
                        {paymentStatus === 'no-payments' && <AlertCircle size={16} />}
                        {statusText}
                      </div>
                    </div>

                    <div className="customers-report-card-body">
                      <div className="customers-report-card-contact">
                        <div className="customers-report-contact-item">
                          <Mail size={14} />
                          <span>{customer.email || 'No email'}</span>
                        </div>
                        <div className="customers-report-contact-item">
                          <Phone size={14} />
                          <span>{customer.mobile || 'No mobile'}</span>
                        </div>
                        <div className="customers-report-contact-item">
                          <MapPin size={14} />
                          <span>{`${customer.city || 'Unknown'}, ${customer.state || 'Unknown'}`}</span>
                        </div>
                      </div>

                      {totalAmount > 0 && (
                        <div className="customers-report-payment-details">
                          <div className="customers-report-payment-row">
                            <span className="customers-report-payment-label">Total Amount:</span>
                            <span className="customers-report-payment-value">₹{totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="customers-report-payment-row">
                            <span className="customers-report-payment-label">Paid Amount:</span>
                            <span className="customers-report-payment-value paid">₹{paidAmount.toLocaleString()}</span>
                          </div>
                          <div className="customers-report-payment-row">
                            <span className="customers-report-payment-label">Pending Amount:</span>
                            <span className="customers-report-payment-value pending">₹{pendingAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                      <div className="customers-report-card-stats">
                        <div className="customers-report-card-stat">
                          <Briefcase size={14} />
                          <span className="customers-report-stat-value">{customer.work?.length || 0}</span>
                          <span className="customers-report-stat-label">Work Items</span>
                        </div>
                        <div className="customers-report-card-stat">
                          <TrendingUp size={14} />
                          <span className="customers-report-stat-value">{customer.payments?.length || 0}</span>
                          <span className="customers-report-stat-label">Payment Plans</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CustomersReport