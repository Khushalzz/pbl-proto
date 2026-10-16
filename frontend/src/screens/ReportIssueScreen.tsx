import React, { useState } from 'react';
import {
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  Upload,
  CheckCircle2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { DuplicateWarningModal } from '../components/DuplicateWarningModal';
import { issuesApi } from '../services/api';
import { Issue, User } from '../types';

interface ReportIssueScreenProps {
  currentUser: User | null;
  onSuccess: (issueId: string) => void;
  onCancel: () => void;
  onRequireLogin: () => void;
}

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({
  currentUser,
  onSuccess,
  onCancel,
  onRequireLogin,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [locationPos, setLocationPos] = useState<[number, number]>([18.5175, 73.8152]); // Pune default
  const [address, setAddress] = useState('Paud Road, near MIT WPU Gate, Kothrud, Pune');
  const [ward, setWard] = useState('Kothrud Ward 12');
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [visionSuggestion, setVisionSuggestion] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate detection modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [matchedIssue, setMatchedIssue] = useState<Issue | null>(null);
  const [dupConfidence, setDupConfidence] = useState(0);
  const [dupRationale, setDupRationale] = useState('');

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingImage(true);
      setError(null);
      const res = await issuesApi.uploadImage(file);
      setImageUrls((prev) => [...prev, res.image_url]);
      if (res.vision_assessment && res.vision_assessment.detected_category) {
        setVisionSuggestion(res.vision_assessment);
        if (res.vision_assessment.detected_category !== 'Other') {
          setCategory(res.vision_assessment.detected_category);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const executeIssueCreation = async () => {
    try {
      setLoading(true);
      setError(null);
      const newIssue = await issuesApi.create({
        title,
        description,
        category,
        location: {
          latitude: locationPos[0],
          longitude: locationPos[1],
          address,
          ward,
        },
        image_urls: imageUrls,
      });
      onSuccess(newIssue._id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit civic issue report.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setError(null);

    // Run AI duplicate pre-check (SRS 4.3)
    try {
      setLoading(true);
      const dupCheck = await issuesApi.checkDuplicate({
        title,
        description,
        category,
        latitude: locationPos[0],
        longitude: locationPos[1],
      });

      if (dupCheck.is_duplicate && dupCheck.matched_issue) {
        setMatchedIssue(dupCheck.matched_issue);
        setDupConfidence(dupCheck.confidence);
        setDupRationale(dupCheck.rationale);
        setDuplicateModalOpen(true);
        setLoading(false);
        return;
      }

      // No duplicate detected, proceed with creation
      await executeIssueCreation();
    } catch (err: any) {
      console.error('Duplicate precheck failed, proceeding with submit', err);
      await executeIssueCreation();
    }
  };

  const handleSupportExisting = async (existing: Issue) => {
    try {
      setLoading(true);
      await issuesApi.verify(existing._id, 'Citizen upvoted via duplicate check resolution.');
      setDuplicateModalOpen(false);
      onSuccess(existing._id);
    } catch (err: any) {
      setError(err.message || 'Failed to support existing report.');
      setDuplicateModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedDuplicateAnyway = async () => {
    setDuplicateModalOpen(false);
    await executeIssueCreation();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        matchedIssue={matchedIssue}
        confidence={dupConfidence}
        rationale={dupRationale}
        onSupportExisting={handleSupportExisting}
        onProceedAnyway={handleProceedDuplicateAnyway}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">
          SRS Feature 4.2: Civic Issue Reporting
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Report a Civic Problem</h1>
          <p className="text-xs text-slate-500 mt-1">
            Provide details, photos, and exact pin location. CivicLens AI checks for duplicates and routes to the right municipal department.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Issue Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                'Pothole',
                'Garbage Accumulation',
                'Water Leakage',
                'Damaged Streetlight',
                'Drainage Problem',
                'Traffic Signal Failure',
              ].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-2xl text-xs font-bold border transition text-left cursor-pointer ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Report Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole causing skidding near bus stop"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the severity, exact landmark, and any immediate hazard..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
            </div>
          </div>

          {/* Interactive Map Location Selection (FR-008, UI-003) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                Select Exact Location on Map *
              </label>
              <span className="text-xs text-slate-400">
                Coordinates: {locationPos[0].toFixed(4)}, {locationPos[1].toFixed(4)}
              </span>
            </div>

            <LeafletMap
              pickerMode={true}
              center={locationPos}
              selectedPos={locationPos}
              onPositionSelect={(pos) => setLocationPos(pos)}
              height="280px"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Landmark description"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Municipal Ward</label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="Ward Name or Number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Photo Evidence Upload (FR-007, UI-004) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Upload Photo Evidence (JPEG, PNG, WebP)
            </label>

            <div className="flex flex-wrap gap-3 items-center">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-xs group">
                  <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-xs cursor-pointer hover:bg-red-700 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition cursor-pointer">
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Add Photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                />
              </label>

              {uploadingImage && (
                <div className="text-xs text-blue-600 font-semibold flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  Processing & uploading photo...
                </div>
              )}
            </div>

            {visionSuggestion && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <strong>Gemini AI Vision:</strong> Detected {visionSuggestion.detected_category} (Severity: {visionSuggestion.damage_severity}). Category auto-adjusted!
                </div>
              </div>
            )}
          </div>

          {/* AI Duplicate & Prioritization Notice */}
          <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-800">CivicLens Intelligent Decision-Support Engine</div>
              <p className="mt-0.5 text-slate-600">
                Upon submission, AI will analyze nearby complaints to alert you of duplicates and calculate priority score based on severity and traffic impact.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Analyzing & Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Civic Issue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
