# Sistema de Moderación y Administración - PromoCupones

## 1. Visión General
El sistema de moderación está diseñado para asegurar la calidad del contenido publicado en la plataforma, prevenir spam y gestionar el comportamiento de los usuarios mediante un sistema de roles y puntuación.

## 2. Roles y Permisos

| Rol | Descripción | Permisos |
| --- | --- | --- |
| **Usuario** | Usuario estándar registrado. | Publicar (sujeto a revisión), Comentar, Votar. |
| **Verificado** | Usuario con identidad confirmada. | Publicar (auto-aprobación en ciertas categorías), Comentar, Votar. |
| **Moderador** | Encargado de revisar contenido. | Aprobar/Rechazar publicaciones, Gestionar reportes, Ver logs básicos. |
| **Admin** | Control total del sistema. | Gestión de usuarios (banear), Configuración del sistema, Ver todos los logs. |

## 3. Flujo de Trabajo de Publicaciones

1.  **Envío**: El usuario envía una oferta.
    *   Si contiene enlaces de referidos, se verifica si el usuario tiene puntos suficientes.
    *   Si el usuario es Admin/Moderador, el estado inicial es `active`.
    *   De lo contrario, el estado inicial es `pending`.
2.  **Revisión**: Los moderadores ven las publicaciones en `pending` en el Panel de Moderación.
3.  **Acción**:
    *   **Aprobar**: La publicación pasa a `active`. El usuario recibe notificación y puntos.
    *   **Rechazar**: La publicación pasa a `rejected`. El usuario recibe notificación con la razón.
    *   **Revisión**: Se solicita cambios al usuario (estado `revision`).

## 4. Sistema de Puntuación (Karma)

Los puntos determinan los privilegios del usuario, especialmente para publicar enlaces de referidos.

*   **Publicación Aprobada**: +10 puntos
*   **Comentario Aprobado**: +2 puntos
*   **Voto Recibido**: +1 punto
*   **Reporte Válido**: +5 puntos
*   **Publicación Rechazada**: -5 puntos

### Niveles de Referidos
*   **0-100 puntos**: Sin referidos.
*   **101-500 puntos**: 1 referido por semana.
*   **501+ puntos**: 3 referidos por semana.

## 5. Detección Automática de Referidos
El sistema escanea automáticamente las URLs en busca de patrones conocidos (`ref=`, `affiliate=`, `amzn.to`, etc.). Si se detecta un referido y el usuario no tiene permisos, se bloquea la publicación.

## 6. Panel Administrativo
Ubicación: `/admin`

*   **Dashboard**: Métricas en tiempo real.
*   **Moderación**: Cola de publicaciones pendientes.
*   **Usuarios**: Gestión de usuarios y baneos.
*   **Notificaciones**: Centro de alertas.
*   **Logs**: Historial de acciones administrativas.

## 7. Manual de Procedimientos para Moderadores

### Cómo aprobar una publicación
1.  Vaya a `/admin/moderation`.
2.  Revise la imagen, título, precio y descripción.
3.  Verifique que el enlace funcione y corresponda a la oferta.
4.  Haga clic en "Aprobar".

### Cómo rechazar una publicación
1.  Si la oferta es falsa, spam, o viola las normas, haga clic en "Rechazar".
2.  Seleccione o escriba una razón clara (ej: "Precio incorrecto", "Enlace roto").
3.  Confirme el rechazo.

### Criterios de Rechazo Comunes
*   Imágenes de baja calidad o con marcas de agua de otros sitios.
*   Título engañoso o todo en mayúsculas.
*   Falta de precio o descripción insuficiente.
*   Enlaces de referidos no autorizados.

## 8. Arquitectura Técnica
*   **Backend**: Supabase (PostgreSQL) con RLS para seguridad.
*   **Frontend**: Next.js 14 (App Router).
*   **Estado**: React Context / Zustand.
*   **Estilos**: Tailwind CSS.

### Tablas Principales
*   `users`: Perfiles y roles.
*   `deals`: Publicaciones con estado (`pending`, `active`, etc.).
*   `moderation_logs`: Auditoría.
*   `referral_patterns`: Patrones de URLs bloqueadas.
*   `notifications`: Alertas para usuarios.
