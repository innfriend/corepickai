import React, { useState, useEffect, useRef } from 'react';
import { 
  Code2, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Square, 
  RotateCcw, 
  Server, 
  Activity, 
  Sliders, 
  Cpu, 
  Terminal, 
  Layers, 
  Zap, 
  Flame,
  CheckCircle2
} from 'lucide-react';
import { MODEL_CATALOG, HARDWARE_CATALOG } from '../data/mockData';

interface DeploymentExporterViewProps {
  onNavigate?: (view: string) => void;
}

export const DeploymentExporterView: React.FC<DeploymentExporterViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'exporter' | 'stream_sim'>('stream_sim');
  const [selectedModelId, setSelectedModelId] = useState<string>('llama-3-8b-instruct');
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>('nvidia-h100-sxm');
  const [selectedRuntime, setSelectedRuntime] = useState<'triton' | 'vllm' | 'tensorrt' | 'onnx' | 'qnn'>('triton');
  const [copied, setCopied] = useState(false);

  // Streaming Simulator State
  const [isSimulating, setIsSimulating] = useState(false);
  const [streamedTokens, setStreamedTokens] = useState<string[]>([]);
  const [concurrency, setConcurrency] = useState<number>(16);
  const [promptTokens, setPromptTokens] = useState<number>(512);
  const [outputTokens, setOutputTokens] = useState<number>(256);
  const [ttftMs, setTtftMs] = useState<number>(0);
  const [itlMs, setItlMs] = useState<number>(0);
  const [totalTokensGenerated, setTotalTokensGenerated] = useState<number>(0);
  const [kvCacheAllocatedMb, setKvCacheAllocatedMb] = useState<number>(0);

  const timerRef = useRef<any>(null);

  const currentModel = MODEL_CATALOG.find(m => m.id === selectedModelId) || MODEL_CATALOG[0];
  const currentHardware = HARDWARE_CATALOG.find(h => h.id === selectedHardwareId) || HARDWARE_CATALOG[0];

  // Sample tokens text stream
  const sampleResponse = "CorePick tensor compiler optimized this model graph by fusing 18 RotaryEmbedding kernels and quantizing SwiGLU FFN projections into INT4 AWQ. The resulting engine reduces peak KV-cache memory from 14.8 GB to 3.7 GB, allowing 8x higher concurrent batch saturation while maintaining sub-15ms inter-token latency SLAs across multi-GPU Hopper nodes.".split(" ");

  // Start Token Streaming Simulator
  const handleStartSimulation = () => {
    setIsSimulating(true);
    setStreamedTokens([]);
    setTotalTokensGenerated(0);

    const baseTtft = selectedHardwareId.includes('h100') ? 22 : selectedHardwareId.includes('4090') ? 48 : 95;
    const baseItl = selectedHardwareId.includes('h100') ? 7.2 : selectedHardwareId.includes('4090') ? 14.5 : 28.0;
    
    // Scale with concurrency
    const actualTtft = baseTtft * (1 + concurrency * 0.03);
    const actualItl = baseItl * (1 + concurrency * 0.015);

    setTtftMs(actualTtft);
    setItlMs(actualItl);
    setKvCacheAllocatedMb(concurrency * (promptTokens + outputTokens) * 0.008);

    let tokenIndex = 0;
    timerRef.current = setInterval(() => {
      if (tokenIndex < sampleResponse.length) {
        setStreamedTokens(prev => [...prev, sampleResponse[tokenIndex]]);
        setTotalTokensGenerated(prev => prev + concurrency);
        tokenIndex++;
      } else {
        clearInterval(timerRef.current);
        setIsSimulating(false);
      }
    }, actualItl * 4); // Scaled for visible UI animation
  };

  const handleStopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSimulating(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Code Templates
  const getDeploymentTemplates = () => {
    return {
      triton: {
        title: 'Triton Inference Server (config.pbtxt)',
        filename: 'config.pbtxt',
        code: `name: "${currentModel.slug}"
platform: "tensorrt_plan"
max_batch_size: 64

input [
  {
    name: "input_ids"
    data_type: TYPE_INT32
    dims: [ -1 ]
  },
  {
    name: "attention_mask"
    data_type: TYPE_INT32
    dims: [ -1 ]
  }
]

output [
  {
    name: "logits"
    data_type: TYPE_FP16
    dims: [ -1, 128256 ]
  }
]

dynamic_batching {
  max_queue_delay_microseconds: 5000
  preferred_batch_size: [ 8, 16, 32, 64 ]
}

instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [ 0 ]
  }
]

optimization {
  cuda {
    graphs: 1
    busy_wait_events: 1
  }
}`
      },
      vllm: {
        title: 'vLLM OpenAI-Compatible Server (docker-compose.yml)',
        filename: 'docker-compose.yml',
        code: `version: '3.8'

services:
  vllm-engine:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0,1
      - NCCL_DEBUG=INFO
    ports:
      - "8000:8000"
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    ipc: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    command: >
      --model meta-llama/Meta-Llama-3-8B-Instruct
      --tensor-parallel-size 2
      --gpu-memory-utilization 0.92
      --max-model-len 8192
      --kv-cache-dtype fp8
      --enforce-eager
      --port 8000`
      },
      tensorrt: {
        title: 'TensorRT-LLM High-Performance C++ Driver',
        filename: 'inference_driver.cpp',
        code: `#include <iostream>
#include <vector>
#include "NvInfer.h"
#include "tensorrt_llm/runtime/gptManager.h"

int main() {
    std::cout << "[CorePick] Initializing TensorRT-LLM Engine on ${currentHardware.name}..." << std::endl;
    
    // Load pre-compiled serialized TRT engine
    std::string enginePath = "./engines/${currentModel.slug}_${currentHardware.id}.engine";
    auto gptManager = std::make_unique<tensorrt_llm::runtime::GptManager>(
        enginePath,
        tensorrt_llm::runtime::TrtGptModelType::V1,
        /*maxBatchSize=*/64,
        /*maxNumTokens=*/8192
    );

    std::cout << "[CorePick] PagedAttention Memory Pool Allocated: ${currentHardware.memoryGb}GB HBM" << std::endl;
    std::cout << "[CorePick] Ready for low-latency batch requests." << std::endl;
    return 0;
}`
      },
      onnx: {
        title: 'ONNX Runtime IO-Binding Python Client',
        filename: 'client.py',
        code: `import onnxruntime as ort
import numpy as np

# Configure CUDA Execution Provider with IO Binding for Zero-Copy DMA
sess_options = ort.SessionOptions()
sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

providers = [
    ('CUDAExecutionProvider', {
        'device_id': 0,
        'arena_extend_strategy': 'kSameAsRequested',
        'gpu_mem_limit': 16 * 1024 * 1024 * 1024,
        'cudnn_conv_algo_search': 'HEURISTIC',
        'do_copy_in_default_stream': True,
    })
]

session = ort.InferenceSession("./model.onnx", sess_options, providers=providers)
io_binding = session.io_binding()

# Allocate pinned GPU buffers
print("[CorePick] ORT Engine Bound to GPU 0. Ready for inference.")`
      },
      qnn: {
        title: 'Qualcomm QNN Hexagon NPU Android C++ Client',
        filename: 'qnn_htp_inference.cpp',
        code: `#include "QnnSdk.h"
#include "HTP/QnnHtpGraph.h"

void RunQnnInference() {
    Qnn_ContextHandle_t context = nullptr;
    Qnn_GraphHandle_t graph = nullptr;
    
    // Set HTP performance mode to BURST for maximum TOPS
    QnnHtpGraph_CustomConfig_t htpConfig;
    htpConfig.option = QNN_HTP_GRAPH_CONFIG_OPTION_PRECISION;
    htpConfig.precision = QNN_PRECISION_INT8;

    std::cout << "[CorePick] Loaded QNN Model onto Hexagon NPU (HTP Burst Mode Enabled)" << std::endl;
}`
      }
    };
  };

  const currentTemplate = getDeploymentTemplates()[selectedRuntime];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentTemplate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">
                Production Deployment Engine
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Enterprise Ready</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              Production Exporter & Interactive Token Stream Simulator
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Export verified Triton, vLLM, and TensorRT runtime configurations, or simulate token generation speeds and KV-cache saturation live.
            </p>
          </div>

          {/* Model & Hardware Selection */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Target Model</label>
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                {MODEL_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-slate-400">Target Silicon</label>
              <select
                value={selectedHardwareId}
                onChange={(e) => setSelectedHardwareId(e.target.value)}
                className="bg-[#131B2E] border border-[#27354F] rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              >
                {HARDWARE_CATALOG.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
          <button
            onClick={() => setActiveTab('stream_sim')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stream_sim'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Interactive Token Streaming Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('exporter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'exporter'
                ? 'bg-cyan-500 text-[#07090E] shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] text-slate-400 hover:text-white border border-[#27354F]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Production Exporters (Triton / vLLM / Docker)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE TOKEN STREAMING SIMULATOR */}
      {activeTab === 'stream_sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sliders & Controls */}
          <div className="lg:col-span-5 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-5">
            <div className="pb-3 border-b border-[#1E293B]">
              <h3 className="text-lg font-bold font-mono text-white">Workload Concurrency & Context</h3>
              <p className="text-xs text-slate-400 mt-0.5">Test real-time TTFT and inter-token streaming latency under varying concurrency loads.</p>
            </div>

            {/* Concurrency Users */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Concurrent Client Streams:</span>
                <span className="text-cyan-400 font-bold">{concurrency} Parallel Requests</span>
              </div>
              <input
                type="range"
                min="1"
                max="128"
                step="1"
                value={concurrency}
                disabled={isSimulating}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Prompt Token Length */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Input Prompt Length:</span>
                <span className="text-white font-bold">{promptTokens} Tokens</span>
              </div>
              <input
                type="range"
                min="64"
                max="4096"
                step="64"
                value={promptTokens}
                disabled={isSimulating}
                onChange={(e) => setPromptTokens(Number(e.target.value))}
                className="w-full accent-emerald-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Output Generation Length */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Max Generation Tokens:</span>
                <span className="text-amber-400 font-bold">{outputTokens} Tokens</span>
              </div>
              <input
                type="range"
                min="32"
                max="1024"
                step="32"
                value={outputTokens}
                disabled={isSimulating}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                className="w-full accent-amber-400 bg-[#131B2E] cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {!isSimulating ? (
                <button
                  onClick={handleStartSimulation}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-black text-xs rounded-2xl shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Live Streaming Simulation</span>
                </button>
              ) : (
                <button
                  onClick={handleStopSimulation}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Simulation</span>
                </button>
              )}
            </div>

            {/* KV Cache Allocation Meter */}
            <div className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">PagedAttention KV-Cache:</span>
                <span className="text-cyan-300 font-bold">{(kvCacheAllocatedMb || 0).toFixed(1)} MB / {(currentHardware?.memoryGb || 16) * 1024} MB</span>
              </div>
              <div className="w-full bg-[#131B2E] h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, ((kvCacheAllocatedMb || 0) / Math.max(1, (currentHardware?.memoryGb || 16) * 1024)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Live Stream Viewer & Latency Telemetry */}
          <div className="lg:col-span-7 space-y-5">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Time To First Token (TTFT)</span>
                <span className="text-xl font-bold text-cyan-300 mt-1 block">
                  {ttftMs ? `${ttftMs.toFixed(1)} ms` : '--'}
                </span>
              </div>

              <div className="bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Inter-Token Latency (ITL)</span>
                <span className="text-xl font-bold text-emerald-300 mt-1 block">
                  {itlMs ? `${itlMs.toFixed(1)} ms` : '--'}
                </span>
              </div>

              <div className="bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Tokens / Sec / User</span>
                <span className="text-xl font-bold text-white mt-1 block">
                  {itlMs ? `${(1000 / itlMs).toFixed(1)} tok/s` : '--'}
                </span>
              </div>

              <div className="bg-[#0D1322] border border-[#1E293B] p-4 rounded-2xl">
                <span className="text-slate-400 block text-[10px]">Cluster Aggregate</span>
                <span className="text-xl font-bold text-amber-300 mt-1 block">
                  {itlMs ? `${((1000 / itlMs) * concurrency).toFixed(0)} tok/s` : '--'}
                </span>
              </div>
            </div>

            {/* Live Animated Stream Output Box */}
            <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-3 min-h-[300px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs font-mono font-bold text-white">Live Client Stream (Request #1 of {concurrency})</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Tokens Generated: {streamedTokens.length}</span>
                </div>

                <div className="mt-4 font-mono text-sm leading-relaxed text-slate-200 min-h-[160px] bg-[#07090E] p-4 rounded-2xl border border-[#1E293B]">
                  {streamedTokens.length > 0 ? (
                    <span>
                      {streamedTokens.join(" ")}
                      {isSimulating && <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />}
                    </span>
                  ) : (
                    <span className="text-slate-500 italic text-xs">
                      Click "Start Live Streaming Simulation" to measure time-to-first-token and streaming throughput across parallel client connections.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-slate-400 pt-3 border-t border-[#1E293B]">
                <span>Engine: vLLM PagedAttention v2</span>
                <span className="text-emerald-400 font-bold">Total Cluster Output: {totalTokensGenerated} Tokens</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION EXPORTERS */}
      {activeTab === 'exporter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Framework Picker */}
          <div className="lg:col-span-3 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-3">
            <span className="text-xs font-mono text-slate-400 block font-bold">Deployment Target:</span>
            {[
              { id: 'triton', label: 'Triton Server', sub: 'NVIDIA C++ Server' },
              { id: 'vllm', label: 'vLLM Docker', sub: 'OpenAI Proxy' },
              { id: 'tensorrt', label: 'TensorRT-LLM', sub: 'Native C++ Engine' },
              { id: 'onnx', label: 'ONNX Runtime', sub: 'IO Binding Python' },
              { id: 'qnn', label: 'Qualcomm QNN', sub: 'Hexagon NPU HTP' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedRuntime(t.id as any)}
                className={`w-full p-3 rounded-2xl text-left font-mono transition-all cursor-pointer border ${
                  selectedRuntime === t.id
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md'
                    : 'bg-[#131B2E] border-[#27354F] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{t.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-9 bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
              <div>
                <h3 className="text-sm font-bold font-mono text-white">{currentTemplate.title}</h3>
                <span className="text-xs font-mono text-slate-400">File: {currentTemplate.filename}</span>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2E] hover:bg-[#1E293B] text-cyan-300 text-xs font-mono font-bold rounded-xl border border-[#27354F] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="bg-[#07090E] p-4 rounded-2xl border border-[#1E293B] text-xs font-mono text-cyan-300 overflow-x-auto max-h-[460px] leading-relaxed">
              <code>{currentTemplate.code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
