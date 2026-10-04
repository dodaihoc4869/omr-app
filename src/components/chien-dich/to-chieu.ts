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
import { maDeGocMayChu } from '../../lib/btvn-nang-do-thay'
import { timCauTheoId } from '../../lib/tra-cau-chieu'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { noiDungTuCauGoc, type NoiDungCau } from '../../lib/thoi-gian-len-bang'
import { saoTuMucDo } from './tinh'

export type CauGoc = { phan: 'I' | 'II' | 'III'; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }

/** Bảng tra: mã câu máy chủ ⇒ câu gốc trong Ngân hàng đề của máy này. */
export function dungBangTra(ds: readonly TeacherExamSource[]): Map<string, CauGoc> {
  const m = new Map<string, CauGoc>()
  const them = (k: string | null | undefined, phan: CauGoc['phan'], q: CauGoc['q']) => {
    if (!k) return
    const s = String(k).trim()
    if (!s) return
    if (!m.has(s)) m.set(s, { phan, q })
    const lower = s.toLowerCase()
    if (!m.has(lower)) m.set(lower, { phan, q })
  }

  for (const s of ds) {
    const phans: [CauGoc['phan'], (TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion)[] | undefined][] = [
      ['I', s.phanI],
      ['II', s.phanII],
      ['III', s.phanIII],
    ]
    for (const [phan, dsCau] of phans) {
      if (!dsCau) continue
      dsCau.forEach((q, idx) => {
        const stt = idx + 1
        // 1. Theo q.id
        them(q.id, phan, q)
        if ((q as any).qid) them((q as any).qid, phan, q)
        // 2. Theo mã máy chủ
        them(qidMayChuCuaIdCau(q.id), phan, q)
        if ((q as any).qid) them(qidMayChuCuaIdCau((q as any).qid), phan, q)
        // 3. Theo mã đề
        if (s.maDe) {
          them(`${s.maDe}-${phan}-${stt}`, phan, q)
          them(`${s.maDe}-${stt}`, phan, q)
          const goc = maDeGocMayChu(s.maDe)
          if (goc && goc !== s.maDe) {
            them(`${goc}-${phan}-${stt}`, phan, q)
            them(`${goc}-${stt}`, phan, q)
          }
        }
        // 4. Theo các biến thể đuôi số
        const mPhanSo = /^(?:.*)-(III|II|I)-(\d+)$/.exec(q.id)
        if (mPhanSo) {
          const so = Number(mPhanSo[2])
          them(`${mPhanSo[1]}-${so}`, phan, q)
          them(`cau-${so}`, phan, q)
          them(`cau_${so}`, phan, q)
          them(`q${so}`, phan, q)
          them(`${so}`, phan, q)
        } else {
          const mSo = /-(\d+)$/.exec(q.id)
          if (mSo) {
            const so = Number(mSo[1])
            them(`cau-${so}`, phan, q)
            them(`cau_${so}`, phan, q)
            them(`q${so}`, phan, q)
            them(`${so}`, phan, q)
          }
        }
        them(`${phan}-${stt}`, phan, q)
        them(`cau-${stt}`, phan, q)
        them(`q${stt}`, phan, q)
        them(`${stt}`, phan, q)
      })
    }
  }
  return m
}

/** Đếm từ/hình/bước của câu (cho ước lượng thời gian); không tra được ⇒ undefined (rơi về giờ theo sao). */
export function noiDungCua(tra: ReadonlyMap<string, CauGoc>, qid: string): NoiDungCau | undefined {
  const g = tra.get(qid) ?? timCauTheoId(tra, qid)
  return g ? noiDungTuCauGoc(g.phan, g.q) : undefined
}

/** Nạp Ngân hàng đề của máy này (IndexedDB) và dựng bảng tra. Hỏng ⇒ bảng rỗng (tờ vẫn mở bằng dòng thay thế). */
export async function napBangTra(): Promise<Map<string, CauGoc>> {
  try {
    const [{ loadExamSources, loadAllSessionTeacherBanks }, { khuTrungNguon }] = await Promise.all([
      import('../../lib/exam-db'),
      import('../../lib/khu-trung-cau'),
    ])
    const [sources, sessionBanks] = await Promise.all([
      loadExamSources().catch(() => []),
      loadAllSessionTeacherBanks().catch(() => []),
    ])
    const all = [...sources]
    for (const sb of sessionBanks) {
      for (const src of sb.sources ?? []) {
        if (!all.some((x) => x.maDe === src.maDe)) {
          all.push(src)
        }
      }
    }
    return dungBangTra(khuTrungNguon(all).nguon)
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
  cauGoc?: any
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
    let goc: CauGoc | undefined
    if (o.cauGoc) {
      const cg = o.cauGoc
      goc = { phan: cg.phan || o.phan || 'I', q: cg }
    }
    if (!goc) goc = bang.get(o.qid)
    if (!goc) goc = timCauTheoId(bang, o.qid)
    if (!goc) {
      const qMc = qidMayChuCuaIdCau(o.qid)
      if (qMc) goc = bang.get(qMc) || timCauTheoId(bang, qMc)
    }
    if (!goc && o.qid) goc = bang.get(o.qid.toLowerCase())
    if (!goc && o.stt) {
      goc = bang.get(`${o.phan}-${o.stt}`) || bang.get(`q${o.stt}`) || bang.get(`cau-${o.stt}`) || bang.get(String(o.stt))
    }
    if (!goc) {
      for (const [k, v] of bang.entries()) {
        if (k.endsWith(`-${o.stt}`) || k.endsWith(`-${o.phan}-${o.stt}`) || (v.q && (v.q.id === o.qid || (v.q as any).qid === o.qid))) {
          goc = v
          break
        }
      }
    }

    let cl: CauLuyen | undefined
    if (goc) {
      const [parsed] = cauLuyenTuBoCau([{ phan: goc.phan, q: goc.q }])
      if (parsed) {
        cl = {
          ...parsed,
          chuyenDe: parsed.chuyenDe || (goc.q as any).chuyenDe || '',
          explanation: parsed.explanation || (goc.q as any).explanation || (goc.q as any).huongDanGiai || (goc.q as any).loiGiaiChiTiet || (goc.q as any).solution,
          loiGiai: parsed.loiGiai || (goc.q as any).loiGiai || (goc.q as any).solution,
          chot: parsed.chot || (goc.q as any).loiGiai?.chot || (goc.q as any).solution?.chot || (goc.q as any).kienThucCotLoi || '',
        }
      }
    } else {
      thieu.add(o.qid)
    }

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
