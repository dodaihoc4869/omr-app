#!/usr/bin/env node
// Bảng TRƯỚC / SAU từ hai tệp kết quả của scripts/do-app-hs.mjs:  node scripts/do-app-hs/so-sanh.mjs <trước.json> <sau.json>
import { readFileSync } from 'node:fs'

const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')))
const lay = (o, duong) => duong.split('.').reduce((x, k) => (x == null ? x : x[k]), o)
const so = (v) => (v == null ? '—' : typeof v === 'number' ? String(v) : String(v))

const them = (nhan, duong, donVi = '') => {
  const x = lay(a, duong), y = lay(b, duong)
  let doi = ''
  if (typeof x === 'number' && typeof y === 'number' && x) doi = `${y - x > 0 ? '+' : ''}${Math.round(((y - x) / x) * 100)}%`
  console.log(`| ${nhan} | ${so(x)}${x != null ? donVi : ''} | ${so(y)}${y != null ? donVi : ''} | ${doi} |`)
}
console.log('| Chỉ số | Trước | Sau | Đổi |\n|---|---:|---:|---:|')
// Kết quả kịch bản NGẮN (--kich=nhanh) nằm ở man.nhanh; kịch bản đủ ở man.moDau + man.cacMan.
const NHANH = !!lay(a, 'man.nhanh')
const md = NHANH ? 'man.nhanh' : 'man.moDau'
them('Mở đầu · FCP (màn đăng nhập)', `${md}.moDau.fcp`, ' ms')
them('Mở đầu · màn đăng nhập dùng được', `${md}.moDau.dangNhapSanSang`, ' ms')
them('Mở đầu · JS tải trước màn đăng nhập (gzip)', `${md}.moDau.taiToiDangNhap.jsKB`, ' KB')
them('Mở đầu · số tệp JS trước màn đăng nhập', `${md}.moDau.taiToiDangNhap.soJs`)
them('Mở đầu · bấm Đăng nhập → Học tập dùng được', `${md}.moDau.bamDangNhapToiSanh`, ' ms')
them('Mở đầu · JS tải trước Học tập (gzip)', `${md}.moDau.taiToiSanh.jsKB`, ' KB')
them('Mở đầu · JS thô trước Học tập', `${md}.moDau.taiToiSanh.jsThoKB`, ' KB')
them('Mở đầu · phông trước Học tập', `${md}.moDau.taiToiSanh.phongKB`, ' KB')
them('Mở đầu · ảnh trước Học tập', `${md}.moDau.taiToiSanh.anhKB`, ' KB')
them('Mở đầu · TTI (sau Học tập)', `${md}.moDau.tti`, ' ms')
them('Mở đầu · tác vụ dài lớn nhất', `${md}.moDau.taskMax`, ' ms')
them('Mở đầu · TBT', `${md}.moDau.tbt`, ' ms')
for (const k of ['moLai', 'moLai2']) {
  const n = k === 'moLai' ? 'Mở lại (SW)' : 'Mở lại lần 2 (SW)'
  them(`${n} · FCP`, `${md}.${k}.fcp`, ' ms')
  them(`${n} · Học tập dùng được`, `${md}.${k}.sanhSanSang`, ' ms')
  them(`${n} · TTI`, `${md}.${k}.tti`, ' ms')
  them(`${n} · tác vụ dài lớn nhất`, `${md}.${k}.taskMax`, ' ms')
  them(`${n} · TBT (5 s đầu sau Học tập)`, `${md}.${k}.tbt`, ' ms')
}
const lan = (i) => (NHANH ? 'man.nhanh.man' : `man.cacMan.lan.${i}`)
const TEN = {
  sanhYen: 'Học tập đứng yên 5 s',
  vaoCauDaLam: 'Học tập → Câu đã làm', cdlLoc: 'Câu đã làm: lọc "Sai lần gần nhất"', cdlLocTatCa: 'Câu đã làm: lọc "Tất cả"', cdlCuon: 'Câu đã làm: vuốt cuộn 4 s', veSanhTuCdl: 'Câu đã làm → Học tập',
  vaoTuLuyen: 'Học tập → Tu luyện', tlSuaCauSai: 'Tu luyện: thẻ Sửa câu sai', tlDangCauSai: 'Tu luyện: thẻ Dạng câu sai', tlDangBai: 'Tu luyện: thẻ Dạng bài', tlTuDo: 'Tu luyện: thẻ Tự do', tlTongHop: 'Tu luyện: Tổng hợp', tlLuyenDe: 'Tu luyện: Luyện đề cấu trúc', tlLuyen: 'Tu luyện: Luyện', veSanhTuTl: 'Tu luyện → Học tập',
}
for (const i of NHANH ? [0] : [0, 1]) {
  console.log(NHANH ? '\n**Từng màn (kịch bản ngắn, lần đầu mở màn)**\n' : `\n**Từng màn — lượt ${i + 1} (${i ? 'mở lại màn, mảnh đã có' : 'lần đầu mở màn, mảnh lười tải qua Slow 4G'})**\n`)
  console.log('| Bước | chuyển màn ms (trước→sau) | tác vụ dài max ms | INP ms | khung p95 ms / FPS p95 | commit · component vẽ lại |\n|---|---|---|---|---|---|')
  for (const [k, ten] of Object.entries(TEN)) {
    const x = lay(a, `${lan(i)}.${k}`), y = lay(b, `${lan(i)}.${k}`)
    if (!x && !y) continue
    const c = (f) => `${so(x && x[f])} → ${so(y && y[f])}`
    const khung = x && x.p95Ms != null ? `${x.p95Ms}/${x.fpsP95} → ${y ? `${y.p95Ms}/${y.fpsP95}` : '—'}` : ''
    console.log(`| ${ten} | ${x && x.chuyenMs != null ? c('chuyenMs') : ''} | ${c('taskMax')} | ${x && x.inp != null ? c('inp') : ''} | ${khung} | ${so(x && x.commit)}·${so(x && x.veLai)} → ${so(y && y.commit)}·${so(y && y.veLai)} |`)
  }
}
const g = NHANH ? 'man.nhanh' : 'man.cacMan'
console.log(`\nHeap cuối kịch bản: ${so(lay(a, g + '.heapMB'))} → ${so(lay(b, g + '.heapMB'))} MB · nút DOM ${so(lay(a, g + '.dom.nut'))} → ${so(lay(b, g + '.dom.nut'))}`)
