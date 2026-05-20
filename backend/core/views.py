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
from datetime import datetime
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_rooms(request):
    date_str = request.GET.get('date')
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            target_date = timezone.localdate()
    else:
        target_date = timezone.localdate()

    rooms = Room.objects.all().prefetch_related('bookings__guest', 'room_class', 'room_status')
    room_data = []

    for room in rooms:
        db_status = room.room_status.name if room.room_status else "Available"
        
        # Check if there is an active booking on the exact target date
        active_booking = room.bookings.filter(
            check_in_date__lte=target_date,
            check_out_date__gte=target_date
        ).first()

        guest_name = "None"
        details_text = room.room_class.name if room.room_class else "Standard"
        booked_till = ""
        current_status = "Available"

        if active_booking:
            booked_till = f"Till {active_booking.check_out_date.strftime('%b %d')} 11 AM"
            if active_booking.guest:
                full_name = f"{active_booking.guest.first_name} {active_booking.guest.last_name}".strip()
                guest_name = full_name if full_name else active_booking.guest.email

            # Physical overrides
            if db_status in ["Cleaning", "Maintenance"]:
                current_status = db_status
            else:
                # STRICT RULE: On the checkout date, show as Checkout-Pending
                if target_date == active_booking.check_out_date:
                    current_status = "Checkout-Pending"
                else:
                    current_status = "Booked"
                    if db_status == "Checkin-Pending":
                        current_status = "Checkin-Pending"

        else:
            # STRICT RULE: After the checkout date (no active booking), show as Available
            if db_status in ["Cleaning", "Maintenance"]:
                current_status = db_status
            else:
                current_status = "Available"

        room_data.append({
            "id": room.id,
            "roomNumber": room.room_number,
            "status": current_status,
            "guest": guest_name,
            "details": details_text,
            "bookedTill": booked_till
        })

    return Response(room_data)

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
    
    
    
    

from .models import Floor, RoomClass # Add these to your imports at the top if they aren't there

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_create_rooms(request):
    try:
        count = int(request.data.get('count', 0))
        if count <= 0:
            return Response({"error": "Please enter a valid number."}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create default fallback data so the database doesn't crash
        floor, _ = Floor.objects.get_or_create(floor_number="1")
        room_class, _ = RoomClass.objects.get_or_create(name="Standard", defaults={'base_price': 100.00})
        avail_status = RoomStatus.objects.get(name="Available")

        # Find the highest room number so we can increment it (e.g., A101 -> A102)
        last_room = Room.objects.order_by('-id').first()
        start_num = 100
        if last_room and 'A' in last_room.room_number:
            try:
                start_num = int(last_room.room_number.replace('A', ''))
            except ValueError:
                pass

        new_rooms = []
        for i in range(1, count + 1):
            new_rooms.append(Room(
                room_number=f"A{start_num + i}",
                floor=floor,
                room_class=room_class,
                room_status=avail_status
            ))
        
        Room.objects.bulk_create(new_rooms)

        # Broadcast update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)("hotel_staff", {"type": "send_room_update", "message": "refresh_rooms"})

        return Response({"message": f"{count} rooms created successfully!"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_checkout_date(request, room_id):
    try:
        room = Room.objects.get(id=room_id)
        new_date_str = request.data.get('checkOutDate')
        
        if not new_date_str:
             return Response({"error": "No date provided."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Parse the string into a formal Python Date object
        from datetime import datetime
        new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
        
        # 2. Find the ACTUAL current booking (the one with the furthest check-out date)
        # This prevents the system from accidentally grabbing a booking from last year
        booking = room.bookings.order_by('-check_out_date').first()
        
        if booking:
            # 3. Safety Check: Ensure they aren't setting checkout BEFORE check-in
            if new_date <= booking.check_in_date:
                return Response({"error": "Checkout date must be after the check-in date."}, status=status.HTTP_400_BAD_REQUEST)

            # 4. Save the new date
            booking.check_out_date = new_date
            booking.save()
            
            # Broadcast real-time update to the grid
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)("hotel_staff", {"type": "send_room_update", "message": "refresh_rooms"})
            
            return Response({"message": "Checkout date updated!"}, status=status.HTTP_200_OK)
            
        return Response({"error": "No active booking found to extend."}, status=status.HTTP_404_NOT_FOUND)

    except Room.DoesNotExist:
        return Response({"error": "Room not found in database."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # If it crashes, print the EXACT reason to your terminal so we can see it!
        print("EXTENSION CRASH:", str(e))
        return Response({"error": f"Server Error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        room = Room.objects.get(id=room_id)
        new_date = request.data.get('checkOutDate')
        
        # Grab the most recent booking for this room
        booking = room.bookings.order_by('-id').first()
        if booking:
            booking.check_out_date = new_date
            booking.save()
            
            # Broadcast update
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)("hotel_staff", {"type": "send_room_update", "message": "refresh_rooms"})
            
            return Response({"message": "Checkout date updated!"}, status=status.HTTP_200_OK)
            
        return Response({"error": "No active booking found for this room."}, status=status.HTTP_404_NOT_FOUND)
    except Room.DoesNotExist:
        return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_room(request, room_id):
    try:
        from django.utils import timezone
        from datetime import timedelta
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        room = Room.objects.get(id=room_id)
        today = timezone.localdate()
        
        # 1. Kill or End any active bookings blocking this room today
        active_bookings = room.bookings.filter(check_out_date__gte=today)
        for booking in active_bookings:
            if booking.check_in_date >= today:
                booking.delete()  # If the booking hasn't started or started today, delete it entirely.
            else:
                booking.check_out_date = today - timedelta(days=1)
                booking.save()    # If they are mid-stay, force check them out yesterday.
                
        # 2. Force the physical room status to Available
        avail_status, _ = RoomStatus.objects.get_or_create(name="Available")
        room.room_status = avail_status
        room.save()

        # 3. Broadcast real-time update to the grid
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)("hotel_staff", {"type": "send_room_update", "message": "refresh_rooms"})

        return Response({"message": "Room cleared and made Available!"}, status=status.HTTP_200_OK)
    
    except Room.DoesNotExist:
        return Response({"error": "Room not found in database."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print("CLEAR ROOM CRASH:", str(e))
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)