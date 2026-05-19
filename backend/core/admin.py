from django.contrib import admin
from .models import (User, Floor, Feature, BedType, RoomStatus, PaymentStatus, 
                     AddOn, RoomClass, RoomClassBedType, Room, Guest, Booking)

# Register the simple tables
admin.site.register(User)
admin.site.register(Floor)
admin.site.register(Feature)
admin.site.register(BedType)
admin.site.register(RoomStatus)
admin.site.register(PaymentStatus)
admin.site.register(AddOn)
admin.site.register(Guest)
admin.site.register(Room)

# Make the Bed Types editable directly inside the Room Class screen
class RoomClassBedTypeInline(admin.TabularInline):
    model = RoomClassBedType
    extra = 1

@admin.register(RoomClass)
class RoomClassAdmin(admin.ModelAdmin):
    inlines = [RoomClassBedTypeInline]
    filter_horizontal = ('features',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'guest', 'check_in_date', 'check_out_date', 'payment_status')
    filter_horizontal = ('rooms', 'addons') # Adds a nice UI to select multiple rooms/addons