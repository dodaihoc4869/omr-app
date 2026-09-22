// @vitest-environment node
// MỐC HIỂN THỊ / MỐC TÍNH NỢ (thầy 21/09 15:52–16:10: mọi thứ của Dồn về đích chỉ tính từ 12:00 trưa 21/09; bài giao TRƯỚC ngày mốc không hiện, không nợ, không nộp trễ). MỘT nơi đọc mốc: server/src/moc-no.ts.
// Thứ tự: `hien_thi_tu` ⇒ `ve_dich_tu` ⇒ `bang_tin_tu` ⇒ hằng 2026-09-21T05:00:00.000Z. SQLite thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { docVeDichCuaEm } from '../server/src/ve-dich-d1'
import { emChamNhip } from '../server/src/gv-bang-tin'
import { baiTuNgayMoc, docMocHienThi, docMocHienThiMs, docMocNo, giaiMocHienThi, MOC_HIEN_THI_MAC_DINH_ISO, ngayCuaCauHinh, NGAY_MOC_NO_MAC_DINH, xoaDemMocHienThi } from '../server/src/moc-no'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, HAN, boCuaEm, dung, giao, gio, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
// test tự sửa `cau_hinh` bằng SQL thô (không qua lệnh thật) ⇒ tự xoá đệm 30 giây của docMocHienThi (moc-no.ts, HẠ TẢI 22/09).
const datCauHinh = (d: D1That, khoa: string, v: string) => { const r = d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,'x')").run(khoa, v); xoaDemMocHienThi(); return r }

describe('hàm thuần', () => {
  it('ngayCuaCauHinh: ISO ⇒ ngày VN của mốc (05:00Z = 12:00 VN cùng ngày; 17:30Z sang ngày VN kế); YYYY-MM-DD ⇒ chính nó; rác ⇒ null', () => {
    expect(ngayCuaCauHinh('2026-09-21T05:00:00.000Z')).toBe('2026-09-21')
    expect(ngayCuaCauHinh('2026-09-21T17:30:00.000Z')).toBe('2026-09-22')
    expect(ngayCuaCauHinh('2026-09-23')).toBe('2026-09-23')
    for (const v of [undefined, null, '', 'rác', '2026-13-45', 5, {}]) expect(ngayCuaCauHinh(v), String(v)).toBeNull()
  })
  it('thứ tự ưu tiên: hien_thi_tu ⇒ ve_dich_tu ⇒ bang_tin_tu ⇒ hằng; giá trị hỏng bị bỏ qua và rơi xuống mốc kế', () => {
    const ms = (iso: string) => Date.parse(iso)
    expect(docMocHienThiMs('2026-09-25T05:00:00.000Z', '2026-09-24', '2026-09-23T05:00:00.000Z')).toBe(ms('2026-09-25T05:00:00.000Z'))
    expect(docMocHienThiMs(undefined, '2026-09-24', '2026-09-23T05:00:00.000Z')).toBe(ms('2026-09-23T17:00:00.000Z')) // '2026-09-24' = 00:00 VN 24/09 = 23/09 17:00Z
    expect(docMocHienThiMs(undefined, 'rác', '2026-09-23T05:00:00.000Z')).toBe(ms('2026-09-23T05:00:00.000Z'))
    expect(docMocHienThiMs(undefined, null, '')).toBe(ms(MOC_HIEN_THI_MAC_DINH_ISO))
    expect(docMocHienThiMs()).toBe(ms('2026-09-21T05:00:00.000Z'))
    expect(docMocNo()).toBe(NGAY_MOC_NO_MAC_DINH)
    expect(giaiMocHienThi('2026-09-23')).toEqual({ iso: '2026-09-22T17:00:00.000Z', ms: Date.parse('2026-09-22T17:00:00.000Z'), ngayVn: '2026-09-23' })
  })
  it('baiTuNgayMoc: giao TRƯỚC 00:00 ngày mốc ⇒ không; đúng 00:00 hoặc sau ⇒ có; giao_luc vắng / hỏng ⇒ có (không giấu vì thiếu dữ liệu)', () => {
    expect(baiTuNgayMoc('2026-09-20T16:59:59.000Z', '2026-09-21')).toBe(false) // 23:59:59 VN 20/09
    expect(baiTuNgayMoc('2026-09-20T17:00:00.000Z', '2026-09-21')).toBe(true) // 00:00 VN 21/09
    expect(baiTuNgayMoc('2026-09-21T03:48:18.389Z', '2026-09-21')).toBe(true) // 4 bài thầy giao 10:48 sáng 21/09
    for (const v of [undefined, null, '', 'rác']) expect(baiTuNgayMoc(v, '2026-09-21'), String(v)).toBe(true)
  })
})

describe('docMocHienThi(env) đọc D1', () => {
  it('không khoá nào ⇒ mặc định 12:00 trưa 21/09 (iso + ms + ngayVn); từng khoá theo thứ tự ưu tiên; khoá hỏng bị bỏ qua', async () => {
    const d = taoD1That()
    expect(await docMocHienThi(d.env)).toEqual({ iso: '2026-09-21T05:00:00.000Z', ms: Date.parse('2026-09-21T05:00:00.000Z'), ngayVn: '2026-09-21' })
    datCauHinh(d, 'bang_tin_tu', '2026-09-22T05:00:00.000Z')
    expect((await docMocHienThi(d.env)).ngayVn).toBe('2026-09-22')
    datCauHinh(d, 've_dich_tu', '2026-09-23')
    expect((await docMocHienThi(d.env)).ngayVn).toBe('2026-09-23') // ve_dich_tu thắng bang_tin_tu
    datCauHinh(d, 'hien_thi_tu', '2026-09-24T05:00:00.000Z')
    expect(await docMocHienThi(d.env)).toMatchObject({ iso: '2026-09-24T05:00:00.000Z', ngayVn: '2026-09-24' }) // hien_thi_tu thắng tất
    datCauHinh(d, 'hien_thi_tu', 'rác')
    expect((await docMocHienThi(d.env)).ngayVn).toBe('2026-09-23') // hỏng ⇒ rơi xuống ve_dich_tu
  })
  it('thiếu bảng cau_hinh ⇒ mặc định, không ném', async () => {
    const d = taoD1That(); d.sql.exec('DROP TABLE cau_hinh')
    expect((await docMocHienThi(d.env)).ngayVn).toBe('2026-09-21')
  })
})

describe('docVeDichCuaEm theo mốc', () => {
  const emBaiMo = async (): Promise<D1That> => {
    gio(BAY_GIO) // giao + mở 22/09 10:00 VN
    const d = dung()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
    await giao(d); await mo(d)
    return d
  }
  const sauBaNgay = new Date(BAY_GIO.getTime() + 3 * 24 * 3_600_000) // 25/09 10:00: chặng 0, 1, 2 đã tới hạn mà chưa làm
  it('bài giao TRƯỚC ngày mốc ⇒ KHÔNG có trong veDich và không nợ; bài giao từ ngày mốc ⇒ có và có nợ', async () => {
    const d = await emBaiMo()
    gio(sauBaNgay)
    const ban = await docVeDichCuaEm(d.env, 'S1', sauBaNgay.getTime()) // mốc mặc định 21/09 < giao 22/09
    expect(ban.veDich).toHaveLength(1)
    expect(ban.no.tongCau).toBeGreaterThan(0)
    datCauHinh(d, 'hien_thi_tu', '2026-09-23') // bài giao 22/09 nay là bài TRƯỚC ngày mốc
    const cu = await docVeDichCuaEm(d.env, 'S1', sauBaNgay.getTime())
    expect(cu.veDich).toEqual([])
    expect(cu.no).toEqual({ theoNgay: [], tongCau: 0, tongPhut: 0 })
  })
  it('nợ ôn quá lịch chỉ từ ngày mốc: món trước mốc bị bỏ, món đúng ngày mốc giữ', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
    const them = (ma: string, ngay: string) => d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,chuyen_de,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,ket_qua_cuoi,nguon_cuoi,luc_cuoi,moc_on_ke,trang_thai,can_day_lai,cap_nhat_luc) VALUES(?,'S1',?,'DA-1','Este',1,1,0,0,0,0,'on_lai','2026-09-19T10:00:00.000Z',?,'dang_on',0,'x')").run(`S1|${ma}`, ma, ngay)
    for (const [ma, ngay] of [['Q1', '2026-09-19'], ['Q2', '2026-09-20'], ['Q3', '2026-09-21'], ['Q4', '2026-09-21']] as const) them(ma, ngay)
    const v = await docVeDichCuaEm(d.env, 'S1', BAY_GIO.getTime()) // hôm nay 22/09, mốc mặc định 21/09
    const on = v.no.theoNgay.filter((m) => m.loai === 'on_lai')
    expect(on.map((m) => m.ngay)).toEqual(['2026-09-21'])
    expect(on[0]!.soCau).toBe(2)
    datCauHinh(d, 'hien_thi_tu', '2026-09-22')
    expect((await docVeDichCuaEm(d.env, 'S1', BAY_GIO.getTime())).no.theoNgay).toEqual([]) // mốc dời sang 22/09: không còn nợ ôn nào
  })
})

describe('NỘP TRỄ chỉ cho bài giao từ ngày mốc (3 đường giữ qua_han cho bài cũ)', () => {
  const SAU_HAN = new Date(Date.parse(HAN) + 4.5 * 3_600_000)
  it('mở bài · nộp chặng · nộp cả bài: bài giao TRƯỚC ngày mốc quá hạn ⇒ qua_han; bài giao từ ngày mốc ⇒ nộp trễ', async () => {
    gio(BAY_GIO)
    const d = dung(2); await giao(d); await mo(d, 'S1')
    datCauHinh(d, 'hien_thi_tu', '2026-09-23') // bài giao 22/09 = bài cũ
    gio(SAU_HAN)
    expect(await mo(d, 'S1')).toMatchObject({ ok: false, lyDo: 'qua_han' }) // mở bài
    expect(await mo(d, 'S2')).toMatchObject({ ok: false, lyDo: 'qua_han' })
    const q0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    expect(await nopChang(d, 0, Object.fromEntries(q0.map((q) => [q, DAP_AN_DUNG(q)])))).toMatchObject({ ok: false, lyDo: 'qua_han' }) // nộp chặng
    d.sql.prepare("DELETE FROM cau_hinh WHERE khoa='hien_thi_tu'").run() // mốc mặc định 21/09: bài giao 22/09 là bài hợp lệ
    expect(await mo(d, 'S1')).toMatchObject({ ok: true })
    expect(await nopChang(d, 0, Object.fromEntries(q0.map((q) => [q, DAP_AN_DUNG(q)])))).toMatchObject({ ok: true })
  })
  it('nộp cả bài THƯỜNG (/btvn/nop) sau hạn: bài giao trước ngày mốc ⇒ qua_han; giao từ ngày mốc ⇒ nộp trễ', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.objects.set('kho/DE1.json', { cau: [{ phan: 'I', so: 1, dap_an: 'A', chuyen_de: 'ES', muc_do: '1 sao' }, { phan: 'I', so: 2, dap_an: 'B', chuyen_de: 'ES', muc_do: '2 sao' }] })
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT0','CA1','DE1',2,?,?,0,'x',0)").run(BAY_GIO.toISOString(), HAN)
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT0|S1','BT0','S1','Em Một')").run()
    datCauHinh(d, 'hien_thi_tu', '2026-09-23')
    gio(SAU_HAN)
    const nop = () => goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'BT0', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } }) as Promise<any>
    expect(await nop()).toMatchObject({ ok: false, lyDo: 'qua_han' })
    d.sql.prepare("DELETE FROM cau_hinh WHERE khoa='hien_thi_tu'").run()
    const ok = await nop()
    expect(ok.ok, JSON.stringify(ok)).toBe(true)
  })
})

describe('chặng theo MỐC GIỜ (tuLuc) — chặng mở trước 12:00 mốc không bao giờ là nợ', () => {
  it('mốc 12:00 trưa 22/09 (bài giao 10:00 22/09): chặng 0 mở lúc chốt 10:00 < mốc ⇒ hom_nay (không nợ, ngay = hôm nay); chặng 1 mở 00:00 23/09 ≥ mốc ⇒ no; đối chứng mốc mặc định 21/09 ⇒ chặng 0 cũng no', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
    await giao(d); await mo(d)
    const t = new Date(BAY_GIO.getTime() + 3 * 24 * 3_600_000) // 25/09 10:00
    gio(t)
    const macDinh = await docVeDichCuaEm(d.env, 'S1', t.getTime())
    expect(macDinh.veDich[0]!.chang.slice(0, 2).map((c) => c.trangThai)).toEqual(['no', 'no'])
    datCauHinh(d, 'hien_thi_tu', '2026-09-22T05:00:00.000Z')
    const v = await docVeDichCuaEm(d.env, 'S1', t.getTime())
    expect(v.veDich[0]!.chang.slice(0, 3).map((c) => c.trangThai)).toEqual(['hom_nay', 'no', 'no'])
    expect(v.veDich[0]!.chang[0]!.ngay).toBe('2026-09-25') // việc hôm nay, không mang nhãn ngày cũ
    expect(v.no.theoNgay.every((m) => m.ngay >= '2026-09-22' && !(m.loai === 'chang_btvn' && m.chiSo === 0))).toBe(true)
    expect(v.no.tongCau).toBeLessThan(macDinh.no.tongCau)
  })
})

describe('emChamNhip(moc) — nợ theo mốc GIỜ cho nhip.noTheoLop (cùng luật soNo của thẻ em)', () => {
  const HAN_ISO = '2026-09-30T05:00:00.000Z'
  const HAN_MS = Date.parse(HAN_ISO)
  const moc21 = giaiMocHienThi('2026-09-21T05:00:00.000Z') // 12:00 trưa 21/09 VN
  // 5 chặng chưa làm chặng nào; chưa lịch lưu ⇒ chặng k tới hạn khi chặng k+1 mở (00:00 VN ngày chốt + k+1)
  const em = (chot: string) => ({ nop_luc: null, so_chang: 5, chot_luc: chot, lo_da_xong: 0, chang_mo_json: null })
  it('không moc ⇒ luật chậm cũ; có moc: chặng mở (gốc) TRƯỚC mốc không phải nợ, kể cả mở lúc 11:00 sáng 21/09 (cùng NGÀY mốc nhưng trước 12:00)', () => {
    const sang = em('2026-09-21T04:00:00.000Z') // mở 11:00 sáng 21/09
    const nowMs = Date.parse('2026-09-22T10:00:00+07:00') // chặng 0 tới hạn (22/09 00:00)
    expect(emChamNhip(sang, HAN_ISO, HAN_MS, nowMs)).toBe(true) // luật cũ: chậm
    expect(emChamNhip(sang, HAN_ISO, HAN_MS, nowMs, moc21)).toBe(false) // 11:00 < 12:00 ⇒ KHÔNG nợ (khớp `no` của thẻ em)
    expect(emChamNhip(em('2026-09-21T05:30:00.000Z'), HAN_ISO, HAN_MS, nowMs, moc21)).toBe(true) // mở 12:30 ⇒ nợ
    expect(emChamNhip(em('2026-09-21T05:00:00.000Z'), HAN_ISO, HAN_MS, nowMs, moc21)).toBe(true) // đúng 12:00 ⇒ giữ (≥ mốc)
    // ngày sau: chặng 1 (mốc gốc 00:00 22/09 ≥ mốc) tới hạn mà chưa làm ⇒ nợ
    expect(emChamNhip(sang, HAN_ISO, HAN_MS, Date.parse('2026-09-23T10:00:00+07:00'), moc21)).toBe(true)
  })
  it('chưa chốt / bài thường quá hạn: chỉ nợ khi hạn rơi từ NGÀY mốc trở đi', () => {
    const chuaChot = { nop_luc: null, so_chang: 0, chot_luc: null, lo_da_xong: 0, chang_mo_json: null }
    const han = Date.parse('2026-09-20T05:00:00.000Z')
    const nowMs = Date.parse('2026-09-22T10:00:00+07:00')
    expect(emChamNhip(chuaChot, new Date(han).toISOString(), han, nowMs)).toBe(true)
    expect(emChamNhip(chuaChot, new Date(han).toISOString(), han, nowMs, moc21)).toBe(false) // hạn 20/09 < mốc
    expect(emChamNhip(chuaChot, new Date(han).toISOString(), han, nowMs, giaiMocHienThi('2026-09-20'))).toBe(true)
  })
  it('khớp soNo ở nhánh bài thường: hạn tay rơi ĐÚNG ngày mốc (21/09) — mốc mở 00:00 21/09 < 12:00 ⇒ KHÔNG nợ; hạn 22/09 ⇒ nợ khi quá hạn', () => {
    const chuaChot = { nop_luc: null, so_chang: 0, chot_luc: null, lo_da_xong: 0, chang_mo_json: null }
    const han21 = Date.parse('2026-09-21T08:00:00.000Z') // 15:00 VN 21/09
    const han22 = Date.parse('2026-09-22T08:00:00.000Z')
    const nowMs = Date.parse('2026-09-23T10:00:00+07:00')
    expect(emChamNhip(chuaChot, new Date(han21).toISOString(), han21, nowMs, moc21)).toBe(false)
    expect(emChamNhip(chuaChot, new Date(han22).toISOString(), han22, nowMs, moc21)).toBe(true)
    expect(emChamNhip(chuaChot, new Date(han21).toISOString(), han21, nowMs)).toBe(true) // không moc ⇒ luật cũ
  })
})

describe('/gv/bang-tin: nhip.noTheoLop theo mốc', () => {
  it('em chậm chặng của bài giao từ ngày mốc ⇒ có noTheoLop; đẩy mốc qua ngày giao (hien_thi_tu) ⇒ Bảng tin theo mốc chung: bài cũ rời cả khối nhịp bài lẫn nợ ⇒ hai khoá vắng', async () => {
    gio(new Date('2026-09-24T13:00:00+07:00'))
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','12','mk','x')").run()
    datCauHinh(d, 'bang_tin_tu', '2026-09-21T05:00:00.000Z')
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,giao_luc,han_nop,so_cau,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT1','Riêng','DE1','2026-09-21T03:48:00.000Z','2026-09-30T05:00:00.000Z',10,0,'x',1)").run()
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten,so_cau,so_chang,lo_da_xong,chot_luc) VALUES('BT1|S1','BT1','S1','Em Một',10,5,0,'2026-09-21T03:50:00.000Z')").run()
    const goi = () => goiWorker(worker, d.env, '/gv/bang-tin', {}, true) as Promise<any>
    const a = await goi()
    expect(a.ok).toBe(true)
    expect(a.nhip.btvnDungNhip).toMatchObject({ tongEm: 1, cham: 1 })
    expect(a.nhip.noTheoLop).toEqual([{ lop: expect.any(String), siSo: 1, soEmNo: 1 }])
    datCauHinh(d, 'hien_thi_tu', '2026-09-22') // bài giao 21/09 nay là bài TRƯỚC ngày mốc
    const b = await goi()
    // SỬA CÓ CHỦ Ý 21/09 (MỘT định nghĩa "câu đã làm" lượt 2, Boss): Bảng tin theo mốc CHUNG (hien_thi_tu thắng bang_tin_tu) ⇒ đẩy mốc qua ngày giao thì bài cũ rời cả khối nhịp bài (trước đây khối nhịp còn theo bang_tin_tu riêng).
    expect(b.nhip).not.toHaveProperty('btvnDungNhip')
    expect(b.nhip).not.toHaveProperty('noTheoLop')
  })
})

describe('cổng nộp trễ khi ĐỌC CẤU HÌNH LỖI: bài cũ vẫn qua_han, bài từ ngày mốc vẫn nộp trễ được', () => {
  const SAU_HAN = new Date(Date.parse(HAN) + 4.5 * 3_600_000)
  const hongCauHinh = (d: D1That) => {
    const goc = d.env.DB.prepare.bind(d.env.DB)
    d.env.DB.prepare = ((q: string) => /FROM cau_hinh WHERE khoa IN \(\?, \?, \?, \?\)/.test(q)
      ? { bind: () => ({ all: async () => { throw new Error('D1 lỗi giả') } }) }
      : goc(q)) as typeof d.env.DB.prepare
  }
  const dungBai = async (giaoLuc: string): Promise<D1That> => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    d.sql.prepare('UPDATE btvn SET giao_luc = ?').run(giaoLuc)
    return d
  }
  it('bài giao 20/09 ⇒ qua_han (mở bài + nộp chặng); bài giao 21/09 10:50 ⇒ nộp trễ được; giao_luc hỏng ⇒ coi là bài cũ (qua_han)', async () => {
    for (const [giao0, duoc] of [['2026-09-20T03:00:00.000Z', false], ['2026-09-21T03:50:00.000Z', true], ['', false]] as const) {
      const d = await dungBai(giao0)
      hongCauHinh(d)
      gio(SAU_HAN)
      const q0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
      const dapAn = Object.fromEntries(q0.map((q) => [q, DAP_AN_DUNG(q)]))
      expect(await mo(d), `mở bài, giao "${giao0}"`).toMatchObject(duoc ? { ok: true } : { ok: false, lyDo: 'qua_han' })
      expect(await nopChang(d, 0, dapAn), `nộp chặng, giao "${giao0}"`).toMatchObject(duoc ? { ok: true } : { ok: false, lyDo: 'qua_han' })
    }
  })
})
