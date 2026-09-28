import { TEN, LOP, TEN_DANG, deMau } from './fx.mjs'
const now = Date.now()
const iso = (d) => new Date(now + d).toISOString()
const H = 3600000
const ngay = (d) => new Date(now + d * 86400000 + 7 * H).toISOString().slice(0, 10)
const lichSu = Array.from({ length: 6 }, (_, i) => ({ maCa: String(704000 + i), tenCa: ['Kiểm tra 45 phút chương Ester – Lipid (đề chẵn lẻ, 40 câu trắc nghiệm)', 'Ca sáng thứ Bảy', 'Kiểm tra định kỳ tuần 3'][i % 3], ngayThi: iso(-i * 24 * H), diem: 7.75 - i * 0.5, diemI: 4.25, diemII: 2.5, diemIII: 1, lanThu: 1, tongCau: 28, soCauDung: 20, soCauSai: 8, nopLuc: iso(-i * 24 * H), lop: LOP }))
export const KE_HOACH = {
  ok: true, ngay: ngay(0),
  nganSach: { mucTieuCau: 12, toiThieuCau: 6, vanTocGiay: 78, vanTocNguon: 'do', ghiChuVanToc: '' },
  viec: [
    { id: 'on_lai:' + ngay(0), loai: 'on_lai', soCau: 3, thuTu: 1, batBuoc: false, khan: false, cong: null, hien: true, nhan: 'bu', trangThai: 'cho', ghiChu: 'Ôn 3 câu đã tới hạn nhắc lại', chiTiet: { qid: ['a'] }, hanCung: null, hanMem: null, nguon: 'ho_so' },
  ],
  canhBao: [], quaHan: [],
  tienBo: { daLamCau: 2, lenBac: 1, tutBac: 0, dat: false, toiThieuCau: 6, conThieu: 4 },
  chuoiDat: 12, lanNghi: false, capNhatLuc: iso(-60000),
  thanThu: { pet: 'lua_phuong', cap: 34, nickname: 'Phượng Hoàng Lửa Rực Rỡ', shopBat: true },
  exp: { homNay: 1240, expConThieu: 3860, ongNghiem: 12, hapThuConLaiHomNay: 40, chiTietHomNay: [{ loai: 'cau', exp: 40, ghiChu: 'Làm đúng 4 câu chiến dịch Ester – Lipid' }], manhKhien: { manh: 7, moiKhien: 12, khienConLai: 2 } },
}
export const SANH = { ok: true, cheDo2: true, ngay: ngay(0), chienDich: { id: 'cd-0', ten: 'Ester – Lipid: ôn tập toàn chương trước kiểm tra giữa kỳ', hanNop: ngay(4), D: 5, tong: 124, coXat: 87, thanhThao: 41, canDayLai: 6, thanhThaoTangTu: null }, theLuc: { con: 24, tong: 40 }, huyetChien: true, doan: { con: 3 }, dao: { con: 24 }, khoaDao: false, loiKhoaDao: '', ruong: { daLam: 16, tong: 40, moDuoc: false, daMo: false, qua: null } }
const CAU_DA_LAM = { ok: true, cheDo2: true, chienDich: [{ id: 'cd-0', ten: SANH.chienDich.ten, hanNop: ngay(4), tong: 124 }, { id: 'cd-1', ten: 'Cacbohiđrat', hanNop: ngay(6), tong: 60 }], cau: Array.from({ length: 18 }, (_, i) => ({ qid: 'DE-A-I-' + (i + 1), chienDichId: i % 3 ? 'cd-0' : 'cd-1', stt: i + 1, phan: ['I', 'II', 'III'][i % 3], mucDo: ['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'][i % 4], tenDang: TEN_DANG[i % TEN_DANG.length], trangThai: ['dang_on', 'thanh_thao', 'can_day_lai'][i % 3], lanCuoiDung: i % 2 === 0, henOn: ngay(1 + (i % 3)), lichSu: [{ ngay: ngay(-2), dung: false, coGoiY: true }, { ngay: ngay(-1), dung: true, coGoiY: false }] })) }

export const PROFILE = { nickname: 'Phượng Hoàng Lửa Rực Rỡ', academic: { total: 12400, today: 1240, lastGain: 40, dailyLimit: 2000 }, pet: 'lua_phuong', choice: false, cap: 34, exp: 1240, wallet: 3560, earned: 12000, tower: 12, mastery: [], arena: null }
export function fxHs(p, body, u, method) {
  if (p === '/game-v2/hoa2-sanh') return SANH
  if (p === '/game-v2/hoa2-cau-da-lam') return CAU_DA_LAM
  if (p === '/game-v2/hoa2-chi-tiet-cau' || p === '/game-v2/hoa2-cau') { const d = deMau('DE-A'); const c = d.cau[0]; return { ok: true, de: { qid: body.qid || 'DE-A-I-1', phan: 'I', text: c.de, choices: Object.values(c.pa), ideas: [], hinhAnh: [], tenDang: TEN_DANG[2], mucDo: 'Vận dụng', maDe: 'DE-A', sao: 3 }, dapAn: 'A', loiGiai: { chot: 'Ester no đơn chức, n = 0,1 mol ⇒ M = 88 ⇒ C4H8O2.' }, emTraLoi: 'B' } }
  if (p === '/game-v2/hoa2-cau-chi-tiet') {
    const d = deMau('DE-A')
    const qids = body.qids || [body.qid]
    return { ok: true, cau: qids.map((q, i) => { const c = d.cau[i % d.cau.length]; return { de: { qid: q, phan: c.phan, text: c.de, choices: c.pa ? Object.values(c.pa) : [], ideas: c.y ? Object.values(c.y) : [], hinhAnh: [], tenDang: c.dang.ten, mucDo: c.muc_do, maDe: 'DE-HOA-12-ESTER-LIPID-1', sao: 3 }, dapAn: typeof c.dap_an === 'string' ? c.dap_an : 'DSDS', loiGiai: { chot: 'Ester no đơn chức mạch hở; n = 0,1 mol ⇒ M = 88 ⇒ C4H8O2 (etyl axetat).' }, emTraLoi: 'B' } }) }
  }
  if (p === '/game-v2/profile') return { ok: true, revision: 5, doanMo: true, profile: PROFILE }
  if (p === '/vao-thi') return { ok: true, cach: 'moi', lanThu: 1, vaoLuc: iso(-60000), hetGioLuc: iso(44 * 60000), thoiGianPhut: 45, congBo: 'ngay', loai: 'thi', tenCa: 'Kiểm tra 45 phút chương Ester – Lipid (đề chẵn lẻ, 40 câu trắc nghiệm)', soCau: { I: 18, II: 4, III: 6 }, deUrl: '/de-cong-khai/704000.json', lop: LOP, nguongLan: 3, nguongGiay: 10 }
  if (p.startsWith('/de-cong-khai/')) {
    const d = deMau('DE-A')
    return { phanI: d.cau.filter(c => c.phan === 'I').map(c => ({ id: c.qid, text: c.de, choices: Object.values(c.pa) })), phanII: d.cau.filter(c => c.phan === 'II').map(c => ({ id: c.qid, text: c.de, ideas: Object.values(c.y) })), phanIII: d.cau.filter(c => c.phan === 'III').map(c => ({ id: c.qid, text: c.de })), soCau: { I: 18, II: 4, III: 6 } }
  }
  if (p === '/luu-tam') return { ok: true }
  if (p === '/game-v2/academic-sync') return { ok: true }
  if (p === '/game-v2/so-tay') return { ok: true, dang: [{ key: 'ES-TEN', ten: 'Danh pháp ester và đồng đẳng', chuong: 'ES' }, { key: 'ES-TP', ten: 'Thuỷ phân ester đơn chức trong môi trường kiềm', chuong: 'ES' }, { key: 'ES-XP', ten: 'Xà phòng hoá', chuong: 'ES' }, { key: 'CB-LM', ten: 'Lên men glucose tạo ethanol', chuong: 'CB' }] }
  if (p === '/game-v2/recommendations') return { ok: true, suggestions: [{ title: 'Thuỷ phân ester đơn chức trong môi trường kiềm', source: 'DE01', part: 'I' }], remaining: 180, dailyUsed: 20 }
  if (p === '/game-v2/resume') return { ok: true }
  if (p === '/game-v2/sync') return { ok: true, remaining: 0 }
  if (p === '/game-v2/doan-sanh') return { ok: true, tranNgay: 60, dailyUsed: 8, dangDo: null, sanh: { lop: LOP, tenDoan: 'Đoàn Hộ Tống ' + LOP, mua: { so: 1, conNgay: 19 }, ve: 0, mienPhiHomNay: false, chuoi: { ngay: 5, daDiHomNay: false, mocKe: 7, conNgay: 2 }, doanLop: { lop: LOP, tram: 17, tongTram: 30, changThang: 3, changMoiTram: 4, conChangToiTramKe: 4, mocKe: 20, tenMocKe: 'Hồ Cân Bằng', conTramToiMoc: 3, gopSucHomNay: 9, siSo: 32 }, trumLop: { dangMo: false, chuNhat: ngay(6), moSauMs: 4 * 24 * H, conMs: 0, daGop: 0, mucTieu: 300, daHa: false }, quaMoi: [] } }
  if (p === '/hs/ke-hoach-ngay') return KE_HOACH
  if (p === '/hs/ca-dang-mo') return { ok: true, coCaMo: true }
  if (p === '/hs/lich-su') return { ok: true, items: lichSu, chuaCongBo: [] }
  if (p === '/hs/btvn') return { ok: true, items: [] }
  if (p === '/hs/thu-thach-hom-nay') return { ok: true, co: false }
  if (p === '/hs/thi-dua-hom-nay') return { ok: true }
  if (p === '/notifications/list') return { ok: true, items: [] }
  if (p === '/mom/list') return { ok: true, items: [] }
  if (p === '/daily-honors') return { ok: true, items: [] }
  return undefined
}
