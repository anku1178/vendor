import React from 'react';
import Navbar from '../components/Navbar';
import PurchaseTable from '../components/PurchaseTable';

const ViewRecords = () => {
  return (
    <div className="page-container">
      <Navbar title="Purchase Records" />
      
      <div className="page-content">
        <PurchaseTable />
      </div>
    </div>
  );
};

export default ViewRecords;
