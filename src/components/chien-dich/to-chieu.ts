// TỜ MÁY CHIẾU CHO CHIẾN DỊCH — dùng LẠI đúng luồng tờ chiếu của màn Gọi lên bảng (`cauLuyenTuBoCau` → `taoHtmlMayChieu`
// → `KhungXemPhieu`), chỉ khác NGUỒN: danh sách câu + người lên bảng của buổi chữa / "câu cần thầy dạy lại".
// NỘI DUNG ĐỀ — CHỈ ĐÚNG MÃ CÂU (thầy 06/10: tờ chữa lớp 11 lẫn câu lớp 10): (1) nội dung máy chủ gửi kèm dòng (`cauGoc`, lệnh `noi-dung-cau`, đã qua cổng
// khối); (2) Ngân hàng đề trên máy này KHỚP NGUYÊN mã câu máy chủ (`<tờ gốc>-<phần>-<số>`, bỏ hậu tố -TN/-DS/-TLN). KHÔNG khớp đuôi, KHÔNG đoán theo số thứ tự
// (`3`, `III-3`, `q3`…): bản cũ làm vậy nên câu không có trên máy bị thay bằng MỘT CÂU KHÁC của tờ đầu tiên trong ngân hàng. Câu không có nội dung đúng mã vẫn
// chiếu bằng dòng thay thế (cùng cách màn Gọi lên bảng) và nơi gọi được báo số câu thiếu; câu máy chủ báo khác khối lớp thì BỎ khỏi tờ.
// HAI NÚT ĐẠT / CHƯA ĐẠT trên tờ: truyền `maPhien` ⇒ tờ dựng kèm `cauNoi` (đúng cầu nối `to-chieu-cau-noi.ts` của Gọi lên bảng);
// chỉ ô CÓ em (không phải "Cả lớp") và câu tra được chuyên đề mới có nút — thiếu chuyên đề thì máy chủ không ghi được.
// Trả kèm `o` (khoá `sbd|qid` ⇒ ô) để nơi nghe tin tra lại ô theo khoá, không tin nội dung tin đến.
// THẦY TỰ CHỮA (12/10, Cần thầy chữa › Thầy tự chữa — `ThayTuChua.tsx`): CHỈ THÊM ba tuỳ chọn của `dungToChieu` (giữ tự luận khi thầy tự chọn đề · dải thống kê
// lớp phím T theo mã câu · nút X "Ai sai" cho tờ cả lớp qua mốc khoá ẩn). Vắng ba tuỳ chọn ⇒ tờ y như trước.
// CHỮA CÂU KHÓ & TÍNH TOÁN (12/10B — tờ chuẩn Chiếu lên bảng, mỗi câu gọi một em làm sai): CHỈ THÊM ba trường tuỳ chọn của `OChieu` (`lichSu` in trong thẻ tên ·
// `ungVien` danh sách em gọi thay ⇒ nút "Gọi em khác", `to-chieu-goi-em-khac.ts` · `chuLop` số liệu lớp ở thanh dưới). Vắng ba trường ⇒ tờ y như trước.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../../data/examContent'
import type { CauLuyen } from '../../lib/bai-tap-pdf'
import type { OBang } from '../../lib/html-may-chieu'
import type { ThongKeLopCau } from '../../lib/thong-ke-lop-cau'
import { qidMayChuCuaIdCau } from '../../lib/lich-su-cau-len-bang'
import { phanTichKhoiCau } from '../../lib/khoi-cau'
import { laCauTuLuan } from '../../lib/cau-tu-luan'
import { khoaToChieu } from '../../lib/to-chieu-cau-noi'
import { noiDungTuCauGoc, type NoiDungCau } from '../../lib/thoi-gian-len-bang'
import type { NhanLichSuCau } from '../../lib/lich-su-cau-len-bang'
import type { DotGoiEm } from './to-chieu-goi-em-khac'
import { saoTuMucDo } from './tinh'
import type { NoiDungCauMayChu } from './api'
import type { KetQuaLenh } from '../../lib/goi-lenh-thay'

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
/** Câu mà BẢNG đã bị dẹt thành chữ (thầy 06/10: "Chất | palmitic acid | … Hàm lượng (%) | 5% | …"): đề có ≥ 3 dấu ` | ` (có khoảng trắng hai bên) mà câu KHÔNG có bảng thật.
 * Bản này hỏng — tờ chiếu lấy bản đúng của máy chủ (kho có bảng dạng hàng/cột) thay cho bản dẹt trên máy thầy. */
export function laBangDet(q: unknown): boolean {
  if (!q || typeof q !== 'object') return false
  const o = q as Record<string, unknown>
  const co = (v: unknown) => Array.isArray(v) && v.length > 0
  if (co(o.table) || co(o.bang)) return false
  return typeof o.text === 'string' && o.text.split(' | ').length - 1 >= 3
}

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
  /** CHỮA CÂU KHÓ (12/10, chỉ thêm): dòng lịch sử của em ở câu này, in TRONG thẻ tên (`OBang.lichSuCau`) — chỉ thấy sau khi thầy gọi em. Vắng ⇒ như cũ. */
  lichSu?: NhanLichSuCau
  /** CHỮA CÂU KHÓ (12/10, chỉ thêm): MỌI em có thể gọi lên câu này, theo thứ tự gọi — người đầu chính là em của ô (`sbd`). Có ⇒ tờ có nút "Gọi em khác"
   *  (`to-chieu-goi-em-khac.ts`) và mọi em trong danh sách đều là ô ghi được (cùng chuyên đề). Vắng ⇒ tờ y như cũ. */
  ungVien?: readonly { sbd: string; ten: string; lichSu?: NhanLichSuCau }[]
  /** CHỮA CÂU KHÓ (12/10, chỉ thêm): dòng số liệu lớp của câu ở thanh dưới tờ ("18/34 em lớp sai câu này") — đi cùng `ungVien`. */
  chuLop?: string
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
  const canHoi = [...new Set(ds.filter((o) => { if (o.cauGoc) return false; const g = traChinhXac(tra, o.qid); return !g || laBangDet(g.q) }).map((o) => o.qid))]
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

/** Lỗi của MỘT lệnh thầy (nhánh `ok: false` của `KetQuaLenh`). */
export type LoiLenhThay = Extract<KetQuaLenh<unknown>, { ok: false }>

/** Lỗi này có phải "máy chủ TỪ CHỐI mã bí mật" không — nơi gọi DỪNG và nói rõ thay vì dựng tờ toàn dòng thay thế. */
export function laLoiMaBiMat(l: LoiLenhThay): boolean {
  return l.loai === 'tu_choi' && /mã bí mật/i.test(l.chu)
}

/**
 * HỎI NỘI DUNG CÂU CHO TỜ CHIẾU, có thử lại: mạng chập chờn / quá hạn ⇒ hỏi lại MỘT lần (máy chủ từ chối `tu_choi` thì hỏi lại cũng vô ích — không thử).
 * Lỗi cuối cùng ghi vào `ghiLoi` để nơi gọi nói THẬT lý do (07/10: mã bí mật cũ ⇒ tờ chiếu thành "Nội dung câu hỏi N" mà thầy không biết vì sao). Trả `null` khi vẫn lỗi.
 */
export async function hoiNoiDungChoToChieu(
  doc: (qids: string[]) => Promise<KetQuaLenh<NoiDungCauMayChu>>,
  qids: string[],
  ghiLoi: (l: LoiLenhThay) => void,
): Promise<NoiDungCauMayChu | null> {
  let r = await doc(qids)
  if (!r.ok && r.loai !== 'tu_choi') r = await doc(qids)
  if (!r.ok) {
    ghiLoi(r)
    return null
  }
  return r.du
}

/** Tuỳ chọn dựng tờ. `khoiDich` = khối của lớp / chiến dịch: dòng có mã khác khối bị bỏ (phòng thủ thêm); rỗng / vắng ⇒ không chặn. */
export interface TuyChonToChieu {
  sbdLop?: readonly string[]
  lop?: string
  khoiDich?: readonly number[]
  /** THẦY TỰ CHỮA (12/10) — thầy TỰ CHỌN đề trong Dạy học: câu tự luận có trong đề vẫn hiện (luật CLAUDE.md "riêng Gọi lên bảng thầy chọn gì hiện
   *  đúng thế", như bảng Dạy học). Vắng ⇒ bỏ tự luận như cũ (tờ chữa của chiến dịch không bao giờ có tự luận — thầy 06/10). */
  giuTuLuan?: boolean
  /** Dải thống kê lớp (phím T) của từng câu, theo mã câu máy chủ. Trả null / vắng ⇒ câu ấy không vẽ dải (luật cũ: không số thì không bịa). */
  thongKe?: (qid: string, cau: CauLuyen) => ThongKeLopCau | null | undefined
  /** Tờ CẢ LỚP (không gọi em — Thầy tự chữa 12/10): dòng không có em vẫn tra được "Ai sai" (nút X) — mỗi đợt mang MỐC KHOÁ ẨN `|<mã câu>`
   *  (`chenMocAiSaiCaLop`), ô ấy vào `o` để app nghe tin. Không thêm nút Đạt / Chưa đạt / Thầy chữa (không có em để ghi). Cần `maPhien`. */
  aiSaiCaLop?: boolean
}

/** Lớp của mốc khoá ẩn (Thầy tự chữa 12/10). Cùng lớp + thuộc tính với nút "Thầy chữa" (`.mc-thay-chua[data-khoa-tc]`) — đúng chỗ nút X của tờ đọc khoá
 *  câu đang chiếu — nhưng ở trạng thái `xong`, KHÔNG có nút bên trong và ẩn hẳn: phím C không hiện, cầu nối không đổi gì ở mốc này. */
export const LOP_MOC_CA_LOP = 'mc-moc-ca-lop'
const thoatTt = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Chèn mốc khoá ẩn vào từng đợt (thứ tự đợt = thứ tự ô). `khoaTheoDot[i]` null ⇒ đợt ấy không có mốc. Số vùng `.mc-giai-vung` không khớp số đợt
 *  (tờ đổi khuôn) ⇒ trả NGUYÊN tờ: nút X khi ấy chỉ báo "không tra được", không gắn nhầm câu. */
export function chenMocAiSaiCaLop(html: string, khoaTheoDot: readonly (string | null)[]): string {
  const MO = '<div class="mc-giai-vung">'
  const manh = html.split(MO)
  if (manh.length - 1 !== khoaTheoDot.length || !khoaTheoDot.some(Boolean)) return html
  return manh.reduce((ra, m, i) => {
    if (i === 0) return m
    const k = khoaTheoDot[i - 1]
    return ra + MO + (k ? `<span class="mc-thay-chua ${LOP_MOC_CA_LOP}" data-khoa-tc="${thoatTt(k)}" data-trang="xong" hidden style="display:none"></span>` : '') + m
  }, '')
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
  if(tuyChon.sbdLop?.length||tuyChon.lop){
    const {layEmChieu,nhanEmChieu}=await import('../../lib/ung-vien-chieu')
    const uv=await layEmChieu(ds.map(o=>o.qid),tuyChon.sbdLop??[],null,tuyChon.lop)
    ds=ds.map(o=>{const list=uv.get(o.qid)??[],e=list[0];return {...o,sbd:e?.sbd??'',ten:e?.ten??'Cả lớp',lichSu:e?nhanEmChieu(e):undefined,ungVien:list.map(e=>({sbd:e.sbd,ten:e.ten,lichSu:nhanEmChieu(e)}))}})
  }
  const bang = tra ?? (await napBangTra())
  const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu }, { uocLuongBacCau, uocLuongBacCauGoc }, { CAU_HINH_LEN_BANG_MAC_DINH }] = await Promise.all([
    import('../../lib/bai-tap-pdf'),
    import('../../lib/html-may-chieu'),
    import('../../lib/uoc-luong-bo-cuc'),
    import('../../lib/len-bang-cau-hinh'),
  ])
  const thieu = new Set<string>()
  const boKhoi = new Set<string>()
  const boTuLuan = new Set<string>()
  const oGhi = new Map<string, OGhiToChieu>()
  /** Mốc khoá ẩn của từng đợt (Thầy tự chữa) — cùng thứ tự với `dsO` (mỗi ô một đợt). */
  const khoaTheoDot: (string | null)[] = []
  /** Chữa câu khó (12/10): em gọi được + đợt có nút ghi không + dòng số liệu lớp của từng đợt (null = đợt không mang gì) — cùng thứ tự với `dsO`. */
  const dotGoiEm: (DotGoiEm | null)[] = []
  const khoiDich = tuyChon.khoiDich ?? []
  const dsGiu = ds.filter((o) => {
    if (!cauKhacKhoiLop(o.qid, khoiDich)) return true
    boKhoi.add(o.qid)
    return false
  })
  const dsO: OBang[] = dsGiu.flatMap((o): OBang[] => {
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

    // THẦY 06/10: "câu tự luận tuyệt đối loại bỏ" — tờ chiếu chữa KHÔNG BAO GIỜ có câu tự luận. Câu Phần III không tra được nội dung thì không biết có phải tự luận không ⇒ cũng bỏ (đếm vào `thieu`).
    // Riêng Thầy tự chữa (12/10, `giuTuLuan`): thầy tự chọn đề ⇒ giữ câu tự luận như bảng Dạy học.
    if (cl && !tuyChon.giuTuLuan && laCauTuLuan({ phan: cl.phan, text: cl.text, dapAn: cl.dapAn, ...(cl.phan === 'I' ? { choices: cl.luaChon ?? [] } : cl.phan === 'II' ? { ideas: cl.luaChon ?? [] } : {}) }, cl.phan)) { boTuLuan.add(o.qid); return [] }
    if (!cl && o.phan === 'III') { thieu.add(o.qid); return [] }
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
    // Tờ CẢ LỚP (Thầy tự chữa 12/10): dòng không em, có nội dung đúng mã ⇒ mốc khoá ẩn cho nút X "Ai sai" (không nút ghi nào).
    const mocCaLop = !!tuyChon.aiSaiCaLop && !!maPhien && !o.sbd && !!goc
    if (mocCaLop) oGhi.set(khoaToChieu('', o.qid), { sbd: '', hoTen: o.ten, qid: o.qid, chuyenDe: cau.chuyenDe })
    // CHỮA CÂU KHÓ (12/10): ô có em + danh sách em gọi thay. Câu có chuyên đề ⇒ mọi em là ô ghi được (nút "Gọi em khác" đổi khoá ô chấm);
    // câu THIẾU chuyên đề ⇒ không nút Đạt / Chưa đạt (luật cũ: máy chủ không ghi được), chỉ mốc khoá ẩn của em để X "Ai sai" vẫn tra được.
    const uv = o.sbd && o.ungVien?.length ? o.ungVien : null
    const mocEm = !!uv && !coNut && !!tuyChon.aiSaiCaLop && !!maPhien && !!goc
    if (uv && (coNut || mocEm)) for (const e of uv) oGhi.set(khoaToChieu(e.sbd, o.qid), { sbd: e.sbd, hoTen: e.ten, qid: o.qid, chuyenDe: coNut ? cau.chuyenDe : '' })
    dotGoiEm.push(uv || o.chuLop ? { em: (uv ?? []).map((e) => ({ sbd: e.sbd, ten: e.ten, khoa: coNut || mocEm ? khoaToChieu(e.sbd, o.qid) : '', nhan: e.lichSu?.chu ?? '' })), coGhi: coNut, chuLop: o.chuLop ?? '' } : null)
    khoaTheoDot.push(mocCaLop ? khoaToChieu('', o.qid) : mocEm ? khoaToChieu(o.sbd, o.qid) : null)
    const tk = tuyChon.thongKe?.(o.qid, cau)
    return [{
      sbd: o.sbd,
      hoTen: o.ten,
      ...(coNut ? { qid: o.qid } : {}),
      ...(tk ? { thongKe: tk } : {}),
      bacUoc: (goc ? uocLuongBacCauGoc(goc.phan, goc.q) : uocLuongBacCau(cau)).bac,
      soCau: o.stt,
      sao: cau.sao,
      mucDo: o.mucDo ?? undefined,
      cau,
      viSao: o.viSao,
      ...(o.lichSu ? { lichSuCau: o.lichSu } : {}),
    }]
  })
  const html0 = taoHtmlMayChieu(dsO, {
    tenBuoi,
    ngay: new Date(),
    nganSachPhut: CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT,
    ...(maPhien && oGhi.size > 0 ? { cauNoi: { maPhien } } : {}),
  })
  const html1 = tuyChon.aiSaiCaLop ? chenMocAiSaiCaLop(html0, khoaTheoDot) : html0
  // Chữa câu khó (12/10): có đợt mang danh sách em ⇒ chèn dữ liệu đợt + nút "Gọi em khác" (mảnh riêng, nạp động). Không có ⇒ tờ y như cũ.
  const html = dotGoiEm.some(Boolean) ? (await import('./to-chieu-goi-em-khac')).chenGoiEmKhac(html1, dotGoiEm) : html1
  return { html, soThieu: thieu.size, soBoKhoi: boKhoi.size, o: oGhi }
}
