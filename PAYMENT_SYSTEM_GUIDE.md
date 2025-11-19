# SMMTZ Payment System Setup Guide

## Overview

The SMMTZ platform now includes a complete deposit/payment system using the FastLipa payment gateway with polling-based transaction status verification. This document outlines the setup and usage.

## System Architecture

### Components

1. **PaymentService** (`src/services/PaymentService.js`)
   - Handles all FastLipa API calls
   - Methods: `getBalance()`, `createTransaction()`, `getTransactionStatus()`
   - Phone number formatting and validation

2. **Deposit Page** (`src/pages/Deposit.js`)
   - User-friendly deposit form
   - Responsive design (mobile/tablet/desktop)
   - Real-time transaction status polling
   - 3-minute timeout for pending transactions

3. **Transactions Page** (`src/pages/Transactions.js`)
   - Transaction history display
   - Filter by status (Completed/Pending/Failed)
   - Transaction summary statistics

4. **AdminBalance Component** (`src/pages/AdminBalance.js`)
   - Display admin account balance from FastLipa
   - 5-minute auto-refresh
   - Manual refresh button

5. **AuthContext Updates** (`src/context/AuthContext.js`)
   - `userBalance` state management
   - `getUserBalance()` - fetch current balance
   - `updateUserBalance()` - update after deposit
   - `withdrawFromBalance()` - for future orders

## Setup Instructions

### 1. Environment Configuration

Update your `.env` file:

```env
REACT_APP_FASTLIPA_API_KEY=FastLipa_yIPdGwsqFyINdHiLGRZjVr
```

### 2. Firestore Schema

#### User Document Structure

```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: string, // 'user' | 'admin'
  balance: number, // in smallest currency unit (cents)
  lastDeposit: timestamp,
  lastTransactionId: string,
  createdAt: timestamp,
  ...other fields
}
```

#### Transactions Subcollection

```
/users/{userId}/transactions/{tranID}
{
  tranID: string,        // "pay_xxxxx" from FastLipa
  status: string,        // "COMPLETED" | "PENDING" | "FAILED"
  amount: number,        // in smallest currency unit
  phoneNumber: string,   // formatted phone number
  createdAt: timestamp,
  completedAt: timestamp // null if not completed
}
```

### 3. Firestore Rules Update

Add these rules to allow transactions subcollection access:

```javascript
// In firestore.rules

match /users/{userId}/transactions/{transactionId} {
  // Users can read their own transactions
  allow read: if request.auth.uid == userId;
  
  // Users can create transactions (deposit system)
  allow create: if request.auth.uid == userId;
  
  // Only backend can update transaction status
  // In production, use Cloud Functions to update
  allow update: if false; // Frontend doesn't update directly
}
```

## Transaction Flow

### 1. User Initiates Deposit

1. User navigates to `/deposit`
2. Fills in: phone number, amount, full name
3. Clicks "Continue to Payment"
4. Confirmation dialog shows transaction details
5. Clicks "Confirm Deposit"

### 2. Transaction Created

1. `createTransaction()` API call to FastLipa
2. FastLipa returns `tranID` and status `PENDING`
3. Transaction record saved to Firestore with `PENDING` status
4. Push notification sent to user's phone
5. Polling begins

### 3. Status Polling (3-Minute Window)

**Polling Process:**
- Checks every 5 seconds using `getTransactionStatus(tranID)`
- Displays countdown timer (180 seconds = 3 minutes)
- Shows real-time status badge

**Possible Outcomes:**

#### ✓ COMPLETED
- User confirms payment on phone
- `payment_status` returns `COMPLETED`
- User balance automatically updated
- Transaction marked as COMPLETED
- Success message shown
- Balance reflects deposit

#### ✗ FAILED
- Payment declined/cancelled by user
- Status returned as `FAILED`
- Transaction marked as FAILED
- Error message shown
- Balance unchanged

#### ⏱ TIMEOUT
- 3 minutes elapsed without completion
- Polling stops
- Transaction marked as FAILED
- User prompted to try again

### 4. Transaction Recorded

Each transaction is stored with:
```javascript
{
  tranID: "pay_xxxxx",
  status: "COMPLETED" | "PENDING" | "FAILED",
  amount: 5000,  // in smallest unit (= 50 TZS)
  phoneNumber: "255695123456",
  createdAt: new Date(),
  completedAt: new Date()  // only if COMPLETED
}
```

## API Integration

### FastLipa Endpoints Used

#### 1. Get Balance
```
GET https://api.fastlipa.com/api/balance
Headers: Authorization: Bearer {API_KEY}
```

Response:
```json
{
  "status": "success",
  "data": {
    "balance": 150000,
    "last_transaction": "2025-11-19T10:30:00Z"
  }
}
```

#### 2. Create Transaction
```
POST https://api.fastlipa.com/api/create-transaction
Headers: 
  Authorization: Bearer {API_KEY}
  Content-Type: application/json

Body:
{
  "number": "0695123456",
  "amount": 5000,
  "name": "John Doe"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "tranID": "pay_JNkLgHPcMW",
    "amount": 5000,
    "number": "255695123456",
    "network": "AIRIEL",
    "status": "PENDING",
    "time": "2025-11-19T00:36:18Z"
  }
}
```

#### 3. Check Transaction Status
```
GET https://api.fastlipa.com/api/status-transaction?tranid={tranID}
Headers: Authorization: Bearer {API_KEY}
```

Response:
```json
{
  "status": "success",
  "data": {
    "tranid": "pay_gCZf7FUry",
    "payment_status": "COMPLETED",
    "amount": "200",
    "network": "Unknown",
    "time": "2025-11-10T09:01:00Z"
  }
}
```

## Features

### Deposit Page Features
- ✅ Form validation (phone, amount, name)
- ✅ Phone number auto-formatting
- ✅ Quick amount buttons (5K, 10K, 20K, 50K TZS)
- ✅ Real-time balance display
- ✅ Confirmation dialog
- ✅ Real-time polling with countdown timer
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Error handling and user feedback

### Transaction History Features
- ✅ Display all user transactions
- ✅ Filter by status (All/Completed/Pending/Failed)
- ✅ Transaction summary (total count, total amount)
- ✅ Formatted dates and currency
- ✅ Status badges with color coding
- ✅ Transaction details (ID, phone, amount, date)
- ✅ Responsive card design

### Admin Balance Features
- ✅ Display FastLipa account balance
- ✅ Auto-refresh every 5 minutes
- ✅ Manual refresh button
- ✅ Error handling
- ✅ Loading state
- ✅ Last updated timestamp

## Routes

```javascript
GET  /                    // Home
GET  /login              // Login
GET  /register           // Register
GET  /forgot-password    // Password recovery
GET  /reset-password     // Reset password
GET  /dashboard          // User dashboard
GET  /deposit            // Deposit/payment page
GET  /transactions       // Transaction history
GET  /admin-dashboard    // Admin panel
```

## Files Created/Modified

### New Files
- `src/services/PaymentService.js` - Payment API service
- `src/pages/Deposit.js` - Deposit form and polling
- `src/pages/Transactions.js` - Transaction history
- `src/pages/AdminBalance.js` - Admin balance display
- `src/styles/Deposit.css` - Deposit page styling
- `src/styles/Transactions.css` - Transactions page styling

### Modified Files
- `src/context/AuthContext.js` - Added balance management
- `src/pages/AdminDashboard.js` - Added balance section
- `src/styles/Dashboard.css` - Added admin balance styling
- `src/App.js` - Added deposit and transactions routes

## Testing Checklist

### Manual Testing

- [ ] User can access `/deposit` page
- [ ] Form validation works (phone, amount, name)
- [ ] Quick amount buttons populate the field
- [ ] Confirmation dialog displays correctly
- [ ] Transaction created and saved to Firestore
- [ ] Polling countdown timer displays
- [ ] Status badge updates in real-time
- [ ] User balance updates on COMPLETED
- [ ] Transaction history shows all deposits
- [ ] Filter by status works
- [ ] Admin balance displays correctly
- [ ] Mobile responsive on all screen sizes

### Error Scenarios

- [ ] Invalid phone number shows error
- [ ] Empty fields validation works
- [ ] Network error handling
- [ ] 3-minute timeout marks transaction as FAILED
- [ ] Transaction with FAILED status doesn't update balance

## Security Considerations

1. **API Key**: Stored in `.env` file (frontend only)
   - Note: In production, should be server-side only
   
2. **Transaction Verification**: 
   - Verify tranID format before polling
   - Validate amount matches original request
   
3. **Balance Updates**:
   - Only update on COMPLETED status
   - Use Firestore transactions for atomicity
   
4. **Rate Limiting**:
   - Polling every 5 seconds (12 requests per minute)
   - 3-minute timeout limits max requests to 36

## Future Enhancements

1. **Backend Webhook Handler** (Optional)
   - Replace polling with webhook callbacks from FastLipa
   - Immediate balance updates
   - Reduced API calls

2. **SMS Notifications**
   - Send SMS on transaction completion
   - Send SMS on transaction failure

3. **Deposit Limits**
   - Min/max deposit amounts
   - Daily deposit limits per user

4. **Payment Methods**
   - Multiple payment gateway support
   - Credit card payments
   - Bank transfers

5. **Transaction Receipts**
   - Generate PDF receipts
   - Email receipts to user

6. **Analytics**
   - Deposit trends
   - Success rate metrics
   - User statistics

## Troubleshooting

### Transaction Stuck in PENDING

**Cause**: User didn't confirm on phone or network issue
**Solution**: Wait for 3-minute timeout or manual retry

### Balance Not Updated

**Cause**: Transaction not marked as COMPLETED
**Solution**: Check Firestore transaction status, verify API response

### Phone Number Format Error

**Cause**: Invalid format entered
**Solution**: Use format 0xxxxxxxx or 255xxxxxxxx (9-12 digits)

### API Key Invalid

**Cause**: Wrong or expired key in .env
**Solution**: Verify `REACT_APP_FASTLIPA_API_KEY` is correct

## Support

For issues or questions:
1. Check Firestore console for transaction records
2. Review browser console for API errors
3. Verify FastLipa API key is valid
4. Check network tab for API responses

