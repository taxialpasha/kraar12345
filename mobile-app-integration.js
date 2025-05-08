// mobile-app-integration.js
// واجهة برمجية للتكامل مع التطبيق المحمول

class MobileAppAPI {
    constructor() {
        this.baseUrl = 'https://investment-app.com/api';
        this.version = 'v1';
    }

    // مصادقة المستخدم باستخدام البطاقة
    async authenticateWithCard(cardNumber, pin) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/auth/card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardNumber,
                    pin,
                    deviceInfo: await this.getDeviceInfo()
                })
            });

            if (!response.ok) {
                throw new Error('فشل في المصادقة');
            }

            const data = await response.json();
            return {
                success: true,
                token: data.token,
                investor: data.investor,
                card: data.card
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // جلب تفاصيل البطاقة
    async getCardDetails(cardId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/cards/${cardId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب تفاصيل البطاقة');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching card details:', error);
            return null;
        }
    }

    // جلب معلومات المستثمر
    async getInvestorProfile(investorId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/investors/${investorId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب معلومات المستثمر');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching investor profile:', error);
            return null;
        }
    }

    // جلب الاستثمارات
    async getInvestments(investorId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/investments?investorId=${investorId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب الاستثمارات');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching investments:', error);
            return [];
        }
    }

    // جلب المعاملات
    async getTransactions(cardId, token, limit = 50) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/transactions?cardId=${cardId}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب المعاملات');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }

    // حساب الأرباح المستحقة
    async getDueProfits(investorId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/profits/due?investorId=${investorId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في حساب الأرباح');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching due profits:', error);
            return null;
        }
    }

    // طلب سحب
    async requestWithdrawal(data, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/withdrawals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('فشل في طلب السحب');
            }

            return await response.json();
        } catch (error) {
            console.error('Error requesting withdrawal:', error);
            return null;
        }
    }

    // إرسال الإشعارات
    async registerForNotifications(investorId, token, fcmToken) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/notifications/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    investorId,
                    fcmToken,
                    platform: this.getPlatform()
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Error registering for notifications:', error);
            return false;
        }
    }

    // تحديث إعدادات البطاقة
    async updateCardSettings(cardId, settings, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/cards/${cardId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error('فشل في تحديث الإعدادات');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating card settings:', error);
            return null;
        }
    }

    // تغيير PIN البطاقة
    async changeCardPIN(cardId, oldPIN, newPIN, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/cards/${cardId}/pin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPIN,
                    newPIN
                })
            });

            if (!response.ok) {
                throw new Error('فشل في تغيير PIN');
            }

            return true;
        } catch (error) {
            console.error('Error changing PIN:', error);
            return false;
        }
    }

    // إبلاغ عن فقدان البطاقة
    async reportLostCard(cardId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/cards/${cardId}/report-lost`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في إبلاغ عن فقدان البطاقة');
            }

            return true;
        } catch (error) {
            console.error('Error reporting lost card:', error);
            return false;
        }
    }

    // جلب كشف الحساب
    async getStatement(investorId, startDate, endDate, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/statements?investorId=${investorId}&start=${startDate}&end=${endDate}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب كشف الحساب');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching statement:', error);
            return null;
        }
    }

    // حساب العائد المتوقع
    async calculateExpectedReturns(amount, period, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/calculate/returns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount,
                    period
                })
            });

            if (!response.ok) {
                throw new Error('فشل في حساب العائد');
            }

            return await response.json();
        } catch (error) {
            console.error('Error calculating returns:', error);
            return null;
        }
    }

    // معلومات الجهاز
    async getDeviceInfo() {
        return {
            platform: this.getPlatform(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // منصة الجهاز
    getPlatform() {
        const userAgent = navigator.userAgent;
        
        if (/android/i.test(userAgent)) {
            return 'android';
        }
        
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            return 'ios';
        }
        
        return 'web';
    }

    // معالجة رمز QR
    async processQRCode(qrData) {
        try {
            const data = JSON.parse(qrData);
            
            // التحقق من صحة البيانات
            if (!data.cardId || !data.investorId) {
                throw new Error('بيانات QR غير صالحة');
            }
            
            // جلب تفاصيل البطاقة
            const cardDetails = await this.getCardDetails(data.cardId, 'guest-token');
            
            if (!cardDetails) {
                throw new Error('البطاقة غير موجودة');
            }
            
            return {
                success: true,
                cardData: data,
                cardDetails,
                deepLink: data.appLinks?.deepLink
            };
        } catch (error) {
            console.error('Error processing QR code:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تحويل الرصيد
    async transferBalance(fromCardId, toCardId, amount, pin, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/transfers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromCardId,
                    toCardId,
                    amount,
                    pin
                })
            });

            if (!response.ok) {
                throw new Error('فشل في التحويل');
            }

            return await response.json();
        } catch (error) {
            console.error('Error transferring balance:', error);
            return null;
        }
    }

    // جلب الإشعارات
    async getNotifications(investorId, token, unreadOnly = false) {
        try {
            const url = `${this.baseUrl}/${this.version}/notifications?investorId=${investorId}${unreadOnly ? '&unread=true' : ''}`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في جلب الإشعارات');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }

    // تحديث حالة الإشعار
    async markNotificationAsRead(notificationId, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    // تحميل كشف حساب PDF
    async downloadStatement(investorId, period, token) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.version}/statements/download?investorId=${investorId}&period=${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('فشل في تحميل كشف الحساب');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `statement-${period}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error downloading statement:', error);
            return false;
        }
    }
}

// إنشاء مثيل من API
const mobileAPI = new MobileAppAPI();

// تصدير للاستخدام العام
window.mobileAPI = mobileAPI;

// مثال على الاستخدام في التطبيق المحمول
/*
// مسح QR والحصول على معلومات البطاقة
const qrData = await scanQRCode(); // دالة مسح QR في التطبيق
const result = await mobileAPI.processQRCode(qrData);

if (result.success) {
    // مصادقة المستخدم
    const authResult = await mobileAPI.authenticateWithCard(
        result.cardData.cardNumber,
        userPin
    );
    
    if (authResult.success) {
        // جلب تفاصيل الاستثمار
        const investments = await mobileAPI.getInvestments(
            authResult.investor.id,
            authResult.token
        );
        
        // عرض المعلومات في التطبيق
        displayInvestorDashboard(authResult.investor, investments);
    }
}
*/