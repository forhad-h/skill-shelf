# Code-mixing in Bengali tech writing

Modern Bengali tech writing **regularly mixes** Bengali script with English technical terms in Latin script. This is the dominant register in Bangladeshi and West Bengali tech blogs, social media, and documentation. It is correct, not a mistake.

The skill's job is to apply Bangla Academy rules to the **Bengali-script portion** of the text and leave the Latin-script portion untouched. This reference defines where the boundary lies.

---

## The principle

The boundary is the script, not the language. If a word is in Latin script (a-z, A-Z, 0-9), it is **out of scope** for Bangla Academy spelling rules. If a word is in Bengali script (Unicode 0980–09FF range), it is **in scope**.

Examples:

| Word | Script | In scope for Bengali rules? |
|---|---|---|
| React | Latin | No — keep as-is |
| রিঅ্যাক্ট | Bengali | Yes — flag as code-mix suggestion (canonical form is React) |
| PostgreSQL | Latin | No — keep as-is |
| ডাটাবেস | Bengali | Yes — flag as code-mix suggestion (canonical form is database) |
| function | Latin | No — keep as-is |
| ফাংশন | Bengali | Yes — flag as code-mix suggestion |
| cache | Latin | No — keep as-is |
| ক্যাশে | Bengali | Yes — depends on context |

---

## Categories — keep as-is

These Latin-script words appear in 99% of Bengali tech writing. The skill does not flag, suggest, or change them.

### Product / service names

- React, Next.js, Vue, Angular, Svelte, Solid
- PostgreSQL, MySQL, MongoDB, Redis, SQLite
- AWS, GCP, Azure, Cloudflare, Vercel, Netlify
- Docker, Kubernetes, Helm
- GitHub, GitLab, Bitbucket
- Node.js, Deno, Bun
- Linux, macOS, Windows
- Slack, Discord, Notion, Linear
- Figma, Sketch, Photoshop

### Programming / API terms

- function, method, class, object, interface, type, enum
- variable, constant, parameter, argument
- array, list, dict, map, set, tuple
- string, integer, boolean, float
- async, await, promise, callback
- thread, mutex, semaphore, lock
- frontend, backend, fullstack, devops
- API, REST, GraphQL, gRPC, WebSocket, SSE
- database, schema, table, column, index, query
- cache, queue, stack, heap
- commit, push, pull, merge, rebase, branch, fork
- deploy, build, release, publish, rollback
- test, debug, profile, trace, log, monitor
- bug, feature, refactor, regression
- request, response, error, exception, timeout

### Library / framework names

- Next.js, Tailwind, Bootstrap, Material UI, Chakra UI, shadcn/ui
- pnpm, npm, yarn, pip, cargo
- TypeScript, JavaScript, Python, Rust, Go
- React Query, Zustand, Redux, MobX
- Express, FastAPI, Django, Flask, Gin

### File / system references

- File extensions: .js, .ts, .tsx, .py, .rs, .json, .yaml, .toml
- File paths: /etc/hosts, ~/projects/, C:\Users\
- Commands: `git status`, `npm install`, `docker run`
- URLs: https://example.com, http://localhost:3000
- Error strings: ECONNRESET, ENOENT, 404 Not Found

### Company / organization names

- Google, Microsoft, Apple, Meta, Amazon
- Local Bangladeshi companies by their English names
- Startup names in English

---

## Categories — flag once as a code-mix suggestion (not a correction)

When the user transliterated an English technical term into Bengali script, the canonical form is the Latin-script version. **Always flag this in SUGGESTIONS, never in CHANGES.** Never silently "correct" the user's Bengali-script transliteration to the Latin form. The user might have a reason (e.g. the post is targeted at non-English-readers, or the term is being introduced).

### Common transliterations to flag

| User wrote | Canonical | Suggestion |
|---|---|---|
| রিঅ্যাক্ট | React | code-mix: consider "React" |
| ডাটাবেস | database | code-mix: consider "database" |
| ফাংশন | function | code-mix: consider "function" |
| ফ্রন্টেন্ড | frontend | code-mix: consider "frontend" |
| ব্যাকেন্ড | backend | code-mix: consider "backend" |
| এপিআই | API | code-mix: consider "API" |
| কম্পাইলার | compiler | Bengali is canonical here, leave alone |
| সার্ভার | server | Bengali is canonical here, leave alone |
| অ্যাপ্লিকেশন | application | code-mix: consider "application" or "app" |
| লাইব্রেরি | library | Bengali is canonical here, leave alone |
| ইউজার | user | code-mix: consider "user" (also valid Bengali: ব্যবহারকারী) |
| পাসওয়ার্ড | password | Bengali is canonical here, leave alone |
| ডিবাগ | debug | code-mix: consider "debug" (verb form) |

### Tone for these suggestions

Always polite. The user's choice is valid. Mark each as `SUGGESTION:`, never as a fix.

```
SUGGESTION: "রিঅ্যাক্ট" is canonical in English as "React". Keeping রিঅ্যাক্ট
is acceptable, but most readers will parse "React" faster.
```

---

## Categories — never translate

Some Latin-script words must stay in Latin script. Do not flag them. Do not suggest a Bengali equivalent.

### Proper nouns

- Person names: জন (John), মাইকেল (Michael) — keep the user's spelling
- Place names: সান ফ্রান্সিসকো (San Francisco), নিউ ইয়র্ক (New York)
- Company names

### Code identifiers

- Variable names: `userId`, `isLoading`
- Function names: `handleClick`, `fetchData`
- Class names: `UserService`, `PostController`
- CSS class names: `.btn-primary`

### Specific terms with no good Bengali equivalent

- HTTP status codes: 200, 404, 500
- HTTP verbs: GET, POST, PUT, DELETE
- MIME types: application/json, text/html
- HTTP headers: Content-Type, Authorization
- Boolean values: true, false, null, undefined
- Format specifiers: %s, %d, %v

---

## Categories — Bengali is canonical (do not flag as "English")

These words look like they might be English loans, but they are the canonical Bengali forms. Do not flag.

- তথ্য (data / information — Bengali canonical form)
- বিদ্যুৎ (electricity)
- দূরত্ব (distance)
- চিহ্ন (sign / mark)
- সংখ্যা (number)
- পরিমাণ (quantity / amount)
- সম্ভব (possible)
- প্রয়োজন (need)
- ব্যবহার (use / usage)
- ব্যবস্থা (system / arrangement)
- দলিল (document)
- নমুনা (sample)
- নির্দেশ (instruction)
- পরীক্ষা (test)
- বিশ্লেষণ (analysis)
- নকশা (design)
- গণনা (calculation)
- ফলাফল (result)
- সার্ভার (server — Bangla Academy has an entry)
- কম্পাইলার (compiler)
- লাইব্রেরি (library)
- পাসওয়ার্ড (password)

These are Bengali words. They are not "transliterations of English". Do not flag them as code-mix.

**Rule:** If the user wrote a transliterated term in Bengali script (e.g. রিঅ্যাক্ট), flag in SUGGESTIONS. If the user already chose the Latin-script form (e.g. React), do not flag — they have already made the choice the suggestion would recommend.

---

## What the skill does

For each word in the user's draft:

1. **Detect the script** (Latin or Bengali).
2. **If Latin:** leave alone. Apply no Bengali rules.
3. **If Bengali:**
   a. Apply Bangla Academy rules (শ/স/ষ, ন/ণ, etc.)
   b. Check if it is a transliteration of a dominant English tech term. If yes, flag in SUGGESTIONS — never CHANGES, never silently rewrite.
   c. Check if it is a canonical Bengali word. If yes, leave alone.
4. **For multi-word phrases:** keep Latin-script words as-is even if the phrase is a hybrid ("React component" inside Bengali text).

---

## Boundary cases

### Bengali script inside a code block

```
`const user = "রহমান"`
```

The "রহমান" is inside a code string, so it is part of code. Do not apply Bengali rules. Do not flag as code-mix.

### English word inside a Bengali sentence with Bengali-script transliteration

"আমি React ব্যবহার করি" — leave React as-is. "আমি রিঅ্যাক্ট ব্যবহার করি" — flag as suggestion.

### Bengali-script word inside an English sentence

"The developer ভাষা is changing" — the word ভাষা is in Bengali script inside an English sentence. Apply Bengali rules to ভাষা. Leave the English alone.

---

## What this skill does NOT do

- It does not force all technical terms to Bengali script (the opposite mistake).
- It does not auto-correct "React" to "রিঅ্যাক্ট".
- It does not flag a Bengali term as English because it has an English etymology.
- It does not translate proper nouns.
- It does not change the user's mix ratio. If they use 80% Bengali and 20% English, keep that ratio. If they use 50/50, keep that.

---

## Self-check

For each word in the draft, ask:
1. What script is this word in?
2. If Bengali, is it canonical Bengali or a transliteration of a dominant English term?
3. If transliteration, would most readers parse the English form faster?
4. Is this a proper noun, code identifier, or technical standard (HTTP status, MIME type, etc.)?

If the answer to 4 is yes, leave alone. If the answer to 3 is yes, flag as suggestion. Otherwise, apply Bengali rules.