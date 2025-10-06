import React, { useEffect, useState } from 'react'
import './App.css'
import Logo from './assets/logo.jpg'
import { MenuItemsData } from './SLAData'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
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
import UpdateMaterials from './Pages/UpdateMaterials/UpdateMaterials'
import ToDoList from './Pages/ToDoList/ToDoList'
import DailyExpenses from './Pages/DailyExpenses/DailyExpenses'
import Inbox from './Pages/Inbox/Inbox'
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
import PWAInstallPrompt from './Components/PWAInstallPrompt/PWAInstallPrompt'

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userAccess, setUserAccess] = useState([])
  const [filteredMenuItems, setFilteredMenuItems] = useState([])
  const location = useLocation();

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

                    <div className="dashboard-menu-con">
                      <NavLink className="dashboard-menu-item" to="/inbox" onClick={handleMenuLinkClick}>
                        <InboxIcon className="id-icon" /> Inbox{' '}
                        <ChevronRight className="icon-arrow" />
                      </NavLink>
                    </div>
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/customersreport" element={<CustomersReport />} />
                <Route path="/timesheetreport" element={<TimesheetReport />} />
                <Route path="/leadsreport" element={<LeadsReport />} />
                <Route path="/materialsreport" element={<MaterialsReport />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/addleads" element={<AddLeads />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/:employeeId"element={<EmployeeDetails />}/>
                <Route path="/addemployee" element={<AddEmployee />} />
                <Route path="/addmaterial" element={<AddMaterial />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/updatematerials" element={<UpdateMaterials />} />
                <Route path="/updatetimesheet" element={<UpdateTimeSheet />} />
                <Route path="/addcustomer" element={<AddCustomer />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:customerid"element={<CustomerDetails />}/>
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/addinvoice" element={<AddInvoice />} />
                <Route path="/invoices/:invoiceid"element={<InvoiceDetails />}/>
                <Route path="/quotations" element={<Quotations />} />
                <Route path="/addquotation" element={<AddQuotation />} />
                <Route path="/editquotation/:id" element={<EditQuotation />} />
                <Route path="/qrcodegenerator" element={<QRCodeGenerator />} />
                <Route path="/todolist" element={<ToDoList />} />
                <Route path="/passwords" element={<Passwords />} />
                <Route path="/dailyexpenses" element={<DailyExpenses />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/materialsinvestment" element={<MaterialsInvestment />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/addappointment" element={<AddAppointment />} />
              </Routes>
            </div>
          </div>
          <PWAInstallPrompt />
        </>
      ) : (
        <Login />
      )}
    </>
  )
}

export default App
