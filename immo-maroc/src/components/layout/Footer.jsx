import { Link } from 'react-router-dom';
import { Home, Phone, Mail, MapPin, Instagram, Facebook, Linkedin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-custom py-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div>
            <h4 className="font-semibold text-lg mb-1">{t('footer.newsletterTitle')}</h4>
            <p className="text-white/50 text-sm">{t('footer.newsletterSubtitle')}</p>
          </div>
          <form className="flex flex-col sm:flex-row gap-3 w-full md:w-auto" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder={t('footer.emailPlaceholder')}
              className="flex-1 md:w-72 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-accent transition-colors" />
            <button type="submit" className="btn-accent shrink-0 flex items-center gap-2">
              {t('footer.subscribe')} <ArrowRight size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Main */}
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Home size={17} className="text-white" />
              </div>
              <span className="font-bold text-xl">Immo<span className="text-accent">Maroc</span></span>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">{t('footer.tagline')}</p>
            <div className="space-y-3">
              <a href="tel:+2125222334455" className="flex items-center gap-3 text-white/50 hover:text-accent text-sm transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Phone size={13} /></div>
                +212 522 334 455
              </a>
              <a href="mailto:contact@immomaroc.ma" className="flex items-center gap-3 text-white/50 hover:text-accent text-sm transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Mail size={13} /></div>
                contact@immomaroc.ma
              </a>
              <p className="flex items-center gap-3 text-white/50 text-sm">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><MapPin size={13} /></span>
                Twin Center, Casablanca
              </p>
            </div>
          </div>

          {/* Links */}
          {[
            { title: t('footer.buy'), links: [
              { l: t('footer.linkApartments'), p: '/recherche?type=Appartement&purpose=Vente' },
              { l: t('footer.linkVillas'),     p: '/recherche?type=Villa&purpose=Vente' },
              { l: t('footer.linkRiads'),      p: '/recherche?type=Riad' },
              { l: t('footer.linkLand'),       p: '/recherche?type=Terrain' },
              { l: t('footer.linkOffices'),    p: '/recherche?type=Bureau' },
            ]},
            { title: t('footer.rent'), links: [
              { l: t('footer.linkRentApt'),    p: '/recherche?type=Appartement&purpose=Location' },
              { l: t('footer.linkRentVilla'),  p: '/recherche?type=Villa&purpose=Location' },
              { l: t('footer.linkStudios'),    p: '/recherche?type=Studio' },
              { l: t('footer.linkCommercial'), p: '/recherche?type=Commerce' },
            ]},
            { title: t('footer.contact'), links: [
              { l: t('footer.linkContact'), p: '/contact' },
              { l: t('footer.linkPublish'), p: '/vendre' },
            ]},
          ].map(col => (
            <div key={col.title}>
              <h5 className="font-semibold text-xs uppercase tracking-widest text-white/40 mb-5">{col.title}</h5>
              <ul className="space-y-3">
                {col.links.map(({ l, p }) => (
                  <li key={l}>
                    <Link to={p} className="text-white/60 hover:text-accent text-sm transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex items-center gap-2">
            {[
              { icon: Instagram, href: '#', name: 'instagram' },
              { icon: Facebook,  href: '#', name: 'facebook'  },
              { icon: Linkedin,  href: '#', name: 'linkedin'  },
            ].map(({ icon: Icon, href, name }) => (
              <a key={name} href={href}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/50 hover:bg-accent hover:text-white transition-all">
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
