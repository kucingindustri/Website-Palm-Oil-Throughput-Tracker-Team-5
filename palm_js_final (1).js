// ============================================
// PALM.JS - TBS & OER Monitoring System
// Updated: Siklus Harian, TBS vs OER Scatter, KPI vs Target 22%
// FIXED: Scatter & Kondisi Charts Display
// ============================================

// Data Storage
let productionData = [];

// Chart Instances
let weeklyChart, scatterChart, kondisiChart, pieChart;

// Target OER
const TARGET_OER = 22;

// ============================================
// 1. NAVIGATION SYSTEM
// ============================================
function navigateTo(sectionId) {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const targetLink = document.querySelector(`a[href="#${sectionId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    if (sectionId === 'livefeed') {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }

    if (sectionId === 'kpi') {
        updateKPICards();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// 2. INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Loaded - Initializing...');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            navigateTo(targetId);
        });
    });

    loadData();
    
    // Delay chart initialization to ensure DOM is ready
    setTimeout(() => {
        initializeCharts();
    }, 100);
    
    const form = document.getElementById('dataForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

// ============================================
// 3. DATA MANAGEMENT
// ============================================
function loadData() {
    const savedData = localStorage.getItem('palmOilData');
    if (savedData) {
        productionData = JSON.parse(savedData);
        console.log('Data loaded from localStorage:', productionData.length, 'entries');
        updateTable();
        updateCharts();
        updateKPICards();
    } else {
        console.log('No saved data, loading sample data...');
        loadSampleData();
    }
}

function saveData() {
    localStorage.setItem('palmOilData', JSON.stringify(productionData));
    console.log('Data saved to localStorage');
}

function loadSampleData() {
    // Sample data dengan pola: volume tinggi = OER rendah
    productionData = [
        { hari: 'Senin', tbs: 420, oer: 22.8, pks: 98, kondisi: 'Normal' },
        { hari: 'Selasa', tbs: 480, oer: 22.3, pks: 112, kondisi: 'Normal' },
        { hari: 'Rabu', tbs: 580, oer: 20.5, pks: 145, kondisi: 'Overload' },
        { hari: 'Kamis', tbs: 610, oer: 19.8, pks: 158, kondisi: 'Overload' },
        { hari: 'Jumat', tbs: 450, oer: 22.6, pks: 105, kondisi: 'Normal' },
        { hari: 'Sabtu', tbs: 380, oer: 23.5, pks: 88, kondisi: 'Underload' },
        { hari: 'Minggu', tbs: 320, oer: 24.2, pks: 75, kondisi: 'Underload' }
    ];
    console.log('Sample data loaded:', productionData.length, 'entries');
    saveData();
    updateTable();
    updateCharts();
    updateKPICards();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const newData = {
        hari: document.getElementById('hari').value,
        tbs: parseFloat(document.getElementById('totalTBS').value),
        oer: parseFloat(document.getElementById('oer').value),
        pks: parseFloat(document.getElementById('pks').value),
        kondisi: document.getElementById('kondisi').value
    };
    
    productionData.push(newData);
    saveData();
    updateTable();
    updateCharts();
    updateKPICards();
    
    e.target.reset();
    alert('✅ Data berhasil disimpan!');
    navigateTo('livefeed');
}

function deleteData(index) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        productionData.splice(index, 1);
        saveData();
        updateTable();
        updateCharts();
        updateKPICards();
    }
}

function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data?')) {
        productionData = [];
        saveData();
        updateTable();
        updateCharts();
        updateKPICards();
        alert('✅ Semua data telah dihapus!');
    }
}

// ============================================
// 4. TABLE UPDATE
// ============================================
function updateTable() {
    const tbody = document.getElementById('tableBody');
    
    if (productionData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Belum ada data. Silakan input data terlebih dahulu.</td></tr>';
        return;
    }
    
    tbody.innerHTML = productionData.map((data, index) => {
        const diff = data.oer - TARGET_OER;
        const statusClass = diff >= 0 ? 'status-good' : diff >= -1 ? 'status-warning' : 'status-danger';
        const statusText = diff >= 0 ? `+${diff.toFixed(1)}% ✓` : `${diff.toFixed(1)}% ✗`;
        
        return `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${data.hari}</strong></td>
            <td>${data.tbs} ton</td>
            <td><strong>${data.oer}%</strong></td>
            <td>${data.pks} ton</td>
            <td><span style="
                padding: 5px 12px; 
                border-radius: 20px; 
                font-weight: 600;
                background-color: ${
                    data.kondisi === 'Overload' ? '#f8d7da' :
                    data.kondisi === 'Normal' ? '#d4edda' : '#fff3cd'
                };
                color: ${
                    data.kondisi === 'Overload' ? '#721c24' :
                    data.kondisi === 'Normal' ? '#155724' : '#856404'
                };
            ">${data.kondisi}</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><button class="btn-delete" onclick="deleteData(${index})">🗑️</button></td>
        </tr>
    `}).join('');
}

// ============================================
// 5. CHART INITIALIZATION - FIXED
// ============================================
function initializeCharts() {
    console.log('Initializing charts...');
    
    // 1. WEEKLY CHART - Line Chart Siklus Harian TBS
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx) {
        console.log('Creating weekly chart...');
        weeklyChart = new Chart(weeklyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Volume TBS (Ton)',
                    data: [],
                    borderColor: '#2d5016',
                    backgroundColor: 'rgba(45, 80, 22, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#2d5016',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            color: '#2d5016'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#2d5016',
                        bodyColor: '#2c3e50',
                        borderColor: '#2d5016',
                        borderWidth: 2,
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Volume TBS (Ton)',
                            font: { size: 14, weight: 'bold' },
                            color: '#2d5016'
                        },
                        ticks: {
                            color: '#2d5016',
                            font: { weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(45, 80, 22, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Hari (Senin - Minggu)',
                            font: { size: 14, weight: 'bold' },
                            color: '#2d5016'
                        },
                        ticks: {
                            color: '#2c3e50',
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });
        console.log('Weekly chart created successfully');
    } else {
        console.error('weeklyChart canvas not found!');
    }

    // 2. SCATTER CHART - TBS vs OER (Hubungan Invers) - FIXED
    const scatterCtx = document.getElementById('scatterChart');
    if (scatterCtx) {
        console.log('Creating scatter chart...');
        // Destroy existing chart if any
        if (scatterChart) {
            scatterChart.destroy();
        }
        
        scatterChart = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Volume TBS vs OER (%)',
                    data: [],
                    backgroundColor: function(context) {
                        const value = context.parsed ? context.parsed.y : 0;
                        if (value >= TARGET_OER) return 'rgba(40, 167, 69, 0.7)';
                        if (value >= TARGET_OER - 1) return 'rgba(255, 193, 7, 0.7)';
                        return 'rgba(220, 53, 69, 0.7)';
                    },
                    borderColor: function(context) {
                        const value = context.parsed ? context.parsed.y : 0;
                        if (value >= TARGET_OER) return '#28a745';
                        if (value >= TARGET_OER - 1) return '#ffc107';
                        return '#dc3545';
                    },
                    borderWidth: 2,
                    pointRadius: 10,
                    pointHoverRadius: 14
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 14, weight: 'bold' },
                            color: '#2d5016'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#2d5016',
                        bodyColor: '#2c3e50',
                        borderColor: '#2d5016',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const diff = context.parsed.y - TARGET_OER;
                                return [
                                    `Volume TBS: ${context.parsed.x} ton`,
                                    `OER: ${context.parsed.y}%`,
                                    `vs Target 22%: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Volume TBS (Ton)',
                            font: { size: 14, weight: 'bold' },
                            color: '#2d5016'
                        },
                        ticks: {
                            font: { weight: 'bold' }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'OER (%) - Target: 22%',
                            font: { size: 14, weight: 'bold' },
                            color: '#2d5016'
                        },
                        ticks: {
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        });
        console.log('Scatter chart created successfully');
    } else {
        console.error('scatterChart canvas not found!');
    }

    // 3. KONDISI CHART - Doughnut - FIXED
    const kondisiCtx = document.getElementById('kondisiChart');
    if (kondisiCtx) {
        console.log('Creating kondisi chart...');
        // Destroy existing chart if any
        if (kondisiChart) {
            kondisiChart.destroy();
        }
        
        kondisiChart = new Chart(kondisiCtx, {
            type: 'doughnut',
            data: {
                labels: ['Overload', 'Normal', 'Underload'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(45, 80, 22, 0.8)',
                        'rgba(212, 160, 23, 0.8)'
                    ],
                    borderColor: [
                        '#dc3545',
                        '#2d5016',
                        '#d4a017'
                    ],
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 13, weight: 'bold' },
                            padding: 15,
                            color: '#2d5016'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#2d5016',
                        bodyColor: '#2c3e50',
                        borderColor: '#2d5016',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} kejadian (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        console.log('Kondisi chart created successfully');
    } else {
        console.error('kondisiChart canvas not found!');
    }

    // 4. PIE CHART - Volume TBS pada PKS - NEW
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        console.log('Creating pie chart for TBS volume...');
        // Destroy existing chart if any
        if (pieChart) {
            pieChart.destroy();
        }
        
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    label: 'Volume TBS (Ton)',
                    data: [],
                    backgroundColor: [
                        'rgba(45, 80, 22, 0.9)',
                        'rgba(58, 107, 30, 0.9)',
                        'rgba(40, 167, 69, 0.9)',
                        'rgba(212, 160, 23, 0.9)',
                        'rgba(220, 53, 69, 0.9)',
                        'rgba(255, 193, 7, 0.9)',
                        'rgba(23, 162, 184, 0.9)',
                        'rgba(111, 66, 193, 0.9)',
                        'rgba(253, 126, 20, 0.9)',
                        'rgba(232, 62, 140, 0.9)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 11, weight: 'bold' },
                            padding: 10,
                            color: '#2d5016',
                            boxWidth: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#2d5016',
                        bodyColor: '#2c3e50',
                        borderColor: '#2d5016',
                        borderWidth: 2,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} ton (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        console.log('Pie chart created successfully');
    } else {
        console.error('pieChart canvas not found!');
    }

    // Update charts with data
    updateCharts();
}

// ============================================
// 6. CHART UPDATE - FIXED
// ============================================
function updateCharts() {
    console.log('Updating charts with data...');
    
    if (productionData.length === 0) {
        console.log('No data to display in charts');
        return;
    }

    // Sort data by day order for weekly chart
    const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sortedData = [...productionData].sort((a, b) => {
        return dayOrder.indexOf(a.hari) - dayOrder.indexOf(b.hari);
    });

    // Update Weekly Chart (Line Chart Siklus Harian)
    if (weeklyChart) {
        weeklyChart.data.labels = sortedData.map(d => d.hari);
        weeklyChart.data.datasets[0].data = sortedData.map(d => d.tbs);
        weeklyChart.update();
        console.log('Weekly chart updated with', sortedData.length, 'data points');
    }

    // Update Scatter Chart (TBS vs OER) - FIXED
    if (scatterChart) {
        const scatterData = productionData.map(d => ({
            x: d.tbs,
            y: d.oer
        }));
        
        scatterChart.data.datasets[0].data = scatterData;
        scatterChart.update();
        console.log('Scatter chart updated with', scatterData.length, 'data points:', scatterData);
    } else {
        console.error('Scatter chart not initialized!');
    }

    // Update Kondisi Chart - FIXED
    if (kondisiChart) {
        const overloadCount = productionData.filter(d => d.kondisi === 'Overload').length;
        const normalCount = productionData.filter(d => d.kondisi === 'Normal').length;
        const underloadCount = productionData.filter(d => d.kondisi === 'Underload').length;
        
        kondisiChart.data.datasets[0].data = [overloadCount, normalCount, underloadCount];
        kondisiChart.update();
        console.log('Kondisi chart updated - Overload:', overloadCount, 'Normal:', normalCount, 'Underload:', underloadCount);
    } else {
        console.error('Kondisi chart not initialized!');
    }

    // Update Pie Chart - Volume TBS pada PKS
    if (pieChart) {
        // Group data by week and sum TBS volume
        const weeklyData = {};
        productionData.forEach((d, index) => {
            const weekNum = Math.floor(index / 7) + 1;
            const weekLabel = `Minggu ${weekNum}`;
            if (!weeklyData[weekLabel]) {
                weeklyData[weekLabel] = 0;
            }
            weeklyData[weekLabel] += d.tbs;
        });
        
        pieChart.data.labels = Object.keys(weeklyData);
        pieChart.data.datasets[0].data = Object.values(weeklyData);
        pieChart.update();
        console.log('Pie chart updated with weekly TBS volumes:', weeklyData);
    } else {
        console.error('Pie chart not initialized!');
    }

    // Update Statistics
    updateStatistics();
}

// ============================================
// 6B. UPDATE STATISTICS - NEW
// ============================================
function updateStatistics() {
    if (productionData.length === 0) return;

    const totalData = productionData.length;
    const avgTBS = (productionData.reduce((sum, d) => sum + d.tbs, 0) / totalData).toFixed(1);
    const avgOER = (productionData.reduce((sum, d) => sum + d.oer, 0) / totalData).toFixed(2);
    const maxTBS = Math.max(...productionData.map(d => d.tbs));
    const minTBS = Math.min(...productionData.map(d => d.tbs));
    const maxOER = Math.max(...productionData.map(d => d.oer));
    const minOER = Math.min(...productionData.map(d => d.oer));

    // Update DOM elements
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    updateElement('totalDataPoints', totalData);
    updateElement('avgTBS', avgTBS + ' ton');
    updateElement('avgOER', avgOER + '%');
    updateElement('maxTBS', maxTBS + ' ton');
    updateElement('minTBS', minTBS + ' ton');
    updateElement('maxOER', maxOER + '%');
    updateElement('minOER', minOER + '%');

    console.log('Statistics updated:', { totalData, avgTBS, avgOER, maxTBS, minTBS, maxOER, minOER });
}

// ============================================
// 7. KPI CARDS UPDATE (vs Target 22%)
// ============================================
function updateKPICards() {
    if (productionData.length === 0) return;

    const overloadData = productionData.filter(d => d.kondisi === 'Overload');
    const normalData = productionData.filter(d => d.kondisi === 'Normal');
    const underloadData = productionData.filter(d => d.kondisi === 'Underload');

    // Helper function to format target comparison
    function formatTargetDiff(avgOER) {
        const diff = avgOER - TARGET_OER;
        if (diff >= 0) {
            return `<span style="color: #28a745;">+${diff.toFixed(1)}% ✓ Di atas target</span>`;
        } else if (diff >= -1) {
            return `<span style="color: #ffc107;">${diff.toFixed(1)}% ⚠ Mendekati target</span>`;
        } else {
            return `<span style="color: #dc3545;">${diff.toFixed(1)}% ✗ Di bawah target</span>`;
        }
    }

    // Overload KPI
    if (overloadData.length > 0) {
        const avgOER = overloadData.reduce((sum, d) => sum + d.oer, 0) / overloadData.length;
        document.getElementById('kpiOverloadOER').textContent = avgOER.toFixed(1) + '%';
        document.getElementById('kpiOverloadCount').textContent = overloadData.length + ' kejadian';
        document.getElementById('kpiOverloadTarget').innerHTML = formatTargetDiff(avgOER);
        document.getElementById('kpiOverloadTrend').textContent = '⚠️ Volume tinggi menurunkan OER';
        document.getElementById('kpiOverloadTrend').style.backgroundColor = '#f8d7da';
        document.getElementById('kpiOverloadTrend').style.color = '#721c24';
    } else {
        document.getElementById('kpiOverloadOER').textContent = '0%';
        document.getElementById('kpiOverloadCount').textContent = '0 kejadian';
        document.getElementById('kpiOverloadTarget').textContent = 'Tidak ada data';
        document.getElementById('kpiOverloadTrend').textContent = '-';
    }

    // Normal KPI
    if (normalData.length > 0) {
        const avgOER = normalData.reduce((sum, d) => sum + d.oer, 0) / normalData.length;
        document.getElementById('kpiNormalOER').textContent = avgOER.toFixed(1) + '%';
        document.getElementById('kpiNormalCount').textContent = normalData.length + ' kejadian';
        document.getElementById('kpiNormalTarget').innerHTML = formatTargetDiff(avgOER);
        document.getElementById('kpiNormalTrend').textContent = '✓ Volume optimal untuk target OER';
        document.getElementById('kpiNormalTrend').style.backgroundColor = '#d4edda';
        document.getElementById('kpiNormalTrend').style.color = '#155724';
    } else {
        document.getElementById('kpiNormalOER').textContent = '0%';
        document.getElementById('kpiNormalCount').textContent = '0 kejadian';
        document.getElementById('kpiNormalTarget').textContent = 'Tidak ada data';
        document.getElementById('kpiNormalTrend').textContent = '-';
    }

    // Underload KPI
    if (underloadData.length > 0) {
        const avgOER = underloadData.reduce((sum, d) => sum + d.oer, 0) / underloadData.length;
        document.getElementById('kpiUnderloadOER').textContent = avgOER.toFixed(1) + '%';
        document.getElementById('kpiUnderloadCount').textContent = underloadData.length + ' kejadian';
        document.getElementById('kpiUnderloadTarget').innerHTML = formatTargetDiff(avgOER);
        document.getElementById('kpiUnderloadTrend').textContent = '📈 OER tinggi tapi volume rendah';
        document.getElementById('kpiUnderloadTrend').style.backgroundColor = '#fff3cd';
        document.getElementById('kpiUnderloadTrend').style.color = '#856404';
    } else {
        document.getElementById('kpiUnderloadOER').textContent = '0%';
        document.getElementById('kpiUnderloadCount').textContent = '0 kejadian';
        document.getElementById('kpiUnderloadTarget').textContent = 'Tidak ada data';
        document.getElementById('kpiUnderloadTrend').textContent = '-';
    }
}

// ============================================
// 8. GLOBAL FUNCTIONS
// ============================================
window.navigateTo = navigateTo;
window.deleteData = deleteData;
window.clearAllData = clearAllData;