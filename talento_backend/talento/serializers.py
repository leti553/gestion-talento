from rest_framework import serializers
from django.db.models import Q

from .models import (
    Empleado, 
    Puesto, 
    UnidadOrganica, 
    HistoricoPuesto, 
    TitulacionEmpleado, 
    Cualificacion, 
    MeritoCarrera, 
    CompetenciaEmpleado, 
    HabilidadUE,
    EvaluacionDesempeño,
    DimensionEvaluacion
)

# Serializadores  
class PuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puesto
        fields = ['id', 'nombre', 'nivel', 'grupo']

class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadOrganica
        fields = ['id', 'nombre', 'codigo_ayto']

class CualificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cualificacion
        fields = ['id', 'nombre', 'nivel_eqf']

class HabilidadUESerializer(serializers.ModelSerializer):
    class Meta:
        model = HabilidadUE
        fields = ['id', 'nombre']

# Serializadores de las listas 
class HistoricoPuestoSerializer(serializers.ModelSerializer):
    puesto = PuestoSerializer(read_only=True)
    unidad_organica = UnidadSerializer(read_only=True)
    class Meta:
        model = HistoricoPuesto
        fields = '__all__'

class TitulacionEmpleadoSerializer(serializers.ModelSerializer):
    cualificacion = CualificacionSerializer(read_only=True)
    cualificacion_id = serializers.PrimaryKeyRelatedField(
        queryset=Cualificacion.objects.all(),
        source="cualificacion",
        write_only=True
    )

    class Meta:
        model = TitulacionEmpleado
        fields = "__all__"

class MeritoCarreraSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeritoCarrera
        fields = '__all__'

class CompetenciaEmpleadoSerializer(serializers.ModelSerializer):
    habilidad = HabilidadUESerializer(read_only=True)
    class Meta:
        model = CompetenciaEmpleado
        exclude = ('nivel_jefe', 'observaciones_jefe')
class EvaluacionSimpleSerializer(serializers.ModelSerializer):
    puntos_tarea = serializers.SerializerMethodField()
    puntos_contextual = serializers.SerializerMethodField()

    class Meta:
        model = EvaluacionDesempeño
        fields = [
            'año', 
            'puntos_objetivos_individuales', 
            'puntos_objetivos_colectivos', 
            'puntos_tarea',        
            'puntos_contextual',   
            'nota_total'
        ]

    def _calcular_bloque(self, obj, bloque_tipo):
        if not obj.empleado or not obj.empleado.puesto_actual:
            return 0.0
        
        subgrupo = obj.empleado.puesto_actual.grupo[0]
        
        # Total de dimensiones obligatorias para su subgrupo
        total_dims = DimensionEvaluacion.objects.filter(
            Q(bloque=bloque_tipo) & (Q(subgrupo_aplicable=subgrupo) | Q(subgrupo_aplicable='TODOS'))
        ).count()
        
        if total_dims == 0: 
            return 0.0
        
        # Sumamos las notas reales que tiene el empleado en ese bloque
        suma = sum(n.puntuacion for n in obj.detalles_notas.all() if n.dimension.bloque == bloque_tipo)
        media = float(suma) / total_dims
        
        # Aplicamos la fórmula del decreto
        if media < 2:
            return 0.0
        return round(media * 1.25, 2)

    def get_puntos_tarea(self, obj):
        return self._calcular_bloque(obj, 'TAREA')

    def get_puntos_contextual(self, obj):
        return self._calcular_bloque(obj, 'CONTEXTUAL')
    
# Serializador de Empleado 
class EmpleadoSerializer(serializers.ModelSerializer):
    # para que Django no use el ID numérico por defecto
    puesto_actual = PuestoSerializer(read_only=True)
    unidad_organica = UnidadSerializer(read_only=True)
    rol = serializers.SerializerMethodField()
    def get_rol(self, obj):
        user = obj.user

        if user.groups.filter(name="Jefaturas").exists():
            return "JEFE"

        if user.groups.filter(name="RRHH").exists():
            return "RRHH"

        return "EMP"
    #  coincidir con related_name deL models.py
    historial_puestos = HistoricoPuestoSerializer(many=True, read_only=True)
    detalles_titulaciones = TitulacionEmpleadoSerializer(many=True, read_only=True)
    mis_meritos = MeritoCarreraSerializer(many=True, read_only=True)
    mochila = CompetenciaEmpleadoSerializer(many=True, read_only=True)
    nombre_jefe = serializers.SerializerMethodField()

    def get_nombre_jefe(self, obj):
        if obj.jefe:
            return f"{obj.jefe.nombre} {obj.jefe.apellidos}"
        return "Sin responsable asignado mal"
    evaluaciones = EvaluacionSimpleSerializer(many=True, read_only=True)

    
    class Meta:
        model = Empleado
        
        # se excluyen campos de auditoría para limpiar el JSON
        exclude = ('usuario_creacion', 'usuario_modificacion', 'user')