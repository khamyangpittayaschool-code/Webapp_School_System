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
      case 'getStudentList':
        return getStudentList(payload);
      case 'getStudentDetail':
        return getStudentDetail(payload);
      case 'handleUpdateStudent':
        return handleUpdateStudent(payload);
      case 'uploadImage':
        var url = uploadImage(payload.base64Data, payload.type, payload.filename);
        return url; 
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
