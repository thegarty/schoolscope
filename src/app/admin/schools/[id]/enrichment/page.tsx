'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { ArrowLeft, Bot, Check, Clock3, Link2, Pause, Play, RefreshCcw, Search, Trash2, X } from 'lucide-react';

type EnrichmentSource = {
  id: string;
  label: string;
  url: string;
  sourceType: 'SCHOOL_WEBSITE' | 'EDUCATION_DEPARTMENT' | 'GOVERNMENT_DIRECTORY' | 'OTHER_OFFICIAL';
  isActive: boolean;
  lastSuccessAt?: string | null;
  lastError?: string | null;
};

type Proposal = {
  id: string;
  proposalType: 'FIELD' | 'ABOUT' | 'EVENT';
  targetField?: string | null;
  existingValue?: string | null;
  proposedValue: unknown;
  confidence: number;
  sourceUrl: string;
  evidenceSnippet?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED';
  createdAt: string;
};

export default function SchoolEnrichmentPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [runningNow, setRunningNow] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryMessage, setDiscoveryMessage] = useState<string | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [discoveryRuns, setDiscoveryRuns] = useState<any[]>([]);
  const [sources, setSources] = useState<EnrichmentSource[]>([]);
  const [newSource, setNewSource] = useState<{
    label: string;
    url: string;
    sourceType: EnrichmentSource['sourceType'];
  }>({ label: '', url: '', sourceType: 'SCHOOL_WEBSITE' });
  const [config, setConfig] = useState({
    enrichmentEnabled: false,
    enrichmentPaused: false,
    enrichmentPilot: false,
    enrichmentFrequencyHours: 168,
  });
  const router = useRouter();
  const params = useParams();
  const schoolId = params.id as string;

  const loadAll = useCallback(async () => {
    const [configRes, proposalsRes, runsRes, discoveryRunsRes] = await Promise.all([
      fetch(`/api/admin/schools/${schoolId}/enrichment`),
      fetch(`/api/admin/schools/${schoolId}/enrichment/proposals?status=PENDING&limit=50`),
      fetch(`/api/admin/schools/${schoolId}/enrichment/runs?limit=10`),
      fetch(`/api/admin/schools/${schoolId}/enrichment/discovery-runs?limit=10`),
    ]);

    if (!configRes.ok) {
      throw new Error('Failed to load enrichment configuration.');
    }

    const configData = await configRes.json();
    setSchool(configData.school);
    setSources(configData.school.schoolSources ?? []);
    setConfig({
      enrichmentEnabled: configData.school.enrichmentEnabled,
      enrichmentPaused: configData.school.enrichmentPaused,
      enrichmentPilot: configData.school.enrichmentPilot,
      enrichmentFrequencyHours: configData.school.enrichmentFrequencyHours,
    });

    if (proposalsRes.ok) {
      const proposalData = await proposalsRes.json();
      setProposals(proposalData.proposals ?? []);
    }
    if (runsRes.ok) {
      const runsData = await runsRes.json();
      setRuns(runsData.runs ?? []);
    }
    if (discoveryRunsRes.ok) {
      const discoveryRunsData = await discoveryRunsRes.json();
      setDiscoveryRuns(discoveryRunsData.runs ?? []);
    }
  }, [schoolId]);

  useEffect(() => {
    const run = async () => {
      try {
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          router.push('/login');
          return;
        }
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
        await loadAll();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadAll, router]);

  const runEnrichmentNow = async () => {
    setRunningNow(true);
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}/enrichment/run`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to run enrichment.');
      }
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Failed to run enrichment.');
    } finally {
      setRunningNow(false);
    }
  };

  const discoverSources = async () => {
    setDiscovering(true);
    setDiscoveryMessage(null);
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}/enrichment/discover-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persist: true }),
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : null;
      const textBody = isJson ? '' : (await response.text()).slice(0, 240);

      if (!response.ok) {
        if (data?.error) {
          setDiscoveryMessage(data.error);
        } else {
          setDiscoveryMessage(
            `Auto-discovery failed (${response.status}).` +
            (textBody ? ` Response: ${textBody}` : ' If this keeps happening, restart dev server and try again.')
          );
        }
      } else {
        setDiscoveryMessage(
          `Discovery complete. Gemini hits: ${data.geminiHits || 0}. Candidate URLs scanned: ${data.candidateCount || 0}. ` +
          `Official candidates: ${data.officialCandidateCount || 0}. Official matches: ${data.discovered?.length || 0}. Added: ${data.addedCount || 0}.` +
          ((data.officialCandidateCount || 0) === 0 && (data.candidateHosts?.length || 0) > 0
            ? ` Candidate hosts: ${data.candidateHosts.join(', ')}.`
            : '') +
          ((data.officialCandidateCount || 0) === 0 && data.rejectedReasonCounts
            ? ` Rejection reasons: ${Object.entries(data.rejectedReasonCounts)
              .map(([reason, count]) => `${reason}=${count}`)
              .join(', ')}.`
            : '') +
          ((data.officialCandidateCount || 0) === 0 && (data.rejectedCandidates?.length || 0) > 0
            ? ` Sample rejected: ${data.rejectedCandidates
              .slice(0, 3)
              .map((item: { host: string; reason: string }) => `${item.host}(${item.reason})`)
              .join(', ')}.`
            : '') +
          (data.geminiError ? ` Gemini issue: ${data.geminiError}` : '')
        );
        await loadAll();
      }
    } catch (error) {
      console.error(error);
      setDiscoveryMessage('Failed to discover sources.');
    } finally {
      setDiscovering(false);
    }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}/enrichment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to save settings.');
      } else {
        await loadAll();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to save settings.');
    } finally {
      setConfigSaving(false);
    }
  };

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}/enrichment/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to add source.');
      } else {
        setNewSource({ label: '', url: '', sourceType: 'SCHOOL_WEBSITE' });
        await loadAll();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to add source.');
    }
  };

  const toggleSource = async (source: EnrichmentSource) => {
    try {
      await fetch(`/api/admin/schools/${schoolId}/enrichment/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !source.isActive }),
      });
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Failed to update source state.');
    }
  };

  const deleteSource = async (source: EnrichmentSource) => {
    if (!confirm(`Delete source "${source.label}"?`)) return;
    try {
      const response = await fetch(`/api/admin/schools/${schoolId}/enrichment/sources/${source.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || 'Failed to delete source.');
        return;
      }
      await loadAll();
    } catch (error) {
      console.error(error);
      alert('Failed to delete source.');
    }
  };

  const reviewProposal = async (proposalId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(
        `/api/admin/schools/${schoolId}/enrichment/proposals/${proposalId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || `Failed to ${status.toLowerCase()} proposal.`);
      } else {
        await loadAll();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to process proposal.');
    }
  };

  if (loading) {
    return (
      <AdminLayout user={currentUser}>
        <div className="p-6 text-gray-600">Loading enrichment controls...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={currentUser}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Bot className="h-6 w-6 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Enrichment</h1>
              <p className="text-sm text-gray-500">{school?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discoverSources}
              disabled={discovering}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-70 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {discovering ? 'Discovering...' : 'Auto-Discover URLs'}
            </button>
            <button
              onClick={runEnrichmentNow}
              disabled={runningNow}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-70 flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              {runningNow ? 'Running...' : 'Run Now'}
            </button>
          </div>
        </div>
        {discoveryMessage && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-md px-4 py-3 text-sm">
            {discoveryMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Automation Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between border rounded-md p-3">
              <span className="text-sm text-gray-700">Enable enrichment</span>
              <input
                type="checkbox"
                checked={config.enrichmentEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, enrichmentEnabled: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between border rounded-md p-3">
              <span className="text-sm text-gray-700">Pause enrichment</span>
              <input
                type="checkbox"
                checked={config.enrichmentPaused}
                onChange={(e) => setConfig((prev) => ({ ...prev, enrichmentPaused: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between border rounded-md p-3">
              <span className="text-sm text-gray-700">Pilot school</span>
              <input
                type="checkbox"
                checked={config.enrichmentPilot}
                onChange={(e) => setConfig((prev) => ({ ...prev, enrichmentPilot: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between border rounded-md p-3">
              <span className="text-sm text-gray-700">Frequency (hours)</span>
              <input
                type="number"
                min={1}
                className="w-24 px-2 py-1 border rounded"
                value={config.enrichmentFrequencyHours}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    enrichmentFrequencyHours: Number(e.target.value || 1),
                  }))
                }
              />
            </label>
          </div>
          <button
            onClick={saveConfig}
            disabled={configSaving}
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-70"
          >
            {configSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Official Sources</h2>
          <form onSubmit={addSource} className="grid md:grid-cols-4 gap-3 mb-4">
            <input
              className="px-3 py-2 border rounded-md"
              placeholder="Source label"
              value={newSource.label}
              onChange={(e) => setNewSource((prev) => ({ ...prev, label: e.target.value }))}
              required
            />
            <input
              className="px-3 py-2 border rounded-md md:col-span-2"
              placeholder="https://..."
              value={newSource.url}
              onChange={(e) => setNewSource((prev) => ({ ...prev, url: e.target.value }))}
              required
            />
            <select
              className="px-3 py-2 border rounded-md"
              value={newSource.sourceType}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, sourceType: e.target.value as EnrichmentSource['sourceType'] }))
              }
            >
              <option value="SCHOOL_WEBSITE">School Website</option>
              <option value="EDUCATION_DEPARTMENT">Education Department</option>
              <option value="GOVERNMENT_DIRECTORY">Government Directory</option>
              <option value="OTHER_OFFICIAL">Other Official</option>
            </select>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 md:col-span-4">
              Add Official Source
            </button>
          </form>

          <div className="space-y-3">
            {sources.map((source) => (
              <div key={source.id} className="border rounded-md p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{source.label}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:text-blue-900 hover:underline break-all"
                    >
                      {source.url}
                    </a>
                  </div>
                  {source.lastError ? (
                    <div className="text-xs text-red-600">Last error: {source.lastError}</div>
                  ) : (
                    <div className="text-xs text-green-700">
                      Last success: {source.lastSuccessAt ? new Date(source.lastSuccessAt).toLocaleString() : 'Not yet'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSource(source)}
                    className={`px-3 py-1 rounded-md text-white ${source.isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {source.isActive ? (
                      <span className="flex items-center gap-1"><Pause className="h-3 w-3" /> Pause</span>
                    ) : (
                      <span className="flex items-center gap-1"><Play className="h-3 w-3" /> Activate</span>
                    )}
                  </button>
                  <button
                    onClick={() => deleteSource(source)}
                    className="px-3 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {sources.length === 0 && <p className="text-sm text-gray-500">No sources configured yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Proposals ({proposals.length})</h2>
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="border rounded-md p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {proposal.proposalType}
                      {proposal.targetField ? ` • ${proposal.targetField}` : ''}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Source: {proposal.sourceUrl} • Confidence: {(proposal.confidence * 100).toFixed(0)}% •
                      <Clock3 className="h-3 w-3 inline mx-1" />
                      {new Date(proposal.createdAt).toLocaleString()}
                    </p>
                    {proposal.existingValue && (
                      <p className="text-xs text-red-600 mt-2">Current: {proposal.existingValue}</p>
                    )}
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-2 bg-gray-50 p-2 rounded">
                      {typeof proposal.proposedValue === 'string'
                        ? proposal.proposedValue
                        : JSON.stringify(proposal.proposedValue, null, 2)}
                    </pre>
                    {proposal.evidenceSnippet && (
                      <p className="text-xs text-gray-600 mt-2">Evidence: {proposal.evidenceSnippet}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => reviewProposal(proposal.id, 'APPROVED')}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </button>
                    <button
                      onClick={() => reviewProposal(proposal.id, 'REJECTED')}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {proposals.length === 0 && <p className="text-sm text-gray-500">No pending proposals.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrichment Runs</h2>
          <div className="space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="border rounded-md p-3 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {run.triggerType} • {run.status}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(run.createdAt).toLocaleString()} • Sources: {run.processedSources}/{run.totalSources} •
                    Proposals: {run.proposalsCreated}
                  </p>
                  {run.errorMessage && <p className="text-xs text-red-600 mt-1">{run.errorMessage}</p>}
                </div>
              </div>
            ))}
            {runs.length === 0 && <p className="text-sm text-gray-500">No run history yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Discovery Runs</h2>
          <div className="space-y-2">
            {discoveryRuns.map((run) => (
              <div key={run.id} className="border rounded-md p-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {run.provider} • {run.status}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(run.createdAt).toLocaleString()} • Queries: {run.queryCount} • Hits: {run.geminiHits} •
                    Candidates: {run.candidateCount} • Official: {run.officialCandidateCount} • Added: {run.addedCount}
                  </p>
                  {run.errorMessage && <p className="text-xs text-red-600 mt-1">{run.errorMessage}</p>}
                </div>
              </div>
            ))}
            {discoveryRuns.length === 0 && <p className="text-sm text-gray-500">No discovery history yet.</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
