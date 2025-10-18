# Customer Details Component - Feature Documentation

## Overview
A comprehensive customer management component with 7 tabs for complete customer lifecycle tracking.

## Features by Tab

### 1. 📋 Profile Tab
**Purpose:** View and edit customer information

**Features:**
- Edit mode toggle with Save/Cancel buttons
- Real-time form validation
- Fields include:
  - Name, Mobile, Email
  - Address, City, State, Country
- Auto-save to Firebase
- Activity logging on profile updates

**Functionality:**
- Click "Edit Profile" to enable editing
- Make changes and click "Save" to update
- All changes are logged in Activity tab

---

### 2. 💼 Work Tab
**Purpose:** Manage customer projects/works

**Features:**
- Add new work with title and service category
- Service categories include:
  - Invisible Grills
  - Mosquito Mesh
  - Cloth Hangers
  - Artificial Grass
  - Bird Spikes
- View all works in grid layout
- Track work status (Ongoing/Completed)
- Display creation date for each work

**Functionality:**
- Enter work title and select category
- Click "Add Work" to save
- Works are stored in Firebase and used in other tabs
- Each work gets a unique ID for tracking

---

### 3. 📦 Materials Tab
**Purpose:** Track materials used for each work

**Features:**
- Select work from dropdown
- Search and select materials from inventory
- Material dropdown with search functionality
- Enter quantity used
- Auto-calculate total cost (quantity × unit price)
- View all materials in detailed table showing:
  - Material name
  - Associated work
  - Category
  - Quantity and pricing
  - Date added
- Total materials cost summary

**Functionality:**
- Select a work first
- Choose material from searchable dropdown
- Enter quantity
- Click "Add Material" to save
- Material costs are tracked for analytics

---

### 4. 💰 Payment Tab
**Purpose:** Track payments and revenue for each work

**Features:**
- Record payments work-wise
- Fields include:
  - Work selection
  - Total work price
  - Amount paid
  - Payment date
  - Payment mode (Cash/Card/UPI/Bank Transfer/Cheque)
  - Optional notes
- View payment history in cards showing:
  - Total price
  - Amount paid
  - Balance remaining
  - Payment mode and date
- Summary cards showing:
  - Total Revenue
  - Total Received
  - Total Balance

**Functionality:**
- Select work to record payment for
- Enter pricing and payment details
- System auto-calculates balance
- Multiple payments can be recorded per work
- All payments tracked for analytics

---

### 5. 💸 Expenses Tab
**Purpose:** Track expenses incurred for each work

**Features:**
- Add expenses work-wise
- Expense types include:
  - Labour
  - Transportation
  - Tools
  - Miscellaneous
  - Other
- Fields include:
  - Work selection
  - Expense type
  - Amount
  - Expense date
  - Optional description
- View all expenses in table format
- Total expenses summary

**Functionality:**
- Select work first
- Choose expense type and enter amount
- Add description if needed
- Click "Add Expense" to save
- Expenses are used in profit/loss calculations

---

### 6. 📊 Analytics Tab
**Purpose:** Financial analysis and insights

**Features:**

**Overall Summary Cards:**
- Total Revenue (all payments)
- Total Cost (materials + expenses)
- Total Profit/Loss with margin percentage
- Pending Balance

**Work-wise Analysis:**
- Individual cards for each work showing:
  - Revenue breakdown
  - Amount received vs pending
  - Materials cost
  - Expenses
  - Total cost
  - Profit/Loss with percentage
  - Materials and expenses count

**Functionality:**
- Auto-calculates all financial metrics
- Color-coded indicators (green for profit, red for loss)
- Real-time updates when data changes
- Clear visualization of each work's performance

---

### 7. 📝 Activity Tab
**Purpose:** Timeline of all actions and manual notes

**Features:**
- Automatic activity logging for:
  - Profile updates
  - Work additions
  - Material additions
  - Payments recorded
  - Expenses added
- Manual activity addition with:
  - Activity title
  - Activity type (Note/Call/Meeting/Email/Other)
  - Optional description
- Chronological timeline view
- Color-coded by activity type
- Timestamp for each activity

**Functionality:**
- All automated actions are logged automatically
- Click "Add Activity" to manually add notes
- Choose activity type from dropdown
- Activities help track customer interaction history

---

## Data Structure

### Customer Document in Firebase:
```javascript
{
  name: string,
  mobile: string,
  email: string,
  address: string,
  city: string,
  state: string,
  country: string,
  works: [
    {
      id: string,
      title: string,
      category: string,
      createdAt: string,
      status: string
    }
  ],
  materials: [
    {
      id: string,
      workId: string,
      workTitle: string,
      materialId: string,
      materialName: string,
      category: string,
      quantity: number,
      unitPrice: number,
      totalCost: number,
      addedAt: string
    }
  ],
  payments: [
    {
      id: string,
      workId: string,
      workTitle: string,
      totalPrice: number,
      amountPaid: number,
      balance: number,
      paymentDate: string,
      paymentMode: string,
      notes: string,
      createdAt: string
    }
  ],
  expenses: [
    {
      id: string,
      workId: string,
      workTitle: string,
      expenseType: string,
      amount: number,
      expenseDate: string,
      description: string,
      createdAt: string
    }
  ],
  activities: [
    {
      id: string,
      type: string,
      title: string,
      description: string,
      timestamp: string
    }
  ],
  createdAt: string,
  updatedAt: string
}
```

---

## Design Features

### UI/UX Highlights:
- **Modern Tab Navigation:** Clean, gradient-based tabs with hover effects
- **Responsive Design:** Works on all screen sizes
- **Color-Coded Status:** Different colors for profit/loss, paid/pending
- **Empty States:** Helpful messages when no data exists
- **Loading States:** Smooth loading animations
- **Toast Notifications:** Success/error feedback for all actions
- **Searchable Dropdowns:** Easy material selection with search
- **Card Layouts:** Visual cards for works, payments, analytics
- **Tables:** Organized data display for materials and expenses
- **Activity Timeline:** Visual timeline with icons and colors

### Color Scheme:
- Primary (Blue): `#3b82f6` - Actions, primary info
- Success (Green): `#10b981` - Profit, completed
- Warning (Orange): `#f59e0b` - Pending, balance
- Danger (Red): `#ef4444` - Loss, expenses
- Neutral: Grays for backgrounds and borders

---

## Navigation
Access from Customers list by clicking the eye icon on any customer row.

Route: `/customers/:customerid`

---

## Integration Points

### Firebase Collections Used:
1. **Customers** - Main customer document
2. **Materials** - Reference for material dropdown

### Data Flow:
1. User adds work → Stored in customer's works array
2. User adds material → References work ID, calculates cost
3. User records payment → Links to work, calculates balance
4. User adds expense → Links to work
5. Analytics tab → Calculates from materials, payments, expenses
6. All actions → Logged in activities array

---

## Future Enhancements Ideas:
- Export analytics as PDF
- Edit/Delete works, materials, payments, expenses
- Work completion status toggle
- Material stock checking before adding
- Payment reminders for pending balances
- Charts and graphs in analytics
- Filter activities by type
- Bulk operations

---

## Technical Notes:
- Uses React Hooks (useState, useEffect)
- Firebase Firestore for data persistence
- React Router for navigation
- Lucide React for icons
- React Toastify for notifications
- Responsive CSS Grid and Flexbox
- Follows your app's design language

---

## How to Use:

1. **Navigate to Customer Details** from Customers page
2. **Profile Tab**: Edit customer information as needed
3. **Work Tab**: Add all works/projects for this customer
4. **Materials Tab**: For each work, add materials used
5. **Payment Tab**: Record payments received for each work
6. **Expenses Tab**: Track all expenses for each work
7. **Analytics Tab**: View financial summary and work-wise breakdown
8. **Activity Tab**: Check history and add manual notes

The component automatically calculates profit/loss by:
`Profit = Total Revenue - (Total Materials Cost + Total Expenses)`

All data is saved to Firebase and persists across sessions.
