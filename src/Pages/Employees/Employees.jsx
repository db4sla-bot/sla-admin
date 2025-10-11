import React, { useEffect, useState } from "react";
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Eye, Search, Users, Plus, Filter } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Employees.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../Firebase";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
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

  const statusOptions = ['Active', 'Inactive'];

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, employees]);

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
      setFilteredEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(employee => 
        (employee.status || 'Active') === statusFilter
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const getStatusClass = (status) => {
    switch ((status || 'Active').toLowerCase()) {
      case 'active': return 'active';
      case 'inactive': return 'inactive';
      default: return 'active';
    }
  };

  if (loading) {
    return (
      <>
        <div className="employees-top-bar-container">
          <Hamburger />
          <div className="employees-breadcrumps-container">
            <h1>Employees</h1>
          </div>
        </div>
        <div className="employees-loading">
          <div className="employees-loader"></div>
          <p>Loading employees...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <div className="employees-top-bar-container">
        <Hamburger />
        <div className="employees-breadcrumps-container">
          <h1>Employees</h1>
        </div>
        <div className="employees-actions-container">
          <NavLink to="/addemployee" className="employees-add-btn">
            <Plus /> Add Employee
          </NavLink>
        </div>
      </div>

      <div className="employees-main-container">
        {/* Header */}
        <div className="employees-header">
          <h1>Employee Management</h1>
          <p>Manage and track your team members</p>
        </div>

        {/* Filters */}
        <div className="employees-filters">
          <div className="employees-search-container">
            <Search className="employees-search-icon" />
            <input
              type="text"
              placeholder="Search by name, phone, email, department, designation..."
              value={searchTerm}
              onChange={handleSearch}
              className="employees-search-input"
            />
          </div>

          <div className="employees-filter-row">
            <div className="employees-status-filter">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="employees-status-select"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <button className="employees-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="employees-summary">
          <p>
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
          {(searchTerm || statusFilter) && (
            <p className="employees-filter-info">Filters applied</p>
          )}
        </div>

        {/* Employees Table */}
        <div className="employees-table-container">
          {filteredEmployees.length > 0 ? (
            <table className="employees-table">
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>Contact</th>
                  <th>Department</th>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => {
                  const bgColor = colors[index % colors.length];
                  const firstLetter = employee.name ? employee.name.charAt(0).toUpperCase() : "?";
                  
                  return (
                    <tr key={employee.id} className="employees-table-row">
                      <td className="employees-info-cell">
                        <div className="employees-info">
                          <div 
                            className="employees-avatar"
                            style={{ background: bgColor }}
                          >
                            {firstLetter}
                          </div>
                          <div className="employees-details">
                            <span className="employees-name">
                              {employee.name || 'Unnamed Employee'}
                            </span>
                            <span className="employees-id">
                              ID: {employee.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="employees-contact">
                        <div className="employees-contact-info">
                          <span className="employees-phone">
                            {employee.phone || 'No phone'}
                          </span>
                          <span className="employees-email">
                            {employee.email || 'No email'}
                          </span>
                        </div>
                      </td>
                      <td className="employees-department">
                        <div className="employees-department-info">
                          <span className="employees-department">
                            {employee.department || 'Not specified'}
                          </span>
                          {employee.designation && (
                            <span className="employees-designation">
                              {employee.designation}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="employees-username-cell">
                        <span className="employees-username">
                          {employee.username || 'No username'}
                        </span>
                      </td>
                      <td className="employees-status">
                        <span className={`employees-status-badge ${getStatusClass(employee.status)}`}>
                          {employee.status || 'Active'}
                        </span>
                      </td>
                      <td className="employees-actions">
                        <div className="employees-action-buttons">
                          <button
                            className="employees-view-btn"
                            onClick={() => navigate(`/employees/${employee.id}`)}
                            title="View Employee Details"
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
            <div className="employees-empty">
              <div className="employees-empty-icon">👥</div>
              <h3>No employees found</h3>
              <p>
                {searchTerm || statusFilter
                  ? "Try adjusting your search criteria or filters"
                  : "Start by adding your first employee to manage your team"}
              </p>
              {!searchTerm && !statusFilter && (
                <NavLink to="/addemployee" className="employees-empty-add-btn">
                  <Plus /> Add New Employee
                </NavLink>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Employees;