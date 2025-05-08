// firebase-card-integration.js
// تكامل Firebase المتقدم لنظام البطاقات

class CardFirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.messaging = null;
        this.currentUser = null;
        this.listeners = [];
    }

    // تهيئة Firebase
    async initialize() {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.database();
            this.auth = firebase.auth();
            this.storage = firebase.storage();
            this.messaging = firebase.messaging();

            // الاستماع لحالة المصادقة
            this.auth.onAuthStateChanged(user => {
                this.currentUser = user;
                if (user) {
                    this.setupCardListeners();
                    this.setupNotifications();
                }
            });

            return true;
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            return false;
        }
    }

    // إعداد مستمعي البطاقات
    setupCardListeners() {
        // الاستماع لتغييرات البطاقات
        const cardsRef = this.db.ref('cards');
        
        const cardsListener = cardsRef.on('value', snapshot => {
            const cards = snapshot.val();
            if (cards) {
                this.updateLocalCards(cards);
            }
        });

        this.listeners.push({ ref: cardsRef, listener: cardsListener });

        // الاستماع لمعاملات البطاقات
        const transactionsRef = this.db.ref('cardTransactions');
        
        const transListener = transactionsRef.on('child_added', snapshot => {
            const transaction = snapshot.val();
            this.handleNewTransaction(transaction);
        });

        this.listeners.push({ ref: transactionsRef, listener: transListener });
    }

    // إعداد الإشعارات
    async setupNotifications() {
        try {
            // طلب إذن الإشعارات
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // الحصول على رمز FCM
                const token = await this.messaging.getToken();
                if (token) {
                    // حفظ الرمز في قاعدة البيانات
                    await this.db.ref(`users/${this.currentUser.uid}/fcmToken`).set(token);
                }

                // الاستماع للرسائل
                this.messaging.onMessage(payload => {
                    this.showNotification(payload);
                });
            }
        } catch (error) {
            console.error('Error setting up notifications:', error);
        }
    }

    // حفظ بطاقة جديدة
    async saveCard(card) {
        try {
            const cardRef = this.db.ref(`cards/${card.id}`);
            await cardRef.set({
                ...card,
                createdBy: this.currentUser.uid,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                lastModified: firebase.database.ServerValue.TIMESTAMP
            });

            // حفظ في سجل المستثمر
            const investorCardRef = this.db.ref(`investors/${card.investorId}/cards/${card.id}`);
            await investorCardRef.set(true);

            // إنشاء رمز QR وحفظه
            const qrData = await this.generateCardQRData(card);
            await this.saveCardQR(card.id, qrData);

            return true;
        } catch (error) {
            console.error('Error saving card:', error);
            return false;
        }
    }

    // إنشاء بيانات QR للبطاقة
    async generateCardQRData(card) {
        const investor = investors.find(inv => inv.id === card.investorId);
        const totalInvestment = getTotalInvestment(card.investorId);
        const totalProfit = getTotalProfits(card.investorId);

        const qrData = {
            version: '1.0',
            cardId: card.id,
            cardNumber: card.number,
            investorId: card.investorId,
            investorName: investor?.name,
            cardType: card.type,
            expiryDate: card.expiry,
            status: card.status,
            issuerBank: 'بنك الاستثمار العراقي',
            timestamp: new Date().toISOString(),
            
            // معلومات الاستثمار
            investmentData: {
                totalInvestment,
                totalProfit,
                activeInvestments: investments.filter(inv => 
                    inv.investorId === card.investorId && inv.status === 'active'
                ).length
            },
            
            // معلومات الأمان
            security: {
                checksum: this.generateChecksum(card),
                encryptedData: await this.encryptSensitiveData(card),
                publicKey: await this.getPublicKey()
            },
            
            // روابط التطبيق
            appLinks: {
                deepLink: `investmentapp://card/${card.id}`,
                webLink: `https://investment-app.com/cards/${card.id}`,
                dynamicLink: await this.createDynamicLink(card.id)
            }
        };

        // تحويل إلى JSON مضغوط
        return JSON.stringify(qrData);
    }

    // حفظ QR البطاقة
    async saveCardQR(cardId, qrData) {
        try {
            // إنشاء صورة QR
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            
            // استخدام مكتبة QR Code
            const qr = qrcode(0, 'H');
            qr.addData(qrData);
            qr.make();
            
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            const cellSize = size / qr.getModuleCount();
            
            // رسم QR Code
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            
            for (let row = 0; row < qr.getModuleCount(); row++) {
                for (let col = 0; col < qr.getModuleCount(); col++) {
                    ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#ffffff';
                    ctx.fillRect(
                        col * cellSize,
                        row * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }

            // تحويل إلى Blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            
            // رفع إلى Firebase Storage
            const storageRef = this.storage.ref(`card-qr/${cardId}.png`);
            await storageRef.put(blob);
            
            // الحصول على URL
            const downloadURL = await storageRef.getDownloadURL();
            
            // حفظ URL في قاعدة البيانات
            await this.db.ref(`cards/${cardId}/qrUrl`).set(downloadURL);
            
            return downloadURL;
        } catch (error) {
            console.error('Error saving card QR:', error);
            return null;
        }
    }

    // قراءة بطاقة من QR
    async readCardFromQR(qrData) {
        try {
            const data = JSON.parse(qrData);
            
            // التحقق من الإصدار
            if (data.version !== '1.0') {
                throw new Error('إصدار QR غير مدعوم');
            }
            
            // التحقق من صحة البيانات
            const isValid = await this.verifyCardData(data);
            if (!isValid) {
                throw new Error('بيانات البطاقة غير صالحة');
            }
            
            // جلب بيانات البطاقة من Firebase
            const cardSnapshot = await this.db.ref(`cards/${data.cardId}`).once('value');
            const card = cardSnapshot.val();
            
            if (!card) {
                throw new Error('البطاقة غير موجودة');
            }
            
            // جلب بيانات المستثمر
            const investorSnapshot = await this.db.ref(`investors/${card.investorId}`).once('value');
            const investor = investorSnapshot.val();
            
            // جلب المعاملات الأخيرة
            const transactionsSnapshot = await this.db.ref(`cardTransactions/${data.cardId}`)
                .orderByChild('timestamp')
                .limitToLast(10)
                .once('value');
            
            const transactions = [];
            transactionsSnapshot.forEach(childSnapshot => {
                transactions.push(childSnapshot.val());
            });
            
            return {
                card,
                investor,
                transactions,
                qrData: data
            };
        } catch (error) {
            console.error('Error reading card from QR:', error);
            throw error;
        }
    }

    // التحقق من صحة بيانات البطاقة
    async verifyCardData(data) {
        try {
            // التحقق من التوقيع
            if (data.security?.checksum) {
                const cardSnapshot = await this.db.ref(`cards/${data.cardId}`).once('value');
                const card = cardSnapshot.val();
                
                if (card) {
                    const calculatedChecksum = this.generateChecksum(card);
                    if (calculatedChecksum !== data.security.checksum) {
                        return false;
                    }
                }
            }
            
            // التحقق من التاريخ
            const qrDate = new Date(data.timestamp);
            const now = new Date();
            const diffMinutes = (now - qrDate) / (1000 * 60);
            
            // رفض إذا كان QR أقدم من 5 دقائق
            if (diffMinutes > 5) {
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verifying card data:', error);
            return false;
        }
    }

    // تسجيل معاملة جديدة
    async recordTransaction(cardId, transaction) {
        try {
            const transactionRef = this.db.ref(`cardTransactions/${cardId}`).push();
            
            await transactionRef.set({
                ...transaction,
                id: transactionRef.key,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                processedBy: this.currentUser.uid
            });
            
            // تحديث إحصائيات البطاقة
            await this.updateCardStats(cardId, transaction);
            
            // إرسال إشعار للمستثمر
            await this.sendTransactionNotification(cardId, transaction);
            
            return transactionRef.key;
        } catch (error) {
            console.error('Error recording transaction:', error);
            return null;
        }
    }

    // تحديث إحصائيات البطاقة
    async updateCardStats(cardId, transaction) {
        try {
            const statsRef = this.db.ref(`cardStats/${cardId}`);
            
            await statsRef.transaction(currentStats => {
                if (!currentStats) {
                    currentStats = {
                        totalTransactions: 0,
                        totalAmount: 0,
                        lastTransaction: null
                    };
                }
                
                currentStats.totalTransactions++;
                currentStats.totalAmount += transaction.amount;
                currentStats.lastTransaction = new Date().toISOString();
                
                return currentStats;
            });
        } catch (error) {
            console.error('Error updating card stats:', error);
        }
    }

    // إرسال إشعار للمستثمر
    async sendTransactionNotification(cardId, transaction) {
        try {
            // جلب بيانات البطاقة
            const cardSnapshot = await this.db.ref(`cards/${cardId}`).once('value');
            const card = cardSnapshot.val();
            
            if (!card) return;
            
            // جلب رمز FCM للمستثمر
            const tokenSnapshot = await this.db.ref(`investors/${card.investorId}/fcmToken`).once('value');
            const fcmToken = tokenSnapshot.val();
            
            if (!fcmToken) return;
            
            // إعداد الإشعار
            const notification = {
                title: 'معاملة جديدة',
                body: `تمت معاملة بقيمة ${formatCurrency(transaction.amount)} على بطاقتك`,
                icon: '/icon.png',
                click_action: `https://investment-app.com/cards/${cardId}`,
                data: {
                    cardId,
                    transactionId: transaction.id,
                    type: 'transaction'
                }
            };
            
            // إرسال الإشعار عبر FCM
            const response = await fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `key=${process.env.FCM_SERVER_KEY}`
                },
                body: JSON.stringify({
                    to: fcmToken,
                    notification,
                    data: notification.data
                })
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }

    // مراقبة حالة البطاقة
    async monitorCardStatus(cardId) {
        try {
            const cardRef = this.db.ref(`cards/${cardId}/status`);
            
            cardRef.on('value', snapshot => {
                const status = snapshot.val();
                
                // تحديث واجهة المستخدم
                const cardElement = document.getElementById(`card-${cardId}`);
                if (cardElement) {
                    if (status === 'suspended') {
                        cardElement.classList.add('suspended');
                    } else {
                        cardElement.classList.remove('suspended');
                    }
                }
                
                // إشعار المستخدم بتغيير الحالة
                if (status === 'suspended') {
                    createNotification(
                        'تم إيقاف البطاقة',
                        `تم إيقاف البطاقة ${cardId} مؤقتاً`,
                        'warning'
                    );
                }
            });
        } catch (error) {
            console.error('Error monitoring card status:', error);
        }
    }

    // إنشاء checksum للبطاقة
    generateChecksum(card) {
        const data = `${card.id}-${card.number}-${card.investorId}-${card.type}`;
        
        // حساب checksum بسيط (في الإنتاج، استخدم خوارزمية أقوى)
        let checksum = 0;
        for (let i = 0; i < data.length; i++) {
            checksum = ((checksum << 5) - checksum) + data.charCodeAt(i);
            checksum = checksum & checksum;
        }
        
        return Math.abs(checksum).toString(16);
    }

    // تشفير البيانات الحساسة
    async encryptSensitiveData(card) {
        // في الإنتاج، استخدم مكتبة تشفير حقيقية
        const sensitiveData = {
            cvv: Math.floor(Math.random() * 900) + 100,
            pin: Math.floor(Math.random() * 9000) + 1000
        };
        
        // تشفير وهمي للتوضيح
        return btoa(JSON.stringify(sensitiveData));
    }

    // الحصول على المفتاح العام
    async getPublicKey() {
        // في الإنتاج، استخدم مفاتيح RSA حقيقية
        return 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...';
    }

    // إنشاء رابط ديناميكي
    async createDynamicLink(cardId) {
        try {
            const link = `https://investment-app.com/cards/${cardId}`;
            
            // استخدام Firebase Dynamic Links
            const dynamicLink = await firebase.dynamicLinks().createLink({
                link: link,
                domainUriPrefix: 'https://investmentapp.page.link',
                android: {
                    packageName: 'com.investment.app',
                    minimumVersion: '1.0.0'
                },
                ios: {
                    bundleId: 'com.investment.app',
                    minimumVersion: '1.0.0'
                },
                social: {
                    title: 'بطاقة الاستثمار',
                    description: 'عرض تفاصيل بطاقة الاستثمار',
                    imageUrl: 'https://investment-app.com/card-preview.png'
                }
            });
            
            return dynamicLink.url;
        } catch (error) {
            console.error('Error creating dynamic link:', error);
            return null;
        }
    }

    // تنظيف المستمعين
    cleanup() {
        this.listeners.forEach(({ ref, listener }) => {
            ref.off('value', listener);
        });
        this.listeners = [];
    }
}

// إنشاء مثيل من مدير Firebase
const cardFirebaseManager = new CardFirebaseManager();

// تهيئة النظام عند التحميل
document.addEventListener('DOMContentLoaded', async () => {
    await cardFirebaseManager.initialize();
});

// تصدير المدير للاستخدام العام
window.cardFirebaseManager = cardFirebaseManager;