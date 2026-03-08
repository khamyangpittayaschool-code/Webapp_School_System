// ==========================================
// Google Apps Script File: Code.gs
// This matches the frontend logic from index.html
// ==========================================

var FOLDER_ID = '1gpeQHoqQ2s0O4pSPAoXak7inI7yv98rO'; // Replace
var SCHOOL_NAME = 'โรงเรียนคำยางพิทยา';
var SCHOOL_LOGO = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjcCn-aPSoZ9SzXJ2Vy_bO8rpfaSobTg8oVJArPdbZlL42_zWba24X5C8SlJg_VA1fR4oqPE8gLoyD_yg7SOEUtnXoavvmCKZXOMRjtZSItrLiuR7qRnnqH5ai1MlHIe3CwJVyS-0vyuUQ/s320/1041680867.jpg'; // Or leave empty ''

// --- Database Configuration Mapping ---
// กำหนดคู่ของชื่อ Module กับ ID ของ Google Sheet
var DB_CONFIG = {
CORE: '1on1KBuRb_AlXe8PFGgOjZXFiAqGlnuInAuDr7QrR1Xs',       // ฐานข้อมูลกลาง (นักเรียน, ผู้ใช้, ตั้งค่า)
ACADEMIC: '1GQyJy5n1X0mXjngeUwnxUg5wZI5bcnHzRp_IGfo-4yI', // ฐานข้อมูลวิชาการ
BUDGET: '1xPqN6QNNpHq6YXMTL2-EmKlAKQhYEkeFo0v_07EZtHY',     // ฐานข้อมูลงบประมาณ
HR: '10nDOjl37Q7zQ2TLaMurro4Qn3Rs2q-NAz9uzjH7BWi0',             // ฐานข้อมูลบุคคล
GENERAL: '1xmPJoEwo-DLy0L6ZBWApflcrJ26UJgwAZw5ezQrItEc',   // ฐานข้อมูลทั่วไป (เยี่ยมบ้าน, สารบรรณ)
STUDENT: '15dz3JDnJlUCC5O6Jn4rnT6V9I7PRAmOE1Jcj4_1WtwE'    // ฐานข้อมูลกิจการนักเรียน/สภานักเรียน
};

// Helper: เลือก DB ตาม Module
function getDbId(module) {
  return DB_CONFIG[module] || DB_CONFIG.CORE;
}

// --- Setup System (Run Once in Apps Script Editor) ---
function setupSystem() {
  Logger.log("Starting Setup System...");
  
  const sheetStructure = {
    CORE: [
      { name: "Users", headers: ["username", "password", "name", "role", "timestamp"] },
      { name: "Students", headers: ["student_id", "student_name", "class_level", "room", "status", "profile_image"] },
      { name: "Settings", headers: ["setting_key", "setting_value"] }
    ],
    ACADEMIC: [
      { name: "Assignments", headers: ["id", "title", "subject", "teacher", "status", "created_at"] },
      { name: "Schedule", headers: ["id", "teacher", "subject", "day", "time", "room"] },
      { name: "AcademicDocs", headers: ["docId", "workSystem", "details", "year", "term", "teacherId", "teacherName", "fileName", "fileUrl", "status", "comment", "approvedBy", "timestamp"] }
    ],
    BUDGET: [
      { name: "Transactions", headers: ["id", "date", "type", "description", "amount", "budget_code", "status"] }
    ],
    HR: [
      { name: "Staff", headers: ["id", "name", "position", "department", "start_date"] },
      { name: "Leave", headers: ["id", "staff_id", "leave_type", "start_date", "end_date", "reason", "status"] }
    ],
    GENERAL: [
      { name: "Saraban", headers: ["id", "doc_number", "date", "title", "from", "to", "status", "type", "timestamp"] },
      { name: "HomeVisit", headers: ["student_id", "visit_date", "status", "details", "teacher_summary", "lat", "long", "img_out", "img_in"] }
    ],
    STUDENT: [
      { name: "Behavior", headers: ["student_id", "date", "type", "points", "reason", "teacher"] }
    ]
  };

  for (let module in DB_CONFIG) {
    let dbId = DB_CONFIG[module];
    if (!dbId || dbId.includes("YOUR_")) {
      Logger.log(`Skipping ${module} - DB ID is not set.`);
      continue;
    }

    try {
      let ss = SpreadsheetApp.openById(dbId);
      Logger.log(`Setting up ${module} Database...`);
      
      let requiredSheets = sheetStructure[module];
      if (requiredSheets) {
        requiredSheets.forEach(function(req) {
          let sheet = ss.getSheetByName(req.name);
          if (!sheet) {
            sheet = ss.insertSheet(req.name);
            Logger.log(`Created new sheet: ${req.name} in ${module}`);
          }
          
          // Set headers if sheet is empty
          if (sheet.getLastRow() === 0) {
            sheet.appendRow(req.headers);
            // Optional: Format header row
            let headerRange = sheet.getRange(1, 1, 1, req.headers.length);
            headerRange.setFontWeight("bold").setBackground("#e0e0e0");
          }
        });
      }
    } catch (e) {
      Logger.log(`Error setting up ${module} (${dbId}): ${e.toString()}`);
    }
  }
  
  Logger.log("Setup System Complete!");
  return "Setup System Complete!";
}

// --- API Entry Points ---
function doGet(e) {
  var result = { status: 'success', message: 'API is running' };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Parse plaintext body to bypass CORS preflight
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload;
    
    var responseData = apiCall(action, payload);
    
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Authentication Login Check ---
// The frontend calls checkLogin via google.script.run
function checkLogin(username, password, dbId) {
  Logger.log("checkLogin Called: " + username + " (DB: " + dbId + ")");
  
  // Here, query the "Users" sheet from SpreadsheetApp.openById(dbId)
  // MOCK LOGIC: Simulate correct user login
  var simulatedDbUser = {
      username: 'admin',
      password: '123',
      name: 'ผู้ดูแลระบบ ตัวอย่าง',
      role: 'admin'
  };
  
  if(username === simulatedDbUser.username && password === simulatedDbUser.password) {
      return {
          status: 'success',
          data: {
              username: simulatedDbUser.username,
              name: simulatedDbUser.name,
              role: simulatedDbUser.role,
              token: Utilities.getUuid() // Optional simple token
          }
      };
  } else if (username === 'kru' && password === '123') {
      return {
          status: 'success',
          data: {
              username: username,
              name: 'ครูสมปอง ทดสอบ',
              role: 'teacher'
          }
      };
  }
  
  return { status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!' };
}

// --- Main API Router ---
function apiCall(action, payload) {
  try {
    // 1. Determine which DB to use based on action or payload.module
    // Default is CORE if not specified
    var dbModule = payload.module || 'CORE'; 
    var activeDbId = getDbId(dbModule);
    
    // Attach DB ID so functions can use it without hardcoding
    payload._dbId = activeDbId;

    switch(action) {
      case 'checkLogin':
        return checkLogin(payload.username, payload.password, activeDbId);
      case 'setupSystem':
        return { status: 'success', message: setupSystem() };
      case 'getStudentList':
        return getStudentList(payload);
      case 'getStudentDetail':
        return getStudentDetail(payload);
      case 'handleUpdateStudent':
        return handleUpdateStudent(payload);
      case 'uploadImage':
        var url = uploadImage(payload.base64Data, payload.type, payload.filename);
        return url;
      // --- Academic Submission Actions ---
      case 'getPendingDocs':
        return getPendingDocs(payload);
      case 'uploadAcademicDoc':
        return uploadAcademicDoc(payload);
      case 'approveDocument':
        return approveDocument(payload);
      case 'getRecentDocRequests':
        return getRecentDocRequests(payload);
      case 'requestDocNumber':
        return requestDocNumber(payload);
      // add more actions as needed...
      default:
        if (typeof this[action] === 'function') {
           return this[action](payload);
        }
        return { status: 'error', message: 'Action Not Found: ' + action };
    }
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

// --- API Functions ---
function getStudentList(payload) {
  // Replace with SpreadsheetApp logic mapping rows to object array
  var mockData = [
    { student_id: '12345', student_name: 'ด.ช. สมชาย รักดี', class_level: '1', room: '1', visit_status: 'รอเยี่ยม', profile_image: '' },
    { student_id: '12346', student_name: 'ด.ญ. สมใจ มุ่งมั่น', class_level: '2', room: '1', visit_status: 'เยี่ยมแล้ว', profile_image: '' },
    { student_id: '12347', student_name: 'นาย ธนธรณ์ ขยันยิ่ง', class_level: '4', room: '2', visit_status: 'ไม่สามารถเยี่ยมได้', profile_image: '' }
  ];
  return { status: 'success', data: mockData };
}

function getStudentDetail(payload) {
  var id = payload.studentId;
  // Fetch detailed row matching 'student_id'
  // Mock Data Return:
  var mock = {
    student_id: id,
    student_name: 'ด.ช. สมชาย รักดี',
    class_level: '1',
    room: '1',
    nickname: 'ชาย',
    birth_date: '2010-05-14',
    visit_status: 'รอเยี่ยม',
    age: 13,
    weight: 45,
    height: 155,
    religion: 'พุทธ',
    blood_type: 'O',
    nationality: 'ไทย',
    race: 'ไทย',
    birth_province: 'กรุงเทพมหานคร'
  };
  return { status: 'success', data: mock };
}

function handleUpdateStudent(payload) {
  // Save form object 'payload' back to spreadsheet using payload.student_id row
  // var dbId = payload._dbId; // Use correct DB based on module (GENERAL in this case)
  // var sheet = SpreadsheetApp.openById(dbId).getSheetByName('home_visit_data');
  // findRowAndReplace(sheet, payload.student_id, payload);
  Logger.log("Update Data DB["+payload._dbId+"]: " + JSON.stringify(payload));
  return { status: 'success', message: 'Data saved to Google Sheets' };
}

// File Upload to Google Drive (Images)
function uploadImage(base64Data, mimeType, fileName) {
  try {
    if(!FOLDER_ID || FOLDER_ID === 'YOUR_FOLDER_ID_HERE') return null; // Abort if unset
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    Logger.log("Upload Error: " + e.toString());
    return null; // Ensure graceful fail if folder is wrong
  }
}

// ==========================================
// ACADEMIC SUBMISSION FUNCTIONS
// ==========================================

/**
 * getPendingDocs - ดึงรายการเอกสารวิชาการ (ทั้งรออนุมัติ และประวัติ)
 * @param {Object} payload - { user: { username, role } }
 */
function getPendingDocs(payload) {
  try {
    var dbId = getDbId('ACADEMIC');
    var ss = SpreadsheetApp.openById(dbId);
    var sheet = ss.getSheetByName('AcademicDocs');
    if (!sheet || sheet.getLastRow() < 2) return { status: 'success', data: [] };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = [];

    for (var i = 1; i < data.length; i++) {
      var row = {};
      headers.forEach(function(h, idx) { row[h] = data[i][idx]; });

      // กำหนด isActionable: true ถ้ารออนุมัติ และ user เป็น admin/head
      var isActionable = (row.status === 'รออนุมัติ') && 
                         (payload && payload.user && (payload.user.role === 'admin' || payload.user.role === 'head'));
      row.isActionable = isActionable;
      row.type = row.workSystem; // map field name
      row.teacher = row.teacherName;
      row.link = row.fileUrl;
      rows.push(row);
    }
    // เรียงล่าสุดก่อน
    rows.sort(function(a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    return { status: 'success', data: rows };
  } catch (e) {
    Logger.log('getPendingDocs Error: ' + e.toString());
    return { status: 'error', message: e.toString() };
  }
}

/**
 * uploadAcademicDoc - อัพโหลดเอกสารวิชาการและบันทึกเมตาดาต้าลง Sheet
 * @param {Object} payload - { fileName, mimeType, content(base64), workSystem, details, year, term, teacherId, module }
 */
function uploadAcademicDoc(payload) {
  try {
    // 1. อัปโหลดไฟล์ไปยัง Google Drive
    var fileUrl = '';
    if (payload.content && FOLDER_ID && FOLDER_ID !== 'YOUR_FOLDER_ID_HERE') {
      var folder = DriveApp.getFolderById(FOLDER_ID);
      var blob = Utilities.newBlob(
        Utilities.base64Decode(payload.content),
        payload.mimeType || 'application/octet-stream',
        payload.fileName || 'document'
      );
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }

    // 2. บันทึกข้อมูลลง AcademicDocs Sheet
    var dbId = getDbId('ACADEMIC');
    var ss = SpreadsheetApp.openById(dbId);
    var sheet = ss.getSheetByName('AcademicDocs');
    if (!sheet) {
      sheet = ss.insertSheet('AcademicDocs');
      sheet.appendRow(['docId', 'workSystem', 'details', 'year', 'term', 'teacherId', 'teacherName', 'fileName', 'fileUrl', 'status', 'comment', 'approvedBy', 'timestamp']);
    }

    var docId = 'DOC_' + new Date().getTime();
    var teacherName = payload.teacherName || payload.teacherId || 'ไม่ระบุ';

    sheet.appendRow([
      docId,
      payload.workSystem || '',
      payload.details || '',
      payload.year || '',
      payload.term || '',
      payload.teacherId || '',
      teacherName,
      payload.fileName || '',
      fileUrl,
      'รออนุมัติ',
      '',   // comment
      '',   // approvedBy
      new Date().toISOString()
    ]);

    return { status: 'success', message: 'ส่งงานเรียบร้อยแล้ว', docId: docId, fileUrl: fileUrl };
  } catch (e) {
    Logger.log('uploadAcademicDoc Error: ' + e.toString());
    return { status: 'error', message: e.toString() };
  }
}

/**
 * approveDocument - อนุมัติหรือตีกลับเอกสาร
 * @param {Object} payload - { id(docId), act('Approve'|'Reject'), cmt, user }
 */
function approveDocument(payload) {
  try {
    var docId = payload.id;
    var act = payload.act; // 'Approve' or 'Reject'
    var comment = payload.cmt || '';
    var approver = (payload.user && payload.user.name) ? payload.user.name : 'ระบบ';

    var dbId = getDbId('ACADEMIC');
    var ss = SpreadsheetApp.openById(dbId);
    var sheet = ss.getSheetByName('AcademicDocs');
    if (!sheet) return { status: 'error', message: 'ไม่พบ Sheet AcademicDocs' };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var docIdCol = headers.indexOf('docId');
    var statusCol = headers.indexOf('status');
    var commentCol = headers.indexOf('comment');
    var approvedByCol = headers.indexOf('approvedBy');

    for (var i = 1; i < data.length; i++) {
      if (data[i][docIdCol] === docId) {
        var newStatus = act === 'Approve' ? 'อนุมัติเรียบร้อย' : ('ตีกลับ: ' + comment);
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        sheet.getRange(i + 1, commentCol + 1).setValue(comment);
        sheet.getRange(i + 1, approvedByCol + 1).setValue(approver);
        return { status: 'success', message: 'บันทึกผลการอนุมัติเรียบร้อย' };
      }
    }
    return { status: 'error', message: 'ไม่พบเอกสาร ID: ' + docId };
  } catch (e) {
    Logger.log('approveDocument Error: ' + e.toString());
    return { status: 'error', message: e.toString() };
  }
}

/**
 * getRecentDocRequests - ดึงประวัติการขอเลขหนังสือล่าสุด (Saraban)
 */
function getRecentDocRequests(payload) {
  try {
    var dbId = getDbId('GENERAL');
    var ss = SpreadsheetApp.openById(dbId);
    var sheet = ss.getSheetByName('Saraban');
    if (!sheet || sheet.getLastRow() < 2) return [];

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = [];
    for (var i = data.length - 1; i >= 1 && rows.length < 50; i--) {
      var row = {};
      headers.forEach(function(h, idx) { row[h] = data[i][idx]; });
      rows.push(row);
    }
    return rows;
  } catch (e) {
    Logger.log('getRecentDocRequests Error: ' + e.toString());
    return [];
  }
}

/**
 * requestDocNumber - ออกเลขหนังสือราชการ
 */
function requestDocNumber(payload) {
  try {
    var form = payload.form || payload;
    var docType = form.docType || 'ภายใน';
    var title = form.title || '';
    var receiver = form.receiver || '';
    var requester = form.requester || 'ไม่ระบุ';

    var dbId = getDbId('GENERAL');
    var ss = SpreadsheetApp.openById(dbId);
    var sheet = ss.getSheetByName('Saraban');
    if (!sheet) {
      sheet = ss.insertSheet('Saraban');
      sheet.appendRow(['id', 'doc_number', 'date', 'title', 'from', 'to', 'status', 'type', 'timestamp']);
    }

    // หาเลขที่ถัดไปสำหรับประเภทหนังสือ
    var year = new Date().getFullYear() + 543; // พ.ศ.
    var data = sheet.getDataRange().getValues();
    var count = data.filter(function(row) { return row[7] === docType && String(row[8]).includes(String(year)); }).length;
    var nextNum = count + 1;
    var prefix = docType === 'คำสั่ง' ? 'คส.' : (docType === 'ภายนอก' ? 'สง.' : 'บท.');
    var fullNumber = prefix + (nextNum < 10 ? '0' : '') + nextNum + '/' + year;

    var id = 'SB_' + new Date().getTime();
    sheet.appendRow([id, fullNumber, new Date().toLocaleDateString('th-TH'), title, requester, receiver, 'ออกแล้ว', docType, new Date().toISOString()]);

    return { status: true, docNumber: fullNumber };
  } catch (e) {
    Logger.log('requestDocNumber Error: ' + e.toString());
    return { status: false, message: e.toString() };
  }
}
