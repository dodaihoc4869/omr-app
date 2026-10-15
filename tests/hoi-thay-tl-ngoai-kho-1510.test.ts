// @vitest-environment node
// CÂU NGOÀI KHO (15/10/2026, đường /hoi-thay): trang bài làm văn phòng có câu không nằm trong kho đề app ⇒ văn phòng đẩy gói R2
// `kho/TL-<mã>.json` (khuôn gói kho, KHÔNG có dòng de_kho). Nút Hỏi thầy phải đọc được câu qua qid `TL-<mã>-<phần>-<số>` (đang làm: chỉ đề;
// đã nộp: lời giải chữ của gói), và câu TL- KHÔNG BAO GIỜ vào hàng soạn lời giải (loi_giai_viec) — không lẫn vào hàng duyệt của thầy.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'
import { ghiCauVaoHang, laGoiNgoaiKho } from '../server/src/loi-giai'

const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)

describe('Câu ngoài kho TL- (gói R2 kho/TL-<mã>.json)', () => {
  const MA_DE_TL = 'TL-DE-THU-1'
  const QID_TL_1 = `${MA_DE_TL}-I-1`
  const QID_TL_3 = `${MA_DE_TL}-I-3`

  const GOI_TL = {
    ma_de: MA_DE_TL,
    nguon: 'de_on_tap_ddh',
    cau: [
      {
        phan: 'I',
        so: 1,
        de: 'Chất nào sau đây là este no, đơn chức, mạch hở?',
        pa: {
          A: 'CH3COOCH3',
          B: 'CH2=CHCOOCH3',
          C: 'CH3COOH',
          D: 'HCOOCH=CH2',
        },
        dap_an: 'A',
        loi_giai: {
          buoc: ['Este no, đơn chức có CTTQ là CnH2nO2 (n >= 2).', 'CH3COOCH3 là metyl axetat, thuộc loại este no, đơn chức.'],
          chot: 'Đáp án đúng là A.',
          tung_pa: {
            A: { dung: true, vi_sao: 'Là este no, đơn chức.' },
            B: { dung: false, vi_sao: 'Có liên kết đôi C=C (không no).' },
            C: { dung: false, vi_sao: 'Là axit cacboxylic, không phải este.' },
            D: { dung: false, vi_sao: 'Có gốc vinyl không no.' },
          },
          dap_an_tu_giai: 'A',
        },
      },
      {
        phan: 'I',
        so: 3,
        de: 'Thuỷ phân etyl fomat trong môi trường axit sinh ra ancol nào?',
        pa: {
          A: 'Metanol',
          B: 'Etanol',
          C: 'Propanol',
          D: 'Glixerol',
        },
        dap_an: 'B',
        loi_giai: {
          buoc: ['HCOOC2H5 + H2O <-> HCOOH + C2H5OH.'],
          chot: 'C2H5OH là etanol.',
          dap_an_tu_giai: 'B',
        },
      },
    ],
  }

  it('chỉ mã đề bắt đầu TL- là gói ngoài kho (đề kho có nhãn -TL tự luận ở giữa thì không)', () => {
    expect(laGoiNgoaiKho(MA_DE_TL)).toBe(true)
    expect(laGoiNgoaiKho('12-C1-TL')).toBe(false)
    expect(laGoiNgoaiKho('DH-10-C2-B5')).toBe(false)
  })

  it('ghiCauVaoHang: gói TL- KHÔNG vào hàng loi_giai_viec; cùng gói dưới mã đề kho thường vẫn vào hàng (đối chứng)', async () => {
    const d = taoD1That()
    const r = await ghiCauVaoHang(d.env as any, MA_DE_TL, GOI_TL)
    expect(r.vaoHang).toBe(0)
    expect(d.dem('loi_giai_viec', `ma_de = '${MA_DE_TL}'`)).toBe(0)
    const thuong = await ghiCauVaoHang(d.env as any, '12-THU-1', { ...GOI_TL, ma_de: '12-THU-1' })
    expect(thuong.vaoHang).toBe(2)
    expect(d.dem('loi_giai_viec', "ma_de = '12-THU-1'")).toBe(2)
  })

  it('đọc câu TL- từ R2 qua hsHoiThay: chiHoi=true và chiHoi=false đều không vào loi_giai_viec', async () => {
    const d = taoD1That()
    // Giả lập R2 có gói kho/TL-DE-THU-1.json (không có trong de_kho)
    d.objects.set(`kho/${MA_DE_TL}.json`, JSON.stringify(GOI_TL))

    // Tạo học sinh và token
    d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('12001','Em Thử','12','mk123','x')").run()
    const token = await gameToken(d.env as any, '12001')

    // 1. Học sinh đang làm câu (chiHoi: true): chỉ lấy đề
    const rChiHoi = await em(d, '/hs/hoi-thay', { token, qid: QID_TL_3, nguon: 'trang_html', chiHoi: true })
    expect(rChiHoi).toMatchObject({
      ok: true,
      chiHoi: true,
      cau: {
        qid: QID_TL_3,
        nguon: MA_DE_TL,
      },
    })
    // Không đẩy vào loi_giai_viec
    expect(d.dem('loi_giai_viec', `qid = '${QID_TL_3}'`)).toBe(0)

    // 2. Học sinh đã làm xong (chiHoi: false): trả lời giải chữ của kho, không vào hàng soạn
    const rDaLam = await em(d, '/hs/hoi-thay', { token, qid: QID_TL_1, nguon: 'trang_html', chiHoi: false })
    expect(rDaLam).toMatchObject({
      ok: true,
      coLoiGiai: false,
      cau: {
        qid: QID_TL_1,
      },
      loiGiaiChu: {
        dapAn: 'A',
        chot: 'Đáp án đúng là A.',
      },
    })
    // loi_giai_viec vẫn không có câu TL-; sổ "em đã mở lời giải" có ghi (để em nhắn hỏi thêm Thầy được)
    expect(d.dem('loi_giai_viec', `qid = '${QID_TL_1}'`)).toBe(0)
    expect(d.dem('loi_giai_viec')).toBe(0)
    expect(d.dem('loi_giai_hoi', `qid = '${QID_TL_1}' AND sbd = '12001'`)).toBe(1)
    expect(d.dem('loi_giai_cau', `ma_de = '${MA_DE_TL}'`)).toBe(0)
  })
})
