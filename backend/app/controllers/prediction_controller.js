import { DataService } from '../services/data_service.js';
import { ExplainabilityService } from '../services/explainability_service.js';

export class PredictionController {
  constructor(churnService) {
    this.churnService = churnService;
  }

  predictMember = (req, res) => {
    try {
      const member = req.body;
      if (!member) {
        return res.status(400).json({ error: 'Member data is required' });
      }

      const { schema } = DataService.loadDataset();
      const processed = this.churnService.getProcessedDataset();

      const { probability, riskLevel, prediction } = this.churnService.predictMember(member);
      
      const topDrivers = processed 
        ? ExplainabilityService.getMemberDrivers(member, schema, processed, this.churnService, 5)
        : [];

      res.json({
        churnProbability: probability,
        riskLevel,
        prediction,
        topDrivers,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error processing prediction' });
    }
  };

  getModelMetrics = (req, res) => {
    try {
      const metrics = this.churnService.getMetrics();
      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error getting model metrics' });
    }
  };

  getModelDrivers = (req, res) => {
    try {
      const drivers = this.churnService.getGlobalFeatureImportance();
      res.json(drivers);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error getting model drivers' });
    }
  };

  getDashboard = (req, res) => {
    try {
      const { members, schema } = DataService.loadDataset();
      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;
      let totalProbSum = 0;

      const planTypeChurn = {};
      const riskSegments = {
        unresolvedCases: 0,
        highCostIncrease: 0,
        lowBenefitUtil: 0,
        providerAccessDelay: 0,
        decliningEngagement: 0,
      };

      members.forEach(m => {
        const { probability, riskLevel } = this.churnService.predictMember(m);
        totalProbSum += probability;

        if (riskLevel === 'HIGH') highRisk++;
        else if (riskLevel === 'MEDIUM') mediumRisk++;
        else lowRisk++;

        const plan = String(m.Plan_Type || 'Other');
        if (!planTypeChurn[plan]) planTypeChurn[plan] = { total: 0, churn: 0 };
        planTypeChurn[plan].total++;
        if (probability >= 0.5) planTypeChurn[plan].churn++;

        // Risk Segment breakdown
        if (Number(m.Unresolved_Service_Cases || 0) >= 1) riskSegments.unresolvedCases++;
        if (Number(m.Out_Of_Pocket_Change_Pct || 0) > 20) riskSegments.highCostIncrease++;
        if (Number(m.Benefit_Utilization_Score || 0) < 0.35) riskSegments.lowBenefitUtil++;
        if (Number(m.Provider_Access_Issues || 0) >= 1 || Number(m.Appointment_Wait_Days || 0) >= 21) riskSegments.providerAccessDelay++;
        if (String(m.Engagement_Score_Trend || '') === 'Declining') riskSegments.decliningEngagement++;
      });

      const totalMembers = members.length;
      const predictedChurnRate = totalMembers > 0 ? parseFloat((totalProbSum / totalMembers).toFixed(4)) : 0;

      const planTypeDistribution = Object.entries(planTypeChurn).map(([plan, data]) => ({
        plan,
        totalMembers: data.total,
        predictedChurnCount: data.churn,
        churnRate: parseFloat(((data.churn / data.total) * 100).toFixed(1)),
      }));

      const metrics = this.churnService.getMetrics();
      const globalDrivers = this.churnService.getGlobalFeatureImportance().slice(0, 8);

      res.json({
        kpis: {
          totalMembers,
          highRiskMembers: highRisk,
          mediumRiskMembers: mediumRisk,
          lowRiskMembers: lowRisk,
          predictedChurnRate: parseFloat((predictedChurnRate * 100).toFixed(1)),
        },
        riskDistribution: [
          { name: 'Low Risk (<30%)', count: lowRisk, color: '#10B981' },
          { name: 'Medium Risk (30-69%)', count: mediumRisk, color: '#F59E0B' },
          { name: 'High Risk (>=70%)', count: highRisk, color: '#EF4444' },
        ],
        planTypeDistribution,
        riskSegments,
        globalDrivers,
        modelMetrics: metrics,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error fetching dashboard data' });
    }
  };
}
