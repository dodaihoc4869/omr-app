// BẰNG CHỨNG CỦA MỘT EM (thầy 30/10: «Bấm vào từng hs phải ra đủ thông tin dễ hiểu sắc bén chứng minh hs đó như vậy nhé. Thiết kế đẹp chính xác»).
// Khối đầu tấm Hồ sơ làm bài (`dauThan` của HoSoLamCauEm) khi thầy bấm một em ở Hôm nay: kết luận trước (nhóm · hạng trong dải xếp hạng · bậc Học thật ·
// đối phó), rồi BẰNG CHỨNG BẰNG SỐ cho từng kết luận:
//   · Nhịp học — luật của nhóm em đang ở (cùng câu chữ dải số), số ngày đủ mức / không làm, câu đã làm / còn thiếu, chuỗi ngày liền bỏ dài nhất, và
//     dải TỪNG NGÀY có số câu em làm trong ô (màu cùng bảng nhiệt của Nhịp học);
//   · Đối phó — câu lý do bằng số của máy chủ (lượt quá nhanh, tỉ lệ đúng so với lượt thường, chuỗi chọn lặp);
//   · Học thật — Điểm Thật tuần, bậc, lý do, điểm trừ, cách làm bài (lượt, thuộc, bấm vội, treo máy, đúng khi nhanh / chậm).
// Chỉ đọc số đã có (Nhịp học + bảng Học thật đã nạp ở Hôm nay) — không thêm lệnh máy chủ, không bịa: thiếu nguồn ⇒ nói thiếu.
import { chuDieuKien, chuMotO, ngayNgan, TEN_NHOM_NHIP, type DongNhipHoc } from '../../lib/nhip-hoc-thay'
import { ptChu, TEN_BAC_GV, type EmLop } from '../../lib/hoc-that-api'
import type { CotXep, HocThatLop } from './XepHangEm'

export interface HangEm { cot: CotXep; so: number; tong: number }
const TEN_COT: Record<CotXep, string> = { luoi: 'lười nhất', cham: 'chăm nhất', 'hoc-that': 'học thật nhất', 'doi-pho': 'đối phó nhiều nhất' }
const TEN_MUC: Record<string, string> = { du: 'Đủ mức', 'thieu-it': 'Thiếu ít', 'thieu-nhieu': 'Thiếu nhiều', 'khong-lam': 'Không làm', 'chua-vao': 'Chưa vào học', 'hom-nay': 'Hôm nay (chưa hết ngày)' }

function So({ nhan, so, sac }: { nhan: string; so: string; sac?: 'xau' | 'tot' }) {
  return <div className="bce-o" data-sac={sac}><b className="gvv2-so">{so}</b><span>{nhan}</span></div>
}

export default function BangChungEm({ d, ht, htTai, hang }: { d?: DongNhipHoc; ht?: EmLop; htTai: HocThatLop['tt'] | 'tat'; hang: readonly HangEm[] }) {
  const n = d?.soNgayQua ?? 0
  const nhom = d && d.nhom !== 'chua-du' ? d.nhom : null
  const s = ht?.soLieu
  return (
    <section className="bce" aria-labelledby="bce-tieu">
      <h3 id="bce-tieu">Vì sao xếp em như vậy</h3>
      <div className="bce-chip">
        {nhom && <span data-k={nhom}>{TEN_NHOM_NHIP[nhom]}</span>}
        {d?.nhom === 'chua-du' && <span data-k="chua-du">Chưa đủ ngày để xếp nhóm</span>}
        {hang.map((h) => <span key={h.cot} data-k={h.cot}>Hạng {h.so}/{h.tong} {TEN_COT[h.cot]}</span>)}
        {ht && <span data-k={ht.bac === 1 ? 'hoc-that' : ht.bac >= 4 ? 'nang' : ht.bac === 3 ? 'doi-pho' : 'chua-deu'}>{TEN_BAC_GV[ht.bac]} · Điểm Thật {Math.round(ht.diem)}</span>}
        {d?.doiPho && <span data-k="doi-pho">Có dấu hiệu đối phó</span>}
      </div>

      {d && (
        <div className="bce-khoi">
          <h4>Nhịp học · {n} ngày đã qua (từ {ngayNgan(d.o[0]?.ngay ?? d.ngayVao)})</h4>
          {nhom && <p className="bce-luat"><b>Luật nhóm {TEN_NHOM_NHIP[nhom]}:</b> {chuDieuKien(nhom, n)}.</p>}
          <div className="bce-luoi">
            <So nhan="ngày đủ mức" so={`${d.soNgayDu}/${n}`} sac={nhom === 'cham' ? 'tot' : nhom === 'luoi' ? 'xau' : undefined} />
            <So nhan="ngày không làm câu nào" so={String(d.soNgayKhongLam)} sac={d.soNgayKhongLam > 0 ? 'xau' : 'tot'} />
            <So nhan="câu đã làm" so={String(d.tongLam)} />
            <So nhan="câu còn thiếu so với mức" so={String(d.tongCauThieu)} sac={d.tongCauThieu > 0 ? 'xau' : 'tot'} />
            <So nhan="ngày đủ mức liền gần nhất" so={String(d.chuoiDuGanNhat)} sac={d.chuoiDuGanNhat >= 6 ? 'tot' : undefined} />
            <So nhan="hôm nay" so={d.homNay ? `${d.homNay.lam}/${d.homNay.muc}` : '—'} />
          </div>
          {d.chuoiKhongLam && d.chuoiKhongLam.dai >= 2 && (
            <p className="bce-nhan" data-sac="xau">Bỏ dài nhất: <b>{d.chuoiKhongLam.dai} ngày liền không làm</b> ({ngayNgan(d.chuoiKhongLam.tu)} – {ngayNgan(d.chuoiKhongLam.den)}).</p>
          )}
          <ol className="bce-ngay" aria-label="Từng ngày: số câu em làm so với mức">
            {d.o.map((x) => {
              const muc = x.loai === 'chua-vao' ? 'chua-vao' : x.homNay && x.lam < x.muc ? 'hom-nay' : x.loai
              return (
                <li key={x.ngay} title={chuMotO(x)}>
                  <span className="bce-o-ngay" data-muc={muc} aria-hidden="true">{x.loai === 'chua-vao' ? '·' : x.lam}</span>
                  <small aria-hidden="true">{ngayNgan(x.ngay).slice(0, 2)}</small>
                  <span className="sr-only">{chuMotO(x)}</span>
                </li>
              )
            })}
          </ol>
          <p className="bce-chu-giai" aria-hidden="true">
            {(['du', 'thieu-it', 'thieu-nhieu', 'khong-lam'] as const).map((k) => <span key={k}><i data-muc={k} />{TEN_MUC[k]}</span>)}
            <span>Số trong ô = câu em làm · mức {d.o.find((x) => x.loai !== 'chua-vao')?.muc ?? '—'} câu/ngày</span>
          </p>
        </div>
      )}

      {d?.doiPho && (
        <div className="bce-khoi" data-k="doi-pho">
          <h4>Dấu hiệu đối phó</h4>
          <ul className="bce-ds">{d.doiPho.lyDo.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}

      <div className="bce-khoi" data-k="hoc-that">
        <h4>Học thật · Đối phó{ht ? ` · tuần từ ${ngayNgan(ht.tuan)}` : ''}</h4>
        {ht ? (
          <>
            <div className="bce-diem">
              <b className="gvv2-so" data-bac={ht.bac}>{Math.round(ht.diem)}<small>/100</small></b>
              <span><b>Điểm Thật · {TEN_BAC_GV[ht.bac]}</b>Càng cao càng học thật: làm đủ, đọc kỹ đề, không bấm vội, không treo máy.</span>
            </div>
            {!ht.duDuLieu && <p className="bce-nhan">Chưa đủ lượt làm để máy kết luận chắc.</p>}
            {ht.lyDo.length > 0 && <ul className="bce-ds">{ht.lyDo.map((x) => <li key={x}>{x}</li>)}</ul>}
            {ht.phat.length > 0 && (
              <ul className="bce-phat" aria-label="Điểm trừ">
                {ht.phat.map((p) => <li key={p.ma || p.chu} data-xau={p.xau || undefined}><span>{p.chu}</span><b className="gvv2-so">−{Math.round(p.diem)}</b></li>)}
              </ul>
            )}
            {s && (
              <div className="bce-luoi">
                <So nhan="lượt làm câu" so={String(s.soLuot)} />
                <So nhan="thuộc (nhanh mà đúng)" so={String(s.soThuoc)} sac="tot" />
                <So nhan="bấm vội (nhanh mà sai)" so={String(s.soBamVoi)} sac={s.soBamVoi > 0 ? 'xau' : undefined} />
                <So nhan="treo máy / cố tình treo" so={`${s.soTreo}/${s.soCoTinh}`} sac={s.soTreo + s.soCoTinh > 0 ? 'xau' : undefined} />
                <So nhan="đúng khi làm nhanh" so={ptChu(s.nhanDung)} />
                <So nhan="đúng khi làm chậm" so={ptChu(s.chamDung)} />
              </div>
            )}
          </>
        ) : (
          <p className="bce-nhan">
            {htTai === 'cho' ? 'Đang tải bảng Học thật…' : htTai === 'tat' ? 'Thầy đang tắt xếp Học thật · Đối phó (mục Học sinh › Xếp học sinh).'
              : htTai === 'loi' ? 'Chưa tải được bảng Học thật.' : 'Em chưa có Điểm Thật tuần này (máy xếp mỗi thứ Hai, cần đủ lượt làm).'}
          </p>
        )}
      </div>
    </section>
  )
}
