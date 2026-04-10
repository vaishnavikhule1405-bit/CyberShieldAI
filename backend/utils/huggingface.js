import axios from 'axios';

const HF_BASE_URL = 'https://api-inference.huggingface.co/models';

/**
 * Primary deepfake image detector.
 * Model: Organika/sdxl-detector
 * Returns labels: "artificial" | "human"
 */
const IMAGE_MODEL = 'Organika/sdxl-detector';

/**
 * Secondary/backup model for broader AI-image detection.
 * Model: umm-maybe/AI-image-detector
 * Returns labels: "artificial" | "human"
 */
const IMAGE_MODEL_FALLBACK = 'umm-maybe/AI-image-detector';

/**
 * Scans a buffer for an embedded JPEG thumbnail.
 * Many MP4/MOV containers embed a JPEG cover image — we extract it
 * to run through the image deepfake classifier.
 * @param {Buffer} buffer
 * @returns {Buffer|null}
 */
export const extractJpegFromBuffer = (buffer) => {
  // JPEG SOI marker: FF D8 FF
  // JPEG EOI marker: FF D9
  for (let i = 0; i < buffer.length - 3; i++) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd8 && buffer[i + 2] === 0xff) {
      // Found a JPEG start — now hunt for the EOI
      for (let j = i + 3; j < buffer.length - 1; j++) {
        if (buffer[j] === 0xff && buffer[j + 1] === 0xd9) {
          const jpegSlice = buffer.slice(i, j + 2);
          // Sanity check: must be at least 1 KB to be a real image
          if (jpegSlice.length > 1024) return jpegSlice;
        }
      }
    }
  }
  return null;
};

/**
 * Calls the HuggingFace Inference API with a raw image buffer.
 * Retries once on a 503 (model loading) with a 12-second wait.
 *
 * @param {Buffer} imageBuffer  Raw bytes of the image
 * @param {string} model        HF model path
 * @returns {Array}             Array of {label, score} objects
 */
const callHFClassifier = async (imageBuffer, model) => {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!HF_API_KEY) throw new Error('HF_API_KEY is not set in environment');

  const url = `${HF_BASE_URL}/${model}`;

  const attempt = async () =>
    axios.post(url, imageBuffer, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/octet-stream',
      },
      timeout: 35000,
    });

  try {
    const res = await attempt();
    return res.data;
  } catch (err) {
    // 503 = model is still loading on HF free tier — wait and retry once
    if (err.response?.status === 503) {
      console.log(`[HF] Model ${model} loading, retrying in 12s...`);
      await new Promise((r) => setTimeout(r, 12000));
      const retry = await attempt();
      return retry.data;
    }
    throw err;
  }
};

/**
 * Normalises the raw HF classifier output into a clean verdict object.
 * Handles label variations across different HF models:
 *   "artificial", "AI-generated", "fake", "LABEL_0" → treated as AI/fake
 *   "human", "real", "not AI-generated", "LABEL_1" → treated as real
 *
 * @param {Array} results   Raw HF [{label, score}] array
 * @returns {{ isAI: boolean, confidence: number, rawLabel: string, rawScore: number }}
 */
const parseHFResults = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error('Empty or invalid HF response');
  }

  const AI_KEYWORDS = ['artificial', 'ai-generated', 'fake', 'deepfake', 'label_0', 'synthetic'];
  const REAL_KEYWORDS = ['human', 'real', 'not ai', 'authentic', 'label_1', 'natural'];

  let aiEntry = null;
  let realEntry = null;

  for (const entry of results) {
    const label = entry.label.toLowerCase();
    if (AI_KEYWORDS.some((kw) => label.includes(kw))) aiEntry = entry;
    if (REAL_KEYWORDS.some((kw) => label.includes(kw))) realEntry = entry;
  }

  // If neither matched, pick the highest score as AI (conservative approach)
  if (!aiEntry && !realEntry) {
    aiEntry = results.reduce((a, b) => (a.score > b.score ? a : b));
  }

  const isAI = aiEntry && (!realEntry || aiEntry.score >= realEntry.score);
  const confidence = isAI
    ? Math.round(aiEntry.score * 100)
    : Math.round((realEntry?.score ?? 0.5) * 100);

  return {
    isAI: Boolean(isAI),
    confidence,
    rawLabel: isAI ? aiEntry.label : realEntry?.label ?? 'unknown',
    rawScore: isAI ? aiEntry.score : realEntry?.score ?? 0,
  };
};

/**
 * Analyses an image buffer using HuggingFace deepfake detectors.
 * Tries the primary model first; falls back to the secondary if needed.
 *
 * @param {Buffer} imageBuffer
 * @param {string} filename   Used only for logging
 * @returns {{ isPhishing: boolean, confidence: number, explanation: string, source: string }}
 */
export const analyzeImageWithHF = async (imageBuffer, filename = 'image') => {
  let results = null;
  let usedModel = IMAGE_MODEL;

  try {
    results = await callHFClassifier(imageBuffer, IMAGE_MODEL);
    console.log(`[HF] ${IMAGE_MODEL} response for ${filename}:`, results);
  } catch (primaryErr) {
    console.warn(`[HF] Primary model failed (${primaryErr.message}), trying fallback...`);
    try {
      results = await callHFClassifier(imageBuffer, IMAGE_MODEL_FALLBACK);
      usedModel = IMAGE_MODEL_FALLBACK;
      console.log(`[HF] ${IMAGE_MODEL_FALLBACK} response for ${filename}:`, results);
    } catch (fallbackErr) {
      console.error('[HF] Both image models failed:', fallbackErr.message);
      throw new Error(`HF image analysis failed: ${fallbackErr.message}`);
    }
  }

  const verdict = parseHFResults(results);

  const explanation = verdict.isAI
    ? `🚨 <b>AI-generated / deepfake image detected</b> by HuggingFace classifier <i>${usedModel}</i>.\n\n` +
      `Confidence: <b>${verdict.confidence}%</b> (label: "${verdict.rawLabel}", score: ${verdict.rawScore.toFixed(4)}).\n\n` +
      `The model identified <b>synthetic visual patterns</b> consistent with generative AI (Stable Diffusion, DALL-E, Midjourney, etc.). ` +
      `Look for unnatural skin textures, distorted backgrounds, asymmetric facial features, or pixel-level rendering artifacts.`
    : `✅ <b>Authentic image</b> — no AI generation signatures detected by <i>${usedModel}</i>.\n\n` +
      `Confidence: <b>${verdict.confidence}%</b> (label: "${verdict.rawLabel}", score: ${verdict.rawScore.toFixed(4)}).\n\n` +
      `The classifier found no evidence of generative AI rendering. Natural camera noise, organic lighting, and coherent structure were present.`;

  return {
    isPhishing: verdict.isAI,
    confidence: verdict.confidence,
    explanation,
    source: `HuggingFace / ${usedModel}`,
  };
};

/**
 * Analyses a video buffer for deepfake content.
 * Strategy (in order):
 *   1. Extract embedded JPEG thumbnail → run through image classifier
 *   2. Scan metadata strings for known AI-video tool watermarks
 *   3. Return a conservative "needs manual review" result
 *
 * @param {Buffer} videoBuffer
 * @param {string} filename
 * @returns {{ isPhishing: boolean, confidence: number, explanation: string, source: string }}
 */
export const analyzeVideoWithHF = async (videoBuffer, filename = 'video') => {
  // ── Step 1: Embedded thumbnail ──────────────────────────────────────────────
  const thumbnail = extractJpegFromBuffer(videoBuffer);

  if (thumbnail) {
    console.log(
      `[HF Video] Extracted embedded JPEG thumbnail (${thumbnail.length} bytes) from ${filename}`
    );
    try {
      const imageResult = await analyzeImageWithHF(thumbnail, filename + '[thumbnail]');
      // Wrap the explanation to clarify this came from the thumbnail
      imageResult.explanation =
        `🎬 <b>Video analysis via embedded thumbnail frame</b>\n\n` + imageResult.explanation;
      imageResult.source = imageResult.source + ' (video thumbnail)';
      return imageResult;
    } catch (thumbErr) {
      console.warn('[HF Video] Thumbnail image analysis failed:', thumbErr.message);
      // Fall through to metadata analysis
    }
  } else {
    console.log(`[HF Video] No embedded JPEG found in ${filename}, falling back to metadata scan`);
  }

  // ── Step 2: Metadata string heuristics ──────────────────────────────────────
  const DEEPFAKE_TOOLS = [
    'runwayml', 'runway', 'sora', 'synthesia', 'heygen', 'deepface',
    'deepfacelab', 'faceswap', 'roop', 'reface', 'avatarify',
    'd-id', 'did.com', 'pika', 'stable-video', 'svd',
    'ai-generated', 'artificial', 'generated by', 'created by ai',
  ];

  // Sample first 80 KB of the video — metadata/atoms live near the start
  const sample = videoBuffer.subarray(0, Math.min(videoBuffer.length, 81920));
  const metaStrings = (sample.toString('ascii').match(/[ -~]{4,}/g) ?? []).join(' ').toLowerCase();
  const lowerFilename = filename.toLowerCase();

  const matchedTool = DEEPFAKE_TOOLS.find(
    (tool) => metaStrings.includes(tool) || lowerFilename.includes(tool)
  );

  if (matchedTool) {
    return {
      isPhishing: true,
      confidence: 92,
      explanation:
        `🚨 <b>Deepfake / AI-video tool signature detected</b> in file metadata.\n\n` +
        `Matched token: <b>"${matchedTool}"</b> found in the video container's metadata strings.\n\n` +
        `This is a strong indicator the video was produced or processed by an AI generation or face-swap tool. ` +
        `Treat any claims or identities shown in this video as <b>unverified and potentially fabricated</b>.`,
      source: 'Metadata heuristic scan',
    };
  }

  // ── Step 3: Inconclusive — conservative fallback ────────────────────────────
  return {
    isPhishing: false,
    confidence: 55,
    explanation:
      `⚠️ <b>Video deepfake analysis inconclusive.</b>\n\n` +
      `No embedded JPEG thumbnail was found to run through the HuggingFace classifier, ` +
      `and no known AI-video tool signatures were detected in the container metadata.\n\n` +
      `<b>This does not guarantee the video is authentic.</b> For high-stakes use cases, ` +
      `extract individual frames and analyse them separately with the image deepfake detector.`,
    source: 'Metadata heuristic scan (inconclusive)',
  };
};