# Conjunct rules (যুক্তাক্ষর)

Conjuncts (যুক্তাক্ষর) are combinations of two or more consonants in Bengali script. The way you write a conjunct follows strict rules from Bangla Academy. The most common errors are: forgetting the যোজক, writing র-ফলা incorrectly (e.g. পরকাশ instead of প্রকাশ), dropping the ল-ফলা, and applying the wrong vowel length.

This reference covers the four patterns that account for the majority of conjunct errors in Bengali tech writing.

## Diagnostic flow — read this first

When you see a Bengali word and suspect a conjunct error, walk through this in order. Stop at the first match.

1. **Are there two consonants adjacent with no visible vowel between them?**
   - Yes → conjunct is present. Skip to step 2.
   - No → not a conjunct error. Check `spelling-confusions.md` instead.

2. **Which form is the conjunct?**
   - যোজক (্) — silent killer, small diagonal under the first consonant
   - র-ফলা — র written as a descending tail below the first consonant (e.g. প্র, ক্র, ড়)
   - ল-ফলা — ল written as a tail below the first consonant
   - Ligature — the two consonants fuse (e.g. শ্ব, ক্ষ)

3. **Is the word তৎসম (Sanskrit-origin)?**
   - Yes → apply দীর্ঘ vowel rule from §3 (ঈ instead of ই, ূ instead of ু).
   - No → নিজীক (native Bengali) হ্রস্ব (ই / ু) is usually correct.

4. **Look up the specific pattern in §1–§5 below.**

5. **Still unsure?** Flag as `needs verification` in NOTES. Do not guess.

---

## 1. যোজক (্) — the silent killer

The যোজক is a small diagonal stroke under a consonant that indicates it is joined to the next consonant without an intervening vowel.

### Forms

- ক্ষ = ক + যোজক + ষ
- ব্যবহার = ব + যোজক + য + ব + হা + র
- বাংলা = ব + আ + ং + ল + আ. The `ং` is the anusvara (U+0982), a nasal mark that sits over the preceding letter. Historically the word was spelled `বঙ্গলা` with the letter `ঙ` (U+0999); modern Bangla Academy spelling uses the anusvara form `বাংলা`. The form `বাঙ্লা` (with explicit যোজক) is also accepted.

### Common errors

The most common যোজক errors are inside loans and technical words where a যোজক marker is silently dropped.

- "পরকাশ" → "প্রকাশ" (যোজক + র, also র-ফলা under প)
- "সম্পূর্ণ" → stays সম্পূর্ণ (স + যোজক + ম + পূ + র + ণ — যোজক is between স and ম)
- "উদ্দেশ্য" → stays উদ্দেশ্য (উ + দ + যোজক + দ + ে + শ + যোজক + য়)
- "দ্বন্দ্ব" → stays দ্বন্দ্ব (দ + যোজক + ব + ন + যোজক + দ + যোজক + ব — five যোজক markers in one word)

### The simple rule

When two consonants are adjacent and no vowel is between them, you need a যোজক or a ligature.

- "পরকাশ" → "প্রকাশ" (যোজক between প and র)
- "বিশ্ব" → stays বিশ্ব (শ্ব as a ligature, not পরকাশ style with যোজক)

### Diagnostic

If a word looks like it should have a conjunct (two consonants next to each other with no vowel visible) and you cannot see a যোজক or ligature, the spelling is probably wrong.

---

## 2. র-ফলা (র written as a tail)

When র follows another consonant in a conjunct, র is written as a descending tail (ফলা) **below** the preceding consonant. This is called **র-ফলা** and is the standard form for র in conjuncts.

> **Note on terminology:** In Unicode/code order, this conjunct is often written as `্র` (যোজক + র), but visually it appears as র drawn as a tail below the preceding consonant.

### Forms

- ক্র = ক + র-ফলা
- প্র = প + র-ফলা
- ব্র = ব + র-ফলা
- গ্র = গ + র-ফলা
- শ্র = শ + র-ফলা (e.g. শ্রম)
- ত্র = ত + র-ফলা (e.g. ত্রিভুজ, ত্রাণ)
- দ্র = দ + র-ফলা (e.g. দ্রব্য)
- স্র = স + র-ফলা (e.g. স্রাব)
- হ্র = হ + র-ফলা (e.g. হ্রাস) — see note below
- ন্র — uncommon, but follows the same rule

**Note on হ্র:** The conjunct হ্র is encoded as যোজক + র (হ + ্ + র) but visually rendered as র-ফলা under হ. See `spelling-confusions.md` §হ/হ্র for the হ vs হ্র distinction. The two references overlap by design — cross-check both when flagging.

### When র-ফলা is used

র-ফলা is used whenever র follows another consonant in a conjunct. This is the default and standard form across Bengali script.

- ক্রম (ক + র-ফলা + ম)
- প্রকাশ (প + র-ফলা + ক + আ + শ)
- ব্রাহ্মণ (ব + র-ফলা + আ + হ + ম + ণ)
- গ্রন্থ (গ + র-ফলা + ন + থ)
- ক্রমাগত (ক + র-ফলা + ম + আ + গ + ত)
- শ্রম (শ + র-ফলা + ম), শ্রেণী (শ + র-ফলা + ে + ণ + ী)
- ত্রিভুজ (ত + র-ফলা + ি + ভ + ু + জ), ত্রাণ (ত + র-ফলা + ণ)
- দ্রব্য (দ + র-ফলা + ব + য), দ্রুত (দ + র-ফলা + ু + ত)
- স্রোত (স + র-ফলা + ো + ত), হ্রাস (হ + র-ফলা + আ + স)
- গ্রাম (গ + র-ফলা + আ + ম), ধ্রুব (ধ + র-ফলা + ু + ব)

### When র-ফলা is NOT used

When র is just র in sequence after another consonant without forming a conjunct (i.e. with a vowel between them, or where the র is at the start of a syllable).

- আমরা (আ + ম + র + আ) — র is a full letter, not র-ফলা
- মরা (ম + র + আ) — র is a full letter, not র-ফলা
- করি (ক + ো + র + ি) — র is a full letter
- ধরা (ধ + র + আ) — র is a full letter
- শরৎ (শ + র + ত) — র is a full letter

### The compound র forms

For ম + র and some similar consonant pairs, র is rendered differently:

- স্মৃতি: স + যোজক + ম + যোজক + র + ৃ + তি. The মৃ part is ম + যোজক + র. Here র is rendered as a tail below ম (মৃ), which is visually similar to র-ফলা but is a specific compound form. This is the only common conjunct where র follows ম.
- স্মরণ: স + যোজক + ম + র + ণ. Here র is a **full letter র** standing alone after ম, not র-ফলা under ম. Unlike স্মৃতি (where ৃ sits on ম), the র here is a separate independent letter র in its own syllable. This is the key contrast with স্মৃতি: same root স্ম, but different vowel/morpheme structure changes whether র attaches to ম or stands alone.
- স্মারক: স + যোজক + ম + আ + র + ক. Here র is **not** র-ফলা, because there is a vowel (আ) between ম and র. The র here is a full letter র after মা. This is the contrast with স্মৃতি (where র attaches as a tail under ম via যোজক) — same মর sequence, but with a vowel between, র stays as a standalone letter.

### Common errors

- "করম" → "ক্রম" (র-ফলা under ক)
- "পরকাশ" → "প্রকাশ" (র-ফলা under প)
- "বরাহ্মণ" → "ব্রাহ্মণ" (র-ফলা under ব)
- "গরন্থ" → "গ্রন্থ" (র-ফলা under গ)
- "পরসঙ্গ" → "প্রসঙ্গ" (র-ফলা under প)
- "পরশ্ন" → "প্রশ্ন" (র-ফলা under প)
- "তরিভুজ" → "ত্রিভুজ" (র-ফলা under ত)
- "দরব্য" → "দ্রব্য" (র-ফলা under দ)
- "সরোত" → "স্রোত" (র-ফলা under স)
- "হরাস" → "হ্রাস" (র-ফলা under হ)

### Diagnostic

If a word starts with what looks like প/ক/ব/গ/শ/ত/দ/স/হ followed by র, and the র appears to be written as a separate letter র (not as a tail below the consonant), it is probably wrong. The র should be র-ফলা (descending tail below).

---

## 3. হ্রস্ব / দীর্ঘ vowels (স্বরবর্ণ)

The vowels ই/ঈ, উ/ঊ, and the consonant-vowel endings.

### হ্রস্ব ই (ি) vs দীর্ঘ ঈ (ী)

**হ্রস্ব ই (ি):**
- কিছু, কিতাব (older spelling of কিতাব — modern prefers কিতাব with হ্রস্ব)
- দিওয়া, দিয়ে (give), খিলি, ইট, ইদুর, ইমন
- Pronouns: কি (what), এই (this), ঐ (that)

**দীর্ঘ ঈ (ী):**
- কী (why / what), নদী (river), হরিণী (doe)
- Words ending in -ী: নদী, হরিণী, মী, গী, সী
- বাড়ী — older spelling, modern Bangla Academy uses বাড়ি (হ্রস্ব)

### হ্রস্ব উ (ু) vs দীর্ঘ ঊ (ূ)

**হ্রস্ব উ (ু):**
- তুমি, মুখ, খুব, ছুটি, বুঝ, রুটি, গুন, কুল, কুমির, ভুল
- Verb stems: শুন (hear), ঘুম (sleep)

**দীর্ঘ ঊ (ূ):**
- ভূমি, নূপুর, ভূত, কূপ, সূর্য, মূল্য, মূল
- তৎসম with দীর্ঘ: পূর্ণ, পূজা, ধূলা, চূর্ণ, দূর, দূত

### Quick rules

| Word pattern | Vowel | Why |
|---|---|---|
| কিতাব, কিছু, দিয়ে | হ্রস্ব ই | Native Bengali |
| নদী, হরিণী, কী | দীর্ঘ ঈ | Native Bengali or specific তৎসম |
| তুমি, মুখ, খুব | হ্রস্ব উ | Native Bengali |
| ভূমি, নূপুর, সূর্য | দীর্ঘ ঊ | তৎসম |

### Common errors

- "কীছু" → "কিছু" (হ্রস্ব ই)
- "ভুমি" → "ভূমি" (দীর্ঘ ঊ)
- "নুপুর" → "নূপুর" (দীর্ঘ ঊ)
- "সুর্য" → "সূর্য" (দীর্ঘ ঊ)
- "মুল্য" → "মূল্য" (দীর্ঘ ঊ)
- "পুর্ণ" → "পূর্ণ" (দীর্ঘ ঊ)
- "পুজা" → "পূজা" (দীর্ঘ ঊ)

---

## 4. তৎসম words retain Sanskrit spelling

This is a meta-rule that overrides the modern pronunciation. তৎসম (Sanskrit-origin) words keep their Sanskrit spelling even when Bengali pronunciation differs.

### Examples

- অন্ন (food) — pronounced অন্ন but spelled with double ন্ন (the যুক্ত ন্ন)
- সূর্য (sun) — pronounced শূর্য or সূর্য but spelled সূর্য
- মূল্য (price) — pronounced মূল্য but spelled মূল্য
- বিশ্ব (world) — pronounced বিশ্ব or বিশ্ব (with যুক্ত শ্ব)
- দ্বন্দ্ব (conflict) — pronounced দ্বন্দ্ব but spelled with the যোজক-ব markers
- ধন্যবাদ (thanks) — pronounced ধন্যবাদ but spelled ধন্যবাদ (with যুক্ত ন্য)

### Common errors

- "সুর্য" → "সূর্য" (দীর্ঘ ঊ required in তৎসম)
- "মুল্য" → "মূল্য" (দীর্ঘ ঊ)
- "অন" → "অন্ন" (তৎসম যুক্ত ন্ন)
- "বিস্ব" → "বিশ্ব" (তৎসম যুক্ত শ্ব)
- "ধন্যবাদ" → "ধন্যবাদ" (তৎসম যুক্ত ন্য)
- "সংস্কৃত" → stays as is (তৎসম, all যুক্ত forms correct)

---

## 5. Conjuncts that are easy to forget

These conjuncts are commonly dropped or mangled in tech writing:

| Correct | Common wrong | Why | Reference |
|---|---|---|---|
| ব্যবহার | বাবহার / বয়াবহার | যোজক ব + য + ব | §1 যোজক |
| বিশ্ব | বিস্ব | যুক্ত শ্ব | §1 যোজক |
| প্রয়োজন | পরয়োজন | র-ফলা under প | §2 র-ফলা |
| সম্ভব | সমভব | যোজক ম + ভ | §1 যোজক |
| সম্পূর্ণ | সম্পুর্ন / সম্পূর্ন | যোজক ম + প, ণ not ন | §1 যোজক + §3 vowel |
| সম্মান | সামান | যোজক ম + ম | §1 যোজক |
| প্রচুর | পরচুর | র-ফলা under প | §2 র-ফলা |
| প্রশ্ন | পরশ্ন | র-ফলা under প | §2 র-ফলা |
| সতর্ক | সতরক | যোজক ত + র (or রক is the root) | §1 যোজক |
| দ্বিধা | দিধা | যোজক দ্ব = দ + ব | §1 যোজক |
| দ্বারা | দারা | যোজক দ্ব + আ + র + আ | §1 যোজক |
| নির্ভর | নিভর | যোজক নি + র্ব = নির্ভর (with র্ব as conjunct) | §1 যোজক |
| নির্বাচন | নিবার্চন | যোজক নি + র্ব = নির্বাচন | §1 যোজক |
| জ্ঞান | জান / গ্যান | Conjunct জ্ঞ mandatory | §1 যোজক |
| ক্ষমা | কখমা / কশমা | Conjunct ক্ষ mandatory | §1 যোজক |
| বিষণ্ণ | বিষন্ন / বিষন্ণ | Double ণ, not ন | spelling-confusions §ন/ণ |

---

## 6. ঋ vowel (vocalic R)

The vowel ঋ (U+09C0) is a vocalic R used almost exclusively in তৎসম words. It is distinct from the consonant র followed by vowel ই (রি).

### Forms

- ঋষি (sage) — ঋ + ষি
- বৃক্ষ (tree) — বৃ + ক্ষ
- কৃপণ (miser) — কৃ + পণ
- পৃথিবী (earth) — পৃ + থি + বী
- দৃষ্টি (sight) — দৃ + ষ্টি
- মৃত্যু (death) — মৃ + ত্যু
- তৃণ (grass) — তৃ + ণ
- হৃদয় (heart) — হৃ + দয়
- নৃপ (king) — নৃ + প

### Diagnostic

If a তৎসম word has a consonant followed by what looks like a vowel-R combination, check if ঋ is required. The pattern is usually: consonant + ঋ + another consonant or a specific suffix.

### Common errors

- "রিষি" → "ঋষি" (ঋ is required, not রি)
- "বিরক্ষ" → "বৃক্ষ" (ঋ → ৃ in conjunct)
- "ক্রিপণ" → "কৃপণ" (ঋ → ৃ)
- "পৃতিবী" → "পৃথিবী" (preserve তৎসম spelling)
- "হৃদয" → "হৃদয়" (preserve তৎসম spelling)

---

## 7. য (U+099B) vs য় (U+09DF)

**য (U+099B) and য় (U+09DF) are two distinct consonants in the Bengali script.** They are not variant glyphs of each other — each has its own codepoint, and each is treated as a separate letter in Bangla Academy orthography.

- `য` — the consonant য (U+099B), used in native Bengali and তৎসম words.
- `য়` — the consonant য় (U+09DF), a separate letter that often appears at the start of a syllable or at the end of a conjunct.

### Where each appears

**`য` (U+099B):**
- যত্ন (care), যাওয়া (to go), যথা (as), যুদ্ধ (war)
- তৎসম words where য is the syllable onset: যোগ, যুক্ত, ন্যায়
- Conjuncts like প্রযুক্তি, ব্যবহার (where য participates in a যুক্তাক্ষর)

**`য়` (U+09DF):**
- Native Bengali words where য় is the syllable coda or follows a vowel: দয়া, নয়, বয়স, আয়, হয়, কয়, তয়
- তৎসম words where য় is part of a conjunct or final position: অয়ন, ভয়, শয়তান, ময়ূর

### Diagnostic

When a য/য় appears after a consonant, look up the canonical Bangla Academy spelling. য and য় are distinct, and the spelling is fixed by the lexicon, not by a visual rule.

### Common errors

- "দযা" → "দয়া" (use য় U+09DF, not য U+099B after দ here)
- "নয" → "নয়"
- "হয" → "হয়"
- "বযস" → "বয়স"
- "পরযোজন" → "প্রয়োজন" (র-ফলা under প, then য় U+09DF — not য)
- "অতিযরিক্ত" → "অতিরিক্ত" (no য়/য — canonically no such letter in this word)

---

## 8. এ-কার (ে) vs ও-কার (ো)

The vowel signs **এ-কার** (ে) and **ও-কার** (ো) are the two main mid/back vowel marks in Bengali script. They are written after a consonant and indicate the vowel sound of that syllable.

- **এ-কার (ে)** — the e-kar mark, indicates the vowel /e/ (as in "বেল", "কেমন", "দেশ").
- **ও-কার (ো)** — the o-kar mark, indicates the vowel /o/ (as in "বোল", "কোমল", "দোকান").

### When এ-কার (ে) is used

- Native Bengali words: বেল, কেমন, দেশ, মেঘ, এক, এসো
- তৎসম words: দেব, বেদ, শেষ, হেতু, নেতা, মেধা
- Common patterns: consonant + ে + consonant (মেঘ = ম + ে + ঘ)

### When ও-কার (ো) is used

- Native Bengali words: বোল, কোমল, দোকান, ঘোড়া, ওষুধ, ওই
- তৎসম words: দোষ, শোভা, সোম, মোহ, বোধ
- Common patterns: consonant + ো + consonant (ঘোড়া = ঘ + ো + ড + ় + আ)

---

## 9. অপিনিহিত অ (inherent অ)

The silent অ that sits after a consonant when no explicit vowel is attached.

### When অপিনিহিত is preserved

- Standard prose: কর (do), বল (say), লেখ (write)
- Technical writing: রান (run), কল (call)
- Most writing contexts

### When omission is allowed

- Poetry (meter-driven): short forms acceptable
- Rapid texting: অ often dropped
- Dialectal speech

### Diagnostic

If a word looks like consonant + consonant adjacent and the spelling is unclear, check if অপিনিহিত অ is needed:

- "কর" + suffix "ছি" → "করছি" (with অপিনিহিত অ)
- "কর" + suffix "তাম" → "করতাম" (with অপিনিহিত অ)

### Hard rule

**Never insert অপিনিহিত where the user has omitted it intentionally.** If the user wrote "করতাম" or "করতেছি", the অপিনিহিত অ is preserved. Don't add or remove it as a "correction".

---

## What this skill does NOT do

- It does not "modernize" spellings that have multiple accepted forms (e.g. তৎসম vs তদ্ভব — keep the user's choice if both are valid).
- It does not insert অপিনিহিত (inherent অ) where the user has omitted it intentionally (e.g. in poetry, rapid texting, dialectal writing).
- It does not flag every যোজক inconsistency as an error — some flexibility is allowed.

When in doubt, flag as `needs verification` in NOTES rather than guessing.