# skill-shelf

A shelf of reusable skills for working with Bengali-script posts. Each skill is a self-contained drop-in for tools like [Puku CLI](https://puku.sh) / Claude Code.

## Skills

### `bengali-post-editor`

Polish a Bengali-script draft into a publication-ready post. Routes the draft through:

1. `bengali-proofreader` (spelling + punctuation pass 1)
2. `bengali-concept-validator` (factual claims about tech, law, medicine, science, finance)
3. `bengali-proofreader` (spelling + punctuation pass 2 — realigns any substituted terms)

See [`bengali-post-editor/SKILL.md`](bengali-post-editor/SKILL.md).

### `bengali-proofreader`

Proofread a Bengali-script draft against [Bangla Academy](https://en.wikipedia.org/wiki/Bangla_Academy) rules:

- Spelling confusions (শ/স/ষ, ন/ণ, ব/ভ, র/ড়/ঢ়, হ/হ্র, ং/ঁ, য/জ)
- Conjunct rules (যোজক, র-ফলা, vowel length, তৎসম retention)
- Punctuation (দাড়ি, কমা, দ্বৈত দাড়ি, mixing with English punctuation)
- Common Bengali tech-writing errors
- Code-mixing policy (keep Latin-script terms; flag Bengali-script transliterations as suggestions)
- Optional engagement rewrites (opt-in only)

References live in [`bengali-proofreader/references/`](bengali-proofreader/references/).

See [`bengali-proofreader/SKILL.md`](bengali-proofreader/SKILL.md).

### `bengali-concept-validator`

Validate the **technical, legal, medical, scientific, and financial** claims in a Bengali-script draft. Returns a validation report with corrected versions attached; **never** rewrites the draft file. Sub-skill of `bengali-post-editor` — normally invoked through the editor pipeline.

Coverage:

- Technical claims (versions, APIs, mechanisms, plausible numbers, security)
- Legal claims (Bangladesh default; jurisdictions if referenced)
- Medical claims (mechanism, dosage flagged for qualified source)
- Scientific claims (physical / biological / chemical)
- Financial claims (returns, tax rules)

Reference: [`bengali-concept-validator/references/fact-check-prompts.md`](bengali-concept-validator/references/fact-check-prompts.md).

See [`bengali-concept-validator/SKILL.md`](bengali-concept-validator/SKILL.md).

### `digest`

Solve the **ingest problem**. Distill the last turn into an HRP v1 JSON envelope and render it via the data-driven HTML template (`harness-report.html`). Caps at ~10 bullets across files/decisions/errors/commands. Auto-opens in browser.

- Emits a fixed JSON envelope (`HRP` — Harness Report Protocol v1)
- Renderer is data-driven — the LLM writes JSON only, no HTML/CSS/markup
- Validator enforces: ≤10 bullets total, valid enums, no prose in `output_excerpt`
- Output goes to `./.harness-reports/harness-report-<ts>.html` (+ archived raw JSON)
- Auto-opens in the default browser (`xdg-open` / `open` / `cmd /c start ""`)

Files: `SKILL.md`, `hrp.schema.json`, `example-report.json`, `harness-report.html`, `renderer.js`.

See [`digest/SKILL.md`](digest/SKILL.md).

## Standard

All spelling and punctuation rulings follow the **Bangla Academy** বাংলা ভাষার বানান অভিধান. Where the Academy allows both forms, prefer the one dominant in modern Bangladeshi tech writing.

## Layout

```
skill-shelf/
├── bengali-post-editor/
│   └── SKILL.md
├── bengali-concept-validator/
│   ├── SKILL.md
│   └── references/
│       └── fact-check-prompts.md
├── bengali-proofreader/
│   ├── SKILL.md
│   └── references/
│       ├── code-mixing.md
│       ├── common-errors.md
│       ├── conjunct-rules.md
│       ├── engagement.md
│       ├── punctuation.md
│       └── spelling-confusions.md
└── digest/
    ├── SKILL.md
    ├── hrp.schema.json
    ├── example-report.json
    ├── harness-report.html
    └── renderer.js
```
