// @vitest-environment node
// CHO THI LẠI (Worker) — khôi phục đủ ba việc thầy chốt 08/09: xoá lịch sử · KHOÁ MÁY · đề mới (server/src/goi-cu.ts `choThiLai`, luat-vao-thi.ts `sai_may`, `moKhoaEm`).
// Chạy trên SQLite thật. Trước sửa, Worker chỉ xoá lượt rồi lặp lại cờ `lapMoi`/`boCauMoi` thành `khoaMay`/`daDoiDe` (báo thành công giả).
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import { choThiLai, datBoMoiChoEm, moKhoaEm } from '../server/src/goi-cu'
import { quyetDinhVaoThi } from '../server/src/luat-vao-thi'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const gs = new Function(`${gsCode}\nreturn { quyetDinhVaoThi_ }`)() as { quyetDinhVaoThi_: (ca: unknown, luot: unknown, may: string, now: number) => { ok: boolean; lyDo?: string; cach?: string } }

const QID = Array.from({ length: 12 }, (_, i) => `DE-I-${i + 1}`)
const BO_CU = ['DE-I-1', 'DE-I-2', 'DE-I-3']
const BO_MOI = ['DE-I-7', 'DE-I-8', 'DE-I-9']

function themCa(d: D1That, goi: unknown = { bo: { S1: BO_CU, S2: ['DE-I-4', 'DE-I-5', 'DE-I-6'] }, lap: { S1: ['x'] }, dem: {}, bb: null }, o: { keyR2?: boolean } = {}) {
  d.sql.prepare(
    "INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,bank_r2,cong_bo,bo_theo_em_json,cap_nhat_luc) VALUES('CA1','Ca 1','mo',?,?,45,'thi','de/CA1.json','ngay',?,'x')",
  ).run(new Date(Date.now() - 3_600_000).toISOString(), new Date(Date.now() + 3_600_000).toISOString(), goi === null ? null : JSON.stringify(goi))
  if (o.keyR2 !== false) {
    d.objects.set('key/CA1.json', { phanI: QID.map((id) => ({ id, correct: 'A' })), phanII: [], phanIII: [] })
    d.objects.set('de/CA1.json', { phanI: QID.map((id) => ({ id, text: 't' })), phanII: [], phanIII: [] })
  }
}
const luot = (d: D1That, sbd: string, lan: number, tt: string, may: string | null, hoTen = 'Em') =>
  d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,nop_luc,trang_thai,ho_ten,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,'x')").run(`CA1|${sbd}|${lan}`, 'CA1', sbd, lan, may, 'x', tt === 'da_nop' ? 'y' : null, tt, hoTen)
function themDuLieu(d: D1That, sbd: string) {
  d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,dap_an_chon,dap_an_dung,dung_sai,cap_nhat_luc) VALUES(?,?,?,1,'I',1,'DE-I-1','A','A',1,'x')").run(`CA1|${sbd}|1|I|1`, 'CA1', sbd)
  d.sql.prepare("INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,cap_nhat_luc) VALUES(?,?,?,?,'x')").run(`CA1|${sbd}|DE-I-1`, 'CA1', sbd, 'DE-I-1')
  d.sql.prepare("INSERT INTO phong_cho(khoa,ma_ca,sbd,ho_ten,ghi_luc) VALUES(?,?,?,?,'x')").run(`CA1|${sbd}`, 'CA1', sbd, 'Em')
  d.sql.prepare("INSERT INTO tien_do_ca(khoa,ma_ca,sbd,chuyen_de,so_cau,so_sai,cap_nhat_luc) VALUES(?,?,?,'ES',3,1,'x')").run(`CA1|${sbd}|ES`, 'CA1', sbd)
}
const dem = (d: D1That, t: string, sbd: string) => Number((d.sql.prepare(`SELECT COUNT(*) n FROM ${t} WHERE sbd=?`).get(sbd) as { n: number }).n)
const boCua = (d: D1That) => JSON.parse((d.sql.prepare("SELECT bo_theo_em_json j FROM ca WHERE ma_ca='CA1'").get() as { j: string }).j) as Record<string, any>
const luotCua = (d: D1That, sbd: string) => d.sql.prepare('SELECT * FROM luot WHERE ma_ca=? AND sbd=? ORDER BY lan_thu').all('CA1', sbd) as Record<string, any>[]
const chup = (d: D1That) => JSON.stringify(['ca', 'luot', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'tien_do_ca', 'su_kien_hoc'].map((t) => d.sql.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all()))
function dung(o: { goi?: unknown; may?: string | null } = {}) {
  const d = taoD1That()
  themCa(d, o.goi === undefined ? undefined : o.goi)
  luot(d, 'S1', 1, 'da_nop', o.may === undefined ? 'may-A' : o.may)
  luot(d, 'S2', 1, 'da_nop', 'may-S2')
  themDuLieu(d, 'S1')
  themDuLieu(d, 'S2')
  d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES('thi|CA1|S1|DE-I-1|1','S1','DE-I-1','thi','CA1',1,1,'2026-09-19T01:00:00.000Z','2026-09-19')").run()
  return d
}
const cho = (d: D1That, b: Record<string, unknown> = {}) => choThiLai(d.env, { maCa: 'CA1', sbd: 'S1', boCauMoi: BO_MOI, ...b })

describe('choThiLai: ba việc, kết quả nói THẬT', () => {
  it('xoá đúng em, khoá máy cũ, ghi đề mới cho đúng em và GIỮ đề của bạn; sổ su_kien_hoc GIỮ', async () => {
    const d = dung()
    const r = await cho(d)
    expect(r).toMatchObject({ ok: true, soLuotXoa: 1, soCauXoa: 1, soBanDoSaiXoa: 1, khoaMay: true, daDoiDe: true, lanThu: 1 })
    // (1) xoá lịch sử của S1, S2 nguyên vẹn
    for (const t of ['chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'tien_do_ca']) {
      expect(dem(d, t, 'S1'), t).toBe(0)
      expect(dem(d, t, 'S2'), t).toBe(1)
    }
    expect(luotCua(d, 'S2')).toHaveLength(1)
    expect(d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S1'").get()).toEqual({ n: 1 })
    // (2) lượt mới duoc_duyet_lai mang máy cũ
    const l = luotCua(d, 'S1')
    expect(l).toHaveLength(1)
    expect(l[0]).toMatchObject({ lan_thu: 1, trang_thai: 'duoc_duyet_lai', id_thiet_bi: 'may-A', ghi_chu: 'thi lại — khoá đúng máy cũ', ho_ten: 'Em', duyet_boi: 'thầy' })
    // (3) đề mới cho S1; S2 giữ; lap của S1 xoá (không gửi lapMoi)
    const g = boCua(d)
    expect(g.bo.S1).toEqual(BO_MOI)
    expect(g.bo.S2).toEqual(['DE-I-4', 'DE-I-5', 'DE-I-6'])
    expect(g.lap.S1).toBeUndefined()
  })

  it('bản đồ dạng CŨ phẳng {sbd:[…]} giữ nguyên hình; ca chưa có bản đồ thì dựng dạng mới chỉ có em này; lapMoi được ghi', async () => {
    const cu = dung({ goi: { S1: BO_CU, S2: ['DE-I-4'] } })
    await cho(cu)
    expect(boCua(cu)).toEqual({ S1: BO_MOI, S2: ['DE-I-4'] })
    const chua = dung({ goi: null })
    await cho(chua, { lapMoi: ['DE-I-7'] })
    expect(boCua(chua)).toEqual({ bo: { S1: BO_MOI }, lap: { S1: ['DE-I-7'] }, dem: {}, bb: null })
    expect(datBoMoiChoEm('không phải json', 'S1', BO_MOI, undefined)).toBe(JSON.stringify({ bo: { S1: BO_MOI }, lap: {}, dem: {}, bb: null }))
  })

  it('lượt cũ KHÔNG ghi máy → không khoá, khoaMay:false NÓI THẬT, ghi chú nói rõ; máy khoá = lượt GẦN NHẤT có id', async () => {
    const khong = dung({ may: null })
    const r = await cho(khong)
    expect(r).toMatchObject({ ok: true, khoaMay: false })
    expect(luotCua(khong, 'S1')[0]).toMatchObject({ id_thiet_bi: null, ghi_chu: 'thi lại — lượt cũ không ghi máy, không khoá được' })

    const hai = dung({ may: 'may-A' })
    luot(hai, 'S1', 2, 'da_nop', 'may-B')
    luot(hai, 'S1', 3, 'da_nop', null)
    await cho(hai)
    expect(luotCua(hai, 'S1')[0].id_thiet_bi).toBe('may-B') // lan 3 không có id → lấy lan 2, không phải lan 1
  })

  it('thi lại LẦN NỮA: lượt duoc_duyet_lai được thay bằng lượt mới, vẫn giữ máy cũ', async () => {
    const d = dung()
    await cho(d)
    const r2 = await cho(d, { boCauMoi: ['DE-I-10', 'DE-I-11', 'DE-I-12'] })
    expect(r2).toMatchObject({ ok: true, khoaMay: true, daDoiDe: true })
    expect(luotCua(d, 'S1')).toHaveLength(1)
    expect(luotCua(d, 'S1')[0].id_thiet_bi).toBe('may-A')
    expect(boCua(d).bo.S1).toEqual(['DE-I-10', 'DE-I-11', 'DE-I-12'])
  })

  it('không gửi boCauMoi: vẫn xoá + khoá máy nhưng daDoiDe:false NÓI THẬT, bản đồ không đổi', async () => {
    const d = dung()
    const truoc = boCua(d)
    const r = await choThiLai(d.env, { maCa: 'CA1', sbd: 'S1' })
    expect(r).toMatchObject({ ok: true, khoaMay: true, daDoiDe: false })
    expect(boCua(d)).toEqual(truoc)
  })
})

describe('choThiLai: TỪ CHỐI thì KHÔNG xoá, KHÔNG đổi gì', () => {
  const tuChoi = async (d: D1That, b: Record<string, unknown>, khop: RegExp) => {
    const truoc = chup(d)
    const r = await choThiLai(d.env, { maCa: 'CA1', sbd: 'S1', boCauMoi: BO_MOI, ...b })
    expect(r.ok, JSON.stringify(r)).toBe(false)
    expect(String(r.error)).toMatch(khop)
    expect(chup(d)).toBe(truoc)
  }
  it('em đang làm bài; em chưa có lượt; ca không có; thiếu mã', async () => {
    const dl = dung()
    luot(dl, 'S1', 2, 'dang_lam', 'may-A')
    await tuChoi(dl, {}, /đang làm bài/)
    await tuChoi(dung(), { sbd: 'S9' }, /chưa có lượt nào/)
    await tuChoi(dung(), { maCa: 'KHONG' }, /Không có ca/)
    await tuChoi(dung(), { sbd: '' }, /Thiếu/)
  })
  it('bộ câu mới sai hình thức, có qid ngoài tờ đề, hoặc không đọc được tờ đề để kiểm', async () => {
    await tuChoi(dung(), { boCauMoi: ['DE-I-7', 'DE-I-7'] }, /không hợp lệ/)
    await tuChoi(dung(), { boCauMoi: ['DE-I-7', ''] }, /không hợp lệ/)
    await tuChoi(dung(), { boCauMoi: [1, 2] }, /không hợp lệ/)
    await tuChoi(dung(), { boCauMoi: Array.from({ length: 201 }, (_, i) => `Q${i}`) }, /không hợp lệ/)
    await tuChoi(dung(), { boCauMoi: ['DE-I-7', 'LA-1'] }, /1 câu không thuộc tờ đề/)
    const khongTo = taoD1That()
    themCa(khongTo, undefined, { keyR2: false })
    luot(khongTo, 'S1', 1, 'da_nop', 'may-A')
    await tuChoi(khongTo, {}, /Không đọc được tờ đề/)
  })
  it('em vừa vào làm bài GIỮA CHỪNG (sau khi kiểm, trước khi xoá): không xoá gì, báo rõ', async () => {
    const d = dung()
    const DB = {
      prepare: (q: string) => d.env.DB.prepare(q),
      batch: async (ds: never[]) => {
        d.sql.prepare("INSERT INTO luot(khoa,ma_ca,sbd,lan_thu,id_thiet_bi,vao_luc,trang_thai,cap_nhat_luc) VALUES('CA1|S1|2','CA1','S1',2,'may-A','x','dang_lam','x')").run()
        return d.env.DB.batch(ds)
      },
    }
    const r = await choThiLai({ ...d.env, DB } as never, { maCa: 'CA1', sbd: 'S1', boCauMoi: BO_MOI })
    expect(r.ok).toBe(false)
    expect(String(r.error)).toMatch(/vừa vào làm bài/)
    expect(dem(d, 'chi_tiet_cau', 'S1')).toBe(1)
    expect(dem(d, 'ban_do_sai', 'S1')).toBe(1)
    expect(luotCua(d, 'S1').map((x) => x.trang_thai).sort()).toEqual(['da_nop', 'dang_lam'])
  })
  it('hai thầy cho hai em thi lại CÙNG LÚC: bản đồ bị người kia sửa GIỮA đọc và ghi thì CAS phát hiện, đọc lại và hợp nhất — không mất bộ của ai', async () => {
    const d = dung()
    let daXen = false
    const DB = {
      prepare: (q: string) => {
        if (!daXen && q.startsWith('UPDATE ca SET bo_theo_em_json')) {
          daXen = true
          // Thầy kia vừa cho S2 thi lại: ghi bộ mới của S2 vào bản đồ ngay trước lệnh ghi của ta.
          const g = boCua(d)
          g.bo.S2 = ['DE-I-10', 'DE-I-11', 'DE-I-12']
          d.sql.prepare("UPDATE ca SET bo_theo_em_json=? WHERE ma_ca='CA1'").run(JSON.stringify(g))
        }
        return d.env.DB.prepare(q)
      },
      batch: (ds: never[]) => d.env.DB.batch(ds),
    }
    const r = await choThiLai({ ...d.env, DB } as never, { maCa: 'CA1', sbd: 'S1', boCauMoi: BO_MOI })
    expect(daXen).toBe(true)
    expect(r.ok).toBe(true)
    const g = boCua(d)
    expect(g.bo.S1).toEqual(BO_MOI)
    expect(g.bo.S2).toEqual(['DE-I-10', 'DE-I-11', 'DE-I-12'])
  })
  it('lệnh đòi mã bí mật của thầy', async () => {
    const d = dung()
    expect((await goiWorker(worker, d.env, '/goi', { action: 'choThiLai', maCa: 'CA1', sbd: 'S1', boCauMoi: BO_MOI })).ok).not.toBe(true)
    expect((await goiWorker(worker, d.env, '/goi', { action: 'choThiLai', maCa: 'CA1', sbd: 'S1', boCauMoi: BO_MOI }, true)).ok).toBe(true)
  })
})

describe('KHOÁ MÁY ở cổng vào thi (sai_may) — Y HỆT Apps Script', () => {
  const ca = { trang_thai: 'mo', bat_dau: '2026-09-03T07:00:00Z', het_han_vao: '2026-09-03T07:30:00Z', thoi_gian_phut: 45 }
  const caGs = { trangThai: 'mo', batDau: '2026-09-03T07:00:00Z', hetHanVao: '2026-09-03T07:30:00Z', thoiGianPhut: 45 }
  const NOW = Date.parse('2026-09-03T07:10:00Z')
  it('bảng so khớp với `quyetDinhVaoThi_` của .gs: lượt duoc_duyet_lai có id × máy xin vào', () => {
    for (const idLuot of ['may-A', '']) {
      for (const maySau of ['may-A', 'may-B', '']) {
        const w = quyetDinhVaoThi(ca as never, { trang_thai: 'duoc_duyet_lai', id_thiet_bi: idLuot, lan_thu: 1 } as never, maySau, NOW)
        const g = gs.quyetDinhVaoThi_(caGs, { trangThai: 'duoc_duyet_lai', idThietBi: idLuot, lanThu: 1, nopLuc: '' }, maySau, NOW)
        expect({ ok: w.ok, lyDo: w.lyDo }, `${idLuot || '(trống)'} → ${maySau || '(trống)'}`).toEqual({ ok: g.ok, lyDo: g.ok ? undefined : g.lyDo })
      }
    }
    // Chỉ MỘT trường hợp bị khoá: có id trên lượt, có id máy xin vào, khác nhau.
    expect(quyetDinhVaoThi(ca as never, { trang_thai: 'duoc_duyet_lai', id_thiet_bi: 'may-A', lan_thu: 1 } as never, 'may-B', NOW)).toMatchObject({ ok: false, lyDo: 'sai_may' })
  })
  it('sau choThiLai qua /vao-thi: máy khác bị chặn sai_may, đúng máy vào được (cach duyet_lai), máy không có id (kiểm ca đang mở) không bị chặn; mở khoá gỡ được khoá máy', async () => {
    const d = dung()
    await cho(d)
    const vao = (may: string) => goiWorker(worker, d.env, '/vao-thi', { maCa: 'CA1', sbd: 'S1', idThietBi: may, hoTen: 'Em', namSinh: '2008' })
    const khac = await vao('may-B')
    expect(khac).toMatchObject({ ok: false, lyDo: 'sai_may' })
    expect(luotCua(d, 'S1')[0].trang_thai).toBe('duoc_duyet_lai') // bị chặn thì lượt chờ nguyên
    // Thầy MỞ KHOÁ: gỡ khoá máy (lượt vẫn duoc_duyet_lai, id máy trống).
    const mk = await moKhoaEm(d.env, { maCa: 'CA1', sbd: 'S1', nguoiMo: 'thầy' })
    expect(mk).toMatchObject({ ok: true, soDong: 1, goKhoaMay: true })
    expect(luotCua(d, 'S1')[0]).toMatchObject({ trang_thai: 'duoc_duyet_lai', id_thiet_bi: null })
    const may2 = await vao('may-B')
    expect(may2.ok, JSON.stringify(may2)).toBe(true)
  })
  it('đúng máy cũ vào được; moKhoa lượt bị KHOÁ (rời màn) vẫn chạy như cũ', async () => {
    const d = dung()
    await cho(d)
    const dung1 = await goiWorker(worker, d.env, '/vao-thi', { maCa: 'CA1', sbd: 'S1', idThietBi: 'may-A', hoTen: 'Em', namSinh: '2008' })
    expect(dung1.ok, JSON.stringify(dung1)).toBe(true)
    const k = dung()
    luot(k, 'S3', 1, 'khoa', 'may-C')
    expect(await moKhoaEm(k.env, { maCa: 'CA1', sbd: 'S3' })).toMatchObject({ ok: true, soDong: 1, goKhoaMay: false })
    expect(luotCua(k, 'S3')[0].trang_thai).toBe('dang_lam')
    expect(await moKhoaEm(k.env, { maCa: 'CA1', sbd: 'S2' })).toMatchObject({ ok: true, soDong: 0 }) // lượt da_nop: không đụng
  })
})
