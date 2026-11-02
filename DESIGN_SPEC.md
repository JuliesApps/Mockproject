# Clearframe — Authoritative Design Specification

**Product:** Clearframe Relational Pattern Atlas  
**Specification revision:** 1.1 — 2026-11-02  
**Baseline reviewed:** `clearframe-github-v3(1).zip` (the user's latest supplied application archive, dated 2026-10-30)  
**Release package:** Clearframe v4, derived from the supplied v3 archive.  
**Status:** Consolidation of approved product rules and source-inspected implementation. The v4 source adds the approved Swap Shoes toggle but has not been deployed.

## 0. How to use and maintain this document

This is the **single source of truth for agreed product behavior**. It is not a claim that every agreed feature has been coded. Treat these labels separately:

- **Approved:** The user has accepted the product rule; future work must preserve it.
- **Implemented in supplied v3:** The relevant code or documentation exists in the latest supplied archive; functional testing may still be needed.
- **Implemented in v4 package:** A change to the supplied baseline included in the downloadable v4 archive; browser testing and deployment status are noted separately.
- **Approved, not implemented:** Work the user has already specified but the supplied archive does not contain.
- **Proposed, not approved:** Research/editorial ideas requiring a separate decision, semantic deduplication, and safety review.
- **Reported issue / verification needed:** A behavior the user reported as broken, or a feature whose operation has not been tested. Do not silently mark it working.
- **Rejected or superseded:** An earlier approach explicitly displaced by a later decision.

When this document and old README text differ, the **latest clearly approved user decision** controls; update this document and the implementation accordingly. When the implementation differs from this document, report the gap instead of silently redefining the requirement. Update this file when each design decision is accepted, and separately mark whether its code has shipped. Preserve revisions in source control.

The app is **Clearframe Relational Pattern Atlas**, not Rootline. **Rootline and Threadwork are different projects and must not be modified as part of Clearframe work.**

## 1. Purpose, scope, and boundaries — Approved

Clearframe helps someone who is emotionally activated identify possible **learned relational expectations**, compare them concurrently with **specific observations of present-day behavior**, and choose a **proportionate response** that respects both their own safety/agency and the other person's autonomy. It is a reflection and reasoning aid, not a clinical diagnostic tool.

The atlas is **mechanism-first**. It is not a comprehensive catalogue of behaviors attributed to borderline personality disorder, nor a means of diagnosing a controlling person. Control mechanisms may occur across diagnoses and contexts. A feeling is meaningful but does not, alone, establish the interpretation of someone else's actions.

Requirements:

1. Recognize genuine harm, coercion, or serious boundary violations without explaining it away as the user's old alarm.
2. Challenge unsupported catastrophic assumptions without dismissing the user's experience.
3. Present **both concerning and contrasting healthy behavior** at the same time; both can be observed, or neither.
4. Make it possible to see how an older protection strategy might unfairly affect someone in the present. Proportionate coaching is not merely reassurance.
5. Do not require the user to keep a journal, build a person dossier, identify a perpetrator, or record sensitive experiences to use the core flow.
6. Do not infer, diagnose, or confidently state another person's motives, personality, mental illness, or unconscious intention from a checkbox or phrase match.

## 2. Five-field canonical atlas — Approved; implemented in supplied v3

| Order | Field | Purpose | Canonical implementation |
| --- | --- | --- | --- |
| 1 | **Control routine** | Broad, reusable pattern or mechanism of pressure/control | `data.js`: `routines[].id` |
| 2 | **Subroutine** | More specific reusable mechanism, referenced by any number of routines | `data.js`: `subroutines[].id`; `routines[].subroutineIds[]` |
| 3 | **Learned expectation** | A prediction the affected person *may* have acquired | `subroutines[].learned` |
| 4 | **Protective response** | A possibly once-useful adaptation to the prediction, without moral judgment | `subroutines[].protective` |
| 5 | **Present-day reality indicators** | Specific observable conduct that supports or challenges the older prediction | `evidence.js`: stable indicator IDs, `routineIds[]`, `subroutineIds[]`, `kind` |

The five fields remain linked by **stable identifiers and pointers**, not duplicate records inside each folder. A single subroutine can connect to several control routines. A single indicator may be relevant to several routines/subroutines; its meaning must not be altered simply to fit a different parent view. The Atlas displays one joined path through the five fields. Distinguish the **externally imposed dynamic**, the **internalized prediction**, and the **protective adaptation**.

User-edited and custom records must preserve stable identifiers and cross-links. Renaming a role or changing a theme is presentation only; it cannot rewrite the underlying classification or selected evidence.

**Source-inspected v3 inventory:** 16 built-in control routines, 41 shared subroutines, 64 built-in observable indicators, plus optional user edits/custom definitions. These numbers describe the supplied baseline, not the size of a complete atlas.

## 3. Roles and themes — Approved; implemented in supplied v3

Stable abstract slots are `guardian`, `sibling`, and `self`. These are **functional example roles, not actual persons, traits, diagnoses, or mandatory family structures**. Presentation aliases may be changed without changing the canonical records or calculations.

Confirmed examples:

| Preset | `guardian` | `sibling` | `self` |
| --- | --- | --- | --- |
| Neutral | Guardian | Sibling | You |
| Legacy example | MotherQ | SisterQ | You |
| Storybook example | WickedWitch | TinMan | DorothyGale |

Custom aliases are supported. Role-neutral source descriptions must remain intelligible when the cast changes. Do not create person profiles or attach claims to identified relatives as a prerequisite for atlas use.

## 4. Persona assignment, immutable characteristics, and power — Approved architecture; content adaptation not yet implemented

### 4.1 Foundational rule

**Classify what the controlling behavior does, not what demographic category the target belongs to.** A person in power may assign a *persona wrapper* to someone and then interpret, constrain, or exploit that individual according to the wrapper. The imposed description is **not evidence of the person's actual character**.

Characteristics such as gender, birth order, age, or identity may be **selection cues or socially available justifications** when an authority figure leverages normative expectations. They are **not required parts of the mechanism's definition** and must not be made the atlas's primary folders. The same mechanism must remain recognizable among children of the same gender, identical twins, a different birth order, or unrelated people.

Social norms can provide cover or perceived legitimacy for an imposed role; their presence is not, by itself, proof of abuse. Focus on actual expectations, consistency, consequences, power, and room to decline. Nor should Clearframe presume the controller consciously planned the result when intention is not directly established.

### 4.2 Distinguish three functions of an assigned persona

1. **Persona assignment:** A role is imposed (e.g., *the easygoing child*, *the problem child*, *the responsible one*).
2. **Persona-based interpretation:** Comparable conduct is interpreted differently according to that role. One twin's silence becomes “relaxed,” the other's “angry or plotting.” This is a role-conditioned double standard, even when traits are identical.
3. **Persona-based obligation/enforcement:** A role is used to demand labor, caretaking, compliance, sacrifice, or restricted choices; resistance can be framed as a character flaw or breach of duty.

These are **related but distinct functions**. One experience may traverse several mechanisms through pointers. Do not create a separate demographic subroutine for each role/identity combination.

### 4.3 Instrumental parentification test case

The person in authority assigns a child the wrapper “mature / responsible / the oldest daughter” and shifts adult responsibilities such as recurring family meals, managing household bills, or primary sibling care to that child. The key concerning mechanism is **developmentally disproportionate responsibility transfer and enforcement**, especially when school, friendships, rest, or extracurricular development are regularly subordinated to household needs.

Example cross-field interpretation:

| Field | Example *hypothesis*, not an assumed fact |
| --- | --- |
| Control routine | Imposed role / responsibility transfer (final hub taxonomy subject to editorial deduplication) |
| Subroutine | Instrumental parentification: adult duties displaced onto a child |
| Learned expectation | “My needs must come last; refusing makes me selfish.” |
| Protective response | Overfunction, anticipate others' needs, cancel personal plans, fear saying no |
| Present-day concerning / contrasting signs | Concerning: duties are compelled at significant cost with guilt or punishment for refusal. Contrasting: adult responsibilities remain appropriately owned by adults; help is proportionate, explained, and compatible with age-appropriate development. |

Age-appropriate chores, voluntary contribution, cultural practices, and emergency family cooperation are **not inherently abusive**. Assess duration, degree, capacity, voluntariness, adult accountability, enforcement, available alternatives, and developmental cost.

**Existing data note:** The supplied v3 `parentification` entry mainly describes *adult-level emotional comfort/mediation/stability*. The new instrumental example establishes an approved conceptual distinction, **not an automatically approved new record or ID**. Review whether to distinguish instrumental and emotional parentification before changing the dictionary.

### 4.4 External role versus internal learned rule

Keep the relationship explicit:

`Assigned persona → imposed interpretation/expectations → enforcement and consequences → possible learned expectation → possible protective response → current observable comparison`

The externally assigned role is **not** the learned expectation itself. The child may internalize a different set of rules from the ones explicitly demanded. Neither an observed disparity nor the possible internalization warrants asserting the person's essence or the controller's hidden motive.

### 4.5 Power and symmetry

Account for real authority, dependencies, housing/resources, safety, capacity to decline, and enforceable consequences when assessing whether a demand is coercive. **A two-person conflict loop does not make both parties equally responsible for threats, intimidation, or violence.** The recipient of harmful behavior also matters: Clearframe should not coach the user toward retaliation, coercion, or exaggerated demands merely because they feel rejected. A boundary protects one's own choices; it does not automatically confer control over another person's choices.

## 5. “Process an emotion” flow — Approved; substantially implemented in supplied v3

1. **The moment:** The user describes what happened, or a feeling/thought. Their own words are not auto-saved. Text/phrase matching offers **tentative** possible routines; it does not understand arbitrary language and must not validate inferred intent.
2. **Possible learned rules:** Show candidate routines, learned expectations, and protective responses. The user can correct the suggested routines and interactively include/exclude subroutines.
3. **What have you actually observed?** Display the **two parallel, contrasting sets**: “Signs the old pattern may still be active” and “Signs this relationship may be different.” Indicators are prewritten examples from the static built-in dictionary. The user selects only those actually observed; unselected means unknown, **not** the opposite. Apply the approved Swap Shoes rule below.
4. **What does the comparison actually show?** Explain the selected concerning and contrasting indicators, any uncertainty/mixed status, relevant safety concern, and the connection to learned predictions. Avoid unsupported certainty and fake quantitative probabilities.
5. **Proportionate next step:** Give an action bounded by known observations and safety, considerate of the recipient and their independent agency. Distinguish questions, reasonable requests, reasonable boundaries, and appropriate protective action. Do not automatically equate discomfort with abuse or kindness with safety. Save a comparison only by explicit user choice.

The app's numbered display presently shows steps 1–4, then a distinct “Proportionate next step” section and optional saving. The fifth item above describes that **existing distinct action phase**, not a request to redesign its numbering.

### 5.1 Comparison semantics — Approved; implemented in supplied v3

- A checkbox is a **user-recognized report**, not independently verified proof.
- Counts and conclusions derive from **affirmatively selected applicable indicators**, not from absent selections.
- Concerning and contrasting indicators may both be selected; present a **mixed** interpretation where warranted rather than canceling them against each other.
- A serious safety indicator is never nullified by a separate kind act.
- Conclusions must distinguish **direct observation**, **learned prediction**, **interpretation of motive**, and **unknowns**.
- Asking for clarification, accepting a legitimate limit, taking distance, or setting a boundary may be proportionate depending on actual circumstances. Do not generate an accusatory or coercive reaction from speculative intent alone.

### 5.2 Swap Shoes — Approved; implemented in v4 package

Scope: a simple **display-only pronoun-perspective toggle in Step 3**, “What have you actually observed?”

- When toggled, invert the pronoun perspective in the displayed indicator statements (e.g., “They” ↔ “I”; “my” ↔ “their”; “me” ↔ “them”), preserving grammatical intelligibility.
- The **same indicators, IDs, checked states, and calculation** remain in use. **No separate evidence sets**, new classification, weighting, or alternate result.
- **Checkboxes remain interactive in either view.** Switching perspective alone does not change the result; checking/unchecking normally does.
- Toggling back restores the original wording without modifying stored observations. Treat this as a reading aid for evaluating how a behavior looks when the person holding power changes.
- Keep this feature deliberately simple. Rejected: a separate read-only alternate view, a second evidence pipeline, or a requirement to assign an observed act to a named person before using the toggle.

## 6. Reasoning and safety invariants — Approved

1. Evidence-based neutrality does not mean automatic benefit-of-the-doubt when coercion or violence has actually been recognized.
2. One disappointing event should not automatically be generalized to a person's complete character, motive, or future behavior; likewise, repeated serious concerns must not be brushed aside as a trauma trigger.
3. Reversible, proportionate, respectful first responses are preferable when the issue is uncertain and safety allows it.
4. The tool must account for the user's own capacity to harm or unfairly constrain others, without creating false moral equivalence in abuse scenarios.
5. Inference and suggestion must remain transparent. The supplied v3 engine is deterministic and on-device, not an AI service or psychological assessment.

## 7. Privacy, storage, interoperability — Approved; implemented in supplied v3 subject to testing

- Native HTML/CSS/JavaScript; no external libraries, CDNs, trackers, accounts, cloud databases, or AI APIs.
- Standalone installable PWA; static assets cached for offline use after initial online loading.
- Private entries, optional saved comparisons, role aliases, and dictionary edits stay **on the user's device**; v3 uses IndexedDB with localStorage fallback. It is **not encrypted** and does not sync between devices.
- Optional JSON export/import, with merge/replace modes and historical compatibility. Older v1 people/observations are preserved **inertly for lossless archival/export compatibility**; **People & Evidence** profile/incident tracker remains removed from the interface. The active **Present-day signals** static dictionary is not the removed People & Evidence feature.
- Deleting or clearing private data is a destructive action and requires explicit user confirmation. Built-in source dictionary is not erased by clearing local records.
- Do not silently destroy previous user records during migrations or interface changes.

## 8. Existing files and responsibilities in supplied v3

| File | Inspected purpose |
| --- | --- |
| `README.md` | Deployment, storage, scope, five-field overview, roles, and migration notes |
| `ATLAS_SCHEMA.md` | Stable-ID model, links, examples, editorial safeguards, backup data shape |
| `data.js` | Built-in routines, subroutines, expectations, protective responses, keyword triggers |
| `evidence.js` | Built-in concerning and contrasting present-day indicator entries |
| `reasoner.js` | Transparent selection-based classification and safety-aware action wording |
| `app.js` | Navigation, comparisons, atlas, editing, role themes, backup UI and action handlers |
| `store.js` | On-device state, IndexedDB/localStorage, v1/v2 normalization, merge |
| `sw.js` | Offline asset caching; revise cache version when shipped assets change |
| `index.html`, `style.css`, manifest, icons | PWA shell and presentation |

The provided ZIP is a **baseline archive**, not evidence that its contents have been deployed or browser-tested. This spec is **not a rewrite of the app**, nor a published upgrade.

## 9. Work status register — As of 2026-11-02

| Item | Design status | Implementation / verification status |
| --- | --- | --- |
| Clearframe name; Rootline/Threadwork separation | Approved | Name found throughout supplied v3 files; other projects not altered |
| Offline native PWA, private local data, JSON backup | Approved | Code/doc present in v3; not retested in a browser during this audit |
| Five fields, shared IDs and pointers | Approved | Data/atlas code present in v3 |
| Editable patterns and role-agnostic themes | Approved | Code present in v3; interaction needs regression tests |
| No People & Evidence UI; dormant legacy records preserved | Approved | README/schema/store and current nav support this design |
| Static, parallel healthy/concerning evidence; unchecked = unknown | Approved | Dictionary, UI and reasoner code present in v3 |
| Transparent evidence comparison and proportionate action | Approved | Basic deterministic implementation present; quality and edge cases still reviewable |
| Swap Shoes: Step 3 pronouns only; shared interactive checkboxes | **Approved** | **Implemented in v4; local simulated interaction tests passed; full browser/device QA pending** |
| Persona lens, role imposition, norms as instrumental justification, role-dependent interpretation/obligations | **Approved architecture** | **Not systematically represented yet in the built-in dictionary** |
| Clearly distinct instrumental versus emotional parentification | Conceptual distinction approved | Canonical record split/links require editorial decision and implementation |
| “Delete” and “Erase local data” not working | User-reported problem | Corresponding handlers exist in v3/v4 `app.js`; localStorage-fallback smoke tests pass in a simulated environment, but the reported browser problem is **not yet reproduced or verified fixed** |
| Textbook-audit candidate additions | **Proposed, not approved** | Not part of supplied v3 baseline |

## 10. Proposed research expansions — Not approved or implemented

The separately saved *Clearframe — Book 1, Expanded Concept Inventory and Atlas Gap Audit* (rev. 2; Nichols & Davis, *Family Therapy: Concepts and Methods*, 12th ed.) recommends **four possible indexing hubs, 22 possible shared subroutines, and at least 44 contrasting indicators**. These are editorial candidates, not adopted app definitions. Review for semantic overlap, observability, stigma, power/safety, and practical discrimination before adoption.

Proposed hub IDs: `implicit-control`, `family-role-pressure`, `reciprocal-conflict`, `identity-narrative`. Proposed subroutine examples: `hidden-rule-enforcement`, `role-locking`, `fusion-pressure`, `pursuit-withdrawal-loop`, `coercive-relief-loop`, `identity-based-duty-pressure`, and `narrative-monopoly`. The later approved persona-wrapper rule should **govern the framing** of `identity-based-duty-pressure`, rather than turning demographics into parent categories.

Proposed research-driven improvements also include multi-hop traversal, event-versus-inference separation, shared cognitive interpretation mechanisms, stronger safety/power context, and more fact-specific proportionate coaching. Distinguish what v3 already partially implements from any future expansion; do not present all proposals as shipped.

## 11. Acceptance and regression checklist for future releases

- [ ] Compare the new code against this document; preserve prior approved behavior.
- [ ] Verify all built-in IDs and cross-references resolve; no copy-pasted synonym records or broken shared pointers.
- [ ] Test editable routine and subroutine links, role alias edits, and custom deletes without affecting built-in definitions.
- [ ] Test **Erase local data** and each **Delete** action in a real browser with confirmation, cancellation, refresh, and persistence; protect backed-up/legacy data per specification.
- [ ] Test JSON export/import with fresh v2 data and existing v1 backups; no silent data loss.
- [ ] Test Step 3 both columns, checked/unchecked semantics, mixed outcomes, and high-severity precedence.
- [x] Simulated local tests: Swap Shoes pronoun reversal in both directions, checkbox interactivity and preservation, identical calculation before/after pure toggle, and recalculation on selection change.
- [ ] Repeat the above tests in real browsers and on the intended device before calling the feature fully verified.
- [ ] Test power- and persona-based examples: same behavior read differently for identical twins; imposed adult duties on a child regardless of gender/birth order; consensual age-appropriate chores not automatically classified as abuse.
- [ ] Check action suggestions for proportionality and recipient autonomy; never rationalize threats or tell a user to enforce control over another adult.
- [ ] Verify offline install/cache behavior, accessibility, and zero external dependencies; update service-worker cache key on asset changes.
- [ ] Test user privacy: no automatic saving of unsaved drafts and no upload of local records.
- [ ] Mark features **implemented** only after code review and a relevant runtime test; mark **published** only after an actual deployment succeeds.

## 12. Decision history and sources

- **2026-10-28–30:** Clearframe separated from Rootline and Threadwork; offline native PWA and five-field relational atlas agreed; People & Evidence UI removed; role aliases/theme swapping approved; shared pointer model, static contrasting indicators, and optional saving established. Source baseline: user-supplied v3 ZIP and its README/schema/code.
- **2026-11-02:** User affirmed parallel present-day comparison and wanted proportionate responses mindful of people on the receiving end; Swap Shoes was narrowed decisively to **pronoun inversion only** in Step 3. Earlier extra evidence sets and read-only restrictions were rejected.
- **2026-11-02:** User clarified and approved **persona-first mechanism classification**: characteristics are leveraged only as potential normative rationalizations, not an immutable-trait taxonomy. Persona-based interpretations and imposed obligations are distinct; instrumental parentification and identical-twin double standards are canonical tests.
- **2026-11-02:** Family therapy book rev. 2 audit remains a research **proposal**, not app code or an automatically accepted expansion.
- **2026-11-02 v4 package:** Implemented the approved Step 3 pronoun-perspective toggle without introducing separate evidence sets or altering the reasoning engine; bumped the offline cache version and added this specification to the archive. Node syntax and simulated interaction checks passed. Browser QA and GitHub publication remain separate tasks.

**Maintenance rule:** On any subsequent approval, append a brief dated change note here, update the relevant requirement/status, then separately record testing and deployment. This file must not rely on a chat transcript or compressed memory to preserve settled decisions.
