'use client'

import { useState } from 'react'
import {
  FileText, Download, Send, AlertCircle, CheckCircle, Clock, FileBarChart, RefreshCw, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador { id: string; nombre: string; rol: string }

interface ReporteSenasa {
  id: string; fecha: string; tipoReporte: string; periodo: string
  estado: 'PENDIENTE' | 'ENVIADO' | 'ERROR'; mensajeError?: string
}

const TIPOS_REPORTE = [
  { value: 'faena_mensual', label: 'Faena Mensual' },
  { value: 'existencias', label: 'Existencias' },
  { value: 'movimientos', label: 'Movimientos' },
  { value: 'decomisos', label: 'Decomisos' }
]

const REPORTES_SIMULADOS: ReporteSenasa[] = [
  { id: '1', fecha: '2024-01-15', tipoReporte: 'Faena Mensual', periodo: 'Enero 2024', estado: 'ENVIADO' },
  { id: '2', fecha: '2024-01-14', tipoReporte: 'Existencias', periodo: 'Semana 2 - Enero', estado: 'ENVIADO' },
  { id: '3', fecha: '2024-01-13', tipoReporte: 'Movimientos', periodo: 'Semana 2 - Enero', estado: 'PENDIENTE' },
  { id: '4', fecha: '2024-01-12', tipoReporte: 'Decomisos', periodo: 'Semana 2 - Enero', estado: 'ERROR', mensajeError: 'Error de conexión con servidor SENASA' },
  { id: '5', fecha: '2024-01-10', tipoReporte: 'Faena Mensual', periodo: 'Diciembre 2023', estado: 'ENVIADO' },
  { id: '6', fecha: '2024-01-08', tipoReporte: 'Existencias', periodo: 'Semana 1 - Enero', estado: 'ENVIADO' },
  { id: '7', fecha: '2024-01-05', tipoReporte: 'Movimientos', periodo: 'Semana 1 - Enero', estado: 'PENDIENTE' },
  { id: '8', fecha: '2024-01-03', tipoReporte: 'Decomisos', periodo: 'Semana 1 - Enero', estado: 'ERROR', mensajeError: 'Formato de archivo inválido' }
]

export function ReportesSenasaModule({ operador }: { operador: Operador }) {
  const { editMode, getTexto } = useEditor()
  const [reportes, setReportes] = useState<ReporteSenasa[]>(REPORTES_SIMULADOS)
  const [tipoReporte, setTipoReporte] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [generando, setGenerando] = useState(false)

  const totalReportes = reportes.length
  const enviados = reportes.filter((r) => r.estado === 'ENVIADO').length
  const pendientes = reportes.filter((r) => r.estado === 'PENDIENTE').length
  const conError = reportes.filter((r) => r.estado === 'ERROR').length

  const generarReporte = async () => {
    if (!tipoReporte) { toast.error('Seleccione un tipo de reporte'); return }
    if (!fechaDesde || !fechaHasta) { toast.error('Seleccione el rango de fechas'); return }
    setGenerando(true); toast.info('Generando reporte...')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const tipoSeleccionado = TIPOS_REPORTE.find((t) => t.value === tipoReporte)
    const nuevoReporte: ReporteSenasa = { id: Date.now().toString(), fecha: new Date().toISOString().split('T')[0], tipoReporte: tipoSeleccionado?.label || 'Desconocido', periodo: `${fechaDesde} - ${fechaHasta}`, estado: 'PENDIENTE' }
    setReportes([nuevoReporte, ...reportes]); setGenerando(false); toast.success('Reporte generado exitosamente')
    setTipoReporte(''); setFechaDesde(''); setFechaHasta('')
  }

  const handleDescargar = (reporte: ReporteSenasa) => { toast.success(`Descargando reporte: ${reporte.tipoReporte}`); setTimeout(() => { toast.success('Archivo descargado: reporte_senasa_' + reporte.id + '.pdf') }, 1000) }

  const handleReenviar = async (reporte: ReporteSenasa) => {
    toast.info(`Reenviando reporte: ${reporte.tipoReporte}`)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setReportes(reportes.map((r) => r.id === reporte.id ? { ...r, estado: 'ENVIADO', mensajeError: undefined } : r))
    toast.success('Reporte reenviado exitosamente a SENASA')
  }

  const getEstadoBadge = (estado: ReporteSenasa['estado']) => {
    switch (estado) {
      case 'ENVIADO': return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /><TextoEditable id="estado-enviado-senasa" original="ENVIADO" tag="span" /></Badge>
      case 'PENDIENTE': return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /><TextoEditable id="estado-pendiente-senasa" original="PENDIENTE" tag="span" /></Badge>
      case 'ERROR': return <Badge className="bg-red-100 text-red-700"><AlertCircle className="w-3 h-3 mr-1" /><TextoEditable id="estado-error-senasa" original="ERROR" tag="span" /></Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800"><TextoEditable id="titulo-reportes-senasa" original="Reportes SENASA" tag="span" /></h1>
              <p className="text-stone-500"><TextoEditable id="subtitulo-reportes-senasa" original="Generación y envío de reportes al Servicio Nacional de Sanidad y Calidad Agroalimentaria" tag="span" /></p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.success('Lista de reportes actualizada')}><RefreshCw className="w-4 h-4 mr-2" /><TextoEditable id="btn-actualizar-senasa" original="Actualizar" tag="span" /></Button>
          </div>
        </EditableBlock>

        {/* Summary Cards */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-stone-100 rounded-lg"><FileBarChart className="w-5 h-5 text-stone-600" /></div><div><p className="text-2xl font-bold text-stone-800">{totalReportes}</p><p className="text-xs text-stone-500"><TextoEditable id="label-total-reportes-senasa" original="Total Reportes" tag="span" /></p></div></div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-700">{enviados}</p><p className="text-xs text-stone-500"><TextoEditable id="label-enviados-senasa" original="Enviados" tag="span" /></p></div></div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-700">{pendientes}</p><p className="text-xs text-stone-500"><TextoEditable id="label-pendientes-senasa" original="Pendientes" tag="span" /></p></div></div></CardContent></Card>
            <Card className="border-0 shadow-md bg-white"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-700">{conError}</p><p className="text-xs text-stone-500"><TextoEditable id="label-con-error-senasa" original="Con Error" tag="span" /></p></div></div></CardContent></Card>
          </div>
        </EditableBlock>

        {/* Generador de Reportes */}
        <EditableBlock bloqueId="generador" label="Generador de Reportes">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-stone-800"><FileText className="w-5 h-5 text-amber-500" /><TextoEditable id="titulo-generar-reporte" original="Generar Nuevo Reporte" tag="span" /></CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label className="text-sm text-stone-600"><TextoEditable id="label-tipo-reporte-senasa" original="Tipo de Reporte" tag="span" /></Label><Select value={tipoReporte} onValueChange={setTipoReporte}><SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger><SelectContent>{TIPOS_REPORTE.map((tipo) => (<SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-sm text-stone-600"><TextoEditable id="label-fecha-desde-senasa" original="Fecha Desde" tag="span" /></Label><Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full" /></div>
                <div className="space-y-2"><Label className="text-sm text-stone-600"><TextoEditable id="label-fecha-hasta-senasa" original="Fecha Hasta" tag="span" /></Label><Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full" /></div>
                <div className="flex items-end"><Button onClick={generarReporte} disabled={generando} className="w-full bg-amber-500 hover:bg-amber-600 text-white">{generando ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /><TextoEditable id="btn-generando-senasa" original="Generando..." tag="span" /></> : <><FileText className="w-4 h-4 mr-2" /><TextoEditable id="btn-generar-reporte" original="Generar Reporte" tag="span" /></>}</Button></div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla de Reportes */}
        <EditableBlock bloqueId="tabla" label="Historial de Reportes">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-stone-800"><FileBarChart className="w-5 h-5 text-amber-500" /><TextoEditable id="titulo-historial-senasa" original="Historial de Reportes" tag="span" /></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reportes.length === 0 ? <div className="p-8 text-center text-stone-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p><TextoEditable id="msg-sin-reportes-senasa" original="No hay reportes generados" tag="span" /></p></div> :
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><TextoEditable id="th-fecha-senasa" original="Fecha" tag="span" /></TableHead>
                    <TableHead><TextoEditable id="th-tipo-senasa" original="Tipo Reporte" tag="span" /></TableHead>
                    <TableHead><TextoEditable id="th-periodo-senasa" original="Período" tag="span" /></TableHead>
                    <TableHead><TextoEditable id="th-estado-senasa" original="Estado" tag="span" /></TableHead>
                    <TableHead className="text-right"><TextoEditable id="th-acciones-senasa" original="Acciones" tag="span" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportes.map((reporte) => (
                    <TableRow key={reporte.id}>
                      <TableCell className="font-medium">{new Date(reporte.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-stone-400" />{reporte.tipoReporte}</div></TableCell>
                      <TableCell className="text-stone-600">{reporte.periodo}</TableCell>
                      <TableCell><div className="flex flex-col gap-1">{getEstadoBadge(reporte.estado)}{reporte.mensajeError && <span className="text-xs text-red-500">{reporte.mensajeError}</span>}</div></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleDescargar(reporte)} title="Descargar"><Download className="w-4 h-4 text-stone-500" /></Button>
                          {(reporte.estado === 'PENDIENTE' || reporte.estado === 'ERROR') && <Button variant="ghost" size="sm" onClick={() => handleReenviar(reporte)} title="Reenviar a SENASA"><Send className="w-4 h-4 text-amber-500" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>}
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Footer Info */}
        <div className="text-center text-xs text-stone-400">
          <p><TextoEditable id="footer-senasa-1" original="Los reportes son enviados automáticamente al sistema de SENASA" tag="span" /></p>
          <p className="mt-1"><TextoEditable id="footer-senasa-2" original="Última sincronización:" tag="span" /> {new Date().toLocaleString('es-AR')}</p>
        </div>
      </div>
    </div>
  )
}

export default ReportesSenasaModule
