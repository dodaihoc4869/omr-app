// DỰNG TỜ «CHIẾU CHỮA BÀI SAU CA» (thầy chốt 01/11, docs/ban-ve-chieu-chua-ca-0111). Tờ là tờ chiếu CHUẨN (`taoHtmlMayChieu`, chế độ `chuaBai`), dựng THẲNG
// từ đề có đáp án của ca trên máy thầy — không qua luồng chiến dịch (`to-chieu.ts`: gọi em, ghi Đạt/Chưa đạt, chặn khối…), không gọi mạng.
//   · Nội dung câu: tra theo NGUYÊN mã (`id`/`qid`) trong đề có đáp án — đúng bộ mã bảng chấm `taoChiTietCau` đã dùng. Không có ⇒ dòng «Nội dung câu hỏi N»
//     (vẫn có tên em), đếm `soThieu` để màn báo thầy.
//   · Chuyển câu → khuôn tờ chiếu bằng `cauLuyenTuBoCau` + cùng các chỗ dự phòng lời giải như tờ chiến dịch (explanation / loiGiai / chốt).
//   · Dải thống kê lớp (phím T) tính từ chính bài làm của ca (`thongKeLopCau`).
//   · Thầy tự ra đề ca ⇒ câu tự luận (nếu có) vẫn hiện, như mọi chỗ thầy tự chọn.
// Hai mảnh nặng (bai-tap-pdf, html-may-chieu — kèm `thongKeLopCau`) nạp ĐỘNG khi thầy bấm nút: màn Kết thúc ca không nặng thêm, không tách thêm mảnh.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../../data/examContent'
import type { CauLuyen } from '../../lib/bai-tap-pdf'
import type { OBang } from '../../lib/html-may-chieu'
import { theChuaDung, type CauChuaCa } from '../../lib/chieu-chua-ca'

type CauGoc = { phan: 'I' | 'II' | 'III'; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }

/** Bảng tra mã câu ⇒ câu gốc (khoá `id` và `qid`, nguyên văn). */
export function bangTraCa(nguon: readonly TeacherExamSource[]): Map<string, CauGoc> {
  const m = new Map<string, CauGoc>()
  for (const s of nguon) {
    for (const [phan, ds] of [['I', s.phanI], ['II', s.phanII], ['III', s.phanIII]] as const) {
      for (const q of ds ?? []) {
        for (const k of [q.id, (q as { qid?: string }).qid]) {
          const id = String(k ?? '').trim()
          if (id && !m.has(id)) m.set(id, { phan, q })
        }
      }
    }
  }
  return m
}

const giuChu = (v: unknown): string => (typeof v === 'string' ? v : '')

export async function dungToChuaCa(ds: readonly CauChuaCa[], nguon: readonly TeacherExamSource[], tenBuoi: string): Promise<{ html: string; soThieu: number }> {
  const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu, thongKeLopCau }] = await Promise.all([import('../../lib/bai-tap-pdf'), import('../../lib/html-may-chieu')])
  const tra = bangTraCa(nguon)
  let soThieu = 0
  const dsO: OBang[] = ds.map((c) => {
    const goc = tra.get(c.qid)
    let cau: CauLuyen | undefined
    if (goc) {
      const [p] = cauLuyenTuBoCau([{ phan: goc.phan, q: goc.q }])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- câu kho cũ mang lời giải ở nhiều tên trường (như tờ chiến dịch `to-chieu.ts`)
      const q = goc.q as unknown as Record<string, any>
      if (p) cau = { ...p, chuyenDe: p.chuyenDe || giuChu(q.chuyenDe), explanation: p.explanation || q.explanation || q.huongDanGiai || q.loiGiaiChiTiet || q.solution, loiGiai: p.loiGiai || q.loiGiai || q.solution, chot: p.chot || q.loiGiai?.chot || q.solution?.chot || giuChu(q.kienThucCotLoi) }
    }
    if (!cau) {
      soThieu++
      cau = { id: c.qid, phan: c.phan, maDe: '', chuyenDe: '', dang: 'chua_ro', sao: 0, mucDo: '', text: `Nội dung câu hỏi ${c.soCau}`, luaChon: null, dapAn: '', chot: '', lyDo: null, buoc: null, ketQua: '' }
    }
    const tk = thongKeLopCau(c.phan, c.bai)
    return { sbd: '', hoTen: 'Cả lớp', soCau: c.soCau, ...(c.mucDo ? { mucDo: c.mucDo } : {}), cau, ...(tk ? { thongKe: tk } : {}), chuaDung: theChuaDung(c) }
  })
  return { html: taoHtmlMayChieu(dsO, { tenBuoi, ngay: new Date(), chuaBai: true }), soThieu }
}
