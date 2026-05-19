from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework import status
from django.db import transaction
from rest_framework.response import Response
from .models import Room
from .serializers import RoomSerializer
from .models import Room, Guest, Booking, PaymentStatus, RoomStatus
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes
# Create your views here.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rooms(request):
    # We will use this date parameter later for advanced booking logic!
    date_param = request.GET.get('date', None) 
    
    # Fetch all rooms and include their foreign keys for better database performance
    rooms = Room.objects.all().select_related('room_status', 'room_class')
    
    # Translate the Django objects to JSON
    serializer = RoomSerializer(rooms, many=True)
    return Response(serializer.data)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_room(request):
    data = request.data
    
    try:
        # We use a database transaction so if one thing fails, everything rolls back safely
        with transaction.atomic():
            # 1. Find or Create the Guest
            guest, created = Guest.objects.get_or_create(
                email=data.get('email'),
                defaults={
                    'first_name': data.get('firstName'),
                    'last_name': data.get('lastName'),
                    'phone_number': data.get('phone')
                }
            )

            # 2. Get the Room and Payment Status
            room = Room.objects.get(id=data.get('roomId'))
            payment_status = PaymentStatus.objects.first() # Grabs the 'Pending' status we just made
            booked_status = RoomStatus.objects.get(name='Booked')

            if room.room_status.name != 'Available':
                return Response({"error": "Room is not available."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Create the Booking
            booking = Booking.objects.create(
                guest=guest,
                payment_status=payment_status,
                check_in_date=data.get('checkInDate'),
                check_out_date=data.get('checkOutDate'),
                adults=int(data.get('adults', 1)),
                booking_amount=room.room_class.base_price # Using base price for now
            )
            
            # Attach the room to the booking (Many-to-Many relationship)
            booking.rooms.add(room)

            # 4. Update Room Status
            room.room_status = booked_status
            room.save()
            # --- BROADCAST TO WEBSOCKETS ---
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "hotel_staff",
                {
                    "type": "send_room_update",
                    "message": "refresh_rooms"
                }
            )

            return Response({"message": "Booking successful!"}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_room_status(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        new_status_name = request.data.get('status')
        
        # Find the new status in the database
        status_obj = RoomStatus.objects.get(name=new_status_name)
        room.room_status = status_obj
        room.save()
        
        return Response({"message": f"Room {room.room_number} updated to {new_status_name}"}, status=status.HTTP_200_OK)
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    except RoomStatus.DoesNotExist:
        return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
    
    
    
    

    # ... rest of the code ...