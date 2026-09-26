#!/bin/bash
cd /tmp/omr-app-eval
# Delete UI screens
rm src/screens/ParentPortalScreen.tsx
rm src/screens/GiaoDeTheoTuanScreen.tsx
rm src/screens/HomNayScreen.tsx
rm src/screens/HomNayCu.tsx
rm src/screens/ToanCanhEmScreen.tsx
rm src/screens/PhanCongScreen.tsx
rm src/screens/PhieuScreen.tsx
rm src/screens/PhieuV3.tsx
rm src/screens/DaiCauChuaLamM3.tsx
rm src/screens/HocSinhScreen.tsx

# Delete Backend algorithms
rm server/src/btvn-*.ts
rm server/src/cnh-exp-*.ts
rm server/src/game-v2-*.ts
rm server/src/game-v2.ts
rm server/src/gv-*.ts
rm server/src/ho-so-*.ts
rm server/src/ke-hoach-*.ts
rm server/src/kho-de-*.ts
rm server/src/parent-news-*.ts
rm server/src/ph-*.ts
rm server/src/thi-dua-*.ts
rm server/src/thu-thach-*.ts
rm server/src/mom.ts
rm server/src/bo-chon-*.ts
rm server/src/chong-lap.ts
rm server/src/loc-cau-chuan.ts
rm server/src/pham-vi-hoc.ts

