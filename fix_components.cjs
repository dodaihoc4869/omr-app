const fs = require('fs');
fs.writeFileSync('src/components/hom-nay/ViecGap.tsx', 'import React from "react"; export default function ViecGap() { return null; }');
fs.writeFileSync('src/screens/HomNayScreen.tsx', 'import React from "react"; export default function HomNayScreen() { return null; }');
fs.writeFileSync('src/screens/ExamHubScreen.tsx', fs.readFileSync('src/screens/ExamHubScreen.tsx', 'utf8').replace(/import HomNayScreen from '\.\/HomNayScreen'.*\n/g, '').replace(/<HomNayScreen \/>/g, ''));
let examTake = fs.readFileSync('src/screens/ExamTakeScreen.tsx', 'utf8');
examTake = examTake.replace(/import PhieuScreen from '\.\/PhieuScreen'.*\n/g, '');
examTake = examTake.replace(/if \(trangThai === 'da_nop'\) return <PhieuScreen \/>/g, '');
examTake = examTake.replace(/import DaiCauChuaLamM3, \{ KhungCauM3 \} from '\.\/DaiCauChuaLamM3'.*\n/g, '');
// just removing DaiCauChuaLamM3 components might be hard if they are nested. Let's just create a dummy file for DaiCauChuaLamM3.tsx and PhieuScreen.tsx
fs.writeFileSync('src/screens/DaiCauChuaLamM3.tsx', 'import React from "react"; export default function DaiCauChuaLamM3() { return null; } export function KhungCauM3() { return null; }');
