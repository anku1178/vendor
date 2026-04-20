import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../services/supabase';
import { RefreshCw, Search, ArrowUpDown, Edit2, Trash2, Check, X, FileText } from 'lucide-react';
import './PurchaseTable.css';

const PurchaseTable = () => {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('purchase_date');
  const [sortAsc, setSortAsc] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchPurchases = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          vendor_id,
          item_name,
          unit,
          quantity,
          price,
          selling_price,
          purchase_date,
          vendors (name)
        `);

      if (error) throw error;
      
      const formattedData = data.map(item => ({
        ...item,
        vendor_name: item.vendors?.name || 'Unknown',
        total: item.quantity * item.price
      }));
      
      setPurchases(formattedData);

      // also fetch vendors for the edit dropdown
      const { data: vData } = await supabase.from('vendors').select('*').order('name');
      if (vData) setVendors(vData);

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

  // CRUD Actions
  const handleEditClick = (purchase) => {
    setEditingId(purchase.id);
    setEditForm({
      vendor_id: purchase.vendor_id,
      item_name: purchase.item_name,
      unit: purchase.unit || 'piece',
      quantity: purchase.quantity,
      price: purchase.price,
      selling_price: purchase.selling_price || 0,
      purchase_date: purchase.purchase_date
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
        vendor_id: editForm.vendor_id,
        item_name: editForm.item_name,
        unit: editForm.unit,
        quantity: parseInt(editForm.quantity),
        price: parseFloat(editForm.price),
        selling_price: parseFloat(editForm.selling_price || 0),
        purchase_date: editForm.purchase_date
      };

      const { error } = await supabase
        .from('purchases')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      
      setEditingId(null);
      fetchPurchases(); // refresh list
    } catch (err) {
      console.error('Error updating purchase:', err);
      alert('Failed to update: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this purchase? This will automatically remove these items from your inventory stock.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPurchases();
    } catch (err) {
      console.error('Error deleting purchase:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add simple header
    doc.setFontSize(18);
    doc.text("Purchase Records Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 30);

    // Map table data
    const tableColumn = ["Date", "Vendor", "Item", "Qty", "Price", "Sell Price", "Total"];
    const tableRows = [];

    filteredAndSortedPurchases.forEach(p => {
      const pData = [
        p.purchase_date ? format(new Date(p.purchase_date), 'MMM dd, yyyy') : '-',
        p.vendor_name,
        p.item_name,
        `${p.quantity} ${p.unit || ''}`,
        parseFloat(p.price).toFixed(2),
        parseFloat(p.selling_price || 0).toFixed(2),
        parseFloat(p.total).toFixed(2)
      ];
      tableRows.push(pData);
    });

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [77, 168, 218] },
      styles: { fontSize: 9 }
    });

    doc.save(`Purchase_Records_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

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
        <div style={{display: 'flex', gap: '0.75rem'}}>
          <button className="btn btn-outline" onClick={exportPDF} title="Download PDF Report">
            <FileText size={16} />
            PDF
          </button>
          <button className="btn btn-outline" onClick={fetchPurchases} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table crud-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('purchase_date')} className="sortable">Date <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('vendor_name')} className="sortable">Vendor <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('item_name')} className="sortable">Item <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('quantity')} className="sortable num-col">Qty <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('price')} className="sortable num-col">Price <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('selling_price')} className="sortable num-col">Sell Price <ArrowUpDown size={14} className="sort-icon" /></th>
              <th onClick={() => handleSort('total')} className="sortable num-col">Total <ArrowUpDown size={14} className="sort-icon" /></th>
              <th className="action-col text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4">Loading data...</td></tr>
            ) : filteredAndSortedPurchases.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-4 text-light">No records found.</td></tr>
            ) : (
              filteredAndSortedPurchases.map((purchase) => {
                const isEditing = editingId === purchase.id;
                
                return isEditing ? (
                  <tr key={purchase.id} className="editing-row">
                    <td>
                      <input type="date" name="purchase_date" className="edit-input" value={editForm.purchase_date} onChange={handleEditChange} />
                    </td>
                    <td>
                      <select name="vendor_id" className="edit-input" value={editForm.vendor_id} onChange={handleEditChange}>
                        {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <input type="text" name="item_name" className="edit-input" value={editForm.item_name} onChange={handleEditChange} />
                    </td>
                    <td className="num-col" style={{display: 'flex', gap: '0.25rem', alignItems: 'center'}}>
                      <input type="number" name="quantity" className="edit-input num-eval" value={editForm.quantity} onChange={handleEditChange} style={{width: '60px'}}/>
                      <select name="unit" className="edit-input" value={editForm.unit} onChange={handleEditChange} style={{width: '60px', padding: '0.25rem'}}>
                        <option value="piece">piece</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="mL">mL</option>
                        <option value="packet">packet</option>
                        <option value="box">box</option>
                        <option value="bottle">bottle</option>
                        <option value="bag">bag</option>
                        <option value="carton">carton</option>
                        <option value="dozen">dozen</option>
                      </select>
                    </td>
                    <td className="num-col">
                      <input type="number" name="price" step="0.01" className="edit-input num-eval" value={editForm.price} onChange={handleEditChange} />
                    </td>
                    <td className="num-col">
                      <input type="number" name="selling_price" step="0.01" className="edit-input num-eval" value={editForm.selling_price} onChange={handleEditChange} />
                    </td>
                    <td className="num-col font-bold text-primary">₹{(editForm.quantity * editForm.price).toFixed(2)}</td>
                    <td className="action-col text-center">
                      <button className="action-btn save-btn" onClick={() => handleSaveEdit(purchase.id)} title="Save"><Check size={16}/></button>
                      <button className="action-btn cancel-btn" onClick={handleCancelEdit} title="Cancel"><X size={16}/></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={purchase.id}>
                    <td>{purchase.purchase_date ? format(new Date(purchase.purchase_date), 'MMM dd, yyyy') : '-'}</td>
                    <td className="font-medium">{purchase.vendor_name}</td>
                    <td>{purchase.item_name}</td>
                    <td className="num-col">{purchase.quantity} {purchase.unit}</td>
                    <td className="num-col">₹{parseFloat(purchase.price).toFixed(2)}</td>
                    <td className="num-col" style={{color: '#10b981'}}>₹{parseFloat(purchase.selling_price || 0).toFixed(2)}</td>
                    <td className="num-col font-bold text-primary">₹{parseFloat(purchase.total).toFixed(2)}</td>
                    <td className="action-col text-center">
                      <button className="action-btn edit-btn" onClick={() => handleEditClick(purchase)} title="Edit"><Edit2 size={16}/></button>
                      <button className="action-btn del-btn" onClick={() => handleDelete(purchase.id)} title="Delete"><Trash2 size={16}/></button>
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

export default PurchaseTable;
