// BÀI TẬP VỀ NHÀ — PHÍA MÁY EM.
//
// Máy em KHÔNG có mã bí mật, và hai đường BTVN của em (`/btvn/cua-em`,
// `/btvn/nop`) cố ý là đường CÔNG KHAI — đúng mô hình `layPhieu` đang chạy: ai
// có mã ca và số báo danh thì mở được bài của chính mình.
//
// Phiếu dựng bằng chính bộ `html-phieu.ts` đang dùng cho phiếu khắc phục, để
// em nhìn thấy đúng một kiểu trang, và để không đẻ thêm một bộ dựng thứ hai.
import type { CauHinhMayChu } from './cau-hinh-may-chu'
import { layCauHinhMayChu, xongNapDiaChi } from './may-chu-moi'

/** Cấu hình máy chủ cho đường BTVN của em. Dùng chung đường máy em vẫn tự tìm
 * địa chỉ (xem `layCauHinhChoEm`), nên máy nào mở link cũng chạy. */
export async function layCauHinhChoEmBtvn(): Promise<CauHinhMayChu> {
  // Chờ lượt nạp địa chỉ lúc khởi động xong rồi hãy đọc — máy em mở link lần
  // đầu thì cấu hình đang được nạp ngay lúc ấy (xem `napDiaChiMayChuMoiChoEm`).
  await xongNapDiaChi()
  return layCauHinhMayChu()
}

/** Dựng trang bài tập về nhà. Gói đề trả về NGUYÊN VẸN từ kho, nên ở đây chỉ
 * bọc lại cho đẹp và gắn đồng hồ — KHÔNG lọc, KHÔNG xáo, KHÔNG cắt. */
export function dungPhieuBtvn(
  r: { hanNop?: string; soCau?: number; de?: unknown; daNop?: boolean },
  maCa: string,
  sbd: string,
): string {
  const de = (r.de ?? {}) as Record<string, unknown>
  const cau = docCauBtvn(de)
  const han = String(r.hanNop ?? '')
  const the = cau
    .map((c, i) => {
      const noi = String((c as { noiDung?: string; de?: string }).noiDung ?? (c as { de?: string }).de ?? '')
      const pa = Array.isArray((c as { phuongAn?: unknown[] }).phuongAn) ? ((c as { phuongAn: unknown[] }).phuongAn as unknown[]) : []
      const dsPa = pa
        .map((x, k) => `<div class="pa">${String.fromCharCode(65 + k)}. ${thoatHtml(String(x ?? ''))}</div>`)
        .join('')
      return `<div class="cau"><div class="stt">Câu ${i + 1}</div><div class="noi">${thoatHtml(noi)}</div>${dsPa}</div>`
    })
    .join('\n')

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bài tập về nhà</title>
<style>
  body{margin:0;padding:16px;background:#0f1115;color:#e9edf3;font:16px/1.6 -apple-system,system-ui,sans-serif}
  .dau{background:#171b22;border-radius:12px;padding:16px;margin-bottom:16px}
  .han{color:#f0b429;font-weight:700}
  .cau{background:#171b22;border-radius:12px;padding:14px;margin-bottom:12px}
  .stt{color:#8b95a5;font-size:14px;margin-bottom:6px}
  .noi{margin-bottom:8px}
  .pa{padding:4px 0;color:#c8d0dc}
</style></head><body>
<div class="dau">
  <div style="font-size:20px;font-weight:700">Bài tập về nhà</div>
  <div style="color:#8b95a5;font-size:14px">Ca ${thoatHtml(maCa)} · số báo danh ${thoatHtml(sbd)} · ${cau.length} câu</div>
  <div class="han">${han ? `Hạn nộp: ${thoatHtml(han)}` : ''}</div>
  ${r.daNop ? '<div style="color:#4ade80">Em đã nộp bài này rồi.</div>' : ''}
</div>
${the}
</body></html>`
}

function thoatHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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
