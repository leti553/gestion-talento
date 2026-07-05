from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.contrib.auth.models import Group
from django import forms
from django.db import models
from django.db.models import Q # Necesario para el filtro

from .models import *


from .models import (
    UnidadOrganica, GrupoISCO, GrupoHabilidad, HabilidadUE, Ocupacion,
    Cualificacion, Puesto, Empleado, CompetenciaEmpleado, EvaluacionDesempeño,
    HistoricoPuesto, TitulacionEmpleado, DimensionEvaluacion, NotaDimension, MeritoCarrera
)


# CONFIGURACIÓN GLOBAL DEL SITIO


admin.site.site_header = "GESTA - Gestión del talento"                              # Lo que sale en la barra azul
admin.site.site_title = "GESTA - Ayuntamiento del Mundo"                            # Lo que sale en la pestaña del navegador
admin.site.index_title = "Sistema de Gestión del talento y Evaluación del Desempeño " # título central


# CLASES 


# AUDITORÍAS
# Para las páginas principales
class BaseAuditoriaAdmin(admin.ModelAdmin):
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.usuario_creacion = request.user
        obj.usuario_modificacion = request.user
        super().save_model(request, obj, form, change)

# Para las tablas que van dentro de otras (Inlines)
class BaseAuditoriaInline(admin.TabularInline):
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    extra = 0

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if not instance.pk:
                instance.usuario_creacion = request.user
            instance.usuario_modificacion = request.user
            instance.save()
        formset.save_m2m()
        
class HistoricoPuestoInline(BaseAuditoriaInline):
    model = HistoricoPuesto
    fk_name = 'empleado'
    extra = 0
    fields = ('puesto', 'unidad_organica', 'fecha_inicio', 'fecha_fin', 'motivo_cambio')
    readonly_fields = ('puesto', 'jefe_en_ese_momento', 'fecha_inicio', 'fecha_fin', 'motivo_cambio')
    verbose_name = "Movimiento Histórico"
    can_delete = False
    classes = ['collapse']

class TitulacionEmpleadoInline(BaseAuditoriaInline):
    model = TitulacionEmpleado
    extra = 1
    autocomplete_fields = ['cualificacion']


class CompetenciaEmpleadoInline(BaseAuditoriaInline):
    model = CompetenciaEmpleado
    extra = 1
    autocomplete_fields = ['habilidad']

    formfield_overrides = {
        models.TextField: {'widget': forms.Textarea(attrs={'rows': 2, 'cols': 40})},
    }

    # Campos visibles
    fields = (
        'habilidad',
        'origen',
        'nivel_jefe',
        'observaciones_jefe',
    )

    # Campos que NO deben verse
    exclude = ('nivel_autoevaluacion',)

class NotaDimensionInline(BaseAuditoriaInline):
    model = NotaDimension
    extra = 0 # No añade filas vacías
    can_delete = False
    autocomplete_fields = ['dimension']

# MAESTROS INTERNOS & JERARQUÍAS


@admin.register(UnidadOrganica)
class UnidadOrganicaAdmin(BaseAuditoriaAdmin):
    list_display = ('nombre_jerarquico', 'codigo_ayto', 'codigo_dir3', 'padre', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_filter = ('padre',)
    search_fields = ('nombre', 'codigo_ayto', 'codigo_dir3')
    # unidades con muchos niveles
    autocomplete_fields = ['padre'] 

    @admin.display(description='Unidad Orgánica (Jerarquía)')
    def nombre_jerarquico(self, obj):
        # Añade guiones o espacios
        nivel = obj.get_nivel()
        prefijo = "—" * nivel + " " if nivel > 0 else ""
        return f"{prefijo}{obj.nombre}"
    
@admin.register(GrupoISCO)
class GrupoISCOAdmin(BaseAuditoriaAdmin):
    list_display = ('codigo_isco', 'nombre', 'enlace_esco', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    search_fields = ('codigo_isco', 'nombre')

    @admin.display(description='Referencia ESCO')
    def enlace_esco(self, obj):
        return format_html('<a href="{}" target="_blank">🔗 Ver en ESCO</a>', obj.uri_esco)

@admin.register(GrupoHabilidad)
class GrupoHabilidadAdmin(BaseAuditoriaAdmin):
    list_display = ('codigo_jerarquico', 'nombre', 'enlace_esco', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    search_fields = ('codigo_jerarquico', 'nombre')

    @admin.display(description='Referencia ESCO')
    def enlace_esco(self, obj):
        return format_html('<a href="{}" target="_blank">🔗 Ver en ESCO</a>', obj.uri_esco)


# HABILIDADES Y OCUPACIONES 


@admin.register(HabilidadUE)
class HabilidadUEAdmin(BaseAuditoriaAdmin):
    list_display = ('nombre', 'tipo_badge', 'reuso_badge', 'transversal_icon', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_filter = ('tipo', 'nivel_reuso', 'es_transversal_oficial')
    search_fields = ('nombre', 'etiquetas_alternativas', 'descripcion')
    autocomplete_fields = ['grupo_principal', 'padre']
    list_per_page = 50

    @admin.display(description='Tipo', ordering='tipo')
    def tipo_badge(self, obj):
        color = "#3498db" if obj.tipo == 'knowledge' else "#e67e22"
        icon = "🧠" if obj.tipo == 'knowledge' else "🛠️"
        return format_html('<span style="background:{}; color:white; padding:3px 8px; border-radius:10px;">{} {}</span>', color, icon, obj.get_tipo_display())

    @admin.display(description='Reuso', ordering='nivel_reuso')
    def reuso_badge(self, obj):
        if not obj.nivel_reuso: return "-"
        colors = {'transversal': '#9b59b6', 'cross-sector': '#2ecc71', 'sector-specific': '#f1c40f', 'occupation-specific': '#34495e'}
        return format_html('<span style="color:{}; font-weight:bold;">{}</span>', colors.get(obj.nivel_reuso, '#000'), obj.get_nivel_reuso_display())

    @admin.display(description='¿Transversal?', ordering='es_transversal_oficial')
    def transversal_icon(self, obj):
        return "⭐ Sí" if obj.es_transversal_oficial else "No"

@admin.register(Ocupacion)
class OcupacionAdmin(BaseAuditoriaAdmin):
    list_display = ('codigo_esco', 'nombre', 'grupo_isco_tag', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_filter = ('grupo_isco',)
    search_fields = ('codigo_esco', 'nombre')
    autocomplete_fields = ['grupo_isco', 'padre']
    filter_horizontal = ('habilidades_esenciales', 'habilidades_opcionales')

    @admin.display(description='Grupo ISCO', ordering='grupo_isco__nombre')
    def grupo_isco_tag(self, obj):
        return format_html('<span style="background:#ecf0f1; padding:3px 6px; border:1px solid #bdc3c7; border-radius:4px;">{}</span>', obj.grupo_isco.codigo_isco)


# TITULACIONES

@admin.register(Cualificacion)
class CualificacionAdmin(BaseAuditoriaAdmin):
    list_display = ('nombre', 'tipo_badge', 'nivel_eqf_badge', 'codigo_oficial', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_filter = ('tipo', 'nivel_eqf')
    search_fields = ('nombre', 'codigo_oficial', 'universidad')

    @admin.display(description='Tipo', ordering='tipo')
    def tipo_badge(self, obj):
        colores = {'ESCO': '#2980b9', 'RUCT': '#8e44ad', 'FP': '#d35400', 'INCUAL': '#c0392b', 'INTERNA': '#27ae60'}
        return format_html('<span style="background:{}; color:white; padding:3px 8px; border-radius:4px;">{}</span>', colores.get(obj.tipo, '#000'), obj.tipo)

    @admin.display(description='Nivel EQF', ordering='nivel_eqf')
    def nivel_eqf_badge(self, obj):
        if not obj.nivel_eqf: return "-"
        return format_html('<span style="border-radius:50%; background:#34495e; color:white; padding:4px 8px;">{}</span>', obj.nivel_eqf)


# PERSONAL Y RPT 



class PuestoAdminForm(forms.ModelForm):
    class Meta:
        model = Puesto
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            # filtro para que no se pueda elegir a mayores una habilidad que ya está elegida por estar en el puesto desde ESCO
            ocupaciones = self.instance.ocupaciones_esco.all()
            ids_ya_en_esco = HabilidadUE.objects.filter(
                Q(esencial_en__in=ocupaciones) | Q(opcional_en__in=ocupaciones)
            ).values_list('id', flat=True).distinct()
            
            self.fields['habilidades_rpt'].queryset = HabilidadUE.objects.exclude(id__in=ids_ya_en_esco)


@admin.register(Puesto)
class PuestoAdmin(BaseAuditoriaAdmin):
    form = PuestoAdminForm # Activamos el filtro
    list_display = ('nombre', 'grupo_badge', 'nivel_badge', 'usuario_modificacion', 'fecha_modificacion')
    #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_filter = ('grupo', 'nivel')
    search_fields = ('nombre',)
    filter_horizontal = ('habilidades_rpt', 'ocupaciones_esco')

    # grupos
    @admin.display(description='Grupo', ordering='grupo')
    def grupo_badge(self, obj):
        colors = {'A1': '#d4af37', 'A2': '#c0c0c0', 'C1': '#cd7f32', 'C2': '#8c7853'}
        return format_html('<span style="background:{}; color:white; padding:4px 8px; border-radius:4px; font-weight:bold;">{}</span>', colors.get(obj.grupo, '#000'), obj.grupo)

    @admin.display(description='Nivel', ordering='nivel')
    def nivel_badge(self, obj):
        return format_html('<b>N-{}</b>', obj.nivel)


@admin.register(Empleado)
class EmpleadoAdmin(BaseAuditoriaAdmin):
    # Búsqueda y Autocompletado
    search_fields = ('nombre', 'apellidos', 'dni', 'email')
    autocomplete_fields = ['user', 'puesto_actual', 'jefe']

    # Vista de Lista
    list_display = ('icono_perfil', 'full_name', 'puesto_tag', 'semaforo_tag', 'estado_badge', 'usuario_modificacion', 'fecha_modificacion')
    list_display_links = ('icono_perfil', 'full_name')
    list_filter = ('unidad_organica', 'puesto_actual__grupo', 'fecha_alta')
    
    @admin.display(description='Unidad Orgánica')
    def unidad_tag(self, obj):
        if obj.unidad_organica:
            return format_html('<span style="color: #666;">🏢 {}</span>', obj.unidad_organica.nombre)
        return "-"
    
    class Media:
        js = ('admin/js/cargar_habilidades.js',)
    
    # Inlines
    inlines = [TitulacionEmpleadoInline, CompetenciaEmpleadoInline, HistoricoPuestoInline]

    # Organización del Formulario
    fieldsets = (
        ('Identidad', {
            'fields': (('nombre', 'apellidos'), ('dni', 'email'), 'user'),
        }),
        ('Situación Administrativa', {
        'fields': (
            ('puesto_actual', 'unidad_organica'),
            'jefe', 
            ('fecha_alta', 'fecha_baja_jubilacion')
        ),
        }),
        ('Auditoría', {
            'fields': ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion'),
            'classes': ('collapse',),
        }),
    )
       #campos de auditoria
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')

    # --- Lógica de Idoneidad ---
    @admin.display(description='Idoneidad RPT')
    def semaforo_tag(self, obj):
        competencias = obj.mochila.all()
        if not competencias.exists():
            return format_html('<span style="color:gray;">⚪ Sin evaluar</span>')

        faltan_obligatorias = competencias.filter(origen='RPT', nivel_jefe__isnull=True).exists()
        
        nivel_bajo = False
        nivel_bajo = competencias.filter(nivel_jefe__isnull=False, nivel_jefe__gt=0,nivel_jefe__lt=3).exists()
            
        
        tiene_extras = competencias.filter(origen='EXTRA').exists()

        if faltan_obligatorias:
            return format_html('<b style="color:#e74c3c;">🔴 Incompleto</b>')
        if nivel_bajo:
            return format_html('<b style="color:#f39c12;">🟡 Nivel Insuficiente</b>')
        else: 
            return format_html('<b style="color:#27ae60;">🟢 Idóneo</b>')
       

    # --- Estilos Visuales ---
    @admin.display(description='', ordering='apellidos')
    def icono_perfil(self, obj):
        is_baja = obj.fecha_baja_jubilacion and obj.fecha_baja_jubilacion <= timezone.now().date()
        color = "#95a5a6" if is_baja else ["#1abc9c", "#3498db", "#9b59b6", "#e67e22", "#e74c3c"][len(obj.nombre) % 5]
        iniciales = f"{obj.nombre[0]}{obj.apellidos[0]}".upper()
        return format_html('<div style="width:35px; height:35px; background:{}; color:white; border-radius:50%; text-align:center; line-height:35px; font-weight:bold; font-size:14px;">{}</div>', color, iniciales)

    @admin.display(description='Empleado', ordering='apellidos')
    def full_name(self, obj):
        return format_html('<b>{}</b>, {}', obj.apellidos.upper(), obj.nombre)

    @admin.display(description='Puesto Actual')
    def puesto_tag(self, obj):
        return format_html('<span style="color: #2980b9;">📍 {}</span>', obj.puesto_actual.nombre)

    @admin.display(description='Estado')
    def estado_badge(self, obj):
        if obj.fecha_baja_jubilacion and obj.fecha_baja_jubilacion <= timezone.now().date():
            return format_html('<span style="background:#c0392b; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">BAJA</span>')
        return format_html('<span style="background:#27ae60; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">ACTIVO</span>')

# 
# CARRERA Y EVALUACIÓN


# Dimensiones 
@admin.register(DimensionEvaluacion)
class DimensionEvaluacionAdmin(BaseAuditoriaAdmin):
    list_display = ('nombre', 'bloque', 'subgrupo_aplicable', 'es_obligatoria', 'usuario_modificacion')
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_filter = ('bloque', 'subgrupo_aplicable', 'es_obligatoria')
    search_fields = ('nombre', 'descripcion')
    verbose_name_plural = "Dimensiones de Evaluación"


@admin.register(EvaluacionDesempeño)
class EvaluacionDesempeñoAdmin(BaseAuditoriaAdmin):
    inlines = [NotaDimensionInline]
    list_display = ('empleado', 'año', 'estado', 'nota_final_total_visual', 'usuario_modificacion')
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion', 'nota_final_total_visual')
    list_filter = ('año', 'estado', 'empleado')
    
    fieldsets = (
        ('Identificación y Estado', {
            'fields': ('empleado', 'año', 'evaluador', 'estado')
        }),
        ('Bloque Objetivos (Textos y Puntuación)', {
            'fields': (
                'descripcion_objetivos_colectivos',
                'puntos_objetivos_colectivos',
                'descripcion_objetivos_individuales',
                'puntos_objetivos_individuales',
            ),
        }),
        ('Méritos Consolidados (III y IV)', {
            'fields': (
                ('puntos_formacion_III', 'puntos_innovacion_IV'),
            ),
        }),
        ('RESULTADO FINAL Y CONCLUSIONES', {
            'fields': ('nota_final_total_visual', 'informe_final'), 
        }),
    )

    @admin.display(description='Puntuación Total Acumulada')
    def nota_final_total_visual(self, obj):
        return format_html('<b style="font-size:1.2em; color:#2980b9;">{} puntos</b>', obj.nota_total)

@admin.register(MeritoCarrera)
class MeritoCarreraAdmin(BaseAuditoriaAdmin):

  
    readonly_fields = ('fecha_creacion', 'fecha_modificacion', 'usuario_creacion', 'usuario_modificacion')
    list_display = ('empleado', 'bloque', 'titulo', 'fecha', 'horas', 'usuario_modificacion', 'fecha_modificacion')
    list_filter = ('bloque', 'fecha', 'empleado')
    search_fields = ('titulo', 'empleado__apellidos')