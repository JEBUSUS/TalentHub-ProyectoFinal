// --- CONFIGURACIÓN CORPORATIVA ---
const CONFIG = {
    AFP_RATE: 0.0287, // 2.87%
    SFS_RATE: 0.0304, // 3.04%
    DB_KEY: 'talenthub_db_v1',
    EDIT_KEY: 'talenthub_edit_temp' // Para pasar datos entre páginas
};

// --- INICIALIZACIÓN GLOBAL ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Router simple: Ejecuta funciones según la página actual
    const path = window.location.pathname;
    
    if (path.includes('dashboard.html')) initDashboard();
    if (path.includes('directory.html')) initDirectory();
    if (path.includes('create.html')) initCreate();
});

// --- LÓGICA DE AUTENTICACIÓN ---
function checkAuth() {
    // Si no hay sesión y no estamos en el login, pa' fuera
    const isLoginPage = window.location.pathname.includes('index.html');
    const isLogged = localStorage.getItem('userLogged');

    if (!isLogged && !isLoginPage) {
        window.location.href = 'index.html';
    }
}

function logout() {
    Swal.fire({
        title: '¿Cerrar Sesión?',
        text: "Regresarás a la pantalla de acceso.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('userLogged');
            window.location.href = 'index.html';
        }
    });
}

// --- CONTROLADOR: DASHBOARD (Resumen) ---
function initDashboard() {
    const employees = getDB();
    
    // KPI 1: Total Empleados
    animateValue("totalEmployees", 0, employees.length, 1000);
    
    // KPI 2: Nómina Total (Neto)
    const totalPayroll = employees.reduce((sum, emp) => sum + emp.netSalary, 0);
    const payrollElement = document.getElementById('totalPayroll');
    if (payrollElement) payrollElement.innerText = formatMoney(totalPayroll);
}

// --- CONTROLADOR: DIRECTORIO (Tabla) ---
function initDirectory() {
    renderTable(getDB());

    // Buscador en tiempo real
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const allEmployees = getDB();
            const filtered = allEmployees.filter(emp => 
                emp.name.toLowerCase().includes(term) || 
                emp.role.toLowerCase().includes(term) ||
                emp.idCard.includes(term)
            );
            renderTable(filtered);
        });
    }
}

function renderTable(data) {
    const tbody = document.getElementById('employeeTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    if (data.length === 0) {
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }
    if (emptyState) emptyState.classList.add('d-none');

    data.forEach((emp) => {
        // Encontrar el índice real en la DB original
        const realIndex = getDB().findIndex(e => e.idCard === emp.idCard);

        const row = `
            <tr class="animate__animated animate__fadeIn">
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-3 text-white small fw-bold" 
                             style="width:40px;height:40px;background:linear-gradient(45deg, #4361ee, #3a0ca3);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                            ${emp.name.charAt(0)}
                        </div>
                        <div>
                            <div class="fw-bold text-dark">${emp.name}</div>
                            <div class="small text-muted">${emp.status || 'Activo'}</div>
                        </div>
                    </div>
                </td>
                <td class="text-muted small fw-bold">${emp.idCard}</td>
                <td><span class="badge bg-light text-dark border">${emp.role}</span></td>
                <td class="text-end fw-bold text-success">${formatMoney(emp.netSalary)}</td>
                <td class="text-center">
                    <button onclick="editEmployee(${realIndex})" class="btn btn-sm btn-light text-primary border me-1" title="Editar ficha">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="deleteEmployee(${realIndex})" class="btn btn-sm btn-light text-danger border" title="Dar de baja">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// --- CONTROLADOR: CREATE / EDIT (Formulario) ---
function initCreate() {
    const editIndex = localStorage.getItem(CONFIG.EDIT_KEY);
    
    if (editIndex !== null) {
        loadEmployeeForEdit(editIndex);
    }

    const salaryInput = document.getElementById('empSalary');
    if (salaryInput) {
        salaryInput.addEventListener('input', calculatePreview);
    }

    const form = document.getElementById('employeeForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEmployee();
        });
    }
}

function calculatePreview() {
    const salaryInput = document.getElementById('empSalary');
    const salary = parseFloat(salaryInput.value) || 0;
    const afp = salary * CONFIG.AFP_RATE;
    const sfs = salary * CONFIG.SFS_RATE;
    const net = salary - afp - sfs;

    document.getElementById('previewAFP').innerText = formatMoney(afp);
    document.getElementById('previewSFS').innerText = formatMoney(sfs);
    document.getElementById('previewNeto').innerText = formatMoney(net);
    
    return { afp, sfs, net };
}

function saveEmployee() {
    const db = getDB();
    const editIndex = localStorage.getItem(CONFIG.EDIT_KEY);
    
    const salary = parseFloat(document.getElementById('empSalary').value);
    const calculations = calculatePreview();

    const employeeData = {
        name: document.getElementById('empName').value,
        idCard: document.getElementById('empId').value,
        role: document.getElementById('empRole').value,
        salary: salary,
        afp: calculations.afp,
        sfs: calculations.sfs,
        netSalary: calculations.net,
        dateModified: new Date().toISOString()
    };

    if (editIndex !== null) {
        // Actualizar existente
        db[parseInt(editIndex)] = employeeData;
        localStorage.removeItem(CONFIG.EDIT_KEY); 
        Swal.fire('¡Actualizado!', 'La ficha del colaborador ha sido modificada.', 'success')
            .then(() => window.location.href = 'directory.html');
    } else {
        // Crear nuevo
        if (db.some(e => e.idCard === employeeData.idCard)) {
            Swal.fire('Error', 'El ID Corporativo ya está registrado.', 'error');
            return;
        }
        db.push(employeeData);
        Swal.fire('¡Registrado!', 'Nuevo talento añadido a la base de datos.', 'success')
            .then(() => window.location.href = 'directory.html');
    }

    saveDB(db);
}

function loadEmployeeForEdit(index) {
    const db = getDB();
    const emp = db[index];
    
    if (!emp) return;

    document.getElementById('empName').value = emp.name;
    document.getElementById('empId').value = emp.idCard;
    document.getElementById('empRole').value = emp.role;
    document.getElementById('empSalary').value = emp.salary;
    document.getElementById('empId').disabled = true;
    
    document.querySelector('h3').innerText = "Editar Ficha de Colaborador";
    document.querySelector('button[type="submit"]').innerText = "Guardar Cambios";
    
    calculatePreview();
}

// --- UTILIDADES GLOBALES (Con Seed Local) ---

function getDB() {
    // 1. Intentamos leer de la memoria del navegador
    const localData = localStorage.getItem(CONFIG.DB_KEY);
    
    if (localData) {
        return JSON.parse(localData);
    } 
    // 2. Si no hay memoria, leemos del archivo initial_data.js
    else if (typeof INITIAL_DB_DATA !== 'undefined') {
        saveDB(INITIAL_DB_DATA); // Guardamos para persistencia futura
        return INITIAL_DB_DATA;
    }
    
    return [];
}

function saveDB(data) {
    localStorage.setItem(CONFIG.DB_KEY, JSON.stringify(data));
}

window.editEmployee = (index) => {
    localStorage.setItem(CONFIG.EDIT_KEY, index);
    window.location.href = 'create.html';
};

window.deleteEmployee = (index) => {
    Swal.fire({
        title: '¿Dar de baja?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar'
    }).then((result) => {
        if (result.isConfirmed) {
            const db = getDB();
            db.splice(index, 1);
            saveDB(db);
            initDirectory(); 
            Swal.fire('Eliminado', 'El colaborador ha sido dado de baja.', 'success');
        }
    });
};

window.logout = logout;

function formatMoney(amount) {
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const obj = document.getElementById(id);
    if (!obj) return;
    
    const timer = setInterval(function() {
        current += increment;
        obj.innerHTML = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, stepTime);
}