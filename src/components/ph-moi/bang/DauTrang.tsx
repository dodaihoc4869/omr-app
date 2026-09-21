// Đầu trang bảng "Mọi thứ về con" kiểu Apple: thanh trên dính (nút "Hôm nay" + tiêu đề nhỏ hiện dần), Large Title, thanh mục lục dính có scrollspy. Nguồn mẫu: docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html (đầu tệp + script cuối tệp).
// Đặt `data-cuon` / `data-thu` lên `.phm-goc` gần nhất (CSS ph-apple-bang.css đọc hai thuộc tính này); thiếu IntersectionObserver (máy cũ, jsdom) thì bỏ scrollspy, không lỗi.
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { BtLui } from "./bieu-tuong";
import "./TongQuan.css";

export interface MucLuc {
  id: string;
  ten: string;
}

/** "Lớp 12 - Tinh Hoa": nhận cả "12 - Tinh Hoa" lẫn "Lớp 12 - Tinh Hoa"; rỗng ⇒ "". */
export const chuLop = (lop: string): string => {
  const l = lop.trim();
  return l ? (/^lớp\s/i.test(l) ? l : `Lớp ${l}`) : "";
};

const CUA_SO_KHOA_MS = 1000; // sau khi bấm chip: bỏ qua scrollspy trong lúc cuộn mượt để chip không nhảy qua các mục ở giữa

export default function DauTrang({ ten, lop, muc, onVe }: { ten: string; lop: string; muc: MucLuc[]; onVe: () => void }) {
  const thanhTren = useRef<HTMLElement>(null);
  const tieuDe = useRef<HTMLHeadingElement>(null);
  const dsChip = useRef<HTMLUListElement>(null);
  const khoaDen = useRef(0);
  const [dang, setDang] = useState("");
  const hien = muc.some((m) => m.id === dang) ? dang : (muc[0]?.id ?? "");
  const khoaMuc = muc.map((m) => m.id).join("|");

  // `data-cuon` (đã cuộn ⇒ vạch chân mục lục) và `data-thu` (Large Title đã khuất ⇒ tiêu đề nhỏ hiện dần)
  useEffect(() => {
    const goc = tieuDe.current?.closest(".phm-goc");
    if (!goc) return;
    const capNhat = () => {
      goc.toggleAttribute("data-cuon", window.scrollY > 6);
      const t = tieuDe.current;
      const th = thanhTren.current;
      if (t && th) goc.toggleAttribute("data-thu", t.getBoundingClientRect().bottom < th.offsetHeight + 4);
    };
    capNhat();
    window.addEventListener("scroll", capNhat, { passive: true });
    window.addEventListener("resize", capNhat);
    return () => {
      window.removeEventListener("scroll", capNhat);
      window.removeEventListener("resize", capNhat);
      goc.removeAttribute("data-cuon");
      goc.removeAttribute("data-thu");
    };
  }, []);

  // scrollspy: mục đang nằm ở dải 30–40 % chiều cao màn hình là mục đang xem
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || muc.length === 0) return;
    const ob = new IntersectionObserver(
      (es) => {
        if (window.scrollY < 8 || Date.now() < khoaDen.current) return; // ở đầu trang: giữ chip đầu tiên
        const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (v) setDang(v.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const m of muc) {
      const e = document.getElementById(m.id);
      if (e) ob.observe(e);
    }
    return () => ob.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ dựng lại khi danh sách mã mục đổi
  }, [khoaMuc]);

  // giữ chip đang xem trong tầm nhìn của khung cuộn ngang
  useEffect(() => {
    const ul = dsChip.current;
    if (!ul || typeof ul.scrollTo !== "function") return;
    const li = ul.querySelector("a[aria-current]")?.parentElement;
    if (li) ul.scrollTo({ left: Math.max(0, li.offsetLeft - ul.offsetLeft - 16), behavior: "auto" });
  }, [hien]);

  const nhay = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // mở tab mới thì để trình duyệt tự xử lý
    e.preventDefault(); // không đổi địa chỉ (#…) để khỏi làm rối bộ định tuyến của app
    setDang(id);
    khoaDen.current = Date.now() + CUA_SO_KHOA_MS;
    const dich = document.getElementById(id);
    if (!dich) return;
    const giam = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof dich.scrollIntoView === "function") dich.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
    dich.setAttribute("tabindex", "-1");
    dich.focus({ preventScroll: true }); // người dùng bàn phím/đọc màn hình đi tiếp từ đúng mục vừa chọn
  };

  const lopChu = chuLop(lop);
  return (
    <>
      <header className="phm-tren" ref={thanhTren}>
        <div className="phm-tren__hang">
          <button type="button" className="phm-lui" onClick={onVe} aria-label="Quay lại màn Hôm nay">
            <BtLui />
            <span>Hôm nay</span>
          </button>
          <div className="phm-tren__giua" aria-hidden="true">
            <span className="phm-tren__ten">Mọi thứ về con</span>
            {ten && <span className="phm-tren__phu">{ten}</span>}
          </div>
          <span />
        </div>
      </header>
      <div className="phm-tieu-de">
        <h1 ref={tieuDe}>Mọi thứ về con</h1>
        {(ten || lopChu) && (
          <p>
            {ten && <b>{ten}</b>}
            {ten && lopChu ? " · " : ""}
            {lopChu}
          </p>
        )}
      </div>
      {muc.length > 0 && (
        <nav className="phm-muc-luc" aria-label="Các mục của bảng">
          <div className="phm-muc-luc__khung">
            <ul ref={dsChip}>
              {muc.map((m) => (
                <li key={m.id}>
                  <a href={`#${m.id}`} aria-current={m.id === hien ? "true" : undefined} onClick={(e) => nhay(e, m.id)}>
                    <span>{m.ten}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </>
  );
}

export { DauTrang }; // cả tên có ngoặc lẫn mặc định, để vỏ nhập kiểu nào cũng được
