import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SaleForm from '../components/SaleForm';

const AddSale = () => {
  const [successMessage, setSuccessMessage] = useState('');

  const handleSuccess = () => {
    setSuccessMessage('Sale recorded successfully! Stock has been updated.');
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  return (
    <div className="page-container">
      <Navbar title="Log a Sale" />

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

        <SaleForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default AddSale;
