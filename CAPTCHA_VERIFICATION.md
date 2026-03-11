# Verificación de Seguridad del Captcha

## 1. Verificación en Frontend (Implementada)
Hemos implementado una validación estricta en el cliente. El formulario **NO** se enviará si el Captcha no ha sido completado.

### Prueba Manual:
1.  Ve a la página de Login o Registro.
2.  Rellena los campos (email/password).
3.  **NO** hagas clic en el Captcha.
4.  Intenta enviar el formulario.
5.  **Resultado esperado:** Debería aparecer un mensaje de error: *"Por favor completa el captcha."* y no debería realizarse ninguna petición a Supabase (puedes verificarlo en la pestaña Network de las herramientas de desarrollador F12).

## 2. Verificación en Backend (Supabase)
Para que la seguridad sea completa (y evitar que alguien llame a la API directamente saltándose el frontend), debes habilitar la protección en Supabase.

### Pasos de Configuración:
1.  Ve a tu **Supabase Dashboard**.
2.  Navega a **Authentication** > **Rate Limits & Security** (o **Security**).
3.  Busca la sección **"Bot Protection"** o **"Captcha Protection"**.
4.  Habilita **"Enable Captcha Protection"**.
5.  Selecciona **"Cloudflare Turnstile"** como proveedor.
6.  Introduce tu `Site Key` y `Secret Key` (que obtienes en el dashboard de Cloudflare).
7.  Guarda los cambios.

Una vez activado en Supabase, cualquier petición de login/registro que no incluya un token válido será rechazada automáticamente por el servidor con un error 400/403, incluso si un atacante intenta usar `curl` o Postman.

## Resumen
*   ✅ **Frontend:** Bloqueo implementado. El usuario no puede avanzar sin captcha.
*   ✅ **Token:** Se envía correctamente a Supabase en la petición de autenticación.
*   ⚠️ **Backend:** Requiere activación manual en el panel de Supabase para ser efectivo contra ataques directos a la API.
