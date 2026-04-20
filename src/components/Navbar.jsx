import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ title = 'Dashboard' }) => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2>{title}</h2>
      </div>
      
      <div className="navbar-right">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>
        
        <button className="icon-btn">
          <Bell size={20} />
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            <User size={20} />
          </div>
          <span className="user-name">Shopkeeper</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
