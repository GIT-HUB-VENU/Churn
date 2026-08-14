import fs from 'fs';
import path from 'path';

function generateSyntheticDataset(rowCount = 1000) {
  const plans = ['HMO', 'PPO', 'EPO', 'POS', 'Medicare Advantage'];
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const genders = ['Female', 'Male', 'Non-Binary'];
  const engagementTrends = ['Declining', 'Stable', 'Increasing'];

  const rows = [];
  // Header
  rows.push([
    'Member_ID',
    'Age',
    'Gender',
    'Plan_Type',
    'Plan_Tier',
    'Tenure_Months',
    'Monthly_Premium',
    'Out_Of_Pocket_Cost',
    'Out_Of_Pocket_Change_Pct',
    'Benefit_Utilization_Score',
    'Preventive_Care_Visits',
    'Unresolved_Service_Cases',
    'Service_Contact_Count',
    'Provider_Access_Issues',
    'Appointment_Wait_Days',
    'Pharmacy_Support_Issues',
    'Plan_Change_Recent',
    'Engagement_Score_Trend',
    'Portal_Logins_Last_90d',
    'Churn'
  ].join(','));

  for (let i = 1; i <= rowCount; i++) {
    const memberId = `MMB-${10000 + i}`;
    const age = Math.floor(18 + Math.random() * 65);
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const planType = plans[Math.floor(Math.random() * plans.length)];
    const planTier = tiers[Math.floor(Math.random() * tiers.length)];
    const tenureMonths = Math.floor(1 + Math.random() * 119);
    
    const monthlyPremium = Math.floor(180 + Math.random() * 600);
    const oopCost = Math.floor(200 + Math.random() * 6800);
    const oopChangePct = parseFloat((-15 + Math.random() * 95).toFixed(1));
    const benefitUtil = parseFloat((0.08 + Math.random() * 0.88).toFixed(2));
    const prevVisits = Math.floor(Math.random() * 8);

    const unresolvedCases = Math.random() < 0.25 ? Math.floor(1 + Math.random() * 6) : 0;
    const serviceContacts = unresolvedCases > 0 ? Math.floor(unresolvedCases + Math.random() * 12) : Math.floor(Math.random() * 5);
    const providerIssues = Math.random() < 0.2 ? Math.floor(1 + Math.random() * 4) : 0;
    const waitDays = Math.floor(3 + Math.random() * 45);
    const pharmacyIssues = Math.random() < 0.18 ? Math.floor(1 + Math.random() * 5) : 0;
    const planChangeRecent = Math.random() < 0.22 ? 'Yes' : 'No';
    const engagementTrend = engagementTrends[Math.floor(Math.random() * engagementTrends.length)];
    const portalLogins = engagementTrend === 'Declining' ? Math.floor(Math.random() * 6) : Math.floor(5 + Math.random() * 35);

    // Compute churn likelihood score based on risk drivers
    let churnScore = 0;
    
    // Unresolved service cases is a huge factor
    if (unresolvedCases >= 3) churnScore += 0.35;
    else if (unresolvedCases >= 1) churnScore += 0.18;

    // High cost / OOP increase
    if (oopChangePct > 35) churnScore += 0.22;
    if (oopCost > 4500) churnScore += 0.15;

    // Low benefit utilization
    if (benefitUtil < 0.25) churnScore += 0.20;

    // Declining engagement
    if (engagementTrend === 'Declining') churnScore += 0.18;

    // Access issues & wait days
    if (providerIssues >= 2) churnScore += 0.15;
    if (waitDays > 28) churnScore += 0.12;

    // Pharmacy issues
    if (pharmacyIssues >= 2) churnScore += 0.14;

    // Recent plan change friction
    if (planChangeRecent === 'Yes') churnScore += 0.10;

    // Protective factors
    if (benefitUtil > 0.70) churnScore -= 0.15;
    if (tenureMonths > 36) churnScore -= 0.12;
    if (prevVisits >= 3) churnScore -= 0.10;

    // Add small random noise
    churnScore += (Math.random() * 0.2 - 0.1);

    const churn = churnScore >= 0.45 ? 'Yes' : 'No';

    rows.push([
      memberId,
      age,
      gender,
      planType,
      planTier,
      tenureMonths,
      monthlyPremium,
      oopCost,
      oopChangePct,
      benefitUtil,
      prevVisits,
      unresolvedCases,
      serviceContacts,
      providerIssues,
      waitDays,
      pharmacyIssues,
      planChangeRecent,
      engagementTrend,
      portalLogins,
      churn
    ].join(','));
  }

  return rows.join('\n');
}

const csvContent = generateSyntheticDataset(1200);

// Ensure directories exist
fs.mkdirSync('./data', { recursive: true });
fs.mkdirSync('./backend/data', { recursive: true });

fs.writeFileSync('./data/Uploaded_dataset.csv', csvContent, 'utf8');
fs.writeFileSync('./backend/data/Uploaded_dataset.csv', csvContent, 'utf8');

console.log('Successfully generated 1200 synthetic member records in data/Uploaded_dataset.csv and backend/data/Uploaded_dataset.csv');
