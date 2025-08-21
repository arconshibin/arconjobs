from django.http import JsonResponse

def health(request):
    return JsonResponse({"status": "still-ok"})
