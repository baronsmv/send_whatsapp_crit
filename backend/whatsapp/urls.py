from django.urls import path

from .views import BulkSendDashboardView, BulkSendAjaxView, BulkSendStatusView

urlpatterns = [
    path("", BulkSendDashboardView.as_view(), name="dashboard"),
    path("ajax/send/", BulkSendAjaxView.as_view(), name="bulk_send_ajax"),
    path("ajax/status/", BulkSendStatusView.as_view(), name="bulk_status"),
]
