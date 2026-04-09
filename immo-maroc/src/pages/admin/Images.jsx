import { useState, useCallback, useEffect, useRef } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { listImages, deleteImage, bulkDeleteImages } from '../../api/images';
import { API_BASE_URL } from '../../api/client';
import {
  Image, Trash2, RefreshCw, AlertTriangle, CheckCircle2,
  Search, Loader2, X, CheckSquare, Square,
  Link2, Unlink, Clock, HardDrive, ZoomIn,
} from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function daysSince(str) {
  if (!str) return 0;
  return Math.floor((Date.now() - new Date(str).getTime()) / 86_400_000);
}

function fullUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
}

/* ─── Confirm Dialog ─────────────────────────────────────────────────────── */

function ConfirmDialog({ open, count, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          Supprimer {count > 1 ? `${count} images` : 'cette image'} ?
        </h3>
        <p className="text-sm text-neutral-500 mb-7">
          Cette action est <span className="font-semibold text-red-600">irréversible</span>.
          {count > 1
            ? ` Les ${count} fichiers seront définitivement supprimés du serveur.`
            : ' Le fichier sera définitivement supprimé du serveur.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-11 rounded-2xl border border-neutral-200 text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-11 rounded-2xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Suppression…</>
              : <><Trash2 size={15} /> Supprimer définitivement</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Image Lightbox ─────────────────────────────────────────────────────── */

function Lightbox({ image, onClose }) {
  if (!image) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <img
          src={fullUrl(image.url)}
          alt={image.filename}
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg text-neutral-700 hover:text-neutral-900 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-2xl px-4 py-3 text-white text-xs flex items-center justify-between">
          <span className="truncate font-mono">{image.filename}</span>
          <span className="ml-4 shrink-0">{fmtSize(image.sizeBytes)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Image Card ─────────────────────────────────────────────────────────── */

function ImageCard({ image, selected, onSelect, onDelete, onPreview }) {
  const days = daysSince(image.uploadedAt);
  const isOld = days > 30;

  return (
    <div
      className={`group relative bg-white rounded-2xl border overflow-hidden transition-all ${
        selected
          ? 'border-primary ring-2 ring-primary/30 shadow-md'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden cursor-pointer" onClick={() => onPreview(image)}>
        <img
          src={fullUrl(image.url)}
          alt={image.filename}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23f3f4f6" width="200" height="150"/><text x="100" y="80" text-anchor="middle" fill="%23d1d5db" font-size="12">Image introuvable</text></svg>'; }}
        />

        {/* Zoom overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>

        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onSelect(image.filename); }}
          className="absolute top-2 left-2 z-10 transition-all"
        >
          {selected
            ? <CheckSquare size={20} className="text-primary drop-shadow" />
            : <Square size={20} className="text-white/80 opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
          }
        </button>

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          {image.linked ? (
            <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Link2 size={9} /> Utilisée
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Unlink size={9} /> Orpheline
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs font-mono text-neutral-500 truncate mb-2" title={image.filename}>
          {image.filename}
        </p>
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1"><HardDrive size={10} /> {fmtSize(image.sizeBytes)}</span>
          <span className={`flex items-center gap-1 ${isOld && !image.linked ? 'text-orange-500 font-medium' : ''}`}>
            <Clock size={10} />
            {days === 0 ? "Aujourd'hui" : `${days}j`}
          </span>
        </div>

        {image.linkedTo && (
          <div className="mt-2">
            {image.linkedTo.split(',').map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mr-1">
                {t === 'property' ? '🏠 Annonce' : '👤 Agent'}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => onDelete(image)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
        >
          <Trash2 size={12} /> Supprimer
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

const AGE_FILTERS = [
  { label: 'Toutes', value: 0 },
  { label: '> 7 jours', value: 7 },
  { label: '> 30 jours', value: 30 },
  { label: '> 90 jours', value: 90 },
];

export default function AdminImages() {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [orphanOnly, setOrphanOnly] = useState(false);
  const [ageFilter, setAgeFilter] = useState(0);
  const [selected, setSelected]   = useState(new Set());
  const [preview, setPreview]     = useState(null);
  const [confirm, setConfirm]     = useState(null); // { filenames: string[], count: number }
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState(null); // { type, text }
  const toastTimer = useRef(null);

  /* ── Fetch ── */
  const fetchImages = useCallback(() => {
    setLoading(true);
    setError('');
    listImages(orphanOnly)
      .then(data => setImages(Array.isArray(data) ? data : []))
      .catch(err => setError(err?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [orphanOnly]);

  useEffect(() => { fetchImages(); }, [fetchImages]);
  useAutoRefresh(fetchImages, 60_000);

  /* ── Toast ── */
  const showToast = (type, text) => {
    clearTimeout(toastTimer.current);
    setToast({ type, text });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  /* ── Filtered list ── */
  const filtered = images.filter(img => {
    if (search && !img.filename.toLowerCase().includes(search.toLowerCase())) return false;
    if (ageFilter > 0 && daysSince(img.uploadedAt) <= ageFilter) return false;
    return true;
  });

  /* ── Stats ── */
  const orphanCount  = images.filter(i => !i.linked).length;
  const linkedCount  = images.filter(i => i.linked).length;
  const totalSize    = images.reduce((s, i) => s + (i.sizeBytes || 0), 0);
  const orphanSize   = images.filter(i => !i.linked).reduce((s, i) => s + (i.sizeBytes || 0), 0);

  /* ── Selection ── */
  const toggleSelect = (filename) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(filename) ? next.delete(filename) : next.add(filename);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => i.filename)));
    }
  };

  /* ── Delete flow ── */
  const requestDelete = (imageOrNull) => {
    if (imageOrNull) {
      setConfirm({ filenames: [imageOrNull.filename], count: 1 });
    } else {
      // bulk
      setConfirm({ filenames: [...selected], count: selected.size });
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.filenames.length === 1) {
        await deleteImage(confirm.filenames[0]);
      } else {
        await bulkDeleteImages(confirm.filenames);
      }
      setImages(prev => prev.filter(i => !confirm.filenames.includes(i.filename)));
      setSelected(prev => {
        const next = new Set(prev);
        confirm.filenames.forEach(f => next.delete(f));
        return next;
      });
      showToast('success', `${confirm.count} image${confirm.count > 1 ? 's' : ''} supprimée${confirm.count > 1 ? 's' : ''} définitivement.`);
    } catch (err) {
      showToast('error', err?.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  };

  /* ── Render ── */
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestion des images</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {images.length} fichier{images.length !== 1 ? 's' : ''} · {fmtSize(totalSize)} utilisés
          </p>
        </div>
        <button
          onClick={fetchImages}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: images.length,  sub: fmtSize(totalSize),   icon: Image,    color: 'text-blue-600',   bg: 'bg-blue-50',   ring: 'ring-blue-200'   },
          { label: 'Utilisées', value: linkedCount,    sub: 'liées à annonce/agent', icon: Link2, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
          { label: 'Orphelines',value: orphanCount,    sub: fmtSize(orphanSize),  icon: Unlink,  color: 'text-amber-600',  bg: 'bg-amber-50',  ring: 'ring-amber-200'  },
          { label: 'Sélection', value: selected.size,  sub: selected.size ? `${fmtSize([...selected].reduce((s,f) => s + (images.find(i=>i.filename===f)?.sizeBytes||0),0))}` : '—', icon: CheckSquare, color: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-200' },
        ].map(({ label, value, sub, icon: Icon, color, bg, ring }) => (
          <div key={label} className={`rounded-2xl p-4 ring-1 ${bg} ${ring}`}>
            <div className={`flex items-center gap-2 mb-1 ${color}`}>
              <Icon size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-neutral-200 bg-neutral-50 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all"
            placeholder="Rechercher par nom de fichier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Orphan toggle */}
        <button
          onClick={() => setOrphanOnly(v => !v)}
          className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-all ${
            orphanOnly
              ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-300'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
          }`}
        >
          <Unlink size={14} />
          Orphelines uniquement
        </button>

        {/* Age filter */}
        <div className="flex gap-1.5">
          {AGE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setAgeFilter(f.value)}
              className={`flex items-center gap-1 h-10 px-3 rounded-xl border text-xs font-medium transition-all ${
                ageFilter === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Clock size={11} />
              {f.label}
            </button>
          ))}
        </div>

        {(search || orphanOnly || ageFilter > 0) && (
          <button
            onClick={() => { setSearch(''); setOrphanOnly(false); setAgeFilter(0); }}
            className="h-10 px-3 rounded-xl border border-neutral-200 text-xs text-neutral-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            Réinitialiser
          </button>
        )}

        <span className="text-xs text-neutral-400 ml-auto">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Bulk action bar ── */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-neutral-600 hover:text-primary transition-colors font-medium">
            {selected.size === filtered.length && filtered.length > 0
              ? <><CheckSquare size={16} className="text-primary" /> Désélectionner tout</>
              : <><Square size={16} /> Sélectionner tout ({filtered.length})</>
            }
          </button>
          {selected.size > 0 && (
            <button
              onClick={() => requestDelete(null)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash2 size={14} />
              Supprimer {selected.size} sélectionnée{selected.size > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-neutral-400">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm">Analyse du stockage…</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={fetchImages} className="flex items-center gap-1.5 text-xs text-red-600 underline">
            <RefreshCw size={13} /> Réessayer
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-16 text-center">
          <Image size={48} className="mx-auto mb-4 text-neutral-200" />
          <p className="font-semibold text-neutral-700">Aucune image trouvée</p>
          <p className="text-sm text-neutral-400 mt-1">Modifiez vos filtres pour afficher plus de résultats</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(img => (
            <ImageCard
              key={img.filename}
              image={img}
              selected={selected.has(img.filename)}
              onSelect={toggleSelect}
              onDelete={requestDelete}
              onPreview={setPreview}
            />
          ))}
        </div>
      )}

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={!!confirm}
        count={confirm?.count || 0}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setConfirm(null)}
        loading={deleting}
      />

      <Lightbox image={preview} onClose={() => setPreview(null)} />

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} />
            : <AlertTriangle size={16} />
          }
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
