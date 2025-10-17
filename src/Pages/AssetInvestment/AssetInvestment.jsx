import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../Firebase'
import { toast } from 'react-toastify'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  X,
  Save,
  Package,
  AlertCircle,
  Edit3,
  Trash2
} from 'lucide-react'
import './AssetInvestment.css'

const AssetInvestment = () => {
  const [assets, setAssets] = useState([])
  const [filteredAssets, setFilteredAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    assetName: '',
    amount: '',
    description: ''
  })
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    assetName: '',
    amount: '',
    description: ''
  })
  
  // Filter state
  const [filterFromDate, setFilterFromDate] = useState('')
  const [filterToDate, setFilterToDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24
  
  useEffect(() => {
    fetchAssets()
  }, [])
  
  useEffect(() => {
    applyFilters()
  }, [assets, filterFromDate, filterToDate, searchTerm])
  
  const fetchAssets = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'AssetInvestment'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const assetsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }))
      
      setAssets(assetsList)
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast.error('Failed to load asset investments')
    } finally {
      setLoading(false)
    }
  }
  
  const applyFilters = () => {
    let filtered = [...assets]
    
    // Date range filter
    if (filterFromDate) {
      const fromDate = new Date(filterFromDate)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(asset => new Date(asset.createdAt) >= fromDate)
    }
    
    if (filterToDate) {
      const toDate = new Date(filterToDate)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(asset => new Date(asset.createdAt) <= toDate)
    }
    
    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.assetName?.toLowerCase().includes(search) ||
        asset.description?.toLowerCase().includes(search)
      )
    }
    
    setFilteredAssets(filtered)
    setCurrentPage(1)
  }
  
  const handleAddAsset = async (e) => {
    e.preventDefault()
    
    if (!formData.assetName.trim() || !formData.amount) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    
    setSaving(true)
    
    try {
      const assetData = {
        assetName: formData.assetName.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        createdAt: new Date(),
        investmentDate: new Date().toISOString().split('T')[0]
      }
      
      await addDoc(collection(db, 'AssetInvestment'), assetData)
      
      toast.success('Asset investment added successfully!')
      setFormData({ assetName: '', amount: '', description: '' })
      setShowAddModal(false)
      fetchAssets()
    } catch (error) {
      console.error('Error adding asset:', error)
      toast.error('Failed to add asset investment')
    } finally {
      setSaving(false)
    }
  }
  
  const handleEditAsset = (asset) => {
    setEditingAsset(asset)
    setEditFormData({
      assetName: asset.assetName || '',
      amount: asset.amount?.toString() || '',
      description: asset.description || ''
    })
    setShowEditModal(true)
  }
  
  const handleUpdateAsset = async (e) => {
    e.preventDefault()
    
    if (!editFormData.assetName.trim() || !editFormData.amount) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (parseFloat(editFormData.amount) <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }
    
    setSaving(true)
    
    try {
      const assetRef = doc(db, 'AssetInvestment', editingAsset.id)
      const updatedData = {
        assetName: editFormData.assetName.trim(),
        amount: parseFloat(editFormData.amount),
        description: editFormData.description.trim(),
        updatedAt: new Date()
      }
      
      await updateDoc(assetRef, updatedData)
      
      toast.success('Asset investment updated successfully!')
      setShowEditModal(false)
      setEditingAsset(null)
      fetchAssets()
    } catch (error) {
      console.error('Error updating asset:', error)
      toast.error('Failed to update asset investment')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteAsset = async (assetId, assetName) => {
    if (window.confirm(`Are you sure you want to delete "${assetName}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'AssetInvestment', assetId))
        toast.success('Asset investment deleted successfully!')
        fetchAssets()
      } catch (error) {
        console.error('Error deleting asset:', error)
        toast.error('Failed to delete asset investment')
      }
    }
  }
  
  const clearFilters = () => {
    setFilterFromDate('')
    setFilterToDate('')
    setSearchTerm('')
  }
  
  const getTotalAmount = () => {
    return filteredAssets.reduce((sum, asset) => sum + (asset.amount || 0), 0)
  }
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
  
  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }
  
  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Asset Investment</h1>
          </div>
        </div>
        <div className="asset-loading">
          <div className="asset-loader"></div>
          <p>Loading asset investments...</p>
        </div>
      </>
    )
  }
  
  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1>Asset Investment</h1>
        </div>
        <div className="asset-header-actions">
          <button 
            className="asset-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Add Investment
          </button>
        </div>
      </div>
      
      <div className="asset-main-container">
        {/* Summary Card */}
        <div className="asset-summary-card">
          <div className="asset-summary-icon">
            <TrendingUp size={32} />
          </div>
          <div className="asset-summary-content">
            <h3>Total Asset Investment</h3>
            <div className="asset-summary-amount">{formatCurrency(getTotalAmount())}</div>
            <div className="asset-summary-count">{filteredAssets.length} assets</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="asset-filters-section">
          <div className="asset-filters-row">
            <div className="asset-filter-group">
              <label>From Date</label>
              <div className="asset-date-input-wrapper">
                <Calendar size={16} />
                <input
                  type="date"
                  value={filterFromDate}
                  onChange={(e) => setFilterFromDate(e.target.value)}
                  className="asset-filter-input"
                />
              </div>
            </div>
            
            <div className="asset-filter-group">
              <label>To Date</label>
              <div className="asset-date-input-wrapper">
                <Calendar size={16} />
                <input
                  type="date"
                  value={filterToDate}
                  onChange={(e) => setFilterToDate(e.target.value)}
                  className="asset-filter-input"
                />
              </div>
            </div>
            
            <div className="asset-filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="asset-filter-input"
              />
            </div>
            
            <button 
              className="asset-clear-btn"
              onClick={clearFilters}
            >
              <Filter size={16} />
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Assets Grid */}
        {currentItems.length === 0 ? (
          <div className="asset-empty-state">
            <Package size={64} />
            <h3>No Asset Investments Found</h3>
            <p>
              {searchTerm || filterFromDate || filterToDate 
                ? 'No assets match your current filters' 
                : 'Start by adding your first asset investment'
              }
            </p>
          </div>
        ) : (
          <>
            <div className="asset-grid">
              {currentItems.map((asset) => (
                <div key={asset.id} className="asset-card">
                  <div className="asset-card-header">
                    <div className="asset-card-icon">
                      <Package size={24} />
                    </div>
                    <div className="asset-card-amount">
                      {formatCurrency(asset.amount)}
                    </div>
                  </div>
                  <div className="asset-card-body">
                    <h3 className="asset-card-name">{asset.assetName}</h3>
                    {asset.description && (
                      <p className="asset-card-description">{asset.description}</p>
                    )}
                    <div className="asset-card-footer">
                      <div className="asset-card-date">
                        <Calendar size={14} />
                        {formatDate(asset.createdAt)}
                      </div>
                    </div>
                    <div className="asset-card-actions">
                      <button 
                        className="asset-edit-btn"
                        onClick={() => handleEditAsset(asset)}
                        title="Edit asset"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>
                      <button 
                        className="asset-delete-btn"
                        onClick={() => handleDeleteAsset(asset.id, asset.assetName)}
                        title="Delete asset"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="asset-pagination">
                <button
                  className="asset-page-btn"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>
                
                <div className="asset-page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`asset-page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => paginate(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  className="asset-page-btn"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="asset-modal-overlay" onClick={() => !saving && setShowAddModal(false)}>
          <div className="asset-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="asset-modal-header">
              <h2>Add Asset Investment</h2>
              <button 
                className="asset-modal-close"
                onClick={() => !saving && setShowAddModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddAsset} className="asset-form">
              <div className="asset-form-group">
                <label>Asset Name *</label>
                <input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  placeholder="Enter asset name (e.g., Office Equipment)"
                  required
                  disabled={saving}
                />
              </div>
              
              <div className="asset-form-group">
                <label>Amount *</label>
                <div className="asset-amount-input">
                  <DollarSign size={18} />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div className="asset-form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows="3"
                  disabled={saving}
                />
              </div>
              
              <div className="asset-form-actions">
                <button 
                  type="button"
                  className="asset-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="asset-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="asset-btn-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Add Investment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Asset Modal */}
      {showEditModal && editingAsset && (
        <div className="asset-modal-overlay" onClick={() => !saving && setShowEditModal(false)}>
          <div className="asset-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="asset-modal-header">
              <h2>Edit Asset Investment</h2>
              <button 
                className="asset-modal-close"
                onClick={() => !saving && setShowEditModal(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateAsset} className="asset-form">
              <div className="asset-form-group">
                <label>Asset Name *</label>
                <input
                  type="text"
                  value={editFormData.assetName}
                  onChange={(e) => setEditFormData({ ...editFormData, assetName: e.target.value })}
                  placeholder="Enter asset name"
                  required
                  disabled={saving}
                />
              </div>
              
              <div className="asset-form-group">
                <label>Amount *</label>
                <div className="asset-amount-input">
                  <DollarSign size={18} />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div className="asset-form-group">
                <label>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows="3"
                  disabled={saving}
                />
              </div>
              
              <div className="asset-form-actions">
                <button 
                  type="button"
                  className="asset-cancel-btn"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="asset-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="asset-btn-spinner"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Update Investment
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

export default AssetInvestment
