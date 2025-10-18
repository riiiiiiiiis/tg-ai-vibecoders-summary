import { 
  reportSchema, 
  businessReportSchema, 
  psychologyReportSchema, 
  creativeReportSchema, 
  dailySummaryReportSchema, 
  aiPsychologistReportSchema 
} from '../reportSchemas';
import type { PersonaType } from '../reportSchemas';

// ========================================
// JSON SCHEMA HELPERS (DRY)
// ========================================

/**
 * Create string field schema
 */
function _stringField(minLength?: number, maxLength?: number) {
  const schema: any = { type: "string" };
  if (minLength) schema.minLength = minLength;
  if (maxLength) schema.maxLength = maxLength;
  return schema;
}

/**
 * Create array field schema
 */
function _arrayField(itemType: any, minItems?: number, maxItems?: number) {
  const schema: any = {
    type: "array",
    items: itemType
  };
  if (minItems !== undefined) schema.minItems = minItems;
  if (maxItems) schema.maxItems = maxItems;
  return schema;
}

/**
 * Create object field schema
 */
function _objectField(properties: any, required: string[]) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false
  };
}

/**
 * Create enum field schema
 */
function _enumField(values: string[]) {
  return {
    type: "string",
    enum: values
  };
}

/**
 * Get validation schema for persona type
 */
export function getPersonaSchema(persona: PersonaType) {
  switch (persona) {
    case 'business':
      return businessReportSchema;
    case 'psychologist':
      return psychologyReportSchema;
    case 'ai-psychologist':
      return aiPsychologistReportSchema;
    case 'creative':
      return creativeReportSchema;
    case 'daily-summary':
      return dailySummaryReportSchema;
    case 'curator':
    case 'twitter':
    case 'reddit':
    default:
      return reportSchema;
  }
}

/**
 * Get JSON schema for AI model response format
 */
export function getPersonaJsonSchema(persona: PersonaType) {
  switch (persona) {
    case 'business':
      return _objectField({
        monetization_ideas: _arrayField(_stringField(), 3, 6),
        revenue_strategies: _arrayField(_stringField(), 3, 6),
        roi_insights: _arrayField(_stringField(), 3, 5)
      }, ["monetization_ideas", "revenue_strategies", "roi_insights"]);
      
    case 'psychologist':
      return _objectField({
        intro: _stringField(50, 500),
        participants: _arrayField(
          _objectField({
            name: _stringField(),
            model: _enumField([
              'GPT-5 Pro', 'GPT-5-codex', 'o3', 'o3-mini', 'o4-mini', 'GPT-4o',
              'Claude Sonnet 4', 'Claude Sonnet 4.5', 'Claude Opus 4', 'Claude Haiku 4.5',
              'Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini 2.5 Flash-Lite',
              'Llama 4 Scout', 'Llama 4 Maverick', 'Llama 3.3 70B',
              'DeepSeek V3', 'DeepSeek V3.2-Exp', 'DeepSeek R1',
              'Qwen3', 'Qwen3 Max', 'Qwen3 235B-A22B',
              'Mistral Large 2', 'Mistral Medium 3', 'Codestral 25',
              'GLM-4.5', 'GLM-4.6', 'Grok 3', 'Kimi K2'
            ]),
            confidence: _enumField(['low', 'medium', 'high']),
            reasoning: _stringField(50, 800)
          }, ["name", "model", "confidence", "reasoning"]),
          5, 10
        )
      }, ["intro", "participants"]);
      
    case 'ai-psychologist':
      return _objectField({
        group_atmosphere: _stringField(50, 400),
        psychological_archetypes: _arrayField(
          _objectField({
            name: _stringField(),
            archetype: _stringField(),
            influence: _stringField()
          }, ["name", "archetype", "influence"]),
          4, 8
        ),
        ai_model_personalities: _arrayField(
          _objectField({
            name: _stringField(),
            ai_model: _enumField(['GPT-5', 'Claude Sonnet 4.5', 'Gemini 2.5 Pro', 'GLM-4', 'DeepSeek V3', 'Llama 3.3', 'Qwen 2.5', 'Mistral Large']),
            confidence: _enumField(['high', 'medium', 'low']),
            reasoning: _stringField(20, 1000),
            traditional_archetype: _stringField()
          }, ["name", "ai_model", "confidence", "reasoning", "traditional_archetype"]),
          4, 8
        ),
        emotional_patterns: _arrayField(_stringField(), 3, 6),
        group_dynamics: _arrayField(_stringField(), 3, 5),
        ai_model_distribution: _objectField({
          dominant_model: _stringField(),
          model_counts: { type: "object", additionalProperties: { type: "number" } },
          diversity_score: _enumField(['high', 'medium', 'low']),
          interaction_chemistry: _stringField(50, 800)
        }, ["dominant_model", "model_counts", "diversity_score", "interaction_chemistry"])
      }, ["group_atmosphere", "psychological_archetypes", "ai_model_personalities", "emotional_patterns", "group_dynamics", "ai_model_distribution"]);
      
    case 'creative':
      return _objectField({
        creative_temperature: _stringField(50, 800),
        viral_concepts: _arrayField(_stringField(), 4, 7),
        content_formats: _arrayField(_stringField(), 3, 6),
        trend_opportunities: _arrayField(_stringField(), 3, 5)
      }, ["creative_temperature", "viral_concepts", "content_formats", "trend_opportunities"]);
      
    case 'daily-summary':
      return {
        type: "object",
        properties: {
          day_overview: { type: "string", minLength: 100, maxLength: 300 },
          key_events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                time: { type: "string" },
                event: { type: "string" },
                importance: { type: "string", enum: ["high", "medium", "low"] }
              },
              required: ["time", "event", "importance"],
              additionalProperties: false
            },
            minItems: 3,
            maxItems: 8
          },
          participant_highlights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                contribution: { type: "string" },
                impact: { type: "string" }
              },
              required: ["name", "contribution", "impact"],
              additionalProperties: false
            },
            minItems: 3,
            maxItems: 6
          },
          shared_links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                domain: { type: "string" },
                shared_by: { type: "string" },
                shared_at: { type: "string" },
                context: { type: "string" },
                category: { type: "string" }
              },
              required: ["url", "domain", "shared_by", "shared_at"],
              additionalProperties: false
            },
            minItems: 0,
            maxItems: 20
          },
          link_summary: {
            type: "object",
            properties: {
              total_links: { type: "number" },
              unique_domains: { type: "array", items: { type: "string" } },
              top_sharers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    count: { type: "number" }
                  },
                  required: ["name", "count"],
                  additionalProperties: false
                }
              },
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    count: { type: "number" },
                    examples: { type: "array", items: { type: "string" } }
                  },
                  required: ["name", "count", "examples"],
                  additionalProperties: false
                }
              }
            },
            required: ["total_links", "unique_domains", "top_sharers", "categories"],
            additionalProperties: false
          },
          discussion_topics: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 7 },
          daily_metrics: {
            type: "object",
            properties: {
              activity_level: { type: "string", enum: ["низкий", "средний", "высокий", "очень высокий"] },
              engagement_quality: { type: "string", enum: ["поверхностное", "среднее", "глубокое", "интенсивное"] },
              mood_tone: { type: "string", enum: ["позитивное", "нейтральное", "смешанное", "напряженное"] },
              productivity: { type: "string", enum: ["низкая", "средняя", "высокая", "очень высокая"] }
            },
            required: ["activity_level", "engagement_quality", "mood_tone", "productivity"],
            additionalProperties: false
          },
          next_day_forecast: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }
        },
        required: ["day_overview", "key_events", "participant_highlights", "shared_links", "link_summary", "discussion_topics", "daily_metrics", "next_day_forecast"],
        additionalProperties: false
      };
      
    case 'curator':
    case 'twitter':
    case 'reddit':
    default:
      return _objectField({
        summary: _stringField(),
        themes: _arrayField(_stringField(), undefined, 8),
        insights: _arrayField(_stringField(), undefined, 8)
      }, ["summary", "themes", "insights"]);
  }
}