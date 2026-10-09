// @vitest-environment node
// LUẬT THẦY 05/10 ("chặn chuẩn 100% không được rút nhầm kho khác khối"): kênh tự động chặn câu KHÔNG RÕ khối ⇒ câu trong kho giả ghi khối `lop` (đúng khối em).
// APP PHỤ HUYNH MỚI 28/09 — ba lệnh CHỈ-ĐỌC (server/src/ph-bao-cao-moi.ts) trên D1 thật (node:sqlite, lược đồ đủ migration):
// báo cáo một ca + nhận xét thầy (chặn theo luật công bố), lời thầy các ca đã công bố, Game Hoá 2.0 của con (KHÔNG chốt kế hoạch thay con).
import { describe, expect, it } from 'vitest'
import { taoD1That, type D1That } from './_d1-that'
import { phBaoCaoCa, phHoc2, phLoiThay, TOI_DA_LOI_THAY } from '../server/src/ph-bao-cao-moi'
import { gvChienDich } from '../server/src/srs2-gv'
import { layKeHoachHomNay } from '../server/src/srs2-d1'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import { gvNhanXetCaEm } from '../server/src/ca-thi-them'
import type { Env } from '../server/src/kieu'

const T0 = Date.parse('2026-09-30T07:59:00Z') // 14:59 Thứ Tư 30/09 giờ VN
const NGAY_MS = 86_400_000

function dung(): { d: D1That; env: Env } {
  const d = taoD1That()
  d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Nguyễn Minh Anh','12A1','mk','x'),('S2','Trần Bảo','12A1','mk','x')")
  return { d, env: d.env as unknown as Env }
}
const themCa = (d: D1That, ma: string, congBo: string | null, trangThai: string, ten: string) =>
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,cong_bo,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(ma, ten, trangThai, 'thi', congBo, 'x')
const themLuot = (d: D1That, ma: string, sbd: string, tong: number, nop = '2026-09-26T08:42:00.000Z') =>
  d.sql.prepare('INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,vao_luc,nop_luc,trang_thai,cap_nhat_luc,tong,diem_i,diem_ii,diem_iii,ho_ten) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|${sbd}|1`, ma, sbd, 1, '2026-09-26T07:55:00.000Z', nop, 'da_nop', 'x', tong, 3.75, 2.75, 1.25, `Em ${sbd}`)
const themCt = (d: D1That, ma: string, sbd: string, so: number, qid: string, chon: string, dung: string, dungSai: number) =>
  d.sql.prepare('INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,chuyen_de,muc_do,dap_an_chon,dap_an_dung,dung_sai,giay,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(`${ma}|${sbd}|1|I|${so}`, ma, sbd, 1, 'I', so, qid, 'Ester', 'hieu', chon, dung, dungSai, 40, 'x')
const moiKhoa = (v: unknown, ra: string[] = []): string[] => {
  if (Array.isArray(v)) v.forEach((x) => moiKhoa(x, ra))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { ra.push(k); moiKhoa(x, ra) }
  return ra
}
const KHOA_GAME = ['exp', 'expDaCong', 'thanThu', 'than_thu', 'vang', 'ruong', 'khien', 'doan', 'dao', 'theLuc', 'hangTrongLop']

async function dungCa(congBo: string | null, trangThai: string) {
  const { d, env } = dung()
  themCa(d, 'CA1', congBo, trangThai, 'Ester – Lipid')
  themLuot(d, 'CA1', 'S1', 7.75)
  themLuot(d, 'CA1', 'S2', 6)
  themCt(d, 'CA1', 'S1', 1, 'Q-1', 'B', 'C', 0)
  themCt(d, 'CA1', 'S1', 2, 'Q-2', 'A', 'A', 1)
  await gvNhanXetCaEm(env, { maCa: 'CA1', sbd: 'S1', noiDung: 'Con mất điểm ở bài đốt cháy ester.' }, T0)
  return { d, env }
}

describe('/ph/bao-cao-ca — báo cáo một ca của con', () => {
  it('ca CHƯA công bố ⇒ chỉ ca + congBo: không điểm, không đáp án, KHÔNG nhận xét của thầy', async () => {
    const { env } = await dungCa('khong', 'dong')
    const r = await phBaoCaoCa(env, { sbd: 'S1', maCa: 'CA1' }, T0)
    expect(r.ok).toBe(true)
    expect((r.congBo as { daCongBo: boolean }).daCongBo).toBe(false)
    const s = JSON.stringify(r)
    for (const cam of ['ketQua', 'nhanXet', '7.75', 'đốt cháy', '"dapAnDung"', 'cauCanXemLai']) expect(s, cam).not.toContain(cam)
  })

  it('ca ĐÃ công bố ⇒ điểm + nhận xét của thầy; không EXP, không hạng trong lớp, không khoá game', async () => {
    const { env } = await dungCa('ngay', 'dong')
    const r = await phBaoCaoCa(env, { sbd: 'S1', maCa: 'CA1' }, T0)
    expect(r.ok).toBe(true)
    expect((r.ketQua as { tong: number }).tong).toBe(7.75)
    expect((r.nhanXet as { noiDung: string }).noiDung).toBe('Con mất điểm ở bài đốt cháy ester.')
    const khoa = moiKhoa(r)
    for (const cam of KHOA_GAME) expect(khoa, cam).not.toContain(cam)
  })

  it('thiếu mã ca ⇒ lỗi có chữ; SBD không có thật ⇒ ném (không trả dữ liệu em khác)', async () => {
    const { env } = await dungCa('ngay', 'dong')
    expect(await phBaoCaoCa(env, { sbd: 'S1' }, T0)).toMatchObject({ ok: false, lyDo: 'thieu' })
    await expect(phBaoCaoCa(env, { sbd: 'KHONG-CO', maCa: 'CA1' }, T0)).rejects.toThrow('Không tìm thấy số báo danh của con.')
  })
})

describe('/ph/loi-thay — nhận xét của thầy ở các ca đã công bố', () => {
  it('chưa có bảng nhận xét (thầy chưa lưu lần nào) ⇒ {ok:true}, không khối', async () => {
    const { env } = dung()
    expect(await phLoiThay(env, { sbd: 'S1' }, T0)).toEqual({ ok: true })
  })

  it('chỉ ca ĐÃ công bố, của CHÍNH con; mới trước; kèm điểm và lúc nộp', async () => {
    const { d, env } = await dungCa('ngay', 'dong')
    themCa(d, 'CA2', 'khong', 'dong', 'Ca chưa công bố')
    themLuot(d, 'CA2', 'S1', 9)
    await gvNhanXetCaEm(env, { maCa: 'CA2', sbd: 'S1', noiDung: 'NHẬN XÉT CHƯA ĐƯỢC LỘ' }, T0)
    themCa(d, 'CA3', 'ngay', 'dong', 'Hydrocarbon')
    themLuot(d, 'CA3', 'S1', 6.5, '2026-08-29T08:00:00.000Z')
    await gvNhanXetCaEm(env, { maCa: 'CA3', sbd: 'S1', noiDung: 'Ca cũ.' }, T0)
    await gvNhanXetCaEm(env, { maCa: 'CA1', sbd: 'S2', noiDung: 'Của bạn khác.' }, T0)
    const r = await phLoiThay(env, { sbd: 'S1' }, T0)
    const ds = r.nhanXet as { maCa: string; tenCa: string; noiDung: string; tong?: number; nopLuc?: string }[]
    expect(ds.map((x) => x.maCa)).toEqual(['CA1', 'CA3'])
    expect(ds[0]).toMatchObject({ tenCa: 'Ester – Lipid', tong: 7.75, nopLuc: '2026-09-26T08:42:00.000Z' })
    expect(JSON.stringify(r)).not.toContain('NHẬN XÉT CHƯA ĐƯỢC LỘ')
    expect(JSON.stringify(r)).not.toContain('Của bạn khác.')
    expect(TOI_DA_LOI_THAY).toBe(12)
  })
})

// ---------------------------------------------------------------- Game Hoá 2.0 ----------------------------------------------------------------
function cauJson(qid: string, dang: string) {
  return JSON.stringify({ qid, maDe: 'DE1', lop: '12', version: 'v1', group: `g-${qid}`, phan: 'I', text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], dang, tenDang: `Dạng ${dang}`, mucDo: 'TH', correct: 'B', reviewed: true, solution: { chot: 'x', tungPa: {} } })
}
function dung2(soCau = 6) {
  const { d, env } = dung()
  const st = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  for (let i = 1; i <= soCau; i++) st.run('DE1', `Q${i}`, 'v1', `g-Q${i}`, `D${i % 2}`, cauJson(`Q${i}`, `D${i % 2}`))
  d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('game_hoa_2','{"bat":true,"lop":["12A1"]}','x')`)
  return { d, env }
}
const suKien = (qid: string, msLuc: number, dung: boolean): SuKien => ({ nguon: 'game', maNguon: `phien-${msLuc}`, sbd: 'S1', qid, lan: 1, ketQua: dung ? 1 : 0, luc: new Date(msLuc).toISOString() })
const demKeHoach = (d: D1That): number => Number((d.sql.prepare('SELECT COUNT(*) AS n FROM srs2_ke_hoach').get() as { n: number }).n)

describe('/ph/hoc-2 — Game Hoá 2.0 của con', () => {
  it('công tắc chưa bật cho con ⇒ {cheDo2:false}, không khối nào', async () => {
    const { env } = dung()
    expect(await phHoc2(env, { sbd: 'S1' }, T0)).toEqual({ ok: true, cheDo2: false })
  })

  it('có chiến dịch nhưng con CHƯA mở app hôm nay ⇒ có chiến dịch, KHÔNG có "hôm nay", và KHÔNG chốt kế hoạch thay con', async () => {
    const { d, env } = dung2()
    expect((await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04' }, T0 - NGAY_MS)).ok).toBe(true)
    const r = await phHoc2(env, { sbd: 'S1' }, T0)
    expect(r).toMatchObject({ ok: true, cheDo2: true, ngay: '2026-09-30' })
    expect(r.chienDich).toMatchObject({ ten: 'Ester – Lipid', hanNop: '2026-10-04', conNgay: 5, tong: 6, daGap: 0, thanhThao: 0, canDayLai: 0 })
    expect(r.homNay).toBeUndefined()
    expect(r.cauTungSai).toBeUndefined()
    expect(demKeHoach(d)).toBe(0)
    for (const cam of KHOA_GAME) expect(moiKhoa(r), cam).not.toContain(cam)
  })

  it('con đã mở app (kế hoạch đã chốt) và làm vài câu ⇒ "hôm nay" = câu đã làm / tổng kế hoạch; câu từng sai được đếm', async () => {
    const { d, env } = dung2()
    await gvChienDich(env, { action: 'tao', ten: 'Ester – Lipid', lop: '12A1', maDe: ['DE1'], hanNop: '2026-10-04' }, T0 - 3 * NGAY_MS)
    await ghiSuKien(env, [suKien('Q1', T0 - 2 * NGAY_MS, false)])
    const { kh } = await layKeHoachHomNay(env, 'S1', T0) // chính con mở app ⇒ kế hoạch được chốt
    expect(demKeHoach(d)).toBe(1)
    const k0 = kh.dao[0] ?? kh.doan[0]
    await ghiSuKien(env, [suKien(k0!.replace(/#\d+$/, ''), T0 + 60_000, true)])
    const r = await phHoc2(env, { sbd: 'S1' }, T0 + 120_000)
    expect(r.serverNow).toBe(T0 + 120_000)
    expect(r.hanhTrinh).toBeUndefined() // chưa có tầng chốt: không suy ra từ tổng câu
    d.sql.exec('CREATE TABLE IF NOT EXISTS hanh_trinh_v3_ngay(sbd TEXT,ngay TEXT,tang INTEGER,toi_thieu INTEGER)')
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay VALUES(?,?,?,?)').run('S1','2026-09-30',2,30)
    d.sql.prepare('INSERT INTO hanh_trinh_v3_ngay VALUES(?,?,?,?)').run('S2','2026-09-30',4,36)
    expect((await phHoc2(env, {sbd:'S1'}, T0 + 120_000)).hanhTrinh).toBeUndefined() // snapshot cũ không đổi chiến dịch thường thành Hành trình
    d.sql.prepare('UPDATE srs2_ke_hoach SET chien_dich_id=? WHERE sbd=?').run('hanh-trinh-v3-khoi-12','S1')
    const truoc = d.sql.prepare('SELECT * FROM srs2_ke_hoach').all()
    const snapshot = await phHoc2(env, { sbd:'S1' }, T0 + 120_000)
    expect(snapshot.hanhTrinh).toEqual({tang:2,toiThieu:30})
    expect(d.sql.prepare('SELECT * FROM srs2_ke_hoach').all()).toEqual(truoc)
    expect(r.homNay).toEqual({ tong: kh.tong, daLam: 1 })
    expect((r.chienDich as { daGap: number }).daGap).toBeGreaterThanOrEqual(1)
    expect(r.cauTungSai).toMatchObject({ tong: 1 })
    expect(demKeHoach(d)).toBe(1)
  })
})
