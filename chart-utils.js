/**
 * Chart Utilities
 * 
 * Este módulo proporciona utilitarios para manejar los gráficos de la aplicación
 * y soluciona el problema "Chart is not defined"
 */

// Comprobar si Chart.js ya está disponible
if (typeof Chart === 'undefined') {
    // Cargar Chart.js dinámicamente si no está disponible
    loadChartJsLibrary();
    
    // Proporcionar una implementación de respaldo temporal para Chart
    window.Chart = function(ctx, config) {
        console.log('Chart.js no está completamente cargado. Usando implementación de respaldo.');
        
        // Mostrar un mensaje en el canvas
        if (ctx && ctx.canvas) {
            const canvas = ctx.canvas;
            const context = canvas.getContext('2d');
            
            // Limpiar el canvas
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar fondo
            context.fillStyle = '#f8f9fa';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Dibujar mensaje
            context.fillStyle = '#6c757d';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Cargando gráfico...', canvas.width / 2, canvas.height / 2);
            
            // Guardar la configuración para usarla cuando Chart.js esté disponible
            canvas.dataset.chartConfig = JSON.stringify(config);
        }
        
        // Devolver un objeto simulado con métodos mínimos para evitar errores
        return {
            update: function() {},
            destroy: function() {}
        };
    };
}

/**
 * Carga la biblioteca Chart.js dinámicamente
 */
function loadChartJsLibrary() {
    console.log('Cargando Chart.js dinámicamente...');
    
    // Crear el elemento script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
    script.integrity = 'sha512-ElRFoEQdI5Ht6kZvyzXhYG9NqjtkmlkfYk0wr6wHxU9JEHakS7UJZNeml5ALk+8IKlU6jDgMabC3vkumRokgJA==';
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    
    // Cuando la biblioteca se cargue, actualizar los gráficos en espera
    script.onload = function() {
        console.log('Chart.js cargado exitosamente');
        refreshPendingCharts();
    };
    
    script.onerror = function() {
        console.error('Error al cargar Chart.js');
    };
    
    // Añadir el script al documento
    document.head.appendChild(script);
}

/**
 * Actualiza los gráficos que estaban en espera
 */
function refreshPendingCharts() {
    // Buscar todos los canvas con configuración de gráficos pendientes
    const pendingCharts = document.querySelectorAll('canvas[data-chart-config]');
    
    pendingCharts.forEach(canvas => {
        try {
            const config = JSON.parse(canvas.dataset.chartConfig);
            const ctx = canvas.getContext('2d');
            
            // Crear el gráfico real ahora que Chart.js está disponible
            new Chart(ctx, config);
            
            // Limpiar el atributo de datos ya que ya no lo necesitamos
            delete canvas.dataset.chartConfig;
        } catch (error) {
            console.error('Error al actualizar gráfico pendiente:', error);
        }
    });
}

/**
 * Mejora de la función loadChart existente para manejar el caso cuando Chart.js no está disponible
 * 
 * @param {string} chartId - ID del elemento contenedor del gráfico
 * @param {array} data - Datos para el gráfico
 * @param {object} config - Configuración adicional del gráfico
 */
function loadChartSafely(chartId, data, config = {}) {
    const chartContainer = document.getElementById(chartId);
    if (!chartContainer) return;
    
    // Limpiar el contenedor
    chartContainer.innerHTML = '';
    
    // Si no hay datos, mostrar placeholder
    if (!data || data.length === 0) {
        chartContainer.innerHTML = `
            <div style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
                <div style="text-align: center; color: var(--gray-600);">
                    <i class="fas fa-chart-line fa-3x" style="margin-bottom: 10px;"></i>
                    <p>لا توجد بيانات لعرضها</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Crear canvas para el gráfico
    const canvas = document.createElement('canvas');
    canvas.width = chartContainer.offsetWidth;
    canvas.height = chartContainer.offsetHeight;
    chartContainer.appendChild(canvas);
    
    // Obtener contexto
    const ctx = canvas.getContext('2d');
    
    try {
        // Intentar crear el gráfico (usará nuestra implementación de respaldo si Chart.js no está disponible)
        new Chart(ctx, {
            type: config.type || 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: config.datasets || [
                    {
                        label: 'الاستثمارات',
                        data: data.map(d => d.investments),
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true
                    },
                    {
                        label: 'الأرباح',
                        data: data.map(d => d.profits),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatNumber ? formatNumber(value) : value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                const formatted = formatCurrency ? formatCurrency(value) : value;
                                return context.dataset.label + ': ' + formatted;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error al crear gráfico:', error);
        
        // Mostrar mensaje de error en el canvas
        ctx.fillStyle = '#f8d7da';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#721c24';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Error al cargar el gráfico', canvas.width / 2, canvas.height / 2);
    }
}

// Reemplazar la función loadChart original o proporcionar esta como alternativa
window.loadChartSafely = loadChartSafely;

// Si la función loadChart ya existe, guardarla y reemplazarla con nuestra versión segura
if (typeof window.loadChart === 'function') {
    const originalLoadChart = window.loadChart;
    
    window.loadChart = function(chartId, data, config = {}) {
        try {
            // Intentar usar la función original
            return originalLoadChart(chartId, data, config);
        } catch (error) {
            console.warn('Error en loadChart original, usando versión segura:', error);
            // Usar nuestra implementación segura como respaldo
            return loadChartSafely(chartId, data, config);
        }
    };
} else {
    // Si loadChart no existe, definirla
    window.loadChart = loadChartSafely;
}