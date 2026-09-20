// ĐOÀN HỘ TỐNG — màn KẾT CHẶNG (bản vẽ 6). Thẻ giấy "HÔM NAY EM TIẾN BỘ GÌ": mọi dòng là SỐ ĐO ĐƯỢC từ chặng và từ sổ học tập;
// máy chủ không trả số nào thì dòng ấy không hiện (không bịa số, không có chữ kết luận năng lực).
import type { CSSProperties, ReactNode } from 'react'
import type { DoanXem } from './doan-kieu'
import { LinhTamCau, SaoHinh, ThuHinh } from './DoanHinh'

const MAU_GIAY = ['rgb(255,209,102)', 'rgb(127,233,255)', 'rgb(255,138,92)', 'rgb(125,255,176)', 'rgb(217,200,255)', 'rgb(255,158,199)']

export default function DoanKetChang({ xem, expNhan, ve, onVe, onDiTiep, ban, khoiThem }: { xem: DoanXem; expNhan: number; ve?: number | null; onVe: () => void; onDiTiep: () => void; ban: boolean; khoiThem?: ReactNode }) {
  const k = xem.ketChang!, em = xem.ghe.find(g => g.laEm)!, banBe = xem.ghe.filter(g => !g.laEm).slice(0, 2), tb = k.tienBo
  const banDuocGiup = k.cuaEm.soLanGiup > 0
  return (
    <div className="dh-khung">
      <div className="dh-ket-canh">
        {k.thang && <div className="dh-tia" />}
        {k.thang && <div className="dh-hoa-giay" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37 + 11) % 96}%`, background: MAU_GIAY[i % MAU_GIAY.length], animationDelay: `${(i * .37) % 3}s`, animationDuration: `${2.8 + (i % 4) * .4}s` } as CSSProperties} />)}</div>}
        {banBe[0] && <ThuHinh pet={banBe[0].pet} cap={banBe[0].cap} size={92} className="dh-thu-phu dh-noi-2" style={{ left: '2%' }} />}
        {banBe[1] && <ThuHinh pet={banBe[1].pet} cap={banBe[1].cap} size={92} quayTrai className="dh-thu-phu dh-noi-2" style={{ right: '2%' }} />}
        <ThuHinh pet={em.pet} cap={em.cap} size={190} className="dh-noi" />
      </div>
      <div className="dh-ket-sao" role="img" aria-label={`${k.sao} trên 3 sao`}>{[1, 2, 3].map(i => <SaoHinh key={i} size={i === 2 ? 46 : 38} sang={k.sao >= i} />)}</div>
      <h1 className="dh-ket-tieu-de">{k.thang ? <span className="dh-chu-vang">VƯỢT CHẶNG!</span> : 'Linh Tâm cần nghỉ'}</h1>
      <p className="dh-ket-phu">
        {k.thang ? `Linh Tâm về đích với ${k.linhTam.hp}/${k.linhTam.toiDa} máu · cả đội hạ ${k.quaiHaGuc} Tạp Chất${k.trumVoGiap.filter(Boolean).length ? ` · vỡ giáp ${k.trumVoGiap.filter(Boolean).length} trùm` : ''}`
          : 'Thua không mất gì cả: mọi câu em tự làm đúng hôm nay vẫn được ghi nhận. Mai mình hộ tống lại nhé.'}
      </p>
      {k.doanLop && (
        <section className="dh-kinh dh-lop-tien" aria-label="Linh Tâm của lớp">
          <LinhTamCau size={46} />
          <div>
            <b>Linh Tâm của lớp: trạm {k.doanLop.tramTruoc}{k.doanLop.tramSau > k.doanLop.tramTruoc ? <> → <span>{k.doanLop.tramSau}</span></> : null}/{k.doanLop.tongTram}</b>
            <div className="dh-mau"><i style={{ width: `${Math.round(k.doanLop.tramSau * 100 / k.doanLop.tongTram)}%` }} /></div>
            <span>{k.doanLop.banThu > 0 ? `Em là bạn thứ ${k.doanLop.banThu} góp sức hôm nay` : 'Chặng thắng mới đẩy Linh Tâm của lớp'}{k.doanLop.conTramToiMoc ? ` · còn ${k.doanLop.conTramToiMoc} trạm tới ${k.doanLop.tenMocKe}` : ''}{k.doanLop.trumLop ? ` · em góp ${k.doanLop.trumLop} sát thương vào Trùm lớp` : ''}</span>
          </div>
        </section>
      )}
      {khoiThem}

      <section className="dh-tien-bo" aria-label="Hôm nay em tiến bộ gì">
        <div className="dh-nhan">HÔM NAY EM TIẾN BỘ GÌ</div>
        <div><i>✓</i><span>Em <b>tự làm đúng {tb.tuLamDung}/{tb.soCau} câu</b> của riêng mình</span></div>
        {tb.lenBac !== null && tb.lenBac > 0 && <div><i>↑</i><span><b>{tb.lenBac} câu lên bậc ôn</b> · em làm đúng lại ở một ngày khác</span></div>}
        {k.cuaEm.soLanGiup > 0 && <div><i className="dh-lam">⇄</i><span>Em <b>tiếp sức {k.cuaEm.soLanGiup} lần</b>{k.cuaEm.soLanGiupThanhCong > 0 ? ` · ${k.cuaEm.soLanGiupThanhCong} lần bạn làm lại đúng` : ''}</span></div>}
        {tb.duocGiup > 0 && <div><i className="dh-cam">↻</i><span>Em được tiếp sức <b>{tb.duocGiup} câu</b></span></div>}
        {(tb.duocGiup > 0 || banDuocGiup) && <small>Câu được giúp hôm nay sẽ quay lại để {tb.duocGiup > 0 ? 'em' : 'bạn'} tự làm vào ngày mai.</small>}
        {tb.soCau > tb.tuLamDung && <small>Câu em chưa đúng hôm nay sẽ được hồ sơ đưa lại đúng hạn ôn.</small>}
      </section>

      {(expNhan > 0 || k.soLienKich > 0) && (
        <section className="dh-kinh dh-muc" aria-label="Phần thưởng">
          <div className="dh-nhan">PHẦN THƯỞNG</div>
          <div className="dh-thuong">
            {expNhan > 0 && <div><b>+{expNhan}</b><small>EXP vào ví thần thú</small></div>}
            {k.soLienKich > 0 && <div><b>{k.soLienKich}</b><small>lần Liên Kích của cả đội</small></div>}
          </div>
        </section>
      )}

      <button type="button" className="dh-nut-vang" onClick={onVe}>VỀ BẢNG NHIỆM VỤ</button>
      <button type="button" className="dh-nut-mo" disabled={ban} onClick={onDiTiep}>Đi thêm một chặng{ve !== undefined && ve !== null ? ' · 1 vé' : ''}</button>
      {ve === 0 && <p className="dh-ket-phu">Hết vé? Làm xong nhiệm vụ hôm nay để nhận 2 vé.</p>}
    </div>
  )
}
