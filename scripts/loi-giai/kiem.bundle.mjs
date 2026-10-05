// TỆP SINH TỰ ĐỘNG — đừng sửa tay. Dựng: node scripts/loi-giai/dung-kiem.mjs (nguồn src/lib/loi-giai-kiem.ts + loi-giai-bo.ts + server/src/may-soan-kiem.ts)

// src/lib/doc-so-phan-iii.ts
function docSoPhanIII(raw) {
  var s = String(raw == null ? "" : raw);
  var MU = {
    "⁰": "0",
    "¹": "1",
    "²": "2",
    "³": "3",
    "⁴": "4",
    "⁵": "5",
    "⁶": "6",
    "⁷": "7",
    "⁸": "8",
    "⁹": "9",
    "⁻": "-",
    "⁺": "+"
  };
  s = s.replace(/10([\s\u00a0\u202f]*)([\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b]+)/g, function(_t, _k, m2) {
    var r = "10^";
    for (var i = 0; i < m2.length; i++) r += MU[m2.charAt(i)];
    return r;
  });
  if (s.normalize) s = s.normalize("NFKC");
  s = s.replace(/\\times/g, "×").replace(/\\cdot/g, "·");
  s = s.replace(/[\s\u00a0\u1680\u180e\u2000-\u200f\u2028\u2029\u202f\u205f\u2060\u3000\ufeff]+/g, "");
  s = s.replace(/[\u2010-\u2015\u2212\ufe63\uff0d]/g, "-").replace(/[\u066b\u201a\u060c]/g, ",").toLowerCase();
  s = s.replace(/^[+\u2248~=]+/, "").replace(/[.,;:!?]+$/, "");
  s = s.replace(/\^+/g, "^");
  if (!s) return null;
  var dinhTri = "";
  var mu = 0;
  var coMu = false;
  var duoi = "";
  var SO = "([+-]?(?:\\d[\\d.,]*|[.,]\\d+))";
  var MU10 = "10(?:\\^|\\*\\*)?[({]?([+-]?\\d+)[)}]?";
  var m = new RegExp("^" + SO + "[x×*·⋅∙]" + MU10 + "(.*)$").exec(s) || new RegExp("^" + SO + "\\.10(?:\\^|\\*\\*)[({]?([+-]?\\d+)[)}]?(.*)$").exec(s) || new RegExp("^" + SO + "e([+-]?\\d+)(.*)$").exec(s);
  if (m) {
    dinhTri = m[1];
    mu = parseInt(m[2], 10);
    coMu = true;
    duoi = m[3];
  } else {
    var m10 = /^([+-]?)10(?:\^|\*\*)[({]?([+-]?\d+)[)}]?(.*)$/.exec(s);
    if (m10) {
      dinhTri = m10[1] + "1";
      mu = parseInt(m10[2], 10);
      coMu = true;
      duoi = m10[3];
    } else {
      var mp = new RegExp("^" + SO + "(.*)$").exec(s);
      if (!mp) return null;
      dinhTri = mp[1];
      duoi = mp[2];
    }
  }
  if (!isFinite(mu) || Math.abs(mu) > 400) return null;
  var dau = "";
  if (dinhTri.charAt(0) === "-" || dinhTri.charAt(0) === "+") {
    dau = dinhTri.charAt(0) === "-" ? "-" : "";
    dinhTri = dinhTri.slice(1);
  }
  var soCham = dinhTri.split(".").length - 1;
  var soPhay = dinhTri.split(",").length - 1;
  var nghin = "";
  var thapPhan = "";
  if (soCham && soPhay) {
    var cuoiCham = dinhTri.lastIndexOf(".");
    var cuoiPhay = dinhTri.lastIndexOf(",");
    thapPhan = cuoiCham > cuoiPhay ? "." : ",";
    nghin = thapPhan === "." ? "," : ".";
    if ((thapPhan === "." ? soCham : soPhay) !== 1) return null;
  } else if (soCham > 1) nghin = ".";
  else if (soPhay > 1) nghin = ",";
  else thapPhan = soCham ? "." : soPhay ? "," : "";
  var nguyen = dinhTri;
  var le = "";
  var coDauThapPhan = false;
  if (thapPhan) {
    var k = dinhTri.lastIndexOf(thapPhan);
    nguyen = dinhTri.slice(0, k);
    le = dinhTri.slice(k + 1);
    coDauThapPhan = true;
  }
  if (nghin) {
    var nhom = nguyen.split(nghin);
    if (!/^\d{1,3}$/.test(nhom[0])) return null;
    for (var j = 1; j < nhom.length; j++) if (!/^\d{3}$/.test(nhom[j])) return null;
    nguyen = nhom.join("");
  }
  if (!/^\d*$/.test(nguyen) || !/^\d*$/.test(le) || !nguyen && !le) return null;
  if (!coMu) {
    return { so: dau + nguyen + (coDauThapPhan ? "." + le : ""), donVi: duoi };
  }
  var chuSo = (nguyen || "0") + le;
  var viTri = (nguyen || "0").length + mu;
  if (viTri <= 0) {
    chuSo = new Array(1 - viTri + 1).join("0") + chuSo;
    viTri = 1;
  }
  if (viTri > chuSo.length) chuSo = chuSo + new Array(viTri - chuSo.length + 1).join("0");
  var phanNguyen = chuSo.slice(0, viTri).replace(/^0+(?=\d)/, "");
  var phanLe = chuSo.slice(viTri).replace(/0+$/, "");
  var ketQua = phanNguyen + (phanLe ? "." + phanLe : "");
  if (/^0(?:\.0*)?$/.test(ketQua)) dau = "";
  return { so: dau + ketQua, donVi: duoi };
}

// src/lib/cham-so-policy.ts
var POLICY_VERSION = "CNH-1.0";
var THAM_SO_CHAM_CNH_1_0 = Object.freeze({
  policyVersion: POLICY_VERSION,
  /** Sai số tuyệt đối phải NHỎ HƠN giá trị này mới là bằng nhau (1e-4, không phải ≤). */
  saiSoTuyetDoiLoaiTru: 1e-4,
  /** Số chữ số thập phân tối đa cho phép ở `numeric-rounded-v1`. */
  soChuSoThapPhanToiDa: 12,
  policies: Object.freeze(["numeric-value-v1", "numeric-rounded-v1", "numeric-unit-v1", "literal-v1"])
});
var KHOANG_TRANG = new RegExp("[\\s\\u00a0\\u1680\\u180e\\u2000-\\u200f\\u2028\\u2029\\u202f\\u205f\\u2060\\u3000\\ufeff]+", "g");
var DAU_TRU = new RegExp("[\\u2010-\\u2015\\u2212\\ufe63\\uff0d\\u207b]", "g");
var SO_THUAN = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
var PHAN_SO = /^([+-]?(?:\d+\.?\d*|\.\d+))\/([+-]?(?:\d+\.?\d*|\.\d+))$/;
var SO_ROI_DUOI = /^([+-]?(?:\d+\.?\d*|\.\d+))(.*)$/;
var KHOA_HOC_X10 = /^([+-]?(?:\d+\.?\d*|\.\d+))[x×*·]10\^?\(?([+-]?\d+)\)?$/;
var KHOA_HOC_E = /^([+-]?(?:\d+\.?\d*|\.\d+))e([+-]?\d+)$/;
function chuanHoaSoNhap(raw) {
  const doc = docSoPhanIII(raw);
  if (doc) return doc.so + doc.donVi;
  let s = String(raw ?? "").normalize("NFKC").replace(KHOANG_TRANG, "").replace(DAU_TRU, "-").replace(/[٫‚،]/g, ",").toLowerCase();
  s = s.replace(/^[+≈~=]+/, "").replace(/[.,;:!?]+$/, "").replace(/,/g, ".");
  const x10 = KHOA_HOC_X10.exec(s) ?? KHOA_HOC_E.exec(s);
  if (x10) {
    const n = Number(`${x10[1]}e${x10[2]}`);
    if (Number.isFinite(n)) return String(n);
  }
  return s;
}
var DON_VI_DA_BIET = /* @__PURE__ */ new Set([
  // độ dài / diện tích / thể tích
  "m",
  "dm",
  "cm",
  "mm",
  "km",
  "hm",
  "dam",
  "nm",
  "um",
  "µm",
  "μm",
  "met",
  "mét",
  "m2",
  "m²",
  "m3",
  "m³",
  "cm2",
  "cm²",
  "cm3",
  "cm³",
  "dm3",
  "dm³",
  "mm3",
  "mm³",
  "km2",
  "km²",
  "km3",
  "km³",
  "ha",
  "cc",
  "l",
  "ml",
  "cl",
  "dl",
  "lit",
  "lít",
  "mililit",
  "mililít",
  // khối lượng
  "g",
  "kg",
  "mg",
  "hg",
  "dag",
  "t",
  "tan",
  "tấn",
  "gam",
  "kilogam",
  // thời gian
  "s",
  "giay",
  "giây",
  "phut",
  "phút",
  "h",
  "gio",
  "giờ",
  "ms",
  "min",
  // lượng chất / nồng độ
  "mol",
  "mmol",
  "kmol",
  "umol",
  "µmol",
  "mol/l",
  "mol/lit",
  "mol/lít",
  "n",
  "kmol/m3",
  "kmol/m³",
  "mol/kg",
  "m/mol",
  // khối lượng riêng / khối lượng mol
  "g/mol",
  "kg/mol",
  "g/ml",
  "g/cm3",
  "g/cm³",
  "kg/m3",
  "kg/m³",
  "kg/l",
  "mg/ml",
  "g/l",
  // năng lượng / công suất / nhiệt
  "j",
  "kj",
  "jun",
  "kilojun",
  "cal",
  "kcal",
  "w",
  "kw",
  "mw",
  "wh",
  "kwh",
  "j/kg",
  "j/mol",
  "kj/mol",
  "j/g",
  "j/(mol.k)",
  // điện / từ / sóng
  "v",
  "mv",
  "kv",
  "a",
  "ma",
  "ohm",
  "ω",
  "f",
  "µf",
  "uf",
  "nf",
  "pf",
  "mh",
  "wb",
  "hz",
  "khz",
  "mhz",
  "ghz",
  // áp suất / lực
  "pa",
  "kpa",
  "mpa",
  "atm",
  "mmhg",
  "bar",
  "mbar",
  "psi",
  "n/m2",
  "n/m²",
  "n.m",
  // phần trăm / nhiệt độ / góc
  "%",
  "‰",
  "°c",
  "°k",
  "°f",
  "do",
  "độ",
  "rad",
  "sr",
  // vận tốc / tốc độ biến thiên
  "m/s",
  "km/h",
  "m/s2",
  "m/s²",
  "cm/s",
  "km/s",
  "g/s",
  "mol/s",
  "m3/s",
  "l/s",
  "l/min",
  // khác dùng trong đề
  "cd",
  "lm",
  "lux",
  "lx",
  "db",
  "eq",
  "dv",
  "đvc",
  "u",
  "amu"
]);
function chuanHoaDonVi(u) {
  const s = u.normalize("NFKC").toLowerCase().replace(KHOANG_TRANG, "");
  const trongNgoac = /^\((.*)\)$/.exec(s) ?? /^\[(.*)\]$/.exec(s);
  return trongNgoac ? trongNgoac[1] : s;
}
function rutGon(x) {
  let tu = x.tu;
  let mau = x.mau;
  if (mau < 0n) {
    tu = -tu;
    mau = -mau;
  }
  let a = tu < 0n ? -tu : tu;
  let b = mau;
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  const g = a === 0n ? 1n : a;
  return { tu: tu / g, mau: mau / g };
}
function phanSoTuChuoiSo(s) {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s);
  if (!m) return null;
  const dau = m[1] ?? "";
  const nguyen = m[2] ?? "";
  const le = m[3] ?? "";
  if (!nguyen && !le) return null;
  const chuSo = (nguyen || "0") + le;
  if (!/^\d+$/.test(chuSo)) return null;
  const so = BigInt(chuSo);
  return rutGon({ tu: dau === "-" ? -so : so, mau: 10n ** BigInt(le.length) });
}
function tachSoVaDonVi(s, allowFraction) {
  if (!s) return { ok: false, loi: "unsupported-format" };
  if (allowFraction) {
    const m2 = PHAN_SO.exec(s);
    if (m2) {
      const tu = phanSoTuChuoiSo(m2[1]);
      const mau = phanSoTuChuoiSo(m2[2]);
      if (!tu || !mau || mau.tu === 0n) return { ok: false, loi: "unsupported-format" };
      return { ok: true, so: { numText: s, unit: null, gia: rutGon({ tu: tu.tu * mau.mau, mau: tu.mau * mau.tu }) } };
    }
  }
  if (SO_THUAN.test(s)) {
    const gia2 = phanSoTuChuoiSo(s);
    return gia2 ? { ok: true, so: { numText: s, unit: null, gia: gia2 } } : { ok: false, loi: "unsupported-format" };
  }
  const m = SO_ROI_DUOI.exec(s);
  if (!m) return { ok: false, loi: "unsupported-format" };
  const gia = phanSoTuChuoiSo(m[1]);
  if (!gia) return { ok: false, loi: "unsupported-format" };
  const don = chuanHoaDonVi(m[2]);
  if (!don || !DON_VI_DA_BIET.has(don)) return { ok: false, loi: "unsupported-format" };
  return { ok: true, so: { numText: m[1], unit: don, gia } };
}

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
var DONG_TU_LAM_CHU = /(?:^|[.?!:;,]\s*|(?:^|[^\p{L}])hãy\s+)(?:xác định (?:công thức|cấu tạo|tên)|viết (?:công thức|phương trình|các phương trình|cấu tạo|sơ đồ|tên)|lập (?:công thức|phương trình|sơ đồ)|vẽ|chứng minh)(?![\p{L}])/iu;
var HOI_DAI_LUONG = /bao nhiêu|số thứ tự|dãy số|bộ số|liệt kê|giá trị|tổng (?:hệ số|số)|là mấy|làm tròn|phần trăm|hiệu suất|khối lượng|thể tích|nồng độ|số mol|(?:^|[^\p{L}])tính(?![\p{L}])/iu;
var hoiMo = (text) => {
  const t = text.toLowerCase();
  return CUM_HOI_MO.some((m) => t.includes(m)) || DONG_TU_HOI_MO.test(t) || DONG_TU_LAM_CHU.test(t) && !HOI_DAI_LUONG.test(t);
};
function laMotSoPhanIII(da) {
  const s = chuoiDapAn(da).trim();
  if (!s || !docSoPhanIII(s)) return false;
  return tachSoVaDonVi(chuanHoaSoNhap(s), false).ok;
}
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
  if (c.tuLuan === true || c.tu_luan === true) return "câu gắn cờ tự luận (kho)";
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
      if (!laMotSoPhanIII(da)) return "phần III đáp án không phải một số (công thức / chữ / nhiều số) — không chấm tự động";
    }
    if (text && !(coDapAn && laMotSoPhanIII(da)) && hoiMo(text)) return "phần III hỏi mở (theo em / phương pháp nào / giải thích / viết công thức …)";
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
      loiGiai: laObj(c.loi_giai) ? c.loi_giai : laObj(c.loiGiai) ? c.loiGiai : null,
      ...chuoi2(c.kieu).trim() ? { kieu: chuoi2(c.kieu).trim() } : {}
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
  const tho = { kieu: c.kieu, phan: c.phan, de: c.de, pa: c.pa ? Object.values(c.pa) : void 0, y: c.y ? Object.values(c.y) : void 0, dap_an: c.dapAn, hinh: c.hinh.map((h) => ({ viTri: h.viTri, src: h.duLieu })) };
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
    const ids = Object.keys(pa).sort();
    return { ...base, y: ids.map((k) => ({ id: k, t: pa[k] })), dapAn: Object.fromEntries(ids.map((k) => [k, k === c.dapAn ? "D" : "S"])), mc: { hoi: "Chọn đáp án", o: ids.map((k) => [k, pa[k]]), dapAn: c.dapAn } };
  }
  if (dang === "ds") {
    const y = c.y;
    const ids = Object.keys(y).sort();
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
  "ALCOHOL_PHENOL": {
    "ma": "ALCOHOL_PHENOL",
    "chuong": "Dẫn xuất halogen – alcohol – phenol",
    "lop": "11",
    "KEYS": {
      "k1": {
        "ten": "Dẫn xuất halogen",
        "rule": "<b>Gọi tên:</b> thay thế = vị trí + halo + tên hydrocarbon (2-chloropropane); gốc – chức = tên gốc + halide (ethyl chloride).<br><b>CFC:</b> chỉ có C, Cl, F, <b>không còn H</b> ({CCl2F2}); còn H như {CHClF2} là HCFC.<br><b>Thế:</b> R–X + {NaOH} (đun, trong nước) → R–OH + NaX.<br><b>Tách:</b> R–X + KOH trong <b>ethanol</b>, đun → alkene + HX; theo <b>Zaitsev</b>, H tách ở C bên cạnh có bậc cao hơn.<br><b>Nhận halogen:</b> sau thuỷ phân, acid hoá bằng {HNO3} rồi nhỏ {AgNO3}: AgCl trắng, AgBr vàng nhạt, AgI vàng."
      },
      "k2": {
        "ten": "Nhận loại & đồng phân",
        "rule": "<b>Alcohol:</b> –OH gắn C no; <b>phenol:</b> –OH gắn <b>trực tiếp</b> vòng benzene; {C6H5CH2OH} là alcohol thơm.<br><b>Bậc alcohol</b> = bậc của C mang –OH.<br><b>Tên:</b> mạch chính chứa C–OH, đánh số gần –OH, đuôi -ol: butan-2-ol, ethane-1,2-diol, propane-1,2,3-triol (glycerol).<br><b>Đếm đồng phân {CnH2n+2O}:</b> alcohol + ether; {C3H8O}: 2 + 1 = 3; {C4H10O}: 4 + 3 = 7.<br><b>{C7H8O} có vòng benzene:</b> 3 cresol + benzyl alcohol + methyl phenyl ether = 5.<br><b>Phổ IR:</b> –OH cho peak rộng 3650–3200 cm<sup>−1</sup>; không có C=O."
      },
      "k3": {
        "ten": "Phản ứng của alcohol",
        "rule": "<b>Với Na:</b> mọi –OH → {H2}; n({H2}) = số –OH × n(alcohol) : 2; alcohol <b>không</b> tác dụng NaOH.<br><b>Tách nước:</b> {H2SO4} đặc, 170 °C → alkene (Zaitsev); 140 °C → ether.<br><b>Oxi hoá bằng CuO, đun:</b> bậc I → aldehyde; bậc II → ketone; bậc III không phản ứng.<br><b>{Cu(OH)2}:</b> alcohol có <b>hai –OH kề nhau</b> (ethylene glycol, glycerol) → dung dịch xanh lam.<br><b>Khác:</b> ester hoá với acid; cháy toả nhiều nhiệt."
      },
      "k4": {
        "ten": "Tính chất phenol",
        "rule": "<b>Tính acid yếu:</b> phenol + Na, + NaOH → {C6H5ONa}; không làm đổi màu quỳ; yếu hơn {H2CO3}: {C6H5ONa} + {CO2} + {H2O} → phenol vẩn đục.<br><b>Thế vòng dễ:</b> + nước bromine → 2,4,6-tribromophenol <b>kết tủa trắng</b>; + {HNO3} → picric acid (2,4,6-trinitrophenol).<br><b>Giải thích:</b> vòng benzene hút electron làm O–H phân cực hơn alcohol; –OH đẩy electron vào vòng nên thế ở o, p dễ hơn benzene.<br><b>Vật lí:</b> rắn, ít tan trong nước lạnh, độc, gây bỏng da.<br><b>Cũng mất màu nước bromine:</b> aniline (kết tủa trắng), styrene; benzene, toluene thì không."
      },
      "k5": {
        "ten": "Vật lí, điều chế, ứng dụng",
        "rule": "<b>Liên kết hydrogen:</b> alcohol sôi cao hơn hydrocarbon, dẫn xuất halogen, ether có phân tử khối tương đương; càng nhiều –OH sôi càng cao; alcohol nhỏ tan tốt trong nước.<br><b>Ethanol:</b> hydrate hoá ethylene, lên men tinh bột, đường; tách khỏi bã, nước bằng <b>chưng cất</b>; xăng sinh học E5.<br><b>Methanol:</b> rất độc; <b>glycerol:</b> mĩ phẩm, dược phẩm.<br><b>Phenol:</b> từ cumene (sản phẩm kèm acetone); làm nhựa phenol formaldehyde, bisphenol A, thuốc nổ, chất sát trùng."
      },
      "k6": {
        "ten": "Tính toán alcohol, phenol",
        "rule": "<b>Độ rượu:</b> V(ethanol) = V(dung dịch) × độ : 100; m = V × D (ethanol 0,789 g/mL).<br><b>Lên men:</b> {C6H12O6} → 2{C2H5OH} + 2{CO2}; tinh bột qua mắt xích {C6H10O5} 162.<br><b>Nhiệt:</b> Q = n × |Δ<sub>r</sub>H|; đun nước: m(nước) = Q : (4,2 × Δt), Q đổi ra J.<br><b>Phenol từ cumene:</b> 1 cumene → 1 phenol + 1 acetone.<br><b>Hiệu suất:</b> sản phẩm × H, nguyên liệu ÷ H; nhiều giai đoạn nhân các H.<br><b>Công thức:</b> alcohol no, đơn chức, mạch hở {CnH2n+1OH}, M = 14n + 18."
      }
    },
    "TRAPS_THEM": {
      "phenolthom": {
        "ten": "Nhầm phenol, alcohol thơm",
        "hoi": "Nhóm –OH gắn thẳng vào vòng benzene hay qua nhóm –CH₂–? Benzyl alcohol không phải phenol, không tác dụng với NaOH."
      },
      "bacalcol": {
        "ten": "Nhầm bậc alcohol",
        "hoi": "Bậc alcohol là bậc của C mang –OH. Bậc I oxi hoá ra aldehyde, bậc II ra ketone, bậc III không bị CuO oxi hoá."
      },
      "acidhoa": {
        "ten": "Quên acid hoá trước thử",
        "hoi": "Đã acid hoá kiềm dư bằng nitric acid trước khi nhỏ silver nitrate chưa? Chưa acid hoá thì OH⁻ cũng tạo kết tủa, không kết luận được halogen."
      }
    },
    "DANG_KEY": {
      "ALCOHOL_PHENOL.CAU_TAO.CHON_PHAT_BIEU": "k2",
      "ALCOHOL_PHENOL.CAU_TAO.DEM_DONG_PHAN": "k2",
      "ALCOHOL_PHENOL.CAU_TAO.DEM_NGUYEN_TU": "k2",
      "ALCOHOL_PHENOL.CAU_TAO.GOI_TEN": "k2",
      "ALCOHOL_PHENOL.CAU_TAO.NHAN_DANG": "k2",
      "ALCOHOL_PHENOL.CAU_TAO.SO_SANH": "k5",
      "ALCOHOL_PHENOL.CAU_TAO.VIET_CTCT": "k2",
      "ALCOHOL_PHENOL.CAU_TAO.XAC_DINH_CTPT": "k6",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.CHON_PHAT_BIEU": "k1",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.DEM_DONG_PHAN": "k1",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.GOI_TEN": "k1",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.NHAN_DANG": "k1",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.TINH_KHOI_LUONG": "k6",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.TINH_PHAN_TRAM": "k6",
      "ALCOHOL_PHENOL.DAN_XUAT_HALOGEN.VIET_CTCT": "k1",
      "ALCOHOL_PHENOL.TINH_CHAT_ALCOHOL.CHON_PHAT_BIEU": "k3",
      "ALCOHOL_PHENOL.TINH_CHAT_ALCOHOL.NHAN_DANG": "k3",
      "ALCOHOL_PHENOL.TINH_CHAT_ALCOHOL.XAC_DINH_CHAT": "k3",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.CHON_PHAT_BIEU": "k4",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.DEM_DONG_PHAN": "k4",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.GIAI_THICH": "k4",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.NEU_HIEN_TUONG": "k1",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.NHAN_DANG": "k4",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.SO_SANH": "k4",
      "ALCOHOL_PHENOL.TINH_CHAT_PHENOL.XAC_DINH_CHAT": "k4",
      "ALCOHOL_PHENOL.UNG_DUNG.CHON_PHAT_BIEU": "k5",
      "ALCOHOL_PHENOL.UNG_DUNG.DEM_DONG_PHAN": "k6",
      "ALCOHOL_PHENOL.UNG_DUNG.NHAN_DANG": "k5",
      "ALCOHOL_PHENOL.UNG_DUNG.TINH_HIEU_SUAT": "k6",
      "ALCOHOL_PHENOL.UNG_DUNG.TINH_KHOI_LUONG": "k6",
      "ALCOHOL_PHENOL.UNG_DUNG.TINH_NANG_LUONG": "k6",
      "ALCOHOL_PHENOL.UNG_DUNG.TINH_NONG_DO": "k6",
      "ALCOHOL_PHENOL.UNG_DUNG.TINH_THE_TICH": "k6",
      "ALCOHOL_PHENOL.UNG_DUNG.XAC_DINH_CHAT": "k5"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "BANG_TUAN_HOAN": {
    "ma": "BANG_TUAN_HOAN",
    "chuong": "Bảng tuần hoàn",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Cấu trúc bảng tuần hoàn",
        "rule": "<b>Nguyên tắc xếp:</b> theo chiều tăng <b>Z</b>; cùng số lớp e → một hàng (chu kì); cùng số e hoá trị → một cột (nhóm).<br><b>Ô:</b> số thứ tự ô = Z = số p = số e.<br><b>Chu kì:</b> 7 chu kì; chu kì nhỏ 1, 2, 3 có 2, 8, 8 nguyên tố; chu kì lớn 4–7 (18, 18, 32, 32).<br><b>Nhóm:</b> 18 cột = 8 nhóm A (khối s, p) + 8 nhóm B (khối d, f; nhóm VIIIB gồm 3 cột).<br><b>Họ f:</b> lanthanide, actinide đặt riêng hai hàng cuối bảng."
      },
      "k2": {
        "ten": "Cấu hình → vị trí",
        "rule": "<b>Chu kì</b> = số lớp e (n lớn nhất).<br><b>Nhóm A</b> (e cuối vào s hoặc p): số nhóm = <b>số e lớp ngoài cùng</b> ns<sup>a</sup>np<sup>b</sup> → a + b.<br><b>Nhóm B</b> (e cuối vào d): (n−1)d<sup>x</sup>ns<sup>y</sup>, x + y = 3–7 → nhóm (x + y)B; <b>8, 9, 10 → VIIIB</b>; 11 → IB; 12 → IIB.<br><b>Ngược lại:</b> từ chu kì + nhóm viết cấu hình lớp ngoài → Z.<br><b>Ion:</b> tìm cấu hình nguyên tử trước (cộng/trừ lại e) rồi mới xét vị trí."
      },
      "k3": {
        "ten": "Xu hướng biến đổi",
        "rule": "<b>Trong chu kì</b> (trái → phải): bán kính <b>giảm</b>, độ âm điện <b>tăng</b>, tính kim loại giảm, tính phi kim tăng.<br><b>Trong nhóm A</b> (trên → dưới): bán kính <b>tăng</b>, độ âm điện <b>giảm</b>, tính kim loại tăng, tính phi kim giảm.<br><b>Sắp dãy:</b> đặt các nguyên tố lên bảng, so cùng chu kì hoặc cùng nhóm, rồi nối qua nguyên tố trung gian.<br><b>Cực trị:</b> F độ âm điện lớn nhất (3,98); Cs kim loại mạnh nhất (bỏ qua nguyên tố phóng xạ); He bán kính nhỏ nhất.<br><b>Biến đổi tuần hoàn:</b> số e lớp ngoài cùng, bán kính, độ âm điện, hoá trị cao nhất; <b>không</b> tuần hoàn: số lớp e, nguyên tử khối, tổng số e."
      },
      "k4": {
        "ten": "Giải thích xu hướng",
        "rule": "<b>Chu kì:</b> số lớp e <b>không đổi</b>, điện tích hạt nhân tăng → hút e ngoài mạnh hơn → bán kính giảm, khó nhường e, dễ nhận e.<br><b>Nhóm A:</b> số lớp e <b>tăng</b>, bán kính tăng chiếm ưu thế → lực hút e ngoài giảm → dễ nhường e.<br><b>Định nghĩa:</b> tính kim loại = dễ <b>nhường e</b> thành ion dương; tính phi kim = dễ <b>nhận e</b> thành ion âm; độ âm điện = khả năng hút cặp e liên kết.<br><b>Ion cùng số e:</b> Z lớn hơn → bán kính nhỏ hơn ({Na}<sup>+</sup> nhỏ hơn {F}<sup>−</sup>); cation nhỏ hơn nguyên tử, anion lớn hơn nguyên tử.<br><b>Liên kết cộng hoá trị:</b> bán kính = ½ khoảng cách hai hạt nhân ({H2}: 74 pm → 37 pm)."
      },
      "k5": {
        "ten": "Kim loại, phi kim, khí hiếm",
        "rule": "<b>Theo e lớp ngoài cùng:</b> 1–3 e: kim loại (trừ H, He, B); 5–7 e: phi kim; 8 e (He 2 e): khí hiếm.<br><b>Theo vị trí:</b> kim loại ở <b>dưới – bên trái</b>, phi kim ở <b>trên – bên phải</b>; mọi nguyên tố nhóm B là kim loại.<br><b>Nhóm tiêu biểu:</b> IA kim loại kiềm (ns<sup>1</sup>), IIA kiềm thổ (ns<sup>2</sup>), VIIA halogen (ns<sup>2</sup>np<sup>5</sup>), VIIIA khí hiếm.<br><b>Hoạt động:</b> kim loại kiềm tác dụng mạnh với nước tạo kiềm + {H2}; mạnh dần từ Li đến Cs."
      },
      "k6": {
        "ten": "Oxide & hydroxide",
        "rule": "<b>Hoá trị cao nhất với O</b> = số thứ tự nhóm A (n): oxide cao nhất R<sub>2</sub>O<sub>n</sub> ({Na2O}, {MgO}, {Al2O3}, {SiO2}, {P2O5}, {SO3}, {Cl2O7}).<br><b>Với H</b> (nhóm IVA–VIIA): {RH}<sub>8−n</sub>; hoá trị với O + với H = 8.<br><b>Chu kì 3:</b> {NaOH} base mạnh, {Mg(OH)2} base yếu, {Al(OH)3} lưỡng tính, {H2SiO3} acid yếu, {H3PO4} trung bình, {H2SO4} mạnh, {HClO4} rất mạnh.<br><b>Quy luật:</b> trong chu kì tính base của oxide, hydroxide <b>giảm</b>, tính acid <b>tăng</b>; trong nhóm A tính base tăng.<br><b>F:</b> không có oxide cao nhất ứng với nhóm VIIA."
      },
      "k7": {
        "ten": "Tính theo công thức",
        "rule": "<b>Tìm R từ %:</b> oxide cao nhất R<sub>2</sub>O<sub>n</sub>: %R = 2R : (2R + 16n); hợp chất khí với H {RH}<sub>8−n</sub>: %H = (8 − n) : (R + 8 − n); thử n theo nhóm.<br><b>Kim loại + nước/acid:</b> nhóm IA: n<sub>{H2}</sub> = n<sub>M</sub> : 2; nhóm IIA: n<sub>{H2}</sub> = n<sub>M</sub>; M = m : n.<br><b>Hai kim loại kế tiếp trong nhóm:</b> M trung bình nằm giữa hai nguyên tử khối.<br><b>Nồng độ:</b> m<sub>dd</sub> = m<sub>kim loại</sub> + m<sub>nước</sub> − m<sub>{H2}</sub>; C% = m<sub>chất tan</sub> : m<sub>dd</sub> × 100%.<br><b>Kiểm lại:</b> R tìm được phải đúng nhóm đã giả sử."
      }
    },
    "TRAPS_THEM": {
      "hoatri": {
        "ten": "Nhầm hoá trị O và H",
        "hoi": "Nhóm n: hoá trị cao nhất với oxygen là n, với hydrogen là 8 − n. Đề cho hợp chất nào?"
      },
      "nhomab": {
        "ten": "Nhầm nhóm A và B",
        "hoi": "E cuối điền vào d thì nhóm B, phải cộng cả e (n−1)d và ns; e lớp ngoài cùng chỉ quyết định nhóm A."
      },
      "bankinhion": {
        "ten": "Bán kính ion",
        "hoi": "Các ion cùng số electron: Z lớn hơn thì bán kính nhỏ hơn. Đang so nguyên tử hay ion?"
      }
    },
    "DANG_KEY": {
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.NHAN_DANG": "k3",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.NHAN_DANG": "k1",
      "BANG_TUAN_HOAN.VI_TRI_TU_CAU_HINH.NHAN_DANG": "k2",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.XAC_DINH_DIEN_TICH": "k4",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.SO_SANH": "k3",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.CHON_PHAT_BIEU": "k3",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.GIAI_THICH": "k4",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.CHON_PHAT_BIEU": "k5",
      "BANG_TUAN_HOAN.VI_TRI_TU_CAU_HINH.CHON_PHAT_BIEU": "k2",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.CHON_PHAT_BIEU": "k1",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.GIAI_THICH": "k1",
      "BANG_TUAN_HOAN.VI_TRI_TU_CAU_HINH.DEM_NGUYEN_TU": "k2",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.DEM_NGUYEN_TU": "k3",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.DEM_NGUYEN_TU": "k5",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.DEM_DONG_PHAN": "k3",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.NHAN_DANG": "k5",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.TINH_PHAN_TRAM": "k7",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.XAC_DINH_CHAT": "k7",
      "BANG_TUAN_HOAN.XU_HUONG_BIEN_DOI.XAC_DINH_CHAT": "k3",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.DEM_NGUYEN_TU": "k6",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.XAC_DINH_DIEN_TICH": "k2",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.TINH_SO_MOL": "k7",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.TINH_KHOI_LUONG": "k7",
      "BANG_TUAN_HOAN.VI_TRI_TU_CAU_HINH.TINH_PHAN_TRAM": "k7",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.XAC_DINH_CHAT": "k7",
      "BANG_TUAN_HOAN.VI_TRI_TU_CAU_HINH.XAC_DINH_CHAT": "k2",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.DEM_NGUYEN_TU": "k1",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.SO_SANH": "k3",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.DEM_DONG_PHAN": "k1",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.XAC_DINH_DIEN_TICH": "k6",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.NHAN_DANG": "k6",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.VIET_CTCT": "k2",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.CHON_PHAT_BIEU": "k6",
      "BANG_TUAN_HOAN.VI_TRI_TU_CAU_HINH.DEM_DONG_PHAN": "k2",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.XAC_DINH_CTPT": "k7",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.SO_SANH": "k6",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.DEM_DONG_PHAN": "k5",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.VIET_CTCT": "k6",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.DEM_DONG_PHAN": "k6",
      "BANG_TUAN_HOAN.PHAN_LOAI_NGUYEN_TO.NEU_HIEN_TUONG": "k5",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.XAC_DINH_CTPT": "k7",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.TINH_NONG_DO": "k7",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.TINH_PHAN_TRAM": "k7",
      "BANG_TUAN_HOAN.OXIDE_HYDROXIDE.GIAI_THICH": "k6",
      "BANG_TUAN_HOAN.CAU_TRUC_BTH.XAC_DINH_CHAT": "k2"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "CAN_BANG": {
    "ma": "CAN_BANG",
    "chuong": "Cân bằng hoá học",
    "lop": "11",
    "KEYS": {
      "k1": {
        "ten": "Cân bằng & biểu thức KC",
        "rule": "<b>Phản ứng thuận nghịch:</b> xảy ra hai chiều (⇌), không chất nào hết.<br><b>Cân bằng động:</b> v<sub>thuận</sub> = v<sub>nghịch</sub> ≠ 0; nồng độ các chất không đổi nhưng phản ứng vẫn diễn ra.<br><b>Biểu thức:</b> aA + bB ⇌ cC + dD → K<sub>C</sub> = [C]<sup>c</sup>[D]<sup>d</sup> : ([A]<sup>a</sup>[B]<sup>b</sup>); hệ số thành số mũ.<br><b>Không ghi vào K<sub>C</sub>:</b> chất rắn (s), nước là dung môi (l).<br><b>Ý nghĩa:</b> K<sub>C</sub> lớn → cân bằng nghiêng về sản phẩm; K<sub>C</sub> <b>chỉ phụ thuộc nhiệt độ</b>.<br><b>Viết ngược chiều:</b> K<sub>nghịch</sub> = 1 : K<sub>thuận</sub>; nhân đôi hệ số → K<sup>2</sup>."
      },
      "k2": {
        "ten": "Chuyển dịch Le Chatelier",
        "rule": "<b>Nguyên lí:</b> cân bằng chuyển dịch theo chiều <b>làm giảm</b> tác động bên ngoài.<br><b>Nồng độ:</b> thêm chất nào → dịch chiều tiêu thụ chất đó; thêm chất rắn → không dịch.<br><b>Áp suất:</b> tăng p → dịch về phía <b>ít mol khí</b>; tổng hệ số khí hai vế bằng nhau → không dịch.<br><b>Nhiệt độ:</b> tăng T → dịch chiều <b>thu nhiệt</b> (Δ<sub>r</sub>H > 0); phản ứng thuận toả nhiệt thì tăng T làm K<sub>C</sub> giảm.<br><b>Chất xúc tác:</b> không làm chuyển dịch, chỉ giúp đạt cân bằng nhanh hơn.<br><b>Dấu hiệu màu:</b> {NO2} nâu đỏ, {N2O4} không màu → hỗn hợp nhạt màu là dịch sang {N2O4}."
      },
      "k3": {
        "ten": "Bảng cân bằng tính KC",
        "rule": "<b>Lập bảng ba dòng:</b> ban đầu – phản ứng – cân bằng; lượng phản ứng tỉ lệ <b>theo hệ số</b>.<br><b>Đổi nồng độ:</b> C = n : V (V bình kín tính bằng lít) trước khi thế vào K<sub>C</sub>.<br><b>Tính K<sub>C</sub>:</b> chỉ dùng nồng độ <b>lúc cân bằng</b>, không dùng nồng độ ban đầu.<br><b>Biết K<sub>C</sub> tìm nồng độ:</b> đặt x, thế vào biểu thức, giải và loại nghiệm âm hoặc vượt lượng ban đầu.<br><b>Hiệu suất:</b> H = lượng đã phản ứng : lượng phản ứng tối đa (tính theo chất thiếu) × 100%.<br><b>Xét chiều:</b> tính Q<sub>C</sub> như K<sub>C</sub>; Q<sub>C</sub> < K<sub>C</sub> → chiều thuận, Q<sub>C</sub> > K<sub>C</sub> → chiều nghịch."
      },
      "k4": {
        "ten": "Sự điện li & ion",
        "rule": "<b>Điện li mạnh (→):</b> acid mạnh {HCl}, {HBr}, {HI}, {HNO3}, {H2SO4}, {HClO4}; base kiềm {NaOH}, {KOH}, {Ba(OH)2}; hầu hết muối tan.<br><b>Điện li yếu (⇌):</b> {CH3COOH}, {HF}, {H2S}, {H2CO3}, {HNO2}, {HClO}, {H3PO4}; {NH3}; nước.<br><b>Không điện li:</b> glucose, saccharose, ethanol, glycerol; nước cất dẫn điện rất kém.<br><b>Nồng độ ion:</b> nhân <b>chỉ số</b> trong công thức: {Ba(NO3)2} 0,1 M → [{NO3}<sup>−</sup>] = 0,2 M; acid yếu thì [{H}<sup>+</sup>] nhỏ hơn nồng độ acid.<br><b>Bảo toàn điện tích:</b> Σ(mol × điện tích) cation = Σ anion; m muối = Σ m các ion.<br><b>Phương trình ion rút gọn:</b> giữ dạng phân tử chất kết tủa, chất khí, chất điện li yếu."
      },
      "k5": {
        "ten": "Brønsted & môi trường muối",
        "rule": "<b>Định nghĩa:</b> acid <b>cho</b> {H}<sup>+</sup>, base <b>nhận</b> {H}<sup>+</sup>; cặp acid – base liên hợp chỉ khác nhau một {H}<sup>+</sup>.<br><b>Xét từng chiều:</b> {CO3}<sup>2−</sup> + {H2O} ⇌ {HCO3}<sup>−</sup> + {OH}<sup>−</sup>: acid là {H2O} và {HCO3}<sup>−</sup>.<br><b>Lưỡng tính:</b> {HCO3}<sup>−</sup>, {HS}<sup>−</sup>, {H2PO4}<sup>−</sup>, {HPO4}<sup>2−</sup>, {H2O}; {HSO4}<sup>−</sup> chỉ là acid.<br><b>Ion trung tính:</b> {Na}<sup>+</sup>, {K}<sup>+</sup>, {Ca}<sup>2+</sup>, {Ba}<sup>2+</sup>, {Cl}<sup>−</sup>, {NO3}<sup>−</sup>, {SO4}<sup>2−</sup> (không bị thuỷ phân).<br><b>Ion acid:</b> {NH4}<sup>+</sup>, {Al}<sup>3+</sup>, {Fe}<sup>3+</sup>, {Fe}<sup>2+</sup>, {Cu}<sup>2+</sup>, {Zn}<sup>2+</sup> → pH < 7 (phèn chua: {Al}<sup>3+</sup> + {H2O} ⇌ {Al(OH)}<sup>2+</sup> + {H}<sup>+</sup>).<br><b>Ion base:</b> {CO3}<sup>2−</sup>, {S}<sup>2−</sup>, {CH3COO}<sup>−</sup>, {PO4}<sup>3−</sup>, {NO2}<sup>−</sup> → pH > 7."
      },
      "k6": {
        "ten": "pH và tích số ion nước",
        "rule": "<b>Tích số ion của nước:</b> K<sub>w</sub> = [{H}<sup>+</sup>][{OH}<sup>−</sup>] = 10<sup>−14</sup> ở 25 °C, <b>chỉ phụ thuộc nhiệt độ</b>.<br><b>Công thức:</b> pH = −lg[{H}<sup>+</sup>]; [{H}<sup>+</sup>] = 10<sup>−pH</sup>; pH + pOH = 14.<br><b>Môi trường:</b> pH < 7 acid, = 7 trung tính, > 7 base; pH giảm 1 đơn vị → [{H}<sup>+</sup>] tăng 10 lần.<br><b>Pha loãng acid mạnh:</b> pha loãng 10<sup>n</sup> lần → pH tăng n (không vượt quá 7).<br><b>Trộn acid với base:</b> n({H}<sup>+</sup>) và n({OH}<sup>−</sup>) trung hoà 1 : 1; phần dư chia <b>tổng thể tích</b>.<br><b>Chất chỉ thị, thực tế:</b> quỳ acid đỏ, base xanh; phenolphthalein không màu → hồng khi pH ≥ 8,3; mưa acid pH < 5,6; đất chua bón vôi."
      },
      "k7": {
        "ten": "Chuẩn độ acid – base",
        "rule": "<b>Dụng cụ:</b> burette đựng <b>dung dịch chuẩn</b> (biết chính xác nồng độ); pipette lấy dung dịch cần xác định cho vào bình tam giác.<br><b>Chỉ thị:</b> phenolphthalein; chuẩn độ acid bằng {NaOH}, dừng khi xuất hiện màu <b>hồng nhạt bền khoảng 20 giây</b>.<br><b>Điểm tương đương:</b> n({H}<sup>+</sup>) = n({OH}<sup>−</sup>); acid hai nấc nhân 2: 2 C({H2SO4}) · V = C({NaOH}) · V′.<br><b>Thao tác:</b> tráng burette bằng chính dung dịch chuẩn; lặp 3 lần, lấy thể tích trung bình.<br><b>Độ tinh khiết:</b> từ n chất phản ứng → m → % = m tinh khiết : m mẫu × 100%.<br><b>Đọc kết quả:</b> thể tích đã dùng = số đọc sau − số đọc trước."
      }
    },
    "TRAPS_THEM": {
      "chatran": {
        "ten": "Đưa chất rắn vào KC",
        "hoi": "Chất rắn và nước dung môi không có mặt trong K_C, cũng không tính vào số mol khí khi xét áp suất. Đã bỏ chúng ra chưa?"
      },
      "xuctac": {
        "ten": "Xúc tác làm dịch cân bằng",
        "hoi": "Chất xúc tác tăng tốc cả hai chiều như nhau, không làm cân bằng chuyển dịch và không đổi K_C. Ý này có gán cho xúc tác việc tăng lượng sản phẩm không?"
      },
      "chiso": {
        "ten": "Quên nhân chỉ số ion",
        "hoi": "Một phân tử phân li ra mấy ion này? Ba(OH)2 cho 2 OH⁻, H2SO4 cho 2 H⁺, Al2(SO4)3 cho 2 Al³⁺ và 3 SO4²⁻."
      }
    },
    "DANG_KEY": {
      "CAN_BANG.ACID_BASE.CHON_PHAT_BIEU": "k5",
      "CAN_BANG.ACID_BASE.DEM_NGUYEN_TU": "k5",
      "CAN_BANG.ACID_BASE.NHAN_DANG": "k5",
      "CAN_BANG.CAN_BANG.CHON_PHAT_BIEU": "k2",
      "CAN_BANG.CAN_BANG.DEM_DONG_PHAN": "k2",
      "CAN_BANG.CAN_BANG.NEU_HIEN_TUONG": "k2",
      "CAN_BANG.CAN_BANG.NHAN_DANG": "k2",
      "CAN_BANG.CAN_BANG.SO_SANH": "k2",
      "CAN_BANG.CAN_BANG.TINH_HIEU_SUAT": "k3",
      "CAN_BANG.CAN_BANG.TINH_NONG_DO": "k3",
      "CAN_BANG.CAN_BANG.TINH_SO_MOL": "k3",
      "CAN_BANG.CAN_BANG.VIET_PTHH": "k1",
      "CAN_BANG.CAN_BANG.XAC_DINH_CHIEU": "k2",
      "CAN_BANG.CHUAN_DO.CHON_PHAT_BIEU": "k7",
      "CAN_BANG.CHUAN_DO.NEU_HIEN_TUONG": "k7",
      "CAN_BANG.CHUAN_DO.NHAN_DANG": "k7",
      "CAN_BANG.CHUAN_DO.TINH_KHOI_LUONG": "k7",
      "CAN_BANG.CHUAN_DO.TINH_NONG_DO": "k7",
      "CAN_BANG.CHUAN_DO.TINH_PHAN_TRAM": "k7",
      "CAN_BANG.CHUAN_DO.TINH_THE_TICH": "k7",
      "CAN_BANG.DIEN_LI.CHON_PHAT_BIEU": "k4",
      "CAN_BANG.DIEN_LI.DEM_DONG_PHAN": "k4",
      "CAN_BANG.DIEN_LI.DEM_NGUYEN_TU": "k6",
      "CAN_BANG.DIEN_LI.GIAI_THICH": "k4",
      "CAN_BANG.DIEN_LI.NEU_HIEN_TUONG": "k4",
      "CAN_BANG.DIEN_LI.NHAN_DANG": "k4",
      "CAN_BANG.DIEN_LI.SO_SANH": "k4",
      "CAN_BANG.DIEN_LI.TINH_KHOI_LUONG": "k4",
      "CAN_BANG.DIEN_LI.TINH_NONG_DO": "k4",
      "CAN_BANG.DIEN_LI.TINH_SO_MOL": "k4",
      "CAN_BANG.DIEN_LI.VIET_PTHH": "k4",
      "CAN_BANG.HANG_SO_K.CHON_PHAT_BIEU": "k1",
      "CAN_BANG.HANG_SO_K.NHAN_DANG": "k1",
      "CAN_BANG.HANG_SO_K.TINH_HANG_SO": "k3",
      "CAN_BANG.HANG_SO_K.TINH_HIEU_SUAT": "k3",
      "CAN_BANG.HANG_SO_K.TINH_KHOI_LUONG": "k3",
      "CAN_BANG.HANG_SO_K.TINH_NONG_DO": "k3",
      "CAN_BANG.HANG_SO_K.TINH_SO_MOL": "k3",
      "CAN_BANG.HANG_SO_K.VIET_PTHH": "k1",
      "CAN_BANG.PH_DUNG_DICH.CHON_PHAT_BIEU": "k6",
      "CAN_BANG.PH_DUNG_DICH.DEM_DONG_PHAN": "k5",
      "CAN_BANG.PH_DUNG_DICH.NEU_HIEN_TUONG": "k6",
      "CAN_BANG.PH_DUNG_DICH.NHAN_DANG": "k6",
      "CAN_BANG.PH_DUNG_DICH.SO_SANH": "k6",
      "CAN_BANG.PH_DUNG_DICH.TINH_KHOI_LUONG": "k6",
      "CAN_BANG.PH_DUNG_DICH.TINH_NONG_DO": "k6",
      "CAN_BANG.PH_DUNG_DICH.TINH_THE_TICH": "k6",
      "CAN_BANG.PH_DUNG_DICH.TINH_TI_SO": "k6",
      "CAN_BANG.THUY_PHAN_MUOI.TINH_NONG_DO": "k5",
      "CAN_BANG.THUY_PHAN_MUOI.VIET_PTHH": "k5"
    },
    "daDuyet": "máy dựng 29/09"
  },
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
  "CARBONYL_ACID": {
    "ma": "CARBONYL_ACID",
    "chuong": "Hợp chất carbonyl – carboxylic acid",
    "lop": "11",
    "KEYS": {
      "k1": {
        "ten": "Cấu tạo & gọi tên",
        "rule": "<b>Nhóm chức:</b> aldehyde –CHO; ketone R–CO–R′ (C=O giữa hai C); carboxylic acid –COOH.<br><b>Tên thay thế:</b> C của –CHO, –COOH là C số 1; aldehyde đuôi <b>-al</b> (propanal), ketone <b>-an-x-one</b> (propan-2-one = acetone), acid <b>-oic acid</b> (ethanoic acid = acetic acid).<br><b>Tên thường:</b> formaldehyde {HCHO}, acetaldehyde {CH3CHO}, formic acid {HCOOH}, acrylic acid {CH2=CHCOOH}, oxalic acid {HOOC-COOH}, benzoic acid {C6H5COOH}.<br><b>Công thức chung:</b> aldehyde, ketone no, đơn chức, mạch hở {CnH2nO}; acid no, đơn chức, mạch hở {CnH2nO2}.<br><b>Phổ IR:</b> C=O khoảng 1740–1670 cm<sup>−1</sup>; acid thêm O–H rất rộng 3300–2500."
      },
      "k2": {
        "ten": "Đếm đồng phân",
        "rule": "<b>Mẹo gốc alkyl:</b> số gốc alkyl có 1, 2, 3, 4 C lần lượt là 1, 1, 2, 4.<br><b>Aldehyde {CnH2nO}:</b> = số gốc alkyl có (n − 1) C: {C4H8O} có 2, {C5H10O} có 4.<br><b>Acid {CnH2nO2}:</b> cũng vậy: {C4H8O2} có 2, {C5H10O2} có 4.<br><b>Ketone:</b> {C3H6O} 1, {C4H8O} 1, {C5H10O} 3.<br><b>Carbonyl {C4H8O}</b> = 2 aldehyde + 1 ketone = 3.<br><b>Cách làm:</b> vẽ mạch C, gắn nhóm chức vào từng vị trí khác nhau; bỏ cách vẽ trùng."
      },
      "k3": {
        "ten": "Khử, oxi hoá & nhận biết",
        "rule": "<b>Tráng bạc:</b> chất có –CHO + {AgNO3}/{NH3} → Ag; RCHO → 2Ag, <b>HCHO → 4Ag</b>; formic acid, ester của formic acid cũng tráng bạc; ketone không.<br><b>{Cu(OH)2}/{OH}<sup>−</sup> đun nóng:</b> aldehyde → {Cu2O} đỏ gạch; acid hoà tan {Cu(OH)2} → dung dịch xanh; alcohol đơn chức không.<br><b>Nước bromine:</b> aldehyde làm mất màu, ketone không.<br><b>Khử bằng {NaBH4} hoặc {LiAlH4}:</b> aldehyde → alcohol bậc I, ketone → alcohol bậc II.<br><b>Iodoform:</b> có nhóm {CH3CO-} (hoặc {CH3CH(OH)-}) + {I2}/NaOH → {CHI3} kết tủa vàng.<br><b>Cộng HCN:</b> tạo cyanohydrin, mạch tăng 1 C."
      },
      "k4": {
        "ten": "Tính acid",
        "rule": "<b>Acid yếu:</b> phân li một phần, làm quỳ hoá đỏ.<br><b>Phản ứng:</b> với kim loại trước H → {H2}; base, basic oxide → muối + {H2O}; muối carbonate → {CO2} <b>sủi bọt</b>.<br><b>So sánh:</b> K<sub>a</sub> lớn → acid mạnh; HCOOH > {CH3COOH} > {C2H5COOH} (gốc alkyl đẩy electron); nhóm hút electron như Cl làm tăng tính acid.<br><b>Nồng độ:</b> [{H}<sup>+</sup>] = C × α; pH = −lg[{H}<sup>+</sup>]; trung hoà: n({OH}<sup>−</sup>) = n(–COOH).<br><b>Đời sống:</b> giảm chua bằng base yếu, rẻ như nước vôi {Ca(OH)2}; giấm là acetic acid 2–5%."
      },
      "k5": {
        "ten": "Nhiệt độ sôi & ứng dụng",
        "rule": "<b>Nhiệt độ sôi (phân tử khối tương đương):</b> acid > alcohol > aldehyde, ketone > hydrocarbon.<br><b>Lí do:</b> acid tạo liên kết hydrogen <b>bền hơn</b> alcohol (tạo dimer); aldehyde, ketone không có liên kết hydrogen giữa các phân tử.<br><b>Tan:</b> chất nhỏ tan tốt nhờ liên kết hydrogen với nước.<br><b>Ứng dụng:</b> formalin (formon) 37–40% ngâm mẫu vật, <b>cấm</b> bảo quản thực phẩm; acetone làm dung môi; acetic acid làm giấm, sản xuất ester, tơ; nước đá khô ({CO2} rắn) bảo quản an toàn."
      },
      "k6": {
        "ten": "Điều chế & chuỗi phản ứng",
        "rule": "<b>Aldehyde, ketone:</b> oxi hoá alcohol bậc I, bậc II bằng CuO; acetaldehyde từ oxi hoá ethylene; <b>acetone cùng phenol từ cumene</b> (1 : 1 : 1).<br><b>Acetic acid:</b> lên men giấm {C2H5OH} + {O2} → {CH3COOH} + {H2O}; {CH3OH} + CO; oxi hoá butane.<br><b>Ester hoá:</b> RCOOH + R′OH ⇌ RCOOR′ + {H2O} ({H2SO4} đặc, đun); acid mất –OH, alcohol mất H.<br><b>Đọc chuỗi:</b> {C2H4} → {C2H5OH} → {CH3CHO} (M = 44) → {CH3COOH} → ester; đi từ chất cuối ngược lại."
      },
      "k7": {
        "ten": "Tính toán",
        "rule": "<b>Tìm chất:</b> số O = %O × M : 1600; mỗi –COOH có 2 O, –OH có 1 O.<br><b>Tráng bạc:</b> n(Ag) = 2n(RCHO), 4n(HCHO).<br><b>Ester hoá:</b> so số mol acid, alcohol theo tỉ lệ 1 : 1, <b>H tính theo chất thiếu</b>; H = thực tế : lí thuyết × 100%.<br><b>Nhiều giai đoạn:</b> H chung = H<sub>1</sub> × H<sub>2</sub> × …; sản phẩm × H, nguyên liệu ÷ H.<br><b>Khí:</b> n = V : 24,79 (25 °C, 1 bar); nồng độ trong hơi thở theo mg/L đổi qua số mol ethanol theo phương trình đã cân bằng."
      }
    },
    "TRAPS_THEM": {
      "trangbac": {
        "ten": "Nhầm chất tráng bạc",
        "hoi": "Chất có nhóm –CHO thật không? Ketone không tráng bạc; formic acid và ester của nó lại có; acetylene tạo kết tủa vàng nhạt chứ không tạo bạc."
      },
      "bonag": {
        "ten": "Quên HCHO cho 4 Ag",
        "hoi": "Aldehyde là formaldehyde hay aldehyde hai chức? Mỗi mol của chúng cho 4 mol Ag, không phải 2."
      },
      "chatthieu": {
        "ten": "Tính theo chất dư",
        "hoi": "Trong ester hoá, chất nào có số mol nhỏ hơn theo tỉ lệ 1 : 1? Hiệu suất phải tính theo chất thiếu, không theo chất cho nhiều gam hơn."
      }
    },
    "DANG_KEY": {
      "CARBONYL_ACID.CAU_TAO.CHON_PHAT_BIEU": "k1",
      "CARBONYL_ACID.CAU_TAO.DEM_DONG_PHAN": "k2",
      "CARBONYL_ACID.CAU_TAO.DEM_NGUYEN_TU": "k1",
      "CARBONYL_ACID.CAU_TAO.GOI_TEN": "k1",
      "CARBONYL_ACID.CAU_TAO.NHAN_DANG": "k1",
      "CARBONYL_ACID.CAU_TAO.SO_SANH": "k5",
      "CARBONYL_ACID.CAU_TAO.TINH_HIEU_SUAT": "k7",
      "CARBONYL_ACID.CAU_TAO.TINH_NONG_DO": "k7",
      "CARBONYL_ACID.CAU_TAO.VIET_CTCT": "k1",
      "CARBONYL_ACID.DIEU_CHE.CHON_PHAT_BIEU": "k6",
      "CARBONYL_ACID.DIEU_CHE.GOI_TEN": "k6",
      "CARBONYL_ACID.DIEU_CHE.NHAN_DANG": "k6",
      "CARBONYL_ACID.DIEU_CHE.TINH_HIEU_SUAT": "k7",
      "CARBONYL_ACID.DIEU_CHE.XAC_DINH_CTPT": "k6",
      "CARBONYL_ACID.PHAN_UNG_OXH.CHON_PHAT_BIEU": "k3",
      "CARBONYL_ACID.PHAN_UNG_OXH.DEM_DONG_PHAN": "k3",
      "CARBONYL_ACID.PHAN_UNG_OXH.NHAN_DANG": "k3",
      "CARBONYL_ACID.PHAN_UNG_OXH.TINH_HIEU_SUAT": "k7",
      "CARBONYL_ACID.PHAN_UNG_OXH.VIET_CTCT": "k3",
      "CARBONYL_ACID.PHAN_UNG_OXH.XAC_DINH_CHAT": "k3",
      "CARBONYL_ACID.TINH_ACID.CHON_PHAT_BIEU": "k4",
      "CARBONYL_ACID.TINH_ACID.NEU_HIEN_TUONG": "k4",
      "CARBONYL_ACID.TINH_ACID.NHAN_DANG": "k4",
      "CARBONYL_ACID.TINH_ACID.TINH_NONG_DO": "k4",
      "CARBONYL_ACID.UNG_DUNG.CHON_PHAT_BIEU": "k5",
      "CARBONYL_ACID.UNG_DUNG.NHAN_DANG": "k5",
      "CARBONYL_ACID.UNG_DUNG.TINH_KHOI_LUONG": "k7",
      "CARBONYL_ACID.UNG_DUNG.TINH_THE_TICH": "k7"
    },
    "daDuyet": "máy dựng 29/09"
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
  "HALOGEN": {
    "ma": "HALOGEN",
    "chuong": "Halogen",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Đơn chất halogen",
        "rule": "<b>Nhóm VIIA:</b> F, Cl, Br, I; lớp ngoài <b>ns<sup>2</sup>np<sup>5</sup></b>, dễ nhận 1 e; phân tử hai nguyên tử {X2}.<br><b>Trạng thái, màu:</b> {F2} khí lục nhạt; {Cl2} khí vàng lục; {Br2} lỏng nâu đỏ; {I2} rắn tím đen, dễ thăng hoa.<br><b>Số oxi hoá:</b> F chỉ có −1; Cl, Br, I có −1, +1, +3, +5, +7.<br><b>Tự nhiên:</b> chỉ tồn tại ở dạng <b>hợp chất</b> (muối halide trong nước biển, mỏ muối; iodine trong rong biển).<br><b>Xu hướng F → I:</b> bán kính, nhiệt độ sôi, nóng chảy tăng; độ âm điện giảm."
      },
      "k2": {
        "ten": "Tính oxi hoá giảm dần",
        "rule": "<b>Thứ tự:</b> <b>{F2} > {Cl2} > {Br2} > {I2}</b>.<br><b>Với {H2}:</b> {F2} nổ cả trong bóng tối; {Cl2} cần ánh sáng; {Br2} cần đun nóng; {I2} ở nhiệt độ cao, thuận nghịch.<br><b>Đẩy nhau:</b> halogen mạnh đẩy halogen yếu khỏi dung dịch muối: {Cl2} + 2{NaBr} → 2{NaCl} + {Br2}; {Br2} + 2{NaI} → 2{NaBr} + {I2}.<br><b>Ngoại lệ {F2}:</b> oxi hoá nước trước (2{F2} + 2{H2O} → 4{HF} + {O2}), không dùng để đẩy halogen trong dung dịch.<br><b>Với kim loại:</b> tạo muối hoá trị cao (2{Fe} + 3{Cl2} → 2{FeCl3})."
      },
      "k3": {
        "ten": "Chlorine gặp nước, kiềm",
        "rule": "<b>Với nước:</b> {Cl2} + {H2O} ⇌ {HCl} + {HClO}; {HClO} oxi hoá mạnh → tẩy màu, sát khuẩn.<br><b>Với {NaOH} thường:</b> {Cl2} + 2{NaOH} → {NaCl} + {NaClO} + {H2O} (nước Javel).<br><b>Với kiềm nóng (~70 °C):</b> 3{Cl2} + 6{KOH} → 5{KCl} + {KClO3} + 3{H2O}.<br><b>Vai trò:</b> các phản ứng trên {Cl2} vừa là chất oxi hoá vừa là chất khử (Cl 0 → −1 và +1/+5).<br><b>Quỳ tím ẩm:</b> gặp {Cl2} hoá đỏ rồi mất màu."
      },
      "k4": {
        "ten": "Hydrogen halide",
        "rule": "<b>Nhiệt độ sôi:</b> {HCl} < {HBr} < {HI} (M tăng, van der Waals tăng); <b>{HF} cao bất thường</b> do liên kết hydrogen.<br><b>Tính acid:</b> {HF} < {HCl} < {HBr} < {HI}; {HF} là <b>acid yếu</b>, còn lại acid mạnh (độ bền liên kết H–X giảm từ HF đến HI).<br><b>{HF} đặc biệt:</b> ăn mòn thuỷ tinh: {SiO2} + 4{HF} → {SiF4} + 2{H2O}.<br><b>Tính khử:</b> {HF} < {HCl} < {HBr} < {HI}.<br><b>Ở thể khí:</b> không làm đổi màu quỳ khô; tan nhiều trong nước tạo dung dịch acid."
      },
      "k5": {
        "ten": "Ion halide & nhận biết",
        "rule": "<b>Với {AgNO3}:</b> {AgCl} trắng, {AgBr} vàng nhạt, {AgI} vàng; <b>{AgF} tan</b> (không kết tủa).<br><b>Tính khử ion:</b> {F}<sup>−</sup> < {Cl}<sup>−</sup> < {Br}<sup>−</sup> < {I}<sup>−</sup>.<br><b>Với {H2SO4} đặc:</b> {NaCl} → {HCl} (không oxi hoá); {NaBr} → {Br2} + {SO2}; {NaI} → {I2} + {H2S}.<br><b>Nhận {I2}:</b> gặp hồ tinh bột → <b>xanh tím</b>.<br><b>Đếm nhận biết:</b> mỗi ion một dấu hiệu riêng; ion không tạo dấu hiệu thì nhận sau cùng."
      },
      "k6": {
        "ten": "Điều chế, ứng dụng, tính",
        "rule": "<b>Phòng thí nghiệm:</b> {HCl} đặc + chất oxi hoá: {MnO2} + 4{HCl} → {MnCl2} + {Cl2} + 2{H2O} (đun nóng); 2{KMnO4} + 16{HCl} → 2{KCl} + 2{MnCl2} + 5{Cl2} + 8{H2O}.<br><b>Công nghiệp:</b> điện phân dung dịch {NaCl} có màng ngăn: 2{NaCl} + 2{H2O} → 2{NaOH} + {H2} + {Cl2}.<br><b>Ứng dụng:</b> {Cl2} khử trùng nước, sản xuất PVC, nước Javel; fluoride trong kem đánh răng; iodine bổ sung qua muối iod, rong biển.<br><b>Tính:</b> theo phương trình hoặc <b>bảo toàn electron</b> (mỗi {Cl2} tạo ra nhận/nhường 2 e); nhớ × H nếu có hiệu suất.<br><b>Thể tích khí:</b> 24,79 L/mol ở 25 °C, 1 bar."
      }
    },
    "TRAPS_THEM": {
      "fluorngoaile": {
        "ten": "Ngoại lệ của fluorine",
        "hoi": "F2 phản ứng với nước trước, F chỉ có số oxi hoá −1, HF là acid yếu nhưng sôi cao nhất, AgF tan. Ý này có dính F không?"
      },
      "chieuday": {
        "ten": "Nhầm chiều dãy halogen",
        "hoi": "Từ F đến I: tính oxi hoá đơn chất giảm, nhưng tính khử ion halide và tính acid HX lại tăng. Đang xét đơn chất hay ion/HX?"
      }
    },
    "DANG_KEY": {
      "HALOGEN.ION_HALIDE.NHAN_DANG": "k5",
      "HALOGEN.HYDROGEN_HALIDE.SO_SANH": "k4",
      "HALOGEN.HYDROGEN_HALIDE.NHAN_DANG": "k4",
      "HALOGEN.HYDROGEN_HALIDE.CHON_PHAT_BIEU": "k4",
      "HALOGEN.PHAN_UNG_HALOGEN.NHAN_DANG": "k2",
      "HALOGEN.ION_HALIDE.DEM_DONG_PHAN": "k5",
      "HALOGEN.ION_HALIDE.SO_SANH": "k5",
      "HALOGEN.DON_CHAT_HALOGEN.NHAN_DANG": "k1",
      "HALOGEN.PHAN_UNG_HALOGEN.NEU_HIEN_TUONG": "k2",
      "HALOGEN.DON_CHAT_HALOGEN.CHON_PHAT_BIEU": "k1",
      "HALOGEN.UNG_DUNG_DIEU_CHE.TINH_KHOI_LUONG": "k6",
      "HALOGEN.UNG_DUNG_DIEU_CHE.CHON_PHAT_BIEU": "k6",
      "HALOGEN.PHAN_UNG_HALOGEN.DEM_DONG_PHAN": "k2",
      "HALOGEN.PHAN_UNG_HALOGEN.TINH_KHOI_LUONG": "k6",
      "HALOGEN.UNG_DUNG_DIEU_CHE.DEM_DONG_PHAN": "k6"
    },
    "daDuyet": "máy dựng 29/09"
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
  "HUU_CO_DAI_CUONG": {
    "ma": "HUU_CO_DAI_CUONG",
    "chuong": "Đại cương hoá học hữu cơ",
    "lop": "11",
    "KEYS": {
      "k1": {
        "ten": "Nhóm chức & phân loại",
        "rule": "<b>Hữu cơ:</b> hợp chất của carbon, trừ CO, {CO2}, muối carbonate, cyanide, carbide…<br><b>Hydrocarbon:</b> chỉ có C, H; <b>dẫn xuất:</b> có thêm O, N, halogen…<br><b>Nhóm chức:</b> –OH gắn C no là alcohol, gắn thẳng vòng benzene là phenol; –CHO aldehyde; >C=O giữa hai C là ketone; –COOH (C=O và O–H trên <b>cùng một C</b>) carboxylic acid; –COO– ester; –{NH2} amine; C–O–C ether.<br><b>Đặc điểm chung:</b> liên kết chủ yếu cộng hoá trị, nhiệt độ sôi thấp, dễ cháy, phản ứng chậm và cho hỗn hợp sản phẩm.<br><b>Nguồn gốc:</b> có trong tự nhiên <b>và</b> tổng hợp nhân tạo."
      },
      "k2": {
        "ten": "Đọc phổ IR & phổ khối",
        "rule": "<b>Phổ IR:</b> cho biết <b>nhóm chức</b> (cấu tạo), không cho phân tử khối.<br><b>Vùng hay gặp (cm<sup>−1</sup>):</b> O–H alcohol, phenol 3650–3200, <b>rộng</b>; O–H acid 3300–2500, rất rộng, luôn kèm C=O; N–H 3500–3300; C=O khoảng 1750–1670.<br><b>Cách làm:</b> soi vùng C=O trước, rồi vùng O–H; có cả hai là –COOH.<br><b>Phổ khối (MS):</b> peak <b>ion phân tử</b> [M]<sup>+</sup> có m/z lớn nhất → phân tử khối; <b>peak cơ bản</b> là peak cao nhất (mảnh bền), không phải M."
      },
      "k3": {
        "ten": "Lập công thức phân tử",
        "rule": "<b>Biết M và %:</b> số nguyên tử X = <b>%X × M : (100 × A<sub>X</sub>)</b>.<br><b>Chưa biết M:</b> C : H : O = %C/12 : %H/1 : %O/16 → công thức đơn giản nhất, rồi (CTĐGN)<sub>n</sub> = M từ phổ khối.<br><b>Đốt cháy:</b> n<sub>C</sub> = n({CO2}), n<sub>H</sub> = 2n({H2O}), m<sub>O</sub> = m − m<sub>C</sub> − m<sub>H</sub>.<br><b>Kiểm:</b> số liên kết π + vòng = (2C + 2 + N − H − X) : 2 phải nguyên, không âm; %O = 100 − %C − %H."
      },
      "k4": {
        "ten": "Cấu tạo & đồng phân",
        "rule": "<b>Hoá trị:</b> C 4, O 2, N 3, H và halogen 1; công thức đúng khi mọi nguyên tử đủ hoá trị.<br><b>Công thức khung:</b> mỗi đỉnh, đầu mút là một C; H gắn C được ngầm hiểu.<br><b>Đồng phân:</b> <b>cùng công thức phân tử</b>, khác cấu tạo (mạch C, vị trí nhóm chức, loại nhóm chức) → so công thức phân tử trước.<br><b>Đồng đẳng:</b> hơn kém nhau n nhóm {CH2}, cùng loại nhóm chức, tính chất tương tự."
      },
      "k5": {
        "ten": "Tách & tinh chế",
        "rule": "<b>Chưng cất:</b> chất lỏng có nhiệt độ sôi khác nhau; chênh ít → chưng cất phân đoạn; tinh dầu không tan trong nước, dễ hỏng ở nhiệt độ cao → <b>lôi cuốn hơi nước</b>.<br><b>Chiết:</b> hai chất lỏng không tan vào nhau, lớp có <b>khối lượng riêng nhỏ nằm trên</b>; chiết lỏng – rắn bằng dung môi.<br><b>Kết tinh:</b> chất rắn, dựa vào <b>độ tan đổi theo nhiệt độ</b>.<br><b>Sắc kí cột:</b> chất bị hấp phụ yếu ra trước.<br><b>Lắp dụng cụ:</b> bầu nhiệt kế ngang nhánh, sinh hàn nước vào thấp ra cao, đá bọt, chất lỏng ≤ 2/3 bình."
      }
    },
    "TRAPS_THEM": {
      "peakcoban": {
        "ten": "Nhầm peak phổ khối",
        "hoi": "Đang đọc peak có m/z lớn nhất (ion phân tử) hay peak cao nhất (peak cơ bản)? Chỉ ion phân tử cho phân tử khối."
      },
      "vungir": {
        "ten": "Nhầm vùng phổ IR",
        "hoi": "Tín hiệu nằm ở vùng nào? Peak rộng quanh 3300 cm⁻¹ là nhóm –OH, không phải C=O; C=O ở khoảng 1750–1670 cm⁻¹."
      },
      "cungctpt": {
        "ten": "Quên so công thức phân tử",
        "hoi": "Hai chất đã cùng công thức phân tử chưa? Khác công thức phân tử thì không phải đồng phân, dù cùng nhóm chức."
      }
    },
    "DANG_KEY": {
      "HUU_CO_DAI_CUONG.CAU_TAO_HH.DEM_NGUYEN_TU": "k4",
      "HUU_CO_DAI_CUONG.CAU_TAO_HH.NHAN_DANG": "k4",
      "HUU_CO_DAI_CUONG.CAU_TAO_HH.XAC_DINH_CTPT": "k4",
      "HUU_CO_DAI_CUONG.LAP_CTPT.NHAN_DANG": "k3",
      "HUU_CO_DAI_CUONG.LAP_CTPT.XAC_DINH_CTPT": "k3",
      "HUU_CO_DAI_CUONG.PHAN_LOAI.CHON_PHAT_BIEU": "k1",
      "HUU_CO_DAI_CUONG.PHAN_LOAI.DEM_DONG_PHAN": "k1",
      "HUU_CO_DAI_CUONG.PHAN_LOAI.DEM_NGUYEN_TU": "k1",
      "HUU_CO_DAI_CUONG.PHAN_LOAI.NHAN_DANG": "k1",
      "HUU_CO_DAI_CUONG.PHO.CHON_PHAT_BIEU": "k2",
      "HUU_CO_DAI_CUONG.PHO.DEM_DONG_PHAN": "k2",
      "HUU_CO_DAI_CUONG.PHO.DEM_NGUYEN_TU": "k2",
      "HUU_CO_DAI_CUONG.PHO.NHAN_DANG": "k2",
      "HUU_CO_DAI_CUONG.PHO.XAC_DINH_CHAT": "k2",
      "HUU_CO_DAI_CUONG.PHO.XAC_DINH_CTPT": "k3",
      "HUU_CO_DAI_CUONG.TACH_CHAT.CHON_PHAT_BIEU": "k5",
      "HUU_CO_DAI_CUONG.TACH_CHAT.DEM_DONG_PHAN": "k5",
      "HUU_CO_DAI_CUONG.TACH_CHAT.NHAN_DANG": "k5",
      "HUU_CO_DAI_CUONG.TACH_CHAT.SO_SANH": "k5",
      "HUU_CO_DAI_CUONG.TACH_CHAT.TINH_KHOI_LUONG": "k5"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "HYDROCARBON": {
    "ma": "HYDROCARBON",
    "chuong": "Hydrocarbon",
    "lop": "11",
    "KEYS": {
      "k1": {
        "ten": "Gọi tên & đồng phân",
        "rule": "<b>Mạch chính:</b> dài nhất, chứa liên kết bội; đánh số từ đầu <b>gần liên kết bội</b> (alkane: gần nhánh).<br><b>Tên:</b> vị trí nhánh – tên nhánh + tên mạch chính + vị trí liên kết bội + ane/ene/yne: 2-methylbutane, but-2-ene, pent-1-yne.<br><b>Đồng phân hình học:</b> <b>mỗi C</b> của C=C mang hai nhóm khác nhau; cùng phía là cis.<br><b>Tên thường:</b> isopentane = 2-methylbutane; acetylene {C2H2}; methylacetylene = propyne; toluene {C6H5CH3}; styrene {C6H5CH=CH2}; cumene = isopropylbenzene; xylene = dimethylbenzene.<br><b>Đếm đồng phân:</b> vẽ mạch C từ dài đến ngắn, rồi dời vị trí nhánh, liên kết bội; bỏ cách vẽ trùng."
      },
      "k2": {
        "ten": "Liên kết & hình dạng",
        "rule": "<b>Liên kết:</b> đơn = 1σ; đôi = 1σ + 1π; ba = 1σ + 2π; số σ = tổng số liên kết (kể cả C–H).<br><b>Hình dạng:</b> methane tứ diện; ethylene phẳng, góc 120°; acetylene <b>thẳng</b>, 180°; benzene lục giác đều, phẳng.<br><b>Công thức chung:</b> alkane {CnH2n+2}; alkene {CnH2n}; alkyne {CnH2n-2}; dãy benzene {CnH2n-6}.<br><b>Số π + vòng</b> = (2C + 2 − H) : 2.<br><b>Công thức khung:</b> đếm từng đỉnh là một C; nhóm methyl là đầu mút nhánh."
      },
      "k3": {
        "ten": "Phản ứng đặc trưng",
        "rule": "<b>Alkane:</b> thế halogen khi chiếu sáng (cho hỗn hợp sản phẩm), cracking, reforming, cháy; <b>không</b> làm mất màu {Br2}, {KMnO4}.<br><b>Alkene, alkyne:</b> cộng {H2}, {Br2} (mất màu), HX, {H2O} theo <b>Markovnikov</b>: H vào C mang nhiều H hơn; trùng hợp; alkene + {KMnO4} → diol, có kết tủa nâu đen {MnO2}.<br><b>Alk-1-yne:</b> C≡C đầu mạch + {AgNO3}/{NH3} → kết tủa vàng nhạt; acetylene cho {AgC≡CAg}.<br><b>Benzene:</b> thế ({Br2}/{FeBr3}, {HNO3}/{H2SO4} đặc); cộng khó ({H2}/Ni, {Cl2} chiếu sáng → {C6H6Cl6}); không mất màu nước bromine.<br><b>Toluene:</b> thế o/p dễ hơn benzene; {KMnO4} đun nóng oxi hoá nhóm –{CH3}."
      },
      "k4": {
        "ten": "Tính chất vật lí",
        "rule": "<b>Thể:</b> ở điều kiện thường, chất có <b>nhiệt độ sôi dưới 25 °C</b> là khí; alkane C<sub>1</sub>–C<sub>4</sub> là khí.<br><b>Nhiệt độ sôi:</b> tăng theo phân tử khối; cùng số C, <b>nhiều nhánh sôi thấp hơn</b>.<br><b>Tan:</b> hydrocarbon không phân cực, không tan trong nước, nhẹ hơn nước → nổi, tách lớp; tan trong dung môi hữu cơ.<br><b>Arene:</b> benzene, toluene lỏng, mùi thơm; naphthalene rắn, dễ thăng hoa (băng phiến)."
      },
      "k5": {
        "ten": "Dầu mỏ & ứng dụng",
        "rule": "<b>Cracking:</b> cắt mạch dài → alkane và alkene mạch ngắn.<br><b>Reforming:</b> mạch không nhánh → mạch nhánh, vòng, arene, <b>tăng chỉ số octane</b>, số C giữ nguyên.<br><b>Methane:</b> khí thiên nhiên, biogas, khí gây hiệu ứng nhà kính.<br><b>Ethylene:</b> kích thích quả chín, sản xuất PE; <b>acetylene:</b> đèn xì oxygen – acetylene, điều chế {CaC2} + 2{H2O} → {C2H2} + {Ca(OH)2}.<br><b>Arene:</b> benzene độc, gây ung thư; toluene làm dung môi, sản xuất TNT."
      },
      "k6": {
        "ten": "Tính theo phương trình",
        "rule": "<b>Khí:</b> n = V : 24,79 (25 °C, 1 bar); ppm = phần triệu thể tích.<br><b>Tìm chất:</b> %C và M từ phổ khối → số C, số H.<br><b>Đốt cháy:</b> alkane n({H2O}) > n({CO2}), n(alkane) = n({H2O}) − n({CO2}); alkene hai số bằng nhau; alkyne n = n({CO2}) − n({H2O}).<br><b>Phần trăm giảm</b> = (trước − sau) : trước × 100%.<br><b>Hiệu suất:</b> sản phẩm × H, nguyên liệu ÷ H; nhiệt toả ra Q = n × |Δ<sub>r</sub>H|."
      }
    },
    "TRAPS_THEM": {
      "markovnikov": {
        "ten": "Cộng ngược quy tắc",
        "hoi": "Nguyên tử H của HX hay H₂O gắn vào C nào của C=C? Theo Markovnikov, H vào C mang nhiều H hơn, X hoặc OH vào C bậc cao hơn."
      },
      "benzenbrom": {
        "ten": "Coi benzene như alkene",
        "hoi": "Chất có C=C ngoài vòng không? Benzene, toluene không làm mất màu nước bromine ở điều kiện thường; styrene thì có."
      },
      "ankindau": {
        "ten": "Nhầm alkyne đầu mạch",
        "hoi": "Liên kết ba có nằm ở đầu mạch (còn H gắn C≡C) không? Chỉ alk-1-yne tạo kết tủa với silver nitrate trong ammonia; but-2-yne thì không."
      }
    },
    "DANG_KEY": {
      "HYDROCARBON.CAU_TAO.CHON_PHAT_BIEU": "k2",
      "HYDROCARBON.CAU_TAO.DEM_DONG_PHAN": "k1",
      "HYDROCARBON.CAU_TAO.DEM_NGUYEN_TU": "k2",
      "HYDROCARBON.CAU_TAO.GOI_TEN": "k1",
      "HYDROCARBON.CAU_TAO.NHAN_DANG": "k1",
      "HYDROCARBON.CAU_TAO.SO_SANH": "k4",
      "HYDROCARBON.CAU_TAO.TINH_PHAN_TRAM": "k6",
      "HYDROCARBON.CAU_TAO.VIET_CTCT": "k1",
      "HYDROCARBON.CAU_TAO.XAC_DINH_CTPT": "k6",
      "HYDROCARBON.LIEN_KET_PHAN_TU.DEM_LIEN_KET_PI": "k2",
      "HYDROCARBON.LIEN_KET_PHAN_TU.NHAN_DANG": "k2",
      "HYDROCARBON.PHAN_UNG.CHON_PHAT_BIEU": "k3",
      "HYDROCARBON.PHAN_UNG.DEM_DONG_PHAN": "k3",
      "HYDROCARBON.PHAN_UNG.DEM_NGUYEN_TU": "k3",
      "HYDROCARBON.PHAN_UNG.GOI_TEN": "k3",
      "HYDROCARBON.PHAN_UNG.NEU_HIEN_TUONG": "k3",
      "HYDROCARBON.PHAN_UNG.NHAN_DANG": "k3",
      "HYDROCARBON.PHAN_UNG.TINH_KHOI_LUONG": "k6",
      "HYDROCARBON.PHAN_UNG.VIET_CTCT": "k3",
      "HYDROCARBON.TINH_CHAT_VAT_LI.CHON_PHAT_BIEU": "k4",
      "HYDROCARBON.TINH_CHAT_VAT_LI.DEM_DONG_PHAN": "k4",
      "HYDROCARBON.TINH_CHAT_VAT_LI.NHAN_DANG": "k4",
      "HYDROCARBON.UNG_DUNG.CHON_PHAT_BIEU": "k5",
      "HYDROCARBON.UNG_DUNG.NHAN_DANG": "k5",
      "HYDROCARBON.UNG_DUNG.TINH_KHOI_LUONG": "k6",
      "HYDROCARBON.UNG_DUNG.TINH_THE_TICH": "k6",
      "HYDROCARBON.UNG_DUNG.VIET_PTHH": "k5",
      "HYDROCARBON.UNG_DUNG.XAC_DINH_CTPT": "k6"
    },
    "daDuyet": "máy dựng 29/09"
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
  "LIEN_KET": {
    "ma": "LIEN_KET",
    "chuong": "Liên kết hoá học",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Quy tắc octet",
        "rule": "<b>Nội dung:</b> nguyên tử <b>nhường, nhận hoặc góp chung</b> e để đạt cấu hình bền của <b>khí hiếm gần kề</b> (8 e lớp ngoài; H, Li… đạt 2 e như He).<br><b>Kim loại</b> (1–3 e ngoài) có xu hướng nhường e; <b>phi kim</b> (5–7 e) có xu hướng nhận hoặc góp chung.<br><b>Công thức Lewis:</b> vẽ đủ e hoá trị, mỗi nguyên tử (trừ H) đủ 8 e.<br><b>Ngoại lệ:</b> một số chất không theo octet (như {BF3}, {PCl5}, {SF6}, {NO2})."
      },
      "k2": {
        "ten": "Liên kết ion",
        "rule": "<b>Hình thành:</b> <b>lực hút tĩnh điện</b> giữa ion dương và ion âm; kim loại điển hình nhường e, phi kim điển hình nhận e ({Na} → {Na}<sup>+</sup> + e; {Cl} + e → {Cl}<sup>−</sup>).<br><b>Ion đơn nguyên tử, đa nguyên tử:</b> {Na}<sup>+</sup>, {Cl}<sup>−</sup>; {NH4}<sup>+</sup>, {SO4}<sup>2−</sup>, {NO3}<sup>−</sup>.<br><b>Hợp chất ion:</b> tinh thể, rắn ở điều kiện thường, nóng chảy và sôi cao, khi nóng chảy hoặc tan trong nước thì dẫn điện; ở thể rắn không dẫn điện.<br><b>Cấu hình ion:</b> ion bền thường có cấu hình khí hiếm gần kề."
      },
      "k3": {
        "ten": "Cộng hoá trị & độ âm điện",
        "rule": "<b>Hình thành:</b> dùng chung cặp e; đơn 1 cặp, đôi 2 cặp, ba 3 cặp ({H2} 1, {O2} 2, {N2} 3, {F2} 1).<br><b>Cho – nhận:</b> cặp e chung do <b>một</b> nguyên tử góp (vẽ mũi tên), như trong {NH4}<sup>+</sup>.<br><b>Theo hiệu độ âm điện Δχ:</b> 0 ≤ Δχ < 0,4 cộng hoá trị không phân cực; 0,4 ≤ Δχ < 1,7 cộng hoá trị phân cực; Δχ ≥ 1,7 thường là ion.<br><b>Không phân cực:</b> hai nguyên tử giống nhau ({Br2}, {Cl2}); phân cực: cặp e lệch về nguyên tử có χ lớn hơn.<br><b>Phân tử:</b> phân cực hay không còn tuỳ hình học ({CO2} thẳng nên không phân cực dù liên kết phân cực)."
      },
      "k4": {
        "ten": "Liên kết σ, π, xen phủ",
        "rule": "<b>σ:</b> xen phủ <b>trục</b> (s–s, s–p, p–p dọc trục nối hai hạt nhân), bền.<br><b>π:</b> xen phủ <b>bên</b> hai AO p song song, kém bền hơn σ.<br><b>Đếm:</b> liên kết đơn = 1σ; đôi = 1σ + 1π; ba = 1σ + 2π.<br><b>Ví dụ:</b> {H2} s–s; {HCl} s–p; {Cl2} p–p; {N2} có 1σ + 2π.<br><b>Vùng xen phủ</b> càng lớn thì liên kết càng bền."
      },
      "k5": {
        "ten": "Năng lượng liên kết",
        "rule": "<b>Định nghĩa:</b> E<sub>b</sub> là năng lượng cần để <b>phá</b> 1 mol liên kết ở thể khí (kJ/mol).<br><b>So sánh:</b> E<sub>b</sub> càng lớn → liên kết càng <b>bền</b>, độ dài liên kết thường càng ngắn; ba > đôi > đơn giữa cùng hai nguyên tử.<br><b>Tính biến thiên enthalpy</b> (các chất đều ở thể khí): <b>Δ<sub>r</sub>H = ΣE<sub>b</sub>(chất đầu) − ΣE<sub>b</sub>(sản phẩm)</b>.<br><b>Đếm đủ:</b> nhân E<sub>b</sub> với số liên kết trong phân tử và hệ số phương trình."
      },
      "k6": {
        "ten": "Liên kết hydrogen",
        "rule": "<b>Điều kiện:</b> nguyên tử H liên kết với <b>F, O hoặc N</b> (độ âm điện lớn) hút tĩnh điện với một nguyên tử F, O, N khác còn <b>cặp e tự do</b>; biểu diễn bằng dấu •••.<br><b>Có:</b> {H2O}, {NH3}, {HF}, alcohol, carboxylic acid; <b>không có</b> giữa các phân tử {CH4}, {H2S}, {HCl}.<br><b>Hệ quả:</b> nhiệt độ sôi, nóng chảy <b>cao bất thường</b> ({H2O} so với {H2S}); tan tốt trong nước; nước đá nhẹ hơn nước lỏng.<br><b>Vai trò sinh học:</b> giữ chuỗi xoắn kép DNA, cấu trúc protein.<br><b>Độ mạnh:</b> yếu hơn liên kết cộng hoá trị và ion, mạnh hơn van der Waals."
      },
      "k7": {
        "ten": "Tương tác van der Waals",
        "rule": "<b>Bản chất:</b> tương tác tĩnh điện <b>lưỡng cực – lưỡng cực</b> giữa các <b>nguyên tử hay phân tử</b> (lưỡng cực tạm thời hoặc cảm ứng).<br><b>Độ mạnh:</b> tăng khi <b>khối lượng phân tử</b> và <b>kích thước, diện tích tiếp xúc</b> tăng.<br><b>Hệ quả:</b> cùng loại phân tử không có liên kết hydrogen, M lớn hơn → sôi cao hơn ({F2} < {Cl2} < {Br2} < {I2}; khí hiếm He → Rn).<br><b>Phân biệt:</b> sôi, nóng chảy phụ thuộc lực <b>giữa</b> các phân tử, không phá liên kết trong phân tử."
      }
    },
    "TRAPS_THEM": {
      "trongngoai": {
        "ten": "Trong hay giữa phân tử",
        "hoi": "Nhiệt độ sôi do lực giữa các phân tử (hydrogen, van der Waals), không do liên kết cộng hoá trị trong phân tử. Đề đang nói lực nào?"
      },
      "dieukienhydro": {
        "ten": "Sai điều kiện liên kết H",
        "hoi": "H có gắn trực tiếp vào F, O hoặc N không? Phía nhận có cặp e tự do trên F, O, N không?"
      },
      "dempi": {
        "ten": "Đếm sai σ và π",
        "hoi": "Mỗi liên kết bội chỉ có đúng một σ; liên kết đôi 1π, ba 2π. Đã đếm từng liên kết chưa?"
      }
    },
    "DANG_KEY": {
      "LIEN_KET.LIEN_KET_CHT.DEM_NGUYEN_TU": "k3",
      "LIEN_KET.VAN_DER_WAALS.SO_SANH": "k7",
      "LIEN_KET.VAN_DER_WAALS.GIAI_THICH": "k7",
      "LIEN_KET.LIEN_KET_HYDROGEN.NHAN_DANG": "k6",
      "LIEN_KET.NANG_LUONG_LIEN_KET.CHON_PHAT_BIEU": "k5",
      "LIEN_KET.LIEN_KET_CHT.CHON_PHAT_BIEU": "k3",
      "LIEN_KET.LIEN_KET_HYDROGEN.CHON_PHAT_BIEU": "k6",
      "LIEN_KET.LIEN_KET_HYDROGEN.DEM_DONG_PHAN": "k6",
      "LIEN_KET.LIEN_KET_CHT.NHAN_DANG": "k3",
      "LIEN_KET.XEN_PHU_AO.NHAN_DANG": "k4",
      "LIEN_KET.XEN_PHU_AO.DEM_NGUYEN_TU": "k4",
      "LIEN_KET.LIEN_KET_CHT.DEM_DONG_PHAN": "k3",
      "LIEN_KET.NANG_LUONG_LIEN_KET.TINH_NANG_LUONG": "k5",
      "LIEN_KET.LIEN_KET_ION.CHON_PHAT_BIEU": "k2",
      "LIEN_KET.QUY_TAC_OCTET.NHAN_DANG": "k1"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "NANG_LUONG_HH": {
    "ma": "NANG_LUONG_HH",
    "chuong": "Năng lượng hoá học",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Toả nhiệt, thu nhiệt",
        "rule": "<b>Toả nhiệt:</b> Δ<sub>r</sub>H < 0; sản phẩm có năng lượng thấp hơn chất đầu; môi trường nóng lên.<br><b>Thu nhiệt:</b> Δ<sub>r</sub>H > 0; phải cấp nhiệt liên tục, <b>ngừng đun thì phản ứng dừng</b>.<br><b>Hay gặp:</b> đốt cháy, trung hoà, oxi hoá glucose toả nhiệt; nhiệt phân {CaCO3}, {NaHCO3}, quang hợp thu nhiệt.<br><b>Sơ đồ năng lượng:</b> mũi tên từ chất đầu đi xuống sản phẩm là toả nhiệt, đi lên là thu nhiệt.<br><b>Đun khơi mào:</b> nhiều phản ứng toả nhiệt vẫn cần đun lúc đầu."
      },
      "k2": {
        "ten": "Enthalpy tạo thành chuẩn",
        "rule": "<b>Định nghĩa:</b> Δ<sub>f</sub>H°<sub>298</sub> là nhiệt kèm theo khi tạo <b>1 mol chất</b> từ các đơn chất bền nhất, ở điều kiện chuẩn (1 bar, 298 K; dung dịch 1 mol/L).<br><b>Bằng 0:</b> đơn chất ở dạng bền nhất: C(graphite), {O2}(g), {Br2}(l), Hg(l), Na(s).<br><b>Khác 0:</b> {O3}, C(kim cương), {Br2}(g), mọi hợp chất.<br><b>Độ bền:</b> Δ<sub>f</sub>H°<sub>298</sub> càng âm, chất càng bền.<br><b>Phương trình nhiệt hoá học:</b> ghi đủ thể (s, l, g, aq); nhân hệ số thì Δ<sub>r</sub>H nhân theo; đảo chiều thì đổi dấu."
      },
      "k3": {
        "ten": "Tính ΔrH từ ΔfH",
        "rule": "<b>Công thức:</b> Δ<sub>r</sub>H°<sub>298</sub> = ΣΔ<sub>f</sub>H°<sub>298</sub>(sản phẩm) − ΣΔ<sub>f</sub>H°<sub>298</sub>(chất đầu).<br><b>Hệ số:</b> nhân mỗi Δ<sub>f</sub>H với hệ số của chất trong phương trình đã cân bằng.<br><b>Đơn chất bền:</b> lấy bằng 0 ({O2}, {N2}, C(graphite)).<br><b>Thể của nước:</b> {H2O}(l) và {H2O}(g) có Δ<sub>f</sub>H khác nhau, lấy đúng thể đề cho.<br><b>Ví dụ:</b> {CH4} + 2{O2} → {CO2} + 2{H2O}(g): (−393,5 + 2·(−241,8)) − (−74,9) = −802,2 kJ."
      },
      "k4": {
        "ten": "Năng lượng liên kết",
        "rule": "<b>Công thức:</b> Δ<sub>r</sub>H°<sub>298</sub> = ΣE<sub>b</sub>(chất đầu) − ΣE<sub>b</sub>(sản phẩm) (ngược chiều với cách tính theo Δ<sub>f</sub>H).<br><b>Điều kiện:</b> chỉ áp dụng khi mọi chất ở <b>thể khí</b>.<br><b>Đếm liên kết:</b> số liên kết mỗi phân tử × hệ số: {CH4} 4 C–H; {O2} 1 O=O; {CO2} 2 C=O; {H2O} 2 O–H; {N2} 1 N≡N.<br><b>Ý nghĩa:</b> phá liên kết cần năng lượng, tạo liên kết giải phóng năng lượng."
      },
      "k5": {
        "ten": "Cộng phương trình nhiệt",
        "rule": "<b>Nguyên tắc:</b> phương trình đích bằng tổng, hiệu các phương trình đã cho ⇒ Δ<sub>r</sub>H cộng, trừ đúng như vậy.<br><b>Đảo chiều:</b> đổi dấu Δ<sub>r</sub>H; <b>nhân hệ số:</b> nhân Δ<sub>r</sub>H.<br><b>Ví dụ:</b> C(kim cương) + {O2} → {CO2} = (1) − (2): −393,5 − 2,87 ≈ −396 kJ.<br><b>So sánh:</b> cùng sản phẩm, chất đầu kém bền (năng lượng cao) thì toả nhiều nhiệt hơn."
      },
      "k6": {
        "ten": "Nhiệt lượng theo lượng chất",
        "rule": "<b>Nhiệt lượng:</b> Q = n × |Δ<sub>r</sub>H| với Δ<sub>r</sub>H ứng với số mol trong phương trình (chia hệ số nếu cần).<br><b>Đun nước:</b> Q = m·c·Δt, c theo đề (thường 4,18 hoặc 4,2 J/g·K); nước 1 g/mL.<br><b>Hao hụt:</b> Q phải đốt = Q có ích : (1 − % hao); nhiệt thực = lí thuyết × H.<br><b>Hỗn hợp:</b> Q của 1 mol hỗn hợp = Σ(phần mol × Q mỗi chất).<br><b>Đổi đơn vị:</b> 1 cal = 4,184 J; 1 kJ = 1000 J; khí đkc 24,79 L/mol; dung dịch: m = V·D rồi × C%."
      }
    },
    "TRAPS_THEM": {
      "dauenthalpy": {
        "ten": "Nhầm dấu ΔrH",
        "hoi": "Đề hỏi Δ<sub>r</sub>H (âm khi toả nhiệt) hay nhiệt lượng toả ra, năng lượng nhận được (số dương)?"
      },
      "trangthai": {
        "ten": "Sai thể của chất",
        "hoi": "Nước ở thể lỏng hay khí? Đơn chất có đúng dạng bền nhất không (graphite hay kim cương, {Br2} lỏng hay khí)?"
      },
      "daochieueb": {
        "ten": "Đảo công thức Eb",
        "hoi": "Tính theo năng lượng liên kết là chất đầu trừ sản phẩm; theo enthalpy tạo thành là sản phẩm trừ chất đầu. Đã dùng đúng chiều chưa?"
      },
      "quyvemol": {
        "ten": "Quên quy về mol",
        "hoi": "Δ<sub>r</sub>H ghi cho bao nhiêu mol theo phương trình? Lượng chất đề cho đã đổi ra mol, đã nhân C% và khối lượng riêng chưa?"
      }
    },
    "DANG_KEY": {
      "NANG_LUONG_HH.TOA_THU_NHIET.CHON_PHAT_BIEU": "k1",
      "NANG_LUONG_HH.TOA_THU_NHIET.NHAN_DANG": "k1",
      "NANG_LUONG_HH.TOA_THU_NHIET.DEM_DONG_PHAN": "k1",
      "NANG_LUONG_HH.TOA_THU_NHIET.TINH_NANG_LUONG": "k6",
      "NANG_LUONG_HH.TOA_THU_NHIET.TINH_KHOI_LUONG": "k6",
      "NANG_LUONG_HH.TOA_THU_NHIET.TINH_SO_MOL": "k6",
      "NANG_LUONG_HH.TOA_THU_NHIET.TINH_HIEU_SUAT": "k6",
      "NANG_LUONG_HH.TOA_THU_NHIET.TINH_THE_TICH": "k6",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.TINH_NANG_LUONG": "k3",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.TINH_TI_SO": "k3",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.TINH_KHOI_LUONG": "k3",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.NHAN_DANG": "k2",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.SO_SANH": "k2",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.CHON_PHAT_BIEU": "k2",
      "NANG_LUONG_HH.ENTHALPY_TAO_THANH.DEM_DONG_PHAN": "k2",
      "NANG_LUONG_HH.NANG_LUONG_LIEN_KET.TINH_NANG_LUONG": "k4",
      "NANG_LUONG_HH.NANG_LUONG_LIEN_KET.DEM_NGUYEN_TU": "k4",
      "NANG_LUONG_HH.HESS.CHON_PHAT_BIEU": "k5",
      "NANG_LUONG_HH.HESS.SO_SANH": "k5",
      "NANG_LUONG_HH.HESS.TINH_NANG_LUONG": "k5"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "NGUYEN_TU": {
    "ma": "NGUYEN_TU",
    "chuong": "Cấu tạo nguyên tử",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Hạt & kí hiệu nguyên tử",
        "rule": "<b>Ba hạt:</b> proton (+1, ≈ 1 amu), neutron (0, ≈ 1 amu), electron (−1, ≈ 0,00055 amu); 1 amu = 1,6605×10<sup>−27</sup> kg.<br><b>Điện tích:</b> 1 đơn vị = 1,602×10<sup>−19</sup> C; nguyên tử trung hoà nên <b>số p = số e = Z</b>.<br><b>Số khối:</b> <b>A = Z + N</b>; kí hiệu <sup>A</sup><sub>Z</sub>X (A trên, Z dưới).<br><b>Nguyên tố hoá học:</b> tập hợp nguyên tử <b>cùng Z</b>; Z quyết định nguyên tố, không phải A.<br><b>Khối lượng nguyên tử:</b> tập trung ở hạt nhân, khối lượng electron không đáng kể."
      },
      "k2": {
        "ten": "Bài toán tổng số hạt",
        "rule": "<b>Đặt ẩn:</b> tổng hạt <b>S = 2Z + N</b>; hạt mang điện = <b>2Z</b> (p và e), không mang điện = N.<br><b>Ion:</b> {X}<sup>n+</sup> có e = Z − n; {X}<sup>n−</sup> có e = Z + n; <b>p và N không đổi</b>.<br><b>Một dữ kiện:</b> đồng vị bền (Z ≤ 82) có 1 ≤ N : Z ≤ 1,5 ⇒ <b>S : 3,5 ≤ Z ≤ S : 3</b>, thử từng Z nguyên.<br><b>Hợp chất {MX2}:</b> cộng hạt từng nguyên tử theo chỉ số, lập hệ theo Z<sub>M</sub>, Z<sub>X</sub>.<br><b>Kiểm lại:</b> Z → tên nguyên tố → A = Z + N."
      },
      "k3": {
        "ten": "Mô hình & kích thước",
        "rule": "<b>Thomson:</b> tia âm cực → phát hiện <b>electron</b>. <b>Rutherford:</b> bắn hạt α vào lá vàng: đa số đi thẳng → nguyên tử <b>rỗng</b>; một ít lệch, bật lại → có <b>hạt nhân nhỏ, mang điện dương</b>. <b>Chadwick:</b> neutron.<br><b>Rutherford – Bohr:</b> electron quay trên <b>quỹ đạo xác định</b>, mỗi quỹ đạo một mức năng lượng không đổi; gần hạt nhân năng lượng thấp.<br><b>Hiện đại:</b> electron chuyển động rất nhanh, không theo quỹ đạo; chỉ nói <b>xác suất tìm thấy</b> (orbital).<br><b>Kích thước:</b> nguyên tử ~10<sup>−10</sup> m, hạt nhân ~10<sup>−14</sup> m (nhỏ hơn ~10<sup>4</sup> lần, thể tích ~10<sup>12</sup> lần); 1 Å = 10<sup>−10</sup> m, 1 pm = 10<sup>−12</sup> m.<br><b>Tính:</b> V = 4/3·π·r<sup>3</sup>; khối lượng riêng = m : V (đổi đơn vị trước)."
      },
      "k4": {
        "ten": "Lớp, phân lớp, orbital",
        "rule": "<b>Lớp n = 1, 2, 3, 4</b> (K, L, M, N): có <b>n phân lớp</b>, <b>n<sup>2</sup> AO</b>, tối đa <b>2n<sup>2</sup> e</b>.<br><b>Phân lớp:</b> s (1 AO, 2 e), p (3 AO, 6 e), d (5 AO, 10 e), f (7 AO, 14 e); lớp 1 chỉ có 1s, lớp 2 có 2s 2p (không có 1p, 2d).<br><b>Hình dạng:</b> AO s <b>hình cầu</b>, AO p <b>số tám nổi</b> theo trục x, y, z.<br><b>Năng lượng:</b> lớp gần hạt nhân năng lượng thấp, liên kết chặt nhất; e <b>cùng phân lớp</b> năng lượng bằng nhau (cùng lớp thì chưa chắc).<br><b>Orbital:</b> vùng xác suất tìm thấy e lớn nhất (~90%), không phải 100%."
      },
      "k5": {
        "ten": "Viết cấu hình electron",
        "rule": "<b>Thứ tự điền:</b> 1s 2s 2p 3s 3p <b>4s 3d</b> 4p 5s 4d 5p 6s 4f 5d…; viết lại theo lớp (3d trước 4s).<br><b>Pauli:</b> mỗi AO tối đa 2 e ngược chiều. <b>Hund:</b> điền mỗi AO một e trước (cùng chiều) rồi mới ghép đôi → đếm <b>e độc thân</b>.<br><b>Ngoại lệ:</b> Cr [Ar]3d<sup>5</sup>4s<sup>1</sup>, Cu [Ar]3d<sup>10</sup>4s<sup>1</sup>.<br><b>Ion:</b> bỏ e từ <b>lớp ngoài cùng</b> trước ({Fe}<sup>2+</sup> [Ar]3d<sup>6</sup>, bỏ 4s trước 3d); anion thêm e vào phân lớp đang điền.<br><b>Đếm:</b> Z = tổng số mũ; e lớp ngoài = e của n lớn nhất; e phân lớp p/s cộng theo loại."
      },
      "k6": {
        "ten": "Cấu hình → tính chất",
        "rule": "<b>E lớp ngoài cùng:</b> 1, 2, 3 → <b>kim loại</b> (trừ H, He, B); 5, 6, 7 → <b>phi kim</b>; 8 (He: 2) → <b>khí hiếm</b>; 4 → kim loại hoặc phi kim.<br><b>Loại nguyên tố:</b> e cuối điền vào s, p, d, f → nguyên tố s, p, d, f.<br><b>E hoá trị:</b> nhóm A là e lớp ngoài; nguyên tố d gồm (n−1)d + ns (V: 3d<sup>3</sup>4s<sup>2</sup> → 5).<br><b>Vị trí:</b> ô = Z; chu kì = số lớp e; nhóm A = số e lớp ngoài cùng.<br><b>Cùng cấu hình khí hiếm:</b> nguyên tử là khí hiếm, cation từ kim loại, anion từ phi kim."
      },
      "k7": {
        "ten": "Đồng vị & nguyên tử khối TB",
        "rule": "<b>Đồng vị:</b> cùng Z (cùng p, e), <b>khác N</b> nên khác A; tính chất hoá học như nhau.<br><b>NTK trung bình:</b> <b>Ā = Σ(A<sub>i</sub>·x<sub>i</sub>) : 100</b>; hai đồng vị đặt x và 100 − x.<br><b>% khối lượng đồng vị trong hợp chất:</b> = (x<sub>i</sub>/100)·A<sub>i</sub>·(số nguyên tử) : M(hợp chất), M dùng Ā.<br><b>Đếm loại phân tử:</b> {X2} từ n đồng vị có n(n + 1)/2 loại; {XY2}: (số đồng vị X) × (số cặp Y có lặp).<br><b>Phổ khối:</b> mỗi vạch một đồng vị, chiều cao ∝ % số nguyên tử."
      }
    },
    "TRAPS_THEM": {
      "ionelectron": {
        "ten": "Quên electron của ion",
        "hoi": "Đây là nguyên tử hay ion? Ion dương đã mất e, ion âm đã nhận e; số proton và neutron không đổi."
      },
      "hatmangdien": {
        "ten": "Nhầm hạt mang điện",
        "hoi": "Hạt mang điện gồm proton và electron (2Z); neutron không mang điện. Đề hỏi hạt mang điện hay hạt trong hạt nhân?"
      },
      "thutudien": {
        "ten": "Thứ tự điền và viết",
        "hoi": "4s điền trước 3d nhưng viết cấu hình theo lớp; ion kim loại chuyển tiếp mất e 4s trước. Có dính Cr, Cu không?"
      }
    },
    "DANG_KEY": {
      "NGUYEN_TU.CAU_HINH_E.NHAN_DANG": "k4",
      "NGUYEN_TU.MO_HINH.NHAN_DANG": "k3",
      "NGUYEN_TU.THANH_PHAN.NHAN_DANG": "k1",
      "NGUYEN_TU.CAU_HINH_E.DEM_NGUYEN_TU": "k5",
      "NGUYEN_TU.MO_HINH.DEM_NGUYEN_TU": "k3",
      "NGUYEN_TU.THANH_PHAN.GOI_TEN": "k1",
      "NGUYEN_TU.CAU_HINH_E.DEM_DONG_PHAN": "k5",
      "NGUYEN_TU.CAU_HINH_E.SO_SANH": "k5",
      "NGUYEN_TU.CAU_HINH_E.CHON_PHAT_BIEU": "k4",
      "NGUYEN_TU.THANH_PHAN.DEM_NGUYEN_TU": "k2",
      "NGUYEN_TU.MO_HINH.CHON_PHAT_BIEU": "k3",
      "NGUYEN_TU.CAU_HINH_E.XAC_DINH_CHAT": "k6",
      "NGUYEN_TU.CAU_HINH_E.XAC_DINH_DIEN_TICH": "k5",
      "NGUYEN_TU.VI_TRI_BTH.DEM_NGUYEN_TU": "k6",
      "NGUYEN_TU.VI_TRI_BTH.NHAN_DANG": "k6",
      "NGUYEN_TU.THANH_PHAN.CHON_PHAT_BIEU": "k1",
      "NGUYEN_TU.CAU_HINH_E.TINH_PHAN_TRAM": "k5",
      "NGUYEN_TU.THANH_PHAN.DEM_DONG_PHAN": "k1",
      "NGUYEN_TU.THANH_PHAN.TINH_KHOI_LUONG": "k1",
      "NGUYEN_TU.MO_HINH.TINH_PHAN_TRAM": "k3",
      "NGUYEN_TU.THANH_PHAN.VIET_CTCT": "k1",
      "NGUYEN_TU.DONG_VI.GIAI_THICH": "k7",
      "NGUYEN_TU.DONG_VI.NHAN_DANG": "k7",
      "NGUYEN_TU.THANH_PHAN.XAC_DINH_CTPT": "k2",
      "NGUYEN_TU.DONG_VI.XAC_DINH_CTPT": "k7",
      "NGUYEN_TU.DONG_VI.DEM_NGUYEN_TU": "k7",
      "NGUYEN_TU.THANH_PHAN.XAC_DINH_CHAT": "k2",
      "NGUYEN_TU.THANH_PHAN.XAC_DINH_DIEN_TICH": "k2",
      "NGUYEN_TU.MO_HINH.TINH_KHOI_LUONG": "k3",
      "NGUYEN_TU.MO_HINH.TINH_THE_TICH": "k3",
      "NGUYEN_TU.MO_HINH.TINH_TI_SO": "k3",
      "NGUYEN_TU.CAU_HINH_E.GOI_TEN": "k6",
      "NGUYEN_TU.DONG_VI.CHON_PHAT_BIEU": "k7",
      "NGUYEN_TU.DONG_VI.DEM_DONG_PHAN": "k7",
      "NGUYEN_TU.DONG_VI.TINH_PHAN_TRAM": "k7",
      "NGUYEN_TU.THANH_PHAN.TINH_TI_SO": "k1",
      "NGUYEN_TU.VI_TRI_BTH.DEM_DONG_PHAN": "k6",
      "NGUYEN_TU.DONG_VI.TINH_THE_TICH": "k7",
      "NGUYEN_TU.MO_HINH.NEU_HIEN_TUONG": "k3",
      "NGUYEN_TU.THANH_PHAN.TINH_PHAN_TRAM": "k1",
      "NGUYEN_TU.MO_HINH.DEM_DONG_PHAN": "k3"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "NITROGEN_SULFUR": {
    "ma": "NITROGEN_SULFUR",
    "chuong": "Nitrogen – sulfur",
    "lop": "11",
    "KEYS": {
      "k1": {
        "ten": "Đơn chất nitrogen",
        "rule": "<b>Cấu tạo:</b> N≡N gồm 1 liên kết σ và <b>2 liên kết π</b>; năng lượng liên kết rất lớn (945 kJ/mol) → khá trơ ở nhiệt độ thường.<br><b>Trạng thái:</b> khí không màu, không mùi, ít tan trong nước; chiếm khoảng <b>78%</b> thể tích không khí.<br><b>Số oxi hoá của N:</b> từ −3 ({NH3}) đến +5 ({HNO3}); {N2} là 0 nên vừa oxi hoá vừa khử.<br><b>Tính oxi hoá:</b> {N2} + 3{H2} ⇌ 2{NH3} (t°, p, xúc tác); với kim loại hoạt động → nitride.<br><b>Tính khử:</b> {N2} + {O2} ⇌ 2{NO} ở khoảng 3000 °C hoặc tia lửa điện (sét), phản ứng thu nhiệt.<br><b>Ứng dụng:</b> khí bảo quản thực phẩm, nitrogen lỏng (−196 °C) làm lạnh, nguyên liệu sản xuất {NH3}."
      },
      "k2": {
        "ten": "Ammonia & muối ammonium",
        "rule": "<b>Ammonia:</b> chóp tam giác, N còn một cặp electron; khí mùi khai, nhẹ hơn không khí, <b>tan rất nhiều</b> trong nước.<br><b>Tính base yếu:</b> quỳ ẩm hoá xanh; + {HCl} → khói trắng {NH4Cl}; tạo kết tủa hydroxide với {Al}<sup>3+</sup>, {Fe}<sup>3+</sup>.<br><b>Tính khử (N −3):</b> cháy trong {O2} → {N2}; xúc tác Pt → {NO}; + {CuO} nung → Cu đỏ + {N2}.<br><b>Haber:</b> {N2} + 3{H2} ⇌ 2{NH3}, Δ<sub>r</sub>H<sup>o</sup><sub>298</sub> = −91,8 kJ; 400–450 °C, 150–200 bar, xúc tác Fe; tăng p, hạ T → dịch phải.<br><b>Muối ammonium:</b> dễ tan; + kiềm, đun → {NH3} (nhận biết {NH4}<sup>+</sup>); {NH4}<sup>+</sup> là acid Brønsted.<br><b>Nhiệt phân:</b> {NH4Cl} → {NH3} + {HCl}; {NH4HCO3} → {NH3} + {CO2} + {H2O}; {NH4NO3} → {N2O} + 2{H2O}."
      },
      "k3": {
        "ten": "Oxide nitrogen & môi trường",
        "rule": "<b>{NO}:</b> khí không màu, gặp không khí hoá <b>nâu đỏ</b> ngay (2{NO} + {O2} → 2{NO2}).<br><b>{NO2}:</b> khí nâu đỏ, độc; 2{NO2} ⇌ {N2O4} (không màu); 4{NO2} + {O2} + 2{H2O} → 4{HNO3}.<br><b>Nguồn NO<sub>x</sub>:</b> sét, khí thải động cơ đốt trong, nhà máy nhiệt điện.<br><b>Mưa acid:</b> pH < 5,6 do {SO2}, NO<sub>x</sub> → {H2SO4}, {HNO3}; ăn mòn công trình đá vôi, kim loại, làm chua đất.<br><b>Phú dưỡng:</b> nước dư ion {NO3}<sup>−</sup>, {NH4}<sup>+</sup>, {PO4}<sup>3−</sup> (phân bón, nước thải) → tảo nở hoa, thiếu {O2}, sinh vật chết.<br><b>Giảm thiểu:</b> xử lí khí thải, dùng phân bón hợp lí, xử lí nước thải."
      },
      "k4": {
        "ten": "Nitric acid",
        "rule": "<b>Cấu tạo:</b> N có số oxi hoá +5; chất lỏng không màu, kém bền, ánh sáng phân huỷ → {NO2} làm dung dịch <b>ngả vàng</b> (đựng chai sẫm màu).<br><b>Tính acid mạnh:</b> phân li hoàn toàn; tác dụng base, oxide base, muối acid yếu.<br><b>Tính oxi hoá mạnh:</b> hầu hết kim loại (trừ Au, Pt) → muối nitrate hoá trị cao + {NO2} (đặc) / {NO} (loãng) / {N2O}, {N2}, {NH4NO3}; <b>không sinh {H2}</b>.<br><b>Thụ động:</b> Al, Fe, Cr không tan trong {HNO3} đặc, nguội; C, S, P → {CO2}, {H2SO4}, {H3PO4}.<br><b>Bảo toàn electron:</b> n<sub>e</sub> = n({NO2}) = 3n({NO}) = 8n({N2O}) = 10n({N2}) = 8n({NH4NO3}); n({HNO3}) = n N trong muối + n N trong sản phẩm khử.<br><b>Ostwald:</b> {NH3} → {NO} → {NO2} → {HNO3}; bảo toàn N: 1 {NH3} → 1 {HNO3}."
      },
      "k5": {
        "ten": "Sulfur & sulfur dioxide",
        "rule": "<b>Số oxi hoá của S:</b> −2, 0, +4, +6; S (0) và {SO2} (+4) vừa oxi hoá vừa khử.<br><b>Đơn chất S:</b> rắn màu vàng, không tan trong nước; + Hg ở nhiệt độ thường → HgS (thu gom thuỷ ngân rơi vãi); + Fe, {H2} (t°) → S là chất oxi hoá; cháy trong {O2} → {SO2}, S là chất khử.<br><b>{SO2} vật lí:</b> khí không màu, mùi hắc, độc, nặng hơn không khí.<br><b>{SO2} là oxide acid:</b> + {H2O} ⇌ {H2SO3}; + kiềm → muối sulfite.<br><b>{SO2} khử:</b> làm mất màu nước bromine, dung dịch {KMnO4}; + {O2} (xúc tác {V2O5}) → {SO3}. <b>{SO2} oxi hoá:</b> + {H2S} → S vàng.<br><b>Ứng dụng, nguồn:</b> tẩy trắng, chống nấm mốc; sinh ra khi đốt nhiên liệu hoá thạch, núi lửa → mưa acid."
      },
      "k6": {
        "ten": "Sulfuric acid & sulfate",
        "rule": "<b>{H2SO4} đặc:</b> lỏng sánh, không bay hơi, tan vô hạn và <b>toả rất nhiều nhiệt</b>; pha loãng: rót từ từ acid vào nước, không làm ngược lại.<br><b>Loãng – tính acid mạnh:</b> kim loại đứng trước H → muối + {H2} (Fe → {Fe}<sup>2+</sup>); tác dụng oxide base, base, muối.<br><b>Đặc – háo nước:</b> than hoá đường, giấy, vải (hoá đen). <b>Đặc, nóng – oxi hoá mạnh:</b> kim loại trừ Au, Pt → muối hoá trị cao + {SO2}; C, S, {HBr}, {KI} bị oxi hoá.<br><b>Thụ động:</b> Al, Fe, Cr không tan trong {H2SO4} đặc, nguội; bảo toàn electron: n<sub>e</sub> = 2n({SO2}).<br><b>Sulfate:</b> {BaSO4} trắng, không tan trong acid → nhận biết {SO4}<sup>2−</sup> bằng {Ba}<sup>2+</sup>; {BaSO4} cản quang, thạch cao {CaSO4}, phân đạm {(NH4)2SO4}.<br><b>Sơ cứu bỏng:</b> rửa ngay bằng nhiều nước lạnh, sau đó dùng dung dịch {NaHCO3} loãng."
      },
      "k7": {
        "ten": "Sản xuất H2SO4 & tính",
        "rule": "<b>Phương pháp tiếp xúc, 3 giai đoạn:</b> tạo {SO2} → oxi hoá {SO2} thành {SO3} → hấp thụ {SO3}.<br><b>Giai đoạn 1:</b> đốt S hoặc quặng pyrite: 4{FeS2} + 11{O2} → 2{Fe2O3} + 8{SO2}.<br><b>Giai đoạn 2:</b> 2{SO2} + {O2} ⇌ 2{SO3}, xúc tác {V2O5}, khoảng 450 °C, phản ứng toả nhiệt.<br><b>Giai đoạn 3:</b> hấp thụ {SO3} bằng {H2SO4} 98% → oleum {H2SO4}·n{SO3}, rồi pha loãng; không hấp thụ bằng nước (tạo sương mù acid).<br><b>Bảo toàn S:</b> 1 {FeS2} → 2 {H2SO4}; 1 S → 1 {H2SO4}; hiệu suất các giai đoạn <b>nhân dồn</b>.<br><b>Năng lượng:</b> Δ<sub>r</sub>H<sup>o</sup><sub>298</sub> = Σ Δ<sub>f</sub>H sản phẩm − Σ Δ<sub>f</sub>H chất đầu (nhân hệ số); m dung dịch = m chất tan : C%."
      }
    },
    "TRAPS_THEM": {
      "thudong": {
        "ten": "Quên thụ động đặc nguội",
        "hoi": "Kim loại là Al, Fe hay Cr và acid là HNO3 hoặc H2SO4 đặc, nguội? Khi đó không có phản ứng."
      },
      "dacloang": {
        "ten": "Nhầm acid đặc với loãng",
        "hoi": "H2SO4 loãng cho H2 và Fe²⁺; đặc nóng cho SO2 và Fe³⁺. HNO3 không bao giờ cho H2. Đề cho acid đặc hay loãng?"
      },
      "sanphamkhu": {
        "ten": "Sót sản phẩm khử NH4NO3",
        "hoi": "Kim loại mạnh (Mg, Al, Zn) với HNO3 loãng mà không thấy khí, hoặc số mol electron không khớp khí: đã tính NH4NO3 trong muối chưa?"
      }
    },
    "DANG_KEY": {
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.CHON_PHAT_BIEU": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.DEM_DONG_PHAN": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.DEM_NGUYEN_TU": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.GIAI_THICH": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.NEU_HIEN_TUONG": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.NHAN_DANG": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.TINH_HANG_SO": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.TINH_HIEU_SUAT": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.TINH_KHOI_LUONG": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.TINH_NANG_LUONG": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.TINH_NONG_DO": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.TINH_THE_TICH": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.VIET_CTCT": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.VIET_PTHH": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.XAC_DINH_CHAT": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.XAC_DINH_CHIEU": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.XAC_DINH_CTPT": "k2",
      "NITROGEN_SULFUR.AMMONIA_AMMONIUM.XAC_DINH_SO_OXI_HOA": "k2",
      "NITROGEN_SULFUR.DON_CHAT_N2.CHON_PHAT_BIEU": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.DEM_DONG_PHAN": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.DEM_LIEN_KET_PI": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.DEM_NGUYEN_TU": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.GIAI_THICH": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.GOI_TEN": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.NEU_HIEN_TUONG": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.NHAN_DANG": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.SO_SANH": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.TINH_PHAN_TRAM": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.TINH_TI_SO": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.XAC_DINH_CTPT": "k1",
      "NITROGEN_SULFUR.DON_CHAT_N2.XAC_DINH_SO_OXI_HOA": "k1",
      "NITROGEN_SULFUR.DON_CHAT_S.CHON_PHAT_BIEU": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.DEM_DONG_PHAN": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.DEM_NGUYEN_TU": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.GOI_TEN": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.NEU_HIEN_TUONG": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.NHAN_DANG": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.SO_SANH": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.TINH_HIEU_SUAT": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.TINH_KHOI_LUONG": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.TINH_NANG_LUONG": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.TINH_PHAN_TRAM": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.TINH_SO_MOL": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.TINH_THE_TICH": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.VIET_PTHH": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.XAC_DINH_CHAT": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.XAC_DINH_CTPT": "k5",
      "NITROGEN_SULFUR.DON_CHAT_S.XAC_DINH_SO_OXI_HOA": "k5",
      "NITROGEN_SULFUR.NITRIC_ACID.CHON_PHAT_BIEU": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.DEM_DONG_PHAN": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.DEM_NGUYEN_TU": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.GIAI_THICH": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.GOI_TEN": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.NEU_HIEN_TUONG": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.NHAN_DANG": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_HIEU_SUAT": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_KHOI_LUONG": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_NANG_LUONG": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_PHAN_TRAM": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_SO_MOL": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_THE_TICH": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.TINH_TI_SO": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.VIET_CTCT": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.VIET_PTHH": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.XAC_DINH_CHAT": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.XAC_DINH_CTPT": "k4",
      "NITROGEN_SULFUR.NITRIC_ACID.XAC_DINH_SO_OXI_HOA": "k4",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.CHON_PHAT_BIEU": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.DEM_DONG_PHAN": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.DEM_NGUYEN_TU": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.GIAI_THICH": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.GOI_TEN": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.NEU_HIEN_TUONG": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.NHAN_DANG": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.TINH_NANG_LUONG": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.TINH_THE_TICH": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.VIET_PTHH": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.XAC_DINH_CTPT": "k3",
      "NITROGEN_SULFUR.OXIDE_NITROGEN.XAC_DINH_SO_OXI_HOA": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.CHON_PHAT_BIEU": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.DEM_DONG_PHAN": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.GOI_TEN": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.NEU_HIEN_TUONG": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.NHAN_DANG": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.TINH_KHOI_LUONG": "k3",
      "NITROGEN_SULFUR.O_NHIEM_PHU_DUONG.VIET_PTHH": "k3",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.CHON_PHAT_BIEU": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.DEM_DONG_PHAN": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.GIAI_THICH": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.NHAN_DANG": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.SO_SANH": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_HANG_SO": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_HIEU_SUAT": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_KHOI_LUONG": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_NANG_LUONG": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_PHAN_TRAM": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_SO_MOL": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.TINH_THE_TICH": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.VIET_CTCT": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.VIET_PTHH": "k7",
      "NITROGEN_SULFUR.SAN_XUAT_H2SO4.XAC_DINH_SO_OXI_HOA": "k7",
      "NITROGEN_SULFUR.SULFURIC_ACID.CHON_PHAT_BIEU": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.DEM_DONG_PHAN": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.DEM_NGUYEN_TU": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.GIAI_THICH": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.NEU_HIEN_TUONG": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.NHAN_DANG": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.SO_SANH": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.TINH_KHOI_LUONG": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.TINH_NONG_DO": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.TINH_PHAN_TRAM": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.TINH_THE_TICH": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.VIET_CTCT": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.VIET_PTHH": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.XAC_DINH_CHAT": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.XAC_DINH_CTPT": "k6",
      "NITROGEN_SULFUR.SULFURIC_ACID.XAC_DINH_SO_OXI_HOA": "k6"
    },
    "daDuyet": "máy dựng 29/09"
  },
  "OXI_HOA_KHU": {
    "ma": "OXI_HOA_KHU",
    "chuong": "Phản ứng oxi hoá – khử",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Tính số oxi hoá",
        "rule": "<b>Đơn chất:</b> số oxi hoá bằng 0.<br><b>Hay gặp:</b> H là +1 (hydride kim loại như {NaH} là −1); O là −2 (peroxide {H2O2} là −1, {OF2} là +2); kim loại nhóm IA +1, IIA +2, Al +3.<br><b>Tổng:</b> phân tử bằng 0, ion bằng điện tích ion.<br><b>Ví dụ:</b> {K2Cr2O7}: 2(+1) + 2x + 7(−2) = 0 → Cr +6; {Cu3P}: Cu +1 → P −3.<br><b>Số lẻ:</b> {Fe3O4} cho Fe trung bình +8/3 (một Fe<sup>+2</sup>, hai Fe<sup>+3</sup>)."
      },
      "k2": {
        "ten": "Chất khử, chất oxi hoá",
        "rule": "<b>Chất khử:</b> nhường electron, số oxi hoá <b>tăng</b>, bị oxi hoá (xảy ra quá trình oxi hoá).<br><b>Chất oxi hoá:</b> nhận electron, số oxi hoá <b>giảm</b>, bị khử.<br><b>Cách làm:</b> ghi số oxi hoá nguyên tố đó ở hai vế rồi so.<br><b>Ví dụ:</b> {N2} + {O2} → 2NO: N từ 0 lên +2 → {N2} là chất khử; Ca + {N2} → {Ca3N2}: N xuống −3 → {N2} là chất oxi hoá.<br><b>Đoán tính chất:</b> số oxi hoá cao nhất chỉ có tính oxi hoá, thấp nhất chỉ có tính khử, trung gian có cả hai."
      },
      "k3": {
        "ten": "Nhận phản ứng oxi hoá – khử",
        "rule": "<b>Dấu hiệu:</b> có <b>ít nhất một nguyên tố đổi số oxi hoá</b>; chất khử và chất oxi hoá xảy ra đồng thời.<br><b>Thường là oxi hoá – khử:</b> có đơn chất tham gia hoặc tạo thành (đốt cháy, kim loại + acid, gỉ sắt).<br><b>Thường không phải:</b> phản ứng trao đổi ion, trung hoà, nhiệt phân muối carbonate, hydrogencarbonate ({Fe(HCO3)2} → {Fe(OH)2} + {CO2}).<br><b>Đếm:</b> xét lần lượt từng phản ứng, ghi số oxi hoá của nguyên tố nghi ngờ ở hai vế."
      },
      "k4": {
        "ten": "Cân bằng thăng bằng electron",
        "rule": "<b>Bốn bước:</b> ghi số oxi hoá → viết quá trình oxi hoá, quá trình khử → nhân hệ số để <b>tổng e nhường = tổng e nhận</b> → điền hệ số, kiểm H, O.<br><b>Một chất nhiều nguyên tố đổi:</b> cộng e cả phân tử: {Cu3P} nhường 3·1 + 8 = 11 e.<br><b>Tự oxi hoá – khử:</b> 3{Cl2} + 6KOH → 5KCl + {KClO3} + 3{H2O}: 5 nguyên tử Cl nhận e (chất oxi hoá), 1 nguyên tử Cl nhường e (chất khử).<br><b>Môi trường:</b> {H2SO4}, {H}<sup>+</sup> đủ để cân bằng O, H; hệ số tối giản."
      },
      "k5": {
        "ten": "Chuẩn độ bằng KMnO4",
        "rule": "<b>Dụng cụ:</b> dung dịch {KMnO4} ở burette; dung dịch {Fe}<sup>2+</sup> + {H2SO4} loãng ở bình tam giác.<br><b>Phương trình:</b> {MnO4}<sup>−</sup> + 5{Fe}<sup>2+</sup> + 8{H}<sup>+</sup> → {Mn}<sup>2+</sup> + 5{Fe}<sup>3+</sup> + 4{H2O}; acid <b>tham gia</b> phản ứng.<br><b>Tỉ lệ:</b> Mn +7 → +2 nhận 5e ⇒ <b>n({Fe}<sup>2+</sup>) = 5·n({KMnO4})</b>.<br><b>Điểm cuối:</b> {KMnO4} tự làm chỉ thị; dư 1 giọt → màu hồng nhạt bền khoảng 20 giây.<br><b>Tính %:</b> n = C·V (V đổi ra lít); m(Fe) = 56·n; % = m(Fe) : m(mẫu) × 100."
      },
      "k6": {
        "ten": "Tính theo phương trình",
        "rule": "<b>Bước 1:</b> cân bằng phương trình (k4) rồi mới lấy tỉ lệ mol: 2ZnS + 3{O2} → 2ZnO + 2{SO2}.<br><b>Bảo toàn electron:</b> tổng mol e nhường = tổng mol e nhận, không cần viết đủ phương trình.<br><b>Thể tích khí:</b> đkc 25 °C, 1 bar: <b>24,79 L/mol</b>; 1 m³ = 1000 L.<br><b>Khối lượng:</b> m = n·M; đổi tấn, kg, mg về cùng đơn vị với đáp số.<br><b>Hiệu suất:</b> tính sản phẩm × H, tìm nguyên liệu ÷ H."
      },
      "k7": {
        "ten": "Hợp chất vô cơ quen",
        "rule": "<b>Gọi tên:</b> kim loại nhiều hoá trị ghi số La Mã: iron(III) oxide {Fe2O3}, copper(II) sulfate {CuSO4}, iron(II,III) oxide {Fe3O4}.<br><b>{H2SO4} loãng:</b> tính oxi hoá do {H}<sup>+</sup>, không tác dụng với Cu.<br><b>{H2SO4} đặc, nóng:</b> S<sup>+6</sup> oxi hoá mạnh, sinh {SO2} độc → cách sản xuất có {SO2} gây ô nhiễm hơn.<br><b>Pha loãng an toàn:</b> <b>rót từ từ acid đặc vào nước</b>, khuấy đều; không làm ngược lại.<br><b>Hiện tượng:</b> dung dịch {KMnO4} tím mất màu khi bị khử; {Cu}<sup>2+</sup> xanh; {Fe}<sup>3+</sup> vàng nâu."
      }
    },
    "TRAPS_THEM": {
      "songuyentu": {
        "ten": "Quên số nguyên tử",
        "hoi": "Đã nhân số oxi hoá, số electron với chỉ số nguyên tử trong công thức chưa? {Cu3P} có 3 Cu, {Cr2O7}<sup>2−</sup> có 2 Cr."
      },
      "moitruong": {
        "ten": "Bỏ sót môi trường",
        "hoi": "Acid trong phản ứng chỉ tạo môi trường hay còn góp {H}<sup>+</sup> vào phương trình? Có mặt trong phương trình ion là có tham gia."
      },
      "hesonguyentu": {
        "ten": "Nhầm tỉ lệ nguyên tử",
        "hoi": "Đề hỏi số nguyên tử đóng vai trò chất oxi hoá hay hệ số phân tử? Trong phản ứng tự oxi hoá – khử, cùng một chất chia làm hai vai."
      }
    },
    "DANG_KEY": {
      "OXI_HOA_KHU.CHAT_KHU_CHAT_OXH.NHAN_DANG": "k2",
      "OXI_HOA_KHU.CHAT_KHU_CHAT_OXH.CHON_PHAT_BIEU": "k2",
      "OXI_HOA_KHU.CHAT_KHU_CHAT_OXH.DEM_DONG_PHAN": "k2",
      "OXI_HOA_KHU.CHAT_KHU_CHAT_OXH.DEM_NGUYEN_TU": "k4",
      "OXI_HOA_KHU.SO_OXI_HOA.XAC_DINH_SO_OXI_HOA": "k1",
      "OXI_HOA_KHU.SO_OXI_HOA.NHAN_DANG": "k1",
      "OXI_HOA_KHU.SO_OXI_HOA.CHON_PHAT_BIEU": "k4",
      "OXI_HOA_KHU.SO_OXI_HOA.DEM_DONG_PHAN": "k3",
      "OXI_HOA_KHU.CHUAN_DO.CHON_PHAT_BIEU": "k5",
      "OXI_HOA_KHU.CHUAN_DO.NHAN_DANG": "k5",
      "OXI_HOA_KHU.CHUAN_DO.TINH_PHAN_TRAM": "k5",
      "OXI_HOA_KHU.CHUAN_DO.DEM_DONG_PHAN": "k5",
      "OXI_HOA_KHU.HIEN_TUONG.CHON_PHAT_BIEU": "k7",
      "OXI_HOA_KHU.HIEN_TUONG.NEU_HIEN_TUONG": "k7",
      "OXI_HOA_KHU.HIEN_TUONG.NHAN_DANG": "k7",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.GOI_TEN": "k7",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.CHON_PHAT_BIEU": "k7",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.SO_SANH": "k7",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.DEM_NGUYEN_TU": "k4",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.TINH_SO_MOL": "k6",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.TINH_THE_TICH": "k6",
      "OXI_HOA_KHU.HOP_CHAT_VO_CO.TINH_KHOI_LUONG": "k6"
    },
    "daDuyet": "máy dựng 29/09"
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
  },
  "TOC_DO": {
    "ma": "TOC_DO",
    "chuong": "Tốc độ phản ứng",
    "lop": "10",
    "KEYS": {
      "k1": {
        "ten": "Tốc độ trung bình",
        "rule": "<b>Khái niệm:</b> tốc độ phản ứng là độ biến thiên nồng độ một chất trong một đơn vị thời gian; đơn vị thường là M/s.<br><b>Công thức:</b> aA + bB → mM + nN: v = −(1/a)·ΔC<sub>A</sub>/Δt = (1/m)·ΔC<sub>M</sub>/Δt.<br><b>Chia hệ số:</b> {BrO3}<sup>−</sup> + 5{Br}<sup>−</sup> + …: v = (1/5)·2,0·10<sup>−3</sup> = 0,4·10<sup>−3</sup> M/s.<br><b>Nồng độ sau:</b> chất đầu giảm ΔC = a·v·Δt; sản phẩm tăng tương ứng.<br><b>Theo khí:</b> có thể đo bằng thể tích khí thoát ra (mL/s)."
      },
      "k2": {
        "ten": "Định luật tác dụng khối lượng",
        "rule": "<b>Biểu thức:</b> với phản ứng đơn giản aA + bB → sản phẩm: <b>v = k·C<sub>A</sub><sup>a</sup>·C<sub>B</sub><sup>b</sup></b>.<br><b>Hằng số k:</b> chỉ phụ thuộc bản chất chất phản ứng và nhiệt độ; <b>không</b> phụ thuộc nồng độ.<br><b>Nghĩa của k:</b> k là tốc độ khi mọi nồng độ bằng 1 M.<br><b>Tính k:</b> k = v : (C<sub>A</sub><sup>a</sup>·C<sub>B</sub><sup>b</sup>).<br><b>Đổi nồng độ:</b> tăng C<sub>A</sub> gấp 2, số mũ a = 2 → v tăng 4 lần."
      },
      "k3": {
        "ten": "Yếu tố ảnh hưởng",
        "rule": "<b>Nồng độ:</b> tăng nồng độ chất phản ứng → tốc độ tăng; thêm dung dịch <b>cùng nồng độ</b> thì tốc độ không đổi.<br><b>Áp suất:</b> chỉ ảnh hưởng khi có <b>chất khí</b> tham gia; phản ứng chỉ có chất rắn, lỏng thì không.<br><b>Nhiệt độ:</b> tăng nhiệt độ → tốc độ tăng (bảo quản lạnh làm chậm hư hỏng).<br><b>Diện tích bề mặt:</b> chất rắn càng nhỏ, mịn → tốc độ càng lớn: bột > viên > khối.<br><b>Chất xúc tác:</b> xem k5.<br><b>Đời sống:</b> quạt gió vào bếp than (tăng {O2}), đập nhỏ nguyên liệu, nồi áp suất."
      },
      "k4": {
        "ten": "Hệ số nhiệt độ Van't Hoff",
        "rule": "<b>Công thức:</b> <b>v<sub>2</sub>/v<sub>1</sub> = γ<sup>(t<sub>2</sub> − t<sub>1</sub>)/10</sup></b>, γ thường từ 2 đến 4.<br><b>Thời gian:</b> tỉ lệ nghịch với tốc độ: t<sub>1</sub>/t<sub>2</sub> = v<sub>2</sub>/v<sub>1</sub>.<br><b>Ví dụ:</b> γ = 2, tăng 30 °C → tốc độ gấp 2<sup>3</sup> = 8 lần.<br><b>Tìm γ:</b> lấy căn bậc (Δt : 10) của tỉ số tốc độ.<br><b>Giảm nhiệt độ:</b> số mũ âm → tốc độ giảm."
      },
      "k5": {
        "ten": "Chất xúc tác",
        "rule": "<b>Định nghĩa:</b> làm <b>tăng</b> tốc độ phản ứng, <b>còn lại sau phản ứng</b> với khối lượng và bản chất hoá học không đổi.<br><b>Cách tác động:</b> làm giảm năng lượng hoạt hoá; không làm tăng lượng sản phẩm tối đa.<br><b>Ví dụ:</b> {MnO2} phân huỷ {H2O2}, {KClO3}; Fe tổng hợp {NH3}; {V2O5} oxi hoá {SO2}; enzyme là xúc tác sinh học.<br><b>Ô tô:</b> bộ chuyển đổi xúc tác biến CO, NO thành {CO2}, {N2}, giảm ô nhiễm."
      },
      "k6": {
        "ten": "Đọc đồ thị động học",
        "rule": "<b>Độ dốc:</b> độ dốc đường cong = tốc độ tại thời điểm đó; càng dốc càng nhanh.<br><b>Giảm dần:</b> nồng độ chất đầu giảm nên tốc độ giảm theo thời gian; tốc độ trung bình các khoảng bằng nhau <b>không</b> như nhau.<br><b>Đường nằm ngang:</b> phản ứng đã dừng, tốc độ bằng 0.<br><b>Tốc độ trung bình:</b> ΔV : Δt hoặc ΔC : Δt, đọc đúng hai mốc trên trục.<br><b>So hai đường:</b> đường dốc hơn ứng với điều kiện nhanh hơn; cùng lượng chất hết thì mức cuối bằng nhau."
      }
    },
    "TRAPS_THEM": {
      "chiaheso": {
        "ten": "Quên chia hệ số",
        "hoi": "Tốc độ phản ứng hay tốc độ tiêu thụ một chất? Đã chia cho hệ số của chất đó trong phương trình chưa?"
      },
      "chatran": {
        "ten": "Áp suất với chất rắn",
        "hoi": "Chất tham gia có chất khí không? Áp suất và nồng độ không áp dụng cho chất rắn."
      },
      "nhanhnhieu": {
        "ten": "Nhanh là nhiều",
        "hoi": "Yếu tố này làm phản ứng nhanh hơn hay làm thu được nhiều sản phẩm hơn? Xúc tác, bột mịn không tăng lượng sản phẩm cuối."
      }
    },
    "DANG_KEY": {
      "TOC_DO.YEU_TO.NHAN_DANG": "k3",
      "TOC_DO.YEU_TO.SO_SANH": "k3",
      "TOC_DO.YEU_TO.CHON_PHAT_BIEU": "k6",
      "TOC_DO.YEU_TO.TINH_PHAN_TRAM": "k1",
      "TOC_DO.YEU_TO.TINH_TI_SO": "k4",
      "TOC_DO.XUC_TAC.CHON_PHAT_BIEU": "k5",
      "TOC_DO.DUONG_CONG_DONG_HOC.NHAN_DANG": "k6",
      "TOC_DO.BIEU_THUC.TINH_NONG_DO": "k1",
      "TOC_DO.BIEU_THUC.TINH_HANG_SO": "k2"
    },
    "daDuyet": "máy dựng 29/09"
  }
};

// server/src/loi-hoc-luat.ts
var TRAN_SONG_SINH = 4;
var CHO_SONG_SINH = 2 * TRAN_SONG_SINH;

// server/src/cau-bo-tro.ts
function docBangSongSinh(v) {
  if (!Array.isArray(v) || v.length < 2 || !Array.isArray(v[0]) || v[0].length < 2) return void 0;
  const cot = v[0].length;
  if (!v.every((r) => Array.isArray(r) && r.length === cot && r.every((c) => typeof c === "string" || typeof c === "number" && Number.isFinite(c)))) return void 0;
  return v.map((r) => r.map(String));
}
function thieuBangSongSinh(ss) {
  const nhacBang = /bảng\s*(?:(?:số liệu|dữ liệu|thành phần|giá trị|kết quả)\s*)?(?:sau|dưới|trên|bên|kèm|này|cho|\d|:)/iu.test(ss.de);
  const bangTrongChu = /[^\n|]+\|[^\n|]+\|[^\n|]+/.test(ss.de) && /\d/.test(ss.de);
  const anhDe = ss.hinh?.some((h) => h.du_lieu && (h.vi_tri === "sau_de" || h.vi_tri === "cuoi_cau"));
  return nhacBang && !docBangSongSinh(ss.bang) && !anhDe && !bangTrongChu;
}
function songSinhDuDuLieu(phan, ss) {
  if (!ss.de?.trim() || thieuBangSongSinh(ss)) return false;
  if (phan === "I") return ["A", "B", "C", "D"].every((k) => typeof ss.pa?.[k] === "string" && ss.pa[k].trim()) && /^[ABCD]$/.test(ss.dap_an.trim());
  return phan === "III" && /^-?\d+(,\d+)?$/.test(ss.dap_an.trim());
}

// server/src/may-soan-kiem.ts
var laObj2 = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
var chuoi3 = (x) => (typeof x === "string" ? x : typeof x === "number" && Number.isFinite(x) ? String(x) : "").normalize("NFC");
var SO_BAN_KHAC_TOI_DA = 4;
var Y_DS_DU = 8;
var Y_DS_MUC_TIEU = 12;
var Y_DS_TRAN = 24;
var CACH_BAN_KHAC = ["doi_so", "doi_chat", "dao_chieu", "dung_sai", "doi_nhieu"];
var CAN_RONG = { hoSo: true, banKhac: 0, kieuBan: "tu_chon", yDs: 0 };
var DA_CO_RONG = { banKhac: [], yDs: [] };
function boHtml(s) {
  return chuoi3(s).replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}
function chuanChu2(s) {
  return boHtml(s).toLowerCase().replace(/[\s.,;:!?()[\]{}"'“”‘’«»\-–—_/\\|*+=^~`…]+/gu, "");
}
function soTrongChu(s) {
  const ra = [];
  for (const m of chuoi3(s).matchAll(/(?<![\p{L}\d)\]}^_{.,])\d+(?:[.,]\d+)?/gu)) {
    const v = Number(m[0].replace(",", "."));
    if (Number.isFinite(v)) ra.push(v);
  }
  return ra;
}
function dauSoLieu(de, bang) {
  return soTrongChu([de, ...(bang ?? []).flat()].join(" \n ")).map((v) => String(Number(v.toFixed(6)))).sort().join("|");
}
var soDapAn = (s) => Number(chuoi3(s).trim().replace(",", "."));
var soLe = (s) => /[.,](\d+)$/.exec(chuoi3(s).trim())?.[1]?.length ?? 0;
var khoaBan = (x) => chuanChu2(x.de + " " + (x.pa ? ["A", "B", "C", "D"].map((k) => x.pa?.[k] ?? "").join(" ") : ""));
var TU_NOI_BO = /song\s*sinh|biến\s*thể|bản\s*khác|câu\s*gốc|đề\s*gốc|máy\s*soạn|lượt\s*kiểm/iu;
function chuChoEm(s, noi, loi) {
  if (/<\/?[a-z][a-z0-9]*\b[^>]*>/i.test(s)) loi.push(`${noi}: không được có thẻ HTML (viết chữ thường như đề kho)`);
  if (TU_NOI_BO.test(s)) loi.push(`${noi}: có từ nội bộ (song sinh / biến thể / bản khác / câu gốc…) — học sinh đọc chữ này`);
}
function chuanDs(v) {
  const s = chuoi3(v).trim().toUpperCase().replace(/[.!]+$/, "");
  if (s === "D" || s === "Đ" || s === "ĐÚNG" || s === "DUNG") return "D";
  if (s === "S" || s === "SAI") return "S";
  return "";
}
function chuoiDs4(v) {
  const s = chuoi3(v).toUpperCase().replace(/Đ/g, "D").replace(/[\s,;|–—-]+/g, "");
  return /^[DS]{4}$/.test(s) ? s : "";
}
function cauGocTuKho(c, bam) {
  const dang = loaiCau(c);
  if (!dang) return null;
  const ids = (o) => o ? Object.keys(o).sort() : [];
  return {
    qid: c.qid,
    bam,
    dang,
    phan: c.phan,
    de: c.de,
    bang: c.bang,
    pa: dang === "tn" && c.pa ? Object.fromEntries(ids(c.pa).map((k) => [k, c.pa[k]])) : null,
    y: dang === "ds" && c.y ? ids(c.y).map((k) => ({ id: k, t: c.y[k] })) : [],
    dapAn: c.dapAn,
    kieu: c.kieu ?? ""
  };
}
function cauGocTuVao(v) {
  if (!laObj2(v)) return null;
  const dang = chuoi3(v.dang);
  if (dang !== "tn" && dang !== "ds" && dang !== "tln") return null;
  const y = Array.isArray(v.y) ? v.y.filter(laObj2).map((x) => ({ id: chuoi3(x.id), t: chuoi3(x.t) })) : [];
  const da = laObj2(v.dapAn) ? v.dapAn : {};
  const phanTho = chuoi3(v.phan);
  const phan = phanTho === "I" || phanTho === "II" || phanTho === "III" ? phanTho : dang === "tn" ? "I" : dang === "ds" ? "II" : "III";
  const dapAn = dang === "tn" ? chuoi3(laObj2(v.mc) ? v.mc.dapAn : "") || (y.find((x) => chuoi3(da[x.id]) === "D")?.id ?? "") : dang === "ds" ? y.map((x) => chuoi3(da[x.id])).join("") : chuoi3(da.kq);
  return {
    qid: chuoi3(v.qid),
    bam: chuoi3(v.bam),
    dang,
    phan,
    de: chuoi3(v.deTho) || boHtml(chuoi3(v.de)),
    bang: docBangSongSinh(v.bang) ?? null,
    pa: dang === "tn" ? Object.fromEntries(y.map((x) => [x.id, x.t])) : null,
    y: dang === "ds" ? y : [],
    dapAn,
    kieu: chuoi3(v.kieuKho)
  };
}
function kieuBanCua(kieuKho) {
  const k = chuoi3(kieuKho).trim();
  return k === "bai_tap" ? "so" : k === "ly_thuyet" ? "ly_thuyet" : "tu_chon";
}
function tinhCan(o) {
  const kieuBan = kieuBanCua(o.kieuKho);
  if (o.boTro === false || o.nghi) return { hoSo: o.hoSo, banKhac: 0, kieuBan, yDs: 0 };
  return {
    hoSo: o.hoSo,
    kieuBan,
    banKhac: o.dang === "ds" ? 0 : Math.max(0, SO_BAN_KHAC_TOI_DA - Math.max(0, o.soBanDung)),
    yDs: o.dang === "ds" && o.soY < Y_DS_DU ? Math.max(0, Math.min(Y_DS_MUC_TIEU, Y_DS_TRAN - o.soY, Y_DS_MUC_TIEU - Math.max(0, o.soY))) : 0
  };
}
function thieuBanKhac(dang, soBanDung, soY) {
  if (dang === "ds") return soY <= 0 ? "han" : soY < Y_DS_DU ? "mot_phan" : null;
  return soBanDung <= 0 ? "han" : soBanDung < SO_BAN_KHAC_TOI_DA ? "mot_phan" : null;
}
function uuTienEmSai(soEm, thieu) {
  return (thieu === "han" ? 2e5 : 1e5) + Math.min(9999, Math.max(0, Math.floor(soEm))) * 10;
}
var qidGocMaySoan = (q) => chuoi3(q).trim().replace(/#\d+$/, "").replace(/~ss\d+$/, "").replace(/~\d+$/, "");
function kiemPhepTinhBan(ds, noi, loi) {
  if (!Array.isArray(ds)) {
    loi.push(`${noi}: phepTinh phải là mảng`);
    return [];
  }
  const ra = [];
  ds.forEach((p, j) => {
    if (!laObj2(p)) {
      loi.push(`${noi}: phepTinh[${j}] không phải đối tượng`);
      return;
    }
    const ten = chuoi3(p.ten).trim() || `#${j + 1}`;
    const d = p.lamTron === void 0 ? 2 : Number(p.lamTron);
    if (!Number.isInteger(d) || d < 0 || d > 8) {
      loi.push(`${noi}: "${ten}" lamTron lạ`);
      return;
    }
    if (typeof p.ketQua !== "number" || !Number.isFinite(p.ketQua)) {
      loi.push(`${noi}: "${ten}" ketQua không phải số`);
      return;
    }
    try {
      const v = tinhBieuThuc(chuoi3(p.bieuThuc));
      if (Math.abs(v - p.ketQua) > 0.5 * 10 ** -d + 1e-9) {
        loi.push(`KHOÁ SỐ ${noi}: "${ten}" máy tính ra ${v.toFixed(d + 2)} ≠ ghi ${p.ketQua}`);
        return;
      }
    } catch (e) {
      loi.push(`${noi}: "${ten}" ${e.message}`);
      return;
    }
    ra.push({ ...chuoi3(p.ten).trim() ? { ten } : {}, bieuThuc: chuoi3(p.bieuThuc), ketQua: p.ketQua, lamTron: d, ...p.laDapSo === true ? { laDapSo: true } : {} });
  });
  return ra;
}
function kiemBanKhacMot(goc, x, i) {
  const noi = `bản khác ${i + 1}`;
  if (!laObj2(x)) return { loi: [`${noi}: không phải đối tượng JSON`] };
  if (goc.phan !== "I" && goc.phan !== "III") return { loi: [`${noi}: chỉ câu Phần I / III có bản khác`] };
  const loi = [];
  const kieu = chuoi3(x.kieu).trim();
  if (kieu !== "so" && kieu !== "ly_thuyet") loi.push(`${noi}: kieu phải là "so" (đổi số liệu) hoặc "ly_thuyet" (biến thể lí thuyết)`);
  const cach = chuoi3(x.cach).trim();
  if (cach && !CACH_BAN_KHAC.includes(cach)) loi.push(`${noi}: cach lạ "${cach}" (${CACH_BAN_KHAC.join(" | ")})`);
  const de = chuoi3(x.de).trim();
  if (de.length < 15) loi.push(`${noi}: đề rỗng hoặc quá ngắn`);
  else if (de.length > 3e3) loi.push(`${noi}: đề dài quá 3000 kí tự`);
  chuChoEm(de, `${noi} · đề`, loi);
  const dapAn = chuoi3(x.dap_an).trim();
  let pa;
  if (goc.phan === "I") {
    if (!laObj2(x.pa) || Object.keys(x.pa).sort().join("") !== "ABCD") loi.push(`${noi}: pa cần đúng 4 phương án A, B, C, D`);
    else {
      const paTho = x.pa;
      pa = Object.fromEntries(["A", "B", "C", "D"].map((k) => [k, chuoi3(paTho[k]).trim()]));
      for (const k of ["A", "B", "C", "D"]) {
        const t = pa[k];
        if (!t) loi.push(`${noi}: phương án ${k} rỗng`);
        else {
          if (t.length > 800) loi.push(`${noi}: phương án ${k} dài quá 800 kí tự`);
          chuChoEm(t, `${noi} · phương án ${k}`, loi);
        }
      }
      if (new Set(Object.values(pa).map(chuanChu2)).size < 4) loi.push(`${noi}: có hai phương án trùng nhau`);
    }
    if (!/^[ABCD]$/.test(dapAn)) loi.push(`${noi}: dap_an phải là một chữ A–D`);
  } else {
    if (x.pa !== void 0) loi.push(`${noi}: câu trả lời ngắn (Phần III) không có pa`);
    if (!/^-?\d+(,\d+)?$/.test(dapAn)) loi.push(`${noi}: dap_an phải là số kiểu "54" hoặc "3,36" (dấu phẩy thập phân)`);
  }
  const buoc = Array.isArray(x.buoc) ? x.buoc.map((b) => chuoi3(b).trim()) : null;
  if (!buoc || buoc.length < 1 || buoc.length > 6 || buoc.some((b) => !b)) loi.push(`${noi}: buoc cần 1–6 bước, không bước rỗng`);
  else buoc.forEach((b, j) => {
    if (b.length > 600) loi.push(`${noi}: bước ${j + 1} dài quá 600 kí tự`);
    chuChoEm(b, `${noi} · bước ${j + 1}`, loi);
  });
  const chot = chuoi3(x.chot).trim();
  if (!chot) loi.push(`${noi}: thiếu chot (một câu chốt cách giải)`);
  else {
    if (chot.length > 400) loi.push(`${noi}: chot dài quá 400 kí tự`);
    chuChoEm(chot, `${noi} · chot`, loi);
  }
  let bang;
  if (x.bang !== void 0 && x.bang !== null) {
    bang = docBangSongSinh(x.bang);
    if (!bang) loi.push(`${noi}: bang phải là bảng chữ nhật ≥ 2 hàng × 2 cột (ô là chữ hoặc số)`);
    else bang.flat().forEach((o) => chuChoEm(o, `${noi} · bảng`, loi));
  }
  let phepTinh;
  if (kieu === "so") {
    if (!Array.isArray(x.phepTinh) || !x.phepTinh.length) loi.push(`KHOÁ SỐ ${noi}: kieu "so" cần phepTinh (máy tính lại đáp án)`);
    else {
      const truoc = loi.length;
      phepTinh = kiemPhepTinhBan(x.phepTinh, noi, loi);
      const cuoi = phepTinh.filter((p) => p.laDapSo).pop();
      if (loi.length === truoc) {
        if (!cuoi) loi.push(`KHOÁ SỐ ${noi}: thiếu phép tính cuối "laDapSo": true`);
        else if (goc.phan === "III" && /^-?\d+(,\d+)?$/.test(dapAn) && Math.abs(soDapAn(dapAn) - cuoi.ketQua) > 1e-9) {
          loi.push(`KHOÁ SỐ ${noi}: phép tính cuối ra ${cuoi.ketQua} ≠ đáp số ${dapAn}`);
        } else if (goc.phan === "I" && pa && /^[ABCD]$/.test(dapAn)) {
          const sai = 0.5 * 10 ** -cuoi.lamTron + 1e-9;
          const coKetQua = (s) => soTrongChu(s).some((v) => Math.abs(v - cuoi.ketQua) <= sai);
          if (soTrongChu(pa[dapAn]).length && !coKetQua(pa[dapAn])) loi.push(`KHOÁ SỐ ${noi}: phương án đúng ${dapAn} không chứa kết quả tính ${cuoi.ketQua}`);
          for (const k of ["A", "B", "C", "D"]) if (k !== dapAn && coKetQua(pa[k])) loi.push(`KHOÁ SỐ ${noi}: phương án nhiễu ${k} trùng kết quả tính ${cuoi.ketQua} (hai đáp án đúng)`);
        }
      }
    }
    if (de && !dauSoLieu(de, bang)) loi.push(`${noi}: kieu "so" mà đề không có số liệu`);
  } else if (x.phepTinh !== void 0) {
    phepTinh = kiemPhepTinhBan(x.phepTinh, noi, loi);
  }
  if (!loi.length) {
    const ss = { de, dap_an: dapAn, ...pa ? { pa } : {}, ...bang ? { bang } : {}, buoc, chot };
    if (!songSinhDuDuLieu(goc.phan, ss)) loi.push(`${noi}: game chưa dùng được (đề nhắc tới bảng mà không kèm bảng, hoặc thiếu phương án / đáp số)`);
  }
  if (loi.length) return { loi };
  return {
    loi,
    ban: { kieu, ...cach ? { cach } : {}, de, ...pa ? { pa } : {}, ...bang ? { bang } : {}, dap_an: dapAn, buoc, chot, ...phepTinh?.length ? { phepTinh } : {} }
  };
}
function kiemBanKhac(goc, can, ds, daCo = DA_CO_RONG, batBuocSo = true) {
  const loi = [], canhBao = [], hopLe = [], chiSo = [], bo = [];
  const can_ = Math.max(0, Math.min(SO_BAN_KHAC_TOI_DA, Math.floor(Number(can.banKhac) || 0)));
  if (ds === void 0 || ds === null) {
    if (can_ > 0 && batBuocSo) loi.push(`thiếu songSinh: cần ${can_} bản khác`);
    return { loi, canhBao, hopLe, chiSo, bo };
  }
  if (!Array.isArray(ds)) return { loi: ["songSinh phải là mảng"], canhBao, hopLe, chiSo, bo };
  if (can_ === 0) {
    if (ds.length) canhBao.push("câu này không cần bản khác — bỏ qua");
    return { loi, canhBao, hopLe, chiSo, bo };
  }
  if (batBuocSo && ds.length !== can_) loi.push(`cần đúng ${can_} bản khác (câu đã có ${SO_BAN_KHAC_TOI_DA - can_} bản dùng được), nộp ${ds.length}`);
  const khoa = /* @__PURE__ */ new Set([khoaBan(goc), ...daCo.banKhac.map(khoaBan)]);
  const so = new Set([dauSoLieu(goc.de, goc.bang), ...daCo.banKhac.map((x) => dauSoLieu(x.de, x.bang))].filter(Boolean));
  const dapSo = goc.phan === "III" ? [goc.dapAn, ...daCo.banKhac.map((x) => x.dap_an)].map(soDapAn).filter(Number.isFinite) : [];
  ds.forEach((x, i) => {
    if (i >= can_) {
      bo.push({ i, lyDo: `thừa (chỉ cần ${can_} bản)` });
      return;
    }
    const r = kiemBanKhacMot(goc, x, i);
    if (!r.ban) {
      loi.push(...r.loi);
      bo.push({ i, lyDo: r.loi[0] ?? "không hợp lệ" });
      return;
    }
    const ban = r.ban;
    const boVi = (m) => {
      loi.push(m);
      bo.push({ i, lyDo: m });
    };
    const k = khoaBan(ban);
    if (khoa.has(k)) return boVi(`bản khác ${i + 1}: trùng chữ với đề gốc / bản đã có / bản trước`);
    if (ban.kieu === "so") {
      const s = dauSoLieu(ban.de, ban.bang);
      if (so.has(s)) return boVi(`bản khác ${i + 1}: trùng SỐ LIỆU với đề gốc / bản khác — mỗi bản phải một bộ số riêng`);
      so.add(s);
    }
    if (goc.phan === "III") {
      const v = soDapAn(ban.dap_an);
      if (dapSo.some((w) => Math.abs(w - v) < 1e-9)) return boVi(`bản khác ${i + 1}: đáp số ${ban.dap_an} trùng đáp số gốc / bản khác — học sinh nhớ được số`);
      dapSo.push(v);
    }
    khoa.add(k);
    hopLe.push(ban);
    chiSo.push(i);
  });
  if (batBuocSo && goc.phan === "I" && hopLe.length >= 2 && new Set(hopLe.map((x) => x.dap_an)).size === 1) {
    loi.push(`đáp án đúng của ${hopLe.length} bản đều là ${hopLe[0].dap_an} — xếp đáp án đúng ở các chữ khác nhau (học sinh nhớ được chữ cái)`);
  }
  if (can.kieuBan === "so" && hopLe.some((x) => x.kieu !== "so")) canhBao.push('câu tính toán (kho ghi "bai_tap"): nên đổi số liệu (kieu "so")');
  if (can.kieuBan === "ly_thuyet" && hopLe.some((x) => x.kieu === "so")) canhBao.push('câu lí thuyết: kieu "so" chỉ khi đề thật sự có số liệu để đổi');
  return { loi, canhBao, hopLe, chiSo, bo };
}
function kiemYMoiMot(_goc, x, i) {
  const noi = `ý mới ${i + 1}`;
  if (!laObj2(x)) return { loi: [`${noi}: không phải đối tượng JSON`] };
  const loi = [];
  const t = chuoi3(x.t).trim();
  if (t.length < 10) loi.push(`${noi}: chữ của ý rỗng hoặc quá ngắn`);
  else if (t.length > 600) loi.push(`${noi}: chữ của ý dài quá 600 kí tự`);
  chuChoEm(t, noi, loi);
  const d = chuanDs(x.d);
  if (!d) loi.push(`${noi}: d phải là "D" (đúng) hoặc "S" (sai)`);
  const lyDo = chuoi3(x.lyDo ?? x.ly_do).trim();
  if (!lyDo) loi.push(`${noi}: thiếu lyDo (lí do 1 dòng)`);
  else if (/[\r\n]/.test(lyDo)) loi.push(`${noi}: lyDo chỉ được 1 dòng`);
  else if (lyDo.length > 300) loi.push(`${noi}: lyDo dài quá 300 kí tự`);
  else chuChoEm(lyDo, `${noi} · lyDo`, loi);
  return loi.length ? { loi } : { loi, y: { t, d, lyDo } };
}
function kiemYMoi(goc, can, ds, daCo = DA_CO_RONG, batBuocSo = true) {
  const loi = [], canhBao = [], hopLe = [], chiSo = [], bo = [];
  const can_ = Math.max(0, Math.min(Y_DS_MUC_TIEU, Math.floor(Number(can.yDs) || 0)));
  if (goc.dang !== "ds") {
    if (Array.isArray(ds) && ds.length) canhBao.push("chỉ câu Đúng/Sai (Phần II) có ý mới — bỏ qua");
    return { loi, canhBao, hopLe, chiSo, bo };
  }
  if (ds === void 0 || ds === null) {
    if (can_ > 0 && batBuocSo) loi.push(`thiếu yMoi: cần ${Math.min(Y_DS_DU, can_)}–${can_} ý mới`);
    return { loi, canhBao, hopLe, chiSo, bo };
  }
  if (!Array.isArray(ds)) return { loi: ["yMoi phải là mảng"], canhBao, hopLe, chiSo, bo };
  if (can_ === 0) {
    if (ds.length) canhBao.push("câu này đã đủ ý — bỏ qua");
    return { loi, canhBao, hopLe, chiSo, bo };
  }
  const toiThieu = Math.min(Y_DS_DU, can_);
  if (batBuocSo && (ds.length < toiThieu || ds.length > can_)) loi.push(`cần ${toiThieu}–${can_} ý mới, nộp ${ds.length}`);
  const khoa = /* @__PURE__ */ new Set([...goc.y.map((x) => chuanChu2(x.t)), ...daCo.yDs.map(chuanChu2)]);
  ds.forEach((x, i) => {
    if (i >= can_) {
      bo.push({ i, lyDo: `thừa (chỉ cần ${can_} ý)` });
      return;
    }
    const r = kiemYMoiMot(goc, x, i);
    if (!r.y) {
      loi.push(...r.loi);
      bo.push({ i, lyDo: r.loi[0] ?? "không hợp lệ" });
      return;
    }
    const k = chuanChu2(r.y.t);
    if (khoa.has(k)) {
      const m = `ý mới ${i + 1}: trùng ý gốc / ý đã có / ý trước`;
      loi.push(m);
      bo.push({ i, lyDo: m });
      return;
    }
    khoa.add(k);
    hopLe.push(r.y);
    chiSo.push(i);
  });
  if (batBuocSo && hopLe.length >= 4) {
    const toi = Math.ceil(hopLe.length / 4);
    const nD = hopLe.filter((x) => x.d === "D").length, nS = hopLe.length - nD;
    if (nD < toi || nS < toi) loi.push(`cần ít nhất ${toi} ý Đúng và ${toi} ý Sai (đang ${nD} Đúng · ${nS} Sai) — kho lệch một phía thì em đoán được`);
  }
  return { loi, canhBao, hopLe, chiSo, bo };
}
function kiemBoTro(goc, can, bt, daCo = DA_CO_RONG) {
  const rong = { songSinh: [], yMoi: [], boSongSinh: [], boY: [] };
  if (!laObj2(bt)) return { loi: ["tệp bổ trợ không phải đối tượng JSON"], canhBao: [], ...rong };
  const loi = [];
  if (chuoi3(bt.qid) !== goc.qid) loi.push(`KHOÁ MÃ CÂU: tệp bổ trợ ghi ${chuoi3(bt.qid)} ≠ ${goc.qid}`);
  if (chuoi3(bt.bam) !== goc.bam) loi.push(`KHOÁ VÂN TAY: tệp bổ trợ ghi ${chuoi3(bt.bam)} ≠ ${goc.bam}`);
  if (loi.length) return { loi, canhBao: [], ...rong };
  const ss = kiemBanKhac(goc, can, bt.songSinh, daCo);
  const ym = kiemYMoi(goc, can, bt.yMoi, daCo);
  return { loi: [...ss.loi, ...ym.loi], canhBao: [...ss.canhBao, ...ym.canhBao], songSinh: ss.hopLe, yMoi: ym.hopLe, boSongSinh: ss.bo, boY: ym.bo };
}
function dungVaoMu(goc, hopLe, kiemGoc) {
  const muc = [];
  hopLe.songSinh.forEach((s, i) => muc.push({ id: `ss${i + 1}`, loai: "ban_khac", dang: goc.dang, de: s.de, ...s.pa ? { pa: s.pa } : {}, ...s.bang ? { bang: s.bang } : {} }));
  hopLe.yMoi.forEach((y, i) => muc.push({ id: `y${i + 1}`, loai: "y", dang: "ds", t: y.t }));
  if (kiemGoc) muc.push({ id: "goc", loai: "goc", dang: goc.dang, ...goc.dang === "tn" && goc.pa ? { pa: goc.pa } : {}, ...goc.dang === "ds" ? { y: goc.y } : {} });
  if (!muc.length) return null;
  return { cau: { de: goc.de, ...goc.bang ? { bang: goc.bang } : {} }, muc };
}
function docTraLoiMu(v) {
  const ds = laObj2(v) && Array.isArray(v.tra) ? v.tra : Array.isArray(v) ? v : [];
  return ds.filter(laObj2).map((x) => ({
    id: chuoi3(x.id).trim(),
    d: chuoi3(x.d).trim(),
    lyDo: chuoi3(x.lyDo ?? x.ly_do).trim(),
    ...x.chac === false ? { chac: false } : x.chac === true ? { chac: true } : {}
  })).filter((x) => x.id);
}
function khopMu(dang, deXuat, m, la4Y = false) {
  if (!m || m.chac === false) return false;
  const a = chuoi3(m.d).trim();
  if (!a || a.includes("?")) return false;
  if (dang === "tn") return /^[ABCD]$/i.test(a) && a.toUpperCase() === chuoi3(deXuat).trim().toUpperCase();
  if (dang === "ds") {
    if (la4Y) {
      const x2 = chuoiDs4(a);
      return !!x2 && x2 === chuoiDs4(deXuat);
    }
    const x = chuanDs(a);
    return !!x && x === chuanDs(deXuat);
  }
  if (!/^-?\d+([.,]\d+)?$/.test(a)) return false;
  const v = soDapAn(a), w = soDapAn(deXuat);
  return Number.isFinite(w) && Math.abs(v - w) <= 0.5 * 10 ** -soLe(deXuat) + 1e-9;
}
var lyDoBoMu = (m, deXuat) => !m ? "lượt kiểm mù không trả lời mục này" : m.d.includes("?") || m.chac === false ? `lượt kiểm mù báo mơ hồ / không chắc${m.lyDo ? ": " + m.lyDo.slice(0, 160) : ""}` : `lượt kiểm mù ra ${m.d} ≠ ${deXuat}`;
function ghepHaiLuot(goc, hopLe, tra) {
  const theo = new Map((tra ?? []).map((t) => [t.id, t]));
  const songSinh = [], yMoi = [];
  const boSongSinh = [], boY = [];
  hopLe.songSinh.forEach((s, i) => {
    const m = theo.get(`ss${i + 1}`);
    if (khopMu(goc.dang, s.dap_an, m)) songSinh.push({ ...s, kiem: { d2: m.d, ...m.lyDo ? { lyDo2: m.lyDo.slice(0, 300) } : {} } });
    else boSongSinh.push({ i, lyDo: lyDoBoMu(m, s.dap_an) });
  });
  hopLe.yMoi.forEach((y, i) => {
    const m = theo.get(`y${i + 1}`);
    if (khopMu("ds", y.d, m)) yMoi.push({ ...y, kiem: { d2: chuanDs(m.d), ...m.lyDo ? { lyDo2: m.lyDo.slice(0, 300) } : {} } });
    else boY.push({ i, lyDo: lyDoBoMu(m, y.d) });
  });
  return { songSinh, yMoi, boSongSinh, boY };
}
var coDapAnConLai = (h) => laObj2(h) && Array.isArray(h.co) && h.co.some((c) => laObj2(c) && c.loai === "dapAn");
var coTuXuNghi = (co) => Array.isArray(co) && co.some((c) => laObj2(c) && c.loai === "dapAn" && laObj2(c.tuXu));
function tuXuCoDapAn(hoSo, goc, m) {
  const co = Array.isArray(hoSo.co) ? hoSo.co : [];
  const coDA = co.filter((c) => laObj2(c) && c.loai === "dapAn");
  if (!coDA.length) return { hoSo, ketQua: "khong_can" };
  if (khopMu(goc.dang, goc.dapAn, m, goc.dang === "ds")) {
    const daChot = [
      ...Array.isArray(hoSo.daChot) ? hoSo.daChot : [],
      ...coDA.map((c) => ({
        ghi: chuoi3(c.ghi) || "nghi đáp án",
        // Không cắt chữ phiên chốt: cắt giữa "{…}" làm lệch ngoặc công thức ⇒ bộ kiểm hồ sơ trượt.
        chot: `Giữ đáp án kho: lượt giải lại độc lập (không xem đáp án) ra đúng đáp án kho${chuoi3(c.chot).trim() ? ` — phiên chốt trước đó nghi: ${chuoi3(c.chot).trim()}` : ""}.`
      }))
    ];
    return { hoSo: { ...hoSo, co: co.filter((c) => !(laObj2(c) && c.loai === "dapAn")), daChot }, ketQua: "khop" };
  }
  const ketQua = !m ? "khong_co" : m.d.includes("?") || !m.d || m.chac === false ? "khong_chac" : "lech";
  const tuXu = { ketQua, giaiLai: m ? m.d.slice(0, 40) : "", ...m?.lyDo ? { lyDo: m.lyDo.slice(0, 300) } : {} };
  return { hoSo: { ...hoSo, co: co.map((c) => laObj2(c) && c.loai === "dapAn" ? { ...c, tuXu } : c) }, ketQua };
}
function nhanBanKhacNop(goc, ds, daCo) {
  if (!Array.isArray(ds) || goc.phan !== "I" && goc.phan !== "III") return { giu: [], bo: [] };
  const qua = [], bo = [];
  ds.slice(0, SO_BAN_KHAC_TOI_DA * 2).forEach((x, i) => {
    const k = laObj2(x) && laObj2(x.kiem) ? x.kiem : null;
    if (!k || !khopMu(goc.dang, chuoi3(x.dap_an), { d: chuoi3(k.d2) })) {
      bo.push({ i, lyDo: "chưa qua hai lượt khớp (thiếu kiem.d2 hoặc lệch đáp án)" });
      return;
    }
    qua.push({ i, x, kiem: { d2: chuoi3(k.d2).slice(0, 40), ...chuoi3(k.lyDo2).trim() ? { lyDo2: chuoi3(k.lyDo2).trim().slice(0, 300) } : {} } });
  });
  const r = kiemBanKhac(goc, { ...CAN_RONG, banKhac: SO_BAN_KHAC_TOI_DA }, qua.map((q) => q.x), daCo, false);
  r.bo.forEach((b) => bo.push({ i: qua[b.i].i, lyDo: b.lyDo }));
  return { giu: r.hopLe.map((ban, j) => ({ i: qua[r.chiSo[j]].i, ban: { ...ban, kiem: qua[r.chiSo[j]].kiem } })), bo: bo.sort((a, b) => a.i - b.i) };
}
function nhanYMoiNop(goc, ds, daCo) {
  if (!Array.isArray(ds) || goc.dang !== "ds") return { giu: [], bo: [] };
  const qua = [], bo = [];
  ds.slice(0, Y_DS_MUC_TIEU * 2).forEach((x, i) => {
    const k = laObj2(x) && laObj2(x.kiem) ? x.kiem : null;
    if (!k || !khopMu("ds", chuoi3(x.d), { d: chuoi3(k.d2) })) {
      bo.push({ i, lyDo: "chưa qua hai lượt khớp (thiếu kiem.d2 hoặc lệch Đ/S)" });
      return;
    }
    qua.push({ i, x, kiem: { d2: chuanDs(k.d2), ...chuoi3(k.lyDo2).trim() ? { lyDo2: chuoi3(k.lyDo2).trim().slice(0, 300) } : {} } });
  });
  const r = kiemYMoi(goc, { ...CAN_RONG, yDs: Y_DS_MUC_TIEU }, qua.map((q) => q.x), daCo, false);
  r.bo.forEach((b) => bo.push({ i: qua[b.i].i, lyDo: b.lyDo }));
  return { giu: r.hopLe.map((y, j) => ({ i: qua[r.chiSo[j]].i, y: { ...y, kiem: qua[r.chiSo[j]].kiem } })), bo: bo.sort((a, b) => a.i - b.i) };
}
export {
  BAY_CHUNG,
  BIEU_TUONG,
  BO_CHIA_KHOA,
  CACH_BAN_KHAC,
  CAN_RONG,
  DA_CO_RONG,
  KHUON_HO_SO,
  LOAI_CO,
  SO_BAN_KHAC_TOI_DA,
  Y_DS_DU,
  Y_DS_MUC_TIEU,
  Y_DS_TRAN,
  bamCau,
  boCua,
  boHtml,
  cauGocTuKho,
  cauGocTuVao,
  cauTrongGoi,
  chuHtml,
  chuanChu2 as chuanChu,
  chuanDs,
  chuoiBam,
  chuoiDs4,
  coDapAnConLai,
  coTuXuNghi,
  dauSoLieu,
  dauVao,
  deHtml,
  docTraLoiMu,
  dungVaoMu,
  ghepHaiLuot,
  gonHoSo,
  khopMu,
  kiemBanKhac,
  kiemBanKhacMot,
  kiemBoTro,
  kiemHoSo,
  kiemYMoi,
  kiemYMoiMot,
  kieuBanCua,
  laHoSoSach,
  loaiCau,
  lopCua,
  nhanBanKhacNop,
  nhanYMoiNop,
  qidGocMaySoan,
  soTrongChu,
  tangCau,
  thieuBanKhac,
  tinhBieuThuc,
  tinhCan,
  tuXuCoDapAn,
  uuTienEmSai
};
