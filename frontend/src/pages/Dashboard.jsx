import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.metrics()
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
      </div>
    );
  }

  const weOwe = metrics?.me_payable_to_supplier || 0;
  const theyOwe = metrics?.supplier_payable_to_me || 0;
  const netTally = weOwe - theyOwe;

  const cards = [
    {
      title: "Today's Sales",
      value: formatCurrency(metrics?.sales_today || 0),
      color: "border-l-4 border-primary bg-white",
      textColor: "text-primary",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: "Today's Profit",
      value: formatCurrency(metrics?.profit_today || 0),
      color: "border-l-4 border-green-600 bg-white",
      textColor: "text-green-600",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Cash in Hand",
      value: formatCurrency(metrics?.cash_in_hand || 0),
      color: "border-l-4 border-amber-500 bg-white",
      textColor: "text-amber-500",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Total Balance",
      value: formatCurrency(metrics?.bank_balance || 0),
      color: "border-l-4 border-secondary bg-white",
      textColor: "text-secondary",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    {
      title: "Low Stock Items",
      value: metrics?.low_stock_count || 0,
      color: "border-l-4 border-error bg-white",
      textColor: "text-error",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      title: "Customer Receivables",
      value: formatCurrency(metrics?.pending_customer_receivables || 0),
      color: "border-l-4 border-indigo-600 bg-white",
      textColor: "text-indigo-600",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7m0 0v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: "Supplier Balance (Tally)",
      value: netTally > 0
        ? `${formatCurrency(netTally)} (We Owe)`
        : netTally < 0
          ? `${formatCurrency(Math.abs(netTally))} (They Owe)`
          : `${formatCurrency(0)} (Settled)`,
      subtext: `We Owe: ${formatCurrency(weOwe)} | They Owe: ${formatCurrency(theyOwe)}`,
      color: netTally > 0
        ? "border-l-4 border-purple-600 bg-white"
        : netTally < 0
          ? "border-l-4 border-teal-600 bg-white"
          : "border-l-4 border-gray-400 bg-white",
      textColor: netTally > 0
        ? "text-purple-600"
        : netTally < 0
          ? "text-teal-600"
          : "text-text-secondary",
      icon: (
        <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Dashboard</h2>
        <p className="text-xs text-text-secondary">Overview of today's key performance indicators and operations.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.color}`}
            style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">{card.title}</span>
              {card.icon}
            </div>
            <div className={`mt-2 text-2xl font-semibold tracking-tight ${card.textColor}`}>
              {card.value}
            </div>
            {card.subtext && (
              <div className="mt-1 text-[10px] text-text-secondary font-medium">
                {card.subtext}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recents Tables Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <div className="rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Sales Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2">Invoice #</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Payment</th>
                  <th className="px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {metrics?.recent_sales?.map((sale, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 font-medium text-brand-blue">{sale.invoice_number}</td>
                    <td className="px-4 py-2.5 text-text-primary">{sale.customer_name || 'Walk-In Customer'}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{sale.payment_type}</td>
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{formatCurrency(sale.total_amount)}</td>
                  </tr>
                ))}
                {(!metrics?.recent_sales || metrics.recent_sales.length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No sales transactions logged today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Purchase Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-surface-low text-text-secondary font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2">PO #</th>
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low">
                {metrics?.recent_purchases?.map((pur, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 font-medium text-brand-blue">PO-{pur.id}</td>
                    <td className="px-4 py-2.5 text-text-primary">{pur.supplier_name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${pur.is_received ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {pur.is_received ? 'Received' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{formatCurrency(pur.total_amount)}</td>
                  </tr>
                ))}
                {(!metrics?.recent_purchases || metrics.recent_purchases.length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-text-secondary">No purchase orders logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
