import { useState, useRef, useEffect } from 'react';
import {
  Camera, Loader2, Eye, EyeOff,
  Lock, ShieldCheck, User, Phone, MapPin,
  Building2, Sparkles, FileText, CheckCircle2, AlertCircle, MessageCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import { CITIES } from '../../data/properties';
import { updateMyProfile } from '../../api/agents';
import { changePassword, getMe } from '../../api/auth';
import { uploadPropertyImage, getAvatarUrl } from '../../api/properties';

/* ─── Password strength ─────────────────────────────────────────────────── */

function pwStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6)  score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: 'Trop court',  color: 'bg-red-400'    },
    { label: 'Faible',      color: 'bg-orange-400'  },
    { label: 'Moyen',       color: 'bg-amber-400'   },
    { label: 'Fort',        color: 'bg-emerald-400' },
    { label: 'Très fort',   color: 'bg-emerald-500' },
  ];
  return { score, ...map[score] };
}

/* ─── Password field with show/hide ─────────────────────────────────────── */

function PwField({ label, value, onChange, placeholder = '••••••••', error }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-neutral-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          style={{ fontSize: '16px' }}
          className={`w-full h-11 px-4 pr-11 rounded-xl border text-sm transition-all focus:outline-none dark:text-slate-200 dark:placeholder:text-slate-500 ${
            error
              ? 'border-red-300 dark:border-red-700 focus:border-red-400 bg-neutral-50 dark:bg-slate-800'
              : 'border-neutral-200 dark:border-slate-700 focus:border-primary bg-neutral-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-750'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-slate-500 hover:text-neutral-700 dark:hover:text-slate-300 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function AgentProfile() {
  const { user } = useApp();
  const { t } = useTranslation();
  const avatarInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');

  const [form, setForm] = useState({
    name:       user?.name  || '',
    phone:      '',
    whatsapp:   '',
    city:       '',
    agency:     '',
    bio:        '',
    avatar:     user?.avatar || '',
    specialties: '',
  });
  const [agentStats, setAgentStats] = useState({ sold: 0, rating: null });
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    getMe()
      .then(data => {
        setForm({
          name:        data.name        || '',
          phone:       data.phone       || '',
          whatsapp:    data.whatsapp    || '',
          city:        data.city        || '',
          agency:      data.agency      || '',
          bio:         data.bio         || '',
          avatar:      data.avatar      || '',
          specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : '',
        });
        setAgentStats({ sold: data.sold ?? 0, rating: data.rating ?? null });
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const [pw, setPw]       = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState(null);
  const strength = pwStrength(pw.next);

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setProfileMsg({ type: 'error', text: 'Image trop volumineuse (max 10 MB).' });
      return;
    }
    setUploading(true);
    try {
      const res = await uploadPropertyImage(file);
      set('avatar', res.url || res);
    } catch {
      setProfileMsg({ type: 'error', text: "Erreur lors de l'upload." });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setProfileMsg(null);
    try {
      await updateMyProfile({
        ...form,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
        whatsapp: form.whatsapp || null,
        agency: form.agency || null,
      });
      setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde.' });
    } finally { setSaving(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault(); setPwMsg(null);
    if (pw.next.length < 6) { setPwMsg({ type: 'error', text: 'Minimum 6 caractères.' }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' }); return; }
    setPwSaving(true);
    try {
      await changePassword(pw.current, pw.next);
      setPwMsg({ type: 'success', text: 'Mot de passe modifié avec succès !' });
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Mot de passe actuel incorrect.' });
    } finally { setPwSaving(false); }
  };

  const inputCls = 'w-full h-11 px-4 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-900 dark:text-slate-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary dark:focus:border-primary transition-all';

  return (
    <div className="min-h-full bg-neutral-50/50 dark:bg-slate-950">

      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-[#0F1F22] to-[#1a3a40] px-6 pt-10 pb-20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-16 -right-4  w-32 h-32 rounded-full bg-primary/10 pointer-events-none" />

        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-5 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-3xl ring-4 ring-white/20 overflow-hidden shadow-2xl">
              <img src={getAvatarUrl(form.avatar)} alt="" className="w-full h-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-60"
              title="Changer la photo"
            >
              {uploading
                ? <Loader2 size={14} className="text-white animate-spin" />
                : <Camera size={14} className="text-white" />
              }
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>

          {/* Name & info */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{form.name || 'Agent'}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
              {form.agency && (
                <span className="flex items-center gap-1 text-white/60 text-xs">
                  <Building2 size={11} /> {form.agency}
                </span>
              )}
              {form.city && (
                <span className="flex items-center gap-1 text-white/60 text-xs">
                  <MapPin size={11} /> {form.city}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-primary/30 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                Agent
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="sm:ml-auto flex gap-6 sm:gap-8 pb-1">
            {[
              { label: 'Ventes', value: agentStats.sold },
              { label: 'Note',   value: agentStats.rating ? `★ ${agentStats.rating}` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-[11px] text-white/50 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs card (overlapping hero) ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-12 relative z-10 pb-10 space-y-0">

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-neutral-100 dark:border-slate-800 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-neutral-100 dark:border-slate-800 px-6 pt-5 gap-1">
            {[
              { id: 'profile',  icon: User,       label: 'Mon profil' },
              { id: 'security', icon: ShieldCheck, label: 'Sécurité'  },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-primary border-primary bg-primary/5'
                    : 'text-neutral-400 dark:text-slate-500 border-transparent hover:text-neutral-700 dark:hover:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8">

              {profileMsg && (
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-6 border ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}>
                  {profileMsg.type === 'success'
                    ? <CheckCircle2 size={15} className="shrink-0" />
                    : <AlertCircle  size={15} className="shrink-0" />
                  }
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Informations personnelles */}
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User size={10} /> Informations personnelles
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'name',     label: 'Nom complet', icon: User,          type: 'text', placeholder: 'Votre nom' },
                      { key: 'phone',    label: 'Téléphone',   icon: Phone,         type: 'tel',  placeholder: '+212 6XX XXX XXX' },
                      { key: 'whatsapp', label: 'WhatsApp',    icon: MessageCircle, type: 'tel',  placeholder: '+212 6XX XXX XXX' },
                    ].map(({ key, label, icon: Icon, type, placeholder }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Icon size={12} className="text-neutral-400 dark:text-slate-500" /> {label}
                        </label>
                        <input
                          type={type}
                          value={form[key]}
                          onChange={e => set(key, e.target.value)}
                          placeholder={placeholder}
                          style={{ fontSize: '16px' }}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Building2 size={10} /> Informations professionnelles
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin size={12} className="text-neutral-400 dark:text-slate-500" /> Ville
                      </label>
                      <select
                        value={form.city}
                        onChange={e => set('city', e.target.value)}
                        style={{ fontSize: '16px' }}
                        className={`${inputCls} appearance-none cursor-pointer`}
                      >
                        <option value="">Sélectionner une ville</option>
                        {CITIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Building2 size={12} className="text-neutral-400 dark:text-slate-500" />
                        Agence
                        <span className="text-[11px] font-normal text-neutral-400 dark:text-slate-500">(optionnel)</span>
                      </label>
                      <input
                        type="text"
                        value={form.agency}
                        onChange={e => set('agency', e.target.value)}
                        placeholder="Nom de votre agence"
                        style={{ fontSize: '16px' }}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Spécialités */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-neutral-400 dark:text-slate-500" />
                    Spécialités
                    <span className="text-[11px] font-normal text-neutral-400 dark:text-slate-500">(séparées par virgule)</span>
                  </label>
                  <input
                    type="text"
                    value={form.specialties}
                    onChange={e => set('specialties', e.target.value)}
                    placeholder="Appartements, Villas, Bureaux…"
                    style={{ fontSize: '16px' }}
                    className={inputCls}
                  />
                </div>

                {/* Biographie */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText size={12} className="text-neutral-400 dark:text-slate-500" /> Biographie
                  </label>
                  <textarea
                    rows={4}
                    value={form.bio}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="Décrivez votre expérience et vos spécialités…"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-sm text-neutral-900 dark:text-slate-200 placeholder:text-neutral-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="w-full h-12 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {saving
                    ? <><Loader2 size={16} className="animate-spin" /> Enregistrement…</>
                    : <><CheckCircle2 size={16} /> Enregistrer les modifications</>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <div className="p-6 sm:p-8">

              {/* Security banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 mb-7">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Sécurité du compte</p>
                  <p className="text-white/50 text-xs mt-0.5">
                    Choisissez un mot de passe fort d'au moins 6 caractères.
                  </p>
                </div>
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm mb-6 border ${
                  pwMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}>
                  {pwMsg.type === 'success'
                    ? <CheckCircle2 size={15} className="shrink-0" />
                    : <AlertCircle  size={15} className="shrink-0" />
                  }
                  {pwMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePw} className="space-y-5">

                <PwField
                  label="Mot de passe actuel"
                  value={pw.current}
                  onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                  placeholder="Votre mot de passe actuel"
                />

                <div className="space-y-2">
                  <PwField
                    label="Nouveau mot de passe"
                    value={pw.next}
                    onChange={e => setPw(p => ({ ...p, next: e.target.value }))}
                    placeholder="Minimum 6 caractères"
                  />

                  {pw.next.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              i < strength.score ? strength.color : 'bg-neutral-100 dark:bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.score <= 1 ? 'text-red-500' :
                        strength.score === 2 ? 'text-amber-500' : 'text-emerald-600'
                      }`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <PwField
                  label="Confirmer le nouveau mot de passe"
                  value={pw.confirm}
                  onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Répétez le nouveau mot de passe"
                  error={pw.confirm && pw.confirm !== pw.next ? 'Les mots de passe ne correspondent pas' : ''}
                />

                <button
                  type="submit"
                  disabled={pwSaving || !pw.current || !pw.next || !pw.confirm || pw.next !== pw.confirm}
                  className="w-full h-12 rounded-2xl bg-neutral-900 dark:bg-slate-700 text-white font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-slate-600 active:scale-[0.99] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
                >
                  {pwSaving
                    ? <><Loader2 size={16} className="animate-spin" /> Modification…</>
                    : <><Lock size={15} /> Modifier le mot de passe</>
                  }
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
