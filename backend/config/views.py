from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(request):
    """Liveness check for the Lambda adapter and uptime pings.

    Deliberately skips the database: pinging it would keep Neon's compute
    awake around the clock and burn the free tier's compute allowance.
    """
    return JsonResponse({"status": "ok"})
