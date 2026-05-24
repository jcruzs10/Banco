import { BancoAPI } from './api.js';
import * as UI from './ui.js';

// --- CONFIGURACIÓN DE ESTADO GLOBAL ---
let state = {
  role: 'usuario', // 'usuario' | 'admin'
  activeUser: null,
  activeAccount: null
};

// --- FUNCIÓN DE INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar comisiones en vivo del orquestador de pagos
  UI.setupLiveComision();
  
  // Registrar Listeners de Navegación de pestañas (Tabs)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.dataset.tab;
      UI.switchTab(tabId);
    });
  });

  // Validar si existe sesión activa guardada
  const savedUser = localStorage.getItem('credencial');
  if (savedUser) {
    state.activeUser = savedUser;
    state.role = savedUser === 'admin' ? 'admin' : 'usuario';
    
    // Configurar interfaz para la sesión recuperada
    UI.hideLoginScreen();
    UI.setupTabs(state.role);
    document.getElementById('header-user-badge').textContent = savedUser === 'admin' ? 'Administrador Core' : `Usuario: ${savedUser}`;
    
    // Si es admin, cargar diagnósticos iniciales
    if (state.role === 'admin') {
      cargarDiagnosticoCore();
    }
  } else {
    UI.showLoginScreen();
  }

  // --- REGISTRO DE FORMULARIOS ---

  // 1. Formulario de Inicio de Sesión
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const credencial = document.getElementById('login-credencial').value.trim();
    const password = document.getElementById('login-password').value;

    UI.showLoader();
    try {
      // Intentar login contra la API
      await BancoAPI.login(credencial, password);

      // Si no falla, establecemos el rol
      state.activeUser = credencial;
      state.role = credencial === 'admin' ? 'admin' : 'usuario';

      UI.hideLoginScreen();
      UI.setupTabs(state.role);
      document.getElementById('header-user-badge').textContent = state.role === 'admin' ? 'Administrador Core' : `Usuario: ${credencial}`;
      
      UI.showToast(`Bienvenido al sistema transaccional, ${credencial}`, 'success');

      if (state.role === 'admin') {
        cargarDiagnosticoCore();
      }
    } catch (error) {
      UI.showToast(`Error de autenticación: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 2. Cerrar Sesión (Logout)
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    BancoAPI.logout();
    state.activeUser = null;
    state.role = 'usuario';
    state.activeAccount = null;

    // Reiniciar UI
    document.getElementById('header-user-badge').textContent = 'Visitante';
    UI.showLoginScreen();
    UI.showToast('Sesión cerrada correctamente.', 'info');
  });

  // --- FLUJO DE USUARIO ---

  // 3. Consultar Saldo de Cuenta
  document.getElementById('form-consulta-cuenta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idCuenta = document.getElementById('consulta-cuenta-id').value;
    
    UI.showLoader();
    try {
      const data = await BancoAPI.obtenerSaldo(idCuenta);
      
      // La API puede retornar el saldo directamente como número o un objeto JSON
      const saldo = typeof data === 'object' ? (data.saldo ?? data.monto ?? 0) : parseFloat(data);
      
      state.activeAccount = idCuenta;
      UI.updateSaldoUI(saldo, idCuenta);
      UI.showToast(`Cuenta #${idCuenta} consultada correctamente.`, 'success');
    } catch (error) {
      UI.showToast(`No se pudo obtener el saldo: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 4. Filtrar Movimientos (Kardex)
  document.getElementById('form-filtro-movimientos')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idCuenta = document.getElementById('filtro-cuenta-id').value;
    const desde = document.getElementById('filtro-fecha-desde').value || null;
    const hasta = document.getElementById('filtro-fecha-hasta').value || null;

    UI.showLoader();
    try {
      const movimientos = await BancoAPI.obtenerKardex(idCuenta, desde, hasta);
      UI.renderKardexUI(movimientos);
      UI.showToast(`Movimientos de la cuenta #${idCuenta} cargados.`, 'success');
    } catch (error) {
      UI.showToast(`Error al obtener movimientos: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 5. Depósitos y Retiros
  document.getElementById('btn-deposito')?.addEventListener('click', async () => {
    const idCuenta = document.getElementById('op-cuenta').value;
    const monto = document.getElementById('op-monto').value;
    const referencia = document.getElementById('op-referencia').value;

    if (!idCuenta || !monto) {
      return UI.showToast('ID Cuenta y Monto son requeridos para el depósito.', 'error');
    }

    UI.showLoader();
    try {
      await BancoAPI.deposito(idCuenta, monto, referencia);
      UI.showToast(`Depósito de Q ${parseFloat(monto).toFixed(2)} realizado con éxito.`, 'success');
      
      // Si depositamos en la cuenta actualmente consultada en pestaña Cuenta, refrescar saldo
      if (state.activeAccount && state.activeAccount === idCuenta) {
        refrescarSaldoActivo();
      }
      
      // Limpiar formulario
      document.getElementById('form-deposito-retiro').reset();
    } catch (error) {
      UI.showToast(`Fallo en el depósito: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  document.getElementById('btn-retiro')?.addEventListener('click', async () => {
    const idCuenta = document.getElementById('op-cuenta').value;
    const monto = document.getElementById('op-monto').value;
    const referencia = document.getElementById('op-referencia').value;

    if (!idCuenta || !monto) {
      return UI.showToast('ID Cuenta y Monto son requeridos para el retiro.', 'error');
    }

    UI.showLoader();
    try {
      await BancoAPI.retiro(idCuenta, monto, referencia);
      UI.showToast(`Retiro de Q ${parseFloat(monto).toFixed(2)} debitado correctamente.`, 'success');
      
      // Si retiramos de la cuenta actualmente consultada, refrescar saldo
      if (state.activeAccount && state.activeAccount === idCuenta) {
        refrescarSaldoActivo();
      }

      document.getElementById('form-deposito-retiro').reset();
    } catch (error) {
      UI.showToast(`Fallo en el retiro: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 6. Transferencias ACH
  document.getElementById('form-transferencia')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const origen = document.getElementById('trans-origen').value;
    const destino = document.getElementById('trans-destino').value;
    const monto = document.getElementById('trans-monto').value;
    const descripcion = document.getElementById('trans-descripcion').value;

    UI.showLoader();
    try {
      await BancoAPI.transferir(origen, destino, monto, descripcion);
      UI.showToast(`Transferencia de Q ${parseFloat(monto).toFixed(2)} completada con éxito.`, 'success');
      
      // Refrescar saldo si aplica
      if (state.activeAccount && (state.activeAccount === origen || state.activeAccount === destino)) {
        refrescarSaldoActivo();
      }

      document.getElementById('form-transferencia').reset();
    } catch (error) {
      UI.showToast(`Error al transferir: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 7. Pagos: Consultar Deuda de Servicio
  document.getElementById('btn-consultar-deuda')?.addEventListener('click', async () => {
    const tipoServicio = document.getElementById('pago-servicio').value;
    const identificador = document.getElementById('pago-id').value.trim();

    if (!identificador) {
      return UI.showToast('Ingrese el identificador del cliente.', 'error');
    }

    UI.showLoader();
    try {
      const data = await BancoAPI.consultarDeuda(tipoServicio, identificador);
      
      // Si la API devuelve un monto de deuda
      const montoDeuda = typeof data === 'object' ? (data.monto || data.deuda || 0) : parseFloat(data);
      
      const montoInput = document.getElementById('pago-monto');
      if (montoInput) {
        montoInput.value = montoDeuda;
        // Lanzar evento input para actualizar cálculos automáticos del 95/5
        montoInput.dispatchEvent(new Event('input'));
      }
      
      UI.showToast(`Deuda de Q ${parseFloat(montoDeuda).toFixed(2)} cargada del sistema externo.`, 'success');
      
      // Mostrar la sección de ejecución de pago
      document.getElementById('form-ejecutar-pago').classList.remove('hidden');
    } catch (error) {
      UI.showToast(`No se pudo obtener la deuda: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 8. Pagos: Validar Conexión de Identificador
  document.getElementById('form-validar-servicio')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipoServicio = document.getElementById('pago-servicio').value;
    const identificador = document.getElementById('pago-id').value.trim();

    UI.showLoader();
    try {
      await BancoAPI.validarPago(tipoServicio, identificador);
      UI.showToast('Identificador de cliente validado y listo para cobrar.', 'success');
      
      // Mostrar la sección de autorización
      document.getElementById('form-ejecutar-pago').classList.remove('hidden');
    } catch (error) {
      UI.showToast(`Error de validación del servicio: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 9. Pagos: Ejecutar Liquidación del Pago
  document.getElementById('form-ejecutar-pago')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipoServicio = document.getElementById('pago-servicio').value;
    const identificador = document.getElementById('pago-id').value.trim();
    const monto = document.getElementById('pago-monto').value;
    const tarjeta = document.getElementById('pago-tarjeta').value.trim();
    const pin = document.getElementById('pago-pin').value.trim();
    const referenciaCliente = document.getElementById('pago-referencia-cliente').value;

    UI.showLoader();
    try {
      await BancoAPI.ejecutarPago(tarjeta, pin, tipoServicio, identificador, monto, referenciaCliente);
      UI.showToast(`Pago orquestado con éxito. Q ${parseFloat(monto).toFixed(2)} liquidado bajo la regla 95/5.`, 'success');
      
      // Limpiar y resetear
      document.getElementById('form-validar-servicio').reset();
      document.getElementById('form-ejecutar-pago').reset();
      document.getElementById('form-ejecutar-pago').classList.add('hidden');
      document.getElementById('calculo-95-5').classList.add('hidden');
    } catch (error) {
      UI.showToast(`No se pudo procesar el pago: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });


  // --- FLUJO DE ADMINISTRADOR ---

  // 10. Registrar Cuentahabiente
  document.getElementById('form-cuentahabiente')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dpi = document.getElementById('cte-dpi').value.trim();
    const nit = document.getElementById('cte-nit').value.trim();
    const nombre = document.getElementById('cte-nombre').value.trim();
    const apellido = document.getElementById('cte-apellido').value.trim();
    const telefono = document.getElementById('cte-telefono').value.trim();
    const email = document.getElementById('cte-email').value.trim();
    const idTipoCuenta = document.getElementById('cte-tipo-cuenta').value;

    UI.showLoader();
    try {
      const res = await BancoAPI.crearCuentahabiente(dpi, nit, nombre, apellido, telefono, email, idTipoCuenta);
      
      // Intentar extraer información de la cuenta creada en la respuesta
      let msg = 'Perfil de cuentahabiente registrado con éxito en el core.';
      if (res && res.idCuenta) {
        msg += ` ID Cuenta generada: #${res.idCuenta}`;
      } else if (typeof res === 'object') {
        msg += ` Cuenta aperturada.`;
      }
      
      UI.showToast(msg, 'success');
      document.getElementById('form-cuentahabiente').reset();
    } catch (error) {
      UI.showToast(`Error al registrar cuentahabiente: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 11. Asociar Tarjeta de Débito
  document.getElementById('form-asociar-tarjeta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idCuenta = document.getElementById('tarjeta-cuenta-id').value;

    UI.showLoader();
    try {
      const res = await BancoAPI.asociarTarjeta(idCuenta);
      
      let msg = 'Tarjeta asociada de forma exitosa.';
      if (res && res.numeroTarjeta) {
        msg += ` Tarjeta: ${res.numeroTarjeta}`;
      }
      
      UI.showToast(msg, 'success');
      document.getElementById('form-asociar-tarjeta').reset();
    } catch (error) {
      UI.showToast(`Error al asociar tarjeta: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 12. Activar Cuenta
  document.getElementById('form-activar-cuenta')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idCuenta = document.getElementById('activar-cuenta-id').value;
    const monto = document.getElementById('activar-cuenta-monto').value;

    UI.showLoader();
    try {
      await BancoAPI.activarCuenta(idCuenta, monto);
      UI.showToast(`Cuenta #${idCuenta} activada satisfactoriamente con depósito inicial.`, 'success');
      
      // Refrescar saldo si aplica
      if (state.activeAccount && state.activeAccount === idCuenta) {
        refrescarSaldoActivo();
      }

      document.getElementById('form-activar-cuenta').reset();
    } catch (error) {
      UI.showToast(`Error de activación de cuenta: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 13. Consultar Auditoría Global (Bitácora Admin)
  document.getElementById('form-bitacora-admin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idCuenta = document.getElementById('bitacora-cuenta-id').value;

    UI.showLoader();
    try {
      const logs = await BancoAPI.obtenerKardex(idCuenta);
      UI.renderBitacoraAdminUI(logs);
      UI.showToast(`Bitácora de cuenta #${idCuenta} cargada.`, 'success');
    } catch (error) {
      UI.showToast(`Error al obtener bitácora de cuenta: ${error.message}`, 'error');
    } finally {
      UI.hideLoader();
    }
  });

  // 14. Actualizar Diagnóstico de Integraciones
  document.getElementById('btn-actualizar-diagnostico')?.addEventListener('click', cargarDiagnosticoCore);
});

// --- FUNCIONES AUXILIARES DE SOPORTE ---

// Refrescar saldo del estado activo
async function refrescarSaldoActivo() {
  if (!state.activeAccount) return;
  try {
    const data = await BancoAPI.obtenerSaldo(state.activeAccount);
    const saldo = typeof data === 'object' ? (data.saldo ?? data.monto ?? 0) : parseFloat(data);
    UI.updateSaldoUI(saldo, state.activeAccount);
  } catch (err) {
    console.error('Error al autorrefrescar saldo:', err);
  }
}

// Cargar diagnóstico de integraciones desde el API core
async function cargarDiagnosticoCore() {
  const label = document.getElementById('diagnostico-status-integracion');
  if (label) {
    label.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Consultando...`;
  }
  
  try {
    const status = await BancoAPI.obtenerIntegraciones();
    UI.renderDiagnosticsUI(status);
  } catch (error) {
    UI.renderDiagnosticsUI(null);
  }
}
