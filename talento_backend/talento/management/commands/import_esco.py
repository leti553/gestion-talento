import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from talento.models import GrupoISCO, GrupoHabilidad, HabilidadUE, Ocupacion

class Command(BaseCommand):
    help = 'Carga masiva de datos ESCO'

    def handle(self, *args, **kwargs):
        ruta = os.path.join('talento', 'esco_data')

        # 1. GRUPOS ISCO
        self.stdout.write("Cargando Grupos ISCO ")
        with open(os.path.join(ruta, 'ISCOGroups_es.csv'), encoding='utf-8') as f:
            for row in csv.DictReader(f):
                GrupoISCO.objects.update_or_create(
                    codigo_isco=row['code'],
                    defaults={
                        'nombre': row['preferredLabel'],
                        'uri_esco': row['conceptUri'],
                        'descripcion': row.get('description', '')
                    }
                )

        # 2. GRUPOS DE HABILIDADES
        self.stdout.write("Cargando Grupos de Habilidades ")
        with open(os.path.join(ruta, 'skillGroups_es.csv'), encoding='utf-8') as f:
            for row in csv.DictReader(f):
                GrupoHabilidad.objects.update_or_create(
                    codigo_jerarquico=row['code'],
                    defaults={
                        'nombre': row['preferredLabel'],
                        'uri_esco': row['conceptUri'],
                        'descripcion': row.get('description', '')
                    }
                )

        # 3. HABILIDADES 
        self.stdout.write("Cargando Habilidades y Conocimientos...")
        with open(os.path.join(ruta, 'skills_es.csv'), encoding='utf-8') as f:
            for row in csv.DictReader(f):
                # Determinar grupo principal si existe en el CSV
                h, created = HabilidadUE.objects.update_or_create(
                    uri_esco=row['conceptUri'],
                    defaults={
                        'nombre': row['preferredLabel'],
                        'tipo': row['skillType'],
                        'nivel_reuso': row.get('reuseLevel', ''),
                        'etiquetas_alternativas': row.get('altLabels', ''),
                        'descripcion': row.get('description', row.get('definition', ''))
                    }
                )

        # 4. TRANSVERSALES OFICIALES
        self.stdout.write("Marcando habilidades como transversales oficiales...")
        t_path = os.path.join(ruta, 'transversalSkillsCollection_es.csv')
        if os.path.exists(t_path):
            with open(t_path, encoding='utf-8') as f:
                for row in csv.DictReader(f):
                    HabilidadUE.objects.filter(uri_esco=row['conceptUri']).update(es_transversal_oficial=True)

        # 5. OCUPACIONES 
        self.stdout.write("Cargando Ocupaciones (Puestos ESCO)...")
        with open(os.path.join(ruta, 'occupations_es.csv'), encoding='utf-8') as f:
            for row in csv.DictReader(f):
                # Buscamos el grupo ISCO 
                isco = GrupoISCO.objects.filter(codigo_isco=row['iscoGroup']).first()
                if isco:
                    Ocupacion.objects.update_or_create(
                        uri_esco=row['conceptUri'],
                        defaults={
                            'codigo_esco': row.get('code', ''),
                            'nombre': row['preferredLabel'],
                            'etiquetas_alternativas': row.get('altLabels', ''),
                            'definicion': row.get('description', row.get('definition', '')),
                            'grupo_isco': isco
                        }
                    )

        # 6. RELACIONES OCUPACIÓN-HABILIDAD 
        self.stdout.write("Vinculando habilidades a ocupaciones (Esenciales/Opcionales)...")
        with open(os.path.join(ruta, 'occupationSkillRelations_es.csv'), encoding='utf-8') as f:
            for row in csv.DictReader(f):
                ocupacion = Ocupacion.objects.filter(uri_esco=row['occupationUri']).first()
                habilidad = HabilidadUE.objects.filter(uri_esco=row['skillUri']).first()
                
                if ocupacion and habilidad:
                    if row['relationType'] == 'essential':
                        ocupacion.habilidades_esenciales.add(habilidad)
                    else:
                        ocupacion.habilidades_opcionales.add(habilidad)
                print(f"Vinculando: {ocupacion.nombre}")
        self.stdout.write(self.style.SUCCESS('¡IMPORTACIÓN COMPLETADA EXITOSAMENTE!'))