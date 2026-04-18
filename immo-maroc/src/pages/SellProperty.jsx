import { useState } from 'react';
import { CheckCircle2, Phone, Mail, Shield, TrendingUp, Users, Zap, Star, ArrowRight, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CITIES, TYPES, PURPOSES } from '../data/properties';
import { createSellRequest } from '../api/sellRequests';

export default function SellProperty() {
  const { t } = useTranslation();

  const WHY = [
    { icon: Shield,     title: t('sell.why1Title'), desc: t('sell.why1Desc') },
    { icon: TrendingUp, title: t('sell.why2Title'), desc: t('sell.why2Desc') },
    { icon: Users,      title: t('sell.why3Title'), desc: t('sell.why3Desc') },
    { icon: Zap,        title: t('sell.why4Title'), desc: t('sell.why4Desc') },
  ];

  const STEPS = [
    { n: '01', title: t('sell.step1Title'), desc: t('sell.step1Desc') },
    { n: '02', title: t('sell.step2Title'), desc: t('sell.step2Desc') },
    { n: '03', title: t('sell.step3Title'), desc: t('sell.step3Desc') },
    { n: '04', title: t('sell.step4Title'), desc: t('sell.step4Desc') },
  ];

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    city: '', type: '', purpose: 'VENTE', message: '',
  });
  const [errors, setErrors]       = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.fullName) e.fullName = t('common.required');
    if (!form.phone)    e.phone    = t('common.required');
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = t('common.required');
    if (!form.city)     e.city     = t('common.required');
    if (!form.type)     e.type     = t('common.required');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await createSellRequest({
        name: form.fullName,
        phone: form.phone,
        email: form.email,
        city: form.city,
        propertyType: form.type,
        purpose: form.purpose,
        description: form.message,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.message || t('contact.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({ fullName: '', phone: '', email: '', city: '', type: '', purpose: 'VENTE', message: '' });
    setErrors({});
    setSubmitError('');
  };

  /* ── Success screen ── */
  if (submitted) return (
    <div className="pt-20 min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-3xl shadow-card-lg p-12">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-3">{t('sell.successTitle')}</h2>
        <p className="text-neutral-500 text-sm leading-relaxed mb-8">{t('sell.successMsg')}</p>
        <div className="space-y-2">
          <a href="tel:+2125222334455" className="btn-primary w-full justify-center">
            <Phone size={15} /> {t('sell.callNow')}
          </a>
          <button onClick={resetForm} className="btn-ghost w-full justify-center text-sm">
            {t('sell.submitAnother')}
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Main page ── */
  return (
    <div className="pt-20 min-h-screen">

      {/* Hero */}
      <section className="relative py-20 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1400&q=50" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -right-20 top-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/80 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Star size={13} className="text-accent" /> {t('sell.heroBadge')}
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight">
            {t('sell.heroTitle1')}<br />
            <span className="text-accent italic">{t('sell.heroTitle2')}</span> {t('sell.heroTitle3')}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">{t('sell.heroSubtitle')}</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
            {[t('sell.feat1'), t('sell.feat2'), t('sell.feat3'), t('sell.feat4')].map(f => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-accent" /> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us bar */}
      <section className="bg-white border-b border-neutral-100 py-10">
        <div className="container-custom">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">{title}</p>
                  <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="py-14 bg-neutral-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">

            {/* ── Simple contact form ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-card p-8">
                <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-1">{t('sell.formTitle')}</h2>
                <p className="text-neutral-500 text-sm mb-8">{t('sell.formSubtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Personal info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="form-group">
                      <label className="form-label">{t('sell.nameLabel')}</label>
                      <input type="text" className={`form-input ${errors.fullName ? 'border-red-300' : ''}`}
                        placeholder={t('sell.namePlaceholder')}
                        value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                      {errors.fullName && <p className="form-error">{errors.fullName}</p>}
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                      <label className="form-label">{t('sell.phoneLabel')}</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">🇲🇦</span>
                        <input type="tel" className={`form-input pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                          placeholder="+212 6XX XXX XXX"
                          value={form.phone} onChange={e => set('phone', e.target.value)} />
                      </div>
                      {errors.phone && <p className="form-error">{errors.phone}</p>}
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label">{t('sell.emailLabel')}</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input type="email" className={`form-input pl-9 ${errors.email ? 'border-red-300' : ''}`}
                          placeholder="vous@email.com"
                          value={form.email} onChange={e => set('email', e.target.value)} />
                      </div>
                      {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>

                    {/* City */}
                    <div className="form-group">
                      <label className="form-label">{t('sell.cityLabel')}</label>
                      <select className={`form-select ${errors.city ? 'border-red-300' : ''}`}
                        value={form.city} onChange={e => set('city', e.target.value)}>
                        <option value="">{t('sell.cityPlaceholder')}</option>
                        {CITIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                      {errors.city && <p className="form-error">{errors.city}</p>}
                    </div>
                  </div>

                  {/* Property type */}
                  <div className="form-group">
                    <label className="form-label">{t('sell.typeLabel')}</label>
                    <select className={`form-select ${errors.type ? 'border-red-300' : ''}`}
                      value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="">{t('sell.typePlaceholder')}</option>
                      {TYPES.map(tp => <option key={tp}>{tp}</option>)}
                    </select>
                    {errors.type && <p className="form-error">{errors.type}</p>}
                  </div>

                  {/* Operation: Vente / Location */}
                  <div className="form-group">
                    <label className="form-label">{t('sell.operationLabel')}</label>
                    <div className="flex gap-3">
                      {PURPOSES.map(p => (
                        <button type="button" key={p} onClick={() => set('purpose', p)}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                            form.purpose === p
                              ? 'border-primary bg-primary text-white'
                              : 'border-neutral-200 text-neutral-500 hover:border-primary hover:text-primary'
                          }`}>
                          {t(`common.purpose.${p}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional message */}
                  <div className="form-group">
                    <label className="form-label">{t('sell.messageLabel')}</label>
                    <textarea rows={4} className="form-textarea"
                      placeholder={t('sell.messagePlaceholder')}
                      value={form.message} onChange={e => set('message', e.target.value)} />
                  </div>

                  {/* Error */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                      {submitError}
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-4 justify-center disabled:opacity-60">
                    <Send size={16} /> {submitting ? 'Envoi en cours...' : t('sell.submitBtn')}
                  </button>

                  <p className="text-center text-xs text-neutral-400">
                    {t('sell.terms')} <a href="#" className="text-primary hover:underline">{t('sell.termsLink')}</a>{' '}
                    {t('sell.termsAnd')} <a href="#" className="text-primary hover:underline">{t('sell.privacyLink')}</a>.
                  </p>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How it works */}
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-neutral-900 mb-5 text-sm">{t('sell.howItWorks')}</h3>
                <div className="space-y-4">
                  {STEPS.map(s => (
                    <div key={s.n} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{s.n}</div>
                      <div>
                        <p className="font-semibold text-neutral-800 text-sm">{s.title}</p>
                        <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct contact */}
              <div className="bg-primary rounded-2xl p-6 text-white">
                <h3 className="font-semibold mb-2 text-sm">{t('sell.helpTitle')}</h3>
                <p className="text-white/70 text-xs mb-4 leading-relaxed">{t('sell.helpDesc')}</p>
                <a href="tel:+2125222334455" className="flex items-center gap-2 bg-white text-primary font-semibold text-sm px-4 py-3 rounded-xl hover:bg-neutral-100 transition-colors w-full justify-center">
                  <Phone size={15} /> +212 522 334 455
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
