// ĐẾM TỔNG CÂU VÀ SỐ CÂU SAI — ca Test2 (561169), 14/09.
//
// Ca ĐỀ RIÊNG: gói đề `de/561169.json` chứa cả kho 545 câu (I 314 · II 97 ·
// III 134), còn mỗi em chỉ nhận 12 câu (`soCau` I:8 · II:2 · III:2). Bài
// 1,56 điểm của em 12121212 hiện ra sai số câu ở cả ba app.
//
// Nguồn duy nhất hợp lệ của số câu là BẢNG CHẤM `chi_tiet_cau` của chính em.
// Không có bảng chấm thì trả `null` — cấm suy ra từ điểm, cấm số mặc định.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const SRV = doc('server/src/goi-cu.ts')
const HS_MODAL = doc('src/components/BaoCaoCaThiHocSinhModal.tsx')
const PH_MODAL = doc('src/components/BaoCaoCaThiPhuHuynhModal.tsx')

/** Mọi công thức suy số câu từ điểm đã từng tồn tại trong mã. */
const CONG_THUC_BIA = [
  'Math.round((diem / 10) * tongCau)',
  'Math.round((tongDiem / 10) * 28)',
  'Math.min(18, Math.max(0, Math.round(',
  'Math.min(4, Math.max(0, Math.round(',
  'Math.min(6, Math.max(0, Math.round(',
]

describe('MÁY CHỦ — số câu chỉ đến từ bảng chấm', () => {
  const hsLichSu = SRV.slice(SRV.indexOf('export async function hsLichSuCa'), SRV.indexOf('export async function hsLichSuCa') + 4200)

  it('`hsLichSuCa` KHÔNG còn công thức suy số câu từ điểm', () => {
    for (const ct of CONG_THUC_BIA) expect(hsLichSu, ct).not.toContain(ct)
    expect(hsLichSu).not.toContain('tongCau = 28')
  })

  it('`hsLichSuCa` chưa chấm ⇒ trả null cho cả ba số', () => {
    expect(hsLichSu).toContain('const coCham = rawTongCau > 0')
    expect(hsLichSu).toContain('const tongCau = coCham ? rawTongCau : null')
    expect(hsLichSu).toContain('const soCauDung = coCham ? rawSoDung : null')
    expect(hsLichSu).toContain('const soCauSai = coCham ? rawSoSai : null')
  })

  it('`lichSuEm` nay trả đủ hợp đồng ba cổng đang đọc', () => {
    const ham = SRV.slice(SRV.indexOf('export async function lichSuEm'), SRV.indexOf('export async function lichSuEm') + 3600)
    for (const k of ['tongCau:', 'soCauDung:', 'soCauSai:', 'diemI:', 'diemII:', 'diemIII:', 'lanThu:', 'thoiGianPhut:', 'nopLuc,']) {
      expect(ham, k).toContain(k)
    }
    expect(ham).toContain('FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN')
    expect(ham).toContain('tongCau: d ? d.tong : null')
  })

  it('`hoSoEm` cũng đếm từ bảng chấm, một câu gộp chứ không lặp theo ca', () => {
    const ham = SRV.slice(SRV.indexOf('export async function hoSoEm'), SRV.indexOf('export async function hoSoEm') + 4200)
    expect(ham).toContain('FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN')
    expect(ham).toContain('tongCau: d ? d.tong : null')
    expect(ham).toContain('soCauSai: d ? d.sai : null')
  })

  it('đếm gộp một câu cho cả danh sách ca — cả lớp mở cổng cùng lúc', () => {
    // GROUP BY ma_ca, không phải một truy vấn mỗi ca.
    expect((SRV.match(/GROUP BY ma_ca/g) || []).length).toBeGreaterThanOrEqual(2)
  })
})

describe('BA APP — không màn nào tự dựng số câu', () => {
  it('báo cáo cổng HỌC SINH bỏ hết công thức suy từ điểm', () => {
    for (const ct of CONG_THUC_BIA) expect(HS_MODAL, ct).not.toContain(ct)
    expect(HS_MODAL).toContain("const tongCau = baiThi.tongCau && baiThi.tongCau > 0 ? baiThi.tongCau : null")
    expect(HS_MODAL).toContain('const coDemCau = tongCau !== null && soDung !== null')
  })

  it('báo cáo cổng PHỤ HUYNH bỏ hết công thức suy từ điểm', () => {
    for (const ct of CONG_THUC_BIA) expect(PH_MODAL, ct).not.toContain(ct)
    expect(PH_MODAL).toContain("const tongCau = baiThi.tongSoCau && baiThi.tongSoCau > 0 ? baiThi.tongSoCau : null")
    expect(PH_MODAL).toContain('const coDemCau = tongCau !== null && soDung !== null')
  })

  it('không màn nào còn số câu gõ cứng 28 hay 40', () => {
    expect(doc('src/screens/HocSinhScreen.tsx')).not.toContain('tongCau: 40')
    expect(doc('src/screens/ExamMonitorScreen.tsx')).not.toContain('.items.length) : 40)')
    for (const f of [HS_MODAL, PH_MODAL]) {
      expect(f).not.toContain('Math.max(28, dsCauSai.length)')
    }
  })

  it('chưa chấm thì GIẤU dòng đếm, không hiện "Đúng 0/0 câu"', () => {
    const SP = doc('src/screens/StudentPortalScreen.tsx')
    expect(SP).toContain("{typeof item.tongCau === 'number' && item.tongCau > 0 && (")
    expect(PH_MODAL).toContain("{coDemCau ? `Đúng ${soDung}/${tongCau} câu` : 'Ca chưa chấm xong'}")
  })

  it('danh sách câu sai THẬT vẫn được dùng khi máy chủ chưa trả số', () => {
    for (const f of [HS_MODAL, PH_MODAL]) {
      expect(f).toContain("dsCauSai.length > 0 ? dsCauSai.length : null")
    }
  })
})

// ===========================================================================
// "EM CHỌN" PHẢI ĐỎ RÕ — thầy chốt 14/09, đồng bộ cả ba cổng.
// Đây là chỗ em phải nhìn thấy đầu tiên trong bảng câu sai; hồng nhạt thì
// trôi lẫn vào nền.
// ===========================================================================
describe('Đáp án EM CHỌN tô đỏ ở cả ba cổng', () => {
  it('cổng học sinh: nền đỏ, chữ trắng', () => {
    expect(HS_MODAL).toContain('bg-rose-600 text-white border border-rose-700')
    const i = HS_MODAL.indexOf('Em chọn: {c.dapAnChon')
    expect(i).toBeGreaterThan(0)
    expect(HS_MODAL.slice(Math.max(0, i - 260), i)).toContain('bg-rose-600')
    // KHÔNG còn kiểu hồng nhạt cũ.
    expect(HS_MODAL).not.toContain('bg-rose-50 dark:bg-rose-950 text-rose-600')
  })

  it('cổng phụ huynh: cùng một kiểu', () => {
    const i = PH_MODAL.indexOf('Con đã chọn:')
    expect(i).toBeGreaterThan(0)
    expect(PH_MODAL.slice(i, i + 300)).toContain('bg-rose-600 text-white border border-rose-700')
  })

  it('app của Thầy: phần em chọn tô đỏ, đáp án đúng giữ màu thường', () => {
    const M = doc('src/screens/ExamMonitorScreen.tsx')
    const i = M.indexOf("· em chọn:")
    expect(i).toBeGreaterThan(0)
    const than = M.slice(i, i + 200)
    expect(than).toContain("<b style={{ color: 'var(--do)' }}>{c.dapAnChon")
  })

  it('màu lấy từ token, không gõ mã màu vào mã nguồn', () => {
    const M = doc('src/screens/ExamMonitorScreen.tsx')
    const i = M.indexOf("· em chọn:")
    expect(M.slice(i, i + 200)).toContain('var(--do)')
  })
})

describe('Nút mở bài đã nộp nói đúng việc nó làm', () => {
  // "Mở lại bài thi" khiến em tưởng được thi lại. Nó chỉ mở bài ĐÃ NỘP ở chế
  // độ xem: đề, lời giải và chỗ em sai.
  it('cả hai chỗ đều đổi tên', () => {
    const SP = doc('src/screens/StudentPortalScreen.tsx')
    expect(SP).toContain('Xem đề và lời giải kèm lỗi sai')
    expect(SP).not.toContain('Mở lại bài thi')
    expect(HS_MODAL).toContain('Xem đề và lời giải kèm lỗi sai')
    expect(HS_MODAL).not.toContain('Mở lại bài thi')
  })
})

// ===========================================================================
// TỰ TẢI LẠI KHI BẢN MỚI CHIẾM QUYỀN — thầy kẹt 14/09.
// Máy hiện "Bản 2cf33fe · 23:31" trong khi máy chủ đã phục vụ `daca60a`.
// Dây chuyền chạy đúng tới bước áp chót rồi dừng: service worker mới đã nắm
// quyền, nhưng trang đang mở vẫn giữ mã JS cũ vì không ai gọi tải lại.
// ===========================================================================
describe('App tự nhận bản mới, không bắt Thầy xoá dữ liệu trang', () => {
  it('có nghe `controllerchange` và tải lại', async () => {
    const { tuTaiLaiKhiDoiBan } = await import('../src/lib/cap-nhat-app')
    let banBat: (() => void) | null = null
    let daTaiLai = 0
    tuTaiLaiKhiDoiBan({
      addEventListener: (t, f) => {
        if (t === 'controllerchange') banBat = f
      },
      taiLai: () => {
        daTaiLai += 1
      },
      dangLamBai: () => false,
    })
    expect(banBat).not.toBeNull()
    banBat!()
    expect(daTaiLai).toBe(1)
  })

  it('ĐANG THI thì KHÔNG tải lại — mất bài giữa giờ còn tệ hơn chạy bản cũ', async () => {
    // Module giữ cờ "đã hẹn tải lại" nên phải nạp lại sạch cho phép kiểm này.
    const { tuTaiLaiKhiDoiBan } = await import('../src/lib/cap-nhat-app?moi=1')
    let banBat: (() => void) | null = null
    let daTaiLai = 0
    tuTaiLaiKhiDoiBan({
      addEventListener: (t, f) => {
        if (t === 'controllerchange') banBat = f
      },
      taiLai: () => {
        daTaiLai += 1
      },
      dangLamBai: () => true,
    })
    banBat!()
    expect(daTaiLai).toBe(0)
  })

  it('main.tsx bật cơ chế ấy ngay khi app khởi động', () => {
    const M = doc('src/main.tsx')
    expect(M).toContain('tuTaiLaiKhiDoiBan()')
    // Phải đứng TRƯỚC registerSW để không bỏ lỡ lần đổi bản đầu tiên.
    expect(M.indexOf('tuTaiLaiKhiDoiBan()')).toBeLessThan(M.indexOf('registerSW({'))
  })
})

// ===========================================================================
// XEM ĐỀ VÀ LỜI GIẢI NGAY TRONG APP, và CHỈ MỘT NƠI PHÁT HÀNH — 14/09.
// ===========================================================================
describe('Xem đề và lời giải mở tại chỗ', () => {
  const SP = doc('src/screens/StudentPortalScreen.tsx')

  it('KHÔNG còn điều hướng sang trang khác', () => {
    expect(SP).not.toContain('window.location.href = `/t/${maCa}?sbd=')
    expect(SP).not.toContain('href={`/t/${item.maCa}?sbd=${auth.sbd}`}')
  })

  it('mở trong lớp phủ ngay trong app', () => {
    expect(SP).toContain("const [xemDeCa, setXemDeCa] = useState('')")
    expect(SP).toContain('onClick={() => setXemDeCa(item.maCa)}')
    expect(SP).toContain('onMoLaiBaiThi={(maCa) => setXemDeCa(maCa)}')
    expect(SP).toContain('ten="Đề và lời giải kèm lỗi sai"')
  })

  it('đường dẫn bám BASE_URL, không gõ cứng — pages.dev dùng gốc "/"', () => {
    expect(SP).toContain('${import.meta.env.BASE_URL}t/${xemDeCa}')
  })
})

describe('Chỉ MỘT nơi phát hành: Cloudflare Pages', () => {
  const WF = doc('.github/workflows/deploy.yml')

  it('không còn job nào đẩy lên GitHub Pages', () => {
    expect(WF).not.toContain('upload-pages-artifact')
    expect(WF).not.toContain('deploy-pages')
    expect(WF).not.toContain("GITHUB_PAGES: 'true'")
  })

  it('đẩy thẳng lên project omr-app trên Cloudflare Pages', () => {
    expect(WF).toContain('cloudflare/wrangler-action')
    expect(WF).toContain('pages deploy dist --project-name=omr-app')
  })

  it('cổng kiểm chạy TRƯỚC khi phát hành — hỏng là dừng, không đẩy bản lỗi', () => {
    const iKiem = WF.indexOf('npm test -- --run')
    const iDay = WF.indexOf('pages deploy dist')
    expect(iKiem).toBeGreaterThan(0)
    expect(iKiem).toBeLessThan(iDay)
  })
})
