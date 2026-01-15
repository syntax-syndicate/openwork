'use client';

import { useState } from 'react';
import type { ModelType } from './types';

interface ChooseModelTypeProps {
  onSelect: (type: ModelType) => void;
  currentModel?: { provider: string; model: string } | null;
}

export default function ChooseModelType({ onSelect, currentModel }: ChooseModelTypeProps) {
  const [selectedTab, setSelectedTab] = useState<'cloud' | 'local'>('cloud');

  const handleContinue = () => {
    onSelect(selectedTab);
  };

  return (
    <div className="space-y-4">
      {currentModel && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current Model</div>
          <div className="text-sm font-medium text-foreground">{currentModel.model}</div>
        </div>
      )}
      <h2 className="text-lg font-medium text-foreground">Model</h2>

      {/* Tab buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSelectedTab('cloud')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedTab === 'cloud'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Cloud Providers
        </button>
        <button
          type="button"
          onClick={() => setSelectedTab('local')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedTab === 'local'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Local Models
        </button>
      </div>

      {/* Tab content */}
      <div className="text-sm text-muted-foreground">
        {selectedTab === 'cloud' ? (
          <p>Select a cloud AI model. Requires an API key for the provider.</p>
        ) : (
          <p>Use Ollama to run AI models locally on your machine.</p>
        )}
      </div>

      {/* Continue button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
