// KHỐI LỜI GIẢI CHUẨN DẠNG CHUỖI HTML — cho trang kết quả tự dựng (cửa sổ/phiếu riêng, không có CSS của app).
// Cùng THỨ TỰ và NHÃN với `KhoiLoiGiaiChuan` (React): LỜI GIẢI → Kiến thức cốt lõi → từng phương án/ý ✓ ✗ → bước → Kết quả (Phần III).
// Màu viết bằng rgb() cố định (trang rời, nền sáng): nhãn rgb(67,56,202) trên nền rgb(238,238,232) ≈ 7:1; chữ rgb(26,35,50) ≈ 14:1.
// Cấm bịa: chỉ in trường kho có; thoát ký tự HTML.
import type { LyDoPhuongAn } from './chuan-hoa-loi-giai'

const thoat = (s: unknown): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export interface DuLieuKhoiLoiGiaiHtml {
  chot?: string
  lyDo?: LyDoPhuongAn[] | null
  buoc?: string[] | null
  /** Chỉ in ở Phần III. */
  ketQua?: string
  phan?: string
}

export function htmlKhoiLoiGiaiChuan(d: DuLieuKhoiLoiGiaiHtml): string {
  const NHAN = 'rgb(67, 56, 202)'
  const CHU = 'rgb(26, 35, 50)'
  const coLyDo = !!d.lyDo && d.lyDo.length > 0
  const coBuoc = !!d.buoc && d.buoc.length > 0
  const coChot = !!d.chot && d.chot.trim() !== ''
  const khoi: string[] = [`<div style="font: 700 13px/1 inherit; letter-spacing: 0.1em; color: ${NHAN}; margin-bottom: 12px;">LỜI GIẢI</div>`]
  if (!coChot && !coLyDo && !coBuoc) khoi.push(`<div style="font-size: 15px; line-height: 1.65; color: ${CHU};">Thầy chưa nhập lời giải cho câu này.</div>`)
  if (coChot) {
    khoi.push(
      `<div style="padding: 8px 12px; margin-bottom: 16px; background: rgb(255, 254, 251); border-left: 3px solid ${NHAN}; border-radius: 0 10px 10px 0; font-size: 15px; font-weight: 700; line-height: 1.6; color: ${CHU};">` +
        `<div style="font: 700 13px/1 inherit; letter-spacing: 0.08em; text-transform: uppercase; color: ${NHAN}; margin-bottom: 4px;">Kiến thức cốt lõi</div>${thoat(d.chot)}</div>`,
    )
  }
  if (coLyDo) {
    khoi.push(
      d.lyDo!
        .map(
          (l) =>
            `<div style="display: flex; gap: 10px; align-items: baseline; padding: 8px 0; border-top: 1px solid rgb(229, 231, 235); font-size: 15px; line-height: 1.65; color: ${CHU};">` +
            `<span role="img" aria-label="${l.dung ? 'đúng' : 'sai'}" style="flex: 0 0 22px; font-weight: 700; text-align: center; color: ${l.dung ? 'rgb(4, 120, 87)' : 'rgb(185, 28, 28)'};">${l.dung ? '✓' : '✗'}</span>` +
            `<span style="flex: 0 0 auto; font-weight: 700; color: rgb(80, 91, 105);">${thoat(l.khoa)}.</span>` +
            `<span style="min-width: 0; overflow-wrap: break-word;">${l.ly ? thoat(l.ly) : '(chưa có lý do)'}</span></div>`,
        )
        .join(''),
    )
  }
  if (coBuoc) {
    khoi.push(
      `<ol style="margin: 12px 0 0; padding-left: 24px; font-size: 15px; line-height: 1.65; color: ${CHU};">${d.buoc!.map((b) => `<li style="padding: 4px 0;">${thoat(b)}</li>`).join('')}</ol>`,
    )
  }
  if (d.phan === 'III' && d.ketQua && d.ketQua.trim()) {
    khoi.push(
      `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgb(229, 231, 235); font-size: 20px; font-weight: 700; color: rgb(4, 120, 87);">Kết quả: ${thoat(d.ketQua)}</div>`,
    )
  }
  return `<div class="loi-giai-chuan" style="padding: 16px 20px; background: rgb(238, 238, 232); border-radius: 16px; margin-top: 16px;">${khoi.join('')}</div>`
}
