export const APP = 'gv'
export async function vaoGv(p, base, man) {
  await p.addInitScript(() => { try { localStorage.setItem('ddh.coHoa2', JSON.stringify({ bat: true, lop: [], sbd: [] })) } catch { } })
  await p.goto(base + '/gv')
  await p.evaluate(async () => {
    const m = await import('/src/lib/exam-db.ts')
    await m.saveTeacherSecret('ma-gia')
    await m.saveCauHinhMayChu({ BAT: true, URL: 'https://omr.ttadodaihoc.workers.dev' })
  })
  await p.reload()
  await p.waitForSelector('.ben-trai', { timeout: 15000, state: 'attached' })
  if (man) await p.evaluate(async (man) => { const { useAppStore } = await import('/src/store/appStore.ts'); useAppStore.getState().setScreen(man) }, man)
  await p.waitForTimeout(1500)
}
const bam = async (p, ten) => { await p.getByRole('button', { name: ten }).first().click(); await p.waitForTimeout(900) }
export const CANH = [
  { ten: 'gv-tongquan', chay: (p, { base }) => vaoGv(p, base, 'tongquan') },
  { ten: 'gv-lichsuca', chay: (p, { base }) => vaoGv(p, base, 'lichsuca') },
  { ten: 'gv-chiendich', chay: (p, { base }) => vaoGv(p, base, 'chiendich') },
  { ten: 'gv-goilenbang', chay: (p, { base }) => vaoGv(p, base, 'goilenbang') },
  { ten: 'gv-hocsinh', chay: (p, { base }) => vaoGv(p, base, 'hocsinh') },
  { ten: 'gv-nganhangde', chay: (p, { base }) => vaoGv(p, base, 'nganhangde') },
  { ten: 'gv-caidat', chay: (p, { base }) => vaoGv(p, base, 'caidat') },
  { ten: 'gv-examsetup', chay: (p, { base }) => vaoGv(p, base, 'examsetup') },
  { ten: 'gv-exammonitor', chay: async (p, { base }) => { await vaoGv(p, base, 'lichsuca'); await p.evaluate(async () => { const { useAppStore } = await import('/src/store/appStore.ts'); useAppStore.getState().moChiTietCa('704000') }); await p.waitForTimeout(2500) } },
  { ten: 'gv-chieuma', chay: async (p, { base }) => { await vaoGv(p, base, 'lichsuca'); await p.evaluate(async () => { const { useAppStore } = await import('/src/store/appStore.ts'); useAppStore.getState().moChiTietCa('704000') }); await p.waitForTimeout(2500); await bam(p, /Chiếu mã vào thi/); await p.waitForTimeout(1000) } },
  { ten: 'gv-caidat-kythuat', chay: async (p, { base }) => { await vaoGv(p, base, 'caidat'); await bam(p, 'Công cụ kỹ thuật') } },
  { ten: 'gv-giaochiendich', chay: async (p, { base }) => { await vaoGv(p, base, 'chiendich'); await bam(p, /Giao chiến dịch mới/); await p.waitForTimeout(1200) } },
  { ten: 'gv-bangchiendich', chay: async (p, { base }) => { await vaoGv(p, base, 'chiendich'); await bam(p, /^Xem bảng/); await p.waitForTimeout(1200) } },
  { ten: 'gv-goilenbang-ca', chay: async (p, { base }) => { await vaoGv(p, base, 'goilenbang'); await bam(p, /Gọi lên bảng theo một ca/); await p.waitForTimeout(1200) } },
  { ten: 'gv-hocsinh-baocao', chay: async (p, { base }) => { await vaoGv(p, base, 'hocsinh'); await bam(p, /^Báo cáo/); await p.waitForTimeout(1500) } },
  { ten: 'gv-hocsinh-lichsu', chay: async (p, { base }) => { await vaoGv(p, base, 'hocsinh'); await bam(p, /^Lịch sử ca kiểm tra/); await p.waitForTimeout(1500) } },
  { ten: 'gv-toancanh', chay: async (p, { base }) => { await vaoGv(p, base, 'hocsinh'); await bam(p, 'Nguyễn Thị Phương Thảo Nguyên'); await p.waitForTimeout(1500) } },
]
export { bam }
