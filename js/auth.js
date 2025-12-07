// 1. Lógica del Formulario de Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email === 'admin@talenthub.com' && password === '123456') {
        Swal.fire({
            icon: 'success',
            title: '¡Bienvenido de nuevo!',
            text: 'Conectando con TalentHub Cloud...',
            showConfirmButton: false,
            timer: 1500
        }).then(() => {
            localStorage.setItem('userLogged', 'true');
            window.location.href = 'dashboard.html';
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Credenciales inválidas',
            text: 'Por favor verifica tu acceso corporativo.',
            confirmButtonColor: '#4361ee'
        });
    }
});

// 2. Funciones Globales para los Botones (ESTO ES LO NUEVO)

// Importante: Usamos 'window.' para hacerlas públicas al HTML
window.recuperarClave = async () => {
    const { value: email } = await Swal.fire({
        title: 'Recuperación de Cuenta',
        text: 'Ingresa tu correo corporativo para restablecer la contraseña.',
        input: 'email',
        inputLabel: 'Correo Electrónico',
        inputPlaceholder: 'admin@talenthub.com',
        confirmButtonText: 'Enviar Instrucciones',
        confirmButtonColor: '#4361ee',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
    });

    if (email) {
        Swal.fire({
            icon: 'success',
            title: '¡Correo Enviado!',
            text: `Hemos enviado un enlace de recuperación a: ${email}`,
            confirmButtonColor: '#4361ee'
        });
    }
};

window.contactarSoporte = () => {
    Swal.fire({
        title: 'Centro de Soporte IT',
        html: `
            <div class="text-start px-3">
                <p>Si tienes problemas de acceso, contacta al departamento técnico:</p>
                <div class="alert alert-light border d-flex align-items-center mb-2">
                    <i class="fas fa-envelope text-primary me-3 fs-4"></i> 
                    <div>
                        <small class="text-muted d-block">Correo de Ayuda</small>
                        <strong>helpdesk@talenthub.com</strong>
                    </div>
                </div>
                <div class="alert alert-light border d-flex align-items-center">
                    <i class="fas fa-phone-alt text-success me-3 fs-4"></i> 
                    <div>
                        <small class="text-muted d-block">Línea Interna</small>
                        <strong>Ext. 4092</strong>
                    </div>
                </div>
                <small class="text-muted mt-2 d-block text-center">Horario de atención: L-V 8:00 AM - 5:00 PM</small>
            </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#4361ee'
    });
};