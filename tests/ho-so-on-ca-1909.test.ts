// @vitest-environment node
// Lệnh `hoSoOnCa` (docs/hop-dong-ho-so-on-ca-1909.md): hồ sơ ôn cho RÚT ĐỀ RIÊNG. CHỈ ĐỌC; lỗi/thiếu bảng → ok:false, KHÔNG ok:true rỗng.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'
import { hoSoOnCa, TOI_DA_LAM_MOI_EM, TOI_DA_EM_MOT_LUOT } from '../server/src/ho-so-on-ca'
import { ghiSuKien, type NguonSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const NGAY_CA = '2026-09-21'
const luc = (ngay: string, gio = 5) => `${ngay}T${String(gio).padStart(2, '0')}:00:00.000Z` // 12:00 giờ VN cùng ngày
const ca = (d: D1That, ma: string, batDau: string, o: { loai?: string | null; tt?: string } = {}) =>
  d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,loai,cap_nhat_luc) VALUES(?,?,?,?,?,?)').run(ma, `Ca ${ma}`, o.tt ?? 'dong', batDau, o.loai === undefined ? 'thi' : o.loai, 'x')
const nop = (d: D1That, sbd: string, maCa: string, qid: string, lan = 1) =>
  d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,lan_thu,phan,so_cau,qid,cap_nhat_luc) VALUES(?,?,?,?, 'I', 1, ?, 'x')").run(`${maCa}|${sbd}|${lan}|${qid}`, maCa, sbd, lan, qid)
const sai = (d: D1That, sbd: string, maCa: string, qid: string) =>
  d.sql.prepare("INSERT INTO ban_do_sai(khoa,ma_ca,sbd,qid,cap_nhat_luc) VALUES(?,?,?,?,'x')").run(`${maCa}|${sbd}|${qid}`, maCa, sbd, qid)
const hoSo = (d: D1That, sbd: string, qid: string, tt: string, o: { lanSai?: number; moc?: string | null; maDang?: string | null } = {}) =>
  d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,?,?,?,'',1,?,0,0,0,'thi','2026-09-16T00:00:00Z',?,?,0,'x')")
    .run(`${sbd}|${qid}`, sbd, qid, o.maDang === undefined ? 'ES-01' : o.maDang, o.lanSai ?? 1, o.moc === undefined ? '2026-09-20' : o.moc, tt)
async function sk(d: D1That, ds: { sbd: string; qid: string; nguon: NguonSuKien; ngay: string; gio?: number; kq?: 0 | 1 | null; lan?: number }[]) {
  const r = await ghiSuKien(d.env, ds.map((e, i) => ({ nguon: e.nguon, maNguon: `M${i}`, sbd: e.sbd, qid: e.qid, lan: e.lan ?? 1, ketQua: e.kq === undefined ? 1 : e.kq, luc: luc(e.ngay, e.gio ?? 5) })))
  expect(r.ok).toBe(true)
}
const goi = (d: D1That, b: Record<string, unknown>) => goiWorker(worker, d.env, '/goi', { action: 'hoSoOnCa', maCa: 'CA-SAP-MO', ngayCa: NGAY_CA, ...b }, true)

/** S1 nộp C2 (mới nhất) và C1; S2 chỉ nộp C1 (nghỉ buổi C2); S3 chưa nộp ca nào. */
function dung() {
  const d = taoD1That()
  ca(d, 'C1', '2026-09-10T01:00:00.000Z'); ca(d, 'C2', '2026-09-17T01:00:00.000Z'); ca(d, 'C0', '2026-09-03T01:00:00.000Z')
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']) nop(d, 'S1', 'C2', q)
  nop(d, 'S1', 'C1', 'Q9'); nop(d, 'S2', 'C1', 'Q9'); nop(d, 'S1', 'C0', 'Q0')
  // S1 sai ở C2: Q1 da_khac_phuc, Q2 moi_sai, Q3 dang_on, Q4 chưa có dòng hồ sơ, Q5 chua_thay_sai
  for (const q of ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']) sai(d, 'S1', 'C2', q)
  hoSo(d, 'S1', 'Q1', 'da_khac_phuc'); hoSo(d, 'S1', 'Q2', 'moi_sai', { lanSai: 2, moc: '2026-09-20', maDang: 'ESTER.THUY_PHAN.TINH_KHOI_LUONG' })
  hoSo(d, 'S1', 'Q3', 'dang_on', { lanSai: 1, moc: '2026-09-25', maDang: 'CD:Ester - Lipid' }); hoSo(d, 'S1', 'Q5', 'chua_thay_sai')
  // S1 sai ở C1: Q9 moi_sai (S2 cũng sai Q9 ở C1)
  sai(d, 'S1', 'C1', 'Q9'); sai(d, 'S2', 'C1', 'Q9'); hoSo(d, 'S1', 'Q9', 'moi_sai'); hoSo(d, 'S2', 'Q9', 'dang_on')
  d.sql.prepare("INSERT OR IGNORE INTO hoc_sinh(sbd,ho_ten,cap_nhat_luc) VALUES('S1','x','x'),('S2','x','x'),('S3','x','x')").run()
  return d
}

describe('sai[] / daKhacPhuc[] / tuCa', () => {
  it('(a) sai ở ca gần nhất: moi_sai/dang_on → sai[] đủ 5 trường; da_khac_phuc → daKhacPhuc[]; chưa có dòng hồ sơ và chua_thay_sai KHÔNG xuất hiện', async () => {
    const d = dung()
    const r = await goi(d, { dsSbd: ['S1'] })
    expect(r.ok).toBe(true)
    const e = r.em.S1
    expect(e.tuCa).toBe('C2')
    expect([...e.sai].sort((a: { qid: string }, b: { qid: string }) => a.qid.localeCompare(b.qid))).toEqual([
      { qid: 'Q2', lanSai: 2, mocOnKe: '2026-09-20', maDang: 'ESTER.THUY_PHAN.TINH_KHOI_LUONG', trangThai: 'moi_sai' },
      { qid: 'Q3', lanSai: 1, mocOnKe: '2026-09-25', maDang: 'CD:Ester - Lipid', trangThai: 'dang_on' },
    ])
    expect(e.daKhacPhuc).toEqual(['Q1'])
    const qidNoiTieng = JSON.stringify([e.sai.map((x: { qid: string }) => x.qid), e.daKhacPhuc])
    expect(qidNoiTieng).not.toMatch(/Q4|Q5/) // không đoán: máy thầy xử theo luật cũ
    expect(qidNoiTieng).not.toContain('Q9') // Q9 là của ca C1, không phải ca gần nhất của S1
  })

  it('(b) MỖI EM MỘT ca: em nghỉ buổi gần nhất thì ca của em là buổi trước nữa; em chưa nộp ca nào có khoá rỗng', async () => {
    const d = dung()
    const r = await goi(d, { dsSbd: ['S1', 'S2', 'S3'] })
    expect(r.em.S1.tuCa).toBe('C2')
    expect(r.em.S2.tuCa).toBe('C1')
    expect(r.em.S2.sai).toEqual([expect.objectContaining({ qid: 'Q9', trangThai: 'dang_on' })])
    expect(r.em.S3).toEqual({ tuCa: '', sai: [], daKhacPhuc: [], lam: [] }) // vẫn CÓ khoá
    expect(Object.keys(r.em).sort()).toEqual(['S1', 'S2', 'S3'])
  })

  it('(c) maCa sắp mở bị loại dù em đã có dòng ở đó (thi lại, ca mở lại)', async () => {
    const d = dung()
    ca(d, 'CA-SAP-MO', '2026-09-20T01:00:00.000Z') // mới hơn cả C2
    nop(d, 'S1', 'CA-SAP-MO', 'Q7'); sai(d, 'S1', 'CA-SAP-MO', 'Q7'); hoSo(d, 'S1', 'Q7', 'moi_sai')
    const r = await goi(d, { dsSbd: ['S1'] })
    expect(r.em.S1.tuCa).toBe('C2')
    expect(JSON.stringify(r.em.S1.sai)).not.toContain('Q7')
  })

  it('bài tập, ca đã xoá bị loại; loai NULL vẫn là ca thi', async () => {
    const d = taoD1That()
    ca(d, 'BT', '2026-09-18T01:00:00.000Z', { loai: 'baitap' }); ca(d, 'XOA', '2026-09-19T01:00:00.000Z', { tt: 'da_xoa' })
    ca(d, 'NULLTHI', '2026-09-12T01:00:00.000Z', { loai: null }); ca(d, 'THI', '2026-09-08T01:00:00.000Z')
    for (const c of ['BT', 'XOA', 'NULLTHI', 'THI']) { nop(d, 'S1', c, `Q-${c}`); sai(d, 'S1', c, `Q-${c}`); hoSo(d, 'S1', `Q-${c}`, 'moi_sai') }
    expect((await goi(d, { dsSbd: ['S1'] })).em.S1.tuCa).toBe('NULLTHI')
    expect((await goi(d, { dsSbd: ['S1'], soCa: 3 })).em.S1.tuCa).toBe('NULLTHI + THI')
  })

  it('(h) soCa = 3: hợp tối đa 3 ca gần nhất em có nộp, mới nhất trước, nối " + "; câu trùng giữa các ca chỉ xuất hiện một lần; giá trị khác 1/3 ⇒ 1', async () => {
    const d = dung()
    sai(d, 'S1', 'C0', 'Q9'); sai(d, 'S1', 'C0', 'Q0'); hoSo(d, 'S1', 'Q0', 'moi_sai') // Q9 đã sai ở C1 rồi
    ca(d, 'C-1', '2026-08-20T01:00:00.000Z'); nop(d, 'S1', 'C-1', 'Q-CU'); sai(d, 'S1', 'C-1', 'Q-CU'); hoSo(d, 'S1', 'Q-CU', 'moi_sai')
    const ba = (await goi(d, { dsSbd: ['S1'], soCa: 3 })).em.S1
    expect(ba.tuCa).toBe('C2 + C1 + C0')
    const qid = ba.sai.map((x: { qid: string }) => x.qid).sort()
    expect(qid).toEqual(['Q0', 'Q2', 'Q3', 'Q9'])
    expect(qid).not.toContain('Q-CU') // ca thứ 4 không lấy
    for (const soCa of [2, 0, 'x', null, undefined, 4]) expect((await goi(d, { dsSbd: ['S1'], soCa })).em.S1.tuCa).toBe('C2')
  })

  it('mocOnKe sai khuôn ⇒ null; maDang thiếu ⇒ null; lanSai NULL ⇒ 0', async () => {
    const d = taoD1That()
    ca(d, 'C2', '2026-09-17T01:00:00.000Z'); nop(d, 'S1', 'C2', 'Q1'); sai(d, 'S1', 'C2', 'Q1')
    hoSo(d, 'S1', 'Q1', 'moi_sai', { moc: 'mai', maDang: null })
    const s = (await goi(d, { dsSbd: ['S1'] })).em.S1.sai[0]
    expect(s).toEqual({ qid: 'Q1', lanSai: 1, mocOnKe: null, maDang: null, trangThai: 'moi_sai' })
  })
})

describe('lam[] — câu em vừa làm trong tuần', () => {
  it('(d) cửa sổ [ngayCa − 7, ngayCa] đủ cả hai đầu; ngoài ra loại; đủ MỌI nguồn và MỌI kết quả', async () => {
    const d = taoD1That()
    const nguon: NguonSuKien[] = ['thi', 'btvn', 'btvn_lo', 'khac_phuc', 'mom', 'len_bang', 'game', 'luyen', 'on_lai']
    await sk(d, nguon.map((n, i) => ({ sbd: 'S1', qid: `N-${n}`, nguon: n, ngay: '2026-09-18', kq: [1, 0, null][i % 3] as 0 | 1 | null })))
    await sk(d, [
      { sbd: 'S1', qid: 'DAU', nguon: 'btvn', ngay: '2026-09-14' }, // = ngayCa − 7: vào
      { sbd: 'S1', qid: 'CUOI', nguon: 'btvn', ngay: '2026-09-21' }, // = ngayCa: vào
      { sbd: 'S1', qid: 'QUA-CU', nguon: 'btvn', ngay: '2026-09-13' }, // −8: ra
      { sbd: 'S1', qid: 'TUONG-LAI', nguon: 'btvn', ngay: '2026-09-22' }, // +1: ra
      { sbd: 'S2', qid: 'EM-KHAC', nguon: 'btvn', ngay: '2026-09-18' },
    ])
    const lam: string[] = (await goi(d, { dsSbd: ['S1'] })).em.S1.lam
    expect(lam).toEqual(expect.arrayContaining(['DAU', 'CUOI', ...nguon.map((n) => `N-${n}`)]))
    for (const q of ['QUA-CU', 'TUONG-LAI', 'EM-KHAC']) expect(lam).not.toContain(q)
    expect(lam).toHaveLength(2 + nguon.length)
  })

  it('MỚI NHẤT đứng đầu (theo MAX(luc)), hoà thì qid tăng dần; khử trùng theo qid', async () => {
    const d = taoD1That()
    await sk(d, [
      { sbd: 'S1', qid: 'B', nguon: 'btvn', ngay: '2026-09-19', gio: 3 },
      { sbd: 'S1', qid: 'A', nguon: 'btvn', ngay: '2026-09-20', gio: 8 },
      { sbd: 'S1', qid: 'A', nguon: 'mom', ngay: '2026-09-15', gio: 8 }, // A xuất hiện hai lần → một mục
      { sbd: 'S1', qid: 'C', nguon: 'btvn', ngay: '2026-09-19', gio: 3 }, // hoà với B → B trước C (qid tăng)
      { sbd: 'S1', qid: 'D', nguon: 'btvn', ngay: '2026-09-16', gio: 9 },
    ])
    expect((await goi(d, { dsSbd: ['S1'] })).em.S1.lam).toEqual(['A', 'B', 'C', 'D'])
  })

  it(`chặn ≤ ${TOI_DA_LAM_MOI_EM} qid/em: cắt phần CŨ nhất (cuối mảng), mỗi câu một mốc riêng`, async () => {
    const d = taoD1That()
    const soCau = TOI_DA_LAM_MOI_EM + 30
    // Câu i càng lớn càng MỚI (mốc riêng theo giây): 30 câu cũ nhất là Q0000..Q0029.
    for (let i = 0; i < soCau; i++) {
      const gio = String(1 + Math.floor(i / 3600)).padStart(2, '0'), phut = String(Math.floor((i % 3600) / 60)).padStart(2, '0'), giay = String(i % 60).padStart(2, '0')
      d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn) VALUES(?,?,?,?,?,?,?,?,?)")
        .run(`k${i}`, 'S1', `Q${String(i).padStart(4, '0')}`, 'btvn', 'B', 1, 1, `2026-09-19T${gio}:${phut}:${giay}.000Z`, '2026-09-19')
    }
    const lam: string[] = (await goi(d, { dsSbd: ['S1'] })).em.S1.lam
    expect(lam).toHaveLength(TOI_DA_LAM_MOI_EM)
    expect(lam[0]).toBe(`Q${String(soCau - 1).padStart(4, '0')}`) // mới nhất đứng đầu
    expect(lam[lam.length - 1]).toBe('Q0030') // cắt đúng 30 câu cũ nhất
    for (let i = 0; i < 30; i++) expect(lam).not.toContain(`Q${String(i).padStart(4, '0')}`)
  })

  it('ngayCa thiếu hoặc sai khuôn ⇒ dùng ngày VN của máy chủ', async () => {
    const d = taoD1That()
    const now = Date.parse('2026-09-21T05:00:00Z')
    await sk(d, [{ sbd: 'S1', qid: 'HOM-NAY', nguon: 'btvn', ngay: '2026-09-21' }, { sbd: 'S1', qid: 'CU', nguon: 'btvn', ngay: '2026-09-10' }])
    for (const ngayCa of [undefined, 'abc', '2026-13-40', 20260921, '']) {
      const r = await hoSoOnCa(d.env, { dsSbd: ['S1'], maCa: 'X', ngayCa }, now)
      expect((r.em as Record<string, { lam: string[] }>).S1.lam).toEqual(['HOM-NAY'])
    }
  })
})

describe('đầu vào, lỗi, chi phí, CHỈ ĐỌC', () => {
  it(`(e) > ${TOI_DA_EM_MOT_LUOT} em ⇒ ok:false (không cắt im lặng); đúng ${TOI_DA_EM_MOT_LUOT} thì ok; rỗng ⇒ ok, em {}; trùng/rỗng được dọn`, async () => {
    const d = dung()
    const nhieu = Array.from({ length: TOI_DA_EM_MOT_LUOT + 1 }, (_, i) => `E${i}`)
    expect(await goi(d, { dsSbd: nhieu })).toMatchObject({ ok: false, error: 'Xin quá nhiều em một lượt' })
    const du = await goi(d, { dsSbd: nhieu.slice(0, TOI_DA_EM_MOT_LUOT) })
    expect(du.ok).toBe(true)
    expect(Object.keys(du.em)).toHaveLength(TOI_DA_EM_MOT_LUOT)
    expect(await goi(d, { dsSbd: [] })).toMatchObject({ ok: true, em: {} })
    expect(await goi(d, {})).toMatchObject({ ok: true, em: {} })
    expect(Object.keys((await goi(d, { dsSbd: ['S1', ' S1 ', '', 7, null] })).em)).toEqual(['S1'])
    // 21 em nhưng có 1 trùng ⇒ 20 duy nhất ⇒ hợp lệ
    expect((await goi(d, { dsSbd: [...nhieu.slice(0, TOI_DA_EM_MOT_LUOT), 'E0'] })).ok).toBe(true)
  })

  it('(f) thiếu bảng (nam_kt_cau, su_kien_hoc, ban_do_sai, chi_tiet_cau) ⇒ ok:false có lời báo, KHÔNG ném lỗi, KHÔNG ok:true rỗng', async () => {
    for (const bang of ['nam_kt_cau', 'su_kien_hoc', 'ban_do_sai', 'chi_tiet_cau']) {
      const d = dung()
      d.sql.exec(`DROP TABLE ${bang}`)
      const r = await goi(d, { dsSbd: ['S1'] })
      expect(r.ok, bang).toBe(false)
      expect(String(r.error)).toBeTruthy()
      expect('em' in r).toBe(false)
    }
  })

  it('(g) ≤ 3 truy vấn D1 một lượt (đúng 3 khi có ca; 2 khi không em nào có ca thi), bất kể số em', async () => {
    const d = dung()
    const t0 = d.soLenh.prepare
    await goi(d, { dsSbd: ['S1', 'S2', 'S3'] })
    // `/goi` còn tốn vài truy vấn của cổng: đo riêng hàm thuần.
    d.soLenh.prepare = 0
    await hoSoOnCa(d.env, { dsSbd: ['S1', 'S2', 'S3', 'E1', 'E2'], maCa: 'CA-SAP-MO', ngayCa: NGAY_CA })
    expect(d.soLenh.prepare).toBe(3)
    const trong = taoD1That()
    trong.soLenh.prepare = 0
    await hoSoOnCa(trong.env, { dsSbd: ['S1'], maCa: 'X', ngayCa: NGAY_CA })
    expect(trong.soLenh.prepare).toBe(2)
    void t0
  })

  it('(i) CHỈ ĐỌC: không đổi dòng nào ở ca, chi_tiet_cau, ban_do_sai, nam_kt_*, su_kien_hoc, tien_do_hs', async () => {
    const d = dung()
    await sk(d, [{ sbd: 'S1', qid: 'Q1', nguon: 'btvn', ngay: '2026-09-19' }])
    const bang = ['ca', 'chi_tiet_cau', 'ban_do_sai', 'nam_kt_cau', 'nam_kt_dang', 'su_kien_hoc', 'tien_do_hs', 'luot']
    const truoc = bang.map((b) => d.chup(b))
    await goi(d, { dsSbd: ['S1', 'S2', 'S3'], soCa: 3 })
    expect(bang.map((b) => d.chup(b))).toEqual(truoc)
  })

  it('lệnh của THẦY: không có mã bí mật ⇒ từ chối, không lộ hồ sơ', async () => {
    const d = dung()
    const r = await goiWorker(worker, d.env, '/goi', { action: 'hoSoOnCa', dsSbd: ['S1'], maCa: 'X', ngayCa: NGAY_CA }, false)
    expect(r).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    expect(JSON.stringify(r)).not.toContain('Q2')
  })
})
