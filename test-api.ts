import { TwitterService } from './server/services/twitterService';
import { BotInteractionService } from './server/services/botInteractionService';

async function testTwitterAPI() {
  console.log('🚀 Testing Twitter API integration...\n');
  
  const twitterService = new TwitterService();
  
  try {
    // Test 1: Check API limits
    console.log('📊 Testing API limits check...');
    const apiLimits = await twitterService.checkApiLimits();
    console.log('✅ API Limits:', JSON.stringify(apiLimits, null, 2));
    console.log('');
    
    // Test 2: Search tweets
    console.log('🔍 Testing tweet search...');
    const searchResults = await twitterService.searchTweets('AI', 5);
    console.log('✅ Search Results:', searchResults ? 'Success' : 'No results');
    console.log('');
    
    // Test 3: Get user by screen name
    console.log('👤 Testing user lookup...');
    const userInfo = await twitterService.getUserByScreenName('elonmusk');
    console.log('✅ User Info:', userInfo ? 'Success' : 'No user found');
    console.log('');
    
    console.log('🎉 All API tests passed!');
  } catch (error: any) {
    console.error('❌ API Test Error:', error.message);
    
    // Check if it's an authentication error
    if (error.message.includes('401') || error.message.includes('authentication')) {
      console.log('\n💡 This might be an authentication issue. Please check:');
      console.log('   - APIDANCE_API_KEY is set correctly in .env');
      console.log('   - API key has the required permissions');
      console.log('   - API service is available');
    }
  }
}

async function testBotInteraction() {
  console.log('\n🤖 Testing Bot Interaction Service...\n');
  
  const botInteractionService = new BotInteractionService();
  
  try {
    // Test bot interaction stats (this should work even without real bots)
    console.log('📈 Testing bot interaction stats...');
    const stats = await botInteractionService.getBotInteractionStats(1);
    console.log('✅ Interaction Stats:', JSON.stringify(stats, null, 2));
    console.log('');
    
    console.log('🎉 Bot interaction service is working!');
  } catch (error: any) {
    console.error('❌ Bot Interaction Test Error:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting API Integration Tests');
  console.log('='.repeat(50));
  
  await testTwitterAPI();
  await testBotInteraction();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Test suite completed!');
}

// Run tests if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this is the main module
if (process.argv[1] === __filename) {
  runTests().catch(console.error);
}

export { runTests, testTwitterAPI, testBotInteraction };