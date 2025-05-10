// investor-cards-firebase-fix.js

/**
 * إصلاح مشكلة مزامنة بطاقات المستثمرين مع Firebase
 * يحل مشكلة عدم توفر Firebase ومشكلة حفظ البطاقات في قاعدة البيانات
 */

// استبدال دالة التحقق من Firebase لاستخدام الطريقة الصحيحة
window.checkFirebaseAvailability = function() {
    // التحقق من وجود Firebase الأساسي
    if (typeof firebase === 'undefined') {
        console.warn("Firebase غير محمل");
        return false;
    }
    
    // التحقق من تهيئة Firebase
    if (!firebase.apps || firebase.apps.length === 0) {
        console.warn("Firebase غير مهيأ");
        return false;
    }
    
    // التحقق من وجود database
    try {
        const db = firebase.database();
        return db !== null && db !== undefined;
    } catch (error) {
        console.warn("Firebase database غير متاح:", error);
        return false;
    }
};

// إصلاح دالة المزامنة مع Firebase
window.syncCardsToFirebase = function() {
    if (!window.checkFirebaseAvailability()) {
        console.warn("Firebase غير متاح للمزامنة");
        createNotification('خطأ', 'Firebase غير متاح للمزامنة', 'danger');
        return;
    }
    
    // التحقق من أن المستخدم مسجل الدخول
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        console.warn("المستخدم غير مسجل الدخول");
        createNotification('خطأ', 'يجب تسجيل الدخول أولاً للمزامنة', 'danger');
        return;
    }
    
    try {
        // الحصول على مرجع قاعدة البيانات
        const db = firebase.database();
        const userId = currentUser.uid;
        
        // مسار البطاقات في قاعدة البيانات
        const cardsRef = db.ref(`users/${userId}/investorCards`);
        
        // تحديث البطاقات في Firebase
        cardsRef.set(investorCards)
            .then(() => {
                console.log("تمت مزامنة البطاقات مع Firebase بنجاح");
                createNotification('نجاح', 'تمت مزامنة البطاقات بنجاح', 'success');
            })
            .catch(error => {
                console.error("حدث خطأ أثناء مزامنة البطاقات مع Firebase:", error);
                createNotification('خطأ', 'حدث خطأ أثناء المزامنة: ' + error.message, 'danger');
            });
    } catch (error) {
        console.error("خطأ في الوصول إلى Firebase:", error);
        createNotification('خطأ', 'حدث خطأ في الوصول إلى Firebase', 'danger');
    }
};

// إصلاح دالة إعداد مزامنة البطاقات
window.setupFirebaseCardsSync = function() {
    if (!window.checkFirebaseAvailability()) {
        console.warn("Firebase غير متاح للمزامنة");
        return;
    }
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        console.warn("المستخدم غير مسجل الدخول");
        return;
    }
    
    try {
        const db = firebase.database();
        const userId = currentUser.uid;
        
        // الاستماع للتغييرات في بطاقات المستثمرين
        db.ref(`users/${userId}/investorCards`).on('value', 
            (snapshot) => {
                const firebaseCards = snapshot.val() || {};
                
                // دمج البطاقات الجديدة مع البطاقات المحلية
                for (const cardId in firebaseCards) {
                    if (!investorCards[cardId] || 
                        new Date(firebaseCards[cardId].updatedAt) > new Date(investorCards[cardId].updatedAt)) {
                        investorCards[cardId] = firebaseCards[cardId];
                    }
                }
                
                // حفظ البطاقات محلياً
                localStorage.setItem('investorCards', JSON.stringify(investorCards));
                
                // تحديث واجهة المستخدم
                if (typeof updateInvestorCardsUI === 'function') {
                    updateInvestorCardsUI();
                }
                
                console.log("تم تحديث البطاقات من Firebase");
            },
            (error) => {
                console.error("خطأ في الاستماع لتغييرات البطاقات:", error);
            }
        );
    } catch (error) {
        console.error("خطأ في إعداد مزامنة البطاقات:", error);
    }
};

// إصلاح دالة حفظ البطاقة في قاعدة البيانات
window.saveCardToDatabase = function(card) {
    if (!cardSettings.enableDatabaseSync) {
        return Promise.resolve(card);
    }
    
    return new Promise((resolve, reject) => {
        if (!window.checkFirebaseAvailability()) {
            console.warn("Firebase غير متاح لحفظ البيانات");
            return resolve(card);
        }
        
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.warn("المستخدم غير مسجل الدخول");
            return resolve(card);
        }
        
        try {
            const db = firebase.database();
            const userId = currentUser.uid;
            const cardRef = db.ref(`users/${userId}/investorCards/${card.id}`);
            
            // إضافة معلومات المستثمر الأساسية
            const investor = investors.find(inv => inv.id === card.investorId);
            if (investor) {
                card.investorName = investor.name;
                card.investorPhone = investor.phone;
                card.investorEmail = investor.email || '';
            }
            
            // إضافة إجمالي الاستثمار والأرباح للبطاقة
            const investorData = getInvestorData(card.investorId);
            if (investorData) {
                card.totalInvestment = investorData.totalInvestment;
                card.totalProfit = investorData.totalProfit;
                card.paidProfit = investorData.paidProfit;
                card.dueProfit = investorData.dueProfit;
            }
            
            // إضافة تاريخ آخر تحديث
            card.updatedAt = new Date().toISOString();
            
            // حفظ البطاقة في قاعدة البيانات
            cardRef.set(card)
                .then(() => {
                    console.log(`تم حفظ البطاقة ${card.id} في قاعدة البيانات بنجاح`);
                    resolve(card);
                })
                .catch(error => {
                    console.error("حدث خطأ أثناء حفظ البطاقة في قاعدة البيانات:", error);
                    reject(error);
                });
        } catch (error) {
            console.error("خطأ في الوصول إلى Firebase:", error);
            reject(error);
        }
    });
};

// إصلاح دالة المزامنة للبطاقات الموجودة
window.syncInvestorCardsWithFirebase = function() {
    if (!cardSettings.enableDatabaseSync) {
        createNotification('تنبيه', 'المزامنة مع قاعدة البيانات غير مفعلة. يرجى تفعيلها أولاً.', 'warning');
        return;
    }
    
    if (!window.checkFirebaseAvailability()) {
        createNotification('خطأ', 'Firebase غير متاح للمزامنة', 'danger');
        return;
    }
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        createNotification('خطأ', 'يجب تسجيل الدخول أولاً للمزامنة', 'danger');
        return;
    }
    
    // استدعاء دالة تحديث جميع البطاقات
    updateAllCardsInDatabase();
};

// استبدال دالة تحديث جميع البطاقات
window.updateAllCardsInDatabase = function() {
    if (!cardSettings.enableDatabaseSync) {
        createNotification('تنبيه', 'المزامنة مع قاعدة البيانات غير مفعلة. يرجى تفعيلها أولاً.', 'warning');
        return;
    }
    
    if (!window.checkFirebaseAvailability()) {
        createNotification('خطأ', 'Firebase غير متاح للمزامنة', 'danger');
        return;
    }
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        createNotification('خطأ', 'يجب تسجيل الدخول أولاً للمزامنة', 'danger');
        return;
    }
    
    const cardsArray = Object.values(investorCards);
    if (cardsArray.length === 0) {
        createNotification('تنبيه', 'لا توجد بطاقات للتحديث', 'warning');
        return;
    }
    
    let updatedCount = 0;
    let promises = [];
    
    cardsArray.forEach(card => {
        // تحديث معلومات الحساب والتعاملات
        updateCardAccountInfo(card.investorId);
        
        // تحديث البطاقة في قاعدة البيانات
        promises.push(
            saveCardToDatabase(card)
                .then(() => {
                    updatedCount++;
                })
                .catch(error => {
                    console.error(`فشل تحديث البطاقة ${card.id}:`, error);
                })
        );
    });
    
    Promise.all(promises)
        .then(() => {
            createNotification('نجاح', `تم تحديث ${updatedCount} بطاقة في قاعدة البيانات`, 'success');
        })
        .catch(error => {
            console.error('حدث خطأ أثناء تحديث البطاقات:', error);
            createNotification('خطأ', 'حدث خطأ أثناء تحديث البطاقات', 'danger');
        });
};

// إصلاح دالة تحديث البطاقات من قاعدة البيانات
window.refreshCardsFromDatabase = function() {
    if (!cardSettings.enableDatabaseSync) {
        createNotification('تنبيه', 'المزامنة مع قاعدة البيانات غير مفعلة. يرجى تفعيلها أولاً.', 'warning');
        return;
    }
    
    if (!window.checkFirebaseAvailability()) {
        createNotification('خطأ', 'Firebase غير متاح للمزامنة', 'danger');
        return;
    }
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        createNotification('خطأ', 'يجب تسجيل الدخول أولاً للمزامنة', 'danger');
        return;
    }
    
    try {
        const db = firebase.database();
        const userId = currentUser.uid;
        
        db.ref(`users/${userId}/investorCards`).once('value')
            .then(snapshot => {
                const dbCards = snapshot.val() || {};
                
                // تحديث البطاقات المحلية بالبيانات من قاعدة البيانات
                mergeCardsFromDatabase(dbCards);
                
                // تحديث واجهة المستخدم
                updateInvestorCardsTable();
                
                createNotification('نجاح', 'تم تحديث البطاقات من قاعدة البيانات بنجاح', 'success');
            })
            .catch(error => {
                console.error('حدث خطأ أثناء تحديث البطاقات من قاعدة البيانات:', error);
                createNotification('خطأ', 'حدث خطأ أثناء تحديث البطاقات: ' + error.message, 'danger');
            });
    } catch (error) {
        console.error('خطأ في الوصول إلى Firebase:', error);
        createNotification('خطأ', 'حدث خطأ في الوصول إلى Firebase', 'danger');
    }
};

// تشغيل الإصلاحات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تطبيق إصلاحات مزامنة بطاقات المستثمرين مع Firebase');
    
    // الاستماع لتغييرات حالة المصادقة
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                console.log('المستخدم مسجل الدخول:', user.email);
                
                // إعداد مزامنة البطاقات عند تسجيل الدخول
                if (typeof setupFirebaseCardsSync === 'function') {
                    setupFirebaseCardsSync();
                }
            } else {
                console.log('المستخدم غير مسجل الدخول');
            }
        });
    }
});

// إصلاح دالة تهيئة نظام البطاقات
const originalInitInvestorCardSystem = window.initInvestorCardSystem || function() {};
window.initInvestorCardSystem = function() {
    // استدعاء الدالة الأصلية
    originalInitInvestorCardSystem();
    
    // تأكد من تحميل Firebase قبل محاولة المزامنة
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // الانتظار حتى يتم التحقق من حالة المصادقة
        firebase.auth().onAuthStateChanged(function(user) {
            if (user && cardSettings.enableDatabaseSync) {
                setupFirebaseCardsSync();
            }
        });
    }
    
    console.log("تم تهيئة نظام بطاقات المستثمرين مع إصلاحات Firebase");
};

console.log('تم تحميل إصلاحات مزامنة بطاقات المستثمرين مع Firebase');