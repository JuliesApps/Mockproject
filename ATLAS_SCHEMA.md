# Clearframe Atlas · Knowledge Model v2

This is an **original indexing framework**, not a diagnostic taxonomy. It is intended to grow as additional reference books are reviewed. The meanings and examples are hypotheses, not assertions about any person or diagnosis.

## Five connected fields

| Field | Canonical data location | Why it is separate |
| --- | --- | --- |
| 1. Control routine | `data.js` → `routines[].id` | Names a broad relational pattern once. |
| 2. Subroutine | `data.js` → `subroutines[].id`, linked by `routines[].subroutineIds[]` | A single mechanism can be referenced by multiple routines. |
| 3. Learned expectation | `subroutines[].learned` | A possible prediction conditioned by earlier experience. |
| 4. Protective response | `subroutines[].protective` | A possible once-useful survival adaptation, not a judgment. |
| 5. Present-day reality indicators | `evidence.js` → `entries[]`, linked by stable `routineIds[]` and `subroutineIds[]` | Specific observable behaviours potentially supporting or challenging an old prediction. |

The Atlas dynamically joins these records by ID; it never needs to copy a subroutine or an indicator into each parent folder. The fields on a given branch are **views of shared data**, not separate records.

## Example of the ID-based relationship

```json
{
  "routineId": "obligation",
  "subroutineId": "emotional-debt",
  "learnedExpectationField": "subroutines[emotional-debt].learned",
  "protectiveResponseField": "subroutines[emotional-debt].protective",
  "realityIndicatorIds": ["obligation-1", "obligation-3"]
}
```

That example describes *references*, not a second copy of the content. The production code resolves IDs from the two static dictionaries. Its calculations use only affirmative user-selected indicators: unselected indicators are unknown, not negative evidence.

## Role-neutral examples

Each routine may have `roleExamples.guardian` and `roleExamples.sibling`. The third stable role is `self`, the observer interpreting the situation. None of the role IDs is a person's name or a clinical label.

Personal names are display settings in local data:

```json
{
  "roleTheme": {
    "preset": "custom",
    "aliases": {
      "guardian": "WickedWitch",
      "sibling": "TinMan",
      "self": "DorothyGale"
    }
  }
}
```

Changing aliases must **never change the content or IDs** of routines, subroutines, indicators, or the comparison result. Existing v1 fields named `mother` and `sister` are accepted as legacy edit values, but new routines use `roleExamples` slots.

## Reference books and editorial safeguards

1. Add a stable ID for each genuinely distinct concept; avoid creating near-duplicate synonyms.
2. Describe the observed control dynamic separately from the person who performed it. Do not label someone's behaviour solely from a psychiatric diagnosis.
3. Keep learned expectations distinct from protective responses; an expectation is what someone predicts, a response is what they might do.
4. Add indicators on **both sides** where possible: observable continuity and observable difference. Neither a concerning behaviour nor a kind act proves someone's overall motives or safety.
5. Record a brief `source` such as *Book Title, chapter, page* for any definition derived from a book. Preserve original attribution, while writing your own concise descriptions rather than embedding long copyrighted text.
6. The dictionary can grow without requiring users to journal, store personal relationships, or submit identifiable information.

## Backups and historical storage

User exports use JSON `version: 2`, with optional saved comparisons, role-theme preferences, and edits. The previous version 1 format is accepted on import. Old `people`, `observations`, and saved `personId` fields remain in the storage/backup schema for **lossless archival compatibility**, but the People & Evidence user interface is removed.
