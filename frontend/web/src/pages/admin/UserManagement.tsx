import { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import StatusBadge from '../../components/shared/StatusBadge';
import { userService } from '../../core/services/user.service';
import type { User, Role } from '../../core/models';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-brand-50 text-brand-700',
  MAKER: 'bg-amber-50 text-amber-700',
  CHECKER: 'bg-rose-50 text-rose-700',
  PARTNER: 'bg-emerald-50 text-emerald-700',
  INFLUENCER: 'bg-purple-50 text-purple-700',
  CUSTOMER: 'bg-blue-50 text-blue-700',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'roles'>('users');

  useEffect(() => {
    Promise.all([userService.getUsers(), userService.getRoles()]).then(([u, r]) => {
      setUsers(u.data);
      setRoles(r);
      setLoading(false);
    });
  }, []);

  return (
    <AdminShell>
      <PageHeader title="Users & Roles" subtitle="Platform user management and role configuration" />

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('users')} className={`px-4 py-2 text-sm font-bold rounded-xl ${tab === 'users' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Users ({users.length})
        </button>
        <button onClick={() => setTab('roles')} className={`px-4 py-2 text-sm font-bold rounded-xl ${tab === 'roles' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
          Roles ({roles.length})
        </button>
      </div>

      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Ref ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.referenceId} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-gray-500">{u.referenceId}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{new Date(u.createdOn).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-3"><StatusBadge status={u.statusCode} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(r => (
            <div key={r.referenceId} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Shield size={16} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.name}</p>
                  <p className="font-mono text-xs text-gray-400">{r.referenceId}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{r.description}</p>
              <div className="flex flex-wrap gap-1">
                {r.permissions.slice(0, 6).map(p => (
                  <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.replace(/_/g, ' ')}</span>
                ))}
                {r.permissions.length > 6 && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">+{r.permissions.length - 6} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
