// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai/dung-kiem.mjs (nguồn src/lib/loi-giai-kiem.ts + loi-giai-bo.ts)

// src/lib/cau-tu-luan.ts
var laDoiTuong = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var lay = (c, ...khoa) => {
  for (const k of khoa) if (c[k] !== void 0) return c[k];
  return void 0;
};
var chuoi = (x) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : "").normalize("NFC").trim();
function chuoiDapAn(v) {
  if (v === null || v === void 0) return "";
  if (typeof v === "boolean") return v ? "D" : "S";
  if (Array.isArray(v)) return v.map(chuoiDapAn).join("");
  if (typeof v === "object") {
    const o = v;
    const co = ["a", "b", "c", "d"].some((k) => k in o) || ["A", "B", "C", "D"].some((k) => k in o);
    if (co) {
      return ["a", "b", "c", "d"].map((k) => {
        const val = o[k] ?? o[k.toUpperCase()];
        if (typeof val === "object" && val !== null) return val.dung ? "D" : "S";
        return chuoiDapAn(val);
      }).join("");
    }
    return "";
  }
  return String(v).trim();
}
function phanCua(c, phanMacDinh) {
  const ban = { I: "I", II: "II", III: "III", TN: "I", DS: "II", TLN: "III", "1": "I", "2": "II", "3": "III" };
  const raw = chuoi(lay(c, "phan", "part")).toUpperCase();
  if (raw) return ban[raw] ?? "khac";
  const m = chuoi(lay(c, "qid", "id")).match(/-(III|II|I)-\d+$/);
  if (m) return m[1];
  return phanMacDinh ?? null;
}
function laMaDeTuLuan(ma) {
  return /(?:^|-)(?:VD|DT|TL)(?:-|$)/i.test(String(ma ?? ""));
}
var KIEU_TU_LUAN = /(?:^|[^a-z])(?:tu[\s_-]?luan|tự[\s_-]?luận|essay|open[\s_-]?ended|free[\s_-]?text)(?:$|[^a-z])/i;
var CO_ANH = (x) => Array.isArray(x) ? x.some(Boolean) : Boolean(x);
var CUM_HOI_MO = ["theo em", "vì sao", "tại sao", "phương pháp nào", "cách nào", "cách gì", "như thế nào"];
var DONG_TU_HOI_MO = /(?:^|[.?!:;]\s*|(?:^|[^\p{L}])hãy\s+)(?:giải thích|trình bày|mô tả|nêu|so sánh|nhận xét|đề xuất)(?![\p{L}])/iu;
var hoiMo = (text) => {
  const t = text.toLowerCase();
  return CUM_HOI_MO.some((m) => t.includes(m)) || DONG_TU_HOI_MO.test(t);
};
var laSoThuan = (da) => da.length <= 12 && /^[+\-−–]?\d+(?:[.,]\d+)*$/.test(da);
var laChuNhieuTu = (da) => da.split(/\s+/).filter((t) => t.length > 0 && !/\d/.test(t) && new RegExp("^\\p{L}{2,}[.,;:!?]*$", "u").test(t)).length >= 2;
var chuPhuongAn = (x) => typeof x === "string" ? x.trim() : laDoiTuong(x) ? chuoi(lay(x, "text", "noiDung", "noi_dung", "de")) : typeof x === "number" ? String(x) : "";
function demCoNoiDung(ds, anh, hinh, tienTo) {
  const khoa = ["A", "B", "C", "D"];
  const coHinh = (k) => Array.isArray(hinh) && hinh.some((h) => laDoiTuong(h) && chuoi(h.viTri ?? h.vi_tri).toLowerCase() === `${tienTo}${k}`.toLowerCase() && Boolean(h.src ?? h.url ?? h.data));
  const imgs = Array.isArray(anh) ? anh : [];
  let n = 0;
  if (Array.isArray(ds)) {
    for (let i = 0; i < ds.length; i++) if (chuPhuongAn(ds[i]) || CO_ANH(imgs[i]) || i < 4 && coHinh(khoa[i])) n++;
    return n;
  }
  if (laDoiTuong(ds)) {
    khoa.forEach((k, i) => {
      const v = ds[k] ?? ds[k.toLowerCase()];
      if (chuPhuongAn(v) || CO_ANH(imgs[i]) || coHinh(k)) n++;
    });
  }
  return n;
}
function lyDoTuLuan(c, phanMacDinh) {
  if (!laDoiTuong(c)) return "không phải câu hỏi";
  const kieu = chuoi(lay(c, "kieu", "loai", "type", "loaiCau"));
  if (kieu && KIEU_TU_LUAN.test(kieu)) return "câu gắn nhãn tự luận";
  if (laMaDeTuLuan(chuoi(lay(c, "maDe", "ma_de"))) || laMaDeTuLuan(chuoi(lay(c, "qid", "id")))) return "mã đề thuộc mục dạy học / tự luận (-VD, -DT, -TL)";
  const phan = phanCua(c, phanMacDinh);
  if (phan === "khac") return "phần của câu không phải I, II, III (tự luận)";
  const text = chuoi(lay(c, "text", "de", "cauHoi", "noiDung"));
  const daRaw = lay(c, "correct", "dapAn", "dap_an", "dapAnDung");
  const chuaCoDapAn = c.chuaCoDapAn === true || laDoiTuong(c.caNhan) && c.caNhan.chuaCoDapAn === true;
  const coDapAn = daRaw !== void 0 && !chuaCoDapAn;
  const da = chuoiDapAn(daRaw);
  if (phan === "I") {
    const pa = lay(c, "choices", "pa", "luaChon", "phuongAn", "options");
    const coPa = c.choices !== void 0 || c.pa !== void 0 || c.luaChon !== void 0 || c.phuongAn !== void 0 || c.options !== void 0;
    if (coPa && demCoNoiDung(pa, lay(c, "choiceImgs", "anhLuaChon"), lay(c, "hinh", "hinhAnh"), "sau_pa_") < 4) return "phần I thiếu phương án (không đủ 4)";
    if (coDapAn && !/^[A-D]$/i.test(da.replace(/[.)\s]+$/, "").trim())) return "phần I không có đáp án A–D";
  } else if (phan === "II") {
    const y = lay(c, "ideas", "y", "cacY", "statements");
    const coY = c.ideas !== void 0 || c.y !== void 0 || c.cacY !== void 0 || c.statements !== void 0;
    if (coY && demCoNoiDung(y, lay(c, "ideaImgs", "anhY"), lay(c, "hinh", "hinhAnh"), "sau_y_") < 4) return "phần II thiếu ý (không đủ 4)";
    if (coDapAn && da.replace(/[^DSĐdsđ]/g, "").length !== 4) return "phần II không có đáp án đúng/sai đủ 4 ý";
  } else if (phan === "III") {
    if (coDapAn) {
      if (!da) return "phần III không có đáp án để chấm tự động";
      if (da.length > 20 && /\s/.test(da) || /[\n;→⇌:]/.test(da)) return "phần III đáp án dài / nhiều dòng (tự luận)";
      if (laChuNhieuTu(da)) return "phần III đáp án là chữ nhiều từ (không phải số hay mã ngắn)";
    }
    if (text && !(coDapAn && laSoThuan(da)) && hoiMo(text)) return "phần III hỏi mở (theo em / phương pháp nào / giải thích …)";
  }
  return null;
}
function laCauTuLuan(c, phanMacDinh) {
  return lyDoTuLuan(c, phanMacDinh) !== null;
}

// src/lib/loi-giai-kiem.ts
var KHUON_HO_SO = "1.2";
var LOAI_CO = ["dapAn", "hienThi", "loiDe"];
var laObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var chuoi2 = (x) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : "").normalize("NFC");
function banDo(v, nhan) {
  if (Array.isArray(v)) {
    if (!v.length) return null;
    const o = {};
    v.forEach((x, i) => {
      if (i < nhan.length) o[nhan[i]] = chuoi2(laObj(x) ? x.t ?? x.text ?? x.noi_dung : x);
    });
    return o;
  }
  if (laObj(v)) {
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = chuoi2(laObj(x) ? x.t ?? x.text ?? x.noi_dung : x);
    return Object.keys(o).length ? o : null;
  }
  return null;
}
function dapAnDs(v) {
  return chuoiDapAn(v).toUpperCase().replace(/Đ/g, "D").replace(/[^DS]/g, "");
}
function mot(c, maDe, phanMacDinh) {
  const phanTho = chuoi2(c.phan ?? phanMacDinh ?? "").trim().toUpperCase();
  const phan = { I: "I", II: "II", III: "III", TN: "I", DS: "II", TLN: "III" }[phanTho];
  if (!phan) return null;
  const so = chuoi2(c.so).trim();
  const qid = chuoi2(c.qid ?? c.id).trim() || (so ? `${maDe}-${phan}-${so}` : "");
  if (!qid) return null;
  const dangO = c.dang;
  const hinhTho = c.hinh ?? c.hinhAnh;
  const hinh = Array.isArray(hinhTho) ? hinhTho.filter(laObj).map((h) => ({ viTri: chuoi2(h.vi_tri ?? h.viTri) || "sau_de", duLieu: chuoi2(h.du_lieu ?? h.duLieu ?? h.src) })).filter((h) => /^data:image\/(png|jpe?g|gif|webp);base64,/.test(h.duLieu)) : [];
  const bangTho = c.bang;
  const bang = Array.isArray(bangTho) && bangTho.every(Array.isArray) ? bangTho.map((r) => r.map(chuoi2)) : null;
  const cc = laObj(c.can_chua) ? c.can_chua : {};
  const da = c.dap_an ?? c.correct ?? c.dapAn;
  return {
    qid,
    cau: {
      qid,
      maDe,
      phan,
      so,
      de: chuoi2(c.de ?? c.text),
      pa: phan === "I" ? banDo(c.pa ?? c.choices ?? c.luaChon, ["A", "B", "C", "D"]) : null,
      y: phan === "II" ? banDo(c.y ?? c.ideas, ["a", "b", "c", "d"]) : null,
      dapAn: phan === "II" ? dapAnDs(da) : chuoiDapAn(da).trim(),
      bang,
      hinh,
      chuong: chuoi2(c.chuyen_de ?? c.chuyenDe).trim(),
      mucDo: chuoi2(c.muc_do ?? c.mucDo).trim(),
      dangMa: chuoi2(laObj(dangO) ? dangO.ma : dangO).trim(),
      sao: Number(cc.sao ?? 0) || 0,
      loiGiai: laObj(c.loi_giai) ? c.loi_giai : laObj(c.loiGiai) ? c.loiGiai : null
    }
  };
}
function cauTrongGoi(maDe, goi) {
  if (!laObj(goi)) return [];
  const ra = [];
  const them = (c, p) => {
    if (laObj(c)) {
      const m = mot(c, maDe, p);
      if (m) ra.push(m.cau);
    }
  };
  if (Array.isArray(goi.cau)) goi.cau.forEach((c) => them(c));
  else if (Array.isArray(goi.items)) goi.items.forEach((c) => them(c));
  else for (const p of ["I", "II", "III"]) {
    const v = goi[`phan${p}`];
    if (Array.isArray(v)) v.forEach((c) => them(c, p));
  }
  return ra;
}
function loaiCau(c) {
  if (laMaDeTuLuan(c.maDe)) return null;
  const tho = { phan: c.phan, de: c.de, pa: c.pa ? Object.values(c.pa) : void 0, y: c.y ? Object.values(c.y) : void 0, dap_an: c.dapAn, hinh: c.hinh.map((h) => ({ viTri: h.viTri, src: h.duLieu })) };
  if (laCauTuLuan(tho, c.phan)) return null;
  if (c.phan === "I") return c.pa && Object.keys(c.pa).length === 4 && /^[A-D]$/.test(c.dapAn) ? "tn" : null;
  if (c.phan === "II") return c.y && Object.keys(c.y).length === 4 && /^[DS]{4}$/.test(c.dapAn) ? "ds" : null;
  return c.dapAn && c.dapAn.length <= 8 ? "tln" : null;
}
function tangCau(c, dang) {
  const buoc = Array.isArray(c.loiGiai?.buoc) ? (c.loiGiai?.buoc).length : 0;
  if (c.mucDo === "biet" && dang !== "tln") return "gon";
  if (c.mucDo === "van_dung" && (buoc >= 3 || dang === "tln") || c.sao >= 2) return "sau";
  return "du";
}
function lopCua(maDe) {
  return (maDe.match(/(?:^|-)(10|11|12)(?:-|$)/) ?? [])[1] ?? "";
}
function boCua(c) {
  return c.dangMa.split(".")[0]?.trim().toUpperCase() ?? "";
}
var chuanChu = (s) => s.toLowerCase().replace(/\s+/g, " ").replace(/[.,;:]/g, "").trim();
function chuoiBam(c) {
  const chu = [c.de, JSON.stringify(c.pa ?? c.y ?? ""), c.dapAn, JSON.stringify(c.bang ?? "")].map(chuanChu).join("|");
  return chu + "|" + c.hinh.map((h) => h.duLieu).join("|");
}
async function bamCau(c) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(chuoiBam(c)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}
var esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
function chuHtml(s) {
  return esc(s).replace(/\n/g, "<br>");
}
function deHtml(c, kemHinh = true) {
  let h = "<p>" + chuHtml(c.de) + "</p>";
  if (c.bang?.length) h += '<div class="tbl"><table>' + c.bang.map((r, i) => "<tr>" + r.map((x) => i ? `<td>${chuHtml(x)}</td>` : `<th>${chuHtml(x)}</th>`).join("") + "</tr>").join("") + "</table></div>";
  if (kemHinh) for (const g of c.hinh) h += `<p><img alt="Hình trong đề" src="${g.duLieu}"></p>`;
  return h;
}
function dauVao(c, bam) {
  const dang = loaiCau(c);
  if (!dang) return null;
  const lg = c.loiGiai ?? {};
  const base = {
    khuon: KHUON_HO_SO,
    qid: c.qid,
    bam,
    nguon: c.maDe,
    so: `Câu ${c.so}`,
    dang,
    bo: boCua(c),
    chuong: c.chuong,
    mucDo: c.mucDo,
    dangBai: c.dangMa,
    tang: tangCau(c, dang),
    de: deHtml(c, false),
    hinh: c.hinh,
    loiGiaiCo: { chot: lg.chot ?? "", tung: lg.tung_pa ?? lg.tung_y ?? null, buoc: lg.buoc ?? [], ket_qua: lg.ket_qua ?? "", trang_thai: lg.trang_thai ?? "" }
  };
  if (dang === "tn") {
    const pa = c.pa;
    const ids = Object.keys(pa);
    return { ...base, y: ids.map((k) => ({ id: k, t: pa[k] })), dapAn: Object.fromEntries(ids.map((k) => [k, k === c.dapAn ? "D" : "S"])), mc: { hoi: "Chọn đáp án", o: ids.map((k) => [k, pa[k]]), dapAn: c.dapAn } };
  }
  if (dang === "ds") {
    const y = c.y;
    const ids = Object.keys(y);
    return { ...base, y: ids.map((k) => ({ id: k, t: y[k] })), dapAn: Object.fromEntries(ids.map((k, i) => [k, c.dapAn[i]])) };
  }
  return { ...base, y: [], dapAn: { kq: c.dapAn } };
}
function tinhBieuThuc(bt) {
  const s = bt.replace(/\s+/g, "");
  if (!/^[0-9.+\-*/()]+$/.test(s)) throw new Error("biểu thức có kí tự lạ: " + bt);
  let i = 0;
  const so = () => {
    if (s[i] === "(") {
      i++;
      const v2 = cong();
      if (s[i] !== ")") throw new Error("thiếu ngoặc đóng: " + bt);
      i++;
      return v2;
    }
    if (s[i] === "-") {
      i++;
      return -so();
    }
    if (s[i] === "+") {
      i++;
      return so();
    }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(s.slice(i));
    if (!m) throw new Error("biểu thức hỏng: " + bt);
    i += m[0].length;
    return Number(m[0]);
  };
  const nhan = () => {
    let v2 = so();
    while (s[i] === "*" || s[i] === "/") {
      const op = s[i++];
      const r = so();
      v2 = op === "*" ? v2 * r : v2 / r;
    }
    return v2;
  };
  const cong = () => {
    let v2 = nhan();
    while (s[i] === "+" || s[i] === "-") {
      const op = s[i++];
      const r = nhan();
      v2 = op === "+" ? v2 + r : v2 - r;
    }
    return v2;
  };
  const v = cong();
  if (i !== s.length) throw new Error("biểu thức thừa kí tự: " + bt);
  if (!Number.isFinite(v)) throw new Error("biểu thức ra vô cực: " + bt);
  return v;
}
var BAY_CHUNG = ["nguyennhan", "tuyetdoi", "xuhuong", "conso", "doivai", "antoan", "tengoi"];
var BIEU_TUONG = [
  "i-flask",
  "i-funnel",
  "i-reflux",
  "i-distill",
  "i-bubbles",
  "i-salt",
  "i-dry",
  "i-ice",
  "i-filter",
  "i-crystal",
  "i-scale",
  "i-ir",
  "i-heat",
  "i-chart",
  "i-hex",
  "i-thermo",
  "i-lens",
  "i-bolt",
  "i-battery",
  "i-chain",
  "i-atom"
];
var THE_DUOC = /* @__PURE__ */ new Set(["b", "i", "sub", "sup", "br"]);
var TRUONG_BUOC = ["qid", "bam", "dang", "ten", "keys", "dung", "y", "ket", "nho", "phepTinh", "tuongTu", "co"];
function kiemPhepTinh(ds, noi, loi) {
  if (!Array.isArray(ds)) {
    loi.push(`${noi}: phepTinh không phải mảng`);
    return 0;
  }
  for (const p of ds) {
    const ten = chuoi2(p?.ten);
    try {
      const v = tinhBieuThuc(chuoi2(p?.bieuThuc));
      const d = Number(p?.lamTron ?? 2);
      const sai = 0.5 * Math.pow(10, -d) + 1e-9;
      if (typeof p?.ketQua !== "number") loi.push(`${noi}: "${ten}" ketQua không phải số`);
      else if (Math.abs(v - p.ketQua) > sai) loi.push(`KHOÁ SỐ ${noi}: "${ten}" máy tính ra ${v.toFixed(d + 2)} ≠ ghi ${p.ketQua}`);
    } catch (e) {
      loi.push(`${noi}: "${ten}" ${e.message}`);
    }
  }
  return ds.length;
}
function chuTrongHoSo(h) {
  const ra = [h.ten, h.nho, h.ket];
  for (const s of h.dung ?? []) {
    ra.push(s?.t, s?.p);
    for (const x of s?.io ?? []) ra.push(Array.isArray(x) ? x[1] : x);
  }
  for (const y of h.y ?? []) ra.push(y?.soi, y?.giai, ...y?.g ?? []);
  for (const t of h.tuongTu ?? []) ra.push(t?.t, t?.giai);
  const tl = h.tl;
  if (tl) ra.push(tl.soi, tl.giai, ...tl.g ?? []);
  for (const c of h.co ?? []) ra.push(c?.ghi, c?.chot);
  for (const c of Array.isArray(h.daChot) ? h.daChot : []) ra.push(c?.ghi, c?.chot);
  return ra.filter((x) => typeof x === "string");
}
var chuanKet = (s) => s.replace(/\s+/g, " ").replace(/[-—]/g, "–").trim();
var soTuChu = (s) => Number(s.trim().replace(",", "."));
function kiemHoSo(vao, hoSo, bo) {
  const loi = [];
  const canhBao = [];
  if (!laObj(hoSo)) return { loi: ["hồ sơ không phải đối tượng JSON"], canhBao };
  const h = hoSo;
  for (const k of TRUONG_BUOC) if (h[k] === void 0) loi.push("thiếu trường " + k);
  if (loi.length) return { loi, canhBao };
  const KEYS = Object.keys(bo.KEYS);
  const TRAPS = /* @__PURE__ */ new Set([...BAY_CHUNG, ...Object.keys(bo.TRAPS_THEM ?? {})]);
  const ICONS = new Set(BIEU_TUONG);
  const PRESET = bo.LAB_PRESETS ?? {};
  if (h.qid !== vao.qid) loi.push(`KHOÁ MÃ CÂU: hồ sơ ghi ${chuoi2(h.qid)} ≠ ${vao.qid}`);
  if (h.bam !== vao.bam) loi.push(`KHOÁ VÂN TAY: hồ sơ ghi ${chuoi2(h.bam)} ≠ ${vao.bam} (đề đã đổi hoặc chép nhầm)`);
  if (h.dang !== vao.dang) loi.push(`dạng ${chuoi2(h.dang)} ≠ ${vao.dang}`);
  const ten = chuoi2(h.ten), nho = chuoi2(h.nho), ket = chuoi2(h.ket);
  if (!ten) loi.push("ten rỗng");
  else if (ten.length > 70) canhBao.push(`ten dài ${ten.length} > 70`);
  if (!nho) loi.push("nho rỗng");
  else if (nho.length > 120) canhBao.push(`nho dài ${nho.length} > 120`);
  if (!Array.isArray(h.keys) || !h.keys.length) loi.push("keys rỗng");
  else h.keys.forEach((k) => {
    if (!KEYS.includes(chuoi2(k))) loi.push("chìa khoá lạ " + chuoi2(k));
  });
  const dung = h.dung;
  if (!Array.isArray(dung) || dung.length < 2 || dung.length > 5) loi.push(`dung cần 2–5 bước`);
  else dung.forEach((s, i) => {
    if (!ICONS.has(chuoi2(s?.ic))) loi.push(`dung[${i}] biểu tượng lạ ${chuoi2(s?.ic)}`);
    if (!chuoi2(s?.t) || !chuoi2(s?.p)) loi.push(`dung[${i}] thiếu t/p`);
    else if (chuoi2(s.t).length > 40) canhBao.push(`dung[${i}] tiêu đề dài`);
    if (!Array.isArray(s?.io)) loi.push(`dung[${i}] io không phải mảng`);
  });
  const y = Array.isArray(h.y) ? h.y : null;
  if (!y) loi.push("y không phải mảng");
  if (y && vao.dang !== "tln") {
    if (y.length !== vao.y.length) loi.push(`số ý ${y.length} ≠ ${vao.y.length}`);
    const tn = vao.dang === "tn";
    y.forEach((yy, i) => {
      const id = chuoi2(yy?.id);
      if (id !== vao.y[i]?.id) loi.push(`ý thứ ${i + 1}: id ${id} ≠ ${vao.y[i]?.id}`);
      const dung_ = vao.dapAn[id];
      if (yy?.d !== dung_) loi.push(`KHOÁ ĐÁP ÁN: ý ${id} ghi ${chuoi2(yy?.d)}, đáp án kho ${dung_}`);
      if (!KEYS.includes(chuoi2(yy?.k))) loi.push(`ý ${id}: chìa khoá lạ ${chuoi2(yy?.k)}`);
      if (yy?.bay != null && !TRAPS.has(chuoi2(yy.bay))) loi.push(`ý ${id}: bẫy lạ ${chuoi2(yy.bay)}`);
      if (!tn && yy?.d === "D" && yy?.bay) canhBao.push(`ý ${id}: ý ĐÚNG mà có bẫy`);
      if (!tn && yy?.d === "S" && !yy?.bay) canhBao.push(`ý ${id}: ý SAI mà không gắn bẫy`);
      const g = Array.isArray(yy?.g) ? yy.g : null;
      const n = g?.length ?? -1;
      if (!g || (tn ? yy.d === "D" ? n !== 3 : n < 1 || n > 3 : n !== 3)) loi.push(`ý ${id}: số gợi ý sai (${n})`);
      else if (!/^Chìa khoá/.test(chuoi2(g[0]))) canhBao.push(`ý ${id}: gợi ý 1 không mở đầu bằng "Chìa khoá"`);
      if (!chuoi2(yy?.soi)) loi.push(`ý ${id}: thiếu soi`);
      const mo = chuoi2(yy?.giai).trim().split(/[.\s]/)[0];
      const can = tn ? yy?.d === "D" ? "Chọn" : "Loại" : yy?.d === "D" ? "Đúng" : "Sai";
      if (mo !== can) loi.push(`ý ${id}: lời giải mở đầu "${mo}", cần "${can}"`);
      const lab = yy?.lab;
      if (lab != null && !(Array.isArray(lab) && PRESET[chuoi2(lab[0])]?.includes(chuoi2(lab[1])))) loi.push(`ý ${id}: phòng thí nghiệm lạ ${JSON.stringify(lab)}`);
    });
  }
  if (vao.dang === "tn") {
    const mc = h.mc;
    if (!mc || mc.d !== vao.mc?.dapAn) loi.push(`KHOÁ ĐÁP ÁN: lựa chọn chốt ${chuoi2(mc?.d)} ≠ ${vao.mc?.dapAn}`);
    if (ket !== `Đáp án ${vao.mc?.dapAn}`) loi.push(`ket "${ket}" ≠ "Đáp án ${vao.mc?.dapAn}"`);
  }
  if (vao.dang === "ds") {
    const can = vao.y.map((x) => `${x.id} ${vao.dapAn[x.id] === "D" ? "Đ" : "S"}`).join(" – ");
    if (chuanKet(ket) !== chuanKet(can)) loi.push(`ket "${ket}" ≠ "${can}"`);
  }
  if (vao.dang === "tln") {
    if (y && y.length) loi.push("tln: y phải rỗng");
    const tl = laObj(h.tl) ? h.tl : null;
    if (!tl) loi.push("tln: thiếu tl");
    else {
      if (chuoi2(tl.dapAn) !== vao.dapAn.kq) loi.push(`KHOÁ ĐÁP ÁN: đáp số ${chuoi2(tl.dapAn)} ≠ ${vao.dapAn.kq}`);
      if (!Array.isArray(tl.g) || tl.g.length !== 3) loi.push("tln: cần đúng 3 gợi ý");
      if (!/^Đáp số/.test(chuoi2(tl.giai).trim())) loi.push('tln: lời giải phải mở đầu "Đáp số"');
      if (!KEYS.includes(chuoi2(tl.k))) loi.push("tln: chìa khoá lạ " + chuoi2(tl.k));
      if (tl.bay != null && !TRAPS.has(chuoi2(tl.bay))) loi.push("tln: bẫy lạ " + chuoi2(tl.bay));
      if (!chuoi2(tl.soi)) loi.push("tln: thiếu soi");
    }
    if (!ket.startsWith("Đáp số")) loi.push('tln: ket phải mở đầu "Đáp số"');
    const cuoi = Array.isArray(h.phepTinh) ? h.phepTinh.filter((p) => p?.laDapSo).pop() : void 0;
    if (!cuoi) loi.push("KHOÁ SỐ: thiếu phép tính laDapSo");
    else if (!(Math.abs(soTuChu(vao.dapAn.kq) - Number(cuoi.ketQua)) < 1e-9)) loi.push(`KHOÁ SỐ: phép tính cuối ra ${chuoi2(cuoi.ketQua)} ≠ đáp số ${vao.dapAn.kq}`);
  }
  const soPhep = kiemPhepTinh(h.phepTinh, "phepTinh", loi);
  const tt = h.tuongTu;
  const soTT = vao.tang === "gon" ? [1, 1] : [1, 2];
  if (!Array.isArray(tt) || tt.length < 1 || tt.length > 2) loi.push("tuongTu cần 1–2 ý");
  else {
    if (tt.length < soTT[0] || tt.length > soTT[1]) canhBao.push(`tầng ${vao.tang}: nên có ${soTT[1]} ý tương tự`);
    tt.forEach((t, i) => {
      if (!["D", "S"].includes(chuoi2(t?.d))) loi.push(`tuongTu[${i}] d lạ`);
      if (!chuoi2(t?.t)) loi.push(`tuongTu[${i}] thiếu t`);
      if (t?.phepTinh !== void 0) kiemPhepTinh(t.phepTinh, `tuongTu[${i}]`, loi);
      const mo = chuoi2(t?.giai).trim().split(/[.\s]/)[0];
      if (t?.d === "D" && mo !== "Đúng" || t?.d === "S" && mo !== "Sai") loi.push(`tuongTu[${i}] lời giải mở đầu "${mo}" không khớp ${chuoi2(t?.d)}`);
    });
  }
  const coSo = (y ?? []).some((yy) => /=\s*\d/.test(chuoi2(yy?.giai) + (yy?.g ?? []).map(chuoi2).join(" "))) || laObj(h.tl) && /=\s*\d/.test(chuoi2(h.tl.giai));
  if (coSo && soPhep === 0) loi.push("KHOÁ SỐ: lời giải có phép tính nhưng phepTinh rỗng");
  if (!Array.isArray(h.co)) loi.push("co không phải mảng");
  else h.co.forEach((c, i) => {
    if (!LOAI_CO.includes(c?.loai)) loi.push(`co[${i}] loại lạ ${chuoi2(c?.loai)} (chỉ dapAn | hienThi | loiDe)`);
    if (!chuoi2(c?.ghi)) loi.push(`co[${i}] thiếu ghi`);
    if (c?.sua !== void 0) {
      const su = c.sua;
      if (!laObj(su) || !chuoi2(su.truoc) || typeof su.sau !== "string" || chuoi2(su.truoc) === chuoi2(su.sau)) loi.push(`co[${i}] sua cần { truong, truoc, sau } và truoc ≠ sau`);
      else if (!/^(de|pa\.[A-D]|y\.[a-d]|bang)$/.test(chuoi2(su.truong))) loi.push(`co[${i}] sua.truong lạ ${chuoi2(su.truong)} (de | pa.A–D | y.a–d | bang)`);
      else {
        const tr = chuoi2(su.truong), truoc = String(su.truoc);
        const coMat = tr === "de" ? vao.de.includes(chuHtml(truoc)) : tr === "bang" ? true : (vao.y.find((x) => x.id === tr.split(".")[1])?.t ?? "").includes(truoc);
        if (!coMat) loi.push(`co[${i}] sua.truoc không có nguyên văn trong ${tr} của đề`);
      }
    }
    if (c?.chot !== void 0 && !chuoi2(c.chot)) loi.push(`co[${i}] chot rỗng`);
  });
  if (h.daChot !== void 0) {
    if (!Array.isArray(h.daChot)) loi.push("daChot không phải mảng");
    else h.daChot.forEach((c, i) => {
      if (!chuoi2(c?.ghi) || !chuoi2(c?.chot)) loi.push(`daChot[${i}] cần { ghi, chot }`);
    });
  }
  for (const s of chuTrongHoSo(h)) {
    for (const m of s.matchAll(/<\/?([a-zA-Z0-9]+)([^>]*)>/g)) {
      if (!THE_DUOC.has(m[1].toLowerCase())) loi.push(`thẻ HTML cấm <${m[1]}>`);
      if (m[2].trim()) loi.push("thẻ HTML không được có thuộc tính");
    }
    let sau = 0;
    for (const ch of s) {
      if (ch === "{") sau++;
      if (ch === "}") sau--;
      if (sau < 0 || sau > 1) break;
    }
    if (sau !== 0) loi.push("ngoặc nhọn công thức lệch: " + s.slice(0, 40));
    if (/(^|[^\p{L}])AI([^\p{L}]|$)/u.test(s)) canhBao.push('có chữ "AI"');
  }
  return { loi: [...new Set(loi)], canhBao: [...new Set(canhBao)] };
}
function laHoSoSach(hoSo) {
  return laObj(hoSo) && Array.isArray(hoSo.co) && !hoSo.co.some((c) => c?.loai === "dapAn");
}
function gonHoSo(hoSo) {
  const { de: _de, so: _so, nguon: _ng, chuong: _ch, ...con } = hoSo;
  void _de;
  void _so;
  void _ng;
  void _ch;
  if (Array.isArray(con.y)) con.y = con.y.map((y) => {
    const { t: _t, ...r } = y;
    void _t;
    return r;
  });
  if (laObj(con.mc)) con.mc = { d: con.mc.d };
  return { khuon: KHUON_HO_SO, ...con };
}

// src/lib/loi-giai-bo.ts
var BO_CHIA_KHOA = {
  "CARBOHYDRATE": {
    "ma": "CARBOHYDRATE",
    "chuong": "Carbohydrate",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Soi cấu tạo",
        "rule": "Glucose mạch hở {CH2OH[CHOH]4CHO}: 5 –OH, 1 –CHO; fructose {CH2OH[CHOH]3COCH2OH}: C=O ở C2. Vòng: glucose có –OH <b>hemiacetal</b>, fructose –OH <b>hemiketal</b>. Tinh bột, maltose: α-glucose, <b>α-1,4</b> (amylopectin thêm α-1,6 → nhánh). Cellulose: β-glucose, <b>β-1,4</b>, mạch thẳng. Saccharose: <b>α-1,2</b>, hết –OH hemi. Mỗi liên kết glycoside mất 2 –OH: mắt xích cellulose còn 3, {[C6H7O2(OH)3]n}, cả phân tử 3n; maltose còn 7 –OH alcohol + 1 hemiacetal."
      },
      "k2": {
        "ten": "Bảng thuốc thử",
        "rule": "{Cu(OH)2} thường → <b>xanh lam</b>: nhiều –OH kề (glucose, fructose, saccharose, maltose, glycerol); tinh bột, cellulose không; protein cho màu tím. Tollens → Ag, {Cu(OH)2}/kiềm đun → {Cu2O} đỏ gạch: glucose, maltose, cả fructose (kiềm chuyển thành glucose); <b>saccharose, tinh bột, cellulose không</b>. Nước {Br2}: chỉ glucose, maltose. {I2}: tinh bột xanh tím. Glucose + Tollens → ammonium gluconate; + {Br2} → gluconic acid; + {H2}/Ni → sorbitol."
      },
      "k3": {
        "ten": "Đọc sơ đồ chuyển hoá",
        "rule": "Gọi tên theo chất vào → ra. {CO2} → tinh bột: <b>quang hợp</b>. Cắt glycoside hay ester bằng {H2O}: <b>thuỷ phân</b> (saccharose → glucose + fructose; tinh bột → maltose → glucose; cellulose → glucose); monosaccharide không thuỷ phân. Glucose → {C2H5OH} + {CO2}: <b>lên men rượu</b> (oxi hoá – khử, toả nhiệt); → lactic acid {CH3CH(OH)COOH}: lên men lactic; ethanol → acetic acid: lên men giấm. –OH + {HNO3}, anhydride: <b>ester hoá</b>. Gluconate + HCl → gluconic acid {C6H12O7}."
      },
      "k4": {
        "ten": "Quy trình thí nghiệm",
        "rule": "Hỏi mỗi bước để làm gì. Thuỷ phân: acid + đun (cellulose: {H2SO4} 70%); {H2SO4} đặc <b>than hoá</b>. Trước Tollens, {Cu(OH)2}: <b>trung hoà acid</b> ({NaHCO3} hết bọt, {NaOH} đến quỳ xanh). Đường khử + {Cu(OH)2}: không đun → xanh lam, đun → đỏ gạch. Iodine còn xanh tím: <b>chưa thuỷ phân hết</b>; đun mất màu, nguội hiện lại. Nitrate hoá: trộn acid trong nước đá, dùng bông. Tách cồn: chưng cất."
      },
      "k5": {
        "ten": "Dây chuyền mol",
        "rule": "Quy về mắt xích, nhân hệ số: {C6H10O5} 162 → glucose 180 → <b>2</b>{C2H5OH}; glucose → <b>2</b>Ag, 2 lactic acid; saccharose 342 → <b>4</b>Ag, 4{C2H5OH}; mắt xích → trinitrate 297 (3{HNO3}), triacetate 288. Ra sản phẩm <b>× H</b>, tìm nguyên liệu <b>÷ H</b>; nhiều giai đoạn nhân các H. Rượu a°: V ethanol = V·a/100; m = D·V; lớp bạc V = S·dày. %N = 14x : (162 + 45x), x = số –{ONO2}."
      },
      "k6": {
        "ten": "Năng lượng & quang hợp",
        "rule": "ΔrH = Σ ΔfH(sản phẩm) − Σ ΔfH(chất đầu), nhân hệ số. Quang hợp <b>thu nhiệt</b>, hút {CO2} (chu trình carbon); oxi hoá glucose toả nhiệt. Năng lượng = mức/cm<sup>2</sup>/phút × diện tích × phút × % hữu ích; 1 m<sup>2</sup> = 10<sup>4</sup> cm<sup>2</sup>. n = năng lượng : |ΔH|; <b>1 mắt xích ↔ 1 glucose ↔ 6{CO2} ↔ 6{O2}</b>. Cháy, nổ: cân bằng nguyên tố trước, rồi tính ΔH, mol khí."
      },
      "k7": {
        "ten": "Vật lí & ứng dụng",
        "rule": "Độ ngọt tăng dần: <b>maltose, glucose, saccharose, fructose</b>. Glucose, fructose, saccharose: rắn, tan tốt. Tinh bột không tan nước lạnh, nước nóng thành hồ (keo); cellulose không tan, tan trong nước Schweizer. Cellulose trinitrate: rắn trắng, không tan, cháy không khói (thuốc súng); triacetate: tơ acetate. Saccharose: mía, củ cải đường, thốt nốt; mạch nha: maltose; gạo, ngô, sắn, bánh mì: tinh bột; ethanol: xăng E5."
      }
    },
    "TRAPS_THEM": {
      "tinhkhu": {
        "ten": "Nhầm tính khử",
        "hoi": "Chất có –CHO tự do không? Saccharose, tinh bột, cellulose không tráng bạc; fructose tráng bạc nhưng không làm mất màu nước bromine."
      },
      "hieusuat": {
        "ten": "Nhầm chiều hiệu suất",
        "hoi": "Đang tính sản phẩm thu được (nhân H) hay nguyên liệu cần dùng (chia H)? Có nhân, chia H hai lần không?"
      }
    },
    "DANG_KEY": {
      "CARBOHYDRATE.CAU_TAO.CHON_PHAT_BIEU": "k1",
      "CARBOHYDRATE.CAU_TAO.DEM_DONG_PHAN": "k6",
      "CARBOHYDRATE.CAU_TAO.GOI_TEN": "k3",
      "CARBOHYDRATE.CAU_TAO.NHAN_DANG": "k1",
      "CARBOHYDRATE.CAU_TAO.TINH_KHOI_LUONG": "k6",
      "CARBOHYDRATE.CAU_TAO.TINH_NANG_LUONG": "k6",
      "CARBOHYDRATE.CAU_TAO.TINH_PHAN_TRAM": "k5",
      "CARBOHYDRATE.CAU_TAO.VIET_CTCT": "k1",
      "CARBOHYDRATE.CAU_TAO.XAC_DINH_CTPT": "k3",
      "CARBOHYDRATE.LEN_MEN.CHON_PHAT_BIEU": "k3",
      "CARBOHYDRATE.LEN_MEN.NHAN_DANG": "k3",
      "CARBOHYDRATE.LEN_MEN.SO_SANH": "k3",
      "CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG": "k5",
      "CARBOHYDRATE.LEN_MEN.TINH_PHAN_TRAM": "k5",
      "CARBOHYDRATE.LEN_MEN.TINH_THE_TICH": "k5",
      "CARBOHYDRATE.LEN_MEN.XAC_DINH_CHAT": "k3",
      "CARBOHYDRATE.PHAN_UNG_MAU.CHON_PHAT_BIEU": "k4",
      "CARBOHYDRATE.PHAN_UNG_MAU.NHAN_DANG": "k2",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.CHON_PHAT_BIEU": "k2",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.DEM_DONG_PHAN": "k2",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.NHAN_DANG": "k2",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.SO_SANH": "k2",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_KHOI_LUONG": "k5",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_PHAN_TRAM": "k5",
      "CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_SO_MOL": "k5",
      "CARBOHYDRATE.THUY_PHAN.CHON_PHAT_BIEU": "k1",
      "CARBOHYDRATE.THUY_PHAN.SO_SANH": "k3",
      "CARBOHYDRATE.THUY_PHAN.TINH_KHOI_LUONG": "k6",
      "CARBOHYDRATE.THUY_PHAN.TINH_NANG_LUONG": "k6",
      "CARBOHYDRATE.THUY_PHAN.XAC_DINH_CHAT": "k3",
      "CARBOHYDRATE.TINH_CHAT_VAT_LI.SO_SANH": "k7",
      "CARBOHYDRATE.UNG_DUNG.CHON_PHAT_BIEU": "k4",
      "CARBOHYDRATE.UNG_DUNG.NHAN_DANG": "k5",
      "CARBOHYDRATE.UNG_DUNG.TINH_KHOI_LUONG": "k5",
      "CARBOHYDRATE.UNG_DUNG.TINH_THE_TICH": "k5"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  },
  "DIEN_PHAN": {
    "ma": "DIEN_PHAN",
    "chuong": "Pin điện và điện phân",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "So E°, đoán chiều",
        "rule": "Phản ứng tự xảy ra khi <b>E° cặp chứa chất oxi hoá > E° cặp chứa chất khử</b> (quy tắc α), sinh ra chất oxi hoá và chất khử yếu hơn. Đếm phản ứng: mỗi phản ứng tìm đúng hai cặp rồi so. Dãy E° tăng: Mg, Al, Zn, Fe, Ni, Sn, Pb, {H2} (0), Cu (0,340), Fe³⁺/Fe²⁺ (0,771), Ag (0,799), {O2}/{H2O}. E° < 0 mới đẩy {H2} khỏi acid loãng."
      },
      "k2": {
        "ten": "Suy dãy từ phản ứng",
        "rule": 'Không cho số E°: mỗi phản ứng xảy ra cho <b>hai bất đẳng thức</b>: chất khử vế trái mạnh hơn chất khử vế phải; chất oxi hoá vế trái mạnh hơn chất oxi hoá vế phải. "Không phản ứng" thì đảo lại. Ghép thành một dãy. Kim loại khử càng mạnh, ion của nó oxi hoá càng yếu. Kim loại đẩy được {H2} khỏi HCl ⇒ E° âm.'
      },
      "k3": {
        "ten": "Pin Galvani",
        "rule": "Cặp E° nhỏ là <b>anode (cực âm)</b>: kim loại bị oxi hoá, tan dần. Cặp E° lớn là <b>cathode (cực dương)</b>: ion bị khử; điện cực Pt không đổi khối lượng. E°pin = E°(cathode) − E°(anode) > 0, vôn kế chỉ số dương. Cầu muối: <b>cation về cathode, anion về anode</b>. Chỉ phản ứng oxi hoá – khử <b>tự xảy ra</b> mới lập được pin; không tự xảy ra thì phải điện phân."
      },
      "k4": {
        "ten": "Phóng điện – nạp điện",
        "rule": "<b>Phóng điện</b> = pin: hoá năng → điện năng, cực âm là anode, bị oxi hoá. <b>Nạp điện</b> = điện phân: điện năng → hoá năng, mọi quá trình đảo chiều. Acquy chì phóng: Pb và {PbO2} đều thành {PbSO4} bám cực ⇒ hai cực cùng nặng thêm (+96 và +64 g/mol), {H2SO4} giảm; chì độc. Li-ion phóng: Li⁺ sang cực dương. Pin nhiên liệu: điện năng ≈ |ΔrH|, nhiên liệu thật = lí thuyết : H."
      },
      "k5": {
        "ten": "Thứ tự điện phân",
        "rule": "Anode nối cực (+), oxi hoá; cathode nối cực (−), khử. <b>Cathode</b>: E° lớn bị khử trước: Ag⁺ > Fe³⁺ (→ Fe²⁺) > Cu²⁺ > H⁺ (acid) > Fe²⁺, Ni²⁺, Zn²⁺ (vẫn trước nước). K⁺, Na⁺, Mg²⁺, Al³⁺ không bị khử, nước bị khử thay: {H2} + OH⁻, pH tăng. <b>Anode trơ</b>: Cl⁻, Br⁻ trước nước; {SO4}²⁻, {NO3}⁻ không bị oxi hoá, nước bị oxi hoá: {O2} + H⁺, pH giảm. Anode bằng Cu thì Cu tan."
      },
      "k6": {
        "ten": "Điện phân sản xuất",
        "rule": "Na, Al chỉ điều chế được bằng <b>điện phân nóng chảy</b>. {Al2O3} (từ bauxite) trộn cryolite: <b>hạ nhiệt độ nóng chảy, tăng dẫn điện</b>; Al ra ở cathode, {O2} ở anode đốt mòn than; không dùng {AlCl3} (thăng hoa). {NaCl} dung dịch <b>có màng ngăn</b> → {NaOH} (cô đặc, kết tinh) + {H2} + {Cl2}; <b>không màng ngăn</b> → {Cl2} gặp {NaOH} ra nước Javel (tẩy màu, diệt khuẩn), gộp: {NaCl} + {H2O} → {NaClO} + {H2}."
      },
      "k7": {
        "ten": "Định luật Faraday",
        "rule": "q = I·t = n(e)·F ⇒ <b>n(chất) = It : (zF)</b>, F = 96500 C/mol (đề cho số khác thì theo đề). t tính bằng <b>giây</b>; 1 A·h = 3600 C. z = số electron một ion, phân tử trao đổi: Ag⁺ 1, Cu²⁺ 2, Al³⁺ 3, {Cl2} 2, {H2} 2, {O2} 4; hợp chất thì lấy độ đổi số oxi hoá. Hiệu suất: sản phẩm thực = lí thuyết × H; điện lượng, thời gian cần = lí thuyết : H."
      }
    },
    "TRAPS_THEM": {
      "doicuc": {
        "ten": "Đảo cực",
        "hoi": "Đang là pin hay bình điện phân? Anode luôn oxi hoá; pin: anode là cực âm, điện phân: anode nối cực dương."
      },
      "soe": {
        "ten": "Sai số electron",
        "hoi": "Một ion, phân tử trao đổi mấy electron? Thời gian đã đổi ra giây chưa? Hiệu suất nhân hay chia?"
      }
    },
    "DANG_KEY": {
      "DIEN_PHAN.THE_DIEN_CUC.CHON_PHAT_BIEU": "k2",
      "DIEN_PHAN.THE_DIEN_CUC.DEM_DONG_PHAN": "k1",
      "DIEN_PHAN.THE_DIEN_CUC.SO_SANH": "k2",
      "DIEN_PHAN.THE_DIEN_CUC.XAC_DINH_CHAT": "k1",
      "DIEN_PHAN.PIN_GALVANI.CHON_PHAT_BIEU": "k3",
      "DIEN_PHAN.PIN_GALVANI.DEM_DONG_PHAN": "k3",
      "DIEN_PHAN.PIN_GALVANI.TINH_KHOI_LUONG": "k7",
      "DIEN_PHAN.PIN_GALVANI.TINH_THE_TICH": "k7",
      "DIEN_PHAN.NGUON_DIEN.CHON_PHAT_BIEU": "k4",
      "DIEN_PHAN.NGUON_DIEN.NHAN_DANG": "k4",
      "DIEN_PHAN.NGUON_DIEN.TINH_KHOI_LUONG": "k4",
      "DIEN_PHAN.DIEN_PHAN_DD.CHON_PHAT_BIEU": "k5",
      "DIEN_PHAN.DIEN_PHAN_DD.SO_SANH": "k5",
      "DIEN_PHAN.DIEN_PHAN_DD.DEM_DONG_PHAN": "k5",
      "DIEN_PHAN.DIEN_PHAN_DD.NHAN_DANG": "k5",
      "DIEN_PHAN.DIEN_PHAN_DD.XAC_DINH_SO_OXI_HOA": "k7",
      "DIEN_PHAN.DIEN_PHAN_DD.TINH_THE_TICH": "k6",
      "DIEN_PHAN.DIEN_PHAN_NC.CHON_PHAT_BIEU": "k6",
      "DIEN_PHAN.MA_TINH_LUYEN.XAC_DINH_DIEN_TICH": "k7"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  },
  "ESTER": {
    "ma": "ESTER",
    "chuong": "Ester – lipid",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Tách chất",
        "rule": "Hai lớp → <b>chiết</b> (chất có D nhỏ nằm trên). Một lớp → so nhiệt độ sôi: chênh nhiều thì <b>chưng cất thường</b>, chênh ít thì <b>chưng cất phân đoạn</b>, gần trùng thì phải đổi cách. Chất rắn lẫn tạp → <b>kết tinh lại</b>."
      },
      "k2": {
        "ten": "An toàn & dụng cụ",
        "rule": "Chất dễ cháy, sôi thấp: <b>không lửa trần</b>, dùng nước nóng. Nguồn nhiệt phải <b>nóng hơn nhiệt độ sôi</b>. Sinh hàn: <b>nước vào thấp, ra cao</b>. Đá bọt chống sôi bùng. Đun lâu mà không mất chất: <b>hồi lưu</b>."
      },
      "k3": {
        "ten": "Vai trò hoá chất",
        "rule": "Với mỗi chất, hỏi: <b>thêm vào để làm gì</b>, và <b>thay bằng chất khác có phá sản phẩm không</b>. {H2SO4} đặc: xúc tác + hút nước. {Na2CO3}: trung hoà acid. {NaOH} dư: thuỷ phân mất ester. {NaCl} bão hoà: tách lớp gọn. Chất làm khan: hút nước."
      },
      "k4": {
        "ten": "Con số",
        "rule": 'Hiệu suất: <b>V → m → n → chất thiếu → lí thuyết → × H → × (1 − hao hụt)</b>. Bảng số liệu: "tăng nhiều nhất" là <b>hiệu số lớn nhất</b>, "tối ưu" là <b>đỉnh</b>, "càng… càng" phải đúng trên <b>cả dãy</b>.'
      },
      "k5": {
        "ten": "Soi phân tử",
        "rule": "Đếm từng nhóm rồi cộng. {NaOH}: ester thường 1, ester của phenol 2, –COOH 1, –OH phenol 1. {Br2}: C=C 1, vòng phenol thế vào vị trí o/p còn trống. {H2}: C=C 1, vòng 3, C=O của –COO– không cộng. Ester hoá: <b>acid mất –OH, alcohol mất H</b>."
      },
      "k6": {
        "ten": "Tính chất vật lí",
        "rule": "Nổi hay chìm do <b>khối lượng riêng</b>; tan hay không do <b>phân cực, liên kết hydrogen</b>. Mạch dài → nóng chảy cao; thêm C=C cis → gấp khúc → nóng chảy thấp. Ester không có liên kết hydrogen giữa các phân tử nên sôi thấp hơn acid."
      }
    },
    "TRAPS_THEM": {},
    "LAB_PRESETS": {
      "k1": [
        "q1",
        "q6",
        "q7",
        "aspirin",
        "etoh",
        "dcm"
      ],
      "k2": [
        "q1c",
        "q1d",
        "q6d",
        "hoiluu",
        "sai3"
      ],
      "k3": [
        "naoh",
        "kettinh",
        "h3po4"
      ],
      "k4": [
        "iaac",
        "aspirin",
        "cin",
        "etac",
        "bang-q7",
        "bang-p3"
      ],
      "k5": [
        "msal-naoh",
        "sal-br",
        "msal-h2",
        "sal-pi",
        "msal-chuc",
        "cin-geo",
        "cin-naoh",
        "phac-naoh",
        "builder-cin",
        "builder-acr",
        "gh",
        "ir"
      ],
      "k6": [
        "tan",
        "fat-18",
        "fat-ol-li",
        "fat-16",
        "fat-pal"
      ]
    },
    "DANG_KEY": {},
    "daDuyet": "thầy dùng từ 28/09 (Phòng thí nghiệm Ester)"
  },
  "HOP_CHAT_N": {
    "ma": "HOP_CHAT_N",
    "chuong": "Hợp chất chứa nitrogen",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Bậc, tên, phổ IR",
        "rule": "Bậc amine = <b>số gốc hydrocarbon gắn vào N</b>, không xét bậc carbon: {RNH2} bậc I, {R2NH} bậc II, {R3N} bậc III. Tên thay thế: mạch chính chứa C gắn N + vị trí + amine, gốc trên N ghi <i>N-</i>: {CH3CH2CH2NHCH3} là N-methylpropan-1-amine. Amino acid: thường alanine, bán hệ thống α-aminopropionic acid, thay thế 2-aminopropanoic acid. IR: N–H ở <b>3500–3300 cm<sup>−1</sup></b>; bậc III không có."
      },
      "k2": {
        "ten": "Sôi, tan, trạng thái",
        "rule": "Sôi giảm dần khi M xấp xỉ: <b>acid, alcohol, amine</b> (liên kết hydrogen O–H mạnh hơn N–H); cùng loại, M lớn sôi cao; bậc III không có N–H nên sôi thấp. <b>Khí</b> ở điều kiện thường: methylamine, dimethylamine, trimethylamine, ethylamine. Aniline lỏng, <b>hầu như không tan</b>, nặng hơn nước (vẩn đục, lắng đáy). Amino acid rắn, nóng chảy cao, dễ tan trong nước (ion lưỡng cực)."
      },
      "k3": {
        "ten": "Amine gặp thuốc thử",
        "rule": "Base yếu (⇌), mạnh dần: <b>{C6H5NH2}, {NH3}, {CH3NH2}, {(CH3)2NH}</b>; trimethylamine trong nước yếu hơn hai amine no này (vẫn mạnh hơn {NH3}). Amine no: quỳ hoá xanh, {FeCl3} → {Fe(OH)3} nâu đỏ; aniline không đổi màu quỳ. {HCl}: tạo muối tan; muối + {NaOH} → amine tách ra (aniline vẩn đục lại); {RNH3}<sup>+</sup> là acid Brønsted. {NaOH}: không phản ứng. {Br2}: chỉ aniline, kết tủa trắng. {HNO2}: bậc I no → alcohol + {N2}; aniline (0–5 °C) → muối diazonium; bậc II không ra {N2}."
      },
      "k4": {
        "ten": "Điều chế & con số",
        "rule": "{NH3} + {CH3Br} thế <b>lần lượt từng H</b> → bậc I, II, III (không nối dài mạch). Nitrobenzene + {Fe/HCl} → {C6H5NH3Cl}, thêm {NaOH} → aniline. Số oxi hoá N: –{NO2} +3, {HNO2} +3, {N2} 0, amine −3 ⇒ nitrobenzene là <b>chất oxi hoá</b>; amine gặp {HNO2} là <b>chất khử</b>. Hiệu suất: V × D → m → n (bảo toàn N); tìm nguyên liệu <b>÷ H</b>. pH: x<sup>2</sup> : (C − x) = K<sub>b</sub>, x = [OH<sup>−</sup>], pH = 14 − pOH."
      },
      "k5": {
        "ten": "Amino acid lưỡng tính",
        "rule": "Có –{NH2} và –{COOH} → phản ứng cả acid lẫn base. <b>{HCl} dư</b>: –{NH2} → –{NH3Cl}, –{COONa} → –{COOH}. <b>{NaOH} dư</b>: –{NH3Cl} → –{NH2}; –{COOH} → –{COONa} (M + 22 mỗi nhóm); –{COOR} → –{COONa} + ROH. Alcohol/{HCl} → muối ester. Dư –{COOH} hay có –{NH3Cl}: acid; dư –{NH2}: base. Điện di: pH thấp, cation về <b>cực âm</b>; pH cao, anion về <b>cực dương</b>; pH ≈ pI đứng yên. M: Gly 75, Ala 89, Glu 147 (hai –{COOH})."
      },
      "k6": {
        "ten": "Peptide: đếm & tính",
        "rule": "n gốc → <b>n − 1</b> liên kết peptide, mất n − 1 {H2O}; gốc kiểu Gly, Ala thì có n N, <b>n + 1</b> O. Số trật tự = số hoán vị (3 Gly + 1 Ala → 4). Trong {NaOH}: n({NaOH}) = tổng –{COOH} các gốc (Glu tính 2); n({H2O}) = n(peptide), +1 mỗi Glu; rồi bảo toàn khối lượng. Thuỷ phân một phần: ghép các đoạn chồng khớp. Màu biuret <b>từ tripeptide</b>; dipeptide không."
      },
      "k7": {
        "ten": "Protein & tên phản ứng",
        "rule": "Vai trò: cấu trúc (collagen, keratin), xúc tác (enzyme: chọn lọc cao, tăng tốc độ phản ứng sinh hoá), vận chuyển (hemoglobin), điều hoà (insulin), bảo vệ (kháng thể). <b>Đông tụ</b> khi đun, gặp acid, base, muối kim loại nặng; {HNO3} đặc → vàng. Tên phản ứng: cắt –CO–NH– là <b>thuỷ phân</b>; + alcohol/{HCl} là <b>ester hoá</b>; amino acid nối mạch, tách {H2O} là <b>trùng ngưng</b>; {Cu(OH)2}/kiềm → tím là <b>màu biuret</b>."
      }
    },
    "TRAPS_THEM": {
      "bacamine": {
        "ten": "Nhầm bậc amine",
        "hoi": "Đếm số gốc hydrocarbon gắn vào N. Carbon mang nhóm –NH2 bậc mấy không quyết định bậc amine."
      },
      "nhomnhanh": {
        "ten": "Sót nhóm mạch nhánh",
        "hoi": "Glu có hai –COOH, Lys có hai –NH2. Khi đếm NaOH, HCl, số O, đã tính nhóm ở mạch nhánh chưa?"
      }
    },
    "DANG_KEY": {
      "HOP_CHAT_N.AMINE_CAU_TAO.CHON_PHAT_BIEU": "k1",
      "HOP_CHAT_N.AMINE_CAU_TAO.SO_SANH": "k2",
      "HOP_CHAT_N.AMINE_CAU_TAO.TINH_HANG_SO": "k4",
      "HOP_CHAT_N.AMINE_CAU_TAO.TINH_HIEU_SUAT": "k4",
      "HOP_CHAT_N.AMINE_DIEU_CHE.CHON_PHAT_BIEU": "k4",
      "HOP_CHAT_N.AMINE_TINH_BASE.NHAN_DANG": "k3",
      "HOP_CHAT_N.AMINE_TINH_BASE.SO_SANH": "k3",
      "HOP_CHAT_N.AMINE_TINH_BASE.VIET_CTCT": "k5",
      "HOP_CHAT_N.AMINO_ACID.CHON_PHAT_BIEU": "k5",
      "HOP_CHAT_N.AMINO_ACID.SO_SANH": "k1",
      "HOP_CHAT_N.AMINO_ACID.VIET_CTCT": "k5",
      "HOP_CHAT_N.AMINO_ACID.XAC_DINH_CHAT": "k5",
      "HOP_CHAT_N.AMINO_ACID.XAC_DINH_CTPT": "k5",
      "HOP_CHAT_N.PEPTIDE.CHON_PHAT_BIEU": "k6",
      "HOP_CHAT_N.PEPTIDE.TINH_KHOI_LUONG": "k6",
      "HOP_CHAT_N.PEPTIDE.TINH_NONG_DO": "k6",
      "HOP_CHAT_N.PROTEIN.CHON_PHAT_BIEU": "k7",
      "HOP_CHAT_N.PROTEIN.DEM_DONG_PHAN": "k7",
      "HOP_CHAT_N.PROTEIN.SO_SANH": "k7"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  },
  "KIM_LOAI": {
    "ma": "KIM_LOAI",
    "chuong": "Đại cương kim loại",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Liên kết kim loại",
        "rule": "Nút mạng là <b>cation kim loại</b>, giữa là <b>electron hoá trị tự do</b>, hút nhau bằng lực tĩnh điện. So với liên kết ion ({NaCl}): giống ở tĩnh điện và cation kim loại, khác ở phần âm (electron tự do ↔ anion cố định). Electron tự do gây dẫn điện, dẫn nhiệt, ánh kim, dẻo. Kim loại có 1–3 electron lớp ngoài: Na 1, Mg 2, Al 3 (3s²3p¹)."
      },
      "k2": {
        "ten": "Dãy thế điện cực",
        "rule": "E° càng nhỏ, kim loại <b>khử càng mạnh</b>, ion oxi hoá càng yếu. Dãy E° tăng: K, Na, Mg, Al, Zn, Fe, Ni, Sn, Pb, {H2}, Cu, Fe²⁺ (cặp Fe³⁺/Fe²⁺), Ag, Au. Chất khử cặp trước + chất oxi hoá cặp sau → phản ứng. E° < 0 khử được H⁺ acid loãng; E° < −0,41 V khử được nước (xét theo thế); Cu chỉ tan trong acid loãng khi có {O2}."
      },
      "k3": {
        "ten": "Sản phẩm kim loại",
        "rule": "Kim loại luôn <b>bị oxi hoá</b> (số oxi hoá tăng từ 0); chất có số oxi hoá giảm mới là chất oxi hoá. Fe gặp H⁺, Cu²⁺, Fe³⁺ chỉ lên <b>Fe²⁺</b>; Fe³⁺ gặp Cu chỉ về Fe²⁺, không ra Fe. {H2SO4} đặc, {HNO3} hoà tan cả Cu, sinh {SO2}, NO…, không sinh {H2}. Kim loại mạnh đẩy kim loại yếu khỏi muối (trừ Na, K, Ca, Ba: gặp nước trước)."
      },
      "k4": {
        "ten": "Ăn mòn điện hoá",
        "rule": "<b>Đủ ba điều kiện</b>: hai điện cực khác chất (Fe – Cu, Fe – C, kim loại bám lên), tiếp xúc nhau, cùng chạm hơi ẩm hay chất điện li. Thiếu một: <b>ăn mòn hoá học</b>. Kim loại E° nhỏ hơn là anode, bị ăn mòn. Cực kia: acid ra {H2}; trung tính chỉ {O2} bị khử. Gỉ: {Fe2O3}·n{H2O}. Chống: Zn, Mg hi sinh; phủ dầu, sơn. Al có màng oxide bền."
      },
      "k5": {
        "ten": "Chọn cách điều chế",
        "rule": "K … Al: <b>điện phân nóng chảy</b>. <b>Nhiệt luyện</b> = C, CO, {H2}, Al, Si khử oxide ở nhiệt độ cao (Zn … Cu; cả Mg bằng Si). <b>Thuỷ luyện</b> = hoà tan rồi cho kim loại mạnh hơn đẩy ra (Zn đẩy Au). Quặng sulfide đốt thành oxide trước, sinh {SO2} độc. Chỉ bước biến ion thành kim loại là oxi hoá – khử. Tái chế tốn ít năng lượng hơn."
      },
      "k6": {
        "ten": "Tính theo chuỗi",
        "rule": "Chất chính = m × %, đổi mol (tấn → tấn·mol). <b>Bảo toàn nguyên tố</b> hoặc cộng các phương trình: {Fe2O3} → 2Fe, {Cu2S} → 2Cu, 2{KCN} → Au. Sản phẩm <b>× H</b>, nguyên liệu <b>: H</b>, rồi chia % kim loại trong sản phẩm. Rắn đổi khối lượng: độ chênh : Δm của 1 mol. Có dòng điện: It : F = n(e) = z·n(kim loại), F = 96500. ΔrH° = ΣΔfH°(sản phẩm) − ΣΔfH°(chất đầu), âm là toả nhiệt, tính theo mol."
      },
      "k7": {
        "ten": "Hợp kim",
        "rule": "Hợp kim thường cứng hơn, nóng chảy thấp hơn, dẫn điện kém hơn kim loại thành phần. Đo hàm lượng: chọn thuốc thử <b>hoà tan hết một kim loại, không đụng kim loại kia</b> (Al tan trong kiềm; Cu tan trong {HNO3}, Fe³⁺, {H2SO4} đặc, Au thì không) và <b>không đẩy kim loại mới bám vào</b> (loại Ag⁺, Au³⁺). % = m rắn còn lại : m mẫu."
      }
    },
    "TRAPS_THEM": {
      "nacoxihoa": {
        "ten": "Nhầm nấc oxi hoá",
        "hoi": "Chất oxi hoá này đủ mạnh đưa Fe lên Fe³⁺ không? Fe³⁺ gặp Cu chỉ về Fe²⁺, không ra Fe."
      },
      "haidiencuc": {
        "ten": "Nhầm kiểu ăn mòn",
        "hoi": "Đủ hai điện cực khác chất, tiếp xúc nhau, cùng trong dung dịch điện li chưa? Thiếu một là ăn mòn hoá học."
      }
    },
    "DANG_KEY": {
      "KIM_LOAI.LIEN_KET_KIM_LOAI.NHAN_DANG": "k1",
      "KIM_LOAI.TINH_KHU.NHAN_DANG": "k2",
      "KIM_LOAI.TINH_KHU.CHON_PHAT_BIEU": "k2",
      "KIM_LOAI.AN_MON.CHON_PHAT_BIEU": "k4",
      "KIM_LOAI.AN_MON.NHAN_DANG": "k4",
      "KIM_LOAI.AN_MON.SO_SANH": "k4",
      "KIM_LOAI.DIEU_CHE.CHON_PHAT_BIEU": "k5",
      "KIM_LOAI.DIEU_CHE.TINH_KHOI_LUONG": "k6",
      "KIM_LOAI.UNG_DUNG.TINH_KHOI_LUONG": "k6",
      "KIM_LOAI.HOP_KIM.CHON_PHAT_BIEU": "k7",
      "KIM_LOAI.HOP_KIM.TINH_PHAN_TRAM": "k7",
      "KIM_LOAI.HOP_KIM.DEM_DONG_PHAN": "k7"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  },
  "KIM_LOAI_IA_IIA": {
    "ma": "KIM_LOAI_IA_IIA",
    "chuong": "Kim loại nhóm IA, IIA",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Độ mạnh kim loại",
        "rule": "Tính khử tăng <b>xuống dưới nhóm</b> (Li → Cs, Be → Ba). Ở nhiệt độ thường chỉ <b>nhóm IA và Ca, Sr, Ba</b> tác dụng mạnh với nước → hydroxide + {H2}, phenolphthalein hoá hồng, là dấu hiệu kim loại mạnh; <b>Mg</b> chỉ phản ứng chậm với nước nóng, <b>Be</b> không phản ứng. Kim loại kiềm mềm, nhẹ, nóng chảy thấp (giảm Li → Cs), bảo quản trong <b>dầu hoả, khí hiếm, chân không</b>."
      },
      "k2": {
        "ten": "Màu ngọn lửa",
        "rule": "Đốt hợp chất trên ngọn lửa đèn khí: màu do <b>ion kim loại</b>, gốc acid không ảnh hưởng. <b>Li đỏ tía, Na vàng, K tím nhạt, Ca đỏ cam, Sr đỏ son, Ba lục ánh vàng</b>; Be, Mg không có màu đặc trưng. Chốt kim loại bằng màu trước, rồi chốt hợp chất bằng phản ứng đi kèm (nhiệt phân, tác dụng acid hay base)."
      },
      "k3": {
        "ten": "Vòng carbonate",
        "rule": "Trục {CO3}<sup>2−</sup> ⇌ {HCO3}<sup>−</sup>: thêm {CO2} + {H2O} → hydrogencarbonate (tan); thêm OH<sup>−</sup> hoặc đun nóng → carbonate; thêm acid → {CO2}. Nhiệt phân: {NaHCO3} → {Na2CO3} (rắn giảm 62/168 = 36,9%); {Na2CO3}, {K2CO3} bền nhiệt; carbonate, nitrate nhóm IIA → oxide, bền dần từ Mg → Ba; nitrate nhóm IA → nitrite + {O2}. Sơ đồ chuyển hoá: điền chất rồi <b>viết từng mũi tên</b>; một mũi tên không có phản ứng thật là loại."
      },
      "k4": {
        "ten": "Độ tan nhóm IIA",
        "rule": "Đi xuống nhóm IIA: hydroxide <b>tan tăng</b> ({Mg(OH)2} không tan, {Ca(OH)2} ít tan, {Ba(OH)2} tan tốt), sulfate <b>tan giảm</b> ({MgSO4} tan, {CaSO4} ít tan, {BaSO4} không tan, dùng cản quang). Carbonate IIA không tan. Đục hay trong: so <b>lượng tạo ra với độ tan</b>. Thạch cao: sống {CaSO4.2H2O}, nung {CaSO4.0,5H2O} (bó bột, đúc tượng), khan {CaSO4}."
      },
      "k5": {
        "ten": "Nước cứng",
        "rule": "Ca<sup>2+</sup>, Mg<sup>2+</sup> đi với {HCO3}<sup>−</sup> → <b>tạm thời</b>; với Cl<sup>−</sup>, {SO4}<sup>2−</sup> → <b>vĩnh cửu</b>. Đun sôi, {Ca(OH)2} vừa đủ chỉ trị tạm thời; carbonate, phosphate tan, nhựa trao đổi ion trị mọi loại; {NaCl}, {HCl} không trị được. Tác hại: tốn xà phòng, đóng cặn ống, nồi hơi, thức ăn lâu chín. Tính: <b>2 × n(M<sup>2+</sup>) = tổng điện tích âm</b>; đun sôi 2{HCO3}<sup>−</sup> kéo 1 M<sup>2+</sup>; nhựa: 1 M<sup>2+</sup> đổi 2 gốc {SO3X}."
      },
      "k6": {
        "ten": "Nhiệt phản ứng",
        "rule": "Δ<sub>r</sub>H° = ΣΔ<sub>f</sub>H°(sản phẩm) − ΣΔ<sub>f</sub>H°(chất đầu), <b>nhân đủ hệ số</b>, đơn chất bền bằng 0. Δ<sub>r</sub>H° <b>dương</b> là thu nhiệt: nhiệt phân carbonate, nitrate, nung thạch cao, Pidgeon. Δ<sub>r</sub>H° <b>âm</b> là toả nhiệt: kim loại + nước hoặc phi kim, tôi vôi {CaO} + {H2O}. Nhiệt cho m gam: <b>Q = (n chất : hệ số của nó) × Δ<sub>r</sub>H°</b>; đổi kg → g, dùng M của cả tinh thể ngậm nước."
      },
      "k7": {
        "ten": "Sản xuất & tách",
        "rule": "IA, IIA khử mạnh → điều chế bằng <b>điện phân nóng chảy</b> muối chloride; điện phân dung dịch {NaCl} (màng ngăn) chỉ ra {NaOH}, {H2}, {Cl2}. Ngoại lệ Pidgeon: Si khử {MgO} (không khử {CaO}), là <b>nhiệt luyện</b>. Solvay: {NaHCO3} kết tủa vì <b>ít tan</b>, không vì acid mạnh; nung ra soda; thu hồi {NH3}, {CO2}. Tách KCl khỏi NaCl: <b>kết tinh</b>. Bảo toàn kim loại từ quặng, × H."
      }
    },
    "TRAPS_THEM": {
      "ngoaile": {
        "ten": "Ngoại lệ trong nhóm",
        "hoi": "Chất nêu ra có phải Be, Mg, Li hoặc hợp chất của chúng không? Quy luật chung của nhóm có áp được cho nó không?"
      },
      "luongdu": {
        "ten": "Vừa đủ hay dư",
        "hoi": "Chất thêm vào vừa đủ hay dư? Tính lượng tạo ra, so với độ tan hoặc lượng ion còn lại rồi mới kết luận."
      }
    },
    "DANG_KEY": {
      "KIM_LOAI_IA_IIA.TINH_CHAT_KIM_LOAI.SO_SANH": "k1",
      "KIM_LOAI_IA_IIA.TINH_CHAT_KIM_LOAI.NHAN_DANG": "k1",
      "KIM_LOAI_IA_IIA.MAU_NGON_LUA.NHAN_DANG": "k2",
      "KIM_LOAI_IA_IIA.HOP_CHAT.NHAN_DANG": "k3",
      "KIM_LOAI_IA_IIA.HOP_CHAT.VIET_CTCT": "k3",
      "KIM_LOAI_IA_IIA.HOP_CHAT.CHON_PHAT_BIEU": "k4",
      "KIM_LOAI_IA_IIA.NUOC_CUNG.CHON_PHAT_BIEU": "k5",
      "KIM_LOAI_IA_IIA.NUOC_CUNG.NHAN_DANG": "k5",
      "KIM_LOAI_IA_IIA.NUOC_CUNG.TINH_SO_MOL": "k5",
      "KIM_LOAI_IA_IIA.NUOC_CUNG.TINH_KHOI_LUONG": "k5",
      "KIM_LOAI_IA_IIA.HOP_CHAT.TINH_NANG_LUONG": "k6",
      "KIM_LOAI_IA_IIA.HOP_CHAT.DEM_DONG_PHAN": "k6",
      "KIM_LOAI_IA_IIA.SAN_XUAT.CHON_PHAT_BIEU": "k7"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  },
  "PHUC_CHAT": {
    "ma": "PHUC_CHAT",
    "chuong": "Sơ lược dãy kim loại chuyển tiếp thứ nhất và phức chất",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Kim loại chuyển tiếp",
        "rule": "Dãy thứ nhất Sc → Cu: [Ar]3d<sup>n</sup>4s<sup>2</sup>, ngoại lệ <b>Cr 3d<sup>5</sup>4s<sup>1</sup>, Cu 3d<sup>10</sup>4s<sup>1</sup></b>. Tạo ion: bỏ electron <b>4s trước</b> (Fe<sup>2+</sup> 3d<sup>6</sup>, Fe<sup>3+</sup> 3d<sup>5</sup>). Nhiều electron hoá trị → liên kết kim loại mạnh: <b>cứng, khó nóng chảy, khối lượng riêng lớn</b> (Sc, Ti nhẹ), dẫn điện, dẫn nhiệt tốt. Nhiều số oxi hoá: Fe +2, +3; Cu +1, +2; Cr +3, +6; Mn +2 đến +7."
      },
      "k2": {
        "ten": "Màu & nhận biết ion",
        "rule": "Ion có 3d chưa đầy thường có màu: Fe<sup>2+</sup> lục nhạt, Fe<sup>3+</sup> vàng nâu, Cu<sup>2+</sup> xanh lam, Co<sup>2+</sup> hồng, Ni<sup>2+</sup> xanh lục; 3d<sup>0</sup>, 3d<sup>10</sup> (Sc<sup>3+</sup>, Zn<sup>2+</sup>) không màu. {MnO4}<sup>−</sup> tím, {Cr2O7}<sup>2−</sup> da cam, {CrO4}<sup>2−</sup> vàng. Nhận biết bằng OH<sup>−</sup>: {Fe(OH)3} <b>nâu đỏ</b>; {Fe(OH)2} <b>trắng xanh</b>, để ngoài không khí hoá nâu đỏ; {Cu(OH)2} <b>xanh lam</b>."
      },
      "k3": {
        "ten": "Chuẩn độ oxi hoá – khử",
        "rule": "Chuẩn độ Fe<sup>2+</sup>: acid hoá bằng <b>{H2SO4}</b>, không dùng {HCl}, {HNO3}. {KMnO4} tự chỉ thị: dư một giọt là <b>hồng nhạt bền</b>. Tỉ lệ lấy từ electron: <b>1 {MnO4}<sup>−</sup> : 5 Fe<sup>2+</sup></b>; <b>1 {Cr2O7}<sup>2−</sup> : 6 Fe<sup>2+</sup></b>. Tổng electron nhường = nhận ({NO3}<sup>−</sup> → {NH3} nhận 8). Hai thí nghiệm song song: lượng chất chuẩn <b>chênh lệch</b> chính là phần chất cần tìm đã tiêu thụ."
      },
      "k4": {
        "ten": "Con số quy trình",
        "rule": "Đổi đơn vị trước: mg/L × L = mg; 1 m<sup>3</sup> = 1000 L. Chuẩn độ một phần mẫu thì <b>nhân ngược</b> theo tỉ lệ (15 mL trong 60 mL → × 4). <b>Bảo toàn nguyên tố</b> xuyên chuỗi: {FeCr2O4} có 2 Cr → 1 {K2Cr2O7}; Ca của vôi đi hết vào {CaSO4} → n({Ca(OH)2}) = n({SO4}<sup>2−</sup>). Độ tinh khiết = m chất : m mẫu; hiệu suất = thực tế (đã nhân độ tinh khiết) : lí thuyết."
      },
      "k5": {
        "ten": "Mổ phức chất",
        "rule": "Trong [ ]: <b>nguyên tử trung tâm</b> nhận cặp electron, <b>phối tử</b> ({H2O}, {NH3}, Cl<sup>−</sup>, OH<sup>−</sup>, CN<sup>−</sup>) cho cặp electron: liên kết cho – nhận, mỗi phối tử một liên kết σ. <b>Điện tích phức = số oxi hoá trung tâm + tổng điện tích phối tử</b> (phân tử 0, anion −1). 6 phối tử → bát diện; 4 → tứ diện hoặc vuông phẳng; 2 → thẳng. Al<sup>3+</sup> (không chuyển tiếp) cũng tạo phức aqua."
      },
      "k6": {
        "ten": "Thế phối tử & màu",
        "rule": "Phối tử mới đẩy {H2O} ra → đổi màu, có thể đổi hình học. {[Cu(OH2)6]}<sup>2+</sup> xanh + {NH3} → {[Cu(NH3)4(OH2)2]}<sup>2+</sup> <b>xanh lam đậm</b> ({Cu(OH)2} cũng tan trong {NH3} dư). {[Co(OH2)6]}<sup>2+</sup> hồng + 4Cl<sup>−</sup> ⇌ {[CoCl4]}<sup>2−</sup> xanh. Phản ứng đi về phía <b>phức bền hơn</b>. Thêm phối tử mới → chiều thuận; pha loãng (thêm nước) hoặc kéo phối tử ra ({AgNO3} tạo AgCl trắng) → chiều nghịch."
      },
      "k7": {
        "ten": "Phức aqua là acid",
        "rule": "Hoà tan muối: ion kim loại phân li rồi tạo <b>phức aqua</b> {[M(OH2)6]}<sup>n+</sup>. Phức aqua của Fe<sup>3+</sup>, Al<sup>3+</sup> nhường H<sup>+</sup>: {[M(OH2)6]}<sup>3+</sup> ⇌ {[M(OH)(OH2)5]}<sup>2+</sup> + H<sup>+</sup>, nên là <b>acid Brønsted</b>, dung dịch có môi trường acid. Số oxi hoá M <b>không đổi</b>, vẫn 6 phối tử. Thêm acid → chiều nghịch; thêm base → chiều thuận, đến hydroxide kết tủa keo (phèn làm trong nước)."
      }
    },
    "TRAPS_THEM": {
      "chieucb": {
        "ten": "Chiều cân bằng",
        "hoi": "Chất thêm vào hay bị lấy đi nằm ở vế nào? Pha loãng là thêm nước; nước nằm ở vế nào?"
      },
      "phanmau": {
        "ten": "Quên phần mẫu",
        "hoi": "Số liệu chuẩn độ là của phần mẫu nào? Đã nhân lại theo toàn bộ dung dịch và toàn bộ chất rắn chưa?"
      }
    },
    "DANG_KEY": {
      "PHUC_CHAT.KIM_LOAI_CHUYEN_TIEP.NHAN_DANG": "k1",
      "PHUC_CHAT.KIM_LOAI_CHUYEN_TIEP.TINH_KHOI_LUONG": "k4",
      "PHUC_CHAT.CHUAN_DO.TINH_KHOI_LUONG": "k3",
      "PHUC_CHAT.CHUAN_DO.TINH_HIEU_SUAT": "k3",
      "PHUC_CHAT.CAU_TAO_PHUC.CHON_PHAT_BIEU": "k5",
      "PHUC_CHAT.MAU_SAC.CHON_PHAT_BIEU": "k6"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  },
  "POLYMER": {
    "ma": "POLYMER",
    "chuong": "Polymer",
    "lop": "12",
    "KEYS": {
      "k1": {
        "ten": "Gọi tên polymer",
        "rule": "Tên = <b>poly + tên monomer</b>, tên nhiều chữ đặt trong ngoặc: poly(vinyl chloride). Nylon-n: đếm <b>tổng C trong mắt xích</b>, kể cả C của –CO–: –NH–{(CH2)5}–CO– có 6 C → nylon-6 (capron); nylon-6,6 đi từ hai monomer 6 C. Tên riêng: nitron (olon) = poly(acrylonitrile), PVA = poly(vinyl acetate), PMMA = poly(methyl methacrylate), PS = polystyrene, cao su buna = polybuta-1,3-diene."
      },
      "k2": {
        "ten": "Monomer & cách trùng",
        "rule": "Bỏ ngoặc mắt xích, nối lại C=C → ra monomer. Monomer có <b>C=C</b> hoặc vòng kém bền (caprolactam) → <b>trùng hợp</b>, không tách phân tử nhỏ. Monomer có <b>từ 2 nhóm chức</b> (–{NH2}, –{COOH}, –OH) → <b>trùng ngưng</b>, tách {H2O}: nylon-6,6 từ hexamethylenediamine + adipic acid. PVA từ vinyl acetate {CH3COOCH=CH2}, không phải {CH2=CHCOOCH3}. Cao su thiên nhiên là polyisoprene, khác buna (từ buta-1,3-diene) ở nhóm –{CH3}."
      },
      "k3": {
        "ten": "Nguồn gốc & loại",
        "rule": '<b>Thiên nhiên</b>: có sẵn (bông, đay là cellulose; tơ tằm, len là protein; cao su thiên nhiên). <b>Bán tổng hợp</b>: chế hoá từ polymer thiên nhiên (tơ visco, cellulose acetate từ cellulose). <b>Tổng hợp</b>: đi từ monomer (capron, nylon-6,6, nitron, PE, PVC, cao su buna). "Nguồn gốc cellulose" = bông, đay, visco, cellulose acetate. Theo công dụng: chất dẻo, tơ, cao su, keo dán; <b>chỉ cao su có tính đàn hồi</b>.'
      },
      "k4": {
        "ten": "Phản ứng của polymer",
        "rule": "So mạch trước và sau. Nối các mạch bằng cầu (lưu hoá cao su bằng S) → <b>tăng mạch</b>. Mạch ngắn lại: giải trùng hợp (polystyrene → styrene), thuỷ phân tinh bột, cellulose, polyamide → <b>cắt mạch</b>. Chỉ đổi nhóm thế (poly(vinyl acetate) + {NaOH} → poly(vinyl alcohol)) → <b>giữ nguyên mạch</b>. Thành chất đơn giản (tinh bột + {H2SO4} đặc → C + {H2O}) → <b>phân huỷ</b>. Polymer không có nhiệt độ nóng chảy xác định, không bay hơi."
      },
      "k5": {
        "ten": "Tính theo mắt xích",
        "rule": "Trùng hợp: 1 mắt xích = 1 monomer, n = m : M(mắt xích). Mắt xích hay gặp: {C2H3Cl} 62,5; {C4H6} 54; {C4H5Cl} 88,5; {C8H8} 104. Nhiều giai đoạn: <b>H chung = H<sub>1</sub> × H<sub>2</sub> × …</b>; tính sản phẩm thì × H, tìm nguyên liệu thì <b>÷ H</b>. Soi hệ số: 2 {C2H5OH} → 1 {C4H6}; 2 {C2H2} → 1 {C4H4}. Khí ở 25 °C, 1 bar: <b>24,79 L/mol</b>. Hệ số polymer hoá = M(polymer) : M(mắt xích)."
      },
      "k6": {
        "ten": "Mắt xích cellulose",
        "rule": "Cellulose [{C6H7O2(OH)3}]<sub>n</sub>: mỗi mắt xích <b>3 nhóm –OH</b>. Thay x nhóm –OH bằng –{OCOCH3}: <b>M = 162 + 42x</b>, số C = 6 + 2x; triacetate (x = 3) là [{C6H7O2(OOCCH3)3}]<sub>n</sub>, diacetate x = 2. Thay bằng –{ONO2}: M = 162 + 45x, trinitrate [{C6H7O2(ONO2)3}]<sub>n</sub>. Đề cho %C hoặc %N → lập phương trình theo x; x lẻ nghĩa là hỗn hợp di- và triacetate."
      }
    },
    "TRAPS_THEM": {
      "daoester": {
        "ten": "Đảo chiều ester",
        "hoi": "Gốc vinyl gắn phía O hay phía C=O? Vinyl acetate và methyl acrylate cùng công thức phân tử nhưng cho hai polymer khác nhau."
      },
      "nguongoc": {
        "ten": "Nhầm nguồn gốc tơ",
        "hoi": "Polymer có sẵn, chế hoá từ polymer thiên nhiên, hay tổng hợp từ monomer? Visco, cellulose acetate là bán tổng hợp."
      }
    },
    "DANG_KEY": {
      "POLYMER.CAU_TAO.TINH_HIEU_SUAT": "k5",
      "POLYMER.DANH_PHAP.GOI_TEN": "k1",
      "POLYMER.PHAN_LOAI.DEM_NGUYEN_TU": "k6",
      "POLYMER.PHAN_LOAI.NHAN_DANG": "k3",
      "POLYMER.PHAN_LOAI.SO_SANH": "k3",
      "POLYMER.PHAN_LOAI.TINH_HIEU_SUAT": "k5",
      "POLYMER.PHAN_LOAI.VIET_CTCT": "k6",
      "POLYMER.TINH_CHAT.DEM_DONG_PHAN": "k3",
      "POLYMER.TRUNG_HOP.TINH_KHOI_LUONG": "k5",
      "POLYMER.TRUNG_NGUNG.CHON_PHAT_BIEU": "k2",
      "POLYMER.UNG_DUNG.GOI_TEN": "k4"
    },
    "daDuyet": 'Máy chốt 29/09/2026 (thầy giao máy tự chốt mọi điểm "cần thầy chốt")'
  }
};
export {
  BAY_CHUNG,
  BIEU_TUONG,
  BO_CHIA_KHOA,
  KHUON_HO_SO,
  LOAI_CO,
  bamCau,
  boCua,
  cauTrongGoi,
  chuHtml,
  chuoiBam,
  dauVao,
  deHtml,
  gonHoSo,
  kiemHoSo,
  laHoSoSach,
  loaiCau,
  lopCua,
  tangCau,
  tinhBieuThuc
};
