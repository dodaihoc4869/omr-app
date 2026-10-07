// VÒNG CHỮA CÂU SAI — route handler (đặc tả §10, 07/10/2026).
// Các endpoint:
//   POST /chua-cau-sai/mo-dot        — mở/lấy đợt lỗi của (sbd, qid)
//   POST /chua-cau-sai/phat-item     — lấy item hiện tại (hoặc tạo mới)
//   POST /chua-cau-sai/nop-item      — nộp kết quả một item
//   POST /chua-cau-sai/xin-goi-y     — xin gợi ý (tăng mức hỗ trợ)
//   POST /chua-cau-sai/tien-do       — tiến độ đợt hiện tại (SBD từ token)
//   GET  /chua-cau-sai/thong-ke      — thống kê KPI (giáo viên)
//
// BẢO MẬT: SBD từ token, đáp án chỉ ở máy chủ, bản tương đương chưa lộ
// không gửi kèm gợi ý/đáp án, KHÔNG nhận sbd từ body.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { ngayVn } from './su-kien-hoc'
import { tinhNangBat, docCauHinh } from './chua-cau-sai-cau-hinh'
import { docHocLieu } from './chua-cau-sai-hoc-lieu'
import { qidChuan, docTrangThaiLoiDau, trangThaiDayBanDau } from './chua-cau-sai-adapter'
import {
  khoiTaoTienDo, tinhTienDo, xayPhanHoi,
} from './chua-cau-sai-fsm'
import {
  COHORT_PILOT,
  type TrangThaiDay, type ItemCongKhai,
  type BuocTienDo, type LoaiItem,
  type HocLieuChua, type ProbeRef, type NoiDungTrucTiep, type KieuItem,
} from './chua-cau-sai-kieu'
import { coCaDangMo } from './bi-a'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown, d = 0) => (typeof v === 'number' ? v : d)
const nowMs = () => Date.now()

function loi(ma: string, mo: string, status = 400): Response {
  return Response.json({ ok: false, ma, mo }, { status })
}

// So sánh số thập phân (dấu phẩy = dấu chấm), fallback so chuỗi.
function soSanh(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().replace(',', '.')
  const na = parseFloat(norm(a))
  const nb = parseFloat(norm(b))
  if (!isNaN(na) && !isNaN(nb)) return Math.abs(na - nb) < 1e-9
  return norm(a).toLowerCase() === norm(b).toLowerCase()
}

// ---------------------------------------------------------------------------
// POST /chua-cau-sai/mo-dot
// ---------------------------------------------------------------------------
export async function moDot(env: Env, body: Obj): Promise<Response> {
  const sbd = await gameIdentity(env, body).catch(() => '')
  if (!sbd) return loi('CAN_DANG_NHAP', 'Vui lòng đăng nhập lại.', 401)

  const qidGoc = str(body.qid)
  if (!qidGoc) return loi('THIEU_THAM_SO', 'Thiếu qid.', 400)

  const homNay = ngayVn(new Date())
  const q = qidChuan(qidGoc)

  const bat = await tinhNangBat(env, { sbd })
  if (!bat) return loi('FEATURE_TAT', 'Tính năng chưa bật cho tài khoản này.', 403)

  const cfg = await docCauHinh(env)

  const { duDung, lyDo } = await docHocLieu(env, q)

  let dot = await env.DB
    .prepare(`SELECT * FROM chua_loi_dot WHERE sbd = ? AND qid_chuan = ? AND dong_luc IS NULL LIMIT 1`)
    .bind(sbd, q)
    .first<Obj>()
    .catch(() => null)

  if (!dot) {
    const loiDau = await docTrangThaiLoiDau(env, sbd, qidGoc, homNay)
    if (!loiDau) return loi('CHUA_CONG_BO', 'Câu này chưa có lần sai đã công bố.', 404)

    const ttDay = trangThaiDayBanDau(loiDau.loiHoc, duDung)

    const id = crypto.randomUUID()
    const now = nowMs()
    const policySnap = JSON.stringify({ ...cfg, _v: 1 })

    await env.DB.prepare(`
      INSERT INTO chua_loi_dot
        (id, sbd, qid_chuan, cohort_id, nguon_sai, mo_luc, sai_cuoi_luc, trang_thai_day,
         ly_do_thieu, policy_snapshot, revision, tao_luc, cap_nhat_luc)
      VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)
    `).bind(
      id, sbd, q,
      cfg.cohortId ?? COHORT_PILOT,
      str(body.nguonSai) || 'khong_ro',
      loiDau.moLuc ?? now,
      loiDau.saiCuoiLuc ?? now,
      ttDay,
      lyDo,
      policySnap,
      now, now,
    ).run()

    dot = await env.DB
      .prepare('SELECT * FROM chua_loi_dot WHERE id = ?')
      .bind(id)
      .first<Obj>()
      .catch(() => null)
  }

  if (!dot) return loi('LOI_MAY_CHU', 'Không thể tạo đợt chữa.', 500)

  return Response.json({
    ok: true,
    dotId: str(dot.id),
    trangThai: str(dot.trang_thai_day) as TrangThaiDay,
    lyDoThieu: str(dot.ly_do_thieu) || undefined,
    coHocLieu: duDung,
  })
}

// ---------------------------------------------------------------------------
// POST /chua-cau-sai/nop-item
// ---------------------------------------------------------------------------
export async function nopItem(env: Env, body: Obj): Promise<Response> {
  const sbd = await gameIdentity(env, body).catch(() => '')
  if (!sbd) return loi('CAN_DANG_NHAP', 'Vui lòng đăng nhập lại.', 401)

  const dotId = str(body.dotId)
  const phienId = str(body.phienId)
  const itemId = str(body.itemId)
  const attemptId = str(body.attemptId)
  const traLoi = str(body.traLoi)
  const giay = num(body.giay)

  if (!dotId || !itemId || !attemptId) return loi('THIEU_THAM_SO', 'Thiếu dotId/itemId/attemptId.', 400)

  const existing = await env.DB
    .prepare('SELECT id, dung, response_json FROM chua_loi_nop WHERE sbd = ? AND attempt_id = ?')
    .bind(sbd, attemptId)
    .first<{ id: string; dung: number; response_json: string }>()
    .catch(() => null)

  if (existing) {
    const prev = JSON.parse(existing.response_json || '{}') as Obj
    return Response.json({ ok: true, idempotent: true, ...prev })
  }

  const item = await env.DB
    .prepare('SELECT * FROM chua_loi_item WHERE id = ? AND sbd = ?')
    .bind(itemId, sbd)
    .first<Obj>()
    .catch(() => null)

  if (!item) return loi('KHONG_TIM_THAY', 'Không tìm thấy item.', 404)
  if (str(item.trang_thai) !== 'chua_nop') return loi('DA_NOP', 'Item này đã nộp rồi.', 409)

  // Chấm — đáp án nằm trong probe_ref (phần máy chủ); so số thập phân chịu dấu phẩy
  const probeRef = JSON.parse(str(item.probe_ref) || '{}') as Obj
  const dapAnDung = str(probeRef.dapAn)
  const dung = dapAnDung && soSanh(traLoi, dapAnDung) ? 1 : 0

  const now = nowMs()
  const phanHoi = xayPhanHoi(itemId, dung === 1, str(item.loai) as LoaiItem, null)
  const responseJson = JSON.stringify(phanHoi)

  const nopId = crypto.randomUUID()
  await env.DB.prepare(`
    INSERT OR IGNORE INTO chua_loi_nop
      (id, attempt_id, item_id, phien_id, dot_id, sbd, tra_loi, dung, co_ho_tro, giay, bang_chung_json, response_json, nop_luc, server_luc)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    nopId, attemptId, itemId, phienId, dotId, sbd,
    traLoi, dung, num(item.co_ho_tro), giay, '{}', responseJson, now, now,
  ).run()

  await env.DB.prepare('UPDATE chua_loi_item SET trang_thai = ? WHERE id = ?')
    .bind('da_nop', itemId).run()

  // Cập nhật tien_do_json trong phiên (R2: FSM wiring)
  if (dung === 1 && phienId) {
    const phienRow = await env.DB
      .prepare('SELECT tien_do_json FROM chua_loi_phien WHERE id = ?')
      .bind(phienId)
      .first<{ tien_do_json: string }>()
      .catch(() => null)
    if (phienRow) {
      const tdArr = JSON.parse(phienRow.tien_do_json || '[]') as (BuocTienDo & Record<string, unknown>)[]
      const buocSoItem = item.buoc_so != null ? Number(item.buoc_so) : -1
      if (buocSoItem >= 0 && tdArr[buocSoItem]) {
        const loaiItem = str(item.loai) as LoaiItem
        if (loaiItem === 'chan_doan' || loaiItem === 'phan_biet') {
          tdArr[buocSoItem] = { ...tdArr[buocSoItem], receiptChanDoan: attemptId }
        } else if (loaiItem === 'kiem_ly_do') {
          tdArr[buocSoItem] = { ...tdArr[buocSoItem], receiptLyDo: attemptId }
        } else if (loaiItem === 'kiem_lai' || loaiItem === 'chuyen_giao') {
          tdArr[buocSoItem] = { ...tdArr[buocSoItem], receiptChuyenGiao: attemptId }
        }
        await env.DB.prepare('UPDATE chua_loi_phien SET tien_do_json = ? WHERE id = ?')
          .bind(JSON.stringify(tdArr), phienId).run()
      }
    }
  }

  return Response.json({ ok: true, ...phanHoi })
}

// ---------------------------------------------------------------------------
// POST /chua-cau-sai/tien-do  — SBD xác thực qua token (không nhận query SBD)
// ---------------------------------------------------------------------------
export async function tienDo(env: Env, body: Obj): Promise<Response> {
  const sbd = await gameIdentity(env, body).catch(() => '')
  if (!sbd) return loi('CAN_DANG_NHAP', 'Vui lòng đăng nhập lại.', 401)

  const dotId = str(body.dotId)
  if (!dotId) return loi('THIEU_THAM_SO', 'Thiếu dotId.', 400)

  const dot = await env.DB
    .prepare('SELECT * FROM chua_loi_dot WHERE id = ? AND sbd = ?')
    .bind(dotId, sbd)
    .first<Obj>()
    .catch(() => null)

  if (!dot) return loi('KHONG_TIM_THAY', 'Không tìm thấy đợt.', 404)

  const q = str(dot.qid_chuan)
  const { hocLieu } = await docHocLieu(env, q)

  const phien = await env.DB
    .prepare('SELECT * FROM chua_loi_phien WHERE dot_id = ? AND sbd = ? ORDER BY tao_luc DESC LIMIT 1')
    .bind(dotId, sbd)
    .first<Obj>()
    .catch(() => null)

  const tienDoArr: BuocTienDo[] = phien
    ? JSON.parse(str(phien.tien_do_json) || '[]') as BuocTienDo[]
    : hocLieu ? khoiTaoTienDo(hocLieu) : []

  const td = hocLieu ? tinhTienDo(hocLieu, tienDoArr) : { soBuocDaQua: 0, soBuocCanKiem: 0 }

  return Response.json({
    ok: true,
    dotId,
    trangThai: str(dot.trang_thai_day),
    lanGapLai: num(dot.lan_gap_lai),
    tienDo: td,
    tienDoChiTiet: tienDoArr,
    denHan: str(dot.den_han),
  })
}

// ---------------------------------------------------------------------------
// GET /chua-cau-sai/thong-ke?tuNgay=&denNgay=&cohortId=  (giáo viên)
// ---------------------------------------------------------------------------
export async function thongKeKpi(env: Env, searchParams: URLSearchParams): Promise<Response> {
  const cohortId = str(searchParams.get('cohortId')) || COHORT_PILOT
  const tuNgay = str(searchParams.get('tuNgay')) || '2026-09-29'
  const denNgay = str(searchParams.get('denNgay')) || ngayVn(new Date())

  const tuMs = new Date(`${tuNgay}T00:00:00+07:00`).getTime()
  const denMs = new Date(`${denNgay}T23:59:59+07:00`).getTime()

  // Mẫu số: tất cả đợt đang theo dõi trong cửa sổ thời gian (R6: bỏ AND lan_gap_lai >= 2)
  const mauSoRow = await env.DB.prepare(`
    SELECT COUNT(*) AS n FROM chua_loi_dot
    WHERE cohort_id = ? AND mo_luc >= ? AND mo_luc <= ?
  `).bind(cohortId, tuMs, denMs).first<{ n: number }>().catch(() => ({ n: 0 }))

  // Tử số: đã tự sửa (da_tu_sua) ở lần gặp lại 2 đầu tiên, không có hỗ trợ
  const tuSoRow = await env.DB.prepare(`
    SELECT COUNT(DISTINCT d.id) AS n FROM chua_loi_dot d
    JOIN chua_loi_nop n ON n.dot_id = d.id AND n.co_ho_tro = 0 AND n.dung = 1
    WHERE d.cohort_id = ? AND d.mo_luc >= ? AND d.mo_luc <= ?
      AND d.trang_thai_day = 'da_tu_sua' AND d.lan_gap_lai = 2
  `).bind(cohortId, tuMs, denMs).first<{ n: number }>().catch(() => ({ n: 0 }))

  const mauSo = mauSoRow?.n ?? 0
  const tuSo = tuSoRow?.n ?? 0
  const kpi = mauSo > 0 ? Math.round((tuSo / mauSo) * 1000) / 10 : null

  return Response.json({
    ok: true,
    cohortId, tuNgay, denNgay,
    mauSo, tuSo,
    kpiPhanTram: kpi,
    mucTieu: 90,
    datMucTieu: kpi != null && kpi >= 90,
  })
}

// ---------------------------------------------------------------------------
// Helpers nội bộ: tạo/trả ItemCongKhai từ học liệu
// ---------------------------------------------------------------------------

const TRANG_THAI_DONG: readonly TrangThaiDay[] = ['thieu_hoc_lieu', 'tam_khoa', 'can_thay', 'da_tu_sua', 'cau_thay_doi']

function noiDungTuProbe(p: ProbeRef): NoiDungTrucTiep | null {
  return p.noiDungTrucTiep ?? null
}

function xayItemCK(id: string, loai: LoaiItem, buocSo: number | undefined, tieuDe: string, nd: NoiDungTrucTiep): ItemCongKhai {
  return {
    id,
    loai,
    buocSo,
    tieuDe,
    kieu: nd.kieu,
    hoi: nd.hoi,
    luaChon: nd.luaChon ?? null,
    donVi: nd.donVi,
  }
}

function itemCKTuRow(row: Obj): ItemCongKhai | null {
  try {
    const pr = JSON.parse(str(row.probe_ref) || '{}') as { kieu?: KieuItem; hoi?: string; luaChon?: unknown; donVi?: string }
    if (!pr.hoi) return null
    return {
      id: str(row.id),
      loai: str(row.loai) as LoaiItem,
      buocSo: row.buoc_so != null ? Number(row.buoc_so) : undefined,
      tieuDe: str(row.tieu_de),
      kieu: (pr.kieu ?? 'tu_nhap') as KieuItem,
      hoi: pr.hoi,
      luaChon: Array.isArray(pr.luaChon) ? pr.luaChon as { ky: string; noi: string }[] : null,
      donVi: pr.donVi,
    }
  } catch {
    return null
  }
}

async function taoItemMoi(
  env: Env,
  sbd: string,
  dotId: string,
  phienId: string,
  tt: TrangThaiDay,
  hocLieu: HocLieuChua,
  tienDoArr: BuocTienDo[],
): Promise<ItemCongKhai | null> {
  let probe: ProbeRef | null = null
  let loai: LoaiItem = 'chan_doan'
  let buocSo: number | undefined
  let tieuDe = ''

  if (tt === 'can_chan_doan') {
    const buoc = hocLieu.buoc.find((_b, i) => !tienDoArr[i]?.receiptChanDoan)
    if (!buoc || !buoc.chanDoan.length) return null
    probe = buoc.chanDoan[0]
    loai = 'chan_doan'
    buocSo = buoc.thuTu
    tieuDe = buoc.tieuDe
  } else if (tt === 'dang_chua_buoc') {
    const bIdx = tienDoArr.findIndex((td) => td.trangThai === 'dang_kiem' || td.trangThai === 'chua_kiem')
    const buoc = bIdx >= 0 ? hocLieu.buoc[bIdx] : null
    if (!buoc) return null
    const bTd = tienDoArr[bIdx] as BuocTienDo & Record<string, unknown>
    if (!bTd?.receiptChanDoan && buoc.chanDoan.length) {
      probe = buoc.chanDoan[0]; loai = 'chan_doan'
    } else if (!bTd?.receiptLyDo && buoc.hieuBuoc?.kiemLyDo.length) {
      probe = buoc.hieuBuoc.kiemLyDo[0]; loai = 'kiem_ly_do'
    } else if (!bTd?.receiptChuyenGiao && buoc.kiemLai.length) {
      probe = buoc.kiemLai[0]; loai = 'kiem_lai'
    } else if (buoc.hieuBuoc?.chuyenGiao.length) {
      probe = buoc.hieuBuoc.chuyenGiao[0]; loai = 'chuyen_giao'
    }
    buocSo = buoc.thuTu
    tieuDe = buoc.tieuDe
  } else if (tt === 'dang_ghep_bai') {
    if (!hocLieu.banGhepBai.length) return null
    probe = hocLieu.banGhepBai[0] as ProbeRef
    loai = 'ghep_bai'
    tieuDe = 'Ghép lại cả bài'
  } else if (tt === 'dang_kiem_chung') {
    if (!hocLieu.banKiemChung.length) return null
    probe = hocLieu.banKiemChung[0] as ProbeRef
    loai = 'kiem_chung'
    tieuDe = 'Kiểm chứng'
  }

  if (!probe) return null
  const nd = noiDungTuProbe(probe)
  if (!nd) return null

  const itemId = crypto.randomUUID()
  const now = nowMs()

  const thuTuRow = await env.DB
    .prepare('SELECT COUNT(*) as c FROM chua_loi_item WHERE dot_id = ?')
    .bind(dotId).first<{ c: number }>().catch(() => ({ c: 0 }))
  const thuTu = thuTuRow?.c ?? 0

  const probeRef = JSON.stringify({
    kieu: nd.kieu, hoi: nd.hoi, luaChon: nd.luaChon, donVi: nd.donVi,
    dapAn: nd.dapAn,
  })

  await env.DB.prepare(`
    INSERT OR IGNORE INTO chua_loi_item
      (id, dot_id, phien_id, sbd, thu_tu, loai, buoc_so, tieu_de, probe_ref, co_ho_tro, phat_luc, trang_thai, tao_luc, cap_nhat_luc)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(itemId, dotId, phienId, sbd, thuTu, loai, buocSo ?? null, tieuDe, probeRef, 0, now, 'chua_nop', now, now).run()

  return xayItemCK(itemId, loai, buocSo, tieuDe, nd)
}

// ---------------------------------------------------------------------------
// POST /hs/chua-cau-sai/phat-item
// ---------------------------------------------------------------------------
export async function phatItem(env: Env, body: Obj): Promise<Response> {
  const sbd = await gameIdentity(env, body).catch(() => '')
  if (!sbd) return loi('CAN_DANG_NHAP', 'Vui lòng đăng nhập lại.', 401)

  const dotId = str(body.dotId)
  if (!dotId) return loi('THIEU_THAM_SO', 'Thiếu dotId.', 400)

  const dot = await env.DB
    .prepare('SELECT * FROM chua_loi_dot WHERE id = ? AND sbd = ?')
    .bind(dotId, sbd).first<Obj>().catch(() => null)
  if (!dot) return loi('KHONG_TIM_THAY', 'Không tìm thấy đợt.', 404)

  let tt = str(dot.trang_thai_day) as TrangThaiDay
  const q = str(dot.qid_chuan)
  const { hocLieu } = await docHocLieu(env, q)

  // R7: hết hạn gặp lại 2 → chuyển sang kiểm chứng
  if (tt === 'cho_gap_lai_2') {
    const denHan = str(dot.den_han)
    const homNay = ngayVn(new Date())
    if (denHan && denHan <= homNay) {
      await env.DB.prepare("UPDATE chua_loi_dot SET trang_thai_day = 'dang_kiem_chung' WHERE id = ?")
        .bind(dotId).run()
      tt = 'dang_kiem_chung'
    }
  }

  const phien = await env.DB
    .prepare('SELECT id, tien_do_json FROM chua_loi_phien WHERE dot_id = ? AND sbd = ? ORDER BY tao_luc DESC LIMIT 1')
    .bind(dotId, sbd).first<{ id: string; tien_do_json: string }>().catch(() => null)
  const phienId = phien?.id ?? ''
  const tienDoArr: BuocTienDo[] = phien
    ? (JSON.parse(str(phien.tien_do_json) || '[]') as BuocTienDo[])
    : hocLieu ? khoiTaoTienDo(hocLieu) : []
  const td = hocLieu ? tinhTienDo(hocLieu, tienDoArr) : { soBuocDaQua: 0, soBuocCanKiem: 0 }

  const base = {
    ok: true, dotId,
    trangThai: tt,
    tienDo: td,
    lanGapLai: num(dot.lan_gap_lai),
    denHan: str(dot.den_han) || undefined,
    lyDoThieu: str(dot.ly_do_thieu) || undefined,
  }

  if (TRANG_THAI_DONG.includes(tt) || tt === 'cho_gap_lai_2') {
    return Response.json(base)
  }

  if (!hocLieu) {
    return Response.json({ ...base, trangThai: 'thieu_hoc_lieu' as TrangThaiDay })
  }

  // R10: không phát câu chữa khi đang có ca thi mở
  const examMo = await coCaDangMo(env, sbd, nowMs())
  if (examMo) {
    return Response.json({ ...base, ok: false, ma: 'CA_DANG_MO', mo: 'Đang có ca thi — hoàn thành ca thi trước.' })
  }

  const itemMo = await env.DB
    .prepare("SELECT * FROM chua_loi_item WHERE dot_id = ? AND sbd = ? AND trang_thai = 'chua_nop' ORDER BY tao_luc ASC LIMIT 1")
    .bind(dotId, sbd).first<Obj>().catch(() => null)
  if (itemMo) {
    const ick = itemCKTuRow(itemMo)
    if (ick) return Response.json({ ...base, item: ick })
  }

  const item = await taoItemMoi(env, sbd, dotId, phienId, tt, hocLieu, tienDoArr)
  if (!item) {
    return Response.json({ ...base, trangThai: 'thieu_hoc_lieu' as TrangThaiDay, lyDoThieu: 'Chưa có probe cho bước này.' })
  }

  return Response.json({ ...base, item })
}

// ---------------------------------------------------------------------------
// POST /hs/chua-cau-sai/xin-goi-y
// ---------------------------------------------------------------------------
export async function xinGoiY(env: Env, body: Obj): Promise<Response> {
  const sbd = await gameIdentity(env, body).catch(() => '')
  if (!sbd) return loi('CAN_DANG_NHAP', 'Vui lòng đăng nhập lại.', 401)

  const dotId = str(body.dotId)
  const itemId = str(body.itemId)
  if (!dotId || !itemId) return loi('THIEU_THAM_SO', 'Thiếu dotId/itemId.', 400)

  const item = await env.DB
    .prepare('SELECT * FROM chua_loi_item WHERE id = ? AND sbd = ?')
    .bind(itemId, sbd).first<Obj>().catch(() => null)
  if (!item) return loi('KHONG_TIM_THAY', 'Không tìm thấy item.', 404)
  if (str(item.trang_thai) !== 'chua_nop') return loi('DA_NOP', 'Item đã nộp rồi.', 409)

  const dot = await env.DB
    .prepare('SELECT qid_chuan FROM chua_loi_dot WHERE id = ? AND sbd = ?')
    .bind(dotId, sbd).first<{ qid_chuan: string }>().catch(() => null)
  const { hocLieu } = dot ? await docHocLieu(env, str(dot.qid_chuan)) : { hocLieu: null }
  const buocSo = item.buoc_so != null ? Number(item.buoc_so) : undefined
  const buoc = hocLieu && buocSo != null ? hocLieu.buoc[buocSo] : null

  const mucDaGoiY = num(item.muc_ho_tro_cao_nhat)
  const mucMoi = Math.min(mucDaGoiY + 1, 3)
  const goiY = buoc?.hoTro.find((h) => h.muc === mucMoi)

  // R11: cập nhật co_ho_tro = 1 (để nopItem biết item đã được giúp)
  await env.DB.prepare('UPDATE chua_loi_item SET co_ho_tro = 1, muc_ho_tro_cao_nhat = ?, cap_nhat_luc = ? WHERE id = ?')
    .bind(mucMoi, nowMs(), itemId).run()

  return Response.json({
    ok: true,
    mucHoTro: mucMoi,
    noiDungGoiY: goiY?.noiDung ?? null,
    dacBiet: mucMoi >= 3 ? 'Mức hỗ trợ cao nhất — nếu vẫn chưa hiểu hãy hỏi thầy.' : undefined,
  })
}
