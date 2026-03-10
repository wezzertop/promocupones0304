# Plan de Pruebas para TestSprite - Promocupones

Este documento define la estrategia de pruebas para el proyecto Promocupones, diseñado para ser consumido por agentes de prueba como TestSprite o ejecutado manualmente.

## 1. Estrategia General
El objetivo es asegurar la calidad de los flujos críticos de la plataforma comunitaria de ofertas.
**Stack de Pruebas:** Vitest (Unit/Integration), Testing Library (Component).

## 2. Escenarios de Prueba (User Flows)

### 2.1 Flujo de Usuario Visitante (Guest)
**Objetivo:** Verificar que un usuario no autenticado puede consumir contenido pero no interactuar.
1.  **Navegación Home:**
    *   Cargar página principal.
    *   Verificar presencia de Header, Buscador y Lista de Ofertas.
    *   Verificar que las ofertas muestran título, precio y votos.
2.  **Búsqueda y Filtros:**
    *   Usar barra de búsqueda con término "laptop".
    *   Verificar resultados relevantes.
    *   Aplicar filtro de categoría "Tecnología".
3.  **Detalle de Oferta:**
    *   Clic en una oferta.
    *   Verificar detalles (precio, descripción, tienda).
    *   Intentar votar o comentar -> Debe redirigir a Login o mostrar modal de registro.

### 2.2 Flujo de Usuario Registrado
**Objetivo:** Verificar interacciones principales de la comunidad.
1.  **Autenticación:**
    *   Login exitoso con credenciales válidas.
    *   Verificar redirección a Home o Dashboard.
2.  **Publicación de Oferta:**
    *   Navegar a "/publicar".
    *   Llenar formulario (Título, Precio, Link, Descripción, Categoría).
    *   Subir imagen (mock).
    *   Publicar -> Verificar mensaje de éxito y estado "pendiente" (si aplica moderación).
3.  **Interacción Social:**
    *   Votar positivo en una oferta (+1). Verificar cambio de temperatura.
    *   Publicar un comentario en una oferta.
    *   Verificar que el comentario aparece en la lista.

### 2.3 Sistema de Gamificación
**Objetivo:** Verificar que las acciones otorgan experiencia (XP) y suben nivel.
1.  **Ganancia de XP:**
    *   Simular acción de voto -> Verificar incremento de XP.
    *   Simular racha diaria -> Verificar bono de XP.
2.  **Niveles:**
    *   Verificar cálculo de progreso de nivel (Unit Test en `gamification.test.ts`).

### 2.4 Sistema de Moderación
**Objetivo:** Verificar filtros de contenido y roles.
1.  **Detección de Spam:**
    *   Intentar publicar oferta con enlace de referido bloqueado.
    *   Verificar rechazo o marcado automático.
2.  **Acciones de Moderador:**
    *   Login como Admin/Mod.
    *   Aprobar oferta pendiente.
    *   Verificar que la oferta pasa a estado "active".

## 3. Pruebas Unitarias Existentes
Ubicación: `/tests`
*   `gamification.test.ts`: Lógica de niveles y límites de referidos.
*   `moderation.test.ts`: Detección de patrones de URL y sistema de puntos.
*   `schemas.test.ts`: Validación de datos con Zod.

## 4. Comandos de Ejecución
*   Ejecutar todas las pruebas: `npm test`
*   Ejecutar pruebas con UI (si configurado): `npm test -- --ui`
