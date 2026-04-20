import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, ShoppingCart, List, LayoutDashboard, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <LayoutDashboard className="logo-icon" size={28} />
          <h2>ShopManager</h2>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <Home size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/add" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <PlusCircle size={20} />
              <span>Add Purchase</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/sale" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <ShoppingCart size={20} />
              <span>Log Sale</span>
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/records" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <List size={20} />
              <span>View Records</span>
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
  );
};

export default Sidebar;
