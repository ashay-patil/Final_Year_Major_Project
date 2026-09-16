# Implementation Directive: Cashless Health Insurance Claim Automation
### (for Antigravity — extends the existing MediFlow AI hospital discharge system)

You are extending an **existing** FastAPI + MongoDB + LangChain/LangGraph + React hospital
management system called **MediFlow AI**. This is a student/demo project, not a production
healthcare system. Do not seek or assume real ABDM/HCX/payment-gateway production credentials —
build everything to run fully offline against mock adapters, with real adapters as optional,
swappable, disabled-by-default implementations.

Read this entire document before writing any code. It is long because the workflow has many
states and several regulated-sounding subsystems (ABHA/ABDM, HCX/NHCX, FHIR) that are easy to
over-build or under-scope. Sections 15 and 20 explicitly tell you where you have freedom to
deviate — everywhere else, follow the structure given, because the state machine and the
human-in-the-loop (HITL) boundaries are the part that must stay deterministic.

---

## 0. Fit with the existing codebase — read this first

**Important caveat on everything below in this section:** the file paths, collection names, and
component conventions described here are based on an earlier snapshot of this project. The
person you're working with has since made manual edits directly to the codebase, so the actual
current state may differ — files may have been renamed, moved, merged, or restructured; new
conventions may have been introduced; some of the "existing" things named below may no longer
look exactly like this. **Treat this section as a strong prior, not ground truth.**

Before writing any code:
1. Actually open and read `backend/app.py`, `backend/database.py`, the current contents of
   `backend/agents/`, `backend/ml/`, and `frontend/src/pages/MainApp.jsx` /
   `frontend/src/components/` to see what's really there right now.
2. Where reality matches this section, follow it as described.
3. Where reality has diverged — a different collection-naming style, a different modal-prop
   convention, routes split across multiple files instead of one `app.py`, a state-management
   library introduced in the frontend, etc. — **match the actual current codebase's convention,
   not this document's description of an older one.** The goal stated throughout this doc
   ("extend existing patterns, don't build a parallel system") is the actual instruction;
   this section's specifics are just my best guess at what that means concretely, and you have
   full authority to override the guess with what you observe.
4. If you find the codebase has evolved in a way that makes a section of this document
   meaningfully wrong (not just cosmetically different), say so and explain what you did
   instead, rather than silently forcing a fit.

With that caveat, here's what this project **looked like as of our last sync**:
- `backend/app.py` — FastAPI app, all routes currently registered directly on `app`
- `backend/database.py` — exposes Mongo collections as module-level variables, e.g.
  `patients_collection`, `discharge_logs_collection`, `nurse_tasks_collection`
- `backend/agents/` — one file per LLM agent (`discharge_agent.py`, `nurse_agent.py`,
  `pharmacy_agent.py`, `summary_agent.py`, `billing_agent.py`, `chat_agent.py`,
  `simplify_agent.py`, `interaction_checker.py`), each instantiating its own
  `ChatGroq(api_key=os.getenv("GROQ_API_KEY"), model="openai/gpt-oss-120b", temperature=...)`
- `backend/ml/` — non-LLM logic (`risk_model.py`, `anomaly_detector.py`, `xray_diagnosis.py`)
- `backend/email_service.py` — existing email sending used by the Billing Portal's
  "Send to Guardian" flow
- `frontend/src/pages/MainApp.jsx` — a single-file React app: one `apiService` object with all
  `fetch()` calls, one portal component per section (`DoctorPortal`, `NursePortal`,
  `PharmacyPortal`, `BillingPortal`, `SummaryPortal`), a sidebar nav array, and a
  `renderView()` switch statement that routes `currentView` strings to portal components
- `frontend/src/components/` — extracted modal components (`RiskGauge.jsx`,
  `VitalsMonitor.jsx`, `PatientTimeline.jsx`, `QRCodeDisplay.jsx`, `DrugInteractionChecker.jsx`,
  `ChatBot.jsx`) that take `{ patientId, patientName, isOpen, onClose }` props and render
  their own full-screen modal shell

**Build this feature as a natural extension of these conventions, not a parallel system.**
Concretely:
- New backend logic lives under `backend/insurance/` (new package), not scattered into
  `app.py`. Register its routes via a `fastapi.APIRouter(prefix="/api/insurance")` included
  into the main app with `app.include_router(insurance_router)` — `app.py` should gain roughly
  one import and one `include_router` line, nothing else.
- Reuse `email_service.py` as the base of the new `EmailAdapter` rather than writing a second,
  parallel email sender.
- Reuse the existing `ChatGroq(...)` instantiation pattern for every new LLM call. Use
  `temperature=0` for anything structured (extraction, classification) and a low but nonzero
  temperature only for free-text drafting (claim cover letters, patient-facing notices).
- New frontend components go in `frontend/src/components/insurance/` and follow the existing
  `{ patientId, patientName, isOpen, onClose }` modal-component contract used by `RiskGauge`
  and `VitalsMonitor` — **do not invent a different prop contract**.
- Add new methods to the existing `apiService` object in `MainApp.jsx` rather than creating a
  second API-calling convention.
- Extend the existing **Billing Portal** with an "Insurance Claim" section for
  cashless-selected patients, rather than building a fully separate top-level portal. A
  separate top-level **"Insurance Ops" portal** (staff-facing claim queue across all patients,
  insurer directory admin, HITL review queue) is appropriate as a new sidebar item, following
  the same pattern as the existing "AI Command Center" addition.

> ⚠️ **Lesson from this codebase's actual bug history — do not repeat these:**
> 1. A component that takes `isOpen`/`onClose` props must actually be called with those
>    props by its parent, or it silently renders nothing (this exact bug happened twice in
>    this project). Grep for every place you render a new modal component and verify the
>    props line up.
> 2. **Never assume backend JSON field names match frontend variable names.** This project
>    has already broken twice because a backend endpoint returned e.g. `heart_rate` while the
>    component read `hr`. For every new endpoint, write the response shape down explicitly (this
>    doc does that in Section 10) and map fields explicitly in the frontend — do not destructure
>    raw API responses directly into chart/UI code without an explicit mapping step.
> 3. Never let a synchronous LLM call block a FastAPI request handler with no timeout — wrap
>    every `groq_llm.invoke(...)` call used inside a request path in a hard timeout (this
>    project has a documented incident where an unbounded LLM call hung an endpoint
>    indefinitely). Use the same pattern: run the call in a thread pool with
>    `future.result(timeout=...)` and fall back to a clear "AI explanation unavailable" string
>    on timeout — **never fall back to blocking forever, and never let an LLM timeout affect a
>    deterministic value** (claim status, amounts, dates) that doesn't depend on it.

---

## 1. Scope

Build a **Cashless Health Insurance Claim Automation** module that plugs into the existing
Billing/Discharge flow for a specific patient, covering:

1. Registration-time capture of ABHA identity (mocked) and cashless-insurance opt-in
2. Insurance information capture (individual or corporate/group policy)
3. Hospital–insurer tie-up verification against a maintained directory
4. Document collection + OCR extraction
5. Optional policy-document RAG (coverage/exclusions/limits/pre-auth requirements)
6. Deterministic claim preparation (LLM assists with drafting/summarizing only)
7. Mandatory human review (HITL) before submission
8. Claim submission via an isolated HCX/NHCX adapter, with an email/SMS fallback
   communication path
9. Continuous monitoring of claim status (approved / query / rejected), each with its own
   resumable sub-flow
10. Payment monitoring and reconciliation, kept strictly separate from claim approval
11. Patient + staff notifications at every major transition
12. A full audit trail
13. A per-patient claim-status dashboard for hospital staff

Everything must run **end-to-end with mock adapters and zero external credentials**. Real
adapters (real ABDM sandbox, real HCX participant, real Gmail, real SMS provider) are optional
and must be toggleable via environment variables, defaulting to the mock implementation.

---

## 2. Architecture

```
Hospital Staff ──► Patient Registration ──► ABDM Adapter (mock) ──► ABHA-linked Patient
                                                  │
                                                  ▼
                                      "Cashless insurance?" (Y/N)
                                                  │ Y
                                                  ▼
                                     Insurance Info Capture (individual/corp)
                                                  │
                                                  ▼
                              Hospital Insurer Directory ──► Tie-up Check
                                        │ not tied up           │ tied up
                                        ▼                       ▼
                              Notify staff+patient      Document Collection + OCR
                              status=INSURER_NOT_TIED_UP        │
                                                                 ▼
                                                    Policy RAG (ChromaDB, if policy doc supplied)
                                                                 │
                                                                 ▼
                                                   Deterministic Claim Preparation (LangChain)
                                                                 │
                                                                 ▼
                                                         HUMAN REVIEW (HITL, mandatory)
                                                                 │
                              ┌──────────────────────────────────┼───────────────────────────┐
                              ▼                                                              ▼
                     Communication Layer                                          REJECT / REQUEST_INFO
              ┌───────────────┴────────────────┐                                    (back to prep, resumable)
              ▼                                 ▼
      HCXAdapter (preferred)          CommunicationAdapter (fallback)
              │                        (EmailAdapter/GmailAdapter/Mock)
              └────────────────┬────────────────┘
                                ▼
                          Insurer / TPA
                                │
                                ▼
                        Claim Response Monitoring (LangGraph)
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
          APPROVED           QUERY             REJECTED
              │                 │                 │
              ▼                 ▼                 ▼
     Payment Monitoring   Request missing    Notify patient/staff/TPA
     (Accounts Adapter)   info from patient  Human resolves
              │            → resume at prep  → resume at prep/HITL/submit
              ▼
     Payment Reconciliation (deterministic math, never LLM)
              │
              ▼
     Notify patient + accounts → COMPLETED
```

---

## 3. New backend module layout

```
backend/insurance/
    __init__.py
    router.py                 # APIRouter, all /api/insurance/* endpoints, included from app.py
    models.py                 # Pydantic models (requests/responses), separate from FHIR models
    workflow/
        __init__.py
        states.py              # ClaimState enum (Section 8)
        graph.py                # LangGraph StateGraph definition, nodes wired with conditional edges
        nodes.py                # one function per LangGraph node (Section 8)
        persistence.py          # save/load workflow_states doc per claim_id, pause/resume helpers
    adapters/
        __init__.py
        abdm_adapter.py          # ABDMAdapter (interface) + MockABDMAdapter
        hcx_adapter.py           # HCXAdapter (interface) + MockHCXAdapter (+ optional RealHCXAdapter stub)
        fhir_adapter.py          # FHIRAdapter — internal model <-> FHIR resource conversion
        communication_adapter.py # CommunicationAdapter interface
        email_adapter.py         # EmailAdapter, GmailAdapter (wraps existing email_service.py), MockEmailAdapter
        sms_adapter.py           # SMSAdapter interface + MockSMSAdapter (+ optional TwilioSMSAdapter stub)
        accounts_adapter.py      # HospitalAccountsAdapter interface + MockHospitalAccountsAdapter
    ocr/
        document_parser.py       # OCR + field extraction for uploaded documents
    rag/
        policy_index.py          # ChromaDB collection mgmt: chunk, embed, upsert, retrieve
        policy_rag.py             # LangChain RAG chain constrained to retrieved chunks only
    tools.py                     # LangChain @tool-decorated functions (Section 9), scoped access only
    claim_service.py              # deterministic business logic: validation, amount math, status transitions
    seed_data.py                   # seeds insurer_directory + one demo patient/policy for local testing
    audit.py                        # write_audit_event() helper, single entrypoint for all audit writes
```

`backend/database.py` should be extended (not replaced) with the new collection handles listed
in Section 6, following the exact same pattern as the existing `patients_collection` etc.

---

## 4. Adapter interfaces

Each adapter is an abstract interface plus a `Mock` implementation used by default. Selection
is via environment variable, e.g. `HCX_ADAPTER=mock|real` read once at startup in
`backend/insurance/adapters/__init__.py`, which exposes a single `get_hcx_adapter()`-style
factory per adapter family so calling code never imports a concrete class directly.

```python
# abdm_adapter.py
class ABDMAdapter(ABC):
    def link_abha(self, patient_id: str, abha_number: str | None) -> ABHALinkResult: ...
    def fetch_consented_records(self, abha_id: str, purpose: str) -> list[FHIRBundle]: ...

class MockABDMAdapter(ABDMAdapter):
    # Generates a synthetic ABHA number (format-valid, clearly fake, e.g. prefixed "SANDBOX-"),
    # marks consent as auto-granted for demo purposes, returns an empty/synthetic FHIR bundle.
    ...
```

```python
# hcx_adapter.py
class HCXAdapter(ABC):
    def validate(self, claim: InternalClaim) -> ValidationResult: ...
    def transform(self, claim: InternalClaim) -> HCXMessage: ...
    def authenticate(self) -> AuthContext: ...
    def send(self, message: HCXMessage, auth: AuthContext) -> HCXSendResult: ...
    def parse_response(self, raw_response: dict) -> InternalClaimStatusUpdate: ...

class MockHCXAdapter(HCXAdapter):
    # Deterministic mock: validates required fields are present (policy number, member id,
    # amount, patient id, hospital id — reject with a clear error if any are missing),
    # "sends" by writing an hcx_transactions record with a generated transaction id, and
    # returns a scripted or configurable response (approve/query/reject) so the full workflow
    # is testable end-to-end without a real HCX participant. Provide a way to control the mock
    # outcome via a request/query param or a seeded fixture, for demo purposes.
```

```python
# communication_adapter.py / email_adapter.py / sms_adapter.py
class CommunicationAdapter(ABC):
    def send_claim_package(self, claim: InternalClaim, recipient: CommunicationTarget, attachments: list[Path]) -> CommResult: ...

class EmailAdapter(CommunicationAdapter):
    # Wraps backend/email_service.py — do not reimplement SMTP/Gmail logic, call the existing sender.
class MockEmailAdapter(CommunicationAdapter):
    # Logs the would-be email to claim_messages + audit_events, no real send.

class SMSAdapter(ABC):
    def send(self, phone: str, message: str) -> CommResult: ...
class MockSMSAdapter(SMSAdapter):
    # Logs to notifications collection, no real send.
```

```python
# accounts_adapter.py
class HospitalAccountsAdapter(ABC):
    def get_expected_amount(self, claim_id: str) -> Decimal: ...
    def get_received_amount(self, claim_id: str) -> PaymentRecord | None: ...

class MockHospitalAccountsAdapter(HospitalAccountsAdapter):
    # For demo purposes, exposes a small staff-facing "mark payment received" action
    # (a POST endpoint) that simulates the hospital's accounting system confirming receipt —
    # this is what actually drives PAYMENT_RECEIVED in a demo, since there is no real bank feed.
```

```python
# fhir_adapter.py
class FHIRAdapter:
    def patient_to_fhir(self, patient: dict) -> dict: ...       # FHIR Patient resource
    def encounter_to_fhir(self, encounter: dict) -> dict: ...   # FHIR Encounter resource
    def claim_documents_to_fhir(self, docs: list[dict]) -> list[dict]: ...  # DocumentReference
    # Keep these as pure, stateless converters. Internal MongoDB documents remain the source of
    # truth; FHIR resources are generated on demand for HCX messages / interoperability, never
    # stored as the primary representation.
```

---

## 5. MongoDB collections

Add to `backend/database.py`, same pattern as existing collections. Suggested minimum schema
per collection (extend as needed, but keep `claim_id` as the consistent foreign key across all
claim-related collections):

| Collection | Key fields |
|---|---|
| `abha_profiles` | `patient_id`, `abha_number` (mock-generated), `linked_at`, `consent_status`, `source` |
| `insurance_policies` | `patient_id`, `policy_type` (`individual`\|`corporate`), `insurer_name`, `policy_number`, `member_id`, `group_policy_number`, `employer_name`, `agent_contact`, `tpa_contact`, `hr_contact`, `claim_email`, `claim_portal`, `policy_document_id`, `created_at` |
| `insurer_directory` | `insurer_name`, `insurer_type`, `hospital_network_status` (`tied_up`\|`not_tied_up`), `claim_channel` (`hcx`\|`email`), `claim_email`, `tpa_details`, `agent_details`, `portal_url`, `hcx_participant_code`, `verification_status`, `source`, `last_verified_at` |
| `hospital_insurer_tieups` | `insurer_name`, `hospital_id`, `status`, `verified_by`, `verified_at` |
| `documents` | `patient_id`, `claim_id`, `doc_type`, `file_path`, `ocr_extracted_fields` (dict), `ocr_confidence`, `reviewed_by_staff`, `uploaded_at` |
| `claims` | `claim_id`, `patient_id`, `insurer_name`, `policy_id`, `state` (see Section 8), `bill_amount`, `approved_amount`, `received_amount`, `patient_payable`, `created_at`, `updated_at` |
| `claim_documents` | `claim_id`, `document_id`, `required` (bool), `status` (`missing`\|`collected`\|`sent`) |
| `claim_messages` | `claim_id`, `direction` (`outbound`\|`inbound`), `channel` (`hcx`\|`email`\|`sms`), `content_summary`, `raw_ref`, `timestamp` |
| `claim_status_history` | `claim_id`, `from_state`, `to_state`, `reason`, `actor` (`system`\|`human`\|`insurer`), `timestamp` |
| `hcx_transactions` | `claim_id`, `hcx_transaction_id`, `request_payload`, `response_payload`, `status`, `timestamp` |
| `human_reviews` | `claim_id`, `review_type`, `presented_data` (snapshot: patient, insurance, policy findings, amount, docs, missing docs, channel, verification status), `action` (`APPROVE`\|`EDIT`\|`REJECT`\|`REQUEST_INFORMATION`), `reviewer`, `notes`, `created_at`, `resolved_at` |
| `payment_transactions` | `claim_id`, `expected_amount`, `received_amount`, `reference_number`, `received_at`, `reconciled` (bool) |
| `notifications` | `claim_id`, `patient_id`, `channel`, `template`, `sent_at`, `status` |
| `workflow_states` | `claim_id`, `current_state`, `pending_action`, `graph_checkpoint` (serialized LangGraph state), `updated_at` — this is what makes the workflow resumable |
| `audit_events` | `claim_id`, `timestamp`, `actor`, `event` (from the fixed vocabulary in Section 12), `status`, `metadata` |

**ChromaDB:** one collection, e.g. `insurance_policy_chunks`, storing only policy-document
chunks with metadata `{patient_id, policy_id, source_page}`. Use ChromaDB's default local
embedding function (or `sentence-transformers/all-MiniLM-L6-v2` if you want higher quality) —
**do not require an OpenAI embeddings API key**; this project's existing RAG feature
(`backend/agents/chat_agent.py`) deliberately avoids external embedding APIs for the same
reason, using TF-IDF instead. For policy RAG, real ChromaDB with a local embedding model is
fine since the PDF spec explicitly asks for ChromaDB — just keep it dependency-light and
offline-capable.

---

## 6. Deterministic guardrails (non-negotiable)

These rules are more important than any individual code structure choice in this document:

1. **The LLM never approves, rejects, or changes a claim's state.** All state transitions are
   triggered by deterministic backend logic reacting to adapter responses or human actions.
2. **The LLM never invents policy clauses.** RAG answers must only summarize/quote from
   retrieved chunks; if the supplied policy document doesn't cover a question, say so
   explicitly rather than filling the gap from general knowledge. If no policy document was
   supplied, skip RAG entirely rather than letting the LLM guess.
3. **The LLM never performs financial arithmetic that matters.** `bill_amount`,
   `approved_amount`, `received_amount`, `patient_payable`, `outstanding_amount` are always
   computed in `claim_service.py` with plain Python/Decimal, never parsed out of LLM output.
4. **Critical structured fields never come from free-text LLM output**: policy number, member
   ID, claim amount, dates, patient ID, hospital ID must come from validated form input or OCR
   fields the staff has reviewed — the LLM may draft communication text around them, never
   generate the values themselves.
5. **HITL is mandatory** before: first claim submission, submission through any unverified
   communication channel, resolving an ambiguous policy-RAG finding, resolving a rejection.
   The workflow pauses (persists state) and waits — it never times out into an
   auto-submission.
6. **Unverified, user-supplied contact details are never used to send documents** without a
   human explicitly confirming the channel first (`verified: false` records must be flagged
   in the HITL review screen).
7. **Approval ≠ payment.** `CLAIM_APPROVED` and `PAYMENT_RECEIVED` are separate states with
   separate evidence (insurer response vs. `HospitalAccountsAdapter` confirmation). Never infer
   one from the other.
8. **A rejected or queried claim resumes from the correct mid-workflow state** (normally back
   to claim preparation → human review → resubmission), never restarts from patient
   registration.
9. **Every state transition writes an `audit_events` record** (Section 12's vocabulary) and a
   `claim_status_history` record. If you're unsure whether something needs an audit entry,
   write one — the audit trail should be reconstructable into a full timeline for any claim.

---

## 7. LangChain tools (scoped, no raw DB access for the LLM)

Expose exactly these as `@tool`-decorated functions passed to any LLM agent that needs them.
Each tool internally talks to `claim_service.py` / collections — the LLM never gets a raw
Mongo handle or an unrestricted query capability.

```
get_patient(patient_id)
get_encounter(patient_id)
get_insurance(patient_id)
get_insurer_directory(insurer_name)
check_hospital_tieup(insurer_name)
get_documents(claim_id)
search_policy(claim_id, query)          # RAG retrieval only, returns retrieved chunks, not an answer
validate_claim(claim_id)                 # returns pass/fail + reasons, deterministic
prepare_claim(claim_id)                  # returns a structured draft claim payload for staff review
submit_hcx_claim(claim_id)               # only callable after HITL approval — enforce this in the tool itself
get_claim_status(claim_id)
get_claim_queries(claim_id)
send_notification(claim_id, template, channel)
```

`submit_hcx_claim` should defensively re-check that the claim's state is
`WAITING_FOR_HUMAN_APPROVAL` with an `APPROVE` decision recorded before doing anything, even if
called out of order — don't rely on the LangGraph edge alone to enforce this.

---

## 8. LangGraph workflow

**States** (`backend/insurance/workflow/states.py`, a `StrEnum` or similar):

```
REGISTERED, CASHLESS_SELECTED, INSURANCE_CAPTURED, INSURER_CHECKED, TIE_UP_CONFIRMED,
INSURER_NOT_TIED_UP, DOCUMENTS_COLLECTED, POLICY_ANALYZED, CLAIM_PREPARED,
WAITING_FOR_HUMAN_APPROVAL, CLAIM_SUBMITTED, PENDING, QUERY_RECEIVED,
ADDITIONAL_INFORMATION_REQUIRED, REJECTED, APPROVED, PAYMENT_PENDING, PAYMENT_RECEIVED,
COMPLETED
```

**Nodes** (`backend/insurance/workflow/nodes.py`) — one function per node, each reading/writing
the claim's Mongo documents and returning updated LangGraph state:

```
initialize_claim, register_patient, link_abha, capture_insurance, identify_insurance_type,
check_insurer_tie_up, lookup_insurer, determine_missing_information,
request_patient_information, process_documents, extract_claim_data, retrieve_policy,
run_policy_rag, validate_claim, prepare_claim, human_review, submit_hcx_claim,
fallback_email_claim, monitor_claim, process_insurer_response, handle_query,
handle_rejection, handle_approval, monitor_payment, reconcile_payment, notify_patient,
finalize_claim
```

**Conditional edges** drive every branch point explicitly named in the architecture diagram
(Section 2): cashless Y/N, tie-up found/not-found, missing-info yes/no, HCX-available
vs. email-fallback, insurer response approved/query/rejected, payment
received-vs-still-pending.

**Persistence / resumability:** after every node transition, write
`{claim_id, current_state, pending_action, graph_checkpoint, updated_at}` to
`workflow_states`. On `human_review`, the graph must actually **pause** (return control to the
API layer, not block a thread) — implement this as: the node writes
`state = WAITING_FOR_HUMAN_APPROVAL` and returns; a separate
`POST /api/insurance/claims/{claim_id}/review` endpoint (called from the staff HITL UI) loads
the checkpoint, applies the human decision, and re-invokes the graph from that point forward.
Use LangGraph's built-in checkpointer if the installed LangGraph version supports a Mongo/SQL
checkpointer cleanly; otherwise implement `persistence.py`'s load/save manually against
`workflow_states` — **this specific mechanism is left to your judgment (see Section 15)**, but
the resumability guarantee in Section 6, rule 8 is not optional.

---

## 9. HITL review contract

`POST /api/insurance/claims/{claim_id}/review` accepts:
```json
{ "action": "APPROVE" | "EDIT" | "REJECT" | "REQUEST_INFORMATION", "notes": "string", "edited_fields": { }, "reviewer": "string" }
```
Before this endpoint can be called meaningfully, `GET /api/insurance/claims/{claim_id}/review`
must return everything a human needs to decide, in one payload: patient, insurance, policy/RAG
findings, claim amount, documents (with missing-document list), insurer/TPA contact,
communication channel + its verification status. Do not require the reviewer to open five
different screens to make this decision.

---

## 10. Backend API surface

All under `APIRouter(prefix="/api/insurance")`, mounted in `app.py`.

| Method | Path | Purpose | Response shape (top-level keys) |
|---|---|---|---|
| POST | `/patients/{patient_id}/register` | Registration + ABHA link (mock) | `patient_id, abha_number, consent_status` |
| POST | `/patients/{patient_id}/cashless-selection` | Record Y/N | `patient_id, cashless_selected, claim_id` (created if Y) |
| POST | `/claims/{claim_id}/insurance-info` | Capture policy details | `claim_id, insurer_name, policy_type` |
| GET | `/claims/{claim_id}/tieup-status` | Trigger/read tie-up check | `claim_id, insurer_name, tied_up (bool), verified_at` |
| POST | `/claims/{claim_id}/documents` | Upload + OCR a document | `document_id, doc_type, ocr_extracted_fields, ocr_confidence` |
| GET | `/claims/{claim_id}/missing-documents` | List still-missing docs | `claim_id, missing: [doc_type]` |
| POST | `/claims/{claim_id}/policy/ask` | RAG query against policy doc | `claim_id, answer, source_chunks: [...]` (empty answer + explicit "not covered" if no match) |
| GET | `/claims/{claim_id}/review` | HITL review payload | see Section 9 |
| POST | `/claims/{claim_id}/review` | Submit HITL decision | `claim_id, state, next_action` |
| GET | `/claims/{claim_id}` | Full claim status/timeline | `claim_id, state, history: [...], amounts: {...}` |
| GET | `/claims/{claim_id}/audit` | Full audit trail | `claim_id, events: [...]` |
| POST | `/claims/{claim_id}/insurer-response` | Simulate/ingest insurer response (mock HCX callback) | `claim_id, state, reason` |
| POST | `/claims/{claim_id}/mark-payment-received` | Staff/mock-accounts confirms receipt | `claim_id, received_amount, reference_number` |
| GET | `/insurer-directory` | List/search insurer directory | `insurers: [...]` |
| POST | `/insurer-directory` | Add/edit an insurer entry (staff admin) | `insurer_name, ...` |
| GET | `/claims` | All claims, for the staff dashboard | `claims: [{claim_id, patient_name, insurer_name, state, updated_at}]` |
| GET | `/human-reviews/pending` | Queue for the HITL review screen | `reviews: [...]` |
| POST | `/patients/{patient_id}/additional-info-link/{token}` | Public-ish endpoint the patient uses to submit only the missing fields they were asked for (Section 11 of the original spec) | `claim_id, fields_submitted` |

Write down the exact response shape before building the matching frontend component — see the
warning in Section 0.

---

## 11. Frontend integration

**Billing Portal extension** — inside the existing `BillingPortal` component, when a selected
patient has `cashless_selected: true`, render a new sub-section (or tab) "Insurance Claim"
showing:
- Claim status timeline (mirror the dashboard example from the spec: Registration ✓ →
  Cashless Selected ✓ → ... → Payment Received ⏳)
- Amount breakdown: bill amount, approved amount, received amount, patient payable,
  outstanding — computed values from the backend, rendered as-is, never recalculated in JS
- A "View full audit trail" expandable list

**New sidebar portal: "Insurance Ops"** (staff-facing, same pattern as the existing
"AI Command Center" addition to the sidebar/portal grid):
- `HumanReviewQueue` — list of claims in `WAITING_FOR_HUMAN_APPROVAL` (and other
  HITL-required states), each opening a `ClaimReviewModal` that shows the Section 9 payload
  and the four action buttons (Approve / Edit / Reject / Request Information)
- `InsurerDirectoryAdmin` — simple table + add/edit form over `/insurer-directory`
- `AllClaimsTable` — every claim across all patients with state + last-updated, for a
  bird's-eye view

**New components** (`frontend/src/components/insurance/`), all following the existing
`{ patientId, patientName, isOpen, onClose }` modal contract where applicable:
- `ClaimStatusTimeline.jsx`
- `ClaimReviewModal.jsx`
- `InsurerDirectoryAdmin.jsx`
- `DocumentUploader.jsx` (with an inline OCR-extracted-fields review/edit form — staff must be
  able to correct OCR output before it's used, per the spec)
- `PolicyRagPanel.jsx` (ask-the-policy chat box, scoped to one claim)

**apiService additions** in `MainApp.jsx` — one method per endpoint in Section 10's table,
following the existing `fetch(...).then(r => r.json())` style already used throughout the
file. For the document upload endpoint, follow the same `FormData` pattern already used by
`apiService.analyzeXray`.

---

## 12. Notifications & audit vocabulary

**Notification triggers** (via `EmailAdapter`/`SMSAdapter`, logged to `notifications`):
claim submitted, claim pending, query received, missing documents, claim approved, claim
rejected, payment received, patient payable amount, workflow completed, insurer not tied up.

**Audit event vocabulary** (fixed set, written via `audit.write_audit_event()`):
```
PATIENT_REGISTERED, ABHA_LINKED, CASHLESS_SELECTED, INSURANCE_CAPTURED, INSURER_VERIFIED,
TIEUP_CONFIRMED, DOCUMENT_UPLOADED, POLICY_ANALYZED, CLAIM_PREPARED, HUMAN_APPROVED,
CLAIM_SUBMITTED, CLAIM_ACKNOWLEDGED, QUERY_RECEIVED, DOCUMENT_REQUESTED,
DOCUMENT_RECEIVED, CLAIM_RESUBMITTED, CLAIM_REJECTED, CLAIM_APPROVED, PAYMENT_RECEIVED,
PAYMENT_RECONCILED, CLAIM_COMPLETED
```
Each record: `{claim_id, timestamp, actor, event, status, metadata}`.

---

## 13. Seed data & demo script

`backend/insurance/seed_data.py` should, on demand (not automatically on every startup):
- Insert 3–5 `insurer_directory` entries, at least one `tied_up` and one `not_tied_up`, with
  realistic-looking (clearly fake) `claim_email`/`portal_url` values
- Create one demo patient (or reuse an existing seeded patient from the base project) with a
  full cashless flow: ABHA linked, individual policy, a synthetic 2–3 page policy PDF (plain
  text is fine) for the RAG feature to actually have something to retrieve from, and 2–3
  required documents pre-uploaded
- Provide a small script/test (`backend/insurance/demo_walkthrough.py` or a pytest file) that
  drives one claim through every state end-to-end using the mock adapters, printing the state
  transitions — this is your own verification that the graph and persistence actually work,
  and doubles as a script the user can run before their demo to prime the system with a claim
  sitting in `WAITING_FOR_HUMAN_APPROVAL` ready to show off the HITL screen.

---

## 14. Explicit non-goals

- No real ABDM production onboarding, no real HCX participant registration
- No claim of regulatory/HIPAA/DPDP compliance — this is a demo
- No real payment gateway; payment "receipt" is a mocked staff action
- No attempt to encode a real insurer's actual policy rules — RAG operates only on whatever
  synthetic policy document is supplied for the demo

---

## 15. Where you have freedom

Split this into two tiers, because they're different kinds of freedom.

### 15a. Freedom to match reality (expected, not just permitted)

Everything in Section 0 that describes "the existing codebase" is a **best-effort snapshot,
not a contract** — the person building this has been manually editing the project outside of
our conversations, so parts of it may be stale. You should actively expect drift and correct
for it, including things not explicitly called out elsewhere in this doc:
- File/folder names, module boundaries, routing style (single `app.py` vs. multiple routers
  already in use), and frontend component/prop conventions may all have changed — mirror
  whatever you actually find.
- Collection names or schemas in `database.py` may already differ from Section 5's table (e.g.
  a field renamed, a collection merged into another). Adapt Section 5's schema to fit the real
  one rather than creating a second, conflicting naming scheme.
- If the frontend has since adopted a different state-management or styling approach than the
  single-file `MainApp.jsx` pattern described here, build the new UI the way the rest of the
  *current* frontend is actually built.
- If a feature this doc assumes doesn't exist yet (e.g. `email_service.py`) turns out not to
  exist, or exists under a different name/shape, build what's actually needed rather than
  blocking on the assumption.

When in doubt between "follow this document literally" and "follow what the current codebase
is actually doing around it," **prefer the current codebase** — consistency with the real
project matters more than consistency with this planning document.

### 15b. Freedom on implementation choices (this doc is intentionally silent or general)

You may also decide, without asking:
- Exact LangGraph checkpointing mechanism (built-in checkpointer vs. manual `workflow_states`
  persistence), as long as resumability (Section 6, rule 8) holds
- Exact OCR library/service used for document parsing (e.g. Tesseract, a hosted OCR API in
  mock mode, or a stub that requires staff to manually confirm fields for the demo) — the
  spec's real requirement is "staff can review and correct extracted fields," not any specific
  OCR engine
- Exact embedding approach for the policy RAG (ChromaDB default vs. sentence-transformers)
- Precise Pydantic model field names beyond what's specified, as long as the response shapes
  in Section 10 are honored
- Whether the "Insurance Ops" portal is a new top-level sidebar item or nested under Billing —
  pick whichever fits the existing sidebar array more cleanly
- Minor collection/field additions beyond Section 5's minimum, if genuinely needed

### 15c. What is not open to deviation, regardless of what the codebase looks like

The state list (Section 8), the deterministic guardrails (Section 6), the HITL requirement
points, and the adapter isolation boundary (Section 4) hold **no matter how the surrounding
codebase has drifted.** These aren't "existing convention" choices you're matching — they're
the actual requirements of this feature (a deterministic, auditable, human-supervised workflow,
not an autonomous agent). If the current codebase makes one of these awkward to implement in
the way this doc describes, find a different implementation path that still satisfies the
rule — don't drop the rule.

### 15d. When you're genuinely unsure

If you hit a fork where the right call depends on something only the project owner would know
(e.g. "should this reuse an existing but half-finished insurance-adjacent feature you already
started, or build fresh?"), make the most reasonable call, document the assumption clearly in
code comments or a short note, and keep moving — don't block waiting for clarification on
implementation details. Do stop and ask if you find something that looks like it would silently
violate one of the Section 15c rules and you can't see a way around it.

---

## 16. Definition of done

- A patient can be registered, opt into cashless, have insurance captured, pass or fail a
  tie-up check, upload documents, optionally go through policy RAG, have a claim drafted, go
  through HITL, get "submitted" via `MockHCXAdapter`, receive a simulated approved / query /
  rejected response, and (on approval) reach `PAYMENT_RECEIVED` → `COMPLETED` — entirely
  through the UI, entirely offline, entirely traceable via the audit trail.
- A rejected or queried claim can be resolved and resumes correctly without restarting
  registration.
- Every currency amount shown anywhere in the UI is byte-for-byte what the backend computed —
  never client-side math, never LLM-derived.
- Running `demo_walkthrough.py` (or equivalent) exercises the whole state machine without
  manual intervention and exits cleanly.
