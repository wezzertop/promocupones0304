# Resolución de Problemas: Publicidad en Redes Móviles

## 1. Análisis del Problema
Se ha detectado que los banners publicitarios no se visualizan correctamente cuando los usuarios acceden al sitio mediante **datos móviles (3G/4G/5G)**, aunque funcionan perfectamente en WiFi.

**Causas Principales Identificadas:**
1.  **Bloqueo a Nivel de ISP/DNS:** Muchos operadores móviles implementan filtros de contenido o DNS que bloquean dominios conocidos de publicidad (`crateworkshop.com`, `highperformanceformat.com`) por defecto para ahorrar ancho de banda.
2.  **Latencia y Timeouts:** Las conexiones móviles pueden tener mayor latencia. Si el script del anuncio tarda demasiado en cargar, el navegador puede cancelar la petición o dejar el espacio en blanco.
3.  **Data Saver (Ahorro de Datos):** Navegadores móviles (Chrome/Safari) en modo "Ahorro de datos" a menudo bloquean scripts de terceros.

## 2. Solución Implementada (`SmartAdUnit.tsx`)
Hemos robustecido el componente `SmartAdUnit` para manejar estos escenarios de manera proactiva:

### A. Timeout de Seguridad
Se ha añadido un temporizador de **5 segundos**.
- **Comportamiento:** Si el script del anuncio no envía la señal de "cargado" (`ad-loaded`) en 5 segundos (debido a lentitud o bloqueo silencioso), el sistema asume que ha fallado.
- **Resultado:** Se activa automáticamente el **Banner de Fallback** ("Tu marca aquí") en lugar de dejar un espacio vacío.

### B. Manejo de Errores de Red
Se ha mejorado la detección de eventos `onerror`.
- Si el dominio está bloqueado por el DNS del operador móvil, el evento `error` se dispara inmediatamente.
- **Acción:** El componente captura este error y muestra el fallback instantáneamente.

## 3. Verificación y Pruebas

### Plan de Pruebas
1.  **Prueba de WiFi (Control):**
    - Acceder al sitio desde WiFi.
    - **Resultado Esperado:** Se ve el anuncio real.

2.  **Prueba de Datos Móviles (Experimental):**
    - Desactivar WiFi en el móvil.
    - Recargar la página.
    - **Resultado Esperado:**
        - Si el operador permite el anuncio -> Se ve el anuncio real.
        - Si el operador bloquea el anuncio -> Se ve el banner interno ("Publicidad / Tu marca aquí") después de máx 5 segundos. **NUNCA** debe verse un espacio en blanco o roto.

## 4. Recomendaciones para el Servidor (Dokploy / HostGator)

Aunque la solución implementada es a nivel de cliente (Frontend), asegúrese de que su servidor no esté añadiendo cabeceras que bloqueen la carga.

1.  **Verificar Cabeceras CSP en Nginx/Dokploy:**
    Asegúrese de que su configuración de Nginx no esté sobrescribiendo la CSP que definimos en `middleware.ts`.
    
    *Si usa Nginx Proxy Manager o configuración manual en Dokploy, verifique que no exista una línea como:*
    `add_header Content-Security-Policy "default-src 'self'; ..."`
    
    Si existe, debe coincidir con la permisiva que configuramos en Next.js, incluyendo:
    `https://crateworkshop.com https://www.highperformanceformat.com`

2.  **CORS:**
    No se requieren cambios de CORS en su servidor, ya que los scripts se cargan desde dominios de terceros.

## 5. Conclusión
Con la actualización aplicada, la aplicación ahora es **resiliente a fallos de red**. No podemos forzar a un operador móvil a desbloquear un dominio de publicidad, pero **garantizamos que el diseño y la experiencia de usuario no se rompan**, mostrando siempre contenido relevante (publicidad interna) cuando la publicidad externa falla.
