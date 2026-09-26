const fs = require('fs');
fs.writeFileSync('src/screens/ExamHubScreen.tsx', 'import React from "react"; export default function ExamHubScreen() { return <div />; }');
fs.writeFileSync('src/screens/DaiCauChuaLamM3.tsx', 'import React from "react"; export default function DaiCauChuaLamM3(props: any) { return <div />; } export function KhungCauM3(props: any) { return <div />; }');
fs.writeFileSync('src/screens/PhieuScreen.tsx', 'import React from "react"; export default function PhieuScreen() { return <div />; }');

let examTake = fs.readFileSync('src/screens/ExamTakeScreen.tsx', 'utf8');
examTake = examTake.replace(/import PhieuScreen from '\.\/PhieuScreen'.*\n/g, '');
examTake = examTake.replace(/if \(trangThai === 'da_nop'\) return <PhieuScreen \/>/g, '');
examTake = examTake.replace(/import DaiCauChuaLamM3, \{ KhungCauM3 \} from '\.\/DaiCauChuaLamM3'.*\n/g, '');
fs.writeFileSync('src/screens/ExamTakeScreen.tsx', examTake);
