import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Check, ImagePlus, UploadCloud, Star, Info, ArrowLeft, ArrowRight,
  Send, PartyPopper, FileVideo, Camera, Shirt, ThumbsUp, PenSquare,
} from 'lucide-react';
import PortalShell from '../../components/shared/PortalShell';
import PageHeader from '../../components/shared/PageHeader';
import WorkflowTimeline from '../../components/shared/WorkflowTimeline';
import ModerationTrail from '../../components/shared/ModerationTrail';
import { useToast } from '../../components/shared/Toast';
import { inr } from '../../components/shared/StatTile';
import { useAuth } from '../../core/auth/AuthContext';
import { creatorService } from '../../core/services/creator.service';
import { productService } from '../../core/services/product.service';
import type { Creator, CreatorContent, CreatorContentKind, CampaignParticipation, Product } from '../../core/models';

const STEP_LABELS = ['Product', 'Content', 'Review', 'Disclosure', 'Submit'];

const KIND_OPTIONS: { id: CreatorContentKind; label: string; hint: string; icon: typeof Camera }[] = [
  { id: 'PHOTO', label: 'Photo', hint: 'A single styled photo of the product', icon: Camera },
  { id: 'VIDEO', label: 'Video', hint: 'A short video, demo or unboxing', icon: FileVideo },
  { id: 'REVIEW', label: 'Review', hint: 'A written review with a rating', icon: PenSquare },
  { id: 'STYLING', label: 'Styling', hint: 'How you use or style the product', icon: Shirt },
  { id: 'RECOMMENDATION', label: 'Recommendation', hint: 'A quick recommendation to your followers', icon: ThumbsUp },
];

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=800&fit=crop',
];

export default function ContentUpload() {
  const { currentUser } = useAuth();
  const creatorId = currentUser?.creatorId ?? 'CRT260822A01';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);

  const [step, setStep] = useState(0);

  // Step 0 — product
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Step 1 — kind & media
  const [kind, setKind] = useState<CreatorContentKind>('REVIEW');
  const [aspect, setAspect] = useState<'PORTRAIT' | 'SQUARE' | 'LANDSCAPE'>('SQUARE');
  const [mediaUrl, setMediaUrl] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Step 2 — text & rating
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(5);

  // Step 3 — disclosure
  const [providedForReview, setProvidedForReview] = useState(false);
  const [participationId, setParticipationId] = useState('');

  // Step 4 — submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<CreatorContent | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    creatorService.getCreator(creatorId).then(setCreator).catch(() => {});
    creatorService.getParticipations({ participantId: creatorId, role: 'CREATOR' }).then(setParticipations).catch(() => {});
  }, [creatorId]);

  useEffect(() => {
    setProductsLoading(true);
    productService.getPublishedProducts({ search: productSearch || undefined, pageSize: 24 })
      .then(r => setProducts(r.data))
      .finally(() => setProductsLoading(false));
  }, [productSearch]);

  useEffect(() => {
    const preselect = searchParams.get('product');
    if (preselect) {
      productService.getProduct(preselect).then(setSelectedProduct).catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const needsRating = kind === 'REVIEW' || kind === 'RECOMMENDATION';

  const canAdvance = useCallback((s: number) => {
    if (s === 0) return !!selectedProduct;
    if (s === 1) return !!mediaUrl;
    if (s === 2) return title.trim().length > 0 && body.trim().length > 0;
    return true;
  }, [selectedProduct, mediaUrl, title, body]);

  const useSample = () => {
    const url = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    setMediaUrl(url);
    setUrlDraft('');
  };

  const useUrl = () => {
    if (!urlDraft.trim()) return;
    setMediaUrl(urlDraft.trim());
  };

  const onFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
  };

  const submit = async () => {
    if (!selectedProduct || !creator) return;
    setSubmitting(true);
    try {
      const participation = participations.find(p => p.referenceId === participationId);
      const item = await creatorService.submitContent({
        creatorId: creator.referenceId,
        creatorName: creator.name,
        creatorHandle: creator.handle,
        creatorAvatarUrl: creator.avatarUrl,
        creatorVerified: creator.isVerified,
        productId: selectedProduct.referenceId,
        productName: selectedProduct.name,
        productImageUrl: selectedProduct.media.find(m => m.isPrimary)?.url ?? selectedProduct.media[0]?.url ?? '',
        productPrice: selectedProduct.price,
        partnerId: selectedProduct.partnerId,
        partnerName: selectedProduct.partnerName,
        campaignId: participation?.campaignId,
        campaignName: participation?.campaignName,
        kind,
        title: title.trim(),
        body: body.trim(),
        rating: needsRating ? rating : undefined,
        mediaUrl,
        thumbnailUrl: mediaUrl,
        videoPreviewUrl: kind === 'VIDEO' ? mediaUrl : undefined,
        aspect,
        providedForReview,
      });
      setSubmitted(item);
      toast('Content submitted for review');

      pollRef.current = setInterval(async () => {
        try {
          const latest = await creatorService.getContent(item.referenceId);
          setSubmitted(latest);
          if (['UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUSPENDED'].includes(latest.state) && pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } catch {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
      }, 1000);
    } catch {
      toast('Could not submit content — please try again', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(null);
    setSelectedProduct(null);
    setMediaUrl('');
    setUrlDraft('');
    setTitle('');
    setBody('');
    setRating(5);
    setProvidedForReview(false);
    setParticipationId('');
    setKind('REVIEW');
    setStep(0);
  };

  const timelineSteps = STEP_LABELS.map((label, i) => ({
    label,
    completed: i < step || !!submitted,
    current: i === step && !submitted,
  }));

  return (
    <PortalShell type="creator">
      <PageHeader
        title="Upload content"
        subtitle="Publish a photo, video or review on ழ"
        breadcrumbs={[{ label: 'My Content', href: '/creator/content' }, { label: 'Upload' }]}
      />

      {submitted ? (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={24} />
          </div>
          <h2 className="text-lg font-bold font-display text-gray-900 mb-1">Content submitted</h2>
          <p className="text-sm text-gray-500 mb-6">
            We're running it through the moderation pipeline. This updates automatically — no need to refresh.
          </p>

          <div className="text-left mb-6">
            <ModerationTrail state={submitted.state} events={submitted.moderationEvents} rejectionReason={submitted.rejectionReason} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <button onClick={resetForm} className="px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50">
              Upload another
            </button>
            <Link to="/creator/content" className="px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700">
              View my content
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
            <WorkflowTimeline steps={timelineSteps} orientation="horizontal" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[320px]">
            {step === 0 && (
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Which product is this for?</h2>
                <p className="text-xs text-gray-500 mb-4">Pick the product you received or bought and are creating content about.</p>
                <div className="relative mb-4">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                </div>
                {productsLoading ? (
                  <p className="text-sm text-gray-400 py-8 text-center">Loading products…</p>
                ) : products.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">No products match your search.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                    {products.map(p => {
                      const img = p.media.find(m => m.isPrimary)?.url ?? p.media[0]?.url;
                      const on = selectedProduct?.referenceId === p.referenceId;
                      return (
                        <button
                          key={p.referenceId}
                          onClick={() => setSelectedProduct(p)}
                          className={`text-left rounded-xl border-2 overflow-hidden transition-colors ${on ? 'border-brand-500' : 'border-transparent hover:border-gray-200'}`}
                        >
                          <div className="relative aspect-square bg-gray-100">
                            {img && <img src={img} alt={p.name} className="w-full h-full object-cover" />}
                            {on && (
                              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                                <Check size={11} />
                              </span>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-1">{p.name}</p>
                            <p className="text-xs text-gray-500 tabular-nums">{inr(p.price)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Content type & media</h2>
                <p className="text-xs text-gray-500 mb-4">Choose the format, then add the media — drop a file, or paste a URL for this demo.</p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
                  {KIND_OPTIONS.map(k => (
                    <button
                      key={k.id}
                      onClick={() => setKind(k.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors ${
                        kind === k.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <k.icon size={16} />
                      <span className="text-xs font-semibold">{k.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mb-5">{KIND_OPTIONS.find(k => k.id === kind)?.hint}</p>

                <div className="flex items-center gap-2 mb-4">
                  {(['SQUARE', 'PORTRAIT', 'LANDSCAPE'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setAspect(a)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${aspect === a ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 text-gray-600'}`}
                    >
                      {a[0] + a.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) onFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                    dragOver ? 'border-brand-400 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {mediaUrl ? (
                    <img src={mediaUrl} alt="Selected media" className="max-h-48 rounded-lg object-contain" />
                  ) : (
                    <>
                      <UploadCloud size={22} className="text-gray-400" />
                      <p className="text-sm font-semibold text-gray-600">Drop a file here, or click to choose one</p>
                      <p className="text-xs text-gray-400">This is a mock — nothing is actually uploaded</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    value={urlDraft}
                    onChange={e => setUrlDraft(e.target.value)}
                    placeholder="…or paste an image URL"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                  />
                  <button onClick={useUrl} className="px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50">Use URL</button>
                  <button onClick={useSample} className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg hover:bg-gray-50">
                    <ImagePlus size={13} /> Sample
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Review text & rating</h2>
                <p className="text-xs text-gray-500 mb-4">Write what you'd actually tell a friend — specifics beat superlatives.</p>

                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="A short, specific headline"
                  className="w-full mb-4 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                />

                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Body</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  placeholder="Share the details — what worked, what didn't."
                  className="w-full mb-4 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 resize-none"
                />

                {needsRating && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rating</label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
                          <Star size={22} className={i < rating ? 'text-amber-400' : 'text-gray-200'} fill="currentColor" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Disclosure</h2>
                <p className="text-xs text-gray-500 mb-4">Be upfront when a product was given to you — shoppers see this on the card.</p>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={providedForReview}
                    onChange={e => setProvidedForReview(e.target.checked)}
                    className="mt-0.5 accent-brand-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-800">Product provided for review</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Check this if the partner sent you this product rather than you buying it yourself.</span>
                  </span>
                </label>

                {participations.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link to a campaign (optional)</label>
                    <select
                      value={participationId}
                      onChange={e => setParticipationId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
                    >
                      <option value="">No campaign — independent content</option>
                      {participations.map(p => (
                        <option key={p.referenceId} value={p.referenceId}>{p.campaignName} · {p.partnerName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="flex items-start gap-2 text-xs text-gray-400 mt-4">
                  <Info size={13} className="shrink-0 mt-0.5" />
                  Honest disclosure keeps trust with shoppers and is required for any product a partner provided.
                </p>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-sm font-bold text-gray-800 mb-1">Review & submit</h2>
                <p className="text-xs text-gray-500 mb-4">Once submitted, this goes through an automated scan and human review before it's published.</p>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl mb-4">
                  {mediaUrl && <img src={mediaUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{title}</p>
                    <p className="text-xs text-gray-500 mb-1">{selectedProduct?.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{body}</p>
                  </div>
                </div>

                <dl className="space-y-1.5 text-xs mb-6">
                  <div className="flex justify-between"><dt className="text-gray-500">Type</dt><dd className="text-gray-800 font-semibold">{KIND_OPTIONS.find(k => k.id === kind)?.label}</dd></div>
                  {needsRating && <div className="flex justify-between"><dt className="text-gray-500">Rating</dt><dd className="text-gray-800 font-semibold">{rating} / 5</dd></div>}
                  <div className="flex justify-between"><dt className="text-gray-500">Provided for review</dt><dd className="text-gray-800 font-semibold">{providedForReview ? 'Yes' : 'No'}</dd></div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Campaign</dt>
                    <dd className="text-gray-800 font-semibold">{participations.find(p => p.referenceId === participationId)?.campaignName ?? 'None'}</dd>
                  </div>
                </dl>

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-60"
                >
                  <Send size={15} /> {submitting ? 'Submitting…' : 'Submit content'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => (step === 0 ? navigate('/creator/content') : setStep(s => s - 1))}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50"
            >
              <ArrowLeft size={14} /> {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                disabled={!canAdvance(step)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
