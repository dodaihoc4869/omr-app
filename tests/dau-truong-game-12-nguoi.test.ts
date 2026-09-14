import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BANG_QUY_TAC_KHAC_CHE,
  DANH_SACH_CAP_DO,
  DANH_SACH_HOA_CHAT,
  DANH_SACH_SUNG,
  MAP_HOA_CHAT,
  traCuuTuongTac,
} from '../src/game/dau-truong-hoa-chat/cau-hinh'
import { BANG_MAU_GAME } from '../src/game/dau-truong-hoa-chat/bang-mau'
import {
  taoMoHinhBinhMau,
  taoMoHinhBinhTamGiac,
  taoMoHinhChibi,
  taoMoHinhQuaiVat,
  taoMoHinhSung,
} from '../src/game/dau-truong-hoa-chat/mo-hinh'
import { bienDoiMoHinh } from '../src/game/dau-truong-hoa-chat/renderer-3d'
import { sinhMeCung } from '../src/game/dau-truong-hoa-chat/me-cung'
import type { NguoiChoiGame } from '../src/components/DauTruongGame'

describe('Đấu Trường Hoá Chất — Đại chiến mê cung sinh tồn 12 người', () => {
  it('StudentPortalScreen đã cập nhật tab thành Đấu Trường Hoá Chất và icon bình hoá chất', () => {
    const fileContent = readFileSync(
      resolve(__dirname, '../src/screens/StudentPortalScreen.tsx'),
      'utf8'
    )
    expect(fileContent).toContain('Đấu Trường Hoá Chất 🧪')
    expect(fileContent).toContain('Đại chiến mê cung 12 người')
    expect(fileContent).toContain('FlaskConical')
  })

  it('Hỗ trợ kết nối tối đa 12 người chơi bằng Số Báo Danh (SBD)', () => {
    const players: NguoiChoiGame[] = []
    for (let i = 1; i <= 12; i++) {
      players.push({
        id: `p_${i}`,
        sbd: `SBD_${12000 + i}`,
        hoTen: `Chiến binh ${i}`,
        laNguoiThat: i === 1,
        x: 0,
        z: 0,
        yaw: 0,
        mauAo: '#1B6FEA',
        hoaChat: 'Cl2',
        sung: 'binh_xit',
        mau: 100,
        mauToiDa: 100,
        song: true,
        thoiGianMienNhiem: 0,
        daThoat: false,
        soDoiThuHoaGiai: 0,
        diem: 0,
      })
    }

    expect(players.length).toBe(12)
    expect(players[0].sbd).toBe('SBD_12001')
    expect(players[11].sbd).toBe('SBD_12012')
  })

  it('Bảng 12 hoá chất chuẩn danh pháp 2018 và màu quy ước', () => {
    expect(DANH_SACH_HOA_CHAT.length).toBe(12)

    // Kiểm tra tên danh pháp 2018
    const mapTen = new Map(DANH_SACH_HOA_CHAT.map((h) => [h.id, h.ten2018]))
    expect(mapTen.get('HCl')).toBe('hydrochloric acid')
    expect(mapTen.get('NaOH')).toBe('sodium hydroxide')
    expect(mapTen.get('KMnO4')).toBe('potassium permanganate')
    expect(mapTen.get('Cl2')).toBe('chlorine')
    expect(mapTen.get('NH3')).toBe('ammonia')
    expect(mapTen.get('CO2')).toBe('carbon dioxide')

    // KMnO4 màu tím đậm ngoài đời trùng màu game
    const kmno4 = MAP_HOA_CHAT.get('KMnO4')
    expect(kmno4?.trungThat).toBe(true)
    expect(kmno4?.mauGame).toBe(BANG_MAU_GAME.kmno4)
  })

  it('Luật khắc chế hoá học có phương trình cân bằng và tiêu chí rõ ràng', () => {
    // KMnO4 khắc chế HCl
    const tuongTac1 = traCuuTuongTac('KMnO4', 'HCl')
    expect(tuongTac1.ketQuaA).toBe('khac_che')
    expect(tuongTac1.phuongTrinh).toContain('2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O')
    expect(tuongTac1.tieuChi).toBe('tính oxi hoá mạnh hơn')

    // Cl2 khắc chế KI
    const tuongTac2 = traCuuTuongTac('Cl2', 'KI')
    expect(tuongTac2.ketQuaA).toBe('khac_che')
    expect(tuongTac2.phuongTrinh).toContain('Cl₂ + 2KI → 2KCl + I₂')

    // HCl và NaOH trung hoà
    const tuongTac3 = traCuuTuongTac('HCl', 'NaOH')
    expect(tuongTac3.ketQuaA).toBe('trung_hoa')
    expect(tuongTac3.phuongTrinh).toContain('HCl + NaOH → NaCl + H₂O')

    // Trùng chất thì không phản ứng
    const tuongTac4 = traCuuTuongTac('HCl', 'HCl')
    expect(tuongTac4.ketQuaA).toBe('khong_phan_ung')
  })

  it('Mô hình Chibi chuẩn 41 khối nguyên thuỷ theo Bản Vẽ Dạng Số', () => {
    const moHinh = taoMoHinhChibi('#1B6FEA', '#7B2FBE')
    expect(moHinh.length).toBe(41)

    // Khối 1 là đĩa bóng
    expect(moHinh[0].loai).toBe('dia_bong')
    // Khối 17 là đầu cầu
    expect(moHinh[16].loai).toBe('cau')
    // Khối 32 là vành kính
    expect(moHinh[31].loai).toBe('ong')

    // Kiểm tra culling khi quay lưng (Bẫy 2)
    // Khi yaw = 0 (mặt hướng +Z) và camera ở phía sau (pos: [0, 2, -5]), camToGoc có z > 0 => huongMat.camToGoc < 0.02
    const khoiQuayLung = bienDoiMoHinh(moHinh, [0, 0, 0], 0, [0, 2, -5])
    // Chi tiết mặt có uu > 0.5 phải bị lọc bỏ
    const conChiTietMat = khoiQuayLung.some((k) => (k.uu ?? 0) > 0.5)
    expect(conChiTietMat).toBe(false)
  })

  it('Các mô hình phụ kiện (súng, bình tam giác, quái vật, bình máu) đúng số khối', () => {
    expect(taoMoHinhSung('ong_nho_giot').length).toBe(5)
    expect(taoMoHinhSung('binh_xit').length).toBe(6)
    expect(taoMoHinhSung('sung_phun').length).toBe(6)
    expect(taoMoHinhBinhTamGiac().length).toBe(4)
    expect(taoMoHinhQuaiVat().length).toBe(12)
    expect(taoMoHinhBinhMau().length).toBe(4)
  })

  it('Thuật toán sinh mê cung từ hạt giống đồng nhất và mở cổng ra', () => {
    const mc1 = sinhMeCung(21, 11110001, 12)
    const mc2 = sinhMeCung(21, 11110001, 12)

    // Cùng hạt giống ra cùng mê cung
    expect(mc1.luoi).toEqual(mc2.luoi)
    expect(mc1.danhSachCong.length).toBe(12)
    expect(mc1.danhSachCong.every((c) => c.mo)).toBe(true)

    // 3 Cấp độ có cấu hình hợp lệ
    expect(DANH_SACH_CAP_DO.truot_dh.kichThuocMeCung).toBe(21)
    expect(DANH_SACH_CAP_DO.do_dh.kichThuocMeCung).toBe(31)
    expect(DANH_SACH_CAP_DO.thu_khoa.kichThuocMeCung).toBe(41)
  })
})
