import { DataService } from '../services/data_service.js';

export class MemberController {
  constructor(churnService) {
    this.churnService = churnService;
  }

  getMembers = (req, res) => {
    try {
      const { members, schema } = DataService.loadDataset();
      const { search, riskLevel, planType, page = '1', limit = '20', sortBy = 'churnProbability', sortOrder = 'desc' } = req.query;

      let result = members.map(m => {
        const { probability, riskLevel: risk, prediction } = this.churnService.predictMember(m);
        return {
          ...m,
          churnProbability: probability,
          riskLevel: risk,
          prediction,
        };
      });

      // Filter search
      if (search) {
        const q = String(search).toLowerCase();
        result = result.filter(m => 
          String(m[schema.idColumn]).toLowerCase().includes(q) ||
          String(m.Plan_Type || '').toLowerCase().includes(q) ||
          String(m.Plan_Tier || '').toLowerCase().includes(q)
        );
      }

      // Filter risk
      if (riskLevel && riskLevel !== 'ALL') {
        result = result.filter(m => m.riskLevel === String(riskLevel).toUpperCase());
      }

      // Filter plan
      if (planType && planType !== 'ALL') {
        result = result.filter(m => String(m.Plan_Type).toLowerCase() === String(planType).toLowerCase());
      }

      // Sort
      result.sort((a, b) => {
        let valA = a[String(sortBy)] ?? 0;
        let valB = b[String(sortBy)] ?? 0;
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Pagination
      const pageNum = parseInt(String(page), 10) || 1;
      const limitNum = parseInt(String(limit), 10) || 20;
      const totalCount = result.length;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedMembers = result.slice(startIndex, startIndex + limitNum);

      res.json({
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        members: paginatedMembers,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error fetching members' });
    }
  };

  getMemberById = async (req, res) => {
    try {
      const memberId = req.params.member_id;
      const member = DataService.getMemberById(memberId);
      if (!member) {
        return res.status(404).json({ error: `Member ${memberId} not found` });
      }

      const { members, schema } = DataService.loadDataset();
      const processed = this.churnService.getProcessedDataset();
      
      const { probability, riskLevel, prediction } = this.churnService.predictMember(member);
      
      const { ExplainabilityService } = await import('../services/explainability_service.js');
      const { RetentionService } = await import('../services/retention_service.js');
      const { GeminiService } = await import('../services/gemini_service.js');

      const topDrivers = processed 
        ? ExplainabilityService.getMemberDrivers(member, schema, processed, this.churnService, 5)
        : [];

      const recommendations = RetentionService.generateRecommendations(member, riskLevel, probability, topDrivers);

      const aiExplanation = await GeminiService.generateMemberExplanation(
        String(member[schema.idColumn]),
        String(member.Plan_Type || 'Plan'),
        probability,
        riskLevel,
        topDrivers,
        recommendations
      );

      res.json({
        member,
        churnProbability: probability,
        riskLevel,
        prediction,
        topDrivers,
        recommendations,
        aiExplanation,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error fetching member details' });
    }
  };
}
