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

  it('`hsLichSuCa` chưa chấm ⇒ trả null cho MỌI số đếm', () => {
    // 14/09 lượt 2: ba dòng `coCham ? … : null` gom lại thành một khuôn chung
    // `goiDemCau` để thêm được "đúng một phần" và số Ý phần II mà không phải
    // sửa ba chỗ. Ý ĐỊNH của phép kiểm giữ nguyên: chưa chấm là `null`, không
    // phải 0.
    expect(hsLichSu).toContain('const coCham = rawTongCau > 0')
    expect(hsLichSu).toContain('const demCua: DemBangCham | undefined = coCham')
    expect(hsLichSu).toContain('...goiDemCau(demCua)')
    expect(SRV).toContain('tongCau: d ? d.tong : null')
    expect(SRV).toContain('soCauDung: d ? d.dung : null')
    expect(SRV).toContain('soCauSai: d ? d.sai : null')
  })

  it('`lichSuEm` nay trả đủ hợp đồng ba cổng đang đọc', () => {
    const ham = SRV.slice(SRV.indexOf('export async function lichSuEm'), SRV.indexOf('export async function lichSuEm') + 3600)
    for (const k of ['diemI:', 'diemII:', 'diemIII:', 'lanThu:', 'thoiGianPhut:', 'nopLuc,']) {
      expect(ham, k).toContain(k)
    }
    expect(ham).toContain('FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN')
    expect(ham).toContain('...goiDemCau(d)')
  })

  it('`hoSoEm` cũng đếm từ bảng chấm, một câu gộp chứ không lặp theo ca', () => {
    const ham = SRV.slice(SRV.indexOf('export async function hoSoEm'), SRV.indexOf('export async function hoSoEm') + 4200)
    expect(ham).toContain('FROM chi_tiet_cau WHERE sbd = ? AND ma_ca IN')
    expect(ham).toContain('...goiDemCau(d)')
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
    expect(PH_MODAL).toContain("{coDemCau ? <DongDemCau so={demPH} /> : 'Ca chưa chấm xong'}")
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
    expect(SP).toContain("const [xemDeHtml, setXemDeHtml] = useState('')")
    expect(SP).toContain('onClick={() => void moDeVaLoiGiai(item.maCa)}')
    expect(SP).toContain('onMoLaiBaiThi={(maCa) => void moDeVaLoiGiai(maCa)}')
    expect(SP).toContain('ten="Đề và lời giải kèm lỗi sai"')
  })

  it('KHÔNG còn phụ thuộc đường dẫn nào cả — dựng HTML tại máy', () => {
    // Bản trước dùng `${'${'}import.meta.env.BASE_URL}t/...` trong lớp phủ; chính
    // chỗ đó vỡ khi Pages trả 404 hoặc service worker thiếu đường lui.
    expect(SP).not.toContain('BASE_URL}t/')
    expect(SP).toContain('html={xemDeHtml}')
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

// ===========================================================================
// CỔNG NGẮN /hs VÀ /ph — thầy bắt được 14/09 khi chuyển sang pages.dev:
// mở https://omr-app-b3u.pages.dev/hs thì rơi vào màn quản lý của Thầy và hiện
// ô "Đặt mật khẩu mở app", vì mẫu đường dẫn chỉ nhận `hoc-sinh`/`phu-huynh`.
// ===========================================================================
describe('Đường dẫn ngắn /hs và /ph vào đúng cổng', () => {
  it('nhận cả dạng ngắn lẫn dạng dài', async () => {
    const { docVaiTuDuongDan } = await import('../src/lib/vai-tro')
    for (const d of ['/hs', '/hs/', '/hoc-sinh', '/hocsinh', '/omr-app/hs']) {
      expect(docVaiTuDuongDan(d).vai, d).toBe('hocsinh')
    }
    for (const d of ['/ph', '/ph/', '/phu-huynh', '/phuhuynh', '/omr-app/ph']) {
      expect(docVaiTuDuongDan(d).vai, d).toBe('phuhuynh')
    }
  })

  it('KHÔNG cướp link riêng cũ /hs/<token> — nó còn đoạn token phía sau', async () => {
    const { docVaiTuDuongDan, laLinkAppCu } = await import('../src/lib/vai-tro')
    const cu = '/hs/abc12345xyz'
    expect(docVaiTuDuongDan(cu).vai).toBeNull()
    expect(laLinkAppCu('', cu)).toBe(true)
  })

  it('các cổng khác không đổi', async () => {
    const { docVaiTuDuongDan } = await import('../src/lib/vai-tro')
    expect(docVaiTuDuongDan('/gv').vai).toBe('gv')
    expect(docVaiTuDuongDan('/t/561169').maCa).toBe('561169')
    expect(docVaiTuDuongDan('/d/561169').vai).toBe('diem')
    expect(docVaiTuDuongDan('/').vai).toBeNull()
  })
})

// ===========================================================================
// CLOUDFLARE PAGES PHẢI TRẢ index.html CHO MỌI ĐƯỜNG DẪN — 14/09.
//
// App đọc vai và mã ca TỪ ĐƯỜNG DẪN. Máy đã cài service worker thì chính nó trả
// index.html nên không ai thấy vấn đề; máy CHƯA cài (hoặc vừa xoá bộ đệm) thì
// Pages đi tìm một tệp có thật tên `/hs` và không thấy — ERR_FAILED / 404.
// Đó là lý do link học sinh mở trên máy khác không vào được, và khung "Xem đề
// và lời giải" mở ra trang lỗi vì /t/<mã ca> trả 404.
// ===========================================================================
describe('Pages trả index.html cho mọi đường dẫn của app', () => {
  const R = doc('public/_redirects')

  it('có luật bắt tất, trả mã 200 chứ không chuyển hướng', () => {
    const dong = R.split('\n').filter((d) => d.trim() && !d.trim().startsWith('#'))
    expect(dong.length).toBeGreaterThan(0)
    const cuoi = dong[dong.length - 1].split(/\s+/)
    expect(cuoi[0]).toBe('/*')
    expect(cuoi[1]).toBe('/index.html')
    // 200 giữ nguyên đường dẫn trên thanh địa chỉ để app còn đọc được vai.
    expect(cuoi[2]).toBe('200')
  })

  it('nằm trong public/ nên được chép thẳng vào bản dựng', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public/_redirects'))).toBe(true)
  })
})

// ===========================================================================
// BÌA PHIẾU PHẲNG VÀ SÁNG (Material 3) — thầy chốt 14/09, áp cho MỌI phiếu của
// cả ba app, vì cả ba đều dựng từ `html-phieu.ts`.
//
// Bản trước: nền chuyển sắc đậm + chữ trắng + hai vệt tròn mờ + bóng đổ. Chữ
// trắng trên nền vàng gần như không đọc nổi ngoài nắng — mà em mở phiếu này
// trên điện thoại.
// ===========================================================================
describe('Bìa và tổng quan phiếu: phẳng, sáng, dùng token màu', () => {
  const HP = doc('src/lib/html-phieu.ts')
  const bia = HP.slice(HP.indexOf('.cover {'), HP.indexOf('.cover-blob'))
  const tq = HP.slice(HP.indexOf('.summary-page {'), HP.indexOf('.summary-page {') + 420)

  it('bìa KHÔNG còn nền chuyển sắc, KHÔNG còn bóng đổ', () => {
    expect(bia).not.toContain('linear-gradient')
    expect(bia).not.toContain('box-shadow')
  })

  it('bìa dùng nền sáng, chữ tối, viền mảnh', () => {
    expect(bia).toContain('background: var(--the-nen)')
    expect(bia).toContain('color: var(--muc)')
    expect(bia).toContain('border: 1px solid var(--vien)')
  })

  it('tổng quan cùng lối, và thôi chồng đè lên bìa', () => {
    expect(tq).not.toContain('linear-gradient')
    expect(tq).toContain('background: var(--the-nen)')
    expect(tq).toContain('margin: 0 auto 20px')
  })

  it('hai vệt tròn mờ bị tắt — chúng chỉ có nghĩa trên nền đậm', () => {
    expect(HP).toContain('.cover-blob { display: none; }')
  })

  it('không còn tô bằng màu trắng mờ chồng lớp ở khối đầu phiếu', () => {
    const dau = HP.slice(HP.indexOf('.cover {'), HP.indexOf('/* ================= Ô LÀM BÀI'))
    expect(dau).not.toContain('rgba(255,255,255')
  })

  it('ô đang chọn nổi bằng viền màu nhấn, không đảo sang nền trắng', () => {
    expect(HP).toContain('button.stat-card.chon { background: var(--the-nen); border-color: var(--nav)')
    expect(HP).not.toContain('button.stat-card.chon { background: #ffffff')
  })
})

// ===========================================================================
// XEM ĐỀ VÀ LỜI GIẢI: DỰNG HTML TẠI MÁY, KHÔNG MỞ ĐƯỜNG DẪN — 14/09.
//
// Bản trước mở `/t/<mã ca>` trong lớp phủ. Cách ấy phụ thuộc việc máy chủ (hoặc
// service worker) trả đúng index.html cho một đường dẫn không có tệp thật — và
// đó chính là chỗ vỡ: Cloudflare Pages trả 404, máy đã cài service worker
// thiếu đường lui thì ra thẳng trang lỗi trình duyệt.
// ===========================================================================
describe('Đề và lời giải dựng tại máy, đúng khuôn phiếu đã thiết kế', () => {
  const SP = doc('src/screens/StudentPortalScreen.tsx')
  const LIB = doc('src/lib/de-loi-giai-cua-em.ts')

  it('lớp phủ nhận HTML dựng sẵn, KHÔNG nhận đường dẫn', () => {
    expect(SP).toContain('html={xemDeHtml}')
    expect(SP).not.toContain('}t/${xemDeCa}?sbd=')
  })

  it('dựng bằng đúng khuôn phiếu chung `dungPhieu`', () => {
    expect(LIB).toContain("from './html-phieu'")
    expect(LIB).toContain('return dungPhieu(tt, cau, { anGiai: false })')
  })

  it('đi theo BẢNG CHẤM của chính em, không theo cả gói đề', () => {
    // Ca đề riêng: gói đề chứa cả kho của lớp, bảng chấm mới là tờ đề của em.
    expect(LIB).toContain('for (const r of rows)')
    expect(LIB).toContain('theoId.get(r.qid)')
  })

  it('câu SAI mang nhãn kèm đáp án em đã chọn', () => {
    expect(LIB).toContain('r.dungSai === false')
    expect(LIB).toContain('daChon: r.dapAnChon')
  })

  it('thiếu đáp án thì nói rõ, không mở phiếu rỗng', () => {
    expect(LIB).toContain("if (!b?.bank) return { html: '', loi: 'Ca này chưa có đáp án trên máy chủ")
    expect(LIB).toContain("if (!html) return { html: '', loi: 'Không dựng được đề của em")
  })

  it('cả hai lối vào đều đi qua cùng một hàm', () => {
    expect(SP).toContain('onClick={() => void moDeVaLoiGiai(item.maCa)}')
    expect(SP).toContain('onMoLaiBaiThi={(maCa) => void moDeVaLoiGiai(maCa)}')
  })
})
