import { DealershipData } from './types';
import dealershipData from '../../public/dealership_data.json';

// Load data statically — no runtime fetch needed
export function getData(): DealershipData {
  return dealershipData as unknown as DealershipData;
}

// Lookup maps for quick access
const data = getData();

export const branchMap = new Map(data.branches.map(b => [b.id, b]));
export const repMap = new Map(data.sales_reps.map(r => [r.id, r]));
export const leadsByBranch = new Map<string, typeof data.leads>();
export const leadsByRep = new Map<string, typeof data.leads>();
export const deliveryMap = new Map(data.deliveries.map(d => [d.lead_id, d]));

// Build lookup maps
data.leads.forEach(lead => {
  // By branch
  if (!leadsByBranch.has(lead.branch_id)) leadsByBranch.set(lead.branch_id, []);
  leadsByBranch.get(lead.branch_id)!.push(lead);
  
  // By rep
  if (!leadsByRep.has(lead.assigned_to)) leadsByRep.set(lead.assigned_to, []);
  leadsByRep.get(lead.assigned_to)!.push(lead);
});

/**
 * Get all unique months from the dataset, sorted.
 */
export function getMonths(): string[] {
  const months = new Set(data.targets.map(t => t.month));
  return Array.from(months).sort();
}

/**
 * Filter leads by month range.
 */
export function filterLeadsByMonth(leads: typeof data.leads, startMonth: string, endMonth: string) {
  return leads.filter(lead => {
    const month = lead.created_at.substring(0, 7);
    return month >= startMonth && month <= endMonth;
  });
}

/**
 * Get targets for a branch in a specific month range.
 */
export function getTargets(branchId: string | null, startMonth: string, endMonth: string) {
  return data.targets.filter(t => {
    const matchBranch = branchId ? t.branch_id === branchId : true;
    return matchBranch && t.month >= startMonth && t.month <= endMonth;
  });
}
