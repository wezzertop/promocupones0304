# Políticas de Seguridad - Promocupones

## 1. Control de Acceso y Autenticación
*   **MFA:** Se recomienda activar MFA para todos los administradores.
*   **Contraseñas:** Deben cumplir con los requisitos de Supabase (mínimo 6 caracteres, se recomienda >12).
*   **Roles:** 
    *   `admin`: Acceso total.
    *   `moderator`: Acceso a herramientas de moderación.
    *   `user`: Acceso estándar.
    *   Cambios de rol están restringidos por triggers de base de datos.

## 2. Protección de Datos
*   **RLS (Row Level Security):** Todas las tablas deben tener RLS habilitado.
*   **Logs:** Eventos críticos (login, cambios de rol) deben registrarse en `security_logs`.
*   **Datos Sensibles:** No almacenar PII (Información Personal Identificable) innecesaria.

## 3. Seguridad en Desarrollo
*   **Dependencias:** Auditar regularmente con `npm audit`.
*   **Secretos:** Nunca commitear `.env` o claves API. Usar variables de entorno.
*   **CSP:** Mantener la política de seguridad de contenido estricta en `middleware.ts`.

## 4. Respuesta a Incidentes
1.  **Detección:** Monitorear logs de Supabase y `security_logs`.
2.  **Contención:** Bloquear usuarios sospechosos desde el panel de Supabase.
3.  **Análisis:** Revisar IPs y patrones de ataque.
4.  **Remediación:** Parchear vulnerabilidades y rotar credenciales si es necesario.

---
*Documento vivo - Actualizar trimestralmente*
