/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  TrendingUp, 
  BarChart3, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  Percent, 
  Tag, 
  Calendar,
  AlertTriangle
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, products } = usePOS();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  // Overall calculations based on sales register history
  const summaryStats = useMemo(() => {
    // Basic sums
    const totalRev = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTransactions = sales.length;
    
    // Total cost price of products sold to calculate gross margin
    let costOfGoodsSold = 0;
    sales.forEach(s => {
      s.items.forEach(item => {
        // Find matching product in catalog to fetch costPrice
        const prod = products.find(p => p.id === item.productId);
        const cost = prod ? prod.costPrice : item.salePrice * 0.7; // default fallback 70% COGS
        costOfGoodsSold += cost * item.quantity;
      });
    });

    const grossProfit = totalRev - costOfGoodsSold;
    const avgBasketValue = totalTransactions > 0 ? Math.round(totalRev / totalTransactions) : 0;
    const marginPercent = totalRev > 0 ? Math.round((grossProfit / totalRev) * 100) : 0;

    return {
      totalRev,
      totalTransactions,
      grossProfit,
      avgBasketValue,
      marginPercent
    };
  }, [sales, products]);

  // Aggregate product sales rankings
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        productMap[item.productId].qty += item.quantity;
        productMap[item.productId].revenue += item.total;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // top 5
  }, [sales]);

  // Daily revenue for trending charts (Sunday to Saturday simulation)
  const chartDaysData = useMemo(() => {
    return [
      { name: 'Mon', revenue: 42000, margin: 28 },
      { name: 'Tue', revenue: 35000, margin: 25 },
      { name: 'Wed', revenue: 58000, margin: 30 },
      { name: 'Thu', revenue: 49000, margin: 26 },
      { name: 'Fri', revenue: 78000, margin: 32 },
      { name: 'Sat', revenue: 95000, margin: 35 },
      { name: 'Sun', revenue: summaryStats.totalRev || 25000, margin: 31 } // Feed today's sale total here!
    ];
  }, [summaryStats.totalRev]);

  // Find max value for chart scaling
  const maxRevValue = useMemo(() => {
    const maxVal = Math.max(...chartDaysData.map(d => d.revenue));
    return maxVal > 0 ? maxVal : 10000;
  }, [chartDaysData]);

  return (
    <div className="flex-1 p-6 bg-slate-50 overflow-y-auto h-screen">
      
      {/* Header section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-850 tracking-tight">Financial Reports & Analytics</h2>
          <p className="text-sm text-slate-500 font-sans">Real-time charts, COGS margins, and gross revenue insights</p>
        </div>

        {/* Time-range switcher */}
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 text-xs shadow-xs">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              id={`report-time-${range}`}
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded font-bold capitalize transition-all ${
                timeRange === range
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-150'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Bento Grid summaries */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Metric 1: Net Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Gross Sales Revenue</span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> +14.2%
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-2">₨ {summaryStats.totalRev.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-sans mt-1">Net post-discount checkout value</p>
        </div>

        {/* Metric 2: Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Gross Gross Profit</span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono flex items-center gap-0.5">
              <Percent className="h-3 w-3" /> {summaryStats.marginPercent}%
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-2">₨ {summaryStats.grossProfit.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-sans mt-1">Calculated COGS net margin</p>
        </div>

        {/* Metric 3: Transaction volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Transactions Volume</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
              Invoiced
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-2">{summaryStats.totalTransactions}</p>
          <p className="text-[10px] text-slate-400 font-sans mt-1">Average sale basket size: ₨ {summaryStats.avgBasketValue.toLocaleString()}</p>
        </div>

        {/* Metric 4: Average Order value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Average Basket Value</span>
            <span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
              Value size
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono mt-2">₨ {summaryStats.avgBasketValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 font-sans mt-1">Revenue per finalized customer slip</p>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* LEFT CHART COLUMN: REVENUE DAILY SALES TREND (Bespoke custom SVG line graph!) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sales Trend Curve (Daily Gross Value)</h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Continuous visual tracking for Karachi business week</p>
            </div>
            <div className="flex gap-4 text-xxs font-mono text-slate-500 font-semibold">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> Gross Sales (₨)</span>
            </div>
          </div>

          {/* SVG Custom Render Graph */}
          <div className="h-60 w-full relative flex items-end">
            
            {/* Background dashed horizontal grid lines */}
            <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="border-t border-dashed border-slate-200 w-full"></div>
              ))}
            </div>

            {/* Main SVG Plot */}
            <svg className="w-full h-full pb-8 pr-2" viewBox="0 0 700 240" preserveAspectRatio="none">
              {/* Linear Gradient for Area fill */}
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Grid outline lines */}
              <g className="opacity-10 stroke-slate-400" strokeWidth="1">
                {/* vertical grid columns */}
                {chartDaysData.map((d, idx) => {
                  const x = 50 + (idx * 90);
                  return <line key={idx} x1={x} y1="0" x2={x} y2="200" />;
                })}
              </g>

              {/* Area fill path under trend line */}
              <path
                d={`M 50 ${200 - (chartDaysData[0].revenue / maxRevValue) * 180} 
                    L 140 ${200 - (chartDaysData[1].revenue / maxRevValue) * 180} 
                    L 230 ${200 - (chartDaysData[2].revenue / maxRevValue) * 180} 
                    L 320 ${200 - (chartDaysData[3].revenue / maxRevValue) * 180} 
                    L 410 ${200 - (chartDaysData[4].revenue / maxRevValue) * 180} 
                    L 500 ${200 - (chartDaysData[5].revenue / maxRevValue) * 180} 
                    L 590 ${200 - (chartDaysData[6].revenue / maxRevValue) * 180}
                    L 590 200 L 50 200 Z`}
                fill="url(#chartGrad)"
              />

              {/* The main bezier trend line */}
              <path
                d={`M 50 ${200 - (chartDaysData[0].revenue / maxRevValue) * 180} 
                    L 140 ${200 - (chartDaysData[1].revenue / maxRevValue) * 180} 
                    L 230 ${200 - (chartDaysData[2].revenue / maxRevValue) * 180} 
                    L 320 ${200 - (chartDaysData[3].revenue / maxRevValue) * 180} 
                    L 410 ${200 - (chartDaysData[4].revenue / maxRevValue) * 180} 
                    L 500 ${200 - (chartDaysData[5].revenue / maxRevValue) * 180} 
                    L 590 ${200 - (chartDaysData[6].revenue / maxRevValue) * 180}`}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Circular plot points */}
              {chartDaysData.map((d, idx) => {
                const x = 50 + (idx * 90);
                const y = 200 - (d.revenue / maxRevValue) * 180;
                return (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="5.5"
                      fill="#ffffff"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                    />
                    {/* Tooltip trigger hover */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      className="fill-transparent hover:fill-indigo-500/10 transition-colors"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis labels */}
            <div className="absolute inset-x-0 bottom-0 h-8 flex justify-between px-[30px] font-mono text-[10px] text-slate-400 font-bold items-center pt-2 border-t border-slate-100">
              {chartDaysData.map((d, idx) => (
                <div key={idx} className="text-center w-14">{d.name}</div>
              ))}
            </div>

            {/* Floated custom tooltip over today's value */}
            <div 
              className="absolute bg-slate-900 text-white rounded-lg px-2.5 py-1 text-[10px] font-mono shadow-md border border-slate-800"
              style={{
                left: '81%',
                bottom: `${40 + (summaryStats.totalRev / maxRevValue) * 120}px`,
                transform: 'translateX(-50%)'
              }}
            >
              Today: ₨ {summaryStats.totalRev.toLocaleString()}
            </div>

          </div>
        </div>

        {/* RIGHT CHART COLUMN: TOP PRODUCTS BY VALUE (Custom horizontal bar meter!) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-850">Top Products (Gross Sales Value)</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Most profitable catalog categories this period</p>
          </div>

          <div className="space-y-4 my-4 flex-1 flex flex-col justify-center">
            {topProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No product sales captured this period.</p>
              </div>
            ) : (
              topProducts.map((p, idx) => {
                // Find maximum value to scale widths properly
                const maxTopRev = topProducts[0]?.revenue || 1;
                const widthPercent = Math.round((p.revenue / maxTopRev) * 100);

                return (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-bold truncate max-w-[160px]">{p.name}</span>
                      <span className="font-mono text-slate-900 font-black">₨ {p.revenue.toLocaleString()}</span>
                    </div>
                    {/* Visual Bar container */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          idx === 0 
                            ? 'bg-primary' 
                            : idx === 1 
                            ? 'bg-indigo-400' 
                            : idx === 2 
                            ? 'bg-emerald-400' 
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Rank #{idx + 1}</span>
                      <span>{p.qty} items sold</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 pt-3.5 flex justify-between items-center text-[10px] text-slate-500">
            <span>Aggregated from live cart billing records</span>
            <span className="font-bold font-mono text-slate-700">5 Products</span>
          </div>
        </div>

      </div>

      {/* Expiry alerts & low stock summary list for managers */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-850 mb-3 flex items-center gap-1.5">
          <AlertTriangle className="h-4.5 w-4.5 text-warning-amber" />
          <span>Operational Risk Warning Log</span>
        </h3>
        
        {/* Alerts table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono font-bold uppercase tracking-wider">
                <th className="p-3">Product Item</th>
                <th className="p-3">Department Category</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3 text-center">Safety Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
              {products
                .filter(p => p.stockQuantity <= p.lowStockThreshold || p.expiryDate)
                .slice(0, 4)
                .map((p, idx) => {
                  const isOut = p.stockQuantity <= 0;
                  const isLow = p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="p-3 font-bold text-slate-850">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">
                        {isOut ? (
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black text-[9px] uppercase font-mono">
                            Critical Out-of-Stock
                          </span>
                        ) : isLow ? (
                          <span className="bg-warning-amber/10 text-warning-amber border border-warning-amber/20 px-2 py-0.5 rounded font-black text-[9px] uppercase font-mono">
                            Warning Low stock
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-black text-[9px] uppercase font-mono">
                            Expiry risk
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold">{p.stockQuantity} {p.unitType}s left</td>
                      <td className="p-3 text-slate-500 text-center">
                        {isOut 
                          ? 'Zero cash-inward potential. Orders blocked.' 
                          : isLow 
                          ? 'Order more with Stock-In to avoid stock-outs.' 
                          : `Batch expires on ${p.expiryDate}. Disposal audit required.`}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
