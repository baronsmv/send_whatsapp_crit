from django.core.management.base import BaseCommand
from utils.excel import contactos
from whatsapp.models import MensajeWhatsApp


class Command(BaseCommand):
    help = "Inicializa los mensajes desde Excel si la tabla está vacía"

    def handle(self, *args, **kwargs):
        if MensajeWhatsApp.objects.exists():
            self.stdout.write(
                self.style.WARNING("⚠️ Ya existen mensajes. No se insertó nada.")
            )
            return

        for nombre, numero, imagen in contactos:
            MensajeWhatsApp.objects.get_or_create(
                numero=numero,
                defaults={"nombre": nombre, "imagen": imagen, "estado": "pendiente"},
            )

        self.stdout.write(
            self.style.SUCCESS("✅ Mensajes inicializados correctamente.")
        )
