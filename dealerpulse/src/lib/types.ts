// ============================================================
// Data Model Types — mirrors dealership_data.json schema
// ============================================================

export type LeadStatus = 'new' | 'contacted' | 'test_drive' | 'negotiation' | 'order_placed' | 'delivered' | 'lost';

export const LEAD_STAGES: LeadStatus[] = ['new', 'contacted', 'test_drive', 'negotiation', 'order_placed', 'delivered'];

export const STAGE_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  test_drive: 'Test Drive',
  negotiation: 'Negotiation',
  order_placed: 'Order Placed',
  delivered: 'Delivered',
  lost: 'Lost',
};

export interface Branch {
  id: string;
  name: string;
  city: string;
}

export interface SalesRep {
  id: string;
  name: string;
  branch_id: string;
  role: 'branch_manager' | 'sales_officer';
  joined: string;
}

export interface StatusHistoryEntry {
  status: LeadStatus;
  timestamp: string;
  note: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  source: string;
  model_interested: string;
  status: LeadStatus;
  assigned_to: string;
  branch_id: string;
  created_at: string;
  last_activity_at: string;
  status_history: StatusHistoryEntry[];
  expected_close_date: string;
  deal_value: number;
  lost_reason: string | null;
}

export interface Target {
  branch_id: string;
  month: string; // "2025-06"
  target_units: number;
  target_revenue: number;
}

export interface Delivery {
  lead_id: string;
  order_date: string;
  delivery_date: string;
  days_to_deliver: number;
  delay_reason: string | null;
}

export interface DealershipData {
  metadata: {
    generated_at: string;
    description: string;
    date_range: string;
    notes: string;
  };
  branches: Branch[];
  sales_reps: SalesRep[];
  leads: Lead[];
  targets: Target[];
  deliveries: Delivery[];
}

// ============================================================
// Computed / Analytics Types
// ============================================================

export interface BranchMetrics {
  branch: Branch;
  totalLeads: number;
  deliveredCount: number;
  lostCount: number;
  activeLeads: number;
  conversionRate: number;
  totalRevenue: number;
  pipelineValue: number;
  avgDealValue: number;
  avgDaysToDeliver: number;
  targetAchievement: { units: number; revenue: number; targetUnits: number; targetRevenue: number; unitsPct: number; revenuePct: number };
}

export interface RepMetrics {
  rep: SalesRep;
  branchName: string;
  totalLeads: number;
  deliveredCount: number;
  lostCount: number;
  activeLeads: number;
  conversionRate: number;
  totalRevenue: number;
  pipelineValue: number;
  avgDealValue: number;
  coldLeads: number; // leads with no activity in 7+ days
}

export interface Insight {
  id: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
  dropOff: number;
  dropOffPct: number;
}

export interface MonthlyData {
  month: string;
  label: string;
  delivered: number;
  revenue: number;
  targetUnits: number;
  targetRevenue: number;
  newLeads: number;
  lostLeads: number;
}
