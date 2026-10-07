// src/lib/doc-so-phan-iii.ts
function docSoPhanIII(raw) {
  var s = String(raw == null ? "" : raw);
  var MU = {
    "\u2070": "0",
    "\xB9": "1",
    "\xB2": "2",
    "\xB3": "3",
    "\u2074": "4",
    "\u2075": "5",
    "\u2076": "6",
    "\u2077": "7",
    "\u2078": "8",
    "\u2079": "9",
    "\u207B": "-",
    "\u207A": "+"
  };
  s = s.replace(/10([\s\u00a0\u202f]*)([\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b]+)/g, function(_t, _k, m2) {
    var r = "10^";
    for (var i = 0; i < m2.length; i++) r += MU[m2.charAt(i)];
    return r;
  });
  if (s.normalize) s = s.normalize("NFKC");
  s = s.replace(/\\times/g, "\xD7").replace(/\\cdot/g, "\xB7");
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
  var m = new RegExp("^" + SO + "[x\xD7*\xB7\u22C5\u2219]" + MU10 + "(.*)$").exec(s) || new RegExp("^" + SO + "\\.10(?:\\^|\\*\\*)[({]?([+-]?\\d+)[)}]?(.*)$").exec(s) || new RegExp("^" + SO + "e([+-]?\\d+)(.*)$").exec(s);
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
  "\xB5m",
  "\u03BCm",
  "met",
  "m\xE9t",
  "m2",
  "m\xB2",
  "m3",
  "m\xB3",
  "cm2",
  "cm\xB2",
  "cm3",
  "cm\xB3",
  "dm3",
  "dm\xB3",
  "mm3",
  "mm\xB3",
  "km2",
  "km\xB2",
  "km3",
  "km\xB3",
  "ha",
  "cc",
  "l",
  "ml",
  "cl",
  "dl",
  "lit",
  "l\xEDt",
  "mililit",
  "milil\xEDt",
  // khối lượng
  "g",
  "kg",
  "mg",
  "hg",
  "dag",
  "t",
  "tan",
  "t\u1EA5n",
  "gam",
  "kilogam",
  // thời gian
  "s",
  "giay",
  "gi\xE2y",
  "phut",
  "ph\xFAt",
  "h",
  "gio",
  "gi\u1EDD",
  "ms",
  "min",
  // lượng chất / nồng độ
  "mol",
  "mmol",
  "kmol",
  "umol",
  "\xB5mol",
  "mol/l",
  "mol/lit",
  "mol/l\xEDt",
  "n",
  "kmol/m3",
  "kmol/m\xB3",
  "mol/kg",
  "m/mol",
  // khối lượng riêng / khối lượng mol
  "g/mol",
  "kg/mol",
  "g/ml",
  "g/cm3",
  "g/cm\xB3",
  "kg/m3",
  "kg/m\xB3",
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
  "\u03C9",
  "f",
  "\xB5f",
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
  "n/m\xB2",
  "n.m",
  // phần trăm / nhiệt độ / góc
  "%",
  "\u2030",
  "\xB0c",
  "\xB0k",
  "\xB0f",
  "do",
  "\u0111\u1ED9",
  "rad",
  "sr",
  // vận tốc / tốc độ biến thiên
  "m/s",
  "km/h",
  "m/s2",
  "m/s\xB2",
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
  "\u0111vc",
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
var CUM_HOI_MO = ["theo em", "v\xEC sao", "t\u1EA1i sao", "ph\u01B0\u01A1ng ph\xE1p n\xE0o", "c\xE1ch n\xE0o", "c\xE1ch g\xEC", "nh\u01B0 th\u1EBF n\xE0o"];
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
  if (!laDoiTuong(c)) return "kh\xF4ng ph\u1EA3i c\xE2u h\u1ECFi";
  const kieu = chuoi(lay(c, "kieu", "loai", "type", "loaiCau"));
  if (kieu && KIEU_TU_LUAN.test(kieu)) return "c\xE2u g\u1EAFn nh\xE3n t\u1EF1 lu\u1EADn";
  if (c.tuLuan === true || c.tu_luan === true) return "c\xE2u g\u1EAFn c\u1EDD t\u1EF1 lu\u1EADn (kho)";
  if (laMaDeTuLuan(chuoi(lay(c, "maDe", "ma_de"))) || laMaDeTuLuan(chuoi(lay(c, "qid", "id")))) return "m\xE3 \u0111\u1EC1 thu\u1ED9c m\u1EE5c d\u1EA1y h\u1ECDc / t\u1EF1 lu\u1EADn (-VD, -DT, -TL)";
  const phan = phanCua(c, phanMacDinh);
  if (phan === "khac") return "ph\u1EA7n c\u1EE7a c\xE2u kh\xF4ng ph\u1EA3i I, II, III (t\u1EF1 lu\u1EADn)";
  const text = chuoi(lay(c, "text", "de", "cauHoi", "noiDung"));
  const daRaw = lay(c, "correct", "dapAn", "dap_an", "dapAnDung");
  const chuaCoDapAn = c.chuaCoDapAn === true || laDoiTuong(c.caNhan) && c.caNhan.chuaCoDapAn === true;
  const coDapAn = daRaw !== void 0 && !chuaCoDapAn;
  const da = chuoiDapAn(daRaw);
  if (phan === "I") {
    const pa = lay(c, "choices", "pa", "luaChon", "phuongAn", "options");
    const coPa = c.choices !== void 0 || c.pa !== void 0 || c.luaChon !== void 0 || c.phuongAn !== void 0 || c.options !== void 0;
    if (coPa && demCoNoiDung(pa, lay(c, "choiceImgs", "anhLuaChon"), lay(c, "hinh", "hinhAnh"), "sau_pa_") < 4) return "ph\u1EA7n I thi\u1EBFu ph\u01B0\u01A1ng \xE1n (kh\xF4ng \u0111\u1EE7 4)";
    if (coDapAn && !/^[A-D]$/i.test(da.replace(/[.)\s]+$/, "").trim())) return "ph\u1EA7n I kh\xF4ng c\xF3 \u0111\xE1p \xE1n A\u2013D";
  } else if (phan === "II") {
    const y = lay(c, "ideas", "y", "cacY", "statements");
    const coY = c.ideas !== void 0 || c.y !== void 0 || c.cacY !== void 0 || c.statements !== void 0;
    if (coY && demCoNoiDung(y, lay(c, "ideaImgs", "anhY"), lay(c, "hinh", "hinhAnh"), "sau_y_") < 4) return "ph\u1EA7n II thi\u1EBFu \xFD (kh\xF4ng \u0111\u1EE7 4)";
    if (coDapAn && da.replace(/[^DSĐdsđ]/g, "").length !== 4) return "ph\u1EA7n II kh\xF4ng c\xF3 \u0111\xE1p \xE1n \u0111\xFAng/sai \u0111\u1EE7 4 \xFD";
  } else if (phan === "III") {
    if (coDapAn) {
      if (!da) return "ph\u1EA7n III kh\xF4ng c\xF3 \u0111\xE1p \xE1n \u0111\u1EC3 ch\u1EA5m t\u1EF1 \u0111\u1ED9ng";
      if (da.length > 20 && /\s/.test(da) || /[\n;→⇌:]/.test(da)) return "ph\u1EA7n III \u0111\xE1p \xE1n d\xE0i / nhi\u1EC1u d\xF2ng (t\u1EF1 lu\u1EADn)";
      if (laChuNhieuTu(da)) return "ph\u1EA7n III \u0111\xE1p \xE1n l\xE0 ch\u1EEF nhi\u1EC1u t\u1EEB (kh\xF4ng ph\u1EA3i s\u1ED1 hay m\xE3 ng\u1EAFn)";
      if (!laMotSoPhanIII(da)) return "ph\u1EA7n III \u0111\xE1p \xE1n kh\xF4ng ph\u1EA3i m\u1ED9t s\u1ED1 (c\xF4ng th\u1EE9c / ch\u1EEF / nhi\u1EC1u s\u1ED1) \u2014 kh\xF4ng ch\u1EA5m t\u1EF1 \u0111\u1ED9ng";
    }
    if (text && !(coDapAn && laMotSoPhanIII(da)) && hoiMo(text)) return "ph\u1EA7n III h\u1ECFi m\u1EDF (theo em / ph\u01B0\u01A1ng ph\xE1p n\xE0o / gi\u1EA3i th\xEDch / vi\u1EBFt c\xF4ng th\u1EE9c \u2026)";
  }
  return null;
}
function laCauTuLuan(c, phanMacDinh) {
  return lyDoTuLuan(c, phanMacDinh) !== null;
}
function laCauRutDuoc(c, phanMacDinh) {
  return lyDoTuLuan(c, phanMacDinh) === null;
}
function locCauRutDuoc(ds, phanMacDinh) {
  const giu = [];
  const bo = [];
  for (const c of ds) {
    const ly = lyDoTuLuan(c, phanMacDinh);
    if (ly === null) giu.push(c);
    else bo.push({ cau: c, lyDo: ly });
  }
  return { giu, bo };
}
function chuBaoBoTuLuan(soBo) {
  return soBo > 0 ? `\u0110\xE3 b\u1ECF ${soBo} c\xE2u t\u1EF1 lu\u1EADn (ch\u1EC9 r\xFAt c\xE2u tr\u1EAFc nghi\u1EC7m, \u0111\xFAng sai, tr\u1EA3 l\u1EDDi ng\u1EAFn)` : "";
}
function boTuLuanKhoiBanDe(b) {
  return { ...b, phanI: b.phanI.filter((q) => !laCauTuLuan(q, "I")), phanII: b.phanII.filter((q) => !laCauTuLuan(q, "II")), phanIII: b.phanIII.filter((q) => !laCauTuLuan(q, "III")) };
}
export {
  boTuLuanKhoiBanDe,
  chuBaoBoTuLuan,
  chuoiDapAn,
  laCauRutDuoc,
  laCauTuLuan,
  laMaDeTuLuan,
  laMotSoPhanIII,
  locCauRutDuoc,
  lyDoTuLuan
};
