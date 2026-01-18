import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Building } from 'lucide-react';

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    workshopName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('workshopUsers') || '[]');
    const existingUser = users.find(u => u.email === formData.email);
    
    if (existingUser) {
      setError('Email already registered. Please login instead.');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      name: formData.name,
      email: formData.email,
      workshopName: formData.workshopName,
      password: formData.password,
      createdAt: new Date().toISOString()
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('workshopUsers', JSON.stringify(users));
    
    // Log in the user
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    onLogin(newUser);
    navigate('/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-background" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/home.png)` }}></div>
      <div className="auth-overlay"></div>

      <div className="auth-card" style={{ position: 'relative', zIndex: 1, margin: '0 auto' }}>
          <div className="auth-header">
            <img src={process.env.PUBLIC_URL + "/header.png"} alt="OneShot Workshop" className="auth-logo" />
            <h2>Create Account</h2>
            <p>Start managing your workshop today</p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={20} />
                <input
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={20} />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Workshop Name</label>
              <div className="input-with-icon">
                <Building size={20} />
                <input
                  type="text"
                  placeholder="OneShot Workshop"
                  value={formData.workshopName}
                  onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="auth-input-group">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account
            </button>
          </form>

        <div className="auth-footer">
          <p>Already have an account? <button onClick={() => navigate('/login')} className="auth-link">Sign in here</button></p>
        </div>
      </div>
    </div>
  );
}

export default Register;
