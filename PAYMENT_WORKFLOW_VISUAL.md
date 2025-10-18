# Payment Installment Workflow - Visual Guide

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: CREATE PAYMENT RECORD
═══════════════════════════════════════
┌─────────────────────────────────┐
│  Select Work: Invisible Grills  │
│  Total Amount: ₹10,00,000       │
│  [Create Payment Record] ───────┼──────┐
└─────────────────────────────────┘      │
                                          │
                                          ▼
                                    ┌─────────────────┐
                                    │  Payment Record │
                                    │   Created ✓     │
                                    │  Status: PENDING│
                                    └────────┬────────┘
                                             │
                                             │
STEP 2: ADD INSTALLMENTS                     │
═══════════════════════════════════          │
                                             │
┌────────────────────────────────────────────┘
│
▼
┌─────────────────────────────────┐
│   INSTALLMENT #1 (Advance)      │
├─────────────────────────────────┤
│  Payment Record: Invisible Grills│
│  Amount: ₹3,00,000              │
│  Date: 15/01/2025               │
│  Mode: Cash                     │
│  Notes: Advance payment         │
│  [Add Installment] ─────────────┼────┐
└─────────────────────────────────┘    │
                                        │
                                        ▼
                                  ┌──────────────┐
                                  │   Updated:   │
                                  │ Paid: ₹3L    │
                                  │ Balance: ₹7L │
                                  │Status:PARTIAL│
                                  └──────┬───────┘
                                         │
                                         │
┌────────────────────────────────────────┘
│
▼
┌─────────────────────────────────┐
│   INSTALLMENT #2 (Mid Payment)  │
├─────────────────────────────────┤
│  Payment Record: Invisible Grills│
│  Amount: ₹4,00,000              │
│  Date: 20/02/2025               │
│  Mode: UPI                      │
│  Notes: Mid payment             │
│  [Add Installment] ─────────────┼────┐
└─────────────────────────────────┘    │
                                        │
                                        ▼
                                  ┌──────────────┐
                                  │   Updated:   │
                                  │ Paid: ₹7L    │
                                  │ Balance: ₹3L │
                                  │Status:PARTIAL│
                                  └──────┬───────┘
                                         │
                                         │
┌────────────────────────────────────────┘
│
▼
┌─────────────────────────────────┐
│   INSTALLMENT #3 (Final)        │
├─────────────────────────────────┤
│  Payment Record: Invisible Grills│
│  Amount: ₹3,00,000              │
│  Date: 15/03/2025               │
│  Mode: Bank Transfer            │
│  Notes: Final payment           │
│  [Add Installment] ─────────────┼────┐
└─────────────────────────────────┘    │
                                        │
                                        ▼
                                  ┌──────────────┐
                                  │   COMPLETE   │
                                  │ Paid: ₹10L   │
                                  │ Balance: ₹0  │
                                  │Status: PAID ✓│
                                  └──────────────┘
```

---

## 📱 UI Flow

```
PAYMENT TAB VIEW
═══════════════════════════════════════════════════════════

┌───────────────────────────────────────────────────────┐
│                   Payment Management                   │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ Create Payment Record                                 │
├───────────────────────────────────────────────────────┤
│ Select Work:      [Dropdown: Invisible Grills     ▼]  │
│ Total Amount:     ₹ [10,00,000                    ]   │
│                                                        │
│         [Create Payment Record Button]                │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│ Payment Records (3)            [+ Add Installment]    │
└───────────────────────────────────────────────────────┘

┌─────────────────────────┬─────────────────────────────┐
│ Invisible Grills   PAID │ Mosquito Mesh    PARTIAL    │
├─────────────────────────┼─────────────────────────────┤
│ Total:    ₹10,00,000    │ Total:    ₹5,00,000         │
│ Paid:     ₹10,00,000 ✓  │ Paid:     ₹3,00,000 ✓       │
│ Balance:  ₹0            │ Balance:  ₹2,00,000 ⚠       │
│ Installments: 3         │ Installments: 1             │
├─────────────────────────┼─────────────────────────────┤
│ Installment History:    │ Installment History:        │
│ #1 Cash     ₹3,00,000   │ #1 UPI      ₹3,00,000       │
│ #2 UPI      ₹4,00,000   │                             │
│ #3 Bank     ₹3,00,000   │                             │
├─────────────────────────┼─────────────────────────────┤
│ Created: 10/01/2025     │ Created: 15/02/2025         │
└─────────────────────────┴─────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│  Total Revenue      Total Received     Total Balance  │
│  ₹15,00,000         ₹13,00,000        ₹2,00,000       │
└───────────────────────────────────────────────────────┘
```

---

## 🎯 Click Flow: Adding First Installment

```
1. USER VIEW
   ┌────────────────────────────┐
   │ Payment Records (1)        │
   │         [+ Add Installment]│ ← Click here
   └────────────────────────────┘

2. FORM APPEARS
   ┌─────────────────────────────────────────┐
   │ Add Installment Payment             [X] │
   ├─────────────────────────────────────────┤
   │ Select Payment Record: [Choose      ▼] │ ← Select payment
   │ Amount Received: ₹ [                 ] │ ← Enter amount
   │ Payment Date: [15/01/2025            ] │
   │ Payment Mode: [Cash                 ▼] │
   │ Notes: [Advance payment              ] │
   │                                         │
   │        [Add Installment Button]         │ ← Click to save
   └─────────────────────────────────────────┘

3. VALIDATION
   ┌────────────────────────────────────┐
   │  Checking:                         │
   │  ✓ Payment record selected         │
   │  ✓ Amount entered                  │
   │  ✓ Amount ≤ Remaining balance      │
   └────────────────────────────────────┘

4. SUCCESS
   ┌────────────────────────────────────┐
   │  ✓ Installment Added Successfully  │
   │  Card updated with new installment │
   │  Balance recalculated              │
   │  Activity logged                   │
   └────────────────────────────────────┘

5. UPDATED VIEW
   ┌─────────────────────────────────────┐
   │ Invisible Grills        [PARTIAL]   │
   ├─────────────────────────────────────┤
   │ Total Amount:    ₹10,00,000         │
   │ Amount Paid:     ₹ 3,00,000 ✓       │
   │ Balance:         ₹ 7,00,000 ⚠       │
   │ Installments:    1                  │
   ├─────────────────────────────────────┤
   │ Installment History:                │
   │ #1 - Cash      ₹3,00,000            │
   │ 15/01/2025     Advance payment      │
   └─────────────────────────────────────┘
```

---

## 🔍 Dropdown Selection View

When clicking "Select Payment Record" in installment form:

```
┌──────────────────────────────────────────────────┐
│ Select Payment Record:                        ▼ │
├──────────────────────────────────────────────────┤
│ > Invisible Grills - Remaining: ₹7,00,000        │
│ > Mosquito Mesh - Remaining: ₹2,00,000           │
│ > Cloth Hangers - Remaining: ₹5,00,000           │
└──────────────────────────────────────────────────┘
         ↑
         Shows remaining balance for each!
```

---

## 📊 Status Badge Evolution

```
NO INSTALLMENTS
┌─────────────────────────┐
│ Work Title    [PENDING] │ ← Red badge
│ Paid: ₹0                │
│ Balance: ₹10,00,000     │
└─────────────────────────┘

FIRST INSTALLMENT
┌─────────────────────────┐
│ Work Title    [PARTIAL] │ ← Orange badge
│ Paid: ₹3,00,000         │
│ Balance: ₹7,00,000      │
└─────────────────────────┘

MORE INSTALLMENTS
┌─────────────────────────┐
│ Work Title    [PARTIAL] │ ← Still orange
│ Paid: ₹7,00,000         │
│ Balance: ₹3,00,000      │
└─────────────────────────┘

FULL PAYMENT
┌─────────────────────────┐
│ Work Title      [PAID]  │ ← Green badge
│ Paid: ₹10,00,000        │
│ Balance: ₹0             │
└─────────────────────────┘
```

---

## 🧮 Analytics Update Flow

```
OLD CALCULATION (Before)
─────────────────────────
Revenue = Payment.totalPrice
Received = Payment.amountPaid
Profit = Received - Costs

NEW CALCULATION (After)
─────────────────────────
Revenue = Payment.totalAmount
Received = Sum(Payment.installments[].amount)
Balance = Revenue - Received
Profit = Received - Costs

EXAMPLE:
┌────────────────────────────────────────┐
│ Payment: Invisible Grills              │
│ Total Amount: ₹10,00,000               │
│ Installments:                          │
│   - ₹3,00,000 (Cash)                   │
│   - ₹4,00,000 (UPI)                    │
│   - ₹3,00,000 (Bank)                   │
│ ─────────────────────────────────────  │
│ Received: ₹10,00,000                   │
│ Materials: ₹6,00,000                   │
│ Expenses: ₹1,00,000                    │
│ ─────────────────────────────────────  │
│ Profit: ₹3,00,000 ✓                    │
└────────────────────────────────────────┘
```

---

## ⚡ Quick Reference

### Create Payment Record:
- Work Selection → Total Amount → Create

### Add Installment:
- Click "Add Installment" → Select Record → Enter Amount → Save

### View Status:
- Green = Fully Paid
- Orange = Partially Paid
- Red = Pending Payment

### Track Progress:
- Check installment count
- Monitor balance
- Review installment history

---

## 🎨 Color Legend

| Element | Color | Indicates |
|---------|-------|-----------|
| PAID Badge | 🟢 Green | 100% payment received |
| PARTIAL Badge | 🟡 Orange | Partial payment received |
| PENDING Badge | 🔴 Red | No payment yet |
| Amount Paid | 🟢 Green | Money received |
| Balance | 🟠 Orange | Money pending |
| Total Amount | 🔵 Blue | Work value |

---

**This visual guide complements the main documentation for easier understanding!**
