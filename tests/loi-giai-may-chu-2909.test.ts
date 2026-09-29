// @vitest-environment node
// Lời giải từng bước — máy chủ (server/src/loi-giai.ts): móc nạp đề → hàng việc → máy soạn nhận lô / nộp → máy chủ kiểm lại 6 khoá
// → thầy duyệt theo đề → học sinh xem qua cổng công bố. Câu thật: mẫu kho docs/ra-soat-hien-thi-de-2809, hồ sơ thật đợt 2.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import worker from '../server/src/index'
import { gameToken } from '../server/src/game-v2-auth'
import { goiWorker, taoD1That, type D1That } from './_d1-that'

const GOC = path.resolve(__dirname, '..')
const MAU = JSON.parse(fs.readFileSync(path.join(GOC, 'docs/ra-soat-hien-thi-de-2809/sao-luu-truoc-sua.json'), 'utf8')) as Record<string, { cau: Record<string, unknown> }>
const RA2 = path.join(GOC, 'docs/loi-giai-a/chay-thu-2/ra')

const Q_TN = '12-KT-C1-D4-I-6'
const Q_DS = '12-KT-C1-D4-II-4'
const Q_TLN = '12-KT-C1-D2-III-6'
/** Gói đề kiểu kho: câu lấy nguyên từ mẫu thật, đổi `so` để khớp qid mới trong đề thử. */
const cauThat = (qid: string, so: number) => ({ ...MAU[qid].cau, so })
const GOI_A = { cau: [cauThat(Q_TN, 6), cauThat(Q_DS, 4), cauThat(Q_TLN, 6), { phan: 'IV', so: 1, de: 'Tự luận: trình bày…' }] }
const DE_A = '12-THU-A'
const QA = { tn: `${DE_A}-I-6`, ds: `${DE_A}-II-4`, tln: `${DE_A}-III-6` }

const thay = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b, true)
const em = (d: D1That, duong: string, b: Record<string, unknown>) => goiWorker(worker, d.env, duong, b)

function hoSoTu(tep: string, qid: string, bam: string) {
  const h = JSON.parse(fs.readFileSync(path.join(RA2, tep), 'utf8'))
  const { canThayChot, de: _de, ...r } = h
  void _de
  return { ...r, qid, bam, co: (canThayChot as string[]).map((ghi) => ({ loai: 'dapAn', ghi })) }
}
async function napDe(d: D1That, maDe: string, goi: unknown) {
  return thay(d, '/kho/day', { maDe, lop: '12', de: goi, cau: [] })
}
function hocSinh(d: D1That, sbd: string) {
  d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES(?,?,'12','mk','x')").run(sbd, 'Em ' + sbd)
}
function caCongBo(d: D1That, maCa: string, congBo: string, sbd: string, qid: string) {
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,cong_bo,cap_nhat_luc) VALUES(?,?,'dong','thi','12',?,'x')").run(maCa, 'Ca ' + maCa, congBo)
  d.sql.prepare("INSERT INTO chi_tiet_cau(khoa,ma_ca,sbd,phan,so_cau,qid,cap_nhat_luc) VALUES(?,?,?,?,?,?,'x')").run(`${maCa}|${sbd}|${qid}`, maCa, sbd, 'II', 4, qid)
}

describe('móc nạp đề → hàng việc', () => {
  it('nạp đề: 3 câu vào hàng, bỏ tự luận; nạp đề khác có câu trùng ⇒ không xếp lại', async () => {
    const d = taoD1That()
    const r = await napDe(d, DE_A, GOI_A)
    expect(r).toMatchObject({ ok: true, loiGiai: { soCau: 3, vaoHang: 3 } })
    expect(d.dem('loi_giai_cau')).toBe(3)
    expect(d.dem('loi_giai_viec', "trang_thai='cho' AND bo='ESTER' AND lop='12'")).toBe(3)
    const r2 = await napDe(d, '12-THU-B', { cau: [cauThat(Q_DS, 1)] })
    expect(r2).toMatchObject({ loiGiai: { soCau: 1, vaoHang: 0 } })
    expect(d.dem('loi_giai_viec')).toBe(3)
    expect(d.dem('loi_giai_cau')).toBe(4)
  })
  it('lấp kho cũ qua /kho/loi-giai/nap-hang, phân trang', async () => {
    const d = taoD1That()
    d.sql.prepare("INSERT INTO de_kho (ma_de, ten_de, lop, chuyen_de, so_cau, r2_khoa, da_xoa, cap_nhat_luc) VALUES (?, 'x', '12', '', 3, ?, 0, 'x')").run(DE_A, `kho/${DE_A}.json`)
    d.objects.set(`kho/${DE_A}.json`, JSON.stringify(GOI_A))
    const r = await thay(d, '/kho/loi-giai/nap-hang', { tu: 0, so: 8 })
    expect(r).toMatchObject({ ok: true, daQuet: [DE_A], soCau: 3, vaoHang: 3, tiep: null })
  })
  it('lệnh máy soạn / duyệt cần mã bí mật của thầy', async () => {
    const d = taoD1That()
    for (const duong of ['/kho/loi-giai/viec', '/kho/loi-giai/nop', '/gv/loi-giai/duyet', '/gv/loi-giai/cho-duyet']) {
      expect(await em(d, duong, {})).toMatchObject({ ok: false, error: 'Sai mã bí mật' })
    }
  })
})

describe('máy soạn nhận lô + nộp; máy chủ kiểm lại', () => {
  it('nhận lô cùng chương, không nhận trùng; nộp đúng ⇒ chờ duyệt; nộp sai đáp án ⇒ trả về hàng', async () => {
    const d = taoD1That()
    await napDe(d, DE_A, GOI_A)
    const [l1, l2] = await Promise.all([thay(d, '/kho/loi-giai/viec', { so: 2, lop: '12' }), thay(d, '/kho/loi-giai/viec', { so: 2, lop: '12' })])
    const nhan = [...(l1.viec as { qid: string }[]), ...(l2.viec as { qid: string }[])].map((v) => v.qid).sort()
    expect(nhan).toEqual([QA.tn, QA.ds, QA.tln].sort())
    expect(l1.bo ?? l2.bo).toMatchObject({ ma: 'ESTER' })
    expect(await thay(d, '/kho/loi-giai/viec', { so: 5 })).toMatchObject({ ok: true, het: true })

    const viec = Object.fromEntries([...(l1.viec as { qid: string; bam: string }[]), ...(l2.viec as { qid: string; bam: string }[])].map((v) => [v.qid, v]))
    const vds = viec[QA.ds] as { bam: string; de: string; y: unknown[]; dapAn: Record<string, string> }
    expect(vds.de).toContain('<p>')
    expect(vds.y).toHaveLength(4)

    // Nộp sai đáp án một ý ⇒ máy chủ bắt dù máy soạn "tự kiểm" đã qua
    const sai = hoSoTu('04-12-KT-C1-D4-II-4.json', QA.ds, vds.bam)
    sai.y[0].d = sai.y[0].d === 'D' ? 'S' : 'D'
    const rSai = await thay(d, '/kho/loi-giai/nop', { qid: QA.ds, bam: vds.bam, hoSo: sai })
    expect(rSai.ok).toBe(false)
    expect((rSai.loi as string[]).some((l) => l.startsWith('KHOÁ ĐÁP ÁN'))).toBe(true)
    expect(d.dem('loi_giai_viec', `bam='${vds.bam}' AND trang_thai='cho'`)).toBe(1)

    for (const [q, tep] of [[QA.tn, '02-12-KT-C1-D4-I-6.json'], [QA.ds, '04-12-KT-C1-D4-II-4.json'], [QA.tln, '06-12-KT-C1-D2-III-6.json']]) {
      const v = viec[q] as { bam: string }
      const r = await thay(d, '/kho/loi-giai/nop', { qid: q, bam: v.bam, hoSo: hoSoTu(tep, q, v.bam) })
      expect(r, q).toMatchObject({ ok: true })
      const luu = JSON.parse(d.objects.get(`giai/${v.bam}.json`) as string)
      expect(luu.de).toBeUndefined()
      expect(luu.khuon).toBe('1.2')
    }
    expect(d.dem('loi_giai', "trang_thai='cho_duyet'")).toBe(3)
    expect(d.dem('loi_giai_viec', "trang_thai='xong'")).toBe(3)
  })
  it('nộp băm cũ sau khi thầy sửa đề ⇒ từ chối; đề sửa xếp băm mới vào hàng', async () => {
    const d = taoD1That()
    await napDe(d, DE_A, GOI_A)
    const cu = d.sql.prepare('SELECT bam FROM loi_giai_cau WHERE qid=?').get(QA.ds) as { bam: string }
    const sua = { cau: GOI_A.cau.map((c) => (c.so === 4 && c.phan === 'II' ? { ...c, de: String(c.de) + ' (đã sửa)' } : c)) }
    expect(await napDe(d, DE_A, sua)).toMatchObject({ loiGiai: { vaoHang: 1 } })
    const r = await thay(d, '/kho/loi-giai/nop', { qid: QA.ds, bam: cu.bam, hoSo: hoSoTu('04-12-KT-C1-D4-II-4.json', QA.ds, cu.bam) })
    expect(r).toMatchObject({ ok: false, loi: ['KHOÁ VÂN TAY'] })
  })
})

describe('thầy duyệt theo đề + học sinh xem qua cổng công bố', () => {
  async function chuanBi() {
    const d = taoD1That()
    await napDe(d, DE_A, GOI_A)
    const l = await thay(d, '/kho/loi-giai/viec', { so: 5 })
    for (const v of l.viec as { qid: string; bam: string }[]) {
      const tep = v.qid === QA.tn ? '02-12-KT-C1-D4-I-6.json' : v.qid === QA.ds ? '04-12-KT-C1-D4-II-4.json' : '06-12-KT-C1-D2-III-6.json'
      const h = hoSoTu(tep, v.qid, v.bam)
      if (v.qid === QA.tln) h.co = [...h.co, { loai: 'dapAn', ghi: 'thử cờ' }]
      if (v.qid !== QA.tln) h.co = []
      expect(await thay(d, '/kho/loi-giai/nop', { qid: v.qid, bam: v.bam, hoSo: h })).toMatchObject({ ok: true })
    }
    hocSinh(d, 'E1')
    return { d, token: await gameToken(d.env, 'E1') }
  }

  it('màn chờ duyệt: đủ câu theo thứ tự, đếm câu sạch; duyệt cả lô chỉ duyệt câu sạch', async () => {
    const { d } = await chuanBi()
    const r = await thay(d, '/gv/loi-giai/cho-duyet', { maDe: DE_A })
    expect((r.cau as { qid: string }[]).map((c) => c.qid)).toEqual([QA.tn, QA.ds, QA.tln])
    expect(r.tong).toMatchObject({ cau: 3, choDuyet: 3, sach: 2, daDuyet: 0 })
    expect(await thay(d, '/gv/loi-giai/duyet', { quyet: 'duyet', maDe: DE_A, caLoSach: true })).toMatchObject({ ok: true, soCau: 2 })
    const r2 = await thay(d, '/gv/loi-giai/cho-duyet', { maDe: DE_A })
    expect(r2.tong).toMatchObject({ daDuyet: 2, choDuyet: 1 })
    const x = await thay(d, '/gv/loi-giai/xem', { qid: QA.tln })
    expect(x).toMatchObject({ ok: true, cau: { qid: QA.tln } })
  })

  it('học sinh: ca chưa công bố ⇒ chặn; công bố ⇒ có (hồ sơ sạch không cần chờ duyệt); còn cờ đáp án ⇒ không có', async () => {
    const { d, token } = await chuanBi()
    caCongBo(d, 'CA-KHONG', 'khong', 'E1', QA.ds)
    expect(await em(d, '/hs/loi-giai', { token, qid: QA.ds })).toMatchObject({ ok: false })
    caCongBo(d, 'CA-NGAY', 'ngay', 'E1', QA.ds)
    caCongBo(d, 'CA-NGAY-2', 'ngay', 'E1', QA.tln)
    // Thầy giao máy tự chốt (29/09): hồ sơ SẠCH đang chờ duyệt đã xem được; hồ sơ còn cờ đáp án thì không.
    expect(await em(d, '/hs/loi-giai', { token, qid: QA.ds })).toMatchObject({ ok: true, coLoiGiai: true })
    expect(await em(d, '/hs/loi-giai', { token, qid: QA.tln })).toMatchObject({ ok: true, coLoiGiai: false })
    await thay(d, '/gv/loi-giai/duyet', { quyet: 'duyet', maDe: DE_A, caLoSach: true })
    const r = await em(d, '/hs/loi-giai', { token, qid: QA.ds })
    expect(r).toMatchObject({ ok: true, coLoiGiai: true, cau: { qid: QA.ds } })
    expect((r.cau as { de: string }).de).toContain('<p>')
    expect(Object.keys((r.cau as { y: object }).y)).toEqual(['a', 'b', 'c', 'd'])
    expect((r.hoSo as { y: { t?: string }[] }).y[0].t).toBeUndefined()
    expect(await em(d, '/hs/loi-giai/co', { token, qids: [QA.ds, QA.tln, QA.tn] })).toMatchObject({ ok: true, qids: expect.arrayContaining([QA.ds, QA.tn]) })
    expect(((await em(d, '/hs/loi-giai/co', { token, qids: [QA.tln] })).qids as string[])).toEqual([])
  })

  it('học sinh: sự kiện làm bài trong ca thi KHÔNG mở được; tự làm ở chỗ luyện thì mở', async () => {
    const { d, token } = await chuanBi()
    await thay(d, '/gv/loi-giai/duyet', { quyet: 'duyet', maDe: DE_A, caLoSach: true })
    const skh = (nguon: string) => d.sql.prepare("INSERT INTO su_kien_hoc(khoa,sbd,qid,nguon,ma_nguon,luc,ngay_vn) VALUES(?,?,?,?,?,'x','x')").run(`${nguon}|E1|${QA.tn}`, 'E1', QA.tn, nguon, 'M')
    skh('thi')
    expect(await em(d, '/hs/loi-giai', { token, qid: QA.tn })).toMatchObject({ ok: false })
    skh('on_lai')
    expect(await em(d, '/hs/loi-giai', { token, qid: QA.tn })).toMatchObject({ ok: true, coLoiGiai: true })
  })

  it('không có token hợp lệ ⇒ không xem được', async () => {
    const { d } = await chuanBi()
    const r = await em(d, '/hs/loi-giai', { token: 'gia.mao', qid: QA.ds })
    expect(r.ok).not.toBe(true)
    expect(r.hoSo).toBeUndefined()
  })

  it('thầy sửa đề sau khi duyệt ⇒ hồ sơ cũ tự tắt với học sinh', async () => {
    const { d, token } = await chuanBi()
    caCongBo(d, 'CA-NGAY', 'ngay', 'E1', QA.ds)
    await thay(d, '/gv/loi-giai/duyet', { quyet: 'duyet', maDe: DE_A, caLoSach: true })
    const sua = { cau: GOI_A.cau.map((c) => (c.so === 4 && c.phan === 'II' ? { ...c, de: String(c.de) + ' (đã sửa)' } : c)) }
    await napDe(d, DE_A, sua)
    expect(await em(d, '/hs/loi-giai', { token, qid: QA.ds })).toMatchObject({ ok: true, coLoiGiai: false })
  })

  it('trả lại ⇒ ẩn với học sinh, câu vào lại đầu hàng kèm ghi chú của thầy', async () => {
    const { d } = await chuanBi()
    const bam = (d.sql.prepare('SELECT bam FROM loi_giai_cau WHERE qid=?').get(QA.tln) as { bam: string }).bam
    expect(await thay(d, '/gv/loi-giai/duyet', { quyet: 'tra_lai', bam: [bam], ghiChu: 'Bước 2 thiếu hiệu suất' })).toMatchObject({ ok: true, soCau: 1 })
    const l = await thay(d, '/kho/loi-giai/viec', { so: 5 })
    expect(l.viec).toEqual([expect.objectContaining({ qid: QA.tln, ghiChuThay: 'Thầy trả lại: Bước 2 thiếu hiệu suất' })])
  })
})

describe('nút Hỏi thầy (/hs/hoi-thay) — mọi câu luyện tập, trừ lúc kiểm tra', () => {
  const H = 3_600_000
  const iso = (gio: number) => new Date(Date.now() + gio * H).toISOString()
  async function coDe() {
    const d = taoD1That()
    await napDe(d, DE_A, GOI_A)
    hocSinh(d, 'E1')
    return { d, token: await gameToken(d.env, 'E1') }
  }
  async function nop(d: D1That, qid: string, tep: string, co: unknown[] = []) {
    const bam = (d.sql.prepare('SELECT bam FROM loi_giai_cau WHERE qid=?').get(qid) as { bam: string }).bam
    const h = { ...hoSoTu(tep, qid, bam), co }
    expect(await thay(d, '/kho/loi-giai/nop', { qid, bam, hoSo: h })).toMatchObject({ ok: true })
    return bam
  }

  it('chưa có hồ sơ ⇒ hiện lời giải chữ của kho + đáp án, ghi lượt hỏi, câu lên đầu hàng soạn', async () => {
    const { d, token } = await coDe()
    const r = await em(d, '/hs/hoi-thay', { token, qid: QA.ds, nguon: 'on_lai' })
    expect(r).toMatchObject({ ok: true, coLoiGiai: false, cau: { qid: QA.ds }, loiGiaiChu: { dapAn: expect.stringMatching(/^[DS]{4}$/) } })
    expect(d.dem('loi_giai_hoi', `sbd='E1' AND qid='${QA.ds}' AND nguon='on_lai' AND co_ho_so=0`)).toBe(1)
    expect(d.dem('loi_giai_viec', `qid='${QA.ds}' AND uu_tien >= 3000`)).toBe(1)
  })

  it('hồ sơ SẠCH (máy đã chốt, chưa cần thầy duyệt) ⇒ hiện ngay; còn cờ đáp án ⇒ chỉ lời giải chữ', async () => {
    const { d, token } = await coDe()
    await nop(d, QA.ds, '04-12-KT-C1-D4-II-4.json')
    await nop(d, QA.tln, '06-12-KT-C1-D2-III-6.json', [{ loai: 'dapAn', ghi: 'đáp án kho sai', chot: 'Đáp án đúng là 7' }])
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.ds })).toMatchObject({ ok: true, coLoiGiai: true, hoSo: { qid: QA.ds }, cau: { qid: QA.ds } })
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.tln })).toMatchObject({ ok: true, coLoiGiai: false })
    // câu game mang hậu tố lượt lặp "#2" vẫn đúng câu
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.ds + '#2' })).toMatchObject({ ok: true, coLoiGiai: true })
  })

  it('em đang có ca kiểm tra mở ⇒ khoá mọi câu', async () => {
    const { d, token } = await coDe()
    d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,het_han_vao,thoi_gian_phut,pham_vi,danh_sach_chon_json,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run('CA-MO', 'Ca mở', 'mo', 'thi', '12', iso(-1), iso(2), 45, 'tu_do', null, 'x')
    const r = await em(d, '/hs/hoi-thay', { token, qid: QA.ds })
    expect(r).toMatchObject({ ok: false, khoa: 'dang_kiem_tra' })
    expect(d.dem('loi_giai_hoi')).toBe(0)
  })

  it('câu nằm trong đề của một ca chưa công bố (kể cả bài tập) ⇒ khoá câu ấy, câu khác vẫn hỏi được', async () => {
    const { d, token } = await coDe()
    d.objects.set('ca/BT1.json', JSON.stringify({ phanI: [{ id: QA.tn, text: 'x', choices: ['a', 'b', 'c', 'd'], correct: 'A' }] }))
    d.sql.prepare('INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,han_nop,cong_bo,bank_r2,pham_vi,cap_nhat_luc) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
      .run('BT1', 'Bài tập', 'mo', 'baitap', '11', iso(-1), iso(48), 'khong', 'ca/BT1.json', 'tu_do', 'x')
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.tn })).toMatchObject({ ok: false, khoa: 'ca_chua_cong_bo' })
    expect(await em(d, '/hs/hoi-thay', { token, qid: QA.ds })).toMatchObject({ ok: true })
  })

  it('ôn lại: hỏi thầy trước khi nộp ⇒ lần làm đầu trong ngày ghi "có trợ giúp" (không EXP, câu quay lại lịch ôn)', async () => {
    const { d, token } = await coDe()
    await em(d, '/hs/hoi-thay', { token, qid: QA.ds, nguon: 'on_lai' })
    expect(d.dem('su_kien_hoc', `sbd='E1' AND qid='${QA.ds}' AND nguon='on_lai' AND lan=1 AND ket_qua=0 AND assistance='assisted'`)).toBe(1)
    // nguồn khác (phiếu, game…) không ghi sổ ôn lại
    await em(d, '/hs/hoi-thay', { token, qid: QA.tn, nguon: 'phieu' })
    expect(d.dem('su_kien_hoc', `qid='${QA.tn}'`)).toBe(0)
  })

  it('không token hợp lệ ⇒ không trả gì', async () => {
    const { d } = await coDe()
    const r = await em(d, '/hs/hoi-thay', { token: 'gia.mao', qid: QA.ds })
    expect(r.ok).not.toBe(true)
    expect(r.cau).toBeUndefined()
  })
})
