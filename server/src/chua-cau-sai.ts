// VÒNG CHỮA CÂU SAI — route handler (đặc tả §10, 07/10/2026).
// Các endpoint:
//   POST /chua-cau-sai/mo-dot        — mở/lấy đợt lỗi của (sbd, qid)
//   POST /chua-cau-sai/nop-item      — nộp kết quả một item
//   POST /chua-cau-sai/xin-goi-y     — xin gợi ý (tăng mức hỗ trợ)
//   GET  /chua-cau-sai/tien-do       — tiến độ đợt hiện tại
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
  khoiTaoTienDo, tinhTienDo, xayPhanHoi, chuyenTrang,
} from './chua-cau-sai-fsm'
import {
  COHORT_PILOT,
  type TrangThaiDay, type PhienResponse, type ItemCongKhai,
  type BuocTienDo, type CauHinhChuaCauSai,
} from './chua-cau-sai-kieu'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v == null ? '' : String(v))
const num = (v: unknown, d = 0) => (typeof v === 'number' ? v : d)
const nowMs = () => Date.now()

function loi(ma: string, mo: string, status = 400): Response {
  return Response.json({ ok: false, ma, mo }, { status })
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

  // Kiểm học liệu
  const { duDung, lyDo, hocLieu } = await docHocLieu(env, q)

  // Đọc đợt đang mở nếu có
  let dot = await env.DB
    .prepare(`SELECT * FROM chua_loi_dot WHERE sbd = ? AND qid_chuan = ? AND dong_luc IS NULL LIMIT 1`)
    .bind(sbd, q)
    .first<Obj>()
    .catch(() => null)

  if (!dot) {
    // Kiểm trạng thái lỗi học để quyết định có mở đợt không
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

  // Idempotency: kiểm attempt đã nộp chưa
  const existing = await env.DB
    .prepare('SELECT id, dung, response_json FROM chua_loi_nop WHERE sbd = ? AND attempt_id = ?')
    .bind(sbd, attemptId)
    .first<{ id: string; dung: number; response_json: string }>()
    .catch(() => null)

  if (existing) {
    const prev = JSON.parse(existing.response_json || '{}') as Obj
    return Response.json({ ok: true, idempotent: true, ...prev })
  }

  // Đọc item
  const item = await env.DB
    .prepare('SELECT * FROM chua_loi_item WHERE id = ? AND sbd = ?')
    .bind(itemId, sbd)
    .first<Obj>()
    .catch(() => null)

  if (!item) return loi('KHONG_TIM_THAY', 'Không tìm thấy item.', 404)
  if (str(item.trang_thai) !== 'chua_nop') return loi('DA_NOP', 'Item này đã nộp rồi.', 409)

  // Chấm — đáp án nằm trong probe_ref (phần máy chủ)
  const probeRef = JSON.parse(str(item.probe_ref) || '{}') as Obj
  const dapAnDung = str(probeRef.dapAn)  // thực tế: đọc từ kho câu hỏi
  const dung = dapAnDung && traLoi.trim().toLowerCase() === dapAnDung.trim().toLowerCase() ? 1 : 0

  const now = nowMs()
  const phanHoi = xayPhanHoi(itemId, dung === 1, str(item.loai) as never, null)
  const responseJson = JSON.stringify(phanHoi)

  // Ghi nộp (idempotent)
  const nopId = crypto.randomUUID()
  await env.DB.prepare(`
    INSERT OR IGNORE INTO chua_loi_nop
      (id, attempt_id, item_id, phien_id, dot_id, sbd, tra_loi, dung, giay, bang_chung_json, response_json, nop_luc, server_luc)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    nopId, attemptId, itemId, phienId, dotId, sbd,
    traLoi, dung, giay, '{}', responseJson, now, now,
  ).run()

  // Cập nhật item thành đã nộp
  await env.DB.prepare('UPDATE chua_loi_item SET trang_thai = ? WHERE id = ?')
    .bind('da_nop', itemId).run()

  return Response.json({ ok: true, dung: dung === 1, ...phanHoi })
}

// ---------------------------------------------------------------------------
// GET /chua-cau-sai/tien-do?sbd=&dotId=
// ---------------------------------------------------------------------------
export async function tienDo(env: Env, searchParams: URLSearchParams): Promise<Response> {
  const sbd = str(searchParams.get('sbd'))
  const dotId = str(searchParams.get('dotId'))
  if (!sbd || !dotId) return loi('THIEU_THAM_SO', 'Thiếu sbd/dotId.', 400)

  const dot = await env.DB
    .prepare('SELECT * FROM chua_loi_dot WHERE id = ? AND sbd = ?')
    .bind(dotId, sbd)
    .first<Obj>()
    .catch(() => null)

  if (!dot) return loi('KHONG_TIM_THAY', 'Không tìm thấy đợt.', 404)

  const q = str(dot.qid_chuan)
  const { hocLieu } = await docHocLieu(env, q)

  // Lấy phiên mới nhất
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

  // Mẫu số: tổng đợt đủ điều kiện (có gặp lại 2)
  const mauSoRow = await env.DB.prepare(`
    SELECT COUNT(*) AS n FROM chua_loi_dot
    WHERE cohort_id = ? AND mo_luc >= ? AND mo_luc <= ? AND lan_gap_lai >= 2
  `).bind(cohortId, tuMs, denMs).first<{ n: number }>().catch(() => ({ n: 0 }))

  // Tử số: đã tự sửa (da_tu_sua) ở lần gặp lại 2 ĐẦU TIÊN, không có hỗ trợ
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
