import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../Firebase';
import './Payroll.css';
import Hamburger from '../../Components/Hamburger/Hamburger';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  IndianRupee,
  Calendar,
  ChevronDown,
  X,
  Eye,
  BarChart3,
  Wallet,
  Edit,
  Trash2
} from 'lucide-react';

const Payroll = () => {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [overtime, setOvertime] = useState('');
  const [bonus, setBonus] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingId, setEditingId] = useState(null);
  
  // Filter states
  const [filterPeriod, setFilterPeriod] = useState('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchPayrollRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [payrollRecords, filterPeriod, customStartDate, customEndDate]);

  const fetchEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'Employees'));
      const employeesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrollRecords = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'Payroll'), orderBy('paymentDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate?.() || new Date(doc.data().paymentDate)
      }));
      setPayrollRecords(records);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    const now = new Date();
    let filtered = [];

    switch (filterPeriod) {
      case 'thisMonth':
        filtered = payrollRecords.filter(record => {
          const recordDate = new Date(record.paymentDate);
          return recordDate.getMonth() === now.getMonth() && 
                 recordDate.getFullYear() === now.getFullYear();
        });
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        filtered = payrollRecords.filter(record => {
          const recordDate = new Date(record.paymentDate);
          return recordDate.getMonth() === lastMonth.getMonth() && 
                 recordDate.getFullYear() === lastMonth.getFullYear();
        });
        break;
      case 'thisYear':
        filtered = payrollRecords.filter(record => {
          const recordDate = new Date(record.paymentDate);
          return recordDate.getFullYear() === now.getFullYear();
        });
        break;
      case 'lastYear':
        filtered = payrollRecords.filter(record => {
          const recordDate = new Date(record.paymentDate);
          return recordDate.getFullYear() === now.getFullYear() - 1;
        });
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          filtered = payrollRecords.filter(record => {
            const recordDate = new Date(record.paymentDate);
            return recordDate >= new Date(customStartDate) && 
                   recordDate <= new Date(customEndDate);
          });
        } else {
          filtered = payrollRecords;
        }
        break;
      default:
        filtered = payrollRecords;
    }

    setFilteredRecords(filtered);
    const total = filtered.reduce((sum, record) => sum + (record.netSalary || 0), 0);
    setTotalAmount(total);
  };

  const calculateNetSalary = () => {
    const base = parseFloat(baseSalary) || 0;
    const ot = parseFloat(overtime) || 0;
    const bonusAmount = parseFloat(bonus) || 0;
    const deductionAmount = parseFloat(deductions) || 0;
    return base + ot + bonusAmount - deductionAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !baseSalary) {
      alert('Please select an employee and enter base salary');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);
    const netSalary = calculateNetSalary();
    
    const payrollData = {
      employeeId: selectedEmployee,
      employeeName: employee.name || employee.firstName + ' ' + employee.lastName,
      employeeEmail: employee.email,
      baseSalary: parseFloat(baseSalary),
      overtime: parseFloat(overtime) || 0,
      bonus: parseFloat(bonus) || 0,
      deductions: parseFloat(deductions) || 0,
      netSalary: netSalary,
      paymentDate: new Date(paymentDate),
      createdAt: new Date(),
      status: 'paid'
    };

    try {
      setLoading(true);
      if (editingId) {
        await updateDoc(doc(db, 'Payroll', editingId), payrollData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'Payroll'), payrollData);
      }
      
      resetForm();
      fetchPayrollRecords();
      alert(editingId ? 'Payroll updated successfully!' : 'Payroll added successfully!');
    } catch (error) {
      console.error('Error saving payroll:', error);
      alert('Error saving payroll record');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setSelectedEmployee(record.employeeId);
    setBaseSalary(record.baseSalary.toString());
    setOvertime(record.overtime.toString());
    setBonus(record.bonus.toString());
    setDeductions(record.deductions.toString());
    setPaymentDate(new Date(record.paymentDate).toISOString().split('T')[0]);
    setEditingId(record.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        await deleteDoc(doc(db, 'Payroll', id));
        fetchPayrollRecords();
        alert('Payroll record deleted successfully!');
      } catch (error) {
        console.error('Error deleting payroll:', error);
        alert('Error deleting payroll record');
      }
    }
  };

  const resetForm = () => {
    setSelectedEmployee('');
    setBaseSalary('');
    setOvertime('');
    setBonus('');
    setDeductions('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const getStatistics = () => {
    const totalRecords = filteredRecords.length;
    const totalAmount = filteredRecords.reduce((sum, record) => sum + (record.netSalary || 0), 0);
    const totalBaseSalary = filteredRecords.reduce((sum, record) => sum + (record.baseSalary || 0), 0);
    const totalBonus = filteredRecords.reduce((sum, record) => sum + (record.bonus || 0), 0);
    const averageSalary = totalRecords > 0 ? totalAmount / totalRecords : 0;
    
    // Get unique employees
    const uniqueEmployees = new Set(filteredRecords.map(record => record.employeeId)).size;
    
    // Get this month's data
    const now = new Date();
    const thisMonthData = payrollRecords.filter(record => {
      const recordDate = new Date(record.paymentDate);
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });
    const thisMonthAmount = thisMonthData.reduce((sum, record) => sum + (record.netSalary || 0), 0);

    return {
      totalRecords,
      totalAmount,
      totalBaseSalary,
      totalBonus,
      averageSalary,
      uniqueEmployees,
      thisMonthAmount
    };
  };

  const exportData = () => {
    try {
      const csvContent = [
        ['Date', 'Employee Name', 'Base Salary', 'Overtime', 'Bonus', 'Deductions', 'Net Salary'],
        ...filteredRecords.map(record => [
          new Date(record.paymentDate).toLocaleDateString(),
          record.employeeName || 'Unknown',
          record.baseSalary || 0,
          record.overtime || 0,
          record.bonus || 0,
          record.deductions || 0,
          record.netSalary || 0
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_records_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert('Payroll data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const statistics = getStatistics();

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Payroll Management</h1>
          </div>
        </div>
        <div className="payroll-loading">
          <div className="payroll-loading-spinner"></div>
          Loading payroll data...
        </div>
      </>
    );
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
            Payroll Management
          </h1>
        </div>
      </div>

      <div className="payroll-container">
        {/* Filter Section */}
        <div className="payroll-filters-section">
          <div className="payroll-filters-header">
            <h3>
              <Filter size={20} />
              Filter Payroll Records
            </h3>
          </div>
          
          <div className="payroll-filters-controls">
            <select 
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="payroll-filter-select"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {filterPeriod === 'custom' && (
              <div className="payroll-custom-date-range">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="payroll-date-input"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  placeholder="End Date"
                  className="payroll-date-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="payroll-stats-grid">
          <div className="payroll-stat-card">
            <div className="payroll-stat-icon total-records">
              <BarChart3 size={24} />
            </div>
            <div className="payroll-stat-content">
              <div className="payroll-stat-value">{statistics.totalRecords}</div>
              <div className="payroll-stat-label">Total Records</div>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon total-amount">
              <IndianRupee size={24} />
            </div>
            <div className="payroll-stat-content">
              <div className="payroll-stat-value">₹{statistics.totalAmount.toLocaleString()}</div>
              <div className="payroll-stat-label">Total Amount</div>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon unique-employees">
              <Users size={24} />
            </div>
            <div className="payroll-stat-content">
              <div className="payroll-stat-value">{statistics.uniqueEmployees}</div>
              <div className="payroll-stat-label">Employees Paid</div>
            </div>
          </div>

          <div className="payroll-stat-card">
            <div className="payroll-stat-icon monthly-amount">
              <IndianRupee size={24} />
            </div>
            <div className="payroll-stat-content">
              <div className="payroll-stat-value">₹{statistics.thisMonthAmount.toLocaleString()}</div>
              <div className="payroll-stat-label">This Month</div>
            </div>
          </div>
        </div>

        

        {/* Payroll Form */}
        <div className="payroll-form-section">
          <div className="payroll-form-header">
            <h2 className="payroll-form-title">
              <Plus size={20} />
              {editingId ? 'Edit Payroll Record' : 'Add New Payroll'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="payroll-form">
            <div className="payroll-form-row">
              <div className="payroll-form-group">
                <label className="payroll-form-label">Employee *</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="payroll-form-select"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name || `${employee.firstName} ${employee.lastName}`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="payroll-form-group">
                <label className="payroll-form-label">Payment Date *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="payroll-form-input"
                  required
                />
              </div>
            </div>

            <div className="payroll-form-row">
              <div className="payroll-form-group">
                <label className="payroll-form-label">Base Salary (₹) *</label>
                <input
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="payroll-form-input"
                  required
                />
              </div>
              
              <div className="payroll-form-group">
                <label className="payroll-form-label">Overtime (₹)</label>
                <input
                  type="number"
                  value={overtime}
                  onChange={(e) => setOvertime(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="payroll-form-input"
                />
              </div>
            </div>

            <div className="payroll-form-row">
              <div className="payroll-form-group">
                <label className="payroll-form-label">Bonus (₹)</label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="payroll-form-input"
                />
              </div>
              
              <div className="payroll-form-group">
                <label className="payroll-form-label">Deductions (₹)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="payroll-form-input"
                />
              </div>
            </div>

            <div className="payroll-net-salary-display">
              <IndianRupee size={20} />
              <span>Net Salary: ₹{calculateNetSalary().toLocaleString()}</span>
            </div>

            <div className="payroll-form-actions">
              <button type="submit" disabled={loading} className="payroll-submit-btn">
                {loading ? (
                  <>
                    <div className="payroll-btn-spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    {editingId ? 'Update Payroll' : 'Add Payroll'}
                  </>
                )}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="payroll-cancel-btn">
                  <X size={18} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Payroll Records List */}
        <div className="payroll-list-section">
          <div className="payroll-list-header">
            <div className="payroll-list-header-left">
              <h3 className="payroll-list-title">
                <Eye size={20} />
                Payroll Records ({filteredRecords.length})
              </h3>
              <div className="payroll-list-info">
                Showing {filteredRecords.length} of {payrollRecords.length} records
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="payroll-empty-state">
              <div className="payroll-empty-icon">💰</div>
              <div className="payroll-empty-title">No payroll records found</div>
              <div className="payroll-empty-text">
                {payrollRecords.length === 0 
                  ? "Start by adding your first payroll record above."
                  : "Try adjusting your filters to see more data."}
              </div>
            </div>
          ) : (
            <div className="payroll-table-container">
              <table className="payroll-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Payment Date</th>
                    <th>Base Salary</th>
                    <th>Overtime</th>
                    <th>Bonus</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id}>
                      <td className="payroll-table-employee">
                        <div className="payroll-employee-info">
                          <Users size={14} />
                          <span>{record.employeeName}</span>
                        </div>
                      </td>
                      <td className="payroll-table-date">
                        <div className="payroll-date-info">
                          <Calendar size={14} />
                          <span>{new Date(record.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="payroll-table-amount">
                        <span className="payroll-amount-value">
                          ₹{record.baseSalary.toLocaleString()}
                        </span>
                      </td>
                      <td className="payroll-table-amount">
                        <span className="payroll-amount-value">
                          ₹{record.overtime.toLocaleString()}
                        </span>
                      </td>
                      <td className="payroll-table-amount">
                        <span className="payroll-amount-value">
                          ₹{record.bonus.toLocaleString()}
                        </span>
                      </td>
                      <td className="payroll-table-amount">
                        <span className="payroll-amount-value deduction">
                          ₹{record.deductions.toLocaleString()}
                        </span>
                      </td>
                      <td className="payroll-table-net-salary">
                        <span className="payroll-net-salary-value">
                          ₹{record.netSalary.toLocaleString()}
                        </span>
                      </td>
                      <td className="payroll-table-actions">
                        <button 
                          onClick={() => handleEdit(record)}
                          className="payroll-edit-btn"
                          title="Edit Record"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="payroll-delete-btn"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Payroll;