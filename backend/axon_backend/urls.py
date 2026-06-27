"""
URL configuration for axon_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.http import JsonResponse, Http404
import mimetypes

# Fix Windows registry MIME type association issues
mimetypes.add_type("application/javascript", ".js", True)
mimetypes.add_type("text/css", ".css", True)

def ping_view(request):
    return JsonResponse({"ping": "test ok"})

def serve_react(request, path=''):
    dist_dir = settings.BASE_DIR.parent / 'frontend' / 'dist'
    
    # Default to index.html
    if not path:
        path = 'index.html'
        
    file_path = dist_dir / path
    if file_path.exists() and file_path.is_file():
        return serve(request, path, document_root=dist_dir)
        
    # Catch-all: serve index.html for frontend routing (SPA)
    index_path = dist_dir / 'index.html'
    if index_path.exists():
        return serve(request, 'index.html', document_root=dist_dir)
        
    raise Http404("Frontend build not found. Please run 'npm run build' in the frontend directory.")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('ping/', ping_view, name='ping'),
    
    # Serve media files (APKs, OTA updates) in both development and production
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    
    # React SPA catch-all (must be at the end of the list)
    re_path(r'^(?P<path>.*)$', serve_react),
]


