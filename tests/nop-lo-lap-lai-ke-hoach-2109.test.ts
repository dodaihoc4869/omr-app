// @vitest-environment node
// NỘP CHẶNG (/btvn/xong-lo của bài cá nhân hoá) phải LẬP LẠI kế hoạch ngày TRƯỚC khi tính EXP: `tienBo.treNhip` đã lưu là bản CŨ (lập lúc em mở nhiệm vụ);
// em nộp bù xong mà vẫn bị coi trễ nhịp ⇒ "một phần", đứt chuỗi ngày đạt (Code 1 tìm ra, mục 3b của Boss 21/09).
import { afterEach, describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { chotNgayCu } from '../server/src/ke-hoach-ngay-d1'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { BAY_GIO, DAP_AN_DUNG, boCuaEm, dung, giao, gio, mo, nopChang } from './_btvn-nang-do-mau'
import { vi } from 'vitest'

afterEach(() => vi.useRealTimers())

const NGAY = '2026-09-22'
const khoanDat = (d: D1That) => d.sql.prepare("SELECT khoa FROM exp_so WHERE sbd='S1' AND khoa LIKE '%dat|' || ?").all(NGAY) as { khoa: string }[]
const keHoach = (d: D1That) => d.sql.prepare("SELECT ngan_sach_json, viec_json, ket_qua FROM ke_hoach_ngay WHERE sbd='S1' AND ngay=?").get(NGAY) as { ngan_sach_json: string; viec_json: string; ket_qua: string | null } | undefined

async function dungCoKeHoachCu(treNhipCu: boolean, batExp = true) {
  gio(BAY_GIO)
  const d = dung()
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em 1','mk','x')").run()
  if (batExp) d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: '2026-09-01T00:00:00.000Z', dsSbd: ['S1'] }))
  await giao(d)
  await mo(d)
  // Kế hoạch hôm nay do lần em mở nhiệm vụ SÁNG lập; ta ghi đè cờ trễ nhịp thành bản "cũ".
  await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
  const v = JSON.parse(keHoach(d)!.viec_json)
  v.tienBo = { ...v.tienBo, treNhip: treNhipCu }
  d.sql.prepare("UPDATE ke_hoach_ngay SET viec_json=? WHERE sbd='S1' AND ngay=?").run(JSON.stringify(v), NGAY)
  // Em đã luyện thêm 4 câu khác trong ngày (đúng); chặng 0 có 2 câu ⇒ nộp xong đủ 6 = mức tối thiểu của ngày. Không câu tới hạn ôn nào.
  for (let i = 1; i <= 4; i++) {
    d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?, 'S1', ?, 'luyen_dang', 'x', 1, 1, 40, ?, ?)")
      .run(`t${i}`, `ZZ-I-${i}`, BAY_GIO.toISOString(), NGAY)
  }
  return d
}
const nopHetChang0 = async (d: D1That) => {
  const qs = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
  return nopChang(d, 0, Object.fromEntries(qs.map((q) => [q, DAP_AN_DUNG(q)])))
}

describe('nộp chặng lập lại kế hoạch trước khi tính EXP (mục 3b)', () => {
  it('kế hoạch ĐÃ LƯU ghi trễ nhịp nhưng nộp bù xong: đạt ngày được trao NGAY, kế hoạch lưu được làm tươi, chốt 00:01 ra `dat`', async () => {
    const d = await dungCoKeHoachCu(true)
    const r = await nopHetChang0(d)
    expect(r).toMatchObject({ ok: true, loDaXong: 1 })
    expect(khoanDat(d)).toHaveLength(1)
    const tb = JSON.parse(keHoach(d)!.viec_json).tienBo
    expect(tb).toMatchObject({ treNhip: false, daLamCau: 6 })
    // Chốt ngày (00:01 hôm sau) đọc kế hoạch đã lưu: `dat`, không phải `mot_phan`.
    await chotNgayCu(d.env, ['S1'], '2026-09-23', '2026-09-22T17:01:00.000Z')
    expect(keHoach(d)!.ket_qua).toBe('dat')
  })

  it('đối chứng: kế hoạch lưu KHÔNG trễ nhịp ⇒ cũng đạt (đường thường không đổi)', async () => {
    const d = await dungCoKeHoachCu(false)
    await nopHetChang0(d)
    expect(khoanDat(d)).toHaveLength(1)
  })

  it('chưa đủ mức tối thiểu ⇒ KHÔNG đạt dù kế hoạch làm tươi (không nới điều kiện): bỏ 2 câu luyện thêm', async () => {
    const d = await dungCoKeHoachCu(true)
    d.sql.prepare("DELETE FROM su_kien_hoc WHERE khoa IN ('t1','t2')").run()
    await nopHetChang0(d)
    expect(khoanDat(d)).toHaveLength(0)
    expect(JSON.parse(keHoach(d)!.viec_json).tienBo).toMatchObject({ daLamCau: 4 })
  })

  it('EXP mới TẮT cho em ⇒ y như cũ: không lập lại kế hoạch (kế hoạch lưu giữ nguyên), không có khoản EXP', async () => {
    const d = await dungCoKeHoachCu(true, false)
    const truoc = keHoach(d)!.viec_json
    const r = await nopHetChang0(d)
    expect(r).toMatchObject({ ok: true, loDaXong: 1 })
    expect(keHoach(d)!.viec_json).toBe(truoc)
    expect(d.dem('exp_so')).toBe(0)
  })
})

describe('xong lô của bài THƯỜNG (đường cũ) cũng lập lại kế hoạch trước khi tính EXP', () => {
  const TU = '2026-09-01T00:00:00.000Z'
  const TO_KHO = { cau: [
    { phan: 'I', so: 1, dap_an: 'A', chuyen_de: 'ES', muc_do: '1 sao' },
    { phan: 'I', so: 2, dap_an: 'B', chuyen_de: 'ES', muc_do: '2 sao' },
    { phan: 'II', so: 1, dap_an: 'DSDS', chuyen_de: 'AM', muc_do: '' },
    { phan: 'III', so: 1, dap_an: '0.39', chuyen_de: 'AM', muc_do: '' },
  ] }
  async function dungCu() {
    gio(BAY_GIO)
    const d = taoD1That()
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,mat_khau,cap_nhat_luc) VALUES('S1','Em Một','mk','x')").run()
    d.sql.prepare("INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('exp_moi',?,'x')").run(JSON.stringify({ tu: TU, dsSbd: ['S1'] }))
    d.objects.set('kho/DE1.json', TO_KHO)
    d.sql.prepare('INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc) VALUES(?,?,?,?,?,?,0,?)').run('B1', 'CA1', 'DE1', 4, TU, '2099-01-01T00:00:00.000Z', TU)
    d.sql.prepare('INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES(?,?,?,?)').run('B1|S1', 'B1', 'S1', 'Em Một')
    await goiWorker(worker, d.env, '/hs/ke-hoach-ngay', { sbd: 'S1' })
    const v = JSON.parse(keHoach(d)!.viec_json)
    v.tienBo = { ...v.tienBo, treNhip: true }
    d.sql.prepare("UPDATE ke_hoach_ngay SET viec_json=? WHERE sbd='S1' AND ngay=?").run(JSON.stringify(v), NGAY)
    for (let i = 1; i <= 4; i++) {
      d.sql.prepare("INSERT INTO su_kien_hoc (khoa, sbd, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn) VALUES (?, 'S1', ?, 'luyen_dang', 'x', 1, 1, 40, ?, ?)")
        .run(`t${i}`, `ZZ-I-${i}`, BAY_GIO.toISOString(), NGAY)
    }
    return d
  }

  it('kế hoạch đã lưu ghi trễ nhịp, em xong lô bù ⇒ đạt ngày được trao ngay và kế hoạch lưu được làm tươi', async () => {
    const d = await dungCu()
    const r = await goiWorker(worker, d.env, '/btvn/xong-lo', { maBtvn: 'B1', sbd: 'S1', chiSo: 0, dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } })
    expect(r).toMatchObject({ ok: true, loDaXong: 1, suKien: 2 })
    expect(khoanDat(d)).toHaveLength(1)
    expect(JSON.parse(keHoach(d)!.viec_json).tienBo.treNhip).toBe(false)
  })
})
