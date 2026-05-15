import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Save, Upload, X, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CITIES } from '../../data/properties';
import { getAgentById, updateAgent, uploadAvatar } from '../../api/agents';
import { getAvatarUrl } from '../../api/properties';
import Spinner from '../../components/common/Spinner';

export default function EditAgent() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [agent, setAgent]       = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', agency: '', avatar: '', bio: '', specialties: '',
  });
  const [errors, setErrors]   = useState({});
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');

  // Avatar state: null = no new file chosen (keep existing)
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null); // object-URL of newly chosen file

  useEffect(() => {
    getAgentById(id)
      .then(data => {
        setAgent(data);
        setForm({
          name:       data.name        || '',
          email:      data.email       || '',
          phone:      data.phone       || '',
          city:       data.city        || '',
          agency:     data.agency      || '',
          avatar:     data.avatar      || '',
          bio:        data.bio         || '',
          specialties: (data.specialties || []).join(', '),
        });
      })
      .catch(() => setLoadError('Agent introuvable.'));
  }, [id]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  // ── Avatar handlers ────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSaveError('Fichier trop volumineux. La taille maximale est 10 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setSaveError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeNewAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clears the existing avatar (sets to empty, backend will receive empty string)
  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    set('avatar', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name)  e.name  = t('common.required');
    if (!form.email) e.email = t('common.required');
    if (!form.city)  e.city  = t('common.required');
    return e;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setSaveError('');
    try {
      // Upload new file if one was chosen
      let finalAvatar = form.avatar;
      if (avatarFile) {
        const res = await uploadAvatar(avatarFile);
        finalAvatar = res?.url || form.avatar;
      }

      await updateAgent(id, {
        ...form,
        avatar: finalAvatar,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/admin/agents'); }, 1500);
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loadError) return (
    <div className="p-8 text-center">
      <p className="text-neutral-500">{loadError}</p>
      <Link to="/admin/agents" className="btn-primary mt-4 inline-flex">← Retour aux agents</Link>
    </div>
  );

  if (!agent) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  // What to display in the preview circle:
  // 1. Newly picked file (object-URL) → 2. Existing avatar URL → 3. Generic icon
  const currentAvatarSrc = avatarPreview ?? (form.avatar ? getAvatarUrl(form.avatar) : null);
  const hasNewFile = Boolean(avatarFile);
  const hasExisting = Boolean(form.avatar) && !hasNewFile;

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/admin/agents" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors mb-4">
          <ArrowLeft size={14} /> {t('admin.createAgent.backToAgents')}
        </Link>
        <h1 className="font-serif text-2xl font-bold text-neutral-900">{t('admin.editAgent.title')}</h1>
        <p className="text-neutral-500 text-sm">{agent.name}</p>
      </div>

      {saved && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <CheckCircle2 size={15} /> {t('agent.profile.saved')}
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{saveError}</div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card dark:border dark:border-slate-800 p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Avatar section ──────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">{t('admin.createAgent.avatarLabel')}</label>
            <div className="flex items-center gap-4">

              {/* Preview circle */}
              <div className="relative w-20 h-20 shrink-0">
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-slate-800 border-2 border-dashed border-neutral-300 dark:border-slate-600 flex items-center justify-center overflow-hidden">
                  {currentAvatarSrc ? (
                    <img src={currentAvatarSrc} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={28} className="text-neutral-400" />
                  )}
                </div>
                {/* Remove button — shown when there's a new file OR an existing avatar */}
                {(hasNewFile || hasExisting) && (
                  <button
                    type="button"
                    onClick={hasNewFile ? removeNewAvatar : clearAvatar}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow"
                    title="Supprimer la photo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-slate-600 rounded-xl text-sm text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Upload size={14} />
                  {currentAvatarSrc ? 'Changer la photo' : 'Choisir une photo'}
                </button>
                <p className="text-neutral-400 text-xs">JPG, PNG ou WebP · Max 10 MB</p>
                {hasNewFile && (
                  <p className="text-emerald-600 text-xs flex items-center gap-1">
                    <CheckCircle2 size={11} /> Nouvelle photo prête à être enregistrée
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Fields ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="form-label">{t('admin.createAgent.nameLabel')}</label>
              <input type="text" className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('admin.createAgent.agencyLabel')}
                <span className="ml-1 text-[11px] font-normal text-neutral-400">(optionnel)</span>
              </label>
              <input type="text" className="form-input"
                value={form.agency} onChange={e => set('agency', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.createAgent.emailLabel')}</label>
              <input type="email" className={`form-input ${errors.email ? 'border-red-300' : ''}`}
                value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.createAgent.phoneLabel')}</label>
              <input type="tel" className="form-input"
                placeholder="+212 6XX XXX XXX"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.createAgent.cityLabel')}</label>
              <select className={`form-select ${errors.city ? 'border-red-300' : ''}`}
                value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Sélectionner</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.city && <p className="form-error">{errors.city}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Spécialités <span className="text-[11px] font-normal text-neutral-400">(séparées par virgule)</span></label>
              <input type="text" className="form-input"
                placeholder="Appartements, Villas, Terrains"
                value={form.specialties} onChange={e => set('specialties', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('agent.profile.bioLabel')}</label>
            <textarea rows={3} className="form-textarea"
              placeholder={t('agent.profile.bioPlaceholder')}
              value={form.bio} onChange={e => set('bio', e.target.value)} />
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            {saving ? <Spinner size="sm" /> : <><Save size={15} /> {t('agent.profile.saveBtn')}</>}
          </button>
        </form>
      </div>
    </div>
  );
}
