import { useState } from 'react';
import { Link2, Share2, QrCode, MousePointerClick, Users, Eye, ShoppingCart, Package, TrendingUp, IndianRupee, Download } from 'lucide-react';
import type { TrackingLink } from '../../core/models';
import CopyButton from './CopyButton';
import Modal from './Modal';
import QRCode from './QRCode';
import { useToast } from './Toast';
import { compact, inr } from './StatTile';

interface TrackingLinkPanelProps {
  link: TrackingLink;
  /** Hide the analytics grid when the panel sits inside a dense list. */
  showStats?: boolean;
  className?: string;
}

const CHANNEL_LABEL: Record<TrackingLink['channel'], string> = {
  SOCIAL: 'Social media',
  EMAIL: 'Email',
  SMS: 'SMS',
  QR: 'QR code',
  DIRECT: 'Direct',
  ZHA_CONTENT: 'ழ content',
};

/**
 * One campaign tracking URL: the short link, the three actions the brief calls
 * for (copy, share, QR), and the funnel it produced.
 */
export default function TrackingLinkPanel({ link, showStats = true, className = '' }: TrackingLinkPanelProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { toast } = useToast();
  const full = `https://${link.shortUrl}`;

  const share = async () => {
    // Native sheet where the browser offers one, our own dialog otherwise.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: link.campaignName,
          text: link.productName ? `Check out ${link.productName}` : link.campaignName,
          url: full,
        });
        return;
      } catch {
        // User dismissed the sheet, or the call was blocked — fall through.
      }
    }
    setShareOpen(true);
  };

  const downloadQR = () => {
    // The QR is inline SVG; serialise it and hand the user a file.
    const svg = document.querySelector(`#qr-${link.referenceId} svg`);
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zha-${link.shortCode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast('QR code downloaded');
  };

  const stats: { icon: typeof Eye; label: string; value: string }[] = [
    { icon: MousePointerClick, label: 'Clicks', value: compact(link.stats.clicks) },
    { icon: Users, label: 'Unique Visitors', value: compact(link.stats.uniqueVisitors) },
    { icon: Eye, label: 'Product Views', value: compact(link.stats.productViews) },
    { icon: ShoppingCart, label: 'Add to Cart', value: compact(link.stats.addToCart) },
    { icon: Package, label: 'Orders', value: compact(link.stats.orders) },
    { icon: TrendingUp, label: 'Conversion Rate', value: `${link.stats.conversionRate}%` },
    { icon: IndianRupee, label: 'Revenue', value: inr(link.stats.revenue) },
    { icon: IndianRupee, label: 'Commission', value: inr(link.stats.commission) },
  ];

  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{link.campaignName}</p>
            <p className="text-xs text-gray-500 truncate">
              {link.productName ?? 'All campaign products'} · {CHANNEL_LABEL[link.channel]}
            </p>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full ${
            link.linkStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {link.linkStatus === 'ACTIVE' ? 'Active' : link.linkStatus === 'EXPIRED' ? 'Expired' : 'Revoked'}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 mb-2.5">
          <Link2 size={14} className="text-brand-600 shrink-0" />
          <code className="text-xs font-mono text-gray-800 truncate grow">{link.shortUrl}</code>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <CopyButton value={full} label="Copy URL" toastMessage="Tracking URL copied" />
          <button
            onClick={share}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={() => setQrOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
          >
            <QrCode size={14} /> Generate QR
          </button>
        </div>
      </div>

      {showStats && (
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100">
          {stats.map(s => (
            <div key={s.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon size={12} className="text-gray-300" />
                <span className="text-[10px] text-gray-500 truncate">{s.label}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Campaign QR code" subtitle={link.shortUrl} size="sm">
        <div className="flex flex-col items-center gap-4" id={`qr-${link.referenceId}`}>
          <div className="p-4 bg-white rounded-xl border border-gray-200">
            <QRCode value={full} size={200} />
          </div>
          <p className="text-xs text-gray-500 text-center max-w-xs">
            Print this on packaging or a shelf card. Scans land on the tracked product page and attribute to {link.attributedToName}.
          </p>
          <button
            onClick={downloadQR}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
          >
            <Download size={14} /> Download SVG
          </button>
        </div>
      </Modal>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share this campaign URL" size="sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <code className="text-xs font-mono text-gray-800 truncate grow">{full}</code>
            <CopyButton value={full} variant="icon" toastMessage="Tracking URL copied" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(full)}` },
              { label: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(full)}` },
              { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(full)}` },
              { label: 'Email', href: `mailto:?subject=${encodeURIComponent(link.campaignName)}&body=${encodeURIComponent(full)}` },
            ].map(o => (
              <a
                key={o.label}
                href={o.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-center px-3 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700"
              >
                {o.label}
              </a>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
