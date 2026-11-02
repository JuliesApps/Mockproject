# Clearframe — Relational Pattern Atlas

A standalone, installable, offline-capable progressive web app written in native HTML, CSS and JavaScript (zero external libraries, CDNs, trackers, or AI APIs).

**Version 4:** Adds **Swap Shoes** in Step 3 of the emotion-processing comparison. This button reverses the displayed first-/third-person pronouns in present-day signals to help you read from the other perspective. It does **not** change any indicator ID, checkbox selection, or comparison calculation; checkboxes work normally in both views. Switching back restores the original wording. See **`DESIGN_SPEC.md`** for approved behavior and release-status distinctions.

## GitHub Pages

1. Create a new GitHub repository (separate from Rootline and Threadwork).
2. Upload **the contents of this folder** directly into the repository root. Keep the filenames and `.nojekyll`.
3. In **Settings → Pages**, choose **Deploy from a branch**, the `main` branch, and `/(root)`.
4. Open the URL GitHub Pages provides (usually `https://USERNAME.github.io/REPOSITORY/`).
5. For offline use, open once on a connection. Use your browser's **Install app** or **Add to Home screen** option when available.

## Privacy and storage

Your records are stored *only in this browser on this device* using IndexedDB, with a localStorage fallback. The static dictionary is public source code, but your entries are **not uploaded to GitHub or the hosting service**. Data is not synchronized between devices and is not encrypted. Someone with access to your browser profile may be able to read it. Export regular JSON backups and store them privately. Clearing browser/site data can delete your records.

## Scope: five connected fields

Clearframe organizes each pattern into **five linked fields**:

1. **Control routine:** A broad way one person may exert pressure or control.
2. **Subroutine:** A reusable, more specific mechanism or dynamic.
3. **Learned expectation:** What the person exposed to the pattern may come to anticipate.
4. **Protective response:** What they may have learned to do for self-preservation (an adaptation, not a moral judgment).
5. **Present-day reality indicators:** Observable behaviors that support or challenge that learned prediction.

There are 16 starting control routines, 41 shared subroutines with learned expectations and potential protective responses, and 64 observable present-day comparison signals. The definitions in `data.js` and `evidence.js` use stable IDs and references, so one subroutine or indicator can support several routines without copying text. The five-field path is visible under each control routine in the Atlas; the shared dictionary can be edited and cross-linked. `source` is an optional provenance field on subroutine edits for future book references.

Example characters occupy **role slots** (`guardian`, `sibling`, `self`). The default cast is neutral. Users may switch to the legacy MotherQ/SisterQ cast, try a storybook example (WickedWitch/TinMan/DorothyGale), or set custom aliases. Changing names never changes pattern classification or the reasoning engine.

The user describes a moment and recognizes whichever concrete reality indicators match their experience. A transparent reasoning engine compares the marked indicators with subroutine-specific learned predictions and distinguishes **present concerns**, **contrasting behaviour**, **mixed observations**, and **unknowns**. Serious coercion/violence indicators take priority over reassurance. Unmarked indicators remain unknown and do not count as opposing evidence. The process does not require journaling or a personal incident archive.

The previous **People & Evidence** tracker has been removed from the interface. Existing people and observation records from v1 are *retained but inactive* in JSON exports, rather than silently deleted. New installations do not create person profiles. v1 JSON backups are migrated to the v2 data format when imported.

Phrase matching only proposes initial topics, which the user can change; it does **not** understand arbitrary language. The app is **not AI** and cannot determine another person's intent or diagnose anyone. Saved entries are optional. The tool supports reflection and does not replace clinical care or emergency support.
