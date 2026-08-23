import type { Notification } from '../models';
import { MOCK_NOTIFICATIONS } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let notifications = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    await delay(200);
    return notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime());
  },

  async markAsRead(referenceId: string): Promise<void> {
    const n = notifications.find(n => n.referenceId === referenceId);
    if (n) n.isRead = true;
  },

  async markAllAsRead(userId: string): Promise<void> {
    notifications.filter(n => n.userId === userId).forEach(n => n.isRead = true);
  },

  getUnreadCount(userId: string): number {
    return notifications.filter(n => n.userId === userId && !n.isRead).length;
  },

  async addNotification(notification: Omit<Notification, 'referenceId' | 'versionNo' | 'statusCode' | 'activeCode' | 'rowVersion' | 'createdOn' | 'createdBy' | 'lastUpdatedOn' | 'lastUpdatedBy'>): Promise<void> {
    notifications.unshift({
      ...notification,
      referenceId: `NTF${Date.now()}`,
      isRead: false,
      versionNo: 1, statusCode: 'ACTIVE', activeCode: 'Y', rowVersion: 1,
      createdOn: new Date().toISOString(), createdBy: 'system',
      lastUpdatedOn: new Date().toISOString(), lastUpdatedBy: 'system',
    });
  },
};
