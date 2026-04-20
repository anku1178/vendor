import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { format, parseISO, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowRight, Eye, ShoppingBag, Users, Package, Layers
} from 'lucide-react';
import './Home.css';

const COLORS = ['#4DA8DA', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Chart state
  const [selectedItem, setSelectedItem] = useState('');
  const [dateMode, setDateMode] = useState('daily'); // 'daily' | 'monthly'

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    if (!supabase) { setLoading(false); return; }
    try {
      const [pRes, iRes, vRes] = await Promise.all([
        supabase.from('purchases').select('*, vendors(name)').order('purchase_date', { ascending: false }),
        supabase.from('inventory').select('*').order('item_name'),
        supabase.from('vendors').select('*').order('name')
      ]);
      if (pRes.error) throw pRes.error;
      if (iRes.error) throw iRes.error;
      if (vRes.error) throw vRes.error;

      setPurchases(pRes.data || []);
      setInventory(iRes.data || []);
      setVendors(vRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived Stats ──
  const totalSpend = purchases.reduce((s, p) => s + p.quantity * p.price, 0);
  const activeVendors = vendors.length;
  const uniqueItems = [...new Set(purchases.map(p => p.item_name))].length;
  const totalStock = inventory.reduce((s, i) => s + i.stock, 0);

  // ── Vendor Spending ──
  const vendorSpendData = (() => {
    const map = {};
    purchases.forEach(p => {
      const v = p.vendors?.name || 'Unknown';
      map[v] = (map[v] || 0) + p.quantity * p.price;
    });
    return Object.entries(map)
      .map(([name, spent]) => ({ name, spent: +spent.toFixed(2) }))
      .sort((a, b) => b.spent - a.spent);
  })();

  // ── Price Trend (per item) ──
  const allItemNames = [...new Set(purchases.map(p => p.item_name))].sort();
  const priceTrendData = (() => {
    const item = selectedItem || allItemNames[0] || '';
    if (!item) return [];
    return purchases
      .filter(p => p.item_name === item)
      .sort((a, b) => a.purchase_date.localeCompare(b.purchase_date))
      .map(p => ({
        date: format(parseISO(p.purchase_date), 'MMM dd'),
        price: +p.price
      }));
  })();

  // ── Item Quantity Summary ──
  const itemQtyData = (() => {
    const map = {};
    purchases.forEach(p => {
      map[p.item_name] = (map[p.item_name] || 0) + p.quantity;
    });
    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
  })();

  // ── Date-wise Summary ──
  const dateWiseData = (() => {
    const map = {};
    purchases.forEach(p => {
      const key = dateMode === 'daily'
        ? p.purchase_date
        : format(startOfMonth(parseISO(p.purchase_date)), 'yyyy-MM');
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += p.quantity * p.price;
      map[key].count += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        date: dateMode === 'daily'
          ? format(parseISO(key), 'MMM dd')
          : format(parseISO(key + '-01'), 'MMM yyyy'),
        total: +val.total.toFixed(2),
        count: val.count
      }));
  })();

  // Latest 5 purchases
  const latestPurchases = purchases.slice(0, 5);

  return (
    <div className="dashboard">

      {/* ─── Hero Banner ─── */}
      <section className="hero-banner">
        <div className="hero-left">
          <span className="hero-label">DASHBOARD OVERVIEW</span>
          <h1 className="hero-title">Keep the whole buying cycle visible at a glance.</h1>
          <p className="hero-desc">
            This workspace focuses on the few numbers a shopkeeper needs every day: how much was spent, who supplied it, what prices are changing, and how much stock is in hand.
          </p>
        </div>
        <div className="hero-right">
          <Link to="/add" className="btn btn-primary hero-btn">
            <ShoppingBag size={16} /> Add Today's Purchase
          </Link>
          <Link to="/records" className="btn btn-outline-hero hero-btn">
            <Eye size={16} /> View All Records
          </Link>
          <div className="hero-spend-box">
            <span className="hero-spend-label">Current spend logged</span>
            <span className="hero-spend-value">₹{totalSpend.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* ─── Stat Cards ─── */}
      <section className="stat-cards-row">
        <div className="stat-card-v2">
          <span className="stat-tag tag-blue">TOTAL SPEND</span>
          <h2 className="stat-big-value">₹{totalSpend.toFixed(2)}</h2>
          <p className="stat-sub">{purchases.length} purchase entries recorded</p>
        </div>
        <div className="stat-card-v2">
          <span className="stat-tag tag-green">ACTIVE VENDORS</span>
          <h2 className="stat-big-value">{activeVendors}</h2>
          <p className="stat-sub">Quick view of your supplier network</p>
        </div>
        <div className="stat-card-v2">
          <span className="stat-tag tag-orange">ITEMS PURCHASED</span>
          <h2 className="stat-big-value">{uniqueItems}</h2>
          <p className="stat-sub">{uniqueItems} unique items tracked</p>
        </div>
        <div className="stat-card-v2">
          <span className="stat-tag tag-purple">STOCK ON HAND</span>
          <h2 className="stat-big-value">{totalStock}</h2>
          <p className="stat-sub">{totalStock === 0 ? 'No stock movement yet' : `${totalStock} units available`}</p>
        </div>
      </section>

      {/* ─── Row 2: Vendor Spending | Price Trend | Recent Activity ─── */}
      <section className="dash-grid-3">

        {/* Vendor Spending */}
        <div className="dash-card">
          <span className="card-tag tag-blue">VENDOR SPENDING</span>
          <h3 className="card-heading">Spend by Supplier</h3>
          {vendorSpendData.length > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorSpendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5f1f8" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={v => [`₹${v}`, 'Spent']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                  <Bar dataKey="spent" fill="#4DA8DA" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-bold">No vendor data yet</p>
              <p className="empty-muted">As purchases are saved, vendor totals will appear here.</p>
            </div>
          )}
        </div>

        {/* Price Trend */}
        <div className="dash-card">
          <div className="card-header-row">
            <div>
              <span className="card-tag tag-blue">PRICE TREND</span>
              <h3 className="card-heading">Item Price Over Time</h3>
            </div>
            <div className="item-select-box">
              <label className="item-select-label">Item</label>
              <select
                className="item-select"
                value={selectedItem || allItemNames[0] || ''}
                onChange={e => setSelectedItem(e.target.value)}
              >
                {allItemNames.length === 0 && <option value="">—</option>}
                {allItemNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          {priceTrendData.length > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5f1f8" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={v => [`₹${v}`, 'Price']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                  <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-bold">No price trend yet</p>
              <p className="empty-muted">Add at least one purchase to compare item prices over time.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dash-card">
          <span className="card-tag tag-blue">RECENT ACTIVITY</span>
          <h3 className="card-heading">Latest Purchases</h3>
          {latestPurchases.length > 0 ? (
            <ul className="recent-list">
              {latestPurchases.map(p => (
                <li key={p.id} className="recent-item">
                  <div className="recent-info">
                    <span className="recent-name">{p.item_name}</span>
                    <span className="recent-vendor">{p.vendors?.name || '—'}</span>
                  </div>
                  <div className="recent-right">
                    <span className="recent-amount">₹{(p.price * p.quantity).toFixed(2)}</span>
                    <span className="recent-date">{format(parseISO(p.purchase_date), 'MMM dd')}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="empty-bold">No purchases yet</p>
              <p className="empty-muted">Start with the Add Purchase page and the dashboard will fill itself in.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Row 3: Item Summary | Date-wise | Inventory ─── */}
      <section className="dash-grid-3">

        {/* Item Quantity Summary */}
        <div className="dash-card">
          <span className="card-tag tag-blue">ITEM SUMMARY</span>
          <h3 className="card-heading">Quantity Purchased</h3>
          {itemQtyData.length > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={itemQtyData} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, qty }) => `${name}: ${qty}`}>
                    {itemQtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-bold">No item summary yet</p>
              <p className="empty-muted">Item totals will appear after purchases are entered.</p>
            </div>
          )}
        </div>

        {/* Date-wise Purchases */}
        <div className="dash-card">
          <div className="card-header-row">
            <div>
              <span className="card-tag tag-blue">DATE-WISE PURCHASES</span>
              <h3 className="card-heading">Daily / Monthly Summary</h3>
            </div>
            <div className="toggle-group">
              <button className={`toggle-btn ${dateMode === 'daily' ? 'active' : ''}`} onClick={() => setDateMode('daily')}>Daily</button>
              <button className={`toggle-btn ${dateMode === 'monthly' ? 'active' : ''}`} onClick={() => setDateMode('monthly')}>Monthly</button>
            </div>
          </div>
          {dateWiseData.length > 0 ? (
            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dateWiseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5f1f8" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 12 }} tickFormatter={v => `₹${v}`} />
                  <Tooltip formatter={(v, name) => name === 'total' ? [`₹${v}`, 'Spent'] : [v, 'Entries']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-bold">No timeline yet</p>
              <p className="empty-muted">Timeline summaries appear automatically after purchase entries are saved.</p>
            </div>
          )}
        </div>

        {/* Inventory / Current Stock */}
        <div className="dash-card">
          <span className="card-tag tag-green">INVENTORY</span>
          <h3 className="card-heading">Current Stock</h3>
          {inventory.length > 0 ? (
            <div className="stock-table-wrap">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'right' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id}>
                      <td>{item.item_name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-bold">No stock yet</p>
              <p className="empty-muted">Add purchases and stock will build automatically.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
