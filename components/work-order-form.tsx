"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface WorkOrderData {
  numeroBoleta: string
  asesorVentas: string
  numeroWhatsapp: string
  nombreCliente: string
  producto: string
  fechaContrato: string
  descripcionProducto: string
  materialBase: string
  detalleA: string
  detalleB: string
  detalleC: string
  tipoEntrega: string
  fechaEntrega: string
  medidas: string
  direccion: string
  fechaAprobacionDiseno: string
  observaciones: string
}

interface WorkOrderFormProps {
  data: WorkOrderData
  onChange: (data: WorkOrderData) => void
}

export function WorkOrderForm({ data, onChange }: WorkOrderFormProps) {
  const updateField = (field: keyof WorkOrderData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Boleta, Cliente, Asesor */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="numeroBoleta" className="text-sm font-semibold text-foreground">
            N. Boleta
          </Label>
          <Input
            id="numeroBoleta"
            value={data.numeroBoleta}
            onChange={(e) => updateField("numeroBoleta", e.target.value)}
            placeholder="Ej: 1032"
            className="bg-card"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nombreCliente" className="text-sm font-semibold text-foreground">
            Nombre del Cliente
          </Label>
          <Input
            id="nombreCliente"
            value={data.nombreCliente}
            onChange={(e) => updateField("nombreCliente", e.target.value)}
            placeholder="Ej: Laboratorio de Analisis"
            className="bg-card"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="asesorVentas" className="text-sm font-semibold text-foreground">
            Asesor de Ventas
          </Label>
          <Input
            id="asesorVentas"
            value={data.asesorVentas}
            onChange={(e) => updateField("asesorVentas", e.target.value)}
            placeholder="Ej: Juan Perez"
            className="bg-card"
          />
        </div>
      </div>

      {/* Whatsapp, Producto, Fecha de Contrato */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="numeroWhatsapp" className="text-sm font-semibold text-foreground">
            N. de Whatsapp
          </Label>
          <Input
            id="numeroWhatsapp"
            value={data.numeroWhatsapp}
            onChange={(e) => updateField("numeroWhatsapp", e.target.value)}
            placeholder="Ej: 999 888 777"
            className="bg-card"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto" className="text-sm font-semibold text-foreground">
            Producto
          </Label>
          <Input
            id="producto"
            value={data.producto}
            onChange={(e) => updateField("producto", e.target.value)}
            placeholder="Ej: Letrero interior"
            className="bg-card"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaContrato" className="text-sm font-semibold text-foreground">
            Fecha de Contrato
          </Label>
          <Input
            id="fechaContrato"
            type="date"
            value={data.fechaContrato}
            onChange={(e) => updateField("fechaContrato", e.target.value)}
            className="bg-card"
          />
        </div>
      </div>

      {/* Descripcion del Producto */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="descripcionProducto" className="text-sm font-semibold text-foreground">
          Descripcion del Producto
        </Label>
        <Textarea
          id="descripcionProducto"
          value={data.descripcionProducto}
          onChange={(e) => updateField("descripcionProducto", e.target.value)}
          placeholder="Ej: Letrero interior. Letras de MDF de 9mm enchapadas con acrilico de 2mm con vinilo segun color. Sin Base. Sin iluminacion."
          rows={3}
          className="bg-card resize-none"
        />
      </div>

      {/* Medidas */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="medidas" className="text-sm font-semibold text-foreground">
          Medidas
        </Label>
        <Input
          id="medidas"
          value={data.medidas}
          onChange={(e) => updateField("medidas", e.target.value)}
          placeholder="Ej: 120cm x 35cm"
          className="bg-card"
        />
      </div>

      {/* Materiales Section */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Materiales</h3>

        <div className="flex flex-col gap-2">
          <Label htmlFor="materialBase" className="text-sm font-medium text-foreground">
            Base
          </Label>
          <Input
            id="materialBase"
            value={data.materialBase}
            onChange={(e) => updateField("materialBase", e.target.value)}
            placeholder="Ej: MDF de 9mm"
            className="bg-card"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="detalleA" className="text-sm font-medium text-foreground">
            Detalle A
          </Label>
          <Input
            id="detalleA"
            value={data.detalleA}
            onChange={(e) => updateField("detalleA", e.target.value)}
            placeholder="Ej: Piezas de MDF de 9mm"
            className="bg-card"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="detalleB" className="text-sm font-medium text-foreground">
            Detalle B
          </Label>
          <Input
            id="detalleB"
            value={data.detalleB}
            onChange={(e) => updateField("detalleB", e.target.value)}
            placeholder="Ej: Piezas de acrilico de 2mm"
            className="bg-card"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="detalleC" className="text-sm font-medium text-foreground">
            Detalle C (opcional)
          </Label>
          <Input
            id="detalleC"
            value={data.detalleC}
            onChange={(e) => updateField("detalleC", e.target.value)}
            placeholder="Ej: Vinilo segun color"
            className="bg-card"
          />
        </div>
      </div>

      {/* Entrega */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipoEntrega" className="text-sm font-semibold text-foreground">
            Metodo de Entrega
          </Label>
          <Select
            value={data.tipoEntrega}
            onValueChange={(value) => updateField("tipoEntrega", value)}
          >
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Seleccionar metodo de entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Instalacion">Instalacion</SelectItem>
              <SelectItem value="Recojo en taller">Recojo en taller</SelectItem>
              <SelectItem value="Envio Lima">Envio Lima</SelectItem>
              <SelectItem value="Envio provincia">Envio provincia</SelectItem>
            </SelectContent>
          </Select>
          {data.tipoEntrega && !["Instalacion", "Recojo en taller", "Envio Lima", "Envio provincia"].includes(data.tipoEntrega) && (
            <p className="text-xs text-muted-foreground">
              Valor extraido: <span className="font-medium text-foreground">{data.tipoEntrega}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaEntrega" className="text-sm font-semibold text-foreground">
            Fecha de Entrega
          </Label>
          <Input
            id="fechaEntrega"
            type="date"
            value={data.fechaEntrega}
            onChange={(e) => updateField("fechaEntrega", e.target.value)}
            className="bg-card"
          />
        </div>
      </div>

      {/* Direccion y Fecha de Aprobacion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="direccion" className="text-sm font-semibold text-foreground">
            Direccion de Envio / Instalacion
          </Label>
          <Textarea
            id="direccion"
            value={data.direccion}
            onChange={(e) => updateField("direccion", e.target.value)}
            placeholder="Ej: Av. Principal 123, Miraflores"
            rows={2}
            className="bg-card resize-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaAprobacionDiseno" className="text-sm font-semibold text-foreground">
            Fecha de Aprobacion del Diseno
          </Label>
          <Input
            id="fechaAprobacionDiseno"
            type="date"
            value={data.fechaAprobacionDiseno}
            onChange={(e) => updateField("fechaAprobacionDiseno", e.target.value)}
            className="bg-card"
          />
        </div>
      </div>

      {/* Observaciones */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="observaciones" className="text-sm font-semibold text-foreground">
          Observaciones (Instalacion / Detalles Electricos / Adicionales)
        </Label>
        <Textarea
          id="observaciones"
          value={data.observaciones}
          onChange={(e) => updateField("observaciones", e.target.value)}
          placeholder="Incluye datos de instalacion, detalles electricos y observaciones adicionales..."
          rows={4}
          className="bg-card resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Se extraen automaticamente datos de Instalacion, Detalles Electricos y Observaciones del brief.
        </p>
      </div>
    </div>
  )
}
