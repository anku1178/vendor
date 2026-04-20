import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { DollarSign, ShoppingBag, Package, TrendingUp } from 'lucide-react';
import './DashboardCards.css';

const DashboardCards = () => {
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalPurchases: 0,
    totalItems: 0,
    topVendor: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Get all purchases for stats
      const { data: purchases, error: purchaseErr } = await supabase
        .from('purchases')
        .select(`
          quantity, 
          price,
          vendors (name)
        `);

      if (purchaseErr) throw purchaseErr;

      // Get total stock from inventory
      const { data: inventory, error: invErr } = await supabase
        .from('inventory')
        .select('stock');

      if (invErr) throw invErr;

      if (purchases && purchases.length > 0) {
        let totalSpent = 0;
        let totalPurchases = purchases.length;
        let vendorSpend = {};
        
        purchases.forEach(p => {
          const spend = p.quantity * p.price;
          totalSpent += spend;
          
          const vName = p.vendors?.name || 'Unknown';
          vendorSpend[vName] = (vendorSpend[vName] || 0) + spend;
        });

        // Find top vendor
        let topVendor = '-';
        let maxSpend = 0;
        Object.entries(vendorSpend).forEach(([vendor, spend]) => {
          if (spend > maxSpend) {
            maxSpend = spend;
            topVendor = vendor;
          }
        });

        const totalItems = inventory ? inventory.reduce((acc, curr) => acc + curr.stock, 0) : 0;

        setStats({
          totalSpent,
          totalPurchases,
          totalItems,
          topVendor
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper bg-blue-light">
          <DollarSign className="stat-icon text-primary" size={24} />
        </div>
        <div className="stat-details">
          <p className="stat-label">Total Spent</p>
          <h3 className="stat-value">
            {loading ? '-' : `$${stats.totalSpent.toFixed(2)}`}
          </h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper bg-green-light">
          <ShoppingBag className="stat-icon text-green" size={24} />
        </div>
        <div className="stat-details">
          <p className="stat-label">Total Purchases</p>
          <h3 className="stat-value">
            {loading ? '-' : stats.totalPurchases}
          </h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper bg-orange-light">
          <Package className="stat-icon text-orange" size={24} />
        </div>
        <div className="stat-details">
          <p className="stat-label">Units in Stock</p>
          <h3 className="stat-value">
            {loading ? '-' : stats.totalItems}
          </h3>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper bg-purple-light">
          <TrendingUp className="stat-icon text-purple" size={24} />
        </div>
        <div className="stat-details">
          <p className="stat-label">Top Vendor</p>
          <h3 className="stat-value truncate">
            {loading ? '-' : stats.topVendor}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;
