"use client"

import { useCallback, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { WorkOrderData } from "@/components/work-order-form"
import { toast } from "sonner"

interface PDFGeneratorProps {
  data: WorkOrderData
  images: string[]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "---"
  try {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function loadImageAsDataURL(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("No canvas context"))
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = src
  })
}

export function PDFGenerator({ data, images }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = useCallback(async () => {
    setIsGenerating(true)
    toast.info("Generando PDF...")

    try {
      const jsPDF = (await import("jspdf")).default
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

      const pageW = pdf.internal.pageSize.getWidth()  // 297
      const pageH = pdf.internal.pageSize.getHeight() // 210
      const margin = 12
      const contentW = pageW - margin * 2

      // --- HEADER BAR ---
      pdf.setFillColor(26, 54, 93)
      pdf.rect(0, 0, pageW, 28, "F")

      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(255, 255, 255)
      pdf.text("HI PUBLICIDAD 3D", margin + 4, 13)

      const headerProduct = (data.producto || "---").toUpperCase()
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(255, 255, 255)
      const headerMaxW = pageW - margin * 2 - 90
      const headerProductLine = pdf.splitTextToSize(headerProduct, headerMaxW)[0] || "---"
      pdf.text(headerProductLine, pageW / 2, 16, { align: "center" })

      pdf.setFontSize(9)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(200, 210, 230)
      pdf.text("ORDEN DE TRABAJO", margin + 4, 20)

      // Boleta en la derecha
      pdf.setFontSize(9)
      pdf.setTextColor(200, 210, 230)
      pdf.text("BOLETA", pageW - margin - 4, 10, { align: "right" })
      pdf.setFontSize(22)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(255, 255, 255)
      pdf.text(`#${data.numeroBoleta || "---"}`, pageW - margin - 4, 22, { align: "right" })

      // --- CLIENT INFO BAR ---
      const infoTop = 28
      const infoHeight = 30
      const infoBottom = infoTop + infoHeight
      const line1LabelY = infoTop + 7
      const line1ValueY = infoTop + 15
      const line2LabelY = infoTop + 19
      const line2ValueY = infoTop + 27

      pdf.setFillColor(240, 244, 248)
      pdf.rect(0, infoTop, pageW, infoHeight, "F")
      pdf.setDrawColor(220, 228, 238)
      pdf.line(0, infoBottom, pageW, infoBottom)

      const col1X = margin + 4
      const col2X = 98
      const col3X = 175
      const rightInfoX = pageW - margin - 60
      const rightInfoRight = pageW - margin - 4
      const leftMax = rightInfoX - 6
      const col1W = col2X - col1X - 6
      const col2W = col3X - col2X - 6
      const col3W = leftMax - col3X

      const fitText = (value: string, maxWidth: number) => {
        const clean = value || "---"
        const lines = pdf.splitTextToSize(clean, maxWidth)
        return lines[0] || "---"
      }

      const drawInfoField = (
        label: string,
        value: string,
        x: number,
        labelY: number,
        valueY: number,
        maxWidth: number
      ) => {
        pdf.setFontSize(7)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(113, 128, 150)
        pdf.text(label, x, labelY)
        pdf.setFontSize(11)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(26, 54, 93)
        pdf.text(fitText(value, maxWidth), x, valueY)
      }

      drawInfoField("CLIENTE", data.nombreCliente, col1X, line1LabelY, line1ValueY, col1W)
      drawInfoField("ASESOR", data.asesorVentas, col2X, line1LabelY, line1ValueY, col2W)
      drawInfoField("WHATSAPP", data.numeroWhatsapp, col3X, line1LabelY, line1ValueY, col3W)

      drawInfoField("PRODUCTO", data.producto, col1X, line2LabelY, line2ValueY, col1W)
      drawInfoField("MEDIDAS", data.medidas, col2X, line2LabelY, line2ValueY, col2W)
      drawInfoField("FECHA DE CONTRATO", formatDate(data.fechaContrato), col3X, line2LabelY, line2ValueY, col3W)

      // Entrega y fecha a la derecha
      pdf.setFontSize(7)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(113, 128, 150)
      pdf.text("ENTREGA", rightInfoX, line1LabelY)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(197, 48, 48)
      pdf.text((data.tipoEntrega || "---").toUpperCase(), rightInfoX, line1ValueY)

      pdf.setFontSize(7)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(113, 128, 150)
      pdf.text("FECHA", rightInfoRight, line1LabelY, { align: "right" })
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(197, 48, 48)
      pdf.text(formatDate(data.fechaEntrega), rightInfoRight, line1ValueY, { align: "right" })

      // --- BODY CONTENT ---
      const bodyTop = infoBottom + 6
      const leftColW = contentW * 0.55
      const rightColX = margin + leftColW + 8
      const rightColW = contentW - leftColW - 8
      let yPos = bodyTop

      // -- Seccion label helper --
      const drawSectionLabel = (label: string, x: number, y: number) => {
        pdf.setFontSize(7)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(113, 128, 150)
        pdf.text(label.toUpperCase(), x, y)
        pdf.setDrawColor(26, 54, 93)
        pdf.setLineWidth(0.5)
        const labelW = pdf.getTextWidth(label.toUpperCase())
        pdf.line(x, y + 1.5, x + labelW, y + 1.5)
        return y + 6
      }

      // -- DESCRIPCION --
      yPos = drawSectionLabel("Descripcion del Producto", margin + 4, yPos)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(45, 55, 72)
      const descLines = pdf.splitTextToSize(data.descripcionProducto || "Sin descripcion", leftColW - 8)
      pdf.text(descLines, margin + 4, yPos)
      yPos += descLines.length * 5 + 6

      // -- MATERIALES --
      const hasMaterials = data.materialBase || data.detalleA || data.detalleB || data.detalleC
      if (hasMaterials) {
        yPos = drawSectionLabel("Materiales", margin + 4, yPos)

        const drawMaterialRow = (label: string, value: string, bgColor: [number, number, number]) => {
          if (!value) return
          // Badge
          pdf.setFillColor(...bgColor)
          const labelW = pdf.getTextWidth(label.toUpperCase()) + 4
          pdf.roundedRect(margin + 4, yPos - 3.2, labelW + 2, 5, 1, 1, "F")
          pdf.setFontSize(7)
          pdf.setFont("helvetica", "bold")
          pdf.setTextColor(255, 255, 255)
          pdf.text(label.toUpperCase(), margin + 7, yPos)

          // Value
          pdf.setFontSize(9)
          pdf.setFont("helvetica", "normal")
          pdf.setTextColor(45, 55, 72)
          const valueLines = pdf.splitTextToSize(value, leftColW - labelW - 14)
          pdf.text(valueLines, margin + 7 + labelW + 4, yPos)
          yPos += Math.max(valueLines.length * 4.5, 5) + 2
        }

        drawMaterialRow("Base", data.materialBase, [26, 54, 93])
        drawMaterialRow("Det. A", data.detalleA, [44, 82, 130])
        drawMaterialRow("Det. B", data.detalleB, [43, 108, 176])
        drawMaterialRow("Det. C", data.detalleC, [49, 130, 206])
        yPos += 2
      }

      // -- OBSERVACIONES --
      if (data.observaciones) {
        yPos = drawSectionLabel("Observaciones", margin + 4, yPos)
        pdf.setFillColor(255, 255, 240)
        const obsLines = pdf.splitTextToSize(data.observaciones, leftColW - 16)
        const obsHeight = obsLines.length * 4.5 + 6
        pdf.rect(margin + 4, yPos - 3, leftColW - 4, obsHeight, "F")
        pdf.setFillColor(214, 158, 46)
        pdf.rect(margin + 4, yPos - 3, 1, obsHeight, "F")
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "italic")
        pdf.setTextColor(74, 85, 104)
        pdf.text(obsLines, margin + 10, yPos + 1)
        yPos += obsHeight + 6
      }

      // -- DIRECCION --
      yPos = drawSectionLabel("Direccion de Envio / Instalacion", margin + 4, yPos)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(45, 55, 72)
      const dirLines = pdf.splitTextToSize(data.direccion || "---", leftColW - 8)
      pdf.text(dirLines, margin + 4, yPos)
      yPos += dirLines.length * 5 + 2

      // --- IMAGENES (columna derecha) ---
      let imgY = bodyTop
      if (images.length > 0) {
        imgY = drawSectionLabel("Diseno Aprobado", rightColX, imgY)

        // Badge "APROBADO"
        const approvedText = "APROBADO"
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "bold")
        const approvedW = pdf.getTextWidth(approvedText) + 6
        pdf.setFillColor(56, 161, 105)
        pdf.roundedRect(rightColX + rightColW - approvedW - 2, imgY - 6.5, approvedW + 2, 6, 2, 2, "F")
        pdf.setTextColor(255, 255, 255)
        pdf.text(approvedText, rightColX + rightColW - approvedW + 1, imgY - 2.5)

        const approvalLabel = "FECHA APROB."
        pdf.setFontSize(7)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(113, 128, 150)
        pdf.text(approvalLabel, rightColX, imgY)
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(26, 54, 93)
        pdf.text(formatDate(data.fechaAprobacionDiseno), rightColX, imgY + 5)

        imgY += 10

        const maxImgHeight = images.length > 1 ? 55 : 110
        for (let i = 0; i < images.length; i++) {
          try {
            const imgDataURL = await loadImageAsDataURL(images[i])
            // Draw border/container
            pdf.setDrawColor(226, 232, 240)
            pdf.setLineWidth(0.3)
            pdf.roundedRect(rightColX, imgY, rightColW, maxImgHeight + 6, 2, 2, "S")
            pdf.setFillColor(247, 250, 252)
            pdf.roundedRect(rightColX + 0.15, imgY + 0.15, rightColW - 0.3, maxImgHeight + 5.7, 2, 2, "F")

            // Add image
            pdf.addImage(imgDataURL, "PNG", rightColX + 3, imgY + 3, rightColW - 6, maxImgHeight)
            imgY += maxImgHeight + 10
          } catch (e) {
            console.error("[v0] Error loading image for PDF:", e)
          }
        }
      } else {
        // Placeholder
        imgY = drawSectionLabel("Diseno", rightColX, imgY)
        
        // Nombre del Diseñador
        pdf.setFontSize(7)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(113, 128, 150)
        pdf.text("DISEÑADOR", rightColX, imgY)
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(26, 54, 93)
        pdf.text(data.nombreDiseñador || "---", rightColX, imgY + 5)
        imgY += 10
        
        // Fecha de Aprobación
        pdf.setFontSize(7)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(113, 128, 150)
        pdf.text("FECHA APROB.", rightColX, imgY)
        pdf.setFontSize(9)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(26, 54, 93)
        pdf.text(formatDate(data.fechaAprobacionDiseno), rightColX, imgY + 5)
        imgY += 10
        pdf.setDrawColor(203, 213, 224)
        pdf.setLineDashPattern([2, 2], 0)
        pdf.roundedRect(rightColX, imgY, rightColW, 80, 2, 2, "S")
        pdf.setLineDashPattern([], 0)
        pdf.setFontSize(10)
        pdf.setFont("helvetica", "italic")
        pdf.setTextColor(160, 174, 192)
        pdf.text("Sin imagenes de diseno", rightColX + rightColW / 2, imgY + 42, { align: "center" })
      }

      // --- FOOTER ---
      pdf.setDrawColor(226, 232, 240)
      pdf.setLineWidth(0.5)
      pdf.line(0, pageH - 12, pageW, pageH - 12)
      pdf.setFillColor(247, 250, 252)
      pdf.rect(0, pageH - 12, pageW, 12, "F")

      pdf.setFontSize(7)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(160, 174, 192)
      pdf.text("HI PUBLICIDAD 3D - ORDEN DE TRABAJO", margin + 4, pageH - 5)

      const today = new Date().toLocaleDateString("es-PE", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
      pdf.text(`Generado el ${today}`, pageW - margin - 4, pageH - 5, { align: "right" })

      // Save
      const fileName = `Orden_Trabajo_${data.numeroBoleta || "sin_boleta"}_${data.nombreCliente || "cliente"}.pdf`
      pdf.save(fileName)
      toast.success("PDF generado y descargado correctamente.")
    } catch (error) {
      console.error("[v0] Error generating PDF:", error)
      toast.error("Error al generar el PDF. Intenta nuevamente.")
    } finally {
      setIsGenerating(false)
    }
  }, [data, images])

  const hasMaterials = data.materialBase || data.detalleA || data.detalleB || data.detalleC

  return (
    <div className="flex flex-col gap-6">
      {/* Boton de descarga */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isGenerating ? "Generando..." : "Descargar PDF"}
        </Button>
      </div>

      {/* Vista previa visual */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <div className="min-w-[800px]">
          <PDFPreviewContent data={data} images={images} hasMaterials={!!hasMaterials} />
        </div>
      </div>
    </div>
  )
}

/* Vista previa en HTML para que el usuario vea como queda */
function PDFPreviewContent({
  data,
  images,
  hasMaterials,
}: {
  data: WorkOrderData
  images: string[]
  hasMaterials: boolean
}) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a365d 0%, #2c5282 100%)",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", letterSpacing: "1px", textTransform: "uppercase" }}>
            {(data.producto || "---").toUpperCase()}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
              fontSize: "16px",
              color: "#1a365d",
            }}
          >
            Hi
          </div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", letterSpacing: "1px" }}>
              HI PUBLICIDAD 3D
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", letterSpacing: "2px", textTransform: "uppercase" }}>
              Orden de Trabajo
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginBottom: "2px" }}>BOLETA</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#ffffff", lineHeight: "1" }}>
            #{data.numeroBoleta || "---"}
          </div>
        </div>
      </div>

      {/* Client info bar */}
      <div
        style={{
          backgroundColor: "#f0f4f8",
          padding: "10px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "2px solid #e2e8f0",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                Cliente
              </span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a365d", marginTop: "1px" }}>
                {data.nombreCliente || "---"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                Asesor
              </span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a365d", marginTop: "1px" }}>
                {data.asesorVentas || "---"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                Whatsapp
              </span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a365d", marginTop: "1px" }}>
                {data.numeroWhatsapp || "---"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                Producto
              </span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a365d", marginTop: "1px" }}>
                {data.producto || "---"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                Medidas
              </span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a365d", marginTop: "1px" }}>
                {data.medidas || "---"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                Fecha de Contrato
              </span>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a365d", marginTop: "1px" }}>
                {formatDate(data.fechaContrato)}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-end" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
              Entrega
            </span>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#c53030", marginTop: "1px", textTransform: "uppercase" }}>
              {data.tipoEntrega || "---"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
              Fecha
            </span>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#c53030", marginTop: "1px" }}>
              {formatDate(data.fechaEntrega)}
            </div>
          </div>
        </div>
      </div>

      {/* Body content */}
      <div style={{ display: "flex", padding: "20px 28px", gap: "24px" }}>
        {/* Left column */}
        <div style={{ flex: "1", minWidth: "0" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "6px", borderBottom: "2px solid #1a365d", paddingBottom: "3px", display: "inline-block" }}>
              Descripcion del Producto
            </div>
            <div style={{ fontSize: "12px", color: "#2d3748", lineHeight: "1.6" }}>
              {data.descripcionProducto || "Sin descripcion"}
            </div>
          </div>

          {hasMaterials && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "8px", borderBottom: "2px solid #1a365d", paddingBottom: "3px", display: "inline-block" }}>
                Materiales
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {data.materialBase && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: "#ffffff", backgroundColor: "#1a365d", padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Base</span>
                    <span style={{ fontSize: "11px", color: "#2d3748" }}>{data.materialBase}</span>
                  </div>
                )}
                {data.detalleA && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: "#ffffff", backgroundColor: "#2c5282", padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Det. A</span>
                    <span style={{ fontSize: "11px", color: "#2d3748" }}>{data.detalleA}</span>
                  </div>
                )}
                {data.detalleB && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: "#ffffff", backgroundColor: "#2b6cb0", padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Det. B</span>
                    <span style={{ fontSize: "11px", color: "#2d3748" }}>{data.detalleB}</span>
                  </div>
                )}
                {data.detalleC && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: "#ffffff", backgroundColor: "#3182ce", padding: "1px 6px", borderRadius: "3px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Det. C</span>
                    <span style={{ fontSize: "11px", color: "#2d3748" }}>{data.detalleC}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {data.observaciones && (
            <div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "6px", borderBottom: "2px solid #1a365d", paddingBottom: "3px", display: "inline-block" }}>
                Observaciones
              </div>
              <div style={{ fontSize: "11px", color: "#4a5568", lineHeight: "1.5", fontStyle: "italic", padding: "6px 10px", backgroundColor: "#fffff0", borderLeft: "3px solid #d69e2e", borderRadius: "0 4px 4px 0" }}>
                {data.observaciones}
              </div>
            </div>
          )}

          <div style={{ marginTop: data.observaciones ? "14px" : undefined }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1.5px", fontWeight: "700", marginBottom: "6px", borderBottom: "2px solid #1a365d", paddingBottom: "3px", display: "inline-block" }}>
              Direccion de Envio / Instalacion
            </div>
            <div style={{ fontSize: "11px", color: "#2d3748", lineHeight: "1.5" }}>
              {data.direccion || "---"}
            </div>
          </div>
        </div>

        {/* Right column - Images */}
        <div style={{ width: "380px", flexShrink: 0 }}>
          {images.length > 0 ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1.5px", fontWeight: "700", borderBottom: "2px solid #1a365d", paddingBottom: "3px" }}>
                  Diseno Aprobado
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                    Diseñador
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#1a365d" }}>
                    {data.nombreDiseñador || "---"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div></div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                    Fecha Aprob.
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#1a365d" }}>
                    {formatDate(data.fechaAprobacionDiseno)}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "800", color: "#ffffff", backgroundColor: "#38a169", padding: "2px 12px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Aprobado
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {images.map((img, index) => (
                  <div key={index} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f7fafc", padding: "6px" }}>
                    <img
                      src={img}
                      alt={`Diseno aprobado ${index + 1}`}
                      style={{ width: "100%", maxHeight: images.length > 1 ? "160px" : "300px", objectFit: "contain", borderRadius: "3px" }}
                      crossOrigin="anonymous"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1.5px", fontWeight: "700", borderBottom: "2px solid #1a365d", paddingBottom: "3px" }}>
                  Diseno
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                    Diseñador
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#1a365d" }}>
                    {data.nombreDiseñador || "---"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div></div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", color: "#718096", letterSpacing: "1px", fontWeight: "600" }}>
                    Fecha Aprob.
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: "#1a365d" }}>
                    {formatDate(data.fechaAprobacionDiseno)}
                  </div>
                </div>
              </div>
              <div style={{ height: "100%", minHeight: "200px", border: "2px dashed #cbd5e0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#a0aec0", fontSize: "12px", fontStyle: "italic" }}>
                Sin imagenes de diseno
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "2px solid #e2e8f0", padding: "8px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f7fafc" }}>
        <div style={{ fontSize: "8px", color: "#a0aec0", letterSpacing: "1px" }}>
          HI PUBLICIDAD 3D - ORDEN DE TRABAJO
        </div>
        <div style={{ fontSize: "8px", color: "#a0aec0" }}>
          Generado el{" "}
          {typeof window !== 'undefined' 
            ? new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
            : new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
          }
        </div>
      </div>
    </div>
  )
}
