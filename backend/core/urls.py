from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.get_rooms, name='get_rooms'),
    path('book-room/', views.book_room, name='book_room'), 
    path('rooms/<int:room_id>/update-status/', views.update_room_status, name='update_room_status'),
]