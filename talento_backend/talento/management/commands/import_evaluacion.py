from django.core.management.base import BaseCommand
from talento.models import DimensionEvaluacion

class Command(BaseCommand):
    help = 'Limpia la tabla y carga las 18 dimensiones resumidas del BOCYL-D-23122022-1'

    def handle(self, *args, **options):
        # Borrar todas las dimensiones existentes de prueba
        count_deleted = DimensionEvaluacion.objects.all().count()
        DimensionEvaluacion.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Borradas {count_deleted} dimensiones antiguas.'))

        # Lista oficial de dimensiones del Anexo II JCYL
        dimensiones = [
            ('Capacidad de toma de decisiones', 'Elegir entre alternativas de modo rápido y preciso conociendo las consecuencias.', 'TAREA'),
            ('Capacidad de organización y planificación', 'Establecer estrategias para el desempeño eficaz y establecimiento de prioridades.', 'TAREA'),
            ('Capacidad de resolución de problemas', 'Solventar incidencias o imprevistos incorporando soluciones creativas y rápidas.', 'TAREA'),
            ('Conocimientos técnicos', 'Comprensión y aplicación de los conocimientos, procedimientos y técnicas del puesto.', 'TAREA'),
            ('Productividad', 'Resultados en términos de volumen de actividad, cantidad y calidad de lo realizado.', 'TAREA'),
            ('Capacidad de aprendizaje', 'Desarrollar estrategias de aprendizaje y adquirir nuevos conocimientos de modo eficiente.', 'TAREA'),
            ('Minuciosidad y responsabilidad', 'Precisión en las funciones y revisión de tareas para optimizar resultados.', 'TAREA'),
            ('Esfuerzo y perseverancia', 'Insistencia y constancia en la consecución de tareas independientemente de la dificultad.', 'TAREA'),
            ('Orientación a objetivos y resultados', 'Actuación basada en metas realistas y registro de avances hacia su logro.', 'TAREA'),
            ('Iniciativa', 'Actitud proactiva, emprendedora y asunción de nuevas responsabilidades.', 'CONTEXTUAL'),
            ('Compromiso con la organización', 'Identificación con los objetivos y valores de la Administración pública.', 'CONTEXTUAL'),
            ('Colaboración y cooperación con compañeros', 'Apoyo, respeto y capacidad de escucha activa hacia los otros.', 'CONTEXTUAL'),
            ('Compartir y transmitir conocimientos', 'Poner a disposición de los compañeros el conocimiento adquirido.', 'CONTEXTUAL'),
            ('Mantenimiento voluntario del rendimiento laboral', 'Ejecución de lo encomendado sin requerir supervisión continua.', 'CONTEXTUAL'),
            ('Mantenimiento voluntario de la calidad de trabajo', 'Interés y constancia voluntarios para lograr que el trabajo resulte de calidad.', 'CONTEXTUAL'),
            ('Uso adecuado del tiempo y los recursos laborales', 'Mantener en buen estado el material e instrumental puesto a su disposición.', 'CONTEXTUAL'),
            ('Asistencia al trabajo y uso eficiente del tiempo', 'Asistencia, puntualidad y utilización del tiempo según las normas.', 'CONTEXTUAL'),
            ('Ritmo voluntario eficiente del trabajo', 'Consistencia en el ritmo de trabajo sin grandes oscilaciones.', 'CONTEXTUAL'),
        ]

        # Crear las nuevas
        for nombre, desc, bloque in dimensiones:
            DimensionEvaluacion.objects.create(
                nombre=nombre,
                descripcion=desc,
                bloque=bloque
            )
        
        self.stdout.write(self.style.SUCCESS(f'Carga completada: 18 dimensiones oficiales registradas.'))