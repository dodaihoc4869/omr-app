// CÂU KHẮC PHỤC RÚT TỪ KHO ĐỀ — thầy chốt 06/09.
//
// Đây là lệnh CÔNG KHAI DUY NHẤT trả về đề CÓ ĐÁP ÁN VÀ LỜI GIẢI. Kho đề là
// tài sản của thầy, nên bộ kiểm này dựng đúng kịch bản kẻ lạ biết số báo danh
// rồi đòi máy chủ TỪ CHỐI, y như đã làm với `lichSuEm`.
//
// Chạy đúng file `.gs` sẽ dán lên Google, không viết lại logic trong test.
import { describe, expect, it } from 'vitest'
import gsCode from '../docs/apps-script-kiem-tra.gs?raw'

interface Bang {
  [ten: string]: unknown[][]
}

interface KhoCau {
  phan: 'I' | 'II' | 'III'
  so: number
  de: string
  pa?: Record<string, string>
  dap_an: string
  chuyen_de?: string
  muc_do?: string
  can_chua?: { sao: number; dk: string[]; ly_do: string; bay: null }
  loi_giai?: { chot?: string; trang_thai?: string } | null
  hinh?: { tep: string; vi_tri: string; du_lieu: string }[] | null
}

function dungMayChu(bang: Bang, kho: Record<string, KhoCau[]>) {
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
  // Drive trong bộ nhớ — `luuJsonLon_` / `docJsonLon_` chạy thật trên nó.
  const tep: Record<string, string> = {}
  let dem = 0
  const lamTep = (id: string) => ({
    getId: () => id,
    setContent: (s: string) => {
      tep[id] = s
    },
    getBlob: () => ({ getDataAsString: () => tep[id] }),
    setTrashed: () => {},
  })
  const thuMuc = { createFile: (ten: string, noiDung: string) => {
    const id = 'tep-' + ++dem + '-' + ten
    tep[id] = noiDung
    return lamTep(id)
  } }

  // Nạp kho đề vào sheet NganHangDe + Drive giả, đúng dạng `luuDe` ghi ra.
  // Phải nạp TRƯỚC khi dựng sheet, kẻo `getSheet_` thấy thiếu sheet rồi tự
  // chèn sheet rỗng và xoá sạch kho vừa nạp.
  const DE_H = ['MaDe', 'Nguon', 'NgayNap', 'SoCau', 'SoNghi', 'DeJson', 'CapNhatLuc', 'Nhom']
  bang.NganHangDe = [DE_H]
  for (const maDe of Object.keys(kho)) {
    const id = 'de-' + maDe
    tep[id] = JSON.stringify({ ma_de: maDe, nguon: 'thu ' + maDe, cau: kho[maDe] })
    bang.NganHangDe.push([maDe, 'thu ' + maDe, '2026-09-01', kho[maDe].length, 0, 'drive:' + id, '2026-09-01T00:00:00Z', '12'])
  }
  for (const ten of Object.keys(bang)) sheets[ten] = lamSheet(ten)

  const props: Record<string, string> = { MA_BI_MAT: 'MA-THAT', SPREADSHEET_ID: 'id-thu' }
  let soLanMoDe = 0

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
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => props[k] ?? '',
        setProperty: (k: string, v: string) => {
          props[k] = v
        },
        deleteProperty: (k: string) => {
          delete props[k]
        },
      }),
    },
    DriveApp: {
      getFoldersByName: () => ({ hasNext: () => true, next: () => thuMuc }),
      createFolder: () => thuMuc,
      getFileById: (id: string) => {
        if (tep[id] === undefined) throw new Error('không có tệp ' + id)
        if (id.indexOf('de-') === 0) soLanMoDe++
        return lamTep(id)
      },
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
    props,
    soLanMoDe: () => soLanMoDe,
    datLaiDem: () => {
      soLanMoDe = 0
    },
    goi: (body: unknown) => JSON.parse(chay.doPost({ postData: { contents: JSON.stringify(body) } })),
  }
}

const LUOT_H = ['MaCa', 'SBD', 'LanThu', 'IdThietBi', 'VaoLuc', 'HetGioLuc', 'NopLuc', 'TrangThai', 'DapAnJson', 'SoLanRoiMan', 'TongGiayRoiMan', 'IntegrityJson', 'HoTen', 'DiemI', 'DiemII', 'DiemIII', 'Tong', 'DuyetBoi', 'DuyetLuc', 'GhiChu', 'CapNhatLuc', 'GiayCauJson']

function luot(maCa: string, sbd: string, idTb: string, trangThai = 'da_nop'): unknown[] {
  const h = new Array(LUOT_H.length).fill('')
  h[0] = maCa
  h[1] = sbd
  h[2] = 1
  h[3] = idTb
  h[6] = '2026-09-01T02:00:00Z'
  h[7] = trangThai
  h[16] = 7
  return h
}

const MAY_EM = 'may-cua-em-1234'
const MAY_LA = 'may-cua-nguoi-la'

function cau(phan: 'I' | 'II' | 'III', so: number, chuyenDe: string, sao = 0, them: Partial<KhoCau> = {}): KhoCau {
  return {
    phan,
    so,
    de: `Câu ${phan}-${so} của ${chuyenDe}`,
    pa: { A: 'a', B: 'b', C: 'c', D: 'd' },
    dap_an: 'A',
    chuyen_de: chuyenDe,
    muc_do: 'hieu',
    can_chua: { sao, dk: ['nen'], ly_do: 'thử', bay: null },
    loi_giai: { chot: 'Chốt thử.' },
    ...them,
  }
}

const ESTER = 'Ester – lipid'
const CARB = 'Carbohydrate'

function khoThu(): Record<string, KhoCau[]> {
  return {
    'DE-A': [cau('I', 1, ESTER, 2), cau('I', 2, ESTER, 1), cau('I', 3, CARB, 2), cau('III', 4, ESTER, 0)],
    'DE-B': [cau('I', 1, ESTER, 2), cau('I', 2, CARB, 1), cau('I', 3, 'Polymer', 2)],
  }
}

function bangCoBan(): Bang {
  return { LuotThi: [LUOT_H, luot('CA1', '100001', MAY_EM), luot('CA1', '100002', 'may-ban-khac')] }
}

const xin = (o: Record<string, unknown>) => ({
  action: 'cauKhacPhuc',
  maCa: 'CA1',
  sbd: '100001',
  idThietBi: MAY_EM,
  chuyenDe: [ESTER, CARB],
  loaiTru: [],
  soCau: 60,
  ...o,
})

describe('Hai lớp khoá — kho đề không được rời máy thầy vì một số báo danh', () => {
  it('SAI MÁY thì từ chối, dù đúng mã ca và đúng số báo danh', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const r = m.goi(xin({ idThietBi: MAY_LA }))
    expect(r.ok).toBe(false)
    expect(r.items).toBeUndefined()
  })

  it('CHƯA NỘP BÀI thì từ chối, dù đúng máy', () => {
    const b = bangCoBan()
    b.LuotThi[1] = luot('CA1', '100001', MAY_EM, 'dang_lam')
    const m = dungMayChu(b, khoThu())
    expect(m.goi(xin({})).ok).toBe(false)
  })

  it('SỐ BÁO DANH CỦA BẠN KHÁC trên máy mình thì từ chối', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    expect(m.goi(xin({ sbd: '100002' })).ok).toBe(false)
  })

  it('thiếu mã ca / số báo danh / mã máy thì từ chối', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    for (const thieu of [{ maCa: '' }, { sbd: '' }, { idThietBi: '' }]) {
      expect(m.goi(xin(thieu)).ok).toBe(false)
    }
  })

  it('ĐÚNG MÁY vừa ngồi thi thì trả câu, kèm đủ lời giải để em tự đối chiếu', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const r = m.goi(xin({}))
    expect(r.ok).toBe(true)
    expect(r.soCau).toBeGreaterThan(0)
    const moiCau = r.items.flatMap((it: { cau: KhoCau[] }) => it.cau)
    expect(moiCau.every((c: KhoCau) => c.loi_giai && c.loi_giai.chot)).toBe(true)
    expect(moiCau.every((c: KhoCau) => c.dap_an)).toBe(true)
  })
})

describe('Chọn đúng câu cần luyện', () => {
  it('CHỈ chuyên đề em vừa mất điểm, không rút bừa cả kho', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const r = m.goi(xin({ chuyenDe: [ESTER] }))
    const moiCau = r.items.flatMap((it: { cau: KhoCau[] }) => it.cau)
    expect(moiCau.length).toBeGreaterThan(0)
    expect(moiCau.every((c: KhoCau) => c.chuyen_de === ESTER)).toBe(true)
  })

  it('BỎ HẲN câu em vừa làm trong ca — đây là yêu cầu của thầy', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const daLam = ['DE-A-I-1', 'DE-A-I-2', 'DE-B-I-1']
    const r = m.goi(xin({ chuyenDe: [ESTER], loaiTru: daLam }))
    const qids = r.items.flatMap((it: { ma_de: string; cau: KhoCau[] }) => it.cau.map((c) => `${it.ma_de}-${c.phan}-${c.so}`))
    for (const q of daLam) expect(qids).not.toContain(q)
  })

  it('CHUYÊN ĐỀ YẾU NHẤT đứng trước — thầy gửi danh sách đã xếp hạng', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const r = m.goi(xin({ chuyenDe: [CARB, ESTER], soCau: 2 }))
    const moiCau = r.items.flatMap((it: { cau: KhoCau[] }) => it.cau)
    expect(moiCau.every((c: KhoCau) => c.chuyen_de === CARB)).toBe(true)
  })

  it('CÂU 2 SAO trước câu 0 sao trong cùng chuyên đề', () => {
    const kho = {
      'DE-A': [cau('I', 1, ESTER, 0), cau('I', 2, ESTER, 2)],
    }
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER], soCau: 1 }))
    expect(r.items[0].cau[0].so).toBe(2)
  })

  it('KHÔNG đẩy câu đang nghi đáp án sai hay thiếu đáp án', () => {
    const kho = {
      'DE-A': [
        cau('I', 1, ESTER, 2, { loi_giai: { chot: 'x', trang_thai: 'nghi_dap_an_sai' } }),
        cau('I', 2, ESTER, 2, { loi_giai: { chot: 'x', trang_thai: 'thieu_dap_an' } }),
        cau('I', 3, ESTER, 0),
      ],
    }
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER] }))
    const so = r.items.flatMap((it: { cau: KhoCau[] }) => it.cau).map((c: KhoCau) => c.so)
    expect(so).toEqual([3])
  })

  it('KHÔNG đẩy câu chưa có lời giải — luyện xong không tự chữa được', () => {
    const kho = { 'DE-A': [cau('I', 1, ESTER, 2, { loi_giai: null }), cau('I', 2, ESTER, 0)] }
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER] }))
    expect(r.items.flatMap((it: { cau: KhoCau[] }) => it.cau).map((c: KhoCau) => c.so)).toEqual([2])
  })

  it('RẢI ĐỀU các đề, không dồn hết vào một bài', () => {
    const kho: Record<string, KhoCau[]> = {}
    for (const d of ['DE-A', 'DE-B', 'DE-C']) kho[d] = [1, 2, 3, 4, 5].map((i) => cau('I', i, ESTER, 1))
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER], soCau: 6 }))
    expect(r.soCau).toBe(6)
    // Sáu câu thì mỗi đề đúng hai câu.
    for (const it of r.items) expect(it.cau).toHaveLength(2)
  })

  it('CÂU NẰM Ở NHIỀU ĐỀ HƠN TRẦN vẫn trả ĐỦ số câu xin — lỗi thanh kéo dừng ở 36', () => {
    // Bản trước rải đều qua CẢ MƯỜI HAI đề rồi khâu đọc file mới cắt còn 8, nên
    // 60 câu chia mỗi đề 5 câu thì mất hơn một phần ba. Thầy thấy thanh kéo
    // dừng ở 36 thay vì 60.
    const kho: Record<string, KhoCau[]> = {}
    for (let d = 1; d <= 12; d++) {
      kho['DE-' + d] = []
      for (let i = 1; i <= 10; i++) kho['DE-' + d].push(cau('I', i, ESTER, 1))
    }
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER], soCau: 60 }))
    expect(r.soCau).toBe(60)
    expect(r.soChon).toBe(60)
    // Và vẫn rải ra nhiều đề, không dồn hết vào một bài.
    expect(r.items.length).toBeGreaterThanOrEqual(3)
    expect(r.items.length).toBeLessThanOrEqual(6)
  })

  it('DỄ LÊN KHÓ trong cùng chuyên đề — đúng như màn báo cáo hứa với em', () => {
    const kho = {
      'DE-A': [
        cau('I', 1, ESTER, 2, { muc_do: 'van_dung' }),
        cau('I', 2, ESTER, 0, { muc_do: 'biet' }),
        cau('I', 3, ESTER, 1, { muc_do: 'hieu' }),
      ],
    }
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER], soCau: 3 }))
    expect(r.items[0].cau.map((c: KhoCau) => c.muc_do)).toEqual(['biet', 'hieu', 'van_dung'])
    // `thuTu` là hợp đồng thật: gói gom theo đề nên máy em phải xếp lại theo nó.
    expect(r.thuTu).toEqual(['DE-A-I-2', 'DE-A-I-3', 'DE-A-I-1'])
  })

  it('THỨ TỰ gửi kèm đủ mọi câu trả về, không thiếu không thừa', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const r = m.goi(xin({ chuyenDe: [ESTER, CARB] }))
    const qids = r.items.flatMap((it: { ma_de: string; cau: KhoCau[] }) => it.cau.map((c) => `${it.ma_de}-${c.phan}-${c.so}`))
    expect([...r.thuTu].sort()).toEqual([...qids].sort())
  })

  it('không có chuyên đề nào thì trả rỗng, KHÔNG rút bừa', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    const r = m.goi(xin({ chuyenDe: [] }))
    expect(r.ok).toBe(true)
    expect(r.soCau).toBe(0)
    expect(r.items).toEqual([])
  })
})

describe('Ba cái trần', () => {
  it('TRẦN 60 CÂU — xin nhiều hơn cũng chỉ được 60', () => {
    const kho: Record<string, KhoCau[]> = {}
    for (const d of ['DE-A', 'DE-B']) {
      kho[d] = []
      for (let i = 1; i <= 50; i++) kho[d].push(cau('I', i, ESTER, 1))
    }
    const m = dungMayChu(bangCoBan(), kho)
    expect(m.goi(xin({ chuyenDe: [ESTER], soCau: 500 })).soCau).toBe(60)
    // Xin ít hơn thì tôn trọng đúng con số em xin.
    expect(m.goi(xin({ chuyenDe: [ESTER], soCau: 12 })).soCau).toBe(12)
  })

  it('TRẦN DUNG LƯỢNG — câu ảnh nặng thì cắt bớt và NÓI RA', () => {
    const anhTo = 'data:image/png;base64,' + 'A'.repeat(900000)
    const kho: Record<string, KhoCau[]> = { 'DE-A': [] }
    for (let i = 1; i <= 10; i++) {
      kho['DE-A'].push(cau('I', i, ESTER, 1, { hinh: [{ tep: `I_${i}.png`, vi_tri: 'sau_de', du_lieu: anhTo }] }))
    }
    const m = dungMayChu(bangCoBan(), kho)
    const r = m.goi(xin({ chuyenDe: [ESTER], soCau: 10 }))
    expect(r.catBotViNang).toBe(true)
    expect(r.soCau).toBeLessThan(10)
    expect(r.soCau).toBeGreaterThan(0)
    // Nói rõ đã chọn bao nhiêu để màn báo cáo hiện đúng con số, không hứa suông.
    expect(r.soChon).toBe(10)
  })

  it('CÂU KHÔNG HÌNH xếp trước trong cùng bậc, để cùng hạn mức em được nhiều câu hơn', () => {
    const anh = 'data:image/png;base64,' + 'A'.repeat(100)
    const kho = {
      'DE-A': [cau('I', 1, ESTER, 1, { hinh: [{ tep: 'I_1.png', vi_tri: 'sau_de', du_lieu: anh }] }), cau('I', 2, ESTER, 1)],
    }
    const m = dungMayChu(bangCoBan(), kho)
    expect(m.goi(xin({ chuyenDe: [ESTER], soCau: 1 })).items[0].cau[0].so).toBe(2)
  })
})

describe('Chỉ mục câu — để em không phải chờ máy chủ mở cả kho', () => {
  it('lần gọi thứ hai KHÔNG mở lại file đề nào để dò chuyên đề', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    m.goi(xin({}))
    const lanDau = m.soLanMoDe()
    m.datLaiDem()
    m.goi(xin({}))
    // Lần sau chỉ mở đúng những đề CHỨA câu đã chọn, không mở cả kho để dò.
    expect(m.soLanMoDe()).toBeLessThan(lanDau)
    expect(m.props.CHI_MUC_CAU_REF).toBeTruthy()
  })

  it('ĐẨY ĐỀ MỚI thì mốc chỉ mục bị xoá, lần sau dựng lại', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    m.goi(xin({}))
    expect(m.props.CHI_MUC_CAU_DAU).toBeTruthy()
    m.goi({ action: 'luuDe', secret: 'MA-THAT', de: { ma_de: 'DE-C', cau: [cau('I', 1, ESTER, 1)] } })
    expect(m.props.CHI_MUC_CAU_DAU).toBeUndefined()
  })

  it('lệnh dựng chỉ mục CẦN MÃ BÍ MẬT — máy học sinh không gọi được', () => {
    const m = dungMayChu(bangCoBan(), khoThu())
    expect(m.goi({ action: 'dungChiMuc' }).ok).toBe(false)
    const r = m.goi({ action: 'dungChiMuc', secret: 'MA-THAT' })
    expect(r.ok).toBe(true)
    expect(r.soCau).toBe(7)
  })
})
