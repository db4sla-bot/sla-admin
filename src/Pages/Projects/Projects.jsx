import React, { useState, useEffect } from 'react';
import './Projects.css';
import Hamburger from "../../Components/Hamburger/Hamburger";
import { Search, Filter, Calendar, Eye, X, User, Phone, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../Firebase';
import { toast } from 'react-toastify';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Project counts
  const [projectCounts, setProjectCounts] = useState({
    total: 0,
    filtered: 0
  });

  // Services list for filter
  const servicesList = [
    "Invisible Grills",
    "Mosquito Mesh", 
    "Cloth Hangers",
    "Artificial Grass",
    "Bird Spikes"
  ];

  // Fetch projects from Firebase
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        // Fetch projects with latest first ordering
        const projectsQuery = query(
          collection(db, "Projects"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(projectsQuery);
        
        const projectsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setProjects(projectsData);
        setFilteredProjects(projectsData);
        
        // Update counts
        setProjectCounts({
          total: projectsData.length,
          filtered: projectsData.length
        });
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast.error("Failed to load projects");
        
        // If orderBy fails, fetch without ordering and sort manually
        try {
          const querySnapshot = await getDocs(collection(db, "Projects"));
          const projectsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Sort manually by createdAt (latest first)
          projectsData.sort((a, b) => {
            const aDate = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
            const bDate = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
            return bDate - aDate;
          });

          setProjects(projectsData);
          setFilteredProjects(projectsData);
          
          setProjectCounts({
            total: projectsData.length,
            filtered: projectsData.length
          });
        } catch (fallbackError) {
          console.error("Fallback fetch also failed:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on search, date filters, and service filter
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(project =>
        project.projectId?.toLowerCase().includes(searchLower) ||
        project.customerName?.toLowerCase().includes(searchLower) ||
        project.customerMobile?.includes(searchTerm) ||
        project.service?.toLowerCase().includes(searchLower)
      );
    }

    // Service filter
    if (serviceFilter) {
      filtered = filtered.filter(project => 
        project.service === serviceFilter
      );
    }

    // From date filter
    if (fromDateFilter) {
      filtered = filtered.filter(project => {
        if (!project.createdAt) return false;
        
        let projectDate;
        if (project.createdAt.toDate) {
          projectDate = project.createdAt.toDate();
        } else {
          projectDate = new Date(project.createdAt);
        }
        
        const filterFromDate = new Date(fromDateFilter);
        return projectDate >= filterFromDate;
      });
    }

    // To date filter
    if (toDateFilter) {
      filtered = filtered.filter(project => {
        if (!project.createdAt) return false;
        
        let projectDate;
        if (project.createdAt.toDate) {
          projectDate = project.createdAt.toDate();
        } else {
          projectDate = new Date(project.createdAt);
        }
        
        const filterToDate = new Date(toDateFilter);
        filterToDate.setHours(23, 59, 59, 999); // End of day
        return projectDate <= filterToDate;
      });
    }

    setFilteredProjects(filtered);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Update filtered count
    setProjectCounts(prev => ({
      ...prev,
      filtered: filtered.length
    }));
  }, [searchTerm, fromDateFilter, toDateFilter, serviceFilter, projects]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

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

  const handleFromDateFilter = (e) => {
    setFromDateFilter(e.target.value);
  };

  const handleToDateFilter = (e) => {
    setToDateFilter(e.target.value);
  };

  const handleServiceFilter = (e) => {
    setServiceFilter(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFromDateFilter('');
    setToDateFilter('');
    setServiceFilter('');
    setCurrentPage(1);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setSelectedProject(null);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }
    
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'completed':
        return '#3b82f6';
      case 'on-hold':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <>
        <div className="projects-top-bar-container">
          <Hamburger />
          <div className="projects-breadcrumps-container">
            <h1>Projects ({projectCounts.total})</h1>
          </div>
        </div>
        <div className="projects-loading">
          <div className="projects-loader"></div>
          <p>Loading projects...</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <div className="projects-top-bar-container">
        <Hamburger />
        <div className="projects-breadcrumps-container">
          <h1>Projects ({projectCounts.total})</h1>
        </div>
      </div>

      <div className="projects-main-container">
        {/* Header with Counts */}
        <div className="projects-header">
          <div className="projects-header-info">
            <h1>Project Management</h1>
            <p>Track and manage all your customer projects</p>
          </div>
          <div className="projects-counts-display">
            <div className="projects-count-card total">
              <div className="projects-count-number">{projectCounts.total}</div>
              <div className="projects-count-label">Total Projects</div>
            </div>
            {(searchTerm || fromDateFilter || toDateFilter || serviceFilter) && (
              <div className="projects-count-card filtered">
                <div className="projects-count-number">{projectCounts.filtered}</div>
                <div className="projects-count-label">Filtered Results</div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="projects-filters">
          <div className="projects-search-container">
            <Search className="projects-search-icon" />
            <input
              type="text"
              placeholder="Search by project ID, customer name, mobile, or service..."
              value={searchTerm}
              onChange={handleSearch}
              className="projects-search-input"
            />
          </div>

          <div className="projects-filter-row">
            {/* Date Range Filter Group */}
            <div className="projects-date-filter-group">
              <div className="projects-date-filter">
                <Calendar className="projects-calendar-icon" />
                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={handleFromDateFilter}
                  className="projects-date-input"
                  placeholder="From date"
                />
                <label className="projects-date-label">From</label>
              </div>

              <div className="projects-date-filter">
                <Calendar className="projects-calendar-icon" />
                <input
                  type="date"
                  value={toDateFilter}
                  onChange={handleToDateFilter}
                  className="projects-date-input"
                  placeholder="To date"
                />
                <label className="projects-date-label">To</label>
              </div>
            </div>

            {/* Service Filter */}
            <div className="projects-service-filter">
              <select
                value={serviceFilter}
                onChange={handleServiceFilter}
                className="projects-service-select"
              >
                <option value="">All Services</option>
                {servicesList.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <button className="projects-clear-filters" onClick={clearFilters}>
              <Filter />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Enhanced Results Summary with Pagination Info */}
        <div className="projects-summary">
          <div className="projects-summary-info">
            <p>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, projectCounts.filtered)} of {projectCounts.filtered} projects
              {projectCounts.filtered !== projectCounts.total && (
                <span className="projects-total-info"> (filtered from {projectCounts.total} total)</span>
              )}
            </p>
            {(searchTerm || fromDateFilter || toDateFilter || serviceFilter) && (
              <p className="projects-filter-info">
                {projectCounts.filtered} results match your filters
              </p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="projects-page-info">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Projects Grid */}
        <div className="projects-grid-container">
          {currentProjects.length > 0 ? (
            <div className="projects-grid">
              {currentProjects.map((project) => (
                <div key={project.id} className="projects-card">
                  <div className="projects-card-header">
                    <div className="projects-project-id">
                      <Briefcase size={20} />
                      {project.projectId}
                    </div>
                    <div 
                      className="projects-status-badge"
                      style={{ 
                        backgroundColor: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status),
                        border: `1px solid ${getStatusColor(project.status)}40`
                      }}
                    >
                      {project.status || 'Active'}
                    </div>
                  </div>

                  <div className="projects-card-body">
                    <div className="projects-customer-info">
                      <div className="projects-customer-name">
                        <User size={16} />
                        {project.customerName || 'Unknown Customer'}
                      </div>
                      <div className="projects-customer-mobile">
                        <Phone size={16} />
                        {project.customerMobile || 'No mobile'}
                      </div>
                    </div>

                    <div className="projects-service-info">
                      <div className="projects-service">
                        <span className="projects-service-label">Service:</span>
                        <span className="projects-service-value">{project.service}</span>
                      </div>
                    </div>

                    <div className="projects-address-info">
                      <MapPin size={16} />
                      <span className="projects-address">
                        {project.customerAddress ? (
                          project.customerAddress.length > 50 
                            ? `${project.customerAddress.substring(0, 50)}...`
                            : project.customerAddress
                        ) : 'No address provided'}
                      </span>
                    </div>

                    <div className="projects-date-info">
                      <Clock size={16} />
                      <span>Created: {formatDate(project.createdAt)}</span>
                    </div>
                  </div>

                  <div className="projects-card-footer">
                    <button
                      className="projects-view-btn"
                      onClick={() => handleViewProject(project)}
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="projects-empty">
              <div className="projects-empty-icon">📋</div>
              <h3>No projects found</h3>
              <p>
                {searchTerm || fromDateFilter || toDateFilter || serviceFilter
                  ? "No projects match your current filters. Try adjusting your search criteria."
                  : "Projects will appear here when customers have work added to their profiles."}
              </p>
              {projectCounts.total > 0 && (searchTerm || fromDateFilter || toDateFilter || serviceFilter) && (
                <button className="projects-clear-filters-btn" onClick={clearFilters}>
                  <Filter />
                  Clear All Filters to See All {projectCounts.total} Projects
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="projects-pagination">
            <div className="projects-pagination-info">
              <span>
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, projectCounts.filtered)} of {projectCounts.filtered} projects
              </span>
            </div>
            
            <div className="projects-pagination-controls">
              <button
                className="projects-page-btn projects-page-prev"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              
              <div className="projects-page-numbers">
                {getPaginationNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="projects-page-ellipsis">...</span>
                    ) : (
                      <button
                        className={`projects-page-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>
              
              <button
                className="projects-page-btn projects-page-next"
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

      {/* Project Details Modal */}
      {showProjectModal && selectedProject && (
        <div className="projects-modal">
          <div className="projects-modal-overlay" onClick={closeProjectModal}></div>
          <div className="projects-modal-content">
            <div className="projects-modal-header">
              <h2>Project Details</h2>
              <button 
                className="projects-modal-close"
                onClick={closeProjectModal}
              >
                <X />
              </button>
            </div>
            
            <div className="projects-modal-body">
              <div className="projects-detail-section">
                <h3>Project Information</h3>
                <div className="projects-detail-grid">
                  <div className="projects-detail-item">
                    <label>Project ID:</label>
                    <span>{selectedProject.projectId}</span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Status:</label>
                    <span 
                      className="projects-status-badge"
                      style={{ 
                        backgroundColor: `${getStatusColor(selectedProject.status)}20`,
                        color: getStatusColor(selectedProject.status),
                        border: `1px solid ${getStatusColor(selectedProject.status)}40`
                      }}
                    >
                      {selectedProject.status || 'Active'}
                    </span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Service:</label>
                    <span>{selectedProject.service}</span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Created Date:</label>
                    <span>{formatDate(selectedProject.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="projects-detail-section">
                <h3>Customer Information</h3>
                <div className="projects-detail-grid">
                  <div className="projects-detail-item">
                    <label>Name:</label>
                    <span>{selectedProject.customerName}</span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Mobile:</label>
                    <span>{selectedProject.customerMobile}</span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Email:</label>
                    <span>{selectedProject.customerEmail || 'Not provided'}</span>
                  </div>
                  <div className="projects-detail-item full-width">
                    <label>Address:</label>
                    <span>{selectedProject.customerAddress || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div className="projects-detail-section">
                <h3>Work Description</h3>
                <div className="projects-work-description">
                  {selectedProject.workDescription || 'No description provided'}
                </div>
              </div>

              <div className="projects-detail-section">
                <h3>Project Timeline</h3>
                <div className="projects-detail-grid">
                  <div className="projects-detail-item">
                    <label>Created By:</label>
                    <span>{selectedProject.createdBy}</span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Created Date:</label>
                    <span>{selectedProject.createdDate}</span>
                  </div>
                  <div className="projects-detail-item">
                    <label>Created Time:</label>
                    <span>{selectedProject.createdTime}</span>
                  </div>
                </div>
              </div>

              {/* Placeholder for future content */}
              <div className="projects-detail-section">
                <h3>Additional Details</h3>
                <div className="projects-placeholder">
                  <p>Additional project details and management features will be added here.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Projects;
