// BUỔI CHỮA XẾP SẴN — phần NỐI MÁY (Code 1, 21/09/2026): gọi lệnh chỉ-đọc của máy chủ và dựng kho câu trên máy thầy để đưa cho lõi thuần `buoi-chua-de-xuat.ts`.
// Không ném lỗi: máy chủ chưa có lệnh / mất mạng / trả sai dạng ⇒ `{ ok: false }` và màn ẨN thẻ (không báo lỗi đỏ — Boss 21/09).
import type { TeacherExamSource } from '../data/examContent'
import { mayChuBoMucDayHoc, qidCuaCau } from './btvn-nang-do-thay'
import { docDauVao, type CauKho, type DauVaoDeXuat, type PhanCau } from './buoi-chua-de-xuat'
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'

/** Gọi `/gv/buoi-chua-de-xuat` (chỉ đọc). `lop` rỗng/thiếu ⇒ mọi lớp. */
export async function layDeXuatBuoiChua(tuyChon: { ngay?: string; lop?: string } = {}): Promise<KetQuaLenh<DauVaoDeXuat>> {
  const body: Record<string, unknown> = {}
  if (tuyChon.ngay) body.ngay = tuyChon.ngay
  if (tuyChon.lop) body.lop = tuyChon.lop
  const r = await goiLenh('/gv/buoi-chua-de-xuat', body, 'Máy chủ chưa có lệnh Buổi chữa xếp sẵn.')
  if (!r.ok) return r
  const dv = docDauVao(r.du)
  return dv ? { ok: true, du: dv } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả buổi chữa xếp sẵn không đúng dạng.' }
}

type CauTrongDe = { id: string; dang?: { ma: string } | null; canChua?: { sao?: 0 | 1 | 2 } }

/**
 * KHO CÂU trên máy thầy → `CauKho[]` với mã câu theo ĐÚNG quy ước máy chủ (`qidCuaCau`: `<mã tờ gốc>-<phần>-<số>`). Câu không dựng được mã (id riêng của tờ ghép) bị bỏ — KHÔNG đoán;
 * mục dạy học (`-VD`/`-DT`) bị bỏ như lúc giao bài. Mã trùng: lấy câu đầu. Thứ tự kho giữ nguyên.
 */
export function khoTuNguon(nguon: readonly TeacherExamSource[]): CauKho[] {
  const ra: CauKho[] = []
  const daCo = new Set<string>()
  for (const s of nguon) {
    if (mayChuBoMucDayHoc(s.maDe)) continue
    for (const [phan, ds] of [['I', s.phanI], ['II', s.phanII], ['III', s.phanIII]] as [PhanCau, CauTrongDe[]][]) {
      for (const q of ds ?? []) {
        const qid = qidCuaCau(s.maDe, phan, q)
        if (!qid || daCo.has(qid)) continue
        daCo.add(qid)
        ra.push({ qid, phan, dang: q.dang?.ma ?? null, sao: q.canChua?.sao ?? 0, q })
      }
    }
  }
  return ra
}
