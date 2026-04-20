import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { RefreshCw, Search, ArrowUpDown, Edit2, Trash2, Check, X } from 'lucide-react';
import './PurchaseTable.css';

const SalesTable = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('sale_date');
  const [sortAsc, setSortAsc] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  // CRUD Actions
  const handleEditClick = (sale) => {
    setEditingId(sale.id);
    setEditForm({
      item_name: sale.item_name,
      quantity_sold: sale.quantity_sold,
      sale_price: sale.sale_price,
      sale_date: sale.sale_date
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async (id) => {
    try {
      const payload = {
        item_name: editForm.item_name,
        quantity_sold: parseInt(editForm.quantity_sold),
        sale_price: parseFloat(editForm.sale_price),
        sale_date: editForm.sale_date
      };

      const { error } = await supabase
        .from('sales')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      
      setEditingId(null);
      fetchSales(); // refresh list
    } catch (err) {
      console.error('Error updating sale:', err);
      alert('Failed to update: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sale? This will instantly return the items to your inventory stock.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSales();
    } catch (err) {
      console.error('Error deleting sale:', err);
      alert('Failed to delete: ' + err.message);
    }
  };


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
        <table className="table crud-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('sale_date')} className="sortable">Date <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('item_name')} className="sortable">Item <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('quantity_sold')} className="sortable num-col">Qty Sold <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('sale_price')} className="sortable num-col">Sale Price <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('total')} className="sortable num-col">Total <ArrowUpDown size={14} className="sort-icon" /></th>
              <th className="action-col text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4">Loading data...</td></tr>
            ) : filteredAndSortedSales.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-light">No sales records found.</td></tr>
            ) : (
              filteredAndSortedSales.map((sale) => {
                const isEditing = editingId === sale.id;

                return isEditing ? (
                  <tr key={sale.id} className="editing-row">
                    <td>
                      <input type="date" name="sale_date" className="edit-input" value={editForm.sale_date} onChange={handleEditChange} />
                    </td>
                    <td>
                      <input type="text" name="item_name" className="edit-input" value={editForm.item_name} onChange={handleEditChange} />
                    </td>
                    <td className="num-col">
                      <input type="number" name="quantity_sold" className="edit-input num-eval" value={editForm.quantity_sold} onChange={handleEditChange} />
                    </td>
                    <td className="num-col">
                      <input type="number" name="sale_price" step="0.01" className="edit-input num-eval" value={editForm.sale_price} onChange={handleEditChange} />
                    </td>
                    <td className="num-col font-bold" style={{color: '#10b981'}}>
                       ₹{(editForm.quantity_sold * editForm.sale_price).toFixed(2)}
                    </td>
                    <td className="action-col text-center">
                      <button className="action-btn save-btn" onClick={() => handleSaveEdit(sale.id)} title="Save"><Check size={16}/></button>
                      <button className="action-btn cancel-btn" onClick={handleCancelEdit} title="Cancel"><X size={16}/></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={sale.id}>
                    <td>{sale.sale_date ? format(new Date(sale.sale_date), 'MMM dd, yyyy') : '-'}</td>
                    <td className="font-medium">{sale.item_name}</td>
                    <td className="num-col">{sale.quantity_sold}</td>
                    <td className="num-col">₹{parseFloat(sale.sale_price).toFixed(2)}</td>
                    <td className="num-col font-bold" style={{color: '#10b981'}}>
                      ₹{parseFloat(sale.total).toFixed(2)}
                    </td>
                    <td className="action-col text-center">
                      <button className="action-btn edit-btn" onClick={() => handleEditClick(sale)} title="Edit"><Edit2 size={16}/></button>
                      <button className="action-btn del-btn" onClick={() => handleDelete(sale.id)} title="Delete"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;
