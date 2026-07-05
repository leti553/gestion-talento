
from django.db.models import FloatField, Sum, F, Avg, Count, Q, IntegerField
from django.db.models.functions import Coalesce, Cast
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404, render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework import status
from datetime import datetime

from .models import (
    Empleado, UnidadOrganica, CompetenciaEmpleado, DimensionEvaluacion, 
    EvaluacionDesempeño, NotaDimension, HabilidadUE, MeritoCarrera, 
    TitulacionEmpleado, Cualificacion, Ocupacion, Puesto
)
from .serializers import (
    MeritoCarreraSerializer, TitulacionEmpleadoSerializer, CualificacionSerializer,
    EvaluacionSimpleSerializer,UnidadSerializer,HistoricoPuestoSerializer
)

@login_required
def lista_empleados(request):
    user = request.user
    
    # Si es de PERSONAL  Ve todo
    if user.is_superuser or user.groups.filter(name='RRHH').exists():
        empleados = Empleado.objects.all()
        #  Por ahora  un template genérico 
        template = "talento/dashboard.html" 
    
    #Si es JEFE ve solo a sus subordinados
    elif user.groups.filter(name='Jefaturas').exists():
        empleados = Empleado.objects.filter(jefe__user=user)
        template = "talento/dashboard.html"
    
    # Si es EMPLEADO ve solo su ficha
    else:
        empleados = Empleado.objects.filter(user=user)
        template = "talento/dashboard.html"

    return render(request, template, {'empleados': empleados})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def actualizar_competencia(request, pk):
    comp = CompetenciaEmpleado.objects.get(pk=pk, empleado__user=request.user)

    if "nivel_autoevaluacion" in request.data:
        comp.nivel_autoevaluacion = request.data["nivel_autoevaluacion"]

    if "observaciones_empleado" in request.data:
        comp.observaciones_empleado = request.data["observaciones_empleado"]

    comp.save()
    return Response({"status": "ok"})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_competencia(request):
    empleado = request.user.empleado
    habilidad_id = request.data.get("habilidad")

    if not habilidad_id:
        return Response({"error": "Falta habilidad"}, status=400)

    # Crear la competencia
    comp = CompetenciaEmpleado.objects.create(
        empleado=empleado,
        habilidad_id=habilidad_id,
        origen="EXTRA",
        nivel_autoevaluacion="0",
        nivel_jefe="0"
    )

    return Response({
        "id": comp.id,
        "habilidad": {
            "id": comp.habilidad.id,
            "nombre": comp.habilidad.nombre
        },
        "origen": comp.origen,
        "nivel_autoevaluacion": comp.nivel_autoevaluacion,
        "observaciones_empleado": ""
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_habilidades(request):
    habilidades = HabilidadUE.objects.all().order_by("nombre")
    data = [
        {
            "id": h.id,
            "nombre": h.nombre,
        }
        for h in habilidades
    ]
    return Response(data)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_unidades(request):
    """Devuelve la lista de unidades orgánicas para los desplegables"""
    unidades = UnidadOrganica.objects.all().order_by('nombre')
    serializer = UnidadSerializer(unidades, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def buscar_habilidades(request):
    q = request.GET.get("q", "").strip()

    if len(q) < 2:
        return Response([])

    habilidades = HabilidadUE.objects.filter(nombre__icontains=q).order_by("nombre")[:20]

    data = [
        {"id": h.id, "nombre": h.nombre}
        for h in habilidades
    ]

    return Response(data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_merito(request):
    empleado = request.user.empleado

    merito = MeritoCarrera.objects.create(
        empleado=empleado,
        bloque=request.data.get("bloque"),
        titulo=request.data.get("titulo"),
        entidad=request.data.get("entidad"),
        fecha=request.data.get("fecha"),
        horas=request.data.get("horas", 0)
    )

    return Response({
        "id": merito.id,
        "bloque": merito.bloque,
        "titulo": merito.titulo,
        "entidad": merito.entidad,
        "fecha": merito.fecha,
        "horas": merito.horas
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def actualizar_merito(request, pk):
    empleado = request.user.empleado
    try:
        merito = MeritoCarrera.objects.get(pk=pk, empleado=empleado)
    except MeritoCarrera.DoesNotExist:
        return Response({"error": "Mérito no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    serializer = MeritoCarreraSerializer(merito, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_merito(request, pk):
    empleado = request.user.empleado
    try:
        merito = MeritoCarrera.objects.get(pk=pk, empleado=empleado)
    except MeritoCarrera.DoesNotExist:
        return Response({"error": "Mérito no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    merito.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

##########################
#esto es para el admin, para que al dar de alta el empleado, al elegir el puesto se le incluyan las competencias
def api_habilidades_puesto(request, puesto_id):
    try:
        # Obtenemos el puesto administrativo
        puesto = Puesto.objects.get(pk=puesto_id)
        habilidades_encontradas = {}

        # Puesto - Ocupaciones ESCO 
        for ocupacion in puesto.ocupaciones_esco.all():
            # RECORRIDO: Ocupación -> Habilidades Esenciales (M2M)
            for habilidad in ocupacion.habilidades_esenciales.all():
                habilidades_encontradas[habilidad.id] = {
                    'id': habilidad.id,
                    'nombre': habilidad.nombre
                }
        
        # habilidades directas de la RPT si las hubiera
      
        for habilidad in ocupacion.habilidades_esenciales.all():
            habilidades_encontradas[habilidad.id] = {
                'id': habilidad.id,
                'nombre': habilidad.nombre,
                'origen': 'ESCO_OBL'
            }

        for habilidad in ocupacion.habilidades_opcionales.all():
            habilidades_encontradas[habilidad.id] = {
                'id': habilidad.id,
                'nombre': habilidad.nombre,
                'origen': 'ESCO_OPC'
            }
        for hab_rpt in puesto.habilidades_rpt.all():
            habilidades_encontradas[hab_rpt.id] = {
                'id': hab_rpt.id,
                'nombre': hab_rpt.nombre,
                'origen': 'RPT'
            }

        return JsonResponse({'habilidades': list(habilidades_encontradas.values())})
    except Puesto.DoesNotExist:
        return JsonResponse({'error': 'Puesto no encontrado'}, status=404)

# LISTAR TITULACIONES DEL EMPLEADO
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_titulaciones(request):
    empleado = request.user.empleado
    titulos = TitulacionEmpleado.objects.filter(empleado=empleado)
    serializer = TitulacionEmpleadoSerializer(titulos, many=True)
    return Response(serializer.data)

# CREAR TITULACIÓN
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def crear_titulacion(request):
    empleado = request.user.empleado
    data = request.data.copy()
    data["empleado"] = empleado.id

    serializer = TitulacionEmpleadoSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

# ACTUALIZAR TITULACIÓN
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def actualizar_titulacion(request, pk):
    empleado = request.user.empleado
    try:
        titulo = TitulacionEmpleado.objects.get(pk=pk, empleado=empleado)
    except TitulacionEmpleado.DoesNotExist:
        return Response({"error": "No encontrado"}, status=404)

    serializer = TitulacionEmpleadoSerializer(titulo, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

# ELIMINAR TITULACIÓN
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def eliminar_titulacion(request, pk):
    empleado = request.user.empleado
    try:
        titulo = TitulacionEmpleado.objects.get(pk=pk, empleado=empleado)
    except TitulacionEmpleado.DoesNotExist:
        return Response({"error": "No encontrado"}, status=404)

    titulo.delete()
    return Response(status=204)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def listar_cualificaciones(request):
    cualificaciones = Cualificacion.objects.all().order_by("nombre")
    serializer = CualificacionSerializer(cualificaciones, many=True)
    return Response(serializer.data)


###############VISTAS JEFE####################

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def graficos_equipo_avanzados(request):
    jefe = request.user.empleado

    # Empleados del jefe
    empleados = Empleado.objects.filter(jefe=jefe)

    if not empleados.exists():
        return Response({
            "niveles_por_puesto": [],
            "niveles_por_puesto_evaluadas": [],
            "niveles_por_competencia": [],
            "diferencias_jefe_empleado": [],
            "empleados_mas_titulaciones": [],
            "top5_bajo_nivel": [],
            "empleados_sin_rellenar": [],
            "nivel_posible_vs_real": {},
            "evaluaciones_hechas": 0,
            "evaluaciones_cerradas": 0,    
            "evaluaciones_borrador": 0,    
            "evaluaciones_pendientes": 0,  
            "total_equipo": 0,
            "media_obj_ind": 0.0,
            "media_obj_col": 0.0,
            "media_tarea": 0.0,
            "media_contextual": 0.0,
            "peores_factores": [],
            "peores_empleados_desempeno": []
        })

    # Niveles por puesto
    niveles_por_puesto = (
        CompetenciaEmpleado.objects
        .filter(empleado__in=empleados)
        .values("empleado__puesto_actual__nombre")
        .annotate(media=Avg(Cast("nivel_jefe", IntegerField())))
        .order_by("empleado__puesto_actual__nombre")
    )
     # Niveles por puesto (evaluadas)
    niveles_por_puesto_evaluadas = (
        CompetenciaEmpleado.objects
        .filter(empleado__in=empleados)
        .exclude(nivel_jefe="0")
        .values("empleado__puesto_actual__nombre")
        .annotate(media=Avg(Cast("nivel_jefe", IntegerField())))
        .order_by("empleado__puesto_actual__nombre")
    )

    niveles_por_competencia = (
        CompetenciaEmpleado.objects
        .filter(empleado__in=empleados)  
        .values(
            "empleado__puesto_actual__nombre",
            "origen"                            
        )
        .annotate(
            media_autoevaluacion=Avg(Cast("nivel_autoevaluacion", IntegerField())),
            media_jefe=Avg(Cast("nivel_jefe", IntegerField()))
        )
        .order_by(
            "empleado__puesto_actual__nombre",
            "origen"
        )
    )
    
    # Diferencias entre nivel del empleado y nivel del jefe
    diferencias = (
        CompetenciaEmpleado.objects
        .filter(empleado__in=empleados)
        .annotate(
            diferencia=Cast("nivel_jefe", IntegerField()) - Cast("nivel_autoevaluacion", IntegerField())
        )
        .values("empleado__nombre", "habilidad__nombre", "diferencia")
    )

    # Empleados con más titulaciones
    empleados_mas_titulaciones = (
        TitulacionEmpleado.objects
        .filter(empleado__in=empleados)
        .values("empleado__nombre")
        .annotate(total=Count("id"))
        .order_by("-total")[:5]
    )

    # Top 5 empleados con más competencias < 3
    top5_bajo_nivel = (
        CompetenciaEmpleado.objects
        .filter(empleado__in=empleados, nivel_jefe__lt=3)
        .values("empleado__nombre")
        .annotate(total=Count("id"))
        .order_by("-total")[:5]
    )

    # Empleados que no rellenan sus competencias
    empleados_sin_rellenar = (
        empleados
        .filter(mochila__nivel_autoevaluacion__isnull=True)
        .values("nombre")
        .distinct()
    )

    # Nivel posible vs real del departamento
    habilidades_rpt = CompetenciaEmpleado.objects.filter(origen="RPT")
    nivel_posible = habilidades_rpt.count() * 4 

    nivel_real = (
        CompetenciaEmpleado.objects
        .filter(empleado__in=empleados, origen="RPT")
        .aggregate(media=Avg(Cast("nivel_jefe", IntegerField())))
    )["media"] or 0
    
    TRADUCCION_ORIGEN = {
        "RPT": "Requisito RPT",
        "ESCO_OBL": "Obligatoria ESCO",
        "ESCO_OPC": "Opcional ESCO",
        "EXTRA": "A mayores / Otras",
    }

    
    # --- DESEMPEÑO  ---
   
    evaluaciones = EvaluacionDesempeño.objects.filter(empleado__in=empleados)
    total_equipo = empleados.count()
    evaluaciones_hechas = evaluaciones.count()

    # CÁLCULO DE ESTADOS DE EVALUACIÓN 
    AÑO_EVALUACION = datetime.now().year - 1
    evaluaciones_año = evaluaciones.filter(año=AÑO_EVALUACION)
    evaluaciones_cerradas = evaluaciones_año.filter(estado='CERRADA').count()
    evaluaciones_borrador = evaluaciones_año.filter(estado='BORRADOR').count()
    evaluaciones_pendientes = max(0, total_equipo - (evaluaciones_cerradas + evaluaciones_borrador))
    

    agregados_obj = evaluaciones.aggregate(
        avg_ind=Avg('puntos_objetivos_individuales'),
        avg_col=Avg('puntos_objetivos_colectivos')
    )
    media_obj_ind = round(agregados_obj['avg_ind'] or 0, 2)
    media_obj_col = round(agregados_obj['avg_col'] or 0, 2)

    notas_dim = NotaDimension.objects.filter(evaluacion__in=evaluaciones)
    
    media_tarea = notas_dim.filter(dimension__bloque='TAREA').aggregate(m=Avg('puntuacion'))['m'] or 0
    media_contextual = notas_dim.filter(dimension__bloque='CONTEXTUAL').aggregate(m=Avg('puntuacion'))['m'] or 0

    peores_factores = list(
        notas_dim.values('dimension__nombre', 'dimension__bloque')
        .annotate(media=Avg('puntuacion'))
        .order_by('media')[:5] 
    )

    peores_empleados_desempeno = list(
        notas_dim.values('evaluacion__empleado__nombre', 'evaluacion__empleado__apellidos')
        .annotate(media=Avg('puntuacion'))
        .order_by('media')[:5] 
    )

    return Response({
        "niveles_por_puesto": [
            {"puesto": p["empleado__puesto_actual__nombre"], "media": round(p["media"], 2)}
            for p in niveles_por_puesto
        ],
         "niveles_por_puesto_evaluadas": [
            {"puesto": ne["empleado__puesto_actual__nombre"], "media": round(ne["media"], 2)}
            for ne in niveles_por_puesto_evaluadas
        ],
        "niveles_por_competencia": [
            {
            "grupo": f"{c['empleado__puesto_actual__nombre']} - {TRADUCCION_ORIGEN[c['origen']]}",
            "media_autoevaluacion": round(c["media_autoevaluacion"], 2),
            "media_jefe": round(c["media_jefe"], 2),
            }
            for c in niveles_por_competencia
        ],
        "diferencias_jefe_empleado": [
            {
                "empleado": d["empleado__nombre"],
                "competencia": d["habilidad__nombre"],
                "diferencia": d["diferencia"]
            }
            for d in diferencias
        ],
        "empleados_mas_titulaciones": list(empleados_mas_titulaciones),
        "top5_bajo_nivel": list(top5_bajo_nivel),
        "empleados_sin_rellenar": list(empleados_sin_rellenar),
        "nivel_posible_vs_real": {
            "posible": nivel_posible,
            "real": round(nivel_real, 2)
        },
        "evaluaciones_hechas": evaluaciones_hechas,
        "evaluaciones_cerradas": evaluaciones_cerradas,    # <-- AÑADIDO
        "evaluaciones_borrador": evaluaciones_borrador,    # <-- AÑADIDO
        "evaluaciones_pendientes": evaluaciones_pendientes,# <-- AÑADIDO
        "total_equipo": total_equipo,
        "media_obj_ind": media_obj_ind,
        "media_obj_col": media_obj_col,
        "media_tarea": round(media_tarea, 2),
        "media_contextual": round(media_contextual, 2),
        "peores_factores": peores_factores,
        "peores_empleados_desempeno": peores_empleados_desempeno
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mi_equipo_listado(request):


    jefe = request.user.empleado

    empleados = Empleado.objects.filter(jefe=jefe)

    datos = []
    for e in empleados:
        competencias = e.mochila.all()

        media_auto = competencias.aggregate(
            m=Avg(Cast("nivel_autoevaluacion", IntegerField()))
        )["m"] or 0

        media_jefe = competencias.aggregate(
            m=Avg(Cast("nivel_jefe", IntegerField()))
        )["m"] or 0

        datos.append({
            "id": e.id,
            "nombre": f"{e.nombre} {e.apellidos}",
            "puesto": e.puesto_actual.nombre,
            "media_autoevaluacion": round(media_auto, 2),
            "media_jefe": round(media_jefe, 2),
        })

    return Response(datos)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def competencias_empleado(request, empleado_id):
    
    user = request.user
    empleado_logueado = user.empleado

    # Buscamos al empleado solicitado en la base de datos (si no existe, da error 404)
    empleado = get_object_or_404(Empleado, id=empleado_id)

    # Validamos los permisos: ¿Es de RRHH/Superusuario o es su jefe directo?
    es_rrhh = user.groups.filter(name='RRHH').exists() or user.is_superuser
    es_jefe_directo = (empleado.jefe == empleado_logueado)

    # Si no cumple ninguna de las dos condiciones, le bloqueamos el paso
    if not (es_rrhh or es_jefe_directo):
        return Response({"error": "No tienes acceso al expediente de este empleado"}, status=403)

    
    comps = CompetenciaEmpleado.objects.filter(empleado=empleado)

    # lista de competencias con el formato que los gráficos entienden
    lista_comps = [
        {
            "id": c.id,
            "habilidad": {"nombre": c.habilidad.nombre}, 
            "origen": c.origen,
            "nivel_autoevaluacion": c.nivel_autoevaluacion or 0,
            "nivel_jefe": c.nivel_jefe or 0,
            "observaciones_empleado": c.observaciones_empleado or "",
            "observaciones_jefe": c.observaciones_jefe or "",
        }
        for c in comps
    ]
    
    puesto_nombre = empleado.puesto_actual.nombre if empleado.puesto_actual else "Sin puesto"
    unidad_nombre = empleado.unidad_organica.nombre if empleado.unidad_organica else "Sin unidad"
    nombre_jefe_str = f"{empleado.jefe.nombre} {empleado.jefe.apellidos}" if empleado.jefe else "Sin responsable asignado"

    evaluaciones = EvaluacionDesempeño.objects.filter(empleado=empleado)
    evaluaciones_data = EvaluacionSimpleSerializer(evaluaciones, many=True).data
    
    historial_data = HistoricoPuestoSerializer(empleado.historial_puestos.all().order_by('-fecha_inicio'), many=True).data
    titulaciones_data = TitulacionEmpleadoSerializer(empleado.detalles_titulaciones.all().order_by('-fecha_obtencion'), many=True).data
    meritos_data = MeritoCarreraSerializer(empleado.mis_meritos.all().order_by('-fecha'), many=True).data

    return Response({
        "empleado": {
            "id": empleado.id,
            "nombre": empleado.nombre,
            "apellidos": empleado.apellidos,
            "puesto": puesto_nombre,
            "unidad": unidad_nombre,
            "nombre_jefe": nombre_jefe_str,
            "evaluaciones": evaluaciones_data,
            "historial": historial_data,
            "titulaciones": titulaciones_data,
            "meritos": meritos_data
        },
        "competencias": lista_comps
    })
    

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def actualizar_competencia_jefe(request, pk):
    jefe = request.user.empleado

    try:
        comp = CompetenciaEmpleado.objects.get(id=pk, empleado__jefe=jefe)
    except CompetenciaEmpleado.DoesNotExist:
        return Response({"error": "No tienes permiso"}, status=403)

    if "nivel_jefe" in request.data:
        comp.nivel_jefe = request.data["nivel_jefe"]

    if "observaciones_jefe" in request.data:
        comp.observaciones_jefe = request.data["observaciones_jefe"]

    comp.save()
    return Response({"status": "ok"})


#############################
#rrhh
#############################

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def graficos_rrhh_api(request):
    unidad_id = request.GET.get('unidad_id')
    empleados_qs = Empleado.objects.all()
    
    if unidad_id:
        empleados_qs = empleados_qs.filter(unidad_organica_id=unidad_id)

    
    # MÉTRICAS DE TALENTO
    
    niveles_por_puesto_qs = (
        CompetenciaEmpleado.objects.filter(empleado__in=empleados_qs, nivel_jefe__isnull=False)
        .values('empleado__puesto_actual__nombre')
        .annotate(media=Coalesce(Avg(Cast('nivel_jefe', output_field=FloatField())), 0.0))
        .order_by('empleado__puesto_actual__nombre')
    )
    
    niveles_por_puesto = [
        {
            "puesto_actual__nombre": item['empleado__puesto_actual__nombre'] or "Sin Puesto Asignado",
            "media": round(float(item['media']), 2)
        } for item in niveles_por_puesto_qs
    ]

    distribucion_qs = (
        CompetenciaEmpleado.objects.filter(empleado__in=empleados_qs, nivel_jefe__isnull=False)
        .annotate(nivel_num=Cast('nivel_jefe', output_field=IntegerField()))
        .values('nivel_num')
        .annotate(value=Count('id'))
        .order_by('nivel_num')
    )
    
    distribucion_niveles = [
        {
            "name": int(item['nivel_num']) if item['nivel_num'] is not None else 0,
            "value": int(item['value'])
        } for item in distribucion_qs
    ]

    empleados_sin_rellenar = list(
        empleados_qs.filter(
            Q(mochila__nivel_autoevaluacion__isnull=True) | 
            Q(mochila__nivel_autoevaluacion='0') |
            Q(mochila__isnull=True)
        )
        .values('id', 'nombre', 'apellidos')
        .distinct()
    )

    total_real = CompetenciaEmpleado.objects.filter(empleado__in=empleados_qs).aggregate(
        suma=Coalesce(Sum(Cast('nivel_jefe', output_field=FloatField())), 0.0)
    )['suma']
    
    total_competencias = CompetenciaEmpleado.objects.filter(empleado__in=empleados_qs).count()
    total_esperado = total_competencias * 4

    nivel_posible_vs_real = {
        "posible": int(total_esperado) if total_esperado > 0 else 10,
        "real": int(total_real)
    }

    unidades = list(UnidadOrganica.objects.values('id', 'nombre').order_by('nombre'))
    total_empleados = empleados_qs.count()

    
    # MÉTRICAS DE DESEMPEÑO 
  
    AÑO_EVALUACION = int(request.GET.get('anio', datetime.now().year - 1))
    evaluaciones = EvaluacionDesempeño.objects.filter(empleado__in=empleados_qs, año=AÑO_EVALUACION)
    
    evaluaciones_cerradas = evaluaciones.filter(estado='CERRADA').count()
    evaluaciones_borrador = evaluaciones.filter(estado='BORRADOR').count()
    evaluaciones_pendientes = max(0, total_empleados - (evaluaciones_cerradas + evaluaciones_borrador))

    agregados_obj = evaluaciones.aggregate(
        avg_ind=Avg('puntos_objetivos_individuales'),
        avg_col=Avg('puntos_objetivos_colectivos')
    )
    media_obj_ind = round(agregados_obj['avg_ind'] or 0, 2)
    media_obj_col = round(agregados_obj['avg_col'] or 0, 2)

    notas_dim = NotaDimension.objects.filter(evaluacion__in=evaluaciones)
    
    media_tarea = notas_dim.filter(dimension__bloque='TAREA').aggregate(m=Avg('puntuacion'))['m'] or 0
    media_contextual = notas_dim.filter(dimension__bloque='CONTEXTUAL').aggregate(m=Avg('puntuacion'))['m'] or 0

    peores_factores = list(
        notas_dim.values('dimension__nombre', 'dimension__bloque')
        .annotate(media=Avg('puntuacion'))
        .order_by('media')[:5] 
    )

    peores_empleados_desempeno = list(
        notas_dim.values('evaluacion__empleado__nombre', 'evaluacion__empleado__apellidos')
        .annotate(media=Avg('puntuacion'))
        .order_by('media')[:5] 
    )

    return Response({
        "unidades": unidades,
        "niveles_por_puesto": niveles_por_puesto,
        "distribucion_niveles": distribucion_niveles,
        "empleados_sin_rellenar": empleados_sin_rellenar,
        "nivel_posible_vs_real": nivel_posible_vs_real,
        "total_empleados": total_empleados,
        
        "evaluaciones_cerradas": evaluaciones_cerradas,
        "evaluaciones_borrador": evaluaciones_borrador,
        "evaluaciones_pendientes": evaluaciones_pendientes,
        "media_obj_ind": media_obj_ind,
        "media_obj_col": media_obj_col,
        "media_tarea": round(media_tarea, 2),
        "media_contextual": round(media_contextual, 2),
        "peores_factores": peores_factores,
        "peores_empleados_desempeno": peores_empleados_desempeno
    })

from datetime import datetime,date

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_evaluaciones_equipo_jefe(request):
    """Devuelve los empleados. Si es RRHH, devuelve todos y permite filtrar. Indica si puede editar."""
    empleado_logueado = request.user.empleado
    es_rrhh = request.user.groups.filter(name='RRHH').exists()
    unidad_id = request.GET.get('unidad_id')
    AÑO_EVALUACION = int(request.GET.get('anio', datetime.now().year - 1))
    ultimo_dia_año = date(AÑO_EVALUACION, 12, 31)
    empleados = Empleado.objects.filter(
        
        fecha_alta__lte=ultimo_dia_año
    ).select_related('puesto', 'unidad')
    
    # Determinar el listado de empleados según el rol
    if es_rrhh:
        empleados = Empleado.objects.all()
        if unidad_id:
            empleados = empleados.filter(unidad_organica_id=unidad_id,fecha_alta__lte=ultimo_dia_año)
        unidades = list(UnidadOrganica.objects.values('id', 'nombre').order_by('nombre'))
    else:
        empleados = Empleado.objects.filter(jefe=empleado_logueado,fecha_alta__lte=ultimo_dia_año)
        unidades = []

   
    #  datos
    datos_empleados = []
    for emp in empleados:
        evaluacion = EvaluacionDesempeño.objects.filter(empleado=emp, año=AÑO_EVALUACION).first()
        
        # Regla de negocio: Solo puede evaluar (editar) el jefe directo
        puede_evaluar = (emp.jefe == empleado_logueado)
        
        datos_empleados.append({
            "id": emp.id,
            "nombre_completo": f"{emp.nombre} {emp.apellidos}",
            "puesto": emp.puesto_actual.nombre if emp.puesto_actual else "No asignado",
            "grupo": emp.puesto_actual.grupo if emp.puesto_actual else "C1",
            "tiene_evaluacion": evaluacion is not None,
            "evaluacion_id": evaluacion.id if evaluacion else None,
            "estado_evaluacion": evaluacion.estado if evaluacion else "PENDIENTE",
            "nota_total": evaluacion.nota_total if evaluacion else 0.0,
            "puede_evaluar": puede_evaluar
        })

    return Response({
        "empleados": datos_empleados,
        "unidades": unidades,
        "es_rrhh": es_rrhh
    })

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def api_detalle_evaluacion_jefe(request, empleado_id):
    """Obtiene y guarda los detalles, incluyendo las descripciones de objetivos."""
    empleado_logueado = request.user.empleado
    empleado = get_object_or_404(Empleado, id=empleado_id)
    es_rrhh = request.user.groups.filter(name='RRHH').exists()
    
    # Validación de seguridad
    if empleado.jefe != empleado_logueado and not es_rrhh:
        return Response({"error": "No tienes acceso a esta evaluación"}, status=403)

    # Recoger el año de la petición 
    anio_param = request.GET.get('anio') or request.data.get('anio')
    AÑO_EVALUACION = int(anio_param) if anio_param else datetime.now().year - 1
    
    evaluacion, creado = EvaluacionDesempeño.objects.get_or_create(
        empleado=empleado,
        año=AÑO_EVALUACION,
        defaults={"evaluador": empleado.jefe, "estado": "BORRADOR"}
    )
    
    subgrupo = empleado.puesto_actual.grupo[0] if empleado.puesto_actual else 'C'
    dimensiones = DimensionEvaluacion.objects.filter(subgrupo_aplicable__in=[subgrupo, 'TODOS'])
    es_rrhh_o_admin = request.user.groups.filter(name='RRHH').exists() or request.user.is_superuser
    
    anio_param = request.GET.get('anio') or request.data.get('anio')
    AÑO_EVALUACION = int(anio_param) if anio_param else datetime.now().year - 1
    
    if request.method == "POST":
        # BLOQUEO: Si no es el año activo Y TAMPOCO es RRHH/Admin, rechazamos
        if AÑO_EVALUACION != (datetime.now().year - 1) and not es_rrhh_o_admin:
            return Response(
                {"error": "Las evaluaciones de años cerrados solo pueden ser modificadas por Recursos Humanos o Administración."}, 
                status=403
            )
    if request.method == "POST":
        # Solo el evaluador/jefe directo debería poder modificar
        if empleado.jefe != empleado_logueado:
            return Response({"error": "Solo el responsable directo puede modificar la evaluación"}, status=403)

        with transaction.atomic():
            notas_data = request.data.get("notas", {})
            for dim in dimensiones:
                puntuacion = _valida_nota(notas_data.get(str(dim.id), notas_data.get(dim.id)))
                if puntuacion:
                    NotaDimension.objects.update_or_create(
                        evaluacion=evaluacion,
                        dimension=dim,
                        defaults={"puntuacion": puntuacion}
                    )
            
            # Guardado de campos de texto y notas
            evaluacion.informe_final = request.data.get("informe_final", evaluacion.informe_final)
            evaluacion.descripcion_objetivos_individuales = request.data.get("descripcion_indiv", evaluacion.descripcion_objetivos_individuales)
            evaluacion.descripcion_objetivos_colectivos = request.data.get("descripcion_colec", evaluacion.descripcion_objetivos_colectivos)
            
            evaluacion.puntos_objetivos_individuales = request.data.get("puntos_individuales", evaluacion.puntos_objetivos_individuales)
            evaluacion.puntos_objetivos_colectivos = request.data.get("puntos_colectivos", evaluacion.puntos_objetivos_colectivos)
            
            if request.data.get("cerrar") == True:
                evaluacion.estado = "CERRADA"
            
            evaluacion.save()
            return Response({"status": "ok", "nota_total": evaluacion.nota_total})

    notas_existentes = {n.dimension_id: n.puntuacion for n in evaluacion.detalles_notas.all()}
    
    dimensiones_payload = [{
        "id": d.id,
        "nombre": d.nombre,
        "descripcion": d.descripcion,
        "bloque": d.bloque,
        "es_obligatoria": d.es_obligatoria,
        "nota_actual": notas_existentes.get(d.id, 0)
    } for d in dimensiones]
    
    return Response({
        "empleado_id": empleado.id,
        "empleado": f"{empleado.nombre} {empleado.apellidos}",
        "puesto": empleado.puesto_actual.nombre if empleado.puesto_actual else "",
        "evaluacion_id": evaluacion.id,
        "estado": evaluacion.estado,
        "informe_final": evaluacion.informe_final or "",
        "descripcion_indiv": evaluacion.descripcion_objetivos_individuales or "",
        "descripcion_colec": evaluacion.descripcion_objetivos_colectivos or "",
        "puntos_individuales": float(evaluacion.puntos_objetivos_individuales or 0.0),
        "puntos_colectivos": float(evaluacion.puntos_objetivos_colectivos or 0.0),
        "dimensiones": dimensiones_payload,
        "puede_evaluar": (empleado.jefe == empleado_logueado)
    })

def _valida_nota(valor):
    try:
        v = int(valor)
        return v if 1 <= v <= 4 else None
    except (ValueError, TypeError):
        return None

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def buscador_talento_basico(request):
    """Busca empleados por habilidad, nivel y unidad"""
    habilidad_id = request.GET.get('habilidad_id')
    nivel_minimo = str(request.GET.get('nivel_minimo', '1')) 
    unidad_id = request.GET.get('unidad_id')

    # Filtramos por nivel (Jefe o Autoevaluación)
    qs = CompetenciaEmpleado.objects.filter(
        Q(nivel_jefe__gte=nivel_minimo) | Q(nivel_autoevaluacion__gte=nivel_minimo)
    )

    if habilidad_id:
        qs = qs.filter(habilidad_id=habilidad_id)
    
    if unidad_id:
        qs = qs.filter(empleado__unidad_organica_id=unidad_id)

    # Obtenemos IDs únicos de empleados
    empleados_ids = qs.values_list('empleado_id', flat=True).distinct()
    empleados = Empleado.objects.filter(id__in=empleados_ids).select_related('puesto_actual', 'unidad_organica')

    # Formateamos la respuesta
    resultados = []
    for e in empleados:
        resultados.append({
            "id": e.id,
            "nombre_completo": f"{e.nombre} {e.apellidos}",
            "puesto": e.puesto_actual.nombre if e.puesto_actual else "Sin puesto",
            "unidad": e.unidad_organica.nombre if e.unidad_organica else "Sin unidad",
            "email": e.email or "Sin correo"
        })

    return Response(resultados)