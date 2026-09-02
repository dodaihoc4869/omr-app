// ĐỒNG BỘ NGÂN HÀNG CÂU HỎI từ kho đề trên Apps Script về máy thầy
// (NAPDETUDONG.md, hướng A). Thầy chỉ thả file vào kho-de/moi/; pipeline
// "Nạp đề mới" đẩy JSON lên Apps Script; app trên máy thầy gọi hàm này lúc
// mở màn Ngân hàng (và khi bấm "Đồng bộ ngay"): tải về những đề CHƯA CÓ hoặc
// ĐÃ ĐỔI (so `ngayNap`), lưu vào IndexedDB qua saveExamSource — học sinh vẫn
// chỉ nhận bản không đáp án qua mã ca như trước, không có gì mới lộ ra.
//
// Thuần logic + IO qua các hàm đã có; không đụng DOM. Lỗi 1 đề không chặn
// các đề khác — trả về danh sách lỗi để màn hình báo.
import type { TeacherExamSource } from '../data/examContent'
import { validateTeacherSource } from '../data/examContent'
import { danhSachDe, layDe, type KhoDeItem } from './exam-api'
import { loadExamSources, saveExamSource } from './exam-db'
import { buildTeacherSourceFromKhoDe, parseKhoDeJsonText } from './exam-kho-de-import'

export interface KetQuaDongBo {
  moi: string[] // mã đề mới tải về
  capNhat: string[] // mã đề đã có nhưng pipeline nạp lại (ngayNap khác)
  giuNguyen: number
  loi: string[]
  canXem: string[] // "mã đề — Phần I câu 16" cho câu nghi đáp án sai / thiếu đáp án
  danhSach: KhoDeItem[]
}

/** Quyết định đề nào cần tải: chưa có local, hoặc ngayNap trên kho khác local. */
export function chonDeCanTai(tren: KhoDeItem[], local: TeacherExamSource[]): { moi: KhoDeItem[]; capNhat: KhoDeItem[] } {
  const localMap = new Map(local.map((s) => [s.maDe, s]))
  const moi: KhoDeItem[] = []
  const capNhat: KhoDeItem[] = []
  for (const item of tren) {
    const cu = localMap.get(item.maDe)
    if (!cu) moi.push(item)
    else if ((cu.ngayNap ?? '') !== (item.ngayNap ?? '')) capNhat.push(item)
  }
  return { moi, capNhat }
}

export async function dongBoNganHang(scriptUrl: string, secret: string): Promise<KetQuaDongBo> {
  const danhSach = await danhSachDe(scriptUrl, secret)
  const local = await loadExamSources()
  const { moi, capNhat } = chonDeCanTai(danhSach, local)
  const kq: KetQuaDongBo = { moi: [], capNhat: [], giuNguyen: danhSach.length - moi.length - capNhat.length, loi: [], canXem: [], danhSach }

  for (const item of [...moi, ...capNhat]) {
    try {
      const raw = await layDe(scriptUrl, secret, item.maDe)
      const parsed = parseKhoDeJsonText(JSON.stringify(raw))
      if (!parsed.ok || !parsed.json) throw new Error(parsed.errors[0] || 'JSON đề không hợp lệ')
      const { source, errors, canXemList } = buildTeacherSourceFromKhoDe(parsed.json)
      if (errors.length > 0) throw new Error(errors[0])
      const v = validateTeacherSource(source)
      if (v.length > 0) throw new Error(v[0])
      await saveExamSource(source)
      if (moi.includes(item)) kq.moi.push(item.maDe)
      else kq.capNhat.push(item.maDe)
      for (const c of canXemList) kq.canXem.push(`${item.maDe} — ${c}`)
    } catch (e) {
      kq.loi.push(`Đề ${item.maDe}: ${e instanceof Error ? e.message : 'lỗi không rõ'}`)
    }
  }
  return kq
}
