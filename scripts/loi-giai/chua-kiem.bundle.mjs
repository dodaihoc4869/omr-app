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
var ChamInputError = class extends Error {
};
var ChamMaterialError = class extends Error {
  ma = "GRADING_MATERIAL_INVALID";
};
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
function bangNhau(a, b) {
  return a.tu * b.mau === b.tu * a.mau;
}
function lechNhoHon(a, b) {
  const hieu = a.tu * b.mau - b.tu * a.mau;
  const tuyetDoi = hieu < 0n ? -hieu : hieu;
  if (!(tuyetDoi * 10000n < a.mau * b.mau)) return false;
  const khoaTuyetDoi = b.tu < 0n ? -b.tu : b.tu;
  if (khoaTuyetDoi === 0n || khoaTuyetDoi * 100n >= b.mau) return true;
  return tuyetDoi * 100n < khoaTuyetDoi * a.mau;
}
function lamTron(gia, decimals) {
  const mu = 10n ** BigInt(decimals);
  const am = gia.tu < 0n;
  const duong = am ? -gia.tu : gia.tu;
  const moRong = duong * mu;
  const thuong = moRong / gia.mau;
  const du = moRong % gia.mau;
  const lam = du * 2n >= gia.mau ? thuong + 1n : thuong;
  return rutGon({ tu: am ? -lam : lam, mau: mu });
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
function donViTuongThich(a, b) {
  return !(a.unit && b.unit && a.unit !== b.unit);
}
function dinhTriKhoa(key) {
  const s = String(key ?? "");
  const m = /^(.*?)(?:\s*[x×*·⋅∙]\s*10|\.10(?=\s*[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]))\s*(?:\^|\*\*)?\s*[({]?\s*([+\-−⁻⁺]?[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)/.exec(s);
  if (!m || !m[1].trim()) return null;
  const mu = m[2].replace(/[⁻−]/g, "-").replace(/⁺/g, "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String("\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079".indexOf(c)));
  if (!/^[+-]?\d+$/.test(mu) || Number(mu) === 0) return null;
  return m[1].trim();
}
function coSoMuRieng(answer) {
  return /[x×*·⋅∙]\s*10|10\s*[\^⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]|\d\s*e\s*[+-]?\d/i.test(String(answer ?? ""));
}
function laChuoiKhongRong(v, ten) {
  if (typeof v !== "string" || v.length === 0) throw new ChamInputError(`${ten} ph\u1EA3i l\xE0 chu\u1ED7i kh\xF4ng r\u1ED7ng`);
  return v;
}
function parseChamInput(raw) {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new ChamInputError("chamTheoPolicy c\u1EA7n m\u1ED9t \u0111\u1ED1i t\u01B0\u1EE3ng");
  const o = raw;
  const policy = o.policy;
  if (typeof policy !== "string" || !THAM_SO_CHAM_CNH_1_0.policies.includes(policy)) {
    throw new ChamInputError(`policy kh\xF4ng n\u1EB1m trong CNH-1.0: ${String(policy)}`);
  }
  const key = laChuoiKhongRong(o.key, "key");
  const answer = laChuoiKhongRong(o.answer, "answer");
  if (o.policyVersion !== void 0 && o.policyVersion !== POLICY_VERSION) {
    throw new ChamInputError(`policyVersion kh\xF4ng kh\u1EDBp CNH-1.0: ${String(o.policyVersion)}`);
  }
  const out = { policy, key, answer };
  if (o.decimals !== void 0) {
    const d = o.decimals;
    if (typeof d !== "number" || !Number.isInteger(d) || d < 0 || d > THAM_SO_CHAM_CNH_1_0.soChuSoThapPhanToiDa) {
      throw new ChamInputError(`decimals ph\u1EA3i l\xE0 s\u1ED1 nguy\xEAn 0..${THAM_SO_CHAM_CNH_1_0.soChuSoThapPhanToiDa}`);
    }
    out.decimals = d;
  }
  if (o.requiredUnit !== void 0) out.requiredUnit = laChuoiKhongRong(o.requiredUnit, "requiredUnit");
  if (o.allowFraction !== void 0) {
    if (typeof o.allowFraction !== "boolean") throw new ChamInputError("allowFraction ph\u1EA3i l\xE0 boolean");
    out.allowFraction = o.allowFraction;
  }
  for (const ten of ["allowedConversions", "accepted"]) {
    const v = o[ten];
    if (v === void 0) continue;
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !x.length)) throw new ChamInputError(`${ten} ph\u1EA3i l\xE0 m\u1EA3ng chu\u1ED7i kh\xF4ng r\u1ED7ng`);
    out[ten] = v;
  }
  if (policy === "numeric-unit-v1" && !out.requiredUnit) throw new ChamInputError("numeric-unit-v1 c\u1EA7n requiredUnit");
  if (policy === "numeric-rounded-v1" && out.decimals === void 0) throw new ChamInputError("numeric-rounded-v1 c\u1EA7n decimals");
  return out;
}
function docKhoaSo(key, allowFraction) {
  const parsed = tachSoVaDonVi(chuanHoaSoNhap(key), allowFraction);
  if (!parsed.ok) throw new ChamMaterialError("\u0110\xE1p \xE1n s\u1ED1 ph\xEDa server kh\xF4ng \u0111\xFAng \u0111\u1ECBnh d\u1EA1ng c\u1EE7a ch\xEDnh s\xE1ch");
  return parsed.so;
}
function chamSoHoc(key, answer, allowFraction) {
  const k = docKhoaSo(key, allowFraction);
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  const pa = tachSoVaDonVi(a, allowFraction);
  if (!pa.ok) return { correct: false, error: "unsupported-format" };
  if (!donViTuongThich(pa.so, k)) return { correct: false };
  if (bangNhau(pa.so.gia, k.gia) || lechNhoHon(pa.so.gia, k.gia)) return { correct: true };
  const dinhTri = coSoMuRieng(answer) ? null : dinhTriKhoa(key);
  if (dinhTri !== null) {
    const dt = tachSoVaDonVi(chuanHoaSoNhap(dinhTri), allowFraction);
    if (dt.ok && (bangNhau(pa.so.gia, dt.so.gia) || lechNhoHon(pa.so.gia, dt.so.gia))) return { correct: true };
  }
  return { correct: false };
}
function chamLamTron(key, answer, decimals) {
  const k = docKhoaSo(key, false);
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  const pa = tachSoVaDonVi(a, false);
  if (!pa.ok) return { correct: false, error: "unsupported-format" };
  if (!donViTuongThich(pa.so, k)) return { correct: false };
  return { correct: bangNhau(lamTron(pa.so.gia, decimals), lamTron(k.gia, decimals)) };
}
function chamDonVi(key, answer, requiredUnit, allowedConversions) {
  const k = docKhoaSo(key, false);
  const dich = chuanHoaDonVi(requiredUnit);
  if (!DON_VI_DA_BIET.has(dich) || k.unit !== null && k.unit !== dich) {
    throw new ChamMaterialError("\u0110\u01A1n v\u1ECB c\u1EE7a \u0111\xE1p \xE1n server kh\xF4ng kh\u1EDBp ch\xEDnh s\xE1ch");
  }
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  const pa = tachSoVaDonVi(a, false);
  if (!pa.ok) return { correct: false, error: "unsupported-format" };
  const dungDonVi = pa.so.unit === dich || pa.so.unit !== null && allowedConversions.map(chuanHoaDonVi).includes(pa.so.unit);
  if (!dungDonVi) return { correct: false };
  return { correct: bangNhau(pa.so.gia, k.gia) || lechNhoHon(pa.so.gia, k.gia) };
}
function chamLiteral(key, answer, accepted) {
  const a = chuanHoaSoNhap(answer);
  if (!a) return { correct: false };
  if (a === chuanHoaSoNhap(key)) return { correct: true };
  for (const moi of accepted ?? []) {
    if (a === chuanHoaSoNhap(moi)) return { correct: true };
  }
  return { correct: false };
}
function chamTheoPolicy(raw) {
  const input = parseChamInput(raw);
  switch (input.policy) {
    case "numeric-value-v1":
      return chamSoHoc(input.key, input.answer, input.allowFraction === true);
    case "numeric-rounded-v1":
      return chamLamTron(input.key, input.answer, input.decimals);
    case "numeric-unit-v1":
      return chamDonVi(input.key, input.answer, input.requiredUnit, input.allowedConversions ?? []);
    case "literal-v1":
      return chamLiteral(input.key, input.answer, input.accepted);
  }
}
var POLICY_MAC_DINH_PHAN_III = "numeric-value-v1";

// src/lib/cham-so.ts
function soKhopSo(v, d, cheDo) {
  const a = chuanHoaSoNhap(v), b = chuanHoaSoNhap(d);
  if (!a || !b) return false;
  if (cheDo === "so_hoc") {
    try {
      return chamTheoPolicy({ policy: POLICY_MAC_DINH_PHAN_III, key: String(d ?? ""), answer: String(v ?? "") }).correct;
    } catch (e) {
      if (e instanceof ChamMaterialError) return false;
      throw e;
    }
  }
  const pa = tachSoVaDonVi(a, false), pb = tachSoVaDonVi(b, false);
  if (!pa.ok || !pb.ok) return false;
  if (pa.so.unit && pb.so.unit && pa.so.unit !== pb.so.unit) return false;
  if (pa.so.numText === pb.so.numText) return true;
  const dinhTri = coSoMuRieng(v) ? null : dinhTriKhoa(d);
  if (dinhTri === null) return false;
  const pdt = tachSoVaDonVi(chuanHoaSoNhap(dinhTri), false);
  return pdt.ok && pa.so.numText === pdt.so.numText;
}
var khopPhanIII = (cuaEm, dapAn) => soKhopSo(cuaEm, dapAn, "so_hoc");

// src/lib/tu-luyen.ts
var chuHoa = (v) => String(v ?? "").trim().toUpperCase();
function chuanDungSai(v) {
  return chuHoa(v).replace(/Đ/g, "D").replace(/[^DS-]/g, "");
}
function diemDungSai(yDung) {
  return yDung >= 4 ? 1 : yDung === 3 ? 0.5 : yDung === 2 ? 0.25 : yDung === 1 ? 0.1 : 0;
}
function chamCauTuLuyen(phan, dapAn, traLoi) {
  if (phan === "I") {
    const a = chuHoa(traLoi).replace(/[.)\s]+$/, "");
    const d = chuHoa(dapAn).replace(/[.)\s]+$/, "");
    const dung2 = /^[A-D]$/.test(a) && a === d;
    return { dung: dung2, diem: dung2 ? 1 : 0 };
  }
  if (phan === "II") {
    const d = chuanDungSai(dapAn), a = chuanDungSai(traLoi);
    let yDung = 0;
    for (let i = 0; i < 4; i++) if ((a[i] === "D" || a[i] === "S") && a[i] === d[i]) yDung++;
    return { dung: yDung === 4, diem: diemDungSai(yDung), yDung };
  }
  const dung = !!String(traLoi ?? "").trim() && khopPhanIII(traLoi, dapAn);
  return { dung, diem: dung ? 1 : 0 };
}
var GIO_VN = 7 * 36e5;

// server/src/chua-cau-sai-phien.ts
function dauNoiDung(p) {
  const n = p.noiDungTrucTiep;
  if (!n) return `${p.qid}@${p.phienBan}`;
  const chuan = (s) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
  return JSON.stringify([
    chuan(n.hoi),
    (n.luaChon ?? []).map((x) => chuan(x.noi)).sort(),
    (n.y ?? []).map(chuan).sort(),
    n.bang ?? [],
    (n.hinhAnh ?? []).map((x) => x.src).sort()
  ]);
}
function chamProbe(p, tra) {
  const n = p.noiDungTrucTiep;
  if (!n) return false;
  if (n.kieu === "so") return khopPhanIII(tra, n.dapAn);
  if (n.kieu === "ds")
    return n.y?.length === 4 ? chamCauTuLuyen("II", n.dapAn, tra).dung : chuanDungSai(tra) !== "" && chuanDungSai(tra) === chuanDungSai(n.dapAn);
  if (n.kieu === "chon" || n.kieu === "chon_ly_do")
    return /^[A-D]$/i.test(n.dapAn) ? chamCauTuLuyen("I", n.dapAn, tra).dung : tra.trim().toUpperCase() === n.dapAn.trim().toUpperCase();
  return false;
}

// server/src/chua-cau-sai-hoc-lieu.ts
function tatCaProbe(h) {
  return [
    ...h.buoc.flatMap((b) => [
      ...b.chanDoan,
      ...b.phanBiet,
      ...b.kiemLai,
      ...b.hieuBuoc?.kiemLyDo ?? [],
      ...b.hieuBuoc?.chuyenGiao ?? [],
      ...b.hieuBuoc?.doiChieu.map((d) => d.probeXacNhan) ?? []
    ]),
    ...h.banGhepBai,
    ...h.banKiemChung
  ];
}
function kiemTinhDayDu(v) {
  const loi = [], loiTrung = [], h = v;
  const chu = (x) => typeof x === "string" && !!x.trim() && x.length <= 2e4;
  const mangChu = (x) => Array.isArray(x) && x.length <= 80 && x.every(chu);
  const mang = (x) => Array.isArray(x) && x.length <= 40;
  if (!h || h.schemaVersion !== 1 || !chu(h.qidGoc) || h.qidGoc.length > 120 || !chu(h.contentVersion) || !Array.isArray(h.buoc) || h.buoc.length < 1 || h.buoc.length > 8 || !mang(h.banGhepBai) || !mang(h.banKiemChung))
    return ["hoc_lieu_sai_cau_truc"];
  for (const b of h.buoc) {
    if (!b || !chu(b.id) || !chu(b.tieuDe) || !mangChu(b.tienQuyet) || !mangChu(b.viKyNang) || ![b.chanDoan, b.phanBiet, b.kiemLai, b.hoTro, b.loiThuongGap].every(mang))
      return ["buoc_sai_cau_truc"];
    if (!b.hoTro.every((x) => x && [1, 2, 3].includes(x.muc) && chu(x.noiDung)))
      return ["ho_tro_sai_cau_truc"];
    const hb = b.hieuBuoc;
    if (hb && (!mang(hb.doiChieu) || !mang(hb.kiemLyDo) || !mang(hb.chuyenGiao) || !hb.doiChieu.every((d) => d && d.probeXacNhan)))
      return ["hieu_buoc_sai_cau_truc"];
  }
  const ids = /* @__PURE__ */ new Set();
  const day = (x) => Array.isArray(x) && x.length > 0;
  for (const [i, b] of h.buoc.entries()) {
    if (!b || !b.id || ids.has(b.id) || b.thuTu !== i || !Array.isArray(b.tienQuyet) || b.tienQuyet.some((x) => !ids.has(x)))
      loi.push(`buoc_${i}_thu_tu_tien_quyet`);
    ids.add(b?.id);
    if (!day(b?.viKyNang) || !day(b?.chanDoan) || !day(b?.kiemLai) || !Array.isArray(b?.phanBiet) || !Array.isArray(b?.loiThuongGap))
      loi.push(`buoc_${i}_thieu_probe`);
    const hb = b?.hieuBuoc;
    if (!hb || ![
      hb.mucTieu,
      hb.yNghiaDaiLuong,
      hb.viSaoCanBuoc,
      hb.dieuKienApDung,
      hb.noiVoiBuocSau
    ].every((x) => typeof x === "string" && x.trim()) || !Array.isArray(hb.doiChieu) || !day(hb.kiemLyDo) || !day(hb.chuyenGiao))
      loi.push(`buoc_${i}_thieu_hieu_buoc`);
    if ((hb?.kiemLyDo?.length ?? 0) < 2 || (hb?.chuyenGiao?.length ?? 0) < 2 || (b?.kiemLai?.length ?? 0) < 2)
      loi.push(`buoc_${i}_thieu_ban_moi_de_thu_lai`);
    if (![1, 2, 3].every(
      (m) => b?.hoTro?.some((x) => x.muc === m && x.noiDung.trim())
    ))
      loi.push(`buoc_${i}_thieu_ho_tro`);
    if (!day(b?.phanBiet) && !hb?.doiChieu?.length)
      loi.push(`buoc_${i}_thieu_phan_biet`);
  }
  if (h.banGhepBai.length < 2 || h.banKiemChung.length < 2)
    loi.push("thieu_ban_toan_bai");
  if (loi.length) return loi;
  const refs = /* @__PURE__ */ new Map(), noiDungDaCo = /* @__PURE__ */ new Map(), doiChieuDaDung = /* @__PURE__ */ new Set();
  const cacProbe = [
    ...h.buoc.flatMap((b) => [
      ...[...b.chanDoan, ...b.phanBiet, ...b.kiemLai, ...b.hieuBuoc.kiemLyDo, ...b.hieuBuoc.chuyenGiao].map((p) => ({ p, laDoiChieu: false })),
      ...b.hieuBuoc.doiChieu.map((d) => ({ p: d.probeXacNhan, laDoiChieu: true }))
    ]),
    ...[...h.banGhepBai, ...h.banKiemChung].map((p) => ({ p, laDoiChieu: false }))
  ];
  for (const { p, laDoiChieu } of cacProbe) {
    if (!p || !chu(p.qid) || p.qid.length > 120 || !chu(p.phienBan) || !mangChu(p.kyNang) || !p.kyNang.length || !["I", "II", "III"].includes(p.phan) || p.dapAnSai !== void 0 && !mangChu(p.dapAnSai)) {
      loi.push("probe_sai_cau_truc");
      continue;
    }
    const n = p.noiDungTrucTiep;
    if (!n || !chu(n.hoi) || !chu(n.dapAn) || !["so", "chon", "chon_ly_do", "ds"].includes(n.kieu)) {
      loi.push(`probe_${p.qid}_chua_co_noi_dung_cham`);
      continue;
    }
    if (n.kieu === "chon" || n.kieu === "chon_ly_do") {
      if (!Array.isArray(n.luaChon) || n.luaChon.length < 2 || n.luaChon.length > 6 || !n.luaChon.every(
        (x) => x && chu(x.ky) && /^[A-F]$/.test(x.ky) && chu(x.noi)
      ) || new Set(n.luaChon.map((x) => x?.ky)).size !== n.luaChon.length || !n.luaChon.some((x) => x?.ky === n.dapAn.toUpperCase()))
        loi.push(`probe_${p.qid}_lua_chon`);
    }
    if (n.y !== void 0 && !mangChu(n.y) || n.bang !== void 0 && (!Array.isArray(n.bang) || n.bang.length > 100 || !n.bang.every((r) => mangChu(r))))
      loi.push(`probe_${p.qid}_media_sai_cau_truc`);
    if (n.hinhAnh !== void 0 && (!Array.isArray(n.hinhAnh) || n.hinhAnh.length > 8 || !n.hinhAnh.every(
      (x) => x && chu(x.alt) && chu(x.src) && /^(https:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp);base64,)/.test(
        x.src
      ) && x.viTri !== "sau_loi_giai"
    )))
      loi.push(`probe_${p.qid}_hinh_sai_cau_truc`);
    if (n.kieu === "ds" && !/^[DS]{1}$|^[DS]{4}$/i.test(n.dapAn))
      loi.push(`probe_${p.qid}_ds`);
    if (n.kieu === "ds" && n.dapAn.length === 4 && n.y?.length !== 4)
      loi.push(`probe_${p.qid}_thieu_4_y`);
    if (n.kieu === "ds" && n.dapAn.length === 1 && n.y?.length)
      loi.push(`probe_${p.qid}_ds_mau_thuan`);
    if (!chamProbe(p, n.dapAn))
      loi.push(`probe_${p.qid}_dap_an_khong_cham_duoc`);
    const key = `${p.qid}@${p.phienBan}`, noiRaw = JSON.stringify(n), noi = dauNoiDung(p), aliasHopLe = laDoiChieu && !doiChieuDaDung.has(key) && refs.get(key) === noiRaw;
    if (refs.has(key) && !aliasHopLe) loiTrung.push(`probe_${p.qid}_ref_trung`);
    else if (!refs.has(key)) refs.set(key, noiRaw);
    if (noiDungDaCo.has(noi) && !(aliasHopLe && noiDungDaCo.get(noi) === key))
      loiTrung.push(`probe_${p.qid}_noi_dung_trung`);
    else if (!noiDungDaCo.has(noi)) noiDungDaCo.set(noi, key);
    if (laDoiChieu && refs.has(key)) doiChieuDaDung.add(key);
  }
  if (loi.length) return [...new Set(loi)];
  const cauNho = h.buoc.flatMap((b) => [
    ...b.chanDoan,
    ...b.phanBiet,
    ...b.kiemLai,
    ...b.hieuBuoc.kiemLyDo,
    ...b.hieuBuoc.chuyenGiao,
    ...b.hieuBuoc.doiChieu.map((x) => x.probeXacNhan)
  ]);
  const nho = new Set(cauNho.map(dauNoiDung)), ghep = new Set(h.banGhepBai.map(dauNoiDung));
  const kyNang = [...new Set(h.buoc.flatMap((b) => b.viKyNang))];
  for (const p of [...h.banGhepBai, ...h.banKiemChung]) {
    if (!p.laTuongDuong || kyNang.some((k) => !p.kyNang.includes(k)) || nho.has(dauNoiDung(p)))
      loi.push("ban_toan_bai_chua_tuong_duong");
  }
  if (h.banKiemChung.some((p) => ghep.has(dauNoiDung(p))))
    loi.push("ban_kiem_trung_ban_ghep");
  for (const b of h.buoc) {
    if (b.hieuBuoc.kiemLyDo.some((p) => p.noiDungTrucTiep?.kieu !== "chon_ly_do"))
      loi.push(`buoc_${b.id}_ly_do_chua_kiem_cach_hieu`);
    const truoc = new Set(
      [
        ...b.chanDoan,
        ...b.phanBiet,
        ...b.kiemLai,
        ...b.hieuBuoc.doiChieu.map((d) => d.probeXacNhan)
      ].map(dauNoiDung)
    );
    if (b.hieuBuoc.chuyenGiao.some((p) => truoc.has(dauNoiDung(p))))
      loi.push(`buoc_${b.id}_chuyen_giao_khong_moi`);
    for (const d of b.hieuBuoc.doiChieu)
      if (!d.probeXacNhan.dapAnSai?.length || ![d.maLoi, d.cachNghiCu, d.diemLech, d.heQua, d.cachDung].every(
        (x) => typeof x === "string" && x.trim()
      ))
        loi.push(`buoc_${b.id}_gia_thuyet_chua_kiem`);
  }
  return [.../* @__PURE__ */ new Set([...loi, ...loiTrung])];
}

// server/src/chua-hoc-lieu-kiem-may.ts
function deChoKiemMu(p) {
  const n = p.noiDungTrucTiep;
  return {
    qid: p.qid,
    phienBan: p.phienBan,
    phan: p.phan,
    noiDung: {
      hoi: n.hoi,
      kieu: n.kieu,
      ...n.luaChon ? { luaChon: n.luaChon } : {},
      ...n.y ? { y: n.y } : {},
      ...n.bang ? { bang: n.bang } : {},
      ...n.hinhAnh ? { hinhAnh: n.hinhAnh } : {},
      ...n.donVi ? { donVi: n.donVi } : {}
    }
  };
}
async function bamDeMu(p) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(deChoKiemMu(p))));
  return [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function probeDuyNhat(h) {
  return [...new Map(tatCaProbe(h).map((p) => [`${p.qid}@${p.phienBan}`, p])).values()];
}
async function kiemBangMay(h, v) {
  const errors = kiemTinhDayDu(h);
  if (errors.length) return errors;
  const b = v;
  if (!b || b.phienBan !== 1 || typeof b.luotSoan !== "string" || typeof b.luotKiem !== "string" || b.luotSoan.length < 8 || b.luotKiem.length < 8 || b.luotSoan === b.luotKiem || !Array.isArray(b.tra) || b.tra.length > 2e3)
    return ["thieu_hai_luot_kiem"];
  const c = b.chuyenMon;
  if (!c || c.dungKhoaHoc !== true || c.tuongDuong !== true || c.dungDoKho !== true || c.duBuoc !== true || typeof c.lyDo !== "string" || c.lyDo.trim().length < 30) errors.push("chua_qua_kiem_chuyen_mon");
  const rows = /* @__PURE__ */ new Map();
  for (const x of b.tra) {
    if (!x || typeof x.qid !== "string" || typeof x.phienBan !== "string" || typeof x.dapAn !== "string" || typeof x.lyDo !== "string" || x.lyDo.trim().length < 15 || x.chac !== true || !/^[a-f0-9]{64}$/.test(x.bamDe ?? "")) {
      errors.push("kiem_mu_thieu_ly_do_hoac_chua_chac");
      continue;
    }
    const key = `${x.qid}@${x.phienBan}`;
    if (rows.has(key)) errors.push("kiem_mu_trung_muc");
    rows.set(key, x);
  }
  const ps = probeDuyNhat(h);
  if (rows.size !== ps.length) errors.push("kiem_mu_thieu_hoac_thua_muc");
  for (const p of ps) {
    const r = rows.get(`${p.qid}@${p.phienBan}`);
    if (!r || r.bamDe !== await bamDeMu(p)) errors.push("kiem_mu_lech_de");
    else if (!chamProbe(p, r.dapAn)) errors.push("hai_luot_lech_dap_an");
  }
  return [...new Set(errors)];
}
export {
  deChoKiemMu,
  kiemBangMay,
  kiemTinhDayDu,
  probeDuyNhat
};
