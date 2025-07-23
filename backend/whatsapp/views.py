import os
import sys
import time

import django
import requests
from django.http import JsonResponse
from django.views.generic import TemplateView
from rest_framework.response import Response
from rest_framework.views import APIView

# Configurar entorno Django
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "qrscan.settings")
django.setup()

from utils.logger import get_logger  # type: ignore
from whatsapp.progress_tracker import progress  # type: ignore
from utils.excel import contactos  # type: ignore

logger = get_logger("backend_views")


class BulkSendDashboardView(TemplateView):
    template_name = "whatsapp/dashboard.html"


class BulkSendAjaxView(APIView):
    def post(self, request):
        delay = int(request.data.get("delay", 5))

        progress["estado"] = "enviando"
        progress["enviados"] = []
        progress["errores"] = []

        for nombre, numero, imagen in contactos:
            mensaje = f"Hola {nombre}, te envío una imagen."

            payload = {
                "number": f"521{numero}@c.us",
                "message": mensaje,
                "image_path": f"media/{imagen}",
            }

            try:
                res = requests.post("http://node:3000/send-media", json=payload)
                if res.status_code == 200:
                    logger.info(f"✅ Enviado: {numero}")
                    progress["enviados"].append({"numero": numero, "estado": "ok"})
                else:
                    logger.warning(f"⚠️ Falló: {numero}")
                    progress["errores"].append({"numero": numero, "error": res.text})
            except Exception as e:
                logger.error(f"❌ Excepción en {numero}: {e}")
                progress["errores"].append({"numero": numero, "error": str(e)})

            time.sleep(delay)

        progress["estado"] = "finalizado"
        return Response({"status": "finalizado"}, status=200)


class BulkSendStatusView(APIView):
    def get(self, _):
        return JsonResponse(progress)
