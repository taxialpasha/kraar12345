/**
 * app-fixes.js
 * 
 * ملف إصلاحات لنظام إدارة الاستثمار
 * يحتوي على إصلاح مشكلة حذف المستثمرين
 * وإزالة البيانات الوهمية من التطبيق
 */

// =============== إصلاح مشكلة حذف المستثمر ================

// تعديل وظيفة حذف المستثمر
function fixDeleteInvestorIssue() {
    // حفظ النسخة الأصلية من الدالة
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
        
        if (hasActiveInvestments) {
            createNotification('خطأ', 'لا يمكن حذف المستثمر لأن لديه استثمارات نشطة', 'danger');
            return;
        }
        
        // تأكيد الحذف
        if (!confirm('هل أنت متأكد من حذف المستثمر؟ سيتم حذف جميع بياناته نهائياً.')) {
            return;
        }
        
        try {
            // حذف المستثمر من المصفوفة
            investors = investors.filter(inv => inv.id !== id);
            
            // حذف استثمارات المستثمر
            investments = investments.filter(inv => inv.investorId !== id);
            
            // حذف عمليات المستثمر
            operations = operations.filter(op => op.investorId !== id);
            
            // حفظ البيانات في localStorage
            localStorage.setItem('investors', JSON.stringify(investors));
            localStorage.setItem('investments', JSON.stringify(investments));
            localStorage.setItem('operations', JSON.stringify(operations));
            
            // أيضاً، استدعاء saveData() للتأكيد
            if (typeof saveData === 'function') {
                saveData();
            }
            
            // إذا كانت المزامنة مع Firebase مفعلة، قم بمزامنة البيانات
            if (window.firebaseApp && window.syncEnabled) {
                window.firebaseApp.syncData();
            }
            
            // حذف أي بيانات مخزنة أخرى متعلقة بالمستثمر
            cleanupInvestorCache(id);
            
            // تحديث جدول المستثمرين
            loadInvestors();
            
            // عرض رسالة نجاح
            createNotification('نجاح', 'تم حذف المستثمر بنجاح', 'success');
            
            return true;
        } catch (error) {
            console.error('خطأ في حذف المستثمر:', error);
            createNotification('خطأ', 'حدث خطأ أثناء حذف المستثمر', 'danger');
            return false;
        }
    };
    
    console.log('تم تحديث وظيفة حذف المستثمر');
}

// تنظيف أي بيانات مخزنة متعلقة بالمستثمر
function cleanupInvestorCache(investorId) {
    try {
        // أي بيانات إضافية محتملة يمكن أن تكون مخزنة في localStorage
        const cacheKeys = ['recentInvestors', 'investorHistory', 'investorCache'];
        
        cacheKeys.forEach(key => {
            const cachedData = localStorage.getItem(key);
            if (cachedData) {
                try {
                    const data = JSON.parse(cachedData);
                    if (Array.isArray(data)) {
                        const filtered = data.filter(item => item.id !== investorId && item.investorId !== investorId);
                        localStorage.setItem(key, JSON.stringify(filtered));
                    } else if (typeof data === 'object' && data !== null) {
                        if (data[investorId]) {
                            delete data[investorId];
                            localStorage.setItem(key, JSON.stringify(data));
                        }
                    }
                } catch (e) {
                    console.error(`خطأ في معالجة ${key}:`, e);
                }
            }
        });
        
        // تنظيف أي بيانات مرتبطة بالمستثمر في IndexedDB إذا كانت مستخدمة
        if (window.indexedDB) {
            cleanupIndexedDBData(investorId);
        }
    } catch (error) {
        console.error('خطأ في تنظيف بيانات المستثمر المخزنة:', error);
    }
}

// تنظيف بيانات IndexedDB إذا كانت مستخدمة
function cleanupIndexedDBData(investorId) {
    try {
        const dbNames = ['investmentApp', 'investmentAppCache'];
        
        dbNames.forEach(dbName => {
            const request = indexedDB.open(dbName);
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                
                // قائمة المخازن المحتملة التي قد تحتوي على بيانات المستثمر
                const stores = ['investors', 'investments', 'operations', 'cache'];
                
                const tx = db.transaction(
                    stores.filter(store => db.objectStoreNames.contains(store)), 
                    'readwrite'
                );
                
                stores.forEach(storeName => {
                    if (db.objectStoreNames.contains(storeName)) {
                        const store = tx.objectStore(storeName);
                        
                        const request = store.openCursor();
                        request.onsuccess = function(event) {
                            const cursor = event.target.result;
                            if (cursor) {
                                const value = cursor.value;
                                
                                if (value.id === investorId || value.investorId === investorId) {
                                    store.delete(cursor.key);
                                }
                                
                                cursor.continue();
                            }
                        };
                    }
                });
                
                tx.oncomplete = function() {
                    db.close();
                };
            };
        });
    } catch (error) {
        console.error('خطأ في تنظيف بيانات IndexedDB:', error);
    }
}

// ================ إزالة البيانات الوهمية ================

// إزالة البيانات الوهمية من التطبيق
function removeDummyData() {
    try {
        // تعطيل وظيفة إنشاء البيانات التجريبية
        window.createSampleData = function() {
            console.log('تم تعطيل وظيفة إنشاء البيانات التجريبية');
            return false;
        };
        
        // إزالة البيانات التجريبية الحالية من localStorage
        if (localStorage.getItem('firstRun') === 'true') {
            // التحقق إذا كانت البيانات هي بيانات تجريبية أصلية
            const investorsData = JSON.parse(localStorage.getItem('investors') || '[]');
            
            // التحقق من علامات البيانات التجريبية (مثل وجود مستثمرين بأسماء معينة)
            const hasDummyData = investorsData.some(inv => 
                ['أحمد محمد', 'سارة أحمد', 'محمد علي'].includes(inv.name)
            );
            
            if (hasDummyData) {
                // مسح البيانات
                localStorage.removeItem('investors');
                localStorage.removeItem('investments');
                localStorage.removeItem('operations');
                
                // إعادة تعيين متغيرات التطبيق
                window.investors = [];
                window.investments = [];
                window.operations = [];
                
                // حفظ الإعدادات فقط
                if (window.settings) {
                    localStorage.setItem('settings', JSON.stringify(window.settings));
                }
                
                // إعادة تعيين علامة التشغيل الأول
                localStorage.removeItem('firstRun');
                
                console.log('تم إزالة البيانات التجريبية');
                
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('خطأ في إزالة البيانات التجريبية:', error);
        return false;
    }
}

// تحديث وظيفة تهيئة التطبيق
function updateInitializeApp() {
    // حفظ النسخة الأصلية من الدالة
    window.originalInitializeApp = window.initializeApp;
    
    // تعريف الدالة المعدلة
    window.initializeApp = function() {
        try {
            // استدعاء الدالة الأصلية
            if (typeof window.originalInitializeApp === 'function') {
                window.originalInitializeApp();
            } else {
                // تنفيذ الخطوات الأساسية إذا لم تكن الدالة الأصلية متاحة
                loadData();
                setupFormEventListeners();
                showPage('dashboard');
            }
            
            // إزالة البيانات التجريبية
            removeDummyData();
            
            // إعادة تحميل البيانات الحقيقية
            loadData();
            
            // تحديث واجهة المستخدم
            if (document.querySelector('.page.active')) {
                const activePage = document.querySelector('.page.active').id;
                showPage(activePage);
            } else {
                showPage('dashboard');
            }
            
            console.log('تم تهيئة التطبيق بنجاح بدون بيانات وهمية');
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            alert('حدث خطأ أثناء تحميل التطبيق. الرجاء تحديث الصفحة والمحاولة مرة أخرى.');
        }
    };
    
    console.log('تم تحديث وظيفة تهيئة التطبيق');
}

// =========== تحسين عملية حفظ واسترجاع البيانات ===========

// تحديث وظيفة حفظ البيانات
function updateSaveDataFunction() {
    // حفظ النسخة الأصلية من الدالة
    window.originalSaveData = window.saveData;
    
    // تعريف الدالة المعدلة
    window.saveData = function() {
        try {
            // استدعاء الدالة الأصلية
            if (typeof window.originalSaveData === 'function') {
                window.originalSaveData();
            }
            
            // التأكد من حفظ البيانات في localStorage
            localStorage.setItem('investors', JSON.stringify(window.investors || []));
            localStorage.setItem('investments', JSON.stringify(window.investments || []));
            localStorage.setItem('operations', JSON.stringify(window.operations || []));
            localStorage.setItem('settings', JSON.stringify(window.settings || {}));
            
            // إضافة طابع زمني للحفظ
            localStorage.setItem('lastSave', Date.now().toString());
            
            // حفظ البيانات في sessionStorage أيضاً كنسخة احتياطية
            sessionStorage.setItem('investors_backup', localStorage.getItem('investors'));
            sessionStorage.setItem('investments_backup', localStorage.getItem('investments'));
            sessionStorage.setItem('operations_backup', localStorage.getItem('operations'));
            
            console.log('تم حفظ البيانات بنجاح:', new Date().toLocaleTimeString());
            
            // إرسال إشعار بتغيير البيانات
            window.dispatchEvent(new CustomEvent('data-changed'));
            
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            
            // محاولة استخدام sessionStorage كبديل
            try {
                sessionStorage.setItem('investors', JSON.stringify(window.investors || []));
                sessionStorage.setItem('investments', JSON.stringify(window.investments || []));
                sessionStorage.setItem('operations', JSON.stringify(window.operations || []));
                console.log('تم حفظ البيانات في sessionStorage كحل بديل');
            } catch (sessionError) {
                console.error('فشل حفظ البيانات في sessionStorage:', sessionError);
            }
            
            return false;
        }
    };
    
    console.log('تم تحديث وظيفة حفظ البيانات');
}

// تحديث وظيفة تحميل البيانات
function updateLoadDataFunction() {
    // حفظ النسخة الأصلية من الدالة
    window.originalLoadData = window.loadData;
    
    // تعريف الدالة المعدلة
    window.loadData = function() {
        try {
            // محاولة استعادة البيانات من localStorage
            let investorsLoaded = false;
            let investmentsLoaded = false;
            let operationsLoaded = false;
            
            const storedInvestors = localStorage.getItem('investors');
            const storedInvestments = localStorage.getItem('investments');
            const storedOperations = localStorage.getItem('operations');
            const storedSettings = localStorage.getItem('settings');
            
            if (storedInvestors) {
                try {
                    window.investors = JSON.parse(storedInvestors);
                    investorsLoaded = true;
                } catch (e) {
                    console.error('خطأ في تحليل بيانات المستثمرين:', e);
                }
            }
            
            if (storedInvestments) {
                try {
                    window.investments = JSON.parse(storedInvestments);
                    investmentsLoaded = true;
                } catch (e) {
                    console.error('خطأ في تحليل بيانات الاستثمارات:', e);
                }
            }
            
            if (storedOperations) {
                try {
                    window.operations = JSON.parse(storedOperations);
                    operationsLoaded = true;
                } catch (e) {
                    console.error('خطأ في تحليل بيانات العمليات:', e);
                }
            }
            
            if (storedSettings) {
                try {
                    window.settings = JSON.parse(storedSettings);
                } catch (e) {
                    console.error('خطأ في تحليل بيانات الإعدادات:', e);
                }
            }
            
            // إذا فشل تحميل أي من البيانات من localStorage، حاول استخدام النسخة الاحتياطية من sessionStorage
            if (!investorsLoaded || !investmentsLoaded || !operationsLoaded) {
                const backupInvestors = sessionStorage.getItem('investors_backup');
                const backupInvestments = sessionStorage.getItem('investments_backup');
                const backupOperations = sessionStorage.getItem('operations_backup');
                
                if (!investorsLoaded && backupInvestors) {
                    try {
                        window.investors = JSON.parse(backupInvestors);
                        console.log('تم استعادة بيانات المستثمرين من النسخة الاحتياطية');
                    } catch (e) {
                        console.error('خطأ في تحليل النسخة الاحتياطية للمستثمرين:', e);
                    }
                }
                
                if (!investmentsLoaded && backupInvestments) {
                    try {
                        window.investments = JSON.parse(backupInvestments);
                        console.log('تم استعادة بيانات الاستثمارات من النسخة الاحتياطية');
                    } catch (e) {
                        console.error('خطأ في تحليل النسخة الاحتياطية للاستثمارات:', e);
                    }
                }
                
                if (!operationsLoaded && backupOperations) {
                    try {
                        window.operations = JSON.parse(backupOperations);
                        console.log('تم استعادة بيانات العمليات من النسخة الاحتياطية');
                    } catch (e) {
                        console.error('خطأ في تحليل النسخة الاحتياطية للعمليات:', e);
                    }
                }
            }
            
            // تهيئة المصفوفات إذا لم تكن موجودة
            if (!window.investors) window.investors = [];
            if (!window.investments) window.investments = [];
            if (!window.operations) window.operations = [];
            if (!window.settings) window.settings = {
                monthlyProfitRate: 1.75,
                companyName: 'شركة الاستثمار العراقية',
                minInvestment: 1000000,
                profitDistributionPeriod: 'monthly',
                profitDistributionDay: 1,
                earlyWithdrawalFee: 0.5,
                maxPartialWithdrawal: 50,
                currency: 'IQD',
                acceptedCurrencies: ['IQD', 'USD']
            };
            
            console.log('تم تحميل البيانات بنجاح:', {
                investors: window.investors.length,
                investments: window.investments.length,
                operations: window.operations.length
            });
            
            // استدعاء الدالة الأصلية إذا كانت موجودة
            if (typeof window.originalLoadData === 'function') {
                window.originalLoadData();
            }
            
            return true;
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            
            // تهيئة المصفوفات بقيم فارغة في حالة الخطأ
            window.investors = [];
            window.investments = [];
            window.operations = [];
            window.settings = {
                monthlyProfitRate: 1.75,
                companyName: 'شركة الاستثمار العراقية',
                minInvestment: 1000000,
                profitDistributionPeriod: 'monthly',
                profitDistributionDay: 1,
                earlyWithdrawalFee: 0.5,
                maxPartialWithdrawal: 50,
                currency: 'IQD',
                acceptedCurrencies: ['IQD', 'USD']
            };
            
            createNotification('تحذير', 'حدث خطأ أثناء تحميل البيانات. تم تهيئة بيانات فارغة.', 'warning');
            
            return false;
        }
    };
    
    console.log('تم تحديث وظيفة تحميل البيانات');
}

// =========== تحسين تكامل Firebase ===========

// تحديث وظائف التكامل مع Firebase
function enhanceFirebaseIntegration() {
    // التأكد من وجود كائن firebaseApp
    if (!window.firebaseApp) {
        console.warn('كائن firebaseApp غير متوفر. تخطي تحسينات Firebase.');
        return;
    }
    
    // تحسين وظيفة مزامنة البيانات
    if (window.firebaseApp.syncData) {
        const originalSyncData = window.firebaseApp.syncData;
        
        window.firebaseApp.syncData = async function() {
            try {
                // استدعاء الوظيفة الأصلية
                const result = await originalSyncData.apply(this, arguments);
                
                // مزامنة إضافية بعد الحذف
                if (window.recentDeletedInvestors && window.recentDeletedInvestors.length > 0) {
                    try {
                        // إذا كان لدينا مستثمرين تم حذفهم مؤخرًا، تأكد من حذفهم من Firebase
                        for (const investorId of window.recentDeletedInvestors) {
                            // حاول إزالة المستثمر من Firebase إذا كان موجودًا
                            const currentUser = window.firebase.auth().currentUser;
                            if (currentUser) {
                                const investorRef = window.firebase.database()
                                    .ref(`users/${currentUser.uid}/data/investors`)
                                    .orderByChild('id')
                                    .equalTo(investorId);
                                
                                const snapshot = await investorRef.once('value');
                                if (snapshot.exists()) {
                                    // حذف المستثمر المحدد من Firebase
                                    await investorRef.remove();
                                    console.log(`تم حذف المستثمر ${investorId} من Firebase`);
                                }
                            }
                        }
                        
                        // تفريغ قائمة المستثمرين المحذوفين
                        window.recentDeletedInvestors = [];
                    } catch (error) {
                        console.error('خطأ في حذف المستثمرين من Firebase:', error);
                    }
                }
                
                return result;
            } catch (error) {
                console.error('خطأ في مزامنة البيانات:', error);
                return false;
            }
        };
    }
    
    // تسجيل حذف المستثمر في Firebase
    window.addInvestorToDeletedList = function(investorId) {
        if (!window.recentDeletedInvestors) {
            window.recentDeletedInvestors = [];
        }
        
        // إضافة معرف المستثمر إلى قائمة المحذوفين
        window.recentDeletedInvestors.push(investorId);
        
        // تخزين قائمة المستثمرين المحذوفين في sessionStorage للاستخدام بعد تحديث الصفحة
        try {
            const deletedList = JSON.stringify(window.recentDeletedInvestors);
            sessionStorage.setItem('recentDeletedInvestors', deletedList);
        } catch (error) {
            console.error('خطأ في تخزين قائمة المستثمرين المحذوفين:', error);
        }
    };
    
    // استعادة قائمة المستثمرين المحذوفين عند تحميل الصفحة
    const deletedListString = sessionStorage.getItem('recentDeletedInvestors');
    if (deletedListString) {
        try {
            window.recentDeletedInvestors = JSON.parse(deletedListString);
        } catch (error) {
            console.error('خطأ في تحليل قائمة المستثمرين المحذوفين:', error);
            window.recentDeletedInvestors = [];
        }
    } else {
        window.recentDeletedInvestors = [];
    }
    
    console.log('تم تحسين تكامل Firebase');
}

// ============ تطبيق الإصلاحات ============

// وظيفة تطبيق جميع الإصلاحات
function applyAllFixes() {
    console.log('جاري تطبيق إصلاحات نظام إدارة الاستثمار...');
    
    try {
        // تحديث وظائف التخزين والاسترجاع
        updateSaveDataFunction();
        updateLoadDataFunction();
        
        // إصلاح مشكلة حذف المستثمر
        fixDeleteInvestorIssue();
        
        // تحديث وظيفة تهيئة التطبيق وإزالة البيانات الوهمية
        updateInitializeApp();
        
        // تحسين تكامل Firebase
        enhanceFirebaseIntegration();
        
        // إضافة مستمع أحداث للتأكد من تطبيق الإصلاحات بعد تحميل الصفحة
        window.addEventListener('load', function() {
            // تأخير التنفيذ قليلاً للتأكد من تحميل جميع البيانات الأخرى
            setTimeout(function() {
                // تحديث وظيفة الحذف مرة أخرى (للتأكد من التطبيق)
                fixDeleteInvestorIssue();
                
                // تعديل وظيفة حذف المستثمر في Firebase إذا كانت موجودة
                enhanceFirebaseIntegration();
                
                console.log('تم تطبيق الإصلاحات بنجاح بعد تحميل الصفحة');
            }, 1000);
        });
        
        // تطبيق الإصلاحات على النسخة الحالية من الصفحة
        if (document.readyState === 'complete') {
            // تأخير التنفيذ قليلاً للتأكد من تحميل جميع البيانات الأخرى
            setTimeout(function() {
                // تحديث وظيفة الحذف مرة أخرى (للتأكد من التطبيق)
                fixDeleteInvestorIssue();
                console.log('تم تطبيق الإصلاحات على الصفحة الحالية');
            }, 1000);
        }
        
        console.log('تم تطبيق جميع الإصلاحات بنجاح');
        return true;
    } catch (error) {
        console.error('حدث خطأ أثناء تطبيق الإصلاحات:', error);
        return false;
    }
}

// تنفيذ الإصلاحات
applyAllFixes();

// تصدير الوظائف للاستخدام الخارجي
window.appFixes = {
    fixDeleteInvestorIssue,
    removeDummyData,
    updateInitializeApp,
    updateSaveDataFunction,
    updateLoadDataFunction,
    enhanceFirebaseIntegration,
    applyAllFixes
};