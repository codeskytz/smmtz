import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setDoc, doc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Fetch user role and balance from Firestore if user exists
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserRole(userData.role || 'user');
            setUserBalance(userData.balance || 0);
            setReferralEarnings(userData.referralEarnings || 0);
          } else {
            setUserRole('user'); // Default role
            setUserBalance(0);
            setReferralEarnings(0);
          }
        } catch (err) {
          console.warn('Failed to fetch user data:', err);
          setUserRole('user'); // Default to user role on error
          setUserBalance(0);
          setReferralEarnings(0);
        }
      } else {
        setUserRole(null);
        setUserBalance(0);
        setReferralEarnings(0);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Generate unique referral code
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Check if referral code exists
  const checkReferralCode = async (code) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (err) {
      console.error('Error checking referral code:', err);
      return false;
    }
  };

  // Register with email and password
  const register = async (email, password, displayName, role = 'user', referralCode = null) => {
    try {
      setError(null);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(res.user, {
        displayName: displayName,
      });

      // Generate unique referral code for new user
      let userReferralCode = generateReferralCode();
      let codeExists = await checkReferralCode(userReferralCode);
      
      // Ensure code is unique
      while (codeExists) {
        userReferralCode = generateReferralCode();
        codeExists = await checkReferralCode(userReferralCode);
      }

      // Find referrer if referral code provided
      let referrerId = null;
      if (referralCode) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            referrerId = querySnapshot.docs[0].id;
            // Increment referrer's total referrals count
            const referrerRef = doc(db, 'users', referrerId);
            const referrerDoc = await getDoc(referrerRef);
            if (referrerDoc.exists()) {
              const currentTotal = referrerDoc.data().totalReferrals || 0;
              await updateDoc(referrerRef, {
                totalReferrals: currentTotal + 1,
              });
            }
          }
        } catch (err) {
          console.warn('Error finding referrer:', err);
        }
      }

      // Try to save user data to Firestore, but don't block if it fails
      try {
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          email: email,
          displayName: displayName,
          role: role,
          referralCode: userReferralCode,
          referrerId: referrerId,
          referralEarnings: 0, // In smallest units (cents)
          totalReferrals: 0,
          createdAt: new Date(),
          photoURL: res.user.photoURL || null,
        });
      } catch (firestoreErr) {
        console.warn('Firestore write failed, but user created successfully:', firestoreErr);
        // Continue anyway - user is authenticated
      }

      setUser(res.user);
      setUserRole(role);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Google Sign In
  const signInWithGoogle = async (referralCode = null) => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      
      // Try to save/check user in Firestore, but don't block if it fails
      try {
        const { getDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', res.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          // Generate unique referral code for new user
          let userReferralCode = generateReferralCode();
          let codeExists = await checkReferralCode(userReferralCode);
          
          // Ensure code is unique
          while (codeExists) {
            userReferralCode = generateReferralCode();
            codeExists = await checkReferralCode(userReferralCode);
          }

          // Find referrer if referral code provided
          let referrerId = null;
          if (referralCode) {
            try {
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('referralCode', '==', referralCode.toUpperCase()));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                referrerId = querySnapshot.docs[0].id;
                // Increment referrer's total referrals count
                const referrerRef = doc(db, 'users', referrerId);
                const referrerDoc = await getDoc(referrerRef);
                if (referrerDoc.exists()) {
                  const currentTotal = referrerDoc.data().totalReferrals || 0;
                  await updateDoc(referrerRef, {
                    totalReferrals: currentTotal + 1,
                  });
                }
              }
            } catch (err) {
              console.warn('Error finding referrer:', err);
            }
          }

          await setDoc(userDocRef, {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            role: 'user',
            referralCode: userReferralCode,
            referrerId: referrerId,
            referralEarnings: 0,
            totalReferrals: 0,
            createdAt: new Date(),
            photoURL: res.user.photoURL || null,
          });
          setUserRole('user');
        } else {
          setUserRole(userDocSnap.data().role || 'user');
        }
      } catch (firestoreErr) {
        console.warn('Firestore write failed, but user authenticated successfully:', firestoreErr);
        setUserRole('user'); // Default to user role
      }

      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      if (user) {
        await updateProfile(user, updates);
        
        // Try to update Firestore, but don't block if it fails
        try {
          await setDoc(doc(db, 'users', user.uid), {
            ...updates,
            uid: user.uid,
          }, { merge: true });
        } catch (firestoreErr) {
          console.warn('Firestore update failed:', firestoreErr);
          // Continue anyway - profile updated locally
        }

        setUser({ ...user, ...updates });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Send password reset email with custom redirect URL
  const forgotPassword = async (email, customRedirectUrl = null) => {
    try {
      setError(null);
      
      // Build the redirect URL
      let redirectUrl = customRedirectUrl;
      if (!redirectUrl) {
        // Default to the app's reset password page
        const baseUrl = window.location.origin;
        redirectUrl = `${baseUrl}/reset-password`;
      }

      // Firebase sendPasswordResetEmail options
      const actionCodeSettings = {
        url: redirectUrl,
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      return { success: true, message: 'Password reset email sent. Check your inbox.' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Reset password with reset code
  const resetPassword = async (code, newPassword) => {
    try {
      setError(null);
      await confirmPasswordReset(auth, code, newPassword);
      return { success: true, message: 'Password reset successfully. You can now login with your new password.' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Verify reset code and get email
  const verifyResetCode = async (code) => {
    try {
      setError(null);
      const email = await verifyPasswordResetCode(auth, code);
      return email;
    } catch (err) {
      setError('Invalid or expired reset link');
      throw err;
    }
  };

  // Admin: Get all users
  const getAllUsers = async () => {
    try {
      setError(null);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return usersList;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Admin: Promote user to admin
  const promoteUserToAdmin = async (userId) => {
    try {
      setError(null);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'admin'
      });
      return { success: true, message: 'User promoted to admin successfully' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Admin: Demote admin to user
  const demoteAdminToUser = async (userId) => {
    try {
      setError(null);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: 'user'
      });
      return { success: true, message: 'Admin demoted to user successfully' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Admin: Suspend user
  const suspendUser = async (userId) => {
    try {
      setError(null);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        suspended: true,
        suspendedAt: new Date()
      });
      return { success: true, message: 'User suspended successfully' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Admin: Unsuspend user
  const unsuspendUser = async (userId) => {
    try {
      setError(null);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        suspended: false,
        suspendedAt: null
      });
      return { success: true, message: 'User unsuspended successfully' };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get user balance from Firestore
  const getUserBalance = async (userId = null) => {
    try {
      const uid = userId || user?.uid;
      if (!uid) throw new Error('User not authenticated');

      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const balance = userDocSnap.data().balance || 0;
        setUserBalance(balance);
        return balance;
      }
      return 0;
    } catch (err) {
      console.error('Error getting balance:', err);
      setError(err.message);
      throw err;
    }
  };

  // Update user balance (called after successful deposit)
  const updateUserBalance = async (amount, transactionId = null) => {
    try {
      setError(null);
      if (!user) throw new Error('User not authenticated');

      const userRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userRef);
      const currentBalance = userDocSnap.data().balance || 0;
      const newBalance = currentBalance + amount;

      await updateDoc(userRef, {
        balance: newBalance,
        lastDeposit: new Date(),
        lastTransactionId: transactionId,
      });

      setUserBalance(newBalance);
      return newBalance;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Withdraw from balance (for orders)
  const withdrawFromBalance = async (amount) => {
    try {
      setError(null);
      if (!user) throw new Error('User not authenticated');

      const userRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userRef);
      const currentBalance = userDocSnap.data().balance || 0;

      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance - amount;

      await updateDoc(userRef, {
        balance: newBalance,
      });

      setUserBalance(newBalance);
      return newBalance;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    userRole,
    userBalance,
    loading,
    error,
    register,
    login,
    logout,
    signInWithGoogle,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    verifyResetCode,
    getAllUsers,
    promoteUserToAdmin,
    demoteAdminToUser,
    suspendUser,
    unsuspendUser,
    getUserBalance,
    updateUserBalance,
    withdrawFromBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
