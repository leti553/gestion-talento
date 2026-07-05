import csv
import unicodedata
import re
from django.core.management.base import BaseCommand
from talento.models import Cualificacion

def normalizar(texto):
    if not texto:
        return ""
    texto = ''.join(c for c in unicodedata.normalize('NFD', texto)
                    if unicodedata.category(c) != 'Mn')
    texto = texto.upper()
    texto = re.sub(r"POR LA UNIVERSIDAD.*", "", texto)
    texto = re.sub(r"POR LA UNIVERSITAT.*", "", texto)
    texto = re.sub(r"Y LA UNIVERSIDAD.*", "", texto)
    texto = re.sub(r"\(.*?\)", "", texto)
    texto = " ".join(texto.split())
    return texto.strip()

class Command(BaseCommand):
    help = "Importa titulaciones RUCT"

    def add_arguments(self, parser):
        parser.add_argument("ficheros", nargs="+", type=str)

    def handle(self, *args, **kwargs):
        rutas = kwargs["ficheros"]

        for ruta in rutas:
            self.stdout.write(f"Procesando {ruta}...")

            vistos = set()

            with open(ruta, newline="", encoding="latin-1") as csvfile:
                reader = csv.DictReader(csvfile, delimiter=';')

                for row in reader:
                    codigo = row.get("Código", "").strip()
                    titulo_raw = row.get("Título", "").strip()
                    universidad_raw = row.get("Universidad", "").strip()
                    nivel = row.get("Nivel académico", "").strip()

                    if not titulo_raw:
                        continue

                    titulo = normalizar(titulo_raw)
                    universidad = normalizar(universidad_raw)

                    # Clave interna para evitar duplicados dentro del fichero
                    clave = (codigo or titulo, universidad)
                    if clave in vistos:
                        continue
                    vistos.add(clave)

                    # Deduplicación en base de datos
                    if codigo:
                        obj, created = Cualificacion.objects.update_or_create(
                            codigo_oficial=codigo,
                            universidad=universidad,
                            defaults={
                                "nombre": titulo,
                                "tipo": "RUCT",
                                "descripcion": nivel,
                                "nivel_eqf": None,
                                "uri_esco": None,
                            }
                        )
                    else:
                        obj, created = Cualificacion.objects.update_or_create(
                            nombre=titulo,
                            universidad=universidad,
                            tipo="RUCT",
                            defaults={
                                "descripcion": nivel,
                                "nivel_eqf": None,
                                "uri_esco": None,
                                "codigo_oficial": None,
                            }
                        )

            self.stdout.write(self.style.SUCCESS(f" Fichero {ruta} procesado"))
