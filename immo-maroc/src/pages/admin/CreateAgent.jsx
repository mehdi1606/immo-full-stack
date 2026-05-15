import { useState, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, UserPlus, Upload, X, Shield, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CITIES } from '../../data/properties';
import { createAgent, uploadAvatar } from '../../api/agents';
import Spinner from '../../components/common/Spinner';

// ── Initials avatar helpers ────────────────────────────────────────────────────

const PALETTE = [
  '#1a56db', // blue
  '#7e3af2', // purple
  '#0694a2', // teal
  '#e02424', // red
  '#ff5a1f', // orange
  '#0e9f6e', // green
  '#c27803', // amber
];

function nameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

/** SVG data-URL for the initials avatar — matches backend generation exactly. */
function buildAvatarDataUrl(name) {
  if (!name?.trim()) return null;
  const initials = getInitials(name);
  const bg = nameToColor(name.trim());
  const fontSize = initials.length === 1 ? 90 : 72;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="100" fill="${bg}"/>
    <text x="100" y="100" text-anchor="middle" dominant-baseline="central"
      fill="white" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="700">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CreateAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', agency: '' });
  const [role, setRole] = useState('AGENT');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null); // real uploaded file preview
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  // Live initials preview — only shown when no real image is chosen
  const initialsPreview = useMemo(() => buildAvatarDataUrl(form.name), [form.name]);

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

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const e = {};
    if (!form.name)  e.name  = t('common.required');
    if (!form.email) e.email = t('common.required');
    if (!form.phone) e.phone = t('common.required');
    if (!form.city)  e.city  = t('common.required');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setSaveError('');
    try {
      let avatar = '';
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        avatar = uploadResult?.url || '';
      }
      // If no avatar file chosen, backend auto-generates the initials SVG
      await createAgent({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        agency: form.agency,
        avatar,
        whatsapp: form.phone.replace(/\s+/g, '').replace('+', ''),
        role,
      });
      setDone(true);
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDone(false);
    setForm({ name: '', email: '', phone: '', city: '', agency: '' });
    setRole('AGENT');
    setErrors({});
    setSaveError('');
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (done) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-card dark:border dark:border-slate-800 p-12 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500 dark:text-emerald-400" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white mb-2">{t('admin.createAgent.successTitle')}</h2>
        <p className="text-neutral-500 dark:text-slate-400 text-sm mb-8">{t('admin.createAgent.successMsg')}</p>
        <div className="flex gap-3">
          <button onClick={resetForm} className="flex-1 btn-outline justify-center text-sm">
            {t('admin.createAgent.createAnother')}
          </button>
          <button onClick={() => navigate('/admin/agents')} className="flex-1 btn-primary justify-center text-sm">
            {t('admin.createAgent.backToAgents')}
          </button>
        </div>
      </div>
    </div>
  );

  // Displayed in the circle: uploaded file → initials svg → generic icon
  const circlePreview = avatarPreview ?? initialsPreview;

  return (
    <div className="p-3 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/admin/agents" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors mb-4">
          <ArrowLeft size={14} /> {t('admin.createAgent.backToAgents')}
        </Link>
        <h1 className="font-serif text-2xl font-bold text-neutral-900">{t('admin.createAgent.title')}</h1>
        <p className="text-neutral-500 text-sm">{t('admin.createAgent.subtitle')}</p>
      </div>

      {saveError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">{saveError}</div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card dark:border dark:border-slate-800 p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Role toggle ───────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">Rôle du compte</label>
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-slate-800 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setRole('AGENT')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'AGENT'
                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                    : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-700 dark:hover:text-slate-300'
                }`}
              >
                <UserIcon size={15} />
                Agent
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'ADMIN'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm'
                    : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-700 dark:hover:text-slate-300'
                }`}
              >
                <Shield size={15} />
                Administrateur
              </button>
            </div>
            {role === 'ADMIN' && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Shield size={12} />
                Ce compte aura accès complet au panneau d'administration.
              </p>
            )}
          </div>

          {/* ── Avatar upload ─────────────────────────────────────────────── */}
          <div className="form-group">
            <label className="form-label">{t('admin.createAgent.avatarLabel')}</label>
            <div className="flex items-center gap-4">
              {/* Preview circle */}
              <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-slate-800 border-2 border-dashed border-neutral-300 dark:border-slate-600 flex items-center justify-center shrink-0 overflow-hidden relative">
                {circlePreview ? (
                  <>
                    <img src={circlePreview} alt="" className="w-full h-full object-cover" />
                    {/* Only show remove button when a real file is uploaded */}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </>
                ) : (
                  <UserIcon size={28} className="text-neutral-400" />
                )}
              </div>

              {/* Upload controls */}
              <div>
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
                  <Upload size={14} /> Choisir une photo
                </button>
                <p className="text-neutral-400 text-xs mt-1.5">
                  {form.name.trim()
                    ? 'Avatar généré automatiquement · ou choisissez une photo'
                    : 'JPG, PNG ou WebP · Max 10 MB'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Fields ───────────────────────────────────────────────────── */}
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
              <input type="tel" className={`form-input ${errors.phone ? 'border-red-300' : ''}`}
                placeholder="+212 6XX XXX XXX"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
              {errors.phone && <p className="form-error">{errors.phone}</p>}
            </div>

            <div className="form-group sm:col-span-2">
              <label className="form-label">{t('admin.createAgent.cityLabel')}</label>
              <select className={`form-select ${errors.city ? 'border-red-300' : ''}`}
                value={form.city} onChange={e => set('city', e.target.value)}>
                <option value="">Sélectionner une ville</option>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {errors.city && <p className="form-error">{errors.city}</p>}
            </div>
          </div>

          {/* ── Info banner ───────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            <span className="mt-0.5">🔐</span>
            <span>
              Un mot de passe temporaire sera généré automatiquement et envoyé par email à l'agent.
            </span>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
              {saving ? <Spinner size="sm" /> : <><UserPlus size={16} /> {t('admin.createAgent.createBtn')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
