// ẢNH PHIẾU KẾT QUẢ GỬI PHỤ HUYNH — vẽ thẳng lên canvas rồi xuất PNG.
//
// Vì sao vẽ bằng canvas chứ không chụp DOM: chụp DOM cần thư viện ngoài, mà ảnh
// này phải chạy được cả khi mất mạng và phải ra đúng một cỡ trên mọi máy. Canvas
// cho toàn quyền kiểm soát độ nét (vẽ ở tỉ lệ 2x rồi xuất) nên chữ mịn kể cả khi
// phụ huynh phóng to trên điện thoại.
//
// LUẬT SỐ LIỆU: mọi con số trên ảnh đều do màn gọi truyền vào từ bài ĐÃ CHẤM.
// Hàm này KHÔNG tự tính, không làm tròn kiểu khác, không đoán. Thiếu dữ liệu thì
// bỏ hẳn khối đó khỏi ảnh chứ không điền số giả.

export interface ChuyenDeMatDiem {
  ten: string
  soCau: number
  soSai: number
}

export interface DuLieuAnhPhieu {
  hoTen: string
  sbd: string
  lop?: string
  /** Tên ca kiểm tra, ví dụ "Kiểm tra 15 phút — Ester". Rỗng thì bỏ dòng này. */
  tenCa?: string
  /** Ngày nộp bài (ISO). */
  ngay: string
  diem: number
  xepLoai: string
  diemPhan?: { I: number; II: number; III: number } | null
  /** Điểm tối đa từng phần của chính ca đó — để vẽ thanh cho đúng tỉ lệ. */
  toiDaPhan?: { I: number; II: number; III: number } | null
  soCauSai: number
  tongSoCau?: number | null
  hang?: number | null
  siSo?: number | null
  /** Chuyên đề mất điểm trong ca này, đã sắp giảm dần theo số câu sai. */
  chuyenDe: ChuyenDeMatDiem[]
  /** Việc em phải làm — thầy sửa được trước khi tải ảnh. */
  vieCanLam: string
}

// ---------------------------------------------------------------- BẢNG MÀU
// Ảnh gửi Zalo là "tờ giấy": luôn giấy trắng mực đen, KHÔNG đổi theo nền tối
// của máy thầy — phụ huynh mở trên máy khác. Giá trị nằm ở nhóm --p-* trong
// tokens.css (nhóm đó cố tình không được định nghĩa lại trong khối nền tối),
// đọc ra lúc chạy để mã màu vẫn chỉ có một nguồn.
const TEN_MAU = {
  giay: '--p-giay',
  nen: '--p-nen',
  chim: '--p-chim',
  muc: '--p-muc',
  nhat: '--p-nhat',
  mo: '--p-mo',
  vien: '--p-vien',
  xanh: '--p-xanh',
  do: '--p-do',
  cam: '--p-cam',
  tim: '--p-tim',
  tim2: '--p-tim-2',
  trang: '--p-trang',
} as const

type TenMau = keyof typeof TEN_MAU
const DU_PHONG: Record<TenMau, string> = {
  giay: 'white', nen: 'white', chim: 'gainsboro', muc: 'black', nhat: 'dimgray', mo: 'darkgray',
  vien: 'gainsboro', xanh: 'green', do: 'crimson', cam: 'orange', tim: 'indigo', tim2: 'darkviolet', trang: 'white',
}

/** Đọc nhóm --p-* một lần cho mỗi lần vẽ. jsdom trong test trả rỗng → dùng dự phòng. */
function docMau(): Record<TenMau, string> {
  const css = typeof window !== 'undefined' && typeof getComputedStyle === 'function' ? getComputedStyle(document.documentElement) : null
  const ra = {} as Record<TenMau, string>
  for (const k of Object.keys(TEN_MAU) as TenMau[]) {
    ra[k] = (css?.getPropertyValue(TEN_MAU[k]) || '').trim() || DU_PHONG[k]
  }
  return ra
}

// Cùng dãy phông với tokens.css — Charter thiếu dấu tiếng Việt, vẽ lên canvas
// thì dấu rơi ra và ảnh phiếu gửi phụ huynh mang lỗi đó đi luôn.
const SERIF = "'Noto Serif', 'Source Serif 4', Lora, 'Times New Roman', Cambria, serif"
const SANS = "'Be Vietnam Pro', 'Noto Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const W = 1080 // bề rộng ảnh (px thật sau khi nhân tỉ lệ)
const LE = 64 // lề trái/phải
const TL = 2 // vẽ ở 2x cho nét mịn

function soVN(x: number, soLe = 2): string {
  return x.toFixed(soLe).replace('.', ',')
}

function ngayVN(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Màu theo xếp loại — dùng đúng thang classify() của engine chấm. */
export function mauXepLoai(xepLoai: string, mau = docMau()): string {
  if (xepLoai === 'Giỏi') return mau.xanh
  if (xepLoai === 'Khá') return mau.tim
  if (xepLoai === 'Trung bình') return mau.cam
  return mau.do
}

function boGoc(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  c.beginPath()
  c.moveTo(x + rr, y)
  c.arcTo(x + w, y, x + w, y + h, rr)
  c.arcTo(x + w, y + h, x, y + h, rr)
  c.arcTo(x, y + h, x, y, rr)
  c.arcTo(x, y, x + w, y, rr)
  c.closePath()
}

/** Cắt chữ cho vừa bề rộng, thêm "…" — tên dài không được tràn ra ngoài thẻ. */
function vuaBeRong(c: CanvasRenderingContext2D, chu: string, toiDa: number): string {
  if (c.measureText(chu).width <= toiDa) return chu
  let s = chu
  while (s.length > 1 && c.measureText(s + '…').width > toiDa) s = s.slice(0, -1)
  return s + '…'
}

/** Xuống dòng theo bề rộng. Trả về mảng dòng. */
/** Ngắt dòng theo bề rộng, và TÔN TRỌNG dấu xuống dòng thầy gõ.
 *
 * Bản trước tách bằng `/\s+/` nên "\n" bị coi như dấu cách: hai đoạn thầy viết
 * tách dòng bị dồn thành một khối liền, mất nhịp ngắt. */
function xuongDong(c: CanvasRenderingContext2D, chu: string, toiDa: number): string[] {
  const dong: string[] = []
  for (const doan of (chu || '').split('\n')) {
    const tu = doan.split(/[ \t]+/).filter(Boolean)
    if (tu.length === 0) continue
    let hien = ''
    for (const t of tu) {
      const thu = hien ? `${hien} ${t}` : t
      if (c.measureText(thu).width <= toiDa) hien = thu
      else {
        if (hien) dong.push(hien)
        hien = t
      }
    }
    if (hien) dong.push(hien)
  }
  return dong
}

/** Đo trước chiều cao ảnh: khối nào không có dữ liệu thì không chiếm chỗ. */
function doChieuCao(d: DuLieuAnhPhieu, c: CanvasRenderingContext2D): number {
  let h = 0
  h += 250 // dải đầu
  h += 272 // thẻ điểm
  if (d.diemPhan) h += 56 + 3 * 66 + 34
  const cd = d.chuyenDe.filter((x) => x.soSai > 0).slice(0, 4)
  if (cd.length) h += 56 + cd.length * 70 + 20
  c.font = `500 27px ${SANS}`
  h += 44 + xuongDong(c, d.vieCanLam, W - 2 * LE - 56).length * 40 + 48
  h += 96 // chân phiếu
  return h
}

/** Vẽ ảnh phiếu, trả về canvas đã vẽ xong (chưa xuất file). */
export function veAnhPhieu(d: DuLieuAnhPhieu): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const do_ = canvas.getContext('2d')
  if (!do_) throw new Error('Máy không vẽ được ảnh (canvas 2d)')

  const MAU = docMau()
  const H = doChieuCao(d, do_)
  canvas.width = W * TL
  canvas.height = H * TL
  const c = do_
  c.scale(TL, TL)
  c.textBaseline = 'alphabetic'

  // ---- nền ----
  c.fillStyle = MAU.nen
  c.fillRect(0, 0, W, H)

  // ---- DẢI ĐẦU: gradient tím, tên trung tâm, tên bài ----
  const g = c.createLinearGradient(0, 0, W, 250)
  g.addColorStop(0, MAU.tim)
  g.addColorStop(1, MAU.tim2)
  c.fillStyle = g
  c.fillRect(0, 0, W, 250)

  c.fillStyle = 'rgba(255,255,255,0.9)'
  c.font = `700 26px ${SANS}`
  c.letterSpacing = '3px'
  c.fillText('THẦY ĐỖ ĐẠI HỌC', LE, 74)
  c.letterSpacing = '0px'

  c.fillStyle = MAU.trang
  c.font = `700 52px ${SERIF}`
  c.fillText('Phiếu kết quả bài kiểm tra', LE, 138)

  c.fillStyle = 'rgba(255,255,255,0.85)'
  c.font = `500 27px ${SANS}`
  const dongCa = [d.tenCa, `Ngày ${ngayVN(d.ngay)}`].filter(Boolean).join('  ·  ')
  c.fillText(vuaBeRong(c, dongCa, W - 2 * LE), LE, 184)

  // ---- THẺ ĐIỂM ----
  let y = 250 - 46
  const theH = 272
  c.save()
  c.shadowColor = 'rgba(0,0,0,0.10)'
  c.shadowBlur = 24
  c.shadowOffsetY = 6
  c.fillStyle = MAU.giay
  boGoc(c, LE, y, W - 2 * LE, theH, 28)
  c.fill()
  c.restore()

  // tên em
  c.fillStyle = MAU.muc
  c.font = `700 46px ${SERIF}`
  c.fillText(vuaBeRong(c, d.hoTen || `SBD ${d.sbd}`, W - 2 * LE - 320), LE + 40, y + 80)

  c.fillStyle = MAU.nhat
  c.font = `500 26px ${SANS}`
  const phu = [`SBD ${d.sbd}`, d.lop ? `Lớp ${d.lop}` : ''].filter(Boolean).join('  ·  ')
  c.fillText(phu, LE + 40, y + 124)

  // điểm to bên phải
  const mauXL = mauXepLoai(d.xepLoai, MAU)
  c.textAlign = 'right'
  c.fillStyle = mauXL
  c.font = `700 92px ${SANS}`
  c.fillText(soVN(d.diem), W - LE - 40, y + 110)
  c.textAlign = 'left'

  // nhãn xếp loại
  c.font = `700 26px ${SANS}`
  const nhanW = c.measureText(d.xepLoai).width + 44
  c.fillStyle = mauXL
  boGoc(c, W - LE - 40 - nhanW, y + 136, nhanW, 46, 23)
  c.fill()
  c.fillStyle = MAU.trang
  c.textAlign = 'center'
  c.fillText(d.xepLoai, W - LE - 40 - nhanW / 2, y + 167)
  c.textAlign = 'left'

  // dòng tóm tắt dưới thẻ
  c.fillStyle = MAU.vien
  c.fillRect(LE + 40, y + 206, W - 2 * LE - 80, 1)
  c.fillStyle = MAU.nhat
  c.font = `500 26px ${SANS}`
  const tom: string[] = []
  if (d.tongSoCau) tom.push(`Đúng ${d.tongSoCau - d.soCauSai}/${d.tongSoCau} câu`)
  else tom.push(`Sai ${d.soCauSai} câu`)
  if (d.hang && d.siSo) tom.push(`Hạng ${d.hang}/${d.siSo} lớp`)
  c.fillText(tom.join('  ·  '), LE + 40, y + 246)

  y += theH + 44

  // ---- ĐIỂM TỪNG PHẦN ----
  if (d.diemPhan) {
    c.fillStyle = MAU.muc
    c.font = `700 30px ${SERIF}`
    c.fillText('Điểm từng phần', LE, y + 8)
    y += 56

    const toiDa = d.toiDaPhan ?? { I: 10, II: 10, III: 10 }
    const phan: [string, number, number][] = [
      ['Phần I — trắc nghiệm', d.diemPhan.I, toiDa.I || 1],
      ['Phần II — đúng/sai', d.diemPhan.II, toiDa.II || 1],
      ['Phần III — trả lời ngắn', d.diemPhan.III, toiDa.III || 1],
    ]
    for (const [ten, diem, max] of phan) {
      c.fillStyle = MAU.muc
      c.font = `500 27px ${SANS}`
      c.fillText(ten, LE, y + 26)
      c.textAlign = 'right'
      c.font = `700 27px ${SANS}`
      c.fillText(`${soVN(diem)} / ${soVN(max)}`, W - LE, y + 26)
      c.textAlign = 'left'

      const thanhY = y + 42
      c.fillStyle = MAU.chim
      boGoc(c, LE, thanhY, W - 2 * LE, 14, 7)
      c.fill()
      const ti = max > 0 ? Math.max(0, Math.min(1, diem / max)) : 0
      if (ti > 0) {
        c.fillStyle = ti >= 0.8 ? MAU.xanh : ti >= 0.5 ? MAU.cam : MAU.do
        boGoc(c, LE, thanhY, Math.max(14, (W - 2 * LE) * ti), 14, 7)
        c.fill()
      }
      y += 66
    }
    y += 34
  }

  // ---- CHUYÊN ĐỀ MẤT ĐIỂM ----
  const cd = d.chuyenDe.filter((x) => x.soSai > 0).slice(0, 4)
  if (cd.length) {
    c.fillStyle = MAU.muc
    c.font = `700 30px ${SERIF}`
    c.fillText('Chuyên đề mất điểm', LE, y + 8)
    y += 56
    for (const x of cd) {
      const ti = x.soCau > 0 ? x.soSai / x.soCau : 0
      c.fillStyle = MAU.muc
      c.font = `500 27px ${SANS}`
      c.fillText(vuaBeRong(c, x.ten, W - 2 * LE - 220), LE, y + 26)
      c.textAlign = 'right'
      c.fillStyle = MAU.do
      c.font = `700 27px ${SANS}`
      c.fillText(`sai ${x.soSai}/${x.soCau}`, W - LE, y + 26)
      c.textAlign = 'left'

      const thanhY = y + 42
      c.fillStyle = MAU.chim
      boGoc(c, LE, thanhY, W - 2 * LE, 14, 7)
      c.fill()
      if (ti > 0) {
        c.fillStyle = MAU.do
        boGoc(c, LE, thanhY, Math.max(14, (W - 2 * LE) * ti), 14, 7)
        c.fill()
      }
      y += 70
    }
    y += 20
  }

  // ---- VIỆC CẦN LÀM ----
  c.font = `500 27px ${SANS}`
  const dongViec = xuongDong(c, d.vieCanLam, W - 2 * LE - 56)
  const hopH = 28 + dongViec.length * 40 + 28
  c.fillStyle = MAU.chim
  boGoc(c, LE, y, W - 2 * LE, hopH, 20)
  c.fill()
  c.fillStyle = MAU.tim
  boGoc(c, LE, y, 8, hopH, 4)
  c.fill()

  c.fillStyle = MAU.muc
  c.font = `700 27px ${SANS}`
  c.fillText('Việc cần làm', LE + 32, y + 40)
  c.fillStyle = MAU.nhat
  c.font = `500 27px ${SANS}`
  dongViec.forEach((dg, i) => c.fillText(dg, LE + 32, y + 82 + i * 40))
  y += hopH + 40

  // ---- CHÂN PHIẾU ----
  c.fillStyle = MAU.mo
  c.font = `500 24px ${SANS}`
  c.fillText('Thầy Đỗ Đại Học chấm và gửi', LE, y + 12)
  c.textAlign = 'right'
  c.fillText(ngayVN(d.ngay), W - LE, y + 12)
  c.textAlign = 'left'

  return canvas
}

/** Xuất ảnh phiếu thành PNG. */
export function anhPhieuBlob(d: DuLieuAnhPhieu): Promise<Blob> {
  const canvas = veAnhPhieu(d)
  return new Promise((ok, hong) => {
    canvas.toBlob((b) => (b ? ok(b) : hong(new Error('Không tạo được ảnh PNG'))), 'image/png')
  })
}

/** Tên file tải về — có tên em và ngày để thầy khỏi phải đổi tên. */
export function tenTepPhieu(hoTen: string, sbd: string, ngay: string): string {
  const ten = (hoTen || `SBD-${sbd}`)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const d = new Date(ngay)
  const ns = Number.isFinite(d.getTime())
    ? `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    : ''
  return `phieu-${ten}${ns ? '-' + ns : ''}.png`
}
