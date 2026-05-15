import { useState, useEffect, useCallback, useRef } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  searchProperties, deleteProperty, updatePropertyStatus,
  toggleFeatured, getImageUrl,
} from '../../api/properties';
import {
  Search, Star, Trash2, Eye, Edit, MoreVertical,
  ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, Loader2,
  Building2, RefreshCw,
} from 'lucide-react';

const STATUS_OPTIONS = ['DISPONIBLE', 'VENDU', 'LOUE'];
const PAGE_SIZE = 15;

const STATUS_STYLES = {
  DISPONIBLE: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  Disponible: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  VENDU:      'bg-purple-100  dark:bg-purple-900/40  text-purple-700  dark:text-purple-400',
  Vendu:      'bg-purple-100  dark:bg-purple-900/40  text-purple-700  dark:text-purple-400',
  LOUE:       'bg-teal-100    dark:bg-teal-900/40    text-teal-700    dark:text-teal-400',
  Loué:       'bg-teal-100    dark:bg-teal-900/40    text-teal-700    dark:text-teal-400',
};

const PURPOSE_STYLES = {
  VENTE:    'bg-blue-50  dark:bg-blue-900/30  text-blue-700  dark:text-blue-400',
  Vente:    'bg-blue-50  dark:bg-blue-900/30  text-blue-700  dark:text-blue-400',
  LOCATION: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  Location: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
};

const TYPE_LABELS = {
  APPARTEMENT:'Appartement', VILLA:'Villa', MAISON:'Maison', BUREAU:'Bureau',
  TERRAIN:'Terrain', COMMERCE:'Commerce', FERME:'Ferme', RIAD:'Riad',
  STUDIO:'Studio', DUPLEX:'Duplex',
};
const PURPOSE_LABELS = { VENTE:'Vente', LOCATION:'Location' };

function infoLine(p) {
  return [p.area!=null?`${p.area} m²`:null, p.rooms!=null?`${p.rooms} ch.`:null].filter(Boolean).join(' · ');
}
function formatPrice(price, currency='MAD') {
  if (!price) return '—';
  return `${Number(price).toLocaleString('fr-MA')} ${currency}`;
}
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-MA',{day:'2-digit',month:'short',year:'numeric'});
}
function getPageRange(current, total) {
  const max=5;
  if (total<=max) return Array.from({length:total},(_,i)=>i);
  let start=Math.max(0,current-Math.floor(max/2));
  const end=Math.min(total-1,start+max-1);
  if (end-start<max-1) start=Math.max(0,end-max+1);
  return Array.from({length:end-start+1},(_,i)=>start+i);
}

const INPUT = 'w-full pl-9 pr-3 py-2.5 text-sm border border-neutral-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500';
const SELECT = 'pl-3 pr-8 py-2.5 text-sm border border-neutral-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800 dark:text-slate-200 cursor-pointer';

export default function AdminListings() {
  const { t, i18n } = useTranslation();
  const navigate    = useNavigate();

  const [results, setResults]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [currentPage, setCurrentPage]     = useState(0);
  const [filters, setFilters]             = useState({ q:'', status:'', purpose:'', city:'' });
  const [sortBy, setSortBy]               = useState('recent');
  const [deleteModal, setDeleteModal]     = useState({ open:false, property:null });
  const [statusDropdown, setStatusDropdown] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg]       = useState('');
  const dropdownRef = useRef(null);

  useEffect(()=>{
    const h=(e)=>{ if(dropdownRef.current&&!dropdownRef.current.contains(e.target)) setStatusDropdown(null); };
    document.addEventListener('mousedown',h);
    return ()=>document.removeEventListener('mousedown',h);
  },[]);

  const fetchListings = useCallback(()=>{
    setLoading(true); setError('');
    const sortParam = sortBy==='price_asc'?'price_asc':sortBy==='price_desc'?'price_desc':'recent';
    const params = { page:currentPage, size:PAGE_SIZE, sortBy:sortParam };
    if(filters.q)       params.q       = filters.q;
    if(filters.status)  params.status  = filters.status;
    if(filters.purpose) params.purpose = filters.purpose;
    if(filters.city)    params.city    = filters.city;
    searchProperties(params)
      .then(data=>{ const list=data?.content??(Array.isArray(data)?data:[]); setResults(list); setTotalElements(data?.totalElements??list.length); setTotalPages(data?.totalPages??1); })
      .catch(err=>setError(err.message||'Erreur lors du chargement'))
      .finally(()=>setLoading(false));
  },[filters, currentPage, sortBy, i18n.language]);

  useEffect(()=>{ fetchListings(); },[fetchListings]);
  useAutoRefresh(fetchListings);

  const resetFilters = ()=>{ setFilters({q:'',status:'',purpose:'',city:''}); setSortBy('recent'); setCurrentPage(0); };
  const setFilter = (key,val)=>{ setFilters(prev=>({...prev,[key]:val})); setCurrentPage(0); };
  const hasFilters = filters.q||filters.status||filters.purpose||filters.city;

  const handleToggleFeatured = async(id)=>{
    try { await toggleFeatured(id); setResults(prev=>prev.map(p=>p.id===id?{...p,featured:!p.featured}:p)); } catch{}
  };
  const handleChangeStatus = async(id,status)=>{
    try { await updatePropertyStatus(id,status); setResults(prev=>prev.map(p=>p.id===id?{...p,status}:p)); } catch{}
    setStatusDropdown(null);
  };
  const handleDelete = async()=>{
    if(!deleteModal.property) return;
    setDeleteLoading(true);
    try {
      await deleteProperty(deleteModal.property.id);
      setResults(prev=>prev.filter(p=>p.id!==deleteModal.property.id));
      setTotalElements(n=>n-1);
      setDeleteModal({open:false,property:null});
      setSuccessMsg('Annonce supprimée avec succès');
      setTimeout(()=>setSuccessMsg(''),3500);
    } catch(err){ setError(err.message||'Erreur lors de la suppression'); }
    finally { setDeleteLoading(false); }
  };

  const pageRange = getPageRange(currentPage, totalPages);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-950 min-h-full space-y-4">

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle size={15} className="shrink-0"/>{successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Annonces</h1>
          <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 min-w-[2rem]">
            {totalElements}
          </span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-800 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 pointer-events-none"/>
            <input type="text" placeholder="Rechercher une annonce…" value={filters.q}
              onChange={e=>setFilter('q',e.target.value)} className={INPUT}/>
          </div>
          <select value={filters.status} onChange={e=>setFilter('status',e.target.value)} className={SELECT}>
            <option value="">Tous les statuts</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="VENDU">Vendu</option>
            <option value="LOUE">Loué</option>
          </select>
          <select value={filters.purpose} onChange={e=>setFilter('purpose',e.target.value)} className={SELECT}>
            <option value="">Tous</option>
            <option value="VENTE">Vente</option>
            <option value="LOCATION">Location</option>
          </select>
          <input type="text" placeholder="Ville…" value={filters.city}
            onChange={e=>setFilter('city',e.target.value)}
            className={`w-24 pl-3 pr-3 py-2.5 text-sm border border-neutral-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500`}
          />
          <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setCurrentPage(0);}} className={SELECT}>
            <option value="recent">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
          {hasFilters && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-slate-400 hover:text-red-500 transition-colors px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              <X size={13}/> Réinitialiser
            </button>
          )}
          <button onClick={fetchListings} className="p-2.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors" title="Actualiser">
            <RefreshCw size={15}/>
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500"/>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 m-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <AlertCircle size={18} className="text-red-500 shrink-0"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Erreur</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{error}</p>
            </div>
            <button onClick={fetchListings} className="text-xs text-red-600 dark:text-red-400 underline">Réessayer</button>
          </div>
        ) : results.length===0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 dark:text-slate-500">
            <Building2 size={48} className="mb-4 opacity-25"/>
            <p className="font-semibold text-neutral-500 dark:text-slate-400 mb-1">Aucune annonce trouvée</p>
            <p className="text-sm mb-5">Modifiez vos filtres ou ajoutez une nouvelle annonce.</p>
            {hasFilters && <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-700 underline">Réinitialiser les filtres</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800/60 border-b border-neutral-100 dark:border-slate-700">
                <tr>
                  {['#','Bien','Ville','Type','Agent','Prix','Statut','Vedette','Vues','Actions'].map(h=>(
                    <th key={h} className="text-left text-xs font-semibold text-neutral-500 dark:text-slate-400 px-4 py-3.5 first:pl-6 last:pr-6 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-slate-800">
                {results.map((p,idx)=>(
                  <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-slate-800/60 transition-colors duration-150 group">
                    <td className="px-4 py-3.5 pl-6 text-xs text-neutral-400 dark:text-slate-500 font-medium w-8">
                      {currentPage*PAGE_SIZE+idx+1}
                    </td>
                    <td className="px-4 py-3.5 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <img src={getImageUrl(p.mainImageUrl)} alt={p.title}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-neutral-100 dark:border-slate-700" loading="lazy"/>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-800 dark:text-slate-100 line-clamp-1 text-xs leading-snug max-w-[170px]">{p.title}</p>
                          <p className="text-neutral-400 dark:text-slate-500 text-[11px] mt-0.5">{[formatDate(p.createdAt),infoLine(p)].filter(Boolean).join(' · ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600 dark:text-slate-400 text-xs whitespace-nowrap">{p.city||'—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="inline-block text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300 font-medium whitespace-nowrap">
                          {TYPE_LABELS[p.type]||p.type}
                        </span>
                        {p.purpose&&(
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ${PURPOSE_STYLES[p.purpose]||'bg-neutral-50 dark:bg-slate-700 text-neutral-500 dark:text-slate-400'}`}>
                            {PURPOSE_LABELS[p.purpose]||p.purpose}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-600 dark:text-slate-400 max-w-[110px]">
                      {p.agent?.name ? <span className="truncate block max-w-[100px]" title={p.agent.name}>{p.agent.name}</span> : <span className="text-neutral-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-neutral-800 dark:text-slate-100 text-xs whitespace-nowrap">
                      {formatPrice(p.price, t('common.currency'))}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLES[p.status]||'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-400'}`}>
                        {t(`common.status.${p.status}`,p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={()=>handleToggleFeatured(p.id)} title={p.featured?'Retirer vedette':'Mettre en vedette'}
                        className={`p-1.5 rounded-lg transition-colors ${p.featured?'text-amber-500 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50':'text-neutral-300 dark:text-slate-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}>
                        <Star size={14} fill={p.featured?'currentColor':'none'}/>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500 dark:text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Eye size={11} className="text-neutral-300 dark:text-slate-600"/>
                        {(p.views||0).toLocaleString('fr-MA')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 pr-6">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>navigate(`/propriete/${p.id}`)} title="Voir" className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Eye size={14}/></button>
                        <button onClick={()=>navigate(`/agent/modifier/${p.id}`)} title="Modifier" className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Edit size={14}/></button>
                        <button onClick={()=>setDeleteModal({open:true,property:p})} title="Supprimer" className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={14}/></button>
                        <div className="relative" ref={statusDropdown===p.id?dropdownRef:null}>
                          <button onClick={()=>setStatusDropdown(statusDropdown===p.id?null:p.id)} title="Statut"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <MoreVertical size={14}/>
                          </button>
                          {statusDropdown===p.id&&(
                            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-neutral-100 dark:border-slate-700 z-20 py-1.5 overflow-hidden">
                              <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-semibold uppercase px-4 pb-1">Statut</p>
                              {STATUS_OPTIONS.map(s=>(
                                <button key={s} onClick={()=>handleChangeStatus(p.id,s)}
                                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-neutral-50 dark:hover:bg-slate-700 flex items-center gap-2 ${p.status===s?'font-semibold text-blue-600 dark:text-blue-400':'text-neutral-700 dark:text-slate-300'}`}>
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${s==='DISPONIBLE'?'bg-emerald-400':s==='VENDU'?'bg-purple-400':'bg-teal-400'}`}/>
                                  {s==='DISPONIBLE'?'Disponible':s==='VENDU'?'Vendu':'Loué'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading&&!error&&totalPages>1&&(
          <div className="border-t border-neutral-100 dark:border-slate-800 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              {currentPage*PAGE_SIZE+1}–{Math.min((currentPage+1)*PAGE_SIZE,totalElements)} sur {totalElements.toLocaleString('fr-MA')} annonce{totalElements!==1?'s':''}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={currentPage===0} onClick={()=>setCurrentPage(p=>p-1)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
                <ChevronLeft size={13}/> Préc.
              </button>
              {pageRange.map(n=>(
                <button key={n} onClick={()=>setCurrentPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${n===currentPage?'bg-blue-600 text-white shadow-sm':'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800'}`}>
                  {n+1}
                </button>
              ))}
              <button disabled={currentPage>=totalPages-1} onClick={()=>setCurrentPage(p=>p+1)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
                Suiv. <ChevronRight size={13}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteModal.open&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>!deleteLoading&&setDeleteModal({open:false,property:null})}/>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl z-10 border border-neutral-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500 dark:text-red-400"/>
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white text-base mb-1">Supprimer l'annonce</h3>
            <p className="text-neutral-500 dark:text-slate-400 text-sm mb-1">Voulez-vous supprimer définitivement :</p>
            <p className="font-medium text-neutral-800 dark:text-slate-200 text-sm mb-6 line-clamp-2">"{deleteModal.property?.title}"</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteModal({open:false,property:null})} disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-neutral-200 dark:border-slate-700 rounded-xl text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading&&<Loader2 size={14} className="animate-spin"/>}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
