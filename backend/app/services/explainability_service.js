export class ExplainabilityService {
  static getMemberDrivers(
    member,
    schema,
    processed,
    churnService,
    topN = 5
  ) {
    const drivers = [];

    // Key risk indicators inspection
    const unresolvedCases = Number(member.Unresolved_Service_Cases || 0);
    const serviceContacts = Number(member.Service_Contact_Count || 0);
    const oopCost = Number(member.Out_Of_Pocket_Cost || 0);
    const oopChangePct = Number(member.Out_Of_Pocket_Change_Pct || 0);
    const benefitUtil = Number(member.Benefit_Utilization_Score || 0);
    const providerIssues = Number(member.Provider_Access_Issues || 0);
    const waitDays = Number(member.Appointment_Wait_Days || 0);
    const pharmacyIssues = Number(member.Pharmacy_Support_Issues || 0);
    const engagementTrend = String(member.Engagement_Score_Trend || 'Stable');
    const recentPlanChange = String(member.Plan_Change_Recent || 'No');
    const portalLogins = Number(member.Portal_Logins_Last_90d || 0);

    // 1. Unresolved Service Cases
    if (unresolvedCases >= 1) {
      drivers.push({
        feature: 'Unresolved_Service_Cases',
        featureLabel: 'Unresolved Service Cases',
        observedValue: `${unresolvedCases} case${unresolvedCases > 1 ? 's' : ''}`,
        contribution: parseFloat((0.25 + unresolvedCases * 0.05).toFixed(2)),
        explanation: `${unresolvedCases} open service case(s) without timely resolution is strongly associated with elevated churn risk.`,
      });
    }

    // 2. High Service Contact Frequency
    if (serviceContacts >= 5) {
      drivers.push({
        feature: 'Service_Contact_Count',
        featureLabel: 'High Service Contact Count',
        observedValue: `${serviceContacts} contacts`,
        contribution: parseFloat((0.15 + serviceContacts * 0.01).toFixed(2)),
        explanation: `Elevated service touchpoints (${serviceContacts} contacts) indicate ongoing member service friction.`,
      });
    }

    // 3. Out of Pocket Cost & Increase
    if (oopChangePct > 20 || oopCost > 3500) {
      drivers.push({
        feature: 'Out_Of_Pocket_Change_Pct',
        featureLabel: 'Out-of-Pocket Cost Increase',
        observedValue: `$${oopCost.toLocaleString()} (+${oopChangePct}% change)`,
        contribution: parseFloat((0.18 + Math.min(0.15, oopChangePct / 200)).toFixed(2)),
        explanation: `Substantial out-of-pocket cost burden and cost increases are associated with higher plan switching probability.`,
      });
    }

    // 4. Low Benefit Utilization
    if (benefitUtil < 0.35) {
      const utilPct = Math.round(benefitUtil * 100);
      drivers.push({
        feature: 'Benefit_Utilization_Score',
        featureLabel: 'Low Benefit Utilization',
        observedValue: `${utilPct}% utilization`,
        contribution: parseFloat((0.20 + (0.35 - benefitUtil) * 0.2).toFixed(2)),
        explanation: `Lower plan benefit utilization (${utilPct}%) suggests member confusion or under-activation of plan value.`,
      });
    }

    // 5. Provider Access & Appointment Delays
    if (providerIssues >= 1 || waitDays >= 21) {
      drivers.push({
        feature: 'Provider_Access_Issues',
        featureLabel: 'Provider Access & Delay',
        observedValue: `${waitDays} days wait / ${providerIssues} access issue(s)`,
        contribution: parseFloat((0.14 + waitDays * 0.003).toFixed(2)),
        explanation: `Appointment delays and in-network provider availability issues contribute to elevated churn probability.`,
      });
    }

    // 6. Pharmacy Support Friction
    if (pharmacyIssues >= 1) {
      drivers.push({
        feature: 'Pharmacy_Support_Issues',
        featureLabel: 'Pharmacy Service Friction',
        observedValue: `${pharmacyIssues} pharmacy issue(s)`,
        contribution: parseFloat((0.16 + pharmacyIssues * 0.03).toFixed(2)),
        explanation: `Unresolved prescription fulfillment and pharmacy benefit friction contribute to member dissatisfaction.`,
      });
    }

    // 7. Declining Engagement & Portal Activity
    if (engagementTrend === 'Declining' || portalLogins <= 3) {
      drivers.push({
        feature: 'Engagement_Score_Trend',
        featureLabel: 'Declining Digital Engagement',
        observedValue: `${engagementTrend} trend (${portalLogins} logins in 90d)`,
        contribution: 0.15,
        explanation: `Decreasing digital portal activity and engagement trend is associated with disenrollment probability.`,
      });
    }

    // 8. Recent Plan Change Confusion
    if (recentPlanChange === 'Yes') {
      drivers.push({
        feature: 'Plan_Change_Recent',
        featureLabel: 'Recent Plan Change',
        observedValue: 'Changed plan within last 12m',
        contribution: 0.12,
        explanation: `Recent plan tier or structure changes often generate initial onboarding friction and benefit confusion.`,
      });
    }

    // Protective / Low risk factors if drivers list is small
    if (drivers.length < 2) {
      const tenure = Number(member.Tenure_Months || 0);
      if (tenure > 24) {
        drivers.push({
          feature: 'Tenure_Months',
          featureLabel: 'Member Tenure',
          observedValue: `${tenure} months`,
          contribution: -0.12,
          explanation: `Established tenure (${tenure} months) reflects baseline plan loyalty and continuity of care.`,
        });
      }
      const prevVisits = Number(member.Preventive_Care_Visits || 0);
      if (prevVisits >= 2) {
        drivers.push({
          feature: 'Preventive_Care_Visits',
          featureLabel: 'Preventive Care Engagement',
          observedValue: `${prevVisits} preventive visits`,
          contribution: -0.10,
          explanation: `Regular preventive care engagement supports positive member retention outcomes.`,
        });
      }
    }

    // Sort by absolute contribution magnitude
    drivers.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    return drivers.slice(0, topN);
  }
}
