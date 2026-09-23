// @vitest-environment node
// P05/T40 — MỤC TIÊU CORE của một plan ngày (02 §5.2 + §6): một mục tiêu duy nhất, điều kiện đạt KHOÁ lúc giao,
// không tăng ngầm; n=0 KHÔNG tự achieved; revision phải có lý do và không nâng điều kiện; carry-over không tự
// tăng core; nhánh family ghi rõ là CHƯA ÁP được (kho chưa có nhãn) chứ KHÔNG bịa family.
import { describe, expect, it } from 'vitest'
import {
  POLICY_MUC_TIEU, boTaskLoi, carryOver, chonRoleCore, danhGiaCore, doiDieuKienDat, dungMucTieuCore, minSuccessCua,
  type DauVaoMucTieu, type KetQuaTaskCore,
} from '../server/src/muc-tieu-core'

const nhap = (o: Partial<DauVaoMucTieu> = {}): DauVaoMucTieu => ({
  taskIds: ['T1', 'T2', 'T3', 'T4', 'T5'],
  coChangQuayLai: false,
  coBtvnDenHanDuNguon: false,
  coRepairDuNganSach: false,
  coCardDenHan: false,
  soDonViDocLap: 5,
  coNhanFamily: false,
  ...o,
})

describe('P05/T40 — mục tiêu core một plan/ngày', () => {
  it('chọn role ĐÚNG thứ tự §6: return → homework_slice → repair → maintenance → consolidation', () => {
    expect(chonRoleCore(nhap({ coChangQuayLai: true, coBtvnDenHanDuNguon: true, coCardDenHan: true }))).toBe('return')
    expect(chonRoleCore(nhap({ coBtvnDenHanDuNguon: true, coCardDenHan: true }))).toBe('homework_slice')
    expect(chonRoleCore(nhap({ coRepairDuNganSach: true, coCardDenHan: true }))).toBe('repair')
    expect(chonRoleCore(nhap({ coCardDenHan: true }))).toBe('maintenance')
    expect(chonRoleCore(nhap())).toBe('consolidation')
  })

  it('điều kiện đạt KHOÁ theo bảng §6: maintenance ceil(0,8n), consolidation ceil(0,6n), còn lại ≥1', () => {
    expect(minSuccessCua('maintenance', 5)).toBe(4)
    expect(minSuccessCua('maintenance', 4)).toBe(4)
    expect(minSuccessCua('consolidation', 5)).toBe(3)
    expect(minSuccessCua('repair', 7)).toBe(1)
    expect(minSuccessCua('homework_slice', 7)).toBe(1)
    expect(minSuccessCua('maintenance', 0)).toBe(0)
  })

  it('plan có ĐÚNG một mục tiêu core + policy version + revision; consolidation ghi rõ thiếu nhãn family', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true }))
    expect(mt.role).toBe('maintenance')
    expect(mt.n).toBe(5)
    expect(mt.minSuccess).toBe(4)
    expect(mt.policyVersion).toBe(POLICY_MUC_TIEU)
    expect(mt.revision).toBe(1)
    expect(mt.thieuNhanFamily).toBeUndefined() // maintenance không cần family
    expect(dungMucTieuCore(nhap()).thieuNhanFamily).toBe(true) // consolidation + kho chưa có nhãn
  })

  it('n=0 ⇒ NO_VALID_CORE_TASKS, KHÔNG tự achieved dù mọi task đều "nộp"', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true, soDonViDocLap: 0 }))
    const kq = danhGiaCore(mt, [{ taskId: 'T1', docLap: false, daNop: true, docLapDung: false }])
    expect(kq.trangThai).toBe('none')
    expect(kq.lyDo).toBe('NO_VALID_CORE_TASKS')
    expect(kq.coBangChungHoc).toBe(false)
  })

  it('maintenance: nộp đủ n + độc lập đúng ≥ ceil(0,8n) ⇒ achieved; thiếu 1 câu mà có học ⇒ studied', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true }))
    const kq = (dung: number): KetQuaTaskCore[] => ['T1', 'T2', 'T3', 'T4', 'T5'].map((id, i) => ({
      taskId: id, docLap: true, daNop: true, docLapDung: i < dung,
    }))
    expect(danhGiaCore(mt, kq(4)).trangThai).toBe('achieved')
    expect(danhGiaCore(mt, kq(3)).trangThai).toBe('studied')
    const thieuNop = kq(4).map((x, i) => (i === 4 ? { ...x, daNop: false } : x))
    expect(danhGiaCore(mt, thieuNop).trangThai).toBe('studied')
  })
})


describe('P05/T40 — mẫu số, trợ giúp, chờ xác minh', () => {
  it('bài mẫu/retry/probe/tranh chấp KHÔNG vào mẫu số (docLap=false), kể cả khi nộp đúng', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true, soDonViDocLap: 4 }))
    const kq: KetQuaTaskCore[] = [
      { taskId: 'T1', docLap: true, daNop: true, docLapDung: true },
      { taskId: 'T2', docLap: true, daNop: true, docLapDung: true },
      { taskId: 'T3', docLap: true, daNop: true, docLapDung: true },
      { taskId: 'T4', docLap: true, daNop: true, docLapDung: true },
      { taskId: 'T5', docLap: false, daNop: true, docLapDung: true }, // bài mẫu/probe
    ]
    const rg = danhGiaCore(mt, kq)
    expect(rg.n).toBe(4)
    expect(rg.dung).toBe(4)
    expect(rg.trangThai).toBe('achieved') // 4/4 ≥ ceil(0,8×4)=4
  })

  it('lần làm CÓ TRỢ GIÚP tính hoàn tất việc nhưng KHÔNG vào số độc lập đúng', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true, soDonViDocLap: 2 }))
    const rg = danhGiaCore(mt, [
      { taskId: 'T1', docLap: true, daNop: true, docLapDung: false, assisted: true },
      { taskId: 'T2', docLap: true, daNop: true, docLapDung: true },
    ])
    expect(rg.dung).toBe(1)
    expect(rg.trangThai).toBe('studied') // ceil(0,8×2)=2 > 1
  })

  it('mục ĐANG CHỜ GIÁO VIÊN XÁC MINH giữ nhãn riêng, không tự thành bằng chứng độc lập', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true, soDonViDocLap: 1 }))
    const rg = danhGiaCore(mt, [{ taskId: 'T1', docLap: true, daNop: true, docLapDung: false, choXacMinh: true }])
    expect(rg.choXacMinh).toBe(true)
    expect(rg.trangThai).toBe('studied') // đã nộp (hoàn tất việc) nhưng chưa có độc lập đúng
  })
})

describe('P05/T40 — revision có lý do, không tăng điều kiện; carry-over không tự tăng core', () => {
  it('loại câu lỗi ⇒ n mới = 0 ⇒ NO_VALID_CORE_TASKS (không cấp ngày miễn phí) và GIỮ quyền đã kiếm', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true, soDonViDocLap: 1, taskIds: ['T1'] }))
    const { mucTieu, giuQuyen } = boTaskLoi(mt, ['T1'], 'câu sai đề, thầy xác nhận')
    expect(mucTieu.n).toBe(0)
    expect(mucTieu.revision).toBe(2)
    expect(mucTieu.lyDoRevision).toBe('câu sai đề, thầy xác nhận')
    expect(mucTieu.daLoai).toEqual([{ taskId: 'T1', lyDo: 'câu sai đề, thầy xác nhận' }])
    expect(giuQuyen).toBe(true)
    const rg = danhGiaCore(mucTieu, [])
    expect(rg.trangThai).toBe('none')
    expect(rg.lyDo).toBe('NO_VALID_CORE_TASKS')
  })

  it('revision KHÔNG được đổi phần ĐÃ MỞ và KHÔNG được thiếu lý do', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true }))
    expect(boTaskLoi(mt, ['T1'], '', []).chanLyDo).toBe('THIEU_LY_DO')
    expect(boTaskLoi(mt, ['T1'], 'lỗi', ['T1']).chanLyDo).toBe('TASK_DA_MO')
  })

  it('revision KHÔNG bao giờ NÂNG điều kiện đạt (min_success không tăng)', () => {
    const mt = dungMucTieuCore(nhap({ coCardDenHan: true })) // n=5, min=4
    const sau = boTaskLoi(mt, ['T5'], 'câu sai đề').mucTieu // n=4 ⇒ ceil(0,8×4)=4
    expect(sau.minSuccess).toBeLessThanOrEqual(mt.minSuccess)
    expect(doiDieuKienDat(mt, sau)).toBe(false)
    expect(doiDieuKienDat(mt, { ...mt, minSuccess: 5 })).toBe(true)
  })

  it('carry-over: thay được task CHƯA MỞ cùng mục tiêu khi thời gian bằng/ít hơn; còn lại thành TUỲ CHỌN', () => {
    expect(carryOver({ taskId: 'C1', taskSeconds: 300, cungMucTieu: true }, { taskId: 'T3', taskSeconds: 300, daMo: false }).ketQua).toBe('thay_task')
    expect(carryOver({ taskId: 'C1', taskSeconds: 300, cungMucTieu: true }, { taskId: 'T3', taskSeconds: 600, daMo: false }).ketQua).toBe('thay_task')
    expect(carryOver({ taskId: 'C1', taskSeconds: 300, cungMucTieu: true }, { taskId: 'T3', taskSeconds: 120, daMo: false }).ketQua).toBe('tu_choi')
    expect(carryOver({ taskId: 'C1', taskSeconds: 300, cungMucTieu: true }, { taskId: 'T3', taskSeconds: 300, daMo: true }).ketQua).toBe('tu_choi')
    expect(carryOver({ taskId: 'C1', taskSeconds: 300, cungMucTieu: false }, { taskId: 'T3', taskSeconds: 300, daMo: false }).ketQua).toBe('tuy_chon')
    expect(carryOver({ taskId: 'C1', taskSeconds: 300, cungMucTieu: true }, null).ketQua).toBe('tuy_chon')
  })
})
