import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="font-serif text-9xl font-bold text-primary/10 mb-4 leading-none">404</div>
        <h1 className="font-serif text-3xl font-bold text-neutral-900 mb-3">{t('notFound.title')}</h1>
        <p className="text-neutral-500 mb-8">{t('notFound.subtitle')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">
            <Home size={16} /> {t('notFound.home')}
          </Link>
          <Link to="/recherche" className="btn-outline">
            <Search size={16} /> {t('notFound.searchProperty')}
          </Link>
        </div>
      </div>
    </div>
  );
}
