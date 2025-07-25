from django.db import models


class MensajeWhatsApp(models.Model):
    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("enviado", "Enviado"),
        ("error", "Error"),
    ]

    nombre = models.CharField(max_length=100)
    numero = models.CharField(max_length=15)
    imagen = models.CharField(max_length=255, blank=True, null=True)
    estado = models.CharField(max_length=10, choices=ESTADOS, default="pendiente")
    error_msg = models.TextField(blank=True, null=True)
    fecha_creado = models.DateTimeField(auto_now_add=True)
    fecha_enviado = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.numero} - {self.estado}"
