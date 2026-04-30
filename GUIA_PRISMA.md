# Guia Prisma - Soy Conservacion

Esta guia explica el flujo recomendado para trabajar con Prisma en este proyecto.
Esta pensada para onboarding de equipo y para evitar errores comunes con migraciones.

## 1) Contexto rapido del proyecto

- ORM: Prisma 7.x
- Base de datos: PostgreSQL
- Ubicacion del schema: `backend/prisma/schema.prisma`
- Config de Prisma 7: `backend/prisma.config.ts`
- Variables de entorno: `backend/.env`

## 2) Requisitos previos

1. Tener PostgreSQL instalado y corriendo.
2. Tener creada la base de datos local `soy_conservacion`.
3. Tener Node.js y pnpm instalados.
4. Haber instalado dependencias del backend:

```bash
cd backend
pnpm install
```

## 3) Configuracion inicial (solo primera vez)

1. Crea o revisa el archivo `backend/.env`.
2. Configura `DATABASE_URL` con tus credenciales locales.

Ejemplo:

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/soy_conservacion?schema=public"
```

3. Valida que Prisma pueda leer el schema:

```bash
cd backend
pnpm prisma validate
```

## 4) Comandos Prisma del proyecto

Todos se ejecutan dentro de `backend`.

- `pnpm prisma:format`
: Formatea `schema.prisma`.

- `pnpm prisma validate`
: Valida sintaxis y relaciones del schema.

- `pnpm prisma:generate`
: Genera Prisma Client en `node_modules/@prisma/client`.

- `pnpm prisma:migrate -- --name <nombre_migracion>`
: Crea y aplica una migracion en desarrollo.

- `pnpm prisma:db-push`
: Sincroniza schema a DB sin crear migracion (usar solo en escenarios especificos).

- `pnpm prisma:studio`
: Abre interfaz visual para explorar tablas y datos.

## 5) Flujo correcto para cambios de base de datos (equipo)

Usar siempre este flujo cuando cambies modelos, campos o relaciones.

1. Edita el archivo `backend/prisma/schema.prisma`.
2. Formatea el schema:

```bash
pnpm prisma:format
```

3. Valida que no haya errores:

```bash
pnpm prisma validate
```

4. Crea y aplica la migracion:

```bash
pnpm prisma:migrate -- --name descripcion_corta_del_cambio
```

5. Regenera cliente Prisma:

```bash
pnpm prisma:generate
```

6. Revisa que la migracion exista en:
- `backend/prisma/migrations/<timestamp>_<nombre>/migration.sql`

7. Verifica tablas/datos en Prisma Studio:

```bash
pnpm prisma:studio
```

8. Sube al repo:
- Cambios de `schema.prisma`
- Carpeta de migracion generada
- Cualquier ajuste de codigo relacionado

## 6) Convenciones recomendadas para migraciones

1. Usa nombres claros de migracion, por ejemplo:
- `add_estado_to_observaciones`
- `create_inaturalist_observaciones`
- `add_unique_username`

2. Haz migraciones pequenas y con un solo objetivo.
3. No mezcles cambios de DB no relacionados en la misma migracion.
4. Antes de hacer commit, ejecuta:

```bash
pnpm prisma validate
pnpm prisma:generate
```

## 7) Cuando usar `migrate` vs `db push`

Usa `prisma migrate dev` cuando:
- Estas trabajando en features reales.
- El cambio debe quedar versionado para todo el equipo.
- Quieres trazabilidad y despliegue consistente.

Usa `prisma db push` cuando:
- Estas prototipando algo local y temporal.
- No necesitas dejar historial de migracion.

Regla de equipo:
- Para trabajo compartido y ramas de feature, usar `migrate`.
- Evitar `db push` como flujo principal.

## 8) Flujo sugerido para una rama nueva

```bash
git checkout develop
git pull origin develop
git checkout -b feature/cambio-db
cd backend
pnpm prisma validate
pnpm prisma:migrate -- --name nombre_del_cambio
pnpm prisma:generate
```

Al terminar:

```bash
git add .
git commit -m "feat(db): describe cambio"
git push -u origin feature/cambio-db
```

## 9) Troubleshooting (errores comunes)

### Error: credenciales o conexion PostgreSQL

Sintoma:
- Prisma no conecta a `localhost:5432`.

Revision:
1. Verifica que PostgreSQL este encendido.
2. Revisa usuario/password en `DATABASE_URL`.
3. Confirma que la DB `soy_conservacion` existe.

### Error: schema invalido

Sintoma:
- `prisma validate` falla por relaciones o tipos.

Revision:
1. Corre `pnpm prisma:format`.
2. Revisa nombres de campos en `@relation(fields: [...], references: [...])`.
3. Confirma que campos FK tengan el mismo tipo que su PK relacionada.

### Error: migracion en conflicto

Sintoma:
- Prisma reporta drift o estado distinto entre schema y DB.

Revision:
1. Asegura que estas en la rama correcta y actualizada.
2. Revisa la carpeta `backend/prisma/migrations`.
3. Si el conflicto es de entorno local, coordina antes de resetear DB.

## 10) Checklist rapido antes de abrir PR

1. `pnpm prisma validate` ejecuta sin errores.
2. `pnpm prisma:generate` ejecuta sin errores.
3. La migracion nueva existe y tiene nombre claro.
4. `schema.prisma` y migracion quedaron en el commit.
5. Probaste el flujo en local (Studio o endpoints).

## 11) Nota importante de Prisma 7 en este repo

Este proyecto usa `prisma.config.ts` para indicar:
- ruta del schema
- ruta de migraciones
- URL de datasource tomada desde `process.env.DATABASE_URL`

Por eso, la URL no esta hardcodeada en `schema.prisma`.

## 12) Nota PostGIS (geom)

Existe una migracion que agrega columnas `geom` y triggers para indices GiST en:

- `observaciones`
- `inaturalist_observaciones`

Estas columnas son administradas por SQL y no se usan desde Prisma Client.
Si necesitas exponerlas en Prisma, primero valida compatibilidad con `Unsupported("geometry")`.

---

Si vas a hacer un cambio grande de modelo (renombrar tablas, dividir entidades, cambios de datos existentes), avisa al equipo antes de migrar para acordar estrategia y evitar perdida de datos.
