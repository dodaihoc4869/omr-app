// GAME HÓA 2.0 — TỆP PDF "CÂU ĐÃ LÀM" (bản vẽ đã chốt: docs/ban-ve-game-hoa-2-2709/HS-PDF.dc.html).
//
// Thầy chốt 28/09: "có nút tải pdf về máy để học sinh đọc". Đường cũ (dựng phiếu → hộp In → "Lưu thành PDF") trên điện thoại
// thường KHÔNG lưu ra được tệp. Nay dựng tờ A4 đúng bản vẽ ngay trong máy em rồi chuyển thành TỆP .pdf thật:
//   HTML từng trang (794×1123 px) → html2canvas-pro chụp → jsPDF ghép trang → tải về `cau-da-lam-<bộ-lọc>-<ngày>.pdf`.
// Chụp ảnh trang nên phông tiếng Việt (Be Vietnam Pro của app) và công thức (sub/sup + mũi tên vẽ nét của `chuHtml`) ra ĐÚNG
// như trên màn — không phụ thuộc phông nhúng của jsPDF.
//
// Nội dung mỗi câu (bản vẽ): đầu "Câu 17 · Trắc nghiệm · Vận dụng · Cần thầy dạy lại" · ĐỀ ĐẦY ĐỦ · phương án (đáp án xanh ✓,
// em chọn sai đỏ ✗ "(em chọn)") / từng ý "Em: Sai ✗" / "Em trả lời: 2" · LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓✗
// (Phần III: bước + kết quả) · "Lịch sử: …". Lời giải đọc qua `chuanHoaLoiGiaiCau` — cùng bộ đọc với TheCau, không bịa.
// Đáp án chỉ đến từ `hoa2-cau-chi-tiet` (máy chủ chỉ trả câu em ĐÃ làm).
//
// Hai thư viện nặng (jspdf, html2canvas-pro) chỉ nạp khi em bấm Tải PDF (import động) — không vào gói đầu, không vào precache.
// Màu: bản giấy rời khỏi app nên dùng bảng màu riêng của tờ (rgb, đúng bản vẽ), không theo sáng/tối.
import { bangHtml, chuHtml, thoat } from '../../lib/html-phieu'
import { CHUA_CO_LOI_GIAI, chuanHoaLoiGiaiCau } from '../../lib/chuan-hoa-loi-giai'
import type { CauDaLamMuc, ChiTietCau, LanLam } from './api'
import { NHAN_PHAN, NHAN_TRANG_THAI, chuDS, nhanMucDo, tachDungSai, traLoiNganDung } from './cau-chuyen'
import { gioThuNgay, ngayThang } from './thoi-gian'

export interface MucIn {
  muc: CauDaLamMuc
  ct: ChiTietCau
}
export interface ThongTinIn {
  hoTen: string
  lop: string
  sbd: string
  tenChienDich: string
  nhanBoLoc: string
  /** Mốc in (ms). */
  inLuc: number
}

const LECH_VN = 7 * 3600_000

/** "Sai lần gần nhất" → "sai-lan-gan-nhat" (bỏ dấu, đ → d). */
export function slugChu(s: string): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Ngày theo giờ Việt Nam: [ngày, tháng, năm] dạng chuỗi 2 chữ số. */
function ngayVn(ms: number): [string, string, string] {
  const d = new Date(ms + LECH_VN)
  return [String(d.getUTCDate()).padStart(2, '0'), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCFullYear())]
}

/** Tên tệp: `cau-da-lam-sai-lan-gan-nhat-28-09-2026.pdf`. */
export function tenTepPdf(nhanBoLoc: string, ms: number): string {
  const [d, m, y] = ngayVn(ms)
  return `cau-da-lam-${slugChu(nhanBoLoc) || 'tat-ca'}-${d}-${m}-${y}.pdf`
}

/** "Câu đã làm — Sai lần gần nhất" */
export function tieuDePdf(nhanBoLoc: string): string {
  return `Câu đã làm — ${nhanBoLoc}`
}

/** "Nguyễn An · Lớp 12A1 · Chiến dịch Ester – Lipid · 14 câu · In lúc 20:15 Chủ Nhật 04/10/2026" */
export function dongThongTinPdf(tt: ThongTinIn, soCau: number): string {
  const [, , y] = ngayVn(tt.inLuc)
  return [
    tt.hoTen.trim() || (tt.sbd ? `SBD ${tt.sbd}` : ''),
    tt.lop.trim() ? `Lớp ${tt.lop.trim()}` : '',
    tt.tenChienDich.trim() ? `Chiến dịch ${tt.tenChienDich.trim()}` : '',
    `${soCau} câu`,
    `In lúc ${gioThuNgay(tt.inLuc)}/${y}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Chân trang: "Câu đã làm · Nguyễn An · 12A1". */
export function chanTrangPdf(tt: ThongTinIn): string {
  return ['Câu đã làm', tt.hoTen.trim() || (tt.sbd ? `SBD ${tt.sbd}` : ''), tt.lop.trim()].filter(Boolean).join(' · ')
}

/** "Sai 29/09 (có gợi ý)" */
function chuLanIn(l: LanLam): string {
  return `${l.dung ? 'Đúng' : 'Sai'} ${ngayThang(l.ngay)}${l.coGoiY ? ' (có gợi ý)' : ''}`
}

const CHU_Y = ['a', 'b', 'c', 'd'] as const
const CHU_PA = ['A', 'B', 'C', 'D'] as const

function anh(src: string | undefined, alt: string): string {
  return src ? `<img class="pdfc-anh" src="${thoat(src)}" alt="${thoat(alt)}" crossorigin="anonymous">` : ''
}
function anhViTri(ct: ChiTietCau, viTri: string): string {
  return ct.de.hinhAnh
    .filter((h) => h.viTri === viTri)
    .map((h) => anh(h.src, h.alt ?? 'Hình của câu'))
    .join('')
}

/** Đầu câu: "Câu 5 · Đúng–sai · Thông hiểu · Đang ôn · em sai ý a)". */
export function dauCauPdf(m: MucIn): string {
  const { muc, ct } = m
  const phan = ct.de.phan
  const phu: string[] = []
  if (phan === 'II') {
    const em = tachDungSai(ct.emTraLoi) ?? [null, null, null, null]
    const dung = tachDungSai(ct.dapAn)
    const sai = dung ? CHU_Y.filter((_, i) => em[i] !== dung[i]) : []
    if (sai.length) phu.push(`em sai ý ${sai.map((c) => `${c})`).join(', ')}`)
  }
  return [
    muc.stt > 0 ? `Câu ${muc.stt}` : 'Câu',
    NHAN_PHAN[phan],
    nhanMucDo(ct.de.mucDo ?? muc.mucDo),
    NHAN_TRANG_THAI[muc.trangThai],
    ...phu,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Một câu trên tờ PDF — đúng khối của bản vẽ HS-PDF. */
export function cauPdfHtml(m: MucIn): string {
  const { muc, ct } = m
  const { de } = ct
  const lg = chuanHoaLoiGiaiCau(ct.loiGiai, de.phan, ct.dapAn)
  const phan: string[] = []
  phan.push(`<div class="pdfc-dau">${thoat(dauCauPdf(m))}</div>`)

  // ĐỀ ĐẦY ĐỦ (Phần III: câu trả lời của em nối ngay sau đề, như bản vẽ).
  let emIII = ''
  if (de.phan === 'III') {
    const em = String(ct.emTraLoi ?? '').trim()
    const dung = traLoiNganDung(em, ct.dapAn)
    emIII = ` <b class="${dung ? 'pdfc-xanh' : 'pdfc-do'}">Em trả lời: ${em ? chuHtml(em) : 'bỏ trống'} ${dung ? '✓' : '✗'}</b>`
  }
  phan.push(
    de.thanCauImg
      ? `<div class="pdfc-de">${anh(de.thanCauImg, 'Đề bài')}${emIII}</div>`
      : `<div class="pdfc-de">${chuHtml(de.text)}${emIII}</div>`,
  )
  const phuDe = [anh(de.imageDataUrl, 'Hình của câu'), anhViTri(ct, 'sau_de'), bangHtml(de.table)].join('')
  if (phuDe) phan.push(`<div class="pdfc-phu">${phuDe}</div>`)

  if (de.phan === 'I') {
    const chon = String(ct.emTraLoi ?? '').trim().toUpperCase()
    const dung = ct.dapAn.trim().toUpperCase()
    const dai = de.choices.some((c) => c.length > 40) || de.choiceImgs?.some(Boolean) ? 1 : de.choices.some((c) => c.length > 12) ? 2 : 4
    const o = CHU_PA.map((k, i) => {
      const noi = de.choiceImgs?.[i] ? anh(de.choiceImgs[i], `Phương án ${k}`) : chuHtml(de.choices[i] ?? '')
      const laDung = k === dung
      const laChon = k === chon
      if (laDung) return `<span class="pdfc-pa pdfc-pa-dung" data-pa="dung">${k}. ${noi} ✓${laChon ? ' (em chọn)' : ''}</span>`
      if (laChon) return `<span class="pdfc-pa pdfc-pa-sai" data-pa="sai">${k}. ${noi} ✗ (em chọn)</span>`
      return `<span class="pdfc-pa">${k}. ${noi}</span>`
    }).join('')
    // Phương án ngắn: 4 cột co theo chữ (nhãn "✗ (em chọn)" không bị gãy dòng); dài: 2 hoặc 1 cột.
    const cot = dai === 4 ? 'repeat(4,max-content);column-gap:36px' : `repeat(${dai},minmax(0,1fr))`
    phan.push(`<div class="pdfc-ds-pa" style="grid-template-columns:${cot}">${o}</div>`)
    if (!chon) phan.push(`<div class="pdfc-ghi">Em bỏ trống câu này.</div>`)
  } else if (de.phan === 'II') {
    const em = tachDungSai(ct.emTraLoi) ?? [null, null, null, null]
    const dung = tachDungSai(ct.dapAn)
    const dai = de.ideas.some((c) => c.length > 60) ? 1 : 2
    const o = CHU_Y.map((c, i) => {
      const v = em[i] ?? null
      const dungY = !!dung && v !== null && v === dung[i]
      const anhY = de.ideaImgs?.[i] ? anh(de.ideaImgs[i], `Ý ${c}`) : ''
      return `<span class="pdfc-y">${c}) ${chuHtml(de.ideas[i] ?? '')}${anhY} <b class="${dungY ? 'pdfc-xanh' : 'pdfc-do'}">Em: ${chuDS(v)} ${dungY ? '✓' : '✗'}</b></span>`
    }).join('')
    phan.push(`<div class="pdfc-ds-y" style="grid-template-columns:repeat(${dai},minmax(0,1fr))">${o}</div>`)
  }
  const cuoi = anhViTri(ct, 'cuoi_cau')
  if (cuoi) phan.push(`<div class="pdfc-phu">${cuoi}</div>`)

  // LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓✗ (hoặc các bước + kết quả).
  const lgh: string[] = ['<div class="pdfc-lgn">LỜI GIẢI</div>']
  if (lg.thieu && !anhViTri(ct, 'sau_loi_giai')) {
    lgh.push(`<div class="pdfc-ghi">${thoat(CHUA_CO_LOI_GIAI)} Đáp án: <b>${chuHtml(de.phan === 'II' ? (tachDungSai(ct.dapAn) ?? []).map(chuDS).join(' · ') : ct.dapAn)}</b></div>`)
  } else {
    if (lg.chot.trim()) lgh.push(`<div class="pdfc-chot"><div class="pdfc-chotn">KIẾN THỨC CỐT LÕI</div><div class="pdfc-chott">${chuHtml(lg.chot)}</div></div>`)
    if (lg.lyDo && (de.phan === 'I' || de.phan === 'II')) {
      const dungI = ct.dapAn.trim().toUpperCase()
      const dungII = tachDungSai(ct.dapAn)
      for (const l of lg.lyDo) {
        const iY = CHU_Y.indexOf(l.khoa as (typeof CHU_Y)[number])
        const laDung = de.phan === 'I' ? (/^[A-D]$/.test(dungI) ? l.khoa === dungI : l.dung) : dungII && iY >= 0 ? dungII[iY] === 'D' : l.dung
        const ma = de.phan === 'I' ? `${l.khoa}.` : `${l.khoa})`
        lgh.push(
          `<div class="pdfc-ly"><span class="pdfc-d ${laDung ? 'pdfc-dd' : 'pdfc-ds'}">${laDung ? '✓' : '✗'}</span><span class="pdfc-ma">${thoat(ma)}</span><span>${chuHtml(l.ly) || '—'}</span></div>`,
        )
      }
    }
    if (lg.buoc?.length) {
      lg.buoc.forEach((b, i) => lgh.push(`<div class="pdfc-b"><span class="pdfc-bs">${i + 1}</span><span>${chuHtml(b)}</span></div>`))
    }
    if (de.phan === 'III' && (lg.ketQua || ct.dapAn)) lgh.push(`<div class="pdfc-kq">${chuHtml(lg.ketQua || ct.dapAn)}</div>`)
    const anhGiai = anhViTri(ct, 'sau_loi_giai')
    if (anhGiai) lgh.push(`<div class="pdfc-phu">${anhGiai}</div>`)
  }
  phan.push(`<div class="pdfc-lg">${lgh.join('')}</div>`)
  if (muc.lichSu.length) phan.push(`<div class="pdfc-ls">Lịch sử: ${thoat(muc.lichSu.map(chuLanIn).join(' · '))}</div>`)
  return `<section class="pdfc-cau">${phan.join('')}</section>`
}

/** Khối đầu tờ: tiêu đề + dòng thông tin. */
export function dauPdfHtml(tt: ThongTinIn, soCau: number): string {
  return `<header class="pdfc-dau-to"><div class="pdfc-tieu">${thoat(tieuDePdf(tt.nhanBoLoc))}</div><div class="pdfc-tt">${thoat(dongThongTinPdf(tt, soCau))}</div></header>`
}

export const RONG_TRANG = 794
export const CAO_TRANG = 1123

export const CSS_PDF = `
.pdfc-goc{position:fixed;left:-20000px;top:0;width:${RONG_TRANG}px;pointer-events:none;z-index:-1}
.pdfc-goc *,.pdfc-goc *::before,.pdfc-goc *::after{box-sizing:border-box}
.pdfc-trang{width:${RONG_TRANG}px;min-height:${CAO_TRANG}px;padding:44px 56px 32px;display:flex;flex-direction:column;gap:14px;background:rgb(255 255 255);color:rgb(31 31 31);font-family:'Be Vietnam Pro','Noto Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.pdfc-dau-to{display:flex;flex-direction:column;gap:4px;padding-bottom:10px;border-bottom:2px solid rgb(31 31 31)}
.pdfc-tieu{font-size:22px;font-weight:700;line-height:1.3}
.pdfc-tt{font-size:13px;color:rgb(68 71 70);line-height:1.5}
.pdfc-cau{display:flex;flex-direction:column;gap:6px;padding-bottom:12px;border-bottom:1px solid rgb(196 199 197)}
.pdfc-dau{font-size:12px;font-weight:700;color:rgb(68 71 70)}
.pdfc-de{font-size:14px;line-height:1.55;white-space:pre-line;overflow-wrap:anywhere}
.pdfc-phu{display:flex;flex-wrap:wrap;gap:8px}
.pdfc-anh{max-width:100%;max-height:360px;height:auto}
.pdfc-ds-pa{display:grid;gap:4px 8px;font-size:14px;line-height:1.5}
.pdfc-pa-dung{font-weight:700;color:rgb(20 108 46)}
.pdfc-pa-sai{font-weight:700;color:rgb(179 38 30)}
.pdfc-ds-y{display:grid;gap:2px 16px;font-size:13px;line-height:1.5}
.pdfc-xanh{font-weight:700;color:rgb(20 108 46)}
.pdfc-do{font-weight:700;color:rgb(179 38 30)}
.pdfc-ghi{font-size:13px;line-height:1.5;color:rgb(68 71 70)}
.pdfc-lg{padding:12px 14px;border-radius:12px;background:rgb(233 238 246)}
.pdfc-lgn{font-size:12px;font-weight:700;letter-spacing:.1em;color:rgb(11 87 208);margin-bottom:8px}
.pdfc-chot{margin-bottom:8px;padding:6px 10px;border-left:3px solid rgb(11 87 208);background:rgb(240 244 249);border-radius:0 8px 8px 0}
.pdfc-chotn{font-size:11px;font-weight:700;letter-spacing:.08em;color:rgb(11 87 208);margin-bottom:2px}
.pdfc-chott{font-size:14px;font-weight:700;line-height:1.5}
.pdfc-ly{display:grid;grid-template-columns:18px 22px minmax(0,1fr);gap:8px;align-items:baseline;padding:4px 0;font-size:13px;line-height:1.5}
.pdfc-d{width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.pdfc-dd{background:rgb(196 238 208);color:rgb(20 108 46)}
.pdfc-ds{background:rgb(249 222 220);color:rgb(179 38 30)}
.pdfc-ma{font-weight:700;color:rgb(68 71 70)}
.pdfc-b{display:grid;grid-template-columns:18px minmax(0,1fr);gap:8px;align-items:baseline;padding:3px 0;font-size:13px;line-height:1.5}
.pdfc-bs{width:18px;height:18px;border-radius:9px;background:rgb(11 87 208);color:rgb(255 255 255);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}
.pdfc-kq{margin-top:6px;padding-top:6px;border-top:1px solid rgb(201 210 224);font-size:16px;font-weight:700;color:rgb(20 108 46)}
.pdfc-ls{font-size:11px;color:rgb(68 71 70);line-height:1.5}
.pdfc-chan{margin-top:auto;display:flex;justify-content:space-between;gap:12px;font-size:11px;color:rgb(68 71 70);border-top:1px solid rgb(196 199 197);padding-top:8px}
.pdfc-goc table{border-collapse:collapse;font-size:13px}
.pdfc-goc th,.pdfc-goc td{border:1px solid rgb(196 199 197);padding:4px 8px;text-align:center}
.pdfc-goc sub,.pdfc-goc sup{font-size:.72em;line-height:0}
.pdfc-goc .mt{display:inline-grid;justify-items:center;align-items:center;vertical-align:middle;margin:0 3px;line-height:1.15;text-align:center}
.pdfc-goc .mt-tren,.pdfc-goc .mt-duoi{font-size:.74em;white-space:nowrap;padding:0 4px}
.pdfc-goc .mt-than{position:relative;width:100%;min-width:26px;height:0;border-top:1.4px solid currentColor;margin:3px 0}
.pdfc-goc .mt-than::after,.pdfc-goc .mt-than::before{content:"";position:absolute;top:-4px;width:0;height:0;border:4px solid transparent}
.pdfc-goc .mt-phai::after{right:-1px;border-right:0;border-left-color:currentColor}
.pdfc-goc .mt-trai::before{left:-1px;border-left:0;border-right-color:currentColor}
.pdfc-goc .mt-hai{height:5px;border-bottom:1.4px solid currentColor}
.pdfc-goc .mt-hai::after{top:-4px;right:-1px;border-right:0;border-left-color:currentColor}
.pdfc-goc .mt-hai::before{top:1px;left:-1px;border-left:0;border-right-color:currentColor}
.pdfc-goc .mt-tran{margin:0 5px}
.pdfc-goc .mt-tran .mt-than{min-width:20px}
`

/** Chia khối vào trang theo chiều cao đo được (tham lam, không cắt đôi một câu; câu dài hơn một trang đứng riêng). */
export function chiaTrang(cao: number[], caoToiDa: number, khe = 14): number[][] {
  const trang: number[][] = []
  let hien: number[] = []
  let dung = 0
  cao.forEach((h, i) => {
    const them = hien.length ? khe + h : h
    if (hien.length && dung + them > caoToiDa) {
      trang.push(hien)
      hien = [i]
      dung = h
    } else {
      hien.push(i)
      dung += them
    }
  })
  if (hien.length) trang.push(hien)
  return trang
}

/** HTML đầy đủ của tờ (để xem thử / kiểm) — các trang nối nhau. */
export function htmlToPdf(tt: ThongTinIn, ds: MucIn[]): string {
  return `<div class="pdfc-goc"><div class="pdfc-trang">${dauPdfHtml(tt, ds.length)}${ds.map(cauPdfHtml).join('')}<div class="pdfc-chan"><span>${thoat(chanTrangPdf(tt))}</span><span>Trang 1/1</span></div></div></div>`
}

async function choPhong(): Promise<void> {
  const f = (document as Document & { fonts?: FontFaceSet }).fonts
  if (!f) return
  const mau = 'Câu đã làm ắẩễộ ₂ → ✓✗'
  await Promise.all(['400', '600', '700'].map((w) => f.load(`${w} 14px "Be Vietnam Pro"`, mau).catch(() => [])))
  await f.ready.catch(() => undefined)
}

async function choAnh(goc: HTMLElement): Promise<void> {
  const ds = Array.from(goc.querySelectorAll('img'))
  await Promise.all(
    ds.map((im) =>
      im.complete
        ? Promise.resolve()
        : new Promise<void>((xong) => {
            im.addEventListener('load', () => xong(), { once: true })
            im.addEventListener('error', () => xong(), { once: true })
            setTimeout(xong, 8000)
          }),
    ),
  )
}

/** Dựng TỆP PDF (Blob) cho các câu đang lọc. `tienDo(trang, tong)` báo sau mỗi trang. */
export async function dungPdf(tt: ThongTinIn, ds: MucIn[], tienDo?: (trang: number, tong: number) => void): Promise<Blob> {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')])
  const goc = document.createElement('div')
  goc.className = 'pdfc-goc'
  goc.setAttribute('aria-hidden', 'true')
  const kieu = document.createElement('style')
  kieu.textContent = CSS_PDF
  goc.appendChild(kieu)
  document.body.appendChild(goc)
  try {
    await choPhong()
    // 1) Đo từng khối ở đúng bề rộng trang.
    const khoi = [dauPdfHtml(tt, ds.length), ...ds.map(cauPdfHtml)]
    const do_ = document.createElement('div')
    do_.className = 'pdfc-trang'
    do_.style.minHeight = '0'
    do_.innerHTML = khoi.join('')
    goc.appendChild(do_)
    await choAnh(do_)
    const cao = Array.from(do_.children).map((e) => (e as HTMLElement).offsetHeight)
    goc.removeChild(do_)
    // Chiều cao dành cho nội dung: trang trừ lề trên/dưới (44 + 32) và chân trang (~26 px + khe 14).
    const trang = chiaTrang(cao, CAO_TRANG - 44 - 32 - 26 - 14)
    const tong = trang.length
    const scale = tong > 24 ? 1.5 : 2
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true })
    const rongPt = pdf.internal.pageSize.getWidth()
    const caoPt = pdf.internal.pageSize.getHeight()
    let dauTien = true
    for (let t = 0; t < tong; t++) {
      const el = document.createElement('div')
      el.className = 'pdfc-trang'
      el.innerHTML = `${trang[t]!.map((i) => khoi[i]).join('')}<div class="pdfc-chan"><span>${thoat(chanTrangPdf(tt))}</span><span>Trang ${t + 1}/${tong}</span></div>`
      goc.appendChild(el)
      await choAnh(el)
      const canvas = await html2canvas(el, { scale, backgroundColor: 'rgb(255, 255, 255)', useCORS: true, logging: false, width: RONG_TRANG, windowWidth: RONG_TRANG })
      const anhTrang = canvas.toDataURL('image/jpeg', 0.9)
      const caoAnhPt = (canvas.height / canvas.width) * rongPt
      // Câu dài hơn một trang: cùng một ảnh, dịch lên từng khổ A4.
      for (let y = 0; y < caoAnhPt - 1; y += caoPt) {
        if (!dauTien) pdf.addPage()
        dauTien = false
        pdf.addImage(anhTrang, 'JPEG', 0, -y, rongPt, caoAnhPt, undefined, 'FAST')
      }
      goc.removeChild(el)
      canvas.width = 0
      canvas.height = 0
      tienDo?.(t + 1, tong)
    }
    pdf.setProperties({ title: tieuDePdf(tt.nhanBoLoc), subject: dongThongTinPdf(tt, ds.length), creator: 'Câu đã làm' })
    return pdf.output('blob')
  } finally {
    goc.remove()
  }
}

/** Tải Blob về máy với tên tệp cho trước (máy tính: vào thư mục Tải về; iPhone/Android: hộp tải/lưu tệp của trình duyệt). */
export function luuTep(blob: Blob, ten: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ten
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
