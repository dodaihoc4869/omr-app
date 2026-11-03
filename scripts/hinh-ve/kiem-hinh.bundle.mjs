/* eslint-disable */
// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/hinh-ve/dung-kiem-hinh.mjs

// src/lib/hinh-ve/kieu.ts
var PHIEN_BAN_HINH = 1;
var CAC_KHUON_HINH = ["so-do", "do-thi", "thi-nghiem", "fischer"];
var TIEU_DE_CHUNG = { "so-do": "Sơ đồ chuyển hoá", "do-thi": "Đồ thị", "thi-nghiem": "Bộ dụng cụ chưng cất", fischer: "Công thức chiếu Fischer" };
var laObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
var mang = (v) => Array.isArray(v) ? v : [];
var chu = (v, tran) => typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, tran) : "";
var so = (v) => typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : null;
var SUB = "₀₁₂₃₄₅₆₇₈₉";
var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function chuanChuHinh(t) {
  return String(t ?? "").normalize("NFC").replace(/[_^{}]/g, "").replace(/[₀-₉]/g, (c) => String(SUB.indexOf(c))).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String(SUP.indexOf(c))).replace(/[⁺₊]/g, "+").replace(/[⁻₋−–]/g, "-").toLowerCase().replace(/[^\p{L}\p{N}+\-%]/gu, "");
}
function phienAmKhop(a, b) {
  const ca = chuanChuHinh(a.join("")), cb = chuanChuHinh(b.join(""));
  if (!ca || !cb) return false;
  const ty = (xs, kho) => {
    const m = xs.map(chuanChuHinh).filter(Boolean);
    return m.length ? m.filter((x) => kho.includes(x)).length / m.length : 0;
  };
  return ty(a, cb) >= 0.9 && ty(b, ca) >= 0.9;
}
function trongKhung(v, lo = 0, hi = 100) {
  return v >= lo && v <= hi;
}
function chuTrongCanh(c) {
  if (c.loai === "so-do") return [...c.o.map((b) => b.chu), ...c.noi.flatMap((n) => [n.nhan ?? "", n.so ?? ""])];
  if (c.loai === "do-thi") return [c.truc.x, c.truc.y, ...c.truc.xVach.map(String), ...c.truc.yVach.map(String), ...c.que.map((q) => q.nhan ?? "")];
  if (c.loai === "thi-nghiem") return Object.values(c.nhan);
  return [c.dau, c.cuoi, ...c.hang.flat()];
}
function kiemCanhHinh(tho, phienAm) {
  if (!laObj(tho) || !laObj(tho.canh)) return { ok: false, lyDo: "thiếu canh" };
  const x = tho.canh, tieuDe = chu(tho.tieuDe, 80);
  if (!tieuDe) return { ok: false, lyDo: "thiếu tiêu đề" };
  let canh = null;
  if (x.loai === "so-do") {
    const o = mang(x.o).map((b) => laObj(b) && chu(b.id, 12) && chu(b.chu, 60) && so(b.x) !== null && so(b.y) !== null && trongKhung(so(b.x)) && trongKhung(so(b.y)) ? { id: chu(b.id, 12), chu: chu(b.chu, 60), x: so(b.x), y: so(b.y) } : null);
    const ids = new Set(o.map((b) => b?.id));
    const noi = mang(x.noi).map((n) => laObj(n) && chu(n.den, 12) && ids.has(chu(n.den, 12)) && mang(n.tu).length >= 1 && mang(n.tu).length <= 3 && mang(n.tu).every((t) => ids.has(chu(t, 12))) ? { tu: mang(n.tu).map((t) => chu(t, 12)), den: chu(n.den, 12), ...chu(n.nhan, 60) ? { nhan: chu(n.nhan, 60) } : {}, ...chu(n.so, 6) ? { so: chu(n.so, 6) } : {} } : null);
    if (o.length < 2 || o.length > 14 || o.some((b) => !b) || noi.length < 1 || noi.length > 14 || noi.some((n) => !n)) return { ok: false, lyDo: "sơ đồ: ô / mũi tên sai khuôn" };
    canh = { loai: "so-do", o, noi };
  } else if (x.loai === "do-thi" && laObj(x.truc)) {
    const t = x.truc, xMin = so(t.xMin), xMax = so(t.xMax), yMax = so(t.yMax);
    const xv = mang(t.xVach).map(so), yv = mang(t.yVach).map(so);
    const que = mang(x.que).map((q) => laObj(q) && so(q.x) !== null && so(q.y) !== null && so(q.y) >= 0 ? { x: so(q.x), y: so(q.y), ...chu(q.nhan, 40) ? { nhan: chu(q.nhan, 40) } : {} } : null);
    if (xMin === null || xMax === null || yMax === null || xMax <= xMin || yMax <= 0 || !chu(t.x, 30) || !chu(t.y, 40) || xv.some((v) => v === null) || yv.some((v) => v === null) || xv.length > 10 || yv.length > 10 || que.length < 1 || que.length > 24 || que.some((q) => !q || q.x < xMin || q.x > xMax || q.y > yMax)) return { ok: false, lyDo: "đồ thị: trục / que sai khuôn" };
    canh = { loai: "do-thi", truc: { x: chu(t.x, 30), y: chu(t.y, 40), xMin, xMax, yMax, xVach: xv, yVach: yv }, que };
  } else if (x.loai === "thi-nghiem" && x.khuon === "chung-cat" && laObj(x.nhan)) {
    const n = x.nhan, ks = ["binh", "luoi", "sinhHan", "vao", "ra", "hung"];
    if (ks.some((k) => !chu(n[k], 30))) return { ok: false, lyDo: "dụng cụ: thiếu nhãn" };
    canh = { loai: "thi-nghiem", khuon: "chung-cat", nhan: Object.fromEntries(ks.map((k) => [k, chu(n[k], 30)])) };
  } else if (x.loai === "fischer") {
    const hang = mang(x.hang).map((h) => Array.isArray(h) && h.length === 2 && chu(h[0], 6) && chu(h[1], 6) ? [chu(h[0], 6), chu(h[1], 6)] : null);
    if (!chu(x.dau, 10) || !chu(x.cuoi, 10) || hang.length < 2 || hang.length > 6 || hang.some((h) => !h)) return { ok: false, lyDo: "Fischer sai khuôn" };
    canh = { loai: "fischer", dau: chu(x.dau, 10), cuoi: chu(x.cuoi, 10), hang };
  }
  if (!canh) return { ok: false, lyDo: "khuôn cảnh chưa hỗ trợ" };
  const kho = chuanChuHinh(phienAm.join(""));
  if (!kho) return { ok: false, lyDo: "thiếu phiên âm ảnh" };
  if (tieuDe !== TIEU_DE_CHUNG[canh.loai] && !kho.includes(chuanChuHinh(tieuDe))) return { ok: false, lyDo: `tiêu đề «${tieuDe.slice(0, 30)}» phải là «${TIEU_DE_CHUNG[canh.loai]}» hoặc chú thích có trong ảnh` };
  const la = chuTrongCanh(canh).filter((t) => chuanChuHinh(t)).find((t) => !kho.includes(chuanChuHinh(t)));
  if (la !== void 0) return { ok: false, lyDo: `chữ «${la.slice(0, 24)}» không có trong ảnh gốc (không được thêm thông tin)` };
  return { ok: true, hinh: { phienBan: PHIEN_BAN_HINH, tieuDe, canh } };
}
function hinhVeDungDuoc(x) {
  if (!laObj(x) || x.phienBan !== PHIEN_BAN_HINH || !laObj(x.canh)) return null;
  const k = kiemCanhHinh(x, [chuTrongCanhTho(x)]);
  return k.ok ? k.hinh : null;
}
function chuTrongCanhTho(c) {
  const ra = [];
  const di = (v) => {
    if (typeof v === "string") ra.push(v);
    else if (typeof v === "number") ra.push(String(v));
    else if (Array.isArray(v)) v.forEach(di);
    else if (laObj(v)) Object.values(v).forEach(di);
  };
  di(c);
  return ra.join(" ");
}
export {
  CAC_KHUON_HINH,
  PHIEN_BAN_HINH,
  TIEU_DE_CHUNG,
  chuTrongCanh,
  chuanChuHinh,
  hinhVeDungDuoc,
  kiemCanhHinh,
  phienAmKhop
};
