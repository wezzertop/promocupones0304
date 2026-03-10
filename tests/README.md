# Pruebas del Sistema - Promocupones

Este proyecto utiliza **Vitest** para pruebas unitarias y de integración.

## Instalación de Dependencias

Asegúrate de haber instalado las dependencias del proyecto:

```bash
npm install
```

## Ejecución de Pruebas

Para ejecutar la suite de pruebas completa:

```bash
npm test
```

Para ejecutar en modo "watch" (desarrollo):

```bash
npx vitest
```

## Estructura

*   `tests/gamification.test.ts`: Lógica de niveles y gamificación.
*   `tests/moderation.test.ts`: Sistema de moderación y detección de spam.
*   `tests/schemas.test.ts`: Validaciones de esquemas de datos.

## Plan de Pruebas (TestSprite)

Consulta `TESTSPRITE_PLAN.md` en la raíz del proyecto para ver la estrategia completa de pruebas y flujos de usuario.
