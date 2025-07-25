import time
from typing import List, Dict

import requests
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.views import APIView
# Módulos del backend
from utils.config import wa_greeting, wa_end_greeting, wa_text  # type: ignore
from utils.excel import contactos  # type: ignore
from utils.logger import get_logger  # type: ignore
from whatsapp.progress_tracker import progress  # type: ignore

logger = get_logger("backend_views")

progress["por_enviar"] = [{"numero": numero} for _, numero, _ in contactos]


def BulkSendDashboardView(request):
    return render(
        request,
        "whatsapp/dashboard.html",
        {
            "title": "Envío Masivo por WhatsApp",
            "header": "📤 Envío Masivo por WhatsApp",
            "start_button": "▶ Iniciar envío",
            "initial_status": "🕒 Iniciando...",
            "sending_status": "⏳ Enviando...",
            "to_send_title": "💬 Por enviar",
            "success_title": "✅ Enviados",
            "error_title": "❌ Errores",
        },
    )


class BulkSendAjaxView(APIView):
    def post(self, request):
        delay: int = int(request.data.get("delay", 5))

        progress["estado"]: str = "enviando"
        progress["enviados"]: List = []
        progress["errores"]: List = []

        for nombre, numero, imagen in contactos:
            mensaje: str = f"{wa_greeting}{nombre}{wa_end_greeting}{wa_text}"

            payload: Dict[str, str] = {
                "number": f"521{numero}@c.us",
                "message": mensaje,
                "image_path": f"media/{imagen}",
            }

            try:
                res: Response = requests.post(
                    "http://node:3000/send-media", json=payload
                )
                progress["por_enviar"].remove({"numero": numero})
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
