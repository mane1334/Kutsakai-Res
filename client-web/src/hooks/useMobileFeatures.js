import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { registerPlugin } from '@capacitor/core';

const KioskPlugin = registerPlugin('KioskPlugin');

export const useMobileFeatures = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const enableKioskFeatures = async () => {
      try {
        // 1. Ocultar Barra de Status
        await StatusBar.hide();
        
        // 2. Bloquear Orientação (Horizontal para Tabletes de Restaurante)
        await ScreenOrientation.lock({ orientation: 'landscape' });

        // 3. Manter tela ligada
        await KeepAwake.keepAwake();

        // 4. Iniciar Modo Kiosk (Pinning)
        await KioskPlugin.startKiosk();
        
        console.log('Native Kiosk features enabled');
      } catch (error) {
        console.error('Error enabling native features:', error);
      }
    };

    enableKioskFeatures();

    // Cleanup (Opcional, mas bom para desenvolvimento)
    return () => {
      if (Capacitor.isNativePlatform()) {
        StatusBar.show();
        ScreenOrientation.unlock();
        KeepAwake.allowSleep();
      }
    };
  }, []);
};
