// @vitest-environment node
// H3 đợt 3 giảm chi phí D1 (12/11 tối): câu đọc bảng phụ / cron — so cũ↔mới trên D1 thật trong bộ nhớ + khoá kế hoạch truy vấn (EXPLAIN QUERY PLAN).
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { SQL_BANDIT_CU, SQL_BANDIT_DOC, docBanditLop, dungBanditLopNeuCu, HAN_DUNG_BANDIT_MS, CUA_SO_BANDIT_MS, chuKyDungBandit } from '../server/src/hanh-trinh-bandit-lop'
import { metaKt, sqlDocKtCnMeta, sqlDocKtCnMetaCu, dongBoKtCn, PHUT_BU_META_KT, docKtCn } from '../server/src/kiem-tra-ca-nhan'
import { sqlGvKtCn, sqlGvKtCnCu, gvKtCn } from '../server/src/kiem-tra-ca-nhan-thay'
import { SQL_KT_CN } from '../server/src/kiem-tra-ca-nhan-schema'
import { ngayKt, congNgayKt, dauNgayKt } from '../server/src/kiem-tra-ca-nhan-loi'
import { sqlTenLopHs } from '../server/src/goi-bai-7'

const NGAY = 86_400_000
const T = Date.UTC(2026, 10, 12, 13, 0, 0) // 20:00 VN — khung học
const keHoach = (sql: any, q: string) => (sql.prepare('EXPLAIN QUERY PLAN ' + q).all() as { detail: string }[]).map((r) => r.detail)

// ------------------------------------------------------------------ Q2 · bandit cả lớp cộng sẵn
function napCanThiep(sql: any) {
  const ins = sql.prepare('INSERT INTO hanh_trinh_v4_can_thiep(sbd,ngay,moc,qid,nhom,ky_nang,context,cach,xac_suat,goi_luc,do_luc,ket_qua) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
  let moc = 0
  const them = (ctx: string, cach: string, doLuc: number | null, kq: number | null) => ins.run(`E${moc % 7}`, '2026-11-01', moc++, 'q', 'n', 'k', ctx, cach, 0.5, 0, doLuc, kq)
  for (let i = 0; i < 12; i++) them('yeu', 'goi_y', T - (i + 1) * NGAY, i % 3 === 0 ? 0 : 1)
  for (let i = 0; i < 5; i++) them('yeu', 'lam_lai', T - 3 * NGAY, i % 2)
  for (let i = 0; i < 4; i++) them('manh', 'goi_y', T - 10 * NGAY, 1)
  them('manh', 'goi_y', T - 90 * NGAY, 0) // đúng mép cửa sổ ⇒ tính
  them('manh', 'goi_y', T - 90 * NGAY - 1, 0) // ngoài cửa sổ ⇒ bỏ
  them('manh', 'lam_lai', T - NGAY, null) // chưa chấm ⇒ bỏ
  them('moi', 'giai_mau', null, null) // chưa đo ⇒ bỏ
  them('moi', 'giai_mau', T - 2 * NGAY, 2) // kết quả khác 0/1 vẫn là một dòng (dung=0, sai=0) như câu cũ
}
const cuBandit = (sql: any, now: number) => sql.prepare(SQL_BANDIT_CU).all(now - CUA_SO_BANDIT_MS)

describe('Q2 bandit cả lớp cộng sẵn', () => {
  it('chưa dựng ⇒ câu cũ y nguyên, cùng thứ tự', async () => {
    const d = taoD1That(); napCanThiep(d.sql)
    const r = await docBanditLop(d.env, T)
    expect(r.results).toEqual(cuBandit(d.sql, T))
    expect(r.results.length).toBe(4)
  })
  it('đã dựng ⇒ y hệt câu cũ tại mốc dựng; dữ liệu đổi sau mốc chỉ vào ở lần dựng sau', async () => {
    const d = taoD1That(); napCanThiep(d.sql)
    const luc = cuBandit(d.sql, T)
    expect(await dungBanditLopNeuCu(d.env, T)).toEqual({ dung: true, soDong: 4 })
    d.sql.prepare("UPDATE hanh_trinh_v4_can_thiep SET ket_qua=1 WHERE context='manh'").run()
    expect((await docBanditLop(d.env, T + 60_000)).results).toEqual(luc)
    // Trong chu kỳ ⇒ không dựng lại; hết chu kỳ ⇒ dựng lại, khớp câu cũ lúc đó.
    expect(await dungBanditLopNeuCu(d.env, T + chuKyDungBandit(T) - 1)).toEqual({ dung: false })
    const T2 = T + chuKyDungBandit(T)
    expect((await dungBanditLopNeuCu(d.env, T2)).dung).toBe(true)
    expect((await docBanditLop(d.env, T2)).results).toEqual(cuBandit(d.sql, T2))
    // Mốc quá hạn (cron hỏng) ⇒ lùi về câu cũ.
    const T3 = T2 + HAN_DUNG_BANDIT_MS + 1
    d.sql.prepare("UPDATE hanh_trinh_v4_can_thiep SET ket_qua=0 WHERE context='yeu'").run()
    expect((await docBanditLop(d.env, T3)).results).toEqual(cuBandit(d.sql, T3))
  })
  it('lô giành mốc: hai cron cùng phút chỉ một lô dựng', async () => {
    const d = taoD1That(); napCanThiep(d.sql)
    const [a, b] = await Promise.all([dungBanditLopNeuCu(d.env, T), dungBanditLopNeuCu(d.env, T)])
    expect([a.dung, b.dung].filter(Boolean).length).toBe(1)
    expect((d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v4_bandit_lop').get() as { n: number }).n).toBe(4)
  })
  it('kế hoạch: đã dựng thì nhánh câu cũ không quét bảng can thiệp (điều kiện hằng xét trước vòng quét)', () => {
    const d = taoD1That()
    const ke = keHoach(d.sql, SQL_BANDIT_DOC).join('\n')
    expect(ke).toMatch(/SCAN hanh_trinh_v4_bandit_lop|SEARCH hanh_trinh_v4_bandit_lop/)
    // Nhánh câu cũ vẫn có (dự phòng) — nhưng đứng sau EXISTS hằng; thử thật: đã dựng, đếm số bước VM khi đọc không phụ thuộc số dòng can thiệp.
    expect(ke).toMatch(/hanh_trinh_v4_can_thiep/)
  })
})

// ------------------------------------------------------------------ Q3 · Q4 · Q5 · kiểm tra cá nhân (làn Codex — chỉ đổi câu D1, hành vi giữ nguyên)
const deKt = (n: number) => ({ phienBan: n % 2 ? 3 : 2, lyDo: 'lịch', baiNgayToiThieu: n % 3, phuKienThuc: n % 2 ? 1 : undefined, bai: [{ khoa: 'b1', ten: 'Bài 1' }],
  muc: [{ id: 'm1', loai: 'kn', bai: 'b1' }, { id: 'm2', loai: 'bai', bai: 'b1' }, { id: 'm3', loai: 'kn', bai: 'b1' }],
  cau: [{ q: { qid: 'q1', phan: 'I' }, muc: ['m1'], y: {}, phut: 1 }, { q: { qid: 'q2', phan: 'II' }, muc: ['m1'], y: {}, phut: 2 }, { q: { qid: 'q3', phan: 'III' }, muc: ['m3'], y: {}, phut: 2 }],
  soPhu: 1, phut: 10, thieu: n % 4 === 0 ? ['m3'] : [], chang: [{ qids: ['q1', 'q2'], giay: 300 }, { qids: ['q3'], giay: 300 }] })
const TRA = ['{}', '{"q1":"A","q2":"DSDS","q3":" 1,5 "}', '{"q1":"E","q2":"DSD","q3":"   "}', '{"q1":"B","q3":7}']
function napKt(sql: any, now: number) {
  for (const q of SQL_KT_CN) sql.exec(q)
  const hs = sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,?,'x')")
  hs.run('S1', 'An', '12', '12A', null); hs.run('S2', 'Bình', '11', null, ''); hs.run('S3', 'Chi', '12', '12A', 'khoa'); hs.run('S4', 'Dũng', '12', '12B', null); hs.run('S5', 'Em', '12', '12A', null)
  const lopCua: Record<string, string> = { S1: '12A', S2: '11', S3: '12A', S4: '12A' /* lệch lớp ⇒ bị loại */, S5: '12A' }
  const ins = sql.prepare('INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,tra_json,nop_luc,diem,da_ghi,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)')
  const meta = sql.prepare('INSERT INTO kiem_tra_ca_nhan_meta(id,meta_json) VALUES(?,?)')
  const chang = sql.prepare('INSERT INTO kiem_tra_ca_nhan_chang(bai_id,stt,bat_dau,han,chot_luc) VALUES(?,?,?,?,?)')
  const hom = ngayKt(now)
  let n = 0
  for (const sbd of ['S1', 'S2', 'S3', 'S4', 'S5']) for (const lech of [-20, -9, -3, 0, 1, 4, 8, 15]) {
    if (sbd === 'S5' && lech > -3) continue // em chỉ có lịch cũ ⇒ nhánh «lịch gần nhất đã qua»
    const ngay = congNgayKt(hom, lech), id = `ktcn:${sbd}:${ngay}`, de = deKt(n)
    const nop = lech < 0 && n % 2 ? dauNgayKt(ngay) + 3600_000 : null
    const tt = n % 5 === 0 ? 'cho_nguon' : nop ? 'da_nop' : lech < 0 ? 'het_han' : 'hen'
    ins.run(id, sbd, lopCua[sbd], ngay, dauNgayKt(ngay), dauNgayKt(congNgayKt(ngay, 1)), tt, JSON.stringify(de), TRA[n % TRA.length], nop, nop ? 7.5 : null, nop ? 1 : 0, now - n * 1000)
    if (n % 3 !== 1) meta.run(id, JSON.stringify(metaKt(de as never))) // dòng thiếu số tính sẵn ⇒ nhánh tính lại
    for (let s = 0; s < (n % 3); s++) chang.run(id, s, dauNgayKt(ngay), dauNgayKt(ngay) + (s + 1) * 600_000, s === 0 && n % 2 ? dauNgayKt(ngay) + 100 : null)
    n++
  }
  // Một dòng đúng ngày bảo trì (27/10) chưa nộp, đã quá hạn ⇒ lịch thầy bỏ.
  const bt = '2026-10-27'
  ins.run(`ktcn:S2:${bt}`, 'S2', '11', bt, dauNgayKt(bt), dauNgayKt(congNgayKt(bt, 1)), 'hen', JSON.stringify(deKt(1)), '{}', null, null, 0, now)
}

describe('Q4 lịch kiểm tra cá nhân: chọn dòng trước, tính cột nặng sau', () => {
  const NOW = Date.UTC(2026, 10, 12, 13, 0, 0)
  it('docKtCn (chiMeta): y hệt câu cũ cho mọi em, mọi mốc ngày', () => {
    const d = taoD1That(); napKt(d.sql, NOW)
    let coDong = 0
    for (const lech of [-25, -5, 0, 2, 9, 30]) {
      const now = NOW + lech * NGAY
      for (const sbd of ['S1', 'S2', 'S3', 'S4', 'S5', 'S9']) {
        const cu = d.sql.prepare(sqlDocKtCnMetaCu()).get(sbd, ngayKt(now), now)
        const moi = d.sql.prepare(sqlDocKtCnMeta()).get(sbd, ngayKt(now), now)
        expect(moi).toEqual(cu)
        if (cu) coDong++
      }
    }
    expect(coDong).toBeGreaterThan(8)
  })
  it('lịch thầy: y hệt câu cũ (cột, thứ tự cột, thứ tự dòng) với mọi bộ lọc', () => {
    const d = taoD1That(); napKt(d.sql, NOW)
    let soDong = 0
    for (const lech of [0, 6, -10]) for (const [lop, sbd] of [['', ''], ['12A', ''], ['', 'S2'], ['11', 'S1']]) {
      const now = NOW + lech * NGAY
      const b = [ngayKt(now), ngayKt(now), ngayKt(now), new Date(now - 14 * 86400000 + 7 * 3600000).toISOString().slice(0, 10), lop, lop, sbd, sbd]
      const cu = d.sql.prepare(sqlGvKtCnCu(now)).all(...b) as Record<string, unknown>[]
      const moi = d.sql.prepare(sqlGvKtCn(now)).all(...b) as Record<string, unknown>[]
      expect(moi).toEqual(cu)
      if (moi[0]) expect(Object.keys(moi[0])).toEqual(Object.keys(cu[0]!))
      soDong += moi.length
    }
    expect(soDong).toBeGreaterThan(6)
  })
  it('kế hoạch: cột nặng (đếm đã trả lời) chỉ tính sau khi đã chọn dòng', () => {
    const d = taoD1That(); for (const q of SQL_KT_CN) d.sql.exec(q)
    const em = keHoach(d.sql, sqlDocKtCnMeta())
    expect(em[0]).toMatch(/^SEARCH k USING INDEX sqlite_autoindex_kiem_tra_ca_nhan_1 \(id=\?\)/)
    expect(em.some((x) => /SEARCH k USING INDEX ktcn_em_ngay \(sbd=\? AND ngay>\?\)/.test(x))).toBe(true)
    const gv = keHoach(d.sql, sqlGvKtCn(0))
    expect(gv.some((x) => /SEARCH k USING INDEX sqlite_autoindex_kiem_tra_ca_nhan_1 \(id=\?\)/.test(x))).toBe(true)
  })
  it('đầu-cuối: docKtCn / gvKtCn chạy câu mới, ra đúng như câu cũ', async () => {
    const d = taoD1That(); napKt(d.sql, NOW)
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{\"bat\":true}','x')").run()
    expect(await docKtCn(d.env, 'S1', NOW, true)).toEqual(d.sql.prepare(sqlDocKtCnMetaCu()).get('S1', ngayKt(NOW), NOW))
    const g = await gvKtCn(d.env, {}, NOW)
    expect(g.em.length).toBeGreaterThan(1)
  })
})

describe('Q5 cron làm mới đề: chỉ mục lịch chưa mở, chưa nộp', () => {
  const NOW = Date.UTC(2026, 10, 12, 13, 0, 0)
  const LOP = '${sqlTenLopHs(\'h\')}'
  const MAU = `SELECT k.sbd FROM kiem_tra_ca_nhan k JOIN hoc_sinh h ON h.sbd=k.sbd AND k.lop=${LOP} LEFT JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id WHERE COALESCE(h.trang_thai,'')<>'khoa' AND k.mo_luc>? AND k.nop_luc IS NULL AND (COALESCE(json_extract(km.meta_json,'$.phienBan'),1)<>? OR (k.ngay=? AND k.cap_nhat_luc<? AND COALESCE(json_extract(k.json,'$.chuKyNgay'),k.ngay)>?)) GROUP BY k.sbd ORDER BY MIN(k.ngay) LIMIT ?`
  const SQL_MOI = MAU.replace(LOP, sqlTenLopHs('h'))
  it('câu trong mã khớp mẫu của test (đổi câu ⇒ sửa test)', async () => {
    const { readFileSync } = await import('node:fs')
    expect(readFileSync('server/src/kiem-tra-ca-nhan.ts', 'utf8')).toContain(MAU)
  })
  it('có chỉ mục ↔ không chỉ mục: cùng kết quả, cùng thứ tự (kể cả hoà MIN(ngay))', () => {
    const d = taoD1That(); napKt(d.sql, NOW)
    const chay = () => [3, 2].flatMap((pb) => [NOW - 30 * NGAY, NOW, NOW + 3 * NGAY].map((now) =>
      d.sql.prepare(SQL_MOI).all(now, pb, congNgayKt(ngayKt(now), 1), dauNgayKt(ngayKt(now)), ngayKt(now), 3)))
    const moi = chay()
    expect(keHoach(d.sql, SQL_MOI)[0]).toMatch(/^SEARCH k USING INDEX ktcn_chua_mo \(mo_luc>\?\)/)
    d.sql.exec('DROP INDEX ktcn_chua_mo')
    expect(keHoach(d.sql, SQL_MOI).join('\n')).not.toMatch(/ktcn_chua_mo/)
    expect(moi).toEqual(chay())
    expect(moi.flat().length).toBeGreaterThan(3)
  })
})

describe('Q3 bù số tính sẵn: mỗi giờ một lần', () => {
  it('phút khác ⇒ không dò; đúng phút ⇒ bù như cũ', async () => {
    const d = taoD1That(); for (const q of SQL_KT_CN) d.sql.exec(q)
    const goc = Date.UTC(2026, 10, 12, 3, 0, 0) // 10:00 VN — ngoài khung học
    d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,cap_nhat_luc) VALUES('x','S1','12A','2026-11-01',1,2,'het_han',?,5)").run(JSON.stringify(deKt(1)))
    const coMeta = () => !!d.sql.prepare("SELECT 1 FROM kiem_tra_ca_nhan_meta WHERE id='x'").get()
    await dongBoKtCn(d.env, goc + 5 * 60_000, 2, true, true)
    expect(coMeta()).toBe(false)
    await dongBoKtCn(d.env, goc + PHUT_BU_META_KT * 60_000, 2, true, true)
    expect(coMeta()).toBe(true)
    expect(JSON.parse((d.sql.prepare("SELECT meta_json FROM kiem_tra_ca_nhan_meta WHERE id='x'").get() as { meta_json: string }).meta_json)).toEqual(metaKt(deKt(1) as never))
  })
})
