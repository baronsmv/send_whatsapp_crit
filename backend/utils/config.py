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

# Extracción de configuración
excel_cfg: Dict = config.get("excel", {})

excel_path: str = resource_path(
    excel_cfg.get("nombre_archivo", default_config["excel"]["nombre_archivo"])
)
sheet_name: str = excel_cfg.get("nombre_hoja", default_config["excel"]["nombre_hoja"])
