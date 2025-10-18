# Implementation Plan

- [x] 1. Update prompt configuration for psychologist persona
  - Modify `lib/ai/prompts.ts` to change psychologist persona from serious psychological analysis to humorous "guess the LLM model" style
  - Update `systemRole` to describe AI detective analyzing writing styles
  - Update `taskDescription` to specify new JSON output format
  - Update `outputFormat` to reflect new structure: `{"intro": "...", "participants": [...], "summary": "..."}`
  - Update `constraints` array with new instructions for lexical analysis and model detection
  - Ensure instructions emphasize using @username format for mentions and analyzing real message patterns
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

- [x] 2. Update Zod schema and TypeScript types
  - [x] 2.1 Update `lib/reportSchemas.ts` with new psychologyReportSchema
    - Replace existing schema with new structure: intro, participants array, summary
    - Define participants object with: name, model (enum of 13 models), confidence (enum), reasoning
    - Set validation constraints: intro (50-300 chars), participants (5-10 items), reasoning (50-500 chars), summary (100-400 chars)
    - Update `PsychologyReport` TypeScript type to match new schema
    - _Requirements: 2.1, 2.2, 3.2, 4.1_

  - [x] 2.2 Update `lib/ai/schemas.ts` JSON schema for AI
    - Modify `getPersonaJsonSchema` function for 'psychologist' case
    - Use helper functions `_objectField`, `_arrayField`, `_stringField`, `_enumField`
    - Define enum with 13 model names: GPT-4, GPT-4 Turbo, Claude 3.5 Sonnet, Claude 3 Opus, Gemini 2.0 Pro, Gemini 1.5 Pro, DeepSeek V3, DeepSeek R1, Llama 3.3, Llama 3.1, Qwen 2.5, Mistral Large, GLM-4
    - Define confidence enum: 'высокая', 'средняя', 'низкая'
    - _Requirements: 2.1, 2.2, 3.2_

- [x] 3. Update Telegram formatting for new psychologist report
  - Modify `formatPersonaReport` function in `lib/telegram.ts` to handle new psychologist format
  - Add condition for `persona === 'psychologist'` with new rendering logic
  - Use `_buildTextSection` for intro and summary
  - Create custom formatting for participants list with numbered items
  - Implement name formatting: `<a href="tg://user?id=username">@username</a>` for mentions, `<b>Name</b>` for regular names
  - Add confidence emoji badges: 🎯 (высокая), 🤔 (средняя), ❓ (низкая)
  - Wrap model names in `<code>` tags for monospace font
  - Wrap reasoning in `<i>` tags for italic
  - Use existing `escapeHTML()` function for all user-generated content
  - _Requirements: 1.2, 3.3, 3.4, 3.5_

- [x] 4. Update UI component rendering
  - [x] 4.1 Add helper function for model colors
    - Create `getModelColor(model: string)` function in `components/multi-style-summary-generator.tsx`
    - Define color mapping for all 13 models with distinct colors
    - Return default color for unknown models
    - _Requirements: 3.4_

  - [x] 4.2 Update renderReportContent for psychologist persona
    - Modify `renderReportContent` function in `components/multi-style-summary-generator.tsx`
    - Replace existing psychologist rendering with new format
    - Render intro section with italic styling
    - Render participants as grid of cards with left border in persona color
    - Display participant name in bold, model in colored badge, confidence badge
    - Show reasoning text below with proper line height
    - Render summary section at the end
    - _Requirements: 3.4, 4.2_

- [x] 5. Manual testing and validation
  - [x] 5.1 Test report generation
    - Generate psychologist report from dashboard
    - Verify JSON structure matches schema
    - Verify 5-10 participants are included
    - Verify all fields are populated correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2_

  - [x] 5.2 Test UI display
    - Verify intro, participants, and summary sections render correctly
    - Verify model color badges display with correct colors
    - Verify confidence badges show correct emoji
    - Verify reasoning text is readable and properly formatted
    - _Requirements: 3.4, 4.2_

  - [x] 5.3 Test Telegram integration
    - Click "Предпросмотр и отправить" button
    - Verify HTML preview shows correct formatting
    - Verify `<code>`, `<b>`, `<i>` tags are visible in preview
    - Send message to Telegram chat
    - **Verify @username mentions create notifications in Telegram**
    - Verify HTML formatting renders correctly in Telegram
    - Verify emojis display properly
    - _Requirements: 1.2, 3.3, 3.5_
