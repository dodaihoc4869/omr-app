// Hành trình — phần THUẦN dùng chung cho kế hoạch ngày, Sảnh và Thử sức thêm (09/10). Không đọc D1.
// Hợp đồng: docs/hanh-trinh-bai-thu-suc-0910.md.
import type { CauSrs, TrangThaiCau } from './srs2-loi'
import { chonCauHanhTrinh, tangCuaEm, type BaiHanhTrinh, type TangHanhTrinh } from './hanh-trinh-ngay'

/** Bài trong phạm vi đã dạy của lớp (hình dạng `PhamViLop` của bai-da-day.ts, chỉ phần cần đọc). */
export interface BaiPhamVi { khoaBai: string; tenBai: string; viTri: number }
export interface PhamViBai { maDe: ReadonlySet<string>; baiTheoMaDe: ReadonlyMap<string, BaiPhamVi>; baiDaTick: readonly BaiPhamVi[] }

/** Mã tờ gốc (bỏ hậu tố phần -TN/-DS/-TLN) — cùng luật `tachMaTo` của srs2-gv.ts. */
export const maToGoc = (maDe: string): string => String(maDe ?? '').trim().replace(/-(TN|DS|TLN)$/, '')
/** Khoá bài mà động cơ dùng để mở tầng: tiền tố mã tờ tới "-B<số>". */
export const khoaBaiDongCo = (maDe: string): string => /^(.*?-B\d+)(?:-|$)/i.exec(maDe)?.[1] ?? maDe

/**
 * Tầng sẵn sàng theo bài của động cơ (cổng ≥ 80% nhóm nội dung ở tầng dưới đã vững — `tangCuaEm`): câu → tầng của bài chứa nó; `tang` = tầng cao nhất.
 * Đúng đoạn lapChotHanhTrinh vẫn dùng (tách ra để Thử sức thêm chọn câu bằng CÙNG cổng).
 */
export function tangSanSangTheoBai(cau: readonly CauSrs[], maDeCua: (qid: string) => string | undefined, tt: ReadonlyMap<string, TrangThaiCau>,
  nhom: ReadonlyMap<string, string>, dangVung?: readonly string[]): { tangSanSang: Map<string, TangHanhTrinh>; tang: TangHanhTrinh } {
  const theoBai = new Map<string, CauSrs[]>()
  for (const c of cau) {
    if (c.nguon !== 'chien_dich') continue
    const bai = khoaBaiDongCo(maDeCua(c.qid) ?? '')
    const ds = theoBai.get(bai)
    if (ds) ds.push(c); else theoBai.set(bai, [c])
  }
  const tangSanSang = new Map<string, TangHanhTrinh>()
  let tang: TangHanhTrinh = 1
  for (const ds of theoBai.values()) {
    const t = tangCuaEm(ds, tt, nhom, dangVung)
    tang = Math.max(tang, t) as TangHanhTrinh
    for (const c of ds) tangSanSang.set(c.qid, t)
  }
  return { tangSanSang, tang }
}

/**
 * `hanhTrinh.bai` của Sảnh: MỖI bài thầy đã dạy của lớp em (bài đang tick ∪ bài đứng trước bài tick xa nhất — phạm vi bai-da-day.ts), xếp theo vị trí
 * trên cây Dạy học (`viTri` = thứ tự số chương rồi số bài, app thầy đánh lúc tick), tên lấy nguyên `ten_bai` đã lưu.
 * `tangMo` = cổng mở tầng theo bài của động cơ (`tangCuaEm`, ≥ 80% nhóm nội dung tầng dưới vững) trên câu ứng viên của ngày thuộc bài ấy; bài không có câu
 * ứng viên hôm nay ⇒ chưa có bằng chứng ⇒ tầng 1 (luật "không có bằng chứng tầng trước thì không tự mở").
 * `vung` = null: tổng số dạng của CẢ bài không có sẵn trong lượt Sảnh (ứng viên chỉ là cửa sổ xoay ≤ 96 câu/tầng) — không báo số trên mẫu cắt.
 * Không có phạm vi (lớp chưa tick bài) ⇒ null (không có tên bài để hiện, không bịa).
 */
export function baiHanhTrinh(phamVi: PhamViBai | null | undefined, cau: readonly CauSrs[], maDeCua: (qid: string) => string | undefined,
  tt: ReadonlyMap<string, TrangThaiCau>, nhom: ReadonlyMap<string, string>, dangVung?: readonly string[]): BaiHanhTrinh[] | null {
  if (!phamVi) return null
  const bai = new Map<string, BaiPhamVi>()
  for (const b of [...phamVi.baiTheoMaDe.values(), ...phamVi.baiDaTick]) if (b.khoaBai && !bai.has(b.khoaBai)) bai.set(b.khoaBai, b)
  if (!bai.size) return null
  const cauCua = new Map<string, CauSrs[]>()
  for (const c of cau) {
    if (c.nguon !== 'chien_dich') continue
    const b = phamVi.baiTheoMaDe.get(maToGoc(maDeCua(c.qid) ?? ''))
    if (!b) continue
    const ds = cauCua.get(b.khoaBai)
    if (ds) ds.push(c); else cauCua.set(b.khoaBai, [c])
  }
  return [...bai.values()]
    .sort((x, y) => x.viTri - y.viTri || x.khoaBai.localeCompare(y.khoaBai))
    .map((b) => ({ khoa: b.khoaBai, ten: b.tenBai, tangMo: tangCuaEm(cauCua.get(b.khoaBai) ?? [], tt, nhom, dangVung), vung: null }))
}

export interface DauVaoLoThem {
  ngay: string
  tang: TangHanhTrinh
  /** Mọi câu (gốc) đã xếp hôm nay ∪ đã làm hôm nay — không lấy lại, không lấy nhóm nội dung của chúng. */
  daCo: readonly string[]
  soCau: number
  cau: readonly CauSrs[]
  tt: ReadonlyMap<string, TrangThaiCau>
  nhom: ReadonlyMap<string, string>
  chan: ReadonlySet<string>
  tangSanSang: ReadonlyMap<string, TangHanhTrinh>
  trongSo?: Readonly<Record<string, number>>
  vaiTro?: Parameters<typeof chonCauHanhTrinh>[0]['vaiTro']
  /** Có phạm vi đã dạy ⇒ câu phải thuộc tờ trong phạm vi (như cổng v5 với câu chiến dịch). */
  phamVi?: ReadonlySet<string> | null
  maDeCua: (qid: string) => string | undefined
  tuLuan: (qid: string) => boolean
}

/**
 * Lô Thử sức thêm của Hành trình: đúng bộ chọn `chonCauHanhTrinh` (cổng tầng, không tự luận, không câu/nhóm bảo vệ, không câu đã cắt tỉa, câu ôn chỉ khi
 * đã đến hạn, nhóm nội dung chưa gặp hôm nay) với sàn = |đã có| + soCau ⇒ chọn đúng tối đa `soCau` câu MỚI cho hôm nay. Không ghi gì.
 */
export function chonLoThem(a: DauVaoLoThem): { dao: string[]; doan: string[] } {
  if (a.soCau <= 0) return { dao: [], doan: [] }
  const daCo = [...new Set(a.daCo)]
  const cau = a.cau.filter((c) => !a.tuLuan(c.qid) && !a.chan.has(a.nhom.get(c.qid) || c.qid) &&
    (!a.phamVi || c.nguon !== 'chien_dich' || a.phamVi.has(maToGoc(a.maDeCua(c.qid) ?? ''))))
  const lap = chonCauHanhTrinh({ ngay: a.ngay, tang: a.tang, toiThieu: daCo.length + a.soCau, daLam: daCo, cau, tt: a.tt, nhom: a.nhom, chan: a.chan,
    trongSo: a.trongSo, tangSanSang: a.tangSanSang, vaiTro: a.vaiTro })
  return lap
}
