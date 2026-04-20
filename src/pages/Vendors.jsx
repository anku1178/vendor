import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { MapPin, Phone, Mail, Building, Archive, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '../components/Navbar';
import './Vendors.css';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('purchases').select('*').order('purchase_date', { ascending: false })
      ]);

      if (vRes.error) throw vRes.error;
      if (pRes.error) throw pRes.error;

      setVendors(vRes.data || []);
      setPurchases(pRes.data || []);
    } catch (err) {
      console.error('Error fetching vendor data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute vendor totals
  const vendorStats = vendors.map(v => {
    const vPurchases = purchases.filter(p => p.vendor_id === v.id);
    const totalSpend = vPurchases.reduce((s, p) => s + (p.quantity * p.price), 0);
    const totalTransactions = vPurchases.length;
    return { ...v, totalSpend, totalTransactions };
  }).sort((a, b) => b.totalSpend - a.totalSpend);

  const selectedVendor = vendorStats.find(v => v.id === selectedVendorId) || vendorStats[0];
  const selectedPurchases = purchases.filter(p => p.vendor_id === selectedVendor?.id);

  return (
    <div className="page-container">
      <Navbar title="Vendor Management" />
      
      <div className="page-content vendor-layout">
        {loading ? (
          <div className="text-center py-4">Loading vendor network...</div>
        ) : vendorStats.length === 0 ? (
          <div className="empty-state">
            <Building size={48} className="text-light" />
            <p className="empty-bold mt-2">No vendors found</p>
            <p className="empty-muted">Vendors are created automatically when you log a new purchase.</p>
          </div>
        ) : (
          <>
            {/* Left Panel: Vendor List */}
            <div className="vendor-sidebar card">
              <h3 className="vendor-sidebar-title">Active Suppliers</h3>
              <div className="vendor-list">
                {vendorStats.map(v => (
                  <button 
                    key={v.id} 
                    className={`vendor-list-item ${selectedVendor?.id === v.id ? 'active' : ''}`}
                    onClick={() => setSelectedVendorId(v.id)}
                  >
                    <div className="vendor-list-icon">
                      <Building size={16} />
                    </div>
                    <div className="vendor-list-info">
                      <span className="vendor-list-name">{v.name}</span>
                      <span className="vendor-list-stat">{v.totalTransactions} transactions</span>
                    </div>
                    <span className="vendor-list-val">₹{v.totalSpend.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Panel: Vendor Details & History */}
            {selectedVendor && (
              <div className="vendor-details-col">
                <div className="card vendor-profile-card">
                  <div className="profile-header">
                    <div className="profile-icon">
                      {selectedVendor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="profile-name">{selectedVendor.name}</h2>
                      <p className="profile-id text-light">ID: {selectedVendor.id}</p>
                    </div>
                  </div>
                  
                  <div className="profile-stats-grid">
                    <div className="p-stat-box">
                      <DollarSign size={20} className="p-stat-icon text-green" />
                      <div>
                        <span className="p-stat-label">Total Spend</span>
                        <h3 className="p-stat-val">₹{selectedVendor.totalSpend.toFixed(2)}</h3>
                      </div>
                    </div>
                    <div className="p-stat-box">
                      <ShoppingBag size={20} className="p-stat-icon text-blue" />
                      <div>
                        <span className="p-stat-label">Transactions</span>
                        <h3 className="p-stat-val">{selectedVendor.totalTransactions}</h3>
                      </div>
                    </div>
                    <div className="p-stat-box">
                      <Calendar size={20} className="p-stat-icon text-orange" />
                      <div>
                        <span className="p-stat-label">Last Active</span>
                        <h3 className="p-stat-val text-sm">
                          {selectedPurchases.length > 0 
                            ? format(new Date(selectedPurchases[0].purchase_date), 'MMM dd, yyyy')
                            : 'Never'}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="card-title mb-1">Purchase History</h3>
                  <p className="text-light text-sm mb-3">All items bought from {selectedVendor.name}</p>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Item</th>
                          <th className="num-col">Qty</th>
                          <th className="num-col">Price</th>
                          <th className="num-col">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPurchases.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-4 text-light">No records found.</td></tr>
                        ) : (
                          selectedPurchases.map(p => (
                            <tr key={p.id}>
                              <td>{format(new Date(p.purchase_date), 'MMM dd, yyyy')}</td>
                              <td className="font-medium">{p.item_name}</td>
                              <td className="num-col">{p.quantity} {p.unit}</td>
                              <td className="num-col">₹{parseFloat(p.price).toFixed(2)}</td>
                              <td className="num-col font-bold">₹{(p.quantity * p.price).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Vendors;
