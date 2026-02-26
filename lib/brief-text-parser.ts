/**
 * brief-text-parser.ts
 * 
 * PURE TEXT PARSING ONLY. ZERO external imports.
 * Takes a plain text string extracted from a PDF/Excel and returns structured data.
 * Uses "boundary labels" approach: all known headers in the brief act as delimiters
 * so we can cleanly extract the value between one label and the next.
 */

export interface ParsedBriefData {
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
  observaciones: string
}

/**
 * ALL known labels/headers from the brief. Each one acts as a boundary.
 * Order does not matter; they're used for boundary detection only.
 */
const BOUNDARY_LABELS: string[] = [
  // Boleta / Pago
  "N° DE BOLETA",
  "N DE BOLETA",
  "NUMERO DE BOLETA",
  "NRO DE BOLETA",
  "BOLETA N°",
  "BOLETA",
  "FECHA DE PAGO",
  "FECHA DE CONTRATO",

  // Asesor
  "ASESOR DE VENTAS",
  "ASESOR COMERCIAL",
  "VENDEDOR",

  // Categoria
  "CATEGORÍA",
  "CATEGORIA",

  // Cliente
  "NOMBRE DEL CLIENTE",
  "CLIENTE",
  "RAZÓN SOCIAL",
  "RAZON SOCIAL",
  "RUC",
  "DNI",
  "N° DE WHATSAPP",
  "N DE WHATSAPP",
  "NUMERO DE WHATSAPP",
  "WHATSAPP",
  "TELEFONO",
  "TELÉFONO",
  "CELULAR",
  "CORREO",
  "EMAIL",
  "DIRECCIÓN",
  "DIRECCION",
  "DISTRITO",

  // Proyecto
  "NOMBRE DEL PROYECTO",
  "PROYECTO",
  "DESCRIPCION DEL PRODUCTO",
  "DESCRIPCIÓN DEL PRODUCTO",
  "PRODUCTO",

  // Iluminacion
  "TIPO DE ILUMINACIÓN",
  "TIPO DE ILUMINACION",
  "ILUMINACION",
  "COLOR DE LUZ",

  // Medidas
  "MEDIDA DEL ESPACIO DISPONIBLE",
  "MEDIDA DEL ESPACIO",
  "MEDIDA DEL PRODUCTO",
  "MEDIDAS DEL PRODUCTO",
  "MEDIDAS",

  // Base / Materiales
  "DETALLES DE LA BASE",
  "MATERIAL DE LA BASE",
  "DETALLE DEL MARCO DE LA BASE",
  "ACABADO DE LA BASE",
  "COLOR DE LA BASE",
  "ESPESOR DEL MATERIAL",
  "ESPESOR DE LA LETRA",

  // Detalles tecnicos / A B C
  "DETALLES TÉCNICOS",
  "DETALLES TECNICOS",
  "DETALLE A",
  "DETALLE B",
  "DETALLE C",

  // Tipo de material / acabado
  "TIPO DE MATERIAL",
  "TIPO DE ACABADO",
  "COLOR DEL ACABADO",
  "CANTIDAD REQUERIDA",
  "CANTIDAD",

  // Entrega
  "METODO DE ENTREGA",
  "MÉTODO DE ENTREGA",
  "TIPO DE ENTREGA",
  "FORMA DE ENTREGA",
  "FECHA DESEADA DE ENTREGA",
  "FECHA DE ENTREGA",

  // Instalacion
  "INSTALACIÓN",
  "INSTALACION",
  "TIPO DE PARED",
  "TIPO DE SUELO",
  "DETALLE DEL PISO",
  "PISO DONDE SE VA A INSTALAR",
  "¿ESCALERA O ANDAMIOS?",
  "ESCALERA O ANDAMIOS",
  "¿EXISTE PUNTO ELÉCTRICO?",
  "EXISTE PUNTO ELECTRICO",
  "EXISTE PUNTO ELÉCTRICO",
  "ALTURA DE INSTALACIÓN",
  "ALTURA DE INSTALACION",

  // Electricos
  "DETALLES ELÉCTRICOS",
  "DETALLES ELECTRICOS",
  "OBSERVACIONES ELÉCTRICAS NECESARIAS",
  "OBSERVACIONES ELECTRICAS NECESARIAS",
  "VOLTAJE",
  "DISTANCIA AL PUNTO",
  "TIPO DE CONEXIÓN",
  "TIPO DE CONEXION",
  "UBICACIÓN DE TRANSFORMADORES",
  "UBICACION DE TRANSFORMADORES",
  "PUNTO ELÉCTRICO",
  "PUNTO ELECTRICO",

  // Observaciones
  "OBSERVACIONES ADICIONALES",
  "OBSERVACIONES",

  // Logo / Imagenes
  "INSERTAR LOGO DEL CLIENTE",
  "INSERTAR IMAGEN DEL LOGO APROBADO",
  "COLOCAR O ESCRIBIR TIPO DE COLOR",
  "INDICAR EL COLOR EXACTO",
  "FOTOS DE REFERENCIA",
  "FOTO DE LA PARED",
  "FOTO DEL PUNTO ELÉCTRICO",
  "FOTO DEL PUNTO ELECTRICO",
  "REFERENCIA DE LETRERO",
  "¿TIENE LOGO",
  "TIENE LOGO",

  // Info general / headers
  "COLOCAR DETALLES IMPORTANTES",
  "INFORMACIÓN DEL CLIENTE",
  "INFORMACION DEL CLIENTE",
  "INFORMACIÓN DEL PROYECTO",
  "INFORMACION DEL PROYECTO",
  "BRIEF DE PROYECTO",
  "ES OBLIGATORIO",
  "OJO:",
  "OBLIGATORIO",
  "ISOTIPO",
  "LOGOTIPO",
  "IMAGOTIPO",
  "SLOGAN",
]

/**
 * Template/instructional text that should be stripped from values.
 */
const NOISE_PATTERNS: RegExp[] = [
  /^ejm:?\s*/i,
  /^ejemplo:?\s*/i,
  /indicar\s+si\s+el\s+logo.*/i,
  /es\s+obligatorio\s+actualizar.*/i,
  /obligatorio$/i,
  /colocar\s+o\s+escribir.*/i,
  /insertar\s+logo.*/i,
  /insertar\s+imagen.*/i,
  /frase\s+corta.*pegadiza.*/i,
  /parte\s+gr[aá]fica.*palabras.*/i,
  /representaci[oó]n\s+tipogr[aá]fica.*/i,
  /combinaci[oó]n\s+de\s+isotipo.*/i,
  /isotipo:?\s+parte.*/i,
  /logotipo:?\s+representaci.*/i,
  /imagotipo:?\s+combinaci.*/i,
  /slogan:?\s+frase.*/i,
  /ojo:?\s+si\s+el\s+cliente.*/i,
  /solicitar\s+si\s+tiene.*/i,
  /alguna\s+indicaci[oó]n.*/i,
  /indicaciones\s+necesarias.*/i,
  /modelo\s+del\s+letrero\s+de\s+como.*/i,
  /colocar\s+detalles\s+importantes.*/i,
]

function cleanValue(raw: string): string {
  let v = raw
    .replace(/\|/g, " ")
    .replace(/[:\-]+\s*$/, "")
    .replace(/^[:\-|/\s]+/, "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  for (const p of NOISE_PATTERNS) {
    v = v.replace(p, "").trim()
  }

  if (v.length < 2) return ""
  if (/^[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]+$/.test(v)) return ""

  return v
}

function cleanBoleta(raw: string): string {
  const m = raw.match(/(\d+)/)
  return m ? m[1] : raw.trim()
}

function cleanDate(raw: string): string {
  const slash = raw.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (slash) return slash[0]
  const spanish = raw.match(/(\d{1,2})\s+de\s+(\w+)\s+(?:de\s+)?(\d{2,4})/i)
  if (spanish) return spanish[0]
  return raw.trim()
}

/**
 * Given text starting right after a label, finds the value by
 * looking for the nearest next boundary label as the end marker.
 */
function extractUntilNextBoundary(text: string, startPos: number): string {
  const remaining = text.substring(startPos)
  const upperRemaining = remaining.toUpperCase()
  let nearestEnd = remaining.length

  for (const label of BOUNDARY_LABELS) {
    const idx = upperRemaining.indexOf(label)
    if (idx > 0 && idx < nearestEnd) {
      nearestEnd = idx
    }
  }

  return cleanValue(remaining.substring(0, nearestEnd))
}

/**
 * Tries each alias for a field. Returns the value between the matched
 * alias and the next boundary.
 */
function findField(text: string, aliases: string[]): string {
  const upper = text.toUpperCase()

  for (const alias of aliases) {
    const idx = upper.indexOf(alias.toUpperCase())
    if (idx !== -1) {
      const afterLabel = idx + alias.length
      const val = extractUntilNextBoundary(text, afterLabel)
      if (val.length > 0) return val
    }
  }

  return ""
}

/**
 * Collects all text found under multiple field groups and joins them
 * into a single readable string. Used for "Observaciones" to combine
 * INSTALACION + DETALLES ELECTRICOS + OBSERVACIONES.
 */
function collectMultipleFields(text: string, groups: { label: string; aliases: string[] }[]): string {
  const parts: string[] = []

  for (const group of groups) {
    const value = findField(text, group.aliases)
    if (value) {
      parts.push(`${group.label}: ${value}`)
    }
  }

  return parts.join(" | ")
}

/**
 * Main parser: takes raw text and returns structured data.
 */
export function parseBriefText(text: string): ParsedBriefData {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")

  // --- Boleta ---
  const rawBoleta = findField(normalized, [
    "N° DE BOLETA",
    "N DE BOLETA",
    "NUMERO DE BOLETA",
    "NRO DE BOLETA",
    "BOLETA N°",
  ])

  // --- Cliente ---
  const nombreCliente = findField(normalized, [
    "NOMBRE DEL CLIENTE",
  ])

  // --- Asesor ---
  const asesorVentas = findField(normalized, [
    "ASESOR DE VENTAS",
    "ASESOR COMERCIAL",
    "VENDEDOR",
  ])

  // --- Whatsapp ---
  const numeroWhatsapp = findField(normalized, [
    "N° DE WHATSAPP",
    "N DE WHATSAPP",
    "NUMERO DE WHATSAPP",
    "WHATSAPP",
    "CELULAR",
    "TELEFONO",
    "TELÉFONO",
  ])

  // --- Producto ---
  const producto = findField(normalized, [
    "PRODUCTO",
    "NOMBRE DEL PROYECTO",
    "PROYECTO",
  ])

  // --- Fecha de contrato (pago) ---
  const rawFechaContrato = findField(normalized, [
    "FECHA DE PAGO",
    "FECHA DE CONTRATO",
  ])

  // --- Descripcion ---
  const descripcionProducto = findField(normalized, [
    "DESCRIPCION DEL PRODUCTO",
    "DESCRIPCIÓN DEL PRODUCTO",
  ])

  // --- Material base ---
  const materialBase = findField(normalized, [
    "DETALLES DE LA BASE",
    "MATERIAL DE LA BASE",
  ])

  // --- Detalle A ---
  const detalleA = findField(normalized, [
    "DETALLE A",
  ])

  // --- Detalle B ---
  const detalleB = findField(normalized, [
    "DETALLE B",
  ])

  // --- Detalle C ---
  const detalleC = findField(normalized, [
    "DETALLE C",
  ])

  // --- Metodo de entrega ---
  const tipoEntrega = findField(normalized, [
    "METODO DE ENTREGA",
    "MÉTODO DE ENTREGA",
    "TIPO DE ENTREGA",
    "FORMA DE ENTREGA",
  ])

  // --- Fecha de entrega ---
  const rawFecha = findField(normalized, [
    "FECHA DESEADA DE ENTREGA",
    "FECHA DE ENTREGA",
  ])

  // --- Medidas ---
  const medidas = findField(normalized, [
    "MEDIDA DEL PRODUCTO",
    "MEDIDA DEL ESPACIO DISPONIBLE",
    "MEDIDA DEL ESPACIO",
    "MEDIDAS DEL PRODUCTO",
    "MEDIDAS",
  ])

  // --- Direccion ---
  const direccion = findField(normalized, [
    "DIRECCIÓN",
    "DIRECCION",
  ])

  // --- Observaciones: combina Instalacion + Detalles Electricos + Observaciones ---
  const observaciones = collectMultipleFields(normalized, [
    {
      label: "Instalacion",
      aliases: [
        "INSTALACIÓN",
        "INSTALACION",
      ],
    },
    {
      label: "Detalles Electricos",
      aliases: [
        "DETALLES ELÉCTRICOS",
        "DETALLES ELECTRICOS",
        "OBSERVACIONES ELÉCTRICAS NECESARIAS",
        "OBSERVACIONES ELECTRICAS NECESARIAS",
      ],
    },
    {
      label: "Observaciones",
      aliases: [
        "OBSERVACIONES ADICIONALES",
        "OBSERVACIONES",
      ],
    },
  ])

  return {
    numeroBoleta: cleanBoleta(rawBoleta),
    asesorVentas,
    numeroWhatsapp,
    nombreCliente,
    producto,
    fechaContrato: cleanDate(rawFechaContrato),
    descripcionProducto,
    materialBase,
    detalleA,
    detalleB,
    detalleC,
    tipoEntrega,
    fechaEntrega: cleanDate(rawFecha),
    medidas,
    direccion,
    observaciones,
  }
}
