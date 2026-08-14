import path from 'path';

export const defaultConfig = {
  datasetPath: process.env.DATASET_PATH || path.join(process.cwd(), 'data', 'Uploaded_dataset.csv'),
  fallbackDatasetPath: path.join(process.cwd(), 'backend', 'data', 'Uploaded_dataset.csv'),
  
  thresholds: {
    lowMax: 0.30,
    mediumMax: 0.69,
  },

  modelParams: {
    nEstimators: 40,
    learningRate: 0.1,
    maxDepth: 4,
    minSamplesSplit: 3,
    l2Reg: 1.0,
    trainRatio: 0.8,
  },

  approvedActions: [
    {
      id: 'benefit_education',
      title: 'Benefit Education',
      category: 'Financial & Coverage Clarity',
      description: 'Proactive guidance on plan benefits, out-of-pocket cost caps, and preventative care coverage.'
    },
    {
      id: 'service_recovery',
      title: 'Service Recovery',
      category: 'Service Resolution',
      description: 'Dedicated case manager assignment to resolve outstanding service tickets and communication friction.'
    },
    {
      id: 'care_provider_outreach',
      title: 'Care/Provider Outreach',
      category: 'Provider & Network Access',
      description: 'Concierge navigation support to find in-network primary care providers with shorter appointment wait times.'
    },
    {
      id: 'pharmacy_support',
      title: 'Pharmacy Support',
      category: 'Medication Access',
      description: 'Pharmacy benefit consultation for mail-order delivery, formulary alternatives, and copay assistance.'
    },
    {
      id: 'plan_education',
      title: 'Plan Education',
      category: 'Plan Fit & Onboarding',
      description: 'Detailed orientation on plan structure, recent tier changes, and summary of benefits and coverage.'
    },
    {
      id: 'member_education_outreach',
      title: 'Member Education/Outreach',
      category: 'Engagement & Wellness',
      description: 'Personalized wellness portal walkthrough and digital engagement outreach.'
    }
  ]
};
