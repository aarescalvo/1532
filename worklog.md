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

### Versión actual: **0.7.0**
### Próxima versión sugerida: **0.8.0**
