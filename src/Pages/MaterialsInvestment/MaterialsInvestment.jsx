import React, { useState, useEffect } from 'react'
import './MaterialsInvestment.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Package, 
  IndianRupee,
  Calendar,
  ChevronDown,
  X,
  Eye,
  BarChart3,
  Wallet
} from 'lucide-react'
import { collection, getDocs, addDoc, query, orderBy, where, Timestamp, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'
import { useAppContext } from '../../Context'

const MaterialsInvestment = () => {
  const { userDetails } = useAppContext()
  
  // States for form
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false)
  const [materialSearchTerm, setMaterialSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  
  // States for data
  const [materials, setMaterials] = useState([])
  const [investments, setInvestments] = useState([])
  const [filteredInvestments, setFilteredInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [materialsLoading, setMaterialsLoading] = useState(true)
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter options
  const filterOptions = [
    { label: 'All Records', value: 'all', icon: '📊' },
    { label: 'Today', value: 'today', icon: '📅' },
    { label: 'This Week', value: 'thisWeek', icon: '📆' },
    { label: 'Last Week', value: 'lastWeek', icon: '📝' },
    { label: 'This Month', value: 'thisMonth', icon: '🗓️' },
    { label: 'Last Month', value: 'lastMonth', icon: '📋' },
    { label: 'This Year', value: 'thisYear', icon: '📚' },
    { label: 'Last Year', value: 'lastYear', icon: '📖' }
  ]

  // Fetch materials on component mount
  useEffect(() => {
    fetchMaterials()
    fetchInvestments()
  }, [])

  // Apply filters when investments or active filter changes
  useEffect(() => {
    applyFilters()
  }, [investments, activeFilter, searchTerm])

  const fetchMaterials = async () => {
    setMaterialsLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, "Materials"))
      const materialsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Sort materials by name
      materialsList.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      setMaterials(materialsList)
    } catch (error) {
      console.error("Error fetching materials:", error)
      toast.error("Failed to fetch materials")
    }
    setMaterialsLoading(false)
  }

  const fetchInvestments = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "MaterialsInvestment"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const investmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setInvestments(investmentsList)
    } catch (error) {
      console.error("Error fetching investments:", error)
      toast.error("Failed to fetch investment data")
    }
    setLoading(false)
  }

  const handleMaterialSelect = (material) => {
    setSelectedMaterial(material)
    setShowMaterialDropdown(false)
    setMaterialSearchTerm('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedMaterial) {
      toast.error("Please select a material")
      return
    }
    
    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity")
      return
    }
    
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setSaving(true)
    
    try {
      // Record the investment
      const investmentData = {
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        materialCategory: selectedMaterial.category || 'Uncategorized',
        quantity: Number(quantity),
        amount: Number(amount),
        unitCost: Number(amount) / Number(quantity),
        investedBy: userDetails?.name || 'Admin',
        createdAt: Timestamp.now(),
        createdDate: new Date().toISOString().split('T')[0],
        notes: `Investment in ${selectedMaterial.name} - ${quantity} units`
      }

      await addDoc(collection(db, "MaterialsInvestment"), investmentData)
      
      // Update the material quantity in Materials collection
      const materialDocRef = doc(db, "Materials", selectedMaterial.id)
      const currentQuantity = selectedMaterial.quantity || selectedMaterial.remaining || 0
      const newQuantity = Number(currentQuantity) + Number(quantity)
      
      await updateDoc(materialDocRef, { 
        quantity: newQuantity,
        remaining: newQuantity // Update both quantity and remaining fields
      })
      
      toast.success("Investment recorded and material quantity updated successfully!")
      
      // Reset form
      setSelectedMaterial(null)
      setQuantity('')
      setAmount('')
      
      // Refresh both investments list and materials list
      fetchInvestments()
      fetchMaterials() // Refresh materials to show updated quantities
      
    } catch (error) {
      console.error("Error saving investment:", error)
      toast.error("Failed to save investment")
    }
    
    setSaving(false)
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
    let filtered = [...investments]

    // Date filter
    if (activeFilter !== 'all') {
      const dateRange = getDateRange(activeFilter)
      if (dateRange) {
        filtered = filtered.filter(investment => {
          const investmentDate = investment.createdAt?.toDate ? investment.createdAt.toDate() : new Date(investment.createdDate)
          return investmentDate >= dateRange.start && investmentDate <= dateRange.end
        })
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(investment =>
        investment.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investment.materialCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investment.investedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredInvestments(filtered)
  }

  const getFilteredMaterials = () => {
    if (!materialSearchTerm) return materials
    return materials.filter(material =>
      material.name?.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
      material.category?.toLowerCase().includes(materialSearchTerm.toLowerCase())
    )
  }

  const getStatistics = () => {
    const totalInvestments = filteredInvestments.length
    const totalAmount = filteredInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalQuantity = filteredInvestments.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
    const averageUnitCost = totalQuantity > 0 ? totalAmount / totalQuantity : 0
    
    // Get unique materials
    const uniqueMaterials = new Set(filteredInvestments.map(inv => inv.materialId)).size
    
    // Get this month's data
    const thisMonthData = investments.filter(inv => {
      const investmentDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdDate)
      const now = new Date()
      return investmentDate.getMonth() === now.getMonth() && investmentDate.getFullYear() === now.getFullYear()
    })
    const thisMonthAmount = thisMonthData.reduce((sum, inv) => sum + (inv.amount || 0), 0)

    return {
      totalInvestments,
      totalAmount,
      totalQuantity,
      averageUnitCost,
      uniqueMaterials,
      thisMonthAmount
    }
  }

  const exportData = () => {
    try {
      const csvContent = [
        ['Date', 'Material Name', 'Category', 'Quantity', 'Amount (₹)', 'Unit Cost (₹)', 'Invested By'],
        ...filteredInvestments.map(investment => {
          const date = investment.createdAt?.toDate ? investment.createdAt.toDate() : new Date(investment.createdDate)
          return [
            date.toLocaleDateString(),
            investment.materialName || 'Unknown',
            investment.materialCategory || 'Uncategorized',
            investment.quantity || 0,
            investment.amount || 0,
            investment.unitCost?.toFixed(2) || '0.00',
            investment.investedBy || 'Unknown'
          ]
        })
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `materials_investment_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Investment data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    }
  }

  const statistics = getStatistics()

  if (materialsLoading || loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Materials Investment</h1>
          </div>
        </div>
        <div className="materials-investment-loading">
          <div className="materials-investment-loading-spinner"></div>
          Loading materials investment data...
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
            <Wallet style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Materials Investment
          </h1>
        </div>
        <div className="materials-investment-header-actions d-none d-lg-flex">
          <button 
            className="materials-investment-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
          <button 
            className="materials-investment-export-btn"
            onClick={exportData}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="materials-investment-header-actions justify-content-center my-3 d-lg-none">
        <button 
          className="materials-investment-filter-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
          Filters
        </button>
        <button 
          className="materials-investment-export-btn"
          onClick={exportData}
        >
          <Download size={18} />
          Export
        </button>
      </div>

      <div className="materials-investment-container">
        {/* Filters */}
        {showFilters && (
          <div className="materials-investment-filters-section">
            <div className="materials-investment-filters-header">
              <h3>Filter Investments</h3>
              <button 
                className="materials-investment-filters-close"
                onClick={() => setShowFilters(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="materials-investment-filters-grid">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  className={`materials-investment-filter-option ${activeFilter === option.value ? 'active' : ''}`}
                  onClick={() => setActiveFilter(option.value)}
                >
                  <span className="materials-investment-filter-icon">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            <div className="materials-investment-search-section">
              <div className="materials-investment-search-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by material name, category, or investor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="materials-investment-search-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="materials-investment-stats-grid">
          <div className="materials-investment-stat-card">
            <div className="materials-investment-stat-icon total-investments">
              <BarChart3 size={24} />
            </div>
            <div className="materials-investment-stat-content">
              <div className="materials-investment-stat-value">{statistics.totalInvestments}</div>
              <div className="materials-investment-stat-label">Total Investments</div>
            </div>
          </div>

          <div className="materials-investment-stat-card">
            <div className="materials-investment-stat-icon total-amount">
              <IndianRupee size={24} />
            </div>
            <div className="materials-investment-stat-content">
              <div className="materials-investment-stat-value">₹{statistics.totalAmount.toLocaleString()}</div>
              <div className="materials-investment-stat-label">Total Amount</div>
            </div>
          </div>

          <div className="materials-investment-stat-card">
            <div className="materials-investment-stat-icon unique-materials">
              <Package size={24} />
            </div>
            <div className="materials-investment-stat-content">
              <div className="materials-investment-stat-value">{statistics.uniqueMaterials}</div>
              <div className="materials-investment-stat-label">Materials Invested</div>
            </div>
          </div>

          <div className="materials-investment-stat-card">
            <div className="materials-investment-stat-icon monthly-amount">
              <TrendingUp size={24} />
            </div>
            <div className="materials-investment-stat-content">
              <div className="materials-investment-stat-value">₹{statistics.thisMonthAmount.toLocaleString()}</div>
              <div className="materials-investment-stat-label">This Month</div>
            </div>
          </div>
        </div>

        {/* Investments List */}
        <div className="materials-investment-list-section">
          <div className="materials-investment-list-header">
            <div className="materials-investment-list-header-left">
              <h3 className="materials-investment-list-title">
                <Eye size={20} />
                Investment Records ({filteredInvestments.length})
              </h3>
              <div className="materials-investment-list-info">
                Showing {filteredInvestments.length} of {investments.length} investments
              </div>
            </div>
            <div className="materials-investment-list-header-right">
              <button 
                className="materials-investment-list-filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {filteredInvestments.length === 0 ? (
            <div className="materials-investment-empty-state">
              <div className="materials-investment-empty-icon">💰</div>
              <div className="materials-investment-empty-title">No investments found</div>
              <div className="materials-investment-empty-text">
                {investments.length === 0 
                  ? "Start by recording your first material investment above."
                  : "Try adjusting your filters to see more data."}
              </div>
            </div>
          ) : (
            <div className="materials-investment-table-container">
              <table className="materials-investment-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Unit Cost</th>
                    <th>Invested By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestments.map((investment) => {
                    const date = investment.createdAt?.toDate ? investment.createdAt.toDate() : new Date(investment.createdDate)
                    
                    return (
                      <tr key={investment.id}>
                        <td className="materials-investment-table-date">
                          <div className="materials-investment-date-info">
                            <Calendar size={14} />
                            <span>{date.toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="materials-investment-table-material">
                          <div className="materials-investment-material-info">
                            <Package size={14} />
                            <span>{investment.materialName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="materials-investment-table-category">
                          <span className="materials-investment-category-badge">
                            {investment.materialCategory || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="materials-investment-table-quantity">
                          <span className="materials-investment-quantity-badge">
                            {investment.quantity || 0} units
                          </span>
                        </td>
                        <td className="materials-investment-table-amount">
                          <span className="materials-investment-amount-value">
                            ₹{(investment.amount || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="materials-investment-table-unit-cost">
                          <span className="materials-investment-unit-cost-value">
                            ₹{(investment.unitCost || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="materials-investment-table-investor">
                          <span className="materials-investment-investor-name">
                            {investment.investedBy || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Investment Form */}
        <div className="materials-investment-form-section">
          <div className="materials-investment-form-header">
            <h2 className="materials-investment-form-title">
              <Plus size={20} />
              Add New Investment
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="materials-investment-form">
            {/* Material Dropdown */}
            <div className="materials-investment-form-group">
              <label className="materials-investment-form-label">Select Material *</label>
              <div className="materials-investment-dropdown-container">
                <div 
                  className={`materials-investment-dropdown-header ${showMaterialDropdown ? 'active' : ''}`}
                  onClick={() => setShowMaterialDropdown(!showMaterialDropdown)}
                >
                  <div className="materials-investment-dropdown-selected">
                    {selectedMaterial ? (
                      <div className="materials-investment-selected-material">
                        <Package size={16} />
                        <span>{selectedMaterial.name}</span>
                        <span className="materials-investment-material-category">
                          {selectedMaterial.category || 'Uncategorized'}
                        </span>
                      </div>
                    ) : (
                      <span className="materials-investment-dropdown-placeholder">
                        <Package size={16} />
                        Choose a material...
                      </span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`materials-investment-dropdown-icon ${showMaterialDropdown ? 'rotated' : ''}`} />
                </div>

                {showMaterialDropdown && (
                  <div className="materials-investment-dropdown-menu">
                    <div className="materials-investment-dropdown-search">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Search materials..."
                        value={materialSearchTerm}
                        onChange={(e) => setMaterialSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="materials-investment-dropdown-options">
                      {getFilteredMaterials().length === 0 ? (
                        <div className="materials-investment-dropdown-no-results">
                          No materials found
                        </div>
                      ) : (
                        getFilteredMaterials().map(material => (
                          <div
                            key={material.id}
                            className="materials-investment-dropdown-option"
                            onClick={() => handleMaterialSelect(material)}
                          >
                            <Package size={14} />
                            <div className="materials-investment-option-details">
                              <span className="materials-investment-option-name">{material.name}</span>
                              <span className="materials-investment-option-category">
                                {material.category || 'Uncategorized'} • Stock: {material.remaining || 0}
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

            <div className="materials-investment-form-row">
              {/* Quantity Input */}
              <div className="materials-investment-form-group">
                <label className="materials-investment-form-label">Quantity *</label>
                <input
                  type="number"
                  className="materials-investment-form-input"
                  placeholder="Enter quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  step="1"
                />
              </div>

              {/* Amount Input */}
              <div className="materials-investment-form-group">
                <label className="materials-investment-form-label">Total Amount (₹) *</label>
                <input
                  type="number"
                  className="materials-investment-form-input"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>

            {/* Unit Cost Display */}
            {quantity && amount && (
              <div className="materials-investment-unit-cost">
                <IndianRupee size={16} />
                Unit Cost: ₹{(Number(amount) / Number(quantity)).toFixed(2)} per unit
              </div>
            )}

            <button 
              type="submit" 
              className="materials-investment-submit-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="materials-investment-btn-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Record Investment
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default MaterialsInvestment