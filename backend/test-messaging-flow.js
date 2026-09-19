const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000';

async function testMessagingPlatformFlow() {
  console.log('====================================================');
  console.log('💬 Real-Time Messaging Platform Verification Test');
  console.log('====================================================');

  try {
    // 1. Health check
    console.log('1. Testing API Status GET / ...');
    const healthRes = await fetch(`${API_BASE}/`);
    const healthData = await healthRes.json();
    console.log('   Response:', healthData.message);

    // 2. Register User A (Alice)
    console.log('\n2. Registering User A (Alice)...');
    const userARes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Smith',
        username: `alice_${Date.now().toString().slice(-4)}`,
        email: `alice_${Date.now()}@test.com`,
        password: 'password123',
      }),
    });
    const userAData = await userARes.json();
    if (!userAData.success) throw new Error(userAData.message);
    console.log(`   User A registered! ID: ${userAData.user.id}, Username: @${userAData.user.username}, UserID: #${userAData.user.userId}`);

    // 3. Register User B (Bob)
    console.log('\n3. Registering User B (Bob)...');
    const userBRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Johnson',
        username: `bob_${Date.now().toString().slice(-4)}`,
        email: `bob_${Date.now()}@test.com`,
        password: 'password123',
      }),
    });
    const userBData = await userBRes.json();
    if (!userBData.success) throw new Error(userBData.message);
    console.log(`   User B registered! ID: ${userBData.user.id}, Username: @${userBData.user.username}, UserID: #${userBData.user.userId}`);

    // 4. User Search
    console.log('\n4. Testing User Search GET /api/users/search?query=...');
    const searchRes = await fetch(`${API_BASE}/api/users/search?query=${userAData.user.userId}`, {
      headers: { Authorization: `Bearer ${userBData.token}` },
    });
    const searchData = await searchRes.json();
    console.log(`   Found ${searchData.users.length} users matching UserID #${userAData.user.userId}:`, searchData.users[0]?.name);

    // 5. Connect User A Socket.IO
    console.log('\n5. Connecting User A to Socket.IO real-time engine...');
    const socketA = io(API_BASE, {
      auth: { token: userAData.token },
    });

    await new Promise((resolve, reject) => {
      socketA.on('connect', () => {
        console.log(`   Socket connected! Socket ID: ${socketA.id}`);
        resolve();
      });
      socketA.on('connect_error', (err) => reject(err));
    });

    // Promise for incoming socket message
    const socketMessagePromise = new Promise((resolve) => {
      socketA.on('receive_message', (payload) => {
        console.log('\n⚡ [REAL-TIME SOCKET MESSAGE RECEIVED BY ALICE] ⚡');
        console.log('   From:', payload.sender.name);
        console.log('   Text:', payload.message.text);
        console.log('   Conversation ID:', payload.conversationId);
        resolve(payload);
      });
    });

    // 6. User B sends message to User A
    console.log('\n6. User B sending real-time message to User A...');
    const sendRes = await fetch(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBData.token}`,
      },
      body: JSON.stringify({
        receiverId: userAData.user.id,
        text: 'Hey Alice! Checking out the new real-time messaging app 🚀',
      }),
    });
    const sendData = await sendRes.json();
    console.log('   Send API Response:', sendData.message.text);

    // Wait for real-time socket arrival
    const receivedPayload = await socketMessagePromise;

    // 7. Test Fetch Conversations
    console.log('\n7. User A fetching conversations feed GET /api/conversations...');
    const convsRes = await fetch(`${API_BASE}/api/conversations`, {
      headers: { Authorization: `Bearer ${userAData.token}` },
    });
    const convsData = await convsRes.json();
    console.log(`   Total active conversations: ${convsData.conversations.length}`);
    console.log(`   Last Message: "${convsData.conversations[0]?.lastMessage}"`);
    console.log(`   Unread Count: ${convsData.conversations[0]?.unreadCount}`);

    // 8. Test Mark Read
    console.log('\n8. User A marking conversation read PATCH /api/messages/:id/read...');
    const readRes = await fetch(`${API_BASE}/api/messages/${receivedPayload.conversationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userAData.token}` },
    });
    const readData = await readRes.json();
    console.log('   Response:', readData.message);

    socketA.disconnect();
    console.log('\n✅ ALL MESSAGING PLATFORM VERIFICATION TESTS PASSED PERFECTLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
    process.exit(1);
  }
}

setTimeout(testMessagingPlatformFlow, 1000);
