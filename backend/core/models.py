from django.contrib.auth.models import AbstractUser
from django.db import models

# 1. Custom User Model (From Phase 1)
class User(AbstractUser):
    is_superadmin = models.BooleanField(default=False)
    is_hotel_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username

# --------------------------------------------------
# LOOKUP TABLES
# --------------------------------------------------
class Floor(models.Model):
    floor_number = models.CharField(max_length=10, unique=True)
    def __str__(self): return f"Floor {self.floor_number}"

class Feature(models.Model):
    name = models.CharField(max_length=100) # e.g., Large TV, Balcony
    def __str__(self): return self.name

class BedType(models.Model):
    name = models.CharField(max_length=50) # e.g., Single, Queen, King
    def __str__(self): return self.name

class RoomStatus(models.Model):
    name = models.CharField(max_length=50) # e.g., Available, Booked, Cleaning, Maintenance
    def __str__(self): return self.name

class PaymentStatus(models.Model):
    name = models.CharField(max_length=50) # e.g., Paid, Unpaid, Pending
    def __str__(self): return self.name

class AddOn(models.Model):
    name = models.CharField(max_length=100) # e.g., Valet Parking, Mini Bar
    price = models.DecimalField(max_digits=8, decimal_places=2)
    def __str__(self): return f"{self.name} (${self.price})"

# --------------------------------------------------
# CORE TABLES & RELATIONSHIPS
# --------------------------------------------------
class RoomClass(models.Model):
    name = models.CharField(max_length=100) # e.g., Deluxe, Standard
    base_price = models.DecimalField(max_digits=8, decimal_places=2)
    features = models.ManyToManyField(Feature, related_name='room_classes', blank=True)
    # Django 'through' relationship for the extra 'num_beds' data
    bed_types = models.ManyToManyField(BedType, through='RoomClassBedType', related_name='room_classes')

    def __str__(self): return self.name

# Joining Table for Room Class <-> Bed Type
class RoomClassBedType(models.Model):
    room_class = models.ForeignKey(RoomClass, on_delete=models.CASCADE)
    bed_type = models.ForeignKey(BedType, on_delete=models.CASCADE)
    num_beds = models.IntegerField(default=1) # The custom attribute you requested!

    def __str__(self): return f"{self.num_beds}x {self.bed_type.name} in {self.room_class.name}"

class Room(models.Model):
    room_number = models.CharField(max_length=10, unique=True)
    floor = models.ForeignKey(Floor, on_delete=models.PROTECT, related_name='rooms')
    room_class = models.ForeignKey(RoomClass, on_delete=models.PROTECT, related_name='rooms')
    room_status = models.ForeignKey(RoomStatus, on_delete=models.PROTECT, related_name='rooms')

    def __str__(self): return self.room_number

class Guest(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20)

    def __str__(self): return f"{self.first_name} {self.last_name}"

class Booking(models.Model):
    guest = models.ForeignKey(Guest, on_delete=models.CASCADE, related_name='bookings')
    payment_status = models.ForeignKey(PaymentStatus, on_delete=models.PROTECT, related_name='bookings')
    
    # Django handles these Many-to-Many joining tables automatically
    rooms = models.ManyToManyField(Room, related_name='bookings')
    addons = models.ManyToManyField(AddOn, related_name='bookings', blank=True)
    
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    adults = models.IntegerField(default=1)
    children = models.IntegerField(default=0)
    booking_amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self): return f"Booking #{self.id} - {self.guest}"