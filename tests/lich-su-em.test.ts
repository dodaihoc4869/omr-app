// LỊCH SỬ ĐIỂM CỦA EM — lệnh ĐỌC CÔNG KHAI thứ hai của cả hệ thống (thầy chốt
// 06/09: phải lấy từ máy chủ, kẻo em đổi máy là mất sạch biểu đồ tiến bộ).
//
// Đọc theo SỐ BÁO DANH TRẦN là ai biết số báo danh cũng đọc được cả quá trình
// học của em — mà số báo danh nằm ngay trên danh sách lớp. Nên bộ kiểm này
// dựng đúng cái kịch bản đó và đòi máy chủ TỪ CHỐI.
//
// Chạy đúng file `.gs` sẽ dán lên Google, không viết lại logic trong test.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

interface Bang {
  [ten: string]: unknown[][]
}

function dungMayChu(bang: Bang) {
  const sheets: Record<string, unknown> = {}
  const lamSheet = (ten: string) => {
    const o = {
      getName: () => ten,
      getLastRow: () => (bang[ten] ? bang[ten].length : 0),
      getLastColumn: () => (bang[ten] && bang[ten][0] ? bang[ten][0].length : 0),
      getDataRange: () => o.getRange(1, 1, o.getLastRow(), o.getLastColumn()),
      getRange: (r: number, c: number, nr = 1, nc = 1) => ({
        getValues: () => {
          const ra: unknown[][] = []
          for (let i = 0; i < nr; i++) {
            const hang: unknown[] = []
            for (let j = 0; j < nc; j++) hang.push(bang[ten]?.[r - 1 + i]?.[c - 1 + j] ?? '')
            ra.push(hang)
          }
          return ra
        },
        getValue: () => bang[ten]?.[r - 1]?.[c - 1] ?? '',
        setValues: () => {},
        setValue: () => {},
      }),
      appendRow: (v: unknown[]) => {
        if (!bang[ten]) bang[ten] = []
        bang[ten].push(v.slice())
      },
    }
    return o
  }
  for (const ten of Object.keys(bang)) sheets[ten] = lamSheet(ten)
  const ss = {
    getName: () => 'Bang thu',
    getSheetByName: (ten: string) => sheets[ten] || null,
    insertSheet: (ten: string) => {
      bang[ten] = []
      sheets[ten] = lamSheet(ten)
      return sheets[ten]
    },
  }
  const moi = {
    SpreadsheetApp: { openById: () => ss },
    LockService: { getScriptLock: () => ({ waitLock: () => true, releaseLock: () => true }) },
    ContentService: { createTextOutput: (s: string) => ({ setMimeType: () => s }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => (k === 'MA_BI_MAT' ? 'MA-THAT' : k === 'SPREADSHEET_ID' ? 'id-thu' : '') }) },
    DriveApp: {},
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} },
  }
  const ten = Object.keys(moi)
  const gia = ten.map((k) => (moi as Record<string, unknown>)[k])
  const chay = new Function(...ten, `${gsCode}\nreturn { doPost: doPost }`)(...gia) as {
    doPost: (e: { postData: { contents: string } }) => string
  }
  return { bang, goi: (body: unknown) => JSON.parse(chay.doPost({ postData: { contents: JSON.stringify(body) } })) }
}

const LUOT_H = ['MaCa', 'SBD', 'LanThu', 'IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson', 'HoTen', 'DiemI', 'DiemII', 'DiemIII', 'Tong', 'DuyetBoi', 'DuyetLuc', 'GhiChu', 'CapNhatLuc', 'GiayCauJson']
const CA_H = ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson', 'BatDau', 'HetHanVao', 'TrangThai', 'TenCa']

function luot(maCa: string, sbd: string, idTb: string, nopLuc: string, tong: number | '', trangThai = 'da_nop', lanThu = 1): unknown[] {
  const h = new Array(LUOT_H.length).fill('')
  h[0] = maCa
  h[1] = sbd
  h[2] = lanThu
  h[3] = idTb
  h[6] = nopLuc
  h[7] = trangThai
  h[16] = tong
  return h
}

function hangCa(maCa: string, tenCa: string): unknown[] {
  const h = new Array(CA_H.length).fill('')
  h[0] = maCa
  h[10] = tenCa
  return h
}

const MAY_EM = 'may-cua-em-1234'
const MAY_LA = 'may-cua-ban-khac'

function bangCoBan(): Bang {
  return {
    LuotThi: [
      LUOT_H,
      luot('CA1', '100001', MAY_EM, '2026-08-01T02:00:00Z', 5.5),
      luot('CA2', '100001', MAY_EM, '2026-08-15T02:00:00Z', 7),
      // Ca mới nhất em vừa nộp trên MÁY MỚI — đúng cảnh "em đổi máy".
      luot('CA3', '100001', 'may-moi-cua-em', '2026-09-01T02:00:00Z', 8.25),
      // Em khác, KHÔNG được lọt vào kết quả.
      luot('CA1', '100002', 'may-cua-em-khac', '2026-08-01T02:00:00Z', 9),
    ],
    CaKiemTra: [CA_H, hangCa('CA1', 'Ester lần 1'), hangCa('CA2', 'Amine'), hangCa('CA3', 'Ôn tổng')],
  }
}

const xin = (maCa: string, sbd: string, idThietBi: string) => ({ action: 'lichSuEm', maCa, sbd, idThietBi })

describe('Hai lớp khoá của lệnh đọc công khai', () => {
  it('ĐÚNG máy vừa ngồi thi → trả đủ lịch sử của CHÍNH em đó', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi(xin('CA1', '100001', MAY_EM))
    expect(r.ok).toBe(true)
    expect(r.items.map((x: { maCa: string }) => x.maCa)).toEqual(['CA1', 'CA2', 'CA3'])
    expect(r.items.map((x: { tong: number }) => x.tong)).toEqual([5.5, 7, 8.25])
    expect(r.items[0].tenCa).toBe('Ester lần 1')
  })

  it('EM ĐỔI MÁY: neo vào ca vừa nộp trên máy mới, vẫn thấy đủ ca cũ', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi(xin('CA3', '100001', 'may-moi-cua-em'))
    expect(r.ok).toBe(true)
    expect(r.items).toHaveLength(3)
    expect(r.items.map((x: { maCa: string }) => x.maCa)).toEqual(['CA1', 'CA2', 'CA3'])
  })

  it('KHOÁ 2 — biết số báo danh nhưng máy khác → TỪ CHỐI (đây là phép kiểm quan trọng nhất)', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi(xin('CA1', '100001', MAY_LA))
    expect(r.ok).toBe(false)
    expect(r.items).toBeUndefined()
    // Không nói sai ở đâu.
    expect(r.error).toBe('Không xem được lịch sử')
  })

  it('KHOÁ 1 — chưa nộp ca đó thì không đọc được, dù đúng máy', () => {
    const b = bangCoBan()
    b.LuotThi.push(luot('CA9', '100001', MAY_EM, '', '', 'dang_lam'))
    const m = dungMayChu(b)
    expect(m.goi(xin('CA9', '100001', MAY_EM)).ok).toBe(false)
    // Ca không tồn tại cũng vậy.
    expect(m.goi(xin('CA-KHONG-CO', '100001', MAY_EM)).ok).toBe(false)
  })

  it('thiếu bất kỳ trường nào → từ chối, không đoán hộ', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi(xin('', '100001', MAY_EM)).ok).toBe(false)
    expect(m.goi(xin('CA1', '', MAY_EM)).ok).toBe(false)
    expect(m.goi(xin('CA1', '100001', '')).ok).toBe(false)
  })
})

describe('Nội dung trả về', () => {
  it('CHỈ có mã ca, tên ca, ngày, điểm — không họ tên, không bài làm, không em khác', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi(xin('CA1', '100001', MAY_EM))
    for (const x of r.items) expect(Object.keys(x).sort()).toEqual(['maCa', 'ngay', 'tenCa', 'tong'])
    const chuoi = JSON.stringify(r)
    expect(chuoi).not.toContain('100002')
    expect(chuoi).not.toContain('DapAnJson')
    expect(chuoi).not.toContain(MAY_EM)
  })

  it('em thi lại một ca → lấy lượt NỘP SAU CÙNG, một ca đúng một điểm', () => {
    const b = bangCoBan()
    b.LuotThi.push(luot('CA1', '100001', MAY_EM, '2026-08-02T02:00:00Z', 8, 'da_nop', 2))
    const m = dungMayChu(b)
    const r = m.goi(xin('CA1', '100001', MAY_EM))
    const ca1 = r.items.filter((x: { maCa: string }) => x.maCa === 'CA1')
    expect(ca1).toHaveLength(1)
    expect(ca1[0].tong).toBe(8)
  })

  it('lượt chưa có điểm thì bỏ qua, không vẽ điểm 0 giả', () => {
    const b = bangCoBan()
    b.LuotThi.push(luot('CA7', '100001', MAY_EM, '2026-08-20T02:00:00Z', ''))
    const m = dungMayChu(b)
    const r = m.goi(xin('CA1', '100001', MAY_EM))
    expect(r.items.map((x: { maCa: string }) => x.maCa)).not.toContain('CA7')
  })

  it('bài bị KHOÁ vẫn tính — đó là điểm thật của em', () => {
    const b = bangCoBan()
    b.LuotThi.push(luot('CA8', '100001', MAY_EM, '2026-08-25T02:00:00Z', 3.5, 'khoa'))
    const m = dungMayChu(b)
    const r = m.goi(xin('CA1', '100001', MAY_EM))
    expect(r.items.map((x: { maCa: string }) => x.maCa)).toContain('CA8')
  })
})

describe('Không kéo cả bảng LuotThi', () => {
  it('đọc hai dải hẹp, KHÔNG đụng ba cột JSON nặng', () => {
    const i = gsCode.indexOf("action === 'lichSuEm'")
    // Bỏ CHÚ THÍCH trước khi quét: chính chú thích của chỗ này có chữ
    // `docCa_` trong đó, quét cả chú thích là tự bắt mình.
    const than = gsCode
      .slice(i, gsCode.indexOf("action === 'danhSachCauHoi'"))
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    expect(than).toContain('sh.getRange(1, 1, n, 8).getValues()')
    expect(than).toContain('sh.getRange(1, 17, n, 1).getValues()')
    expect(than).not.toContain('getDataRange')
    // Tên ca lấy hai cột hẹp, không mở từng dòng bằng docCa_.
    expect(than).not.toContain('docCa_')
  })

  it('máy khách rơi về bản lưu trong máy khi máy chủ không trả lời', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/ExamTakeScreen.tsx'), 'utf8')
    const khoi = man.slice(man.indexOf('// LỊCH SỬ ĐIỂM'), man.indexOf('const phieuCuaEm'))
    expect(khoi).toContain('lichSuEmApi(')
    expect(khoi).toContain('docLichSuDiem(')
    // Máy chủ đứng trước, bản trong máy là đường lùi.
    expect(khoi.indexOf('lichSuEmApi(')).toBeLessThan(khoi.indexOf('docLichSuDiem('))
  })
})
