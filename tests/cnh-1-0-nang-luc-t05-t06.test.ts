// @vitest-environment node
// P03 — NĂNG LỰC THEO BẰNG CHỨNG: T05 (không nhảy bậc từ câu dễ) và T06 (phục hồi sau ba lỗi).
// Test gọi CODE SẢN PHẨM THẬT `server/src/nang-luc.ts` (hàm thuần, không mock phần đang cần chứng minh),
// tham chiếu 02 mục 3 + THAM-SO.json `learning` và vector MAU-KET-QUA.json V47/V48.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  anhChupTuSuKien, confidenceBangChung, donViBangChung, gopTangDan, laDocLap,
  phatLaiNangLuc, POLICY_VERSION, trongCuaSo, tinhDotDayLai,
  type Assistance, type SuKienNL, type TrangThaiTruoc, type Visibility,
} from '../server/src/nang-luc'
import {
  CUA_SO_BANG_CHUNG_NGAY, CUA_SO_LOI_NGAY, GIAY_CACH_STABLE, GIAY_HOAT_DONG_PHUC_HOI,
  SO_DUNG_TRONG_RECENT5, SO_FAMILY_LOI, SO_FAMILY_XAC_NHAN, SO_NGAY_BANG_CHUNG,
} from '../server/src/ho-so-cau-hinh'

let dem = 0
interface Tham {
  qid: string; ngay: string; gio?: string; correct: boolean | null
  cg?: string; skills?: string[]; nen?: string[]; fam?: string | null; muc?: 0 | 1 | 2
  assistance?: Assistance; purpose?: string | null; vis?: Visibility; sec?: number | null
  sbd?: string; correctionOf?: string | null
}
/** Sự kiện chuẩn hoá: giờ VN 10:00 = 03:00Z, `learningDay` do MÁY CHỦ quyết định (đúng ngày VN). */
function ev(t: Tham): SuKienNL {
  return {
    eventId: t.qid, attemptId: `a-${t.qid}`, sbd: t.sbd ?? 'S1', qid: t.qid,
    contentGroup: t.cg ?? `cg-${t.qid}`, familyId: t.fam === undefined ? `f-${t.cg ?? `cg-${t.qid}`}` : t.fam,
    skillIds: t.skills ?? ['S1'], prerequisiteIds: t.nen ?? [], difficulty: t.muc ?? 0,
    learningDay: t.ngay, receivedAt: Date.parse(`${t.ngay}T${t.gio ?? '03:00:00.000'}Z`),
    correct: t.correct, assistance: t.assistance ?? 'none', visibility: t.vis ?? 'released',
    correctionOf: t.correctionOf ?? null, activeSeconds: t.sec ?? null, purpose: t.purpose ?? null,
  }
}
const kyNang = (ds: SuKienNL[], k = 'S1', denNgay = '2026-09-10') => {
  const b = phatLaiNangLuc(ds, { denNgay }).get('S1')!
  return b.skills.find((s) => s.skillId === k)!
}
/** Ngày VN `ngay` cộng thêm `n` ngày (fixture). */
const ngaySau = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
/** 5 family khác nhau ở một mức, trải qua `soNgay` ngày VN khác nhau, `dung` câu đúng. */
function namFamily(muc: 0 | 1 | 2, soNgay: number, dung = SO_FAMILY_XAC_NHAN, ngayDau = '2026-09-01', skill = 'S1', cgGoc = 'A', nen: string[] = []): SuKienNL[] {
  return Array.from({ length: SO_FAMILY_XAC_NHAN }, (_, i) => {
    dem++
    const ngay = soNgay <= 1 ? ngayDau : i % 2 === 0 ? ngayDau : ngaySau(ngayDau, 1)
    return ev({ qid: `q-${skill}-${cgGoc}-${i}-${dem}`, cg: `${cgGoc}${i}-${dem}`, ngay, correct: i < dung, muc, skills: [skill], fam: `f-${skill}-${i}`, nen })
  })
}
/** Ba lỗi ĐỘC LẬP ở cùng kỹ năng: khác content_group, hai family, trong cùng một ngày. */
function baLoi(ngayDau: string, skill = 'S1'): SuKienNL[] {
  return [
    ev({ qid: `loi-${skill}-1`, cg: `L1-${skill}`, ngay: ngayDau, correct: false, skills: [skill], fam: `fA-${skill}` }),
    ev({ qid: `loi-${skill}-2`, cg: `L2-${skill}`, ngay: ngayDau, gio: '04:00:00.000', correct: false, skills: [skill], fam: `fB-${skill}` }),
    ev({ qid: `loi-${skill}-3`, cg: `L3-${skill}`, ngay: ngayDau, gio: '05:00:00.000', correct: false, skills: [skill], fam: `fA-${skill}` }),
  ]
}


describe('T05 — KHÔNG nhảy bậc từ câu dễ (một lần đúng trong ngày không đủ)', () => {
  it('4 câu Biết (mức 0) ĐÚNG cùng một ngày ⇒ validated_level vẫn null, KHÔNG xác nhận Vận dụng', () => {
    const ds = Array.from({ length: 4 }, (_, i) => { dem++; return ev({ qid: `de-${i}-${dem}`, cg: `de${i}`, ngay: '2026-09-10', correct: true, muc: 0, fam: `f${i}` }) })
    const s = kyNang(ds, 'S1', '2026-09-10')
    expect(s.validatedLevel).toBeNull()
    expect(s.workingLevel).toBe(0) // mức khởi đầu, KHÔNG vọt lên 2 vì đúng 4 câu dễ
    expect(s.confidence).toBe(0.4) // min(4/5,1) × min(1/2,1) — độ ĐỦ bằng chứng, không phải xác suất
    expect(s.dayCount).toBe(1)
  })

  it('`confidence` khớp vector MAU-KET-QUA V47/V48 (4 family/1 ngày ⇒ 0,4 · 5 family/2 ngày ⇒ 1)', () => {
    expect(confidenceBangChung(4, 1)).toBe(0.4)
    expect(confidenceBangChung(5, 2)).toBe(1)
    expect(confidenceBangChung(3, 5)).toBe(0.6)
  })

  it('5 family ĐÚNG mức 1 qua 2 ngày ⇒ CHỈ xác nhận mức 1 (không phải 2)', () => {
    const s = kyNang(namFamily(1, 2))
    expect(s.validatedLevel).toBe(1)
    expect(s.workingLevel).toBe(1)
    expect(s.familyCount).toBe(SO_FAMILY_XAC_NHAN)
    expect(s.dayCount).toBe(SO_NGAY_BANG_CHUNG)
    expect(s.recent5).toHaveLength(5)
    expect(s.recent5.filter((x) => x.correct)).toHaveLength(5)
    expect(s.recent5.every((x) => !!x.eventId)).toBe(true) // ghi event_id đã chọn để giải thích
    expect(s.confidence).toBe(1)
  })

  it('5 family nhưng chỉ 3/5 đúng ⇒ KHÔNG xác nhận (cần ≥4/5 recent5)', () => {
    const s = kyNang(namFamily(1, 2, 3))
    expect(s.recent5.filter((x) => x.correct)).toHaveLength(3)
    expect(SO_DUNG_TRONG_RECENT5).toBe(4)
    expect(s.validatedLevel).toBeNull()
  })

  it('5 family đúng mức 1 nhưng CHỈ MỘT ngày ⇒ KHÔNG xác nhận (cần ≥2 ngày VN)', () => {
    const s = kyNang(namFamily(1, 1))
    expect(s.dayCount).toBe(1)
    expect(s.validatedLevel).toBeNull()
  })

  it('NỀN đang có đợt dạy lại MỞ ⇒ KHÔNG xác nhận mức dù đủ 5 family/2 ngày', () => {
    const ds = [...namFamily(1, 2, SO_FAMILY_XAC_NHAN, '2026-09-01', 'S1', 'A', ['NEN']), ...baLoi('2026-09-03', 'NEN')]
    const s = kyNang(ds)
    expect(s.kyNangNen).toContain('NEN')
    expect(kyNang(ds, 'NEN').dotDangMo?.state).toBe('needs_teaching')
    expect(s.validatedLevel).toBeNull()
  })

  it('bằng chứng quá 30 NGÀY ⇒ giữ mức đã từng xác nhận + đánh dấu cần kiểm lại, luyện thấp hơn một bậc', () => {
    const cu = namFamily(1, 2, 5, '2026-07-01')
    const truoc = new Map<string, TrangThaiTruoc>([['S1|S1', { validatedLevel: 1, lastValidatedAt: '2026-07-02' }]])
    const s = phatLaiNangLuc(cu, { denNgay: '2026-09-30' }, truoc).get('S1')!.skills[0]!
    expect(s.validatedLevel).toBe(1) // KHÔNG xoá thành tích
    expect(s.lastValidatedAt).toBe('2026-07-02')
    expect(s.canKiemLai).toBe(true)
    expect(s.workingLevel).toBe(0) // chẩn đoán lại từ mức thấp hơn
    expect(CUA_SO_BANG_CHUNG_NGAY).toBe(30)
    expect(trongCuaSo(donViBangChung(cu), '2026-09-30')).toHaveLength(0)
  })

  it('probe độc lập ĐÚNG ở bậc trên, NGÀY SAU ⇒ working_level = d+1 (validated vẫn giữ d)', () => {
    const ds = [...namFamily(1, 2), ev({ qid: 'probe', cg: 'probe', ngay: '2026-09-05', correct: true, muc: 2, fam: 'f-probe' })]
    const s = kyNang(ds)
    expect(s.validatedLevel).toBe(1)
    expect(s.workingLevel).toBe(2)
  })

  it('probe SAI ⇒ giữ nguyên working_level (không hạ vì probe tự chọn)', () => {
    const ds = [...namFamily(1, 2), ev({ qid: 'probe', cg: 'probe', ngay: '2026-09-05', correct: false, muc: 2, fam: 'f-probe' })]
    const s = kyNang(ds)
    expect(s.validatedLevel).toBe(1)
    expect(s.workingLevel).toBe(1)
  })

  it('cấp thần thú KHÔNG tham gia công thức (R09: "không theo cấp thú")', () => {
    expect(readFileSync('server/src/nang-luc.ts', 'utf8')).not.toMatch(/capThanThu|cap_thu|capThu|petLevel|levelCuaThu/)
  })
})


describe('T06 — phục hồi sau ba lỗi: needs_teaching → practicing → recovered → stable', () => {
  it('ba lỗi độc lập, khác content_group, ≥2 family, trong 7 ngày ⇒ MỞ đợt needs_teaching', () => {
    const d = tinhDotDayLai('S1', baLoi('2026-09-10'))!
    expect(d.state).toBe('needs_teaching')
    expect(d.loiEventIds).toHaveLength(3)
    expect(d.contentGroupLoi).toEqual(['L1-S1', 'L2-S1', 'L3-S1'])
    expect(SO_FAMILY_LOI).toBe(2)
  })

  it('chỉ HAI lỗi ⇒ chưa mở; ba lỗi nhưng CÙNG một family ⇒ chưa mở', () => {
    expect(tinhDotDayLai('S1', baLoi('2026-09-10').slice(0, 2))).toBeNull()
    const cungFamily = baLoi('2026-09-10').map((e) => ({ ...e, familyId: 'f-only' }))
    expect(tinhDotDayLai('S1', cungFamily)).toBeNull()
  })

  it('lỗi rải quá 7 ngày ⇒ KHÔNG mở (ba lỗi phải trong 7 ngày)', () => {
    const [a, b, c] = baLoi('2026-09-10')
    const ds = [a!, b!, { ...c!, learningDay: '2026-09-25', receivedAt: Date.parse('2026-09-25T05:00:00.000Z') }]
    expect(tinhDotDayLai('S1', ds)).toBeNull()
    expect(CUA_SO_LOI_NGAY).toBe(7)
  })

  it('có lần TỰ LÀM ĐÚNG một biến thể MỚI ở giữa ba lỗi ⇒ KHÔNG mở đợt', () => {
    const [a, b, c] = baLoi('2026-09-10')
    const giua = ev({ qid: 'giua', cg: 'M-1', ngay: '2026-09-10', gio: '04:30:00.000', correct: true, fam: 'fC' })
    expect(tinhDotDayLai('S1', [a!, b!, giua, c!])).toBeNull()
  })

  it('đủ ba lỗi rồi có lần HƯỚNG DẪN (máy chủ cấp gợi ý) ⇒ practicing', () => {
    const ds = [...baLoi('2026-09-10'), ev({ qid: 'gd', cg: 'GD-1', ngay: '2026-09-10', gio: '06:00:00.000', correct: null, assistance: 'assisted', fam: 'fA-S1' })]
    expect(tinhDotDayLai('S1', ds)!.state).toBe('practicing')
  })

  it('tự làm đúng biến thể MỚI cách hướng dẫn ≥300 giây hoạt động ⇒ recovered (mở khoá xác nhận mức)', () => {
    const ds = [
      ...baLoi('2026-09-10'),
      ev({ qid: 'gd', cg: 'GD-1', ngay: '2026-09-10', gio: '06:00:00.000', correct: null, assistance: 'assisted' }),
      ev({ qid: 'b1', cg: 'B-1', ngay: '2026-09-10', gio: '07:00:00.000', correct: true, sec: 200 }),
      ev({ qid: 'b2', cg: 'B-2', ngay: '2026-09-10', gio: '08:00:00.000', correct: true, sec: 150 }),
    ]
    const d = tinhDotDayLai('S1', ds)!
    expect(d.giayCach).toBeGreaterThanOrEqual(GIAY_HOAT_DONG_PHUC_HOI)
    expect(d.state).toBe('recovered')
    expect(phatLaiNangLuc(ds, { denNgay: '2026-09-10' }).get('S1')!.skills[0]!.dotDangMo).toBeNull()
  })

  it('chưa đủ giãn (một nhiệm vụ khác, 100 giây) ⇒ VẪN practicing, không đánh dấu phục hồi', () => {
    const ds = [
      ...baLoi('2026-09-10'),
      ev({ qid: 'gd', cg: 'GD-1', ngay: '2026-09-10', gio: '06:00:00.000', correct: null, assistance: 'assisted' }),
      ev({ qid: 'b1', cg: 'B-1', ngay: '2026-09-10', gio: '07:00:00.000', correct: true, sec: 100 }),
      ev({ qid: 'v1', cg: 'V-1', ngay: '2026-09-10', gio: '08:00:00.000', correct: true, sec: 0 }),
    ]
    const d = tinhDotDayLai('S1', ds)!
    expect(d.state).toBe('practicing')
    expect(d.giayCach).toBeLessThan(GIAY_HOAT_DONG_PHUC_HOI)
  })

  it('stable CHỈ sau một lần độc lập đúng ở NGÀY KHÁC, cách recovered ≥24 giờ; cùng ngày ⇒ vẫn recovered', () => {
    const nen = [
      ...baLoi('2026-09-10'),
      ev({ qid: 'gd', cg: 'GD-1', ngay: '2026-09-10', gio: '06:00:00.000', correct: null, assistance: 'assisted' }),
      ev({ qid: 'b1', cg: 'B-1', ngay: '2026-09-10', gio: '07:00:00.000', correct: true, sec: 400 }),
    ]
    const cungNgay = [...nen, ev({ qid: 'ok-late', cg: 'OK-1', ngay: '2026-09-10', gio: '23:00:00.000', correct: true })]
    expect(tinhDotDayLai('S1', cungNgay)!.state).toBe('recovered')
    const d = tinhDotDayLai('S1', [...nen, ev({ qid: 'ok-sau', cg: 'OK-2', ngay: '2026-09-12', correct: true })])!
    expect(d.state).toBe('stable')
    expect(d.stableLuc! - d.phucHoiLuc!).toBeGreaterThanOrEqual(GIAY_CACH_STABLE)
  })

  it('lỗi CŨ không chặn học lại: sau recovered, chính ba lỗi cũ KHÔNG mở lại đợt', () => {
    const ds = [
      ...baLoi('2026-09-10'),
      ev({ qid: 'gd', cg: 'GD-1', ngay: '2026-09-10', gio: '06:00:00.000', correct: null, assistance: 'assisted' }),
      ev({ qid: 'b1', cg: 'B-1', ngay: '2026-09-10', gio: '07:00:00.000', correct: true, sec: 400 }),
      ev({ qid: 'lan-sai-moi', cg: 'X-1', ngay: '2026-09-11', correct: false, fam: 'fA-S1' }),
    ]
    const d = tinhDotDayLai('S1', ds)!
    expect(d.state).toBe('recovered')
    expect(d.loiEventIds).toHaveLength(3)
  })

  it('kỹ năng chỉ có bằng chứng `assisted` KHÔNG vào mẫu tăng bậc và KHÔNG là bằng chứng độc lập', () => {
    const ds = namFamily(1, 2).map((e) => ({ ...e, assistance: 'assisted' as const }))
    const s = kyNang(ds)
    expect(s.evidenceRefs).toHaveLength(0)
    expect(s.validatedLevel).toBeNull()
    expect(laDocLap({ ...ds[0]!, assistance: 'unknown' })).toBe(false)
    expect(CUA_SO_BANG_CHUNG_NGAY).toBe(30)
  })

  it('gộp tăng dần BẰNG phát lại đầy đủ (cùng tập sự kiện, thứ tự đầu vào đảo nhau)', () => {
    const ds = [...baLoi('2026-09-10'), ...namFamily(1, 2, SO_FAMILY_XAC_NHAN, '2026-09-11')]
    const tuy = { denNgay: '2026-09-11' }
    const anh = anhChupTuSuKien('S1', ds.slice(0, 3), tuy)
    const gop = gopTangDan(anh, ds.slice(3), tuy)
    const dayDu = phatLaiNangLuc([...ds].reverse(), tuy).get('S1')!
    expect({ ...gop.bang, revision: 0 }).toEqual({ ...dayDu, revision: 0 })
    expect(POLICY_VERSION).toBe('CNH-1.0')
  })
})

