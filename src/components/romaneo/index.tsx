'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Scale, Printer, RefreshCw, User, Warehouse, ChevronUp, ChevronDown,
  CheckCircle, AlertTriangle, RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

const DIENTES = ['0', '2', '4', '6', '8']
const SIGLAS = ['A', 'T', 'D']

interface Tipificador {
  id: string
  nombre: string
  apellido: string
  matricula: string
}

interface Camara {
  id: string
  nombre: string
  capacidad: number
}

interface MediaPesada {
  id: string
  garron: number
  lado: string
  peso: number
  siglas: string[]
  fecha: Date
  tropaCodigo: string | null
  tipoAnimal: string | null
}

interface AsignacionGarron {
  garron: number
  animalId: string | null
  animalCodigo: string | null
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  tieneMediaDer: boolean
  tieneMediaIzq: boolean
}

interface Operador {
  id: string
  nombre: string
  nivel: string
  rol?: string
  permisos?: Record<string, boolean>
}

export function RomaneoModule({ operador }: { operador: Operador }) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  
  // Configuración del turno
  const [tipificadorId, setTipificadorId] = useState('')
  const [camaraId, setCamaraId] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  
  // Estado del pesaje
  const [garronActual, setGarronActual] = useState(1)
  const [ladoActual, setLadoActual] = useState<'DERECHA' | 'IZQUIERDA'>('DERECHA')
  const [pesoBalanza, setPesoBalanza] = useState('')
  const [denticion, setDenticion] = useState('')
  const [asignacionActual, setAsignacionActual] = useState<AsignacionGarron | null>(null)
  
  // Historial
  const [mediasPesadas, setMediasPesadas] = useState<MediaPesada[]>([])
  
  // Último rótulo para reimprimir
  const [ultimoRotulo, setUltimoRotulo] = useState<MediaPesada | null>(null)
  
  // Datos maestros
  const [tipificadores, setTipificadores] = useState<Tipificador[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [garronesAsignados, setGarronesAsignados] = useState<AsignacionGarron[]>([])
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tipRes, camRes, garronesRes] = await Promise.all([
        fetch('/api/tipificadores'),
        fetch('/api/camaras'),
        fetch('/api/garrones-asignados')
      ])
      
      const tipData = await tipRes.json()
      const camData = await camRes.json()
      const garronesData = await garronesRes.json()
      
      if (tipData.success) {
        setTipificadores(tipData.data || [])
        if (tipData.data?.length > 0) {
          setTipificadorId(tipData.data[0].id)
        }
      }
      
      if (camData.success) {
        const camarasFaena = (camData.data || []).filter((c: Camara) => c.tipo === 'FAENA')
        setCamaras(camarasFaena)
        if (camarasFaena.length > 0) {
          setCamaraId(camarasFaena[0].id)
        }
      }
      
      if (garronesData.success) {
        setGarronesAsignados(garronesData.data || [])
        
        const pendientes = (garronesData.data || []).filter((g: AsignacionGarron) => 
          !g.tieneMediaDer || !g.tieneMediaIzq
        )
        
        if (pendientes.length > 0) {
          const primero = pendientes[0]
          setGarronActual(primero.garron)
          setAsignacionActual(primero)
          setLadoActual(primero.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
        } else if (garronesData.data?.length > 0) {
          const ultimo = garronesData.data[garronesData.data.length - 1]
          setGarronActual(ultimo.garron + 1)
          setAsignacionActual(null)
          setLadoActual('DERECHA')
        }
      }
      
      if (!tipificadorId || !camaraId) {
        setConfigOpen(true)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCapturarPeso = useCallback(() => {
    const peso = pesoBalanza || (Math.random() * 50 + 100).toFixed(1)
    setPesoBalanza(peso)
  }, [pesoBalanza])

  const handleAceptarPeso = async () => {
    if (!pesoBalanza || parseFloat(pesoBalanza) <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }
    
    if (!tipificadorId || !camaraId) {
      setConfigOpen(true)
      toast.error('Configure tipificador y cámara primero')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/romaneo/pesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          denticion: denticion,
          tipificadorId,
          camaraId,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        handleImprimirRotulos(garronActual, ladoActual, parseFloat(pesoBalanza))
        
        const nuevaMedia: MediaPesada = {
          id: data.data.id,
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          fecha: new Date(),
          tropaCodigo: asignacionActual?.tropaCodigo || null,
          tipoAnimal: asignacionActual?.tipoAnimal || null
        }
        setMediasPesadas(prev => [...prev, nuevaMedia])
        setUltimoRotulo(nuevaMedia)
        
        toast.success(`Media ${ladoActual === 'DERECHA' ? 'derecha' : 'izquierda'} registrada - 3 rótulos impresos`)
        
        setPesoBalanza('')
        
        if (asignacionActual) {
          const actualizado = { ...asignacionActual }
          if (ladoActual === 'DERECHA') {
            actualizado.tieneMediaDer = true
          } else {
            actualizado.tieneMediaIzq = true
          }
          setAsignacionActual(actualizado)
        }
        
        if (ladoActual === 'DERECHA') {
          setLadoActual('IZQUIERDA')
        } else {
          const nuevosGarrones = [...garronesAsignados]
          if (asignacionActual) {
            const idx = nuevosGarrones.findIndex(g => g.garron === garronActual)
            if (idx >= 0) {
              nuevosGarrones[idx] = {
                ...nuevosGarrones[idx],
                tieneMediaDer: true,
                tieneMediaIzq: true
              }
            }
          }
          
          const siguientePendiente = nuevosGarrones.find(g => 
            !g.tieneMediaDer || !g.tieneMediaIzq
          )
          
          if (siguientePendiente) {
            setGarronActual(siguientePendiente.garron)
            setAsignacionActual(siguientePendiente)
            setLadoActual(siguientePendiente.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
          } else {
            const nuevoGarron = Math.max(...nuevosGarrones.map(g => g.garron), 0) + 1
            setGarronActual(nuevoGarron)
            setLadoActual('DERECHA')
            setAsignacionActual(null)
            toast.info('No hay más garrones pendientes')
          }
          
          setDenticion('')
          setGarronesAsignados(nuevosGarrones)
        }
      } else {
        toast.error(data.error || 'Error al registrar peso')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimirRotulos = async (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number) => {
    try {
      // Buscar el rótulo configurado para MEDIA_RES
      const rotulosRes = await fetch('/api/rotulos?tipo=MEDIA_RES&activo=true')
      const rotulosData = await rotulosRes.json()
      
      // Buscar el rótulo default o el primero activo
      const rotulo = rotulosData.find((r: any) => r.esDefault) || rotulosData[0]
      
      if (!rotulo) {
        // Si no hay rótulo configurado, usar el método anterior (HTML)
        imprimirRotuloHTML(garron, lado, peso)
        return
      }

      // Preparar datos para el rótulo
      const fecha = new Date()
      const fechaVenc = new Date(fecha.getTime() + (rotulo.diasConsumo || 30) * 24 * 60 * 60 * 1000)
      const tipificador = tipificadores.find(t => t.id === tipificadorId)
      const camara = camaras.find(c => c.id === camaraId)
      
      const datosRotulo = {
        // Fechas
        fecha: formatearFecha(fecha),
        fecha_faena: formatearFecha(fecha),
        fecha_venc: formatearFecha(fechaVenc),
        fecha_vencimiento: formatearFecha(fechaVenc),
        
        // Tropa y animal
        tropa: asignacionActual?.tropaCodigo || '-',
        tropa_codigo: asignacionActual?.tropaCodigo || '-',
        garron: String(garron).padStart(3, '0'),
        numero_garron: String(garron).padStart(3, '0'),
        correlativo: String(garron).padStart(4, '0'),
        
        // Pesos
        peso: peso.toFixed(1),
        peso_kg: peso.toFixed(1) + ' KG',
        peso_vivo: asignacionActual?.pesoVivo?.toFixed(0) || '-',
        
        // Producto
        producto: 'MEDIA RES',
        nombre_producto: 'MEDIA RES',
        tipo_animal: asignacionActual?.tipoAnimal || '-',
        
        // Lado y sigla
        lado: lado === 'DERECHA' ? 'D' : 'I',
        lado_media: lado,
        
        // Dentición
        denticion: denticion || '-',
        dientes: denticion || '-',
        
        // Establecimiento (estos datos deberían venir de configuración)
        establecimiento: 'SOLEMAR ALIMENTARIA',
        nombre_establecimiento: 'SOLEMAR ALIMENTARIA',
        
        // Tipificador
        tipificador: tipificador ? `${tipificador.nombre} ${tipificador.apellido}` : '-',
        matricula: tipificador?.matricula || '-',
        
        // Cámara
        camara: camara?.nombre || '-',
        
        // Código de barras
        codigo_barras: `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}`,
      }

      // Imprimir 3 rótulos (A, T, D)
      for (const sigla of SIGLAS) {
        const datosConSigla = {
          ...datosRotulo,
          sigla: sigla,
          sigla_media: sigla,
          codigo_barras: `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}`
        }
        
        // Llamar al API de impresión
        const printRes = await fetch('/api/rotulos/imprimir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rotuloId: rotulo.id,
            datos: datosConSigla,
            cantidad: 1
          })
        })
        
        const printData = await printRes.json()
        
        if (printData.success && printData.contenido) {
          // Copiar al portapapeles o mostrar para imprimir
          console.log(`Rótulo ${sigla} generado:`, printData.contenido)
        }
      }
      
      // Mostrar contenido generado para que el usuario pueda imprimir
      toast.success(`3 rótulos generados para garrón #${garron}`, {
        description: `Usando plantilla: ${rotulo.nombre}`
      })
      
    } catch (error) {
      console.error('Error al imprimir:', error)
      // Fallback a HTML
      imprimirRotuloHTML(garron, lado, peso)
    }
  }

  // Función de fallback para impresión HTML
  const imprimirRotuloHTML = (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) {
      toast.error('No se pudo abrir ventana de impresión')
      return
    }
    
    const tipificador = tipificadores.find(t => t.id === tipificadorId)
    const camara = camaras.find(c => c.id === camaraId)
    const fecha = new Date()
    const fechaStr = fecha.toLocaleDateString('es-AR')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rótulos Garrón ${garron} - ${lado}</title>
        <style>
          @page { size: 100mm 70mm; margin: 3mm; }
          body { font-family: Arial, sans-serif; padding: 5px; margin: 0; }
          .rotulo { 
            border: 2px solid black; 
            padding: 5px; 
            margin-bottom: 3mm;
            page-break-after: always;
            width: 94mm;
            height: 64mm;
            box-sizing: border-box;
          }
          .header { text-align: center; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px; }
          .empresa { font-size: 14px; font-weight: bold; }
          .campo { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
          .sigla { font-size: 28px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 3px; margin: 3px 0; }
          .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 18px; text-align: center; margin-top: 3px; }
          .lado { font-size: 12px; text-align: center; font-weight: bold; background: ${lado === 'DERECHA' ? '#e3f2fd' : '#fce4ec'}; padding: 2px; }
        </style>
      </head>
      <body>
        ${SIGLAS.map(sigla => `
          <div class="rotulo">
            <div class="header">
              <div class="empresa">SOLEMAR ALIMENTARIA</div>
              <div style="font-size: 9px;">Media Res - Faena</div>
            </div>
            <div class="lado">${lado === 'DERECHA' ? 'MEDIA DERECHA' : 'MEDIA IZQUIERDA'}</div>
            <div class="campo"><span>Garrón:</span><span style="font-weight: bold; font-size: 14px;">${garron}</span></div>
            <div class="campo"><span>Tropa:</span><span>${asignacionActual?.tropaCodigo || '-'}</span></div>
            <div class="campo"><span>Tipo:</span><span>${asignacionActual?.tipoAnimal || '-'}</span></div>
            <div class="campo"><span>Peso:</span><span style="font-weight: bold;">${peso.toFixed(1)} kg</span></div>
            <div class="campo"><span>Cámara:</span><span>${camara?.nombre || '-'}</span></div>
            ${denticion ? `<div class="campo"><span>Dentición:</span><span>${denticion} dientes</span></div>` : ''}
            <div class="sigla">${sigla}</div>
            <div style="text-align: center; font-size: 10px;">${sigla === 'A' ? 'Asado' : sigla === 'T' ? 'Trasero' : 'Delantero'}</div>
            <div class="barcode">*${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}*</div>
            ${tipificador ? `<div style="text-align: center; font-size: 8px; margin-top: 2px;">Tip.: ${tipificador.nombre} ${tipificador.apellido} - Mat. ${tipificador.matricula}</div>` : ''}
          </div>
        `).join('')}
        <script>
          window.onload = function() { 
            window.print(); 
            window.onafterprint = function() { window.close(); } 
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Helper para formatear fechas
  const formatearFecha = (fecha: Date): string => {
    const dia = String(fecha.getDate()).padStart(2, '0')
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const anio = fecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  }

  const handleReimprimirUltimo = () => {
    if (ultimoRotulo) {
      handleImprimirRotulos(ultimoRotulo.garron, ultimoRotulo.lado as 'DERECHA' | 'IZQUIERDA', ultimoRotulo.peso)
      toast.success('Reimprimiendo últimos rótulos')
    } else {
      toast.error('No hay rótulos para reimprimir')
    }
  }

  const handleCambiarGarron = async (delta: number) => {
    const nuevoGarron = Math.max(1, garronActual + delta)
    const asignacion = garronesAsignados.find(g => g.garron === nuevoGarron)
    setGarronActual(nuevoGarron)
    setAsignacionActual(asignacion || null)
    
    if (asignacion?.tieneMediaDer && !asignacion?.tieneMediaIzq) {
      setLadoActual('IZQUIERDA')
      // Cargar dentición existente del garrón si ya se pesó la primera media
      try {
        const res = await fetch(`/api/romaneo/denticion?garron=${nuevoGarron}`)
        const data = await res.json()
        if (data.success && data.denticion) {
          setDenticion(data.denticion)
        }
      } catch (e) {
        console.error('Error cargando dentición:', e)
      }
    } else {
      setLadoActual('DERECHA')
      // Resetear dentición para nuevo garrón
      setDenticion('')
    }
    
    setPesoBalanza('')
  }

  const getTotalKg = () => {
    return mediasPesadas.reduce((acc, m) => acc + m.peso, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Scale className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">
                <TextoEditable id="romaneo-titulo" original="Romaneo - Pesaje de Medias" tag="span" />
              </h1>
              <p className="text-stone-500">
                <TextoEditable id="romaneo-subtitulo" original="Pesaje y rotulado de medias reses" tag="span" />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
                <User className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-configurar" original="Configurar" tag="span" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReimprimirUltimo} disabled={!ultimoRotulo}>
                <RotateCcw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-reimprimir" original="Reimprimir" tag="span" />
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Configuración activa */}
        <EditableBlock bloqueId="configuracionActiva" label="Configuración">
          <Card className="border-0 shadow-sm bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4 text-amber-600" />
                    <strong><TextoEditable id="label-tipificador" original="Tipificador" tag="span" />:</strong> {tipificadores.find(t => t.id === tipificadorId)?.nombre || 'Sin asignar'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Warehouse className="w-4 h-4 text-amber-600" />
                    <strong><TextoEditable id="label-camara" original="Cámara" tag="span" />:</strong> {camaras.find(c => c.id === camaraId)?.nombre || 'Sin asignar'}
                  </span>
                </div>
                <Badge variant="outline">
                  {mediasPesadas.length} <TextoEditable id="label-medias-pesadas" original="medias pesadas" tag="span" /> - {getTotalKg().toFixed(1)} kg
                </Badge>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Panel principal de pesaje */}
          <EditableBlock bloqueId="panelPesaje" label="Panel de Pesaje">
            <Card className="lg:col-span-2 border-0 shadow-md">
              <CardHeader className="bg-stone-50 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <TextoEditable id="label-pesaje-actual" original="Pesaje Actual" tag="span" />
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCambiarGarron(-1)}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold text-amber-600 min-w-[60px] text-center">
                      #{garronActual}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleCambiarGarron(1)}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Datos del animal */}
                {asignacionActual ? (
                  <div className="grid grid-cols-4 gap-2 p-3 bg-stone-50 rounded-lg text-sm">
                    <div>
                      <span className="text-stone-500 block"><TextoEditable id="label-tropa" original="Tropa" tag="span" /></span>
                      <span className="font-medium">{asignacionActual.tropaCodigo || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block"><TextoEditable id="label-tipo" original="Tipo" tag="span" /></span>
                      <span className="font-medium">{asignacionActual.tipoAnimal || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block"><TextoEditable id="label-p-vivo" original="P. Vivo" tag="span" /></span>
                      <span className="font-medium">{asignacionActual.pesoVivo?.toFixed(0) || '-'} kg</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block"><TextoEditable id="label-estado" original="Estado" tag="span" /></span>
                      <span className="font-medium">
                        {asignacionActual.tieneMediaDer && asignacionActual.tieneMediaIzq ? '✓ Completo' : 
                         asignacionActual.tieneMediaDer ? <TextoEditable id="msg-falta-izq" original="Falta Izq" tag="span" /> : <TextoEditable id="msg-falta-der" original="Falta Der" tag="span" />}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    <TextoEditable id="msg-no-hay-animal" original="No hay animal asignado al garrón" tag="span" /> {garronActual}
                  </div>
                )}

                <Separator />

                {/* Lado actual */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={ladoActual === 'DERECHA' ? 'default' : 'outline'}
                    className={`h-12 px-8 ${ladoActual === 'DERECHA' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => setLadoActual('DERECHA')}
                    disabled={asignacionActual?.tieneMediaDer}
                  >
                    <TextoEditable id="btn-derecha" original="DERECHA" tag="span" /> {asignacionActual?.tieneMediaDer && <CheckCircle className="w-4 h-4 ml-2" />}
                  </Button>
                  <Button
                    variant={ladoActual === 'IZQUIERDA' ? 'default' : 'outline'}
                    className={`h-12 px-8 ${ladoActual === 'IZQUIERDA' ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                    onClick={() => setLadoActual('IZQUIERDA')}
                    disabled={!asignacionActual?.tieneMediaDer || asignacionActual?.tieneMediaIzq}
                  >
                    <TextoEditable id="btn-izquierda" original="IZQUIERDA" tag="span" /> {asignacionActual?.tieneMediaIzq && <CheckCircle className="w-4 h-4 ml-2" />}
                  </Button>
                </div>

                {/* Peso */}
                <div className="text-center">
                  <Label className="text-lg"><TextoEditable id="label-peso-kg" original="Peso (kg)" tag="span" /></Label>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Input
                      type="number"
                      value={pesoBalanza}
                      onChange={(e) => setPesoBalanza(e.target.value)}
                      className="text-4xl font-bold text-center h-20 w-48"
                      placeholder="0"
                      step="0.1"
                    />
                    <Button variant="outline" size="lg" onClick={handleCapturarPeso}>
                      <Scale className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Dentición */}
                <div className="space-y-2">
                  <Label>
                    <TextoEditable id="label-denticion" original="Dentición" tag="span" />
                    {asignacionActual?.tieneMediaDer && (
                      <span className="ml-2 text-xs text-amber-600 font-normal">(Fijado para este garrón)</span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    {DIENTES.map((d) => (
                      <Button
                        key={d}
                        variant={denticion === d ? 'default' : 'outline'}
                        className={`flex-1 h-12 ${denticion === d ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                        onClick={() => setDenticion(d)}
                        // Bloquear cambio de dentición si ya se pesó la primera media de este garrón
                        disabled={asignacionActual?.tieneMediaDer && denticion !== '' && denticion !== d}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                  {asignacionActual?.tieneMediaDer && denticion && (
                    <p className="text-xs text-stone-500 mt-1">
                      La dentición está bloqueada porque ya se pesó la media derecha de este garrón.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Botón principal */}
                <Button
                  onClick={handleAceptarPeso}
                  disabled={saving || !pesoBalanza || parseFloat(pesoBalanza) <= 0}
                  className="w-full h-16 text-xl bg-green-600 hover:bg-green-700"
                >
                  <Printer className="w-6 h-6 mr-3" />
                  {saving ? <TextoEditable id="msg-guardando" original="Guardando..." tag="span" /> : <TextoEditable id="btn-aceptar-peso" original="ACEPTAR PESO E IMPRIMIR RÓTULOS" tag="span" />}
                </Button>
              </CardContent>
            </Card>
          </EditableBlock>

          {/* Panel lateral - Historial */}
          <EditableBlock bloqueId="historialMedias" label="Historial de Medias">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 py-3">
                <CardTitle className="text-base">
                  <TextoEditable id="label-medias-hoy" original="Medias Pesadas Hoy" tag="span" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {mediasPesadas.length === 0 ? (
                    <div className="p-4 text-center text-stone-400">
                      <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p><TextoEditable id="msg-no-hay-medias" original="No hay medias pesadas" tag="span" /></p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {mediasPesadas.slice().reverse().map((media, idx) => (
                        <div 
                          key={media.id || idx} 
                          className={`p-3 flex items-center justify-between ${
                            ultimoRotulo?.id === media.id ? 'bg-green-50' : ''
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">#{media.garron}</span>
                              <Badge variant={media.lado === 'DERECHA' ? 'default' : 'secondary'} className="text-xs">
                                {media.lado === 'DERECHA' ? 'DER' : 'IZQ'}
                              </Badge>
                            </div>
                            <span className="text-xs text-stone-500">
                              {media.siglas.join(', ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600">{media.peso.toFixed(1)} kg</span>
                            <div className="text-xs text-stone-400">
                              {new Date(media.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t bg-stone-50">
                  <div className="flex justify-between text-sm">
                    <span><TextoEditable id="label-total" original="Total" tag="span" />: {mediasPesadas.length} <TextoEditable id="label-medias" original="medias" tag="span" /></span>
                    <span className="font-bold">{getTotalKg().toFixed(1)} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </EditableBlock>
        </div>
      </div>

      {/* Dialog de configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle><TextoEditable id="dialog-config-titulo" original="Configuración del Turno" tag="span" /></DialogTitle>
            <DialogDescription>
              <TextoEditable id="dialog-config-desc" original="Configure el tipificador y cámara para el romaneo" tag="span" />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label><TextoEditable id="label-tipificador2" original="Tipificador" tag="span" /></Label>
              <Select value={tipificadorId} onValueChange={setTipificadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipificador" />
                </SelectTrigger>
                <SelectContent>
                  {tipificadores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre} {t.apellido} - Mat. {t.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label><TextoEditable id="label-camara-destino" original="Cámara Destino" tag="span" /></Label>
              <Select value={camaraId} onValueChange={setCamaraId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cámara" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)} className="bg-green-600 hover:bg-green-700">
              <TextoEditable id="btn-confirmar" original="Confirmar" tag="span" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RomaneoModule
