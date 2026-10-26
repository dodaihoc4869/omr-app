// BẢNG "NHỊP HỌC CỦA EM" — LỆNH HỌC SINH CHỈ ĐỌC `POST /hs/nhip-hoc {token}` (thầy 12/10 duyệt bản vẽ HS-Cham / HS-Luoi: "Ở app học sinh hiện rõ
// một bảng ngay đầu thông tin lười hay chăm chỉ trên app đầy đủ siêu đẹp và chính xác, ghi thêm 1 câu trong bảng thầy cũng thấy điều này";
// "6 ngày liền làm đủ mới thoát nhóm lười nhé"). Hợp đồng: `KetQuaNhipHocEm` (nhip-hoc-kieu.ts). App: `src/lib/nhip-hoc-em.ts`.
//
// XÁC THỰC: đúng cơ chế token học sinh sẵn có (`gameIdentity` — chữ ký + hạn + mật khẩu còn khớp; mã phụ huynh bị từ chối). SBD LẤY TỪ TOKEN,
// thân lệnh có `sbd` cũng bỏ qua ⇒ em chỉ đọc được của CHÍNH MÌNH. Không ghi, không DDL; chạy trên `envDoc` như `/hs/thi-dua-hom-nay`.
//
// CÙNG SỐ VỚI THẦY:
//   · khoảng ngày: `khoangNgay` (mốc 01/10, tới hôm nay, tối đa 62 ngày) — như `/gv/nhip-hoc`;
//   · mức / đã làm từng ngày: `ngayBaiCuaMotEm` (ĐÚNG phép tính bảng Bài hằng ngày; đọc thiếu bảng nào ⇒ null ⇒ lệnh báo lỗi, app ẩn bảng gọn —
//     không hiện số sai cho em);
//   · ngày bắt đầu tính: `docNgayVao` của `/gv/nhip-hoc` (em vào học muộn không bị tính những ngày trước khi có mặt);
//   · nhóm + mọi số: phép thuần `tomTatNhip` / `viecTiepNhip` (nhip-hoc-luat.ts) — cùng hàm app thầy dùng ở Hôm nay › Nhịp học.
// TỐC ĐỘ LÀM BÀI: số giây đã ghi trong sổ (`su_kien_hoc.giay` ⇒ `raw_json.ms`, như theo lô của `/gv/nhip-hoc`), quá nhanh = dưới 8 giây (câu tự tính
//   Phần III dưới 15 giây), mức theo `NGUONG_THAI_DO` (tín hiệu (b) của hồ sơ thầy). BỎ lượt còn giấu (`embargoed`) VÀ lượt của ca kiểm tra chưa công
//   bố / đã xoá (`SQL_LUOT_GOI7`) — % đúng của nhóm quá nhanh không được lộ kết quả ca chưa công bố. Chỉ trả SỐ ĐẾM: không mã câu, không đáp án.
// PHỤ HUYNH (12/10 đợt 16, thầy: "App ph cũng phải hiển thị lười chăm đầy đủ như app hs"): `/ph/nhip-hoc` (ph-ho-so-con.ts) gọi ĐÚNG lõi
//   `nhipHocCuaEm` sau cổng phụ huynh ⇒ cùng hợp đồng, cùng luật bảo mật như bản em.
// ĐỘ TIN CẬY (12/10 đợt 16): `doTinCay` / `canThem` của nhóm — phép thuần `tinCayNhanNgay` (thai-do-tin-cay.ts); nhóm KHÔNG đổi. Từ 13/10 đợt 18 gọi qua
//   `tinCayNhomNhip` (nhip-hoc.ts) — MỘT hàm với từng dòng em của `/gv/nhip-hoc` ⇒ thầy và em cùng một số.
import type { Env } from './kieu'
import { NGUONG_THAI_DO as NG } from './bai-hang-ngay-kieu'
import type { KetQuaNhipHocEm, TocDoNhipEm, TraLoiNhipHocEm } from './nhip-hoc-kieu'
import { khoangNgay, ngayBaiCuaMotEm } from './bai-hang-ngay'
import { docNgayVao, ngayDuocTinh, tinCayNhomNhip } from './nhip-hoc'
import { bacChamChi } from './bac-cham-chi'
import { tomTatNhip, viecTiepNhip } from './nhip-hoc-luat'
import { gameIdentity } from './game-v2-auth'
import { SQL_LUOT_GOI7 } from './goi-bai-7'
import { tachSongSinh } from './loi-hoc-luat'
import { docCauKho } from './omni-d1'
import { nhipHocChoHs, type TraLoiNhipHocHs } from './an-luoi-hs'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const so = (x: unknown): number => {
  const n = Number(x)
  return Number.isFinite(n) ? n : 0
}
const phanTram = (tu: number, mau: number): number | null => (mau > 0 ? Math.round((100 * tu) / mau) : null)

export const CAN_DANG_NHAP_NHIP = 'Em đăng nhập lại để xem nhịp học.'
export const LOI_NHIP_EM = 'Chưa tải được nhịp học của em. Em thử lại sau ít phút.'

/** Số giây một em (đã gom trong SQL): tổng lượt có số giây · lượt dưới 8 giây · lượt 8–14 giây theo câu gốc (để biết câu tự tính Phần III). */
export const SQL_GIAY_EM = `WITH r AS (
    SELECT qid, ket_qua AS kq, CAST(giay AS REAL) AS gc,
      CASE WHEN json_valid(raw_json) THEN CAST(json_extract(raw_json, '$.ms') AS REAL) END AS ms,
      CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.tc') END AS tc
    FROM su_kien_hoc
    WHERE sbd = ?1 AND ngay_vn BETWEEN ?2 AND ?3 AND ${SQL_LUOT_GOI7}
  ),
  l AS (
    SELECT COALESCE(NULLIF(tc, ''), qid) AS q, kq,
      CASE WHEN gc > 0 THEN MAX(1, ROUND(gc)) WHEN ms > 0 THEN MAX(1, ROUND(ms / 1000.0)) END AS g
    FROM r
  )
  SELECT 'tong' AS loai, '' AS q, COUNT(*) AS n, COUNT(kq) AS nkq, SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) AS nd FROM l WHERE g IS NOT NULL
  UNION ALL SELECT 'duoi8', '', COUNT(*), COUNT(kq), SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) FROM l WHERE g < ?4
  UNION ALL SELECT 'giua', q, COUNT(*), COUNT(kq), SUM(CASE WHEN kq = 1 THEN 1 ELSE 0 END) FROM l WHERE g >= ?4 AND g < ?5 GROUP BY q`

/** Mức tốc độ — ĐÚNG luật tín hiệu (b) của hồ sơ thầy (`tinhThaiDo`). Thuần. */
export function mucTocDo(soNhanh: number, soCoGiay: number, dungNhanh: number | null): TocDoNhipEm['muc'] {
  if (soCoGiay < NG.soLuotGiayToiThieu) return 'chua-du'
  const p = phanTram(soNhanh, soCoGiay)!
  if (p >= NG.nhanXau && dungNhanh !== null && dungNhanh < NG.nhanDungThap) return 'xau'
  return p >= NG.nhanChuY ? 'chu-y' : 'tot'
}

const laPhanBa = (goc: string, phanKho: string | undefined): boolean => (phanKho || /-(III|II|I)-\d+$/.exec(goc)?.[1] || '') === 'III'

/** Tốc độ làm bài của một em; đọc sổ hỏng ⇒ null (dòng tốc độ ẩn, các số khác vẫn hiện). */
async function docTocDo(env: Env, sbd: string, tu: string, den: string): Promise<TocDoNhipEm | null> {
  let r: Row[]
  try {
    r = (await env.DB.prepare(SQL_GIAY_EM).bind(sbd, tu, den, NG.giayNhanhTracNghiem, NG.giayNhanhTuTinh).all<Row>()).results ?? []
  } catch {
    return null
  }
  const giua = r.filter((x) => str(x.loai) === 'giua')
  const goc = [...new Set(giua.map((x) => tachSongSinh(str(x.q)).goc).filter(Boolean))]
  const kho = goc.length ? await docCauKho(env, goc).catch(() => new Map<string, { phan: string }>()) : new Map<string, { phan: string }>()
  let coGiay = 0, nhanh = 0, nhanhKq = 0, nhanhDung = 0, coTuTinh = false
  for (const x of r) {
    const loai = str(x.loai)
    if (loai === 'tong') coGiay = so(x.n)
    else if (loai === 'duoi8' || (loai === 'giua' && laPhanBa(tachSongSinh(str(x.q)).goc, kho.get(tachSongSinh(str(x.q)).goc)?.phan))) {
      nhanh += so(x.n)
      nhanhKq += so(x.nkq)
      nhanhDung += so(x.nd)
      if (loai === 'giua' && so(x.n) > 0) coTuTinh = true
    }
  }
  const dungNhanh = phanTram(nhanhDung, nhanhKq)
  return { soNhanh: nhanh, soCoGiay: coGiay, dungNhanh, coTuTinh, muc: mucTocDo(nhanh, coGiay, dungNhanh) }
}

/** `POST /hs/nhip-hoc {token}` — xem đầu tệp. */
export async function hsNhipHoc(env: Env, b: Row, nowMs = Date.now()): Promise<TraLoiNhipHocHs> {
  let sbd: string
  try {
    sbd = await gameIdentity(env, b)
  } catch {
    return { ok: false, error: CAN_DANG_NHAP_NHIP }
  }
  if (!sbd || sbd.length > 40) return { ok: false, error: CAN_DANG_NHAP_NHIP }
  // 26/10 (thầy: hệ phát hiện lười CHỈ thầy + phụ huynh xem): bỏ nhóm / bậc / việc tiếp / tốc độ / tin cậy khỏi bản em (an-luoi-hs.ts); không đọc tốc độ.
  return nhipHocChoHs(await nhipHocCuaEm(env, sbd, nowMs, LOI_NHIP_EM, true))
}

/**
 * LÕI bảng "Nhịp học" của MỘT em đã xác thực (12/10 đợt 16: tách để `/ph/nhip-hoc` — ph-ho-so-con.ts — trả ĐÚNG bản em thấy, không phép tính thứ hai).
 * `sbd` đã kiểm ở nơi gọi (em ⇒ token học sinh; phụ huynh ⇒ `sbdCuaPhuHuynh`). `loi` = câu báo khi đọc hỏng (em / phụ huynh xưng hô khác nhau).
 */
export async function nhipHocCuaEm(env: Env, sbd: string, nowMs: number, loi: string = LOI_NHIP_EM, boTocDo = false): Promise<TraLoiNhipHocEm> {
  // Khoảng mặc định (01/10 → hôm nay); em KHÔNG chọn được khoảng khác (bỏ `tu` / `den` của thân lệnh).
  const kh = khoangNgay({}, nowMs)
  if ('error' in kh) return { ok: false, error: loi }
  const { tu, den, homNay } = kh
  try {
    const [ngay, vaoMap, tocDo] = await Promise.all([
      ngayBaiCuaMotEm(env, sbd, tu, den, homNay),
      docNgayVao(env, [{ sbd, hoTen: sbd, lop: '', khoi: '', goi7Tu: null }], tu).catch(() => new Map<string, string>()),
      boTocDo ? Promise.resolve(null) : docTocDo(env, sbd, tu, den),
    ])
    if (!ngay) return { ok: false, error: loi }
    const vao = vaoMap.get(sbd) ?? tu
    const dai = ngayDuocTinh(ngay, vao)
    const t = tomTatNhip(dai, homNay)
    const bac = bacChamChi(dai, homNay, t)
    const kq: KetQuaNhipHocEm = {
      ok: true,
      tu: vao > den ? den : vao,
      homNay,
      nhom: t.nhom,
      soNgayQua: t.soNgayQua,
      soNgayDu: t.soNgayDu,
      phanTram: phanTram(t.soNgayDu, t.soNgayQua),
      ngay: dai,
      chuoiDuGanNhat: t.chuoiDuGanNhat,
      tongDaLam: t.tongLam + (t.homNay?.lam ?? 0),
      tongCauThieu: t.tongCauThieu,
      ngayDuGanNhat: t.ngayDuGanNhat,
      homNayMuc: t.homNay,
      chuoiBo: t.chuoiKhongLam,
      tocDo,
      viecTiep: viecTiepNhip(t),
      // CHỈ THÊM 12/10 đợt 16: độ tin cậy của nhóm — cùng phép với hồ sơ thái độ (thai-do-tin-cay.ts); nhóm vẫn do `tomTatNhip` quyết.
      ...tinCayNhomNhip(t),
      // CHỈ THÊM 13/10: bậc 1–12 + điểm chăm — cùng phép với dòng em ở `/gv/nhip-hoc`.
      ...(bac ? { bacCham: bac } : {}),
    }
    return kq
  } catch (e) {
    console.error('[nhip-hoc-em] lỗi (báo thử lại):', e instanceof Error ? e.message : e)
    return { ok: false, error: loi }
  }
}
