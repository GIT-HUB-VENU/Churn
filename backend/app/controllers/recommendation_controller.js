import { DataService } from '../services/data_service.js';
import { ExplainabilityService } from '../services/explainability_service.js';
import { RetentionService } from '../services/retention_service.js';

export class RecommendationController {
  constructor(churnService) {
    this.churnService = churnService;
  }

  getMemberRecommendations = (req, res) => {
    try {
      const memberId = req.params.member_id;
      const member = DataService.getMemberById(memberId);
      if (!member) {
        return res.status(404).json({ error: `Member ${memberId} not found` });
      }

      const { schema } = DataService.loadDataset();
      const processed = this.churnService.getProcessedDataset();

      const { probability, riskLevel } = this.churnService.predictMember(member);
      
      const topDrivers = processed 
        ? ExplainabilityService.getMemberDrivers(member, schema, processed, this.churnService, 5)
        : [];

      const recommendations = RetentionService.generateRecommendations(member, riskLevel, probability, topDrivers);

      res.json({
        memberId,
        riskLevel,
        churnProbability: probability,
        recommendations,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error generating recommendations' });
    }
  };

  getRetentionSummary = (req, res) => {
    try {
      const { members } = DataService.loadDataset();
      const summary = RetentionService.generateAggregatedSummary(members, this.churnService);
      res.json(summary);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error calculating retention summary' });
    }
  };
}
