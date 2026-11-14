# DEMO SCRIPT & ACADEMIC DEFENSE PREPARATION (EN)
**Project:** DrawToStory — Smart Children's Storytelling Platform from Hand Drawings  
**Course:** AI-Based Programming  
**Institution:** Phu Xuan University  
**Format:** 5-Minute Live Demonstration + Comprehensive Defense Q&A Outline  
**Academic Reference:** Course Syllabus Lessons 01 (GenAI Fundamentals), 06 (Prompt Engineering & Multimodality), 07 (AI Safety & RLS Governance)  

---

## PART 1: 5-MINUTE LIVE DEMONSTRATION SCRIPT

### Overview & Timing Matrix
| Segment | Time | Primary Focus | Screen / Route | Spoken Goal |
| :--- | :--- | :--- | :--- | :--- |
| **1. Hook & Authentication** | 00:00 – 01:00 | Problem statement, value proposition, secure authentication | `/login` → `/` | Introduce the platform, demonstrate 1-click server-authenticated demo login. |
| **2. AI Story Creation Pipeline** | 01:00 – 02:15 | Multimodal vision analysis, 3-layer safety, story generation | `/create` | Upload drawing, explain vision grounding and real-time generation. |
| **3. Story Reading & Kid Mode** | 02:15 – 03:30 | Interactive 3D flipbook, TTS audio, distraction-free kid sandbox | `/story/:id` → `/kid` | Demonstrate digital picture book, Ken Burns zoom, and parental PIN gate. |
| **4. Admin AI Governance** | 03:30 – 04:15 | Responsible AI, moderation queue, cost & token monitoring | `/admin` → `/admin/queue` | Showcase Human-in-the-Loop review, RLS security, and token expenditure. |
| **5. Technical Wrap-up & Q&A** | 04:15 – 05:00 | Architecture summary, Zero-Trust compliance, Q&A transition | Full Stack Architecture | Summarize core engineering highlights and open the defense floor. |

---

### Detailed Minute-by-Minute Script

#### Minute 00:00 – 01:00: Introduction & Secure Access
- **Visual Action:** Display the landing/login screen (`/login`).
- **Narrator (Spoken):**
  > *"Good morning, esteemed committee members and professors. Welcome to DrawToStory — an educational AI platform that transforms children's hand-drawn artwork into grounded, pedagogical digital storybooks.*  
  > *Every child loves drawing, but static pictures often stop at the paper. DrawToStory utilizes Google Gemini 2.5 Flash through serverless Edge Functions to empower parents and children with personalized stories that strictly ground themselves in the child's own visual imagination.*  
  > *To begin, we demonstrate our server-authenticated demo access. When clicking 'Tài khoản Phụ huynh', the application invokes a secure Supabase Edge Function which authenticates against GoTrue server-side, returning an enterprise-grade JWT session without ever exposing credentials on the client."*
- **Action:** Click 'Tài khoản Phụ huynh', navigate smoothly to Parent Dashboard (`/`). Show child profile "Bé Hà (5 tuổi)".

#### Minute 01:00 – 02:15: Multimodal Creation & 3-Layer Safety Pipeline
- **Visual Action:** Navigate to `/create`. Upload an authentic child drawing (e.g. rainbow, sun, and house).
- **Narrator (Spoken):**
  > *"Now, let's create a new storybook. As soon as a photo is selected, our 3-Layer Responsible AI Pipeline activates.*  
  > *First, Layer 1 runs client-side pre-flight checks using HTML5 Canvas heuristics — analyzing Laplacian variance for blur and mean luminance for illumination. Non-drawing inputs like real human faces, document scans, or commercial logos are immediately filtered out to conserve API tokens and protect privacy.*  
  > *Second, Layer 2 sends the verified image to our Deno Edge Function `generate-story`. The server injects the secret Gemini API key and instructs Gemini 2.5 Flash using strict structured output schema. Notice how the prompt mandates 100% visual grounding: every character, object, and color in the tale must correspond to what the child actually drew.*  
  > *Third, Layer 3 computes a Faithfulness Score and Risk Score. If the risk score is below 25, the story is auto-approved; otherwise, it is safely quarantined into the Admin Moderation Queue."*
- **Action:** Watch the generation stages step by step: *Analyzing drawing → Creating narrative → Verifying safety → Formatting book*.

#### Minute 02:15 – 03:30: Interactive Dual-Page Reader & Kid Sandbox
- **Visual Action:** Open the newly generated storybook at `/story/:id`.
- **Narrator (Spoken):**
  > *"Here is the generated storybook. On desktop, we experience a realistic 3D two-page flipbook with page-turning physics. Notice the visual dynamics: on each page, the original drawing dynamically focuses on the specific character mentioned, applying a smooth Ken Burns pan-and-zoom effect.*  
  > *The Web Speech API synthesizes natural Vietnamese narration, highlighted in karaoke style. To ensure screen comfort during bedtime reading, we integrated the modern Screen Wake Lock API to prevent accidental display sleep.*  
  > *When parents hand the device to the child, they can activate 'Chế độ Bé' (Kid Mode). This triggers a sandboxed, fullscreen environment with zero external links, zero advertising, and no settings access. To exit, the adult must solve a dynamic arithmetic challenge or provide a salted parental PIN."*
- **Action:** Demonstrate turning pages, play TTS snippet, click 'Góc đọc của bé', show arithmetic exit challenge.

#### Minute 03:30 – 04:15: Admin AI Governance & Cost Management
- **Visual Action:** Switch to Admin role (`/admin`) using the Admin Demo login.
- **Narrator (Spoken):**
  > *"Responsible AI requires strict administrative oversight. Here in the Admin Governance Portal, we monitor the entire AI lifecycle in real time.*  
  > *Our KPI cards display total stories generated today, moderation rejection rates, and monthly API cost tracking against our strict $50 budget ceiling. The Recharts analytics read directly from our CSS design tokens.*  
  > *In the Moderation Queue (`/admin/queue`), human administrators inspect flagged submissions using a Split View interface. With keyboard shortcuts 'A' to Approve and 'R' to Reject, administrators can enforce pedagogical safety guidelines, logging all actions to an immutable audit table. Furthermore, analytical views in PostgreSQL are hardened with `security_invoker = true` to prevent unauthorized data exposure."*
- **Action:** Highlight KPI cards, show Moderation Queue split view, open Costs & Quotas tab.

#### Minute 04:15 – 05:00: Architectural Highlights & Q&A Transition
- **Visual Action:** Display system architecture diagram or return to dashboard.
- **Narrator (Spoken):**
  > *"To summarize our technical architecture: DrawToStory adheres to Zero-Trust Security by isolating the Gemini API key strictly within Supabase Edge Functions. PostgreSQL Row Level Security guarantees complete tenant isolation between family accounts. Finally, full GDPR Right-to-Erasure is supported via our automated `delete-account` microservice.*  
  > *The entire codebase passes automated WCAG 2.1 AA contrast verification, strict TypeScript compilation, and comprehensive fixture tests. Thank you for your attention, and we are now ready for the defense questions."*

---

## PART 2: ACADEMIC DEFENSE Q&A OUTLINE (10 QUESTIONS)

### Question 1: Hallucination Mitigation & Visual Grounding
- **Question:** *How does your architecture prevent hallucinations in generative LLMs when creating a narrative from a child's drawing?*
- **Core Answer (EN):**
  1. **Visual Grounding via Structured JSON Schema:** The system prompt constrains Gemini 2.5 Flash to first extract explicit visual entities (`detected_elements`, `color_palette`, `mood`) before generating story pages.
  2. **Strict Few-Shot Negative Constraints:** The system instructions explicitly forbid introducing primary entities not depicted in the canvas (e.g., *"If no animal is drawn, do not introduce a pet animal"*).
  3. **Algorithmic Faithfulness Scoring:** Layer 3 calculates a cross-entropy faithfulness metric comparing story keywords with detected visual labels; stories scoring below the minimum threshold (70%) are flagged for manual review rather than displayed to the child.
- **Key Course Terminology:** *Multimodal Grounding, Structured Schema Constraint, Hallucination Suppression, Few-Shot Prompting (Lesson 06).*

---

### Question 2: Model Selection Rationale (Gemini 2.5 Flash vs. Heavy Models)
- **Question:** *Why did you adopt Gemini 2.5 Flash instead of heavier models like GPT-4o or Gemini 1.5 Pro?*
- **Core Answer (EN):**
  1. **Multimodal Native Architecture:** Gemini 2.5 Flash features native vision-language processing without requiring external OCR or auxiliary image captioning models.
  2. **Latency SLAs:** For interactive educational apps, parent-child engagement drops significantly if generation exceeds 10 seconds. Gemini 2.5 Flash delivers complete 5-page storybooks in under 3.5 seconds.
  3. **Economic Sustainability:** At \$0.075 per million input tokens, Gemini 2.5 Flash allows operating within a strict \$50 monthly budget for over 10,000 story generations, making it economically viable for primary schools and families.
- **Key Course Terminology:** *Token Economics, Latency SLA, Native Multimodality, Model Trade-off Analysis (Lesson 01 & 06).*

---

### Question 3: API Key Security & Zero-Trust Defense
- **Question:** *How do you guarantee that your Gemini API key cannot be extracted by a tech-savvy user inspecting the browser's Network tab?*
- **Core Answer (EN):**
  1. **Zero Client Secrets:** The client-side application bundle (`dist/`) contains zero references to `GEMINI_API_KEY`.
  2. **Edge Function Reverse Proxy:** Story generation requests are dispatched to Supabase Edge Functions (`generate-story`). The Edge Function validates the caller's Supabase JWT bearer token, checks the user's daily quota, and injects the API key from `Deno.env.get('GEMINI_API_KEY')` directly into the upstream request header (`x-goog-api-key`).
  3. **CORS & Rate Limiting:** The Edge Functions enforce origin validation and client IP rate limiting (maximum 10 requests per minute).
- **Key Course Terminology:** *Zero-Trust Architecture, Server-Side Secret Isolation, Reverse Proxy Pattern, Bearer Token Validation (Lesson 07).*

---

### Question 4: Row Level Security (RLS) & Multi-Tenant Data Isolation
- **Question:** *How does your database prevent a parent from accessing or modifying another family's children or drawings?*
- **Core Answer (EN):**
  1. **Declarative PostgreSQL RLS:** Row Level Security is enabled on 100% of public tables (`profiles`, `children`, `drawings`, `stories`, `reading_events`).
  2. **Ownership Policies:** The `children` table enforces `parent_id = auth.uid()`. Downstream tables (`drawings`, `stories`) join through `child_id` with `exists (select 1 from public.children where children.id = child_id and children.parent_id = auth.uid())`.
  3. **Security Invoker on Views:** Analytical views (`v_daily_stats`, `v_cost_by_day`) specify `security_invoker = true`, ensuring queries execute under the caller's RLS boundaries rather than superuser privileges.
- **Key Course Terminology:** *Row Level Security (RLS), Declarative Access Control, Least Privilege Principle, Multi-Tenant Isolation (Lesson 07).*

---

### Question 5: Multi-Layer Defense in Depth for Child Safety
- **Question:** *Why is a single prompt filter insufficient for child safety, and how does your 3-layer pipeline solve this?*
- **Core Answer (EN):**
  1. **Defense in Depth Strategy:** Relying solely on an LLM prompt is vulnerable to prompt injection, edge cases, and unexpected model drift.
  2. **Layer 1 (Pre-Flight Heuristics):** Filters non-drawings, real human faces, and PII on client Canvas before incurring compute cost.
  3. **Layer 2 (Model Safety Filters):** Leverages Gemini's built-in HarmCategory thresholds set to `BLOCK_LOW_AND_ABOVE` for hate speech, harassment, sexual content, and dangerous content.
  4. **Layer 3 (Post-Generation Moderation & Human-in-the-Loop):** Analyzes the generated text against a Vietnamese pedagogical keyword blocklist and auto-quarantines edge cases into the Admin review queue.
- **Key Course Terminology:** *Defense in Depth, Safety Guardrails, Harm Categories, Human-in-the-Loop (HITL) (Lesson 07).*

---

### Question 6: AI-Generated Code Verification & Quality Control
- **Question:** *How did you ensure that code suggested by AI coding assistants did not introduce regressions, security flaws, or UI slop?*
- **Core Answer (EN):**
  1. **Automated Verification Pipeline:** Every AI-assisted change had to pass four independent verification gates before being merged: `npm run build` (bundling), `npm run lint` (ESLint), `tsc --noEmit` (strict static typing), and `node scripts/test-pipeline.js` (business logic regression).
  2. **Accessibility Gating:** Custom script `check-contrast.js` enforces WCAG 2.1 AA contrast ratios ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text) across all 19 token pairs, rejecting commits automatically on failure.
  3. **Human Peer Review & Overrides:** As documented in `AI-INTERACTION-LOG.md`, several AI suggestions were explicitly rejected, such as improper contrast colors, public storage buckets, and client-side password bypasses.
- **Key Course Terminology:** *Static Analysis, Automated Regression Testing, WCAG AA Compliance, Code Verification Pipeline (Lesson 08).*

---

### Question 7: Handling Fallback & Resilience During Upstream API Outages
- **Question:** *What happens if Google Gemini API experiences an outage, high latency, or returns a 503 error?*
- **Core Answer (EN):**
  1. **Graceful Error Propagation:** The Edge Function wraps external API invocations in structured `try...catch` blocks with a 25-second abort controller timeout, returning clear Vietnamese localized error messages (`AI_TIMEOUT`, `AI_UPSTREAM_ERROR`).
  2. **Exponential Backoff:** The client service implements exponential retry logic for transient network failures.
  3. **Zero State Corruption:** Incomplete generations never write corrupted story rows to the database; the UI resets gracefully and offers parents the option to retry without deducting their daily quota.
- **Key Course Terminology:** *Resilience Engineering, Graceful Degradation, Circuit Breaking, Idempotency (Lesson 01).*

---

### Question 8: Privacy Regulations & GDPR Right to Erasure
- **Question:** *How does DrawToStory comply with child privacy laws such as COPPA and GDPR?*
- **Core Answer (EN):**
  1. **Zero Real-Name / PII Requirement:** Children are registered solely by first name or nickname and age; no dates of birth, school names, or GPS locations are stored.
  2. **Storage Encryption & Signed URLs:** Drawings uploaded to Supabase Storage reside in private buckets and are accessed only via time-limited HMAC signed URLs (1-hour expiration).
  3. **Automated Right to Erasure (`delete-account`):** In accordance with GDPR Article 17, when a parent requests account deletion, a dedicated server microservice purges all drawing files from object storage, cascades deletion across all database tables, and removes the `auth.users` record.
- **Key Course Terminology:** *Privacy by Design, COPPA Compliance, GDPR Right to Erasure, HMAC Signed URLs (Lesson 07).*

---

### Question 9: Hyperparameter Optimization (Temperature, Top-P, System Prompts)
- **Question:** *What generation hyperparameters did you configure for Gemini 2.5 Flash, and why?*
- **Core Answer (EN):**
  1. **Temperature = 0.7:** Set moderately to encourage creative storytelling and playful figurative language appropriate for children, while remaining tightly bound to the drawing's elements (temperatures above 0.9 frequently caused hallucinations).
  2. **Top-P = 0.95 & Top-K = 40:** Ensures rich lexical diversity in Vietnamese vocabulary without introducing obscure or archaic phrasing.
  3. **Role & Pedagogical Persona:** The System Prompt primes the model as *"Bác Gấu Kể Chuyện"* (Uncle Bear Storyteller), enforcing a warm, reassuring tone, 30–50 words per page, and a moral conclusion.
- **Key Course Terminology:** *Sampling Hyperparameters, Temperature Tuning, Nucleus Sampling (Top-P), Persona Priming (Lesson 06).*

---

### Question 10: Protection Against Prompt Injection & Adversarial Inputs
- **Question:** *Could an older child write an adversarial prompt inside the drawing to trick the AI into generating inappropriate content?*
- **Core Answer (EN):**
  1. **Visual Entity Grounding Constraint:** Gemini's system instructions explicitly dictate that text written on the drawing paper must be treated solely as labels or decorative elements, never as meta-instructions or prompt overrides.
  2. **Pre-Generation Safety Scanning:** If the image contains dense blocks of handwriting or printed text, Layer 1 flags the image as `screenshot_text` rather than `child_drawing`, rejecting it before prompt submission.
  3. **Post-Generation Safety Classifier:** Even if an adversarial injection were parsed, Layer 3's independent content classifier intercepts sensitive keywords before storage, quarantining the record.
- **Key Course Terminology:** *Indirect Prompt Injection, Adversarial Image Defense, Input Sanitization, Multi-Modal Guardrails (Lesson 06 & 07).*
