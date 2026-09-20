// PHIẾU BTVN "NÂNG ĐỠ" (bài `ca_nhan`) — MẢNH HTML + CSS RIÊNG, để html-phieu.ts khỏi phình thêm.
// Bản vẽ đã duyệt: docs/ban-ve-btvn-nang-do-2109/hs-*.jpg (Boss 21/09).
//
// Chỉ được dùng khi chỗ gọi khai `caNhan` cho `dungPhieu`. Phiếu KHÔNG khai `caNhan` không có một byte nào của
// tệp này. Màu chỉ dùng token của khối M3 trong phiếu (`--gm-*`) hoặc rgb() — không hex (npm run check:mau).
// (Cấm dấu huyền ngược và ký hiệu đô-la-ngoặc-nhọn trong khối CSS: cả khối nằm trong một chuỗi mẫu.)
import { thongTinNhan, type NhanCauEm } from './btvn-ca-nhan-kieu'

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const svg = (trong: string, co = 15): string =>
  `<svg class="gcn-i" viewBox="0 0 24 24" width="${co}" height="${co}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${trong}</svg>`

const USER_TRONG = '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>'

const ICON = {
  zap: svg('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>'),
  target: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  user: svg(USER_TRONG),
  flag: svg('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>'),
  tick: svg('<polyline points="20 6 9 17 4 12"/>', 14),
  clock: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', 16),
} as const

/** Nhãn nhẹ trên thẻ câu: khởi động / cốt lõi / dành riêng cho em / thử thách (+ cốt lõi câu cao). */
export function nhanChipHtml(n: NhanCauEm): string {
  const t = thongTinNhan(n)
  return `<span class="gcn-nhan gcn-${t.kieu}" data-nhan="${esc(n)}">${ICON[t.bieuTuong]}${esc(t.chu)}</span>`
}

/** Dải "sai không sao" — CHỈ câu thưởng (thử thách, lõi cao). Câu thường: rỗng. */
export function ghiThuongHtml(n: NhanCauEm): string {
  const t = thongTinNhan(n)
  return t.ghi ? `<div class="gcn-ghi" role="note">${ICON.flag}<span>${esc(t.ghi)}</span></div>` : ''
}

export interface DauBaiCaNhanVao {
  tong: number
  soChang: number
  phutMoiNgay: number | null
  /** "28/09" — hạn nộp, rỗng thì bỏ. */
  han: string
  chang: { chiSo: number; daXong: boolean }[]
  /** Chặng đang hiện trên phiếu (0-based). */
  chiSoHienThi: number | null
  /** Chữ dưới chấm chặng: { chiSo: 'Hôm nay' | 'Mai' | '24/09' }. */
  nhanChang: Record<number, string>
}

/** Thẻ đầu bài "Bài của riêng em": chỉ số ĐẾM của chính em — không bao giờ có số của bạn khác. */
export function heroCaNhanHtml(d: DauBaiCaNhanVao): string {
  const dong = [d.phutMoiNgay ? `Khoảng ${d.phutMoiNgay} phút mỗi ngày` : '', d.han ? `hạn ${d.han}` : ''].filter(Boolean).join(' · ')
  const cham = d.chang
    .map((c) => {
      const nay = c.chiSo === d.chiSoHienThi
      const lop = ['gcn-c', c.daXong ? 'gcn-xong' : '', nay ? 'gcn-nay' : ''].filter(Boolean).join(' ')
      const ten = `Chặng ${c.chiSo + 1}${c.daXong ? ', đã xong' : nay ? ', đang làm' : ''}`
      return `<li class="${lop}"${nay ? ' aria-current="step"' : ''} aria-label="${esc(ten)}"><span class="gcn-cham">${c.daXong ? ICON.tick : c.chiSo + 1}</span><em>${esc(d.nhanChang[c.chiSo] ?? '')}</em></li>`
    })
    .join('')
  const chip = (['khoi_dong', 'loi', 'dang_yeu', 'thu_thach'] as const).map(nhanChipHtml).join('')
  return `<section class="gcn-hero" id="gcn-hero" aria-label="Bài của riêng em">
  <div class="gcn-hero-nhan"><span class="gcn-o-bt">${svg(USER_TRONG, 22)}</span>Bài của riêng em</div>
  <div class="gcn-hero-so"><b>${d.tong}</b> câu<span class="gcn-sep" aria-hidden="true">·</span><b>${d.soChang}</b> chặng</div>
  ${dong ? `<div class="gcn-hero-phu">${esc(dong)}</div>` : ''}
  ${cham ? `<ol class="gcn-chang">${cham}</ol>` : ''}
  <div class="gcn-nhan-hang" aria-label="Nhãn từng câu">${chip}</div>
</section>`
}

/** Dòng "Chặng 2 mở ngày mai" khi chưa có câu nào để làm. */
export function ghiChoHtml(chu: string): string {
  return chu ? `<div class="gcn-cho" role="status">${ICON.clock}<span>${esc(chu)}</span></div>` : ''
}

export const CSS_PHIEU_CA_NHAN = `
/* ===== BTVN NÂNG ĐỠ (bài ca_nhan) — chỉ chèn khi phiếu khai caNhan ===== */
@media screen {
html.gd-m3 body {
  --gcn-vang-nen: rgb(254 247 224); --gcn-vang-chu: rgb(92 68 0);
}
@media (prefers-color-scheme: dark) {
  html.gd-m3 body { --gcn-vang-nen: rgb(66 50 0); --gcn-vang-chu: rgb(255 224 130); }
}
html.gd-m3 body .gcn-i { flex: none; }
html.gd-m3 body .gcn-hero {
  margin: 0 0 12px; padding: 16px 16px 14px; border-radius: 28px;
  background: var(--gm-primary-c); color: var(--gm-on-primary-c);
}
html.gd-m3 body .gcn-hero-nhan { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; }
html.gd-m3 body .gcn-o-bt { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--gm-lowest); color: var(--gm-primary); }
html.gd-m3 body .gcn-hero-so { margin-top: 10px; font-size: 30px; font-weight: 700; line-height: 1.15; letter-spacing: -0.3px; }
html.gd-m3 body .gcn-hero-so b { font-weight: 700; }
html.gd-m3 body .gcn-sep { margin: 0 10px; font-size: 24px; font-weight: 500; opacity: 0.7; }
html.gd-m3 body .gcn-hero-phu { margin-top: 4px; font-size: 15px; opacity: 0.85; }
html.gd-m3 body .gcn-chang { list-style: none; margin: 16px 0 0; padding: 0; display: flex; }
html.gd-m3 body .gcn-c { flex: 1; position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
html.gd-m3 body .gcn-c::before { content: ''; position: absolute; top: 13px; left: -50%; width: 100%; height: 3px; border-radius: 2px; background: currentColor; opacity: 0.18; }
html.gd-m3 body .gcn-c:first-child::before { display: none; }
html.gd-m3 body .gcn-c em { font-style: normal; min-height: 16px; line-height: 16px; white-space: nowrap; opacity: 0.85; }
html.gd-m3 body .gcn-cham { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--gm-lowest); font-size: 13px; font-weight: 700; }
html.gd-m3 body .gcn-xong .gcn-cham { background: var(--gm-tertiary); color: var(--gm-surface); }
html.gd-m3 body .gcn-nay .gcn-cham { background: var(--gm-primary); color: var(--gm-on-primary); box-shadow: 0 0 0 4px var(--gm-lowest); }
html.gd-m3 body .gcn-nay { color: var(--gm-primary); font-weight: 700; }
html.gd-m3 body .gcn-nay em { opacity: 1; }
html.gd-m3 body .gcn-nhan-hang { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }

html.gd-m3 body .gcn-nhan { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px 0 10px; border-radius: 999px; font-size: 13px; font-weight: 700; white-space: nowrap; }
html.gd-m3 body .gcn-kd { background: var(--gm-tertiary-c); color: var(--gm-on-tertiary-c); }
html.gd-m3 body .gcn-cl { background: var(--gm-sc-high); color: var(--gm-on-surface-v); }
html.gd-m3 body .gcn-rr { background: var(--gm-primary-c); color: var(--gm-on-primary-c); }
html.gd-m3 body .gcn-tt { background: var(--gcn-vang-nen); color: var(--gcn-vang-chu); }
html.gd-m3 body .gcn-hero .gcn-cl { background: var(--gm-lowest); }
html.gd-m3 body .gcn-hero .gcn-rr { background: var(--gm-lowest); color: var(--gm-primary); }
html.gd-m3 body .gcn-hang-nhan { display: flex; align-items: center; margin: 0 0 10px; }
/* Hàng chip của thẻ câu: nhãn của bài cá nhân hoá cao hơn chip cũ ⇒ căn giữa cả hàng, không để chip cũ bị kéo giãn (chữ dính mép trên). */
html.gd-m3 body.ca-nhan .q-tags { align-items: center; }
html.gd-m3 body .gcn-ghi { display: flex; align-items: flex-start; gap: 8px; margin: 0 0 12px; padding: 10px 12px; border-radius: 16px; background: var(--gcn-vang-nen); color: var(--gcn-vang-chu); font-size: 14px; font-weight: 600; line-height: 1.35; }
html.gd-m3 body .gcn-ghi .gcn-i { margin-top: 1px; }
html.gd-m3 body .gcn-cho { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; padding: 12px 14px; border-radius: 16px; background: var(--gm-sc); color: var(--gm-on-surface); font-size: 15px; font-weight: 600; }
/* Thanh công cụ cũ (Hiện đề, Mở tất cả, Đổi màu…) không có nghĩa với bài từng chặng: ẩn, giữ thanh nộp. */
html.gd-m3 body.ca-nhan .thanh:not(#thanh-nop) { display: none; }
/* Câu ĐÃ CHẤM ở máy chủ: đáp án khoá, không bấm được nữa. */
html.gd-m3 body .q-card.da-cham .lam-o, html.gd-m3 body .q-card.da-cham .lam-nhap { pointer-events: none; }
}
`
