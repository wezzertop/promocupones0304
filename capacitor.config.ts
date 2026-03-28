import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.promocupones.cupoferta',
  appName: 'cupoferta',
  webDir: 'public', // Cambiamos a 'public' porque no usaremos 'out' local
  server: {
    url: 'http://192.168.1.72:3000', // Conectando por la IP local para soporte Next.js CSS / HMR
    cleartext: true
  }
};
export default config;
