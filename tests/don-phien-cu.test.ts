// DỌN PHIÊN CŨ — phải dọn đúng thứ được phép dọn, và TUYỆT ĐỐI không đụng
// id thiết bị (máy chủ dựa vào nó để biết một SBD một lượt mỗi ca, và để em
// khôi phục bài đang làm dở trên đúng máy đó).
import { beforeEach, describe, expect, it } from 'vitest'
import { donPhienCu, KHOA_DUOC_DON, PHIEN_BAN_DU_LIEU } from '../src/lib/don-phien-cu'

const ID_THIET_BI = 'ddh_id_thiet_bi'
const CAI_DAT_THAY = 'omr.settings.v1'

beforeEach(() => localStorage.clear())

describe('donPhienCu', () => {
  it('máy chưa có dấu phiên bản thì dọn khoá giao diện và đánh dấu', () => {
    for (const k of KHOA_DUOC_DON) localStorage.setItem(k, 'cu')
    donPhienCu()
    for (const k of KHOA_DUOC_DON) expect(localStorage.getItem(k)).toBe(null)
    expect(localStorage.getItem('ddh.phienBanDuLieu')).toBe(String(PHIEN_BAN_DU_LIEU))
  })

  it('KHÔNG xoá id thiết bị — xoá là em đang thi dở mất quyền vào lại', () => {
    localStorage.setItem(ID_THIET_BI, 'may-cua-em-123')
    donPhienCu()
    expect(localStorage.getItem(ID_THIET_BI)).toBe('may-cua-em-123')
  })

  it('KHÔNG xoá thiết lập chấm bài của thầy', () => {
    localStorage.setItem(CAI_DAT_THAY, '{"x":1}')
    donPhienCu()
    expect(localStorage.getItem(CAI_DAT_THAY)).toBe('{"x":1}')
  })

  it('đã đúng phiên bản thì không dọn lại — bấm "Để sau" xong không bị hỏi lại ngay', () => {
    localStorage.setItem('ddh.phienBanDuLieu', String(PHIEN_BAN_DU_LIEU))
    localStorage.setItem('ddh.boQuaCaiApp', '123')
    donPhienCu()
    expect(localStorage.getItem('ddh.boQuaCaiApp')).toBe('123')
  })

  it('chạy hai lần liên tiếp không gây tác dụng phụ', () => {
    donPhienCu()
    localStorage.setItem('ddh.vai', 'hs')
    donPhienCu()
    expect(localStorage.getItem('ddh.vai')).toBe('hs')
  })
})
