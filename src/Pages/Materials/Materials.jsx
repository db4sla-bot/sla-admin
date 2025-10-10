/* filepath: c:\Users\Arumulla SivaKrishna\Documents\sla-admin\src\Pages\Materials\Materials.jsx */
import React, { useState, useEffect } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Search, Filter, Edit, Plus, X, Save, Package, DollarSign, Hash, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Materials.css";
import { toast } from 'react-toastify';

import { db } from "../../Firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    remaining: '',
    bufferStock: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, materials]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Materials"));
      const materialsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort materials by name
      materialsList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      
      setMaterials(materialsList);
      setFilteredMaterials(materialsList);
    } catch (error) {
      console.error("Error fetching materials: ", error);
      toast.error("Failed to load materials");
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...materials];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(material => {
        const status = getStatusInfo(material).status;
        return status === statusFilter;
      });
    }

    setFilteredMaterials(filtered);
  };

  const getStatusInfo = (material) => {
    const remaining = material.remaining || 0;
    const quantity = material.quantity || 0;
    const bufferStock = material.bufferStock || 0;
    
    if (remaining <= 0) {
      return {
        status: 'out-of-stock',
        label: 'Out of Stock',
        percentage: 0,
        level: 'low'
      };
    } else if (remaining <= bufferStock) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        percentage: Math.round((remaining / quantity) * 100),
        level: 'medium'
      };
    } else {
      return {
        status: 'in-stock',
        label: 'In Stock',
        percentage: Math.round((remaining / quantity) * 100),
        level: 'high'
      };
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setEditFormData({
      name: material.name || '',
      price: material.price || '',
      quantity: material.quantity || '',
      remaining: material.remaining || '',
      bufferStock: material.bufferStock || ''
    });
    setShowEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editFormData.name.trim()) {
      toast.error('Material name is required!');
      return;
    }
    if (!editFormData.price || editFormData.price <= 0) {
      toast.error('Valid price is required!');
      return;
    }
    if (!editFormData.quantity || editFormData.quantity <= 0) {
      toast.error('Valid quantity is required!');
      return;
    }
    if (!editFormData.remaining || editFormData.remaining < 0) {
      toast.error('Valid remaining stock is required!');
      return;
    }
    if (!editFormData.bufferStock || editFormData.bufferStock < 0) {
      toast.error('Valid buffer stock is required!');
      return;
    }
    if (parseInt(editFormData.remaining) > parseInt(editFormData.quantity)) {
      toast.error('Remaining stock cannot exceed total quantity!');
      return;
    }

    setSaving(true);
    toast.info('Updating material...', { autoClose: 1000 });

    try {
      const materialRef = doc(db, 'Materials', selectedMaterial.id);
      const updatedData = {
        name: editFormData.name.trim(),
        price: parseFloat(editFormData.price),
        quantity: parseInt(editFormData.quantity),
        remaining: parseInt(editFormData.remaining),
        bufferStock: parseInt(editFormData.bufferStock),
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(materialRef, updatedData);
      
      // Update local state
      setMaterials(prev => 
        prev.map(mat => 
          mat.id === selectedMaterial.id 
            ? { ...mat, ...updatedData }
            : mat
        )
      );
      
      toast.success('Material updated successfully!');
      setShowEditModal(false);
      setSelectedMaterial(null);
      
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedMaterial(null);
    setSaving(false);
  };

  const getTotalStats = () => {
    const inStock = materials.filter(m => getStatusInfo(m).status === 'in-stock').length;
    const lowStock = materials.filter(m => getStatusInfo(m).status === 'low-stock').length;
    const outOfStock = materials.filter(m => getStatusInfo(m).status === 'out-of-stock').length;
    
    return { inStock, lowStock, outOfStock, total: materials.length };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <>
        <div className="materials-top-bar-container">
          <Hamburger />
          <div className="materials-breadcrumps-container">
            <h1>Materials</h1>
          </div>
        </div>
        <div className="materials-loading">
          <div className="materials-loader"></div>
          <p>Loading materials...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <div className="materials-top-bar-container">
        <Hamburger />
        <div className="materials-breadcrumps-container">
          <h1>Materials</h1>
        </div>
        <div className="materials-actions-container">
          <NavLink to="/addmaterial" className="materials-add-btn">
            <Plus /> Add Material
          </NavLink>
        </div>
      </div>

      <div className="materials-main-container">
        {/* Header */}
        <div className="materials-header">
          <h1>Materials Inventory</h1>
          <p>Manage and track your materials inventory</p>
        </div>

        {/* Filters */}
        <div className="materials-filters">
          <div className="materials-search-container">
            <Search className="materials-search-icon" />
            <input
              type="text"
              placeholder="Search by material name or ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="materials-search-input"
            />
          </div>

          <div className="materials-filter-row">
            <div className="materials-status-filter">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="materials-status-select"
              >
                <option value="">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <button className="materials-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="materials-summary">
          <p>
            Showing {filteredMaterials.length} of {materials.length} materials 
            • In Stock: {stats.inStock} • Low Stock: {stats.lowStock} • Out of Stock: {stats.outOfStock}
          </p>
          {(searchTerm || statusFilter) && (
            <p className="materials-filter-info">Filters applied</p>
          )}
        </div>

        {/* Materials Table */}
        <div className="materials-table-container">
          {filteredMaterials.length > 0 ? (
            <table className="materials-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Price (₹)</th>
                  <th>Stock Status</th>
                  <th>Buffer Stock</th>
                  <th>Inventory Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => {
                  const statusInfo = getStatusInfo(material);
                  
                  return (
                    <tr key={material.id} className="materials-table-row">
                      <td className="materials-name">
                        <div className="materials-name-info">
                          <span className="materials-name">
                            {material.name || 'Unnamed Material'}
                          </span>
                          <span className="materials-id">
                            ID: {material.id}
                          </span>
                        </div>
                      </td>
                      <td className="materials-price">
                        ₹{(material.price || 0).toLocaleString()}
                      </td>
                      <td className="materials-stock">
                        <div className="materials-stock-info">
                          <span className="materials-remaining">
                            {material.remaining || 0}
                          </span>
                          <span className="materials-total">
                            of {material.quantity || 0}
                          </span>
                        </div>
                      </td>
                      <td className="materials-buffer">
                        {material.bufferStock || 0}
                      </td>
                      <td className="materials-progress">
                        <div className="materials-progress-container">
                          <span className="materials-progress-text">
                            {statusInfo.percentage}%
                          </span>
                          <div className="materials-progress-bar">
                            <div 
                              className={`materials-progress-fill ${statusInfo.level}`}
                              style={{ width: `${statusInfo.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="materials-status">
                        <span className={`materials-status-badge ${statusInfo.status}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="materials-actions">
                        <div className="materials-action-buttons">
                          <button
                            className="materials-edit-btn"
                            onClick={() => handleEditMaterial(material)}
                            title="Edit Material"
                          >
                            <Edit />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="materials-empty">
              <div className="materials-empty-icon">📦</div>
              <h3>No materials found</h3>
              <p>
                {searchTerm || statusFilter
                  ? "Try adjusting your search criteria or filters"
                  : "Start by adding your first material to manage inventory"}
              </p>
              {!searchTerm && !statusFilter && (
                <NavLink to="/addmaterial" className="materials-empty-add-btn">
                  <Plus /> Add New Material
                </NavLink>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Material Modal */}
      {showEditModal && selectedMaterial && (
        <div className="materials-edit-modal">
          <div className="materials-edit-overlay" onClick={closeEditModal}></div>
          <div className="materials-edit-content">
            <div className="materials-edit-header">
              <h2>Edit Material</h2>
              <button 
                className="materials-edit-close-btn" 
                onClick={closeEditModal}
              >
                <X />
              </button>
            </div>

            <div className="materials-edit-form">
              <div className="materials-edit-form-row">
                <div className="materials-edit-form-group">
                  <label htmlFor="edit-name">
                    <Package className="materials-form-icon" />
                    Material Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    placeholder="Enter material name"
                    required
                  />
                </div>

                <div className="materials-edit-form-group">
                  <label htmlFor="edit-price">
                    <DollarSign className="materials-form-icon" />
                    Price (Per Unit) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="edit-price"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditFormChange}
                    placeholder="Enter price per unit"
                    min="0.01"
                    required
                  />
                </div>
              </div>

              <div className="materials-edit-form-row">
                <div className="materials-edit-form-group">
                  <label htmlFor="edit-quantity">
                    <Hash className="materials-form-icon" />
                    Total Quantity *
                  </label>
                  <input
                    type="number"
                    id="edit-quantity"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditFormChange}
                    placeholder="Enter total quantity"
                    min="1"
                    required
                  />
                </div>

                <div className="materials-edit-form-group">
                  <label htmlFor="edit-remaining">
                    <TrendingUp className="materials-form-icon" />
                    Remaining Stock *
                  </label>
                  <input
                    type="number"
                    id="edit-remaining"
                    name="remaining"
                    value={editFormData.remaining}
                    onChange={handleEditFormChange}
                    placeholder="Enter remaining stock"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="materials-edit-form-row">
                <div className="materials-edit-form-group">
                  <label htmlFor="edit-bufferStock">
                    <Shield className="materials-form-icon" />
                    Buffer Stock *
                  </label>
                  <input
                    type="number"
                    id="edit-bufferStock"
                    name="bufferStock"
                    value={editFormData.bufferStock}
                    onChange={handleEditFormChange}
                    placeholder="Enter buffer stock"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="materials-edit-actions">
                <button
                  className="materials-save-btn"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="materials-btn-loader"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="materials-btn-icon" />
                      Update Material
                    </>
                  )}
                </button>
                <button
                  className="materials-cancel-btn"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Materials;