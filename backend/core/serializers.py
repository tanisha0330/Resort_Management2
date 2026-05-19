from rest_framework import serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    # Map Django snake_case to React camelCase
    roomNumber = serializers.CharField(source='room_number')
    status = serializers.CharField(source='room_status.name')
    guest = serializers.SerializerMethodField()
    details = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ['id', 'roomNumber', 'status', 'guest', 'details']

    def get_guest(self, obj):
        # We will add dynamic guest logic based on Bookings later. 
        # For now, keep it empty if the room isn't booked.
        return "" if obj.room_status.name in ['Available', 'Cleaning', 'Maintenance'] else "TBD"

    def get_details(self, obj):
        # Pass the Room Class name to React for extra info
        return f"{obj.room_class.name}" if obj.room_class else "Standard Room"