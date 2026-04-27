import React, { useState } from 'react';
import { User, Lock, LogIn, ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Hardcoded credentials for Dad's convenience
    setTimeout(() => {
      if (id === 'Admin@123' && password === 'korde@123') {
        onLogin();
      } else {
        setError('Invalid ID or Password. Please try again.');
        setIsLoading(false);
      }
    }, 800); // Small delay for premium feel
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-badge">
              <ShieldCheck size={32} />
            </div>
            <h1>Welcome Back</h1>
            <p>Please log in to manage your shop</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="id">Admin ID</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  id="id"
                  placeholder="Enter your ID"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`login-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
          
          <div className="login-footer">
            <p>© 2024 ShopManager Admin Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
