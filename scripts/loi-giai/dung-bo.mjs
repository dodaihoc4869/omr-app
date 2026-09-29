// Dựng `src/lib/loi-giai-bo.ts` từ các bộ chìa khoá `docs/loi-giai-a/bo-chia-khoa/*.json` (nguồn gốc duy nhất).
// Chạy lại mỗi khi thêm/sửa một bộ:  node scripts/loi-giai/dung-bo.mjs
// Máy chủ (kiểm hồ sơ), app và khung đều đọc tệp sinh ra; test `loi-giai-kiem-2909` bắt lệch nếu quên chạy.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const THU_MUC = path.join(GOC, 'docs/loi-giai-a/bo-chia-khoa')
const RA = path.join(GOC, 'src/lib/loi-giai-bo.ts')

export function docCacBo() {
  const bo = {}
  for (const f of fs.readdirSync(THU_MUC).filter((x) => x.endsWith('.json')).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(THU_MUC, f), 'utf8'))
    if (!j.ma || !j.KEYS) throw new Error(`${f}: thiếu ma/KEYS`)
    bo[j.ma] = {
      ma: j.ma, chuong: j.chuong, lop: j.lop ?? '',
      KEYS: Object.fromEntries(Object.entries(j.KEYS).map(([k, v]) => [k, { ten: v.ten, rule: v.rule }])),
      TRAPS_THEM: j.TRAPS_THEM ?? {},
      ...(j.LAB_PRESETS && Object.keys(j.LAB_PRESETS).length ? { LAB_PRESETS: j.LAB_PRESETS } : {}),
      DANG_KEY: j.DANG_KEY ?? {},
      daDuyet: j.daDuyet ?? '',
    }
  }
  return bo
}

export function noiDungTs(bo) {
  return `// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Nguồn: docs/loi-giai-a/bo-chia-khoa/*.json · dựng: node scripts/loi-giai/dung-bo.mjs
// Bộ chìa khoá từng chương cho "Lời giải từng bước". \`daDuyet\` ghi lúc thầy duyệt bộ (chỉ để hiện trên màn duyệt).
import type { BoChiaKhoa } from './loi-giai-kiem'

export interface BoChiaKhoaDu extends BoChiaKhoa { lop: string; DANG_KEY: Record<string, string>; daDuyet: string }

export const BO_CHIA_KHOA: Record<string, BoChiaKhoaDu> = ${JSON.stringify(bo, null, 1)}
`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bo = docCacBo()
  fs.writeFileSync(RA, noiDungTs(bo))
  console.log('đã dựng', path.relative(GOC, RA), '·', Object.keys(bo).join(', '))
}
