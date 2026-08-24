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

## Standard

All spelling and punctuation rulings follow the **Bangla Academy** বাংলা ভাষার বানান অভিধান. Where the Academy allows both forms, prefer the one dominant in modern Bangladeshi tech writing.

## Layout

```
skill-shelf/
├── bengali-post-editor/
│   └── SKILL.md
└── bengali-proofreader/
    ├── SKILL.md
    └── references/
        ├── code-mixing.md
        ├── common-errors.md
        ├── conjunct-rules.md
        ├── engagement.md
        ├── punctuation.md
        └── spelling-confusions.md
```
