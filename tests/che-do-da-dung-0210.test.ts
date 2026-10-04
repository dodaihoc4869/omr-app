// @vitest-environment node
// CHẾ ĐỘ "KIỂM CHỨNG CÂU ĐÃ ĐÚNG" (02/10) — lõi thuần (src/lib/rut-de-da-dung.ts) + máy chủ thật trên D1 sqlite (server/src/cau-da-dung.ts):
//   · nguồn CHỈ câu em đã tự làm đúng trong chiến dịch em có mặt (bỏ có hỗ trợ / chỉ đọc lời giải / ca chưa công bố / ngoài chiến dịch / tự luận);
//   · nhãn = nơi lần đúng gần nhất (ca / chiến dịch + kênh) + ngày + mức độ;
//   · phân bổ theo tỷ lệ ma trận 2026 cho 28 · 14 · 10 câu; thiếu ô ⇒ báo, KHÔNG lấp câu chưa đúng; ngẫu nhiên tái tạo theo hạt giống;
//   · /vao-thi: em vào sau ⇒ lấp từ câu đã đúng trong kho ca, nhãn xuống máy em, KHÔNG đáp án.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { goiWorker, taoD1That } from './_d1-that'
import type { Env } from '../server/src/kieu'
import {
  banDoDaDung,
  chuThieuDaDung,
  phanBoMaTran2026,
  rutDeDaDung,
  soCauTheoPhan,
  taoNhanDaDung,
  xepSaiLaiDaDung,
  type CauDaDung,
} from '../src/lib/rut-de-da-dung'
import { MA_TRAN_HOA_2026 } from '../src/lib/ma-tran-hoa-2026'
import type { PhanV2 } from '../src/lib/rut-de-v2'

const cau = (qid: string, phan: PhanV2, mucDo: string): CauDaDung => ({ qid, phan, mucDo, nhan: `Ca Thử · 01/10 · ${mucDo}`, soLanDung: 1, soLanSai: 0 })
/** Kho đã đúng dồi dào: mỗi ô 20 câu. */
const khoDu = (tien = 'Q'): CauDaDung[] =>
  (['I', 'II', 'III'] as const).flatMap((p) => (['biet', 'hieu', 'van_dung'] as const).flatMap((m) => Array.from({ length: 20 }, (_, i) => cau(`${tien}-${p}-${m}-${i}`, p, m))))
const demO = (ds: { phan: string; mucDo: string }[]) => {
  const ra: Record<string, number> = {}
  for (const x of ds) ra[`${x.phan}|${x.mucDo}`] = (ra[`${x.phan}|${x.mucDo}`] ?? 0) + 1
  return ra
}

describe('phân bổ theo tỷ lệ ma trận 2026 (phần dư lớn nhất)', () => {
  it('28 câu ⇒ ĐÚNG Y ma trận', () => {
    const pb = phanBoMaTran2026(28)
    for (const p of ['I', 'II', 'III'] as const) expect(pb[p]).toEqual({ ...MA_TRAN_HOA_2026[p] })
    expect(soCauTheoPhan(pb)).toEqual({ I: 18, II: 4, III: 6 })
  })
  it('14 câu ⇒ 9·2·3, tổng đúng 14, từng ô theo tỷ lệ', () => {
    const pb = phanBoMaTran2026(14)
    expect(soCauTheoPhan(pb)).toEqual({ I: 9, II: 2, III: 3 })
    expect(pb).toEqual({ I: { biet: 6, hieu: 2, van_dung: 1 }, II: { biet: 0, hieu: 2, van_dung: 0 }, III: { biet: 0, hieu: 1, van_dung: 2 } })
  })
  it('10 câu ⇒ tổng đúng 10 (7·1·2), ô theo tỷ lệ', () => {
    const pb = phanBoMaTran2026(10)
    expect(soCauTheoPhan(pb)).toEqual({ I: 7, II: 1, III: 2 })
    expect(pb).toEqual({ I: { biet: 4, hieu: 2, van_dung: 1 }, II: { biet: 0, hieu: 1, van_dung: 0 }, III: { biet: 0, hieu: 1, van_dung: 1 } })
  })
  it('mọi n từ 1 tới 40: tổng luôn = n, Phần II không bao giờ có ô Nhận biết', () => {
    for (let n = 1; n <= 40; n++) {
      const sc = soCauTheoPhan(phanBoMaTran2026(n))
      expect(sc.I + sc.II + sc.III).toBe(n)
      expect(phanBoMaTran2026(n).II.biet).toBe(0)
    }
  })
})

describe('rút: chỉ câu đã đúng, đúng ô, ngẫu nhiên có hạt giống', () => {
  it('kho đủ: mỗi em đúng số câu từng ô của ma trận (28 · 14 · 10), không câu ngoài nguồn của em', () => {
    for (const n of [28, 14, 10]) {
      const nguon = { A: khoDu('A'), B: khoDu('B') }
      const kq = rutDeDaDung({ nguon, dsSbd: ['A', 'B'], tongCau: n, seed: 'CA1' })
      const pb = phanBoMaTran2026(n)
      for (const s of ['A', 'B'] as const) {
        expect(kq.theoEm[s]).toHaveLength(n)
        const d = demO(kq.theoEm[s]!)
        for (const p of ['I', 'II', 'III'] as const) for (const m of ['biet', 'hieu', 'van_dung'] as const) expect(d[`${p}|${m}`] ?? 0).toBe(pb[p][m])
        expect(kq.theoEm[s]!.every((c) => c.qid.startsWith(`${s}-`))).toBe(true)
        expect(kq.thieu[s]).toBeUndefined()
      }
    }
  })

  it('cùng hạt giống ⇒ cùng bộ (chấm lại tái tạo được); khác mã ca ⇒ khác bộ; hai em cùng kho ⇒ khác nhau', () => {
    const kho = khoDu('C')
    const a = rutDeDaDung({ nguon: { S1: kho, S2: kho }, dsSbd: ['S1', 'S2'], tongCau: 14, seed: 'CA1' })
    const b = rutDeDaDung({ nguon: { S1: kho, S2: kho }, dsSbd: ['S2', 'S1'], tongCau: 14, seed: 'CA1' })
    const c = rutDeDaDung({ nguon: { S1: kho, S2: kho }, dsSbd: ['S1', 'S2'], tongCau: 14, seed: 'CA2' })
    expect(a.theoEm).toEqual(b.theoEm)
    expect(c.theoEm.S1).not.toEqual(a.theoEm.S1)
    const chung = a.theoEm.S1!.filter((x) => a.theoEm.S2!.some((y) => y.qid === x.qid))
    expect(chung).toHaveLength(0) // kho đủ ⇒ hai em ngồi cạnh không trùng câu nào
  })

  it('thiếu ô ⇒ mượn mức gần nhất CÙNG PHẦN; vẫn thiếu ⇒ để trống + báo, KHÔNG lấp câu em chưa đúng', () => {
    // Em chỉ đã đúng: Phần I đủ, Phần III chỉ 1 câu Vận dụng + 1 câu Nhận biết, Phần II không câu nào.
    const nguon = [...khoDu('D').filter((c) => c.phan === 'I'), cau('D-III-vd', 'III', 'van_dung'), cau('D-III-b', 'III', 'biet')]
    const kq = rutDeDaDung({ nguon: { X: nguon }, dsSbd: ['X'], tongCau: 14, seed: 'CA1' })
    const bo = kq.theoEm.X!
    expect(bo.filter((c) => c.phan === 'I')).toHaveLength(9)
    expect(bo.filter((c) => c.phan === 'II')).toHaveLength(0)
    const p3 = bo.filter((c) => c.phan === 'III')
    expect(p3.map((c) => c.qid).sort()).toEqual(['D-III-b', 'D-III-vd'])
    expect(p3.find((c) => c.qid === 'D-III-b')).toMatchObject({ lechMuc: true }) // mượn sang ô Thông hiểu/Vận dụng
    expect(bo.every((c) => nguon.some((n) => n.qid === c.qid))).toBe(true)
    const thieu = kq.thieu.X!
    expect(thieu.filter((t) => t.phan === 'II').reduce((n, t) => n + t.so, 0)).toBe(2)
    expect(thieu.filter((t) => t.phan === 'III').reduce((n, t) => n + t.so, 0)).toBe(1)
    expect(chuThieuDaDung('Em X', thieu)).toEqual(['Em X thiếu 2 câu Phần II vì chưa làm đúng đủ', 'Em X thiếu 1 câu Phần III vì chưa làm đúng đủ'])
  })

  it('bản đồ: bộ câu + nhãn từng câu từng em + đếm đúng/sai cũ', () => {
    const kq = rutDeDaDung({ nguon: { A: [cau('a1', 'I', 'biet')] }, dsSbd: ['A'], tongCau: 1, seed: 'C' })
    const bd = banDoDaDung(kq)
    expect(bd.bo).toEqual({ A: ['a1'] })
    expect(bd.daDung.A).toEqual({ a1: 'Ca Thử · 01/10 · biet' })
    expect(bd.demDaDung.A).toEqual({ a1: [1, 0] })
  })

  it('nhãn: nơi · dd/mm · mức độ bằng chữ đủ', () => {
    expect(taoNhanDaDung('Ca Kiểm tra tuần 3', '2026-09-28', 'hieu')).toBe('Ca Kiểm tra tuần 3 · 28/09 · Thông hiểu')
  })

  it('kết thúc bài: em sai NHIỀU câu đã làm đúng nhất lên đầu', () => {
    const e = (sbd: string, tong: number, sai: number) => ({ sbd, hoTen: sbd, tong, sai: Array.from({ length: sai }, (_, i) => ({ soCau: i + 1, phan: 'I' as const, qid: `${sbd}${i}`, nhan: '' })) })
    expect(xepSaiLaiDaDung([e('An', 14, 1), e('Bình', 14, 5), e('Chi', 10, 5), e('Dũng', 0, 0), e('Em', 14, 0)]).map((x) => x.sbd)).toEqual(['Chi', 'Bình', 'An', 'Em'])
  })
})

// =====================================================================================================
// MÁY CHỦ — D1 thật (sqlite) qua Worker thật.
function dungD1() {
  const d = taoD1That()
  const env = d.env as unknown as Env
  const q = (qid: string, phan: PhanV2, mucDo: string, them: Record<string, unknown> = {}) =>
    d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
      .run('DE9', qid, 'v1', `g-${qid}`, 'D1', JSON.stringify({ qid, maDe: 'DE9', phan, text: `Câu ${qid}`, choices: ['a', 'b', 'c', 'd'], hinhAnh: [], dang: 'D1', mucDo, correct: 'B', reviewed: true, ...them }))
  for (const [id, p, m] of [['Q1', 'I', 'NB'], ['Q2', 'I', 'TH'], ['Q3', 'I', 'VD'], ['Q4', 'I', 'TH'], ['Q5', 'I', 'TH'], ['Q6', 'I', 'TH'], ['Q7', 'III', 'VD'], ['Q8', 'I', 'TH'], ['Q9', 'I', 'TH']] as const) q(id, p, m)
  q('QT', 'III', 'VD', { tuLuan: true })
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc,trang_thai) VALUES(?,?,?,?,?,?,?,?,?)")
    .run('CD1', 'Ôn chương 1', '12A', JSON.stringify(['S1', 'S2']), '["DE9"]', JSON.stringify(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'QT', 'Q9']), '2026-10-30', '2026-09-01T00:00:00Z', 'dang_chay')
  d.sql.prepare("INSERT INTO chien_dich(id,ten,lop,sbd_json,ma_de_json,qid_json,han_nop,tao_luc,trang_thai) VALUES(?,?,?,?,?,?,?,?,?)")
    .run('CD0', 'Đã huỷ', '12A', JSON.stringify(['S1']), '["DE9"]', JSON.stringify(['Q9']), '2026-10-30', '2026-09-01T00:00:00Z', 'da_huy')
  d.sql.prepare("INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, cap_nhat_luc) VALUES ('K3','Kiểm tra tuần 3','dong',45,'thi','ngay',3,30,'x')").run()
  d.sql.prepare("INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES('P1','S1',?, 'x')").run(JSON.stringify({ doan: { tram: 1 } }))
  let k = 0
  const ev = (sbd: string, qid: string, nguon: string, maNguon: string, kq: number, luc: string, them: { assistance?: string; purpose?: string; visibility?: string } = {}) =>
    d.sql.prepare('INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,lan,ket_qua,luc,ngay_vn,assistance,purpose,visibility) VALUES(?,?,?,?,?,1,?,?,?,?,?,?)')
      .run(`k${k++}`, sbd, qid, nguon, maNguon, kq, luc, luc.slice(0, 10), them.assistance ?? 'none', them.purpose ?? null, them.visibility ?? null)
  ev('S1', 'Q1', 'thi', 'K3', 1, '2026-09-28T03:00:00Z') // đúng ở ca
  ev('S1', 'Q2#3', 'game', 'P1', 1, '2026-09-27T03:00:00Z') // đúng ở Đoàn (lượt lặp "#3" quy về gốc)
  ev('S1', 'Q2', 'on_lai', 'x', 0, '2026-09-29T03:00:00Z') // sau đó sai — vẫn vào nguồn, ghi số lần sai
  ev('S1', 'Q3~ss1', 'on_lai', 'x', 1, '2026-09-26T03:00:00Z') // song sinh quy về gốc
  ev('S1', 'Q4', 'game', 'P1', 1, '2026-09-26T03:00:00Z', { assistance: 'assisted' }) // có hỗ trợ ⇒ bỏ
  ev('S1', 'Q5', 'on_lai', 'x', 1, '2026-09-26T03:00:00Z', { purpose: 'xem_loi_giai' }) // chỉ đọc lời giải ⇒ bỏ
  ev('S1', 'Q6', 'thi', 'K3', 1, '2026-09-26T03:00:00Z', { visibility: 'embargoed' }) // ca chưa công bố ⇒ bỏ
  ev('S1', 'Q8', 'thi', 'K3', 1, '2026-09-26T03:00:00Z') // ngoài mọi chiến dịch ⇒ bỏ
  ev('S1', 'QT', 'thi', 'K3', 1, '2026-09-26T03:00:00Z') // tự luận ⇒ bỏ
  ev('S1', 'Q7', 'len_bang', 'x', 1, '2026-09-25T03:00:00Z')
  ev('S2', 'Q9', 'luyen', 'x', 1, '2026-09-25T03:00:00Z')
  ev('S3', 'Q1', 'thi', 'K3', 1, '2026-09-28T03:00:00Z') // S3 không ở chiến dịch nào
  return { d, env }
}

describe('/ca/cau-da-dung — câu em đã TỰ làm đúng trong chiến dịch, kèm nhãn', () => {
  it('nguồn đúng luật; nhãn ca / chiến dịch + kênh / kênh khác; số lần đúng/sai; không mã bí mật ⇒ từ chối', async () => {
    const { env } = dungD1()
    expect((await goiWorker(worker, env, '/ca/cau-da-dung', { sbd: ['S1'] })).ok).toBe(false)
    const r = await goiWorker(worker, env, '/ca/cau-da-dung', { sbd: ['S1', 'S2', 'S3'] }, true)
    expect(r.ok).toBe(true)
    const s1 = r.em.S1 as { qid: string; nhan: string; mucDo: string; soLanDung: number; soLanSai: number; phan: string }[]
    expect(s1.map((x) => x.qid)).toEqual(['Q1', 'Q2', 'Q3', 'Q7'])
    expect(s1.find((x) => x.qid === 'Q1')).toMatchObject({ phan: 'I', mucDo: 'biet', nhan: 'Ca Kiểm tra tuần 3 · 28/09 · Nhận biết', soLanDung: 1, soLanSai: 0 })
    expect(s1.find((x) => x.qid === 'Q2')).toMatchObject({ nhan: 'Chiến dịch Ôn chương 1 (Đoàn Hộ Tống) · 27/09 · Thông hiểu', soLanDung: 1, soLanSai: 1 })
    expect(s1.find((x) => x.qid === 'Q3')!.nhan).toBe('Ôn lại · 26/09 · Vận dụng')
    expect(s1.find((x) => x.qid === 'Q7')!.nhan).toBe('Lên bảng · 25/09 · Vận dụng')
    expect(r.em.S2.map((x: { qid: string }) => x.qid)).toEqual(['Q9'])
    expect(r.em.S2[0].nhan).toBe('Luyện đề · 25/09 · Thông hiểu')
    expect(r.em.S3).toEqual([])
    expect(JSON.stringify(r)).not.toMatch(/"correct"/) // không đáp án
    expect((await goiWorker(worker, env, '/ca/cau-da-dung', { sbd: Array.from({ length: 21 }, (_, i) => `E${i}`) }, true)).ok).toBe(false)
  })
})

describe('/vao-thi — ca "Kiểm chứng câu đã đúng": em vào sau ⇒ lấp từ câu đã đúng trong kho ca, nhãn xuống máy em, không đáp án', () => {
  const KEY = {
    phanI: ['Q1', 'Q2', 'Q3', 'Q4', 'Q9', 'Q8'].map((id) => ({ id, text: `Câu ${id} tính m`, choices: ['1', '2', '3', '4'], correct: 'B', mucDo: id === 'Q1' ? 'biet' : id === 'Q3' ? 'van_dung' : 'hieu' })),
    phanII: [],
    phanIII: [{ id: 'Q7', text: 'Tính V', correct: '2,24', mucDo: 'van_dung' }],
  }
  async function dungCa(bo: unknown) {
    const { d, env } = dungD1()
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','An','12A','x')")
    d.sql.prepare(
      `INSERT INTO ca (ma_ca, ten_ca, trang_thai, thoi_gian_phut, loai, cong_bo, nguong_lan, nguong_giay, bank_r2, so_cau_json, bo_theo_em_json, cap_nhat_luc, lop, phong_cho, de_rieng, bat_dau_thi_luc, len_bang, pham_vi_hoi_lai)
       VALUES ('C1','Ca kiểm chứng','mo',45,'thi','khong',3,30,'de/C1.json',?,?,'x','12A',1,1,'2026-10-02T02:00:00.000Z',0,'da_dung')`,
    ).run(JSON.stringify({ I: 7, II: 1, III: 2 }), bo === null ? null : JSON.stringify(bo))
    await env.DE!.put('key/C1.json', JSON.stringify(KEY))
    await env.DE!.put('de/C1.json', JSON.stringify(KEY))
    return { d, env }
  }

  it('em S1 vào sau khi chốt ⇒ chỉ câu S1 đã đúng (Q1 Q2 Q3 Q7), ô thiếu để trống, nhãn đi kèm, bản đồ gộp', async () => {
    const { d, env } = await dungCa({ bo: { S2: ['Q9'] }, cheDo: 'da_dung', daDung: { S2: { Q9: 'Luyện đề · 25/09 · Thông hiểu' } } })
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })
    expect(v.ok).toBe(true)
    expect([...v.boTheoEm.bo.S1].sort()).toEqual(['Q1', 'Q2', 'Q3', 'Q7'])
    expect(v.boTheoEm.daDung.S1.Q1).toBe('Ca Kiểm tra tuần 3 · 28/09 · Nhận biết')
    expect(v.boTheoEm.daDung.S2).toBeUndefined() // nhãn của bạn khác không xuống máy em
    expect(JSON.stringify(v)).not.toContain('correct')
    expect(v.boTheoEm.demDaDung).toBeUndefined() // đếm đúng/sai chỉ thầy xem
    const banDo = JSON.parse((d.sql.prepare("SELECT bo_theo_em_json AS b FROM ca WHERE ma_ca='C1'").get() as { b: string }).b)
    expect(banDo.bo.S2).toEqual(['Q9'])
    expect([...banDo.bo.S1].sort()).toEqual(['Q1', 'Q2', 'Q3', 'Q7'])
    expect(banDo.demDaDung.S1.Q2).toEqual([1, 1])
    const lai = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S1', idThietBi: 'm1' })
    expect(lai.boTheoEm.bo.S1).toEqual(v.boTheoEm.bo.S1)
    expect(lai.boTheoEm.daDung.S1).toEqual(v.boTheoEm.daDung.S1)
  })

  // ĐỔI CÓ CHỦ Ý (phiên chủ 04/10): một em thiếu câu không được kẹt ngoài phòng ⇒ em chưa có câu đã đúng nào được lấp bằng thang
  // rút đề v2 thường (câu mới, KHÔNG nhãn "đã làm đúng"); bảng xem trước đã báo thầy em này thiếu câu đã đúng.
  it('em chưa có câu nào đã đúng trong kho ca ⇒ không bị chặn: nhận bộ rút đề v2 thường, không có nhãn "đã làm đúng"', async () => {
    const { d, env } = await dungCa({ bo: { S2: ['Q9'] }, cheDo: 'da_dung' })
    d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S9','Chín','12A','x')")
    const v = await goiWorker(worker, env, '/vao-thi', { maCa: 'C1', sbd: 'S9', idThietBi: 'm9' })
    expect(v.lyDo).not.toBe('thieu_bo_cau')
    expect(v.ok).toBe(true)
    expect(v.boTheoEm.bo.S9.length).toBeGreaterThan(0)
    expect(v.boTheoEm?.daDung?.S9).toBeUndefined()
  })

  it('màn thầy đọc chế độ ca: phamViHoiLai = da_dung', async () => {
    const { env } = await dungCa(null)
    const r = await goiWorker(worker, env, '/ca/chi-tiet', { maCa: 'C1' }, true)
    expect(r.ca.phamViHoiLai).toBe('da_dung')
  })
})
