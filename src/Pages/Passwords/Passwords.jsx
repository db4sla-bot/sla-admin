import React, { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'
import './Passwords.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { 
  Lock, 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Copy, 
  Shield,
  User,
  Key,
  Globe,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAppContext } from '../../Context'

const Passwords = () => {
  const { userDetails } = useAppContext()
  
  // Form states
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Data states
  const [passwords, setPasswords] = useState([])
  const [filteredPasswords, setFilteredPasswords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState(new Set())
  const [copiedPasswordId, setCopiedPasswordId] = useState(null)

  useEffect(() => {
    fetchPasswords()
  }, [])

  useEffect(() => {
    filterPasswords()
  }, [passwords, searchTerm])

  const fetchPasswords = async () => {
    try {
      setLoading(true)
      const q = query(collection(db, 'Passwords'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const passwordsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPasswords(passwordsList)
    } catch (error) {
      console.error('Error fetching passwords:', error)
      toast.error('Failed to fetch passwords')
    } finally {
      setLoading(false)
    }
  }

  const filterPasswords = () => {
    if (!searchTerm) {
      setFilteredPasswords(passwords)
      return
    }
    
    const filtered = passwords.filter(pwd =>
      pwd.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pwd.username?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPasswords(filtered)
  }

  const resetForm = () => {
    setDisplayName('')
    setUsername('')
    setPassword('')
    setShowPassword(false)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!displayName.trim() || !username.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setSaving(true)

    try {
      const passwordData = {
        displayName: displayName.trim(),
        username: username.trim(),
        password: password.trim(),
        createdBy: userDetails?.name || 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingId) {
        await updateDoc(doc(db, 'Passwords', editingId), {
          ...passwordData,
          updatedAt: new Date()
        })
        toast.success('Password updated successfully!')
      } else {
        await addDoc(collection(db, 'Passwords'), passwordData)
        toast.success('Password saved successfully!')
      }

      resetForm()
      fetchPasswords()
    } catch (error) {
      console.error('Error saving password:', error)
      toast.error('Failed to save password')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (passwordItem) => {
    setDisplayName(passwordItem.displayName)
    setUsername(passwordItem.username)
    setPassword(passwordItem.password)
    setEditingId(passwordItem.id)
    setShowPassword(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        await deleteDoc(doc(db, 'Passwords', id))
        toast.success('Password deleted successfully!')
        fetchPasswords()
      } catch (error) {
        console.error('Error deleting password:', error)
        toast.error('Failed to delete password')
      }
    }
  }

  const togglePasswordVisibility = (id) => {
    const newVisiblePasswords = new Set(visiblePasswords)
    if (newVisiblePasswords.has(id)) {
      newVisiblePasswords.delete(id)
    } else {
      newVisiblePasswords.add(id)
    }
    setVisiblePasswords(newVisiblePasswords)
  }

  const copyToClipboard = async (text, id, type) => {
    try {
      await navigator.clipboard.writeText(text)
      
      if (type === 'password') {
        setCopiedPasswordId(id)
        setTimeout(() => setCopiedPasswordId(null), 2000)
      }
      
      toast.success(`${type} copied to clipboard!`)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: 'No Password', color: '#ef4444' }
    
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    
    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' }
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' }
    if (score <= 3) return { level: 3, label: 'Good', color: '#10b981' }
    if (score <= 4) return { level: 4, label: 'Strong', color: '#059669' }
    return { level: 5, label: 'Very Strong', color: '#047857' }
  }

  const passwordStrength = getPasswordStrength(password)

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Password Manager</h1>
          </div>
        </div>
        <div className="passwords-loading">
          <div className="passwords-loading-spinner"></div>
          Loading passwords...
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
            <Shield style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Password Manager
          </h1>
        </div>
      </div>

      <div className="passwords-container">
        {/* Add/Edit Password Form */}
        <div className="passwords-form-section">
          <div className="passwords-form-header">
            <h2 className="passwords-form-title">
              <Plus size={20} />
              {editingId ? 'Edit Password' : 'Add New Password'}
            </h2>
            {editingId && (
              <button 
                className="passwords-cancel-btn"
                onClick={resetForm}
                type="button"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="passwords-form">
            {/* Display Name */}
            <div className="passwords-form-group">
              <label className="passwords-form-label">
                <Globe size={16} />
                Display Name *
              </label>
              <input
                type="text"
                className="passwords-form-input"
                placeholder="e.g., Facebook, Instagram, Gmail..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            {/* Username */}
            <div className="passwords-form-group">
              <label className="passwords-form-label">
                <User size={16} />
                Username *
              </label>
              <input
                type="text"
                className="passwords-form-input"
                placeholder="Username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="passwords-form-group">
              <label className="passwords-form-label">
                <Key size={16} />
                Password *
              </label>
              <div className="passwords-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="passwords-form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="passwords-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="passwords-strength-indicator">
                  <div className="passwords-strength-bar">
                    <div 
                      className="passwords-strength-fill"
                      style={{ 
                        width: `${(passwordStrength.level / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    ></div>
                  </div>
                  <span 
                    className="passwords-strength-label"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="passwords-submit-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="passwords-btn-spinner"></div>
                  {editingId ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  {editingId ? <Edit size={18} /> : <Plus size={18} />}
                  {editingId ? 'Update Password' : 'Save Password'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Search Section */}
        <div className="passwords-search-section">
          <div className="passwords-search-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search passwords by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="passwords-search-input"
            />
          </div>
          <div className="passwords-count">
            {filteredPasswords.length} password{filteredPasswords.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Passwords List */}
        <div className="passwords-list-section">
          {filteredPasswords.length === 0 ? (
            <div className="passwords-empty-state">
              <div className="passwords-empty-icon">🔐</div>
              <div className="passwords-empty-title">
                {passwords.length === 0 ? 'No passwords saved yet' : 'No passwords found'}
              </div>
              <div className="passwords-empty-text">
                {passwords.length === 0 
                  ? 'Start by adding your first password above to keep your accounts secure.'
                  : 'Try adjusting your search term to find what you\'re looking for.'}
              </div>
            </div>
          ) : (
            <div className="passwords-grid">
              {filteredPasswords.map((passwordItem) => (
                <div key={passwordItem.id} className="passwords-card">
                  <div className="passwords-card-header">
                    <div className="passwords-card-avatar">
                      {passwordItem.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="passwords-card-info">
                      <h3 className="passwords-card-title">
                        {passwordItem.displayName}
                      </h3>
                      <p className="passwords-card-username">
                        {passwordItem.username}
                      </p>
                    </div>
                    <div className="passwords-card-actions">
                      <button
                        className="passwords-action-btn edit"
                        onClick={() => handleEdit(passwordItem)}
                        title="Edit password"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="passwords-action-btn delete"
                        onClick={() => handleDelete(passwordItem.id)}
                        title="Delete password"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="passwords-card-body">
                    {/* Username Row */}
                    <div className="passwords-card-row">
                      <div className="passwords-card-label">
                        <User size={14} />
                        Username
                      </div>
                      <div className="passwords-card-value">
                        <span>{passwordItem.username}</span>
                        <button
                          className="passwords-copy-btn"
                          onClick={() => copyToClipboard(passwordItem.username, passwordItem.id, 'username')}
                          title="Copy username"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Password Row */}
                    <div className="passwords-card-row">
                      <div className="passwords-card-label">
                        <Key size={14} />
                        Password
                      </div>
                      <div className="passwords-card-value">
                        <span className="passwords-hidden-text">
                          {visiblePasswords.has(passwordItem.id) 
                            ? passwordItem.password 
                            : '••••••••••••'
                          }
                        </span>
                        <div className="passwords-card-controls">
                          {/* <button
                            className="passwords-toggle-btn small"
                            onClick={() => togglePasswordVisibility(passwordItem.id)}
                            title={visiblePasswords.has(passwordItem.id) ? 'Hide password' : 'Show password'}
                          >
                            {visiblePasswords.has(passwordItem.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button> */}
                          <button
                            className={`passwords-copy-btn ${copiedPasswordId === passwordItem.id ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(passwordItem.password, passwordItem.id, 'password')}
                            title="Copy password"
                          >
                            {copiedPasswordId === passwordItem.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength */}
                    <div className="passwords-card-row">
                      <div className="passwords-card-label">
                        <Shield size={14} />
                        Strength
                      </div>
                      <div className="passwords-card-value">
                        <div className="passwords-strength-badge">
                          <div 
                            className="passwords-strength-dot"
                            style={{ backgroundColor: getPasswordStrength(passwordItem.password).color }}
                          ></div>
                          <span 
                            style={{ color: getPasswordStrength(passwordItem.password).color }}
                          >
                            {getPasswordStrength(passwordItem.password).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="passwords-card-footer">
                    <div className="passwords-card-meta">
                      <span>Added by {passwordItem.createdBy}</span>
                      <span>•</span>
                      <span>{new Date(passwordItem.createdAt?.toDate?.() || passwordItem.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Passwords