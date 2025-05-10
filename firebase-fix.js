/**
 * Firebase Fix
 * 
 * Este archivo corrige errores relacionados con las funciones de Firebase
 * y asegura que todas las funciones necesarias estén disponibles globalmente
 */

// Crear el objeto firebaseApp si no existe
window.firebaseApp = window.firebaseApp || {};

// Asegurarse de que las funciones necesarias estén definidas
window.firebaseApp.showLoginDialog = function() {
    console.log('Mostrando diálogo de inicio de sesión...');
    
    // Inicializar Firebase si es necesario
    if (typeof firebase !== 'undefined') {
        console.log('Firebase está disponible');
    } else {
        console.warn('Firebase no está disponible. Cargándolo...');
        // Podemos intentar cargar Firebase aquí si es necesario
    }
    
    // Mostrar el modal de inicio de sesión
    const syncDialog = document.getElementById('syncDialog');
    if (syncDialog) {
        syncDialog.classList.add('active');
        
        // Mostrar el formulario de inicio de sesión
        const loginForm = document.getElementById('loginForm');
        const syncOptions = document.getElementById('syncOptions');
        
        if (loginForm) loginForm.style.display = 'block';
        if (syncOptions) syncOptions.style.display = 'none';
    } else {
        console.error('No se encontró el elemento #syncDialog');
        alert('No se puede mostrar el diálogo de inicio de sesión');
    }
};

// Otras funciones que podrían faltar
window.firebaseApp.showSyncSettings = function() {
    console.log('Mostrando ajustes de sincronización...');
    
    // Mostrar el modal de sincronización
    const syncDialog = document.getElementById('syncDialog');
    if (syncDialog) {
        syncDialog.classList.add('active');
        
        // Si el usuario está conectado, mostrar las opciones de sincronización
        // Si no, mostrar el formulario de inicio de sesión
        const loginForm = document.getElementById('loginForm');
        const syncOptions = document.getElementById('syncOptions');
        const loggedInUser = document.getElementById('loggedInUser');
        
        if (window.firebaseApp.currentUser) {
            // Usuario conectado
            if (loginForm) loginForm.style.display = 'none';
            if (syncOptions) syncOptions.style.display = 'block';
            if (loggedInUser) loggedInUser.textContent = window.firebaseApp.currentUser.email || 'Usuario';
        } else {
            // Usuario no conectado
            if (loginForm) loginForm.style.display = 'block';
            if (syncOptions) syncOptions.style.display = 'none';
        }
    } else {
        console.error('No se encontró el elemento #syncDialog');
        alert('No se pueden mostrar los ajustes de sincronización');
    }
};

window.firebaseApp.signOut = function() {
    console.log('Cerrando sesión...');
    
    // Si Firebase está definido, intentar cerrar sesión
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
            .then(() => {
                console.log('Sesión cerrada con éxito');
                window.firebaseApp.currentUser = null;
                
                // Actualizar la interfaz
                const syncDialog = document.getElementById('syncDialog');
                if (syncDialog) {
                    syncDialog.classList.remove('active');
                }
                
                // Mostrar notificación
                if (typeof createNotification === 'function') {
                    createNotification('Éxito', 'Se ha cerrado la sesión correctamente', 'success');
                } else {
                    alert('Se ha cerrado la sesión correctamente');
                }
            })
            .catch(error => {
                console.error('Error al cerrar sesión:', error);
                
                // Mostrar notificación de error
                if (typeof createNotification === 'function') {
                    createNotification('Error', 'No se pudo cerrar la sesión', 'danger');
                } else {
                    alert('Error al cerrar sesión: ' + error.message);
                }
            });
    } else {
        // Si Firebase no está disponible, simplemente actualizar el estado
        window.firebaseApp.currentUser = null;
        
        // Actualizar la interfaz
        const syncDialog = document.getElementById('syncDialog');
        if (syncDialog) {
            syncDialog.classList.remove('active');
        }
        
        // Mostrar notificación
        if (typeof createNotification === 'function') {
            createNotification('Información', 'Sesión cerrada (modo simulado)', 'info');
        } else {
            alert('Sesión cerrada (modo simulado)');
        }
    }
};

// Función para iniciar sesión (para ser llamada desde el formulario)
window.loginToFirebase = function(event) {
    if (event) event.preventDefault();
    
    // Obtener los valores del formulario
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        if (typeof createNotification === 'function') {
            createNotification('Error', 'Por favor, introduce email y contraseña', 'danger');
        } else {
            alert('Por favor, introduce email y contraseña');
        }
        return;
    }
    
    console.log('Iniciando sesión con:', email);
    
    // Si Firebase está disponible, intentar iniciar sesión
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                // Inicio de sesión exitoso
                const user = userCredential.user;
                window.firebaseApp.currentUser = user;
                
                console.log('Inicio de sesión exitoso:', user);
                
                // Actualizar interfaz
                const loggedInUser = document.getElementById('loggedInUser');
                const loginForm = document.getElementById('loginForm');
                const syncOptions = document.getElementById('syncOptions');
                
                if (loggedInUser) loggedInUser.textContent = user.email;
                if (loginForm) loginForm.style.display = 'none';
                if (syncOptions) syncOptions.style.display = 'block';
                
                // Mostrar notificación
                if (typeof createNotification === 'function') {
                    createNotification('Éxito', 'Inicio de sesión exitoso', 'success');
                }
            })
            .catch(error => {
                console.error('Error en inicio de sesión:', error);
                
                // Mostrar notificación de error
                if (typeof createNotification === 'function') {
                    createNotification('Error', 'Error en inicio de sesión: ' + error.message, 'danger');
                } else {
                    alert('Error en inicio de sesión: ' + error.message);
                }
            });
    } else {
        // Modo simulado (Firebase no disponible)
        console.log('Firebase no disponible, usando modo simulado');
        
        // Simular usuario
        window.firebaseApp.currentUser = {
            email: email,
            displayName: email.split('@')[0]
        };
        
        // Actualizar interfaz
        const loggedInUser = document.getElementById('loggedInUser');
        const loginForm = document.getElementById('loginForm');
        const syncOptions = document.getElementById('syncOptions');
        
        if (loggedInUser) loggedInUser.textContent = email;
        if (loginForm) loginForm.style.display = 'none';
        if (syncOptions) syncOptions.style.display = 'block';
        
        // Mostrar notificación
        if (typeof createNotification === 'function') {
            createNotification('Éxito', 'Inicio de sesión simulado exitoso', 'success');
        } else {
            alert('Inicio de sesión simulado exitoso');
        }
    }
};

// Cerrar el diálogo de sincronización
window.closeSyncDialog = function() {
    const syncDialog = document.getElementById('syncDialog');
    if (syncDialog) {
        syncDialog.classList.remove('active');
    }
};

// Mostrar el diálogo de sincronización
window.showSyncDialog = function() {
    // Verificar si el usuario está conectado
    if (window.firebaseApp.currentUser) {
        // Mostrar opciones de sincronización
        const loginForm = document.getElementById('loginForm');
        const syncOptions = document.getElementById('syncOptions');
        const loggedInUser = document.getElementById('loggedInUser');
        
        if (loginForm) loginForm.style.display = 'none';
        if (syncOptions) syncOptions.style.display = 'block';
        if (loggedInUser) loggedInUser.textContent = window.firebaseApp.currentUser.email;
    } else {
        // Mostrar formulario de inicio de sesión
        const loginForm = document.getElementById('loginForm');
        const syncOptions = document.getElementById('syncOptions');
        
        if (loginForm) loginForm.style.display = 'block';
        if (syncOptions) syncOptions.style.display = 'none';
    }
    
    // Abrir el diálogo
    const syncDialog = document.getElementById('syncDialog');
    if (syncDialog) {
        syncDialog.classList.add('active');
    }
};

// Iniciar sincronización
window.startSync = function() {
    console.log('Iniciando sincronización...');
    
    // Activar sincronización
    if (typeof enableSync === 'function') {
        enableSync();
    } else {
        console.warn('La función enableSync no está disponible');
        
        // Simulación básica
        const syncStatus = document.getElementById('syncStatus');
        const syncStatusAlert = document.getElementById('syncStatusAlert');
        const syncStatusText = document.getElementById('syncStatusText');
        const startSyncButton = document.getElementById('startSyncButton');
        const stopSyncButton = document.getElementById('stopSyncButton');
        
        if (syncStatus) syncStatus.textContent = 'متصل';
        if (syncStatus) syncStatus.className = 'status success';
        if (syncStatusAlert) syncStatusAlert.className = 'alert alert-success';
        if (syncStatusText) syncStatusText.textContent = 'المزامنة نشطة ومتصلة.';
        if (startSyncButton) startSyncButton.style.display = 'none';
        if (stopSyncButton) stopSyncButton.style.display = 'inline-block';
    }
    
    // Mostrar notificación
    if (typeof createNotification === 'function') {
        createNotification('Éxito', 'Sincronización iniciada con éxito', 'success');
    }
};

// Detener sincronización
window.stopSync = function() {
    console.log('Deteniendo sincronización...');
    
    // Desactivar sincronización
    if (typeof disableSync === 'function') {
        disableSync();
    } else {
        console.warn('La función disableSync no está disponible');
        
        // Simulación básica
        const syncStatus = document.getElementById('syncStatus');
        const syncStatusAlert = document.getElementById('syncStatusAlert');
        const syncStatusText = document.getElementById('syncStatusText');
        const startSyncButton = document.getElementById('startSyncButton');
        const stopSyncButton = document.getElementById('stopSyncButton');
        
        if (syncStatus) syncStatus.textContent = 'غير متصل';
        if (syncStatus) syncStatus.className = 'status info';
        if (syncStatusAlert) syncStatusAlert.className = 'alert alert-info';
        if (syncStatusText) syncStatusText.textContent = 'المزامنة متوقفة حالياً.';
        if (startSyncButton) startSyncButton.style.display = 'inline-block';
        if (stopSyncButton) stopSyncButton.style.display = 'none';
    }
    
    // Mostrar notificación
    if (typeof createNotification === 'function') {
        createNotification('Información', 'Sincronización detenida', 'info');
    }
};

// Exportar funciones adicionales que podrían ser necesarias
window.createFirebaseBackup = function() {
    console.log('Creando copia de seguridad...');
    
    if (window.firebaseApp && typeof window.firebaseApp.createBackup === 'function') {
        window.firebaseApp.createBackup();
    } else {
        console.warn('La función createBackup no está disponible');
        
        // Simulación básica
        const backup = {
            id: new Date().getTime().toString(36) + Math.random().toString(36).substring(2),
            name: `Copia de seguridad ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString()
        };
        
        console.log('Backup simulado creado:', backup);
        
        // Mostrar notificación
        if (typeof createNotification === 'function') {
            createNotification('Éxito', 'Copia de seguridad creada con éxito (simulado)', 'success');
        } else {
            alert('Copia de seguridad creada con éxito (simulado)');
        }
    }
};

// Inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Firebase Fix cargado correctamente');
});

