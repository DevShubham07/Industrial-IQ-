'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList } from 'recharts';
import { getData, getMonths } from '@/lib/data';
import { computeFunnel, computeLostReasons, computeDeliveryAnalytics, computeForecast, computeWhatIf } from '@/lib/analytics';
import { formatCurrency, formatPct, formatMonth } from '@/lib/formatters';
import { STAGE_LABELS, LeadStatus, LEAD_STAGES } from '@/lib/types';

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#34d399'];
const data = getData();

export default function PipelinePage() {
  const months = getMonths();
  const [startMonth, setStartMonth] = useState(months[0]);
  const [endMonth, setEndMonth] = useState(months[months.length - 1]);
  const [whatIfStage, setWhatIfStage] = useState('negotiation');
  const [whatIfPct, setWhatIfPct] = useState(10);

  const funnel = useMemo(() => computeFunnel(data.leads, startMonth, endMonth), [startMonth, endMonth]);
  const lostReasons = useMemo(() => computeLostReasons(data.leads, startMonth, endMonth), [startMonth, endMonth]);
  const deliveryStats = useMemo(() => computeDeliveryAnalytics(null), []);
  const forecast = useMemo(() => computeForecast(null, startMonth, endMonth), [startMonth, endMonth]);
  const whatIf = useMemo(() => computeWhatIf(whatIfStage, whatIfPct, null, startMonth, endMonth), [whatIfStage, whatIfPct, startMonth, endMonth]);

  const tooltipStyle = {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '13px',
  };

  const stages = ['contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered'] as const;

  return (
    <div>
      <div className="page-breadcrumb">
        <Link href="/">Overview</Link>
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }}>Pipeline & Funnel</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Lead Pipeline</h1>
        <p className="page-subtitle">Conversion funnel, forecasting, and delivery performance</p>
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

      {/* Funnel KPIs */}
      <div className="metric-grid stagger-children">
        <div className="metric-card blue">
          <div className="metric-label">Total Leads</div>
          <div className="metric-value">{funnel[0]?.count || 0}</div>
          <div className="metric-sub">Entered pipeline</div>
        </div>
        <div className="metric-card emerald">
          <div className="metric-label">Delivered</div>
          <div className="metric-value">{funnel.find(f => f.stage === 'delivered')?.count || 0}</div>
          <div className="metric-sub">
            {formatPct(funnel.find(f => f.stage === 'delivered')?.pct || 0, 1)} of total
          </div>
        </div>
        <div className="metric-card amber">
          <div className="metric-label">Pipeline Forecast</div>
          <div className="metric-value">{formatCurrency(forecast.forecastedRevenue)}</div>
          <div className="metric-sub">{forecast.activeLeads} active leads</div>
        </div>
        <div className="metric-card purple">
          <div className="metric-label">Avg. Delivery</div>
          <div className="metric-value">{deliveryStats.avgDays}d</div>
          <div className="metric-sub">
            {formatPct(deliveryStats.delayPct, 0)} delayed
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Conversion Funnel</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {funnel.map((stage, i) => {
              const maxCount = funnel[0]?.count || 1;
              const widthPct = (stage.count / maxCount) * 100;
              return (
                <div key={stage.stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 90, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
                    {STAGE_LABELS[stage.stage as LeadStatus]}
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                      height: 32,
                      width: `${Math.max(widthPct, 5)}%`,
                      background: `linear-gradient(90deg, ${COLORS[i]}, ${COLORS[i]}88)`,
                      borderRadius: '0 6px 6px 0',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 12,
                      transition: 'width 600ms ease',
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{stage.count}</span>
                    </div>
                  </div>
                  <div style={{ width: 60, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {formatPct(stage.pct, 0)}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Drop-off analysis */}
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(148,163,184,0.05)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Stage-by-Stage Drop-off</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {funnel.slice(1).map((stage, i) => (
                <div key={stage.stage} style={{
                  padding: '8px 14px',
                  background: stage.dropOffPct > 50 ? 'rgba(239,68,68,0.1)' : 'rgba(148,163,184,0.05)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${stage.dropOffPct > 50 ? 'rgba(239,68,68,0.2)' : 'var(--bg-card-border)'}`,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {STAGE_LABELS[funnel[i].stage as LeadStatus]} → {STAGE_LABELS[stage.stage as LeadStatus]}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: stage.dropOffPct > 50 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                    -{formatPct(stage.dropOffPct, 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Lost Reasons</div>
          </div>
          {lostReasons.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={lostReasons} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis dataKey="reason" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} name="Lost Leads" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {lostReasons.slice(0, 3).map(r => (
                  <div key={r.reason} className="insight-card warning" style={{ padding: '10px 14px', flex: '1 1 150px' }}>
                    <div className="insight-content">
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.reason}</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{r.count} <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({formatPct(r.pct, 0)})</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No data</div>
          )}
        </div>
      </div>

      {/* What-If Scenario */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">🔮 What-If Scenario</div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Explore how improving conversion at specific stages impacts revenue.
        </p>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Improve conversion at:
              </label>
              <select className="filter-select" value={whatIfStage} onChange={e => setWhatIfStage(e.target.value)}>
                {stages.map(s => (
                  <option key={s} value={s}>{STAGE_LABELS[s as LeadStatus]}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                Improvement: +{whatIfPct}%
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="slider"
                  min={5}
                  max={50}
                  value={whatIfPct}
                  onChange={e => setWhatIfPct(parseInt(e.target.value))}
                />
                <div className="slider-value">+{whatIfPct}%</div>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              flex: '1 1 140px',
              padding: 20,
              background: 'rgba(148,163,184,0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--bg-card-border)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Current Forecast</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{formatCurrency(whatIf.currentForecast)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Rate: {formatPct(whatIf.currentRate * 100, 0)}
              </div>
            </div>
            <div style={{
              flex: '1 1 140px',
              padding: 20,
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--accent-emerald)', marginBottom: 4 }}>Improved Forecast</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatCurrency(whatIf.improvedForecast)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Rate: {formatPct(whatIf.improvedRate * 100, 0)}
              </div>
            </div>
            <div style={{
              flex: '1 1 140px',
              padding: 20,
              background: whatIf.revenueImpact > 0 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(148,163,184,0.05)',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${whatIf.revenueImpact > 0 ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-card-border)'}`,
            }}>
              <div style={{ fontSize: 12, color: 'var(--accent-blue)', marginBottom: 4 }}>Revenue Impact</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-blue)' }}>
                +{formatCurrency(whatIf.revenueImpact)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                additional revenue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Performance */}
      <div className="chart-grid">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Delivery Timeline</div>
          </div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800 }}>{deliveryStats.avgDays}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg. Days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-emerald)' }}>{deliveryStats.onTime}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>On Time</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--accent-red)' }}>{deliveryStats.delayed}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Delayed</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 14, marginBottom: 8 }}>
            <div className="progress-fill emerald" style={{ width: `${100 - deliveryStats.delayPct}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatPct(100 - deliveryStats.delayPct, 0)} delivered on time
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Delay Reasons</div>
          </div>
          {deliveryStats.delayReasons.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={deliveryStats.delayReasons} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="count" nameKey="reason">
                  {deliveryStats.delayReasons.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(value: string) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No delays</div>
          )}
        </div>
      </div>

      {/* Pipeline Forecast by Stage */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">Pipeline Forecast by Stage</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Active Leads</th>
                <th>Historical Conv. Rate</th>
                <th>Probability</th>
              </tr>
            </thead>
            <tbody>
              {forecast.byStage.map(s => (
                <tr key={s.stage}>
                  <td>
                    <span className={`status-badge ${s.stage}`}>
                      {STAGE_LABELS[s.stage as LeadStatus]}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.leads}</td>
                  <td>{formatPct(s.rate * 100, 0)}</td>
                  <td>
                    <div className="progress-bar" style={{ width: 120 }}>
                      <div className="progress-fill blue" style={{ width: `${s.rate * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
