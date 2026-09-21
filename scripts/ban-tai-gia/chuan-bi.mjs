// BƯỚC 2 CỦA BỘ BẮN TẢI GIẢ (Code 1, 21/09/2026): sau khi `nap-sao-luu.sh` đã nạp bản sao lưu vào D1 CỤC BỘ (scripts/ban-tai-gia/.trang-thai/), tạo 250 em "GIẢ" từ 250 em ĐANG HỌC NHIỀU NHẤT trong bản sao lưu:
//   • hồ sơ (sổ, nam_kt_*, BTVN, game) giữ nguyên để KHỐI LƯỢNG DỮ LIỆU MỖI EM sát thật — chi phí truy vấn phụ thuộc vào đó; nhưng TÊN đổi thành "Em Giả NNN", MẬT KHẨU đổi thành giả riêng của bộ này (`tai-gia-NNN`),
//     và mọi chuỗi đăng nhập/token cũ bị xoá — bộ này KHÔNG dùng lại bất kỳ mật khẩu/token thật nào;
//   • sinh `.dev.vars` (MA_BI_MAT giả, khoá đẩy giả) cho `wrangler dev`, và `.trang-thai/em-gia.json` (danh sách em giả + lớp + số dòng hồ sơ).
// Chỉ chạy khi Worker cục bộ TẮT (mở tệp SQLite trực tiếp). Không in tên/SBD thật ra màn hình.
import { DatabaseSync } from 'node:sqlite'
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'

const GOC = dirname(fileURLToPath(import.meta.url))
const TT = join(GOC, '.trang-thai')
const SO_EM = Number(process.argv.find((a) => a.startsWith('--so-em='))?.split('=')[1] ?? 250)

const thuMuc = join(TT, 'v3/d1/miniflare-D1DatabaseObject')
const tep = existsSync(thuMuc) ? readdirSync(thuMuc).filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite').map((f) => join(thuMuc, f)).sort((a, b) => statSync(b).size - statSync(a).size)[0] : null
if (!tep) { console.error('Chưa có D1 cục bộ — chạy `bash scripts/ban-tai-gia/nap-sao-luu.sh` trước.'); process.exit(1) }
console.log('D1 cục bộ:', tep.replace(GOC, 'scripts/ban-tai-gia'), `(${Math.round(statSync(tep).size / 1e6)} MB)`)

const db = new DatabaseSync(tep)
db.exec('PRAGMA busy_timeout = 20000')
const dem = (b) => Number(db.prepare(`SELECT COUNT(*) AS n FROM ${b}`).get().n)
const co = (b) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(b)
for (const b of ['hoc_sinh', 'su_kien_hoc', 'nam_kt_cau', 'btvn_em', 'game_v2_profile', 'game_v2_question', 'de_kho', 'cau_hinh']) if (co(b)) console.log(`  ${b}: ${dem(b)} dòng`)

// Em đang học nhiều nhất: số dòng sổ học 14 ngày gần nhất (nếu không có bảng sổ thì dùng nam_kt_cau).
const cotHoatDong = co('su_kien_hoc') ? "(SELECT COUNT(*) FROM su_kien_hoc s WHERE s.sbd = h.sbd)" : co('nam_kt_cau') ? "(SELECT COUNT(*) FROM nam_kt_cau s WHERE s.sbd = h.sbd)" : '0'
const cotTrangThai = db.prepare("SELECT 1 FROM pragma_table_info('hoc_sinh') WHERE name='trang_thai'").get() ? "COALESCE(h.trang_thai,'') <> 'khoa'" : '1=1'
const ds = db.prepare(`SELECT h.sbd AS sbd, COALESCE(h.lop,'') AS lop, ${cotHoatDong} AS hoat_dong FROM hoc_sinh h WHERE ${cotTrangThai} ORDER BY hoat_dong DESC, h.sbd LIMIT ?`).all(SO_EM)
if (ds.length === 0) { console.error('Không có em nào trong hoc_sinh.'); process.exit(1) }

db.exec('BEGIN')
const ra = []
const capNhatEm = db.prepare("UPDATE hoc_sinh SET ho_ten = ?, mat_khau = ?, token = NULL WHERE sbd = ?")
const coSdt = db.prepare("SELECT 1 FROM pragma_table_info('hoc_sinh') WHERE name='sdt'").get()
ds.forEach((e, i) => {
  const so = String(i + 1).padStart(3, '0')
  const matKhau = `tai-gia-${so}`
  capNhatEm.run(`Em Giả ${so}`, matKhau, e.sbd)
  if (coSdt) db.prepare('UPDATE hoc_sinh SET sdt = NULL WHERE sbd = ?').run(e.sbd)
  ra.push({ stt: i + 1, sbd: e.sbd, matKhau, lop: e.lop, hoatDong: e.hoat_dong })
})
// Xoá mọi mật khẩu/token THẬT còn lại của các em khác (bản cục bộ không cần và không được giữ): đặt mật khẩu giả riêng.
db.prepare("UPDATE hoc_sinh SET mat_khau = 'khong-dung-' || substr(hex(randomblob(6)),1,12) WHERE mat_khau IS NOT NULL AND mat_khau NOT LIKE 'tai-gia-%'").run()
db.exec('COMMIT')

writeFileSync(join(TT, 'em-gia.json'), JSON.stringify({ taoLuc: new Date().toISOString(), soEm: ra.length, em: ra }, null, 1))
writeFileSync(join(GOC, '.dev.vars'), `MA_BI_MAT=${randomBytes(18).toString('hex')}\nPUSH_PUBLIC_KEY=gia\nPUSH_PRIVATE_KEY=gia\n`)
const theoLop = {}
for (const e of ra) theoLop[e.lop || '(rỗng)'] = (theoLop[e.lop || '(rỗng)'] ?? 0) + 1
console.log(`Đã tạo ${ra.length} em giả (tên "Em Giả NNN", mật khẩu tai-gia-NNN). Theo khối:`, JSON.stringify(theoLop))
console.log('Hoạt động (số dòng sổ) mỗi em: nhỏ nhất', Math.min(...ra.map((e) => e.hoatDong)), '· lớn nhất', Math.max(...ra.map((e) => e.hoatDong)))
console.log('Đã ghi .dev.vars (giả) và .trang-thai/em-gia.json')
// Migration mới hơn bản sao lưu (chỉ-thêm; lỗi "đã có" bỏ qua): bản sao lưu 18:07 chưa có bảng shop phụ kiện.
import { readFileSync as docTep, copyFileSync } from 'node:fs'
for (const m of ['server/migration-2109-shop-phu-kien.sql']) {
  const dg = join(GOC, '../..', m)
  if (!existsSync(dg)) continue
  let ok = 0, boQua = 0
  for (const cau of docTep(dg, 'utf8').split(/;\s*\n/).map((x) => x.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean)) { try { db.exec(cau); ok++ } catch { boQua++ } }
  console.log(`Migration ${m}: ${ok} câu chạy, ${boQua} bỏ qua (đã có)`)
}
// Mẫu để `chay.mjs` sao chép cho mỗi lượt bắn (mỗi lượt bắt đầu từ ĐÚNG cùng một trạng thái).
db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
db.exec('PRAGMA journal_mode=DELETE')
db.close()
copyFileSync(tep, join(TT, 'mau.sqlite'))
writeFileSync(join(TT, 'mau.json'), JSON.stringify({ tenTep: tep.split('/').pop(), saoLuu: (() => { try { return JSON.parse(docTep(join(TT, 'nap.json'), 'utf8')).saoLuu } catch { return '(không rõ)' } })(), taoLuc: new Date().toISOString() }))
console.log('Đã lưu mẫu .trang-thai/mau.sqlite (' + Math.round(statSync(join(TT, 'mau.sqlite')).size / 1e6) + ' MB)')
