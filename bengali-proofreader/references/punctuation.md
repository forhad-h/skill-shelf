# Bengali punctuation

Bengali uses a mix of Bengali-specific marks (দাড়ি, দ্বৈত দাড়ি) and the same Unicode codepoints as English (কমা, প্রশ্নচিহ্ন, বিস্ময়চিহ্ন, কোলন, সেমিকোলন). Modern Bangladeshi tech writing commonly mixes Bengali দাড়ি with English periods. This reference defines the rules and what to do when the user has mixed them deliberately.

---

## দাড়ি (।) — U+0964

The Bengali full stop. The canonical sentence-ending mark in Bengali prose.

**When to use দাড়ি:**
- End of a Bengali sentence in prose
- End of a Bengali paragraph in formal / literary writing
- End of a Bengali clause that closes a thought

**When NOT to use দাড়ি:**
- Inside code blocks, URLs, file paths, file extensions
- After an abbreviation that uses English period (e.g. "Dr.", "etc.")
- Inside numbers (use কমা in Bengali, or follow the user's preference)

**Modern mix convention:**
Modern Bangladeshi tech writing often mixes দাড়ি and English period (`.`). This is acceptable as long as the mix is consistent within a single document. **If the user mixed them deliberately, keep the mix. Do not standardize.** Only flag in CHANGES if the user used only English periods in a Bengali-only paragraph and the inconsistency is unintentional.

**Examples (correct):**
- "আমি বাড়ি যাচ্ছি।" (দাড়ি)
- "আমি বাড়ি যাচ্ছি." (English period, acceptable in modern mixed register)
- "আমি বাড়ি যাচ্ছি। আর আমার ভাই স্কুলে।" (দাড়ি between sentences)

**Examples (wrong):**
- "আমি বাড়ি যাচ্ছি;" (semicolon at end of sentence — wrong)
- "আমি বাড়ি যাচ্ছি।।" (double দাড়ি — wrong; দ্বৈত দাড়ি is for verse)

---

## দ্বৈত দাড়ি (॥) — U+0965

The double দাড়ি. Used in:
- Sanskrit-influenced verse (চর্যাপদ, বৈষ্ণব পদাবলী)
- End of a stanza in poetry
- Sometimes at the end of a long formal passage in older literary Bengali

**When NOT to use দ্বৈত দাড়ি:**
- Modern prose
- Blog posts
- Tech writing
- Social media posts

If the user used দ্বৈত দাড়ি in modern prose, flag in CHANGES as a punctuation error and suggest দাড়ি.

---

## কমা (,) — same as English

Used freely in Bengali prose. The Bengali কমা is the same Unicode codepoint as the English comma.

**Rules (same as English):**
- Separate clauses in a compound sentence: "আমি গেলাম, কিন্তু সে আসেনি।"
- Separate items in a list: "আম, কাঁঠাল, লিচু।"
- After an introductory phrase: "তবে, আমি রাজি।"
- Around a non-restrictive clause: "রহমান, যে আমার বন্ধু, আজ আসবে।"

**No Bengali-specific কমা rules.**

---

## প্রশ্নচিহ্ন (?) — same as English

Used at the end of a Bengali question. Same Unicode as English.

**Examples (correct):**
- "তুমি কোথায় যাচ্ছ?"
- "কী হয়েছে?"
- "এটা কি সত্যি?"

**Examples (wrong):**
- "তুমি কোথায় যাচ্ছ।" — using দাড়ি for a question (should be প্রশ্নচিহ্ন)
- "তুমি কোথায় যাচ্ছ??" — double question mark, not standard in Bengali (avoid)

---

## বিস্ময়চিহ্ন (!) — same as English

Used at the end of an exclamatory sentence. Same Unicode as English.

**Examples:**
- "কী সুন্দর!"
- "সাবাস!"
- "দূর!"

**No double exclamation (!!) in standard Bengali prose.**

---

## কোলন (:) — same as English

Used to introduce a list, an explanation, or a quotation.

**Examples:**
- "তিনি তিনটি জিনিস বলেছেন: সত্য, সততা, সাহস।"
- "একটাই কথা: পড়াশোনা করো।"

Bengali কোলন is fine. No Bengali-specific rule.

---

## সেমিকোলন (;) — same as English

Used to join two independent clauses that are closely related. Rare in casual Bengali writing.

**Examples:**
- "আমি পড়ছি; আমার ভাই লিখছে।"

If the user used সেমিকোলন in a casual post, suggest replacing with দাড়ি or কমা.

---

## Quotation marks

Standard straight quotes `"..."` are dominant in modern Bengali tech writing. Bengali-specific curly quotes (`" "` `« »`) exist but are rare.

**Default:** keep whatever quotes the user used. Do not "normalize" curly quotes to straight or vice versa unless the user explicitly asks.

**In Bengali-script text (single level):**
- "তিনি বললেন, 'আমি আসব।'" — straight double outside, straight single inside
- "তিনি বললেন, "আমি আসব।"" — straight double both sides (acceptable but harder to read)
- 'তিনি বললেন, "আমি আসব।"' — curly double is also fine on its own: `তিনি বললেন, “আমি আসব।”`

**Nested quotes — recommended convention:**
When a quotation appears *inside* another quotation, alternate between **single straight** and **double curly** so the boundaries are visually clear:

- Outer = double curly `“ ”`
- Inner = single straight `' '`

Example of true nesting: he reported, `'তিনি বললেন, “আমি আসব।”'` — i.e. someone quoted what তিনি said.

This avoids `"" ""` nesting ambiguity. Apply it only when a quote contains another quote.

---

## Em dash (—) and en dash (–)

Same as English. Em dash is rare in standard Bengali prose. The proofreader does not silently substitute em dashes with কমা or দাড়ি — that is a punctuation-type substitution, not a wrong-mark correction.

**If the user used em dash:**
- Leave it alone. The user's choice is valid.
- If the user has opted into engagement suggestions, the engagement pass may flag it for rhythm, but the proofreader does not.

**Do not flag em dash as a spelling or punctuation error.**

---

## Ellipsis (...)

Same as English. Used mid-sentence to indicate continuation.

**Correct:** "আমি ভেবেছিলাম..."

**Wrong:** "আমি ভেবেছিলাম…" (curly ellipsis — not standard in Bengali; use three dots)

Both `...` (three dots) and `…` (single ellipsis character, U+2026) are accepted. Either is fine.

---

## Apostrophe (')

Used in English loanwords (don't's) and occasionally in Bengali transliterations (don't → ডোন্ট). No Bengali-specific rule. Keep the user's usage.

---

## Hyphen (-)

Used to join compound words or indicate line-break. No Bengali-specific rule. Keep the user's usage.

In Bengali-script text, hyphens are rare outside technical writing. If the user uses them freely, flag in CHANGES only if there is a clear stylistic inconsistency.

---

## Mixing দাড়ি and English period — the rules

| User's pattern | What to do |
|---|---|
| Only দাড়ি | Keep. No change. |
| Only English period | Flag in CHANGES as "punctuation consistency" and suggest standardizing to দাড়ি. Do not silently change. |
| Mixed (some দাড়ি, some period) | Keep the mix. Do not standardize. The user chose deliberately. |
| English sentence inside Bengali text ending with period | Keep. The English sentence follows English punctuation rules. |
| Bengali sentence ending with দাড়ি after English period elsewhere | Keep. Mixed is acceptable. |

**The user's mix is intentional until proven otherwise. When in doubt, do not standardize.**

---

## What this skill does NOT do

- It does not change curly quotes to straight quotes unless asked.
- It does not normalize spacing around punctuation (the Bangla Academy does not have strict spacing rules; some style guides add a space after দাড়ি, others don't).
- It does not enforce em-dash bans. Bengali prose allows em dashes; the skill only flags when the user used one in a context where কমা or দাড়ি would clearly read better.
- It does not flag the occasional দ্বৈত দাড়ি in a Sanskrit-influenced quote.

---

## Self-check questions

For each punctuation mark in the draft, ask:
1. Is this mark used correctly for its function (e.g. দাড়ি at end of sentence, not in the middle)?
2. Is the user's mix of দাড়ি and period consistent within paragraphs?
3. Did the user use any mark that does not belong in the register (e.g. দ্বৈত দাড়ি in a tech blog)?

If all three are yes, no punctuation change is needed.