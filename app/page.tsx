"use client"

import { type ReactNode, useState, useCallback } from "react"
import { BriefUploader } from "@/components/brief-uploader"
import { ImageUploader } from "@/components/image-uploader"
import { WorkOrderForm, type WorkOrderData } from "@/components/work-order-form"
import { PDFGenerator } from "@/components/pdf-generator"
import { FileText, Sparkles, PenLine, FileDown } from "lucide-react"

const emptyData: WorkOrderData = {
  numeroBoleta: "",
  asesorVentas: "",
  numeroWhatsapp: "",
  nombreCliente: "",
  producto: "",
  fechaContrato: "",
  descripcionProducto: "",
  materialBase: "",
  detalleA: "",
  detalleB: "",
  detalleC: "",
  tipoEntrega: "",
  fechaEntrega: "",
  medidas: "",
  direccion: "",
  fechaAprobacionDiseno: "",
  nombreDiseñador: "",
  observaciones: "",
}

export default function HomePage() {
  const [formData, setFormData] = useState<WorkOrderData>(emptyData)
  const [designImages, setDesignImages] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasExtracted, setHasExtracted] = useState(false)

  const handleExtracted = useCallback((data: Record<string, string | null>) => {
    setFormData({
      numeroBoleta: data.numeroBoleta || "",
      asesorVentas: data.asesorVentas || "",
      numeroWhatsapp: data.numeroWhatsapp || "",
      nombreCliente: data.nombreCliente || "",
      producto: data.producto || "",
      fechaContrato: data.fechaContrato || "",
      descripcionProducto: data.descripcionProducto || "",
      materialBase: data.materialBase || "",
      detalleA: data.detalleA || "",
      detalleB: data.detalleB || "",
      detalleC: data.detalleC || "",
      tipoEntrega: data.tipoEntrega || "",
      fechaEntrega: data.fechaEntrega || "",
      medidas: data.medidas || "",
      direccion: data.direccion || "",
      fechaAprobacionDiseno: "",
      nombreDiseñador: "",
      observaciones: data.observaciones || "",
    })
    setHasExtracted(true)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <span className="text-lg font-black tracking-tight">Hi</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Hi Publicidad 3D
            </h1>
            <p className="text-sm text-muted-foreground">
              Generador de Ordenes de Trabajo
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Steps indicator */}
        <div className="mb-10 flex items-center justify-center gap-2">
          <StepIndicator number={1} label="Subir Brief" active icon={<FileText className="h-4 w-4" />} />
          <StepConnector />
          <StepIndicator number={2} label="Extraer Datos" active={isProcessing || hasExtracted} icon={<Sparkles className="h-4 w-4" />} />
          <StepConnector />
          <StepIndicator number={3} label="Editar Datos" active={hasExtracted} icon={<PenLine className="h-4 w-4" />} />
          <StepConnector />
          <StepIndicator number={4} label="Generar PDF" active={hasExtracted} icon={<FileDown className="h-4 w-4" />} />
        </div>

        <div className="flex flex-col gap-8">
          {/* Step 1: Upload Brief */}
          <section>
            <SectionHeader
              number={1}
              title="Subir Brief del Proyecto"
              description="Sube el brief en formato PDF o Excel. Los datos se extraeran automaticamente."
            />
            <div className="mt-4">
              <BriefUploader
                onExtracted={handleExtracted}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </div>
          </section>

          {/* Step 2: Edit Form */}
          <section>
            <SectionHeader
              number={2}
              title="Datos de la Orden de Trabajo"
              description="Revisa y edita los campos extraidos del brief. Puedes modificar cualquier campo."
            />
            <div className="mt-4">
              <WorkOrderForm data={formData} onChange={setFormData} />
            </div>
          </section>

          {/* Step 3: Upload Images (between description and materials) */}
          <section>
            <SectionHeader
              number={3}
              title="Imagenes del Diseno Aprobado"
              description="Sube las imagenes del diseno que han sido aprobadas por el cliente."
            />
            <div className="mt-4">
              <ImageUploader images={designImages} onImagesChange={setDesignImages} />
            </div>
          </section>

          {/* Step 4: PDF Preview & Download */}
          <section>
            <SectionHeader
              number={4}
              title="Vista Previa y Generar PDF"
              description="Revisa la orden de trabajo y descarga el PDF en formato horizontal."
            />
            <div className="mt-4">
              <PDFGenerator data={formData} images={designImages} />
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card py-6">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs text-muted-foreground">
            Hi Publicidad 3D - Generador de Ordenes de Trabajo
          </p>
        </div>
      </footer>
    </main>
  )
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        {number}
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function StepIndicator({
  number,
  label,
  active,
  icon,
}: {
  number: number
  label: string
  active: boolean
  icon: ReactNode
}) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
    }`}>
      <span className="sr-only">Paso {number}:</span>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </div>
  )
}

function StepConnector() {
  return <div className="h-px w-6 bg-border sm:w-10" />
}
