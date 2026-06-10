const API_URL = ''; // Enlace relativo ya que compartimos el mismo host

let currentUser = null;
let token = null;
let companies = [];

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const displayUserName = document.getElementById('display-user-name');
const displayUserRole = document.getElementById('display-user-role');
const displayUserCityTag = document.getElementById('display-user-city-tag');
const userAvatarChar = document.getElementById('user-avatar-char');

const policyBanner = document.getElementById('policy-banner');
const policyTitle = document.getElementById('policy-title');
const policyDesc = document.getElementById('policy-desc');
const policyRulesContainer = document.getElementById('policy-rules-container');

const employeesTableBody = document.getElementById('employees-table-body');
const btnCreateEmployee = document.getElementById('btn-create-employee');

// Modal Empleado
const employeeModal = document.getElementById('employee-modal');
const employeeForm = document.getElementById('employee-form');
const modalTitle = document.getElementById('modal-title');
const empIdInput = document.getElementById('emp-id');
const formModeInput = document.getElementById('form-mode');
const empNombreInput = document.getElementById('emp-nombre');
const empApellidoInput = document.getElementById('emp-apellido');
const empCorreoInput = document.getElementById('emp-correo');
const empCargoInput = document.getElementById('emp-cargo');
const empSalarioInput = document.getElementById('emp-salario');
const empCompaniaSelect = document.getElementById('emp-companiaId');

// Definición de Políticas de Ciudad del Frontend (para renderizado e indicador visual)
const CITY_POLICIES = {
    medellin: {
        name: 'Medellín',
        icon: '🏔️',
        canCreate: true,
        canUpdate: true, // PUT
        canPatch: false, // PATCH
        canDelete: true,
    },
    bogota: {
        name: 'Bogotá',
        icon: '🏙️',
        canCreate: true,
        canUpdate: true, // PUT
        canPatch: true,  // PATCH
        canDelete: false, // Bogotá NO puede eliminar
    }
};

// Cargar estado inicial
document.addEventListener('DOMContentLoaded', () => {
    token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        currentUser = JSON.parse(userStr);
        showDashboard();
    } else {
        showLogin();
    }
});

// Manejador del Formulario de Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const correo = emailInput.value.trim();
    const contrasena = passwordInput.value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }
        
        token = data.token;
        currentUser = data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showToast(`Bienvenido, ${currentUser.nombre}`, 'success');
        showDashboard();
        
        // Limpiar formulario
        emailInput.value = '';
        passwordInput.value = '';
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Mostrar Pantalla de Login
function showLogin() {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
}

// Mostrar Pantalla de Dashboard
async function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    
    // Rellenar datos de usuario
    displayUserName.textContent = currentUser.nombre;
    displayUserRole.textContent = currentUser.rol;
    userAvatarChar.textContent = currentUser.nombre.charAt(0).toUpperCase();
    
    const city = currentUser.ciudad.toLowerCase();
    displayUserCityTag.textContent = city;
    displayUserCityTag.className = `city-tag ${city}`;
    
    // Aplicar Banner de Políticas
    applyCityPolicies(city);
    
    // Cargar Catálogos y Datos
    await loadCompanies();
    await loadEmployees();
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    showToast('Sesión cerrada correctamente', 'info');
    showLogin();
}

// Renderizar políticas en el Banner y ajustar botones globales
function applyCityPolicies(city) {
    const policy = CITY_POLICIES[city];
    
    if (!policy) {
        policyBanner.style.display = 'none';
        return;
    }
    
    policyBanner.style.display = 'flex';
    policyBanner.className = `policy-banner ${city}`;
    document.getElementById('policy-icon').textContent = policy.icon;
    policyTitle.innerHTML = `Políticas Activas: Región <strong>${policy.name}</strong>`;
    
    // Describir políticas
    let desc = `Como administrador de ${policy.name}, tus permisos están limitados por las políticas de tu ciudad.`;
    policyDesc.textContent = desc;
    
    // Crear chips de reglas
    policyRulesContainer.innerHTML = '';
    
    const rules = [
        { name: 'CREAR (POST)', allowed: policy.canCreate },
        { name: 'ACTUALIZAR (PUT)', allowed: policy.canUpdate },
        { name: 'PARCIAL (PATCH)', allowed: policy.canPatch },
        { name: 'ELIMINAR (DELETE)', allowed: policy.canDelete }
    ];
    
    rules.forEach(rule => {
        const chip = document.createElement('span');
        chip.className = `rule-chip ${rule.allowed ? 'allow' : 'deny'}`;
        chip.innerHTML = `${rule.allowed ? '✓' : '✗'} ${rule.name}: ${rule.allowed ? 'Permitido' : 'Prohibido'}`;
        policyRulesContainer.appendChild(chip);
    });
    
    // Aplicar restricciones al botón de crear global del frontend
    if (!policy.canCreate) {
        btnCreateEmployee.disabled = true;
        btnCreateEmployee.title = `Acción deshabilitada por políticas de ${policy.name}`;
    } else {
        btnCreateEmployee.disabled = false;
        btnCreateEmployee.title = '';
    }
}

// Cargar Compañías de la API
async function loadCompanies() {
    try {
        const response = await fetch(`${API_URL}/companies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('No se pudieron cargar las compañías');
        }
        
        companies = await response.json();
        
        // Rellenar select del formulario
        empCompaniaSelect.innerHTML = '';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = `${company.nombre} (${company.ciudad})`;
            empCompaniaSelect.appendChild(option);
        });
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Cargar Empleados de la API
async function loadEmployees() {
    employeesTableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                Cargando empleados de la API...
            </td>
        </tr>
    `;
    
    try {
        const response = await fetch(`${API_URL}/employees`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener la lista de empleados');
        }
        
        const employees = await response.json();
        renderEmployeesTable(employees);
    } catch (error) {
        showToast(error.message, 'error');
        employeesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--accent-rose); padding: 2rem; font-weight: 500;">
                    Error al cargar datos: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Renderizar la tabla de empleados
function renderEmployeesTable(employees) {
    if (employees.length === 0) {
        employeesTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    No hay empleados registrados.
                </td>
            </tr>
        `;
        return;
    }
    
    employeesTableBody.innerHTML = '';
    const city = currentUser.ciudad.toLowerCase();
    const policy = CITY_POLICIES[city] || { canUpdate: true, canPatch: true, canDelete: true };
    
    employees.forEach(emp => {
        const tr = document.createElement('tr');
        
        const formattedSalario = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(emp.salario);
        
        const compNombre = emp.compania?.nombre || 'Sin compañía';
        const compCiudad = emp.compania?.ciudad || 'Desconocida';
        
        const deleteBtnHtml = `
            <button class="btn-action delete" onclick="handleDeleteEmployee(${emp.id}, '${emp.nombre}', ${policy.canDelete})" 
                    style="${!policy.canDelete ? 'opacity: 0.45; border-color: rgba(244, 63, 94, 0.4);' : ''}"
                    title="${!policy.canDelete ? 'Bloqueado por política de Bogotá' : 'Eliminar empleado'}">
                Eliminar
            </button>
        `;
        
        const editBtnHtml = `
            <button class="btn-action edit" onclick="handleEditEmployee(${JSON.stringify(emp).replace(/"/g, '&quot;')}, 'edit')" 
                    title="Actualización Completa (PUT)">
                PUT (Completo)
            </button>
        `;
        
        const patchBtnHtml = `
            <button class="btn-action patch" onclick="handleEditEmployee(${JSON.stringify(emp).replace(/"/g, '&quot;')}, 'patch', ${policy.canPatch})"
                    style="${!policy.canPatch ? 'opacity: 0.45; border-color: rgba(139, 92, 246, 0.4);' : ''}"
                    title="${!policy.canPatch ? 'Bloqueado por política de Medellín' : 'Actualización Parcial (PATCH)'}">
                PATCH (Parcial)
            </button>
        `;
        
        tr.innerHTML = `
            <td><strong>#${emp.id}</strong></td>
            <td>
                <div style="font-weight: 500;">${emp.nombre} ${emp.apellido}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${emp.correo}</div>
            </td>
            <td>${emp.cargo}</td>
            <td>${compNombre}</td>
            <td><span class="city-tag ${compCiudad.toLowerCase()}">${compCiudad}</span></td>
            <td><strong class="text-emerald">${formattedSalario}</strong></td>
            <td style="text-align: center;">
                <div class="actions-cell">
                    ${editBtnHtml}
                    ${patchBtnHtml}
                    ${deleteBtnHtml}
                </div>
            </td>
        `;
        
        employeesTableBody.appendChild(tr);
    });
}

// Modales
function openCreateEmployeeModal() {
    modalTitle.textContent = 'Registrar Nuevo Empleado';
    formModeInput.value = 'create';
    empIdInput.value = '';
    
    empNombreInput.value = '';
    empApellidoInput.value = '';
    empCorreoInput.value = '';
    empCargoInput.value = '';
    empSalarioInput.value = '';
    
    showAllFormGroups();
    
    employeeModal.style.display = 'flex';
}

function handleEditEmployee(emp, mode, canPatch = true) {
    formModeInput.value = mode;
    empIdInput.value = emp.id;
    
    empNombreInput.value = emp.nombre;
    empApellidoInput.value = emp.apellido;
    empCorreoInput.value = emp.correo;
    empCargoInput.value = emp.cargo;
    empSalarioInput.value = emp.salario;
    empCompaniaSelect.value = emp.companiaId;
    
    if (mode === 'edit') {
        modalTitle.textContent = `Actualizar Empleado #${emp.id} (PUT - Completo)`;
        showAllFormGroups();
    } else {
        modalTitle.textContent = `Modificar Empleado #${emp.id} (PATCH - Parcial)`;
        
        document.getElementById('group-nombre').style.display = 'none';
        document.getElementById('group-apellido').style.display = 'none';
        document.getElementById('group-correo').style.display = 'none';
        document.getElementById('group-compania').style.display = 'none';
        
        empNombreInput.required = false;
        empApellidoInput.required = false;
        empCorreoInput.required = false;
        empCompaniaSelect.required = false;
    }
    
    employeeModal.style.display = 'flex';
}

function showAllFormGroups() {
    document.getElementById('group-nombre').style.display = 'block';
    document.getElementById('group-apellido').style.display = 'block';
    document.getElementById('group-correo').style.display = 'block';
    document.getElementById('group-compania').style.display = 'block';
    
    empNombreInput.required = true;
    empApellidoInput.required = true;
    empCorreoInput.required = true;
    empCompaniaSelect.required = true;
}

function closeEmployeeModal() {
    employeeModal.style.display = 'none';
}

// Guardar Empleado (Crear o Editar)
employeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mode = formModeInput.value;
    const id = empIdInput.value;
    
    let url = `${API_URL}/employees`;
    let method = 'POST';
    let bodyData = {};
    
    if (mode === 'create') {
        bodyData = {
            nombre: empNombreInput.value.trim(),
            apellido: empApellidoInput.value.trim(),
            correo: empCorreoInput.value.trim(),
            cargo: empCargoInput.value.trim(),
            salario: parseFloat(empSalarioInput.value),
            companiaId: parseInt(empCompaniaSelect.value)
        };
    } else if (mode === 'edit') {
        url = `${API_URL}/employees/${id}`;
        method = 'PUT';
        bodyData = {
            nombre: empNombreInput.value.trim(),
            apellido: empApellidoInput.value.trim(),
            correo: empCorreoInput.value.trim(),
            cargo: empCargoInput.value.trim(),
            salario: parseFloat(empSalarioInput.value),
            companiaId: parseInt(empCompaniaSelect.value)
        };
    } else if (mode === 'patch') {
        url = `${API_URL}/employees/${id}`;
        method = 'PATCH';
        bodyData = {
            cargo: empCargoInput.value.trim(),
            salario: parseFloat(empSalarioInput.value)
        };
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bodyData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error(`[Bloqueado por Backend API] ${data.message}`);
            }
            throw new Error(data.message || 'Error al guardar los datos del empleado');
        }
        
        showToast(
            mode === 'create' ? 'Empleado registrado con éxito' : 'Empleado actualizado con éxito', 
            'success'
        );
        closeEmployeeModal();
        await loadEmployees();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Eliminar Empleado
async function handleDeleteEmployee(id, nombre, isAllowedByFrontendPolicy) {
    const messageConfirm = !isAllowedByFrontendPolicy 
        ? `⚠️ ATENCIÓN: Las políticas de tu ciudad prohíben la eliminación. Si continúas, la API de NestJS rechazará la petición con un error 403.\n\n¿Deseas enviar la petición de eliminación del empleado "${nombre}" de todos modos para probar la validación del Backend?`
        : `¿Estás seguro de que deseas eliminar al empleado "${nombre}"?`;
        
    if (!confirm(messageConfirm)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error(`[Bloqueado por Backend API] ${data.message || 'No tienes permiso para eliminar'}`);
            }
            throw new Error(data.message || 'Error al eliminar el empleado');
        }
        
        showToast('Empleado eliminado con éxito', 'success');
        await loadEmployees();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Sistema de Notificaciones Toast
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <div style="font-size: 0.9rem; font-weight: 500; line-height: 1.3;">${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4500);
}
