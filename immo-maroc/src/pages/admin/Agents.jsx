import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Phone, MessageSquare, Search, CheckCircle2, XCircle, Shield, UserPlus, Pencil, Users, Star, Trash2, KeyRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllAgentsAdmin, toggleAgentStatus, deleteAgent, resetAgentPassword } from '../../api/agents';
import { getAvatarUrl } from '../../api/properties';
import Spinner from '../../components/common/Spinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function AdminAgents() {
  const { t, i18n } = useTranslation();
  const [q, setQ]                   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [agents, setAgents]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [toggling, setToggling]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [resetting, setResetting]   = useState(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(''),4000); };

  const fetchAgents = useCallback(()=>{
    setLoading(true); setError('');
    getAllAgentsAdmin()
      .then(data=>{ const list=data?.content??(Array.isArray(data)?data:[]); setAgents(list); })
      .catch(err=>setError(err.message))
      .finally(()=>setLoading(false));
  },[i18n.language]);

  useEffect(()=>{ fetchAgents(); },[fetchAgents]);
  useAutoRefresh(fetchAgents);

  const isActive = (agent) => (agent.status||'').toUpperCase()==='ACTIVE';

  const handleToggleStatus = async(agentId)=>{
    setToggling(agentId);
    try {
      await toggleAgentStatus(agentId);
      setAgents(prev=>prev.map(a=>{ if(a.id!==agentId) return a; return {...a,status:isActive(a)?'INACTIVE':'ACTIVE'}; }));
    } catch{}
    setToggling(null);
  };
  const handleDelete = async()=>{
    if(!deleteTarget) return;
    setDeleting(true);
    try { await deleteAgent(deleteTarget.id); setAgents(prev=>prev.filter(a=>a.id!==deleteTarget.id)); setDeleteTarget(null); showToast('Agent supprimé avec succès.'); }
    catch { showToast('Erreur lors de la suppression.'); }
    finally { setDeleting(false); }
  };
  const handleResetPassword = async(agent)=>{
    setResetting(agent.id);
    try { await resetAgentPassword(agent.id); showToast(`Nouveau mot de passe envoyé à ${agent.email||agent.name}.`); }
    catch { showToast('Erreur lors de la réinitialisation.'); }
    finally { setResetting(null); }
  };

  const filtered = agents
    .filter(a=>!filterStatus||(filterStatus==='active'?isActive(a):!isActive(a)))
    .filter(a=>!q||a.name?.toLowerCase().includes(q.toLowerCase())||a.agency?.toLowerCase().includes(q.toLowerCase())||a.city?.toLowerCase().includes(q.toLowerCase()));

  const activeCount   = agents.filter(isActive).length;
  const inactiveCount = agents.filter(a=>!isActive(a)).length;
  const verifiedCount = agents.filter(a=>a.verified).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg"/></div>;
  if (error)   return <ErrorMessage message={error} onRetry={fetchAgents}/>;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Toast */}
      {toast&&createPortal(
        <div className="fixed top-4 right-4 z-[9999] bg-neutral-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0"/>{toast}
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Gestion des agents</h1>
          <p className="text-neutral-500 dark:text-slate-400 text-sm mt-0.5">{agents.length} agent{agents.length!==1?'s':''} enregistré{agents.length!==1?'s':''}</p>
        </div>
        <Link to="/admin/agents/creer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors self-start sm:self-auto shadow-sm">
          <UserPlus size={16}/>{t('admin.createAgent.title')}
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Actifs',   value:activeCount,   icon:CheckCircle2, color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/30',  ring:'ring-emerald-200 dark:ring-emerald-800', filterVal:'active'   },
          { label:'Inactifs', value:inactiveCount, icon:XCircle,      color:'text-neutral-500 dark:text-slate-400',   bg:'bg-neutral-100 dark:bg-slate-800',       ring:'ring-neutral-200 dark:ring-slate-700',  filterVal:'inactive' },
          { label:'Vérifiés', value:verifiedCount, icon:Star,         color:'text-blue-600 dark:text-blue-400',       bg:'bg-blue-50 dark:bg-blue-900/30',          ring:'ring-blue-200 dark:ring-blue-800',      filterVal:''         },
        ].map(({label,value,icon:Icon,color,bg,ring,filterVal})=>(
          <button key={label} onClick={()=>setFilterStatus(prev=>prev===filterVal?'':filterVal)}
            className={`rounded-2xl p-3 sm:p-4 text-left transition-all ring-1 ${bg} ${ring} ${filterStatus===filterVal&&filterVal?'ring-2':''}`}>
            <div className={`flex items-center gap-2 mb-1 ${color}`}>
              <Icon size={15}/>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-800 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500"/>
          <input type="text" style={{fontSize:'16px'}}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all"
            placeholder="Nom, agence, ville…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <select style={{fontSize:'16px'}}
          className="h-10 px-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm dark:text-slate-200 focus:outline-none focus:border-primary appearance-none pr-8 text-neutral-600"
          value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
        {(q||filterStatus)&&(
          <button onClick={()=>{setQ('');setFilterStatus('');}}
            className="h-10 px-3 rounded-xl text-xs font-medium text-neutral-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-neutral-200 dark:border-slate-700">
            Réinitialiser
          </button>
        )}
        <span className="text-xs text-neutral-400 dark:text-slate-500 ml-auto">{filtered.length} résultat{filtered.length!==1?'s':''}</span>
      </div>

      {/* Agents grid */}
      {filtered.length===0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 p-16 text-center">
          <Users size={40} className="mx-auto mb-3 text-neutral-200 dark:text-slate-700"/>
          <p className="font-semibold text-neutral-700 dark:text-slate-300">Aucun agent trouvé</p>
          <p className="text-sm text-neutral-400 dark:text-slate-500 mt-1">Modifiez vos filtres ou créez un nouvel agent</p>
        </div>
      ):(
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(agent=>(
            <div key={agent.id} className="relative bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 overflow-hidden hover:shadow-md dark:hover:shadow-slate-900 transition-shadow group/card">
              {/* Delete X */}
              <button onClick={()=>setDeleteTarget({id:agent.id,name:agent.name})} title="Supprimer l'agent"
                className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-300 dark:text-slate-500 hover:bg-red-500 hover:border-red-500 hover:text-white flex items-center justify-center shadow-sm transition-all duration-150 opacity-0 group-hover/card:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Header */}
              <div className="px-5 pt-5 pb-4 flex items-start gap-4">
                <div className="relative shrink-0">
                  <img src={getAvatarUrl(agent.avatar)} alt="" className="w-14 h-14 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-slate-700"/>
                  {agent.verified&&(
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                      <CheckCircle2 size={11} className="text-white"/>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 dark:text-white text-sm truncate">{agent.name}</p>
                      <p className="text-neutral-500 dark:text-slate-400 text-xs truncate">{agent.agency}</p>
                      <p className="text-neutral-400 dark:text-slate-500 text-xs">{agent.city}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isActive(agent)?'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400':'bg-neutral-100 dark:bg-slate-700 text-neutral-500 dark:text-slate-400'}`}>
                        {isActive(agent)?'Actif':'Inactif'}
                      </span>
                      {(agent.role==='ADMIN'||agent.role==='admin')&&(
                        <span className="flex items-center gap-0.5 text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                          <Shield size={8}/> Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 border-t border-neutral-100 dark:border-slate-800 divide-x divide-neutral-100 dark:divide-slate-800">
                {[{label:'Annonces',value:agent.listingCount??agent.listings??0},{label:'Ventes',value:agent.sold??0},{label:'Note',value:agent.rating?`★ ${agent.rating}`:'—'}].map(({label,value})=>(
                  <div key={label} className="text-center py-3">
                    <p className="font-bold text-neutral-800 dark:text-slate-100 text-sm">{value}</p>
                    <p className="text-neutral-400 dark:text-slate-500 text-[10px] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Specialties */}
              {agent.specialties?.length>0&&(
                <div className="px-5 py-3 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {agent.specialties.map(s=>(
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-primary/5 text-primary/80 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-slate-800 flex flex-wrap gap-2">
                <a href={`tel:${agent.phone}`} className="flex-1 min-w-[56px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors">
                  <Phone size={12}/> Appel
                </a>
                <a href={`https://wa.me/${(agent.whatsapp||agent.phone||'').replace(/\s+/g,'').replace('+','')}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 min-w-[56px] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                  <MessageSquare size={12}/> WA
                </a>
                <Link to={`/admin/agents/modifier/${agent.id}`} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Pencil size={12}/> Modifier
                </Link>
                <button onClick={()=>handleResetPassword(agent)} disabled={resetting===agent.id}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-60" title="Réinitialiser le mot de passe">
                  {resetting===agent.id?<span className="w-3 h-3 border-2 border-amber-400/40 border-t-amber-600 rounded-full animate-spin"/>:<KeyRound size={12}/>}
                  MDP
                </button>
                <button onClick={()=>handleToggleStatus(agent.id)} disabled={toggling===agent.id}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-60 ${isActive(agent)?'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50':'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'}`}>
                  {isActive(agent)?<><XCircle size={12}/> Désactiver</>:<><CheckCircle2 size={12}/> Activer</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget&&createPortal(
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>!deleting&&setDeleteTarget(null)}/>
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10 border border-neutral-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center mb-4">
              <Trash2 size={20} className="text-red-500 dark:text-red-400"/>
            </div>
            <h3 className="font-bold text-neutral-900 dark:text-white mb-1">Supprimer l'agent ?</h3>
            <p className="text-neutral-500 dark:text-slate-400 text-sm mb-1">
              <span className="font-semibold text-neutral-700 dark:text-slate-200">{deleteTarget.name}</span> sera définitivement supprimé.
            </p>
            <p className="text-neutral-400 dark:text-slate-500 text-xs mb-6">Toutes ses annonces et données associées seront également supprimées.</p>
            <div className="flex gap-3">
              <button disabled={deleting} onClick={()=>setDeleteTarget(null)}
                className="flex-1 h-10 rounded-xl border border-neutral-200 dark:border-slate-700 text-sm font-medium text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
                Annuler
              </button>
              <button disabled={deleting} onClick={handleDelete}
                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting&&<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
                Supprimer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
