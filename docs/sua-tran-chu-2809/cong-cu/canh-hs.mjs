export const APP = 'hs'
export const HS = { sbd: 'HS1000', hoTen: 'Nguyễn Thị Phương Thảo Nguyên', lop: '12A1 Chuyên Hoá', namSinh: '2009', token: 'tk-gia' }
export async function vaoHs(p, base, them) {
  await p.addInitScript((hs) => { try { localStorage.setItem('omr_student_portal_auth', JSON.stringify(hs)) } catch { } }, HS)
  await p.goto(base + '/hs')
  await p.waitForTimeout(2500)
  if (them) await them(p)
}
const bam = async (p, ten, cho = 1200) => { await p.getByRole('button', { name: ten }).first().click(); await p.waitForTimeout(cho) }
export const CANH = [
  { ten: 'hs-sanh', chay: (p, { base }) => vaoHs(p, base) },
  { ten: 'hs-caudalam', chay: (p, { base }) => vaoHs(p, base, p => bam(p, /Câu đã làm/, 2500)) },
  { ten: 'hs-vaothi', chay: (p, { base }) => vaoHs(p, base, p => bam(p, /^Vào thi/, 2500)) },
  { ten: 'hs-lambai', chay: (p, { base }) => vaoHs(p, base, async p => { await bam(p, /^Vào thi/, 2000); await p.getByPlaceholder(/543998/).fill('704000'); await bam(p, /^Vào ca kiểm tra$/, 9000) }) },
  { ten: 'hs-caudalam-chitiet', chay: (p, { base }) => vaoHs(p, base, async p => { await bam(p, /Câu đã làm/, 2500); const nut = p.getByRole('button', { name: /Xem lời giải/ }).first(); if (await nut.isVisible()) await nut.click(); else await p.locator('text=Câu 2').first().click({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(1500) }) },
  { ten: 'hs-tuido', chay: (p, { base }) => vaoHs(p, base, p => bam(p, /Túi đồ/, 4000)) },
  { ten: 'hs-sotay', chay: (p, { base }) => vaoHs(p, base, async p => { await bam(p, /Túi đồ/, 4000); await bam(p, /^Sổ tay/, 1500) }) },
  { ten: 'hs-dao', chay: (p, { base }) => vaoHs(p, base, p => bam(p, /Khám phá Bát Linh Đảo/, 4000)) },
  { ten: 'hs-doan', chay: (p, { base }) => vaoHs(p, base, p => bam(p, /PHÁ .* PHỤC KÍCH/i, 4000)) },
  ...['', '?man=khoa'].map((q, i) => ({ ten: 'xt-dao2' + (i ? '-khoa' : ''), chay: async (p, { base }) => { await p.goto(base + '/src/game/than-thu-v2/dao2/xem-thu.html' + q); await p.waitForTimeout(3000) } })),
  ...['chon', 'so-tay', 'tui', 'tham&buoc=cau', 'tham&buoc=no', 'tham&buoc=sai', 'tham&buoc=xong', 'tham&buoc=cau&phan=II'].map(m => ({ ten: 'xt-dao-' + m.replace(/[&=]/g, '-'), chay: async (p, { base }) => { await p.goto(base + '/src/game/than-thu-v2/dao/xem-thu.html?man=' + m); await p.waitForTimeout(2500) } })),
  ...['tran', 'cot-loi', 'ket-qua', 'trum', 'tiep-suc', 'thang', 'thua', 'sanh'].map(m => ({ ten: 'xt-doan-' + m, chay: async (p, { base }) => { await p.goto(base + '/src/game/than-thu-v2/doan2/xem-thu-2.html?man=' + m); await p.waitForTimeout(3000) } })),
  ...['cua-hang', 'thu-do', 'tu-do'].map(m => ({ ten: 'xt-shop-' + m, chay: async (p, { base }) => { await p.goto(base + '/src/game/than-thu-v2/shop/xem-thu.html?tre=0&ten=Phượng Hoàng Lửa Rực Rỡ&man=' + m); await p.waitForTimeout(2500); await p.evaluate(() => document.querySelector('section.spirit-game > div')?.remove()) } })),
]
export { bam }
