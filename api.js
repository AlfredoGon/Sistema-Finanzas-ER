const API = {
    url: 'https://script.google.com/macros/s/AKfycbyUtQvH6QkTcj15wUyeV52J9_8lKgf3ElzONB9_YqMOlAiiPEK_usQOrGXpbfjx3UAAqw/exec',

    async request(action, params = {}, method = 'GET') {
        const url = new URL(this.url);
        url.searchParams.append('action', action);

        // Si es GET, añadimos params a la URL
        if (method === 'GET') {
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });
            const response = await fetch(url.toString());
            return await response.json();
        } else {
            // Si es POST, enviamos body como string (GAS necesita text/plain a veces para evitar preflight, pero application/json está bien si el script lo maneja)
            // Para asegurar compatibilidad con GAS, usamos 'no-cors' si fuera necesario, pero necesitamos respuesta.
            // La mejor forma con GAS es enviar un POST simple.

            // Importante: GAS a veces tiene problemas con OPTIONS requests (CORS).
            // Enviamos los datos como stringify en el cuerpo.

            const response = await fetch(this.url, {
                method: 'POST',
                // Google Apps Script maneja mejor text/plain para evitar preflight complications en algunos navegadores
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, ...params })
            });
            return await response.json();
        }
    },

    login(email, password) {
        // Usamos POST para enviar credenciales de forma más "segura" (en el cuerpo)
        return this.request('login', { email, password }, 'POST');
    },

    // verifyToken se mantiene por compatibilidad si se necesitara, pero login es el principal
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