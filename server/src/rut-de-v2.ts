// RÚT ĐỀ CA KIỂM TRA v2 (02/10) — PHẦN MÁY CHỦ.
//   · `/ca/chot-bat-dau` (thầy): ghi MỐC BẮT ĐẦU và BẢN ĐỒ ĐỀ RIÊNG trong CÙNG một câu UPDATE ⇒ không còn khoảng giữa "đã bắt đầu mà
//     chưa có bản đồ" (đường cũ: `batDauThi` ghi mốc trước, `/ca/day chiMoc` đẩy bản đồ sau — em vào đúng khe ấy nhận bộ cắt theo băm).
//   · `/ca/loi-den-han` (thầy): lỗi đến hạn + câu đúng chưa kiểm chứng của từng em (hàng chữa lỗi `docHoSo2`: `loiV2`, `songSinhCho`),
//     kèm câu song sinh dựng sẵn (đáp án chỉ ở máy THẦY) và các câu em đã gặp — máy thầy chạy thử thang lấp bằng chúng.
//   · `lapBoChoEmVaoMuon`: `/vao-thi` của ca đề riêng mà bản đồ chưa có em ⇒ lấp riêng NGAY trên máy chủ bằng đúng thang lấp
//     (src/lib/rut-de-v2.ts) và gộp vào bản đồ bằng MỘT câu `json_patch` — không cắt theo băm im lặng.
import type { Env } from './kieu'
import { docHoSo2, type HoSo2 } from './srs2-d1'
import { ngayVn } from './su-kien-hoc'
import { xoaDemCaBaoVe } from './game-v2-bank'
import { xoaDemPhongCho } from './phong-cho-dong-thoi'
import { docKeyBankDem } from './dem-ca-thi'
import { khoTuNguon, rutDeV2, banDoTuKetQua, type HoSoEmV2, type LoiEmV2, type NguonV2, type PhanV2 } from '../../src/lib/rut-de-v2'

type Obj = Record<string, unknown>
const chuoi = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim())
const laNgay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
/** SBD đi thẳng vào đường dẫn JSON `$."<sbd>"` được (cùng luật `docCaVaoThi`). */
const SBD_DUONG_JSON = /^[A-Za-z0-9_-]{1,64}$/
/** Tối đa em mỗi lượt `/ca/loi-den-han` (mỗi em ~10 truy vấn hồ sơ — giữ dưới trần truy vấn một lệnh Worker). */
export const TOI_DA_EM_MOT_LUOT = 20
/** Câu em đã gặp: chỉ nhìn lại 365 ngày. */
const NGAY_NHIN_LAI = 365

// ---------------------------------------------------------------- /ca/chot-bat-dau

/** THẦY BẤM BẮT ĐẦU — CHỐT MỘT LỆNH. Ca đã bắt đầu ⇒ trả lỗi `da_bat_dau` (giữ mốc và bản đồ lần đầu, không ghi đè). */
export async function chotBatDau(env: Env, b: Obj): Promise<Obj> {
  const maCa = chuoi(b.maCa)
  if (!maCa) return { ok: false, error: 'Thiếu mã ca' }
  const dongBoGio = b.dongBoGio
  if (dongBoGio !== undefined && dongBoGio !== null && typeof dongBoGio !== 'boolean') return { ok: false, error: 'Lựa chọn đồng bộ giờ không hợp lệ' }
  const bo = b.boTheoEm
  if (bo !== undefined && bo !== null && (typeof bo !== 'object' || Array.isArray(bo))) return { ok: false, error: 'Bản đồ đề riêng sai khuôn' }
  const doc = () =>
    env.DB.prepare(
      `SELECT trang_thai, bat_dau_thi_luc, de_rieng, phong_cho, loai, dong_bo_gio,
              CASE WHEN bo_theo_em_json IS NULL OR bo_theo_em_json = '' THEN 0 ELSE 1 END AS co_bo
         FROM ca WHERE ma_ca = ?`,
    ).bind(maCa).first<Obj>()
  const ca = await doc()
  if (!ca) return { ok: false, error: 'Không tìm thấy ca kiểm tra' }
  const canBoTheoEm = Number(ca.de_rieng ?? 0) === 1
  const daBat = (c: Obj) => ({ ok: false, chot: true, lyDo: 'da_bat_dau', batDauLuc: chuoi(c.bat_dau_thi_luc), canBoTheoEm, coBoTheoEm: Number(c.co_bo) === 1, dongBoGio: Number(c.dong_bo_gio) === 1 })
  if (ca.trang_thai === 'dong' || ca.trang_thai === 'da_xoa') return { ok: false, error: 'Ca đã đóng hoặc đã xoá' }
  if (chuoi(ca.bat_dau_thi_luc)) return daBat(ca)
  if (dongBoGio === true && (Number(ca.phong_cho) !== 1 || ca.loai === 'baitap')) return { ok: false, error: 'Đồng bộ giờ chỉ áp dụng cho ca thi có phòng chờ' }
  const boJson = bo && typeof bo === 'object' ? JSON.stringify(bo) : null
  const luc = new Date().toISOString()
  const gio = (typeof dongBoGio === 'boolean' ? dongBoGio : Number(ca.dong_bo_gio) === 1) ? 1 : 0
  // MỘT câu: mốc + bản đồ cùng đi hoặc cùng không. Điều kiện "chưa bắt đầu" nằm trong WHERE ⇒ hai máy cùng bấm chỉ một máy thắng.
  const r = await env.DB.prepare(
    `UPDATE ca SET bat_dau_thi_luc = ?, bo_theo_em_json = COALESCE(?, bo_theo_em_json), dong_bo_gio = ?, cap_nhat_luc = ?
      WHERE ma_ca = ? AND (bat_dau_thi_luc IS NULL OR bat_dau_thi_luc = '') AND trang_thai NOT IN ('dong','da_xoa')`,
  ).bind(luc, boJson, gio, luc, maCa).run()
  xoaDemCaBaoVe(); xoaDemPhongCho(env) // ghi bảng `ca` ⇒ bỏ đệm bảo vệ/phòng chờ ngay (như `batDauThi`)
  if (Number(r.meta?.changes ?? 0) === 0) {
    const sau = await doc()
    if (sau && chuoi(sau.bat_dau_thi_luc)) return daBat(sau)
    return { ok: false, error: 'Ca vừa thay đổi. Thầy tải lại ca rồi thử lại.' }
  }
  return { ok: true, chot: true, batDauLuc: luc, daBatTruoc: false, canBoTheoEm, coBoTheoEm: !!boJson || Number(ca.co_bo) === 1, dongBoGio: gio === 1 }
}

// ---------------------------------------------------------------- hồ sơ lỗi theo em

export const chuanMucDo = (v: unknown): string => {
  const s = chuoi(v).toLowerCase()
  if (['biet', 'nb', 'nhan_biet', 'nhận biết'].includes(s)) return 'biet'
  if (['hieu', 'th', 'thong_hieu', 'thông hiểu'].includes(s)) return 'hieu'
  if (['van_dung', 'vd', 'vdc', 'van_dung_cao', 'vận dụng'].includes(s)) return 'van_dung'
  return ''
}
const chuanPhan = (v: unknown): PhanV2 | undefined => (v === 'I' || v === 'II' || v === 'III' ? v : undefined)

/** Câu song sinh dựng thành câu đề (CÓ đáp án — chỉ đi về máy thầy / kho đáp án của ca). Phần I: 4 phương án; Phần III: giá trị đúng. */
export interface CauSongSinhRa { id: string; phan: PhanV2; text: string; choices?: string[]; correct: string }

/** Lỗi dùng được của một em từ hồ sơ hàng chữa lỗi: mọi lỗi CÒN VIỆC (có hạn) + meta câu gốc + câu song sinh lượt tới. */
export function loiTuHoSo(hs: HoSo2): (LoiEmV2 & { cauSongSinh?: CauSongSinhRa })[] {
  const ra: (LoiEmV2 & { cauSongSinh?: CauSongSinhRa })[] = []
  for (const [qid, k] of hs.loiV2 ?? []) {
    if (k.trangThai === 'khong_loi' || !k.denHan) continue
    const m = hs.meta.get(qid)
    if (m?.tuLuan) continue // không bao giờ rút câu tự luận
    const phan = chuanPhan(m?.phan)
    const ssK = hs.songSinhCho?.get(qid)
    const ss = ssK !== undefined ? hs.boTro?.get(qid)?.songSinh?.[ssK] : undefined
    let cauSongSinh: CauSongSinhRa | undefined
    if (ss && phan === 'I' && ss.pa && ['A', 'B', 'C', 'D'].every((x) => typeof ss.pa?.[x] === 'string') && /^[ABCD]$/.test(chuoi(ss.dap_an))) {
      cauSongSinh = { id: `${qid}~ss${ssK}`, phan, text: ss.de, choices: ['A', 'B', 'C', 'D'].map((x) => String(ss.pa![x])), correct: chuoi(ss.dap_an) }
    } else if (ss && phan === 'III' && /^-?\d+(,\d+)?$/.test(chuoi(ss.dap_an))) {
      // Đáp án chấm = `dap_an` ĐÃ làm tròn theo câu làm tròn của đề song sinh (dấu phẩy) — KHÔNG phải `gia_tri_dung` (giá trị chính xác
      // chưa làm tròn, dấu chấm, vd "1086.8421052632": em ghi 1086,8 đúng yêu cầu đề sẽ bị chấm sai).
      cauSongSinh = { id: `${qid}~ss${ssK}`, phan, text: ss.de, correct: chuoi(ss.dap_an) }
    }
    ra.push({
      qid,
      denHan: k.denHan,
      trangThai: k.trangThai,
      nenSongSinh: k.nenSongSinh,
      ...(ssK !== undefined ? { songSinh: ssK } : {}),
      ...(phan ? { phan } : {}),
      ...(m ? { mucDo: chuanMucDo(m.mucDo), dang: chuoi(m.dang) } : {}),
      ...(cauSongSinh ? { cauSongSinh } : {}),
    })
  }
  return ra
}

/** Câu em đã gặp (mọi kênh) — sbd → qid → ngày VN gần nhất. MỘT truy vấn cho cả lô. `qids` (tuỳ chọn) bó về các câu đang xét. */
export async function docDaGap(env: Env, dsSbd: readonly string[], ngay: string, qids?: readonly string[] | null): Promise<Record<string, Record<string, string>>> {
  const ra: Record<string, Record<string, string>> = {}
  if (dsSbd.length === 0) return ra
  const tu = new Date(Date.parse(`${ngay}T00:00:00Z`) - NGAY_NHIN_LAI * 86_400_000).toISOString().slice(0, 10)
  const locQid = qids && qids.length > 0
  const r = await env.DB.prepare(
    `SELECT sbd, qid, MAX(ngay_vn) AS ngay FROM su_kien_hoc
      WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ?${locQid ? ' AND qid IN (SELECT value FROM json_each(?))' : ''}
      GROUP BY sbd, qid`,
  ).bind(JSON.stringify(dsSbd), tu, ...(locQid ? [JSON.stringify(qids)] : [])).all<Obj>().catch(() => ({ results: [] as Obj[] }))
  for (const x of r.results ?? []) {
    const s = chuoi(x.sbd)
    ;(ra[s] ??= {})[chuoi(x.qid)] = chuoi(x.ngay)
  }
  return ra
}

/** `/ca/loi-den-han` {sbd:[...], ngay?, qids?} → {em: {sbd: [{qid, denHan, trangThai, ...}]}, daGap: {sbd: {qid: ngày}}}. */
export async function loiDenHan(env: Env, b: Obj): Promise<Obj> {
  const ds = [...new Set((Array.isArray(b.sbd) ? b.sbd : []).map(chuoi).filter(Boolean))]
  if (ds.length === 0) return { ok: true, em: {}, daGap: {} }
  if (ds.length > TOI_DA_EM_MOT_LUOT) return { ok: false, error: `Tối đa ${TOI_DA_EM_MOT_LUOT} em mỗi lượt` }
  const ngay = laNgay(b.ngay) ? b.ngay : ngayVn(Date.now())
  const qids = Array.isArray(b.qids) ? b.qids.map(chuoi).filter(Boolean) : null
  const em: Record<string, ReturnType<typeof loiTuHoSo>> = {}
  const hong: string[] = []
  await Promise.all(ds.map(async (sbd) => {
    try {
      em[sbd] = loiTuHoSo(await docHoSo2(env, sbd, ngay))
    } catch {
      hong.push(sbd) // KHÔNG nuốt: máy thầy báo em nào chưa đọc được hồ sơ
    }
  }))
  // Câu đã gặp: bó về kho ca + câu gốc của lỗi + câu song sinh (luật "lý thuyết quay lại sau 30 ngày" cần đúng các câu ấy).
  const loc = qids ? [...new Set([...qids, ...Object.values(em).flatMap((x) => x.flatMap((l) => [l.qid, `${l.qid}~ss0`, `${l.qid}~ss1`]))])] : null
  const daGap = await docDaGap(env, ds, ngay, loc)
  return { ok: true, ngay, em, daGap, ...(hong.length ? { hong: hong.sort() } : {}) }
}

// ---------------------------------------------------------------- /vao-thi: lấp riêng cho em vào sau

/** Em vào phòng sau khi chốt (bản đồ chưa có em) ⇒ rút bằng thang lấp ngay tại đây và GỘP vào bản đồ (một câu `json_patch`,
 * chỉ khi bản đồ chưa có em và đang ở dạng mới). Thiếu dữ liệu (không có kho đáp án / số câu) ⇒ `null` — chỗ gọi quyết định. */
export async function lapBoChoEmVaoMuon(env: Env, maCa: string, sbd: string, soCauJson: unknown, nowMs: number): Promise<Obj | null> {
  if (!SBD_DUONG_JSON.test(sbd) || !env.DE) return null
  let sc: Record<PhanV2, number>
  try {
    const x = JSON.parse(chuoi(soCauJson) || 'null') as Obj | null
    sc = { I: Math.max(0, Number(x?.I) || 0), II: Math.max(0, Number(x?.II) || 0), III: Math.max(0, Number(x?.III) || 0) }
  } catch {
    return null
  }
  if (sc.I + sc.II + sc.III === 0) return null
  const key = (await docKeyBankDem(env, maCa).catch(() => ({ giaTri: null }))).giaTri as NguonV2 | null
  if (!key || typeof key !== 'object') return null
  const kho = khoTuNguon([key])
  if (kho.length === 0) return null
  const ngay = ngayVn(nowMs)
  const [hs, daGap, caRow] = await Promise.all([
    docHoSo2(env, sbd, ngay).catch(() => null),
    docDaGap(env, [sbd], ngay, null).catch(() => ({} as Record<string, Record<string, string>>)),
    env.DB.prepare('SELECT len_bang, de_rieng FROM ca WHERE ma_ca = ?').bind(maCa).first<Obj>().catch(() => null),
  ])
  const hoSo: HoSoEmV2 = { loi: hs ? loiTuHoSo(hs) : [], daGap: daGap[sbd] ?? {} }
  // Ca "Kiểm tra điểm yếu" = ca đề riêng mở ở chế độ lên bảng (KhoiRutDe 02/10).
  const cheDo = Number(caRow?.de_rieng ?? 0) === 1 && Number(caRow?.len_bang ?? 0) === 1 ? 'diem_yeu' : 'ca'
  const kq = rutDeV2({ kho, soCau: sc, dsSbd: [sbd], hoSo: { [sbd]: hoSo }, ngay, cheDo, seed: maCa })
  const bd = banDoTuKetQua(kq)
  const bo = bd.bo[sbd]
  if (!bo || bo.length === 0) return null
  const patch = { bo: { [sbd]: bo }, lap: { [sbd]: bd.lap[sbd] ?? [] }, bac: { [sbd]: bd.bac[sbd] ?? {} } }
  const duong = `$.bo."${sbd}"`
  const r = await env.DB.prepare(
    `UPDATE ca SET bo_theo_em_json = json_patch(CASE WHEN bo_theo_em_json IS NULL OR bo_theo_em_json = '' THEN '{}' ELSE bo_theo_em_json END, ?), cap_nhat_luc = ?
      WHERE ma_ca = ? AND (bo_theo_em_json IS NULL OR bo_theo_em_json = ''
        OR (json_valid(bo_theo_em_json) AND json_type(bo_theo_em_json, '$.bo') = 'object' AND json_type(bo_theo_em_json, ?) IS NULL))`,
  ).bind(JSON.stringify(patch), new Date(nowMs).toISOString(), maCa, duong).run()
  if (Number(r.meta?.changes ?? 0) === 0) {
    // Lượt khác của CHÍNH em vừa ghi trước ⇒ dùng đúng bộ đã ghi (máy thầy chấm theo nó).
    const co = await env.DB.prepare(`SELECT json_extract(bo_theo_em_json, ?) AS bo, json_extract(bo_theo_em_json, ?) AS lap FROM ca WHERE ma_ca = ? AND json_valid(bo_theo_em_json)`)
      .bind(duong, `$.lap."${sbd}"`, maCa).first<Obj>().catch(() => null)
    const daCo = co?.bo ? (JSON.parse(String(co.bo)) as unknown) : null
    if (!Array.isArray(daCo) || daCo.length === 0) return null
    return { bo: { [sbd]: daCo }, lap: co?.lap ? { [sbd]: JSON.parse(String(co.lap)) as unknown } : {}, dem: {}, bb: null }
  }
  xoaDemCaBaoVe()
  return { bo: { [sbd]: bo }, lap: bd.lap[sbd] ? { [sbd]: bd.lap[sbd] } : {}, dem: {}, bb: null }
}
