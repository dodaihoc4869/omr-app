// TỜ MÁY CHIẾU CHO CHIẾN DỊCH — dùng LẠI đúng luồng tờ chiếu của màn Gọi lên bảng (`cauLuyenTuBoCau` → `taoHtmlMayChieu`
// → `KhungXemPhieu`), chỉ khác NGUỒN: danh sách câu + người lên bảng của buổi chữa / "câu cần thầy dạy lại".
// NỘI DUNG ĐỀ — CHỈ ĐÚNG MÃ CÂU (thầy 06/10: tờ chữa lớp 11 lẫn câu lớp 10): (1) nội dung máy chủ gửi kèm dòng (`cauGoc`, lệnh `noi-dung-cau`, đã qua cổng
// khối); (2) Ngân hàng đề trên máy này KHỚP NGUYÊN mã câu máy chủ (`<tờ gốc>-<phần>-<số>`, bỏ hậu tố -TN/-DS/-TLN). KHÔNG khớp đuôi, KHÔNG đoán theo số thứ tự
// (`3`, `III-3`, `q3`…): bản cũ làm vậy nên câu không có trên máy bị thay bằng MỘT CÂU KHÁC của tờ đầu tiên trong ngân hàng. Câu không có nội dung đúng mã vẫn
// chiếu bằng dòng thay thế (cùng cách màn Gọi lên bảng) và nơi gọi được báo số câu thiếu; câu máy chủ báo khác khối lớp thì BỎ khỏi tờ.
// HAI NÚT ĐẠT / CHƯA ĐẠT trên tờ: truyền `maPhien` ⇒ tờ dựng kèm `cauNoi` (đúng cầu nối `to-chieu-cau-noi.ts` của Gọi lên bảng);
// chỉ ô CÓ em (không phải "Cả lớp") và câu tra được chuyên đề mới có nút — thiếu chuyên đề thì máy chủ không ghi được.
// Trả kèm `o` (khoá `sbd|qid` ⇒ ô) để nơi nghe tin tra lại ô theo khoá, không tin nội dung tin đến.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../../data/examContent'
import type { CauLuyen } from '../../lib/bai-tap-pdf'
import type { OBang } from '../../lib/html-may-chieu'
import { qidMayChuCuaIdCau } from '../../lib/lich-su-cau-len-bang'
import { phanTichKhoiCau } from '../../lib/khoi-cau'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { noiDungTuCauGoc, type NoiDungCau } from '../../lib/thoi-gian-len-bang'
import { saoTuMucDo } from './tinh'
import type { NoiDungCauMayChu } from './api'

export type CauGoc = { phan: 'I' | 'II' | 'III'; q: TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion }

/** Bảng tra: mã câu máy chủ ⇒ câu gốc trong Ngân hàng đề của máy này. CHỈ khoá định danh của câu (`id`/`qid` và dạng mã máy chủ của nó) — không khoá theo số thứ tự. */
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
      for (const q of dsCau) {
        for (const k of [q.id, (q as { qid?: string }).qid]) {
          them(k, phan, q)
          them(qidMayChuCuaIdCau(String(k ?? '')), phan, q)
        }
      }
    }
  }
  return m
}

/** Tra CHÍNH XÁC theo mã câu máy chủ: nguyên mã, dạng mã máy chủ (bỏ -TN/-DS/-TLN), hoặc chữ thường. KHÔNG khớp đuôi, KHÔNG đoán theo số thứ tự. */
export function traChinhXac<T>(tra: ReadonlyMap<string, T>, qid: string): T | undefined {
  const id = String(qid ?? '').trim()
  if (!id) return undefined
  for (const k of [id, qidMayChuCuaIdCau(id), id.toLowerCase()]) {
    if (!k) continue
    const v = tra.get(k)
    if (v !== undefined) return v
  }
  return undefined
}

/** Đếm từ/hình/bước của câu (cho ước lượng thời gian); không tra được ⇒ undefined (rơi về giờ theo sao). */
export function noiDungCua(tra: ReadonlyMap<string, CauGoc>, qid: string): NoiDungCau | undefined {
  const g = traChinhXac(tra, qid)
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
  /** Nội dung ĐÚNG mã câu do máy chủ gửi (lệnh `noi-dung-cau`, đã qua cổng khối) — khuôn Ngân hàng đề của thầy. Vắng ⇒ tra Ngân hàng đề trên máy theo NGUYÊN mã. */
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

/**
 * Câu có KHÁC khối lớp không — chỉ đọc MÃ CÂU (cùng luật B với cổng máy chủ `lyDoChanTap`: khác khối hoặc mã tự mâu thuẫn khối ⇒ chặn; mã không đọc ra khối ⇒ giữ).
 * Khối lớp rỗng (lớp chưa rõ khối) ⇒ không chặn. Lớp phòng thủ thứ hai: cổng chính ở máy chủ (`noi-dung-cau`, `buoi-chua`, `bang`).
 */
export function cauKhacKhoiLop(qid: string, khoiDich: readonly number[]): boolean {
  if (!khoiDich.length) return false
  const p = phanTichKhoiCau(qid)
  if (p.tinhTrang === 'khong_ro') return false
  if (p.tinhTrang === 'mau_thuan') return true
  return p.khoi === null || !khoiDich.includes(p.khoi)
}

/**
 * CHUẨN BỊ NỘI DUNG cho tờ: dòng nào Ngân hàng đề trên máy KHÔNG có đúng mã (và chưa mang nội dung) thì hỏi máy chủ (`hoiMayChu`, lệnh `noi-dung-cau`) — máy chủ trả nội dung
 * đúng mã đã qua cổng khối, và danh sách câu khác khối lớp (`boKhoi`) để BỎ khỏi tờ. Máy chủ lỗi / chưa có lệnh (`null`) ⇒ giữ nguyên các dòng (tờ vẫn mở bằng dòng thay thế,
 * không đoán). Dòng đã tra được ở máy KHÔNG hỏi thêm (mã ấy đã qua cổng khối ở danh sách máy chủ đưa ra).
 */
export async function napNoiDungChoToChieu(
  ds: readonly OChieu[],
  tra: ReadonlyMap<string, CauGoc>,
  hoiMayChu: (qids: string[]) => Promise<NoiDungCauMayChu | null>,
): Promise<{ ds: OChieu[]; soBoKhoi: number; khoiDich: number[] }> {
  const canHoi = [...new Set(ds.filter((o) => !o.cauGoc && !traChinhXac(tra, o.qid)).map((o) => o.qid))]
  const nguyen = { ds: [...ds], soBoKhoi: 0, khoiDich: [] as number[] }
  if (!canHoi.length) return nguyen
  const r = await hoiMayChu(canHoi).catch(() => null)
  if (!r) return nguyen
  const bo = new Set(r.boKhoi)
  return {
    ds: ds.filter((o) => !bo.has(o.qid)).map((o) => (r.cau[o.qid] ? { ...o, cauGoc: r.cau[o.qid] } : o)),
    soBoKhoi: canHoi.filter((q) => bo.has(q)).length,
    khoiDich: r.khoiDich,
  }
}

/** Tuỳ chọn dựng tờ. `khoiDich` = khối của lớp / chiến dịch: dòng có mã khác khối bị bỏ (phòng thủ thêm); rỗng / vắng ⇒ không chặn. */
export interface TuyChonToChieu {
  khoiDich?: readonly number[]
}

/** Dựng HTML tờ máy chiếu. Trả số câu KHÁC NHAU không có nội dung đúng mã (`soThieu`) và số câu bị bỏ vì khác khối lớp (`soBoKhoi`) để nơi gọi báo thầy trước.
 * `maPhien` ⇒ tờ có hai nút Đạt / Chưa đạt ở các ô trong `o`. */
export async function dungToChieu(
  ds: readonly OChieu[],
  tenBuoi: string,
  tra?: ReadonlyMap<string, CauGoc>,
  maPhien?: string,
  tuyChon: TuyChonToChieu = {},
): Promise<{ html: string; soThieu: number; soBoKhoi: number; o: Map<string, OGhiToChieu> }> {
  const bang = tra ?? (await napBangTra())
  const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu }, { uocLuongBacCau, uocLuongBacCauGoc }, { CAU_HINH_LEN_BANG_MAC_DINH }] = await Promise.all([
    import('../../lib/bai-tap-pdf'),
    import('../../lib/html-may-chieu'),
    import('../../lib/uoc-luong-bo-cuc'),
    import('../../lib/len-bang-cau-hinh'),
  ])
  const thieu = new Set<string>()
  const boKhoi = new Set<string>()
  const oGhi = new Map<string, OGhiToChieu>()
  const khoiDich = tuyChon.khoiDich ?? []
  const dsGiu = ds.filter((o) => {
    if (!cauKhacKhoiLop(o.qid, khoiDich)) return true
    boKhoi.add(o.qid)
    return false
  })
  const dsO: OBang[] = dsGiu.map((o) => {
    // Nội dung ĐÚNG mã: nội dung máy chủ gửi kèm, rồi Ngân hàng đề khớp nguyên mã. Không có ⇒ dòng thay thế (đếm vào `soThieu`), KHÔNG đoán câu khác.
    let goc: CauGoc | undefined
    if (o.cauGoc) {
      const cg = o.cauGoc
      goc = { phan: cg.phan || o.phan || 'I', q: cg }
    }
    if (!goc) goc = traChinhXac(bang, o.qid)

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
  return { html, soThieu: thieu.size, soBoKhoi: boKhoi.size, o: oGhi }
}
