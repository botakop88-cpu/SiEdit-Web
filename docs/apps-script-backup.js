const SUPABASE_URL = 'https://etczyvlsiebdvosxdegd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Y3p5dmxzaWViZHZvc3hkZWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzE5OTcsImV4cCI6MjA5OTQwNzk5N30.4IJ5s4gS1pPiq9YwDnDALCdvL9LgfRtjrGvU9GcdmBM';

// Warna tema hijau kayak budget tracker
const HDR = '#16a34a';    // header hijau gelap
const HDR2 = '#15803d';   // header hijau lebih gelap
const ROW = '#f0fdf4';    // baris hijau muda
const WHT = '#ffffff';    // putih
const GLD = '#eab308';    // kuning/emas
const RED = '#b91c1c';    // merah
const GRN = '#166534';    // hijau tua
const ACC = '#fef9c3';    // kuning highlight

function backupToSheet() {
  const v = fetchData("vendor?select=*&deleted_at=is.null&order=nama.asc");
  const j = fetchData("job?select=*,vendor:vendor_id(nama)&deleted_at=is.null&order=created_at.desc");
  const i = fetchData("invoice?select=*&deleted_at=is.null&order=created_at.desc");
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  buatRingkasan(ss, j, i);
  buatVendor(ss, v);
  buatJob(ss, j);
  buatInvoice(ss, i, j);

  ss.toast('✓ Backup SiEdit selesai!','SiEdit Auto-Backup',5);
}

function fetchData(e) {
  var r = UrlFetchApp.fetch(SUPABASE_URL+'/rest/v1/'+e, {
    headers: {apikey: SUPABASE_KEY, Authorization: 'Bearer '+SUPABASE_KEY},
    muteHttpExceptions: true
  });
  if (r.getResponseCode()!=200) throw Error('Supabase '+r.getResponseCode()+': '+r.getContentText());
  return JSON.parse(r.getContentText());
}

function hdr(s,n) { s.getRange(1,1,1,n).setBackground(HDR).setFontColor(WHT).setFontWeight('bold').setHorizontalAlignment('center').setFontFamily('Arial'); }
function brd(s,r,c) { if(r) s.getRange(1,1,r+1,c).setBorder(true,true,true,true,true,true,'#93c5fd',SpreadsheetApp.BorderStyle.SOLID); }
function colFmt(s,c,fmt) { if(c.length) s.getRange(1,1,c.length+1,1).setNumberFormat(fmt); }

function getSheet(ss,nm) {
  var s = ss.getSheetByName(nm);
  if(s) ss.deleteSheet(s);
  s = ss.insertSheet(nm);
  s.setFrozenRows(1);
  return s;
}

function buatRingkasan(ss,j,i) {
  var s = getSheet(ss,'Ringkasan');
  var total = j.length;
  var lunas = j.filter(function(x){return x.status_bayar=='Lunas'}).length;
  var blm = total - lunas;
  var m = new Date().toISOString().slice(0,7);
  var pjm = j.filter(function(x){return x.status_bayar=='Lunas' && (x.tanggal_lunas||'').slice(0,7)==m}).reduce(function(t,x){return t+Number(x.harga||0)},0);
  var invDue = i.reduce(function(t,x){return t+Number(x.total||0)},0);
  var tgl = Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'dd MMM yyyy HH:mm');

  // Baris 1: JUDUL
  s.getRange(1,1,1,3).mergeAcross().setValue('📊  S I E D I T  -  W E D D I N G  J O B  T R A C K E R').setBackground(HDR).setFontColor(WHT).setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
  // Baris 2: header summary
  s.getRange(2,1,1,3).setValues([['Ringkasan', '','']]);
  s.getRange(2,1,1,3).mergeAcross().setBackground(HDR2).setFontColor(WHT).setFontWeight('bold').setFontSize(11);
  // Baris 3-7: data
  var data = [
    ['Waktu Backup', tgl,''],
    ['Total Job', total, lunas],
    ['Belum Lunas', blm, blm>0 ? '⚠️ Perlu ditindaklanjuti' : '✅ Semua lunas'],
    ['Pendapatan Bulan Ini', 'Rp '+fmtRp(pjm),''],
    ['Total Invoice Belum Dibayar', 'Rp '+fmtRp(invDue),''],
  ];
  s.getRange(3,1,data.length,3).setValues(data);
  s.getRange(3,1,data.length,1).setFontWeight('bold').setBackground(ROW);
  s.getRange(3,2,data.length,1).setNumberFormat('#,##0');
  // warna kuning kalau ada yg belum lunas
  if(blm>0) s.getRange(4,2).setBackground(ACC).setFontWeight('bold');
  // Baris kosong
  s.getRange(8,1).setValue('📌 Job Deadline Terdekat (≤ 3 hari)').setFontWeight('bold').setFontSize(11).setBackground(HDR2).setFontColor(WHT);
  // Cari deadline dekat
  var soon = j.filter(function(x){return x.deadline && selisihHari(x.deadline)<=3 && selisihHari(x.deadline)>=0});
  if(soon.length) {
    s.getRange(9,1,soon.length,3).setValues(soon.map(function(x){return [x.nama_project, x.vendor?.nama||'-', x.deadline]}));
    s.getRange(9,1,soon.length,3).setBorder(true,true,true,true,true,true,'#d1d5db',SpreadsheetApp.BorderStyle.SOLID);
  } else {
    s.getRange(9,1).setValue('Tidak ada deadline dalam 3 hari ke depan.');
  }
  s.autoResizeColumns(1,3);
  s.setColumnWidth(2,200);
}

function buatVendor(ss,v) {
  var s = getSheet(ss,'Vendor');
  var h = ['Vendor','WhatsApp','Harga Kolase (Sudah Pilih)','Harga Kolase (Belum Pilih)','Harga Edit Full','Total Job','Dibuat'];
  s.getRange(1,1,1,h.length).setValues([h]); hdr(s,h.length);
  var rows = v.map(function(x){
    return [x.nama, x.whatsapp||'', Number(x.harga_kolase_sudah_pilih||0), Number(x.harga_kolase_belum_pilih||0), Number(x.harga_edit_full||0), (x.total_job||0), x.created_at||''];
  });
  if(rows.length) {
    s.getRange(2,1,rows.length,h.length).setValues(rows);
    s.getRange(2,3,rows.length,3).setNumberFormat('[$Rp-421]#,##0');
    s.getRange(2,1,rows.length,1).setFontWeight('bold');
  }
  brd(s,rows.length,h.length);
  s.autoResizeColumns(1,h.length);
  // Total harga per row
  s.getRange(2,h.length+1,rows.length,1).setNumberFormat('[$Rp-421]#,##0');
}

function buatJob(ss,j) {
  var s = getSheet(ss,'Job');
  var h = ['Project','Vendor','Jenis Edit','Harga','Deadline','Status Edit','Status Bayar','Status Cetak','Tanggal Lunas','Catatan','Dibuat'];
  s.getRange(1,1,1,h.length).setValues([h]); hdr(s,h.length);

  var rows = j.map(function(x){
    return [x.nama_project, x.vendor?.nama||'-', x.jenis_edit||'-', Number(x.harga||0), x.deadline||'-', x.status_edit, x.status_bayar, x.status_cetak, x.tanggal_lunas||'-', x.catatan||'-', x.created_at||''];
  });

  if(rows.length) {
    s.getRange(2,1,rows.length,h.length).setValues(rows);
    s.getRange(2,4,rows.length,1).setNumberFormat('[$Rp-421]#,##0');
    // Warna status bayar
    for(var r=0; r<rows.length; r++) {
      var col7 = s.getRange(r+2,7);
      if(rows[r][6]=='Lunas') { col7.setBackground('#dcfce7').setFontColor(GRN).setFontWeight('bold'); }
      else if(rows[r][6]=='Belum Bayar') { col7.setBackground('#fee2e2').setFontColor(RED).setFontWeight('bold'); }
      else if(rows[r][6]=='DP') { col7.setBackground('#fef9c3').setFontColor('#854d0e').setFontWeight('bold'); }

      var col6 = s.getRange(r+2,6);
      if(rows[r][5]=='Selesai') col6.setBackground('#dcfce7').setFontColor(GRN).setFontWeight('bold');
      else if(rows[r][5]=='Sedang Edit') col6.setBackground('#dbeafe').setFontColor('#1e40af').setFontWeight('bold');

      var col8 = s.getRange(r+2,8);
      if(rows[r][7]=='Sudah Cetak') col8.setBackground('#dcfce7').setFontColor(GRN).setFontWeight('bold');

      // Deadline merah kalau lewat
      if(rows[r][4]!='-') {
        var d = selisihHari(rows[r][4]);
        if(d<0) s.getRange(r+2,5).setFontColor(RED).setFontWeight('bold');
        else if(d<=3) s.getRange(r+2,5).setFontColor('#d97706').setFontWeight('bold');
      }
    }
  }
  brd(s,rows.length,h.length);
  s.autoResizeColumns(1,h.length);
}

function buatInvoice(ss,i,j) {
  var s = getSheet(ss,'Invoice');
  var h = ['Tanggal','Vendor','Project','Jenis Edit','Harga','Status Bayar','Total Invoice'];
  s.getRange(1,1,1,h.length).setValues([h]); hdr(s,h.length);
  var statusJob = {};
  j.forEach(function(job) { statusJob[job.nama_project] = job.status_bayar || 'Belum Bayar'; });
  var rows = [];
  i.forEach(function(inv) {
    var items = []; try { items = JSON.parse(inv.items_json); } catch(e) { items = []; }
    if(!items.length) items = [{nama:'-',jenis:'-',harga:0}];
    items.forEach(function(it) {
      var status = statusJob[it.nama] || 'Belum Bayar';
      rows.push([inv.tanggal||'-', inv.vendor_nama||'-', it.nama||'-', it.jenis||'-', Number(it.harga||0), status, Number(inv.total||0)]);
    });
  });
  if(rows.length) {
    s.getRange(2,1,rows.length,h.length).setValues(rows);
    s.getRange(2,5,rows.length,1).setNumberFormat('[$Rp-421]#,##0');
    s.getRange(2,7,rows.length,1).setNumberFormat('[$Rp-421]#,##0');
    for(var row=0; row<rows.length; row++) {
      var statusCell = s.getRange(row+2,6);
      if(rows[row][5] === 'Lunas') statusCell.setBackground('#dcfce7').setFontColor(GRN).setFontWeight('bold');
      else statusCell.setBackground('#fee2e2').setFontColor(RED).setFontWeight('bold');
    }
  }
  brd(s,rows.length,h.length);
  s.autoResizeColumns(1,h.length);
  s.setColumnWidth(1,100);
  s.setColumnWidth(2,150);
  s.setColumnWidth(3,220);
  s.setColumnWidth(4,180);
  s.setColumnWidth(5,110);
  s.setColumnWidth(6,125);
  s.setColumnWidth(7,130);
  s.getRange(1,1,Math.max(rows.length+1,2),h.length).setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
}

function selisihHari(t) {
  if(!t||t=='-') return 999;
  var parts = t.split('-');
  if(parts.length<3) return 999;
  var now = new Date(); now.setHours(0,0,0,0);
  var d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
  return Math.floor((d.getTime()-now.getTime())/(86400000));
}

function fmtRp(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function createDailyBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction()=='backupToSheet') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('backupToSheet').timeBased().everyDays(1).atHour(2).create();
}
