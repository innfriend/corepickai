import React, { useState } from 'react';
import { X, Upload, FileCode, CheckCircle2, AlertCircle, Sparkles, Layers, Cpu } from 'lucide-react';
import { ModelArchitecture, ModelCategory, ModelFramework } from '../types';

interface UploadModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelUploaded: (model: ModelArchitecture) => void;
}

export const UploadModelModal: React.FC<UploadModelModalProps> = ({
  isOpen,
  onClose,
  onModelUploaded,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [modelName, setModelName] = useState('');
  const [framework, setFramework] = useState<ModelFramework>('ONNX');
  const [category, setCategory] = useState<ModelCategory>('Vision');
  const [paramCount, setParamCount] = useState('45.2');
  const [inputShape, setInputShape] = useState('[1, 3, 512, 512]');
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      setModelName(file.name.replace(/\.[^/.]+$/, '').toUpperCase());
      setIsParsing(true);
      setTimeout(() => {
        setIsParsing(false);
      }, 800);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setModelName(file.name.replace(/\.[^/.]+$/, '').toUpperCase());
      setIsParsing(true);
      setTimeout(() => {
        setIsParsing(false);
      }, 800);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newModel: ModelArchitecture = {
      id: `custom-${Date.now().toString().slice(-4)}`,
      name: modelName || 'Custom Ingested Neural Model',
      slug: (modelName || 'custom-model').toLowerCase().replace(/\s+/g, '-'),
      category,
      framework,
      version: '1.0.0',
      parameterCountM: parseFloat(paramCount) || 50.0,
      parameterCountFormatted: `${paramCount || '50'} M`,
      modelSizeBytesMb: (parseFloat(paramCount) || 50.0) * 2.0,
      contextLengthOrResolution: category === 'Vision' ? '512 x 512 RGB' : '4096 tokens',
      totalFlopsGflops: (parseFloat(paramCount) || 50.0) * 3.4,
      inputShape: inputShape || '[1, 3, 512, 512]',
      outputShape: category === 'Vision' ? '[1, 1000]' : '[1, 4096, 32000]',
      layersCount: Math.round((parseFloat(paramCount) || 50.0) * 4.2),
      topOperators: [
        { name: category === 'Vision' ? 'Conv2D' : 'FlashAttention-2', count: 64, percentageTime: 54.0 },
        { name: category === 'Vision' ? 'BatchNorm' : 'SwiGLU GEMM', count: 64, percentageTime: 28.0 },
        { name: 'LayerNorm / SiLU', count: 32, percentageTime: 18.0 },
      ],
      fusionOpportunities: [
        {
          pattern: 'PointWise Activation Fusion',
          description: 'Automatic register-tile vectorization eliminating global memory roundtrips.',
          speedupPct: 32.5,
          memorySavingsMb: 24.0,
        },
      ],
      description: `Custom ingested ${framework} architecture configured for automated compiler analysis.`,
      recommendedHardware: ['nvidia-rtx-4090', 'nvidia-h100-sxm', 'qualcomm-snapdragon-x-elite'],
      tags: ['Custom', framework, category],
    };

    onModelUploaded(newModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D1322] border border-[#1E293B] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">Ingest Model Architecture</h3>
              <p className="text-xs text-slate-400">Upload ONNX, PyTorch, Safetensors, or GGUF files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E293B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Box */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors relative cursor-pointer ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/30'
                : 'border-[#1E293B] hover:border-cyan-500/40 bg-[#07090E]'
            }`}
          >
            <input
              type="file"
              id="model-file-input"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileInput}
              accept=".onnx,.pt,.pth,.safetensors,.tflite,.gguf"
            />
            <div className="flex flex-col items-center space-y-2 pointer-events-none">
              <FileCode className="w-10 h-10 text-cyan-400" />
              {fileName ? (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{fileName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Graph parsed successfully. Ready for compilation.</p>
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-200">
                    Drag & Drop your neural model here or <span className="text-cyan-400 underline">browse</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Supports .onnx, .safetensors, .pt, .tflite, .gguf (up to 10GB)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Model Name</label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. YOLOv8x-Custom"
                className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Framework Format</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as any)}
                className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ONNX">ONNX</option>
                <option value="PyTorch">PyTorch (.pt / .pth)</option>
                <option value="Safetensors">Safetensors</option>
                <option value="TFLite">TFLite</option>
                <option value="GGUF">GGUF</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Task Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Vision">Vision / Detection</option>
                <option value="NLP / LLM">NLP / LLM</option>
                <option value="Speech & Audio">Speech & Audio</option>
                <option value="Generative / Diffusion">Generative / Diffusion</option>
                <option value="Multimodal">Multimodal</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Parameter Count (M)</label>
              <input
                type="text"
                value={paramCount}
                onChange={(e) => setParamCount(e.target.value)}
                placeholder="e.g. 68.2"
                className="w-full bg-[#07090E] border border-[#1E293B] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#131B2E] text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-[#07090E] font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-transform hover:scale-105 cursor-pointer"
            >
              Add to Catalog & Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
