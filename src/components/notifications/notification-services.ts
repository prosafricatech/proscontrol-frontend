import axios from '@/lib/services/config';

export type NotificationMeta = {
  label: string;
  value: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  data: {
    event_type: string;
    title: string;
    body: string;
    action_url: string | null;
    resource_type: string | null;
    resource_id: number | string | null;
    meta?: NotificationMeta[];
  };
  read_at: string | null;
  created_at: string;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
};

const notificationServices = {
  getList: async (params: NotificationListParams = {}) => {
    const { data } = await axios.get('/api/notifications', { params });
    return data;
  },
  getUnreadCount: async (): Promise<number> => {
    const { data } = await axios.get('/api/notifications/unread-count');
    return data?.count ?? 0;
  },
  markRead: async (id: string) => {
    const { data } = await axios.post(`/api/notifications/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await axios.post('/api/notifications/mark-all-read');
    return data;
  },
  deleteOne: async (id: string) => {
    const { data } = await axios.delete(`/api/notifications/${id}`);
    return data;
  },
  deleteAll: async () => {
    const { data } = await axios.delete('/api/notifications');
    return data;
  },
};

export default notificationServices;
