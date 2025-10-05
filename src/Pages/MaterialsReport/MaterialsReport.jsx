import React, { useState, useEffect } from 'react'
import './MaterialsReport.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Package, Filter, Download, TrendingUp, TrendingDown, AlertTriangle, Search, BarChart2, PieChart, Wrench } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'

const MaterialsReport = () => {
  const [materials, setMaterials] = useState([])
  const [filteredMaterials, setFilteredMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    searchTerm: '',
    dateRange: 'all'
  })

  const [activeView, setActiveView] = useState('overview')

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'out-of-stock', label: 'Out of Stock' }
  ]

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'grills', label: 'Invisible Grills' },
    { value: 'mesh', label: 'Mosquito Mesh' },
    { value: 'hangers', label: 'Cloth Hangers' },
    { value: 'grass', label: 'Artificial Grass' },
    { value: 'spikes', label: 'Bird Spikes' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'tools', label: 'Tools' },
    { value: 'accessories', label: 'Accessories' }
  ]

  useEffect(() => {
    fetchMaterials()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, materials])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      console.log('📦 Fetching materials data...')
      const querySnapshot = await getDocs(collection(db, "Materials"))
      const materialsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('✅ Materials fetched successfully:', materialsList.length, 'items')
      
      // Sort materials by name
      materialsList.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      
      setMaterials(materialsList)
    } catch (error) {
      console.error("❌ Error fetching materials:", error)
      toast.error("Failed to fetch materials data")
    }
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...materials]

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(material => {
        const status = getStatusInfo(material).status
        return status === filters.status
      })
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(material => 
        material.category?.toLowerCase().includes(filters.category.toLowerCase())
      )
    }

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(material =>
        material.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        material.category?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    setFilteredMaterials(filtered)
  }

  const getStatusInfo = (material) => {
    const remaining = material.remaining || 0
    const quantity = material.quantity || 0
    const bufferStock = material.bufferStock || 10
    
    if (remaining <= 0) {
      return {
        status: 'out-of-stock',
        label: 'Out of Stock',
        color: '#ef4444',
        percentage: 0,
        level: 'critical'
      }
    } else if (remaining <= bufferStock) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        color: '#f59e0b',
        percentage: Math.round((remaining / quantity) * 100),
        level: 'warning'
      }
    } else {
      return {
        status: 'in-stock',
        label: 'In Stock',
        color: '#22c55e',
        percentage: Math.round((remaining / quantity) * 100),
        level: 'good'
      }
    }
  }

  const getStatistics = () => {
    const inStock = materials.filter(m => getStatusInfo(m).status === 'in-stock').length
    const lowStock = materials.filter(m => getStatusInfo(m).status === 'low-stock').length
    const outOfStock = materials.filter(m => getStatusInfo(m).status === 'out-of-stock').length
    const totalValue = materials.reduce((sum, m) => sum + ((m.quantity || 0) * (m.unitPrice || 0)), 0)
    const totalQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0)
    const totalUsed = materials.reduce((sum, m) => sum + ((m.quantity || 0) - (m.remaining || 0)), 0)
    const totalRemaining = materials.reduce((sum, m) => sum + (m.remaining || 0), 0)
    
    return {
      total: materials.length,
      inStock,
      lowStock,
      outOfStock,
      totalValue: Math.round(totalValue),
      totalQuantity,
      totalUsed,
      totalRemaining,
      utilizationRate: totalQuantity > 0 ? Math.round((totalUsed / totalQuantity) * 100) : 0
    }
  }

  const getInventoryData = () => {
    const stats = getStatistics()
    return [
      { name: 'In Stock', value: stats.inStock, color: '#22c55e' },
      { name: 'Low Stock', value: stats.lowStock, color: '#f59e0b' },
      { name: 'Out of Stock', value: stats.outOfStock, color: '#ef4444' }
    ].filter(item => item.value > 0)
  }

  const getTopMaterials = () => {
    return materials
      .map(material => ({
        name: material.name || 'Unknown',
        quantity: material.quantity || 0,
        remaining: material.remaining || 0,
        used: (material.quantity || 0) - (material.remaining || 0),
        value: (material.quantity || 0) * (material.unitPrice || 0),
        unitPrice: material.unitPrice || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }

  const getCriticalStock = () => {
    return materials
      .filter(material => getStatusInfo(material).status !== 'in-stock')
      .map(material => ({
        ...material,
        statusInfo: getStatusInfo(material)
      }))
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 10)
  }

  const getCategoryData = () => {
    const categoryMap = new Map()
    
    materials.forEach(material => {
      const category = material.category || 'Uncategorized'
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category)
        categoryMap.set(category, {
          ...existing,
          count: existing.count + 1,
          value: existing.value + ((material.quantity || 0) * (material.unitPrice || 0))
        })
      } else {
        categoryMap.set(category, {
          name: category,
          count: 1,
          value: (material.quantity || 0) * (material.unitPrice || 0)
        })
      }
    })

    return Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }

  const exportData = () => {
    try {
      console.log('📁 Exporting materials data...')
      const csvContent = [
        ['Material Name', 'Category', 'Total Quantity', 'Remaining', 'Used', 'Status', 'Unit Price (₹)', 'Total Value (₹)'],
        ...filteredMaterials.map(material => {
          const statusInfo = getStatusInfo(material)
          return [
            material.name || 'Unknown',
            material.category || 'Uncategorized',
            material.quantity || 0,
            material.remaining || 0,
            (material.quantity || 0) - (material.remaining || 0),
            statusInfo.label,
            material.unitPrice || 0,
            (material.quantity || 0) * (material.unitPrice || 0)
          ]
        })
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `materials_report_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      console.log('✅ Materials report exported successfully!')
      toast.success('Materials report exported successfully!')
    } catch (error) {
      console.error('❌ Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const statistics = getStatistics()
  const inventoryData = getInventoryData()
  const topMaterials = getTopMaterials()
  const criticalStock = getCriticalStock()
  const categoryData = getCategoryData()

  const pieColors = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#f97316']

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Materials Report</h1>
          </div>
        </div>
        <div className="materials-report-loading">
          <div className="materials-report-loading-spinner"></div>
          Loading materials data...
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
            <Wrench style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Materials Report
          </h1>
        </div>
        <div className="materials-report-header-actions">
          <button 
            className="materials-report-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <button 
            className="materials-report-export-btn"
            onClick={exportData}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="materials-report-container">
        {/* Enhanced Tab Navigation */}
        <div className="materials-report-tabs-navigation">
          <button 
            className={`materials-report-tab-button ${activeView === 'overview' ? 'materials-report-tab-active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <BarChart2 size={18} />
            Overview
          </button>
          <button 
            className={`materials-report-tab-button ${activeView === 'analytics' ? 'materials-report-tab-active' : ''}`}
            onClick={() => setActiveView('analytics')}
          >
            <PieChart size={18} />
            Analytics
          </button>
          <button 
            className={`materials-report-tab-button ${activeView === 'detailed' ? 'materials-report-tab-active' : ''}`}
            onClick={() => setActiveView('detailed')}
          >
            <Package size={18} />
            Detailed View
          </button>
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <div className="materials-report-filters-section">
            <div className="materials-report-filters-grid">
              <div className="materials-report-filter-group">
                <label className="materials-report-filter-label">Status</label>
                <select
                  className="materials-report-filter-select"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))
                }
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="materials-report-filter-group">
                <label className="materials-report-filter-label">Category</label>
                <select
                  className="materials-report-filter-select"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))
                }
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="materials-report-filter-group">
                <label className="materials-report-filter-label">Search</label>
                <div className="materials-report-search-wrapper">
                  <input
                    type="text"
                    className="materials-report-filter-input"
                    placeholder="Search materials..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))
                }
                />
                  <Search size={16} className="materials-report-search-icon" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeView === 'overview' && (
          <div className="materials-report-overview-content">
            {/* Enhanced Summary Cards */}
            <div className="materials-report-summary-grid">
              <div className="materials-report-summary-card">
                <div className="materials-report-summary-icon total-materials">
                  <Package size={24} />
                </div>
                <div className="materials-report-summary-content">
                  <div className="materials-report-summary-value">{statistics.total}</div>
                  <div className="materials-report-summary-label">Total Materials</div>
                  <div className="materials-report-summary-change positive">
                    <TrendingUp size={12} />
                    Active inventory
                  </div>
                </div>
              </div>

              <div className="materials-report-summary-card">
                <div className="materials-report-summary-icon total-value">
                  <TrendingUp size={24} />
                </div>
                <div className="materials-report-summary-content">
                  <div className="materials-report-summary-value">₹{statistics.totalValue.toLocaleString()}</div>
                  <div className="materials-report-summary-label">Total Value</div>
                  <div className="materials-report-summary-change positive">
                    <TrendingUp size={12} />
                    Inventory worth
                  </div>
                </div>
              </div>

              <div className="materials-report-summary-card">
                <div className="materials-report-summary-icon critical-stock">
                  <AlertTriangle size={24} />
                </div>
                <div className="materials-report-summary-content">
                  <div className="materials-report-summary-value">{statistics.lowStock + statistics.outOfStock}</div>
                  <div className="materials-report-summary-label">Critical Stock</div>
                  <div className="materials-report-summary-change negative">
                    <TrendingDown size={12} />
                    Needs attention
                  </div>
                </div>
              </div>

              <div className="materials-report-summary-card">
                <div className="materials-report-summary-icon utilization">
                  <BarChart2 size={24} />
                </div>
                <div className="materials-report-summary-content">
                  <div className="materials-report-summary-value">{statistics.utilizationRate}%</div>
                  <div className="materials-report-summary-label">Utilization Rate</div>
                  <div className="materials-report-summary-change neutral">
                    <TrendingUp size={12} />
                    Usage efficiency
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="materials-report-charts-section">
              <div className="materials-report-chart-container">
                <div className="materials-report-chart-header">
                  <h3 className="materials-report-chart-title">Top Materials by Value</h3>
                  <div className="materials-report-chart-period">Current Inventory</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topMaterials}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'value' ? `₹${value.toLocaleString()}` : `${value} units`,
                        name === 'value' ? 'Total Value' : name === 'quantity' ? 'Total Quantity' : 'Remaining'
                      ]}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="materials-report-chart-container">
                <div className="materials-report-chart-header">
                  <h3 className="materials-report-chart-title">Stock Status Distribution</h3>
                  <div className="materials-report-chart-period">Current Status</div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={inventoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {inventoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeView === 'analytics' && (
          <div className="materials-report-analytics-content">
            <div className="materials-report-top-materials">
              <h3 className="materials-report-section-title">High-Value Materials</h3>
              <div className="materials-report-materials-list">
                {topMaterials.slice(0, 5).map((material, index) => (
                  <div key={material.name} className="materials-report-material-item">
                    <div className="materials-report-material-rank">#{index + 1}</div>
                    <div className="materials-report-material-avatar">
                      <Package size={20} />
                    </div>
                    <div className="materials-report-material-details">
                      <div className="materials-report-material-name">{material.name}</div>
                      <div className="materials-report-material-stats">
                        ₹{material.value.toLocaleString()} • {material.quantity} units • ₹{material.unitPrice}/unit
                      </div>
                    </div>
                    <div className="materials-report-material-progress">
                      <div 
                        className="materials-report-progress-bar"
                        style={{ 
                          width: `${(material.value / Math.max(...topMaterials.map(m => m.value))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="materials-report-critical-stock">
              <h3 className="materials-report-section-title">Critical Stock Alert</h3>
              <div className="materials-report-critical-list">
                {criticalStock.length === 0 ? (
                  <div className="materials-report-no-critical">
                    <div className="materials-report-no-critical-icon">✅</div>
                    <div className="materials-report-no-critical-title">All materials are well-stocked!</div>
                    <div className="materials-report-no-critical-text">No materials require immediate attention.</div>
                  </div>
                ) : (
                  criticalStock.map((material) => (
                    <div key={material.id} className="materials-report-critical-item">
                      <div className="materials-report-critical-info">
                        <div className="materials-report-critical-name">{material.name}</div>
                        <div className="materials-report-critical-remaining">
                          {material.remaining} / {material.quantity} units remaining
                        </div>
                      </div>
                      <div className={`materials-report-critical-status ${material.statusInfo.status}`}>
                        {material.statusInfo.label}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="materials-report-category-analysis">
              <h3 className="materials-report-section-title">Category Analysis</h3>
              <div className="materials-report-category-grid">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="materials-report-category-card">
                    <div className="materials-report-category-header">
                      <div className="materials-report-category-name">{category.name}</div>
                      <div className="materials-report-category-count">{category.count} items</div>
                    </div>
                    <div className="materials-report-category-value">₹{category.value.toLocaleString()}</div>
                    <div className="materials-report-category-progress">
                      <div 
                        className="materials-report-category-progress-bar"
                        style={{ 
                          width: `${(category.value / Math.max(...categoryData.map(c => c.value))) * 100}%`,
                          background: pieColors[index % pieColors.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed View Tab */}
        {activeView === 'detailed' && (
          <div className="materials-report-detailed-content">
            <div className="materials-report-table-header">
              <h3 className="materials-report-table-title">Detailed Materials Inventory</h3>
              <div className="materials-report-table-count">
                {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'}
              </div>
            </div>

            {filteredMaterials.length === 0 ? (
              <div className="materials-report-empty-state">
                <div className="materials-report-empty-icon">📦</div>
                <div className="materials-report-empty-title">No materials found</div>
                <div className="materials-report-empty-text">
                  Try adjusting your filters to see more data.
                </div>
              </div>
            ) : (
              <div className="materials-report-detailed-table">
                <table className="materials-report-table">
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Category</th>
                      <th>Total Qty</th>
                      <th>Remaining</th>
                      <th>Used</th>
                      <th>Status</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => {
                      const statusInfo = getStatusInfo(material)
                      const used = (material.quantity || 0) - (material.remaining || 0)
                      const totalValue = (material.quantity || 0) * (material.unitPrice || 0)
                      
                      return (
                        <tr key={material.id}>
                          <td className="materials-report-table-name">
                            <div className="materials-report-name-cell">
                              <div className="materials-report-name-avatar">
                                <Package size={16} />
                              </div>
                              <span>{material.name || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="materials-report-table-category">
                            <span className="materials-report-category-badge">
                              {material.category || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="materials-report-table-quantity">
                            <span className="materials-report-quantity-badge total">
                              {material.quantity || 0}
                            </span>
                          </td>
                          <td className="materials-report-table-remaining">
                            <span className="materials-report-quantity-badge remaining">
                              {material.remaining || 0}
                            </span>
                          </td>
                          <td className="materials-report-table-used">
                            <span className="materials-report-quantity-badge used">
                              {used}
                            </span>
                          </td>
                          <td className="materials-report-table-status">
                            <span className={`materials-report-status-badge ${statusInfo.status}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="materials-report-table-price">
                            ₹{(material.unitPrice || 0).toLocaleString()}
                          </td>
                          <td className="materials-report-table-value">
                            <strong>₹{totalValue.toLocaleString()}</strong>
                          </td>
                        </tr>
                      )
                    })}
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

export default MaterialsReport