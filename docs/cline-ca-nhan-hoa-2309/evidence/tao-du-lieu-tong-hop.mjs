// P00 bước 6 — DỮ LIỆU TEST TỔNG HỢP (CNH-1.0).
// Không dùng dữ liệu học sinh thật: mọi định danh là SYNTHETIC.
// Sinh tập fixture tái lập được (seed cố định) cho các gói sau dùng lại.
//
// Chạy: node docs/cline-ca-nhan-hoa-2309/evidence/tao-du-lieu-tong-hop.mjs
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const SEED = 23092026

/** PRNG tất định (mulberry32) — cùng seed cho cùng tập dữ liệu. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = rng(SEED)
const DANG = ['C1-B1', 'C1-B2', 'C2-B1', 'C2-B3', 'C3-B1']

/** Hai em CÙNG LỚP nhưng KHÁC phạm vi cá nhân (điều kiện bắt buộc của P00 bước 6). */
const HOC_SINH = [
  {
    sbd: 'SYNTHETIC-A',
    lop: 'SYNTH-LOP-10A1',
    muc: 'manh, nhiều lịch sử',
    soSuKien: 240,
    tyLeDung: 0.82,
    scope: ['C1-B1', 'C1-B2', 'C2-B1'],
    thieuFamily: false,
    vi: 700,
    khien: 2,
    soManhKhien: 7,
    coSo: true,
  },
  {
    sbd: 'SYNTHETIC-B',
    lop: 'SYNTH-LOP-10A1',
    muc: 'yếu, ít lịch sử, thiếu family',
    soSuKien: 18,
    tyLeDung: 0.35,
    scope: ['C1-B1'],
    thieuFamily: true,
    vi: 399,
    khien: 0,
    soManhKhien: 20,
    coSo: false,
  },
]

const ngayVN = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso))

/** Lịch sử học tổng hợp: cùng lịch sử chuẩn hóa cho mọi hồ sơ. */
function sinhSuKien(hs, mocBatDau) {
  const ra = []
  for (let i = 0; i < hs.soSuKien; i++) {
    const luc = new Date(mocBatDau + i * 3600_000 + Math.floor(rand() * 600) * 1000).toISOString()
    const dung = rand() < hs.tyLeDung
    ra.push({
      khoa: `${hs.sbd}|SYN-${i}|0`,
      sbd: hs.sbd,
      qid: `SYN-${DANG[i % DANG.length]}-${(i % 12) + 1}`,
      nguon: i % 3 === 0 ? 'btvn' : 'on-lai',
      ketQua: dung ? 1 : 0,
      giay: 40 + Math.floor(rand() * 160),
      luc,
      ngayVn: ngayVN(luc),
      maDang: DANG[i % DANG.length],
      chuyenDe: `SYN-CD-${(i % 4) + 1}`,
      // Cố ý để family trống với em thiếu family: KHÔNG bịa family.
      familyId: hs.thieuFamily ? null : `SYN-FAM-${i % 6}`,
      assisted: i % 17 === 0,
      independent: i % 17 !== 0,
    })
  }
  return ra
}

const mocBatDau = Date.parse('2026-08-24T05:00:00Z') // 12:00 giờ VN
const duLieu = {
  specVersion: 'CNH-1.0',
  seed: SEED,
  ghiChu: 'Dữ liệu TỔNG HỢP cho kiểm thử CNH-1.0. Không phải học sinh thật. Tái lập bằng seed.',
  lop: 'SYNTH-LOP-10A1',
  hocSinh: HOC_SINH.map((hs) => ({
    ...hs,
    suKien: sinhSuKien(hs, mocBatDau),
  })),
  // Mốc biên bắt buộc phải có ca cố định (06 mục 4)
  bien: {
    vi: [399, 400, 699, 700],
    manhKhien: [20, 21, 42],
    khoKhien: [4, 5, 6],
    cap: [1, 10, 120],
    n: [0, 1, 5],
  },
  // Kho tổng hợp: có câu thiếu family, có câu trùng content_group, có câu bảo vệ.
  kho: Array.from({ length: 30 }, (_, i) => ({
    qid: `SYN-KHO-${i + 1}`,
    questionVersion: '1',
    contentGroup: `SYN-CG-${(i % 10) + 1}`, // cố ý có nhiều qid cùng content_group
    familyId: i % 7 === 0 ? null : `SYN-FAM-${i % 6}`,
    skillIds: [`SYN-SKILL-${(i % 3) + 1}`],
    prerequisiteIds: i % 5 === 0 ? ['SYN-SKILL-0'] : [],
    difficulty: i % 3,
    part: ['I', 'II', 'III'][i % 3],
    qualityStatus: i % 11 === 0 ? 'pending' : 'approved',
    protectedContent: i % 13 === 0,
  })),
}

const out = join(dir, 'du-lieu-tong-hop.json')
mkdirSync(dir, { recursive: true })
const text = JSON.stringify(duLieu, null, 2) + '\n'
writeFileSync(out, text)
const sha256 = createHash('sha256').update(text).digest('hex')
console.log(`Đã sinh ${out}`)
console.log(`seed=${SEED} · học sinh=${duLieu.hocSinh.length} · sự kiện=${duLieu.hocSinh.reduce((a, h) => a + h.suKien.length, 0)} · câu kho=${duLieu.kho.length}`)
console.log(`sha256=${sha256}`)
