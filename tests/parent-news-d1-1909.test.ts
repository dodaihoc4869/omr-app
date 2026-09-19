// @vitest-environment node
// GĐ 5 — KÊNH 5 trên D1 THẬT (SQLite, lược đồ thật): bài hằng ngày của phụ huynh đọc kế hoạch ngày + hồ sơ + kho.
import { describe, it, expect, vi } from 'vitest'
import worker from '../server/src/index'
import { newsDay, parentNews } from '../server/src/parent-news'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { taoD1That, type D1That } from './_d1-that'

const H = 3_600_000
const iso = (gio: number) => new Date(Date.now() + gio * H).toISOString()

const themHs = (d: D1That, sbd: string, lop = '12') =>
  d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,'x',?,'x')").run(sbd, lop)

const cauKho = (qid: string, dang: string, mucDo: string | null = 'hieu', o: Record<string, unknown> = {}) => ({
  qid, maDe: 'x', version: 'v', group: `g-${qid}`, phan: 'I', text: `Chọn phát biểu đúng về ${qid}.`,
  choices: ['A. a', 'B. b', 'C. c', 'D. d'], ideas: [], hinhAnh: [], dang, tenDang: `Tên ${dang}`, mucDo, sao: 1,
  kienThuc: ['k1'], correct: 'B', solution: 'Lời giải ngắn', reviewed: true, ...o,
})

/** Nạp câu vào kho + chỉ mục game (đúng như `syncIndex`): de_kho, game_v2_index, game_v2_question. */
function themCau(d: D1That, maDe: string, lop: string, cau: ReturnType<typeof cauKho>[]) {
  d.sql.prepare("INSERT OR IGNORE INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,0,'v1')").run(maDe, maDe, lop, cau.length, `kho/${maDe}.json`)
  d.sql.prepare("INSERT OR IGNORE INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,'v1','x')").run(maDe)
  for (const c of cau) {
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(maDe, c.qid, 'v', c.group, c.dang, JSON.stringify({ ...c, maDe }))
  }
}

async function ghi(d: D1That, sbd: string, ds: { qid: string; kq: 0 | 1; gio: number }[]) {
  const r = await ghiSuKien(
    d.env,
    ds.map((x, i): SuKien => ({ nguon: 'btvn', maNguon: 'B1', sbd, qid: x.qid, lan: i + 1, ketQua: x.kq, luc: iso(x.gio) })),
  )
  expect(r.ok).toBe(true)
}

function themBtvn(d: D1That, sbd: string, ma: string, soCau: number, giaoGio: number, hanGio: number) {
  d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run(ma, 'CA', 'DE', soCau, iso(giaoGio), iso(hanGio), 'x')
  d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd) VALUES(?,?,?)').run(`${ma}|${sbd}`, ma, sbd)
}

const themMom = (d: D1That, sbd: string, id: string, soCau: number, batDauGio: number | null) =>
  d.sql.prepare('INSERT INTO mom_bai(sbd,id,title,created_at,question_count,bank_key,started_at) VALUES(?,?,?,?,?,?,?)')
    .run(sbd, id, 't', iso(-30), soCau, `mom/${sbd}/${id}.json`, batDauGio === null ? null : iso(batDauGio))

async function docBaiMom(d: D1That, sbd: string, id: string): Promise<Record<string, any>[]> {
  const r = d.sql.prepare('SELECT bank_key FROM mom_bai WHERE sbd=? AND id=?').get(sbd, id) as { bank_key: string } | undefined
  expect(r).toBeDefined()
  const o = await d.env.DE.get(r!.bank_key)
  return (await new Response(o!.body).json()) as Record<string, any>[]
}

/** Em S1 (lớp 12) có 3 câu SAI cách đây 3 ngày ở dạng ES.A.X → tới mốc ôn hôm nay; kho có thêm câu cùng dạng, khác lớp, đề bảo vệ. */
async function dungEmCoHoSo() {
  const d = taoD1That()
  themHs(d, 'S1', '12')
  themCau(d, 'DE12', '12', [
    cauKho('T1', 'ES.A.X'), cauKho('T2', 'ES.A.X'), cauKho('T3', 'ES.A.X'),
    cauKho('N1', 'ES.A.X', 'biet'), cauKho('N2', 'ES.A.X', 'hieu'), cauKho('N3', 'ES.A.X', 'van_dung'),
    cauKho('E1', 'ES.B.Y', 'biet'), cauKho('E2', 'ES.B.Y', 'hieu'), cauKho('G1', 'GL.C.Z', 'biet'),
    cauKho('PROT-1', 'ES.A.X', 'hieu'),
    ...['3', '4', '5', '6'].map((k) => cauKho(`E${k}`, 'ES.B.Y', 'biet')), ...['2', '3', '4', '5'].map((k) => cauKho(`G${k}`, 'GL.C.Z', 'biet')),
  ])
  themCau(d, 'DE11', '11', [cauKho('L11-1', 'ES.A.X', 'hieu'), cauKho('L11-2', 'ES.A.X', 'biet'), cauKho('L11-3', 'ES.B.Y', 'biet')])
  await ghi(d, 'S1', [{ qid: 'T1', kq: 0, gio: -72 }, { qid: 'T2', kq: 0, gio: -72 }, { qid: 'T3', kq: 0, gio: -72 }])
  // Đề thi CHƯA công bố: ca mở, bank R2 chứa PROT-1 → câu này không được lọt vào bài phụ huynh.
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('CAP','Ca chưa công bố','mo',?,?,45,'thi','khong','key/CAP.json','x')").run(iso(24), iso(30))
  await d.env.DE.put('key/CAP.json', JSON.stringify({ phanI: [{ id: 'PROT-1', text: 'Chọn phát biểu đúng về PROT-1.', choices: ['A. a', 'B. b', 'C. c', 'D. d'], correct: 'B', dang: { ma: 'ES.A.X' }, mucDo: 'hieu', kienThuc: ['k1'] }] }))
  return d
}

describe('Kênh 5 trên D1 thật: số câu = phần dư ngân sách ngày', () => {
  it('em không có bài: số câu giao = mục tiêu ngày của kế hoạch (8–16), lý do nói bằng số', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    const { report } = (await parentNews(d.env, 'list', { sbd: 'S1' })) as { report: Record<string, any> }
    expect(report.phanDu.mucTieuCau).toBeGreaterThanOrEqual(8)
    expect(report.phanDu.mucTieuCau).toBeLessThanOrEqual(16)
    expect(report.questionCount).toBe(Math.max(0, report.phanDu.mucTieuCau - report.phanDu.taiCung - report.phanDu.daLamCau))
    expect(report.reason).toContain(`${report.phanDu.mucTieuCau} câu`)
    expect(report.reason).not.toContain('—')
  })

  it('con còn nhiều việc Thầy giao (bốn bài, mỗi bài 30 câu hạn 20 giờ): không giao thêm, nói rõ con số; giao bài thì báo đúng lý do đó', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    for (const ma of ['BIG1', 'BIG2', 'BIG3', 'BIG4']) themBtvn(d, 'S1', ma, 30, -2, 20)
    const { report } = (await parentNews(d.env, 'list', { sbd: 'S1' })) as { report: Record<string, any> }
    expect(report.phanDu.taiCung).toBeGreaterThanOrEqual(report.phanDu.mucTieuCau)
    expect(report.questionCount).toBe(0)
    expect(report.reason).toContain('Mục tiêu hôm nay')
    expect(report.reason).toContain('Chưa cần giao thêm')
    await expect(parentNews(d.env, 'assign', { sbd: 'S1' })).rejects.toThrow('Chưa cần giao thêm')
    expect(d.dem('mom_bai')).toBe(0)
  })

  it('tồn đọng chỉ đếm bài CÒN HẠN: daily_ ngày cũ chưa bắt đầu, BTVN quá hạn, Mom đã bắt đầu quá 2 giờ đều bị bỏ', async () => {
    const d = taoD1That()
    themHs(d, 'S1')
    const homNay = newsDay(Date.now())
    themMom(d, 'S1', 'daily_2020-01-01', 6, null) // daily_ ngày cũ, chưa bắt đầu → bỏ
    themMom(d, 'S1', `daily_${homNay}`, 4, null) // daily_ hôm nay → tính
    themMom(d, 'S1', 'M-CHUA-BD', 5, null) // Mom mẹ giao tay, chưa bắt đầu (không hạn) → tính
    themMom(d, 'S1', 'M-QUA-2H', 7, -3) // bắt đầu cách 3 giờ, hết 120 phút → bỏ
    themMom(d, 'S1', 'M-DANG-LAM', 3, -0.5) // bắt đầu 30 phút trước → tính
    themBtvn(d, 'S1', 'HET-HAN', 10, -72, -24) // hạn đã qua → bỏ
    themBtvn(d, 'S1', 'CON-HAN', 8, -1, 96) // còn hạn → tính
    const { report } = (await parentNews(d.env, 'list', { sbd: 'S1' })) as { report: Record<string, any> }
    expect(report.pendingDetails).toEqual({ btvn: 8, mom: 5 + 3, daily: 4 })
    expect(report.pending).toBe(8 + 8 + 4)
  })
})

describe('Kênh 5 trên D1 thật: chọn câu cho bài hằng ngày', () => {
  it('câu tới hạn đứng đầu, rồi câu MỚI cùng dạng yếu; đúng lớp; không lọt đề chưa công bố; id là qid thật; có đáp án cho Mom', async () => {
    const d = await dungEmCoHoSo()
    const l = (await parentNews(d.env, 'list', { sbd: 'S1' })) as { report: Record<string, any> }
    expect(l.report.keHoach.soCauSuaLoi).toBe(3)
    expect(l.report.wrong).toBe(3)
    const soCan = l.report.questionCount
    expect(soCan).toBeGreaterThanOrEqual(8)

    const r = (await parentNews(d.env, 'assign', { sbd: 'S1' })) as Record<string, any>
    expect(r.ok).toBe(true)
    expect(r.questionCount).toBe(soCan)
    const cau = await docBaiMom(d, 'S1', r.id)
    const qid = cau.map((c) => c.qid)
    // 3 câu tới hạn (sai 3 ngày trước) là ba câu đầu; cùng mốc, cùng số lần sai nên thứ tự theo seed, nên so theo tập.
    expect(new Set(qid.slice(0, 3))).toEqual(new Set(['T1', 'T2', 'T3']))
    expect(new Set(qid).size).toBe(qid.length)
    // Không lớp 11, không đề đang bảo vệ, không câu vận dụng (bậc dạng mặc định là "hiểu").
    expect(qid.filter((q) => q.startsWith('L11-'))).toEqual([])
    expect(qid).not.toContain('PROT-1')
    expect(qid).not.toContain('N3')
    // Dạng ES.A.X còn câu mới N1, N2 → đứng ngay sau ba câu tới hạn.
    expect(new Set(qid.slice(3, 5))).toEqual(new Set(['N1', 'N2']))
    for (const c of cau) {
      expect(c.id).toBe(c.qid)
      expect(String(c.id)).not.toMatch(/^cau_\d+$/)
      expect(c.dapAn).toBe('B')
      expect(Array.isArray(c.choices)).toBe(true)
    }
    // Sổ Mom đã có đúng bản ghi.
    expect(d.dem('mom_bai', "id LIKE 'daily_%'")).toBe(1)
  })

  it('giao một lần trong ngày: bấm lần hai trả alreadySent, không tạo bài thứ hai', async () => {
    const d = await dungEmCoHoSo()
    const a = (await parentNews(d.env, 'assign', { sbd: 'S1' })) as Record<string, any>
    const b = (await parentNews(d.env, 'assign', { sbd: 'S1' })) as Record<string, any>
    expect(a.ok && !a.alreadySent).toBe(true)
    expect(b).toMatchObject({ ok: true, alreadySent: true, id: a.id })
    expect(d.dem('mom_bai', "id LIKE 'daily_%'")).toBe(1)
  })

  it('câu vừa làm trong 3 ngày qua KHÔNG được giao lại làm câu mới, nhưng câu tới hạn vẫn ôn', async () => {
    const d = await dungEmCoHoSo()
    await ghi(d, 'S1', [{ qid: 'N1', kq: 1, gio: -24 }, { qid: 'E1', kq: 1, gio: -5 }])
    const r = (await parentNews(d.env, 'assign', { sbd: 'S1' })) as Record<string, any>
    const qid = (await docBaiMom(d, 'S1', r.id)).map((c) => c.qid)
    expect(qid).not.toContain('N1')
    expect(qid).not.toContain('E1')
    expect(qid).toEqual(expect.arrayContaining(['T1', 'T2', 'T3']))
  })

  it('em mới chưa có hồ sơ: bài vẫn đủ câu từ kho, chỉ đúng lớp của em (lỗi cũ: kho luôn rỗng vì đọc sai tên trường)', async () => {
    const d = taoD1That()
    themHs(d, 'S2', '11')
    themCau(d, 'DE12', '12', ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => cauKho(`L12-${k}`, 'ES.A.X', 'biet')))
    themCau(d, 'DE11', '11', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((k, i) => cauKho(`L11-${k}`, i % 2 ? 'ES.A.X' : 'GL.B.Y', 'biet')))
    const r = (await parentNews(d.env, 'assign', { sbd: 'S2' })) as Record<string, any>
    expect(r.ok).toBe(true)
    const qid = (await docBaiMom(d, 'S2', r.id)).map((c) => c.qid)
    expect(qid.length).toBe(r.questionCount)
    expect(qid.length).toBeGreaterThanOrEqual(8)
    expect(qid.every((q) => q.startsWith('L11-'))).toBe(true)
  })

  it('kho không có câu nào dùng được: báo lỗi rõ, KHÔNG tạo bài rỗng', async () => {
    const d = taoD1That()
    themHs(d, 'S3', '12')
    await expect(parentNews(d.env, 'assign', { sbd: 'S3' })).rejects.toThrow('Chưa tìm được câu phù hợp')
    expect(d.dem('mom_bai')).toBe(0)
  })

  it('SBD không có thật: từ chối, không ghi gì', async () => {
    const d = taoD1That()
    await expect(parentNews(d.env, 'assign', { sbd: '00000000' })).rejects.toThrow('Không tìm thấy số báo danh')
    expect(d.dem('mom_bai')).toBe(0)
    expect(d.dem('ke_hoach_ngay')).toBe(0)
  })

  it('bài của em chỉ dùng qid thật: sau khi nộp, sổ ghi đủ số câu (không còn câu cau_N bị bỏ)', async () => {
    const d = await dungEmCoHoSo()
    const a = (await parentNews(d.env, 'assign', { sbd: 'S1' })) as Record<string, any>
    const cau = await docBaiMom(d, 'S1', a.id)
    expect(cau.every((c) => typeof c.qid === 'string' && !/^cau_\d+$/.test(c.qid))).toBe(true)
  })
})

describe('Kênh 5: cron 00:01 VN', () => {
  it('kế hoạch ngày chạy TRƯỚC tin phụ huynh: tin của mỗi em mang đúng ngân sách của kế hoạch đã lưu', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-20T17:01:00.000Z')) // 00:01 ngày 21/09 giờ VN, đúng giờ cron
    try {
      const d = taoD1That()
      themHs(d, 'S1')
      themHs(d, 'S2')
      themBtvn(d, 'S2', 'B1', 30, -2, 60)
      await worker.scheduled({ cron: '1 17 * * *' }, d.env)
      expect(d.dem('ke_hoach_ngay', "ngay='2026-09-21'")).toBe(2)
      for (const sbd of ['S1', 'S2']) {
        const tin = d.sql.prepare('SELECT body FROM parent_daily_news WHERE sbd=? AND day=?').get(sbd, '2026-09-21') as { body: string }
        const kh = d.sql.prepare('SELECT ngan_sach_json FROM ke_hoach_ngay WHERE sbd=? AND ngay=?').get(sbd, '2026-09-21') as { ngan_sach_json: string }
        const b = JSON.parse(tin.body)
        expect(b.phanDu).not.toBeNull()
        expect(b.phanDu.mucTieuCau).toBe(JSON.parse(kh.ngan_sach_json).mucTieuCau)
        expect(b.questionCount).toBe(Math.max(0, b.phanDu.mucTieuCau - b.phanDu.taiCung - b.phanDu.daLamCau))
      }
    } finally {
      vi.useRealTimers()
    }
  })
})
