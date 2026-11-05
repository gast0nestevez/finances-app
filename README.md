# Finanzas

Aplicación personal para llevar las finanzas del mes: sueldo, gastos fijos, gastos del día a día y un objetivo de inversión, para saber cuánto queda libre para gastar. Todo se puede ver en pesos argentinos (ARS) o en dólares (USD) con un toggle.

Está pensada para correr **localmente en tu PC**, sin cuentas ni servicios externos. La única llamada a internet es la consulta de la cotización del dólar MEP.

## Funcionalidades

- **Dashboard (`/`)**: resumen del mes (sueldo, fijos, inversión, gastos y libre), barra de distribución, selector de mes y toggle ARS/USD.
- **Gastos (`/expenses`)**: carga rápida de gastos del día a día con fecha, monto, moneda y categoría. Navegación por mes y totales.
- **Fijos (`/fixed`)**: gastos mensuales recurrentes, en ARS o USD, que se pueden activar y desactivar sin borrarlos.
- **Configuración (`/settings`)**: sueldo mensual, objetivo de inversión, cotización del dólar y lista editable de categorías.

### Cómo se calcula el libre

```
libre = sueldo − gastos fijos activos − objetivo de inversión − gastos del mes
```

- El sueldo se guarda por mes y se hereda hacia los meses siguientes hasta que lo cambies.
- El objetivo de inversión puede estar en dólares (por ejemplo 500 USD), por lo que su valor en pesos cambia con la cotización.
- Cada monto se guarda en su moneda original, como centavos enteros, y se convierte solo al mostrarlo.

### Cotización

Se usa el dólar MEP (precio de venta) de [dolarapi.com](https://dolarapi.com), que es una estimación y no tiene que ser exacta.

- Se consulta una vez por día y se guarda en la base.
- Si la API falla, se usa la última cotización guardada y se avisa que está desactualizada.
- Podés fijar una cotización manual del día en **Configuración**, que tiene prioridad sobre la de la API.
- Cada gasto del día a día guarda la cotización del momento en que lo cargaste, así los meses pasados no se mueven cuando cambia el dólar.

## Requisitos

- Node.js 22.12 o superior (desarrollado con Node 24).
- npm.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abrí <http://localhost:3000>. La primera vez se crea la base de datos y se aplican las migraciones automáticamente.

Para usarla en el día a día, conviene la versión de producción, que es más rápida:

```bash
npm run build
npm start
```

Por defecto escucha en el puerto 3000. Para cambiarlo: `PORT=4000 npm start`.

## Datos y backup

Todos los datos viven en un único archivo SQLite: `data/finances.db`. La carpeta `data/` no se versiona en git.

### Hacer un backup

```bash
npm run db:backup
```

Crea una copia con fecha y hora en `data/backups/`, por ejemplo `finances-2026-11-04_223037.db`. Se puede ejecutar con la app abierta.

> **No copies `finances.db` a mano mientras la app está corriendo.** La base usa el modo WAL de SQLite, así que los últimos cambios pueden estar en archivos auxiliares (`finances.db-wal`) y una copia directa quedaría incompleta. `npm run db:backup` usa la API de backup de SQLite y evita ese problema.

Los backups quedan en la misma carpeta que la base, así que **no te protegen si falla el disco**. Copiá de vez en cuando `data/backups/` a otro lugar (disco externo, nube, otra máquina).

Para guardar el backup en otra carpeta:

```bash
BACKUP_DIR=/ruta/a/mis/backups npm run db:backup
```

### Restaurar un backup

1. Detené la app.
2. Borrá los archivos auxiliares de la base actual, si existen: `data/finances.db-wal` y `data/finances.db-shm`.
3. Copiá el backup elegido sobre `data/finances.db`:

   ```bash
   cp data/backups/finances-2026-11-04_223037.db data/finances.db
   ```

4. Volvé a iniciar la app. Si el backup es de una versión anterior, las migraciones pendientes se aplican solas.

### Usar otra ubicación para la base

Con la variable `DATABASE_PATH`, que aplica a la app y a los comandos `db:*`:

```bash
DATABASE_PATH=/ruta/a/finances.db npm start
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm test` | Tests con Vitest |
| `npm run typecheck` | Chequeo de tipos con TypeScript |
| `npm run db:generate` | Genera una migración a partir de cambios en `src/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:backup` | Crea un backup consistente de la base |

## Stack

- [Next.js](https://nextjs.org) (App Router, server actions) con React y TypeScript estricto.
- [SQLite](https://www.sqlite.org) con [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) y [Drizzle ORM](https://orm.drizzle.team).
- [Zod](https://zod.dev) para validar formularios y respuestas externas.
- [Tailwind CSS](https://tailwindcss.com) para los estilos.
- [Vitest](https://vitest.dev) para los tests.

## Estructura

```
src/
  app/          Páginas, server actions y helpers de la UI
  components/   Componentes compartidos (formulario con feedback, estilos)
  db/           Esquema, cliente, repositorios y backup
  lib/          Lógica pura: dinero, conversión, resumen mensual, fechas, validaciones
  services/     Cotización del dólar (cliente de dolarapi y caché diaria)
drizzle/        Migraciones SQL generadas
```

La lógica de cálculo (`src/lib/`) no depende de la base ni de React, y es lo que más cubierta está por tests.

## Limitaciones conocidas

- Los meses pasados se calculan con los gastos fijos activos de hoy y la cotización actual. No se guarda un histórico de qué fijos existían ni a qué valor.
- Un gasto cargado con una fecha pasada usa la cotización de hoy, no la de esa fecha.
- Los gastos que no se repiten todos los meses (por ejemplo un seguro anual) todavía no están contemplados.
- Es de uso individual: no hay usuarios ni autenticación. No la expongas a internet.

## Convenciones del repositorio

Las reglas de código y de trabajo con Git están en [`CLAUDE.md`](CLAUDE.md).
