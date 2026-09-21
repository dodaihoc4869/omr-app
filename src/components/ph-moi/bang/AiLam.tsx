// Thẻ "Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay" (cảnh con chưa học: "A.I Đỗ Đại Học đã chuẩn bị gì cho con hôm nay") của bảng "Mọi thứ về con" kiểu Apple. Nguồn mẫu: ph-d-bang-day-du.html (`#muc-ai-lam`) + ph-e-bang-thua.html (bản chuẩn bị).
// NÓI THẬT THEO DỮ LIỆU: chỉ ghi việc máy chủ đã gửi kèm số/giờ thật (ba dòng phụ đều lấy từ máy chủ, rỗng ⇒ không dòng phụ); cả hai mảng vắng ⇒ ẩn cả thẻ.
import type { CSSProperties, ReactNode } from "react";
import type { PhMoi, ViecAi } from "../../../lib/ph-moi/du-lieu";
import { BtDanhSach, BtTich } from "./bieu-tuong";
import { chuGioLuc, conChuaHoc } from "./dung-chung";
import "./TongQuan.css";

/** Nguồn của kế hoạch ngày (`chon_rieng.theoNguon[].ma`) ⇒ chữ. Mã lạ ⇒ bỏ. */
const NHAN_NGUON_KE_HOACH: Record<string, string> = {
  on_lai: "câu ôn lại đến lịch",
  than_thu: "câu luyện dạng con còn vấp",
  on_thi: "câu ôn thi",
  btvn_lo: "câu dành riêng trong bài tập về nhà",
};

const bien = (o: Record<string, number>) => o as CSSProperties; // biến CSS tự đặt (--tq-i)

/** Danh sách việc sẽ hiện: ngày đã học ⇒ `aiDaLam`; cảnh chưa học ⇒ `aiDaChuanBi` (thiếu thì lùi về `aiDaLam`). Rỗng/vắng ⇒ null. */
export function viecAiHienThi(pm: PhMoi): { ds: ViecAi[]; chuanBi: boolean } | null {
  const chua = conChuaHoc(pm);
  const chuanBi = chua && !!pm.aiDaChuanBi && pm.aiDaChuanBi.length > 0;
  const ds = chuanBi ? pm.aiDaChuanBi! : (pm.aiDaLam ?? []);
  return ds.length > 0 ? { ds, chuanBi } : null;
}

export const coAiLam = (pm: PhMoi): boolean => viecAiHienThi(pm) !== null;

/** Dòng phụ của "Chọn riêng N câu": "6 câu ôn lại đến lịch, 9 câu luyện dạng con còn vấp, …"; thiếu thì lấy chữ của máy chủ (thường rỗng). */
export function phuChonRieng(v: Pick<ViecAi, "theoNguon" | "chiTiet">): string {
  const p = v.theoNguon.filter((e) => NHAN_NGUON_KE_HOACH[e.ma] && e.so > 0).map((e) => `${e.so} ${NHAN_NGUON_KE_HOACH[e.ma]}`);
  return p.length > 0 ? p.join(", ") : v.chiTiet;
}

/** Dòng phụ của việc nhắc: `so` = số lần đã nhắc, `luc` = lần gần nhất ("đã nhắc 2 lần · gần nhất lúc 17:00" / "đã nhắc lúc 17:00"). */
export function phuNhac(v: Pick<ViecAi, "so" | "luc" | "chiTiet">): string {
  const gio = chuGioLuc(v.luc);
  const lan = v.so ?? 0;
  const nhieu = lan >= 2;
  const p: string[] = [];
  if (nhieu) p.push(`đã nhắc ${lan} lần`);
  if (gio) p.push(nhieu ? `gần nhất lúc ${gio}` : `đã nhắc lúc ${gio}`);
  else if (!nhieu && lan === 1) p.push("đã nhắc");
  if (v.chiTiet) p.push(v.chiTiet);
  return p.join(" · ");
}

function DongViec({ v, chuanBi, i }: { v: ViecAi; chuanBi: boolean; i: number }) {
  const gio = chuGioLuc(v.luc);
  let chinh: ReactNode;
  let phu = "";
  if (v.loai === "chon_rieng") {
    chinh = (
      <>
        {chuanBi ? "Chọn sẵn" : "Chọn riêng"} <b>{v.so} câu</b> hợp với sức của con
      </>
    );
    phu = phuChonRieng(v);
  } else if (v.loai === "xep_on") {
    // máy chủ đếm `so` theo lịch ôn NGÀY MAI ở cả hai cảnh
    chinh = (
      <>
        Xếp <b>{v.so} câu</b> con từng sai vào lịch ôn ngày mai
      </>
    );
    phu = v.chiTiet;
  } else if (v.loai === "soan_thu_thach") {
    chinh = (
      <>
        Soạn một thử thách riêng <b>{v.so} câu</b>
        {gio ? ` lúc ${gio}` : ""}
      </>
    );
    phu = v.chiTiet;
  } else if (v.loai === "nhac_han") {
    chinh = "Nhắc con trước hạn nộp bài tập về nhà";
    phu = phuNhac(v);
  } else {
    chinh = (
      <>
        Chấm và giải thích <b>{v.so} câu</b> ngay khi con làm xong
      </>
    );
    phu = v.chiTiet;
  }
  return (
    <li style={bien({ "--tq-i": i })}>
      <span className="phm-tich">
        <BtTich />
      </span>
      <div>
        <h3>{chinh}</h3>
        {phu && <p>{phu}</p>}
      </div>
    </li>
  );
}

export function AiLam({ pm }: { pm: PhMoi }) {
  const h = viecAiHienThi(pm);
  if (!h) return null;
  const tieuDe = h.chuanBi ? "A.I Đỗ Đại Học đã chuẩn bị gì cho con hôm nay" : "Thầy và A.I Đỗ Đại Học đã làm gì cho con hôm nay";
  // câu chốt: bản chuẩn bị chỉ nói "có bài vừa sức" khi máy chủ thật sự đã chọn sẵn câu
  const cuoi = h.chuanBi
    ? h.ds.some((v) => v.loai === "chon_rieng")
      ? "Mọi thứ đã sẵn. Con chỉ cần mở app là có bài vừa sức để làm ngay."
      : ""
    : "Anh/chị không cần làm gì thêm — chỉ cần động viên con học đều.";
  return (
    <section className="phm-muc phm-muc--sat" id="muc-ai-lam" aria-label={tieuDe}>
      <div className="phm-the phm-the--dem">
        <p className="phm-nhan-muc">
          <BtDanhSach />
          A.I Đỗ Đại Học · hôm nay
        </p>
        <h2 className="phm-ten-the">{tieuDe}</h2>
        <ul className="phm-lam">
          {h.ds.map((v, i) => (
            <DongViec key={`${v.loai}-${i}`} v={v} chuanBi={h.chuanBi} i={i} />
          ))}
        </ul>
        {cuoi && <p className="phm-lam__cuoi">{cuoi}</p>}
      </div>
    </section>
  );
}
