// GỬI ZALO NHANH NHẤT — thầy chốt 06/09: phiếu phải tự lưu, khỏi mở từng em.
//
// Hai lệnh gộp mới, cả hai đều nhắm vào cùng một chỗ tốn: mỗi lượt gọi Apps
// Script tốn sẵn chừng một giây rưỡi dựng máy, nên ba chục lượt cho ba chục em
// là ba chục lần trả giá đó.
//
//   · `hoSoNhieuEm`   — đọc ba bảng MỘT LẦN rồi tính cho cả danh sách.
//   · `luuNhieuPhieu` — cất cả gói, mở sheet một lần.
//
// Phép kiểm quan trọng nhất: `hoSoEm` cũ và `hoSoNhieuEm` mới phải ra SỐ Y HỆT
// nhau. Hai đường tính là sớm muộn cũng lệch, mà đây là số in vào phiếu gửi
// phụ huynh.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

interface Bang {
  [ten: string]: unknown[][]
}

function dungMayChu(bang: Bang) {
  const sheets: Record<string, unknown> = {}
  const doc: { ten: string; nr: number; nc: number }[] = []
  const tep: Record<string, string> = {}
  let dem = 0
  const lamSheet = (ten: string) => {
    const o = {
      getName: () => ten,
      getLastRow: () => (bang[ten] ? bang[ten].length : 0),
      getLastColumn: () => (bang[ten] && bang[ten][0] ? bang[ten][0].length : 0),
      getDataRange: () => o.getRange(1, 1, o.getLastRow(), o.getLastColumn()),
      getRange: (r: number, c: number, nr = 1, nc = 1) => {
        doc.push({ ten, nr, nc })
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
          setValues: (v: unknown[][]) => {
            for (let i = 0; i < v.length; i++) {
              while (bang[ten].length <= r - 1 + i) bang[ten].push([])
              for (let j = 0; j < v[i].length; j++) bang[ten][r - 1 + i][c - 1 + j] = v[i][j]
            }
          },
          setValue: (v: unknown) => {
            while (bang[ten].length <= r - 1) bang[ten].push([])
            bang[ten][r - 1][c - 1] = v
          },
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
  const lamTep = (id: string) => ({
    getId: () => id,
    setContent: (x: string) => {
      tep[id] = x
    },
    getBlob: () => ({ getDataAsString: () => tep[id] }),
    setTrashed: () => {},
  })
  const thuMuc = {
    createFile: (t: string, noiDung: string) => {
      const id = 'tep-' + ++dem
      tep[id] = noiDung
      return lamTep(id)
    },
  }
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
    ContentService: { createTextOutput: (x: string) => ({ setMimeType: () => x }), MimeType: { JSON: 'json' } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => (k === 'MA_BI_MAT' ? 'MA-THAT' : k === 'SPREADSHEET_ID' ? 'id-thu' : ''), setProperty: () => {}, deleteProperty: () => {} }) },
    DriveApp: {
      getFoldersByName: () => ({ hasNext: () => true, next: () => thuMuc }),
      createFolder: () => thuMuc,
      getFileById: (id: string) => lamTep(id),
    },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} },
    MimeType: { PLAIN_TEXT: 'text/plain' },
  }
  const ten = Object.keys(moi)
  const gia = ten.map((k) => (moi as Record<string, unknown>)[k])
  const chay = new Function(...ten, `${gsCode}\nreturn { doPost: doPost }`)(...gia) as {
    doPost: (e: { postData: { contents: string } }) => string
  }
  return {
    bang,
    doc,
    xoaVet: () => doc.splice(0, doc.length),
    goi: (body: unknown) => JSON.parse(chay.doPost({ postData: { contents: JSON.stringify(body) } })),
  }
}

const LUOT_H = ['MaCa', 'SBD', 'LanThu', 'IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson', 'HoTen', 'DiemI', 'DiemII', 'DiemIII', 'Tong', 'DuyetBoi', 'DuyetLuc', 'GhiChu', 'CapNhatLuc', 'GiayCauJson']
const CA_H = ['MaCa', 'Lop', 'ThoiGianPhut', 'MoLuc', 'BankJson', 'ImmediateFeedback', 'KeyBankJson', 'BatDau', 'HetHanVao', 'TrangThai', 'TenCa']
const TIENDO_H = ['SBD', 'MaCa', 'ChuyenDe', 'SoCau', 'SoSai', 'NopLuc']
const HS_H = ['SBD', 'HoTen', 'NamSinh', 'Lop', 'DangKyLuc']
const PHIEU_H = ['Ma', 'MaCa', 'SBD', 'HoTen', 'PhieuRef', 'TaoLuc', 'SoLanXem', 'XemLanCuoi', 'Loai']

function luot(maCa: string, sbd: string, tong: number, nopLuc: string): unknown[] {
  const h = new Array(LUOT_H.length).fill('')
  h[0] = maCa
  h[1] = sbd
  h[2] = 1
  h[6] = nopLuc
  h[7] = 'da_nop'
  h[12] = 'Em ' + sbd
  h[16] = tong
  return h
}

function bangCoBan(): Bang {
  return {
    LuotThi: [LUOT_H, luot('CA1', '1', 8, '2026-09-01T02:00:00Z'), luot('CA1', '2', 5, '2026-09-01T02:00:00Z'), luot('CA2', '1', 6, '2026-09-05T02:00:00Z')],
    CaKiemTra: [CA_H, ['CA1', '12A1', 45, '', '', '', '', '', '', 'dong', 'Ester lần 1'], ['CA2', '12A1', 45, '', '', '', '', '', '', 'dong', 'Amine']],
    TienDoCa: [
      TIENDO_H,
      ['1', 'CA1', 'Ester – lipid', 10, 2, '2026-09-01T02:00:00Z'],
      ['1', 'CA2', 'Carbohydrate', 10, 6, '2026-09-05T02:00:00Z'],
      ['2', 'CA1', 'Ester – lipid', 10, 7, '2026-09-01T02:00:00Z'],
    ],
    HocSinh: [HS_H, ['1', 'Nguyễn Văn A', '2008', '12A1', ''], ['2', 'Trần Thị B', '2008', '12A1', '']],
    PhieuKetQua: [PHIEU_H],
  }
}

describe('Hồ sơ nhiều em một lượt', () => {
  it('KHÔNG có mã bí mật thì từ chối — nó trả hồ sơ nhiều em cùng lúc', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'hoSoNhieuEm', sbd: ['1'] }).ok).toBe(false)
    expect(m.goi({ action: 'hoSoNhieuEm', secret: 'sai', sbd: ['1'] }).ok).toBe(false)
  })

  it('RA SỐ Y HỆT `hoSoEm` từng em — đây là phép kiểm quan trọng nhất', () => {
    const m = dungMayChu(bangCoBan())
    const goi1 = m.goi({ action: 'hoSoEm', secret: 'MA-THAT', sbd: '1' })
    const goi2 = m.goi({ action: 'hoSoEm', secret: 'MA-THAT', sbd: '2' })
    const gop = m.goi({ action: 'hoSoNhieuEm', secret: 'MA-THAT', sbd: ['1', '2'] })
    expect(gop.ok).toBe(true)
    expect(gop.items).toHaveLength(2)
    for (const [rieng, chung] of [
      [goi1, gop.items[0]],
      [goi2, gop.items[1]],
    ]) {
      expect(chung.em).toEqual(rieng.em)
      expect(chung.chuyenDe).toEqual(rieng.chuyenDe)
      expect(chung.ca).toEqual(rieng.ca)
      expect(chung.caGanNhat).toEqual(rieng.caGanNhat)
      expect(chung.chuyenDeCaGanNhat).toEqual(rieng.chuyenDeCaGanNhat)
      expect(chung.soCauSaiCaGanNhat).toEqual(rieng.soCauSaiCaGanNhat)
    }
  })

  it('số liệu đúng: hạng trong ca, chuyên đề yếu nhất trước', () => {
    const m = dungMayChu(bangCoBan())
    const r = m.goi({ action: 'hoSoNhieuEm', secret: 'MA-THAT', sbd: ['1'] })
    const h = r.items[0]
    expect(h.em.hoTen).toBe('Nguyễn Văn A')
    // Ca gần nhất là CA2 (nộp sau), 6 điểm.
    expect(h.caGanNhat.maCa).toBe('CA2')
    expect(h.caGanNhat.tong).toBe(6)
    // CA1: 8 điểm, cao nhất trong hai em -> hạng 1/2.
    const ca1 = h.ca.find((c: { maCa: string }) => c.maCa === 'CA1')
    expect(ca1.hang).toBe(1)
    expect(ca1.siSo).toBe(2)
    // Carbohydrate sai 6/10 đứng trước Ester sai 2/10.
    expect(h.chuyenDe[0].ten).toBe('Carbohydrate')
  })

  it('ĐỌC BẢNG MỘT LẦN — gọi 2 em không tốn gấp đôi lượt đọc', () => {
    const m = dungMayChu(bangCoBan())
    m.xoaVet()
    m.goi({ action: 'hoSoNhieuEm', secret: 'MA-THAT', sbd: ['1', '2'] })
    const mot = m.doc.filter((x) => x.ten === 'TienDoCa').length
    m.xoaVet()
    m.goi({ action: 'hoSoNhieuEm', secret: 'MA-THAT', sbd: ['1'] })
    const haiEmItHon = m.doc.filter((x) => x.ten === 'TienDoCa').length
    // Đọc TienDoCa đúng một lần dù xin bao nhiêu em.
    expect(mot).toBe(haiEmItHon)
  })

  it('danh sách rỗng trả rỗng, quá trần thì từ chối', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'hoSoNhieuEm', secret: 'MA-THAT', sbd: [] }).items).toEqual([])
    const nhieu = Array.from({ length: 61 }, (_, i) => String(i))
    expect(m.goi({ action: 'hoSoNhieuEm', secret: 'MA-THAT', sbd: nhieu }).ok).toBe(false)
  })
})

describe('Lưu nhiều phiếu một gói', () => {
  const goiPhieu = (ma: string, sbd: string) => ({ ma, maCa: 'CA1', sbd, hoTen: 'Em ' + sbd, phieu: { v: 1, sbd }, loai: 'ketqua' })

  it('KHÔNG có mã bí mật thì từ chối', () => {
    const m = dungMayChu(bangCoBan())
    expect(m.goi({ action: 'luuNhieuPhieu', items: [goiPhieu('ma-nhat-01', '1')] }).ok).toBe(false)
  })

  it('cất đủ cả gói, mỗi em một dòng', () => {
    const b = bangCoBan()
    const m = dungMayChu(b)
    const r = m.goi({ action: 'luuNhieuPhieu', secret: 'MA-THAT', items: [goiPhieu('ma-nhat-01', '1'), goiPhieu('ma-nhat-02', '2')] })
    expect(r.ok).toBe(true)
    expect(r.daLuu.map((x: { sbd: string }) => x.sbd)).toEqual(['1', '2'])
    expect(r.loi).toEqual([])
    expect(b.PhieuKetQua).toHaveLength(3)
  })

  it('cất lại cùng mã thì GHI ĐÈ, không đẻ thêm dòng', () => {
    const b = bangCoBan()
    const m = dungMayChu(b)
    m.goi({ action: 'luuNhieuPhieu', secret: 'MA-THAT', items: [goiPhieu('ma-nhat-01', '1')] })
    m.goi({ action: 'luuNhieuPhieu', secret: 'MA-THAT', items: [goiPhieu('ma-nhat-01', '1')] })
    expect(b.PhieuKetQua).toHaveLength(2)
  })

  it('MỘT EM HỎNG KHÔNG KÉO CẢ CA — em còn lại vẫn có phiếu', () => {
    const b = bangCoBan()
    const m = dungMayChu(b)
    const r = m.goi({
      action: 'luuNhieuPhieu',
      secret: 'MA-THAT',
      items: [{ ma: 'ngan', maCa: 'CA1', sbd: '1', hoTen: 'A', phieu: { v: 1 } }, goiPhieu('ma-nhat-02', '2')],
    })
    expect(r.ok).toBe(true)
    expect(r.daLuu.map((x: { sbd: string }) => x.sbd)).toEqual(['2'])
    expect(r.loi.map((x: { sbd: string }) => x.sbd)).toEqual(['1'])
  })

  it('gói quá trần thì từ chối, không cất nửa vời', () => {
    const b = bangCoBan()
    const m = dungMayChu(b)
    const nhieu = Array.from({ length: 7 }, (_, i) => goiPhieu('ma-nhat-1' + i, String(i)))
    expect(m.goi({ action: 'luuNhieuPhieu', secret: 'MA-THAT', items: nhieu }).ok).toBe(false)
    expect(b.PhieuKetQua).toHaveLength(1)
  })

  it('phiếu cất bằng gói ĐỌC LẠI ĐƯỢC bằng lệnh layPhieu cũ', () => {
    const m = dungMayChu(bangCoBan())
    m.goi({ action: 'luuNhieuPhieu', secret: 'MA-THAT', items: [goiPhieu('ma-nhat-01', '1')] })
    const r = m.goi({ action: 'layPhieu', ma: 'ma-nhat-01' })
    expect(r.ok).toBe(true)
    expect(r.phieu.sbd).toBe('1')
  })
})

describe('Màn Chi tiết ca dựng nốt phiếu còn thiếu', () => {
  it('nút copy link tự tạo phiếu, dùng hai lệnh GỘP chứ không gọi từng em', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/ExamMonitorScreen.tsx'), 'utf8')
    expect(man).toContain('taoPhieuChoEm(')
    // 06/09: lõi dựng phiếu chuyển sang `phieu-ca-ca.ts` để dùng chung với cầu
    // nối `window.__ddh`. Hai lệnh gộp vẫn phải là hai lệnh gộp — chỉ đổi nhà.
    const loi = readFileSync(resolve(__dirname, '../src/lib/phieu-ca-ca.ts'), 'utf8')
    expect(loi).toContain('hoSoNhieuEm(url, mat, dsSbd)')
    expect(loi).toContain('luuNhieuPhieu(url, mat, canLuu)')
    // Cấm gọi hồ sơ từng em trong vòng dựng phiếu cả ca.
    const dau = loi.indexOf('export async function dungPhieuChoEm')
    const cuoi = loi.indexOf('export async function gomCa')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const ham = loi.slice(dau, cuoi)
    expect(ham).not.toContain('hoSoEm(')
    expect(ham).not.toContain('luuPhieu(')
    // Và màn hình KHÔNG được giữ bản chép thứ hai.
    expect(man).not.toContain('luuNhieuPhieu(')
  })

  it('KHÔNG hỏi lại máy chủ danh sách phiếu sau khi vừa tạo', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const man = readFileSync(resolve(__dirname, '../src/screens/ExamMonitorScreen.tsx'), 'utf8')
    const dau = man.indexOf('const handleCopyLinkPhieu')
    const cuoi = man.indexOf('const handleExportJson')
    expect(dau).toBeGreaterThan(0)
    expect(cuoi).toBeGreaterThan(dau)
    const ham = man.slice(dau, cuoi)
    // Đúng MỘT lượt `phieuTheoCa` cho cả nút.
    expect(ham.split('phieuTheoCa(').length - 1).toBe(1)
  })
})
