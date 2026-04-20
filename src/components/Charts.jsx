import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import './Charts.css';

const Charts = () => {
  const [vendorData, setVendorData] = useState([]);
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          price,
          quantity,
          purchase_date,
          item_name,
          vendors (name)
        `)
        .order('purchase_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // 1. Process vendor spending data
        const vendorSpendMap = {};
        data.forEach(p => {
          const vName = p.vendors?.name || 'Unknown';
          const spend = p.price * p.quantity;
          vendorSpendMap[vName] = (vendorSpendMap[vName] || 0) + spend;
        });

        const processedVendorData = Object.keys(vendorSpendMap)
          .map(key => ({
            name: key,
            spent: parseFloat(vendorSpendMap[key].toFixed(2))
          }))
          .sort((a, b) => b.spent - a.spent) // highest first
          .slice(0, 5); // top 5

        setVendorData(processedVendorData);

        // 2. Process price trend data (overall avg daily price as a simple trend example)
        const datePriceMap = {};
        data.forEach(p => {
          const date = p.purchase_date;
          if (!datePriceMap[date]) {
            datePriceMap[date] = { totalItems: 0, totalPriceSum: 0 };
          }
          // We'll track the average price of items bought that day
          datePriceMap[date].totalItems += 1;
          datePriceMap[date].totalPriceSum += p.price;
        });

        const processedPriceData = Object.keys(datePriceMap)
          .sort()
          .map(date => ({
            date: format(parseISO(date), 'MMM dd'),
            avgPrice: parseFloat((datePriceMap[date].totalPriceSum / datePriceMap[date].totalItems).toFixed(2))
          }));

        setPriceData(processedPriceData);
      }
    } catch (err) {
      console.error("Error fetching chart data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="charts-loading">Loading charts...</div>;
  }

  return (
    <div className="charts-grid">
      <div className="card chart-card">
        <h3 className="chart-title">Top Vendor Spending</h3>
        <div className="chart-wrapper">
          {vendorData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5f1f8" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#777'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#777'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(77, 168, 218, 0.05)'}} 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [`$${value}`, 'Spent']}
                />
                <Bar dataKey="spent" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="no-data">No data available yet</div>
          )}
        </div>
      </div>

      <div className="card chart-card">
        <h3 className="chart-title">Purchase Price Trend (Daily Avg)</h3>
        <div className="chart-wrapper">
          {priceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5f1f8" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#777'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#777'}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}
                  formatter={(value) => [`$${value}`, 'Avg Price']}
                />
                <Line type="monotone" dataKey="avgPrice" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No data available yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;
