import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../utils/api';

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
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      api.auth.login(username, password)
        .then(() => navigate('/erp'))
        .catch((err) => setError(err.message));
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
        alert('Registration successful! Please login.');
      })
      .catch((err) => setError(err.message));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <motion.div
        layout
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md"
        style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue text-white font-bold text-xl">
            A
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            {isLogin ? 'Login to Axon' : 'Create an Account'}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {isLogin ? 'Enter your credentials to access the ERP/POS' : 'Fill in the form to register a new employee'}
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
              onChange={(e) => setUsername(e.target.value)}
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
            className="w-full rounded bg-brand-blue py-2.5 text-sm font-semibold text-white hover:bg-brand-cobalt transition"
          >
            {isLogin ? 'Sign In' : 'Register'}
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
      </motion.div>
    </div>
  );
}
