// ĐỒNG BỘ KHO SANG MÁY HỌC SINH.
//
// Thầy 14/09: "Bạn phải đồng bộ sang máy học sinh. Sửa hoàn thành 100% đi nhé."
//
// NGUYÊN NHÂN GỐC: màn Khắc phục câu sai rút câu luyện thêm từ
// `loadExamSources()` — kho đề trong IndexedDB của CHÍNH MÁY. Kho ấy chỉ do
// `dongBoNganHang` nạp và hàm ấy đòi mã bí mật của thầy, nên máy em LUÔN rỗng
// ⇒ "Tỷ lệ tối đa: 0 câu".
//
// CÁCH SỬA: KHÔNG chép cả kho (157 tờ, 4,3 GB, có đáp án) xuống máy em. Máy chủ
// rút hộ qua lệnh học sinh `cauKhacPhuc`, máy em tự lọc theo mã dạng bằng đúng
// thuật toán đang chạy trên máy thầy.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const goiCauKhacPhuc = vi.fn()
vi.mock('../src/lib/exam-api', () => ({ cauKhacPhuc: (...a: unknown[]) => goiCauKhacPhuc(...a) }))
vi.mock('../src/lib/thiet-bi', () => ({ layIdThietBi: () => 'may-cua-em' }))

const { napKhoChoMayEm, SO_CAU_XIN_KHO } = await import('../src/lib/kho-cho-may-em')

/** Một tờ đề kho đúng định dạng máy chủ trả về (snake_case, có đáp án). */
const GOI_KHO = {
  ma_de: 'DH-11-C1-B1',
  cau: [
    {
      phan: 'I',
      so: 1,
      de: 'Yếu tố nào sau đây không làm chuyển dịch cân bằng?',
      dap_an: 'C',
      pa: { A: 'Nhiệt độ', B: 'Áp suất', C: 'Chất xúc tác', D: 'Nồng độ' },
      chuyen_de: 'Cân bằng hoá học',
      muc_do: 'hieu',
      dang: { ma: 'CAN_BANG.CAN_BANG.XAC_DINH_CHIEU', ten: 'Chuyển dịch cân bằng — xác định chiều' },
      loi_giai: {
        chot: 'Chất xúc tác làm cân bằng đến nhanh hơn nhưng không đổi vị trí cân bằng.',
        tung_pa: {
          A: { dung: false, vi_sao: 'Nhiệt độ đổi thì hằng số cân bằng đổi.' },
          B: { dung: false, vi_sao: 'Áp suất đổi khi hai vế khác số mol khí.' },
          C: { dung: true, vi_sao: 'Xúc tác chỉ giảm năng lượng hoạt hoá.' },
          D: { dung: false, vi_sao: 'Nồng độ đổi thì cân bằng dịch theo Le Chatelier.' },
        },
      },
    },
    {
      phan: 'III',
      so: 2,
      de: 'Có bao nhiêu biện pháp làm cân bằng chuyển dịch theo chiều thuận?',
      dap_an: '3',
      chuyen_de: 'Cân bằng hoá học',
      muc_do: 'van_dung',
      dang: { ma: 'CAN_BANG.CAN_BANG.XAC_DINH_CHIEU', ten: 'Chuyển dịch cân bằng — xác định chiều' },
      loi_giai: {
        chot: 'Phản ứng toả nhiệt và có 3 mol khí chuyển thành 2 mol khí.',
        buoc: ['Chiều thuận toả nhiệt và giảm số mol khí.', 'Tăng áp suất, hạ nhiệt độ, giảm nồng độ sản phẩm đều đẩy chiều thuận.', 'Vậy có 3 biện pháp.'],
        ket_qua: '3',
      },
    },
  ],
}

const CAU_SAI = [
  { qid: 'T6-I-1', chuyenDe: 'Cân bằng hoá học', maCa: '614232' },
  { qid: 'T6-I-2', chuyenDe: 'Cân bằng hoá học', maCa: '614232' },
]

beforeEach(() => goiCauKhacPhuc.mockReset())

describe('Máy em xin kho của máy chủ', () => {
  it('gửi đúng chuyên đề của câu sai và loại trừ đúng qid đã sai', async () => {
    goiCauKhacPhuc.mockResolvedValue({ nguon: [{ maDe: GOI_KHO.ma_de, json: GOI_KHO }], soCau: 2, soChon: 2, thuTu: [], catBotViNang: false })
    const kq = await napKhoChoMayEm('https://may-chu', '12109', CAU_SAI)

    expect(goiCauKhacPhuc).toHaveBeenCalledTimes(1)
    const [, maCa, sbd, idTb, chuyenDe, loaiTru, soCau] = goiCauKhacPhuc.mock.calls[0]
    expect(maCa).toBe('614232')
    expect(sbd).toBe('12109')
    expect(idTb).toBe('may-cua-em')
    expect(chuyenDe).toEqual(['Cân bằng hoá học'])
    expect(loaiTru).toEqual(['T6-I-1', 'T6-I-2'])
    expect(soCau).toBe(SO_CAU_XIN_KHO)
    expect(kq.loi).toBe('')
  })

  it('gói máy chủ trả về thành kho dùng được, GIỮ NGUYÊN mã dạng và lời giải', async () => {
    goiCauKhacPhuc.mockResolvedValue({ nguon: [{ maDe: GOI_KHO.ma_de, json: GOI_KHO }], soCau: 2, soChon: 2, thuTu: [], catBotViNang: false })
    const { nguon } = await napKhoChoMayEm('https://may-chu', '12109', CAU_SAI)

    expect(nguon).toHaveLength(1)
    const s = nguon[0]
    expect(s.maDe).toBe('DH-11-C1-B1')
    expect(s.phanI).toHaveLength(1)
    expect(s.phanIII).toHaveLength(1)

    // MÃ DẠNG phải sống sót — đây chính là thứ màn hình lọc "cùng nhãn dán".
    expect(s.phanI[0].dang?.ma).toBe('CAN_BANG.CAN_BANG.XAC_DINH_CHIEU')
    expect(s.phanIII[0].dang?.ma).toBe('CAN_BANG.CAN_BANG.XAC_DINH_CHIEU')
    // Đáp án và lời giải cũng phải sống sót, không thì luyện xong không dò được.
    expect(s.phanI[0].correct).toBe('C')
    expect(s.phanI[0].loiGiai?.tungPa?.C?.viSao).toContain('năng lượng hoạt hoá')
    expect(s.phanIII[0].correct).toBe('3')
    expect(s.phanIII[0].loiGiai?.buoc).toHaveLength(3)
  })

  it('câu sai không có chuyên đề thì nói thẳng, KHÔNG gọi máy chủ', async () => {
    const kq = await napKhoChoMayEm('https://may-chu', '12109', [{ qid: 'x' }])
    expect(goiCauKhacPhuc).not.toHaveBeenCalled()
    expect(kq.nguon).toHaveLength(0)
    expect(kq.loi).toContain('chưa gắn chuyên đề')
  })

  // Đường lỗi: máy chủ trả gói méo (mất mảng `nguon`). Không kiểm bằng cách cho
  // mock NÉM, vì vitest kê chính lượt ném ấy thành lỗi của bài kiểm dù hàm đã
  // bắt — đo cái vỏ chứ không đo cái ruột. Gói méo đi qua ĐÚNG khối try ấy.
  it('máy chủ trả gói méo thì báo lý do, không ném vỡ màn hình', async () => {
    goiCauKhacPhuc.mockResolvedValue({ soCau: 0 } as never)
    const kq = await napKhoChoMayEm('https://may-chu', '12109', CAU_SAI)
    expect(kq.nguon).toHaveLength(0)
    expect(kq.loi.length).toBeGreaterThan(0)
    expect(kq.chuyenDe).toEqual(['Cân bằng hoá học'])
  })

  it('kho máy chủ không có tờ nào hợp lệ thì nói rõ', async () => {
    goiCauKhacPhuc.mockResolvedValue({ nguon: [{ maDe: 'X', json: { ma_de: 'X', cau: [] } }], soCau: 0, soChon: 0, thuTu: [], catBotViNang: false })
    const kq = await napKhoChoMayEm('https://may-chu', '12109', CAU_SAI)
    expect(kq.nguon).toHaveLength(0)
    expect(kq.loi).toContain('chưa có tờ đề nào')
  })
})

describe('Modal khắc phục nối đúng đường', () => {
  const than = readFileSync(join(process.cwd(), 'src/components/ModalKhacPhucCauSai.tsx'), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')

  it('hết kho máy thì xin máy chủ, không bỏ cuộc', () => {
    expect(than).toContain('napKhoChoMayEm')
    expect(than).toContain('if (sources.length === 0 && dsCauSai.length > 0)')
  })

  it('khoá deps theo NỘI DUNG câu sai, không theo tham chiếu mảng', () => {
    expect(than).toContain('const khoaCauSai = useMemo(')
    expect(than).toContain('}, [isOpen, sbd, khoaCauSai])')
    expect(than).not.toContain('}, [isOpen, sbd, dsCauSai])')
  })

  it('đang xin kho thì nói ra, không hiện 0 câu rồi nhảy số', () => {
    expect(than).toContain('const [dangTaiKho, setDangTaiKho] = useState(false)')
    expect(than).toContain('Đang lấy câu cùng dạng từ máy chủ')
    expect(than).toContain('{!dangTaiKho && (loiRut || !coKhoDe) && (')
  })
})
