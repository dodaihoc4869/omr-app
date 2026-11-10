// LIVE BẢNG — CỬA VÀO THƯ VIỆN MÁY KHÁCH (đặc tả docs/dac-ta-live-bang-1011.md). NẠP LƯỜI: `const live = await import('../../lib/live')` —
// không nhập tĩnh từ đường mở /hs /gv (cổng tốc độ). Máy em chỉ nạp khi `viewEm.live?.san` (hoặc `bat`); máy thầy khi tờ chiếu có phòng và `viewBang.live` khác null.
//
// MÁY THẦY (tờ chiếu + bút):
//   const lt = taoLiveThay({ ve, goc, kenh: { gui: (tin) => ws.send(JSON.stringify(tin)), guiNhiPhan: (k) => ws.send(k) },
//                            layAnh: () => ({ trang: mcBut.trang(), ...mcBut.xuat() }), khiTrangThai })
//   ws.onmessage = (e) => lt.nhanTinPhong(e.data)          // MỌI tin của phòng (view bảng, live-xem, live-do, live-can-anh…)
//   mcBut.nghe((sk) => lt.nhanSuKienBut(sk))                // MỌI sự kiện của bộ máy bút
//   await lt.noiSan()                                       // nối sẵn (track câm) ngay khi có phòng
//   await lt.bat({ mic })  ·  lt.tat()  ·  lt.datTiengMic(false)  ·  lt.mucAm()  ·  lt.dat({ xa, tiengLop })
//
// MÁY EM:
//   ws.binaryType = 'arraybuffer'
//   const le = taoLiveEm({ ve, goc, kenh, khiBut: (sk) => { loiBut.apSuKien(ds, sk); veLai… }, khiTrangThai, mayYeu })
//   ws.onmessage = (e) => le.nhanTinPhong(e.data)          // MỌI tin của phòng (viewEm, live-so, khung nhị phân)
//   ws.onopen (nối lại) ⇒ le.khiNoiLai()
//   lần chạm đầu ⇒ le.moKhoaTieng()  ·  rời màn / về ⇒ le.datRoiMan(true / false)  ·  nút Tiếng ⇒ le.datTieng(true / false)
//   mỗi khung hình khi `trangThai().bang`: const k = le.khung()  ⇒ vẽ đầu nét nội suy `k.dau` + con trỏ `k.tro`
//   `trangThai().bat` mà `bang` false ⇒ giữ màn câu hỏi bình thường, chỉ có tiếng thầy; `bang` true (thầy gọi bạn lên bảng / bật tay) ⇒ hiện bảng live.
//   em được gọi lên bảng (`trangThai().duocMoMic`) ⇒ le.batMicLenBang() (hoặc tuỳ chọn `tuBatMic: true`) · le.tatMic() · le.mucAmMic()
//   bộ bắt rời màn: bỏ qua mất tiêu điểm khi `le.dangChoQuyenMic()` (hộp hỏi quyền mic đang hiện).
// MÁY THẦY thêm: lt.dat({ bang: true|false }) bật / tắt tay bảng live · lt.thuMic() · lt.datNgheEm(b) · lt.mucAmEm() · trangThai().emNoi / .bang
export { taoLiveThay, type AnhBang, type KetQuaBat, type LiveThay, type TrangThaiLiveThay, type TuyChonLiveThay } from './thay'
export { taoLiveEm, type KetQuaMicEm, type KhungLiveEm, type LiveEm, type TrangThaiLiveEm, type TuyChonLiveEm } from './em'
export type { KenhPhong, MoiTruongLive, TuyChonOpus } from './sfu'
export type { BangNet } from './so-net'
export type { TenSoDo, TomTatSo } from './so-do'
export type { ViewLiveBang, ViewLiveEm, TiengLive, PhienSfuThay } from '../bpu/phong-live'
