import React, { useEffect, useState } from 'react'
import './App.css'
import Logo from './assets/logo.jpg'
import { MenuItemsData } from './SLAData'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  FolderOpenDot,
  Inbox as InboxIcon,
  LayoutDashboard,
  LogOut,
  User,
  X,
} from 'lucide-react'
import Dashboard from './Pages/Dashboard/Dashboard'
import Leads from './Pages/Leads/Leads'
import Employees from './Pages/Employees/Employees'
import AddEmployee from './Pages/AddEmployee/AddEmployee'
import { ToastContainer } from 'react-toastify'
import AddMaterial from './Pages/AddMaterial/AddMaterial'
import EmployeeDetails from './Pages/EmployeeDetails/EmployeeDetails'
import AddLeads from './Pages/AddLeads/AddLeads'
import Login from './Pages/Login/Login'
import Loading from './Pages/Loading/Loading'
import {handleDropDownOpenAndClose} from './Scripts/Helperfunctions'
import { doc, getDoc } from "firebase/firestore";
import { db } from './Firebase'

// Firebase
import { auth } from './Firebase'
import { onAuthStateChanged, signOut  } from 'firebase/auth'
import UpdateTimeSheet from './Pages/UpdateTimeSheet/UpdateTimeSheet'
import AddCustomer from './Pages/AddCustomer/AddCustomer'
import Customers from './Pages/Customers/Customers'
import CustomerDetails from './Pages/CustomerDetails/CustomerDetails'
import AddInvoice from './Pages/AddInvoice/AddInvoice'
import InvoiceDetails from './Pages/InvoiceDetails/InvoiceDetails'
import Invoices from './Pages/Invoices/Invoices'
import TimesheetReport from './Pages/TimesheetReport/TimesheetReport'
import LeadsReport from './Pages/LeadsReport/LeadsReport'
import Materials from './Pages/Materials/Materials'
import QRCodeGenerator from './Pages/QRCodeGenerator/QRCodeGenerator'
import ToDoList from './Pages/ToDoList/ToDoList'
import DailyExpenses from './Pages/DailyExpenses/DailyExpenses'
import MaterialsReport from './Pages/MaterialsReport/MaterialsReport'
import MaterialsInvestment from './Pages/MaterialsInvestment/MaterialsInvestment'
import Payroll from './Pages/Payroll/Payroll'
import Payments from './Pages/Payments/Payments'
import Passwords from './Pages/Passwords/Passwords'
import CustomersReport from './Pages/CustomersReport/CustomersReport'
import AddQuotation from './Pages/AddQuotation/AddQuotation'
import Quotations from './Pages/Quotations/Quotations'
import EditQuotation from './Pages/EditQuotation/EditQuotation'
import AddAppointment from './Pages/AddAppointment/AddAppointment'
import Appointments from './Pages/Appointments/Appointments'
import Projects from './Pages/Projects/Projects'
import PWAInstallPrompt from './Components/PWAInstallPrompt/PWAInstallPrompt'
import PWAUpdateNotification from './Components/PWAUpdateNotification/PWAUpdateNotification'
import MonthlyExpenses from './Pages/MonthlyExpenses/MonthlyExpenses'
import PWAUpdater from './Components/PWAUpdater/PWAUpdater'
import AssetInvestment from './Pages/AssetInvestment/AssetInvestment'
import AccessControlRoute from './AccessControlRoute'
import AccessDenied from './Pages/AccessDenied/AccessDenied'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userAccess, setUserAccess] = useState([])
  const [filteredMenuItems, setFilteredMenuItems] = useState([])
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuSidebarClose = () => {
    document
      .querySelector('body .side-bar-menu-container')
      ?.classList.remove('active')
  }

  // New function to handle menu link clicks
  const handleMenuLinkClick = () => {
    // Only close sidebar on mobile devices (screen width < 992px)
    if (window.innerWidth < 992) {
      handleMenuSidebarClose();
    }
  }

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User logged out successfully");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true)
        // Get username from email before @
        const username = user.email;
        try {
          const docRef = doc(db, "Employees", username);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserAccess(data.access || []);
          } else {
            setUserAccess([]);
          }
        } catch (err) {
          setUserAccess([]);
        }
      } else {
        setIsAuthenticated(false)
        setUserAccess([])
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // MenuItemsData is [{...menu objects}]
    const menuObj = MenuItemsData[0];
    if (userAccess.length > 0) {
      setFilteredMenuItems(
        userAccess
          .map((key) => menuObj[key])
          .filter(Boolean)
      );
    } else {
      setFilteredMenuItems(Object.values(menuObj));
    }
  }, [userAccess]);
  
  if (loading) {
    return <Loading />
  }

  return (
    <>
      {isAuthenticated ? (
        <>
          <ToastContainer position="top-right" autoClose={3000} />
          <div className="sla-admin-layout-container">
            {/* Sidebar */}
            <div className="side-bar-menu-container">
              <div className="logo-container">
                <img src={Logo} alt="Logo" />
                <X
                  className="d-lg-none sidebaar-menu-close"
                  onClick={handleMenuSidebarClose}
                />
              </div>

              <div
                className="accordion menu-items-container mt-2"
                id="accordionExample"
              >

                {
                  userAccess.length == 0 ? (
                    <>
                    <div className="dashboard-menu-con">
                      <NavLink className="dashboard-menu-item" to="/" onClick={handleMenuLinkClick}>
                        <LayoutDashboard className="id-icon" /> Dashboard{' '}
                        <ChevronRight className="icon-arrow" />
                      </NavLink>
                    </div>

                    {/* <div className="dashboard-menu-con">
                      <NavLink className="dashboard-menu-item" to="/projects" onClick={handleMenuLinkClick}>
                        <FolderOpenDot className="id-icon" /> Projects{' '}
                        <ChevronRight className="icon-arrow" />
                      </NavLink>
                    </div> */}
                    </>
                  ) : (<></>)
                }
                

                {/* Accordion Menu - filtered by access */}
                {filteredMenuItems.map((item, index) => {
                  // Check if any subItem matches current location
                  const isActiveAccordion = item.subItems.some(subItem =>
                    location.pathname.startsWith(subItem.link)
                  );
                  return (
                    <div className="accordion-item menu-item" key={index}>
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button${isActiveAccordion ? '' : ' collapsed'}`}
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#menuCollapse${index}`}
                          aria-expanded={isActiveAccordion ? "true" : "false"}
                          aria-controls={`menuCollapse${index}`}
                        >
                          {item.icon} {item.label}{' '}
                          <ChevronDown className="arrow" />
                        </button>
                      </h2>
                      <div
                        id={`menuCollapse${index}`}
                        className={`accordion-collapse collapse${isActiveAccordion ? ' show' : ''}`}
                        data-bs-parent="#accordionExample"
                      >
                        <div className="accordion-body">
                          <ul>
                            {item.subItems.map((subItem, subIndex) => (
                              <li key={subIndex}>
                                <NavLink to={subItem.link} onClick={handleMenuLinkClick}>
                                  {subItem.label}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="user-login-details-main-container">
                <div className="name-label"><User className='icon' /></div>
                <div className="logout-icon" onClick={handleLogout}><LogOut /></div>
              </div>
            </div>

            {/* Main Content */}
            <div className="main-region">
              <Routes>
                <Route path="/" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Dashboard />
                  </AccessControlRoute>
                } />
                <Route path="/customersreport" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <CustomersReport />
                  </AccessControlRoute>
                } />
                <Route path="/timesheetreport" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <TimesheetReport />
                  </AccessControlRoute>
                } />
                <Route path="/leadsreport" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <LeadsReport />
                  </AccessControlRoute>
                } />
                <Route path="/materialsreport" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <MaterialsReport />
                  </AccessControlRoute>
                } />
                <Route path="/leads" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Leads />
                  </AccessControlRoute>
                } />
                <Route path="/addleads" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddLeads />
                  </AccessControlRoute>
                } />
                <Route path="/employees" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Employees />
                  </AccessControlRoute>
                } />
                <Route path="/employees/:employeeId" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <EmployeeDetails />
                  </AccessControlRoute>
                }/>
                <Route path="/addemployee" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddEmployee />
                  </AccessControlRoute>
                } />
                <Route path="/addmaterial" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddMaterial />
                  </AccessControlRoute>
                } />
                <Route path="/materials" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Materials />
                  </AccessControlRoute>
                } />
                <Route path="/updatetimesheet" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <UpdateTimeSheet />
                  </AccessControlRoute>
                } />
                <Route path="/addcustomer" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddCustomer />
                  </AccessControlRoute>
                } />
                <Route path="/customers" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Customers />
                  </AccessControlRoute>
                } />
                <Route path="/customers/:customerid" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <CustomerDetails />
                  </AccessControlRoute>
                }/>
                <Route path="/invoices" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Invoices />
                  </AccessControlRoute>
                } />
                <Route path="/addinvoice" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddInvoice />
                  </AccessControlRoute>
                } />
                <Route path="/invoices/:invoiceid" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <InvoiceDetails />
                  </AccessControlRoute>
                }/>
                <Route path="/quotations" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Quotations />
                  </AccessControlRoute>
                } />
                <Route path="/addquotation" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddQuotation />
                  </AccessControlRoute>
                } />
                <Route path="/editquotation/:id" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <EditQuotation />
                  </AccessControlRoute>
                } />
                <Route path="/qrcodegenerator" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <QRCodeGenerator />
                  </AccessControlRoute>
                } />
                <Route path="/todolist" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <ToDoList />
                  </AccessControlRoute>
                } />
                <Route path="/passwords" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Passwords />
                  </AccessControlRoute>
                } />
                <Route path="/dailyexpenses" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <DailyExpenses />
                  </AccessControlRoute>
                } />
                <Route path="/monthlyexpenses" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <MonthlyExpenses />
                  </AccessControlRoute>
                } />
                <Route path="/materialsinvestment" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <MaterialsInvestment />
                  </AccessControlRoute>
                } />
                <Route path="/payroll" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Payroll />
                  </AccessControlRoute>
                } />
                <Route path="/payments" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Payments />
                  </AccessControlRoute>
                } />
                <Route path="/appointments" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Appointments />
                  </AccessControlRoute>
                } />
                <Route path="/addappointment" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AddAppointment />
                  </AccessControlRoute>
                } />
                <Route path="/projects" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <Projects />
                  </AccessControlRoute>
                } />
                <Route path="/assetinvestment" element={
                  <AccessControlRoute userAccess={userAccess}>
                    <AssetInvestment />
                  </AccessControlRoute>
                } />
              </Routes>
            </div>
          </div>
          <PWAInstallPrompt />
          <PWAUpdateNotification />
          <PWAUpdater />
        </>
      ) : (
        <Login />
      )}
    </>
  )
}

export default App
