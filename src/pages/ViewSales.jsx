import React from 'react';
import Navbar from '../components/Navbar';
import SalesTable from '../components/SalesTable';

const ViewSales = () => {
  return (
    <div className="page-container">
      <Navbar title="Sales Records" />

      <div className="page-content">
        <SalesTable />
      </div>
    </div>
  );
};

export default ViewSales;
