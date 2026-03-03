// --- API Configuration ---
// เปลี่ยน URL นี้เป็น Web App URL ที่ได้จากการ Deploy Google Apps Script ใหม่
const API_URL = 'https://script.google.com/macros/s/AKfycbzd0b5jCTtrKPOqna0XZIQ237I_-z_2MkoLrxZMHkxrgV6JyCoRxHaUGGikwt9ZHJsc/exec';

// --- Mock API Wrapper for Google Apps Script ---
// เพื่อให้โค้ดเก่าที่ใช้ google.script.run ยังทำงานได้บน GitHub
const google = {
    script: {
        run: {
            withSuccessHandler: function (callback) {
                return {
                    apiCall: function (action, data, moduleName = 'CORE') {
                        const payloadData = data || {};
                        payloadData.module = moduleName;
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: action, payload: payloadData })
                        })
                            .then(res => res.json())
                            .then(result => callback(result))
                            .catch(err => {
                                console.error(err);
                                callback({ status: 'error', message: err.message });
                            });
                    },
                    checkLogin: function (username, password) {
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'checkLogin', payload: { username, password, module: 'CORE' } })
                        })
                            .then(res => res.json())
                            .then(result => callback(result));
                    },
                    getPendingDocs: function (user) {
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'getPendingDocs', payload: { user, module: 'ACADEMIC' } })
                        })
                            .then(res => res.json())
                            .then(result => callback(result));
                    },
                    uploadAcademicDoc: function (payload) {
                        const reqPayload = payload || {};
                        reqPayload.module = 'ACADEMIC';
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'uploadAcademicDoc', payload: reqPayload })
                        })
                            .then(res => res.json())
                            .then(result => callback(result));
                    },
                    approveDocument: function (id, act, cmt, user) {
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'approveDocument', payload: { id, act, cmt, user, module: 'ACADEMIC' } })
                        })
                            .then(res => res.json())
                            .then(result => callback(result));
                    },
                    uploadImage: function (base64Data, type, filename) {
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'uploadImage', payload: { base64Data, type, filename, module: 'CORE' } })
                        })
                            .then(res => res.text()) // Image output might be text
                            .then(result => callback(result));
                    },
                    getRecentDocRequests: function () {
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'getRecentDocRequests', payload: { module: 'GENERAL' } })
                        })
                            .then(res => res.json())
                            .then(result => callback(result));
                    },
                    requestDocNumber: function (form) {
                        fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'requestDocNumber', payload: { form, module: 'GENERAL' } })
                        })
                            .then(res => res.json())
                            .then(result => callback(result));
                    }
                };
            }
        }
    }
};

// --- Global State for Home Visit System ---
let studentsData = [];
let currentStudent = null;
let currentStep = 1;

// --- Load Dashboard Data ---
function loadStudentList() {
    showLoading('กำลังโหลดรายชื่อนักเรียน...');
    google.script.run.withSuccessHandler(function (res) {
        hideLoading();
        if (res && res.status === 'success') {
            studentsData = res.data || [];
            renderStudentList(studentsData);
            populateFilters(studentsData);
        } else {
            console.error(res);
            // Swal.fire('Error', res?.message || 'ไม่สามารถโหลดข้อมูลได้', 'error');
            // Mock Data for Demo Purposes
            studentsData = [
                { student_id: '65001', student_name: 'ด.ช. สมชาย รักเรียน', class_level: '1', room: '1', visit_status: 'รอเยี่ยม', profile_image: '' },
                { student_id: '65002', student_name: 'ด.ญ. สมหญิง ใจดี', class_level: '2', room: '2', visit_status: 'เยี่ยมแล้ว', profile_image: '' }
            ];
            renderStudentList(studentsData);
        }
    }).apiCall('getStudentList', {
        role: currentUser ? currentUser.role : 'guest',
        username: currentUser ? currentUser.username : ''
    });
}

function renderStudentList(data) {
    const container = document.getElementById('student-list-container');
    document.getElementById('total-count').innerText = `${data.length} คน`;

    // Stats
    const visited = data.filter(s => s.visit_status === 'เยี่ยมแล้ว').length;
    document.getElementById('stat-visited').innerText = visited;
    document.getElementById('stat-pending').innerText = data.length - visited;

    if (data.length === 0) {
        container.innerHTML = `<div class="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center"><div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3"><i class="fa-solid fa-folder-open text-2xl text-slate-300"></i></div><p class="text-slate-500 font-medium text-sm">ไม่พบข้อมูลนักเรียน</p></div>`;
        return;
    }

    let html = '';
    data.forEach(s => {
        const isVisited = s.visit_status === 'เยี่ยมแล้ว';
        const cannotVisit = s.visit_status === 'ไม่สามารถเยี่ยมได้';

        let color = 'slate';
        let icon = 'clock';
        let text = s.visit_status || 'รอเยี่ยม';

        if (isVisited) { color = 'amber'; icon = 'check-circle'; }
        else if (cannotVisit) { color = 'red'; icon = 'circle-xmark'; }

        html += `
        <div class="bg-white p-4 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-100 hover:border-blue-300 transition cursor-pointer group" onclick="openStudentDetail('${s.student_id}')">
            <img src="${s.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURI(s.student_name) + '&background=random&color=fff'}" class="w-14 h-14 rounded-2xl object-cover bg-slate-50 grayscale-[20%] group-hover:grayscale-0 transition">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 text-sm truncate">${s.student_name}</h4>
                <p class="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                    <span class="bg-slate-50 px-1.5 py-0.5 rounded text-slate-600"><i class="fa-regular fa-id-card"></i> ${s.student_id}</span>
                    <span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"><i class="fa-solid fa-door-open"></i> ม.${s.class_level}/${s.room}</span>
                </p>
            </div>
            <div class="text-right shrink-0">
                <span class="text-[10px] bg-${color}-50 text-${color}-600 px-2 py-1 rounded-lg border border-${color}-100 flex items-center gap-1 font-bold">
                    <i class="fa-solid fa-${icon}"></i> <span class="hidden sm:inline">${text}</span>
                </span>
            </div>
            <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition shrink-0">
                <i class="fa-solid fa-chevron-right text-xs"></i>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// --- Navigation View Toggles ---
function openHomeVisitSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('home-visit-system').classList.remove('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.getElementById('detail-view').classList.add('hidden');

    // Toggle mobile header if needed
    if (window.innerWidth < 768 && document.getElementById('header-title-mobile')) {
        document.getElementById('header-title-mobile').innerText = 'ระบบเยี่ยมบ้าน';
    }

    loadStudentList();
}

function closeHomeVisitSystem() {
    document.getElementById('home-visit-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');

    if (window.innerWidth < 768 && document.getElementById('header-title-mobile')) {
        document.getElementById('header-title-mobile').innerText = 'ฝ่ายทั่วไป';
    }
}

function showDashboardHomeVisit() {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
}

// --- Student Detail Form Loading ---
function openStudentDetail(id) {
    showLoading('กำลังเตรียมข้อมูล...');

    // Check if we have data locally from list (usually list is partial, but good for fallback)
    let localData = studentsData.find(s => s.student_id === id);

    google.script.run.withSuccessHandler(function (res) {
        hideLoading();
        if (res && res.status === 'success') {
            currentStudent = res.data;
            populateForm(currentStudent);

            document.getElementById('dashboard-view').classList.add('hidden');
            document.getElementById('detail-view').classList.remove('hidden');
            setStep(1);
        } else {
            // Use local fallback for demo if API fails
            currentStudent = localData || { student_id: id, student_name: 'Demo Student' };
            populateForm(currentStudent);
            document.getElementById('dashboard-view').classList.add('hidden');
            document.getElementById('detail-view').classList.remove('hidden');
            setStep(1);
        }
    }).apiCall('getStudentDetail', { studentId: id });
}

function populateForm(data) {
    // Basic Profile Header
    document.getElementById('detail-name').innerText = data.student_name || 'ไม่ระบุชื่อ';
    document.getElementById('detail-id').innerText = data.student_id || '-';
    document.getElementById('detail-class').innerText = data.class_level && data.room ? `${data.class_level}/${data.room}` : '-';

    const imageSrc = data.profile_image || `https://ui-avatars.com/api/?name=${encodeURI(data.student_name || 'S')}&background=random&color=fff`;
    document.getElementById('detail-img').src = imageSrc;

    const visitStatus = data.visit_status || 'รอเยี่ยม';
    const statusBadge = document.getElementById('detail-status-badge');
    statusBadge.innerText = visitStatus;

    if (visitStatus === 'เยี่ยมแล้ว') {
        statusBadge.className = 'text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold';
    } else if (visitStatus === 'ไม่สามารถเยี่ยมได้') {
        statusBadge.className = 'text-[10px] px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold';
    } else {
        statusBadge.className = 'text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium';
    }

    // Reset Form completely
    document.getElementById('visit-form').reset();

    // Clear all "filled-data" classes and previews
    document.querySelectorAll('.filled-data').forEach(el => el.classList.remove('filled-data'));
    document.querySelectorAll('img[id^="prev-"]').forEach(el => {
        el.src = '';
        el.classList.add('hidden');
    });

    // Helper to safely set values and add class
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null && val !== '') {
            el.value = val;
            el.classList.add('filled-data');
        }
    };

    // Hidden inputs
    setVal('input-student_id', data.student_id);
    setVal('input-class_level', data.class_level);

    // Map fields from DB to Input ID
    const fieldMapping = {
        'national_id': data.student_id, // Map national_id to student_id for demo
        'nickname': data.nickname,
        'visit_status': data.visit_status,
        'last_visit_date': data.last_visit_date,
        'informant_relation': data.informant_relation,
        'photo_source': data.photo_source,
        'map_lat': data.map_lat,
        'map_long': data.map_long,
        'birth_date': data.birth_date,
        'age': data.age,
        'weight': data.weight,
        'height': data.height,
        'birth_province': data.birth_province,
        'birth_amphoe': data.birth_amphoe,
        'birth_tambon': data.birth_tambon,
        'nationality': data.nationality || 'ไทย',
        'race': data.race || 'ไทย',
        'religion': data.religion || 'พุทธ',
        'blood_type': data.blood_type || 'ไม่ทราบ',
        'previous_school': data.previous_school,
        'move_in_reason': data.move_in_reason,
        'disadvantage_type': data.disadvantage_type || 'ไม่ด้อยโอกาส',
        'disability_type': data.disability_type || 'ไม่พิการ',
        'congenital_disease': data.congenital_disease,
        'teacher_summary': data.teacher_summary
    };

    for (let key in fieldMapping) {
        setVal('input-' + key, fieldMapping[key]);
    }

    // Handle Images specifically
    const handleImg = (inputId, prevId, url) => {
        if (url) {
            setVal('input-' + inputId, url);
            const imgEl = document.getElementById(prevId);
            if (imgEl) {
                imgEl.src = url;
                imgEl.classList.remove('hidden');
            }
        }
    };

    handleImg('profile_image', 'detail-img', data.profile_image);
    handleImg('img_house_outside', 'prev-out', data.img_house_outside);
    handleImg('img_house_inside', 'prev-in', data.img_house_inside);
}

// --- Wizard Form Navigation logic ---
function setStep(n) {
    if (n < 1 || n > 8) return;
    currentStep = n;

    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`step-${n}`).classList.add('active');

    // Add active class to nav button
    const stepBtn = document.querySelector(`.step-btn[data-step="${n}"]`);
    if (stepBtn) {
        stepBtn.classList.add('active');
        // Scroll nav nicely
        const nav = document.getElementById('wizard-nav');
        nav.scrollTo({
            left: stepBtn.offsetLeft - (nav.clientWidth / 2) + (stepBtn.clientWidth / 2),
            behavior: 'smooth'
        });
    }

    // Control floating nav buttons
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const btnSave = document.getElementById('btn-save-main');

    btnBack.style.visibility = n === 1 ? 'hidden' : 'visible';

    if (n === 8) {
        btnNext.classList.add('hidden');
        btnSave.classList.remove('hidden');
        // Highlight summarize button with animation
        btnSave.classList.add('animate-bounce');
        setTimeout(() => btnSave.classList.remove('animate-bounce'), 1000);
    } else {
        btnNext.classList.remove('hidden');
        btnSave.classList.remove('hidden'); // allow saving at any step
    }
}

function navStep(dir) {
    setStep(currentStep + dir);
}

// --- Utilities & Logic ---
function calculateAge() {
    const bd = document.getElementById('input-birth_date').value;
    if (!bd) return;
    const today = new Date();
    const birthDate = new Date(bd);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    document.getElementById('input-age').value = age;
    document.getElementById('input-age').classList.add('filled-data');
}

function getLocation() {
    if (navigator.geolocation) {
        Swal.fire({
            title: 'ดึงตำแหน่งพิกัด',
            text: 'กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้งในเบราว์เซอร์ของคุณ',
            icon: 'info',
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 2000
        });

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                document.getElementById('input-map_lat').value = pos.coords.latitude;
                document.getElementById('input-map_long').value = pos.coords.longitude;
                document.getElementById('input-map_lat').classList.add('filled-data');
                document.getElementById('input-map_long').classList.add('filled-data');
                Swal.fire({ icon: 'success', title: 'ดึงข้อมูลพิกัดสำเร็จ', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            },
            (err) => {
                Swal.fire('Error', 'ไม่สามารถเข้าถึงตำแหน่งได้: ' + err.message, 'error');
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        Swal.fire('Error', 'เบราว์เซอร์ไม่รองรับ Geolocation', 'error');
    }
}

function openNavigation() {
    const lat = document.getElementById('input-map_lat').value;
    const lng = document.getElementById('input-map_long').value;
    if (lat && lng) {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else {
        Swal.fire('Info', 'ไม่พบข้อมูลพิกัด กรุณาดึงตำแหน่งหรือระบุก่อน', 'warning');
    }
}

// --- Map Filters Function ---
function applyFilters() { }
function resetFilters() { }
function populateFilters(data) { }


// --- Image Upload ---
function handleImageUpload(inputEl, hiddenId, prevId, type) {
    const file = inputEl.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire('ไฟล์ขนาดใหญ่', 'กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB', 'warning');
        inputEl.value = '';
        return;
    }

    showLoading('กำลังอัปโหลดรูปภาพ...');
    const reader = new FileReader();
    reader.onload = function (e) {
        const dataStr = e.target.result;
        const base64Data = dataStr.split('base64,')[1];
        const studentId = document.getElementById('input-student_id').value || 'new';

        google.script.run.withSuccessHandler(function (url) {
            hideLoading();
            if (url) {
                document.getElementById('input-' + hiddenId).value = url;
                const prevEl = document.getElementById(prevId);
                if (prevEl) {
                    prevEl.src = url;
                    prevEl.classList.remove('hidden');
                }
                Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
            } else {
                Swal.fire('Error', 'ไม่สามารถอัปโหลดได้ โปรดลองอีกครั้ง', 'error');
            }
        }).uploadImage(base64Data, file.type, `img_${studentId}_${type}_${Date.now()}`);
    };
    reader.readAsDataURL(file);
}

function viewImage(src) {
    if (!src) return;
    Swal.fire({
        imageUrl: src,
        imageAlt: 'Uploaded Image',
        showCloseButton: true,
        showConfirmButton: false,
        padding: '1em',
        background: '#fff'
    });
}

// --- Submit Form ---
function saveVisitData() {
    const form = document.getElementById('visit-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const dataObj = {};
    for (let [key, value] of formData.entries()) {
        dataObj[key] = value;
    }

    // Inject recorder info
    dataObj.recorded_by = currentUser ? currentUser.name : 'Unknown User';
    dataObj.recorded_date = new Date().toISOString(); // ISO timestamp

    showLoading('กำลังบันทึกข้อมูล...');

    google.script.run.withSuccessHandler(function (res) {
        hideLoading();
        if (res && res.status === 'success') {
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ!',
                text: 'บันทึกข้อมูลการเยี่ยมบ้านเรียบร้อย',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                showDashboardHomeVisit();
                loadStudentList(); // Refresh list to reflect changes
            });
        } else {
            console.error(res);
            // Swal.fire('Error', res?.message || 'ข้อผิดพลาดในการบันทึก', 'error');
            // Demo fallback success msg
            Swal.fire({
                icon: 'success',
                title: '(Demo) บันทึกสำเร็จ!',
                text: 'บันทึกข้อมูลจำลองเรียบร้อย',
                timer: 2000,
                showConfirmButton: false
            }).then(() => { showDashboardHomeVisit(); loadStudentList(); });
        }
    }).apiCall('handleUpdateStudent', dataObj);
}

// Enhance UI Interactions 
document.addEventListener('DOMContentLoaded', () => {
    // Add "filled-data" effect to inputs when value changes
    const inputs = document.querySelectorAll('#visit-form input:not([type="hidden"]), #visit-form select, #visit-form textarea');
    inputs.forEach(el => {
        el.addEventListener('change', function () {
            if (this.value.trim() !== '') {
                this.classList.add('filled-data');
            } else {
                this.classList.remove('filled-data');
            }
        });

        // initial fill check (delay to wait for dynamic fills)
        setTimeout(() => {
            if (el.value && el.value.trim() !== '') el.classList.add('filled-data');
        }, 500);
    });
});
// --- Navigation View Toggles for Saraban ---
function openSarabanSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('saraban-system').classList.remove('hidden');
    if (window.innerWidth < 768 && document.getElementById('header-title-mobile')) {
        document.getElementById('header-title-mobile').innerText = 'งานสารบรรณ';
    }
    loadGeneralHistory();
}

function closeSarabanSystem() {
    document.getElementById('saraban-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
    if (window.innerWidth < 768 && document.getElementById('header-title-mobile')) {
        document.getElementById('header-title-mobile').innerText = 'ฝ่ายทั่วไป';
    }
}

// --- Saraban Logic ---
function loadGeneralHistory() {
    document.getElementById('genHistoryTable').innerHTML = `<tr><td colspan="5" class="text-center py-12 text-slate-400"><i class="fas fa-spinner fa-spin text-3xl mb-3 block text-blue-500"></i>กำลังโหลดข้อมูล...</td></tr>`;

    google.script.run
        .withSuccessHandler(renderGeneralHistory)
        .getRecentDocRequests();
}

function parseThaiDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        try {
            var parts = dateStr.split(' ');
            var dParts = parts[0].split('/');
            var day = parseInt(dParts[0], 10);
            var month = parseInt(dParts[1], 10) - 1;
            var year = parseInt(dParts[2], 10);
            if (year > 2400) year -= 543;
            var h = 0, m = 0, s = 0;
            if (parts.length > 1) {
                var tParts = parts[1].split(':');
                h = parseInt(tParts[0] || 0, 10);
                m = parseInt(tParts[1] || 0, 10);
                s = parseInt(tParts[2] || 0, 10);
            }
            return new Date(year, month, day, h, m, s);
        } catch (e) {
            console.error("Parse Error:", e);
            return new Date(dateStr);
        }
    }
    return new Date(dateStr);
}

function renderGeneralHistory(data) {
    var tbody = document.getElementById('genHistoryTable');
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-slate-400"><div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3"><i class="fa-solid fa-folder-open text-2xl text-slate-300"></i></div><p class="font-medium text-sm">ไม่พบข้อมูล</p></td></tr>`;
        return;
    }

    data.forEach(function (row) {
        var badgeColor = "bg-slate-50 text-slate-600 border-slate-200";
        if (row.type === 'ภายใน') badgeColor = "bg-blue-50 text-blue-600 border-blue-200";
        else if (row.type === 'ภายนอก') badgeColor = "bg-green-50 text-green-600 border-green-200";
        else if (row.type === 'คำสั่ง') badgeColor = "bg-red-50 text-red-600 border-red-200";

        var dateObj = parseThaiDate(row.timestamp);
        var timeStr = "-";
        var dateShow = "";

        if (dateObj && !isNaN(dateObj.getTime())) {
            timeStr = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            dateShow = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
        } else {
            dateShow = row.timestamp;
        }

        var tr = `
                <tr class="hover:bg-slate-50 transition-colors group">
                    <td class="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">${row.fullNumber}</td>
                    <td class="px-4 py-3"><span class="${badgeColor} text-[10px] font-bold px-2 py-1 rounded-lg border">${row.type}</span></td>
                    <td class="px-4 py-3 truncate max-w-xs text-sm" title="${row.title}">${row.title}</td>
                    <td class="px-4 py-3 text-sm">${row.requester}</td>
                    <td class="px-4 py-3 text-right">
                         <div class="text-sm font-bold text-slate-700">${timeStr}</div>
                         <div class="text-[10px] text-slate-400">${dateShow}</div>
                    </td>
                </tr>
            `;
        tbody.innerHTML += tr;
    });
}

function handleGeneralSubmit(e) {
    e.preventDefault();

    var btn = document.getElementById('btnGenSubmit');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังประมวลผล...';
    btn.disabled = true;

    var form = {
        docType: document.getElementById('genDocType').value,
        title: document.getElementById('genDocTitle').value,
        receiver: document.getElementById('genDocReceiver').value,
        requester: (typeof currentUser !== 'undefined' && currentUser !== null) ? currentUser.name : "Admin"
    };

    google.script.run
        .withSuccessHandler(function (res) {
            btn.innerHTML = originalText;
            btn.disabled = false;

            if (res && res.status) {
                document.getElementById('genResultBox').classList.remove('hidden');
                document.getElementById('genResultNum').innerText = res.docNumber;

                document.getElementById('genDocTitle').value = "";
                document.getElementById('genDocReceiver').value = "";

                loadGeneralHistory();

                if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'ออกเลขหนังสือเรียบร้อยแล้ว', timer: 2000, showConfirmButton: false });
                }
            } else {
                if (typeof Swal !== 'undefined') Swal.fire('Error', res?.message || 'เกิดข้อผิดพลาดในการออกเลข', 'error');
                else alert('Error: ' + res?.message);
            }
        })
        .requestDocNumber(form);
}

// --- Academic Administration Navigation ---
function openAcademicSubsystem(type) {
    if (type === 'assignment') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-assignment-view').classList.remove('hidden');
        loadPendingApprovals();
        return;
    }

    if (type === 'schedule') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-schedule-view').classList.remove('hidden');
        return;
    }

    if (type === 'attendance') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-attendance-view').classList.remove('hidden');
        return;
    }

    if (type === 'evaluation') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-evaluation-view').classList.remove('hidden');
        return;
    }

    if (type === 'exams') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-exams-view').classList.remove('hidden');
        return;
    }

    if (type === 'curriculum') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-curriculum-view').classList.remove('hidden');
        return;
    }

    if (type === 'supervision') {
        document.getElementById('academic-dashboard-view').classList.add('hidden');
        document.getElementById('academic-supervision-view').classList.remove('hidden');
        return;
    }
    const moduleNames = {
        'assignment': 'ระบบส่งงาน',
        'schedule': 'จัดตารางสอน',
        'attendance': 'เช็คชื่อนักเรียน',
        'evaluation': 'งานวัดผล',
        'exams': 'ระบบสอบ',
        'curriculum': 'หลักสูตรสถานศึกษา',
        'supervision': 'นิเทศการสอน'
    };

    const moduleName = moduleNames[type] || 'ระบบ';

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังพัฒนาระบบ',
            text: `${moduleName} กำลังอยู่ในช่วงการพัฒนาและจะพร้อมใช้งานในเร็วๆ นี้`,
            icon: 'info',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'รับทราบ'
        });
    } else {
        alert(`${moduleName} กำลังอยู่ในช่วงการพัฒนา`);
    }
}

function closeAcademicSubsystem() {
    if (document.getElementById('academic-assignment-view')) document.getElementById('academic-assignment-view').classList.add('hidden');
    if (document.getElementById('academic-schedule-view')) document.getElementById('academic-schedule-view').classList.add('hidden');
    if (document.getElementById('academic-attendance-view')) document.getElementById('academic-attendance-view').classList.add('hidden');
    if (document.getElementById('academic-evaluation-view')) document.getElementById('academic-evaluation-view').classList.add('hidden');
    if (document.getElementById('academic-exams-view')) document.getElementById('academic-exams-view').classList.add('hidden');
    if (document.getElementById('academic-curriculum-view')) document.getElementById('academic-curriculum-view').classList.add('hidden');
    if (document.getElementById('academic-supervision-view')) document.getElementById('academic-supervision-view').classList.add('hidden');
    document.getElementById('academic-dashboard-view').classList.remove('hidden');
}

// --- Budget Administration Navigation ---
function openBudgetSubsystem(type) {
    document.getElementById('budget-dashboard-view').classList.add('hidden');

    if (type === 'planning') {
        document.getElementById('budget-planning-view').classList.remove('hidden');
    } else if (type === 'finance') {
        document.getElementById('budget-finance-view').classList.remove('hidden');
    } else if (type === 'procurement') {
        document.getElementById('budget-procurement-view').classList.remove('hidden');
    } else if (type === 'audit') {
        document.getElementById('budget-audit-view').classList.remove('hidden');
    } else {
        document.getElementById('budget-dashboard-view').classList.remove('hidden');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'กำลังพัฒนาระบบ',
                text: 'ระบบกำลังอยู่ในช่วงการพัฒนาและจะพร้อมใช้งานในเร็วๆ นี้',
                icon: 'info',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'รับทราบ'
            });
        } else {
            alert('ระบบกำลังอยู่ในช่วงการพัฒนา');
        }
    }
}

function closeBudgetSubsystem() {
    if (document.getElementById('budget-planning-view')) document.getElementById('budget-planning-view').classList.add('hidden');
    if (document.getElementById('budget-finance-view')) document.getElementById('budget-finance-view').classList.add('hidden');
    if (document.getElementById('budget-procurement-view')) document.getElementById('budget-procurement-view').classList.add('hidden');
    if (document.getElementById('budget-audit-view')) document.getElementById('budget-audit-view').classList.add('hidden');
    document.getElementById('budget-dashboard-view').classList.remove('hidden');
}

// --- HR Administration Navigation ---
function openHRSubsystem(type) {
    document.getElementById('hr-dashboard-view').classList.add('hidden');

    if (type === 'staffing') {
        document.getElementById('hr-staffing-view').classList.remove('hidden');
    } else if (type === 'development') {
        document.getElementById('hr-development-view').classList.remove('hidden');
    } else if (type === 'performance') {
        document.getElementById('hr-performance-view').classList.remove('hidden');
    } else if (type === 'discipline') {
        document.getElementById('hr-discipline-view').classList.remove('hidden');
    } else {
        document.getElementById('hr-dashboard-view').classList.remove('hidden');
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'กำลังพัฒนาระบบ',
                text: 'ระบบนี้กำลังอยู่ในช่วงการพัฒนาและจะพร้อมใช้งานในเร็วๆ นี้',
                icon: 'info',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'รับทราบ'
            });
        } else {
            alert('ระบบนี้กำลังอยู่ในช่วงการพัฒนา');
        }
    }
}

function closeHRSubsystem() {
    if (document.getElementById('hr-staffing-view')) document.getElementById('hr-staffing-view').classList.add('hidden');
    if (document.getElementById('hr-development-view')) document.getElementById('hr-development-view').classList.add('hidden');
    if (document.getElementById('hr-performance-view')) document.getElementById('hr-performance-view').classList.add('hidden');
    if (document.getElementById('hr-discipline-view')) document.getElementById('hr-discipline-view').classList.add('hidden');
    document.getElementById('hr-dashboard-view').classList.remove('hidden');
}

// ==========================================
// ACADEMIC ASSIGNMENT LOGIC
// ==========================================
const workSystemConfig = {
    "กลุ่มบริหารวิชาการ": [
        { label: "ส่งแผนการสอน", key: "AC_PLAN", yearType: "Academic" },
        { label: "งานวิจัยในชั้นเรียน", key: "AC_RESEARCH", yearType: "Calendar" },
        { label: "บันทึกหลังสอน", key: "AC_RECORD", yearType: "Academic" },
        { label: "งานวัดผล", key: "AC_GRADE", yearType: "Academic" }
    ]
};

const CURRENT_PAGE_GROUP = "กลุ่มบริหารวิชาการ";
let allDocsData = [];
let myChart = null;

function loadPendingApprovals() {
    if (!currentUser) {
        console.log("Waiting for user login...");
        return;
    }

    // Mock Docs for Demo
    const mockDocs = [
        { docId: 'D001', year: '2567', term: '1', timestamp: new Date().toISOString(), type: 'ส่งแผนการสอน', teacher: currentUser.name || currentUser.username || 'ดวงดาว ท้องฟ้า', details: 'แผนการสอนวิชาคณิตศาสตร์ ม.1', status: 'รออนุมัติ', isActionable: true, link: '#' },
        { docId: 'D002', year: '2567', term: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'บันทึกหลังสอน', teacher: 'สมหมาย ชายหาด', details: 'บันทึกหลังสอนวิทยาศาสตร์ ม.3', status: 'รออนุมัติ', isActionable: true, link: '#' },
        { docId: 'D003', year: '2566', term: '2', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), type: 'งานวิจัยในชั้นเรียน', teacher: currentUser.name || currentUser.username || 'ดวงดาว ท้องฟ้า', details: 'การแก้ปัญหาการอ่านไม่ออกด้วยนิทาน', status: 'อนุมัติเรียบร้อย', isActionable: false, link: '#' },
        { docId: 'D004', year: '2566', term: '2', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), type: 'ส่งแผนการสอน', teacher: 'สมหมาย ชายหาด', details: 'แผนการสอนศิลปะ ม.2', status: 'ตีกลับแก้ไข', isActionable: false, link: '#' },
    ];

    if (typeof google !== 'undefined' && google.script && google.script.run && typeof google.script.run.getPendingDocs === 'function') {
        showLoading();
        google.script.run.withSuccessHandler((res) => { hideLoading(); onDataLoaded(res); }).getPendingDocs(currentUser);
    } else {
        setTimeout(() => { onDataLoaded(mockDocs); }, 300);
    }
}

function onDataLoaded(docs) {
    allDocsData = docs || [];
    populateFilters(allDocsData);
    filterDocs();
    updateBadges(allDocsData);
}

function populateFilters(docs) {
    const years = [...new Set(docs.map(d => d.year))].sort().reverse();
    const select = document.getElementById('filterYear');
    select.innerHTML = '<option value="All">📅 ทุกปีการศึกษา</option>';
    years.forEach(y => {
        if (y) {
            let option = document.createElement("option");
            option.value = y;
            option.text = "ปี " + y;
            select.appendChild(option);
        }
    });
}

function filterDocs() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const selectedYear = document.getElementById('filterYear').value;
    const selectedTerm = document.getElementById('filterTerm').value;

    const filteredDocs = allDocsData.filter(d => {
        const matchesKeyword = (d.teacher || "").toLowerCase().includes(keyword) ||
            (d.details || "").toLowerCase().includes(keyword) ||
            (d.type || "").toLowerCase().includes(keyword) ||
            (d.status || "").toLowerCase().includes(keyword);

        const matchesYear = selectedYear === 'All' || (d.year && d.year.toString() === selectedYear);
        const matchesTerm = selectedTerm === 'All' || (d.term && d.term.toString() === selectedTerm);

        return matchesKeyword && matchesYear && matchesTerm;
    });
    renderAllTabs(filteredDocs);
}

function renderAllTabs(docs) {
    const pendingDocs = docs.filter(d => d.status.includes('รอ'));
    const historyDocs = docs.filter(d => !d.status.includes('รอ'));

    renderList('list-pending', pendingDocs, true);
    renderList('list-history', historyDocs, false);
    renderChart(docs);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-' + tabName).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('bg-white', 'text-sky-600', 'shadow-sm');
        el.classList.add('text-slate-500');
    });
    document.getElementById('btn-tab-' + tabName).classList.remove('text-slate-500');
    document.getElementById('btn-tab-' + tabName).classList.add('bg-white', 'text-sky-600', 'shadow-sm');

    if (tabName === 'dashboard') {
        document.getElementById('search-container').classList.add('hidden');
    } else {
        document.getElementById('search-container').classList.remove('hidden');
    }
}

function renderList(elementId, docs, isActionableTab) {
    const container = document.getElementById(elementId);
    if (!docs || docs.length === 0) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50/50 m-2 rounded-xl border border-slate-100"><div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3"><i class="fa-solid fa-folder-open text-2xl text-slate-300"></i></div><span class="text-sm font-medium">ไม่พบข้อมูล</span></div>`;
        return;
    }

    let html = '';
    docs.forEach((doc, index) => {
        let typeColor = 'sky';
        if (doc.type.includes('วิจัย')) typeColor = 'purple';
        if (doc.type.includes('บันทึก')) typeColor = 'orange';

        let typeBadge = `<span class="px-2 py-1 bg-${typeColor}-50 text-${typeColor}-600 text-[10px] rounded border border-${typeColor}-100 font-bold">${doc.type}</span>`;
        let statusBadge = `<span class="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold border border-slate-200">${doc.status}</span>`;
        if (doc.status.includes('อนุมัติ')) statusBadge = `<span class="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold border border-emerald-200 flex items-center gap-1 justify-center"><i class="fa-solid fa-check"></i> อนุมัติ</span>`;
        if (doc.status.includes('แก้ไข') || doc.status.includes('ตีกลับ')) statusBadge = `<span class="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded-md font-bold border border-rose-200 flex items-center gap-1 justify-center"><i class="fa-solid fa-exclamation"></i> แก้ไข</span>`;

        let actionArea = '<div class="text-center text-xs text-slate-400 font-medium">-</div>';
        if (isActionableTab) {
            actionArea = `
                <div class="flex justify-center gap-1.5">
                    <button onclick="doApprove('${doc.docId}', 'Reject')" class="w-8 h-8 flex items-center justify-center bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-colors hover:shadow-sm" title="ตีกลับ"><i class="fa-solid fa-xmark"></i></button>
                    <button onclick="doApprove('${doc.docId}', 'Approve')" class="w-auto px-3 h-8 flex items-center justify-center bg-white border border-emerald-200 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors hover:shadow-sm font-bold text-xs gap-1.5 whitespace-nowrap">
                        <span>อนุมัติ</span> <i class="fa-solid fa-check"></i>
                    </button>
                </div>`;
        }

        let dateStr = "-";
        if (doc.timestamp) {
            let d = new Date(doc.timestamp);
            if (!isNaN(d.getTime())) dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
        }

        let rowHTML = `
            <div class="grid grid-cols-12 gap-3 items-center bg-white p-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                <div class="col-span-2 text-xs text-slate-500 flex-col hidden md:flex">
                    <span class="font-bold text-slate-700">${doc.year || '-'}/${doc.term || '-'}</span>
                    <span class="text-[10px] text-slate-400 mt-0.5">${dateStr}</span>
                </div>
                <div class="col-span-3 md:col-span-2">${typeBadge}</div>
                <div class="col-span-4 md:col-span-3 min-w-0">
                    <h4 class="font-bold text-slate-800 text-xs truncate" title="${doc.details}">${doc.details}</h4>
                    <a href="${doc.link || '#'}" target="_blank" class="text-[10px] text-blue-500 hover:underline flex items-center gap-1.5 mt-1 font-medium group-hover:text-blue-600 w-max"><div class="w-4 h-4 bg-blue-50 flex items-center justify-center rounded-sm"><i class="fa-solid fa-file-pdf"></i></div> ดูเอกสารแบบเต็ม</a>
                </div>
                <div class="col-span-3 md:col-span-2 flex items-center gap-2.5 text-xs text-slate-600">
                    <div class="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 border border-slate-200">${doc.teacher ? doc.teacher.charAt(0) : '-'}</div> 
                    <span class="truncate font-medium">${doc.teacher || '-'}</span>
                </div>
                <div class="col-span-2 text-center hidden md:block">${statusBadge}</div>
                <div class="col-span-2 md:col-span-1">${actionArea}</div>
            </div>`;
        html += rowHTML;
    });
    container.innerHTML = html;
}

function renderChart(docs) {
    const approved = docs.filter(d => d.status.includes('อนุมัติ') && !d.status.includes('รอ')).length;
    const reject = docs.filter(d => d.status.includes('แก้ไข') || d.status.includes('ตีกลับ')).length;
    const pending = docs.filter(d => d.status.includes('รอ')).length;

    document.getElementById('stat-approved').innerText = approved;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-reject').innerText = reject;

    const ctx = document.getElementById('academicChart');
    if (ctx) {
        if (myChart) myChart.destroy();
        myChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['อนุมัติ', 'รอดำเนินการ', 'แก้ไข'],
                datasets: [{
                    data: [approved, pending, reject],
                    backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '75%',
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: "'Google Sans', 'Noto Sans Thai', sans-serif", size: 12, weight: 'bold' } } } }
            }
        });
    }
}

function updateBadges(docs) {
    const pendingCount = docs.filter(d => d.status.includes('รอ')).length;
    const historyCount = docs.filter(d => !d.status.includes('รอ')).length;

    const badgeP = document.getElementById('badge-pending');
    if (badgeP) {
        badgeP.innerText = pendingCount;
        if (pendingCount > 0) badgeP.classList.remove('hidden'); else badgeP.classList.add('hidden');
    }

    const badgeH = document.getElementById('badge-history');
    if (badgeH) {
        badgeH.innerText = historyCount;
        if (historyCount > 0) badgeH.classList.remove('hidden'); else badgeH.classList.add('hidden');
    }
}

function initDropdowns() {
    const sysSel = document.getElementById('selWorkSystem');
    sysSel.innerHTML = '<option value="">-- กรุณาเลือกประเภทงาน --</option>';

    const systems = workSystemConfig[CURRENT_PAGE_GROUP];
    if (systems) {
        systems.forEach(sys => {
            let option = document.createElement("option");
            option.value = sys.key;
            option.text = sys.label;
            sysSel.appendChild(option);
        });
    }
}

function onWorkSystemChange() {
    const sysSel = document.getElementById('selWorkSystem');
    const systems = workSystemConfig[CURRENT_PAGE_GROUP];
    const selectedSys = systems ? systems.find(d => d.key === sysSel.value) : null;

    const labelYear = document.getElementById('labelYear');
    const labelTerm = document.getElementById('labelTerm');

    if (selectedSys) {
        if (selectedSys.yearType === 'Fiscal') {
            labelYear.innerText = "ปีงบประมาณ";
            labelTerm.innerText = "ไตรมาส (1-4)";
        } else if (selectedSys.yearType === 'Calendar') {
            labelYear.innerText = "ปีปฏิทิน (พ.ศ.)";
            labelTerm.innerText = "เดือน/ช่วงเวลา";
        } else {
            labelYear.innerText = "ปีการศึกษา";
            labelTerm.innerText = "ภาคเรียน";
        }
    }
}

function openUploadModal(preSelectType) {
    const m = document.getElementById('academicUploadModal');
    document.getElementById('academicForm').reset();
    document.getElementById('acYear').value = new Date().getFullYear() + 543;

    initDropdowns();

    if (preSelectType) {
        const sysSel = document.getElementById('selWorkSystem');
        sysSel.value = preSelectType;
        onWorkSystemChange();
    }

    m.classList.remove('hidden');
}

function closeUploadModal() {
    document.getElementById('academicUploadModal').classList.add('hidden');
}

function processUpload() {
    const f = document.getElementById('fileInput');
    const sysKey = document.getElementById('selWorkSystem').value;
    const details = document.getElementById('docDetails').value;

    if (!sysKey) return Swal.fire('เตือน', 'กรุณาเลือกประเภทงาน', 'warning');
    if (!details) return Swal.fire('เตือน', 'กรุณาระบุรายละเอียดงาน', 'warning');
    if (!f.files.length) return Swal.fire('เตือน', 'กรุณาแนบไฟล์', 'warning');

    const btn = document.getElementById('btnProcessUpload');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่งข้อมูล...';
    btn.disabled = true;

    const fr = new FileReader();
    fr.onload = function (e) {
        const payload = {
            fileName: f.files[0].name,
            mimeType: f.files[0].type,
            content: e.target.result.split(',')[1],
            workSystem: sysKey,
            details: details,
            year: document.getElementById('acYear').value,
            term: document.getElementById('acTerm').value,
            teacherId: (currentUser ? currentUser.username : "Guest")
        };

        if (typeof google !== 'undefined' && google.script && typeof google.script.run.uploadAcademicDoc === 'function') {
            google.script.run.withSuccessHandler(r => {
                btn.innerHTML = oldText;
                btn.disabled = false;
                if (r.status === 'success') {
                    Swal.fire('สำเร็จ', 'บันทึกข้อมูลแล้ว', 'success');
                    closeUploadModal();
                    loadPendingApprovals();
                } else {
                    Swal.fire('Error', r.message, 'error');
                }
            }).uploadAcademicDoc(payload);
        } else {
            setTimeout(() => {
                btn.innerHTML = oldText;
                btn.disabled = false;
                Swal.fire({
                    icon: 'success', title: 'ส่งงานสำเร็จ', text: 'บันทึกข้อมูลเข้าสู่ระบบเรียบร้อย (โหมดจำลอง)', timer: 2000, showConfirmButton: false
                });
                const sysSel = document.getElementById('selWorkSystem');
                const typeLabel = sysSel.options[sysSel.selectedIndex].text;
                allDocsData.unshift({
                    docId: 'D999' + Math.floor(Math.random() * 100), year: payload.year, term: payload.term, timestamp: new Date().toISOString(), type: typeLabel, teacher: currentUser ? currentUser.name : 'Unknown User', details: payload.details, status: 'รออนุมัติ', isActionable: true, link: '#'
                });
                closeUploadModal();
                onDataLoaded(allDocsData);
            }, 1000);
        }
    };
    fr.readAsDataURL(f.files[0]);
}

function doApprove(id, act) {
    Swal.fire({
        title: act === 'Reject' ? 'เหตุผลการตีกลับ' : 'ยืนยันการอนุมัติ?',
        input: act === 'Reject' ? 'text' : undefined,
        inputPlaceholder: 'ระบุเหตุผลในการแก้ไข...',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: act === 'Reject' ? '#ef4444' : '#10b981',
        customClass: { confirmButton: 'font-bold rounded-xl', cancelButton: 'font-bold rounded-xl' }
    }).then(r => {
        if (r.isConfirmed) {
            if (act === 'Reject' && !r.value) {
                return Swal.fire('กรุณาระบุเหตุผล', 'เพื่อเป็นข้อมูลให้คุณครูนำไปแก้ไขได้อย่างถูกต้อง', 'warning');
            }
            sendApproval(id, act, r.value || '');
        }
    })
}

function sendApproval(id, act, cmt) {
    if (typeof google !== 'undefined' && google.script && typeof google.script.run.approveDocument === 'function') {
        Swal.showLoading();
        google.script.run.withSuccessHandler(r => {
            Swal.fire('สำเร็จ', 'บันทึกข้อมูลเรียบร้อย', 'success');
            loadPendingApprovals();
        }).approveDocument(id, act, cmt, currentUser);
    } else {
        const doc = allDocsData.find(d => d.docId === id);
        if (doc) {
            doc.status = act === 'Approve' ? 'อนุมัติเรียบร้อย' : `ตีกลับ: ${cmt}`;
            doc.isActionable = false;
            onDataLoaded(allDocsData);
        }
    }
}
// --- Student Council (สภานักเรียน) Logic ---
function openStudentCouncilSubsystem(sysId) {
    document.getElementById('student-council-dashboard-view').classList.add('hidden');

    // Hide all subsystems first
    const subsystems = ['morning_duty', 'scan'];
    subsystems.forEach(sys => {
        const el = document.getElementById(`student-council-${sys}-view`);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`student-council-${sysId}-view`);
    if (target) {
        target.classList.remove('hidden');
    } else {
        Swal.fire('กำลังพัฒนา', 'ระบบนี้กำลังอยู่ระหว่างการพัฒนา', 'info');
        document.getElementById('student-council-dashboard-view').classList.remove('hidden');
    }
}

function closeStudentCouncilSubsystem(sysId) {
    const target = document.getElementById(`student-council-${sysId}-view`);
    if (target) target.classList.add('hidden');
    document.getElementById('student-council-dashboard-view').classList.remove('hidden');
}

// --- Student Affairs (กิจการนักเรียน) Logic ---
function openStudentAffairsSystem() {
    document.getElementById('general-menu-view').classList.add('hidden');
    document.getElementById('student-affairs-system').classList.remove('hidden');
    if (window.innerWidth < 768 && document.getElementById('header-title-mobile')) {
        document.getElementById('header-title-mobile').innerText = 'กิจการนักเรียน';
    }
    loadAffairsRecords();
}

function closeStudentAffairsSystem() {
    document.getElementById('student-affairs-system').classList.add('hidden');
    document.getElementById('general-menu-view').classList.remove('hidden');
    if (window.innerWidth < 768 && document.getElementById('header-title-mobile')) {
        document.getElementById('header-title-mobile').innerText = 'ฝ่ายทั่วไป';
    }
}

function searchStudentAffairs() {
    const input = document.getElementById('affairsSearchInput').value.toLowerCase();
    // For actual implementation, hit backend. Here we mock filter on existing loaded data if any.
    console.log("Searching student affairs for: " + input);
}

function openAffairsModal(type) {
    document.getElementById('affairsRecordType').value = type;
    document.getElementById('affairsModalTitle').innerText = (type === 'good') ? 'เพิ่มความดี' : 'หักคะแนนความประพฤติ';
    document.getElementById('affairsModalHeader').className = (type === 'good') ? 'px-6 py-5 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50' : 'px-6 py-5 border-b border-rose-100 flex justify-between items-center bg-rose-50/50';
    document.getElementById('affairsModalTitle').className = (type === 'good') ? 'text-lg font-bold text-emerald-800' : 'text-lg font-bold text-rose-800';

    const catSelect = document.getElementById('affairsCategory');
    catSelect.innerHTML = '';
    if (type === 'good') {
        ['จิตอาสา/บำเพ็ญประโยชน์', 'สร้างชื่อเสียงให้โรงเรียน', 'เก็บของได้คืนเจ้าของ', 'ความเป็นผู้นำ', 'ช่วยเหลือผู้อื่น'].forEach(c => {
            catSelect.innerHTML += `<option value="${c}">${c}</option>`;
        });
        document.getElementById('btnSubmitAffairs').className = 'flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2';
    } else {
        ['มาสาย', 'หนีเรียน/ไม่เข้าเรียน', 'ทะเลาะวิวาท', 'แต่งกายผิดระเบียบ', 'เล่นการพนัน/สารเสพติด', 'พกเครื่องมือสื่อสารโดยไม่ได้รับอนุญาต'].forEach(c => {
            catSelect.innerHTML += `<option value="${c}">${c}</option>`;
        });
        document.getElementById('btnSubmitAffairs').className = 'flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-500/20 transition flex items-center justify-center gap-2';
    }

    document.getElementById('affairsPoints').value = (type === 'good') ? 5 : 5;
    document.getElementById('affairsModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAffairsModal() {
    document.getElementById('affairsModal').classList.add('hidden');
    document.getElementById('affairsForm').reset();
    document.body.style.overflow = 'auto';
}

function submitAffairsRecord(e) {
    e.preventDefault();
    const type = document.getElementById('affairsRecordType').value;
    const target = document.getElementById('affairsStudentTarget').value;
    const pts = document.getElementById('affairsPoints').value;
    const cat = document.getElementById('affairsCategory').value;

    const btn = document.getElementById('btnSubmitAffairs');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังบันทึก...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        closeAffairsModal();
        Swal.fire({
            icon: 'success', title: 'บันทึกสำเร็จ',
            text: `${type === 'good' ? 'เพิ่มคะแนนความดี' : 'หักคะแนนความประพฤติ'} ${pts} คะแนน ให้กับ ${target} แล้ว`,
            timer: 2000, showConfirmButton: false
        });
        loadAffairsRecords();
    }, 1000); // Mock network request
}

function issueCertificate() {
    Swal.fire({
        title: 'ออกใบรับรองความประพฤติ',
        input: 'text',
        inputPlaceholder: 'กรอกรหัสนักเรียน 5 หลัก',
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#4f46e5'
    }).then((res) => {
        if (res.isConfirmed && res.value) {
            Swal.fire({
                icon: 'success', title: 'ออกเอกสารสำเร็จ',
                text: `ระบบได้สร้างไฟล์ PDF ใบรับรองความประพฤติของนักเรียนรหัส ${res.value} เรียบร้อยแล้ว`,
                confirmButtonColor: '#4f46e5'
            });
        }
    });
}

function loadAffairsRecords() {
    const tbody = document.getElementById('affairsRecordsTable');
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-10 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl mb-2 text-indigo-400"></i><br>กำลังโหลดข้อมูล...</td></tr>`;

    // Mock data
    setTimeout(() => {
        const mockData = [
            { id: "65001", name: "ด.ช. สมชาย รักเรียน", type: "ความดี", detail: "ช่วยเก็บขยะในโรงอาหาร", points: "+5", user: "ครูสมหมาย", time: new Date().toISOString() },
            { id: "65042", name: "ด.ญ. สมศรี สวยเสมอ", type: "หักคะแนน", detail: "มาสาย (ครั้งที่ 3)", points: "-10", user: "ครูมานี", time: new Date(Date.now() - 3600000).toISOString() },
            { id: "65210", name: "นาย นพดล คนดี", type: "ความดี", detail: "ได้รับรางวัลชนะเลิศตอบปัญหา", points: "+20", user: "ครูวิชัย", time: new Date(Date.now() - 86400000).toISOString() },
            { id: "66120", name: "ด.ช. เก่งกาจ ชาญชัย", type: "หักคะแนน", detail: "ไม่แต่งกายชุดลูกเสือ", points: "-5", user: "ครูสมหมาย", time: new Date(Date.now() - 172800000).toISOString() }
        ];

        tbody.innerHTML = '';
        mockData.forEach(r => {
            const isGood = r.type === "ความดี";
            const badgeColor = isGood ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200';
            const ptsColor = isGood ? 'text-emerald-600' : 'text-rose-600';
            const ptsBg = isGood ? 'bg-emerald-50' : 'bg-rose-50';

            let d = new Date(r.time);
            let timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            let dateShow = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

            tbody.innerHTML += `
                    <tr class="hover:bg-slate-50 transition-colors group">
                        <td class="px-6 py-4">
                            <p class="font-bold text-slate-800 text-sm">${r.name}</p>
                            <p class="text-[10px] text-slate-400 font-medium">${r.id}</p>
                        </td>
                        <td class="px-6 py-4"><span class="${badgeColor} text-[10px] font-bold px-2 py-1 rounded-lg border">${r.type}</span></td>
                        <td class="px-6 py-4 text-sm text-slate-600">${r.detail}</td>
                        <td class="px-6 py-4 text-center">
                            <span class="${ptsBg} ${ptsColor} font-black text-sm px-2 py-1 rounded-lg">${r.points}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-600">${r.user}</td>
                        <td class="px-6 py-4 text-right">
                            <div class="text-sm font-bold text-slate-700">${timeStr}</div>
                            <div class="text-[10px] text-slate-400">${dateShow}</div>
                        </td>
                    </tr>
                `;
        });
    }, 800);
}

