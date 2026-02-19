// app.js - Versión simplificada y estable

const API_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec '; // REEMPLAZAR

const Utils = {
    formatMoney: (amount) => '$' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
    formatDate: (date) => date ? new Date(date).toLocaleDateString('es-ES') : '',
    getCurrentMonth: () => ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'][new Date().getMonth()],
    showToast: (msg, type = 'success') => {
        const toast = document.getElementById('toast');
        document.getElementById('toastMessage').textContent = msg;
        toast.querySelector('i').style.color = type === 'success' ? '#10b981' : '#ef4444';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
};

class App {
    constructor() {
        this.token = sessionStorage.getItem('er_token');
        this.user = JSON.parse(sessionStorage.getItem('er_user') || 'null');
        this.init();
    }
    
    init() {
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.login(e));
        document.getElementById('movimientoForm')?.addEventListener('submit', (e) => this.saveMovimiento(e));
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.view);
            });
        });
        
        // Fecha actual
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('mFecha') && (document.getElementById('mFecha').value = today);
        document.getElementById('informeFecha') && (document.getElementById('informeFecha').value = today);
        document.getElementById('currentDate') && (document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}));
        
        if (this.token && this.user) this.showApp();
    }
    
    async login(e) {
        e.preventDefault();
        const token = document.getElementById('tokenInput').value.trim();
        const btn = document.getElementById('loginBtn');
        const error = document.getElementById('loginError');
        
        btn.disabled = true;
        btn.textContent = 'Verificando...';
        error.style.display = 'none';
        
        try {
            // Simulación - reemplazar con llamada real a API
            if (token.length > 5) {
                this.token = token;
                this.user = { nombre: 'Usuario Demo', rol: 'admin', zona: 'ZSO' };
                sessionStorage.setItem('er_token', token);
                sessionStorage.setItem('er_user', JSON.stringify(this.user));
                this.showApp();
            } else {
                throw new Error('Token inválido');
            }
        } catch (err) {
            error.style.display = 'block';
            document.getElementById('errorText').textContent = err.message;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Iniciar Sesión';
        }
    }
    
    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appContainer').style.display = 'flex';
        document.getElementById('userName').textContent = this.user.nombre;
        document.getElementById('userRole').textContent = this.user.rol;
        document.getElementById('userZona').textContent = this.user.zona;
        this.loadDashboard();
    }
    
    logout() {
        sessionStorage.clear();
        location.reload();
    }
    
    navigate(view) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${view}`)?.classList.add('active');
        document.getElementById('pageTitle').textContent = view.charAt(0).toUpperCase() + view.slice(1);
        
        if (view === 'dashboard') this.loadDashboard();
        if (view === 'cuotas') this.loadCuotas();
        if (view === 'control') this.loadControl();
    }
    
    loadDashboard() {
        // Datos de ejemplo
        document.getElementById('dashSaldo').textContent = Utils.formatMoney(1500.50);
        document.getElementById('dashIngresos').textContent = Utils.formatMoney(2500.00);
        document.getElementById('dashGastos').textContent = Utils.formatMoney(999.50);
        document.getElementById('dashCuotas').textContent = '45/58';
        
        document.getElementById('recentActivity').innerHTML = `
            <div style="display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px; margin-bottom: 8px;">
                <div>
                    <p style="font-weight: 500;">Cuotas zonales enero</p>
                    <p style="font-size: 12px; color: #6b7280;">Hoy • 510103.-Cuotas*</p>
                </div>
                <span style="color: #10b981; font-weight: bold;">+${Utils.formatMoney(180)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 8px;">
                <div>
                    <p style="font-weight: 500;">Compra de materiales</p>
                    <p style="font-size: 12px; color: #6b7280;">Hoy • 41010102.-Papelería</p>
                </div>
                <span style="color: #ef4444; font-weight: bold;">-${Utils.formatMoney(45.50)}</span>
            </div>
        `;
    }
    
    loadCuotas() {
        const tbody = document.getElementById('cuotasTableBody');
        const destacamentos = [
            [1, 'HEROES POR LA FE', 'FILADELFIA', 'X', 'X', '', '', '', '', '', '', '', '', '', '', 2],
            [2, 'LEONES', 'JOSUE AIDA', 'X', 'X', 'X', '', '', '', '', '', '', '', '', '', 3],
            [3, 'ASAF HEMAN', 'MTE. LOS OLIVOS', 'X', '', '', '', '', '', '', '', '', '', '', '', 1],
        ];
        
        tbody.innerHTML = destacamentos.map(d => `
            <tr>
                <td>${d[0]}</td>
                <td>${d[1]}</td>
                <td>${d[2]}</td>
                ${d.slice(3, 15).map(m => `<td style="text-align: center;"><span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%; background: ${m === 'X' ? '#d1fae5' : '#f3f4f6'}; color: ${m === 'X' ? '#065f46' : '#9ca3af'}; line-height: 24px; font-size: 12px; font-weight: bold;">${m === 'X' ? '✓' : '·'}</span></td>`).join('')}
                <td style="text-align: center;"><span style="background: ${d[15] === 12 ? '#d1fae5' : '#fef3c7'}; color: ${d[15] === 12 ? '#065f46' : '#92400e'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">${d[15]}/12</span></td>
            </tr>
        `).join('');
    }
    
    loadControl() {
        const tbody = document.getElementById('controlTableBody');
        tbody.innerHTML = `
            <tr>
                <td>19/02/2025</td>
                <td>Cuotas zonales</td>
                <td>Asaf Heman</td>
                <td>Recibo 0125</td>
                <td>510103.-Cuotas*</td>
                <td style="text-align: right; color: #10b981; font-weight: 500;">${Utils.formatMoney(18.00)}</td>
                <td style="text-align: right;"></td>
                <td style="text-align: right; font-weight: bold;">${Utils.formatMoney(1518.50)}</td>
            </tr>
            <tr>
                <td>19/02/2025</td>
                <td>Compra de útiles</td>
                <td>Papelería Central</td>
                <td>Factura 001</td>
                <td>41010102.-Papelería</td>
                <td style="text-align: right;"></td>
                <td style="text-align: right; color: #ef4444; font-weight: 500;">${Utils.formatMoney(45.50)}</td>
                <td style="text-align: right; font-weight: bold;">${Utils.formatMoney(1473.00)}</td>
            </tr>
        `;
    }
    
    updateCuentas() {
        const tipo = document.getElementById('mTipo').value;
        const select = document.getElementById('mCuenta');
        const cuentasIngreso = [
            {cod: '510101', nom: 'Diezmos'},
            {cod: '510102', nom: 'Ofrendas'},
            {cod: '510103', nom: 'Cuotas*'},
            {cod: '510104', nom: 'Inscripción Destacamentos*'}
        ];
        const cuentasGasto = [
            {cod: '41010101', nom: 'Viáticos y Transporte'},
            {cod: '41010102', nom: 'Papelería y útiles'},
            {cod: '41010103', nom: 'Alimentación'}
        ];
        
        const cuentas = tipo === '1' ? cuentasIngreso : cuentasGasto;
        select.innerHTML = '<option value="">Seleccionar cuenta...</option>' + 
            cuentas.map(c => `<option value="${c.cod}">${c.cod}.-${c.nom}</option>`).join('');
    }
    
    async saveMovimiento(e) {
        e.preventDefault();
        Utils.showToast('Movimiento guardado correctamente');
        document.getElementById('movimientoForm').reset();
    }
    
    generarInforme() {
        const mes = document.getElementById('informeMes').value;
        document.getElementById('informeContainer').innerHTML = `
            <div style="border: 2px solid #1e40af; padding: 40px; max-width: 800px; margin: 0 auto; background: white;">
                <div style="text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #1e40af; font-size: 24px; margin-bottom: 8px;">EXPLORADORES DEL REY</h1>
                    <h2 style="font-size: 18px;">INFORME FINANCIERO - ${mes} 2025</h2>
                </div>
                <table style="width: 100%; margin-bottom: 20px;">
                    <tr style="background: #dbeafe;">
                        <td style="padding: 12px; font-weight: bold;">CONCEPTO</td>
                        <td style="padding: 12px; font-weight: bold; text-align: right;">MONTO</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Saldo Inicial</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Utils.formatMoney(1000)}</td>
                    </tr>
                    <tr style="background: #d1fae5;">
                        <td style="padding: 12px; font-weight: bold;">TOTAL INGRESOS</td>
                        <td style="padding: 12px; font-weight: bold; text-align: right; color: #065f46;">${Utils.formatMoney(2500)}</td>
                    </tr>
                    <tr style="background: #fee2e2;">
                        <td style="padding: 12px; font-weight: bold;">TOTAL GASTOS</td>
                        <td style="padding: 12px; font-weight: bold; text-align: right; color: #991b1b;">${Utils.formatMoney(999.50)}</td>
                    </tr>
                    <tr style="background: #1e40af; color: white;">
                        <td style="padding: 16px; font-weight: bold; font-size: 18px;">SALDO FINAL</td>
                        <td style="padding: 16px; font-weight: bold; text-align: right; font-size: 18px;">${Utils.formatMoney(2500.50)}</td>
                    </tr>
                </table>
                <div style="margin-top: 40px; display: flex; justify-content: space-around;">
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #374151; padding-top: 8px; margin-top: 60px; width: 200px;">
                            <p style="font-weight: bold;">Coordinador de Producción</p>
                            <p style="font-size: 12px; color: #6b7280;">Elaborado por</p>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="border-top: 1px solid #374151; padding-top: 8px; margin-top: 60px; width: 200px;">
                            <p style="font-weight: bold;">Director Zonal</p>
                            <p style="font-size: 12px; color: #6b7280;">Aprobado por</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        Utils.showToast('Informe generado correctamente');
    }
}

const app = new App();
