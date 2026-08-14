import React, { useState } from 'react';
import { Upload, SlidersHorizontal, CheckCircle2, AlertTriangle, RefreshCw, Database, FileSpreadsheet } from 'lucide-react';
import { uploadCsvDataset, updateRiskThresholds } from '../services/api';

export const SettingsPage = ({ onRefreshData }) => {
  // CSV Upload State
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Risk Thresholds State
  const [lowMax, setLowMax] = useState(0.30);
  const [mediumMax, setMediumMax] = useState(0.69);
  const [thresholdMessage, setThresholdMessage] = useState(null);
  const [thresholdError, setThresholdError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadMessage(null);
      setUploadError(null);
    }
  };

  const handleUploadCsv = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a CSV dataset file first.');
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    setUploadError(null);

    try {
      const text = await file.text();
      const res = await uploadCsvDataset(text, file.name);
      setUploadMessage(`Successfully loaded dataset with ${res.totalRows} records! Retrained model Accuracy: ${(res.metrics.accuracy * 100).toFixed(1)}%.`);
      setUploading(false);
      setFile(null);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setUploadError(err.message || 'Error uploading CSV dataset');
      setUploading(false);
    }
  };

  const handleUpdateThresholds = async (e) => {
    e.preventDefault();
    setThresholdMessage(null);
    setThresholdError(null);

    if (lowMax >= mediumMax) {
      setThresholdError('Low Risk Threshold must be strictly less than Medium Risk Threshold.');
      return;
    }

    try {
      await updateRiskThresholds(lowMax, mediumMax);
      setThresholdMessage('Risk classification thresholds updated successfully!');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setThresholdError(err.message || 'Failed to update risk thresholds');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-xs">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Data & Model Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">Upload custom CSV member datasets and configure risk classification parameters</p>
          </div>
        </div>
      </div>

      {/* CSV Dataset Upload Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Custom CSV Dataset</h3>
            <p className="text-xs text-slate-500">Automatically retrains XGBoost ML model on newly uploaded dataset</p>
          </div>
        </div>

        <form onSubmit={handleUploadCsv} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50">
            <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer text-xs font-bold text-blue-600 hover:text-blue-800 underline block"
            >
              {file ? file.name : 'Click to select CSV file from your computer'}
            </label>
            <span className="text-[11px] text-slate-400 mt-1 block">Supports member demographic, service, and cost CSV schemas</span>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Uploading & Retraining ML Model...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload & Retrain ML Pipeline
                </>
              )}
            </button>
          </div>
        </form>

        {uploadMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span>{uploadMessage}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Risk Classification Threshold Config */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <Database className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Configure Churn Risk Thresholds</h3>
            <p className="text-xs text-slate-500">Adjust probability boundaries for Low, Medium, and High risk classification</p>
          </div>
        </div>

        <form onSubmit={handleUpdateThresholds} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Low Risk Max Probability Cutoff (&lt; X)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.50"
                value={lowMax}
                onChange={(e) => setLowMax(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 0.30 (30%)</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Medium Risk Max Probability Cutoff (&lt;= X)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.30"
                max="0.95"
                value={mediumMax}
                onChange={(e) => setMediumMax(parseFloat(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 0.69 (69%). Values &gt; 0.69 become HIGH Risk.</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Update Risk Thresholds
            </button>
          </div>
        </form>

        {thresholdMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            <span>{thresholdMessage}</span>
          </div>
        )}

        {thresholdError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{thresholdError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
