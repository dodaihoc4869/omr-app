// Thẻ TỔNG QUAN của bảng "Mọi thứ về con" kiểu Apple: ngày + giờ cập nhật, "Hôm nay của {tên}", ba vòng + chú giải có nhãn, câu tóm tắt, "So với hôm qua của chính con"; kèm biến thể "hôm nay con chưa học".
// Nguồn mẫu: docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html (đầy đủ) + ph-e-bang-thua.html (thưa, `#canh=chua-hoc`). NÓI THẬT THEO DỮ LIỆU: trường máy chủ không trả ⇒ ẩn đúng phần đó (không bịa 0, không chữ giả). Dòng nợ cam thuộc khối Bài tập về nhà (phần agent C), không dựng ở đây.
import type { ReactNode } from "react";
import { SoDem } from "./so-dem";
import { gioVn, ngayChuoiNgan, ngayDayDuVn, thuTuChuoiNgay } from "../../../lib/ph-moi/dinh-dang";
import type { PhMoi, TongQuan as TongQuanPh } from "../../../lib/ph-moi/du-lieu";
import { ChuoiMuoiBonNgay } from "../../../lib/ph-moi/nhip-ngay";
import { BtBang, BtDongHo, BtMucTieu, BtMuiLen, BtMuiXuong, BtTichVong } from "./bieu-tuong";
import { Chip, conChuaHoc, tenGoi } from "./dung-chung";
import Vong3 from "./Vong3";
import "./TongQuan.css";

/** Có gì để nói ở thẻ Tổng quan: khối tổng quan, hoặc cảnh "con chưa học" (không câu, không mốc). */
export const coTongQuan = (pm: PhMoi): boolean => !!pm.tongQuan || conChuaHoc(pm);

// ───────────────────────────────────────────── chú giải ba vòng
export interface DongChuGiai {
  mau: "1" | "2" | "3";
  so: string;
  /** phần nhỏ sau số: "/16 câu", "%", "/45 phút", "phút", "câu"… */
  don: string;
  nhan: string;
}

const nguyen = (n: number): number => Math.round(n);

/** THUẦN. Ba dòng "số + nhãn"; dòng nào thiếu số thì KHÔNG có. Có mục tiêu ⇒ "38/16 câu · đã làm · vượt mục tiêu"; thiếu mục tiêu ⇒ "38 câu · đã làm". */
export function chuGiaiVong(t: Pick<TongQuanPh, "soCau" | "soDung" | "phutHoc" | "mucTieu">): DongChuGiai[] {
  const ra: DongChuGiai[] = [];
  const mucCau = t.mucTieu?.soCau ?? null;
  const mucPhut = t.mucTieu?.phutHoc != null ? nguyen(t.mucTieu.phutHoc) : null;
  if (t.soCau !== null) {
    const nhan = mucCau === null ? "đã làm" : t.soCau > mucCau ? "đã làm · vượt mục tiêu" : t.soCau === mucCau ? "đã làm · đạt mục tiêu" : `đã làm · mục tiêu ${mucCau} câu`;
    ra.push({ mau: "1", so: String(t.soCau), don: mucCau === null ? "câu" : `/${mucCau} câu`, nhan });
    if (t.soCau === 0) ra.push({ mau: "2", so: "—", don: "", nhan: "câu đúng · chưa có câu nào" });
    else if (t.soDung !== null) {
      const dung = Math.min(t.soDung, t.soCau); // dữ liệu lệch (đúng > làm) không được ra quá 100 %
      ra.push({ mau: "2", so: String(nguyen((dung / t.soCau) * 100)), don: "%", nhan: `đúng ${dung} trong ${t.soCau} câu` });
    }
  }
  if (t.phutHoc !== null) {
    const p = nguyen(t.phutHoc);
    const nhan = mucPhut === null ? "đã học" : p > mucPhut ? "đã học · vượt mục tiêu" : p === mucPhut ? "đã học · đạt mục tiêu" : `đã học · mục tiêu ${mucPhut} phút`;
    ra.push({ mau: "3", so: String(p), don: mucPhut === null ? "phút" : `/${mucPhut} phút`, nhan });
  }
  return ra;
}

// ───────────────────────────────────────────── so với hôm qua
export interface ChipHomQua {
  chu: string;
  huong: "len" | "xuong" | "bang";
  /** "dat" chỉ cho điều tốt (nhiều hơn / đúng hơn / lâu hơn); còn lại xám — không tô cam/đỏ để khỏi chê con */
  mau?: "dat";
}

const GAN_BANG_DIEM = 2; // chênh ≤ 2 điểm phần trăm ⇒ "gần bằng hôm qua"

/** THUẦN. Chip nào thiếu số thì KHÔNG có (phút chỉ khi hôm qua có `phutHoc`; tỉ lệ đúng chỉ khi hôm qua có làm câu). */
export function soSanhHomQua(t: Pick<TongQuanPh, "soCau" | "soDung" | "phutHoc" | "soVoiHomQua">): ChipHomQua[] {
  const hq = t.soVoiHomQua;
  if (!hq) return [];
  const ra: ChipHomQua[] = [];
  if (t.soCau !== null) {
    const d = t.soCau - hq.soCau;
    ra.push(d > 0 ? { chu: `nhiều hơn ${d} câu`, huong: "len", mau: "dat" } : d < 0 ? { chu: `ít hơn ${-d} câu`, huong: "xuong" } : { chu: "số câu bằng hôm qua", huong: "bang" });
  }
  if (t.soCau !== null && t.soCau > 0 && t.soDung !== null && hq.soCau > 0) {
    const d = nguyen((Math.min(t.soDung, t.soCau) / t.soCau) * 100) - nguyen(hq.tiLeDung * 100);
    ra.push(
      d > GAN_BANG_DIEM
        ? { chu: `đúng hơn ${d} %`, huong: "len", mau: "dat" }
        : d < -GAN_BANG_DIEM
          ? { chu: `đúng kém ${-d} %`, huong: "xuong" }
          : { chu: d === 0 ? "câu đúng bằng hôm qua" : "câu đúng gần bằng hôm qua", huong: "bang" },
    );
  }
  if (t.phutHoc !== null && hq.phutHoc !== null) {
    const d = nguyen(t.phutHoc) - nguyen(hq.phutHoc);
    ra.push(d > 0 ? { chu: `lâu hơn ${d} phút`, huong: "len", mau: "dat" } : d < 0 ? { chu: `ngắn hơn ${-d} phút`, huong: "xuong" } : { chu: "thời gian học bằng hôm qua", huong: "bang" });
  }
  return ra;
}

// ───────────────────────────────────────────── câu tóm tắt
export interface TomTat {
  chinh: string;
  /** dòng nhỏ dưới (chưa đạt nhiệm vụ: cần thêm N câu…) */
  phu: string;
  /** đạt ⇒ dấu tích xanh; còn lại ⇒ biểu tượng mục tiêu màu nhấn */
  dat: boolean;
}

/** THUẦN. "Hôm nay Khôi học 5 lần, lần dài nhất 21 phút, và đã đạt nhiệm vụ ngày." Số lần / lần dài nhất lấy từ máy chủ, thiếu thì tự đếm từ dòng thời gian; `datNhiemVu` null ⇒ bỏ vế nhiệm vụ. Không có gì để nói ⇒ null. */
export function tomTatHomNay(pm: PhMoi): TomTat | null {
  const t = pm.tongQuan;
  const moc = pm.dongThoiGian ?? [];
  const lan = t?.soLanHoc && t.soLanHoc > 0 ? t.soLanHoc : moc.length > 0 ? moc.length : null;
  const daiRaw = t?.lanDaiNhatPhut ?? (moc.length > 0 ? Math.max(...moc.map((m) => m.phut)) : null);
  const dai = daiRaw !== null ? nguyen(daiRaw) : 0;
  const ten = tenGoi(pm.hoTen);
  const hoc = lan !== null ? `${ten} học ${lan} lần${dai > 0 ? `, lần dài nhất ${dai} phút` : ""}` : "";
  const dat = t?.datNhiemVu ?? null;
  if (dat === true) return { chinh: hoc ? `Hôm nay ${hoc}, và đã đạt nhiệm vụ ngày.` : `Hôm nay ${ten} đã đạt nhiệm vụ ngày.`, phu: "", dat: true };
  if (dat === false) {
    const muc = t?.mucTieu?.soCau ?? null;
    const daLam = t?.soCau ?? null;
    const phu = muc !== null && daLam !== null && daLam < muc ? `Con cần thêm ${muc - daLam} câu nữa để đạt mục tiêu ngày.` : "Con chưa đạt nhiệm vụ ngày.";
    return hoc ? { chinh: `Hôm nay ${hoc}.`, phu, dat: false } : { chinh: phu, phu: "", dat: false };
  }
  return hoc ? { chinh: `Hôm nay ${hoc}.`, phu: "", dat: false } : null;
}

/** "Chủ nhật 20/09/2026" từ "2026-09-20". */
const ngayDayDuTuChuoi = (s: string): string => `${thuTuChuoiNgay(s)} ${ngayChuoiNgan(s)}/${s.slice(0, 4)}`;

/** Lần học gần nhất TRƯỚC hôm nay trong 14 ngày nhịp học; không có ⇒ "". (Máy chủ không trả giờ của lần đó nên chỉ ghi ngày.) */
function lanHocGanNhat(pm: PhMoi): string {
  const ds = ChuoiMuoiBonNgay(pm);
  for (let i = ds.length - 2; i >= 0; i--) if ((ds[i]!.soCau ?? 0) > 0) return ngayDayDuTuChuoi(ds[i]!.ngay);
  return "";
}

const IconHuong = ({ h }: { h: ChipHomQua["huong"] }) => (h === "len" ? <BtMuiLen /> : h === "xuong" ? <BtMuiXuong /> : <BtBang />);

// ───────────────────────────────────────────── thẻ
export function TongQuan({ pm, now }: { pm: PhMoi; now?: number }) {
  if (!coTongQuan(pm)) return null;
  const chua = conChuaHoc(pm);
  const t = pm.tongQuan;
  // cảnh chưa học: theo định nghĩa của `conChuaHoc`, số câu / phút chưa có nghĩa là 0 (chỉ khi máy chủ có khối tổng quan; không có khối ⇒ không bày số)
  const soCau = t ? (t.soCau ?? (chua ? 0 : null)) : null;
  const phutHoc = t && t.phutHoc !== null ? nguyen(t.phutHoc) : t && chua ? 0 : null;
  const muc = t?.mucTieu ? { soCau: t.mucTieu.soCau, phutHoc: t.mucTieu.phutHoc !== null ? nguyen(t.mucTieu.phutHoc) : null } : null;
  const so = { soCau, soDung: t?.soDung ?? null, phutHoc };
  const dong = t ? chuGiaiVong({ ...so, mucTieu: muc }) : [];
  const moc = pm.serverNow ?? now ?? Date.now();
  const tomTat = chua ? null : tomTatHomNay(pm);
  const chip = t && !chua ? soSanhHomQua({ ...so, soVoiHomQua: t.soVoiHomQua }) : [];
  const lanTruoc = chua ? lanHocGanNhat(pm) : "";
  const giao = chua && (pm.giaoThemConLai ?? 0) > 0 ? "Anh/chị có thể giao cho con một bài ngắn để con bắt đầu." : "";
  const phuChua = [lanTruoc ? `Lần học gần nhất: ${lanTruoc}.` : "", giao].filter(Boolean).join(" ");
  const vong = (
    <Vong3
      soCau={so.soCau}
      soDung={so.soDung}
      phutHoc={so.phutHoc}
      mucTieu={muc}
      nhan={chua ? "Các vòng hôm nay còn trống: con chưa học" : undefined}
    />
  );

  let loi: ReactNode = null;
  if (chua) {
    loi = (
      <div className="phm-ah__loi" data-mau="nhan">
        <BtDongHo />
        <p>
          Hôm nay con chưa học
          {phuChua && <small>{phuChua}</small>}
        </p>
      </div>
    );
  } else if (tomTat) {
    loi = (
      <div className="phm-ah__loi" data-mau={tomTat.dat ? undefined : "nhan"}>
        {tomTat.dat ? <BtTichVong /> : <BtMucTieu />}
        <p>
          {tomTat.chinh}
          {tomTat.phu && <small>{tomTat.phu}</small>}
        </p>
      </div>
    );
  }

  return (
    <section className="phm-muc phm-muc--dau" id="muc-tong-quan" aria-label="Tổng quan hôm nay">
      <div className="phm-the phm-the--dem phm-ah">
        <p className="phm-ah__ngay">
          {ngayDayDuVn(moc)}
          {pm.serverNow !== null ? ` · cập nhật lúc ${gioVn(pm.serverNow)}` : ""}
        </p>
        <h2>Hôm nay của {tenGoi(pm.hoTen)}</h2>
        {dong.length > 0 && (
          <div className="phm-ah__than">
            {vong}
            <ul className="phm-chu-giai">
              {dong.map((d, i) => (
                <li key={d.mau} data-mau={d.mau} data-rong={chua ? "" : undefined}>
                  <b>
                    <SoDem chu={d.so} tre={i * 80} />
                    {d.don && <small>{d.don}</small>}
                  </b>
                  <span>{d.nhan}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {loi}
        {chip.length > 0 && (
          <div className="phm-ah__hq">
            <h3>So với hôm qua của chính con</h3>
            <div className="phm-chips">
              {chip.map((c) => (
                <Chip key={c.chu} mau={c.mau} icon={<IconHuong h={c.huong} />}>
                  {c.chu}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
