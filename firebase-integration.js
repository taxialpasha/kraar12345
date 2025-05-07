/**
 * firebase-integration.js
 * مكتبة تكامل نظام إدارة الاستثمار مع Firebase
 * 
 * هذا الملف يوفر وظائف التكامل مع Firebase لـ:
 * - تخزين ومزامنة البيانات
 * - النسخ الاحتياطي
 * - تسجيل الأنشطة
 * - استعادة البيانات المحذوفة
 */

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// الوصول إلى خدمات Firebase
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

// حالة المزامنة
let syncEnabled = false;
let lastSyncTime = null;
let currentUser = null;
let syncInterval = null;

// تهيئة وضع المزامنة
function initializeFirebaseSync() {
    // التحقق من حالة المزامنة المحفوظة مسبقًا
    syncEnabled = localStorage.getItem('syncEnabled') === 'true';
    lastSyncTime = localStorage.getItem('lastSyncTime');
    
    // تحديث أيقونة المزامنة
    updateSyncIcon();
    
    // إذا كانت المزامنة مفعلة، ابدأ بالمزامنة التلقائية
    if (syncEnabled) {
        startAutoSync();
    }
    
    // إضافة مستمع للتغييرات في البيانات المحلية
    window.addEventListener('storage-changed', handleLocalDataChange);
}

// تسجيل الدخول
async function signIn(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // تحديث واجهة المستخدم
        document.getElementById('syncStatus').textContent = 'متصل: ' + email;
        
        // مزامنة البيانات من Firebase
        await pullDataFromFirebase();
        
        // تفعيل المزامنة التلقائية
        enableSync();
        
        return true;
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        return false;
    }
}

// إنشاء حساب جديد
async function createAccount(email, password, companyName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // إنشاء ملف تعريف للمستخدم
        await db.ref('users/' + currentUser.uid).set({
            email: email,
            companyName: companyName,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        // تحديث واجهة المستخدم
        document.getElementById('syncStatus').textContent = 'متصل: ' + email;
        
        // دفع البيانات الحالية إلى Firebase
        await pushDataToFirebase();
        
        // تفعيل المزامنة التلقائية
        enableSync();
        
        return true;
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        return false;
    }
}

// تسجيل الخروج
async function signOut() {
    try {
        // إيقاف المزامنة التلقائية
        disableSync();
        
        await auth.signOut();
        currentUser = null;
        
        // تحديث واجهة المستخدم
        document.getElementById('syncStatus').textContent = 'غير متصل';
        
        return true;
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        return false;
    }
}

// تفعيل المزامنة
function enableSync() {
    syncEnabled = true;
    localStorage.setItem('syncEnabled', 'true');
    updateSyncIcon();
    startAutoSync();
    
    // تسجيل حدث بدء المزامنة
    logActivity('system', 'بدء المزامنة مع Firebase');
}

// تعطيل المزامنة
function disableSync() {
    syncEnabled = false;
    localStorage.setItem('syncEnabled', 'false');
    updateSyncIcon();
    stopAutoSync();
    
    // تسجيل حدث إيقاف المزامنة
    logActivity('system', 'إيقاف المزامنة مع Firebase');
}

// بدء المزامنة التلقائية
function startAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    // مزامنة البيانات كل 5 دقائق
    syncInterval = setInterval(async () => {
        if (syncEnabled && currentUser) {
            await syncData();
        }
    }, 5 * 60 * 1000);
    
    // مزامنة فورية
    syncData();
}

// إيقاف المزامنة التلقائية
function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

// تحديث أيقونة المزامنة
function updateSyncIcon() {
    const syncIcon = document.getElementById('syncIcon');
    
    if (!syncIcon) return;
    
    if (syncEnabled) {
        syncIcon.innerHTML = '<i class="fas fa-sync"></i>';
        syncIcon.classList.add('active');
    } else {
        syncIcon.innerHTML = '<i class="fas fa-cloud"></i>';
        syncIcon.classList.remove('active');
    }
    
    // إضافة النص الخاص بآخر مزامنة
    let syncStatusText = '';
    
    if (lastSyncTime) {
        const lastSync = new Date(parseInt(lastSyncTime));
        syncStatusText = 'آخر مزامنة: ' + lastSync.toLocaleString('ar-IQ');
    }
    
    document.getElementById('lastSyncTime').textContent = syncStatusText;
}

// معالجة تغييرات البيانات المحلية
function handleLocalDataChange(event) {
    if (!syncEnabled || !currentUser) return;
    
    // جدولة مزامنة بعد 2 ثانية من آخر تغيير
    clearTimeout(window.syncTimeout);
    window.syncTimeout = setTimeout(() => {
        pushDataToFirebase();
    }, 2000);
}

// مزامنة البيانات
async function syncData() {
    if (!currentUser) return;
    
    try {
        // التحقق من آخر مزامنة على Firebase
        const lastServerSync = await db.ref('users/' + currentUser.uid + '/lastSync').once('value');
        const serverSyncTime = lastServerSync.val();
        
        if (serverSyncTime && (!lastSyncTime || serverSyncTime > parseInt(lastSyncTime))) {
            // البيانات على السيرفر أحدث، قم بالسحب
            await pullDataFromFirebase();
        } else {
            // البيانات المحلية أحدث، قم بالدفع
            await pushDataToFirebase();
        }
        
        // تحديث وقت آخر مزامنة
        lastSyncTime = Date.now().toString();
        localStorage.setItem('lastSyncTime', lastSyncTime);
        
        // تحديث أيقونة المزامنة
        updateSyncIcon();
        
        return true;
    } catch (error) {
        console.error('خطأ في مزامنة البيانات:', error);
        return false;
    }
}

// دفع البيانات إلى Firebase
async function pushDataToFirebase() {
    if (!currentUser) return;
    
    try {
        // الحصول على البيانات المحلية
        const investors = JSON.parse(localStorage.getItem('investors')) || [];
        const investments = JSON.parse(localStorage.getItem('investments')) || [];
        const operations = JSON.parse(localStorage.getItem('operations')) || [];
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        
        // حفظ البيانات في Firebase
        await db.ref('users/' + currentUser.uid + '/data').set({
            investors,
            investments,
            operations,
            settings
        });
        
        // تحديث وقت آخر مزامنة
        await db.ref('users/' + currentUser.uid + '/lastSync').set(firebase.database.ServerValue.TIMESTAMP);
        
        // تحديث وقت المزامنة المحلي
        lastSyncTime = Date.now().toString();
        localStorage.setItem('lastSyncTime', lastSyncTime);
        
        // تحديث أيقونة المزامنة
        updateSyncIcon();
        
        // تسجيل نشاط المزامنة
        logActivity('system', 'تم دفع البيانات إلى Firebase');
        
        return true;
    } catch (error) {
        console.error('خطأ في دفع البيانات إلى Firebase:', error);
        return false;
    }
}

// سحب البيانات من Firebase
async function pullDataFromFirebase() {
    if (!currentUser) return;
    
    try {
        // جلب البيانات من Firebase
        const dataSnapshot = await db.ref('users/' + currentUser.uid + '/data').once('value');
        const firebaseData = dataSnapshot.val();
        
        if (firebaseData) {
            // حفظ البيانات محليًا
            if (firebaseData.investors) localStorage.setItem('investors', JSON.stringify(firebaseData.investors));
            if (firebaseData.investments) localStorage.setItem('investments', JSON.stringify(firebaseData.investments));
            if (firebaseData.operations) localStorage.setItem('operations', JSON.stringify(firebaseData.operations));
            if (firebaseData.settings) localStorage.setItem('settings', JSON.stringify(firebaseData.settings));
            
            // تحديث وقت آخر مزامنة
            lastSyncTime = Date.now().toString();
            localStorage.setItem('lastSyncTime', lastSyncTime);
            
            // إشعار التطبيق بتحديث البيانات
            window.dispatchEvent(new CustomEvent('data-updated'));
            
            // تحديث واجهة المستخدم
            updateSyncIcon();
            
            // إعادة تحميل الصفحة الحالية
            const currentPage = document.querySelector('.page.active').id;
            window.showPage(currentPage);
        }
        
        // تسجيل نشاط المزامنة
        logActivity('system', 'تم سحب البيانات من Firebase');
        
        return true;
    } catch (error) {
        console.error('خطأ في سحب البيانات من Firebase:', error);
        return false;
    }
}

// إنشاء نسخة احتياطية في Firebase
async function createFirebaseBackup(name = '') {
    if (!currentUser) return false;
    
    try {
        // الحصول على البيانات المحلية
        const investors = JSON.parse(localStorage.getItem('investors')) || [];
        const investments = JSON.parse(localStorage.getItem('investments')) || [];
        const operations = JSON.parse(localStorage.getItem('operations')) || [];
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        
        // اسم النسخة الاحتياطية
        const backupDate = new Date();
        const backupName = name || `backup_${backupDate.toISOString().slice(0, 10)}`;
        
        // حفظ النسخة الاحتياطية في Firebase
        await db.ref('users/' + currentUser.uid + '/backups/' + backupName).set({
            investors,
            investments,
            operations,
            settings,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            backupName: backupName
        });
        
        // تسجيل نشاط النسخ الاحتياطي
        logActivity('system', 'تم إنشاء نسخة احتياطية: ' + backupName);
        
        return true;
    } catch (error) {
        console.error('خطأ في إنشاء نسخة احتياطية:', error);
        return false;
    }
}

// الحصول على قائمة النسخ الاحتياطية
async function getBackupsList() {
    if (!currentUser) return [];
    
    try {
        const backupsSnapshot = await db.ref('users/' + currentUser.uid + '/backups').once('value');
        const backups = backupsSnapshot.val() || {};
        
        // تحويل البيانات إلى مصفوفة
        return Object.keys(backups).map(key => ({
            id: key,
            name: backups[key].backupName || key,
            createdAt: backups[key].createdAt,
            date: new Date(backups[key].createdAt).toLocaleString('ar-IQ')
        })).sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('خطأ في جلب قائمة النسخ الاحتياطية:', error);
        return [];
    }
}

// استعادة نسخة احتياطية من Firebase
async function restoreBackup(backupId) {
    if (!currentUser) return false;
    
    try {
        // جلب النسخة الاحتياطية من Firebase
        const backupSnapshot = await db.ref('users/' + currentUser.uid + '/backups/' + backupId).once('value');
        const backup = backupSnapshot.val();
        
        if (backup) {
            // حفظ البيانات محليًا
            if (backup.investors) localStorage.setItem('investors', JSON.stringify(backup.investors));
            if (backup.investments) localStorage.setItem('investments', JSON.stringify(backup.investments));
            if (backup.operations) localStorage.setItem('operations', JSON.stringify(backup.operations));
            if (backup.settings) localStorage.setItem('settings', JSON.stringify(backup.settings));
            
            // إشعار التطبيق بتحديث البيانات
            window.dispatchEvent(new CustomEvent('data-updated'));
            
            // إعادة تحميل الصفحة الحالية
            const currentPage = document.querySelector('.page.active').id;
            window.showPage(currentPage);
            
            // تسجيل نشاط استعادة النسخة الاحتياطية
            logActivity('system', 'تم استعادة نسخة احتياطية: ' + (backup.backupName || backupId));
            
            // مزامنة البيانات مع Firebase
            await pushDataToFirebase();
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('خطأ في استعادة النسخة الاحتياطية:', error);
        return false;
    }
}

// حذف نسخة احتياطية من Firebase
async function deleteBackup(backupId) {
    if (!currentUser) return false;
    
    try {
        // حذف النسخة الاحتياطية من Firebase
        await db.ref('users/' + currentUser.uid + '/backups/' + backupId).remove();
        
        // تسجيل نشاط حذف النسخة الاحتياطية
        logActivity('system', 'تم حذف نسخة احتياطية: ' + backupId);
        
        return true;
    } catch (error) {
        console.error('خطأ في حذف النسخة الاحتياطية:', error);
        return false;
    }
}

// أرشفة مستثمر قبل الحذف
async function archiveInvestor(investorId) {
    if (!currentUser) return false;
    
    try {
        // البحث عن المستثمر
        const investors = JSON.parse(localStorage.getItem('investors')) || [];
        const investorIndex = investors.findIndex(investor => investor.id === investorId);
        
        if (investorIndex === -1) return false;
        
        const investor = investors[investorIndex];
        
        // البحث عن استثمارات المستثمر
        const investments = JSON.parse(localStorage.getItem('investments')) || [];
        const investorInvestments = investments.filter(investment => investment.investorId === investorId);
        
        // البحث عن عمليات المستثمر
        const operations = JSON.parse(localStorage.getItem('operations')) || [];
        const investorOperations = operations.filter(operation => operation.investorId === investorId);
        
        // حفظ بيانات المستثمر في أرشيف Firebase
        await db.ref('users/' + currentUser.uid + '/archives/investors/' + investorId).set({
            investor,
            investments: investorInvestments,
            operations: investorOperations,
            archivedAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        // تسجيل نشاط أرشفة المستثمر
        logActivity('investor', 'تم أرشفة المستثمر: ' + investor.name, investorId);
        
        return true;
    } catch (error) {
        console.error('خطأ في أرشفة المستثمر:', error);
        return false;
    }
}

// استعادة مستثمر من الأرشيف
async function restoreInvestor(investorId) {
    if (!currentUser) return false;
    
    try {
        // جلب بيانات المستثمر من الأرشيف
        const archiveSnapshot = await db.ref('users/' + currentUser.uid + '/archives/investors/' + investorId).once('value');
        const archive = archiveSnapshot.val();
        
        if (!archive) return false;
        
        // استعادة بيانات المستثمر
        const investors = JSON.parse(localStorage.getItem('investors')) || [];
        const investments = JSON.parse(localStorage.getItem('investments')) || [];
        const operations = JSON.parse(localStorage.getItem('operations')) || [];
        
        // التحقق من عدم وجود المستثمر حاليًا
        if (!investors.some(investor => investor.id === investorId)) {
            investors.push(archive.investor);
        }
        
        // إضافة استثمارات المستثمر غير الموجودة
        if (archive.investments) {
            archive.investments.forEach(investment => {
                if (!investments.some(inv => inv.id === investment.id)) {
                    investments.push(investment);
                }
            });
        }
        
        // إضافة عمليات المستثمر غير الموجودة
        if (archive.operations) {
            archive.operations.forEach(operation => {
                if (!operations.some(op => op.id === operation.id)) {
                    operations.push(operation);
                }
            });
        }
        
        // حفظ البيانات المحدثة
        localStorage.setItem('investors', JSON.stringify(investors));
        localStorage.setItem('investments', JSON.stringify(investments));
        localStorage.setItem('operations', JSON.stringify(operations));
        
        // إشعار التطبيق بتحديث البيانات
        window.dispatchEvent(new CustomEvent('data-updated'));
        
        // تسجيل نشاط استعادة المستثمر
        logActivity('investor', 'تم استعادة المستثمر: ' + archive.investor.name, investorId);
        
        // مزامنة البيانات مع Firebase
        await pushDataToFirebase();
        
        return true;
    } catch (error) {
        console.error('خطأ في استعادة المستثمر:', error);
        return false;
    }
}

// الحصول على قائمة المستثمرين المؤرشفين
async function getArchivedInvestors() {
    if (!currentUser) return [];
    
    try {
        const archivesSnapshot = await db.ref('users/' + currentUser.uid + '/archives/investors').once('value');
        const archives = archivesSnapshot.val() || {};
        
        // تحويل البيانات إلى مصفوفة
        return Object.keys(archives).map(key => ({
            id: key,
            investor: archives[key].investor,
            archivedAt: archives[key].archivedAt,
            date: new Date(archives[key].archivedAt).toLocaleString('ar-IQ')
        })).sort((a, b) => b.archivedAt - a.archivedAt);
    } catch (error) {
        console.error('خطأ في جلب قائمة المستثمرين المؤرشفين:', error);
        return [];
    }
}

// تسجيل نشاط في Firebase
async function logActivity(type, description, relatedId = null) {
    if (!currentUser) return;
    
    try {
        // إنشاء سجل النشاط
        const activityLog = {
            type,
            description,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            userId: currentUser.uid,
            userEmail: currentUser.email,
            relatedId
        };
        
        // حفظ النشاط في Firebase
        await db.ref('users/' + currentUser.uid + '/activities').push(activityLog);
        
        // إذا كانت المزامنة مفعلة، قم بحفظ الأنشطة محليًا أيضًا
        if (syncEnabled) {
            const activities = JSON.parse(localStorage.getItem('activities')) || [];
            activities.push({
                ...activityLog,
                timestamp: Date.now(),
                id: generateId()
            });
            
            // الاحتفاظ بآخر 100 نشاط فقط
            if (activities.length > 100) {
                activities.splice(0, activities.length - 100);
            }
            
            localStorage.setItem('activities', JSON.stringify(activities));
        }
    } catch (error) {
        console.error('خطأ في تسجيل النشاط:', error);
    }
}

// الحصول على سجل الأنشطة
async function getActivities(limit = 50) {
    if (!currentUser) return [];
    
    try {
        const activitiesSnapshot = await db.ref('users/' + currentUser.uid + '/activities')
            .orderByChild('timestamp')
            .limitToLast(limit)
            .once('value');
            
        const activities = activitiesSnapshot.val() || {};
        
        // تحويل البيانات إلى مصفوفة
        return Object.keys(activities).map(key => ({
            id: key,
            ...activities[key],
            date: new Date(activities[key].timestamp).toLocaleString('ar-IQ')
        })).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error('خطأ في جلب سجل الأنشطة:', error);
        return [];
    }
}

// إنشاء معرف فريد
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// إظهار مربع حوار تسجيل الدخول
function showLoginDialog() {
    // إنشاء مربع حوار تسجيل الدخول
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'loginModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">تسجيل الدخول إلى Firebase</h2>
                <div class="modal-close" onclick="document.getElementById('loginModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="tabs">
                    <div class="tab active" onclick="switchLoginTab('login')">تسجيل الدخول</div>
                    <div class="tab" onclick="switchLoginTab('register')">إنشاء حساب</div>
                </div>
                
                <div id="loginTab" class="login-tab active">
                    <form id="loginForm">
                        <div class="form-group">
                            <label class="form-label">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="loginEmail" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">كلمة المرور</label>
                            <input type="password" class="form-control" id="loginPassword" required>
                        </div>
                    </form>
                </div>
                
                <div id="registerTab" class="login-tab">
                    <form id="registerForm">
                        <div class="form-group">
                            <label class="form-label">البريد الإلكتروني</label>
                            <input type="email" class="form-control" id="registerEmail" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">كلمة المرور</label>
                            <input type="password" class="form-control" id="registerPassword" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">اسم الشركة</label>
                            <input type="text" class="form-control" id="companyName" required>
                        </div>
                    </form>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('loginModal').remove()">إلغاء</button>
                <button id="loginButton" class="btn btn-primary" onclick="handleLogin()">تسجيل الدخول</button>
                <button id="registerButton" class="btn btn-primary" style="display: none;" onclick="handleRegister()">إنشاء حساب</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// تبديل تبويبات تسجيل الدخول
function switchLoginTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    
    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginButton.style.display = 'block';
        registerButton.style.display = 'none';
        
        // تحديث التبويب النشط
        document.querySelector('.tabs .tab:nth-child(1)').classList.add('active');
        document.querySelector('.tabs .tab:nth-child(2)').classList.remove('active');
    } else {
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginButton.style.display = 'none';
        registerButton.style.display = 'block';
        
        // تحديث التبويب النشط
        document.querySelector('.tabs .tab:nth-child(1)').classList.remove('active');
        document.querySelector('.tabs .tab:nth-child(2)').classList.add('active');
    }
}

// معالجة تسجيل الدخول
async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        createNotification('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور', 'danger');
        return;
    }
    
    try {
        const success = await signIn(email, password);
        
        if (success) {
            // إغلاق مربع الحوار
            document.getElementById('loginModal').remove();
            
            // عرض رسالة نجاح
            createNotification('نجاح', 'تم تسجيل الدخول بنجاح', 'success');
        } else {
            createNotification('خطأ', 'فشل تسجيل الدخول. يرجى التحقق من معلومات الحساب', 'danger');
        }
    } catch (error) {
        createNotification('خطأ', 'حدث خطأ أثناء تسجيل الدخول: ' + error.message, 'danger');
    }
}

// معالجة إنشاء حساب
async function handleRegister() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const companyName = document.getElementById('companyName').value;
    
    if (!email || !password || !companyName) {
        createNotification('خطأ', 'يرجى إدخال جميع المعلومات المطلوبة', 'danger');
        return;
    }
    
    if (password.length < 6) {
        createNotification('خطأ', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'danger');
        return;
    }
    
    try {
        const success = await createAccount(email, password, companyName);
        
        if (success) {
            // إغلاق مربع الحوار
            document.getElementById('loginModal').remove();
            
            // عرض رسالة نجاح
            createNotification('نجاح', 'تم إنشاء الحساب بنجاح', 'success');
        } else {
            createNotification('خطأ', 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى', 'danger');
        }
    } catch (error) {
        createNotification('خطأ', 'حدث خطأ أثناء إنشاء الحساب: ' + error.message, 'danger');
    }
}

// إظهار مربع حوار إعدادات المزامنة
function showSyncSettings() {
    // إنشاء مربع حوار إعدادات المزامنة
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'syncSettingsModal';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2 class="modal-title">إعدادات المزامنة</h2>
                <div class="modal-close" onclick="document.getElementById('syncSettingsModal').remove()">
                    <i class="fas fa-times"></i>
                </div>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input" id="enableSyncCheckbox" ${syncEnabled ? 'checked' : ''}>
                        <label class="form-check-label" for="enableSyncCheckbox">تفعيل المزامنة مع Firebase</label>
                    </div>
                    <p class="form-text">سيتم مزامنة البيانات تلقائيًا كل 5 دقائق وعند إجراء تغييرات.</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">حالة الاتصال</label>
                    <div id="connectionStatus" class="alert ${currentUser ? 'alert-success' : 'alert-warning'}">
                        <div class="alert-icon">
                            <i class="fas fa-${currentUser ? 'check' : 'exclamation'}-circle"></i>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">${currentUser ? 'متصل' : 'غير متصل'}</div>
                            <div class="alert-text">${currentUser ? 'البريد الإلكتروني: ' + currentUser.email : 'يرجى تسجيل الدخول لتفعيل المزامنة'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">آخر مزامنة</label>
                    <input type="text" class="form-control" value="${lastSyncTime ? new Date(parseInt(lastSyncTime)).toLocaleString('ar-IQ') : 'لم يتم المزامنة بعد'}" readonly>
                </div>
                
                <div class="table-container" style="box-shadow: none; padding: 0;">
                    <div class="table-header">
                        <div class="table-title">النسخ الاحتياطية</div>
                        <button class="btn btn-sm btn-primary" onclick="createBackupNow()">
                            <i class="fas fa-plus"></i> إنشاء نسخة احتياطية
                        </button>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>اسم النسخة</th>
                                <th>التاريخ</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="backupsList">
                            <tr>
                                <td colspan="3" style="text-align: center;">جاري تحميل النسخ الاحتياطية...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="table-container" style="box-shadow: none; padding: 0; margin-top: 20px;">
                    <div class="table-header">
                        <div class="table-title">المستثمرين المؤرشفين</div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>المستثمر</th>
                                <th>تاريخ الأرشفة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="archivedInvestorsList">
                            <tr>
                                <td colspan="3" style="text-align: center;">جاري تحميل المستثمرين المؤرشفين...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-light" onclick="document.getElementById('syncSettingsModal').remove()">إغلاق</button>
                ${currentUser ? 
                    `<button class="btn btn-danger" onclick="handleSignOut()">
                        <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                    </button>` : 
                    `<button class="btn btn-primary" onclick="showLoginDialog()">
                        <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                    </button>`
                }
                <button class="btn btn-primary" onclick="saveSyncSettings()">حفظ الإعدادات</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // تحميل قائمة النسخ الاحتياطية والمستثمرين المؤرشفين
    loadBackupsAndArchives();
}

// تحميل قائمة النسخ الاحتياطية والمستثمرين المؤرشفين
async function loadBackupsAndArchives() {
    if (!currentUser) return;
    
    // تحميل النسخ الاحتياطية
    const backups = await getBackupsList();
    const backupsList = document.getElementById('backupsList');
    
    if (backupsList) {
        if (backups.length === 0) {
            backupsList.innerHTML = '<tr><td colspan="3" style="text-align: center;">لا توجد نسخ احتياطية</td></tr>';
        } else {
            backupsList.innerHTML = '';
            
            backups.forEach(backup => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${backup.name}</td>
                    <td>${backup.date}</td>
                    <td>
                        <button class="btn btn-info btn-icon action-btn" onclick="restoreBackupWithConfirmation('${backup.id}')">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button class="btn btn-danger btn-icon action-btn" onclick="deleteBackupWithConfirmation('${backup.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                backupsList.appendChild(row);
            });
        }
    }
    
    // تحميل المستثمرين المؤرشفين
    const archivedInvestors = await getArchivedInvestors();
    const archivedInvestorsList = document.getElementById('archivedInvestorsList');
    
    if (archivedInvestorsList) {
        if (archivedInvestors.length === 0) {
            archivedInvestorsList.innerHTML = '<tr><td colspan="3" style="text-align: center;">لا يوجد مستثمرين مؤرشفين</td></tr>';
        } else {
            archivedInvestorsList.innerHTML = '';
            
            archivedInvestors.forEach(archive => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${archive.investor.name}</td>
                    <td>${archive.date}</td>
                    <td>
                        <button class="btn btn-info btn-icon action-btn" onclick="restoreInvestorWithConfirmation('${archive.id}')">
                            <i class="fas fa-undo"></i>
                        </button>
                    </td>
                `;
                
                archivedInvestorsList.appendChild(row);
            });
        }
    }
}

// حفظ إعدادات المزامنة
function saveSyncSettings() {
    const enableSync = document.getElementById('enableSyncCheckbox').checked;
    
    if (enableSync) {
        if (!currentUser) {
            createNotification('خطأ', 'يرجى تسجيل الدخول لتفعيل المزامنة', 'danger');
            return;
        }
        
        enableSync();
    } else {
        disableSync();
    }
    
    // إغلاق مربع الحوار
    document.getElementById('syncSettingsModal').remove();
    
    // عرض رسالة نجاح
    createNotification('نجاح', 'تم حفظ إعدادات المزامنة بنجاح', 'success');
}

// تسجيل الخروج
async function handleSignOut() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        try {
            await signOut();
            
            // إغلاق مربع الحوار
            document.getElementById('syncSettingsModal').remove();
            
            // عرض رسالة نجاح
            createNotification('نجاح', 'تم تسجيل الخروج بنجاح', 'success');
        } catch (error) {
            createNotification('خطأ', 'حدث خطأ أثناء تسجيل الخروج: ' + error.message, 'danger');
        }
    }
}

// إنشاء نسخة احتياطية جديدة
async function createBackupNow() {
    if (!currentUser) {
        createNotification('خطأ', 'يرجى تسجيل الدخول لإنشاء نسخة احتياطية', 'danger');
        return;
    }
    
    // طلب اسم النسخة الاحتياطية
    const backupName = prompt('أدخل اسم النسخة الاحتياطية (اختياري):', '');
    
    try {
        const success = await createFirebaseBackup(backupName);
        
        if (success) {
            // تحديث قائمة النسخ الاحتياطية
            loadBackupsAndArchives();
            
            // عرض رسالة نجاح
            createNotification('نجاح', 'تم إنشاء نسخة احتياطية بنجاح', 'success');
        } else {
            createNotification('خطأ', 'فشل إنشاء النسخة الاحتياطية', 'danger');
        }
    } catch (error) {
        createNotification('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية: ' + error.message, 'danger');
    }
}

// استعادة نسخة احتياطية مع تأكيد
function restoreBackupWithConfirmation(backupId) {
    if (confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
        restoreBackup(backupId).then(success => {
            if (success) {
                // إغلاق مربع الحوار
                document.getElementById('syncSettingsModal').remove();
                
                // عرض رسالة نجاح
                createNotification('نجاح', 'تم استعادة النسخة الاحتياطية بنجاح', 'success');
            } else {
                createNotification('خطأ', 'فشل استعادة النسخة الاحتياطية', 'danger');
            }
        }).catch(error => {
            createNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية: ' + error.message, 'danger');
        });
    }
}

// حذف نسخة احتياطية مع تأكيد
function deleteBackupWithConfirmation(backupId) {
    if (confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
        deleteBackup(backupId).then(success => {
            if (success) {
                // تحديث قائمة النسخ الاحتياطية
                loadBackupsAndArchives();
                
                // عرض رسالة نجاح
                createNotification('نجاح', 'تم حذف النسخة الاحتياطية بنجاح', 'success');
            } else {
                createNotification('خطأ', 'فشل حذف النسخة الاحتياطية', 'danger');
            }
        }).catch(error => {
            createNotification('خطأ', 'حدث خطأ أثناء حذف النسخة الاحتياطية: ' + error.message, 'danger');
        });
    }
}

// استعادة مستثمر من الأرشيف مع تأكيد
function restoreInvestorWithConfirmation(investorId) {
    if (confirm('هل أنت متأكد من استعادة هذا المستثمر؟')) {
        restoreInvestor(investorId).then(success => {
            if (success) {
                // تحديث قائمة المستثمرين المؤرشفين
                loadBackupsAndArchives();
                
                // عرض رسالة نجاح
                createNotification('نجاح', 'تم استعادة المستثمر بنجاح', 'success');
            } else {
                createNotification('خطأ', 'فشل استعادة المستثمر', 'danger');
            }
        }).catch(error => {
            createNotification('خطأ', 'حدث خطأ أثناء استعادة المستثمر: ' + error.message, 'danger');
        });
    }
}

// إظهار سجل الأنشطة
async function showActivitiesLog() {
    if (!currentUser) {
        createNotification('خطأ', 'يرجى تسجيل الدخول لعرض سجل الأنشطة', 'danger');
        return;
    }
    
    try {
        // جلب سجل الأنشطة
        const activities = await getActivities();
        
        // إنشاء مربع حوار سجل الأنشطة
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'activitiesModal';
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">سجل الأنشطة</h2>
                    <div class="modal-close" onclick="document.getElementById('activitiesModal').remove()">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="table-container" style="box-shadow: none; padding: 0;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>النوع</th>
                                    <th>الوصف</th>
                                    <th>التاريخ</th>
                                </tr>
                            </thead>
                            <tbody id="activitiesList">
                                ${activities.length === 0 ? '<tr><td colspan="3" style="text-align: center;">لا توجد أنشطة</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-light" onclick="document.getElementById('activitiesModal').remove()">إغلاق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ملء جدول الأنشطة
        if (activities.length > 0) {
            const activitiesList = document.getElementById('activitiesList');
            activitiesList.innerHTML = '';
            
            activities.forEach(activity => {
                const row = document.createElement('tr');
                
                // تحديد لون ورمز النوع
                let typeIcon, typeColor;
                
                switch (activity.type) {
                    case 'system':
                        typeIcon = 'cog';
                        typeColor = 'primary';
                        break;
                    case 'investor':
                        typeIcon = 'user';
                        typeColor = 'info';
                        break;
                    case 'investment':
                        typeIcon = 'money-bill-wave';
                        typeColor = 'success';
                        break;
                    case 'operation':
                        typeIcon = 'exchange-alt';
                        typeColor = 'warning';
                        break;
                    default:
                        typeIcon = 'info-circle';
                        typeColor = 'secondary';
                }
                
                row.innerHTML = `
                    <td>
                        <span class="badge" style="background-color: var(--${typeColor}-color); color: white; padding: 5px 10px; border-radius: 50px;">
                            <i class="fas fa-${typeIcon}"></i> ${activity.type}
                        </span>
                    </td>
                    <td>${activity.description}</td>
                    <td>${activity.date}</td>
                `;
                
                activitiesList.appendChild(row);
            });
        }
    } catch (error) {
        console.error('خطأ في عرض سجل الأنشطة:', error);
        createNotification('خطأ', 'حدث خطأ أثناء تحميل سجل الأنشطة', 'danger');
    }
}

// تصدير وظائف المكتبة للاستخدام الخارجي
window.firebaseApp = {
    initializeFirebaseSync,
    signIn,
    signOut,
    createAccount,
    enableSync,
    disableSync,
    syncData,
    createFirebaseBackup,
    restoreBackup,
    archiveInvestor,
    restoreInvestor,
    showLoginDialog,
    showSyncSettings,
    showActivitiesLog
};






/**
 * ملف تهيئة وإدماج Firebase مع نظام إدارة الاستثمار
 * 
 * يجب إضافة هذا الملف في نهاية صفحة HTML بعد تحميل جميع ملفات JavaScript الأخرى
 */

// إضافة أيقونة المزامنة إلى شريط التنقل العلوي في كل صفحة
function addSyncIconToAllPages() {
    const headerActions = document.querySelectorAll('.header-actions');
    
    headerActions.forEach(headerAction => {
        // التحقق مما إذا كانت أيقونة المزامنة موجودة بالفعل
        if (headerAction.querySelector('.sync-controls')) return;
        
        // إنشاء أيقونة المزامنة
        const syncControls = document.createElement('div');
        syncControls.className = 'sync-controls';
        syncControls.innerHTML = `
            <div class="sync-btn" onclick="window.firebaseApp.showSyncSettings()" id="syncIcon">
                <i class="fas fa-cloud"></i>
            </div>
            <span id="syncStatus" style="display: none;">غير متصل</span>
            <span id="lastSyncTime" style="font-size: 0.75rem; color: var(--gray-600); margin-right: 5px; display: none;"></span>
        `;
        
        // إضافة أيقونة المزامنة بعد عنصر البحث وقبل زر الإشعارات
        const searchBar = headerAction.querySelector('.search-bar');
        if (searchBar) {
            searchBar.after(syncControls);
        } else {
            // إذا لم يكن هناك عنصر بحث، أضف أيقونة المزامنة في بداية العناصر
            headerAction.prepend(syncControls);
        }
    });
}

// تحديث وظائف حذف المستثمر
function updateDeleteInvestorFunction() {
    // حفظ الدالة الأصلية
    window.originalDeleteInvestor = window.deleteInvestor;
    
    // تعريف الدالة المعدلة
    window.deleteInvestor = function(id) {
        // البحث عن المستثمر
        const investor = investors.find(inv => inv.id === id);
        
        if (!investor) {
            createNotification('خطأ', 'المستثمر غير موجود', 'danger');
            return;
        }
        
        // فحص ما إذا كان لدى المستثمر استثمارات نشطة
        const hasActiveInvestments = investments.some(
            inv => inv.investorId === id && inv.status === 'active'
        );
        
        // إنشاء خيارات الحذف
        const options = [];
        
        if (hasActiveInvestments) {
            options.push('archive_and_delete'); // أرشفة وحذف
            options.push('close_and_delete'); // إغلاق الاستثمارات وحذف
        } else {
            options.push('delete'); // حذف فقط
        }
        
        // إنشاء مربع حوار تأكيد الحذف
        showDeleteConfirmationModal(investor, options);
    };
    
    // تعريف دالة عرض مربع حوار تأكيد الحذف
    window.showDeleteConfirmationModal = function(investor, options) {
        // إنشاء مربع الحوار
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'deleteConfirmationModal';
        
        // تحديد محتوى مربع الحوار بناءً على الخيارات المتاحة
        let optionsHtml = '';
        
        if (options.includes('archive_and_delete') && options.includes('close_and_delete')) {
            optionsHtml = `
                <div class="form-group">
                    <div class="form-check">
                        <input type="radio" class="form-check-input" id="deleteOption1" name="deleteOption" value="archive_and_delete" checked>
                        <label class="form-check-label" for="deleteOption1">أرشفة المستثمر والاستثمارات مع الحفاظ على السجلات التاريخية</label>
                    </div>
                    <div class="form-text">سيتم أرشفة المستثمر وجميع بياناته في Firebase قبل الحذف. يمكن استعادة البيانات لاحقًا.</div>
                </div>
                <div class="form-group">
                    <div class="form-check">
                        <input type="radio" class="form-check-input" id="deleteOption2" name="deleteOption" value="close_and_delete">
                        <label class="form-check-label" for="deleteOption2">إغلاق جميع الاستثمارات النشطة ثم حذف المستثمر</label>
                    </div>
                    <div class="form-text">سيتم تغيير حالة الاستثمارات النشطة إلى "مغلق" ثم حذف المستثمر. ستبقى سجلات العمليات موجودة.</div>
                </div>
            `;
        } else if (options.includes('delete')) {
            optionsHtml = `
                <div class="form-group">
                    <div class="form-check">
                        <input type="radio" class="form-check-input" id="deleteOption3" name="deleteOption" value="delete" checked>
                        <label class="form-check-label" for="deleteOption3">حذف المستثمر</label>
                    </div>
                    <div class="form-text">سيتم حذف المستثمر وبياناته من النظام. يمكن أرشفة البيانات في Firebase قبل الحذف.</div>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">تأكيد حذف المستثمر</h2>
                    <div class="modal-close" onclick="document.getElementById('deleteConfirmationModal').remove()">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <div class="alert-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">تحذير!</div>
                            <div class="alert-text">أنت على وشك حذف المستثمر: <strong>${investor.name}</strong></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="archiveBeforeDelete" checked>
                            <label class="form-check-label" for="archiveBeforeDelete">أرشفة البيانات في Firebase قبل الحذف</label>
                        </div>
                        <div class="form-text">سيتم حفظ نسخة من بيانات المستثمر في Firebase للرجوع إليها لاحقًا إذا لزم الأمر.</div>
                    </div>
                    
                    ${optionsHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-light" onclick="document.getElementById('deleteConfirmationModal').remove()">إلغاء</button>
                    <button class="btn btn-danger" onclick="processDeleteInvestor('${investor.id}')">
                        <i class="fas fa-trash"></i> حذف المستثمر
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    };
    
    // تعريف دالة معالجة حذف المستثمر
    window.processDeleteInvestor = async function(investorId) {
        // الحصول على خيارات الحذف
        const archiveBeforeDelete = document.getElementById('archiveBeforeDelete').checked;
        
        // خيار الحذف المحدد
        let deleteOption = 'delete';
        const deleteOptions = document.getElementsByName('deleteOption');
        
        for (const option of deleteOptions) {
            if (option.checked) {
                deleteOption = option.value;
                break;
            }
        }
        
        // إغلاق مربع الحوار
        document.getElementById('deleteConfirmationModal').remove();
        
        // البحث عن المستثمر
        const investor = investors.find(inv => inv.id === investorId);
        
        if (!investor) {
            createNotification('خطأ', 'المستثمر غير موجود', 'danger');
            return;
        }
        
        // أرشفة البيانات في Firebase إذا تم تحديد هذا الخيار
        if (archiveBeforeDelete && window.firebaseApp && window.syncEnabled) {
            try {
                // عرض رسالة أثناء الأرشفة
                createNotification('معلومات', 'جاري أرشفة بيانات المستثمر...', 'info');
                
                // أرشفة المستثمر
                await window.firebaseApp.archiveInvestor(investorId);
            } catch (error) {
                console.error('خطأ في أرشفة بيانات المستثمر:', error);
                
                // إذا فشلت الأرشفة، نسأل المستخدم ما إذا كان يريد المتابعة
                if (!confirm('فشلت عملية أرشفة البيانات. هل تريد المتابعة في حذف المستثمر؟')) {
                    return;
                }
            }
        }
        
        // معالجة الخيار المحدد
        if (deleteOption === 'archive_and_delete') {
            // أرشفة وحذف
            
            // 1. حذف المستثمر من المصفوفة
            investors = investors.filter(inv => inv.id !== investorId);
            
            // 2. الاحتفاظ باستثمارات المستثمر وإغلاقها
            investments.forEach(investment => {
                if (investment.investorId === investorId && investment.status === 'active') {
                    investment.status = 'closed';
                    
                    // إضافة عملية إغلاق الاستثمار
                    const closeOperation = {
                        id: generateOperationId(),
                        investorId: investorId,
                        investmentId: investment.id,
                        type: 'close',
                        amount: investment.amount,
                        date: new Date().toISOString(),
                        notes: 'إغلاق الاستثمار بسبب حذف المستثمر',
                        status: 'active'
                    };
                    
                    operations.push(closeOperation);
                }
            });
            
            // تسجيل نشاط حذف المستثمر
            if (window.firebaseApp) {
                window.firebaseApp.logActivity('investor', 'تم حذف المستثمر: ' + investor.name, investorId);
            }
            
        } else if (deleteOption === 'close_and_delete') {
            // إغلاق الاستثمارات وحذف
            
            // 1. إغلاق جميع الاستثمارات النشطة
            investments.forEach(investment => {
                if (investment.investorId === investorId && investment.status === 'active') {
                    investment.status = 'closed';
                    
                    // إضافة عملية إغلاق الاستثمار
                    const closeOperation = {
                        id: generateOperationId(),
                        investorId: investorId,
                        investmentId: investment.id,
                        type: 'close',
                        amount: investment.amount,
                        date: new Date().toISOString(),
                        notes: 'إغلاق الاستثمار بسبب حذف المستثمر',
                        status: 'active'
                    };
                    
                    operations.push(closeOperation);
                }
            });
            
            // 2. حذف المستثمر
            investors = investors.filter(inv => inv.id !== investorId);
            
            // تسجيل نشاط حذف المستثمر
            if (window.firebaseApp) {
                window.firebaseApp.logActivity('investor', 'تم حذف المستثمر مع إغلاق الاستثمارات النشطة: ' + investor.name, investorId);
            }
            
        } else {
            // حذف عادي
            
            // 1. حذف المستثمر
            investors = investors.filter(inv => inv.id !== investorId);
            
            // 2. حذف استثمارات المستثمر
            investments = investments.filter(inv => inv.investorId !== investorId);
            
            // 3. الاحتفاظ بسجلات العمليات للرجوع إليها
            
            // تسجيل نشاط حذف المستثمر
            if (window.firebaseApp) {
                window.firebaseApp.logActivity('investor', 'تم حذف المستثمر ومسح جميع بياناته: ' + investor.name, investorId);
            }
        }
        
        // حفظ البيانات
        saveData();
        
        // إذا كانت المزامنة مفعلة، قم بدفع التغييرات إلى Firebase
        if (window.firebaseApp && window.syncEnabled) {
            window.firebaseApp.syncData();
        }
        
        // تحديث قائمة المستثمرين
        loadInvestors();
        
        // عرض رسالة نجاح
        createNotification('نجاح', 'تم حذف المستثمر بنجاح', 'success');
    };
}

// إضافة مستمعي الأحداث للتغييرات في التخزين المحلي
function addStorageEventListeners() {
    // إنشاء وظيفة مساعدة لإرسال أحداث تغيير التخزين
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // استدعاء الوظيفة الأصلية
        originalSetItem.call(this, key, value);
        
        // إرسال حدث تغيير التخزين
        const event = new CustomEvent('storage-changed', {
            detail: { key, value }
        });
        window.dispatchEvent(event);
    };
}

// تهيئة Firebase عند تحميل الصفحة
function initializeFirebase() {
    // تهيئة Firebase
    if (window.firebaseApp) {
        window.firebaseApp.initializeFirebaseSync();
    } else {
        console.error("خطأ: لم يتم العثور على كائن firebaseApp");
    }
    
    // إضافة حالة المزامنة إلى window
    window.syncEnabled = localStorage.getItem('syncEnabled') === 'true';
    window.currentUser = null;
    
    // إضافة مستمع للتحقق من حالة المصادقة
    firebase.auth().onAuthStateChanged(function(user) {
        window.currentUser = user;
        
        // تحديث واجهة المستخدم
        if (user) {
            const syncStatus = document.getElementById('syncStatus');
            if (syncStatus) {
                syncStatus.textContent = 'متصل: ' + user.email;
            }
        }
    });
    
    // أضف أيقونة المزامنة إلى جميع الصفحات
    addSyncIconToAllPages();
    
    // تحديث وظائف حذف المستثمر
    updateDeleteInvestorFunction();
    
    // إضافة مستمعي الأحداث للتغييرات في التخزين المحلي
    addStorageEventListeners();
    
    // تسجيل حدث تهيئة Firebase
    console.log("تم تهيئة Firebase بنجاح");
}

// استدعاء دالة التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeFirebase);

// إضافة مستمع للتنقل بين الصفحات
window.addEventListener('page-changed', function(e) {
    // تأكد من أن أيقونة المزامنة موجودة في الصفحة الجديدة
    addSyncIconToAllPages();
});

// تجاوز دالة showPage الأصلية لتسجيل أحداث تغيير الصفحة
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    // استدعاء الدالة الأصلية
    originalShowPage(pageId);
    
    // إرسال حدث تغيير الصفحة
    const event = new CustomEvent('page-changed', { detail: { pageId } });
    window.dispatchEvent(event);
};

// إطلاق الخدمات التلقائية
function startAutomaticServices() {
    // التحقق من النسخ الاحتياطي التلقائي
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
    const autoBackupFrequency = localStorage.getItem('autoBackupFrequency') || 'weekly';
    const lastAutoBackup = localStorage.getItem('lastAutoBackup');
    
    if (autoBackupEnabled && window.syncEnabled && window.currentUser) {
        const now = new Date();
        const lastBackupDate = lastAutoBackup ? new Date(parseInt(lastAutoBackup)) : null;
        
        let shouldBackup = false;
        
        if (!lastBackupDate) {
            shouldBackup = true;
        } else {
            const daysSinceLastBackup = Math.floor((now - lastBackupDate) / (1000 * 60 * 60 * 24));
            
            if (autoBackupFrequency === 'daily' && daysSinceLastBackup >= 1) {
                shouldBackup = true;
            } else if (autoBackupFrequency === 'weekly' && daysSinceLastBackup >= 7) {
                shouldBackup = true;
            } else if (autoBackupFrequency === 'monthly' && daysSinceLastBackup >= 30) {
                shouldBackup = true;
            }
        }
        
        if (shouldBackup) {
            // إنشاء نسخة احتياطية تلقائية
            window.firebaseApp.createFirebaseBackup('نسخة تلقائية ' + now.toLocaleDateString('ar-IQ'))
                .then(success => {
                    if (success) {
                        localStorage.setItem('lastAutoBackup', now.getTime().toString());
                        console.log('تم إنشاء نسخة احتياطية تلقائية بنجاح');
                    }
                })
                .catch(error => {
                    console.error('خطأ في إنشاء النسخة الاحتياطية التلقائية:', error);
                });
        }
    }
}

// استدعاء دالة الخدمات التلقائية كل ساعة
setInterval(startAutomaticServices, 60 * 60 * 1000);

// استدعاء دالة الخدمات التلقائية عند تحميل الصفحة
setTimeout(startAutomaticServices, 5000);