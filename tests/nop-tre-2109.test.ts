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
    // `tomTat` lưu số của bộ NỘP TRỄ (chỉ lõi), không phải của bộ đầy đủ: tong = số câu thật, không có thử sức thêm, đủ số chặng
    const e2 = d.sql.prepare("SELECT so_cau_em, so_chang, tom_tat_json FROM btvn_em WHERE sbd='S2'").get() as { so_cau_em: number; so_chang: number; tom_tat_json: string }
    const t2 = JSON.parse(e2.tom_tat_json) as { tong: number; soBatBuoc: number; soLoi: number; soRieng: number; soThuThach: number; soThuSucThem: number; soLoiCao: number; soChang: number; nganSachCau: number; soBiet: number; soHieu: number; soVanDung: number }
    expect(t2).toMatchObject({ tong: hang.length, soBatBuoc: hang.length, soLoi: hang.length, soRieng: 0, soThuThach: 0, soThuSucThem: 0, soLoiCao: 0, soChang: e2.so_chang, nganSachCau: hang.length })
    expect(t2.soBiet + t2.soHieu + t2.soVanDung).toBe(hang.length)
    expect(e2.so_cau_em).toBe(hang.length)
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

// ── Rà chéo Code 1 (ddf5038): bộ NỘP TRỄ chỉ có lõi ⇒ thích nghi / khắc phục / mở sớm KHÔNG được thêm câu hay dồn thêm chặng vào ngày của em trễ ──────────────────────────────
/** Tờ kho lớn: 100 câu phần I (dạng xoay DA-1..DA-6), ghim 65 câu đầu ⇒ ≥ 65 lõi bắt buộc ⇒ nộp trễ chia ≥ 3 chặng (30 + 30 + 5), còn 35 câu ngoài lõi để thích nghi "thêm câu dễ". */
function khoLon() {
  const muc = ['biet', 'hieu'] // chỉ Biết/Hiểu: không câu nào thành "thử sức thêm" (loi_cao) ⇒ cả 65 câu ghim đều BẮT BUỘC
  const cau = Array.from({ length: 100 }, (_, k) => {
    const i = k + 1
    return { phan: 'I', so: i, de: `Câu I.${i}`, pa: { A: 'a', B: 'b', C: 'c', D: 'd' }, dap_an: 'A', chuyen_de: 'Este', muc_do: muc[(i - 1) % 2], dang: { ma: `DA-${1 + ((i - 1) % 6)}`, ten: `Dạng ${1 + ((i - 1) % 6)}` }, can_chua: { sao: (i - 1) % 2, dk: [], ly_do: 'x', bay: null }, loi_giai: { chot: `LG-${i}` }, kienThuc: ['KT'] }
  })
  return { cau, thay: cau.map((c) => ({ qid: `DE1-I-${c.so}`, dang: c.dang.ma, chuyenDe: 'Este', mucDo: muc.indexOf(c.muc_do), sao: c.can_chua.sao, phan: 'I' })) }
}
async function dungBaiLon(soEm = 3) {
  const d = dung(soEm)
  const k = khoLon()
  d.objects.set('kho/DE1.json', { ma_de: 'DE1', cau: k.cau })
  d.sql.prepare("UPDATE de_kho SET so_cau = 100 WHERE ma_de = 'DE1'").run()
  const g = await giao(d, { cau: k.thay, ghim: k.thay.slice(0, 65).map((c) => c.qid) }) as any
  expect(g.ok, JSON.stringify(g)).toBe(true)
  return d
}
const hangEm = (d: D1That, sbd: string) => d.sql.prepare('SELECT qid, chang FROM btvn_em_cau WHERE sbd = ? AND chang >= 0 ORDER BY chang, thu_tu').all(sbd) as { qid: string; chang: number }[]
const emRow = (d: D1That, sbd: string) => d.sql.prepare('SELECT so_cau_em, so_chang, tom_tat_json, ngan_sach_json, chang_mo_json FROM btvn_em WHERE sbd = ?').get(sbd) as { so_cau_em: number; so_chang: number; tom_tat_json: string; ngan_sach_json: string; chang_mo_json: string }

describe('bộ NỘP TRỄ chỉ có lõi: không thích nghi, không khắc phục, không mở sớm, số liệu lưu là của bộ lõi', () => {
  it('bài ≥ 65 lõi (3 chặng): em mở SAU hạn ⇒ cờ nopTre trong ngan_sach_json; tomTat lưu số của BỘ LÕI (tong = số câu thật, không thử sức, đủ số chặng); chặng 0 sai hết ⇒ chặng chưa mở KHÔNG đổi một câu', async () => {
    gio(BAY_GIO)
    const d = await dungBaiLon(2); await mo(d, 'S1')
    gio(SAU_HAN_4G30)
    expect(await mo(d, 'S2')).toMatchObject({ ok: true, nopTre: true })
    const r0 = emRow(d, 'S2')
    expect(JSON.parse(r0.ngan_sach_json).nopTre).toBe(true)
    expect(JSON.parse(emRow(d, 'S1').ngan_sach_json).nopTre).toBeUndefined() // bộ đúng hạn KHÔNG mang cờ
    const truoc = hangEm(d, 'S2')
    expect(r0.so_chang).toBeGreaterThanOrEqual(3)
    const tt = JSON.parse(r0.tom_tat_json) as Record<string, number>
    expect(tt).toMatchObject({ tong: truoc.length, soBatBuoc: truoc.length, soLoi: truoc.length, soRieng: 0, soThuThach: 0, soLoiCao: 0, soThuSucThem: 0, soChang: r0.so_chang, nganSachCau: truoc.length })
    expect(r0.so_cau_em).toBe(truoc.length)
    // chặng 0 sai HẾT (đường thích nghi "sai ≥ 50 % ⇒ thêm câu dễ" + khắc phục Bộ não chạy sau chặng xong)
    const q0 = truoc.filter((x) => x.chang === 0).map((x) => x.qid)
    const kq = await nopChang(d, 0, Object.fromEntries(q0.map((q) => [q, 'B'])), 'S2') as any
    expect(kq.ok, JSON.stringify(kq)).toBe(true)
    expect(hangEm(d, 'S2')).toEqual(truoc) // mọi chặng giữ nguyên: không thêm / đổi / bớt câu nào
    expect(emRow(d, 'S2').so_cau_em).toBe(truoc.length)
  })

  it('CHỐT RIÊNG của thích nghi: dù tomTat.nganSachCau còn số của bộ ĐẦY ĐỦ (dữ liệu chốt trước bản vá), cờ nopTre vẫn chặn "thêm câu dễ" — đối chứng: bỏ cờ thì câu CÓ được thêm vào chặng chưa mở', async () => {
    gio(BAY_GIO)
    const d = await dungBaiLon(3); await mo(d, 'S1')
    gio(SAU_HAN_4G30)
    await mo(d, 'S2'); await mo(d, 'S3')
    const sai = async (sbd: string) => {
      const q0 = hangEm(d, sbd).filter((x) => x.chang === 0).map((x) => x.qid)
      const kq = await nopChang(d, 0, Object.fromEntries(q0.map((q) => [q, 'B'])), sbd) as any
      expect(kq.ok, JSON.stringify(kq)).toBe(true)
    }
    for (const sbd of ['S2', 'S3']) d.sql.prepare("UPDATE btvn_em SET tom_tat_json = json_set(tom_tat_json, '$.nganSachCau', 95) WHERE sbd = ?").run(sbd) // ngân sách của bộ đầy đủ: còn chỗ cho 30 câu
    d.sql.prepare("UPDATE btvn_em SET ngan_sach_json = json_remove(ngan_sach_json, '$.nopTre') WHERE sbd = 'S3'").run() // S3: KHÔNG cờ (như bộ đúng hạn)
    const truocS2 = hangEm(d, 'S2'); const truocS3 = hangEm(d, 'S3')
    await sai('S2'); await sai('S3')
    expect(hangEm(d, 'S2')).toEqual(truocS2) // có cờ nopTre ⇒ chặng chưa mở nguyên vẹn
    expect(hangEm(d, 'S3').length, 'đối chứng: không cờ thì thích nghi CÓ thêm câu dễ').toBeGreaterThan(truocS3.length)
  })

  it('bài ≥ 65 lõi: đúng hết hai chặng đầu KHÔNG mở sớm chặng 3 (em trễ tối đa 2 chặng/ngày); chặng 3 vẫn mở 00:00 ngày sau; phản hồi không có moSom', async () => {
    gio(BAY_GIO)
    const d = await dungBaiLon(2); await mo(d, 'S1')
    gio(SAU_HAN_4G30)
    await mo(d, 'S2')
    const truoc = hangEm(d, 'S2')
    const lichTruoc = (JSON.parse(emRow(d, 'S2').chang_mo_json) as { chang: { moLuc: string }[] }).chang
    expect(Date.parse(lichTruoc[2]!.moLuc)).toBeGreaterThan(SAU_HAN_4G30.getTime()) // chặng 3 CHƯA mở
    let kq: any
    for (const k of [0, 1]) {
      kq = await nopChang(d, k, Object.fromEntries(truoc.filter((x) => x.chang === k).map((x) => [x.qid, DAP_AN_DUNG(x.qid)])), 'S2')
      expect(kq.ok, JSON.stringify(kq)).toBe(true)
    }
    expect(kq.moSom ?? null).toBeNull() // không có khối mở sớm
    const lichSau = JSON.parse(emRow(d, 'S2').chang_mo_json) as { chang: { moLuc: string }[]; moSom?: unknown[] }
    expect(lichSau.chang[2]!.moLuc).toBe(lichTruoc[2]!.moLuc) // mốc mở chặng 3 không đổi
    expect(lichSau.moSom ?? []).toEqual([])
    expect(await nopChang(d, 2, Object.fromEntries(truoc.filter((x) => x.chang === 2).map((x) => [x.qid, DAP_AN_DUNG(x.qid)])), 'S2')).toMatchObject({ ok: false }) // vẫn khoá tới 00:00
  })

  it('bài KHÔNG còn câu lõi nào cho em ⇒ lời riêng "không còn câu bắt buộc" (lyDo khong_con_cau_bat_buoc), KHÔNG phải "thử lại sau ít phút"; không chốt bộ', async () => {
    gio(BAY_GIO)
    const d = dung(2); await giao(d); await mo(d, 'S1')
    d.sql.prepare('UPDATE btvn_cau SET loi = 0, ghim = 0').run() // thầy gỡ hết lõi/ghim sau khi giao (dữ liệu hiếm)
    gio(SAU_HAN_4G30)
    const r = await mo(d, 'S2') as any
    expect(r).toMatchObject({ ok: false, lyDo: 'khong_con_cau_bat_buoc' })
    expect(String(r.error)).toMatch(/không còn câu bắt buộc/)
    expect(String(r.error)).not.toMatch(/thử lại/)
    expect((d.sql.prepare("SELECT chot_luc FROM btvn_em WHERE sbd='S2'").get() as { chot_luc: string | null }).chot_luc).toBeNull()
  })
})

// ── Cờ LÙI NHANH `cau_hinh.btvn_nop_tre = 'tat'` (Boss 21/09: nộp trễ đổi luật hạn nộp): trở lại luật cũ ở CẢ BA đường; vắng cờ ⇒ nộp trễ như thường ─────────────────────────────────────────
describe("cờ lùi nộp trễ: cau_hinh.btvn_nop_tre = 'tat' ⇒ luật cũ (qua hạn là khoá qua_han) ở mở bài · nộp chặng · nộp cả bài", () => {
  const tat = (d: D1That) => d.sql.prepare("INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('btvn_nop_tre','tat','x')").run()

  it('MỞ BÀI: cờ tắt ⇒ em đã mở lẫn em chưa từng mở đều nhận qua_han và KHÔNG chốt bộ; bỏ cờ ⇒ mở được', async () => {
    gio(BAY_GIO)
    const d = dung(2); await giao(d); await mo(d, 'S1')
    tat(d)
    gio(SAU_HAN_4G30)
    expect(await mo(d, 'S1')).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect(await mo(d, 'S2')).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect((d.sql.prepare("SELECT chot_luc FROM btvn_em WHERE sbd='S2'").get() as { chot_luc: string | null }).chot_luc).toBeNull()
    d.sql.prepare("DELETE FROM cau_hinh WHERE khoa='btvn_nop_tre'").run()
    expect(await mo(d, 'S1')).toMatchObject({ ok: true })
    expect(await mo(d, 'S2')).toMatchObject({ ok: true, nopTre: true })
  })

  it('NỘP CHẶNG: cờ tắt ⇒ chặng sau hạn bị qua_han (không ghi đáp án); bỏ cờ ⇒ nộp được', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); await mo(d)
    tat(d)
    gio(SAU_HAN_4G30)
    const q0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    const dapAn = Object.fromEntries(q0.map((q) => [q, DAP_AN_DUNG(q)]))
    expect(await nopChang(d, 0, dapAn)).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect((d.sql.prepare("SELECT lo_da_xong FROM btvn_em WHERE sbd='S1'").get() as { lo_da_xong: number }).lo_da_xong).toBe(0)
    d.sql.prepare("DELETE FROM cau_hinh WHERE khoa='btvn_nop_tre'").run()
    expect(await nopChang(d, 0, dapAn)).toMatchObject({ ok: true })
  })

  it('NỘP CẢ BÀI (/btvn/nop): cờ tắt ⇒ bài thường nộp LẦN ĐẦU sau hạn bị qua_han, không ghi nop_luc; bỏ cờ ⇒ nộp trễ', async () => {
    gio(BAY_GIO)
    const d = dung()
    d.objects.set('kho/DE1.json', { cau: [{ phan: 'I', so: 1, dap_an: 'A', chuyen_de: 'ES', muc_do: '1 sao' }, { phan: 'I', so: 2, dap_an: 'B', chuyen_de: 'ES', muc_do: '2 sao' }] })
    d.sql.prepare("INSERT INTO btvn(ma_btvn,ma_ca,ma_de,so_cau,giao_luc,han_nop,da_xoa,cap_nhat_luc,ca_nhan) VALUES('BT0','CA1','DE1',2,?,?,0,'x',0)").run(BAY_GIO.toISOString(), HAN)
    d.sql.prepare("INSERT INTO btvn_em(khoa,ma_btvn,sbd,ho_ten) VALUES('BT0|S1','BT0','S1','Em Một')").run()
    tat(d)
    gio(SAU_HAN_4G30)
    const nop = () => goiWorker(worker, d.env, '/btvn/nop', { maBtvn: 'BT0', sbd: 'S1', dapAn: { 'DE1-I-1': 'A', 'DE1-I-2': 'B' } }) as Promise<any>
    expect(await nop()).toMatchObject({ ok: false, lyDo: 'qua_han' })
    expect((d.sql.prepare("SELECT nop_luc FROM btvn_em WHERE khoa='BT0|S1'").get() as { nop_luc: string | null }).nop_luc).toBeNull()
    d.sql.prepare("DELETE FROM cau_hinh WHERE khoa='btvn_nop_tre'").run()
    const ok = await nop()
    expect(ok.ok, JSON.stringify(ok)).toBe(true)
    expect(d.sql.prepare("SELECT nop_tre FROM btvn_em WHERE khoa='BT0|S1'").get()).toEqual({ nop_tre: 1 })
  })

  it('TRƯỚC hạn cờ tắt không đổi gì (đường thường không bị chạm)', async () => {
    gio(BAY_GIO)
    const d = dung(); await giao(d); tat(d)
    expect(await mo(d)).toMatchObject({ ok: true })
    const q0 = boCuaEm(d).filter((x) => x.chang === 0).map((x) => x.qid)
    expect(await nopChang(d, 0, Object.fromEntries(q0.map((q) => [q, DAP_AN_DUNG(q)])))).toMatchObject({ ok: true })
  })
})
