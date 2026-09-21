// BẢNG "MỌI THỨ VỀ CON" KIỂU APPLE — phần của Agent C: Ca kiểm tra · Dạng · Bài tập về nhà · Lịch ôn · 14 ngày · Lời A.I · Bảng sẽ đầy dần · Độ chăm.
// Khoá: chữ đúng mẫu (docs/ban-ve-ph-apple-2109/), thiếu trường ⇒ ẩn đúng phần ấy (PH_OK = bộ CŨ không có trường mới), ca CHƯA công bố không lộ điểm, không chữ game/emoji/màu thô/`order`, chuyển động tắt khi giảm chuyển động.
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import { docTatCaVeCon, type PhMoi } from '../src/lib/ph-moi/du-lieu'
import { Ca, coCa } from '../src/components/ph-moi/bang/Ca'
import { Dang, coDang } from '../src/components/ph-moi/bang/Dang'
import { Btvn, chuDongNo, coBtvn } from '../src/components/ph-moi/bang/Btvn'
import { LichOn, coLichOn } from '../src/components/ph-moi/bang/LichOn'
import { Nhip14, coNhip14 } from '../src/components/ph-moi/bang/Nhip14'
import { LoiAi, coLoiAi } from '../src/components/ph-moi/bang/LoiAi'
import { DoCham, SapCo, coDoCham, coSapCo } from '../src/components/ph-moi/bang/SapCo'
import { PH_APPLE, PH_APPLE_CHUA_HOC, PH_APPLE_NO, PH_APPLE_THUA } from './_ph-moi/du-lieu-mau-apple'
import { PH_CHUA_CB, PH_OK } from './_ph-moi/du-lieu-mau'

afterEach(cleanup)

const nhan = <T,>(o: T): T => JSON.parse(JSON.stringify(o))
const pmOf = (raw: unknown): PhMoi => docTatCaVeCon(raw)!
const sua = (raw: unknown, f: (r: any) => void): PhMoi => {
  const r = nhan(raw) as any
  f(r)
  return pmOf(r)
}
/** Chữ của một nút: giữa hai phần tử có một khoảng trắng (textContent dính liền chữ của các thẻ khối). */
const chu = (n: Element | null): string => {
  if (!n) return ''
  const ra: string[] = []
  const di = (x: Node): void => {
    if (x.nodeType === 3) ra.push(x.textContent ?? '')
    else {
      ra.push(' ')
      x.childNodes.forEach(di)
      ra.push(' ')
    }
  }
  n.childNodes.forEach(di)
  return ra.join('').replace(/\s+/g, ' ').trim()
}
const ve = (el: ReactElement) => render(el).container
/** Giá trị biến CSS `--c` / `--k` đặt inline (đọc từ thuộc tính style để không phụ thuộc jsdom hiểu biến tuỳ chỉnh). */
const bien = (e: Element, ten: string): string => new RegExp(`${ten}:\\s*([\\d.]+)`).exec(e.getAttribute('style') ?? '')?.[1] ?? ''
const CAM_GAME = /thần thú|khiên|Võ đài|Đảo thần thú|Linh Tâm|Đoàn Hộ Tống|\bEXP\b/i
const CAM_EMOJI = /\p{Extended_Pictographic}/u
const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const TEP_C = ['Ca.tsx', 'Dang.tsx', 'Btvn.tsx', 'LichOn.tsx', 'Nhip14.tsx', 'LoiAi.tsx', 'SapCo.tsx', 'c-chung.ts', 'khoi-c.css'].map((t) => `src/components/ph-moi/bang/${t}`)

const APPLE = pmOf(PH_APPLE)
const CU = pmOf(PH_OK)
const THUA = pmOf(PH_APPLE_THUA)
const CHUA_HOC = pmOf(PH_APPLE_CHUA_HOC)

describe('Ca — "Ca kiểm tra gần nhất"', () => {
  it('đủ dữ liệu: tên ca, điểm to, so với lần trước, dòng phụ, ba phần', () => {
    const c = ve(<Ca pm={APPLE} />)
    expect(c.querySelector('section#muc-ca')).not.toBeNull()
    expect(chu(c.querySelector('h2'))).toBe('Ca kiểm tra gần nhất')
    expect(chu(c.querySelector('.phm-nhan-muc'))).toBe('Kiểm tra 45 phút · Ester – Lipid')
    expect(chu(c.querySelector('.phm-diem'))).toBe('7,5 /10 điểm')
    expect(c.querySelector('.phm-diem')!.getAttribute('aria-label')).toBe('7,5 trên 10 điểm')
    expect(chu(c.querySelector('.phm-ca__hon'))).toBe('Hơn 0,75 điểm so với lần trước của chính con')
    expect(chu(c.querySelector('.phm-ca__hon + .phm-phu'))).toBe('Lần trước 6,75 điểm · nộp lúc 09:12 · Thứ Bảy 19/09/2026 · đúng 21/28 câu · làm trong 32 phút 10 giây')
    const phan = [...c.querySelectorAll('.phm-phan > li')].map((l) => chu(l))
    expect(phan).toHaveLength(3)
    expect(phan[0]).toContain('Phần I · Trắc nghiệm')
    expect(phan[0]).toContain('3,75 điểm')
    expect(phan[0]).toContain('đúng 15/18 câu')
    expect(phan[1]).toContain('Phần II · Đúng–sai')
    expect(phan[1]).toContain('đúng trọn 2/4 câu')
    expect(phan[2]).toContain('Phần III · Trả lời ngắn')
    expect(phan[2]).toContain('đúng 4/6 câu')
    const thanh = c.querySelector('.phm-phan .phm-thanh')!
    expect(thanh.getAttribute('role')).toBe('img')
    expect(thanh.getAttribute('aria-label')).toBe('Phần I: đúng 15 trên 18 câu')
    expect((thanh.querySelector('i') as HTMLElement).style.width).toBe('83.3%')
    expect(c.textContent).not.toMatch(/Biến thể/)
    expect(coCa(APPLE)).toBe(true)
  })

  it('so với lần trước: kém · bằng · thiếu (bỏ dòng); thiếu số nào ẩn đúng vế đó', () => {
    const doi = (truoc: unknown) => ve(<Ca pm={sua(PH_OK, (r) => { r.caGanNhat.truoc = truoc })} />)
    expect(chu(doi({ tong: 8, doi: -0.5 }).querySelector('.phm-ca__hon'))).toBe('Kém 0,5 điểm so với lần trước của chính con')
    cleanup()
    const bang = doi({ tong: 7.5, doi: 0 })
    expect(chu(bang.querySelector('.phm-ca__hon'))).toBe('Bằng lần trước của chính con')
    expect(bang.querySelector('.phm-ca__hon')!.getAttribute('data-doi')).toBe('bang')
    cleanup()
    const khong = doi(undefined)
    expect(khong.querySelector('.phm-ca__hon')).toBeNull()
    expect(chu(khong.querySelector('.phm-diem + .phm-phu'))).not.toContain('Lần trước')
    cleanup()
    const thieu = ve(<Ca pm={sua(PH_OK, (r) => { delete r.caGanNhat.thoiGianLamGiay; r.caGanNhat.ketQua = { tong: 7.5 }; r.caGanNhat.phan = [{ ma: 'I', dung: 15, tong: 18 }] })} />)
    const phu = chu(thieu.querySelector('.phm-phu'))
    expect(phu).not.toContain('làm trong')
    expect(phu).not.toContain('đúng 21')
    expect(phu).toContain('nộp lúc 09:12')
    const p1 = chu(thieu.querySelector('.phm-phan > li'))
    expect(p1).toContain('đúng 15/18 câu')
    expect(p1).not.toContain('điểm') // phần chưa có điểm ⇒ chỉ số câu
  })

  it('CHƯA công bố: chỉ dòng khoá + chữ máy chủ, không điểm/phần/so sánh', () => {
    const c = ve(<Ca pm={pmOf(PH_CHUA_CB)} />)
    expect(chu(c.querySelector('.phm-dong-bt h3'))).toBe('Thầy chưa công bố điểm')
    expect(chu(c.querySelector('.phm-dong-bt p'))).toBe('Con đã nộp bài lúc 09:12 · Thứ Hai 21/09/2026. Điểm hiện khi cả lớp nộp xong (27/32 em đã nộp).')
    expect(c.querySelector('.phm-diem')).toBeNull()
    expect(c.querySelector('.phm-phan')).toBeNull()
    expect(c.querySelector('.phm-ca__hon')).toBeNull()
    expect(c.textContent).not.toMatch(/\/10 điểm/)
  })

  it('CHƯA công bố dù gói lỡ mang điểm (pm dựng tay, bỏ qua lớp đọc chặt) ⇒ KHÔNG lộ 9,5 / phần / so sánh', () => {
    const pm = nhan(pmOf(PH_CHUA_CB))
    pm.caGanNhat!.ketQua = { tong: 9.5, soCau: 28, soCauDung: 27 }
    pm.caGanNhat!.truoc = { tong: 5, doi: 4.5 }
    pm.caGanNhat!.phan = [{ ma: 'I', dung: 18, tong: 18, diem: 4.5 }]
    const c = ve(<Ca pm={pm} />)
    expect(c.textContent).not.toMatch(/9,5|4,5|27\/28|Hơn|Lần trước|Phần I/)
    expect(chu(c.querySelector('.phm-dong-bt h3'))).toBe('Thầy chưa công bố điểm')
  })

  it('đã công bố nhưng máy chủ không gửi điểm ⇒ không nói "chưa công bố", không bịa điểm', () => {
    const pm = sua(PH_OK, (r) => { r.caGanNhat.ketQua = {} })
    const c = ve(<Ca pm={pm} />)
    expect(chu(c.querySelector('h3'))).toBe('Chưa có điểm của ca này')
    expect(c.textContent).not.toMatch(/chưa công bố|\/10 điểm/)
  })

  it('không có ca ⇒ không vẽ gì', () => {
    expect(ve(<Ca pm={THUA} />).innerHTML).toBe('')
    expect(coCa(THUA)).toBe(false)
  })
})

describe('Dang — "Điểm mạnh · cần luyện"', () => {
  it('đủ dữ liệu: hai thẻ, thanh, ba bậc, mới lên bậc, chân thẻ lịch ôn', () => {
    const c = ve(<Dang pm={APPLE} />)
    expect(c.querySelector('section#muc-dang')).not.toBeNull()
    expect(chu(c.querySelector('h2'))).toBe('Điểm mạnh · cần luyện')
    expect(chu(c.querySelector('.phm-muc__dau p'))).toBe('tính trên 14 ngày gần đây')
    const the = [...c.querySelectorAll('.phm-hai > .phm-the')]
    expect(the).toHaveLength(2)
    expect(chu(the[0]!.querySelector('.phm-nhan-muc'))).toBe('Dạng con làm tốt')
    expect(chu(the[1]!.querySelector('.phm-nhan-muc'))).toBe('Dạng con còn vấp')
    const tot = [...the[0]!.querySelectorAll('.phm-dang > li')]
    expect(tot).toHaveLength(3)
    expect(chu(tot[0]!.querySelector('.phm-dang__dau'))).toBe('Danh pháp ester đúng 11/12 câu')
    expect(tot[0]!.querySelector('.phm-thanh')!.getAttribute('data-mau')).toBe('dat')
    expect((tot[0]!.querySelector('.phm-thanh i') as HTMLElement).style.width).toBe('91.7%')
    expect(chu(tot[0]!.querySelector('.phm-bac [data-nay]'))).toBe('Vận dụng')
    expect(tot[0]!.querySelector('.phm-bac')!.getAttribute('aria-label')).toBe('Bậc hiện tại của con: Vận dụng. Ba bậc: Biết, Hiểu, Vận dụng')
    expect(tot[0]!.querySelector('.phm-dang__ghi')).toBeNull() // Danh pháp ester KHÔNG lên bậc hôm nay
    expect(chu(tot[1]!.querySelector('.phm-dang__ghi'))).toBe('Mới lên bậc Hiểu hôm nay')
    expect(chu(tot[2]!.querySelector('.phm-dang__ghi'))).toBe('Mới lên bậc Hiểu hôm nay')
    const vap = [...the[1]!.querySelectorAll('.phm-dang > li')]
    expect(vap).toHaveLength(2)
    expect(vap[0]!.querySelector('.phm-thanh')!.getAttribute('data-mau')).toBe('cam')
    expect(chu(vap[0]!.querySelector('.phm-bac [data-nay]'))).toBe('Biết')
    expect(chu(the[1]!.querySelector('.phm-the__cuoi'))).toBe('A.I Đỗ Đại Học đã xếp 7 câu vào lịch ôn ngày 22/09')
    expect(the[0]!.querySelector('.phm-the__cuoi')).toBeNull()
    expect(chu(c.querySelector('.phm-ghi-chu'))).toBe('Mỗi dạng bài con đi qua ba bậc: Biết, Hiểu, Vận dụng.')
    // máy chủ không trả số câu ôn theo từng dạng ⇒ KHÔNG có dòng "N câu vào lịch ôn ngày …" ở từng dạng
    expect([...c.querySelectorAll('.phm-dang__ghi')].map((g) => chu(g)).join(' ')).not.toContain('lịch ôn')
    expect(coDang(APPLE)).toBe(true)
  })

  it('thiếu bậc ở manhYeu ⇒ lấy từ bacTheoDang / dangVap; không biết ⇒ không vẽ ba bậc', () => {
    const pm = sua(PH_OK, (r) => {
      for (const d of [...r.manhYeu.lamTot, ...r.manhYeu.conVap]) delete d.bac
      r.bacTheoDang = [{ ma: 'D1', ten: 'Danh pháp ester', bac: 2 }]
      r.dangVap = [{ ma: 'D3', ten: 'Xà phòng hoá chất béo', dung: 3, tong: 9, bac: 1 }]
    })
    const c = ve(<Dang pm={pm} />)
    const li = [...c.querySelectorAll('.phm-dang > li')]
    expect(chu(li[0]!.querySelector('.phm-bac [data-nay]'))).toBe('Vận dụng') // bacTheoDang
    expect(li[1]!.querySelector('.phm-bac')).toBeNull() // Phản ứng ester hoá: không nguồn nào biết
    expect(chu(li[3]!.querySelector('.phm-bac [data-nay]'))).toBe('Hiểu') // dangVap
    expect(li[4]!.querySelector('.phm-bac')).toBeNull()
  })

  it('không có lịch ôn ngày mai ⇒ bỏ chân thẻ; chỉ một loại ⇒ chỉ một thẻ; không có manhYeu ⇒ không vẽ gì', () => {
    const khongOn = ve(<Dang pm={sua(PH_OK, (r) => { r.lichOn.ngayMai = 0 })} />)
    expect(khongOn.querySelector('.phm-the__cuoi')).toBeNull()
    cleanup()
    const boLichOn = ve(<Dang pm={sua(PH_OK, (r) => { delete r.lichOn })} />)
    expect(boLichOn.querySelector('.phm-the__cuoi')).toBeNull()
    cleanup()
    const mot = ve(<Dang pm={sua(PH_OK, (r) => { r.manhYeu.conVap = [] })} />)
    expect(mot.querySelectorAll('.phm-hai > .phm-the')).toHaveLength(1)
    expect(chu(mot.querySelector('.phm-nhan-muc'))).toBe('Dạng con làm tốt')
    cleanup()
    const chiLenBac = ve(<Dang pm={sua(PH_OK, (r) => { r.manhYeu = { lenBacHomNay: [{ tenDang: 'A' }] } })} />)
    expect(chiLenBac.innerHTML).toBe('')
    cleanup()
    expect(ve(<Dang pm={THUA} />).innerHTML).toBe('')
    expect(coDang(THUA)).toBe(false)
  })
})

describe('Btvn — "Bài tập về nhà"', () => {
  it('đủ dữ liệu: tiêu đề, năm chấm chặng, hạn nộp, gần đây', () => {
    const c = ve(<Btvn pm={APPLE} />)
    expect(c.querySelector('section#muc-btvn')).not.toBeNull()
    expect(chu(c.querySelector('.phm-muc__dau p'))).toBe('1 bài đang chạy · 2 bài gần đây')
    expect(chu(c.querySelector('.phm-nhan-muc'))).toBe('Đang chạy')
    expect(chu(c.querySelector('.phm-ten-the'))).toBe('Ester – Lipid')
    expect(chu(c.querySelector('.phm-ten-the + .phm-phu'))).toBe('Xong 2 trong 5 chặng')
    const cham = [...c.querySelectorAll('.phm-chang > li')]
    expect(cham).toHaveLength(5)
    expect(cham.map((l) => l.getAttribute('data-tt'))).toEqual(['xong', 'xong', 'hom-nay', '', ''])
    // nhãn dưới chấm = chữ trực tiếp của <li> (không tính dòng đọc cho người dùng màn hình); ngày hôm nay (21/09) ⇒ "Hôm nay"
    expect(cham.map((l) => [...l.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim())).toEqual(['CN 20', 'Hôm nay', 'T3 22', 'T4 23', 'T5 24'])
    expect(chu(cham[2]!.querySelector('.phm-sr'))).toBe('· chặng 3 của hôm nay')
    expect(cham[0]!.querySelector('svg')).not.toBeNull() // dấu tích ở chặng đã xong
    expect(cham[3]!.querySelector('svg')).toBeNull()
    expect(chu(cham[3]!.querySelector('i'))).toBe('4')
    expect(c.querySelector('.phm-chang')!.getAttribute('aria-label')).toBe('5 chặng: 2 đã xong, 1 của hôm nay, 2 sắp tới')
    expect(chu(c.querySelector('.phm-ds li'))).toBe('Hạn nộp 12:00 · Thứ Sáu 25/09/2026 còn 3 ngày 15 giờ')
    // máy chủ không trả số đúng / giờ nộp từng chặng ⇒ không dòng "Chặng N · đúng x/y" và không chip "Nộp đúng nhịp"
    expect(c.textContent).not.toMatch(/Nộp đúng nhịp|Chặng 2|đúng 9\/12/)
    expect(c.querySelector('.phm-dong-cam')).toBeNull()
    const gan = [...c.querySelectorAll('.phm-bai > li')]
    expect(chu(c.querySelector('.phm-nhom__dau h3'))).toBe('Gần đây · mới nhất trước')
    expect(gan).toHaveLength(2)
    expect(chu(gan[0]!)).toBe('Ôn tập Alcohol – Phenol Nộp 21:40 · Thứ Năm 17/09/2026 Nộp đúng hạn 8,2 /10 điểm')
    expect(gan[0]!.querySelector('.phm-chip')!.getAttribute('data-mau')).toBe('dat')
    expect(chu(gan[1]!)).toBe('Ôn tập Carboxylic acid Nộp 23:05 · Chủ nhật 13/09/2026 Nộp trễ 1,5 giờ 7 /10 điểm')
    expect(gan[1]!.querySelector('.phm-chip')!.getAttribute('data-mau')).toBe('cam')
    expect(coBtvn(APPLE)).toBe(true)
  })

  it('bộ CŨ (không có chang): tiến độ bằng thanh, "Nộp sau hạn" khi thiếu nopTreGio', () => {
    const c = ve(<Btvn pm={CU} />)
    expect(c.querySelector('.phm-chang')).toBeNull()
    expect(chu(c.querySelector('.phm-ten-the + .phm-phu'))).toBe('Xong 2 trong 5 chặng')
    const thanh = c.querySelector('.phm-the .phm-thanh')!
    expect(thanh.getAttribute('aria-label')).toBe('Xong 2 trong 5 chặng')
    expect((thanh.querySelector('i') as HTMLElement).style.width).toBe('40%')
    expect(chu([...c.querySelectorAll('.phm-bai > li')][1]!.querySelector('.phm-chip'))).toBe('Nộp sau hạn')
  })

  it('thiếu điểm ⇒ bỏ điểm; dungHan null ⇒ bỏ chip; không có đúng giờ ⇒ giữ nguyên', () => {
    const pm = sua(PH_APPLE, (r) => { delete r.baiTapVeNha.gan[0].diem; delete r.baiTapVeNha.gan[0].dungHan })
    const c = ve(<Btvn pm={pm} />)
    const l0 = [...c.querySelectorAll('.phm-bai > li')][0]!
    expect(l0.querySelector('.phm-bai__diem')).toBeNull()
    expect(l0.querySelector('.phm-chip')).toBeNull()
    cleanup()
    const tre0 = ve(<Btvn pm={sua(PH_APPLE, (r) => { r.baiTapVeNha.gan[1].nopTreGio = 0 })} />)
    expect(chu([...tre0.querySelectorAll('.phm-bai > li')][1]!.querySelector('.phm-chip'))).toBe('Nộp sau hạn')
    cleanup()
    const tre25 = ve(<Btvn pm={sua(PH_APPLE, (r) => { r.baiTapVeNha.gan[1].nopTreGio = 2.5 })} />)
    expect(chu([...tre25.querySelectorAll('.phm-bai > li')][1]!.querySelector('.phm-chip'))).toBe('Nộp trễ 2,5 giờ')
  })

  it('thiếu cả hai mảng ⇒ không vẽ; chỉ có "gần đây" ⇒ không có thẻ đang chạy; thiếu khối ⇒ không vẽ', () => {
    expect(ve(<Btvn pm={sua(PH_APPLE, (r) => { r.baiTapVeNha = { dangChay: [], gan: [] } })} />).innerHTML).toBe('')
    cleanup()
    const chiGan = ve(<Btvn pm={sua(PH_APPLE, (r) => { r.baiTapVeNha.dangChay = [] })} />)
    expect(chu(chiGan.querySelector('.phm-muc__dau p'))).toBe('2 bài gần đây')
    expect(chiGan.querySelector('.phm-chang')).toBeNull()
    cleanup()
    expect(ve(<Btvn pm={THUA} />).innerHTML).toBe('')
    expect(coBtvn(THUA)).toBe(false)
  })

  it('dòng cam nợ: chỉ khi pm.no có; chữ đúng mẫu', () => {
    const co = ve(<Btvn pm={pmOf(PH_APPLE_NO)} />)
    expect(chu(co.querySelector('.phm-dong-cam'))).toBe('Con còn 1 chặng của Thứ Hai · tối nay cần khoảng 15 phút')
    expect(co.querySelector('.phm-dong-cam b')!.textContent).toBe('Con còn 1 chặng của Thứ Hai')
    cleanup()
    expect(ve(<Btvn pm={APPLE} />).querySelector('.phm-dong-cam')).toBeNull()
    cleanup()
    const khongPhut = ve(<Btvn pm={sua(PH_APPLE_NO, (r) => { delete r.no.tongPhut })} />)
    expect(chu(khongPhut.querySelector('.phm-dong-cam'))).toBe('Con còn 1 chặng của Thứ Hai')
  })

  it('chuDongNo: nhiều loại, nhiều ngày, loại lạ', () => {
    const no = (theoNgay: any[], tongPhut: number | null = 30) => ({ theoNgay, tongCau: 10, tongPhut })
    expect(chuDongNo(no([{ ngay: '2026-09-20', loai: 'chang_btvn', ten: 'A', soCau: 6, phut: 8 }, { ngay: '2026-09-21', loai: 'goi_gia_dinh', ten: 'B', soCau: 4, phut: 6 }, { ngay: '2026-09-21', loai: 'on_lai', ten: 'Ôn lại', soCau: 5, phut: 4 }]))).toEqual({
      dam: 'Con còn 1 chặng, 1 bài gia đình giao, 5 câu ôn lại của Chủ nhật, Thứ Hai',
      phu: 'tối nay cần khoảng 30 phút',
    })
    expect(chuDongNo(no([{ ngay: '2026-09-17', loai: 'lạ', ten: 'X', soCau: null, phut: null }, { ngay: '2026-09-18', loai: 'chang_btvn', ten: 'Y', soCau: 1, phut: 1 }, { ngay: '2026-09-19', loai: 'chang_btvn', ten: 'Z', soCau: 1, phut: 1 }, { ngay: '2026-09-20', loai: 'chang_btvn', ten: 'W', soCau: 1, phut: 1 }], 0))).toEqual({
      dam: 'Con còn 3 chặng, 1 việc của các ngày trước',
      phu: '',
    })
  })
})

describe('LichOn — "Lịch ôn lại"', () => {
  it('đủ dữ liệu: số câu ngày mai, phút, vòng khắc phục, cột 7 ngày', () => {
    const c = ve(<LichOn pm={APPLE} />)
    expect(c.querySelector('section#muc-on')).not.toBeNull()
    expect(chu(c.querySelector('.phm-muc__dau p'))).toBe('các câu con từng làm sai')
    expect(chu(c.querySelector('.phm-on__so'))).toBe('7 câu đến lịch ôn ngày mai Thứ Ba 22/09/2026 · khoảng 10 phút')
    const vong = c.querySelector('.phm-vong1')!
    expect(vong.getAttribute('aria-label')).toBe('Đã khắc phục 12 trong 31 câu từng sai')
    expect(chu(vong.querySelector('div'))).toBe('12/31 câu')
    expect(vong.querySelector('.phm-v-dat')!.getAttribute('stroke-dasharray')).toBe('104.6 270.2')
    expect(chu(c.querySelector('.phm-on__kp'))).toBe('Đã khắc phục 12 trong 31 câu từng sai còn 19 câu đang trong lịch ôn')
    expect(chu(c.querySelector('.phm-tuan h3'))).toBe('Số câu đến lịch ôn · 7 ngày tới')
    const li = [...c.querySelectorAll('.phm-tuan li')]
    expect(li).toHaveLength(7)
    expect(li[0]!.getAttribute('aria-label')).toBe('T3 22/09: 7 câu')
    expect(li[0]!.hasAttribute('data-mai')).toBe(true)
    expect(li[1]!.hasAttribute('data-mai')).toBe(false)
    expect(li[3]!.hasAttribute('data-khong')).toBe(true)
    expect(li[3]!.getAttribute('aria-label')).toBe('T6 25/09: 0 câu')
    expect(bien(li[0]!, '--c')).toBe('7')
    expect(chu(li[6]!)).toBe('1 T2 28')
    expect(coLichOn(APPLE)).toBe(true)
  })

  it('bộ CŨ (thiếu tongTungSai / bayNgayToi / phutNgayMai): mẫu số = đã khắc phục + còn sai, bỏ cột 7 ngày, bỏ vế phút', () => {
    const c = ve(<LichOn pm={CU} />)
    expect(chu(c.querySelector('.phm-on__so'))).toBe('7 câu đến lịch ôn ngày mai Thứ Ba 22/09/2026')
    expect(chu(c.querySelector('.phm-vong1 div'))).toBe('12/31 câu')
    expect(c.querySelector('.phm-tuan')).toBeNull()
    expect(c.textContent).not.toMatch(/khoảng/)
  })

  it('con chưa học hôm nay và còn câu đến lịch hôm nay ⇒ "hôm nay", không phút', () => {
    const c = ve(<LichOn pm={CHUA_HOC} />)
    expect(chu(c.querySelector('.phm-on__so'))).toBe('2 câu đến lịch ôn hôm nay Thứ Hai 21/09/2026')
    expect(c.textContent).not.toMatch(/khoảng/)
  })

  it('đã học mà hôm nay còn câu đến lịch ⇒ giữ "ngày mai" + dòng nhắc hôm nay còn N câu', () => {
    const c = ve(<LichOn pm={sua(PH_OK, (r) => { r.lichOn.homNay = 3 })} />)
    expect(chu(c.querySelector('.phm-on__so'))).toContain('7 câu đến lịch ôn ngày mai')
    expect(chu(c.querySelector('.phm-on__so'))).toContain('Hôm nay còn 3 câu đến lịch ôn')
  })

  it('chưa khắc phục câu nào ⇒ KHÔNG vẽ vòng "0", có lời giải thích', () => {
    const c = ve(<LichOn pm={sua(PH_OK, (r) => { r.lichOn.daKhacPhuc14Ngay = 0; r.lichOn.conSaiChuaKhacPhuc = 3 })} />)
    expect(c.querySelector('.phm-vong1')).toBeNull()
    expect(chu(c.querySelector('.phm-on__kp'))).toBe('3 câu con từng sai đang trong lịch ôn câu nào con làm đúng lại đủ lịch sẽ được tính là đã khắc phục')
    expect(c.querySelector('.phm-on__kp')!.getAttribute('data-mau')).toBe('xam')
  })

  it('đã khắc phục hết ⇒ không dòng "còn 0 câu"; tongTungSai lệch ⇒ dùng tổng tự cộng', () => {
    const het = ve(<LichOn pm={sua(PH_OK, (r) => { r.lichOn.conSaiChuaKhacPhuc = 0 })} />)
    expect(chu(het.querySelector('.phm-on__kp'))).toBe('Đã khắc phục 12 trong 12 câu từng sai')
    cleanup()
    const lech = ve(<LichOn pm={sua(PH_APPLE, (r) => { r.lichOn.tongTungSai = 5 })} />)
    expect(chu(lech.querySelector('.phm-vong1 div'))).toBe('12/31 câu')
  })

  it('ngày nhiều câu thì cột co tỉ lệ (không cao quá 10 bậc), số chữ vẫn là số thật', () => {
    const c = ve(<LichOn pm={sua(PH_APPLE, (r) => { r.lichOn.bayNgayToi[0].soCau = 40 })} />)
    const li = [...c.querySelectorAll('.phm-tuan li')]
    expect(bien(li[0]!, '--c')).toBe('10')
    expect(chu(li[0]!.querySelector('b'))).toBe('40')
    expect(Number(bien(li[1]!, '--c'))).toBeCloseTo(0.75, 2)
  })

  it('không có lịch ôn / toàn số 0 ⇒ không vẽ', () => {
    expect(ve(<LichOn pm={THUA} />).innerHTML).not.toBe('') // THUA có lichOn (2 câu)
    cleanup()
    expect(ve(<LichOn pm={sua(PH_OK, (r) => { delete r.lichOn })} />).innerHTML).toBe('')
    cleanup()
    expect(ve(<LichOn pm={sua(PH_OK, (r) => { r.lichOn = { homNay: 0, ngayMai: 0, daKhacPhuc14Ngay: 0, conSaiChuaKhacPhuc: 0 } })} />).innerHTML).toBe('')
    expect(coLichOn(sua(PH_OK, (r) => { delete r.lichOn }))).toBe(false)
  })
})

describe('Nhip14 — "14 ngày gần đây"', () => {
  it('đủ dữ liệu: số to, biểu đồ 14 cột, chú giải, ba dòng số liệu', () => {
    const c = ve(<Nhip14 pm={APPLE} />)
    expect(c.querySelector('section#muc-14')).not.toBeNull()
    expect(chu(c.querySelector('.phm-muc__dau p'))).toBe('số câu con làm mỗi ngày · 08/09 đến 21/09')
    expect(chu(c.querySelector('.phm-so-to b'))).toBe('283 câu trong 14 ngày')
    expect(chu(c.querySelector('.phm-so-to > span'))).toBe('con học 11 trong 14 ngày')
    const bieu = c.querySelector('.phm-bieu.phm-14')!
    expect(bieu.getAttribute('role')).toBe('img')
    const nhan_ = bieu.getAttribute('aria-label')!
    expect(nhan_).toContain('Số câu con làm mỗi ngày, 08/09 đến 21/09: T3 08: 22 câu; T4 09: không học;')
    expect(nhan_).toContain('T2 21: 38 câu')
    const li = [...bieu.querySelectorAll('ol > li')]
    expect(li).toHaveLength(14)
    expect(li.filter((l) => l.hasAttribute('data-nghi'))).toHaveLength(3)
    expect(li[13]!.hasAttribute('data-nay')).toBe(true)
    expect(chu(li[13]!.querySelector('em'))).toBe('38')
    expect(bien(li[13]!, '--c')).toBe('38')
    expect(bien(li[1]!, '--c')).toBe('0')
    expect(chu(li[0]!.querySelector('span'))).toBe('08')
    expect([...bieu.querySelectorAll('.phm-bieu__luoi em')].map((e) => e.textContent)).toEqual(['40 câu', '20 câu', '0'])
    expect(chu(c.querySelector('.phm-14__chu'))).toBe('hôm nay ngày có học ngày con không học')
    const dong = [...c.querySelectorAll('.phm-ds > li')].map((l) => chu(l))
    expect(dong).toEqual(['Trung bình mỗi ngày có học 20,2 câu', 'Giờ con thường học 19:30 đến 21:00', 'Chuỗi học đều 6 ngày liên tục từ 16/09'])
    expect(coNhip14(APPLE)).toBe(true)
  })

  it('bộ CŨ (không tongCau / trungBinh): cộng từ ngày[], trung bình theo ngày có học; "–" ở giờ thành "đến"', () => {
    const c = ve(<Nhip14 pm={CU} />)
    expect(chu(c.querySelector('.phm-so-to b'))).toBe('283 câu trong 14 ngày')
    const dong = [...c.querySelectorAll('.phm-ds > li')].map((l) => chu(l))
    expect(dong[0]).toBe('Trung bình mỗi ngày có học 25,7 câu')
    expect(dong[1]).toBe('Giờ con thường học 19:30 đến 21:00')
  })

  it('thưa (học từ 18/09): tiêu đề "con bắt đầu dùng app từ …", đếm ngày từ đó, "đủ cả 4 ngày"', () => {
    const c = ve(<Nhip14 pm={THUA} />)
    expect(chu(c.querySelector('.phm-muc__dau p'))).toBe('con bắt đầu dùng app từ Thứ Sáu 18/09')
    expect(chu(c.querySelector('.phm-so-to b'))).toBe('30 câu trong 4 ngày')
    expect(chu(c.querySelector('.phm-so-to > span'))).toBe('con học đủ cả 4 ngày')
    const dong = [...c.querySelectorAll('.phm-ds > li')].map((l) => chu(l))
    expect(dong[0]).toBe('Trung bình mỗi ngày có học 7,5 câu')
    expect(dong.at(-1)).toBe('Chuỗi học đều 4 ngày liên tục từ 18/09')
    expect([...c.querySelectorAll('.phm-14 ol > li')].filter((l) => l.hasAttribute('data-nghi'))).toHaveLength(10)
  })

  it('con chưa học hôm nay: hôm nay chưa tính, chuỗi "tính đến hôm qua", bỏ ba dòng số liệu, hôm nay không có số trên cột', () => {
    const c = ve(<Nhip14 pm={CHUA_HOC} />)
    expect(chu(c.querySelector('.phm-so-to b'))).toBe('21 câu trong 3 ngày')
    expect(chu(c.querySelector('.phm-so-to > span'))).toBe('chuỗi 3 ngày, tính đến hôm qua')
    expect(c.querySelector('.phm-ds')).toBeNull()
    const hn = c.querySelector('.phm-14 ol > li:last-child')!
    expect(hn.hasAttribute('data-nay')).toBe(true)
    expect(hn.hasAttribute('data-nghi')).toBe(true)
    expect(hn.querySelector('em')).toBeNull()
    expect(c.querySelector('.phm-14')!.getAttribute('aria-label')).toContain('T2 21: không học')
  })

  it('cờ chưa-học nhưng nhịp học nói hôm nay CÓ học ⇒ tin số liệu 14 ngày: hôm nay được tính, vẫn hiện ba dòng số liệu', () => {
    const c = ve(<Nhip14 pm={APPLE} chuaHoc />)
    expect(chu(c.querySelector('.phm-so-to b'))).toBe('283 câu trong 14 ngày')
    expect(chu(c.querySelector('.phm-so-to > span'))).toBe('con học 11 trong 14 ngày')
    expect(c.querySelectorAll('.phm-ds > li')).toHaveLength(3)
  })

  it('trục tự nới khi có ngày trên 40 câu; thiếu chuỗi ⇒ bỏ dòng chuỗi; thiếu giờ ⇒ bỏ dòng giờ', () => {
    const pm = sua(PH_APPLE, (r) => {
      r.nhipHoc.ngay[9].soCau = 55 // 20/09
      r.nhipHoc.ngay[9].soCauDung = 40
      r.nhipHoc.gioThuongHoc = ''
      r.homNay.tongQuan.chuoiNgayHoc = 0
    })
    const c = ve(<Nhip14 pm={pm} />)
    expect([...c.querySelectorAll('.phm-bieu__luoi em')].map((e) => e.textContent)).toEqual(['60 câu', '30 câu', '0'])
    expect(bien(c.querySelectorAll('.phm-14 ol > li')[12]!, '--c')).toBe('36.67')
    const dong = [...c.querySelectorAll('.phm-ds > li')].map((l) => chu(l))
    expect(dong).toHaveLength(1)
    expect(dong[0]).toContain('Trung bình mỗi ngày có học')
  })

  it('học đủ 14 ngày ⇒ "con học đủ cả 14 ngày"', () => {
    const pm = sua(PH_APPLE, (r) => {
      r.nhipHoc.ngay = Array.from({ length: 14 }, (_, i) => ({ ngay: `2026-09-${String(8 + i).padStart(2, '0')}`, soCau: 10, soCauDung: 8 }))
      delete r.nhipHoc.tongCau
      delete r.nhipHoc.trungBinhCauMoiNgay
    })
    const c = ve(<Nhip14 pm={pm} />)
    expect(chu(c.querySelector('.phm-so-to b'))).toBe('140 câu trong 14 ngày')
    expect(chu(c.querySelector('.phm-so-to > span'))).toBe('con học đủ cả 14 ngày')
    expect(chu(c.querySelector('.phm-ds li'))).toBe('Trung bình mỗi ngày có học 10 câu')
  })

  it('thiếu nhipHoc / chưa học ngày nào trong 14 ngày ⇒ không vẽ', () => {
    expect(ve(<Nhip14 pm={sua(PH_OK, (r) => { delete r.nhipHoc })} />).innerHTML).toBe('')
    cleanup()
    const toanKhong = sua(PH_OK, (r) => { r.nhipHoc.ngay = [{ ngay: '2026-09-20', soCau: 0, soCauDung: 0 }] })
    expect(ve(<Nhip14 pm={toanKhong} />).innerHTML).toBe('')
    expect(coNhip14(toanKhong)).toBe(false)
  })
})

describe('LoiAi — "Lời A.I Đỗ Đại Học gửi anh/chị"', () => {
  it('đủ dữ liệu: thư chỉ dùng chữ máy chủ + chữ ký + hai gợi ý đánh số', () => {
    const c = ve(<LoiAi pm={APPLE} />)
    expect(c.querySelector('section#muc-loi')).not.toBeNull()
    expect(chu(c.querySelector('h2'))).toBe('Lời A.I Đỗ Đại Học gửi anh/chị')
    expect(chu(c.querySelector('.phm-thu__dau'))).toBe('A.I A.I Đỗ Đại Học Thứ Hai 21/09/2026')
    const doan = [...c.querySelectorAll('.phm-thu__than p')].map((p) => chu(p))
    expect(doan).toEqual([PH_OK.loiBoNao.loi])
    expect(chu(c.querySelector('.phm-thu__ky'))).toBe('A.I Đỗ Đại Học viết từ số liệu học của con.')
    expect(chu(c.querySelector('.phm-goi-y')!.parentElement!.querySelector('.phm-nhan-muc'))).toBe('Anh/chị có thể làm gì')
    const goiY = [...c.querySelectorAll('.phm-goi-y > li')]
    expect(goiY.map((l) => chu(l.querySelector('i')))).toEqual(['1', '2'])
    expect(goiY.map((l) => chu(l.querySelector('span')))).toEqual(PH_OK.phuHuynhLamGi)
    expect(coLoiAi(APPLE)).toBe(true)
  })

  it('thuTuan ⇒ đoạn thứ hai; xuống dòng ⇒ tách đoạn; chỉ có gợi ý ⇒ không thẻ thư; thiếu ngày ⇒ bỏ dòng ngày', () => {
    const pm = sua(PH_OK, (r) => { r.loiBoNao.thuTuan = 'Tuần này con ôn đều.' })
    const c = ve(<LoiAi pm={pm} />)
    expect([...c.querySelectorAll('.phm-thu__than p')].map((p) => chu(p))).toEqual([PH_OK.loiBoNao.loi, 'Tuần này con ôn đều.'])
    cleanup()
    const tach = ve(<LoiAi pm={{ ...APPLE, loiBoNao: { loi: 'Đoạn một.\nĐoạn hai.', ngay: '', thuTuan: '' } }} />)
    expect([...tach.querySelectorAll('.phm-thu__than p')].map((p) => chu(p))).toEqual(['Đoạn một.', 'Đoạn hai.'])
    expect(tach.querySelector('.phm-thu__dau p')).toBeNull()
    cleanup()
    const chiGoiY = ve(<LoiAi pm={sua(PH_OK, (r) => { delete r.loiBoNao })} />)
    expect(chiGoiY.querySelector('.phm-thu')).toBeNull()
    expect(chiGoiY.querySelectorAll('.phm-goi-y > li')).toHaveLength(2)
    cleanup()
    const chiThu = ve(<LoiAi pm={sua(PH_OK, (r) => { r.phuHuynhLamGi = [] })} />)
    expect(chiThu.querySelector('.phm-goi-y')).toBeNull()
    expect(chiThu.querySelector('.phm-thu')).not.toBeNull()
  })

  it('tối đa hai gợi ý dù pm dựng tay có nhiều hơn', () => {
    const c = ve(<LoiAi pm={{ ...APPLE, phuHuynhLamGi: ['một', 'hai', 'ba'] }} />)
    expect([...c.querySelectorAll('.phm-goi-y > li span')].map((x) => chu(x))).toEqual(['một', 'hai'])
  })

  it('không có gì ⇒ không vẽ', () => {
    const pm = sua(PH_OK, (r) => { delete r.loiBoNao; r.phuHuynhLamGi = [] })
    expect(ve(<LoiAi pm={pm} />).innerHTML).toBe('')
    expect(coLoiAi(pm)).toBe(false)
    cleanup()
    expect(ve(<LoiAi pm={sua(PH_OK, (r) => { r.loiBoNao = { loi: '  ', ngay: '2026-09-21', thuTuan: '' }; r.phuHuynhLamGi = [] })} />).innerHTML).toBe('')
  })
})

describe('SapCo + DoCham', () => {
  it('bộ thưa: liệt kê ba khối đang vắng đúng chữ mẫu', () => {
    const c = ve(<SapCo pm={THUA} />)
    expect(chu(c.querySelector('.phm-nhan-muc'))).toBe('Bảng sẽ đầy dần khi con học thêm')
    const li = [...c.querySelectorAll('.phm-sap > li')].map((l) => chu(l))
    expect(li).toEqual([
      'Điểm mạnh · cần luyện hiện khi con làm thêm câu, đủ để A.I Đỗ Đại Học nhận ra từng dạng',
      'Ca kiểm tra gần nhất hiện khi thầy công bố điểm ca kiểm tra đầu tiên của con',
      'Bài tập về nhà hiện khi thầy giao bài cho lớp của con',
    ])
    expect(coSapCo(THUA)).toBe(true)
  })

  it('chỉ liệt kê khối THẬT SỰ vắng; đủ hết ⇒ không vẽ; ca chưa công bố vẫn là "có ca"', () => {
    expect(ve(<SapCo pm={APPLE} />).innerHTML).toBe('')
    expect(coSapCo(APPLE)).toBe(false)
    cleanup()
    const thieuMotKhoi = ve(<SapCo pm={sua(PH_APPLE, (r) => { delete r.manhYeu })} />)
    expect([...thieuMotKhoi.querySelectorAll('.phm-sap > li')].map((l) => chu(l.querySelector('span')).split(' hiện')[0])).toEqual(['Điểm mạnh · cần luyện'])
    cleanup()
    const chuaCb = ve(<SapCo pm={pmOf(PH_CHUA_CB)} />)
    expect(chuaCb.textContent).not.toContain('Ca kiểm tra gần nhất')
    cleanup()
    const cu = ve(<SapCo pm={CU} chuaHoc />)
    expect(cu.innerHTML).toBe('')
  })

  it('DoCham: đúng chữ mẫu; vắng ⇒ không vẽ; lớp 1 bạn ⇒ không vẽ', () => {
    const c = ve(<DoCham pm={APPLE} />)
    expect(chu(c.querySelector('.phm-do-cham'))).toBe('Độ chăm hôm nay: con đứng thứ 9 trong 42 bạn của lớp')
    expect([...c.querySelectorAll('.phm-do-cham b')].map((b) => b.textContent)).toEqual(['9', '42'])
    expect(coDoCham(APPLE)).toBe(true)
    cleanup()
    const vang = sua(PH_OK, (r) => { delete r.doCham })
    expect(ve(<DoCham pm={vang} />).innerHTML).toBe('')
    expect(coDoCham(vang)).toBe(false)
    cleanup()
    const motBan = sua(PH_OK, (r) => { r.doCham = { hang: 1, siSo: 1 } })
    expect(ve(<DoCham pm={motBan} />).innerHTML).toBe('')
    expect(coDoCham(motBan)).toBe(false)
  })
})

describe('luật chung của cả bảy khối', () => {
  const tatCa = (pm: PhMoi) => (
    <>
      <Ca pm={pm} />
      <Dang pm={pm} />
      <Btvn pm={pm} />
      <LichOn pm={pm} />
      <Nhip14 pm={pm} />
      <LoiAi pm={pm} />
      <SapCo pm={pm} />
      <DoCham pm={pm} />
    </>
  )
  it('không chữ game, không emoji, không mã nội bộ trên màn (mọi bộ dữ liệu mẫu)', () => {
    for (const raw of [PH_APPLE, PH_APPLE_NO, PH_APPLE_THUA, PH_APPLE_CHUA_HOC, PH_OK, PH_CHUA_CB]) {
      const c = ve(tatCa(pmOf(raw)))
      expect(c.textContent).not.toMatch(CAM_GAME)
      expect(c.textContent).not.toMatch(CAM_EMOJI)
      expect(c.textContent).not.toMatch(/\bCA-\d|\bB\d\b|maBtvn|qid|undefined|NaN|null/)
      cleanup()
    }
  })

  it('bộ đủ: id các mục đúng mẫu và mỗi mục là <section> có nhãn', () => {
    const c = ve(tatCa(APPLE))
    expect([...c.querySelectorAll('section[id]')].map((s) => s.id)).toEqual(['muc-ca', 'muc-dang', 'muc-btvn', 'muc-on', 'muc-14', 'muc-loi'])
    for (const s of c.querySelectorAll('section')) expect(s.getAttribute('aria-label')).toBeTruthy()
  })

  it('bộ CŨ (thiếu mọi trường mới) vẫn dựng được, không ném lỗi, không số 0/NaN bịa', () => {
    const c = ve(tatCa(CU))
    expect(c.querySelectorAll('section[id]').length).toBeGreaterThanOrEqual(5)
    expect(c.textContent).not.toMatch(/NaN|undefined/)
  })

  it('biểu đồ / thanh / vòng đều có role="img" + aria-label; nút đích chạm không có (chỉ đọc)', () => {
    const c = ve(tatCa(APPLE))
    for (const s of ['.phm-thanh', '.phm-bieu', '.phm-vong1', '.phm-bac', '.phm-diem']) for (const e of c.querySelectorAll(s)) {
      expect(e.getAttribute('role')).toBe('img')
      expect((e.getAttribute('aria-label') ?? '').length).toBeGreaterThan(3)
    }
    expect(c.querySelectorAll('button, a')).toHaveLength(0)
  })

  it('tệp nguồn: không màu thô, không CSS order, không emoji; mở đầu bằng chú thích tiếng Việt', () => {
    for (const t of TEP_C) {
      const s = doc(t)
      const khongChuThich = t.endsWith('.css') ? s.replace(/\/\*[\s\S]*?\*\//g, '') : s
      expect(khongChuThich, t).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(khongChuThich, t).not.toMatch(/\border\s*:/)
      expect(s, t).not.toMatch(CAM_EMOJI)
      expect(s.split('\n')[0], t).toMatch(t.endsWith('.css') ? /^\/\*/ : /^\/\/ /)
    }
  })

  it('CSS: mọi animation nằm trong @media (prefers-reduced-motion: no-preference); chỉ tên keyframes phm-c-…', () => {
    const css = doc('src/components/ph-moi/bang/khoi-c.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const khoi = css.indexOf('@media (prefers-reduced-motion: no-preference)')
    expect(khoi).toBeGreaterThanOrEqual(0)
    // ngoặc đóng của khối @media
    let sau = css.indexOf('{', khoi)
    for (let i = sau, sau_ = 0; i < css.length; i++) {
      if (css[i] === '{') sau_++
      else if (css[i] === '}' && --sau_ === 0) {
        sau = i + 1
        break
      }
    }
    const trongKhoi = css.slice(khoi, sau)
    const ngoaiKhoi = css.slice(0, khoi) + css.slice(sau)
    expect(trongKhoi).toMatch(/animation\s*:/)
    expect(ngoaiKhoi).not.toMatch(/animation\s*:/)
    expect(ngoaiKhoi).not.toMatch(/transition\s*:/)
    for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) expect(m[1]).toMatch(/^phm-c-/)
    for (const m of css.matchAll(/\.(phm-[\w-]+)/g)) expect(doc('src/components/ph-moi/ph-apple-bang.css')).toContain(m[1]!) // không lớp `phm-` mới
  })
})
