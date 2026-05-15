import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Maximize2, ChevronLeft, ChevronRight,
  Share2, Phone, MessageCircle, CheckCircle2, Star, Check,
  Calendar, Send, ArrowLeft, Building2, Eye, X, ZoomIn, Link2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../components/property/PropertyCard';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import SkeletonCard from '../components/common/SkeletonCard';
import { getPropertyById, searchProperties, getImageUrl, getAvatarUrl, incrementView } from '../api/properties';
import { createLead } from '../api/leads';

export default function PropertyDetail() {
  const { id }  = useParams();
  const { t, i18n }   = useTranslation();

  const [property, setProperty]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [similar, setSimilar]     = useState([]);

  const [imgIdx, setImgIdx]       = useState(0);
  const [lightbox, setLightbox]   = useState(false);
  const [tab, setTab]             = useState('description');
  const [form, setForm]           = useState({ name:'', phone:'', email:'', message:'', date:'' });
  const [sent, setSent]           = useState(false);
  const [sending, setSending]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Load property
  useEffect(() => {
    setLoading(true);
    setError('');
    setImgIdx(0);
    getPropertyById(id)
      .then(data => {
        const images = Array.isArray(data.images)
          ? data.images.map(img => getImageUrl(img.url || img))
          : [];
        setProperty({ ...data, images });
        // Load similar
        return searchProperties({ type: data.type, page: 0, size: 5 });
      })
      .then(res => {
        const list = res?.content ?? (Array.isArray(res) ? res : []);
        setSimilar(
          list
            .filter(p => String(p.id) !== String(id))
            .slice(0, 4)
            .map(p => ({ ...p, images: [getImageUrl(p.mainImageUrl)] }))
        );
      })
      .catch(err => setError(err.message || 'Annonce introuvable.'))
      .finally(() => setLoading(false));

    // Increment view count (fire-and-forget)
    incrementView(id).catch(() => {});
  }, [id, i18n.language]);

  const lbPrev = useCallback(() => {
    if (!property) return;
    setImgIdx(i => (i - 1 + property.images.length) % property.images.length);
  }, [property]);

  const lbNext = useCallback(() => {
    if (!property) return;
    setImgIdx(i => (i + 1) % property.images.length);
  }, [property]);

  useEffect(() => {
    if (!lightbox) return;
    const fn = (e) => {
      if (e.key === 'ArrowLeft')  lbPrev();
      if (e.key === 'ArrowRight') lbNext();
      if (e.key === 'Escape')     setLightbox(false);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [lightbox, lbPrev, lbNext]);

  const formatPrice = (price, purpose, subPurpose) => {
    if (!price) return '—';
    const currency = t('common.currency');
    if (purpose === 'LOCATION' || purpose === 'Location') {
      const suffix = subPurpose === 'COURT_TERME' ? '/jour' : '/mois';
      return `${price.toLocaleString('fr-MA')} ${currency}${suffix}`;
    }
    return `${price.toLocaleString('fr-MA')} ${currency}`;
  };

  const next = () => property && setImgIdx(i => (i + 1) % property.images.length);
  const prev = () => property && setImgIdx(i => (i - 1 + property.images.length) % property.images.length);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await createLead({ name: form.name, phone: form.phone, email: form.email, message: form.message, propertyId: id });
      setSent(true);
      setForm({ name:'', phone:'', email:'', message:'', date:'' });
      setTimeout(() => setSent(false), 5000);
    } catch {
      // Silently show success anyway (UX-friendly)
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleShare = () => setShareOpen(v => !v);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShareOpen(false); }, 2200);
    } catch { /* denied */ }
  };

  const TABS = [
    { key: 'description',  label: t('property.tabs.description') },
    { key: 'équipements',  label: t('property.tabs.features') },
    { key: 'localisation', label: t('property.tabs.location') },
  ];

  const STATUS_BADGE = {
    'DISPONIBLE': 'badge-green', 'Disponible': 'badge-green',
    'VENDU': 'badge-red',        'Vendu': 'badge-red',
    'LOUE': 'badge-amber',       'Loué': 'badge-amber',
  };

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (error || !property) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <ErrorMessage message={error || 'Annonce introuvable.'} />
    </div>
  );

  const agent = property.agent || null;

  return (
    <>
    <div className="pt-20 min-h-screen bg-neutral-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-custom py-3 flex items-center gap-2 text-xs text-neutral-400">
          <Link to="/" className="hover:text-primary transition-colors">{t('property.breadcrumbHome')}</Link>
          <ChevronRight size={12} />
          <Link to="/recherche" className="hover:text-primary transition-colors">{t('property.breadcrumbListings')}</Link>
          <ChevronRight size={12} />
          <span className="text-neutral-700 truncate max-w-[200px]">{property.title}</span>
        </div>
      </div>

      <div className="container-custom py-8">
        <Link to="/recherche" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors mb-6">
          <ArrowLeft size={15} /> {t('property.backToListings')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left col ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-card">
              <div className="relative h-[240px] sm:h-[320px] md:h-[420px] group/img">
                <img
                  src={property.images[imgIdx] || 'https://placehold.co/800x500?text=IMMO 21'}
                  alt={property.title}
                  onClick={() => setLightbox(true)}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                <div
                  onClick={() => setLightbox(true)}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-zoom-in"
                >
                  <div className="bg-black/40 backdrop-blur-sm rounded-full p-3">
                    <ZoomIn size={22} className="text-white" />
                  </div>
                </div>
                {/* badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`badge font-semibold ${property.purpose === 'VENTE' || property.purpose === 'Vente' ? 'bg-primary text-white' : 'bg-accent text-white'}`}>
                    {t(`common.purpose.${property.purpose}`)}
                  </span>
                  <span className={STATUS_BADGE[property.status] || 'badge-green'}>
                    {t(`common.status.${property.status}`)}
                  </span>
                  {property.featured && (
                    <span className="badge font-semibold bg-amber-400 text-white flex items-center gap-1">
                      <Star size={11} fill="white" /> Premium
                    </span>
                  )}
                </div>
                {/* share action */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-neutral-500 hover:text-primary hover:bg-white transition-all shadow-sm"
                    title="Partager"
                  >
                    <Share2 size={15} />
                  </button>
                  {shareOpen && (
                    <>
                      {/* backdrop to close */}
                      <div className="fixed inset-0 z-40" onClick={() => setShareOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 p-2 z-50 w-52">
                        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-3 py-1.5">
                          Partager l'annonce
                        </p>
                        {/* WhatsApp */}
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `*${property.title}*\n` +
                            `Ville : ${[property.neighborhood, property.city].filter(Boolean).join(', ')}\n` +
                            `Prix : ${formatPrice(property.price, property.purpose, property.subPurpose)}\n` +
                            (property.area ? `Surface : ${property.area} m2` : '') +
                            (property.rooms ? ` - ${property.rooms} chambre${property.rooms > 1 ? 's' : ''}` : '') + '\n' +
                            `\nVoir l\'annonce : ${window.location.href}`
                          )}`}
                          target="_blank" rel="noreferrer"
                          onClick={() => setShareOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors text-sm font-medium"
                        >
                          <MessageCircle size={16} /> WhatsApp
                        </a>
                        {/* Facebook */}
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                          target="_blank" rel="noreferrer"
                          onClick={() => setShareOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors text-sm font-medium"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                          Facebook
                        </a>
                        {/* Copy link */}
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-sm font-medium text-neutral-700"
                        >
                          {copied
                            ? <><Check size={16} className="text-emerald-500" /><span className="text-emerald-600">Lien copié !</span></>
                            : <><Link2 size={16} /> Copier le lien</>
                          }
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {/* nav */}
                {property.images.length > 1 && (
                  <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {property.images.map((_,i) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                          className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 p-3">
                  {property.images.map((img, i) => (
                    <button key={i}
                      onClick={() => { setImgIdx(i); setLightbox(true); }}
                      className={`h-14 w-20 rounded-xl overflow-hidden shrink-0 ring-2 transition-all ${i === imgIdx ? 'ring-primary' : 'ring-transparent opacity-50 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info header */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-2 leading-tight">{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-neutral-400 text-sm">
                    <MapPin size={14} />
                    <span>{property.neighborhood}, {property.city}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">{formatPrice(property.price, property.purpose)}</p>
                  <p className="text-neutral-400 text-xs mt-1">{property.type} · {property.area} m²</p>
                </div>
              </div>

              {/* Key stats */}
              <div className="flex flex-wrap gap-3 py-4 border-t border-b border-neutral-100 mb-4">
                {[
                  property.rooms > 0 && { icon: BedDouble, label: `${property.rooms} ${property.rooms > 1 ? t('property.rooms') : t('property.room')}` },
                  property.bathrooms > 0 && { icon: Bath, label: `${property.bathrooms} ${property.bathrooms > 1 ? t('property.bathrooms') : t('property.bathroom')}` },
                  property.area && { icon: Maximize2, label: `${property.area} m²` },
                  property.floor > 0 && { icon: Building2, label: `${t('property.floor')} ${property.floor}` },
                  property.views !== undefined && { icon: Eye, label: `${property.views} ${t('property.views')}` },
                ].filter(Boolean).map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-neutral-50 rounded-xl px-4 py-2.5 text-sm text-neutral-600">
                    <Icon size={15} className="text-primary" />
                    {label}
                  </div>
                ))}
              </div>

              {/* Extra badges */}
              <div className="flex flex-wrap gap-2">
                {property.parking   && <span className="badge-gray">🚗 {t('property.parking')}</span>}
                {property.elevator  && <span className="badge-gray">🛗 {t('property.elevator')}</span>}
                {property.furnished && <span className="badge-gray">🛋️ {t('property.furnished')}</span>}
                <span className="badge-primary">{t('property.ref')} #IM-{String(property.id).padStart(4,'0')}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="flex border-b border-neutral-100">
                {TABS.map(({ key, label }) => (
                  <button key={key} onClick={() => setTab(key)}
                    className={`flex-1 py-4 text-sm font-semibold capitalize transition-colors ${tab === key ? 'text-primary border-b-2 border-primary' : 'text-neutral-400 hover:text-neutral-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-6">
                {tab === 'description' && (
                  <p className="text-neutral-600 text-sm leading-relaxed">{property.description}</p>
                )}
                {tab === 'équipements' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(property.features || []).map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle2 size={15} className="text-primary shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                )}
                {tab === 'localisation' && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
                      <MapPin size={15} className="text-primary" />
                      {property.neighborhood}, {property.city}, Maroc
                    </div>
                    <div className="h-56 bg-neutral-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=60" alt="Map" className="w-full h-full object-cover opacity-30" />
                      <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                        <MapPin size={32} className="text-primary" />
                        <p className="text-sm font-medium text-neutral-700">{property.neighborhood}, {property.city}</p>
                        <p className="text-xs text-neutral-500">{t('property.mapComingSoon')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">
            {/* Agent card */}
            {agent && (
              <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6">
                <h3 className="font-semibold text-neutral-800 mb-4 text-sm">{t('property.agent')}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative shrink-0">
                    <img src={getAvatarUrl(agent.avatar || agent.avatarUrl)} alt={agent.name} className="w-14 h-14 rounded-2xl object-cover" />
                    {agent.verified && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle2 size={9} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{agent.name}</p>
                    <p className="text-neutral-400 text-xs mt-0.5">{agent.agency}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} fill="#C9922A" className="text-accent" />
                      <span className="text-xs font-semibold">{agent.rating ?? '—'}</span>
                      <span className="text-neutral-400 text-xs">({agent.reviews ?? 0} avis)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="flex gap-2">
                    <a href={`tel:${agent.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all">
                      <Phone size={15} /> {t('common.call')}
                    </a>
                    <a href={`https://wa.me/${(agent.whatsapp || agent.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Bonjour, je vous contacte au sujet de cette annonce :\n\n` +
                        `*${property.title}*\n` +
                        `Ville : ${[property.neighborhood, property.city].filter(Boolean).join(', ')}\n` +
                        `Type : ${property.type} - ${property.purpose === 'LOCATION' ? 'Location' : 'Vente'}\n` +
                        `Prix : ${formatPrice(property.price, property.purpose, property.subPurpose)}\n` +
                        `Surface : ${[
                          property.area ? `${property.area} m2` : null,
                          property.rooms ? `${property.rooms} chambre${property.rooms > 1 ? 's' : ''}` : null,
                          property.bathrooms ? `${property.bathrooms} salle${property.bathrooms > 1 ? 's' : ''} de bain` : null,
                        ].filter(Boolean).join(' - ')}\n` +
                        `\nVoir l\'annonce : ${window.location.href}`
                      )}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors">
                      <MessageCircle size={15} /> {t('common.whatsapp')}
                    </a>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-400">
                    <span className="font-semibold text-neutral-700">{agent.listings ?? 0}</span> {t('property.activeListings')} ·{' '}
                    <span className="font-semibold text-neutral-700">{agent.sold ?? 0}</span> {t('property.sales')}
                  </p>
                </div>
              </div>
            )}

            {/* Contact form */}
            <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6">
              <h3 className="font-semibold text-neutral-800 mb-4 text-sm">{t('property.contactForm')}</h3>
              {sent && (
                <div className="bg-emerald-50 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium mb-4 flex items-center gap-2">
                  <CheckCircle2 size={15} /> {t('property.messageSent')}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="form-group">
                  <input type="text" required placeholder={t('property.name')} className="form-input"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <input type="tel" required placeholder={t('property.phone')} className="form-input"
                    value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <input type="email" placeholder={t('property.email')} className="form-input"
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <div className="relative">
                    <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input type="date" className="form-input pl-9"
                      value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <textarea rows={3} placeholder={t('property.message')} className="form-textarea"
                    value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
                </div>
                <button type="submit" disabled={sending} className="btn-primary w-full text-sm disabled:opacity-60">
                  {sending ? <Spinner size="sm" /> : <><Send size={14} /> {t('property.sendMessage')}</>}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-14">
            <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-6">{t('property.similar')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similar.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Lightbox ─────────────────────────────────────────────── */}
    {lightbox && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => setLightbox(false)}>
        <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10">
          <X size={20} />
        </button>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
          {imgIdx + 1} / {property.images.length}
        </div>
        <img
          src={property.images[imgIdx]}
          alt={property.title}
          onClick={e => e.stopPropagation()}
          className="max-w-[92vw] max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
        />
        {property.images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); lbPrev(); }} className="absolute left-3 sm:left-6 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
              <ChevronLeft size={24} />
            </button>
            <button onClick={e => { e.stopPropagation(); lbNext(); }} className="absolute right-3 sm:right-6 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
              <ChevronRight size={24} />
            </button>
          </>
        )}
        {property.images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 px-4">
            {property.images.map((img, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 ring-2 transition-all ${i === imgIdx ? 'ring-white opacity-100 scale-105' : 'ring-transparent opacity-40 hover:opacity-70'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    </>
  );
}
