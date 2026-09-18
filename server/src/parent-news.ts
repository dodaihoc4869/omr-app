import type {Env} from './kieu'
import {hsCauSai} from './goi-cu'
import {mom} from './mom'
import {hopLe3DangChuan} from './loc-cau-chuan'

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
 * THUẬT TOÁN CÁ NHÂN HOÁ HÀNG NGÀY (Spaced Repetition & Cognitive Scaffolding)
 * Luôn đề xuất ÍT NHẤT 12 CÂU mỗi ngày theo hướng nâng đỡ, củng cố và tiến bộ đều đặn.
 */
export function analyzeParent(
  sbd: string,
  exams: Row[],
  details: Row[],
  pending: number,
  now = Date.now(),
  pendingDetails?: { btvn: number; mom: number; daily: number }
) {
  const day = newsDay(now)
  const today = exams.filter(
    (e) => new Date(Date.parse(e.nop_luc) + 7 * 3600000).toISOString().slice(0, 10) === day
  )
  const latest = exams[0]
  const scores = today.filter((e) => e.tong != null).map((e) => Number(e.tong))
  const relevantWrong = details.filter((d) => d.dung_sai === 0)
  const relevantCorrect = details.filter((d) => d.dung_sai === 1)

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

  // THUẬT TOÁN ĐỀ XUẤT THÍCH ỨNG (Adaptive Pacing & Workload Balancing):
  // Không áp đặt số câu cứng nhắc. Tính toán dựa trên 2 yếu tố cốt lõi:
  // 1. Tồn đọng bài tập (Pending Backlog): số bài/câu đang chờ làm
  // 2. Tốc độ làm bài thực tế (Speed/Pacing): số giây trung bình mỗi câu
  const tongBaiPending = pendingDetails
    ? (pendingDetails.btvn || 0) + (pendingDetails.mom || 0) + (pendingDetails.daily || 0)
    : 0
  const tongTonDong = Math.max(pending, tongBaiPending)

  let targetCount = 12
  let lyDoDieuChinh = ''

  if (tongTonDong >= 15) {
    // TỒN ĐỌNG LỚN (>= 15 bài/câu): Giảm tải tối đa, chia nhỏ chỉ 6-8 câu Vòng 1 Lõi Căn Bản
    // để học sinh gỡ nợ bài tập dần, giải tỏa áp lực tâm lý, không bị nản lòng.
    targetCount = 6
    lyDoDieuChinh = `Đang tồn đọng ${tongTonDong} bài/câu chưa nộp — thuật toán tự động giảm tải xuống ${targetCount} câu trọng tâm Vòng 1 (Lõi Căn Bản) để gỡ bài tập nhẹ nhàng, vừa sức.`
  } else if (tongTonDong >= 6) {
    // TỒN ĐỌNG VỪA (6 - 14 bài/câu): Rút gọn 8-10 câu cân bằng
    targetCount = sec > 100 ? 8 : 10
    lyDoDieuChinh = `Đang có ${tongTonDong} bài/câu cần hoàn thành — kế hoạch rút gọn ${targetCount} câu tập trung giải quyết dứt điểm các lỗi sai cốt lõi.`
  } else {
    // TỒN ĐỌNG THẤP (<= 5 bài/câu): Điều chỉnh theo tốc độ và đà học tập
    if (sec > 130) {
      // Học sinh cần nhiều thời gian suy nghĩ (> 2 phút/câu) -> giữ mức 10 câu để buổi học dưới 20 phút
      targetCount = 10
      lyDoDieuChinh = `Tốc độ suy nghĩ kỹ lưỡng (~${Math.round(sec)}s/câu) — tối ưu ${targetCount} câu để đảm bảo chất lượng, không kéo dài thời gian.`
    } else if (today.length >= 2 && exams.length >= 6 && tongTonDong === 0 && sec <= 60) {
      // Phong độ xuất sắc, tốc độ nhanh, không tồn bài -> nâng lên 16-18 câu có thêm Vòng 3 Thử Thách x2 EXP
      targetCount = 18
      lyDoDieuChinh = `Phong độ xuất sắc và hoàn thành nhanh — mở rộng ${targetCount} câu (gồm câu Vòng 3 Thử Thách thưởng x2 EXP Thần Thú).`
    } else if (today.length >= 1 && tongTonDong <= 2) {
      targetCount = 14
      lyDoDieuChinh = `Tiến độ đều đặn — kế hoạch ${targetCount} câu theo mô hình 3 Vòng Phân Tầng để bồi đắp kiến thức.`
    } else {
      targetCount = 12
      lyDoDieuChinh = `Kế hoạch chuẩn mực 12 câu/ngày theo 3 Vòng Phân Tầng.`
    }
  }

  // Nếu tồn đọng quá nghiêm trọng (> 40 câu), tạm hoãn giao thêm để tập trung làm bài cũ
  const quaTai = tongTonDong >= 40

  // Phân chia cấu trúc câu theo 3 Vòng Phân Tầng Thông Minh:
  // Vòng 1: Lõi căn bản / Sửa lỗi cốt lõi (khoảng 50-60% target)
  const soCauSuaLoi = Math.min(relevantWrong.length, Math.round(targetCount * 0.55))
  const conLai = Math.max(0, targetCount - soCauSuaLoi)
  // Vòng 2: Trọng tâm cá nhân / Chống quên (Spaced Repetition)
  const soCauOnBaiCu = Math.min(relevantCorrect.length, Math.round(conLai * 0.6))
  // Vòng 3: Tiến bộ dạng mới / Thử thách bứt phá
  const soCauTienBo = Math.max(0, conLai - soCauOnBaiCu)

  const count = quaTai ? 0 : targetCount
  const assignmentCount = count > 0 ? 1 : 0
  const minutes = Math.max(10, Math.ceil((count * sec) / 60))

  const keHoach: KeHoachLuyenTap = {
    tongCau: count,
    soCauSuaLoi,
    soCauOnBaiCu,
    soCauTienBo,
    phuongPhap: '3 Vòng Phân Tầng & Điều chỉnh nhịp độ thích ứng (Adaptive Pacing)',
  }

  const mode =
    tongTonDong >= 15
      ? `Gỡ tồn đọng & Nâng đỡ Lõi (${count} câu)`
      : relevantWrong.length > 0
      ? `Khắc phục lỗi sai & Nâng đỡ (${count} câu)`
      : `Rèn phản xạ & Thử thách (${count} câu)`

  const weak = [...topics]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  let reason = ''
  if (quaTai) {
    reason = `Con đang còn ${tongTonDong} bài/câu chưa nộp; tạm hoãn giao thêm để con tập trung hoàn thành bài đang chờ, tránh áp lực quá tải.`
  } else if (tongTonDong >= 15) {
    reason = `Học sinh đang có ${tongTonDong} bài chưa nộp. Thuật toán tự động giảm tải xuống bài ngắn ${targetCount} câu (Vòng 1: Lõi Căn Bản) để con gỡ nợ bài tập nhẹ nhàng, vừa sức và không bị áp lực.`
  } else if (relevantWrong.length > 0) {
    reason = `Kế hoạch ${targetCount} câu hôm nay (${lyDoDieuChinh}): ${soCauSuaLoi} câu Vòng 1 sửa lỗi chuyên đề (${weak.map((w) => w.name).slice(0, 2).join(', ')}), ${soCauOnBaiCu} câu Vòng 2 chống quên ngắt quãng, và ${soCauTienBo} câu Vòng 3 tiến bộ vừa sức.`
  } else {
    reason = `Con hoàn thành rất tốt các bài thi! Kế hoạch ${targetCount} câu hôm nay (${lyDoDieuChinh}) áp dụng mô hình 3 Vòng Phân Tầng để duy trì phản xạ và phát triển tư duy nâng cao.`
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
    wrong: relevantWrong.length,
    pending,
    pendingDetails: pendingDetails || { btvn: 0, mom: 0, daily: 0 },
    questionCount: count,
    assignmentCount,
    minutes,
    mode,
    modeKey: score !== null && score < 5 ? 'basic' : 'adaptive',
    speedMeasured: seconds.length >= 5,
    reason,
  }
}

async function data(env: Env, sbd?: string) {
  const where = sbd ? ' WHERE sbd=?' : ''
  const q = async (sql: string) => {
    const st = env.DB.prepare(sql)
    return (await (sbd ? st.bind(sbd) : st).all<Row>()).results
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
  const pendingDaily = await q(
    `SELECT sbd,SUM(question_count) n FROM mom_bai ${
      where ? where + ' AND' : 'WHERE'
    } submitted_at IS NULL AND id LIKE 'daily_%' GROUP BY sbd`
  )
  const pendingMom = await q(
    `SELECT sbd,SUM(question_count) n FROM mom_bai ${
      where ? where + ' AND' : 'WHERE'
    } submitted_at IS NULL AND id NOT LIKE 'daily_%' GROUP BY sbd`
  )
  const homework = await q(
    `SELECT e.sbd,SUM(b.so_cau) n FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL ${
      sbd ? 'AND e.sbd=?' : ''
    } GROUP BY e.sbd`
  )
  const practice = await q(
    `SELECT sbd,submitted_at,result FROM mom_bai WHERE submitted_at IS NOT NULL ${
      sbd ? 'AND sbd=?' : ''
    } ORDER BY submitted_at ASC`
  )
  return { exams, details: applyPracticeOutcomes(details, practice), pendingDaily, pendingMom, homework }
}

export async function refreshDailyNews(env: Env, sbd?: string) {
  const d = await data(env, sbd)
  const students = sbd ? [{ sbd }] : (await env.DB.prepare('SELECT sbd FROM hoc_sinh').all<{ sbd: string }>()).results
  const reports = students.map((e) => {
    const btvn = Number(d.homework.find((x) => x.sbd === e.sbd)?.n || 0)
    const mom = Number(d.pendingMom.find((x) => x.sbd === e.sbd)?.n || 0)
    const daily = Number(d.pendingDaily.find((x) => x.sbd === e.sbd)?.n || 0)
    const pending = btvn + mom + daily
    return analyzeParent(
      e.sbd,
      d.exams.filter((x) => x.sbd === e.sbd),
      d.details.filter((x) => x.sbd === e.sbd),
      pending,
      Date.now(),
      { btvn, mom, daily }
    )
  })
  const statements = reports.map((r) =>
    env.DB.prepare(
      'INSERT INTO parent_daily_news(sbd,day,updated_at,body) VALUES(?,?,?,?) ON CONFLICT(sbd,day) DO UPDATE SET updated_at=excluded.updated_at,body=excluded.body'
    ).bind(r.sbd, r.day, r.updatedAt, JSON.stringify(r))
  )
  for (let i = 0; i < statements.length; i += 50) await env.DB.batch(statements.slice(i, i + 50))
  return { reports, details: d.details }
}

/**
 * LẤY CÂU BỔ SUNG TỪ KHO ĐỀ (R2) KHI HỌC SINH CHƯA ĐỦ 12 CÂU TỪ LỊCH SỬ THI
 */
async function layCauTuKhoDe(env: Env, slCan = 12): Promise<Row[]> {
  const ra: Row[] = []
  if (!env.DE) return ra
  try {
    const dsDe = await env.DB.prepare('SELECT ma_de FROM de_kho LIMIT 6').all<{ ma_de: string }>()
    for (const d of dsDe.results ?? []) {
      if (ra.length >= slCan) break
      try {
        const o = await env.DE.get(`kho/${d.ma_de}.json`)
        if (!o?.body) continue
        const goi = (await new Response(o.body).json()) as any
        const gom: any[] = Array.isArray(goi.cau) ? goi.cau : []
        for (const k of ['phanI', 'phanII', 'phanIII']) if (Array.isArray(goi[k])) gom.push(...goi[k])
        for (const c of gom) {
          if (!c || !c.text || !c.dapAnDung) continue
          if (
            !hopLe3DangChuan({
              phan: c.phan || 'I',
              text: c.text,
              dapAnDung: c.dapAnDung,
              choices: c.choices,
              ideas: c.ideas,
              maDe: d.ma_de,
            })
          ) {
            continue
          }
          ra.push({
            id: c.id || c.qid || `${d.ma_de}_${ra.length + 1}`,
            qid: c.id || c.qid || `${d.ma_de}_${ra.length + 1}`,
            text: c.text,
            choices: c.choices || [],
            dapAnDung: c.dapAnDung,
            dapAn: c.dapAnDung,
            loiGiai: c.loiGiai || '',
            chuyenDe: c.chuyenDe || 'Kiến thức trọng tâm',
            mucDo: c.mucDo || 'nb',
            phan: c.phan || 'I',
          })
          if (ra.length >= slCan) break
        }
      } catch {}
    }
  } catch {}
  return ra
}

export async function parentNews(env: Env, action: string, b: Record<string, unknown>) {
  const sbd = String(b.sbd ?? '').trim()
  if (!sbd || !(await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd=?').bind(sbd).first())) {
    throw new Error('Không tìm thấy số báo danh của con.')
  }
  const { reports } = await refreshDailyNews(env, sbd)
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

  // LẤY TOÀN BỘ CÂU ĐÃ THI CỦA EM (chiSai: false để lấy cả câu đúng cho Spaced Repetition)
  const result = await hsCauSai(env, { sbd, chiSai: false, dsMaCa: [] })
  const allExamItems = (result.items || []) as Row[]

  // Lọc sạch 100%, KHÓA VĨNH VIỄN MỌI CÂU TỰ LUẬN, CHỈ GIỮ LẠI 3 DẠNG CHUẨN
  const allValidItems = allExamItems.filter((q) =>
    hopLe3DangChuan({
      phan: q.phan,
      text: q.text,
      dapAnDung: q.dapAnDung,
      choices: q.choices,
      ideas: q.ideas,
      maDe: q.maCa,
    })
  )

  const wrongPool = allValidItems.filter((q) => !q.dungSai && q.text && q.dapAnDung)
  const correctPool = allValidItems.filter((q) => q.dungSai && q.text && q.dapAnDung)

  // Sắp xếp câu sai theo chuyên đề yếu, ưu tiên câu cơ bản 1 sao trước (nâng đỡ)
  let sortedWrong = spreadTopics(wrongPool, report.weak.map((t) => t.name))
  sortedWrong.sort((a, b) => Number(a.sao || 0) - Number(b.sao || 0))

  // Sắp xếp câu đúng từ các ca trước (lặp lại ngắt quãng chống quên)
  const sortedCorrect = spreadTopics(correctPool, report.weak.map((t) => t.name))

  const selectedQids = new Set<string>()
  const dsCau: Row[] = []

  // 1. Nhặt câu sửa lỗi theo kế hoạch
  const mucSuaLoi = report.keHoach?.soCauSuaLoi ?? Math.min(sortedWrong.length, 7)
  for (const q of sortedWrong) {
    if (dsCau.length >= mucSuaLoi) break
    const qid = String(q.qid || q.id)
    if (!selectedQids.has(qid)) {
      selectedQids.add(qid)
      dsCau.push(q)
    }
  }

  // 2. Nhặt câu ôn tập bài cũ (Spaced Repetition)
  const mucOnBaiCu = (report.keHoach?.soCauOnBaiCu ?? 3) + (mucSuaLoi - dsCau.length)
  for (const q of sortedCorrect) {
    if (dsCau.length >= mucSuaLoi + mucOnBaiCu) break
    const qid = String(q.qid || q.id)
    if (!selectedQids.has(qid)) {
      selectedQids.add(qid)
      dsCau.push(q)
    }
  }

  // 3. Nếu chưa đủ 12 câu, lấy thêm câu sai hoặc câu đúng còn lại
  for (const q of [...sortedWrong, ...sortedCorrect]) {
    if (dsCau.length >= report.questionCount) break
    const qid = String(q.qid || q.id)
    if (!selectedQids.has(qid)) {
      selectedQids.add(qid)
      dsCau.push(q)
    }
  }

  // 4. Nếu học sinh có quá ít câu thi trong lịch sử, lấy bổ sung từ kho đề chuẩn
  if (dsCau.length < report.questionCount) {
    const extra = await layCauTuKhoDe(env, report.questionCount - dsCau.length)
    for (const q of extra) {
      if (dsCau.length >= report.questionCount) break
      const qid = String(q.qid || q.id)
      if (!selectedQids.has(qid)) {
        selectedQids.add(qid)
        dsCau.push(q)
      }
    }
  }

  const finalQuestions = dsCau.map((q) => ({
    ...q,
    id: q.qid || q.id,
    dapAn: q.dapAnDung,
    choices: q.phan === 'II' ? [] : q.choices,
    loiGiai: q.loiGiai,
  }))

  if (!finalQuestions.length) {
    throw new Error('Chưa tải đủ nội dung câu hỏi để giao. Vui lòng thử lại sau.')
  }

  await mom(env, 'create', {
    sbd,
    id,
    tieuDe: `Ôn tập cá nhân hoá ngày ${report.day} · ${finalQuestions.length} câu`,
    dsCau: finalQuestions,
  })

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
