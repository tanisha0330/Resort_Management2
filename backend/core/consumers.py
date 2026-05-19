import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RoomUpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We put all connected admins into a group called "hotel_staff"
        self.group_name = "hotel_staff"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # This function listens for messages broadcasted by our views
    async def send_room_update(self, event):
        message = event['message']
        
        # Push the message to the React frontend
        await self.send(text_data=json.dumps({
            'message': message
        }))