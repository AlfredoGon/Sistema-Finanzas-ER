class ERFinanzasApp {
    constructor() {
        this.token = sessionStorage.getItem('er_token');
        this.user = JSON.parse(sessionStorage.getItem('er_user') || 'null');
        this.config = null;
        this.currentView = 'dashboard';
        this.chart = null;
        this.currentPago = null;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateDate();
        if (this.token && this.user) this.showApp();
    }
    
    bindEvents() {
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.view);
            });
        });
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('-translate-x-full');
        });
        document.getElementById('closeSidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('-translate-x-full');
        });
        document.getElementById('movimientoForm')?.addEventListener('submit', (e) => this.guardarMovimiento(e));
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('mFecha') && (document.getElementById('mFecha').value = today);
        document.getElementById('informeFecha') && (document.getElementById('informeFecha').value = today);
    }
    
    updateDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const el = document.getElementById('currentDate');
        if (el) el.textContent = new Date().toLocaleDateString('es-ES', options);
    }
    
    async handleLogin(e) {
        e.preventDefault();
        const token = document.getElementById('tokenInput').value.trim();
        const btn = document.getElementById('loginBtn');
        const errorEl = document.getElementById('loginError');
        
        if (!token) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verificando...';
        errorEl.classList.add('hidden');
        
        try {
            const result = await API.verifyToken(token);
            if (result.success) {
                this.token = token;
                this.user = result.user;
                sessionStorage.setItem('er_token', token);
                sessionStorage.setItem('er_user', JSON.stringify(result.user));
                this.showApp();
            } else {
                throw new Error('Token inválido');
            }
        } catch (err) {
            errorEl.classList.remove('hidden');
            document.getElementById('loginErrorText').textContent = 'Token inválido o error de conexión';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Iniciar Sesión</span><i class="fas fa-arrow-right ml-2"></i>';
        }
    }
    
    logout() {
        sessionStorage.clear();
        location.reload();
    }
    
    async showApp() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        document.getElementById('userName').textContent = this.user.nombre;
        document.getElementById('userRole').textContent = this.getRolName(this.user.rol);
        document.getElementById('userZona').textContent = this.user.zona;
        document.getElementById('userAvatar').textContent = this.user.nombre.charAt(0).toUpperCase();
        await this.loadConfig();
        this.navigateTo('dashboard');
    }
    
    getRolName(rol) {
        const roles = { admin: 'Administrador', operador: 'Operador', visor: 'Visor' };
        return roles[rol] || rol;
    }
    
    async loadConfig() {
        try {
            const result = await API.getConfig(this.token);
            if (result.success) this.config = result;
        } catch (err) {
            console.error('Error cargando config:', err);
        }
    }
    
    updateCuentasSelect() {
        const tipo = document.getElementById('mTipo').value;
        const select = document.getElementById('mCuenta');
        if (!this.config?.config?.cuentas) return;
        const cuentas = this.config.config.cuentas.filter(c => tipo === '1' ? c.codigo.startsWith('5') : c.codigo.startsWith('4'));
        select.innerHTML = '<option value="">Seleccionar cuenta...</option>' +
            cuentas.map(c => `<option value="${c.codigo}">${c.codigo} - ${c.nombre}</option>`).join('');
    }
    
    navigateTo(view) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) item.classList.add('active');
        });
        const titles = { dashboard: 'Dashboard', cuotas: 'Cuotas Zonales', control: 'Control Financiero', informe: 'Informe Mensual', movimiento: 'Nuevo Movimiento', comprobantes: 'Comprobantes de Pago', configuracion: 'Configuración del Sistema' };
        document.getElementById('pageTitle').textContent = titles[view] || view;
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`view-${view}`).classList.remove('hidden');
        this.currentView = view;
        switch(view) {
            case 'dashboard': this.loadDashboard(); break;
            case 'cuotas': this.loadCuotas(); break;
            case 'control': this.loadControl(); break;
            case 'comprobantes': this.loadComprobantes(); break;
            case 'configuracion': this.loadConfiguracion(); break;
            case 'movimiento': this.updateCuentasSelect(); break;
        }
        if (window.innerWidth < 1024) {
            document.getElementById('sidebar').classList.add('-translate-x-full');
        }
    }
    
    showLoading(show) {
        document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
    }
    
    openModal(id) { document.getElementById(id).classList.remove('hidden'); }
    closeModal(id) { document.getElementById(id).classList.add('hidden'); }
    
    // DASHBOARD
    async loadDashboard() {
        this.showLoading(true);
        try {
            const mes = Utils.getCurrentMonth();
            const result = await API.getDashboard(mes, this.token);
            if (result.success) {
                document.getElementById('dashSaldo').textContent = Utils.formatMoney(result.resumen.saldoFinal);
                document.getElementById('dashIngresos').textContent = Utils.formatMoney(result.resumen.totalEntradas);
                document.getElementById('dashGastos').textContent = Utils.formatMoney(result.resumen.totalSalidas);
                document.getElementById('dashCuotas').textContent = `${result.cuotas.pagadas}/${result.cuotas.total}`;
                document.getElementById('dashCuotasBar').style.width = `${result.cuotas.porcentaje}%`;
                const badge = document.getElementById('badgeCuotas');
                if (badge) {
                    const pendientes = result.cuotas.total - result.cuotas.pagadas;
                    badge.textContent = pendientes;
                    badge.classList.toggle('hidden', pendientes === 0);
                }
                this.renderChart(result);
                this.loadRecentActivity();
            }
        } catch (err) {
            Utils.showToast('Error cargando dashboard', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderChart(data) {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Gastos', 'Saldo'],
                datasets: [{
                    data: [parseFloat(data.resumen.totalEntradas), parseFloat(data.resumen.totalSalidas), parseFloat(data.resumen.saldoFinal)],
                    backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }
    
    async loadRecentActivity() {
        try {
            const result = await API.getMovimientos({ limit: 5 }, this.token);
            const container = document.getElementById('recentActivity');
            if (!result.success || !result.movimientos.length) {
                container.innerHTML = '<p class="text-gray-400 text-center py-4">Sin actividad reciente</p>';
                return;
            }
            container.innerHTML = result.movimientos.map(m => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${m.entradas ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center">
                            <i class="fas ${m.entradas ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                        </div>
                        <div>
                            <p class="font-medium text-gray-800 text-sm">${m.descripcion}</p>
                            <p class="text-xs text-gray-500">${Utils.formatDate(m.fecha)} • ${m.cuenta}</p>
                        </div>
                    </div>
                    <span class="font-bold ${m.entradas ? 'text-green-600' : 'text-red-600'}">${m.entradas ? '+' : '-'}${Utils.formatMoney(m.entradas || m.salidas)}</span>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error cargando actividad:', err);
        }
    }
    
    // CUOTAS
    async loadCuotas() {
        const year = document.getElementById('cuotasYear').value;
        this.showLoading(true);
        try {
            const [cuotasResult, preciosResult] = await Promise.all([
                API.getCuotas(year, this.token),
                API.getPreciosCuota(year, this.token)
            ]);
            if (cuotasResult.success) this.renderCuotas(cuotasResult.cuotas, year, preciosResult.precios);
        } catch (err) {
            Utils.showToast('Error cargando cuotas', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderCuotas(cuotas, year, precios) {
        const tbody = document.getElementById('cuotasTableBody');
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        let totalDest = cuotas.length, totalPagaron = 0;
        tbody.innerHTML = cuotas.map((c, idx) => {
            const pagados = meses.reduce((acc, m) => acc + (c[m] === 'X' ? 1 : 0), 0);
            if (pagados > 0) totalPagaron++;
            return `
                <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition">
                    <td class="px-3 py-3 font-medium text-gray-900">${c.no}</td>
                    <td class="px-3 py-3 font-medium text-gray-900">${c.destacamento}</td>
                    <td class="px-3 py-3 text-gray-600 text-xs">${c.iglesia}</td>
                    ${meses.map(m => {
                        const isPaid = c[m] === 'X';
                        const canEdit = this.user.rol !== 'visor';
                        return `<td class="px-2 py-3 text-center">
                            ${canEdit ? `<button onclick="app.marcarCuota('${c.no}', '${c.destacamento}', '${m}', ${year}, ${isPaid})" class="w-8 h-8 rounded-full text-xs font-bold transition ${isPaid ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 border-2 border-transparent'}">${isPaid ? '✓' : '·'}</button>` : `<span class="w-8 h-8 rounded-full text-xs font-bold inline-flex items-center justify-center ${isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}">${isPaid ? '✓' : '·'}</span>`}
                        </td>`;
                    }).join('')}
                    <td class="px-3 py-3 text-center"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${pagados === 12 ? 'bg-green-100 text-green-800' : pagados > 6 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">${pagados}/12</span></td>
                    <td class="px-3 py-3 text-center"><button onclick="app.verDetalleCuota('${c.no}')" class="text-blue-600 hover:text-blue-800"><i class="fas fa-eye"></i></button></td>
                </tr>`;
        }).join('');
        document.getElementById('cuotasTotalDest').textContent = totalDest;
        document.getElementById('cuotasTotalPagaron').textContent = totalPagaron;
        document.getElementById('cuotasTotalPendientes').textContent = totalDest - totalPagaron;
        const precioRef = precios?.['ENERO']?.cuota || 10;
        document.getElementById('cuotasTotalMonto').textContent = Utils.formatMoney(totalPagaron * precioRef * 12);
    }
    
    marcarCuota(destacamentoId, destacamentoNombre, mes, year, isPaid) {
        if (isPaid) {
            if (!confirm(`¿Anular pago de ${mes.toUpperCase()} para ${destacamentoNombre}?`)) return;
            this.procesarCuota(destacamentoId, mes, year, false);
        } else {
            document.getElementById('pagoDestacamento').value = destacamentoNombre;
            document.getElementById('pagoMes').value = mes.toUpperCase();
            document.getElementById('pagoYear').value = year;
            API.getPreciosCuota(year, this.token).then(result => {
                const precio = result.precios?.[mes.toUpperCase()]?.cuota || 10;
                document.getElementById('pagoMonto').value = precio;
            });
            this.openModal('modalPagarCuota');
            this.currentPago = { destacamentoId, mes, year };
        }
    }
    
    async confirmarPagoCuota() {
        const monto = document.getElementById('pagoMonto').value;
        const generarComp = document.getElementById('generarComprobante').checked;
        if (!monto || monto <= 0) {
            Utils.showToast('Ingrese un monto válido', 'error');
            return;
        }
        this.closeModal('modalPagarCuota');
        this.showLoading(true);
        try {
            const result = await API.saveCuota({
                year: this.currentPago.year,
                destacamentoId: this.currentPago.destacamentoId,
                mes: this.currentPago.mes,
                estado: 'pagado',
                monto: monto,
                generarComprobante: generarComp
            }, this.token);
            if (result.success) {
                Utils.showToast('Pago registrado correctamente');
                if (result.comprobante && generarComp) this.mostrarComprobante(result.comprobante);
                this.loadCuotas();
            }
        } catch (err) {
            Utils.showToast('Error al registrar pago', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    verDetalleCuota(id) { alert('Ver detalle del destacamento ' + id); }
    exportCuotas() {
        const year = document.getElementById('cuotasYear').value;
        API.getCuotas(year, this.token).then(result => {
            if (result.success) Utils.exportToCSV(result.cuotas, `cuotas_zonales_${year}.csv`);
        });
    }
    
    // CONTROL FINANCIERO
    async loadControl() {
        const mes = document.getElementById('controlMes').value;
        this.showLoading(true);
        try {
            const result = await API.getMovimientos({ mes, limit: 1000 }, this.token);
            if (result.success) this.renderControl(result.movimientos);
        } catch (err) {
            Utils.showToast('Error cargando control financiero', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderControl(movimientos) {
        const tbody = document.getElementById('controlTableBody');
        if (!movimientos.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500">No hay movimientos registrados</td></tr>';
            return;
        }
        tbody.innerHTML = movimientos.map(m => `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 text-gray-600 whitespace-nowrap">${Utils.formatDate(m.fecha)}</td>
                <td class="px-4 py-3 font-medium text-gray-900">${m.descripcion}</td>
                <td class="px-4 py-3 text-gray-600">${m.cliente}</td>
                <td class="px-4 py-3 text-gray-600 font-mono text-xs">${m.comprobante}</td>
                <td class="px-4 py-3 text-gray-600 text-xs">${m.cuenta}</td>
                <td class="px-4 py-3 text-right font-medium text-green-600">${m.entradas ? Utils.formatMoney(m.entradas) : ''}</td>
                <td class="px-4 py-3 text-right font-medium text-red-600">${m.salidas ? Utils.formatMoney(m.salidas) : ''}</td>
                <td class="px-4 py-3 text-right font-bold text-gray-900">${Utils.formatMoney(m.saldo)}</td>
                <td class="px-4 py-3 text-center">${this.user.rol === 'admin' ? `<button onclick="app.eliminarMovimiento(${m.id})" class="text-red-500 hover:text-red-700 p-1"><i class="fas fa-trash-alt"></i></button>` : '-'}</td>
            </tr>`).join('');
    }
    
    async guardarMovimiento(e) {
        e.preventDefault();
        const data = {
            mes: document.getElementById('mMes').value,
            fecha: document.getElementById('mFecha').value,
            condicion: document.getElementById('mTipo').value,
            valor: document.getElementById('mValor').value,
            descripcion: document.getElementById('mDescripcion').value,
            cliente: document.getElementById('mCliente').value,
            comprobante: document.getElementById('mComprobante').value,
            evento: document.getElementById('mEvento').value,
            cuenta: document.getElementById('mCuenta').value
        };
        for (const [key, value] of Object.entries(data)) {
            if (!value) {
                this.showFormMessage('Todos los campos son obligatorios', 'error');
                return;
            }
        }
        const btn = document.getElementById('btnGuardarMovimiento');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        try {
            const result = await API.addMovimiento(data, this.token);
            if (result.success) {
                this.showFormMessage(`✅ Movimiento guardado. Saldo: ${Utils.formatMoney(result.saldo)}`, 'success');
                document.getElementById('movimientoForm').reset();
                setTimeout(() => this.navigateTo('control'), 1500);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            this.showFormMessage('❌ ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Movimiento';
        }
    }
    
    showFormMessage(msg, type) {
        const el = document.getElementById('movimientoMsg');
        el.textContent = msg;
        el.className = `p-4 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        el.classList.remove('hidden');
    }
    
    async eliminarMovimiento(id) {
        if (!confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) return;
        try {
            const result = await API.deleteMovimiento(id, this.token);
            if (result.success) {
                Utils.showToast('Movimiento eliminado');
                this.loadControl();
            }
        } catch (err) {
            Utils.showToast('Error al eliminar', 'error');
        }
    }
    
    exportControl() {
        const mes = document.getElementById('controlMes').value;
        API.getMovimientos({ mes }, this.token).then(result => {
            if (result.success) Utils.exportToCSV(result.movimientos, `control_financiero_${mes || 'todos'}.csv`);
        });
    }
    
    // INFORME MENSUAL
    async generarInforme() {
        const mes = document.getElementById('informeMes').value;
        const fecha = document.getElementById('informeFecha').value;
        const año = new Date().getFullYear();
        this.showLoading(true);
        try {
            const result = await API.generarInformeMensual({ mes, año, fecha }, this.token);
            if (result.success) this.renderInforme(result);
        } catch (err) {
            Utils.showToast('Error generando informe', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderInforme(data) {
        const container = document.getElementById('informeContainer');
        const fecha = new Date(data.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        container.innerHTML = `
            <div class="p-8 border-2 border-gray-300 min-h-[1100px]">
                <div class="text-center border-b-2 border-blue-900 pb-6 mb-6">
                    <div class="flex items-center justify-center gap-4 mb-4">
                        <div class="text-4xl">⚜️</div>
                        <div class="text-left">
                            <h1 class="text-2xl font-bold text-blue-900">EXPLORADORES DEL REY</h1>
                            <p class="text-sm text-gray-600">El Salvador - ${this.config?.config?.zona_nombre || 'Zona de Sonsonate'}</p>
                        </div>
                    </div>
                    <h2 class="text-xl font-bold text-gray-800 mt-4">INFORME FINANCIERO MENSUAL</h2>
                    <p class="text-lg text-blue-800 font-semibold">${data.mes} ${data.año}</p>
                    <p class="text-sm text-gray-500 mt-1">Fecha de elaboración: ${fecha}</p>
                </div>
                <div class="grid grid-cols-3 gap-4 mb-8">
                    <div class="bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
                        <p class="text-sm text-gray-600 mb-1">Saldo Inicial</p>
                        <p class="text-2xl font-bold text-blue-900">${Utils.formatMoney(data.resumen.saldoInicial)}</p>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                        <p class="text-sm text-gray-600 mb-1">Total Ingresos</p>
                        <p class="text-2xl font-bold text-green-700">${Utils.formatMoney(data.resumen.ingresos.total)}</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                        <p class="text-sm text-gray-600 mb-1">Total Gastos</p>
                        <p class="text-2xl font-bold text-red-700">${Utils.formatMoney(data.resumen.gastos.total)}</p>
                    </div>
                </div>
                <div class="mb-8">
                    <h3 class="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-2"><i class="fas fa-users mr-2"></i>Resumen de Cuotas Zonales</h3>
                    <div class="grid grid-cols-4 gap-4 text-center mb-4">
                        <div class="p-3 bg-gray-50 rounded"><p class="text-2xl font-bold text-gray-800">${data.cuotas.totalDestacamentos}</p><p class="text-xs text-gray-600">Destacamentos</p></div>
                        <div class="p-3 bg-green-50 rounded"><p class="text-2xl font-bold text-green-700">${data.cuotas.pagaron}</p><p class="text-xs text-gray-600">Pagaron</p></div>
                        <div class="p-3 bg-red-50 rounded"><p class="text-2xl font-bold text-red-700">${data.cuotas.pendientes}</p><p class="text-xs text-gray-600">Pendientes</p></div>
                        <div class="p-3 bg-blue-50 rounded"><p class="text-2xl font-bold text-blue-700">${data.cuotas.cobertura}%</p><p class="text-xs text-gray-600">Cobertura</p></div>
                    </div>
                </div>
                <div class="mb-8">
                    <h3 class="text-lg font-bold text-green-800 mb-3 border-b border-green-300 pb-2"><i class="fas fa-arrow-down mr-2"></i>INGRESOS</h3>
                    <table class="w-full text-sm mb-4">
                        <thead class="bg-green-50"><tr><th class="text-left p-2">Cuenta</th><th class="text-right p-2">Monto</th></tr></thead>
                        <tbody>
                            <tr class="border-b"><td class="p-2">Cuotas Zonales</td><td class="p-2 text-right font-medium">${Utils.formatMoney(data.resumen.ingresos.cuotas)}</td></tr>
                            <tr class="border-b"><td class="p-2">Diezmos</td><td class="p-2 text-right font-medium">${Utils.formatMoney(data.resumen.ingresos.diezmos)}</td></tr>
                            <tr class="border-b"><td class="p-2">Ofrendas</td><td class="p-2 text-right font-medium">${Utils.formatMoney(data.resumen.ingresos.ofrendas)}</td></tr>
                            <tr class="bg-green-100 font-bold"><td class="p-2">TOTAL INGRESOS</td><td class="p-2 text-right">${Utils.formatMoney(data.resumen.ingresos.total)}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="mb-8">
                    <h3 class="text-lg font-bold text-red-800 mb-3 border-b border-red-300 pb-2"><i class="fas fa-arrow-up mr-2"></i>GASTOS</h3>
                    <table class="w-full text-sm mb-4">
                        <thead class="bg-red-50"><tr><th class="text-left p-2">Cuenta</th><th class="text-right p-2">Monto</th></tr></thead>
                        <tbody>
                            <tr class="border-b"><td class="p-2">Gastos de Administración</td><td class="p-2 text-right font-medium">${Utils.formatMoney(data.resumen.gastos.administracion)}</td></tr>
                            <tr class="border-b"><td class="p-2">Gastos de Venta/Eventos</td><td class="p-2 text-right font-medium">${Utils.formatMoney(data.resumen.gastos.venta)}</td></tr>
                            <tr class="bg-red-100 font-bold"><td class="p-2">TOTAL GASTOS</td><td class="p-2 text-right">${Utils.formatMoney(data.resumen.gastos.total)}</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="bg-blue-900 text-white p-6 rounded-lg mb-8 text-center">
                    <p class="text-sm mb-1">SALDO FINAL</p>
                    <p class="text-3xl font-bold">${Utils.formatMoney(data.resumen.saldoFinal)}</p>
                </div>
                <div class="grid grid-cols-2 gap-8 mt-12 pt-8">
                    ${data.firmas.map(f => `
                        <div class="text-center">
                            <div class="border-t border-gray-800 pt-2 mt-16">
                                <p class="font-bold text-gray-900">${f.nombre}</p>
                                <p class="text-sm text-gray-600">${f.cargo}</p>
                                <p class="text-xs text-gray-500">${f.titulo}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    <p>Documento generado por Sistema ER Finanzas Pro v2.0</p>
                    <p>${new Date().toLocaleString('es-ES')}</p>
                </div>
            </div>`;
        Utils.showToast('Informe generado correctamente');
    }
    
    // COMPROBANTES
    async loadComprobantes() {
        this.showLoading(true);
        try {
            const result = await API.getComprobantes({ limit: 20 }, this.token);
            if (result.success) this.renderComprobantes(result.comprobantes);
        } catch (err) {
            Utils.showToast('Error cargando comprobantes', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    renderComprobantes(comprobantes) {
        const container = document.getElementById('comprobantesList');
        if (!comprobantes.length) {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-3 py-8">No hay comprobantes generados</p>';
            return;
        }
        container.innerHTML = comprobantes.map(c => `
            <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer" onclick="app.mostrarComprobanteDetalle('${c.numero}')">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">${c.numero}</span>
                    <span class="text-xs text-gray-500">${c.fecha}</span>
                </div>
                <p class="font-medium text-gray-800 text-sm mb-1">${c.destacamento}</p>
                <p class="text-xs text-gray-500 mb-2">${c.concepto}</p>
                <p class="text-lg font-bold text-green-600 text-right">${Utils.formatMoney(c.monto)}</p>
            </div>`).join('');
    }
    
    mostrarComprobante(comp) {
        alert(`Comprobante ${comp.numero}\nDestacamento: ${comp.destacamento}\nMonto: ${Utils.formatMoney(comp.monto)}`);
    }
    
    mostrarComprobanteDetalle(numero) {
        alert('Ver detalle del comprobante: ' + numero);
    }
    
    // CONFIGURACIÓN
    async loadConfiguracion() {
        this.showConfigTab('general');
    }
    
    showConfigTab(tab) {
        document.querySelectorAll('.config-tab').forEach(t => {
            t.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600', 'bg-blue-50');
            t.classList.add('text-gray-500');
        });
        document.getElementById(`tab-${tab}`).classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600', 'bg-blue-50');
        document.getElementById(`tab-${tab}`).classList.remove('text-gray-500');
        document.querySelectorAll('.config-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`config-${tab}`).classList.remove('hidden');
        if (tab === 'precios') this.loadPrecios();
        if (tab === 'firmas') this.loadFirmas();
        if (tab === 'correlativos') this.loadCorrelativos();
        if (tab === 'usuarios') this.loadUsuarios();
    }
    
    async loadPrecios() {
        const year = document.getElementById('preciosYear').value;
        try {
            const result = await API.getPreciosCuota(year, this.token);
            const container = document.getElementById('preciosContainer');
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            container.innerHTML = meses.map(m => `
                <div class="bg-gray-50 p-4 rounded-lg">
                    <label class="block text-xs font-bold text-gray-600 mb-2">${m}</label>
                    <input type="number" step="0.01" value="${result.precios?.[m]?.cuota || ''}" class="w-full px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Precio">
                </div>`).join('');
        } catch (err) {
            console.error('Error cargando precios:', err);
        }
    }
    
    async loadFirmas() {
        try {
            const result = await API.getFirmas(this.token);
            const container = document.getElementById('firmasContainer');
            const cargos = [
                { id: 'elaborado', nombre: 'Elaborado por', titulo: 'Coordinador de Producción' },
                { id: 'revisado', nombre: 'Revisado por', titulo: 'Director Asistente' },
                { id: 'aprobado', nombre: 'Aprobado por', titulo: 'Director Zonal' }
            ];
            container.innerHTML = cargos.map(c => {
                const firma = result.firmas?.find(f => f.cargo === c.id) || {};
                return `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div><label class="block text-xs font-medium text-gray-600 mb-1">Cargo</label><input type="text" value="${c.nombre}" readonly class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-sm"></div>
                        <div><label class="block text-xs font-medium text-gray-600 mb-1">Nombre</label><input type="text" id="firma-${c.id}-nombre" value="${firma.nombre || ''}" class="w-full px-3 py-2 border border-gray-300 rounded text-sm"></div>
                        <div><label class="block text-xs font-medium text-gray-600 mb-1">Título</label><input type="text" id="firma-${c.id}-titulo" value="${firma.titulo || c.titulo}" class="w-full px-3 py-2 border border-gray-300 rounded text-sm"></div>
                    </div>`;
            }).join('');
        } catch (err) {
            console.error('Error cargando firmas:', err);
        }
    }
    
    async loadCorrelativos() {
        try {
            const result = await API.getConfig(this.token);
            const tbody = document.getElementById('correlativosTable');
            tbody.innerHTML = result.correlativos?.map(c => `
                <tr class="border-b">
                    <td class="px-4 py-3">${c.tipo}</td>
                    <td class="px-4 py-3 font-mono">${c.serie}</td>
                    <td class="px-4 py-3"><input type="number" id="corr-${c.tipo}-${c.serie}" value="${c.numero}" class="w-24 px-2 py-1 border border-gray-300 rounded text-sm"></td>
                    <td class="px-4 py-3 text-center"><button onclick="app.actualizarCorrelativo('${c.tipo}', '${c.serie}')" class="text-blue-600 hover:text-blue-800"><i class="fas fa-save"></i></button></td>
                </tr>`).join('') || '<tr><td colspan="4" class="px-4 py-4 text-center text-gray-500">Sin datos</td></tr>';
        } catch (err) {
            console.error('Error cargando correlativos:', err);
        }
    }
    
    async loadUsuarios() {
        try {
            const result = await API.getUsuarios(this.token);
            const tbody = document.getElementById('usuariosTable');
            tbody.innerHTML = result.usuarios?.map(u => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium">${u.nombre}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">${u.email}</td>
                    <td class="px-4 py-3 text-sm">${u.zona}</td>
                    <td class="px-4 py-3"><span class="px-2 py-1 rounded text-xs ${u.rol === 'admin' ? 'bg-red-100 text-red-800' : u.rol === 'operador' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">${this.getRolName(u.rol)}</span></td>
                    <td class="px-4 py-3 text-center"><button onclick="app.editarUsuario('${u.email}')" class="text-blue-600 hover:text-blue-800"><i class="fas fa-edit"></i></button></td>
                </tr>`).join('') || '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">Sin usuarios</td></tr>';
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        }
    }
    
    showModalUsuario() {
        alert('Función de crear usuario - implementar formulario');
    }
    
    editarUsuario(email) {
        alert('Editar usuario: ' + email);
    }
    
    saveConfigGeneral() {
        Utils.showToast('Configuración guardada (simulado)');
    }
    
    saveFirmas() {
        Utils.showToast('Firmas guardadas (simulado)');
    }
    
    actualizarCorrelativo(tipo, serie) {
        const numero = document.getElementById(`corr-${tipo}-${serie}`).value;
        Utils.showToast(`Correlativo ${tipo}-${serie} actualizado a ${numero}`);
    }
}

const app = new ERFinanzasApp();