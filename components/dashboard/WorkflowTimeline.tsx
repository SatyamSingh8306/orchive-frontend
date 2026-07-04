'use client';

import { useState, useEffect } from 'react';
import { WorkflowRun, StepDetail } from '@/types/dashboard';

interface WorkflowTimelineProps {
  run: WorkflowRun;
  onClose: () => void;
}

export default function WorkflowTimeline({ run, onClose }: WorkflowTimelineProps) {
  const [steps, setSteps] = useState<StepDetail[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStepDetails();
  }, [run.run_id]);

  const fetchStepDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/dashboard/runs/${run.run_id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch step details');
      }
      const data = await response.json();
      setSteps(data.steps || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch step details:', err);
      setError('Failed to load step details');
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (stepType: string, status: string) => {
    const baseClasses = "w-4 h-4 flex-shrink-0";
    
    if (status === 'error') {
      return (
        <svg className={`${baseClasses} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }

    if (status === 'completed') {
      return (
        <svg className={`${baseClasses} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }

    switch (stepType) {
      case 'workflow':
        return (
          <svg className={`${baseClasses} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'agent':
        return (
          <svg className={`${baseClasses} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'tool':
        return (
          <svg className={`${baseClasses} text-orange-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31-2.37-2.37a1.724 1.724 0 00-2.572-1.065z" />
          </svg>
        );
      default:
        return (
          <svg className={`${baseClasses} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const renderStep = (step: StepDetail, level: number = 0) => {
    const isExpanded = expandedSteps.has(step.step_id);
    const hasChildren = step.children && step.children.length > 0;

    return (
      <div key={step.step_id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div className="flex items-start space-x-3 py-3">
          <div className="flex-shrink-0 mt-1">
            {getStepIcon(step.step_type, step.status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900">{step.name}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  step.step_type === 'workflow' ? 'bg-blue-100 text-blue-800' :
                  step.step_type === 'agent' ? 'bg-purple-100 text-purple-800' :
                  step.step_type === 'tool' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {step.step_type}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{formatDate(step.start_time)}</span>
                {step.duration_ms && (
                  <span className="font-medium">{formatDuration(step.duration_ms)}</span>
                )}
                {hasChildren && (
                  <button
                    onClick={() => toggleStep(step.step_id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                )}
              </div>
            </div>

            {step.input && (
              <details className="mt-2">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 font-medium">
                  📥 Input Message
                </summary>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {typeof step.input === 'string' ? step.input : JSON.stringify(step.input, null, 2)}
                  </pre>
                </div>
              </details>
            )}

            {step.output && (
              <details className="mt-2">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 font-medium">
                  📤 Output Message
                </summary>
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
                  </pre>
                </div>
              </details>
            )}

            {step.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">❌ Error:</p>
                <pre className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{step.error}</pre>
              </div>
            )}

            {isExpanded && hasChildren && (
              <div className="mt-3 space-y-2">
                {step.children.map((child) => renderStep(child, level + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Execution Timeline: {run.workflow_name}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Run ID: {run.run_id} • Started: {new Date(run.started_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm">Loading step details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">Error Loading Timeline</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              onClick={fetchStepDetails}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium">No Step Details Available</p>
            <p className="text-sm mt-2">This workflow run doesn't have detailed step information yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step) => renderStep(step))}
          </div>
        )}
      </div>
    </div>
  );
}
