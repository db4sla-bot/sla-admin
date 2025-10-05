// src/services/employeeService.js
import { db } from "../Firebase"; // adjust path to your firebase config
import { doc, setDoc, getDoc } from "firebase/firestore";

// Generate unique 6-digit Employee ID
const generateEmployeeId = async () => {
  let id;
  let exists = true;

  while (exists) {
    id = Math.floor(100000 + Math.random() * 900000).toString();
    const docRef = doc(db, "Employees", id);
    const docSnap = await getDoc(docRef);
    exists = docSnap.exists(); // ensure ID not already taken
  }

  return id;
};

// Save Employee function
export const saveEmployee = async (formData, status, statusColor, designation) => {
  try {
    const employeeId = await generateEmployeeId();
    await setDoc(doc(db, "Employees", employeeId), {
      employeeId,
      ...formData,
      status,
      statusColor,
      designation,
      createdAt: new Date(),
    });
    return { success: true, id: employeeId };
  } catch (error) {
    console.error("Error saving employee:", error);
    return { success: false, error };
  }
};
