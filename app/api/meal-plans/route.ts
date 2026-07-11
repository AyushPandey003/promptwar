export const runtime = 'nodejs';

export async function GET() {
  return Response.json(
    {
      error: 'This endpoint has been retired. Use the server-action driven planner UI instead.',
    },
    { status: 410 },
  );
}

export async function POST() {
  return Response.json(
    {
      error: 'This endpoint has been retired. Use the server-action driven planner UI instead.',
    },
    { status: 410 },
  );
}
