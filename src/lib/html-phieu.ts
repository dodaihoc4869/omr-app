// DỰNG HTML PHIẾU BÀI TẬP THEO ĐÚNG MẪU THẦY CHỐT 04-09-2026.
//
// VÌ SAO KHÔNG VẼ THẲNG BẰNG jsPDF NỮA
//
// Mẫu thầy gửi là một trang HTML: nền chuyển sắc phủ kín A4, vòng tròn mờ, chữ
// tô gradient, chữ nền chìm xoay nghiêng, biểu tượng emoji. jsPDF không có
// gradient, không có bóng đổ, không có bộ dựng chữ — vẽ tay chỉ ra thứ *hao
// hao*. Muốn giống 100% thì phải để CHÍNH TRÌNH DUYỆT dựng, rồi mới chụp thành
// PDF (xem `tai-phieu-pdf.ts`).
//
// File này chỉ sinh chuỗi HTML nên test được bằng chuỗi, không cần trình duyệt.
//
// BA CHỖ ĐỔI SO VỚI MẪU GỐC, có lý do:
//   1. `-webkit-background-clip: text` + `text-fill-color: transparent` (chữ
//      "RCOOR'" tô gradient vàng): bộ chụp ảnh không dựng được, ra chữ TÀNG
//      HÌNH. Thay bằng màu vàng đặc `#ffd700` — trong bản in của thầy nhìn ra
//      đúng như vậy.
//   2. `backdrop-filter: blur(10px)`: bộ chụp bỏ qua, nhưng các ô đó đã có nền
//      `rgba(255,255,255,.1)` nên nhìn gần như không khác.
//   3. Số câu mỗi trang KHÔNG cố định 5 như mẫu (mẫu gõ tay). Câu dài ngắn
//      khác nhau, nên trang được cắt theo CHIỀU CAO ĐO ĐƯỢC lúc dựng.
import type { CauLuyen } from './bai-tap-pdf'
import { doanCongThuc } from './chu-hoa-hoc-pdf'

export interface ThongTinPhieu {
  hoTen: string
  sbd: string
  ngay: Date
  /** Tên chuyên đề lớn in ở bìa, vd "ESTER & LIPID". */
  tenChuyenDe: string
  /** Dòng kết quả góc trên bìa. Rỗng thì không in ô đó. */
  ketQua: string
  /** true = bản LỜI GIẢI (tô đáp án đúng, in ô hướng làm). */
  hienDapAn: boolean
}

const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']
const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const LOP_MUC: Record<string, string> = { biet: 'level-1', hieu: 'level-2', van_dung: 'level-3' }
const TEN_LOAI: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
const LOP_LOAI: Record<string, string> = { I: 'type-mc', II: 'type-tf', III: 'type-sa' }

export function thoat(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Chuỗi có công thức Hoá → HTML có <sub>/<sup>, mũi tên là ký tự thật.
 * Dùng lại đúng bộ tách của bản PDF nên hai đường ra không bao giờ lệch nhau. */
export function chuHtml(s: string): string {
  return doanCongThuc(s)
    .map((d) => {
      const v = thoat(d.v)
      if (d.t === 'sub') return `<sub>${v}</sub>`
      if (d.t === 'sup') return `<sup>${v}</sup>`
      return v
    })
    .join('')
}

export function ngayVN(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** Đáp án Phần II "DSDD" → mảng true/false. */
function ysDung(dapAn: string): boolean[] {
  return CHU_Y.map((_, i) => (dapAn || '')[i] === 'D')
}

export const CSS_PHIEU = `
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', 'Inter', system-ui, sans-serif; background: #f0f4f8; color: #1a1a2e;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.cover { width: 210mm; height: 297mm;
  background: linear-gradient(135deg, #0f3057 0%, #00587a 40%, #008891 70%, #00b4a6 100%);
  position: relative; overflow: hidden; page-break-after: always;
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; }
.cover-blob { position: absolute; border-radius: 50%; }
.cover-blob.b1 { top: -100px; right: -100px; width: 400px; height: 400px; background: rgba(255,255,255,0.05); }
.cover-blob.b2 { bottom: -150px; left: -100px; width: 500px; height: 500px; background: rgba(255,255,255,0.04); }
.cover-content { z-index: 2; text-align: center; padding: 40px; }
.cover-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50px; padding: 8px 24px; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px; }
.cover-title { font-size: 52px; font-weight: 900; line-height: 1.15; margin-bottom: 16px; text-shadow: 0 4px 30px rgba(0,0,0,0.3); }
.cover-subtitle { font-size: 22px; font-weight: 300; opacity: 0.9; margin-bottom: 40px; letter-spacing: 1px; }
.cover-chemical { font-size: 42px; font-weight: 700; color: #ffd700; margin-bottom: 50px; letter-spacing: 3px; }
.cover-info { display: flex; gap: 30px; justify-content: center; flex-wrap: wrap; }
.cover-info-item { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 16px 28px; }
.cover-info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.7; margin-bottom: 4px; }
.cover-info-value { font-size: 18px; font-weight: 700; }
.cover-footer { position: absolute; bottom: 30px; left: 0; right: 0; text-align: center; font-size: 14px; opacity: 0.6; z-index: 2; }
.cover-molecule { position: absolute; font-size: 120px; opacity: 0.06; font-weight: 900; z-index: 1; }
.cover-molecule.m1 { top: 15%; left: 10%; transform: rotate(-15deg); }
.cover-molecule.m2 { top: 60%; right: 8%; transform: rotate(20deg); font-size: 90px; }
.cover-molecule.m3 { bottom: 20%; left: 15%; transform: rotate(10deg); font-size: 70px; }

.page { width: 210mm; height: 297mm; overflow: hidden; background: #f8fafc;
  padding: 12mm 14mm 15mm; page-break-after: always; page-break-inside: avoid; position: relative; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
  padding-bottom: 8px; border-bottom: 2px solid #0f3057; }
.page-header-left { display: flex; align-items: center; gap: 12px; }
.page-logo { width: 36px; height: 36px; background: linear-gradient(135deg, #0f3057, #008891); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: 900; }
.page-title { font-size: 15px; font-weight: 800; color: #0f3057; }
.page-subtitle { font-size: 10px; color: #64748b; margin-top: 1px; }
.page-number { background: #0f3057; color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }

.q-card { background: white; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); border-left: 3px solid #e2e8f0; page-break-inside: avoid; }
.q-card.correct { border-left-color: #10b981; }
.q-header { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; }
.q-num { flex-shrink: 0; width: 26px; height: 26px; background: linear-gradient(135deg, #0f3057, #008891);
  color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; }
.q-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 4px; }
.q-tag { font-size: 9px; padding: 2px 8px; border-radius: 20px; font-weight: 600; letter-spacing: 0.5px; }
.q-tag.type-mc { background: #dbeafe; color: #1e40af; }
.q-tag.type-tf { background: #fef3c7; color: #92400e; }
.q-tag.type-sa { background: #e0e7ff; color: #4338ca; }
.q-tag.level-1 { background: #d1fae5; color: #065f46; }
.q-tag.level-2 { background: #fce7f3; color: #9d174d; }
.q-tag.level-3 { background: #fed7aa; color: #9a3412; }
.q-tag.topic { background: #f1f5f9; color: #475569; }
.q-text { font-size: 12px; line-height: 1.45; color: #1e293b; font-weight: 500; margin-bottom: 6px; }
.q-options { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.q-options.single-col { grid-template-columns: 1fr; }
.q-opt { display: flex; align-items: flex-start; gap: 6px; padding: 5px 8px; border-radius: 6px; font-size: 11px;
  line-height: 1.35; background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; }
.q-opt.correct { background: #d1fae5; border-color: #10b981; color: #065f46; font-weight: 700; }
.q-opt-letter { flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; background: #cbd5e1; color: #475569;
  display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
.q-opt.correct .q-opt-letter { background: #10b981; color: white; }
.q-opt-text { flex: 1; }

.tf-row { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 10px; align-items: center; }
.tf-statement { font-size: 11px; color: #475569; line-height: 1.35; padding: 3px 6px; }
.tf-badge { width: 26px; height: 22px; border-radius: 5px; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }
.tf-badge.true { background: #d1fae5; color: #065f46; border-color: #10b981; }
.tf-badge.false { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
.tf-header-cell { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; text-align: center; padding-bottom: 4px; }

.sa-answer { background: linear-gradient(135deg, #0f3057, #008891); color: white; padding: 8px 18px; border-radius: 8px;
  font-size: 16px; font-weight: 800; display: inline-block; margin-top: 3px; }
.sa-blank { border: 1px dashed #94a3b8; border-radius: 8px; padding: 10px 18px; margin-top: 3px; font-size: 11px; color: #94a3b8; }

.sol-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 10px; margin-top: 6px; }
.sol-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #92400e; font-weight: 700; margin-bottom: 2px; }
.sol-text { font-size: 10.5px; line-height: 1.4; color: #78350f; }
.sol-step { font-size: 10.5px; line-height: 1.5; color: #78350f; padding-left: 14px; text-indent: -14px; }

.page-footer { position: absolute; bottom: 5mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between;
  align-items: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; }

.summary-page { background: linear-gradient(135deg, #0f3057 0%, #00587a 50%, #008891 100%); color: white;
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30mm 20mm; }
.summary-title { font-size: 36px; font-weight: 900; margin-bottom: 40px; text-align: center; }
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; max-width: 160mm; margin-bottom: 40px; }
.stat-card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 24px; text-align: center; }
.stat-icon { font-size: 32px; margin-bottom: 8px; }
.stat-number { font-size: 36px; font-weight: 900; }
.stat-label { font-size: 13px; opacity: 0.8; margin-top: 4px; }
.topics-list { background: rgba(255,255,255,0.08); border-radius: 16px; padding: 20px 28px; width: 100%; max-width: 160mm; }
.topics-list h3 { font-size: 16px; margin-bottom: 12px; opacity: 0.9; }
.topic-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 13px; }
.topic-item:last-child { border-bottom: none; }
.topic-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
sub { font-size: 0.72em; vertical-align: -0.25em; }
sup { font-size: 0.72em; vertical-align: 0.42em; }
`

/** Một thẻ câu. `stt` là số thứ tự liên tục trên cả phiếu. */
export function theCauHtml(c: CauLuyen, stt: number, hienDapAn: boolean): string {
  const tags = [
    `<span class="q-tag ${LOP_LOAI[c.phan]}">${TEN_LOAI[c.phan]}</span>`,
    c.mucDo ? `<span class="q-tag ${LOP_MUC[c.mucDo]}">${TEN_MUC[c.mucDo]}</span>` : '',
    c.chuyenDe ? `<span class="q-tag topic">${thoat(c.chuyenDe)}</span>` : '',
  ].join('')

  let than = ''
  if (c.phan === 'I' && c.luaChon) {
    const dai = c.luaChon.some((x) => (x || '').length > 46)
    const o = c.luaChon
      .map((pa, i) => {
        const dung = hienDapAn && CHU_PA[i] === (c.dapAn || '').trim().toUpperCase()
        return `<div class="q-opt${dung ? ' correct' : ''}"><div class="q-opt-letter">${CHU_PA[i]}</div><div class="q-opt-text">${chuHtml(pa)}</div></div>`
      })
      .join('')
    than = `<div class="q-options${dai ? ' single-col' : ''}">${o}</div>`
  } else if (c.phan === 'II' && c.luaChon) {
    const dung = ysDung(c.dapAn)
    const hang = c.luaChon
      .map((y, i) => {
        const d = hienDapAn ? (dung[i] ? ' true' : '') : ''
        const s = hienDapAn ? (!dung[i] ? ' false' : '') : ''
        return `<div class="tf-statement">${CHU_Y[i]}. ${chuHtml(y)}</div><div class="tf-badge${d}">Đ</div><div class="tf-badge${s}">S</div>`
      })
      .join('')
    than = `<div class="tf-row"><div></div><div class="tf-header-cell">Đ</div><div class="tf-header-cell">S</div>${hang}</div>`
  } else {
    than = hienDapAn ? `<div class="sa-answer">${chuHtml(c.dapAn || '—')}</div>` : `<div class="sa-blank">Đáp án: ……………………………</div>`
  }

  const giai = hienDapAn ? oGiaiHtml(c) : ''
  return `<div class="q-card${hienDapAn ? ' correct' : ''}">
  <div class="q-header"><div class="q-num">${stt}</div><div style="flex:1"><div class="q-tags">${tags}</div><div class="q-text">${chuHtml(c.text)}</div></div></div>
  ${than}
  ${giai}
</div>`
}

/** Ô kem: hướng làm, các bước, kết quả. Mục nào rỗng thì không in ra. */
export function oGiaiHtml(c: CauLuyen): string {
  const khoi: string[] = []
  if (c.chot) khoi.push(`<div class="sol-label">💡 Hướng làm</div><div class="sol-text">${chuHtml(c.chot)}</div>`)
  const buoc = c.buoc ?? []
  if (buoc.length > 0) {
    const ds = buoc.map((b, i) => `<div class="sol-step">${i + 1}. ${chuHtml(b)}</div>`).join('')
    khoi.push(`<div class="sol-label" style="margin-top:5px">Làm từng bước</div>${ds}`)
  }
  if (c.ketQua) khoi.push(`<div class="sol-label" style="margin-top:5px">Kết quả</div><div class="sol-text" style="font-weight:700">${chuHtml(c.ketQua)}</div>`)
  if (khoi.length === 0) return ''
  return `<div class="sol-box">${khoi.join('')}</div>`
}

export function biaHtml(t: ThongTinPhieu, soCau: number): string {
  const oKetQua = t.ketQua
    ? `<div class="cover-info-item" style="position:absolute;top:30px;left:30px;z-index:2;background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.3);">
    <div class="cover-info-label" style="color:#fca5a5;">Kết quả</div>
    <div class="cover-info-value" style="color:#fca5a5;">${thoat(t.ketQua)}</div></div>`
    : ''
  const ten = thoat(t.tenChuyenDe || 'Hoá học').toUpperCase()
  return `<div class="cover">
  <div class="cover-blob b1"></div><div class="cover-blob b2"></div>
  <div class="cover-molecule m1">RCOOR'</div>
  <div class="cover-molecule m2">CH<sub>3</sub>COOH</div>
  <div class="cover-molecule m3">C<sub>9</sub>H<sub>8</sub>O<sub>4</sub></div>
  <div class="cover-content">
    <div class="cover-badge">${t.hienDapAn ? 'Lời giải chi tiết' : 'Phiếu Bài Tập Riêng'}</div>
    <div class="cover-title">${ten}</div>
    <div class="cover-subtitle">Bài tập Hóa học Hữu cơ</div>
    <div class="cover-chemical">RCOOR'</div>
    <div class="cover-info">
      <div class="cover-info-item"><div class="cover-info-label">Học sinh</div><div class="cover-info-value">${thoat(t.hoTen || '—')}</div></div>
      <div class="cover-info-item"><div class="cover-info-label">SBD</div><div class="cover-info-value">${thoat(t.sbd || '—')}</div></div>
      <div class="cover-info-item"><div class="cover-info-label">Ngày</div><div class="cover-info-value">${ngayVN(t.ngay)}</div></div>
    </div>
  </div>
  ${oKetQua}
  <div class="cover-footer">Thầy Đỗ Đại Học · ${thoat(t.tenChuyenDe)} · ${soCau} Câu</div>
</div>`
}

export function tongQuanHtml(cau: CauLuyen[]): string {
  const dem = (p: string) => cau.filter((c) => c.phan === p).length
  const muc: [string, string, string][] = [
    ['biet', '#34d399', 'Nhận biết'],
    ['hieu', '#f472b6', 'Thông hiểu'],
    ['van_dung', '#fb923c', 'Vận dụng'],
  ]
  const dong = muc
    .map(([k, mau, ten]) => {
      const ds = cau.map((c, i) => ({ c, i })).filter((x) => x.c.mucDo === k)
      if (ds.length === 0) return ''
      const so = ds.map((x) => x.i + 1)
      const cd = [...new Set(ds.map((x) => x.c.chuyenDe).filter(Boolean))].join(', ')
      return `<div class="topic-item"><div class="topic-dot" style="background:${mau};"></div><span><strong>${ten}:</strong> Câu ${so[0]}–${so[so.length - 1]} · ${ds.length} câu${cd ? ` — ${thoat(cd)}` : ''}</span></div>`
    })
    .join('')
  return `<div class="page summary-page">
  <div class="summary-title">Tổng Quan Đề Bài</div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-number">${cau.length}</div><div class="stat-label">Tổng số câu</div></div>
    <div class="stat-card"><div class="stat-icon">✅</div><div class="stat-number">${dem('I')}</div><div class="stat-label">Trắc nghiệm</div></div>
    <div class="stat-card"><div class="stat-icon">⚖️</div><div class="stat-number">${dem('II')}</div><div class="stat-label">Đúng / Sai</div></div>
    <div class="stat-card"><div class="stat-icon">✏️</div><div class="stat-number">${dem('III')}</div><div class="stat-label">Trả lời ngắn</div></div>
  </div>
  ${dong ? `<div class="topics-list"><h3>📌 Phân loại mức độ</h3>${dong}</div>` : ''}
</div>`
}

export function dauTrangHtml(t: ThongTinPhieu, phu: string, so: number, tong: number): string {
  return `<div class="page-header"><div class="page-header-left"><div class="page-logo">H</div>
    <div><div class="page-title">${thoat(t.tenChuyenDe)} · ${t.hienDapAn ? 'Lời giải' : 'Đề bài'}</div><div class="page-subtitle">${thoat(phu)}</div></div>
  </div><div class="page-number">${so}/${tong}</div></div>`
}

export function chanTrangHtml(t: ThongTinPhieu, so: number, tong: number): string {
  return `<div class="page-footer"><span>Thầy Đỗ Đại Học · ${thoat(t.tenChuyenDe)}</span><span>${so}/${tong}</span></div>`
}

/** Tài liệu HTML hoàn chỉnh, tự chứa — thầy tải về gửi Zalo là mở được ngay. */
export function taiLieuHtml(than: string, tieuDe: string): string {
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${thoat(tieuDe)}</title><style>${CSS_PHIEU}</style></head><body>${than}</body></html>`
}
