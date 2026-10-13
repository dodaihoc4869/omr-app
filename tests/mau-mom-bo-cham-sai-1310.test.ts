import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve('scripts/kiem-mau-giu-nguyen.mjs')
const khung = 'export const man = `<section style="color: rgb(30, 41, 59);">Màn đang dùng</section>`;\n'
const mau = readFileSync(resolve('tests/fixtures/mom-html-tu-cham-legacy-1310.txt'), 'utf8')
const mauTuCham = `async function nopBaiCuaMom() { try { const htmlKetQua = ${mau}; return htmlKetQua } catch {} }\n`

function kiem(cu: string, moi: string | null, tep = 'src/screens/StudentPortalScreen.tsx') {
  const thu = mkdtempSync(join(tmpdir(), 'mau-mom-1310-'))
  try {
    const file = join(thu, tep)
    mkdirSync(join(thu, 'src/screens'), { recursive: true })
    writeFileSync(join(thu, 'index.html'), '<html></html>')
    writeFileSync(file, cu)
    const git = (...args: string[]) => execFileSync('git', args, { cwd: thu, stdio: 'ignore' })
    git('init', '-q'); git('add', 'src', 'index.html')
    git('-c', 'user.name=Kiểm màu', '-c', 'user.email=kiem@example.test', 'commit', '-qm', 'Nền')
    if (moi === null) unlinkSync(file)
    else writeFileSync(file, moi)
    const r = spawnSync(process.execPath, [script, 'HEAD'], { cwd: thu, encoding: 'utf8' })
    return { status: r.status, out: r.stdout + r.stderr }
  } finally { rmSync(thu, { recursive: true, force: true }) }
}

describe('Giữ màu khi bỏ mẫu Mom tự chấm sai', () => {
  it('bỏ toàn mẫu tự chấm nhưng giữ màu màn đang dùng: không phải đổi bảng màu', () => {
    expect(kiem(khung + mauTuCham, khung + 'async function nopBaiCuaMom() { return await mayChu.submit() }').status).toBe(0)
  })
  it('đổi màu màn đang dùng cùng tệp vẫn bị chặn, kể cả trùng màu trong mẫu đã bỏ', () => {
    const r = kiem(khung + mauTuCham, khung.replace('rgb(30, 41, 59)', 'rgb(0, 0, 0)'))
    expect(r.status).toBe(1); expect(r.out).toContain('ĐỔI/XOÁ màu đang có')
  })
  it('sửa một phần màu trong mẫu còn tồn tại vẫn bị chặn', () => {
    expect(kiem(khung + mauTuCham, khung + mauTuCham.replace('rgb(248, 250, 252)', 'rgb(0, 0, 0)')).status).toBe(1)
  })
  it('cùng tên hàm và mẫu ở tệp khác không được miễn kiểm', () => {
    expect(kiem(khung + mauTuCham, khung, 'src/screens/ManKhac.tsx').status).toBe(1)
  })
  it('mẫu khác cùng tên hàm/biến không được miễn kiểm', () => {
    expect(kiem(khung + 'async function nopBaiCuaMom() { const htmlKetQua = `<article style="color: rgb(30, 41, 59);">Khác</article>` }', khung).status).toBe(1)
  })
  it('mẫu của hàm con đang dùng không được miễn kiểm, kể cả cùng literal legacy', () => {
    expect(kiem(khung + `async function nopBaiCuaMom() { function con() { const htmlKetQua = ${mau}; return htmlKetQua } return con() }`, khung).status).toBe(1)
  })
  it('xoá cả tệp vẫn bị chặn', () => {
    expect(kiem(mauTuCham, null).status).toBe(1)
  })
})
