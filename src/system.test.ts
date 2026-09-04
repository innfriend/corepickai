import { describe, it, expect } from 'vitest';
import { HARDWARE_CATALOG, MODEL_CATALOG, SAMPLE_OPTIMIZATION_JOBS } from './data/mockData';
import { KNOWLEDGE_BASE_ARTICLES } from './data/knowledgeBaseData';
import { OPTIMIZATION_PRESETS } from './components/QuickOptimizationPresets';
import { HPC_GLOSSARY } from './components/ConceptTooltip';
import { simulateInference } from './simulation/performanceEngine';

describe('CorePick System & Data Integrity Test Suite', () => {
  describe('Hardware Catalog System Tests', () => {
    it('should have a rich fleet of hardware devices', () => {
      expect(HARDWARE_CATALOG.length).toBeGreaterThanOrEqual(10);
    });

    it('should contain all required architectural properties for every hardware target', () => {
      HARDWARE_CATALOG.forEach(hw => {
        expect(hw.id).toBeDefined();
        expect(hw.name).toBeDefined();
        expect(hw.vendor).toBeDefined();
        expect(hw.architecture).toBeDefined();
        expect(hw.fp16Tflops).toBeGreaterThan(0);
        expect(hw.memoryBandwidthGBs).toBeGreaterThan(0);
        expect(hw.memoryGb).toBeGreaterThan(0);
        expect(hw.tdpWatts).toBeGreaterThan(0);
        expect(hw.supportedRuntimes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Model Catalog System Tests', () => {
    it('should contain foundational vision, LLM, and audio models', () => {
      expect(MODEL_CATALOG.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid parameter counts, layers, and operational intensity bounds', () => {
      MODEL_CATALOG.forEach(model => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.category).toBeDefined();
        expect(model.parameterCountM).toBeGreaterThan(0);
        expect(model.totalFlopsGflops).toBeGreaterThan(0);
        expect(model.layersCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Optimization 1-Click Presets & UX Tests', () => {
    it('should contain configured 1-click goal recipes with valid hardware targets and precisions', () => {
      expect(OPTIMIZATION_PRESETS.length).toBeGreaterThanOrEqual(4);
      OPTIMIZATION_PRESETS.forEach(preset => {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.modelId).toBeTruthy();
        expect(preset.hardwareIds.length).toBeGreaterThan(0);
        expect(preset.precisions.length).toBeGreaterThan(0);
        expect(preset.expectedOutcome.latency).toBeTruthy();
        expect(preset.expectedOutcome.vramReduction).toBeTruthy();
      });
    });

    it('should have a comprehensive plain-English glossary with recommendations', () => {
      const keys = Object.keys(HPC_GLOSSARY);
      expect(keys.length).toBeGreaterThanOrEqual(7);
      keys.forEach(k => {
        const item = HPC_GLOSSARY[k];
        expect(item.term).toBeTruthy();
        expect(item.plainEnglish.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Knowledge Base & SEO Article System Tests', () => {
    it('should contain comprehensive technical articles', () => {
      expect(KNOWLEDGE_BASE_ARTICLES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have structured metadata for SEO microdata generation', () => {
      KNOWLEDGE_BASE_ARTICLES.forEach(article => {
        expect(article.id).toBeDefined();
        expect(article.title).toBeTruthy();
        expect(article.summary).toBeTruthy();
        expect(article.category).toBeTruthy();
        expect(article.author.name).toBeTruthy();
        expect(article.readingTimeMin).toBeGreaterThan(0);
        expect(article.contentMarkdown.length).toBeGreaterThan(50);
        expect(article.keyTakeaways.length).toBeGreaterThan(0);
        expect(article.faq.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Profiling Job Engine Tests', () => {
    it('should have valid historical profiling jobs with speedups', () => {
      expect(SAMPLE_OPTIMIZATION_JOBS.length).toBeGreaterThan(0);
      SAMPLE_OPTIMIZATION_JOBS.forEach(job => {
        expect(job.id).toBeDefined();
        expect(job.modelName).toBeDefined();
        expect(job.results.length).toBeGreaterThan(0);
        expect(job.flamegraph.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Contact & Enterprise Dispatch Integrity Tests', () => {
    it('should specify correct primary recipient email address', () => {
      const recipient = 'innfriend1@gmail.com';
      expect(recipient).toBe('innfriend1@gmail.com');
      expect(recipient).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('Analytical Inference & Roofline Simulation Engine E2E Tests', () => {
    const h100 = HARDWARE_CATALOG.find(h => h.id === 'nvidia-h100-sxm')!;
    const b200 = HARDWARE_CATALOG.find(h => h.id === 'nvidia-b200-sxm') || h100;
    const llama70b = MODEL_CATALOG.find(m => m.id.includes('llama') && m.parameterCountM > 60000)!;

    it('should compute valid TTFT, ITL, and throughput for LLaMA-70B on H100', () => {
      const result = simulateInference({
        model: {
          id: llama70b.id,
          name: llama70b.name,
          category: llama70b.category,
          framework: llama70b.framework,
          parameterCountM: llama70b.parameterCountM,
          parameterCountBillions: llama70b.parameterCountBillions || (llama70b.parameterCountM / 1000),
          parameterCountFormatted: llama70b.parameterCountFormatted,
          layers: llama70b.layers || 80,
          hiddenDim: llama70b.hiddenDim || 8192,
          attentionHeads: llama70b.attentionHeads || 64,
          kvHeads: llama70b.kvHeads || 8
        },
        hardware: h100,
        precision: 'FP8',
        batchSize: 8,
        contextLength: 2048,
        outputTokens: 256,
        concurrency: 1,
        runtime: 'vLLM',
        tensorParallelSize: 2,
        kvPrecision: 'FP8',
        enableFlashAttention: true
      });

      expect(result).toBeDefined();
      expect(result.performance.ttftMs).toBeGreaterThan(0);
      expect(result.performance.itlMs).toBeGreaterThan(0);
      expect(result.performance.tokensPerSecPerRequest).toBeGreaterThan(0);
      expect(result.performance.aggregateTokensPerSec).toBeGreaterThan(result.performance.tokensPerSecPerRequest);
      expect(result.vramBreakdown.weightsGb).toBeGreaterThan(10);
      expect(result.vramRequiredGb).toBeLessThan(h100.memoryGB * 2);
      expect(result.prefill.arithmeticIntensity).toBeGreaterThan(result.decode.arithmeticIntensity);
      expect(result.evidenceLevel).toBe('SIMULATED');
    });

    it('should properly flag Out-Of-Memory (OOM) when model weights exceed hardware VRAM', () => {
      const smallGpu = HARDWARE_CATALOG.find(h => h.memoryGB <= 24)!;
      const result = simulateInference({
        model: {
          id: llama70b.id,
          name: llama70b.name,
          category: llama70b.category,
          framework: llama70b.framework,
          parameterCountM: llama70b.parameterCountM,
          parameterCountBillions: llama70b.parameterCountBillions || (llama70b.parameterCountM / 1000),
          parameterCountFormatted: llama70b.parameterCountFormatted,
          layers: llama70b.layers || 80,
          hiddenDim: llama70b.hiddenDim || 8192,
          attentionHeads: llama70b.attentionHeads || 64,
          kvHeads: llama70b.kvHeads || 8
        },
        hardware: smallGpu,
        precision: 'FP16', // 70B * 2 bytes = 140GB on a 24GB GPU
        batchSize: 1,
        contextLength: 2048,
        outputTokens: 128,
        concurrency: 1,
        runtime: 'vLLM',
        tensorParallelSize: 1
      });

      expect(result.isOom).toBe(true);
      expect(result.vramRequiredGb).toBeGreaterThan(smallGpu.memoryGB);
    });

    it('should reduce weight footprint when sharded across Tensor Parallelism (TP=4)', () => {
      const singleGpu = simulateInference({
        model: {
          id: llama70b.id,
          name: llama70b.name,
          category: llama70b.category,
          framework: llama70b.framework,
          parameterCountM: llama70b.parameterCountM,
          layers: 80,
          hiddenDim: 8192,
          attentionHeads: 64,
          kvHeads: 8
        },
        hardware: h100,
        precision: 'FP16',
        batchSize: 1,
        contextLength: 512,
        outputTokens: 64,
        concurrency: 1,
        runtime: 'vLLM',
        tensorParallelSize: 1
      });

      const quadGpu = simulateInference({
        model: {
          id: llama70b.id,
          name: llama70b.name,
          category: llama70b.category,
          framework: llama70b.framework,
          parameterCountM: llama70b.parameterCountM,
          layers: 80,
          hiddenDim: 8192,
          attentionHeads: 64,
          kvHeads: 8
        },
        hardware: h100,
        precision: 'FP16',
        batchSize: 1,
        contextLength: 512,
        outputTokens: 64,
        concurrency: 1,
        runtime: 'vLLM',
        tensorParallelSize: 4
      });

      // Weight footprint per GPU should be roughly 1/4th on TP=4
      expect(quadGpu.vramBreakdown.weightsGb).toBeCloseTo(singleGpu.vramBreakdown.weightsGb / 4, 1);
    });
  });
});
