// PHÉP KIỂM hai lệnh mới của máy chủ, chạy KHÔNG cần mạng: thay D1 và R2 bằng
// hai vật giả đọc thẳng cây `xong/Dạng bài/` trên ổ cứng.
import fs from 'node:fs'
import path from 'node:path'
const APP = process.env.APP, KHO = process.env.KHO
const { createJiti } = await import(APP + '/node_modules/jiti/lib/jiti.mjs')
const jiti = createJiti(APP + '/kiem-import.mjs', { interopDefault: true })
const G = await jiti.import(APP + '/server/src/goi-cu.ts')

// Gom tờ dạng bài thật
const to = []
const di = (d) => {
  for (const t of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, t.name)
    if (t.isDirectory()) di(p)
    else if (t.name.endsWith('.json')) to.push(p)
  }
}
di(path.join(KHO, 'xong', 'Dạng bài'))
const goi = new Map()
const dong = []
for (const p of to) {
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  goi.set(`kho/${j.ma_de}.json`, j)
  dong.push({ ma_de: j.ma_de, nhom: j.nhom, so_cau: j.cau.length })
}

const env = {
  DB: { prepare: (sql) => ({
    bind: (...a) => ({
      first: async () => (sql.includes('FROM de_kho WHERE ma_de = ?') ? (goi.has(`kho/${a[0]}.json`) ? { ma_de: a[0] } : null) : null),
      all: async () => ({ results: [] }),
    }),
    all: async () => ({ results: sql.includes("LIKE 'DB-%'") ? dong : [] }),
    first: async () => null,
  }) },
  DE: { get: async (k) => (goi.has(k) ? { body: JSON.stringify(goi.get(k)) } : null) },
}

let loi = 0
const dat = (ten, ok, them = '') => { console.log(`${ok ? '  ĐẠT ' : '  TRƯỢT'} ${ten}${them ? ' — ' + them : ''}`); if (!ok) loi++ }

console.log('PHÉP KIỂM LỆNH LUYỆN DẠNG BÀI')
console.log('─────────────────────────────')
const dm = await G.danhMucDangBai(env)
dat('danhMucDangBai trả ok', dm.ok === true)
dat('đủ 55 dạng', dm.tongDang === to.length, `${dm.tongDang}/${to.length}`)
dat('đủ 3 lớp 10/11/12', dm.lops.map((l) => l.lop).join(',') === '10,11,12', dm.lops.map((l) => l.lop).join(','))
const tenBaiSai = dm.lops.flatMap((l) => l.bais).filter((b) => !/^Bài \d+\./.test(b.tenBai))
dat('mọi tên bài theo dáng "Bài N. …"', tenBaiSai.length === 0, tenBaiSai.map((b) => b.tenBai).join(' | '))
const soCau0 = dm.lops.flatMap((l) => l.bais).flatMap((b) => b.dangs).filter((d) => d.soCau <= 0)
dat('không dạng nào 0 câu', soCau0.length === 0, soCau0.map((d) => d.ma).join(','))
const baiXep = dm.lops.map((l) => l.bais.map((b) => Number(/^Bài (\d+)/.exec(b.tenBai)[1])))
dat('bài xếp tăng dần theo số bài', baiXep.every((ds) => ds.every((n, i) => i === 0 || ds[i - 1] <= n)), JSON.stringify(baiXep))

const mot = dong[0].ma_de
const r1 = await G.deTheoDangBai(env, { ma: mot })
dat(`deTheoDangBai('${mot}') trả trọn tờ`, r1.ok === true && Array.isArray(r1.de?.cau) && r1.de.cau.length === dong[0].so_cau,
    `${r1.de?.cau?.length} câu`)
const r2 = await G.deTheoDangBai(env, { ma: '12-KT-C1-D2' })
dat('chặn mã KHÔNG phải dạng bài', r2.ok === false, r2.error)
const r3 = await G.deTheoDangBai(env, { ma: 'DB-../../secret' })
dat('chặn mã có ký tự lạ', r3.ok === false, r3.error)
const r4 = await G.deTheoDangBai(env, { ma: 'DB-KHONG-CO' })
dat('mã dạng không có trong kho → báo rõ', r4.ok === false, r4.error)

console.log(loi === 0 ? '\nKẾT LUẬN: ĐẠT' : `\nKẾT LUẬN: TRƯỢT — ${loi} phép`)
process.exit(loi === 0 ? 0 : 1)
