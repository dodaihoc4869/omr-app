// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { locBoTro } from '../server/src/cau-bo-tro'
import { apSongSinh } from '../server/src/song-sinh-game'
import { phuNeuCan } from '../server/src/hang-chua-loi'
import { publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'

const bang = [['Acid béo', 'Phần trăm'], ['Oleic acid', '40'], ['Linoleic acid', '60']]
const goc = { qid: 'Q', maDe: 'D', version: 'v1', group: 'g', phan: 'III', text: 'Câu gốc có bảng sau.',
  table: [['Dữ liệu gốc', 'Giá trị'], ['x', '999']], choices: [], ideas: [], hinhAnh: [],
  dang: 'D1', tenDang: 'Chất béo', mucDo: 'hieu', sao: 1, kienThuc: [], correct: '99', solution: {}, reviewed: true } satisfies PrivateQuestion

describe('bảng số liệu của câu biến thể', () => {
  it('giữ bảng từ kho bổ trợ tới dữ liệu gửi học sinh, không dùng số của câu gốc', () => {
    const bt = locBoTro({ song_sinh: [{ de: 'Dầu có thành phần như bảng sau. Tính chỉ số iodine.', bang, dap_an: '145' }] })
    const q = apSongSinh(goc, bt.songSinh[0]!, 0)!
    expect(q.table).toEqual(bang)
    expect(publicQuestion(q).table).toEqual(bang)
    expect(publicQuestion(q)).not.toHaveProperty('correct')
    expect(publicQuestion(q)).not.toHaveProperty('solution')
  })
  it('không phát biến thể nói tới bảng nhưng không mang bảng; quay về câu gốc đầy đủ', () => {
    const ss = { de: 'Một loại dầu hướng dương có hàm lượng các acid béo như bảng sau. Xác định chỉ số iodine.', dap_an: '145' }
    expect(apSongSinh(goc, ss, 0)).toBeNull()
    const bt = { bam: 'b', qidMau: 'Q', songSinh: [ss], cauKiem: [], nhanNen: [], buoc: [] }
    expect(phuNeuCan(goc, new Map([['Q', 0]]), new Map([['Q', bt]]))).toEqual(goc)
  })
  it('biến thể có đủ dữ kiện bằng chữ không mang theo bảng cũ', () => {
    const q = apSongSinh(goc, { de: 'Dầu chứa 40% oleic acid và 60% linoleic acid. Tính chỉ số iodine.', dap_an: '145' }, 1)!
    expect(q.qid).toBe('Q~ss1')
    expect(q.table).toBeUndefined()
  })
  it('bảng sai cấu trúc không được coi là đã đủ dữ kiện', () => {
    const bt = locBoTro({ song_sinh: [{ de: 'Dữ kiện trong bảng sau.', bang: [['Chất', 'm'], ['A']], dap_an: '1' }] })
    expect(apSongSinh(goc, bt.songSinh[0]!, 0)).toBeNull()
  })
})
