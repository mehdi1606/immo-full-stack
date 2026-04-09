import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, MapPin, Home, Building2, Layers, TrendingUp, Users,
  ArrowRight, Phone, MessageCircle, CheckCircle2, ShieldCheck,
  Zap, ChevronRight, Warehouse, Store, ClipboardList, UserCheck,
  ChevronLeft,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../components/property/PropertyCard';
import SkeletonCard from '../components/common/SkeletonCard';
import { CITIES, TYPES } from '../data/properties';
import { getFeaturedProperties, getImageUrl } from '../api/properties';

// ─── Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [segment, setSegment] = useState('Résidentiel'); // Résidentiel | Commercial
  const [purpose, setPurpose]  = useState('VENTE');
  const [city, setCity]        = useState('');
  const [type, setType]        = useState('');
  const [query, setQuery]      = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (city)  params.set('city', city);
    if (type)  params.set('type', type);
    params.set('purpose', purpose);
    navigate(`/recherche?${params}`);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1800&q=80"
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/80 to-primary-700/60" />
      </div>
      <div className="absolute top-24 right-12 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 container-custom pt-16 pb-12 sm:pt-20 sm:pb-16 md:pt-28 md:pb-20 w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
          <ShieldCheck size={14} className="text-accent" />
          {t('home.hero.badge')}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 max-w-3xl">
          {t('home.hero.title1')}{' '}
          <span className="text-accent italic">{t('home.hero.title2')}</span><br />
          {t('home.hero.title3')}
        </h1>
        <p className="text-white/70 text-lg max-w-xl leading-relaxed mb-10">
          {t('home.hero.subtitle')}
        </p>

        {/* Search card — Sarouty style */}
        <form onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow-2xl p-4 max-w-4xl space-y-3">

          {/* Row 1: all pills + location + search button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Résidentiel / Commercial */}
            {['Résidentiel', 'Commercial'].map(seg => (
              <button type="button" key={seg} onClick={() => setSegment(seg)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  segment === seg
                    ? 'bg-primary text-white border-primary'
                    : 'border-neutral-200 text-neutral-600 hover:border-primary hover:text-primary bg-white'
                }`}>
                {seg}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-neutral-200 mx-1 hidden sm:block" />

            {/* Acheter / Louer */}
            {['VENTE', 'LOCATION'].map(p => (
              <button type="button" key={p} onClick={() => setPurpose(p)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  purpose === p
                    ? 'bg-primary text-white border-primary'
                    : 'border-neutral-200 text-neutral-600 hover:border-primary hover:text-primary bg-white'
                }`}>
                {p === 'VENTE' ? t('home.hero.tabBuy') : t('home.hero.tabRent')}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-neutral-200 mx-1 hidden sm:block" />

            {/* Location input */}
            <div className="relative flex-1 min-w-[180px]">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={t('home.hero.placeholder')}
                className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-full outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-neutral-400" />
            </div>

            {/* Search button */}
            <button type="submit"
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-primary-700 transition-all flex items-center gap-2 shrink-0 text-sm">
              <Search size={15} />
              {t('home.hero.searchBtn')}
            </button>
          </div>

          {/* Row 2: Type · City · Rooms placeholder */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-100">
            {/* Property type */}
            <select value={type} onChange={e => setType(e.target.value)}
              className="flex-1 min-w-[140px] text-sm text-neutral-600 border border-neutral-200 rounded-full px-4 py-2 outline-none focus:border-primary bg-white cursor-pointer">
              <option value="">{t('home.hero.allTypes')}</option>
              {TYPES.map(tp => <option key={tp}>{tp}</option>)}
            </select>

            {/* City */}
            <select value={city} onChange={e => setCity(e.target.value)}
              className="flex-1 min-w-[140px] text-sm text-neutral-600 border border-neutral-200 rounded-full px-4 py-2 outline-none focus:border-primary bg-white cursor-pointer">
              <option value="">{t('home.hero.allCities')}</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>

            {/* Price range placeholder */}
            <select className="flex-1 min-w-[120px] text-sm text-neutral-600 border border-neutral-200 rounded-full px-4 py-2 outline-none focus:border-primary bg-white cursor-pointer">
              <option value="">Prix</option>
              <option>Moins de 1M</option>
              <option>1M – 3M</option>
              <option>3M – 7M</option>
              <option>Plus de 7M</option>
            </select>
          </div>
        </form>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-4 sm:gap-8 mt-10">
          {[
            // { value: t('home.hero.stat1Value'), label: t('home.hero.stat1Label') },
            // { value: t('home.hero.stat2Value'), label: t('home.hero.stat2Label') },
            // { value: t('home.hero.stat3Value'), label: t('home.hero.stat3Label') },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-white font-bold text-xl leading-none">{value}</p>
              <p className="text-white/50 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Residential + Commercial categories ────────────────────────────────────
const residentialTypes = [
  { type: 'APPARTEMENT', img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80' },
  { type: 'STUDIO',      img: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=600&q=80' },
  { type: 'VILLA',       img: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80' },
  { type: 'TERRAIN',     img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80' },
];

const commercialTypes = [
  { type: 'BUREAU',      img: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80' },
  { type: 'RIAD',        img: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80' },
  { type: 'APPARTEMENT', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', label: 'Locaux' },
  { type: 'TERRAIN',     img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80' },
];

function Categories() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const TypeCard = ({ item }) => (
    <button onClick={() => navigate(`/recherche?type=${item.type}`)}
      className="relative overflow-hidden rounded-2xl group cursor-pointer text-left shadow-sm hover:shadow-xl transition-shadow duration-300">
      <img src={item.img} alt={item.label || t(`home.quickTypes.types.${item.type}`)}
        className="w-full h-36 object-cover transition-transform duration-700 group-hover:scale-110"
        onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/85 transition-all duration-300" />
      {/* subtle top shine */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 p-4">
        <p className="text-white font-bold text-[15px] leading-tight drop-shadow-md">
          {item.label || t(`home.quickTypes.types.${item.type}`)}
        </p>
      </div>
      {/* Arrow on hover */}
      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
        <ChevronRight size={14} className="text-white" />
      </div>
    </button>
  );

  return (
    <section className="py-14 bg-neutral-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Résidentiel */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutral-900">Résidentiel</h2>
                <p className="text-neutral-400 text-xs mt-0.5">Appartements, villas, studios et terrains</p>
              </div>
              <Link to="/recherche" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                {t('home.quickTypes.viewAll')} <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {residentialTypes.map(item => <TypeCard key={item.type + 'res'} item={item} />)}
            </div>
          </div>

          {/* Commercial */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-serif text-xl font-bold text-neutral-900">Commercial</h2>
                <p className="text-neutral-400 text-xs mt-0.5">Bureaux, riads, locaux et terrains</p>
              </div>
              <Link to="/recherche" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                {t('home.quickTypes.viewAll')} <ChevronRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {commercialTypes.map(item => <TypeCard key={item.type + 'com'} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Featured properties carousel ────────────────────────────────────────────
function FeaturedProperties() {
  const { t, i18n } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef(null);
  const VISIBLE = 4; // cards shown at once

  const maxIdx = useCallback(
    (total) => Math.max(0, total - VISIBLE),
    []
  );

  const scrollTo = useCallback((idx) => {
    setActiveIdx(idx);
    if (!trackRef.current) return;
    const card = trackRef.current.children[idx];
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }, []);

  const prev = () => scrollTo(Math.max(0, activeIdx - 1));
  const next = (total) => scrollTo(Math.min(maxIdx(total), activeIdx + 1));

  useEffect(() => {
    getFeaturedProperties()
      .then(data => {
        // Backend may return array directly or paginated object
        const list = Array.isArray(data) ? data : (data?.content ?? []);
        setFeatured(list.map(p => ({
          ...p,
          images: [getImageUrl(p.mainImageUrl)],
        })));
      })
      .catch(() => setError('Impossible de charger les annonces.'))
      .finally(() => setLoading(false));
  }, [i18n.language]);

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-tag mb-2">
              <span className="w-5 h-0.5 bg-accent" /> {t('home.featured.tag')}
            </p>
            <h2 className="font-serif text-3xl font-bold text-neutral-900">
              {t('home.featured.title1')} <span className="text-primary">{t('home.featured.title2')}</span>
            </h2>
            <p className="text-neutral-500 text-sm mt-2 max-w-md">{t('home.featured.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {featured.length > VISIBLE && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!trackRef.current) return;
                    const cardW = trackRef.current.scrollWidth / featured.length;
                    const next = Math.max(0, activeIdx - 1);
                    trackRef.current.scrollTo({ left: next * cardW, behavior: 'smooth' });
                    setActiveIdx(next);
                  }}
                  disabled={activeIdx === 0}
                  className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    if (!trackRef.current) return;
                    const cardW = trackRef.current.scrollWidth / featured.length;
                    const next = Math.min(maxIdx(featured.length), activeIdx + 1);
                    trackRef.current.scrollTo({ left: next * cardW, behavior: 'smooth' });
                    setActiveIdx(next);
                  }}
                  disabled={activeIdx >= maxIdx(featured.length)}
                  className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            <Link to="/recherche" className="btn-outline text-sm hidden md:flex">
              {t('home.featured.viewAll')} <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-neutral-400 text-sm text-center py-8">{error}</p>
        ) : (
          <>
            {/* Desktop: scroll-snap carousel showing 4 at a time */}
            <div className="hidden sm:block relative">
              <div
                ref={trackRef}
                className="flex gap-5 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
                style={{
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch',
                }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const cardW = el.scrollWidth / featured.length;
                  setActiveIdx(Math.round(el.scrollLeft / cardW));
                }}
              >
                {featured.map(p => (
                  <div
                    key={p.id}
                    style={{
                      scrollSnapAlign: 'start',
                      minWidth: 'calc(25% - 15px)',
                      flex: '0 0 calc(25% - 15px)',
                    }}
                  >
                    <PropertyCard property={p} />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: normal vertical stack */}
            <div className="grid grid-cols-1 gap-5 sm:hidden">
              {featured.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>

            {/* Dot indicators */}
            {featured.length > VISIBLE && (
              <div className="hidden sm:flex justify-center gap-2 mt-6">
                {Array.from({ length: maxIdx(featured.length) + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!trackRef.current) return;
                      const cardW = trackRef.current.scrollWidth / featured.length;
                      trackRef.current.scrollTo({ left: i * cardW, behavior: 'smooth' });
                      setActiveIdx(i);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === activeIdx ? 'bg-primary w-6' : 'bg-neutral-300 w-2 hover:bg-neutral-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
        <Link to="/recherche" className="btn-outline text-sm mt-6 md:hidden flex justify-center">
          {t('home.featured.viewAll')} <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { num: '01', icon: Search,        title: 'Recherchez',          desc: 'Parcourez des milliers d\'annonces filtrées par ville, type et budget — en quelques secondes.' },
    { num: '02', icon: ClipboardList, title: 'Choisissez un bien',  desc: 'Consultez les photos, les détails et la localisation. Contactez directement notre équipe.' },
    { num: '03', icon: UserCheck,     title: 'Signez & Emménagez',  desc: 'Nos agents vous accompagnent jusqu\'à la signature. Simple, rapide et sécurisé.' },
  ];
  return (
    <section className="py-16 bg-primary">
      <div className="container-custom">
        <div className="text-center mb-12">
          <p className="section-tag justify-center text-accent mb-2">
            <span className="w-5 h-0.5 bg-accent" /> Comment ça marche
          </p>
          <h2 className="font-serif text-3xl font-bold text-white">
            3 étapes pour trouver <span className="text-accent">votre bien</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px bg-white/20 z-0" />
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={num} className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-7 text-center hover:bg-white/15 transition-all">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 mb-5">
                <Icon size={24} className="text-accent" />
              </div>
              <span className="absolute top-5 right-5 text-white/20 font-bold text-3xl leading-none">{num}</span>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Discover expertise (Sarouty-style left image + right points) ────────────
function DiscoverExpertise() {
  const { t } = useTranslation();
  const points = [
    { icon: ShieldCheck, title: t('home.whyUs.item1Title'), desc: t('home.whyUs.item1Desc') },
    { icon: Zap,         title: t('home.whyUs.item2Title'), desc: t('home.whyUs.item2Desc') },
    { icon: Users,       title: t('home.whyUs.item3Title'), desc: t('home.whyUs.item3Desc') },
  ];
  return (
    <section className="py-16 bg-neutral-50">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Images mosaic */}
          <div className="grid grid-cols-2 gap-3">
            <img src="https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80" alt=""
              className="rounded-2xl h-48 w-full object-cover col-span-2" />
            <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80" alt=""
              className="rounded-2xl h-36 w-full object-cover" />
            <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80" alt=""
              className="rounded-2xl h-36 w-full object-cover" />
          </div>

          {/* Text */}
          <div>
            <p className="section-tag mb-3">
              <span className="w-5 h-0.5 bg-accent" /> {t('home.whyUs.tag')}
            </p>
            <h2 className="font-serif text-3xl font-bold text-neutral-900 mb-3 leading-tight">
              {t('home.whyUs.title1')}<br />
              <span className="text-primary">{t('home.whyUs.title2')}</span>
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed mb-8">{t('home.whyUs.subtitle')}</p>

            <div className="space-y-6">
              {points.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm mb-0.5">{title}</p>
                    <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <Link to="/recherche" className="btn-primary text-sm">{t('home.whyUs.explore')}</Link>
              <Link to="/vendre" className="btn-outline text-sm">{t('home.whyUs.publish')}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Cities ──────────────────────────────────────────────────────────────────
const cityImages = {
  // Casablanca – Hassan II Mosque (Pexels #2404046)
  Casablanca: 'https://images.pexels.com/photos/2404046/pexels-photo-2404046.jpeg?auto=compress&cs=tinysrgb&w=600&h=400',
  // Marrakech – Koutoubia Mosque Tower (Pexels #33350432)
  Marrakech:  'https://images.pexels.com/photos/33350432/pexels-photo-33350432.jpeg?auto=compress&cs=tinysrgb&w=600&h=400',
  // Rabat – Hassan Tower (Pexels #12504063)
  Rabat:      'https://images.pexels.com/photos/12504063/pexels-photo-12504063.jpeg?auto=compress&cs=tinysrgb&w=600&h=400',
  // Agadir – Agadir Beach (Pexels #30557503)
  Agadir:     'https://images.pexels.com/photos/30557503/pexels-photo-30557503.jpeg?auto=compress&cs=tinysrgb&w=600&h=400',
  // Tanger – Port de Tanger Ville (Pexels #13142301)
  Tanger:     'https://images.pexels.com/photos/13142301/pexels-photo-13142301.jpeg?auto=compress&cs=tinysrgb&w=600&h=400',
  // Fès – Aerial view of Fès tannery (Pexels #31704021)
  Fès:        'https://images.pexels.com/photos/31704021/pexels-photo-31704021.jpeg?auto=compress&cs=tinysrgb&w=600&h=400',
};
const cityCounts = { Casablanca: 3450, Marrakech: 2870, Rabat: 1960, Agadir: 980, Tanger: 1240, Fès: 720 };

function CitiesSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-tag mb-2">
              <span className="w-5 h-0.5 bg-accent" /> {t('home.cities.tag')}
            </p>
            <h2 className="font-serif text-3xl font-bold text-neutral-900">{t('home.cities.title')}</h2>
            <p className="text-neutral-500 text-sm mt-2">{t('home.cities.subtitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(cityImages).map(([city, img], i) => (
            <button key={city}
              onClick={() => navigate(`/recherche?city=${city}`)}
              className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i === 0 ? 'sm:col-span-2 h-44 sm:h-56' : 'h-36 sm:h-44'}`}>
              <img src={img} alt={city} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-bold text-lg">{city}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Banner ──────────────────────────────────────────────────────────
function ContactBanner() {
  return (
    <section className="py-12 bg-neutral-50">
      <div className="container-custom">
        <div className="bg-white rounded-3xl shadow-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: text */}
            <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <p className="section-tag mb-3">
                <span className="w-5 h-0.5 bg-accent" /> Contactez-nous
              </p>
              <h2 className="font-serif text-3xl font-bold text-neutral-900 mb-3 leading-tight">
                Un projet immobilier ?<br />
                <span className="text-primary">Parlons-en.</span>
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8 max-w-sm">
                Nos conseillers sont disponibles 7j/7 pour répondre à vos questions,
                organiser des visites et vous accompagner dans votre projet.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="tel:+212600000000"
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
                  <Phone size={16} /> Appeler maintenant
                </a>
                <a href="https://wa.me/212600000000" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Right: quick info cards */}
            <div className="bg-neutral-50 p-6 sm:p-8 md:p-10 flex flex-col gap-4 justify-center">
              {[
                { icon: ShieldCheck, color: 'bg-primary/10 text-primary',   title: 'Agents vérifiés',     desc: 'Tous nos conseillers sont certifiés et expérimentés.' },
                { icon: Zap,         color: 'bg-accent/10 text-accent',     title: 'Réponse rapide',      desc: 'Nous vous recontactons sous 30 minutes en journée.' },
                { icon: CheckCircle2,color: 'bg-emerald-100 text-emerald-600', title: 'Sans engagement',  desc: 'Consultation gratuite, aucun engagement de votre part.' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-white rounded-2xl p-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">{title}</p>
                    <p className="text-neutral-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA ─────────────────────────────────────────────────────────────────────
function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-accent/10 rounded-full blur-2xl" />
      <div className="container-custom relative z-10 text-center">
        <p className="section-tag justify-center text-accent mb-4">
          <span className="w-5 h-0.5 bg-accent" /> {t('home.cta.tag')}
        </p>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
          {t('home.cta.title1')}<br />
          <span className="text-accent">{t('home.cta.title2')}</span>
        </h2>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">{t('home.cta.subtitle')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/recherche" className="btn-accent btn-lg">{t('home.cta.browse')}</Link>
          <Link to="/vendre" className="btn-outline-white btn-lg">{t('home.cta.sell')}</Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProperties />
      <DiscoverExpertise />
      <HowItWorks />
      <CitiesSection />
      <ContactBanner />
      <CTASection />
    </>
  );
}
