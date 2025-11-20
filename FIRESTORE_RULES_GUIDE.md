# Firestore Rules Setup Guide

This guide explains the Firestore security rules implemented for the SMMTZ platform.

## Overview

The Firestore rules ensure that:
- Users can only access their own data
- Admins have full access
- Referral system works securely
- Withdrawal requests are properly managed

## Key Rules

### 1. Users Collection

**Read Access:**
- Users can read their own document
- Admins can read all user documents
- Authenticated users can query users by `referralCode` (for referral validation)

**Write Access:**
- Users can create their own account during registration
- Users can update their own profile (except role, suspended, referralCode, referrerId)
- Users can update their own `referralEarnings` and `totalReferrals` (for system updates)
- Users can update other users' `referralEarnings` and `totalReferrals` (for referral commissions)
  - **Security Note:** This allows crediting referrers when orders are placed. Ideally, this should be moved to Cloud Functions for better security.

**Validation:**
- `referralEarnings` and `totalReferrals` must be integers >= 0
- When updating other users, values can only increase (prevents abuse)

### 2. Orders Subcollection

**Read Access:**
- Users can read their own orders
- Admins can read all orders

**Write Access:**
- Users can create their own orders
- Users can update their own orders (status, updatedAt)
- Admins can update any order

**Validation:**
- Orders must have `cost` and `quantity` as integers

### 3. Withdrawals Collection

**Read Access:**
- Users can read their own withdrawal requests
- Admins can read all withdrawals

**Write Access:**
- Users can create withdrawal requests (status must be 'pending')
- Admins can update withdrawal status

**Validation:**
- Withdrawal amount must be an integer
- Status must be 'pending' on creation

### 4. Services Collection

**Read Access:**
- All authenticated users can read services
- All authenticated users can query/list services

**Write Access:**
- Only admins can create, update, or delete services

### 5. Transactions Subcollection

**Read Access:**
- Users can read their own transactions
- Admins can read all transactions

**Write Access:**
- Users can create and update their own transactions

## Security Considerations

### Referral Earnings Updates

Currently, the system allows users to update other users' `referralEarnings` when crediting referral commissions. This is done client-side in `creditReferralEarnings()`.

**Recommended Improvement:**
Move referral commission crediting to Cloud Functions for better security:
1. Create a Cloud Function triggered by order creation
2. Calculate and credit referral commission server-side
3. Remove client-side ability to update other users' earnings

### Index Requirements

For optimal performance, create these indexes:

1. **Users Collection:**
   - `referralCode` (for referral code lookups)

2. **Withdrawals Collection:**
   - `userId` + `status` + `createdAt` (for user withdrawal queries)
   - `status` + `createdAt` (for admin withdrawal queries)

3. **Services Collection:**
   - `enabled` + `category` (for service filtering)

## Deploying Rules

To deploy these rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

Or use the Firebase Console:
1. Go to Firebase Console
2. Select your project
3. Navigate to Firestore Database
4. Click on "Rules" tab
5. Paste the rules from `firestore.rules`
6. Click "Publish"

## Testing Rules

Use the Firebase Console Rules Playground to test:
1. Go to Firestore Rules
2. Click "Rules Playground"
3. Test different scenarios:
   - User reading own data
   - User trying to read other user's data
   - Admin operations
   - Referral code queries

## Troubleshooting

### Common Permission Errors

1. **"Missing or insufficient permissions"**
   - Check if user is authenticated
   - Verify the user is trying to access their own data
   - Check if required fields are present

2. **"Index required"**
   - Create the required composite indexes
   - Use the link provided in the error message

3. **"Referral code query fails"**
   - Ensure `referralCode` index exists
   - Check if user is authenticated

## Future Improvements

1. **Cloud Functions for Referral Commissions**
   - Move referral earnings updates to server-side
   - Better security and audit trail

2. **Role-Based Access Control**
   - More granular permissions
   - Custom roles beyond admin/user

3. **Audit Logging**
   - Track all sensitive operations
   - Log referral earnings updates

