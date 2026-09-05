// GOM LINK PHIẾU CỦA CẢ MỘT CA để dán một lượt vào Zalo.
//
// Ba chỗ sai thì thầy chỉ phát hiện sau khi đã gửi cho phụ huynh, nên khoá bằng
// số: gửi nhầm bản phiếu cũ, gửi nhầm phiếu bài tập thành phiếu điểm, và gửi
// thiếu em mà không ai báo.
import { describe, expect, it } from 'vitest'
import { gomLinkPhieu, phieuMoiNhatTheoEm, tomTatLinkPhieu, vanBanLinkPhieu } from '../src/lib/link-phieu-ca'
import type { PhieuCuaCa } from '../src/lib/exam-api'

const GOC = 'https://dodaihoc4869.github.io/omr-app/'

const p = (ma: string, sbd: string, hoTen: string, taoLuc: string, loai: 'ketqua' | 'baitap' = 'ketqua', soLanXem = 0): PhieuCuaCa => ({
  ma,
  sbd,
  hoTen,
  taoLuc,
  soLanXem,
  xemLanCuoi: '',
  loai,
})

const EM = [
  { sbd: '001', hoTen: 'Nguyễn An' },
  { sbd: '002', hoTen: 'Trần Bình' },
]

describe('mỗi em một phiếu, bản mới nhất', () => {
  it('thầy tạo lại phiếu thì lấy bản MỚI, không lấy bản cũ', () => {
    const ds = [p('cu00000000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z'), p('moi0000000', '001', 'Nguyễn An', '2026-09-05T09:00:00.000Z')]
    expect(phieuMoiNhatTheoEm(ds).get('001')?.ma).toBe('moi0000000')
  })

  it('phiếu thiếu mốc thời gian bị coi là cũ nhất, không đè bản có mốc', () => {
    const ds = [p('cothoigian', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z'), p('khongmoc0', '001', 'Nguyễn An', '')]
    expect(phieuMoiNhatTheoEm(ds).get('001')?.ma).toBe('cothoigian')
  })

  it('KHÔNG trộn phiếu bài tập vào phiếu kết quả', () => {
    const ds = [p('ketqua0000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z'), p('baitap0000', '001', 'Nguyễn An', '2026-09-05T09:00:00.000Z', 'baitap')]
    expect(phieuMoiNhatTheoEm(ds, 'ketqua').get('001')?.ma).toBe('ketqua0000')
    expect(phieuMoiNhatTheoEm(ds, 'baitap').get('001')?.ma).toBe('baitap0000')
  })
})

describe('dựng danh sách link', () => {
  it('giữ ĐÚNG thứ tự em trong ca, link mang mã phiếu', () => {
    const ds = [p('maBinh0000', '002', 'Trần Bình', '2026-09-05T02:00:00.000Z'), p('maAn000000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z')]
    const g = gomLinkPhieu(EM, ds, GOC)
    expect(g.dong.map((d) => d.sbd)).toEqual(['001', '002'])
    expect(g.dong[0].link).toBe(`${GOC}p#maAn000000`)
    expect(g.chuaCoPhieu).toEqual([])
  })

  it('EM CHƯA CÓ PHIẾU được kê riêng, không im lặng bỏ qua', () => {
    const g = gomLinkPhieu(EM, [p('maAn000000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z')], GOC)
    expect(g.dong).toHaveLength(1)
    expect(g.chuaCoPhieu.map((e) => e.hoTen)).toEqual(['Trần Bình'])
  })

  it('phiếu của em KHÔNG trong danh sách gửi thì bỏ qua', () => {
    const ds = [p('maAn000000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z'), p('maLa000000', '099', 'Em lạ', '2026-09-05T03:00:00.000Z')]
    const g = gomLinkPhieu([EM[0]], ds, GOC)
    expect(g.dong.map((d) => d.sbd)).toEqual(['001'])
  })

  it('số câu và chế độ đi vào link đúng định dạng phiếu', () => {
    const g = gomLinkPhieu([EM[0]], [p('maAn000000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z')], GOC, 'ketqua', 20, 'de')
    expect(g.dong[0].link).toBe(`${GOC}p#maAn000000~20d`)
  })
})

describe('văn bản dán vào Zalo', () => {
  const ds = [p('maAn000000', '001', 'Nguyễn An', '2026-09-05T01:00:00.000Z', 'ketqua', 2)]

  it('mỗi em một dòng: tên rồi link, không thêm lời chào', () => {
    const t = vanBanLinkPhieu(gomLinkPhieu([EM[0]], ds, GOC))
    expect(t).toBe(`Nguyễn An: ${GOC}p#maAn000000`)
  })

  it('có em thiếu thì ghi rõ ở cuối', () => {
    const t = vanBanLinkPhieu(gomLinkPhieu(EM, ds, GOC))
    expect(t).toContain('Chưa có phiếu (1 em): Trần Bình')
  })

  it('tóm tắt nói số link, số chưa ai mở và số em còn thiếu', () => {
    const g = gomLinkPhieu(EM, [...ds, p('maBinh0000', '002', 'Trần Bình', '2026-09-05T02:00:00.000Z')], GOC)
    expect(tomTatLinkPhieu(g)).toBe('2 link · 1 chưa ai mở')
    expect(tomTatLinkPhieu(gomLinkPhieu(EM, ds, GOC))).toBe('1 link · 1 em chưa có phiếu')
  })
})

describe('lệnh máy chủ và nút trên màn Theo dõi', () => {
  it('Apps Script có action phieuTheoCa, đòi mã bí mật, KHÔNG trả nội dung phiếu', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("if (action === 'phieuTheoCa')")
    const i = gs.indexOf("if (action === 'phieuTheoCa')")
    const doan = gs.slice(i, i + 1600)
    expect(doan).toContain('kiemTraMaBiMat_(body)')
    // chỉ đọc các cột mã/sbd/họ tên/mốc — không đụng cột 5 (PhieuJson)
    expect(doan).not.toContain('docJsonLon_')
  })

  it('Apps Script: cột Loai tách phiếu kết quả với phiếu bài tập', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("'XemLanCuoi', 'Loai']")
    expect(gs).toContain("String(body.loai || '') === 'baitap' ? 'baitap' : 'ketqua'")
    // sheet cũ thiếu cột thì tự bổ sung tiêu đề, thầy không phải sửa tay
    expect(gs).toContain('boSungTieuDe_(sh, PHIEU_HEADERS)')
  })

  it('client gắn loại phiếu đúng chỗ, và `loai` không bị `...d` rải đè', async () => {
    const ma = (await import('../src/lib/exam-api.ts?raw')).default
    expect(ma).toContain("...d, loai: d.loai || 'ketqua'")
    const pz = (await import('../src/components/PhieuZaloEm.tsx?raw')).default
    expect(pz).toContain("loai: 'baitap'")
    expect(pz).toContain("loai: 'ketqua'")
  })

  it('màn Theo dõi có nút copy link phiếu cho cả ca', async () => {
    const ma = (await import('../src/screens/ExamMonitorScreen.tsx?raw')).default
    expect(ma).toContain('Copy link phiếu gửi Zalo')
    expect(ma).toContain('phieuTheoCa(url, mat, chiTiet.ca.maCa)')
    expect(ma).toContain('vanBanLinkPhieu(g)')
  })
})
