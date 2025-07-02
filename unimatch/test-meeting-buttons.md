# Meeting Buttons Test Guide

## Current Status
✅ Backend server running on port 5000
✅ Frontend server running on port 3000  
✅ Enhanced logging implemented
✅ Cancelled meetings filtered out
✅ Better error handling added

## Test Scenarios

### 1. Verify No Cancelled Meetings Appear
**Expected**: No meeting proposals should be visible in GroupInfo sidebar
**Reason**: Both meetings in database are cancelled and should be filtered out

**Steps**:
1. Open http://localhost:3000
2. Login with existing user
3. Navigate to Chat page
4. Select the accepted match
5. Check GroupInfo sidebar on the right

**Expected Result**: 
- "No active meeting proposals" message should appear
- No Accept/Reject buttons should be visible

### 2. Create New Meeting Proposal
**Steps**:
1. Click "Schedule Meeting" button
2. Select tomorrow's date
3. Select 2-3 time slots (e.g., 14:00-15:00, 15:00-16:00)
4. Enter location: "Test Library Room"
5. Enter description: "Test meeting for debugging"
6. Click "Propose Meeting"

**Expected Result**:
- Modal should close
- New meeting should appear in GroupInfo sidebar
- Accept/Reject buttons should be functional

### 3. Test Meeting Response (Single User)
**Steps**:
1. After creating meeting proposal (step 2)
2. Click "Accept" on one of the time slots
3. Check browser console and backend terminal

**Expected Result**:
- Detailed logs should appear in both console and terminal
- Button should change to "Accepted" 
- No 400 errors should occur

### 4. Test Meeting Cancellation
**Steps**:
1. After creating meeting proposal
2. Click "Cancel Proposal" button
3. Confirm cancellation

**Expected Result**:
- Meeting should disappear from sidebar immediately
- Success message should appear
- Backend should log cancellation details

## Debug Information to Check

### Frontend Console (F12)
Look for these log entries:
```
=== GroupInfo Meeting Response ===
Meeting ID: [ID]
Slot Index: [NUMBER] Type: number
Status: accepted
Sending request data: {...}
```

### Backend Terminal
Look for these log entries:
```
=== Meeting Response Route ===
Meeting Response Request:
- Meeting ID: [ID]
- Request Body: {...}
- User ID: [ID]
Meeting found: [ID] Status: proposed
User authorization passed
```

## Troubleshooting

### If "Schedule Meeting" Button is Disabled
**Cause**: Frontend thinks there's an active meeting
**Check**: 
1. Browser console for meetingProposals array
2. Database for any non-cancelled meetings
3. Backend logs for meeting fetch requests

### If 400 Errors Still Occur
**Check**:
1. Backend terminal for detailed error logs
2. Meeting status in database
3. Request data format in browser console

### If Meetings Don't Appear
**Check**:
1. Socket.io connection in browser console
2. Backend logs for socket events
3. Network tab for API requests

## Database Cleanup (Optional)

To start fresh with no meetings:
```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const Meeting = require('./models/Meeting');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Meeting.deleteMany({});
  console.log('All meetings deleted');
  process.exit(0);
});
"
```

## API Test Commands

Test meeting creation:
```bash
curl -X POST http://localhost:5000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "matchId": "686492a3e5740042b97771ea",
    "proposedSlots": [
      {
        "startTime": "2025-07-04T14:00:00.000Z",
        "endTime": "2025-07-04T15:00:00.000Z"
      }
    ],
    "location": "Test Room",
    "description": "API test meeting"
  }'
```

## Success Criteria

✅ No cancelled meetings visible in UI
✅ New meetings can be created successfully  
✅ Accept/Reject buttons work without 400 errors
✅ Cancel button works and removes meeting from UI
✅ Detailed logs help with debugging
✅ Real-time updates work via Socket.IO

## Next Steps After Testing

1. If tests pass: Meeting buttons functionality is fixed
2. If issues remain: Check specific error logs and debug further
3. Consider adding more robust error handling for edge cases
4. Implement automatic refresh of meeting proposals after actions 