// "EM ĐÃ LÀM CÂU NÀY CHƯA" (thầy lệnh 21/09 16:4x) — phần thuần + phần nối máy của Code 1. Hợp đồng: docs/hop-dong-lich-su-cau-len-bang-2109.md.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mulberry32 } from '../src/lib/exam-shuffle'
import {
  chiaLoCap, CHU_NHAN_LICH_SU, docLichSuCauEm, docPhanTuLichSu, khoaEmCau, nhanLichSuCau, qidMayChuCuaIdCau, TOI_DA_CAP_MOI_LAN, type LichSuCauEm,
} from '../src/lib/lich-su-cau-len-bang'

const goiLenhMoc = vi.fn()
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (...a: unknown[]) => goiLenhMoc(...a) }))
import { layLichSuCau } from '../src/lib/lich-su-cau-len-bang-lenh'

const pt = (o: Partial<LichSuCauEm> = {}): LichSuCauEm => ({ sbd: 'S1', qid: 'K1-I-3', daLam: true, soLan: 1, soDung: 1, soSai: 0, lanCuoi: { dung: true, ngay: '2026-09-19', nguon: 'on_lai' }, lenBang: null, ...o })

describe('qidMayChuCuaIdCau', () => {
  it('id câu ở màn → mã máy chủ <mã tờ gốc>-<phần>-<số>: bỏ hậu tố TN/DS/TLN của tờ nạp theo phần, số bỏ số 0 đầu; không dựng được ⇒ null', () => {
    expect(qidMayChuCuaIdCau('K1-I-3')).toBe('K1-I-3')
    expect(qidMayChuCuaIdCau('K1-TN-I-3')).toBe('K1-I-3')
    expect(qidMayChuCuaIdCau('K1-DS-II-07')).toBe('K1-II-7')
    expect(qidMayChuCuaIdCau('  ESTE-11-TLN-III-12 ')).toBe('ESTE-11-III-12')
    for (const x of ['', 'K1', 'K1-IV-3', 'K1-I-x', '-I-3']) expect(qidMayChuCuaIdCau(x), x).toBeNull()
  })
})

describe('docPhanTuLichSu / docLichSuCauEm — kiểm phản hồi máy chủ', () => {
  it('phần tử đúng dạng được nhận; sai dạng / điều kiện chéo sai bị BỎ (không đoán): soDung+soSai > soLan · chưa làm mà có dòng · ngày sai dạng · thiếu trường', () => {
    expect(docPhanTuLichSu(pt())).toEqual(pt())
    expect(docPhanTuLichSu(pt({ soLan: 2, soDung: 2, soSai: 1 }))).toBeNull()
    expect(docPhanTuLichSu(pt({ daLam: false }))).toBeNull() // chưa làm nhưng soLan 1
    expect(docPhanTuLichSu(pt({ daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null }))).toEqual(pt({ daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null }))
    expect(docPhanTuLichSu(pt({ lanCuoi: { dung: true, ngay: '19/09/2026', nguon: 'x' } }))).toBeNull()
    expect(docPhanTuLichSu({ ...pt(), soLan: -1 })).toBeNull()
    expect(docPhanTuLichSu({ ...pt(), sbd: '' })).toBeNull()
    expect(docPhanTuLichSu(null)).toBeNull()
    expect(docPhanTuLichSu({ ...pt(), lenBang: { soLan: 1 } })).toEqual(pt({ lenBang: { soLan: 1, datLanCuoi: null } }))
  })
  it('bản đồ theo khoá sbd|qid; phần tử hỏng chỉ mất đúng cặp ấy; không có mảng ketQua ⇒ null', () => {
    const m = docLichSuCauEm({ ok: true, ketQua: [pt(), { bậy: 1 }, pt({ sbd: 'S2', qid: 'K1-II-1', daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null })] })!
    expect([...m.keys()]).toEqual([khoaEmCau('S1', 'K1-I-3'), khoaEmCau('S2', 'K1-II-1')])
    for (const x of [null, {}, { ketQua: 'x' }, 'x']) expect(docLichSuCauEm(x)).toBeNull()
  })
})

describe('nhanLichSuCau — bốn nhãn + dòng phụ', () => {
  it('chưa có dòng nào ⇒ "Chưa làm câu này"; đúng ⇒ "Đã làm · lần gần nhất đúng"; sai ⇒ "… sai"; dung:null ⇒ "Đã làm · chưa có kết quả"', () => {
    expect(nhanLichSuCau(pt({ daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null }))).toEqual({ kieu: 'chua_lam', chu: 'Chưa làm câu này' })
    expect(nhanLichSuCau(pt())).toEqual({ kieu: 'dung', chu: 'Đã làm · lần gần nhất đúng' })
    expect(nhanLichSuCau(pt({ soDung: 0, soSai: 1, lanCuoi: { dung: false, ngay: '2026-09-19', nguon: 'thi' } }))).toEqual({ kieu: 'sai', chu: 'Đã làm · lần gần nhất sai' })
    expect(nhanLichSuCau(pt({ soDung: 0, soSai: 0, lanCuoi: { dung: null, ngay: '2026-09-21', nguon: 'btvn' } }))).toEqual({ kieu: 'chua_ket_qua', chu: 'Đã làm · chưa có kết quả' })
    expect(Object.values(CHU_NHAN_LICH_SU)).toEqual(['Chưa làm câu này', 'Đã làm · lần gần nhất đúng', 'Đã làm · lần gần nhất sai', 'Đã làm · chưa có kết quả'])
  })
  it('dòng phụ CHỈ khi làm ≥ 2 lần: "3 lần: 1 đúng, 2 sai · gần nhất 19/09"; lần bị che nói thật; có lên bảng ⇒ thêm "Đã lên bảng câu này 1 lần · đạt"', () => {
    expect(nhanLichSuCau(pt())!.phu).toBeUndefined()
    expect(nhanLichSuCau(pt({ soLan: 3, soDung: 1, soSai: 2, lanCuoi: { dung: false, ngay: '2026-09-19', nguon: 'on_lai' } }))!.phu).toBe('3 lần: 1 đúng, 2 sai · gần nhất 19/09')
    expect(nhanLichSuCau(pt({ soLan: 3, soDung: 1, soSai: 1 }))!.phu).toBe('3 lần: 1 đúng, 1 sai, 1 chưa có kết quả · gần nhất 19/09')
    expect(nhanLichSuCau(pt({ soLan: 2, soDung: 0, soSai: 0, lanCuoi: { dung: null, ngay: '2026-09-21', nguon: 'btvn' } }))!.phu).toBe('2 lần · gần nhất 21/09')
    expect(nhanLichSuCau(pt({ lenBang: { soLan: 1, datLanCuoi: true } }))!.lenBang).toBe('Đã lên bảng câu này 1 lần · đạt')
    expect(nhanLichSuCau(pt({ lenBang: { soLan: 2, datLanCuoi: false } }))!.lenBang).toBe('Đã lên bảng câu này 2 lần · chưa đạt')
    expect(nhanLichSuCau(pt({ lenBang: { soLan: 1, datLanCuoi: null } }))!.lenBang).toBe('Đã lên bảng câu này 1 lần')
    expect(nhanLichSuCau(pt({ lenBang: { soLan: 0, datLanCuoi: null } }))!.lenBang).toBeUndefined()
  })
  it('chỉ có lượt lên bảng (chưa có dòng làm nào): vẫn "Đã làm", chưa có kết quả, kèm dòng lên bảng', () => {
    expect(nhanLichSuCau(pt({ soLan: 0, soDung: 0, soSai: 0, lanCuoi: null, lenBang: { soLan: 1, datLanCuoi: true } }))).toEqual({ kieu: 'chua_ket_qua', chu: 'Đã làm · chưa có kết quả', lenBang: 'Đã lên bảng câu này 1 lần · đạt' })
  })
  it('thiếu dữ liệu (undefined / null) ⇒ KHÔNG nhãn — không bịa "chưa làm"', () => {
    expect(nhanLichSuCau(undefined)).toBeNull()
    expect(nhanLichSuCau(null)).toBeNull()
  })
  it('TÍNH CHẤT 3 000 ca: kiểu khớp lần gần nhất; phụ ⇔ soLan ≥ 2; không chữ năng lực / so sánh; mọi chữ dựng từ dữ liệu, thuần', () => {
    const r = mulberry32(2109)
    const CAM = /nắm chắc|yếu|giỏi|kém|xuất sắc|so với|hơn bạn|xếp hạng|%|vượt|thua/i
    for (let i = 0; i < 3000; i++) {
      const soLan = Math.floor(r() * 6)
      const soDung = Math.floor(r() * (soLan + 1))
      const soSai = Math.floor(r() * (soLan - soDung + 1))
      const dung = [true, false, null][Math.floor(r() * 3)] as boolean | null
      const x: LichSuCauEm = { sbd: 'S', qid: 'K-I-1', daLam: soLan > 0 || r() < 0.2, soLan, soDung, soSai, lanCuoi: soLan > 0 ? { dung, ngay: '2026-09-1' + Math.floor(r() * 10), nguon: 'x' } : null, lenBang: r() < 0.4 ? { soLan: 1 + Math.floor(r() * 3), datLanCuoi: [true, false, null][Math.floor(r() * 3)] as boolean | null } : null }
      if (!x.daLam) { x.lenBang = null }
      const n = nhanLichSuCau(x)!
      const mong = !x.daLam ? 'chua_lam' : x.lanCuoi?.dung === true ? 'dung' : x.lanCuoi?.dung === false ? 'sai' : 'chua_ket_qua'
      expect(n.kieu).toBe(mong)
      expect(n.chu).toBe(CHU_NHAN_LICH_SU[mong])
      expect(!!n.phu).toBe(x.daLam && soLan >= 2)
      for (const chu of [n.chu, n.phu ?? '', n.lenBang ?? '']) expect(CAM.test(chu), chu).toBe(false)
      expect(nhanLichSuCau(x)).toEqual(n)
    }
  })
})

describe('chiaLoCap', () => {
  it('bỏ cặp trùng + cặp thiếu sbd/qid, giữ thứ tự, chia lô ≤ 200', () => {
    const cap = Array.from({ length: 450 }, (_, i) => ({ sbd: `S${i % 30}`, qid: `Q${i}` }))
    const lo = chiaLoCap([...cap, ...cap.slice(0, 10), { sbd: '', qid: 'x' }, { sbd: 'S', qid: ' ' }])
    expect(lo.map((l) => l.length)).toEqual([200, 200, 50])
    expect(lo.flat()).toEqual(cap)
    expect(TOI_DA_CAP_MOI_LAN).toBe(200)
    expect(chiaLoCap([])).toEqual([])
    expect(chiaLoCap(cap, 0).length).toBe(3) // số lô lạ ⇒ mặc định 200
  })
})

describe('layLichSuCau — nối máy', () => {
  beforeEach(() => { goiLenhMoc.mockReset() }) // không trả mock ra ngoài: vitest coi hàm trả về của beforeEach là bước dọn và GỌI nó
  const phanHoi = (cap: { sbd: string; qid: string }[]) => ({ ok: true, ketQua: cap.map((c) => pt({ sbd: c.sbd, qid: c.qid })) })

  it('450 cặp ⇒ 3 lần gọi, mỗi lần ≤ 200, đúng đường + thân; gộp đủ 450 cặp', async () => {
    goiLenhMoc.mockImplementation(async (_d: string, body: { cap: { sbd: string; qid: string }[] }) => ({ ok: true, du: phanHoi(body.cap) }))
    const cap = Array.from({ length: 450 }, (_, i) => ({ sbd: `S${i % 30}`, qid: `Q${i}` }))
    const lo = chiaLoCap([...cap, ...cap.slice(0, 10), { sbd: '', qid: 'x' }, { sbd: 'S', qid: ' ' }])
    expect(lo.map((l) => l.length)).toEqual([200, 200, 50])
    expect(lo.flat()).toEqual(cap)
    expect(TOI_DA_CAP_MOI_LAN).toBe(200)
    expect(chiaLoCap([])).toEqual([])
    expect(chiaLoCap(cap, 0).length).toBe(3) // số lô lạ ⇒ mặc định 200
  })
})

describe('layLichSuCau — nối máy', () => {
  beforeEach(() => { goiLenhMoc.mockReset() }) // không trả mock ra ngoài: vitest coi hàm trả về của beforeEach là bước dọn và GỌI nó
  const phanHoi = (cap: { sbd: string; qid: string }[]) => ({ ok: true, ketQua: cap.map((c) => pt({ sbd: c.sbd, qid: c.qid })) })

  it('450 cặp ⇒ 3 lần gọi, mỗi lần ≤ 200, đúng đường + thân; gộp đủ 450 cặp', async () => {
    goiLenhMoc.mockImplementation(async (...a: unknown[]) => { try { return { ok: true, du: phanHoi((a[1] as { cap: { sbd: string; qid: string }[] }).cap) } } catch (e) { process.stderr.write('IMPL ' + String((e as Error).stack).slice(0, 400) + '\n'); throw e } })
    const cap = Array.from({ length: 450 }, (_, i) => ({ sbd: `S${i}`, qid: `K-I-${i}` }))
    const kq = (await layLichSuCau(cap))!
    expect(goiLenhMoc).toHaveBeenCalledTimes(3)
    expect(goiLenhMoc.mock.calls.every((c) => c[0] === '/gv/lich-su-cau-cua-em' && c[1].cap.length <= 200)).toBe(true)
    expect(kq.size).toBe(450)
    expect(kq.get(khoaEmCau('S449', 'K-I-449'))?.daLam).toBe(true)
  })
  it('không cặp nào ⇒ bản đồ rỗng, KHÔNG gọi máy chủ', async () => {
    expect((await layLichSuCau([]))!.size).toBe(0)
    expect(goiLenhMoc).not.toHaveBeenCalled()
  })
  it('máy chủ chưa có lệnh / từ chối / trả sai dạng ⇒ null (không nhãn, không bịa)', async () => {
    const cap = [{ sbd: 'S1', qid: 'K-I-1' }]
    goiLenhMoc.mockResolvedValue({ ok: false, loai: 'chua_co_lenh', chu: 'x' })
    expect(await layLichSuCau(cap)).toBeNull()
    goiLenhMoc.mockResolvedValue({ ok: false, loai: 'tu_choi', chu: 'sai mã' })
    expect(await layLichSuCau(cap)).toBeNull()
    goiLenhMoc.mockResolvedValue({ ok: true, du: { ok: true, ketQua: 'bậy' } })
    expect(await layLichSuCau(cap)).toBeNull()
    goiLenhMoc.mockRejectedValue(new Error('nổ'))
    expect(await layLichSuCau(cap)).toBeNull()
  })
  it('một lô hỏng, lô khác đọc được ⇒ bản đồ của lô đọc được (cặp lô hỏng vắng, không bịa)', async () => {
    goiLenhMoc.mockImplementationOnce(async (_d: string, b: { cap: { sbd: string; qid: string }[] }) => ({ ok: true, du: phanHoi(b.cap) }))
    goiLenhMoc.mockImplementationOnce(async () => ({ ok: false, loai: 'mang', chu: 'x' }))
    const cap = Array.from({ length: 300 }, (_, i) => ({ sbd: `S${i}`, qid: `K-I-${i}` }))
    const kq = (await layLichSuCau(cap))!
    expect(kq.size).toBe(200)
    expect(kq.has(khoaEmCau('S250', 'K-I-250'))).toBe(false)
  })
  it('máy chủ trả chậm hơn hạn chờ ⇒ null (mở tờ không đợi)', async () => {
    goiLenhMoc.mockImplementation(() => new Promise(() => {}))
    const t0 = Date.now()
    expect(await layLichSuCau([{ sbd: 'S1', qid: 'K-I-1' }], { hanChoMs: 30 })).toBeNull()
    expect(Date.now() - t0).toBeLessThan(1000)
  })
})
