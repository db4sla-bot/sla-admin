/* filepath: c:\Users\Arumulla SivaKrishna\Documents\sla-admin\src\Pages\Customers\Customers.jsx */
import React, { useEffect, useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { NavLink, useNavigate } from "react-router-dom";
import { Eye, Search, Users, Plus, Filter, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import "./Customers.css";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../Firebase";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [servicesFilter, setServicesFilter] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Customer counts
  const [customerCounts, setCustomerCounts] = useState({
    total: 0,
    filtered: 0
  });
  
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

  // Services list for filter
  const servicesList = [
    "Invisible Grills",
    "Mosquito Mesh", 
    "Cloth Hangers",
    "Artificial Grass",
    "Bird Spikes"
  ];

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        // Fetch customers with latest first ordering
        const customersQuery = query(
          collection(db, "Customers"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(customersQuery);
        const customersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomers(customersData);
        setFilteredCustomers(customersData);
        
        // Update counts
        setCustomerCounts({
          total: customersData.length,
          filtered: customersData.length
        });
      } catch (error) {
        console.error("Error fetching customers:", error);
        // If orderBy fails, fetch without ordering and sort manually
        try {
          const querySnapshot = await getDocs(collection(db, "Customers"));
          const customersData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort manually by createdAt (latest first)
          customersData.sort((a, b) => {
            const aDate = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
            const bDate = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
            return bDate - aDate;
          });

          setCustomers(customersData);
          setFilteredCustomers(customersData);
          
          setCustomerCounts({
            total: customersData.length,
            filtered: customersData.length
          });
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
        }
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Enhanced filter customers based on search, payment status, date range, and services
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

    // Payment status filter - Updated with only 3 options
    if (paymentStatusFilter) {
      filtered = filtered.filter(customer => {
        const paymentSummary = getPaymentSummary(customer);
        
        if (paymentStatusFilter === 'pending') {
          // Pending: Has projects but not fully paid OR no projects
          return paymentSummary.totalProjects === 0 || paymentSummary.pendingAmount > 0;
        } else if (paymentStatusFilter === 'done') {
          // Done: Has projects and fully paid
          return paymentSummary.totalProjects > 0 && paymentSummary.pendingAmount === 0;
        } else if (paymentStatusFilter === 'exception') {
          // Exception: Has partial payments (some paid, some pending)
          return paymentSummary.totalProjects > 0 && 
                 paymentSummary.pendingAmount > 0 && 
                 paymentSummary.pendingAmount < paymentSummary.totalAmount;
        }
        
        return true;
      });
    }

    // From date filter
    if (fromDateFilter) {
      filtered = filtered.filter(customer => {
        if (!customer.createdAt) return false;
        
        let customerDate;
        if (typeof customer.createdAt === 'string') {
          customerDate = new Date(customer.createdAt);
        } else if (customer.createdAt.toDate) {
          customerDate = customer.createdAt.toDate();
        } else {
          customerDate = new Date(customer.createdAt);
        }
        
        const filterFromDate = new Date(fromDateFilter);
        return customerDate >= filterFromDate;
      });
    }

    // To date filter
    if (toDateFilter) {
      filtered = filtered.filter(customer => {
        if (!customer.createdAt) return false;
        
        let customerDate;
        if (typeof customer.createdAt === 'string') {
          customerDate = new Date(customer.createdAt);
        } else if (customer.createdAt.toDate) {
          customerDate = customer.createdAt.toDate();
        } else {
          customerDate = new Date(customer.createdAt);
        }
        
        const filterToDate = new Date(toDateFilter);
        filterToDate.setHours(23, 59, 59, 999); // End of day
        return customerDate <= filterToDate;
      });
    }

    // Services filter
    if (servicesFilter) {
      filtered = filtered.filter(customer => {
        if (!customer.lookingFor || !Array.isArray(customer.lookingFor)) return false;
        return customer.lookingFor.includes(servicesFilter);
      });
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Update filtered count
    setCustomerCounts(prev => ({
      ...prev,
      filtered: filtered.length
    }));
  }, [searchTerm, paymentStatusFilter, fromDateFilter, toDateFilter, servicesFilter, customers]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Pagination handlers
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePaymentStatusFilter = (e) => {
    setPaymentStatusFilter(e.target.value);
  };

  const handleFromDateFilter = (e) => {
    setFromDateFilter(e.target.value);
  };

  const handleToDateFilter = (e) => {
    setToDateFilter(e.target.value);
  };

  const handleServicesFilter = (e) => {
    setServicesFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('');
    setFromDateFilter('');
    setToDateFilter('');
    setServicesFilter('');
    setCurrentPage(1);
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
            <h1>Customers ({customerCounts.total})</h1>
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
          <h1>Customers ({customerCounts.total})</h1>
        </div>
        <div className="customers-actions-container">
          <NavLink to="/addcustomer" className="customers-add-btn">
            <Plus /> Add Customer
          </NavLink>
        </div>
      </div>

      <div className="customers-main-container">
        {/* Header with Counts */}
        <div className="customers-header">
          <div className="customers-header-info">
            <h1>Customer Management</h1>
            <p>Manage and track your customer database</p>
          </div>
          <div className="customers-counts-display">
            <div className="customers-count-card total">
              <div className="customers-count-number">{customerCounts.total}</div>
              <div className="customers-count-label">Total Customers</div>
            </div>
            {(searchTerm || paymentStatusFilter || fromDateFilter || toDateFilter || servicesFilter) && (
              <div className="customers-count-card filtered">
                <div className="customers-count-number">{customerCounts.filtered}</div>
                <div className="customers-count-label">Filtered Results</div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Filters */}
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
            {/* Date Range Filter Group */}
            <div className="customers-date-filter-group">
              <div className="customers-date-filter">
                <Calendar className="customers-calendar-icon" />
                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={handleFromDateFilter}
                  className="customers-date-input"
                  placeholder="From date"
                />
                <label className="customers-date-label">From</label>
              </div>

              <div className="customers-date-filter">
                <Calendar className="customers-calendar-icon" />
                <input
                  type="date"
                  value={toDateFilter}
                  onChange={handleToDateFilter}
                  className="customers-date-input"
                  placeholder="To date"
                />
                <label className="customers-date-label">To</label>
              </div>
            </div>

            {/* Updated Payment Status Filter */}
            <div className="customers-payment-status-filter">
              <select
                value={paymentStatusFilter}
                onChange={handlePaymentStatusFilter}
                className="customers-payment-status-select"
              >
                <option value="">All Payment Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="exception">⚠️ Exception</option>
                <option value="done">✅ Done</option>
              </select>
            </div>

            {/* Services Filter */}
            <div className="customers-services-filter">
              <select
                value={servicesFilter}
                onChange={handleServicesFilter}
                className="customers-services-select"
              >
                <option value="">All Services</option>
                {servicesList.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <button className="customers-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Enhanced Results Summary with Pagination Info */}
        <div className="customers-summary">
          <div className="customers-summary-info">
            <p>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, customerCounts.filtered)} of {customerCounts.filtered} customers
              {customerCounts.filtered !== customerCounts.total && (
                <span className="customers-total-info"> (filtered from {customerCounts.total} total)</span>
              )}
            </p>
            {(searchTerm || paymentStatusFilter || fromDateFilter || toDateFilter || servicesFilter) && (
              <p className="customers-filter-info">
                {customerCounts.filtered} results match your filters
              </p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="customers-page-info">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Customers Table */}
        <div className="customers-table-container">
          {currentCustomers.length > 0 ? (
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
                {currentCustomers.map((customer, index) => {
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
                {searchTerm || paymentStatusFilter || fromDateFilter || toDateFilter || servicesFilter
                  ? `No customers match your current filters. Try adjusting your search criteria.`
                  : "Start by adding your first customer to manage your client database"}
              </p>
              {customerCounts.total > 0 && (searchTerm || paymentStatusFilter || fromDateFilter || toDateFilter || servicesFilter) && (
                <button className="customers-clear-filters-btn" onClick={clearFilters}>
                  <Filter />
                  Clear All Filters to See All {customerCounts.total} Customers
                </button>
              )}
              {customerCounts.total === 0 && (
                <NavLink to="/addcustomer" className="customers-empty-add-btn">
                  <Plus /> Add New Customer
                </NavLink>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="customers-pagination">
            <div className="customers-pagination-info">
              <span>
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, customerCounts.filtered)} of {customerCounts.filtered} customers
              </span>
            </div>
            
            <div className="customers-pagination-controls">
              <button
                className="customers-page-btn customers-page-prev"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              
              <div className="customers-page-numbers">
                {getPaginationNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="customers-page-ellipsis">...</span>
                    ) : (
                      <button
                        className={`customers-page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              <button
                className="customers-page-btn customers-page-next"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                title="Next page"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Customers;