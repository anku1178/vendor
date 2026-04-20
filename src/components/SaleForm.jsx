import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { ShoppingCart, AlertCircle, AlertTriangle } from 'lucide-react';
import './SaleForm.css';

const SaleForm = ({ onSuccess }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockWarning, setStockWarning] = useState('');

  const [formData, setFormData] = useState({
    item_name: '',
    quantity_sold: '',
    sale_price: '',
    sale_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name');

      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setStockWarning('');

    // Check stock when item or quantity changes
    if (name === 'item_name' || name === 'quantity_sold') {
      const itemName = name === 'item_name' ? value : formData.item_name;
      const qty = name === 'quantity_sold' ? parseInt(value) : parseInt(formData.quantity_sold);

      if (itemName && qty) {
        const item = inventory.find(i => i.item_name === itemName);
        if (item && qty > item.stock) {
          setStockWarning(`⚠️ Only ${item.stock} units in stock for "${itemName}"`);
        }
      }
    }
  };

  const getAvailableStock = () => {
    const item = inventory.find(i => i.item_name === formData.item_name);
    return item ? item.stock : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase client is not initialized.');
      return;
    }

    // Validate stock
    const available = getAvailableStock();
    const qty = parseInt(formData.quantity_sold);
    if (qty > available) {
      setError(`Cannot sell ${qty} units. Only ${available} in stock.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        item_name: formData.item_name,
        quantity_sold: qty,
        sale_price: parseFloat(formData.sale_price),
        sale_date: formData.sale_date
      };

      const { error: saleError } = await supabase
        .from('sales')
        .insert([payload]);

      if (saleError) throw saleError;

      // Reset form
      setFormData({
        item_name: '',
        quantity_sold: '',
        sale_price: '',
        sale_date: format(new Date(), 'yyyy-MM-dd')
      });
      setStockWarning('');

      // Refresh inventory to get updated stock
      fetchInventory();

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error logging sale:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-container">
      <h2 className="form-title">Log a Sale</h2>

      {error && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Item Name</label>
            <select
              className="form-select"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select item from stock</option>
              {inventory.filter(i => i.stock > 0).map(item => (
                <option key={item.id} value={item.item_name}>
                  {item.item_name} (Stock: {item.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Sale Date</label>
            <input
              type="date"
              className="form-input"
              name="sale_date"
              value={formData.sale_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {formData.item_name && (
          <div className="stock-info-bar">
            Available stock for <strong>{formData.item_name}</strong>: <span className="stock-count">{getAvailableStock()} units</span>
          </div>
        )}

        {stockWarning && (
          <div className="warning-alert">
            <AlertTriangle size={16} />
            <span>{stockWarning}</span>
          </div>
        )}

        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Quantity Sold</label>
            <input
              type="number"
              className="form-input"
              name="quantity_sold"
              min="1"
              max={getAvailableStock()}
              step="1"
              placeholder="0"
              value={formData.quantity_sold}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Sale Price per Unit (₹)</label>
            <input
              type="number"
              className="form-input"
              name="sale_price"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.sale_price}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="total-summary">
          <span>Sale Total: </span>
          <strong>₹{(parseFloat(formData.sale_price || 0) * parseInt(formData.quantity_sold || 0)).toFixed(2)}</strong>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-sale btn-lg" disabled={loading || !!stockWarning}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <ShoppingCart size={18} />
                Record Sale
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaleForm;
