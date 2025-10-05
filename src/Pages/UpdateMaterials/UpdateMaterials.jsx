import React, { useEffect, useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { ChevronDown, Package, Plus } from "lucide-react";
import { db } from "../../Firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./UpdateMaterials.css";

const UpdateMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [materialsLoading, SetMaterialsLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      SetMaterialsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "Materials"));
        const list = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort materials alphabetically
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setMaterials(list);
      } catch (error) {
        console.error("Error fetching materials:", error);
        toast.error("Failed to load materials!");
      }
      SetMaterialsLoading(false);
    };
    fetchMaterials();
  }, []);

  const filteredMaterials = materials.filter((mat) =>
    mat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (mat) => {
    setSelectedMaterial(mat);
    setDropdownOpen(false);
    setSearch(""); // Clear search after selection
  };

  const handleSave = async () => {
    if (!selectedMaterial) {
      toast.error("Please select a material first!");
      return;
    }

    if (!quantity || isNaN(quantity) || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity greater than 0!");
      return;
    }

    setLoading(true);
    try {
      const newQuantity = Number(selectedMaterial.quantity) + Number(quantity);
      const newRemaining =
        Number(selectedMaterial.remaining || 0) + Number(quantity);

      await updateDoc(doc(db, "Materials", selectedMaterial.id), {
        quantity: newQuantity,
        remaining: newRemaining,
      });

      // Update local state
      setMaterials((prev) =>
        prev.map((mat) =>
          mat.id === selectedMaterial.id
            ? {
                ...mat,
                quantity: newQuantity,
                remaining: newRemaining,
              }
            : mat
        )
      );

      // Update selected material
      setSelectedMaterial((prev) => ({
        ...prev,
        quantity: newQuantity,
        remaining: newRemaining,
      }));

      setQuantity("");
      toast.success(
        `✅ Added ${quantity} units to ${selectedMaterial.name}! 🎉`
      );
    } catch (err) {
      console.error("Error updating material:", err);
      toast.error("❌ Failed to update material quantity!");
    }
    setLoading(false);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Only allow positive numbers
    if (value === "" || (Number(value) >= 0 && !isNaN(value))) {
      setQuantity(value);
    }
  };

  const getStatusColor = (material) => {
    const remaining = material.remaining || 0;
    const bufferStock = material.bufferStock || 0;

    if (remaining <= 0) return "#ef4444";
    if (remaining <= bufferStock) return "#f59e0b";
    return "#22c55e";
  };

  const getStatusLabel = (material) => {
    const remaining = material.remaining || 0;
    const bufferStock = material.bufferStock || 0;

    if (remaining <= 0) return "Out of Stock";
    if (remaining <= bufferStock) return "Low Stock";
    return "In Stock";
  };

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--txt-dark)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Package
              style={{
                width: "24px",
                height: "24px",
                color: "var(--blue)",
              }}
            />
            Update Materials
          </h1>
        </div>
      </div>

      <div className="routes-main-container">
        <div className="update-materials-main-container">
          {/* Header */}
          <div className="update-materials-header">
            <h2 className="update-materials-title">Update Material Stock</h2>
            <p className="update-materials-subtitle">
              Add new stock quantities to existing materials
            </p>
          </div>

          <div className="update-materials-form">
            {/* Material Selection */}
            <div className="update-dropdown-section">
              <label className="update-dropdown-label">Select Material</label>
              <div className="update-dropdown-wrapper">
                <button
                  type="button"
                  className={`update-dropdown-header ${
                    dropdownOpen ? "open" : ""
                  } ${selectedMaterial ? "selected" : ""}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={materialsLoading}
                >
                  <span>
                    {materialsLoading
                      ? "Loading materials..."
                      : selectedMaterial
                      ? selectedMaterial.name
                      : "Choose a material to update"}
                  </span>
                  <ChevronDown className="icon" />
                </button>

                <div
                  className={`update-dropdown-list ${
                    dropdownOpen ? "show" : ""
                  }`}
                >
                  <input
                    type="text"
                    className="update-dropdown-search"
                    placeholder="🔍 Search materials..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="update-dropdown-scroll">
                    {filteredMaterials.length === 0 ? (
                      <div className="update-dropdown-item no-results">
                        {search
                          ? `No materials found for "${search}"`
                          : "No materials available"}
                      </div>
                    ) : (
                      filteredMaterials.map((mat) => (
                        <div
                          key={mat.id}
                          className="update-dropdown-item"
                          onClick={() => handleSelect(mat)}
                        >
                          <span>{mat.name}</span>
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: "12px",
                              color: getStatusColor(mat),
                              fontWeight: 600,
                            }}
                          >
                            {mat.remaining || 0} units
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="update-quantity-section">
              <label className="update-quantity-label">Quantity to Add</label>
              <input
                type="number"
                className="update-quantity-input"
                value={quantity}
                onChange={handleQuantityChange}
                min="1"
                placeholder={
                  selectedMaterial
                    ? "Enter quantity to add"
                    : "Select a material first"
                }
                disabled={!selectedMaterial}
              />
            </div>

            {/* Save Button */}
            <div className="update-save-section">
              <button
                className={`update-save-btn ${loading ? "loading" : ""}`}
                onClick={handleSave}
                disabled={!selectedMaterial || !quantity || loading}
              >
                {loading && <span className="update-loading-spinner"></span>}
                {loading ? "Updating Stock..." : "Update Stock"}
              </button>
            </div>
          </div>

          {/* Material Information */}
          {selectedMaterial && (
            <div className="update-material-info">
              <div className="update-material-info-header">
                Current Stock Information
              </div>
              <div className="update-material-info-grid">
                <div className="update-info-item current">
                  <div className="update-info-label">Current Stock</div>
                  <div className="update-info-value">
                    {selectedMaterial.quantity || 0}
                  </div>
                </div>
                <div className="update-info-item remaining">
                  <div className="update-info-label">Available</div>
                  <div className="update-info-value">
                    {selectedMaterial.remaining || 0}
                  </div>
                </div>
                <div className="update-info-item buffer">
                  <div className="update-info-label">Buffer Stock</div>
                  <div className="update-info-value">
                    {selectedMaterial.bufferStock || 0}
                  </div>
                </div>
                <div className="update-info-item status">
                  <div className="update-info-label">Status</div>
                  <div
                    className="update-info-value"
                    style={{ color: getStatusColor(selectedMaterial) }}
                  >
                    {getStatusLabel(selectedMaterial)}
                  </div>
                </div>
              </div>

              {quantity && !isNaN(quantity) && Number(quantity) > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "#e0e7ff",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "var(--blue)",
                  }}
                >
                  📈 New Total:{" "}
                  {Number(selectedMaterial.quantity || 0) + Number(quantity)}{" "}
                  units
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdateMaterials;