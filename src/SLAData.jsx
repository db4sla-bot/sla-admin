import { BellRing, BriefcaseBusiness, CalendarDays, Cast, Chrome, ClipboardClock, Facebook, GlobeLock, IndianRupee, Instagram, LayoutDashboard, LayoutGrid, User, User2, Users, Wrench } from "lucide-react";

export const MenuItemsData = [
    {
        // reports: {
        //     id: 'reports',
        //     label: 'Reports',
        //     icon: <Cast className="icon" />,
        //     link: false,
        //     subItems: [
        //         {
        //             id: 'customersreport',
        //             label: 'Customers Report',
        //             link: '/customersreport'
        //         },
        //         {
        //             id: 'materialreport',
        //             label: 'Materials Report',
        //             link: '/materialsreport'
        //         },
        //         {
        //             id: 'leadsreport',
        //             label: 'Leads Report',
        //             link: '/leadsreport'
        //         },
        //         {
        //             id: 'timesheetreport',
        //             label: 'Timesheet Report',
        //             link: '/timesheetreport'
        //         },
        //     ]
        // },
        investments: {
            id: 'investments',
            label: 'Investments',
            icon: <IndianRupee className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'materialinvestment',
                    label: 'Materials Investment',
                    link: '/materialsinvestment'
                },
                {
                    id: 'assetinvestment',
                    label: 'Asset Investment',
                    link: '/assetinvestment'
                },
                {
                    id: 'payroll',
                    label: 'Payroll',
                    link: '/payroll'
                }
            ]
        },
        payments: {
            id: 'billing',
            label: 'Billing',
            icon: <IndianRupee className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'payments',
                    label: 'Payments',
                    link: '/payments'
                },
                {
                    id: 'invoice',
                    label: 'Invoice List',
                    link: '/invoices'
                },
                {
                    id: 'addinvoice',
                    label: 'Add Invoice',
                    link: '/addinvoice'
                },
                {
                    id: 'addquotation',
                    label: 'Add Quotation',
                    link: '/addquotation'
                },
                {
                    id: 'quotations',
                    label: 'Quotations List',
                    link: '/quotations'
                },
            ]
        },
        customers: {
            id: 'customers',
            label: 'Customers',
            icon: <Users className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'customerlist',
                    label: 'Customers',
                    link: '/customers'
                },
                {
                    id: 'addcustomer',
                    label: 'Add Customer',
                    link: '/addcustomer'
                },
            ]
        },
        leads: {
            id: 'leads',
            label: 'Leads',
            icon: <BellRing className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'leadslist',
                    label: 'Leads',
                    link: '/leads'
                },
                {
                    id: 'addlead',
                    label: 'Add Lead',
                    link: '/addleads'
                },
            ]
        },
        materials: {
            id: 'materials',
            label: 'Materials',
            icon: <Wrench className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'materialslist',
                    label: 'Materials',
                    link: '/materials'
                },
                {
                    id: 'addmaterial',
                    label: 'Add Material',
                    link: '/addmaterial'
                }
            ]
        },
        timesheet: {
            id: 'timesheet',
            label: 'Timesheet',
            icon: <ClipboardClock className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'updatetimesheet',
                    label: 'Update Timesheet',
                    link: '/updatetimesheet'
                },
            ]
        },
        appointments: {
            id: 'appointments',
            label: 'Appointments',
            icon: <CalendarDays className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'bookanappointment',
                    label: 'Add Appointment',
                    link: '/addappointment'
                },
                {
                    id: 'appointments',
                    label: 'Appointments',
                    link: '/appointments'
                }
            ]
        },
        employees: {
            id: 'employees',
            label: 'Employees',
            icon: <Users className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'employeeslist',
                    label: 'Employees',
                    link: '/employees'
                },
                {
                    id: 'addemployee',
                    label: 'Add Employee',
                    link: '/addemployee'
                },
            ]
        },
        applications: {
            id: 'applications',
            label: 'Applications',
            icon: <LayoutGrid className="icon" />,
            link: false,
            subItems: [
                {
                    id: 'dailyexpenses',
                    label: 'Daily Expenses',
                    link: '/dailyexpenses'
                },
                {
                    id: 'monthlyexpenses',
                    label: 'Monthly Expenses',
                    link: '/monthlyexpenses'
                },
                {
                    id: 'todolist',
                    label: 'Todo List',
                    link: '/todolist'
                },
                {
                    id: 'passwords',
                    label: 'Passwords',
                    link: '/passwords'
                },
                {
                    id: 'qrcodegenerator',
                    label: 'QR Code Generator',
                    link: '/qrcodegenerator'
                },
            ]
        }
    }
]

export const LeadStatus = [
    {
        id: 'new',
        label: "New",
        labelColor: '#3454d1',
        icon: false
    },
    {
        id: 'followup',
        label: "Follow Up",
        labelColor: '#ffa21d',
        icon: false
    },
    {
        id: 'sitevisit',
        label: "Site Visit",
        labelColor: '#17c666',
        icon: false
    },
    {
        id: 'quotation',
        label: "Quotation",
        labelColor: '#6610f2',
        icon: false
    },
    {
        id: 'customer',
        label: "Customer",
        labelColor: '#17c666',
        icon: false
    },
    {
        id: 'declines',
        label: "Declined",
        labelColor: '#ea4d4d',
        icon: false
    },
]

export const LeadSource = [
    {
        id: 'google',
        label: "Google",
        icon: true,
        iconlabel : <Chrome className="icon" />
    },
    {
        id: 'facebook',
        label: "Facebook",
        icon: true,
        iconlabel : <Facebook className="icon" />
    },
    {
        id: 'justdial',
        label: "Just Dial",
        icon: true,
        iconlabel : <GlobeLock className="icon" />
    },
    {
        id: 'reference',
        label: "Reference",
        icon: true,
        iconlabel : <User className="icon" />
    },
    {
        id: 'marketers',
        label: "Marketers",
        icon: true,
        iconlabel : <Users className="icon" />
    },
]

export const LeadServices = [
    {
        id: 'invisiblegrills',
        label: "Invisible Grills",
        labelColor: '#3454d1',
        icon: false
    },
    {
        id: 'mosquitomesh',
        label: "Mosquito Mesh",
        labelColor: '#ffa21d',
        icon: false
    },
    {
        id: 'clothhangers',
        label: "Cloth Hangers",
        labelColor: '#17c666',
        icon: false
    },
    {
        id: 'artificialgrass',
        label: "Artificial Grass",
        labelColor: '#6610f2',
        icon: false
    },
    {
        id: 'birdspikes',
        label: "Bird Spikes",
        labelColor: '#17c666',
        icon: false
    },
]

// Route Access Mapping - maps routes to required access permissions
export const RouteAccessMapping = {
    // Dashboard is accessible to all
    '/': null,
    
    // Customers routes
    '/customers': 'customers',
    '/addcustomer': 'customers',
    '/customers/*': 'customers',
    
    // Leads routes
    '/leads': 'leads',
    '/addleads': 'leads',
    
    // Materials routes
    '/materials': 'materials',
    '/addmaterial': 'materials',
    
    // Timesheet routes
    '/updatetimesheet': 'timesheet',
    
    // Appointments routes
    '/appointments': 'appointments',
    '/addappointment': 'appointments',
    
    // Employees routes
    '/employees': 'employees',
    '/addemployee': 'employees',
    '/employees/*': 'employees',
    
    // Billing routes
    '/payments': 'payments',
    '/invoices': 'payments',
    '/addinvoice': 'payments',
    '/invoices/*': 'payments',
    '/addquotation': 'payments',
    '/quotations': 'payments',
    '/editquotation/*': 'payments',
    
    // Investments routes
    '/materialsinvestment': 'investments',
    '/assetinvestment': 'investments',
    '/payroll': 'investments',
    
    // Applications routes
    '/dailyexpenses': 'applications',
    '/monthlyexpenses': 'applications',
    '/todolist': 'applications',
    '/passwords': 'applications',
    '/qrcodegenerator': 'applications',
    
    // Projects route
    '/projects': null, // Accessible to all logged-in users
    
    // Reports routes (currently commented out in menu, but keeping for future)
    '/customersreport': 'customers',
    '/materialsreport': 'materials',
    '/leadsreport': 'leads',
    '/timesheetreport': 'timesheet'
}