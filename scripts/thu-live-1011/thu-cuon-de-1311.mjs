#!/usr/bin/env node
// THỬ RIÊNG «CUỘN ĐỀ» TRÊN MÁY EM (13/11 — thầy, buổi Live theo khối: «Đề trên máy học sinh không vuốt cuộn xuống được»). Chromium thật, phòng THẬT
// trong Node; ≈ 2 phút — dò lỗi cuộn đề không cần chạy cả bộ lớn (thu-gv-that-1211.mjs chạy CÙNG nhóm bước này ở cuối). Các bước: cuon-de-buoc.mjs.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-cuon-de-1311.mjs <thư mục tạm> [thư mục ảnh] [--so-luoc]
// `--so-luoc`: chỉ đo cuộn tới cuối / về đầu ở bốn máy em (lấy số đo trên bản CHƯA sửa — các bước còn lại cần bản đã sửa).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { thuCuonDe } from './cuon-de-buoc.mjs'

const thamSo = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const DIST = resolve(thamSo[0] ?? 'dist-thu-live')
const ANH = thamSo[1] ? resolve(thamSo[1]) : null
if (ANH) mkdirSync(ANH, { recursive: true })
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] })
const chup = async (p, ten) => { if (!ANH) return; let q = 76, buf; do { buf = await p.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150 * 1024 && q > 24); writeFileSync(join(ANH, `${ten}.jpg`), buf) }
await thuCuonDe({ trinh, dist: DIST, kiem, chup, loiTrang, soLuoc: process.argv.includes('--so-luoc') })
await trinh.close()
const hong = ket.filter((k) => !k.dat)
if (loiTrang.length) console.log('LỖI TRANG:', [...new Set(loiTrang)].slice(0, 6).join(' | '))
console.log(`\n${ket.length - hong.length}/${ket.length} bước đạt${hong.length ? ' · TRƯỢT: ' + hong.map((k) => k.ten.split(' ')[0]).join(', ') : ''}`)
process.exit(hong.length || loiTrang.length ? 1 : 0)
