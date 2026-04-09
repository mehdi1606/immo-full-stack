import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Grid3X3, List, SlidersHorizontal, ChevronDown, Search as SearchIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilters from '../components/property/PropertyFilters';
import SkeletonCard from '../components/common/SkeletonCard';
import ErrorMessage from '../components/common/ErrorMessage';
import { useApp } from '../context/AppContext';
import { searchProperties, getImageUrl } from '../api/properties';

const formatPrice = (price, purpose, subPurpose, currency = 'MAD') => {
  const p = price || 0;
  if (purpose === 'LOCATION' || purpose === 'Location') {
    const suffix = subPurpose === 'COURT_TERME' ? '/jour' : '/mois';
    return `${p.toLocaleString('fr-MA')} ${currency}${suffix}`;
  }
  return `${p.toLocaleString('fr-MA')} ${currency}`;
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const { filters, setFilters } = useApp();

  const [sortBy, setSortBy]           = useState('recent');
  const [viewMode, setViewMode]       = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [totalElements, setTotal]     = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 12;

  const SORT_OPTIONS = [
    { value: 'recent',     label: t('search.sort.recent') },
    { value: 'price_asc',  label: t('search.sort.price_asc') },
    { value: 'price_desc', label: t('search.sort.price_desc') },
    { value: 'area_desc',  label: t('search.sort.area_desc') },
    { value: 'views',      label: t('search.sort.views') },
  ];

  // Seed filters from URL params on first mount
  useEffect(() => {
    const p = {};
    for (const [k, v] of searchParams.entries()) {
      if (['city', 'type', 'purpose', 'q'].includes(k)) p[k] = v;
    }
    if (Object.keys(p).length) setFilters(prev => ({ ...prev, ...p }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchResults = useCallback(() => {
    setLoading(true);
    setError('');
    const sortParam = sortBy === 'price_asc'  ? 'price,asc'
                    : sortBy === 'price_desc' ? 'price,desc'
                    : sortBy === 'area_desc'  ? 'area,desc'
                    : sortBy === 'views'      ? 'views,desc'
                    : 'createdAt,desc';

    // Map UI-only fields → backend subPurpose enum
    const subPurposeMap = {
      neuf:     'NEUF',
      occasion: 'OCCASION',
      mois:     'LONG_TERME',
      jour:     'COURT_TERME',
    };
    const subPurpose = subPurposeMap[filters.condition] || subPurposeMap[filters.rentalPeriod] || '';

    // Build clean API params (strip UI-only keys)
    const { condition, rentalPeriod, ...apiFilters } = filters;
    const apiParams = {
      ...apiFilters,
      ...(subPurpose ? { subPurpose } : {}),
      page: currentPage,
      size: PAGE_SIZE,
      sort: sortParam,
    };

    searchProperties(apiParams)
      .then(data => {
        const content = data?.content ?? (Array.isArray(data) ? data : []);
        setResults(content.map(p => ({
          ...p,
          images: [getImageUrl(p.mainImageUrl)],
        })));
        setTotal(data?.totalElements ?? content.length);
        setTotalPages(data?.totalPages ?? 1);
      })
      .catch(err => setError(err.message || 'Erreur lors de la recherche.'))
      .finally(() => setLoading(false));
  }, [filters, sortBy, currentPage, i18n.language]);

  // Reset to page 0 when filters or sort change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters, sortBy]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="pt-24 pb-10 min-h-screen bg-neutral-50">
      <div className="container-custom">
        <div className="flex gap-6">

          {/* ── Desktop sidebar ─────────────────────────────────── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <PropertyFilters filters={filters} setFilters={setFilters} count={totalElements} />
            </div>
          </aside>

          {/* ── Results column ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ── Filter toolbar ─────────────────────────────── */}
            <div className="mb-5 bg-white rounded-2xl px-4 py-3 shadow-sm border border-neutral-100">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-neutral-500 truncate">
                  <span className="font-bold text-neutral-900 text-lg">{totalElements}</span>{' '}
                  {t('search.resultsCount', { count: totalElements })}
                </p>
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold relative active:scale-95 transition-transform shrink-0"
                >
                  <SlidersHorizontal size={14} />
                  {t('filters.title')}
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div className="relative flex-1">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{ fontSize: '16px' }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:border-primary text-neutral-600 cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                </div>
                <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl shrink-0">
                  <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-neutral-400'}`}>
                    <Grid3X3 size={16} />
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-neutral-400'}`}>
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <ErrorMessage message={error} onRetry={fetchResults} />
            ) : results.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-neutral-100">
                <SearchIcon size={48} className="text-neutral-200 mx-auto mb-4" />
                <h3 className="font-semibold text-neutral-800 text-lg mb-2">{t('search.noResults')}</h3>
                <p className="text-neutral-400 text-sm mb-6">{t('search.noResultsHint')}</p>
                <button
                  onClick={() => setFilters({ q: '', city: '', type: '', purpose: '', status: '', minPrice: '', maxPrice: '', minRooms: '', condition: '', rentalPeriod: '' })}
                  className="btn-primary text-sm"
                >
                  {t('search.clearFilters')}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map(p => <PropertyCard key={p.id} property={p} />)}
              </div>
            ) : (
              <div className="space-y-4">
                {results.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-neutral-100 flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow">
                    <div className="sm:w-52 h-48 sm:h-auto shrink-0 overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://placehold.co/400x300?text=ImmoMaroc'}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`badge text-xs ${p.purpose === 'VENTE' || p.purpose === 'Vente' ? 'bg-primary text-white' : 'bg-accent text-white'}`}>
                            {t(`common.purpose.${p.purpose}`)}
                          </span>
                          <span className={`badge text-xs ${p.status === 'DISPONIBLE' || p.status === 'Disponible' ? 'badge-green' : p.status === 'VENDU' || p.status === 'Vendu' ? 'badge-red' : 'badge-amber'}`}>
                            {t(`common.status.${p.status}`)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-neutral-900 text-base mb-1 hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                        <p className="text-neutral-400 text-xs mb-3 flex items-center gap-1"><span>📍</span>{p.neighborhood}, {p.city}</p>
                        <p className="text-neutral-500 text-sm line-clamp-2 leading-relaxed">{p.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-50">
                        <div className="flex gap-3 text-xs text-neutral-500">
                          {p.rooms > 0 && <span>{p.rooms} {t('property.chBed')}</span>}
                          {p.bathrooms > 0 && <span>{p.bathrooms} {t('property.chBath')}</span>}
                          <span>{p.area} m²</span>
                        </div>
                        <p className="font-bold text-primary">{formatPrice(p.price, p.purpose, p.subPurpose, t('common.currency'))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pagination ──────────────────────────────────── */}
            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Précédent
                </button>
                <span className="text-sm text-neutral-500">
                  Page <strong>{currentPage + 1}</strong> / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filters bottom sheet ──────────────────────────── */}
      {showFilters && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col"
            style={{
              maxHeight: '92dvh',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-neutral-200" />
            </div>

            {/* Sticky sheet header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-900 text-base">{t('filters.title')}</h3>
                {activeFiltersCount > 0 && (
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-3">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters({ q: '', city: '', type: '', purpose: '', status: '',
                      minPrice: '', maxPrice: '', minRooms: '', condition: '', rentalPeriod: '' })}
                    className="text-sm text-primary font-semibold"
                  >
                    {t('filters.clearAll')}
                  </button>
                )}
                <button type="button" onClick={() => setShowFilters(false)}
                  className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-500">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable filter content — flat mode: no card, no inner header, no inner px */}
            <div className="flex-1 overflow-y-auto px-4">
              <PropertyFilters
                flat
                filters={filters}
                setFilters={setFilters}
                count={totalElements}
              />
            </div>

            {/* Sticky apply button */}
            <div className="shrink-0 px-4 py-4 border-t border-neutral-100 bg-white"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="btn-primary w-full py-3.5 text-base font-semibold rounded-2xl"
              >
                {t('filters.apply')} ({totalElements})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
