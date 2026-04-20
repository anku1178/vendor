import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import './PurchaseTable.css';

const SalesTable = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('sale_date');
  const [sortAsc, setSortAsc] = useState(false);

  const fetchSales = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map(item => ({
        ...item,
        total: item.quantity_sold * item.sale_price
      }));

      setSales(formattedData);
    } catch (error) {
      console.error('Error fetching sales:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredAndSortedSales = React.useMemo(() => {
    return sales
      .filter(s =>
        s.item_name.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [sales, searchTerm, sortField, sortAsc]);

  return (
    <div className="card">
      <div className="table-header-ops">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="search-input-field"
          />
        </div>
        <button className="btn btn-outline" onClick={fetchSales} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('sale_date')} className="sortable">
                Date <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('item_name')} className="sortable">
                Item <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('quantity_sold')} className="sortable num-col">
                Qty Sold <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('sale_price')} className="sortable num-col">
                Sale Price <ArrowUpDown size={14} className="sort-icon" />
              </th>
              <th onClick={() => handleSort('total')} className="sortable num-col">
                Total <ArrowUpDown size={14} className="sort-icon" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">Loading data...</td>
              </tr>
            ) : filteredAndSortedSales.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-light">No sales records found.</td>
              </tr>
            ) : (
              filteredAndSortedSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.sale_date ? format(new Date(sale.sale_date), 'MMM dd, yyyy') : '-'}</td>
                  <td className="font-medium">{sale.item_name}</td>
                  <td className="num-col">{sale.quantity_sold}</td>
                  <td className="num-col">₹{parseFloat(sale.sale_price).toFixed(2)}</td>
                  <td className="num-col font-bold" style={{color: '#10b981'}}>
                    ₹{parseFloat(sale.total).toFixed(2)}
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

export default SalesTable;
