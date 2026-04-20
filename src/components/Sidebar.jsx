import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, List, LayoutDashboard, Settings, Building, Menu, X } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeSidebar = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu size={24} />
      </button>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <div className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <LayoutDashboard className="logo-icon" size={28} />
            <h2>ShopManager</h2>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <Home size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/add" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <PlusCircle size={20} />
                <span>Add Purchase</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/records" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <List size={20} />
                <span>Purchase Records</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/vendors" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeSidebar}>
                <Building size={20} />
                <span>Vendors</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <a href="#" className="nav-link">
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
