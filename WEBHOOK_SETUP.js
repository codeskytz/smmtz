/**
 * Firebase Cloud Function for handling FastLipa payment webhooks
 * 
 * This function should be deployed as a Cloud Function and configured as the webhook endpoint
 * in the FastLipa payment gateway settings.
 * 
 * Deployment:
 * 1. Copy this file to functions/src/webhooks.js
 * 2. Update functions/index.js to export this function
 * 3. Deploy with: firebase deploy --only functions
 * 
 * Configuration:
 * Set webhook URL in FastLipa dashboard to: https://region-projectId.cloudfunctions.net/handlePaymentWebhook
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

exports.handlePaymentWebhook = functions.https.onRequest(async (request, response) => {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tranID, status, amount, number, userId } = request.body;

    // Validate webhook payload
    if (!tranID || !status) {
      return response.status(400).json({ 
        error: 'Missing required fields: tranID, status' 
      });
    }

    console.log(`Processing webhook for transaction: ${tranID}, Status: ${status}`);

    // Handle different transaction statuses
    if (status === 'COMPLETED') {
      // Transaction was successful
      const numericAmount = parseInt(amount) || 0;

      // Store transaction record in Firestore
      const transactionRef = admin.firestore().collection('transactions').doc(tranID);
      await transactionRef.set({
        tranID,
        status: 'COMPLETED',
        amount: numericAmount,
        phoneNumber: number,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        webhookReceivedAt: new Date(),
      });

      // If userId is provided, update user balance
      if (userId) {
        const userRef = admin.firestore().collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (userSnap.exists()) {
          const currentBalance = userSnap.data().balance || 0;
          const newBalance = currentBalance + numericAmount;

          await userRef.update({
            balance: newBalance,
            lastDeposit: admin.firestore.FieldValue.serverTimestamp(),
            lastTransactionId: tranID,
          });

          console.log(`Updated balance for user ${userId}: +${numericAmount} (new balance: ${newBalance})`);
        }
      }

      return response.status(200).json({
        success: true,
        message: 'Transaction completed successfully',
        tranID,
      });
    } else if (status === 'PENDING') {
      // Transaction is still pending
      const transactionRef = admin.firestore().collection('transactions').doc(tranID);
      await transactionRef.set({
        tranID,
        status: 'PENDING',
        amount: parseInt(amount) || 0,
        phoneNumber: number,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        webhookReceivedAt: new Date(),
      });

      console.log(`Transaction ${tranID} still pending`);

      return response.status(200).json({
        success: true,
        message: 'Transaction is still pending',
        tranID,
      });
    } else if (status === 'FAILED') {
      // Transaction failed
      const transactionRef = admin.firestore().collection('transactions').doc(tranID);
      await transactionRef.set({
        tranID,
        status: 'FAILED',
        amount: parseInt(amount) || 0,
        phoneNumber: number,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        webhookReceivedAt: new Date(),
      });

      console.log(`Transaction ${tranID} failed`);

      return response.status(200).json({
        success: true,
        message: 'Transaction failed',
        tranID,
      });
    } else {
      // Unknown status
      return response.status(400).json({
        error: `Unknown transaction status: ${status}`,
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * Alternative: If using Express-based Cloud Functions
 * 
 * const express = require('express');
 * const app = express();
 * 
 * app.post('/webhook', async (req, res) => {
 *   // Same webhook handling logic here
 * });
 * 
 * exports.paymentWebhooks = functions.https.onRequest(app);
 */
