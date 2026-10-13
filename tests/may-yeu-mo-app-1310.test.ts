// @vitest-environment node
// Thầy 13/10: "đảm bảo máy chủ luôn nhanh, load app ổn định tức thì, tối ưu cả cho máy yếu". Đo Chromium thật (CPU chậm 6×, mạng 1,6 Mbps / RTT
// 150 ms) màn đầu cổng học sinh: phần tử lớn nhất (ảnh thần thú màn đăng nhập) hiện lúc ~4,5 giây vì (1) KaTeX 83 KB nén tải ngay sau mảnh màn, giành
// đường truyền + CPU; (2) ảnh chỉ được biết tới khi mã chạy xong. Và máy chủ: mỗi lần mở app (đã đăng nhập) / mỗi lần đăng nhập, máy chủ chạy một
// `hoa2-sanh` đầy đủ mà Hôm nay (dùng `hoc-tap-sanh`) không bao giờ nhận. Khoá:
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { anhThu } from '../src/game/than-thu-v2/dao/anh'
import { LENH_HOI_SOM } from '../src/lib/nap-truoc-man-em'
import { DUONG_SANH } from '../src/lib/hoi-som'

const doc = (p: string) => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8')

describe('máy yếu — mở cổng học sinh', () => {
  it('ảnh nạp trước = ĐÚNG ảnh màn đăng nhập (LoiChao: anhThu(1, 50))', () => {
    expect(doc('src/components/bat-linh/LoiChao.tsx')).toContain('anhThu(1, 50)')
    expect(doc('vite.config.ts')).toContain(`anhDangNhapHs: '${anhThu(1, 50)}'`)
    expect(fs.existsSync(path.resolve(__dirname, '../public', `.${anhThu(1, 50)}`))).toBe(true)
  })
  it('cổng học sinh: KaTeX chờ mảnh màn VÀ trang tải xong + lúc rảnh; màn thi giữ tải ngay sau mảnh màn', () => {
    const m = doc('src/main.tsx')
    expect(m).toContain("if (huaMan && dv.vai === 'hocsinh') void huaMan.then(napKhiRanh, napKhiRanh)")
    expect(m).toContain('else if (huaMan) void huaMan.then(napKatex, napKatex)')
    expect(doc('src/lib/nap-truoc-man-em.ts')).not.toContain('nap(b.katex')
  })
})

describe('máy chủ — không chạy Sảnh thừa', () => {
  it('lệnh Sảnh hỏi sớm (đoạn mã nội tuyến + sau đăng nhập) = đúng lệnh Hôm nay gửi (`hoc-tap-sanh`)', () => {
    expect(LENH_HOI_SOM[0]![0]).toBe('/game-v2/hoc-tap-sanh')
    expect(DUONG_SANH).toBe('/game-v2/hoc-tap-sanh')
    expect(doc('src/screens/StudentPortalScreen.tsx')).toMatch(/useSanhHoa2\([^)]*, true\)/)
    expect(doc('src/components/hoa2/api.ts')).toContain("goiHoa2(tapTrung ? 'hoc-tap-sanh' : 'hoa2-sanh'")
  })
  it("đăng nhập kèm Sảnh: bản app mới xin 'hoc-tap' (máy chủ chạy hoc-tap-sanh)", () => {
    expect(doc('src/lib/hs-dang-nhap-api.ts')).toContain("kemSanh: 'hoc-tap'")
    expect(doc('server/src/index.ts')).toContain("const lenhSanh = b.kemSanh === 'hoc-tap' ? 'hoc-tap-sanh' : 'hoa2-sanh'")
  })
})
