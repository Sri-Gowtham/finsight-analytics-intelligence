// ADD THESE TO THE BOTTOM OF frontend_new/src/lib/queries.ts

// ---------------------------------------------------------------- reports

export interface Report {
  report_id: number;
  client_name: string;
  analyst_id: number;
  analyst_name: string;
  analyst_email: string;
  analyst_notes: string;
  insight_ids: string;
  status: "pending" | "approved" | "rejected";
  cfo_comment: string | null;
  reviewed_by: number | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface ReportInsight {
  insight_id: number;
  company_id: number;
  generated_text: string;
  insight_type: string | null;
  created_at: string;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

async function fetchReports(status?: string): Promise<Report[]> {
  const url = status ? `/api/reports?status=${status}` : "/api/reports";
  const res = await api.http<{ success: boolean; reports: Report[] }>(url);
  return res.reports;
}

async function fetchReport(id: string): Promise<{ report: Report; insights: ReportInsight[] }> {
  return api.http(`/api/reports/${id}`);
}

async function submitReport(data: {
  client_name: string;
  analyst_notes: string;
  insight_ids: number[];
}): Promise<{ success: boolean; report: Report }> {
  return api.http("/api/reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function reviewReport(data: {
  id: number;
  status: "approved" | "rejected";
  cfo_comment?: string;
}): Promise<{ success: boolean; report: Report }> {
  return api.http(`/api/reports/${data.id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status: data.status, cfo_comment: data.cfo_comment }),
  });
}

async function fetchNotifications(): Promise<{
  notifications: Notification[];
  unread_count: number;
}> {
  return api.http("/api/reports/notifications/mine");
}

async function markNotificationRead(id: number): Promise<void> {
  await api.http(`/api/reports/notifications/${id}/read`, { method: "PATCH" });
}

export const useReports = (status?: string) =>
  useQuery({
    queryKey: ["reports", status ?? "all"],
    queryFn: () => fetchReports(status),
    staleTime: 30_000,
  });

export const useReport = (id: string) =>
  useQuery({
    queryKey: ["report", id],
    queryFn: () => fetchReport(id),
    enabled: Boolean(id),
  });

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000, // poll every 60s
  });

export function useSubmitReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useReviewReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
