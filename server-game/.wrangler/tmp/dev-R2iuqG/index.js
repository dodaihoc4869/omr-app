var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../src/game/giai-cuu-cong-chua/cau-hinh.ts
var CAU_HINH = {
  SO_NGUOI_TOI_DA: 12,
  SO_NGUOI_TOI_THIEU: 1,
  NHIP_MAY_CHU_HZ: 20,
  TOC_DO_CHAY: 240,
  TOC_DO_NHAY: 560,
  TRONG_LUC: 1800,
  GIAY_NHAY_SOM: 0.12,
  // bấm sớm trước khi chạm đất vẫn ăn
  GIAY_NHAY_MUON: 0.1,
  // vừa rơi khỏi mép vẫn nhảy được
  SO_LAN_NHAY: 2,
  CAO_VUNG_DAU: 18,
  TOC_DO_ROI_TOI_THIEU: 120,
  NAY_SAU_DAM: 620,
  GIAY_BAT_TU_SAU_MAT_MANG: 1.4,
  SO_MANG: 3,
  DOI_CHAT_KHI_MAT_MANG: true,
  GIAY_CHON_LAI_CHAT: 6,
  CAM_TRUNG_HOA_CHAT: true,
  GIAY_KHONG_LO: 10,
  // thầy chốt: ăn hoa thì khổng lồ 10 giây
  GIAY_HIEN_PHUONG_TRINH: 1.6,
  HIEN_CANH_BAO_KHAC_CHE: true,
  GIAY_CANH_MO_DAU: 6.5,
  CHI_NGUOI_CUOI_CUNG_GAP_RONG: true,
  // thầy chốt 14-09
  MAU_RONG: 3,
  GIAY_PHUN_LUA: 1.2,
  GIAY_HO_SAU_DAP: 1.5,
  SO_LAN_COT_DA_CHIU: 3,
  BOT_GIAY_PHAN_XA: 0.32,
  BOT_DO_CHINH_XAC: 0.62,
  CAO_NHAN_VAT: 100,
  RONG_NHAN_VAT: 46,
  DAI_DAO: 7200,
  // đơn vị logic từ đầu đảo tới cửa hang
  FPS_MUC_TIEU: 60
};

// ../src/game/giai-cuu-cong-chua/hoa-chat.ts
var HOA_CHAT = [
  { ct: "HCl", mau: "#12B5CB", vai: "axit", cation: "H", anion: "Cl" },
  { ct: "H\u2082SO\u2084", mau: "#C79A2E", vai: "axit", cation: "H", anion: "SO4" },
  { ct: "NaOH", mau: "#4F6BED", vai: "kiem", cation: "Na", anion: "OH" },
  { ct: "Ca(OH)\u2082", mau: "#EDF2F8", vai: "kiem", cation: "Ca", anion: "OH" },
  { ct: "Ba(OH)\u2082", mau: "#A9BEF2", vai: "kiem", cation: "Ba", anion: "OH" },
  { ct: "Na\u2082CO\u2083", mau: "#5FD0B6", vai: "muoi", cation: "Na", anion: "CO3" },
  { ct: "CuSO\u2084", mau: "#1E7FD4", vai: "muoi", cation: "Cu", anion: "SO4" },
  // xanh lam — màu thật
  { ct: "AgNO\u2083", mau: "#CFC7DE", vai: "muoi", cation: "Ag", anion: "NO3" },
  { ct: "Al", mau: "#BFC7D0", vai: "kimLoai", cation: null, anion: null },
  { ct: "Zn", mau: "#7E93A8", vai: "kimLoai", cation: null, anion: null },
  { ct: "FeCl\u2083", mau: "#C86A2E", vai: "muoi", cation: "Fe3", anion: "Cl" },
  // vàng nâu — màu thật
  { ct: "Cl\u2082", mau: "#B8D62B", vai: "oxh", cation: null, anion: null }
  // vàng lục — màu thật
];
var SO_HOA_CHAT = HOA_CHAT.length;
var DAY_HOAT_DONG = ["K", "Na", "Ca", "Mg", "Al", "Zn", "Fe", "Cu", "Ag"];
var TRUOC_HIDRO = /* @__PURE__ */ new Set(["Al", "Zn"]);
var LUONG_TINH = /* @__PURE__ */ new Set(["Al", "Zn"]);
var KIM_LOAI_TRONG_MUOI = {
  "CuSO\u2084": "Cu",
  "AgNO\u2083": "Ag",
  "FeCl\u2083": "Fe"
};
var KET_TUA = /* @__PURE__ */ new Set([
  "Ag|Cl",
  "Ag|OH",
  "Ag|CO3",
  "Ba|SO4",
  "Ba|CO3",
  "Ca|SO4",
  "Ca|CO3",
  "Cu|OH",
  "Cu|CO3",
  "Fe3|OH"
]);
function laKetTua(cation, anion) {
  if (cation === null || anion === null) return false;
  return KET_TUA.has(cation + "|" + anion);
}
__name(laKetTua, "laKetTua");

// ../src/game/giai-cuu-cong-chua/bang-khac-che.ts
var TEN_LUAT = {
  L1: "kim lo\u1EA1i tr\u01B0\u1EDBc H \u0111\u1EA9y hi\u0111ro kh\u1ECFi axit",
  L2: "kim lo\u1EA1i m\u1EA1nh \u0111\u1EA9y kim lo\u1EA1i y\u1EBFu kh\u1ECFi mu\u1ED1i",
  L3: "clo oxi ho\xE1 kim lo\u1EA1i",
  L4: "ai b\u1ECB k\u1EBFt t\u1EE7a th\xEC m\u1EA5t m\u1EA1ng",
  L5: "ki\u1EC1m h\u1EA5p th\u1EE5 kh\xED clo",
  L6: "ki\u1EC1m ho\xE0 tan kim lo\u1EA1i l\u01B0\u1EE1ng t\xEDnh",
  L7: "axit g\u1EB7p baz\u01A1 \u2014 kh\xF4ng b\xEAn n\xE0o m\u1EA1nh h\u01A1n",
  L8: "axit m\u1EA1nh \u0111\u1EA9y kh\xED CO\u2082 kh\u1ECFi mu\u1ED1i cacbonat",
  "\u2014": "kh\xF4ng ph\u1EA3n \u1EE9ng \u1EDF \u0111i\u1EC1u ki\u1EC7n th\u01B0\u1EDDng"
};
var PHUONG_TRINH = {
  // ——— L7 trung hoà
  "HCl+NaOH": "HCl + NaOH \u2192 NaCl + H\u2082O",
  "HCl+Ca(OH)\u2082": "2HCl + Ca(OH)\u2082 \u2192 CaCl\u2082 + 2H\u2082O",
  "HCl+Ba(OH)\u2082": "2HCl + Ba(OH)\u2082 \u2192 BaCl\u2082 + 2H\u2082O",
  "H\u2082SO\u2084+NaOH": "H\u2082SO\u2084 + 2NaOH \u2192 Na\u2082SO\u2084 + 2H\u2082O",
  "H\u2082SO\u2084+Ca(OH)\u2082": "H\u2082SO\u2084 + Ca(OH)\u2082 \u2192 CaSO\u2084\u2193 + 2H\u2082O",
  "H\u2082SO\u2084+Ba(OH)\u2082": "H\u2082SO\u2084 + Ba(OH)\u2082 \u2192 BaSO\u2084\u2193 + 2H\u2082O",
  "Ca(OH)\u2082+CuSO\u2084": "Ca(OH)\u2082 + CuSO\u2084 \u2192 CaSO\u2084\u2193 + Cu(OH)\u2082\u2193",
  "Ba(OH)\u2082+CuSO\u2084": "Ba(OH)\u2082 + CuSO\u2084 \u2192 BaSO\u2084\u2193 + Cu(OH)\u2082\u2193",
  // ——— L8 axit đẩy CO₂ khỏi cacbonat
  "HCl+Na\u2082CO\u2083": "2HCl + Na\u2082CO\u2083 \u2192 2NaCl + CO\u2082\u2191 + H\u2082O",
  "H\u2082SO\u2084+Na\u2082CO\u2083": "H\u2082SO\u2084 + Na\u2082CO\u2083 \u2192 Na\u2082SO\u2084 + CO\u2082\u2191 + H\u2082O",
  // ——— L4 ai bị kết tủa thì mất mạng
  "HCl+AgNO\u2083": "HCl + AgNO\u2083 \u2192 AgCl\u2193 + HNO\u2083",
  "NaOH+CuSO\u2084": "2NaOH + CuSO\u2084 \u2192 Cu(OH)\u2082\u2193 + Na\u2082SO\u2084",
  "NaOH+AgNO\u2083": "2NaOH + 2AgNO\u2083 \u2192 Ag\u2082O\u2193 + 2NaNO\u2083 + H\u2082O",
  "NaOH+FeCl\u2083": "3NaOH + FeCl\u2083 \u2192 Fe(OH)\u2083\u2193 + 3NaCl",
  "Ca(OH)\u2082+Na\u2082CO\u2083": "Ca(OH)\u2082 + Na\u2082CO\u2083 \u2192 CaCO\u2083\u2193 + 2NaOH",
  "Ca(OH)\u2082+AgNO\u2083": "Ca(OH)\u2082 + 2AgNO\u2083 \u2192 Ag\u2082O\u2193 + Ca(NO\u2083)\u2082 + H\u2082O",
  "Ca(OH)\u2082+FeCl\u2083": "3Ca(OH)\u2082 + 2FeCl\u2083 \u2192 2Fe(OH)\u2083\u2193 + 3CaCl\u2082",
  "Ba(OH)\u2082+Na\u2082CO\u2083": "Ba(OH)\u2082 + Na\u2082CO\u2083 \u2192 BaCO\u2083\u2193 + 2NaOH",
  "Ba(OH)\u2082+AgNO\u2083": "Ba(OH)\u2082 + 2AgNO\u2083 \u2192 Ag\u2082O\u2193 + Ba(NO\u2083)\u2082 + H\u2082O",
  "Ba(OH)\u2082+FeCl\u2083": "3Ba(OH)\u2082 + 2FeCl\u2083 \u2192 2Fe(OH)\u2083\u2193 + 3BaCl\u2082",
  "Na\u2082CO\u2083+CuSO\u2084": "Na\u2082CO\u2083 + CuSO\u2084 \u2192 CuCO\u2083\u2193 + Na\u2082SO\u2084",
  "Na\u2082CO\u2083+AgNO\u2083": "Na\u2082CO\u2083 + 2AgNO\u2083 \u2192 Ag\u2082CO\u2083\u2193 + 2NaNO\u2083",
  "AgNO\u2083+FeCl\u2083": "3AgNO\u2083 + FeCl\u2083 \u2192 3AgCl\u2193 + Fe(NO\u2083)\u2083",
  // ——— L1 kim loại đẩy hiđro khỏi axit
  "HCl+Al": "2Al + 6HCl \u2192 2AlCl\u2083 + 3H\u2082\u2191",
  "HCl+Zn": "Zn + 2HCl \u2192 ZnCl\u2082 + H\u2082\u2191",
  "H\u2082SO\u2084+Al": "2Al + 3H\u2082SO\u2084 \u2192 Al\u2082(SO\u2084)\u2083 + 3H\u2082\u2191",
  "H\u2082SO\u2084+Zn": "Zn + H\u2082SO\u2084 \u2192 ZnSO\u2084 + H\u2082\u2191",
  // ——— L6 kiềm hoà tan kim loại lưỡng tính
  "NaOH+Al": "2Al + 2NaOH + 6H\u2082O \u2192 2Na[Al(OH)\u2084] + 3H\u2082\u2191",
  "NaOH+Zn": "Zn + 2NaOH + 2H\u2082O \u2192 Na\u2082[Zn(OH)\u2084] + H\u2082\u2191",
  "Ca(OH)\u2082+Al": "2Al + Ca(OH)\u2082 + 6H\u2082O \u2192 Ca[Al(OH)\u2084]\u2082 + 3H\u2082\u2191",
  "Ca(OH)\u2082+Zn": "Zn + Ca(OH)\u2082 + 2H\u2082O \u2192 Ca[Zn(OH)\u2084] + H\u2082\u2191",
  "Ba(OH)\u2082+Al": "2Al + Ba(OH)\u2082 + 6H\u2082O \u2192 Ba[Al(OH)\u2084]\u2082 + 3H\u2082\u2191",
  "Ba(OH)\u2082+Zn": "Zn + Ba(OH)\u2082 + 2H\u2082O \u2192 Ba[Zn(OH)\u2084] + H\u2082\u2191",
  // ——— L5 kiềm hấp thụ khí clo
  "NaOH+Cl\u2082": "Cl\u2082 + 2NaOH \u2192 NaCl + NaClO + H\u2082O",
  "Ca(OH)\u2082+Cl\u2082": "Cl\u2082 + Ca(OH)\u2082 \u2192 CaOCl\u2082 + H\u2082O",
  "Ba(OH)\u2082+Cl\u2082": "2Cl\u2082 + 2Ba(OH)\u2082 \u2192 Ba(ClO)\u2082 + BaCl\u2082 + 2H\u2082O",
  // ——— L2 kim loại mạnh đẩy kim loại yếu khỏi muối
  "CuSO\u2084+Al": "2Al + 3CuSO\u2084 \u2192 Al\u2082(SO\u2084)\u2083 + 3Cu\u2193",
  "CuSO\u2084+Zn": "Zn + CuSO\u2084 \u2192 ZnSO\u2084 + Cu\u2193",
  "AgNO\u2083+Al": "Al + 3AgNO\u2083 \u2192 Al(NO\u2083)\u2083 + 3Ag\u2193",
  "AgNO\u2083+Zn": "Zn + 2AgNO\u2083 \u2192 Zn(NO\u2083)\u2082 + 2Ag\u2193",
  "Al+FeCl\u2083": "Al + FeCl\u2083 \u2192 AlCl\u2083 + Fe\u2193",
  "Zn+FeCl\u2083": "3Zn + 2FeCl\u2083 \u2192 3ZnCl\u2082 + 2Fe\u2193",
  // ——— L3 clo oxi hoá kim loại
  "Al+Cl\u2082": "2Al + 3Cl\u2082 \u2192 2AlCl\u2083",
  "Zn+Cl\u2082": "Zn + Cl\u2082 \u2192 ZnCl\u2082"
};
function khoaCap(a, b) {
  const ia = HOA_CHAT.findIndex((h) => h.ct === a);
  const ib = HOA_CHAT.findIndex((h) => h.ct === b);
  return ia <= ib ? a + "+" + b : b + "+" + a;
}
__name(khoaCap, "khoaCap");
function ra(loai, thang, luat, a, b) {
  return {
    loai,
    thang,
    luat,
    tieuChi: TEN_LUAT[luat],
    pt: loai === "khongPhanUng" ? "" : PHUONG_TRINH[khoaCap(a, b)] ?? ""
  };
}
__name(ra, "ra");
var TRO = {
  loai: "khongPhanUng",
  thang: null,
  luat: "\u2014",
  tieuChi: TEN_LUAT["\u2014"],
  pt: ""
};
function xuLyHoaChat(ctA, ctB) {
  if (ctA === ctB) return TRO;
  const A = HOA_CHAT.find((h) => h.ct === ctA);
  const B = HOA_CHAT.find((h) => h.ct === ctB);
  if (!A || !B) return TRO;
  const kl = A.vai === "kimLoai" ? A : B.vai === "kimLoai" ? B : null;
  const kia = kl === null ? null : kl === A ? B : A;
  if (kl && kia && kia.vai === "axit") {
    if (TRUOC_HIDRO.has(kl.ct)) return ra("khacChe", kl.ct, "L1", ctA, ctB);
    return TRO;
  }
  if (kl && kia && KIM_LOAI_TRONG_MUOI[kia.ct] !== void 0) {
    const yeu = KIM_LOAI_TRONG_MUOI[kia.ct];
    const iManh = DAY_HOAT_DONG.indexOf(kl.ct);
    const iYeu = DAY_HOAT_DONG.indexOf(yeu);
    if (iManh >= 0 && iYeu >= 0 && iManh < iYeu) return ra("khacChe", kl.ct, "L2", ctA, ctB);
    return TRO;
  }
  if (kl && kia && kia.vai === "oxh") return ra("khacChe", kia.ct, "L3", ctA, ctB);
  if (kl && kia && kia.vai === "kiem" && LUONG_TINH.has(kl.ct)) {
    return ra("khacChe", kia.ct, "L6", ctA, ctB);
  }
  if (kl) return TRO;
  if (A.vai === "oxh" && B.vai === "kiem") return ra("khacChe", B.ct, "L5", ctA, ctB);
  if (B.vai === "oxh" && A.vai === "kiem") return ra("khacChe", A.ct, "L5", ctA, ctB);
  if (A.vai === "oxh" || B.vai === "oxh") return TRO;
  if (A.vai === "axit" && B.vai === "kiem" || B.vai === "axit" && A.vai === "kiem") {
    return ra("trungHoa", null, "L7", ctA, ctB);
  }
  if (A.vai === "axit" && B.anion === "CO3") return ra("khacChe", A.ct, "L8", ctA, ctB);
  if (B.vai === "axit" && A.anion === "CO3") return ra("khacChe", B.ct, "L8", ctA, ctB);
  const tuaA = laKetTua(A.cation, B.anion);
  const tuaB = laKetTua(B.cation, A.anion);
  if (tuaA && tuaB) return ra("trungHoa", null, "L4", ctA, ctB);
  if (tuaA) return ra("khacChe", B.ct, "L4", ctA, ctB);
  if (tuaB) return ra("khacChe", A.ct, "L4", ctA, ctB);
  return TRO;
}
__name(xuLyHoaChat, "xuLyHoaChat");
function biKhacChe(ctMinh, ctHo) {
  const kq = xuLyHoaChat(ctMinh, ctHo);
  return kq.loai === "khacChe" && kq.thang === ctHo;
}
__name(biKhacChe, "biKhacChe");

// ../src/game/giai-cuu-cong-chua/man-choi.ts
function boSinh(hat) {
  let a = hat >>> 0;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
__name(boSinh, "boSinh");
var CAO_BAC = [120, 190, 260];
function sinhDao(hat) {
  const r = boSinh(hat);
  const dai = CAU_HINH.DAI_DAO;
  const soO = 40;
  const rongO = dai / soO;
  const vuc = [];
  const bac = [];
  let vucTruoc = false;
  for (let i = 4; i < soO - 3; i++) {
    const x0 = i * rongO;
    const coVuc = !vucTruoc && r() < 0.3;
    if (coVuc) {
      const rongVuc = 90 + r() * 60;
      const xv = x0 + (rongO - rongVuc) / 2;
      vuc.push({ x1: xv, x2: xv + rongVuc });
      bac.push({ x: xv + rongVuc / 2 - 60, y: CAO_BAC[0], rong: 120 });
      vucTruoc = true;
    } else {
      vucTruoc = false;
      const soBac = r() < 0.45 ? 1 : r() < 0.8 ? 2 : 0;
      for (let k = 0; k < soBac; k++) {
        const cao = CAO_BAC[Math.floor(r() * CAO_BAC.length)];
        const rong = 100 + r() * 110;
        bac.push({ x: x0 + r() * (rongO - rong), y: cao, rong });
      }
    }
  }
  const choTha = [];
  for (let i = 0; i < CAU_HINH.SO_NGUOI_TOI_DA; i++) {
    choTha.push(120 + i * 52);
  }
  return { hat, dai, vuc, bac, xHang: dai - 260, choTha };
}
__name(sinhDao, "sinhDao");
function coDat(dao, x) {
  if (x < 0 || x > dao.dai) return false;
  for (const v of dao.vuc) if (x > v.x1 && x < v.x2) return false;
  return true;
}
__name(coDat, "coDat");
function sanDuoi(dao, x, yChan) {
  let tot = coDat(dao, x) ? 0 : null;
  for (const b of dao.bac) {
    if (x < b.x || x > b.x + b.rong) continue;
    if (b.y <= yChan + 1 && (tot === null || b.y > tot)) tot = b.y;
  }
  return tot;
}
__name(sanDuoi, "sanDuoi");

// ../src/game/giai-cuu-cong-chua/xu-ly-dam.ts
var KHONG_CHAM = { cham: "khongCham", hoa: null, matMang: [], nayLen: false };
function chamDinhDau(dam, bi, giay) {
  if (!dam.song || !bi.song) return false;
  if (dam === bi) return false;
  if (bi.batTuDen > giay) return false;
  if (dam.vy > -CAU_HINH.TOC_DO_ROI_TOI_THIEU) return false;
  const chongX = Math.abs(dam.x - bi.x) < (dam.rong + bi.rong) / 2;
  if (!chongX) return false;
  const dinhDau = bi.y + bi.cao;
  return dam.y >= dinhDau - CAU_HINH.CAO_VUNG_DAU && dam.y <= dinhDau + CAU_HINH.CAO_VUNG_DAU;
}
__name(chamDinhDau, "chamDinhDau");
function xuLyDam(dam, bi, giay) {
  if (!chamDinhDau(dam, bi, giay)) return KHONG_CHAM;
  const hoa = xuLyHoaChat(dam.hoaChat, bi.hoaChat);
  const matMang = [];
  if (hoa.loai === "trungHoa") {
    matMang.push("nguoiDam", "nguoiBiDam");
  } else if (hoa.loai === "khacChe") {
    if (hoa.thang === dam.hoaChat) matMang.push("nguoiBiDam");
    else matMang.push("nguoiDam");
  }
  return { cham: "dam", hoa, matMang, nayLen: true };
}
__name(xuLyDam, "xuLyDam");

// ../src/game/giai-cuu-cong-chua/rong.ts
function vongPha(giayHo) {
  return [
    { pha: "do", giay: 2 },
    { pha: "phun", giay: CAU_HINH.GIAY_PHUN_LUA },
    { pha: "dap", giay: 1.2 },
    { pha: "ho", giay: giayHo }
  ];
}
__name(vongPha, "vongPha");
function taoRong(xHang, chonChat, giayHo = CAU_HINH.GIAY_HO_SAU_DAP) {
  return {
    x: xHang + 200,
    y: 0,
    mau: CAU_HINH.MAU_RONG,
    pha: "do",
    conLai: vongPha(giayHo)[0].giay,
    hoaChat: HOA_CHAT[chonChat()].ct,
    huongPhun: -1,
    cotConLai: CAU_HINH.SO_LAN_COT_DA_CHIU,
    giayHo
  };
}
__name(taoRong, "taoRong");
function buocRong(r, dt) {
  if (r.pha === "nga") return "nga";
  r.conLai -= dt;
  if (r.conLai > 0) return r.pha;
  const vong = vongPha(r.giayHo);
  const i = vong.findIndex((v) => v.pha === r.pha);
  const ke = vong[(i + 1) % vong.length];
  r.pha = ke.pha;
  r.conLai = ke.giay;
  return r.pha;
}
__name(buocRong, "buocRong");
function dinhDauRong(r) {
  return { x: r.x - 150, y: r.pha === "ho" ? 70 : 240 };
}
__name(dinhDauRong, "dinhDauRong");
function rongMatMau(r, chonChat) {
  r.mau -= 1;
  if (r.mau <= 0) {
    r.pha = "nga";
    r.conLai = 0;
    return;
  }
  let c = HOA_CHAT[chonChat()].ct;
  let vong = 0;
  while (c === r.hoaChat && vong < 12) {
    c = HOA_CHAT[chonChat()].ct;
    vong++;
  }
  r.hoaChat = c;
  r.pha = "do";
  r.conLai = vongPha(r.giayHo)[0].giay;
}
__name(rongMatMau, "rongMatMau");

// ../src/game/giai-cuu-cong-chua/bot.ts
function taoNao(r, doChinhXac = CAU_HINH.BOT_DO_CHINH_XAC) {
  return { r, ch\u1EDD: 0, dinhNhay: false, lanNayDung: true, doChinhXac };
}
__name(taoNao, "taoNao");
function nghiBot(n, nao, dao, moiNguoi, giay, moc) {
  nao.ch\u1EDD -= 1 / CAU_HINH.FPS_MUC_TIEU;
  if (n.x >= moc) {
    n.phim.trai = false;
    n.phim.phai = false;
    return;
  }
  n.phim.phai = true;
  n.phim.trai = false;
  let mucTieu = null;
  for (const k of moiNguoi) {
    if (k === n || !k.song || k.batTuDen > giay) continue;
    const dx = k.x - n.x;
    if (dx > 10 && dx < 190 && k.y <= n.y + 40) {
      if (mucTieu === null || Math.abs(dx) < Math.abs(mucTieu.x - n.x)) mucTieu = k;
    }
  }
  if (nao.ch\u1EDD <= 0) {
    nao.ch\u1EDD = CAU_HINH.BOT_GIAY_PHAN_XA;
    nao.lanNayDung = nao.r() < nao.doChinhXac;
    if (mucTieu !== null) {
      const nen = nao.lanNayDung ? !biKhacChe(n.hoaChat, mucTieu.hoaChat) : true;
      nao.dinhNhay = nen;
    } else {
      const truoc = n.x + 70;
      const sapRoi = !coDat(dao, truoc) || !coDat(dao, n.x + 130);
      nao.dinhNhay = sapRoi && nao.lanNayDung;
    }
  }
  if (nao.dinhNhay && n.chamDat) {
    n.phim.nhayLuc = giay;
    nao.dinhNhay = false;
  }
}
__name(nghiBot, "nghiBot");

// ../src/game/giai-cuu-cong-chua/bo-nguoi.ts
var MUOI_HAI_HOA_CHAT = HOA_CHAT;
var MUOI_HAI_NGUOI = [
  { ten: "HCl", dau: "muLuoiTrai", hoaChat: MUOI_HAI_HOA_CHAT[0], mau: { chinh: "#FF5A4E", phu: "#2E4A8A", da: "#FFD9B8", toc: "#3A2A22" } },
  { ten: "H\u2082SO\u2084", dau: "toc", hoaChat: MUOI_HAI_HOA_CHAT[1], mau: { chinh: "#FFC13D", phu: "#8A5A1E", da: "#FFE0C4", toc: "#2B2118" } },
  { ten: "NaOH", dau: "muLen", hoaChat: MUOI_HAI_HOA_CHAT[2], mau: { chinh: "#2F8BFF", phu: "#23406E", da: "#F6CBA0", toc: "#463024" } },
  { ten: "Ca(OH)\u2082", dau: "nonLa", hoaChat: MUOI_HAI_HOA_CHAT[3], mau: { chinh: "#E8EDF5", phu: "#8E9CB4", da: "#FFD9B8", toc: "#3A2A22" } },
  { ten: "Ba(OH)\u2082", dau: "toc2", hoaChat: MUOI_HAI_HOA_CHAT[4], mau: { chinh: "#7E8FE8", phu: "#3A4694", da: "#FFE0C4", toc: "#2B1F30" } },
  { ten: "Na\u2082CO\u2083", dau: "bangDo", hoaChat: MUOI_HAI_HOA_CHAT[5], mau: { chinh: "#25B86B", phu: "#1B5E4A", da: "#FFE6D0", toc: "#4A2A30" } },
  { ten: "CuSO\u2084", dau: "muLuoiTrai", hoaChat: MUOI_HAI_HOA_CHAT[6], mau: { chinh: "#1E7FD4", phu: "#10406E", da: "#F6CBA0", toc: "#3A2A22" } },
  { ten: "AgNO\u2083", dau: "toc", hoaChat: MUOI_HAI_HOA_CHAT[7], mau: { chinh: "#9B5DE5", phu: "#4A2E7A", da: "#FFD9B8", toc: "#2B2118" } },
  { ten: "Al", dau: "muLen", hoaChat: MUOI_HAI_HOA_CHAT[8], mau: { chinh: "#B0B8C4", phu: "#5E6674", da: "#F0C098", toc: "#332418" } },
  { ten: "Zn", dau: "toc2", hoaChat: MUOI_HAI_HOA_CHAT[9], mau: { chinh: "#20C4C0", phu: "#166E6C", da: "#FFE0C4", toc: "#3A222A" } },
  { ten: "FeCl\u2083", dau: "bangDo", hoaChat: MUOI_HAI_HOA_CHAT[10], mau: { chinh: "#FF8A3D", phu: "#7A3A12", da: "#F6CBA0", toc: "#463024" } },
  { ten: "Cl\u2082", dau: "nonLa", hoaChat: MUOI_HAI_HOA_CHAT[11], mau: { chinh: "#8FBF3F", phu: "#4A6E1E", da: "#FFD9B8", toc: "#2B2118" } }
];

// ../src/game/giai-cuu-cong-chua/hieu-ung.ts
var KhoHieuUng = class {
  static {
    __name(this, "KhoHieuUng");
  }
  hat = [];
  chu = [];
  no(x, y, mauA, mauB, soHat = 18) {
    for (let i = 0; i < soHat; i++) {
      const g = i / soHat * Math.PI * 2 + Math.random() * 0.3;
      const v = 120 + Math.random() * 220;
      this.hat.push({
        x,
        y,
        vx: Math.cos(g) * v,
        vy: Math.sin(g) * v * 0.7 + 80,
        song: 0,
        toiDa: 0.5 + Math.random() * 0.3,
        r: 3 + Math.random() * 5,
        mau: i % 2 ? mauA : mauB
      });
    }
  }
  buiChan(x, y) {
    for (let i = 0; i < 5; i++) {
      this.hat.push({
        x: x + (Math.random() - 0.5) * 24,
        y,
        vx: (Math.random() - 0.5) * 70,
        vy: 40 + Math.random() * 60,
        song: 0,
        toiDa: 0.28,
        r: 2 + Math.random() * 3,
        mau: "rgba(255,255,255,.8)"
      });
    }
  }
  chuNoi(x, y, chu, mau) {
    this.chu.push({ x, y, chu, mau, song: 0, toiDa: 1.1 });
  }
  buoc(dt) {
    for (const h of this.hat) {
      h.song += dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.vy -= 900 * dt;
    }
    this.hat = this.hat.filter((h) => h.song < h.toiDa);
    for (const c of this.chu) {
      c.song += dt;
      c.y += 46 * dt;
    }
    this.chu = this.chu.filter((c) => c.song < c.toiDa);
  }
  xoa() {
    this.hat.length = 0;
    this.chu.length = 0;
  }
};

// ../src/game/giai-cuu-cong-chua/types.ts
var LOI_CANH_MO_DAU = [
  "Ng\u01B0\u1EDDi y\xEAu c\u0169 c\u1EE7a b\u1EA1n",
  "\u0111ang b\u1ECB con r\u1ED3ng giam gi\u1EEF.",
  "Chi\u1EBFn th\u1EAFng con r\u1ED3ng,",
  "b\u1EA1n s\u1EBD \u0111\u01B0\u1EE3c quay l\u1EA1i v\u1EDBi ng\u01B0\u1EDDi y\xEAu c\u0169\u2026",
  "D\u0168NG C\u1EA2M L\xCAN"
];

// ../src/game/giai-cuu-cong-chua/do-kho.ts
var BA_DO_KHO = [
  {
    ma: "truot",
    ten: "Tr\u01B0\u1EE3t \u0111\u1EA1i h\u1ECDc",
    moTa: "\xCDt qu\xE1i, ch\u1EADm, nhi\u1EC1u hoa. H\u1ECDc c\xE1ch ch\u01A1i.",
    mau: "#2FA8E8",
    soQuai: 8,
    tocDoQuai: 70,
    soHoa: 10,
    botDoChinhXac: 0.42,
    mauRong: 2,
    giayHoRong: 2
  },
  {
    ma: "do",
    ten: "\u0110\u1ED7 \u0111\u1EA1i h\u1ECDc",
    moTa: "V\u1EEBa s\u1EE9c. Qu\xE1i \u0111i tu\u1EA7n, hoa \u0111\u1EE7 d\xF9ng.",
    mau: "#1EA05A",
    soQuai: 16,
    tocDoQuai: 110,
    soHoa: 6,
    botDoChinhXac: 0.62,
    mauRong: 3,
    giayHoRong: 1.5
  },
  {
    ma: "thuKhoa",
    ten: "Th\u1EE7 khoa to\xE0n qu\u1ED1c",
    moTa: "Qu\xE1i d\xE0y v\xE0 nhanh, hoa hi\u1EBFm, bot thu\u1ED9c b\xE0i.",
    mau: "#FF5A4E",
    soQuai: 26,
    tocDoQuai: 160,
    soHoa: 3,
    botDoChinhXac: 0.82,
    mauRong: 4,
    giayHoRong: 1.1
  }
];
function layDoKho(ma) {
  return BA_DO_KHO.find((d) => d.ma === ma) ?? BA_DO_KHO[1];
}
__name(layDoKho, "layDoKho");

// ../src/game/giai-cuu-cong-chua/quai-va-hoa.ts
var CAO_QUAI = 64;
var RONG_QUAI = 58;
var BAN_KINH_HOA = 26;
function sinhQuai(dao, doKho, r) {
  const ds = [];
  const dau = 700, cuoi = dao.xHang - 120;
  for (let i = 0; i < doKho.soQuai; i++) {
    const giua = dau + (cuoi - dau) * (i + 0.5) / doKho.soQuai + (r() - 0.5) * 90;
    const nua = 90 + r() * 130;
    let x1 = giua - nua, x2 = giua + nua;
    while (x1 < x2 - 40 && !coDat(dao, x1)) x1 += 20;
    while (x2 > x1 + 40 && !coDat(dao, x2)) x2 -= 20;
    if (x2 - x1 < 60 || !coDat(dao, giua)) continue;
    ds.push({
      x: giua,
      y: 0,
      x1,
      x2,
      huong: r() < 0.5 ? 1 : -1,
      tocDo: doKho.tocDoQuai * (0.85 + r() * 0.3),
      song: true,
      kieu: Math.floor(r() * 3)
    });
  }
  return ds;
}
__name(sinhQuai, "sinhQuai");
function sinhHoa(dao, doKho, r) {
  const ds = [];
  const bac = [...dao.bac];
  for (let i = 0; i < doKho.soHoa; i++) {
    if (bac.length > 0 && r() < 0.7) {
      const j = Math.floor(r() * bac.length);
      const b = bac.splice(j, 1)[0];
      ds.push({ x: b.x + b.rong / 2, y: b.y + 34, conDo: true });
    } else {
      const x = 800 + r() * Math.max(1, dao.xHang - 900);
      if (!coDat(dao, x)) continue;
      ds.push({ x, y: (sanDuoi(dao, x, 999) ?? 0) + 34, conDo: true });
    }
  }
  return ds;
}
__name(sinhHoa, "sinhHoa");
function buocQuai(q, dao, dt) {
  if (!q.song) return;
  q.x += q.huong * q.tocDo * dt;
  if (q.x <= q.x1) {
    q.x = q.x1;
    q.huong = 1;
  }
  if (q.x >= q.x2) {
    q.x = q.x2;
    q.huong = -1;
  }
  const san = sanDuoi(dao, q.x, q.y + 4);
  q.y = san ?? q.y;
}
__name(buocQuai, "buocQuai");
function chongNhau(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) / 2 && ay < by + bh && by < ay + ah;
}
__name(chongNhau, "chongNhau");
function damTrungQuai(nx, ny, nvy, nRong, q) {
  if (!q.song) return false;
  if (nvy > -CAU_HINH.TOC_DO_ROI_TOI_THIEU) return false;
  if (Math.abs(nx - q.x) >= (nRong + RONG_QUAI) / 2) return false;
  const dinh = q.y + CAO_QUAI;
  return ny >= dinh - CAU_HINH.CAO_VUNG_DAU && ny <= dinh + CAU_HINH.CAO_VUNG_DAU;
}
__name(damTrungQuai, "damTrungQuai");

// ../src/game/giai-cuu-cong-chua/van-choi.ts
var VanChoi = class {
  static {
    __name(this, "VanChoi");
  }
  dao;
  nguoi = [];
  nao = /* @__PURE__ */ new Map();
  rong;
  giay = 0;
  pha = "chay";
  ket = { thang: null, duong: null, botChamCongChua: false };
  bang = null;
  /** Cảnh mở đầu trận rồng: giây bắt đầu, null khi không chiếu. */
  canhMoDau = null;
  loiCanhMoDau = LOI_CANH_MO_DAU;
  hieuUng;
  /** id của người thật. -1 nghĩa là ván toàn bot (dùng cho phép kiểm). */
  idNguoiThat;
  rChat;
  /** x của công chúa — bot KHÔNG BAO GIỜ được tới đây. */
  xCongChua;
  doKho;
  quai;
  hoa;
  constructor(hat, chatNguoiThat, veDuoc = false, idNguoiThat = 0, maDoKho = "do") {
    this.doKho = layDoKho(maDoKho);
    this.dao = sinhDao(hat);
    this.rChat = boSinh(hat ^ 24301);
    this.idNguoiThat = idNguoiThat;
    this.hieuUng = veDuoc ? new KhoHieuUng() : null;
    this.xCongChua = this.dao.xHang + 420;
    const conLai = HOA_CHAT.map((h) => h.ct);
    if (chatNguoiThat !== null) {
      const i = conLai.indexOf(chatNguoiThat);
      if (i >= 0) conLai.splice(i, 1);
    }
    for (let i = conLai.length - 1; i > 0; i--) {
      const j = Math.floor(this.rChat() * (i + 1));
      const t = conLai[i];
      conLai[i] = conLai[j];
      conLai[j] = t;
    }
    for (let id = 0; id < CAU_HINH.SO_NGUOI_TOI_DA; id++) {
      const laBot = id !== idNguoiThat;
      const ct = laBot ? conLai.pop() : chatNguoiThat ?? conLai.pop();
      this.nguoi.push({
        id,
        laBot,
        hocTro: MUOI_HAI_NGUOI[id % MUOI_HAI_NGUOI.length],
        hoaChat: ct,
        mang: CAU_HINH.SO_MANG,
        x: this.dao.choTha[id] ?? 120,
        y: 0,
        vx: 0,
        vy: 0,
        chamDat: true,
        roiDatLuc: -999,
        nhayConLai: CAU_HINH.SO_LAN_NHAY,
        batTuDen: 0.8,
        song: true,
        huong: 1,
        tuThe: "dung",
        phim: { trai: false, phai: false, nhayLuc: -999 },
        chonLaiDen: 0,
        soLanDoiChat: 0,
        soLanDuocChon: 0,
        khongLoDen: 0
      });
      if (laBot) this.nao.set(id, taoNao(boSinh(hat + id * 7919), this.doKho.botDoChinhXac));
    }
    this.quai = sinhQuai(this.dao, this.doKho, boSinh(hat ^ 39441));
    this.hoa = sinhHoa(this.dao, this.doKho, boSinh(hat ^ 45322));
    this.rong = taoRong(
      this.dao.xHang,
      () => Math.floor(this.rChat() * HOA_CHAT.length),
      this.doKho.giayHoRong
    );
    this.rong.mau = this.doKho.mauRong;
  }
  /** Ăn hoa thì khổng lồ 10 giây: chạm ai người đó mất mạng, chạm quái quái chết. */
  khongLo(n) {
    return n.khongLoDen > this.giay;
  }
  get nguoiThat() {
    return this.nguoi.find((n) => n.id === this.idNguoiThat);
  }
  conSong() {
    return this.nguoi.filter((n) => n.song);
  }
  thanhPhan(n) {
    return {
      x: n.x,
      y: n.y,
      vy: n.vy,
      rong: CAU_HINH.RONG_NHAN_VAT,
      cao: CAU_HINH.CAO_NHAN_VAT,
      batTuDen: n.batTuDen,
      song: n.song,
      hoaChat: n.hoaChat
    };
  }
  /** Mất một mạng: bất tử một lúc, và ĐƯỢC CHỌN LẠI hoá chất. */
  matMang(n) {
    if (n.batTuDen > this.giay || !n.song) return;
    n.mang -= 1;
    n.batTuDen = this.giay + CAU_HINH.GIAY_BAT_TU_SAU_MAT_MANG;
    this.hieuUng?.chuNoi(n.x, n.y + CAU_HINH.CAO_NHAN_VAT + 30, "\u22121", "#FF3B30");
    if (n.mang <= 0) {
      n.song = false;
      return;
    }
    if (CAU_HINH.DOI_CHAT_KHI_MAT_MANG) {
      n.soLanDuocChon += 1;
      n.chonLaiDen = this.giay + CAU_HINH.GIAY_CHON_LAI_CHAT;
      if (n.laBot) this.botChonLaiChat(n);
    }
  }
  /**
   * Chất chọn lại được: TẤT CẢ, trừ chất mình đang cầm.
   *
   * Không lọc theo "chất còn trống" nữa. Khi cả 12 người còn sống thì không
   * chất nào trống — màn chọn lại sẽ RỖNG đúng vào lúc em cầm chất yếu và cần
   * đổi nhất. Hai luật "12 người 12 chất" và "mất mạng được đổi chất" mâu
   * thuẫn nhau; chữa bằng ĐỔI CHÉO ở doiChat().
   */
  chatChonDuoc(n) {
    return HOA_CHAT.map((h) => h.ct).filter((ct) => ct !== n.hoaChat);
  }
  /**
   * ĐỔI CHÉO. Lấy chất của ai thì người đó nhận lại chất của mình.
   *
   * Bộ chất luôn là một HOÁN VỊ — không bao giờ có hai người cùng chất, mà
   * lúc nào cũng có 11 lựa chọn thật. Và nó thêm một nước cờ: giật NaOH của
   * đối thủ cũng là dúi AgNO₃ vào tay họ.
   */
  doiChat(n, ct) {
    if (ct === n.hoaChat) {
      n.chonLaiDen = 0;
      return false;
    }
    if (!HOA_CHAT.some((h) => h.ct === ct)) return false;
    const cu = n.hoaChat;
    const kia = this.nguoi.find((k) => k !== n && k.hoaChat === ct);
    n.hoaChat = ct;
    n.soLanDoiChat += 1;
    if (kia) {
      kia.hoaChat = cu;
      kia.soLanDoiChat += 1;
    }
    n.chonLaiDen = 0;
    return true;
  }
  /** Bot chọn chất khắc chế được nhiều người đang sống nhất. */
  botChonLaiChat(n) {
    const doiThu = this.conSong().filter((k) => k !== n).map((k) => k.hoaChat);
    let tot = n.hoaChat, diemTot = -99;
    for (const ct of this.chatChonDuoc(n)) {
      let d = 0;
      for (const ho of doiThu) {
        const kq = xuLyHoaChat(ct, ho);
        if (kq.loai === "khacChe") d += kq.thang === ct ? 1 : -1;
      }
      if (d > diemTot) {
        diemTot = d;
        tot = ct;
      }
    }
    this.doiChat(n, tot);
  }
  vatLy(n, dt) {
    const dangChon = n.chonLaiDen > this.giay;
    const traiPhai = dangChon ? 0 : (n.phim.phai ? 1 : 0) - (n.phim.trai ? 1 : 0);
    n.vx = traiPhai * CAU_HINH.TOC_DO_CHAY;
    if (traiPhai !== 0) n.huong = traiPhai > 0 ? 1 : -1;
    const vuaRoiMep = !n.chamDat && this.giay - n.roiDatLuc <= CAU_HINH.GIAY_NHAY_MUON;
    const bamSom = this.giay - n.phim.nhayLuc <= CAU_HINH.GIAY_NHAY_SOM;
    if (!dangChon && bamSom && (n.chamDat || vuaRoiMep || n.nhayConLai > 0)) {
      if (n.chamDat || vuaRoiMep) n.nhayConLai = CAU_HINH.SO_LAN_NHAY;
      n.vy = CAU_HINH.TOC_DO_NHAY;
      n.nhayConLai -= 1;
      n.chamDat = false;
      n.phim.nhayLuc = -999;
      this.hieuUng?.buiChan(n.x, n.y);
    }
    n.vy -= CAU_HINH.TRONG_LUC * dt;
    n.x += n.vx * dt;
    const yTruoc = n.y;
    n.y += n.vy * dt;
    if (n.x < 0) n.x = 0;
    if (n.x > this.dao.dai + 700) n.x = this.dao.dai + 700;
    const dangChamTruoc = n.chamDat;
    n.chamDat = false;
    if (n.vy <= 0) {
      const san = sanDuoi(this.dao, n.x, yTruoc);
      if (san !== null && yTruoc >= san - 1 && n.y <= san) {
        n.y = san;
        n.vy = 0;
        n.chamDat = true;
        n.nhayConLai = CAU_HINH.SO_LAN_NHAY;
      }
    }
    if (dangChamTruoc && !n.chamDat) n.roiDatLuc = this.giay;
    if (n.y < -420) {
      this.matMang(n);
      this.hoiSinh(n);
    }
    n.tuThe = !n.chamDat ? n.vy < -CAU_HINH.TOC_DO_ROI_TOI_THIEU ? "dam" : "nhay" : Math.abs(n.vx) > 1 ? "chay" : "dung";
  }
  hoiSinh(n) {
    if (!n.song) return;
    let x = n.x - 200;
    if (x < 60) x = 60;
    while (x > 60 && sanDuoi(this.dao, x, 0) === null) x -= 40;
    n.x = x;
    n.y = 320;
    n.vx = 0;
    n.vy = 0;
  }
  vaChamNguoi() {
    const ds = this.conSong();
    for (const a of ds) {
      for (const b of ds) {
        if (a === b) continue;
        const kq = xuLyDam(this.thanhPhan(a), this.thanhPhan(b), this.giay);
        if (kq.cham !== "dam" || kq.hoa === null) continue;
        a.vy = CAU_HINH.NAY_SAU_DAM;
        a.y = b.y + CAU_HINH.CAO_NHAN_VAT + 2;
        for (const ai of kq.matMang) this.matMang(ai === "nguoiDam" ? a : b);
        const mau = kq.hoa.loai === "khacChe" ? kq.hoa.thang === a.hoaChat ? "#1EA05A" : "#FF5A4E" : kq.hoa.loai === "trungHoa" ? "#FF8A3D" : "#8894B4";
        const nhan = kq.hoa.loai === "khacChe" ? kq.hoa.thang === a.hoaChat ? "KH\u1EAEC CH\u1EBE" : "B\u1ECA KH\u1EAEC CH\u1EBE" : kq.hoa.loai === "trungHoa" ? "TRUNG HO\xC0" : "KH\xD4NG PH\u1EA2N \u1EE8NG";
        if (a.id === this.idNguoiThat || b.id === this.idNguoiThat) {
          this.bang = {
            pt: kq.hoa.pt,
            tieuChi: kq.hoa.tieuChi,
            nhan,
            mau,
            den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH
          };
        }
        this.hieuUng?.no(b.x, b.y + CAU_HINH.CAO_NHAN_VAT, mau, "#FFF0A8");
      }
    }
  }
  /**
   * Quái đi tuần, người ăn hoa, và ba kiểu va chạm:
   *  · khổng lồ CHẠM quái  ⇒ quái chết
   *  · dẫm trúng đỉnh đầu quái ⇒ quái chết  (đúng động tác đã học suốt ván)
   *  · chạm quái kiểu khác  ⇒ MÌNH mất một mạng
   * Khổng lồ chạm NGƯỜI khác thì người đó mất mạng, không tra bảng hoá chất —
   * đó chính là thứ bông hoa mua được.
   */
  vaChamQuaiVaHoa() {
    const dtKhung = 1 / CAU_HINH.FPS_MUC_TIEU;
    for (const q of this.quai) buocQuai(q, this.dao, dtKhung);
    for (const n of this.conSong()) {
      const to = this.khongLo(n) ? 1.8 : 1;
      const rongN = CAU_HINH.RONG_NHAN_VAT * to;
      const caoN = CAU_HINH.CAO_NHAN_VAT * to;
      for (const h of this.hoa) {
        if (!h.conDo) continue;
        if (chongNhau(n.x, n.y, rongN, caoN, h.x, h.y - BAN_KINH_HOA, BAN_KINH_HOA * 2, BAN_KINH_HOA * 2)) {
          h.conDo = false;
          n.khongLoDen = this.giay + CAU_HINH.GIAY_KHONG_LO;
          this.hieuUng?.no(h.x, h.y, "#FF5A9E", "#FFC13D", 22);
          if (n.id === this.idNguoiThat) {
            this.bang = {
              pt: "KH\u1ED4NG L\u1ED2 " + CAU_HINH.GIAY_KHONG_LO + " gi\xE2y",
              tieuChi: "ch\u1EA1m ai ng\u01B0\u1EDDi \u0111\xF3 m\u1EA5t m\u1EA1ng \u2014 kh\xF4ng c\u1EA7n d\u1EABm",
              nhan: "\u0102N HOA",
              mau: "#FF5A9E",
              den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH
            };
          }
        }
      }
      for (const q of this.quai) {
        if (!q.song) continue;
        if (!chongNhau(n.x, n.y, rongN, caoN, q.x, q.y, RONG_QUAI, CAO_QUAI)) continue;
        if (this.khongLo(n)) {
          q.song = false;
          this.hieuUng?.no(q.x, q.y + CAO_QUAI / 2, "#8A5AC8", "#FFF0A8", 16);
          continue;
        }
        if (damTrungQuai(n.x, n.y, n.vy, CAU_HINH.RONG_NHAN_VAT, q)) {
          q.song = false;
          n.vy = CAU_HINH.NAY_SAU_DAM;
          this.hieuUng?.no(q.x, q.y + CAO_QUAI / 2, "#8A5AC8", "#FFF0A8", 16);
          continue;
        }
        this.matMang(n);
      }
      if (this.khongLo(n)) {
        for (const k of this.conSong()) {
          if (k === n || this.khongLo(k)) continue;
          if (chongNhau(n.x, n.y, rongN, caoN, k.x, k.y, CAU_HINH.RONG_NHAN_VAT, CAU_HINH.CAO_NHAN_VAT)) {
            this.matMang(k);
            if (k.id === this.idNguoiThat || n.id === this.idNguoiThat) {
              this.bang = {
                pt: "",
                tieuChi: "kh\u1ED5ng l\u1ED3 ch\u1EA1m l\xE0 m\u1EA5t m\u1EA1ng, kh\xF4ng tra ho\xE1 ch\u1EA5t",
                nhan: n.id === this.idNguoiThat ? "KH\u1ED4NG L\u1ED2 H\u1EA4T V\u0102NG" : "B\u1ECA KH\u1ED4NG L\u1ED2 H\u1EA4T",
                mau: "#FF5A9E",
                den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH
              };
            }
          }
        }
      }
    }
  }
  buocTrum(dt) {
    const truoc = this.rong.pha;
    buocRong(this.rong, dt);
    if (truoc !== "phun" && this.rong.pha === "phun") this.rong.huongPhun = -1;
    for (const n of this.conSong()) {
      if (this.rong.pha === "phun" && this.rong.cotConLai > 0) {
        const trongTam = n.x > this.rong.x - 560 && n.x < this.rong.x - 60 && n.chamDat;
        const dangNap = n.x > this.rong.x - 330 && n.x < this.rong.x - 250;
        if (trongTam && !dangNap) this.matMang(n);
      }
      const dinh = dinhDauRong(this.rong);
      const gan = Math.abs(n.x - dinh.x) < 90 && Math.abs(n.y - dinh.y) < 60;
      if (this.rong.pha === "ho" && gan && n.vy < -CAU_HINH.TOC_DO_ROI_TOI_THIEU) {
        n.vy = CAU_HINH.NAY_SAU_DAM;
        if (biKhacChe(n.hoaChat, this.rong.hoaChat)) {
          this.matMang(n);
          if (n.id === this.idNguoiThat) {
            const kq = xuLyHoaChat(n.hoaChat, this.rong.hoaChat);
            this.bang = {
              pt: kq.pt,
              tieuChi: kq.tieuChi,
              nhan: "B\u1ECA KH\u1EAEC CH\u1EBE",
              mau: "#FF5A4E",
              den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH
            };
          }
        } else {
          rongMatMau(this.rong, () => Math.floor(this.rChat() * HOA_CHAT.length));
          this.hieuUng?.no(dinh.x, dinh.y, "#FFC13D", "#FF5A4E", 26);
        }
      }
    }
    if (this.rong.pha === "nga") {
      for (const n of this.conSong()) {
        if (n.laBot) continue;
        if (Math.abs(n.x - this.xCongChua) < 60) {
          this.pha = "xong";
          this.ket = { thang: n.id, duong: "rong", botChamCongChua: false };
        }
      }
      for (const n of this.conSong()) {
        if (n.laBot && Math.abs(n.x - this.xCongChua) < 60) this.ket.botChamCongChua = true;
      }
    }
  }
  buoc(dt) {
    if (this.pha === "xong") return;
    this.giay += dt;
    if (this.pha === "canhMoDau") {
      if (this.canhMoDau !== null && this.giay - this.canhMoDau >= CAU_HINH.GIAY_CANH_MO_DAU) {
        this.pha = "chay";
      } else {
        for (const n of this.conSong()) {
          n.phim.trai = false;
          n.phim.phai = false;
          n.phim.nhayLuc = -999;
          n.batTuDen = Math.max(n.batTuDen, this.giay + 0.5);
          n.vx = 0;
        }
        this.hieuUng?.buoc(dt);
        return;
      }
    }
    for (const n of this.conSong()) {
      if (n.laBot) {
        const nao = this.nao.get(n.id);
        if (nao) nghiBot(n, nao, this.dao, this.nguoi, this.giay, this.dao.xHang);
      }
      this.vatLy(n, dt);
    }
    this.vaChamNguoi();
    this.vaChamQuaiVaHoa();
    const song = this.conSong();
    const chiMotNguoi = song.length <= 1;
    if (CAU_HINH.CHI_NGUOI_CUOI_CUNG_GAP_RONG && this.pha === "chay" && chiMotNguoi && this.canhMoDau === null && song.length === 1) {
      this.canhMoDau = this.giay;
      this.pha = "canhMoDau";
    }
    if (this.pha === "canhMoDau") {
      if (this.canhMoDau !== null && this.giay - this.canhMoDau >= CAU_HINH.GIAY_CANH_MO_DAU) {
        this.pha = "chay";
      } else {
        for (const n of song) {
          n.phim.trai = false;
          n.phim.phai = false;
          n.phim.nhayLuc = -999;
          n.batTuDen = Math.max(n.batTuDen, this.giay + 0.5);
        }
        this.hieuUng?.buoc(dt);
        return;
      }
    }
    const moDuocHang = CAU_HINH.CHI_NGUOI_CUOI_CUNG_GAP_RONG ? chiMotNguoi : true;
    if (!moDuocHang) {
      for (const n of song) {
        if (n.x > this.dao.xHang - 40) {
          n.x = this.dao.xHang - 40;
          if (n.vx > 0) n.vx = 0;
          if (n.id === this.idNguoiThat && this.bang === null) {
            this.bang = {
              pt: "",
              tieuChi: "ph\u1EA3i l\xE0 ng\u01B0\u1EDDi s\u1ED1ng s\xF3t cu\u1ED1i c\xF9ng",
              nhan: "C\u1EECA HANG C\xD2N \u0110\xD3NG \xB7 c\xF2n " + song.length + " ng\u01B0\u1EDDi",
              mau: "#8894B4",
              den: this.giay + CAU_HINH.GIAY_HIEN_PHUONG_TRINH
            };
          }
        }
      }
    }
    const nguoiVaoHang = moDuocHang && song.some((n) => n.x > this.dao.xHang - 40);
    if (this.pha === "chay" && nguoiVaoHang) this.pha = "trum";
    if (this.pha === "trum") this.buocTrum(dt);
    if (song.length === 0) {
      this.pha = "xong";
      this.ket = { thang: null, duong: null, botChamCongChua: this.ket.botChamCongChua };
    }
    if (this.bang && this.bang.den < this.giay) this.bang = null;
    this.hieuUng?.buoc(dt);
  }
  /** Chạy nhanh không vẽ — dùng cho phép kiểm. */
  chayHet(giayToiDa = 240, dt = 1 / 60) {
    let t = 0;
    while (t < giayToiDa && this.pha !== "xong") {
      this.buoc(dt);
      t += dt;
    }
  }
};

// ../src/game/giai-cuu-cong-chua/giao-thuc.ts
var PHIEN_BAN_GIAO_THUC = 1;
function tron(x) {
  return Math.round(x * 10) / 10;
}
__name(tron, "tron");
function loBietDanh(s) {
  const sach = s.normalize("NFC").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 16);
  return sach.length >= 2 ? sach : "\u1EA8n danh";
}
__name(loBietDanh, "loBietDanh");

// src/phong.ts
var GIAY_CHO = 30;
var NHIP_MS = Math.round(1e3 / CAU_HINH.NHIP_MAY_CHU_HZ);
var PhongChoi = class {
  static {
    __name(this, "PhongChoi");
  }
  khach = /* @__PURE__ */ new Map();
  van = null;
  maPhong = "";
  doKho = "do";
  hetChoLuc = 0;
  dongHo = null;
  // DurableObjectState chưa cần dùng: ván sống trong bộ nhớ, rớt phòng là
  // xoá ván — không có gì đáng ghi xuống đĩa, và cũng không nên ghi.
  constructor(_state) {
  }
  async fetch(req) {
    const url = new URL(req.url);
    this.maPhong = url.searchParams.get("ma") ?? this.maPhong;
    if (req.headers.get("Upgrade") !== "websocket") {
      return new Response(JSON.stringify({ soNguoi: this.khach.size, dangChoi: this.van !== null }), {
        headers: { "content-type": "application/json" }
      });
    }
    const cap = new WebSocketPair();
    const [client, server] = [cap[0], cap[1]];
    server.accept();
    this.gan(server);
    return new Response(null, { status: 101, webSocket: client });
  }
  gui(o, g) {
    try {
      o.send(JSON.stringify(g));
    } catch {
      this.roi(o);
    }
  }
  phat(g) {
    for (const o of this.khach.keys()) this.gui(o, g);
  }
  gan(o) {
    o.addEventListener("message", (e) => {
      let g;
      try {
        g = JSON.parse(String(e.data));
      } catch {
        this.gui(o, { loai: "loi", ma: "goiLa", loi: "g\xF3i kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c" });
        return;
      }
      this.nhan(o, g);
    });
    o.addEventListener("close", () => this.roi(o));
    o.addEventListener("error", () => this.roi(o));
  }
  roi(o) {
    const k = this.khach.get(o);
    this.khach.delete(o);
    if (k && this.van && k.id >= 0) {
      const n = this.van.nguoi.find((x) => x.id === k.id);
      if (n) n.laBot = true;
    }
    if (this.khach.size === 0) this.dungDongHo();
    else if (!this.van) this.banPhongCho();
  }
  nhan(o, g) {
    if (g.loai === "vao") {
      if (g.phienBan !== PHIEN_BAN_GIAO_THUC) {
        this.gui(o, { loai: "loi", ma: "phienBanLech", loi: "T\u1EA3i l\u1EA1i trang \u0111\u1EC3 c\u1EADp nh\u1EADt b\u1EA3n m\u1EDBi" });
        return;
      }
      if (this.khach.size >= CAU_HINH.SO_NGUOI_TOI_DA) {
        this.gui(o, { loai: "loi", ma: "phongDay", loi: "Ph\xF2ng \u0111\u1EE7 12 ng\u01B0\u1EDDi r\u1ED3i" });
        return;
      }
      this.khach.set(o, {
        o,
        maMay: String(g.maMay).slice(0, 32),
        bietDanh: loBietDanh(g.bietDanh),
        hoaChat: null,
        id: -1,
        sttCuoi: -1
      });
      if (this.hetChoLuc === 0) this.hetChoLuc = Date.now() + GIAY_CHO * 1e3;
      this.batDongHo();
      this.banPhongCho();
      return;
    }
    const k = this.khach.get(o);
    if (!k) {
      this.gui(o, { loai: "loi", ma: "chuaVao", loi: "ch\u01B0a v\xE0o ph\xF2ng" });
      return;
    }
    if (g.loai === "chonMuc") {
      if (this.laChuPhong(k) && !this.van) {
        this.doKho = g.doKho;
        this.banPhongCho();
      }
      return;
    }
    if (g.loai === "chonChat") {
      if (!HOA_CHAT.some((h) => h.ct === g.hoaChat)) return;
      if (!this.van) {
        for (const x of this.khach.values()) {
          if (x !== k && x.hoaChat === g.hoaChat) {
            this.gui(o, { loai: "loi", ma: "chatDaCoNguoi", loi: "Ch\u1EA5t n\xE0y c\xF3 ng\u01B0\u1EDDi l\u1EA5y r\u1ED3i" });
            return;
          }
        }
        k.hoaChat = g.hoaChat;
        this.banPhongCho();
      } else {
        const n = this.van.nguoi.find((x) => x.id === k.id);
        if (n && n.chonLaiDen > this.van.giay) this.van.doiChat(n, g.hoaChat);
      }
      return;
    }
    if (g.loai === "phim") {
      if (!this.van || k.id < 0) return;
      if (typeof g.stt !== "number" || g.stt <= k.sttCuoi) return;
      k.sttCuoi = g.stt;
      const n = this.van.nguoi.find((x) => x.id === k.id);
      if (!n || !n.song) return;
      n.phim.trai = !!g.trai;
      n.phim.phai = !!g.phai;
      if (g.nhay) n.phim.nhayLuc = this.van.giay;
    }
  }
  laChuPhong(k) {
    const dau = this.khach.values().next().value;
    return dau !== void 0 && dau.maMay === k.maMay;
  }
  banPhongCho() {
    const g = {
      loai: "phongCho",
      maPhong: this.maPhong,
      giayConLai: Math.max(0, Math.ceil((this.hetChoLuc - Date.now()) / 1e3)),
      doKho: this.doKho,
      nguoi: [...this.khach.values()].map((k, i) => ({
        maMay: k.maMay,
        bietDanh: k.bietDanh,
        hoaChat: k.hoaChat,
        laChuPhong: i === 0
      })),
      chatDaLay: [...this.khach.values()].map((k) => k.hoaChat).filter((c) => c !== null)
    };
    this.phat(g);
  }
  batDongHo() {
    if (this.dongHo !== null) return;
    this.dongHo = setInterval(() => this.nhip(), NHIP_MS);
  }
  dungDongHo() {
    if (this.dongHo !== null) {
      clearInterval(this.dongHo);
      this.dongHo = null;
    }
    this.van = null;
    this.hetChoLuc = 0;
    for (const k of this.khach.values()) {
      k.id = -1;
      k.hoaChat = null;
      k.sttCuoi = -1;
    }
  }
  nhip() {
    if (!this.van) {
      if (this.hetChoLuc > 0 && Date.now() >= this.hetChoLuc) this.moVan();
      else if (Date.now() % 1e3 < NHIP_MS) this.banPhongCho();
      return;
    }
    this.van.buoc(NHIP_MS / 1e3);
    this.banAnh();
    if (this.van.pha === "xong") this.ketVan();
  }
  moVan() {
    const hat = (Math.floor(Date.now() / 1e3) ^ 20897) & 65535;
    const ds = [...this.khach.values()];
    const van = new VanChoi(hat, ds[0]?.hoaChat ?? null, false, 0, this.doKho);
    ds.forEach((k, i) => {
      k.id = i;
      const n = van.nguoi[i];
      if (!n) return;
      n.laBot = false;
      if (k.hoaChat) van.doiChat(n, k.hoaChat);
      k.hoaChat = n.hoaChat;
    });
    van.idNguoiThat = -1;
    this.van = van;
    for (const k of this.khach.values()) {
      this.gui(k.o, {
        loai: "vaoVan",
        hat,
        doKho: this.doKho,
        idCuaBan: k.id,
        nguoi: van.nguoi.map((n) => {
          const chu = ds.find((x) => x.id === n.id);
          return {
            id: n.id,
            bietDanh: chu?.bietDanh ?? "M\xE1y " + (n.id + 1),
            laBot: chu === void 0,
            hoaChat: n.hoaChat,
            kieuDau: MUOI_HAI_NGUOI[n.id % MUOI_HAI_NGUOI.length].dau,
            mauAo: MUOI_HAI_NGUOI[n.id % MUOI_HAI_NGUOI.length].mau.chinh
          };
        })
      });
    }
  }
  banAnh() {
    const v = this.van;
    const g = {
      loai: "anh",
      giay: tron(v.giay),
      nguoi: v.nguoi.map((n) => ({
        id: n.id,
        x: tron(n.x),
        y: tron(n.y),
        vy: tron(n.vy),
        huong: n.huong,
        tuThe: n.tuThe,
        mang: n.mang,
        hoaChat: n.hoaChat,
        song: n.song,
        batTu: tron(n.batTuDen),
        khongLo: tron(n.khongLoDen)
      })),
      quaiSong: v.quai.map((q, i) => q.song ? i : -1).filter((i) => i >= 0),
      hoaCon: v.hoa.map((h, i) => h.conDo ? i : -1).filter((i) => i >= 0),
      rong: v.pha === "trum" ? { x: tron(v.rong.x), mau: v.rong.mau, pha: v.rong.pha, hoaChat: v.rong.hoaChat, cotConLai: v.rong.cotConLai } : null,
      pha: v.pha,
      canhMoDau: v.canhMoDau === null ? null : tron(v.canhMoDau),
      conSong: v.conSong().length
    };
    this.phat(g);
  }
  ketVan() {
    const v = this.van;
    const ds = [...this.khach.values()];
    this.phat({
      loai: "ketVan",
      thang: v.ket.thang,
      duong: v.ket.duong,
      bang: v.nguoi.map((n) => ({
        id: n.id,
        bietDanh: ds.find((x) => x.id === n.id)?.bietDanh ?? "M\xE1y " + (n.id + 1),
        mang: n.mang,
        hoaChatCuoi: n.hoaChat
      }))
    });
    this.van = null;
    this.hetChoLuc = Date.now() + GIAY_CHO * 1e3;
    for (const k of this.khach.values()) {
      k.id = -1;
      k.sttCuoi = -1;
    }
  }
};

// src/index.ts
var CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,OPTIONS",
  "access-control-allow-headers": "content-type"
};
var CHU = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function maPhongMoi() {
  const b = new Uint8Array(4);
  crypto.getRandomValues(b);
  return Array.from(b, (n) => CHU[n % CHU.length]).join("");
}
__name(maPhongMoi, "maPhongMoi");
var src_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/moi") {
      return new Response(JSON.stringify({ ma: maPhongMoi() }), {
        headers: { "content-type": "application/json", ...CORS }
      });
    }
    const m = /^\/phong\/([A-Z0-9]{4})$/.exec(url.pathname);
    if (m) {
      const ma = m[1];
      const id = env.PHONG.idFromName(ma);
      const phong = env.PHONG.get(id);
      const u = new URL(req.url);
      u.searchParams.set("ma", ma);
      return phong.fetch(new Request(u.toString(), req));
    }
    if (url.pathname === "/khoe") {
      return new Response("ok", { headers: CORS });
    }
    return new Response("kh\xF4ng c\xF3 \u0111\u01B0\u1EDDng n\xE0y", { status: 404, headers: CORS });
  }
};

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-qHmQsd/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-qHmQsd/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  PhongChoi,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
