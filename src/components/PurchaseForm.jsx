import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { Save, AlertCircle } from 'lucide-react';
import './PurchaseForm.css';

const PurchaseForm = ({ onSuccess }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    vendor_id: '',
    new_vendor_name: '',
    item_name: '',
    unit: 'piece',
    quantity: '',
    price: '',
    selling_price: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd')
  });

  const [isNewVendor, setIsNewVendor] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
        
      if (error) throw error;
      setVendors(data || []);
    } catch (err) {
      console.error("Error fetching vendors:", err.message);
      setError("Failed to load vendors.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'vendor_id' && value === 'NEW') {
      setIsNewVendor(true);
      setFormData(prev => ({ ...prev, vendor_id: '' }));
    } else if (name === 'vendor_id' && value !== 'NEW') {
      setIsNewVendor(false);
      setFormData(prev => ({ ...prev, [name]: value, new_vendor_name: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const cancelNewVendor = () => {
    setIsNewVendor(false);
    setFormData(prev => ({ ...prev, new_vendor_name: '', vendor_id: '' }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase client is not initialized.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let finalVendorId = formData.vendor_id;

      // Handle new vendor creation
      if (isNewVendor && formData.new_vendor_name.trim()) {
        const { data: newVendor, error: vendorError } = await supabase
          .from('vendors')
          .insert([{ name: formData.new_vendor_name.trim() }])
          .select()
          .single();

        if (vendorError) throw vendorError;
        finalVendorId = newVendor.id;
        
        // Update local vendor list
        setVendors(prev => [...prev, newVendor].sort((a,b) => a.name.localeCompare(b.name)));
        setIsNewVendor(false);
      } else if (!finalVendorId) {
        throw new Error("Please select or add a vendor");
      }

      // Insert purchase
      const purchasePayload = {
        vendor_id: finalVendorId,
        item_name: formData.item_name.trim(),
        unit: formData.unit,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        selling_price: parseFloat(formData.selling_price || 0),
        purchase_date: formData.purchase_date
      };

      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchasePayload]);

      if (purchaseError) throw purchaseError;

      // Reset form on success
      setFormData({
        vendor_id: '',
        new_vendor_name: '',
        item_name: '',
        unit: 'piece',
        quantity: '',
        price: '',
        selling_price: '',
        purchase_date: format(new Date(), 'yyyy-MM-dd')
      });
      
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error("Error submitting purchase:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-container">
      <h2 className="form-title">Record Purchase</h2>
      
      {error && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Vendor</label>
            {!isNewVendor ? (
              <select 
                className="form-select" 
                name="vendor_id" 
                value={formData.vendor_id} 
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
                <option value="NEW" className="add-new-option">+ Add New Vendor</option>
              </select>
            ) : (
              <div className="new-vendor-input">
                <input 
                  type="text" 
                  className="form-input" 
                  name="new_vendor_name"
                  placeholder="Enter vendor name..."
                  value={formData.new_vendor_name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
                <button type="button" className="btn btn-cancel" onClick={cancelNewVendor}>Cancel</button>
              </div>
            )}
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Purchase Date</label>
            <input 
              type="date" 
              className="form-input" 
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Item Name</label>
          <input 
            type="text" 
            className="form-input" 
            name="item_name"
            placeholder="e.g. Premium Rice 10kg"
            value={formData.item_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">Quantity</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <input 
                type="number" 
                className="form-input" 
                name="quantity"
                min="1"
                step="1"
                placeholder="0"
                value={formData.quantity}
                onChange={handleChange}
                required
                style={{flex: 2}}
              />
              <select
                className="form-select"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                style={{flex: 1}}
              >
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
            </div>
          </div>

          <div className="form-group flex-1">
            <label className="form-label">Price per Unit (₹)</label>
            <input 
              type="number" 
              className="form-input" 
              name="price"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group flex-1">
            <label className="form-label">
              Selling Price (₹) 
              {formData.price && formData.selling_price && parseFloat(formData.selling_price) > parseFloat(formData.price) 
                ? <span style={{marginLeft: '0.25rem', color: '#10b981', fontSize: '0.75rem'}}> (+{(((parseFloat(formData.selling_price) - parseFloat(formData.price)) / parseFloat(formData.price)) * 100).toFixed(0)}%)</span> 
                : null}
            </label>
            <input 
              type="number" 
              className="form-input" 
              name="selling_price"
              min="0"
              step="0.01"
              placeholder="0.00 (Optional)"
              value={formData.selling_price}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="total-summary">
          <span>Total Estimate: </span>
          <strong>₹{(parseFloat(formData.price || 0) * parseInt(formData.quantity || 0)).toFixed(2)}</strong>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <Save size={18} />
                Save Purchase Record
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;
