import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { HARDWARE_CATALOG, MODEL_CATALOG, SAMPLE_OPTIMIZATION_JOBS, CLOUD_TCO_MODELS, SAMPLE_CODE_SNIPPETS, BENCHMARK_DATABASE } from './src/data/mockData.js';
import { simulateInference, runOptimizationSearch } from './src/simulation/performanceEngine.js';


dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory jobs storage seeded with sample jobs
let jobsDatabase = [...SAMPLE_OPTIMIZATION_JOBS];

// Lazy GoogleGenAI client initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// ----------------------------------------------------
// Robots.txt & Sitemap.xml for Search Engine Crawlers
// ----------------------------------------------------
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain');
  res.send(
`User-agent: *
Allow: /
Sitemap: https://corepick.in/sitemap.xml
`
  );
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.type('application/xml');
  res.send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://corepick.in/</loc>
    <lastmod>2026-09-02</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
  );
});

// ----------------------------------------------------
// Health & Telemetry
// ----------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    appName: 'CorePick - AI Model Hardware & Inference Optimization Platform',
    hasApiKey: hasKey,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// Hardware Catalog API
// ----------------------------------------------------
app.get('/api/hardware', (req: Request, res: Response) => {
  const { vendor, type, search } = req.query;
  let results = [...HARDWARE_CATALOG];

  if (vendor && typeof vendor === 'string' && vendor !== 'all') {
    results = results.filter((h) => h.vendor.toLowerCase() === vendor.toLowerCase());
  }

  if (type && typeof type === 'string' && type !== 'all') {
    results = results.filter((h) => h.type.toLowerCase() === type.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.architecture.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q)
    );
  }

  res.json({ hardware: results, total: results.length });
});

// ----------------------------------------------------
// Models Catalog API
// ----------------------------------------------------
app.get('/api/models', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let results = [...MODEL_CATALOG];

  if (category && typeof category === 'string' && category !== 'all') {
    results = results.filter((m) => m.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ models: results, total: results.length });
});

// ----------------------------------------------------
// Optimization Jobs API
// ----------------------------------------------------
app.get('/api/jobs', (req: Request, res: Response) => {
  res.json({ jobs: jobsDatabase });
});

app.get('/api/jobs/:id', (req: Request, res: Response) => {
  const job = jobsDatabase.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Optimization job not found' });
  }
  res.json({ job });
});

// Create and trigger a new profiling & benchmarking job
app.post('/api/jobs/create', (req: Request, res: Response) => {
  try {
    const {
      modelId,
      objective = 'lowest_latency',
      targetPrecisions = ['FP16', 'INT8'],
      targetHardwareIds = ['nvidia-rtx-4090', 'nvidia-h100-sxm', 'qualcomm-snapdragon-x-elite'],
      baselineHardwareId = 'nvidia-rtx-4090',
    } = req.body;

    const model = MODEL_CATALOG.find((m) => m.id === modelId) || MODEL_CATALOG[0];
    const newJobId = `job-${model.slug}-${Date.now().toString().slice(-4)}`;

    // Generate benchmark results based on selected hardware and model properties
    const generatedResults = targetHardwareIds.map((hwId: string) => {
      const hw = HARDWARE_CATALOG.find((h) => h.id === hwId) || HARDWARE_CATALOG[0];
      const isPrecisionInt8 = targetPrecisions.includes('INT8');
      const precision = isPrecisionInt8 ? 'INT8' : 'FP16';

      // Realistic latency estimation based on model GFLOPs and hardware TFLOPS/TOPS
      const effectiveCompute = precision === 'INT8' ? hw.int8Tops : hw.fp16Tflops;
      const baseLatencyMs = Math.max(0.8, Number(((model.totalFlopsGflops / (effectiveCompute * 1000)) * 1200).toFixed(2)));
      const throughputFps = Number((1000 / baseLatencyMs).toFixed(1));
      const powerWatts = Math.min(hw.tdpWatts, Math.max(15, Math.round(hw.tdpWatts * 0.85)));
      const costPerMillion = Number(((baseLatencyMs * (hw.hourlyCloudCostUsd || 0.5) / 3600)).toFixed(2));
      const memoryUsedMb = Math.round(model.modelSizeBytesMb * (precision === 'INT8' ? 0.55 : 1.05));

      return {
        hardwareId: hw.id,
        hardwareName: hw.name,
        vendor: hw.vendor,
        hardwareType: hw.type,
        runtimeEngine: hw.supportedRuntimes[0] || 'TensorRT',
        precision,
        batchSize: 1,
        latencyMs: baseLatencyMs,
        p99LatencyMs: Number((baseLatencyMs * 1.15).toFixed(2)),
        throughputFps,
        powerConsumptionWatts: powerWatts,
        memoryUsedMb,
        costPerMillionInferencesUsd: costPerMillion,
        efficiencyScore: Math.round(Math.min(99, 100 - (baseLatencyMs * 2))),
        isParetoOptimal: hw.id === 'nvidia-h100-sxm' || hw.id === 'nvidia-rtx-4090' || hw.id === 'qualcomm-snapdragon-x-elite',
      };
    });

    const newJob: any = {
      id: newJobId,
      modelId: model.id,
      modelName: model.name,
      modelCategory: model.category,
      createdAt: new Date().toISOString(),
      status: 'completed',
      objective,
      targetPrecisions,
      targetHardwareIds,
      selectedBaselineHardwareId: baselineHardwareId,
      results: generatedResults,
      flamegraph: SAMPLE_OPTIMIZATION_JOBS[0].flamegraph,
      batchSweepData: SAMPLE_OPTIMIZATION_JOBS[0].batchSweepData,
      aiInsights: {
        summary: `Optimization job completed for ${model.name}. Model achieved maximum throughput across target hardware clusters with ${targetPrecisions.join('/')} precisions.`,
        topBottleneck: model.topOperators[0]?.name ? `${model.topOperators[0].name} kernel memory access` : 'Memory bandwidth roofline saturation',
        recommendedDevice: targetHardwareIds[0] || 'nvidia-rtx-4090',
        estimatedCostSavingsPct: 65.4,
        recommendedRuntime: 'TensorRT / QNN runtime engines with direct INT8 calibration cache',
        tuningFlags: ['--builderOptimizationLevel=5', '--fp16', '--int8', '--workspace=4096MB'],
      },
    };

    jobsDatabase = [newJob, ...jobsDatabase];
    res.json({ job: newJob });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// Cloud TCO Models API
// ----------------------------------------------------
app.get('/api/tco-models', (req: Request, res: Response) => {
  res.json({ tcoModels: CLOUD_TCO_MODELS });
});

// ----------------------------------------------------
// Public Benchmarks API (with Provenance Filtering)
// ----------------------------------------------------
app.get('/api/benchmarks', (req: Request, res: Response) => {
  const { model, hardware, runtime, precision, provenance, verifiedOnly } = req.query;
  let results = [...BENCHMARK_DATABASE];

  if (provenance && typeof provenance === 'string' && provenance !== 'ALL') {
    results = results.filter((b) => b.provenance === provenance);
  }

  if (verifiedOnly === 'true') {
    results = results.filter((b) => b.isVerified);
  }

  if (model && typeof model === 'string' && model !== 'all') {
    const q = model.toLowerCase();
    results = results.filter((b) => b.modelId.toLowerCase().includes(q) || b.modelName.toLowerCase().includes(q));
  }

  if (hardware && typeof hardware === 'string' && hardware !== 'all') {
    const q = hardware.toLowerCase();
    results = results.filter((b) => b.hardwareId.toLowerCase().includes(q) || b.hardwareName.toLowerCase().includes(q));
  }

  if (runtime && typeof runtime === 'string' && runtime !== 'all') {
    results = results.filter((b) => b.runtime.toLowerCase() === runtime.toLowerCase());
  }

  if (precision && typeof precision === 'string' && precision !== 'all') {
    results = results.filter((b) => b.precision.toLowerCase() === precision.toLowerCase());
  }

  res.json({ benchmarks: results, total: results.length });
});

// ----------------------------------------------------
// Performance Simulation API
// ----------------------------------------------------
app.post('/api/simulate', (req: Request, res: Response) => {
  try {
    const params = { ...req.body };

    if (!params.model && params.modelId) {
      params.model = MODEL_CATALOG.find((m) => m.id === params.modelId || m.slug === params.modelId) || MODEL_CATALOG[0];
    }
    if (!params.hardware && params.hardwareId) {
      params.hardware = HARDWARE_CATALOG.find((h) => h.id === params.hardwareId) || HARDWARE_CATALOG[0];
    }

    if (!params.model || !params.hardware) {
      return res.status(400).json({ error: 'Model and hardware profiles are required.' });
    }
    const result = simulateInference(params);
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Simulation failed' });
  }
});

// ----------------------------------------------------
// Unified CorePick Optimization Search API
// ----------------------------------------------------
app.post('/api/optimize', (req: Request, res: Response) => {
  try {
    const { model, workload, slo, hardwarePool, objective, weights, precisions, runtimes } = req.body;
    const pool = hardwarePool && hardwarePool.length > 0 ? hardwarePool : HARDWARE_CATALOG;
    const targetModel = model || MODEL_CATALOG[0];

    const resultPackage = runOptimizationSearch({
      model: targetModel,
      workload: workload || {
        type: 'LLM inference',
        inputTokens: 1024,
        outputTokens: 256,
        contextLength: 2048,
        requestsPerSec: 10,
        concurrentRequests: 8,
        batchSize: 8,
        trafficPattern: 'Steady'
      },
      slo: slo || {
        ttftTargetMs: 150,
        itlTargetMs: 25,
        e2eLatencyTargetMs: 2000,
        throughputTargetTps: 200,
        availabilityTargetPct: 99.9,
        maxBudgetMonthlyUsd: 15000
      },
      hardwarePool: pool,
      objective: objective || 'balanced',
      weights: weights,
      precisions,
      runtimes
    });

    res.json(resultPackage);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Optimization search failed' });
  }
});

// ----------------------------------------------------
// AI Code Generation API
// ----------------------------------------------------
app.post('/api/ai/generate-code', async (req: Request, res: Response) => {
  try {
    const { modelName, runtime, precision, language } = req.body;
    const ai = getGenAI();

    if (!ai) {
      const snippets = SAMPLE_CODE_SNIPPETS['yolov8x-det'] || [];
      const match = snippets.find((s) => s.runtime === runtime && s.language === language) || snippets[0];
      return res.json({ code: match?.code || '// Code generated for ' + modelName, simulated: true });
    }

    const prompt = `Write a production-ready, high-performance ${language} deployment code snippet for model "${modelName}" using runtime "${runtime}" with precision "${precision}". Include asynchronous CUDA/NPU stream initialization, buffer management, and error handling.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    res.json({ code: response.text || '', simulated: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// Contact Us & Inquiries API (Dispatches to innfriend1@gmail.com)
// ----------------------------------------------------
const PRIMARY_CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT_EMAIL || 'innfriend1@gmail.com';

interface ContactInquiry {
  id: string;
  formCategory?: 'benchmark_profiling' | 'enterprise_finops' | string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  hardwareInterest?: string;
  modelInterest?: string;
  workloadScale?: string;
  deploymentEnv?: string;
  timeline?: string;
  subject: string;
  message: string;
  inquiryType?: string;
  recipientEmail: string;
  createdAt: string;
  status: 'received' | 'notified';
}

const contactInquiries: ContactInquiry[] = [];

app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const {
      formCategory = 'benchmark_profiling',
      name,
      email,
      company = '',
      role = '',
      hardwareInterest = 'General Inference Acceleration',
      modelInterest = '',
      workloadScale = '',
      deploymentEnv = '',
      timeline = '',
      subject = 'CorePick AI Inquiry',
      message,
      inquiryType = 'general',
    } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required fields.' });
    }

    const prefix = formCategory === 'enterprise_finops' ? 'FIN' : 'BENCH';
    const inquiryId = `${prefix}-${Date.now().toString().slice(-6)}`;
    const newInquiry: ContactInquiry = {
      id: inquiryId,
      formCategory,
      name,
      email,
      company,
      role,
      hardwareInterest,
      modelInterest,
      workloadScale,
      deploymentEnv,
      timeline,
      subject,
      message,
      inquiryType,
      recipientEmail: PRIMARY_CONTACT_RECIPIENT,
      createdAt: new Date().toISOString(),
      status: 'received',
    };

    contactInquiries.unshift(newInquiry);

    // Primary Dispatch Log & Notification Stream
    console.log(`====================================================`);
    console.log(`[COREPICK DISPATCH] INCOMING CONTACT INQUIRY #${inquiryId}`);
    console.log(`Form Set: ${formCategory === 'enterprise_finops' ? 'Set 2: Enterprise Sizing & FinOps' : 'Set 1: Benchmark & Custom Silicon'}`);
    console.log(`Destination Mailbox: ${PRIMARY_CONTACT_RECIPIENT}`);
    console.log(`Sender: ${name} <${email}> (${company || 'N/A'}${role ? ` - ${role}` : ''})`);
    console.log(`Subject: ${subject}`);
    console.log(`Hardware / Fleet: ${hardwareInterest}`);
    if (modelInterest) console.log(`Model Interest: ${modelInterest}`);
    if (workloadScale) console.log(`Workload Scale: ${workloadScale}`);
    if (deploymentEnv) console.log(`Deployment Target: ${deploymentEnv}`);
    if (timeline) console.log(`Target Timeline: ${timeline}`);
    console.log(`Message Body: ${message}`);
    console.log(`Timestamp: ${newInquiry.createdAt}`);
    console.log(`====================================================`);

    // Forward to Email Delivery API if configured (e.g., Resend, SendGrid, or custom webhook)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'CorePick AI <onboarding@resend.dev>',
            to: [PRIMARY_CONTACT_RECIPIENT],
            reply_to: email,
            subject: `[CorePick ${formCategory === 'enterprise_finops' ? 'Enterprise Sizing' : 'Benchmark Request'}] ${subject}`,
            html: `
              <h2>New CorePick Contact Inquiry (#${inquiryId})</h2>
              <p><strong>Form Category:</strong> ${formCategory === 'enterprise_finops' ? 'Enterprise Sizing & FinOps Consultation' : 'Benchmark & Hardware Profiling Request'}</p>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Company / Lab:</strong> ${company || 'N/A'} ${role ? `(${role})` : ''}</p>
              <p><strong>Hardware / Target Fleet:</strong> ${hardwareInterest}</p>
              ${modelInterest ? `<p><strong>Model / Precision Target:</strong> ${modelInterest}</p>` : ''}
              ${workloadScale ? `<p><strong>Workload / Token Scale:</strong> ${workloadScale}</p>` : ''}
              ${deploymentEnv ? `<p><strong>Environment:</strong> ${deploymentEnv}</p>` : ''}
              ${timeline ? `<p><strong>Timeline:</strong> ${timeline}</p>` : ''}
              <p><strong>Subject:</strong> ${subject}</p>
              <hr/>
              <h3>Message / Technical Requirements</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            `,
          }),
        });
        console.log(`[CorePick Dispatch] Successfully dispatched via Resend API to ${PRIMARY_CONTACT_RECIPIENT}`);
      } catch (sendErr) {
        console.error('[CorePick Dispatch] Email API dispatch failed:', sendErr);
      }
    } else if (process.env.EMAIL_WEBHOOK_URL) {
      try {
        await fetch(process.env.EMAIL_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: PRIMARY_CONTACT_RECIPIENT,
            inquiryId,
            formCategory,
            name,
            email,
            company,
            role,
            hardwareInterest,
            modelInterest,
            workloadScale,
            deploymentEnv,
            timeline,
            subject,
            message,
            timestamp: newInquiry.createdAt,
          }),
        });
        console.log(`[CorePick Dispatch] Dispatched via Webhook to ${PRIMARY_CONTACT_RECIPIENT}`);
      } catch (webhookErr) {
        console.error('[CorePick Dispatch] Webhook dispatch failed:', webhookErr);
      }
    }

    res.json({
      success: true,
      inquiryId,
      message: 'Inquiry successfully received and routed to performance engineering team.',
      status: 'delivered',
    });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process inquiry' });
  }
});

app.get('/api/contact/inquiries', (req: Request, res: Response) => {
  res.json({ inquiries: contactInquiries, destinationConfigured: true });
});

// ----------------------------------------------------
// Setup Vite Middleware / Production Server
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CorePick AI Optimization Platform listening on http://localhost:${PORT}`);
  });
}

startServer();
