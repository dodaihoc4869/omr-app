// KIỂM DỌN THEO `mocReset` TRÊN INDEXEDDB THẬT (Chromium, hồ sơ TẠM — không đụng dữ liệu máy thầy) — 19/09/2026.
//
// Chạy: dev server ở http://localhost:5173, rồi `node scripts/do-moc-reset-indexeddb.mjs`.
// 21/09 (thầy đổi, Boss chuyển): reset GIỮ TOÀN BỘ ca thi — danh sách DỌN RỖNG. Nạp `omr-exam` bằng chính các hàm của `exam-db.ts`
// (ca cache, bank ca, bài làm, khoá settings theo ca/em, buổi chữa dở, độ khó theo câu, lịch ôn lại, kho đề, cấu hình), gọi
// `donDuLieuTheoMocReset`, rồi đối chiếu: MỌI THỨ còn nguyên, dấu đã ghi, gọi lần hai vẫn đếm 0.
// Thoát mã 1 nếu lệch.
import { chromium } from 'playwright'

const URL = process.env.URL_DEV || 'http://localhost:5173/'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto(URL)
const kq = await page.evaluate(async () => {
  const E = await import('/src/lib/exam-db.ts')
  const nguon = (maDe) => ({ maDe, phanI: [], phanII: [], phanIII: [] })
  // ── dữ liệu theo ca/em (trước 21/09 là nhóm DỌN, nay GIỮ) ──
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
  // ── độ khó, lịch ôn lại, cấu hình ──
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
chuan(`lần 1 phải xoá 0 bản ghi và 0 khoá settings (được ${JSON.stringify(lan1)})`, lan1.soBanGhi === 0 && lan1.soKhoaSettings === 0)
chuan(`lần 2 phải đếm 0 (được ${JSON.stringify(lan2)})`, lan2.soBanGhi === 0 && lan2.soKhoaSettings === 0)
chuan('dữ liệu theo ca/em phải NGUYÊN', sau.bank === 2 && sau.ca?.maCa === '111111' && sau.luot?.sbd === '12000' && sau.soCau?.I === 1 && sau.khoChua?.length === 1 && sau.deRieng && sau.cheDo === true && sau.qidRaPhieu.length === 1 && sau.diem.length === 1 && sau.buoi?.phienBan === 1)
chuan('độ khó, lịch ôn, cấu hình phải nguyên', sau.khoDoKho?.q1?.luot === 3 && sau.onLai?.['12000::D01'] === 1 && sau.url === 'https://may-chu.example/x' && sau.bime === 'BI-MAT-THU-KHONG-PHAI-THAT' && sau.suaDang.q1 === 'D01' && sau.khoDe.join() === 'D1,D2' && sau.tokHs === 'tok-hs' && sau.tokPh === 'tok-ph' && sau.sbd === '12000' && sau.sdt === '0900000000' && sau.giuPhien === true)
chuan('dấu đã dọn phải là mốc', sau.dau === '2026-09-21')
console.log(JSON.stringify({ truoc, lan1, lan2, sau: { ...sau, bime: sau.bime ? '(còn, ẩn)' : '' } }, null, 1))
if (loi.length) {
  console.error('SAI:\n - ' + loi.join('\n - '))
  process.exit(1)
}
console.log('ĐẠT: reset GIỮ toàn bộ (ca, bank, bài làm, buổi dở, điểm, kho đề, cấu hình…), dấu ghi đúng, đếm 0 hai lần — trên IndexedDB thật của Chromium')
