// @vitest-environment node
// BẢNG NHỊP TỰ GỌI (sự cố D1 21/09 ~20:30) — khoá hai điều:
// (1) mọi tệp còn `setInterval(` trong src đều đã được XẾP LOẠI trong bảng dưới (= bảng ở SO-VIEC-GIAO-DIEN.md): thêm một vòng mới mà quên xếp loại ⇒ đỏ,
//     buộc người thêm tự hỏi "vòng này có gọi máy chủ không? nếu có thì phải qua nhip-ben-vung.ts";
// (2) mọi vòng GỌI MÁY CHỦ của app HS/PH/game đi qua `nhip-ben-vung.ts` (nền 180 s ± 30 s / trực tiếp nối tiếp, không gọi chồng, lùi dần khi lỗi).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { LUI_TRUC_TIEP_MS, batVongTrucTiep, khoangChoTrucTiep } from '../src/lib/nhip-ben-vung'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

/** Đồng hồ / hiệu ứng KHÔNG gọi máy chủ (chỉ vẽ lại, đếm giờ cục bộ) — đúng số vòng. */
const KHONG_GOI_MAY_CHU: Record<string, number> = {
  'src/components/KhoiKhacPhuc3CheDo.tsx': 1,
  'src/components/KhoiThoiGianCa.tsx': 1,
  'src/components/LuyenDeChuan.tsx': 1,
  'src/components/NutNopBtvn.tsx': 1,
  'src/components/PhongChoGame.tsx': 1,
  'src/components/bang-nhiem-vu/DanhSachNhiemVu.tsx': 1,
  'src/components/bang-tin-san/hooks.ts': 1,
  'src/game/than-thu-v2/DoanHoTong.tsx': 1, // 250 ms vẽ lại đồng hồ trận (vòng HỎI trận đã chuyển sang batVongTrucTiep)
  'src/game/than-thu-v2/ImmortalShield.tsx': 1,
  'src/hooks/useGioHocTap.ts': 1,
  'src/lib/html-may-chieu.ts': 1,
  'src/lib/html-phieu.ts': 1,
  'src/lib/thu-tin-hieu.ts': 1,
  'src/lib/to-chieu-cau-noi.ts': 1,
  'src/screens/KhoaAppScreen.tsx': 1,
  'src/screens/StudentPortalScreen.tsx': 1, // 1 s đồng hồ (vòng đồng bộ EXP + nạp danh sách Mầm đã chuyển sang batNhipBenVung)
}
/** Chỉ hỏi tệp tĩnh của Pages (không chạm D1). */
const CHI_TEP_TINH = ['src/lib/bao-hiem-ban-moi.ts', 'src/lib/cap-nhat-app.ts']
/** Ngoài lệnh KHẨN: EscortRoom chỉ còn đồng hồ 1 s; luồng thi thật cần Boss soát; mã chết không chạy trên app. */
const NGOAI_LENH: Record<string, string> = {
  'src/game/than-thu-v2/EscortRoom.tsx': 'đồng hồ 1 s (vòng hỏi phòng đã chuyển sang batVongTrucTiep)',
  'src/screens/ExamTakeScreen.tsx': 'LUỒNG THI THẬT — cần Boss soát, đã lệch pha chuKyLechPhaMs',
  'src/components/DauTruongChanLy.tsx': 'MÃ CHẾT (chỉ ThanThuHoaHocGame nhập)',
  'src/components/ThanThuHoaHocGame.tsx': 'MÃ CHẾT (không được nhập ở đâu)',
}
/** Làn của app thầy (Code 4) — có thể đổi; chỉ cho phép tồn tại. */
const LAN_APP_THAY = ['src/components/bang-tin/hooks.ts', 'src/screens/ExamMonitorScreen.tsx']

const dem = (nguon: string) =>
  nguon
    .split('\n')
    .filter((d) => !/^\s*(\/\/|\*|\/\*)/.test(d))
    .reduce((n, d) => n + (d.match(/setInterval\(/g)?.length ?? 0), 0)

const quet = (thuMuc: string, ra: Record<string, number> = {}): Record<string, number> => {
  for (const ten of fs.readdirSync(path.join(process.cwd(), thuMuc))) {
    if (ten === 'graphify-out' || ten === 'node_modules') continue
    const rel = `${thuMuc}/${ten}`
    const st = fs.statSync(path.join(process.cwd(), rel))
    if (st.isDirectory()) quet(rel, ra)
    else if (/\.tsx?$/.test(ten)) {
      const n = dem(doc(rel))
      if (n > 0) ra[rel] = n
    }
  }
  return ra
}

describe('khoá bảng: mọi tệp còn setInterval đều đã được xếp loại', () => {
  const co = quet('src')
  it('không có tệp lạ (thêm vòng mới ⇒ xếp loại vào bảng + SO-VIEC-GIAO-DIEN.md)', () => {
    const biet = new Set([...Object.keys(KHONG_GOI_MAY_CHU), ...CHI_TEP_TINH, ...Object.keys(NGOAI_LENH), ...LAN_APP_THAY])
    const la = Object.keys(co).filter((f) => !biet.has(f))
    expect(la, `tệp có setInterval chưa xếp loại: ${la.join(', ')}`).toEqual([])
  })
  it('đúng số vòng ở những tệp HS/PH/game (thêm một vòng nữa vào cùng tệp cũng phải xếp loại lại)', () => {
    for (const [f, n] of Object.entries(KHONG_GOI_MAY_CHU)) expect(co[f] ?? 0, f).toBe(n)
  })
  it('vòng đã chuyển đi rồi thì KHÔNG quay lại dạng setInterval trần: hỏi trận Đoàn / phòng Escort / đồng bộ EXP / danh sách Mầm', () => {
    expect(doc('src/game/than-thu-v2/DoanHoTong.tsx')).not.toMatch(/setInterval\(\(\) => void hoi\(\)/)
    expect(doc('src/game/than-thu-v2/EscortRoom.tsx')).not.toMatch(/setInterval\(\(\)=>void tick\(\)/)
    const sp = doc('src/screens/StudentPortalScreen.tsx')
    expect(sp).not.toMatch(/setInterval\([^)]*syncStudentExp/)
    expect(sp).not.toMatch(/setInterval\([^)]*napDsMom/)
  })
})

describe('mọi vòng GỌI MÁY CHỦ của app HS/PH/game đi qua nhip-ben-vung.ts', () => {
  const NEN = [
    'src/screens/StudentPortalScreen.tsx',
    'src/components/ThongBaoHocSinh.tsx',
    'src/components/BangTinPhuHuynh.tsx',
    'src/components/BangVinhDanh.tsx',
    'src/components/bang-nhiem-vu/TheVinhDanh.tsx',
    'src/components/bang-nhiem-vu/may-chu.ts',
    'src/lib/app-presence.ts',
    'src/lib/use-thi-dua.ts',
    'src/lib/ph-moi/use-tat-ca-ve-con.ts',
    'src/game/than-thu-v2/Game.tsx',
    'src/game/than-thu-v2/ProgressChart.tsx',
  ]
  for (const f of NEN)
    it(`${f}: dùng batNhipBenVung, không còn setInterval`, () => {
      const s = doc(f)
      expect(s).toMatch(/batNhipBenVung/)
      expect(dem(s), 'còn setInterval trần').toBe(f === 'src/screens/StudentPortalScreen.tsx' ? 1 : 0) // 1 = đồng hồ 1 s
    })
  for (const f of ['src/game/than-thu-v2/DoanHoTong.tsx', 'src/game/than-thu-v2/EscortRoom.tsx'])
    it(`${f}: vòng hỏi trực tiếp dùng batVongTrucTiep (nối tiếp, thưa dần khi lỗi)`, () => {
      expect(doc(f)).toMatch(/batVongTrucTiep\(/)
    })
  it('nhịp nền của thi đua / phụ huynh là 180 giây (không tụt về 60)', () => {
    expect(doc('src/lib/use-thi-dua.ts')).toMatch(/NHIP_THI_DUA_MS = 180_000/)
    expect(doc('src/lib/ph-moi/use-tat-ca-ve-con.ts')).toMatch(/NHIP_PH_MOI_MS = 180_000/)
    expect(doc('src/lib/nhip-ben-vung.ts')).toMatch(/NHIP_NEN_MS = 180_000/)
  })
  it('hiện diện: 60 s ± 10 s (máy chủ coi online trong 90 s — chậm hơn nữa là hiện "offline" oan)', () => {
    expect(doc('src/lib/app-presence.ts')).toMatch(/coSoMs:\s*60_000,\s*lechMs:\s*10_000/)
  })
})

describe('khoangChoTrucTiep — thuần', () => {
  it('không lỗi ⇒ đúng nhịp; lỗi ⇒ thưa dần 5 → 10 → 20 → 30 s, giữ ở 30; không bao giờ nhanh hơn nhịp thường', () => {
    expect(LUI_TRUC_TIEP_MS).toEqual([5_000, 10_000, 20_000, 30_000])
    expect(khoangChoTrucTiep(1500, 0)).toBe(1500)
    expect(khoangChoTrucTiep(1500, 1)).toBe(5000)
    expect(khoangChoTrucTiep(1500, 2)).toBe(10_000)
    expect(khoangChoTrucTiep(1500, 3)).toBe(20_000)
    expect(khoangChoTrucTiep(1500, 4)).toBe(30_000)
    expect(khoangChoTrucTiep(1500, 99)).toBe(30_000)
    expect(khoangChoTrucTiep(60_000, 1)).toBe(60_000) // nhịp cơ sở lớn hơn bậc lùi ⇒ giữ nhịp cơ sở
    expect(khoangChoTrucTiep(1500, -2)).toBe(1500)
    expect(khoangChoTrucTiep(1500, Number.NaN)).toBe(1500)
  })
})

describe('batVongTrucTiep — hành vi (đồng hồ giả)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('KHÔNG gọi chồng: lệnh chậm 10 giây thì suốt 10 giây đó chỉ có MỘT lượt bay; lượt kế chỉ hẹn sau khi lượt này xong', async () => {
    let bay = 0, tongBay = 0, toiDa = 0
    const chay = () =>
      new Promise<boolean>((xong) => {
        bay++
        tongBay++
        toiDa = Math.max(toiDa, bay)
        setTimeout(() => { bay--; xong(true) }, 10_000)
      })
    const v = batVongTrucTiep(chay, 1500)
    await vi.advanceTimersByTimeAsync(1500) // lượt 1 bay
    expect(tongBay).toBe(1)
    await vi.advanceTimersByTimeAsync(9000) // 10,5 s: lượt 1 còn treo — setInterval cũ đã bắn thêm 6 lượt
    expect(tongBay).toBe(1)
    await vi.advanceTimersByTimeAsync(1000) // lượt 1 xong ở 11,5 s ⇒ hẹn 1,5 s
    await vi.advanceTimersByTimeAsync(1500)
    expect(tongBay).toBe(2)
    expect(toiDa).toBe(1)
    v.dung()
  })

  it('lỗi ⇒ thưa dần 5 → 10 → 20 → 30 → 30 giây; một lượt tốt ⇒ về 1,5 giây', async () => {
    const goi: number[] = []
    let tot = false
    const chay = () => { goi.push(Date.now()); return Promise.resolve(tot ? true : false) }
    const t0 = Date.now()
    const v = batVongTrucTiep(chay, 1500)
    await vi.advanceTimersByTimeAsync(1500)
    expect(goi.length).toBe(1) // lượt đầu lúc 1,5 s ⇒ lỗi
    await vi.advanceTimersByTimeAsync(5000)
    expect(goi.length).toBe(2) // +5 s ⇒ lỗi lần 2
    await vi.advanceTimersByTimeAsync(10_000)
    expect(goi.length).toBe(3) // +10 s
    await vi.advanceTimersByTimeAsync(20_000)
    expect(goi.length).toBe(4) // +20 s
    await vi.advanceTimersByTimeAsync(30_000)
    expect(goi.length).toBe(5) // +30 s
    await vi.advanceTimersByTimeAsync(30_000)
    expect(goi.length).toBe(6) // giữ ở 30 s
    expect(v.soLoi()).toBe(6)
    expect(goi.map((g) => g - t0)).toEqual([1500, 6500, 16_500, 36_500, 66_500, 96_500])
    tot = true
    await vi.advanceTimersByTimeAsync(30_000) // lượt kế (lúc 126,5 s) tốt
    expect(goi.length).toBe(7)
    expect(v.soLoi()).toBe(0)
    await vi.advanceTimersByTimeAsync(1500)
    expect(goi.length).toBe(8) // về nhịp 1,5 s
    v.dung()
  })

  it('ném lỗi cũng tính là lỗi; bỏ lượt (trả true/undefined) KHÔNG tính; dung() thì im hẳn', async () => {
    let n = 0
    const v = batVongTrucTiep(async () => { n++; if (n === 1) throw new Error('mạng') }, 1500)
    await vi.advanceTimersByTimeAsync(1500)
    expect(v.soLoi()).toBe(1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(n).toBe(2)
    expect(v.soLoi()).toBe(0) // lượt 2 trả undefined = tốt
    v.dung()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(n).toBe(2)
  })
})
