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
import { setDoc, doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Fetch user role from Firestore if user exists
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role || 'user');
          } else {
            setUserRole('user'); // Default role
          }
        } catch (err) {
          console.warn('Failed to fetch user role:', err);
          setUserRole('user'); // Default to user role on error
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register with email and password
  const register = async (email, password, displayName, role = 'user') => {
    try {
      setError(null);
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(res.user, {
        displayName: displayName,
      });

      // Try to save user data to Firestore, but don't block if it fails
      try {
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          email: email,
          displayName: displayName,
          role: role,
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
  const signInWithGoogle = async () => {
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
          await setDoc(userDocRef, {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            role: 'user',
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

  const value = {
    user,
    userRole,
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
