import type {Env} from './kieu'
import {mom} from './mom'
import {sbdCuaPhuHuynh} from './ph-truy-cap'
import {lapVaLuuKeHoach, TOI_DA_EM_MOI_LO} from './ke-hoach-ngay-d1'
import type {KeHoachNgay} from './ke-hoach-ngay'
import {chonCauBaiHangNgay} from './parent-news-nguon-cau'
import {soCauPhanDu, tomTatKeHoach, type DemHoSo, type KeHoachChoPhuHuynh} from './parent-news-chon-cau'
import {ngayVn} from './su-kien-hoc'

type Row = Record<string, any>

export type DuDoanDiem = {
  diem: number
  khoangDiem: string
  thang: string
  nhanXet: string
  doTinCay: 'cao' | 'trung_binh' | 'khoi_dau'
}

export type KeHoachLuyenTap = {
  tongCau: number
  soCauSuaLoi: number
  soCauOnBaiCu: number
  soCauTienBo: number
  phuongPhap: string
}

// Ngày học đổi lúc 00:01 Việt Nam, không phụ thuộc đồng hồ điện thoại.
export function newsDay(now = Date.now()) {
  return new Date(now + 7 * 3600000 - 60000).toISOString().slice(0, 10)
}

/**
 * ƯỚC LƯỢNG DỰ ĐOÁN ĐIỂM THI THẬT THEO THÁNG (Thang điểm 10 chuẩn Bộ GD&ĐT)
 * Dựa trên trọng số điểm thi các ca gần nhất + tỷ lệ chính xác các câu hỏi đã làm.
 */
export function tinhDuDoanDiem(exams: Row[], details: Row[], now = Date.now()): DuDoanDiem {
  const dVN = new Date(now + 7 * 3600000)
  const thang = `Tháng ${dVN.getMonth() + 1}/${dVN.getFullYear()}`

  const allScores = exams.filter((e) => e.tong != null).map((e) => Number(e.tong))
  const totalQ = details.length
  const corrects = details.filter((d) => d.dung_sai === 1).length
  const acc = totalQ > 0 ? corrects / totalQ : 0.72

  let raw = 7.0
  let doTinCay: 'cao' | 'trung_binh' | 'khoi_dau' = 'khoi_dau'

  if (allScores.length > 0) {
    // Trọng số ca thi: ca mới nhất có trọng số cao nhất
    const recentScores = allScores.slice(0, 5)
    let wSum = 0
    let wDiv = 0
    for (let i = 0; i < recentScores.length; i++) {
      const w = recentScores.length - i
      wSum += recentScores[i] * w
      wDiv += w
    }
    const weightedExamScore = wSum / Math.max(1, wDiv)
    raw = weightedExamScore * 0.7 + (acc * 10) * 0.3
    doTinCay = allScores.length >= 3 ? 'cao' : 'trung_binh'
  } else if (totalQ > 0) {
    raw = acc * 10
    doTinCay = totalQ >= 20 ? 'trung_binh' : 'khoi_dau'
  }

  // Làm tròn theo bước 0.25 (chuẩn chấm thi Bộ GD&ĐT)
  const diem = Math.max(1.0, Math.min(10.0, Math.round(raw * 4) / 4))
  const minD = Math.max(0, diem - 0.25).toFixed(2)
  const maxD = Math.min(10, diem + 0.25).toFixed(2)
  const khoangDiem = `${minD} – ${maxD}`

  let nhanXet = ''
  if (diem >= 8.5) {
    nhanXet = 'Phong độ xuất sắc! Nắm chắc toàn diện lý thuyết. Hãy duy trì nhịp luyện hàng ngày và rèn thêm các câu bẫy tính toán Phần III để chạm mốc 9.5 – 10.0.'
  } else if (diem >= 7.0) {
    nhanXet = 'Nền tảng khá vững chắc. Tập trung củng cố triệt để các câu Đúng/Sai Phần II ở chuyên đề còn lỗi để tự tin bứt phá lên mốc 8.5+.'
  } else if (diem >= 5.0) {
    nhanXet = 'Đang có đà tiến bộ tốt. Cần nắm chắc các câu lý thuyết Nhận biết/Thông hiểu Phần I để gom trọn vẹn 5.5 – 6.5 điểm nền tảng.'
  } else {
    nhanXet = 'Kế hoạch nâng đỡ hàng ngày từ các câu cơ bản 1 sao, lặp lại ngắt quãng để tự tin bứt phá qua mốc 6.0 điểm.'
  }

  return { diem, khoangDiem, thang, nhanXet, doTinCay }
}

/**
 * BÀI HẰNG NGÀY CỦA PHỤ HUYNH (Kênh 5, GĐ 5).
 *
 * Số câu = PHẦN DƯ ngân sách ngày của kế hoạch ngày (`soCauPhanDu`): mục tiêu − việc bắt buộc còn lại − số câu đã làm.
 * Thầy chốt 19/09 (câu 4): bỏ mức "luôn ≥ 12 câu" và "tối đa 36 câu"; trần thật là ngân sách 8–16 câu của kế hoạch.
 * Thiếu kế hoạch (`keHoachNgay` không truyền) thì KHÔNG giao thêm và nói rõ lý do, không đoán số.
 *
 * Hàm thuần: cùng đầu vào → cùng kết quả; `now` do nơi gọi truyền.
 */
export function analyzeParent(
  sbd: string,
  exams: Row[],
  details: Row[],
  pending: number,
  now = Date.now(),
  pendingDetails?: { btvn: number; mom: number; daily: number },
  keHoachNgay?: KeHoachChoPhuHuynh
) {
  const day = newsDay(now)
  const today = exams.filter(
    (e) => new Date(Date.parse(e.nop_luc) + 7 * 3600000).toISOString().slice(0, 10) === day
  )
  const latest = exams[0]
  const scores = today.filter((e) => e.tong != null).map((e) => Number(e.tong))
  const relevantWrong = details.filter((d) => d.dung_sai === 0)

  const topics = new Map<string, number>()
  for (const d of relevantWrong) {
    const name = String(d.chuyen_de || 'Kiến thức cần ôn')
    topics.set(name, (topics.get(name) || 0) + 1)
  }

  const seconds = details
    .map((d) => Number(d.giay))
    .filter((v) => v >= 5 && v <= 1200)
    .sort((a, b) => a - b)
  const sec = seconds.length >= 5 ? Math.max(45, seconds[Math.floor(seconds.length / 2)]) : 90
  const score = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : latest?.tong == null
    ? null
    : Number(latest.tong)

  const duDoanDiem = tinhDuDoanDiem(exams, details, now)

  const weak = [...topics]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  // Số câu = phần dư của kế hoạch ngày. Chia theo nguồn ĐÚNG thứ tự chọn câu: ôn tới hạn (câu từng sai, rồi câu đã sửa
  // tới mốc duy trì), phần còn lại là câu mới cùng dạng yếu hoặc bù từ kho.
  const kh = keHoachNgay
  const count = kh ? soCauPhanDu(kh) : 0
  const soCauSuaLoi = kh ? Math.min(count, kh.toiHanSai) : 0
  const soCauOnBaiCu = kh ? Math.min(count - soCauSuaLoi, kh.toiHanDuyTri) : 0
  const soCauTienBo = count - soCauSuaLoi - soCauOnBaiCu
  const assignmentCount = count > 0 ? 1 : 0
  const minutes = count > 0 ? Math.max(1, Math.ceil((count * sec) / 60)) : 0

  const keHoach: KeHoachLuyenTap = {
    tongCau: count,
    soCauSuaLoi,
    soCauOnBaiCu,
    soCauTienBo,
    phuongPhap: 'Ôn theo mốc 1, 3, 7 ngày, tính từ từng câu con đã làm ở mọi nơi',
  }

  const mode =
    count === 0
      ? 'Hôm nay chưa cần giao thêm'
      : soCauSuaLoi + soCauOnBaiCu > 0
      ? `Ôn câu đến hạn (${count} câu)`
      : `Luyện dạng con còn yếu (${count} câu)`

  let reason: string
  if (!kh) {
    reason = 'Chưa lập được kế hoạch ngày của con nên Thầy chưa giao thêm câu nào.'
  } else if (count === 0) {
    reason = `Mục tiêu hôm nay ${kh.mucTieuCau} câu. Bài đang chờ còn ${kh.taiCung} câu, con đã làm ${kh.daLamCau} câu. Chưa cần giao thêm.`
  } else {
    const phan = [
      soCauSuaLoi > 0 ? `${soCauSuaLoi} câu sai đến hạn ôn lại` : '',
      soCauOnBaiCu > 0 ? `${soCauOnBaiCu} câu đã sửa đến hạn ôn duy trì` : '',
      soCauTienBo > 0 ? `${soCauTienBo} câu mới cùng dạng con còn yếu` : '',
    ].filter(Boolean)
    reason =
      `Mục tiêu hôm nay ${kh.mucTieuCau} câu. Bài đang chờ còn ${kh.taiCung} câu, con đã làm ${kh.daLamCau} câu, nên còn ${count} câu để ôn: ${phan.join(', ')}.` +
      (weak.length > 0 ? ` Chuyên đề con hay sai: ${weak.slice(0, 2).map((w) => w.name).join(', ')}.` : '')
  }

  return {
    day,
    sbd,
    updatedAt: new Date(now).toISOString(),
    today: today.map((e) => ({
      tenCa: e.ten_ca || e.ma_ca,
      diem: e.tong,
      nopLuc: e.nop_luc,
    })),
    score,
    duDoanDiem,
    keHoach,
    weak,
    // Một định nghĩa "câu sai cần khắc phục": số câu `moi_sai`/`dang_on` trong hồ sơ; chưa có kế hoạch thì đếm theo bài thi.
    wrong: kh ? kh.chuaKhacPhuc : relevantWrong.length,
    pending,
    pendingDetails: pendingDetails || { btvn: 0, mom: 0, daily: 0 },
    questionCount: count,
    assignmentCount,
    minutes,
    mode,
    modeKey: score !== null && score < 5 ? 'basic' : 'adaptive',
    speedMeasured: seconds.length >= 5,
    reason,
    phanDu: kh ? { mucTieuCau: kh.mucTieuCau, taiCung: kh.taiCung, daLamCau: kh.daLamCau, soCau: count } : null,
  }
}

async function data(env: Env, sbd?: string, now = Date.now()) {
  const where = sbd ? ' WHERE sbd=?' : ''
  const homNay = newsDay(now)
  const nowIso = new Date(now).toISOString()
  // Bài Mom hết hạn sau 120 phút kể từ lúc bắt đầu: bài đã bắt đầu quá mốc đó không còn là "tồn đọng".
  const heGio = new Date(now - 2 * 3600000).toISOString()
  const q = async (sql: string, ...them: unknown[]) => {
    const st = env.DB.prepare(sql)
    const tham = [...(sbd ? [sbd] : []), ...them]
    return (await (tham.length ? st.bind(...tham) : st).all<Row>()).results
  }
  const exams = await q(
    `SELECT l.sbd,l.ma_ca,l.nop_luc,l.tong,c.ten_ca FROM luot l LEFT JOIN ca c ON c.ma_ca=l.ma_ca WHERE l.nop_luc IS NOT NULL ${
      sbd ? 'AND l.sbd=?' : ''
    } AND l.lan_thu=(SELECT MAX(z.lan_thu) FROM luot z WHERE z.ma_ca=l.ma_ca AND z.sbd=l.sbd) ORDER BY l.nop_luc DESC`
  )
  const details = await q(
    `SELECT t.sbd,t.qid,t.chuyen_de,t.dung_sai,t.giay,t.muc_do,l.nop_luc FROM chi_tiet_cau t JOIN luot l ON l.ma_ca=t.ma_ca AND l.sbd=t.sbd AND l.lan_thu=t.lan_thu WHERE l.nop_luc IS NOT NULL ${
      sbd ? 'AND t.sbd=?' : ''
    } AND NOT EXISTS(SELECT 1 FROM chi_tiet_cau z JOIN luot n ON n.ma_ca=z.ma_ca AND n.sbd=z.sbd AND n.lan_thu=z.lan_thu WHERE z.sbd=t.sbd AND z.qid=t.qid AND n.nop_luc>l.nop_luc)`
  )
  // Bài hằng ngày chỉ tính là tồn đọng khi là bài CỦA HÔM NAY hoặc đã bắt đầu và còn trong 120 phút; bài của ngày cũ mà chưa bắt đầu bị bỏ.
  const pendingDaily = await q(
    `SELECT sbd,SUM(question_count) n FROM mom_bai ${
      where ? where + ' AND' : 'WHERE'
    } submitted_at IS NULL AND id LIKE 'daily_%' AND (id=? OR (started_at IS NOT NULL AND started_at>?)) GROUP BY sbd`,
    `daily_${homNay}`,
    heGio
  )
  const pendingMom = await q(
    `SELECT sbd,SUM(question_count) n FROM mom_bai ${
      where ? where + ' AND' : 'WHERE'
    } submitted_at IS NULL AND id NOT LIKE 'daily_%' AND (started_at IS NULL OR started_at>?) GROUP BY sbd`,
    heGio
  )
  // Chỉ bài BTVN CÒN HẠN; bài quá hạn được kế hoạch ngày liệt kê riêng, không đếm vào tồn đọng.
  const homework = await q(
    `SELECT e.sbd,SUM(b.so_cau) n FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL ${
      sbd ? 'AND e.sbd=?' : ''
    } AND b.han_nop>? GROUP BY e.sbd`,
    nowIso
  )
  const practice = await q(
    `SELECT sbd,submitted_at,result FROM mom_bai WHERE submitted_at IS NOT NULL ${
      sbd ? 'AND sbd=?' : ''
    } ORDER BY submitted_at ASC`
  )
  return { exams, details: applyPracticeOutcomes(details, practice), pendingDaily, pendingMom, homework }
}

type KeHoachDoc = Pick<KeHoachNgay, 'nganSach' | 'tai' | 'tienBo' | 'viec'>

/** Đếm hồ sơ theo em: câu từng sai tới mốc, câu đã sửa tới mốc duy trì, tổng câu chưa khắc phục. Bảng chưa có → 0. */
async function docDemHoSo(env: Env, dsSbd: string[], homNay: string): Promise<Map<string, DemHoSo>> {
  const ra = new Map<string, DemHoSo>()
  for (const s of dsSbd) ra.set(s, { toiHanSai: 0, toiHanDuyTri: 0, chuaKhacPhuc: 0 })
  try {
    for (let i = 0; i < dsSbd.length; i += TOI_DA_EM_MOI_LO) {
      const r = await env.DB.prepare(
        `SELECT sbd, trang_thai, COUNT(*) AS n,
                SUM(CASE WHEN can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ? THEN 1 ELSE 0 END) AS toi_han
           FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc')
          GROUP BY sbd, trang_thai`
      ).bind(homNay, JSON.stringify(dsSbd.slice(i, i + TOI_DA_EM_MOI_LO))).all<Row>()
      for (const x of r.results ?? []) {
        const c = ra.get(String(x.sbd))
        if (!c) continue
        if (x.trang_thai === 'da_khac_phuc') c.toiHanDuyTri += Number(x.toi_han) || 0
        else {
          c.toiHanSai += Number(x.toi_han) || 0
          c.chuaKhacPhuc += Number(x.n) || 0
        }
      }
    }
  } catch (e) {
    if (!/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) throw e
  }
  return ra
}

/** Kế hoạch hôm nay: một em → lập mới (tươi khi phụ huynh mở); cả lớp (cron) → đọc bản đã lưu, em nào chưa có mới lập. */
async function docKeHoach(env: Env, dsSbd: string[], now: number, laMotEm: boolean): Promise<Map<string, KeHoachDoc>> {
  const ra = new Map<string, KeHoachDoc>()
  if (dsSbd.length === 0) return ra
  if (!laMotEm) {
    const homNay = ngayVn(now)
    try {
      for (let i = 0; i < dsSbd.length; i += TOI_DA_EM_MOI_LO) {
        const r = await env.DB.prepare('SELECT sbd, ngan_sach_json, viec_json FROM ke_hoach_ngay WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay = ?')
          .bind(JSON.stringify(dsSbd.slice(i, i + TOI_DA_EM_MOI_LO)), homNay).all<Row>()
        for (const x of r.results ?? []) {
          try {
            const v = JSON.parse(String(x.viec_json)) as Pick<KeHoachNgay, 'viec' | 'tai' | 'tienBo'>
            ra.set(String(x.sbd), { nganSach: JSON.parse(String(x.ngan_sach_json)), viec: v.viec, tai: v.tai, tienBo: v.tienBo })
          } catch { /* dòng hỏng: lập lại bên dưới */ }
        }
      }
    } catch (e) {
      if (!/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) throw e
    }
  }
  const thieu = dsSbd.filter((s) => !ra.has(s))
  for (let i = 0; i < thieu.length; i += TOI_DA_EM_MOI_LO) {
    for (const [s, k] of await lapVaLuuKeHoach(env, thieu.slice(i, i + TOI_DA_EM_MOI_LO), now)) ra.set(s, k)
  }
  return ra
}

export async function refreshDailyNews(env: Env, sbd?: string, now = Date.now()) {
  const d = await data(env, sbd, now)
  const students = sbd ? [{ sbd }] : (await env.DB.prepare('SELECT sbd FROM hoc_sinh').all<{ sbd: string }>()).results
  const dsSbd = students.map((e) => e.sbd)
  const keHoachEm = await docKeHoach(env, dsSbd, now, Boolean(sbd))
  const dem = await docDemHoSo(env, dsSbd, ngayVn(now))
  const maBaiHangNgay = `daily_${newsDay(now)}`
  const reports = students.map((e) => {
    const btvn = Number(d.homework.find((x) => x.sbd === e.sbd)?.n || 0)
    const mom = Number(d.pendingMom.find((x) => x.sbd === e.sbd)?.n || 0)
    const daily = Number(d.pendingDaily.find((x) => x.sbd === e.sbd)?.n || 0)
    const pending = btvn + mom + daily
    const kh = keHoachEm.get(e.sbd)
    return analyzeParent(
      e.sbd,
      d.exams.filter((x) => x.sbd === e.sbd),
      d.details.filter((x) => x.sbd === e.sbd),
      pending,
      now,
      { btvn, mom, daily },
      kh ? tomTatKeHoach(kh, dem.get(e.sbd)!, maBaiHangNgay) : undefined
    )
  })
  const statements = reports.map((r) =>
    env.DB.prepare(
      'INSERT INTO parent_daily_news(sbd,day,updated_at,body) VALUES(?,?,?,?) ON CONFLICT(sbd,day) DO UPDATE SET updated_at=excluded.updated_at,body=excluded.body'
    ).bind(r.sbd, r.day, r.updatedAt, JSON.stringify(r))
  )
  for (let i = 0; i < statements.length; i += 50) await env.DB.batch(statements.slice(i, i + 50))
  return { reports, details: d.details, keHoachEm }
}

export async function parentNews(env: Env, action: string, b: Record<string, unknown>, nguon: 'ph' | 'hs' = 'ph') {
  // 'ph' (mặc định): phụ huynh, token `pass` hoặc SBD trần (giai đoạn mềm, có đếm). 'hs': em đã qua `gameIdentity`, `b.sbd` là SBD từ chữ ký, không đếm.
  let sbd: string
  if (nguon === 'ph') sbd = (await sbdCuaPhuHuynh(env, b, 'parent-news')).sbd
  else {
    sbd = String(b.sbd ?? '').trim()
    if (!sbd || !(await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd=?').bind(sbd).first())) throw new Error('Không tìm thấy số báo danh của con.')
  }
  const now = Date.now()
  const { reports } = await refreshDailyNews(env, sbd, now)
  const report = reports[0]

  if (action === 'list') {
    const history = await env.DB.prepare('SELECT body FROM parent_daily_news WHERE sbd=? ORDER BY day DESC LIMIT 14')
      .bind(sbd)
      .all<{ body: string }>()
    const daily = await env.DB.prepare('SELECT id,submitted_at FROM mom_bai WHERE sbd=? AND id=?')
      .bind(sbd, `daily_${report.day}`)
      .first<{ id: string; submitted_at: string | null }>()
    if (!daily?.submitted_at && report.questionCount > 0 && !report.pendingDetails?.daily) {
      report.pendingDetails = { ...report.pendingDetails, daily: report.questionCount }
      report.pending =
        (report.pendingDetails.btvn || 0) + (report.pendingDetails.mom || 0) + report.pendingDetails.daily
    }
    return { ok: true, report, history: history.results.map((x) => JSON.parse(x.body)), daily }
  }

  if (action !== 'assign') throw new Error('Thao tác không hợp lệ.')
  const id = `daily_${report.day}`
  const existing = await env.DB.prepare('SELECT id FROM mom_bai WHERE sbd=? AND id=?').bind(sbd, id).first()
  if (existing) return { ok: true, alreadySent: true, id }
  if (!report.questionCount) throw new Error(report.reason)

  const { cau: finalQuestions } = await chonCauBaiHangNgay(env, sbd, report.questionCount, now)
  if (!finalQuestions.length) {
    throw new Error('Chưa tìm được câu phù hợp để giao hôm nay. Vui lòng thử lại sau.')
  }

  await mom(env, 'create', {
    sbd,
    id,
    tieuDe: `Ôn tập cá nhân hoá ngày ${report.day} · ${finalQuestions.length} câu`,
    dsCau: finalQuestions,
  }, { noiBo: true }) // lệnh nội bộ: SBD đã được xác thực ở trên, KHÔNG tính là một lượt truy cập của phụ huynh

  return { ok: true, id, questionCount: finalQuestions.length }
}

export function spreadTopics(candidates: Row[], priorities: string[]) {
  const groups = new Map<string, Row[]>()
  for (const q of candidates) {
    const k = String(q.chuyenDe || q.chuyen_de || 'Kiến thức cần ôn')
    const g = groups.get(k) || []
    g.push(q)
    groups.set(k, g)
  }
  const keys = [...priorities.filter((k) => groups.has(k)), ...[...groups.keys()].filter((k) => !priorities.includes(k))]
  const out: Row[] = []
  while (out.length < candidates.length) {
    for (const k of keys) {
      const q = groups.get(k)!.shift()
      if (q) out.push(q)
    }
  }
  return out
}

// Only a later, server-graded practice response supersedes an earlier exam error.
export function applyPracticeOutcomes(details: Row[], practice: Row[]) {
  const updated = details.map((d) => ({ ...d }))
  for (const p of practice) {
    let outcomes: Row[] = []
    try {
      outcomes = JSON.parse(p.result || '{}').questionOutcomes || []
    } catch {
      continue
    }
    for (const o of outcomes) {
      for (const d of updated) {
        if (d.sbd === p.sbd && d.qid === o.qid && Date.parse(p.submitted_at) > Date.parse(d.nop_luc)) {
          d.dung_sai = o.correct ? 1 : 0
          d.nop_luc = p.submitted_at
        }
      }
    }
  }
  return updated
}
