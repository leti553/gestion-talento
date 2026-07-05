from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Empleado, HistoricoPuesto

@receiver(pre_save, sender=Empleado)
def capturar_historico_puesto(sender, instance, **kwargs):
    """
    Cada vez que se guarda un Empleado, se comprueba si ha cambiado 
    de puesto o de jefe para registrar el histórico.
    """
    if instance.pk:  # Si el empleado ya existe 
        try:
            antiguo = Empleado.objects.get(pk=instance.pk)
            
            # Si el puesto o el jefe han cambiado
            if antiguo.puesto_actual != instance.puesto_actual or antiguo.jefe != instance.jefe:
                
                # Se cierra el periodo anterior en el histórico
                ultimo_historico = HistoricoPuesto.objects.filter(
                    empleado=instance, 
                    fecha_fin__isnull=True
                ).first()
                
                if ultimo_historico:
                    ultimo_historico.fecha_fin = timezone.now().date()
                    ultimo_historico.save()

                # Se crea el nuevo registro histórico con los datos que tenía HASTA AHORA
                HistoricoPuesto.objects.create(
                    empleado=instance,
                    puesto=antiguo.puesto_actual,
                    jefe_en_ese_momento=antiguo.jefe,
                    fecha_inicio=antiguo.fecha_modificacion.date() if antiguo.fecha_modificacion else antiguo.fecha_alta,
                    fecha_fin=timezone.now().date(),
                    motivo_cambio="Cambio de destino o estructura"
                )
        except Empleado.DoesNotExist:
            pass