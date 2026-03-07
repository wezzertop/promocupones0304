# Informe de Auditoría y Plan de Implementación - Fase 2

## 1. Resumen Ejecutivo
La "Fase 2" se centra en la optimización profunda del sistema, abordando deuda técnica crítica, cuellos de botella de rendimiento y vulnerabilidades de seguridad. El análisis ha revelado problemas significativos en la capa de datos (problema N+1) y en la seguridad de las notificaciones, así como oportunidades de refactorización para mejorar la mantenibilidad del código.

## 2. Hallazgos y Análisis

### 2.1. Rendimiento (Criticidad: Alta)
*   **Problema N+1 en `DealCard`**: Actualmente, cada tarjeta de oferta realiza 2 peticiones independientes al cargar en el cliente (`votes` y `saves`). En un feed de 20 ofertas, esto genera **40 peticiones adicionales** innecesarias al cargar la página, saturando la red y la base de datos.
*   **Carga de Imágenes**: Aunque se inició la migración a `next/image`, aún existen componentes (avatares en comentarios, header) que usan `<img>` estándar.
*   **Bundle Size**: Uso de `framer-motion` sin `LazyMotion` puede inflar el bundle inicial.

### 2.2. Seguridad (Criticidad: Alta)
*   **Vulnerabilidad en Notificaciones**: La política RLS de la tabla `notifications` permite `INSERT` a cualquier usuario autenticado (`WITH CHECK (true)`). Esto es un vector de riesgo para spam o acoso, permitiendo que un usuario malintencionado inunde de notificaciones a otros.
*   **Validación de Roles**: Aunque existen triggers, la lógica de validación de roles en el cliente y servidor a veces es redundante o confusa.

### 2.3. Arquitectura y Calidad de Código (Criticidad: Media)
*   **Deuda Técnica en Tipado**: Uso extensivo de `any` en `DealCard.tsx` y `page.tsx` para manejar relaciones de Supabase (ej. `(deal as any).comments`). Esto anula los beneficios de TypeScript y propensa a errores en tiempo de ejecución.
*   **Componentes Monolíticos**: `DealCard.tsx` tiene más de 600 líneas, mezclando lógica de UI, lógica de negocio (votos), y manejo de eventos. Dificulta el mantenimiento y testing.
*   **Manejo de Errores UX**: Uso de `alert('Error...')` nativo del navegador para feedback al usuario. Interrumpe la experiencia y luce poco profesional.

### 2.4. Funcionalidades Pendientes
*   **Skeletons de Carga**: No hay estados de carga visuales (skeletons) para el feed principal, causando un "salto" de contenido (CLS) al cargar.
*   **Sistema de Reportes**: El modal de reportes existe pero falta integración completa con un dashboard de administración efectivo.

---

## 3. Plan de Implementación Priorizado

### Hito 1: Optimización de Datos y Rendimiento (Inmediato)
**Objetivo**: Eliminar el problema N+1 y reducir la carga inicial en un 60%.

1.  **Refactorizar Fetching en `page.tsx`**:
    *   Implementar una consulta optimizada que traiga los datos de la oferta Y el estado del usuario (voto/guardado) en una sola pasada (o dos consultas en paralelo batch).
    *   Técnica: Usar `Promise.all` para traer `deals` y luego `my_votes` / `my_saves` filtrando por los IDs de las ofertas traídas, y mezclarlos en memoria antes de renderizar.
2.  **Actualizar `DealCard`**:
    *   Eliminar `useEffect` de carga inicial.
    *   Recibir `initialUserVote` e `initialIsSaved` como props.

### Hito 2: Seguridad y Estabilidad (Corto Plazo)
**Objetivo**: Cerrar vectores de ataque y mejorar la robustez.

1.  **Hardening de Notificaciones**:
    *   Modificar política RLS de `notifications` para permitir `INSERT` solo desde funciones del sistema (Security Definer) o administradores.
2.  **Tipado Estricto**:
    *   Actualizar interfaces en `types/index.ts` para reflejar las relaciones de Supabase correctamente (ej. `DealWithRelations`).
    *   Eliminar `any` en componentes principales.

### Hito 3: Arquitectura y UX (Medio Plazo)
**Objetivo**: Mejorar la experiencia de desarrollo y de usuario.

1.  **Atomización de Componentes**:
    *   Dividir `DealCard` en: `DealHeader`, `DealImageGallery`, `DealActions`, `DealVoteControl`.
2.  **Sistema de Feedback UI**:
    *   Implementar `ToastContext` o usar `sonner` / `react-hot-toast` para reemplazar `alert()`.
3.  **Skeletons**:
    *   Crear `DealCardSkeleton` y usarlo en `loading.tsx` de Next.js.

---

## 4. Recursos Necesarios
*   Acceso a Supabase Dashboard (para políticas RLS).
*   Tiempo estimado Hito 1: 3-4 horas.
*   Tiempo estimado Hito 2: 2 horas.

## 5. Criterios de Aceptación (Hito 1)
*   [ ] Carga de la página de inicio realiza **máximo 3 consultas** a Supabase (Auth + Deals + UserData), independientemente del número de ofertas.
*   [ ] `DealCard` no tiene `useEffect` para fetch de datos.
*   [ ] Tiempos de carga percibidos (LCP) mejoran en un 20%.

---
Este informe define la hoja de ruta para la Fase 2. Procederé inmediatamente con el **Hito 1** si estás de acuerdo.
