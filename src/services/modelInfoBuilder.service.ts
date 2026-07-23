import type { AiModel } from '@prisma/client';
import { BASE_INSTRUCTIONS, INSTRUCTIONS_TEMPLATE, INSTRUCTIONS_VARIABLES } from './modelInstructionsTemplate.service.js';

/**
 * Builds a full `ModelInfo`-shaped object (matching Вспышка's Rust protocol, the exact JSON shape
 * of models-manager/models.json) for one AiModel row.
 *
 * Most fields here are fixed plumbing that every model shares (Codex-protocol concepts like
 * apply_patch_tool_type, truncation_policy, or the base instructions/personality templates) rather
 * than something this backend has any real per-model data for. Only the fields below actually vary
 * per row, sourced from the AiModel table:
 *   slug, display_name, description, context_window, max_context_window, priority,
 *   supports_reasoning_summaries (from supportsReasoning), supports_parallel_tool_calls (from
 *   supportsFunctionCalling).
 *
 * DeepSeek's reasoning mode is a fixed on/off choice made by picking the deepseek-reasoner product
 * key rather than a selectable effort dial, so supported_reasoning_levels/default_reasoning_level
 * stay empty/null for every model instead of inventing low/medium/high semantics that don't apply.
 */
export function buildModelInfo(row: AiModel): Record<string, unknown> {
  return {
    slug: row.key,
    display_name: row.label,
    description: row.description,
    default_reasoning_level: null,
    supported_reasoning_levels: [],
    shell_type: 'shell_command',
    visibility: 'list',
    minimal_client_version: '0.124.0',
    supported_in_api: true,
    priority: row.priority,
    availability_nux: null,
    upgrade: null,
    default_service_tier: null,
    service_tiers: [],
    additional_speed_tiers: [],
    base_instructions: BASE_INSTRUCTIONS,
    model_messages: {
      instructions_template: INSTRUCTIONS_TEMPLATE,
      instructions_variables: INSTRUCTIONS_VARIABLES,
      approvals: null,
    },
    include_skills_usage_instructions: false,
    supports_reasoning_summaries: row.supportsReasoning,
    default_reasoning_summary: 'none',
    reasoning_summary_format: null,
    support_verbosity: false,
    default_verbosity: null,
    apply_patch_tool_type: 'freeform',
    web_search_tool_type: 'text',
    truncation_policy: { mode: 'tokens', limit: 10_000 },
    supports_parallel_tool_calls: row.supportsFunctionCalling,
    supports_image_detail_original: false,
    context_window: row.contextWindow,
    max_context_window: row.contextWindow,
    auto_compact_token_limit: null,
    comp_hash: `arlist-${row.key}`,
    experimental_supported_tools: [],
    input_modalities: ['text'],
    supports_search_tool: false,
    use_responses_lite: true,
    auto_review_model_override: null,
    tool_mode: null,
    multi_agent_version: null,
    prefer_websockets: false,
    available_in_plans: ['free'],
  };
}
