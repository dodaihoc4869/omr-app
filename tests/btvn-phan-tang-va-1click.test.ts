import { describe, it, expect } from 'vitest'
import { dungPhieu } from '../src/lib/html-phieu'
import { tongHopKeHoachTroLy } from '../src/lib/tro-ly-ca-nhan'
import type { CauLuyen } from '../src/lib/bai-tap-pdf'

function taoDsCauMau(soLuong: number): CauLuyen[] {
  const ds: CauLuyen[] = []
  for (let i = 1; i <= soLuong; i++) {
    ds.push({
      id: `q_${i}`,
      maDe: 'TEST_DE',
      phan: i <= 10 ? 'I' : i <= 15 ? 'II' : 'III',
      text: `Nội dung câu hỏi số ${i}`,
      luaChon: i <= 10 ? ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'] : ['Ý a', 'Ý b', 'Ý c', 'Ý d'],
      dapAn: i <= 10 ? 'A' : 'DDSS',
      loiGiai: `Lời giải chuẩn cho câu ${i}`,
      mucDo: i <= 6 ? 'biet' : i <= 14 ? 'hieu' : 'van_dung',
      sao: i <= 6 ? 0 : i <= 14 ? 1 : 2,
      chuyenDe: 'Este - Lipit',
    })
  }
  return ds
}

describe('BTVN Phân Tầng: Hiện Sáng / Ẩn Mờ (Paced Highlighting & Dimming)', () => {
  it('Hiện sáng đúng số câu chỉ tiêu hôm nay và ẩn mờ các câu thuộc vòng tiếp theo', () => {
    const cau = taoDsCauMau(20)
    const soCauSang = 8 // Chỉ tiêu hôm nay: 8 câu Vòng 1

    const html = dungPhieu(
      {
        hoTen: 'Nguyễn Văn A',
        sbd: 'HS001',
        ngay: new Date(),
        tenChuyenDe: 'Bài tập về nhà',
        ketQua: '',
        hienDapAn: false,
        nhanBia: 'BÀI TẬP VỀ NHÀ',
      },
      cau,
      {
        laBtvn: true,
        soCauSang,
        nop: { ma: 'btvn_1', sbd: 'HS001', url: '/goi' },
      }
    )

    // 1. Phải có thanh phân tầng BTVN báo số câu sáng và nút mở rộng
    expect(html).toContain('id="thanh-phan-tang-btvn"')
    expect(html).toContain('id="nut-mo-het-cau"')
    expect(html).toContain('Hôm nay em làm <b>8</b> câu sáng')
    expect(html).toContain('<b>12</b> câu còn lại mở dần theo ngày/giờ')

    // 2. Thẻ câu 1 đến 8 phải có class q-card-active và nhãn "Mục tiêu hôm nay"
    expect(html).toContain('class="q-tag muc-tieu-hom-nay-tag"')
    expect(html).toContain('q-card-active')

    // 3. Các câu từ 9 trở đi phải có class q-card-dimmed và banner khóa nhẹ trong thẻ
    expect(html).toContain('q-card-dimmed')
    expect(html).toContain('<div class="dimmed-pacing-banner">')
    expect(html).toContain('Câu thuộc lô tiếp theo · Hoàn thành 8 câu sáng hôm nay trước')
  })

  it('Khi đã nộp bài hoặc mở xem lại thì không còn câu nào bị ẩn mờ', () => {
    const cau = taoDsCauMau(10)
    const html = dungPhieu(
      {
        hoTen: 'Nguyễn Văn A',
        sbd: 'HS001',
        ngay: new Date(),
        tenChuyenDe: 'Bài tập về nhà',
        ketQua: '',
        hienDapAn: true,
        nhanBia: 'BÀI TẬP VỀ NHÀ',
      },
      cau,
      {
        laBtvn: true,
        moSan: true,
        soCauSang: cau.length,
      }
    )

    // Trong DOM các thẻ article không được mang class q-card-dimmed
    expect(html).not.toContain('<article class="q-card q-card-dimmed')
    expect(html).not.toContain('<div class="dimmed-pacing-banner">')
    expect(html).not.toContain('id="thanh-phan-tang-btvn"')
  })
})

describe('Thuật toán Trợ Lý Cá Nhân: Tự động rút câu và gán hành động Zero-Friction', () => {
  it('Trợ lý phân công đúng lô đang chờ, mang payload bài tập gốc để phiếu tự tính lại lịch', () => {
    const keHoach = tongHopKeHoachTroLy({
      sbd: 'HS001',
      hoTen: 'Nguyễn Văn A',
      dsBtvn: [
        {
          maBtvn: 'BTVN_01',
          tieuDe: 'Este Đơn Chức',
          soCau: 16,
          daNop: false,
          giaoLuc: new Date().toISOString(),
          hanNop: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          loDaXong: 0,
        },
      ],
      dsMomGiao: [],
      dsLichSu: [],
      tongCauSai: 6,
    })

    const topTasks = keHoach.top3
    expect(topTasks.length).toBeGreaterThan(0)

    const taskLo = topTasks.find((t) => t.loai === 'btvn_lo')
    if (taskLo) {
      expect(taskLo.hanhDong.loai).toBe('mo_btvn')
      expect(taskLo.hanhDong.payload?.bt?.maBtvn).toBe('BTVN_01')
      expect(taskLo.soCau).toBeGreaterThan(0)
      expect(taskLo.hanhDong.nhanNut).toMatch(/^Làm Lô \d+$/)
    }

    const taskSai = topTasks.find((t) => t.loai === 'sua_loi_vong1')
    if (taskSai) {
      expect(taskSai.hanhDong.loai).toBe('mo_khac_phuc')
      expect(taskSai.hanhDong.payload?.cheDo).toBe(1)
      expect(taskSai.hanhDong.payload?.soCau).toBeGreaterThanOrEqual(2)
      expect(taskSai.hanhDong.nhanNut).toBe('Sửa lỗi ngay')
    }
  })

  it('Thử thách bứt phá 9+ mang loại hành động mo_thu_thach để mở trực tiếp bài tập', () => {
    const keHoach = tongHopKeHoachTroLy({
      sbd: 'HS001',
      hoTen: 'Nguyễn Văn A',
      dsBtvn: [],
      dsMomGiao: [],
      dsLichSu: [],
      tongCauSai: 0,
    })

    const taskV3 = keHoach.top3.find((t) => t.loai === 'thu_thach_vong3')
    expect(taskV3).toBeDefined()
    expect(taskV3?.hanhDong.loai).toBe('mo_thu_thach')
    expect(taskV3?.hanhDong.payload?.vong).toBe(3)
    expect(taskV3?.hanhDong.payload?.soCau).toBe(2)
    expect(taskV3?.hanhDong.nhanNut).toBe('Thử sức ngay')
  })
})
