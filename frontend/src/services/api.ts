import {
  AnalyticsSummary,
  AuditLog,
  Department,
  EmailLog,
  Issue,
  NotificationItem,
  User,
  Verification,
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('civiclens_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('civiclens_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('civiclens_token');
  localStorage.removeItem('civiclens_user');
}

export function getStoredUser(): User | null {
  const data = localStorage.getItem('civiclens_user');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem('civiclens_user', JSON.stringify(user));
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.access_token);
    setStoredUser(res.user);
    return res;
  },

  register: async (data: { email: string; password: string; full_name: string; phone?: string; role: string; department?: string }) => {
    const res = await request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(res.access_token);
    setStoredUser(res.user);
    return res;
  },

  getMe: async () => {
    return request<User>('/auth/me');
  },

  logout: () => {
    clearAuthToken();
  },
};

// Issues API
export const issuesApi = {
  list: async (params?: { category?: string; status?: string; ward?: string; search?: string; reporter_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    if (params?.ward) q.set('ward', params.ward);
    if (params?.search) q.set('search', params.search);
    if (params?.reporter_id) q.set('reporter_id', params.reporter_id);
    return request<Issue[]>(`/issues?${q.toString()}`);
  },

  getById: async (id: string) => {
    return request<Issue>(`/issues/${id}`);
  },

  create: async (data: {
    title: string;
    description: string;
    category: string;
    location: { latitude: number; longitude: number; address: string; ward?: string };
    image_urls: string[];
  }) => {
    return request<Issue>('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  checkDuplicate: async (data: {
    title: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
  }) => {
    return request<{
      is_duplicate: boolean;
      confidence: number;
      matched_issue: Issue | null;
      potential_matches: Issue[];
      rationale: string;
    }>('/issues/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{
      image_url: string;
      filename: string;
      vision_assessment?: any;
    }>('/issues/upload-image', {
      method: 'POST',
      body: formData,
    });
  },

  verify: async (issueId: string, comment?: string) => {
    return request<{ success: boolean; verification_count: number; credibility_score: number; message: string }>(
      `/issues/${issueId}/verify`,
      {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }
    );
  },

  getVerifications: async (issueId: string) => {
    return request<Verification[]>(`/issues/${issueId}/verifications`);
  },
};

// Officer API
export const officerApi = {
  getIssues: async (params?: { status?: string; department?: string; priority?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.department) q.set('department', params.department);
    if (params?.priority) q.set('priority', params.priority);
    return request<Issue[]>(`/officer/issues?${q.toString()}`);
  },

  getEngineers: async () => {
    return request<Array<{ id: string; full_name: string; email: string; phone: string; department?: string }>>(
      '/officer/engineers'
    );
  },

  assignIssue: async (
    issueId: string,
    data: { department: string; field_engineer_id?: string; priority?: string; officer_notes?: string }
  ) => {
    return request<{ success: boolean; message: string }>(`/officer/issues/${issueId}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Field Engineer API
export const engineerApi = {
  getTasks: async () => {
    return request<Issue[]>('/engineer/tasks');
  },

  updateStatus: async (
    issueId: string,
    data: { status: 'In Progress' | 'Resolved'; completion_notes: string; evidence_image_url?: string }
  ) => {
    return request<{ success: boolean; status: string; message: string }>(`/engineer/tasks/${issueId}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Analytics & Admin API
export const analyticsApi = {
  getSummary: async () => {
    return request<AnalyticsSummary>('/analytics/summary');
  },

  getHeatmaps: async () => {
    return request<
      Array<{
        latitude: number;
        longitude: number;
        intensity: number;
        category: string;
        priority: string;
        title: string;
        issue_id: string;
        status: string;
      }>
    >('/analytics/heatmaps');
  },
};

export const adminApi = {
  getUsers: async () => {
    return request<User[]>('/admin/users');
  },

  updateUserRole: async (userId: string, data: { role?: string; department?: string }) => {
    return request<{ success: boolean; message: string }>(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getDepartments: async () => {
    return request<Department[]>('/admin/departments');
  },

  getAuditLogs: async (limit: number = 50) => {
    return request<AuditLog[]>(`/admin/audit-logs?limit=${limit}`);
  },
};

// Notification API
export const notificationApi = {
  list: async () => {
    return request<NotificationItem[]>('/notifications');
  },

  markRead: async (id: string) => {
    return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' });
  },

  markAllRead: async () => {
    return request<{ success: boolean }>('/notifications/read-all', { method: 'POST' });
  },

  getEmailLogs: async () => {
    return request<EmailLog[]>('/notifications/emails');
  },
};
