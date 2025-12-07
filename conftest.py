import pytest
import os
import datetime
import pytest_html
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# --- 1. CONFIGURACIÓN DEL NAVEGADOR ---
@pytest.fixture(scope="function")
def driver(request):
    """
    Este código se ejecuta ANTES de cada test individual.
    Abre un navegador limpio y nuevo para garantizar independencia.
    """
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Descomenta para que no se vea la ventana
    options.add_experimental_option("detach", True)
    
    driver = webdriver.Chrome(service=service, options=options)
    driver.maximize_window()
    driver.implicitly_wait(5) # Espera inteligente de 5 seg
    
    yield driver # Aquí ocurre la prueba
    
    driver.quit() # Esto ocurre DESPUÉS de la prueba (Cierra navegador)

# --- 2. GENERADOR DE REPORTE CON FOTOS ---
@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Este código vigila cada prueba. Cuando termina, toma una foto
    y la pega en el reporte HTML.
    """
    outcome = yield
    report = outcome.get_result()
    extra = getattr(report, "extra", [])

    if report.when == "call":
        driver = item.funcargs.get('driver')
        if driver:
            timestamp = datetime.datetime.now().strftime('%H-%M-%S')
            # Limpiamos el nombre del test para el archivo
            safe_name = item.name.replace("test_", "").replace("_", " ").title()
            screenshot_name = f"{safe_name}_{timestamp}.png"
            
            # Crear carpeta si no existe
            if not os.path.exists("evidencias_experto"):
                os.makedirs("evidencias_experto")
            
            path = os.path.join("evidencias_experto", screenshot_name)
            driver.save_screenshot(path)
            
            # Incrustar en el HTML
            if os.path.exists(path):
                html = f'<div><img src="evidencias_experto/{screenshot_name}" alt="screenshot" style="width:450px; border:2px solid #4361ee; border-radius:5px;" onclick="window.open(this.src)" align="right"/></div>'
                extra.append(pytest_html.extras.html(html))
        
        report.extra = extra