// TỜ MÁY CHIẾU CHO CHIẾN DỊCH — dùng LẠI đúng luồng tờ chiếu của màn Gọi lên bảng (`cauLuyenTuBoCau` → `taoHtmlMayChieu`
// → `KhungXemPhieu`), chỉ khác NGUỒN: danh sách câu + người lên bảng của buổi chữa / "câu cần thầy dạy lại".
// Nội dung đề tra từ Ngân hàng đề trên máy này theo mã câu máy chủ (`<tờ gốc>-<phần>-<số>`); câu không tra được vẫn chiếu
// bằng dòng thay thế (cùng cách màn Gọi lên bảng) và nơi gọi được báo số câu thiếu.
// HAI NÚT ĐẠT / CHƯA ĐẠT trên tờ: truyền `maPhien` ⇒ tờ dựng kèm `cauNoi` (đúng cầu nối `to-chieu-cau-noi.ts` của Gọi lên bảng);
// chỉ ô CÓ em (không phải "Cả lớp") và câu tra được chuyên đề mới có nút — thiếu chuyên đề thì máy chủ không ghi được.
// Trả kèm `o` (khoá `sbd|qid` ⇒ ô) để nơi nghe tin tra lại ô theo khoá, không tin nội dung tin đến.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../../data/examContent'
import type { CauLuyen } from '../../lib/bai-tap-pdf'
import type { OBang } from '../../lib/html-may-chieu'
import { qidMayChuCuaIdCau } from '../../lib/lich-su-cau-len-bang'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { noiDungTuCauGoc, type NoiDungCau } from '../../lib/thoi-gian-len-bang'
import { saoTuMucDo } from './tinh'

export type CauGoc = { phan: 'I' | 'II' | 'III'; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }

/** Bảng tra: mã câu máy chủ ⇒ câu gốc trong Ngân hàng đề của máy này. */
export function dungBangTra(ds: readonly TeacherExamSource[]): Map<string, CauGoc> {
  const m = new Map<string, CauGoc>()
  const them = (phan: CauGoc['phan'], q: CauGoc['q']) => {
    const k = qidMayChuCuaIdCau(q.id)
    if (k && !m.has(k)) m.set(k, { phan, q })
  }
  for (const s of ds) {
    for (const q of s.phanI ?? []) them('I', q)
    for (const q of s.phanII ?? []) them('II', q)
    for (const q of s.phanIII ?? []) them('III', q)
  }
  return m
}

/** Đếm từ/hình/bước của câu (cho ước lượng thời gian); không tra được ⇒ undefined (rơi về giờ theo sao). */
export function noiDungCua(tra: ReadonlyMap<string, CauGoc>, qid: string): NoiDungCau | undefined {
  const g = tra.get(qid)
  return g ? noiDungTuCauGoc(g.phan, g.q) : undefined
}

/** Nạp Ngân hàng đề của máy này (IndexedDB) và dựng bảng tra. Hỏng ⇒ bảng rỗng (tờ vẫn mở bằng dòng thay thế). */
export async function napBangTra(): Promise<Map<string, CauGoc>> {
  try {
    const [{ loadExamSources }, { khuTrungNguon }] = await Promise.all([import('../../lib/exam-db'), import('../../lib/khu-trung-cau')])
    return dungBangTra(khuTrungNguon(await loadExamSources()).nguon)
  } catch {
    return new Map()
  }
}

export interface OChieu {
  qid: string
  stt: number
  phan: 'I' | 'II' | 'III'
  mucDo: string | null
  sbd: string
  ten: string
  /** Chỉ màn thầy đọc — tờ chiếu không in lý do gọi em (thầy chốt 19/09). */
  viSao: string
}

/** Một ô em × câu có nút Đạt / Chưa đạt trên tờ — đủ để ghi kết quả (cùng lệnh `ghiLenBang` của Gọi lên bảng). */
export interface OGhiToChieu {
  sbd: string
  hoTen: string
  /** Mã câu máy chủ (`<tờ gốc>-<phần>-<số>`). */
  qid: string
  chuyenDe: string
}

/** Dựng HTML tờ máy chiếu. Trả số câu KHÁC NHAU không tra được nội dung để nơi gọi báo thầy trước.
 * `maPhien` ⇒ tờ có hai nút Đạt / Chưa đạt ở các ô trong `o`. */
export async function dungToChieu(
  ds: readonly OChieu[],
  tenBuoi: string,
  tra?: ReadonlyMap<string, CauGoc>,
  maPhien?: string,
): Promise<{ html: string; soThieu: number; o: Map<string, OGhiToChieu> }> {
  const bang = tra ?? (await napBangTra())
  const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu }, { uocLuongBacCau, uocLuongBacCauGoc }, { CAU_HINH_LEN_BANG_MAC_DINH }] = await Promise.all([
    import('../../lib/bai-tap-pdf'),
    import('../../lib/html-may-chieu'),
    import('../../lib/uoc-luong-bo-cuc'),
    import('../../lib/len-bang-cau-hinh'),
  ])
  const thieu = new Set<string>()
  const oGhi = new Map<string, OGhiToChieu>()
  const dsO: OBang[] = ds.map((o) => {
    const goc = bang.get(o.qid)
    let cl: CauLuyen | undefined
    if (goc) [cl] = cauLuyenTuBoCau([{ phan: goc.phan, q: goc.q }])
    else thieu.add(o.qid)
    const cau: CauLuyen = cl ?? {
      id: o.qid,
      phan: o.phan,
      maDe: '',
      chuyenDe: '',
      dang: 'chua_ro',
      sao: saoTuMucDo(o.mucDo),
      mucDo: '',
      text: `Nội dung câu hỏi ${o.stt}`,
      luaChon: null,
      dapAn: '',
      chot: '',
      lyDo: null,
      buoc: null,
      ketQua: '',
    }
    const coNut = !!maPhien && !!o.sbd && !!goc && !!cau.chuyenDe
    if (coNut) oGhi.set(khoaToChieu(o.sbd, o.qid), { sbd: o.sbd, hoTen: o.ten, qid: o.qid, chuyenDe: cau.chuyenDe })
    return {
      sbd: o.sbd,
      hoTen: o.ten,
      ...(coNut ? { qid: o.qid } : {}),
      bacUoc: (goc ? uocLuongBacCauGoc(goc.phan, goc.q) : uocLuongBacCau(cau)).bac,
      soCau: o.stt,
      sao: cau.sao,
      mucDo: o.mucDo ?? undefined,
      cau,
      viSao: o.viSao,
    }
  })
  const html = taoHtmlMayChieu(dsO, {
    tenBuoi,
    ngay: new Date(),
    nganSachPhut: CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT,
    ...(maPhien && oGhi.size > 0 ? { cauNoi: { maPhien } } : {}),
  })
  return { html, soThieu: thieu.size, o: oGhi }
}
