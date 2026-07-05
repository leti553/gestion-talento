

# Create your tests here.
from django.test import TestCase
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from talento.models import (
    UnidadOrganica, GrupoISCO, HabilidadUE, Ocupacion, Cualificacion,
    Puesto, Empleado, CompetenciaEmpleado, TitulacionEmpleado, 
    DimensionEvaluacion, EvaluacionDesempeño, NotaDimension, MeritoCarrera
)

class SistemaTalentoQATestCase(TestCase):
    
    def setUp(self):
        """Inicialización de la base de datos volátil para los tests."""
        # Usuarios
        self.user_jefe = User.objects.create_user(username='jefe', password='123')
        self.user_emp = User.objects.create_user(username='empleado', password='123')
        
        # Estructura
        self.unidad_padre = UnidadOrganica.objects.create(nombre="Ayuntamiento", codigo_ayto="AYT-01")
        self.unidad_hija = UnidadOrganica.objects.create(nombre="TIC", codigo_ayto="TIC-01", padre=self.unidad_padre)
        
        self.puesto = Puesto.objects.create(nombre="Técnico Informático", nivel=22, grupo="A2")
        
        self.empleado = Empleado.objects.create(
            user=self.user_emp,
            nombre="Leticia",
            apellidos="Muñoz",
            dni="12345678Z",
            puesto_actual=self.puesto,
            unidad_organica=self.unidad_hija,
            jefe=None,
            fecha_alta="2020-01-01"
        )
        
        self.empleado.jefe = Empleado.objects.create(
            user=self.user_jefe, nombre="Luis", apellidos="Jefe", dni="87654321X", 
            puesto_actual=self.puesto, fecha_alta="2010-01-01"
        )
        self.empleado.save()

        # ESCO y Dimensiones
        self.hab_python = HabilidadUE.objects.create(nombre="Python", uri_esco="http://esco/1", tipo="skill/competence")
        self.dim_tarea = DimensionEvaluacion.objects.create(nombre="Productividad", bloque="TAREA", subgrupo_aplicable="TODOS", es_obligatoria=True)
        self.dim_contexto = DimensionEvaluacion.objects.create(nombre="Equipo", bloque="CONTEXTUAL", subgrupo_aplicable="TODOS", es_obligatoria=True)


    # AUDITORÍA Y JERARQUÍA 

    def test_01_auditoria_fechas_generacion_automatica(self):
        """Verifica que AuditoriaModel inyecta timestamps automáticamente"""
        self.assertIsNotNone(self.puesto.fecha_creacion)
        self.assertIsNotNone(self.puesto.fecha_modificacion)

    def test_02_calculo_nivel_jerarquico_dir3(self):
        """Verifica que el algoritmo del modelo UnidadOrganica calcula bien la profundidad"""
        self.assertEqual(self.unidad_padre.get_nivel(), 0)
        self.assertEqual(self.unidad_hija.get_nivel(), 1)


    # RESTRICCIONES DE INTEGRIDAD 

    def test_03_mochila_competencial_unique_together(self):
        """Verifica que un empleado no pueda tener la misma competencia duplicada"""
        CompetenciaEmpleado.objects.create(empleado=self.empleado, habilidad=self.hab_python, origen="RPT")
        with self.assertRaises(IntegrityError):
            CompetenciaEmpleado.objects.create(empleado=self.empleado, habilidad=self.hab_python, origen="EXTRA")

    def test_04_titulacion_unique_together(self):
        """Verifica que un empleado no pueda registrar el mismo título en la misma fecha dos veces"""
        titulo = Cualificacion.objects.create(nombre="Grado", tipo="RUCT")
        TitulacionEmpleado.objects.create(empleado=self.empleado, cualificacion=titulo, fecha_obtencion="2025-06-01")
        with self.assertRaises(IntegrityError):
            TitulacionEmpleado.objects.create(empleado=self.empleado, cualificacion=titulo, fecha_obtencion="2025-06-01")


    # RELACIONES ESCO 

    def test_05_relaciones_m2m_esco_ocupacion(self):
        """Verifica que una ocupación ESCO vincula habilidades correctamente"""
        grupo = GrupoISCO.objects.create(codigo_isco="25", nombre="TIC", uri_esco="http://isco/1")
        ocupacion = Ocupacion.objects.create(nombre="Dev", uri_esco="http://occ/1", grupo_isco=grupo)
        ocupacion.habilidades_esenciales.add(self.hab_python)
        self.assertEqual(ocupacion.habilidades_esenciales.count(), 1)
        self.assertIn(self.hab_python, ocupacion.habilidades_esenciales.all())


    # MOTOR  DE EVALUACIÓN (DECRETO 49/2022) 

    def test_06_evaluacion_bloqueo_cierre_sin_borrador(self):
        """Valida la regla de negocio: no se puede crear y cerrar de golpe, requiere borrador previo"""
        evaluacion = EvaluacionDesempeño(empleado=self.empleado, estado="CERRADA")
        with self.assertRaisesMessage(ValidationError, "Guarde la evaluación en BORRADOR antes"):
            evaluacion.clean()

    def test_07_evaluacion_bloqueo_cierre_faltan_obligatorias(self):
        """Valida que el sistema impida cerrar la evaluación si faltan dimensiones por puntuar"""
        evaluacion = EvaluacionDesempeño.objects.create(empleado=self.empleado, estado="BORRADOR")
        evaluacion.estado = "CERRADA"
        # Sin notas en NotaDimension, así que debe fallar
        with self.assertRaisesMessage(ValidationError, "Falta puntuar la dimensión obligatoria"):
            evaluacion.clean()

    def test_08_evaluacion_calculo_nota_penalizacion(self):
        """Verifica que el divisor penalice medias inferiores a 2.0 devolviendo 0.0"""
        evaluacion = EvaluacionDesempeño.objects.create(empleado=self.empleado, estado="BORRADOR")
        # Le ponemos un 1 a la única dimensión de Tarea evaluada. Media = 1.0 
        NotaDimension.objects.create(evaluacion=evaluacion, dimension=self.dim_tarea, puntuacion=1)
        
        # El cálculo del anexo debería ser 0 para TAREA al ser menor a 2.
        self.assertEqual(evaluacion.calculo_puntos_anexo, 0.0)

    def test_09_evaluacion_calculo_nota_excelente(self):
        """Verifica la fórmula matemática correcta con medias superiores a 2.0"""
        evaluacion = EvaluacionDesempeño.objects.create(
            empleado=self.empleado, estado="BORRADOR", 
            puntos_objetivos_individuales=2.0, puntos_objetivos_colectivos=3.0
        )
        # Tarea = 4, Contexto = 4
        NotaDimension.objects.create(evaluacion=evaluacion, dimension=self.dim_tarea, puntuacion=4)
        NotaDimension.objects.create(evaluacion=evaluacion, dimension=self.dim_contexto, puntuacion=4)
        
        # Cálculo esperado:
        # Tarea media (4/1) = 4 * 1.25 = 5.0
        # Contextual media (4/1) = 4 * 1.25 = 5.0
        # Puntos Anexo = 10.0
        # Nota Total = Puntos Anexo (10) + Obj. Individuales (2) + Obj. Colectivos (3) = 15.0
        self.assertEqual(evaluacion.calculo_puntos_anexo, 10.0)
        self.assertEqual(evaluacion.nota_total, 15.0)

    def test_10_evaluacion_cierre_exitoso(self):
        """Verifica que si cumple todos los requisitos, la evaluación supera el clean()"""
        evaluacion = EvaluacionDesempeño.objects.create(empleado=self.empleado, estado="BORRADOR")
        NotaDimension.objects.create(evaluacion=evaluacion, dimension=self.dim_tarea, puntuacion=4)
        NotaDimension.objects.create(evaluacion=evaluacion, dimension=self.dim_contexto, puntuacion=4)
        
        # Cambiamos estado y ejecutamos clean
        evaluacion.estado = "CERRADA"
        try:
            evaluacion.clean() # Si no lanza error, el test pasa
            evaluacion.save()
        except ValidationError:
            self.fail("El método clean() falló inesperadamente en un expediente correcto.")