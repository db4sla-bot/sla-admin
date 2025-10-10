/* filepath: c:\Users\Arumulla SivaKrishna\Documents\sla-admin\src\Pages\Customers\Customers.jsx */
import React, { useEffect, useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { NavLink, useNavigate } from "react-router-dom";
import { Eye, Search, Users, Plus, Filter, Calendar } from "lucide-react";
import "./Customers.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // New date filter
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const colors = [
    "linear-gradient(135deg, #667eea, #764ba2)",
    "linear-gradient(135deg, #f093fb, #f5576c)",
    "linear-gradient(135deg, #4facfe, #00f2fe)",
    "linear-gradient(135deg, #43e97b, #38f9d7)",
    "linear-gradient(135deg, #fa709a, #fee140)",
    "linear-gradient(135deg, #a8edea, #fed6e3)",
    "linear-gradient(135deg, #ff9a9e, #fecfef)",
    "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  ];

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "Customers"));
        const customersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort customers by name
        customersData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        setCustomers(customersData);
        setFilteredCustomers(customersData);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Filter customers based on search, payment status, and date
  useEffect(() => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile?.includes(searchTerm) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Payment status filter
    if (paymentStatusFilter) {
      filtered = filtered.filter(customer => {
        const paymentSummary = getPaymentSummary(customer);
        
        if (paymentStatusFilter === 'pending') {
          return paymentSummary.pendingAmount > 0 || paymentSummary.totalProjects === 0;
        } else if (paymentStatusFilter === 'done') {
          return paymentSummary.totalProjects > 0 && paymentSummary.pendingAmount === 0;
        }
        
        return true;
      });
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(customer => {
        if (!customer.createdAt) return false;
        
        // Handle different date formats
        let customerDate;
        if (typeof customer.createdAt === 'string') {
          customerDate = new Date(customer.createdAt);
        } else if (customer.createdAt.toDate) {
          // Firestore timestamp
          customerDate = customer.createdAt.toDate();
        } else {
          customerDate = new Date(customer.createdAt);
        }
        
        const filterDate = new Date(dateFilter);
        
        // Compare dates (ignore time)
        return customerDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, paymentStatusFilter, dateFilter, customers]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePaymentStatusFilter = (e) => {
    setPaymentStatusFilter(e.target.value);
  };

  const handleDateFilter = (e) => {
    setDateFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('');
    setDateFilter('');
  };

  // Calculate payment summary for a customer
  const getPaymentSummary = (customer) => {
    if (!customer.payments || customer.payments.length === 0) {
      return {
        totalProjects: 0,
        totalAmount: 0,
        pendingAmount: 0,
        completedProjects: 0,
        pendingProjects: 0
      };
    }

    let totalAmount = 0;
    let pendingAmount = 0;
    let completedProjects = 0;
    let pendingProjects = 0;

    customer.payments.forEach(payment => {
      const paidTotal = payment.paid?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const pending = payment.totalAmount - paidTotal;
      
      totalAmount += payment.totalAmount || 0;
      pendingAmount += pending;
      
      if (pending === 0) {
        completedProjects++;
      } else {
        pendingProjects++;
      }
    });

    return {
      totalProjects: customer.payments.length,
      totalAmount,
      pendingAmount,
      completedProjects,
      pendingProjects
    };
  };

  if (loading) {
    return (
      <>
        <div className="customers-top-bar-container">
          <Hamburger />
          <div className="customers-breadcrumps-container">
            <h1>Customers</h1>
          </div>
        </div>
        <div className="customers-loading">
          <div className="customers-loader"></div>
          <p>Loading customers...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <div className="customers-top-bar-container">
        <Hamburger />
        <div className="customers-breadcrumps-container">
          <h1>Customers</h1>
        </div>
        <div className="customers-actions-container">
          <NavLink to="/addcustomer" className="customers-add-btn">
            <Plus /> Add Customer
          </NavLink>
        </div>
      </div>

      <div className="customers-main-container">
        {/* Header */}
        <div className="customers-header">
          <h1>Customer Management</h1>
          <p>Manage and track your customer database</p>
        </div>

        {/* Filters */}
        <div className="customers-filters">
          <div className="customers-search-container">
            <Search className="customers-search-icon" />
            <input
              type="text"
              placeholder="Search by name, mobile, address, or city..."
              value={searchTerm}
              onChange={handleSearch}
              className="customers-search-input"
            />
          </div>

          <div className="customers-filter-row">
            <div className="customers-date-filter">
              <Calendar className="customers-calendar-icon" />
              <input
                type="date"
                value={dateFilter}
                onChange={handleDateFilter}
                className="customers-date-input"
                placeholder="Filter by creation date"
              />
            </div>

            <div className="customers-payment-status-filter">
              <select
                value={paymentStatusFilter}
                onChange={handlePaymentStatusFilter}
                className="customers-payment-status-select"
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending Payments</option>
                <option value="done">Done Payments</option>
              </select>
            </div>

            <button className="customers-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="customers-summary">
          <p>
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
          {(searchTerm || paymentStatusFilter || dateFilter) && (
            <p className="customers-filter-info">Filters applied</p>
          )}
        </div>

        {/* Customers Table */}
        <div className="customers-table-container">
          {filteredCustomers.length > 0 ? (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer Info</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Projects</th>
                  <th>Payment Status</th>
                  <th>Total Amount</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => {
                  const bgColor = colors[index % colors.length];
                  const firstLetter = customer.name ? customer.name.charAt(0).toUpperCase() : "?";
                  const paymentSummary = getPaymentSummary(customer);
                  
                  // Format creation date
                  const formatCreatedDate = (createdAt) => {
                    if (!createdAt) return 'N/A';
                    
                    let date;
                    if (typeof createdAt === 'string') {
                      date = new Date(createdAt);
                    } else if (createdAt.toDate) {
                      // Firestore timestamp
                      date = createdAt.toDate();
                    } else {
                      date = new Date(createdAt);
                    }
                    
                    return date.toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });
                  };
                  
                  return (
                    <tr key={customer.id} className="customers-table-row">
                      <td className="customers-info-cell">
                        <div className="customers-info">
                          <div 
                            className="customers-avatar"
                            style={{ background: bgColor }}
                          >
                            {firstLetter}
                          </div>
                          <div className="customers-details">
                            <span className="customers-name">
                              {customer.name || 'Unnamed Customer'}
                            </span>
                            <span className="customers-id">
                              ID: {customer.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="customers-contact">
                        <div className="customers-contact-info">
                          <span className="customers-phone">
                            {customer.mobile || 'No mobile'}
                          </span>
                          <span className="customers-email">
                            {customer.lookingFor && customer.lookingFor.length > 0 
                              ? customer.lookingFor.join(', ') 
                              : 'No services'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="customers-location">
                        <div className="customers-address-info">
                          {customer.address && (
                            <span className="customers-address">
                              {customer.address.length > 30 
                                ? `${customer.address.substring(0, 30)}...` 
                                : customer.address
                              }
                            </span>
                          )}
                          <span className="customers-city-state">
                            {customer.city && customer.state 
                              ? `${customer.city}, ${customer.state}` 
                              : customer.city || customer.state || 'No location'}
                          </span>
                        </div>
                      </td>
                      <td className="customers-projects">
                        <div className="customers-payment-summary">
                          <span className="customers-total-projects">
                            {paymentSummary.totalProjects} Projects
                          </span>
                          {paymentSummary.totalProjects > 0 && (
                            <div className="customers-payment-status">
                              {paymentSummary.completedProjects > 0 && (
                                <span className="customers-status-badge completed">
                                  {paymentSummary.completedProjects} Done
                                </span>
                              )}
                              {paymentSummary.pendingProjects > 0 && (
                                <span className="customers-status-badge pending">
                                  {paymentSummary.pendingProjects} Pending
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="customers-payment-status-cell">
                        <div className="customers-amount-info">
                          {paymentSummary.totalProjects > 0 ? (
                            <>
                              <span 
                                className={`customers-status-badge ${
                                  paymentSummary.pendingAmount === 0 ? 'completed' : 'pending'
                                }`}
                              >
                                {paymentSummary.pendingAmount === 0 ? 'All Paid' : 'Pending'}
                              </span>
                              {paymentSummary.pendingAmount > 0 && (
                                <span className="customers-pending-amount">
                                  Pending: ₹{paymentSummary.pendingAmount.toLocaleString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="customers-status-badge pending">No Projects</span>
                          )}
                        </div>
                      </td>
                      <td className="customers-amount">
                        <span className="customers-total-amount">
                          ₹{paymentSummary.totalAmount.toLocaleString()}
                        </span>
                      </td>
                      <td className="customers-created-date">
                        <span className="customers-date" style={{fontSize: '12px'}}>
                          {formatCreatedDate(customer.createdAt)}
                        </span>
                      </td>
                      <td className="customers-actions">
                        <div className="customers-action-buttons">
                          <button
                            className="customers-view-btn"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="View Customer Details"
                          >
                            <Eye />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="customers-empty">
              <div className="customers-empty-icon">👥</div>
              <h3>No customers found</h3>
              <p>
                {searchTerm || paymentStatusFilter || dateFilter
                  ? "Try adjusting your search criteria or filters"
                  : "Start by adding your first customer to manage your client database"}
              </p>
              {!searchTerm && !paymentStatusFilter && !dateFilter && (
                <NavLink to="/addcustomer" className="customers-empty-add-btn">
                  <Plus /> Add New Customer
                </NavLink>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Customers;