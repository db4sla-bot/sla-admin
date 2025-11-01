import React from 'react';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

const AccessDenied = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goHome = () => {
    navigate('/leads');
  };

  return (
    <div className="access-denied-container">
      <div className="access-denied-content">
        <div className="access-denied-icon">
          <ShieldX size={80} color="#ea4d4d" />
        </div>
        <h1 className="access-denied-title">Access Denied</h1>
        <p className="access-denied-message">
          You don't have permission to access this page. 
          Please contact your administrator if you believe this is an error.
        </p>
        <div className="access-denied-actions">
          <button className="btn-primary" onClick={goHome}>
            Go to Leads
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;