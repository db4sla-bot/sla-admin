import React, { useState } from 'react'
import './AddMaterial.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Boxes, Funnel, Package, Warehouse } from 'lucide-react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { db } from '../../Firebase'
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

const AddMaterial = () => {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        bufferStock: ''
    })
    const [validation, setValidation] = useState({
        name: { isValid: null, message: '' },
        quantity: { isValid: null, message: '' },
        bufferStock: { isValid: null, message: '' }
    })

    const validateField = (name, value) => {
        let isValid = false
        let message = ''

        switch (name) {
            case 'name':
                if (!value.trim()) {
                    message = 'Material name is required'
                } else if (value.trim().length < 2) {
                    message = 'Material name must be at least 2 characters'
                } else {
                    isValid = true
                    message = 'Material name looks good'
                }
                break

            case 'quantity':
                const qty = Number(value)
                if (!value) {
                    message = 'Quantity is required'
                } else if (isNaN(qty) || qty <= 0) {
                    message = 'Quantity must be a positive number'
                } else if (qty > 999999) {
                    message = 'Quantity seems too high'
                } else {
                    isValid = true
                    message = 'Quantity is valid'
                }
                break

            case 'bufferStock':
                const buffer = Number(value)
                const quantity = Number(formData.quantity)
                if (!value) {
                    message = 'Buffer stock is required'
                } else if (isNaN(buffer) || buffer < 0) {
                    message = 'Buffer stock must be a positive number'
                } else if (quantity && buffer >= quantity) {
                    message = 'Buffer stock should be less than total quantity'
                } else {
                    isValid = true
                    message = 'Buffer stock is valid'
                }
                break

            default:
                break
        }

        setValidation(prev => ({
            ...prev,
            [name]: { isValid, message }
        }))

        return isValid
    }

    const handleChange = (e) => {
        const { name, value } = e.target

        // Only allow numbers for quantity and bufferStock
        if ((name === 'quantity' || name === 'bufferStock') && value && isNaN(value)) {
            return
        }

        setFormData((prev) => ({ ...prev, [name]: value }))
        
        // Validate field on change
        setTimeout(() => validateField(name, value), 100)
    }

    const checkMaterialExists = async (materialName) => {
        try {
            const q = query(
                collection(db, 'Materials'), 
                where('name', '==', materialName.trim())
            )
            const querySnapshot = await getDocs(q)
            return !querySnapshot.empty
        } catch (error) {
            console.error('Error checking material existence:', error)
            return false
        }
    }

    const handleSave = async () => {
        // Validate all fields
        const nameValid = validateField('name', formData.name)
        const quantityValid = validateField('quantity', formData.quantity)
        const bufferValid = validateField('bufferStock', formData.bufferStock)

        if (!nameValid || !quantityValid || !bufferValid) {
            toast.error('Please fix all validation errors before saving!')
            return
        }

        setLoading(true)

        try {
            // Check if material already exists
            const materialExists = await checkMaterialExists(formData.name)
            if (materialExists) {
                toast.error(`Material "${formData.name}" already exists!`)
                setLoading(false)
                return
            }

            // Use Material Name as document ID (cleaned)
            const materialId = formData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')
            
            await setDoc(doc(db, 'Materials', materialId), {
                name: formData.name.trim(),
                quantity: Number(formData.quantity),
                bufferStock: Number(formData.bufferStock),
                remaining: Number(formData.quantity), // Initially, remaining = quantity
                status: 'Available',
                statusColor: '#17c666',
                createdAt: serverTimestamp(),
                createdBy: 'Admin', // You can get this from user context
                lastUpdated: serverTimestamp()
            })

            toast.success(`✅ Material "${formData.name}" added successfully! 🎉`)
            
            // Reset form and validation
            setFormData({ name: '', quantity: '', bufferStock: '' })
            setValidation({
                name: { isValid: null, message: '' },
                quantity: { isValid: null, message: '' },
                bufferStock: { isValid: null, message: '' }
            })
        } catch (error) {
            console.error('Error adding material:', error)
            toast.error('❌ Failed to add material. Please try again!')
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = () => {
        return validation.name.isValid && 
               validation.quantity.isValid && 
               validation.bufferStock.isValid &&
               formData.name.trim() &&
               formData.quantity &&
               formData.bufferStock
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
                        <Package style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
                        Add Material
                    </h1>
                </div>
            </div>

            <div className="routes-main-container">
                <div className="add-material-main-container">
                    {/* Header */}
                    <div className="add-material-header">
                        <h2 className="add-material-title">Add New Material</h2>
                        <p className="add-material-subtitle">
                            Add materials to your inventory with quantity tracking
                        </p>
                    </div>

                    <div className="add-material-form">
                        {/* Material Name */}
                        <div className="add-material-input-section">
                            <label className="add-material-input-label name-label">
                                Material Name
                            </label>
                            <div className="add-material-input-wrapper">
                                <div className={`add-material-input-container ${
                                    validation.name.isValid === true ? 'success' : 
                                    validation.name.isValid === false ? 'error' : ''
                                }`}>
                                    <div className="add-material-icon-container">
                                        <Package className="icon" />
                                    </div>
                                    <input
                                        type="text"
                                        className="add-material-input"
                                        placeholder="Enter material name (e.g., Steel Bars)"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        autoComplete="off"
                                    />
                                </div>
                                {validation.name.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.name.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.name.message}
                                    </div>
                                )}
                            </div>
                            <div className="add-material-input-helper name-helper">
                                Use a descriptive name for easy identification
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="add-material-input-section">
                            <label className="add-material-input-label quantity-label">
                                Total Quantity
                            </label>
                            <div className="add-material-input-wrapper">
                                <div className={`add-material-input-container ${
                                    validation.quantity.isValid === true ? 'success' : 
                                    validation.quantity.isValid === false ? 'error' : ''
                                }`}>
                                    <div className="add-material-icon-container">
                                        <Boxes className="icon" />
                                    </div>
                                    <input
                                        type="number"
                                        className="add-material-input"
                                        placeholder="Enter total quantity (e.g., 100)"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        min="1"
                                        autoComplete="off"
                                    />
                                </div>
                                {validation.quantity.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.quantity.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.quantity.message}
                                    </div>
                                )}
                            </div>
                            <div className="add-material-input-helper quantity-helper">
                                Total quantity available in your inventory
                            </div>
                        </div>

                        {/* Buffer Stock */}
                        <div className="add-material-input-section">
                            <label className="add-material-input-label buffer-label">
                                Buffer Stock Quantity
                            </label>
                            <div className="add-material-input-wrapper">
                                <div className={`add-material-input-container ${
                                    validation.bufferStock.isValid === true ? 'success' : 
                                    validation.bufferStock.isValid === false ? 'error' : ''
                                }`}>
                                    <div className="add-material-icon-container">
                                        <Warehouse className="icon" />
                                    </div>
                                    <input
                                        type="number"
                                        className="add-material-input"
                                        placeholder="Enter buffer stock (e.g., 10)"
                                        name="bufferStock"
                                        value={formData.bufferStock}
                                        onChange={handleChange}
                                        min="0"
                                        autoComplete="off"
                                    />
                                </div>
                                {validation.bufferStock.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.bufferStock.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.bufferStock.message}
                                    </div>
                                )}
                            </div>
                            <div className="add-material-input-helper buffer-helper">
                                Minimum quantity to maintain - alerts when stock goes below this
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="add-material-save-section">
                            <button 
                                className={`add-material-save-btn ${loading ? 'loading' : ''}`} 
                                onClick={handleSave} 
                                disabled={loading || !isFormValid()}
                            >
                                {loading && <span className="add-material-loading-spinner"></span>}
                                {loading ? 'Adding Material...' : 'Add Material to Inventory'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AddMaterial
