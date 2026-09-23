// TRANG XEM THỬ TẠM cho việc C — KHÔNG commit. ?c=<tên>&... dựng một component với dữ liệu giả.
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import '/src/styles/tokens.css'
import PhongVaoThi from '/src/components/PhongVaoThi'
import ThongBaoHocSinh from '/src/components/ThongBaoHocSinh'
import LuyenDeChuan from '/src/components/LuyenDeChuan'
import KhoiKhacPhuc3CheDo from '/src/components/KhoiKhacPhuc3CheDo'
import ModalKhacPhucCauSai from '/src/components/ModalKhacPhucCauSai'
import BaoCaoCaThiHocSinhModal from '/src/components/BaoCaoCaThiHocSinhModal'
import BaoCaoCaThiPhuHuynhModal from '/src/components/BaoCaoCaThiPhuHuynhModal'
import MaCaInput from '/src/components/MaCaInput'
import PhongChoGame from '/src/components/PhongChoGame'
import TamTruotHoiBai from '/src/components/TamTruotHoiBai'
import BangTinPhuHuynh from '/src/components/BangTinPhuHuynh'
import KhungXemPhieuMoi from '/src/components/KhungXemPhieu'
import KhungXemPhieuCu from './KhungCu'
import { dungPhieu } from '/src/lib/html-phieu'
import PhieuScreen from '/src/screens/PhieuScreen'
import LogoGiaoVien from '/src/components/LogoGiaoVien'
import LogoPhuHuynh from '/src/components/LogoPhuHuynh'
import LogoHocSinh from '/src/components/LogoHocSinh'
import ParentPortalScreen from '/src/screens/ParentPortalScreen'
import StudentPortalScreen from '/src/screens/StudentPortalScreen'
import KhoaAppScreen from '/src/screens/KhoaAppScreen'

const q = new URLSearchParams(location.search)
const c = q.get('c') || 'phong'
const hai = (n: number) => new Date(Date.now() - n * 60000).toISOString()

const DS = [
  { id: 'n1', title: 'BTVN Ancol · Lô 2/4 vừa mở', body: 'Thầy vừa giao 6 câu, hạn 21:00 tối nay. Em làm ngay nhé.', target: 'btvn', created_at: hai(0), read_at: null },
  { id: 'n2', title: 'Bài của Mẹ giao', body: 'Mẹ giao 8 câu ôn dạng Este. Bắt đầu lúc nào cũng được.', target: 'mom', created_at: hai(50), read_at: null },
  { id: 'n3', title: 'Bài cũ đã xong', body: 'Bạn đã hoàn thành BTVN tuần trước với 5/6 câu đúng.', target: 'btvn', created_at: hai(3 * 1440), read_at: hai(1) },
]
const BANK = {
  phanI: [{ id: 'a1', text: 'Ancol nào sau đây là ancol bậc II?', choices: ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'] }],
  phanII: [{ id: 'b1', text: 'Cho phản ứng oxi hoá ethanol bằng CuO. Mỗi phát biểu đúng hay sai?', ideas: ['Ethanol bị oxi hoá thành aldehyde.', 'CuO đóng vai trò chất khử.', 'Sản phẩm hữu cơ có tên ethanal.', 'Phản ứng xảy ra ở nhiệt độ thường.'] }],
  phanIII: [{ id: 'c1', text: 'Đốt cháy hoàn toàn 4,6 gam ethanol thu được V lít CO2 (đkc). Giá trị của V là bao nhiêu?' }],
}
const LICH_SU = [
  { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', tong: 7.75, tongCau: 28, soCauDung: 20, soCauSai: 8, soCauBoTrong: 0 },
  { maCa: 'CA-ESTE', tenCa: 'Ca Este 12/09', tong: 9, tongCau: 28, soCauDung: 26, soCauSai: 2, soCauBoTrong: 0 },
  { maCa: 'CA-HALO', tenCa: 'Ca Halogen 08/09', tong: 10, tongCau: 28, soCauDung: 28, soCauSai: 0, soCauBoTrong: 0 },
]
const CAU_SAI = [
  { qid: 'q1', soCau: 7, phan: 'I', chuyenDe: 'Ancol', mucDo: 'Nhận biết', dapAnChon: 'A', dapAnDung: 'B', text: 'Ancol nào sau đây là ancol bậc II?', choices: ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'], maCa: 'CA-ANCOL' },
  { qid: 'q2', soCau: 8, phan: 'II', chuyenDe: 'Ancol', mucDo: 'Thông hiểu', dapAnChon: 'DSDS', dapAnDung: 'DSDD', text: 'Cho phản ứng oxi hoá ethanol. Mỗi phát biểu đúng hay sai?', ideas: ['a', 'b', 'c', 'd'], maCa: 'CA-ANCOL' },
  { qid: 'q3', soCau: 9, phan: 'III', chuyenDe: 'Este', mucDo: 'Vận dụng', dapAnChon: '4,48', dapAnDung: '4,96', text: 'Tính V lít CO2.', maCa: 'CA-ESTE' },
]
const nguoc = window.fetch.bind(window)
window.fetch = (async (url: any, init?: any) => {
  const u = String(url)
  const ok = (b: any) => ({ ok: true, status: 200, json: async () => b, text: async () => JSON.stringify(b) }) as any
  if (u.includes('/hs/lich-su')) return ok({ ok: true, items: [
    { maCa: 'CA-HALO', tenCa: 'Ca Halogen 08/09', tong: 6.5, tongCau: 28, soCauDung: 17, soCauSai: 11, nopLuc: '2026-09-08T10:00:00Z' },
    { maCa: 'CA-ESTE', tenCa: 'Ca Este 12/09', tong: 8.25, tongCau: 28, soCauDung: 23, soCauSai: 5, nopLuc: '2026-09-12T10:00:00Z' },
    { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', tong: 9.5, tongCau: 28, soCauDung: 26, soCauSai: 2, nopLuc: '2026-09-15T10:00:00Z' } ] })
  if (u.includes('/hs/cau-sai')) return ok({ ok: true, items: CAU_SAI })
  if (u.includes('/daily-honors')) return ok({ ok: true, day: '2026-09-19', live: true, winners: q.get('vd') === '1' ? [1, 2, 3].map((r) => ({ rank: r, name: 'Học sinh ' + r, nickname: 'Em ' + r, score: 10 - r * 0.25, level: 1, pet: null, seconds: 300 + r * 40, exam: 'Ca Ancol' })) : [] })
  if ((u.includes('/student-news/') || u.includes('/parent-news/')) && q.get('norep') === '1') return ok({ ok: true, daily: null })
  if (u.includes('/student-news/') || u.includes('/parent-news/')) return ok({ ok: true, daily: q.get('xong') === '1' ? { id: 'd1', submitted_at: new Date().toISOString() } : null, report: { day: '2026-09-19', updatedAt: new Date().toISOString(), today: [{ tenCa: 'Ca Ancol 15/09', diem: 9.5, nopLuc: '2026-09-15T10:00:00Z' }], weak: [{ name: 'Este – xà phòng', count: 3 }, { name: 'Ancol bậc II', count: 2 }], wrong: 5, pending: q.get('pend') === '0' ? 0 : 3, pendingDetails: q.get('pend') === '0' ? { btvn: 0, mom: 0, daily: 0 } : { btvn: 1, mom: 1, daily: 1 }, questionCount: 8, assignmentCount: 1, minutes: 12, mode: 'on_lai', reason: 'Ôn lại các câu vừa sai để nhớ lâu.', duDoanDiem: { diem: 8.5, khoangDiem: '8,0 – 9,0', thang: 'tháng 6', nhanXet: 'Điểm ca gần đây nằm trong khoảng 8,0 – 9,5.', doTinCay: 'trung_binh' }, keHoach: { tongCau: 8, soCauSuaLoi: 4, soCauOnBaiCu: 2, soCauTienBo: 2, phuongPhap: 'Sửa lỗi trước, ôn bài cũ, rồi câu tiến bộ.' } } })
  if (u.includes('/notifications/')) return ok({ ok: true, items: q.get('rong') === '1' ? [] : DS, publicKey: '' })
  if (u.includes('/luyen-de/history')) return ok({ ok: true, items: [{ id: 'p1', createdAt: Date.now() - 3600_000, status: 'active', score: null }, { id: 'p0', createdAt: Date.now() - 86400_000, status: 'submitted', score: 7.5 }] })
  if (u.includes('/luyen-de/')) {
    const xong = q.get('done') === '1'
    return ok({ ok: true, id: 'p1', status: xong ? 'submitted' : 'active', deadline: Date.now() + 40 * 60000, serverNow: Date.now(), answers: xong ? { a1: 'A', b1: 'DSDS', c1: '4,48' } : {}, bank: BANK, result: { score: 6.5 },
      solutions: xong ? [{ phanI: [{ id: 'a1', correct: 'B', explanation: 'CH3–CH(OH)–CH3 là ancol bậc II vì nhóm OH gắn vào cacbon bậc II.' }], phanII: [{ id: 'b1', correct: ['D', 'S', 'D', 'D'] }], phanIII: [{ id: 'c1', correct: '4,96', explanation: 'V = 0,2 x 24,79 = 4,96 lít.' }] }] : undefined })
  }
  if (u.startsWith('http')) return ok({ ok: true, items: [], nguon: [], ds: [], ca: [], winners: [], day: '2026-09-19', live: true })
  return nguoc(url, init)
}) as any
if (c === 'thongbao') history.replaceState(null, '', location.pathname + location.search + '&thongbao=1')

const CAU_PHIEU: any[] = [
  { phan: 'I', id: 'q1', maDe: 'X', chuyenDe: 'Este – lipit', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Este X có công thức C4H8O2, tên gọi của X là gì?', luaChon: ['Etyl axetat', 'Metyl propionat', 'Propyl fomat', 'Butyl fomat'], dapAn: 'A', chot: 'Este no đơn chức mạch hở.', lyDo: null, buoc: ['Viết công thức.'], ketQua: '' },
  { phan: 'II', id: 'q2', maDe: 'X', chuyenDe: 'Este – lipit', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Xét đúng sai từng ý về tính chất của este:', luaChon: ['Este tan tốt trong nước.', 'Este có mùi thơm đặc trưng.', 'Este bị thuỷ phân trong môi trường axit.', 'Este là hợp chất ion.'], dapAn: 'SDDS', chot: 'c', lyDo: null, buoc: ['Bước một.'], ketQua: '' },
  { phan: 'III', id: 'q3', maDe: 'X', chuyenDe: 'Este – lipit', dang: 'chua_ro', sao: 0, mucDo: 'hieu', text: 'Đốt cháy 4,4 gam este thu được V lít CO2. Tính V.', luaChon: null, dapAn: '4,96', chot: 'c', lyDo: null, buoc: ['Bước một.'], ketQua: '' },
]
const TT_PHIEU: any = { hoTen: 'Nguyễn Văn Minh', sbd: '12001', ngay: new Date(2026, 8, 19), tenChuyenDe: 'Este', ketQua: '', hienDapAn: true }
const KhungXemPhieu = q.get('cu') === '1' ? KhungXemPhieuCu : KhungXemPhieuMoi
if (q.get('gv') === '1') history.replaceState(null, '', '/?' + location.search.slice(1).replace(/vai=[^&]*&?/, ''))
const GOI_V2: any = {
  v: 2, hoTen: 'Bùi Hồng Hân', sbd: '12054', lop: '12', tenCa: 'Ca Este 12/09', maCa: '447479', ngay: '2026-09-08T12:09:17.983Z', diem: 7.88,
  diemPhan: { I: 3.38, II: 3, III: 1.5 }, soCauSai: 3, tongSoCau: 12, hang: 10, siSo: 36, chuyenDeCa: [], chuyenDeTong: [], lichSu: [], diemLop: [], vieCanLam: 'Làm lại 3 câu Este còn sai.',
  thongKe: null, tinHieu: [], ducKet: [], cauSai: [], dai: [], deCuaEm: CAU_PHIEU,
}
if (c === 'phieu-cho') { location.hash = '#ABCDEFGHJK'; window.fetch = (() => new Promise(() => {})) as any }
if (c === 'phieu-loi-cho') { location.hash = '#ABCDEFGHJK'; window.fetch = (async () => { throw new TypeError('Failed to fetch') }) as any }
function Ung() {
  if (c === 'logo-thanh') return <div style={{ padding: 16, background: 'var(--nen)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 14 }}>{[<LogoGiaoVien size={38} hienChu />, <LogoHocSinh size={38} hienChu />, <LogoPhuHuynh size={38} hienChu />].map((x, i) => <div key={i} style={{ background: 'var(--the)', border: '1px solid var(--vien)', borderRadius: 16, padding: 12 }}>{x}</div>)}<div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><LogoGiaoVien size={64} /><LogoHocSinh size={64} /><LogoPhuHuynh size={64} /></div></div>
  if (c === 'dn-ph') return <ParentPortalScreen />
  if (c === 'dn-hs') return <StudentPortalScreen />
  if (c === 'dn-gv') return <KhoaAppScreen pha="mo" banGhi={null as any} onMoDuoc={() => {}} />
  if (c === 'phieu' || c === 'phieu-cho' || c === 'phieu-loi' || c === 'phieu-loi-cho') return <PhieuScreen duCoSan={c === 'phieu' ? GOI_V2 : undefined} laCuaEm={q.get('em') === '1'} />
  if (c === 'khung') {
    const html = q.get('ct') === 'doc' ? dungPhieu({ ...TT_PHIEU, giaoDienHocSinh: true }, CAU_PHIEU) : dungPhieu(TT_PHIEU, CAU_PHIEU, { nop: { ma: 'abcd1234ef', sbd: '12001', url: 'https://may.test/exec' } })
    return <div className="m3" style={{ background: 'var(--m3-surface)', minHeight: '100vh', padding: 16 }}>Trang app phía sau khung.<KhungXemPhieu html={html} ten={q.get('ten') || 'Đề em vừa làm'} dong={() => {}} /></div>
  }
  if (c === 'thongbao') return <div style={{ minHeight: '100vh', padding: 16, display: 'flex', justifyContent: 'flex-end', background: 'var(--nen)' }}><div className="m3" style={{ background: 'var(--m3-surface)', width: '100%', minHeight: 300, padding: 12, display: 'flex', justifyContent: 'flex-end' }}><ThongBaoHocSinh token="t" onOpen={() => {}} /></div></div>
  if (c === 'luyen') return <div style={{ padding: 12, background: 'var(--nen)', minHeight: '100vh' }}><LuyenDeChuan sbd="12001" token="t" /></div>
  if (c === 'kp') return <div style={{ padding: 12, background: 'var(--nen)', minHeight: '100vh' }}><KhoiKhacPhuc3CheDo sbd="12001" hoTen="Nguyễn Văn Minh" dsLichSu={LICH_SU} scriptUrl="https://may.test" initialCheDo={(Number(q.get('mode')) || 1) as 1 | 2 | 3 | 4} vaiTro={q.get('ph') === '1' ? 'ph' : 'hs'} /></div>
  const BAI = { maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', ngayThi: '15/09/2026', ngayNop: '2026-09-15T10:00:00Z', diem: 9.5, diemI: 4.5, diemII: 3.5, diemIII: 1.5, thoiGianPhut: 41, soCauDung: 26, soCauSai: 2, tongCau: 28, tongSoCau: 28, soCauDungMotPhan: 0, soCauBoTrong: 0, soYDungII: 14, soYTongII: 16, lanThu: 1 }
  if (c === 'bchs') return <BaoCaoCaThiHocSinhModal baiThi={BAI as any} hoTen="Nguyễn Văn Minh" sbd="12001" lop="12A1" scriptUrl="https://may.test" onClose={() => {}} onBatDauKhacPhuc={() => {}} onMoLaiBaiThi={() => {}} tabMacDinh={q.get('tab') || 'tong_quan'} />
  if (c === 'bcph') return <BaoCaoCaThiPhuHuynhModal baiThi={BAI as any} hoTenCon="Minh" sbd="12001" lop="12A1" scriptUrl="https://may.test" onClose={() => {}} onGiaoBaiChoCon={() => {}} onNhanTinChoThay={() => {}} />
  if (c === 'bangtin') return <div style={{ background: 'var(--nen)', minHeight: '100vh', padding: 12 }}><BangTinPhuHuynh sbd="12001" studentToken={q.get('ph') ? undefined : 't'} hoTen="Nguyễn Văn Minh" lop="12A1" onSent={() => {}} activeTab="bantin" onSelectTab={() => {}} tabStats={{ diemCount: 5, btvnCount: 2, momCount: 1, wrongCount: 5 }} caGanNhat={{ maCa: 'CA-ANCOL', tenCa: 'Ca Ancol 15/09', diem: 9.5 }} /></div>
  if (c === 'tam') {
    const ct = (phan: 'I' | 'II' | 'III', soCau: number, de: string, lc: string[] | null, dung: string, chon: string) => ({ qid: 'q' + soCau, chiTiet: { phan, soCau, qid: 'q' + soCau, chuyenDe: 'Ancol', mucDo: 'Nhận biết', giay: 48, de, luaChon: lc, dapAnDung: dung, dapAnChon: chon, chot: 'Ancol bậc II có nhóm OH gắn vào cacbon bậc II.', lyDo: null, buoc: null, ketQua: '', coHinh: false } })
    return <div className="m3"><TamTruotHoiBai daCongBo cau={[ct('I', 7, 'Ancol nào sau đây là ancol bậc II?', ['CH3–CH2–OH', 'CH3–CH(OH)–CH3', '(CH3)3C–OH', 'CH3–OH'], 'B', 'A'), ct('III', 9, 'Đốt cháy 4,6 gam ethanol thu V lít CO2. Tính V.', null, '4,96', '4,48')] as any} dong={() => {}} gui={() => {}} /></div>
  }
  if (c === 'maca') return <div className="m3" style={{ background: 'var(--m3-surface)', minHeight: '100vh', padding: 20 }}><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--m3-on-surface-variant)', marginBottom: 10 }}>Mã ca (6 số thầy cho)</div><MaCaInput value={q.get('v') ?? '483'} onChange={() => {}} autoFocus /></div>
  if (c === 'cho') return <div className="m3" style={{ background: 'var(--m3-surface)', minHeight: '100vh', padding: 8 }}><PhongChoGame cho={{ thoiGianPhut: 50, tenCa: 'Ca Ancol 15/09', lop: '12A1' }} loiCho={q.get('loi') ? 'Mất kết nối, đang thử lại…' : null} /></div>
  if (c === 'modal') return <ModalKhacPhucCauSai isOpen onClose={() => {}} dsCauSai={CAU_SAI as any} hoTen="Nguyễn Văn Minh" sbd="12001" tieuDeCa="Ca Ancol 15/09" />
  return <PhongVaoThi onClose={() => {}}><div style={{ padding: 16 }}>Nội dung của cổng học sinh (do StudentPortalScreen dựng).</div></PhongVaoThi>
}
createRoot(document.getElementById('root')!).render(<Ung />)
