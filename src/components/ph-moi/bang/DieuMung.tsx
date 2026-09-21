// Thẻ "Điều đáng mừng hôm nay" của bảng "Mọi thứ về con" kiểu Apple: tối đa 3 dòng máy chủ đã đo được (làm đúng lại câu từng sai · lên bậc ở một số dạng · học đều nhiều ngày liền). Nguồn mẫu: ph-d-bang-day-du.html (khối `#muc-mung`).
// NÓI THẬT THEO DỮ LIỆU: không có dòng nào hợp lệ ⇒ ẩn cả thẻ; chấm 7 ngày chỉ khi có nhịp học; "Biết → Hiểu" chỉ khi khớp được dạng trong `vuaLenBac`.
import type { CSSProperties } from "react";
import { thuNgayVn } from "../../../lib/ph-moi/dinh-dang";
import type { DieuDangMung, PhMoi } from "../../../lib/ph-moi/du-lieu";
import { ChuoiMuoiBonNgay } from "../../../lib/ph-moi/nhip-ngay";
import { TEN_BAC_SO } from "../nhan";
import { BtBac, BtLichTich, BtMui, BtSao, BtTich, BtXoay } from "./bieu-tuong";
import "./TongQuan.css";

const TOI_DA_DONG = 3;
const TOI_DA_O_TICH = 6;
const NHAN_THU_NGAN = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

/** Dòng dùng được: có số > 0; "học đều" cần từ 2 ngày (1 ngày không phải chuỗi). */
const hopLe = (d: DieuDangMung): boolean => d.so !== null && d.so > 0 && (d.loai !== "chuoi" || d.so >= 2);
const cacDong = (pm: PhMoi): DieuDangMung[] => (pm.dieuDangMung ?? []).filter(hopLe).slice(0, TOI_DA_DONG);

export const coDieuMung = (pm: PhMoi): boolean => cacDong(pm).length > 0;

const chuan = (s: string): string => s.normalize("NFC").trim().toLowerCase();
const bien = (o: Record<string, number>) => o as CSSProperties; // biến CSS tự đặt (--tq-i)

/** "2026-09-21" ⇒ "T2" (giờ VN của máy chủ; tính bằng UTC vì ngày đã là ngày VN). */
const nhanThu = (ngay: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay);
  return m ? (NHAN_THU_NGAN[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()] ?? "") : "";
};

export interface DongLenBac {
  ten: string;
  /** "Biết"/"Hiểu"/"Vận dụng"; khớp được `vuaLenBac` mới có, không thì null */
  tu: string | null;
  den: string | null;
}

/** THUẦN. Tên dạng lấy từ `dang` của máy chủ (≤ 3), thiếu thì `manhYeu.lenBacHomNay`; bậc "từ → đến" lấy từ `vuaLenBac` khớp tên (không phân biệt hoa thường), không khớp ⇒ chỉ tên. */
export function dongLenBac(pm: PhMoi, d: DieuDangMung): DongLenBac[] {
  const ten = d.dang.length > 0 ? d.dang : (pm.manhYeu?.lenBacHomNay ?? []).slice(0, TOI_DA_DONG);
  return ten.map((t) => {
    const v = (pm.vuaLenBac ?? []).find((x) => chuan(x.ten) === chuan(t));
    const tu = v ? TEN_BAC_SO[v.tu] : undefined;
    const den = v ? TEN_BAC_SO[v.den] : undefined;
    return { ten: t, tu: tu && den ? tu : null, den: tu && den ? den : null };
  });
}

function DongMung({ pm, d, i }: { pm: PhMoi; d: DieuDangMung; i: number }) {
  const so = d.so as number;
  const chung = { style: bien({ "--tq-i": i }) };
  if (d.loai === "dung_lai") {
    return (
      <li {...chung}>
        <span className="phm-o-bt" data-mau="dat">
          <BtXoay />
        </span>
        <div>
          <h3>
            Con làm đúng lại <b>{so} câu</b> từng sai
          </h3>
          {d.chiTiet && <p>{d.chiTiet}</p>}
          <div className="phm-o4" aria-hidden="true">
            {Array.from({ length: Math.min(so, TOI_DA_O_TICH) }, (_, k) => (
              <i key={k}>
                <BtTich />
              </i>
            ))}
          </div>
        </div>
      </li>
    );
  }
  if (d.loai === "len_bac") {
    const ds = dongLenBac(pm, d);
    return (
      <li {...chung}>
        <span className="phm-o-bt" data-mau="dat">
          <BtBac />
        </span>
        <div>
          <h3>
            Con lên bậc ở <b>{so} dạng</b>
          </h3>
          {ds.length > 0 && (
            <ul className="phm-len-bac">
              {ds.map((x) => (
                <li key={x.ten}>
                  <span>{x.ten}</span>
                  {x.tu && x.den ? (
                    <span className="phm-bac-len">
                      {x.tu} <BtMui /> <b>{x.den}</b>
                    </span>
                  ) : (
                    <span className="phm-bac-len">lên bậc</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </li>
    );
  }
  // chuỗi học đều: từ ngày (hôm nay − (N − 1)) đến hôm nay; chấm 7 ngày cuối từ nhịp học
  const moc = pm.serverNow ?? Date.now();
  const bay = ChuoiMuoiBonNgay(pm).slice(-7);
  return (
    <li {...chung}>
      <span className="phm-o-bt" data-mau="dat">
        <BtLichTich />
      </span>
      <div>
        <h3>
          Con học đều ngày thứ <b>{so}</b> liên tiếp
        </h3>
        <p>từ {thuNgayVn(moc - (so - 1) * 86_400_000)} đến hôm nay</p>
        {bay.length > 0 && (
          <ol className="phm-7" aria-hidden="true">
            {bay.map((n) => (
              <li key={n.ngay} data-nghi={(n.soCau ?? 0) === 0 ? "" : undefined}>
                <i />
                {nhanThu(n.ngay)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

export function DieuMung({ pm }: { pm: PhMoi }) {
  const ds = cacDong(pm);
  if (ds.length === 0) return null;
  return (
    <section className="phm-muc phm-muc--sat" id="muc-mung" aria-label="Điều đáng mừng hôm nay">
      <div className="phm-the phm-the--dem">
        <p className="phm-nhan-muc" data-mau="dat">
          <BtSao />
          Điều đáng mừng hôm nay
        </p>
        <ul className="phm-mung">
          {ds.map((d, i) => (
            <DongMung key={`${d.loai}-${i}`} pm={pm} d={d} i={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}
