// ==========================================
// app.js - Frontend Application Logic
// School Management System (GitHub Pages Version)
// ==========================================

// --- API Configuration ---
const API_URL = 'https://script.google.com/macros/s/AKfycbywQ0W7vBq7d.../exec';

// Demo mode: ถ้า API_URL ยังไม่ได้ตั้งค่า จะใช้ระบบจำลองอัตโนมัติ
const IS_DEMO_MODE = !API_URL || API_URL.includes('AKfycbywQ0W7vBq7d...');

// ==========================================
// INITIAL SETUP SYSTEM
// ==========================================

function runInitialSetup() {
    const folderId = document.getElementById('setup-folder-id').value.trim();
    if (!folderId) {
        Swal.fire({
            icon: 'warning',
            title: 'กรุณาระบุ Folder ID',
            text: 'คุณต้องวาง Google Drive Folder ID ก่อนเริ่มตั้งค่า',
            background: '#1e293b',
            color: '#fff',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    const btn = document.getElementById('btn-setup');
    const progressDiv = document.getElementById('setup-progress');
    const progressBar = document.getElementById('setup-progress-bar');
    const progressText = document.getElementById('setup-progress-text');
    const progressDetail = document.getElementById('setup-progress-detail');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตั้งค่า...';
    progressDiv.classList.remove('hidden');

    // Setup steps simulation
    const subfolders = [
        { key: 'academic', name: '01-วิชาการ', icon: 'fa-graduation-cap', sheet: 'ข้อมูลวิชาการ' },
        { key: 'budget', name: '02-งบประมาณ', icon: 'fa-coins', sheet: 'ข้อมูลงบประมาณ' },
        { key: 'hr', name: '03-บุคคล', icon: 'fa-users', sheet: 'ข้อมูลบุคลากร' },
        { key: 'general', name: '04-ทั่วไป', icon: 'fa-building', sheet: 'ข้อมูลทั่วไป' },
        { key: 'council', name: '05-สภานักเรียน', icon: 'fa-bullhorn', sheet: 'ข้อมูลสภานักเรียน' },
        { key: 'backup', name: '06-สำรองข้อมูล', icon: 'fa-database', sheet: 'บันทึกการสำรอง' }
    ];

    // Build a flat list of all steps
    const steps = [];

    // Step 0: Connect
    steps.push({ text: 'กำลังเชื่อมต่อ Google Drive...', detail: 'ตรวจสอบ Folder ID: ' + folderId, action: null });

    // Step 1: Create Users Sheet at root folder
    steps.push({
        text: 'สร้าง Google Sheet: ข้อมูลผู้ใช้งาน (Users)',
        detail: 'เก็บ Username, Password, ชื่อ, ตำแหน่ง, สถานะ',
        action: (config) => {
            const sheetId = mockId();
            config.usersSheetId = sheetId;
        }
    });

    // Steps 2+: Create subfolder + sheet pairs
    subfolders.forEach(sf => {
        steps.push({
            text: 'สร้างโฟลเดอร์: ' + sf.name,
            detail: '',
            action: (config) => {
                const sfId = mockId();
                config.subfolders[sf.key] = { folderId: sfId, sheetId: '' };
                // update detail dynamically
                return 'Folder ID: ' + sfId;
            }
        });
        steps.push({
            text: 'สร้าง Google Sheet: ' + sf.sheet,
            detail: '',
            action: (config) => {
                const sheetId = mockId();
                config.subfolders[sf.key].sheetId = sheetId;
                return 'Sheet ID: ' + sheetId + ' → ' + sf.name;
            }
        });
    });

    // Final step
    steps.push({ text: 'บันทึกการตั้งค่า...', detail: 'เกือบเสร็จแล้ว!', action: null });

    const totalSteps = steps.length;
    let currentStepIdx = 0;
    const config = { rootFolderId: folderId, usersSheetId: '', subfolders: {} };

    // Generate mock IDs
    function mockId() {
        return 'mock_' + Math.random().toString(36).substring(2, 15);
    }

    const interval = setInterval(() => {
        if (currentStepIdx < totalSteps) {
            const step = steps[currentStepIdx];

            // Execute action if any
            let dynamicDetail = step.detail;
            if (step.action) {
                const result = step.action(config);
                if (result) dynamicDetail = result;
            }

            // Update progress
            const pct = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
            progressBar.style.width = pct + '%';
            progressText.innerText = step.text;
            progressDetail.innerText = dynamicDetail;

            currentStepIdx++;
        } else {
            clearInterval(interval);

            setTimeout(() => {
                // Save config to localStorage
                localStorage.setItem('SCHOOL_GDRIVE_CONFIG', JSON.stringify(config));
                localStorage.setItem('SCHOOL_SETUP_COMPLETE', 'true');

                // Update the googleDriveFolderId variable
                if (typeof googleDriveFolderId !== 'undefined') {
                    googleDriveFolderId = folderId;
                }

                progressBar.style.width = '100%';
                progressText.innerText = 'ตั้งค่าเสร็จสมบูรณ์!';
                progressDetail.innerText = 'ระบบพร้อมใช้งาน';

                const totalSheets = subfolders.length + 1; // +1 for Users sheet

                setTimeout(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'ตั้งค่าระบบเสร็จสมบูรณ์!',
                        html: `สร้างโฟลเดอร์ย่อย <b>${subfolders.length}</b> โฟลเดอร์<br>และ Google Sheets <b>${totalSheets}</b> ไฟล์<br><small class="text-slate-400">(รวม Sheet ผู้ใช้งาน + บัญชี admin เริ่มต้น)</small><br><br>กรุณาเข้าสู่ระบบด้วย <b>admin</b> / <b>admin</b>`,
                        background: '#1e293b',
                        color: '#fff',
                        confirmButtonColor: '#3b82f6',
                        confirmButtonText: 'ไปหน้า Login'
                    }).then(() => {
                        showLogin();
                    });
                }, 800);
            }, 600);
        }
    }, 700);
}

function getSubfolderConfig() {
    const storedConfig = localStorage.getItem('SCHOOL_GDRIVE_CONFIG');
    if (storedConfig) {
        try {
            return JSON.parse(storedConfig);
        } catch (e) { return null; }
    }
    return null;
}

// ผู้ใช้ในโหมด Demo
const DEMO_USERS = [
    { username: 'admin', password: '123', name: 'ผู้ดูแลระบบ', role: 'admin' },
    { username: 'kru', password: '123', name: 'ครูสมปอง ทดสอบ', role: 'teacher' }
];

// ===================== DEMO MOCK DATA =====================

const DEMO_STUDENTS = [
    { student_id: '65001', student_name: 'ด.ช. สมชาย รักเรียน', class_level: '1', room: '1', visit_status: 'เยี่ยมแล้ว', profile_image: '', nickname: 'ชาย', birth_date: '2554-05-15', age: '14', weight: '45', height: '155', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'A', previous_school: 'ร.ร. อนุบาลท่าม่วง', congenital_disease: 'ไม่มี' },
    { student_id: '65002', student_name: 'ด.ญ. สมหญิง ใจดี', class_level: '2', room: '2', visit_status: 'เยี่ยมแล้ว', profile_image: '', nickname: 'หญิง', birth_date: '2553-08-20', age: '15', weight: '42', height: '152', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'B', previous_school: 'ร.ร. วัดดอนตะโก', congenital_disease: 'ไม่มี' },
    { student_id: '65003', student_name: 'ด.ช. ธนกร วงศ์สว่าง', class_level: '1', room: '2', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'เก่ง', birth_date: '2554-02-10', age: '14', weight: '50', height: '160', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'O', previous_school: 'ร.ร. อนุบาลราชบุรี', congenital_disease: 'ไม่มี' },
    { student_id: '65004', student_name: 'ด.ญ. พิมพ์ชนก แสงทอง', class_level: '3', room: '1', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'พิม', birth_date: '2552-11-03', age: '16', weight: '48', height: '158', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'AB', previous_school: 'ร.ร. วัดเขาลั่นทม', congenital_disease: 'ภูมิแพ้' },
    { student_id: '65005', student_name: 'ด.ช. วรเมธ พงษ์ประเสริฐ', class_level: '2', room: '1', visit_status: 'เยี่ยมแล้ว', profile_image: '', nickname: 'เมธ', birth_date: '2553-06-25', age: '15', weight: '55', height: '168', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'A', previous_school: 'ร.ร. ประถมราชบุรี', congenital_disease: 'ไม่มี' },
    { student_id: '65006', student_name: 'ด.ญ. นภัสสร สุดสวย', class_level: '1', room: '3', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'นภ', birth_date: '2554-09-12', age: '14', weight: '40', height: '150', nationality: 'ไทย', race: 'ไทย', religion: 'อิสลาม', blood_type: 'B', previous_school: 'ร.ร. บ้านห้วยสำนัก', congenital_disease: 'ไม่มี' },
    { student_id: '65007', student_name: 'ด.ช. ปัณณวิชญ์ ศรีสุข', class_level: '3', room: '2', visit_status: 'ไม่สามารถเยี่ยมได้', profile_image: '', nickname: 'ปัณ', birth_date: '2552-01-30', age: '16', weight: '58', height: '170', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'O', previous_school: 'ร.ร. ท่าม่วงวิทยา', congenital_disease: 'ไม่มี' },
    { student_id: '65008', student_name: 'ด.ญ. กัญญาวีร์ ตันติพงศ์', class_level: '2', room: '3', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'วีร์', birth_date: '2553-04-07', age: '15', weight: '44', height: '155', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'A', previous_school: 'ร.ร. คุรุราษฎร์', congenital_disease: 'หอบหืด' },
    { student_id: '65009', student_name: 'ด.ช. ภูริต เจริญสุข', class_level: '1', room: '1', visit_status: 'เยี่ยมแล้ว', profile_image: '', nickname: 'ริต', birth_date: '2554-12-18', age: '13', weight: '43', height: '153', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'B', previous_school: 'ร.ร. อนุบาลบ้านโป่ง', congenital_disease: 'ไม่มี' },
    { student_id: '65010', student_name: 'ด.ญ. ณัฐณิชา วรรณดี', class_level: '3', room: '3', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'ณิชา', birth_date: '2552-07-22', age: '16', weight: '46', height: '156', nationality: 'ไทย', race: 'ไทย', religion: 'คริสต์', blood_type: 'O', previous_school: 'ร.ร. ดรุณาราชบุรี', congenital_disease: 'ไม่มี' },
    { student_id: '65011', student_name: 'ด.ช. ศุภกร มั่นคง', class_level: '2', room: '2', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'กร', birth_date: '2553-10-05', age: '15', weight: '52', height: '163', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'AB', previous_school: 'ร.ร. วัดหนองตาหลวง', congenital_disease: 'ไม่มี' },
    { student_id: '65012', student_name: 'ด.ญ. อริสรา ปิ่นทอง', class_level: '1', room: '2', visit_status: 'รอเยี่ยม', profile_image: '', nickname: 'อริ', birth_date: '2554-03-28', age: '14', weight: '38', height: '148', nationality: 'ไทย', race: 'ไทย', religion: 'พุทธ', blood_type: 'A', previous_school: 'ร.ร. อนุบาลดำเนิน', congenital_disease: 'ไม่มี' }
];

const DEMO_SARABAN_DOCS = [
    { doc_number: 'ศธ 0423/001', date: '2567-10-01', title: 'ขอให้ส่งนักเรียนเข้าร่วมกิจกรรม', from: 'สพป.รบ.1', to: 'ผู้อำนวยการ', status: 'ออกแล้ว' },
    { doc_number: 'ศธ 0423/002', date: '2567-10-05', title: 'แจ้งกำหนดการประชุมผู้บริหาร', from: 'สพป.รบ.1', to: 'ผู้อำนวยการ', status: 'ออกแล้ว' },
    { doc_number: 'ศธ 0423/003', date: '2567-10-10', title: 'ส่งรายงานผลการดำเนินงาน', from: 'ฝ่ายวิชาการ', to: 'สพป.รบ.1', status: 'ออกแล้ว' },
    { doc_number: 'ศธ 0423/004', date: '2567-10-15', title: 'ขอเชิญประชุมคณะกรรมการสถานศึกษา', from: 'โรงเรียน', to: 'คณะกรรมการ', status: 'ออกแล้ว' },
    { doc_number: 'ศธ 0423/005', date: '2567-10-20', title: 'รายงานผลการเยี่ยมบ้านนักเรียน', from: 'ฝ่ายทั่วไป', to: 'ผู้อำนวยการ', status: 'ออกแล้ว' }
];

const DEMO_ACADEMIC_DOCS = [
    { id: 'DOC001', fileName: 'แผนการจัดการเรียนรู้_วิทยาศาสตร์_ม1.pdf', workSystem: 'curriculum', details: 'แผนการจัดการเรียนรู้รายวิชาวิทยาศาสตร์ ม.1 ภาคเรียนที่ 1/2567', year: '2567', term: '1', teacherId: 'kru', teacherName: 'ครูสมปอง ทดสอบ', status: 'Pending', uploadDate: '2567-10-01' },
    { id: 'DOC002', fileName: 'รายงานผลสัมฤทธิ์_คณิตศาสตร์_ม2.pdf', workSystem: 'evaluation', details: 'รายงานผลสัมฤทธิ์ทางการเรียน วิชาคณิตศาสตร์ ม.2', year: '2567', term: '1', teacherId: 'kru02', teacherName: 'ครูวิชัย ศิริ', status: 'Approved', uploadDate: '2567-09-28' },
    { id: 'DOC003', fileName: 'บันทึกการนิเทศ_ภาษาไทย.pdf', workSystem: 'supervision', details: 'บันทึกการนิเทศการสอน กลุ่มสาระภาษาไทย', year: '2567', term: '1', teacherId: 'admin', teacherName: 'ผู้ดูแลระบบ', status: 'Approved', uploadDate: '2567-09-25' },
    { id: 'DOC004', fileName: 'ตารางสอนครู_ภาคเรียน1.xlsx', workSystem: 'schedule', details: 'ตารางสอนครูทั้งหมด ภาคเรียนที่ 1/2567', year: '2567', term: '1', teacherId: 'admin', teacherName: 'ผู้ดูแลระบบ', status: 'Pending', uploadDate: '2567-10-03' },
    { id: 'DOC005', fileName: 'ข้อสอบกลางภาค_ม3.pdf', workSystem: 'exams', details: 'ข้อสอบกลางภาค วิชาสังคมศึกษา ม.3', year: '2567', term: '1', teacherId: 'kru', teacherName: 'ครูสมปอง ทดสอบ', status: 'Rejected', uploadDate: '2567-10-02', comment: 'กรุณาแก้ไขข้อ 15-20 ให้สอดคล้องกับตัวชี้วัด' },
    { id: 'DOC006', fileName: 'สมุดเช็คเวลาเรียน_ม1.pdf', workSystem: 'attendance', details: 'บันทึกการเข้าเรียนนักเรียน ม.1/1 เดือนกันยายน', year: '2567', term: '1', teacherId: 'kru', teacherName: 'ครูสมปอง ทดสอบ', status: 'Approved', uploadDate: '2567-10-01' }
];

// --- Global App State (shared via window) ---
// NOTE: currentUser is declared as `var currentUser` in index.html <script> block.
// Do NOT redeclare it here to avoid shadowing.
var studentsData = [];
var currentStudent = null;
var currentStep = 1;
var allDocsData = [];
var myChart = null;

// --- Mock API Wrapper ---
// สร้าง google object เพื่อให้ทำงานได้ทั้งบน Live Server (demo) และ Google Apps Script
var google = {
    script: {
        run: {
            withSuccessHandler: function (callback) {
                var makeCall = function (action, data) {
                    if (IS_DEMO_MODE) {
                        console.log('[DEMO] API Call:', action, data);
                        setTimeout(function () { callback({ status: 'success', data: [] }); }, 300);
                        return;
                    }
                    fetch(API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ action: action, payload: data || {} })
                    }).then(function (r) { return r.json(); }).then(function (result) { callback(result); })
                        .catch(function (err) { console.error(err); callback({ status: 'error', message: err.message }); });
                };
                return {
                    apiCall: makeCall,
                    checkLogin: function (u, p) {
                        if (IS_DEMO_MODE) {
                            var user = DEMO_USERS.find(function (x) { return x.username === u && x.password === p; });
                            var result = user
                                ? { status: 'success', data: { username: user.username, name: user.name, role: user.role, token: 'demo-token' } }
                                : { status: 'error', message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
                            setTimeout(function () { callback(result); }, 300);
                            return;
                        }
                        makeCall('checkLogin', { username: u, password: p });
                    },
                    getPendingDocs: function (user) { return makeCall('getPendingDocs', { user: user }); },
                    uploadAcademicDoc: function (payload) { return makeCall('uploadAcademicDoc', payload); },
                    approveDocument: function (id, act, cmt, user) { return makeCall('approveDocument', { id: id, act: act, cmt: cmt, user: user }); },
                    uploadImage: function (b64, type, fname) { return makeCall('uploadImage', { base64Data: b64, type: type, filename: fname }); },
                    getRecentDocRequests: function () { return makeCall('getRecentDocRequests', {}); },
                    requestDocNumber: function (form) { return makeCall('requestDocNumber', { form: form }); }
                };
            }
        }
    }
};

// ==========================================
// PAGE NAVIGATION
// ==========================================
function showPage(pageId) {
    document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active', 'bg-white/10', 'text-white');
        if (l.dataset.page === pageId) l.classList.add('active', 'bg-white/10', 'text-white');
    });
    const titles = {
        'academic': 'บริหารงานวิชาการ', 'budget': 'บริหารงบประมาณ', 'hr': 'บริหารงานบุคคล',
        'general': 'บริหารงานทั่วไป', 'document': 'เอกสารทะเบียน', 'student-council': 'สภานักเรียน', 'setting': 'ตั้งค่าระบบ'
    };
    const title = titles[pageId] || 'ระบบโรงเรียน';
    const h = document.getElementById('header-title'); if (h) h.innerText = title;
    const hm = document.getElementById('header-title-mobile'); if (hm) hm.innerText = title;
}

function openPage(pageId) { showPage(pageId); }

// ==========================================
// HOME VISIT SYSTEM (ระบบเยี่ยมบ้าน)
// ==========================================
function openHomeVisitSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('home-visit-system').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('detail-view').classList.add('hidden');
    const hm = document.getElementById('header-title-mobile'); if (hm) hm.innerText = 'ระบบเยี่ยมบ้าน';
    loadStudentList();
}
function closeHomeVisitSystem() {
    document.getElementById('home-visit-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
    const hm = document.getElementById('header-title-mobile'); if (hm) hm.innerText = 'ฝ่ายทั่วไป';
}
function showDashboardHomeVisit() {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
}
function loadStudentList() {
    showLoading('กำลังโหลดรายชื่อนักเรียน...');
    setTimeout(() => {
        hideLoading();
        // If studentsData is already populated, don't overwrite it with default, so the updates persist in the mock session.
        if (!studentsData || studentsData.length === 0) {
            studentsData = [
                { student_id: '65001', student_name: 'ด.ช. สมชาย รักเรียน', class_level: '1', room: '1', visit_status: 'รอเยี่ยม', profile_image: '' },
                { student_id: '65002', student_name: 'ด.ญ. สมหญิง ใจดี', class_level: '2', room: '2', visit_status: 'เยี่ยมแล้ว', profile_image: '' },
                { student_id: '65003', student_name: 'ด.ช. ขยัน สุดยอด', class_level: '3', room: '1', visit_status: 'ไม่สามารถเยี่ยมได้', profile_image: '' }
            ];
        }
        renderStudentList(studentsData);
    }, 600);
}
function renderStudentList(data) {
    const container = document.getElementById('student-list-container');
    document.getElementById('total-count').innerText = `${data.length} คน`;
    const visited = data.filter(s => s.visit_status === 'เยี่ยมแล้ว').length;
    document.getElementById('stat-visited').innerText = visited;
    document.getElementById('stat-pending').innerText = data.length - visited;
    if (data.length === 0) { container.innerHTML = `<div class="text-center p-8 text-slate-400">ไม่พบข้อมูล</div>`; return; }
    container.innerHTML = data.map(s => {
        const isVisited = s.visit_status === 'เยี่ยมแล้ว', cannotVisit = s.visit_status === 'ไม่สามารถเยี่ยมได้';
        let color = 'slate', icon = 'clock', text = s.visit_status || 'รอเยี่ยม';
        if (isVisited) { color = 'amber'; icon = 'check-circle'; } else if (cannotVisit) { color = 'red'; icon = 'circle-xmark'; }
        return `<div class="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100 hover:border-blue-300 transition cursor-pointer group" onclick="openStudentDetail('${s.student_id}')">
            <img src="${s.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURI(s.student_name) + '&background=random&color=fff'}" class="w-14 h-14 rounded-2xl object-cover">
            <div class="flex-1 min-w-0"><h4 class="font-bold text-slate-800 text-sm truncate">${s.student_name}</h4>
            <p class="text-[10px] text-slate-500 mt-1"><span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">ม.${s.class_level}/${s.room}</span></p></div>
            <span class="text-[10px] bg-${color}-50 text-${color}-600 px-2 py-1 rounded-lg border border-${color}-100 font-bold">${text}</span>
        </div>`;
    }).join('');
}
function openStudentDetail(id) {
    showLoading('กำลังเตรียมข้อมูล...');
    let localData = studentsData.find(s => s.student_id === id) || { student_id: id, student_name: 'Demo Student' };
    setTimeout(() => {
        hideLoading();
        currentStudent = localData;
        populateForm(currentStudent);
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('detail-view').classList.remove('hidden');
        setStep(1);
    }, 500);
}
function populateForm(data) {
    document.getElementById('detail-name').innerText = data.student_name || 'ไม่ระบุชื่อ';
    document.getElementById('detail-id').innerText = data.student_id || '-';
    document.getElementById('detail-class').innerText = data.class_level && data.room ? `${data.class_level}/${data.room}` : '-';
    document.getElementById('detail-img').src = data.profile_image || `https://ui-avatars.com/api/?name=${encodeURI(data.student_name || 'S')}&background=random&color=fff`;
    const sb = document.getElementById('detail-status-badge');
    sb.innerText = data.visit_status || 'รอเยี่ยม';
    sb.className = data.visit_status === 'เยี่ยมแล้ว' ? 'text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold' :
        data.visit_status === 'ไม่สามารถเยี่ยมได้' ? 'text-[10px] px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold' :
            'text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium';
    document.getElementById('visit-form').reset();
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val != null && val !== '') { el.value = val; el.classList.add('filled-data'); } };
    setVal('input-student_id', data.student_id); setVal('input-class_level', data.class_level);
    const fields = ['nickname', 'visit_status', 'last_visit_date', 'informant_relation', 'photo_source', 'map_lat', 'map_long', 'birth_date', 'age', 'weight', 'height', 'birth_province', 'birth_amphoe', 'birth_tambon', 'nationality', 'race', 'religion', 'blood_type', 'previous_school', 'move_in_reason', 'disadvantage_type', 'disability_type', 'congenital_disease', 'teacher_summary'];
    fields.forEach(f => setVal('input-' + f, data[f]));
    ['nationality', 'race'].forEach(f => { const el = document.getElementById('input-' + f); if (el && !el.value) el.value = 'ไทย'; });
    if (data.profile_image) { document.getElementById('detail-img').src = data.profile_image; }
    if (data.img_house_outside) { const el = document.getElementById('prev-out'); if (el) { el.src = data.img_house_outside; el.classList.remove('hidden'); } }
    if (data.img_house_inside) { const el = document.getElementById('prev-in'); if (el) { el.src = data.img_house_inside; el.classList.remove('hidden'); } }
}
function setStep(n) {
    if (n < 1 || n > 8) return;
    currentStep = n;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('active'));
    const panel = document.getElementById(`step-${n}`); if (panel) panel.classList.add('active');
    const btn = document.querySelector(`.step-btn[data-step="${n}"]`);
    if (btn) { btn.classList.add('active'); const nav = document.getElementById('wizard-nav'); if (nav) nav.scrollTo({ left: btn.offsetLeft - nav.clientWidth / 2 + btn.clientWidth / 2, behavior: 'smooth' }); }
    const btnBack = document.getElementById('btn-back'); if (btnBack) btnBack.style.visibility = n === 1 ? 'hidden' : 'visible';
    const btnNext = document.getElementById('btn-next'), btnSave = document.getElementById('btn-save-main');
    if (btnNext && btnSave) { if (n === 8) { btnNext.classList.add('hidden'); btnSave.classList.add('animate-bounce'); setTimeout(() => btnSave.classList.remove('animate-bounce'), 1000); } else { btnNext.classList.remove('hidden'); } }
}
function navStep(dir) { setStep(currentStep + dir); }
function calculateAge() {
    const bd = document.getElementById('input-birth_date')?.value; if (!bd) return;
    const today = new Date(), birthDate = new Date(bd);
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() - birthDate.getMonth() < 0 || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    document.getElementById('input-age').value = age;
}
function getLocation() {
    if (!navigator.geolocation) { Swal.fire('Error', 'เบราว์เซอร์ไม่รองรับ Geolocation', 'error'); return; }
    navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('input-map_lat').value = pos.coords.latitude;
        document.getElementById('input-map_long').value = pos.coords.longitude;
        Swal.fire({ icon: 'success', title: 'ดึงพิกัดสำเร็จ', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    }, err => Swal.fire('Error', 'ไม่สามารถเข้าถึงตำแหน่งได้: ' + err.message, 'error'), { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
}
function openNavigation() {
    const lat = document.getElementById('input-map_lat')?.value, lng = document.getElementById('input-map_long')?.value;
    if (lat && lng) window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    else Swal.fire('Info', 'ไม่พบข้อมูลพิกัด กรุณาดึงตำแหน่งก่อน', 'warning');
}
function applyFilters() { } function resetFilters() { } function populateFilters() { }
function handleImageUpload(inputEl, hiddenId, prevId, type) {
    const file = inputEl.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { Swal.fire('ไฟล์ขนาดใหญ่', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning'); inputEl.value = ''; return; }
    showLoading('กำลังอัปโหลดรูปภาพ...');
    const reader = new FileReader();
    reader.onload = function (e) {
        setTimeout(() => {
            hideLoading();
            const url = e.target.result; // Use Base64 directly as URL for mockup
            const hid = document.getElementById('input-' + hiddenId); if (hid) hid.value = url;
            const prev = document.getElementById(prevId); if (prev) { prev.src = url; prev.classList.remove('hidden'); }
            Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
        }, 800);
    };
    reader.readAsDataURL(file);
}
function viewImage(src) {
    if (!src) return;
    Swal.fire({ imageUrl: src, imageAlt: 'Image', showCloseButton: true, showConfirmButton: false });
}
function saveVisitData() {
    const form = document.getElementById('visit-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const formData = new FormData(form);
    const dataObj = {};
    for (let [k, v] of formData.entries()) dataObj[k] = v;

    // update mock studentsData array
    const stId = document.getElementById('input-student_id')?.value;
    const stIndex = studentsData.findIndex(s => s.student_id === stId);
    if (stIndex !== -1) {
        studentsData[stIndex].visit_status = document.getElementById('input-visit_status')?.value || 'เยี่ยมแล้ว';
        studentsData[stIndex] = { ...studentsData[stIndex], ...dataObj };
    }

    showLoading('กำลังบันทึกข้อมูล...');
    setTimeout(() => {
        hideLoading();
        Swal.fire({
            icon: 'success',
            title: '(Demo) บันทึกสำเร็จ!',
            text: 'ระบบได้อัปเดตสถานะการเยี่ยมบ้านแล้ว',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            showDashboardHomeVisit();
            loadStudentList();
        });
    }, 1000);
}

// ==========================================
// GENERAL SUBSYSTEMS NAVIGATION
// ==========================================

function openStudentAffairsSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('student-affairs-system').classList.remove('hidden');
    loadAffairsRecords();
}
function closeStudentAffairsSystem() {
    document.getElementById('student-affairs-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

// ==========================================
// STUDENT AFFAIRS SYSTEM LOGIC
// ==========================================

let mockAffairsRecords = [
    { studentName: 'ด.ช. เกเร ไม่เรียน', classRoom: 'ม.3/2', type: 'deduct', category: 'หนีเรียน', points: 40, time: '12:30', recorder: 'ครูสมชาย' },
    { studentName: 'ด.ญ. ใจดี มีเมตตา', classRoom: 'ม.5/1', type: 'good', category: 'ช่วยเหลืองานโรงเรียน', points: 15, time: '09:15', recorder: 'ครูสมศรี' }
];

const mockMisconductRules = {
    'เบา': [
        { id: 101, name: 'มาโรงเรียนสาย', points: 5 },
        { id: 102, name: 'ไม่มาเข้าแถวเคารพธงชาติ', points: 5 },
        { id: 103, name: 'แต่งกายผิดระเบียบ / ผิดวัน', points: 5 },
        { id: 104, name: 'ทรงผมผิดระเบียบ', points: 5 },
        { id: 105, name: 'ไว้เล็บยาว / ทาสีเล็บ', points: 5 },
        { id: 106, name: 'ใส่เครื่องประดับที่ไม่อนุญาต', points: 5 },
        { id: 107, name: 'ไม่พกบัตรประจำตัวนักเรียน', points: 5 },
        { id: 108, name: 'นำอาหารมารับประทานในห้องเรียน', points: 5 },
        { id: 109, name: 'ทิ้งขยะไม่เป็นที่', points: 5 },
        { id: 110, name: 'ไม่ทำเวรทำความสะอาดห้องเรียน', points: 5 },
        { id: 111, name: 'พูดจาไม่สุภาพ / ใช้คำหยาบ', points: 5 },
        { id: 112, name: 'เล่นหยอกล้อแรงเกินไป', points: 10 },
        { id: 113, name: 'ใช้โทรศัพท์มือถือในเวลาเรียนโดยไม่ได้รับอนุญาต', points: 10 },
        { id: 114, name: 'ไม่ตั้งใจเรียน / หลับในห้องเรียน', points: 10 }
    ],
    'ปานกลาง': [
        { id: 201, name: 'หลบหนีการเรียน (โดดเรียน)', points: 15 },
        { id: 202, name: 'ออกนอกบริเวณโรงเรียนโดยไม่ได้รับอนุญาต', points: 20 },
        { id: 203, name: 'ปลอมแปลงอักษร ยับยั้ง หรือทำลายเอกสารของโรงเรียน', points: 20 },
        { id: 204, name: 'ปลอมแปลงลายมือชื่อผู้ปกครองหรือครู', points: 20 },
        { id: 205, name: 'นำหนังสือหรือสื่อที่ไม่เหมาะสมมาโรงเรียน', points: 15 },
        { id: 206, name: 'ทุจริตในการสอบ (การสอบเก็บคะแนน)', points: 20 },
        { id: 207, name: 'ทำลายทรัพย์สินของโรงเรียน (ความเสียหายเล็กน้อย)', points: 20 },
        { id: 208, name: 'ก่อความวุ่นวายในโรงเรียน', points: 20 },
        { id: 209, name: 'แสดงกิริยาก้าวร้าวต่อเพื่อนนักเรียน', points: 20 },
        { id: 210, name: 'เล่นการพนันรูปแบบเบาบาง', points: 20 },
        { id: 211, name: 'พกพาบุหรี่ หรือบุหรี่ไฟฟ้า', points: 20 },
        { id: 212, name: 'ทะเลาะวิวาท (ไม่มีการบาดเจ็บรุนแรง)', points: 20 },
        { id: 213, name: 'ไม่ให้ความร่วมมือในการตรวจค้นของครู', points: 15 }
    ],
    'ร้ายแรง': [
        { id: 301, name: 'ทะเลาะวิวาทหรือทำร้ายร่างกายผู้อื่น (มีการบาดเจ็บ)', points: 30 },
        { id: 302, name: 'ข่มขู่ รีดไถ หรือรังแกผู้อื่น', points: 30 },
        { id: 303, name: 'ลักทรัพย์หรือเจตนาขโมยสิ่งของ', points: 40 },
        { id: 304, name: 'สูบบุหรี่ หรือสูบบุหรี่ไฟฟ้าในบริเวณโรงเรียน', points: 30 },
        { id: 305, name: 'ดื่มสุรา หรือนำเครื่องดื่มแอลกอฮอล์เข้ามาในโรงเรียน', points: 40 },
        { id: 306, name: 'เล่นการพนันเอาทรัพย์สิน', points: 30 },
        { id: 307, name: 'ทุจริตในการสอบ (สอบกลางภาค/ปลายภาค)', points: 30 },
        { id: 308, name: 'มีพฤติกรรมชู้สาวหรือทำอนาจาร', points: 40 },
        { id: 309, name: 'นำบุคคลภายนอกเข้ามาก่อความวุ่นวาย', points: 30 },
        { id: 310, name: 'ทำลายทรัพย์สินของโรงเรียน (ความเสียหายมาก)', points: 40 },
        { id: 311, name: 'แสดงกิริยาก้าวร้าว หมิ่นประมาทต่อครูอาจารย์', points: 40 },
        { id: 312, name: 'ดูหมิ่นสถาบัน ชาติ ศาสนา พระมหากษัตริย์', points: 40 }
    ],
    'ร้ายแรงมาก': [
        { id: 401, name: 'พกพาอาวุธทุกชนิดเข้ามาในโรงเรียน', points: 50 },
        { id: 402, name: 'ทำร้ายร่างกายผู้อื่นจนได้รับบาดเจ็บสาหัส', points: 100 },
        { id: 403, name: 'ค้ายาเสพติด หรือมีสารเสพติดไว้ในครอบครอง', points: 100 },
        { id: 404, name: 'เสพยาเสพติดให้โทษ', points: 100 },
        { id: 405, name: 'มีพฤติกรรมค้าประเวณี หรือจัดหาเพื่อการอนาจาร', points: 100 },
        { id: 406, name: 'ก่ออาชญากรรม หรือเป็นสมาชิกแก๊งอันธพาล', points: 100 },
        { id: 407, name: 'นำอาวุธไปลอบทำร้ายผู้อื่น', points: 100 },
        { id: 408, name: 'เผยแพร่สื่อลามกอนาจาร หรือผิดพ.ร.บ.คอมพิวเตอร์ร้ายแรง', points: 50 },
        { id: 409, name: 'กระทำการที่ทำให้โรงเรียนเสื่อมเสียชื่อเสียงอย่างร้ายแรง', points: 50 },
        { id: 410, name: 'วางเพลิง หรือพยายามเผาทำลายสิ่งก่อสร้าง', points: 100 }
    ]
};

function loadAffairsRecords() {
    const tbody = document.getElementById('affairsRecordsTable');
    if (!tbody) return;

    if (mockAffairsRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-10 text-slate-400">ยังไม่มีข้อมูล</td></tr>';
        return;
    }

    tbody.innerHTML = mockAffairsRecords.map(r => {
        const isGood = r.type === 'good';
        const typeBadge = isGood ? '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">บำเพ็ญประโยชน์</span>'
            : '<span class="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">ผิดระเบียบ</span>';
        const pointsBadge = isGood ? `<span class="text-emerald-600 font-bold">+${r.points}</span>`
            : `<span class="text-rose-600 font-bold">-${r.points}</span>`;
        return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
            <td class="px-6 py-4">
                <p class="font-bold text-slate-800">${r.studentName}</p>
                <p class="text-[10px] text-slate-500">${r.classRoom}</p>
            </td>
            <td class="px-6 py-4">${typeBadge}</td>
            <td class="px-6 py-4 text-xs font-medium text-slate-700">${r.category}</td>
            <td class="px-6 py-4 text-center">${pointsBadge}</td>
            <td class="px-6 py-4 text-xs text-slate-500">${r.recorder}</td>
            <td class="px-6 py-4 text-right text-xs text-slate-400">${r.time}</td>
        </tr>`;
    }).join('');
}

function openAffairsModal(type) {
    document.getElementById('affairsForm').reset();
    document.getElementById('affairsRecordType').value = type;
    document.getElementById('affairsStudentPreview').classList.add('hidden');
    document.getElementById('affairsEvidencePreviewContainer').classList.add('hidden');

    const titleObj = document.getElementById('affairsModalTitle');
    const severityContainer = document.getElementById('severityContainer');
    const categoryWrapper = document.getElementById('categoryWrapper');
    const punishmentSection = document.getElementById('punishmentSection');
    const goodSection = document.getElementById('goodSection');
    const btnSubmit = document.getElementById('btnSubmitAffairs');

    if (type === 'deduct') {
        titleObj.innerHTML = '<i class="fa-solid fa-minus-circle text-rose-500"></i> บันทึกการหักคะแนนพฤติกรรม';
        severityContainer.classList.remove('hidden');
        categoryWrapper.className = 'md:col-span-1 lg:col-span-1';
        punishmentSection.classList.remove('hidden');
        goodSection.classList.add('hidden');

        btnSubmit.className = 'w-2/3 px-4 py-3.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2 text-sm';

    } else {
        titleObj.innerHTML = '<i class="fa-solid fa-plus-circle text-emerald-500"></i> บันทึกการทำความดี/บำเพ็ญประโยชน์';
        severityContainer.classList.add('hidden');
        categoryWrapper.className = 'md:col-span-2 lg:col-span-2';
        punishmentSection.classList.add('hidden');
        goodSection.classList.remove('hidden');

        btnSubmit.className = 'w-2/3 px-4 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 text-sm';
    }

    updateAffairsCategories();
    document.getElementById('affairsModal').classList.remove('hidden');
}

function closeAffairsModal() {
    document.getElementById('affairsModal').classList.add('hidden');
}

function updateAffairsCategories() {
    const type = document.getElementById('affairsRecordType').value;
    const catSelect = document.getElementById('affairsCategory');
    catSelect.innerHTML = '';

    if (type === 'good') {
        const options = [
            '<option value="10" data-points="10">เก็บของได้นำมาคืน (10 คะแนน)</option>',
            '<option value="15" data-points="15">ช่วยเหลืองานโรงเรียน/กิจกรรม (15 คะแนน)</option>',
            '<option value="20" data-points="20">สร้างชื่อเสียงให้โรงเรียน (20 คะแนน)</option>',
            '<option value="50" data-points="50">ทำประโยชน์ระดับประเทศ/นานาชาติ (50 คะแนน)</option>'
        ];
        catSelect.innerHTML = options.join('');
        document.getElementById('affairsPointsGood').value = 10;
    } else {
        const severity = document.getElementById('affairsSeverityLevel').value;
        const rules = mockMisconductRules[severity] || [];

        let optionsHtml = '';
        let defaultPoint = rules.length > 0 ? rules[0].points : 0;

        rules.forEach(rule => {
            optionsHtml += `<option value="${rule.name}" data-points="${rule.points}">${rule.name} หัก ${rule.points} คะแนน</option>`;
        });

        catSelect.innerHTML = optionsHtml;
        document.getElementById('affairsPoints').value = defaultPoint;

        // Auto check external saraban if severity is ร้ายแรง
        const extSaraban = document.getElementById('affairsGenSarabanExternal');
        if (extSaraban) {
            extSaraban.checked = (severity === 'ร้ายแรง' || severity === 'ร้ายแรงมาก');
        }
    }
}

function autoSetPoints() {
    const catSelect = document.getElementById('affairsCategory');
    const type = document.getElementById('affairsRecordType').value;
    const selectedOption = catSelect.options[catSelect.selectedIndex];
    const pointVal = selectedOption ? selectedOption.getAttribute('data-points') : 0;

    if (type === 'good') {
        document.getElementById('affairsPointsGood').value = pointVal;
    } else {
        document.getElementById('affairsPoints').value = pointVal;
    }
}

let mockSearchTimeout;
function searchAffairsStudentPreview(val) {
    clearTimeout(mockSearchTimeout);
    const view = document.getElementById('affairsStudentPreview');
    if (val.length < 3) {
        view.classList.add('hidden');
        return;
    }

    mockSearchTimeout = setTimeout(() => {
        document.getElementById('affairsPreviewImg').src = 'https://ui-avatars.com/api/?name=' + encodeURI(val) + '&background=random&color=fff';
        document.getElementById('affairsPreviewName').innerText = (val.length === 5 && !isNaN(val)) ? 'ด.ช. นักเรียน สมมติ' : val;
        document.getElementById('affairsPreviewClass').innerText = 'ม.3/2';
        view.classList.remove('hidden');
    }, 400);
}

// Preview image upload mock
document.getElementById('affairsEvidenceImg')?.addEventListener('change', function (e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('affairsEvidencePreview').src = e.target.result;
            document.getElementById('affairsEvidencePreviewContainer').classList.remove('hidden');
        }
        reader.readAsDataURL(this.files[0]);
    }
});

function submitAffairsRecord(e) {
    e.preventDefault();
    const type = document.getElementById('affairsRecordType').value;
    const studentInput = document.getElementById('affairsStudentTarget').value;
    const studentName = document.getElementById('affairsPreviewName').innerText || studentInput;
    const catText = document.getElementById('affairsCategory').options[document.getElementById('affairsCategory').selectedIndex].text.split('(')[0].trim();

    const points = type === 'good' ? document.getElementById('affairsPointsGood').value : document.getElementById('affairsPoints').value;

    let htmlMsg = '<p class="text-slate-600 text-sm">ข้อมูลถูกบันทึกเรียบร้อยแล้ว</p>';
    if (type === 'deduct') {
        const createInternal = document.getElementById('affairsGenSarabanInternal')?.checked;
        const createExternal = document.getElementById('affairsGenSarabanExternal')?.checked;
        if (createInternal) htmlMsg += '<p class="text-[10px] text-indigo-600 mt-2"><i class="fa-solid fa-file-invoice"></i> ส่งบันทึกข้อความถึงครูที่ปรึกษาแล้ว</p>';
        if (createExternal) htmlMsg += '<p class="text-[10px] text-rose-600 mt-1"><i class="fa-solid fa-paper-plane"></i> ออกหนังสือส่ง (ภายนอก) รอ ผอ. ลงนามแล้ว</p>';
    }

    Swal.fire({
        title: 'กำลังประมวลผล...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
                mockAffairsRecords.unshift({
                    studentName: studentName,
                    classRoom: 'ม.3/2',
                    type: type,
                    category: catText,
                    points: parseInt(points),
                    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                    recorder: currentUser ? currentUser.name : 'ผู้ดูแลระบบ'
                });
                loadAffairsRecords();
                closeAffairsModal();

                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ!',
                    html: htmlMsg,
                    confirmButtonColor: type === 'deduct' ? '#e11d48' : '#10b981'
                });
            }, 800);
        }
    });
}

function issueCertificate() {
    Swal.fire({
        title: 'ออกใบรับรองความประพฤติ',
        html: `
            <div class="text-left text-sm mt-3">
                <label class="block font-bold text-slate-700 mb-1">รหัสนักเรียน</label>
                <input type="text" id="certStudentId" class="w-full p-2 border border-slate-200 rounded-lg mb-3" placeholder="ระบุรหัสนักเรียน...">
                
                <label class="block font-bold text-slate-700 mb-1">เงื่อนไขผลการเรียนบำเพ็ญประโยชน์รวม</label>
                <select class="w-full p-2 border border-slate-200 rounded-lg mb-3">
                    <option>คะแนนมากกว่า 80 (ดีมาก)</option>
                    <option>คะแนนมากกว่า 60 (ดี)</option>
                </select>
                
                <label class="block font-bold text-slate-700 mb-1">รูปแบบเอกสาร (Template)</label>
                <select class="w-full p-2 border border-slate-200 rounded-lg">
                    <option>หนังสือรับรองผลความประพฤติ (เรียนต่อ)</option>
                    <option>หนังสือรับรองผลความประพฤติ (ทั่วไป)</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-print"></i> ตรวจสอบข้อมูลและพิมพ์',
        confirmButtonColor: '#4f46e5',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const val = document.getElementById('certStudentId').value;
            if (!val) {
                Swal.showValidationMessage('กรุณาระบุรหัสนักเรียน');
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'พร้อมพิมพ์เอกสาร',
                text: 'ระบบดึงข้อมูลพฤติกรรมอัตโนมัติ กรุณาดาวน์โหลด PDF',
                confirmButtonText: '<i class="fa-solid fa-download"></i> ดาวน์โหลด',
                confirmButtonColor: '#4f46e5'
            });
        }
    });
}

function openPRSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('pr-system').classList.remove('hidden');
    loadPRNewsRecords();
}
function closePRSystem() {
    document.getElementById('pr-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

// ==========================================
// PUBLIC RELATIONS SYSTEM LOGIC
// ==========================================

let mockPRNews = [
    { title: 'ประกาศรับสมัครนักเรียนปีการศึกษา 2568', date: '05 เม.ย. 67', status: 'โพสต์แล้ว', url: 'https://placehold.co/100x100?text=News' },
    { title: 'ภาพบรรยากาศวันปัจฉิมนิเทศ', date: '01 เม.ย. 67', status: 'โพสต์แล้ว', url: 'https://placehold.co/100x100?text=Events' }
];

function loadPRNewsRecords() {
    const tbody = document.getElementById('prNewsTableBody');
    if (!tbody) return;

    tbody.innerHTML = mockPRNews.map(r => {
        return `
        <tr class="hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0">
            <td class="p-4 px-6 text-slate-600 text-xs">${r.date}</td>
            <td class="p-4 text-slate-800 font-bold font-medium flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 bg-cover bg-center" style="background-image: url('${r.url}')"></div>
                ${r.title}
            </td>
            <td class="p-4 text-center">
                <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded-md px-2 py-1 text-[10px] font-bold border border-blue-100"><i class="fa-brands fa-facebook"></i> ${r.status}</span>
            </td>
            <td class="p-4 px-6 text-right">
                <button class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition inline-flex items-center justify-center"><i class="fa-solid fa-pen"></i></button>
            </td>
        </tr>`;
    }).join('');
}

document.getElementById('prNewsImage')?.addEventListener('change', function (e) {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('prNewsImagePreview').src = e.target.result;
            document.getElementById('prNewsImagePreviewContainer').classList.remove('hidden');
        }
        reader.readAsDataURL(this.files[0]);
    }
});

let mockPRImageURL = 'https://placehold.co/100x100?text=News';
function submitPRNews(e) {
    e.preventDefault();
    const title = document.getElementById('prNewsTitle').value;
    const shareToFB = document.getElementById('prNewsShareFB').checked;
    const previewImg = document.getElementById('prNewsImagePreview').src;
    const finalImg = previewImg || mockPRImageURL;

    Swal.fire({
        title: 'กำลังเผยแพร่...',
        html: shareToFB ? 'กำลังอัปโหลดและส่งข้อมูลไปยัง Facebook Page <i class="fa-brands fa-facebook text-blue-500"></i>' : 'กำลังบันทึกลงระบบจดหมายข่าว',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
                mockPRNews.unshift({
                    title: title,
                    date: new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' }).replace('พ.ศ.', '').trim(),
                    status: shareToFB ? 'โพสต์แล้ว' : 'ฉบับร่าง',
                    url: finalImg
                });

                loadPRNewsRecords();
                document.getElementById('prNewsForm').reset();
                document.getElementById('prNewsImagePreviewContainer').classList.add('hidden');
                document.getElementById('prNewsImagePreview').src = '';

                Swal.fire({
                    icon: 'success',
                    title: 'เผยแพร่สำเร็จ!',
                    html: shareToFB ? 'ส่งโพสต์ไปยัง Facebook และบันทึกลงระบบเรียบร้อยแล้ว' : 'บันทึกจดหมายข่าวเข้าระบบเรียบร้อยแล้ว',
                    confirmButtonColor: '#db2777' // pink-600
                });
            }, 1200);
        }
    });
}

function openAdmissionSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('admission-system').classList.remove('hidden');
}
function closeAdmissionSystem() {
    document.getElementById('admission-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

// ==========================================
// ADMISSION SYSTEM LOGIC
// ==========================================

function openAdmissionApply() {
    Swal.fire({
        title: 'บันทึกผู้สมัครใหม่',
        html: `
            <div class="text-left text-sm mt-3 space-y-3">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">เลขประจำตัวประชาชน <span class="text-rose-500">*</span></label>
                    <input type="text" id="admIdCard" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-100 outline-none" placeholder="13 หลัก" maxlength="13">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล <span class="text-rose-500">*</span></label>
                        <input type="text" id="admName" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-100 outline-none" placeholder="ด.ช./ด.ญ.">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ชั้นที่สมัครเข้าเรียน</label>
                        <select id="admClassClass" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option>ม.1</option>
                            <option>ม.4</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">พื้นที่บริการ</label>
                    <select id="admArea" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                        <option value="ในเขต">นักเรียนในเขตพื้นที่บริการ</option>
                        <option value="นอกเขต">นักเรียนนอกเขตพื้นที่บริการ</option>
                        <option value="เงื่อนไขพิเศษ">เงื่อนไขพิเศษ</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">อัปโหลดเอกสารประกอบ (ปพ.1, ทะเบียนบ้าน ฯลฯ)</label>
                    <input type="file" multiple class="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs cursor-pointer">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกข้อมูลสมัคร',
        confirmButtonColor: '#0891b2', // cyan-600
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const id = document.getElementById('admIdCard').value;
            const name = document.getElementById('admName').value;
            if (!id || !name) Swal.showValidationMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
            return { id, name };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire('บันทึกสำเร็จ', 'เก็บประวัติผู้สมัครเรียบร้อยแล้ว', 'success');
        }
    });
}

function openAdmissionEnroll() {
    Swal.fire({
        title: 'บันทึกมอบตัว',
        html: `
            <div class="text-left text-sm mt-3 space-y-3">
                <div class="relative">
                    <label class="block font-bold text-slate-700 mb-1">ค้นหาผู้สมัครที่มีสิทธิ์มอบตัว</label>
                    <div class="flex gap-2">
                        <input type="text" id="enrollSearch" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-100 outline-none" placeholder="เลข ปชช. หรือ ชื่อ...">
                        <button type="button" class="bg-slate-200 px-3 rounded-lg"><i class="fa-solid fa-search"></i></button>
                    </div>
                </div>
                <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-lg hidden" id="enrollPreview">
                    <p class="font-bold text-emerald-800" id="enrollNamePreview">-</p>
                    <p class="text-[10px] text-emerald-600">สิทธิ์: ตัวจริง | พื้นที่: ในเขตบริการ</p>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1 mt-2">ยืนยันเอกสารมอบตัวครบถ้วน</label>
                    <label class="flex items-center gap-2 cursor-pointer mt-1">
                        <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded border-slate-300">
                        <span class="text-slate-600 text-xs text-emerald-700 font-bold">เอกสารครบถ้วน และพร้อมบันทึกเป็นนักเรียนใหม่</span>
                    </label>
                </div>
            </div>
        `,
        didOpen: () => {
            document.getElementById('enrollSearch').addEventListener('keyup', (e) => {
                if (e.target.value.length > 3) {
                    document.getElementById('enrollPreview').classList.remove('hidden');
                    document.getElementById('enrollNamePreview').innerText = e.target.value;
                }
            });
        },
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-check"></i> ยืนยันมอบตัว',
        confirmButtonColor: '#10b981', // emerald-500
        cancelButtonText: 'ยกเลิก'
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire('มอบตัวสำเร็จ', 'นักเรียนได้รับรหัสประจำตัวเรียบร้อยแล้ว', 'success');
        }
    });
}

function openAdmissionReceipt() {
    Swal.fire({
        title: 'ออกใบเสร็จรับเงิน',
        html: `
            <div class="text-left text-sm mt-3 space-y-3">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">รหัสนักเรียน / เลขบัตร ปชช.</label>
                    <input type="text" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="ค้นหานักเรียน...">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">รายการชำระเงิน</label>
                    <select class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                        <option>ค่าบำรุงการศึกษา (เทอม 1/2568)</option>
                        <option>ค่าสมาชิกสมาคมผู้ปกครองและครู</option>
                        <option>ค่าประกันอุบัติเหตุ</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">จำนวนเงิน (บาท)</label>
                        <input type="number" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" value="2500" readonly>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">รูปแบบชำระเงิน</label>
                        <select class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option>เงินสด</option>
                            <option>โอนผ่านธนาคาร</option>
                        </select>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-print"></i> บันทึกและพิมพ์',
        confirmButtonColor: '#4f46e5', // indigo-600
        cancelButtonText: 'ยกเลิก',
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'พร้อมพิมพ์ใบเสร็จ',
                text: 'ระบบออกใบเสร็จรับเงินแล้ว (ดึง PDF)',
                confirmButtonText: '<i class="fa-solid fa-download"></i> ดาวน์โหลด PDF',
                confirmButtonColor: '#4f46e5'
            });
        }
    });
}

function openNutritionSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('nutrition-system').classList.remove('hidden');
}
function closeNutritionSystem() {
    document.getElementById('nutrition-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

// ==========================================
// NUTRITION & HEALTH SYSTEM LOGIC
// ==========================================

function openNutritionCanteenCheck() {
    Swal.fire({
        title: 'บันทึกตรวจโรงอาหาร',
        html: `
            <div class="text-left text-sm mt-3 space-y-3">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ร้านอาหารที่ตรวจ</label>
                    <select class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer">
                        <option>ร้านน้ำปั่น (ป้าศรี)</option>
                        <option>ร้านข้าวแกง (เจ๊นง)</option>
                        <option>ร้านก๋วยเตี๋ยว (ลุงชัย)</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <label class="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 rounded-lg bg-slate-50">
                        <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded border-slate-300">
                        <span class="text-xs text-slate-700">การแต่งกายผู้สัมผัสอาหาร</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 rounded-lg bg-slate-50">
                        <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded border-slate-300">
                        <span class="text-xs text-slate-700">สุขาภิบาลบริเวณร้าน</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 rounded-lg bg-slate-50">
                        <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded border-slate-300">
                        <span class="text-xs text-slate-700">ความสะอาดภาชนะ</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer p-2 border border-slate-100 rounded-lg bg-slate-50">
                        <input type="checkbox" checked class="w-4 h-4 text-emerald-600 rounded border-slate-300">
                        <span class="text-xs text-slate-700">คุณภาพวัตถุดิบ</span>
                    </label>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ข้อเสนอแนะเพิ่มเติม</label>
                    <textarea class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none" rows="2" placeholder="ระบุสิ่งที่ต้องปรับปรุง..."></textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกผลตรวจ',
        confirmButtonColor: '#10b981', // emerald-500
        cancelButtonText: 'ยกเลิก',
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire('บันทึกสำเร็จ', 'อัปเดตข้อมูลการตรวจโรงอาหารลงฐานข้อมูลแล้ว', 'success');
        }
    });
}

function openNutritionWaterCheck() {
    Swal.fire({
        title: 'บันทึกคุณภาพน้ำดื่ม',
        html: `
            <div class="text-left text-sm mt-3 space-y-3">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">จุดบริการน้ำดื่ม</label>
                    <select class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer">
                        <option>เครื่องกรองน้ำ อาคาร 1 (หน้าห้องพักครู)</option>
                        <option>เครื่องกรองน้ำ อาคาร 2 (ชั้น 1)</option>
                        <option>เครื่องกรองน้ำ โรงอาหาร</option>
                    </select>
                </div>
                <div class="p-3 bg-cyan-50 border border-cyan-100 rounded-lg">
                    <label class="block font-bold text-cyan-800 mb-1">สถานะไส้กรองรอบนี้</label>
                    <select class="w-full p-2.5 bg-white border border-cyan-200 rounded-lg outline-none cursor-pointer">
                        <option>ปกติ (ใช้งานต่อได้)</option>
                        <option value="replace">ต้องเปลี่ยนไส้กรอง</option>
                        <option>เครื่องชำรุดรอซ่อม</option>
                    </select>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ผลตรวจน้ำด้วยชุดทดสอบเบื้องต้น</label>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="waterTest" checked class="w-4 h-4 text-cyan-600 border-slate-300 focus:ring-cyan-500">
                            <span class="text-sm text-slate-700">ผ่าน</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="waterTest" class="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500">
                            <span class="text-sm text-slate-700">ไม่ผ่าน <span class="text-[10px] text-rose-500">(จะอายัดจุดบริการนี้ทันที)</span></span>
                        </label>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกผลประเมิน',
        confirmButtonColor: '#06b6d4', // cyan-500
        cancelButtonText: 'ยกเลิก',
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire('บันทึกสำเร็จ', 'อัปเดตสถานะจุดบริการน้ำดื่มแล้ว', 'success');
        }
    });
}

function openNutritionHealthCheck() {
    Swal.fire({
        title: 'บันทึกสุขภาพนักเรียน',
        html: `
            <div class="text-left text-sm mt-3 space-y-3">
                <div class="relative">
                    <label class="block font-bold text-slate-700 mb-1">ค้นหานักเรียน</label>
                    <input type="text" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-100 outline-none" placeholder="รหัสนักเรียน หรือ ชื่อ-นามสกุล...">
                </div>
                
                <div class="grid grid-cols-2 gap-3 mt-3">
                    <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <label class="block font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center gap-2"><i class="fa-solid fa-weight-scale text-indigo-500"></i> พัฒนาการ (BMI)</label>
                        <label class="block text-xs text-slate-500 mb-1">น้ำหนัก (กก.)</label>
                        <input type="number" class="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none mb-2" value="50">
                        <label class="block text-xs text-slate-500 mb-1">ส่วนสูง (ซม.)</label>
                        <input type="number" class="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none" value="160">
                    </div>
                    
                    <div class="p-3 bg-rose-50 rounded-xl border border-rose-100">
                        <label class="block font-bold text-rose-800 mb-2 border-b border-rose-200 pb-1 flex items-center gap-2"><i class="fa-solid fa-syringe text-rose-500"></i> วัคซีน/ภูมิคุ้มกัน</label>
                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" checked class="w-4 h-4 text-rose-600 rounded border-slate-300">
                            <span class="text-xs text-slate-700">หัดเยอรมัน (MR)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer mb-2">
                            <input type="checkbox" checked class="w-4 h-4 text-rose-600 rounded border-slate-300">
                            <span class="text-xs text-slate-700">บาดทะยัก (Td)</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" class="w-4 h-4 text-rose-600 rounded border-slate-300">
                            <span class="text-xs text-slate-700">คอตีบ (DTC)</span>
                        </label>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกประวัติสุขภาพ',
        confirmButtonColor: '#e11d48', // rose-600
        cancelButtonText: 'ยกเลิก',
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire('บันทึกสำเร็จ', 'อัปเดตข้อมูลสุขภาพของนักเรียนเรียบร้อย', 'success');
        }
    });
}
function closeNutritionSystem() {
    document.getElementById('nutrition-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

function openFacilitiesSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('facilities-system').classList.remove('hidden');
}
function closeFacilitiesSystem() {
    document.getElementById('facilities-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

function openCommunitySystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('community-system').classList.remove('hidden');
}
function closeCommunitySystem() {
    document.getElementById('community-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

// ==========================================
// SARABAN SYSTEM (งานสารบรรณ)
// ==========================================
function openSarabanSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('saraban-system').classList.remove('hidden');

    // Ensure main menu is visible and others are hidden
    document.getElementById('saraban-main-menu').classList.remove('hidden');
    document.getElementById('saraban-request-view').classList.add('hidden');
    document.getElementById('saraban-inbox-view').classList.add('hidden');
    document.getElementById('saraban-cert-view').classList.add('hidden');

    // Set default date to today
    const dateInput = document.getElementById('docDate');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
}

function closeSarabanSystem() {
    document.getElementById('saraban-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

function openSarabanView(type) {
    document.getElementById('saraban-main-menu').classList.add('hidden');
    document.getElementById('saraban-request-view').classList.add('hidden');
    document.getElementById('saraban-inbox-view').classList.add('hidden');
    document.getElementById('saraban-cert-view').classList.add('hidden');

    if (type === 'request') {
        document.getElementById('saraban-request-view').classList.remove('hidden');
        loadRecentDocRequests();
    } else if (type === 'inbox') {
        document.getElementById('saraban-inbox-view').classList.remove('hidden');
    } else if (type === 'cert') {
        document.getElementById('saraban-cert-view').classList.remove('hidden');
    }
}

function closeSarabanView() {
    document.getElementById('saraban-main-menu').classList.remove('hidden');
    document.getElementById('saraban-request-view').classList.add('hidden');
    document.getElementById('saraban-inbox-view').classList.add('hidden');
    document.getElementById('saraban-cert-view').classList.add('hidden');
}

function openAmssSettings() {
    Swal.fire({
        title: 'ตั้งค่าการเชื่อมต่อ AMSS++',
        html: `
            <div class="text-left space-y-3 mt-3">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">URL ระบบ AMSS++ ของเขตพื้นที่</label>
                    <input type="url" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="https://amss.area.go.th" value="https://smart.amss.go.th/area01">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-1">API Key / Token</label>
                    <input type="password" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" value="**************">
                </div>
                <div class="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mt-2">
                    <i class="fa-solid fa-circle-check text-blue-500"></i>
                    <span class="text-xs text-blue-800 font-medium">สถานะ: เชื่อมต่อสำเร็จล่าสุด วันนี้ 08:30 น.</span>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกการตั้งค่า',
        confirmButtonColor: '#2563eb',
        cancelButtonText: 'ปิด'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('บันทึกสำเร็จ', 'อัปเดตการตั้งค่าการเชื่อมต่อ AMSS++ แล้ว', 'success');
        }
    });
}
let mockDocHistory = [
    { doc_number: '125/2567', date: '03 ต.ค. 67', title: 'ขออนุมัติจัดซื้อวัสดุสำนักงาน', from: 'งานพัสดุ', to: 'ผู้อำนวยการ', status: 'ออกแล้ว' },
    { doc_number: '124/2567', date: '02 ต.ค. 67', title: 'รายงานผลการปฏิบัติงาน', from: 'นายสมชาย', to: 'ผู้อำนวยการ', status: 'ออกแล้ว' }
];

function loadRecentDocRequests() {
    renderDocTable(mockDocHistory);
}

function renderDocTable(data) {
    const tbody = document.getElementById('docHistoryTable');
    if (!tbody) return;
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400">ยังไม่มีข้อมูล</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(r => `<tr class="hover:bg-slate-50 transition"><td class="px-4 py-3 text-xs font-bold text-slate-700">${r.doc_number || r.fullNumber || '-'}</td><td class="px-4 py-3 text-xs text-slate-600">${r.date || r.timestamp || '-'}</td><td class="px-4 py-3 text-xs text-slate-800 font-medium">${r.title || '-'}</td><td class="px-4 py-3 text-xs text-slate-500">${r.from || r.requester || '-'}</td><td class="px-4 py-3 text-xs text-slate-500 text-right">${r.date || '-'}</td></tr>`).join('');
}

function submitDocRequest() {
    const docDate = document.getElementById('docDate')?.value;
    const docType = document.getElementById('docType')?.value;
    const title = document.getElementById('docTitle')?.value;
    const receiver = document.getElementById('docReceiver')?.value;
    const requester = currentUser ? currentUser.name : 'ผู้ใช้งาน';

    if (!docDate || !docType || !title || !receiver) {
        Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูล วันที่ เรื่อง และผู้รับ ให้ครบถ้วน', 'warning');
        return;
    }

    Swal.fire({
        title: 'กำลังดำเนินการออกเลข...',
        html: '<div class="text-sm text-slate-500 mt-2">กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูล</div>',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
                const newNum = Math.floor(Math.random() * 100) + 200;
                const newDocNumber = `${newNum}/2567`;

                // Format th date mock
                const d = new Date(docDate);
                const thNum = d.getDate();
                const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                const thMonth = months[d.getMonth()];
                const thYear = (d.getFullYear() + 543).toString().slice(-2);
                const thDateStr = `${thNum} ${thMonth} ${thYear}`;

                mockDocHistory.unshift({
                    doc_number: newDocNumber,
                    date: thDateStr,
                    title: title,
                    from: requester,
                    to: receiver,
                    status: 'ออกแล้ว'
                });

                loadRecentDocRequests();
                document.getElementById('genDocForm')?.reset();
                if (document.getElementById('docDate')) document.getElementById('docDate').valueAsDate = new Date();

                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    html: `เลขที่เอกสารของคุณคือ:<br><span class="text-2xl font-black text-blue-600 mt-2 block">${newDocNumber}</span>`,
                    confirmButtonColor: '#2563eb'
                });
            }, 800);
        }
    });
}

window.simulateBatchCert = function () {
    const range = document.getElementById('certRange').value;
    if (!range) { Swal.fire('แจ้งเตือน', 'กรุณาระบุช่วงเลขที่เกียรติบัตร', 'warning'); return; }

    const btn = document.getElementById('btnGenCert');
    const barContainer = document.getElementById('certProgress');
    const percentText = document.getElementById('certPercent');
    const bar = document.getElementById('certBar');

    btn.classList.add('hidden');
    barContainer.classList.remove('hidden');

    let p = 0;
    const interval = setInterval(() => {
        p += Math.floor(Math.random() * 20) + 10;
        if (p >= 100) {
            p = 100;
            clearInterval(interval);
            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'สร้างเกียรติบัตรสำเร็จ!',
                    text: 'ระบบได้เพิ่มเกียรติบัตรลงในคลัง Smart Download พร้อม QR Code เรียบร้อยแล้ว',
                    confirmButtonColor: '#9333ea'
                });
                barContainer.classList.add('hidden');
                btn.classList.remove('hidden');
                percentText.innerText = '0%';
                bar.style.width = '0%';
                document.getElementById('certBatchForm').reset();
            }, 500);
        }
        percentText.innerText = p + '%';
        bar.style.width = p + '%';
    }, 400);
};

function changeDocTab(tabName) {
    document.querySelectorAll('.doc-tab-btn').forEach(btn => {
        btn.className = 'doc-tab-btn flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-700 transition-all whitespace-nowrap';
    });
    const activeBtn = document.getElementById('btn-doc-' + tabName);
    if (activeBtn) {
        activeBtn.className = 'doc-tab-btn flex-1 md:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all bg-white text-blue-600 shadow-sm whitespace-nowrap';
    }
    console.log('Switched doc tab to:', tabName);
}

// ==========================================
// ACADEMIC NAVIGATION
// ==========================================
function openAcademicSubsystem(type) {
    const views = ['assignment', 'schedule', 'attendance', 'evaluation', 'exams', 'curriculum', 'supervision'];
    document.getElementById('academic-dashboard-view').classList.add('hidden');
    views.forEach(v => { const el = document.getElementById('academic-' + v + '-view'); if (el) el.classList.add('hidden'); });
    const target = document.getElementById('academic-' + type + '-view');
    if (target) {
        target.classList.remove('hidden');
        if (type === 'assignment') { loadPendingApprovals(); }
    }
}

function closeAcademicSubsystem() {
    const views = ['assignment', 'schedule', 'attendance', 'evaluation', 'exams', 'curriculum', 'supervision'];
    views.forEach(v => { const el = document.getElementById('academic-' + v + '-view'); if (el) el.classList.add('hidden'); });
    document.getElementById('academic-dashboard-view').classList.remove('hidden');
    loadAcademicCalendar(); // Refresh calendar when returning to dashboard
}

// ==========================================
// BUDGET NAVIGATION
// ==========================================
function openBudgetSubsystem(type) {
    const views = ['planning', 'finance', 'procurement', 'audit'];
    document.getElementById('budget-dashboard-view').classList.add('hidden');
    views.forEach(v => { const el = document.getElementById('budget-' + v + '-view'); if (el) el.classList.add('hidden'); });
    const target = document.getElementById('budget-' + type + '-view');
    if (target) target.classList.remove('hidden');
    else Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ระบบนี้กำลังอยู่ในช่วงการพัฒนา', confirmButtonColor: '#3b82f6' });
}
function closeBudgetSubsystem() {
    const views = ['planning', 'finance', 'procurement', 'audit'];
    views.forEach(v => { const el = document.getElementById('budget-' + v + '-view'); if (el) el.classList.add('hidden'); });
    document.getElementById('budget-dashboard-view').classList.remove('hidden');
}

// ==========================================
// HR NAVIGATION
// ==========================================
function openHRSubsystem(type) {
    const views = ['staffing', 'development', 'performance', 'discipline'];
    document.getElementById('hr-dashboard-view').classList.add('hidden');
    views.forEach(v => { const el = document.getElementById('hr-' + v + '-view'); if (el) el.classList.add('hidden'); });
    const target = document.getElementById('hr-' + type + '-view');
    if (target) {
        target.classList.remove('hidden');
        if (type === 'staffing') renderHRStaffingTable();
        else if (type === 'development') renderHRDevelopment();
        else if (type === 'performance') renderHRPerformanceTable();
        else if (type === 'discipline') initHRDiscipline();
    } else Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ระบบนี้กำลังอยู่ในช่วงการพัฒนา', confirmButtonColor: '#3b82f6' });
}
function closeHRSubsystem() {
    const views = ['staffing', 'development', 'performance', 'discipline'];
    views.forEach(v => { const el = document.getElementById('hr-' + v + '-view'); if (el) el.classList.add('hidden'); });
    document.getElementById('hr-dashboard-view').classList.remove('hidden');
}

// ==========================================
// GENERAL NAVIGATION (ฝ่ายทั่วไป)
// ==========================================
function openGeneralSubsystem(type) {
    const views = ['pr', 'admission', 'health', 'building', 'community'];
    document.getElementById('general-menu-view').classList.add('hidden');
    views.forEach(v => { const el = document.getElementById(v + '-system'); if (el) el.classList.add('hidden'); });
    const target = document.getElementById(type + '-system');
    if (target) target.classList.remove('hidden');
    else Swal.fire({ icon: 'info', title: 'กำลังพัฒนา', text: 'ระบบนี้กำลังอยู่ในช่วงการพัฒนา', confirmButtonColor: '#3b82f6' });
}
function closeGeneralSubsystem() {
    const views = ['pr', 'admission', 'health', 'building', 'community'];
    views.forEach(v => { const el = document.getElementById(v + '-system'); if (el) el.classList.add('hidden'); });
    document.getElementById('general-menu-view').classList.remove('hidden');
}
function openStudentAffairsSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('student-affairs-system').classList.remove('hidden');
    loadAffairsRecords();
}
function closeStudentAffairsSystem() {
    document.getElementById('student-affairs-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
}

// ==========================================
// STUDENT COUNCIL NAVIGATION
// ==========================================
function openStudentCouncilSubsystem(sysId) {
    const subsystems = ['morning_duty', 'scan', 'assembly', 'cleaning'];
    document.getElementById('student-council-dashboard-view').classList.add('hidden');
    subsystems.forEach(s => { const el = document.getElementById('student-council-' + s + '-view'); if (el) el.classList.add('hidden'); });
    const target = document.getElementById('student-council-' + sysId + '-view');
    if (target) target.classList.remove('hidden');
    else { Swal.fire('กำลังพัฒนา', 'ระบบนี้กำลังอยู่ระหว่างการพัฒนา', 'info'); document.getElementById('student-council-dashboard-view').classList.remove('hidden'); }
}
function closeStudentCouncilSubsystem(sysId) {
    const target = document.getElementById('student-council-' + sysId + '-view');
    if (target) target.classList.add('hidden');
    document.getElementById('student-council-dashboard-view').classList.remove('hidden');
}

// ==========================================
// ACADEMIC SCHEDULE LOGIC (จัดตารางสอน)
// ==========================================
let scheduleData = [
    { id: 's1', day: 1, period: 1, subject: 'ค21101', name: 'คณิตศาสตร์', teacher: 'ครูสมชาย', color: 'blue' },
    { id: 's2', day: 1, period: 2, subject: 'ค21101', name: 'คณิตศาสตร์', teacher: 'ครูสมชาย', color: 'blue' },
    { id: 's3', day: 1, period: 3, subject: 'ว21101', name: 'วิทยาศาสตร์', teacher: 'ครูสมศรี', color: 'green' },
    { id: 's4', day: 1, period: 5, subject: 'ท21101', name: 'ภาษาไทย', teacher: 'ครูมานี', color: 'orange' },
    { id: 's5', day: 2, period: 1, subject: 'ท21101', name: 'ภาษาไทย', teacher: 'ครูมานี', color: 'orange' },
    { id: 's6', day: 2, period: 3, subject: 'ส21101', name: 'สังคมศึกษา', teacher: 'ครูปิติ', color: 'indigo' },
    { id: 's7', day: 2, period: 4, subject: 'ส21101', name: 'สังคมศึกษา', teacher: 'ครูปิติ', color: 'indigo' },
    { id: 's8', day: 2, period: 6, subject: 'พ21101', name: 'สุขศึกษา', teacher: 'ครูชูใจ', color: 'teal' },
    { id: 's9', day: 2, period: 7, subject: 'กิจกรรม', name: 'ลูกเสือ/เนตรนารี', teacher: 'สนามกีฬา', color: 'red', colspan: 2 } // Mock colspan handling
];

const daysConfig = [
    { id: 1, name: 'จันทร์', color: 'yellow' },
    { id: 2, name: 'อังคาร', color: 'pink' },
    { id: 3, name: 'พุธ', color: 'emerald' },
    { id: 4, name: 'พฤหัสฯ', color: 'orange' },
    { id: 5, name: 'ศุกร์', color: 'sky' }
];

function renderScheduleGrid() {
    const gridEl = document.getElementById('scheduleGrid');
    if (!gridEl) return;

    let html = `
    <!-- Header Row -->
    <div class="grid grid-cols-9 gap-2 mb-2">
        <div class="h-10"></div>
        ${[1, 2, 3, 4].map(p => `
            <div class="flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 py-2">
                <span class="text-[10px] font-bold text-slate-400">คาบ ${p}</span><span class="text-xs font-bold text-slate-700">0${p + 7}:30-0${p + 8}:20</span>
            </div>
        `).join('')}
        <div class="flex flex-col items-center justify-center bg-rose-50 rounded-xl border border-rose-100 py-2 text-rose-500">
            <span class="text-[10px] font-bold">พักกลางวัน</span><span class="text-xs font-bold">11:50-12:50</span>
        </div>
        ${[5, 6, 7].map(p => `
            <div class="flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 py-2">
                <span class="text-[10px] font-bold text-slate-400">คาบ ${p}</span><span class="text-xs font-bold text-slate-700">${p + 7}:50-${p + 8}:40</span>
            </div>
        `).join('')}
    </div>`;

    daysConfig.forEach(day => {
        html += `<div class="grid grid-cols-9 gap-2 mb-2">
            <div class="flex items-center justify-center bg-${day.color}-100 text-${day.color}-700 font-bold rounded-xl border border-${day.color}-200 h-20">${day.name}</div>`;

        for (let p = 1; p <= 7; p++) {
            if (p === 5) { // Lunch break visually handled but we keep the grid logic separate
                html += `<div class="bg-slate-50 rounded-xl flex items-center justify-center"><i class="fa-solid fa-utensils text-slate-300 text-xl"></i></div>`;
            }
            let actualPeriod = p > 4 ? p : p; // Adjust if lunch break is a real period

            const item = scheduleData.find(d => d.day === day.id && d.period === p);
            if (item) {
                if (item.colspan) {
                    html += `<div draggable="true" ondragstart="drag(event, '${item.id}')" ondragover="allowDrop(event)" ondrop="drop(event, ${day.id}, ${p})" class="col-span-${item.colspan} bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-2 flex flex-col justify-center items-center hover:shadow-md transition cursor-grab active:cursor-grabbing group">
                        <span class="text-sm font-bold text-slate-800">${item.subject}</span>
                        <span class="text-xs text-${item.color}-500 font-medium">${item.teacher}</span>
                    </div>`;
                    p += item.colspan - 1; // Skip next period
                } else {
                    html += `<div draggable="true" ondragstart="drag(event, '${item.id}')" ondragover="allowDrop(event)" ondrop="drop(event, ${day.id}, ${p})" class="bg-${item.color}-50 border border-${item.color}-100 rounded-xl p-2 flex flex-col justify-between hover:shadow-md transition cursor-grab active:cursor-grabbing group min-h-[5rem]">
                        <span class="text-xs font-bold text-slate-800">${item.subject}</span>
                        <div><span class="text-[10px] text-${item.color}-600 font-medium">${item.name}</span><br><span class="text-[10px] text-slate-500">${item.teacher}</span></div>
                    </div>`;
                }
            } else {
                html += `<div ondragover="allowDrop(event)" ondrop="drop(event, ${day.id}, ${p})" class="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-center text-slate-400 text-xs font-bold border-dashed hover:bg-slate-100 transition duration-200 min-h-[5rem]">ว่าง (Drop Here)</div>`;
            }
        }
        html += `</div>`;
    });
    gridEl.innerHTML = html;
}

// Global Drag State
let draggedItemId = null;

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev, id) {
    draggedItemId = id;
    ev.dataTransfer.setData("text", id);
}

function drop(ev, toDay, toPeriod) {
    ev.preventDefault();
    if (!draggedItemId) return;

    // Check conflicts (is there already an item here?)
    const existingItem = scheduleData.find(d => d.day === toDay && d.period === toPeriod);
    const draggedItem = scheduleData.find(d => d.id === draggedItemId);

    if (existingItem) {
        // Swap them
        existingItem.day = draggedItem.day;
        existingItem.period = draggedItem.period;
    }

    draggedItem.day = toDay;
    draggedItem.period = toPeriod;

    renderScheduleGrid();
    draggedItemId = null;

    // Optional: save to backend
    // google.script.run.apiCall('updateSchedule', scheduleData);
}

function openScheduleSetupModal() {
    Swal.fire({
        title: 'จัดตารางสอนอัตโนมัติ',
        html: `
            <div class="text-left text-sm mb-4">กำหนดเงื่อนไขเพื่อจัดตารางสอนใหม่:</div>
            <select id="autoClass" class="w-full mb-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                <option>ม.1/1</option><option>ม.1/2</option><option>ม.2/1</option><option>ม.3/1</option>
            </select>
            <div class="flex items-center gap-2 mb-3">
                <input type="checkbox" id="avoidConflict" checked class="w-4 h-4 text-emerald-600 rounded">
                <label for="avoidConflict" class="text-sm font-bold text-slate-700">หลีกเลี่ยงคาบซ้ำซ้อนของครู (Teacher Conflict)</label>
            </div>
            <div class="text-xs text-slate-500 text-left bg-blue-50 p-3 rounded-lg border border-blue-100"><i class="fa-solid fa-info-circle mr-1"></i> ระบบจะทำการสร้างตารางเรียนอัตโนมัติ 35 คาบ/สัปดาห์ โดยอิงจากโครงสร้างหลักสูตร</div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-wand-magic-sparkles"></i> สร้างตารางอัตโนมัติ',
        confirmButtonColor: '#4f46e5',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            autoGenerateSchedule();
        }
    });
}

function autoGenerateSchedule() {
    showLoading('กำลังประมวลผลอัลกอริทึมจัดตารางสอน...');
    setTimeout(() => {
        hideLoading();
        // Mock Auto Generate: Shuffle the days
        scheduleData = scheduleData.map(item => {
            let newDay = Math.floor(Math.random() * 5) + 1;
            let newPeriod = Math.floor(Math.random() * 7) + 1;
            // Simplified logic: just randomly assign a day/period that isn't already taken
            return { ...item, day: newDay, period: newPeriod };
        });

        // Remove duplicates in same period
        const seen = new Set();
        scheduleData = scheduleData.filter(item => {
            const key = `${item.day}-${item.period}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        renderScheduleGrid();
        Swal.fire({
            icon: 'success',
            title: 'จัดตารางอัตโนมัติสำเร็จ',
            text: 'คุณสามารถลากและวาง (Drag & Drop) เพื่อปรับแต่งตารางได้ตามต้องการ',
            confirmButtonColor: '#10b981'
        });
    }, 1500);
}

function openAddSubjectModal() {
    Swal.fire('เพิ่มรายวิชา', 'ส่วนนี้จะเปิดฟอร์มเพื่อเพิ่มรายวิชาใหม่ลงตาราง', 'info');
}

// Initially Render
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderScheduleGrid, 1000); // Give time for DOM
});

// ==========================================
// HR SUBSYSTEMS LOGIC
// ==========================================

const MOCK_HR_STAFFING = [
    { subject: 'ภาษาไทย', required: 8, actual: 7, diff: -1 },
    { subject: 'คณิตศาสตร์', required: 8, actual: 8, diff: 0 },
    { subject: 'วิทยาศาสตร์และเทคโนโลยี', required: 10, actual: 12, diff: 2 },
    { subject: 'สังคมศึกษาฯ', required: 6, actual: 6, diff: 0 },
    { subject: 'ภาษาต่างประเทศ', required: 7, actual: 5, diff: -2 },
    { subject: 'สุขศึกษาและพลศึกษา', required: 4, actual: 4, diff: 0 },
    { subject: 'ศิลปะ', required: 3, actual: 3, diff: 0 },
    { subject: 'การงานอาชีพ', required: 3, actual: 4, diff: 1 }
];

function renderHRStaffingTable() {
    const tbody = document.getElementById('hr-staffing-table-body');
    if (!tbody) return;

    tbody.innerHTML = MOCK_HR_STAFFING.map(item => {
        let diffColor = 'slate';
        let statusText = 'พอดี';
        if (item.diff < 0) { diffColor = 'red'; statusText = `ขาด ${Math.abs(item.diff)}`; }
        else if (item.diff > 0) { diffColor = 'amber'; statusText = `เกิน ${item.diff}`; }
        else { diffColor = 'emerald'; statusText = 'ตามเกณฑ์'; }

        return `<tr class="hover:bg-slate-50 transition border-b border-slate-50">
            <td class="p-4 text-xs font-bold text-slate-700">${item.subject}</td>
            <td class="p-4 text-xs text-slate-600 text-center">${item.required}</td>
            <td class="p-4 text-xs font-bold text-slate-800 text-center">${item.actual}</td>
            <td class="p-4 text-xs font-bold text-${diffColor}-600 text-center">${item.diff > 0 ? '+' : ''}${item.diff}</td>
            <td class="p-4 text-center">
                <span class="text-[10px] bg-${diffColor}-50 text-${diffColor}-600 border border-${diffColor}-100 px-2 py-1 rounded-lg font-bold">
                    ${statusText}
                </span>
            </td>
        </tr>`;
    }).join('');
}

const MOCK_HR_VPA = [
    { name: 'นางวันทนี ศรีสวัสดิ์', position: 'ครูชำนาญการพิเศษ', status: 'ส่งแล้ว', date: '28 ก.ย. 66' },
    { name: 'นายสมศักดิ์ รักชาติ', position: 'ครูชำนาญการ', status: 'รอแก้ไข', date: '30 ก.ย. 66' },
    { name: 'น.ส.ใจดี เรียนเก่ง', position: 'ครู', status: 'ยังไม่ส่ง', date: '-' }
];

const MOCK_HR_TRAINING = [
    { topic: 'การใช้ AI ในการจัดการเรียนรู้', hours: 6, date: '15 ต.ค. 66', type: 'ภายนอก' },
    { topic: 'อบรมเชิงปฏิบัติการเครื่องมือวัดผล', hours: 12, date: '10-11 ก.ย. 66', type: 'ภายใน' }
];

function renderHRDevelopment() {
    const vpaList = document.getElementById('hr-vpa-list');
    if (vpaList) {
        vpaList.innerHTML = MOCK_HR_VPA.map(item => {
            let statusClass = item.status === 'ส่งแล้ว' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                item.status === 'รอแก้ไข' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100';
            return `<div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition hover:shadow-sm">
                <div>
                    <h4 class="text-xs font-bold text-slate-800">${item.name}</h4>
                    <p class="text-[10px] text-slate-500">${item.position}</p>
                </div>
                <div class="text-right">
                    <span class="text-[10px] px-2 py-0.5 rounded-md font-bold border ${statusClass}">${item.status}</span>
                    <p class="text-[9px] text-slate-400 mt-1">${item.date}</p>
                </div>
            </div>`;
        }).join('');
    }

    const trainingList = document.getElementById('hr-training-list');
    if (trainingList) {
        trainingList.innerHTML = MOCK_HR_TRAINING.map(item => {
            let iconText = item.type === 'ภายใน' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500';
            let iconBody = item.type === 'ภายใน' ? 'fa-school' : 'fa-building';
            return `<div class="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-white">
                <div class="w-8 h-8 rounded-lg ${iconText} flex items-center justify-center shrink-0">
                    <i class="fa-solid ${iconBody} text-xs"></i>
                </div>
                <div>
                    <h4 class="text-xs font-bold text-slate-800 line-clamp-1">${item.topic}</h4>
                    <p class="text-[10px] text-slate-500 mt-0.5"><i class="fa-regular fa-clock mr-1"></i>${item.hours} ชั่วโมง | ${item.date}</p>
                </div>
            </div>`;
        }).join('');
    }
}

const MOCK_HR_PERFORMANCE = [
    { name: 'นางวันทนี ศรีสวัสดิ์', position: 'ครูเชี่ยวชาญ', score: 95.50, level: 'ดีเด่น' },
    { name: 'นายสมศักดิ์ รักชาติ', position: 'ครูชำนาญการพิเศษ', score: 88.00, level: 'ดีมาก' },
    { name: 'นางพรพรรณ ทองดี', position: 'ครูชำนาญการ', score: 82.50, level: 'ดี' },
    { name: 'น.ส.ใจดี เรียนเก่ง', position: 'ครู', score: 91.00, level: 'ดีเด่น' }
];

function renderHRPerformanceTable() {
    const tbody = document.getElementById('hr-performance-table-body');
    if (!tbody) return;

    tbody.innerHTML = MOCK_HR_PERFORMANCE.map(item => {
        let levelColor = item.level === 'ดีเด่น' ? 'emerald' :
            item.level === 'ดีมาก' ? 'blue' :
                item.level === 'ดี' ? 'amber' : 'slate';
        return `<tr class="hover:bg-slate-50 transition border-b border-slate-50">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <img src="https://ui-avatars.com/api/?name=${encodeURI(item.name)}&background=random&color=fff" class="w-8 h-8 rounded-full border border-slate-100">
                    <span class="text-xs font-bold text-slate-800">${item.name}</span>
                </div>
            </td>
            <td class="p-4 text-xs text-slate-600 font-medium">${item.position}</td>
            <td class="p-4 text-xs font-black text-slate-800 text-center">${item.score.toFixed(2)}</td>
            <td class="p-4 text-center">
                <span class="text-[10px] bg-${levelColor}-50 text-${levelColor}-600 border border-${levelColor}-100 px-2 py-1 rounded-lg font-bold">
                    ${item.level}
                </span>
            </td>
            <td class="p-4 text-center">
                <button class="text-[10px] text-slate-600 hover:text-slate-800 font-bold bg-white border border-slate-200 shadow-sm px-2 py-1 rounded hover:bg-slate-50 transition"><i class="fa-solid fa-pen mr-1"></i>ตรวจสอบ</button>
            </td>
        </tr>`;
    }).join('');
}

let hrClockInterval = null;
let MOCK_HR_ATTENDANCE = [
    { name: 'นางวันทนี ศรีสวัสดิ์', timeIn: '07:15:22', timeOut: '-', status: 'มาปกติ' },
    { name: 'นายสมศักดิ์ รักชาติ', timeIn: '08:05:10', timeOut: '-', status: 'มาสาย' },
    { name: 'น.ส.ใจดี เรียนเก่ง', timeIn: '-', timeOut: '-', status: 'ยังไม่ลงเวลา' }
];

function updateHRClock() {
    const clockEl = document.getElementById('hr-clock-time');
    if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('th-TH');
    }
}

function initHRDiscipline() {
    const userNameEl = document.getElementById('hr-discipline-user-name');
    if (userNameEl) userNameEl.innerText = typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'ผู้ใช้งานระบบ (สาธิต)';

    const avatarEl = document.getElementById('hr-discipline-user-avatar');
    if (avatarEl) {
        let n = typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'Admin';
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURI(n)}&background=f1f5f9&color=64748b`;
    }

    const dateEl = document.getElementById('hr-today-date');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    if (hrClockInterval) clearInterval(hrClockInterval);
    hrClockInterval = setInterval(updateHRClock, 1000);
    updateHRClock();

    renderHRAttendanceTable();
}

function renderHRAttendanceTable() {
    const tbody = document.getElementById('hr-attendance-table-body');
    if (!tbody) return;

    tbody.innerHTML = MOCK_HR_ATTENDANCE.map(item => {
        let statusColor = item.status === 'มาปกติ' ? 'emerald' :
            item.status === 'มาสาย' ? 'amber' : 'slate';
        return `<tr class="hover:bg-slate-50 transition border-b border-slate-50">
            <td class="p-3 text-xs font-bold text-slate-700">${item.name}</td>
            <td class="p-3 text-xs font-mono text-slate-600 text-center bg-slate-50/50">${item.timeIn}</td>
            <td class="p-3 text-xs font-mono text-slate-400 text-center">${item.timeOut}</td>
            <td class="p-3 text-center">
                <span class="text-[10px] text-${statusColor}-600 bg-${statusColor}-50 px-2 py-0.5 rounded font-bold border border-${statusColor}-100">
                    ${item.status}
                </span>
            </td>
        </tr>`;
    }).join('');
}

function hrSimulateClockIn() {
    const btn = document.getElementById('hr-clock-btn');
    if (!btn) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH');
    const name = typeof currentUser !== 'undefined' && currentUser ? currentUser.name : 'ผู้ใช้งานระบบ (สาธิต)';

    let existing = MOCK_HR_ATTENDANCE.find(a => a.name === name);
    let action = 'in';

    if (existing && existing.timeIn !== '-') {
        if (existing.timeOut !== '-') {
            Swal.fire({ icon: 'info', title: 'ลงเวลาครบแล้ว', text: 'คุณได้ลงเวลาเข้าและออกงานในวันนี้เรียบร้อยแล้ว' });
            return;
        }
        existing.timeOut = timeStr;
        action = 'out';
    } else {
        if (existing) {
            existing.timeIn = timeStr;
            existing.status = 'มาปกติ';
        } else {
            MOCK_HR_ATTENDANCE.unshift({
                name: name,
                timeIn: timeStr,
                timeOut: '-',
                status: 'มาปกติ'
            });
            existing = MOCK_HR_ATTENDANCE[0];
        }
    }

    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-lg"></i> กำลังบันทึก...`;
    btn.classList.add('opacity-80', 'cursor-not-allowed');
    btn.disabled = true;

    setTimeout(() => {
        renderHRAttendanceTable();
        Swal.fire({
            icon: 'success',
            title: action === 'in' ? 'บันทึกเวลาเข้างานสำเร็จ' : 'บันทึกเวลาออกงานสำเร็จ',
            text: `เวลา ${timeStr}`,
            showConfirmButton: false,
            timer: 1500,
            toast: true,
            position: 'top-end'
        });

        btn.disabled = false;
        btn.classList.remove('opacity-80', 'cursor-not-allowed');

        if (existing && existing.timeOut === '-') {
            btn.innerHTML = `<i class="fa-solid fa-arrow-right-from-bracket text-lg"></i> บันทึกเวลาออกงาน`;
            btn.className = "w-full bg-slate-600 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition shadow-sm flex items-center justify-center gap-2 text-sm z-10 active:scale-95 duration-200 mt-2";
        } else if (existing && existing.timeOut !== '-') {
            btn.innerHTML = `<i class="fa-solid fa-check-double text-lg"></i> ลงเวลาเรียบร้อยแล้ว`;
            btn.className = "w-full bg-emerald-100 text-emerald-600 border border-emerald-200 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm z-10 cursor-not-allowed mt-2 opacity-80";
            btn.disabled = true;
        }
    }, 800);
}



// ==========================================
// ATTENDANCE LOGIC (เช็คชื่อนักเรียน)
// ==========================================
function submitAttendance() {
    Swal.fire({
        title: 'ยืนยันการบันทึก?',
        text: 'ระบบจะส่งข้อความแจ้งเตือนผู้ปกครองสำหรับนักเรียนที่ขาดและมาสาย',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            showLoading('กำลังบันทึกข้อมูล...');
            setTimeout(() => {
                hideLoading();
                Swal.fire('สำเร็จ', 'บันทึกข้อมูลการเช็คชื่อเรียบร้อยแล้ว', 'success');
                calculateAttendanceStats();
            }, 1000);
        }
    });
}

function calculateAttendanceStats() {
    // This function can be called after rendering to calculate initial stats
    setTimeout(() => {
        // Just mock updating stats
        const total = 42;
        let present = 38, late = 2, absent = 1, sick = 1;
        document.getElementById('stat-present') && (document.getElementById('stat-present').innerText = present);
        document.getElementById('stat-late') && (document.getElementById('stat-late').innerText = late);
        document.getElementById('stat-absent') && (document.getElementById('stat-absent').innerText = absent);
        document.getElementById('stat-leave') && (document.getElementById('stat-leave').innerText = sick);
    }, 500);
}
document.addEventListener('DOMContentLoaded', calculateAttendanceStats);

// ==========================================
// GRADING LOGIC (งานทะเบียนวัดผล)
// ==========================================
// Auto-calculate total and grade
document.addEventListener('input', function (e) {
    if (e.target.closest('#academic-evaluation-view tbody') && e.target.tagName === 'INPUT') {
        const row = e.target.closest('tr');
        if (row) {
            const inputs = row.querySelectorAll('input[type="number"]');
            if (inputs.length === 4) {
                const s1 = parseFloat(inputs[0].value) || 0;
                const s2 = parseFloat(inputs[1].value) || 0;
                const s3 = parseFloat(inputs[2].value) || 0;
                const s4 = parseFloat(inputs[3].value) || 0;
                const total = s1 + s2 + s3 + s4;

                // Max sum validation
                let totalDisplay = total;
                if (total > 100) totalDisplay = 100;

                const totalCell = row.querySelector('td:nth-child(7)');
                const gradeCell = row.querySelector('td:nth-child(8)');

                if (totalCell && gradeCell) {
                    totalCell.innerText = totalDisplay;
                    const grade = calculateGradeValue(totalDisplay);
                    gradeCell.innerText = grade.toFixed(1);

                    // Add some colors based on grade
                    if (grade >= 3) {
                        gradeCell.className = "py-3 px-4 text-center font-black text-emerald-600 bg-emerald-50/30";
                    } else if (grade >= 2) {
                        gradeCell.className = "py-3 px-4 text-center font-black text-blue-600 bg-blue-50/30";
                    } else if (grade > 0) {
                        gradeCell.className = "py-3 px-4 text-center font-black text-orange-600 bg-orange-50/30";
                    } else {
                        gradeCell.className = "py-3 px-4 text-center font-black text-red-600 bg-red-50/30";
                    }
                }
            }
        }
    }
});

function calculateGradeValue(score) {
    if (score >= 80) return 4.0;
    if (score >= 75) return 3.5;
    if (score >= 70) return 3.0;
    if (score >= 65) return 2.5;
    if (score >= 60) return 2.0;
    if (score >= 55) return 1.5;
    if (score >= 50) return 1.0;
    return 0.0;
}

function saveEvaluationData() {
    Swal.fire({
        title: 'บันทึกคะแนน?',
        text: 'ระบบจะทำการบันทึกข้อมูลคะแนนล่าสุด',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5'
    }).then((res) => {
        if (res.isConfirmed) {
            showLoading('กำลังบันทึก...');
            setTimeout(() => { hideLoading(); Swal.fire('สำเร็จ', 'บันทึกคะแนนเรียบร้อยแล้ว', 'success'); }, 800);
        }
    });
}

function exportPP5() {
    Swal.fire({
        title: 'ออกเอกสาร ปพ.5',
        text: 'กำลังสร้างไฟล์ PDF สำหรับวิชา ค21101...',
        icon: 'info',
        confirmButtonColor: '#4f46e5'
    }).then(() => {
        Swal.fire('สำเร็จ', 'ระบบสร้างไฟล์ ปพ.5 เรียบร้อยแล้ว', 'success');
    });
}

// Attach listeners to evaluation buttons manually since onclick isn't inline via previous diffs
document.addEventListener('DOMContentLoaded', () => {
    const evalButtons = document.querySelectorAll('#academic-evaluation-view button');
    if (evalButtons.length > 2) {
        // index 0: back, index 1: export, index 2: save
        evalButtons[1].onclick = exportPP5;
        evalButtons[2].onclick = saveEvaluationData;
    }
});

// ==========================================
// EXAMS LOGIC (ระบบสอบ)
// ==========================================
function openAddExamModal() {
    Swal.fire({
        title: 'สร้างข้อสอบใหม่',
        html: `
            < input type = "text" id = "examSubject" class="w-full p-2 border border-slate-200 rounded-lg mb-2" placeholder = "รหัสและชื่อวิชา (เช่น ค21101 คณิตศาสตร์)" >
            <select id="examType" class="w-full p-2 border border-slate-200 rounded-lg mb-2">
                <option>กลางภาค</option><option>ปลายภาค</option><option>เก็บคะแนน</option>
            </select>
            <input type="number" id="examTime" class="w-full p-2 border border-slate-200 rounded-lg mb-2" placeholder="เวลาสอบ (นาที) เช่น 60">
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        confirmButtonColor: '#9333ea'
    }).then((r) => {
        if (r.isConfirmed) Swal.fire('สำเร็จ', 'เพิ่มรายการสอบเข้าคลังสำเร็จ', 'success');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const examButtons = document.querySelectorAll('#academic-exams-view button');
    if (examButtons.length > 1) { // back button is [0]
        examButtons[1].onclick = openAddExamModal;
    }
});

// ==========================================
// CURRICULUM LOGIC (หลักสูตร)
// ==========================================
function openAddCurriculumModal() {
    Swal.fire({
        title: 'เพิ่มรายวิชาในโครงสร้าง',
        html: `
            <input type="text" class="w-full p-2 border border-slate-200 rounded-lg mb-2" placeholder="รหัสวิชา (เช่น ค21101)">
            <input type="text" class="w-full p-2 border border-slate-200 rounded-lg mb-2" placeholder="ชื่อรายวิชา (เช่น คณิตศาสตร์ 1)">
            <select class="w-full p-2 border border-slate-200 rounded-lg mb-2">
                <option>วิชาพื้นฐาน</option><option>วิชาเพิ่มเติม</option><option>กิจกรรมพัฒนาผู้เรียน</option>
            </select>
            <div class="grid grid-cols-2 gap-2">
                <input type="number" step="0.5" class="w-full p-2 border border-slate-200 rounded-lg" placeholder="หน่วยกิต (เช่น 1.5)">
                <input type="number" class="w-full p-2 border border-slate-200 rounded-lg" placeholder="ชั่วโมง/สัปดาห์ (เช่น 3)">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        confirmButtonColor: '#d97706'
    }).then((r) => {
        if (r.isConfirmed) Swal.fire('สำเร็จ', 'บันทึกโครงสร้างรายวิชาสำเร็จ', 'success');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const currButtons = document.querySelectorAll('#academic-curriculum-view button');
    if (currButtons.length > 1) {
        currButtons[1].onclick = openAddCurriculumModal;
    }
});

// ==========================================
// SUPERVISION & CALENDAR LOGIC (นิเทศการสอน / ปฏิทิน)
// ==========================================
function openAddSupervisionModal() {
    Swal.fire({
        title: 'จัดตารางนิเทศ / ปฏิทินการศึกษา',
        html: `
            <div class="text-left text-xs text-slate-500 mb-1 font-bold">เลือกผู้รับการนิเทศ / ผู้รับผิดชอบ:</div>
            <select class="w-full p-2 border border-slate-200 rounded-lg mb-3">
                <option>นายสมชาย รักคณิต</option><option>นางสาวมานี มีสอน</option>
            </select>
            <div class="text-left text-xs text-slate-500 mb-1 font-bold">รายวิชา และ ชั้น:</div>
            <input type="text" class="w-full p-2 border border-slate-200 rounded-lg mb-3" placeholder="เช่น ค21101 ม.1/1">
            <div class="text-left text-xs text-slate-500 mb-1 font-bold">กำหนดการ (วัน/เวลา):</div>
            <input type="date" class="w-full p-2 border border-slate-200 rounded-lg mb-2">
            <select class="w-full p-2 border border-slate-200 rounded-lg">
                <option>คาบ 1 (08:30)</option><option>คาบ 2 (09:20)</option><option>คาบ 3 (10:10)</option><option>คาบ 4 (11:00)</option><option>คาบ 5 (12:50)</option><option>คาบ 6 (13:40)</option>
            </select>
        `,
        showCancelButton: true,
        confirmButtonText: 'เพิ่มลงปฏิทิน',
        confirmButtonColor: '#0d9488'
    }).then((r) => {
        if (r.isConfirmed) Swal.fire('สำเร็จ', 'บันทึกตารางนิเทศสำเร็จ', 'success');
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const supButtons = document.querySelectorAll('#academic-supervision-view button');
    if (supButtons.length > 1) {
        supButtons[1].onclick = openAddSupervisionModal;
    }

    // Wire up evaluation buttons in supervise view
    // Wire up evaluation buttons in supervise view
    const evalStartBtns = document.querySelectorAll('#academic-supervision-view .bg-teal-50');
    evalStartBtns.forEach(b => {
        b.onclick = () => {
            Swal.fire({
                title: 'ประเมินการจัดการเรียนรู้',
                text: 'เริ่มการบันทึกฟอร์มนิเทศการสอน',
                icon: 'info',
                confirmButtonColor: '#0d9488'
            });
        };
    });
});

// ==========================================
// GENERIC MODAL HELPERS
// ==========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// ==========================================
// SETTING SUBSYSTEMS LOGIC
// ==========================================
function switchSettingTab(tabId, btn) {
    // Hide all sections
    const sections = ['school', 'users', 'terms', 'roles', 'backup'];
    sections.forEach(s => {
        const el = document.getElementById('setting-section-' + s);
        if (el) el.classList.add('hidden');
    });

    // Show target section
    const target = document.getElementById('setting-section-' + tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in');
    }

    // Update active tab styling
    const allBtns = document.querySelectorAll('.setting-nav-btn');
    allBtns.forEach(b => {
        b.className = 'setting-nav-btn flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-2xl font-medium transition cursor-pointer';
    });

    if (btn) {
        btn.className = 'setting-nav-btn flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold transition';
    }
}

function executeDemoBackup() {
    const btn = document.getElementById('backup-btn');
    const container = document.getElementById('backup-progress-container');
    const bar = document.getElementById('backup-progress-bar');
    const pct = document.getElementById('backup-percentage');
    const status = document.getElementById('backup-status-text');

    if (!btn || !container) return;

    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเตรียมการ...';

    container.classList.remove('hidden');
    bar.style.width = '0%';
    pct.innerText = '0%';

    let progress = 0;
    status.innerText = 'กำลังสำรองข้อมูล... โครงสร้างฐานข้อมูล';

    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress > 100) progress = 100;

        bar.style.width = progress + '%';
        pct.innerText = progress + '%';

        if (progress > 30 && progress < 60) {
            status.innerText = 'กำลังสำรองข้อมูล... ตารางผู้ใช้งานและข้อมูลวิชาการ';
        } else if (progress >= 60 && progress < 90) {
            status.innerText = 'กำลังสำรองข้อมูล... แฟ้มภาพและเอกสารแนบ';
        } else if (progress >= 90) {
            status.innerText = 'กำลังตรวจสอบความสมบูรณ์ของไฟล์ Backup...';
        }

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                container.classList.add('hidden');
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> เริ่มสำรองข้อมูล';

                // Add new history record to top
                const tbody = document.getElementById('backup-history-list');
                const now = new Date();
                const timeStr = `${now.getDate()} ${now.toLocaleString('th-TH', { month: 'short' })} ${now.getFullYear() + 543} ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;

                if (tbody) {
                    const row = document.createElement('tr');
                    row.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition bg-green-50/30';
                    row.innerHTML = `
                        <td class="p-4 font-medium text-slate-800">
                            <div class="flex items-center gap-2">
                                <i class="fa-regular fa-clock text-slate-400 text-xs"></i> ${timeStr}
                                <span class="flex h-2 w-2 relative"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                            </div>
                        </td>
                        <td class="p-4 text-slate-600"><span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">Manual Backup</span></td>
                        <td class="p-4 text-slate-600">848 MB</td>
                        <td class="p-4">ผู้ใช้งานระบบ (สาธิต)</td>
                        <td class="p-4 text-center">
                            <button onclick="demoAlert('ดาวน์โหลดไฟล์ Backup')" class="text-blue-600 hover:text-blue-800 transition font-bold"><i class="fa-solid fa-download"></i></button>
                        </td>
                    `;
                    tbody.insertBefore(row, tbody.firstChild);

                    // remove highlight after few seconds
                    setTimeout(() => row.classList.remove('bg-green-50/30'), 3000);
                }

                Swal.fire({
                    icon: 'success',
                    title: 'สำรองข้อมูลสำเร็จ',
                    text: 'ไฟล์มีขนาด 848 MB สามารถดาวน์โหลดได้ทันที',
                    confirmButtonColor: '#3b82f6'
                });
            }, 800);
        }
    }, 400);
}

// Common Demo Utilities
if (typeof window.confirmAction !== 'function') {
    window.confirmAction = function (actionName) {
        Swal.fire({
            title: 'ยืนยันการทำรายการ?',
            text: `คุณต้องการ ${actionName} ใช่หรือไม่ ระบบจะไม่สามารถย้อนกลับได้`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ใช่, ดำเนินการ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'ดำเนินการสำเร็จ',
                    text: `${actionName} เรียบร้อยแล้ว`,
                    icon: 'success',
                    confirmButtonColor: '#10b981'
                });
            }
        });
    };
}

if (typeof window.demoAlert !== 'function') {
    window.demoAlert = function (msg) {
        Swal.fire({
            title: 'ระบบสาธิต (Demo)',
            text: msg,
            icon: 'info',
            confirmButtonColor: '#3b82f6'
        });
    };
}


// ==========================================
// ACADEMIC CALENDAR LOGIC (ปฏิทินวิชาการ)
// ==========================================

let mockAcademicCalendar = [
    // Academic events
    { id: 1, title: 'สอบกลางภาค 2/2568', date: '2026-01-19', endDate: '2026-01-23', type: 'exam', desc: 'สอบกลางภาคเรียนที่ 2 ทุกระดับชั้น' },
    { id: 2, title: 'ส่งคะแนนกลางภาค', date: '2026-01-26', endDate: '', type: 'activity', desc: 'ส่งคะแนนผ่านระบบ SGS' },
    { id: 3, title: 'ประชุมวิชาการ', date: '2026-02-05', endDate: '', type: 'meeting', desc: 'ห้องประชุม 1' },
    { id: 4, title: 'กิจกรรม Open House', date: '2026-02-14', endDate: '', type: 'activity', desc: 'ณ อาคารอเนกประสงค์' },
    { id: 5, title: 'สอบปลายภาค 2/2568', date: '2026-03-09', endDate: '2026-03-13', type: 'exam', desc: 'สอบปลายภาคเรียนที่ 2' },
    { id: 6, title: 'ส่งคะแนนปลายภาค', date: '2026-03-16', endDate: '', type: 'activity', desc: 'กำหนดส่งคะแนนผลสอบ' },
    { id: 7, title: 'ประชุมสรุปผลปีการศึกษา', date: '2026-03-25', endDate: '', type: 'meeting', desc: 'ห้องประชุมใหญ่' },
    // Thai public holidays 2026
    { id: 100, title: 'วันขึ้นปีใหม่', date: '2026-01-01', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 101, title: 'วันมาฆบูชา', date: '2026-02-12', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 102, title: 'วันจักรี', date: '2026-04-06', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 103, title: 'วันสงกรานต์', date: '2026-04-13', endDate: '2026-04-15', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 104, title: 'วันแรงงานแห่งชาติ', date: '2026-05-01', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 105, title: 'วันฉัตรมงคล', date: '2026-05-04', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 106, title: 'วันวิสาขบูชา', date: '2026-05-11', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 107, title: 'วันเฉลิมฯ สมเด็จพระนางเจ้าสุทิดาฯ', date: '2026-06-03', endDate: '', type: 'holiday', desc: 'วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดาฯ' },
    { id: 108, title: 'วันอาสาฬหบูชา', date: '2026-07-10', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 109, title: 'วันเข้าพรรษา', date: '2026-07-11', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 110, title: 'วันเฉลิมฯ ร.10', date: '2026-07-28', endDate: '', type: 'holiday', desc: 'วันเฉลิมพระชนมพรรษา ร.10' },
    { id: 111, title: 'วันเฉลิมฯ พระพันปีหลวง', date: '2026-08-12', endDate: '', type: 'holiday', desc: 'วันแม่แห่งชาติ' },
    { id: 112, title: 'วันคล้ายวันสวรรคต ร.9', date: '2026-10-13', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 113, title: 'วันปิยมหาราช', date: '2026-10-23', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 114, title: 'วันพ่อแห่งชาติ', date: '2026-12-05', endDate: '', type: 'holiday', desc: 'วันคล้ายวันพระบรมราชสมภพ ร.9' },
    { id: 115, title: 'วันรัฐธรรมนูญ', date: '2026-12-10', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    { id: 116, title: 'วันสิ้นปี', date: '2026-12-31', endDate: '', type: 'holiday', desc: 'วันหยุดราชการ' },
    // Academic events for semester 1/2569
    { id: 200, title: 'เปิดเรียน 1/2569', date: '2026-05-16', endDate: '', type: 'activity', desc: 'เปิดภาคเรียนที่ 1' },
    { id: 201, title: 'ประชุมผู้ปกครอง', date: '2026-05-23', endDate: '', type: 'meeting', desc: 'อาคารอเนกประสงค์' },
    { id: 202, title: 'สอบกลางภาค 1/2569', date: '2026-07-20', endDate: '2026-07-24', type: 'exam', desc: 'สอบกลางภาคเรียนที่ 1' },
    { id: 203, title: 'กิจกรรมวันแม่แห่งชาติ', date: '2026-08-11', endDate: '', type: 'activity', desc: 'กิจกรรมวันแม่แห่งชาติ' },
    { id: 204, title: 'สอบปลายภาค 1/2569', date: '2026-09-21', endDate: '2026-09-25', type: 'exam', desc: 'สอบปลายภาคเรียนที่ 1' }
];

let currentCalendarView = 'grid'; // 'grid' or 'list'

function toggleCalendarView(view) {
    currentCalendarView = view;
    if (view === 'grid') {
        document.getElementById('btnCalGrid').className = 'flex-1 px-3 py-1.5 bg-white text-slate-800 shadow-sm rounded-lg text-sm font-bold transition';
        document.getElementById('btnCalList').className = 'flex-1 px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-sm font-bold transition';
        document.getElementById('academicCalendarGrid').classList.remove('hidden');
        document.getElementById('academicCalendarList').classList.add('hidden');
    } else {
        document.getElementById('btnCalList').className = 'flex-1 px-3 py-1.5 bg-white text-slate-800 shadow-sm rounded-lg text-sm font-bold transition';
        document.getElementById('btnCalGrid').className = 'flex-1 px-3 py-1.5 text-slate-500 hover:text-slate-800 rounded-lg text-sm font-bold transition';
        document.getElementById('academicCalendarList').classList.remove('hidden');
        document.getElementById('academicCalendarGrid').classList.add('hidden');
    }
    loadAcademicCalendar();
}

function getCalendarEventsFiltered() {
    const typeFilter = document.getElementById('acCalTypeFilter').value;
    const monthFilter = document.getElementById('acCalMonthFilter').value; // 'YYYY-MM'

    return mockAcademicCalendar.filter(ev => {
        let passType = (!typeFilter || ev.type === typeFilter);
        let passMonth = true;
        if (monthFilter) {
            const evMonth = ev.date.substring(0, 7);
            passMonth = (evMonth === monthFilter);
        }
        return passType && passMonth;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function loadAcademicCalendar() {
    renderMiniCalendar();
    if (currentCalendarView === 'grid') {
        renderCalendarGrid();
    } else {
        renderCalendarList();
    }
}

function renderCalendarList() {
    const container = document.getElementById('academicCalendarList');
    if (!container) return;

    const events = getCalendarEventsFiltered();

    if (events.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-slate-400">ไม่มีข้อมูล หรือ ไม่มีกำหนดการในเดือนนี้</div>';
        return;
    }

    container.innerHTML = events.map(ev => {
        let typeInfo = { color: 'blue', icon: 'fa-calendar', label: 'กิจกรรม' };
        if (ev.type === 'exam') typeInfo = { color: 'rose', icon: 'fa-pen-to-square', label: 'สอบ' };
        else if (ev.type === 'meeting') typeInfo = { color: 'amber', icon: 'fa-users', label: 'ประชุม' };
        else if (ev.type === 'holiday') typeInfo = { color: 'emerald', icon: 'fa-tree', label: 'วันหยุด' };

        const d = new Date(ev.date);
        const day = d.getDate();
        const monthShort = d.toLocaleDateString('th-TH', { month: 'short' });

        return `
        <div class="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition bg-white group animate-fade-in">
            <div class="shrink-0 w-16 h-16 bg-${typeInfo.color}-50 rounded-xl flex flex-col items-center justify-center border border-${typeInfo.color}-100">
                <span class="text-[10px] uppercase text-${typeInfo.color}-500 font-bold">${monthShort}</span>
                <span class="text-xl font-black leading-none mt-0.5 text-${typeInfo.color}-700">${day}</span>
            </div>
            <div class="flex-1 overflow-hidden">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] bg-${typeInfo.color}-100 text-${typeInfo.color}-700 px-2 py-0.5 rounded font-bold">${typeInfo.label}</span>
                    <h4 class="font-bold text-slate-800 text-base truncate">${ev.title}</h4>
                </div>
                <p class="text-xs text-slate-500 mb-2 truncate"><i class="fa-regular ${typeInfo.icon} mr-1"></i> ${ev.endDate ? `ถึง ${new Date(ev.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}` : d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} | ${ev.desc}</p>
            </div>
            <div class="flex sm:flex-col gap-2 justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button onclick="editAcCalendar(${ev.id})" class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition flex items-center justify-center">
                    <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button onclick="deleteAcCalendar(${ev.id})" class="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center">
                    <i class="fa-solid fa-trash text-xs"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

function renderCalendarGrid() {
    const grid = document.getElementById('calendarDaysGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let monthInput = document.getElementById('acCalMonthFilter').value;
    if (!monthInput) { monthInput = new Date().toISOString().substring(0, 7); }
    const [yearStr, monthStr] = monthInput.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    // Update planner header title
    updatePlannerTitle(year, month);

    const d = new Date(yearStr, month - 1, 1);
    const lastDay = new Date(yearStr, month, 0).getDate();
    const startDayOfWeek = d.getDay(); // 0(Sun) to 6(Sat)

    const events = getCalendarEventsFiltered();
    let html = '';

    // Previous month blanks
    for (let i = 0; i < startDayOfWeek; i++) {
        const borderR = (i < 6) ? 'border-r' : '';
        html += `<div class="min-h-[90px] md:min-h-[110px] bg-slate-50/50 ${borderR} border-b border-slate-200"></div>`;
    }

    // Days
    for (let day = 1; day <= lastDay; day++) {
        const currentDateStr = `${yearStr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(yearStr, month - 1, day).getDay();

        // Find events on this day
        const dayEvents = events.filter(ev => {
            if (!ev.endDate) return ev.date === currentDateStr;
            return currentDateStr >= ev.date && currentDateStr <= ev.endDate;
        });

        // Build events HTML
        let eventsHtml = '';
        const evCount = dayEvents.length;
        if (evCount > 0) {
            const sizeClass = evCount === 1
                ? 'text-[10px] md:text-xs px-1.5 py-1'
                : evCount === 2
                    ? 'text-[9px] md:text-[11px] px-1 py-0.5'
                    : 'text-[8px] md:text-[10px] px-0.5 py-px';
            const maxShow = evCount <= 3 ? evCount : 2;

            dayEvents.slice(0, maxShow).forEach(ev => {
                let dotColor = 'bg-blue-500';
                let textColor = 'text-blue-700';
                let bgColor = 'bg-blue-50';
                if (ev.type === 'exam') { dotColor = 'bg-rose-500'; textColor = 'text-rose-700'; bgColor = 'bg-rose-50'; }
                else if (ev.type === 'meeting') { dotColor = 'bg-amber-500'; textColor = 'text-amber-700'; bgColor = 'bg-amber-50'; }
                else if (ev.type === 'holiday') { dotColor = 'bg-emerald-500'; textColor = 'text-emerald-700'; bgColor = 'bg-emerald-50'; }

                eventsHtml += `<div onclick="event.stopPropagation(); editAcCalendar(${ev.id})" class="${sizeClass} ${bgColor} ${textColor} rounded cursor-pointer hover:opacity-80 font-medium leading-tight truncate flex items-center gap-1" title="${ev.title}"><span class="w-1.5 h-1.5 ${dotColor} rounded-full flex-shrink-0"></span>${ev.title}</div>`;
            });
            if (evCount > maxShow) {
                eventsHtml += `<div class="text-[8px] md:text-[10px] text-slate-400 font-bold px-1 cursor-pointer hover:text-blue-500" onclick="event.stopPropagation();">+${evCount - maxShow} รายการ</div>`;
            }
        }

        // Determine cell styles
        const isToday = (currentDateStr === new Date().toLocaleString('sv').substring(0, 10));
        const isSunday = dayOfWeek === 0;
        const isSaturday = dayOfWeek === 6;
        const hasHoliday = dayEvents.some(e => e.type === 'holiday');

        let cellBg = 'bg-white';
        if (hasHoliday) cellBg = 'bg-emerald-50/40';
        else if (isSunday) cellBg = 'bg-rose-50/30';
        else if (isSaturday) cellBg = 'bg-blue-50/30';
        if (isToday) cellBg = 'bg-blue-50';

        const borderR = (dayOfWeek < 6) ? 'border-r' : '';
        const numColor = isToday ? '' : (isSunday ? 'text-rose-500' : (isSaturday ? 'text-blue-500' : 'text-slate-800'));
        const todayNumClass = isToday ? 'bg-blue-600 text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm' : '';

        html += `
        <div onclick="openAddAcCalendarModal('${currentDateStr}')" class="min-h-[90px] md:min-h-[110px] ${cellBg} ${borderR} border-b border-slate-200 p-1.5 md:p-2 flex flex-col cursor-pointer group hover:bg-blue-50/40 transition relative">
            <div class="flex justify-between items-start mb-1">
                <span class="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-500 transition"><i class="fa-solid fa-plus text-[9px]"></i></span>
                <span class="text-lg md:text-2xl font-black ${numColor} ${todayNumClass} leading-none">${day}</span>
            </div>
            <div class="flex-1 flex flex-col gap-0.5 overflow-hidden">
                ${eventsHtml}
            </div>
        </div>`;
    }

    // Trailing blanks to fill the last row
    const totalCells = startDayOfWeek + lastDay;
    const trailing = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < trailing; i++) {
        const borderR = (i < trailing - 1 || (startDayOfWeek + lastDay + i + 1) % 7 !== 0) ? 'border-r' : '';
        html += `<div class="min-h-[90px] md:min-h-[110px] bg-slate-50/50 ${borderR} border-b border-slate-200"></div>`;
    }

    grid.innerHTML = html;
}

function updatePlannerTitle(year, month) {
    const monthNamesEN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const monthNamesTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const titleEl = document.getElementById('plannerMonthTitle');
    const titleTHEl = document.getElementById('plannerMonthTitleTH');
    if (titleEl) titleEl.textContent = `${monthNamesEN[month - 1]} ${year}`;
    if (titleTHEl) titleTHEl.textContent = `${monthNamesTH[month - 1]} พ.ศ. ${year + 543}`;
}

function changeCalMonth(delta) {
    const input = document.getElementById('acCalMonthFilter');
    let current = input.value;
    if (!current) current = new Date().toISOString().substring(0, 7);
    const [y, m] = current.split('-').map(Number);
    const newDate = new Date(y, m - 1 + delta, 1);
    const newVal = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    input.value = newVal;
    loadAcademicCalendar();
}

function fetchPublicHolidays() {
    let monthInput = document.getElementById('acCalMonthFilter').value;
    if (!monthInput) monthInput = new Date().toISOString().substring(0, 7);
    const year = parseInt(monthInput.split('-')[0]);

    Swal.fire({
        title: `ดึงวันหยุดราชการ ปี ${year}?`,
        text: "ระบบจะเชื่อมต่อ API เพื่อนำเข้าวันหยุดของประเทศไทยอัตโนมัติ (ผ่าน Nager.Date)",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: '<i class="fa-solid fa-cloud-arrow-down"></i> ดึงข้อมูล',
        cancelButtonText: 'ยกเลิก',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const fallbackHolidays = [
                { date: `${year}-01-01`, name: "New Year's Day", localName: "วันขึ้นปีใหม่" },
                { date: `${year}-02-12`, name: "Makha Bucha Day", localName: "วันมาฆบูชา" },
                { date: `${year}-04-06`, name: "Chakri Memorial Day", localName: "วันจักรี" },
                { date: `${year}-04-13`, name: "Songkran Festival", localName: "วันสงกรานต์" },
                { date: `${year}-04-14`, name: "Songkran Festival", localName: "วันสงกรานต์" },
                { date: `${year}-04-15`, name: "Songkran Festival", localName: "วันสงกรานต์" },
                { date: `${year}-05-01`, name: "National Labour Day", localName: "วันแรงงานแห่งชาติ" },
                { date: `${year}-05-04`, name: "Coronation Day", localName: "วันฉัตรมงคล" },
                { date: `${year}-05-11`, name: "Visakha Bucha Day", localName: "วันวิสาขบูชา" },
                { date: `${year}-06-03`, name: "HM Queen Suthida's Birthday", localName: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดาฯ" },
                { date: `${year}-07-10`, name: "Asarnha Bucha Day", localName: "วันอาสาฬหบูชา" },
                { date: `${year}-07-11`, name: "Buddhist Lent Day", localName: "วันเข้าพรรษา" },
                { date: `${year}-07-28`, name: "HM King Maha Vajiralongkorn's Birthday", localName: "วันเฉลิมพระชนมพรรษา ร.10" },
                { date: `${year}-08-12`, name: "HM the Queen's Birthday", localName: "วันเฉลิมพระชนมพรรษา พระพันปีหลวง" },
                { date: `${year}-10-13`, name: "HM King Bhumibol Adulyadej Memorial Day", localName: "วันคล้ายวันสวรรคต ร.9" },
                { date: `${year}-10-23`, name: "Chulalongkorn Day", localName: "วันปิยมหาราช" },
                { date: `${year}-12-05`, name: "HM King Bhumibol Adulyadej's Birthday", localName: "วันคล้ายวันพระบรมราชสมภพ ร.9" },
                { date: `${year}-12-10`, name: "Constitution Day", localName: "วันรัฐธรรมนูญ" },
                { date: `${year}-12-31`, name: "New Year's Eve", localName: "วันสิ้นปี" }
            ];

            return fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/TH`)
                .then(response => {
                    if (!response.ok) {
                        return fallbackHolidays;
                    }
                    return response.text().then(text => {
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            return fallbackHolidays;
                        }
                    });
                })
                .catch(error => {
                    console.warn('API Error, using fallback', error);
                    return fallbackHolidays;
                });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            const holidays = result.value;
            let addedCount = 0;

            holidays.forEach(hol => {
                // Check duplicate by Date and Title
                if (!mockAcademicCalendar.find(e => e.date === hol.date && (e.title === hol.localName || e.title === hol.name))) {
                    const newId = (mockAcademicCalendar.length > 0) ? Math.max(...mockAcademicCalendar.map(x => x.id)) + 1 : 1;
                    mockAcademicCalendar.push({
                        id: newId,
                        title: hol.localName,
                        date: hol.date,
                        endDate: '',
                        type: 'holiday',
                        desc: hol.name
                    });
                    addedCount++;
                }
            });

            loadAcademicCalendar();
            Swal.fire({
                icon: 'success',
                title: 'เสร็จสิ้น',
                text: `เพิ่มวันหยุดราชการ ${addedCount} รายการใหม่ ในปฏิทินแล้ว`,
                confirmButtonColor: '#3b82f6'
            });
        }
    });
}

function openAddAcCalendarModal(prefillDate = '') {
    Swal.fire({
        title: 'เพิ่มกิจกรรม/กำหนดการ',
        html: `
            <div class="text-left text-sm mt-3 space-y-3 p-1">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ชื่อกิจกรรม</label>
                    <input type="text" id="evTitle" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="เช่น สอบกลางภาค...">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ประเภท</label>
                        <select id="evType" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="activity">กิจกรรม (ทั่วไป)</option>
                            <option value="exam">การสอบ (Exam)</option>
                            <option value="meeting">ประชุม (Meeting)</option>
                            <option value="holiday">วันหยุดราชการ (Holiday)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">วันที่เริ่มต้น</label>
                        <input type="date" id="evDate" value="${prefillDate}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                    </div>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">วันที่สิ้นสุด <span class="text-slate-400 font-normal">(ถ้ามี)</span></label>
                    <input type="date" id="evEndDate" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">รายละเอียด</label>
                    <input type="text" id="evDesc" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="สถานที่ห้องประชุม / หมายเหตุ...">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกข้อมูล',
        confirmButtonColor: '#3b82f6',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const title = document.getElementById('evTitle').value;
            const type = document.getElementById('evType').value;
            const date = document.getElementById('evDate').value;
            const endDate = document.getElementById('evEndDate').value;
            const desc = document.getElementById('evDesc').value;

            if (!title || !date) {
                Swal.showValidationMessage('กรุณากรอกชื่อและวันที่เริ่มต้น');
                return false;
            }
            return { title, type, date, endDate, desc };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            const val = res.value;
            const newId = (mockAcademicCalendar.length > 0) ? Math.max(...mockAcademicCalendar.map(x => x.id)) + 1 : 1;
            mockAcademicCalendar.push({
                id: newId,
                title: val.title,
                type: val.type,
                date: val.date,
                endDate: val.endDate,
                desc: val.desc
            });
            loadAcademicCalendar();
            Swal.fire({ icon: 'success', title: 'สำเร็จ!', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

function deleteAcCalendar(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'เหตุการณ์นี้จะถูกลบออกจากปฏิทินอย่างถาวร',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonText: 'ยกเลิก',
        confirmButtonText: 'ลบข้อมูล'
    }).then(res => {
        if (res.isConfirmed) {
            mockAcademicCalendar = mockAcademicCalendar.filter(x => x.id !== id);
            loadAcademicCalendar();
            Swal.fire({ icon: 'success', title: 'ลบสำเร็จ!', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

function editAcCalendar(id) {
    const ev = mockAcademicCalendar.find(x => x.id === id);
    if (!ev) return;

    Swal.fire({
        title: 'แก้ไขข้อมูล',
        html: `
            <div class="text-left text-sm mt-3 space-y-3 p-1">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ชื่อกิจกรรม</label>
                    <input type="text" id="evTitleEdit" value="${ev.title}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ประเภท</label>
                        <select id="evTypeEdit" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                            <option value="activity" ${ev.type === 'activity' ? 'selected' : ''}>กิจกรรม (ทั่วไป)</option>
                            <option value="exam" ${ev.type === 'exam' ? 'selected' : ''}>การสอบ (Exam)</option>
                            <option value="meeting" ${ev.type === 'meeting' ? 'selected' : ''}>ประชุม (Meeting)</option>
                            <option value="holiday" ${ev.type === 'holiday' ? 'selected' : ''}>วันหยุดราชการ (Holiday)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">วันที่เริ่มต้น</label>
                        <input type="date" id="evDateEdit" value="${ev.date}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                    </div>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">วันที่สิ้นสุด <span class="text-slate-400 font-normal">(ถ้ามี)</span></label>
                    <input type="date" id="evEndDateEdit" value="${ev.endDate}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">รายละเอียด</label>
                    <input type="text" id="evDescEdit" value="${ev.desc}" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> อัปเดตข้อมูล',
        confirmButtonColor: '#3b82f6',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const title = document.getElementById('evTitleEdit').value;
            const type = document.getElementById('evTypeEdit').value;
            const date = document.getElementById('evDateEdit').value;
            const endDate = document.getElementById('evEndDateEdit').value;
            const desc = document.getElementById('evDescEdit').value;

            if (!title || !date) {
                Swal.showValidationMessage('กรุณากรอกชื่อและวันที่เริ่มต้น');
                return false;
            }
            return { title, type, date, endDate, desc };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            const val = res.value;
            const idx = mockAcademicCalendar.findIndex(x => x.id === id);
            if (idx !== -1) {
                mockAcademicCalendar[idx] = {
                    id: id,
                    title: val.title,
                    type: val.type,
                    date: val.date,
                    endDate: val.endDate,
                    desc: val.desc
                };
            }
            loadAcademicCalendar();
            Swal.fire({ icon: 'success', title: 'แก้ไขสำเร็จ!', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

// ==========================================
// ACADEMIC SUBSYSTEM LOGIC
// ==========================================

function openAcademicSubsystem(type) {
    const views = ['assignment', 'schedule', 'attendance', 'evaluation', 'exams', 'curriculum', 'supervision'];
    document.getElementById('academic-dashboard-view').classList.add('hidden');
    views.forEach(v => {
        const el = document.getElementById('academic-' + v + '-view');
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById('academic-' + type + '-view');
    if (target) {
        target.classList.remove('hidden');
    }

    // Call specific render functions if needed
    if (type === 'assignment') {
        // init assignment view
    } else if (type === 'schedule') {
        renderScheduleGrid();
    } else if (type === 'curriculum') {
        // init curriculum
    }
}

function closeAcademicSubsystem() {
    const views = ['assignment', 'schedule', 'attendance', 'evaluation', 'exams', 'curriculum', 'supervision'];
    views.forEach(v => {
        const el = document.getElementById('academic-' + v + '-view');
        if (el) el.classList.add('hidden');
    });
    document.getElementById('academic-dashboard-view').classList.remove('hidden');
}

// Mock Data for Academic Subsystems
let mockAcademicAssignments = [];
let mockAcademicCurriculum = [];
let mockAcademicExams = [];

// ==========================================
// ACADEMIC INTERACTIVE LOGIC
// ==========================================

function openScheduleSetupModal() {
    Swal.fire({
        title: 'จัดตารางสอนอัตโนมัติ',
        html: `
            <div class="text-left text-sm mt-2 text-slate-600 space-y-3">
                <p>ระบบจะทำการคำนวณและจัดตารางสอนให้กับบุคลากรทั้งหมด <b>45 ท่าน</b> สำหรับ <b>24 ห้องเรียน</b> ตามโครงสร้างหลักสูตร</p>
                <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                    <i class="fa-solid fa-triangle-exclamation mr-1"></i> <b>ข้อควรระวัง:</b> ตารางสอนเดิมของภาคเรียนนี้อาจถูกเขียนทับ
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i> เริ่มจัดตาราง',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#4f46e5'
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire({
                title: 'กำลังคำนวณตารางสอน...',
                html: 'ประมวลผลเงื่อนไขรายวิชาและเวลาว่างของครู',
                timer: 2000,
                timerProgressBar: true,
                didOpen: () => {
                    Swal.showLoading()
                }
            }).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'จัดตารางสอนสำเร็จ',
                    text: 'ตารางสอน 850 คาบ ถูกจัดวางสมบูรณ์และไม่มีการชนเวลา'
                });
            });
        }
    });
}

function openAddSubjectModal() {
    Swal.fire({
        title: 'เพิ่มรายวิชาในหลักสูตร',
        html: `
            <div class="text-left text-sm mt-3 space-y-3 px-1">
                <div>
                    <label class="block font-bold text-slate-700 mb-1">รหัสวิชา</label>
                    <input type="text" id="swalSubjectCode" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200" placeholder="เช่น ค21101">
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ชื่อรายวิชา</label>
                    <input type="text" id="swalSubjectName" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200" placeholder="เช่น คณิตศาสตร์ 1">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ประเภท</label>
                        <select id="swalSubjectType" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200">
                            <option value="พื้นฐาน">รายวิชาพื้นฐาน</option>
                            <option value="เพิ่มเติม">รายวิชาเพิ่มเติม</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">หน่วยกิต</label>
                        <input type="number" id="swalSubjectCredit" step="0.5" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-200" value="1.0">
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึกรายวิชา',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const code = document.getElementById('swalSubjectCode').value;
            const name = document.getElementById('swalSubjectName').value;
            if (!code || !name) Swal.showValidationMessage('กรุณากรอกรหัสและชื่อวิชาให้ครบถ้วน');
            return { code, name };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire({ icon: 'success', title: 'เพิ่มรายวิชาเรียบร้อย', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

function submitAttendance() {
    Swal.fire({
        icon: 'question',
        title: 'ยืนยันบันทึกการเข้าเรียน?',
        text: 'การตรวจสอบเวลาเรียนคาบนี้ถือว่าเสร็จสิ้น',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก'
    }).then((res) => {
        if (res.isConfirmed) {
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ!', text: 'ข้อมูลการเข้าเรียนถูกจัดเก็บในระบบแล้ว', confirmButtonColor: '#e11d48' });
        }
    });
}

function processUpload() {
    closeUploadModal();
    Swal.fire({
        icon: 'success',
        title: 'ส่งงานเรียบร้อย!',
        text: 'ภาระงานของคุณถูกส่งเข้าระบบตรวจรับงานวิชาการแล้ว',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#2563eb'
    });
}

function renderScheduleGrid() {
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;

    // Create a mock grid for schedule (mostly view-only html)
    let gridHtml = `
    <div class="grid grid-cols-[80px_1fr] border border-slate-200 rounded-xl overflow-hidden text-sm min-w-[800px]">
        <div class="bg-slate-50 font-bold text-slate-500 p-3 text-center border-r border-b border-slate-200">&nbsp;</div>
        <div class="grid grid-cols-8 bg-slate-50 border-b border-slate-200">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(i =>
        '<div class="p-3 text-center border-r border-slate-200 font-bold text-slate-600 last:border-r-0 text-xs flex flex-col items-center justify-center">คาบ ' + i + '<div class="text-[9px] text-slate-400 font-normal mt-0.5">08:30 - 09:20</div></div>'
    ).join('')}
        </div>
    `;

    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
    days.forEach((day, idx) => {
        gridHtml += `
        <div class="bg-slate-50 font-bold text-slate-700 p-3 flex flex-col items-center justify-center border-r border-b border-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">${day}</div>
        <div class="grid grid-cols-8 border-b border-slate-200 group hover:bg-slate-50/50 transition duration-150 relative">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
            // mock some lessons
            if (idx === 0 && i === 1) return '<div class="p-2 border-r border-slate-100 last:border-r-0"><div class="h-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-center text-xs text-blue-800 hover:bg-blue-100 cursor-pointer transition"><p class="font-bold">ค21101</p><p class="text-[10px] text-blue-600 truncate">ม.1/1</p></div></div>';
            if (idx === 0 && i === 2) return '<div class="p-2 border-r border-slate-100 last:border-r-0"><div class="h-full bg-blue-50 border border-blue-200 rounded-lg p-2 text-center text-xs text-blue-800 hover:bg-blue-100 cursor-pointer transition"><p class="font-bold">ค21101</p><p class="text-[10px] text-blue-600 truncate">ม.1/1</p></div></div>';
            if (idx === 1 && i === 4) return '<div class="p-2 border-r border-slate-100 last:border-r-0"><div class="h-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center text-xs text-emerald-800 hover:bg-emerald-100 cursor-pointer transition"><p class="font-bold">ว21101</p><p class="text-[10px] text-emerald-600 truncate">ม.1/1</p></div></div>';
            if (idx === 2 && i === 6) return '<div class="p-2 border-r border-slate-100 last:border-r-0"><div class="h-full bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-xs text-amber-800 hover:bg-amber-100 cursor-pointer transition"><p class="font-bold">ส21101</p><p class="text-[10px] text-amber-600 truncate">ม.1/1</p></div></div>';
            if (idx === 4 && i === 7) return '<div class="p-2 border-r border-slate-100 last:border-r-0"><div class="h-full bg-rose-50 border border-rose-200 rounded-lg p-2 text-center text-xs text-rose-800 hover:bg-rose-100 cursor-pointer transition"><p class="font-bold">ลูกเสือ</p><p class="text-[10px] text-rose-600 truncate">ม.1/1</p></div></div>';

            return '<div class="p-2 border-r border-slate-100 last:border-r-0"></div>';
        }).join('')}
        </div>
        `;
    });

    gridHtml += '</div>';
    grid.innerHTML = gridHtml;
}

// ==========================================
// BUDGET SUBSYSTEM LOGIC
// ==========================================

function openBudgetSubsystem(type) {
    const views = ['planning', 'finance', 'procurement', 'audit'];
    document.getElementById('budget-dashboard-view').classList.add('hidden');
    views.forEach(v => {
        const el = document.getElementById('budget-' + v + '-view');
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById('budget-' + type + '-view');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-fade-in');

        // Load specific data based on type
        if (type === 'planning') renderBudgetPlanning();
        if (type === 'finance') renderBudgetFinance();
        if (type === 'procurement') renderBudgetProcurement();
        if (type === 'audit') renderBudgetAudit();
    }
}

function closeBudgetSubsystem() {
    const views = ['planning', 'finance', 'procurement', 'audit'];
    views.forEach(v => {
        const el = document.getElementById('budget-' + v + '-view');
        if (el) el.classList.add('hidden');
    });
    const dashboard = document.getElementById('budget-dashboard-view');
    if (dashboard) {
        dashboard.classList.remove('hidden');
        dashboard.classList.add('animate-fade-in');
    }
}

// --- MOCK DATA ---
let mockBudgetProjects = [
    { id: 'PJ001', name: 'โครงการปรับปรุงห้องคอมพิวเตอร์', owner: 'ครูสมปอง', amount: 150000, status: 'approved' },
    { id: 'PJ002', name: 'โครงการจัดซื้อหนังสือห้องสมุด', owner: 'ครูสมหญิง', amount: 30000, status: 'pending' },
    { id: 'PJ003', name: 'โครงการกีฬาสีประจำปี', owner: 'ครูสมชาย', amount: 80000, status: 'rejected' }
];

let mockBudgetLedger = [
    { date: '2026-03-01', type: 'income', detail: 'เงินอุดหนุนรายหัว', ref: 'REC-69001', amount: 500000, balance: 500000 },
    { date: '2026-03-05', type: 'expense', detail: 'จ่ายค่าวัสดุสำนักงาน', ref: 'PAY-69001', amount: 15000, balance: 485000 },
    { date: '2026-03-08', type: 'income', detail: 'ค่าบำรุงการศึกษา', ref: 'REC-69002', amount: 120000, balance: 605000 }
];

let mockProcurements = [
    { id: 'PR69-001', item: 'กระดาษ A4 100 ริม', date: '2026-03-02', amount: 12000, status: 'completed' },
    { id: 'PR69-002', item: 'คอมพิวเตอร์ตั้งโต๊ะ 5 เครื่อง', date: '2026-03-06', amount: 100000, status: 'processing' },
    { id: 'PR69-003', item: 'ซ่อมแซมหลังคาอาคาร 2', date: '2026-03-07', amount: 45000, status: 'pending' }
];

let mockDonations = [
    { date: '2026-02-15', donor: 'ศิษย์เก่า รุ่น 45', amount: 50000, purpose: 'ทุนการศึกษา', receipt: 'issued' },
    { date: '2026-03-01', donor: 'บจก. ใจดี การช่าง', amount: 20000, purpose: 'ซ่อมแซมโรงอาหาร', receipt: 'issued' },
    { date: '2026-03-08', donor: 'ผู้ปกครอง ด.ช. รักเรียน', amount: 5000, purpose: 'ทั่วไป', receipt: 'pending' }
];

// --- RENDER FUNCTIONS ---
function renderBudgetPlanning() {
    const tbody = document.getElementById('budget-planning-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    mockBudgetProjects.forEach(pj => {
        let statusBadge = '';
        if (pj.status === 'approved') statusBadge = '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">อนุมัติแล้ว</span>';
        else if (pj.status === 'pending') statusBadge = '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">รอพิจารณา</span>';
        else statusBadge = '<span class="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-medium">ไม่อนุมัติ</span>';

        tbody.innerHTML += `
        < tr class="hover:bg-slate-50 border-b border-slate-100" >
                <td class="p-3 text-sm text-slate-700">${pj.id}</td>
                <td class="p-3 text-sm font-medium text-slate-800">${pj.name}</td>
                <td class="p-3 text-sm text-slate-600">${pj.owner}</td>
                <td class="p-3 text-sm text-right text-slate-700 font-medium">${pj.amount.toLocaleString()} ฿</td>
                <td class="p-3 text-sm text-center">${statusBadge}</td>
                <td class="p-3 text-sm text-center">
                    <button class="text-blue-600 hover:text-blue-800 p-1"><i class="fa-solid fa-file-lines"></i></button>
                    ${pj.status === 'pending' ? `<button class="text-slate-400 hover:text-rose-600 p-1 ml-1" onclick="deleteBudgetProject('${pj.id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
            </tr >
        `;
    });
}

function renderBudgetFinance() {
    const tbody = document.getElementById('budget-finance-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    mockBudgetLedger.forEach(lg => {
        const isInc = lg.type === 'income';
        const typeBadge = isInc
            ? '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium text-xs"><i class="fa-solid fa-arrow-down mr-1"></i> รายรับ</span>'
            : '<span class="px-2 py-1 bg-rose-100 text-rose-700 rounded font-medium text-xs"><i class="fa-solid fa-arrow-up mr-1"></i> รายจ่าย</span>';
        const amountClass = isInc ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold';
        const amountPrefix = isInc ? '+' : '-';

        tbody.innerHTML += `
        < tr class="hover:bg-slate-50 border-b border-slate-100" >
                <td class="p-3 text-sm text-slate-600">${lg.date}</td>
                <td class="p-3 text-sm">${typeBadge}</td>
                <td class="p-3 text-sm text-slate-800">${lg.detail} <div class="text-[10px] text-slate-400">Ref: ${lg.ref}</div></td>
                <td class="p-3 text-sm text-right ${amountClass}">${amountPrefix}${lg.amount.toLocaleString()} ฿</td>
                <td class="p-3 text-sm text-right text-slate-700 font-bold">${lg.balance.toLocaleString()} ฿</td>
            </tr >
        `;
    });
}

function renderBudgetProcurement() {
    const tbody = document.getElementById('budget-procurement-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    mockProcurements.forEach(pr => {
        let statusBadge = '';
        if (pr.status === 'completed') statusBadge = '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">เสร็จสิ้น (รับของ)</span>';
        else if (pr.status === 'processing') statusBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">กำลังดำเนินการ</span>';
        else statusBadge = '<span class="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">รออนุมัติจัดซื้อ</span>';

        tbody.innerHTML += `
        < tr class="hover:bg-slate-50 border-b border-slate-100" >
                <td class="p-3 text-sm font-medium text-slate-700">${pr.id}</td>
                <td class="p-3 text-sm text-slate-800">${pr.item}</td>
                <td class="p-3 text-sm text-slate-600">${pr.date}</td>
                <td class="p-3 text-sm text-right text-slate-700">${pr.amount.toLocaleString()} ฿</td>
                <td class="p-3 text-sm text-center">${statusBadge}</td>
                <td class="p-3 text-sm text-center">
                    <button class="text-blue-600 hover:text-blue-800 p-1"><i class="fa-solid fa-print"></i></button>
                    ${pr.status === 'processing' ? `<button class="text-emerald-600 hover:text-emerald-800 p-1 ml-1" title="ตรวจรับพัสดุ"><i class="fa-solid fa-box-open"></i></button>` : ''}
                </td>
            </tr >
        `;
    });
}

function renderBudgetAudit() {
    const list = document.getElementById('budget-donation-list');
    if (!list) return;
    list.innerHTML = '';
    mockDonations.forEach((dn) => {
        const rcColor = dn.receipt === 'issued' ? 'emerald' : 'amber';
        const rcText = dn.receipt === 'issued' ? '+' + dn.amount.toLocaleString() : 'รอออกใบเสร็จ';

        list.innerHTML += `
        < div class="flex items-center justify-between border-b border-slate-100 pb-3" >
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">${dn.donor}</p>
                        <p class="text-[10px] text-slate-500">${dn.date} • ${dn.purpose}</p>
                    </div>
                </div>
                <p class="font-bold text-${rcColor}-600 text-sm">${rcText}</p>
            </div >
        `;
    });
}

// --- INTERACTION FUNCTIONS ---
function requestBudget() {
    Swal.fire({
        title: 'เสนอโครงการ/ขอรับจัดสรรงบ',
        html: `
        < div class="space-y-3 text-left" >
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อโครงการ</label>
                    <input type="text" id="swal-pj-name" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="ระบุชื่อโครงการ">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">ผู้รับผิดชอบ</label>
                    <input type="text" id="swal-pj-owner" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none" value="${typeof currentUser !== 'undefined' && currentUser ? currentUser.name : ''}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">จำนวนงบประมาณที่ขอ (บาท)</label>
                    <input type="number" id="swal-pj-amount" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="ตัวอย่าง: 50000">
                </div>
            </div >
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-paper-plane"></i> ส่งคำขอ',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const name = document.getElementById('swal-pj-name').value;
            const owner = document.getElementById('swal-pj-owner').value;
            const amount = document.getElementById('swal-pj-amount').value;
            if (!name || !amount) {
                Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
            }
            return { name, owner, amount: parseInt(amount) };
        }
    }).then(result => {
        if (result.isConfirmed) {
            const id = 'PJ' + Math.floor(100 + Math.random() * 900);
            mockBudgetProjects.unshift({
                id: id,
                name: result.value.name,
                owner: result.value.owner,
                amount: result.value.amount,
                status: 'pending'
            });
            renderBudgetPlanning();
            Swal.fire('สำเร็จ!', 'ส่งคำขอรับการจัดสรรเรียบร้อยแล้ว', 'success');
        }
    });
}

function deleteBudgetProject(id) {
    Swal.fire({
        title: 'ยืนยันการลบ?',
        text: 'ต้องการลบคำขอโครงการนี้ใช่หรือไม่',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            mockBudgetProjects = mockBudgetProjects.filter(p => p.id !== id);
            renderBudgetPlanning();
            Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

function addFinanceRecord() {
    Swal.fire({
        title: 'บันทึก รับ/จ่าย เงิน',
        html: `
        < div class="space-y-3 text-left mt-2" >
                <div class="grid grid-cols-2 gap-3">
                    <button type="button" id="btnRecIncome" class="w-full py-2 border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold rounded-lg" onclick="document.getElementById('swal-fin-type').value='income'; this.classList.add('border-emerald-500','bg-emerald-50','text-emerald-700'); this.classList.remove('border-slate-200','text-slate-500'); document.getElementById('btnRecExpense').classList.remove('border-rose-500','bg-rose-50','text-rose-700'); document.getElementById('btnRecExpense').classList.add('border-slate-200','text-slate-500');">รายรับ</button>
                    <button type="button" id="btnRecExpense" class="w-full py-2 border-2 border-slate-200 text-slate-500 font-bold rounded-lg" onclick="document.getElementById('swal-fin-type').value='expense'; this.classList.add('border-rose-500','bg-rose-50','text-rose-700'); this.classList.remove('border-slate-200','text-slate-500'); document.getElementById('btnRecIncome').classList.remove('border-emerald-500','bg-emerald-50','text-emerald-700'); document.getElementById('btnRecIncome').classList.add('border-slate-200','text-slate-500');">รายจ่าย</button>
                    <input type="hidden" id="swal-fin-type" value="income">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">รายการ</label>
                    <input type="text" id="swal-fin-detail" class="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-200" placeholder="เช่น ค่าวัสดุ, ค่าบำรุง">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">จำนวนเงิน (บาท)</label>
                    <input type="number" id="swal-fin-amount" class="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-200" placeholder="0.00">
                </div>
            </div >
        `,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const type = document.getElementById('swal-fin-type').value;
            const detail = document.getElementById('swal-fin-detail').value;
            const amount = parseFloat(document.getElementById('swal-fin-amount').value);
            if (!detail || !amount) Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
            return { type, detail, amount };
        }
    }).then(result => {
        if (result.isConfirmed) {
            const val = result.value;
            const lastBalance = mockBudgetLedger.length > 0 ? mockBudgetLedger[mockBudgetLedger.length - 1].balance : 0;
            const newBalance = val.type === 'income' ? lastBalance + val.amount : lastBalance - val.amount;
            const ref = (val.type === 'income' ? 'REC-' : 'PAY-') + Math.floor(10000 + Math.random() * 90000);

            mockBudgetLedger.push({
                date: new Date().toISOString().split('T')[0],
                type: val.type,
                detail: val.detail,
                ref: ref,
                amount: val.amount,
                balance: newBalance
            });
            renderBudgetFinance();
            Swal.fire({ icon: 'success', title: 'บันทึกบัญชีเรียบร้อย', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

function addProcurement() {
    Swal.fire({
        title: 'สร้างรายการจัดซื้อจัดจ้าง',
        html: `
        < div class="space-y-3 text-left mt-2 px-1" >
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">รายการพัสดุ/รายการจ้าง</label>
                    <input type="text" id="swal-pr-item" class="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" placeholder="ชื่อวัสดุ หรือโครงการ">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1">วงเงินที่คาดว่าจะซื้อ/จ้าง (บาท)</label>
                    <input type="number" id="swal-pr-amount" class="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200" placeholder="0.00">
                </div>
            </div >
        `,
        showCancelButton: true,
        confirmButtonText: 'สร้างรายการ',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const item = document.getElementById('swal-pr-item').value;
            const amount = parseFloat(document.getElementById('swal-pr-amount').value);
            if (!item || !amount) Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบ');
            return { item, amount };
        }
    }).then(res => {
        if (res.isConfirmed) {
            const id = 'PR69-' + Math.floor(100 + Math.random() * 900);
            mockProcurements.unshift({
                id: id,
                item: res.value.item,
                amount: res.value.amount,
                date: new Date().toISOString().split('T')[0],
                status: 'pending'
            });
            renderBudgetProcurement();
            Swal.fire({ icon: 'success', title: 'สร้างรายการสำเร็จ!', text: 'รายการถูกส่งเข้าสู่กระบวนการพัสดุแล้ว' });
        }
    });
}

function openAuditReport() {
    Swal.fire({
        title: 'สรุปรายงานการตรวจสอบภายใน',
        html: `
        < div class="text-left text-sm text-slate-600 mt-2 space-y-2" >
                <p>ผลการตรวจสอบประจำไตรมาสที่ 1/2569</p>
                <div class="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                    <i class="fa-solid fa-check-circle mr-2"></i> การเบิกจ่ายงบประมาณเป็นไปตามระเบียบ 100%
                </div>
                <div class="p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
                    <i class="fa-solid fa-info-circle mr-2"></i> การจัดทำทะเบียนคุมทรัพย์สินครบถ้วนสมบูรณ์
                </div>
                <div class="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100">
                    <i class="fa-solid fa-exclamation-triangle mr-2"></i> ข้อเสนอแนะ: ควรเร่งรัดการเบิกจ่ายงบเรียนฟรี 15 ปี
                </div>
            </div >
        `,
        confirmButtonText: 'ปิด'
    });
}

function renderMiniCalendar() {
    const list = document.getElementById('academicMiniCalendarList');
    if (!list) return;

    // Get events from today onwards, max 3 events
    const todayStr = new Date().toLocaleString('sv').substring(0, 10);
    const upcomingEvents = mockAcademicCalendar
        .filter(ev => {
            if (ev.endDate) return ev.endDate >= todayStr;
            return ev.date >= todayStr;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    if (upcomingEvents.length === 0) {
        list.innerHTML = '<div class="text-center text-sm text-slate-400 py-4">ไม่มีกำหนดการเร็วๆ นี้</div>';
        return;
    }

    list.innerHTML = upcomingEvents.map(ev => {
        let typeClass = 'bg-white/10 border-white/10 text-white';
        let numClass = 'text-white';
        let titleClass = 'text-blue-100';

        if (ev.type === 'exam') { typeClass = 'bg-rose-500/20 border-rose-500/30 text-rose-300'; numClass = 'text-rose-200'; titleClass = 'text-rose-100'; }
        else if (ev.type === 'meeting') { typeClass = 'bg-amber-500/20 border-amber-500/30 text-amber-300'; numClass = 'text-amber-200'; titleClass = 'text-amber-100'; }
        else if (ev.type === 'holiday') { typeClass = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'; numClass = 'text-emerald-200'; titleClass = 'text-emerald-100'; }

        const d = new Date(ev.date);
        const day = d.getDate();
        const monthShort = d.toLocaleDateString('th-TH', { month: 'short' });

        return `
        < div class="flex gap-4 animate-fade-in" >
            <div class="shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center border backdrop-blur-sm ${typeClass}">
                <span class="text-[9px] uppercase font-bold">${monthShort}</span>
                <span class="text-lg font-black leading-none mt-0.5 ${numClass}">${day}</span>
            </div>
            </div >
        </div > `;
    }).join('');
}

// ==========================================
// USER MANAGEMENT LOGIC
// ==========================================

let mockUsers = [
    { id: 1, name: 'สมปอง ทดสอบ', username: 'kru', role: 'teacher', status: 'active', color: 'green' },
    { id: 2, name: 'ผู้ดูแล ระบบ', username: 'admin', role: 'admin', status: 'active', color: 'purple' },
    { id: 3, name: 'ผู้อำนวยการ ท่านหนึ่ง', username: 'director', role: 'director', status: 'active', color: 'amber' }
];

const parseRole = (role) => {
    switch (role) {
        case 'admin': return { label: 'ผู้ดูแลระบบ', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' };
        case 'director': return { label: 'ผู้บริหาร', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' };
        case 'teacher': return { label: 'ครูผู้สอน', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' };
        case 'staff': return { label: 'บุคลากร', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
        case 'clerk': return { label: 'ธุรการ', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' };
        case 'student_council': return { label: 'สภานักเรียน', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' };
        case 'general': return { label: 'บุคคลทั่วไป', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
        default: return { label: role, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
};

function renderSettingsUsers() {
    const tbody = document.getElementById('setting-users-tbody');
    if (!tbody) return;

    const searchStr = (document.getElementById('setting-user-search') ? document.getElementById('setting-user-search').value.toLowerCase() : '');
    const filterRole = (document.getElementById('setting-user-filter') ? document.getElementById('setting-user-filter').value : '');

    const filtered = mockUsers.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(searchStr) || u.username.toLowerCase().includes(searchStr);
        const matchRole = filterRole === '' || u.role === filterRole;
        return matchSearch && matchRole;
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500 font-medium border-b border-slate-100">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</td></tr>';
        return;
    }

    filtered.forEach(u => {
        const roleInfo = parseRole(u.role);
        const initial = u.name.substring(0, 2);

        tbody.innerHTML += `
        < tr class="border-b border-slate-100 hover:bg-slate-50/50 transition" >
                <td class="p-4 font-medium text-slate-800">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-${u.color}-100 text-${u.color}-600 flex items-center justify-center font-bold text-xs shrink-0">
                            ${initial}
                        </div>
                        ${u.name}
                    </div>
                </td>
                <td class="p-4 text-slate-600">${u.username}</td>
                <td class="p-4">
                    <span class="px-2.5 py-1 ${roleInfo.bg} ${roleInfo.text} rounded-lg text-xs font-bold border ${roleInfo.border}">
                        ${roleInfo.label}
                    </span>
                </td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full flex-shrink-0 ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}"></div>
                        <span class="text-slate-600 text-xs">${u.status === 'active' ? 'ใช้งานปกติ' : 'ระงับการใช้งาน'}</span>
                    </div>
                </td>
                <td class="p-4 text-center">
                    <div class="flex justify-center gap-2">
                        <button onclick="demoAlert('รีเซ็ตรหัสผ่านให้ ${u.name}')"
                            class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition flex items-center justify-center" title="รีเซ็ตรหัสผ่าน">
                            <i class="fa-solid fa-key text-xs"></i>
                        </button>
                        <button onclick="demoAlert('แก้ไขผู้ใช้ ${u.name}')"
                            class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center justify-center" title="แก้ไข">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="confirmAction('ระงับผู้ใช้งาน')"
                            class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center" title="ระงับ/ลบ">
                            <i class="fa-solid fa-ban text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr >
        `;
    });
}

function openAddUserModal() {
    Swal.fire({
        title: 'เพิ่มผู้ใช้งานใหม่',
        html: `
        < div class="text-left text-sm mt-3 space-y-3 p-1 font-sans" >
                <div>
                    <label class="block font-bold text-slate-700 mb-1">ชื่อ-นามสกุล <span class="text-red-500">*</span></label>
                    <input type="text" id="addUserName" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="เช่น นายสมชาย ใจดี" required>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Username <span class="text-red-500">*</span></label>
                    <input type="text" id="addUserUsername" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="ภาษาอังกฤษหรือตัวเลข" required>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">Password <span class="text-red-500">*</span></label>
                    <input type="password" id="addUserPassword" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100" placeholder="รหัสผ่านเริ่มต้น" required>
                </div>
                <div>
                    <label class="block font-bold text-slate-700 mb-1">บทบาท/ตำแหน่ง <span class="text-red-500">*</span></label>
                    <select id="addUserRole" class="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
                        <option value="teacher">ครูผู้สอน</option>
                        <option value="staff">บุคลากร</option>
                        <option value="clerk">ธุรการ</option>
                        <option value="director">ผู้บริหาร</option>
                        <option value="student_council">สภานักเรียน</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                        <option value="general">บุคคลทั่วไป</option>
                    </select>
                </div>
            </div >
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="fa-solid fa-save"></i> บันทึกข้อมูล',
        confirmButtonColor: '#3b82f6',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            const name = document.getElementById('addUserName').value;
            const username = document.getElementById('addUserUsername').value;
            const password = document.getElementById('addUserPassword').value;
            const role = document.getElementById('addUserRole').value;

            if (!name || !username || !password) {
                Swal.showValidationMessage('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');
                return false;
            }
            return { name, username, password, role };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            const val = res.value;

            // Generate a random tailwind color for avatar
            const colors = ['blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'indigo', 'pink', 'teal'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newId = (mockUsers.length > 0) ? Math.max(...mockUsers.map(x => x.id)) + 1 : 1;
            mockUsers.push({
                id: newId,
                name: val.name,
                username: val.username,
                role: val.role,
                status: 'active',
                color: randomColor
            });

            renderSettingsUsers();
            Swal.fire({
                icon: 'success',
                title: 'สร้างบัญชีผู้ใช้สำเร็จ!',
                html: 'เพิ่ม <b>' + val.name + '</b> (' + val.username + ') เข้าสู่ระบบแล้ว',
                confirmButtonColor: '#3b82f6'
            });
        }
    });
}

// Initial Render
renderSettingsUsers();

// ==========================================
// BACKUP SYSTEM LOGIC (GOOGLE DRIVE)
// ==========================================

let googleDriveFolderId = '';

function saveGoogleDriveFolder() {
    const inputId = document.getElementById('gdrive-folder-id').value.trim();
    if (!inputId) {
        Swal.fire({
            icon: 'warning',
            title: 'กรุณาระบุ Folder ID',
            text: 'คุณต้องระบุ Google Drive Folder ID ก่อนบันทึก'
        });
        return;
    }

    // In a real app, this might be a server call
    googleDriveFolderId = inputId;

    Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ!',
        text: 'ระบบจะสำรองข้อมูลไปยัง Folder ID: ' + googleDriveFolderId,
        confirmButtonColor: '#3b82f6'
    });
}

function executeDemoBackup() {
    if (!googleDriveFolderId) {
        Swal.fire({
            icon: 'warning',
            title: 'ยังไม่ได้ตั้งค่า Google Drive',
            text: 'กรุณาระบุ Folder ID ด่านบนก่อนทำการสำรองข้อมูล',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    const progressContainer = document.getElementById('backup-progress-container');
    const progressBar = document.getElementById('backup-progress-bar');
    const percentageText = document.getElementById('backup-percentage');
    const statusText = document.getElementById('backup-status-text');
    const btn = document.getElementById('backup-btn');

    if (!progressContainer || !progressBar || !btn) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเตรียมการ...';
    progressContainer.classList.remove('hidden');

    const steps = [
        { p: 10, text: 'กำลังเชื่อมต่อ Google Drive...' },
        { p: 30, text: 'กำลังบีบอัดฐานข้อมูล...' },
        { p: 60, text: 'กำลังอัปโหลดไฟล์ System_DB.zip...' },
        { p: 85, text: 'กำลังอัปโหลดไฟล์แนบและรูปภาพ...' },
        { p: 100, text: 'เสร็จสมบูรณ์' }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep >= steps.length) {
            clearInterval(interval);

            // Finish
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> เริ่มสำรองข้อมูล';

                // Add to history
                addBackupHistoryRow();

                Swal.fire({
                    icon: 'success',
                    title: 'สำรองข้อมูลสำเร็จ',
                    html: `ไฟล์ถูกอัปโหลดไปยัง Google Drive Folder ID: <br><b class="text-blue-600">${googleDriveFolderId}</b>`,
                    confirmButtonColor: '#3b82f6'
                });
            }, 1000);
            return;
        }

        const step = steps[currentStep];
        progressBar.style.width = step.p + '%';
        percentageText.innerText = step.p + '%';
        statusText.innerText = step.text;

        currentStep++;
    }, 800);
}

function addBackupHistoryRow() {
    const list = document.getElementById('backup-history-list');
    if (!list) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    const newRow = document.createElement('tr');
    newRow.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition bg-blue-50/30';
    newRow.innerHTML = `
        <td class="p-4 font-medium text-slate-800">
            <div class="flex items-center gap-2">
                <i class="fa-regular fa-clock text-blue-500 text-xs"></i>
                ${dateStr} <span class="text-slate-500 ml-1">${timeStr}</span>
            </div>
            <div class="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <i class="fa-brands fa-google-drive"></i> ไปยัง G-Drive
            </div>
        </td>
        <td class="p-4 text-slate-600">
            <span class="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs border border-green-200">Manual Backup</span>
        </td>
        <td class="p-4 text-slate-600">849 MB</td>
        <td class="p-4">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                    ผด
                </div>
                ผู้ดูแล ระบบ
            </div>
        </td>
        <td class="p-4 text-center">
            <button onclick="demoAlert('เปิดโฟลเดอร์ Google Drive')" class="text-blue-500 hover:text-blue-700 transition" title="เปิดใน Google Drive">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </button>
        </td>
        `;

    // Insert at the top
    list.insertBefore(newRow, list.firstChild);
}


// Load dynamic data into the academic dashboard
function loadAcademicDashboard() {
    // 1. Update quick stats (mocking dynamic calculation from other subsystems)
    const totalStudents = 2450;
    const avgGrade = 2.84;

    // Calculate pending approvals from mock evaluation data if available
    let pendingApprovalsCount = 14;
    let pendingApprovalsHtml = '';

    // Mock pending approvals
    const mockApprovals = [
        { code: 'ว30101', name: 'วิทยาศาสตร์พื้นฐาน', teacher: 'ครูสมศรี เรียนดี', date: '10 ม.ค. 67, 14:30 น.', status: 'pending', icon: 'ว' },
        { code: 'ค31101', name: 'คณิตศาสตร์ 1', teacher: 'ครูสมชาย ขยัน', date: '09 ม.ค. 67, 09:15 น.', status: 'pending', icon: 'ค' },
        { code: 'อ30101', name: 'ภาษาอังกฤษ', teacher: 'ครูเจนจิรา ฟอร์ยู', date: '08 ม.ค. 67, 16:00 น.', status: 'approved', icon: 'อ' }
    ];

    document.getElementById('dashTotalStudents').innerText = totalStudents.toLocaleString();
    document.getElementById('dashAvgGrade').innerText = avgGrade;
    document.getElementById('dashPendingApproval').innerHTML = `${pendingApprovalsCount}<span class="text-sm font-medium text-slate-400 ml-1">วิชา</span>`;

    // 2. Render approvals list
    const approvalsContainer = document.getElementById('academicDashboardApprovalsList');
    if (approvalsContainer) {
        approvalsContainer.innerHTML = mockApprovals.map(req => {
            if (req.status === 'pending') {
                return `
                <div class="p-4 px-6 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50 transition">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">${req.icon}</div>
                        <div>
                            <p class="font-bold text-slate-800 text-sm gap-2 flex items-center">${req.code} ${req.name} <span class="bg-amber-100 text-amber-600 text-[9px] px-2 py-0.5 rounded-md">รออนุมัติ</span></p>
                            <p class="text-[11px] text-slate-500 mt-0.5">${req.teacher} | ส่งเมื่อ: ${req.date}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition flex items-center justify-center" title="อนุมัติ" onclick="Swal.fire('สำเร็จ', 'อนุมัติผลการเรียนสำเร็จ', 'success')"><i class="fa-solid fa-check"></i></button>
                        <button class="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition flex items-center justify-center" title="ตีกลับ" onclick="Swal.fire('สำเร็จ', 'ตีกลับให้แก้ไขเรียบร้อยแล้ว', 'success')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>`;
            } else {
                return `
                <div class="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition opacity-60">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">${req.icon}</div>
                        <div>
                            <p class="font-bold text-slate-600 text-sm gap-2 flex items-center">${req.code} ${req.name} <span class="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-md">อนุมัติแล้ว</span></p>
                            <p class="text-[11px] text-slate-400 mt-0.5">${req.teacher} | อนุมัติเมื่อ: ${req.date}</p>
                        </div>
                    </div>
                </div>`;
            }
        }).join('');
    }

    // 3. Ensure the calendar is loaded on the dashboard
    loadAcademicCalendar();
}
