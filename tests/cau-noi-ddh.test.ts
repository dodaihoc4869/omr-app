// CẦU NỐI `window.__ddh` — APP-CAN-MO-DUONG-CHO-COWORK.md mục 6.
//
// Bảy tiêu chí nghiệm thu của đặc tả; sáu tiêu chí thuộc ĐỀ NGHỊ A (cầu nối)
// nằm ở đây. Tiêu chí 5 kiểm lệnh `goiZaloCa` của ĐỀ NGHỊ B — thầy chốt
// 06/09 chỉ làm A trước, nên B chưa có và tiêu chí 5 chưa chạy được.
//
// Tiêu chí quan trọng nhất là số 3: quét chuỗi, đòi cầu nối KHÔNG chứa mã bí
// mật ở bất kỳ đâu. Cầu nối đọc mã ngay trước mỗi lượt gọi rồi vứt, nên không
// có chỗ nào giữ lại được.
import { describe, expect, it, beforeEach, vi } from 'vitest'

const MA_BI_MAT = 'MA-BI-MAT-CUC-KY-RIENG-9x7'
const URL_MAY_CHU = 'https://script.google.com/macros/s/abc/exec'

// Cửa vào duy nhất tới mã bí mật trong app thật. Giả lập đúng hành vi của nó:
// `coMaBiMatPhien()` false + `loadTeacherSecret()` rỗng = app đang khoá.
let daMoKhoa = false
let maTrongDia = ''

vi.mock('../src/lib/exam-db', () => ({
  coMaBiMatPhien: () => daMoKhoa,
  loadTeacherSecret: async () => (daMoKhoa ? MA_BI_MAT : maTrongDia),
  loadScriptUrl: async () => URL_MAY_CHU,
  // `phieu-ca-ca` nhập từ cùng module này; giả lập cho đủ, không dùng tới.
  docSoCauCa: async () => undefined,
  loadExamSources: async () => [],
  loadSessionTeacherBank: async () => null,
  luuSoCauCa: async () => {},
  saveSessionTeacherBank: async () => {},
}))

const goi: { ten: string; url: string; mat: string; them: unknown[] }[] = []
vi.mock('../src/lib/exam-api', async () => {
  const that = await vi.importActual<typeof import('../src/lib/exam-api')>('../src/lib/exam-api')
  const ghi = (ten: string) => (url: string, mat: string, ...them: unknown[]) => {
    goi.push({ ten, url, mat, them })
    return Promise.resolve([])
  }
  return {
    ...that,
    danhSachCa: (url: string, mat: string, ...them: unknown[]) => {
      goi.push({ ten: 'danhSachCa', url, mat, them })
      return Promise.resolve(boDo.caTra)
    },
    danhSachEm: ghi('danhSachEm'),
    phieuTheoCa: ghi('phieuTheoCa'),
    chiTietCa: (url: string, mat: string, ...them: unknown[]) => {
      goi.push({ ten: 'chiTietCa', url, mat, them })
      return Promise.resolve({ ca: { maCa: 'CA1' }, luot: [] })
    },
  }
})

// Đồng bộ hàng loạt: đo THỨ TỰ và SỐ LƯỢT gọi, không gọi mạng thật.
//
// Đặt trong `vi.hoisted` vì `vi.mock` được nâng lên đầu tệp: nhà máy giả lập
// đọc mấy biến này, mà `let`/`const` thường thì lúc ấy chưa khởi tạo. Bộ kiểm
// `khong-dung-bien-truoc-khi-khai` bắt đúng chỗ đó.
const boDo = vi.hoisted(() => ({
  nhatKy: [] as string[],
  caTra: [] as { maCa: string; tenCa: string; trangThai: string }[],
  caHong: '',
}))
const nhatKy = boDo.nhatKy
vi.mock('../src/lib/exam-sync', () => ({
  dongBoNganHang: (_u: string, _m: string, ep?: boolean) => {
    nhatKy.push(`kho:${ep === true ? 'ep' : 'thuong'}`)
    return Promise.resolve({ moi: [], capNhat: [], giuNguyen: 0, loi: [], canXem: [], danhSach: [], caCapNhat: 0 })
  },
}))
vi.mock('../src/lib/phieu-ca-ca', () => ({
  // GHI CẢ LÚC BẮT ĐẦU VÀ LÚC XONG, và cố ý nhường một nhịp ở giữa.
  //
  // Bản đầu tôi chỉ ghi lúc bắt đầu rồi trả `Promise.resolve` ngay. Test "chạy
  // tuần tự" khi ấy KHÔNG đo được gì: đổi vòng lặp sang `Promise.all` vẫn xanh,
  // tôi đã phá mã để thử và nó lọt. Có nhịp `await` ở giữa thì chạy song song
  // sẽ đẩy mọi `bd:` lên trước mọi `xong:`, và test bắt được.
  taoPhieuCaCa: async (_u: string, _m: string, maCa: string, _g: string, _b: unknown, taoLai?: boolean) => {
    nhatKy.push(`bd:${maCa}:${taoLai === true ? 'taoLai' : 'giu'}`)
    await new Promise((r) => setTimeout(r, 0))
    nhatKy.push(`xong:${maCa}`)
    if (maCa === boDo.caHong) throw new Error('máy chủ từ chối')
    return { dong: [{ sbd: '1' }, { sbd: '2' }], soMoi: 2, loi: [] }
  },
}))

import { TEN_CAU_NOI, dungCauNoi, ganCauNoi, goCauNoi, type CauNoiDdh } from '../src/lib/cau-noi-ddh'

type CuaSo = { [TEN_CAU_NOI]?: CauNoiDdh }

beforeEach(() => {
  daMoKhoa = false
  maTrongDia = ''
  goi.length = 0
  nhatKy.length = 0
  boDo.caTra = []
  boDo.caHong = ''
  goCauNoi()
})

describe('Tiêu chí 1 + 7 — cầu nối chỉ sống khi app đang mở khoá', () => {
  it('chưa gắn thì window.__ddh KHÔNG tồn tại', () => {
    expect((window as CuaSo)[TEN_CAU_NOI]).toBeUndefined()
    expect(TEN_CAU_NOI).toBe('__ddh')
  })

  it('gắn rồi gỡ thì biến mất hẳn, không để lại vỏ rỗng', () => {
    ganCauNoi()
    expect((window as CuaSo)[TEN_CAU_NOI]).toBeDefined()
    goCauNoi()
    expect((window as CuaSo)[TEN_CAU_NOI]).toBeUndefined()
    expect(TEN_CAU_NOI in window).toBe(false)
  })

  it('CHƯA mở khoá thì sanSang() trả false', () => {
    ganCauNoi()
    expect((window as CuaSo)[TEN_CAU_NOI]!.sanSang()).toBe(false)
  })
})

describe('Tiêu chí 2 — mở khoá rồi thì gọi được lệnh cần quyền', () => {
  it('sanSang() trả true và lệnh đi kèm ĐÚNG mã bí mật trong bộ nhớ', async () => {
    daMoKhoa = true
    ganCauNoi()
    const cn = (window as CuaSo)[TEN_CAU_NOI]!
    expect(cn.sanSang()).toBe(true)
    await cn.danhSachCa()
    await cn.danhSachEm()
    await cn.phieuTheoCa('CA1')
    expect(goi.map((g) => g.ten)).toEqual(['danhSachCa', 'danhSachEm', 'phieuTheoCa'])
    for (const g of goi) {
      expect(g.url).toBe(URL_MAY_CHU)
      expect(g.mat).toBe(MA_BI_MAT)
    }
  })

  it('chiTietCa chuyển tiếp cả cờ xinKeyBank', async () => {
    daMoKhoa = true
    const cn = dungCauNoi()
    await cn.chiTietCa(' CA1 ', true)
    expect(goi[0].them[0]).toBe('CA1')
    expect(goi[0].them[1]).toBe(true)
  })

  it('app KHOÁ giữa chừng thì lượt gọi sau HỎNG, không chạy bằng chìa cũ', async () => {
    daMoKhoa = true
    const cn = dungCauNoi()
    await cn.danhSachCa()
    expect(goi).toHaveLength(1)
    // Thầy khoá app lại. Cầu nối chưa bị gỡ (React chưa kịp chạy hiệu ứng),
    // nhưng nó đọc mã bí mật MỖI LƯỢT nên vẫn phải hỏng ngay.
    daMoKhoa = false
    await expect(cn.danhSachCa()).rejects.toThrow(/khoá/i)
    expect(goi).toHaveLength(1)
  })

  it('máy CHƯA đặt mật khẩu vẫn dùng được — mã bí mật nằm chữ thường trên đĩa', async () => {
    daMoKhoa = false
    maTrongDia = MA_BI_MAT
    const cn = dungCauNoi()
    await cn.danhSachCa()
    expect(goi[0].mat).toBe(MA_BI_MAT)
  })
})

describe('Tiêu chí 3 — quét chuỗi, cầu nối KHÔNG chứa mã bí mật', () => {
  it('JSON.stringify và mọi thuộc tính đều sạch', async () => {
    daMoKhoa = true
    ganCauNoi()
    const cn = (window as CuaSo)[TEN_CAU_NOI]!
    // Gọi vài lệnh trước đã: nếu có chỗ nào lỡ đệm mã lại thì lúc này mới lộ.
    await cn.danhSachCa()
    await cn.phieuTheoCa('CA1')

    expect(JSON.stringify(cn) ?? '').not.toContain(MA_BI_MAT)
    const kho: string[] = []
    for (const k of Object.keys(cn)) {
      kho.push(k)
      kho.push(String((cn as unknown as Record<string, unknown>)[k]))
    }
    const tatCa = kho.join('\n')
    expect(tatCa).not.toContain(MA_BI_MAT)
    // Và không có thuộc tính nào TÊN là mã bí mật (đặc tả cấm `__ddh.secret`).
    for (const k of Object.keys(cn)) {
      expect(k.toLowerCase()).not.toMatch(/secret|mabimat|matkhau|password/)
    }
  })

  it('mọi thuộc tính công khai đều là HÀM — không có ô dữ liệu nào để rò', () => {
    daMoKhoa = true
    const cn = dungCauNoi()
    for (const k of Object.keys(cn)) {
      expect(typeof (cn as unknown as Record<string, unknown>)[k]).toBe('function')
    }
  })

  it('mã nguồn cầu nối KHÔNG có hàm nào trả thẳng mã bí mật ra ngoài', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const ma = readFileSync(resolve(__dirname, '../src/lib/cau-noi-ddh.ts'), 'utf8')
    const than = ma.slice(ma.indexOf('export function dungCauNoi'))
    // Trong thân đối tượng trả về, `mat` chỉ được dùng làm THAM SỐ gọi lệnh.
    expect(than).not.toMatch(/return\s+mat\b/)
    expect(than).not.toMatch(/\bmat\s*[,}]\s*$/m)
    expect(than).not.toContain('maBiMat:')
    expect(than).not.toContain('secret:')
  })
})

describe('Cầu nối gắn ĐÚNG CHỖ trong App', () => {
  it('chỉ gắn cho app quản lý của thầy, và gỡ khi khoá lại', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const app = readFileSync(resolve(__dirname, '../src/App.tsx'), 'utf8')
    const i = app.indexOf('ganCauNoi()')
    expect(i).toBeGreaterThan(0)
    const hieuUng = app.slice(app.lastIndexOf('useEffect', i), app.indexOf('}, [canHoi', i))
    // Bốn điều kiện: phải là màn thầy, không phải link cũ, không phải trang
    // phiếu phụ huynh, và app phải đang mở khoá.
    expect(hieuUng).toContain('!canHoi')
    expect(hieuUng).toContain('linkCu')
    expect(hieuUng).toContain('laPhieu')
    expect(hieuUng).toContain("khoa !== 'da_mo'")
    expect(hieuUng).toContain('goCauNoi()')
  })
})

// ---------------------------------------------------------------------------
// ĐỒNG BỘ TỪ CŨ TỚI MỚI — thầy chốt 07/09: "làm xong hết tất cả đồng bộ từ cũ
// tới mới rồi báo lại".
//
// Một lệnh phải làm đúng hai việc theo ĐÚNG THỨ TỰ: tải lại kho TRƯỚC, dựng lại
// phiếu SAU. Đảo thứ tự là dựng lại phiếu bằng kho cũ, tức chép lại đúng cái sai
// vừa sửa xong.
describe('dongBoMoiCa — một lệnh đồng bộ toàn bộ ca cũ', () => {
  it('tải lại kho TRƯỚC rồi mới dựng lại từng ca', async () => {
    daMoKhoa = true
    boDo.caTra = [
      { maCa: 'CA1', tenCa: 'Ester buổi 1', trangThai: 'dong' },
      { maCa: 'CA2', tenCa: 'Ester buổi 2', trangThai: 'mo' },
    ]
    const kq = await dungCauNoi().dongBoMoiCa()
    expect(nhatKy).toEqual(['kho:ep', 'bd:CA1:taoLai', 'xong:CA1', 'bd:CA2:taoLai', 'xong:CA2'])
    expect(kq.tongEm).toBe(4)
    expect(kq.tongPhieuMoi).toBe(4)
    expect(kq.caLoi).toBe(0)
  })

  it('ÉP tải lại kho, không so phiên bản — kho vừa sửa mã tại chỗ, số hiệu không đổi', async () => {
    daMoKhoa = true
    boDo.caTra = []
    await dungCauNoi().dongBoMoiCa()
    expect(nhatKy).toEqual(['kho:ep'])
  })

  it('BỎ QUA ca đã xoá', async () => {
    daMoKhoa = true
    boDo.caTra = [
      { maCa: 'CA1', tenCa: 'còn', trangThai: 'dong' },
      { maCa: 'CA9', tenCa: 'đã xoá', trangThai: 'da_xoa' },
    ]
    const kq = await dungCauNoi().dongBoMoiCa()
    expect(nhatKy).toEqual(['kho:ep', 'bd:CA1:taoLai', 'xong:CA1'])
    expect(kq.ca.map((c) => c.maCa)).toEqual(['CA1'])
  })

  it('một ca hỏng KHÔNG chặn các ca còn lại, và lỗi được ghi ra', async () => {
    daMoKhoa = true
    boDo.caTra = [
      { maCa: 'CA1', tenCa: 'a', trangThai: 'dong' },
      { maCa: 'CA2', tenCa: 'b', trangThai: 'dong' },
      { maCa: 'CA3', tenCa: 'c', trangThai: 'dong' },
    ]
    boDo.caHong = 'CA2'
    const kq = await dungCauNoi().dongBoMoiCa()
    expect(nhatKy.filter((x) => x.startsWith('bd:'))).toEqual(['bd:CA1:taoLai', 'bd:CA2:taoLai', 'bd:CA3:taoLai'])
    expect(kq.caLoi).toBe(1)
    expect(kq.ca.find((c) => c.maCa === 'CA2')?.loi).toMatch(/từ chối/)
    expect(kq.tongEm).toBe(4)
  })

  it('CHẠY TUẦN TỰ, không bắn song song vào Apps Script', async () => {
    daMoKhoa = true
    boDo.caTra = Array.from({ length: 5 }, (_, i) => ({ maCa: `CA${i + 1}`, tenCa: 't', trangThai: 'dong' }))
    await dungCauNoi().dongBoMoiCa()
    // Mỗi lượt phải ĐÓNG rồi lượt sau mới MỞ. Chạy song song thì năm dòng `bd:`
    // dồn lên trước mọi `xong:` và dãy này lệch ngay.
    expect(nhatKy).toEqual([
      'kho:ep',
      'bd:CA1:taoLai', 'xong:CA1',
      'bd:CA2:taoLai', 'xong:CA2',
      'bd:CA3:taoLai', 'xong:CA3',
      'bd:CA4:taoLai', 'xong:CA4',
      'bd:CA5:taoLai', 'xong:CA5',
    ])
  })

  it('bỏ bước tải kho khi vừa tải xong', async () => {
    daMoKhoa = true
    boDo.caTra = [{ maCa: 'CA1', tenCa: 'a', trangThai: 'dong' }]
    const kq = await dungCauNoi().dongBoMoiCa({ boTaiKho: true })
    expect(nhatKy).toEqual(['bd:CA1:taoLai', 'xong:CA1'])
    expect(kq.kho).toBeUndefined()
  })

  it('app đang KHOÁ thì hỏng ngay, không đụng tới ca nào', async () => {
    daMoKhoa = false
    await expect(dungCauNoi().dongBoMoiCa()).rejects.toThrow(/khoá/i)
    expect(nhatKy).toEqual([])
  })
})
