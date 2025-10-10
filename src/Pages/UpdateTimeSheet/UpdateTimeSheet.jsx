import React, { useState, useEffect } from 'react'
import './UpdateTimeSheet.css'
import Hamburger from "../../Components/Hamburger/Hamburger";
import { 
  Calendar, 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  Download, 
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sun,
  FileText,
  BarChart3
} from 'lucide-react';
import { toast } from "react-toastify";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "../../Firebase";

const UpdateTimeSheet = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('attendance'); // attendance, reports, holidays
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Report States
  const [reportType, setReportType] = useState('individual'); // individual, bulk
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [reportData, setReportData] = useState(null);
  
  // Attendance States
  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present', // present, absent, half-day
    checkIn: '',
    checkOut: '',
    notes: ''
  });
  
  // Holiday States
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    name: '',
    type: 'public' // public, optional
  });
  
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  
  // Bulk Attendance States
  const [bulkAttendanceDate, setBulkAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkAttendanceData, setBulkAttendanceData] = useState([]);
  const [savingBulkAttendance, setSavingBulkAttendance] = useState(false);

  // Simple Attendance States
  const [simpleAttendanceDate, setSimpleAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [simpleAttendanceData, setSimpleAttendanceData] = useState([]);
  const [showSimpleAttendanceModal, setShowSimpleAttendanceModal] = useState(false);
  const [savingSimpleAttendance, setSavingSimpleAttendance] = useState(false);

  // Attendance status options
  const attendanceStatuses = [
    { value: 'present', label: 'Present', icon: CheckCircle, color: '#22c55e' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: '#ef4444' },
    { value: 'half-day', label: 'Half Day', icon: AlertCircle, color: '#f59e0b' }
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (employees.length > 0 && showBulkAttendanceModal) {
      initializeBulkAttendance();
    }
  }, [employees, bulkAttendanceDate, showBulkAttendanceModal]);

  useEffect(() => {
    if (employees.length > 0 && showSimpleAttendanceModal) {
      initializeSimpleAttendance();
    }
  }, [employees, simpleAttendanceDate, showSimpleAttendanceModal]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployees(),
        fetchAttendance(),
        fetchHolidays()
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to fetch data");
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Employees"));
      const employeesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployees(employeesData);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    }
  };

  const fetchAttendance = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "Attendance"), orderBy("date", "desc"))
      );
      const attendanceData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAttendance(attendanceData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to fetch attendance");
    }
  };

  const fetchHolidays = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "Holidays"), orderBy("date", "desc"))
      );
      const holidaysData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setHolidays(holidaysData);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to fetch holidays");
    }
  };

  const handleAddAttendance = async (e) => {
    e.preventDefault();
    
    if (!attendanceForm.employeeId || !attendanceForm.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const attendanceData = {
        ...attendanceForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingAttendance) {
        await updateDoc(doc(db, "Attendance", editingAttendance.id), {
          ...attendanceData,
          updatedAt: new Date().toISOString()
        });
        toast.success("Attendance updated successfully!");
      } else {
        // Check if attendance already exists for this employee and date
        const existingAttendance = attendance.find(
          a => a.employeeId === attendanceForm.employeeId && a.date === attendanceForm.date
        );
        
        if (existingAttendance) {
          toast.error("Attendance already marked for this employee on this date");
          setSaving(false);
          return;
        }
        
        await addDoc(collection(db, "Attendance"), attendanceData);
        toast.success("Attendance marked successfully!");
      }
      
      resetAttendanceForm();
      setShowAttendanceModal(false);
      fetchAttendance();
    } catch (error) {
      console.error("Error saving attendance:", error);
      toast.error("Failed to save attendance");
    }
    setSaving(false);
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    
    if (!holidayForm.date || !holidayForm.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const holidayData = {
        ...holidayForm,
        createdAt: new Date().toISOString()
      };

      // Check if holiday already exists for this date
      const existingHoliday = holidays.find(h => h.date === holidayForm.date);
      if (existingHoliday) {
        toast.error("Holiday already exists for this date");
        setSaving(false);
        return;
      }
      
      await addDoc(collection(db, "Holidays"), holidayData);
      toast.success("Holiday added successfully!");
      
      setHolidayForm({ date: '', name: '', type: 'public' });
      setShowHolidayModal(false);
      fetchHolidays();
    } catch (error) {
      console.error("Error saving holiday:", error);
      toast.error("Failed to save holiday");
    }
    setSaving(false);
  };

  const handleDeleteAttendance = async (attendanceId) => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteDoc(doc(db, "Attendance", attendanceId));
        toast.success("Attendance deleted successfully!");
        fetchAttendance();
      } catch (error) {
        console.error("Error deleting attendance:", error);
        toast.error("Failed to delete attendance");
      }
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await deleteDoc(doc(db, "Holidays", holidayId));
        toast.success("Holiday deleted successfully!");
        fetchHolidays();
      } catch (error) {
        console.error("Error deleting holiday:", error);
        toast.error("Failed to delete holiday");
      }
    }
  };

  const initializeBulkAttendance = () => {
    const currentDateAttendance = attendance.filter(a => a.date === bulkAttendanceDate);
    
    const bulkData = employees.map(employee => {
      const existingAttendance = currentDateAttendance.find(a => a.employeeId === employee.id);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        designation: employee.designation || 'N/A',
        status: existingAttendance ? existingAttendance.status : 'present',
        checkIn: existingAttendance ? existingAttendance.checkIn || '09:00' : '09:00',
        checkOut: existingAttendance ? existingAttendance.checkOut || '18:00' : '18:00',
        notes: existingAttendance ? existingAttendance.notes || '' : '',
        attendanceId: existingAttendance ? existingAttendance.id : null
      };
    });

    setBulkAttendanceData(bulkData);
  };

  const handleBulkAttendanceStatusChange = (employeeId, status) => {
    setBulkAttendanceData(prev => prev.map(emp => 
      emp.employeeId === employeeId 
        ? { ...emp, status }
        : emp
    ));
  };

  const handleBulkAttendanceTimeChange = (employeeId, field, value) => {
    setBulkAttendanceData(prev => prev.map(emp => 
      emp.employeeId === employeeId 
        ? { ...emp, [field]: value }
        : emp
    ));
  };

  const handleBulkAttendanceNotesChange = (employeeId, notes) => {
    setBulkAttendanceData(prev => prev.map(emp => 
      emp.employeeId === employeeId 
        ? { ...emp, notes }
        : emp
    ));
  };

  const saveBulkAttendance = async () => {
    if (!bulkAttendanceDate) {
      toast.error("Please select a date");
      return;
    }

    setSavingBulkAttendance(true);
    
    try {
      const savePromises = bulkAttendanceData.map(async (emp) => {
        const attendanceData = {
          employeeId: emp.employeeId,
          date: bulkAttendanceDate,
          status: emp.status,
          checkIn: emp.checkIn,
          checkOut: emp.checkOut,
          notes: emp.notes,
          updatedAt: new Date().toISOString()
        };

        if (emp.attendanceId) {
          // Update existing attendance
          await updateDoc(doc(db, "Attendance", emp.attendanceId), {
            ...attendanceData,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Create new attendance record
          await addDoc(collection(db, "Attendance"), {
            ...attendanceData,
            createdAt: new Date().toISOString()
          });
        }
      });

      await Promise.all(savePromises);
      
      toast.success(`Attendance saved for ${bulkAttendanceData.length} employees!`);
      setShowBulkAttendanceModal(false);
      fetchAttendance();
    } catch (error) {
      console.error("Error saving bulk attendance:", error);
      toast.error("Failed to save bulk attendance");
    }

    setSavingBulkAttendance(false);
  };

  const initializeSimpleAttendance = () => {
    const currentDateAttendance = attendance.filter(a => a.date === simpleAttendanceDate);
    
    const simpleData = employees.map(employee => {
      const existingAttendance = currentDateAttendance.find(a => a.employeeId === employee.id);
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        designation: employee.designation || 'N/A',
        status: existingAttendance ? existingAttendance.status : 'present',
        attendanceId: existingAttendance ? existingAttendance.id : null
      };
    });

    setSimpleAttendanceData(simpleData);
  };

  const handleSimpleAttendanceChange = (employeeId, status) => {
    setSimpleAttendanceData(prev => prev.map(emp => 
      emp.employeeId === employeeId 
        ? { ...emp, status }
        : emp
    ));
  };

  const saveSimpleAttendance = async () => {
    if (!simpleAttendanceDate) {
      toast.error("Please select a date");
      return;
    }

    setSavingSimpleAttendance(true);
    
    try {
      const savePromises = simpleAttendanceData.map(async (emp) => {
        const attendanceData = {
          employeeId: emp.employeeId,
          date: simpleAttendanceDate,
          status: emp.status,
          checkIn: emp.status === 'present' ? '09:00' : '',
          checkOut: emp.status === 'present' ? '18:00' : '',
          notes: '',
          updatedAt: new Date().toISOString()
        };

        if (emp.attendanceId) {
          // Update existing attendance
          await updateDoc(doc(db, "Attendance", emp.attendanceId), {
            ...attendanceData,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Create new attendance record
          await addDoc(collection(db, "Attendance"), {
            ...attendanceData,
            createdAt: new Date().toISOString()
          });
        }
      });

      await Promise.all(savePromises);
      
      toast.success(`Attendance saved for ${simpleAttendanceData.length} employees!`);
      setShowSimpleAttendanceModal(false);
      fetchAttendance();
    } catch (error) {
      console.error("Error saving simple attendance:", error);
      toast.error("Failed to save attendance");
    }

    setSavingSimpleAttendance(false);
  };

  const generateReport = () => {
    if (!reportFromDate || !reportToDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    const fromDate = new Date(reportFromDate);
    const toDate = new Date(reportToDate);
    
    if (fromDate > toDate) {
      toast.error("From date cannot be after to date");
      return;
    }

    if (reportType === 'individual' && !selectedEmployee) {
      toast.error("Please select an employee for individual report");
      return;
    }

    const dateRange = [];
    const currentDate = new Date(fromDate);
    
    while (currentDate <= toDate) {
      dateRange.push(new Date(currentDate).toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const reportResult = reportType === 'individual' 
      ? generateIndividualReport(dateRange) 
      : generateBulkReport(dateRange);
    
    setReportData(reportResult);
  };

  const generateIndividualReport = (dateRange) => {
    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return null;

    let totalWorkingDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    const dailyRecords = [];

    dateRange.forEach(date => {
      const dateObj = new Date(date);
      const isSunday = dateObj.getDay() === 0;
      const isHoliday = holidays.some(h => h.date === date);
      
      if (!isSunday && !isHoliday) {
        totalWorkingDays++;
      }

      const attendanceRecord = attendance.find(
        a => a.employeeId === selectedEmployee && a.date === date
      );

      let status = 'absent';
      let checkIn = '';
      let checkOut = '';
      let notes = '';

      if (attendanceRecord) {
        status = attendanceRecord.status;
        checkIn = attendanceRecord.checkIn || '';
        checkOut = attendanceRecord.checkOut || '';
        notes = attendanceRecord.notes || '';
      }

      if (!isSunday && !isHoliday) {
        if (status === 'present') presentDays++;
        else if (status === 'absent') absentDays++;
        else if (status === 'half-day') halfDays += 0.5;
      }

      dailyRecords.push({
        date,
        dateObj,
        isSunday,
        isHoliday: isHoliday ? holidays.find(h => h.date === date) : null,
        status,
        checkIn,
        checkOut,
        notes,
        isWorkingDay: !isSunday && !isHoliday
      });
    });

    const attendancePercentage = totalWorkingDays > 0 ? 
      ((presentDays + halfDays) / totalWorkingDays * 100).toFixed(2) : 0;

    return {
      type: 'individual',
      employee,
      dateRange: { from: reportFromDate, to: reportToDate },
      summary: {
        totalWorkingDays,
        presentDays,
        absentDays,
        halfDays,
        attendancePercentage
      },
      dailyRecords
    };
  };

  const generateBulkReport = (dateRange) => {
    const employeeReports = employees.map(employee => {
      let totalWorkingDays = 0;
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;

      dateRange.forEach(date => {
        const dateObj = new Date(date);
        const isSunday = dateObj.getDay() === 0;
        const isHoliday = holidays.some(h => h.date === date);
        
        if (!isSunday && !isHoliday) {
          totalWorkingDays++;
          
          const attendanceRecord = attendance.find(
            a => a.employeeId === employee.id && a.date === date
          );

          if (attendanceRecord) {
            if (attendanceRecord.status === 'present') presentDays++;
            else if (attendanceRecord.status === 'absent') absentDays++;
            else if (attendanceRecord.status === 'half-day') halfDays += 0.5;
          } else {
            absentDays++;
          }
        }
      });

      const attendancePercentage = totalWorkingDays > 0 ? 
        ((presentDays + halfDays) / totalWorkingDays * 100).toFixed(2) : 0;

      return {
        employee,
        summary: {
          totalWorkingDays,
          presentDays,
          absentDays,
          halfDays,
          attendancePercentage
        }
      };
    });

    return {
      type: 'bulk',
      dateRange: { from: reportFromDate, to: reportToDate },
      employeeReports
    };
  };

  const resetAttendanceForm = () => {
    setAttendanceForm({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      status: 'present',
      checkIn: '',
      checkOut: '',
      notes: ''
    });
    setEditingAttendance(null);
  };

  const handleEditAttendance = (record) => {
    setAttendanceForm({
      employeeId: record.employeeId,
      date: record.date,
      status: record.status,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || '',
      notes: record.notes || ''
    });
    setEditingAttendance(record);
    setShowAttendanceModal(true);
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.filter(a => a.date === today);
  };

  const getFilteredAttendance = () => {
    let filtered = attendance;
    
    if (selectedEmployee) {
      filtered = filtered.filter(a => a.employeeId === selectedEmployee);
    }
    
    if (selectedDate) {
      filtered = filtered.filter(a => a.date === selectedDate);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => {
        const employee = employees.find(emp => emp.id === a.employeeId);
        return employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               employee?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  };

  const isDateHoliday = (date) => {
    const dateObj = new Date(date);
    const isSunday = dateObj.getDay() === 0;
    const isMarkedHoliday = holidays.some(h => h.date === date);
    return isSunday || isMarkedHoliday;
  };

  if (loading) {
    return (
      <>
        <div className="top-bar-container">
          <Hamburger />
          <div className="breadcrumps-container">
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--txt-dark)" }}>
              Update TimeSheet
            </h1>
          </div>
        </div>
        <div className="timesheet-loading">
          <div className="timesheet-loading-spinner"></div>
          Loading timesheet data...
        </div>
      </>
    );
  }

  return (
    <>
      <div className="top-bar-container" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
              <Clock style={{ width: "24px", height: "24px", color: "var(--blue)" }} />
              Update TimeSheet
            </h1>
          </div>
        </div>
        <div className="timesheet-header-actions d-none d-lg-flex">
          <button 
            className="timesheet-add-btn"
            onClick={() => {
              setSimpleAttendanceDate(new Date().toISOString().split('T')[0]);
              setShowSimpleAttendanceModal(true);
            }}
          >
            <Users style={{ width: "18px", height: "18px" }} />
            Quick Attendance
          </button>
          <button 
            className="timesheet-add-btn"
            onClick={() => {
              setBulkAttendanceDate(new Date().toISOString().split('T')[0]);
              initializeBulkAttendance();
              setShowBulkAttendanceModal(true);
            }}
          >
            <Users style={{ width: "18px", height: "18px" }} />
            Mark All Employees
          </button>
          <button 
            className="timesheet-add-btn"
            onClick={() => {
              resetAttendanceForm();
              setShowAttendanceModal(true);
            }}
          >
            <Plus style={{ width: "18px", height: "18px" }} />
            Single Employee
          </button>
        </div>
      </div>

      <div className="timesheet-main-container">
        {/* Tab Navigation */}
        <div className="timesheet-tabs">
          <button 
            className={`timesheet-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <UserCheck size={20} />
            Attendance
          </button>
          <button 
            className={`timesheet-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <BarChart3 size={20} />
            Reports
          </button>
          <button 
            className={`timesheet-tab ${activeTab === 'holidays' ? 'active' : ''}`}
            onClick={() => setActiveTab('holidays')}
          >
            <Sun size={20} />
            Holidays
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'attendance' && (
          <div className="timesheet-tab-content">
            {/* Today's Summary */}
            <div className="timesheet-summary-cards">
              <div className="timesheet-summary-card total">
                <div className="timesheet-summary-icon">
                  <Users size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-label">Total Employees</div>
                  <div className="timesheet-summary-value">{employees.length}</div>
                </div>
              </div>
              <div className="timesheet-summary-card present">
                <div className="timesheet-summary-icon">
                  <UserCheck size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-label">Present Today</div>
                  <div className="timesheet-summary-value">
                    {getTodayAttendance().filter(a => a.status === 'present').length}
                  </div>
                </div>
              </div>
              <div className="timesheet-summary-card absent">
                <div className="timesheet-summary-icon">
                  <UserX size={24} />
                </div>
                <div className="timesheet-summary-content">
                  <div className="timesheet-summary-label">Absent Today</div>
                  <div className="timesheet-summary-value">
                    {getTodayAttendance().filter(a => a.status === 'absent').length}
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="timesheet-filters">
              <div className="timesheet-filter-group">
                <label>Employee:</label>
                <select 
                  value={selectedEmployee} 
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="timesheet-filter-group">
                <label>Date:</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="timesheet-filter-group">
                <label>Search:</label>
                <div className="timesheet-search-wrapper">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by employee name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="timesheet-records-section">
              <div className="timesheet-records-header">
                <h3>Attendance Records</h3>
                <div className="timesheet-records-actions">
                  <button 
                    className="timesheet-add-btn"
                    onClick={() => {
                      setSimpleAttendanceDate(new Date().toISOString().split('T')[0]);
                      setShowSimpleAttendanceModal(true);
                    }}
                  >
                    <UserCheck size={16} />
                    Quick
                  </button>
                  <button 
                    className="timesheet-add-btn timesheet-bulk-btn"
                    onClick={() => {
                      setBulkAttendanceDate(new Date().toISOString().split('T')[0]);
                      initializeBulkAttendance();
                      setShowBulkAttendanceModal(true);
                    }}
                  >
                    <Users size={16} />
                    Mark All
                  </button>
                  <button 
                    className="timesheet-add-btn"
                    onClick={() => {
                      resetAttendanceForm();
                      setShowAttendanceModal(true);
                    }}
                  >
                    <Plus size={16} />
                    Single
                  </button>
                </div>
              </div>
              
              <div className="timesheet-records-list">
                {getFilteredAttendance().length === 0 ? (
                  <div className="timesheet-empty-state">
                    <Clock size={64} />
                    <h3>No attendance records found</h3>
                    <p>Start by marking attendance for employees</p>
                  </div>
                ) : (
                  <div className="timesheet-records-grid">
                    {getFilteredAttendance().map((record) => {
                      const employee = employees.find(emp => emp.id === record.employeeId);
                      const status = attendanceStatuses.find(s => s.value === record.status);
                      const StatusIcon = status?.icon || Clock;
                      
                      return (
                        <div key={record.id} className="timesheet-record-card">
                          <div className="timesheet-record-header">
                            <div className="timesheet-record-employee">
                              <h4>{employee?.name || 'Unknown Employee'}</h4>
                              <p>{employee?.designation || 'No designation'}</p>
                            </div>
                            <div className="timesheet-record-actions">
                              <button 
                                className="timesheet-edit-btn"
                                onClick={() => handleEditAttendance(record)}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                className="timesheet-delete-btn"
                                onClick={() => handleDeleteAttendance(record.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="timesheet-record-details">
                            <div className="timesheet-record-status">
                              <StatusIcon 
                                size={20} 
                                style={{ color: status?.color }} 
                              />
                              <span style={{ color: status?.color }}>
                                {status?.label}
                              </span>
                            </div>
                            
                            <div className="timesheet-record-meta">
                              <div className="timesheet-record-date">
                                <Calendar size={16} />
                                {new Date(record.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              
                              {record.checkIn && (
                                <div className="timesheet-record-time">
                                  <Clock size={16} />
                                  {record.checkIn} - {record.checkOut || 'Not checked out'}
                                </div>
                              )}
                            </div>
                            
                            {record.notes && (
                              <div className="timesheet-record-notes">
                                <strong>Notes:</strong> {record.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="timesheet-tab-content">
            <div className="timesheet-reports-section">
              <div className="timesheet-report-controls">
                <div className="timesheet-report-type">
                  <label>Report Type:</label>
                  <div className="timesheet-radio-group">
                    <label className="timesheet-radio-option">
                      <input 
                        type="radio" 
                        value="individual" 
                        checked={reportType === 'individual'}
                        onChange={(e) => setReportType(e.target.value)}
                      />
                      Individual Employee
                    </label>
                    <label className="timesheet-radio-option">
                      <input 
                        type="radio" 
                        value="bulk" 
                        checked={reportType === 'bulk'}
                        onChange={(e) => setReportType(e.target.value)}
                      />
                      All Employees
                    </label>
                  </div>
                </div>

                {reportType === 'individual' && (
                  <div className="timesheet-report-employee">
                    <label>Select Employee:</label>
                    <select 
                      value={selectedEmployee} 
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                      <option value="">Choose Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="timesheet-report-dates">
                  <div className="timesheet-date-group">
                    <label>From Date:</label>
                    <input 
                      type="date" 
                      value={reportFromDate}
                      onChange={(e) => setReportFromDate(e.target.value)}
                    />
                  </div>
                  <div className="timesheet-date-group">
                    <label>To Date:</label>
                    <input 
                      type="date" 
                      value={reportToDate}
                      onChange={(e) => setReportToDate(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  className="timesheet-generate-btn"
                  onClick={generateReport}
                >
                  <FileText size={18} />
                  Generate Report
                </button>
              </div>

              {reportData && (
                <div className="timesheet-report-results">
                  {reportData.type === 'individual' ? (
                    <div className="timesheet-individual-report">
                      <div className="timesheet-report-header">
                        <h3>Individual Attendance Report</h3>
                        <div className="timesheet-report-meta">
                          <strong>Employee:</strong> {reportData.employee.name}<br/>
                          <strong>Period:</strong> {new Date(reportData.dateRange.from).toLocaleDateString()} - {new Date(reportData.dateRange.to).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="timesheet-report-summary">
                        <div className="timesheet-summary-item">
                          <span className="label">Total Working Days:</span>
                          <span className="value">{reportData.summary.totalWorkingDays}</span>
                        </div>
                        <div className="timesheet-summary-item">
                          <span className="label">Present Days:</span>
                          <span className="value present">{reportData.summary.presentDays}</span>
                        </div>
                        <div className="timesheet-summary-item">
                          <span className="label">Absent Days:</span>
                          <span className="value absent">{reportData.summary.absentDays}</span>
                        </div>
                        <div className="timesheet-summary-item">
                          <span className="label">Half Days:</span>
                          <span className="value half">{reportData.summary.halfDays}</span>
                        </div>
                        <div className="timesheet-summary-item">
                          <span className="label">Attendance %:</span>
                          <span className="value percentage">{reportData.summary.attendancePercentage}%</span>
                        </div>
                      </div>

                      <div className="timesheet-daily-records">
                        <h4>Daily Attendance</h4>
                        <div className="timesheet-calendar-view">
                          {reportData.dailyRecords.map((record, index) => (
                            <div 
                              key={index} 
                              className={`timesheet-day-card ${record.status} ${!record.isWorkingDay ? 'non-working' : ''}`}
                            >
                              <div className="timesheet-day-date">
                                {new Date(record.date).toLocaleDateString('en-IN', { 
                                  day: '2-digit', 
                                  month: 'short' 
                                })}
                              </div>
                              <div className="timesheet-day-status">
                                {record.isSunday ? 'Sunday' : 
                                 record.isHoliday ? record.isHoliday.name :
                                 record.status}
                              </div>
                              {record.checkIn && (
                                <div className="timesheet-day-time">
                                  {record.checkIn} - {record.checkOut || '--'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="timesheet-bulk-report">
                      <div className="timesheet-report-header">
                        <h3>Bulk Attendance Report</h3>
                        <div className="timesheet-report-meta">
                          <strong>Period:</strong> {new Date(reportData.dateRange.from).toLocaleDateString()} - {new Date(reportData.dateRange.to).toLocaleDateString()}<br/>
                          <strong>Total Employees:</strong> {reportData.employeeReports.length}
                        </div>
                      </div>

                      <div className="timesheet-bulk-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Designation</th>
                              <th>Working Days</th>
                              <th>Present</th>
                              <th>Absent</th>
                              <th>Half Days</th>
                              <th>Attendance %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.employeeReports.map((empReport, index) => (
                              <tr key={index}>
                                <td>{empReport.employee.name}</td>
                                <td>{empReport.employee.designation || 'N/A'}</td>
                                <td>{empReport.summary.totalWorkingDays}</td>
                                <td className="present">{empReport.summary.presentDays}</td>
                                <td className="absent">{empReport.summary.absentDays}</td>
                                <td className="half">{empReport.summary.halfDays}</td>
                                <td className="percentage">{empReport.summary.attendancePercentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="timesheet-tab-content">
            <div className="timesheet-holidays-section">
              <div className="timesheet-holidays-header">
                <h3>Holiday Management</h3>
                <button 
                  className="timesheet-add-btn"
                  onClick={() => setShowHolidayModal(true)}
                >
                  <Plus size={16} />
                  Add Holiday
                </button>
              </div>

              <div className="timesheet-holidays-note">
                <AlertCircle size={20} />
                <p>Sundays are automatically considered as holidays. You can add additional holidays here.</p>
              </div>

              <div className="timesheet-holidays-list">
                {holidays.length === 0 ? (
                  <div className="timesheet-empty-state">
                    <Sun size={64} />
                    <h3>No holidays added</h3>
                    <p>Add public or optional holidays to exclude them from attendance calculations</p>
                  </div>
                ) : (
                  <div className="timesheet-holidays-grid">
                    {holidays.map((holiday) => (
                      <div key={holiday.id} className="timesheet-holiday-card">
                        <div className="timesheet-holiday-header">
                          <h4>{holiday.name}</h4>
                          <button 
                            className="timesheet-delete-btn"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="timesheet-holiday-date">
                          <Calendar size={16} />
                          {new Date(holiday.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        <div className={`timesheet-holiday-type ${holiday.type}`}>
                          {holiday.type === 'public' ? 'Public Holiday' : 'Optional Holiday'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>

      {/* Simple Attendance Modal */}
      {showSimpleAttendanceModal && (
        <div className="timesheet-modal timesheet-simple-modal">
          <div className="timesheet-modal-overlay" onClick={() => setShowSimpleAttendanceModal(false)}></div>
          <div className="timesheet-modal-content">
            <div className="timesheet-modal-header">
              <h3>Quick Attendance - Present/Absent</h3>
              <button 
                className="timesheet-modal-close"
                onClick={() => setShowSimpleAttendanceModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="timesheet-simple-form">
              <div className="timesheet-simple-date-section">
                <div className="timesheet-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={simpleAttendanceDate}
                    onChange={(e) => {
                      setSimpleAttendanceDate(e.target.value);
                      setTimeout(() => initializeSimpleAttendance(), 100);
                    }}
                    required
                  />
                </div>
                <div className="timesheet-simple-info">
                  📅 {new Date(simpleAttendanceDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
              </div>

              <div className="timesheet-simple-header">
                <h4>Mark Attendance ({employees.length} Employees)</h4>
                <div className="timesheet-simple-quick-actions">
                  <button 
                    type="button"
                    className="timesheet-quick-action-btn present"
                    onClick={() => {
                      setSimpleAttendanceData(prev => prev.map(emp => ({ ...emp, status: 'present' })));
                    }}
                  >
                    All Present
                  </button>
                  <button 
                    type="button"
                    className="timesheet-quick-action-btn absent"
                    onClick={() => {
                      setSimpleAttendanceData(prev => prev.map(emp => ({ ...emp, status: 'absent' })));
                    }}
                  >
                    All Absent
                  </button>
                </div>
              </div>

              <div className="timesheet-simple-employees-list">
                {simpleAttendanceData.map((emp, index) => (
                  <div key={emp.employeeId} className="timesheet-simple-employee-card">
                    <div className="timesheet-simple-employee-info">
                      <div className="timesheet-simple-employee-details">
                        <h5>{emp.employeeName}</h5>
                        <p>{emp.designation}</p>
                      </div>
                      <div className="timesheet-simple-employee-number">#{index + 1}</div>
                    </div>

                    <div className="timesheet-simple-radio-group">
                      <label className="timesheet-simple-radio-option present">
                        <input
                          type="radio"
                          name={`attendance-${emp.employeeId}`}
                          value="present"
                          checked={emp.status === 'present'}
                          onChange={() => handleSimpleAttendanceChange(emp.employeeId, 'present')}
                        />
                        <span className="radio-custom"></span>
                        <CheckCircle size={18} />
                        Present
                      </label>
                      
                      <label className="timesheet-simple-radio-option absent">
                        <input
                          type="radio"
                          name={`attendance-${emp.employeeId}`}
                          value="absent"
                          checked={emp.status === 'absent'}
                          onChange={() => handleSimpleAttendanceChange(emp.employeeId, 'absent')}
                        />
                        <span className="radio-custom"></span>
                        <XCircle size={18} />
                        Absent
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="timesheet-simple-actions">
                <button 
                  type="button" 
                  className="timesheet-cancel-btn"
                  onClick={() => setShowSimpleAttendanceModal(false)}
                  disabled={savingSimpleAttendance}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="timesheet-save-btn"
                  onClick={saveSimpleAttendance}
                  disabled={savingSimpleAttendance}
                >
                  {savingSimpleAttendance ? (
                    <>
                      <div className="timesheet-loading-spinner small"></div>
                      Saving {simpleAttendanceData.length} Records...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Save Attendance ({simpleAttendanceData.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {showBulkAttendanceModal && (
        <div className="timesheet-modal timesheet-bulk-modal">
          <div className="timesheet-modal-overlay" onClick={() => setShowBulkAttendanceModal(false)}></div>
          <div className="timesheet-modal-content timesheet-bulk-content">
            <div className="timesheet-modal-header">
              <h3>Mark Attendance for All Employees</h3>
              <button 
                className="timesheet-modal-close"
                onClick={() => setShowBulkAttendanceModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="timesheet-bulk-form">
              <div className="timesheet-bulk-date-section">
                <div className="timesheet-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={bulkAttendanceDate}
                    onChange={(e) => {
                      setBulkAttendanceDate(e.target.value);
                      // Re-initialize data when date changes
                      setTimeout(() => initializeBulkAttendance(), 100);
                    }}
                    required
                  />
                </div>
                <div className="timesheet-bulk-info">
                  <span>📅 {new Date(bulkAttendanceDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</span>
                </div>
              </div>

              <div className="timesheet-bulk-employees-section">
                <div className="timesheet-bulk-header">
                  <h4>Employees ({employees.length})</h4>
                  <div className="timesheet-bulk-quick-actions">
                    <button 
                      type="button"
                      className="timesheet-quick-action-btn present"
                      onClick={() => {
                        setBulkAttendanceData(prev => prev.map(emp => ({ ...emp, status: 'present' })));
                      }}
                    >
                      Mark All Present
                    </button>
                    <button 
                      type="button"
                      className="timesheet-quick-action-btn absent"
                      onClick={() => {
                        setBulkAttendanceData(prev => prev.map(emp => ({ ...emp, status: 'absent' })));
                      }}
                    >
                      Mark All Absent
                    </button>
                  </div>
                </div>

                <div className="timesheet-bulk-employees-list">
                  {bulkAttendanceData.map((emp, index) => (
                    <div key={emp.employeeId} className="timesheet-bulk-employee-card">
                      <div className="timesheet-bulk-employee-info">
                        <div className="timesheet-bulk-employee-details">
                          <h5>{emp.employeeName}</h5>
                          <p>{emp.designation}</p>
                        </div>
                        <div className="timesheet-bulk-employee-number">#{index + 1}</div>
                      </div>

                      <div className="timesheet-bulk-employee-controls">
                        <div className="timesheet-bulk-status-group">
                          <label>Status:</label>
                          <div className="timesheet-bulk-status-buttons">
                            {attendanceStatuses.map(status => {
                              const StatusIcon = status.icon;
                              return (
                                <button
                                  key={status.value}
                                  type="button"
                                  className={`timesheet-status-btn ${emp.status === status.value ? 'active' : ''}`}
                                  onClick={() => handleBulkAttendanceStatusChange(emp.employeeId, status.value)}
                                  style={{ '--status-color': status.color }}
                                >
                                  <StatusIcon size={16} />
                                  {status.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {emp.status === 'present' && (
                          <div className="timesheet-bulk-time-group">
                            <div className="timesheet-time-input">
                              <label>Check In:</label>
                              <input
                                type="time"
                                value={emp.checkIn}
                                onChange={(e) => handleBulkAttendanceTimeChange(emp.employeeId, 'checkIn', e.target.value)}
                              />
                            </div>
                            <div className="timesheet-time-input">
                              <label>Check Out:</label>
                              <input
                                type="time"
                                value={emp.checkOut}
                                onChange={(e) => handleBulkAttendanceTimeChange(emp.employeeId, 'checkOut', e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="timesheet-bulk-notes-group">
                          <label>Notes:</label>
                          <input
                            type="text"
                            placeholder="Add notes (optional)"
                            value={emp.notes}
                            onChange={(e) => handleBulkAttendanceNotesChange(emp.employeeId, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="timesheet-bulk-actions">
                <button 
                  type="button" 
                  className="timesheet-cancel-btn"
                  onClick={() => setShowBulkAttendanceModal(false)}
                  disabled={savingBulkAttendance}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="timesheet-save-btn"
                  onClick={saveBulkAttendance}
                  disabled={savingBulkAttendance}
                >
                  {savingBulkAttendance ? (
                    <>
                      <div className="timesheet-loading-spinner small"></div>
                      Saving {bulkAttendanceData.length} Records...
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      Save All Attendance ({bulkAttendanceData.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="timesheet-modal">
          <div className="timesheet-modal-overlay" onClick={() => setShowHolidayModal(false)}></div>
          <div className="timesheet-modal-content">
            <div className="timesheet-modal-header">
              <h3>Add Holiday</h3>
              <button 
                className="timesheet-modal-close"
                onClick={() => setShowHolidayModal(false)}
              >
                ×
              </button>
            </div>
            
            <form className="timesheet-form" onSubmit={handleAddHoliday}>
              <div className="timesheet-form-group">
                <label>Holiday Name *</label>
                <input
                  type="text"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter holiday name"
                  required
                />
              </div>

              <div className="timesheet-form-row">
                <div className="timesheet-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="timesheet-form-group">
                  <label>Type *</label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm(prev => ({ ...prev, type: e.target.value }))}
                    required
                  >
                    <option value="public">Public Holiday</option>
                    <option value="optional">Optional Holiday</option>
                  </select>
                </div>
              </div>

              <div className="timesheet-form-actions">
                <button 
                  type="button" 
                  className="timesheet-cancel-btn"
                  onClick={() => setShowHolidayModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="timesheet-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="timesheet-loading-spinner small"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Sun size={18} />
                      Add Holiday
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="timesheet-modal">
          <div className="timesheet-modal-overlay" onClick={() => setShowAttendanceModal(false)}></div>
          <div className="timesheet-modal-content">
            <div className="timesheet-modal-header">
              <h3>{editingAttendance ? 'Edit Attendance' : 'Mark Attendance'}</h3>
              <button 
                className="timesheet-modal-close"
                onClick={() => setShowAttendanceModal(false)}
              >
                ×
              </button>
            </div>
            
            <form className="timesheet-form" onSubmit={handleAddAttendance}>
              <div className="timesheet-form-row">
                <div className="timesheet-form-group">
                  <label>Employee *</label>
                  <select
                    value={attendanceForm.employeeId}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="timesheet-form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="timesheet-form-row">
                <div className="timesheet-form-group">
                  <label>Status *</label>
                  <select
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    {attendanceStatuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="timesheet-form-row">
                <div className="timesheet-form-group">
                  <label>Check In</label>
                  <input
                    type="time"
                    value={attendanceForm.checkIn}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  />
                </div>
                <div className="timesheet-form-group">
                  <label>Check Out</label>
                  <input
                    type="time"
                    value={attendanceForm.checkOut}
                    onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  />
                </div>
              </div>

              <div className="timesheet-form-group">
                <label>Notes</label>
                <textarea
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows="3"
                />
              </div>

              <div className="timesheet-form-actions">
                <button 
                  type="button" 
                  className="timesheet-cancel-btn"
                  onClick={() => setShowAttendanceModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="timesheet-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="timesheet-loading-spinner small"></div>
                      {editingAttendance ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />
                      {editingAttendance ? 'Update Attendance' : 'Mark Attendance'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default UpdateTimeSheet