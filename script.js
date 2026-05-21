let currentRole = 'usuario';

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    const tab = document.getElementById('tab-' + tabId);
    if (tab && !tab.classList.contains('role-hidden')) {
        tab.classList.remove('hidden');
    }
}

function setRole(role) {
    currentRole = role;
    document.querySelectorAll('[data-role]').forEach(element => {
        const roles = element.dataset.role.split(' ');
        if (roles.includes(role)) {
            element.classList.remove('role-hidden');
        } else {
            element.classList.add('role-hidden');
        }
    });

    document.getElementById('role-admin')?.classList.toggle('is-active', role === 'admin');
    document.getElementById('role-usuario')?.classList.toggle('is-active', role === 'usuario');

    const defaultTab = role === 'admin' ? 'clientes' : 'cuenta';
    showTab(defaultTab);
}

// Simulación de transacciones (Bitácora)
function transaccion(tipo) {
    const monto = document.getElementById('op-monto').value;
    if (!monto) return alert("Ingrese monto");
    
    const color = tipo === 'CREDITO' ? 'text-emerald-600' : 'text-rose-600';
    const entry = `<div class="border-b py-2 flex justify-between font-mono">
                    <span>${new Date().toLocaleTimeString()} - ${tipo}</span>
                    <span class="${color} font-bold">Q ${monto}</span>
                   </div>`;
    const bitacoraAdmin = document.getElementById('bitacora-lista');
    const movimientosUsuario = document.getElementById('movimientos-lista');

    if (bitacoraAdmin) {
        bitacoraAdmin.innerHTML = entry + bitacoraAdmin.innerHTML;
    }

    if (movimientosUsuario) {
        movimientosUsuario.innerHTML = entry + movimientosUsuario.innerHTML;
    }
    alert(`Operación de ${tipo} registrada exitosamente.`);
}

// Lógica de Pago 95/5 
document.getElementById('pago-monto').addEventListener('input', function(e) {
    const total = parseFloat(e.target.value);
    const box = document.getElementById('calculo-95-5');
    if (total > 0) {
        box.classList.remove('hidden');
        document.getElementById('val-95').innerText = "Q " + (total * 0.95).toFixed(2);
        document.getElementById('val-5').innerText = "Q " + (total * 0.05).toFixed(2);
    } else {
        box.classList.add('hidden');
    }
});

function ejecutarPago() {
    const monto = document.getElementById('pago-monto').value;
    if (!monto) return alert("Error: Debe validar saldo antes de procesar.");
    alert("Pago orquestado. Se notificó a la empresa y se aplicó la comisión del 5% [cite: 15, 16]");
}

setRole(currentRole);