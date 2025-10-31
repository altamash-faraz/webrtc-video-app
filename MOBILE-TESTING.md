# 📱 Room Testing Guide

## Quick Test URLs (Replace ABC123 with actual room ID)

### Computer (Host):
```
http://localhost:3000/room/ABC123?username=Computer
```

### Mobile Device:
```
http://192.168.56.1:3000/room/ABC123?username=Mobile
```

### Another Computer:
```
http://192.168.56.1:3000/room/ABC123?username=Laptop
```

## Test Steps:

1. **Create Room** (Computer):
   - Go to: http://localhost:3000
   - Click "Create Room"
   - Copy the room ID (e.g., ABC123XY)

2. **Join from Mobile**:
   - Open browser on mobile
   - Go to: http://192.168.56.1:3000/room/ABC123XY?username=MobileUser
   - Should see the same room

3. **Test Features**:
   - ✅ Room information displays correctly
   - ✅ Button states sync between devices  
   - ✅ Share room button works
   - ✅ Real-time updates via localStorage

## Alternative: ngrok for Public Access

```bash
# Install ngrok (download from ngrok.com)
# Run in new terminal:
ngrok http 3000

# Use the https URL for mobile testing
# Example: https://abc123.ngrok.io/room/ROOMID?username=Mobile
```

## What to Test:

- [ ] Room ID recognition
- [ ] Cross-device joining
- [ ] Button functionality
- [ ] UI responsiveness on mobile
- [ ] Share room feature
- [ ] Username display
- [ ] Connection status

## Expected Results:

✅ Both devices show same room ID
✅ Button clicks work on both devices
✅ Share button copies correct URL
✅ UI is mobile-friendly
✅ Real-time status updates work