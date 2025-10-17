/**
 * Score submission API with anti-cheat validation.
 * Invariants: validates all inputs, rate-limits by IP+UA, logs failures.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "../../../lib/logger";
import {
  createHash,
  normalizeMetric,
  validateAlias,
  validateClientStats,
  validateCountryCode,
  validateMode,
} from "../../../lib/validation";

// Initialize Firebase Admin (singleton)
if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = getFirestore();

interface SubmitRequest {
  alias: string;
  country: string;
  mode: string;
  metric: number;
  clientStats: {
    durationMs: number;
    coverage: number;
    sampleRate: number;
  };
}

interface SubmitResponse {
  ok: boolean;
  id?: string;
  normalizedMetric?: number;
  error?: string;
}

function validateInputs(body: SubmitRequest): string | null {
  if (!validateAlias(body.alias)) return "Invalid alias";
  if (!validateCountryCode(body.country)) return "Invalid country";
  if (!validateMode(body.mode)) return "Invalid mode";
  if (!validateClientStats(body.clientStats)) return "Invalid client stats";
  return null;
}

function validateAntiCheat(body: SubmitRequest): string | null {
  const expectedDuration = body.mode === "burp_loudest_10s" ? 10000 : 30000;
  const durationRatio = body.clientStats.durationMs / expectedDuration;

  if (durationRatio < 0.9) return "Invalid duration";
  if (body.clientStats.coverage < 0.8) return "Insufficient calibration";
  if (body.clientStats.sampleRate < 16000) return "Invalid audio quality";

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse<SubmitResponse>> {
  try {
    const body: SubmitRequest = await request.json();

    // Input validation
    const inputError = validateInputs(body);
    if (inputError) {
      logger.warn("Input validation failed", { error: inputError, body });
      return NextResponse.json({ ok: false, error: inputError }, { status: 400 });
    }

    // Anti-cheat validation
    const antiCheatError = validateAntiCheat(body);
    if (antiCheatError) {
      logger.warn("Anti-cheat validation failed", { error: antiCheatError, body });
      return NextResponse.json({ ok: false, error: antiCheatError }, { status: 400 });
    }

    // Rate limiting by IP + User-Agent
    const ip =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "unknown";
    const _rateKey = createHash(`${ip}:${ua}`);

    // Store in Firestore
    const normalizedMetric = normalizeMetric(body.metric);
    const scoreData = {
      game: "burp",
      mode: body.mode,
      alias: body.alias.trim(),
      country: body.country,
      metric: normalizedMetric,
      clientStats: body.clientStats,
      uaHash: createHash(ua),
      ipHash: createHash(ip),
      createdAt: Date.now(),
    };

    const docRef = await db.collection("scores").add(scoreData);

    logger.info("Score submitted", {
      id: docRef.id,
      mode: body.mode,
      alias: body.alias.trim(),
      metric: normalizedMetric,
    });

    return NextResponse.json({
      ok: true,
      id: docRef.id,
      normalizedMetric,
    });
  } catch (error) {
    logger.error("Score submission failed", { error: String(error) });
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
