import { useState, useCallback, useEffect } from 'react';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { getAllLeads, updateLeadStatus } from '../../api/leads';
import { getAllAgentsAdmin } from '../../api/agents';
import {
  Search, Phone, Mail, MessageSquare, Building2, User,
  Clock, CheckCircle, XCircle, Star, Loader2, AlertCircle,
  RefreshCw, ChevronRight,
} from 'lucide-react';

const STATUSES = ['NOUVEAU','CONTACTED','QUALIFIED','CLOSED_WON','CLOSED_LOST'];

const STATUS_CONFIG = {
  NOUVEAU:     { label:'Nouveau',  color:'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-400',   dot:'bg-blue-500'   },
  CONTACTED:   { label:'Contacté', color:'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400', dot:'bg-orange-500' },
  QUALIFIED:   { label:'Qualifié', color:'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400', dot:'bg-yellow-500' },
  CLOSED_WON:  { label:'Conclu',   color:'bg-green-100  dark:bg-green-900/40  text-green-700  dark:text-green-400',  dot:'bg-green-500'  },
  CLOSED_LOST: { label:'Perdu',    color:'bg-red-100    dark:bg-red-900/40    text-red-700    dark:text-red-400',    dot:'bg-red-500'    },
};

const KPI_STATUS = [
  { key:'NOUVEAU',     label:'Nouveaux',  icon:Clock,       color:'text-blue-600   dark:text-blue-400',   bg:'bg-blue-50   dark:bg-blue-900/30',   ring:'ring-blue-200   dark:ring-blue-800'   },
  { key:'CONTACTED',   label:'Contactés', icon:Phone,       color:'text-orange-600 dark:text-orange-400', bg:'bg-orange-50 dark:bg-orange-900/30', ring:'ring-orange-200 dark:ring-orange-800' },
  { key:'QUALIFIED',   label:'Qualifiés', icon:Star,        color:'text-yellow-600 dark:text-yellow-400', bg:'bg-yellow-50 dark:bg-yellow-900/30', ring:'ring-yellow-200 dark:ring-yellow-800' },
  { key:'CLOSED_WON',  label:'Conclus',   icon:CheckCircle, color:'text-green-600  dark:text-green-400',  bg:'bg-green-50  dark:bg-green-900/30',  ring:'ring-green-200  dark:ring-green-800'  },
  { key:'CLOSED_LOST', label:'Perdus',    icon:XCircle,     color:'text-red-600    dark:text-red-400',    bg:'bg-red-50    dark:bg-red-900/30',    ring:'ring-red-200    dark:ring-red-800'    },
];

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'});
}
function getInitial(name) { return (name||'?').charAt(0).toUpperCase(); }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]||{label:status,color:'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-400',dot:'bg-neutral-400'};
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

function LeadRow({ lead, selected, onClick }) {
  return (
    <tr onClick={()=>onClick(lead)}
      className={`border-b border-neutral-100 dark:border-slate-800 cursor-pointer transition-colors ${selected?'bg-primary/5 dark:bg-primary/10':'hover:bg-neutral-50 dark:hover:bg-slate-800/60'}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${STATUS_CONFIG[lead.status]?.color||'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-400'}`}>
            {getInitial(lead.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{lead.name}</p>
            <p className="text-xs text-neutral-400 dark:text-slate-500 truncate">{lead.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-slate-400">
          <Building2 size={12} className="text-neutral-400 dark:text-slate-500 shrink-0"/>
          <span className="truncate max-w-[140px]">{lead.propertyTitle||'—'}</span>
        </div>
        {lead.propertyCity&&<p className="text-xs text-neutral-400 dark:text-slate-500 mt-0.5 pl-[18px]">{lead.propertyCity}</p>}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-slate-400">
          <User size={12} className="text-neutral-400 dark:text-slate-500 shrink-0"/>
          <span>{lead.agentName||'—'}</span>
        </div>
      </td>
      <td className="px-4 py-3"><StatusBadge status={lead.status}/></td>
      <td className="px-4 py-3 hidden lg:table-cell text-xs text-neutral-400 dark:text-slate-500">{formatDate(lead.createdAt)}</td>
      <td className="px-4 py-3"><ChevronRight size={14} className="text-neutral-300 dark:text-slate-600 ml-auto"/></td>
    </tr>
  );
}

function LeadDetail({ lead, onClose, onStatusChange, updating }) {
  if (!lead) return null;
  const cfg = STATUS_CONFIG[lead.status]||{};
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <div className="p-5 border-b border-neutral-100 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${cfg.color||'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-400'}`}>
            {getInitial(lead.name)}
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-white">{lead.name}</p>
            <StatusBadge status={lead.status}/>
          </div>
        </div>
        <button onClick={onClose} className="text-neutral-400 dark:text-slate-500 hover:text-neutral-700 dark:hover:text-slate-200 text-xl leading-none mt-0.5">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest">Contact</p>
          <a href={`tel:${lead.phone}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors text-sm text-neutral-700 dark:text-slate-300">
            <Phone size={14} className="text-primary"/> {lead.phone||'—'}
          </a>
          <a href={`mailto:${lead.email}`} className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors text-sm text-neutral-700 dark:text-slate-300">
            <Mail size={14} className="text-primary"/> {lead.email||'—'}
          </a>
        </div>

        {lead.propertyTitle&&(
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest">Bien concerné</p>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 text-sm text-neutral-700 dark:text-slate-300">
              <Building2 size={14} className="text-primary"/>
              <div>
                <p className="font-medium">{lead.propertyTitle}</p>
                {lead.propertyCity&&<p className="text-xs text-neutral-400 dark:text-slate-500">{lead.propertyCity}</p>}
              </div>
            </div>
          </div>
        )}

        {lead.agentName&&(
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest">Agent responsable</p>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-700 dark:text-slate-300">
              <User size={14} className="text-primary"/>
              <span className="font-medium">{lead.agentName}</span>
            </div>
          </div>
        )}

        {lead.message&&(
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest">Message</p>
            <div className="flex gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-600 dark:text-slate-400">
              <MessageSquare size={14} className="text-neutral-400 dark:text-slate-500 mt-0.5 shrink-0"/>
              <p className="leading-relaxed">{lead.message}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-neutral-400 dark:text-slate-500 flex items-center gap-1.5">
          <Clock size={11}/> Reçu le {formatDate(lead.createdAt)}
        </p>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest">Changer le statut</p>
          <div className="grid grid-cols-1 gap-1.5">
            {STATUSES.map(s=>{
              const c=STATUS_CONFIG[s];
              const isActive=lead.status===s;
              return (
                <button key={s} disabled={isActive||updating} onClick={()=>onStatusChange(s)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive?`${c.color} ring-1 ring-current/30 cursor-default`:'text-neutral-600 dark:text-slate-400 bg-neutral-50 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700'} disabled:opacity-60`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`}/>
                  {c.label}
                  {isActive&&<CheckCircle size={13} className="ml-auto"/>}
                  {updating&&isActive&&<Loader2 size={13} className="ml-auto animate-spin"/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLeads() {
  const [leads, setLeads]               = useState([]);
  const [agents, setAgents]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [agentFilter, setAgentFilter]   = useState('');
  const [searchQ, setSearchQ]           = useState('');
  const [updating, setUpdating]         = useState(false);

  const fetchLeads = useCallback(()=>{
    setLoading(true); setError('');
    Promise.all([getAllLeads(), getAllAgentsAdmin()])
      .then(([leadsData,agentsData])=>{
        const list=Array.isArray(leadsData)?leadsData:(leadsData?.content??[]);
        setLeads(list);
        setAgents(Array.isArray(agentsData)?agentsData:(agentsData?.content??[]));
        setSelectedLead(prev=>prev?(list.find(l=>l.id===prev.id)??null):null);
      })
      .catch(err=>setError(err?.message||'Erreur lors du chargement.'))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{ fetchLeads(); },[fetchLeads]);
  useAutoRefresh(fetchLeads);

  const filtered = leads.filter(l=>{
    if(statusFilter&&l.status!==statusFilter) return false;
    if(agentFilter&&String(l.agentId)!==agentFilter) return false;
    if(searchQ){
      const q=searchQ.toLowerCase();
      if(!(l.name||'').toLowerCase().includes(q)&&!(l.email||'').toLowerCase().includes(q)&&
         !(l.phone||'').toLowerCase().includes(q)&&!(l.propertyTitle||'').toLowerCase().includes(q)&&
         !(l.agentName||'').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = STATUSES.reduce((acc,s)=>{ acc[s]=leads.filter(l=>l.status===s).length; return acc; },{});

  const handleStatusChange = async(newStatus)=>{
    if(!selectedLead||updating) return;
    setUpdating(true);
    try {
      await updateLeadStatus(selectedLead.id, newStatus);
      const updated={...selectedLead,status:newStatus};
      setSelectedLead(updated);
      setLeads(prev=>prev.map(l=>l.id===selectedLead.id?updated:l));
    } catch{}
    finally { setUpdating(false); }
  };

  const INPUT_CLS = 'w-full h-10 pl-9 pr-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm dark:text-slate-200 dark:placeholder-slate-500 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all';
  const SELECT_CLS = 'h-10 px-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm dark:text-slate-200 focus:outline-none focus:border-primary appearance-none pr-8 text-neutral-600 dark:text-slate-300';

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-neutral-400 dark:text-slate-500">
      <Loader2 size={28} className="animate-spin text-primary"/>
      <p className="text-sm">Chargement des leads…</p>
    </div>
  );

  if (error) return (
    <div className="p-4 sm:p-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm"><AlertCircle size={18}/> {error}</div>
        <button onClick={fetchLeads} className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 underline"><RefreshCw size={13}/> Réessayer</button>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">Leads</h1>
          <p className="text-neutral-500 dark:text-slate-400 text-sm mt-0.5">{leads.length} lead{leads.length!==1?'s':''} au total</p>
        </div>
        <button onClick={fetchLeads} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 text-sm text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw size={14}/> Actualiser
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {KPI_STATUS.map(({key,label,icon:Icon,color,bg,ring})=>(
          <button key={key} onClick={()=>setStatusFilter(prev=>prev===key?'':key)}
            className={`rounded-2xl p-3 sm:p-4 text-left transition-all ring-1 ${bg} ${ring} ${statusFilter===key?'ring-2':''}`}>
            <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
              <Icon size={13}/>
              <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${color}`}>{counts[key]??0}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500"/>
          <input type="text" className={INPUT_CLS} placeholder="Nom, email, bien, agent…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
        </div>
        <select className={SELECT_CLS} value={agentFilter} onChange={e=>setAgentFilter(e.target.value)}>
          <option value="">Tous les agents</option>
          {agents.map(a=><option key={a.id} value={String(a.id)}>{a.name}</option>)}
        </select>
        <select className={SELECT_CLS} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map(s=><option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        {(searchQ||statusFilter||agentFilter)&&(
          <button onClick={()=>{setSearchQ('');setStatusFilter('');setAgentFilter('');}}
            className="h-10 px-3 rounded-xl text-xs font-medium text-neutral-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-neutral-200 dark:border-slate-700">
            Réinitialiser
          </button>
        )}
        <span className="text-xs text-neutral-400 dark:text-slate-500 ml-auto">{filtered.length} résultat{filtered.length!==1?'s':''}</span>
      </div>

      {/* Table + detail panel */}
      <div className={`flex gap-4 ${selectedLead?'items-start':''}`}>
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-neutral-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {filtered.length===0 ? (
            <div className="p-12 sm:p-16 text-center">
              <MessageSquare size={40} className="mx-auto mb-3 text-neutral-200 dark:text-slate-700"/>
              <p className="font-semibold text-neutral-700 dark:text-slate-300">Aucun lead trouvé</p>
              <p className="text-sm text-neutral-400 dark:text-slate-500 mt-1">Modifiez vos filtres pour afficher plus de résultats</p>
            </div>
          ):(
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/50">
                    {['Contact','Bien','Agent','Statut','Date',''].map((h,i)=>(
                      <th key={i} className={`text-left text-xs font-semibold text-neutral-500 dark:text-slate-400 px-4 py-3 uppercase tracking-wide ${i===1?'hidden sm:table-cell':i===2?'hidden md:table-cell':i===4?'hidden lg:table-cell':''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead=>(
                    <LeadRow key={lead.id} lead={lead} selected={selectedLead?.id===lead.id} onClick={setSelectedLead}/>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedLead&&(
          <div className="w-72 sm:w-80 shrink-0 sticky top-6">
            <LeadDetail lead={selectedLead} onClose={()=>setSelectedLead(null)} onStatusChange={handleStatusChange} updating={updating}/>
          </div>
        )}
      </div>
    </div>
  );
}
