import React from 'react';
import Diagnostics from './Diagnostics';
import { useSettings } from '../SettingsContext';

const Header = () => {
  const { settings, loading } = useSettings();

  return (
    <header className="relative z-20 bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white shadow-2xl">
      <div className="container mx-auto px-4 py-6 text-center lg:py-7">
        <div className="absolute right-4 top-3">
          <Diagnostics />
        </div>
        {settings.restaurant_logo_url && (
          <img
            src={settings.restaurant_logo_url}
            alt={`${settings.restaurant_name || 'Restaurante'} Logo`}
            className="mx-auto mb-3 h-16 w-auto rounded-lg shadow-md"
            crossOrigin="anonymous"
          />
        )}
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            {loading ? (
              <span className="animate-pulse">Carregando...</span>
            ) : (
              settings.restaurant_name || 'Restaurante Interactive'
            )}
          </h1>
          <p className="slide-up mt-2 text-lg font-light tracking-wide opacity-95 md:text-xl">
            Sabor que encanta, momentos que ficam.
          </p>
          <div className="mt-4">
            <div className="inline-flex items-center rounded-full bg-white/15 px-5 py-2">
              <span className="text-sm font-semibold uppercase tracking-[0.24em]">Cardápio Digital</span>
            </div>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
    </header>
  );
};

export default Header;
