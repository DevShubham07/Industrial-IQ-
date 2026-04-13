'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart, ComposedChart } from 'recharts';
import { getData, getMonths } from '@/lib/data';
import { computeAllBranchMetrics, computeMonthlyData, computeLeadSourceData, computeModelData, generateInsights } from '@/lib/analytics';
import { formatCurrency, formatPct, formatMonth } from '@/lib/formatters';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];
const data = getData();

export default function OverviewPage() {
  const months = getMonths();
  const [startMonth, setStartMonth] = useState(months[0]);
  const [endMonth, setEndMonth] = useState(months[months.length - 1]);

  const branchMetrics = useMemo(() => computeAllBranchMetrics(startMonth, endMonth), [startMonth, endMonth]);
  const monthlyData = useMemo(() => computeMonthlyData(null, startMonth, endMonth), [startMonth, endMonth]);
  const sourceData = useMemo(() => computeLeadSourceData(data.leads, startMonth, endMonth), [startMonth, endMonth]);
  const modelData = useMemo(() => computeModelData(data.leads, startMonth, endMonth), [startMonth, endMonth]);
  const insights = useMemo(() => generateInsights(startMonth, endMonth), [startMonth, endMonth]);

  // Aggregate metrics
  const totalRevenue = branchMetrics.reduce((s, b) => s + b.totalRevenue, 0);
  const totalTargetRevenue = branchMetrics.reduce((s, b) => s + b.targetAchievement.targetRevenue, 0);
  const totalDelivered = branchMetrics.reduce((s, b) => s + b.deliveredCount, 0);
  const totalTargetUnits = branchMetrics.reduce((s, b) => s + b.targetAchievement.targetUnits, 0);
  const totalPipeline = branchMetrics.reduce((s, b) => s + b.pipelineValue, 0);
  const totalLeads = branchMetrics.reduce((s, b) => s + b.totalLeads, 0);
  const avgConversion = totalLeads > 0 ? (totalDelivered / totalLeads) * 100 : 0;

  // Tooltip styling
  const tooltipStyle = {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '13px',
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Performance Overview</h1>
        <p className="page-subtitle">Complete view of all branches — {formatMonth(startMonth)} to {formatMonth(endMonth)}</p>
      </div>

      {/* Time Filter */}
      <div className="filter-bar">
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Period:</span>
        <select className="filter-select" value={startMonth} onChange={e => setStartMonth(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <span style={{ color: 'var(--text-muted)' }}>→</span>
        <select className="filter-select" value={endMonth} onChange={e => setEndMonth(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        {/* Quick filters */}
        <button className={`filter-btn ${startMonth === months[months.length - 1] && endMonth === months[months.length - 1] ? 'active' : ''}`}
          onClick={() => { setStartMonth(months[months.length - 1]); setEndMonth(months[months.length - 1]); }}>
          This Month
        </button>
        <button className={`filter-btn ${startMonth === months[months.length - 3] && endMonth === months[months.length - 1] ? 'active' : ''}`}
          onClick={() => { setStartMonth(months[months.length - 3]); setEndMonth(months[months.length - 1]); }}>
          Last Quarter
        </button>
        <button className={`filter-btn ${startMonth === months[0] && endMonth === months[months.length - 1] ? 'active' : ''}`}
          onClick={() => { setStartMonth(months[0]); setEndMonth(months[months.length - 1]); }}>
          All Time
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="metric-grid stagger-children">
        <div className="metric-card blue">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">{formatCurrency(totalRevenue)}</div>
          <div className="metric-sub">
            <span>Target: {formatCurrency(totalTargetRevenue)}</span>
            <span className={`metric-trend ${totalRevenue >= totalTargetRevenue * 0.8 ? 'up' : 'down'}`}>
              {formatPct(totalTargetRevenue > 0 ? (totalRevenue / totalTargetRevenue) * 100 : 0, 0)}
            </span>
          </div>
        </div>

        <div className="metric-card emerald">
          <div className="metric-label">Units Delivered</div>
          <div className="metric-value">{totalDelivered}</div>
          <div className="metric-sub">
            <span>Target: {totalTargetUnits}</span>
            <span className={`metric-trend ${totalDelivered >= totalTargetUnits * 0.8 ? 'up' : 'down'}`}>
              {formatPct(totalTargetUnits > 0 ? (totalDelivered / totalTargetUnits) * 100 : 0, 0)}
            </span>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-label">Pipeline Value</div>
          <div className="metric-value">{formatCurrency(totalPipeline)}</div>
          <div className="metric-sub">
            <span>{branchMetrics.reduce((s, b) => s + b.activeLeads, 0)} active leads</span>
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">{formatPct(avgConversion, 1)}</div>
          <div className="metric-sub">
            <span>{totalDelivered} of {totalLeads} leads</span>
          </div>
        </div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title"><span className="icon">💡</span> Smart Insights</div>
          <div className="insights-list stagger-children">
            {insights.map(insight => (
              <div key={insight.id} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">{insight.icon}</div>
                <div className="insight-content">
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-description">{insight.description}</div>
                </div>
                {insight.metric && <div className="insight-metric">{insight.metric}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Trend + Branch Comparison */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Revenue Trend</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v: any) => formatCurrency(v)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatCurrency(value, false)} />
              <Area type="monotone" dataKey="targetRevenue" fill="rgba(139, 92, 246, 0.1)" stroke="transparent" name="Target" />
              <Line type="monotone" dataKey="targetRevenue" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual Revenue" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Branch Performance</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={branchMetrics.map(b => ({
              name: b.branch.name.replace(' Toyota', ''),
              delivered: b.deliveredCount,
              target: b.targetAchievement.targetUnits,
              pct: b.targetAchievement.unitsPct,
            }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="target" fill="rgba(139, 92, 246, 0.2)" name="Target" radius={[0, 4, 4, 0]} />
              <Bar dataKey="delivered" fill="#10b981" name="Delivered" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lead Sources + Model Popularity */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Lead Sources</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="total"
                nameKey="label"
              >
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Revenue by Model</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={modelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v: any) => formatCurrency(v)} />
              <YAxis dataKey="model" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatCurrency(value, false)} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Branch Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Branch Summary</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>City</th>
                <th>Leads</th>
                <th>Delivered</th>
                <th>Conversion</th>
                <th>Revenue</th>
                <th>Target %</th>
                <th>Pipeline</th>
              </tr>
            </thead>
            <tbody>
              {branchMetrics.map(bm => (
                <tr key={bm.branch.id}>
                  <td>
                    <Link href={`/branch/${bm.branch.id}`} style={{ fontWeight: 600 }}>
                      {bm.branch.name}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{bm.branch.city}</td>
                  <td>{bm.totalLeads}</td>
                  <td>{bm.deliveredCount}</td>
                  <td>
                    <span className={`metric-trend ${bm.conversionRate >= 30 ? 'up' : 'down'}`}>
                      {formatPct(bm.conversionRate, 0)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(bm.totalRevenue)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div
                          className={`progress-fill ${bm.targetAchievement.unitsPct >= 80 ? 'emerald' : bm.targetAchievement.unitsPct >= 60 ? 'amber' : 'red'}`}
                          style={{ width: `${Math.min(100, bm.targetAchievement.unitsPct)}%` }}
                        />
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formatPct(bm.targetAchievement.unitsPct, 0)}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--accent-amber)' }}>{formatCurrency(bm.pipelineValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Trend Table */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Leads Over Time</div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="newLeads" stackId="a" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" name="New Leads" />
            <Area type="monotone" dataKey="delivered" stackId="b" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" name="Delivered" />
            <Area type="monotone" dataKey="lostLeads" stackId="c" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" name="Lost" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
