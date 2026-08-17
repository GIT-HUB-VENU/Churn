import React from 'react';
import { ShieldCheck, AlertCircle, Lock, Eye, FileCheck, Scale, HeartPulse, UserCheck } from 'lucide-react';

export const ResponsibleAiPage = () => {
  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Responsible AI & Compliance Framework</h1>
            <p className="text-xs text-slate-500 mt-0.5">Ethical standards, non-diagnostic boundaries, and human-in-the-loop guidelines for CareRetain AI</p>
          </div>
        </div>
      </div>

      {/* Guiding Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Decision-Support Only */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Human-in-the-Loop Operations</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            CareRetain AI operates strictly as an operational decision-support tool for authorized member retention advisors. Predictions do not trigger automated plan disenrollment or alterations without human advisor validation.
          </p>
        </div>

        {/* Card 2: Non-Diagnostic Mandate */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <HeartPulse className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Non-Diagnostic & Clinical Neutrality</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Model features evaluate operational service friction, cost indicators, and digital engagement. Outputs are not clinical diagnoses or medical advice.
          </p>
        </div>

        {/* Card 3: Explainability & Transparency */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Transparent Feature Contributions</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every predicted risk score is accompanied by local feature contribution drivers, enabling retention teams to understand the exact factors behind a prediction.
          </p>
        </div>

        {/* Card 4: Approved Action Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Approved Retention Actions Only</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Recommendations are constrained to pre-approved, compliant action categories (e.g., Benefit Education, Service Recovery). The system never generates unapproved financial or clinical promises.
          </p>
        </div>
      </div>

      {/* Compliance Disclaimer Banner */}
      <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
          <AlertCircle className="h-4 w-4" />
          <span>OPERATIONAL COMPLIANCE NOTICE</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          CareRetain AI adheres to strict data privacy guidelines. All dataset ingestion, model inference, and explainability calculations are conducted locally within secure application boundaries.
        </p>
      </div>
    </div>
  );
};
