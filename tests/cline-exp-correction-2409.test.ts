// @vitest-environment node
// CNH-1.0 — SỬA ĐIỂM (correction) ĐÚNG MỘT LẦN — D1 THẬT (node:sqlite + đủ schema/migration của P07).
// Đặc tả 03 §1.3: correction_id liên kết event gốc + version chấm cũ/mới + lý do + tác giả; DỰNG LẠI trạng thái;
// THÊM KHOẢN BÙ DƯƠNG CÒN THIẾU ĐÚNG MỘT LẦN; KHÔNG thu hồi EXP/khiên đã tiêu; cùng correction chạy lại KHÔNG tạo hai khoản.
// Bộ này kiểm bằng D1 thật: retry cùng correction_id · hai yêu cầu đồng thời · correction KHÁC hợp lệ ·
// không cộng thưởng hai lần · ROLLBACK khi lỗi ghi · không thu hồi khi quyền mới nhỏ hơn đã trả.
import { describe, expect, it } from 'vitest'
import { serialiseD1, taoD1That, type D1That } from './_d1-that'
import {
  LENH_SUA_DIEM, LoiSuaDiem, PHIEN_BAN_CHINH_SACH, bamDanhTinhSuaDiem, bamYeuCauSuaDiem, suaDiemMotLan, type YeuCauSuaDiem,
} from '../server/src/cnh-exp-correction'

const SBD = 'S1'
const NGAY = '2026-09-22'
const THAM_CHIEU = { eventId: 'ev-1', oldGradeVersion: 'grade-1', newGradeVersion: 'grade-2', reason: 'Thầy chấm lại câu 3', teacherId: 'GV-01' }

/** Em có ví + ngày học đã ghi (dữ liệu TỔNG HỢP). `corePaid` = phần quyền core đã chốt trước đó. */
function dung(o: { raw?: number; achieved?: 0 | 1; corePaid?: number; compPaid?: number; wallet?: number; earned?: number } = {}): D1That {
  const d = taoD1That()
  d.sql.prepare('INSERT INTO cnh_exp_account (student_id, wallet_exp, earned_exp, revision) VALUES (?, ?, ?, 0)').run(SBD, o.wallet ?? 0, o.earned ?? 0)
  d.sql.prepare(
    'INSERT INTO cnh_exp_day (student_id, learning_day, policy_version, raw_core, achieved, core_paid, compensation_paid, revision) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
  ).run(SBD, NGAY, PHIEN_BAN_CHINH_SACH, o.raw ?? 50, o.achieved ?? 0, o.corePaid ?? 50, o.compPaid ?? 0)
  return d
}

async function yeuCau(o: { correctionId: string; rawCoreAfter: number; achievedAfter?: boolean; learningDay?: string; thamChieu?: Partial<typeof THAM_CHIEU>; hash?: string }): Promise<YeuCauSuaDiem> {
  const thamChieu = { ...THAM_CHIEU, ...(o.thamChieu ?? {}) }
  const rawCoreAfter = o.rawCoreAfter
  const achievedAfter = o.achievedAfter ?? false
  const learningDay = o.learningDay ?? NGAY
  const noiDung = { thamChieu, rawCoreAfter, achievedAfter }
  return { studentId: SBD, learningDay, correctionId: o.correctionId, thamChieu, rawCoreAfter, achievedAfter, requestHash: o.hash ?? (await bamYeuCauSuaDiem(noiDung)) }
}
/** Không chờ thật để test tất định/nhanh; uuid đếm để dễ đọc. */
let demUuid = 0
const phuThuoc = () => ({ uuid: () => `exec-${++demUuid}`, sleep: async () => {} })

const dem = (d: D1That, bang: string, where = '1=1') => (d.sql.prepare(`SELECT COUNT(*) AS n FROM ${bang} WHERE ${where}`).get() as { n: number }).n
const tongSoBu = (d: D1That) => Number((d.sql.prepare('SELECT COALESCE(SUM(amount), 0) AS s FROM cnh_exp_grant_ledger WHERE student_id = ?').get(SBD) as { s: number }).s)
const vi = (d: D1That) => d.sql.prepare('SELECT wallet_exp, earned_exp, revision FROM cnh_exp_account WHERE student_id = ?').get(SBD) as { wallet_exp: number; earned_exp: number; revision: number }
const ngayCua = (d: D1That) =>
  d.sql.prepare('SELECT raw_core, achieved, core_paid, compensation_paid, revision FROM cnh_exp_day WHERE student_id = ? AND learning_day = ?').get(SBD, NGAY) as {
    raw_core: number; achieved: number; core_paid: number; compensation_paid: number; revision: number
  }
const soLenh = (d: D1That) => dem(d, 'cnh_exp_command', `command_type = '${LENH_SUA_DIEM}'`)
/** Ảnh chụp trạng thái TIỀN để so trước/sau một thao tác. */
const chup = (d: D1That) => JSON.stringify({ vi: vi(d), ngay: ngayCua(d), so: soLenh(d), bu: tongSoBu(d), guard: dem(d, 'cnh_exp_guard') })


describe('SỬA ĐIỂM — bù dương còn thiếu đúng một lần (D1 thật)', () => {
  it('sửa hợp lệ ⇒ bù phần THIẾU; RETRY cùng correction_id trả receipt CŨ, không ghi thêm', async () => {
    const d = dung({ raw: 50, corePaid: 50 }) // đã chốt 50; thầy chấm lại ⇒ ngày đủ 77
    const yc = await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 })
    const a = await suaDiemMotLan(d.env, yc, phuThuoc())
    expect(a).toMatchObject({ commandType: LENH_SUA_DIEM, correctionId: 'corr-1', entitlement: 77, compensation: 27 })
    expect(a.thamChieu).toEqual(THAM_CHIEU) // lưu đủ event gốc + version cũ/mới + lý do + tác giả
    expect(vi(d)).toMatchObject({ wallet_exp: 27, earned_exp: 27 })
    expect(ngayCua(d)).toMatchObject({ raw_core: 77, compensation_paid: 27, core_paid: 50 })
    expect(soLenh(d)).toBe(1)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(1)

    d.sql.prepare('UPDATE cnh_exp_account SET wallet_exp = wallet_exp + 100 WHERE student_id = ?').run(SBD) // thao tác khác xen vào
    const truoc = chup(d)
    const b = await suaDiemMotLan(d.env, yc, phuThuoc())
    expect(b).toEqual(a) // receipt cũ NGUYÊN VẸN
    expect(chup(d)).toBe(truoc) // không cộng lại, không ghi thêm gì
  })

  it('HAI YÊU CẦU ĐỒNG THỜI cùng correction_id ⇒ đúng MỘT khoản bù', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    serialiseD1(d.env) // `batch` của D1 là giao dịch: xếp hàng để mô phỏng đúng ngữ nghĩa D1
    const yc = await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 })
    const [a, b] = await Promise.all([suaDiemMotLan(d.env, yc, phuThuoc()), suaDiemMotLan(d.env, yc, phuThuoc())])
    expect(a).toEqual(b)
    expect(soLenh(d)).toBe(1)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(1)
    expect(tongSoBu(d)).toBe(27)
    expect(vi(d).wallet_exp).toBe(27) // KHÔNG gấp đôi
    expect(ngayCua(d).compensation_paid).toBe(27)
  })

  it('CORRECTION KHÁC hợp lệ: lần hai đã đủ ⇒ bù 0; lần ba nâng tiếp ⇒ chỉ bù phần còn thiếu', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    const a = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 }), phuThuoc())
    expect(a.compensation).toBe(27)

    // Cùng giá trị đã sửa nhưng correction_id KHÁC (một lần sửa khác thật sự) ⇒ không thưởng thêm.
    const b = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-2', thamChieu: { eventId: 'ev-2', reason: 'Thầy rà lại lần hai' }, rawCoreAfter: 77 }), phuThuoc())
    expect(b).toMatchObject({ entitlement: 77, compensation: 0, compensationPaidAfter: 27 })
    expect(vi(d).wallet_exp).toBe(27)
    expect(soLenh(d)).toBe(2) // hai receipt khác khoá — nhưng tiền vẫn đúng MỘT lần

    // Nâng tiếp lên 100 ⇒ bù đúng 23 (phần còn thiếu), không trả lại toàn bộ.
    const c = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-3', thamChieu: { eventId: 'ev-3', reason: 'Bổ sung bước 2' }, rawCoreAfter: 100 }), phuThuoc())
    expect(c).toMatchObject({ entitlement: 100, compensation: 23 })
    expect(vi(d).wallet_exp).toBe(50)
    expect(ngayCua(d).compensation_paid).toBe(50)
    // Bất biến tiền: ví = tổng sổ bù; core_paid + bù = quyền đã chốt.
    expect(vi(d).wallet_exp).toBe(tongSoBu(d))
    expect(ngayCua(d).core_paid + ngayCua(d).compensation_paid).toBe(100)
  })

  it('KHÔNG thu hồi: quyền mới NHỎ hơn đã trả ⇒ bù 0, ví và core_paid KHÔNG đổi', async () => {
    const d = dung({ raw: 200, achieved: 1, corePaid: 220, wallet: 220, earned: 220 })
    const r = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-ha', thamChieu: { reason: 'Sửa xuống theo đáp án đúng' }, rawCoreAfter: 10, achievedAfter: false }), phuThuoc())
    expect(r).toMatchObject({ entitlement: 10, compensation: 0, walletAfter: 220, corePaidAfter: 220 })
    expect(vi(d)).toMatchObject({ wallet_exp: 220, earned_exp: 220 })
    expect(ngayCua(d)).toMatchObject({ core_paid: 220, compensation_paid: 0 })
    expect(tongSoBu(d)).toBe(0)
    expect(soLenh(d)).toBe(1) // có receipt để truy vết, nhưng KHÔNG có khoản âm nào
    expect(ngayCua(d).raw_core).toBe(10) // trạng thái ĐÃ dựng lại theo correction (không hoàn tác tiền)
  })
})

describe('SỬA ĐIỂM — chặn sai khoá/đầu vào, và ROLLBACK khi lỗi ghi (D1 thật)', () => {
  it('KEY MÂU THUẪN: cùng correction_id nhưng nội dung khác ⇒ IDEMPOTENCY_CONFLICT, không ghi gì', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 }), phuThuoc())
    const truoc = chup(d)
    const loi = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 90 }), phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi).toBeInstanceOf(LoiSuaDiem)
    expect(loi!.ma).toBe('IDEMPOTENCY_CONFLICT')
    expect(chup(d)).toBe(truoc)
  })

  it('REPLAY KHÁC NGÀY HỌC ⇒ IDEMPOTENCY_CONFLICT (không trả receipt ngày cũ)', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    const a = await yeuCau({ correctionId: 'corr-day', rawCoreAfter: 77 })
    await suaDiemMotLan(d.env, a, phuThuoc())
    // CÙNG correction_id + CÙNG băm cũ (danh tính cũ) nhưng NGÀY khác — đúng ca Boss bổ sung.
    const loi = await suaDiemMotLan(d.env, { ...a, learningDay: '2026-09-23' }, phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi).toBeInstanceOf(LoiSuaDiem)
    expect(loi!.ma).toBe('IDEMPOTENCY_CONFLICT')
    expect(vi(d).wallet_exp).toBe(27) // không cộng thêm, không ghi ngày mới
    expect(soLenh(d)).toBe(1)
  })

  it('CẠNH TRANH KHỎE: hai correction KHÁC ID, cùng tổng dựng lại ⇒ cả hai THÀNH CÔNG (không hóa CORRUPT_STATE)', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    serialiseD1(d.env)
    const a = await yeuCau({ correctionId: 'corr-a', rawCoreAfter: 77 })
    const b = await yeuCau({ correctionId: 'corr-b', rawCoreAfter: 77, thamChieu: { eventId: 'ev-2' } })
    const out = await Promise.allSettled([suaDiemMotLan(d.env, a, phuThuoc()), suaDiemMotLan(d.env, b, phuThuoc())])
    expect(out.map((x) => x.status)).toEqual(['fulfilled', 'fulfilled'])
    expect(vi(d).wallet_exp).toBe(27) // tổng đúng MỘT lần bù, không gấp đôi
    expect(tongSoBu(d)).toBe(27)
    expect(soLenh(d)).toBe(2) // hai receipt khác khoá
    expect(ngayCua(d).compensation_paid).toBe(27)
  })

  it('NGUỒN ĐỔI giữa đọc và ghi: nguồn lên 90 trong khi yêu cầu cũ khai 77 ⇒ TỪ CHỐI, KHÔNG ghi 77', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    // Nguồn chấm authoritative (bảng cục bộ của test — KHÔNG phải migration): event ev-1 ở revision r1 = 77.
    d.sql.exec('CREATE TABLE nguon_cham (event_id TEXT PRIMARY KEY, revision TEXT NOT NULL, raw_core INTEGER NOT NULL, achieved INTEGER NOT NULL)')
    d.sql.prepare("INSERT INTO nguon_cham (event_id, revision, raw_core, achieved) VALUES ('ev-1', 'r1', 77, 0)").run()
    let docLan = 0
    const docNguon = async () => {
      docLan += 1
      const r = d.sql.prepare("SELECT revision, raw_core, achieved FROM nguon_cham WHERE event_id = 'ev-1'").get() as { revision: string; raw_core: number; achieved: number }
      // ĐÚNG khe "giữa đọc và ghi": sau lần đọc ĐẦU, một writer khác chấm lại ⇒ nguồn lên r2 với tổng MỚI 90.
      if (docLan === 1) {
        d.sql.prepare("UPDATE nguon_cham SET revision = 'r2', raw_core = 90, achieved = 1 WHERE event_id = 'ev-1'").run()
      }
      return { revision: r.revision, rawCoreAfter: r.raw_core, achievedAfter: r.achieved === 1 }
    }
    // Yêu cầu CŨ: khai tổng 77 + precondition nguồn r1.
    const cu = { ...(await yeuCau({ correctionId: 'corr-cu', rawCoreAfter: 77 })), nguon: { revision: 'r1' } }
    const loi = await suaDiemMotLan(d.env, cu, { ...phuThuoc(), docNguon }).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi).toBeInstanceOf(LoiSuaDiem)
    expect(loi!.ma).toBe('RETRYABLE_CONFLICT') // nguồn đã đổi ⇒ buộc dựng lại, KHÔNG ghi
    expect(ngayCua(d).raw_core).toBe(50) // TUYỆT ĐỐI không ghi 77 đè lên đời sống mới
    expect(vi(d).wallet_exp).toBe(0)
    expect(soLenh(d)).toBe(0)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(0)

    // Dựng LẠI theo nguồn mới (r2/90) bằng correction_id MỚI ⇒ ghi đúng 90 (không phải 77), bù phần thiếu.
    const moi = { ...(await yeuCau({ correctionId: 'corr-moi', rawCoreAfter: 90, achievedAfter: true })), nguon: { revision: 'r2' } }
    const r = await suaDiemMotLan(d.env, moi, { ...phuThuoc(), docNguon })
    expect(r).toMatchObject({ nguonRevision: 'r2', nguonDaXacNhan: true, rawCoreGhi: 90, achievedGhi: true, entitlement: 220 })
    expect(ngayCua(d)).toMatchObject({ raw_core: 90, achieved: 1, core_paid: 50 })
    expect(vi(d).wallet_exp).toBe(r.compensation) // bù phần thiếu theo nguồn MỚI, không phải theo 77
    expect(ngayCua(d).core_paid + ngayCua(d).compensation_paid).toBe(220)
  })

  it('SỬA XUỐNG hợp lệ: nguồn mới NHỎ hơn đã trả ⇒ ghi xuống theo nguồn, bù 0 (KHÔNG dùng max(raw))', async () => {
    const d = dung({ raw: 200, achieved: 1, corePaid: 220, wallet: 220, earned: 220 })
    d.sql.exec('CREATE TABLE nguon_cham (event_id TEXT PRIMARY KEY, revision TEXT NOT NULL, raw_core INTEGER NOT NULL, achieved INTEGER NOT NULL)')
    d.sql.prepare("INSERT INTO nguon_cham (event_id, revision, raw_core, achieved) VALUES ('ev-1', 'r3', 40, 0)").run()
    const docNguon = async () => {
      const r = d.sql.prepare("SELECT revision, raw_core, achieved FROM nguon_cham WHERE event_id = 'ev-1'").get() as { revision: string; raw_core: number; achieved: number }
      return { revision: r.revision, rawCoreAfter: r.raw_core, achievedAfter: r.achieved === 1 }
    }
    const yc = { ...(await yeuCau({ correctionId: 'corr-xuong', rawCoreAfter: 40 })), nguon: { revision: 'r3' } }
    const r = await suaDiemMotLan(d.env, yc, { ...phuThuoc(), docNguon })
    expect(r).toMatchObject({ nguonRevision: 'r3', rawCoreGhi: 40, compensation: 0, walletAfter: 220 })
    expect(ngayCua(d)).toMatchObject({ raw_core: 40, achieved: 0, core_paid: 220 }) // ghi XUỐNG thật, không kẹp max
    expect(vi(d).wallet_exp).toBe(220) // không thu hồi EXP đã tiêu
  })

  it('THIẾU/KHÔNG ĐỌC ĐƯỢC NGUỒN ⇒ TỪ CHỐI; có precondition nguồn mà máy chủ chưa cấu hình đọc nguồn ⇒ TỪ CHỐI', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    const truoc = chup(d)
    // (a) có docNguon nhưng nguồn không đọc được
    const ycNguon = { ...(await yeuCau({ correctionId: 'corr-khong-nguon', rawCoreAfter: 77 })), nguon: { revision: 'r1' } }
    const a = await suaDiemMotLan(d.env, ycNguon, { ...phuThuoc(), docNguon: async () => null }).then(() => null, (e) => e as LoiSuaDiem)
    expect(a!.ma).toBe('NOT_FOUND')
    // (b) khai precondition nguồn nhưng máy chủ KHÔNG có docNguon ⇒ không tự nhận, từ chối
    const b = await suaDiemMotLan(d.env, ycNguon, phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(b!.ma).toBe('RETRYABLE_CONFLICT')
    // (c) precondition nguồn rỗng ⇒ đầu vào sai
    const c = await suaDiemMotLan(d.env, { ...ycNguon, nguon: { revision: '  ' } }, phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(c!.ma).toBe('INVALID_CORRECTION')
    expect(chup(d)).toBe(truoc) // cả ba đường đều KHÔNG ghi gì
  })

  it('BĂM ĐẦY ĐỦ: đổi BẤT KỲ thành phần danh tính nào cũng đổi băm (em/ngày/policy/id/revision nguồn/event/version/lý do/tác giả/giá trị)', async () => {
    const goc = await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 })
    const bam = async (x: Partial<YeuCauSuaDiem>) => bamDanhTinhSuaDiem({ ...goc, ...x } as YeuCauSuaDiem)
    const gocBam = await bam({})
    const khac: [string, Partial<YeuCauSuaDiem>][] = [
      ['studentId', { studentId: 'S2' }], ['learningDay', { learningDay: '2026-09-23' }], ['correctionId', { correctionId: 'corr-2' }],
      ['eventId', { thamChieu: { ...THAM_CHIEU, eventId: 'ev-9' } }], ['oldGradeVersion', { thamChieu: { ...THAM_CHIEU, oldGradeVersion: 'grade-0' } }],
      ['newGradeVersion', { thamChieu: { ...THAM_CHIEU, newGradeVersion: 'grade-3' } }], ['reason', { thamChieu: { ...THAM_CHIEU, reason: 'Lý do khác' } }],
      ['teacherId', { thamChieu: { ...THAM_CHIEU, teacherId: 'GV-02' } }], ['rawCoreAfter', { rawCoreAfter: 78 }], ['achievedAfter', { achievedAfter: true }],
    ]
    for (const [ten, doi] of khac) expect(await bam(doi), ten).not.toBe(gocBam)
    expect(await bam({})).toBe(gocBam) // cùng danh tính ⇒ cùng băm (tất định)
  })

  it('PRECONDITION REVISION: lượt đọc phải TRƯỚC một lượt ghi khác ⇒ thử lại, không ghi đè bằng tổng cũ', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    // Chèn MỘT lượt ghi khác ngay trước batch của ta (đúng khe giữa ĐỌC và GHI) ⇒ revision đọc được đã cũ.
    const that = d.env.DB.batch.bind(d.env.DB)
    let chenMotLan = true
    d.env.DB.batch = (async (ds: unknown) => {
      if (chenMotLan) {
        chenMotLan = false
        d.sql.prepare("UPDATE cnh_exp_day SET compensation_paid = compensation_paid + 27, raw_core = 77, revision = revision + 1 WHERE student_id = ? AND learning_day = ?").run(SBD, NGAY)
        d.sql.prepare('UPDATE cnh_exp_account SET wallet_exp = wallet_exp + 27, earned_exp = earned_exp + 27, revision = revision + 1 WHERE student_id = ?').run(SBD)
        // Sổ của lượt ghi kia (giữ bất biến ví = tổng sổ) — kỳ sổ `semantic_revision` của họ.
        d.sql.prepare("INSERT INTO cnh_exp_grant_ledger (grant_id, student_id, learning_day, policy_version, semantic_revision, amount, execution_id) VALUES ('khac', ?, ?, ?, 1, 27, 'exec-khac')").run(SBD, NGAY, PHIEN_BAN_CHINH_SACH)
      }
      return that(ds as never)
    }) as typeof d.env.DB.batch

    const r = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-stale', rawCoreAfter: 77 }), phuThuoc())
    expect(r.compensation).toBe(0) // lượt cũ KHÔNG trả lại 27 đã trả ở lượt kia
    expect(vi(d).wallet_exp).toBe(27) // tổng vẫn đúng MỘT lần
    expect(tongSoBu(d)).toBe(27)
    expect(ngayCua(d).compensation_paid).toBe(27)
    expect(soLenh(d)).toBe(1) // receipt của ta vẫn được ghi (đúng một lần) sau khi tính lại
  })

  it('BĂM Ở BIÊN: request_hash không khớp danh tính ⇒ INVALID_CORRECTION, chưa ghi gì', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    const truoc = chup(d)
    const saiBam = await yeuCau({ correctionId: 'corr-hash', rawCoreAfter: 77, hash: 'bam-khong-dung-noi-dung' })
    const loi = await suaDiemMotLan(d.env, saiBam, phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi).toBeInstanceOf(LoiSuaDiem)
    expect(loi!.ma).toBe('INVALID_CORRECTION')
    expect(chup(d)).toBe(truoc)
  })

  it('ĐẦU VÀO SAI: thiếu tác giả / version chấm cũ = mới / giá trị gốc sai ⇒ INVALID_CORRECTION, KHÔNG mở giao dịch', async () => {
    const d = dung()
    const truoc = chup(d)
    const thieuTacGia = await yeuCau({ correctionId: 'corr-x', rawCoreAfter: 77, thamChieu: { teacherId: '' } })
    const cungVersion = await yeuCau({ correctionId: 'corr-y', rawCoreAfter: 77, thamChieu: { oldGradeVersion: 'g', newGradeVersion: 'g' } })
    const giaTriSai = { ...(await yeuCau({ correctionId: 'corr-z', rawCoreAfter: 77 })), rawCoreAfter: 1.5 }
    for (const [yc, ten] of [[thieuTacGia, 'thiếu tác giả'], [cungVersion, 'cùng version'], [giaTriSai, 'giá trị lẻ']] as const) {
      const loi = await suaDiemMotLan(d.env, yc as YeuCauSuaDiem, phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
      expect(loi, ten).toBeInstanceOf(LoiSuaDiem)
      expect(loi!.ma, ten).toBe('INVALID_CORRECTION')
    }
    expect(chup(d)).toBe(truoc) // không dòng lệnh nào, không tiền nào đổi
  })

  it('THIẾU tài khoản/ngày (chưa dựng trạng thái) ⇒ NOT_FOUND, không ghi gì', async () => {
    const d = taoD1That() // không seed tài khoản/ngày
    const loi = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 }), phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi!.ma).toBe('NOT_FOUND')
    expect(dem(d, 'cnh_exp_command')).toBe(0)
    expect(dem(d, 'cnh_exp_grant_ledger')).toBe(0)
    expect(dem(d, 'cnh_exp_guard')).toBe(0)
  })

  it('ROLLBACK: bất biến sai ⇒ ném lỗi và KHÔNG còn receipt/ khoản nào (không có "thành công giả")', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    // Kỳ sổ (em, ngày, policy, semantic_revision = 1) đã bị một lệnh KHÁC chiếm ⇒ khoản bù của ta không thể vào sổ.
    d.sql.prepare(
      "INSERT INTO cnh_exp_grant_ledger (grant_id, student_id, learning_day, policy_version, semantic_revision, amount, execution_id) VALUES ('khac', ?, ?, ?, 1, 5, 'exec-khac')",
    ).run(SBD, NGAY, PHIEN_BAN_CHINH_SACH)
    const truoc = chup(d)
    const loi = await suaDiemMotLan(d.env, await yeuCau({ correctionId: 'corr-1', rawCoreAfter: 77 }), phuThuoc()).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi).toBeInstanceOf(LoiSuaDiem)
    expect(loi!.ma).toBe('CORRUPT_STATE') // bất biến không đạt ⇒ rollback, KHÔNG thử lại mù
    expect(chup(d)).toBe(truoc) // ví/ngày/receipt/guard nguyên trạng
    expect(dem(d, 'cnh_exp_command')).toBe(0) // claim đã bị rollback theo batch
    expect(dem(d, 'cnh_exp_guard')).toBe(0)
  })
})

describe('KHOÁ NGUỒN TRONG-BATCH — đóng khe đọc-nguồn → ghi (Lát 2, §4.9)', () => {
  const taoNguon = (d: D1That, revision: string, raw: number, achieved: 0 | 1): void => {
    d.sql.exec(
      'CREATE TABLE IF NOT EXISTS nguon_cham (event_id TEXT PRIMARY KEY, revision TEXT NOT NULL, raw_core INTEGER NOT NULL, achieved INTEGER NOT NULL)',
    )
    d.sql
      .prepare('INSERT OR REPLACE INTO nguon_cham (event_id, revision, raw_core, achieved) VALUES (?, ?, ?, ?)')
      .run('ev-1', revision, raw, achieved)
  }
  const kiem = (revision: string) => ({
    sql: 'EXISTS (SELECT 1 FROM nguon_cham WHERE event_id = ? AND revision = ?)',
    bind: ['ev-1', revision] as const,
  })
  /** `docNguon` đổi nguồn ĐÚNG ở lần gọi thứ 2 (= bước xác nhận lại NGOÀI giao dịch) để tạo khe. */
  const docNguonTaoKhe = (d: D1That) => {
    let lan = 0
    return async () => {
      lan++
      const r = d.sql.prepare("SELECT revision, raw_core, achieved FROM nguon_cham WHERE event_id = 'ev-1'").get() as {
        revision: string; raw_core: number; achieved: number
      }
      if (lan === 2) {
        d.sql.prepare("UPDATE nguon_cham SET revision = 'r2', raw_core = 90, achieved = 1 WHERE event_id = 'ev-1'").run()
      }
      return { revision: r.revision, rawCoreAfter: r.raw_core, achievedAfter: r.achieved === 1 }
    }
  }

  it('nguồn đổi ĐÚNG SAU bước xác nhận lại (ngoài giao dịch) ⇒ claim 0 dòng, KHÔNG ghi gì', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    taoNguon(d, 'r1', 77, 0)
    const truoc = chup(d)
    const yc = { ...(await yeuCau({ correctionId: 'corr-khe', rawCoreAfter: 77 })), nguon: { revision: 'r1' } }
    const loi = await suaDiemMotLan(d.env, yc, { ...phuThuoc(), docNguon: docNguonTaoKhe(d), nguonKiemTra: kiem('r1') }).then(
      () => null,
      (e) => e as LoiSuaDiem,
    )
    expect(loi?.ma).toBe('RETRYABLE_CONFLICT') // nguồn đã đổi ⇒ buộc dựng lại, KHÔNG ghi tổng cũ
    expect(chup(d)).toBe(truoc) // ví/ngày/ledger/guard NGUYÊN TRẠNG
    expect(dem(d, 'cnh_exp_command')).toBe(0)
  })

  it('ĐỐI CHỨNG: KHÔNG khoá trong-batch ⇒ cùng kịch bản VẪN ghi bằng tổng CŨ (chứng minh khoá mới là thứ bịt khe)', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    taoNguon(d, 'r1', 77, 0)
    const yc = { ...(await yeuCau({ correctionId: 'corr-khe2', rawCoreAfter: 77 })), nguon: { revision: 'r1' } }
    const r = await suaDiemMotLan(d.env, yc, { ...phuThuoc(), docNguon: docNguonTaoKhe(d) })
    expect(r.compensation).toBe(27) // đã ghi 77 (r1) dù bảng nguồn đã là r2 ⇒ đây CHÍNH LÀ khe
    expect(vi(d).wallet_exp).toBe(27)
  })

  it('có khoá trong-batch mà THIẾU `docNguon` ⇒ INVALID_CORRECTION, chưa mở giao dịch', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    const truoc = chup(d)
    const yc = { ...(await yeuCau({ correctionId: 'corr-thieu', rawCoreAfter: 77 })), nguon: { revision: 'r1' } }
    const loi = await suaDiemMotLan(d.env, yc, { ...phuThuoc(), nguonKiemTra: kiem('r1') }).then(() => null, (e) => e as LoiSuaDiem)
    expect(loi?.ma).toBe('INVALID_CORRECTION')
    expect(chup(d)).toBe(truoc)
  })

  it('khoá trong-batch ĐÚNG revision ⇒ ghi bình thường (không chặn oan)', async () => {
    const d = dung({ raw: 50, corePaid: 50 })
    taoNguon(d, 'r1', 77, 0)
    const docNguon = async () => {
      const r = d.sql.prepare("SELECT revision, raw_core, achieved FROM nguon_cham WHERE event_id = 'ev-1'").get() as {
        revision: string; raw_core: number; achieved: number
      }
      return { revision: r.revision, rawCoreAfter: r.raw_core, achievedAfter: r.achieved === 1 }
    }
    const yc = { ...(await yeuCau({ correctionId: 'corr-ok', rawCoreAfter: 77 })), nguon: { revision: 'r1' } }
    const r = await suaDiemMotLan(d.env, yc, { ...phuThuoc(), docNguon, nguonKiemTra: kiem('r1') })
    expect(r).toMatchObject({ compensation: 27, rawCoreGhi: 77, nguonRevision: 'r1', nguonDaXacNhan: true })
    expect(vi(d).wallet_exp).toBe(27)
  })
})

