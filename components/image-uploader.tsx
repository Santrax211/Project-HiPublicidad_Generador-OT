"use client"

import { useCallback, useState } from "react"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploaderProps {
  images: string[]
  onImagesChange: (images: string[]) => void
}

export function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = useCallback(
    (files: FileList) => {
      const newImages: string[] = []
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target?.result as string
            newImages.push(result)
            if (newImages.length === files.length) {
              onImagesChange([...images, ...newImages.filter(Boolean)])
            }
          }
          reader.readAsDataURL(file)
        }
      })
    },
    [images, onImagesChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles]
  )

  const removeImage = useCallback(
    (index: number) => {
      onImagesChange(images.filter((_, i) => i !== index))
    },
    [images, onImagesChange]
  )

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        } cursor-pointer`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("design-images-input")?.click()}
        role="button"
        tabIndex={0}
        aria-label="Subir imagenes del diseno aprobado"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            document.getElementById("design-images-input")?.click()
          }
        }}
      >
        <input
          id="design-images-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files)
          }}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <ImagePlus className="h-5 w-5 text-accent" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Subir imagenes del diseno aprobado</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP - Multiples archivos</p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-card">
              <img
                src={img}
                alt={`Diseno aprobado ${index + 1}`}
                className="h-full w-full object-contain p-1"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => removeImage(index)}
                aria-label={`Eliminar imagen ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
