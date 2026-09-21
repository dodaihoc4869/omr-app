// LỆNH ĐỌC-CHỈ CHO MÀN "HÔM NAY" CỦA APP GIÁO VIÊN — `POST /ke-hoach/hom-nay-thay` (hợp đồng docs/hop-dong-gv-hom-nay-2109.md, Code 4 ↔ Code 3, 21/09).
//
// KHÔNG ghi, KHÔNG lập kế hoạch, KHÔNG sinh vé: chỉ ĐỌC `ke_hoach_ngay` (cron 00:01 và lượt mở của em đã lập), sổ, hồ sơ, cấu hình. Mọi con số truy được về một dòng D1.
// ≤ 8 truy vấn D1 (đo trong test; số truy vấn thật nằm ở trường `soTruyVan` của phản hồi). Mỗi khối bọc `try/catch` RIÊNG: khối nào không tính được thì trả `null` kèm `lyDoThieu`, KHÔNG bịa số, KHÔNG làm hỏng cả lệnh.
// Lệnh không kết luận năng lực từ điểm: "cần để ý" chỉ đưa số liệu (ngày trễ nhịp, câu tụt bậc, dạng còn yếu theo `dangYeu` của hồ sơ).
import type { Env } from './kieu'
import { quyetDinhVaoThi } from './luat-vao-thi'
import { dangYeu, type NamKtDang } from './ho-so-nam-kt'
import { TIEN_BO_NGAY, phanTichNgayNghi } from './ke-hoach-ngay-d1'
import { laDatNgay } from '../../src/lib/dat-nhiem-vu-ngay'
import { muaHienTai, tramCuaLop, SO_TRAM } from './game-v2-doan-mua'

const MOT_NGAY_MS = 86_400_000
const TOI_DA_BTVN = 6
const TOI_DA_EM_CAN_Y = 8
const TOI_DA_LOP = 4
const TOI_DA_DANG_MOI_LOP = 3
/** Trễ nhịp: số ngày (trừ ngày nghỉ) kể từ lần làm câu cuối; và số câu tụt bậc trong 3 ngày. */
export const NGUONG_TRE_NHIP_NGAY = 3
export const NGUONG_TUT_BAC_CAU = 3
export const SO_NGAY_TUT_BAC = 3

type Dong = Record<string, unknown>
const chuoi = (v: unknown): string => String(v ?? '').trim()
const so = (v: unknown): number => Number(v) || 0
const json = (v: unknown): string => JSON.stringify(v)
const ngayVn = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
const soNgay = (ngay: string): number => Math.floor(Date.parse(`${ngay}T00:00:00Z`) / MOT_NGAY_MS)
const lui = (ngay: string, n: number): string => new Date((soNgay(ngay) - n) * MOT_NGAY_MS).toISOString().slice(0, 10)
const doc = <T>(v: unknown, macDinh: T): T => {
  try { return JSON.parse(String(v)) as T } catch { return macDinh }
}

interface KeHoachHang {
  ngay: string
  sbd: string
  ketQua: string | null
  nghi: boolean
  tut: number
  nganSach: { toiThieuCau?: number } | null
  viec: { viec?: { loai?: string; hanCung?: string | null; chiTiet?: Record<string, unknown> }[]; tienBo?: { soCauToiHan?: number; treNhip?: boolean } } | null
}

/** Chạy một truy vấn; lỗi → `null` và ghi lý do (khối phụ thuộc sẽ trả null). Đếm số truy vấn để khoá trần 8. */
function khoiDo(env: Env) {
  let n = 0
  return {
    dem: () => n,
    async hoi<T>(sql: string, ...bind: unknown[]): Promise<{ rows: T[] } | null> {
      n++
      try {
        const r = await env.DB.prepare(sql).bind(...bind).all<T>()
        return { rows: r.results ?? [] }
      } catch {
        return null
      }
    },
  }
}

export async function homNayThay(env: Env, b: Record<string, unknown>, nowMs: number = Date.now()): Promise<Record<string, unknown>> {
  const ngayXin = chuoi(b.ngay)
  if (ngayXin && !/^\d{4}-\d{2}-\d{2}$/.test(ngayXin)) return { ok: false, error: 'Ngày phải có dạng YYYY-MM-DD.' }
  const ngay = ngayXin || ngayVn(nowMs)
  const homQua = lui(ngay, 1)
  const truoc2 = lui(ngay, 2)
  const Q = khoiDo(env)
  const lyDoThieu: Record<string, string> = {}

  // Truy vấn 1: học sinh + cấu hình cần đọc + mùa game (một lệnh, ba nguồn).
  const r1 = await Q.hoi<Dong>(
    `SELECT 'em' AS k, sbd AS a, ho_ten AS b, lop AS c FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'
     UNION ALL SELECT 'cfg', khoa, gia_tri, NULL FROM cau_hinh WHERE khoa IN ('ngay_nghi', 'doan_ho_tong')
     UNION ALL SELECT 'mua', key, json, NULL FROM game_v2_settings WHERE key = 'season'`,
  )
  const em = new Map<string, { hoTen: string; lop: string }>()
  const cfg = new Map<string, string>()
  let muaJson = ''
  for (const x of r1?.rows ?? []) {
    if (x.k === 'em') em.set(chuoi(x.a), { hoTen: chuoi(x.b), lop: chuoi(x.c) })
    else if (x.k === 'cfg') cfg.set(chuoi(x.a), chuoi(x.b))
    else if (x.k === 'mua') muaJson = chuoi(x.b)
  }
  const coHs = r1 !== null
  const nghi = phanTichNgayNghi(cfg.get('ngay_nghi') ?? '')
  const lopCua = (sbd: string) => em.get(sbd)?.lop ?? ''

  const soEm = coHs ? em.size : null
  const soLop = coHs ? new Set([...em.values()].map((x) => x.lop).filter(Boolean)).size : null
  if (!coHs) lyDoThieu.soEm = 'Không đọc được danh sách học sinh'

  // Truy vấn 2: ca thi đang trong giờ vào/làm.
  let caDangMo: number | null = null
  try {
    const r2 = await Q.hoi<Dong>(
      `SELECT trang_thai, loai, bat_dau, het_han_vao, thoi_gian_phut, dong_bo_gio, bat_dau_thi_luc, han_nop, pham_vi, danh_sach_chon_json
         FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi'`,
    )
    if (r2) caDangMo = r2.rows.filter((c) => quyetDinhVaoThi(c as never, null, '', nowMs).ok).length
    else lyDoThieu.caDangMo = 'Không đọc được bảng ca'
  } catch {
    lyDoThieu.caDangMo = 'Không đếm được ca đang mở'
  }

  // Truy vấn 3: kế hoạch ngày của hôm nay và hai ngày trước (JSON chỉ lấy cho hôm nay).
  const r3 = await Q.hoi<Dong>(
    `SELECT ngay, sbd, ket_qua, la_ngay_nghi, so_cau_tut_bac,
            CASE WHEN ngay = ? THEN ngan_sach_json END AS ngan_sach_json, CASE WHEN ngay = ? THEN viec_json END AS viec_json
       FROM ke_hoach_ngay WHERE ngay >= ? AND ngay <= ?`,
    ngay, ngay, truoc2, ngay,
  )
  const hang: KeHoachHang[] = (r3?.rows ?? []).map((x) => ({
    ngay: chuoi(x.ngay), sbd: chuoi(x.sbd), ketQua: x.ket_qua === null || x.ket_qua === undefined ? null : chuoi(x.ket_qua), nghi: so(x.la_ngay_nghi) === 1, tut: so(x.so_cau_tut_bac),
    nganSach: x.ngan_sach_json ? doc(x.ngan_sach_json, null) : null, viec: x.viec_json ? doc(x.viec_json, null) : null,
  }))
  const homNay = hang.filter((h) => h.ngay === ngay && !h.nghi)
  const dsHomNay = homNay.map((h) => h.sbd)

  // Truy vấn 4 và 5: tiến bộ trong ngày (đúng công thức của chotNgayCu) và ngày làm câu cuối, chỉ cho em có kế hoạch hôm nay.
  let tienBo: Map<string, { da: number; len: number; tut: number }> | null = null
  let cuoi: Map<string, string> | null = null
  if (r3 && dsHomNay.length > 0) {
    const r4 = await Q.hoi<Dong>(TIEN_BO_NGAY, json(dsHomNay), ngay)
    if (r4) tienBo = new Map(r4.rows.map((x) => [chuoi(x.sbd), { da: so(x.da_lam), len: so(x.len_bac), tut: so(x.tut_bac) }]))
    const r5 = await Q.hoi<Dong>('SELECT sbd, MAX(ngay_vn) AS cuoi FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd', json(dsHomNay))
    if (r5) cuoi = new Map(r5.rows.map((x) => [chuoi(x.sbd), chuoi(x.cuoi)]))
  }

  // Truy vấn 6: hồ sơ dạng của mọi em (dạng còn yếu theo `dangYeu` của hồ sơ).
  const r6 = coHs && em.size > 0
    ? await Q.hoi<Dong>(
      `SELECT sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?))`,
      json([...em.keys()]),
    )
    : null
  const yeuCua = new Map<string, { ma: string; soSai: number }[]>() // sbd → dạng còn yếu, sai nhiều trước
  for (const x of r6?.rows ?? []) {
    const d: NamKtDang = { sbd: chuoi(x.sbd), maDang: chuoi(x.ma_dang), soGap: so(x.so_gap), soSai: so(x.so_sai), soDaKhacPhuc: so(x.so_da_khac_phuc), soMoiSai: so(x.so_moi_sai), soChuaThaySai: so(x.so_chua_thay_sai), bac: so(x.bac), mocOnKe: x.moc_on_ke ? chuoi(x.moc_on_ke) : null, mocMoiSai: x.moc_moi_sai ? chuoi(x.moc_moi_sai) : null }
    if (!dangYeu(d, ngay)) continue
    const ds = yeuCua.get(d.sbd) ?? []
    ds.push({ ma: d.maDang, soSai: d.soSai })
    yeuCua.set(d.sbd, ds)
  }
  for (const ds of yeuCua.values()) ds.sort((a, c) => c.soSai - a.soSai || (a.ma < c.ma ? -1 : 1))

  // --- Khối nhiemVu -------------------------------------------------------------------------------------
  let nhiemVu: Record<string, unknown> | null = null
  try {
    if (!r3) lyDoThieu.nhiemVu = 'Không đọc được kế hoạch ngày'
    else if (homNay.length === 0) lyDoThieu.nhiemVu = 'Chưa có kế hoạch ngày hôm nay (cron 00:01 hoặc lượt mở của em chưa lập)'
    else if (!tienBo) lyDoThieu.nhiemVu = 'Không đọc được số câu đã làm trong ngày'
    else {
      const dat = homNay.filter((h) => {
        const tb = tienBo!.get(h.sbd) ?? { da: 0, len: 0, tut: 0 }
        const toiThieu = Number(h.nganSach?.toiThieuCau) || 4
        const coToiHan = Number(h.viec?.tienBo?.soCauToiHan) || 0
        const treNhip = h.viec?.tienBo?.treNhip === true
        return laDatNgay({ daLam: tb.da, lenBac: tb.len, toiThieu, treNhip, soCauToiHan: coToiHan })
      }).length
      const qua = hang.filter((h) => h.ngay === homQua && !h.nghi)
      const daChot = qua.filter((h) => h.ketQua !== null)
      nhiemVu = { tong: homNay.length, dat, tongHomQua: daChot.length > 0 ? qua.length : null, datHomQua: daChot.length > 0 ? qua.filter((h) => h.ketQua === 'dat').length : null }
    }
  } catch {
    nhiemVu = null
    lyDoThieu.nhiemVu = 'Không tính được nhiệm vụ hôm nay'
  }

  // --- Khối btvn ---------------------------------------------------------------------------------------
  interface BaiLo { ma: string; hang: { chiSo: number; tongLo: number; treNhip: boolean; han: string | null }[]; sbd: Set<string>; emKip: Set<string> }
  const bai = new Map<string, BaiLo>()
  const emCoLo = new Set<string>()
  const emTre = new Set<string>()
  let loi = false
  try {
    for (const h of homNay) {
      for (const v of h.viec?.viec ?? []) {
        if (v.loai !== 'btvn_lo') continue
        const ct = v.chiTiet ?? {}
        const ma = chuoi(ct.ma)
        if (!ma) continue
        const b1 = bai.get(ma) ?? { ma, hang: [], sbd: new Set(), emKip: new Set() }
        const tre = ct.treNhip === true
        b1.hang.push({ chiSo: so(ct.chiSo), tongLo: so(ct.tongLo), treNhip: tre, han: v.hanCung ?? null })
        b1.sbd.add(h.sbd)
        if (!tre) b1.emKip.add(h.sbd)
        bai.set(ma, b1)
        emCoLo.add(h.sbd)
        if (tre) emTre.add(h.sbd)
      }
    }
  } catch {
    loi = true
  }

  // --- Chọn dạng/bài cần tên, rồi truy vấn 7 (một lệnh: tên dạng + tên bài BTVN) ----------------------------
  const lopDong = new Map<string, string[]>() // lớp → sbd
  for (const [sbd, x] of em) if (x.lop) lopDong.set(x.lop, [...(lopDong.get(x.lop) ?? []), sbd])
  const lopThuTu = [...lopDong.keys()].sort((a, c) => lopDong.get(c)!.length - lopDong.get(a)!.length || (a < c ? -1 : 1)).slice(0, TOI_DA_LOP)
  const dangTheoLop = lopThuTu.map((lop) => {
    const dem = new Map<string, number>()
    for (const sbd of lopDong.get(lop)!) for (const d of yeuCua.get(sbd) ?? []) dem.set(d.ma, (dem.get(d.ma) ?? 0) + 1)
    const ds = [...dem].map(([ma, soEmYeu]) => ({ ma, soEmYeu })).sort((a, c) => c.soEmYeu - a.soEmYeu || (a.ma < c.ma ? -1 : 1)).slice(0, TOI_DA_DANG_MOI_LOP)
    return { lop, siSo: lopDong.get(lop)!.length, ds }
  })

  // canYTuong: MỘT lý do mỗi em, ưu tiên tre_nhip → tut_bac → dang_yeu.
  type CanY = { sbd: string; hoTen: string; lop: string; lyDo: 'tre_nhip' | 'tut_bac' | 'dang_yeu'; soLieu: Record<string, unknown>; sapXep: number }
  const canY: CanY[] = []
  let canYLoi = ''
  try {
    if (!r3 || homNay.length === 0) canYLoi = 'Chưa có kế hoạch ngày hôm nay để xác định em cần để ý'
    else if (!tienBo || !cuoi) canYLoi = 'Không đọc được sổ học của các em'
    else if (!r6) canYLoi = 'Không đọc được hồ sơ dạng'
    else {
      const tutBaNgay = new Map<string, number>()
      for (const h of hang) if (h.ngay < ngay) tutBaNgay.set(h.sbd, (tutBaNgay.get(h.sbd) ?? 0) + h.tut)
      for (const h of homNay) {
        const sbd = h.sbd
        const nguoi = { sbd, hoTen: em.get(sbd)?.hoTen ?? '', lop: lopCua(sbd) }
        const cuoiNgay = cuoi.get(sbd)
        if (cuoiNgay) {
          let soNgayTre = soNgay(ngay) - soNgay(cuoiNgay)
          for (let d = soNgay(cuoiNgay) + 1; d <= soNgay(ngay); d++) if (nghi.has(new Date(d * MOT_NGAY_MS).toISOString().slice(0, 10))) soNgayTre--
          if (soNgayTre >= NGUONG_TRE_NHIP_NGAY) { canY.push({ ...nguoi, lyDo: 'tre_nhip', soLieu: { ngay: soNgayTre }, sapXep: soNgayTre }); continue }
        }
        const tut = (tutBaNgay.get(sbd) ?? 0) + (tienBo.get(sbd)?.tut ?? 0)
        if (tut >= NGUONG_TUT_BAC_CAU) { canY.push({ ...nguoi, lyDo: 'tut_bac', soLieu: { soCau: tut, soNgay: SO_NGAY_TUT_BAC }, sapXep: tut }); continue }
        const yeu = yeuCua.get(sbd)?.[0]
        if (yeu) canY.push({ ...nguoi, lyDo: 'dang_yeu', soLieu: { ma: yeu.ma, ten: '', soCauSai: yeu.soSai }, sapXep: yeu.soSai })
      }
    }
  } catch {
    canYLoi = 'Không tính được danh sách em cần để ý'
  }
  const thuTuLyDo = { tre_nhip: 0, tut_bac: 1, dang_yeu: 2 } as const
  canY.sort((a, c) => thuTuLyDo[a.lyDo] - thuTuLyDo[c.lyDo] || c.sapXep - a.sapXep || (a.sbd < c.sbd ? -1 : 1))
  const dsCanY = canY.slice(0, TOI_DA_EM_CAN_Y)

  const dsDangCanTen = [...new Set([...dangTheoLop.flatMap((l) => l.ds.map((d) => d.ma)), ...dsCanY.filter((x) => x.lyDo === 'dang_yeu').map((x) => String(x.soLieu.ma))])]
  const dsBaiCanTen = [...bai.keys()]
  const ten = new Map<string, string>()
  const hanBai = new Map<string, string>()
  const tenBai = new Map<string, string>()
  if (dsDangCanTen.length > 0 || dsBaiCanTen.length > 0) {
    const r7 = await Q.hoi<Dong>(
      `SELECT 'd' AS k, dang AS a, MIN(json_extract(json, '$.tenDang')) AS b, NULL AS c FROM game_v2_question WHERE dang IN (SELECT value FROM json_each(?)) GROUP BY dang
       UNION ALL SELECT 'b', b.ma_btvn, COALESCE(NULLIF(TRIM(c.ten_ca), ''), d.ten_de, ''), b.han_nop FROM btvn b LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de
        WHERE b.ma_btvn IN (SELECT value FROM json_each(?))`,
      json(dsDangCanTen), json(dsBaiCanTen),
    )
    for (const x of r7?.rows ?? []) {
      if (x.k === 'd' && chuoi(x.b)) ten.set(chuoi(x.a), chuoi(x.b))
      if (x.k === 'b') { if (chuoi(x.b)) tenBai.set(chuoi(x.a), chuoi(x.b)); if (chuoi(x.c)) hanBai.set(chuoi(x.a), chuoi(x.c)) }
    }
  }
  const tenDang = (ma: string): string => ten.get(ma) ?? ma.replace(/^CD:/, '')

  let btvn: Record<string, unknown> | null = null
  if (!r3 || loi) lyDoThieu.btvn = 'Không đọc được kế hoạch ngày để lấy tiến độ lô BTVN'
  else if (homNay.length === 0) lyDoThieu.btvn = 'Chưa có kế hoạch ngày hôm nay'
  else {
    try {
      const dangChay = [...bai.values()].map((b1) => {
        const chiSoCo = new Map<number, number>()
        for (const h of b1.hang) chiSoCo.set(h.chiSo, (chiSoCo.get(h.chiSo) ?? 0) + 1)
        const loHienTai = [...chiSoCo].sort((a, c) => c[1] - a[1] || c[0] - a[0])[0]![0] + 1 // lô nhiều em đang ở nhất (0-based → hiển thị 1-based); hoà thì lô sau
        const hanDs = [hanBai.get(b1.ma), ...b1.hang.map((h) => h.han)].filter((x): x is string => !!x).sort()
        const lop = new Map<string, number>()
        for (const sbd of b1.sbd) lop.set(lopCua(sbd), (lop.get(lopCua(sbd)) ?? 0) + 1)
        const lopChinh = [...lop].sort((a, c) => c[1] - a[1] || (a[0] < c[0] ? -1 : 1))[0]?.[0] ?? ''
        return { ma: b1.ma, ten: tenBai.get(b1.ma) ?? b1.ma, lop: lopChinh, soEm: b1.sbd.size, loHienTai, tongLo: Math.max(...b1.hang.map((h) => h.tongLo)), soEmKip: b1.emKip.size, han: hanDs[0] ?? null }
      }).sort((a, c) => (a.han ?? '9999') < (c.han ?? '9999') ? -1 : (a.han ?? '9999') > (c.han ?? '9999') ? 1 : a.ma < c.ma ? -1 : 1).slice(0, TOI_DA_BTVN)
      btvn = { soEmCoLo: emCoLo.size, soEmDungNhip: [...emCoLo].filter((s) => !emTre.has(s)).length, dangChay }
    } catch {
      btvn = null
      lyDoThieu.btvn = 'Không tính được tiến độ lô BTVN'
    }
  }

  // --- Khối canYTuong ----------------------------------------------------------------------------------
  let canYTuong: Record<string, unknown> | null = null
  if (canYLoi) lyDoThieu.canYTuong = canYLoi
  else {
    canYTuong = {
      tong: canY.length,
      ds: dsCanY.map((x) => ({ sbd: x.sbd, hoTen: x.hoTen, lop: x.lop, lyDo: x.lyDo, soLieu: x.lyDo === 'dang_yeu' ? { ...x.soLieu, ten: tenDang(String(x.soLieu.ma)) } : x.soLieu })),
    }
  }

  // --- Khối dangYeu (theo lớp) -------------------------------------------------------------------------
  let dangYeuLop: unknown[] | null = null
  if (!coHs) lyDoThieu.dangYeu = 'Không đọc được danh sách học sinh'
  else if (!r6) lyDoThieu.dangYeu = 'Không đọc được hồ sơ dạng'
  else dangYeuLop = dangTheoLop.map((l) => ({ lop: l.lop, siSo: l.siSo, dang: l.ds.map((d) => ({ ma: d.ma, ten: tenDang(d.ma), soEmYeu: d.soEmYeu })) }))

  // --- Khối doan: CHỈ khi cờ `doan_ho_tong` bật (tắt không phải lỗi) -----------------------------------------
  let doan: Record<string, unknown> | null = null
  try {
    const co = chuoi(cfg.get('doan_ho_tong'))
    const o = co ? doc<{ dsSbd?: unknown; toanBo?: unknown }>(co, {}) : {}
    const dsMo = Array.isArray(o.dsSbd) ? o.dsSbd.map((x) => chuoi(x)) : []
    if (o.toanBo !== true && dsMo.length === 0) {
      // cờ tắt: doan = null, không ghi lyDoThieu (không phải lỗi)
    } else if (!coHs) lyDoThieu.doan = 'Không đọc được danh sách học sinh'
    else {
      const lopMo = new Set(o.toanBo === true ? [...lopDong.keys()] : dsMo.map(lopCua).filter(Boolean))
      const lop = [...lopMo].sort((a, c) => (lopDong.get(c)?.length ?? 0) - (lopDong.get(a)?.length ?? 0) || (a < c ? -1 : 1))[0]
      if (!lop) lyDoThieu.doan = 'Không có lớp nào đã mở Đoàn Hộ Tống'
      else {
        const seasonId = doc<{ id?: string }>(muaJson || '{}', {}).id ?? ''
        const mua = muaHienTai(String(seasonId), ngay)
        const r8 = await Q.hoi<Dong>(
          'SELECT COUNT(*) AS thang, COUNT(DISTINCT CASE WHEN ngay_vn = ? THEN sbd END) AS hom_nay FROM doan_luot WHERE lop = ? AND thang = 1 AND ngay_vn BETWEEN ? AND ?',
          ngay, lop, mua.tuNgay, mua.denNgay,
        )
        if (!r8 || r8.rows.length === 0) lyDoThieu.doan = 'Không đọc được sổ chặng Đoàn Hộ Tống'
        else {
          const siSo = Math.max(1, lopDong.get(lop)!.length)
          doan = { lop, tram: tramCuaLop(so(r8.rows[0]!.thang), siSo), tongTram: SO_TRAM, gopSucHomNay: so(r8.rows[0]!.hom_nay), siSo }
        }
      }
    }
  } catch {
    doan = null
    lyDoThieu.doan = 'Không tính được Đoàn Hộ Tống'
  }

  return { ok: true, serverNow: nowMs, ngay, soEm, soLop, caDangMo, nhiemVu, btvn, canYTuong, dangYeu: dangYeuLop, doan, lyDoThieu, soTruyVan: Q.dem() }
}
