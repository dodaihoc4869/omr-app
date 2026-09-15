/**
 * THẦN THÚ TRÊN TỜ CHIẾU LÊN BẢNG.
 *
 * Thầy chốt 15-09: *"nối thông tin hình ảnh của thú, cấp độ, các thông tin cần
 * thiết vào góc bên phải của mục chiếu lên bảng."*
 *
 * Luật cốt lõi của tệp này: **việc gọi em lên bảng không được phụ thuộc vào
 * một thứ trang trí.** Máy chủ chậm, mất mạng, hồ sơ hỏng, em chưa chọn thú —
 * tờ chiếu vẫn phải mở, chỉ thiếu con thú.
 */
import { describe, it, expect, vi } from 'vitest'
import { thanThuChoToChieu, veThanThuRaAnh } from '../src/lib/anh-than-thu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { DANH_SACH_THAN_THU } from '../src/game/than-thu-hoa-hoc/he-thong-pet'

const HO_SO_THAT = {
  idThanhThuChon: 'loi_kim',
  capDo: 6,
  exp: 120,
  khoExp: 300,
  tangThapCaoNhat: 14,
  soCauDaThanhTay: 27,
  ngayChonThu: '2026-09-15',
}

function oMau(them: Partial<OBang> = {}): OBang {
  return {
    sbd: '12121212',
    hoTen: 'Nguyễn Văn A',
    soCau: 7,
    cau: { phan: 'I', de: 'Cho phản ứng nhiệt nhôm', luaChon: [], dapAn: 'A', loiGiai: '' } as unknown as OBang['cau'],
    ...them,
  }
}

describe('Vẽ thú ra ảnh', () => {
  it('id lạ thì trả chuỗi rỗng, KHÔNG ném lỗi', () => {
    expect(() => veThanThuRaAnh('khong-co-con-nay', 5)).not.toThrow()
    expect(veThanThuRaAnh('khong-co-con-nay', 5)).toBe('')
  })

  it('máy không dựng được canvas thì trả rỗng, không ném lỗi', () => {
    // jsdom không có ngữ cảnh 2D thật — đúng cảnh máy cũ tắt tăng tốc phần cứng.
    expect(() => veThanThuRaAnh('hoa_long', 3)).not.toThrow()
  })
})

describe('Đọc hồ sơ cho tờ chiếu', () => {
  it('lấy đúng tên thú, cấp, hình thái, tầng tháp, số câu đã thanh tẩy', async () => {
    const t = await thanThuChoToChieu(async () => HO_SO_THAT, '12121212')
    expect(t).not.toBeNull()
    expect(t!.ten).toBe(DANH_SACH_THAN_THU['loi_kim']!.ten)
    expect(t!.capDo).toBe(6)
    expect(t!.hinhThai).toBe('Thức Tỉnh Hào Quang')
    expect(t!.tangThapCaoNhat).toBe(14)
    expect(t!.soCauDaThanhTay).toBe(27)
    expect(t!.he).not.toBe('')
  })

  it('EM CHƯA CHỌN THẦN THÚ thì trả null — không dựng con mặc định', async () => {
    const t = await thanThuChoToChieu(async () => ({ ...HO_SO_THAT, idThanhThuChon: '' }), '1')
    expect(t).toBeNull()
  })

  it('máy chủ không trả gì thì trả null', async () => {
    expect(await thanThuChoToChieu(async () => null, '1')).toBeNull()
    expect(await thanThuChoToChieu(async () => undefined, '1')).toBeNull()
  })

  it('máy chủ NÉM LỖI thì nuốt, trả null — không làm hỏng tờ chiếu', async () => {
    const t = await thanThuChoToChieu(async () => { throw new Error('mất mạng') }, '1')
    expect(t).toBeNull()
  })

  it('MÁY CHỦ TREO thì bỏ qua sau hạn chờ, không đợi mãi', async () => {
    vi.useFakeTimers()
    const treo = new Promise<unknown>(() => { /* không bao giờ xong */ })
    const p = thanThuChoToChieu(() => treo, '1', 1200)
    await vi.advanceTimersByTimeAsync(1300)
    expect(await p).toBeNull()
    vi.useRealTimers()
  })

  it('hồ sơ rác không làm vỡ — về null hoặc về hồ sơ đã vá, không ném lỗi', async () => {
    for (const rac of [42, 'linh tinh', [], { capDo: 'ba' }, { idThanhThuChon: 999 }]) {
      const chay = thanThuChoToChieu(async () => rac, '1')
      await expect(chay).resolves.not.toThrow()
    }
  })
})

describe('Tờ chiếu in ra góc thần thú', () => {
  const thu = {
    anh: 'data:image/png;base64,iVBORw0KGgo=',
    ten: 'Lôi Kim Thú Điện Cực',
    danhHieu: 'Chúa Tể Dãy Điện Hoá',
    he: 'Điện hoá',
    capDo: 6,
    hinhThai: 'Thức Tỉnh Hào Quang',
    tangThapCaoNhat: 14,
    soCauDaThanhTay: 27,
  }

  it('có thú thì in đủ tên, hình thái, tầng tháp và ẢNH', () => {
    const html = taoHtmlMayChieu([oMau({ thanThu: thu })])
    expect(html).toContain('<aside class="mc-thu">')
    expect(html).toContain('Lôi Kim Thú Điện Cực')
    expect(html).toContain('Hình thái 6/12')
    expect(html).toContain('Thức Tỉnh Hào Quang')
    expect(html).toContain('Tháp tầng 14')
    expect(html).toContain('thanh tẩy 27 câu')
    expect(html).toContain('data:image/png;base64,iVBORw0KGgo=')
  })

  it('KHÔNG có thú thì không chừa ô rỗng nào', () => {
    // CSS của góc thú luôn nằm trong tờ (một bản dùng chung); thứ phải vắng là
    // KHỐI ĐÁNH DẤU, không phải mấy dòng kiểu dáng.
    const html = taoHtmlMayChieu([oMau()])
    expect(html).not.toContain('<aside class="mc-thu">')
    expect(html).toContain('Nguyễn Văn A')     // tờ chiếu vẫn in đủ như cũ
  })

  it('vẽ được ảnh thì dùng thẻ img, không vẽ được thì dùng ô giữ chỗ', () => {
    const co = taoHtmlMayChieu([oMau({ thanThu: thu })])
    expect(co).toContain('<img class="mc-thu-anh"')
    const khong = taoHtmlMayChieu([oMau({ thanThu: { ...thu, anh: '' } })])
    expect(khong).not.toContain('<img class="mc-thu-anh"')
    expect(khong).toContain('mc-thu-trong')
    expect(khong).toContain('Lôi Kim Thú Điện Cực')   // chữ vẫn in
  })

  it('tên thú có ký tự đặc biệt vẫn được thoát, không vỡ HTML', () => {
    const html = taoHtmlMayChieu([oMau({ thanThu: { ...thu, ten: '<script>x</script>' } })])
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('CSS của góc thú có mặt, và tiêu đề em thành hai cột', () => {
    const html = taoHtmlMayChieu([oMau({ thanThu: thu })])
    expect(html).toContain('.mc-thu-anh')
    expect(html).toContain('.mc-em-trai')
  })
})
