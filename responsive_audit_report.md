# Auditoría de Responsividad y Adaptabilidad Móvil - PromoCupones

## 1. Resumen Ejecutivo
El proyecto PromoCupones cuenta con una base sólida de diseño responsivo utilizando Tailwind CSS y una arquitectura de componentes moderna. Sin embargo, se han identificado áreas críticas de mejora en la experiencia móvil, particularmente en la visualización de tarjetas de ofertas, la optimización de imágenes y la consistencia en el espaciado.

## 2. Hallazgos Detallados

### 2.1. Tarjetas y Elementos de Visualización (`DealCard.tsx`)
**Estado Actual:**
- La tarjeta utiliza un diseño horizontal forzado (`flex-row`) incluso en móviles.
- La columna de imagen tiene un ancho fijo de `100px` en móvil, lo que es muy pequeño para apreciar detalles del producto.
- Los controles de votación en móvil se desplazan al pie de la columna de imagen, creando una estructura densa.
- El título se reduce drásticamente a `text-sm`, dificultando la lectura de ofertas importantes.

**Problemas Identificados:**
- **Visualización de Imagen:** 100px es insuficiente. Las imágenes de productos requieren más protagonismo.
- **Jerarquía Visual:** En móvil, el precio y el título compiten por espacio en una columna estrecha.
- **Galería:** La navegación por galería (dots/flechas) es difícil de usar en un área de 100px.

**Solución Propuesta:**
Transformar la tarjeta a un diseño vertical (stacked) en dispositivos móviles (< 768px) y mantener el diseño horizontal en escritorio.

```tsx
// Ejemplo de cambio de estructura
<div className="flex flex-col md:flex-row ...">
  {/* Imagen full width en móvil */}
  <div className="w-full md:w-[240px] h-[200px] md:h-auto ...">
    {/* ... */}
  </div>
  {/* Contenido debajo */}
  <div className="flex-1 p-4 ...">
    {/* ... */}
  </div>
</div>
```

### 2.2. Sistema de Grillas y Layouts
**Estado Actual:**
- `ClientLayout.tsx` maneja correctamente el padding del sidebar (`lg:pl-64`).
- El contenedor principal tiene `p-4` en móvil y `lg:p-8` en escritorio.
- El feed principal (`page.tsx`) usa `flex flex-col gap-4`.

**Problemas Identificados:**
- **Ancho de Línea:** En pantallas muy anchas (1920px+), una sola columna de tarjetas estiradas puede dificultar la lectura (líneas de texto muy largas en la descripción).
- **Aprovechamiento de Espacio:** En tablets, se sigue usando una sola columna, desperdiciando espacio horizontal.

**Solución Propuesta:**
- Implementar un grid responsive para pantallas grandes o limitar el ancho máximo del contenido de la tarjeta (`max-w-4xl mx-auto`).
- Mantener la lista vertical para el feed principal es aceptable si se controla el ancho máximo del texto.

### 2.3. Espaciado y Márgenes
**Estado Actual:**
- Se usa `gap-4` (16px) consistentemente.
- `p-4` en contenedores principales.

**Problemas Identificados:**
- En móviles pequeños (320px), el padding de 16px más los bordes de las tarjetas reduce el área de contenido a < 280px.
- La densidad de información en el header de la tarjeta (avatar, usuario, tiempo) es alta.

**Solución Propuesta:**
- Reducir padding lateral en móviles pequeños a `p-2` o `p-3` si es necesario.
- Aumentar el espaciado entre elementos táctiles (botones de acción).

### 2.4. Tipografía y Texto
**Estado Actual:**
- Títulos: `text-sm` (móvil) vs `text-xl` (desktop). El salto es brusco.
- Precios: `text-xl` vs `text-2xl`.

**Problemas Identificados:**
- `text-sm` (14px) para el título principal de una oferta en móvil es demasiado pequeño para ser el elemento más importante. Debería ser al menos `text-base` (16px) o `text-lg`.
- Textos legales o secundarios de `10px` pueden ser ilegibles en pantallas de baja densidad.

**Solución Propuesta:**
- Aumentar base del título móvil a `text-base` o `text-lg`.
- Asegurar contraste suficiente en textos gris sobre fondo oscuro (`text-zinc-500`).

### 2.5. Elementos Interactivos
**Estado Actual:**
- Botones de acción (share, save) tienen padding `p-2`.
- Iconos de `size={16}`.

**Problemas Identificados:**
- Área táctil: 16px + 16px (padding) = 32px. Esto está por debajo del estándar recomendado de 44px o 48px.
- Botones de paginación de galería en móvil son muy pequeños si se mantienen dentro de la columna de 100px.

**Solución Propuesta:**
- Aumentar `p-2` a `p-3` en móviles para botones de iconos.
- Aumentar tamaño de iconos a `size={20}` en móviles para facilitar la interacción.

### 2.6. Imágenes y Media
**Estado Actual:**
- `DealCard` usa `motion.img` con `src` directo.
- No se utiliza `next/image` en las tarjetas, perdiendo optimización automática (WebP, redimensionamiento).
- No hay `sizes` o `srcSet` definidos.

**Problemas Identificados:**
- **Performance:** Carga de imágenes completas (posiblemente 4K o sin comprimir) en contenedores de 100px. Consumo excesivo de datos móviles.
- **CLS (Cumulative Layout Shift):** Si no se definen dimensiones explícitas o aspect-ratio, el contenido puede saltar al cargar.

**Solución Propuesta:**
- Migrar a `next/image` o implementar un componente wrapper que genere `srcSet`.
- Definir `aspect-ratio` en el contenedor de imagen para evitar saltos.

---

## 3. Plan de Acción Priorizado

### Fase 1: Correcciones Críticas de UX Móvil (Alta Prioridad)
1.  **Rediseñar `DealCard` para Móvil:**
    - Cambiar a layout vertical (Stack).
    - Imagen de ancho completo con `aspect-ratio` fijo (ej. 16:9 o 4:3).
    - Aumentar tamaño de fuente del título.
    - Reubicar botones de votación para que sean más accesibles.

2.  **Optimización de Áreas Táctiles:**
    - Aumentar padding en botones de acción (`Share`, `Save`, `Comments`).
    - Asegurar altura mínima de 44px en botones e inputs.

### Fase 2: Performance y Optimización (Media Prioridad)
3.  **Implementar `next/image` en Tarjetas:**
    - Configurar dominios permitidos en `next.config.js`.
    - Reemplazar `img` por componente optimizado.

4.  **Ajustes de Tipografía Global:**
    - Revisar escala tipográfica en `globals.css` o configuración de Tailwind.
    - Asegurar legibilidad de textos auxiliares.

### Fase 3: Refinamiento Visual (Baja Prioridad)
5.  **Micro-interacciones:**
    - Mejorar feedback visual al tocar en móvil (estados active).
    - Ajustar animaciones para que no estorben la navegación rápida.

## 4. Ejemplos Técnicos

### Propuesta de Tarjeta Responsive (`DealCard.tsx`)

```tsx
<div className="flex flex-col md:flex-row ...">
  {/* Contenedor Imagen */}
  <div className="w-full md:w-[240px] h-[200px] md:h-auto relative">
     {/* Imagen con object-cover */}
  </div>
  
  {/* Contenido */}
  <div className="p-4 flex flex-col gap-2">
     <h3 className="text-lg md:text-xl font-bold ...">
       {deal.title}
     </h3>
     {/* ... */}
  </div>
</div>
```

---
Este informe sirve como hoja de ruta para las siguientes iteraciones de desarrollo.
