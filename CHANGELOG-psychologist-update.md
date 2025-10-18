# Psychologist Persona Update - Model List Modernization

## Date: January 2025

## Summary
Updated the psychologist persona's AI model detection list to reflect the latest models available as of October 2025. This includes replacing outdated models with their newer versions and adding new models from various providers.

## Changes Made

### 1. Schema Updates (`lib/reportSchemas.ts`)

**Design Decision: No 'unknown' Fallback**
- Removed 'unknown' from model enum to force AI to make specific choices
- AI must analyze patterns and select the most appropriate model
- This encourages more thoughtful analysis rather than lazy defaults

**Model List Changes:**
- **Removed outdated models:**
  - GPT-4, GPT-4 Turbo → Replaced with GPT-5 Pro, GPT-5-codex, o3, o3-mini, o4-mini, GPT-4o
  - Claude 3.5 Sonnet, Claude 3 Opus → Replaced with Claude Sonnet 4, 4.5, Opus 4, Haiku 4.5
  - Gemini 2.0 Pro, 1.5 Pro → Replaced with Gemini 2.5 Pro, Flash, Flash-Lite
  - Llama 3.3, 3.1 → Replaced with Llama 4 Scout, Maverick, 3.3 70B
  - Qwen 2.5 → Replaced with Qwen3, Max, 235B-A22B
  - Mistral Large → Replaced with Mistral Large 2, Medium 3, Codestral 25
  - GLM-4 → Replaced with GLM-4.5, 4.6

- **Added new models:**
  - Grok 3 (xAI)
  - Kimi K2 (Moonshot)
  - DeepSeek V3.2-Exp

**Confidence Values:**
- Changed from Russian (`высокая`, `средняя`, `низкая`) to English (`high`, `medium`, `low`)
- This aligns with the AI's output format while maintaining Russian display in the UI

**Total Models:** 30 models (up from 13)
- Removed 'unknown' to force AI to make specific model choices based on analysis

### 2. AI Schema Updates (`lib/ai/schemas.ts`)

Updated the JSON schema for AI responses to match the new model list and confidence values:
- Updated `getPersonaJsonSchema()` for `psychologist` case
- Synchronized enum values with `reportSchemas.ts`

### 3. UI Component Updates (`components/multi-style-summary-generator.tsx`)

**Color Mapping:**
- Updated `getModelColor()` function with 30 model colors
- Organized by provider with color themes:
  - OpenAI: Green shades
  - Anthropic: Orange shades
  - Google: Blue shades
  - Meta: Purple shades
  - DeepSeek: Indigo shades
  - Qwen: Cyan shades
  - Mistral: Lime shades
  - Others: Red/orange/teal

**Confidence Display:**
- Updated confidence badge display to show Russian labels (`высокая`, `средняя`, `низкая`)
- Maintained English values in data structure for consistency with AI output

### 4. Telegram Integration (`lib/telegram.ts`)

- Already using English confidence values (`high`, `medium`, `low`)
- No changes needed - already compatible with new schema

### 5. AI Prompts (`lib/ai/prompts.ts`)

Updated the psychologist persona prompt with:
- Instructions to use only current models (October 2025)
- Priority model pool listing
- Explicit instructions to avoid outdated models
- Requirement to always choose a specific model (no 'unknown' fallback)

### 6. Documentation Updates (`.kiro/specs/psychologist-persona-update/design.md`)

Updated design document to reflect:
- New model list with 31 models
- Updated model rationale section
- Updated Zod schema examples
- Updated JSON schema examples
- Updated example outputs
- Updated color mapping function
- Updated confidence value references
- Updated data structure documentation

## Rationale

### Why Update the Model List?

1. **Accuracy:** The original list included models from 2023-2024 that are now outdated
2. **Relevance:** Users expect references to current, state-of-the-art models
3. **Humor:** The joke works better when models are recognizable and current
4. **Diversity:** Expanded list provides more variety for different writing styles

### Why English Confidence Values?

1. **Consistency:** AI models typically output English enum values
2. **Validation:** Easier to validate with standard Zod schemas
3. **Internationalization:** Easier to add other languages in the future
4. **Display:** Russian labels are still shown in the UI for user-facing text

## Testing Checklist

- [x] Schema validation passes (Zod)
- [x] TypeScript compilation succeeds
- [x] No ESLint errors
- [x] UI component renders correctly
- [x] Telegram formatting handles new values
- [ ] Manual test: Generate psychologist report
- [ ] Manual test: Verify model colors display correctly
- [ ] Manual test: Verify confidence badges show Russian text
- [ ] Manual test: Send report to Telegram
- [ ] Manual test: Verify Telegram formatting is correct

## Migration Notes

**No database migration needed** - Reports are generated on-demand and not stored.

**No breaking changes** - This is a schema update that affects new reports only.

**Backward compatibility** - Old reports (if any were stored) would fail validation, but since reports are ephemeral, this is not an issue.

## Future Considerations

1. **Model List Maintenance:** Consider creating a separate configuration file for model lists to make updates easier
2. **Dynamic Model Loading:** Could fetch model list from an API to stay current automatically
3. **Model Versioning:** Track which model list version was used for each report
4. **User Feedback:** Allow users to suggest new models or report outdated ones

## Files Modified

1. `lib/reportSchemas.ts` - Schema definitions
2. `lib/ai/schemas.ts` - JSON schema for AI
3. `lib/ai/prompts.ts` - AI prompt instructions
4. `components/multi-style-summary-generator.tsx` - UI rendering and colors
5. `.kiro/specs/psychologist-persona-update/design.md` - Documentation

## Files Verified (No Changes Needed)

1. `lib/telegram.ts` - Already using English confidence values
2. `lib/queries.ts` - No changes needed
3. `lib/report.ts` - No changes needed
4. `lib/db/builders.ts` - No changes needed

---

**Status:** ✅ Implementation Complete
**Next Step:** Manual testing with real data
