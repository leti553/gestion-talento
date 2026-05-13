# gestion-talento
Gestión del talento y evaluación del desempeño.
Backend + Frontend
Este documento explica cómo instalar y ejecutar el proyecto completo.
El código ya está configurado, por lo que solo se incluyen los comandos necesarios para ponerlo en marcha.

Requisitos previos
Python 3.12
Anaconda 
Node.js y npm
PostgreSQL

Preparación del backend (Django)
Crear un entorno virtual:

conda create -n mi_proyecto_django python=3.12
conda activate mi_proyecto_django

Instalar dependencias del backend (dentro de la carpeta del backend):

pip install -r requirements.txt

Aplicar migraciones:

python manage.py migrate

Crear un superusuario:

python manage.py createsuperuser

Cargar datos ESCO:

python manage.py NOMBRE DE LOS COMANDOS DE LA CARPETA MANAGEMENT-COMMANDS 

Ejecutar el backend:

python manage.py runserver

El backend queda disponible en:
http://127.0.0.1:8000/

Preparación del frontend
Entrar en la carpeta del frontend e instalar dependencias:

npm install

Ejecutar el frontend:

npm run dev

El frontend queda disponible en:
http://localhost:5173/

Autenticación
El sistema utiliza autenticación JWT.
El frontend ya está configurado para solicitar, almacenar y enviar el token en cada petición.
No es necesario realizar ninguna configuración adicional.

Comunicación entre frontend y backend 
El backend ya incluye la configuración necesaria para permitir que el frontend (puerto 5173) acceda a la API (puerto 8000).
No es necesario modificar nada: CORS está habilitado y funcionando.

Estructura del proyecto
El repositorio contiene dos carpetas principales:

Backend → API REST, autenticación, base de datos, administración
Frontend → interfaz en React, login, consumo de API

Ambas están listas para ejecutarse sin modificar archivos internos.

Ejecución completa del sistema
Activar el entorno virtual

Iniciar el backend

Iniciar el frontend

Abrir el navegador

Iniciar sesión

Utilizar el sistema

Resultado final
Backend: Django + PostgreSQL + API REST + JWT
Frontend: React + login + consumo de API

Funcionando en paralelo:

Backend → http://127.0.0.1:8000/  
Frontend → http://localhost:5173/
