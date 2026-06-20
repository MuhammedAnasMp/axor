import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { Spinner } from '../components/Skeleton';

const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Cashier');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [logoClicks, setLogoClicks] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState(null);

  const handleLogoClick = () => {
    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);
    if (nextClicks >= 5) {
      const isCurrentlyTest = localStorage.getItem('is_test_device') === 'true';
      localStorage.setItem('is_test_device', !isCurrentlyTest ? 'true' : 'false');
      alert(`Test Device Mode: ${!isCurrentlyTest ? 'ENABLED 🧪' : 'DISABLED ❌'}`);
      setLogoClicks(0);
      window.location.reload();
    } else {
      const timer = setTimeout(() => {
        setLogoClicks(0);
      }, 2000);
      setLogoClickTimer(timer);
    }
  };

  const [isTestDevice] = useState(localStorage.getItem('is_test_device') === 'true');
  const [localApiUrl, setLocalApiUrl] = useState(localStorage.getItem('local_api_url') || 'http://172.16.4.167:8001/api');
  const [prodApiUrl, setProdApiUrl] = useState(localStorage.getItem('production_api_url') || 'https://axor-0r99.onrender.com/api');
  const [activeApiMode, setActiveApiMode] = useState(localStorage.getItem('active_api_mode') || 'local');

  const saveApiSettings = (localUrl, prodUrl, mode) => {
    localStorage.setItem('local_api_url', localUrl);
    localStorage.setItem('production_api_url', prodUrl);
    localStorage.setItem('active_api_mode', mode);
    alert('API Settings Saved!');
    window.location.reload();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (isLogin) {
      api.auth.login(username, password)
        .then(() => navigate('/erp'))
        .catch((err) => {
          setError(err.message);
          setIsSubmitting(false);
        });
    } else {
      api.auth.register({
        username,
        password,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role
      })
        .then(() => {
          setIsLogin(true);
          setUsername('');
          setPassword('');
          setIsSubmitting(false);
          alert('Registration successful! Please login.');
        })
        .catch((err) => {
          setError(err.message);
          setIsSubmitting(false);
        });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <motion.div
        layout
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md"
        style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
      >
        <div className="mb-6 text-center flex flex-col items-center">
          <img 
            src="/icon_for_website-removebg-preview_no_border.png"
            alt="Axor Logo"
            onClick={handleLogoClick}
            className="h-16 w-16 mb-2 cursor-pointer select-none object-contain transition-transform hover:scale-105"
          />
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {isLogin ? 'Login to Axon' : 'Create an Account'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {isLogin ? 'please Enter your credentials to access the ERP/POS' : 'Fill in the form to register a new employee'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded bg-error-container p-3 text-xs text-error font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-blue"
                >
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Store Keeper">Store Keeper</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 rounded bg-brand-blue py-2.5 text-sm font-semibold text-white hover:bg-brand-cobalt transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting && <Spinner size="sm" />}
            <span>{isSubmitting ? (isLogin ? 'Signing In...' : 'Registering...') : (isLogin ? 'Sign In' : 'Register')}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-brand-blue hover:underline"
          >
            {isLogin ? "Don't have an account? Register employee" : 'Already have an account? Sign In'}
          </button>
        </div>

        {isTestDevice && (
          <div className="mt-6 border-t border-dashed border-surface-low pt-4 space-y-3">
            <h3 className="text-xs font-bold text-brand-blue flex items-center">
              🧪 Developer API Settings
            </h3>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary mb-1">Local API URL</label>
                <input
                  type="text"
                  value={localApiUrl}
                  onChange={(e) => setLocalApiUrl(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-secondary mb-1">Production API URL</label>
                <input
                  type="text"
                  value={prodApiUrl}
                  onChange={(e) => setProdApiUrl(e.target.value)}
                  className="w-full rounded border border-surface-dim bg-white px-2 py-1 text-xs text-text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-text-secondary mb-1">Active Environment</label>
                <div className="flex space-x-4 mt-1">
                  <label className="flex items-center space-x-1.5 text-xs text-text-primary cursor-pointer select-none">
                    <input
                      type="radio"
                      name="api_mode"
                      value="local"
                      checked={activeApiMode === 'local'}
                      onChange={() => setActiveApiMode('local')}
                      className="text-brand-blue focus:ring-brand-blue"
                    />
                    <span>Local</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-text-primary cursor-pointer select-none">
                    <input
                      type="radio"
                      name="api_mode"
                      value="production"
                      checked={activeApiMode === 'production'}
                      onChange={() => setActiveApiMode('production')}
                      className="text-brand-blue focus:ring-brand-blue"
                    />
                    <span>Production</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => saveApiSettings(localApiUrl, prodApiUrl, activeApiMode)}
                className="w-full mt-2 rounded bg-surface-low border border-surface-dim text-text-primary hover:bg-surface-dim py-1.5 text-xs font-semibold transition cursor-pointer"
              >
                Save & Apply Settings
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 text-center border-t border-surface-low pt-3">
          <span className="text-[10px] text-text-secondary font-medium">
            App Version: v{CURRENT_VERSION}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
