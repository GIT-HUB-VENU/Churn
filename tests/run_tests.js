import { DataService } from '../backend/app/services/data_service.js';
import { ChurnService } from '../backend/app/services/churn_service.js';
import { ExplainabilityService } from '../backend/app/services/explainability_service.js';
import { RetentionService } from '../backend/app/services/retention_service.js';

async function runTests() {
  console.log('=== CareRetain AI Integration & Unit Tests ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Dataset Loading & Schema Detection
    console.log('Testing Dataset Service...');
    const { members, schema } = DataService.loadDataset();
    assert(members.length > 0, 'Dataset loaded non-empty member list');
    assert(schema.targetColumn === 'Churn', `Target column detected as '${schema.targetColumn}'`);
    assert(schema.idColumn === 'Member_ID', `Member ID column detected as '${schema.idColumn}'`);
    assert(schema.numericalFeatures.length > 0, 'Numerical features identified');
    assert(schema.categoricalFeatures.length > 0, 'Categorical features identified');

    // Test 2: XGBoost Model Training
    console.log('\nTesting XGBoost Churn ML Pipeline...');
    const churnService = new ChurnService();
    const { metrics, featureImportance } = churnService.trainModel(members, schema);
    
    assert(metrics.accuracy > 0.6, `Model Accuracy is acceptable (${(metrics.accuracy * 100).toFixed(1)}%)`);
    assert(metrics.rocAuc > 0.6, `Model ROC-AUC is acceptable (${metrics.rocAuc})`);
    assert(featureImportance.length > 0, 'Global feature importance calculated');

    // Test 3: Member Risk Classification & Explanations
    console.log('\nTesting Member Risk & Driver Explanations...');
    const testMember = members[0];
    const prediction = churnService.predictMember(testMember);
    assert(['LOW', 'MEDIUM', 'HIGH'].includes(prediction.riskLevel), `Risk level classified as ${prediction.riskLevel}`);
    assert(prediction.probability >= 0 && prediction.probability <= 1, 'Probability is within [0, 1]');

    const processed = churnService.getProcessedDataset();
    if (processed) {
      const drivers = ExplainabilityService.getMemberDrivers(testMember, schema, processed, churnService, 5);
      assert(drivers.length > 0, 'Local drivers generated for member');
      assert(drivers[0].explanation.length > 0, 'Driver has compliant plain-language explanation');
    }

    // Test 4: Retention Recommendation Engine
    console.log('\nTesting Retention Recommendation Rules...');
    const highRiskMemberWithUnresolvedCases = {
      Member_ID: 'MMB-TEST-HIGH',
      Unresolved_Service_Cases: 3,
      Service_Contact_Count: 8,
      Out_Of_Pocket_Cost: 5000,
      Out_Of_Pocket_Change_Pct: 40,
      Benefit_Utilization_Score: 0.15,
      Provider_Access_Issues: 2,
      Appointment_Wait_Days: 30,
      Pharmacy_Support_Issues: 2,
      Plan_Change_Recent: 'Yes',
      Engagement_Score_Trend: 'Declining',
      Portal_Logins_Last_90d: 1,
      Churn: 'Yes',
    };

    const recs = RetentionService.generateRecommendations(
      highRiskMemberWithUnresolvedCases,
      'HIGH',
      0.88,
      []
    );

    assert(recs.length > 0, 'Retention recommendations generated for high risk member');
    assert(recs.some(r => r.action === 'Service Recovery'), 'Service Recovery rule triggered for unresolved cases');
    assert(recs.some(r => r.action === 'Benefit Education'), 'Benefit Education rule triggered for cost & low utilization');

    console.log(`\n=== Test Summary: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
