// @vitest-environment node
// NỘP TRỄ bài tập về nhà (Dồn về đích, Điều 4 = B — thầy chốt 21/09 14:13): qua hạn em VẪN làm và nộp được (bài đã mở / bài thường); lượt nộp ghi `nop_tre` + `gio_tre`; hạn nộp KHÔNG đổi; không EXP đúng hạn;
// điểm chấm như thường; nộp LẠI, thử-sức-thêm và làm-lại sau hạn vẫn khoá; bài bị thu hồi vẫn khoá. SQLite thật.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, HAN, boCuaEm, dung, giao, gio, maBtvn, mo, nopChang } from './_btvn-nang-do-mau'

afterEach(() => vi.useRealTimers())
const SAU_HAN_4G30 = new Date(Date.parse(HAN) + 4.5 * 3_600_000) // 4,5 giờ sau hạn ⇒ trễ 5 giờ (làm tròn lên)
const bai = (d: D1That) => d.sql.prepare("SELECT nop_luc, nop_tre, gio_tre, so_dung, so_cau, lo_da_xong, so_chang FROM btvn_em WHERE sbd='S1'").get() as { nop_luc: string | null; nop_tre: number; gio_tre: number | null; so_dung: number | null; so_cau: number | null; lo_da_xong: number; so_chang: number }

/** Đi hết mọi chặng (đáp án đúng, trừ `sai` câu đầu chặng 0) ở thời điểm hiện tại của đồng hồ giả; trả kết quả lượt cuối. */
async function lamHetChang(d: D1That, sai = 0, soChang = bai(d).so_chang) {
  let kq: any
  for (let k = 0; k < soChang; k++) {
    const qs = boCuaEm(d).filter((x) => x.chang === k).map((x) => x.qid)
    kq = await nopChang(d, k, Object.fromEntries(qs.map((q, i) => [q, k === 0 && i < sai ? 'B' : DAP_AN_DUNG(q)])))
    expect(kq.ok, JSON.stringify(kq)).toBe(true)
  }
  return kq
}

describe('bài cá nhân hoá: đã MỞ trước hạn, làm và nộp SAU hạn', () => {
  it('nộp chặng và nộp cuối sau hạn đều được; ghi nop_tre = 1 và gio_tre = 5 (trễ 4,5 giờ làm tròn lên); điểm như thường; hạn nộp không đổi', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    const han0 = (d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop
    gio(SAU_HAN_4G30)
    const kq = await lamHetChang(d, 2) // 2 câu sai ở chặng 0
    expect(kq.nop).toMatchObject({ daNop: true }); expect(kq.nop.soDung).toBeGreaterThan(0)
    const b = bai(d)
    expect(b.nop_luc).not.toBeNull(); expect(b.nop_tre).toBe(1); expect(b.gio_tre).toBe(5)
    expect(b.so_cau! - b.so_dung!).toBe(2) // điểm chấm như thường: đúng 2 câu sai
    expect((d.sql.prepare('SELECT han_nop FROM btvn').get() as { han_nop: string }).han_nop).toBe(han0) // hạn nộp KHÔNG bị đổi
  })

  it('nộp đúng hạn ⇒ nop_tre = 0, gio_tre rỗng (đường thường không đổi)', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    gio(new Date(Date.parse(HAN) - 3_600_000))
    await lamHetChang(d)
    expect(bai(d)).toMatchObject({ nop_tre: 0, gio_tre: null })
    expect(bai(d).nop_luc).not.toBeNull()
  })

  it('sau hạn: KHÔNG có EXP nộp đúng hạn (`btvn|`), chặng trễ nhận khoản TRỄ NHỊP (8), không vé "lô đúng nhịp"', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d)
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em 1','mk','x')").run()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
    await mo(d)
    gio(SAU_HAN_4G30)
    await lamHetChang(d)
    const khoan = d.sql.prepare("SELECT khoa, loai, exp FROM exp_so WHERE sbd='S1' AND loai IN ('btvn','lo') ORDER BY khoa").all() as { khoa: string; loai: string; exp: number }[]
    expect(khoan.filter((x) => x.loai === 'btvn')).toEqual([]) // không thưởng nộp đúng hạn
    expect(khoan.filter((x) => x.loai === 'lo').length).toBeGreaterThan(0)
    expect(khoan.filter((x) => x.loai === 'lo').every((x) => x.exp === 8)).toBe(true) // toàn trễ nhịp (8), không 20 đúng nhịp
  })

  it('thiếu cột nop_tre (Worker lên trước migration) ⇒ VẪN nộp được, không lỗi', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    const soChang = bai(d).so_chang
    d.sql.exec('ALTER TABLE btvn_em DROP COLUMN nop_tre; ALTER TABLE btvn_em DROP COLUMN gio_tre')
    gio(SAU_HAN_4G30)
    const kq = await lamHetChang(d, 0, soChang)
    expect(kq.nop).toMatchObject({ daNop: true })
    expect((d.sql.prepare("SELECT nop_luc FROM btvn_em WHERE sbd='S1'").get() as { nop_luc: string | null }).nop_luc).not.toBeNull()
  })

  it('thử-sức-thêm sau hạn VẪN khoá; bài bị THU HỒI (thầy khoá tay) vẫn khoá', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    gio(SAU_HAN_4G30)
    const soChang = bai(d).so_chang
    expect(await nopChang(d, soChang, { 'DE1-I-1': 'A' })).toMatchObject({ ok: false, lyDo: 'qua_han' }) // chặng ẢO thử sức thêm
    d.sql.exec("UPDATE btvn_em SET thu_hoi = 1")
    expect(await nopChang(d, 0, { 'DE1-I-1': 'A' })).toMatchObject({ ok: false })
  })
})

describe('mở bài SAU hạn (cua-em)', () => {
  it('em CHƯA từng mở bài cá nhân hoá mà hạn đã qua VẪN phải làm (Boss chốt): chốt bộ CHỈ PHẦN LÕI, không thử sức; chặng đầu mở NGAY; cờ quaHan + nopTre; làm hết ⇒ nộp trễ 5 giờ', async () => {
    gio(BAY_GIO)
    const d = dung(2); await giao(d)
    await mo(d, 'S1') // S1 mở trước hạn (bộ đầy đủ)
    gio(SAU_HAN_4G30)
    const r = await mo(d, 'S2') as any
    expect(r).toMatchObject({ ok: true, quaHan: true, nopTre: true, daNop: false })
    const hang = d.sql.prepare("SELECT qid, chang, nhan FROM btvn_em_cau WHERE sbd='S2' ORDER BY chang, thu_tu").all() as { qid: string; chang: number; nhan: string }[]
    expect(hang.length).toBeGreaterThan(0)
    expect(hang.every((x) => x.chang >= 0)).toBe(true) // KHÔNG có nhóm thử sức thêm (chang = -1)
    const loiBai = new Set((d.sql.prepare('SELECT qid FROM btvn_cau WHERE loi = 1').all() as { qid: string }[]).map((x) => x.qid))
    expect(hang.every((x) => loiBai.has(x.qid))).toBe(true) // chỉ phần LÕI
    expect(hang.length).toBeLessThan((d.sql.prepare("SELECT COUNT(*) n FROM btvn_em_cau WHERE sbd='S1'").get() as { n: number }).n) // ít hơn bộ đầy đủ của S1
    const lich = JSON.parse((d.sql.prepare("SELECT chang_mo_json FROM btvn_em WHERE sbd='S2'").get() as { chang_mo_json: string }).chang_mo_json) as { chang: { moLuc: string }[] }
    expect(lich.chang[0]!.moLuc).toBe(SAU_HAN_4G30.toISOString()) // chặng đầu mở NGAY
    // làm hết các chặng (tuần tự) rồi nộp ⇒ nộp trễ
    const soChang = (d.sql.prepare("SELECT so_chang FROM btvn_em WHERE sbd='S2'").get() as { so_chang: number }).so_chang
    let kq: any
    for (let k = 0; k < soChang; k++) {
      const qs = hang.filter((x) => x.chang === k).map((x) => x.qid)
      kq = await nopChang(d, k, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])), 'S2')
      if (k < 2) expect(kq.ok, JSON.stringify(kq)).toBe(true) // hai chặng đầu của ngày đầu
    }
    if (soChang <= 2) {
      expect(kq.nop).toMatchObject({ daNop: true })
      expect(d.sql.prepare("SELECT nop_tre, gio_tre FROM btvn_em WHERE sbd='S2'").get()).toEqual({ nop_tre: 1, gio_tre: 5 })
    }
    expect(d.sql.prepare("SELECT nop_tre FROM btvn_em WHERE sbd='S1'").get()).toEqual({ nop_tre: 0 }) // em kia chưa nộp: không bị đánh dấu
  })

  it('em ĐÃ mở bài trước hạn mở lại sau hạn được', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d, 'S1')
    gio(SAU_HAN_4G30)
    const lai = await mo(d, 'S1') as any
    expect(lai.ok).toBe(true); expect(lai.daNop).toBe(false); expect(lai.quaHan).toBe(true)
  })

  it('bài THƯỜNG (không cá nhân hoá) qua hạn: em vẫn MỞ và nộp LẦN ĐẦU được (nộp trễ); nộp LẠI sau hạn vẫn qua_han', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.objects.set('kho/DE1.json', { cau: [{ phan: 'I', so: 1, dap_an: 'A', chuyen_de: 'ES', muc_do: '1 sao' }, { phan: 'I', so: 2, dap_an: 'B', chuyen_de: 'ES', muc_do: '2 sao' }] })
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT0','CA1','DE1',2,?,?,0,'x',0)").run(BAY_GIO.toISOString(), HAN)
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT0|S1','BT0','S1','Em Một')").run()
    gio(SAU_HAN_4G30)
    const m = await goiWorker(worker, d.env, '/btvn/cua-em', { maCa: 'CA1', sbd: 'S1', maBtvn: 'BT0' }) as any
    expect(m.ok).toBe(true)
    const nop = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'BT0', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } }) as any
    expect(nop.ok, JSON.stringify(nop)).toBe(true)
    expect(d.sql.prepare("SELECT nop_tre, gio_tre FROM btvn_em WHERE khoa='BT0|S1'").get()).toEqual({ nop_tre: 1, gio_tre: 5 })
    const lai = await goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'BT0', sbd: 'S1', dapAn: { 'DE1-I-1': 'B', 'DE1-I-2': 'B' } }) as any
    expect(lai).toMatchObject({ ok: false, lyDo: 'qua_han' })
  })
})
