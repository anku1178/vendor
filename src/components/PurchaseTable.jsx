import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import './PurchaseTable.css';

const PurchaseTable = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('purchase_date');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchPurchases = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Query purchases joined with vendors
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          item_name,
          quantity,
          price,
          purchase_date,
          vendors (
            name
          )
        `);

      if (error) throw error;
      
      const formattedData = data.map(item => ({
        ...item,
        vendor_name: item.vendors?.name || 'Unknown',
        total: item.quantity * item.price
      }));
      
      setPurchases(formattedData);
    } catch (error) {
      console.error('Error fetching purchases:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSortedPurchases = React.useMemo(() => {
    return purchases
      .filter(p => 
        p.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendor_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [purchases, searchTerm, sortField, sortAsc]);

  return (
    <div className="card">
      <div className="table-header-ops">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search item or vendor..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
        </div>
        <button className="btn btn-outline" onClick={fetchPurchases} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('purchase_date')} className="sortable">
                Date <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('vendor_name')} className="sortable">
                Vendor <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('item_name')} className="sortable">
                Item <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('quantity')} className="sortable num-col">
                Qty <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('price')} className="sortable num-col">
                Price <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('total')} className="sortable num-col">
                Total <ArrowUpDown size={14} className="sort-icon" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">Loading data...</td>
              </tr>
            ) : filteredAndSortedPurchases.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-light">No records found.</td>
              </tr>
            ) : (
              filteredAndSortedPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{purchase.purchase_date ? format(new Date(purchase.purchase_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="font-medium">{purchase.vendor_name}</td>
                  <td>{purchase.item_name}</td>
                  <td className="num-col">{purchase.quantity}</td>
                  <td className="num-col">₹{parseFloat(purchase.price).toFixed(2)}</td>
                  <td className="num-col font-bold text-primary">
                    ₹{parseFloat(purchase.total).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseTable;
