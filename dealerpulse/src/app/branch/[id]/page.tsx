'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line, Area } from 'recharts';
import { getData, getMonths } from '@/lib/data';
import { computeBranchMetrics, computeAllRepMetrics, computeMonthlyData, computeLostReasons, computeFunnel, computeDeliveryAnalytics } from '@/lib/analytics';
import { formatCurrency, formatPct, formatMonth } from '@/lib/formatters';
import { STAGE_LABELS } from '@/lib/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];
const data = getData();

export default function BranchPage() {
  const params = useParams();
  const branchId = params.id as string;
  const months = getMonths();
  const [startMonth, setStartMonth] = useState(months[0]);
  const [endMonth, setEndMonth] = useState(months[months.length - 1]);

  const branch = data.branches.find(b => b.id === branchId);
  if (!branch) return <div>Branch not found</div>;

  const metrics = useMemo(() => computeBranchMetrics(branchId, data.leads, startMonth, endMonth), [branchId, startMonth, endMonth]);
  const repMetrics = useMemo(() => computeAllRepMetrics(branchId, startMonth, endMonth), [branchId, startMonth, endMonth]);
  const monthlyData = useMemo(() => computeMonthlyData(branchId, startMonth, endMonth), [branchId, startMonth, endMonth]);
  const lostReasons = useMemo(() => computeLostReasons(data.leads.filter(l => l.branch_id === branchId), startMonth, endMonth), [branchId, startMonth, endMonth]);
  const funnel = useMemo(() => computeFunnel(data.leads.filter(l => l.branch_id === branchId), startMonth, endMonth), [branchId, startMonth, endMonth]);
  const deliveryStats = useMemo(() => computeDeliveryAnalytics(branchId), [branchId]);

  const tooltipStyle = {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '13px',
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="page-breadcrumb">
        <Link href="/">Overview</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{branch.name}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">{branch.name}</h1>
        <p className="page-subtitle">{branch.city} • {formatMonth(startMonth)} – {formatMonth(endMonth)}</p>
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
      </div>

      {/* KPIs */}
      <div className="metric-grid stagger-children">
        <div className="metric-card emerald">
          <div className="metric-label">Units Delivered</div>
          <div className="metric-value">{metrics.deliveredCount}</div>
          <div className="metric-sub">
            Target: {metrics.targetAchievement.targetUnits}
            <span className={`metric-trend ${metrics.targetAchievement.unitsPct >= 80 ? 'up' : 'down'}`}>
              {formatPct(metrics.targetAchievement.unitsPct, 0)}
            </span>
          </div>
        </div>

        <div className="metric-card blue">
          <div className="metric-label">Revenue</div>
          <div className="metric-value">{formatCurrency(metrics.totalRevenue)}</div>
          <div className="metric-sub">
            Target: {formatCurrency(metrics.targetAchievement.targetRevenue)}
          </div>
        </div>

        <div className="metric-card purple">
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-value">{formatPct(metrics.conversionRate, 1)}</div>
          <div className="metric-sub">{metrics.deliveredCount} of {metrics.deliveredCount + metrics.lostCount} closed leads</div>
        </div>

        <div className="metric-card amber">
          <div className="metric-label">Avg. Days to Deliver</div>
          <div className="metric-value">{metrics.avgDaysToDeliver || '—'}</div>
          <div className="metric-sub">{deliveryStats.delayed} of {deliveryStats.total} delayed</div>
        </div>
      </div>

      {/* Target Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Target Achievement</div>
        </div>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Units: {metrics.targetAchievement.units} / {metrics.targetAchievement.targetUnits}
            </div>
            <div className="progress-bar" style={{ height: 12 }}>
              <div
                className={`progress-fill ${metrics.targetAchievement.unitsPct >= 80 ? 'emerald' : metrics.targetAchievement.unitsPct >= 60 ? 'amber' : 'red'}`}
                style={{ width: `${Math.min(100, metrics.targetAchievement.unitsPct)}%` }}
              />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Revenue: {formatCurrency(metrics.targetAchievement.revenue)} / {formatCurrency(metrics.targetAchievement.targetRevenue)}
            </div>
            <div className="progress-bar" style={{ height: 12 }}>
              <div
                className={`progress-fill ${metrics.targetAchievement.revenuePct >= 80 ? 'emerald' : metrics.targetAchievement.revenuePct >= 60 ? 'amber' : 'red'}`}
                style={{ width: `${Math.min(100, metrics.targetAchievement.revenuePct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend + Pipeline Funnel */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Monthly Revenue</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v: any) => formatCurrency(v)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any) => formatCurrency(value, false)} />
              <Area type="monotone" dataKey="targetRevenue" fill="rgba(139,92,246,0.1)" stroke="transparent" />
              <Line type="monotone" dataKey="targetRevenue" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Conversion Funnel</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel.map(f => ({ ...f, label: STAGE_LABELS[f.stage as keyof typeof STAGE_LABELS] || f.stage }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis dataKey="label" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                {funnel.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rep Leaderboard + Lost Reasons */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Sales Rep Leaderboard</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rep</th>
                  <th>Role</th>
                  <th>Leads</th>
                  <th>Delivered</th>
                  <th>Conv.</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {repMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue).map(rm => (
                  <tr key={rm.rep.id}>
                    <td>
                      <Link href={`/rep/${rm.rep.id}`} style={{ fontWeight: 600 }}>
                        {rm.rep.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`status-badge ${rm.rep.role === 'branch_manager' ? 'order_placed' : 'contacted'}`}>
                        {rm.rep.role === 'branch_manager' ? 'Manager' : 'Officer'}
                      </span>
                    </td>
                    <td>{rm.totalLeads}</td>
                    <td>{rm.deliveredCount}</td>
                    <td>
                      <span className={`metric-trend ${rm.conversionRate >= 30 ? 'up' : 'down'}`}>
                        {formatPct(rm.conversionRate, 0)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(rm.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Why Leads Are Lost</div>
          </div>
          {lostReasons.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={lostReasons}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="reason"
                >
                  {lostReasons.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No lost leads in this period</div>
          )}
        </div>
      </div>

      {/* Delivery Stats */}
      {deliveryStats.delayReasons.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Delivery Delay Reasons</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deliveryStats.delayReasons}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="reason" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
