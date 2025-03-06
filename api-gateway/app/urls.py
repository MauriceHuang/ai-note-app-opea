from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def health_check(request):
    return HttpResponse("OK")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('notes/', include('app.notes.urls')),
    path('ai/', include('app.ai.urls')),
    path('health/', health_check, name='health_check'),
    # Direct API routes
    path('api/notes/', include('app.notes.urls')),
    path('api/ai/', include('app.ai.urls')),
] 