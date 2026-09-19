const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000';

async function testFullFlow() {
  console.log('----------------------------------------------------');
  console.log('🧪 Real-Time Notification Platform Verification Test');
  console.log('----------------------------------------------------');

  try {
    // 1. Health check
    console.log('1. Testing Health Check GET / ...');
    const healthRes = await fetch(`${API_BASE}/`);
    const healthData = await healthRes.json();
    console.log('   Response:', healthData.message);

    // 2. Register User A (Recipient)
    console.log('\n2. Registering User A (Alice)...');
    const userARes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Smith',
        email: `alice_${Date.now()}@test.com`,
        password: 'password123',
      }),
    });
    const userAData = await userARes.json();
    if (!userAData.success) throw new Error(userAData.message);
    console.log(`   User A registered! ID: ${userAData.user.id}, Token: ${userAData.token.substring(0, 15)}...`);

    // 3. Register User B (Sender)
    console.log('\n3. Registering User B (Bob)...');
    const userBRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Johnson',
        email: `bob_${Date.now()}@test.com`,
        password: 'password123',
      }),
    });
    const userBData = await userBRes.json();
    if (!userBData.success) throw new Error(userBData.message);
    console.log(`   User B registered! ID: ${userBData.user.id}`);

    // 4. Save Push Token for User A
    console.log('\n4. Testing Push Token Registration POST /api/users/push-token...');
    const pushTokenRes = await fetch(`${API_BASE}/api/users/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAData.token}`,
      },
      body: JSON.stringify({
        pushToken: 'ExponentPushToken[Mock-Test-Token-12345]',
      }),
    });
    const pushTokenData = await pushTokenRes.json();
    console.log('   Response:', pushTokenData.message);

    // 5. Connect User A Socket.IO
    console.log('\n5. Connecting User A to Socket.IO with JWT authentication...');
    const socketA = io(API_BASE, {
      auth: { token: userAData.token },
    });

    await new Promise((resolve, reject) => {
      socketA.on('connect', () => {
        console.log(`   Socket connected successfully! Socket ID: ${socketA.id}`);
        resolve();
      });
      socketA.on('connect_error', (err) => {
        reject(new Error(`Socket connection failed: ${err.message}`));
      });
    });

    // Setup listener for real-time notifications on User A
    const socketNotificationPromise = new Promise((resolve) => {
      socketA.on('new_notification', (notification) => {
        console.log('\n⚡ [REAL-TIME SOCKET EVENT RECEIVED BY ALICE] ⚡');
        console.log('   Type:', notification.type);
        console.log('   Message:', notification.message);
        console.log('   IsRead:', notification.isRead);
        resolve(notification);
      });
    });

    // 6. User B sends notification to User A
    console.log('\n6. User B sending notification to User A via POST /api/notifications/send...');
    const sendRes = await fetch(`${API_BASE}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBData.token}`,
      },
      body: JSON.stringify({
        recipientId: userAData.user.id,
        type: 'comment',
        message: 'Bob commented on your photo: "Awesome picture!" 💬',
      }),
    });
    const sendData = await sendRes.json();
    console.log('   Notification API Response:', sendData.message);

    // Wait for socket notification delivery confirmation
    const receivedNotification = await socketNotificationPromise;

    // 7. Test Fetch Notifications GET /api/notifications
    console.log('\n7. User A fetching notifications feed GET /api/notifications...');
    const getRes = await fetch(`${API_BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${userAData.token}` },
    });
    const getData = await getRes.json();
    console.log(`   Total notifications: ${getData.notifications.length}, Unread count: ${getData.unreadCount}`);

    // 8. Test Mark Single Read PATCH /api/notifications/:id/read
    console.log('\n8. Marking notification as read PATCH /api/notifications/:id/read...');
    const readRes = await fetch(`${API_BASE}/api/notifications/${receivedNotification._id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userAData.token}` },
    });
    const readData = await readRes.json();
    console.log('   Response:', readData.message);

    // 9. Test Mark All Read PATCH /api/notifications/read-all
    console.log('\n9. Marking all notifications as read PATCH /api/notifications/read-all...');
    const readAllRes = await fetch(`${API_BASE}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userAData.token}` },
    });
    const readAllData = await readAllRes.json();
    console.log('   Response:', readAllData.message);

    socketA.disconnect();
    console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
}

// Give server time to initialize if needed
setTimeout(testFullFlow, 1000);
