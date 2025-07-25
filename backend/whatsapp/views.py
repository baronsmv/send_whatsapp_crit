import time

import requests
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework.views import APIView
# Módulos del backend
from utils.config import wa_greeting, wa_end_greeting, wa_text  # type: ignore
from utils.excel import contactos  # type: ignore
from utils.init_contacts import inicializar_mensajes  # type: ignore
from utils.logger import get_logger  # type: ignore
from whatsapp.models import MensajeWhatsApp  # type: ignore

logger = get_logger("backend_views")


def BulkSendDashboardView(request):
    return render(
        request,
        "whatsapp/dashboard.html",
        {
            "title": "Envío Masivo por WhatsApp",
            "header": "📤 Envío Masivo por WhatsApp",
            "start_button": "▶ Iniciar envío",
            "reset_button": "🔄 Reiniciar",
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

        mensajes = MensajeWhatsApp.objects.filter(estado="pendiente")

        for mensaje in mensajes:
            payload = {
                "number": f"521{mensaje.numero}@c.us",
                "message": f"{wa_greeting}{mensaje.nombre}{wa_end_greeting}{wa_text}",
                "image_path": f"media/{mensaje.imagen}",
            }

            try:
                res = requests.post("http://node:3000/send-media", json=payload)
                if res.status_code == 200:
                    mensaje.estado = "enviado"
                    mensaje.fecha_enviado = now()
                else:
                    mensaje.estado = "error"
                    mensaje.error_msg = res.text
            except Exception as e:
                mensaje.estado = "error"
                mensaje.error_msg = str(e)

            mensaje.save()
            time.sleep(delay)

        return Response({"status": "finalizado"}, status=200)


class BulkSendStatusView(APIView):
    def get(self, _):
        total = MensajeWhatsApp.objects.count()
        pendientes = MensajeWhatsApp.objects.filter(estado="pendiente").count()
        return JsonResponse(
            {
                "por_enviar": list(
                    MensajeWhatsApp.objects.filter(estado="pendiente").values("numero")
                ),
                "enviados": list(
                    MensajeWhatsApp.objects.filter(estado="enviado").values("numero")
                ),
                "errores": list(
                    MensajeWhatsApp.objects.filter(estado="error").values(
                        "numero", "error_msg"
                    )
                ),
                "estado": (
                    "🚀 Listo"
                    if total > 0 and pendientes == total
                    else "⏳ Enviando..." if pendientes > 0 else "✅ Finalizado"
                ),
            }
        )


class ResetMensajesView(APIView):
    def post(self, request):
        inicializar_mensajes()
        return Response({"status": "reseteado"})
