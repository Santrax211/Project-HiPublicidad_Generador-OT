"use client"

import { type ChangeEvent, type DragEvent, useCallback, useState } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface BriefUploaderProps {
  onExtracted: (data: Record<string, string | null>) => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
}

export function BriefUploader({ onExtracted, isProcessing, setIsProcessing }: BriefUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (selectedFile: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(pdf|xlsx|xls|csv)$/i)) {
      toast.error("Formato no soportado. Sube un archivo PDF o Excel.")
      return
    }
    setFile(selectedFile)
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/extract-brief", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al procesar el brief")
      }

      if (result.data) {
        const mapped: Record<string, string | null> = {}
        for (const [key, value] of Object.entries(result.data)) {
          mapped[key] = (value as string) || null
        }
        onExtracted(mapped)
        toast.success("Brief procesado correctamente. Revisa los campos extraidos y edita lo que sea necesario.")
      } else {
        throw new Error("No se pudo extraer informacion del brief")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error al procesar el brief. Intente nuevamente o complete los campos manualmente.")
    } finally {
      setIsProcessing(false)
    }
  }, [onExtracted, setIsProcessing])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragActive(false)
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0])
      }
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        handleFile(e.target.files[0])
      }
    },
    [handleFile]
  )

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        } ${isProcessing ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isProcessing) {
            document.getElementById("brief-file-input")?.click()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Subir brief en formato PDF o Excel"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            document.getElementById("brief-file-input")?.click()
          }
        }}
      >
        <input
          id="brief-file-input"
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Procesando brief...</p>
            <p className="text-xs text-muted-foreground">Extrayendo datos del documento</p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Arrastra tu brief o haz clic para seleccionar
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, Excel (.xlsx, .xls) o CSV</p>
            </div>
          </>
        )}
      </div>

      {file && !isProcessing && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              setFile(null)
            }}
            aria-label="Eliminar archivo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
