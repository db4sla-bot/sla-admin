import React, { useState } from 'react'
import './AddMaterial.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { Package, DollarSign, Hash, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { db } from '../../Firebase'
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

const AddMaterial = () => {
    const [loading, setLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        quantity: '',
        bufferStock: ''
    })
    const [validation, setValidation] = useState({
        name: { isValid: null, message: '' },
        price: { isValid: null, message: '' },
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

            case 'price':
                const price = Number(value)
                if (!value) {
                    message = 'Price is required'
                } else if (isNaN(price) || price <= 0) {
                    message = 'Price must be a positive number'
                } else if (price > 999999) {
                    message = 'Price seems too high'
                } else {
                    isValid = true
                    message = 'Price is valid'
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

        // Only allow numbers for price, quantity and bufferStock
        if ((name === 'price' || name === 'quantity' || name === 'bufferStock') && value && isNaN(value)) {
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
        const priceValid = validateField('price', formData.price)
        const quantityValid = validateField('quantity', formData.quantity)
        const bufferValid = validateField('bufferStock', formData.bufferStock)

        if (!nameValid || !priceValid || !quantityValid || !bufferValid) {
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
                price: Number(formData.price),
                quantity: Number(formData.quantity),
                bufferStock: Number(formData.bufferStock),
                remaining: Number(formData.quantity), // Initially, remaining = quantity
                status: 'Available',
                statusColor: '#17c666',
                createdAt: serverTimestamp(),
                createdBy: 'Admin', // You can get this from user context
                lastUpdated: serverTimestamp()
            })

            setShowSuccess(true)
            toast.success(`✅ Material "${formData.name}" added successfully! 🎉`)
            
            // Reset form and validation after 2 seconds
            setTimeout(() => {
                setFormData({ name: '', price: '', quantity: '', bufferStock: '' })
                setValidation({
                    name: { isValid: null, message: '' },
                    price: { isValid: null, message: '' },
                    quantity: { isValid: null, message: '' },
                    bufferStock: { isValid: null, message: '' }
                })
                setShowSuccess(false)
            }, 2000)
        } catch (error) {
            console.error('Error adding material:', error)
            toast.error('❌ Failed to add material. Please try again!')
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        setFormData({ name: '', price: '', quantity: '', bufferStock: '' })
        setValidation({
            name: { isValid: null, message: '' },
            price: { isValid: null, message: '' },
            quantity: { isValid: null, message: '' },
            bufferStock: { isValid: null, message: '' }
        })
        setShowSuccess(false)
    }

    const isFormValid = () => {
        return validation.name.isValid && 
               validation.price.isValid && 
               validation.quantity.isValid && 
               validation.bufferStock.isValid &&
               formData.name.trim() &&
               formData.price &&
               formData.quantity &&
               formData.bufferStock
    }

    return (
        <>
            <div className="top-bar-container">
                <Hamburger />
                <div className="breadcrumps-container">
                    <h1 className="add-material-page-title">
                        Add Material
                    </h1>
                </div>
            </div>

            <div className="add-material-main-container">
                <div className="add-material-content">
                    {/* Header Section */}
                    <div className="add-material-header-section">
                        <div className="add-material-header-info">
                            <h1 className="add-material-page-title">Add New Material</h1>
                            <p className="add-material-page-subtitle">
                                Add materials to your inventory with pricing and quantity tracking
                            </p>
                        </div>
                        <div className="add-material-header-icon">
                            <Package size={40} />
                        </div>
                    </div>

                    {/* Success Message */}
                    {showSuccess && (
                        <div className="add-material-success-message">
                            <CheckCircle className="success-icon" />
                            <span>Material added successfully! Ready to add another.</span>
                        </div>
                    )}

                    {/* Form Section */}
                    <div className="add-material-form-section">
                        <div className="add-material-form">
                            {/* Material Name */}
                            <div className="add-material-form-group">
                                <label className="add-material-form-label">
                                    <Package className="material-icon" />
                                    Material Name
                                </label>
                                <input
                                    type="text"
                                    className={`add-material-form-input ${
                                        validation.name.isValid === true ? 'success' : 
                                        validation.name.isValid === false ? 'error' : ''
                                    }`}
                                    placeholder="Enter material name (e.g., Steel Bars)"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                                {validation.name.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.name.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.name.isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {validation.name.message}
                                    </div>
                                )}
                                <div className="add-material-helper-text">
                                    Use a descriptive name for easy identification
                                </div>
                            </div>

                            {/* Material Price */}
                            <div className="add-material-form-group">
                                <label className="add-material-form-label">
                                    <DollarSign className="material-icon" />
                                    Material Price (Per Unit)
                                </label>
                                <div className="add-material-price-input">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={`add-material-form-input ${
                                            validation.price.isValid === true ? 'success' : 
                                            validation.price.isValid === false ? 'error' : ''
                                        }`}
                                        placeholder="Enter price per unit (e.g., 125.50)"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        min="0.01"
                                        autoComplete="off"
                                    />
                                </div>
                                {validation.price.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.price.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.price.isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {validation.price.message}
                                    </div>
                                )}
                                <div className="add-material-helper-text">
                                    Price per single unit of this material
                                </div>
                            </div>

                            {/* Total Quantity */}
                            <div className="add-material-form-group">
                                <label className="add-material-form-label">
                                    <Hash className="material-icon" />
                                    Total Quantity
                                </label>
                                <input
                                    type="number"
                                    className={`add-material-form-input ${
                                        validation.quantity.isValid === true ? 'success' : 
                                        validation.quantity.isValid === false ? 'error' : ''
                                    }`}
                                    placeholder="Enter total quantity (e.g., 100)"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    min="1"
                                    autoComplete="off"
                                />
                                {validation.quantity.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.quantity.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.quantity.isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {validation.quantity.message}
                                    </div>
                                )}
                                <div className="add-material-helper-text">
                                    Total quantity available in your inventory
                                </div>
                            </div>

                            {/* Buffer Stock */}
                            <div className="add-material-form-group">
                                <label className="add-material-form-label">
                                    <Shield className="material-icon" />
                                    Buffer Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    className={`add-material-form-input ${
                                        validation.bufferStock.isValid === true ? 'success' : 
                                        validation.bufferStock.isValid === false ? 'error' : ''
                                    }`}
                                    placeholder="Enter buffer stock (e.g., 10)"
                                    name="bufferStock"
                                    value={formData.bufferStock}
                                    onChange={handleChange}
                                    min="0"
                                    autoComplete="off"
                                />
                                {validation.bufferStock.message && (
                                    <div className={`add-material-validation-message ${
                                        validation.bufferStock.isValid ? 'success' : 'error'
                                    }`}>
                                        {validation.bufferStock.isValid ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {validation.bufferStock.message}
                                    </div>
                                )}
                                <div className="add-material-helper-text">
                                    Minimum quantity to maintain - alerts when stock goes below this
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="add-material-actions">
                            <button 
                                className="add-material-cancel-btn"
                                onClick={handleReset}
                                disabled={loading}
                            >
                                Reset Form
                            </button>
                            <button 
                                className="add-material-save-btn"
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