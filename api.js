const API = {
    url: 'https://script.google.com/macros/s/TU_SCRIPT_ID/exec ',
    
    async request(action, params = {}, method = 'GET') {
        const url = new URL(this.url);
        url.searchParams.append('action', action);
        
        if (method === 'GET') {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });
            const response = await fetch(url);
            return response.json();
        } else {
            const body = { action, ...params };
            const response = await fetch(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return response.json();
        }
    },
    
    verifyToken(token) { return this.request('verifyToken', { token }); },
    getDashboard(mes, token) { return this.request('getDashboard', { mes, token }); },
    getCuotas(year, token) { return this.request('getCuotas', { year, token }); },
    saveCuota(data, token) { return this.request('saveCuota', { ...data, token }, 'POST'); },
    getPreciosCuota(año, token) { return this.request('getPreciosCuota', { año, token }); },
    generarComprobante(data, token) { return this.request('generarComprobante', { ...data, token }, 'POST'); },
    getComprobantes(params, token) { return this.request('getComprobantes', { ...params, token }); },
    getMovimientos(params, token) { return this.request('getMovimientos', { ...params, token }); },
    addMovimiento(data, token) { return this.request('addMovimiento', { ...data, token }, 'POST'); },
    deleteMovimiento(id, token) { return this.request('deleteMovimiento', { rowId: id, token }, 'POST'); },
    generarInformeMensual(params, token) { return this.request('generarInformeMensual', { ...params, token }, 'POST'); },
    getConfig(token) { return this.request('getConfig', { token }); },
    getUsuarios(token) { return this.request('getUsuarios', { token }); },
    saveUsuario(data, token) { return this.request('saveUsuario', { ...data, token }, 'POST'); },
    getFirmas(token) { return this.request('getFirmas', { token }); }
};