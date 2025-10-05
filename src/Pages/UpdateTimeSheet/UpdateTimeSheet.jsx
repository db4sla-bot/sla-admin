import React, { useState, useEffect } from 'react'
import './UpdateTimeSheet.css'
import Hamburger from '../../Components/Hamburger/Hamburger'
import { ClipboardClock, Funnel, Save, Calendar, Clock, Filter, Search, Eye, User, ChevronDown } from 'lucide-react'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "../../Firebase";
import { useAppContext } from '../../Context';

const UpdateTimeSheet = () => {
  const { userDetails, user } = useAppContext();
  const today = new Date();

  // Use context data instead of hardcoded values
  const currentUser = userDetails?.name || user?.email?.split('@')[0] || 'Unknown User';
  const currentUserId = userDetails?.username || user?.email || 'unknown_user';

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userDetails?.name) {
      return userDetails.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const [startDate, setStartDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today.toDateString());
  const [formattedSelectedDate, setFormattedSelectedDate] = useState(
    `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
  );
  
  // Form states
  const [workingHours, setWorkingHours] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // View mode states
  const [existingTimesheet, setExistingTimesheet] = useState(null);
  const [isEditable, setIsEditable] = useState(true);
  
  // Filter states
  const [activeView, setActiveView] = useState('daily');
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  
  // Statistics
  const [monthlyStats, setMonthlyStats] = useState({
    totalDays: 0,
    totalHours: 0,
    totalOT: 0,
    averageHours: 0
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 4 }, (_, i) => today.getFullYear() - i);

  useEffect(() => {
    if (activeView === 'daily') {
      fetchTimesheetForDate(selectedDate);
    } else {
      fetchMonthlyTimesheet(selectedMonth, selectedYear);
    }
  }, [selectedDate, activeView, selectedMonth, selectedYear]);

  const fetchTimesheetForDate = async (date) => {
    setLoading(true);
    try {
      const dateString = new Date(date).toDateString();
      const q = query(
        collection(db, "Timesheet"),
        where("userId", "==", currentUserId),
        where("date", "==", dateString)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setExistingTimesheet({ id: querySnapshot.docs[0].id, ...data });
        setWorkingHours(data.workingHours || '');
        setOvertimeHours(data.overtimeHours || '');
        setDescription(data.description || '');
        
        // Check if date is today (editable) or past (read-only)
        const isToday = new Date(date).toDateString() === today.toDateString();
        setIsEditable(isToday);
      } else {
        setExistingTimesheet(null);
        setWorkingHours('');
        setOvertimeHours('');
        setDescription('');
        setIsEditable(new Date(date).toDateString() === today.toDateString());
      }
    } catch (error) {
      console.error("Error fetching timesheet:", error);
      toast.error("Failed to fetch timesheet data");
    }
    setLoading(false);
  };

  const fetchMonthlyTimesheet = async (month, year) => {
    setLoading(true);
    try {
      // Create date range for the selected month
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      
      console.log('Fetching monthly data for:', {
        month: months[month],
        year,
        startOfMonth,
        endOfMonth,
        userId: currentUserId
      });

      // First, try to get all timesheet data for the user
      const q = query(
        collection(db, "Timesheet"),
        where("userId", "==", currentUserId)
      );
      
      const querySnapshot = await getDocs(q);
      const allData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('All timesheet data:', allData);

      // Filter data by month and year on the client side
      const filteredData = allData.filter(entry => {
        if (!entry.date) return false;
        
        const entryDate = new Date(entry.date);
        const entryMonth = entryDate.getMonth();
        const entryYear = entryDate.getFullYear();
        
        return entryMonth === month && entryYear === year;
      });

      console.log('Filtered monthly data:', filteredData);

      // Sort by date (newest first)
      filteredData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
      
      setMonthlyData(filteredData);
      
      // Calculate statistics
      const totalDays = filteredData.length;
      const totalHours = filteredData.reduce((sum, entry) => sum + (parseFloat(entry.workingHours) || 0), 0);
      const totalOT = filteredData.reduce((sum, entry) => sum + (parseFloat(entry.overtimeHours) || 0), 0);
      const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
      
      setMonthlyStats({
        totalDays,
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalOT: parseFloat(totalOT.toFixed(2)),
        averageHours: parseFloat(averageHours.toFixed(2))
      });

      console.log('Monthly stats:', {
        totalDays,
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalOT: parseFloat(totalOT.toFixed(2)),
        averageHours: parseFloat(averageHours.toFixed(2))
      });
      
    } catch (error) {
      console.error("Error fetching monthly timesheet:", error);
      toast.error(`Failed to fetch monthly data: ${error.message}`);
      
      // Set empty data on error
      setMonthlyData([]);
      setMonthlyStats({
        totalDays: 0,
        totalHours: 0,
        totalOT: 0,
        averageHours: 0
      });
    }
    setLoading(false);
  };

  const handleDateChange = (date) => {
    setStartDate(date);
    setSelectedDate(date.toDateString());
    
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    setFormattedSelectedDate(formattedDate);
  };

  const handleSaveTimesheet = async () => {
    if (!workingHours.trim()) {
      toast.error("Working hours is required!");
      return;
    }

    if (isNaN(workingHours) || parseFloat(workingHours) < 0 || parseFloat(workingHours) > 24) {
      toast.error("Please enter valid working hours (0-24)");
      return;
    }

    if (overtimeHours && (isNaN(overtimeHours) || parseFloat(overtimeHours) < 0)) {
      toast.error("Please enter valid overtime hours");
      return;
    }

    setSaving(true);
    try {
      const selectedDateObj = new Date(selectedDate);
      const timesheetData = {
        userId: currentUserId,
        userName: currentUser,
        date: selectedDate,
        workingHours: parseFloat(workingHours),
        overtimeHours: parseFloat(overtimeHours) || 0,
        description: description.trim(),
        timestamp: selectedDateObj.getTime(),
        createdAt: existingTimesheet ? existingTimesheet.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingTimesheet) {
        // Update existing timesheet
        await updateDoc(doc(db, "Timesheet", existingTimesheet.id), timesheetData);
        toast.success("Timesheet updated successfully!");
      } else {
        // Create new timesheet
        await addDoc(collection(db, "Timesheet"), timesheetData);
        toast.success("Timesheet saved successfully!");
      }

      // Refresh data
      await fetchTimesheetForDate(selectedDate);
      
      // If we're in monthly view, refresh monthly data too
      if (activeView === 'monthly') {
        await fetchMonthlyTimesheet(selectedMonth, selectedYear);
      }
      
    } catch (error) {
      console.error("Error saving timesheet:", error);
      toast.error(`Failed to save timesheet: ${error.message}`);
    }
    setSaving(false);
  };

  const updateEmployeeTimesheetStats = async (userId) => {
    try {
      // This would update the employee's total stats
      // You might want to calculate total hours, days worked, etc.
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const q = query(
        collection(db, "Timesheet"),
        where("userId", "==", userId),
        where("timestamp", ">=", new Date(currentYear, currentMonth, 1).getTime()),
        where("timestamp", "<=", new Date(currentYear, currentMonth + 1, 0).getTime())
      );
      
      const querySnapshot = await getDocs(q);
      const monthlyEntries = querySnapshot.docs.map(doc => doc.data());
      
      const monthlyTotalHours = monthlyEntries.reduce((sum, entry) => sum + (entry.workingHours || 0), 0);
      const monthlyTotalOT = monthlyEntries.reduce((sum, entry) => sum + (entry.overtimeHours || 0), 0);
      
      // Update employee document with current month stats
      // This is optional - you can implement based on your needs
      
    } catch (error) {
      console.error("Error updating employee stats:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isToday = new Date(selectedDate).toDateString() === today.toDateString();
  const isPast = new Date(selectedDate) < today;

  if (loading && activeView === 'daily') {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
              Update Timesheet
            </h1>
          </div>
        </div>
        <div className="timesheet-loading">
          <div className="timesheet-loading-spinner"></div>
          Loading timesheet...
        </div>
      </>
    );
  }

  // Add error boundary for monthly view
  const renderMonthlyView = () => {
    try {
      return (
        <div className="timesheet-monthly-content">
          <div className="timesheet-monthly-header">
            <h2 className="timesheet-monthly-title">
              {months[selectedMonth]} {selectedYear} - Timesheet Report
            </h2>
            <div className="timesheet-monthly-user">
              <User size={20} />
              {currentUser}
            </div>
          </div>

          {/* Monthly Statistics */}
          <div className="timesheet-stats-grid">
            <div className="timesheet-stat-card">
              <div className="timesheet-stat-icon working-days">
                <Calendar size={24} />
              </div>
              <div className="timesheet-stat-content">
                <div className="timesheet-stat-value">{monthlyStats.totalDays}</div>
                <div className="timesheet-stat-label">Working Days</div>
              </div>
            </div>

            <div className="timesheet-stat-card">
              <div className="timesheet-stat-icon total-hours">
                <Clock size={24} />
              </div>
              <div className="timesheet-stat-content">
                <div className="timesheet-stat-value">{monthlyStats.totalHours}h</div>
                <div className="timesheet-stat-label">Total Hours</div>
              </div>
            </div>

            <div className="timesheet-stat-card">
              <div className="timesheet-stat-icon overtime">
                <ClipboardClock size={24} />
              </div>
              <div className="timesheet-stat-content">
                <div className="timesheet-stat-value">{monthlyStats.totalOT}h</div>
                <div className="timesheet-stat-label">Overtime</div>
              </div>
            </div>

            <div className="timesheet-stat-card">
              <div className="timesheet-stat-icon average">
                <Clock size={24} />
              </div>
              <div className="timesheet-stat-content">
                <div className="timesheet-stat-value">{monthlyStats.averageHours}h</div>
                <div className="timesheet-stat-label">Avg/Day</div>
              </div>
            </div>
          </div>

          {/* Monthly Data Table */}
          {loading ? (
            <div className="timesheet-loading">
              <div className="timesheet-loading-spinner"></div>
              Loading monthly data...
            </div>
          ) : monthlyData.length === 0 ? (
            <div className="timesheet-empty-state">
              <div className="timesheet-empty-icon">📅</div>
              <div className="timesheet-empty-title">No timesheet data found</div>
              <div className="timesheet-empty-text">
                No timesheet entries found for {months[selectedMonth]} {selectedYear}.
              </div>
            </div>
          ) : (
            <div className="timesheet-monthly-table">
              <div className="timesheet-table-header">
                <h3 className="timesheet-table-title">Daily Entries</h3>
                <div className="timesheet-table-count">
                  {monthlyData.length} {monthlyData.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              
              <div className="timesheet-table-container">
                <table className="timesheet-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Working Hours</th>
                      <th>Overtime</th>
                      <th>Total Hours</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((entry) => (
                      <tr key={entry.id}>
                        <td className="timesheet-table-date">
                          {formatDate(entry.date)}
                        </td>
                        <td className="timesheet-table-hours">
                          {entry.workingHours || 0}h
                        </td>
                        <td className="timesheet-table-overtime">
                          {entry.overtimeHours || 0}h
                        </td>
                        <td className="timesheet-table-total">
                          <strong>{((entry.workingHours || 0) + (entry.overtimeHours || 0))}h</strong>
                        </td>
                        <td className="timesheet-table-description">
                          {entry.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering monthly view:", error);
      return (
        <div className="timesheet-error-state">
          <div className="timesheet-error-icon">⚠️</div>
          <div className="timesheet-error-title">Error loading monthly report</div>
          <div className="timesheet-error-text">
            {error.message || "An unexpected error occurred while loading the monthly report."}
          </div>
          <button 
            className="timesheet-retry-btn"
            onClick={() => {
              setActiveView('daily');
              setTimeout(() => setActiveView('monthly'), 100);
            }}
          >
            Retry
          </button>
        </div>
      );
    }
  };

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
            <ClipboardClock style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
            Update Timesheet
          </h1>
        </div>
        <div className="timesheet-header-actions">
          <button 
            className="timesheet-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      <div className="timesheet-main-container">
        {/* Enhanced Tab Navigation */}
        <div className="timesheet-tabs-navigation">
          <button 
            className={`timesheet-tab-button ${activeView === 'daily' ? 'timesheet-tab-active' : ''}`}
            onClick={() => setActiveView('daily')}
          >
            <Calendar size={18} />
            Daily View
          </button>
          <button 
            className={`timesheet-tab-button ${activeView === 'monthly' ? 'timesheet-tab-active' : ''}`}
            onClick={() => setActiveView('monthly')}
          >
            <ClipboardClock size={18} />
            Monthly Report
          </button>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="timesheet-filters-section">
            <div className="timesheet-filters-content">
              <div className="timesheet-filter-group">
                <label className="timesheet-filter-label">Month</label>
                <select
                  className="timesheet-filter-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="timesheet-filter-group">
                <label className="timesheet-filter-label">Year</label>
                <select
                  className="timesheet-filter-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Daily View */}
        {activeView === 'daily' && (
          <div className="timesheet-daily-content">
            <div className="timesheet-calendar-section">
              <div className="timesheet-calendar-header">
                <h3 className="timesheet-calendar-title">Select Date</h3>
                <div className="timesheet-date-info">
                  {isToday && <span className="timesheet-today-badge">Today</span>}
                  {isPast && !isToday && <span className="timesheet-past-badge">Past Date</span>}
                </div>
              </div>
              <div className="timesheet-calendar-container">
                <DatePicker
                  selected={startDate}
                  onChange={handleDateChange}
                  inline
                  maxDate={new Date()}
                  dayClassName={(date) => {
                    const isSelectedDate = date.toDateString() === selectedDate;
                    const isTodayDate = date.toDateString() === today.toDateString();
                    
                    if (isSelectedDate) return 'selected-date';
                    if (isTodayDate) return 'today-date';
                    return '';
                  }}
                />
              </div>
            </div>

            <div className="timesheet-form-section">
              <div className="timesheet-form-header">
                <div className="timesheet-user-info">
                  <div className="timesheet-user-avatar">
                    {getUserInitials()}
                  </div>
                  <div className="timesheet-user-details">
                    <h3 className="timesheet-user-name">{currentUser}</h3>
                    <p className="timesheet-selected-date">{formatDate(selectedDate)}</p>
                  </div>
                </div>
                {existingTimesheet && (
                  <div className="timesheet-status-badge">
                    <Eye size={16} />
                    {isEditable ? 'Editable' : 'View Only'}
                  </div>
                )}
              </div>

              <div className="timesheet-form-fields">
                <div className="timesheet-field-group">
                  <label className="timesheet-field-label">
                    <Clock size={16} />
                    Working Hours *
                  </label>
                  <input
                    type="number"
                    className="timesheet-field-input"
                    placeholder="Enter working hours (0-24)"
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    disabled={!isEditable}
                    min="0"
                    max="24"
                    step="0.5"
                  />
                </div>

                <div className="timesheet-field-group">
                  <label className="timesheet-field-label">
                    <Clock size={16} />
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    className="timesheet-field-input"
                    placeholder="Enter overtime hours"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                    disabled={!isEditable}
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="timesheet-field-group">
                  <label className="timesheet-field-label">
                    Description (Optional)
                  </label>
                  <textarea
                    className="timesheet-field-textarea"
                    placeholder="Add notes about your work today..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditable}
                    rows={3}
                  />
                </div>
              </div>

              {isEditable && (
                <div className="timesheet-form-actions">
                  <button 
                    className="timesheet-save-btn"
                    onClick={handleSaveTimesheet}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="timesheet-loading-spinner small"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {existingTimesheet ? 'Update Timesheet' : 'Save Timesheet'}
                      </>
                    )}
                  </button>
                </div>
              )}

              {!isEditable && isPast && (
                <div className="timesheet-readonly-notice">
                  <Eye size={20} />
                  <span>This timesheet is from a past date and cannot be edited.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly View */}
        {activeView === 'monthly' && renderMonthlyView()}
      </div>
    </>
  )
}

export default UpdateTimeSheet