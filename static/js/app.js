// ============================================
// BLANES CAPITAL - INTERACTIVE DASHBOARD
// ============================================

// Colores corporativos
const colors = {
    primary: '#1a2744',
    primaryBlue: '#2c4a7c',
    primaryLight: '#4a90d9',
    accent: '#6bb3e8',
    financiera: '#4a90d9',
    inmobiliaria: '#28a745',
    alternativas: '#9b59b6',
    rotacion: '#e74c3c',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    pablo: '#4a90d9',
    pabloDark: '#2c4a7c',
    ale: '#28a745',
    aleDark: '#1e7e34'
};

// Estado actual
let currentProfile = 'total';
let currentPeriod = '1s2025';
let charts = {};
let rangeMin = 0;
let rangeMax = 5;
const yearLabels = ['2020', '2021', '2022', '2023', '2024', '1S 2025'];

// ============================================
// DATOS - Se cargan desde la API protegida
// ============================================
let periodData = {};
let historicalData = {};

// Función para cargar datos desde la API (requiere login)
async function loadDataFromAPI() {
    try {
        const response = await fetch('/api/data');
        if (response.status === 401) {
            // No autenticado, redirigir al login
            window.location.href = '/login';
            return false;
        }
        if (!response.ok) {
            throw new Error('Error al cargar datos');
        }
        const data = await response.json();
        periodData = data.periodData;
        historicalData = data.historicalData;
        return true;
    } catch (error) {
        console.error('Error cargando datos:', error);
        return false;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    // Primero cargar los datos desde la API protegida
    const dataLoaded = await loadDataFromAPI();
    if (!dataLoaded) {
        console.error('No se pudieron cargar los datos');
        return;
    }

    // Registrar plugin de datalabels y desactivarlo por defecto
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        Chart.defaults.plugins.datalabels.display = false; // Desactivar por defecto
    }

    initNavigation();
    initProfileSelector();
    initPeriodSelector();
    initRangeSelector();
    initCharts();
    updateDynamicContent();
    initNavFades();

    console.log('Blanes Capital Dashboard inicializado correctamente');
});

// ============================================
// NAV FADES - Degradados en navegación
// ============================================
function initNavFades() {
    const nav = document.getElementById('mainNav');
    const fadeLeft = document.querySelector('.nav-fade-left');
    const fadeRight = document.querySelector('.nav-fade-right');

    if (!nav || !fadeLeft || !fadeRight) return;

    function updateFades() {
        const scrollLeft = nav.scrollLeft;
        const scrollWidth = nav.scrollWidth;
        const clientWidth = nav.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        // Mostrar degradado izquierdo si hay scroll hacia la izquierda
        if (scrollLeft > 5) {
            fadeLeft.classList.add('visible');
        } else {
            fadeLeft.classList.remove('visible');
        }

        // Mostrar degradado derecho si hay más contenido a la derecha
        if (scrollLeft < maxScroll - 5) {
            fadeRight.classList.add('visible');
        } else {
            fadeRight.classList.remove('visible');
        }
    }

    // Actualizar al hacer scroll
    nav.addEventListener('scroll', updateFades);

    // Actualizar al redimensionar
    window.addEventListener('resize', updateFades);

    // Inicializar
    updateFades();
}

// ============================================
// RANGE SELECTOR (Dual Slider)
// ============================================
function initRangeSelector() {
    const rangeMinInput = document.getElementById('rangeMin');
    const rangeMaxInput = document.getElementById('rangeMax');
    const rangeTrackActive = document.getElementById('rangeTrackActive');
    const rangeValueDisplay = document.getElementById('rangeValue');

    if (!rangeMinInput || !rangeMaxInput) return;

    function updateRangeTrack() {
        const min = parseInt(rangeMinInput.value);
        const max = parseInt(rangeMaxInput.value);
        const percent1 = (min / 5) * 100;
        const percent2 = (max / 5) * 100;

        rangeTrackActive.style.left = percent1 + '%';
        rangeTrackActive.style.width = (percent2 - percent1) + '%';

        // Update labels
        document.querySelectorAll('.range-label').forEach((label, index) => {
            if (index >= min && index <= max) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });

        // Update display value
        rangeValueDisplay.textContent = yearLabels[min] + ' - ' + yearLabels[max];
    }

    function handleRangeChange() {
        let min = parseInt(rangeMinInput.value);
        let max = parseInt(rangeMaxInput.value);

        // Ensure min doesn't exceed max
        if (min > max) {
            if (this === rangeMinInput) {
                rangeMinInput.value = max;
                min = max;
            } else {
                rangeMaxInput.value = min;
                max = min;
            }
        }

        rangeMin = min;
        rangeMax = max;

        updateRangeTrack();
        updatePatrimonioCharts();
    }

    rangeMinInput.addEventListener('input', handleRangeChange);
    rangeMaxInput.addEventListener('input', handleRangeChange);

    // Initialize track position
    updateRangeTrack();
}

function updatePatrimonioCharts() {
    // Destroy existing patrimonio charts
    if (charts.patrimonioTotal) {
        charts.patrimonioTotal.destroy();
        delete charts.patrimonioTotal;
    }
    if (charts.patrimonioPablo) {
        charts.patrimonioPablo.destroy();
        delete charts.patrimonioPablo;
    }
    if (charts.patrimonioAle) {
        charts.patrimonioAle.destroy();
        delete charts.patrimonioAle;
    }
    if (charts.patrimonioCompPablo) {
        charts.patrimonioCompPablo.destroy();
        delete charts.patrimonioCompPablo;
    }
    if (charts.patrimonioCompAle) {
        charts.patrimonioCompAle.destroy();
        delete charts.patrimonioCompAle;
    }

    // Reinitialize with new range
    initPatrimonioTotalChart();
    initPatrimonioPabloChart();
    initPatrimonioAleChart();

    // If in comparison mode, update those too
    if (currentProfile === 'comparar' && comparisonChartsInitialized) {
        initPatrimonioComparisonCharts();
    }
}

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================
function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;

            // Actualizar botones
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Mostrar sección
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetSection) {
                    s.classList.add('active');
                }
            });

            // Redimensionar gráficos al cambiar de sección
            setTimeout(() => {
                Object.values(charts).forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                    }
                });
            }, 100);
        });
    });
}

// ============================================
// SELECTOR DE PERFIL
// ============================================
function initProfileSelector() {
    const profileBtns = document.querySelectorAll('.profile-btn');
    const profileIndicator = document.getElementById('currentProfile');

    profileBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const profile = btn.dataset.profile;

            // Actualizar botones
            profileBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Actualizar estado
            currentProfile = profile;

            // Actualizar indicador
            const profileNames = {
                'total': 'Total (Pablo + Alejandro)',
                'pablo': 'Pablo',
                'ale': 'Alejandro',
                'comparar': 'Comparación Pablo vs Alejandro'
            };
            if (profileIndicator) {
                profileIndicator.textContent = profileNames[profile];
            }

            // Actualizar contenido visible
            updateProfileContent(profile);

            // Manejar visibilidad de pestañas de navegación
            updateNavVisibility(profile);

            // Si es modo comparar, inicializar gráficos de comparación
            if (profile === 'comparar') {
                setTimeout(() => {
                    initComparisonCharts();
                }, 100);
            }
        });
    });
}

// ============================================
// VISIBILIDAD DE NAVEGACIÓN EN MODO COMPARAR
// ============================================
function updateNavVisibility(profile) {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sectionsWithComparison = ['resumen', 'patrimonio', 'inmobiliaria', 'financiera', 'alternativas'];

    navBtns.forEach(btn => {
        const section = btn.dataset.section;
        if (profile === 'comparar') {
            if (!sectionsWithComparison.includes(section)) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        } else {
            btn.classList.remove('hidden');
        }
    });

    // Si estamos en una sección oculta, volver a resumen
    if (profile === 'comparar') {
        const activeNav = document.querySelector('.nav-btn.active');
        if (activeNav && !sectionsWithComparison.includes(activeNav.dataset.section)) {
            document.querySelector('.nav-btn[data-section="resumen"]').click();
        }
    }

    // Ocultar elementos marcados con data-hide-on-compare
    const hideOnCompare = document.querySelectorAll('[data-hide-on-compare="true"]');
    hideOnCompare.forEach(el => {
        el.style.display = profile === 'comparar' ? 'none' : '';
    });
}

// ============================================
// SELECTOR DE PERIODO
// ============================================
function initPeriodSelector() {
    const periodBtns = document.querySelectorAll('.period-btn');

    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.dataset.period;

            // Actualizar botones
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Actualizar estado
            currentPeriod = period;

            // Actualizar todo el contenido dinámico
            updateDynamicContent();

            // Reinicializar gráficos
            reinitCharts();
        });
    });
}

// ============================================
// ACTUALIZAR CONTENIDO DINÁMICO
// ============================================
function updateDynamicContent() {
    const data = periodData[currentPeriod];

    // Actualizar KPIs del resumen Total
    updateTotalKPIs(data);

    // Actualizar KPIs de Pablo
    updatePabloKPIs(data);

    // Actualizar KPIs de Ale
    updateAleKPIs(data);

    // Actualizar tarjetas de resumen
    updateSummaryCards(data);

    // Actualizar footer
    updateFooter(data);
}

function updateTotalKPIs(data) {
    // Patrimonio bajo gestión
    const kpiPatrimonio = document.querySelector('.profile-content[data-profile="total"] .kpi-card.gradient-purple .kpi-value');
    if (kpiPatrimonio) {
        kpiPatrimonio.textContent = data.total.bajoGestion.toFixed(1) + 'M€';
    }

    // Rentabilidad
    const kpiRent = document.querySelector('.profile-content[data-profile="total"] .kpi-card.gradient-blue .kpi-value');
    if (kpiRent) {
        const rentValue = data.total.rentabilidad;
        kpiRent.textContent = (rentValue >= 0 ? '+' : '') + rentValue.toFixed(2) + '%';
        kpiRent.className = 'kpi-value ' + (rentValue >= 0 ? '' : 'warning-text');
    }

    // Rentas inmobiliarias
    const kpiRentas = document.querySelector('.profile-content[data-profile="total"] .kpi-card.gradient-green .kpi-value');
    if (kpiRentas) {
        kpiRentas.textContent = data.total.rentasInmob + 'K€';
    }

    // Coste estructura
    const kpiCoste = document.querySelector('.profile-content[data-profile="total"] .kpi-card.gradient-orange .kpi-value');
    if (kpiCoste) {
        kpiCoste.textContent = data.total.costeEstructura.toFixed(2) + '%';
    }

    // Actualizar badges según periodo
    const badges = document.querySelectorAll('.profile-content[data-profile="total"] .kpi-badge');
    if (currentPeriod === '2024') {
        if (badges[0]) badges[0].textContent = '+6,0% vs 2023';
        if (badges[1]) badges[1].textContent = 'Rent. anual';
        if (badges[2]) badges[2].textContent = 'Anual completo';
        if (badges[3]) badges[3].textContent = 'Año completo';
    } else {
        if (badges[0]) badges[0].textContent = '+1,90% vs dic-24';
        if (badges[1]) badges[1].textContent = 'Impacto USD: -5,9M€';
        if (badges[2]) badges[2].textContent = '+106% vs 2024';
        if (badges[3]) badges[3].textContent = '-18K vs Budget';
    }
}

function updatePabloKPIs(data) {
    const pabloData = data.pablo;

    // Actualizar valores principales
    const pabloContent = document.querySelector('.profile-content[data-profile="pablo"]');
    if (!pabloContent) return;

    const kpis = pabloContent.querySelectorAll('.kpi-card .kpi-value');
    if (kpis[0]) kpis[0].textContent = pabloData.patrimonioTotal.toFixed(1) + 'M€';
    if (kpis[1]) kpis[1].textContent = pabloData.bajoGestion.toFixed(1) + 'M€';
    if (kpis[2]) {
        const rentValue = pabloData.rentabilidad;
        kpis[2].textContent = (rentValue >= 0 ? '+' : '') + rentValue.toFixed(2) + '%';
        kpis[2].className = 'kpi-value ' + (rentValue >= 0 ? 'positive-text' : 'negative-text');
    }
    if (kpis[3]) kpis[3].textContent = pabloData.rentasInmob + 'K€';
}

function updateAleKPIs(data) {
    const aleData = data.ale;

    // Actualizar valores principales
    const aleContent = document.querySelector('.profile-content[data-profile="ale"]');
    if (!aleContent) return;

    const kpis = aleContent.querySelectorAll('.kpi-card .kpi-value');
    if (kpis[0]) kpis[0].textContent = aleData.patrimonioTotal.toFixed(1) + 'M€';
    if (kpis[1]) kpis[1].textContent = aleData.bajoGestion.toFixed(1) + 'M€';
    if (kpis[2]) {
        const rentValue = aleData.rentabilidad;
        kpis[2].textContent = (rentValue >= 0 ? '+' : '') + rentValue.toFixed(2) + '%';
        kpis[2].className = 'kpi-value ' + (rentValue >= 0 ? 'positive-text' : 'negative-text');
    }
    if (kpis[3]) kpis[3].textContent = aleData.rentasInmob + 'K€';
}

function updateSummaryCards(data) {
    // Tarjeta Pablo
    const pabloCard = document.querySelector('.summary-card.pablo-card');
    if (pabloCard) {
        const total = pabloCard.querySelector('.patrimonio-total');
        if (total) total.textContent = data.pablo.patrimonioTotal.toFixed(1) + 'M€ total';

        const values = pabloCard.querySelectorAll('.metric-row .value');
        if (values[0]) values[0].textContent = data.pablo.bajoGestion.toFixed(1) + 'M€';
        if (values[1]) {
            const rent = data.pablo.rentabilidad;
            values[1].textContent = (rent >= 0 ? '+' : '') + rent.toFixed(2) + '%';
            values[1].className = 'value ' + (rent >= 0 ? 'positive' : 'negative');
        }
        if (values[2]) values[2].textContent = data.pablo.rentasInmob + 'K€';
    }

    // Tarjeta Ale
    const aleCard = document.querySelector('.summary-card.ale-card');
    if (aleCard) {
        const total = aleCard.querySelector('.patrimonio-total');
        if (total) total.textContent = data.ale.patrimonioTotal.toFixed(1) + 'M€ total';

        const values = aleCard.querySelectorAll('.metric-row .value');
        if (values[0]) values[0].textContent = data.ale.bajoGestion.toFixed(1) + 'M€';
        if (values[1]) {
            const rent = data.ale.rentabilidad;
            values[1].textContent = (rent >= 0 ? '+' : '') + rent.toFixed(2) + '%';
            values[1].className = 'value ' + (rent >= 0 ? 'positive' : 'negative');
        }
        if (values[2]) values[2].textContent = data.ale.rentasInmob + 'K€';
    }

    // Comparación
    const compPablo = document.querySelector('.comparison-column.pablo-column');
    if (compPablo) {
        const totalVal = compPablo.querySelector('.total-value');
        if (totalVal) totalVal.textContent = data.pablo.patrimonioTotal.toFixed(1) + 'M€';

        const metrics = compPablo.querySelectorAll('.metric-value');
        if (metrics[0]) metrics[0].textContent = data.pablo.bajoGestion.toFixed(1) + 'M€';
        if (metrics[1]) {
            const rent = data.pablo.rentabilidad;
            metrics[1].textContent = (rent >= 0 ? '+' : '') + rent.toFixed(2) + '%';
            metrics[1].className = 'metric-value ' + (rent >= 0 ? 'positive' : 'negative');
        }
        if (metrics[2]) metrics[2].textContent = data.pablo.rentasInmob + 'K€';
        if (metrics[3]) metrics[3].textContent = data.pablo.exposicionUSD + '%';
    }

    const compAle = document.querySelector('.comparison-column.ale-column');
    if (compAle) {
        const totalVal = compAle.querySelector('.total-value');
        if (totalVal) totalVal.textContent = data.ale.patrimonioTotal.toFixed(1) + 'M€';

        const metrics = compAle.querySelectorAll('.metric-value');
        if (metrics[0]) metrics[0].textContent = data.ale.bajoGestion.toFixed(1) + 'M€';
        if (metrics[1]) {
            const rent = data.ale.rentabilidad;
            metrics[1].textContent = (rent >= 0 ? '+' : '') + rent.toFixed(2) + '%';
            metrics[1].className = 'metric-value ' + (rent >= 0 ? 'positive' : 'negative');
        }
        if (metrics[2]) metrics[2].textContent = data.ale.rentasInmob + 'K€';
        if (metrics[3]) metrics[3].textContent = data.ale.exposicionUSD + '%';
    }
}

function updateFooter(data) {
    const footerInfo = document.querySelector('.footer-info');
    if (footerInfo) {
        footerInfo.innerHTML = `
            <span>Consejo ${data.title}</span>
            <span>Datos a ${data.date}</span>
        `;
    }
}

// ============================================
// ACTUALIZAR CONTENIDO POR PERFIL
// ============================================
function updateProfileContent(profile) {
    // Obtener todos los contenedores de perfil
    const profileContents = document.querySelectorAll('.profile-content');

    profileContents.forEach(content => {
        const contentProfile = content.dataset.profile;

        if (contentProfile === profile) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });

    // Redimensionar gráficos después de cambiar visibilidad
    setTimeout(() => {
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }, 50);
}

// ============================================
// REINICIALIZAR GRÁFICOS
// ============================================
function reinitCharts() {
    // Destruir gráficos existentes
    Object.values(charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    charts = {};
    comparisonChartsInitialized = false;

    // Reinicializar
    initCharts();

    // Si estamos en modo comparar, inicializar esos gráficos también
    if (currentProfile === 'comparar') {
        setTimeout(() => {
            initComparisonCharts();
        }, 100);
    }
}

// ============================================
// INICIALIZACIÓN DE GRÁFICOS
// ============================================
function initCharts() {
    // Gráficos de patrimonio
    initPatrimonioTotalChart();
    initPatrimonioPabloChart();
    initPatrimonioAleChart();

    // Gráficos de diversificación
    initDiversificationCharts();

    // Gráficos de distribución de bancos
    initBankCharts();

    // Gráficos de estructura de costes
    initCostCharts();
}

// ============================================
// GRÁFICOS DE ESTRUCTURA DE COSTES
// ============================================
function initCostCharts() {
    // Datos mensuales de costes TOTAL (en miles €)
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const serviciosExt = [30, 32, 24, 28, 24, 42];
    const gastoPersonal = [16, 16, 16, 16, 16, 21];
    const totalReal = serviciosExt.map((v, i) => v + gastoPersonal[i]);
    const budget = [52, 52, 51, 52, 52, 56];

    // Datos al 50% para Pablo/Ale
    const serviciosExt50 = serviciosExt.map(v => v / 2);
    const gastoPersonal50 = gastoPersonal.map(v => v / 2);
    const totalReal50 = totalReal.map(v => v / 2);
    const budget50 = budget.map(v => v / 2);

    // Función helper para crear chart de evolución
    function createEvolutionChart(canvasId, data, budgetData, maxY) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Real',
                        data: data,
                        backgroundColor: colors.primaryBlue,
                        borderRadius: 4,
                        barPercentage: 0.7
                    },
                    {
                        label: 'Budget',
                        data: budgetData,
                        backgroundColor: 'rgba(200, 200, 200, 0.5)',
                        borderColor: '#999',
                        borderWidth: 2,
                        type: 'line',
                        fill: false,
                        pointRadius: 4,
                        pointBackgroundColor: '#999'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}K€` } }
                },
                scales: {
                    y: { beginAtZero: true, max: maxY, ticks: { callback: v => v + 'K€' } }
                }
            }
        });
    }

    // Función helper para crear chart de desglose
    function createBreakdownChart(canvasId, servData, persData) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    { label: 'Servicios Exteriores', data: servData, backgroundColor: colors.financiera, borderRadius: 4 },
                    { label: 'Gasto de Personal', data: persData, backgroundColor: colors.inmobiliaria, borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}K€` } }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true, ticks: { callback: v => v + 'K€' } }
                }
            }
        });
    }

    // Charts Total
    charts.costEvolution = createEvolutionChart('costEvolutionChart', totalReal, budget, 70);
    charts.costBreakdown = createBreakdownChart('costBreakdownChart', serviciosExt, gastoPersonal);

    // Charts Pablo (50%)
    charts.costEvolutionPablo = createEvolutionChart('costEvolutionChartPablo', totalReal50, budget50, 35);
    charts.costBreakdownPablo = createBreakdownChart('costBreakdownChartPablo', serviciosExt50, gastoPersonal50);

    // Charts Ale (50%)
    charts.costEvolutionAle = createEvolutionChart('costEvolutionChartAle', totalReal50, budget50, 35);
    charts.costBreakdownAle = createBreakdownChart('costBreakdownChartAle', serviciosExt50, gastoPersonal50);

    // Charts Comparar (igual que Total)
    charts.costEvolutionComp = createEvolutionChart('costEvolutionChartComp', totalReal, budget, 70);
    charts.costBreakdownComp = createBreakdownChart('costBreakdownChartComp', serviciosExt, gastoPersonal);
}

// ============================================
// GRÁFICO PATRIMONIO TOTAL (Líneas con puntos)
// ============================================
function initPatrimonioTotalChart() {
    const ctx = document.getElementById('patrimonioTotalChart');
    if (!ctx) return;

    // Usar datos históricos actualizados
    const pabloBajoGestion = historicalData.pablo.bajoGestion;
    const pabloEmpresarial = historicalData.pablo.empresarial;
    const aleBajoGestion = historicalData.ale.bajoGestion;
    const aleEmpresarial = historicalData.ale.empresarial;

    // Calcular totales
    const totalBajoGestion = pabloBajoGestion.map((v, i) => v + aleBajoGestion[i]);
    const totalEmpresarial = pabloEmpresarial.map((v, i) => v + aleEmpresarial[i]);
    const totalPatrimonio = totalBajoGestion.map((v, i) => v + totalEmpresarial[i]);

    // Usar rango seleccionado
    const labels = yearLabels.slice(rangeMin, rangeMax + 1);

    charts.patrimonioTotal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Patrimonio',
                    data: totalPatrimonio.slice(rangeMin, rangeMax + 1),
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Bajo Gestión',
                    data: totalBajoGestion.slice(rangeMin, rangeMax + 1),
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Empresarial (Freepik)',
                    data: totalEmpresarial.slice(rangeMin, rangeMax + 1),
                    borderColor: '#b8860b',
                    backgroundColor: '#b8860b',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: getLineChartOptions('Evolución Patrimonial Combinada (M€)')
    });
}

// ============================================
// GRÁFICO PATRIMONIO PABLO (Líneas con puntos)
// ============================================
function initPatrimonioPabloChart() {
    const ctx = document.getElementById('patrimonioPabloChart');
    if (!ctx) return;

    const bajoGestion = historicalData.pablo.bajoGestion;
    const empresarial = historicalData.pablo.empresarial;
    const total = bajoGestion.map((v, i) => v + empresarial[i]);

    // Usar rango seleccionado
    const labels = yearLabels.slice(rangeMin, rangeMax + 1);

    charts.patrimonioPablo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Patrimonio',
                    data: total.slice(rangeMin, rangeMax + 1),
                    borderColor: '#1e3a5f',
                    backgroundColor: '#1e3a5f',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Bajo Gestión',
                    data: bajoGestion.slice(rangeMin, rangeMax + 1),
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Empresarial (Freepik)',
                    data: empresarial.slice(rangeMin, rangeMax + 1),
                    borderColor: '#b8860b',
                    backgroundColor: '#b8860b',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: getLineChartOptions('Evolución Patrimonio Pablo (M€)')
    });
}

// ============================================
// GRÁFICO PATRIMONIO ALE (Líneas con puntos)
// ============================================
function initPatrimonioAleChart() {
    const ctx = document.getElementById('patrimonioAleChart');
    if (!ctx) return;

    const bajoGestion = historicalData.ale.bajoGestion;
    const empresarial = historicalData.ale.empresarial;
    const total = bajoGestion.map((v, i) => v + empresarial[i]);

    // Usar rango seleccionado
    const labels = yearLabels.slice(rangeMin, rangeMax + 1);

    charts.patrimonioAle = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Patrimonio',
                    data: total.slice(rangeMin, rangeMax + 1),
                    borderColor: '#0d4a3a',
                    backgroundColor: '#0d4a3a',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Bajo Gestión',
                    data: bajoGestion.slice(rangeMin, rangeMax + 1),
                    borderColor: '#0d7a5f',
                    backgroundColor: '#0d7a5f',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    fill: false
                },
                {
                    label: 'Empresarial (Freepik)',
                    data: empresarial.slice(rangeMin, rangeMax + 1),
                    borderColor: '#b8860b',
                    backgroundColor: '#b8860b',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.3,
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: getLineChartOptions('Evolución Patrimonio Alejandro (M€)')
    });
}

// ============================================
// OPCIONES COMUNES PARA GRÁFICOS DE LÍNEAS
// ============================================
function getLineChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            title: {
                display: true,
                text: title,
                font: { size: 14, weight: '600' },
                padding: { bottom: 20 }
            },
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    font: { size: 12 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 39, 68, 0.95)',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                callbacks: {
                    label: function(context) {
                        return context.dataset.label + ': ' + context.raw.toFixed(1) + 'M€';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false }
            },
            y: {
                beginAtZero: false,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    callback: function(value) {
                        return value + 'M€';
                    }
                }
            }
        }
    };
}

// ============================================
// GRÁFICOS DE DIVERSIFICACIÓN
// ============================================
function initDiversificationCharts() {
    const data = periodData[currentPeriod];

    // Pablo - Actual
    const ctxPabloActual = document.getElementById('divPabloActual');
    if (ctxPabloActual) {
        const pabloDiv = calculateDiversification(data.pablo);
        charts.divPabloActual = new Chart(ctxPabloActual, {
            type: 'doughnut',
            data: {
                labels: ['Financiera', 'Inmobiliaria', 'Alternativas', 'Rotación'],
                datasets: [{
                    data: [pabloDiv.financiera, pabloDiv.inmobiliaria, pabloDiv.alternativas, pabloDiv.rotacion],
                    backgroundColor: [colors.financiera, colors.inmobiliaria, colors.alternativas, colors.rotacion],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Pablo - Objetivo
    const ctxPabloObj = document.getElementById('divPabloObjetivo');
    if (ctxPabloObj) {
        charts.divPabloObj = new Chart(ctxPabloObj, {
            type: 'doughnut',
            data: {
                labels: ['Financiera', 'Inmobiliaria', 'Alternativas'],
                datasets: [{
                    data: [55, 35, 10],
                    backgroundColor: [colors.financiera, colors.inmobiliaria, colors.alternativas],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Ale - Actual
    const ctxAleActual = document.getElementById('divAleActual');
    if (ctxAleActual) {
        const aleDiv = calculateDiversification(data.ale);
        charts.divAleActual = new Chart(ctxAleActual, {
            type: 'doughnut',
            data: {
                labels: ['Financiera', 'Inmobiliaria', 'Alternativas', 'Rotación'],
                datasets: [{
                    data: [aleDiv.financiera, aleDiv.inmobiliaria, aleDiv.alternativas, aleDiv.rotacion],
                    backgroundColor: [colors.financiera, colors.inmobiliaria, colors.alternativas, colors.rotacion],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Ale - Objetivo
    const ctxAleObj = document.getElementById('divAleObjetivo');
    if (ctxAleObj) {
        charts.divAleObj = new Chart(ctxAleObj, {
            type: 'doughnut',
            data: {
                labels: ['Financiera', 'Inmobiliaria', 'Alternativas'],
                datasets: [{
                    data: [50, 35, 15],
                    backgroundColor: [colors.financiera, colors.inmobiliaria, colors.alternativas],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }
}

function calculateDiversification(personData) {
    const total = personData.carteraFinanciera + personData.carteraInmobiliaria +
                  personData.alternativas + personData.rotacion;
    return {
        financiera: Math.round((personData.carteraFinanciera / total) * 100),
        inmobiliaria: Math.round((personData.carteraInmobiliaria / total) * 100),
        alternativas: Math.round((personData.alternativas / total) * 100),
        rotacion: Math.round((personData.rotacion / total) * 100)
    };
}

// ============================================
// OPCIONES PARA GRÁFICOS DOUGHNUT
// ============================================
function getDoughnutOptions() {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 12,
                    usePointStyle: true,
                    font: { size: 11 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 39, 68, 0.95)',
                padding: 10,
                callbacks: {
                    label: function(context) {
                        return context.label + ': ' + context.raw + '%';
                    }
                }
            }
        },
        cutout: '60%'
    };
}

// ============================================
// GRÁFICOS DE DISTRIBUCIÓN DE BANCOS
// ============================================
function initBankCharts() {
    const data = periodData[currentPeriod];
    const bankColors = ['#2c4a7c', '#4a90d9', '#6bb3e8', '#9b59b6', '#e74c3c'];

    // Pablo - Distribución de bancos
    const ctxBankPablo = document.getElementById('bankPabloChart');
    if (ctxBankPablo) {
        const pabloBanks = data.pablo.bancos;
        charts.bankPablo = new Chart(ctxBankPablo, {
            type: 'pie',
            data: {
                labels: ['JP Morgan', 'Goldman Sachs', 'Banca March', 'Andbank'],
                datasets: [{
                    data: [pabloBanks.jp, pabloBanks.gs, pabloBanks.march, pabloBanks.andbank],
                    backgroundColor: bankColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getPieOptions()
        });
    }

    // Ale - Distribución de bancos
    const ctxBankAle = document.getElementById('bankAleChart');
    if (ctxBankAle) {
        const aleBanks = data.ale.bancos;
        charts.bankAle = new Chart(ctxBankAle, {
            type: 'pie',
            data: {
                labels: ['JP Morgan', 'Goldman Sachs', 'Andbank', 'Banca March'],
                datasets: [{
                    data: [aleBanks.jp, aleBanks.gs, aleBanks.andbank, aleBanks.march],
                    backgroundColor: bankColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getPieOptions()
        });
    }
}

// ============================================
// OPCIONES PARA GRÁFICOS PIE
// ============================================
function getPieOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 12,
                    usePointStyle: true,
                    font: { size: 11 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(26, 39, 68, 0.95)',
                padding: 10,
                callbacks: {
                    label: function(context) {
                        return context.label + ': ' + context.raw + '%';
                    }
                }
            },
            datalabels: {
                display: true,
                color: '#fff',
                font: {
                    weight: 'bold',
                    size: 12
                },
                formatter: function(value) {
                    if (value < 5) return ''; // No mostrar si es muy pequeño
                    return value + '%';
                },
                anchor: 'center',
                align: 'center',
                textStrokeColor: 'rgba(0,0,0,0.3)',
                textStrokeWidth: 2
            }
        }
    };
}

// ============================================
// GRÁFICOS DE COMPARACIÓN
// ============================================
let comparisonChartsInitialized = false;

function initComparisonCharts() {
    if (comparisonChartsInitialized) return;

    // Resumen
    initGaugeCharts();
    initWaterfallCharts();
    initCompositionCharts();

    // Patrimonio
    initPatrimonioComparisonCharts();

    // Inmobiliaria
    initInmobiliariaComparisonCharts();

    // Financiera
    initFinancieraComparisonCharts();

    // Alternativas
    initAlternativasComparisonCharts();

    comparisonChartsInitialized = true;
}

// ============================================
// GAUGE CHARTS (Velocímetros)
// ============================================
function initGaugeCharts() {
    const data = periodData[currentPeriod];

    // Calcular progreso hacia objetivo
    const pabloAltPct = (data.pablo.alternativas / data.pablo.bajoGestion) * 100;
    const pabloProgress = Math.round((pabloAltPct / 10) * 100); // objetivo 10%

    const aleAltPct = (data.ale.alternativas / data.ale.bajoGestion) * 100;
    const aleProgress = Math.round((aleAltPct / 15) * 100); // objetivo 15%

    // Gauge Pablo
    const ctxGaugePablo = document.getElementById('gaugePablo');
    if (ctxGaugePablo) {
        charts.gaugePablo = new Chart(ctxGaugePablo, {
            type: 'doughnut',
            data: {
                labels: ['Actual', 'Restante'],
                datasets: [{
                    data: [Math.min(pabloProgress, 100), Math.max(100 - pabloProgress, 0)],
                    backgroundColor: [colors.pablo, '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                rotation: -90,
                circumference: 180,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataIndex === 0) {
                                    return 'Progreso: ' + pabloProgress + '% del objetivo';
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    // Gauge Ale
    const ctxGaugeAle = document.getElementById('gaugeAle');
    if (ctxGaugeAle) {
        charts.gaugeAle = new Chart(ctxGaugeAle, {
            type: 'doughnut',
            data: {
                labels: ['Actual', 'Restante'],
                datasets: [{
                    data: [Math.min(aleProgress, 100), Math.max(100 - aleProgress, 0)],
                    backgroundColor: [colors.ale, '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                rotation: -90,
                circumference: 180,
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataIndex === 0) {
                                    return 'Progreso: ' + aleProgress + '% del objetivo';
                                }
                                return '';
                            }
                        }
                    }
                }
            }
        });
    }

    // Actualizar labels de gauge
    updateGaugeLabels(data, pabloAltPct, aleAltPct);
}

function updateGaugeLabels(data, pabloAltPct, aleAltPct) {
    const pabloGaugeLabels = document.querySelector('.pablo-column .gauge-labels');
    if (pabloGaugeLabels) {
        pabloGaugeLabels.innerHTML = `
            <span>Actual: <strong>${pabloAltPct.toFixed(1)}%</strong></span>
            <span>Objetivo: <strong>10%</strong></span>
        `;
    }

    const aleGaugeLabels = document.querySelector('.ale-column .gauge-labels');
    if (aleGaugeLabels) {
        aleGaugeLabels.innerHTML = `
            <span>Actual: <strong>${aleAltPct.toFixed(1)}%</strong></span>
            <span>Objetivo: <strong>15%</strong></span>
        `;
    }
}

// ============================================
// WATERFALL CHARTS
// ============================================
function initWaterfallCharts() {
    const data = periodData[currentPeriod];

    if (currentPeriod === '2024') {
        // Waterfall para 2024 completo
        initWaterfall2024();
    } else {
        // Waterfall para 1S 2025
        initWaterfall1S2025();
    }
}

function initWaterfall1S2025() {
    // Waterfall Pablo: 94.5 -> +2.2 -> -0.13 -> -0.17 -> 96.4
    const ctxWfPablo = document.getElementById('waterfallPablo');
    if (ctxWfPablo) {
        charts.waterfallPablo = new Chart(ctxWfPablo, {
            type: 'bar',
            data: {
                labels: ['Dic 2024', '+Entradas', '+Rendim.', '-Impuestos', 'Jun 2025'],
                datasets: [{
                    label: 'Patrimonio',
                    data: [
                        [0, 94.5],
                        [94.5, 96.7],
                        [96.7, 96.57],
                        [96.57, 96.4],
                        [0, 96.4]
                    ],
                    backgroundColor: [
                        colors.pablo,
                        colors.success,
                        colors.danger,
                        colors.warning,
                        colors.pabloDark
                    ],
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: getWaterfallOptions()
        });
    }

    // Waterfall Ale: 77.3 -> +1.8 -> +0.06 -> -0.36 -> 78.8
    const ctxWfAle = document.getElementById('waterfallAle');
    if (ctxWfAle) {
        charts.waterfallAle = new Chart(ctxWfAle, {
            type: 'bar',
            data: {
                labels: ['Dic 2024', '+Entradas', '+Rendim.', '-Impuestos', 'Jun 2025'],
                datasets: [{
                    label: 'Patrimonio',
                    data: [
                        [0, 77.3],
                        [77.3, 79.1],
                        [79.1, 79.16],
                        [79.16, 78.8],
                        [0, 78.8]
                    ],
                    backgroundColor: [
                        colors.ale,
                        colors.success,
                        colors.success,
                        colors.warning,
                        colors.aleDark
                    ],
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: getWaterfallOptions()
        });
    }
}

function initWaterfall2024() {
    // Waterfall Pablo 2024: 87.9 -> +5.0 -> -4.5 -> 88.43
    const ctxWfPablo = document.getElementById('waterfallPablo');
    if (ctxWfPablo) {
        charts.waterfallPablo = new Chart(ctxWfPablo, {
            type: 'bar',
            data: {
                labels: ['Dic 2023', '+Rendim.', '-Salidas', 'Dic 2024'],
                datasets: [{
                    label: 'Patrimonio',
                    data: [
                        [0, 87.9],
                        [87.9, 92.9],
                        [92.9, 88.43],
                        [0, 88.43]
                    ],
                    backgroundColor: [
                        colors.pablo,
                        colors.success,
                        colors.warning,
                        colors.pabloDark
                    ],
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: getWaterfallOptions()
        });
    }

    // Waterfall Ale 2024: 70.0 -> +5.2 -> -2.6 -> 72.63
    const ctxWfAle = document.getElementById('waterfallAle');
    if (ctxWfAle) {
        charts.waterfallAle = new Chart(ctxWfAle, {
            type: 'bar',
            data: {
                labels: ['Dic 2023', '+Rendim.', '-Salidas', 'Dic 2024'],
                datasets: [{
                    label: 'Patrimonio',
                    data: [
                        [0, 70.0],
                        [70.0, 75.2],
                        [75.2, 72.63],
                        [0, 72.63]
                    ],
                    backgroundColor: [
                        colors.ale,
                        colors.success,
                        colors.warning,
                        colors.aleDark
                    ],
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: getWaterfallOptions()
        });
    }
}

function getWaterfallOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const data = context.raw;
                        if (Array.isArray(data)) {
                            const diff = data[1] - data[0];
                            if (context.dataIndex === 0 || context.dataIndex === context.dataset.data.length - 1) {
                                return 'Total: ' + data[1].toFixed(1) + 'M€';
                            }
                            const sign = diff >= 0 ? '+' : '';
                            return sign + diff.toFixed(2) + 'M€';
                        }
                        return context.raw + 'M€';
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false }
            },
            y: {
                beginAtZero: true,
                max: 110,
                ticks: {
                    callback: function(value) {
                        return value + 'M€';
                    }
                },
                grid: { color: 'rgba(0,0,0,0.05)' }
            }
        }
    };
}

// ============================================
// COMPOSITION CHARTS CON PORCENTAJES
// ============================================
function initCompositionCharts() {
    const data = periodData[currentPeriod];

    // Composición Financiera Pablo con porcentajes
    const ctxCompPablo = document.getElementById('compFinPablo');
    if (ctxCompPablo) {
        charts.compFinPablo = new Chart(ctxCompPablo, {
            type: 'doughnut',
            data: {
                labels: [`Renta Fija ${data.pablo.rf}%`, `Renta Variable ${data.pablo.rv}%`, `Mat. Primas ${data.pablo.mp}%`],
                datasets: [{
                    data: [data.pablo.rf, data.pablo.rv, data.pablo.mp],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getCompositionOptions(data.pablo.carteraFinanciera.toFixed(1) + 'M€')
        });
    }

    // Composición Financiera Ale con porcentajes
    const ctxCompAle = document.getElementById('compFinAle');
    if (ctxCompAle) {
        charts.compFinAle = new Chart(ctxCompAle, {
            type: 'doughnut',
            data: {
                labels: [`Renta Fija ${data.ale.rf}%`, `Renta Variable ${data.ale.rv}%`, `Mat. Primas ${data.ale.mp}%`],
                datasets: [{
                    data: [data.ale.rf, data.ale.rv, data.ale.mp],
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getCompositionOptions(data.ale.carteraFinanciera.toFixed(1) + 'M€')
        });
    }

    // Actualizar títulos de composición
    const pabloTitle = document.querySelector('.comp-chart-item:first-child h4');
    if (pabloTitle) pabloTitle.textContent = `Pablo (${data.pablo.carteraFinanciera.toFixed(1)}M€)`;

    const aleTitle = document.querySelector('.comp-chart-item:last-child h4');
    if (aleTitle) aleTitle.textContent = `Alejandro (${data.ale.carteraFinanciera.toFixed(1)}M€)`;
}

function getCompositionOptions(totalText) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 10,
                    usePointStyle: true,
                    font: { size: 11 }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.label;
                    }
                }
            }
        }
    };
}

// ============================================
// PATRIMONIO COMPARISON CHARTS
// ============================================
function initPatrimonioComparisonCharts() {
    const data = periodData[currentPeriod];

    // Usar rango seleccionado
    const labels = yearLabels.slice(rangeMin, rangeMax + 1);

    // Gráfico Pablo
    const ctxPablo = document.getElementById('patrimonioCompPablo');
    if (ctxPablo) {
        const bajoGestion = historicalData.pablo.bajoGestion;

        charts.patrimonioCompPablo = new Chart(ctxPablo, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bajo Gestión',
                    data: bajoGestion.slice(rangeMin, rangeMax + 1),
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    borderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: getLineChartOptions('Pablo - Bajo Gestión (M€)')
        });
    }

    // Gráfico Ale
    const ctxAle = document.getElementById('patrimonioCompAle');
    if (ctxAle) {
        const bajoGestion = historicalData.ale.bajoGestion;

        charts.patrimonioCompAle = new Chart(ctxAle, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bajo Gestión',
                    data: bajoGestion.slice(rangeMin, rangeMax + 1),
                    borderColor: '#0d7a5f',
                    backgroundColor: '#0d7a5f',
                    borderWidth: 2,
                    pointRadius: 4,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: getLineChartOptions('Alejandro - Bajo Gestión (M€)')
        });
    }

    // Diversificación Pablo
    const ctxDivPablo = document.getElementById('divCompPablo');
    if (ctxDivPablo) {
        const pabloDiv = calculateDiversification(data.pablo);
        charts.divCompPablo = new Chart(ctxDivPablo, {
            type: 'doughnut',
            data: {
                labels: ['Financiera', 'Inmobiliaria', 'Alternativas', 'Rotación'],
                datasets: [{
                    data: [pabloDiv.financiera, pabloDiv.inmobiliaria, pabloDiv.alternativas, pabloDiv.rotacion],
                    backgroundColor: [colors.financiera, colors.inmobiliaria, colors.alternativas, colors.rotacion],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Diversificación Ale
    const ctxDivAle = document.getElementById('divCompAle');
    if (ctxDivAle) {
        const aleDiv = calculateDiversification(data.ale);
        charts.divCompAle = new Chart(ctxDivAle, {
            type: 'doughnut',
            data: {
                labels: ['Financiera', 'Inmobiliaria', 'Alternativas', 'Rotación'],
                datasets: [{
                    data: [aleDiv.financiera, aleDiv.inmobiliaria, aleDiv.alternativas, aleDiv.rotacion],
                    backgroundColor: [colors.financiera, colors.inmobiliaria, colors.alternativas, colors.rotacion],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }
}

// ============================================
// INMOBILIARIA COMPARISON CHARTS
// ============================================
function initInmobiliariaComparisonCharts() {
    const propColors = ['#4a90d9', '#28a745', '#f59e0b', '#e74c3c'];

    // Distribución Pablo
    const ctxPablo = document.getElementById('propCompPablo');
    if (ctxPablo) {
        charts.propCompPablo = new Chart(ctxPablo, {
            type: 'doughnut',
            data: {
                labels: ['Oficinas 25%', 'Alq. Turístico 22%', 'Larga Estancia 35%', 'Uso Propio 16%'],
                datasets: [{
                    data: [25, 22, 35, 16],
                    backgroundColor: propColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Distribución Ale
    const ctxAle = document.getElementById('propCompAle');
    if (ctxAle) {
        charts.propCompAle = new Chart(ctxAle, {
            type: 'doughnut',
            data: {
                labels: ['Oficinas 31%', 'Alq. Turístico 17%', 'Larga Estancia 49%', 'Uso Propio 2%'],
                datasets: [{
                    data: [31, 17, 49, 2],
                    backgroundColor: propColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }
}

// ============================================
// FINANCIERA COMPARISON CHARTS
// ============================================
function initFinancieraComparisonCharts() {
    const data = periodData[currentPeriod];
    const finColors = ['#3b82f6', '#10b981', '#f59e0b'];
    const bankColors = ['#2c4a7c', '#4a90d9', '#6bb3e8', '#9b59b6'];

    // Composición Pablo
    const ctxFinPablo = document.getElementById('finCompPablo');
    if (ctxFinPablo) {
        charts.finCompPablo = new Chart(ctxFinPablo, {
            type: 'doughnut',
            data: {
                labels: [`RF ${data.pablo.rf}%`, `RV ${data.pablo.rv}%`, `MP ${data.pablo.mp}%`],
                datasets: [{
                    data: [data.pablo.rf, data.pablo.rv, data.pablo.mp],
                    backgroundColor: finColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Composición Ale
    const ctxFinAle = document.getElementById('finCompAle');
    if (ctxFinAle) {
        charts.finCompAle = new Chart(ctxFinAle, {
            type: 'doughnut',
            data: {
                labels: [`RF ${data.ale.rf}%`, `RV ${data.ale.rv}%`, `MP ${data.ale.mp}%`],
                datasets: [{
                    data: [data.ale.rf, data.ale.rv, data.ale.mp],
                    backgroundColor: finColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Bancos Pablo
    const ctxBankPablo = document.getElementById('bankCompPablo');
    if (ctxBankPablo) {
        const pabloBanks = data.pablo.bancos;
        charts.bankCompPablo = new Chart(ctxBankPablo, {
            type: 'pie',
            data: {
                labels: ['JP Morgan', 'Goldman Sachs', 'Banca March', 'Andbank'],
                datasets: [{
                    data: [pabloBanks.jp, pabloBanks.gs, pabloBanks.march, pabloBanks.andbank],
                    backgroundColor: bankColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getPieOptions()
        });
    }

    // Bancos Ale
    const ctxBankAle = document.getElementById('bankCompAle');
    if (ctxBankAle) {
        const aleBanks = data.ale.bancos;
        charts.bankCompAle = new Chart(ctxBankAle, {
            type: 'pie',
            data: {
                labels: ['JP Morgan', 'Goldman Sachs', 'Andbank', 'Banca March'],
                datasets: [{
                    data: [aleBanks.jp, aleBanks.gs, aleBanks.andbank, aleBanks.march],
                    backgroundColor: bankColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getPieOptions()
        });
    }
}

// ============================================
// ALTERNATIVAS COMPARISON CHARTS
// ============================================
function initAlternativasComparisonCharts() {
    const altColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    // Gauge Pablo
    const ctxGaugePablo = document.getElementById('gaugeCompPablo');
    if (ctxGaugePablo) {
        charts.gaugeCompPablo = new Chart(ctxGaugePablo, {
            type: 'doughnut',
            data: {
                labels: ['Actual', 'Restante'],
                datasets: [{
                    data: [23, 77],
                    backgroundColor: [colors.pablo, '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                rotation: -90,
                circumference: 180,
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });
    }

    // Gauge Ale
    const ctxGaugeAle = document.getElementById('gaugeCompAle');
    if (ctxGaugeAle) {
        charts.gaugeCompAle = new Chart(ctxGaugeAle, {
            type: 'doughnut',
            data: {
                labels: ['Actual', 'Restante'],
                datasets: [{
                    data: [45, 55],
                    backgroundColor: [colors.ale, '#e5e7eb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                rotation: -90,
                circumference: 180,
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });
    }

    // Distribución por tipo Pablo
    const ctxTypePablo = document.getElementById('altTypeCompPablo');
    if (ctxTypePablo) {
        charts.altTypeCompPablo = new Chart(ctxTypePablo, {
            type: 'doughnut',
            data: {
                labels: ['VC 38%', 'Buyout 20%', 'P.Credit 34%', 'P.RE 3%'],
                datasets: [{
                    data: [38, 20, 34, 3],
                    backgroundColor: altColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }

    // Distribución por tipo Ale
    const ctxTypeAle = document.getElementById('altTypeCompAle');
    if (ctxTypeAle) {
        charts.altTypeCompAle = new Chart(ctxTypeAle, {
            type: 'doughnut',
            data: {
                labels: ['VC 17%', 'P.Credit 57%', 'Infra 12%'],
                datasets: [{
                    data: [17, 57, 12],
                    backgroundColor: altColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: getDoughnutOptions()
        });
    }
}

// ============================================
// ANIMACIONES EN SCROLL
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animaciones después de que cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.kpi-card, .alert-card, .summary-card, .stat-card, .property-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});

// ============================================
// IMPRESIÓN
// ============================================
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.add('active');
        s.style.pageBreakAfter = 'always';
    });
    document.querySelectorAll('.profile-content').forEach(c => {
        c.style.display = 'block';
    });
});

window.addEventListener('afterprint', () => {
    const activeNav = document.querySelector('.nav-btn.active');
    if (activeNav) {
        const targetSection = activeNav.dataset.section;
        document.querySelectorAll('.section').forEach(s => {
            if (s.id !== targetSection) {
                s.classList.remove('active');
            }
            s.style.pageBreakAfter = 'auto';
        });
    }
    updateProfileContent(currentProfile);
});

// ============================================
// TOGGLE OPTIMIZACION FISCAL + CASH FLOW
// ============================================

// Cash Flow Data
const cashFlowData = {
    total: { income: 1107, optimizedIncome: 600 }, // 1.107K actual, 600K optimizado (solo inmuebles)
    pablo: { income: 220, optimizedIncome: 180 },  // 220K actual, 180K optimizado
    ale: { income: 907, optimizedIncome: 420 }     // 907K actual, 420K optimizado
};

let currentNeeds = 25000; // 25K/mes por defecto
let isOptimized = false;

function formatK(value) {
    if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1).replace('.0', '') + 'M€';
    }
    return value + 'K€';
}

function updateCashFlowCalculations() {
    const yearlyNeeds = (currentNeeds * 12) / 1000; // en K€
    const monthlyK = currentNeeds / 1000;

    // TOTAL (2 personas)
    const totalYearlyNeeds = yearlyNeeds * 2;
    const totalIncome = isOptimized ? cashFlowData.total.optimizedIncome : cashFlowData.total.income;
    const totalExcess = totalIncome - totalYearlyNeeds;
    const totalTaxOnExcess = totalExcess > 0 ? Math.round(totalExcess * 0.25) : 0;

    document.getElementById('cfTotalNeedsMonthly').textContent = monthlyK + 'K';
    document.getElementById('cfTotalNeeds').textContent = formatK(totalYearlyNeeds);
    document.getElementById('cfTotalIncome').textContent = formatK(totalIncome);
    document.getElementById('cfTotalExcess').textContent = (totalExcess >= 0 ? '' : '') + formatK(totalExcess);
    document.getElementById('cfTotalTaxExcess').textContent = '~' + formatK(totalTaxOnExcess);

    const totalExcessBox = document.getElementById('cfTotalExcessBox');
    if (totalExcess <= 50) {
        totalExcessBox.classList.add('optimized');
    } else {
        totalExcessBox.classList.remove('optimized');
    }

    // PABLO (1 persona)
    const pabloIncome = isOptimized ? cashFlowData.pablo.optimizedIncome : cashFlowData.pablo.income;
    const pabloExcess = pabloIncome - yearlyNeeds;
    const pabloTaxOnExcess = pabloExcess > 0 ? Math.round(pabloExcess * 0.25) : 0;

    document.getElementById('cfPabloNeedsMonthly').textContent = monthlyK + 'K';
    document.getElementById('cfPabloNeeds').textContent = formatK(yearlyNeeds);
    document.getElementById('cfPabloIncome').textContent = formatK(pabloIncome);
    document.getElementById('cfPabloExcess').textContent = formatK(pabloExcess);
    document.getElementById('cfPabloTaxExcess').textContent = '~' + formatK(Math.max(pabloTaxOnExcess, 0));

    const pabloExcessBox = document.getElementById('cfPabloExcessBox');
    if (pabloExcess <= 50 && pabloExcess >= -50) {
        pabloExcessBox.classList.add('optimized');
    } else {
        pabloExcessBox.classList.remove('optimized');
    }

    // ALEJANDRO (1 persona)
    const aleIncome = isOptimized ? cashFlowData.ale.optimizedIncome : cashFlowData.ale.income;
    const aleExcess = aleIncome - yearlyNeeds;
    const aleTaxOnExcess = aleExcess > 0 ? Math.round(aleExcess * 0.25) : 0;

    document.getElementById('cfAleNeedsMonthly').textContent = monthlyK + 'K';
    document.getElementById('cfAleNeeds').textContent = formatK(yearlyNeeds);
    document.getElementById('cfAleIncome').textContent = formatK(aleIncome);
    document.getElementById('cfAleExcess').textContent = formatK(aleExcess);
    document.getElementById('cfAleTaxExcess').textContent = '~' + formatK(aleTaxOnExcess);

    const aleExcessBox = document.getElementById('cfAleExcessBox');
    if (aleExcess <= 50) {
        aleExcessBox.classList.add('optimized');
    } else {
        aleExcessBox.classList.remove('optimized');
    }

    // Update savings examples (comparando con 15K/mes)
    const savingsVs15K = (currentNeeds - 15000) * 12 / 1000;
    document.getElementById('cfTotalSavingsExample').textContent = (savingsVs15K > 0 ? '-' : '+') + formatK(Math.abs(savingsVs15K * 2));
    document.getElementById('cfPabloSavingsExample').textContent = (savingsVs15K > 0 ? '-' : '+') + formatK(Math.abs(savingsVs15K));
    document.getElementById('cfAleSavingsExample').textContent = (savingsVs15K > 0 ? '-' : '+') + formatK(Math.abs(savingsVs15K));
}

document.addEventListener('DOMContentLoaded', () => {
    // Fiscal Toggle
    const fiscalToggle = document.getElementById('fiscalOptimizeToggle');
    if (fiscalToggle) {
        fiscalToggle.addEventListener('change', (e) => {
            isOptimized = e.target.checked;
            document.body.classList.toggle('fiscal-optimized', isOptimized);

            // Update toggle labels
            document.querySelectorAll('.fiscal-toggle-label.actual').forEach(l => {
                l.classList.toggle('active', !isOptimized);
            });
            document.querySelectorAll('.fiscal-toggle-label.optimized').forEach(l => {
                l.classList.toggle('active', isOptimized);
            });

            // Update all elements with data-actual/data-opt attributes
            document.querySelectorAll('[data-actual]').forEach(el => {
                el.textContent = isOptimized ? el.dataset.opt : el.dataset.actual;
            });

            // Update bar heights
            document.querySelectorAll('[data-actual-height]').forEach(el => {
                el.style.height = isOptimized ? el.dataset.optHeight : el.dataset.actualHeight;
            });

            // Update bar widths (for horizontal flow bars)
            document.querySelectorAll('[data-actual-width]').forEach(el => {
                el.style.width = isOptimized ? el.dataset.optWidth : el.dataset.actualWidth;
            });

            // Update cash flow calculations
            updateCashFlowCalculations();

            // Update fiscal pressure data
            updateFiscalPressureData();
        });
    }

    // Needs Slider
    const needsSlider = document.getElementById('needsSlider');
    const needsValueDisplay = document.getElementById('needsValueDisplay');
    const needsYearlyDisplay = document.getElementById('needsYearlyDisplay');

    if (needsSlider) {
        needsSlider.addEventListener('input', () => {
            currentNeeds = parseInt(needsSlider.value);
            const monthlyK = currentNeeds / 1000;
            const yearlyK = (currentNeeds * 12) / 1000;

            // Update display
            if (needsValueDisplay) needsValueDisplay.textContent = monthlyK + 'K€/mes';
            if (needsYearlyDisplay) needsYearlyDisplay.textContent = yearlyK + 'K€';

            // Update cash flow calculations
            updateCashFlowCalculations();

            // Update fiscal pressure data
            updateFiscalPressureData();
        });
    }

    // Initial calculation
    updateCashFlowCalculations();
    updateFiscalPressureData();
});

// ============================================
// FISCAL PRESSURE DATA UPDATE - COMPLETE LOGIC
// ============================================
function updateFiscalPressureData() {
    // Datos base con 25K/mes (300K/ano por persona, 600K familia)
    const baseMonthlyNeeds = 25000;
    const yearlyNeeds = (currentNeeds * 12) / 1000; // K€ por persona
    const familyYearlyNeeds = yearlyNeeds * 2; // K€ familia

    // Multiplicador de necesidades (1.0 = base, <1 menos, >1 mas)
    const needsMultiplier = currentNeeds / baseMonthlyNeeds;

    // ==========================================
    // DATOS FISCALES BASE (con 25K/mes = 300K/ano)
    // ==========================================
    // IP: Impuesto Patrimonio - FIJO (no depende de ingresos, depende de riqueza)
    // IS: Impuesto Sociedades - Variable (depende de ganancias realizadas)
    // IRPF: Variable (depende de lo que sacas como salario/dividendos)

    const baseData = {
        total: {
            generation: 11180, // K€ generacion total
            ip: 462,  // K€ - FIJO
            is: 417,  // K€ - variable con realizacion
            irpf: 232 // K€ - variable con necesidades
        },
        pablo: {
            generation: 5490,
            ip: 278,
            is: 184,
            irpf: 124,
            realized: 1380, // K€
            latent: 4110   // K€
        },
        ale: {
            generation: 5690,
            ip: 184,
            is: 233,
            irpf: 109,
            realized: 1710,
            latent: 3980
        }
    };

    // ==========================================
    // CALCULO DE IMPUESTOS AJUSTADOS
    // ==========================================
    // IP: No cambia (es sobre patrimonio, no sobre ingresos)
    // IS: Escala con realizacion de ganancias (cash generado)
    // IRPF: Escala directamente con necesidades de salario

    // Factor de optimizacion DINAMICO:
    // - A menor necesidad, la optimizacion es MAS efectiva
    // - Si necesitas poco, apenas generas cash, y con optimizacion reduces aun mas
    // - A 25K/mes: optFactor = 0.8 (20% reduccion)
    // - A 10K/mes: optFactor = 0.5 (50% reduccion - casi no necesitas generar nada)
    // - A 40K/mes: optFactor = 0.9 (10% reduccion - necesitas generar mucho)
    const baseOptFactor = isOptimized ? 0.8 : 1.0;
    const optFactorAdjust = isOptimized ? (1 - needsMultiplier) * 0.4 : 0; // Bonus por necesidades bajas
    const optFactor = Math.max(0.4, baseOptFactor - optFactorAdjust);

    // Ajuste IRPF: directamente proporcional a necesidades
    // Si necesitas la mitad, pagas la mitad de IRPF
    // Con optimizacion + bajas necesidades: aun menos
    const irpfMultiplier = needsMultiplier * optFactor;

    // Ajuste IS: escala con ganancias realizadas (que dependen de necesidades)
    // Menos necesitas = menos generas = menos IS
    // La optimizacion reduce IS porque usas vehiculos de acumulacion
    const isMultiplier = (0.3 + needsMultiplier * 0.7) * optFactor;

    // Calcular nuevos valores
    const newTaxes = {
        total: {
            ip: baseData.total.ip, // FIJO
            is: Math.round(baseData.total.is * isMultiplier),
            irpf: Math.round(baseData.total.irpf * irpfMultiplier)
        },
        pablo: {
            ip: baseData.pablo.ip,
            is: Math.round(baseData.pablo.is * isMultiplier),
            irpf: Math.round(baseData.pablo.irpf * irpfMultiplier)
        },
        ale: {
            ip: baseData.ale.ip,
            is: Math.round(baseData.ale.is * isMultiplier),
            irpf: Math.round(baseData.ale.irpf * irpfMultiplier)
        }
    };

    // Totales
    newTaxes.total.total = newTaxes.total.ip + newTaxes.total.is + newTaxes.total.irpf;
    newTaxes.pablo.total = newTaxes.pablo.ip + newTaxes.pablo.is + newTaxes.pablo.irpf;
    newTaxes.ale.total = newTaxes.ale.ip + newTaxes.ale.is + newTaxes.ale.irpf;

    // Ganancias realizadas ajustadas (menos necesitas = menos realizas)
    const realizedMultiplier = 0.4 + needsMultiplier * 0.6;
    const newRealized = {
        pablo: Math.round(baseData.pablo.realized * realizedMultiplier),
        ale: Math.round(baseData.ale.realized * realizedMultiplier)
    };
    const newLatent = {
        pablo: baseData.pablo.generation - newRealized.pablo - newTaxes.pablo.total,
        ale: baseData.ale.generation - newRealized.ale - newTaxes.ale.total
    };

    // ==========================================
    // ACTUALIZAR ELEMENTOS DEL DOM
    // ==========================================

    // Helper para formatear numeros
    const formatK = (val) => {
        if (val >= 1000) return (val/1000).toFixed(2).replace('.', ',') + 'M€';
        return Math.round(val) + 'K€';
    };

    // --- TOTAL ---
    // Tarta de impuestos
    const totalTax = newTaxes.total.total;
    const ipPct = Math.round(newTaxes.total.ip / totalTax * 100);
    const isPct = Math.round(newTaxes.total.is / totalTax * 100);
    const irpfPct = 100 - ipPct - isPct;

    const circumference = 251.2; // 2 * PI * 40
    const ipDash = (ipPct / 100) * circumference;
    const isDash = (isPct / 100) * circumference;
    const irpfDash = (irpfPct / 100) * circumference;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };

    setEl('taxTotalAmount', formatK(totalTax));
    setEl('taxTotalIP', formatK(newTaxes.total.ip));
    setEl('taxTotalIS', formatK(newTaxes.total.is));
    setEl('taxTotalIRPF', formatK(newTaxes.total.irpf));
    setEl('taxTotalIPPct', ipPct + '% del total');
    setEl('taxTotalISPct', isPct + '% del total');
    setEl('taxTotalIRPFPct', irpfPct + '% del total');

    // Actualizar SVG de la tarta
    setAttr('taxPieTotalIP', 'stroke-dasharray', ipDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPieTotalIS', 'stroke-dasharray', isDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPieTotalIS', 'stroke-dashoffset', -ipDash.toFixed(1));
    setAttr('taxPieTotalIRPF', 'stroke-dasharray', irpfDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPieTotalIRPF', 'stroke-dashoffset', -(ipDash + isDash).toFixed(1));

    // KPIs
    setEl('kpiTotalTaxes', formatK(totalTax));
    const totalRealized = newRealized.pablo + newRealized.ale;
    const totalLatent = newLatent.pablo + newLatent.ale;
    setEl('kpiTotalRealized', formatK(totalRealized));
    setEl('kpiTotalLatent', formatK(totalLatent));

    // Donut presion fiscal total
    const totalGeneration = baseData.total.generation;
    const totalRate = (totalTax / totalGeneration * 100).toFixed(1).replace('.', ',');
    const netWealth = totalGeneration - totalTax;
    const netPct = Math.round(netWealth / totalGeneration * 100);
    const taxPct = 100 - netPct;

    setEl('donutTotalRate', totalRate + '%');
    setEl('donutTotalNet', formatK(netWealth));
    setEl('donutTotalTax', formatK(totalTax));
    setEl('donutTotalNetPct', netPct + '% de lo generado');
    setEl('donutTotalTaxPct', taxPct + '% de lo generado');

    // --- PABLO (en seccion Total y seccion propia) ---
    const pabloRate = (newTaxes.pablo.total / baseData.pablo.generation * 100).toFixed(1).replace('.', ',');
    const pabloNetWealth = baseData.pablo.generation - newTaxes.pablo.total;
    const pabloNetPct = Math.round(pabloNetWealth / baseData.pablo.generation * 100);
    const pabloTaxPct = 100 - pabloNetPct;

    // Seccion Total - desglose
    setEl('pabloRealized', formatK(newRealized.pablo));
    setEl('pabloLatent', formatK(newLatent.pablo));
    setEl('pabloTaxes', '-' + formatK(newTaxes.pablo.total));
    setEl('pabloRate', pabloRate + '%');

    // Seccion Pablo - donut
    setEl('donutPabloRate', pabloRate + '%');
    setEl('donutPabloNet', formatK(pabloNetWealth));
    setEl('donutPabloTax', formatK(newTaxes.pablo.total));
    setEl('donutPabloNetPct', pabloNetPct + '% de lo generado');
    setEl('donutPabloTaxPct', pabloTaxPct + '% de lo generado');

    // Seccion Pablo - KPIs
    setEl('kpiPabloRealized', formatK(newRealized.pablo));
    setEl('kpiPabloLatent', formatK(newLatent.pablo));
    setEl('kpiPabloTaxes', formatK(newTaxes.pablo.total));
    setEl('kpiPabloTaxDetail', 'IP ' + formatK(newTaxes.pablo.ip) + ' + IS ' + formatK(newTaxes.pablo.is) + ' + IRPF ' + formatK(newTaxes.pablo.irpf));

    // Seccion Pablo - Tax Pie
    const pabloTotalTax = newTaxes.pablo.total;
    const pabloIPPct = Math.round(newTaxes.pablo.ip / pabloTotalTax * 100);
    const pabloISPct = Math.round(newTaxes.pablo.is / pabloTotalTax * 100);
    const pabloIRPFPct = 100 - pabloIPPct - pabloISPct;
    const pabloIPDash = (pabloIPPct / 100) * circumference;
    const pabloISDash = (pabloISPct / 100) * circumference;
    const pabloIRPFDash = (pabloIRPFPct / 100) * circumference;

    setEl('taxPabloAmount', formatK(pabloTotalTax));
    setEl('taxPabloIP', formatK(newTaxes.pablo.ip));
    setEl('taxPabloIS', formatK(newTaxes.pablo.is));
    setEl('taxPabloIRPF', formatK(newTaxes.pablo.irpf));
    setEl('taxPabloIPPct', pabloIPPct + '% del total');
    setEl('taxPabloISPct', pabloISPct + '% del total');
    setEl('taxPabloIRPFPct', pabloIRPFPct + '% del total');

    setAttr('taxPiePabloIP', 'stroke-dasharray', pabloIPDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPiePabloIS', 'stroke-dasharray', pabloISDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPiePabloIS', 'stroke-dashoffset', -pabloIPDash.toFixed(1));
    setAttr('taxPiePabloIRPF', 'stroke-dasharray', pabloIRPFDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPiePabloIRPF', 'stroke-dashoffset', -(pabloIPDash + pabloISDash).toFixed(1));

    // --- ALE (en seccion Total y seccion propia) ---
    const aleRate = (newTaxes.ale.total / baseData.ale.generation * 100).toFixed(1).replace('.', ',');
    const aleNetWealth = baseData.ale.generation - newTaxes.ale.total;
    const aleNetPct = Math.round(aleNetWealth / baseData.ale.generation * 100);
    const aleTaxPct = 100 - aleNetPct;

    // Seccion Total - desglose
    setEl('aleRealized', formatK(newRealized.ale));
    setEl('aleLatent', formatK(newLatent.ale));
    setEl('aleTaxes', '-' + formatK(newTaxes.ale.total));
    setEl('aleRate', aleRate + '%');

    // Seccion Ale - donut
    setEl('donutAleRate', aleRate + '%');
    setEl('donutAleNet', formatK(aleNetWealth));
    setEl('donutAleTax', formatK(newTaxes.ale.total));
    setEl('donutAleNetPct', aleNetPct + '% de lo generado');
    setEl('donutAleTaxPct', aleTaxPct + '% de lo generado');

    // Seccion Ale - KPIs
    setEl('kpiAleRealized', formatK(newRealized.ale));
    setEl('kpiAleLatent', formatK(newLatent.ale));
    setEl('kpiAleTaxes', formatK(newTaxes.ale.total));
    setEl('kpiAleTaxDetail', 'IP ' + formatK(newTaxes.ale.ip) + ' + IS ' + formatK(newTaxes.ale.is) + ' + IRPF ' + formatK(newTaxes.ale.irpf));

    // Seccion Ale - Tax Pie (nota: Ale tiene orden IS, IP, IRPF)
    const aleTotalTax = newTaxes.ale.total;
    const aleISPct = Math.round(newTaxes.ale.is / aleTotalTax * 100);
    const aleIPPct = Math.round(newTaxes.ale.ip / aleTotalTax * 100);
    const aleIRPFPct = 100 - aleISPct - aleIPPct;
    const aleISDash = (aleISPct / 100) * circumference;
    const aleIPDash = (aleIPPct / 100) * circumference;
    const aleIRPFDash = (aleIRPFPct / 100) * circumference;

    setEl('taxAleAmount', formatK(aleTotalTax));
    setEl('taxAleIS', formatK(newTaxes.ale.is));
    setEl('taxAleIP', formatK(newTaxes.ale.ip));
    setEl('taxAleIRPF', formatK(newTaxes.ale.irpf));
    setEl('taxAleISPct', aleISPct + '% del total');
    setEl('taxAleIPPct', aleIPPct + '% del total');
    setEl('taxAleIRPFPct', aleIRPFPct + '% del total');

    setAttr('taxPieAleIS', 'stroke-dasharray', aleISDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPieAleIP', 'stroke-dasharray', aleIPDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPieAleIP', 'stroke-dashoffset', -aleISDash.toFixed(1));
    setAttr('taxPieAleIRPF', 'stroke-dasharray', aleIRPFDash.toFixed(1) + ' ' + circumference);
    setAttr('taxPieAleIRPF', 'stroke-dashoffset', -(aleISDash + aleIPDash).toFixed(1));

    // ==========================================
    // ACTUALIZAR BARRA DE DISTRIBUCION
    // ==========================================
    const totalGen = baseData.total.generation;
    const latentPct = Math.round(totalLatent / totalGen * 100);
    const realizedPct = Math.round(totalRealized / totalGen * 100);
    const taxesPct = 100 - latentPct - realizedPct;

    document.querySelectorAll('.fiscal-flow-segment.latent').forEach(el => {
        el.style.width = latentPct + '%';
        el.textContent = latentPct + '%';
    });
    document.querySelectorAll('.fiscal-flow-segment.realized').forEach(el => {
        el.style.width = realizedPct + '%';
        const span = el.querySelector('span');
        if (span) span.textContent = realizedPct + '%';
        else el.textContent = realizedPct + '%';
    });
    document.querySelectorAll('.fiscal-flow-segment.taxes').forEach(el => {
        el.style.width = taxesPct + '%';
        const span = el.querySelector('span');
        if (span) span.textContent = taxesPct + '%';
        else el.textContent = taxesPct + '%';
    });

    // ==========================================
    // ACTUALIZAR TABLAS DE DATOS DE REFERENCIA
    // ==========================================

    // Tabla 2: Desglose de Generacion
    setEl('refPabloRealized', formatK(newRealized.pablo));
    setEl('refAleRealized', formatK(newRealized.ale));
    setEl('refTotalRealized', formatK(totalRealized));

    setEl('refPabloLatent', formatK(newLatent.pablo));
    setEl('refAleLatent', formatK(newLatent.ale));
    setEl('refTotalLatent', formatK(totalLatent));

    const pabloLatentPct = Math.round(newLatent.pablo / baseData.pablo.generation * 100);
    const aleLatentPct = Math.round(newLatent.ale / baseData.ale.generation * 100);
    const totalLatentPctCalc = Math.round(totalLatent / totalGeneration * 100);
    setEl('refPabloLatentPct', pabloLatentPct + '%');
    setEl('refAleLatentPct', aleLatentPct + '%');
    setEl('refTotalLatentPct', totalLatentPctCalc + '%');

    // Tabla 4: Parametros Actuales
    setEl('refCurrentNeeds', Math.round(currentNeeds/1000) + 'K€/mes');
    setEl('refNeedsMultiplier', needsMultiplier.toFixed(2));
    setEl('refOptActive', isOptimized ? 'Si' : 'No');
    setEl('refOptFactor', optFactor.toFixed(2));

    // Tabla 4: Impuestos Calculados
    setEl('refCalcPabloIP', formatK(newTaxes.pablo.ip));
    setEl('refCalcAleIP', formatK(newTaxes.ale.ip));
    setEl('refCalcTotalIP', formatK(newTaxes.total.ip));

    setEl('refCalcPabloIS', formatK(newTaxes.pablo.is));
    setEl('refCalcAleIS', formatK(newTaxes.ale.is));
    setEl('refCalcTotalIS', formatK(newTaxes.total.is));

    setEl('refCalcPabloIRPF', formatK(newTaxes.pablo.irpf));
    setEl('refCalcAleIRPF', formatK(newTaxes.ale.irpf));
    setEl('refCalcTotalIRPF', formatK(newTaxes.total.irpf));

    setEl('refCalcPabloTotal', formatK(newTaxes.pablo.total));
    setEl('refCalcAleTotal', formatK(newTaxes.ale.total));
    setEl('refCalcTotal', formatK(newTaxes.total.total));

    setEl('refCalcPabloRate', pabloRate + '%');
    setEl('refCalcAleRate', aleRate + '%');
    setEl('refCalcTotalRate', totalRate + '%');

    // Tabla 5: Cash Flow
    const pabloYearlyNeeds = yearlyNeeds; // K€
    const aleYearlyNeeds = yearlyNeeds;
    const familyNeeds = yearlyNeeds * 2;

    setEl('refCfPabloNeeds', Math.round(pabloYearlyNeeds) + 'K€');
    setEl('refCfAleNeeds', Math.round(aleYearlyNeeds) + 'K€');
    setEl('refCfTotalNeeds', Math.round(familyNeeds) + 'K€');

    // Excedente = Realizado - Impuestos - Necesidades
    const pabloExcess = newRealized.pablo - newTaxes.pablo.total - pabloYearlyNeeds;
    const aleExcess = newRealized.ale - newTaxes.ale.total - aleYearlyNeeds;
    const totalExcess = pabloExcess + aleExcess;

    const formatExcess = (val) => {
        const formatted = formatK(Math.abs(val));
        return val < 0 ? '-' + formatted : formatted;
    };

    setEl('refCfPabloExcess', formatExcess(pabloExcess));
    setEl('refCfAleExcess', formatExcess(aleExcess));
    setEl('refCfTotalExcess', formatExcess(totalExcess));
}
