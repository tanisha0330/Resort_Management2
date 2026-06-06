# Resort Management Database Schema - Relationships Flowchart

## Visual Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                          LOOKUP / CONFIGURATION TABLES                       │
│                                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Floor     │  │  RoomStatus  │  │ PaymentStatus│  │   Feature    │    │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤  ├──────────────┤    │
│  │ id (PK)     │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │    │
│  │ floor_num   │  │ name         │  │ name         │  │ name         │    │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │   BedType    │  │   AddOn      │  │    User      │                      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤                      │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │                      │
│  │ name         │  │ name         │  │ username     │                      │
│  │              │  │ price        │  │ is_superadmin│                      │
│  └──────────────┘  └──────────────┘  │ is_hotel_adm │                      │
│                                        └──────────────┘                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ⬇️  ⬇️  ⬇️

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                            CORE BUSINESS TABLES                              │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                      RoomClass (Room Type)                     │        │
│  ├────────────────────────────────────────────────────────────────┤        │
│  │ id (PK)                                                         │        │
│  │ name (e.g., "Deluxe", "Standard")                             │        │
│  │ base_price                                                     │        │
│  │                                                                 │        │
│  │ ┌─ Many-to-Many ─→ Feature (what amenities does it have?)     │        │
│  │ └─ Many-to-Many ─→ BedType (via RoomClassBedType table)       │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                    ⬇️                                        │
│  ┌──────────────────────────────────────────────────────────────��─┐        │
│  │            RoomClassBedType (Joining Table)                    │        │
│  ├────────────────────────────────────────────────────────────────┤        │
│  │ id (PK)                                                         │        │
│  │ room_class_id (FK) ─→ RoomClass                               │        │
│  │ bed_type_id (FK) ─→ BedType                                   │        │
│  │ num_beds (e.g., "2x Queen beds")                              │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ⬇️

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  ┌─────────────────────────────┐         ┌──────────────────────────────┐  │
│  │       Room (Physical)       │         │      Guest (Person)          │  │
│  ├─────────────────────────────┤         ├──────────────────────────────┤  │
│  │ id (PK)                     │         │ id (PK)                      │  │
│  │ room_number (unique)        │         │ first_name                   │  │
│  │ floor_id (FK) ─→ Floor      │         │ last_name                    │  │
│  │ room_class_id (FK) ─────────┼─────────→ email (unique)              │  │
│  │                ⬆️             │         │ phone_number                │  │
│  │                └─ RoomClass   │         └──────────────────────────────┘  │
│  │ room_status_id (FK) ─→ RoomStatus │                                      │
│  │                                │         ⬇️                              │
│  └─────────────────────────────┘         ┌──────────────────────────────┐  │
│           ⬇️                              │   Booking (Reservation)      │  │
│           │                              ├──────────────────────────────┤  │
│           │                              │ id (PK)                      │  │
│           │  ┌─ Many-to-Many ──────────→ │ guest_id (FK) ─→ Guest     │  │
│           │  │                           │ payment_status_id (FK) ────→  │
│           │  │                           │              ┌─ PaymentStatus │  │
│           └─→│─ Many-to-Many ──────────→ │ room_id (FK) ─→ Room       │  │
│              │                           │ (Many-to-Many Joining Table)│  │
│              │                           │ check_in_date              │  │
│              └─ Many-to-Many ──────────→ │ check_out_date             │  │
│                                          │ adults                     │  │
│                                          │ children                   │  │
│                                          │ booking_amount             │  │
│                                          │                            │  │
│              ┌─ Many-to-Many ──────────→ │ addon_id (FK) ─→ AddOn     │  │
│              │                           │ (Many-to-Many Joining Table)│  │
│              └─────────────────────────→  └──────────────────────────────┘  │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Connection Map

### **1. Room Management Flow**
```
Floor (building level)
  ↓
Room (physical rooms on a floor)
  ├─→ RoomStatus (current state: Available, Booked, Cleaning, Maintenance)
  └─→ RoomClass (type: Standard, Deluxe, Suite)
       ├─→ Feature (amenities: TV, Balcony, etc.)
       └─→ BedType via RoomClassBedType (how many Queen/King/Single beds)
```

### **2. Booking Flow**
```
Guest (person checking in)
  ↓
Booking (creates reservation)
  ├─→ Room (which rooms are booked)
  ├─→ PaymentStatus (Paid/Unpaid/Pending)
  └─→ AddOn (extra services: Parking, Mini Bar, etc.)
```

### **3. Real-World Example**

**Scenario**: John Doe books Room A101 for 3 nights with breakfast add-on

```
Guest Table:
┌─────────────────────────────┐
│ id: 1                       │
│ first_name: "John"          │
│ last_name: "Doe"            │
│ email: "john@example.com"   │
│ phone: "555-1234"           │
└─────────────────────────────┘
          ↓
Booking Table:
┌──────────────────────────────┐
│ id: 42                       │
│ guest_id: 1 ──→ John Doe    │
│ payment_status_id: 1 ��─→ Pending
│ check_in_date: 2024-06-10   │
│ check_out_date: 2024-06-13  │
│ adults: 1                    │
│ booking_amount: $600         │
└──────────────────────────────┘
    ├─ Many-to-Many ─→ Room A101
    │                    ├─→ RoomClass: "Deluxe"
    │                    │    ├─→ Feature: "Ocean View"
    │                    │    ├─→ Feature: "Hot Tub"
    │                    │    └─→ BedType: "1x King + 2x Queen"
    │                    ├─→ RoomStatus: "Booked"
    │                    └─→ Floor: "3"
    │
    └─ Many-to-Many ─→ AddOn: "Breakfast" ($50)
```

---

## Table Relationships Summary

| From Table | To Table | Type | Relationship |
|---|---|---|---|
| **Room** | Floor | 1:N | Many rooms per floor |
| **Room** | RoomClass | N:1 | Many rooms of same type |
| **Room** | RoomStatus | N:1 | Many rooms with same status |
| **Room** | Booking | N:M | One room in many bookings |
| **RoomClass** | Feature | N:M | Each class has multiple features |
| **RoomClass** | BedType | N:M | Multiple bed types (via joining table) |
| **Booking** | Guest | N:1 | Many bookings per guest |
| **Booking** | PaymentStatus | N:1 | Many bookings per payment status |
| **Booking** | AddOn | N:M | Multiple add-ons per booking |

---

## Key Insights

✅ **One Guest** can have **multiple Bookings**  
✅ **One Booking** can include **multiple Rooms** (group reservations)  
✅ **One Booking** can have **multiple Add-Ons** (breakfast, parking, etc.)  
✅ **One Room Class** has **multiple Features** and **multiple Bed Types**  
✅ **Lookup Tables** (Floor, RoomStatus, Feature, etc.) are reusable across the system  
