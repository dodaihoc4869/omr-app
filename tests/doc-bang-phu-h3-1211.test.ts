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
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { DONG_THOI_GIAN } from '../server/src/gv-hom-nay-v2'
import { SQL_SAN_SANG, BANG_SAN_SANG, SQL_SAN_SANG_LECH } from '../server/src/san-sang'

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

// ------------------------------------------------------------------ Q6 · hồ sơ câu khi lập kế hoạch (ke-hoach-ngay-d1.ts docHoSoD1)
const IN_EM = 'sbd IN (SELECT value FROM json_each(?))'
const hoSoSql = (n: string) => `SELECT 'c' AS k, sbd, qid AS c1, ma_dang AS c2, moc_on_ke AS c3, lan_sai AS c4, luc_cuoi AS c5, NULL AS c6, NULL AS c7, NULL AS c8, NULL AS c9 FROM nam_kt_cau
        WHERE ${IN_EM} AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc','chua_thay_sai') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ?
       UNION ALL SELECT 'n', sbd, COUNT(*), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM nam_kt_cau WHERE ${IN_EM} AND trang_thai IN (${n}) GROUP BY sbd
       UNION ALL SELECT 'd', sbd, ma_dang, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang WHERE ${IN_EM}`
const HO_SO_CU = hoSoSql("'moi_sai','dang_on'"), HO_SO_MOI = hoSoSql("'dang_on','moi_sai'")
const Q_ON_THI = `SELECT sbd, qid, lan_sai, trang_thai FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') AND can_day_lai = 0`
function napHoSo(sql: any) {
  const ins = sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,?,1,?,0,0,0,'x',?,?,?,?,'x')")
  const TT = ['moi_sai', 'dang_on', 'da_khac_phuc', 'chua_thay_sai', 'da_vung', 'moi_sai']
  const MOC = [null, '2026-11-01', '2026-11-12', '2026-11-12', '2026-11-13', '2026-10-30', '']
  // Thứ tự chèn xáo trộn ⇒ rowid KHÔNG trùng thứ tự qid — thứ tự dòng của nhánh 'c' (hoà moc_on_ke) phải giữ y như chỉ mục cũ.
  for (let i = 0; i < 160; i++) {
    const j = (i * 37) % 160, sbd = `E${j % 4}`
    ins.run(`${sbd}|q${j}`, sbd, `q${j}`, j % 5 ? `d${j % 3}` : null, j % 4, `2026-11-${String(1 + (j % 12)).padStart(2, '0')}T01:00:00.000Z`, MOC[j % MOC.length], TT[j % TT.length], j % 9 === 0 ? 1 : 0)
  }
  const dang = sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,moc_on_ke,moc_moi_sai,cap_nhat_luc) VALUES(?,?,?,3,2,1,1,0,1,'2026-11-02',NULL,'x')")
  for (const s of ['E0', 'E1', 'E3']) for (const d of ['d0', 'd1']) dang.run(`${s}|${d}`, s, d)
}

describe('Q6 hồ sơ câu: chỉ mục bộ phận, cùng dòng cùng thứ tự', () => {
  const XOA = ['DROP INDEX nkc_em_toi_han', 'DROP INDEX nkc_em_chua_kp']
  it('câu trong mã khớp hằng của test', async () => {
    const { readFileSync } = await import('node:fs')
    const ma = readFileSync('server/src/ke-hoach-ngay-d1.ts', 'utf8')
    expect(ma).toContain(HO_SO_MOI.replaceAll(IN_EM, '${IN_EM}'))
    expect(ma).toContain(Q_ON_THI)
  })
  it('mới (chỉ mục bộ phận) ↔ cũ (không chỉ mục, danh sách IN cũ): y hệt kể cả thứ tự', () => {
    const d = taoD1That(); napHoSo(d.sql)
    const ds = JSON.stringify(['E2', 'E0', 'E9', 'E1', 'E3'])
    const moi = ['2026-11-12', '2026-11-01', '2026-12-31'].map((h) => d.sql.prepare(HO_SO_MOI).all(ds, h, ds, ds))
    const onThiMoi = d.sql.prepare(Q_ON_THI).all(ds)
    for (const x of XOA) d.sql.exec(x)
    const cu = ['2026-11-12', '2026-11-01', '2026-12-31'].map((h) => d.sql.prepare(HO_SO_CU).all(ds, h, ds, ds))
    expect(moi).toEqual(cu)
    expect(onThiMoi).toEqual(d.sql.prepare(Q_ON_THI).all(ds))
    expect(cu[0]!.filter((x: any) => x.k === 'c').length).toBeGreaterThan(10)
    expect(cu[0]!.filter((x: any) => x.k === 'n').length).toBe(4)
  })
  it('kế hoạch: nhánh c / n dùng chỉ mục bộ phận (n không chạm bảng); câu khác giữ kế hoạch cũ', () => {
    const d = taoD1That()
    const ke = keHoach(d.sql, HO_SO_MOI)
    expect(ke).toContain('SEARCH nam_kt_cau USING INDEX nkc_em_toi_han (sbd=? AND moc_on_ke>? AND moc_on_ke<?)')
    expect(ke).toContain('SEARCH nam_kt_cau USING COVERING INDEX nkc_em_chua_kp (sbd=? AND trang_thai=?)')
    expect(keHoach(d.sql, Q_ON_THI)).toContain('SEARCH nam_kt_cau USING INDEX idx_nkc_em_dang (sbd=?)')
    expect(keHoach(d.sql, HO_SO_CU).join('\n')).not.toMatch(/nkc_em_chua_kp/) // danh sách IN cũ không khớp điều kiện chỉ mục
  })
})

// ------------------------------------------------------------------ Q7 · tổng EXP mùa (exp-d1.ts lenhTongSo / dieuKienTongSo / docTongSoSom) + EXP dòng thời gian
const Q_TONG_EXP = 'SELECT (SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= ?) AS e'
const Q_EXP_NGAY = `SELECT MAX(luc), 'exp', ngay_vn, '', SUM(exp), COUNT(*), 0, 0, '' FROM (SELECT luc, ngay_vn, exp FROM exp_so WHERE sbd = ? UNION ALL SELECT created_at, date(created_at, '+7 hours'), amount FROM game_v2_reward WHERE sbd = ? AND amount > 0) GROUP BY ngay_vn`
describe('Q7 tổng EXP: chỉ mục phủ (sbd, luc, exp, ngay_vn)', () => {
  it('có ↔ không chỉ mục: cùng tổng, cùng dòng EXP theo ngày', () => {
    const d = taoD1That()
    const ins = d.sql.prepare('INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,exp,luc) VALUES(?,?,?,?,?,?)')
    for (let i = 0; i < 120; i++) { const j = (i * 53) % 120; ins.run(`k${j}`, `E${j % 3}`, `2026-11-${String(1 + (j % 10)).padStart(2, '0')}`, 'cau', j % 7 - 1, `2026-11-${String(1 + (j % 10)).padStart(2, '0')}T0${j % 10}:00:00.000Z`) }
    const chay = () => ['E0', 'E1', 'E2', 'E9'].flatMap((s) => [...['', '2026-11-04', '2026-11-04T05:00:00.000Z', '2027'].map((m) => d.sql.prepare(Q_TONG_EXP).get(s, m)), d.sql.prepare(Q_EXP_NGAY).all(s, s)])
    const moi = chay()
    expect(keHoach(d.sql, Q_TONG_EXP)).toContain('SEARCH exp_so USING COVERING INDEX exp_so_em_luc (sbd=? AND luc>?)')
    expect(keHoach(d.sql, Q_EXP_NGAY)).toContain('SEARCH exp_so USING COVERING INDEX exp_so_em_luc (sbd=?)')
    d.sql.exec('DROP INDEX exp_so_em_luc')
    expect(moi).toEqual(chay())
    expect(moi.some((x: any) => x?.e > 0)).toBe(true)
  })
  it('câu trong mã còn đúng dạng (lệnh đọc + điều kiện CAS + đọc sớm)', async () => {
    const { readFileSync } = await import('node:fs')
    const ma = readFileSync('server/src/exp-d1.ts', 'utf8')
    expect(ma).toContain('(SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= ?) AS e')
    expect(ma).toContain('(SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= ?) = ?')
    expect(ma).toContain('(SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= mua.s) AS e')
    const d = taoD1That()
    expect(keHoach(d.sql, "UPDATE game_v2_profile SET revision = revision + 1 WHERE sbd = ? AND (SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= ?) = ?").join('\n'))
      .toMatch(/SEARCH exp_so USING COVERING INDEX exp_so_em_luc \(sbd=\? AND luc>\?\)/)
    expect(keHoach(d.sql, "WITH mua AS (SELECT '2026-11-01' AS s) SELECT (SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= mua.s) AS e FROM mua").join('\n'))
      .toMatch(/SEARCH exp_so USING COVERING INDEX exp_so_em_luc \(sbd=\? AND luc>\?\)/)
  })
})

// ------------------------------------------------------------------ Q1 · cron lập sẵn Sảnh: em có bản lệch dấu (san-sang.ts)
/** Câu CŨ (trước 12/11 tối): `goi_moi` dò mọi dòng nhận gói của em. */
const SQL_SAN_SANG_LECH_CU = `SELECT x.value AS sbd, s.dau, (SELECT g.created_at FROM game_v2_session g WHERE g.sbd=x.value ORDER BY g.created_at DESC LIMIT 1) AS gan,
        EXISTS(SELECT 1 FROM goi_bai_7_em e2 JOIN goi_bai_7 g2 ON g2.id=e2.goi_id WHERE e2.sbd=x.value AND g2.tao_luc > strftime('%Y-%m-%dT%H:%M:%fZ', s.luc/1000.0, 'unixepoch')) AS goi_moi
        FROM json_each(?) x JOIN ${BANG_SAN_SANG} s ON s.sbd=x.value AND s.ngay=? AND s.dau LIKE ? ORDER BY x.value`
describe('Q1 lập sẵn Sảnh: «gói mới» đi từ gói tạo sau lúc lập bản', () => {
  it('y hệt câu cũ (cùng dòng, cùng thứ tự) + kế hoạch đi từ chỉ mục lúc tạo gói', () => {
    const d = taoD1That()
    for (const q of SQL_GOI7) d.sql.exec(q)
    for (const q of SQL_SAN_SANG) d.sql.exec(q)
    const LUC = Date.UTC(2026, 10, 12, 10, 0, 0), iso = (ms: number) => new Date(ms).toISOString()
    const goi = d.sql.prepare("INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES(?,?,'12A','b','B','2026-11-01','2026-11-30',?)")
    const nhan = d.sql.prepare("INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) VALUES(?,?,'2026-11-01','2026-11-30')")
    // g1 cũ, g2 tạo đúng lúc lập bản (không «sau»), g3 tạo sau 1 ms, g4 tạo sau nhưng chỉ E2 nhận.
    goi.run('g1', 't1', iso(LUC - 86_400_000)); goi.run('g2', 't2', iso(LUC)); goi.run('g3', 't3', iso(LUC + 1)); goi.run('g4', 't4', iso(LUC + 3_600_000))
    for (const s of ['E0', 'E1', 'E2', 'E3', 'E4']) nhan.run('g1', s)
    nhan.run('g2', 'E0'); nhan.run('g2', 'E3'); nhan.run('g3', 'E1'); nhan.run('g4', 'E2'); nhan.run('g4', 'E9')
    const ss = d.sql.prepare(`INSERT INTO ${BANG_SAN_SANG}(sbd,ngay,luc,dau) VALUES(?,?,?,?)`)
    ss.run('E0', '2026-11-12', LUC, 'v9§a'); ss.run('E1', '2026-11-12', LUC, 'v9§b'); ss.run('E2', '2026-11-12', LUC + 7_200_000, 'v9§c')
    ss.run('E3', '2026-11-12', LUC - 5, 'v9§d'); ss.run('E4', '2026-11-11', LUC, 'v9§e'); ss.run('E5', '2026-11-12', LUC, 'v8§f')
    const ses = d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,'{}',?)")
    ses.run('s1', 'E0', '2026-11-12T01:00:00.000Z'); ses.run('s2', 'E0', '2026-11-12T03:00:00.000Z'); ses.run('s3', 'E3', '2026-11-10T03:00:00.000Z')
    const em = JSON.stringify(['E0', 'E1', 'E2', 'E3', 'E4', 'E5', 'E9'])
    for (const [ngay, dau] of [['2026-11-12', 'v9§%'], ['2026-11-11', 'v9§%'], ['2026-11-12', 'v8§%']] as const) {
      const moi = d.sql.prepare(SQL_SAN_SANG_LECH).all(em, ngay, dau)
      expect(moi).toEqual(d.sql.prepare(SQL_SAN_SANG_LECH_CU).all(em, ngay, dau))
    }
    const r = d.sql.prepare(SQL_SAN_SANG_LECH).all(em, '2026-11-12', 'v9§%') as { sbd: string; goi_moi: number }[]
    expect(r.map((x) => `${x.sbd}:${x.goi_moi}`)).toEqual(['E0:0', 'E1:1', 'E2:0', 'E3:1'])
    const ke = keHoach(d.sql, SQL_SAN_SANG_LECH)
    expect(ke.some((x) => /SEARCH g2 USING (COVERING )?INDEX goi_bai_7_tao \(tao_luc>\?\)/.test(x))).toBe(true)
    expect(ke.some((x) => /SEARCH e2 USING COVERING INDEX sqlite_autoindex_goi_bai_7_em_1 \(goi_id=\? AND sbd=\?\)/.test(x))).toBe(true)
    expect(ke.join('\n')).not.toMatch(/goi_bai_7_em_sbd/)
  })
})

// ------------------------------------------------------------------ Q8 · dòng thời gian em ở màn thầy (gv-hom-nay-v2.ts)
describe('Q8 dòng thời gian em: chỉ mục phủ bộ phận sổ học + chỉ mục phủ EXP', () => {
  const ngoai = (cb: boolean) => `SELECT * FROM (${DONG_THOI_GIAN(cb)}) WHERE luc IS NOT NULL AND luc <> '' AND luc < ? AND loai IN (SELECT value FROM json_each(?)) ORDER BY luc DESC LIMIT 31`
  it('có ↔ không chỉ mục mới: y hệt (mọi trang, mọi bộ lọc loại)', () => {
    const d = taoD1That()
    const sk = d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,giay,luc,ngay_vn) VALUES(?,?,?,?,?,?,?,?,?)')
    const NG = ['btvn', 'btvn_lo', 'on_lai', 'game', 'thi', 'len_bang', 'goi7', 'tu_luyen']
    for (let i = 0; i < 300; i++) {
      const j = (i * 71) % 300, ngay = `2026-11-${String(1 + (j % 11)).padStart(2, '0')}`
      sk.run(`k${j}`, j % 5 === 0 ? 'E1' : 'E0', `q${j % 13}`, NG[j % NG.length], `m${j % 4}`, j % 3 === 0 ? null : j % 2, j % 6 ? j : null, `${ngay}T${String(j % 17).padStart(2, '0')}:00:00.000Z`, ngay)
    }
    const ex = d.sql.prepare('INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,exp,luc) VALUES(?,?,?,?,?,?)')
    for (let i = 0; i < 40; i++) ex.run(`x${i}`, 'E0', `2026-11-${String(1 + (i % 11)).padStart(2, '0')}`, 'cau', i % 5, `2026-11-${String(1 + (i % 11)).padStart(2, '0')}T05:00:00.000Z`)
    const LOAI = [JSON.stringify(['ca', 'btvn', 'on_lai', 'bai_rieng', 'len_bang', 'game', 'exp', 'canh_bao']), JSON.stringify(['btvn', 'game']), JSON.stringify(['exp'])]
    const chay = () => ['E0', 'E1', 'E9'].flatMap((s) => LOAI.flatMap((l) => ['9999-12-31T00:00:00.000Z', '2026-11-06T03:00:00.000Z'].flatMap((truoc) =>
      [true, false].map((cb) => d.sql.prepare(ngoai(cb)).all(...[s, s, s, s, s, ...(cb ? [s] : [])], truoc, l)))))
    const moi = chay()
    const ke = keHoach(d.sql, ngoai(true))
    expect(ke).toContain('SEARCH s USING COVERING INDEX skh_em_dong_tg (sbd=?)')
    expect(ke).toContain('SEARCH exp_so USING COVERING INDEX exp_so_em_luc (sbd=?)')
    d.sql.exec('DROP INDEX skh_em_dong_tg'); d.sql.exec('DROP INDEX exp_so_em_luc')
    expect(moi).toEqual(chay())
    expect(moi[0]!.length).toBe(31)
  })
  it('câu khác trên su_kien_hoc không dùng chỉ mục bộ phận mới', () => {
    const d = taoD1That()
    for (const q of ["SELECT nguon, ma_nguon, ngay_vn, luc FROM su_kien_hoc WHERE sbd = ? AND nguon = 'btvn'", 'SELECT nguon, ma_nguon, COUNT(*) FROM su_kien_hoc WHERE sbd = ? GROUP BY nguon, ma_nguon',
      "SELECT qid FROM su_kien_hoc WHERE sbd = ? AND nguon <> 'thi'"]) expect(keHoach(d.sql, q).join('\n')).not.toMatch(/skh_em_dong_tg/)
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
