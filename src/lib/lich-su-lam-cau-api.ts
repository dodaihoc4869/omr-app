// LỚP NỐI "LỊCH SỬ LÀM CÂU CỦA MỘT EM" của app thầy (thầy 09/10 khuya: "bấm vào từng học sinh hiển thị rõ toàn bộ lịch sử, câu làm sai số giây
// làm mỗi câu, mọi thứ về học sinh đó"). Chỉ tệp này biết lệnh máy chủ `POST /gv/lich-su-lam-cau {sbd, gioiHan?}`; hình dạng trả về là hợp đồng
// dùng chung `server/src/lich-su-lam-cau-kieu.ts` (làn máy chủ viết lệnh, app CHỈ ĐỌC). Không ném lỗi: trả `KetQuaLenh` với MỘT câu nói thật.
// Trường thiếu / sai kiểu ⇒ bỏ dòng ấy (không bịa số); thiếu cả khung ⇒ "không đọc được".
import { goiLenh, type KetQuaLenh } from './goi-lenh-thay'
import type { CauEmSai, KetQuaLichSuLamCau, LanLamCau, NguonGiay, TongLichSuLamCau } from '../../server/src/lich-su-lam-cau-kieu'

export type { CauEmSai, KetQuaLichSuLamCau, LanLamCau, NguonGiay, TongLichSuLamCau }

export const DUONG_LICH_SU_LAM_CAU = '/gv/lich-su-lam-cau'
/** Trần số lượt máy chủ chịu trả trong `lan` (hợp đồng: mặc định 1000, trần 2000). */
export const TRAN_GIOI_HAN = 2000
const CHU_CHUA_CO_LENH = 'Máy chủ chưa có lệnh Lịch sử làm câu — cần đẩy bản máy chủ mới.'

const so = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)
const chu = (x: unknown): string => (typeof x === 'string' ? x : '')
const nguon = (x: unknown): NguonGiay => (x === 'do' || x === 'uoc' ? x : null)

function docLan(x: unknown): LanLamCau | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.qid !== 'string' || typeof o.luc !== 'string') return null
  const giay = so(o.giay)
  return {
    luc: o.luc,
    ngay: chu(o.ngay),
    qid: o.qid,
    tieuDe: chu(o.tieuDe),
    mucDo: chu(o.mucDo),
    noi: chu(o.noi),
    dung: o.dung === true ? true : o.dung === false ? false : null,
    chon: typeof o.chon === 'string' && o.chon ? o.chon : null,
    giay: giay !== null && giay > 0 ? Math.round(giay) : null,
    // Không có số giây ⇒ không có nguồn (không ghi "đo thật" cho một ô trống).
    nguonGiay: giay !== null && giay > 0 ? nguon(o.nguonGiay) : null,
    coGoiY: o.coGoiY === true,
  }
}

function docCauSai(x: unknown): CauEmSai | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.qid !== 'string') return null
  return {
    qid: o.qid,
    tieuDe: chu(o.tieuDe),
    mucDo: chu(o.mucDo),
    soLan: so(o.soLan) ?? 0,
    soSai: so(o.soSai) ?? 0,
    soDung: so(o.soDung) ?? 0,
    lanCuoiDung: o.lanCuoiDung === true,
    lanCuoi: chu(o.lanCuoi),
    giaySai: Array.isArray(o.giaySai) ? o.giaySai.map((g) => (so(g) !== null && (g as number) > 0 ? Math.round(g as number) : null)) : [],
  }
}

/** Đọc trả lời của máy chủ thành đúng hợp đồng; thiếu khung (em/tong/lan/cauSai) ⇒ null. Thuần — test gọi thẳng. */
export function docLichSuLamCau(du: Record<string, unknown>): KetQuaLichSuLamCau | null {
  const em = du.em as Record<string, unknown> | undefined
  const tong = du.tong as Record<string, unknown> | undefined
  if (!em || typeof em !== 'object' || !tong || typeof tong !== 'object' || !Array.isArray(du.lan) || !Array.isArray(du.cauSai)) return null
  return {
    ok: true,
    em: { sbd: chu(em.sbd), hoTen: chu(em.hoTen), lop: chu(em.lop) },
    tong: {
      soLuot: so(tong.soLuot) ?? 0,
      soDung: so(tong.soDung) ?? 0,
      soSai: so(tong.soSai) ?? 0,
      soBoTrong: so(tong.soBoTrong) ?? 0,
      soCau: so(tong.soCau) ?? 0,
      soCauSai: so(tong.soCauSai) ?? 0,
      giayTb: so(tong.giayTb),
      tongGiay: so(tong.tongGiay) ?? 0,
    },
    lan: du.lan.map(docLan).filter((l): l is LanLamCau => l !== null),
    cauSai: du.cauSai.map(docCauSai).filter((c): c is CauEmSai => c !== null),
    conNua: du.conNua === true,
    catBot: du.catBot === true,
  }
}

/** Lịch sử làm câu của một em — lệnh thầy CHỈ ĐỌC. `gioiHan` = số lượt mới nhất muốn nhận trong `lan` (vắng ⇒ máy chủ mặc định 1000). */
export async function layLichSuLamCau(sbd: string, gioiHan?: number): Promise<KetQuaLenh<KetQuaLichSuLamCau>> {
  const body: Record<string, unknown> = { sbd }
  if (gioiHan) body.gioiHan = Math.min(TRAN_GIOI_HAN, Math.max(1, Math.round(gioiHan)))
  const r = await goiLenh(DUONG_LICH_SU_LAM_CAU, body, CHU_CHUA_CO_LENH)
  if (!r.ok) return r
  const kq = docLichSuLamCau(r.du)
  return kq ? { ok: true, du: kq } : { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả lịch sử làm câu không đúng dạng.' }
}
