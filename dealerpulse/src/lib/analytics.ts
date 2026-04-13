import { Lead, Branch, SalesRep, Target, Delivery, BranchMetrics, RepMetrics, Insight, FunnelStage, MonthlyData, LEAD_STAGES, LeadStatus } from './types';
import { getData, branchMap, deliveryMap } from './data';
import { daysSinceLastActivity, getMonthKey, formatCurrency, formatPct } from './formatters';

const data = getData();

// ============================================================
// BRANCH METRICS
// ============================================================

export function computeBranchMetrics(branchId: string, leads: Lead[], startMonth: string, endMonth: string): BranchMetrics {
  const branch = branchMap.get(branchId)!;
  const branchLeads = leads.filter(l => l.branch_id === branchId);
  const monthLeads = branchLeads.filter(l => {
    const m = l.created_at.substring(0, 7);
    return m >= startMonth && m <= endMonth;
  });

  const delivered = monthLeads.filter(l => l.status === 'delivered');
  const lost = monthLeads.filter(l => l.status === 'lost');
  const active = monthLeads.filter(l => !['delivered', 'lost'].includes(l.status));

  const totalRevenue = delivered.reduce((sum, l) => sum + l.deal_value, 0);
  const pipelineValue = active.reduce((sum, l) => sum + l.deal_value, 0);

  const targets = data.targets.filter(t => t.branch_id === branchId && t.month >= startMonth && t.month <= endMonth);
  const targetUnits = targets.reduce((s, t) => s + t.target_units, 0);
  const targetRevenue = targets.reduce((s, t) => s + t.target_revenue, 0);

  const deliveries = delivered
    .map(l => deliveryMap.get(l.id))
    .filter(Boolean) as Delivery[];
  const avgDays = deliveries.length > 0
    ? deliveries.reduce((s, d) => s + d.days_to_deliver, 0) / deliveries.length
    : 0;

  const closedLeads = delivered.length + lost.length;

  return {
    branch,
    totalLeads: monthLeads.length,
    deliveredCount: delivered.length,
    lostCount: lost.length,
    activeLeads: active.length,
    conversionRate: closedLeads > 0 ? (delivered.length / closedLeads) * 100 : 0,
    totalRevenue,
    pipelineValue,
    avgDealValue: delivered.length > 0 ? totalRevenue / delivered.length : 0,
    avgDaysToDeliver: Math.round(avgDays),
    targetAchievement: {
      units: delivered.length,
      revenue: totalRevenue,
      targetUnits,
      targetRevenue,
      unitsPct: targetUnits > 0 ? (delivered.length / targetUnits) * 100 : 0,
      revenuePct: targetRevenue > 0 ? (totalRevenue / targetRevenue) * 100 : 0,
    },
  };
}

export function computeAllBranchMetrics(startMonth: string, endMonth: string): BranchMetrics[] {
  return data.branches.map(b => computeBranchMetrics(b.id, data.leads, startMonth, endMonth));
}

// ============================================================
// REP METRICS
// ============================================================

export function computeRepMetrics(repId: string, leads: Lead[], startMonth: string, endMonth: string): RepMetrics {
  const rep = data.sales_reps.find(r => r.id === repId)!;
  const branch = branchMap.get(rep.branch_id)!;
  const repLeads = leads.filter(l => l.assigned_to === repId);
  const monthLeads = repLeads.filter(l => {
    const m = l.created_at.substring(0, 7);
    return m >= startMonth && m <= endMonth;
  });

  const delivered = monthLeads.filter(l => l.status === 'delivered');
  const lost = monthLeads.filter(l => l.status === 'lost');
  const active = monthLeads.filter(l => !['delivered', 'lost'].includes(l.status));

  const totalRevenue = delivered.reduce((sum, l) => sum + l.deal_value, 0);
  const pipelineValue = active.reduce((sum, l) => sum + l.deal_value, 0);
  const closedLeads = delivered.length + lost.length;

  const coldLeads = active.filter(l => daysSinceLastActivity(l.last_activity_at) >= 7).length;

  return {
    rep,
    branchName: branch.name,
    totalLeads: monthLeads.length,
    deliveredCount: delivered.length,
    lostCount: lost.length,
    activeLeads: active.length,
    conversionRate: closedLeads > 0 ? (delivered.length / closedLeads) * 100 : 0,
    totalRevenue,
    pipelineValue,
    avgDealValue: delivered.length > 0 ? totalRevenue / delivered.length : 0,
    coldLeads,
  };
}

export function computeAllRepMetrics(branchId: string | null, startMonth: string, endMonth: string): RepMetrics[] {
  const reps = branchId
    ? data.sales_reps.filter(r => r.branch_id === branchId)
    : data.sales_reps;
  return reps.map(r => computeRepMetrics(r.id, data.leads, startMonth, endMonth));
}

// ============================================================
// FUNNEL ANALYTICS
// ============================================================

export function computeFunnel(leads: Lead[], startMonth: string, endMonth: string): FunnelStage[] {
  const monthLeads = leads.filter(l => {
    const m = l.created_at.substring(0, 7);
    return m >= startMonth && m <= endMonth;
  });

  // Count how many leads reached each stage (from status_history)
  const stageCounts: Record<string, number> = {};
  LEAD_STAGES.forEach(s => { stageCounts[s] = 0; });

  monthLeads.forEach(lead => {
    const stagesReached = new Set(lead.status_history.map(h => h.status));
    LEAD_STAGES.forEach(stage => {
      if (stagesReached.has(stage)) {
        stageCounts[stage]++;
      }
    });
  });

  const total = monthLeads.length;
  const stages: FunnelStage[] = [];

  LEAD_STAGES.forEach((stage, i) => {
    const count = stageCounts[stage];
    const prevCount = i === 0 ? total : stageCounts[LEAD_STAGES[i - 1]];
    const dropOff = prevCount - count;
    stages.push({
      stage,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
      dropOff: Math.max(0, dropOff),
      dropOffPct: prevCount > 0 ? (Math.max(0, dropOff) / prevCount) * 100 : 0,
    });
  });

  return stages;
}

// ============================================================
// MONTHLY TREND DATA
// ============================================================

export function computeMonthlyData(branchId: string | null, startMonth: string, endMonth: string): MonthlyData[] {
  const months = Array.from(new Set(data.targets.map(t => t.month))).sort();
  const filteredMonths = months.filter(m => m >= startMonth && m <= endMonth);

  return filteredMonths.map(month => {
    const monthLeads = data.leads.filter(l => {
      const m = l.created_at.substring(0, 7);
      const branchMatch = branchId ? l.branch_id === branchId : true;
      return m === month && branchMatch;
    });

    const deliveredLeads = data.leads.filter(l => {
      const branchMatch = branchId ? l.branch_id === branchId : true;
      if (!branchMatch || l.status !== 'delivered') return false;
      const delivery = deliveryMap.get(l.id);
      if (!delivery) return false;
      return delivery.delivery_date.substring(0, 7) === month;
    });

    const targets = data.targets.filter(t => {
      const branchMatch = branchId ? t.branch_id === branchId : true;
      return t.month === month && branchMatch;
    });

    const targetUnits = targets.reduce((s, t) => s + t.target_units, 0);
    const targetRevenue = targets.reduce((s, t) => s + t.target_revenue, 0);
    const revenue = deliveredLeads.reduce((s, l) => s + l.deal_value, 0);

    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1, 1);
    const label = date.toLocaleDateString('en-IN', { month: 'short' });

    return {
      month,
      label,
      delivered: deliveredLeads.length,
      revenue,
      targetUnits,
      targetRevenue,
      newLeads: monthLeads.length,
      lostLeads: monthLeads.filter(l => l.status === 'lost').length,
    };
  });
}

// ============================================================
// LEAD SOURCE ANALYTICS
// ============================================================

export function computeLeadSourceData(leads: Lead[], startMonth: string, endMonth: string) {
  const monthLeads = leads.filter(l => {
    const m = l.created_at.substring(0, 7);
    return m >= startMonth && m <= endMonth;
  });

  const sourceMap: Record<string, { total: number; delivered: number; revenue: number }> = {};

  monthLeads.forEach(lead => {
    const source = lead.source;
    if (!sourceMap[source]) sourceMap[source] = { total: 0, delivered: 0, revenue: 0 };
    sourceMap[source].total++;
    if (lead.status === 'delivered') {
      sourceMap[source].delivered++;
      sourceMap[source].revenue += lead.deal_value;
    }
  });

  const sourceLabels: Record<string, string> = {
    walk_in: 'Walk-in',
    website: 'Website',
    referral: 'Referral',
    social_media: 'Social Media',
    phone_enquiry: 'Phone',
    auto_expo: 'Auto Expo',
  };

  return Object.entries(sourceMap).map(([source, stats]) => ({
    source,
    label: sourceLabels[source] || source,
    total: stats.total,
    delivered: stats.delivered,
    revenue: stats.revenue,
    conversionRate: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0,
  })).sort((a, b) => b.total - a.total);
}

// ============================================================
// MODEL ANALYTICS
// ============================================================

export function computeModelData(leads: Lead[], startMonth: string, endMonth: string) {
  const monthLeads = leads.filter(l => {
    const m = l.created_at.substring(0, 7);
    return m >= startMonth && m <= endMonth;
  });

  const modelMap: Record<string, { total: number; delivered: number; revenue: number }> = {};

  monthLeads.forEach(lead => {
    const model = lead.model_interested;
    if (!modelMap[model]) modelMap[model] = { total: 0, delivered: 0, revenue: 0 };
    modelMap[model].total++;
    if (lead.status === 'delivered') {
      modelMap[model].delivered++;
      modelMap[model].revenue += lead.deal_value;
    }
  });

  return Object.entries(modelMap).map(([model, stats]) => ({
    model,
    total: stats.total,
    delivered: stats.delivered,
    revenue: stats.revenue,
    conversionRate: stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0,
  })).sort((a, b) => b.revenue - a.revenue);
}

// ============================================================
// DELIVERY ANALYTICS
// ============================================================

export function computeDeliveryAnalytics(branchId: string | null) {
  let deliveries = data.deliveries;
  if (branchId) {
    const branchLeadIds = new Set(data.leads.filter(l => l.branch_id === branchId).map(l => l.id));
    deliveries = deliveries.filter(d => branchLeadIds.has(d.lead_id));
  }

  const avgDays = deliveries.length > 0
    ? deliveries.reduce((s, d) => s + d.days_to_deliver, 0) / deliveries.length
    : 0;

  const delayReasons: Record<string, number> = {};
  deliveries.forEach(d => {
    if (d.delay_reason) {
      delayReasons[d.delay_reason] = (delayReasons[d.delay_reason] || 0) + 1;
    }
  });

  const delayed = deliveries.filter(d => d.delay_reason !== null).length;

  return {
    total: deliveries.length,
    avgDays: Math.round(avgDays * 10) / 10,
    delayed,
    onTime: deliveries.length - delayed,
    delayPct: deliveries.length > 0 ? (delayed / deliveries.length) * 100 : 0,
    delayReasons: Object.entries(delayReasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ============================================================
// LOST REASON ANALYTICS
// ============================================================

export function computeLostReasons(leads: Lead[], startMonth: string, endMonth: string) {
  const lostLeads = leads.filter(l => {
    const m = l.created_at.substring(0, 7);
    return l.status === 'lost' && l.lost_reason && m >= startMonth && m <= endMonth;
  });

  const reasonMap: Record<string, number> = {};
  lostLeads.forEach(l => {
    const reason = l.lost_reason!;
    reasonMap[reason] = (reasonMap[reason] || 0) + 1;
  });

  return Object.entries(reasonMap)
    .map(([reason, count]) => ({ reason, count, pct: lostLeads.length > 0 ? (count / lostLeads.length) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================
// SMART INSIGHTS ENGINE
// ============================================================

export function generateInsights(startMonth: string, endMonth: string): Insight[] {
  const insights: Insight[] = [];
  const branchMetrics = computeAllBranchMetrics(startMonth, endMonth);
  const allLeads = data.leads;

  // 1. Target gap alerts
  branchMetrics.forEach(bm => {
    if (bm.targetAchievement.unitsPct < 60) {
      insights.push({
        id: `target-gap-${bm.branch.id}`,
        type: 'danger',
        icon: '🔴',
        title: `${bm.branch.name} behind target`,
        description: `Only ${formatPct(bm.targetAchievement.unitsPct, 0)} of unit target achieved (${bm.targetAchievement.units}/${bm.targetAchievement.targetUnits} units).`,
        metric: formatPct(bm.targetAchievement.unitsPct, 0),
      });
    }
  });

  // 2. Cold leads detection
  const activeLeads = allLeads.filter(l => !['delivered', 'lost'].includes(l.status));
  const coldLeads = activeLeads.filter(l => daysSinceLastActivity(l.last_activity_at) >= 7);
  if (coldLeads.length > 0) {
    const branchCounts: Record<string, number> = {};
    coldLeads.forEach(l => {
      const branch = branchMap.get(l.branch_id);
      const name = branch ? branch.name : l.branch_id;
      branchCounts[name] = (branchCounts[name] || 0) + 1;
    });
    const worst = Object.entries(branchCounts).sort((a, b) => b[1] - a[1])[0];
    insights.push({
      id: 'cold-leads',
      type: 'warning',
      icon: '⚠️',
      title: `${coldLeads.length} leads going cold`,
      description: `${coldLeads.length} active leads haven't been contacted in 7+ days. ${worst[0]} has the most (${worst[1]}).`,
      metric: coldLeads.length.toString(),
    });
  }

  // 3. Best lead source
  const sourceData = computeLeadSourceData(allLeads, startMonth, endMonth);
  const bestSource = sourceData.reduce((best, s) => s.conversionRate > best.conversionRate ? s : best, sourceData[0]);
  const worstSource = sourceData.reduce((worst, s) => s.conversionRate < worst.conversionRate && s.total > 10 ? s : worst, sourceData[0]);
  if (bestSource && worstSource && bestSource.source !== worstSource.source) {
    const ratio = worstSource.conversionRate > 0
      ? (bestSource.conversionRate / worstSource.conversionRate).toFixed(1)
      : '∞';
    insights.push({
      id: 'source-roi',
      type: 'success',
      icon: '📈',
      title: `${bestSource.label} leads convert best`,
      description: `${bestSource.label} has ${formatPct(bestSource.conversionRate, 0)} conversion rate — ${ratio}× better than ${worstSource.label} (${formatPct(worstSource.conversionRate, 0)}).`,
      metric: formatPct(bestSource.conversionRate, 0),
    });
  }

  // 4. Delivery bottleneck
  const deliveryStats = computeDeliveryAnalytics(null);
  if (deliveryStats.delayReasons.length > 0) {
    const topReason = deliveryStats.delayReasons[0];
    insights.push({
      id: 'delivery-delay',
      type: 'warning',
      icon: '🚚',
      title: `Delivery delays: ${topReason.reason}`,
      description: `${formatPct(deliveryStats.delayPct, 0)} of deliveries are delayed. Top cause: "${topReason.reason}" (${topReason.count} cases). Avg delivery: ${deliveryStats.avgDays} days.`,
      metric: `${deliveryStats.avgDays}d avg`,
    });
  }

  // 5. Top performer
  const repMetrics = computeAllRepMetrics(null, startMonth, endMonth);
  const topRep = repMetrics
    .filter(r => r.totalLeads >= 5)
    .sort((a, b) => b.conversionRate - a.conversionRate)[0];
  if (topRep) {
    insights.push({
      id: 'top-performer',
      type: 'success',
      icon: '🏆',
      title: `Star performer: ${topRep.rep.name}`,
      description: `${formatPct(topRep.conversionRate, 0)} conversion rate with ${topRep.deliveredCount} deliveries worth ${formatCurrency(topRep.totalRevenue)}. ${topRep.branchName}.`,
      metric: formatPct(topRep.conversionRate, 0),
    });
  }

  return insights.slice(0, 5);
}

// ============================================================
// FORECASTING
// ============================================================

export function computeForecast(branchId: string | null, startMonth: string, endMonth: string) {
  const allLeads = data.leads;
  const monthLeads = allLeads.filter(l => {
    const m = l.created_at.substring(0, 7);
    const branchMatch = branchId ? l.branch_id === branchId : true;
    return branchMatch && m >= startMonth && m <= endMonth;
  });

  // Historical conversion rates by stage
  const stageConversionRates: Record<string, number> = {};
  const stages: LeadStatus[] = ['contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered'];

  stages.forEach((stage, i) => {
    const prevStage = i === 0 ? 'new' : stages[i - 1];
    const reachedPrev = monthLeads.filter(l =>
      l.status_history.some(h => h.status === prevStage)
    ).length;
    const reachedCurrent = monthLeads.filter(l =>
      l.status_history.some(h => h.status === stage)
    ).length;
    stageConversionRates[stage] = reachedPrev > 0 ? reachedCurrent / reachedPrev : 0;
  });

  // Active pipeline forecast
  const activeLeads = monthLeads.filter(l => !['delivered', 'lost'].includes(l.status));
  let forecastedRevenue = 0;
  let forecastedUnits = 0;

  activeLeads.forEach(lead => {
    const currentStage = lead.status;
    const stageIndex = stages.indexOf(currentStage as LeadStatus);
    let probability = 1;

    // Multiply conversion rates from current stage to delivered
    for (let i = Math.max(0, stageIndex + 1); i < stages.length; i++) {
      probability *= stageConversionRates[stages[i]] || 0;
    }

    forecastedRevenue += lead.deal_value * probability;
    forecastedUnits += probability;
  });

  return {
    activeLeads: activeLeads.length,
    forecastedRevenue: Math.round(forecastedRevenue),
    forecastedUnits: Math.round(forecastedUnits * 10) / 10,
    stageConversionRates,
    byStage: stages.map(stage => ({
      stage,
      rate: stageConversionRates[stage],
      leads: activeLeads.filter(l => l.status === stage).length,
    })),
  };
}

// ============================================================
// WHAT-IF SCENARIO
// ============================================================

export function computeWhatIf(
  stageToImprove: string,
  improvementPct: number,
  branchId: string | null,
  startMonth: string,
  endMonth: string
) {
  const forecast = computeForecast(branchId, startMonth, endMonth);
  const currentRate = forecast.stageConversionRates[stageToImprove] || 0;
  const improvedRate = Math.min(1, currentRate * (1 + improvementPct / 100));

  // Recalculate with improved rate
  const allLeads = data.leads;
  const monthLeads = allLeads.filter(l => {
    const m = l.created_at.substring(0, 7);
    const branchMatch = branchId ? l.branch_id === branchId : true;
    return branchMatch && m >= startMonth && m <= endMonth;
  });

  const activeLeads = monthLeads.filter(l => !['delivered', 'lost'].includes(l.status));
  const stages: LeadStatus[] = ['contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered'];

  let newForecastedRevenue = 0;
  activeLeads.forEach(lead => {
    const stageIndex = stages.indexOf(lead.status as LeadStatus);
    let probability = 1;
    for (let i = Math.max(0, stageIndex + 1); i < stages.length; i++) {
      const rate = stages[i] === stageToImprove
        ? improvedRate
        : (forecast.stageConversionRates[stages[i]] || 0);
      probability *= rate;
    }
    newForecastedRevenue += lead.deal_value * probability;
  });

  return {
    currentRate,
    improvedRate,
    currentForecast: forecast.forecastedRevenue,
    improvedForecast: Math.round(newForecastedRevenue),
    revenueImpact: Math.round(newForecastedRevenue - forecast.forecastedRevenue),
  };
}
