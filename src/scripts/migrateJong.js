/**
 * One-time migration script for Jong's user data
 * This script will migrate Jong from legacy NTRP structure to the new unified format
 *
 * 📝 LPR vs NTRP 네이밍 규칙
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * 코드/DB: "ntrp" - 변수명, 함수명, Firestore 필드명
 *
 * 이유: Firestore 필드명 변경은 데이터 마이그레이션 위험이 있어
 *       UI 텍스트만 LPR로 변경하고 코드는 ntrp를 유지합니다.
 */

// Import userService to access migration functions
const userService = require('../services/userService.js').default;

const JONG_USER_ID = 'Vr5z2suh9TZl3eQZfukPhLW6Ont1';

async function migrateJongData() {
  console.log("🚀 Starting Jong's NTRP data migration...");
  console.log('📊 Target User ID:', JONG_USER_ID);

  try {
    // Step 1: Get current user data to see what we're working with
    console.log('\n📄 Step 1: Fetching current user data...');
    const currentUser = await userService.getUserProfile(JONG_USER_ID);

    console.log('Current NTRP data:');
    console.log('- ltrLevel (root):', currentUser.ltrLevel);
    console.log('- profile.skillLevel:', currentUser.profile?.skillLevel);
    console.log('- profile.ltrLevel:', currentUser.profile?.ltrLevel);
    console.log('- skillLevel (new):', currentUser.skillLevel);

    // Step 2: Perform the migration
    console.log('\n🔄 Step 2: Performing migration...');
    const newSkillLevel = await userService.migrateUserToNewNtrpStructure(JONG_USER_ID);

    console.log('Migration result:', JSON.stringify(newSkillLevel, null, 2));

    // Step 3: Verify the migration worked
    console.log('\n✅ Step 3: Verifying migration...');
    const migratedUser = await userService.getUserProfile(JONG_USER_ID);

    console.log('After migration:');
    console.log('- skillLevel.selfAssessed:', migratedUser.skillLevel?.selfAssessed);
    console.log('- skillLevel.calculated:', migratedUser.skillLevel?.calculated);
    console.log('- skillLevel.source:', migratedUser.skillLevel?.source);
    console.log('- skillLevel.lastUpdated:', migratedUser.skillLevel?.lastUpdated);

    // Step 4: Test the new display logic
    console.log('\n🖼️ Step 4: Testing display logic...');
    const displayResult = userService.getLtrDisplay(migratedUser);
    console.log('Display result:', displayResult);

    console.log('\n🎉 Migration completed successfully!');
    console.log("Jong's NTRP data has been migrated to the new structure.");
    console.log('The UI should now show consistent skill levels across all screens.');

    return {
      success: true,
      newSkillLevel,
      displayResult,
    };
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Full error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export for use in other scripts or direct execution
module.exports = { migrateJongData, JONG_USER_ID };

// If this script is run directly (not imported), execute the migration
if (require.main === module) {
  migrateJongData()
    .then(result => {
      if (result.success) {
        console.log('\n✨ Script completed successfully!');
        process.exit(0);
      } else {
        console.log('\n💥 Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}
