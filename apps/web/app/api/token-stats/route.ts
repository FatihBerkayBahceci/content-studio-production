import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface TokenStats {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_calls: number;
  avg_input_per_call: number;
  avg_output_per_call: number;
  estimated_cost_usd: number;
}

interface ProviderStats {
  api_provider: string;
  model_name: string;
  total_input: number;
  total_output: number;
  call_count: number;
}

interface ProjectStats {
  project_id: number;
  main_keyword: string;
  total_input: number;
  total_output: number;
  total_cost: number;
  call_count: number;
}

interface DailyStats {
  date: string;
  input_tokens: number;
  output_tokens: number;
  call_count: number;
}

// Gemini pricing (per 1M tokens) - gemini-2.0-flash
const GEMINI_INPUT_PRICE = 0.075;  // $0.075 per 1M input tokens
const GEMINI_OUTPUT_PRICE = 0.30;  // $0.30 per 1M output tokens

// OpenAI pricing (per 1M tokens) - gpt-4o-mini
const OPENAI_INPUT_PRICE = 0.15;   // $0.15 per 1M input tokens
const OPENAI_OUTPUT_PRICE = 0.60;  // $0.60 per 1M output tokens

function calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
  const inputM = inputTokens / 1000000;
  const outputM = outputTokens / 1000000;

  if (provider === 'google' || provider === 'gemini') {
    return (inputM * GEMINI_INPUT_PRICE) + (outputM * GEMINI_OUTPUT_PRICE);
  } else if (provider === 'openai') {
    return (inputM * OPENAI_INPUT_PRICE) + (outputM * OPENAI_OUTPUT_PRICE);
  }
  return 0;
}

// GET - Get token usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const clientId = searchParams.get('client_id');
    const toolName = searchParams.get('tool');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by'); // 'project', 'provider', 'daily', 'workflow'

    // Build WHERE clause
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (projectId) {
      conditions.push('project_id = ?');
      params.push(parseInt(projectId));
    }
    if (clientId) {
      conditions.push('client_id = ?');
      params.push(parseInt(clientId));
    }
    if (toolName) {
      conditions.push('tool_name = ?');
      params.push(toolName);
    }
    if (startDate) {
      conditions.push('created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('created_at <= ?');
      params.push(endDate + ' 23:59:59');
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Overall summary
    const [summary] = await query<TokenStats[]>(`
      SELECT
        COALESCE(SUM(tokens_input), 0) as total_input_tokens,
        COALESCE(SUM(tokens_output), 0) as total_output_tokens,
        COALESCE(SUM(tokens_input), 0) + COALESCE(SUM(tokens_output), 0) as total_tokens,
        COUNT(*) as total_calls,
        ROUND(COALESCE(AVG(tokens_input), 0), 0) as avg_input_per_call,
        ROUND(COALESCE(AVG(tokens_output), 0), 0) as avg_output_per_call,
        COALESCE(SUM(cost_usd), 0) as estimated_cost_usd
      FROM api_usage_tracking
      ${whereClause}
    `, params);

    // By provider/model
    const byProvider = await query<ProviderStats[]>(`
      SELECT
        api_provider,
        COALESCE(model_name, api_provider) as model_name,
        COALESCE(SUM(tokens_input), 0) as total_input,
        COALESCE(SUM(tokens_output), 0) as total_output,
        COUNT(*) as call_count
      FROM api_usage_tracking
      ${whereClause}
      GROUP BY api_provider, model_name
      ORDER BY total_input DESC
    `, params);

    // Calculate estimated costs per provider
    const providerWithCosts = byProvider.map(p => ({
      ...p,
      estimated_cost: calculateCost(p.api_provider, p.total_input, p.total_output)
    }));

    // By project (if not filtered to single project)
    let byProject: ProjectStats[] = [];
    if (!projectId) {
      byProject = await query<ProjectStats[]>(`
        SELECT
          a.project_id,
          COALESCE(kp.main_keyword, CONCAT('Project ', a.project_id)) as main_keyword,
          COALESCE(SUM(a.tokens_input), 0) as total_input,
          COALESCE(SUM(a.tokens_output), 0) as total_output,
          COALESCE(SUM(a.cost_usd), 0) as total_cost,
          COUNT(*) as call_count
        FROM api_usage_tracking a
        LEFT JOIN keyword_projects kp ON kp.id = a.project_id
        ${whereClause}
        GROUP BY a.project_id, kp.main_keyword
        HAVING a.project_id IS NOT NULL
        ORDER BY total_input DESC
        LIMIT 20
      `, params);
    }

    // Daily trend (last 30 days)
    const dailyTrend = await query<DailyStats[]>(`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(tokens_input), 0) as input_tokens,
        COALESCE(SUM(tokens_output), 0) as output_tokens,
        COUNT(*) as call_count
      FROM api_usage_tracking
      ${whereClause ? whereClause + ' AND' : 'WHERE'} created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, params);

    // By workflow
    const byWorkflow = await query<any[]>(`
      SELECT
        COALESCE(workflow_name, tool_name) as workflow_name,
        tool_name,
        COALESCE(SUM(tokens_input), 0) as total_input,
        COALESCE(SUM(tokens_output), 0) as total_output,
        COUNT(*) as call_count,
        ROUND(AVG(response_time_ms), 0) as avg_response_time
      FROM api_usage_tracking
      ${whereClause}
      GROUP BY workflow_name, tool_name
      ORDER BY total_input DESC
    `, params);

    // Calculate total estimated cost
    const totalEstimatedCost = providerWithCosts.reduce((sum, p) => sum + p.estimated_cost, 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          ...summary,
          estimated_cost_usd: totalEstimatedCost.toFixed(4)
        },
        by_provider: providerWithCosts,
        by_project: byProject,
        by_workflow: byWorkflow,
        daily_trend: dailyTrend,
        pricing_info: {
          gemini_input_per_1m: GEMINI_INPUT_PRICE,
          gemini_output_per_1m: GEMINI_OUTPUT_PRICE,
          openai_input_per_1m: OPENAI_INPUT_PRICE,
          openai_output_per_1m: OPENAI_OUTPUT_PRICE
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch token stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token statistics' },
      { status: 500 }
    );
  }
}
