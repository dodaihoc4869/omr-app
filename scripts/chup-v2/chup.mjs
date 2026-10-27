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
    [`42-hs12-tu-chua-${k}${t}`, 'hs12-tu-chua', w, hgt, nen, true, /Tự sửa lỗi/],
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
  ['73-nhe-loi-an-gon-dien-thoai', 'hs-nhip&nhe=loi', 390, 844, 'light', false, /Chào Minh Anh|chặng/i],
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
// DUO 26/10: màn làm chặng có «Trong» nay là kiểu Duolingo (khối DUO 26/10) ⇒ các cảnh dot13 dưới đây chụp giao diện cũ (`&trong=tat`).
const L13_CANH = [
  ['1-dung-sai', 'lam13&trong=tat', /Câu 1\/6/, `lam13:${L13_TOI_CAU4} » ds:a=Đúng,b=Đúng » dau`],
  ['2-trac-nghiem', 'lam13&trong=tat', /Câu 1\/6/, `lam13:${L13_CAU5} » dau`],
  ['3-tra-loi-ngan', 'lam13&trong=tat', /Câu 1\/6/, `lam13:${L13_CAU6} » dau`],
  ['4-hoc-huong-dan', 'lam13&lam=g7&trong=tat', /Câu này em chọn làm thế nào/, 'lam13:dau'],
  ['5-phan-hoi-sai', 'lam13&trong=tat', /Câu 1\/6/, `lam13:${L13_NOP4}`],
  ['6-phan-hoi-dung', 'lam13&trong=tat', /Câu 1\/6/, `lam13:${L13_CAU5} » nut:^Nộp câu`],
  ['7-xong-chang', 'lam13&trong=tat', /Câu 1\/6/, `lam13:${L13_CAU6} » nut:^Nộp câu » nut:^Kết thúc chặng`],
]
const DS_LAM13 = [
  ...['light', 'dark'].flatMap((nen) => L13_CANH.map(([t, m, cho, viec]) => [`lam13-${t}-doc${nen === 'dark' ? '-toi' : ''}`, m, 390, 844, nen, false, cho, viec])),
  ...L13_CANH.filter(([t]) => /dung-sai|phan-hoi-sai/.test(t)).map(([t, m, cho, viec]) => [`lam13-${t}-doc-ca-khung`, m, 390, 1180, 'light', false, cho, viec]),
  ...L13_CANH.filter(([t]) => /dung-sai|tra-loi-ngan|hoc-huong-dan|phan-hoi-sai|xong/.test(t)).map(([t, m, cho, viec]) => [`lam13-${t}-may-tinh`, m, 1440, 900, 'light', false, cho, viec]),
  ['lam13-1-dung-sai-may-tinh-toi', 'lam13&trong=tat', 1440, 900, 'dark', false, /Câu 1\/6/, `lam13:${L13_TOI_CAU4} » ds:a=Đúng,b=Đúng » dau`],
  ['lam13-3-tra-loi-ngan-ngang', 'lam13&trong=tat', 844, 390, 'light', false, /Câu 1\/6/, `lam13:${L13_CAU6} » dau`],
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

// ═══ MỘT TRANG GV 26/10: Hôm nay của thầy vừa MỘT khung hình (bản vẽ ve-moi/gv-mot-trang.html) — 3 khổ × sáng/tối + 1024×768 + giao diện cũ (`-cu`)
// + danh sách dài (`&mg=dai`: 6 việc) + ba tấm «Xem đủ». Thao tác `mg:` (xem nhánh cùng tên dưới) ĐO trang không cuộn dọc — cuộn ⇒ lỗi trang. Tiền tố "mg-".
const DS_MG = [
  ...['light', 'dark'].flatMap((nen) => KHO_T3.map(([w, hh, kho]) => [`mg-hom-nay-${kho}${nen === 'dark' ? '-toi' : ''}`, 'gv-hom-nay&nh=1', w, hh, nen, true, /Hôm nay của thầy/, 'mg:cho'])),
  ['mg-hom-nay-1024', 'gv-hom-nay&nh=1', 1024, 768, 'light', true, /Hôm nay của thầy/, 'mg:cho'],
  ['mg-hom-nay-may-tinh-cu', 'gv-hom-nay&nh=1&trong=tat', 1440, 900, 'light', false, /Hôm nay của thầy/, 'hn:cho'],
  ['mg-dai-may-tinh', 'gv-hom-nay&nh=1&mg=dai', 1440, 900, 'light', true, /Hôm nay của thầy/, 'mg:cho'],
  ['mg-dai-doc-toi', 'gv-hom-nay&nh=1&mg=dai', 390, 844, 'dark', true, /Hôm nay của thầy/, 'mg:cho'],
  ['mg-dai-xem-du-may-tinh', 'gv-hom-nay&nh=1&mg=dai', 1440, 900, 'light', true, /Hôm nay của thầy/, 'mg:viec-du'],
  ['mg-tam-lop-may-tinh', 'gv-hom-nay&nh=1', 1440, 900, 'light', false, /Hôm nay của thầy/, 'mg:tam-lop'],
  ['mg-tam-em-doc', 'gv-hom-nay&nh=1', 390, 844, 'light', false, /Hôm nay của thầy/, 'mg:tam-em'],
  ['mg-tam-bac-doc-toi', 'gv-hom-nay&nh=1', 390, 844, 'dark', false, /Hôm nay của thầy/, 'mg:tam-bac'],
  ['mg-tam-lop-ngang-toi', 'gv-hom-nay&nh=1', 844, 390, 'dark', false, /Hôm nay của thầy/, 'mg:tam-lop'],
]
// ═══ hết MỘT TRANG GV 26/10

// ═══ NGANG GV 26/10: mọi màn app thầy ở điện thoại ngang (844×390, 740×360 — dải biểu tượng thay thanh trên + đáy), máy tính bảng 1024×768, máy rộng
// 1920×1080 (khung nới 1480) và điện thoại thấp 390×700 / 360×640 (luật «không cắt chữ để ép vừa khung») — sáng; ngang + 390×700 thêm tối. Tiền tố "ng-".
const KHO_NG = [[844, 390, 'ngang'], [740, 360, 'ngang740'], [1024, 768, '1024'], [1920, 1080, '1920'], [390, 700, 'd700'], [360, 640, 'd640']]
const MAN_NG = [
  ['hom-nay', 'gv-hom-nay&nh=1', /Hôm nay của thầy/, 'hn:cho'], ['hom-nay-0', 'gv-hom-nay&nh=1&ca=0', /Hôm nay của thầy/, 'hn:cho'],
  ['ca-kt', 'gv-lich-su-ca&mo=1', /Ca kiểm tra/], ['ca-kt-nhieu', 'gv-lich-su-ca&mo=1&ca=nhieu', /Ca kiểm tra/],
  ['hanh-trinh', 'gv-nhip&ht2=1', /Hành trình giỏi Hóa/, 'cho:Kiểm tra ôn tập'], ['diem-danh', 'gv-nhip&ht2=1&dd12c=1', /Hành trình giỏi Hóa/, 'dd12c:buoc1'],
  ['len-bang', 'gv-len-bang&ht2=1', /./, 'tab:Kiểm tra đầu giờ'], ['chieu', 'gv-chieu&remote=PHIEN1', /Hoàng Bảo Ngọc/], ['mo-ca', 'gv-mo-ca', /Mở ca kiểm tra/],
  ['theo-doi', 'gv-theo-doi', /Kiểm tra 15 phút/], ['hoc-sinh', 'gv-hoc-sinh', /Học sinh/], ['toan-canh', 'gv-toan-canh', /Trần Đức Huy/],
  ['ho-so', 'gv-toan-canh', /Trần Đức Huy/, 'nut:Hồ sơ làm bài'], ['kho', 'gv-kho', /Kho đề/], ['duyet', 'gv-duyet&ma=12-KT-C1-D4', /Duyệt lời giải/],
  ['hs-hoi', 'gv-hs-hoi', /Học sinh hỏi/], ['go-nut', 'gv-go-nut', /Bàn gỡ nút thắt/], ['giao-btvn', 'gv-giao-btvn', /Giao|bài tập/i],
  ['giao-tuan', 'gv-giao-tuan', /Giao|tuần/i], ['cai-dat', 'gv-cai-dat', /Cài đặt/],
]
const DS_NG_GV = MAN_NG.flatMap(([ten, man, cho, viec]) => KHO_NG.flatMap(([w, hh, kho]) => (['ngang', 'd700'].includes(kho) ? ['light', 'dark'] : ['light']).map((nen) =>
  [`ng-${ten}-${kho}${nen === 'dark' ? '-toi' : ''}`, man, w, hh, nen, ten !== 'ho-so' && w >= 700 && hh >= 700, cho, viec])))
// ═══ hết NGANG GV 26/10
// ═══ DUO 26/10: màn làm chặng kiểu Duolingo (`?man=lam13&lam=duo`, bản vẽ docs/ban-ve-duo-2610) — 6 trạng thái + câu Đúng/Sai + câu có hình + tấm lời giải,
// điện thoại (390×844, 390×700, 360×640) / ngang 844×390 / máy tính 1440×900, sáng + tối. Thao tác `lam13:` dùng chung khối LÀN MÀN LÀM BÀI. Tiền tố "duo-".
const D_Q1 = 'tn:^D » nut:^Kiểm tra$ » nut:^Tiếp tục'
const D_Q3 = `${D_Q1} » tn:^A » nut:^Kiểm tra$ » nut:^Tiếp tục`
const D_Q4 = `${D_Q3} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Kiểm tra$ » nut:^Tiếp tục`
const DUO_CANH = [
  ['1-cau', ''], ['2-chon', 'lam13:tn:^D'], ['3-dung', 'lam13:tn:^D » nut:^Kiểm tra$'], ['4-sai', 'lam13:tn:^B » nut:^Kiểm tra$'],
  ['4b-loi-giai', 'lam13:tn:^B » nut:^Kiểm tra$ » nut:^Lời giải từng bước'], ['7-hinh', `lam13:${D_Q1}`],
  ['8-dung-sai', `lam13:${D_Q3} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Kiểm tra$`], ['5-tln', `lam13:${D_Q4} » phim:8,2`],
  ['6-xong', `lam13:${D_Q4} » phim:8,2 » nut:^Kiểm tra$ » nut:^Tiếp tục » tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục`],
]
const DS_DUO = [[390, 844, 'doc'], [390, 700, 'doc700'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  DUO_CANH.map(([t, viec]) => [`duo-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo', w, hh, nen, false, /Số đồng phân amine/, viec || undefined])))
// ═══ hết DUO 26/10
// ═══ BÀN PHÍM DUO 27/10 (tiền tố "duo-5-tln-"): câu trả lời ngắn có đủ trợ giúp (`&ba=1`: Bắt đầu từ đâu? · Học cách giải · Hỏi thầy) — mở câu (tự cuộn
// để trọn bàn phím trên thanh đáy) · gõ 8,2 · vừa bấm xoá · tấm bóng đèn «Trợ giúp» mở; thêm tấm ấy ở câu trắc nghiệm, đúng–sai và màn sửa câu Duo.
// 390×844, 360×640, 844×390, 1440×900, sáng + tối.
const BP_TLN = `lam13:${D_Q4} » nut:^Tự làm câu này`
const BP_CANH = [
  ['duo-5-tln-ba-dau', 'lam13&lam=duo&ba=1', /Số đồng phân amine/, BP_TLN], ['duo-5-tln-ba-go', 'lam13&lam=duo&ba=1', /Số đồng phân amine/, `${BP_TLN} » phim:8,2`],
  ['duo-5-tln-ba-xoa', 'lam13&lam=duo&ba=1', /Số đồng phân amine/, `${BP_TLN} » phim:8,2 » nut:^Xoá một kí tự$`],
  ['duo-5-tln-ba-tg-mo', 'lam13&lam=duo&ba=1', /Số đồng phân amine/, `${BP_TLN} » phim:8,2 » nut:^Trợ giúp`],
  ['duo-5-tln-tg-tn-mo', 'lam13&lam=duo', /Số đồng phân amine/, 'lam13:tn:^D » nut:^Trợ giúp'],
  ['duo-5-tln-tg-ds-mo', 'lam13&lam=duo', /Số đồng phân amine/, `lam13:${D_Q3} » ds:a=Đúng » nut:^Trợ giúp`],
  ['duo-5-tln-tg-sua-mo', 'duo-sua&de=4', /Câu em đã sai/, 'lam13:nut:^8$ » nut:^Trợ giúp'],
]
// ═══ HỎI THẦY THEO TÔNG 27/10 (tiền tố "duo-ht-"): hộp Hỏi Thầy mở từ dải kết quả mang màu dải — đúng (xanh lá) · sai (đỏ) · chưa tính (học cách giải,
// tông trung tính) · đang làm (tông chính). 390×844, 360×640, 844×390, 1440×900, sáng + tối.
const HT_CANH = [
  ['duo-ht-dung', 'lam13&lam=duo&ht=1', /Số đồng phân amine/, 'lam13:tn:^D » nut:^Kiểm tra$ » nut:^Hỏi thầy'],
  ['duo-ht-sai', 'lam13&lam=duo&ht=1', /Số đồng phân amine/, 'lam13:tn:^B » nut:^Kiểm tra$ » nut:^Hỏi thầy'],
  ['duo-ht-chua-tinh', 'lam13&lam=duo&ba=1&ht=1', /Số đồng phân amine/, `lam13:${D_Q4} » nut:^Học cách giải » nut:^Hỏi thầy`],
  ['duo-ht-dang-lam', 'lam13&lam=duo&ht=1', /Số đồng phân amine/, 'lam13:tn:^D » nut:^Trợ giúp » nut:^Hỏi thầy'],
]
const DS_HT = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  HT_CANH.map(([t, m, cho, viec]) => [`${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ hết HỎI THẦY THEO TÔNG 27/10
const DS_BP = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  BP_CANH.map(([t, m, cho, viec]) => [`${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ hết BÀN PHÍM DUO 27/10
// ═══ THẺ CHẠM 27/10 (thầy: «làm lại khung hiển thị cho tinh tế popup đẹp mắt dolingo»): thẻ nhỏ neo dưới chữ tô tím trên màn làm chặng THẬT
// (`lam13&lam=duo&cham=…`, gia/lam-bai-1210d.ts) — mở trên chất / đơn vị / phủ định; 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối.
// `vd` = câu ethylamine trong ảnh thầy (không còn tô «dịch chất nào sau đây»; chạm «Ethylamine» ⇒ tên · công thức · M). Thao tác `cham:<chữ>` = chạm chữ đó rồi chờ thẻ. Tiền tố "duo-cham-".
const CHAM_CANH = [['chat', /aniline/, 'cham:aniline'], ['don-vi', /ethyl acetate/, 'cham:1,5 M'], ['phu-dinh', /không đúng/, 'cham:không đúng']]
const DS_CHAM = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  CHAM_CANH.map(([t, cho, viec]) => [`duo-cham-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, `lam13&lam=duo&cham=${t}`, w, hh, nen, false, cho, viec])))
// thầy 27/10 («Hiện tên, công thức, M thôi»): câu lý thuyết cũng chạm được tên chất ⇒ ảnh câu ví dụ mở thẻ «Ethylamine»
DS_CHAM.push(...[[390, 844, 'doc'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].map((nen) =>
  [`duo-cham-vd-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo&cham=vd', w, hh, nen, false, /Ethylamine thể hiện/, 'cham:Ethylamine'])))
// ═══ hết THẺ CHẠM 27/10
// ═══ GIỮ CHÂN 27/10 (ảnh Duolingo «Đừng đi mà…»): tấm giữ chân khi bấm X giữa chặng + băng nhắc + lời động viên. `&giu=1` ⇒ bản tổng quan thưởng ở máy
// (chuỗi 12 ngày, hôm nay chưa đạt, mục tiêu 3/4) và hôm nay mới làm 2 câu (trang.tsx / gia/lam-bai-1210d.ts). Tiền tố "duo-giu-".
const X_GIU = 'nut:^Lưu và về Lộ trình'
const GIU_CANH = [
  ['tam', `lam13:${D_Q1} » ${X_GIU}`], ['cuoi', `lam13:${D_Q4} » phim:8,2 » nut:^Kiểm tra$ » nut:^Tiếp tục » ${X_GIU}`],
  ['dong-vien', 'lam13:tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục » tn:^A » nut:^Kiểm tra$'], ['con-1', `lam13:${D_Q4} » phim:8,2 » nut:^Kiểm tra$ » nut:^Tiếp tục`], ['mo', ''],
]
const DS_GIU = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  GIU_CANH.map(([t, viec]) => [`duo-giu-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo&tp=1&giu=1', w, hh, nen, false, /Số đồng phân amine/, viec || undefined])))
// ═══ hết GIỮ CHÂN 27/10
// ═══ PHƯƠNG TRÌNH 27/10 (thầy gửi ảnh câu «tính base của amine»: viên «Chặng 3 · 4 câu» đè nhãn, ROH⁺N₂, phương trình dính liền, ⇌ nhỏ, «l» như «I»):
// `lam13&lam=duo-pt` (gia/lam-bai-1210d.ts). `mo` = ngay khi mở (nhãn đang hiện lời nhắc chặng) · `nhan` = sau 3 s (nhãn thường đã về) · `chon` = chọn D.
// 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối. Tiền tố "duo-pt-".
const PT_CHO = 'lam13:' + Array(9).fill('cho').join(' » ')
const PT_CANH = [['mo', ''], ['nhan', PT_CHO], ['chon', `${PT_CHO} » tn:^D`]]
const DS_PT = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  PT_CANH.map(([t, viec]) => [`duo-pt-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo-pt', w, hh, nen, false, /tính base của amine/, viec || undefined])))
// ═══ hết PHƯƠNG TRÌNH 27/10
// ═══ THÍ NGHIỆM GỌN 27/10 (thầy: «Thí nghiệm bỏ luôn khung bao, hiển thị nổi … thanh thu gọn cho đẹp mắt»): `lam13&lam=duo-tn` (gia/lam-bai-1210d.ts) —
// câu methylamine + phenolphthalein + HCl. `mo` = khối thí nghiệm mở sẵn (cuộn tới giữa màn) · `dong` = bấm thanh thu gọn. Các bước cuộn ngang
// (.ex-grid) là chủ đích — không tính tràn. 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối. Tiền tố "duo-tn-".
const TN_CANH = [['mo', 'lam13:cho:600 » xem:.ex-demo » cho:400'], ['dong', 'lam13:cho:600 » xem:.ex-demo » bam:.ex-demo > summary » cho:500']]
const DS_TN = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  TN_CANH.map(([t, viec]) => [`duo-tn-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo-tn', w, hh, nen, false, /Tiến hành thí nghiệm/, viec])))
// ═══ hết THÍ NGHIỆM GỌN 27/10
// ═══ ĐỀ GIÃN Ý 27/10 (tiền tố "duo-gian-"): đề dài nhiều ý như ảnh thầy (aniline: Bước 1 kèm phương trình, Bước 2, Giả sử…, câu hỏi) trong khung chữ L
// của giám thị — 390×844 / 360×640 / 844×390 / 1440×900, sáng + tối; thêm cuộn xuống phần câu hỏi ở 390.
const DS_GIAN = ['light', 'dark'].flatMap((nen) => { const toi = nen === 'dark' ? '-toi' : ''; return [
  ...[[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].map(([w, hh, k]) => [`duo-gian-${k}${toi}`, 'lam13&lam=duo&gtde=aniline&gt=th', w, hh, nen, false, /Aniline/, 'lam13:cho:3600 » dau']),
  [`duo-gian-cuon-doc${toi}`, 'lam13&lam=duo&gtde=aniline&gt=th', 390, 844, nen, false, /Aniline/, 'lam13:cho:3600 » xem:.de-doan[data-loai=hoi]'],
] })
// ═══ GIÁM THỊ 27/10 (tiền tố "duo-gt-"): giám thị theo mức câu cạnh đề, 4 mức × đề ngắn đã chọn (mắt dõi ô B) ở 390×844 / 360×640 / 844×390 / 1440×900;
// ở 390×844 thêm đúng · sai · đề dài · đề có hình. Sáng + tối. `gtloi=1` ⇒ giám thị luôn càu nhàu (đo bong bóng không che nhãn / đề / phương án).
const GT_NGAN = 'lam13&lam=duo&gtde=ngan&gtloi=1&gt='
const DS_GT = ['nb', 'th', 'vd', 'vdc'].flatMap((m) => ['light', 'dark'].flatMap((nen) => {
  const toi = nen === 'dark' ? '-toi' : ''
  return [
    ...[[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].map(([w, hh, k]) => [`duo-gt-${m}-ngan-${k}${toi}`, GT_NGAN + m, w, hh, nen, false, /quỳ tím/, 'lam13:tn:^B » cho:3200']),
    [`duo-gt-${m}-dung-doc${toi}`, GT_NGAN + m, 390, 844, nen, false, /quỳ tím/, 'lam13:tn:^B » nut:^Kiểm tra$'],
    // đề 2 / 4 / 6 / 15 dòng ở 390 · 360 · ngang (đo: không khung rỗng > 24 px; chữ L chỉ khi chữ tràn dưới chân giám thị)
    ...(['th', 'vdc'].includes(m) ? ['ngan', '4dong', '6dong', 'dai'].flatMap((de) => [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang']].map(([w, hh, k]) =>
      [`duo-gt-${m}-dong-${de}-${k}${toi}`, `lam13&lam=duo&gtde=${de}&gt=${m}`, w, hh, nen, false, /Dung dịch chất nào|Phần trăm khối lượng|Cho 4,5 gam|Toluidine là/, 'lam13:cho:2200 » dau'])) : []),
    // đề DÀI như ảnh thầy (toluidine ~15 dòng): khung chữ L ôm giám thị — mọi khổ cho Cô Cốc / Kíp, 390 cho Tí / Chú Tam
    ...(['th', 'vdc'].includes(m) ? [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']] : [[390, 844, 'doc']]).map(([w, hh, k]) =>
      [`duo-gt-${m}-toluidine-${k}${toi}`, `lam13&lam=duo&gtde=dai&gtloi=1&gt=${m}`, w, hh, nen, false, /Toluidine là/, 'lam13:cho:3600 » dau']),
    [`duo-gt-${m}-sai-doc${toi}`, GT_NGAN + m, 390, 844, nen, false, /quỳ tím/, 'lam13:tn:^A » nut:^Kiểm tra$'],
    [`duo-gt-${m}-dai-doc${toi}`, `lam13&lam=duo&gtloi=1&gt=${m}`, 390, 844, nen, false, /Số đồng phân amine/, 'lam13:tn:^D » cho:3200'],
    [`duo-gt-${m}-hinh-doc${toi}`, `lam13&lam=duo&gt=${m}`, 390, 844, nen, false, /Số đồng phân amine/, `lam13:${D_Q1}`],
  ]
}))
// ═══ hết GIÁM THỊ 27/10
// ═══ THƯỞNG PHẠT GỘP 26/10 (tiền tố "tpc-"): Lộ trình / Thành tích / màn mở từ thanh trên / làm chặng / kết chặng THẬT có cắm thưởng phạt (`&tp=1`:
// máy chủ giả gia/thuong.tsx + answer trả `thuong`, câu cuối `ketBai`). 390×844 · 844×390 · 1440×900, sáng + tối. Thao tác `menu:<mục>` = chọn mục menu dọc.
const TPC_CANH = [
  ['lo-trinh', 'hs-mot&tp=1', /Ester/], ['thanh-tich', 'hs-mot&tp=1', /Ester/, 'menu:Thành tích'], ['menu', 'hs-mot&tp=1', /Ester/, 'mo-menu'], ['chuoi', 'hs-mot&tp=1', /Ester/, 'nut:Chuỗi 12 ngày'],
  ['nhiem-vu', 'hs-mot&tp=1', /Ester/, 'nut:147 nguyên tử hôm nay'], ['cua-hang', 'hs-mot&tp=1', /Ester/, 'nut:245 tinh thể'],
  ['lam-dung', 'lam13&lam=duo&tp=1', /Số đồng phân amine/, 'lam13:tn:^D » nut:^Kiểm tra$'], ['lam-sai', 'lam13&lam=duo&tp=1', /Số đồng phân amine/, 'lam13:tn:^B » nut:^Kiểm tra$'],
  ['ket', 'lam13&lam=duo&tp=1', /Số đồng phân amine/, `lam13:${D_Q4} » phim:8,2 » nut:^Kiểm tra$ » nut:^Tiếp tục » tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục`],
]
// PHÔNG 27/10: thêm khổ 360×640 (`doc640`) — soát nhãn ngắn bẻ dòng khi phông rộng hơn; cảnh `menu` = menu dọc đang mở.
// ═══ VIỆC TỒN 27/10 (tiền tố "ton-"): lối vào Học cùng bạn (thẻ trên Lộ trình · khối «Lửa đôi» ở Chuỗi ngày) + lối vào Thử thách Kim cương (ô ở Thành tích
// ⇒ danh sách chuyên đề đã vững). App THẬT `hs-mot&tp=1` + máy chủ giả gia/thuong.tsx. 390×844 · 360×640, sáng + tối; Chuỗi ngày chụp cả trang.
const TON_CANH = [
  ['lo-trinh', 'hs-mot&tp=1', false], ['lo-trinh-moi', 'hs-mot&tp=1&ban=0', false], ['chuoi', 'hs-mot&tp=1', true, 'nut:Chuỗi 12 ngày'],
  ['thanh-tich', 'hs-mot&tp=1', true, 'menu:Thành tích'], ['kc-ds', 'hs-mot&tp=1', false, 'ton:menu:Thành tích » nut:Thử thách Kim cương'],
  ['kc-trong', 'hs-mot&tp=1&kc=0', false, 'ton:menu:Thành tích » nut:Thử thách Kim cương'],
  // TÊN ĐỦ 27/10 (thầy: «Cho hiện đủ tên nhé, chuẩn tên nhé»): Học cùng bạn + Mời bạn tìm «11010» (`&ten=dai`: tên 4 chữ, tên rất dài, lớp «11»)
  ['ban', 'hs-mot&tp=1&ten=dai', true, 'ton:menu:Thành tích » nut:Học cùng bạn'], ['moi-ban', 'hs-mot&tp=1&ten=tim', false, 'ton:menu:Thành tích » nut:Học cùng bạn » nut:Mời bạn » go:11010'], ['kc-moi', 'hs-mot&tp=1', false, 'ton:menu:Thành tích » nut:Thử thách Kim cương » nut:Thử thách Cấu tạo'],
]
const DS_TON = [[390, 844, 'doc'], [360, 640, 'doc640']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  TON_CANH.map(([t, m, ca, viec]) => [`ton-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, ca, /Ester/, viec])))
// ═══ LUẬT BÌNH 27/10 (tiền tố "binh-"): Cửa hàng + Chuỗi ngày — giá 150 · mỗi tuần mua 1 bình; `&binh=da` ⇒ tuần này đã mua (nút xám + lý do). Không dấu «P».
const BINH_CANH = [
  ['cua-hang', 'hs-mot&tp=1', false, 'nut:245 tinh thể'], ['cua-hang-da', 'hs-mot&tp=1&binh=da', false, 'nut:245 tinh thể'],
  ['chuoi', 'hs-mot&tp=1', true, 'nut:Chuỗi 12 ngày'], ['chuoi-da', 'hs-mot&tp=1&binh=da', true, 'nut:Chuỗi 12 ngày'],
]
const DS_BINH = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  BINH_CANH.map(([t, m, ca, viec]) => [`binh-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, ca, /Ester/, viec])))
const DS_TPC = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  TPC_CANH.map(([t, m, cho, viec]) => [`tpc-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ hết THƯỞNG PHẠT GỘP 26/10
// ═══ NÂNG CẤP 27/10 (tiền tố "nc-", bản vẽ ve-moi/nang-cap): Lộ trình (nút tròn, vòng bốn đoạn, sao nảy, rương + Bi cạnh đường) và màn làm chặng
// `lam13&lam=duo-nc` (câu chọn chất có tranh phân tử · câu tính có cảnh phản ứng + 4 phương án số · tấm Đúng · tấm Chưa đúng · tấm Chưa được tính).
const NC_DEN_TINH = 'lam13:tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục'
const NC_CANH = [
  ['lo-trinh', 'hs-mot&tp=1', /Ester/], ['1-chon-chat', 'lam13&lam=duo-nc', /Chất nào sau đây là amine/, 'lam13:tn:^B'],
  ['2-dung', 'lam13&lam=duo-nc', /Chất nào sau đây là amine/, 'lam13:tn:^B » nut:^Kiểm tra$'],
  ['3-tinh', 'lam13&lam=duo-nc', /Chất nào sau đây là amine/, `${NC_DEN_TINH} » tn:^A`],
  ['4-sai', 'lam13&lam=duo-nc', /Chất nào sau đây là amine/, `${NC_DEN_TINH} » tn:^A » nut:^Kiểm tra$`],
  ['5-chua-tinh', 'lam13&lam=duo-nc', /Chất nào sau đây là amine/, `${NC_DEN_TINH} » tn:^A » nut:^Kiểm tra$ » nut:^Tiếp tục » tn:^B » nut:^Kiểm tra$`],
  // mốc combo 3 giữa hiệu ứng (~750 ms sau Kiểm tra: Bi đã bay vào, hạt đang gom) và lúc xong (~1,6 s: số đã cộng đủ)
  ['6-combo-giua', 'lam13&lam=duo-nc&chuoi=2', /Chất nào sau đây là amine/, 'lam13:tn:^B » nut:^Kiểm tra$ » cho » cho'],
  ['7-combo-xong', 'lam13&lam=duo-nc&chuoi=2', /Chất nào sau đây là amine/, 'lam13:tn:^B » nut:^Kiểm tra$ » cho » cho » cho » cho » cho'],
]
const DS_NC = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  NC_CANH.map(([t, m, cho, viec]) => [`nc-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ hết NÂNG CẤP 27/10
// ═══ LỘ TRÌNH GHIM 27/10 (tiền tố "lg-"): lần mở đầu (bong bóng lời Bi) · lần mở sau trong ngày (không bong bóng) · đã cuộn (thẻ bài dính, thu gọn)
const LG_CANH = [['dau', 'hs-mot&tp=1', /Ester/], ['sau', 'hs-mot&tp=1', /Ester/, 'lam13:nap'], ['cuon', 'hs-mot&tp=1', /Ester/, 'lam13:nap » cuon:320 » cho'],
  // 27/10 thầy «bấm vào hiện như thế này» (ảnh Duolingo): thẻ bật ra dưới / trên nút cho từng loại nút
  ...[['hoc', '^(Học tiếp|Bắt đầu học)'], ['xong', 'đã xong$'], ['khoa', 'chưa mở$'], ['ruong', '^Rương hôm nay'], ['kiem', '^Kiểm tra ôn tập'], ['sua', '^Tự sửa lỗi']]
    .map(([k, ten]) => [`pop-${k}`, 'hs-mot&tp=1', /Ester/, `lam13:nap » nut:${ten} » cho:300`])]
const DS_LG = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  LG_CANH.map(([t, m, cho, viec]) => [`lg-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ BẢNG + TẤM CHƯA TÍNH 27/10 (tiền tố "nb-"): bảng 2 hàng × 4 cột tự xoay dọc ở khổ hẹp · tấm «Chưa được tính» gọn · bảng lớn cuộn ngang có bóng mép
const NB_CANH = [
  ['1-bang', 'lam13&lam=duo-bang', /Chọn đáp án đúng/, ''], ['2-chua-tinh', 'lam13&lam=duo-bang', /Chọn đáp án đúng/, 'lam13:tn:^B » nut:^Kiểm tra$'],
  ['3-bang-lon', 'lam13&lam=duo-bang', /Chọn đáp án đúng/, 'lam13:tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục'],
]
const DS_NB = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  NB_CANH.map(([t, m, cho, viec]) => [`nb-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec || undefined])))
// ═══ MỤC TIÊU NGÀY THEO CÂU 27/10 (tiền tố "mtc-"): vòng Bi trên Lộ trình đo bằng câu như thẻ «Đủ x/y câu» — đủ mức («Đủ mức») · chưa đủ («40/92 câu»)
const DS_MTC = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  [['du', 'hs-mot&tp=1&mt=du'], ['chua', 'hs-mot&tp=1&mt=chua']].map(([t, m]) => [`mtc-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, /Ester/])))
// ═══ BI CHUYỂN ĐỘNG 27/10 (tiền tố "bd-"): mọi chỗ có Bi trong app học sinh — Lộ trình (Bi nói), câu đúng (mừng nhảy), câu sai (buồn), kết chặng
// (nhảy múa), Thành tích, chuỗi ngày (lửa). 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối. Bi chuyển động nạp lười ⇒ chờ thêm cho mảnh bi-dong.
const DS_BD = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  TPC_CANH.filter(([t]) => ['lo-trinh', 'thanh-tich', 'chuoi', 'lam-dung', 'lam-sai', 'ket'].includes(t))
    .map(([t, m, cho, viec]) => [`bd-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ hết BI CHUYỂN ĐỘNG 27/10

// ═══ NGANG HS 26/10: màn con học sinh mở đè Hôm nay (`?man=hs-ng&v=tu-sua|kiem|ai`, khối cùng tên ở trang.tsx) ở điện thoại dọc thấp / ngang / máy tính
// bảng / máy tính, sáng + tối (ảnh khung nhìn; đo tràn ngang + vùng chạm như mọi cảnh). Tiền tố "ng-hs-".
const DS_NG_HS = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [740, 360, 'ngang740'], [1024, 768, 'bang'], [1440, 900, 'may-tinh'], [1920, 1080, 'may-tinh-1920']].flatMap(([w, hh, k]) =>
  ['light', 'dark'].flatMap((nen) => [['tu-sua', 'hs-ng&v=tu-sua', /Em tự làm lại câu này/], ['kiem', 'hs-ng&v=kiem', /Kiểm tra ôn tập/], ['ai', 'hs-ng&v=ai', /Cho 5,6 gam Fe/]]
    .map(([ten, m, cho]) => [`ng-hs-${ten}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho])))
// ═══ hết NGANG HS 26/10

// ═══ DUO SỬA 27/10: màn sửa câu (Tự sửa lỗi · «Em tự làm lại câu này») kiểu Duolingo (`?man=duo-sua&de=…`, khối cùng tên ở trang.tsx; máy chủ giả
// chấm theo đáp án). Thao tác `lam13:` (tn / nut / ds). 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối; thêm `&trong=tat` (màn cũ giữ nguyên). Tiền tố "duo-sua-".
const DS_SUA_SAI = 'tn:^C » nut:^Kiểm tra$'
const DUO_SUA_CANH = [
  ['01-cau-hinh', 'de=1', /Câu em đã sai/], ['02-cau', 'de=2', /Câu em đã sai/], ['03-chon', 'de=2', /Câu em đã sai/, 'lam13:tn:^B'],
  ['04-dung', 'de=2', /Câu em đã sai/, 'lam13:tn:^A » nut:^Kiểm tra$'], ['05-sai-goi-y', 'de=2', /Câu em đã sai/, `lam13:${DS_SUA_SAI}`],
  ['06-lan-2', 'de=2', /Câu em đã sai/, `lam13:${DS_SUA_SAI} » nut:^Làm lại câu này$`],
  ['07-sai-lan-2', 'de=2', /Câu em đã sai/, `lam13:${DS_SUA_SAI} » nut:^Làm lại câu này$ » tn:^D » nut:^Kiểm tra$`],
  ['08-loi-giai', 'de=2', /Câu em đã sai/, `lam13:${DS_SUA_SAI} » nut:^Làm lại câu này$ » tn:^D » nut:^Kiểm tra$ » nut:^Lời giải$`],
  ['09-dung-lan-2', 'de=2', /Câu em đã sai/, `lam13:${DS_SUA_SAI} » nut:^Làm lại câu này$ » tn:^A » nut:^Kiểm tra$`],
  ['10-dung-sai', 'de=3', /Câu em đã sai/, 'lam13:ds:a=Đúng,b=Sai,c=Đúng'], ['11-dung-sai-ket', 'de=3', /Câu em đã sai/, 'lam13:ds:a=Đúng,b=Sai,c=Đúng,d=Đúng » nut:^Kiểm tra$ » nut:^Làm lại câu này$ » ds:a=Đúng,b=Sai,c=Sai,d=Sai » nut:^Kiểm tra$'],
  ['12-tra-loi-ngan', 'de=4', /Câu em đã sai/, 'lam13:nut:^8$ » nut:^Dấu phẩy$ » nut:^2$'], ['13-tra-loi-ngan-dung', 'de=4', /Câu em đã sai/, 'lam13:nut:^8$ » nut:^Dấu phẩy$ » nut:^2$ » nut:^Kiểm tra$'],
  ['14-xong-chang', 'de=2', /Câu em đã sai/, 'lam13:tn:^A » nut:^Kiểm tra$ » nut:^Tiếp tục$'],
  ['15-da-tu-sua', 'de=2&mo=da-sua', /Em đã tự sửa xong/], ['16-khong-mo', 'de=2&mo=loi', /Chưa mở được/],
  ['17-giu-chan', 'de=2', /Câu em đã sai/, 'lam13:nut:^Quay lại$'], // giữa chặng sửa (đã sửa 3/4) ⇒ X mở tấm «Đừng đi mà…»
]
const DS_DUO_SUA = [
  ...[[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
    DUO_SUA_CANH.map(([t, q, cho, viec]) => [`duo-sua-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, `duo-sua&${q}`, w, hh, nen, false, cho, viec]))),
  ['duo-sua-00-tat-doc', 'duo-sua&de=2&trong=tat', 390, 844, 'light', false, /Em tự làm lại câu này/],
  ['duo-sua-00-tat-may-tinh', 'duo-sua&de=2&trong=tat', 1440, 900, 'light', false, /Em tự làm lại câu này/],
]
// ═══ hết DUO SỬA 27/10

// ═══ KIỂM GD MỚI 26/10: dữ liệu XẤU cho màn làm chặng kiểu Duolingo (`lam13&lam=duo-xau`, gia/lam-bai-1210d.ts: đề 6 dòng, phương án 3–4 dòng, công thức
// dài, lưới 2×2 công thức sát ngưỡng, ý Đúng/Sai dài, trả lời ngắn 6 ô, hình rộng 960px, lý do dài; `&so=lon` số hôm nay lớn; `&loi=1` máy chủ lỗi) + Gói 7
// «Chọn cách làm» ở giao diện mới + phụ huynh «Chỉ đọc» rỗng / nhiều dữ liệu. Bộ soát scripts/soat-chu-chen + scripts/kiem-gd-moi đọc DS này. Tiền tố "kgd-".
const K_X1 = 'tn:^A » nut:^Kiểm tra$ » nut:^Tiếp tục'
const K_X2 = `${K_X1} » tn:^C » nut:^Kiểm tra$ » nut:^Tiếp tục`
const K_X3 = `${K_X2} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Kiểm tra$ » nut:^Tiếp tục`
const K_X4 = `${K_X3} » phim:-12,75 » nut:^Kiểm tra$ » nut:^Tiếp tục`
const KGD_DUO = [
  ['1-cau', ''], ['1-chon', 'lam13:tn:^B'], ['1-sai', 'lam13:tn:^B » nut:^Kiểm tra$'], ['1-dung', 'lam13:tn:^A » nut:^Kiểm tra$'],
  ['1-loi-giai', 'lam13:tn:^B » nut:^Kiểm tra$ » nut:^Lời giải từng bước'], ['2-luoi', `lam13:${K_X1} » tn:^C`], ['2-luoi-sai', `lam13:${K_X1} » tn:^A » nut:^Kiểm tra$`],
  ['3-ds-dang', `lam13:${K_X2} » ds:a=Đúng`], ['3-ds-sai', `lam13:${K_X2} » ds:a=Đúng,b=Đúng,c=Đúng,d=Đúng » nut:^Kiểm tra$`],
  ['4-tln', `lam13:${K_X3} » phim:-12,75`], ['4-tln-sai', `lam13:${K_X3} » phim:-12,7 » nut:^Kiểm tra$`],
  ['5-hinh', `lam13:${K_X4}`], ['5-hinh-dung', `lam13:${K_X4} » tn:^A » nut:^Kiểm tra$`], ['6-xong', `lam13:${K_X4} » tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục`],
]
const KGD_KHO = [[390, 844, 'doc', 'light'], [390, 844, 'doc', 'dark'], [360, 640, 'doc640', 'light'], [844, 390, 'ngang', 'light'], [740, 360, 'ngang740', 'dark'],
  [1024, 768, 'bang', 'light'], [1366, 768, 'may-tinh-1366', 'light'], [1440, 900, 'may-tinh', 'light'], [1920, 1080, 'may-tinh-1920', 'dark']]
const DS_KGD = [
  ...KGD_KHO.flatMap(([w, hh, k, nen]) => KGD_DUO.map(([t, viec]) => [`kgd-duo-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo-xau', w, hh, nen, false, /Cho 12,95 gam/, viec || undefined])),
  ...KGD_KHO.flatMap(([w, hh, k, nen]) => [
    [`kgd-duo-so-lon-xong-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo-xau&so=lon', w, hh, nen, false, /Cho 12,95 gam/, `lam13:${K_X4} » tn:^B » nut:^Kiểm tra$ » nut:^Tiếp tục`],
    [`kgd-duo-loi-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=duo-xau&loi=1', w, hh, nen, false, /Máy chủ đang bận/],
    [`kgd-duo-g7-chon-cach-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=g7', w, hh, nen, false, /Câu này em chọn làm thế nào/],
    [`kgd-duo-g7-hoc-cach-giai-${k}${nen === 'dark' ? '-toi' : ''}`, 'lam13&lam=g7', w, hh, nen, false, /Câu này em chọn làm thế nào/, 'lam13:nut:^Học cách giải$'],
    [`kgd-ph-rong-${k}${nen === 'dark' ? '-toi' : ''}`, 'ph&mot=1&hn=chua&lt=0&cb=0&dg=khong&kt=khong&bt=khong', w, hh, nen, false, /Hôm nay/, 'pd:'],
    [`kgd-ph-nhieu-${k}${nen === 'dark' ? '-toi' : ''}`, 'ph&mot=1&dai=1&hn=du&nhom=cham&dg=hoc-that&kt=dang&ss=do', w, hh, nen, false, /Hôm nay/, 'pd:'],
    [`kgd-ph-dai-canh-bao-${k}${nen === 'dark' ? '-toi' : ''}`, 'ph&mot=1&dai=1&dg=doi-pho&nhom=luoi&kt=het', w, hh, nen, false, /Hôm nay/, 'pd:'],
  ]),
]
// ═══ hết KIỂM GD MỚI 26/10

/** [tên ảnh, ?man=, rộng, cao, nền ('light'|'dark'), cả trang?, chờ chữ (regex)] */
// ═══ PH CHỈ ĐỌC 26/10 (thay khối MỘT TRANG PH): app phụ huynh «Chỉ đọc» (`ph&mot=1`, khối cùng tên ở trang.tsx). Ảnh KHUNG NHÌN ở 3 khổ × sáng/tối cho
// ba trạng thái: chưa làm + Lười + đối phó + thầy chưa nhận xét · đang làm (bộ gốc: Chưa đều, Học thật, cảnh báo thầy) · đủ + Chăm + học thật; thêm khổ
// 390×700 · 360×640 · 1024×768 · 1920×1080, dữ liệu dài (`dai=1`), chưa có đánh giá (`dg=khong`). Đo trang cuộn / tràn ngang (`pd:`): máy tính 1440×900
// phải vừa một màn (`pd:3`); điện thoại cuộn được từ khi thêm thẻ «Kiểm tra và sửa lỗi» (ảnh dọc chụp cả trang), không cắt chữ. `trong=tat` ⇒ trang cũ. 63- = thẻ «Kiểm tra và sửa lỗi». Chạy riêng: 60-ph-doc,61-ph-doc,62-ph-doc,63-ph-doc.
const CANH_PD = [['chua', 'hn=chua&nhom=luoi&dg=doi-pho&lt=0&cb=0'], ['dang', ''], ['du', 'hn=du&nhom=cham&dg=hoc-that&cb=0']]
const DS_PH_DOC = [
  ...CANH_PD.flatMap(([tt, q]) => [[390, 844, 'doc'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, h, k]) => ['light', 'dark'].map((nen) =>
    [`60-ph-doc-${tt}-${k}-${nen === 'dark' ? 'toi' : 'sang'}`, `ph&mot=1${q ? '&' + q : ''}`, w, h, nen, k === 'doc', /Hôm nay/, k === 'may-tinh' ? 'pd:3' : 'pd:'])))
  ,...[[390, 700], [360, 640], [1024, 768], [1920, 1080], [740, 360]].map(([w, h]) => [`61-ph-doc-dang-${w}x${h}`, 'ph&mot=1', w, h, 'light', false, /Hôm nay/, 'pd:'])
  ,['61-ph-doc-dai-doc', 'ph&mot=1&dai=1&cb=0&dg=doi-pho&nhom=luoi', 390, 844, 'light', true, /Hôm nay/, 'pd:']
  ,['61-ph-doc-chua-danh-gia-doc', 'ph&mot=1&dg=khong&lt=0&cb=0', 390, 844, 'light', true, /Hôm nay/, 'pd:']
  // thẻ «Kiểm tra và sửa lỗi» (thầy 26/10): bảy trạng thái Kiểm tra ôn tập (điện thoại, cả trang) + sửa hết / còn nhiều không sửa + BTVN đủ / không có bài
  ,...['chua', 'dang', 'nop', 'het', 'cu', 'sap', 'khong'].map((kt) => [`63-ph-doc-kt-${kt}-doc`, `ph&mot=1&cb=0&kt=${kt}`, 390, 844, 'light', true, /Hôm nay/, 'pd:'])
  ,['63-ph-doc-kt-ss-het-bt-du-may-tinh', 'ph&mot=1&cb=0&kt=nop&ss=het&bt=du', 1440, 900, 'light', false, /Hôm nay/, 'pd:3']
  ,['63-ph-doc-kt-ss-do-bt-khong-may-tinh-toi', 'ph&mot=1&cb=0&kt=chua&ss=do&bt=khong', 1440, 900, 'dark', false, /Hôm nay/, 'pd:3']
  ,['62-ph-doc-tat-doc', 'ph&mot=1&trong=tat', 390, 844, 'light', true, /Hôm nay của Khôi/]
  ,['62-ph-doc-tat-may-tinh', 'ph&mot=1&trong=tat', 1440, 900, 'light', false, /Hôm nay của Khôi/]
]
// ═══ DUO KIỂM TRA 27/10 (tiền tố "duo-kt-"): màn làm bài kiểm tra kiểu Duolingo — Kiểm tra ôn tập (`duo-kt&v=ktcn|ket`) + ca thi (`duo-kt&v=thi|kq&vai=hocsinh`),
// khối DUO KIỂM TRA ở trang.tsx. 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối. Thao tác `lam13:` (nút / phím) dùng chung khối LÀN MÀN LÀM BÀI.
const DK_LUOI = 'nut:^Danh sách câu'
const DUO_KT_CANH = [
  ['ktcn-cau', 'duo-kt&v=ktcn', /Kiểm tra ôn tập/, 'lam13:nut:^Làm tiếp chặng 2'],
  ['ktcn-ds', 'duo-kt&v=ktcn', /Kiểm tra ôn tập/, `lam13:nut:^Làm tiếp chặng 2 » ${DK_LUOI} » nut:^Câu 4`],
  ['ktcn-tln', 'duo-kt&v=ktcn', /Kiểm tra ôn tập/, `lam13:nut:^Làm tiếp chặng 2 » ${DK_LUOI} » nut:^Câu 6 » phim:1,5`],
  ['ktcn-luoi', 'duo-kt&v=ktcn', /Kiểm tra ôn tập/, `lam13:nut:^Làm tiếp chặng 2 » ${DK_LUOI}`],
  ['ktcn-nop', 'duo-kt&v=ktcn', /Kiểm tra ôn tập/, `lam13:nut:^Làm tiếp chặng 2 » ${DK_LUOI} » nut:^Câu 6 » nut:^Nộp chặng 2`],
  ['ktcn-ket', 'duo-kt&v=ket', /Làm tốt lắm/],
  ['thi-cau', 'duo-kt&v=thi&vai=hocsinh', /Câu \d\/8/],
  // 27/10: bảng trong đề ở màn thi — 2 hàng × 4 cột tự xoay dọc (câu 1) · bảng lớn cuộn ngang có bóng mép (câu 2)
  ['thi-bang', 'duo-kt&v=thi&vai=hocsinh&bang=1', /Câu \d\/8/, `lam13:${DK_LUOI} » nut:^Câu 1`], ['thi-bang-lon', 'duo-kt&v=thi&vai=hocsinh&bang=1', /Câu \d\/8/, `lam13:${DK_LUOI} » nut:^Câu 2`],
  ['thi-chon', 'duo-kt&v=thi&vai=hocsinh', /Câu \d\/8/, 'lam13:nut:^B\\.'],
  ['thi-ds', 'duo-kt&v=thi&vai=hocsinh', /Câu \d\/8/, `lam13:${DK_LUOI} » nut:^Câu 5 » nut:^Đúng$`],
  ['thi-tln', 'duo-kt&v=thi&vai=hocsinh', /Câu \d\/8/, `lam13:${DK_LUOI} » nut:^Câu 7 » nut:^1$ » nut:^7$`],
  ['thi-luoi', 'duo-kt&v=thi&vai=hocsinh', /Câu \d\/8/, `lam13:${DK_LUOI}`],
  ['thi-nop', 'duo-kt&v=thi&vai=hocsinh', /Câu \d\/8/, `lam13:${DK_LUOI} » nut:^Nộp bài$`],
  ['thi-kq', 'duo-kt&v=kq&vai=hocsinh', /Làm tốt lắm/],
]
const DS_DUO_KT = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  DUO_KT_CANH.map(([t, m, cho, viec]) => [`duo-kt-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, cho, viec])))
// ═══ hết DUO KIỂM TRA 27/10
// ═══ MENU 6 MỤC 27/10 (tiền tố "menu6-"): menu dọc app học sinh gọn 6 mục — mở (không buổi điểm danh) · mở khi có buổi đang mở (thẻ Điểm danh đầu menu)
// · tấm Cài đặt. Hôm nay «Một trang» THẬT (`?man=hs-mot&dd=khong|mo`), chuông thật 2 tin chưa đọc. 390×844 · 360×640 · 844×390 · 1440×900, sáng + tối.
const MENU6_CANH = [['mo', 'hs-mot&dd=khong', 'menu6:'], ['dd', 'hs-mot&dd=mo', 'menu6:'], ['cai', 'hs-mot&dd=khong', 'menu6:Cài đặt']]
const DS_MENU6 = [[390, 844, 'doc'], [360, 640, 'doc640'], [844, 390, 'ngang'], [1440, 900, 'may-tinh']].flatMap(([w, hh, k]) => ['light', 'dark'].flatMap((nen) =>
  MENU6_CANH.map(([t, m, viec]) => [`menu6-${t}-${k}${nen === 'dark' ? '-toi' : ''}`, m, w, hh, nen, false, /Ester/, viec])))
// ═══ hết MENU 6 MỤC 27/10
const DS = [
  ...DS_DUO_KT, // DUO KIỂM TRA 27/10
  ...DS_MENU6, // MENU 6 MỤC 27/10
  ...DS_KGD, // KIỂM GD MỚI 26/10
  ...DS_NG_GV, // NGANG GV 26/10
  ...DS_PH_DOC, // PH CHỈ ĐỌC 26/10
  ...DS_T3, // «TRONG» NHÓM 3
  ...DS_MG, // MỘT TRANG GV 26/10
  ...DS_NG_HS, // NGANG HS 26/10
  ...DS_DUO_SUA, // DUO SỬA 27/10
  ...DS_DUO, // DUO 26/10
  ...DS_BP, // BÀN PHÍM DUO 27/10
  ...DS_HT, // HỎI THẦY THEO TÔNG 27/10
  ...DS_GIU, // GIỮ CHÂN 27/10
  ...DS_GT, // GIÁM THỊ 27/10
  ...DS_GIAN, // ĐỀ GIÃN Ý 27/10
  ...DS_CHAM, // THẺ CHẠM 27/10
  ...DS_PT, // PHƯƠNG TRÌNH 27/10
  ...DS_TN, // THÍ NGHIỆM GỌN 27/10
  ...DS_TPC, // THƯỞNG PHẠT GỘP 26/10
  ...DS_TON, // VIỆC TỒN 27/10
  ...DS_BINH, // LUẬT BÌNH 27/10
  ...DS_NC, // NÂNG CẤP 27/10
  ...DS_LG, // LỘ TRÌNH GHIM 27/10
  ...DS_NB, // BẢNG + TẤM CHƯA TÍNH 27/10
  ...DS_BD, // BI CHUYỂN ĐỘNG 27/10
  ...DS_MTC, // MỤC TIÊU NGÀY THEO CÂU 27/10
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
    ...['light','dark'].flatMap((nen) => [['hom-nay','Lộ trình'],['on-lai','Luyện tập'],['ket-qua','Thành tích']].map(([m,chu]) => [`30-hs-moi-${m}-${k}${nen === 'dark' ? '-toi' : ''}`, 'hs-moi', w,h,nen,false,/Chào Minh Anh|chặng/i, m === 'hom-nay' ? undefined : `muc:${chu}`])),
    [`30-hs-moi-ca-mo-${k}`, 'hs-moi&ca=1', w,h,'light',false,/Ca kiểm tra đang mở/],
    [`30-hs-moi-cua-em-${k}`, 'hs-moi', w,h,'light',false,/Chào Minh Anh|chặng/i,'nut:Của em'],
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
    // 27/10 (soát ảnh): Bi đang gõ lời ⇒ chờ gõ xong (≤ 0,7 s) rồi mới chụp, tránh ảnh «cụt câu» giữa chừng.
    await t.waitForFunction(() => [...document.querySelectorAll('.bi-loi-con')].every((e) => !e.textContent), null, { timeout: 3000 }).catch(() => {})
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
    } else if (viec?.startsWith('menu6:')) {
      // MENU 6 MỤC 27/10: Lộ trình tự cuộn tới chặng hiện tại lúc mở (menu thu khi trang cuộn) ⇒ chờ cuộn xong, mở menu (thử lại tới khi menu mở thật),
      // rồi bấm các nút sau «menu6:» (ngăn bằng " » ") trong menu.
      await t.waitForTimeout(1200)
      for (let lan = 0; lan < 4; lan++) {
        if (await t.locator('#tr-menu[data-mo]').count()) break
        await t.getByRole('button', { name: /^Mở menu/ }).locator('visible=true').first().click()
        await t.waitForTimeout(500)
      }
      for (const ten of viec.slice(6).split(' » ').filter(Boolean)) {
        await t.locator('#tr-menu').getByRole('button', { name: ten, exact: true }).click()
        await t.waitForTimeout(450)
      }
    } else if (viec?.startsWith('muc:')) {
      // 26/10 app HS kiểu Duolingo: mở mục Lộ trình / Luyện tập / Thành tích bằng nút đang HIỆN (dải mép phải khi xoay ngang; dọc ⇒ mở menu rồi bấm mục)
      const ten = viec.slice(4)
      const hien = () => t.getByRole('button', { name: ten, exact: true }).locator('visible=true').first()
      // menu tự đóng khi trang cuộn ⇒ thử tối đa 3 lần (mở menu nếu mục chưa hiện, rồi bấm mục)
      for (let lan = 0; lan < 3; lan++) {
        if (!(await hien().count())) { await t.getByRole('button', { name: /^Mở menu/ }).locator('visible=true').first().click(); await t.waitForTimeout(500) }
        if (await hien().click({ timeout: 3000 }).then(() => true, () => false)) break
      }
    } else if (viec === 'mo-menu') {
      // PHÔNG 27/10: mở menu dọc «Trong» (vạch mép phải) và chụp lúc menu đang mở. Chờ Lộ trình cuộn xong (cuộn trang tự đóng menu).
      await t.waitForTimeout(1500)
      await t.evaluate(() => document.querySelector('.tr-menu-cham')?.click())
      await t.waitForTimeout(400)
    } else if (viec?.startsWith('ton:')) {
      // VIỆC TỒN 27/10: chuỗi bước ngăn " » " — `menu:<mục>` (chọn mục menu dọc như dưới) · `nut:<tên đầu>` (bấm nút có tên bắt đầu bằng chữ ấy).
      for (const buoc of viec.slice(4).split(' » ')) {
        if (buoc.startsWith('menu:')) await t.evaluate((ten) => [...document.querySelectorAll('button.tr-menu-muc')].find((b) => b.textContent?.trim().startsWith(ten))?.click(), buoc.slice(5))
        else if (buoc.startsWith('go:')) await t.getByRole('searchbox').first().fill(buoc.slice(3)) // 27/10: gõ vào ô tìm (Mời bạn)
        else await t.getByRole('button', { name: new RegExp('^' + buoc.slice(4)) }).first().click()
        await t.waitForTimeout(700)
      }
    } else if (viec?.startsWith('menu:')) {
      // THƯỞNG PHẠT GỘP 26/10: chọn một mục menu dọc «Trong» (menu luôn gắn trong DOM, ẩn bằng CSS ⇒ bấm bằng DOM, rồi chờ màn mục vẽ).
      await t.evaluate((ten) => [...document.querySelectorAll('button.tr-menu-muc')].find((b) => b.textContent?.trim().startsWith(ten))?.click(), viec.slice(5))
      await t.waitForTimeout(600)
    } else if (viec?.startsWith('ht:')) {
      await t.getByRole('navigation', { name:'Điều hướng học sinh' }).getByRole('button', { name:viec.slice(3), exact:true }).click()
      await t.waitForTimeout(250)
    } else if (viec?.startsWith('hs:')) {
      await t.getByRole('navigation', { name:'Điều hướng chính' }).getByRole('button', { name:viec.slice(3),exact:true }).click()
      await t.getByRole('heading', { name:new RegExp(viec.slice(3)) }).first().waitFor()
    } else if (viec?.startsWith('pd:')) {
      // ═══ PH CHỈ ĐỌC 26/10: chờ 7 ngày + nhóm + Báo cáo tuần về, đo cuộn / tràn ngang. `pd:3` = khổ phải vừa một màn (cuộn ⇒ ghi vào «Tràn ngang»).
      await t.locator('[data-vung="ph-chi-doc"] .pd-7').waitFor({ state: 'attached', timeout: 20000 })
      await t.waitForTimeout(1200)
      const d = await t.evaluate(() => ({ cao: document.documentElement.scrollHeight, khung: innerHeight, rong: document.documentElement.scrollWidth, khungRong: innerWidth }))
      console.log(`${ten}: trang cao ${d.cao}/${d.khung} · rộng ${d.rong}/${d.khungRong}`)
      if (d.rong > d.khungRong || (viec === 'pd:3' && d.cao > d.khung)) tran.push(`${ten}: ${d.cao > d.khung ? 'CUỘN' : 'TRÀN'} — cao ${d.cao}/${d.khung}, rộng ${d.rong}/${d.khungRong}`)
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
      await tam.getByText(/Từng lượt|lượt làm câu/).first().waitFor({ timeout: 20000 })
      if (viec.startsWith('ho-so-ls:')) await tam.getByRole('tab', { name: /Toàn bộ lịch sử/ }).click({ timeout: 3000 }).catch(() => {})
      await t.waitForTimeout(400)
    } else if (viec?.startsWith('bhn:')) {
      // LÀN GIÁO VIÊN 12/10: Bài hằng ngày › bấm nút em đầu / cuối bảng ⇒ tấm Hồ sơ làm bài; `:cuon` / `:tin-hieu` cuộn thân tấm tới khối ấy.
      const [, viTri, cuon] = viec.split(':')
      await t.locator('.gvv2-bhn-em').first().waitFor({ timeout: 20000 })
      const hang = viTri === 'doi-pho' ? await t.evaluate(() => globalThis.__HANG_DOI_PHO ?? 1) : Number(viTri)
      const nut = viTri === 'cuoi' ? t.locator('.gvv2-bhn-em').last() : t.locator('.gvv2-bhn-em').nth(Math.max(0, hang - 1))
      await nut.click({ timeout: 20000 })
      const tam = t.getByRole('dialog')
      await tam.locator('.gvv2-tdo-dau').waitFor({ timeout: 3000 }).catch(() => {})
      await tam.getByText(/Từng lượt|lượt làm câu/).first().waitFor({ timeout: 20000 })
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
        await t.locator('.ddc :is(.ddc-em, .ddv-the)').first().waitFor({ timeout: 20000 }) // bản chiếu nền sáng 23/10: thẻ em = .ddv-the
      }
      if (v === 'nhip' || v === 'ho-so') {
        await t.getByRole('button', { name: 'Xong điểm danh · chiếu Nhịp học của lớp', exact: true }).click()
        await t.locator('.ddc :is(.ddc-dong-em, .ddv-dong-em)').first().waitFor({ timeout: 20000 })
      }
      for (const k of phim ?? '') await t.keyboard.press(k)
      if (v === 'ho-so') {
        // em đầu cột Chưa đều (nhãn thái độ của hồ sơ GIẢ chỉ có Chăm chỉ / Chưa đều / Đối phó — chọn em cùng nhóm để ảnh không tự mâu thuẫn)
        await t.locator(':is(.ddc-cot, .ddv-cot)[data-nhom="chua-deu"] :is(.ddc-dong-em, .ddv-dong-em)').first().click()
        await t.getByRole('dialog').getByText(/Từng lượt|lượt làm câu/).first().waitFor({ timeout: 20000 })
      }
      if (v === 'muc' || v === 'muc-treo') await t.locator('.dd1-ot small').nth(2).waitFor({ timeout: 20000 }) // thanh Mức làm hỏi sau 1,5 giây
      if (v === 'muc-treo') await t.locator('.dd1-tong-nut[data-k="treo"]').click()
      if (v === 'muc-loi') await t.locator('.dd1-ml-loi').waitFor({ timeout: 20000 })
      if (v === 'vua') {
        await t.locator('.dd1-vua-dong').first().click()
        await t.getByRole('dialog').getByText(/Từng lượt|lượt làm câu/).first().waitFor({ timeout: 20000 })
      }
      await t.waitForTimeout(500)
    } else if (viec?.startsWith('hn:')) {
      // LÀN HÔM NAY 12/10B: chờ khối Nhịp học có em rồi làm đúng một việc (ảnh toàn trang không cần cuộn; ảnh khung nhìn cuộn trang tới khối cần chụp).
      const v = viec.slice(3)
      const cuonToi = (chon) => t.evaluate((c) => { const el = document.querySelector(c); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (innerWidth < 900 ? 72 : 16)) }, chon)
      if (v === 'loi') await t.getByText(/Chưa tải được Nhịp học/).first().waitFor({ timeout: 20000 })
      else if (v === 'trong') await t.getByText(/Chưa có em nào nhận bài hằng ngày/).first().waitFor({ timeout: 20000 })
      else {
        await t.locator('.nht-dai-so, .nht-em').first().waitFor({ timeout: 20000 }) // «Một trang» (26/10): điện thoại không còn dòng em trên màn — chờ dải số
        if (v === 'xem-du-luoi') {
          // mở rộng tại chỗ (đợt đầu 50 em) rồi cuộn tới ô tìm của cột — ảnh khung nhìn (toàn trang quá dài cho ảnh ≤ 150 KB)
          await t.getByRole('button', { name: /^Xem đủ \d+ em lười/ }).click()
          await t.getByRole('button', { name: 'Thu gọn' }).waitFor({ timeout: 20000 })
          await cuonToi('.nht-cot[data-kieu="luoi"]')
        }
        if (v === 'khoi-12') await t.getByRole('radio', { name: /^Khối 12/ }).click()
        if (v === 'ho-so') {
          await t.locator('.nht-em').first().click()
          await t.getByRole('dialog').getByText(/Từng lượt|lượt làm câu/).first().waitFor({ timeout: 20000 })
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
    } else if (viec?.startsWith('mg:')) {
      // ═══ MỘT TRANG GV 26/10: chờ dải số; `mg:viec-du` bấm «Xem đủ N việc»; `mg:tam-lop|tam-em|tam-bac` mở tấm «Xem đủ» (máy tính: nút Xem đủ, điện thoại:
      // dòng mở thêm). Ngoài tấm: trang PHẢI không cuộn dọc (scrollHeight ≤ innerHeight), cuộn ⇒ lỗi trang.
      const v = viec.slice(3)
      await t.locator('.nht-dai-so').waitFor({ timeout: 20000 })
      if (v === 'viec-du') await t.getByRole('button', { name: /^Xem đủ \d+ việc/ }).click()
      const nutTam = { 'tam-lop': /Nhịp học theo lớp|lớp và bảng từng ngày/, 'tam-em': /Em cần thầy để ý|^Xem đủ \d+ em/, 'tam-bac': /^12 bậc ·|Xem từng bậc/ }[v]
      if (nutTam) {
        await t.locator('button[aria-haspopup="dialog"]:visible').filter({ hasText: nutTam }).first().click()
        await t.getByRole('dialog').waitFor({ timeout: 20000 })
      }
      await t.waitForTimeout(400)
      const cuon = await t.evaluate(() => document.documentElement.scrollHeight - innerHeight)
      if (cuon > 0 && !nutTam) loiTrang.push(`${ten}: trang cuộn dọc ${cuon}px — «Một trang» phải vừa khung`)
      console.log(`${ten}: cuộn dọc ${cuon}px`)
    } else if (viec?.startsWith('hse:')) {
      // LÀN HỒ SƠ EM 12/10F: tấm mở sẵn — chờ đủ hai lệnh rồi làm đúng một việc; sau đó đo tương phản mọi chữ trong tấm.
      // 26/10: hồ sơ không còn ô «Số lượt làm câu»; hệ lười ẩn khỏi app học sinh ⇒ khối thái độ / thẻ «Toàn bộ lịch sử» có thể không có — chờ «Từng lượt».
      const v = viec.slice(4)
      const tam = t.getByRole('dialog')
      await tam.getByText(/Từng lượt|lượt làm câu/).first().waitFor({ timeout: 20000 })
      await tam.locator('.gvv2-tdo-dau').waitFor({ timeout: 3000 }).catch(() => {})
      if (v === 'lich-su') {
        await tam.getByRole('tab', { name: /Toàn bộ lịch sử/ }).click({ timeout: 3000 }).catch(() => {})
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
        else if (loai === 'cho') await t.waitForTimeout(Number(gt)) // GIÁM THỊ 27/10: chờ giám thị «đọc đề» xong rồi mới chụp
        else if (loai === 'dau') await t.evaluate(() => { const k = document.querySelector('.ht2-lam')?.parentElement; if (k) k.scrollTop = 0 })
        // 27/10: `cuon:N` cuộn khung cuộn của trang N px (thẻ bài ghim) · `nap` tải lại trang (localStorage giữ ⇒ «lần mở sau»)
        else if (loai === 'cuon') await t.evaluate((n) => { const k = [...document.querySelectorAll('body *')].find((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 4) ?? document.scrollingElement; k?.scrollBy(0, n) }, Number(gt))
        // THÍ NGHIỆM GỌN 27/10: `xem:CSS` cuộn phần tử vào giữa màn · `bam:CSS` bấm phần tử (thanh <summary> không mang vai nút)
        else if (loai === 'xem') await t.evaluate((q) => document.querySelector(q)?.scrollIntoView({ block: 'center' }), gt)
        else if (loai === 'bam') await t.locator(gt).first().click({ timeout: 20000 })
        else if (loai === 'nap') { await t.reload(); await t.getByText(cho).first().waitFor({ timeout: 20000 }); await t.waitForTimeout(600) }
        await t.waitForTimeout(250)
      }
      // GIÁM THỊ 27/10: bong bóng càu nhàu không được chồng lên nhãn, đề, phương án, thanh trên / đáy (đo hình chữ nhật thật) ⇒ ghi vào «Tràn ngang».
      // 27/10 thanh trên DÍNH: trang đã cuộn ⇒ bong bóng (thuộc phần đề) trượt khuất DƯỚI thanh trên như mọi nội dung khác — không tính là chồng lên thanh trên
      const chong = await t.evaluate(() => { const l = document.querySelector('.gt-loi'); if (!l) return ''; const a = l.getBoundingClientRect()
        return [...document.querySelectorAll('.duo-nhan, .duo-gt-bong, .duo-tra, .duo-day, .duo-tren')].filter((e) => !(e.matches('.duo-tren') && getComputedStyle(e).position === 'sticky' && a.top < e.getBoundingClientRect().bottom)).filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom) }).map((e) => e.className.split(' ')[0]).join(', ') })
      if (chong) tran.push(`${ten}: bong bóng càu nhàu chồng lên ${chong}`)
      // GIÁM THỊ 27/10 tối: khung đề không được có vùng rỗng ở đáy > 24 px (khung chữ L chỉ khi chữ thật sự tràn xuống dưới chân giám thị).
      const rong = await t.evaluate(() => { const b = document.querySelector('.duo-gt-bong'), d = b?.querySelector('.ht2-lam-de'); if (!b || !d) return 0
        return Math.round(b.getBoundingClientRect().bottom - d.getBoundingClientRect().bottom - 14) })
      if (rong > 24) tran.push(`${ten}: khung đề rỗng ${rong}px ở đáy`)
      // bong bóng càu nhàu thoáng: cách khối phía trên và khung đề phía dưới ≥ 10 px, cách mép trái màn ≥ 16 px
      const khe = await t.evaluate(() => { const l = document.querySelector('.gt-loi'), san = l?.closest('.duo-gt-san'); if (!l || !san) return ''
        const a = l.getBoundingClientRect(), tren = san.previousElementSibling?.getBoundingClientRect(), duoi = san.querySelector('.duo-gt-bong')?.getBoundingClientRect(), loi = []
        if (tren && a.top - tren.bottom < 9.5) loi.push(`trên ${Math.round(a.top - tren.bottom)}px`)
        if (duoi && duoi.top - a.bottom < 9.5) loi.push(`dưới ${Math.round(duoi.top - a.bottom)}px`)
        if (a.left < 15.5) loi.push(`lề trái ${Math.round(a.left)}px`)
        return loi.join(', ') })
      if (khe) tran.push(`${ten}: bong bóng càu nhàu sát (${khe})`)
      // tràn ngang TRONG khung cuộn (documentElement không thấy được vì khung là `fixed`)
      // bảng lớn cuộn ngang TRONG khung riêng (.cau-bang, có bóng mép) là chủ đích — không tính tràn
      // SOÁT TỔNG 27/10: hình con TRONG một <svg> cắt mép (overflow hidden — mây bọt dải đúng .duo-may) không lòi ra ngoài ⇒ không tính; khung svg vẫn được đo
      const tranTrong = await t.evaluate(() => Math.max(0, ...[...document.querySelectorAll('.ht2-lam *')].filter((e) => !e.closest('.cau-bang, .ex-grid > *') && !(e.ownerSVGElement && getComputedStyle(e.ownerSVGElement).overflow !== 'visible')).map((e) => Math.round(e.getBoundingClientRect().right - innerWidth))))
      if (tranTrong > 0) tran.push(`${ten}: trong khung ${tranTrong}px`)
    } else if (viec?.startsWith('cham:')) {
      // THẺ CHẠM 27/10: chạm chữ tô tím (ruột nạp lười) ⇒ chờ thẻ kiểu Duolingo hiện hẳn (hết 120 ms phóng to)
      await t.locator('.gyc-cham', { hasText: viec.slice(5) }).first().click({ timeout: 20000 })
      await t.locator('.gyc-bong').waitFor({ timeout: 20000 })
      await t.waitForTimeout(300)
      const ngoai = await t.evaluate(() => { const r = document.querySelector('.gyc-bong')?.getBoundingClientRect(); return r ? [r.left < 12, r.right > innerWidth - 12, r.top < 0, r.bottom > innerHeight].some(Boolean) : true })
      if (ngoai) tran.push(`${ten}: thẻ chạm vượt mép màn`)
    } else if (viec?.startsWith('cham-khong:')) {
      // câu không có chữ đáng giải nghĩa: chờ ruột chạy xong (nút «Bắt đầu từ đâu?» hiện) rồi kiểm KHÔNG có chữ tô
      await t.getByRole('button', { name: /Bắt đầu từ đâu/ }).first().waitFor({ timeout: 20000 })
      await t.waitForTimeout(400)
      const so = await t.locator('.gyc-v').count()
      if (so) loiTrang.push(`${ten}: còn ${so} chữ tô trên câu không đáng tô`)
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
        // THẺ CHẠM 27/10: chữ chạm trong đề là đích NỘI DÒNG (WCAG 2.5.8 miễn) và có ::after nới 10px trên + dưới ⇒ tính cả phần nới
        if (e.classList.contains('gyc-cham')) return r.height + 20 < 44
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
