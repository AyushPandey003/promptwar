'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearSessionCookie, createSessionToken, setSessionCookie, verifyPassword } from '@/lib/auth';
import { buildPrompt, deterministicPlan, extractGeminiText, normalizeMealPlan, parseModelJson, parsePlannerForm, type PlannerActionState } from '@/lib/planner';
import { getBootData, getIngredientCatalog, getRecentPlans, getProfileBySlug, getUserByUsername, savePlan } from '@/lib/repository';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.5-flash';
const PROFILE_SLUG = 'ayush-food-story';

async function generateWithGemini(actionInput: Parameters<typeof buildPrompt>[0]) {
  const profile = await getProfileBySlug(PROFILE_SLUG);
  const catalog = await getIngredientCatalog();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      plan: deterministicPlan(actionInput, profile, catalog),
      source: 'fallback',
      message: 'Gemini key missing, so SpiceRoute used the seeded planner fallback.',
    };
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(actionInput, profile, catalog) }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        plan: deterministicPlan(actionInput, profile, catalog),
        source: 'fallback',
        message: 'Gemini was unavailable, so SpiceRoute generated a safe local fallback plan.',
      };
    }

    const raw = await response.json();
    const parsed = parseModelJson(extractGeminiText(raw));
    return {
      plan: normalizeMealPlan(parsed, actionInput),
      source: 'gemini',
      message: 'Fresh AI plan generated and checked against your requested meal slots and budget.',
    };
  } catch {
    return {
      plan: deterministicPlan(actionInput, profile, catalog),
      source: 'fallback',
      message: 'Gemini failed this time, so SpiceRoute recovered with a seeded fallback plan.',
    };
  }
}

export async function generatePlanAction(previousState: PlannerActionState, formData: FormData): Promise<PlannerActionState> {
  try {
    const input = parsePlannerForm(formData);
    const generated = await generateWithGemini(input);

    try {
      await savePlan(input, generated.plan, generated.source);
    } catch {
      // Persistence is helpful, but a plan should still be returned if the database write fails.
    }

    revalidatePath('/');

    return {
      status: 'success',
      message: generated.message,
      source: generated.source,
      input,
      plan: generated.plan,
      recentPlans: await getRecentPlans(),
    };
  } catch (error) {
    return {
      ...previousState,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to generate a cooking plan right now.',
    };
  }
}

export async function getInitialPlannerState() {
  const bootData = await getBootData();
  return {
    bootData,
    initialState: {
      status: 'idle',
      message: 'Tell SpiceRoute about your day and generate a cooking plan.',
      source: 'seeded',
      input: bootData.initialInput,
      plan: bootData.recentPlans[0]?.plan ?? null,
      recentPlans: bootData.recentPlans,
    } satisfies PlannerActionState,
  };
}

export async function loginAction(
  previousState: { status: 'idle' | 'error'; message: string },
  formData: FormData,
): Promise<{ status: 'idle' | 'error'; message: string }> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!username || !password) {
    return { status: 'error' as const, message: 'Enter both username and password.' };
  }

  const user = await getUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { status: 'error' as const, message: 'Invalid username or password.' };
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
  });

  await setSessionCookie(token);
  redirect('/dashboard');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/login');
}
