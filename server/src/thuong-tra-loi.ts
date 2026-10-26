// THƯỞNG TRONG LỆNH NỘP CÂU `answer` (thưởng phạt 26/10 — DAC-TA-THUONG-PHAT-2610.md §4.1). Lệnh NÓNG nhất ⇒ KHÔNG thêm lượt đọc / vòng chờ nào:
//   · chuỗi đúng trong ngày nằm trong hồ sơ game (`p.ntChuoi`, đọc sẵn + ghi CAS cùng lô chấm);
//   · nguyên tử từng câu của bài nằm trong JSON phiên (`$.nt`, đọc sẵn ở đầu lượt; ghi bằng MỘT câu json_set CÙNG lô chấm);
//   · câu cuối bài: ghi `thuong_bai_xong` + đọc mục tiêu ngày bằng câu cuối CÙNG lô chấm (0 lệnh D1 thêm trên đường trả lời);
//   · nguyên tử vào sổ `exp_so` bằng ĐÚNG khoản câu game đang có (khoá `cau_game|<lượt>|<câu>`, gộp lô chấm) — số em thấy = số vào sổ = số thú ăn.
// Áp cho phiên BÀI HỌC (`hocTap` — Hành trình / Gói 7) và Thử thách Kim cương (`kimCuong`). Phiên game khác giữ y luật cũ.
// KHÔNG nhãn lười: câu không được tính chỉ có `tinh: false`.
import type { D1PreparedStatement, Env } from './kieu'
import { ketBaiNguyenTu, nguyenTuCau, type CauCuaBai, type KetBaiNguyenTu, type ThuongCau } from './exp-hoc-tap'
import { NT_HOAN_HAO } from './exp-cau-hinh'
import { cauKhongDuocTinh, laCauKho, MA_TT, TT_KIM_CUONG, mucTieuBai, trangThaiKimCuong } from './thuong-luat'
import type { DoLuot } from './do-giay-luot'
import { lenhCongTinhThe } from './thuong-d1'

/** Một câu đã chấm của phiên, lưu gọn trong `game_v2_session.json.$.nt`. */
export interface MucNt {
  q: string
  /** nguyên tử của câu */
  n: number
  d: 0 | 1
  h: 0 | 1
  /** được tính */
  t: 0 | 1
  /** câu khó */
  k: 0 | 1
  /** chuỗi đúng sau câu */
  c: number
  /** giây làm (đo của máy em; 0 = không rõ) */
  g: number
  /** câu làm lại cuối chặng */
  l?: 1
}

export interface PhienNt {
  created?: number
  hocTap?: number
  kimCuong?: number
  kc?: string
  nt?: unknown
  questions: readonly { qid: string; lamLaiCuoi?: true }[]
}

export const laPhienNguyenTu = (s: PhienNt): boolean => s.hocTap === 1 || s.kimCuong === 1
export const docNt = (nt: unknown): MucNt[] => (Array.isArray(nt) ? (nt.filter((x) => !!x && typeof x === 'object' && typeof (x as MucNt).q === 'string') as MucNt[]) : [])
/** Kim cương: phiên đã kết thúc (vỡ đủ ống hoặc đủ câu) ⇒ lệnh `answer` từ chối câu mới. */
export const kimCuongDaXong = (s: PhienNt): boolean => s.kimCuong === 1 && trangThaiKimCuong(docNt(s.nt).map((x) => x.d === 1)).xong

/** Chuỗi đúng mang qua các bài TRONG NGÀY (hồ sơ game). */
export interface NtChuoi { n: string; c: number }
export const chuoiTruocTuHoSo = (v: unknown, ngay: string): number => {
  const x = v as NtChuoi | undefined
  return x && x.n === ngay ? Math.max(0, Math.floor(Number(x.c) || 0)) : 0
}

/** Đo của lượt ⇒ «câu không được tính» (Mức làm Bấm vội / treo máy) — đúng hàm của hệ Mức làm. */
export const khongTinhTuDo = (d: DoLuot | null, dung: boolean): boolean =>
  !!d && cauKhongDuocTinh({ giay: d.giay, soTu: d.tu, coHinh: d.hinh === 1, phan: d.phan, dh: d.dh ?? null, treo: d.treo ?? null }, dung)

export interface VaoThuongTraLoi {
  session: PhienNt
  qid: string
  dung: boolean
  hoTro: boolean
  /** Mức làm vội / treo, hoặc lượt lướt (OMNI) */
  khongTinh: boolean
  cau: { sao?: unknown; mucDo?: unknown }
  chuoiTruoc: number
  giay: number | null
  nowMs: number
}

export interface RaThuongTraLoi {
  thuong: ThuongCau
  /** Nguyên tử thêm cho khoản sổ của câu này (Hoàn hảo, ở câu cuối) */
  thuongBai: number
  nt: MucNt[]
  ketBai?: KetBaiNguyenTu
  kimCuong?: { ongCon: number; xong?: boolean; dat?: boolean }
}

/** Hàm thuần: nguyên tử câu này + (nếu là câu cuối) kết bài + trạng thái Kim cương. */
export function tinhThuongTraLoi(v: VaoThuongTraLoi): RaThuongTraLoi {
  const ref = v.session.questions.find((x) => x.qid === v.qid)
  const lamLai = !!ref?.lamLaiCuoi
  const cauKho = laCauKho(v.cau)
  // Câu làm lại luôn «có hỗ trợ» ở máy chủ của Code app 4 — luật thưởng riêng (3), không xét hỗ trợ.
  const thuong = nguyenTuCau({ dung: v.dung, hoTro: v.hoTro && !lamLai, khongTinh: v.khongTinh, cauKho, chuoiTruoc: v.chuoiTruoc, lamLai })
  const cu = docNt(v.session.nt).filter((x) => x.q !== v.qid)
  const moi: MucNt = { q: v.qid, n: thuong.nguyenTu, d: v.dung ? 1 : 0, h: v.hoTro ? 1 : 0, t: thuong.tinh ? 1 : 0, k: cauKho ? 1 : 0, c: thuong.chuoiDung, g: Math.max(0, Math.round(Number(v.giay) || 0)), ...(lamLai ? { l: 1 as const } : {}) }
  const nt = [...cu, moi]
  const ra: RaThuongTraLoi = { thuong, thuongBai: 0, nt }
  let xongBai = false
  if (v.session.kimCuong === 1) {
    const t = trangThaiKimCuong(nt.map((x) => x.d === 1), v.session.questions.length)
    ra.kimCuong = { ongCon: t.ongCon, ...(t.xong ? { xong: true, dat: t.dat } : {}) }
    xongBai = t.xong
  } else {
    const da = new Set(nt.map((x) => x.q))
    xongBai = v.session.questions.length > 0 && v.session.questions.every((x) => da.has(x.qid))
  }
  if (xongBai) {
    const cauBai: CauCuaBai[] = nt.map((x) => ({
      dung: x.d === 1, hoTro: x.h === 1 || x.l === 1,
      thuong: { tinh: x.t === 1, nguyenTu: x.n, dong: dongTuMuc(x), chuoiDung: x.c, cauKho: x.k === 1 },
    }))
    const giayDo = nt.reduce((s, x) => s + x.g, 0)
    const giay = giayDo > 0 ? giayDo : Math.max(0, Math.round((v.nowMs - (Number(v.session.created) || v.nowMs)) / 1000))
    ra.ketBai = ketBaiNguyenTu(cauBai, giay)
    if (ra.ketBai.hoanHao) ra.thuongBai = NT_HOAN_HAO
  }
  return ra
}

/** Dựng lại các dòng thưởng của một câu đã lưu gọn (đủ để gom nhóm kết bài). */
function dongTuMuc(x: MucNt): { nhan: string; so: number }[] {
  if (x.t !== 1) return []
  if (x.d !== 1) return [{ nhan: 'Làm nghiêm túc', so: x.n }]
  if (x.l === 1) return [{ nhan: 'Làm lại đúng', so: x.n }]
  if (x.h === 1) return [{ nhan: 'Đúng có hỗ trợ', so: x.n }]
  return nguyenTuCau({ dung: true, hoTro: false, khongTinh: false, cauKho: x.k === 1, chuoiTruoc: Math.max(0, x.c - 1) }).dong
}

/**
 * Các câu GHI/ĐỌC thêm vào CUỐI lô chấm (mọi câu ghi gác `EXISTS` bản chấm vừa chèn — bản chấm thua CAS thì không ghi gì). Câu CUỐI luôn là câu đọc mục tiêu
 * ngày khi bài vừa xong. Trả cả hàm đọc kết quả.
 */
export function lenhThuongTraLoi(env: Env, x: { sbd: string; phien: string; receipt: string; ngay: string; luc: string; nowMs: number; ra: RaThuongTraLoi; chuyenDe?: string }): {
  lenh: D1PreparedStatement[]; mucTieuTu(kq: readonly { results?: unknown[] }[]): { daXong: number; can: number } | null
} {
  const { sbd, phien, receipt, ngay, luc, ra } = x
  const dk = 'EXISTS (SELECT 1 FROM game_v2_attempt WHERE id = ?)'
  const lenh: D1PreparedStatement[] = [
    env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.nt', json(?)) WHERE id = ? AND sbd = ? AND ${dk}`).bind(JSON.stringify(ra.nt), phien, sbd, receipt),
  ]
  const kc = ra.kimCuong
  if (kc && x.chuyenDe) {
    if (kc.xong) {
      lenh.push(env.DB.prepare(`UPDATE kim_cuong_phien SET ket_qua = ?, xong_luc = ?, ong_con = ? WHERE id = ? AND em = ? AND ket_qua IS NULL AND ${dk}`)
        .bind(kc.dat ? 'dat' : 'truot', x.nowMs, kc.ongCon, phien, sbd, receipt))
      if (kc.dat) {
        // +40 một lần MỖI chuyên đề (khoá theo chuyên đề) — chỉ khi câu chốt phiên ngay trên vừa đổi đúng một dòng.
        lenh.push(lenhCongTinhThe(env, sbd, { khoa: `tt|kc|${x.chuyenDe}`, so: TT_KIM_CUONG, maMon: MA_TT.kimCuong, luc }, { sql: 'changes() = 1', tham: [] }))
        lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO huy_hieu_em(em, ma, ngay, du_lieu, luc) SELECT ?, ?, ?, ?, ? WHERE ${dk}`)
          .bind(sbd, `kc|${x.chuyenDe}`, ngay, JSON.stringify({ chuyenDe: x.chuyenDe }), luc, receipt))
        lenh.push(env.DB.prepare(`INSERT OR IGNORE INTO thong_bao_thuong(em, ma, loai, du_lieu, luc) SELECT ?, ?, 'huy_hieu', ?, ? WHERE ${dk}`)
          .bind(sbd, `huy_hieu|kc|${x.chuyenDe}`, JSON.stringify({ ma: `kc|${x.chuyenDe}`, tinhThe: TT_KIM_CUONG }), luc, receipt))
      }
    } else {
      lenh.push(env.DB.prepare(`UPDATE kim_cuong_phien SET ong_con = ? WHERE id = ? AND em = ? AND ket_qua IS NULL AND ${dk}`).bind(kc.ongCon, phien, sbd, receipt))
    }
  }
  const kb = ra.ketBai
  if (!kb) return { lenh, mucTieuTu: () => null }
  lenh.push(env.DB.prepare(`INSERT INTO thuong_bai_xong(em, phien, ngay, so_cau, so_dung, chuoi_max, kho_dung, hoan_hao, nguyen_tu, luc) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE ${dk}
      ON CONFLICT(em, phien) DO UPDATE SET so_cau = excluded.so_cau, so_dung = excluded.so_dung, chuoi_max = MAX(chuoi_max, excluded.chuoi_max), kho_dung = excluded.kho_dung,
        hoan_hao = MAX(hoan_hao, excluded.hoan_hao), nguyen_tu = excluded.nguyen_tu`)
    .bind(sbd, phien, ngay, kb.soCau, kb.soDung, kb.chuoiMax, kb.khoDung, kb.hoanHao ? 1 : 0, kb.tong, luc, receipt))
  lenh.push(env.DB.prepare(`SELECT (SELECT COUNT(*) FROM thuong_bai_xong WHERE em = ? AND ngay = ?) AS da, (SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd = ? AND ngay = ?) AS muc`)
    .bind(sbd, ngay, sbd, ngay))
  return {
    lenh,
    mucTieuTu(kq) {
      const r = (kq[kq.length - 1]?.results?.[0] ?? null) as { da?: unknown; muc?: unknown } | null
      if (!r) return null
      return { daXong: Number(r.da) || 0, can: mucTieuBai(r.muc === null || r.muc === undefined ? null : Number(r.muc)) }
    },
  }
}
