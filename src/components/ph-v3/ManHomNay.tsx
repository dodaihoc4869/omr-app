// Mục "Hôm nay" (bản vẽ khổ 1): khối anh hùng (ba vòng: kế hoạch hôm nay · làm đúng · thời gian học) → chiến dịch → ca kiểm tra gần nhất → điều đáng mừng → dạng con đang luyện thêm
// → con học lúc nào → Thầy Đỗ Đại Học đã lo. Mỗi khối chỉ hiện khi có SỐ THẬT; không có gì ⇒ vắng (không số 0 giả).
import type { ViewPhMoi } from '../../lib/ph-moi/use-tat-ca-ve-con'
import { mauSoTiLeDung, type PhMoi } from '../../lib/ph-moi/du-lieu'
import type { Hoc2 } from '../../lib/ph-v3/du-lieu'
import type { PhOmni } from '../../../server/src/omni-kieu'
import { chuPhKhoangCach, chuSoY, diemChu, doTinChu } from '../../lib/omni-chu'
import type { CanhBaoThay } from '../../lib/canh-bao-thay-hien-thi'
import { chuHanNop, chuGuiLuc, tieuDeCanhBao } from '../../lib/canh-bao-thay-hien-thi'
import { gioVn, ngayDayDuVn, soVn, tachVn } from '../../lib/ph-moi/dinh-dang'
import { NHAN_NGUON, chuCongBoCa, tenMoc } from '../ph-moi/nhan'
import { BtBang, BtBia, BtChuong, BtCo, BtDongHo, BtLen, BtLua, BtPhai, BtSach, BtSao, BtTich } from './BieuTuong'
import { ChipDoi, Chip, DangTai, The, TheLoi, VongDongTam } from './dung-chung'
import { TEN_PHAN, chuHanNgay, chuThay, lienKetCa } from './tien-ich'

const GIO_DAU = 5 * 60
const GIO_CUOI = 23 * 60
const phanTram = (x: number): string => `${Math.round(x * 100)}%`

export default function ManHomNay({ v, hoc2, canhBao, onDaXem }: { v: ViewPhMoi; hoc2: Hoc2 | null; canhBao: CanhBaoThay[]; onDaXem: (id: string) => void }) {
  const pm = v.pm
  return (
    <div data-vung="man-chinh-ph">
      <div className="ph3-tieu-de">
        <h1>Hôm nay</h1>
        {pm?.serverNow ? <span>Cập nhật {gioVn(pm.serverNow)}</span> : null}
      </div>
      {!pm ? (
        v.trangThai === 'loi' ? <div className="ph3-luoi"><TheLoi chu={v.chuLoi} thuLai={v.thuLai} /></div> : <DangTai />
      ) : (
        <div className="ph3-luoi">
          {canhBao.map((cb) => <CanhBao key={cb.id} cb={cb} nay={pm.serverNow ?? Date.now()} onDaXem={onDaXem} />)}
          <AnhHung pm={pm} hoc2={hoc2} />
          {hoc2?.chienDich && <ChienDich cd={hoc2.chienDich} omni={hoc2.omni} />}
          <BaiTapCu pm={pm} />
          {pm.caGanNhat && <CaGanNhat pm={pm} />}
          {/* 01/10 (thầy: "lời thầy chuyển lên trên cho cân đối"): "Thầy đã lo cho con" lên ngay đầu cột trái, "Điều đáng mừng" xếp
              bên dưới trong CÙNG một cột — thẻ ngắn không còn để khoảng trống lớn cạnh thẻ "Dạng con đang luyện thêm". */}
          {(coDieuMung(pm) || coAiDaLo(pm)) && (
            <div className="ph3-cot">
              <AiDaLo pm={pm} />
              <DieuMung pm={pm} />
            </div>
          )}
          <DangLuyenThem pm={pm} />
          <HocLucNao pm={pm} coChienDich={!!hoc2?.chienDich} />
        </div>
      )}
    </div>
  )
}

function CanhBao({ cb, nay, onDaXem }: { cb: CanhBaoThay; nay: number; onDaXem: (id: string) => void }) {
  return (
    <section className="ph3-canh-bao ph3-o-du" aria-label="Cảnh báo của thầy" data-vung="canh-bao-thay">
      <div className="ph3-canh-bao__dau"><BtChuong co={18} />Cảnh báo của thầy · {chuGuiLuc(cb)}</div>
      <p><b>{tieuDeCanhBao(cb, 'phuhuynh')}</b></p>
      {cb.loi && <p>{chuThay(cb.loi)}</p>}
      <p>{chuHanNop(cb, nay)}</p>
      <button type="button" className="ph3-nut-vien" style={{ alignSelf: 'flex-start' }} onClick={() => onDaXem(cb.id)}>Đã xem cảnh báo</button>
    </section>
  )
}

function AnhHung({ pm, hoc2 }: { pm: PhMoi; hoc2: Hoc2 | null }) {
  const tq = pm.tongQuan
  const soCau = tq?.soCau ?? 0
  const mau = tq ? mauSoTiLeDung(tq) : null
  const tiDung = tq && tq.soDung !== null && mau ? tq.soDung / mau : null
  const kh = hoc2?.homNay ?? null
  const mucCau = kh ? null : tq?.mucTieu?.soCau ?? null
  const phut = tq?.phutHoc ?? null
  const mucPhut = tq?.mucTieu?.phutHoc ?? null

  const tieuDe = soCau > 0 ? `Con đã ${phut ? `học ${phut} phút, ` : ''}làm ${soCau} câu` : 'Hôm nay con chưa làm câu nào'
  let phu = ''
  if (kh) phu = kh.daLam >= kh.tong ? `Con đã xong kế hoạch hôm nay (${kh.tong} câu).` : `Còn ${kh.tong - kh.daLam} câu nữa là xong kế hoạch hôm nay (${kh.tong} câu).`
  else if (mucCau) phu = soCau >= mucCau ? `Con đã đủ mục tiêu ${mucCau} câu của ngày.` : `Còn ${mucCau - soCau} câu nữa là đủ mục tiêu ${mucCau} câu của ngày.`
  else if (soCau === 0) phu = 'Kết quả hiện ở đây ngay khi con bắt đầu học.'

  const vong: { ti: number | null; mau: 'vong-hp' | 'vong-xl' | 'vong-tim'; nhan: string; so: string; duoi: string }[] = []
  if (kh) vong.push({ ti: kh.daLam / kh.tong, mau: 'vong-hp', nhan: 'Kế hoạch hôm nay', so: String(kh.daLam), duoi: ` / ${kh.tong} câu` })
  else if (soCau > 0 || mucCau) vong.push({ ti: mucCau ? soCau / mucCau : null, mau: 'vong-hp', nhan: 'Câu đã làm', so: String(soCau), duoi: mucCau ? ` / ${mucCau} câu` : ' câu' })
  if (tiDung !== null && tq && mau) vong.push({ ti: tiDung, mau: 'vong-xl', nhan: 'Làm đúng', so: phanTram(tiDung), duoi: ` · ${tq.soDung}/${mau} câu` })
  if (phut !== null && phut > 0) vong.push({ ti: mucPhut ? phut / mucPhut : null, mau: 'vong-tim', nhan: 'Thời gian học', so: String(phut), duoi: mucPhut ? ` / ${mucPhut} phút` : ' phút' })

  const so: { so: string; nhan: string }[] = []
  const lan = tq?.soLanHoc ?? (pm.dongThoiGian ? pm.dongThoiGian.length : null)
  if (lan && soCau > 0) so.push({ so: `${lan} lần`, nhan: 'ngồi học trong ngày' })
  if (tq?.soVoiHomQua && soCau > 0) {
    const d = soCau - tq.soVoiHomQua.soCau
    so.push({ so: d === 0 ? 'Bằng' : `${d > 0 ? '+' : '−'}${Math.abs(d)} câu`, nhan: 'so với hôm qua' })
  }
  if (pm.doCham) so.push({ so: `Thứ ${pm.doCham.hang}/${pm.doCham.siSo}`, nhan: 'độ chăm hôm nay trong lớp' })

  const chuoi = tq?.chuoiNgayHoc ?? 0
  return (
    <section className="ph3-ah ph3-o-rong" aria-label="Tóm tắt ngày học của con" data-vung="anh-hung">
      <div className="ph3-ah__tren">
        <span>{ngayDayDuVn(pm.serverNow ?? Date.now())}</span>
        {chuoi >= 2 && <span className="ph3-ah__chip"><BtLua co={16} />Chuỗi {chuoi} ngày học</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2>{tieuDe}</h2>
        {phu && <p className="ph3-ah__phu">{phu}</p>}
      </div>
      {vong.length > 0 && (
        <div className="ph3-ah__vong">
          <VongDongTam vong={vong} nhan={vong.map((x) => `${x.nhan} ${x.so}${x.duoi}`).join('; ')} />
          <div className="ph3-chu-giai">
            {vong.map((x) => (
              <div key={x.nhan}>
                <span><i data-mau={x.mau} />{x.nhan}</span>
                <span style={{ display: 'block' }}><b data-mau={x.mau}>{x.so}</b><small>{x.duoi}</small></span>
              </div>
            ))}
          </div>
        </div>
      )}
      {so.length > 0 && (
        <div className="ph3-ah__so" style={{ gridTemplateColumns: `repeat(${so.length}, minmax(0, 1fr))` }}>
          {so.map((x) => (
            <div key={x.nhan}><b>{x.so}</b><span>{x.nhan}</span></div>
          ))}
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------- OMNI 3 (05/10) — dòng thêm trong thẻ "Chiến dịch của con"
// Thầy 05/10: "giữ nguyên mọi giao diện hiện tại… thêm những mục cần thiết đồng bộ với giao diện hiện tại". ⇒ KHÔNG thẻ mới: các dòng nằm cuối CÙNG thẻ,
// trong một ô xám `ph3-o-xam` như ô "Tổng · Hạn nộp" ngay trên, chữ `ph3-ghi` sẵn có; dòng khoảng cách tới 8 đậm như dòng "Tổng" của ô trên.
// Chữ: dùng lại src/lib/omni-chu.ts (một nguồn), chỉ đổi sang giọng phụ huynh ở đây; không chữ game; độ tin không bao giờ 100 % (doTinChu kẹp 99 %).

/** Mục tiêu sơ ý của chứng chỉ (điều kiện C = `THAM_SO_OMNI.C_SO_Y` ở server/src/omni-kieu.ts; app chỉ import KIỂU từ máy chủ nên ghi lại số — test khoá hai số bằng nhau). */
export const SO_Y_MUC_TIEU = 0.07
/** Tối đa số tên dạng ghi trên dòng "Dạng cần vững" (còn lại gộp "và N dạng khác") — dòng ngắn trên điện thoại. */
const DANG_TOI_DA = 3

/** "Sơ ý của con: 6 % (mục tiêu dưới 7 %)" — chữ chung `chuSoY` đổi sang giọng phụ huynh, cùng kiểu "nhãn: số" với các dòng khác của ô. */
export function chuPhSoY(s: number | null): string | null {
  const c = chuSoY(s, SO_Y_MUC_TIEU)
  return c && c.replace(/^Sơ ý /, 'Sơ ý của con: ')
}

/** Các dòng OMNI theo thứ tự đọc: khoảng cách tới 8 → dạng cần vững → sơ ý → chứng chỉ gần nhất → giờ học → cần thầy chữa. Không có số thật ⇒ không dòng. */
export function dongOmniPh(o: PhOmni): { khoa: string; chu: string; dam?: true }[] {
  const ra: { khoa: string; chu: string; dam?: true }[] = []
  const kc = chuPhKhoangCach(o.khoangCach8)
  if (kc) ra.push({ khoa: 'khoang-cach-8', chu: kc, dam: true })
  if (o.dangCanVung.length > 0) {
    const them = o.dangCanVung.length - DANG_TOI_DA
    ra.push({ khoa: 'dang-can-vung', chu: `Dạng cần vững: ${o.dangCanVung.slice(0, DANG_TOI_DA).join(', ')}${them > 0 ? ` và ${them} dạng khác` : ''}` })
  }
  const soY = chuPhSoY(o.sEm)
  if (soY) ra.push({ khoa: 'so-y', chu: soY })
  const cc = o.chungChi[0]
  if (cc) ra.push({ khoa: 'chung-chi', chu: `Chứng chỉ gần nhất: ${cc.ten} · Sẵn sàng 8+ · độ tin ${doTinChu(cc.doTin)}${cc.diem !== null ? ` · điểm ca chốt ${diemChu(cc.diem)}` : ''}` })
  if (o.gioHoc) ra.push({ khoa: 'gio-hoc', chu: `Giờ học con chọn: ${o.gioHoc}` })
  if (o.canThayChua > 0) ra.push({ khoa: 'can-thay-chua', chu: `Cần thầy chữa: ${o.canThayChua} chỗ` })
  return ra
}

function ChienDich({ cd, omni }: { cd: NonNullable<Hoc2['chienDich']>; omni?: PhOmni }) {
  const dangLuyen = cd.daGap - cd.thanhThao - cd.canDayLai
  const chuaGap = cd.tong - cd.daGap
  const pt = (n: number) => `${(n / cd.tong) * 100}%`
  const dongOmni = omni ? dongOmniPh(omni) : []
  return (
    <The id="ph3-cd" className="ph3-o-hep" vung="chien-dich" tieuDe="Chiến dịch của con" phu={cd.ten} bieuTuong={<BtCo />} mau="xd"
      chip={<Chip mau="xd">Còn {cd.conNgay} ngày</Chip>}>
      <div className="ph3-cd-ray" role="img" aria-label={`${cd.thanhThao} câu đã thành thạo, ${dangLuyen} câu đang luyện, ${cd.canDayLai} câu cần thầy dạy lại, ${chuaGap} câu chưa gặp, trên tổng ${cd.tong} câu`}>
        {cd.thanhThao > 0 && <span data-mau="xl" style={{ width: pt(cd.thanhThao) }} />}
        {dangLuyen > 0 && <span data-mau="xd" style={{ width: pt(dangLuyen) }} />}
        {cd.canDayLai > 0 && <span data-mau="ho" style={{ width: pt(cd.canDayLai) }} />}
      </div>
      <div className="ph3-cd-chu">
        <div><i data-mau="xl" /><span><b>{cd.thanhThao}</b>câu đã thành thạo</span></div>
        <div><i data-mau="xd" /><span><b>{dangLuyen}</b>câu đang luyện</span></div>
        <div><i data-mau="ho" /><span><b>{cd.canDayLai}</b>câu cần thầy dạy lại</span></div>
        <div><i /><span><b>{chuaGap}</b>câu chưa gặp</span></div>
      </div>
      <div className="ph3-o-xam">
        <b>Tổng {cd.tong} câu · con đã gặp {cd.daGap} câu</b>
        <span className="ph3-dong-bt"><BtDongHo co={16} />Hạn nộp {chuHanNgay(cd.hanNop)}</span>
      </div>
      {dongOmni.length > 0 && (
        <div className="ph3-o-xam" data-vung="chien-dich-omni">
          {dongOmni.map((d) => (d.dam ? <b key={d.khoa}>{d.chu}</b> : <span key={d.khoa} className="ph3-ghi">{d.chu}</span>))}
        </div>
      )}
    </The>
  )
}

/** Bài tập về nhà kiểu cũ (trước Game Hoá 2.0): còn dữ liệu thì hiện gọn, không có thì vắng. */
function BaiTapCu({ pm }: { pm: PhMoi }) {
  const ds = pm.baiTapVeNha?.dangChay ?? []
  if (ds.length === 0) return null
  return (
    <The id="ph3-btvn" tieuDe="Bài tập về nhà" bieuTuong={<BtSach />} mau="xd">
      {ds.map((b) => (
        <div key={b.maBtvn} className="ph3-dong-bai">
          <b>{b.ten}</b>
          {b.changTong ? <span className="ph3-ghi">Đã xong {b.changXong ?? 0}/{b.changTong} chặng</span> : null}
          {b.hanNop && <span className="ph3-dong-bt"><BtDongHo co={16} />Hạn nộp {gioVn(b.hanNop)} · {ngayDayDuVn(b.hanNop)}</span>}
        </div>
      ))}
    </The>
  )
}

function CaGanNhat({ pm }: { pm: PhMoi }) {
  const ca = pm.caGanNhat!
  const kq = ca.ketQua
  return (
    <The id="ph3-ca" vung="ca-gan-nhat" tieuDe="Ca kiểm tra gần nhất" phu={`${ca.tenCa} · ${ngayDayDuVn(ca.nopLuc)}`} bieuTuong={<BtBang />} mau="tim">
      {kq ? (
        <>
          <div className="ph3-so-lon">
            <span><b>{soVn(kq.tong ?? 0)}</b><small> /10 điểm</small></span>
            {ca.truoc && <ChipDoi doi={ca.truoc.doi} duoi="so với ca trước" />}
          </div>
          {ca.phan.length > 0 && (
            <div className="ph3-phan">
              {ca.phan.map((p) => (
                <div key={p.ma}>
                  <span>{TEN_PHAN[p.ma]}</span>
                  <span className="ph3-thanh"><span style={{ width: `${(p.dung / p.tong) * 100}%` }} /></span>
                  <b>{p.dung}/{p.tong} câu</b>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="ph3-cho-cong-bo">{chuCongBoCa(ca)}</p>
      )}
      <a className="ph3-nut-tong" href={lienKetCa(ca.maCa)}>{kq ? 'Xem bài làm và nhận xét của thầy' : 'Xem ca kiểm tra'}<BtPhai co={18} day={2.5} /></a>
    </The>
  )
}

const dsMung = (pm: PhMoi) => (pm.dieuDangMung ?? []).filter((d) => d.loai !== 'chuoi' && d.so !== null && d.so > 0) // chuỗi ngày đã ở khối đầu
const coDieuMung = (pm: PhMoi) => dsMung(pm).length > 0
const coAiDaLo = (pm: PhMoi) => (pm.aiDaLam ?? []).some((x) => x.so !== null && x.so > 0)

function DieuMung({ pm }: { pm: PhMoi }) {
  const ds = dsMung(pm)
  if (ds.length === 0) return null
  return (
    <The id="ph3-mung" tieuDe="Điều đáng mừng hôm nay" bieuTuong={<BtSao />} mau="xl">
      <ul className="ph3-mung">
        {ds.map((d, i) =>
          d.loai === 'dung_lai' ? (
            <li key={i}><b className="ph3-mung__so">{d.so}</b><span>câu từng làm sai, hôm nay con làm đúng</span></li>
          ) : (
            <li key={i}>
              <span className="ph3-mung__bt"><BtLen co={16} day={3} /></span>
              {/* 01/10: tên dạng mỗi dòng một dạng (trước nối dấu phẩy thành một khối chữ dài khó đọc). */}
              <span className="ph3-mung__len">
                Con lên bậc ở {d.dang.length > 0 ? `${d.dang.length} dạng` : <b>{d.so} dạng</b>}
                {d.dang.length > 0 && <span className="ph3-mung__dang">{d.dang.map((x) => <b key={x}>{x}</b>)}</span>}
              </span>
            </li>
          ),
        )}
      </ul>
    </The>
  )
}

function DangLuyenThem({ pm }: { pm: PhMoi }) {
  const ds = (pm.manhYeu?.conVap ?? []).map((d) => ({ ten: d.tenDang, dung: d.dung, tong: d.tong }))
  const dsCu = ds.length > 0 ? ds : (pm.dangVap ?? []).map((d) => ({ ten: d.ten, dung: d.dung, tong: d.tong }))
  const hien = dsCu.filter((d) => d.tong > 0).slice(0, 3)
  if (hien.length === 0) return null
  return (
    <The id="ph3-vap" vung="dang-luyen-them" tieuDe="Dạng con đang luyện thêm" bieuTuong={<BtBia />} mau="hp">
      <ul className="ph3-vap">
        {hien.map((d) => (
          <li key={d.ten}>
            <div className="ph3-vap__dong"><b>{d.ten}</b><span>Đúng {d.dung}/{d.tong} câu</span></div>
            {d.tong <= 12 && (
              <div className="ph3-vach" aria-hidden="true">
                {Array.from({ length: d.tong }, (_, k) => <span key={k} data-dung={k < d.dung ? '' : undefined} />)}
              </div>
            )}
          </li>
        ))}
      </ul>
      <a className="ph3-nut-chu" href="#tien-bo">Xem tiến bộ theo từng dạng<BtPhai co={18} day={2.5} /></a>
    </The>
  )
}

function HocLucNao({ pm, coChienDich }: { pm: PhMoi; coChienDich: boolean }) {
  const ds = pm.dongThoiGian ?? []
  if (ds.length === 0) return null
  const phutTrongNgay = (iso: string): number | null => {
    const t = tachVn(iso)
    return t ? t.h * 60 + t.p : null
  }
  const nhan = (m: (typeof ds)[number]): string => (m.nguon === 'luyen_dang_vap' && coChienDich ? 'Luyện câu trong chiến dịch' : m.nguon === 'luyen_dang_vap' ? NHAN_NGUON.luyen_dang_vap : tenMoc(m))
  return (
    <The id="ph3-gio" tieuDe="Con học lúc nào" bieuTuong={<BtDongHo />} mau="tim">
      <div className="ph3-gio" aria-hidden="true">
        <div className="ph3-gio__ray">
          {ds.map((m, i) => {
            const bd = phutTrongNgay(m.batDau)
            if (bd === null) return null
            const trai = Math.max(0, Math.min(1, (bd - GIO_DAU) / (GIO_CUOI - GIO_DAU)))
            const rong = Math.max(0, Math.min(1 - trai, m.phut / (GIO_CUOI - GIO_DAU)))
            return <span key={i} style={{ left: `${trai * 100}%`, width: `${rong * 100}%` }} />
          })}
        </div>
        <div className="ph3-gio__moc"><span>05:00</span><span>11:00</span><span>17:00</span><span>23:00</span></div>
      </div>
      <ul className="ph3-lan">
        {ds.map((m, i) => {
          const ketThuc = Date.parse(m.batDau) + m.phut * 60_000
          const chi = [`${m.phut} phút`, nhan(m)]
          if (m.che) chi.push(m.soCauDaLam ? `con đã làm ${m.soCauDaLam} câu, kết quả hiện sau khi thầy công bố` : 'kết quả hiện sau khi thầy công bố')
          else if (m.soCau) chi.push(m.soDung !== null ? `đúng ${m.soDung}/${m.soCau} câu` : `${m.soCau} câu`)
          return (
            <li key={i}>
              <b>{gioVn(m.batDau)} – {gioVn(ketThuc)}</b>
              <span>{chi.join(' · ')}</span>
            </li>
          )
        })}
      </ul>
    </The>
  )
}

function AiDaLo({ pm }: { pm: PhMoi }) {
  const ds = (pm.aiDaLam ?? []).filter((x) => x.so !== null && x.so > 0)
  if (ds.length === 0) return null
  const chu = (x: (typeof ds)[number]): string => {
    if (x.loai === 'chon_rieng') return `Chọn riêng ${x.so} câu hợp với sức của con`
    if (x.loai === 'xep_on') return `Xếp ${x.so} câu con từng sai vào lịch ôn ngày mai`
    if (x.loai === 'soan_thu_thach') return `Soạn một thử thách riêng ${x.so} câu`
    if (x.loai === 'nhac_han') return x.luc ? `Nhắc con hạn nộp bài lúc ${/^\d{2}:\d{2}$/.test(x.luc) ? x.luc : gioVn(x.luc)}` : 'Nhắc con trước hạn nộp bài'
    return `Chấm và giải thích ${x.so} câu ngay khi con làm xong`
  }
  return (
    <The id="ph3-ai" tieuDe="Thầy Đỗ Đại Học đã lo cho con" bieuTuong="ĐH" mau="thay">
      <ul className="ph3-ai">
        {ds.map((x, i) => <li key={i}><BtTich co={20} day={2.5} /><span>{chu(x)}</span></li>)}
      </ul>
    </The>
  )
}

