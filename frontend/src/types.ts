export type Role = 'Citizen' | 'Municipal Officer' | 'Field Engineer' | 'Administrator';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: Role;
  department?: string | null;
  trust_score: number;
}

export type IssueStatus = 'Reported' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  ward?: string;
}

export interface StatusHistoryItem {
  status: IssueStatus;
  updated_by: string;
  timestamp: string;
  comment?: string;
}

export interface IssueResolution {
  resolved_at: string;
  completion_notes: string;
  evidence_image_url?: string;
  resolved_by: string;
}

export interface AIAnalysis {
  duplicate_checked: boolean;
  suspected_duplicate?: boolean;
  suspected_duplicate_of?: string | null;
  duplicate_confidence?: number;
  predicted_priority: IssuePriority;
  priority_score: number;
  recommended_department: string;
  ai_rationale: string;
}

export interface Issue {
  _id: string;
  issue_id: string;
  title: string;
  description: string;
  category: string;
  location: LocationData;
  image_urls: string[];
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigned_department?: string | null;
  assigned_engineer_id?: string | null;
  assigned_engineer_name?: string | null;
  verification_count: number;
  credibility_score: number;
  ai_analysis?: AIAnalysis;
  status_history: StatusHistoryItem[];
  resolution?: IssueResolution;
  created_at: string;
  updated_at: string;
}

export interface Verification {
  _id: string;
  issue_id: string;
  citizen_id: string;
  citizen_name: string;
  citizen_trust_score?: number;
  comment?: string;
  verified_at: string;
}

export interface NotificationItem {
  _id: string;
  recipient_id: string;
  recipient_email: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export interface EmailLog {
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  status: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  head_name: string;
  contact_email: string;
  categories: string[];
}

export interface AuditLog {
  _id?: string;
  timestamp: string;
  action: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  details?: Record<string, any>;
  ip_address?: string;
}

export interface AnalyticsSummary {
  total_issues: number;
  resolved_count: number;
  pending_count: number;
  in_progress_count: number;
  resolution_rate: number;
  avg_verifications_per_issue: number;
  status_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  ward_breakdown: Record<string, number>;
  total_citizens: number;
  total_officers: number;
  total_engineers: number;
}
