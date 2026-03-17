'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Scale, Printer, RefreshCw, User, Warehouse, ChevronUp, ChevronDown,
  CheckCircle, AlertTriangle, RotateCcw, Trash2, AlertOctagon, Lock, Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  tipo: string
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
  decomisada?: boolean
  kgDecomiso?: number
  kgRestantes?: number
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
  
  // Diálogo de decomiso
  const [decomisoOpen, setDecomisoOpen] = useState(false)
  const [kgDecomiso, setKgDecomiso] = useState('')
  
  // Diálogo de fin de faena
  const [finFaenaOpen, setFinFaenaOpen] = useState(false)
  
  // Diálogo de supervisor para editar
  const [supervisorOpen, setSupervisorOpen] = useState(false)
  const [claveSupervisor, setClaveSupervisor] = useState('')
  
  // Estado de faena terminada
  const [faenaTerminada, setFaenaTerminada] = useState(false)
  const [fechaFaena, setFechaFaena] = useState(new Date().toLocaleDateString('es-AR'))
  
  // Datos maestros
  const [tipificadores, setTipificadores] = useState<Tipificador[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [garronesAsignados, setGarronesAsignados] = useState<AsignacionGarron[]>([])
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Ref para auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastGarronRef = useRef<number | null>(null)

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
        setFaenaTerminada(false)
        
        const pendientes = (garronesData.data || []).filter((g: AsignacionGarron) => 
          !g.tieneMediaDer || !g.tieneMediaIzq
        )
        
        if (pendientes.length > 0) {
          const primero = pendientes[0]
          setGarronActual(primero.garron)
          setAsignacionActual(primero)
          setLadoActual(primero.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
        } else if (garronesData.data?.length > 0) {
          // Todos los garrones están pesados
          setFaenaTerminada(true)
          setAsignacionActual(null)
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

  const handleAceptarPeso = async (esDecomiso: boolean = false, kgDecomisoValor: number = 0) => {
    if (!pesoBalanza || parseFloat(pesoBalanza) <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }
    
    if (!tipificadorId || !camaraId) {
      setConfigOpen(true)
      toast.error('Configure tipificador y cámara primero')
      return
    }
    
    // Verificar que no exceda el listado de faena
    if (!asignacionActual) {
      toast.error('No hay más garrones para pesar en esta lista de faena')
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
          operadorId: operador.id,
          esDecomiso,
          kgDecomiso: kgDecomisoValor,
          kgRestantes: parseFloat(pesoBalanza)
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        await handleImprimirRotulos(garronActual, ladoActual, parseFloat(pesoBalanza), esDecomiso)
        
        const nuevaMedia: MediaPesada = {
          id: data.data.id,
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          fecha: new Date(),
          tropaCodigo: asignacionActual?.tropaCodigo || null,
          tipoAnimal: asignacionActual?.tipoAnimal || null,
          decomisada: esDecomiso,
          kgDecomiso: esDecomiso ? kgDecomisoValor : undefined,
          kgRestantes: esDecomiso ? parseFloat(pesoBalanza) : undefined
        }
        setMediasPesadas(prev => [...prev, nuevaMedia])
        setUltimoRotulo(nuevaMedia)
        
        if (esDecomiso) {
          toast.success(`Media decomisada - Garrón #${garronActual}`, {
            description: `Decomiso: ${kgDecomisoValor} kg`
          })
        } else {
          toast.success(`Media ${ladoActual === 'DERECHA' ? 'derecha' : 'izquierda'} registrada`)
        }
        
        setPesoBalanza('')
        setKgDecomiso('')
        setDecomisoOpen(false)
        
        if (asignacionActual) {
          const actualizado = { ...asignacionActual }
          if (ladoActual === 'DERECHA') {
            actualizado.tieneMediaDer = true
          } else {
            actualizado.tieneMediaIzq = true
          }
          setAsignacionActual(actualizado)
        }
        
        // Avanzar al siguiente
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
            // No hay más garrones - preguntar si termina faena
            setGarronesAsignados(nuevosGarrones)
            setDenticion('')
            setFinFaenaOpen(true)
            return
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

  const handleImprimirRotulos = async (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number, esDecomiso: boolean = false) => {
    try {
      const rotulosRes = await fetch('/api/rotulos?tipo=MEDIA_RES&activo=true')
      const rotulosData = await rotulosRes.json()
      const rotulo = rotulosData.find((r: any) => r.esDefault) || rotulosData[0]
      
      const fecha = new Date()
      const fechaVenc = new Date(fecha.getTime() + (rotulo?.diasConsumo || 30) * 24 * 60 * 60 * 1000)
      const tipificador = tipificadores.find(t => t.id === tipificadorId)
      const camara = camaras.find(c => c.id === camaraId)
      
      const datosRotulo = {
        fecha: formatearFecha(fecha),
        fecha_faena: formatearFecha(fecha),
        fecha_venc: formatearFecha(fechaVenc),
        fecha_vencimiento: formatearFecha(fechaVenc),
        tropa: asignacionActual?.tropaCodigo || '-',
        tropa_codigo: asignacionActual?.tropaCodigo || '-',
        garron: String(garron).padStart(3, '0'),
        numero_garron: String(garron).padStart(3, '0'),
        correlativo: String(garron).padStart(4, '0'),
        peso: peso.toFixed(1),
        peso_kg: peso.toFixed(1) + ' KG',
        peso_vivo: asignacionActual?.pesoVivo?.toFixed(0) || '-',
        producto: 'MEDIA RES',
        nombre_producto: 'MEDIA RES',
        tipo_animal: asignacionActual?.tipoAnimal || '-',
        lado: lado === 'DERECHA' ? 'D' : 'I',
        lado_media: lado,
        denticion: denticion || '-',
        dientes: denticion || '-',
        establecimiento: 'SOLEMAR ALIMENTARIA',
        nombre_establecimiento: 'SOLEMAR ALIMENTARIA',
        tipificador: tipificador ? `${tipificador.nombre} ${tipificador.apellido}` : '-',
        matricula: tipificador?.matricula || '-',
        camara: camara?.nombre || '-',
        decomisado: esDecomiso ? 'SI' : 'NO',
        codigo_barras: `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}`,
      }

      if (!rotulo) {
        imprimirRotuloHTML(garron, lado, peso, esDecomiso)
        return
      }

      for (const sigla of SIGLAS) {
        const datosConSigla = {
          ...datosRotulo,
          sigla: sigla,
          sigla_media: sigla,
          codigo_barras: `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}`
        }
        
        await fetch('/api/rotulos/imprimir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rotuloId: rotulo.id,
            datos: datosConSigla,
            cantidad: 1
          })
        })
      }
      
      toast.success(`3 rótulos impresos para garrón #${garron}`, {
        description: `Plantilla: ${rotulo.nombre}`
      })
      
    } catch (error) {
      console.error('Error al imprimir:', error)
      imprimirRotuloHTML(garron, lado, peso, esDecomiso)
    }
  }

  const imprimirRotuloHTML = (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number, esDecomiso: boolean = false) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) {
      toast.error('No se pudo abrir ventana de impresión')
      return
    }
    
    const tipificador = tipificadores.find(t => t.id === tipificadorId)
    const camara = camaras.find(c => c.id === camaraId)
    const fecha = new Date()
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rótulos Garrón ${garron} - ${lado}</title>
        <style>
          @page { size: 100mm 70mm; margin: 3mm; }
          body { font-family: Arial, sans-serif; padding: 5px; margin: 0; }
          .rotulo { border: 2px solid black; padding: 5px; margin-bottom: 3mm; page-break-after: always; width: 94mm; height: 64mm; box-sizing: border-box; ${esDecomiso ? 'background: #fee2e2;' : ''} }
          .header { text-align: center; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px; }
          .empresa { font-size: 14px; font-weight: bold; }
          .campo { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
          .sigla { font-size: 28px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 3px; margin: 3px 0; }
          .lado { font-size: 12px; text-align: center; font-weight: bold; background: ${lado === 'DERECHA' ? '#e3f2fd' : '#fce4ec'}; padding: 2px; }
          .decomiso { background: #dc2626; color: white; text-align: center; font-weight: bold; padding: 2px; font-size: 12px; }
        </style>
      </head>
      <body>
        ${SIGLAS.map(sigla => `
          <div class="rotulo">
            <div class="header"><div class="empresa">SOLEMAR ALIMENTARIA</div><div style="font-size: 9px;">Media Res - Faena</div></div>
            ${esDecomiso ? '<div class="decomiso">⚠️ DECOMISO ⚠️</div>' : ''}
            <div class="lado">${lado === 'DERECHA' ? 'MEDIA DERECHA' : 'MEDIA IZQUIERDA'}</div>
            <div class="campo"><span>Garrón:</span><span style="font-weight: bold; font-size: 14px;">${garron}</span></div>
            <div class="campo"><span>Tropa:</span><span>${asignacionActual?.tropaCodigo || '-'}</span></div>
            <div class="campo"><span>Tipo:</span><span>${asignacionActual?.tipoAnimal || '-'}</span></div>
            <div class="campo"><span>Peso:</span><span style="font-weight: bold;">${peso.toFixed(1)} kg</span></div>
            <div class="campo"><span>Cámara:</span><span>${camara?.nombre || '-'}</span></div>
            ${denticion ? `<div class="campo"><span>Dentición:</span><span>${denticion} dientes</span></div>` : ''}
            <div class="sigla">${sigla}</div>
            <div style="text-align: center; font-size: 10px;">${sigla === 'A' ? 'Asado' : sigla === 'T' ? 'Trasero' : 'Delantero'}</div>
            ${tipificador ? `<div style="text-align: center; font-size: 8px; margin-top: 2px;">Tip.: ${tipificador.nombre} ${tipificador.apellido}</div>` : ''}
          </div>
        `).join('')}
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const formatearFecha = (fecha: Date): string => {
    const dia = String(fecha.getDate()).padStart(2, '0')
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const anio = fecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  }

  const handleReimprimirUltimo = () => {
    if (ultimoRotulo) {
      handleImprimirRotulos(ultimoRotulo.garron, ultimoRotulo.lado as 'DERECHA' | 'IZQUIERDA', ultimoRotulo.peso, ultimoRotulo.decomisada)
      toast.success('Reimprimiendo rótulos')
    } else {
      toast.error('No hay rótulos para reimprimir')
    }
  }

  const handleEliminarUltimo = async () => {
    if (mediasPesadas.length === 0) {
      toast.error('No hay medias para eliminar')
      return
    }
    
    const ultimo = mediasPesadas[mediasPesadas.length - 1]
    
    try {
      const res = await fetch('/api/romaneo/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          garron: ultimo.garron, 
          lado: ultimo.lado 
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        const nuevasMedias = mediasPesadas.slice(0, -1)
        setMediasPesadas(nuevasMedias)
        
        const nuevosGarrones = [...garronesAsignados]
        const idx = nuevosGarrones.findIndex(g => g.garron === ultimo.garron)
        if (idx >= 0) {
          if (ultimo.lado === 'DERECHA') {
            nuevosGarrones[idx] = { ...nuevosGarrones[idx], tieneMediaDer: false }
          } else {
            nuevosGarrones[idx] = { ...nuevosGarrones[idx], tieneMediaIzq: false }
          }
        }
        setGarronesAsignados(nuevosGarrones)
        
        setGarronActual(ultimo.garron)
        setLadoActual(ultimo.lado as 'DERECHA' | 'IZQUIERDA')
        const asignacion = nuevosGarrones.find(g => g.garron === ultimo.garron)
        setAsignacionActual(asignacion || null)
        
        setUltimoRotulo(nuevasMedias.length > 0 ? nuevasMedias[nuevasMedias.length - 1] : null)
        setFaenaTerminada(false)
        
        toast.success(`Media ${ultimo.lado === 'DERECHA' ? 'derecha' : 'izquierda'} del garrón #${ultimo.garron} eliminada`)
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  const handleSeleccionarGarron = (garron: number, lado: 'DERECHA' | 'IZQUIERDA') => {
    if (faenaTerminada) return
    
    setGarronActual(garron)
    setLadoActual(lado)
    const asignacion = garronesAsignados.find(g => g.garron === garron)
    setAsignacionActual(asignacion || null)
    
    if (lado === 'IZQUIERDA' && asignacion?.tieneMediaDer) {
      fetch(`/api/romaneo/denticion?garron=${garron}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.denticion) {
            setDenticion(data.denticion)
          }
        })
        .catch(e => console.error('Error cargando dentición:', e))
    } else {
      setDenticion('')
    }
    
    setPesoBalanza('')
  }

  const handleAbrirDecomiso = () => {
    if (!pesoBalanza || parseFloat(pesoBalanza) <= 0) {
      toast.error('Ingrese el peso de la media primero')
      return
    }
    setKgDecomiso('')
    setDecomisoOpen(true)
  }

  const handleConfirmarDecomiso = () => {
    const decomiso = parseFloat(kgDecomiso)
    
    if (isNaN(decomiso) || decomiso <= 0) {
      toast.error('Ingrese kg de decomiso válidos')
      return
    }
    
    setDecomisoOpen(false)
    handleAceptarPeso(true, decomiso)
  }

  const handleTerminarFaena = async (confirmar: boolean) => {
    setFinFaenaOpen(false)
    
    if (confirmar) {
      setFaenaTerminada(true)
      setAsignacionActual(null)
      toast.success('Faena terminada correctamente')
    }
  }

  const handleEditarFaena = () => {
    setSupervisorOpen(true)
    setClaveSupervisor('')
  }

  const handleValidarSupervisor = async () => {
    // Verificar clave de supervisor (clave hardcodeada por ahora, debería venir de DB)
    if (claveSupervisor === '1234' || operador.rol === 'ADMINISTRADOR') {
      setSupervisorOpen(false)
      setFaenaTerminada(false)
      
      // Resetear a los garrones que se pueden re-pesar
      const pendientes = garronesAsignados.filter(g => !g.tieneMediaDer || !g.tieneMediaIzq)
      if (pendientes.length > 0) {
        setGarronActual(pendientes[0].garron)
        setAsignacionActual(pendientes[0])
        setLadoActual(pendientes[0].tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
      } else {
        // Si todos están pesados, permitir seleccionar cualquiera
        if (garronesAsignados.length > 0) {
          setGarronActual(garronesAsignados[0].garron)
          setAsignacionActual(garronesAsignados[0])
          setLadoActual('DERECHA')
        }
      }
      
      toast.success('Modo edición de faena activado')
    } else {
      toast.error('Clave de supervisor incorrecta')
    }
  }

  // Agrupar medias por garrón
  const garronesAgrupados = useCallback(() => {
    const grupos: Record<number, { der: MediaPesada | null, izq: MediaPesada | null }> = {}
    
    garronesAsignados.forEach(g => {
      grupos[g.garron] = { der: null, izq: null }
    })
    
    mediasPesadas.forEach(m => {
      if (!grupos[m.garron]) {
        grupos[m.garron] = { der: null, izq: null }
      }
      if (m.lado === 'DERECHA') {
        grupos[m.garron].der = m
      } else {
        grupos[m.garron].izq = m
      }
    })
    
    return Object.entries(grupos)
      .map(([garron, medias]) => ({
        garron: parseInt(garron),
        der: medias.der,
        izq: medias.izq,
        completo: medias.der && medias.izq
      }))
      .sort((a, b) => a.garron - b.garron)
  }, [mediasPesadas, garronesAsignados])

  // Auto-scroll cuando cambia el último garrón pesado
  useEffect(() => {
    const garronesLista = garronesAgrupados()
    const ultimoPesado = garronesLista.filter(g => g.der || g.izq).pop()
    
    if (ultimoPesado && ultimoPesado.garron !== lastGarronRef.current && scrollRef.current) {
      lastGarronRef.current = ultimoPesado.garron
      
      setTimeout(() => {
        const element = document.getElementById(`garron-${ultimoPesado.garron}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [mediasPesadas, garronesAgrupados])

  const getTotalKg = () => mediasPesadas.reduce((acc, m) => acc + m.peso, 0)

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Scale className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  const garronesLista = garronesAgrupados()

  return (
    <div className="h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex flex-col overflow-hidden">
      {/* Header fijo */}
      <div className="flex-shrink-0 p-3 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">Romaneo - Pesaje de Medias</h1>
            <p className="text-stone-500 text-sm">Faena: {fechaFaena}</p>
          </div>
          <div className="flex items-center gap-2">
            {faenaTerminada && (
              <Button variant="outline" size="sm" onClick={handleEditarFaena} className="border-amber-300 text-amber-700">
                <Lock className="w-4 h-4 mr-1" />
                Editar Faena
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
              <User className="w-4 h-4 mr-1" />
              Configurar
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Configuración activa */}
      <div className="flex-shrink-0 px-3">
        <Card className="border-0 shadow-sm bg-amber-50">
          <CardContent className="p-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-amber-600" />
                  <strong>Tip.:</strong> {tipificadores.find(t => t.id === tipificadorId)?.nombre || '-'}
                </span>
                <div className="flex items-center gap-1">
                  <Warehouse className="w-4 h-4 text-amber-600" />
                  <strong>Cám.:</strong>
                  <Select value={camaraId} onValueChange={setCamaraId}>
                    <SelectTrigger className="h-6 w-32 bg-white border-amber-200 text-xs">
                      <SelectValue placeholder="Sel." />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={handleEliminarUltimo} disabled={mediasPesadas.length === 0} className="h-6 text-xs text-red-600 hover:bg-red-50 border-red-200">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Eliminar
                </Button>
                <Button variant="outline" size="sm" onClick={handleReimprimirUltimo} disabled={!ultimoRotulo} className="h-6 text-xs">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reimprimir
                </Button>
              </div>
              <Badge variant="outline" className="text-xs">
                {mediasPesadas.length} medias - {getTotalKg().toFixed(1)} kg
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal sin scroll */}
      <div className="flex-1 p-3 pt-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
          
          {/* Panel principal de pesaje - FIJO SIN SCROLL */}
          <Card className="lg:col-span-2 border-0 shadow-md flex flex-col overflow-hidden">
            <CardHeader className="bg-stone-50 flex-shrink-0 py-2 px-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {faenaTerminada ? '✓ Faena Terminada' : 'Pesaje Actual'}
                </CardTitle>
                {!faenaTerminada && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      const idx = garronesLista.findIndex(g => g.garron === garronActual)
                      if (idx > 0) {
                        const prev = garronesLista[idx - 1]
                        if (!prev.der) handleSeleccionarGarron(prev.garron, 'DERECHA')
                        else if (!prev.izq) handleSeleccionarGarron(prev.garron, 'IZQUIERDA')
                      }
                    }}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold text-amber-600 min-w-[50px] text-center">#{garronActual}</span>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => {
                      const idx = garronesLista.findIndex(g => g.garron === garronActual)
                      if (idx < garronesLista.length - 1) {
                        const next = garronesLista[idx + 1]
                        if (!next.der) handleSeleccionarGarron(next.garron, 'DERECHA')
                        else if (!next.izq) handleSeleccionarGarron(next.garron, 'IZQUIERDA')
                      }
                    }}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            {faenaTerminada ? (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h2 className="text-2xl font-bold text-stone-700 mb-2">Faena Completada</h2>
                  <p className="text-stone-500 mb-4">Total: {mediasPesadas.length} medias - {getTotalKg().toFixed(1)} kg</p>
                  <p className="text-sm text-stone-400">Cargue una nueva lista de faena para continuar</p>
                </div>
              </CardContent>
            ) : (
              <CardContent className="flex-1 flex flex-col p-3 overflow-hidden">
                {/* Datos del animal */}
                <div className="flex-shrink-0">
                  {asignacionActual ? (
                    <div className="grid grid-cols-4 gap-2 p-2 bg-stone-50 rounded-lg text-xs">
                      <div><span className="text-stone-500 block">Tropa</span><span className="font-medium">{asignacionActual.tropaCodigo || '-'}</span></div>
                      <div><span className="text-stone-500 block">Tipo</span><span className="font-medium">{asignacionActual.tipoAnimal || '-'}</span></div>
                      <div><span className="text-stone-500 block">P.Vivo</span><span className="font-medium">{asignacionActual.pesoVivo?.toFixed(0) || '-'} kg</span></div>
                      <div><span className="text-stone-500 block">Estado</span><span className="font-medium">{asignacionActual.tieneMediaDer && asignacionActual.tieneMediaIzq ? '✓' : asignacionActual.tieneMediaDer ? 'Falta Izq' : 'Falta Der'}</span></div>
                    </div>
                  ) : (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      No hay animal asignado al garrón {garronActual}
                    </div>
                  )}
                </div>

                <Separator className="my-2 flex-shrink-0" />

                {/* Lado actual */}
                <div className="flex items-center justify-center gap-3 flex-shrink-0">
                  <Button variant={ladoActual === 'DERECHA' ? 'default' : 'outline'} className={`h-10 px-6 ${ladoActual === 'DERECHA' ? 'bg-blue-600 hover:bg-blue-700' : ''}`} onClick={() => setLadoActual('DERECHA')} disabled={asignacionActual?.tieneMediaDer}>
                    DER {asignacionActual?.tieneMediaDer && <CheckCircle className="w-3 h-3 ml-1" />}
                  </Button>
                  <Button variant={ladoActual === 'IZQUIERDA' ? 'default' : 'outline'} className={`h-10 px-6 ${ladoActual === 'IZQUIERDA' ? 'bg-pink-600 hover:bg-pink-700' : ''}`} onClick={() => setLadoActual('IZQUIERDA')} disabled={!asignacionActual?.tieneMediaDer || asignacionActual?.tieneMediaIzq}>
                    IZQ {asignacionActual?.tieneMediaIzq && <CheckCircle className="w-3 h-3 ml-1" />}
                  </Button>
                </div>

                {/* Peso */}
                <div className="text-center flex-shrink-0 my-2">
                  <Label className="text-base">Peso (kg)</Label>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Input type="number" value={pesoBalanza} onChange={(e) => setPesoBalanza(e.target.value)} className="text-3xl font-bold text-center h-16 w-40" placeholder="0" step="0.1" />
                    <Button variant="outline" size="lg" onClick={handleCapturarPeso}><Scale className="w-5 h-5" /></Button>
                  </div>
                </div>

                {/* Dentición */}
                <div className="space-y-1 flex-shrink-0">
                  <Label className="text-xs">Dentición {asignacionActual?.tieneMediaDer && <span className="text-amber-600">(Fijado)</span>}</Label>
                  <div className="flex gap-1">
                    {DIENTES.map((d) => (
                      <Button key={d} variant={denticion === d ? 'default' : 'outline'} className={`flex-1 h-9 ${denticion === d ? 'bg-amber-500 hover:bg-amber-600' : ''}`} onClick={() => setDenticion(d)} disabled={asignacionActual?.tieneMediaDer && denticion !== '' && denticion !== d}>
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="my-2 flex-shrink-0" />

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-2 flex-shrink-0 mt-auto">
                  <Button onClick={() => handleAceptarPeso(false)} disabled={saving || !pesoBalanza || parseFloat(pesoBalanza) <= 0 || !asignacionActual} className="h-12 bg-green-600 hover:bg-green-700">
                    <Printer className="w-4 h-4 mr-1" />
                    {saving ? '...' : 'ACEPTAR'}
                  </Button>
                  <Button onClick={handleAbrirDecomiso} disabled={saving || !pesoBalanza || parseFloat(pesoBalanza) <= 0 || !asignacionActual} variant="outline" className="h-12 border-red-300 text-red-600 hover:bg-red-50">
                    <AlertOctagon className="w-4 h-4 mr-1" />
                    DECOMISO
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Panel lateral - Listado de Garrones con scroll interno */}
          <Card className="border-0 shadow-md flex flex-col overflow-hidden">
            <CardHeader className="bg-stone-50 py-2 px-3 flex-shrink-0">
              <CardTitle className="text-sm">Garrones ({garronesLista.filter(g => g.completo).length}/{garronesLista.length})</CardTitle>
            </CardHeader>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {garronesLista.length === 0 ? (
                <div className="p-4 text-center text-stone-400">
                  <Scale className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No hay garrones</p>
                </div>
              ) : (
                <div className="divide-y">
                  {garronesLista.map((g) => {
                    const isPendienteDer = !g.der && garronesAsignados.find(ga => ga.garron === g.garron)
                    const isPendienteIzq = g.der && !g.izq && garronesAsignados.find(ga => ga.garron === g.garron && ga.tieneMediaDer && !ga.tieneMediaIzq)
                    
                    return (
                      <div key={g.garron} id={`garron-${g.garron}`} className={cn("p-1.5 cursor-pointer hover:bg-stone-50", g.garron === garronActual && "bg-amber-50 border-l-2 border-amber-500")}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-amber-600">#{g.garron}</span>
                          {g.completo && <CheckCircle className="w-3 h-3 text-green-500" />}
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <Button variant="outline" size="sm" className={cn("h-6 py-0 px-1 justify-start text-xs", g.der?.decomisada ? "bg-red-50 border-red-200" : g.der ? "bg-blue-50 border-blue-200" : isPendienteDer ? "border-dashed" : "opacity-50")} onClick={() => handleSeleccionarGarron(g.garron, 'DERECHA')} disabled={!!g.der || faenaTerminada}>
                            <span className="font-medium">DER</span>
                            {g.der ? <span className="ml-auto">{g.der.peso.toFixed(0)}kg</span> : isPendienteDer ? <span className="ml-auto text-stone-400">.</span> : null}
                            {g.der?.decomisada && <AlertOctagon className="w-2 h-2 ml-0.5 text-red-500" />}
                          </Button>
                          <Button variant="outline" size="sm" className={cn("h-6 py-0 px-1 justify-start text-xs", g.izq?.decomisada ? "bg-red-50 border-red-200" : g.izq ? "bg-pink-50 border-pink-200" : isPendienteIzq ? "border-dashed" : "opacity-50")} onClick={() => handleSeleccionarGarron(g.garron, 'IZQUIERDA')} disabled={!!g.izq || faenaTerminada}>
                            <span className="font-medium">IZQ</span>
                            {g.izq ? <span className="ml-auto">{g.izq.peso.toFixed(0)}kg</span> : isPendienteIzq ? <span className="ml-auto text-stone-400">.</span> : null}
                            {g.izq?.decomisada && <AlertOctagon className="w-2 h-2 ml-0.5 text-red-500" />}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="p-2 border-t bg-stone-50 flex-shrink-0">
              <div className="flex justify-between text-xs">
                <span>Total: {mediasPesadas.length} medias</span>
                <span className="font-bold">{getTotalKg().toFixed(1)} kg</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Diálogo de Configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Romaneo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label className="text-sm">Tipificador</Label>
              <Select value={tipificadorId} onValueChange={setTipificadorId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {tipificadores.map((t) => (<SelectItem key={t.id} value={t.id}>{t.nombre} {t.apellido}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Cámara</Label>
              <Select value={camaraId} onValueChange={setCamaraId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)} disabled={!tipificadorId || !camaraId}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Decomiso - Simplificado */}
      <Dialog open={decomisoOpen} onOpenChange={setDecomisoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2"><AlertOctagon className="w-5 h-5" />Decomiso</DialogTitle>
            <DialogDescription>Garrón #{garronActual} - {ladoActual}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="p-2 bg-amber-50 rounded-lg text-center">
              <span className="text-xs text-amber-600">Peso de la media</span>
              <div className="text-xl font-bold text-amber-700">{pesoBalanza} kg</div>
            </div>
            <div className="space-y-1">
              <Label className="text-red-600 text-sm">Kg Decomisados</Label>
              <Input type="number" value={kgDecomiso} onChange={(e) => setKgDecomiso(e.target.value)} placeholder="0" step="0.1" autoFocus />
            </div>
            <p className="text-xs text-stone-500">Los kg restantes serán: {(parseFloat(pesoBalanza) - parseFloat(kgDecomiso || '0')).toFixed(1)} kg</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecomisoOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmarDecomiso}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Fin de Faena */}
      <Dialog open={finFaenaOpen} onOpenChange={setFinFaenaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Terminar Faena?</DialogTitle>
            <DialogDescription>
              Se han pesado todos los garrones de la lista de faena.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-lg font-medium">Total: {mediasPesadas.length} medias</p>
              <p className="text-2xl font-bold text-amber-600">{getTotalKg().toFixed(1)} kg</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleTerminarFaena(false)}>No, continuar</Button>
            <Button onClick={() => handleTerminarFaena(true)} className="bg-green-600 hover:bg-green-700">Sí, terminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Supervisor */}
      <Dialog open={supervisorOpen} onOpenChange={setSupervisorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />Autorización de Supervisor</DialogTitle>
            <DialogDescription>Ingrese la clave de supervisor para editar la faena</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Input type="password" value={claveSupervisor} onChange={(e) => setClaveSupervisor(e.target.value)} placeholder="Clave de supervisor" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupervisorOpen(false)}>Cancelar</Button>
            <Button onClick={handleValidarSupervisor}>Autorizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RomaneoModule
