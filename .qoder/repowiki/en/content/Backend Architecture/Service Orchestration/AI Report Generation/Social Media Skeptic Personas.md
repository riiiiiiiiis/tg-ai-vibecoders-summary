# Social Media Skeptic Personas

<cite>
**Referenced Files in This Document**   
- [ai.ts](file://lib/ai.ts#L588-L940)
- [reportSchemas.ts](file://lib/reportSchemas.ts#L0-L111)
- [multi-style-summary-generator.tsx](file://components/multi-style-summary-generator.tsx#L29-L78)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Functionality](#core-functionality)
3. [Twitter Persona Analysis](#twitter-persona-analysis)
4. [Reddit Persona Analysis](#reddit-persona-analysis)
5. [Shared Report Structure](#shared-report-structure)
6. [Implementation Details](#implementation-details)

## Introduction
The AI report generation system incorporates social media skeptic personas that provide critical, often cynical analysis of Telegram chat dynamics, mirroring the discourse patterns found on Twitter/X and Reddit platforms. These personas—twitter and reddit—are designed to help community owners see beyond surface-level positivity by identifying manipulation tactics, echo chambers, and hidden agendas within their communities. Both personas use the standard reportSchema but employ distinct system prompts that shape their analytical approach, offering valuable insights into the underlying power structures and problematic behaviors that might otherwise go unnoticed in community discussions.

## Core Functionality
The social media skeptic personas operate within the AI report generation framework by analyzing Telegram chat data through the lens of typical social media skepticism. The system leverages the getPersonaPrompt function to generate persona-specific prompts that guide the AI's analysis. These personas share the same JSON output structure defined in reportSchema, which includes summary, themes, and insights fields, ensuring consistency in report formatting while allowing for distinct analytical perspectives. The personas are invoked through API calls that specify the desired persona parameter, triggering the appropriate prompt and analysis style.

**Section sources**
- [ai.ts](file://lib/ai.ts#L588-L940)
- [reportSchemas.ts](file://lib/reportSchemas.ts#L0-L111)

## Twitter Persona Analysis
The twitter persona emulates the critical, often sarcastic tone of a typical Twitter/X user, providing a no-holds-barred analysis of Telegram chat dynamics. This persona is specifically designed to identify attention-seeking behavior, spam, and hidden motivations behind user interactions. The system prompt for this persona instructs the AI to "not hesitate to call spam spam and attention-seekers by their names" while searching for "manipulation tactics and call them out." The analysis focuses on revealing what participants truly want from the chat, identifying problematic patterns like echo chambers and manipulation attempts, and providing "hard recommendations" without sugar-coating. This persona helps community owners understand the self-serving motivations that may drive participation, such as users seeking attention or attempting to promote their own content.

**Section sources**
- [ai.ts](file://lib/ai.ts#L588-L940)

## Reddit Persona Analysis
The reddit persona adopts the analytical yet cynical perspective of an experienced Reddit power user, focusing on community dynamics, moderation issues, and systemic problems within the chat. This persona is particularly attuned to concepts like "karma farming," "circlejerk patterns," and "brigade patterns" that are common in online communities. The system prompt instructs the AI to analyze the chat's "karma system"—who receives attention and why—and to identify "echo chambers, hivemind and manipulation attempts." The analysis classifies users into "Reddit-style archetypes" such as karma farmers, genuine contributors, and concern trolls, while also examining moderation gaps and power dynamics. This persona provides "moderator recommendations" for improving discourse quality and preventing the degradation of discussions, helping community owners address systemic issues that might be overlooked in more positive analyses.

**Section sources**
- [ai.ts](file://lib/ai.ts#L588-L940)

## Shared Report Structure
Both the twitter and reddit personas utilize the standard reportSchema defined in the system, which ensures consistency in the output format while allowing for distinct analytical content. This shared schema includes three core components: a summary field (600-900 characters) that provides an overview of the chat dynamics, a themes array (3-5 items) that identifies uncomfortable truths the community avoids discussing, and an insights array (3-5 items) that offers direct recommendations without sugar-coating. This consistent structure allows community owners to easily compare the analyses from both personas, gaining complementary perspectives on the same community. The use of the same schema across personas simplifies integration with the frontend components that render these reports, as demonstrated in the multi-style-summary-generator.tsx file.

**Section sources**
- [reportSchemas.ts](file://lib/reportSchemas.ts#L0-L111)
- [multi-style-summary-generator.tsx](file://components/multi-style-summary-generator.tsx#L29-L78)

## Implementation Details
The implementation of these social media skeptic personas is centered around the getPersonaPrompt function in ai.ts, which returns persona-specific prompts based on the requested persona type. Both the twitter and reddit personas are included in the PersonaType union type, allowing them to be specified as parameters in API calls. When a report is generated with either persona, the system uses the reportSchema to validate the JSON output, ensuring structural consistency. The frontend component multi-style-summary-generator.tsx provides a user interface for selecting and generating reports with these personas, displaying them with appropriate labels and descriptions. The system's design allows for easy extension with additional personas while maintaining a consistent interface and output format, enabling community owners to gain multiple perspectives on their chat dynamics from a single data source.

**Section sources**
- [ai.ts](file://lib/ai.ts#L320-L373)
- [multi-style-summary-generator.tsx](file://components/multi-style-summary-generator.tsx#L29-L78)