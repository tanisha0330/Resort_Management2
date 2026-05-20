from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Auth Endpoints
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Your App Endpoints
    path('rooms/', views.get_rooms, name='get_rooms'),
    path('book-room/', views.book_room, name='book_room'),
    path('rooms/<int:room_id>/update-status/', views.update_room_status, name='update_room_status'),
    path('rooms/bulk-create/', views.bulk_create_rooms, name='bulk_create_rooms'),
    path('rooms/<int:room_id>/update-checkout/', views.update_checkout_date, name='update_checkout_date'),
    path('rooms/<int:room_id>/clear/', views.clear_room, name='clear_room'),
]