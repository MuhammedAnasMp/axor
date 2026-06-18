import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function VisualReports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.reports()
      .then((data) => {
        setReportData(data);
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
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
      </div>
    );
  }

  // Calculate max daily sales to scale columns
  const maxSales = Math.max(...(reportData?.sales_daily?.map(d => d.sales) || [1000]));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Visual Reports & Analytics</h2>
        <p className="text-xs text-text-secondary">Interactive graphical breakdown of sales volume, operational margins, and credit logs.</p>
      </div>

      {/* Grid: Main Sales Chart & Best Sellers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Chart Card */}
        <div className="lg:col-span-2 rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-6">Daily Sales Volume & Profit (Last 7 Days)</h3>
          
          {/* SVG/CSS Bar Graph */}
          <div className="flex h-64 items-end justify-between px-2 pt-4 border-b border-surface-low space-x-2">
            {reportData?.sales_daily?.map((day, idx) => {
              const salesHeight = maxSales > 0 ? (day.sales / maxSales) * 180 : 0;
              const profitHeight = maxSales > 0 ? (day.profit / maxSales) * 180 : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center justify-center bg-text-primary text-[10px] text-white p-2 rounded shadow-lg z-10 w-24">
                    <span>Sales: ₹{day.sales.toFixed(0)}</span>
                    <span className="text-green-400">Profit: ₹{day.profit.toFixed(0)}</span>
                  </div>

                  <div className="w-full flex justify-center space-x-1 items-end h-48">
                    {/* Sales Column */}
                    <div 
                      className="w-3 sm:w-5 bg-brand-blue rounded-t transition-all duration-500 hover:bg-brand-cobalt"
                      style={{ height: `${Math.max(salesHeight, 4)}px` }}
                    ></div>
                    {/* Profit Column */}
                    <div 
                      className="w-3 sm:w-5 bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600"
                      style={{ height: `${Math.max(profitHeight, 4)}px` }}
                    ></div>
                  </div>

                  {/* Date label */}
                  <span className="text-[10px] text-text-secondary mt-2 block font-mono">
                    {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-start space-x-6 text-[11px] font-semibold text-text-secondary pt-3 px-2">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 bg-brand-blue rounded-sm"></span>
              <span>Total Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 bg-green-500 rounded-sm"></span>
              <span>Net Profit (INR)</span>
            </div>
          </div>
        </div>

        {/* Best Sellers */}
        <div className="rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Top 5 Best Selling Items</h3>
          <div className="space-y-4">
            {reportData?.best_sellers?.map((prod, index) => (
              <div key={index} className="flex items-center justify-between text-xs border-b border-surface-low pb-2.5">
                <div>
                  <div className="font-semibold text-text-primary">{prod.product__name}</div>
                  <div className="text-[10px] text-text-secondary">Quantity sold: {prod.total_qty} units</div>
                </div>
                <div className="font-bold text-brand-blue">{formatCurrency(prod.total_revenue)}</div>
              </div>
            ))}
            {(!reportData?.best_sellers || reportData.best_sellers.length === 0) && (
              <div className="text-center text-xs text-text-secondary py-12">No sales records logged yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Expense Breakdown, Customer & Supplier Balances */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Expenses distribution */}
        <div className="rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Expenses Category Spread</h3>
          <div className="space-y-3">
            {reportData?.expense_breakdown?.map((exp, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold text-text-primary">
                  <span>{exp.category__name}</span>
                  <span>{formatCurrency(exp.total_amount)}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-low rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            ))}
            {(!reportData?.expense_breakdown || reportData.expense_breakdown.length === 0) && (
              <div className="text-center text-xs text-text-secondary py-12">No expenses recorded.</div>
            )}
          </div>
        </div>

        {/* Customer Balances */}
        <div className="rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Receivables (Customer Balances)</h3>
          <div className="space-y-3">
            {reportData?.customer_balances?.map((cust, i) => (
              <div key={i} className="flex justify-between text-xs border-b border-surface-low pb-2">
                <span className="font-semibold text-text-primary">{cust.name}</span>
                <span className="font-bold text-amber-600">{formatCurrency(cust.outstanding_balance)}</span>
              </div>
            ))}
            {(!reportData?.customer_balances || reportData.customer_balances.length === 0) && (
              <div className="text-center text-xs text-text-secondary py-12">No customer outstanding balances.</div>
            )}
          </div>
        </div>

        {/* Supplier Balances */}
        <div className="rounded-lg bg-white p-6 shadow-sm" style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Payables (Supplier Balances)</h3>
          <div className="space-y-3">
            {reportData?.supplier_balances?.map((sup, i) => (
              <div key={i} className="flex justify-between text-xs border-b border-surface-low pb-2">
                <span className="font-semibold text-text-primary">{sup.name}</span>
                <span className="font-bold text-error">{formatCurrency(sup.outstanding_balance)}</span>
              </div>
            ))}
            {(!reportData?.supplier_balances || reportData.supplier_balances.length === 0) && (
              <div className="text-center text-xs text-text-secondary py-12">No supplier outstanding payables.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
