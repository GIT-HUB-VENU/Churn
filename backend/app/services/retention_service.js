export class RetentionService {
  static generateRecommendations(
    member,
    riskLevel,
    churnProbability,
    drivers
  ) {
    const recs = [];

    const unresolvedCases = Number(member.Unresolved_Service_Cases || 0);
    const serviceContacts = Number(member.Service_Contact_Count || 0);
    const oopCost = Number(member.Out_Of_Pocket_Cost || 0);
    const oopChangePct = Number(member.Out_Of_Pocket_Change_Pct || 0);
    const benefitUtil = Number(member.Benefit_Utilization_Score || 0);
    const providerIssues = Number(member.Provider_Access_Issues || 0);
    const waitDays = Number(member.Appointment_Wait_Days || 0);
    const pharmacyIssues = Number(member.Pharmacy_Support_Issues || 0);
    const recentPlanChange = String(member.Plan_Change_Recent || 'No');
    const engagementTrend = String(member.Engagement_Score_Trend || 'Stable');

    // Rule 1: Service Recovery
    if (unresolvedCases >= 1 || serviceContacts >= 6) {
      const priority = unresolvedCases >= 2 ? 'HIGH' : riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
      recs.push({
        action: 'Service Recovery',
        priority,
        triggeringDriver: `${unresolvedCases} unresolved case(s), ${serviceContacts} contact(s)`,
        reason: 'Unresolved service interactions are contributing to elevated churn risk and member dissatisfaction.',
        supportingIndicators: [
          `Unresolved Service Cases: ${unresolvedCases}`,
          `Total Service Contacts: ${serviceContacts}`,
        ],
      });
    }

    // Rule 2: Benefit Education
    if (oopChangePct > 15 || oopCost > 3000 || benefitUtil < 0.35) {
      const priority = (oopChangePct > 30 || benefitUtil < 0.20) ? 'HIGH' : 'MEDIUM';
      const utilPct = Math.round(benefitUtil * 100);
      recs.push({
        action: 'Benefit Education',
        priority,
        triggeringDriver: `Cost change +${oopChangePct}%, Benefit utilization ${utilPct}%`,
        reason: 'Observed benefit utilization and cost indicators are associated with elevated churn risk. Proactive guidance on preventative coverage and cost caps can improve plan value retention.',
        supportingIndicators: [
          `Out-of-Pocket Cost: $${oopCost.toLocaleString()}`,
          `Out-of-Pocket Cost Change: +${oopChangePct}%`,
          `Benefit Utilization Score: ${utilPct}%`,
        ],
      });
    }

    // Rule 3: Care/Provider Outreach
    if (providerIssues >= 1 || waitDays >= 21) {
      const priority = (providerIssues >= 2 || waitDays >= 30) ? 'HIGH' : 'MEDIUM';
      recs.push({
        action: 'Care/Provider Outreach',
        priority,
        triggeringDriver: `${providerIssues} access issue(s), ${waitDays} days wait time`,
        reason: 'Provider availability and appointment delays contribute to member care friction. Concierge navigation support is recommended to locate in-network primary care providers.',
        supportingIndicators: [
          `Provider Access Issues: ${providerIssues}`,
          `Appointment Wait Time: ${waitDays} days`,
        ],
      });
    }

    // Rule 4: Pharmacy Support
    if (pharmacyIssues >= 1) {
      const priority = pharmacyIssues >= 2 ? 'HIGH' : 'MEDIUM';
      recs.push({
        action: 'Pharmacy Support',
        priority,
        triggeringDriver: `${pharmacyIssues} pharmacy service issue(s)`,
        reason: 'Prescription access and fulfillment barriers contribute to member attrition. Pharmacy benefit guidance and mail-order options offer immediate resolution.',
        supportingIndicators: [
          `Pharmacy Support Issues: ${pharmacyIssues}`,
        ],
      });
    }

    // Rule 5: Plan Education
    if (recentPlanChange === 'Yes') {
      recs.push({
        action: 'Plan Education',
        priority: 'MEDIUM',
        triggeringDriver: 'Recent plan change',
        reason: 'Members with recent plan transitions benefit from structured orientation regarding network details, tier adjustments, and covered services.',
        supportingIndicators: [
          `Plan Change in Last 12m: Yes`,
          `Current Plan: ${member.Plan_Type} (${member.Plan_Tier})`,
        ],
      });
    }

    // Rule 6: Member Education/Outreach
    if (engagementTrend === 'Declining' || recs.length === 0) {
      recs.push({
        action: 'Member Education/Outreach',
        priority: riskLevel === 'HIGH' ? 'HIGH' : 'LOW',
        triggeringDriver: `Engagement trend: ${engagementTrend}`,
        reason: 'Personalized engagement outreach supports digital portal onboarding and proactive health management.',
        supportingIndicators: [
          `Engagement Trend: ${engagementTrend}`,
          `Portal Logins (90d): ${member.Portal_Logins_Last_90d || 0}`,
        ],
      });
    }

    // Sort by Priority (HIGH > MEDIUM > LOW) and limit to top 3 recommendations
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    recs.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    return recs.slice(0, 3);
  }

  static generateAggregatedSummary(
    members,
    churnService
  ) {
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let churnSum = 0;

    const driverCounts = {};
    const actionCounts = {};

    members.forEach(member => {
      const { probability, riskLevel } = churnService.predictMember(member);
      churnSum += probability;

      if (riskLevel === 'HIGH') highCount++;
      else if (riskLevel === 'MEDIUM') mediumCount++;
      else lowCount++;

      // Evaluate indicators
      if (Number(member.Unresolved_Service_Cases || 0) >= 1) {
        driverCounts['Unresolved Service Cases'] = (driverCounts['Unresolved_Service_Cases'] || 0) + 1;
        actionCounts['Service Recovery'] = (actionCounts['Service Recovery'] || 0) + 1;
      }

      if (Number(member.Out_Of_Pocket_Change_Pct || 0) > 15 || Number(member.Benefit_Utilization_Score || 0) < 0.35) {
        driverCounts['Cost & Low Benefit Utilization'] = (driverCounts['Cost & Low Benefit Utilization'] || 0) + 1;
        actionCounts['Benefit Education'] = (actionCounts['Benefit Education'] || 0) + 1;
      }

      if (Number(member.Provider_Access_Issues || 0) >= 1 || Number(member.Appointment_Wait_Days || 0) >= 21) {
        driverCounts['Provider Access & Wait Days'] = (driverCounts['Provider Access & Wait Days'] || 0) + 1;
        actionCounts['Care/Provider Outreach'] = (actionCounts['Care/Provider Outreach'] || 0) + 1;
      }

      if (Number(member.Pharmacy_Support_Issues || 0) >= 1) {
        driverCounts['Pharmacy Support Issues'] = (driverCounts['Pharmacy Support Issues'] || 0) + 1;
        actionCounts['Pharmacy Support'] = (actionCounts['Pharmacy Support'] || 0) + 1;
      }

      if (String(member.Plan_Change_Recent || '') === 'Yes') {
        driverCounts['Recent Plan Change'] = (driverCounts['Recent Plan Change'] || 0) + 1;
        actionCounts['Plan Education'] = (actionCounts['Plan Education'] || 0) + 1;
      }

      if (String(member.Engagement_Score_Trend || '') === 'Declining') {
        driverCounts['Declining Engagement'] = (driverCounts['Declining Engagement'] || 0) + 1;
        actionCounts['Member Education/Outreach'] = (actionCounts['Member Education/Outreach'] || 0) + 1;
      }
    });

    const total = members.length || 1;
    const predictedChurnRate = parseFloat((churnSum / total).toFixed(4));

    const mostCommonDrivers = Object.entries(driverCounts)
      .map(([driver, count]) => ({
        driver,
        count,
        percentage: parseFloat(((count / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    const mostRecommendedActions = Object.entries(actionCounts)
      .map(([action, count]) => ({
        action,
        count,
        percentage: parseFloat(((count / total) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalHighRiskMembers: highCount,
      totalMediumRiskMembers: mediumCount,
      totalLowRiskMembers: lowCount,
      predictedChurnRate,
      mostCommonDrivers,
      mostRecommendedActions,
      highPriorityOpportunitiesCount: Math.round(highCount * 0.85),
    };
  }
}
