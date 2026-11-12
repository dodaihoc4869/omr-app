// 12/11 (thầy «làm luôn cả hai việc» — đo thật 11/11: ngày Sửa chỉ 15/137 đề máy giao đúng 18/4/6, 87 đề thiếu câu trả lời ngắn, trong khi 87/87 em vẫn còn
// câu trả lời ngắn đã sai chưa sửa ⇒ không phải kho hết). Nguyên nhân: câu LÀM LẠI CUỐI CHẶNG (và tự luyện) KHÔNG tính vào mức (`soDaLam`) nhưng
// từng CHIẾM SUẤT đề 28 (`daLamO` lấy từ `daLam`) ⇒ phần I tràn sang suất phần II/III. Nay chỉ câu tính vào mức (`daTinh`) chiếm suất, từ NGAY_O_CHI_CAU_TINH.
import { describe, expect, it } from 'vitest'
import { chonGoi7, type CauGoi7 } from '../server/src/goi-bai-7-loi'
import { apSuat7, NGAY_O_CHI_CAU_TINH } from '../server/src/goi-bai-7-suat'
import { O_28 } from '../server/src/rut-28'
import { oMaTran } from '../server/src/ma-tran-rut-moi'
import { taoD1That } from './_d1-that'
import { docDaLamVaVuaLam7 } from '../server/src/goi-bai-7'

const KHO: CauGoi7[] = O_28.flatMap((o) => Array.from({ length: 30 }, (_, i) => {
  const [phan, muc] = o.split('|') as [string, string]
  return { qid: `${o}#m${i}`, group: `${o}#m${i}`, maDe: 'x', version: 'v1', phan, mucDo: muc, kho: false, tinhToan: false, kyNang: ['a'] } as unknown as CauGoi7
}))
// ngày Sửa: câu sai (nguồn chính) đủ mọi phần — có cả câu trả lời ngắn
const SAI = O_28.flatMap((o) => Array.from({ length: 6 }, (_, i) => `${o}#sai${i}`))
// em đã làm hôm nay: 4 câu TÍNH vào mức (phần I) + 20 câu LÀM LẠI cuối chặng (phần I, song sinh của câu vừa sai — không tính vào mức)
const TINH = ['I|biet#sai0', 'I|biet#sai1', 'I|hieu#sai0', 'I|hieu#sai1']
const LAM_LAI = Array.from({ length: 20 }, (_, i) => `I|hieu#sai${i % 6}~ss${1 + Math.floor(i / 6)}`)
const meta = new Map([...SAI, ...LAM_LAI].map((q) => { const [phan, muc] = q.split('#')[0]!.split('|') as [string, string]; return [q, { phan, mucDo: muc, dang: null, tenDang: null }] as const }))
const hs = { meta, tt: new Map() }

function deCuaNgay(ngay: string, coDaTinh: boolean) {
  const daLam = new Set([...TINH, ...LAM_LAI])
  const vao: Parameters<typeof chonGoi7>[0] = { cau: KHO, daGap: new Set(), daLamNgay: daLam, quotaCon: 0, chan: new Set(), sua: SAI.filter((q) => !daLam.has(q)), on: [],
    sanSang: new Set([...KHO.map((c) => c.qid), ...SAI]), mucTieuNgay: 28 - TINH.length, chiTrongMuc: true, loaiNgay: 'sua', ngay,
    nhomPhu: [{ qids: KHO.map((c) => c.qid), quota: 0 }] }
  apSuat7(vao, hs, KHO, daLam, ngay, new Set(), null, coDaTinh ? new Set(TINH) : undefined)
  const plan = chonGoi7(vao)
  const oCua = (q: string) => { const m = meta.get(q) ?? KHO.find((c) => c.qid === q); return oMaTran(m?.phan as string, (m as { mucDo?: string })?.mucDo) }
  const ca28 = [...TINH, ...plan.viec.map((v) => v.qid)]
  const phan = (p: string) => ca28.filter((q) => oCua(q).startsWith(`${p}|`)).length
  return { n: ca28.length, I: phan('I'), II: phan('II'), III: phan('III') }
}

describe('đề 28: câu làm lại cuối chặng không chiếm suất (12/11)', () => {
  it(`từ ${NGAY_O_CHI_CAU_TINH}: 28 câu tính vào mức đúng 18 · 4 · 6 dù em đã làm 20 câu làm lại phần I`, () => {
    expect(deCuaNgay(NGAY_O_CHI_CAU_TINH, true)).toEqual({ n: 28, I: 18, II: 4, III: 6 })
  })
  it('trước mốc (hành vi cũ, để đối chiếu): câu làm lại chiếm suất ⇒ phần II/III bị thiếu', () => {
    const cu = deCuaNgay('2026-11-12', true)
    expect(cu).toEqual({ n: 28, I: 18, II: 7, III: 3 }) // đúng kiểu lệch đo được 11/11: thiếu câu trả lời ngắn
    expect(deCuaNgay('2026-11-12', false)).toEqual(cu) // không có daTinh ⇒ như cũ
  })
  it('câu làm lại của CÂU TRẢ LỜI NGẮN chiếm thẳng suất phần III (không cần tràn) — đường thứ hai của cùng lỗi; nay không chiếm', () => {
    const tinh = ['I|biet#sai0', 'III|hieu#sai0'], lamLai = Array.from({ length: 3 }, (_, i) => `III|hieu#sai${i}~ss1`)
    const meta2 = new Map([...SAI, ...lamLai].map((q) => { const [phan, muc] = q.split('#')[0]!.split('|') as [string, string]; return [q, { phan, mucDo: muc, dang: null, tenDang: null }] as const }))
    const chay = (ngay: string) => {
      const daLam = new Set([...tinh, ...lamLai])
      const vao: Parameters<typeof chonGoi7>[0] = { cau: KHO, daGap: new Set(), daLamNgay: daLam, quotaCon: 0, chan: new Set(), sua: SAI.filter((q) => !daLam.has(q)), on: [],
        sanSang: new Set([...KHO.map((c) => c.qid), ...SAI]), mucTieuNgay: 28 - tinh.length, chiTrongMuc: true, loaiNgay: 'sua', ngay, nhomPhu: [{ qids: KHO.map((c) => c.qid), quota: 0 }] }
      apSuat7(vao, { meta: meta2, tt: new Map() }, KHO, daLam, ngay, new Set(), null, new Set(tinh))
      const ca28 = [...tinh, ...chonGoi7(vao).viec.map((v) => v.qid)], phan = (p: string) => ca28.filter((q) => q.startsWith(`${p}|`)).length
      return [phan('I'), phan('II'), phan('III')]
    }
    expect(chay(NGAY_O_CHI_CAU_TINH)).toEqual([18, 4, 6])
    expect(chay('2026-11-12')[2]).toBeLessThan(6)
  })
  it('docDaLamVaVuaLam7: `daTinh` không gồm câu làm lại cuối chặng / tự luyện; `daLam` vẫn gồm (không phát lại)', async () => {
    const d = taoD1That(), ngay = '2026-11-13'
    const them = d.sql.prepare(`INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,ket_qua,luc,ngay_vn,raw_json) VALUES(?,?,?,?,?,?,?,?,?)`)
    them.run('k1', 'E1', 'Q1', 'game', 'S1', 1, `${ngay}T01:00:00Z`, ngay, '{}')
    them.run('k2', 'E1', 'Q2~ss1', 'game', 'S1', 0, `${ngay}T01:01:00Z`, ngay, '{"ll":1}')
    them.run('k3', 'E1', 'Q3', 'tu_luyen', 'T1', 1, `${ngay}T01:02:00Z`, ngay, '{}')
    const r = await docDaLamVaVuaLam7(d.env, 'E1', ngay)
    expect([...r.daLam].sort()).toEqual(['Q1', 'Q2~ss1', 'Q3'])
    expect([...r.daTinh]).toEqual(['Q1'])
    expect(r.soDaLam).toBe(1)
  })
})
