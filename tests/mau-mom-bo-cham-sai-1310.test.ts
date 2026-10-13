import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'

const script = resolve('scripts/kiem-mau-giu-nguyen.mjs')
const khung = 'export const man = `<section style="color: rgb(30, 41, 59);">Màn đang dùng</section>`;\n'
const mau = readFileSync(resolve('tests/fixtures/mom-html-tu-cham-legacy-1310.txt'), 'utf8')
const mauTuCham = `async function nopBaiCuaMom() { try { const htmlKetQua = ${mau}; return htmlKetQua } catch {} }\n`
const theCu = readFileSync(resolve('tests/fixtures/the-chien-dich-cu-1410.txt'), 'utf8')
const caiDatCu = readFileSync(resolve('tests/fixtures/cai-dat-cu-1410.txt'), 'utf8')
const caiDatMoi = readFileSync(resolve('tests/fixtures/cai-dat-moi-1410.txt'), 'utf8')

function kiem(cu: string, moi: string | null, tep = 'src/screens/StudentPortalScreen.tsx') {
  const thu = mkdtempSync(join(tmpdir(), 'mau-mom-1310-'))
  try {
    const file = join(thu, tep)
    mkdirSync(dirname(file), { recursive: true })
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

describe('Ngoại lệ nguyên tệp game đã có bằng chứng', () => {
  const tep = 'src/game/than-thu-v2/spirit-2d.css'
  const cu = readFileSync(resolve('tests/fixtures/mau-game-da-ngung-1410.txt'), 'utf8')
  it('chỉ miễn đúng đường dẫn và hash đã soát khi gỡ nguyên tệp', () => {
    expect(kiem(cu, null, tep).status).toBe(0)
    expect(kiem(cu, null, 'src/game/than-thu-v2/thu-moi.css').status).toBe(1)
    expect(kiem(cu + '\n.x { color: rgb(1, 2, 3) }', null, tep).status).toBe(1)
  })
  it('giữ tệp nhưng đổi hoặc cắt màu vẫn bị chặn', () => {
    expect(kiem(cu, '', tep).status).toBe(1)
    expect(kiem(cu, cu + '\n.x { color: rgb(1, 2, 3) }', tep).status).toBe(1)
  })
})

describe('Giữ màu khi gỡ thẻ quản lý chiến dịch cũ', () => {
  const tep = 'src/screens/CaiDatScreen.tsx'
  it('gỡ nguyên thẻ đã ngừng dùng nhưng giữ màu các thẻ khác', () => {
    expect(kiem(khung + caiDatCu, khung + caiDatMoi, tep).status).toBe(0)
  })
  it('đổi màu còn dùng cùng tệp vẫn bị chặn', () => {
    expect(kiem(khung + caiDatCu, khung.replace('rgb(30, 41, 59)', 'rgb(0, 0, 0)'), tep).status).toBe(1)
  })
  it('sửa một phần thẻ, tệp khác hoặc khối tương tự không được miễn', () => {
    expect(kiem(caiDatCu, caiDatCu.replace('var(--nhat)', 'var(--muc)'), tep).status).toBe(1)
    expect(kiem(caiDatCu, '', 'src/screens/ManKhac.tsx').status).toBe(1)
    expect(kiem(caiDatCu.replace('Chiến dịch đã giao', 'Thẻ đang dùng'), '', tep).status).toBe(1)
  })
  it('thẻ trong hàm con còn dùng hoặc xoá nguyên màn Cài đặt vẫn bị chặn', () => {
    expect(kiem(`export default function CaiDatScreen() { function con() { return <>${theCu}</> } return con() }`, '', tep).status).toBe(1)
    expect(kiem(caiDatCu, null, tep).status).toBe(1)
  })
  it.each(['Chiến dịch đã giao', 'moChienDichDaGiao'])('đổi nhãn/callback %s của thẻ vẫn còn không che được đổi màu', (chu) => {
    const van = caiDatCu.replace(chu, 'QuanLyBai')
    expect(kiem(van + khung, van + khung.replace('rgb(30, 41, 59)', 'rgb(0, 0, 0)'), tep).status).toBe(1)
    expect(kiem(caiDatCu + khung, van + khung.replace('rgb(30, 41, 59)', 'rgb(0, 0, 0)'), tep).status).toBe(1)
  })
})
