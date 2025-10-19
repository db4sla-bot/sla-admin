import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./Firebase";

// Use ContextData for both context and provider
const ContextData = createContext();

export const ContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  // Function to fetch employee details from Employees collection using email query
  const fetchUserDetails = async (email) => {
    if (!email) return null;
    
    setUserDetailsLoading(true);
    try {
      // First, try to get document with email as ID (for backward compatibility)
      const docRef = doc(db, "Employees", email);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const employeeData = docSnap.data();
        setUserDetails(employeeData);
        setIsAdmin(false);
        console.log("Employee found with email as document ID:", employeeData);
        return employeeData;
      }
      
      // If not found, query the collection for documents where email field matches
      const employeesRef = collection(db, "Employees");
      const q = query(employeesRef, where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Get the first matching document
        const employeeDoc = querySnapshot.docs[0];
        const employeeData = employeeDoc.data();
        setUserDetails(employeeData);
        setIsAdmin(false);
        console.log("Employee found by email query:", employeeData);
        return employeeData;
      } else {
        console.log("No employee document found with email:", email);
        setUserDetails(null);
        setIsAdmin(true); // No employee document, so is admin
        return null;
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserDetails(null);
      setIsAdmin(true); // On error, default to admin
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
        console.log("User Details:", userDetails);
      } else {
        // Clear user details when user logs out
        setUserDetails(null);
        setIsAdmin(false);
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
      isAdmin,
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
