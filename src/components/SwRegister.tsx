'use client';

import { useEffect } from 'react';

export default function SwRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'development') {
        // En desarrollo, desregistramos el SW para evitar problemas de caché con F5
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      } else {
        // Registrar el SW después de que la ventana cargue completamente
        // Esto evita que el registro del SW compita por red en la carga inicial
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').then(
            function(registration) {
              console.log('ServiceWorker registration successful with scope: ', registration.scope);
            },
            function(err) {
              console.log('ServiceWorker registration failed: ', err);
            }
          );
        });
      }
    }
  }, []);

  return null;
}
