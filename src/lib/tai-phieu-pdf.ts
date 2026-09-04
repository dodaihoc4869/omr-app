// DỰNG PHIẾU RỒI CHỤP THÀNH PDF.
//
// CÁCH LÀM VÀ VÌ SAO
//
// Mẫu thầy chốt là một trang HTML có nền chuyển sắc phủ kín A4, vòng tròn mờ,
// chữ nền chìm xoay nghiêng, biểu tượng emoji. Không bộ vẽ PDF nào bằng
// JavaScript dựng lại được đúng những thứ đó. Nên đường đi là:
//
//   1. Sinh HTML đúng mẫu (`html-phieu.ts`).
//   2. Gắn vào trang ở một góc khuất, để CHÍNH TRÌNH DUYỆT dựng — nên nhìn
//      giống hệt bản thầy in ra từ trình duyệt.
//   3. CẮT TRANG THEO CHIỀU CAO ĐO ĐƯỢC: nhét từng thẻ câu vào trang, đo, quá
//      thì mở trang mới. Mẫu gốc gõ tay 5 câu một trang; câu thật dài ngắn khác
//      nhau nên gõ cứng là tràn hoặc thừa nửa trang.
//   4. Chụp từng trang bằng html2canvas rồi ghép vào jsPDF, mỗi ảnh một trang
//      A4 tràn lề.
//
// ĐÁNH ĐỔI, nói rõ để sau không ai tưởng là lỗi: chữ trong PDF là ẢNH, không
// bôi đen chọn được, không tìm kiếm được. Đổi lại giống mẫu 100% và thầy vẫn
// bấm MỘT nút ra một tệp .pdf. Ai cần bản chữ nét thì dùng `inPhieu()` — mở hộp
// in của trình duyệt, chọn "Lưu thành PDF", ra bản vector.
import { jsPDF } from 'jspdf'
import type { CauLuyen } from './bai-tap-pdf'
import { biaHtml, chanTrangHtml, CSS_PHIEU, dauTrangHtml, taiLieuHtml, theCauHtml, tongQuanHtml, type ThongTinPhieu } from './html-phieu'

/** A4 ở 96 dpi — đúng đơn vị `mm` trong CSS quy ra pixel trình duyệt. */
const RONG_PX = 794
const CAO_PX = 1123
/** Chụp ở gấp đôi để in ra không rỗ. Gấp 3 thì ảnh nặng gấp đôi mà mắt thường
 * không phân biệt được trên giấy A4. */
const PHONG = 2

const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }

function khungAn(): HTMLIFrameElement {
  const f = document.createElement('iframe')
  // Để NGOÀI màn hình chứ không `display:none`: ẩn hẳn thì trình duyệt không
  // bố cục, đo ra 0 và chụp ra trang trắng.
  f.setAttribute('aria-hidden', 'true')
  f.style.position = 'fixed'
  f.style.left = '-10000px'
  f.style.top = '0'
  f.style.width = `${RONG_PX}px`
  f.style.height = `${CAO_PX}px`
  f.style.border = '0'
  document.body.appendChild(f)
  return f
}

/** Chia các thẻ câu vào từng trang theo chiều cao THẬT sau khi trình duyệt bố
 * cục. Trả về mảng HTML của phần thân mỗi trang. */
export function chiaTrang(doc: Document, cauHtml: string[], caoConLai: number): string[] {
  const do_ = doc.createElement('div')
  do_.className = 'page'
  do_.style.position = 'absolute'
  do_.style.left = '-99999px'
  doc.body.appendChild(do_)

  const trang: string[] = []
  let dang: string[] = []
  for (const h of cauHtml) {
    const thu = [...dang, h]
    do_.innerHTML = thu.join('')
    if (do_.scrollHeight > caoConLai && dang.length > 0) {
      trang.push(dang.join(''))
      dang = [h]
    } else {
      dang = thu
    }
  }
  if (dang.length > 0) trang.push(dang.join(''))
  do_.remove()
  return trang
}

function phuTrang(cau: CauLuyen[], tu: number, den: number): string {
  const lat = cau.slice(tu, den)
  const muc = [...new Set(lat.map((c) => (c.mucDo ? (TEN_MUC[c.mucDo] ?? c.mucDo) : '')).filter(Boolean))]
  return `${muc.join(' · ') || 'Bài tập'} · Câu ${tu + 1}–${den}`
}

export interface KetQuaDungPhieu {
  html: string
  soTrang: number
}

/** Dựng trọn tài liệu HTML (bìa + tổng quan + các trang câu) đã chia trang
 * đúng theo chiều cao thật. Cần một Document để đo, nên chỉ chạy trên trình
 * duyệt. */
export async function dungPhieuHtml(t: ThongTinPhieu, cau: CauLuyen[]): Promise<KetQuaDungPhieu> {
  const f = khungAn()
  const d = f.contentDocument
  if (!d) {
    f.remove()
    throw new Error('Không dựng được khung đo trang')
  }
  d.open()
  d.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${CSS_PHIEU}</style></head><body></body></html>`)
  d.close()
  // Chờ một nhịp cho trình duyệt áp xong CSS rồi mới đo.
  await new Promise((r) => setTimeout(r, 60))

  try {
    const the = cau.map((c, i) => theCauHtml(c, i + 1, t.hienDapAn))
    // Trang có đầu trang (~56px) và chân trang (~40px) trong vùng padding.
    const caoTrong = CAO_PX - 45 - 57 - 56 - 40
    const nhom = chiaTrang(d, the, caoTrong)

    let dem = 0
    const tongTrang = nhom.length
    const trang = nhom.map((than, i) => {
      const tu = dem
      dem += (than.match(/class="q-card/g) || []).length
      return `<div class="page">${dauTrangHtml(t, phuTrang(cau, tu, dem), i + 1, tongTrang)}${than}${chanTrangHtml(t, i + 1, tongTrang)}</div>`
    })

    const than = [biaHtml(t, cau.length), tongQuanHtml(cau), ...trang].join('\n')
    return { html: taiLieuHtml(than, `${t.hienDapAn ? 'Lời giải' : 'Phiếu bài tập'} ${t.hoTen}`), soTrang: tongTrang + 2 }
  } finally {
    f.remove()
  }
}

/** Chụp tài liệu thành PDF. Mỗi `.cover` / `.page` là một trang A4. */
export async function phieuThanhPdf(html: string): Promise<Blob> {
  const f = khungAn()
  const d = f.contentDocument
  if (!d) {
    f.remove()
    throw new Error('Không dựng được khung in')
  }
  d.open()
  d.write(html)
  d.close()
  await new Promise((r) => setTimeout(r, 120))
  if (d.fonts?.ready) await d.fonts.ready.catch(() => {})

  try {
    const { default: html2canvas } = await import('html2canvas')
    const trang = [...d.querySelectorAll<HTMLElement>('.cover, .page')]
    if (trang.length === 0) throw new Error('Phiếu không có trang nào')

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    for (let i = 0; i < trang.length; i++) {
      const canvas = await html2canvas(trang[i], {
        scale: PHONG,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: RONG_PX,
        height: CAO_PX,
        windowWidth: RONG_PX,
        windowHeight: CAO_PX,
        logging: false,
      })
      // JPEG chất lượng 0,92: nền chuyển sắc mượt mà tệp nhỏ hơn PNG vài lần.
      const anh = canvas.toDataURL('image/jpeg', 0.92)
      if (i > 0) pdf.addPage()
      pdf.addImage(anh, 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
    }
    return pdf.output('blob')
  } finally {
    f.remove()
  }
}

/** Mở hộp in của trình duyệt để thầy chọn "Lưu thành PDF" — bản CHỮ NÉT, chọn
 * và tìm kiếm được, tệp nhỏ. Dùng khi cần bản đẹp nhất để in số lượng lớn. */
export function inPhieu(html: string): void {
  const f = khungAn()
  f.style.left = '-10000px'
  const d = f.contentDocument
  if (!d) {
    f.remove()
    return
  }
  d.open()
  d.write(html)
  d.close()
  setTimeout(() => {
    try {
      f.contentWindow?.focus()
      f.contentWindow?.print()
    } finally {
      setTimeout(() => f.remove(), 60000)
    }
  }, 300)
}

export function taiTep(blob: Blob, ten: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ten
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
