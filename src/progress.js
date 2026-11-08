/** SIMAQ: persentase berdasarkan cakupan AYAT yang benar-benar berstatus tuntas.
 * Catatan: pencapaian juz dihitung hanya jika ada setoran juz tuntas.
 * Target kelas digunakan jika cocok, bukan mengganti nilai jumlah surah siswa.
 */
export function mergeIntervals(intervals, maxAyah) {
  const clean = intervals.map(([a,b]) => [Math.max(1,Number(a)),Math.min(maxAyah,Number(b))])
    .filter(([a,b]) => Number.isFinite(a)&&Number.isFinite(b)&&a<=b).sort((x,y)=>x[0]-y[0]);
  const merged=[];
  for(const [a,b] of clean){const last=merged[merged.length-1];if(last&&a<=last[1]+1) last[1]=Math.max(last[1],b);else merged.push([a,b]);}
  return merged;
}
export function intervalOverlap(merged, start, end) {
  return merged.reduce((sum,[a,b])=>sum+Math.max(0,Math.min(b,end)-Math.max(a,start)+1),0);
}
function normalizedClass(value){const text=String(value??'').trim().toUpperCase();return ({I:'1',II:'2',III:'3',IV:'4',V:'5',VI:'6',VII:'7',VIII:'8',IX:'9',X:'10',XI:'11',XII:'12'})[text]||text;}
// Jumlah ayat Juz 30 (surah 78–114), digunakan agar capaian tetap terukur saat API katalog terputus.
const JUZ30_AYAH=[40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
export const juz30AyahCount = num => num>=78&&num<=114?JUZ30_AYAH[num-78]:0;
export function studentProgress(student, targets, records, surahs) {
  const matches=(targets||[]).filter(t=>t.school_id===student.school_id&&(!t.class_name||normalizedClass(t.class_name)===normalizedClass(student.class_name)));
  const eligible=(records||[]).filter(r=>r.student_id===student.id&&r.status==='tuntas');
  const known=new Map((surahs||[]).map(s=>[Number(s.number),Number(s.numberOfAyahs)]));
  for(let n=78;n<=114;n++)if(!known.has(n))known.set(n,juz30AyahCount(n));
  const bySurah=new Map();
  for(const r of eligible){
    const num=Number(r.surah_number),max=known.get(num);
    if(!max)continue;
    const from=Number(r.ayah_from||1),to=Number(r.ayah_to||(r.mode==='surah'?max:0));
    if(!(from>=1&&to>=from&&to<=max))continue;
    if(!bySurah.has(num))bySurah.set(num,[]);
    bySurah.get(num).push([from,to]);
  }
  const coverage=(num,a,b)=>intervalOverlap(mergeIntervals(bySurah.get(num)||[],known.get(num)||0),a,b);
  const isDone=num=>known.has(num)&&coverage(num,1,known.get(num))===known.get(num);
  // Prioritaskan target rentang TERBARU untuk kelas ini. Target lama tetap ada untuk arsip.
  const ranges=matches.filter(t=>t.mode==='rentang'&&Number(t.surah_number)>=Number(t.surah_end));
  if(ranges.length){
    const ranked=[...ranges].sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||''))||String(b.semester||'').localeCompare(String(a.semester||'')));
    const current=ranked[0];
    const requested=[];for(let n=Number(current.surah_end);n<=Number(current.surah_number);n++)requested.push(n);
    const done=requested.filter(isDone).length,target=requested.length;
    return {done,target,pct:Math.round(done/target*100),label:`${done}/${target} surah tuntas`,detail:`Target kelas ${current.class_name} • ${current.semester||'Semua semester'}`,surahStatus:requested.map(num=>({number:num,tuntas:isDone(num)}))};
  }
  // Kompatibilitas untuk target satu surah/ayat/juz yang telah dibuat sebelumnya.
  let earned=0,total=0,unknown=0;
  for(const t of matches){
    if(t.mode==='juz'){total++;if(eligible.some(r=>r.mode==='juz'&&Number(r.juz_number)===Number(t.juz_number)))earned++;continue;}
    const num=Number(t.surah_number),max=known.get(num);
    if(!max){unknown++;continue;}
    const start=t.mode==='ayat'?Number(t.ayah_from):1,end=t.mode==='ayat'?Number(t.ayah_to):max;
    if(!(start>=1&&end>=start&&end<=max)){unknown++;continue;}
    total+=end-start+1;earned+=coverage(num,start,end);
  }
  if(matches.length){
    if(!total)return {done:0,target:0,pct:null,label:'Menunggu data surah',detail:'Katalog surah/target belum tersedia'};
    return {done:earned,target:total,pct:Math.min(100,Math.round(100*earned/total)),label:`${earned}/${total} unit tuntas`,detail:unknown?'Sebagian target belum bisa dihitung':'Capaian ayat pada target lama'};
  }
  const done=[...bySurah.keys()].filter(isDone).length,target=Math.max(1,Number(student.target_surahs)||10);
  return {done,target,pct:Math.min(100,Math.round(done/target*100)),label:`${done}/${target} surah lengkap`,detail:'Target jumlah surah siswa (belum ada target kelas)'};
}
