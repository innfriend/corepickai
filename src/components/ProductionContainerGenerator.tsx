import React, { useState, useMemo } from 'react';
import { 
  Server, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Sliders, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  Box, 
  Play, 
  ExternalLink,
  Sparkles,
  FileCode2,
  Settings
} from 'lucide-react';
import { OptimizationJob, ModelArchitecture } from '../types';
import { MODEL_CATALOG } from '../data/mockData';

export type ServingEngine = 'vLLM' | 'TensorRT-LLM' | 'TGI' | 'ONNX Runtime' | 'Apple MLX' | 'Qualcomm QNN';

interface ProductionContainerGeneratorProps {
  job?: OptimizationJob;
  initialModelId?: string;
  onNavigate?: (view: string) => void;
}

export const ProductionContainerGenerator: React.FC<ProductionContainerGeneratorProps> = ({
  job,
  initialModelId,
  onNavigate,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    initialModelId || job?.modelId || MODEL_CATALOG[0].id
  );
  const [servingEngine, setServingEngine] = useState<ServingEngine>('vLLM');
  const [tensorParallelism, setTensorParallelism] = useState<number>(1);
  const [maxModelLen, setMaxModelLen] = useState<number>(8192);
  const [gpuMemoryUtilization, setGpuMemoryUtilization] = useState<number>(0.90);
  const [precision, setPrecision] = useState<'FP16' | 'AWQ_INT4' | 'FP8' | 'INT8'>('AWQ_INT4');
  const [port, setPort] = useState<number>(8000);
  const [enableHealthProbe, setEnableHealthProbe] = useState<boolean>(true);
  const [activeFileTab, setActiveFileTab] = useState<'dockerfile' | 'compose' | 'k8s' | 'helm' | 'python' | 'curl'>('dockerfile');
  const [copied, setCopied] = useState<boolean>(false);

  const selectedModel = useMemo(() => {
    return MODEL_CATALOG.find((m) => m.id === selectedModelId) || MODEL_CATALOG[0];
  }, [selectedModelId]);

  // Model HuggingFace identifier
  const hfModelRepo = useMemo(() => {
    if (selectedModel.id.includes('llama-3-8b')) return 'meta-llama/Meta-Llama-3-8B-Instruct';
    if (selectedModel.id.includes('mistral')) return 'mistralai/Mistral-7B-Instruct-v0.3';
    if (selectedModel.id.includes('qwen')) return 'Qwen/Qwen2.5-7B-Instruct';
    if (selectedModel.id.includes('yolo')) return 'ultralytics/yolov8x';
    return `models/${selectedModel.slug}`;
  }, [selectedModel]);

  // Generated Artifacts Code Generator
  const generatedCode = useMemo(() => {
    // 1. Dockerfile
    let dockerfile = '';
    if (servingEngine === 'vLLM') {
      dockerfile = `# Multi-Stage Production vLLM Inference Container
# Optimized for: ${selectedModel.name} (${precision})
FROM vllm/vllm-openai:v0.6.3.post1

LABEL maintainer="CorePick AI Infrastructure <ops@corepick.ai>"
LABEL model="${selectedModel.name}"
LABEL precision="${precision}"

ENV PYTHONUNBUFFERED=1 \\
    HUGGING_FACE_HUB_TOKEN="" \\
    MODEL_NAME="${hfModelRepo}" \\
    TENSOR_PARALLEL_SIZE=${tensorParallelism} \\
    MAX_MODEL_LEN=${maxModelLen} \\
    GPU_MEMORY_UTILIZATION=${gpuMemoryUtilization} \\
    PORT=${port}

EXPOSE ${port}

HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=3 \\
    CMD curl -f http://localhost:${port}/health || exit 1

ENTRYPOINT ["python3", "-m", "vllm.entrypoints.openai.api_server"]
CMD ["--model", "${hfModelRepo}", \\
     "--tensor-parallel-size", "${tensorParallelism}", \\
     "--max-model-len", "${maxModelLen}", \\
     "--gpu-memory-utilization", "${gpuMemoryUtilization}", \\
     "--quantization", "${precision === 'AWQ_INT4' ? 'awq' : precision === 'FP8' ? 'fp8' : 'none'}", \\
     "--trust-remote-code", \\
     "--port", "${port}", \\
     "--host", "0.0.0.0"]`;
    } else if (servingEngine === 'TensorRT-LLM') {
      dockerfile = `# Production NVIDIA TensorRT-LLM with Triton Server
FROM nvcr.io/nvidia/tritonserver:24.08-trtllm-py3

LABEL model="${selectedModel.name}"
ENV TRITON_SERVER_PORT=${port} \\
    CUDA_VISIBLE_DEVICES=0

WORKDIR /opt/tritonserver
COPY ./model_repository /models

EXPOSE ${port} 8001 8002

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s \\
    CMD curl -f http://localhost:${port}/v2/health/ready || exit 1

CMD ["tritonserver", "--model-repository=/models", "--http-port=${port}"]`;
    } else if (servingEngine === 'Apple MLX') {
      dockerfile = `# Apple Silicon MLX Local Microservice
FROM python:3.11-slim

WORKDIR /app
RUN pip install --no-cache-dir mlx-lm fastapi uvicorn

COPY app.py /app/app.py
EXPOSE ${port}

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "${port}"]`;
    } else {
      dockerfile = `# ONNX Runtime Server Container
FROM mcr.microsoft.com/azureml/onnxruntime:latest-cuda

WORKDIR /app
COPY ./model.onnx /app/model.onnx
COPY ./server.py /app/server.py
RUN pip install --no-cache-dir fastapi uvicorn onnxruntime-gpu

EXPOSE ${port}
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "${port}"]`;
    }

    // 2. docker-compose.yml
    const compose = `version: '3.8'

services:
  ${selectedModel.slug}-inference:
    image: corepick/${selectedModel.slug}-${servingEngine.toLowerCase().replace(/[^a-z0-9]/g, '-')}:${precision.toLowerCase()}
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${selectedModel.slug}-serving
    restart: unless-stopped
    ports:
      - "${port}:${port}"
    environment:
      - HUGGING_FACE_HUB_TOKEN=\${HF_TOKEN}
      - CUDA_VISIBLE_DEVICES=0${tensorParallelism > 1 ? ',1' : ''}
      - VLLM_ATTENTION_BACKEND=FLASH_ATTN
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${tensorParallelism}
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${port}/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 40s
    volumes:
      - hf_cache:/root/.cache/huggingface

volumes:
  hf_cache:
    driver: local`;

    // 3. Kubernetes Deployment (k8s)
    const k8s = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${selectedModel.slug}-inference
  namespace: ai-inference
  labels:
    app: ${selectedModel.slug}
    engine: ${servingEngine.toLowerCase().replace(/[^a-z0-9]/g, '-')}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${selectedModel.slug}
  template:
    metadata:
      labels:
        app: ${selectedModel.slug}
    spec:
      containers:
      - name: server
        image: corepick/${selectedModel.slug}:latest
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: ${port}
          name: http
        resources:
          limits:
            nvidia.com/gpu: "${tensorParallelism}"
            memory: 32Gi
            cpu: "8"
          requests:
            nvidia.com/gpu: "${tensorParallelism}"
            memory: 16Gi
            cpu: "4"
        livenessProbe:
          httpGet:
            path: /health
            port: ${port}
          initialDelaySeconds: 45
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health
            port: ${port}
          initialDelaySeconds: 30
          periodSeconds: 10
        env:
        - name: HUGGING_FACE_HUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: hf-secrets
              key: token
---
apiVersion: v1
kind: Service
metadata:
  name: ${selectedModel.slug}-service
  namespace: ai-inference
spec:
  type: ClusterIP
  selector:
    app: ${selectedModel.slug}
  ports:
  - port: 80
    targetPort: ${port}
    name: http`;

    // 4. Helm Values (helm-values.yaml)
    const helm = `# Helm Production Values for ${selectedModel.name}
replicaCount: 2

image:
  repository: corepick/${selectedModel.slug}
  pullPolicy: IfNotPresent
  tag: "v1.0.0"

service:
  type: ClusterIP
  port: 80
  targetPort: ${port}

modelConfig:
  modelId: "${hfModelRepo}"
  engine: "${servingEngine}"
  precision: "${precision}"
  tensorParallelism: ${tensorParallelism}
  maxModelLen: ${maxModelLen}
  gpuMemoryUtilization: ${gpuMemoryUtilization}

resources:
  limits:
    nvidia.com/gpu: ${tensorParallelism}
    memory: 32Gi
    cpu: 8
  requests:
    nvidia.com/gpu: ${tensorParallelism}
    memory: 16Gi
    cpu: 4

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 8
  targetCPUUtilizationPercentage: 80`;

    // 5. Python Client
    const python = `import os
from openai import OpenAI

# Connect to production serving container endpoint
client = OpenAI(
    base_url="http://localhost:${port}/v1",
    api_key="none-required"
)

response = client.chat.completions.create(
    model="${hfModelRepo}",
    messages=[
        {"role": "system", "content": "You are a specialized AI optimization engineer."},
        {"role": "user", "content": "Explain how PagedAttention eliminates internal memory fragmentation."}
    ],
    temperature=0.7,
    max_tokens=256,
    stream=True
)

print(f"--- Streaming response from ${selectedModel.name} on ${servingEngine} ---")
for chunk in response:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)
print("\\n--- End of Stream ---")`;

    // 6. cURL test
    const curl = `#!/usr/bin/env bash
# Test OpenAI-compatible endpoint health & text completion

echo "1. Checking server health..."
curl -s http://localhost:${port}/health | jq .

echo "\\n2. Sending test inference request to ${selectedModel.name}..."
curl -X POST http://localhost:${port}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${hfModelRepo}",
    "messages": [
      {"role": "user", "content": "Benchmarking low-latency inference endpoint."}
    ],
    "max_tokens": 64,
    "temperature": 0.2
  }' | jq .`;

    return { dockerfile, compose, k8s, helm, python, curl };
  }, [selectedModel, servingEngine, tensorParallelism, maxModelLen, gpuMemoryUtilization, precision, port, hfModelRepo]);

  const activeContent = generatedCode[activeFileTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filenameMap: Record<string, string> = {
      dockerfile: 'Dockerfile',
      compose: 'docker-compose.yml',
      k8s: 'kubernetes-deployment.yaml',
      helm: 'helm-values.yaml',
      python: 'client_inference.py',
      curl: 'curl_test.sh'
    };
    const filename = filenameMap[activeFileTab] || 'config.txt';
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 flex items-center gap-1">
                <Box className="w-3 h-3" />
                <span>Production Deployment Pipeline</span>
              </span>
              <span className="text-xs font-mono text-slate-400">Kubernetes & Docker Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono flex items-center gap-2">
              <Server className="w-6 h-6 text-cyan-400" />
              <span>1-Click Production Container & Kubernetes Generator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Generate fully validated, production-grade serving harnesses (vLLM, TensorRT-LLM, TGI, ONNX Runtime) equipped with health probes, GPU resource allocations, and Kubernetes Helm manifests.
            </p>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2 bg-[#07090E] border border-[#1E293B] rounded-2xl p-1.5 font-mono text-xs">
            <Layers className="w-4 h-4 text-cyan-400 ml-2" />
            <span className="text-slate-400">Model:</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-[#131B2E] border border-[#27354F] text-cyan-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {MODEL_CATALOG.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.parameterCountFormatted})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Serving Engine Selector Tabs */}
        <div className="space-y-2 pt-2 border-t border-[#1E293B]">
          <div className="text-xs font-mono text-slate-400">Choose Production Inference Server Runtime:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
            {[
              { id: 'vLLM', label: 'vLLM (OpenAI API)', tag: 'Recommended' },
              { id: 'TensorRT-LLM', label: 'TensorRT-LLM + Triton', tag: 'Max TFLOPS' },
              { id: 'TGI', label: 'HuggingFace TGI', tag: 'Fast Tokenizer' },
              { id: 'ONNX Runtime', label: 'ONNX Runtime Server', tag: 'Multi-Arch' },
              { id: 'Apple MLX', label: 'Apple MLX Server', tag: 'M-Series' },
              { id: 'Qualcomm QNN', label: 'Qualcomm QNN Server', tag: 'Edge NPU' },
            ].map((eng) => {
              const isSelected = servingEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => setServingEngine(eng.id as ServingEngine)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                      : 'bg-[#07090E] border-[#1E293B] text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs truncate">{eng.id}</div>
                  <span className="text-[10px] text-cyan-400/80 block">{eng.tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Runtime Configuration Knobs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[#07090E] border border-[#1E293B] rounded-2xl font-mono text-xs">
          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block">Tensor Parallelism (GPUs):</span>
            <div className="flex items-center gap-1">
              {[1, 2, 4, 8].map((tp) => (
                <button
                  key={tp}
                  onClick={() => setTensorParallelism(tp)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    tensorParallelism === tp ? 'bg-cyan-500 text-[#07090E]' : 'bg-[#131B2E] text-slate-400 hover:text-white'
                  }`}
                >
                  TP={tp}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block">Quantization Recipe:</span>
            <select
              value={precision}
              onChange={(e) => setPrecision(e.target.value as any)}
              className="w-full bg-[#131B2E] border border-[#27354F] text-cyan-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="AWQ_INT4">AWQ INT4 (Recommended)</option>
              <option value="FP8">FP8 (E4M3 Tensor Core)</option>
              <option value="INT8">SmoothQuant INT8</option>
              <option value="FP16">Unquantized FP16 Baseline</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block">Max Context Length:</span>
            <select
              value={maxModelLen}
              onChange={(e) => setMaxModelLen(Number(e.target.value))}
              className="w-full bg-[#131B2E] border border-[#27354F] text-cyan-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value={4096}>4,096 tokens</option>
              <option value={8192}>8,192 tokens</option>
              <option value={16384}>16,384 tokens</option>
              <option value={32768}>32,768 tokens</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-slate-400 text-[11px] block">VRAM Utilization Cap:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.70"
                max="0.95"
                step="0.05"
                value={gpuMemoryUtilization}
                onChange={(e) => setGpuMemoryUtilization(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer"
              />
              <span className="font-bold text-cyan-300">{Math.round(gpuMemoryUtilization * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor & Multi-File Tab Container */}
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
          {/* File Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'dockerfile', label: 'Dockerfile', icon: FileCode2 },
              { id: 'compose', label: 'docker-compose.yml', icon: Box },
              { id: 'k8s', label: 'k8s-deployment.yaml', icon: Server },
              { id: 'helm', label: 'helm-values.yaml', icon: Settings },
              { id: 'python', label: 'client_inference.py', icon: Code2 },
              { id: 'curl', label: 'curl_test.sh', icon: Terminal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeFileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFileTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500 text-[#07090E] shadow-md shadow-cyan-500/20'
                      : 'bg-[#07090E] text-slate-400 hover:text-white hover:bg-[#131B2E]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#131B2E] hover:bg-[#1E293B] text-cyan-300 border border-cyan-800/60 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#07090E] font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="relative">
          <pre className="p-5 bg-[#05070B] border border-[#182234] rounded-2xl font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed max-h-[500px]">
            <code>{activeContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
