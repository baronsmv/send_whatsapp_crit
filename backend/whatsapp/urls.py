from django.urls import path

from .views import (
    BulkSendDashboardView,
    BulkSendAjaxView,
    BulkSendStatusView,
    ResetMensajesView,
)

urlpatterns = [
    path("", BulkSendDashboardView, name="dashboard"),
    path("ajax/send/", BulkSendAjaxView.as_view(), name="bulk_send_ajax"),
    path("ajax/status/", BulkSendStatusView.as_view(), name="bulk_status"),
    path("ajax/reset/", ResetMensajesView.as_view(), name="bulk_reset"),
]
