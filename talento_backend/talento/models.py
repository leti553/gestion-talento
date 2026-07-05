from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# CLASE  AUDITORÍA
class AuditoriaModel(models.Model):
    """Clase base para que todas las tablas tengan rastro de fechas y autores"""
    
    # Fechas
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Creado el")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Modificado el")
    
    # Usuarios
    usuario_creacion = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="%(class)s_creador",
        verbose_name="Creado por"
    )
    usuario_modificacion = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="%(class)s_modificador",
        verbose_name="Modificado por"
    )

    class Meta:
        abstract = True


# MAESTROS INTERNOS


class UnidadOrganica(AuditoriaModel):
    codigo_dir3 = models.CharField(
        max_length=9, 
        unique=True, 
        null=True, 
        blank=True, 
        verbose_name="Código DIR3"
    )
    codigo_ayto = models.CharField(
        max_length=20, 
        unique=True, 
        verbose_name="Código Interno Ayto"
    )
    nombre = models.CharField(max_length=200)
    
    # Una unidad puede depender de otra
    padre = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subunidades',
        verbose_name="Unidad Superior"
    )

    class Meta:
        verbose_name = "Unidad Orgánica"
        verbose_name_plural = "Organigrama (Unidades)"
        ordering = ['codigo_ayto']

    def __str__(self):
        # Si tiene padre
        return f"{'  ' * self.get_nivel()} {self.codigo_ayto} - {self.nombre}"

    def get_nivel(self):
        """Calcula la profundidad en el árbol protegido contra bucles infinitos"""
        nivel = 0
        p = self.padre
        visitados = set() # Memoria para detectar si entramos en bucle
        
        while p and p.id not in visitados:
            visitados.add(p.id)
            nivel += 1
            p = p.padre
            
            # Cortafuegos por si la jerarquía es irrealmente grande
            if nivel > 20: 
                break
                
        return nivel



# GRUPOS Y JERARQUÍAS  -

class GrupoISCO(AuditoriaModel):
    """
    Representa la jerarquía internacional ISCO-08.
    Fichero: ISCOGroups_es.csv
    """
    codigo_isco = models.CharField(max_length=10, unique=True) 
    nombre = models.CharField(max_length=250)
    uri_esco = models.URLField(unique=True) # conceptUri
    descripcion = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Grupo ISCO"
        verbose_name_plural = "Grupos ISCO"

    def __str__(self):
        return f"{self.codigo_isco} - {self.nombre}"

class GrupoHabilidad(AuditoriaModel):
    """
    Jerarquía de pilares de habilidades (Digitales, Idiomas, etc.)
    Fichero: skillGroups_es.csv
    """
    codigo_jerarquico = models.CharField(max_length=20, unique=True) 
    nombre = models.CharField(max_length=250)
    uri_esco = models.URLField(unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Grupo de Habilidades"
        verbose_name_plural = "Grupos de Habilidades"

    def __str__(self):
        return f"{self.codigo_jerarquico} - {self.nombre}"


# HABILIDADES Y COMPETENCIAS 

class HabilidadUE(AuditoriaModel):
    """
    Habilidades, conocimientos y competencias transversales.
    Ficheros: skills_es.csv y transversalSkillsCollection_es.csv
    """
    TIPO_CHOICES = (
        ('skill/competence', 'Habilidad/Competencia'),
        ('knowledge', 'Conocimiento'),
    )
    REUSO_CHOICES = (
        ('transversal', 'Transversal'),
        ('sector-specific', 'Específica del sector'),
        ('occupation-specific', 'Específica de la ocupación'),
        ('cross-sector', 'Intersectorial'),
    )

    uri_esco = models.URLField(unique=True)
    nombre = models.CharField(max_length=250)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    nivel_reuso = models.CharField(max_length=50, choices=REUSO_CHOICES, blank=True)
    etiquetas_alternativas = models.TextField(blank=True, help_text="Sinónimos (altLabels)")
    descripcion = models.TextField(blank=True, null=True) 
    
    # Relaciones de jerarquía (broaderRelationsSkillPillar) -- no ha funcionado bien al ser la primera ejecución, lo he tenido que hacer aparte
    grupo_principal = models.ForeignKey(GrupoHabilidad, on_delete=models.SET_NULL, null=True, blank=True)

    ############REVISAR NO PARECE HABER FUNCIONADO, TENGO QUE PASAR UN SCRIPT POSTERIOR DE ACTUALIZACIÓN DEL CAMPO#########################
    padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subhabilidades')
    
    # Flag para identificar las transversales del archivo específico
    es_transversal_oficial = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Habilidad/Conocimiento"
        verbose_name_plural = "Habilidades/Conocimientos"

    def __str__(self):
        return self.nombre


# OCUPACIONES -PUESTOS DE TRABAJO 

class Ocupacion(AuditoriaModel):
    """
    Puestos de trabajo vinculados a  ESCO.
    Fichero: occupations_es.csv
    """
    uri_esco = models.URLField(unique=True)
    codigo_esco = models.CharField(max_length=50, blank=True) 
    nombre = models.CharField(max_length=250)
    etiquetas_alternativas = models.TextField(blank=True)
    definicion = models.TextField(blank=True, null=True)
    
    # vínculo con la categoría ISCO
    grupo_isco = models.ForeignKey(GrupoISCO, on_delete=models.PROTECT, related_name='puestos')
    
    # Jerarquía interna de puestos 
    
    padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subpuestos')

    # Relación con habilidades
    habilidades_esenciales = models.ManyToManyField(HabilidadUE, related_name='esencial_en', blank=True)
    habilidades_opcionales = models.ManyToManyField(HabilidadUE, related_name='opcional_en', blank=True)

    class Meta:
        verbose_name = "Ocupación"
        verbose_name_plural = "Ocupaciones"

    def __str__(self):
        return f"[{self.codigo_esco}] {self.nombre}"


# CUALIFICACIONES (TITULACIONES) 
# vacías en esco ESPAÑA, aun así se deja la estructura ESCO
class Cualificacion(AuditoriaModel):
    """
    Titulaciones y niveles.
    """
    TIPO_CHOICES = [
        ('ESCO', 'ESCO'),
        ('RUCT', 'Universitaria (RUCT)'),
        ('FP', 'Formación Profesional'),
        ('INCUAL', 'Cualificación Profesional INCUAL'),
        ('INTERNA', 'Formación Interna'),
    ]
    uri_esco = models.URLField(unique=True, blank=True, null=True)
    nombre = models.CharField(max_length=250)
    descripcion = models.TextField(blank=True, null=True)
    nivel_eqf = models.IntegerField(null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='ESCO')
    codigo_oficial = models.CharField(max_length=50, blank=True, null=True)
    universidad = models.CharField(max_length=200, blank=True, null=True)


    class Meta:
        verbose_name = "Cualificación"
        verbose_name_plural = "Cualificaciones"

    def __str__(self):
        return f"EQF {self.nivel_eqf} - {self.nombre}"


# PUESTOS INTERNOS DE LA ADMON - TENDRÁ COMO BASE UNA O VARIAS ESCO


class Puesto(AuditoriaModel):
    nombre = models.CharField(max_length=150, verbose_name="Nombre del Puesto")
    nivel = models.IntegerField(default=18, verbose_name="Nivel de Complemento de Destino")
    
    grupo = models.CharField(
        max_length=2,
        choices=[('A1','A1'), ('A2','A2'), ('C1','C1'), ('C2','C2')],
        verbose_name="Grupo de Clasificación"
    )

    # Habilidades
    habilidades_rpt = models.ManyToManyField(
        'HabilidadUE',
        blank=True,
        verbose_name="Habilidades RPT (Específicas Ayto)",
        related_name="puestos_rpt"
    )

    # Conexión con ESCO para traer las habilidades estándar automáticamente
    ocupaciones_esco = models.ManyToManyField(
        'Ocupacion',
        blank=True,
        verbose_name="Equivalencias Ocupación ESCO",
        related_name="puestos_equivalentes"
    )

    class Meta:
        verbose_name = "Puesto de Trabajo (RPT)"
        verbose_name_plural = "Puestos de Trabajo (RPT)"

    def __str__(self):
        return f"{self.nombre} (N{self.nivel} - {self.grupo})"



# PERSONAL Y SU HISTORIAL 


class Empleado(AuditoriaModel):
    """
    Persona física.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # --- Datos Personales  ---
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    apellidos = models.CharField(max_length=100, verbose_name="Apellidos")
    dni = models.CharField(max_length=15, unique=True, verbose_name="DNI/NIE")
 
    email = models.EmailField(verbose_name="Correo Electrónico", blank=True, null=True)
    
    # --- Ciclo de Vida ---
    fecha_alta = models.DateField(verbose_name="Fecha de alta")
    fecha_baja_jubilacion = models.DateField(null=True, blank=True, verbose_name="Fecha de baja/jubilación")

    # --- Puesto y Jerarquía Actual ---
    puesto_actual = models.ForeignKey(
        Puesto, 
        on_delete=models.PROTECT, 
        related_name="empleados_activos",
        verbose_name="Puesto Actual"
    )

    unidad_organica = models.ForeignKey(
        UnidadOrganica, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Unidad/Departamento Actual"
    )
    jefe = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='subordinados_actuales',
        verbose_name="Jefe/a Directo actual"
    )

   
    observaciones = models.TextField(blank=True, null=True, verbose_name="Observaciones internas")
    #QUITADAS POR EL PROBLEMA ESCO
    #qualifications = models.ManyToManyField(
    #    Cualificacion,
    #    through='TitulacionEmpleado',
    #    blank=True,
    #    verbose_name="Titulaciones"
    #)

    class Meta:
        verbose_name = "Empleado"
        verbose_name_plural = "Empleados"


    def __str__(self):
        return f"{self.nombre} {self.apellidos}" if self.nombre or self.apellidos else f"Empleado #{self.id}"


class HistoricoPuesto(AuditoriaModel):
    """
    Historial de movimientos. 
    Guarda el puesto y el jefe que tenía en cada etapa.
    """
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name="historial_puestos")
    puesto = models.ForeignKey(Puesto, on_delete=models.PROTECT, verbose_name="Puesto")
    
    unidad_organica = models.ForeignKey(
        UnidadOrganica, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    # jefe histórico
    jefe_en_ese_momento = models.ForeignKey(
        Empleado, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="historial_subordinados",
        verbose_name="Jefe/a durante este periodo"
    )
    
    fecha_inicio = models.DateField(verbose_name="Desde")
    fecha_fin = models.DateField(null=True, blank=True, verbose_name="Hasta")
    motivo_cambio = models.CharField(max_length=255, blank=True, verbose_name="Motivo del cambio")

    class Meta:
        verbose_name = "Histórico del Puesto"
        verbose_name_plural = "Historial de Puestos"
        ordering = ['-fecha_inicio']


class TitulacionEmpleado(AuditoriaModel):
    """Detalle de títulos obtenidos por el empleado"""
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, related_name="detalles_titulaciones")
    cualificacion = models.ForeignKey(Cualificacion, on_delete=models.PROTECT)
    
    fecha_obtencion = models.DateField(null=True, blank=True, verbose_name="Fecha de obtención")
    centro_expedidor = models.CharField(max_length=250, blank=True, verbose_name="Centro/Universidad")
    horas_totales = models.PositiveIntegerField(null=True, blank=True, verbose_name="Nº de horas")

    class Meta:
        verbose_name = "Titulación del Empleado"
        verbose_name_plural = "Titulaciones de Empleados"
        unique_together = ('empleado', 'cualificacion', 'fecha_obtencion')



# HABILIDADES DEL EMPLEADO

class CompetenciaEmpleado(AuditoriaModel):
    # niveles empezando en 0 
    NIVELES = [
        ('0', '0 - Sin evaluar / No requerido'),
        ('1', '1 - Básico'),
        ('2', '2 - Intermedio'),
        ('3', '3 - Avanzado'),
        ('4', '4 - Experto')
    ]
    
    # Orígenes para distinguir procedencia
    ORIGEN_CHOICES = [
        ('RPT', 'Requisito RPT (Ayto)'),
        ('ESCO_OBL', 'Obligatoria (ESCO)'),
        ('ESCO_OPC', 'Opcional (ESCO)'),
        ('EXTRA', 'A mayores / Otras'),
    ]

    empleado = models.ForeignKey(
        'Empleado', 
        on_delete=models.CASCADE, 
        related_name="mochila"
    )
    habilidad = models.ForeignKey(
        'HabilidadUE', 
        on_delete=models.CASCADE, 
        verbose_name="Habilidad/Competencia"
    )
    origen = models.CharField(
        max_length=10, 
        choices=ORIGEN_CHOICES, 
        default='RPT',
        verbose_name="Origen"
    )

    # Nivel que se autoevalua el empleado 
    nivel_autoevaluacion = models.CharField(
        max_length=1,
        choices=NIVELES,
        default='0',
        verbose_name="Autoevaluación"
    )
    
    # Nivel que el jefe otorga tras evaluar 
    nivel_jefe = models.CharField(
        max_length=1, 
        choices=NIVELES, 
        default='0',
        verbose_name="Evaluación Jefe"
    )
    
    observaciones_jefe = models.TextField(
        blank=True, 
        verbose_name="Comentarios del Evaluador",
        help_text="Notas sobre el desempeño o evidencias de la competencia"
    )
    observaciones_empleado = models.TextField(
        blank=True,
        null=True,
        verbose_name="Comentarios del Empleado"
    )


    class Meta:
        verbose_name = "Competencia del Empleado"
        verbose_name_plural = "Mochila de Competencias"
        # un empleado no puede tener la misma habilidad repetida dos veces
        unique_together = ('empleado', 'habilidad')

    def __str__(self):
        return f"{self.habilidad.nombre} - {self.empleado}"




# EVALUACION DESEMPEÑO


class DimensionEvaluacion(AuditoriaModel):
    BLOQUE_CHOICES = [
        ('TAREA', 'Desempeño de la Tarea'),
        ('CONTEXTUAL', 'Desempeño Contextual'),
    ]
    SUBGRUPO_CHOICES = [
        ('A', 'Subgrupos A1/A2'),
        ('C', 'Subgrupos C1/C2'),
        ('TODOS', 'Común a todos'),
    ]
    
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(help_text="Definición según Anexo II")
    bloque = models.CharField(max_length=15, choices=BLOQUE_CHOICES)
    
    # Separación por niveles exigida por el Decreto
    subgrupo_aplicable = models.CharField(
        max_length=10, 
        choices=SUBGRUPO_CHOICES, 
        default='TODOS',
        verbose_name="Subgrupo al que aplica"
    )
    es_obligatoria = models.BooleanField(
        default=True, 
        verbose_name="¿Es obligatoria para el informe?"
    )

    class Meta:
        verbose_name = "Dimensión de Evaluación"
        verbose_name_plural = "Dimensiones de Evaluación"

    def __str__(self):
        return f"[{self.subgrupo_aplicable}] {self.bloque} - {self.nombre}"
    

class EvaluacionDesempeño(AuditoriaModel):
    ESTADOS_EVALUACION = [
        ('BORRADOR', 'Borrador (En proceso)'),
        ('CERRADA', 'Cerrada / Definitiva'),
    ]

    empleado = models.ForeignKey('Empleado', on_delete=models.CASCADE, related_name='evaluaciones')
    evaluador = models.ForeignKey('Empleado', on_delete=models.SET_NULL, null=True, related_name='evaluaciones_firmadas')
    año = models.PositiveIntegerField(default=2024)
    fecha_evaluacion = models.DateField(auto_now_add=True)
    estado = models.CharField(max_length=15, choices=ESTADOS_EVALUACION, default='BORRADOR')
    
    # Descripciones obligatorias para la justificación jurídica de los objetivos
    descripcion_objetivos_colectivos = models.TextField(blank=True, null=True, verbose_name="Memoria de Objetivos Colectivos")
    descripcion_objetivos_individuales = models.TextField(blank=True, null=True, verbose_name="Memoria de Objetivos Individuales")

    puntos_objetivos_individuales = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    puntos_objetivos_colectivos = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    
    puntos_formacion_III = models.DecimalField(max_digits=4, decimal_places=2, default=0, verbose_name="Puntos Formación")
    puntos_innovacion_IV = models.DecimalField(max_digits=4, decimal_places=2, default=0, verbose_name="Puntos Innovación")
    
    # Informe cualitativo de conclusiones del evaluador
    informe_final = models.TextField(blank=True, verbose_name="Informe Cualitativo Final")

    class Meta:
        verbose_name = "Evaluación de Desempeño"
        verbose_name_plural = "Evaluaciones de Desempeño"

    def clean(self):
        """Validación de integridad: Bloquea el cierre si faltan dimensiones obligatorias del nivel"""
        super().clean()
        
        if self.estado == 'CERRADA':
            if not self.empleado or not self.empleado.puesto_actual:
                return

            # Extraemos la letra del subgrupo del empleado 
            subgrupo_empleado = self.empleado.puesto_actual.grupo[0]
            
            # Buscamos las dimensiones que por ley está obligado a cumplir
            dimensiones_requeridas = DimensionEvaluacion.objects.filter(
                models.Q(subgrupo_aplicable=subgrupo_empleado) | models.Q(subgrupo_aplicable='TODOS'),
                es_obligatoria=True
            )
            
            if self.pk:
                # Comparamos con las notas reales que se han grabado en NotaDimension
                notas_existentes = self.detalles_notas.values_list('dimension_id', flat=True)
                for dim in dimensiones_requeridas:
                    if dim.id not in notas_existentes:
                        raise ValidationError(
                            f"No se puede cerrar la evaluación: Falta puntuar la dimensión obligatoria '{dim.nombre}' para el subgrupo {self.empleado.puesto_actual.grupo}."
                        )
            else:
                raise ValidationError("Guarde la evaluación en BORRADOR antes de poder cerrarla de forma definitiva.")

    @property
    def calculo_puntos_anexo(self):
        if not self.empleado or not self.empleado.puesto_actual:
            return 0.0
            
        subgrupo_empleado = self.empleado.puesto_actual.grupo[0]

        # Obtenemos las dimensiones completas para pasárselas a la función
        dimensiones_tarea = DimensionEvaluacion.objects.filter(
            models.Q(bloque='TAREA') & (models.Q(subgrupo_aplicable=subgrupo_empleado) | models.Q(subgrupo_aplicable='TODOS'))
        )
        
        dimensiones_contextual = DimensionEvaluacion.objects.filter(
            models.Q(bloque='CONTEXTUAL') & (models.Q(subgrupo_aplicable=subgrupo_empleado) | models.Q(subgrupo_aplicable='TODOS'))
        )

        total_dims_tarea = dimensiones_tarea.count()
        total_dims_contextual = dimensiones_contextual.count()

        # Convertimos las notas grabadas en un diccionario para buscar rápido
        dict_notas = {n.dimension_id: n.puntuacion for n in self.detalles_notas.all()}
        
        def procesar_bloque(dimensiones_del_bloque, divisor_total):
            if divisor_total == 0: 
                return 0.0
            
            # Iteramos sobre TODAS las dimensiones. Si está en dict_notas usamos su valor, si no, forzamos un 1
            suma_puntos = sum(dict_notas.get(dim.id, 1) for dim in dimensiones_del_bloque)
            
            media = float(suma_puntos) / divisor_total
            
            if media < 2:
                return 0.0
            return media * 1.25

        return procesar_bloque(dimensiones_tarea, total_dims_tarea) + \
               procesar_bloque(dimensiones_contextual, total_dims_contextual)
    
    @property
    def nota_total(self):
        manuales = float(self.puntos_objetivos_individuales or 0) + \
                   float(self.puntos_objetivos_colectivos or 0) + \
                   float(self.puntos_formacion_III or 0) + \
                   float(self.puntos_innovacion_IV or 0)
        
        puntos_anexo = float(self.calculo_puntos_anexo)
        return round(manuales + puntos_anexo, 2)


class NotaDimension(AuditoriaModel):
    """Mantiene su función: Almacena las puntuaciones de cada dimensión en la evaluación"""
    evaluacion = models.ForeignKey(EvaluacionDesempeño, on_delete=models.CASCADE, related_name='detalles_notas')
    dimension = models.ForeignKey(DimensionEvaluacion, on_delete=models.CASCADE)
    puntuacion = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4)],
        help_text="1: Muy insuficiente, 2: Insuficiente, 3: Bueno, 4: Excelente"
    )

    class Meta:
        unique_together = ('evaluacion', 'dimension')   
        verbose_name = "Nota de Dimensión"        
        verbose_name_plural = "Notas de Dimensiones"

    def __str__(self):
        return f"{self.dimension.nombre}: {self.puntuacion}"


# --- ÁREAS III Y IV (FORMACIÓN E INNOVACIÓN) ESTO NO CUENTA PERO SE DEJA PREPARADO PARA EL FUTURO---
class MeritoCarrera(AuditoriaModel):
    BLOQUE_CHOICES = [
        ('AREA_III', 'Formación y Transferencia'),
        ('AREA_IV', 'Innovación e Investigación'),
    ]
    empleado = models.ForeignKey(
        'Empleado', 
        on_delete=models.CASCADE, 
        related_name='mis_meritos'
    )
    bloque = models.CharField(
        max_length=20, 
        choices=BLOQUE_CHOICES,
        verbose_name="Tipo de Área"
    )
    titulo = models.CharField(
        max_length=250, 
        verbose_name="Título del Curso o Proyecto"
    )
    entidad = models.CharField(
        max_length=250, 
        verbose_name="Organismo/Centro"
    )
    fecha = models.DateField(
        verbose_name="Fecha de finalización"
    )
    horas = models.PositiveIntegerField(
        default=0, 
        verbose_name="Número de horas"
    )

    class Meta:
        verbose_name = "Mérito de Carrera"
        verbose_name_plural = "Méritos de Carrera"
        ordering = ['-fecha']

    def __str__(self):
        return f"{self.titulo} ({self.empleado.apellidos})"
