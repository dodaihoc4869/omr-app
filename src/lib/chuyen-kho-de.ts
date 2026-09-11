// CHUYỂN KHO ĐỀ SANG MÁY CHỦ MỚI — NGUYÊN VẸN.
//
// Thầy chốt 11/09 tối: *"đẩy kho đề sang nguyên vẹn cho tôi là được, còn lại
// dựng lại hết sang máy chủ mới."* Mọi bảng khác bắt đầu từ rỗng; kho đề là thứ
// DUY NHẤT phải mang theo từng chữ.
//
// BÀI HỌC 15h46 NGÀY 11/09, và cả tệp này viết quanh nó: lượt chuyển ca trước
// đọc chi tiết 83 ca bằng một vòng lặp trong tab, **chết ở ca thứ 6** khi thầy
// rời tab. Nên ở đây:
//
//   1. **CHẠY LẠI ĐƯỢC.** Trước mỗi vòng, hỏi máy chủ mới đã có đề nào rồi và
//      BỎ QUA chúng. Chết giữa chừng thì bấm lại, nó đi tiếp từ chỗ đứt.
//   2. **KHOÁ MỘT LƯỢT.** Hai lần bấm không chạy chồng nhau.
//   3. **BÁO TIẾN ĐỘ TỪNG ĐỀ**, để thầy nhìn thấy nó còn sống.
//   4. **KHÔNG DỪNG CẢ LƯỢT VÌ MỘT ĐỀ HỎNG.** Kê riêng đề hỏng ở cuối.
import { danhSachDe, layDe } from './exam-api'
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export interface KetQuaChuyenKho {
  tong: number
  daCo: number
  daDay: number
  hong: { maDe: string; viSao: string }[]
}

let dangChay = false

/** Đề đã nằm trên máy chủ mới. Trả `null` nghĩa là không hỏi được — và khi ấy
 * ta KHÔNG đẩy gì cả, vì không biết đề nào đã có thì đẩy lại toàn bộ là tốn
 * hàng chục phút vô ích. */
async function deDaCo(url: string, mat: string): Promise<Set<string> | null> {
  try {
    const res = await fetch(`${url}/kho/danh-sach`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat },
      body: JSON.stringify({ keCaDaXoa: true }),
    })
    if (!res.ok) return null
    const j = (await res.json()) as { ok?: boolean; items?: { maDe: string; soCau: number }[] }
    if (j?.ok !== true || !Array.isArray(j.items)) return null
    // CHỈ coi là "đã có" khi đề ấy CÓ CÂU. Dòng chỉ mục rỗng nghĩa là lần trước
    // đẩy dở — phải đẩy lại, không được bỏ qua.
    return new Set(j.items.filter((x) => Number(x.soCau) > 0).map((x) => String(x.maDe)))
  } catch {
    return null
  }
}

/** Rút danh sách câu từ gói đề. Gói của thầy có nhiều dạng qua các đời; nhận
 * hết, và KHÔNG đoán khi không thấy dạng nào quen. */
export function docCauTuGoi(de: unknown): Record<string, unknown>[] {
  const g = (de ?? {}) as Record<string, unknown>
  if (Array.isArray(g.cau)) return g.cau as Record<string, unknown>[]
  if (Array.isArray(g.items)) return g.items as Record<string, unknown>[]
  // Dạng ba phần I/II/III.
  const gom: Record<string, unknown>[] = []
  for (const p of ['phanI', 'phanII', 'phanIII'] as const) {
    const v = g[p]
    if (Array.isArray(v)) for (const c of v) gom.push({ ...(c as Record<string, unknown>), phan: p.replace('phan', '') })
  }
  return gom
}

/** CHUYỂN CẢ KHO. Gọi lại được bao nhiêu lần cũng an toàn. */
export async function chuyenKhoDe(
  scriptUrl: string,
  secret: string,
  bao: (chu: string) => void = () => {},
): Promise<KetQuaChuyenKho> {
  if (dangChay) throw new Error('Đang chuyển rồi, chờ lượt này xong đã')
  dangChay = true
  const kq: KetQuaChuyenKho = { tong: 0, daCo: 0, daDay: 0, hong: [] }
  try {
    const ch = await layCauHinhMayChu()
    if (!ch.URL) throw new Error('Chưa có địa chỉ máy chủ mới')
    const mat = secret || (await loadTeacherSecret()) || ''
    if (!mat) throw new Error('Thiếu mã bí mật')

    bao('Đang đọc danh sách đề…')
    const ds = await danhSachDe(scriptUrl, mat)
    kq.tong = ds.length

    const daCo = await deDaCo(ch.URL, mat)
    if (daCo === null) throw new Error('Máy chủ mới không trả lời — chưa đẩy gì cả')

    for (let i = 0; i < ds.length; i++) {
      const maDe = String((ds[i] as { maDe?: string }).maDe ?? '').trim()
      if (!maDe) continue
      if (daCo.has(maDe)) {
        kq.daCo += 1
        continue
      }
      bao(`${i + 1}/${ds.length} · ${maDe}`)
      try {
        const de = await layDe(scriptUrl, mat, maDe)
        const cau = docCauTuGoi(de)
        const res = await fetch(`${ch.URL}/kho/day`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat },
          body: JSON.stringify({
            maDe,
            de,
            cau,
            tenDe: String((ds[i] as { nguon?: string }).nguon ?? ''),
            lop: String((ds[i] as { lop?: string }).lop ?? ''),
            chuyenDe: String((ds[i] as { nhom?: string }).nhom ?? ''),
          }),
        })
        if (!res.ok) throw new Error(`máy chủ trả ${res.status}`)
        const j = (await res.json()) as { ok?: boolean; error?: string }
        if (j?.ok !== true) throw new Error(j?.error || 'máy chủ từ chối')
        kq.daDay += 1
      } catch (e) {
        // MỘT ĐỀ HỎNG KHÔNG ĐƯỢC DỪNG CẢ KHO. Kê riêng, đi tiếp.
        kq.hong.push({ maDe, viSao: e instanceof Error ? e.message : 'lỗi không rõ' })
      }
    }
    return kq
  } finally {
    dangChay = false
  }
}
