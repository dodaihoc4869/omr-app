// @vitest-environment node
// THỬ TẢI 28/10 — SINH DỮ LIỆU GIẢ cho D1 sao `omr-thu-tai` (luật #543: cấm export D1 thật). CHỈ chạy khi SINH_GIA=1 (bỏ qua trong bộ test thường).
// Cách làm: lược đồ đủ migration (tests/_d1-that.ts, node:sqlite) ⇒ hạt giống theo SỐ ĐẾM của D1 thật (scripts/thu-tai/dem-that-2810.json: số em theo
// khối, số câu theo tờ, cờ cấu hình) ⇒ CHẠY CHÍNH MÃ MÁY CHỦ (`worker.fetch` Sảnh / mở chặng / nộp câu / đếm + `worker.scheduled` cron) qua
// SO_NGAY ngày giả ⇒ các bảng đường nóng (phiên, lượt làm, sổ học, EXP, hành trình, Gói 7…) mang đúng hình dạng mã thật tạo ra. Thêm sổ học nguồn
// khác (thi, BTVN, ôn lại…) theo đúng tỉ lệ nguồn của bản thật. Kết quả: SQLite ở SINH_RA (+ thư mục kho câu R2 ở SINH_KHO). Không có dữ liệu thật nào.
import { it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
import { ghiSuKien, type SuKien } from '../server/src/su-kien-hoc'
import type { Env } from '../server/src/kieu'

const BAT = process.env.SINH_GIA === '1'
const SEED = process.env.SEED || 'seed-thu-local-0000000000000000000000000000'
const SO_NGAY = Number(process.env.SO_NGAY || 2)
const SO_EM_GIOI_HAN = Number(process.env.SO_EM || 0) // 0 = đủ như bản thật
const RA = process.env.SINH_RA || '/tmp/thu-tai-gia.sqlite'
const KHO_RA = process.env.SINH_KHO || '/tmp/thu-tai-kho'
const DEM = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scripts/thu-tai/dem-that-2810.json'), 'utf8')) as {
  hocSinhTheoLop: [string, number][]; cauTheoTo: [string, number][]; nguonSoHoc: [string, number][]; dem: Record<string, number>; coBat: string[]
}

// Ngẫu nhiên TẤT ĐỊNH (chạy lại ra cùng dữ liệu).
let s0 = 20261028
const ng = () => { s0 = (s0 * 1664525 + 1013904223) >>> 0; return s0 / 2 ** 32 }
const chon = <T,>(a: readonly T[]): T => a[Math.floor(ng() * a.length)]!
const chu = (n: number) => { const tu = ['dung dịch', 'phản ứng', 'kim loại', 'este', 'amine', 'polymer', 'điện phân', 'khối lượng', 'mol', 'nồng độ', 'thể tích', 'khí', 'kết tủa', 'oxi hoá', 'khử', 'muối', 'acid', 'base', 'chất béo', 'glucose']; let s = ''; while (s.length < n) s += chon(tu) + ' '; return s.trim() }
const khoiCua = (maDe: string): string | null => { const m = /(?:^|-)(10|11|12)-/.exec(`-${maDe}`); return m ? m[1]! : null }
const matKhauThu = (sbd: string) => `tt-${SEED.slice(0, 16)}-${sbd}`
const ky = (p: string) => crypto.createHmac('sha256', SEED).update(p).digest('hex')
const sha = (v: unknown) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex')
const token = (sbd: string, now: number) => { const p = Buffer.from(JSON.stringify({ sbd, exp: now + 60 * 86400000, pwd: sha(matKhauThu(sbd)) }), 'binary').toString('base64'); return `${p}.${ky(p)}` }

it.skipIf(!BAT)('sinh dữ liệu giả cho D1 sao omr-thu-tai', async () => {
  const t0 = performance.now()
  const d = taoD1That()
  const env = { ...(d.env as unknown as Env), MA_BI_MAT: SEED } as Env
  const q = (s: string, ...v: unknown[]) => d.sql.prepare(s).run(...(v as never[]))
  const HOM_NAY = Date.parse(process.env.HOM_NAY || new Date().toISOString().slice(0, 10) + 'T00:00:00Z') - 7 * 3600_000 // 00:00 VN hôm nay
  const ngayBatDau = HOM_NAY - SO_NGAY * 86400_000
  const iso = (ms: number) => new Date(ms).toISOString()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(ngayBatDau - 86400_000)

  // ── 1. Cờ cấu hình (đúng danh sách cờ đang BẬT ở bản thật; không đọc giá trị thật nào).
  const co: Record<string, string> = {
    game_hoa_2: '{"bat":true}', omni: '{"bat":true}', bi_a: '{"bat":true,"lop":[],"sbd":[]}', goi_bai_7_v1: JSON.stringify({ bat: true, batDau: iso(ngayBatDau).slice(0, 10) }),
    kiem_tra_ca_nhan_v1: '{"bat":true}', hanh_trinh_3_0910_v1: '{"bat":true}', chua_cau_sai_v1: '{"bat":true,"lop":[],"sbd":[]}', bo_nao: '{"bat":true}', shop_phu_kien: '{"bat":true}',
    danh_gia_hoc_that: '"bat"', exp_moi: JSON.stringify({ tu: iso(ngayBatDau - 86400_000), toanBo: true }), hs_tam_dong: 'tat', khoi_phuc_chien_dich_rieng_0810_v1: '{"xong":true}', chuyen_doi_cap: 'xong', chuyen_doi_cap_v3: 'xong',
  }
  for (const [k, v] of Object.entries(co)) q('INSERT OR REPLACE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES(?,?,?)', k, v, iso(ngayBatDau - 86400_000))

  // ── 2. Học sinh theo khối (đúng số em mỗi khối). Lớp 12 chia ba lớp như bản thật.
  const em: { sbd: string; khoi: string }[] = []
  let stt = 0
  for (const [lop, n] of DEM.hocSinhTheoLop) for (let i = 0; i < n; i++) em.push({ sbd: `9${String(1000000 + ++stt).slice(1)}`, khoi: lop })
  const emDung = SO_EM_GIOI_HAN ? em.slice(0, SO_EM_GIOI_HAN) : em
  const LOP12 = ['12 - Lớp Thường', '12 - Lớp Thường', '12 - Lớp Thường', '12 - Tinh Hoa', '12 - Nhóm 10 điểm']
  for (const e of emDung) {
    const tenLop = e.khoi === '12' ? chon(LOP12) : null
    q('INSERT INTO hoc_sinh(sbd,ho_ten,lop,ten_lop,trang_thai,mat_khau,tao_luc,cap_nhat_luc) VALUES(?,?,?,?,NULL,?,?,?)', e.sbd, `Học sinh thử ${e.sbd.slice(-3)}`, e.khoi, tenLop, matKhauThu(e.sbd), iso(ngayBatDau - 30 * 86400_000), iso(ngayBatDau))
    q('INSERT OR IGNORE INTO danh_sach(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,?,?)', e.sbd, `Học sinh thử ${e.sbd.slice(-3)}`, e.khoi, iso(ngayBatDau))
  }

  // ── 3. Kho câu giả: đúng mã tờ + số câu mỗi tờ của bản thật; chữ dài như câu thật (đề ~400 ký tự, lời giải ~900).
  const qTheoTo = new Map<string, string[]>()
  const khoR2: Record<string, unknown> = {}
  const stQ = d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)')
  const stCh = d.sql.prepare("INSERT OR IGNORE INTO cau_hoi(qid,ma_de,lop,cap_nhat_luc) VALUES(?,?,?,'x')")
  for (const [maDe, n] of DEM.cauTheoTo) {
    const khoi = khoiCua(maDe) ?? '12'
    const ds: string[] = [], phan: Record<string, unknown[]> = { phanI: [], phanII: [], phanIII: [] }
    for (let i = 0; i < n; i++) {
      const qid = `${maDe}-q${i + 1}`
      const p = i % 5 === 4 ? 'II' : i % 7 === 6 ? 'III' : 'I'
      const dang = `${maDe}.D${i % 4}`
      const correct = p === 'I' ? 'ABCD'[i % 4]! : p === 'II' ? 'DSDS' : String(10 + (i % 90))
      const text = chu(250 + (i % 5) * 80)
      const cau = {
        qid, maDe, version: 'v1', group: `g-${qid}`, phan: p, text, choices: p === 'I' ? [chu(30), chu(30), chu(30), chu(30)] : [], ideas: p === 'II' ? [chu(60), chu(60), chu(60), chu(60)] : [],
        hinhAnh: [], dang, tenDang: `Dạng ${dang}`, mucDo: ['NB', 'TH', 'VD', 'VDC'][i % 4], sao: 1 + (i % 3), kienThuc: [chu(20)], correct, reviewed: true, soO: p === 'III' ? correct.length : undefined,
        solution: { chot: chu(200), tungPa: {}, loiGiai: chu(700) },
      }
      stQ.run(maDe, qid, 'v1', `g-${qid}`, dang, JSON.stringify(cau))
      stCh.run(qid, maDe, khoi)
      ;(phan[`phan${p}`] as unknown[]).push({ id: qid, text, choices: cau.choices, ideas: cau.ideas, correct, dang: { ma: dang, ten: `Dạng ${dang}` }, mucDo: cau.mucDo, kienThuc: cau.kienThuc, loiGiai: cau.solution })
      ds.push(qid)
    }
    qTheoTo.set(maDe, ds)
    khoR2[`kho/${maDe}.json`] = phan
    q('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,?,0,?)', maDe, `Tờ ${maDe}`, n, 'v1')
    q('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)', maDe, 'v1', iso(ngayBatDau))
  }
  for (const [k, v] of Object.entries(khoR2)) d.objects.set(k, JSON.stringify(v))

  // ── 4. Bài đã dạy (tick): đúng số dòng theo lớp của bản thật; mỗi bài gồm các tờ DH-<khối>-… liên tiếp.
  const { damBaoBangBaiDaDay } = await import('../server/src/bai-da-day')
  await damBaoBangBaiDaDay(env)
  const toDH = (k: string) => DEM.cauTheoTo.map(([m]) => m).filter((m) => m.startsWith(`DH-${k}-`) && !/-(DT|VD)$/.test(m))
  const tick: [string, number][] = [['10', 1], ['11', 2], ['12 - Lớp Thường', 2], ['12 - Nhóm 10 điểm', 1], ['12 - Tinh Hoa', 2]]
  for (const [lop, n] of tick) {
    const ds = toDH(lop.slice(0, 2))
    for (let i = 0; i < n; i++) {
      const ma = ds.slice(i * 2, i * 2 + 2)
      if (!ma.length) continue
      d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)').run(`bai-${lop}-${i}`, lop, `B${i + 1}`, `Bài ${i + 1}`, i + 1, JSON.stringify(ma), iso(ngayBatDau - 86400_000))
    }
  }
  // Hành trình 3 khối + Gói 7: đúng hàm cron của máy chủ dựng.
  const { SQL_BANG_HANH_TRINH, dongBoBaHanhTrinh } = await import('../server/src/hanh-trinh-hop-nhat')
  for (const s of SQL_BANG_HANH_TRINH) d.sql.exec(s)
  await dongBoBaHanhTrinh(env, ngayBatDau - 3600_000)
  const { dongBoGoi7 } = await import('../server/src/goi-bai-7')
  await dongBoGoi7(env, ngayBatDau - 3600_000)
  console.log(`Hạt giống xong sau ${Math.round((performance.now() - t0) / 1000)} s · em ${emDung.length} · câu ${DEM.cauTheoTo.reduce((n, x) => n + x[1], 0)}`)

  // ── 5. Lịch sử học: chạy CHÍNH mã máy chủ qua SO_NGAY ngày.
  const ctx = { waitUntil: (p: Promise<unknown>) => { phu.push(p) }, passThroughOnException() {} }
  let phu: Promise<unknown>[] = []
  const goi = async (sbd: string, lenh: string, than: Record<string, unknown>, now: number) => {
    const r = await worker.fetch(new Request(`https://thu/game-v2/${lenh}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...than, token: token(sbd, now) }) }), env, ctx as never)
    const j = (await r.json()) as Record<string, unknown>
    const p = phu; phu = []; await Promise.allSettled(p)
    return j
  }
  const cron = async (bieu: string) => { try { await (worker as unknown as { scheduled(e: { cron: string }, env: Env): Promise<void> }).scheduled({ cron: bieu }, env) } catch (e) { demLoi[`cron ${String((e as Error)?.message).slice(0, 50)}`] = (demLoi[`cron ${String((e as Error)?.message).slice(0, 50)}`] ?? 0) + 1 } }
  const demLoi: Record<string, number> = {}
  let soNop = 0, soChang = 0
  for (let ngay = 0; ngay < SO_NGAY; ngay++) {
    const goc = ngayBatDau + ngay * 86400_000
    vi.setSystemTime(goc + 60_000); await cron('1 17 * * *') // 00:01 VN
    let t = goc + 18 * 3600_000 // 18:00 VN
    const hom = emDung.filter(() => ng() < 0.8)
    for (let i = 0; i < hom.length; i++) {
      const e = hom[i]!
      if (i % 25 === 0) { vi.setSystemTime(t); await cron('* * * * *') }
      vi.setSystemTime((t += 2_000)); await goi(e.sbd, 'hoc-tap-sanh', {}, t)
      const soCh = 1 + Math.floor(ng() * 5)
      for (let c = 0; c < soCh; c++) {
        vi.setSystemTime((t += 2_000))
        const s = await goi(e.sbd, 'hoc-tap-start', {}, t)
        const cau = Array.isArray(s.questions) ? (s.questions as { qid: string; phan: string; soO?: number }[]) : []
        if (!s.id || !cau.length) { const k = `start rỗng: ${String(s.error ?? s.message ?? '').slice(0, 40)}`; demLoi[k] = (demLoi[k] ?? 0) + 1; break }
        soChang++
        for (const x of cau) {
          vi.setSystemTime((t += 1_500))
          const dung = ng() < 0.62
          const tra = x.phan === 'I' ? (dung ? null : chon(['A', 'B', 'C', 'D'])) : x.phan === 'II' ? chon(['DSDS', 'DDSS', 'SSDD', 'DSSD']) : String(10 + Math.floor(ng() * 90))
          // Câu I: đúng ~62% (đọc đáp án giả theo quy luật sinh: chữ cái theo số thứ tự câu).
          const so = Number(/-q(\d+)$/.exec(x.qid)?.[1] ?? 1) - 1
          const r = await goi(e.sbd, 'answer', { session: s.id, qid: x.qid, answer: tra ?? 'ABCD'[so % 4], assisted: ng() < 0.1, msLam: Math.round(8_000 + ng() * 60_000) }, t)
          if (typeof r.correct === 'boolean') soNop++
          else { const k = `nộp lỗi: ${String(r.error ?? '').slice(0, 40)}`; demLoi[k] = (demLoi[k] ?? 0) + 1 }
          await goi(e.sbd, 'hoc-tap-dem', {}, t)
        }
      }
      await goi(e.sbd, 'hoc-tap-sanh', {}, t)
    }
    console.log(`Ngày ${ngay + 1}/${SO_NGAY}: ${hom.length} em · tổng ${soChang} chặng / ${soNop} câu nộp · ${Math.round((performance.now() - t0) / 1000)} s`)
  }

  // ── 5b. NHÂN BẢN lịch sử cũ hơn cho đủ khối lượng bản thật (mô phỏng từng lượt thì chậm): chép các bảng lịch sử đường nóng, lùi SO_NGAY × k ngày,
  // đổi mã phiên (UUID: «-4» của nhóm phiên bản ⇒ «-c<k>») và thêm hậu tố vào khoá chính ⇒ không trùng. 14 ngày gần nhất là lịch sử chạy thật.
  const soLuot = Number((d.sql.prepare('SELECT COUNT(*) n FROM game_v2_attempt').get() as { n: number }).n)
  const soBan = Math.max(0, Math.min(4, Math.round((DEM.dem.game_v2_attempt * (SO_EM_GIOI_HAN ? emDung.length / em.length : 1)) / Math.max(1, soLuot)) - 1))
  const SPEC: Record<string, { uuid?: string[]; hau?: string[]; iso?: string[]; ngay?: string[]; ms?: string[] }> = {
    game_v2_session: { uuid: ['id', 'json'], iso: ['created_at'] },
    game_v2_attempt: { uuid: ['id', 'session', 'json'], iso: ['created_at'] },
    su_kien_hoc: { uuid: ['khoa', 'ma_nguon', 'attempt_id', 'raw_json'], iso: ['luc'], ngay: ['ngay_vn'], ms: ['received_at'] },
    exp_so: { uuid: ['ma_nguon'], hau: ['khoa'], iso: ['luc'], ngay: ['ngay_vn'] },
    loi_giai_hoi: { iso: ['luc'] },
    game_v2_reward: { hau: ['id'], iso: ['created_at'] },
  }
  for (let k = 1; k <= soBan; k++) {
    const lui = SO_NGAY * k
    for (const [t, sp] of Object.entries(SPEC)) {
      const cot = (d.sql.prepare(`SELECT name FROM pragma_table_info('${t}')`).all() as { name: string }[]).map((x) => x.name)
      const bt = cot.map((c) => {
        let x = `"${c}"`
        if (sp.uuid?.includes(c)) x = `replace(${x}, '-4', '-c${k}')`
        if (sp.hau?.includes(c)) x = `replace(${x}, '-4', '-c${k}') || '~c${k}'`
        if (sp.iso?.includes(c)) x = `strftime('%Y-%m-%dT%H:%M:%fZ', ${x}, '-${lui} days')`
        if (sp.ngay?.includes(c)) x = `date(${x}, '-${lui} days')`
        if (sp.ms?.includes(c)) x = `(${x} - ${lui * 86400_000})`
        return x
      })
      d.sql.exec(`INSERT OR IGNORE INTO "${t}"(${cot.map((c) => `"${c}"`).join(',')}) SELECT ${bt.join(',')} FROM "${t}" WHERE ${sp.iso ? `"${sp.iso[0]}" >= '${iso(ngayBatDau)}'` : '1'}`)
    }
  }
  console.log(`Nhân bản lịch sử: ${soBan} bản (lượt làm mô phỏng ${soLuot}) · ${Math.round((performance.now() - t0) / 1000)} s`)

  // ── 6. Sổ học nguồn khác (thi, BTVN, ôn lại…) đúng tỉ lệ nguồn bản thật (bù phần game đã có thật từ bước 5).
  const tongSo = DEM.nguonSoHoc.reduce((n, x) => n + x[1], 0)
  const heSo = (SO_EM_GIOI_HAN ? emDung.length / em.length : 1) * Math.min(1, (SO_NGAY * (soBan + 1)) / 35)
  const qAll = [...qTheoTo.values()].flat()
  for (const [nguon, n] of DEM.nguonSoHoc) {
    if (nguon === 'game') continue
    const ds: SuKien[] = []
    for (let i = 0; i < Math.round(n * heSo); i++) {
      const e = chon(emDung), ms = HOM_NAY - Math.floor(ng() * SO_NGAY * (soBan + 1) * 86400_000)
      ds.push({ nguon: nguon as SuKien['nguon'], maNguon: `${nguon}-${Math.floor(i / 40)}`, sbd: e.sbd, qid: chon(qAll), lan: 1, ketQua: ng() < 0.6 ? 1 : 0, luc: iso(ms) })
      if (ds.length >= 2000) { await ghiSuKien(env, ds.splice(0)) }
    }
    if (ds.length) await ghiSuKien(env, ds)
  }
  // OMNI: hồ sơ vi kỹ năng mỗi em (bản thật ~2.770 dòng/em, Sảnh đọc cả hồ sơ của em) — ghi thẳng đúng cột mã thật dùng.
  const soVkn = Math.round((DEM.dem.omni_p_vkn ?? 0) / 274)
  const stV = d.sql.prepare("INSERT OR REPLACE INTO omni_p_vkn (sbd, vkn_id, p, n_tu_lam, n_cau, n_ngay, n_troi_chay, n_cau_la_dung, diem_sprt, trang_thai, day_lai, phien_ban, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,'vung',0,'omni3-v1',?)")
  const dang = DEM.cauTheoTo.flatMap(([m]) => [0, 1, 2, 3].map((k) => `${m}.D${k}`))
  d.sql.exec('BEGIN')
  for (const e of emDung) for (let i = 0; i < soVkn; i++) stV.run(e.sbd, `${dang[i % dang.length]}${i >= dang.length ? `#${Math.floor(i / dang.length)}` : ''}`, ng(), Math.floor(ng() * 20), Math.floor(ng() * 30), Math.floor(ng() * 10), 0, 0, ng() * 3 - 1.5, iso(HOM_NAY - 86400_000))
  d.sql.exec('COMMIT')
  vi.useRealTimers()

  // ── 7. Em thử tải + báo cáo số dòng so với bản thật.
  d.sql.exec('DROP TABLE IF EXISTS thu_tai_em; CREATE TABLE thu_tai_em(sbd TEXT PRIMARY KEY)')
  for (const e of emDung.slice(0, 270)) q('INSERT INTO thu_tai_em(sbd) VALUES(?)', e.sbd)
  const so = (t: string) => { try { return Number((d.sql.prepare(`SELECT COUNT(*) n FROM "${t}"`).get() as { n: number }).n) } catch { return -1 } }
  const bang = (d.sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((x) => x.name)
  const lech = bang.map((t) => [t, so(t), DEM.dem[t] ?? 0] as const).filter(([, a, b]) => a > 1000 || b > 1000).sort((x, y) => y[2] - x[2])
  console.log('Bảng lớn (giả / thật):\n' + lech.map(([t, a, b]) => `  ${t}: ${a} / ${b}`).join('\n'))
  console.log('Lỗi gặp khi sinh:', JSON.stringify(demLoi))
  fs.mkdirSync(KHO_RA, { recursive: true })
  for (const [k, v] of d.objects) { const f = path.join(KHO_RA, encodeURIComponent(k)); fs.writeFileSync(f, typeof v === 'string' ? v : JSON.stringify(v)) }
  if (fs.existsSync(RA)) fs.rmSync(RA)
  d.sql.exec(`VACUUM INTO '${RA.replace(/'/g, "''")}'`)
  console.log(`Xong sau ${Math.round((performance.now() - t0) / 1000)} s ⇒ ${RA} (${Math.round(fs.statSync(RA).size / 1048576)} MB) · R2 ${d.objects.size} tệp`)
}, 6 * 3600_000)
