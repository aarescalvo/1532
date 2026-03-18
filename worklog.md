---
Task ID: 152
Agent: main
Task: Desarrollar módulo Expedición 1/2 res y subir a GitHub

Work Log:
- **Schema Prisma actualizado**:
  * Nuevo modelo `Despacho`:
    - numero (correlativo), fecha, destino, direccionDestino
    - patenteCamion, patenteAcoplado, chofer, choferDni, transportista
    - remito, kgTotal, cantidadMedias
    - ticketPesajeId (relación con PesajeCamion para salida con mercadería)
    - estado (PENDIENTE, EN_CARGA, DESPACHADO, ENTREGADO, ANULADO)
  * Nuevo modelo `DespachoItem`:
    - Relación con Despacho y MediaRes
    - Datos denormalizados: tropaCodigo, garron, peso, usuarioId, usuarioNombre
  * Campo `usuarioFaenaId` agregado a MediaRes para trazabilidad por cliente
  * Relaciones actualizadas en Cliente, Operador, PesajeCamion, MediaRes

- **API de Expedición creada** (`/api/expedicion/route.ts`):
  * GET `tipo=stock`: Stock de cámaras agrupado por cámara → tropa → usuario
  * GET `tipo=medias`: Medias res disponibles para selección
  * GET `tipo=despachos`: Lista de despachos con filtros
  * GET `tipo=despacho`: Detalle de despacho por ID
  * POST `accion=crear`: Crear nuevo despacho con medias seleccionadas
  * POST `accion=agregarMedia`: Agregar media a despacho existente
  * POST `accion=quitarMedia`: Quitar media (restaura estado)
  * POST `accion=confirmar`: Confirmar despacho
  * POST `accion=anular`: Anular despacho

- **Componente de Expedición creado** (`/src/components/expedicion/index.tsx`):
  * Tab 1 - Stock por Cámara:
    - Cards expandibles por cámara
    - Desglose por tropa dentro de cada cámara
    - Desglose por usuario (cliente) dentro de cada tropa
    - Selección individual o por grupo ("Seleccionar todas")
    - Resumen flotante de selección (medias y kg)
    - Botón "Nuevo Despacho" cuando hay selección
  * Tab 2 - Despachos:
    - Tabla con todos los despachos
    - Columnas: N°, Fecha, Destino, Camión, Chofer, Kg, Medias, Estado
    - Badges de estado con colores
  * Dialog de nuevo despacho:
    - Formulario con todos los campos requeridos
    - Validación de destino obligatorio
    - Resumen de medias y kg
    - Botón crear con confirmación

- **Características del despacho**:
  * Soporta múltiples tropas, usuarios y destinos
  * Registro de datos del camión y chofer
  * Número de remito
  * Integración con ticket de pesaje de salida

- **Verificación**:
  * DB Push: Exitoso ✓
  * Lint: Sin errores ✓

Stage Summary:
- **Módulo Expedición 1/2 res completamente desarrollado**
- **API funcional** para todas las operaciones
- **UI completa** con selección múltiple y despacho
- **Permite despachos con múltiples tropas, usuarios y destinos**
- Pendiente: integrar componente en la navegación principal
- Pendiente: crear datos de prueba para expedición
- Subido a GitHub: https://github.com/aarescalvo/1532
