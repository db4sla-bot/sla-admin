import React, { useState, useEffect } from 'react'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { ChevronRight, BarChart2, Calendar, Users, Funnel, Clock, CheckCircle, XCircle, Search, Filter, Download, TrendingUp, User, CalendarDays } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import './TimesheetReport.css'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'

const TimesheetReport = () => {
  const [timesheetData, setTimesheetData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: 'thisMonth',
    employee: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    searchTerm: ''
  })

  const [activeView, setActiveView] = useState('overview')

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, timesheetData])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch timesheet data
      const timesheetQuery = query(
        collection(db, "Timesheet"),
        orderBy("timestamp", "desc")
      )
      const timesheetSnapshot = await getDocs(timesheetQuery)
      const timesheetList = timesheetSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Fetch employees
      const employeesSnapshot = await getDocs(collection(db, "Employees"))
      const employeesList = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setTimesheetData(timesheetList)
      setEmployees(employeesList)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch timesheet data")
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...timesheetData]

    // Date range filter
    const now = new Date()
    let startDate, endDate

    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'thisWeek':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
        endDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6, 23, 59, 59)
        break
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
        break
      case 'custom':
        if (filters.startDate && filters.endDate) {
          startDate = new Date(filters.startDate)
          endDate = new Date(filters.endDate)
          endDate.setHours(23, 59, 59)
        }
        break
    }

    if (startDate && endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= endDate
      })
    }

    // Employee filter
    if (filters.employee !== 'all') {
      filtered = filtered.filter(item => item.userId === filters.employee)
    }

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(item =>
        item.userName?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }

  const getStatistics = () => {
    const totalHours = filteredData.reduce((sum, item) => sum + (item.workingHours || 0), 0)
    const totalOvertimeHours = filteredData.reduce((sum, item) => sum + (item.overtimeHours || 0), 0)
    const totalEntries = filteredData.length
    const uniqueEmployees = new Set(filteredData.map(item => item.userId)).size
    const averageHours = totalEntries > 0 ? totalHours / totalEntries : 0

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      totalEntries,
      uniqueEmployees,
      averageHours: Math.round(averageHours * 100) / 100
    }
  }

  const getDailyData = () => {
    const dailyMap = new Map()
    
    filteredData.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
      
      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date)
        dailyMap.set(date, {
          ...existing,
          hours: existing.hours + (item.workingHours || 0),
          overtime: existing.overtime + (item.overtimeHours || 0)
        })
      } else {
        dailyMap.set(date, {
          date,
          hours: item.workingHours || 0,
          overtime: item.overtimeHours || 0
        })
      }
    })

    return Array.from(dailyMap.values()).slice(-7) // Last 7 days
  }

  const getEmployeeData = () => {
    const employeeMap = new Map()
    
    filteredData.forEach(item => {
      const employeeName = item.userName || 'Unknown'
      
      if (employeeMap.has(employeeName)) {
        const existing = employeeMap.get(employeeName)
        employeeMap.set(employeeName, {
          ...existing,
          hours: existing.hours + (item.workingHours || 0),
          days: existing.days + 1
        })
      } else {
        employeeMap.set(employeeName, {
          name: employeeName,
          hours: item.workingHours || 0,
          days: 1
        })
      }
    })

    return Array.from(employeeMap.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5) // Top 5 employees
  }

  const getHoursDistribution = () => {
    const ranges = [
      { name: '0-4 hours', min: 0, max: 4, count: 0 },
      { name: '4-6 hours', min: 4, max: 6, count: 0 },
      { name: '6-8 hours', min: 6, max: 8, count: 0 },
      { name: '8+ hours', min: 8, max: 24, count: 0 }
    ]

    filteredData.forEach(item => {
      const hours = item.workingHours || 0
      ranges.forEach(range => {
        if (hours >= range.min && hours < range.max) {
          range.count++
        }
      })
    })

    return ranges.filter(range => range.count > 0)
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Employee', 'Working Hours', 'Overtime Hours', 'Total Hours', 'Description'],
      ...filteredData.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.userName || 'Unknown',
        item.workingHours || 0,
        item.overtimeHours || 0,
        (item.workingHours || 0) + (item.overtimeHours || 0),
        item.description || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timesheet_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Report exported successfully!')
  }

  const statistics = getStatistics()
  const dailyData = getDailyData()
  const employeeData = getEmployeeData()
  const hoursDistribution = getHoursDistribution()

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Timesheet Report</h1>
          </div>
        </div>
        <div className="timesheet-loading">
          <div className="timesheet-loading-spinner"></div>
          Loading timesheet data...
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
            <BarChart2 style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Timesheet Report
          </h1>
        </div>
        <div className="timesheet-header-actions">
          <button 
            className="timesheet-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <button 
            className="timesheet-export-btn"
            onClick={exportData}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="timesheet-report-container">
        {/* Enhanced Tab Navigation */}
        <div className="timesheet-tabs-navigation">
          <button 
            className={`timesheet-tab-button ${activeView === 'overview' ? 'timesheet-tab-active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <BarChart2 size={18} />
            Overview
          </button>
          <button 
            className={`timesheet-tab-button ${activeView === 'analytics' ? 'timesheet-tab-active' : ''}`}
            onClick={() => setActiveView('analytics')}
          >
            <TrendingUp size={18} />
            Analytics
          </button>
          <button 
            className={`timesheet-tab-button ${activeView === 'detailed' ? 'timesheet-tab-active' : ''}`}
            onClick={() => setActiveView('detailed')}
          >
            <Calendar size={18} />
            Detailed View
          </button>
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <div className="timesheet-filters-section">
            <div className="timesheet-filters-grid">
              <div className="timesheet-filter-group">
                <label className="timesheet-filter-label">Date Range</label>
                <select
                  className="timesheet-filter-select"
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div className="timesheet-filter-group">
                    <label className="timesheet-filter-label">Start Date</label>
                    <input
                      type="date"
                      className="timesheet-filter-input"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="timesheet-filter-group">
                    <label className="timesheet-filter-label">End Date</label>
                    <input
                      type="date"
                      className="timesheet-filter-input"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="timesheet-filter-group">
                <label className="timesheet-filter-label">Employee</label>
                <select
                  className="timesheet-filter-select"
                  value={filters.employee}
                  onChange={(e) => setFilters(prev => ({ ...prev, employee: e.target.value }))}
                >
                  <option value="all">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="timesheet-filter-group">
                <label className="timesheet-filter-label">Search</label>
                <div className="timesheet-search-wrapper">
                  <input
                    type="text"
                    className="timesheet-filter-input"
                    placeholder="Search by employee name or description..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                  <Search size={16} className="timesheet-search-icon" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="timesheet-overview-content">
            {/* Enhanced Summary Cards */}
            <div className="timesheet-summary-grid">
              <div className="timesheet-summary-card">
                <div className="timesheet-summary-icon working-hours">
                  <Clock size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-value">{statistics.totalHours}h</div>
                  <div className="timesheet-summary-label">Total Hours</div>
                  <div className="timesheet-summary-change positive">
                    <TrendingUp size={12} />
                    +12% from last period
                  </div>
                </div>
              </div>

              <div className="timesheet-summary-card">
                <div className="timesheet-summary-icon overtime-hours">
                  <CheckCircle size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-value">{statistics.totalOvertimeHours}h</div>
                  <div className="timesheet-summary-label">Overtime Hours</div>
                  <div className="timesheet-summary-change neutral">
                    <TrendingUp size={12} />
                    +5% from last period
                  </div>
                </div>
              </div>

              <div className="timesheet-summary-card">
                <div className="timesheet-summary-icon total-entries">
                  <CalendarDays size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-value">{statistics.totalEntries}</div>
                  <div className="timesheet-summary-label">Total Entries</div>
                  <div className="timesheet-summary-change positive">
                    <TrendingUp size={12} />
                    +8% from last period
                  </div>
                </div>
              </div>

              <div className="timesheet-summary-card">
                <div className="timesheet-summary-icon active-employees">
                  <Users size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-value">{statistics.uniqueEmployees}</div>
                  <div className="timesheet-summary-label">Active Employees</div>
                  <div className="timesheet-summary-change neutral">
                    <TrendingUp size={12} />
                    No change
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="timesheet-charts-section">
              <div className="timesheet-chart-container">
                <div className="timesheet-chart-header">
                  <h3 className="timesheet-chart-title">Daily Hours Trend</h3>
                  <div className="timesheet-chart-period">Last 7 Days</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value}h`, 
                        name === 'hours' ? 'Working Hours' : 'Overtime Hours'
                      ]}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overtime" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="timesheet-chart-container">
                <div className="timesheet-chart-header">
                  <h3 className="timesheet-chart-title">Hours Distribution</h3>
                  <div className="timesheet-chart-period">Current Period</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={hoursDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {hoursDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeView === 'analytics' && (
          <div className="timesheet-analytics-content">
            <div className="timesheet-employee-performance">
              <h3 className="timesheet-section-title">Top Performers</h3>
              <div className="timesheet-employee-list">
                {employeeData.map((employee, index) => (
                  <div key={employee.name} className="timesheet-employee-item">
                    <div className="timesheet-employee-rank">#{index + 1}</div>
                    <div className="timesheet-employee-avatar">
                      <User size={20} />
                    </div>
                    <div className="timesheet-employee-details">
                      <div className="timesheet-employee-name">{employee.name}</div>
                      <div className="timesheet-employee-stats">
                        {employee.hours}h • {employee.days} days
                      </div>
                    </div>
                    <div className="timesheet-employee-progress">
                      <div 
                        className="timesheet-progress-bar"
                        style={{ 
                          width: `${(employee.hours / Math.max(...employeeData.map(e => e.hours))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="timesheet-productivity-metrics">
              <h3 className="timesheet-section-title">Productivity Metrics</h3>
              <div className="timesheet-metrics-grid">
                <div className="timesheet-metric-item">
                  <div className="timesheet-metric-label">Average Hours/Day</div>
                  <div className="timesheet-metric-value">{statistics.averageHours}h</div>
                </div>
                <div className="timesheet-metric-item">
                  <div className="timesheet-metric-label">Total Work Days</div>
                  <div className="timesheet-metric-value">{statistics.totalEntries}</div>
                </div>
                <div className="timesheet-metric-item">
                  <div className="timesheet-metric-label">Overtime Percentage</div>
                  <div className="timesheet-metric-value">
                    {statistics.totalHours > 0 ? 
                      Math.round((statistics.totalOvertimeHours / statistics.totalHours) * 100) : 0}%
                  </div>
                </div>
                <div className="timesheet-metric-item">
                  <div className="timesheet-metric-label">Avg Hours/Employee</div>
                  <div className="timesheet-metric-value">
                    {statistics.uniqueEmployees > 0 ? 
                      Math.round((statistics.totalHours / statistics.uniqueEmployees) * 100) / 100 : 0}h
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed View Tab */}
        {activeView === 'detailed' && (
          <div className="timesheet-detailed-content">
            <div className="timesheet-table-header">
              <h3 className="timesheet-table-title">Detailed Timesheet Records</h3>
              <div className="timesheet-table-count">
                {filteredData.length} {filteredData.length === 1 ? 'record' : 'records'}
              </div>
            </div>

            {filteredData.length === 0 ? (
              <div className="timesheet-empty-state">
                <div className="timesheet-empty-icon">📅</div>
                <div className="timesheet-empty-title">No timesheet records found</div>
                <div className="timesheet-empty-text">
                  Try adjusting your filters to see more data.
                </div>
              </div>
            ) : (
              <div className="timesheet-detailed-table">
                <table className="timesheet-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Working Hours</th>
                      <th>Overtime</th>
                      <th>Total Hours</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((record) => (
                      <tr key={record.id}>
                        <td className="timesheet-table-date">
                          {new Date(record.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="timesheet-table-employee">
                          <div className="timesheet-employee-cell">
                            <div className="timesheet-employee-avatar small">
                              <User size={16} />
                            </div>
                            <span>{record.userName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="timesheet-table-hours">
                          <span className="timesheet-hours-badge working">
                            {record.workingHours || 0}h
                          </span>
                        </td>
                        <td className="timesheet-table-overtime">
                          <span className="timesheet-hours-badge overtime">
                            {record.overtimeHours || 0}h
                          </span>
                        </td>
                        <td className="timesheet-table-total">
                          <span className="timesheet-hours-badge total">
                            {(record.workingHours || 0) + (record.overtimeHours || 0)}h
                          </span>
                        </td>
                        <td className="timesheet-table-description">
                          {record.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default TimesheetReport