import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../Firebase';
import './Payments.css';
import Hamburger from '../../Components/Hamburger/Hamburger';
import { 
  CreditCard, 
  Users, 
  Filter, 
  Download, 
  IndianRupee,
  Calendar,
  Eye,
  BarChart3,
  TrendingUp,
  Search,
  User,
  Phone,
  Mail,
  Briefcase,
  MessageSquare,
  Clock
} from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Filter states
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  
  const filterOptions = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'thisWeek' },
    { label: 'Last Week', value: 'lastWeek' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Last Year', value: 'lastYear' }
  ];

  const paymentModes = ['UPI', 'Cash', 'Personal', 'Employee'];

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, filterPeriod, searchTerm, paymentModeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'Payments'), orderBy('paymentDate', 'desc'));
      const querySnapshot = await getDocs(q);
      const paymentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate?.() || new Date(doc.data().createdDate)
      }));
      setPayments(paymentsList);
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Just log error, don't show to user to avoid authentication issues
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      case 'thisWeek':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start: startOfWeek,
          end: new Date()
        };
      case 'lastWeek':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        return {
          start: lastWeekStart,
          end: lastWeekEnd
        };
      case 'thisMonth':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date()
        };
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: lastMonth,
          end: lastMonthEnd
        };
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date()
        };
      case 'lastYear':
        return {
          start: new Date(now.getFullYear() - 1, 0, 1),
          end: new Date(now.getFullYear() - 1, 11, 31)
        };
      default:
        return null;
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Date filter
    if (filterPeriod !== 'all') {
      const dateRange = getDateRange(filterPeriod);
      if (dateRange) {
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.paymentDate);
          return paymentDate >= dateRange.start && paymentDate <= dateRange.end;
        });
      }
    }

    // Payment mode filter
    if (paymentModeFilter !== 'all') {
      filtered = filtered.filter(payment =>
        payment.paymentMode?.toLowerCase() === paymentModeFilter.toLowerCase()
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.work?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.receivedBy?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
    const total = filtered.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    setTotalAmount(total);
  };

  const getStatistics = () => {
    const totalPayments = filteredPayments.length;
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);
    const uniqueCustomers = new Set(filteredPayments.map(payment => payment.customerId)).size;
    const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;
    
    // Get today's data
    const todayData = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const today = new Date();
      return paymentDate.toDateString() === today.toDateString();
    });
    const todayAmount = todayData.reduce((sum, payment) => sum + (payment.paidAmount || 0), 0);

    // Payment mode breakdown
    const modeBreakdown = {};
    filteredPayments.forEach(payment => {
      const mode = payment.paymentMode || 'Unknown';
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + payment.paidAmount;
    });

    return {
      totalPayments,
      totalAmount,
      uniqueCustomers,
      averagePayment,
      todayAmount,
      modeBreakdown
    };
  };

  const exportData = () => {
    try {
      if (filteredPayments.length === 0) {
        alert('No payment data to export');
        return;
      }

      const csvContent = [
        ['Date', 'Customer Name', 'Mobile', 'Work', 'Amount (₹)', 'Payment Mode', 'Comment', 'Received By'],
        ...filteredPayments.map(payment => [
          new Date(payment.paymentDate).toLocaleDateString(),
          payment.customerName || 'Unknown',
          payment.customerMobile || '',
          payment.work || '',
          payment.paidAmount || 0,
          payment.paymentMode || '',
          payment.comment || '',
          payment.receivedBy || 'Unknown'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert('Payment data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const statistics = getStatistics();

  // Simplified loading check without authentication dependency
  if (loading && payments.length === 0) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Customer Payments</h1>
          </div>
        </div>
        <div className="payments-loading">
          <div className="payments-loading-spinner"></div>
          Loading payments data...
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
            <CreditCard style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Customer Payments
          </h1>
        </div>
        <div className="payments-header-actions">
          <button 
            className="payments-export-btn"
            onClick={exportData}
            disabled={filteredPayments.length === 0}
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="payments-container">
        {/* Statistics Cards */}
        <div className="payments-stats-grid">
          <div className="payments-stat-card">
            <div className="payments-stat-icon total-payments">
              <BarChart3 size={24} />
            </div>
            <div className="payments-stat-content">
              <div className="payments-stat-value">{statistics.totalPayments}</div>
              <div className="payments-stat-label">Total Payments</div>
            </div>
          </div>

          <div className="payments-stat-card">
            <div className="payments-stat-icon total-amount">
              <IndianRupee size={24} />
            </div>
            <div className="payments-stat-content">
              <div className="payments-stat-value">₹{statistics.totalAmount.toLocaleString()}</div>
              <div className="payments-stat-label">Total Received</div>
            </div>
          </div>

          <div className="payments-stat-card">
            <div className="payments-stat-icon unique-customers">
              <Users size={24} />
            </div>
            <div className="payments-stat-content">
              <div className="payments-stat-value">{statistics.uniqueCustomers}</div>
              <div className="payments-stat-label">Paying Customers</div>
            </div>
          </div>

          <div className="payments-stat-card">
            <div className="payments-stat-icon today-amount">
              <TrendingUp size={24} />
            </div>
            <div className="payments-stat-content">
              <div className="payments-stat-value">₹{statistics.todayAmount.toLocaleString()}</div>
              <div className="payments-stat-label">Today's Collection</div>
            </div>
          </div>
        </div>

        {/* Payment Mode Breakdown - Only show if there's data */}
        {Object.keys(statistics.modeBreakdown).length > 0 && (
          <div className="payments-mode-breakdown">
            <h3 className="payments-breakdown-title">
              <BarChart3 size={20} />
              Payment Mode Breakdown
            </h3>
            <div className="payments-mode-cards">
              {Object.entries(statistics.modeBreakdown).map(([mode, amount]) => (
                <div key={mode} className="payments-mode-card">
                  <div className="payments-mode-name">{mode}</div>
                  <div className="payments-mode-amount">₹{amount.toLocaleString()}</div>
                  <div className="payments-mode-percentage">
                    {statistics.totalAmount > 0 ? ((amount / statistics.totalAmount) * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="payments-filters-section">
          <div className="payments-filters-header">
            <h3>
              <Filter size={20} />
              Filter Payments
            </h3>
            <div className="payments-total-display">
              <span className="payments-total-label">Filtered Total:</span>
              <span className="payments-total-value">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="payments-filters-controls">
            <div className="payments-filter-group">
              <label>Time Period:</label>
              <select 
                value={filterPeriod} 
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="payments-filter-select"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="payments-filter-group">
              <label>Payment Mode:</label>
              <select 
                value={paymentModeFilter} 
                onChange={(e) => setPaymentModeFilter(e.target.value)}
                className="payments-filter-select"
              >
                <option value="all">All Modes</option>
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            <div className="payments-filter-group">
              <label>Search:</label>
              <div className="payments-search-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search by customer, work, or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="payments-search-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="payments-list-section">
          <div className="payments-list-header">
            <div className="payments-list-header-left">
              <h3 className="payments-list-title">
                <Eye size={20} />
                Payment Records ({filteredPayments.length})
              </h3>
              <div className="payments-list-info">
                Showing {filteredPayments.length} of {payments.length} payments
              </div>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="payments-empty-state">
              <div className="payments-empty-icon">💳</div>
              <div className="payments-empty-title">No payment records found</div>
              <div className="payments-empty-text">
                {payments.length === 0 
                  ? "No payments have been recorded yet."
                  : "Try adjusting your filters to see more data."}
              </div>
            </div>
          ) : (
            <div className="payments-cards-container">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="payments-card">
                  <div className="payments-card-header">
                    <div className="payments-customer-info">
                      <User size={16} />
                      <div className="payments-customer-details">
                        <div className="payments-customer-name">{payment.customerName}</div>
                        {payment.customerMobile && (
                          <div className="payments-customer-contact">
                            <Phone size={12} />
                            {payment.customerMobile}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="payments-amount-badge">
                      ₹{payment.paidAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="payments-card-body">
                    <div className="payments-card-row">
                      <div className="payments-card-field">
                        <Briefcase size={14} />
                        <span className="payments-field-label">Work:</span>
                        <span className="payments-field-value">{payment.work}</span>
                      </div>
                      <div className="payments-card-field">
                        <CreditCard size={14} />
                        <span className="payments-field-label">Mode:</span>
                        <span className={`payments-mode-badge payments-mode-${payment.paymentMode?.toLowerCase()}`}>
                          {payment.paymentMode}
                        </span>
                      </div>
                    </div>

                    {payment.comment && (
                      <div className="payments-card-row">
                        <div className="payments-card-field full-width">
                          <MessageSquare size={14} />
                          <span className="payments-field-label">Comment:</span>
                          <span className="payments-field-value">{payment.comment}</span>
                        </div>
                      </div>
                    )}

                    <div className="payments-card-row">
                      <div className="payments-card-field">
                        <Calendar size={14} />
                        <span className="payments-field-label">Date:</span>
                        <span className="payments-field-value">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="payments-card-field">
                        <Clock size={14} />
                        <span className="payments-field-label">Time:</span>
                        <span className="payments-field-value">{payment.createdTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="payments-card-footer">
                    <div className="payments-received-by">
                      <User size={12} />
                      Received by: <strong>{payment.receivedBy}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Payments;