// BẢNG DẠY HỌC của mục Lên bảng (thầy lệnh 28/09) — phần THUẦN: lọc riêng cây thư mục DẠY HỌC của kho, gom câu thầy tích (KHÔNG lọc tự luận —
// thầy tự chọn thì hiện đúng thế, luật `CLAUDE.md` "riêng Gọi lên bảng thầy chọn gì hiện đúng thế"), và dựng tờ máy chiếu bằng MÀN CHIẾU MỚI
// (`taoHtmlMayChieu` — đã gồm lớp bản vẽ 28/09 `len-bang-moi-to-chieu.ts` + bố cục `bo-cuc-to-chieu.ts`; mỗi câu một đợt, đủ ba phần + tự luận + công thức/hình).
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { chuongCuaDe, thuMucCuaDe } from './cay-chon-de'
import { laCauTuLuan } from './cau-tu-luan'
import { laMucDayHocDacBiet } from './tach-phan-de'
import { qidMayChuCuaIdCau } from './lich-su-cau-len-bang'
import type { MucDo } from './chon-em-day-hoc'

export const TEN_THU_MUC_DAY_HOC = 'DẠY HỌC'

/** Đề thuộc thư mục DẠY HỌC của kho (nhóm "12 · DẠY HỌC/C1 - …"). */
export function laDeDayHoc(s: Pick<TeacherExamSource, 'nhom'>): boolean {
  return thuMucCuaDe(s).normalize('NFC').toUpperCase() === TEN_THU_MUC_DAY_HOC
}
/** CHỈ nhánh DẠY HỌC — hộp chọn của bảng Dạy học không hiện đề kiểm tra, kho cũ hay nhánh khác. */
export function locDeDayHoc<T extends Pick<TeacherExamSource, 'nhom'>>(ds: readonly T[]): T[] {
  return ds.filter(laDeDayHoc)
}

/** KHO CỦA BẢNG DẠY HỌC: LỌC nhánh DẠY HỌC TRƯỚC, bảo tồn các mục chuyên biệt (Ví dụ minh hoạ, Dạng toán trọng tâm)
 *  để không bị đề toàn bài nuốt mất câu, khử trùng câu giữa các đề phổ thông trong nhánh ấy, rồi tách theo phần.
 *  LỖI 28/09 (thầy báo "cây thiếu lớp 10"): bản đầu khử trùng trên CẢ KHO rồi mới lọc — câu Dạy học trùng với "Bộ đề" (hạng ưu tiên cao hơn) hoặc
 *  với cây bài `10-…/11-…/12-…` (cùng hạng nhưng đứng trước theo mã đề) bị nhánh kia giành, nên kho thật 845 / 972 / 1542 câu (khối 10 / 11 / 12)
 *  chỉ còn 0 / 80 / 120 và cả Khối 10 biến mất. Bảng Dạy học chỉ chiếu nhánh này nên không có gì để "nhường" cho nhánh khác. */
export function khoDayHoc(
  ds: readonly TeacherExamSource[],
  khuTrung: (x: TeacherExamSource[]) => { nguon: TeacherExamSource[] },
  tach: (x: TeacherExamSource[]) => TeacherExamSource[],
): TeacherExamSource[] {
  const dayHoc = locDeDayHoc(ds)
  const dacBiet = dayHoc.filter(laMucDayHocDacBiet)
  const phoThong = dayHoc.filter((s) => !laMucDayHocDacBiet(s))
  const phoThongKhuMap = new Map(khuTrung(phoThong).nguon.map((s) => [s.maDe, s]))
  const dacBietKhuMap = new Map(
    dacBiet.map((s) => {
      const kq = khuTrung([s]).nguon[0] ?? s
      return [s.maDe, kq]
    }),
  )
  const ketQua: TeacherExamSource[] = []
  for (const s of dayHoc) {
    if (laMucDayHocDacBiet(s)) {
      const db = dacBietKhuMap.get(s.maDe)
      if (db) ketQua.push(db)
    } else {
      const pt = phoThongKhuMap.get(s.maDe)
      if (pt) ketQua.push(pt)
    }
  }
  return locDeDayHoc(tach(ketQua))
}

export type CauGocDayHoc = TeacherMcqQuestion | TeacherTrueFalseQuestion | TeacherShortAnswerQuestion
export interface CauDayHoc {
  /** Khoá duy nhất trong buổi (id câu trong kho). */
  khoa: string
  /** Mã câu máy chủ (`<tờ gốc>-<phần>-<số>`) — ghi Đạt/Chưa đạt và tra sổ. Không đổi được ⇒ dùng id kho. */
  qid: string
  phan: 'I' | 'II' | 'III'
  q: CauGocDayHoc
  maDe: string
  tenDe: string
  chuyenDe: string
  maDang: string | null
  tenDang: string | null
  mucDo: MucDo | ''
  tuLuan: boolean
}

/** Mọi câu của các đề đã tích, theo thứ tự kho (phần I → II → III), không trùng câu, KHÔNG bỏ câu tự luận. */
export function cauTuDeChon(ds: readonly TeacherExamSource[], maChon: ReadonlySet<string>): CauDayHoc[] {
  const ra: CauDayHoc[] = []
  const daCo = new Set<string>()
  for (const s of ds) {
    if (!maChon.has(s.maDe)) continue
    const them = (phan: CauDayHoc['phan'], q: CauGocDayHoc) => {
      if (!q || daCo.has(q.id)) return
      daCo.add(q.id)
      ra.push({
        khoa: q.id,
        qid: qidMayChuCuaIdCau(q.id) ?? q.id,
        phan,
        q,
        maDe: s.maDe,
        tenDe: (s.nguon || s.maDe).split(' — ')[0]!.trim(),
        chuyenDe: String(q.chuyenDe || chuongCuaDe(s) || '').trim(),
        maDang: q.dang?.ma || null,
        tenDang: q.dang?.ten || null,
        mucDo: q.mucDo ?? '',
        // Nhãn "Tự luận" theo NỘI DUNG câu (không theo mã): cả thư mục Dạy học mang đuôi -VD/-DT nên luật mã của `cau-tu-luan.ts` coi mọi câu là tự luận.
        tuLuan: laCauTuLuan({ ...q, id: undefined, qid: undefined, maDe: undefined }, phan),
      })
    }
    for (const q of s.phanI ?? []) them('I', q)
    for (const q of s.phanII ?? []) them('II', q)
    for (const q of s.phanIII ?? []) them('III', q)
  }
  return ra
}

export function demCau(ds: readonly CauDayHoc[]): { tong: number; I: number; II: number; III: number; tuLuan: number } {
  return {
    tong: ds.length,
    I: ds.filter((c) => c.phan === 'I').length,
    II: ds.filter((c) => c.phan === 'II').length,
    III: ds.filter((c) => c.phan === 'III').length,
    tuLuan: ds.filter((c) => c.tuLuan).length,
  }
}

/** Đoạn đầu đề (một dòng) cho danh sách câu trên màn thầy. */
export function tomTatDe(c: Pick<CauDayHoc, 'q'>, toiDa = 110): string {
  const t = String(c.q.text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\\ce\{([^{}]*)\}/g, '$1')
    .replace(/\$+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > toiDa ? `${t.slice(0, toiDa - 1).trimEnd()}…` : t || '(câu chỉ có hình)'
}

export interface EmLenCau {
  sbd: string
  hoTen: string
  lop?: string
  /** Lần lên bảng thứ mấy của em trong buổi (đã tính lần này). */
  lanLenBang?: number
  /** Dòng lịch sử câu này của em trên THẺ TÊN (Kiểm tra đầu giờ 29/09): "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)". Thiếu ⇒ không in. */
  lichSu?: string
}
/** Một ô Đạt / Chưa đạt trên tờ — khuôn `OGhiToChieu` của luồng ghi sẵn có (`ghiLenBang`). */
export interface OGhiDayHoc {
  sbd: string
  hoTen: string
  qid: string
  chuyenDe: string
}

/** Dựng HTML tờ máy chiếu MỚI cho các câu (đúng thứ tự thầy xếp). `giao` = em được chọn cho từng câu (theo `khoa`); thiếu ⇒ ô "Cả lớp" (chưa gọi ai).
 *  `maPhien` ⇒ tờ có hai nút Đạt / Chưa đạt ở các ô CÓ em (cầu nối `to-chieu-cau-noi.ts`, ghi bằng `ghiLenBang` — không đường ghi thứ hai). */
export async function dungToChieuDayHoc(
  dsCau: readonly CauDayHoc[],
  giao: ReadonlyMap<string, EmLenCau>,
  tenBuoi: string,
  maPhien?: string,
): Promise<{ html: string; o: Map<string, OGhiDayHoc> }> {
  const [{ cauLuyenTuBoCau }, { taoHtmlMayChieu }, { uocLuongBacCauGoc }, { CAU_HINH_LEN_BANG_MAC_DINH }, { khoaToChieu }] = await Promise.all([
    import('./bai-tap-pdf'),
    import('./html-may-chieu'),
    import('./uoc-luong-bo-cuc'),
    import('./len-bang-cau-hinh'),
    import('./to-chieu-cau-noi'),
  ])
  const o = new Map<string, OGhiDayHoc>()
  const dsO = dsCau.map((c, i) => {
    const [cl] = cauLuyenTuBoCau([{ phan: c.phan, maDe: c.maDe, q: c.q }])
    const cau = {
      ...cl!,
      chuyenDe: cl!.chuyenDe || c.chuyenDe,
      explanation: cl!.explanation || (c.q as any).explanation || (c.q as any).huongDanGiai || (c.q as any).loiGiaiChiTiet,
      loiGiai: cl!.loiGiai || (c.q as any).loiGiai,
      chot: cl!.chot || (c.q as any).loiGiai?.chot || (c.q as any).kienThucCotLoi || '',
    }
    const em = giao.get(c.khoa)
    const coNut = !!maPhien && !!em && !!c.chuyenDe
    if (coNut) o.set(khoaToChieu(em.sbd, c.qid), { sbd: em.sbd, hoTen: em.hoTen, qid: c.qid, chuyenDe: c.chuyenDe })
    return {
      sbd: em?.sbd ?? '',
      hoTen: em?.hoTen ?? 'Cả lớp',
      ...(coNut ? { qid: c.qid } : {}),
      ...(em?.lop ? { lop: em.lop } : {}),
      ...(em?.lanLenBang ? { lanLenBang: em.lanLenBang } : {}),
      ...(em?.lichSu ? { lichSuCau: { kieu: 'dung' as const, chu: em.lichSu } } : {}),
      bacUoc: uocLuongBacCauGoc(c.phan, c.q).bac,
      soCau: i + 1,
      sao: cau.sao,
      mucDo: c.mucDo || undefined,
      cau,
    }
  })
  const html = taoHtmlMayChieu(dsO, {
    tenBuoi,
    ngay: new Date(),
    nganSachPhut: CAU_HINH_LEN_BANG_MAC_DINH.NGAN_SACH_PHUT,
    ...(maPhien && o.size > 0 ? { cauNoi: { maPhien } } : {}),
  })
  return { html, o }
}
