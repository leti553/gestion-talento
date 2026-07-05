import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from talento.models import HabilidadUE, GrupoHabilidad

class Command(BaseCommand):
    help = 'Actualiza el padre y el grupo principal de las habilidades ESCO'

    def handle(self, *args, **kwargs):
        ruta = os.path.join('talento', 'esco_data')
        archivo_relaciones = os.path.join(ruta, 'broaderRelationsSkillPillar_es.csv')
        
        if not os.path.exists(archivo_relaciones):
            self.stderr.write(self.style.ERROR('Falta el archivo broaderRelationsSkillPillar_es.csv'))
            return

        self.stdout.write('Cargando diccionarios en memoria para ir rapido...')
        habilidades = {h.uri_esco: h for h in HabilidadUE.objects.all()}
        grupos = {g.uri_esco: g for g in GrupoHabilidad.objects.all()}
        
        habilidades_a_actualizar = []
        habilidades_procesadas = set()

        self.stdout.write('Procesando relaciones...')
        with open(archivo_relaciones, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                uri_hijo = row.get('conceptUri')
                uri_padre = row.get('broaderUri')
                
                if not uri_hijo or not uri_padre:
                    continue
                    
                hijo = habilidades.get(uri_hijo)
                if not hijo:
                    continue 
                    
                modificado = False
                
                if uri_padre in grupos:
                    hijo.grupo_principal = grupos[uri_padre]
                    modificado = True
                    
                elif uri_padre in habilidades:
                    hijo.padre = habilidades[uri_padre]
                    modificado = True
                    
                if modificado and hijo.uri_esco not in habilidades_procesadas:
                    habilidades_a_actualizar.append(hijo)
                    habilidades_procesadas.add(hijo.uri_esco)

        if habilidades_a_actualizar:
            self.stdout.write('Guardando datos de golpe en la base de datos...')
            with transaction.atomic():
                HabilidadUE.objects.bulk_update(habilidades_a_actualizar, ['grupo_principal', 'padre'], batch_size=1000)
            self.stdout.write(self.style.SUCCESS(f'Exito total. Se han actualizado {len(habilidades_a_actualizar)} habilidades.'))
        else:
            self.stdout.write(self.style.WARNING('No se encontro nada nuevo que actualizar.'))