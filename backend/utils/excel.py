from typing import List

import polars as pl

# Lectura de Excel
# df: pl.DataFrame = pl.read_excel(source=f"../{excel_path}", sheet_name=sheet_name, has_header=True)
# df.select("Nombre", "Teléfono", "Imagen")
# contactos: List = df.rows()

contactos: List = pl.DataFrame(
    {
        "Nombre": ("Jared"),
        "Teléfono": ("5535438788"),
        "Imagen": ("ejemplo.png"),
    }
).rows()
