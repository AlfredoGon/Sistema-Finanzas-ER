const Utils = {
    formatMoney(amount) {
        return '$' + parseFloat(amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    
    getCurrentMonth() {
        const months = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
        return months[new Date().getMonth()];
    },
    
    exportToCSV(data, filename) {
        const csv = this.convertToCSV(data);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },
    
    convertToCSV(data) {
        if (!data || !data.length) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => 
            headers.map(h => {
                let cell = obj[h] || '';
                cell = cell.toString().replace(/"/g, '""');
                if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) cell = `"${cell}"`;
                return cell;
            }).join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    },
    
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const msg = document.getElementById('toastMessage');
        msg.textContent = message;
        icon.className = type === 'success' ? 'fas fa-check-circle text-green-400' : type === 'error' ? 'fas fa-exclamation-circle text-red-400' : 'fas fa-info-circle text-blue-400';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
};