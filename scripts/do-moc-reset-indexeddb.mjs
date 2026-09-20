// KIỂM DỌN THEO `mocReset` TRÊN INDEXEDDB THẬT (Chromium, hồ sơ TẠM — không đụng dữ liệu máy thầy) — 19/09/2026.
//
// Chạy: dev server ở http://localhost:5173, rồi `node scripts/do-moc-reset-indexeddb.mjs`.
// Reset GIỮ độ khó theo câu (`khoDoKho`) và hàng đợi ôn giãn cách (`lichOnLai`) — Boss chốt 21/09.
// Nạp `omr-exam` bằng chính các hàm của `exam-db.ts` (ca cache, bank ca, bài làm, khoá settings theo ca/em, kho đề, cấu hình),
// gọi `donDuLieuTheoMocReset`, rồi đối chiếu: nhóm DỌN sạch, nhóm GIỮ nguyên, dấu đã ghi, gọi lần hai đếm 0.
// Thoát mã 1 nếu lệch.
import { chromium } from 'playwright'

const URL = process.env.URL_DEV || 'http://localhost:5173/'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(URL)
const kq = await page.evaluate(async () => {
  const E = await import('/src/lib/exam-db.ts')
  const nguon = (maDe) => ({ maDe, phanI: [], phanII: [], phanIII: [] })
  // ── nhóm DỌN ──
  await E.cacheSession({ maCa: '111111', lop: 'Lớp thử', thoiGianPhut: 45, bank: null })
  await E.saveSessionTeacherBank('111111', [nguon('D1')])
  await E.saveSessionTeacherBank('222222', [nguon('D2')])
  await E.saveAttempt({ key: '111111:12000', maCa: '111111', sbd: '12000', maDe: 'D1', startedAt: new Date().toISOString(), durationMinutes: 45, answers: E.emptyAnswerRecord(), integrity: E.emptyIntegrityLog(), submitted: false, submittedAt: null, pendingSubmit: false })
  await E.luuSoCauCa('111111', { I: 1, II: 1, III: 1 })
  await E.luuKhoChuaCa('111111', [nguon('D1')])
  await E.luuDeRiengCa('111111', { 12000: ['q1'] }, { 12000: { q1: 1 } })
  await E.luuCheDoDeRieng('111111', true)
  await E.themQidRaPhieu('12000', ['q1'])
  await E.luuDiemCuaEm({ maCa: '111111', sbd: '12000', tenCa: 'x', ngay: '2026-09-19', tong: 8 })
  await E.luuBuoiChua('-|Lop|111111', { phienBan: 1 })
  // ── nhóm GIỮ ──
  await E.luuKhoDoKho({ q1: { luot: 3 } })
  await E.luuLichOnLai({ '12000::D01': 1 })
  await E.saveScriptUrl('https://may-chu.example/x')
  await E.saveTeacherSecret('BI-MAT-THU-KHONG-PHAI-THAT')
  await E.saveSoSuaDang({ q1: 'D01' })
  await E.saveExamSource(nguon('D1'))
  await E.saveExamSource(nguon('D2'))
  await E.saveTokenHocSinh('tok-hs')
  await E.saveTokenPhuHuynh('tok-ph')
  await E.saveMyStudentSbd('12000')
  await E.saveMyParentPhone('0900000000')
  await E.luuGiuPhien(true)

  const truoc = { bank: (await E.loadAllSessionTeacherBanks()).length, kho: (await E.loadExamSources()).length, dau: await E.docMocResetDaDon() }
  const lan1 = await E.donDuLieuTheoMocReset('2026-09-21')
  const lan2 = await E.donDuLieuTheoMocReset('2026-09-21')
  const sau = {
    bank: (await E.loadAllSessionTeacherBanks()).length,
    ca: await E.loadCachedSession('111111'),
    luot: await E.loadAttempt('111111', '12000'),
    soCau: await E.docSoCauCa('111111'),
    khoChua: await E.docKhoChuaCa('111111'),
    deRieng: await E.docDeRiengCa('111111'),
    cheDo: await E.docCheDoDeRieng('111111'),
    qidRaPhieu: await E.docQidRaPhieu('12000'),
    diem: await E.docLichSuDiem('12000'),
    buoi: await E.docBuoiChua('-|Lop|111111'),
    // GIỮ
    khoDoKho: await E.docKhoDoKho(),
    onLai: await E.docLichOnLai(),
    url: await E.loadScriptUrl(),
    bime: await E.loadTeacherSecret(),
    suaDang: await E.loadSoSuaDang(),
    khoDe: (await E.loadExamSources()).map((s) => s.maDe).sort(),
    tokHs: await E.loadTokenHocSinh(),
    tokPh: await E.loadTokenPhuHuynh(),
    sbd: await E.loadMyStudentSbd(),
    sdt: await E.loadMyParentPhone(),
    giuPhien: await E.docGiuPhien(),
    dau: await E.docMocResetDaDon(),
  }
  return { truoc, lan1, lan2, sau }
})
await browser.close()

const loi = []
const chuan = (dieu, ok) => { if (!ok) loi.push(dieu) }
const { truoc, lan1, lan2, sau } = kq
chuan('trước dọn phải có 2 bank và 2 đề trong kho', truoc.bank === 2 && truoc.kho === 2 && truoc.dau === '')
chuan(`lần 1 phải xoá đúng 4 bản ghi (1 ca cache + 2 bank + 1 bài làm) và 7 khoá settings (được ${JSON.stringify(lan1)})`, lan1.soBanGhi === 4 && lan1.soKhoaSettings === 7)
chuan(`lần 2 phải đếm 0 (được ${JSON.stringify(lan2)})`, lan2.soBanGhi === 0 && lan2.soKhoaSettings === 0)
chuan('nhóm DỌN phải sạch', sau.bank === 0 && !sau.ca && !sau.luot && !sau.soCau && !sau.khoChua && !sau.deRieng && sau.cheDo === false && sau.qidRaPhieu.length === 0 && sau.diem.length === 0 && !sau.buoi)
chuan('nhóm GIỮ phải nguyên', sau.khoDoKho?.q1?.luot === 3 && sau.onLai?.['12000::D01'] === 1 && sau.url === 'https://may-chu.example/x' && sau.bime === 'BI-MAT-THU-KHONG-PHAI-THAT' && sau.suaDang.q1 === 'D01' && sau.khoDe.join() === 'D1,D2' && sau.tokHs === 'tok-hs' && sau.tokPh === 'tok-ph' && sau.sbd === '12000' && sau.sdt === '0900000000' && sau.giuPhien === true)
chuan('dấu đã dọn phải là mốc', sau.dau === '2026-09-21')
console.log(JSON.stringify({ truoc, lan1, lan2, sau: { ...sau, bime: sau.bime ? '(còn, ẩn)' : '' } }, null, 1))
if (loi.length) {
  console.error('SAI:\n - ' + loi.join('\n - '))
  process.exit(1)
}
console.log('ĐẠT: nhóm DỌN sạch, nhóm GIỮ (kho đề, cấu hình, khoá app, token…) nguyên, dấu ghi đúng, lần hai đếm 0 — trên IndexedDB thật của Chromium')
