// THÙNG RÁC CÂU HỎI CỦA EM — thầy chốt 06/09 chiều.
//
// Xoá phải là ĐÁNH DẤU, không xoá dòng. Câu hỏi là thứ em chủ động gửi đi;
// một cú chạm nhầm của thầy không được làm nó bốc hơi khỏi máy chủ.
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
        setValues: (v: unknown[][]) => {
          for (let i = 0; i < v.length; i++) for (let j = 0; j < v[i].length; j++) bang[ten][r - 1 + i][c - 1 + j] = v[i][j]
        },
        setValue: (v: unknown) => {
          while (bang[ten][r - 1].length < c) bang[ten][r - 1].push('')
          bang[ten][r - 1][c - 1] = v
        },
      }),
      appendRow: (v: unknown[]) => {
        if (!bang[ten]) bang[ten] = []
        bang[ten].push(v.slice())
      },
      deleteRow: (r: number) => bang[ten].splice(r - 1, 1),
    }
    return o
  }
  for (const ten of Object.keys(bang)) sheets[ten] = lamSheet(ten)
  const moi = {
    SpreadsheetApp: {
      openById: () => ({
        getName: () => 'Bang thu',
        getSheetByName: (ten: string) => sheets[ten] || null,
        insertSheet: (ten: string) => {
          bang[ten] = []
          sheets[ten] = lamSheet(ten)
          return sheets[ten]
        },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock: () => true, releaseLock: () => true }) },
    ContentService: { createTextOutput: (s: string) => ({ setMimeType: () => s }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => (k === 'MA_BI_MAT' ? 'MA-THAT' : k === 'SPREADSHEET_ID' ? 'id-thu' : ''), setProperty: () => {}, deleteProperty: () => {} }) },
    DriveApp: {},
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} },
    MimeType: { PLAIN_TEXT: 'text/plain' },
  }
  const ten = Object.keys(moi)
  const gia = ten.map((k) => (moi as Record<string, unknown>)[k])
  const chay = new Function(...ten, `${gsCode}\nreturn { doPost: doPost }`)(...gia) as {
    doPost: (e: { postData: { contents: string } }) => string
  }
  return { bang, goi: (body: unknown) => JSON.parse(chay.doPost({ postData: { contents: JSON.stringify(body) } })) }
}

const H = ['Ma', 'MaCa', 'SBD', 'HoTen', 'QidJson', 'GhiChu', 'GuiLuc', 'DaChua', 'ChuaLuc', 'Xoa']

function dong(ma: string, maCa: string, sbd: string, xoa = ''): unknown[] {
  return [ma, maCa, sbd, 'Em ' + sbd, '["q1","q2"]', '', '2026-09-06T01:00:00Z', '', '', xoa]
}

const CA_H = ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson', 'BatDau', 'HetHanVao', 'TrangThai', 'TenCa']

function bangCoBan(): Bang {
  return {
    CauHoiEm: [H, dong('m1', 'CA1', '1'), dong('m2', 'CA1', '2'), dong('m3', 'CA2', '1'), dong('m4', 'CA3', '1')],
    CaKiemTra: [CA_H, ['CA1', '', '', '', '', '', '', '', '', '', 'Test15'], ['CA2', '', '', '', '', '', '', '', '', '', 'Test15'], ['CA3', '', '', '', '', '', '', '', '', '', 'Test15']],
  }
}

const XEM = (thungRac = false) => ({ action: 'danhSachCauHoi', secret: 'MA-THAT', maCa: '', thungRac })

describe('Quyền — chỉ máy thầy được xoá', () => {
  it('KHÔNG có mã bí mật thì không xoá được', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'xoaCauHoi', maCa: ['CA1'] }).ok).toBe(false)
    expect(m.goi({ action: 'xoaCauHoi', secret: 'sai', maCa: ['CA1'] }).ok).toBe(false)
    // Và dữ liệu không suy suyển.
    expect(m.goi(XEM()).items).toHaveLength(4)
  })

  it('chưa chọn ca nào thì từ chối, không quét cả bảng', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: [] }).ok).toBe(false)
  })
})

describe('Xoá là đánh dấu, KHÔNG xoá dòng', () => {
  it('xoá một ca: dòng vẫn còn trên sheet, chỉ có thêm mốc xoá', () => {
    const b = bangCoBan()
    const m = dungMayChu(b)
    const r = m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1'] })
    expect(r.ok).toBe(true)
    expect(r.soCa).toBe(1)
    expect(r.soDong).toBe(2)
    // ĐÂY là điều quan trọng nhất: bảng vẫn đủ 4 dòng.
    expect(b.CauHoiEm).toHaveLength(5)
    expect(String(b.CauHoiEm[1][9])).not.toBe('')
    expect(String(b.CauHoiEm[3][9])).toBe('')
  })

  it('XOÁ HÀNG LOẠT nhiều ca một lượt', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1', 'CA3'] })
    expect(r.soCa).toBe(2)
    expect(r.soDong).toBe(3)
    expect(m.goi(XEM()).items.map((x: { maCa: string }) => x.maCa)).toEqual(['CA2'])
  })

  it('ca đã xoá BIẾN KHỎI màn chính và HIỆN trong thùng rác', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1'] })
    expect(m.goi(XEM(false)).items.map((x: { maCa: string }) => x.maCa)).toEqual(['CA2', 'CA3'])
    const rac = m.goi(XEM(true)).items
    expect(rac.map((x: { maCa: string }) => x.maCa)).toEqual(['CA1', 'CA1'])
    expect(rac.every((x: { xoa: string }) => !!x.xoa)).toBe(true)
  })

  it('xoá lại ca ĐANG trong thùng rác thì không đụng gì thêm', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1'] })
    expect(m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1'] }).soDong).toBe(0)
  })
})

describe('Khôi phục', () => {
  it('khôi phục đúng ca đã chọn, ca khác vẫn nằm trong thùng rác', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1', 'CA2'] })
    const r = m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA2'], khoiPhuc: true })
    expect(r.soCa).toBe(1)
    expect(m.goi(XEM(false)).items.map((x: { maCa: string }) => x.maCa)).toEqual(['CA2', 'CA3'])
    expect(m.goi(XEM(true)).items.map((x: { maCa: string }) => x.maCa)).toEqual(['CA1', 'CA1'])
  })

  it('KHÔI PHỤC TẤT CẢ dọn sạch thùng rác', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1', 'CA2', 'CA3'] })
    expect(m.goi(XEM(false)).items).toHaveLength(0)
    const r = m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: [], tatCa: true, khoiPhuc: true })
    expect(r.soDong).toBe(4)
    expect(m.goi(XEM(true)).items).toHaveLength(0)
    expect(m.goi(XEM(false)).items).toHaveLength(4)
  })

  it('khôi phục ca ĐANG HIỆN thì không ghi đè gì', () => {
    const b = bangCoBan()
    const m = dungMayChu(b)
    expect(m.goi({ action: 'xoaCauHoi', secret: 'MA-THAT', maCa: ['CA1'], khoiPhuc: true }).soDong).toBe(0)
    expect(String(b.CauHoiEm[1][9])).toBe('')
  })
})

describe('Sheet cũ chưa có cột Xoa vẫn chạy', () => {
  it('thiếu cột thì tự bổ sung tiêu đề, mọi ca vẫn hiện ở màn chính', () => {
    const b = bangCoBan()
    // Dựng lại đúng cảnh sheet đang chạy thật: 9 cột, chưa có `Xoa`.
    b.CauHoiEm = [H.slice(0, 9), dong('m1', 'CA1', '1').slice(0, 9), dong('m2', 'CA2', '1').slice(0, 9)]
    const m = dungMayChu(b)
    expect(m.goi(XEM(false)).items).toHaveLength(2)
    expect(m.goi(XEM(true)).items).toHaveLength(0)
    expect(String(b.CauHoiEm[0][9])).toBe('Xoa')
  })
})

describe('Màn dựng đúng cách', () => {
  it('có ô tích, xoá hàng loạt, thùng rác và khôi phục tất cả', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/CauHoiScreen.tsx'), 'utf8')
    expect(man).toContain('role="checkbox"')
    expect(man).toContain('Chọn tất cả')
    expect(man).toContain('Thùng rác')
    expect(man).toContain('Khôi phục tất cả')
    // Xoá đi qua ĐÚNG lệnh máy chủ, không có đường xoá tắt nào khác.
    expect(man).toContain('xoaCauHoi(url.trim(), mat.trim(), maCa, { khoiPhuc, tatCa })')
  })
})
