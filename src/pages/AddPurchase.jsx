import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PurchaseForm from '../components/PurchaseForm';

const AddPurchase = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSuccess = () => {
    setSuccessMessage('Purchase record added successfully!');
    setTimeout(() => {
      setSuccessMessage('');
      // Optional: automatically navigate to records
      // navigate('/records');
    }, 3000);
  };

  return (
    <div className="page-container">
      <Navbar title="Add New Purchase" />
      
      <div className="page-content">
        {successMessage && (
          <div className="success-banner" style={{
            backgroundColor: '#ecfdf5', color: '#059669', padding: '1rem', 
            borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #10b981',
            textAlign: 'center', fontWeight: '500'
          }}>
            {successMessage}
          </div>
        )}
        
        <PurchaseForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default AddPurchase;
