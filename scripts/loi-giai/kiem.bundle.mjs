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
        "rule": "<b>Mạch hở:</b> glucose {CH2OH[CHOH]4CHO} có 5 –OH, 1 –CHO; fructose {CH2OH[CHOH]3COCH2OH} có C=O ở C2<br><b>Dạng vòng:</b> glucose có –OH <b>hemiacetal</b>, fructose có –OH <b>hemiketal</b>; saccharose hết –OH hemi<br><b>Liên kết α:</b> tinh bột, maltose từ α-glucose, <b>α-1,4</b> (amylopectin thêm α-1,6 → nhánh); saccharose <b>α-1,2</b><br><b>Liên kết β:</b> cellulose từ β-glucose, <b>β-1,4</b>, mạch thẳng<br><b>Đếm –OH:</b> mỗi liên kết glycoside mất 2 –OH<br><b>Áp dụng:</b> maltose còn 7 –OH alcohol + 1 hemiacetal; mắt xích cellulose còn 3, {[C6H7O2(OH)3]n}, cả phân tử 3n"
      },
      "k2": {
        "ten": "Bảng thuốc thử",
        "rule": "<b>{Cu(OH)2} thường:</b> nhiều –OH kề → <b>xanh lam</b>: glucose, fructose, saccharose, maltose, glycerol; tinh bột, cellulose không; protein cho màu tím<br><b>Đường khử:</b> Tollens → Ag, {Cu(OH)2}/kiềm đun → {Cu2O} đỏ gạch: glucose, maltose, cả fructose<br><b>Nước {Br2}:</b> chỉ glucose, maltose<br><b>{I2}:</b> tinh bột → xanh tím<br><b>Sản phẩm glucose:</b> + Tollens → ammonium gluconate; + {Br2} → gluconic acid; + {H2}/Ni → sorbitol<br><b>Bẫy hay gặp:</b> fructose có phản ứng (kiềm chuyển thành glucose); <b>saccharose, tinh bột, cellulose không</b>"
      },
      "k3": {
        "ten": "Đọc sơ đồ chuyển hoá",
        "rule": "<b>Cách đọc:</b> gọi tên theo chất vào → ra; {CO2} → tinh bột: <b>quang hợp</b><br><b>Thuỷ phân:</b> cắt glycoside hay ester bằng {H2O}; saccharose → glucose + fructose; tinh bột → maltose → glucose; cellulose → glucose<br><b>Lên men rượu:</b> glucose → {C2H5OH} + {CO2}; oxi hoá – khử, toả nhiệt<br><b>Tạo acid:</b> glucose → lactic acid {CH3CH(OH)COOH}: lên men lactic; ethanol → acetic acid: lên men giấm; gluconate + HCl → gluconic acid {C6H12O7}<br><b>Ester hoá:</b> –OH + {HNO3}, anhydride<br><b>Bẫy hay gặp:</b> monosaccharide không thuỷ phân"
      },
      "k4": {
        "ten": "Quy trình thí nghiệm",
        "rule": "<b>Cách đọc:</b> hỏi mỗi bước để làm gì<br><b>Thuỷ phân:</b> acid + đun (cellulose: {H2SO4} 70%); {H2SO4} đặc → <b>than hoá</b><br><b>Iodine:</b> còn xanh tím → <b>chưa thuỷ phân hết</b>; đun mất màu, nguội hiện lại<br><b>Trung hoà acid:</b> làm trước Tollens, {Cu(OH)2}; {NaHCO3} đến hết bọt, {NaOH} đến quỳ xanh<br><b>Đường khử + {Cu(OH)2}:</b> không đun → xanh lam, đun → đỏ gạch<br><b>Bước khác:</b> nitrate hoá → trộn acid trong nước đá, dùng bông; tách cồn → chưng cất"
      },
      "k5": {
        "ten": "Dây chuyền mol",
        "rule": "<b>Quy về mắt xích:</b> nhân hệ số; {C6H10O5} 162 → glucose 180 → <b>2</b>{C2H5OH}; glucose → <b>2</b>Ag, 2 lactic acid<br><b>Saccharose:</b> 342 → <b>4</b>Ag, 4{C2H5OH}<br><b>Ester cellulose:</b> mắt xích → trinitrate 297 (3{HNO3}), triacetate 288<br><b>Hiệu suất:</b> ra sản phẩm <b>× H</b>, tìm nguyên liệu <b>÷ H</b>; nhiều giai đoạn nhân các H<br><b>Quy đổi:</b> rượu a° → V ethanol = V·a/100; m = D·V; lớp bạc V = S·dày<br><b>Tính %N:</b> %N = 14x : (162 + 45x), x = số –{ONO2}"
      },
      "k6": {
        "ten": "Năng lượng & quang hợp",
        "rule": "<b>Tính ΔrH:</b> ΔrH = Σ ΔfH(sản phẩm) − Σ ΔfH(chất đầu), nhân hệ số<br><b>Thu hay toả:</b> quang hợp <b>thu nhiệt</b>, hút {CO2} (chu trình carbon); oxi hoá glucose toả nhiệt<br><b>Năng lượng:</b> mức/cm<sup>2</sup>/phút × diện tích × phút × % hữu ích; 1 m<sup>2</sup> = 10<sup>4</sup> cm<sup>2</sup><br><b>Tính mol:</b> n = năng lượng : |ΔH|; <b>1 mắt xích ↔ 1 glucose ↔ 6{CO2} ↔ 6{O2}</b><br><b>Cháy, nổ:</b> cân bằng nguyên tố trước, rồi tính ΔH, mol khí"
      },
      "k7": {
        "ten": "Vật lí & ứng dụng",
        "rule": "<b>Độ ngọt:</b> tăng dần <b>maltose, glucose, saccharose, fructose</b><br><b>Tính tan:</b> glucose, fructose, saccharose rắn, tan tốt; tinh bột không tan nước lạnh, nước nóng → hồ (keo)<br><b>Cellulose:</b> không tan, tan trong nước Schweizer; trinitrate rắn trắng, không tan, cháy không khói (thuốc súng)<br><b>Nguồn gốc:</b> saccharose: mía, củ cải đường, thốt nốt; mạch nha: maltose; gạo, ngô, sắn, bánh mì: tinh bột<br><b>Ứng dụng:</b> cellulose triacetate → tơ acetate; ethanol → xăng E5"
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
        "rule": "<b>Tự xảy ra:</b> E° cặp chứa chất oxi hoá > E° cặp chứa chất khử (quy tắc α)<br><b>Sản phẩm:</b> chất oxi hoá và chất khử yếu hơn<br><b>Dãy E° tăng:</b> Mg, Al, Zn, Fe, Ni, Sn, Pb, {H2} (0), Cu (0,340), Fe³⁺/Fe²⁺ (0,771), Ag (0,799), {O2}/{H2O}<br><b>Đếm phản ứng:</b> mỗi phản ứng tìm đúng hai cặp rồi so<br><b>Với acid loãng:</b> E° < 0 mới đẩy {H2} khỏi acid loãng"
      },
      "k2": {
        "ten": "Suy dãy từ phản ứng",
        "rule": '<b>Không cho số E°:</b> mỗi phản ứng xảy ra cho <b>hai bất đẳng thức</b><br><b>Chất khử:</b> vế trái mạnh hơn vế phải<br><b>Chất oxi hoá:</b> vế trái mạnh hơn vế phải<br><b>Ghép dãy:</b> "không phản ứng" → đảo lại, rồi ghép thành một dãy<br><b>Kim loại – ion:</b> kim loại khử càng mạnh, ion của nó oxi hoá càng yếu<br><b>Dấu E°:</b> kim loại đẩy được {H2} khỏi HCl ⇒ E° âm'
      },
      "k3": {
        "ten": "Pin Galvani",
        "rule": "<b>Anode (cực âm):</b> cặp E° nhỏ → kim loại bị oxi hoá, tan dần<br><b>Cathode (cực dương):</b> cặp E° lớn → ion bị khử; điện cực Pt không đổi khối lượng<br><b>Tính E°pin:</b> E°pin = E°(cathode) − E°(anode) > 0, vôn kế chỉ số dương<br><b>Cầu muối:</b> cation về cathode, anion về anode<br><b>Lập được pin:</b> chỉ phản ứng oxi hoá – khử <b>tự xảy ra</b><br><b>Không tự xảy ra:</b> phải điện phân"
      },
      "k4": {
        "ten": "Phóng điện – nạp điện",
        "rule": "<b>Phóng điện = pin:</b> hoá năng → điện năng; cực âm là anode, bị oxi hoá<br><b>Nạp điện = điện phân:</b> điện năng → hoá năng, mọi quá trình đảo chiều<br><b>Acquy chì phóng:</b> Pb và {PbO2} đều → {PbSO4} bám cực; {H2SO4} giảm; chì độc<br><b>Khối lượng cực:</b> hai cực cùng nặng thêm (+96 và +64 g/mol)<br><b>Li-ion phóng:</b> Li⁺ sang cực dương<br><b>Pin nhiên liệu:</b> điện năng ≈ |ΔrH|; nhiên liệu thật = lí thuyết : H"
      },
      "k5": {
        "ten": "Thứ tự điện phân",
        "rule": "<b>Hai cực:</b> anode nối cực (+), oxi hoá; cathode nối cực (−), khử<br><b>Cathode:</b> E° lớn bị khử trước: Ag⁺ > Fe³⁺ (→ Fe²⁺) > Cu²⁺ > H⁺ (acid) > Fe²⁺, Ni²⁺, Zn²⁺ (vẫn trước nước)<br><b>Nước ở cathode:</b> K⁺, Na⁺, Mg²⁺, Al³⁺ không bị khử → nước bị khử thay: {H2} + OH⁻, pH tăng<br><b>Anode trơ:</b> Cl⁻, Br⁻ bị oxi hoá trước nước<br><b>Nước ở anode:</b> {SO4}²⁻, {NO3}⁻ không bị oxi hoá → nước bị oxi hoá: {O2} + H⁺, pH giảm<br><b>Anode bằng Cu:</b> Cu tan"
      },
      "k6": {
        "ten": "Điện phân sản xuất",
        "rule": "<b>Na, Al:</b> chỉ điều chế được bằng <b>điện phân nóng chảy</b><br><b>Cryolite:</b> trộn {Al2O3} (từ bauxite) → <b>hạ nhiệt độ nóng chảy, tăng dẫn điện</b><br><b>Điện cực Al:</b> Al ra ở cathode, {O2} ở anode đốt mòn than<br><b>Có màng ngăn:</b> {NaCl} dung dịch → {NaOH} (cô đặc, kết tinh) + {H2} + {Cl2}<br><b>Không màng ngăn:</b> {Cl2} gặp {NaOH} → nước Javel (tẩy màu, diệt khuẩn); gộp: {NaCl} + {H2O} → {NaClO} + {H2}<br><b>Bẫy hay gặp:</b> sản xuất Al không dùng {AlCl3} (thăng hoa)"
      },
      "k7": {
        "ten": "Định luật Faraday",
        "rule": "<b>Công thức:</b> q = I·t = n(e)·F ⇒ <b>n(chất) = It : (zF)</b><br><b>Số F:</b> F = 96500 C/mol; đề cho số khác → theo đề<br><b>Đổi đơn vị:</b> t tính bằng <b>giây</b>; 1 A·h = 3600 C<br><b>Số z:</b> số electron một ion, phân tử trao đổi; hợp chất → lấy độ đổi số oxi hoá<br><b>z hay gặp:</b> Ag⁺ 1, Cu²⁺ 2, Al³⁺ 3, {Cl2} 2, {H2} 2, {O2} 4<br><b>Hiệu suất:</b> sản phẩm thực = lí thuyết × H; điện lượng, thời gian cần = lí thuyết : H"
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
        "rule": "<b>Bậc amine:</b> <b>số gốc hydrocarbon gắn vào N</b>, không xét bậc carbon.<br><b>Nhận bậc:</b> {RNH2} bậc I, {R2NH} bậc II, {R3N} bậc III.<br><b>Tên thay thế:</b> mạch chính chứa C gắn N + vị trí + amine; gốc trên N ghi <i>N-</i>.<br><b>Ví dụ tên:</b> {CH3CH2CH2NHCH3} là N-methylpropan-1-amine.<br><b>Tên amino acid:</b> thường alanine, bán hệ thống α-aminopropionic acid, thay thế 2-aminopropanoic acid.<br><b>Phổ IR:</b> N–H ở <b>3500–3300 cm<sup>−1</sup></b>; bậc III không có."
      },
      "k2": {
        "ten": "Sôi, tan, trạng thái",
        "rule": "<b>Nhiệt độ sôi:</b> M xấp xỉ → giảm dần <b>acid, alcohol, amine</b> (liên kết hydrogen O–H mạnh hơn N–H).<br><b>Cùng loại:</b> M lớn → sôi cao; bậc III không có N–H → sôi thấp.<br><b>Chất khí:</b> methylamine, dimethylamine, trimethylamine, ethylamine (ở điều kiện thường).<br><b>Aniline:</b> lỏng, <b>hầu như không tan</b>, nặng hơn nước (vẩn đục, lắng đáy).<br><b>Amino acid:</b> rắn, nóng chảy cao, dễ tan trong nước (ion lưỡng cực)."
      },
      "k3": {
        "ten": "Amine gặp thuốc thử",
        "rule": "<b>Lực base:</b> base yếu (⇌), mạnh dần <b>{C6H5NH2}, {NH3}, {CH3NH2}, {(CH3)2NH}</b>.<br><b>Quỳ, {FeCl3}:</b> amine no → quỳ hoá xanh, {FeCl3} → {Fe(OH)3} nâu đỏ; aniline không đổi màu quỳ.<br><b>Gặp {HCl}:</b> tạo muối tan; muối + {NaOH} → amine tách ra (aniline vẩn đục lại); {RNH3}<sup>+</sup> là acid Brønsted.<br><b>Gặp {NaOH}, {Br2}:</b> {NaOH} không phản ứng; {Br2} chỉ aniline → kết tủa trắng.<br><b>Gặp {HNO2}:</b> bậc I no → alcohol + {N2}; aniline (0–5 °C) → muối diazonium; bậc II không ra {N2}.<br><b>Ngoại lệ lực base:</b> trimethylamine trong nước yếu hơn {CH3NH2}, {(CH3)2NH} (vẫn mạnh hơn {NH3})."
      },
      "k4": {
        "ten": "Điều chế & con số",
        "rule": "<b>Điều chế amine:</b> {NH3} + {CH3Br} thế <b>lần lượt từng H</b> → bậc I, II, III (không nối dài mạch).<br><b>Điều chế aniline:</b> nitrobenzene + {Fe/HCl} → {C6H5NH3Cl}, thêm {NaOH} → aniline.<br><b>Số oxi hoá N:</b> –{NO2} +3, {HNO2} +3, {N2} 0, amine −3.<br><b>Suy ra:</b> nitrobenzene là <b>chất oxi hoá</b>; amine gặp {HNO2} là <b>chất khử</b>.<br><b>Hiệu suất:</b> V × D → m → n (bảo toàn N); tìm nguyên liệu <b>÷ H</b>.<br><b>Tính pH:</b> x<sup>2</sup> : (C − x) = K<sub>b</sub>, x = [OH<sup>−</sup>], pH = 14 − pOH."
      },
      "k5": {
        "ten": "Amino acid lưỡng tính",
        "rule": "<b>Lưỡng tính:</b> có –{NH2} và –{COOH} → phản ứng cả acid lẫn base.<br><b>{HCl} dư:</b> –{NH2} → –{NH3Cl}, –{COONa} → –{COOH}; alcohol/{HCl} → muối ester.<br><b>{NaOH} dư:</b> –{NH3Cl} → –{NH2}; –{COOH} → –{COONa} (M + 22 mỗi nhóm); –{COOR} → –{COONa} + ROH.<br><b>Acid hay base:</b> dư –{COOH} hay có –{NH3Cl} → acid; dư –{NH2} → base.<br><b>Điện di:</b> pH thấp → cation về <b>cực âm</b>; pH cao → anion về <b>cực dương</b>; pH ≈ pI → đứng yên.<br><b>M cần nhớ:</b> Gly 75, Ala 89, Glu 147 (hai –{COOH})."
      },
      "k6": {
        "ten": "Peptide: đếm & tính",
        "rule": "<b>Liên kết peptide:</b> n gốc → <b>n − 1</b> liên kết, mất n − 1 {H2O}.<br><b>Đếm N, O:</b> gốc kiểu Gly, Ala → có n N, <b>n + 1</b> O.<br><b>Số trật tự:</b> = số hoán vị (3 Gly + 1 Ala → 4).<br><b>Trong {NaOH}:</b> n({NaOH}) = tổng –{COOH} các gốc (Glu tính 2); n({H2O}) = n(peptide), +1 mỗi Glu → bảo toàn khối lượng.<br><b>Thuỷ phân một phần:</b> ghép các đoạn chồng khớp.<br><b>Màu biuret:</b> có <b>từ tripeptide</b>; dipeptide không."
      },
      "k7": {
        "ten": "Protein & tên phản ứng",
        "rule": "<b>Vai trò:</b> cấu trúc (collagen, keratin), vận chuyển (hemoglobin), điều hoà (insulin), bảo vệ (kháng thể).<br><b>Xúc tác (enzyme):</b> chọn lọc cao, tăng tốc độ phản ứng sinh hoá.<br><b>Đông tụ:</b> khi đun, gặp acid, base, muối kim loại nặng; {HNO3} đặc → vàng.<br><b>Tên phản ứng:</b> cắt –CO–NH– là <b>thuỷ phân</b>; + alcohol/{HCl} là <b>ester hoá</b>.<br><b>Trùng ngưng:</b> amino acid nối mạch, tách {H2O}.<br><b>Màu biuret:</b> {Cu(OH)2}/kiềm → tím."
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
        "rule": "<b>Cấu tạo:</b> nút mạng là <b>cation kim loại</b>, giữa là <b>electron hoá trị tự do</b><br><b>Lực liên kết:</b> hút nhau bằng lực tĩnh điện<br><b>Giống liên kết ion:</b> ở tĩnh điện và cation kim loại (như {NaCl})<br><b>Khác liên kết ion:</b> ở phần âm: electron tự do ↔ anion cố định<br><b>Tính chất chung:</b> electron tự do → dẫn điện, dẫn nhiệt, ánh kim, dẻo<br><b>Số electron ngoài:</b> kim loại có 1–3 electron lớp ngoài: Na 1, Mg 2, Al 3 (3s²3p¹)"
      },
      "k2": {
        "ten": "Dãy thế điện cực",
        "rule": "<b>Quy luật:</b> E° càng nhỏ → kim loại <b>khử càng mạnh</b>, ion oxi hoá càng yếu<br><b>Dãy E° tăng:</b> K, Na, Mg, Al, Zn, Fe, Ni, Sn, Pb, {H2}, Cu, Fe²⁺ (cặp Fe³⁺/Fe²⁺), Ag, Au<br><b>Đoán phản ứng:</b> chất khử cặp trước + chất oxi hoá cặp sau → phản ứng<br><b>Khử H⁺:</b> E° < 0 khử được H⁺ acid loãng<br><b>Khử nước:</b> E° < −0,41 V khử được nước (xét theo thế)<br><b>Riêng Cu:</b> chỉ tan trong acid loãng khi có {O2}"
      },
      "k3": {
        "ten": "Sản phẩm kim loại",
        "rule": "<b>Kim loại:</b> luôn <b>bị oxi hoá</b> (số oxi hoá tăng từ 0)<br><b>Nhận chất oxi hoá:</b> chất có số oxi hoá giảm mới là chất oxi hoá<br><b>Đẩy khỏi muối:</b> kim loại mạnh đẩy kim loại yếu (trừ Na, K, Ca, Ba: gặp nước trước)<br><b>Hoà tan cả Cu:</b> {H2SO4} đặc, {HNO3} → sinh {SO2}, NO…, không sinh {H2}<br><b>Fe:</b> gặp H⁺, Cu²⁺, Fe³⁺ chỉ lên <b>Fe²⁺</b><br><b>Fe³⁺ gặp Cu:</b> chỉ về Fe²⁺, không ra Fe"
      },
      "k4": {
        "ten": "Ăn mòn điện hoá",
        "rule": "<b>Đủ ba điều kiện:</b> hai điện cực khác chất, tiếp xúc nhau, cùng chạm hơi ẩm hay chất điện li<br><b>Ví dụ điện cực:</b> Fe – Cu, Fe – C, kim loại bám lên<br><b>Bị ăn mòn:</b> kim loại E° nhỏ hơn là anode<br><b>Cực kia:</b> acid ra {H2}; trung tính chỉ {O2} bị khử<br><b>Gỉ, chống gỉ:</b> gỉ là {Fe2O3}·n{H2O}; chống: Zn, Mg hi sinh, phủ dầu, sơn; Al có màng oxide bền<br><b>Thiếu một điều kiện:</b> là <b>ăn mòn hoá học</b>"
      },
      "k5": {
        "ten": "Chọn cách điều chế",
        "rule": "<b>Điện phân nóng chảy:</b> K … Al<br><b>Nhiệt luyện:</b> Zn … Cu (cả Mg bằng Si); C, CO, {H2}, Al, Si khử oxide ở nhiệt độ cao<br><b>Thuỷ luyện:</b> hoà tan rồi cho kim loại mạnh hơn đẩy ra (Zn đẩy Au)<br><b>Quặng sulfide:</b> đốt thành oxide trước, sinh {SO2} độc<br><b>Tái chế:</b> tốn ít năng lượng hơn<br><b>Bẫy hay gặp:</b> chỉ bước biến ion thành kim loại là oxi hoá – khử"
      },
      "k6": {
        "ten": "Tính theo chuỗi",
        "rule": "<b>Chất chính:</b> m × %, đổi mol (tấn → tấn·mol)<br><b>Nối chuỗi:</b> <b>bảo toàn nguyên tố</b> hoặc cộng các phương trình: {Fe2O3} → 2Fe, {Cu2S} → 2Cu, 2{KCN} → Au<br><b>Hiệu suất:</b> sản phẩm <b>× H</b>, nguyên liệu <b>: H</b>, rồi chia % kim loại trong sản phẩm<br><b>Rắn đổi khối lượng:</b> độ chênh : Δm của 1 mol<br><b>Có dòng điện:</b> It : F = n(e) = z·n(kim loại), F = 96500<br><b>Tính ΔrH°:</b> ΔrH° = ΣΔfH°(sản phẩm) − ΣΔfH°(chất đầu); âm là toả nhiệt, tính theo mol"
      },
      "k7": {
        "ten": "Hợp kim",
        "rule": "<b>Tính chất hợp kim:</b> thường cứng hơn, nóng chảy thấp hơn, dẫn điện kém hơn kim loại thành phần<br><b>Đo hàm lượng:</b> chọn thuốc thử <b>hoà tan hết một kim loại, không đụng kim loại kia</b><br><b>Ví dụ thuốc thử:</b> Al tan trong kiềm; Cu tan trong {HNO3}, Fe³⁺, {H2SO4} đặc, Au thì không<br><b>Tính %:</b> % = m rắn còn lại : m mẫu<br><b>Không dùng:</b> thuốc thử <b>đẩy kim loại mới bám vào</b> (loại Ag⁺, Au³⁺)"
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
        "rule": "<b>Tính khử:</b> tăng <b>xuống dưới nhóm</b> (Li → Cs, Be → Ba).<br><b>Với nước:</b> ở nhiệt độ thường chỉ <b>nhóm IA và Ca, Sr, Ba</b> tác dụng mạnh → hydroxide + {H2}.<br><b>Dấu hiệu:</b> phenolphthalein hoá hồng → kim loại mạnh.<br><b>Kim loại kiềm:</b> mềm, nhẹ, nóng chảy thấp (giảm Li → Cs).<br><b>Bảo quản:</b> trong <b>dầu hoả, khí hiếm, chân không</b>.<br><b>Ngoại lệ:</b> <b>Mg</b> chỉ phản ứng chậm với nước nóng, <b>Be</b> không phản ứng."
      },
      "k2": {
        "ten": "Màu ngọn lửa",
        "rule": "<b>Đèn khí:</b> đốt hợp chất trên ngọn lửa → màu do <b>ion kim loại</b>, gốc acid không ảnh hưởng.<br><b>Nhóm IA:</b> <b>Li đỏ tía, Na vàng, K tím nhạt</b>.<br><b>Nhóm IIA:</b> <b>Ca đỏ cam, Sr đỏ son, Ba lục ánh vàng</b>.<br><b>Bước 1:</b> chốt kim loại bằng màu.<br><b>Bước 2:</b> chốt hợp chất bằng phản ứng đi kèm (nhiệt phân, tác dụng acid hay base).<br><b>Ngoại lệ:</b> Be, Mg không có màu đặc trưng."
      },
      "k3": {
        "ten": "Vòng carbonate",
        "rule": "<b>Trục {CO3}<sup>2−</sup> ⇌ {HCO3}<sup>−</sup>:</b> thêm {CO2} + {H2O} → hydrogencarbonate (tan); thêm OH<sup>−</sup> hoặc đun nóng → carbonate; thêm acid → {CO2}.<br><b>Nhiệt phân IA:</b> {NaHCO3} → {Na2CO3} (rắn giảm 62/168 = 36,9%); {Na2CO3}, {K2CO3} bền nhiệt; nitrate → nitrite + {O2}.<br><b>Nhiệt phân IIA:</b> carbonate, nitrate → oxide, bền dần từ Mg → Ba.<br><b>Sơ đồ chuyển hoá:</b> điền chất rồi <b>viết từng mũi tên</b>; mũi tên không có phản ứng thật → loại."
      },
      "k4": {
        "ten": "Độ tan nhóm IIA",
        "rule": "<b>Hydroxide:</b> đi xuống nhóm IIA <b>tan tăng</b> ({Mg(OH)2} không tan, {Ca(OH)2} ít tan, {Ba(OH)2} tan tốt).<br><b>Sulfate:</b> đi xuống nhóm <b>tan giảm</b> ({MgSO4} tan, {CaSO4} ít tan, {BaSO4} không tan, dùng cản quang).<br><b>Carbonate IIA:</b> không tan.<br><b>Đục hay trong:</b> so <b>lượng tạo ra với độ tan</b>.<br><b>Thạch cao:</b> sống {CaSO4.2H2O}, nung {CaSO4.0,5H2O} (bó bột, đúc tượng), khan {CaSO4}."
      },
      "k5": {
        "ten": "Nước cứng",
        "rule": "<b>Phân loại:</b> Ca<sup>2+</sup>, Mg<sup>2+</sup> đi với {HCO3}<sup>−</sup> → <b>tạm thời</b>; với Cl<sup>−</sup>, {SO4}<sup>2−</sup> → <b>vĩnh cửu</b>.<br><b>Chỉ trị tạm thời:</b> đun sôi, {Ca(OH)2} vừa đủ.<br><b>Trị mọi loại:</b> carbonate, phosphate tan, nhựa trao đổi ion.<br><b>Tác hại:</b> tốn xà phòng, đóng cặn ống, nồi hơi, thức ăn lâu chín.<br><b>Tính:</b> <b>2 × n(M<sup>2+</sup>) = tổng điện tích âm</b>; đun sôi 2{HCO3}<sup>−</sup> kéo 1 M<sup>2+</sup>; nhựa: 1 M<sup>2+</sup> đổi 2 gốc {SO3X}.<br><b>Không trị được:</b> {NaCl}, {HCl}."
      },
      "k6": {
        "ten": "Nhiệt phản ứng",
        "rule": "<b>Công thức:</b> Δ<sub>r</sub>H° = ΣΔ<sub>f</sub>H°(sản phẩm) − ΣΔ<sub>f</sub>H°(chất đầu), <b>nhân đủ hệ số</b>.<br><b>Đơn chất bền:</b> Δ<sub>f</sub>H° bằng 0.<br><b>Thu nhiệt:</b> Δ<sub>r</sub>H° <b>dương</b> (nhiệt phân carbonate, nitrate, nung thạch cao, Pidgeon).<br><b>Toả nhiệt:</b> Δ<sub>r</sub>H° <b>âm</b> (kim loại + nước hoặc phi kim, tôi vôi {CaO} + {H2O}).<br><b>Nhiệt cho m gam:</b> <b>Q = (n chất : hệ số của nó) × Δ<sub>r</sub>H°</b>.<br><b>Bẫy hay gặp:</b> đổi kg → g; dùng M của cả tinh thể ngậm nước."
      },
      "k7": {
        "ten": "Sản xuất & tách",
        "rule": "<b>Điều chế:</b> IA, IIA khử mạnh → <b>điện phân nóng chảy</b> muối chloride.<br><b>Điện phân dung dịch:</b> {NaCl} (màng ngăn) chỉ ra {NaOH}, {H2}, {Cl2}.<br><b>Solvay:</b> {NaHCO3} kết tủa vì <b>ít tan</b>, không vì acid mạnh; nung → soda; thu hồi {NH3}, {CO2}.<br><b>Tách KCl khỏi NaCl:</b> <b>kết tinh</b>.<br><b>Tính lượng:</b> bảo toàn kim loại từ quặng, × H.<br><b>Ngoại lệ Pidgeon:</b> Si khử {MgO} (không khử {CaO}), là <b>nhiệt luyện</b>."
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
        "rule": "<b>Cấu hình:</b> dãy thứ nhất Sc → Cu có [Ar]3d<sup>n</sup>4s<sup>2</sup>.<br><b>Tạo ion:</b> bỏ electron <b>4s trước</b> (Fe<sup>2+</sup> 3d<sup>6</sup>, Fe<sup>3+</sup> 3d<sup>5</sup>).<br><b>Liên kết:</b> nhiều electron hoá trị → liên kết kim loại mạnh.<br><b>Tính vật lí:</b> <b>cứng, khó nóng chảy, khối lượng riêng lớn</b> (Sc, Ti nhẹ), dẫn điện, dẫn nhiệt tốt.<br><b>Nhiều số oxi hoá:</b> Fe +2, +3; Cu +1, +2; Cr +3, +6; Mn +2 đến +7.<br><b>Ngoại lệ cấu hình:</b> <b>Cr 3d<sup>5</sup>4s<sup>1</sup>, Cu 3d<sup>10</sup>4s<sup>1</sup></b>."
      },
      "k2": {
        "ten": "Màu & nhận biết ion",
        "rule": "<b>Quy luật:</b> ion có 3d chưa đầy thường có màu; 3d<sup>0</sup>, 3d<sup>10</sup> (Sc<sup>3+</sup>, Zn<sup>2+</sup>) không màu.<br><b>Màu ion:</b> Fe<sup>2+</sup> lục nhạt, Fe<sup>3+</sup> vàng nâu, Cu<sup>2+</sup> xanh lam, Co<sup>2+</sup> hồng, Ni<sup>2+</sup> xanh lục.<br><b>Màu anion:</b> {MnO4}<sup>−</sup> tím, {Cr2O7}<sup>2−</sup> da cam, {CrO4}<sup>2−</sup> vàng.<br><b>Nhận biết bằng OH<sup>−</sup>:</b> {Fe(OH)3} <b>nâu đỏ</b>; {Cu(OH)2} <b>xanh lam</b>.<br><b>Riêng {Fe(OH)2}:</b> <b>trắng xanh</b>, để ngoài không khí → hoá nâu đỏ."
      },
      "k3": {
        "ten": "Chuẩn độ oxi hoá – khử",
        "rule": "<b>Acid hoá:</b> chuẩn độ Fe<sup>2+</sup> dùng <b>{H2SO4}</b>, không dùng {HCl}, {HNO3}.<br><b>Điểm cuối:</b> {KMnO4} tự chỉ thị, dư một giọt → <b>hồng nhạt bền</b>.<br><b>Tỉ lệ:</b> lấy từ electron, <b>1 {MnO4}<sup>−</sup> : 5 Fe<sup>2+</sup></b>; <b>1 {Cr2O7}<sup>2−</sup> : 6 Fe<sup>2+</sup></b>.<br><b>Bảo toàn electron:</b> tổng electron nhường = nhận ({NO3}<sup>−</sup> → {NH3} nhận 8).<br><b>Hai thí nghiệm:</b> làm song song, lượng chất chuẩn <b>chênh lệch</b> chính là phần chất cần tìm đã tiêu thụ."
      },
      "k4": {
        "ten": "Con số quy trình",
        "rule": "<b>Đổi đơn vị trước:</b> mg/L × L = mg; 1 m<sup>3</sup> = 1000 L.<br><b>Nhân ngược:</b> chuẩn độ một phần mẫu → nhân theo tỉ lệ (15 mL trong 60 mL → × 4).<br><b>Bảo toàn nguyên tố:</b> xuyên chuỗi; {FeCr2O4} có 2 Cr → 1 {K2Cr2O7}.<br><b>Bảo toàn Ca:</b> Ca của vôi đi hết vào {CaSO4} → n({Ca(OH)2}) = n({SO4}<sup>2−</sup>).<br><b>Độ tinh khiết:</b> m chất : m mẫu.<br><b>Hiệu suất:</b> thực tế (đã nhân độ tinh khiết) : lí thuyết."
      },
      "k5": {
        "ten": "Mổ phức chất",
        "rule": "<b>Trong [ ]:</b> <b>nguyên tử trung tâm</b> nhận cặp electron.<br><b>Phối tử:</b> {H2O}, {NH3}, Cl<sup>−</sup>, OH<sup>−</sup>, CN<sup>−</sup> cho cặp electron.<br><b>Liên kết:</b> cho – nhận, mỗi phối tử một liên kết σ.<br><b>Điện tích phức:</b> <b>số oxi hoá trung tâm + tổng điện tích phối tử</b> (phân tử 0, anion −1).<br><b>Hình học:</b> 6 phối tử → bát diện; 4 → tứ diện hoặc vuông phẳng; 2 → thẳng.<br><b>Bẫy hay gặp:</b> Al<sup>3+</sup> (không chuyển tiếp) cũng tạo phức aqua."
      },
      "k6": {
        "ten": "Thế phối tử & màu",
        "rule": "<b>Thế phối tử:</b> phối tử mới đẩy {H2O} ra → đổi màu, có thể đổi hình học.<br><b>Phức Cu:</b> {[Cu(OH2)6]}<sup>2+</sup> xanh + {NH3} → {[Cu(NH3)4(OH2)2]}<sup>2+</sup> <b>xanh lam đậm</b> ({Cu(OH)2} cũng tan trong {NH3} dư).<br><b>Phức Co:</b> {[Co(OH2)6]}<sup>2+</sup> hồng + 4Cl<sup>−</sup> ⇌ {[CoCl4]}<sup>2−</sup> xanh.<br><b>Chiều phản ứng:</b> đi về phía <b>phức bền hơn</b>; thêm phối tử mới → chiều thuận.<br><b>Chiều nghịch:</b> pha loãng (thêm nước) hoặc kéo phối tử ra ({AgNO3} tạo AgCl trắng)."
      },
      "k7": {
        "ten": "Phức aqua là acid",
        "rule": "<b>Hoà tan muối:</b> ion kim loại phân li → tạo <b>phức aqua</b> {[M(OH2)6]}<sup>n+</sup>.<br><b>Fe<sup>3+</sup>, Al<sup>3+</sup>:</b> phức aqua nhường H<sup>+</sup> → <b>acid Brønsted</b>, dung dịch có môi trường acid.<br><b>Cân bằng:</b> {[M(OH2)6]}<sup>3+</sup> ⇌ {[M(OH)(OH2)5]}<sup>2+</sup> + H<sup>+</sup>.<br><b>Dời cân bằng:</b> thêm acid → chiều nghịch; thêm base → chiều thuận, đến hydroxide kết tủa keo.<br><b>Ứng dụng:</b> phèn làm trong nước.<br><b>Bẫy hay gặp:</b> số oxi hoá M <b>không đổi</b>, vẫn 6 phối tử."
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
        "rule": "<b>Tên chung:</b> <b>poly + tên monomer</b>; tên nhiều chữ đặt trong ngoặc: poly(vinyl chloride).<br><b>Nylon-n:</b> đếm <b>tổng C trong mắt xích</b>, kể cả C của –CO–.<br><b>Ví dụ nylon:</b> –NH–{(CH2)5}–CO– có 6 C → nylon-6 (capron); nylon-6,6 đi từ hai monomer 6 C.<br><b>Tên riêng:</b> nitron (olon) = poly(acrylonitrile), PVA = poly(vinyl acetate), PMMA = poly(methyl methacrylate), PS = polystyrene, cao su buna = polybuta-1,3-diene."
      },
      "k2": {
        "ten": "Monomer & cách trùng",
        "rule": "<b>Tìm monomer:</b> bỏ ngoặc mắt xích, nối lại C=C → ra monomer.<br><b>Trùng hợp:</b> monomer có <b>C=C</b> hoặc vòng kém bền (caprolactam); không tách phân tử nhỏ.<br><b>Trùng ngưng:</b> monomer có <b>từ 2 nhóm chức</b> (–{NH2}, –{COOH}, –OH), tách {H2O}: nylon-6,6 từ hexamethylenediamine + adipic acid.<br><b>Bẫy PVA:</b> từ vinyl acetate {CH3COOCH=CH2}, không phải {CH2=CHCOOCH3}.<br><b>Bẫy cao su:</b> cao su thiên nhiên là polyisoprene, khác buna (từ buta-1,3-diene) ở nhóm –{CH3}."
      },
      "k3": {
        "ten": "Nguồn gốc & loại",
        "rule": "<b>Thiên nhiên:</b> có sẵn (bông, đay là cellulose; tơ tằm, len là protein; cao su thiên nhiên).<br><b>Bán tổng hợp:</b> chế hoá từ polymer thiên nhiên (tơ visco, cellulose acetate từ cellulose).<br><b>Tổng hợp:</b> đi từ monomer (capron, nylon-6,6, nitron, PE, PVC, cao su buna).<br><b>Nguồn gốc cellulose:</b> bông, đay, visco, cellulose acetate.<br><b>Theo công dụng:</b> chất dẻo, tơ, cao su, keo dán; <b>chỉ cao su có tính đàn hồi</b>."
      },
      "k4": {
        "ten": "Phản ứng của polymer",
        "rule": "<b>Cách nhận:</b> so mạch trước và sau.<br><b>Tăng mạch:</b> nối các mạch bằng cầu (lưu hoá cao su bằng S).<br><b>Cắt mạch:</b> mạch ngắn lại; giải trùng hợp (polystyrene → styrene), thuỷ phân tinh bột, cellulose, polyamide.<br><b>Giữ nguyên mạch:</b> chỉ đổi nhóm thế (poly(vinyl acetate) + {NaOH} → poly(vinyl alcohol)).<br><b>Phân huỷ:</b> thành chất đơn giản (tinh bột + {H2SO4} đặc → C + {H2O}).<br><b>Lưu ý:</b> polymer không có nhiệt độ nóng chảy xác định, không bay hơi."
      },
      "k5": {
        "ten": "Tính theo mắt xích",
        "rule": "<b>Trùng hợp:</b> 1 mắt xích = 1 monomer, n = m : M(mắt xích).<br><b>Hệ số polymer hoá:</b> = M(polymer) : M(mắt xích).<br><b>Mắt xích hay gặp:</b> {C2H3Cl} 62,5; {C4H6} 54; {C4H5Cl} 88,5; {C8H8} 104.<br><b>Nhiều giai đoạn:</b> <b>H chung = H<sub>1</sub> × H<sub>2</sub> × …</b>; tính sản phẩm × H, tìm nguyên liệu <b>÷ H</b>.<br><b>Soi hệ số:</b> 2 {C2H5OH} → 1 {C4H6}; 2 {C2H2} → 1 {C4H4}.<br><b>Thể tích mol khí:</b> ở 25 °C, 1 bar là <b>24,79 L/mol</b>."
      },
      "k6": {
        "ten": "Mắt xích cellulose",
        "rule": "<b>Cellulose:</b> [{C6H7O2(OH)3}]<sub>n</sub>, mỗi mắt xích <b>3 nhóm –OH</b>.<br><b>Thay bằng –{OCOCH3}:</b> x nhóm –OH → <b>M = 162 + 42x</b>, số C = 6 + 2x.<br><b>Tri-, diacetate:</b> triacetate (x = 3) là [{C6H7O2(OOCCH3)3}]<sub>n</sub>, diacetate x = 2.<br><b>Thay bằng –{ONO2}:</b> M = 162 + 45x, trinitrate [{C6H7O2(ONO2)3}]<sub>n</sub>.<br><b>Đề cho %C, %N:</b> lập phương trình theo x; x lẻ → hỗn hợp di- và triacetate."
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
