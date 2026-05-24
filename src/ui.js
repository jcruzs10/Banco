// Gestión del DOM y la interfaz de usuario

// --- TOAST NOTIFICATIONS ---
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Iconos SVG según el tipo de notificación
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="w-5 h-5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  } else {
    iconSvg = `<svg class="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    <span>${iconSvg}</span>
    <div class="flex-1">${message}</div>
  `;

  container.appendChild(toast);

  // Desvanecer y remover después de 4 segundos
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// --- GLOBAL LOADER OVERLAY ---
export function showLoader() {
  document.getElementById('global-loader')?.classList.remove('hidden');
}

export function hideLoader() {
  document.getElementById('global-loader')?.classList.add('hidden');
}

// --- LOGIN SCREEN CONTROL ---
export function showLoginScreen() {
  document.getElementById('login-screen')?.classList.remove('hidden');
}

export function hideLoginScreen() {
  document.getElementById('login-screen')?.classList.add('hidden');
}

// --- NAV TABS ROUTING ---
export function setupTabs(currentRole) {
  const tabs = document.querySelectorAll('.tab-content');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Ocultar todas las pestañas por defecto
  tabs.forEach(tab => tab.classList.add('hidden'));

  // Ocultar o mostrar botones de navegación y paneles según el rol activo
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.dataset.role.split(' ');
    if (roles.includes(currentRole)) {
      el.classList.remove('role-hidden');
    } else {
      el.classList.add('role-hidden');
    }
  });

  // Mostrar el panel de bienvenida del rol de administrador si aplica
  const adminHeader = document.getElementById('panel-admin-header');
  const diagPanel = document.getElementById('panel-diagnostico-operacional');
  if (currentRole === 'admin') {
    adminHeader?.classList.remove('hidden');
    diagPanel?.classList.remove('hidden');
  } else {
    adminHeader?.classList.add('hidden');
    diagPanel?.classList.add('hidden');
  }
}

export function switchTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const navButtons = document.querySelectorAll('.nav-btn');

  // Ocultar todas las pestañas
  tabs.forEach(tab => tab.classList.add('hidden'));

  // Desactivar todos los botones de navegación
  navButtons.forEach(btn => btn.classList.remove('is-active'));

  // Activar la pestaña solicitada
  const targetTab = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);

  if (targetTab) {
    targetTab.classList.remove('hidden');
  }
  if (targetBtn) {
    targetBtn.classList.add('is-active');
  }
}

// --- UI UPDATERS & RENDERERS ---

// Actualizar información de saldo en la pantalla de la Cuenta
export function updateSaldoUI(monto, idCuenta) {
  const saldoElement = document.getElementById('cuenta-val-saldo');
  const idElement = document.getElementById('cuenta-val-id');
  const tipoElement = document.getElementById('cuenta-val-tipo');
  const lblEstado = document.getElementById('cuenta-lbl-estado');

  if (saldoElement) {
    saldoElement.textContent = `Q ${parseFloat(monto).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (idElement) {
    idElement.textContent = `# ${idCuenta}`;
  }
  if (tipoElement) {
    tipoElement.textContent = `Cuenta Monetaria Activa (Consultada en tiempo real)`;
  }
  if (lblEstado) {
    lblEstado.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;
  }
}

// Renderizar la lista de transacciones (Kardex)
export function renderKardexUI(movimientos) {
  const tbody = document.getElementById('movimientos-tabla-body');
  if (!tbody) return;

  if (!movimientos || movimientos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-slate-400 italic">Esta cuenta no posee registros de transacciones previos en el Kardex.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = movimientos.map(mov => {
    const isCredito = mov.tipoOperacion === 'CREDITO' || mov.tipo === 'CREDITO' || mov.monto > 0; // Dependiendo de la convención de la API
    const tipoLabel = isCredito ? 'DEPÓSITO (CREDITO)' : 'RETIRO (DEBITO)';
    const colorClass = isCredito ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold';
    const fecha = mov.fecha || mov.fechaOperacion || new Date().toLocaleString();
    const idTrans = mov.idBitacora || mov.id || '--';
    const ref = mov.referencia || mov.descripcion || 'Sin referencia';
    const montoFormatted = `Q ${Math.abs(parseFloat(mov.monto)).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return `
      <tr class="border-b hover:bg-slate-50 transition font-medium">
        <td class="p-3 font-mono text-slate-600 text-xs">${idTrans}</td>
        <td class="p-3 text-slate-600 text-xs">${new Date(fecha).toLocaleString('es-GT')}</td>
        <td class="p-3 text-slate-800 text-xs">${ref}</td>
        <td class="p-3 text-xs uppercase text-slate-500">${tipoLabel}</td>
        <td class="p-3 text-right ${colorClass} font-mono">${montoFormatted}</td>
      </tr>
    `;
  }).join('');
}

// Renderizar auditoría de bitácora global (Admin)
export function renderBitacoraAdminUI(logs) {
  const container = document.getElementById('bitacora-admin-lista');
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = `
      <p class="text-gray-400 italic text-center py-8">No se encontraron movimientos registrados en la bitácora de auditoría para esta cuenta.</p>
    `;
    return;
  }

  container.innerHTML = logs.map(log => {
    const isCredito = log.tipoOperacion === 'CREDITO' || log.tipo === 'CREDITO' || log.monto > 0;
    const badgeColor = isCredito ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200';
    const borderClass = isCredito ? 'credito' : 'debito';
    const tipo = isCredito ? 'CREDITO / INGRESO' : 'DEBITO / EGRESO';
    const fecha = log.fecha || log.fechaOperacion || new Date().toISOString();
    const ref = log.referencia || log.descripcion || 'Sin descripción de auditoría';
    const idTrans = log.idBitacora || log.id || '--';

    return `
      <div class="bitacora-entry ${borderClass} p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-500">ID Log: #${idTrans}</span>
            <span class="border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}">${tipo}</span>
          </div>
          <p class="text-sm font-semibold text-slate-800">${ref}</p>
          <span class="text-xs text-slate-400">${new Date(fecha).toLocaleString('es-GT')}</span>
        </div>
        <div class="text-right">
          <p class="text-lg font-black font-mono text-slate-800">Q ${parseFloat(log.monto).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado Core: Aprobado</span>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar estado de diagnóstico de integraciones
export function renderDiagnosticsUI(statusData) {
  const container = document.getElementById('diagnostico-status-integracion');
  if (!container) return;

  const isHealthy = statusData && (statusData.estado || statusData.status === 'Healthy' || statusData.healthy);
  
  if (isHealthy) {
    container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
      Saludable (Verificado)
    `;
    container.className = 'inline-flex items-center gap-2 font-semibold text-emerald-700';
  } else {
    container.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
      Falla de Enlace
    `;
    container.className = 'inline-flex items-center gap-2 font-semibold text-rose-700';
  }
}

// --- COMISIÓN 95/5 LIVE CALCULATION ---
export function setupLiveComision() {
  const montoInput = document.getElementById('pago-monto');
  const calculoDiv = document.getElementById('calculo-95-5');
  const val95 = document.getElementById('val-95');
  const val5 = document.getElementById('val-5');

  if (!montoInput) return;

  montoInput.addEventListener('input', (e) => {
    const total = parseFloat(e.target.value);
    if (total > 0) {
      calculoDiv?.classList.remove('hidden');
      if (val95) val95.innerText = "Q " + (total * 0.95).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (val5) val5.innerText = "Q " + (total * 0.05).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      calculoDiv?.classList.add('hidden');
    }
  });
}
