import sys
from os import path
from typing import Dict

from yaml import dump, safe_load


def resource_path(relative_path):
    """Devuelve la ruta al recurso ubicada en la misma carpeta que el .exe o .py"""
    if getattr(sys, "frozen", False):
        # Ejecutado como .exe
        base = path.dirname(sys.executable)
    else:
        # Ejecutado como .py
        base = path.abspath("../..")
    return path.join(base, relative_path)


CONFIG_FILE = resource_path("../../config.yml")

# Valores de configuración por defecto
default_config: Dict = {
    "excel": {
        "nombre_archivo": "excel.xlsx",
        "nombre_hoja": "Hoja 1",
    },
    "whatsapp": {
        "saludo": "Hola ",  # Seguido del nombre registrado
        "final_saludo": ". ",
        "texto": "Te envío una imagen.",
    },
}

# Si no existe el archivo, crear uno con valores por defecto
config: Dict = {}
if not path.exists(CONFIG_FILE):
    print(
        f"Aviso: No se encontró el archivo de configuración: {CONFIG_FILE}. Se usarán valores por defecto."
    )
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        dump(default_config, f, allow_unicode=True)
    config = default_config
else:
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        config = safe_load(f) or {}

# Extracción de configuraciones
excel_cfg: Dict = config.get("excel", {})
whatsapp_cfg: Dict = config.get("whatsapp", {})

# Configuración específica de Excel
excel_path: str = resource_path(
    excel_cfg.get("nombre_archivo", default_config["excel"]["nombre_archivo"])
)
sheet_name: str = excel_cfg.get("nombre_hoja", default_config["excel"]["nombre_hoja"])

# Configuración específica de los mensajes de WhatsApp
wa_greeting: str = excel_cfg.get("saludo", default_config["whatsapp"]["saludo"])
wa_end_greeting: str = excel_cfg.get(
    "final_saludo", default_config["whatsapp"]["final_saludo"]
)
wa_text: str = excel_cfg.get("text", default_config["whatsapp"]["texto"])
