# Documentación Fase 2 - Seguridad Avanzada

## 1. Implementaciones Realizadas

### A. Autenticación de Dos Factores (MFA)
Se ha implementado una interfaz completa para activar y desactivar MFA (TOTP) en la configuración del usuario.
*   **Ubicación:** `/ajustes` -> Sección Seguridad -> "Autenticación en dos pasos (MFA)".
*   **Funcionalidad:**
    *   Generación de código QR.
    *   Verificación de código TOTP.
    *   Estado visual (Activado/Desactivado).
    *   Lógica para desactivar (requiere confirmación).
*   **Notas:** Supabase Auth maneja la validación en el login automáticamente si se configura como obligatorio (Assurance Level). Actualmente es opcional para el usuario.

### B. Protección CAPTCHA (Turnstile)
Se ha integrado Cloudflare Turnstile en los formularios de autenticación para prevenir bots.
*   **Ubicación:** `/auth/login` y `/auth/register`.
*   **Componente:** `src/components/Captcha.tsx`.
*   **Configuración:** Requiere la variable de entorno `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
    *   Si no está configurada, el captcha se oculta (modo dev seguro).
    *   Si está configurada, bloquea el envío del formulario hasta completar el desafío.
    *   El token se envía a Supabase Auth (`captchaToken`).

### C. Rate Limiting (Limitación de Tasa)
Se ha implementado un sistema de Rate Limiting basado en base de datos (PostgreSQL) para proteger Server Actions y endpoints críticos.
*   **Infraestructura:**
    *   Tabla `rate_limits` en Supabase.
    *   Función RPC `check_rate_limit(key, limit, window)`.
*   **Uso:**
    *   Importar `check_rate_limit` desde `@/lib/security-actions`.
    *   Ejemplo: `const { allowed } = await check_rate_limit('create_deal', 5, 60)` (5 intentos por minuto).

## 2. Configuración Requerida

Para activar completamente estas funciones en producción, configura las siguientes variables en Vercel/Supabase:

```env
# Cloudflare Turnstile (Obtener en dash.cloudflare.com)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_site_key_aqui
```

## 3. Próximos Pasos (Fase 3 - Monitoreo)
*   Crear dashboard de admin para visualizar `security_logs` y `rate_limits`.
*   Configurar alertas de Slack/Discord para eventos `suspicious_activity`.
