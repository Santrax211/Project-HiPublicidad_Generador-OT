import { NextResponse } from "next/server"
import { parseBriefText } from "@/lib/brief-text-parser"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let text = ""

    if (fileName.endsWith(".pdf")) {
      // Use pdf-parse for PDF files
      const pdfParse = (await import("pdf-parse")).default
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfData = await pdfParse(buffer)
      text = pdfData.text
    } else if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv")
    ) {
      // Use xlsx for spreadsheet files
      const XLSX = await import("xlsx")
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })

      const allText: string[] = []
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: "",
        })
        for (const row of rows) {
          const rowText = (row as string[])
            .filter((cell: string) => cell !== "")
            .join(" | ")
          if (rowText.trim()) {
            allText.push(rowText)
          }
        }
      }
      text = allText.join("\n")
    } else {
      return NextResponse.json(
        { error: "Formato no soportado. Use PDF o Excel." },
        { status: 400 }
      )
    }

    console.log("[v0] Extracted text length:", text.length)
    console.log("[v0] First 500 chars:", text.substring(0, 500))

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        {
          error:
            "No se pudo extraer texto del archivo. Verifique que el archivo contenga texto legible.",
        },
        { status: 422 }
      )
    }

    const data = parseBriefText(text)
    console.log("[v0] Parsed data:", JSON.stringify(data, null, 2))
    return NextResponse.json({ data, rawText: text })
  } catch (error) {
    console.error("Error parsing brief:", error)
    return NextResponse.json(
      { error: "Error al procesar el archivo." },
      { status: 500 }
    )
  }
}
