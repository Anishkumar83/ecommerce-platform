import { useState, useEffect } from 'react';
import { Link2, Copy, Plus } from 'lucide-react';
import AdminShell from '../../components/shared/AdminShell';
import PageHeader from '../../components/shared/PageHeader';
import { shortLinkService } from '../../core/services/shortlink.service';
import type { ShortLink } from '../../core/models';

export default function AdminShortLinks() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ targetUrl: '', campaignId: '', influencerId: '' });
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // getShortLinks returns a PaginatedResponse, not a bare array.
  const load = () => { shortLinkService.getShortLinks().then(r => { setLinks(r.data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    await shortLinkService.createShortLink(
      form.campaignId ? 'CAMPAIGN' : 'PRODUCT',
      form.campaignId || form.influencerId,
      form.targetUrl,
      'admin@example.com'
    );
    setCreating(false);
    setForm({ targetUrl: '', campaignId: '', influencerId: '' });
    load();
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(`https://nxs.in/${code}`).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AdminShell>
      <PageHeader title="Short Links" subtitle="Attribution tracking links for campaigns" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Create Short Link</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target URL *</label>
              <input required value={form.targetUrl} onChange={e => setForm(p => ({ ...p, targetUrl: e.target.value }))}
                placeholder="https://nexus.com/products/..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campaign ID (optional)</label>
              <input value={form.campaignId} onChange={e => setForm(p => ({ ...p, campaignId: e.target.value }))}
                placeholder="CAM260822A01" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Influencer ID (optional)</label>
              <input value={form.influencerId} onChange={e => setForm(p => ({ ...p, influencerId: e.target.value }))}
                placeholder="INF260822A01" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <button type="submit" disabled={creating} className="w-full py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <Plus size={14} /> Create Link
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {links.map(l => (
                <div key={l.referenceId} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <Link2 size={15} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold font-mono text-brand-600">nxs.in/{l.shortCode}</p>
                      <button onClick={() => copy(l.shortCode)} className="text-gray-400 hover:text-gray-600">
                        <Copy size={13} />
                      </button>
                      {copied === l.shortCode && <span className="text-xs text-green-600 font-semibold">Copied!</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{l.longUrl}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{l.clicks} clicks · {l.referenceId}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
