// Màn "Chi tiết một ca kiểm tra" (bản vẽ khổ 2a; `#ca/<mã>`): điểm + ba phần, nhận xét của thầy, đúng bao nhiêu ở từng dạng, câu cần xem lại (bấm "Lời giải" ⇒ đề đủ phương án + lời giải,
// lệnh sẵn có /ph/chi-tiet-cau-ve-con). Ca CHƯA công bố: chỉ tên ca + câu "chờ thầy công bố" (máy chủ không gửi điểm/đáp án; lớp đọc cũng bỏ nếu lỡ có).
import { useEffect, useState } from 'react'
import { ChemText } from '../../lib/chem-format'
import { tachDongTheoY } from '../../lib/tach-dong-cau'
import { taiChiTietCau } from '../../lib/ph-moi/api'
import { docLoiGiai, type ChiTietCau } from '../../lib/ph-moi/du-lieu'
import { chuThoiGian, gioVn, ngayDayDuVn, soVn } from '../../lib/ph-moi/dinh-dang'
import { taiBaoCaoCa } from '../../lib/ph-v3/api'
import type { BaoCaoCa, CauXemLai } from '../../lib/ph-v3/du-lieu'
import { chuCongBoCa } from '../ph-moi/nhan'
import { KhoiLoiGiaiTuCT } from '../loi-giai/KhoiLoiGiaiChuan'
import { BtKhoa, BtLen, BtLenGon, BtTrai, BtXuong } from './BieuTuong'
import { DangTai, The, TheLoi } from './dung-chung'
import { chuThay, TEN_PHAN } from './tien-ich'

type TrangThai = { kieu: 'tai' } | { kieu: 'loi'; chu: string } | { kieu: 'ok'; bc: BaoCaoCa }

export default function ManChiTietCa({ sbd, maCa }: { sbd: string; maCa: string }) {
  const [tt, setTt] = useState<TrangThai>({ kieu: 'tai' })
  const [lan, setLan] = useState(0)
  useEffect(() => {
    let huy = false
    setTt({ kieu: 'tai' })
    void taiBaoCaoCa(sbd, maCa).then((r) => { if (!huy) setTt(r.kieu === 'ok' ? { kieu: 'ok', bc: r.v } : { kieu: 'loi', chu: r.chu }) })
    return () => { huy = true }
  }, [sbd, maCa, lan])

  const bc = tt.kieu === 'ok' ? tt.bc : null
  return (
    <div data-vung="man-chi-tiet-ca">
      <a className="ph3-lui" href="#diem"><BtTrai co={24} day={2.5} />Điểm số</a>
      <div className="ph3-tieu-de ph3-tieu-de--ca">
        <h1>{bc?.tenCa ?? 'Ca kiểm tra'}</h1>
        {bc?.nopLuc && <span>Ca kiểm tra · {ngayDayDuVn(bc.nopLuc)} · nộp lúc {gioVn(bc.nopLuc)}</span>}
      </div>
      {tt.kieu === 'tai' && <DangTai chu="Đang mở báo cáo ca kiểm tra…" />}
      {tt.kieu === 'loi' && <div className="ph3-luoi"><TheLoi chu={tt.chu} thuLai={() => setLan((x) => x + 1)} /></div>}
      {bc && !bc.ketQua && (
        <div className="ph3-luoi">
          <section className="ph3-the" aria-label="Ca chưa công bố điểm">
            <p className="ph3-cho-cong-bo"><BtKhoa co={20} /><span>{chuCongBoCa(bc)}</span></p>
          </section>
        </div>
      )}
      {bc?.ketQua && <BaoCao sbd={sbd} bc={bc} />}
    </div>
  )
}

function BaoCao({ sbd, bc }: { sbd: string; bc: BaoCaoCa }) {
  const kq = bc.ketQua!
  return (
    <div className="ph3-luoi">
      <section className="ph3-ah ph3-o-rong" aria-label="Điểm của con trong ca" data-vung="diem-ca">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="ph3-ah__phu" style={{ fontSize: 14 }}>Điểm của con</span>
            <span><b className="ph3-ah__diem">{soVn(kq.tong)}</b><span className="ph3-ah__phu" style={{ fontSize: 18, fontWeight: 600 }}> /10</span></span>
          </div>
          {bc.truoc && (
            <span className="ph3-ah__chip" data-mau="xl">
              {bc.truoc.doi > 0.004 ? <BtLen co={14} day={3} /> : bc.truoc.doi < -0.004 ? <BtXuong co={14} day={3} /> : null}
              {bc.truoc.doi > 0.004 ? `Tăng ${soVn(bc.truoc.doi)}` : bc.truoc.doi < -0.004 ? `Giảm ${soVn(-bc.truoc.doi)}` : 'Giữ nguyên'} so với ca trước
            </span>
          )}
        </div>
        {bc.phan.length > 0 && (
          <div className="ph3-phan-ah">
            {bc.phan.map((p) => {
              const ti = p.diem !== null && p.toiDa ? p.diem / p.toiDa : p.dung / p.tong
              return (
                <div key={p.ma}>
                  <div className="ph3-phan-ah__dong">
                    <span style={{ fontWeight: 600 }}>Phần {p.ma} · {TEN_PHAN[p.ma]}</span>
                    {p.diem !== null && <span><b>{soVn(p.diem)}</b>{p.toiDa ? <small> / {soVn(p.toiDa)} điểm</small> : <small> điểm</small>}</span>}
                  </div>
                  <span className="ph3-phan-ah__ray"><span style={{ width: `${Math.max(0, Math.min(1, ti)) * 100}%` }} /></span>
                  <span className="ph3-phan-ah__ghi">
                    {p.ma === 'II' ? `Đúng trọn ${p.dung}/${p.tong} câu${p.motPhan > 0 ? ` · ${p.motPhan} câu đúng một phần` : ''}` : `Đúng ${p.dung}/${p.tong} câu`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {bc.thoiGianLamGiay && <span className="ph3-ah__ky">Con làm trong {chuThoiGian(bc.thoiGianLamGiay)}</span>}
      </section>

      {bc.nhanXet && (
        <The id="ph3-nx" className="ph3-o-hep" vung="nhan-xet-thay" tieuDe="Nhận xét của thầy" phu={`Thầy Đỗ Đại Học${bc.nhanXet.capNhatLuc ? ` · ${ngayDayDuVn(bc.nhanXet.capNhatLuc)}` : ''}`} bieuTuong="ĐH" mau="thay">
          <p className="ph3-loi-thay">{chuThay(bc.nhanXet.noiDung)}</p>
        </The>
      )}

      {bc.dang.length > 0 && (
        <The id="ph3-dang-ca" className="ph3-o-hep" tieuDe="Con làm đúng bao nhiêu ở từng dạng" phu="Tính theo câu trong ca này">
          <ul className="ph3-dang">
            {bc.dang.map((d, i) => {
              const ti = d.dung / d.tong
              return (
                <li key={`${d.ten}-${i}`}>
                  <div className="ph3-dang__dong"><span>{d.ten}</span><b>{d.dung}/{d.tong}</b></div>
                  <span className="ph3-thanh"><span data-mau={ti < 0.5 ? 'ho' : ti < 0.8 ? 'hp' : 'xl'} style={{ width: `${ti * 100}%` }} /></span>
                </li>
              )
            })}
          </ul>
        </The>
      )}

      {bc.cauXemLai.length > 0 && <CauXemLaiThe sbd={sbd} ds={bc.cauXemLai} />}
    </div>
  )
}

function CauXemLaiThe({ sbd, ds }: { sbd: string; ds: CauXemLai[] }) {
  const soSai = ds.filter((c) => !c.laDungNhungLau).length
  const soLau = ds.length - soSai
  const phu = [soSai > 0 ? `${soSai} câu chưa đúng` : '', soLau > 0 ? `${soLau} câu đúng nhưng làm lâu` : ''].filter(Boolean).join(' · ')
  return (
    <The id="ph3-cau-xem-lai" className="ph3-o-rong" vung="cau-xem-lai" tieuDe="Câu nên xem lại cùng con" phu={phu}>
      <ul className="ph3-cau">
        {ds.map((c) => <DongCau key={`${c.phan}-${c.qid}`} sbd={sbd} c={c} />)}
      </ul>
    </The>
  )
}

function chuKetQua(c: CauXemLai): string {
  if (c.laDungNhungLau) return 'Con làm đúng nhưng lâu hơn thường lệ'
  const dung = c.dapAnDung ? ` · Đáp án đúng ${c.dapAnDung}` : ''
  return c.dapAnChon ? `Con chọn ${c.dapAnChon}${dung}` : `Con bỏ trống${dung}`
}

function DongCau({ sbd, c }: { sbd: string; c: CauXemLai }) {
  const [mo, setMo] = useState(false)
  const [ct, setCt] = useState<{ kieu: 'tai' } | { kieu: 'loi' } | { kieu: 'ok'; ct: Extract<ChiTietCau, { kieu: 'ok' }> } | null>(null)
  const bam = () => {
    const moi = !mo
    setMo(moi)
    if (moi && ct === null) {
      setCt({ kieu: 'tai' })
      void taiChiTietCau(sbd, c.qid).then((r) => setCt(r.kieu === 'ok' && r.ct.kieu === 'ok' ? { kieu: 'ok', ct: r.ct } : { kieu: 'loi' }))
    }
  }
  const idVung = `ph3-cau-${c.phan}-${c.soCau ?? c.qid}`
  return (
    <li data-mo={mo ? '' : undefined}>
      <div className="ph3-cau__dau">
        <span className="ph3-cau__so"><span>Phần {c.phan}</span><b>{c.soCau ?? '·'}</b></span>
        <span className="ph3-cau__giua">
          <b>{c.de ? <ChemText text={c.de} /> : `Câu ${c.soCau ?? ''}`}</b>
          <span>{chuKetQua(c)}</span>
        </span>
        <button type="button" className="ph3-cau__nut" aria-expanded={mo} aria-controls={idVung} onClick={bam}>
          {mo ? <><BtLenGon co={16} day={2.5} /><span className="ph3-an">Thu gọn</span></> : 'Lời giải'}
        </button>
      </div>
      {mo && (
        <div id={idVung} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ct?.kieu === 'tai' && <p className="ph3-ghi" role="status">Đang mở lời giải…</p>}
          {ct?.kieu === 'ok' && <ChiTiet ct={ct.ct} conChon={c.dapAnChon} />}
          {ct?.kieu === 'loi' && (c.loiGiai ? <LoiGiaiNgan chu={c.loiGiai} dapAn="" /> : <p className="ph3-ghi">Chưa mở được lời giải câu này. Anh/chị thử lại sau ít phút.</p>)}
        </div>
      )}
    </li>
  )
}

/** Lời giải dự phòng từ báo cáo ca: có thể là chuỗi JSON có cấu trúc ⇒ đọc bằng bộ chuẩn chung (không in JSON thô); đọc hỏng ⇒ nói chưa có. Vẽ bằng khối LỜI GIẢI chuẩn. */
function LoiGiaiNgan({ chu: tho, dapAn }: { chu: string; dapAn: string }) {
  const { loiGiai, loiGiaiCT } = docLoiGiai(tho)
  if (!loiGiai) return <p className="ph3-ghi">Câu này chưa có lời giải để xem.</p>
  return <KhoiLoiGiaiTuCT ct={loiGiaiCT} chuNgan={loiGiai} dapAn={dapAn} tach={tachDongTheoY} />
}

function ChiTiet({ ct, conChon }: { ct: Extract<ChiTietCau, { kieu: 'ok' }>; conChon: string }) {
  const chon = conChon.toUpperCase()
  const dap = ct.dapAn.toUpperCase()
  return (
    <>
      {ct.de && <p className="ph3-cau__de"><ChemText text={tachDongTheoY(ct.de)} /></p>}
      {ct.phuongAn.length > 0 && (
        <ul className="ph3-pa">
          {ct.phuongAn.map((p, i) => {
            const m = /^\s*([A-Da-d])[.)]\s*/.exec(p)
            const ma = m ? m[1]!.toUpperCase() : String.fromCharCode(65 + i)
            const chu = m ? p.slice(m[0].length) : p
            const laDung = dap.length === 1 && dap === ma
            const laChon = chon.length === 1 && chon === ma && !laDung
            return (
              <li key={i} data-dung={laDung ? '' : undefined} data-chon={laChon ? '' : undefined}>
                <span>{ma}. <ChemText text={chu} /></span>
                {laDung ? <em>{chon === ma ? 'Đúng · Con chọn' : 'Đúng'}</em> : laChon ? <em>Con chọn</em> : null}
              </li>
            )
          })}
        </ul>
      )}
      {ct.loiGiaiCT ? (
        <div data-vung="loi-giai-ct">
          <KhoiLoiGiaiTuCT ct={ct.loiGiaiCT} dapAn={ct.dapAn} tach={tachDongTheoY} />
        </div>
      ) : ct.loiGiai ? (
        <LoiGiaiNgan chu={ct.loiGiai} dapAn={ct.dapAn} />
      ) : (
        <p className="ph3-ghi">Câu này chưa có lời giải để xem.</p>
      )}
    </>
  )
}
