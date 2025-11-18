import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { setDoc, doc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register with email and password
  const register = async (email, password, displayName) => {
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
          createdAt: new Date(),
          photoURL: res.user.photoURL || null,
        });
      } catch (firestoreErr) {
        console.warn('Firestore write failed, but user created successfully:', firestoreErr);
        // Continue anyway - user is authenticated
      }

      setUser(res.user);
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
            createdAt: new Date(),
            photoURL: res.user.photoURL || null,
          });
        }
      } catch (firestoreErr) {
        console.warn('Firestore write failed, but user authenticated successfully:', firestoreErr);
        // Continue anyway - user is authenticated
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

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    signInWithGoogle,
    updateUserProfile,
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
