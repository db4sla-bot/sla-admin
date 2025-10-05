import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./Firebase";

// Use ContextData for both context and provider
const ContextData = createContext();

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  // Function to fetch employee details from Employees collection
  const fetchUserDetails = async (email) => {
    if (!email) return null;
    
    setUserDetailsLoading(true);
    try {
      const docRef = doc(db, "Employees", email);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const employeeData = docSnap.data();
        setUserDetails(employeeData);
        return employeeData;
      } else {
        console.log("No employee document found with email:", email);
        setUserDetails(null);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserDetails(null);
      return null;
    } finally {
      setUserDetailsLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser);
      
      if (firebaseUser && firebaseUser.email) {
        // Fetch employee details when user is authenticated
        await fetchUserDetails(firebaseUser.email);
      } else {
        // Clear user details when user logs out
        setUserDetails(null);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Function to refresh user details (can be called from any component)
  const refreshUserDetails = async () => {
    if (user && user.email) {
      return await fetchUserDetails(user.email);
    }
    return null;
  };

  return (
    <ContextData.Provider value={{ 
      user, 
      userDetails, 
      isAuthenticated, 
      loading, 
      userDetailsLoading,
      refreshUserDetails,
      fetchUserDetails
    }}>
      {children}
    </ContextData.Provider>
  );
};

export const useAppContext = () => useContext(ContextData);
