from django.apps import AppConfig
class TalentoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'talento'



class TuAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tu_nombre_de_app'

    def ready(self):
        import tu_nombre_de_app.signals