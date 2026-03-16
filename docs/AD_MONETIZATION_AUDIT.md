# Auditoría del Sistema de Monetización y Publicidad

## 1. Resumen Ejecutivo
Se ha realizado un análisis exhaustivo del sistema de publicidad del proyecto Promocupones para identificar y resolver bloqueos de anuncios en conexiones HTTP/HTTPS y garantizar una visualización consistente.

**Estado Actual:**
- Los anuncios se sirven a través de iframes aislados (sandboxed).
- Se ha implementado un sistema de detección de bloqueadores de publicidad ("Smart Ad Unit").
- La Política de Seguridad de Contenido (CSP) se ha reforzado para permitir dominios de publicidad legítimos mientras se mantiene la seguridad.

## 2. Hallazgos y Soluciones

### 2.1. Bloqueo de Publicidad (Ad Blockers)
**Problema:** Los bloqueadores de anuncios a nivel de navegador (extensiones) o red (DNS/Firewall) impiden la carga de scripts de terceros (`crateworkshop.com`, `highperformanceformat.com`).
**Solución Implementada (`SmartAdUnit.tsx`):**
- Se creó un componente inteligente que encapsula la lógica de carga de anuncios.
- **Mecanismo de Detección:** El iframe del anuncio intenta cargar el script y notifica al componente padre mediante `postMessage` si la carga es exitosa (`ad-loaded`) o fallida (`ad-error` / `onerror`).
- **Fallback:** Si se detecta un bloqueo o error de carga, se muestra automáticamente un banner interno ("Publicidad / Tu marca aquí") que no depende de scripts externos.

### 2.2. Problemas de Contenido Mixto (HTTP vs HTTPS)
**Problema:** Los navegadores modernos bloquean contenido HTTP (inseguro) en sitios HTTPS.
**Solución Implementada:**
- Se forzó el uso de `https:` en todas las URLs de scripts de publicidad.
- La configuración de CSP y `Strict-Transport-Security` garantiza que no se permitan conexiones inseguras.
- El middleware fuerza `upgrade-insecure-requests`.

### 2.3. Content Security Policy (CSP)
**Problema:** Una CSP estricta puede bloquear scripts o frames de dominios no autorizados.
**Solución Implementada (`middleware.ts`):**
- Se añadieron explícitamente los dominios de publicidad a las directivas `script-src`, `frame-src` y `connect-src`.
- Configuración actual:
  ```
  AD_DOMAINS = 'https://crateworkshop.com https://www.highperformanceformat.com'
  script-src ... ${AD_DOMAINS} ...
  frame-src ... ${AD_DOMAINS} ...
  connect-src ... ${AD_DOMAINS} ...
  ```

### 2.4. Aislamiento y Seguridad
**Implementación:**
- Los anuncios se renderizan dentro de iframes con atributo `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"`.
- Esto previene que scripts maliciosos accedan al contexto principal de la aplicación (cookies, tokens, etc.), pero permite que los anuncios funcionen correctamente.

## 3. Pruebas de Rendimiento y Validación

### 3.1. Validación de Certificados SSL/TLS
- Los dominios de publicidad (`crateworkshop.com`) soportan HTTPS.
- La aplicación fuerza HTTPS mediante HSTS.

### 3.2. Pruebas de Carga
- El componente `SmartAdUnit` maneja los estados de carga asíncrona.
- Si el script del anuncio tarda en cargar o falla, no bloquea el renderizado del resto de la página.

## 4. Plan de Acción Futuro

1.  **Monitoreo de Impresiones:**
    - Implementar un sistema de analíticas para rastrear cuántas veces se muestra el banner de fallback vs el anuncio real. Esto ayudará a estimar el impacto de los bloqueadores de anuncios en los ingresos.
    
2.  **Diversificación de Redes de Anuncios:**
    - Considerar integrar otras redes de publicidad (Google AdSense, Media.net) para tener alternativas si una red específica es bloqueada o tiene bajo rendimiento.

3.  **Venta Directa de Espacios:**
    - El sistema de "Fallback" ya está preparado visualmente para mostrar publicidad propia o vendida directamente. Se recomienda desarrollar un panel de administración para gestionar estos espacios internos.

4.  **Optimización Móvil:**
    - Revisar periódicamente las métricas de CLS (Cumulative Layout Shift) causadas por la carga de anuncios y ajustar las alturas reservadas (`min-height`) en los contenedores para mejorar la experiencia de usuario y el SEO.
