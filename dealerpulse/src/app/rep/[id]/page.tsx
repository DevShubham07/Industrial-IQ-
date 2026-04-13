'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getData, getMonths, branchMap } from '@/lib/data';
import { computeRepMetrics } from '@/lib/analytics';
import { formatCurrency, formatPct, formatMonth, daysSinceLastActivity, formatDate } from '@/lib/formatters';
import { STAGE_LABELS, LeadStatus } from '@/lib/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];
const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', contacted: '#06b6d4', test_drive: '#8b5cf6',
  negotiation: '#f59e0b', order_placed: '#10b981', delivered: '#34d399', lost: '#ef4444',
};
const data = getData();

export default function RepPage() {
  const params = useParams();
  const repId = params.id as string;
  const months = getMonths();
  const [startMonth, setStartMonth] = useState(months[0]);
  const [endMonth, setEndMonth] = useState(months[months.length - 1]);
  const [sortBy, setSortBy] = useState<'last_activity' | 'deal_value' | 'status'>('last_activity');

  const rep = data.sales_reps.find(r => r.id === repId);
  if (!rep) return <div>Rep not found</div>;

  const branch = branchMap.get(rep.branch_id)!;
  const metrics = useMemo(() => computeRepMetrics(repId, data.leads, startMonth, endMonth), [repId, startMonth, endMonth]);

  const repLeads = useMemo(() => {
    return data.leads.filter(l => {
      const m = l.created_at.substring(0, 7);
      return l.assigned_to === repId && m >= startMonth && m <= endMonth;
    });
  }, [repId, startMonth, endMonth]);

  const activeLeads = repLeads.filter(l => !['delivered', 'lost'].includes(l.status));
  const sortedActiveLeads = useMemo(() => {
    return [...activeLeads].sort((a, b) => {
      if (sortBy === 'last_activity') return new Date(a.last_activity_at).getTime() - new Date(b.last_activity_at).getTime();
      if (sortBy === 'deal_value') return b.deal_value - a.deal_value;
      return a.status.localeCompare(b.status);
    });
  }, [activeLeads, sortBy]);

  // Stage breakdown for pie chart
  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    repLeads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      status,
      label: STAGE_LABELS[status as LeadStatus] || status,
      count,
      color: STATUS_COLORS[status] || '#64748b',
    }));
  }, [repLeads]);

  const tooltipStyle = {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '13px',
  };

  // Branch average conversion for comparison
  const branchReps = data.sales_reps.filter(r => r.branch_id === rep.branch_id);
  const branchAvgConversion = useMemo(() => {
    const allMetrics = branchReps.map(r => computeRepMetrics(r.id, data.leads, startMonth, endMonth));
    const totalConv = allMetrics.reduce((s, m) => s + m.conversionRate, 0);
    return allMetrics.length > 0 ? totalConv / allMetrics.length : 0;
  }, [branchReps, startMonth, endMonth]);

  return (
    <div>
      <div className="page-breadcrumb">
        <Link href="/">Overview</Link>
        <span>/</span>
        <Link href={`/branch/${branch.id}`}>{branch.name}</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>{rep.name}</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">{rep.name}</h1>
        <p className="page-subtitle">
          {rep.role === 'branch_manager' ? '🏢 Branch Manager' : '👤 Sales Officer'} • {branch.name}, {branch.city}
        </p>
      </div>

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
        <div className="metric-card blue">
          <div className="metric-label">Total Leads</div>
          <div className="metric-value">{metrics.totalLeads}</div>
          <div className="metric-sub">{metrics.activeLeads} active • {metrics.coldLeads} cold</div>
        </div>

        <div className="metric-card emerald">
          <div className="metric-label">Delivered</div>
          <div className="metric-value">{metrics.deliveredCount}</div>
          <div className="metric-sub">Revenue: {formatCurrency(metrics.totalRevenue)}</div>
        </div>

        <div className="metric-card purple">
          <div className="metric-label">Conversion</div>
          <div className="metric-value">{formatPct(metrics.conversionRate, 1)}</div>
          <div className="metric-sub">
            Branch avg: {formatPct(branchAvgConversion, 0)}
            <span className={`metric-trend ${metrics.conversionRate >= branchAvgConversion ? 'up' : 'down'}`}>
              {metrics.conversionRate >= branchAvgConversion ? '↑ Above' : '↓ Below'}
            </span>
          </div>
        </div>

        <div className="metric-card amber">
          <div className="metric-label">Pipeline Value</div>
          <div className="metric-value">{formatCurrency(metrics.pipelineValue)}</div>
          <div className="metric-sub">{metrics.activeLeads} leads in progress</div>
        </div>
      </div>

      {/* Stage breakdown + Comparison */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Lead Status Breakdown</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stageData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="count" nameKey="label">
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">vs. Branch Average</div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[
              { metric: 'Conversion %', rep: metrics.conversionRate, branch: branchAvgConversion },
              { metric: 'Leads', rep: metrics.totalLeads, branch: Math.round(branchReps.reduce((s, r) => {
                const m = computeRepMetrics(r.id, data.leads, startMonth, endMonth);
                return s + m.totalLeads;
              }, 0) / branchReps.length) },
              { metric: 'Delivered', rep: metrics.deliveredCount, branch: Math.round(branchReps.reduce((s, r) => {
                const m = computeRepMetrics(r.id, data.leads, startMonth, endMonth);
                return s + m.deliveredCount;
              }, 0) / branchReps.length) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="rep" fill="#3b82f6" name={rep.name} radius={[4, 4, 0, 0]} />
              <Bar dataKey="branch" fill="rgba(148,163,184,0.3)" name="Branch Avg" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Leads Table */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Active Leads ({sortedActiveLeads.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`filter-btn ${sortBy === 'last_activity' ? 'active' : ''}`} onClick={() => setSortBy('last_activity')}>
              By Urgency
            </button>
            <button className={`filter-btn ${sortBy === 'deal_value' ? 'active' : ''}`} onClick={() => setSortBy('deal_value')}>
              By Value
            </button>
            <button className={`filter-btn ${sortBy === 'status' ? 'active' : ''}`} onClick={() => setSortBy('status')}>
              By Stage
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Model</th>
                <th>Status</th>
                <th>Deal Value</th>
                <th>Days Idle</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {sortedActiveLeads.map(lead => {
                const daysIdle = daysSinceLastActivity(lead.last_activity_at);
                return (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 500 }}>{lead.customer_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{lead.model_interested}</td>
                    <td>
                      <span className={`status-badge ${lead.status}`}>
                        {STAGE_LABELS[lead.status]}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(lead.deal_value, false)}</td>
                    <td>
                      <span style={{
                        color: daysIdle >= 7 ? 'var(--accent-red)' : daysIdle >= 3 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                        fontWeight: 600,
                      }}>
                        {daysIdle}d
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{lead.source}</td>
                  </tr>
                );
              })}
              {sortedActiveLeads.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                    No active leads in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cold Leads Alert */}
      {metrics.coldLeads > 0 && (
        <div className="insight-card danger" style={{ marginBottom: 24 }}>
          <div className="insight-icon">🔴</div>
          <div className="insight-content">
            <div className="insight-title">{metrics.coldLeads} leads going cold</div>
            <div className="insight-description">
              These leads haven&apos;t had activity in 7+ days and need immediate follow-up to prevent loss.
            </div>
          </div>
          <div className="insight-metric">{metrics.coldLeads}</div>
        </div>
      )}
    </div>
  );
}
