# Pruebas del Sistema de Moderación

Para ejecutar las pruebas unitarias, se recomienda instalar `jest` y `ts-jest`.

## Instalación

```bash
npm install --save-dev jest ts-jest @types/jest
npx ts-jest config:init
```

## Ejecución

```bash
npm test
```

## Estructura de Pruebas

*   `tests/moderation.test.ts`: Pruebas para la lógica de detección de referidos y cálculo de puntos.
*   Se pueden añadir más pruebas para componentes React usando `@testing-library/react`.
