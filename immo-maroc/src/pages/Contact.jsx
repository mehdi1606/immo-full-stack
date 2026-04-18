import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_URL ?? '';

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.errors
          ? Object.values(data.errors).join(', ')
          : data?.message || t('contact.errorGeneric');
        setErrorMsg(msg);
        setStatus('error');
        return;
      }

      setStatus('success');
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch {
      setErrorMsg(t('contact.errorNetwork'));
      setStatus('error');
    }
  };

  const contactItems = [
    { icon: Phone,  title: t('contact.phone'),   lines: ['+212 522 334 455', '+212 522 334 456'], href: 'tel:+2125222334455' },
    { icon: Mail,   title: t('contact.email'),   lines: ['contact@immomaroc.ma', 'support@immomaroc.ma'], href: 'mailto:contact@immomaroc.ma' },
    { icon: MapPin, title: t('contact.address'), lines: ['Twin Center, Tour Ouest', 'Casablanca 20100'], href: '#' },
    { icon: Clock,  title: t('contact.hours'),   lines: [t('contact.hoursVal1'), t('contact.hoursVal2')], href: null },
  ];

  return (
    <div className="pt-20 min-h-screen bg-neutral-50">
      <div className="bg-primary py-16">
        <div className="container-custom text-center">
          <div className="section-tag justify-center text-accent mb-3">
            <span className="w-5 h-0.5 bg-accent" /> {t('contact.tag')}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">{t('contact.title')}</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">{t('contact.subtitle')}</p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto">
          {/* Contact info cards */}
          <div className="space-y-4">
            {contactItems.map(({ icon: Icon, title, lines, href }) => (
              <div key={title} className="bg-white rounded-2xl shadow-card p-4 sm:p-5 flex gap-4">
                <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-800 text-sm mb-1">{title}</p>
                  {lines.map((l, i) => href ? (
                    <a key={i} href={href} className="block text-neutral-400 text-xs hover:text-primary transition-colors">{l}</a>
                  ) : (
                    <p key={i} className="text-neutral-400 text-xs">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-4 sm:p-6 md:p-8">
            <h2 className="font-serif text-xl font-bold text-neutral-900 mb-6">{t('contact.formTitle')}</h2>

            {status === 'success' && (
              <div className="bg-emerald-50 text-emerald-700 rounded-xl px-5 py-4 text-sm font-medium mb-6 flex items-center gap-2">
                <CheckCircle2 size={16} />
                {t('contact.sent')}
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 text-red-600 rounded-xl px-5 py-4 text-sm font-medium mb-6 flex items-center gap-2">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">{t('contact.nameLabel')}</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder={t('contact.namePlaceholder')}
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('contact.phoneLabel')}</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+212 6XX XXX XXX"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    disabled={status === 'loading'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('contact.emailLabel')}</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="vous@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('contact.subjectLabel')}</label>
                <select
                  required
                  className="form-select"
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  disabled={status === 'loading'}
                >
                  <option value="">{t('contact.subjectPlaceholder')}</option>
                  <option value={t('contact.subjectBuy')}>{t('contact.subjectBuy')}</option>
                  <option value={t('contact.subjectSell')}>{t('contact.subjectSell')}</option>
                  <option value={t('contact.subjectRent')}>{t('contact.subjectRent')}</option>
                  <option value={t('contact.subjectAgent')}>{t('contact.subjectAgent')}</option>
                  <option value={t('contact.subjectOther')}>{t('contact.subjectOther')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('contact.messageLabel')}</label>
                <textarea
                  required
                  rows={5}
                  className="form-textarea"
                  placeholder={t('contact.messagePlaceholder')}
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  disabled={status === 'loading'}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full sm:w-auto justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading'
                  ? <><Loader2 size={15} className="animate-spin" /> Envoi en cours…</>
                  : <><Send size={15} /> {t('contact.sendBtn')}</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
