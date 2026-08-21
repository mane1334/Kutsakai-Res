import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAds } from '../services/api';
import { PLACEHOLDER_IMG, resolveImageUrl } from '../utils/images';

const Footer = () => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const data = await getAds();
        const activeAds = Array.isArray(data)
          ? data.filter((ad) => ad.is_active).sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
          : [];
        setAds(activeAds);
      } catch (err) {
        setError(err.message);
        toast.error('Erro ao carregar anúncios.');
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return undefined;
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (loading) {
    return (
      <footer className="mt-10 bg-gray-950 px-4 py-8 text-center text-white">
        <p>Carregando anúncios...</p>
      </footer>
    );
  }

  if (error) {
    return (
      <footer className="mt-10 bg-gray-950 px-4 py-8 text-center text-white">
        <p className="text-red-300">Erro ao carregar anúncios: {error}</p>
      </footer>
    );
  }

  const currentAd = ads[currentAdIndex];

  return (
    <footer className="mt-10 bg-gray-950 px-4 py-8 text-center text-white">
      <div className="container mx-auto max-w-7xl">
        {currentAd ? (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-red-800 to-red-700 p-5 shadow-xl md:p-6">
            <div className="mb-4">
              <img
                src={currentAd.image_url ? resolveImageUrl(currentAd.image_url) : PLACEHOLDER_IMG}
                alt={currentAd.title}
                className="mx-auto max-h-48 rounded-lg object-contain shadow-lg"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_IMG;
                }}
              />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-white">{currentAd.title}</h3>
            <p className="mb-4 text-red-100">{currentAd.content}</p>
            <p className="text-xs text-red-200 opacity-75">Publicidade</p>

            {ads.length > 1 ? (
              <div className="mt-4 flex justify-center gap-2">
                {ads.map((ad, index) => (
                  <span
                    key={ad.id || index}
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${index === currentAdIndex ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="border-t border-gray-800 pt-6">
          <p className="mb-3 text-gray-300">Obrigado por escolher nosso restaurante!</p>
          <p className="text-sm text-gray-500">Sistema de Pedidos Digital - Interactive Restaurant</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
