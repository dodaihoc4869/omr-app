// @vitest-environment node
// GĐ 1 — HỒ SƠ NẮM KIẾN THỨC (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.2, nghiệm thu GĐ 1).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import worker from '../server/src/index'
import { CAU_HINH_CHAN_DOAN_MAC_DINH } from '../src/lib/chan-doan-cau-hinh'
import {
  BAC_DANG_BAT_DAU, MOC_ON, NGUONG_DANG_YEU, SO_CAU_DU_TIN, SO_LAN_SAI_DAY_LAI, SO_MOC_KHAC_PHUC, TRAN_LAP_MOT_CAU,
} from '../server/src/ho-so-cau-hinh'
import { dangYeu, docHoSoEm, dungLaiHoSo, phatLaiSuKien, themNgay, type NamKtDang, type SuKienDoc } from '../server/src/ho-so-nam-kt'
import { docDoPhuDang } from '../server/src/ho-so-nam-kt'
import { ghiSuKien } from '../server/src/su-kien-hoc'
import { goiWorker, taoD1That } from './_d1-that'

let dem = 0
/** Sự kiện thô: `ngay` là ngày VN (YYYY-MM-DD), giờ 10:00 VN = 03:00Z cho đơn giản. */
function ev(qid: string, ketQua: 0 | 1 | null, ngay: string, o: Partial<SuKienDoc> & { gio?: string } = {}): SuKienDoc {
  const { gio = '03:00:00.000', ...rest } = o
  return {
    khoa: `k${String(++dem).padStart(6, '0')}`, sbd: 'S1', qid, nguon: 'btvn', ketQua, giay: null,
    luc: `${ngay}T${gio}Z`, ngayVn: ngay, maDang: 'AA.BB', chuyenDe: 'ES', ...rest,
  }
}
const cau = (ds: SuKienDoc[], qid = 'Q1') => phatLaiSuKien(ds).cau.find((c) => c.qid === qid)!

describe('hằng số một nguồn — hai bản không lệch', () => {
  it('MOC_ON khớp chan-doan-cau-hinh.ts (mốc 1/3/7; ở đó tính buổi, ở đây tính ngày — cùng dãy số)', () => {
    expect([...MOC_ON]).toEqual(CAU_HINH_CHAN_DOAN_MAC_DINH.MOC_ON)
    expect([...MOC_ON]).toEqual([1, 3, 7])
  })
  it('SO_CAU_DU_TIN khớp HoSoEmView.tsx (đọc thẳng nguyên văn, không kéo React vào test)', () => {
    const nguon = readFileSync('src/components/HoSoEmView.tsx', 'utf8')
    expect(Number(/export const SO_CAU_DU_TIN = (\d+)/.exec(nguon)?.[1])).toBe(SO_CAU_DU_TIN)
  })
  it('giá trị chốt 19/09: 3 mốc khắc phục · ngưỡng yếu 0,7 · trần lặp 3 · sai 3 lần thì dạy lại · bắt đầu bậc "hiểu"', () => {
    expect([SO_MOC_KHAC_PHUC, NGUONG_DANG_YEU, TRAN_LAP_MOT_CAU, SO_LAN_SAI_DAY_LAI, BAC_DANG_BAT_DAU]).toEqual([3, 0.7, 3, 3, 1])
  })
  it('không tệp máy chủ nào khác tự định nghĩa lại mấy hằng này', () => {
    for (const f of ['ho-so-nam-kt.ts', 'su-kien-hoc.ts', 'su-kien-nap-lai.ts']) {
      expect(readFileSync(`server/src/${f}`, 'utf8')).not.toMatch(/const\s+(MOC_ON|SO_MOC_KHAC_PHUC|NGUONG_DANG_YEU|SO_CAU_DU_TIN)\s*=/)
    }
  })
})

describe('chuyển trạng thái — nghiệm thu GĐ 1', () => {
  it('sai 20/09, đúng 21/09, 22/09, 25/09 → da_khac_phuc (đúng ví dụ của đề xuất), từng bước đúng mốc FSRS-6', () => {
    const buoc = (n: number) => cau([ev('Q1', 0, '2026-09-20'), ev('Q1', 1, '2026-09-21'), ev('Q1', 1, '2026-09-22'), ev('Q1', 1, '2026-09-25')].slice(0, n))
    expect(buoc(1)).toMatchObject({ trangThai: 'moi_sai', mocOnKe: '2026-09-21', lanSai: 1, dungLienTiep: 0 })
    expect(buoc(2)).toMatchObject({ trangThai: 'dang_on', mocOnKe: '2026-09-24', dungLienTiep: 1, ngayDungKhacNhau: 1 })
    expect(buoc(3)).toMatchObject({ trangThai: 'dang_on', mocOnKe: '2026-09-26', dungLienTiep: 2, ngayDungKhacNhau: 2 })
    expect(buoc(4)).toMatchObject({ trangThai: 'da_khac_phuc', mocOnKe: '2026-10-06', dungLienTiep: 3, ngayDungKhacNhau: 3 })
  })

  it('đúng 3 lần trong CÙNG ngày 21/09 → dung_lien_tiep = 1 (không thành 3 mốc), chưa khắc phục', () => {
    const c = cau([ev('Q1', 0, '2026-09-20'), ev('Q1', 1, '2026-09-21', { gio: '01:00:00.000' }), ev('Q1', 1, '2026-09-21', { gio: '05:00:00.000' }), ev('Q1', 1, '2026-09-21', { gio: '09:00:00.000' })])
    expect(c).toMatchObject({ dungLienTiep: 1, ngayDungKhacNhau: 1, trangThai: 'dang_on', mocOnKe: '2026-09-24', lanGap: 4 })
  })

  it('ranh giới ngày: 23:30 và 00:30 giờ VN là HAI ngày khác nhau (tính theo ngay_vn, không theo UTC)', () => {
    const a = ev('Q1', 0, '2026-09-20')
    const b = ev('Q1', 1, '2026-09-21', { luc: '2026-09-21T16:30:00.000Z' }) // 23:30 VN ngày 21
    const c = ev('Q1', 1, '2026-09-22', { luc: '2026-09-21T17:30:00.000Z' }) // 00:30 VN ngày 22
    expect(cau([a, b, c])).toMatchObject({ ngayDungKhacNhau: 2, dungLienTiep: 2 })
  })

  it('đang đúng dở mà sai lại 22/09 → về moi_sai, mốc 23/09, chuỗi đúng về 0, bậc dạng hạ', () => {
    const ds = [ev('Q1', 0, '2026-09-20'), ev('Q1', 1, '2026-09-21'), ev('Q1', 0, '2026-09-22')]
    const r = phatLaiSuKien(ds)
    expect(r.cau[0]).toMatchObject({ trangThai: 'moi_sai', mocOnKe: '2026-09-23', dungLienTiep: 0, ngayDungKhacNhau: 0, lanSai: 2 })
    // bậc: bắt đầu 1 → sai:0 → đúng:1 → sai:0
    expect(r.dang[0]!.bac).toBe(0)
  })

  it('đã khắc phục rồi sai lại thì mất trạng thái khắc phục và phải đúng đủ 3 ngày nữa', () => {
    const ds = [ev('Q1', 0, '2026-09-01'), ev('Q1', 1, '2026-09-02'), ev('Q1', 1, '2026-09-03'), ev('Q1', 1, '2026-09-06'), ev('Q1', 0, '2026-09-13'), ev('Q1', 1, '2026-09-14')]
    expect(cau(ds.slice(0, 4)).trangThai).toBe('da_khac_phuc')
    expect(cau(ds.slice(0, 5)).trangThai).toBe('moi_sai')
    expect(cau(ds)).toMatchObject({ trangThai: 'dang_on', dungLienTiep: 1, lanSai: 2 })
  })

  it('câu chưa từng sai mà làm đúng: chua_thay_sai (không bao giờ thành da_khac_phuc)', () => {
    const c = cau([ev('Q1', 1, '2026-09-20'), ev('Q1', 1, '2026-09-21'), ev('Q1', 1, '2026-09-24'), ev('Q1', 1, '2026-10-01')])
    expect(c).toMatchObject({ trangThai: 'chua_thay_sai', lanSai: 0, dungLienTiep: 4, mocOnKe: '2026-11-15' })
  })

  it('bỏ trống KHÔNG cộng lan_sai; chưa từng đúng → moi_sai; đã từng đúng thì giữ trạng thái', () => {
    const chua = cau([ev('Q1', null, '2026-09-20')])
    expect(chua).toMatchObject({ lanSai: 0, lanTrong: 1, trangThai: 'moi_sai', mocOnKe: '2026-09-21', ketQuaCuoi: null })
    const da = cau([ev('Q1', 0, '2026-09-19'), ev('Q1', 1, '2026-09-20'), ev('Q1', null, '2026-09-21')])
    expect(da).toMatchObject({ lanSai: 1, lanTrong: 1, trangThai: 'dang_on', dungLienTiep: 1, mocOnKe: '2026-09-23' })
  })

  it('can_day_lai: sai 3 lần chưa đúng lại lần nào; đúng một lần là gỡ nhãn', () => {
    const ba = [ev('Q1', 0, '2026-09-01'), ev('Q1', 0, '2026-09-02'), ev('Q1', 0, '2026-09-03')]
    expect(cau(ba).canDayLai).toBe(true)
    expect(cau(ba.slice(0, 2)).canDayLai).toBe(false)
    expect(cau([...ba, ev('Q1', 1, '2026-09-04')]).canDayLai).toBe(false)
  })

  it('giây trung bình chỉ tính các lần có đo (bỏ null, bỏ 0)', () => {
    expect(cau([ev('Q1', 1, '2026-09-20', { giay: 40 }), ev('Q1', 1, '2026-09-21', { giay: null }), ev('Q1', 0, '2026-09-22', { giay: 80 })]).giayTb).toBe(60)
    expect(cau([ev('Q1', 1, '2026-09-20')]).giayTb).toBeNull()
  })

  it('themNgay qua cuối tháng, cuối năm', () => {
    expect(themNgay('2026-09-30', 1)).toBe('2026-10-01')
    expect(themNgay('2026-12-31', 7)).toBe('2027-01-07')
  })
})

describe('tất định — phát lại hai lần ra CÙNG kết quả', () => {
  const ds = (() => {
    const r: SuKienDoc[] = []
    for (let i = 0; i < 6; i++) r.push(ev(`Q${i}`, i % 3 === 0 ? 0 : 1, '2026-09-20'), ev(`Q${i}`, i % 2 === 0 ? 1 : 0, '2026-09-21'), ev(`Q${i}`, null, '2026-09-22'))
    r.push({ ...ev('QX', 1, '2026-09-20'), sbd: 'S2' })
    return r
  })()

  it('hai lần liền cùng đầu vào → JSON giống hệt', () => {
    expect(JSON.stringify(phatLaiSuKien(ds))).toBe(JSON.stringify(phatLaiSuKien(ds)))
  })
  it('không phụ thuộc thứ tự dòng đầu vào (sổ đọc ra thứ tự nào cũng được)', () => {
    const dao = [...ds].reverse()
    const xao = [...ds].sort((a, b) => a.qid.localeCompare(b.qid) || b.khoa.localeCompare(a.khoa))
    const chuan = JSON.stringify(phatLaiSuKien(ds))
    expect(JSON.stringify(phatLaiSuKien(dao))).toBe(chuan)
    expect(JSON.stringify(phatLaiSuKien(xao))).toBe(chuan)
  })
  it('không sửa mảng đầu vào và hai em tách bạch', () => {
    const truoc = JSON.stringify(ds)
    const r = phatLaiSuKien(ds)
    expect(JSON.stringify(ds)).toBe(truoc)
    expect(new Set(r.cau.map((c) => c.sbd))).toEqual(new Set(['S1', 'S2']))
  })
})

describe('dạng: gom theo mã dạng, tra kho, rơi về chuyên đề và ĐỊNH NGHĨA "yếu" duy nhất', () => {
  it('mã dạng: sự kiện mang sẵn > tra kho theo qid > CD:<chuyên đề> > không có dạng', () => {
    const tra = { dang: new Map([['B', 'KHO.DANG']]), chuyenDe: new Map([['C', 'Este'], ['B', 'Amin']]) }
    const r = phatLaiSuKien([
      ev('A', 1, '2026-09-20', { maDang: 'SAN.CO', chuyenDe: '' }),
      ev('B', 1, '2026-09-20', { maDang: null, chuyenDe: '' }),
      ev('C', 1, '2026-09-20', { maDang: null, chuyenDe: '' }),
      ev('D', 1, '2026-09-20', { maDang: null, chuyenDe: '' }),
    ], tra)
    expect(r.cau.map((c) => [c.qid, c.maDang, c.chuyenDe])).toEqual([['A', 'SAN.CO', ''], ['B', 'KHO.DANG', 'Amin'], ['C', 'CD:Este', 'Este'], ['D', null, '']])
    expect(r.dang.map((d) => d.maDang).sort()).toEqual(['CD:Este', 'KHO.DANG', 'SAN.CO']) // D không dạng → chỉ ở nam_kt_cau
  })

  it('tổng hợp dạng: số câu gặp/từng sai/khắc phục/moi_sai và mốc sớm nhất của câu CHƯA khắc phục', () => {
    const r = phatLaiSuKien([
      ev('A', 0, '2026-09-20'), ev('A', 1, '2026-09-21'), ev('A', 1, '2026-09-22'), ev('A', 1, '2026-09-25'), // da_khac_phuc
      ev('B', 0, '2026-09-24'), // moi_sai, mốc 25/09
      ev('C', 1, '2026-09-20'), // chua_thay_sai
      ev('D', 0, '2026-09-20'), ev('D', 1, '2026-09-21'), // dang_on, FSRS mốc 24/09
    ])
    expect(r.dang).toHaveLength(1)
    expect(r.dang[0]).toMatchObject({ maDang: 'AA.BB', soGap: 4, soSai: 3, soDaKhacPhuc: 1, soMoiSai: 1, soChuaThaySai: 1, mocOnKe: '2026-09-24', mocMoiSai: '2026-09-25' })
  })

  const dang = (o: Partial<NamKtDang>): NamKtDang => ({ sbd: 'S1', maDang: 'X', soGap: 0, soSai: 0, soDaKhacPhuc: 0, soMoiSai: 0, soChuaThaySai: 0, bac: 1, mocOnKe: null, mocMoiSai: null, ...o })
  it('dạng yếu: đủ 4 câu mà (khắc phục + chưa sai)/gặp < 0,7; dưới 4 câu thì CHƯA kết luận', () => {
    expect(dangYeu(dang({ soGap: 3, soChuaThaySai: 0 }), '2026-09-20')).toBe(false) // 3 câu: chưa đủ căn cứ
    expect(dangYeu(dang({ soGap: 4, soDaKhacPhuc: 2, soChuaThaySai: 0 }), '2026-09-20')).toBe(true) // 2/4 = 0,5
    expect(dangYeu(dang({ soGap: 10, soDaKhacPhuc: 3, soChuaThaySai: 4 }), '2026-09-20')).toBe(false) // 7/10 = 0,7 — đúng ngưỡng thì KHÔNG yếu
    expect(dangYeu(dang({ soGap: 10, soDaKhacPhuc: 3, soChuaThaySai: 3 }), '2026-09-20')).toBe(true) // 0,6
  })
  it('dạng yếu vì có câu moi_sai TỚI HẠN ôn (mốc ≤ hôm nay), dù ít câu', () => {
    const d = dang({ soGap: 2, soMoiSai: 1, mocMoiSai: '2026-09-21' })
    expect(dangYeu(d, '2026-09-20')).toBe(false) // chưa tới hạn
    expect(dangYeu(d, '2026-09-21')).toBe(true)
    expect(dangYeu(d, '2026-09-25')).toBe(true)
  })
})

describe('dựng lại hồ sơ trên D1 thật', () => {
  async function seed(d: ReturnType<typeof taoD1That>) {
    // Game đã lập chỉ mục: qid Q1 có mã dạng thật; Q2 chỉ có chuyên đề ở cau_hoi; Q3 không có gì.
    d.sql.exec(`INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES('D','Q1','v','g1','AA.BB.CC','{}');
      INSERT INTO cau_hoi(qid,ma_de,chuyen_de,cap_nhat_luc) VALUES('Q2','D','Este','x');`)
    let lan = 0 // mỗi lần làm một `lan` riêng — cùng khoá thì sổ (đúng luật) bỏ bản sau
    const sk = (qid: string, ketQua: 0 | 1 | null, ngay: string, sbd = 'S1') => ({
      nguon: 'btvn' as const, maNguon: 'B1', sbd, qid, lan: ++lan, ketQua, luc: `${ngay}T03:00:00.000Z`,
    })
    await ghiSuKien(d.env, [
      sk('Q1', 0, '2026-09-20'), sk('Q1', 1, '2026-09-21'),
      sk('Q2', 1, '2026-09-20'), sk('Q3', null, '2026-09-22'),
      sk('Q1', 0, '2026-09-20', 'S2'),
    ])
  }

  it('dựng từ sổ: tra mã dạng theo qid, rơi về chuyên đề, câu không dạng chỉ nằm ở nam_kt_cau', async () => {
    const d = taoD1That()
    await seed(d)
    const r = await dungLaiHoSo(d.env, ['S1'], '2026-09-23T00:00:00.000Z')
    expect({ soEm: r.soEm, soCau: r.soCau, soDang: r.soDang, cauKhongDang: r.cauKhongDang }).toEqual({ soEm: 1, soCau: 3, soDang: 2, cauKhongDang: 1 })
    // hoSo (mới, HẠ TẢI M3): hồ sơ ĐẦY ĐỦ vừa dựng, có mặt để nơi gọi (ke-hoach-ngay) khỏi đọc lại D1.
    expect(r.hoSo.get('S1')?.cau.map((c) => c.qid).sort()).toEqual(['Q1', 'Q2', 'Q3'])
    expect(r.hoSo.get('S1')?.dang.length).toBe(2)
    const h = await docHoSoEm(d.env, 'S1')
    expect(h.cau.map((c) => [c.qid, c.maDang, c.trangThai, c.mocOnKe])).toEqual([
      ['Q1', 'AA.BB.CC', 'dang_on', '2026-09-24'], ['Q2', 'CD:Este', 'chua_thay_sai', '2026-09-23'], ['Q3', null, 'moi_sai', '2026-09-23'],
    ])
    expect(h.dang.map((x) => x.maDang)).toEqual(['AA.BB.CC', 'CD:Este'])
    expect((await docHoSoEm(d.env, 'S2')).cau).toHaveLength(0) // em khác chưa dựng: không bị đụng
  })

  it('dựng hai lần → bảng giống hệt; sổ thêm sự kiện rồi dựng lại → hồ sơ theo sổ; em khác không bị đụng', async () => {
    const d = taoD1That()
    await seed(d)
    await dungLaiHoSo(d.env, ['S1', 'S2'], '2026-09-23T00:00:00Z')
    const mot = [d.chup('nam_kt_cau'), d.chup('nam_kt_dang')]
    await dungLaiHoSo(d.env, ['S1', 'S2'], '2026-09-23T00:00:00Z')
    expect([d.chup('nam_kt_cau'), d.chup('nam_kt_dang')]).toEqual(mot)
    const s2 = JSON.stringify((await docHoSoEm(d.env, 'S2')))
    await ghiSuKien(d.env, [{ nguon: 'game', maNguon: 'G', sbd: 'S1', qid: 'Q1', lan: 1, ketQua: 1, luc: '2026-09-22T03:00:00.000Z' }])
    await dungLaiHoSo(d.env, ['S1'], '2026-09-23T00:00:00Z')
    expect((await docHoSoEm(d.env, 'S1')).cau.find((c) => c.qid === 'Q1')).toMatchObject({ ngayDungKhacNhau: 2, dungLienTiep: 2, mocOnKe: '2026-09-26' })
    expect(JSON.stringify(await docHoSoEm(d.env, 'S2'))).toBe(s2)
  })

  it('đường thầy /ho-so/dung-lai đòi mã bí mật, tối đa 50 em; /ho-so/xem trả hồ sơ', async () => {
    const d = taoD1That()
    await seed(d)
    expect((await goiWorker(worker, d.env, '/ho-so/dung-lai', { sbd: ['S1'] })).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/ho-so/dung-lai', { sbd: [] }, true)).ok).toBe(false)
    expect((await goiWorker(worker, d.env, '/ho-so/dung-lai', { sbd: Array.from({ length: 51 }, (_, i) => `S${i}`) }, true)).ok).toBe(false)
    const r = await goiWorker(worker, d.env, '/ho-so/dung-lai', { sbd: ['S1'] }, true)
    expect(r).toMatchObject({ ok: true, soEm: 1, soCau: 3 })
    const x = await goiWorker(worker, d.env, '/ho-so/xem', { sbd: 'S1' }, true)
    expect(x.cau).toHaveLength(3)
  })

  it('độ phủ mã dạng: đếm qid có mã dạng thật / chỉ có chuyên đề / không có gì — nói thật con số', async () => {
    const d = taoD1That()
    await seed(d)
    expect(await docDoPhuDang(d.env)).toMatchObject({ ok: true, tongQid: 3, coMaDang: 1, chiCoChuyenDe: 1, khongCoGi: 1, tiLeCoMaDang: 33.3 })
  })
})
