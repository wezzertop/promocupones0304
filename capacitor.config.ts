import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promocupones.cupoferta',
  appName: 'cupoferta',
  webDir: 'public', // Cambiamos a 'public' porque no usaremos 'out' local
  server: {
    url: 'http://192.168.1.74:3000', // Conectando a local dev server para pruebas
    cleartext: true
  }
};
export default config;
