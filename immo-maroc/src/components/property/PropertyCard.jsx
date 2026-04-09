import { Link } from 'react-router-dom';
import { BedDouble, Bath, Maximize2, MapPin, Phone, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../../api/properties';

const STATUS_STYLES = {
  DISPONIBLE: 'badge-green', Disponible: 'badge-green',
  VENDU:      'badge-red',   Vendu:      'badge-red',
  LOUE:       'badge-amber', Loué:       'badge-amber',
};

/* ── Diagonal ribbon config ─────────────────────────────────────────────── */
const RIBBON_BG = {
  VENDU: '#dc2626',   // red-600
  LOUE:  '#7c3aed',   // violet-700
};

function StatusRibbon({ status, label }) {
  const bg = RIBBON_BG[status];
  if (!bg || !label) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: -34,
        width: 130,
        transform: 'rotate(45deg)',
        backgroundColor: bg,
        color: '#fff',
        textAlign: 'center',
        padding: '5px 0',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.12em',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        userSelect: 'none',
        pointerEvents: 'none',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}

export default function PropertyCard({ property, compact = false }) {
  const { t } = useTranslation();
  const agent = property.agent ?? null;
  const isSoldOrRented = property.status === 'VENDU' || property.status === 'LOUE';

  const formatPrice = (price, purpose, subPurpose) => {
    const p = price || 0;
    const currency = t('common.currency');
    if (purpose === 'Location' || purpose === 'LOCATION') {
      const suffix = subPurpose === 'COURT_TERME' ? '/jour' : '/mois';
      return `${p.toLocaleString('fr-MA')} ${currency}${suffix}`;
    }
    return `${p.toLocaleString('fr-MA')} ${currency}`;
  };

  return (
    <div className={`card group ${compact ? '' : ''}`} style={{ position: 'relative' }}>
      {/* Image */}
      <div
        className={`relative overflow-hidden ${compact ? 'h-[160px] sm:h-[180px]' : 'h-[180px] sm:h-[220px]'}`}
        style={{ overflow: 'hidden' }}
      >
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          style={{
            transition: 'transform 0.5s ease',
            filter: isSoldOrRented ? 'brightness(0.88)' : 'none',
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* ── Diagonal ribbon (VENDU / LOUÉ) — label from i18n ── */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, overflow: 'hidden', zIndex: 10 }}>
          <StatusRibbon
            status={property.status}
            label={t(`common.status.${property.status}`, property.status)}
          />
        </div>

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          <span className={`badge text-xs font-semibold ${(property.purpose === 'Vente' || property.purpose === 'VENTE') ? 'bg-primary text-white' : 'bg-accent text-white'}`}>
            {t(`common.purpose.${property.purpose}`, property.purpose)}
          </span>
          {!isSoldOrRented && (
            <span className={STATUS_STYLES[property.status] || 'badge-gray'}>
              {t(`common.status.${property.status}`)}
            </span>
          )}
          {property.featured && (
            <span className="badge text-xs font-semibold bg-amber-400 text-white flex items-center gap-1">
              <Star size={10} fill="white" /> Premium
            </span>
          )}
        </div>

        {/* Bottom price */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-bold text-lg leading-none">
            {formatPrice(property.price, property.purpose, property.subPurpose)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4" style={{ opacity: isSoldOrRented ? 0.85 : 1 }}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <Link
            to={`/propriete/${property.id}`}
            className="font-semibold text-neutral-900 hover:text-primary transition-colors line-clamp-2 text-sm leading-snug"
          >
            {property.title}
          </Link>
        </div>

        <div className="flex items-center gap-1 text-neutral-400 text-xs mb-3">
          <MapPin size={11} />
          <span>{property.neighborhood}, {property.city}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 py-3 border-t border-neutral-100 text-neutral-500 text-xs">
          {property.rooms > 0 && (
            <div className="flex items-center gap-1">
              <BedDouble size={13} />
              <span>{property.rooms} {t('property.chBed')}</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={13} />
              <span>{property.bathrooms} {t('property.chBath')}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize2 size={13} />
            <span>{property.area} m²</span>
          </div>
        </div>

        {/* Agent row */}
        {agent && !compact && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <img src={getAvatarUrl(agent.avatar)} alt={agent.name}
                className="w-6 h-6 rounded-full object-cover" />
              <span className="text-xs text-neutral-400">{agent.name}</span>
            </div>
            <a
              href={`tel:${agent.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent transition-colors"
            >
              <Phone size={11} /> {t('card.call')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
