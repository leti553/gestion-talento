from talento.models import UnidadOrganica

unidades = [
    ("LA0011095", "Órgano de Gestión Tributaria y Tesorería"),
    ("LA0024094", "Gestión Tributaria"),
    ("LA0024095", "Tesorería"),
    ("LA0024096", "Inspección Tributaria"),
    ("LA0024086", "Servicios Sociales - Centros Cívicos"),
    ("LA0011096", "Participación Ciudadana"),
]

for dir3, nombre in unidades:
    UnidadOrganica.objects.get_or_create(codigo_dir3=dir3, defaults={'nombre': nombre})

print("Unidades cargadas con éxito")