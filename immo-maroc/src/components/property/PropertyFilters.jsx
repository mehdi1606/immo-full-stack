import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { CITIES, TYPES, PURPOSES, STATUSES } from '../../data/properties';
import { useTranslation } from 'react-i18next';

/* ─── Sub-components defined OUTSIDE to keep stable references ───────────────
   Defining them inside PropertyFilters causes re-mount on every keystroke     */

const Pill = ({ active, onClick, children }) => (
  <button type="button" onClick={onClick}
    className={`flex-1 min-h-[44px] py-2 px-2 rounded-xl text-xs font-semibold border-2
      transition-all text-center leading-tight active:scale-95 ${
      active ? 'border-primary bg-primary text-white'
             : 'border-neutral-200 text-neutral-500 bg-white hover:border-primary/50 hover:text-primary'}`}>
    {children}
  </button>
);

const Btn = ({ active, onClick, children, className = '' }) => (
  <button type="button" onClick={onClick}
    className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-semibold border-2
      transition-all text-center leading-tight active:scale-95 ${
      active ? 'border-primary bg-primary text-white'
             : 'border-neutral-200 text-neutral-500 bg-white hover:border-primary/50 hover:text-primary'
    } ${className}`}>
    {children}
  </button>
);

const Section = ({ label, children, flat }) => (
  <div className={`py-3.5 ${flat ? '' : 'px-4'}`}>
    {label && (
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
        {label}
      </p>
    )}
    {children}
  </div>
);

/* ─── Price input: text + inputMode=numeric for perfect mobile support ───
   - type="text" + inputMode="numeric" → numeric keyboard iOS & Android
   - pattern="[0-9]*"                 → iOS numeric keyboard (no decimal)
   - Strips non-digits on change      → clean number stored in filters
   - Formats display with spaces      → "66 666 666" readable on all devices
   - Split design [ number | DH ]     → vertical divider + currency badge  */
function PriceInput({ placeholder, value, onChange, currency }) {
  const fmt = raw => {
    const s = String(raw || '').replace(/\D/g, '');
    if (!s) return '';
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); // non-breaking space grouping
  };
  const handleChange = e => {
    const raw = e.target.value.replace(/\D/g, '');
    onChange(raw);
  };
  return (
    <div className="flex items-center h-11 rounded-xl border border-neutral-200 bg-neutral-50
      focus-within:border-primary focus-within:bg-white transition-all overflow-hidden flex-1">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        placeholder={placeholder}
        value={fmt(value)}
        onChange={handleChange}
        style={{ fontSize: '16px' }}
        className="flex-1 min-w-0 h-full px-3 bg-transparent outline-none text-sm text-neutral-700
          placeholder:text-neutral-400"
      />
      <div className="self-stretch w-px bg-neutral-200 shrink-0" />
      <span className="px-2.5 text-[11px] font-bold text-neutral-400 select-none shrink-0 whitespace-nowrap">
        {currency}
      </span>
    </div>
  );
}

const Sel = ({ value, onChange, children }) => (
  <div className="relative">
    <select value={value} onChange={onChange} style={{ fontSize: '16px' }}
      className="w-full h-11 px-3 pe-8 rounded-xl border border-neutral-200 bg-neutral-50
        appearance-none focus:outline-none focus:border-primary text-neutral-600 transition-colors">
      {children}
    </select>
    <ChevronDown size={13} className="absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────────────
 * flat={false}  →  desktop card sidebar  (card border + header + section px-4)
 * flat={true}   →  mobile bottom-sheet   (no card, no header, no section px)
 */
export default function PropertyFilters({ filters, setFilters, onClose, count, flat = false }) {
  const { t } = useTranslation();

  const ROOMS = ['', '1', '2', '3', '4', '5'];

  const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const changeRentalPeriod = val =>
    setFilters(prev => ({ ...prev, rentalPeriod: val, minPrice: '', maxPrice: '' }));
  const reset = () =>
    setFilters({ q: '', city: '', type: '', purpose: '', status: '',
      minPrice: '', maxPrice: '', minRooms: '', condition: '', rentalPeriod: '' });

  const hasActive        = Object.values(filters).some(v => v !== '');
  const showCondition    = filters.purpose === 'VENTE'    || filters.purpose === '';
  const showRentalPeriod = filters.purpose === 'LOCATION' || filters.purpose === '';

  /* ── All filter sections ─────────────────────────────────────────────── */
  const filterContent = (
    <div className="divide-y divide-neutral-100">

      {/* Search */}
      <Section flat={flat}>
        <div className="relative">
          <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder={t('filters.placeholder')}
            value={filters.q}
            onChange={e => update('q', e.target.value)}
            style={{ fontSize: '16px' }}
            className="w-full h-11 ps-9 pe-3 rounded-xl border border-neutral-200 bg-neutral-50
              focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
          />
        </div>
      </Section>

      {/* Purpose */}
      <Section flat={flat} label={t('filters.operation')}>
        <div className="flex gap-1.5">
          {['', ...PURPOSES].map(p => (
            <Pill key={p} active={filters.purpose === p}
              onClick={() => setFilters(prev => ({
                ...prev, purpose: p, condition: '', rentalPeriod: '', minPrice: '', maxPrice: '',
              }))}>
              {p ? t(`common.purpose.${p}`) : t('common.purpose.all')}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Condition */}
      {showCondition && (
        <Section flat={flat} label={t('filters.condition')}>
          <div className="flex gap-1.5">
            {[
              { val: '',         label: t('filters.conditionAll') },
              { val: 'neuf',     label: t('filters.conditionNew')  },
              { val: 'occasion', label: t('filters.conditionUsed') },
            ].map(({ val, label }) => (
              <Pill key={val} active={filters.condition === val} onClick={() => update('condition', val)}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>
      )}

      {/* Rental period */}
      {showRentalPeriod && (
        <Section flat={flat} label={t('filters.rentalPeriod')}>
          <div className="flex gap-1.5">
            {[
              { val: '',     label: t('filters.periodAll')   },
              { val: 'mois', label: t('filters.periodMonth') },
              { val: 'jour', label: t('filters.periodDay')   },
            ].map(({ val, label }) => (
              <Pill key={val} active={filters.rentalPeriod === val} onClick={() => changeRentalPeriod(val)}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>
      )}

      {/* City */}
      <Section flat={flat} label={t('filters.city')}>
        <Sel value={filters.city} onChange={e => update('city', e.target.value)}>
          <option value="">{t('filters.allCities')}</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </Sel>
      </Section>

      {/* Type */}
      <Section flat={flat} label={t('filters.type')}>
        <Sel value={filters.type} onChange={e => update('type', e.target.value)}>
          <option value="">{t('filters.allTypes')}</option>
          {TYPES.map(tp => <option key={tp} value={tp}>{t(`common.type.${tp}`, tp)}</option>)}
        </Sel>
      </Section>

      {/* Price range — Min / Max inputs */}
      <Section flat={flat} label={t('filters.price')}>
        <div className="flex gap-2">
          <PriceInput
            placeholder="Min"
            value={filters.minPrice}
            onChange={val => update('minPrice', val)}
            currency={t('common.currency')}
          />
          <PriceInput
            placeholder="Max"
            value={filters.maxPrice}
            onChange={val => update('maxPrice', val)}
            currency={t('common.currency')}
          />
        </div>
      </Section>

      {/* Min rooms */}
      <Section flat={flat} label={t('filters.rooms')}>
        <div className="grid grid-cols-6 gap-1.5">
          {ROOMS.map(r => (
            <Btn key={r} active={filters.minRooms === r} onClick={() => update('minRooms', r)}>
              {r === '' ? t('filters.allRooms') : `${r}+`}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Status */}
      <Section flat={flat} label={t('filters.status')}>
        <div className="space-y-1.5">
          <Btn active={filters.status === ''} onClick={() => update('status', '')} className="w-full">
            {t('filters.allStatuses')}
          </Btn>
          <div className="grid grid-cols-3 gap-1.5">
            {STATUSES.map(s => (
              <Btn key={s} active={filters.status === s} onClick={() => update('status', s)}>
                {t(`common.status.${s}`)}
              </Btn>
            ))}
          </div>
        </div>
      </Section>

    </div>
  );

  /* ── FLAT MODE ──────────────────────────────────────────────────────── */
  if (flat) {
    return (
      <div className="text-xs">
        {filterContent}
        {count !== undefined && (
          <p className="py-3 text-center text-[11px] text-neutral-400">
            <span className="text-primary font-bold">{count}</span>{' '}
            {t('search.resultsCount', { count })}
          </p>
        )}
      </div>
    );
  }

  /* ── CARD MODE — desktop sticky sidebar ─────────────────────────────── */
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm text-xs overflow-hidden">

      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <span className="font-bold text-neutral-700 flex items-center gap-1.5 text-xs">
          <SlidersHorizontal size={13} className="text-primary" />
          {t('filters.title')}
          {hasActive && <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
        </span>
        <div className="flex items-center gap-2">
          {hasActive && (
            <button type="button" onClick={reset}
              className="text-[11px] text-primary font-semibold hover:underline">
              {t('filters.clearAll')}
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose}
              className="lg:hidden p-1 rounded hover:bg-neutral-100 text-neutral-400">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filterContent}

      {count !== undefined && (
        <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 text-center">
          <p className="text-[11px] text-neutral-400">
            <span className="text-primary font-bold">{count}</span>{' '}
            {t('search.resultsCount', { count })}
          </p>
        </div>
      )}
    </div>
  );
}
