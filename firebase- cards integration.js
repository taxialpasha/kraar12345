// تهيئة Firebase وإدارة المزامنة
(function() {
    'use strict';
    
    // تهيئة Firebase عند تحميل الصفحة
    window.addEventListener('load', function() {
        initializeFirebase();
    });
    
    // تهيئة Firebase
    function initializeFirebase() {
        try {
            // التحقق من وجود Firebase
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK غير محمل!');
                return;
            }
            
            // تهيئة Firebase
            firebase.initializeApp(firebaseConfig);
            
            // إنشاء كائن Firebase للتطبيق
            window.firebaseApp = {
                app: firebase.app(),
                auth: firebase.auth(),
                database: firebase.database(),
                storage: firebase.storage(),
                messaging: firebase.messaging()
            };
            
            // تحديد حالة المستخدم
            firebase.auth().onAuthStateChanged(function(user) {
                window.currentUser = user;
                updateAuthUI(user);
                if (user) {
                    // المستخدم مسجل دخول
                    console.log('المستخدم مسجل دخول:', user.email);
                    enableSync();
                } else {
                    // المستخدم غير مسجل دخول
                    console.log('المستخدم غير مسجل دخول');
                    disableSync();
                }
            });
            
            console.log('تم تهيئة Firebase بنجاح');
        } catch (error) {
            console.error('خطأ في تهيئة Firebase:', error);
        }
    }
    
    // تحديث واجهة المستخدم للمصادقة
    function updateAuthUI(user) {
        const signOutBtn = document.getElementById('signOutButton');
        const connectionInfo = document.getElementById('connectionInfo');
        const syncStatusText = document.getElementById('syncStatusText');
        
        if (user) {
            // المستخدم مسجل دخول
            if (signOutBtn) signOutBtn.style.display = 'inline-block';
            
            if (connectionInfo) {
                const alertDiv = connectionInfo.querySelector('.alert');
                if (alertDiv) {
                    alertDiv.className = 'alert alert-success';
                    alertDiv.querySelector('.alert-icon i').className = 'fas fa-check-circle';
                    alertDiv.querySelector('.alert-title').textContent = 'متصل';
                    alertDiv.querySelector('.alert-text').textContent = `البريد الإلكتروني: ${user.email}`;
                }
            }
            
            if (syncStatusText) {
                syncStatusText.textContent = 'المزامنة نشطة ومتصلة.';
            }
        } else {
            // المستخدم غير مسجل دخول
            if (signOutBtn) signOutBtn.style.display = 'none';
            
            if (connectionInfo) {
                const alertDiv = connectionInfo.querySelector('.alert');
                if (alertDiv) {
                    alertDiv.className = 'alert alert-info';
                    alertDiv.querySelector('.alert-icon i').className = 'fas fa-info-circle';
                    alertDiv.querySelector('.alert-title').textContent = 'غير متصل';
                    alertDiv.querySelector('.alert-text').textContent = 'يرجى تسجيل الدخول لتفعيل المزامنة';
                }
            }
            
            if (syncStatusText) {
                syncStatusText.textContent = 'المزامنة متوقفة حالياً.';
            }
        }
    }
    
    // تسجيل الدخول إلى Firebase
    window.loginToFirebase = function(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(function(userCredential) {
                // تسجيل دخول ناجح
                window.currentUser = userCredential.user;
                
                // إخفاء نموذج تسجيل الدخول وإظهار خيارات المزامنة
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('syncOptions').style.display = 'block';
                
                // عرض البريد الإلكتروني
                const loggedInUserElement = document.getElementById('loggedInUser');
                if (loggedInUserElement) {
                    loggedInUserElement.textContent = userCredential.user.email;
                }
                
                createNotification('نجاح', 'تم تسجيل الدخول بنجاح', 'success');
            })
            .catch(function(error) {
                console.error('خطأ في تسجيل الدخول:', error);
                createNotification('خطأ', 'فشل تسجيل الدخول: ' + error.message, 'danger');
            });
    };
    
    // تسجيل الخروج من Firebase
    window.signOutFromFirebase = function() {
        firebase.auth().signOut()
            .then(function() {
                window.currentUser = null;
                disableSync();
                
                // إظهار نموذج تسجيل الدخول وإخفاء خيارات المزامنة
                document.getElementById('loginForm').style.display = 'block';
                document.getElementById('syncOptions').style.display = 'none';
                
                createNotification('نجاح', 'تم تسجيل الخروج بنجاح', 'success');
            })
            .catch(function(error) {
                console.error('خطأ في تسجيل الخروج:', error);
                createNotification('خطأ', 'فشل تسجيل الخروج: ' + error.message, 'danger');
            });
    };
    
    // إظهار نافذة إعدادات المزامنة
    window.firebaseApp.showSyncSettings = function() {
        const modal = document.getElementById('syncDialog');
        if (!modal) {
            console.error('نافذة المزامنة غير موجودة');
            return;
        }
        
        // التحقق من حالة تسجيل الدخول
        const user = firebase.auth().currentUser;
        
        if (user) {
            // المستخدم مسجل دخول - إظهار خيارات المزامنة
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('syncOptions').style.display = 'block';
            
            // عرض البريد الإلكتروني
            const loggedInUserElement = document.getElementById('loggedInUser');
            if (loggedInUserElement) {
                loggedInUserElement.textContent = user.email;
            }
            
            // تحميل قائمة النسخ الاحتياطية
            loadFirebaseBackups();
        } else {
            // المستخدم غير مسجل دخول - إظهار نموذج تسجيل الدخول
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('syncOptions').style.display = 'none';
        }
        
        // فتح النافذة
        modal.classList.add('active');
    };
    
    // إغلاق نافذة المزامنة
    window.closeSyncDialog = function() {
        const modal = document.getElementById('syncDialog');
        if (modal) {
            modal.classList.remove('active');
        }
    };
    
    // تحميل النسخ الاحتياطية من Firebase
    function loadFirebaseBackups() {
        if (!window.firebaseApp || !window.firebaseApp.database) {
            console.warn('Firebase غير متاح لتحميل النسخ الاحتياطية');
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        // تحميل النسخ الاحتياطية للمستخدم
        window.firebaseApp.database().ref(`backups/${user.uid}`).once('value')
            .then(function(snapshot) {
                const backups = snapshot.val() || {};
                const backupsList = document.getElementById('backupsList');
                
                if (!backupsList) return;
                
                backupsList.innerHTML = '';
                
                const backupArray = Object.keys(backups).map(key => ({
                    id: key,
                    ...backups[key]
                }));
                
                if (backupArray.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'لا توجد نسخ احتياطية';
                    option.disabled = true;
                    backupsList.appendChild(option);
                } else {
                    // ترتيب النسخ الاحتياطية حسب التاريخ (الأحدث أولاً)
                    backupArray.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    backupArray.forEach(backup => {
                        const option = document.createElement('option');
                        option.value = backup.id;
                        option.textContent = `${backup.name} - ${formatDate(backup.date)} ${formatTime(backup.date)}`;
                        backupsList.appendChild(option);
                    });
                }
            })
            .catch(function(error) {
                console.error('خطأ في تحميل النسخ الاحتياطية:', error);
            });
    }
    
    // إنشاء نسخة احتياطية في Firebase
    window.createFirebaseBackup = function() {
        const user = firebase.auth().currentUser;
        if (!user) {
            createNotification('خطأ', 'يجب تسجيل الدخول أولاً', 'danger');
            return;
        }
        
        // إنشاء اسم للنسخة الاحتياطية
        const date = new Date();
        const backupName = prompt('أدخل اسم النسخة الاحتياطية (اختياري):', 
            `نسخة احتياطية ${date.toLocaleDateString('ar-IQ')} ${date.toLocaleTimeString('ar-IQ')}`);
        
        if (backupName === null) return;
        
        // إنشاء كائن النسخة الاحتياطية
        const backup = {
            name: backupName || `نسخة احتياطية ${formatDate(date.toISOString())}`,
            date: date.toISOString(),
            data: {
                investors: investors,
                investments: investments,
                operations: operations,
                settings: settings,
                events: events,
                notifications: notifications,
                investorCards: investorCards || {}
            }
        };
        
        // حفظ النسخة الاحتياطية في Firebase
        const backupRef = window.firebaseApp.database().ref(`backups/${user.uid}`).push();
        backupRef.set(backup)
            .then(function() {
                createNotification('نجاح', 'تم إنشاء نسخة احتياطية في Firebase بنجاح', 'success');
                loadFirebaseBackups();
            })
            .catch(function(error) {
                console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
                createNotification('خطأ', 'فشل إنشاء النسخة الاحتياطية: ' + error.message, 'danger');
            });
    };
    
    // استعادة نسخة احتياطية من Firebase
    window.restoreFirebaseBackup = function() {
        const backupsList = document.getElementById('backupsList');
        if (!backupsList || !backupsList.value) {
            createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            createNotification('خطأ', 'يجب تسجيل الدخول أولاً', 'danger');
            return;
        }
        
        const backupId = backupsList.value;
        
        // تأكيد الاستعادة
        if (!confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
            return;
        }
        
        // استعادة النسخة الاحتياطية
        window.firebaseApp.database().ref(`backups/${user.uid}/${backupId}`).once('value')
            .then(function(snapshot) {
                const backup = snapshot.val();
                if (!backup || !backup.data) {
                    createNotification('خطأ', 'النسخة الاحتياطية غير صالحة', 'danger');
                    return;
                }
                
                // استعادة البيانات
                const data = backup.data;
                
                if (data.investors) investors = data.investors;
                if (data.investments) investments = data.investments;
                if (data.operations) operations = data.operations;
                if (data.settings) settings = {...settings, ...data.settings};
                if (data.events) events = data.events;
                if (data.notifications) notifications = data.notifications;
                if (data.investorCards) investorCards = data.investorCards;
                
                // حفظ البيانات محلياً
                saveData();
                saveNotifications();
                saveInvestorCards();
                
                createNotification('نجاح', 'تم استعادة النسخة الاحتياطية بنجاح', 'success');
                
                // إعادة تحميل الصفحة بعد ثانيتين
                setTimeout(function() {
                    window.location.reload();
                }, 2000);
            })
            .catch(function(error) {
                console.error('خطأ في استعادة النسخة الاحتياطية:', error);
                createNotification('خطأ', 'فشل استعادة النسخة الاحتياطية: ' + error.message, 'danger');
            });
    };
    
    // حذف نسخة احتياطية من Firebase
    window.deleteFirebaseBackup = function() {
        const backupsList = document.getElementById('backupsList');
        if (!backupsList || !backupsList.value) {
            createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
            return;
        }
        
        const user = firebase.auth().currentUser;
        if (!user) {
            createNotification('خطأ', 'يجب تسجيل الدخول أولاً', 'danger');
            return;
        }
        
        const backupId = backupsList.value;
        
        // تأكيد الحذف
        if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
            return;
        }
        
        // حذف النسخة الاحتياطية
        window.firebaseApp.database().ref(`backups/${user.uid}/${backupId}`).remove()
            .then(function() {
                createNotification('نجاح', 'تم حذف النسخة الاحتياطية بنجاح', 'success');
                loadFirebaseBackups();
            })
            .catch(function(error) {
                console.error('خطأ في حذف النسخة الاحتياطية:', error);
                createNotification('خطأ', 'فشل حذف النسخة الاحتياطية: ' + error.message, 'danger');
            });
    };
    
    // تسجيل الدخول إلى Firebase من الإعدادات
    window.firebaseApp.showLoginDialog = function() {
        showSyncDialog();
    };
    
    // تسجيل الخروج من Firebase
    window.firebaseApp.signOut = function() {
        signOutFromFirebase();
    };
    
    // مزامنة البيانات مع Firebase
    window.syncData = function() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.warn('يجب تسجيل الدخول لمزامنة البيانات');
            return;
        }
        
        // مزامنة كل نوع من البيانات
        const syncPromises = [
            window.firebaseApp.database().ref(`users/${user.uid}/investors`).set(investors),
            window.firebaseApp.database().ref(`users/${user.uid}/investments`).set(investments),
            window.firebaseApp.database().ref(`users/${user.uid}/operations`).set(operations),
            window.firebaseApp.database().ref(`users/${user.uid}/settings`).set(settings),
            window.firebaseApp.database().ref(`users/${user.uid}/events`).set(events),
            window.firebaseApp.database().ref(`users/${user.uid}/investorCards`).set(investorCards || {})
        ];
        
        // انتظار انتهاء جميع عمليات المزامنة
        Promise.all(syncPromises)
            .then(function() {
                // تحديث آخر وقت للمزامنة
                window.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastSyncTime', window.lastSyncTime);
                
                // تحديث عرض آخر وقت للمزامنة
                const lastSyncTimeElement = document.getElementById('lastSyncTime');
                if (lastSyncTimeElement) {
                    lastSyncTimeElement.textContent = `آخر مزامنة: ${formatDate(window.lastSyncTime)} ${formatTime(window.lastSyncTime)}`;
                    lastSyncTimeElement.style.display = 'inline-block';
                }
                
                console.log('تمت مزامنة البيانات بنجاح');
            })
            .catch(function(error) {
                console.error('خطأ في مزامنة البيانات:', error);
                createNotification('خطأ', 'فشل في مزامنة البيانات: ' + error.message, 'danger');
            });
    };
    
    // تفعيل المزامنة
    window.enableSync = function() {
        const user = firebase.auth().currentUser;
        if (!user) {
            createNotification('خطأ', 'يجب تسجيل الدخول أولاً', 'danger');
            return;
        }
        
        window.syncActive = true;
        localStorage.setItem('syncEnabled', 'true');
        
        // تحديث حالة المزامنة
        updateSyncStatus('متصل', 'success');
        
        // بدء المزامنة الأولية
        syncData();
        
        // بدء المزامنة الدورية
        startSyncInterval();
        
        // الاستماع للتغييرات من Firebase
        startFirebaseListeners();
    };
    
    // تعطيل المزامنة
    window.disableSync = function() {
        window.syncActive = false;
        localStorage.setItem('syncEnabled', 'false');
        
        // تحديث حالة المزامنة
        updateSyncStatus('غير متصل', 'info');
        
        // إيقاف المزامنة الدورية
        stopSyncInterval();
        
        // إيقاف الاستماع للتغييرات
        stopFirebaseListeners();
    };
    
    // بدء الاستماع للتغييرات من Firebase
    function startFirebaseListeners() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        // الاستماع للتغييرات في المستثمرين
        window.firebaseApp.database().ref(`users/${user.uid}/investors`).on('value', function(snapshot) {
            const firebaseInvestors = snapshot.val() || [];
            if (JSON.stringify(firebaseInvestors) !== JSON.stringify(investors)) {
                investors = firebaseInvestors;
                localStorage.setItem('investors', JSON.stringify(investors));
                // تحديث واجهة المستخدم
                if (document.getElementById('investorsTableBody')) {
                    loadInvestors();
                }
            }
        });
        
        // الاستماع للتغييرات في الاستثمارات
        window.firebaseApp.database().ref(`users/${user.uid}/investments`).on('value', function(snapshot) {
            const firebaseInvestments = snapshot.val() || [];
            if (JSON.stringify(firebaseInvestments) !== JSON.stringify(investments)) {
                investments = firebaseInvestments;
                localStorage.setItem('investments', JSON.stringify(investments));
                // تحديث واجهة المستخدم
                if (document.getElementById('investmentsTableBody')) {
                    loadInvestments();
                }
            }
        });
        
        // الاستماع للتغييرات في بطاقات المستثمرين
        window.firebaseApp.database().ref(`users/${user.uid}/investorCards`).on('value', function(snapshot) {
            const firebaseCards = snapshot.val() || {};
            if (JSON.stringify(firebaseCards) !== JSON.stringify(investorCards)) {
                investorCards = firebaseCards;
                localStorage.setItem('investorCards', JSON.stringify(investorCards));
                // تحديث واجهة المستخدم
                if (document.getElementById('investorCardsTableBody')) {
                    updateInvestorCardsTable();
                }
            }
        });
    }
    
    // إيقاف الاستماع للتغييرات من Firebase
    function stopFirebaseListeners() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        window.firebaseApp.database().ref(`users/${user.uid}/investors`).off();
        window.firebaseApp.database().ref(`users/${user.uid}/investments`).off();
        window.firebaseApp.database().ref(`users/${user.uid}/investorCards`).off();
    }
    
    // إضافة دالة لإنشاء نسخة احتياطية من صفحة الإعدادات
    window.createFirebaseBackupFromSettings = function() {
        const user = firebase.auth().currentUser;
        if (!user) {
            createNotification('خطأ', 'يجب تسجيل الدخول أولاً', 'danger');
            showSyncDialog();
            return;
        }
        
        createFirebaseBackup();
    };
    
    // إضافة دالة لعرض سجل الأنشطة
    window.firebaseApp.showActivitiesLog = function() {
        createNotification('معلومات', 'سيتم إضافة ميزة سجل الأنشطة قريباً', 'info');
    };
})();