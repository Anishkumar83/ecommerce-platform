import type { User, Role, PaginatedResponse } from '../models';
import { MOCK_USERS, MOCK_ROLES } from '../mock/data';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
let users = [...MOCK_USERS];
let roles = [...MOCK_ROLES];

export const userService = {
  async getUsers(page = 1, pageSize = 20, search?: string): Promise<PaginatedResponse<User>> {
    await delay(400);
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    const total = result.length;
    const data = result.slice((page - 1) * pageSize, page * pageSize);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getRoles(): Promise<Role[]> {
    await delay(200);
    return [...roles];
  },

  async getRole(referenceId: string): Promise<Role> {
    await delay(200);
    const r = roles.find(r => r.referenceId === referenceId);
    if (!r) throw { code: 404, message: 'Role not found' };
    return r;
  },
};
