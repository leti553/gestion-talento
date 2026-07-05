from django.urls import path
from . import views
from talento.views import actualizar_competencia, crear_competencia
from talento.views import listar_habilidades, buscar_habilidades, crear_merito,buscador_talento_basico

urlpatterns = [
    # Empleado 
    path('dashboard/', views.lista_empleados, name='dashboard'),
    path("api/competencia/<int:pk>/", actualizar_competencia),
    path("api/competencia/nueva/", crear_competencia),

    # Habilidades
    path("api/habilidades/", listar_habilidades),
    path('api/unidades/', views.listar_unidades, name='listar_unidades'),
    path("api/habilidades/buscar/", buscar_habilidades),
    path('api/buscador-basico/', buscador_talento_basico, name='buscador_basico'),

    # Méritos
    path("api/meritos/nuevo/", crear_merito),
    path("api/meritos/<int:pk>/", views.actualizar_merito, name="actualizar_merito"),
    path("api/meritos/<int:pk>/eliminar/", views.eliminar_merito, name="eliminar_merito"),

    # Titulaciones
    path("api/titulaciones/", views.listar_titulaciones),
    path("api/titulaciones/nueva/", views.crear_titulacion),
    path("api/titulaciones/<int:pk>/", views.actualizar_titulacion),
    path("api/titulaciones/<int:pk>/eliminar/", views.eliminar_titulacion),

    # Cualificaciones
    path("api/cualificaciones/", views.listar_cualificaciones),

    # Habilidades por puesto
    path('api/habilidades-puesto/<int:puesto_id>/', views.api_habilidades_puesto, name='api_habilidades_puesto'),

    # Jefe
    path("api/mi-equipo/graficos-avanzados/", views.graficos_equipo_avanzados),
    path('api/mi-equipo/', views.mi_equipo_listado, name='mi_equipo_listado'),

    # autoevaluaciones y evaluaciones del jefe de las competencias
    path("api/empleado/<int:empleado_id>/competencias/", views.competencias_empleado),
    path("api/competencia/<int:pk>/jefe/", views.actualizar_competencia_jefe),

    #rrhh
    path('api/rrhh/graficos/', views.graficos_rrhh_api, name='graficos_rrhh'),
    path("api/jefe/evaluaciones-equipo/", views.api_evaluaciones_equipo_jefe),
    path("api/jefe/evaluacion-empleado/<int:empleado_id>/", views.api_detalle_evaluacion_jefe),

]
