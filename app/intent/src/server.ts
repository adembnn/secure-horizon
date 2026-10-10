/**
 * Sentinelle Intent Barrier - HTTP Server
 * POST /check endpoint for intent vs effects comparison
 * Listens on 127.0.0.1:8787 with CORS enabled
 */

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { compare } from './compare.js';
import { parseIntent, parseIntentWithConfidence } from './parseIntent.js';
import { classifyMessage, classifyMessageWithProvider } from './classifyMessage.js';
import { getProviderChainInfo } from './providers/index.js';
import type { Intent, Effects, Verdict, ClassificationResult } from './types.js';

const PORT = 8787;
const HOST = '127.0.0.1';

/** Minimum confidence threshold */
const CONFIDENCE_THRESHOLD = 0.6;

/**
 * CORS headers for browser requests
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

/**
 * Read request body as JSON
 */
async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(data));
}

/**
 * Handle /check endpoint
 * Accepts two formats:
 * 1. { intent: Intent, effects: Effects } - direct comparison
 * 2. { intent: string, input: Effects, ctx?: object } - parse intent first, then compare
 */
interface CheckRequestDirect {
  intent: Intent;
  effects: Effects;
}

interface CheckRequestParse {
  intent: string; // Free text to parse
  input: Effects;
  ctx?: Record<string, unknown>;
}

type CheckRequest = CheckRequestDirect | CheckRequestParse;

function isDirectRequest(body: CheckRequest): body is CheckRequestDirect {
  return typeof (body as CheckRequestDirect).intent === 'object' && 'effects' in body;
}

async function handleCheck(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody<CheckRequest>(req);

    let intent: Intent;
    let effects: Effects;
    let parseConfidence = 1.0;
    let provider: string | undefined;

    if (isDirectRequest(body)) {
      // Direct comparison
      intent = body.intent;
      effects = body.effects;
    } else {
      // Parse intent from free text first
      const parseResult = await parseIntentWithConfidence(body.intent);
      intent = parseResult.intent;
      parseConfidence = parseResult.confidence;
      provider = parseResult.provider;
      effects = body.input;
    }

    // Compare intent with effects
    const verdict = compare(intent, effects);

    // Adjust confidence if parsing had low confidence
    let finalConfidence = Math.min(verdict.confidence, parseConfidence);

    // If confidence is below threshold, escalate to warn
    if (finalConfidence < CONFIDENCE_THRESHOLD && verdict.level === 'ok') {
      verdict.level = 'warn';
      verdict.reasons.push({
        code: 'low_confidence',
        said: 'Tu veux effectuer cette action',
        does: 'Je ne suis pas sûr de bien comprendre cette transaction. Vérifie attentivement avant de continuer.',
      });
    }

    verdict.confidence = finalConfidence;

    // Return verdict with additional metadata
    sendJson(res, 200, {
      ...verdict,
      meta: {
        provider,
        parseConfidence,
        intentKind: intent.kind,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 400, { error: message });
  }
}

/**
 * Handle /classify endpoint
 * Accepts: { text: string, imageBase64?: string }
 */
interface ClassifyRequest {
  text: string;
  imageBase64?: string;
}

async function handleClassify(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody<ClassifyRequest>(req);

    if (!body.text) {
      sendJson(res, 400, { error: 'Missing "text" field' });
      return;
    }

    const result = await classifyMessageWithProvider(body.text, body.imageBase64);

    sendJson(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 400, { error: message });
  }
}

/**
 * Handle /parse endpoint
 * Accepts: { freeText: string }
 */
interface ParseRequest {
  freeText: string;
}

async function handleParse(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const body = await readJsonBody<ParseRequest>(req);

    if (!body.freeText) {
      sendJson(res, 400, { error: 'Missing "freeText" field' });
      return;
    }

    const result = await parseIntentWithConfidence(body.freeText);

    sendJson(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 400, { error: message });
  }
}

/**
 * Handle /health endpoint
 */
function handleHealth(res: ServerResponse): void {
  const providerInfo = getProviderChainInfo();
  sendJson(res, 200, {
    status: 'ok',
    providers: providerInfo,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Request handler
 */
async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const { method, url } = req;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // Route requests
  try {
    switch (url) {
      case '/check':
        if (method === 'POST') {
          await handleCheck(req, res);
        } else {
          sendJson(res, 405, { error: 'Method not allowed' });
        }
        break;

      case '/classify':
        if (method === 'POST') {
          await handleClassify(req, res);
        } else {
          sendJson(res, 405, { error: 'Method not allowed' });
        }
        break;

      case '/parse':
        if (method === 'POST') {
          await handleParse(req, res);
        } else {
          sendJson(res, 405, { error: 'Method not allowed' });
        }
        break;

      case '/health':
      case '/':
        handleHealth(res);
        break;

      default:
        sendJson(res, 404, { error: 'Not found' });
    }
  } catch (error) {
    console.error('Request handler error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    sendJson(res, 500, { error: message });
  }
}

/**
 * Start the server
 */
export function startServer(port: number = PORT, host: string = HOST): void {
  const server = createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error('Unhandled error:', error);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(port, host, () => {
    console.log(`Sentinelle Intent Barrier server running at http://${host}:${port}`);
    console.log('Endpoints:');
    console.log('  POST /check    - Compare intent with effects');
    console.log('  POST /classify - Classify a message for scam detection');
    console.log('  POST /parse    - Parse free text into structured intent');
    console.log('  GET  /health   - Health check and provider info');
    console.log('');
    const providerInfo = getProviderChainInfo();
    console.log(`Active provider: ${providerInfo.active}`);
  });
}

// Start server if run directly
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/'))) {
  startServer();
}

export default startServer;
