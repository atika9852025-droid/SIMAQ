import * as XLSX from 'xlsx';
export function exportWorkbook(title,headers,rows,filename){
 const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet([[title],['Dibuat: '+new Date().toLocaleString('id-ID')],[],headers,...rows]);
 ws['!cols']=headers.map((h,i)=>({wch:Math.min(55,Math.max(16,h.length+4,...rows.map(r=>String(r[i]??'').length+2)))}));
 ws['!autofilter']={ref:`A4:${XLSX.utils.encode_col(headers.length-1)}${rows.length+4}`};ws['!freeze']={xSplit:0,ySplit:4};
 XLSX.utils.book_append_sheet(wb,ws,'Laporan');XLSX.writeFile(wb,filename);
}
export function studentTemplate(){exportWorkbook('Template Impor Siswa SIMAQ',['Nama Siswa','Kelas','Target Surah'],[['Contoh Siswa','VII A',10]],'template-impor-siswa-simaq.xlsx')}
export async function readStudentWorkbook(file){
 if(file.size>5*1024*1024)throw Error('Ukuran maksimal berkas 5 MB');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const rows=[];
 for(const sheetName of wb.SheetNames){const matrix=XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''});
 const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const headerAt=matrix.findIndex(r=>r.some(c=>['namasiswa','nama','namalengkap'].includes(norm(c)))&&r.some(c=>['kelas','class','namakelas'].includes(norm(c))));
 if(headerAt<0)continue;
 const hdr=matrix[headerAt].map(norm);const name=hdr.findIndex(h=>['namasiswa','nama','namalengkap'].includes(h));const cls=hdr.findIndex(h=>['kelas','class','namakelas'].includes(h));const target=hdr.findIndex(h=>['targetsurah','targetjumlahsurah','target'].includes(h));
 matrix.slice(headerAt+1).forEach((r,j)=>{if(!r.some(v=>String(v).trim()))return;const full_name=String(r[name]??'').trim(),class_name=String(r[cls]??'').trim();const target_surahs=target<0||String(r[target]??'').trim()===''?10:Number(r[target]);if(!full_name||!class_name||full_name.length>150||class_name.length>50||!Number.isInteger(target_surahs)||target_surahs<1||target_surahs>114)throw Error(`Data tidak valid pada sheet ${sheetName} baris ${headerAt+j+2}`);rows.push({full_name,class_name,target_surahs})})
 }
 if(!rows.length)throw Error('Tidak ada data siswa. Pastikan kolom Nama Siswa dan Kelas tersedia.');if(rows.length>5000)throw Error('Maksimal 5.000 siswa per berkas');return rows;
}
