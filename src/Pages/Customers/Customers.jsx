import React, { useEffect, useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { NavLink, useNavigate } from "react-router-dom";
import { Eye, Search, Users, Plus } from "lucide-react";
import "./Customers.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
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
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  // Helper for payment status color
  const getPaymentStatusColor = (status) => {
    if (!status) return {};
    if (status.toLowerCase() === "done") {
      return { className: "payment-status-done" };
    }
    if (status.toLowerCase() === "pending") {
      return { className: "payment-status-pending" };
    }
    return {};
  };

  // Search filter
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.mobile?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
              Customers
            </h1>
          </div>
        </div>
        <div className="customers-loading">
          <div className="customers-loading-spinner"></div>
          Loading customers...
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
            fontSize: "clamp(18px, 2.5vw, 22px)", 
            fontWeight: 700, 
            color: "var(--txt-dark)", 
            display: "flex", 
            alignItems: "center", 
            gap: "clamp(8px, 1.5vw, 12px)" 
          }}>
            <Users style={{ width: "clamp(20px, 2.5vw, 24px)", height: "clamp(20px, 2.5vw, 24px)", color: "var(--blue)" }} />
            Customers
            <span style={{ 
              background: "var(--blue)", 
              color: "#fff", 
              borderRadius: "clamp(10px, 1.5vw, 12px)", 
              padding: "clamp(3px, 0.8vw, 4px) clamp(8px, 1.5vw, 12px)", 
              fontSize: "clamp(12px, 1.3vw, 14px)", 
              fontWeight: 600,
              marginLeft: "clamp(4px, 1vw, 6px)"
            }}>
              {filteredCustomers.length}
            </span>
          </h1>
        </div>
        <div className="customer-search-row d-none d-lg-flex">
          <div className="customer-search-input-wrapper">
            <input
              type="text"
              className="customer-search-input"
              placeholder="🔍 Search customers by name or mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="customer-search-icon">
              <Search />
            </span>
          </div>
        </div>
      </div>

      <div className="customer-search-row my-3 px-2 d-lg-none">
        <div className="customer-search-input-wrapper">
          <input
            type="text"
            className="customer-search-input"
            placeholder="🔍 Search customers by name or mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="customer-search-icon">
            <Search />
          </span>
        </div>
      </div>

      <div className="customer-list-container">
        {filteredCustomers.length === 0 ? (
          <div className="customers-empty-state">
            <div className="customers-empty-icon">👥</div>
            <div className="customers-empty-title">
              {search ? "No customers found" : "No customers yet"}
            </div>
            <div className="customers-empty-text">
              {search 
                ? `No customers match "${search}". Try a different search term.`
                : "Start by adding your first customer to get started."
              }
            </div>
            {!search && (
              <NavLink to="/addcustomer" className="customers-empty-button">
                <Plus style={{ width: "clamp(16px, 2vw, 18px)", height: "clamp(16px, 2vw, 18px)" }} />
                Add First Customer
              </NavLink>
            )}
          </div>
        ) : (
          filteredCustomers.map((customer, index) => {
            const bgColor = colors[index % colors.length];
            const firstLetter = customer.name ? customer.name.charAt(0).toUpperCase() : "?";
            
            return (
              <div key={customer.id} className="customer-list-item">
                <div className="customer-heading-section">
                  <div className="customer-main-details">
                    <span className="first-letter" style={{ background: bgColor }}>
                      {firstLetter}
                    </span>
                    <div className="name-mobile">
                      <p className="name">{customer.name || "Unnamed Customer"}</p>
                      <p className="mobile">{customer.mobile || "No mobile"}</p>
                    </div>
                  </div>
                  <button
                    className="view-button"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <Eye className="icon" /> 
                    <span>View Details</span>
                  </button>
                </div>
                
                {customer.payments && customer.payments.length > 0 && (
                  <div className="work-payment-status">
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">🔧 Work Project</th>
                          <th scope="col">💰 Payment Status</th>
                          <th scope="col">💳 Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.payments.map((pay, idx) => {
                          const paidTotal = pay.paid?.reduce((sum, p) => sum + p.amount, 0) || 0;
                          const pending = pay.totalAmount - paidTotal;
                          const status = pending === 0 ? "Done" : "Pending";
                          const statusStyle = getPaymentStatusColor(status);
                          
                          return (
                            <tr key={idx}>
                              <td className="border-0">
                                <strong>{typeof pay.work === 'string' ? pay.work : pay.work?.name || 'Unknown Work'}</strong>
                              </td>
                              <td className="border-0">
                                <span className={statusStyle.className}>{status}</span>
                              </td>
                              <td className="border-0">
                                <div style={{ 
                                  fontSize: "clamp(11px, 1.3vw, 13px)", 
                                  color: "var(--txt-light)" 
                                }}>
                                  <div>Total: ₹{pay.totalAmount?.toLocaleString() || 0}</div>
                                  {pending > 0 && (
                                    <div style={{ 
                                      color: "#d97706", 
                                      fontWeight: 600,
                                      marginTop: "2px"
                                    }}>
                                      Pending: ₹{pending.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {(!customer.payments || customer.payments.length === 0) && (
                  <div className="no-payment-records">
                    <div className="no-payment-icon">💼</div>
                    <div className="no-payment-text">
                      No payment records yet
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default Customers;