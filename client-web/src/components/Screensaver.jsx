import React, { useEffect, useState } from 'react';
import { getAds } from '../services/api';

const Screensaver = ({ onAction, restaurantName }) => {
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    getAds().then(data => {
      if (Array.isArray(data)) {
        setAds(data.filter(ad => ad.is_active));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={onAction}
    >
      {ads.length > 0 ? (
        <img 
          src={ads[currentAdIndex].image_url} 
          alt="Advertisement"
          className="w-full h-full object-cover transition-opacity duration-1000 animate-fade-in"
          key={ads[currentAdIndex].id}
        />
      ) : (
        <div className="text-white text-center">
          <h2 className="text-4xl font-bold mb-4">{restaurantName || 'Bem-vindo'}</h2>
          <p className="text-xl animate-pulse">Toque para iniciar</p>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-12">
        <div className="text-white text-center">
          <p className="text-2xl font-light tracking-widest uppercase">Toque em qualquer lugar para começar</p>
        </div>
      </div>
    </div>
  );
};

export default Screensaver;
