// ĐẾM TIN CHƯA ĐỌC — tối ưu máy chủ 06/09.
//
// Bong bóng nổi hỏi lại đều đặn chỉ để biết có mấy tin chưa đọc, mà trước đây
// gọi `listMessages`: máy chủ đọc CẢ SHEET, mười cột kể cả nội dung từng tin,
// rồi trả về hết. Nay `demTinMoi` đọc đúng một cột và trả về hai con số.
//
// Chạy đúng file `.gs` sẽ dán lên Google, không viết lại logic trong test.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

interface Bang {
  [ten: string]: unknown[][]
}

function dungMayChu(bang: Bang) {
  const sheets: Record<string, unknown> = {}
  /** Ghi lại MỌI vùng máy chủ đã đọc — để đo lệnh có "hẹp" thật không. */
  const daDoc: { ten: string; r: number; c: number; nr: number; nc: number }[] = []
  const lamSheet = (ten: string) => {
    const o = {
      getName: () => ten,
      getLastRow: () => (bang[ten] ? bang[ten].length : 0),
      getLastColumn: () => (bang[ten] && bang[ten][0] ? bang[ten][0].length : 0),
      getDataRange: () => o.getRange(1, 1, o.getLastRow(), o.getLastColumn()),
      getRange: (r: number, c: number, nr = 1, nc = 1) => {
        daDoc.push({ ten, r, c, nr, nc })
        return {
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
        }
      },
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
  const chay = new Function(...ten, `${gsCode}\nreturn { doGet: doGet }`)(...gia) as {
    doGet: (e: { parameter: Record<string, string> }) => string
  }
  return {
    daDoc,
    xoaVet: () => daDoc.splice(0, daDoc.length),
    goi: (parameter: Record<string, string>) => JSON.parse(chay.doGet({ parameter })),
  }
}

const H = ['Id', 'SDT', 'HoTenPhuHuynh', 'SBD', 'Lop', 'HoTenHocSinh', 'NoiDung', 'ThoiGian', 'DaDoc', 'NguoiGui']

function tin(id: string, daDoc: boolean): unknown[] {
  return [id, '090', 'PH', '1', '12A1', 'Em A', 'Một nội dung tin nhắn khá dài để thấy rõ nó nặng', '2026-09-06T01:00:00Z', daDoc ? 'true' : '', 'phuhuynh']
}

const bangCoBan = (): Bang => ({ TinNhan: [H, tin('1', false), tin('2', true), tin('3', false)] })

describe('Đếm tin chưa đọc', () => {
  it('KHÔNG có mã bí mật thì từ chối', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'demTinMoi' }).ok).toBe(false)
    expect(m.goi({ action: 'demTinMoi', secret: 'sai' }).ok).toBe(false)
  })

  it('đếm đúng số chưa đọc và tổng số tin', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi({ action: 'demTinMoi', secret: 'MA-THAT' })
    expect(r.ok).toBe(true)
    expect(r.soChuaDoc).toBe(2)
    expect(r.tong).toBe(3)
  })

  it('hộp thư trống trả 0, không vỡ', () => {
    const m = dungMayChu({ TinNhan: [H] })
    const r = m.goi({ action: 'demTinMoi', secret: 'MA-THAT' })
    expect(r.soChuaDoc).toBe(0)
    expect(r.tong).toBe(0)
  })

  it('CHỈ ĐỌC MỘT CỘT — đây mới là chỗ tiết kiệm', () => {
    const m = dungMayChu(bangCoBan())
    m.xoaVet()
    m.goi({ action: 'demTinMoi', secret: 'MA-THAT' })
    const doc = m.daDoc.filter((x) => x.ten === 'TinNhan')
    expect(doc).toHaveLength(1)
    expect(doc[0].nc).toBe(1)
    expect(doc[0].c).toBe(9)
  })

  it('so với listMessages: lệnh cũ đọc CẢ MƯỜI CỘT', () => {
    const m = dungMayChu(bangCoBan())
    m.xoaVet()
    m.goi({ action: 'listMessages', secret: 'MA-THAT' })
    const rong = Math.max(...m.daDoc.filter((x) => x.ten === 'TinNhan').map((x) => x.nc))
    expect(rong).toBe(H.length)
  })
})

describe('Bong bóng hỏi lại đúng cách', () => {
  it('dùng demTinMoi để đếm, KHÔNG kéo cả hộp thư', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const fab = readFileSync(resolve(__dirname, '../src/components/MessagesFab.tsx'), 'utf8')
    const vongHoi = fab.slice(fab.indexOf('const pollUnread'), fab.indexOf('useEffect(() => {\n    const onResize'))
    expect(vongHoi).toContain('demTinMoi(')
    expect(vongHoi).not.toContain('listParentMessages(')
  })

  it('MÀN ẨN thì im hẳn, hiện lại thì hỏi ngay', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const fab = readFileSync(resolve(__dirname, '../src/components/MessagesFab.tsx'), 'utf8')
    expect(fab).toContain("document.visibilityState === 'visible'")
    expect(fab).toContain("addEventListener('visibilitychange'")
    expect(fab).toContain('const POLL_MS = 60000')
  })
})
