// PHÂN QUYỀN BA VAI (BA-APP.md đợt 1) — kiểm chứng 1 và 2 của định nghĩa hoàn
// thành. Phần máy chủ nạp thẳng docs/apps-script-kiem-tra.gs vào Node để test
// đúng bản sẽ dán lên Google; phần app test bộ đọc đường link.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import { docDuongVao, manDauCua } from '../src/lib/vai-tro'

interface Gs {
  GET_CHI_THAY: string[]
  HS_HEADERS: string[]
  PH_HEADERS: string[]
  HS_COT_TOKEN: number
  HS_COT_TRANGTHAI: number
  PH_COT_TOKEN: number
  PH_COT_TRANGTHAI: number
  sinhToken_: () => string
  chuanToken_: (t: unknown) => string
  timTheoToken_: (sh: { getDataRange: () => { getValues: () => unknown[][] } }, cot: number, token: string) => number
}

// Utilities là API của Google — dựng bản giả để chạy được trong Node.
const utilitiesGia = {
  getUuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  }),
}

const gs: Gs = new Function(
  'Utilities',
  `${gsCode}\nreturn { GET_CHI_THAY, HS_HEADERS, PH_HEADERS, HS_COT_TOKEN, HS_COT_TRANGTHAI, PH_COT_TOKEN, PH_COT_TRANGTHAI, sinhToken_, chuanToken_, timTheoToken_ }`,
)(utilitiesGia)

/** Sheet giả: chỉ cần getDataRange().getValues() cho timTheoToken_. */
function sheetGia(rows: unknown[][]) {
  return { getDataRange: () => ({ getValues: () => rows }) }
}

describe('Máy chủ — lệnh của thầy phải có mã bí mật', () => {
  it('kiểm chứng 1: 4 lệnh đọc dữ liệu học sinh/phụ huynh nằm trong danh sách chỉ-thầy', () => {
    expect(gs.GET_CHI_THAY.sort()).toEqual(['listAllFeedback', 'listMessages', 'listParents', 'listStudents'])
  })

  it('cột Token và TrangThai khai đúng vị trí trong tiêu đề sheet', () => {
    expect(gs.HS_HEADERS[gs.HS_COT_TOKEN]).toBe('Token')
    expect(gs.HS_HEADERS[gs.HS_COT_TRANGTHAI]).toBe('TrangThai')
    expect(gs.PH_HEADERS[gs.PH_COT_TOKEN]).toBe('Token')
    expect(gs.PH_HEADERS[gs.PH_COT_TRANGTHAI]).toBe('TrangThai')
    // Cột cũ giữ nguyên thứ tự — sheet đang có dữ liệu không bị lệch.
    expect(gs.HS_HEADERS.slice(0, 5)).toEqual(['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc'])
    expect(gs.PH_HEADERS.slice(0, 6)).toEqual(['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc'])
  })
})

describe('Máy chủ — tra token ra hồ sơ', () => {
  const TOKEN = 'a'.repeat(32)
  const rows = [
    ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc', 'Sdt', 'SdtPhuHuynh', 'Token', 'TrangThai', 'DuyetLuc'],
    ['110234', 'Lê Minh Đức', '2010', '11A1', '', '', '', TOKEN, 'da_duyet', ''],
    ['110235', 'Trần Bảo An', '2010', '11A1', '', '', '', '', 'cho_duyet', ''],
  ]

  it('token đúng → ra đúng dòng của em đó', () => {
    expect(gs.timTheoToken_(sheetGia(rows), gs.HS_COT_TOKEN, TOKEN)).toBe(2)
  })

  it('kiểm chứng 2: đổi 1 ký tự trong token → không ra dòng nào', () => {
    const sai = 'b' + TOKEN.slice(1)
    expect(gs.timTheoToken_(sheetGia(rows), gs.HS_COT_TOKEN, sai)).toBe(-1)
  })

  it('token rỗng, sai độ dài, hoặc hồ sơ chưa duyệt → không ra dòng nào', () => {
    expect(gs.timTheoToken_(sheetGia(rows), gs.HS_COT_TOKEN, '')).toBe(-1)
    expect(gs.timTheoToken_(sheetGia(rows), gs.HS_COT_TOKEN, 'a'.repeat(31))).toBe(-1)
    expect(gs.timTheoToken_(sheetGia(rows), gs.HS_COT_TOKEN, 'a'.repeat(33))).toBe(-1)
  })

  it('token sinh ra dài đúng 32 ký tự chữ+số và không trùng nhau', () => {
    const a = gs.sinhToken_()
    const b = gs.sinhToken_()
    expect(a).toMatch(/^[0-9a-fA-F]{32}$/)
    expect(a).not.toBe(b)
  })
})

describe('App — đường link quyết định vai', () => {
  it('/hs/<token> → vai học sinh, giữ token', () => {
    const t = 'c'.repeat(32)
    expect(docDuongVao(`?vai=hs&token=${t}`)).toEqual({ vai: 'hs', token: t, maCa: '' })
  })

  it('/ph/<token> → vai phụ huynh', () => {
    const t = 'd'.repeat(32)
    expect(docDuongVao(`?vai=ph&token=${t}`).vai).toBe('ph')
  })

  // VAI chỉ là chuyện hiển thị, TOKEN mới là chuyện quyền. Token sai độ dài
  // hoặc có ký tự lạ thì BỎ HẲN, không lưu vào máy; vai vẫn nhận vì app đã cài
  // mở lên bằng start_url không hề có token (xem tests/mo-app-da-cai.test.ts).
  // Không có token trong máy thì mọi lệnh đọc dữ liệu đều bị máy chủ chặn.
  it('token sai độ dài hoặc có ký tự lạ → KHÔNG nhận token', () => {
    expect(docDuongVao('?vai=hs&token=abc').token).toBe('')
    expect(docDuongVao(`?vai=hs&token=${'a'.repeat(31)}!`).token).toBe('')
    expect(docDuongVao(`?vai=ph&token=${'a'.repeat(33)}`).token).toBe('')
  })

  it('vai gv không cần token; không có tham số thì không có vai', () => {
    expect(docDuongVao('?vai=gv')).toEqual({ vai: 'gv', token: '', maCa: '' })
    expect(docDuongVao('').vai).toBeNull()
  })

  it('link mời làm bài đi kèm vẫn được giữ để mở màn thi', () => {
    expect(docDuongVao('?examCode=984033').maCa).toBe('984033')
  })

  it('mỗi vai mở đúng màn đầu của mình', () => {
    expect(manDauCua('hs')).toBe('studentprofile')
    expect(manDauCua('ph')).toBe('parent')
    expect(manDauCua('gv')).toBe('examhub')
  })
})

describe('Số điện thoại làm khoá tra cứu phụ huynh', () => {
  // Google Sheets tự đổi "0912345678" thành SỐ 912345678 (mất số 0 đầu). Mọi
  // số điện thoại Việt Nam đều bắt đầu bằng 0, nên không chuẩn hoá là tra
  // trượt toàn bộ phụ huynh.
  const gs2 = new Function(
    'Utilities',
    `${gsCode}\nreturn { chuanSdt_, timDongPH_ }`,
  )({ getUuid: () => 'x' }) as {
    chuanSdt_: (v: unknown) => string
    timDongPH_: (sh: { getDataRange: () => { getValues: () => unknown[][] } }, sdt: string) => number
  }

  const sheetPH = (rows: unknown[][]) => ({ getDataRange: () => ({ getValues: () => rows }) })

  it('chuẩn hoá: bỏ số 0 đầu, bỏ ký tự lạ, chịu được ô lưu dạng số', () => {
    expect(gs2.chuanSdt_('0912345678')).toBe('912345678')
    expect(gs2.chuanSdt_(912345678)).toBe('912345678')
    expect(gs2.chuanSdt_(' 091 234 5678 ')).toBe('912345678')
    expect(gs2.chuanSdt_('')).toBe('')
  })

  it('tra ra đúng dòng dù sheet lưu số điện thoại dạng SỐ', () => {
    const rows = [
      ['SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'DangKyLuc', 'Token', 'TrangThai', 'DuyetLuc'],
      [912345678, 'Chị Lan', '110234', '11A1', 'Lê Minh Đức', '', '', 'cho_duyet', ''],
    ]
    expect(gs2.timDongPH_(sheetPH(rows), '0912345678')).toBe(2)
    expect(gs2.timDongPH_(sheetPH(rows), '912345678')).toBe(2)
    expect(gs2.timDongPH_(sheetPH(rows), '0912345679')).toBe(-1)
    expect(gs2.timDongPH_(sheetPH(rows), '')).toBe(-1)
  })
})
