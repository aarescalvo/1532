---
Task ID: 152
Agent: main
Task: Desarrollar módulo Despacho 1/2 Res y Facturación

Work Log - Actualización:

## Correcciones de Terminología
- **Expedición → Despacho**: Módulo renombrado de "Expedición" a "Despacho 1/2 Res"
- **Usuario/Cliente**: El que faena en el frigorífico con número de matrícula (al que se factura)
- **Operador**: El que usa el sistema de trazabilidad
- **Expedición** se reserva para productos elaborados en Ciclo II

## Mejoras al Módulo Despacho (ex Expedición)

### Nueva columna de KG por Usuario
- Tabla de despachos ahora muestra usuarios agrupados con sus KG
- Badge con cantidad de KG por cada usuario/cliente
- Soporte para múltiples usuarios en un mismo despacho

### Ticket de Pesaje (Salida de Mercadería)
- Campos agregados:
  - N° Ticket (automático o manual)
  - Peso Bruto (kg)
  - Peso Tara (kg)
  - Peso Neto (calculado automáticamente)
- Se crea PesajeCamion tipo SALIDA_MERCADERIA asociado al despacho

### Mejoras de Funcionalidad
- **Ver Detalle**: Dialog con información completa del despacho
  - Datos del transporte
  - Ticket de pesaje con KG
  - Resumen por usuario/cliente
  - Tabla de medias con todos los datos
- **Anular Despacho**: 
  - Confirmación antes de anular
  - Restaura medias al stock de cámaras
- **Opción al crear despacho**:
  - "Crear y Facturar Después"
  - "Crear y Facturar Ahora" (abre modal de facturación)

### API Actualizada
- Nuevos endpoints para detalle de despacho
- Agrupación de usuarios en la respuesta
- Soporte para ticket de pesaje al crear despacho

## Módulo de Facturación - Rediseño Completo

### Pestaña 1: Facturación desde Despacho
- Lista de despachos pendientes de facturar
- Usuarios por despacho con sus KG
- Al seleccionar:
  - Pre-carga usuarios como items
  - Campo para precio por KG (editable)
  - Cálculo automático de subtotal, IVA y total
  - Selección de cliente
  - Observaciones

### Pestaña 2: Facturación Otros Items
- Tipos de productos:
  - Servicio Desposte
  - Venta de Menudencias
  - Venta de Carne
  - Venta de Cortes
  - Servicio de Frío
  - Otros
- Agregar múltiples items
- Precios sugeridos por tipo de producto
- Cálculo de totales con IVA

### Pestaña 3: Histórico de Facturas
- Búsqueda por número o cliente
- Filtro por estado (Pendiente, Emitida, Pagada, Anulada)
- Acciones:
  - Ver detalle completo
  - Editar (requiere PIN supervisor)
  - Anular (requiere PIN supervisor)
- Tabla con número, fecha, cliente, subtotal, IVA, total, estado

### Modelos de Precios Creados
- **PrecioCliente**:
  - clienteId, tipoProducto, precioKg
  - fechaDesde, fechaHasta (vigencia)
  - activo
- **HistorialPrecio**:
  - Registro de cambios de precio
  - precioAnterior, precioNuevo
  - fechaCambio, operadorId
- **TipoProductoPrecio** (enum):
  - MEDIA_RES_BOVINA, MEDIA_RES_EQUINA
  - CUARTO_DELANTERO, CUARTO_TRASERO
  - MENUDENCIA, SERVICIO_DESPOSTE
  - SERVICIO_FRIO, CARNE_CORTE, OTRO

### API de Facturación
- GET despachos-pendientes: Despachos sin factura
- GET despacho: Detalle para facturar
- GET facturas: Lista con filtros
- GET factura: Detalle por ID
- GET precios-cliente: Precios vigentes por cliente
- GET clientes: Usuarios de faena
- POST crear-desde-despacho: Crear factura
- POST crear-otros-items: Crear factura de otros
- POST actualizar: Editar factura
- POST anular: Anular factura
- POST guardar-precio: Guardar precio de cliente

## Archivos Modificados/Creados

### Nuevos
- `src/components/despacho/index.tsx` (renombrado de expedicion)
- `src/components/facturacion/index.tsx` (rediseñado)
- `src/app/api/facturacion/route.ts` (nuevo)

### Actualizados
- `prisma/schema.prisma`: Modelos PrecioCliente, HistorialPrecio
- `src/app/api/expedicion/route.ts`: Soporte para usuarios y ticket
- `src/app/page.tsx`: Referencias actualizadas

## Verificación
- DB Push: Exitoso ✓
- Lint: Sin errores ✓
- Servidor: Funcionando ✓

Stage Summary:
- **Módulo Despacho mejorado** con KG por usuario, ticket pesaje, detalle y anulación
- **Facturación completa** con 3 pestañas funcionales
- **Modelos de precios** para historial por cliente
- **Autorización supervisor** para editar/anular facturas
- Precios por KG, variables por cliente, historial completo
- Facturas por despacho individual con opción de facturar al crear

---
Task ID: 153
Agent: main
Task: Finalización y sincronización - v0.7.0

Work Log:
- Actualización de versión: 0.6.0 → 0.7.0
- Verificación de lint: Sin errores
- Commit: "Mejoras módulo Despacho y Facturación"
- Push a GitHub: bf6c7de..4a678ab master -> master

Stage Summary:
- Versión actualizada a 0.7.0
- Código subido a GitHub correctamente
- Sistema funcionando sin errores

---
Task ID: 154
Agent: main
Task: Agregar sección de verificación de errores comunes - v0.7.1

Work Log:
- Creada sección "ERRORES COMUNES A VERIFICAR" en worklog
- Agregada tabla de errores históricos con soluciones
- Creada sección de comandos de verificación post-modificación
- Agregados comandos de emergencia
- Definido flujo de trabajo recomendado
- Verificación: package.json válido ✓, lint sin errores ✓, dev log limpio ✓

Stage Summary:
- Documentación de errores comunes completada
- Sistema de verificación post-modificación implementado
- Versión actualizada a 0.7.1

---
Task ID: 155
Agent: main
Task: Agregar Reglas de Oro al worklog - v0.7.2

Work Log:
- Agregada sección "REGLAS DE ORO (OBLIGATORIO)"
- Regla 1: NUNCA hacer force push
- Regla 2: Proponer mejoras siempre que sea posible
- Regla 3: Consultar ante dudas de funcionamiento
- Regla 4: Proteger datos y código existente
- Regla 5: Commits descriptivos

Stage Summary:
- Reglas de oro documentadas para evitar pérdida de avances
- Versión actualizada a 0.7.2

---
Task ID: 156
Agent: main
Task: Sistema de Protección de Datos y Versiones Estables - v0.8.0

Work Log:
- Creada estructura de carpetas: releases/, docs/, scripts/, backups/
- Creado script de backup diario: scripts/backup-db.sh
- Creado script de release: scripts/create-release.sh
- Creado instalador: install.sh
- Creados instructivos:
  - docs/INSTALL.md (Guía de instalación)
  - docs/MANUAL.md (Manual de usuario)
  - docs/BACKUP.md (Guía de backup y restauración)
- Actualizado .gitignore para backups y releases
- Configuración de rama production y tags

Stage Summary:
- Sistema de backup diario implementado (90 días retención)
- Sistema de releases con programa completo + instaladores + instructivos
- Tags en git + rama production para versiones estables
- Documentación completa de instalación, uso y backup
- Versión actualizada a 0.8.0 (minor por nuevo sistema)

---

## 📋 CHECKLIST DE FINALIZACIÓN (OBLIGATORIO)

Al terminar CADA sesión de trabajo, verificar:

| Item | Comando/Acción | Estado |
|------|----------------|--------|
| 1. Lint | `bun run lint` | [ ] Sin errores |
| 2. Versión | Editar package.json | [ ] Incrementada |
| 3. Worklog | Editar worklog.md | [ ] Actualizado |
| 4. Git Add | `git add -A` | [ ] Hecho |
| 5. Git Commit | `git commit -m "mensaje"` | [ ] Hecho |
| 6. Git Push | `git push origin master` | [ ] Hecho |
| 7. Dev Log | `tail -30 dev.log` | [ ] Verificado |

### Formato de versión:
- **Major (X.0.0)**: Cambios grandes/nuevos módulos
- **Minor (0.X.0)**: Nuevas funcionalidades
- **Patch (0.0.X)**: Bug fixes, mejoras menores

### Versión actual: **0.8.0**
### Próxima versión sugerida: **0.8.1**

---

## ⚠️ ERRORES COMUNES A VERIFICAR (OBLIGATORIO)

### Errores que hemos tenido en el pasado:

| Error | Causa | Cómo detectar | Solución |
|-------|-------|---------------|----------|
| **package.json corrupto** | Edición parcial, JSON mal formado | `cat package.json \| head -60` verificar sintaxis | Restaurar o corregir JSON manualmente |
| **Schema Prisma sin sincronizar** | Modelo creado pero sin `db:push` | Error: "Table doesn't exist" | `bun run db:push` |
| **Imports rotos** | Archivo renombrado/movido sin actualizar imports | `bun run lint` muestra error | Buscar y corregir imports |
| **Tipo TypeScript incorrecto** | Campo agregado/eliminado del schema | Error en compilación | Regenerar tipos: `bun run db:generate` |
| **API no responde** | Error en el handler, try/catch silencioso | `tail -50 dev.log` ver errores | Revisar logs y corregir |
| **Componente no renderiza** | Import incorrecto o props faltantes | Console del navegador (F12) | Verificar imports y props |
| **Base de datos bloqueada** | SQLite con transacción abierta | Error: "database is locked" | Reiniciar servidor dev |

### Verificación post-modificación:

```bash
# 1. Verificar package.json válido
cat package.json | head -10

# 2. Verificar lint sin errores
bun run lint

# 3. Verificar schema sincronizado
bun run db:push

# 4. Verificar servidor funcionando
tail -30 dev.log | grep -i "error"

# 5. Verificar tipos TypeScript (si hubo cambios en schema)
bun run db:generate
```

### Comandos de emergencia:

```bash
# Restaurar package.json desde git
git checkout HEAD -- package.json

# Regenerar cliente Prisma
bun run db:generate

# Reiniciar base de datos (PELIGROSO - borra datos)
bun run db:reset

# Ver diferencias con GitHub
git diff origin/master
```

---

## 📝 REGISTRO DE ERRORES HISTÓRICOS

| Fecha | Error | Solución | Archivos afectados |
|-------|-------|----------|-------------------|
| 2024-xx-xx | package.json JSON mal formado (coma faltante) | Corregir sintaxis JSON manualmente | package.json |
| 2024-xx-xx | Módulo "expedicion" renombrado a "despacho" sin actualizar imports | Actualizar todos los imports | page.tsx, route.ts |
| 2024-xx-xx | Error ENOENT fallback-build-manifest.json | Error temporal de compilación, se resolvió solo | .next/ |

---

## 🔄 FLUJO DE TRABAJO RECOMENDADO

1. **Antes de empezar**: `tail -20 dev.log` (verificar estado servidor)
2. **Después de modificar archivos**: `bun run lint`
3. **Si se modifica schema**: `bun run db:push` + `bun run db:generate`
4. **Antes de commit**: Verificar package.json válido
5. **Después de push**: `tail -20 dev.log` (verificar sin errores)

---

## 🚨 REGLAS DE ORO (OBLIGATORIO)

### 1. NUNCA hacer force push
```bash
# ❌ PROHIBIDO - Puede perder avances del programa
git push --force
git push -f

# ✅ CORRECTO - Push normal
git push origin master

# ✅ Si hay conflictos, resolver primero
git pull --rebase origin master
# Resolver conflictos, luego:
git push origin master
```

### 2. Proponer mejoras siempre que sea posible
- Si veo código que se puede optimizar → **proponerlo**
- Si hay funcionalidades faltantes → **sugerir agregarlas**
- Si hay patrones mejores → **mencionarlos**

### 3. Consultar ante dudas de funcionamiento
- No asumir cómo funciona algo → **PREGUNTAR**
- Si el usuario no especificó algo → **CONSULTAR antes de implementar**
- Mejor preguntar que implementar mal

### 4. Proteger datos y código existente
- **NUNCA** eliminar datos sin confirmar
- **NUNCA** usar `git reset --hard` sin autorización
- **NUNCA** usar `bun run db:reset` sin autorización (borra toda la BD)
- Siempre hacer backup antes de operaciones riesgosas

### 5. Commits descriptivos
```bash
# ❌ Malo
git commit -m "fix"

# ✅ Bueno
git commit -m "Corregir cálculo de IVA en facturación - redondeo a 2 decimales"
```

---

## 🛡️ SISTEMA DE PROTECCIÓN DE DATOS

### Estructura de Carpetas

```
frigorifico-sistema/
├── backups/              # Backups locales de BD
│   ├── backup-YYYY-MM-DD-HHMM.db
│   └── backup.log
├── releases/             # Versiones estables
│   ├── vX.X.X.tar.gz     # Release comprimido
│   ├── vX.X.X.tar.gz.sha256
│   └── vX.X.X/           # Release descomprimido (no subir)
│       ├── programa/
│       ├── instructivos/
│       ├── install.sh
│       └── RELEASE-INFO.md
├── docs/                 # Instructivos
│   ├── INSTALL.md
│   ├── MANUAL.md
│   └── BACKUP.md
└── scripts/              # Scripts de utilidad
    ├── backup-db.sh
    └── create-release.sh
```

### Comandos del Sistema

```bash
# Backup manual de BD
./scripts/backup-db.sh

# Crear release/versión estable
./scripts/create-release.sh

# Instalar desde release
./install.sh
```

### Sistema de Versiones

| Tipo | Comando | Uso |
|------|---------|-----|
| **Tags** | `git tag -a v0.8.0 -m "mensaje"` | Marcar versiones |
| **Push tags** | `git push origin v0.8.0` | Subir a GitHub |
| **Rama production** | `git checkout -b production` | Solo versiones estables |

### Flujo de Release

```
master (desarrollo continuo)
    │
    ├── Todo funciona ✓
    ├── Tests pasan ✓
    ├── Lint sin errores ✓
    │
    ▼
Crear release:
1. Actualizar versión en package.json
2. ./scripts/create-release.sh
3. git add -A && git commit
4. git tag -a vX.X.X -m "Release vX.X.X"
5. git push origin master --tags
6. (Opcional) Merge a production
```

### Backup Diario (Cron)

```bash
# Editar crontab
crontab -e

# Backup diario a las 2:00 AM
0 2 * * * /ruta/al/proyecto/scripts/backup-db.sh
```

### Recuperación de Emergencia

1. **BD corrupta**: Restaurar desde `/backups/`
2. **Sistema dañado**: Descargar último release de GitHub
3. **Todo perdido**: Clonar repo + restaurar BD desde backup
