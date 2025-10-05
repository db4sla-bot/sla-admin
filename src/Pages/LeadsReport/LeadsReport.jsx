import React, { useState, useEffect } from 'react'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { ChevronRight, Users, Funnel, BarChart2, CheckCircle, XCircle, Calendar, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import './LeadsReport.css'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../../Firebase'

const FILTER_OPTIONS = [
  { label: 'Today', value: 'today', icon: '📅' },
  { label: 'Last Week', value: 'lastWeek', icon: '📆' },
  { label: 'This Month', value: 'thisMonth', icon: '🗓️' },
  { label: 'Last Month', value: 'lastMonth', icon: '📋' },
  { label: 'This Year', value: 'thisYear', icon: '🗂️' },
  { label: 'Last Year', value: 'lastYear', icon: '📊' },
  { label: 'All Time', value: 'allTime', icon: '🌟' }
];

const STATUS_COLORS = {
  'New': '#3454d1',
  'Follow Up': '#ffa21d', 
  'Site Visit': '#17c666',
  'Quotation': '#6610f2',
  'Customer': '#17c666',
  'Declined': '#ea4d4d'
};

const PIE_COLORS = ['#3454d1', '#ffa21d', '#17c666', '#6610f2', '#ea4d4d'];

const LeadsReport = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('thisMonth');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    convertedLeads: 0,
    pendingLeads: 0,
    conversionRate: 0
  });
  const [chartData, setChartData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    if (leads.length > 0) {
      applyFilter();
    }
  }, [leads, currentFilter]);

  useEffect(() => {
    if (filteredLeads.length > 0) {
      calculateMetrics();
      generateChartData();
      generateStatusDistribution();
    }
  }, [filteredLeads]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "Leads"));
      const leadsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      // Sort by creation date (latest first)
      leadsData.sort((a, b) => b.createdAt - a.createdAt);
      
      setLeads(leadsData);
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
    setLoading(false);
  };

  const getDateRange = (filter) => {
    const now = new Date();
    let startDate, endDate;

    switch (filter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'lastWeek':
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(now.getDate() - 7);
        startDate = new Date(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'allTime':
      default:
        return { startDate: null, endDate: null };
    }

    return { startDate, endDate };
  };

  const applyFilter = () => {
    const { startDate, endDate } = getDateRange(currentFilter);
    
    let filtered = leads;
    
    if (startDate && endDate) {
      filtered = leads.filter(lead => {
        const leadDate = lead.createdAt;
        return leadDate >= startDate && leadDate < endDate;
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.mobilenumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLeads(filtered);
  };

  const calculateMetrics = () => {
    const total = filteredLeads.length;
    const converted = filteredLeads.filter(lead => lead.status === 'Customer').length;
    const pending = filteredLeads.filter(lead => 
      lead.status && !['Customer', 'Declined'].includes(lead.status)
    ).length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    setMetrics({
      totalLeads: total,
      convertedLeads: converted,
      pendingLeads: pending,
      conversionRate
    });
  };

  const generateChartData = () => {
    if (filteredLeads.length === 0) {
      setChartData([]);
      return;
    }

    // Group leads by month for the chart
    const monthlyData = {};
    
    filteredLeads.forEach(lead => {
      const month = lead.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    const chartArray = Object.entries(monthlyData)
      .map(([month, count]) => ({ month, leads: count }))
      .slice(-6); // Last 6 months

    setChartData(chartArray);
  };

  const generateStatusDistribution = () => {
    if (filteredLeads.length === 0) {
      setStatusDistribution([]);
      return;
    }

    const statusCount = {};
    
    filteredLeads.forEach(lead => {
      const status = lead.status || 'New';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusArray = Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8'
    }));

    setStatusDistribution(statusArray);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'New': 'new',
      'Follow Up': 'followup',
      'Site Visit': 'sitevisit',
      'Quotation': 'quotation',
      'Customer': 'customer',
      'Declined': 'declined'
    };
    return statusMap[status] || 'new';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCurrentFilterLabel = () => {
    return FILTER_OPTIONS.find(option => option.value === currentFilter)?.label || 'This Month';
  };

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1>Leads Report <span className='light-color mx-2'>|</span></h1>
            <NavLink to="/" className='fw-600'>Dashboard</NavLink>
            <ChevronRight className='arrow light-color' />
            <span className='light-color fw-400'>Leads Report</span>
          </div>
        </div>
        <div className="leads-report-main-container">
          <div className="leads-loading-container">
            <div className="leads-loading-spinner"></div>
            Loading leads data...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-bar-container">
        <Hamburger />
        <div className="breadcrumps-container">
          <h1>Leads Report <span className='light-color mx-2'>|</span></h1>
          <NavLink to="/" className='fw-600'>Dashboard</NavLink>
          <ChevronRight className='arrow light-color' />
          <span className='light-color fw-400'>Leads Report</span>
        </div>
      </div>

      <div className="leads-report-main-container">
        {/* Header with Filters */}
        <div className="leads-report-header">
          <h1 className="leads-report-title">Leads Analytics</h1>
          <div className="leads-report-filters">
            <div className="leads-filter-dropdown">
              <button
                className={`leads-filter-button ${showFilterDropdown ? 'open' : ''}`}
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter size={16} />
                {getCurrentFilterLabel()}
                <span style={{ transform: showFilterDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>▼</span>
              </button>
              <div className={`leads-filter-dropdown-menu ${showFilterDropdown ? 'show' : ''}`}>
                {FILTER_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    className={`leads-filter-option ${currentFilter === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="leads-summary-metrics">
          <div className="leads-metric-card">
            <div className="leads-metric-header">
              <div className="leads-metric-icon">
                <Users size={20} />
              </div>
              <div className="leads-metric-change neutral">
                <Calendar size={12} />
                {getCurrentFilterLabel()}
              </div>
            </div>
            <div className="leads-metric-title">Total Leads</div>
            <div className="leads-metric-value">{metrics.totalLeads}</div>
            <div className="leads-metric-subtitle">Leads generated in selected period</div>
          </div>

          <div className="leads-metric-card">
            <div className="leads-metric-header">
              <div className="leads-metric-icon">
                <CheckCircle size={20} />
              </div>
              <div className="leads-metric-change positive">
                <TrendingUp size={12} />
                {metrics.conversionRate}%
              </div>
            </div>
            <div className="leads-metric-title">Converted Leads</div>
            <div className="leads-metric-value">{metrics.convertedLeads}</div>
            <div className="leads-metric-subtitle">Successfully converted to customers</div>
          </div>

          <div className="leads-metric-card">
            <div className="leads-metric-header">
              <div className="leads-metric-icon">
                <XCircle size={20} />
              </div>
              <div className="leads-metric-change neutral">
                <BarChart2 size={12} />
                Active
              </div>
            </div>
            <div className="leads-metric-title">Pending Leads</div>
            <div className="leads-metric-value">{metrics.pendingLeads}</div>
            <div className="leads-metric-subtitle">Leads in progress</div>
          </div>

          <div className="leads-metric-card">
            <div className="leads-metric-header">
              <div className="leads-metric-icon">
                <TrendingUp size={20} />
              </div>
              <div className={`leads-metric-change ${metrics.conversionRate >= 20 ? 'positive' : metrics.conversionRate >= 10 ? 'neutral' : 'negative'}`}>
                {metrics.conversionRate >= 20 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                Rate
              </div>
            </div>
            <div className="leads-metric-title">Conversion Rate</div>
            <div className="leads-metric-value">{metrics.conversionRate}%</div>
            <div className="leads-metric-subtitle">Percentage of converted leads</div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="leads-analytics-section">
          <div className="leads-chart-container">
            <div className="leads-chart-header">
              <h3 className="leads-chart-title">Leads Trend</h3>
            </div>
            {filteredLeads.length === 0 ? (
              <div className="leads-empty-state">
                <div className="leads-empty-icon">📈</div>
                <div className="leads-empty-title">No Data for Chart</div>
                <div className="leads-empty-text">No leads found for the selected filter period</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="leads" fill="url(#leadGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#1e40af" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="leads-status-distribution">
            <h3 className="leads-status-title">Status Distribution</h3>
            {filteredLeads.length === 0 ? (
              <div className="leads-empty-state">
                <div className="leads-empty-icon">🎯</div>
                <div className="leads-empty-title">No Status Data</div>
                <div className="leads-empty-text">No leads found for the selected filter period</div>
              </div>
            ) : (
              <>
                <div className="leads-status-list">
                  {statusDistribution.map((status, index) => (
                    <div key={status.name} className="leads-status-item">
                      <div className="leads-status-info">
                        <div 
                          className="leads-status-dot" 
                          style={{ backgroundColor: status.color }}
                        ></div>
                        <div className="leads-status-label">{status.name}</div>
                      </div>
                      <div className="leads-status-count">{status.value}</div>
                    </div>
                  ))}
                </div>
                {statusDistribution.length > 0 && (
                  <ResponsiveContainer width="100%" height={200} style={{ marginTop: '20px' }}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({value}) => value}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detailed Table */}
        <div className="leads-detailed-table">
          <div className="leads-table-header">
            <h3 className="leads-table-title">Detailed Leads Data</h3>
            <div className="leads-table-search">
              <input
                type="text"
                className="leads-table-search-input"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  // Re-apply filter with search
                  setTimeout(() => applyFilter(), 100);
                }}
              />
              <Search size={16} className="leads-table-search-icon" />
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="leads-empty-state">
              <div className="leads-empty-icon">📊</div>
              <div className="leads-empty-title">No Leads Found</div>
              <div className="leads-empty-text">
                {searchTerm 
                  ? `No leads match "${searchTerm}" in the ${getCurrentFilterLabel().toLowerCase()} period.` 
                  : `No leads found for the ${getCurrentFilterLabel().toLowerCase()} period.`
                }
              </div>
              {currentFilter !== 'allTime' && (
                <button 
                  className="leads-filter-reset-btn"
                  onClick={() => {
                    setCurrentFilter('allTime');
                    setSearchTerm('');
                  }}
                  style={{
                    marginTop: '16px',
                    background: 'var(--blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Show All Leads
                </button>
              )}
            </div>
          ) : (
            <table className="leads-data-table">
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, index) => (
                  <tr key={lead.id}>
                    <td>#{String(index + 1).padStart(3, '0')}</td>
                    <td>{lead.name || 'N/A'}</td>
                    <td>{lead.email || 'N/A'}</td>
                    <td>{lead.mobilenumber || 'N/A'}</td>
                    <td>{lead.requiredService || 'N/A'}</td>
                    <td>
                      <span className={`leads-table-status-badge ${getStatusClass(lead.status)}`}>
                        {lead.status || 'New'}
                      </span>
                    </td>
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>{lead.source || 'Direct'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

export default LeadsReport