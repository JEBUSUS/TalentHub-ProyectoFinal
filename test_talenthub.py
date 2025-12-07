import pytest
import time
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# --- RUTAS DINÁMICAS (Funcionan en cualquier PC) ---
BASE_DIR = os.getcwd()
URL_LOGIN = f"file:///{os.path.join(BASE_DIR, 'index.html').replace('\\', '/')}"
URL_DASHBOARD = f"file:///{os.path.join(BASE_DIR, 'dashboard.html').replace('\\', '/')}"

# --- CREDENCIALES ---
USER = "admin@talenthub.com"
PASS = "123456"

# --- HELPER: CERRAR SWEETALERT ---
def cerrar_alerta(driver):
    """Detecta y cierra el popup de SweetAlert si aparece"""
    try:
        boton = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button.swal2-confirm"))
        )
        boton.click()
        time.sleep(1) # Esperar animación
    except:
        pass # Si no hay alerta, seguimos

# --- LOGIN AUTOMÁTICO (Fixture) ---
@pytest.fixture
def usuario_logueado(driver):
    """Este paso previo loguea al usuario antes de las pruebas que lo requieran"""
    driver.get(URL_LOGIN)
    driver.find_element(By.ID, "email").send_keys(USER)
    driver.find_element(By.ID, "password").send_keys(PASS)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    cerrar_alerta(driver)
    return driver

# ==========================================
# 🏁 INICIO DE LAS PRUEBAS (HISTORIAS DE USUARIO)
# ==========================================

def test_HU01_Login_Exitoso(driver):
    """Prueba que el usuario puede entrar al sistema"""
    driver.get(URL_LOGIN)
    driver.find_element(By.ID, "email").send_keys(USER)
    driver.find_element(By.ID, "password").send_keys(PASS)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # Validamos que apareció el botón de cerrar alerta o redirigió
    cerrar_alerta(driver)
    
    # CRITERIO DE ACEPTACIÓN: Ver el KPI de empleados en el Dashboard
    assert driver.find_element(By.ID, "totalEmployees").is_displayed()

def test_HU02_Crear_Empleado_Nuevo(usuario_logueado):
    """Prueba crear un empleado nuevo desde cero"""
    driver = usuario_logueado
    
    # Navegar a Crear
    driver.get(f"file:///{os.path.join(BASE_DIR, 'create.html').replace('\\', '/')}")
    
    # Llenar Formulario
    driver.find_element(By.ID, "empName").send_keys("Robot Experto")
    driver.find_element(By.ID, "empId").send_keys("999-0000999-5")
    Select(driver.find_element(By.ID, "empRole")).select_by_visible_text("Product Owner")
    driver.find_element(By.ID, "empSalary").send_keys("75000")
    
    # Esperar cálculo automático de impuestos (JS)
    time.sleep(1) 
    
    # Guardar
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    cerrar_alerta(driver) # Cerrar "Registrado con éxito"
    
    # CRITERIO DE ACEPTACIÓN: Redirección y aparición en tabla
    WebDriverWait(driver, 5).until(EC.url_contains("directory.html"))
    assert "Robot Experto" in driver.page_source

def test_HU03_Buscador_Funcional(usuario_logueado):
    """Prueba que el buscador filtra los resultados"""
    driver = usuario_logueado
    driver.find_element(By.LINK_TEXT, "Directorio").click()
    
    # Buscamos a "Ana" (Sabemos que existe por initial_data.js)
    search_box = driver.find_element(By.ID, "searchInput")
    search_box.send_keys("Ana García")
    time.sleep(1) # Esperar filtro
    
    # Validar que Ana sigue ahí y otros desaparecieron
    tabla_texto = driver.find_element(By.ID, "employeeTableBody").text
    assert "Ana García" in tabla_texto
    assert "Miguel Santos" not in tabla_texto

def test_HU04_Editar_Empleado_Existente(usuario_logueado):
    """Edita a un empleado base (Ana García) para probar independientemente"""
    driver = usuario_logueado
    driver.find_element(By.LINK_TEXT, "Directorio").click()
    
    # Click en Editar del primer empleado (Ana García)
    btn_edit = driver.find_element(By.CSS_SELECTOR, "#employeeTableBody tr:first-child button[title='Editar ficha']")
    btn_edit.click()
    
    # Cambiar Salario
    campo_salario = WebDriverWait(driver, 5).until(EC.visibility_of_element_located((By.ID, "empSalary")))
    campo_salario.clear()
    campo_salario.send_keys("100000") # Aumento
    time.sleep(0.5)
    
    # Guardar
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    cerrar_alerta(driver)
    
    # CRITERIO DE ACEPTACIÓN: Salario actualizado en tabla
    # Neto de 100k es aprox 94k
    WebDriverWait(driver, 5).until(EC.url_contains("directory.html"))
    assert "94,090" in driver.page_source or "100,000" in driver.page_source

def test_HU05_Eliminar_Empleado(usuario_logueado):
    """Elimina al último empleado de la lista inicial"""
    driver = usuario_logueado
    driver.find_element(By.LINK_TEXT, "Directorio").click()
    time.sleep(1)
    
    # Contar antes
    filas_antes = len(driver.find_elements(By.CSS_SELECTOR, "#employeeTableBody tr"))
    
    # Click en Borrar del ÚLTIMO empleado
    botones_borrar = driver.find_elements(By.CSS_SELECTOR, "button[title='Dar de baja']")
    botones_borrar[-1].click()
    
    # Confirmar las DOS alertas (¿Seguro? -> Sí -> Eliminado)
    cerrar_alerta(driver)
    time.sleep(1)
    cerrar_alerta(driver)
    
    # CRITERIO DE ACEPTACIÓN: Una fila menos
    time.sleep(1)
    filas_despues = len(driver.find_elements(By.CSS_SELECTOR, "#employeeTableBody tr"))
    assert filas_despues == filas_antes - 1