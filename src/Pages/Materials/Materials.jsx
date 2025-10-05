import React, { useState, useEffect } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Search, Edit, Eye, Package, TrendingUp, TrendingDown, AlertTriangle, Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Materials.css";

import { db } from "../../Firebase";
import { collection, getDocs } from "firebase/firestore";

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
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
      }
      setLoading(false);
    };

    fetchMaterials();
  }, []);

  useEffect(() => {
    const filtered = materials.filter(material =>
      material.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMaterials(filtered);
  }, [searchTerm, materials]);

  const getStatusInfo = (material) => {
    const remaining = material.remaining || 0;
    const quantity = material.quantity || 0;
    const bufferStock = material.bufferStock || 0;
    
    if (remaining <= 0) {
      return {
        status: 'out-of-stock',
        label: 'Out of Stock',
        color: '#ef4444',
        percentage: 0,
        level: 'low'
      };
    } else if (remaining <= bufferStock) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        color: '#f59e0b',
        percentage: Math.round((remaining / quantity) * 100),
        level: 'medium'
      };
    } else {
      return {
        status: 'in-stock',
        label: 'In Stock',
        color: '#22c55e',
        percentage: Math.round((remaining / quantity) * 100),
        level: 'high'
      };
    }
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
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
              Materials
            </h1>
          </div>
        </div>
        <div className="materials-main-container">
          <div className="materials-loading">
            <div className="materials-loading-spinner"></div>
            Loading materials...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
            Materials
          </h1>
        </div>
      </div>

      <div className="materials-main-container">
        {/* Enhanced Header */}
        <div className="materials-header">
          <h1 className="materials-title">Materials Inventory</h1>
          <div className="materials-stats">
            <div className="materials-stat-badge">
              <Package size={16} />
              Total: {stats.total}
            </div>
            <div className="materials-stat-badge" style={{ background: '#22c55e' }}>
              <TrendingUp size={16} />
              In Stock: {stats.inStock}
            </div>
            <div className="materials-stat-badge" style={{ background: '#f59e0b' }}>
              <AlertTriangle size={16} />
              Low: {stats.lowStock}
            </div>
            <div className="materials-stat-badge" style={{ background: '#ef4444' }}>
              <TrendingDown size={16} />
              Out: {stats.outOfStock}
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="materials-search-section">
          <div className="materials-search-wrapper">
            <input
              type="text"
              className="materials-search-input"
              placeholder="🔍 Search materials by name or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="materials-search-icon" />
          </div>
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="materials-empty-state">
            <div className="materials-empty-icon">📦</div>
            <div className="materials-empty-title">
              {searchTerm ? "No materials found" : "No materials yet"}
            </div>
            <div className="materials-empty-text">
              {searchTerm 
                ? `No materials match "${searchTerm}". Try a different search term.`
                : "Start by adding your first material to manage inventory."
              }
            </div>
            {!searchTerm && (
              <NavLink to="/addmaterial" className="materials-empty-button">
                <Plus size={18} />
                Add First Material
              </NavLink>
            )}
          </div>
        ) : (
          <div className="materials-grid-container">
            {filteredMaterials.map((material) => {
              const statusInfo = getStatusInfo(material);
              
              return (
                <div key={material.id} className="material-card">
                  <div className={`material-inventory-indicator ${statusInfo.level}`}></div>
                  
                  <div className="material-card-header">
                    <div>
                      <div className="material-name">{material.name || 'Unnamed Material'}</div>
                      <div className="material-id">ID: {material.id}</div>
                    </div>
                    <div className={`material-status-badge ${statusInfo.status}`}>
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="material-stats-grid">
                    <div className="material-stat-item">
                      <div className="material-stat-label">Remaining Stock</div>
                      <div className="material-stat-value" style={{ color: statusInfo.color, fontWeight: 'bold' }}>
                        {material.remaining || 0}
                      </div>
                    </div>
                    <div className="material-stat-item">
                      <div className="material-stat-label">Buffer Stock</div>
                      <div className="material-stat-value" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                        {material.bufferStock || 0}
                      </div>
                    </div>
                  </div>

                  <div className="material-progress-section">
                    <div className="material-progress-label">
                      <span className="material-progress-text">Inventory Level</span>
                      <span className="material-progress-percentage">{statusInfo.percentage}%</span>
                    </div>
                    <div className="material-progress-bar">
                      <div 
                        className={`material-progress-fill ${statusInfo.level}`}
                        style={{ width: `${statusInfo.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Materials;
