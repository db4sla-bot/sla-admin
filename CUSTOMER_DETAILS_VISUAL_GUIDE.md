# Customer Details Component - Visual Guide

## Component Structure

```
┌─────────────────────────────────────────────────────────┐
│  🏠 Hamburger | Customer Name                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  👤 Customer Avatar    Customer Name             │  │
│  │                        📞 Phone                  │  │
│  │                        📧 Email                  │  │
│  │                        📍 City                   │  │
│  │                                                  │  │
│  │     [💼 5 Works] [📦 12 Materials] [₹ Received] │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [👤 Profile] [💼 Work] [📦 Materials]            │  │
│  │ [💰 Payment] [💸 Expenses] [📊 Analytics]        │  │
│  │ [📝 Activity]                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │            TAB CONTENT AREA                      │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Tab Views

### 1️⃣ Profile Tab
```
┌─────────────────────────────────────────────────┐
│ Customer Information         [✏️ Edit Profile] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Name:     [👤 John Doe                     ]  │
│  Mobile:   [📞 9876543210                   ]  │
│  Email:    [📧 john@example.com             ]  │
│  Address:  [📍 123 Main Street              ]  │
│  City:     [📍 Bangalore                    ]  │
│  State:    [📍 Karnataka                    ]  │
│  Country:  [📍 India                        ]  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### 2️⃣ Work Tab
```
┌──────────────────────────────────────────────────┐
│ Work Management                                  │
├──────────────────────────────────────────────────┤
│ Add Work Form:                                   │
│ Work Title: [____________]  Category: [v]  [Add] │
│                                                  │
│ All Works (3):                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌───────────┐│
│ │ Balcony Work │ │ Bedroom Work │ │ Hall Work ││
│ │ ONGOING      │ │ COMPLETED    │ │ ONGOING   ││
│ │ Invisible    │ │ Mosquito Mesh│ │ Cloth     ││
│ │ Grills       │ │              │ │ Hangers   ││
│ │ 📅 12/10/25  │ │ 📅 10/10/25  │ │📅 15/10/25││
│ └──────────────┘ └──────────────┘ └───────────┘│
└──────────────────────────────────────────────────┘
```

---

### 3️⃣ Materials Tab
```
┌─────────────────────────────────────────────────────┐
│ Materials Management                                │
├─────────────────────────────────────────────────────┤
│ Add Material Form:                                  │
│ Work: [v]  Material: [🔍 Search...] Qty:[__] [Add] │
│                                                     │
│ Used Materials (5):                                 │
│ ┌─────────────────────────────────────────────────┐│
│ │Material │ Work    │Category│Qty│Price│Total│Date││
│ ├─────────────────────────────────────────────────┤│
│ │Wire Rope│Balcony  │Grills  │100│₹15 │₹1500│...││
│ │SS Cable │Balcony  │Grills  │50 │₹25 │₹1250│...││
│ │Mesh Net │Bedroom  │Mesh    │20 │₹30 │₹600 │...││
│ └─────────────────────────────────────────────────┘│
│                    Total Materials Cost: ₹3,350    │
└─────────────────────────────────────────────────────┘
```

---

### 4️⃣ Payment Tab
```
┌──────────────────────────────────────────────────┐
│ Payment Management                               │
├──────────────────────────────────────────────────┤
│ Record Payment Form:                             │
│ Work: [v] Price:[___] Paid:[___] Date:[__] [Add] │
│                                                  │
│ Payment History (2):                             │
│ ┌─────────────────┐ ┌─────────────────┐        │
│ │ Balcony Work    │ │ Bedroom Work    │        │
│ │ Cash            │ │ UPI             │        │
│ │ Total: ₹20,000  │ │ Total: ₹15,000  │        │
│ │ Paid:  ₹15,000 ✅│ │ Paid:  ₹15,000 ✅│        │
│ │ Balance: ₹5,000⚠│ │ Balance: ₹0     │        │
│ │ 📅 15/10/2025   │ │ 📅 12/10/2025   │        │
│ └─────────────────┘ └─────────────────┘        │
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │Total Revenue:₹35,000│Received:₹30,000│       ││
│ │                    Balance:₹5,000            ││
│ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

### 5️⃣ Expenses Tab
```
┌──────────────────────────────────────────────────────┐
│ Expenses Management                                  │
├──────────────────────────────────────────────────────┤
│ Add Expense Form:                                    │
│ Work:[v] Type:[v] Amount:[___] Date:[__] Desc:[...] │
│                                    [Add Expense]     │
│                                                      │
│ All Expenses (4):                                    │
│ ┌────────────────────────────────────────────────┐  │
│ │Work    │Type         │Amount │Date      │Desc  │  │
│ ├────────────────────────────────────────────────┤  │
│ │Balcony │Labour       │₹2,000 │15/10/25  │...   │  │
│ │Balcony │Transportation│₹500  │15/10/25  │...   │  │
│ │Bedroom │Labour       │₹1,500 │12/10/25  │...   │  │
│ │Hall    │Tools        │₹800   │16/10/25  │...   │  │
│ └────────────────────────────────────────────────┘  │
│                       Total Expenses: ₹4,800        │
└──────────────────────────────────────────────────────┘
```

---

### 6️⃣ Analytics Tab
```
┌────────────────────────────────────────────────────┐
│ Financial Analytics                                │
├────────────────────────────────────────────────────┤
│ Overall Summary:                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │📈 Revenue│ │📉 Cost   │ │💰 Profit │ │💳Balance││
│ │ ₹35,000  │ │ ₹8,150   │ │ ₹26,850  │ │ ₹5,000 ││
│ │          │ │ Mat:₹3,350│ │ (76.71%) │ │        ││
│ │          │ │ Exp:₹4,800│ │          │ │        ││
│ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                    │
│ Work-wise Analysis:                                │
│ ┌─────────────────────┐ ┌─────────────────────┐  │
│ │ Balcony Work        │ │ Bedroom Work        │  │
│ │ Invisible Grills    │ │ Mosquito Mesh       │  │
│ │ ─────────────────── │ │ ─────────────────── │  │
│ │ Revenue:    ₹20,000 │ │ Revenue:    ₹15,000 │  │
│ │ Received:   ₹15,000✅│ │ Received:   ₹15,000✅│  │
│ │ Balance:    ₹5,000⚠ │ │ Balance:    ₹0      │  │
│ │ ───────────────────│ │ ─────────────────── │  │
│ │ Materials:  ₹2,750  │ │ Materials:  ₹600    │  │
│ │ Expenses:   ₹2,500  │ │ Expenses:   ₹1,500  │  │
│ │ Total Cost: ₹5,250  │ │ Total Cost: ₹2,100  │  │
│ │ ───────────────────│ │ ─────────────────── │  │
│ │ Profit:₹14,750(73.8%)│ │ Profit:₹12,900(86%)│  │
│ │ 2 Materials        │ │ 1 Materials         │  │
│ │ 2 Expenses         │ │ 1 Expenses          │  │
│ └─────────────────────┘ └─────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

### 7️⃣ Activity Tab
```
┌──────────────────────────────────────────────────┐
│ Activity Log                  [➕ Add Activity]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 👤│ Profile Updated                          ││
│ │   │ Customer profile information was updated ││
│ │   │ 18/10/2025, 10:30 AM                    ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 💼│ Work Added                               ││
│ │   │ New work: Balcony Work (Invisible Grills)││
│ │   │ 17/10/2025, 2:15 PM                     ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 📦│ Material Added                           ││
│ │   │ Added 100 units of Wire Rope for Balcony││
│ │   │ 17/10/2025, 3:45 PM                     ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 💰│ Payment Recorded                         ││
│ │   │ Payment of ₹15,000 received for Balcony ││
│ │   │ 18/10/2025, 9:00 AM                     ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 💸│ Expense Added                            ││
│ │   │ Labour expense of ₹2,000 for Balcony    ││
│ │   │ 18/10/2025, 11:20 AM                    ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ 📝│ Follow-up Call                           ││
│ │   │ Called customer to check satisfaction   ││
│ │   │ 18/10/2025, 4:00 PM                     ││
│ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

---

## Color Coding

### Status Colors:
- 🟢 **Green** - Success, Profit, Completed, Paid
- 🟡 **Orange** - Warning, Pending, Balance Due
- 🔵 **Blue** - Info, Primary Actions, Ongoing
- 🔴 **Red** - Loss, Expenses, Cancel Actions
- ⚪ **Gray** - Neutral, Inactive, Placeholder

### Tab Colors:
- Profile: Blue (#3b82f6)
- Work: Purple (#8b5cf6)
- Materials: Orange (#f59e0b)
- Payment: Green (#10b981)
- Expenses: Red (#ef4444)
- Analytics: Blue (#3b82f6)
- Activity: Gray (#64748b)

---

## Interactive Elements

### Buttons:
- **Add/Save**: Green background with hover lift effect
- **Edit**: Blue background with hover lift effect
- **Cancel**: Red background with hover lift effect
- All buttons have smooth transitions and shadows

### Dropdowns:
- Searchable material dropdown with real-time filtering
- Work selection dropdown for materials, payments, expenses
- Category and type dropdowns for various inputs

### Cards:
- Hover effects with border color change and lift
- Gradient backgrounds for visual appeal
- Clear information hierarchy

### Tables:
- Alternating row hover states
- Fixed headers with gradient background
- Responsive scrolling on smaller screens

---

## Responsive Behavior

### Desktop (>1024px):
- Multi-column grid layouts
- Side-by-side cards
- Full table views

### Tablet (768px - 1024px):
- 2-column grids
- Stacked sections
- Scrollable tabs

### Mobile (<768px):
- Single column layout
- Vertical stacking
- Touch-friendly buttons
- Scrollable tables

---

## Data Flow Diagram

```
Customer Document
    ↓
┌───────────────────────────────────┐
│  Profile ─→ Update Customer Info  │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Work ─→ Create Work Entries      │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Materials ─→ Link to Works       │
│              Calculate Costs      │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Payment ─→ Link to Works         │
│            Track Revenue          │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Expenses ─→ Link to Works        │
│             Track Costs           │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Analytics ─→ Calculate:          │
│              Profit/Loss          │
│              Work-wise Reports    │
└───────────────────────────────────┘
    ↓
┌───────────────────────────────────┐
│  Activity ─→ Log All Actions      │
└───────────────────────────────────┘
```

---

## Key Features Summary

✅ **7 Comprehensive Tabs**
✅ **Real-time Data Updates**
✅ **Automatic Calculations**
✅ **Activity Logging**
✅ **Searchable Dropdowns**
✅ **Responsive Design**
✅ **Beautiful UI**
✅ **Toast Notifications**
✅ **Empty States**
✅ **Loading States**
✅ **Error Handling**
✅ **Data Persistence**
✅ **Work-wise Tracking**
✅ **Financial Analytics**

Your customer details component is production-ready! 🚀
