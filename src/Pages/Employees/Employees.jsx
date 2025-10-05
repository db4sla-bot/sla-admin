import React, { useEffect, useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Eye, Search, Users, Plus, Filter, ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Employees.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";

const STATUS_OPTIONS = [
  "Active", "Inactive"
];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, search, statusFilter]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Employees"));
      const employeesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort employees by name
      employeesData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
    setLoading(false);
  };

  const filterEmployees = () => {
    let filtered = employees.filter(
      (emp) =>
        (emp.name?.toLowerCase().includes(search.toLowerCase()) ||
         emp.phone?.toLowerCase().includes(search.toLowerCase()) ||
         emp.email?.toLowerCase().includes(search.toLowerCase()))
        && (statusFilter ? emp.status === statusFilter : true)
    );
    setFilteredEmployees(filtered);
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      default: return 'status-unknown';
    }
  };

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 className="employees-page-title">
              <Users className="employees-title-icon" />
              Employees
            </h1>
          </div>
        </div>
        <div className="employees-loading">
          <div className="employees-loading-spinner"></div>
          Loading employees...
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1 className="employees-page-title">
            <Users className="employees-title-icon" />
            Employees
            <span className="employees-count-badge">
              {filteredEmployees.length}
            </span>
          </h1>
        </div>
        {/* Desktop search in top bar */}
        <div className="employees-search-row desktop-only">
          <div className="employees-search-input-wrapper">
            <input
              type="text"
              className="employees-search-input"
              placeholder="🔍 Search employees by name, mobile or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="employees-search-icon">
              <Search />
            </span>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet search and filters below top bar */}
      <div className="employees-filters-section mobile-tablet-only">
        <div className="employees-search-input-wrapper">
          <input
            type="text"
            className="employees-search-input"
            placeholder="🔍 Search employees by name, mobile or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="employees-search-icon">
            <Search />
          </span>
        </div>
        
        <div className={`employees-status-filter ${showStatusDropdown ? "show" : ""}`}>
          <button
            className={`employees-filter-btn ${statusFilter ? "active" : ""}`}
            type="button"
            onClick={() => setShowStatusDropdown(s => !s)}
            aria-expanded={showStatusDropdown ? "true" : "false"}
          >
            <Filter size={16} />
            <span>{statusFilter || "All Status"}</span>
            <ChevronDown size={16} className={`filter-chevron ${showStatusDropdown ? 'rotated' : ''}`} />
          </button>
          {showStatusDropdown && (
            <ul className="employees-dropdown-menu show">
              <li
                className={statusFilter === "" ? "active" : ""}
                onClick={() => {setStatusFilter(""); setShowStatusDropdown(false)}}
              >
                All Status
              </li>
              {STATUS_OPTIONS.map((status, index) => (
                <li
                  key={index}
                  className={statusFilter === status ? "active" : ""}
                  onClick={() => {setStatusFilter(status); setShowStatusDropdown(false)}}
                >
                  {status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Desktop filters row - Single filter section */}
      <div className="employees-filters-section desktop-only">
        <div className="employees-summary-info">
          <span className="employees-total-count">
            Showing {filteredEmployees.length} of {employees.length} employees
          </span>
        </div>
      </div>

      <div className="employees-list-container">
        {filteredEmployees.length === 0 ? (
          <div className="employees-empty-state">
            <div className="employees-empty-icon">👥</div>
            <div className="employees-empty-title">
              {search || statusFilter ? "No employees found" : "No employees yet"}
            </div>
            <div className="employees-empty-text">
              {search || statusFilter
                ? "Try adjusting your search or filter criteria."
                : "Start by adding your first employee to get started."
              }
            </div>
            {!search && !statusFilter && (
              <NavLink to="/addemployee" className="employees-empty-button">
                <Plus style={{ width: "18px", height: "18px" }} />
                Add First Employee
              </NavLink>
            )}
          </div>
        ) : (
          filteredEmployees.map((employee, index) => {
            const bgColor = colors[index % colors.length];
            const firstLetter = employee.name ? employee.name.charAt(0).toUpperCase() : "?";
            
            return (
              <div key={employee.id} className="employees-list-item">
                <div className="employees-card-header">
                  <div className="employees-user-info">
                    <span className="employees-avatar" style={{ background: bgColor }}>
                      {firstLetter}
                    </span>
                    <div className="employees-basic-info">
                      <h3 className="employees-name">{employee.name || "Unnamed Employee"}</h3>
                      <p className="employees-mobile">
                        {employee.phone || "No mobile"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="employees-actions">
                    <div className={`employees-status-badge ${getStatusBadgeClass(employee.status)}`}>
                      {employee.status || 'Active'}
                    </div>
                    <NavLink to={`/employees/${employee.id}`} className="employees-view-btn">
                      <Eye className="view-icon" />
                      <span className="view-text">View</span>
                    </NavLink>
                  </div>
                </div>

                {/* Desktop table view */}
                <div className="employees-details-table-section">
                  <table className="employees-table">
                    <thead>
                      <tr>
                        <th scope="col">📧 Email</th>
                        <th scope="col">💼 Designation</th>
                        <th scope="col">🏢 Department</th>
                        <th scope="col">👤 Username</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{employee.email || "No email"}</td>
                        <td>
                          <span className="employees-designation">
                            {employee.designation || "Not specified"}
                          </span>
                        </td>
                        <td>{employee.department || "Not specified"}</td>
                        <td>
                          <strong>{employee.username || "No username"}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Mobile-friendly stacked layout */}
                <div className="employees-details-mobile">
                  <div className="employees-details-mobile-item">
                    <div className="employees-details-mobile-label">
                      📧 Email
                    </div>
                    <div className="employees-details-mobile-value">
                      {employee.email || "No email"}
                    </div>
                  </div>
                  <div className="employees-details-mobile-item">
                    <div className="employees-details-mobile-label">
                      💼 Designation
                    </div>
                    <div className="employees-details-mobile-value">
                      <span className="employees-designation">
                        {employee.designation || "Not specified"}
                      </span>
                    </div>
                  </div>
                  <div className="employees-details-mobile-item">
                    <div className="employees-details-mobile-label">
                      🏢 Department
                    </div>
                    <div className="employees-details-mobile-value">
                      {employee.department || "Not specified"}
                    </div>
                  </div>
                  <div className="employees-details-mobile-item">
                    <div className="employees-details-mobile-label">
                      👤 Username
                    </div>
                    <div className="employees-details-mobile-value">
                      <strong>{employee.username || "No username"}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};

export default Employees;