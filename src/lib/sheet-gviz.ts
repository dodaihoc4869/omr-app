// Đọc danh sách lớp từ Google Sheet công khai ("ai có link đều xem") qua
// endpoint gviz. BẮT BUỘC dùng gviz vì /export?format=csv không mở CORS cho
// fetch phía client — trình duyệt sẽ chặn ngay ở bước đầu, gviz thì mở.
export interface ClassListRow {
  sbd: string
  hoTen: string
  sdt: string
  lop: string
  // Giữ toàn bộ cột gốc để không mất dữ liệu khi ánh xạ tay chưa khớp hết.
  raw: Record<string, string>
}

export interface ColumnMapping {
  sbd: string | null
  hoTen: string | null
  sdt: string | null
  lop: string | null
}

const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  sbd: ['sbd', 'số báo danh', 'so bao danh'],
  hoTen: ['họ tên', 'ho ten', 'họ và tên', 'ho va ten', 'tên', 'ten'],
  sdt: ['sđt', 'sdt', 'điện thoại', 'dien thoai', 'số điện thoại', 'so dien thoai'],
  lop: ['lớp', 'lop'],
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase()
}

export function extractSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m ? m[1] : null
}

export function buildGvizUrl(sheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`
}

/** Parser CSV tối giản theo RFC4180: hỗ trợ field trong dấu ngoặc kép có dấu phẩy/xuống dòng. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0))
}

/** Dán tay TSV copy trực tiếp từ Google Sheet — đường dự phòng kín 100%, không cần bật chia sẻ. */
export function parseTsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)
    .map((l) => l.split('\t'))
}

export function autoMatchColumns(header: string[]): ColumnMapping {
  const normalized = header.map(normalizeHeader)
  const mapping: ColumnMapping = { sbd: null, hoTen: null, sdt: null, lop: null }
  ;(Object.keys(HEADER_ALIASES) as (keyof ColumnMapping)[]).forEach((key) => {
    const aliases = HEADER_ALIASES[key]
    const idx = normalized.findIndex((h) => aliases.some((a) => h === a || h.includes(a)))
    if (idx >= 0) mapping[key] = header[idx]
  })
  return mapping
}

export function rowsToClassList(rows: string[][], mapping: ColumnMapping): ClassListRow[] {
  const [header, ...body] = rows
  const idx = (col: string | null) => (col ? header.indexOf(col) : -1)
  const iSbd = idx(mapping.sbd)
  const iHoTen = idx(mapping.hoTen)
  const iSdt = idx(mapping.sdt)
  const iLop = idx(mapping.lop)

  return body.map((r) => {
    const raw: Record<string, string> = {}
    header.forEach((h, i) => (raw[h] = r[i] ?? ''))
    return {
      sbd: iSbd >= 0 ? (r[iSbd] ?? '').trim() : '',
      hoTen: iHoTen >= 0 ? (r[iHoTen] ?? '').trim() : '',
      // Số điện thoại giữ nguyên dạng chuỗi để không mất số 0 đầu.
      sdt: iSdt >= 0 ? (r[iSdt] ?? '').trim() : '',
      lop: iLop >= 0 ? (r[iLop] ?? '').trim() : '',
      raw,
    }
  })
}

export async function fetchClassListFromSheet(sheetUrlOrId: string): Promise<{ rows: string[][]; mapping: ColumnMapping }> {
  const sheetId = extractSheetId(sheetUrlOrId) ?? sheetUrlOrId
  const res = await fetch(buildGvizUrl(sheetId))
  if (!res.ok) {
    throw new Error(`Không tải được Google Sheet (HTTP ${res.status}) — kiểm tra link đã bật "ai có link đều xem" chưa`)
  }
  const text = await res.text()
  const rows = parseCsv(text)
  if (rows.length === 0) throw new Error('Sheet rỗng hoặc không đọc được dữ liệu')
  const mapping = autoMatchColumns(rows[0])
  return { rows, mapping }
}
