// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cacQidSongSinh, CHO_SONG_SINH, tachSongSinh, TRAN_SONG_SINH } from '../server/src/loi-hoc-luat'
import {
  CAN_RONG, cauGocTuVao, ghepHaiLuot, kiemBanKhac, kiemYMoi, nhanBanKhacNop, nhanYMoiNop,
  SO_BAN_KHAC_TOI_DA, thieuBanKhac, tinhCan, Y_DS_DU, Y_DS_MUC_TIEU, type CauGoc,
} from '../server/src/may-soan-kiem'

const goc: CauGoc = {
  qid: '12-KT-III-1', bam: 'bam', dang: 'tln', phan: 'III',
  de: 'Đốt cháy hoàn toàn 0,1 mol methane. Tính số mol oxygen cần dùng.',
  bang: null, pa: null, y: [], dapAn: '0,2', kieu: 'bai_tap',
}
const so = (v: number) => String(v).replace('.', ',')
const ban = Array.from({ length: 6 }, (_, i) => {
  const n = (i + 2) / 10, oxygen = Number((2 * n).toFixed(1))
  return {
    kieu: 'so', de: `Đốt cháy hoàn toàn ${so(n)} mol methane. Tính số mol oxygen cần dùng.`,
    dap_an: so(oxygen), buoc: ['CH4 + 2O2 → CO2 + 2H2O.', `Số mol oxygen: 2 × ${so(n)} = ${so(oxygen)} mol.`],
    chot: 'Số mol oxygen gấp đôi số mol methane.',
    phepTinh: [{ bieuThuc: `${n}*2`, ketQua: oxygen, lamTron: 1, laDapSo: true }],
  }
})
const daCo = { banKhac: [], yDs: [] }

describe('mục tiêu sáu song sinh, không sinh tự luận', () => {
  it('giữ qid cũ và đọc được chỗ 5–11 khi nối bản đạt kiểm', () => {
    expect(TRAN_SONG_SINH).toBe(6)
    expect(SO_BAN_KHAC_TOI_DA).toBe(TRAN_SONG_SINH)
    expect(CHO_SONG_SINH).toBe(12)
    const ids = cacQidSongSinh(goc.qid)
    expect(ids).toHaveLength(13)
    for (const i of [0, 3, 5, 7, 11]) {
      expect(ids).toContain(`${goc.qid}~ss${i}`)
      expect(tachSongSinh(`${goc.qid}~ss${i}#2`)).toEqual({ goc: goc.qid, songSinh: i })
    }
  })

  it('bốn hoặc năm bản vẫn còn thiếu; nhận đủ sáu bản tính toán và bác bản sai phép tính', () => {
    for (const n of [0, 4, 5, 6]) {
      expect(tinhCan({ dang: 'tln', hoSo: false, soBanDung: n, soY: 0 }).banKhac).toBe(6 - n)
      expect(thieuBanKhac('tln', n, 0)).toBe(n === 0 ? 'han' : n < 6 ? 'mot_phan' : null)
    }
    const r = kiemBanKhac(goc, { ...CAN_RONG, banKhac: 6 }, ban)
    expect(r.loi).toEqual([])
    expect(r.hopLe).toHaveLength(6)
    expect(kiemBanKhac(goc, { ...CAN_RONG, banKhac: 6 }, ban.slice(0, 5)).loi.join()).toContain('cần đúng 6')
    expect(nhanBanKhacNop(goc, ban.map((b) => ({ ...b, kiem: { d2: b.dap_an, chac: true, lyDo2: b.buoc.join(' ') } })), daCo).giu).toHaveLength(6)
    const sai = [...ban.slice(0, 5), { ...ban[5], dap_an: '9' }]
    const rSai = kiemBanKhac(goc, { ...CAN_RONG, banKhac: 6 }, sai)
    expect(rSai.hopLe).toHaveLength(5)
    expect(rSai.loi.join()).toMatch(/KHOÁ SỐ/)
  })

  it('nhận đủ sáu bản lý thuyết, không hạ mục tiêu lý thuyết', () => {
    const lt: CauGoc = { ...goc, phan: 'I', dang: 'tn', kieu: 'ly_thuyet', dapAn: 'A',
      de: 'Kim loại nào dưới đây tác dụng với nước ở nhiệt độ thường?', pa: { A: 'Na', B: 'Cu', C: 'Ag', D: 'Au' } }
    const chat = ['Li', 'K', 'Rb', 'Cs', 'Ca', 'Ba']
    const ds = chat.map((c, i) => {
      const d = ['A', 'B', 'C', 'D'][i % 4]!
      const keys = ['A', 'B', 'C', 'D']
      const sai = ['Cu', 'Ag', 'Au']
      return { kieu: 'ly_thuyet', de: `Trong nhóm gồm ${c}, Cu, Ag và Au, kim loại nào phản ứng với nước ở nhiệt độ thường?`,
        pa: Object.fromEntries(keys.map((k) => [k, k === d ? c : sai.shift()])), dap_an: d,
        buoc: [`${c} phản ứng với nước tạo hydroxide và hydrogen.`, 'Cu, Ag và Au không phản ứng với nước ở điều kiện này.'],
        chot: 'Kim loại hoạt động mạnh có thể phản ứng với nước ở nhiệt độ thường.' }
    })
    expect(tinhCan({ dang: 'tn', kieuKho: 'ly_thuyet', hoSo: false, soBanDung: 0, soY: 0 })).toMatchObject({ banKhac: 6, kieuBan: 'ly_thuyet' })
    expect(kiemBanKhac(lt, { ...CAN_RONG, banKhac: 6, kieuBan: 'ly_thuyet' }, ds).loi).toEqual([])
    expect(nhanBanKhacNop(lt, ds.map((b) => ({ ...b, kiem: { d2: b.dap_an, chac: true, lyDo2: b.buoc.join(' ') } })), daCo).giu).toHaveLength(6)
  })

  it('Phần II chỉ đủ khi có 24 ý, bổ sung đúng số còn thiếu', () => {
    expect([Y_DS_DU, Y_DS_MUC_TIEU]).toEqual([24, 24])
    for (const soY of [0, 8, 12, 23, 24]) {
      expect(tinhCan({ dang: 'ds', hoSo: false, soBanDung: 0, soY }).yDs).toBe(24 - soY)
      expect(thieuBanKhac('ds', 0, soY)).toBe(soY === 0 ? 'han' : soY < 24 ? 'mot_phan' : null)
    }
    const dsGoc: CauGoc = { ...goc, phan: 'II', dang: 'ds', dapAn: 'DSDS', y: [] }
    const y = Array.from({ length: 24 }, (_, i) => ({ t: `Mệnh đề hóa học dùng kiểm cấu trúc số ${i + 1}.`, d: i % 2 ? 'S' : 'D', lyDo: 'Chỉ kiểm khuôn và số lượng trong bài kiểm thử này.' }))
    expect(kiemYMoi(dsGoc, { ...CAN_RONG, yDs: 24 }, y).loi).toEqual([])
    expect(kiemYMoi(dsGoc, { ...CAN_RONG, yDs: 24 }, y.slice(0, 12)).loi.join()).toContain('cần 24–24')
  })

  it('bác tự luận ở tệp đầu vào, giao việc và cả cổng nhận bổ trợ', () => {
    const vao = { qid: goc.qid, bam: 'bam', dang: 'tln', phan: 'III', deTho: goc.de, dapAn: { kq: '0,2' } }
    expect(cauGocTuVao(vao)).not.toBeNull()
    for (const doi of [{ kieuKho: 'tu_luan' }, { phan: 'TL' }, { tuLuan: true }, { dapAn: { kq: '(NH4)2Fe(SO4)2' } }]) {
      expect(cauGocTuVao({ ...vao, ...doi })).toBeNull()
    }
    expect(tinhCan({ dang: 'tln', kieuKho: 'tu_luan', hoSo: false, soBanDung: 0, soY: 0 })).toMatchObject({ banKhac: 0, yDs: 0 })
    const essay = { ...goc, kieu: 'tu_luan' }
    expect(nhanBanKhacNop(essay, [{ ...ban[0], kiem: { d2: ban[0]!.dap_an, chac: true, lyDo2: 'Lí do độc lập.' } }], daCo).giu).toEqual([])
    expect(nhanYMoiNop({ ...essay, dang: 'ds', phan: 'II' }, [{ t: 'Mệnh đề đủ dài để kiểm tra.', d: 'D', lyDo: 'Lí do.', kiem: { d2: 'D', chac: true, lyDo2: 'Lí do độc lập.' } }], daCo).giu).toEqual([])
  })

  it.each([
    { nhan: 'thiếu xác nhận', chac: undefined, lyDo: 'Giải độc lập.' },
    { nhan: 'không chắc chắn', chac: false, lyDo: 'Giải độc lập.' },
    { nhan: 'thiếu lí do', chac: true, lyDo: undefined },
    { nhan: 'lí do chỉ có khoảng trắng', chac: true, lyDo: ' \n\t ' },
  ])('khớp đáp án vẫn bị loại nếu $nhan', ({ chac, lyDo }) => {
    const b = ban[0]!
    const y = { t: 'Methane cháy hoàn toàn tạo carbon dioxide và nước.', d: 'D', lyDo: 'Sản phẩm gồm CO2 và H2O.' } as const
    const dsGoc: CauGoc = { ...goc, dang: 'ds', phan: 'II', dapAn: 'DSDS' }
    const tra = [{ id: 'ss1', d: b.dap_an, chac, lyDo }, { id: 'y1', d: 'D', chac, lyDo }]
    const ssMu = ghepHaiLuot(goc, { songSinh: [b as never], yMoi: [] }, tra)
    const yMu = ghepHaiLuot(dsGoc, { songSinh: [], yMoi: [y] }, tra)
    expect(ssMu.songSinh).toEqual([])
    expect(yMu.yMoi).toEqual([])
    expect(ssMu.boSongSinh).toHaveLength(1)
    expect(yMu.boY).toHaveLength(1)
    const ssNop = nhanBanKhacNop(goc, [{ ...b, kiem: { d2: b.dap_an, chac, lyDo2: lyDo } }], daCo)
    const yNop = nhanYMoiNop(dsGoc, [{ ...y, kiem: { d2: 'D', chac, lyDo2: lyDo } }], daCo)
    expect(ssNop.giu).toEqual([])
    expect(yNop.giu).toEqual([])
    expect(ssNop.bo[0]!.lyDo).toMatch(chac === true ? /thiếu lí do/ : /chưa xác nhận chắc chắn/)
    expect(yNop.bo[0]!.lyDo).toMatch(chac === true ? /thiếu lí do/ : /chưa xác nhận chắc chắn/)
  })

  it('ghép lượt giải khớp có đủ xác nhận và lí do thành bằng chứng bắt buộc', () => {
    const b = ban[0]!
    const r = ghepHaiLuot(goc, { songSinh: [b as never], yMoi: [] }, [{ id: 'ss1', d: b.dap_an, chac: true, lyDo: '  CH4 cần hai mol oxygen cho mỗi mol methane.  ' }])
    expect(r.songSinh[0]!.kiem).toEqual({ d2: b.dap_an, chac: true, lyDo2: 'CH4 cần hai mol oxygen cho mỗi mol methane.' })
    expect(nhanBanKhacNop(goc, r.songSinh, daCo).giu).toHaveLength(1)
  })
})
