// BÀI TẬP VỀ NHÀ — PHÍA MÁY EM.
//
// Máy em KHÔNG có mã bí mật, và hai đường BTVN của em (`/btvn/cua-em`,
// `/btvn/nop`) cố ý là đường CÔNG KHAI — đúng mô hình `layPhieu` đang chạy: ai
// có mã ca và số báo danh thì mở được bài của chính mình.
//
// Phiếu dựng bằng chính bộ `html-phieu.ts` đang dùng cho phiếu khắc phục, để
// em nhìn thấy đúng một kiểu trang, và để không đẻ thêm một bộ dựng thứ hai.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import type { CauLuyen } from './bai-tap-pdf'
import { layCauHinhMayChu, xongNapDiaChi } from './may-chu-moi'

/** Cấu hình máy chủ cho đường BTVN của em. Dùng chung đường máy em vẫn tự tìm
 * địa chỉ (xem `layCauHinhChoEm`), nên máy nào mở link cũng chạy. */
export async function layCauHinhChoEmBtvn(): Promise<CauHinhMayChu> {
  // Chờ lượt nạp địa chỉ lúc khởi động xong rồi hãy đọc — máy em mở link lần
  // đầu thì cấu hình đang được nạp ngay lúc ấy (xem `napDiaChiMayChuMoiChoEm`).
  await xongNapDiaChi()
  return layCauHinhMayChu()
}

/** Dựng trang bài tập về nhà.
 *
 * DÙNG LẠI KHUNG PHIẾU ĐANG CHẠY (`html-phieu.ts`), không dựng khung thứ hai:
 *   · em nhìn thấy đúng một kiểu trang, dù là phiếu khắc phục hay bài về nhà;
 *   · màu sắc lấy từ bộ mã màu chung — `npm run check:mau` cấm mã màu gõ tay
 *     ở mọi tệp ngoài `styles/tokens.css` và `lib/html-phieu.ts`, và đó là luật
 *     đúng: hai bảng màu song song là hai lần phải sửa mỗi lần đổi giao diện.
 *
 * Gói đề trả về NGUYÊN VẸN từ kho, nên ở đây chỉ bọc lại và gắn hạn nộp —
 * KHÔNG lọc, KHÔNG xáo, KHÔNG cắt. `boLoiGiai` xoá đáp án và lời giải khỏi DỮ
 * LIỆU trước khi dựng: em bấm "xem mã nguồn" cũng không thấy đáp án. */
export async function dungPhieuBtvn(
  r: { hanNop?: string; soCau?: number; de?: unknown; daNop?: boolean },
  maCa: string,
  sbd: string,
): Promise<string> {
  const { taiLieuHtml, theCauHtml, boLoiGiai, thoat } = await import('./html-phieu')
  const de = (r.de ?? {}) as Record<string, unknown>
  const cau = docCauBtvn(de).map(veCauLuyen)
  const han = String(r.hanNop ?? '')
  const the = cau.map((c, i) => theCauHtml(boLoiGiai(c), i + 1, false, true, false)).join('\n')

  const than = `<div class="khung">
  <div class="nhac-phieu">Bài tập về nhà · ca ${thoat(maCa)} · số báo danh ${thoat(sbd)} · ${cau.length} câu${
    han ? ` · hạn nộp ${thoat(han)}` : ''
  }${r.daNop ? ' · em đã nộp bài này rồi' : ''}</div>
  <div class="ds-cau">${the}</div>
  <div class="chan">Thầy Đỗ Đại Học · bài tập về nhà</div>
</div>`
  return taiLieuHtml(than, 'Bài tập về nhà')
}

/** Chuẩn hoá một câu của kho về khuôn `CauLuyen` mà khung phiếu đang đọc.
 *
 * Kho đề đi qua nhiều đời nên câu có hai khuôn: khuôn phiếu (`text`/`luaChon`)
 * và khuôn đề thi (`noiDung`/`phuongAn`). Nhận cả hai, và KHÔNG đoán khi lạ:
 * thiếu trường nào thì để rỗng, chỗ hiển thị tự bỏ qua. */
function veCauLuyen(c: Record<string, unknown>): CauLuyen {
  const phanTho = String(c.phan ?? 'I')
  const phan: 'I' | 'II' | 'III' = phanTho === 'II' ? 'II' : phanTho === 'III' ? 'III' : 'I'
  const pa = Array.isArray(c.luaChon) ? (c.luaChon as unknown[]) : Array.isArray(c.phuongAn) ? (c.phuongAn as unknown[]) : null
  return {
    phan,
    id: String(c.id ?? c.qid ?? ''),
    maDe: String(c.maDe ?? c.ma_de ?? ''),
    chuyenDe: String(c.chuyenDe ?? c.chuyen_de ?? ''),
    dang: (c.dang as CauLuyen['dang']) ?? 'chua_ro',
    sao: (Number(c.sao) === 2 ? 2 : Number(c.sao) === 1 ? 1 : 0) as 0 | 1 | 2,
    mucDo: (String(c.mucDo ?? c.muc_do ?? '') as CauLuyen['mucDo']) ?? '',
    text: String(c.text ?? c.noiDung ?? c.de ?? ''),
    luaChon: pa ? pa.map((x) => String(x ?? '')) : null,
    dapAn: String(c.dapAn ?? c.dap_an ?? ''),
    chot: String(c.chot ?? ''),
    lyDo: (c.lyDo as CauLuyen['lyDo']) ?? null,
    buoc: Array.isArray(c.buoc) ? (c.buoc as unknown[]).map((x) => String(x)) : null,
    ketQua: String(c.ketQua ?? ''),
    anhThanCau: typeof c.anhThanCau === 'string' ? c.anhThanCau : undefined,
    anhLuaChon: Array.isArray(c.anhLuaChon) ? (c.anhLuaChon as (string | undefined)[]) : undefined,
    hinh: Array.isArray(c.hinh) ? (c.hinh as CauLuyen['hinh']) : undefined,
    bang: Array.isArray(c.bang) ? (c.bang as string[][]) : null,
  }
}

/** Rút câu từ gói đề. Nhận mọi dạng gói qua các đời, và KHÔNG đoán khi lạ. */
export function docCauBtvn(de: unknown): Record<string, unknown>[] {
  const g = (de ?? {}) as Record<string, unknown>
  if (Array.isArray(g.cau)) return g.cau as Record<string, unknown>[]
  if (Array.isArray(g.items)) return g.items as Record<string, unknown>[]
  const gom: Record<string, unknown>[] = []
  for (const p of ['phanI', 'phanII', 'phanIII'] as const) {
    const v = g[p]
    if (Array.isArray(v)) for (const c of v) gom.push(c as Record<string, unknown>)
  }
  return gom
}
