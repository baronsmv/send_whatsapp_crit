from utils.excel import contactos
from whatsapp.models import MensajeWhatsApp


def inicializar_mensajes():
    MensajeWhatsApp.objects.all().delete()
    for nombre, numero, imagen in contactos:
        MensajeWhatsApp.objects.get_or_create(
            numero=numero,
            defaults={"nombre": nombre, "imagen": imagen, "estado": "pendiente"},
        )


if __name__ == "__main__":
    inicializar_mensajes()
