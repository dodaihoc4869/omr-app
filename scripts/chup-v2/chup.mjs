#!/usr/bin/env node
// CHỤP ẢNH BẢN DUYỆT V2 bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx thay `fetch`; mọi yêu cầu ra ngoài máy cục bộ bị CHẶN).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-v2/chup.mjs <thư mục tạm> <thư mục ảnh> [ten1,ten2,…]
// Mỗi ảnh: JPG tự hạ chất lượng tới khi ≤ 150 KB. In: lỗi trang, tràn ngang (px), vùng chạm < 44px (nút/đường dẫn hiển thị).
// Thoát mã 1 nếu có lỗi trang hoặc tràn ngang.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const RA = resolve(process.argv[3] ?? 'anh-v2')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const trangGoc = `${goc}/scripts/chup-v2/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
// LÀN THẺ HÔM NAY 12/10E: trình duyệt ÉP TỐI trang web (như "tối cho trang web" của Samsung Internet / Chrome trên điện thoại) — chỉ mở khi có cảnh 'ep-toi'.
let epToi = null
const trinhEpToi = async () => (epToi ??= await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--blink-settings=forceDarkModeEnabled=true'] }))

// ═══════════ LÀN HỌC SINH 12/10: Tu luyện trùng tu · Chữa trực tiếp câu gốc (thiếu bài luyện từng bước) · danh sách Tự chữa lỗi ═══════════
// 3 khổ (390×844, 844×390, 1440×900) × sáng/tối; cảnh `?man=hs12-*` ở trang.tsx (khối cùng tên). Chạy riêng: tiền tố "4" (40-, 41-, 42-).
const DS_HS12 = [[390, 844, 'doc'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hgt, k]) => ['light', 'dark'].flatMap((nen) => {
  const t = nen === 'dark' ? '-toi' : ''
  return [
    [`40-hs12-tu-luyen-${k}${t}`, 'hs12-tu-luyen', w, hgt, nen, true, /Sửa câu sai/],
    [`40-hs12-tu-luyen-sua-sai-${k}${t}`, 'hs12-tu-luyen', w, hgt, nen, false, /Sửa câu sai/, 'bam-radio:Sửa câu sai'],
    [`41-hs12-chua-truc-tiep-${k}${t}`, 'hs12-chua-truc-tiep', w, hgt, nen, false, /Câu em đã làm sai/],
    // Boss 12/10: thứ tự Xem lại câu gốc → Tự làm lại → Đáp án và lời giải (bước 3 mở sau khi em làm lại / bấm xem lời giải)
    [`41-hs12-chua-truc-tiep-lam-lai-${k}${t}`, 'hs12-chua-truc-tiep', w, hgt, nen, false, /Câu em đã làm sai/, 'nut:Tự làm lại câu này'],
    [`41-hs12-chua-truc-tiep-loi-giai-${k}${t}`, 'hs12-chua-truc-tiep', w, hgt, nen, true, /Câu em đã làm sai/, 'nut:Tự làm lại câu này » Em chưa làm được — xem lời giải'],
    [`42-hs12-tu-chua-${k}${t}`, 'hs12-tu-chua', w, hgt, nen, true, /Câu em cần chữa/],
    [`43-hs12-tu-luyen-lam-${k}${t}`, 'hs12-tu-luyen-lam', w, hgt, nen, false, /Thuỷ phân hoàn toàn/],
  ]
})).concat([['41-hs12-chua-gap-lai-doc', 'hs12-chua-gap-lai', 390, 844, 'light', true, /Lần gặp lại 2 mở lúc/]])
// ═══════════ hết LÀN HỌC SINH 12/10 ═══════════

// ═══════════ LÀN THẦY TỰ CHỮA 12/10: Cần thầy chữa › thẻ "Thầy tự chữa" (gập · đã chọn đề) + tờ máy chiếu sau khi chọn đề ═══════════
// Cảnh `?man=gv-nhip&the=can-chua&ttc=1` (trang.tsx, khối cùng tên). `ttc:<mã bài>` = mở thẻ, chọn bài, chờ tỉ lệ sai lớp; `ttc-chieu:<mã bài>[:phím]` = thêm
// bấm "Chiếu lên máy chiếu", chờ tờ nối app rồi gõ phím trên tờ (t thống kê lớp · g lời giải · x ai làm sai). Chạy riêng: tiền tố "5" (50-, 51-, 52-).
const DS_TTC = [
  ['50-ttc-the-gap-may-tinh', 'gv-nhip&the=can-chua&ttc=1', 1440, 900, 'light', false, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ['50-ttc-the-gap-dien-thoai-toi', 'gv-nhip&the=can-chua&ttc=1', 390, 844, 'dark', false, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ...['light', 'dark'].flatMap((nen) => [[1440, 900, 'may-tinh'], [390, 844, 'dien-thoai']].map(([w, hh, kho]) =>
    [`51-ttc-chon-de-${kho}${nen === 'dark' ? '-toi' : ''}`, 'gv-nhip&the=can-chua&ttc=1', w, hh, nen, true, /Hành trình giỏi Hóa/, 'ttc:DH-12-C2-B6'])),
  ['52-ttc-to-chieu-1920', 'gv-nhip&the=can-chua&ttc=1', 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'ttc-chieu:DH-12-C2-B6'],
  ['52-ttc-to-chieu-thong-ke-1920', 'gv-nhip&the=can-chua&ttc=1', 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'ttc-chieu:DH-12-C2-B6:t'],
  ['52-ttc-to-chieu-loi-giai-1920', 'gv-nhip&the=can-chua&ttc=1', 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'ttc-chieu:DH-12-C2-B6:g '],
  ['52-ttc-to-chieu-ai-sai-1920', 'gv-nhip&the=can-chua&ttc=1', 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'ttc-chieu:DH-12-C2-B6:x'],
  ['52-ttc-to-chieu-1440', 'gv-nhip&the=can-chua&ttc=1', 1440, 900, 'light', false, /Hành trình giỏi Hóa/, 'ttc-chieu:DH-12-C2-B6:t'],
  ['52-ttc-to-chieu-dot-5-1920', 'gv-nhip&the=can-chua&ttc=1', 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'ttc-chieu:DH-12-C2-B6:→→→→t'],
]
// ═══════════ hết LÀN THẦY TỰ CHỮA 12/10 ═══════════

// ═══════════ LÀN CHỮA BÀI 12/10B: Hành trình › Chữa bài = (A) Học sinh cần chữa + (B) Chữa câu khó & tính toán (mở sẵn) + tờ chiếu gọi em lên bảng ═══════════
// Cảnh `?man=gv-nhip&the=can-chua&ttc=1&cb=1` (trang.tsx + gia/chua-bai.ts). `cb:<mã bài>` = chọn lớp 12A1 + bài, chờ dòng "Gọi lên bảng:";
// `cb-chieu:<mã bài>[:phím]` = thêm bấm "Chiếu lên bảng", chờ tờ nối app rồi gõ phím trên tờ (l gọi em · e gọi em khác · g lời giải).
// Chạy riêng: tiền tố "6" (60-, 61-).
const CB = 'gv-nhip&the=can-chua&ttc=1&cb=1'
const DS_CB = [
  ['60-cb-chua-bai-may-tinh', CB, 1440, 900, 'light', true, /Hành trình giỏi Hóa/, 'cb:DH-12-C2-B6'],
  ['60-cb-chua-bai-may-tinh-toi', CB, 1440, 900, 'dark', true, /Hành trình giỏi Hóa/, 'cb:DH-12-C2-B6'],
  ['60-cb-chua-bai-dien-thoai', CB, 390, 844, 'light', true, /Hành trình giỏi Hóa/, 'cb:DH-12-C2-B6'],
  ['60-cb-chua-bai-dien-thoai-toi', CB, 390, 844, 'dark', true, /Hành trình giỏi Hóa/, 'cb:DH-12-C2-B6'],
  ['61-cb-to-chieu-cho-goi-1920', CB, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'cb-chieu:DH-12-C2-B6'],
  ['61-cb-to-chieu-da-goi-1920', CB, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'cb-chieu:DH-12-C2-B6:l'],
  ['61-cb-to-chieu-goi-em-khac-1920', CB, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'cb-chieu:DH-12-C2-B6:le'],
  ['61-cb-to-chieu-da-goi-loi-giai-1920', CB, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'cb-chieu:DH-12-C2-B6:lg '],
]
// ═══════════ hết LÀN CHỮA BÀI 12/10B ═══════════
// ═══════════ LÀN HÀNH TRÌNH 12/10B: Hành trình còn 2 mục › Dạy học & đầu giờ = MỘT buổi dạy 4 bước (bản vẽ HanhTrinh-DayHoc đã duyệt) ═══════════
// Cảnh `?man=gv-nhip&ht2=1` (máy giả riêng gia/hanh-trinh-2-muc.ts: lớp có 6 em vắng + một lượt 6 em gọi lên bảng; bảng Bài đang giao dùng bộ giả
// gói 7 ngày). Chờ dòng cuối của bảng Bài đang giao ("58 em" — gói 12A2) rồi chụp CẢ TRANG. Chạy riêng: tiền tố "60-".
const DS_HT2 = ['light', 'dark'].flatMap((nen) => [[1440, 900, 'may-tinh'], [390, 844, 'dien-thoai']].map(([w, hh, kho]) =>
  [`60-ht2-day-hoc-${kho}${nen === 'dark' ? '-toi' : ''}`, 'gv-nhip&ht2=1', w, hh, nen, true, /Hành trình giỏi Hóa/, 'cho:58 em']))
// ═══════════ hết LÀN HÀNH TRÌNH 12/10B ═══════════
// ═══════════ LÀN ĐIỂM DANH 12/10C: bước 1 Điểm danh (bản vẽ GV-DiemDanh) + bản chiếu A đang điểm danh · B Nhịp học của lớp · hồ sơ một em trên bản chiếu ═══════════
// Cảnh `?man=gv-nhip&ht2=1&dd12c=1` (trang.tsx + gia/diem-danh-1210c.ts). `dd12c:<việc>[:phím]`: buoc1 = chờ ô em vắng có nhóm · chieu = bấm "Chiếu điểm danh"
// · nhip = bấm nút chính "Xong điểm danh · chiếu Nhịp học của lớp" (rồi gõ phím, vd `h` ẩn tên Lười) · ho-so = thêm bấm em đầu cột Chưa đều ⇒ tấm Hồ sơ làm bài.
// Bước 1: máy 1440×900 + điện thoại 390×844 TOÀN TRANG, sáng + tối; bản chiếu 1920×1080 (thêm 1280×720 kiểm co giãn). Chạy riêng: tiền tố "8" (80-…84-).
const DD12C = 'gv-nhip&ht2=1&dd12c=1'
const DS_DD12C = [
  ...['light', 'dark'].flatMap((nen) => [[1440, 900, 'may-tinh'], [390, 844, 'dien-thoai']].map(([w, hh, kho]) =>
    [`80-dd12c-buoc1-${kho}${nen === 'dark' ? '-toi' : ''}`, DD12C, w, hh, nen, true, /Hành trình giỏi Hóa/, 'dd12c:buoc1'])),
  ['81-dd12c-chieu-diem-danh-1920', DD12C, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'dd12c:chieu'],
  ['81-dd12c-chieu-diem-danh-1280', DD12C, 1280, 720, 'dark', false, /Hành trình giỏi Hóa/, 'dd12c:chieu'],
  ['82-dd12c-chieu-nhip-lop-1920', DD12C, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'dd12c:nhip'],
  ['82-dd12c-chieu-nhip-lop-an-luoi-1920', DD12C, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'dd12c:nhip:h'],
  ['82-dd12c-chieu-nhip-lop-1280', DD12C, 1280, 720, 'dark', false, /Hành trình giỏi Hóa/, 'dd12c:nhip'],
  ['83-dd12c-chieu-ho-so-em-1920', DD12C, 1920, 1080, 'light', false, /Hành trình giỏi Hóa/, 'dd12c:ho-so'],
  ['83-dd12c-chieu-ho-so-em-1920-toi', DD12C, 1920, 1080, 'dark', false, /Hành trình giỏi Hóa/, 'dd12c:ho-so'],
  ['84-dd12c-buoc1-ho-so-em-may-tinh', DD12C, 1440, 900, 'light', false, /Hành trình giỏi Hóa/, 'dd12c:vua'],
  // THANH MỨC LÀM Ở BẢNG ĐIỂM DANH (thầy 20/10, bản vẽ 03; cảnh `&mlo=1` — máy giả trả Mức làm 14 ngày): máy tính + điện thoại, sáng + tối; cột 1 danh sách mở hết em.
  ...['light', 'dark'].flatMap((nen) => [[1440, 900, 'may-tinh'], [844, 390, 'ngang'], [390, 844, 'dien-thoai']].map(([w, hh, kho]) =>
    [`85-dd12c-muc-lam-${kho}${nen === 'dark' ? '-toi' : ''}`, `${DD12C}&mlo=1`, w, hh, nen, true, /Hành trình giỏi Hóa/, 'dd12c:muc'])),
  // 6 MỨC (22/10): những ngày đầu (`mlo=dau`, chưa lượt nào đo treo máy) + lọc «Treo máy» (`dd12c:muc-treo`).
  ...['light', 'dark'].flatMap((nen) => [[1440, 900, 'may-tinh'], [390, 844, 'dien-thoai']].flatMap(([w, hh, kho]) => [
    [`86-dd12c-ngay-dau-${kho}${nen === 'dark' ? '-toi' : ''}`, `${DD12C}&mlo=dau`, w, hh, nen, true, /Hành trình giỏi Hóa/, 'dd12c:muc'],
    [`87-dd12c-loc-treo-${kho}${nen === 'dark' ? '-toi' : ''}`, `${DD12C}&mlo=1`, w, hh, nen, true, /Hành trình giỏi Hóa/, 'dd12c:muc-treo'],
  ])),
  // lệnh lô hỏng (bản vẽ khung 04): lý do thật + Thử tải lại, dòng điểm danh vẫn đủ — 3 khổ × sáng/tối
  ...['light', 'dark'].flatMap((nen) => [[1440, 900, 'may-tinh'], [844, 390, 'ngang'], [390, 844, 'dien-thoai']].map(([w, hh, kho]) =>
    [`88-dd12c-loi-${kho}${nen === 'dark' ? '-toi' : ''}`, `${DD12C}&mlo=loi`, w, hh, nen, true, /Hành trình giỏi Hóa/, 'dd12c:muc-loi'])),
]
// ═══════════ hết LÀN ĐIỂM DANH 12/10C ═══════════
// ═══════════ LÀN HÔM NAY 12/10B: Hôm nay của thầy theo bản vẽ thầy duyệt 12/10 — hàng thẻ Việc cần thầy + khối Nhịp học (262 em × 12 ngày, ═══════════
// gia/nhip-hoc.ts). Máy 1440×900 + điện thoại 390×844 TOÀN TRANG, sáng + tối; thêm thao tác `hn:<việc>`: Xem đủ em lười · lọc Khối 12 · bấm em ⇒ tấm hồ
// sơ · bảng từng ngày · thẻ Chăm / Đối phó (điện thoại) · lỗi (`nh=loi`) · chưa có em (`nh=trong`). Chạy riêng: tiền tố "6" (60-…67-).
const DS_HN = [
  ...['light', 'dark'].flatMap((nen) => {
    const t = nen === 'dark' ? '-toi' : ''
    return [
      [`60-hn-may-tinh${t}`, 'gv-hom-nay&nh=1', 1440, 900, nen, true, /Hôm nay của thầy/, 'hn:cho'],
      [`61-hn-dien-thoai${t}`, 'gv-hom-nay&nh=1', 390, 844, nen, true, /Hôm nay của thầy/, 'hn:cho'],
    ]
  }),
  ['62-hn-xem-du-luoi-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', false, /Hôm nay của thầy/, 'hn:xem-du-luoi'],
  ['63-hn-loc-khoi-12-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', true, /Hôm nay của thầy/, 'hn:khoi-12'],
  ['63-hn-loc-khoi-12-may-tinh-toi', 'gv-hom-nay&nh=1', 1440, 900, 'dark', true, /Hôm nay của thầy/, 'hn:khoi-12'],
  ['64-hn-ho-so-em-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', false, /Hôm nay của thầy/, 'hn:ho-so'],
  ['64-hn-ho-so-em-dien-thoai-toi', 'gv-hom-nay&nh=1', 390, 844, 'dark', false, /Hôm nay của thầy/, 'hn:ho-so'],
  ['65-hn-bang-tung-ngay-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', false, /Hôm nay của thầy/, 'hn:bang'],
  ['66-hn-dien-thoai-tab-cham', 'gv-hom-nay&nh=1', 390, 844, 'light', true, /Hôm nay của thầy/, 'hn:tab-cham'],
  ['66-hn-dien-thoai-tab-doi-pho-toi', 'gv-hom-nay&nh=1', 390, 844, 'dark', true, /Hôm nay của thầy/, 'hn:tab-doi-pho'],
  ['67-hn-loi-dien-thoai', 'gv-hom-nay&nh=loi', 390, 844, 'light', false, /Hôm nay của thầy/, 'hn:loi'],
  ['67-hn-chua-co-em-may-tinh-toi', 'gv-hom-nay&nh=trong', 1440, 900, 'dark', false, /Hôm nay của thầy/, 'hn:trong'],
]
// ═══════════ hết LÀN HÔM NAY 12/10B ═══════════

// ═══════════ LÀN NHỊP EM 12/10C: app học sinh › Hôm nay — bảng "Nhịp học của em · từ 01/10" (bản vẽ HS-Cham / HS-Luoi thầy duyệt) ═══════════
// Cảnh `?man=hs-nhip&nhe=…` (trang.tsx khối cùng tên; `/hs/nhip-hoc` GIẢ gia/nhip-hoc-em.ts). Chăm + Lười × 390×844 / 1440×900 × sáng / tối, CẢ
// TRANG; thêm Lười đang thoát (3/6), Chưa đều, Chưa đủ dữ liệu (điện thoại sáng) và lỗi (bảng ẩn gọn). Chạy riêng: tiền tố "7" (70-…73-).
const DS_NHE = [
  ...['light', 'dark'].flatMap((nen) => [[390, 844, 'dien-thoai'], [1440, 900, 'may-tinh']].flatMap(([w, hh, kho]) => [
    [`70-nhe-cham-${kho}${nen === 'dark' ? '-toi' : ''}`, 'hs-nhip&nhe=cham', w, hh, nen, true, /Thầy cũng thấy bảng này/],
    [`71-nhe-luoi-${kho}${nen === 'dark' ? '-toi' : ''}`, 'hs-nhip&nhe=luoi', w, hh, nen, true, /Thầy cũng thấy bảng này/],
  ])),
  ['72-nhe-luoi-dang-thoat-dien-thoai', 'hs-nhip&nhe=luoi-thoat', 390, 844, 'light', true, /Thầy cũng thấy bảng này/],
  ['72-nhe-chua-deu-dien-thoai', 'hs-nhip&nhe=chua-deu', 390, 844, 'light', true, /Thầy cũng thấy bảng này/],
  ['72-nhe-chua-du-dien-thoai-toi', 'hs-nhip&nhe=chua-du', 390, 844, 'dark', true, /Thầy cũng thấy bảng này/],
  ['72-nhe-30-ngay-dien-thoai', 'hs-nhip&nhe=cham-dai', 390, 844, 'light', true, /Thầy cũng thấy bảng này/],
  ['72-nhe-30-ngay-may-tinh-toi', 'hs-nhip&nhe=cham-dai', 1440, 900, 'dark', true, /Thầy cũng thấy bảng này/],
  ['73-nhe-loi-an-gon-dien-thoai', 'hs-nhip&nhe=loi', 390, 844, 'light', false, /Chào Minh Anh/],
  // phía thầy: ô Lười ở Hôm nay nói đường thoát; tấm Hồ sơ làm bài lấy NHÓM làm nhãn chính + chip đối phó riêng (bộ giả gia/nhip-hoc.ts)
  ['74-nhe-thay-hom-nay-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', false, /Hôm nay của thầy/, 'hn:cho'],
  ['74-nhe-thay-ho-so-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', false, /Hôm nay của thầy/, 'hn:ho-so'],
  ['74-nhe-thay-ho-so-dien-thoai-toi', 'gv-hom-nay&nh=1', 390, 844, 'dark', false, /Hôm nay của thầy/, 'hn:ho-so'],
]
// ═══════════ hết LÀN NHỊP EM 12/10C ═══════════

// ═══════════ LÀN THẺ HÔM NAY 12/10E: app học sinh › Hôm nay — MỘT thẻ "Hôm nay của em" (gộp vòng Mục tiêu hôm nay + bảng Nhịp học, thầy 12/10) ═══════════
// Cảnh `?man=hs-the&the=luoi|cham|chua-deu|du|loi` (trang.tsx khối cùng tên). Lười (7/32 như ảnh thầy) · Chăm · Chưa đều · đủ mức · `/hs/nhip-hoc` lỗi ×
// 390×844 / 1440×900 × sáng / tối, CẢ TRANG. Thêm nền 'ep-toi' = máy tối + trình duyệt ÉP TỐI trang web (Chromium `forceDarkModeEnabled`, như Samsung Internet
// / Chrome "tối cho trang web" trên máy thầy) — thẻ khai `color-scheme` nên vẫn đúng màu tối đã đo. Chạy riêng: tiền tố "the1210e".
const DS_THE1210E = [
  ...['light', 'dark'].flatMap((nen) => [[390, 844, 'dien-thoai'], [1440, 900, 'may-tinh']].flatMap(([w, hh, kho]) =>
    ['luoi', 'cham', 'chua-deu', 'du', 'loi'].map((the) =>
      [`the1210e-${the}-${kho}${nen === 'dark' ? '-toi' : ''}`, `hs-the&the=${the}`, w, hh, nen, true, the === 'loi' ? /Còn 25 câu|Còn/ : /Thầy cũng thấy bảng này/]))),
  ['the1210e-luoi-dien-thoai-ep-toi', 'hs-the&the=luoi', 390, 844, 'ep-toi', true, /Thầy cũng thấy bảng này/],
  ['the1210e-du-dien-thoai-ep-toi', 'hs-the&the=du', 390, 844, 'ep-toi', true, /Thầy cũng thấy bảng này/],
  ['the1210e-luoi-khong-ho-so-dien-thoai', 'hs-the&the=luoi&hs=0', 390, 844, 'light', false, /Thầy cũng thấy bảng này/],
]
// ═══════════ hết LÀN THẺ HÔM NAY 12/10E ═══════════

// ═══════════ LÀN MÀN LÀM BÀI 12/10D: màn làm bài học sinh theo bản vẽ dot13 thầy duyệt 12/10 (7 trạng thái) ═══════════
// Cảnh `?man=lam13[&lam=g7]` (trang.tsx khối cùng tên; máy chủ giả gia/lam-bai-1210d.ts). Thao tác `lam13:<bước » bước…>` (khối xử lý cùng tên bên dưới):
// tn:<regex> chạm ô trắc nghiệm · ds:a=Đúng,b=Sai chạm nút của ý · nut:<regex> bấm nút · phim:<kí tự> gõ phím máy tính · dau = cuộn khung về đầu.
// Chặng 2 (bản vẽ): câu 1 đúng, 2 sai, 3 đúng ⇒ câu 4 Đúng–sai (9/24) · nộp sai ý d · câu 5 trắc nghiệm chọn B · đúng · câu 6 gõ 1,2 · xong chặng (12/24).
// 390×844 sáng + tối cả 7 trạng thái; 390×1180 (đúng khung bản vẽ Đúng–sai) cho hai trạng thái cao; 1440×900 vài trạng thái. Chạy riêng: tiền tố "lam13".
const L13_TOI_CAU4 = 'tn:^A » nut:^Nộp câu » nut:^Câu tiếp theo » tn:^A » nut:^Nộp câu » nut:^Câu tiếp theo » tn:^B » nut:^Nộp câu » nut:^Câu tiếp theo'
const L13_NOP4 = `${L13_TOI_CAU4} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Nộp câu$`
const L13_CAU5 = `${L13_NOP4} » nut:^Câu tiếp theo » tn:^B`
const L13_CAU6 = `${L13_CAU5} » nut:^Nộp câu » nut:^Câu tiếp theo » phim:1,2`
const L13_CANH = [
  ['1-dung-sai', 'lam13', /Câu 1\/6/, `lam13:${L13_TOI_CAU4} » ds:a=Đúng,b=Đúng » dau`],
  ['2-trac-nghiem', 'lam13', /Câu 1\/6/, `lam13:${L13_CAU5} » dau`],
  ['3-tra-loi-ngan', 'lam13', /Câu 1\/6/, `lam13:${L13_CAU6} » dau`],
  ['4-hoc-huong-dan', 'lam13&lam=g7', /Câu này em chọn làm thế nào/, 'lam13:dau'],
  ['5-phan-hoi-sai', 'lam13', /Câu 1\/6/, `lam13:${L13_NOP4}`],
  ['6-phan-hoi-dung', 'lam13', /Câu 1\/6/, `lam13:${L13_CAU5} » nut:^Nộp câu`],
  ['7-xong-chang', 'lam13', /Câu 1\/6/, `lam13:${L13_CAU6} » nut:^Nộp câu » nut:^Kết thúc chặng`],
]
const DS_LAM13 = [
  ...['light', 'dark'].flatMap((nen) => L13_CANH.map(([t, m, cho, viec]) => [`lam13-${t}-doc${nen === 'dark' ? '-toi' : ''}`, m, 390, 844, nen, false, cho, viec])),
  ...L13_CANH.filter(([t]) => /dung-sai|phan-hoi-sai/.test(t)).map(([t, m, cho, viec]) => [`lam13-${t}-doc-ca-khung`, m, 390, 1180, 'light', false, cho, viec]),
  ...L13_CANH.filter(([t]) => /dung-sai|tra-loi-ngan|hoc-huong-dan|phan-hoi-sai|xong/.test(t)).map(([t, m, cho, viec]) => [`lam13-${t}-may-tinh`, m, 1440, 900, 'light', false, cho, viec]),
  ['lam13-1-dung-sai-may-tinh-toi', 'lam13', 1440, 900, 'dark', false, /Câu 1\/6/, `lam13:${L13_TOI_CAU4} » ds:a=Đúng,b=Đúng » dau`],
  ['lam13-3-tra-loi-ngan-ngang', 'lam13', 844, 390, 'light', false, /Câu 1\/6/, `lam13:${L13_CAU6} » dau`],
]
// ═══════════ hết LÀN MÀN LÀM BÀI 12/10D ═══════════

// ═══════════ LÀN HỒ SƠ EM 12/10F: app học sinh — bấm bảng "Nhịp học của em" ⇒ tấm "Hồ sơ làm bài của em" (tấm thầy, chế độ học sinh) ═══════════
// Cảnh `?man=hs-ho-so&nhe=…` (trang.tsx khối cùng tên; ba lệnh `/hs/...` GIẢ gia/ho-so-em-hs.ts). 390×844 + 1440×900 × sáng / tối: đầu tấm (`hse:dau`)
// và CUỘN TỚI ĐÁY bằng con lăn trên thân tấm (`hse:day` — kiểm trang phía sau đứng yên, thân tấm tới đáy); thêm thẻ Toàn bộ lịch sử (`hse:lich-su`).
// Mỗi ảnh đo TƯƠNG PHẢN mọi chữ trong tấm (≥ 4,5:1; chữ lớn ≥ 3:1) — in ở cuối như "Tương phản < ngưỡng". Chạy riêng: tiền tố "hse" (hse-1-…hse-3-).
const DS_HSE = [
  ...['light', 'dark'].flatMap((nen) => [[390, 844, 'dien-thoai'], [1440, 900, 'may-tinh']].flatMap(([w, hh, kho]) => [
    [`hse-1-luoi-dau-${kho}${nen === 'dark' ? '-toi' : ''}`, 'hs-ho-so&nhe=luoi', w, hh, nen, false, /Hồ sơ làm bài của em/, 'hse:dau'],
    [`hse-2-luoi-day-${kho}${nen === 'dark' ? '-toi' : ''}`, 'hs-ho-so&nhe=luoi', w, hh, nen, false, /Hồ sơ làm bài của em/, 'hse:day'],
  ])),
  ['hse-3-cham-dau-dien-thoai', 'hs-ho-so&nhe=cham', 390, 844, 'light', false, /Hồ sơ làm bài của em/, 'hse:dau'],
  ['hse-3-lich-su-dien-thoai-toi', 'hs-ho-so&nhe=luoi', 390, 844, 'dark', false, /Hồ sơ làm bài của em/, 'hse:lich-su'],
  ['hse-3-lich-su-may-tinh', 'hs-ho-so&nhe=luoi', 1440, 900, 'light', false, /Hồ sơ làm bài của em/, 'hse:lich-su'],
]
const tuongPhanThap = []
// ═══════════ hết LÀN HỒ SƠ EM 12/10F ═══════════

// ═══════════ «TRONG» NHÓM 3 (26/10): khung app thầy + Hôm nay + việc trên lớp — 3 khổ × sáng/tối, cả trang; `-cu` = `&trong=tat` (giao diện cũ). Tiền tố "t3-". ═══════════
const KHO_T3 = [[390, 844, 'doc'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']]
const t3 = (ten, man, cho, viec) => [
  ...['light', 'dark'].flatMap((nen) => KHO_T3.map(([w, hh, kho]) => [`t3-${ten}-${kho}${nen === 'dark' ? '-toi' : ''}`, man, w, hh, nen, true, cho, viec])),
  [`t3-${ten}-may-tinh-cu`, `${man}&trong=tat`, 1440, 900, 'light', true, cho, viec],
]
const DS_T3 = [
  ...t3('hom-nay', 'gv-hom-nay&nh=1', /Hôm nay của thầy/, 'hn:cho'),
  ...t3('hanh-trinh', 'gv-nhip&ht2=1', /Hành trình giỏi Hóa/, 'cho:Kiểm tra ôn tập'),
  ...t3('diem-danh', 'gv-nhip&ht2=1&dd12c=1', /Hành trình giỏi Hóa/, 'dd12c:buoc1'),
  ...t3('cai-dat', 'gv-cai-dat', /Cài đặt/),
  ...t3('len-bang', 'gv-len-bang&ht2=1', /./, 'tab:Kiểm tra đầu giờ'),
  ...t3('chieu', 'gv-chieu&remote=PHIEN1', /Hoàng Bảo Ngọc/),
]
// ═══════════ hết «TRONG» NHÓM 3 ═══════════

/** [tên ảnh, ?man=, rộng, cao, nền ('light'|'dark'), cả trang?, chờ chữ (regex)] */
const DS = [
  ...DS_T3, // «TRONG» NHÓM 3
  ...DS_HSE, // LÀN HỒ SƠ EM 12/10F
  ...DS_THE1210E, // LÀN THẺ HÔM NAY 12/10E
  ...DS_LAM13, // LÀN MÀN LÀM BÀI 12/10D
  ...DS_NHE, // LÀN NHỊP EM 12/10C
  ...DS_HN, // LÀN HÔM NAY 12/10B
  ...DS_HS12, // LÀN HỌC SINH 12/10
  ...DS_TTC, // LÀN THẦY TỰ CHỮA 12/10
  ...DS_CB, // LÀN CHỮA BÀI 12/10B
  ...DS_HT2, // LÀN HÀNH TRÌNH 12/10B
  ...DS_DD12C, // LÀN ĐIỂM DANH 12/10C
  ['01a-hom-nay-doc', 'sanh', 390, 844, 'light', true, /Hôm nay/],
  ['01a-hom-nay-doc-toi', 'sanh', 390, 844, 'dark', true, /Hôm nay/],
  ['01b-hom-nay-ngang-dien-thoai', 'sanh', 844, 390, 'light', false, /Hôm nay/],
  ['01b-hom-nay-ngang-dien-thoai-toi', 'sanh', 844, 390, 'dark', false, /Hôm nay/],
  ['01c-hom-nay-may-tinh-toi', 'sanh', 1440, 960, 'dark', false, /Hôm nay/],
  ['01c-hom-nay-may-tinh', 'sanh', 1440, 960, 'light', false, /Hôm nay/],
  ['01d-hom-nay-xong', 'sanh-xong', 390, 844, 'light', true, /Hôm nay/],
  ['01e-hom-nay-ca-dang-mo', 'sanh-ca-mo', 390, 844, 'light', false, /Ca kiểm tra đang mở/],
  ['01f-hom-nay-dang-tai', 'sanh-dang-tai', 390, 844, 'light', false, /Hành trình/],









  // Hành trình (thầy 09/10 tối: "chỉ cần giữ lại phần dạy học" + "kiểm tra đầu giờ giữ lại"): ba thẻ Dạy học · Kiểm tra đầu giờ · Cần thầy chữa;
  // Cần thầy chữa = MỘT danh sách (chờ chữ "chỗ cần chữa"), bấm một dòng ⇒ chỗ làm việc; Chiến dịch đã giao = trang riêng (mở từ Cài đặt).
  ['14-gv-day-hoc', 'gv-nhip', 1440, 960, 'light', false, /Hành trình giỏi Hóa/, 'tieu-de:Điểm danh'],
  ['14-gv-day-hoc-toi', 'gv-nhip', 1440, 960, 'dark', false, /Hành trình giỏi Hóa/, 'tieu-de:Điểm danh'],
  ['14-gv-day-hoc-dien-thoai', 'gv-nhip', 390, 844, 'light', true, /Hành trình giỏi Hóa/, 'tieu-de:Điểm danh'],
  ['14-gv-dau-gio', 'gv-nhip&the=dau-gio', 1440, 960, 'light', false, /Hành trình giỏi Hóa/, 'tieu-de:Điểm danh'],
  ['14-gv-dau-gio-dien-thoai-toi', 'gv-nhip&the=dau-gio', 390, 844, 'dark', true, /Hành trình giỏi Hóa/, 'tieu-de:Điểm danh'],
  ['14-gv-can-chua', 'gv-nhip&the=can-chua', 1440, 960, 'light', true, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ['14-gv-can-chua-toi', 'gv-nhip&the=can-chua', 1440, 960, 'dark', true, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ['14-gv-can-chua-dien-thoai', 'gv-nhip&the=can-chua', 390, 844, 'light', true, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ['14-gv-can-chua-dien-thoai-toi', 'gv-nhip&the=can-chua', 390, 844, 'dark', true, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ['14-gv-can-chua-ngang', 'gv-nhip&the=can-chua', 844, 390, 'light', true, /Hành trình giỏi Hóa/, 'cho:chỗ cần chữa'],
  ['14-gv-can-chua-loc-khoi-12', 'gv-nhip&the=can-chua', 1440, 960, 'light', true, /Hành trình giỏi Hóa/, 'bam-radio:Khối 12'],
  ['14-gv-can-chua-chieu', 'gv-nhip&the=can-chua', 1440, 960, 'light', true, /Hành trình giỏi Hóa/, 'bam:Chiếu lên bảng: Câu 17'],
  ['14-gv-can-chua-chieu-dien-thoai-toi', 'gv-nhip&the=can-chua', 390, 844, 'dark', true, /Hành trình giỏi Hóa/, 'bam:Chiếu lên bảng: Câu 17'],
  ['14-gv-can-chua-go-nut', 'gv-nhip&the=can-chua', 1440, 960, 'light', true, /Hành trình giỏi Hóa/, 'bam:Gỡ nút thắt: Câu 6'],
  ['14-gv-can-chua-buoc-cuoi-toi', 'gv-nhip&the=can-chua', 1440, 960, 'dark', true, /Hành trình giỏi Hóa/, 'bam:Chữa trên lớp: Câu 31'],
  // Nhịp học (thầy 09/10 khuya: "hành trình để lại chỗ nhịp học, học sinh chưa làm và chưa hoàn thành đủ ưu tiên hiện lên đầu"): bảng từng em,
  // nhóm Chưa làm câu nào → Chưa đủ mức → Đủ mức; bấm một em ⇒ tấm Lịch sử làm câu (câu sai + số giây, toàn bộ lịch sử theo ngày).
  ['14-gv-nhip', 'gv-nhip&the=nhip', 1440, 960, 'light', false, /Hành trình giỏi Hóa/, 'cho:em chưa làm câu nào'],
  ['14-gv-nhip-toi', 'gv-nhip&the=nhip', 1440, 960, 'dark', false, /Hành trình giỏi Hóa/, 'cho:em chưa làm câu nào'],
  // dòng em dùng `content-visibility: auto` (chuẩn B16) ⇒ ảnh cả trang để trống dòng ngoài màn — chụp đúng khung nhìn.
  ['14-gv-nhip-khoi-12', 'gv-nhip&the=nhip&khoi=12', 1440, 960, 'light', false, /Hành trình giỏi Hóa/, 'cho:em chưa làm câu nào'],
  ['14-gv-nhip-dien-thoai', 'gv-nhip&the=nhip', 390, 844, 'light', false, /Hành trình giỏi Hóa/, 'cho:em chưa làm câu nào'],
  ['14-gv-nhip-dien-thoai-toi', 'gv-nhip&the=nhip', 390, 844, 'dark', false, /Hành trình giỏi Hóa/, 'cho:em chưa làm câu nào'],
  ['14-gv-nhip-ngang', 'gv-nhip&the=nhip', 844, 390, 'light', false, /Hành trình giỏi Hóa/, 'cho:em chưa làm câu nào'],
  ['14-gv-ho-so-em', 'gv-nhip&the=nhip&khoi=12', 1440, 960, 'light', false, /Hành trình giỏi Hóa/, 'ho-so:Trần Đức Huy'],
  ['14-gv-ho-so-em-toi', 'gv-nhip&the=nhip&khoi=12', 1440, 960, 'dark', false, /Hành trình giỏi Hóa/, 'ho-so:Trần Đức Huy'],
  ['14-gv-ho-so-em-lich-su', 'gv-nhip&the=nhip&khoi=12', 1440, 960, 'light', false, /Hành trình giỏi Hóa/, 'ho-so-ls:Trần Đức Huy'],
  ['14-gv-ho-so-em-lich-su-toi', 'gv-nhip&the=nhip&khoi=12', 1440, 960, 'dark', false, /Hành trình giỏi Hóa/, 'ho-so-ls:Trần Đức Huy'],
  ['14-gv-ho-so-em-dien-thoai', 'gv-nhip&the=nhip&khoi=12', 390, 844, 'light', false, /Hành trình giỏi Hóa/, 'ho-so:Trần Đức Huy'],
  ['14-gv-ho-so-em-dien-thoai-toi', 'gv-nhip&the=nhip&khoi=12', 390, 844, 'dark', false, /Hành trình giỏi Hóa/, 'ho-so:Trần Đức Huy'],
  ['14-gv-ho-so-em-lich-su-dien-thoai', 'gv-nhip&the=nhip&khoi=12', 390, 844, 'light', false, /Hành trình giỏi Hóa/, 'ho-so-ls:Trần Đức Huy'],
  // ---------------------------------------------------------------- LÀN GIÁO VIÊN 12/10: Hành trình › Bài hằng ngày (bảng nhiệt em × ngày,
  // em thiếu nhiều ngày nhất đứng đầu) + tấm Hồ sơ làm bài trùng tu (nhãn thái độ + lý do bằng số, ô số, lịch, biểu đồ, sáu tín hiệu). Máy 1440×900,
  // điện thoại 390×844, sáng + tối. `bhn:<hàng>|cuoi[:cuon|:tin-hieu]` = bấm em ở hàng ấy (`doi-pho` = hàng em "Có dấu hiệu đối phó" của bộ giả), cuộn thân
  // tấm tới lịch + biểu đồ / sáu tín hiệu; `bhn-bang` = cuộn tới bảng (điện thoại).
  // ĐÃ GỠ 12/10B: các cảnh 40–48-gv mở thẻ Hành trình › Bài hằng ngày — thẻ ấy bỏ khỏi Hành trình (thầy duyệt bản vẽ "Hành trình còn 2 mục");
  // bảng nhiệt + tấm Hồ sơ làm bài nay mở từ Hôm nay › Nhịp học: xem cảnh 62–67-hn (LÀN HÔM NAY 12/10B).
  // ---------------------------------------------------------------- hết LÀN GIÁO VIÊN 12/10
  // ═════════ LÀN BÀI MỚI 7 NGÀY 12/10: Hành trình › Bài mới trong 7 ngày (trùng tu). Máy 1440×900 + điện thoại 390×844, sáng + tối.
  // `g7:<việc>`: dau = đầu thẻ · ds = danh sách chữa · ho-tro = mở Học sinh cần hỗ trợ của dòng đầu · loc = lọc Nhiều học sinh sai + xếp tỉ lệ sai ·
  // tien-do = thẻ Tiến độ học sinh · soan = bấm "Mở câu và chữa" dòng đầu (tấm soạn phần chữa). Chạy riêng: tiền tố "5" (50-…57-).
  ...['light', 'dark'].flatMap((nen) => {
    const k = nen === 'dark' ? '-toi' : ''
    return [[1440, 900, 'may-tinh'], [390, 844, 'dien-thoai']].flatMap(([w, hh, kho]) =>
      [['50', 'dau'], ['51', 'ds'], ['52', 'ho-tro'], ['53', 'loc'], ['54', 'tien-do'], ['55', 'soan']].map(([so, v]) =>
        [`${so}-gv-g7-${v}-${kho}${k}`, 'gv-nhip&the=goi-7', w, hh, nen, false, /Hành trình giỏi Hóa/, `g7:${v}`]))
  }),
  ['56-gv-g7-toan-trang-may-tinh', 'gv-nhip&the=goi-7', 1440, 900, 'light', true, /Hành trình giỏi Hóa/, 'g7:dau'],
  ['57-gv-g7-chua-co-bai-dien-thoai', 'gv-nhip&the=goi-7&g7=trong', 390, 844, 'light', false, /Hành trình giỏi Hóa/, 'cho:Chưa có bài mới trong 7 ngày'],
  ['57-gv-g7-loi-may-tinh', 'gv-nhip&the=goi-7&g7=loi', 1440, 900, 'light', false, /Hành trình giỏi Hóa/, 'cho:Không nối được máy chủ'],
  ['57-gv-g7-thieu-nguon-may-tinh-toi', 'gv-nhip&the=goi-7&g7=thieu-nguon', 1440, 900, 'dark', false, /Hành trình giỏi Hóa/, 'cho:Bộ bài chưa đủ nguồn'],
  // ═════════ hết LÀN BÀI MỚI 7 NGÀY 12/10
  ['14-gv-chien-dich-da-giao', 'gv-nhip&the=chien-dich', 1440, 960, 'light', false, /Chiến dịch đã giao/],
  ['14-gv-chien-dich-da-giao-dien-thoai-toi', 'gv-nhip&the=chien-dich', 390, 844, 'dark', true, /Chiến dịch đã giao/],
  ...['light', 'dark'].flatMap((nen) => [[390,844,'doc'],[844,390,'ngang'],[1440,900,'may-tinh']].flatMap(([w,h,k]) => [
    [`20-ph-${k}-${nen}`, 'ph', w,h,nen,true,/Hôm nay/],

  ])),
  ...[[390,844,'doc'],[844,390,'ngang'],[1440,960,'may-tinh']].flatMap(([w,h,k]) => [
    ...[['hanh-trinh','Hành trình'],['on-lai','Ôn lại'],['cua-em','Của em']].map(([m,chu]) => [`22-hs-${m}-${k}`, 'sanh', w,h,'light',true,/Hôm nay/,`hs:${chu}`]),
    // Câu đã làm (09/10): thầy gửi ảnh thẻ chồng chữ ở máy tính — chụp sáng + tối mọi khổ
    [`25-hs-cau-da-lam-${k}`, 'cau-da-lam', w,h,'light',false,/Câu đã làm/],
    [`25-hs-cau-da-lam-${k}-toi`, 'cau-da-lam', w,h,'dark',false,/Câu đã làm/],
    // Cùng gỡ câu này (10/10): thầy gửi ảnh chữ chìm — chụp sáng + tối mọi khổ
    [`26-hs-cung-go-${k}`, 'chua-cau-sai', w,h,'light',false,/Chữa trực tiếp câu gốc/], // 12/10: trạng thái chờ học liệu nay mở lối Chữa trực tiếp câu gốc
    [`26-hs-cung-go-${k}-toi`, 'chua-cau-sai', w,h,'dark',false,/Chữa trực tiếp câu gốc/],
    [`26-hs-cung-go-buoc-${k}`, 'chua-cau-sai&go=buoc', w,h,'light',false,/Số mol NaOH/],
    [`26-hs-cung-go-buoc-${k}-toi`, 'chua-cau-sai&go=buoc', w,h,'dark',false,/Số mol NaOH/],
    // App học sinh tập trung học (PR231): 4 mục + màn làm bài, sáng/tối
    ...['light','dark'].flatMap((nen) => [['hom-nay','Hôm nay'],['hanh-trinh','Hành trình'],['on-lai','Ôn & sửa'],['ket-qua','Kết quả']].map(([m,chu]) => [`30-hs-moi-${m}-${k}${nen === 'dark' ? '-toi' : ''}`, 'hs-moi', w,h,nen,false,/Chào Minh Anh/, m === 'hom-nay' ? undefined : `ht:${chu}`])),
    [`30-hs-moi-ca-mo-${k}`, 'hs-moi&ca=1', w,h,'light',false,/Ca kiểm tra đang mở/],
    [`30-hs-moi-cua-em-${k}`, 'hs-moi', w,h,'light',false,/Chào Minh Anh/,'nut:Của em'],
    [`30-hs-moi-lam-${k}`, 'hs-lam', w,h,'light',false,/Thuỷ phân hoàn toàn/],
    [`30-hs-moi-lam-${k}-toi`, 'hs-lam', w,h,'dark',false,/Thuỷ phân hoàn toàn/],
    // Luyện thêm có màu nhấn (09/10): chụp thêm Hành trình nền TỐI
    [`22-hs-hanh-trinh-${k}-toi`, 'sanh', w,h,'dark',true,/Hôm nay/,'hs:Hành trình'],
    ...[['tien-bo','Tiến bộ'],['ca-kiem-tra','Ca kiểm tra'],['loi-thay','Nhận xét của thầy'],['thong-tin','Thông tin và giao diện']].flatMap(([m,chu]) => ['light','dark'].map((nen) => [`23-ph-${m}-${k}${nen === 'dark' ? '-toi' : ''}`, 'ph',w,h,nen,true,/Hôm nay/,`ph:${m}:${chu}`])),
    ...[['gv-hom-nay',/Hôm nay của thầy/],['gv-kho',/Kho đề/],['gv-cai-dat',/Cài đặt/],['gv-hoc-sinh',/Học sinh/],['gv-mo-ca',/Mở ca kiểm tra/],['gv-go-nut',/Bàn gỡ nút thắt/],['gv-duyet',/Duyệt lời giải/]].map(([m,chu]) => [`24-${m}-${k}`,m,w,h,'light',true,chu]),
    // trung tu 09/10: app thầy chụp cả nền TỐI (máy tối) cho đủ "sáng + tối"
    ...[['gv-hom-nay',/Hôm nay của thầy/],['gv-hoc-sinh',/Học sinh/],['gv-mo-ca',/Mở ca kiểm tra/],['gv-cai-dat',/Cài đặt/],['gv-kho',/Kho đề/]].map(([m,chu]) => [`24-${m}-${k}-toi`,m,w,h,'dark',true,chu]),
  ]),
  // trung tu 09/10: máy SÁNG nhưng thầy ép nút "Tối" trong Cài đặt (data-giao-dien) — không được nửa sáng nửa tối
  // «Trong» nhóm 4 (26/10) — màn quản lý app thầy, 3 khổ × sáng/tối; thêm `&trong=tat` để soát giao diện cũ.
  ...[[390,844,'doc'],[844,390,'ngang'],[1440,900,'may-tinh']].flatMap(([w,h,k]) => ['light','dark'].flatMap((nen) =>
    [['gv-lich-su-ca',/Ca kiểm tra/],['gv-hs-hoi',/Học sinh hỏi/],['gv-theo-doi',/Kiểm tra 15 phút/],['gv-hoc-sinh',/Học sinh/],['gv-mo-ca',/Mở ca kiểm tra/],['gv-kho',/Kho đề/],['gv-duyet&ma=12-KT-C1-D4',/Duyệt lời giải/],['gv-go-nut',/Bàn gỡ nút thắt/],['gv-toan-canh',/Trần Đức Huy/],['gv-giao-btvn',/Giao|bài tập/i],['gv-giao-tuan',/Giao|tuần/i]].map(([m,chu]) => [`27-tr4-${m.split('&')[0]}-${k}${nen === 'dark' ? '-toi' : ''}`,m,w,h,nen,true,chu]))),
  ...[[390,844,'doc'],[1440,900,'may-tinh']].flatMap(([w,h,k]) => ['light','dark'].map((nen) => [`27-tr4-gv-ho-so-${k}${nen === 'dark' ? '-toi' : ''}`,'gv-toan-canh',w,h,nen,false,/Trần Đức Huy/,'nut:Hồ sơ làm bài'])),
  ...[['gv-lich-su-ca',/Ca kiểm tra/],['gv-theo-doi',/Kiểm tra 15 phút/],['gv-hoc-sinh',/Học sinh/]].map(([m,chu]) => [`27-tr4-cu-${m}`,`${m}&trong=tat`,1440,900,'light',true,chu]),
  ['24-gv-hom-nay-ep-toi', 'gv-hom-nay&giao=toi', 1440, 900, 'light', false, /Hôm nay của thầy/],
  ['24-gv-hoc-sinh-ep-toi', 'gv-hoc-sinh&giao=toi', 1440, 900, 'light', false, /Học sinh/],
  ['24-gv-mo-ca-ep-sang', 'gv-mo-ca&giao=sang', 1440, 900, 'dark', false, /Mở ca kiểm tra/],
  ['18-gv-ma-tran-de', 'gv-ma-tran', 1440, 700, 'light', false, /Ma trận đề/],
  // ---- LÀN PHỤ HUYNH 12/10 (khối riêng): app phụ huynh trùng tu — Hôm nay (khối chính có câu đúng/sai/giây · Gợi ý nhắc con · Lịch học tuần này)
  // và Tiến bộ (Đúng và sai theo ngày · Thời gian làm câu · Câu sai gần đây). Điện thoại 390×844 + máy tính 1440×900, sáng + tối; thêm trạng thái lỗi.
  ...['light', 'dark'].flatMap((nen) => [[390, 844, 'dien-thoai'], [1440, 900, 'may-tinh']].flatMap(([w, h, k]) => [
    [`40-ph1210-hom-nay-${k}${nen === 'dark' ? '-toi' : ''}`, 'ph', w, h, nen, true, /Gợi ý nhắc con/],
    [`40-ph1210-tien-bo-${k}${nen === 'dark' ? '-toi' : ''}`, 'ph', w, h, nen, true, /Hôm nay/, 'ph:tien-bo:Thời gian làm câu'],
  ])),
  ['40-ph1210-hom-nay-loi', 'ph&tq=loi', 390, 844, 'light', true, /Máy chủ đang bận/],
  // ---- hết khối LÀN PHỤ HUYNH 12/10
]

const loiTrang = []
const tran = []
const chamNho = []
const khongCon = CHON.filter(c => !DS.some(([ten]) => ten.startsWith(c)))
if (khongCon.length) {
  await trinh.close()
  may.close()
  throw Error('Không còn cảnh chụp: ' + khongCon.join(', '))
}

for (const [ten, m, w, hgt, nen, ca, cho, viec] of DS) {
  if (CHON.length && !CHON.some((c) => ten.startsWith(c))) continue
  // LÀN THẺ HÔM NAY 12/10E: nền 'ep-toi' = máy tối + trình duyệt ép tối trang web (một trình duyệt riêng có cờ, mở khi cần)
  const ctx = await (nen === 'ep-toi' ? await trinhEpToi() : trinh).newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: nen === 'ep-toi' ? 'dark' : nen, hasTouch: w < 900, isMobile: w < 500 })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(8000)
  t.on('pageerror', (e) => { const chu = `${ten}: ${e.message}`; loiTrang.push(chu); console.log(chu) })
  t.on('console', (msg) => { if (msg.type() === 'error' && !/Failed to load resource/.test(msg.text())) loiTrang.push(`${ten}: console ${msg.text().slice(0, 200)}`) })
  await t.goto(`${trangGoc}?man=${m}`)
  try {
    if (m.startsWith('gv-')) {
      await t.getByRole('heading', { name:m === 'gv-kho' ? /Kho đề|Ngân hàng câu hỏi/ : cho }).first().waitFor({ timeout:20000 })
    } else await t.getByText(cho).first().waitFor({ timeout: 20000 })
  } catch {
    loiTrang.push(`${ten}: không thấy chữ ${cho}`)
  }
  try {
    if (viec?.startsWith('nut:')) {
      // 12/10 (làn học sinh): nhiều nút liền nhau ngăn bằng " » " — bấm lần lượt (một nút như cũ).
      for (const ten of viec.slice(4).split(' » ')) {
        await t.getByRole('button', { name:ten, exact:true }).first().click()
        await t.waitForTimeout(400)
      }
    } else if (viec?.startsWith('ht:')) {
      await t.getByRole('navigation', { name:'Điều hướng học sinh' }).getByRole('button', { name:viec.slice(3), exact:true }).click()
      await t.waitForTimeout(250)
    } else if (viec?.startsWith('hs:')) {
      await t.getByRole('navigation', { name:'Điều hướng chính' }).getByRole('button', { name:viec.slice(3),exact:true }).click()
      await t.getByRole('heading', { name:new RegExp(viec.slice(3)) }).first().waitFor()
    } else if (viec?.startsWith('ph:')) {
      const [,hash,chu] = viec.split(':')
      await t.evaluate(h => {location.hash=h}, hash)
      await t.getByRole('heading', {name:chu,exact:true}).waitFor()
    } else if (viec?.startsWith('tieu-de:')) {
      await t.getByRole('heading', { name: new RegExp(viec.slice(8)) }).first().waitFor({ timeout: 20000 })
    } else if (viec?.startsWith('tab:')) {
      // «TRONG» NHÓM 3: bấm một thẻ (role=tab) rồi chờ màn trong thẻ dựng xong
      await t.getByRole('tab', { name: viec.slice(4), exact: true }).first().click({ timeout: 20000 })
      await t.waitForTimeout(5000)
    } else if (viec?.startsWith('cho:')) {
      await t.getByText(new RegExp(viec.slice(4))).first().waitFor({ timeout: 20000 })
    } else if (viec?.startsWith('ho-so:') || viec?.startsWith('ho-so-ls:')) {
      // Nhịp học › bấm cả dòng một em ⇒ tấm Lịch sử làm câu; `ho-so-ls` mở thêm thẻ con "Toàn bộ lịch sử".
      const ten = viec.slice(viec.indexOf(':') + 1)
      await t.getByRole('button', { name: new RegExp(`^${ten},`) }).first().click({ timeout: 20000 })
      const tam = t.getByRole('dialog')
      await tam.getByText('Số lượt làm câu').waitFor({ timeout: 20000 })
      if (viec.startsWith('ho-so-ls:')) await tam.getByRole('tab', { name: /Toàn bộ lịch sử/ }).click()
      await t.waitForTimeout(400)
    } else if (viec?.startsWith('bhn:')) {
      // LÀN GIÁO VIÊN 12/10: Bài hằng ngày › bấm nút em đầu / cuối bảng ⇒ tấm Hồ sơ làm bài; `:cuon` / `:tin-hieu` cuộn thân tấm tới khối ấy.
      const [, viTri, cuon] = viec.split(':')
      await t.locator('.gvv2-bhn-em').first().waitFor({ timeout: 20000 })
      const hang = viTri === 'doi-pho' ? await t.evaluate(() => globalThis.__HANG_DOI_PHO ?? 1) : Number(viTri)
      const nut = viTri === 'cuoi' ? t.locator('.gvv2-bhn-em').last() : t.locator('.gvv2-bhn-em').nth(Math.max(0, hang - 1))
      await nut.click({ timeout: 20000 })
      const tam = t.getByRole('dialog')
      await tam.locator('.gvv2-tdo-dau').waitFor({ timeout: 20000 })
      await tam.getByText('Số lượt làm câu').waitFor({ timeout: 20000 })
      if (cuon === 'cau-dung') await tam.getByRole('tab', { name: /Câu đúng/ }).click()
      // cuộn THÂN TẤM (không cuộn trang phía sau) tới khối cần chụp
      const dich = { cuon: 'gvv2-tdo-lich-tieu', 'tin-hieu': 'gvv2-tdo-th-tieu', 'cau-dung': 'gvv2-hs-the-cau-dung' }[cuon ?? '']
      if (dich) await t.evaluate((id) => { const el = document.getElementById(id); const than = el?.closest('.gvv2-hs-than'); if (el && than) than.scrollTop += el.getBoundingClientRect().top - than.getBoundingClientRect().top - 12 }, dich)
      await t.waitForTimeout(400)
    } else if (viec === 'bhn-bang') {
      await t.locator('.gvv2-bhn-em').first().waitFor({ timeout: 20000 })
      await t.evaluate(() => { const el = document.querySelector('.gvv2-bhn-cuon'); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72) })
      await t.waitForTimeout(300)
    } else if (viec?.startsWith('bhn-xep:')) {
      await t.locator('.gvv2-bhn-em').first().waitFor({ timeout: 20000 })
      await t.locator('.gvv2-bhn-ngay-nut', { hasText: viec.slice(8) }).first().click({ timeout: 20000 })
      await t.waitForTimeout(300)
    } else if (viec?.startsWith('g7:')) {
      // LÀN BÀI MỚI 7 NGÀY 12/10 — chờ hàng ô số rồi làm đúng một việc; cuộn trang (không cuộn khung) tới khối cần chụp.
      const v = viec.slice(3)
      const cuonToi = (chon) => t.evaluate((c) => { const el = document.querySelector(c); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (innerWidth < 900 ? 72 : 16)) }, chon)
      await t.getByText('Câu cần chữa').first().waitFor({ timeout: 20000 })
      if (v === 'ds') await cuonToi('.g7-tab')
      if (v === 'ho-tro') { await t.locator('.g7-nut-mo').first().click(); await cuonToi('.g7-hang') }
      if (v === 'loc') {
        await t.getByRole('radio', { name: /^Nhiều học sinh sai/ }).click()
        await t.getByRole('radio', { name: 'Tỉ lệ sai cao trước' }).click()
        await cuonToi('.g7-loc')
      }
      if (v === 'tien-do') { await t.getByRole('tab', { name: /Tiến độ học sinh/ }).click(); await cuonToi('.g7-tab') }
      if (v === 'soan') {
        await t.getByRole('button', { name: 'Mở câu và chữa', exact: true }).first().click()
        await t.getByRole('dialog').getByText('Giải thích để học sinh học lại').waitFor({ timeout: 20000 })
      }
      await t.waitForTimeout(400)
    } else if (viec?.startsWith('ttc:') || viec?.startsWith('ttc-chieu:')) {
      // LÀN THẦY TỰ CHỮA 12/10: mở thẻ Thầy tự chữa → chọn bài → (chiếu → phím trên tờ).
      const [loai, khoaBai, phim] = viec.split(':')
      // 12/10B (làn Chữa bài): khối đổi tên "Chữa câu khó & tính toán", MỞ SẴN (không còn nút "Chọn đề"), nút chiếu "Chiếu lên bảng".
      const the = t.getByRole('region', { name: /Thầy tự chữa|Chữa câu khó/ })
      if (await the.getByRole('button', { name: 'Chọn đề' }).count()) await the.getByRole('button', { name: 'Chọn đề' }).click({ timeout: 20000 })
      await the.getByRole('combobox', { name: 'Lớp' }).selectOption('lop:12A1', { timeout: 20000 })
      await the.getByRole('combobox', { name: /Bài trong Dạy học/ }).selectOption(khoaBai)
      await the.getByText(/lớp sai/).first().waitFor({ timeout: 20000 })
      if (loai === 'ttc') {
        await t.waitForTimeout(300)
      } else {
        await the.getByRole('button', { name: /^Chiếu lên (máy chiếu|bảng)$/ }).click()
        const khung = t.frameLocator('.lop-xem-phieu iframe')
        await khung.locator('body.mc-noi').waitFor({ timeout: 20000 })
        await t.waitForTimeout(600)
        // phím gõ thẳng vào tài liệu của tờ (tờ nghe keydown trên document — như máy thầy bấm khi tờ đang có focus)
        for (const k of phim ?? '') {
          const key = k === '→' ? 'ArrowRight' : k
          await khung.locator('body').evaluate((b, key) => b.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })), key)
          await t.waitForTimeout(500)
        }
        if ((phim ?? '').includes('x')) await khung.locator('.mc-aisai.mc-mo .mc-sai-em').first().waitFor({ timeout: 20000 })
      }
    } else if (viec?.startsWith('cb:') || viec?.startsWith('cb-chieu:')) {
      // LÀN CHỮA BÀI 12/10B: khối (B) mở sẵn → chọn lớp 12A1 + bài → chờ dòng "Gọi lên bảng:" → (chiếu → phím trên tờ).
      const [loai, khoaBai, phim] = viec.split(':')
      const the = t.getByRole('region', { name: 'Chữa câu khó & tính toán' })
      await the.getByRole('combobox', { name: 'Lớp' }).selectOption('lop:12A1', { timeout: 20000 })
      await the.getByRole('combobox', { name: /Bài trong Dạy học/ }).selectOption(khoaBai)
      await the.getByText(/^Gọi lên bảng:/).first().waitFor({ timeout: 20000 })
      if (loai === 'cb') {
        await t.waitForTimeout(300)
      } else {
        await the.getByRole('button', { name: 'Chiếu lên bảng', exact: true }).click()
        const khung = t.frameLocator('.lop-xem-phieu iframe')
        await khung.locator('body.mc-noi').waitFor({ timeout: 20000 })
        await t.waitForTimeout(600)
        for (const k of phim ?? '') {
          await khung.locator('body').evaluate((b, key) => b.ownerDocument.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })), k)
          await t.waitForTimeout(k === 'l' ? 2600 : 600)
        }
      }
    } else if (viec?.startsWith('dd12c:')) {
      // LÀN ĐIỂM DANH 12/10C: chờ ô em vắng có nhóm Lười (Nhịp học đã về) rồi làm đúng một việc.
      const [, v, phim] = viec.split(':')
      // 21/10 Hành trình một trang 4 bước: bước 1 có thể đang gập (đã có em điểm danh ⇒ mở sẵn bước 2) — mở lại bước 1 trước.
      const moB1 = t.getByRole('button', { name: /^Mở (lại )?bước 1 · Điểm danh$/ })
      // «Trong» 26/10: bước gập không vẽ dòng riêng ⇒ mở bằng thước (nút bước 1 của «Các bước của buổi dạy»).
      const thuoc1 = t.locator('nav[aria-label="Các bước của buổi dạy"] li[data-tt] button').first()
      await moB1.or(thuoc1).or(t.getByText(/em đang Lười/).first()).first().waitFor({ timeout: 20000 })
      if (await moB1.isVisible()) await moB1.click()
      else if (!(await t.getByText(/em đang Lười/).first().isVisible())) await thuoc1.click()
      await t.getByText(/em đang Lười/).first().waitFor({ timeout: 20000 })
      if (v === 'chieu') {
        await t.getByRole('button', { name: 'Chiếu điểm danh', exact: true }).click()
        await t.locator('.ddc .ddc-em').first().waitFor({ timeout: 20000 })
      }
      if (v === 'nhip' || v === 'ho-so') {
        await t.getByRole('button', { name: 'Xong điểm danh · chiếu Nhịp học của lớp', exact: true }).click()
        await t.locator('.ddc .ddc-dong-em').first().waitFor({ timeout: 20000 })
      }
      for (const k of phim ?? '') await t.keyboard.press(k)
      if (v === 'ho-so') {
        // em đầu cột Chưa đều (nhãn thái độ của hồ sơ GIẢ chỉ có Chăm chỉ / Chưa đều / Đối phó — chọn em cùng nhóm để ảnh không tự mâu thuẫn)
        await t.locator('.ddc-cot[data-nhom="chua-deu"] .ddc-dong-em').first().click()
        await t.getByRole('dialog').getByText('Số lượt làm câu').first().waitFor({ timeout: 20000 })
      }
      if (v === 'muc' || v === 'muc-treo') await t.locator('.dd1-ot small').nth(2).waitFor({ timeout: 20000 }) // thanh Mức làm hỏi sau 1,5 giây
      if (v === 'muc-treo') await t.locator('.dd1-tong-nut[data-k="treo"]').click()
      if (v === 'muc-loi') await t.locator('.dd1-ml-loi').waitFor({ timeout: 20000 })
      if (v === 'vua') {
        await t.locator('.dd1-vua-dong').first().click()
        await t.getByRole('dialog').getByText('Số lượt làm câu').first().waitFor({ timeout: 20000 })
      }
      await t.waitForTimeout(500)
    } else if (viec?.startsWith('hn:')) {
      // LÀN HÔM NAY 12/10B: chờ khối Nhịp học có em rồi làm đúng một việc (ảnh toàn trang không cần cuộn; ảnh khung nhìn cuộn trang tới khối cần chụp).
      const v = viec.slice(3)
      const cuonToi = (chon) => t.evaluate((c) => { const el = document.querySelector(c); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (innerWidth < 900 ? 72 : 16)) }, chon)
      if (v === 'loi') await t.getByText(/Chưa tải được Nhịp học/).first().waitFor({ timeout: 20000 })
      else if (v === 'trong') await t.getByText(/Chưa có em nào nhận bài hằng ngày/).first().waitFor({ timeout: 20000 })
      else {
        await t.locator('.nht-em').first().waitFor({ timeout: 20000 })
        if (v === 'xem-du-luoi') {
          // mở rộng tại chỗ (đợt đầu 50 em) rồi cuộn tới ô tìm của cột — ảnh khung nhìn (toàn trang quá dài cho ảnh ≤ 150 KB)
          await t.getByRole('button', { name: /^Xem đủ \d+ em lười/ }).click()
          await t.getByRole('button', { name: 'Thu gọn' }).waitFor({ timeout: 20000 })
          await cuonToi('.nht-cot[data-kieu="luoi"]')
        }
        if (v === 'khoi-12') await t.getByRole('radio', { name: /^Khối 12/ }).click()
        if (v === 'ho-so') {
          await t.locator('.nht-em').first().click()
          await t.getByRole('dialog').getByText('Số lượt làm câu').waitFor({ timeout: 20000 })
        }
        if (v === 'bang') {
          await t.getByRole('button', { name: /Xem bảng từng ngày/ }).click()
          await t.locator('.gvv2-bhn-em').first().waitFor({ timeout: 20000 })
          await cuonToi('#nht-bang')
        }
        if (v === 'tab-cham') await t.getByRole('tab', { name: /^Chăm/ }).click()
        if (v === 'tab-doi-pho') await t.getByRole('tab', { name: /^Đối phó/ }).click()
      }
      await t.waitForTimeout(400)
    } else if (viec?.startsWith('hse:')) {
      // LÀN HỒ SƠ EM 12/10F: tấm mở sẵn — chờ đủ hai lệnh rồi làm đúng một việc; sau đó đo tương phản mọi chữ trong tấm.
      const v = viec.slice(4)
      const tam = t.getByRole('dialog')
      await tam.getByText('Số lượt làm câu').waitFor({ timeout: 20000 })
      await tam.locator('.gvv2-tdo-dau').waitFor({ timeout: 20000 })
      if (v === 'lich-su') {
        await tam.getByRole('tab', { name: /Toàn bộ lịch sử/ }).click()
        await t.evaluate(() => {
          const than = document.querySelector('.hs-ho-so-em .gvv2-hs-than')
          const o = document.getElementById('gvv2-hs-the-lich-su')
          if (than && o) than.scrollTop += o.getBoundingClientRect().top - than.getBoundingClientRect().top - 12
        })
      }
      if (v === 'day') {
        // vuốt bằng con lăn TRÊN thân tấm (không đặt scrollTop bằng mã) ⇒ chứng minh khung cuộn riêng tới đáy, trang phía sau đứng yên
        const hop = await tam.locator('.gvv2-hs-than').boundingBox()
        await t.mouse.move(hop.x + hop.width / 2, hop.y + hop.height / 2)
        for (let i = 0; i < 40; i++) { await t.mouse.wheel(0, 1200); await t.waitForTimeout(25) }
        await t.waitForTimeout(400)
        const kq = await t.evaluate(() => {
          const than = document.querySelector('.hs-ho-so-em .gvv2-hs-than')
          return { day: than.scrollTop + than.clientHeight >= than.scrollHeight - 2, top: Math.round(than.scrollTop), cao: than.scrollHeight, trang: (document.scrollingElement || document.documentElement).scrollTop, khoa: document.documentElement.hasAttribute('data-khoa-cuon') }
        })
        if (!kq.day) loiTrang.push(`${ten}: thân tấm chưa tới đáy (${kq.top}/${kq.cao}px)`)
        if (kq.trang !== 0) loiTrang.push(`${ten}: trang phía sau bị cuộn ${kq.trang}px`)
        if (!kq.khoa) loiTrang.push(`${ten}: chưa khoá trang phía sau`)
        console.log(`${ten}: thân tấm cuộn ${kq.top}px · tới đáy ${kq.day} · trang phía sau ${kq.trang}px · khoá ${kq.khoa}`)
      }
      await t.waitForTimeout(300)
      const tp = await t.evaluate(() => {
        const doc = (s) => {
          let m = /^rgba?\(([^)]+)\)$/.exec(s)
          if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
          m = /^color\(srgb ([^)]+)\)$/.exec(s)
          if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
          return null
        }
        const tron = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
        const nen = (el) => {
          const lop = []
          for (let e = el; e; e = e.parentElement) { const c = doc(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { lop.push(c); if (c[3] >= 1) break } }
          return lop.reverse().reduce((d, c) => tron(c, d), [255, 255, 255, 1])
        }
        const L = (c) => c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
        const tyLe = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
        const goc = document.querySelector('.hs-ho-so-em .gvv2-hs')
        const ra = []
        const daXet = new Set()
        const w = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT)
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const el = n.parentElement
          if (!n.textContent.trim() || daXet.has(el) || el.closest('.gvv2-an-chu, button:disabled')) continue
          daXet.add(el)
          const s = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          if (s.visibility === 'hidden' || r.width === 0 || r.height === 0) continue
          const mau = doc(s.color)
          if (!mau) { ra.push(`màu lạ ${s.color}`); continue }
          const bg = nen(el)
          let op = 1
          for (let e = el; e && e !== goc.parentElement; e = e.parentElement) op *= Number(getComputedStyle(e).opacity)
          const chu = tron([mau[0], mau[1], mau[2], mau[3] * op], bg)
          const co = parseFloat(s.fontSize)
          const nguong = co >= 24 || (co >= 18.66 && Number(s.fontWeight) >= 700) ? 3 : 4.5
          const k = tyLe(chu, bg)
          if (k < nguong) ra.push(`"${n.textContent.trim().slice(0, 28)}" ${k.toFixed(2)}`)
        }
        return { ra, so: daXet.size }
      })
      console.log(`${ten}: tương phản — ${tp.so} khối chữ, ${tp.ra.length} dưới ngưỡng`)
      if (tp.ra.length) tuongPhanThap.push(`${ten}: ${tp.ra.join(' | ')}`)
    } else if (viec?.startsWith('lam13:')) {
      // LÀN MÀN LÀM BÀI 12/10D: các bước ngăn bằng " » " (xem khối DS_LAM13).
      for (const buoc of viec.slice(6).split(' » ')) {
        const [loai, ...con] = buoc.split(':'); const gt = con.join(':')
        if (loai === 'tn') await t.getByRole('radio', { name: new RegExp(gt) }).first().click({ timeout: 20000 })
        else if (loai === 'nut') await t.getByRole('button', { name: new RegExp(gt) }).first().click({ timeout: 20000 })
        else if (loai === 'ds') for (const cap of gt.split(',')) { const [y, v] = cap.split('='); await t.getByRole('group', { name: `Chọn cho ý ${y}` }).getByRole('button', { name: v, exact: true }).click({ timeout: 20000 }) }
        else if (loai === 'phim') for (const k of gt) await t.keyboard.press(k)
        else if (loai === 'dau') await t.evaluate(() => { const k = document.querySelector('.ht2-lam')?.parentElement; if (k) k.scrollTop = 0 })
        await t.waitForTimeout(250)
      }
      // tràn ngang TRONG khung cuộn (documentElement không thấy được vì khung là `fixed`)
      const tranTrong = await t.evaluate(() => Math.max(0, ...[...document.querySelectorAll('.ht2-lam *')].map((e) => Math.round(e.getBoundingClientRect().right - innerWidth))))
      if (tranTrong > 0) tran.push(`${ten}: trong khung ${tranTrong}px`)
    } else if (viec?.startsWith('bam-radio:')) {
      await t.getByRole('radio', { name: new RegExp(viec.slice(10)) }).first().click({ timeout: 20000 })
    } else if (viec?.startsWith('bam:')) {
      await t.getByRole('button', { name: new RegExp(viec.slice(4)) }).first().click({ timeout: 20000 })
      await t.getByRole('button', { name: 'Danh sách cần chữa' }).waitFor()
      await t.waitForTimeout(600)
      await t.evaluate(() => window.scrollTo(0, 0))
    } else {}
  } catch (e) {
    const chu = `${ten}: thao tác ${viec} hỏng — ${String(e).slice(0, 300)}`
    loiTrang.push(chu)
    console.log(chu)
  }
  await t.waitForTimeout(900)
  const tr = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (tr > 0) tran.push(`${ten}: ${tr}px`)
  const nho = await t.evaluate(() =>
    [...document.querySelectorAll('button, a[href], [role="button"]')]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        const s = getComputedStyle(e)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 44 || r.height < 44)
      })
      .map((e) => `${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
  )
  if (nho.length) chamNho.push(`${ten}: ${nho.join(' | ')}`)
  for (const q of [72, 60, 50, 40, 32, 25, 20, 15]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: ca })
    if (buf.length <= 150 * 1024 || q === 15) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${tr}px`)
      break
    }
  }
  await ctx.close()
}
await trinh.close()
await epToi?.close() // LÀN THẺ HÔM NAY 12/10E
may.close()
console.log(`\nLỗi trang: ${loiTrang.length}`)
for (const l of loiTrang) console.log('  ' + l)
console.log(`Tràn ngang: ${tran.length}`)
for (const l of tran) console.log('  ' + l)
console.log(`Vùng chạm < 44px: ${chamNho.length}`)
for (const l of chamNho) console.log('  ' + l)
// LÀN HỒ SƠ EM 12/10F: chữ trong tấm dưới ngưỡng tương phản (4,5:1; chữ lớn 3:1) — chỉ cảnh `hse:`.
if (DS.some(([ten, , , , , , , viec]) => viec?.startsWith('hse:') && (!CHON.length || CHON.some((c) => ten.startsWith(c))))) {
  console.log(`Tương phản < ngưỡng (tấm hồ sơ em): ${tuongPhanThap.length}`)
  for (const l of tuongPhanThap) console.log('  ' + l)
}
process.exit(loiTrang.length || tran.length ? 1 : 0)
