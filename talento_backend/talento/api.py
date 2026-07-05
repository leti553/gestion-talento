from rest_framework import serializers
from .models import Empleado
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated



from rest_framework.decorators import api_view, permission_classes
from .serializers import EmpleadoSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    empleado = Empleado.objects.get(usuario=request.user)
    serializer = EmpleadoSerializer(empleado)
    return Response(serializer.data)




class MiPerfilAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        empleado = Empleado.objects.get(user=request.user)
        serializer = EmpleadoSerializer(empleado)
        return Response(serializer.data)