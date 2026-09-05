// ĐỊNH NGHĨA HOÀN THÀNH của HOIBAITHAY.md mục 8 — mười hai phép kiểm tự động.
//
// Phần MÁY CHỦ chạy ĐÚNG mã sẽ dán lên Google: nạp `docs/apps-script-kiem-tra.gs`
// vào Node và dựng bộ giả cho SpreadsheetApp / LockService / ContentService.
// Không viết lại logic trong test — viết lại là kiểm bản chép, không kiểm bản
// chạy thật.
//
// Phép kiểm số 1 là quan trọng nhất: gói em gửi lên KHÔNG được chứa đề, đáp án
// hay lời giải. Quét thẳng chuỗi JSON.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'
import {
  TI_LE_NHAC_NHIEU,
  TOI_DA_GHI_CHU,
  TOI_DA_TEN_HIEN,
  demCauHoi,
  dongTenEm,
  dungTrangTongHop,
  goiCauHoi,
  gopTheoCau,
  loiNhacTickNhieu,
  type CauHoiCuaEm,
} from '../src/lib/hoi-bai'

// ---------------------------------------------------------------------------
// BỘ GIẢ GOOGLE — chỉ đủ cho ba lệnh hỏi bài, không giả cả Apps Script.

interface Bang {
  [ten: string]: unknown[][]
}

function dungMayChu(bang: Bang, maBiMat = 'MA-THAT') {
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
          for (let i = 0; i < v.length; i++) {
            if (!bang[ten][r - 1 + i]) bang[ten][r - 1 + i] = []
            for (let j = 0; j < v[i].length; j++) bang[ten][r - 1 + i][c - 1 + j] = v[i][j]
          }
        },
        setValue: (v: unknown) => {
          if (!bang[ten][r - 1]) bang[ten][r - 1] = []
          bang[ten][r - 1][c - 1] = v
        },
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
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => (k === 'MA_BI_MAT' ? maBiMat : k === 'SPREADSHEET_ID' ? 'id-thu' : '') }) },
    DriveApp: {},
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} },
  }

  const ten = Object.keys(moi)
  const gia = ten.map((k) => (moi as Record<string, unknown>)[k])
  const chay = new Function(...ten, `${gsCode}\nreturn { doPost: doPost }`)(...gia) as {
    doPost: (e: { postData: { contents: string } }) => string
  }
  return {
    bang,
    goi: (body: unknown) => JSON.parse(chay.doPost({ postData: { contents: JSON.stringify(body) } })),
  }
}

const LUOT_H = ['MaCa', 'SBD', 'LanThu', 'IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson', 'HoTen', 'DiemI', 'DiemII', 'DiemIII', 'Tong', 'DuyetBoi', 'DuyetLuc', 'GhiChu', 'CapNhatLuc', 'GiayCauJson']
const CT_H = ['MaCa', 'SBD', 'LanThu', 'Phan', 'SoCau', 'Qid', 'ChuyenDe', 'MucDo', 'DapAnChon', 'DapAnDung', 'DungSai', 'GiayLamCau', 'GhiLuc']

function hangLuot(maCa: string, sbd: string, trangThai: string, hoTen = 'Nguyen Van A'): unknown[] {
  const h = new Array(LUOT_H.length).fill('')
  h[0] = maCa
  h[1] = sbd
  h[2] = 1
  h[7] = trangThai
  h[12] = hoTen
  return h
}

function hangCt(maCa: string, sbd: string, qid: string): unknown[] {
  const h = new Array(CT_H.length).fill('')
  h[0] = maCa
  h[1] = sbd
  h[2] = 1
  h[5] = qid
  return h
}

function bangCoBan(): Bang {
  return {
    LuotThi: [LUOT_H, hangLuot('CA1', '100001', 'da_nop'), hangLuot('CA1', '100002', 'dang_lam', 'Tran Thi B')],
    ChiTietCau: [CT_H, hangCt('CA1', '100001', 'q1'), hangCt('CA1', '100001', 'q2'), hangCt('CA1', '100001', 'q3'), hangCt('CA1', '100002', 'q1')],
    CauHoiEm: [['Ma', 'MaCa', 'SBD', 'HoTen', 'QidJson', 'GhiChu', 'GuiLuc', 'DaChua', 'ChuaLuc']],
  }
}

// ---------------------------------------------------------------------------
// CÂU MẪU cho phần gộp và dựng trang

function cau(id: string, text: string): CauLuyen {
  return { phan: 'I', id, chuyenDe: 'Ester', mucDo: 'hieu', text, luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', chot: 'A', lyDo: null, buoc: ['Bước một'], ketQua: 'A' }
}

const DE: CauLuyen[] = [cau('q1', 'Câu một về ester'), cau('q2', 'Câu hai về amine'), cau('q3', 'Câu ba về polymer')]

function dong(sbd: string, hoTen: string, qids: string[], ghiChu = ''): CauHoiCuaEm {
  return { maCa: 'CA1', sbd, hoTen, qids, ghiChu, guiLuc: '2026-09-05T12:00:00Z', daChua: false, chuaLuc: '' }
}

// ---------------------------------------------------------------------------

describe('HOIBAITHAY.md mục 8 — định nghĩa hoàn thành', () => {
  it('1. gói gửi lên CHỈ có maCa, sbd, qids, ghiChu — không đề, không đáp án, không lời giải', () => {
    const g = goiCauHoi('CA1', '100001', ['q1', 'q2'], 'em không hiểu bước quy đổi mol')
    expect(Object.keys(g).sort()).toEqual(['ghiChu', 'maCa', 'qids', 'sbd'])

    const chuoi = JSON.stringify(g)
    // Quét thẳng: không một mảnh nội dung đề nào lọt vào gói.
    for (const c of DE) {
      expect(chuoi).not.toContain(c.text)
      expect(chuoi).not.toContain(c.buoc![0])
    }
    expect(chuoi).not.toContain('dapAn')
    expect(chuoi).not.toContain('loiGiai')
    expect(chuoi).not.toContain('chuyenDe')
  })

  it('2. guiCauHoi khi KHÔNG có lượt đã nộp → từ chối, không ghi dòng nào', () => {
    const m = dungMayChu(bangCoBan())
    // 100002 đang làm, chưa nộp.
    const r1 = m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100002', qids: ['q1'] })
    expect(r1.ok).toBe(false)
    // SBD chưa thi ca này bao giờ.
    const r2 = m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '999999', qids: ['q1'] })
    expect(r2.ok).toBe(false)
    // Ca khác.
    const r3 = m.goi({ action: 'guiCauHoi', maCa: 'CA-KHAC', sbd: '100001', qids: ['q1'] })
    expect(r3.ok).toBe(false)
    expect(m.bang.CauHoiEm).toHaveLength(1) // chỉ còn dòng tiêu đề
  })

  it('3. qid không thuộc ca đó → LOẠI im lặng, các qid hợp lệ còn lại vẫn ghi', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q1', 'q-la', 'q3'] })
    expect(r.ok).toBe(true)
    expect(r.soCau).toBe(2)
    expect(JSON.parse(String(m.bang.CauHoiEm[1][4]))).toEqual(['q1', 'q3'])
    // 'q1' của em 100002 KHÔNG làm 'q2' hợp lệ cho em 100001 — cổng theo từng em.
    const r2 = m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q-la'] })
    expect(r2.ok).toBe(false)
  })

  it('4. gửi lần hai → GHI ĐÈ, sheet vẫn đúng một dòng cho cặp (maCa, sbd)', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q1', 'q2', 'q3'] })
    expect(m.bang.CauHoiEm).toHaveLength(2)
    const r = m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q2'] })
    expect(r.ghiDe).toBe(true)
    expect(m.bang.CauHoiEm).toHaveLength(2)
    expect(JSON.parse(String(m.bang.CauHoiEm[1][4]))).toEqual(['q2'])
  })

  it('5. ghiChu 500 ký tự → cắt còn 300, ở CẢ máy em và máy chủ', () => {
    const dai = 'x'.repeat(500)
    expect(goiCauHoi('CA1', '100001', ['q1'], dai).ghiChu).toHaveLength(TOI_DA_GHI_CHU)

    // Máy chủ cắt lại lần nữa — không tin máy khách cắt hộ.
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q1'], ghiChu: dai })
    expect(String(m.bang.CauHoiEm[1][5])).toHaveLength(TOI_DA_GHI_CHU)
  })

  it('6. mọi lý do từ chối trả CÙNG MỘT CÂU, không lộ sai ở đâu', () => {
    const m = dungMayChu(bangCoBan())
    const cau = [
      m.goi({ action: 'guiCauHoi', maCa: '', sbd: '100001', qids: ['q1'] }),
      m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '', qids: ['q1'] }),
      m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100002', qids: ['q1'] }),
      m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '999999', qids: ['q1'] }),
      m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q-la'] }),
      m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: [] }),
    ].map((r) => r.error)
    expect(new Set(cau).size).toBe(1)
    expect(cau[0]).toBe('Không gửi được câu hỏi')
  })

  it('7. ba em hỏi cùng một qid → MỘT thẻ câu, ba tên', () => {
    const g = gopTheoCau([dong('1', 'A', ['q1']), dong('2', 'B', ['q1']), dong('3', 'C', ['q1', 'q2'])], DE)
    expect(g).toHaveLength(2)
    expect(g[0].qid).toBe('q1')
    expect(g[0].emHoi.map((e) => e.hoTen)).toEqual(['A', 'B', 'C'])
    // Cùng một em gửi trùng qid không đếm hai lần.
    const g2 = gopTheoCau([dong('1', 'A', ['q1', 'q1'])], DE)
    expect(g2[0].emHoi).toHaveLength(1)
  })

  it('8. xếp GIẢM DẦN theo số em hỏi; bằng nhau thì theo thứ tự câu trong đề', () => {
    const g = gopTheoCau([dong('1', 'A', ['q3', 'q2']), dong('2', 'B', ['q3']), dong('3', 'C', ['q3', 'q2', 'q1'])], DE)
    expect(g.map((x) => x.qid)).toEqual(['q3', 'q2', 'q1'])
    expect(g.map((x) => x.emHoi.length)).toEqual([3, 2, 1])

    // Bằng nhau → q1 (vị trí 1) đứng trước q3 (vị trí 3).
    const b = gopTheoCau([dong('1', 'A', ['q3', 'q1'])], DE)
    expect(b.map((x) => x.qid)).toEqual(['q1', 'q3'])
  })

  it('9. quá 8 tên → hiện 8 tên và "và N em nữa", N tính đúng', () => {
    const em = Array.from({ length: 12 }, (_, i) => ({ sbd: String(i), hoTen: `Em ${i + 1}` }))
    const d = dongTenEm(em)
    expect(d.split(' · ')).toHaveLength(TOI_DA_TEN_HIEN)
    expect(d).toContain('và 4 em nữa')
    expect(d).toContain('Em 8')
    expect(d).not.toContain('Em 9 ')

    // Đúng 8 thì KHÔNG có đuôi.
    expect(dongTenEm(em.slice(0, 8))).not.toContain('em nữa')
    // Không có tên thì lấy số báo danh, không để trống.
    expect(dongTenEm([{ sbd: '100001', hoTen: '' }])).toBe('100001')
  })

  it('10. ca CHƯA công bố điểm → không chấm đỏ, không nút "Tick hết câu em làm sai"', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/ExamTakeScreen.tsx'), 'utf8')
    const truot = readFileSync(resolve(__dirname, '../src/components/TamTruotHoiBai.tsx'), 'utf8')

    // LỚP 1 — DỮ LIỆU. Chỉ khi máy em có `keyBank` (ca cho xem điểm) mới dựng
    // được thẻ đầy đủ; nhánh còn lại điền `dapAnDung: ''` và lời giải rỗng, tức
    // là KHÔNG CÓ đáp án nào để lộ, chứ không phải giấu đi.
    const khoi = man.slice(man.indexOf('const cauHoiBai'), man.indexOf('const guiHoiBai'))
    expect(khoi).toContain('if (keyBank) {')
    expect(khoi).toContain("dapAnDung: ''")
    expect(khoi).toContain("chot: ''")
    expect(khoi).toContain('lyDo: null')
    expect(khoi).toContain('buoc: null')

    // LỚP 2 — TẤM TRƯỢT. Truyền `anLoiGiai` khi chưa công bố, và nút chọn nhanh
    // chỉ dựng khi đã công bố. Hai lớp, vì lộ đáp án sớm là hỏng cả ca thi chứ
    // không phải một lỗi giao diện.
    expect(truot).toContain('anLoiGiai={!daCongBo}')
    expect(truot).toContain('daCongBo ? cau.filter(')

    // LỚP 3 — THẺ CÂU. `anLoiGiai` CẮT khỏi phần dựng, không giấu bằng CSS.
    const the = readFileSync(resolve(__dirname, '../src/components/TheCauChiTiet.tsx'), 'utf8')
    expect(the).toContain('const laDung = !anLoiGiai && k === c.dapAnDung')
    expect(the).toContain('const coGiai = !anLoiGiai && (c.chot || c.lyDo || c.buoc)')
    expect(the).not.toContain('display: none')
  })

  it('11. trang tổng hợp dùng đúng CSS_PHIEU/JS_PHIEU, KHÔNG có khối <style> tự chế', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const nguyen = readFileSync(resolve(__dirname, '../src/lib/hoi-bai.ts'), 'utf8')
    // Bỏ chú thích trước khi quét: chính dòng chú thích nói "không thêm khối
    // <style> tự chế" cũng chứa chuỗi đó, quét cả chú thích là tự bắt mình.
    const lib = nguyen.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    // Không tự viết style hay script — tất cả đi qua taiLieuHtml của html-phieu.
    expect(lib).not.toContain('<style')
    expect(lib).not.toContain('CSS_PHIEU')
    expect(lib).toContain("from './html-phieu'")

    const html = dungTrangTongHop({ tenCa: 'Ca thu', lop: '12A2', ngay: new Date('2026-09-05') }, [dong('1', 'A', ['q1'])], DE)
    // Đúng MỘT khối style, và nó là của html-phieu (chứa lớp .q-card).
    expect(html.match(/<style>/g)).toHaveLength(1)
    expect(html).toContain('.q-card')
    expect(html).toContain('<!DOCTYPE html>')
    // Thẻ câu dựng bằng theCauHtml, không phải mã chép lại.
    expect(html).toContain('class="q-card"')
  })

  it('12. không em nào hỏi → KHÔNG dựng trang rỗng', () => {
    expect(dungTrangTongHop({ tenCa: 'Ca thu', lop: '', ngay: new Date() }, [], DE)).toBe('')
    // Em có gửi nhưng qid không còn trong đề (thầy đổi đề) → cũng không dựng.
    expect(dungTrangTongHop({ tenCa: 'Ca thu', lop: '', ngay: new Date() }, [dong('1', 'A', ['q-cu'])], DE)).toBe('')
  })
})

// ---------------------------------------------------------------------------

describe('Hai lệnh của thầy', () => {
  it('danhSachCauHoi KHÔNG kèm mã bí mật → Sai mã bí mật', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'danhSachCauHoi', maCa: 'CA1' })).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    expect(m.goi({ action: 'danhSachCauHoi', maCa: 'CA1', secret: 'sai-be-bet' })).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    expect(m.goi({ action: 'danhDauDaChua', maCa: 'CA1' })).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
  })

  it('danhSachCauHoi trả đúng dòng của ca, kèm họ tên lấy từ LuotThi', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q1', 'q2'], ghiChu: 'em vướng bước quy đổi' })
    const r = m.goi({ action: 'danhSachCauHoi', maCa: 'CA1', secret: 'MA-THAT' })
    expect(r.ok).toBe(true)
    expect(r.items).toHaveLength(1)
    expect(r.items[0]).toMatchObject({ sbd: '100001', hoTen: 'Nguyen Van A', qids: ['q1', 'q2'], ghiChu: 'em vướng bước quy đổi', daChua: false })
  })

  it('danhDauDaChua đóng dòng nhưng KHÔNG xoá — lần sau còn tra lại được', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q1'] })
    const r = m.goi({ action: 'danhDauDaChua', maCa: 'CA1', secret: 'MA-THAT' })
    expect(r.soDong).toBe(1)
    expect(m.bang.CauHoiEm).toHaveLength(2) // dòng vẫn còn
    const ds = m.goi({ action: 'danhSachCauHoi', maCa: 'CA1', secret: 'MA-THAT' })
    expect(ds.items[0].daChua).toBe(true)
    expect(ds.items[0].qids).toEqual(['q1']) // nội dung giữ nguyên
  })
})

// ---------------------------------------------------------------------------

describe('Điều cấm mục 9', () => {
  it('cấm CHẶN CỨNG khi em tick nhiều câu — chỉ NHẮC', () => {
    expect(loiNhacTickNhieu(2, 28)).toBe('')
    expect(loiNhacTickNhieu(20, 28)).toContain('20/28')
    expect(loiNhacTickNhieu(28, 28)).toContain('28/28')
    // Đúng ngưỡng thì chưa nhắc.
    expect(loiNhacTickNhieu(Math.floor(10 * TI_LE_NHAC_NHIEU), 10)).toBe('')

    // Và nút Gửi chỉ tắt khi CHƯA tick câu nào, không tắt vì tick nhiều.
    expect(goiCauHoi('CA1', '1', DE.map((c) => c.id), '').qids).toHaveLength(3)
  })

  it('cấm đẻ nhiều dòng cho một em một ca — khoá theo (maCa, sbd)', () => {
    const m = dungMayChu(bangCoBan())
    for (let i = 0; i < 5; i++) m.goi({ action: 'guiCauHoi', maCa: 'CA1', sbd: '100001', qids: ['q1'] })
    expect(m.bang.CauHoiEm).toHaveLength(2)
    expect(String(m.bang.CauHoiEm[1][0])).toBe('CA1|100001')
  })

  it('cấm máy tự sinh lời giải — trang in đúng những gì kho đề có', () => {
    const thieu: CauLuyen = { ...cau('q1', 'Câu thiếu lời giải'), buoc: null, chot: '', ketQua: '' }
    const html = dungTrangTongHop({ tenCa: 'Ca thu', lop: '', ngay: new Date() }, [dong('1', 'A', ['q1'])], [thieu])
    expect(html).toContain('Câu thiếu lời giải')
    // Không có chữ nào bịa thêm vào chỗ lời giải trống.
    expect(html).not.toContain('Bước một')
  })

  it('cấm để câu hỏi lọt vào bảng điểm hay báo cáo phụ huynh', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    for (const f of ['src/lib/bang-diem-xlsx.ts', 'src/lib/phieu-du-lieu.ts', 'src/lib/chi-tiet-cau.ts']) {
      let n = ''
      try {
        n = readFileSync(resolve(__dirname, '..', f), 'utf8')
      } catch {
        continue
      }
      expect(n, f).not.toContain('hoi-bai')
      expect(n, f).not.toContain('CauHoiEm')
    }
    // Và lệnh hỏi bài không đụng vào các sheet chấm.
    const i = gsCode.indexOf("action === 'guiCauHoi'")
    const than = gsCode.slice(i, gsCode.indexOf("action === 'danhSachCauHoi'"))
    expect(than).not.toContain('SHEET_TIENDO')
    expect(than).not.toContain('ghiTienDo_')
    expect(than).not.toContain('SHEET_PHIEU')
  })
})

// ---------------------------------------------------------------------------

describe('Đếm cho thẻ ở Chi tiết ca', () => {
  it('"4 em hỏi · 11 câu" đếm CÂU KHÁC NHAU, không cộng dồn trùng', () => {
    const d = demCauHoi([dong('1', 'A', ['q1', 'q2']), dong('2', 'B', ['q1']), dong('3', 'C', ['q3'])])
    expect(d).toEqual({ soEm: 3, soCau: 3, chuaChua: 3 })
  })

  it('đếm riêng số em CHƯA chữa để hiện badge đỏ', () => {
    const d = demCauHoi([dong('1', 'A', ['q1']), { ...dong('2', 'B', ['q2']), daChua: true }])
    expect(d.chuaChua).toBe(1)
  })
})
