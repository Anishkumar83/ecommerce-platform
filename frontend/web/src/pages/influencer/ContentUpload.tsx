import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, CheckCircle } from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import { campaignService } from '../../core/services/campaign.service';
import type { Content } from '../../core/models';

const PLATFORMS = ['Instagram', 'YouTube', 'Twitter', 'LinkedIn', 'Snapchat', 'TikTok'];
const CONTENT_TYPES = ['POST', 'REEL', 'STORY', 'VIDEO', 'LIVE', 'BLOG'];

export default function ContentUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultCampaign = searchParams.get('campaign') ?? '';

  const [form, setForm] = useState({
    campaignId: defaultCampaign,
    title: '',
    description: '',
    platform: 'Instagram',
    contentType: 'POST',
    contentUrl: '',
    caption: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await campaignService.submitContent({
      campaignId: form.campaignId || 'CAM260822A01',
      influencerId: 'INF260822A01',
      title: form.title,
      description: form.description,
      socialPlatform: form.platform,
      contentType: form.contentType as Content['contentType'],
      mediaUrl: form.contentUrl || 'https://instagram.com/p/demo',
      caption: form.caption,
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=225&fit=crop&auto=format',
    });
    setLoading(false);
    setSubmitted(true);
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20";

  if (submitted) return (
    <PortalShell type="influencer">
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-xl font-extrabold font-display text-gray-900 mb-2">Content Submitted!</h2>
        <p className="text-sm text-gray-500 mb-6">Your content is being processed and will be reviewed by the campaign partner. This usually takes 2-4 hours.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/influencer/content')} className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700">
            View All Content
          </button>
          <button onClick={() => { setSubmitted(false); setForm({ campaignId: '', title: '', description: '', platform: 'Instagram', contentType: 'POST', contentUrl: '', caption: '' }); }}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50">
            Upload Another
          </button>
        </div>
      </div>
    </PortalShell>
  );

  return (
    <PortalShell type="influencer">
      <PageHeader
        title="Upload Content"
        subtitle="Submit content for a campaign"
        breadcrumbs={[{ label: 'Content', href: '/influencer/content' }, { label: 'Upload' }]}
      />

      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Campaign ID</label>
            <input value={form.campaignId} onChange={e => set('campaignId', e.target.value)} placeholder="CAM260822A01 (leave empty for default)" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content Title *</label>
            <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="My honest review of..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Platform</label>
              <select value={form.platform} onChange={e => set('platform', e.target.value)} className={inputCls}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content Type</label>
              <select value={form.contentType} onChange={e => set('contentType', e.target.value)} className={inputCls}>
                {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Content URL *</label>
            <input required value={form.contentUrl} onChange={e => set('contentUrl', e.target.value)} placeholder="https://instagram.com/p/..." className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Brief description of the content..." className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Caption / Script</label>
            <textarea value={form.caption} onChange={e => set('caption', e.target.value)} rows={4}
              placeholder="The caption or script used in your content..." className={inputCls} />
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Upload size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">Attach media files (screenshots, thumbnails)</p>
            <p className="text-xs text-gray-400">JPG, PNG, MP4 up to 50MB</p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
            Content will go through: Processing → Security Scan → Moderation → Partner Review before going live.
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Content'}
          </button>
        </form>
      </div>
    </PortalShell>
  );
}
