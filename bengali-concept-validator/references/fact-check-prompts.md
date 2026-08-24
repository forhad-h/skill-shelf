# Fact-check prompts — finding misunderstandings

This is the bengali-concept-validator's main responsibility. The user said: "Check if there are any mis understanding of any concept, which concept I've clarified that should be accurate and legal."

This reference defines what counts as a misunderstanding, how to flag it, and what to do when the skill cannot verify the claim.

---

## What counts as a misunderstanding

A misunderstanding is a **verifiable factual claim** in the user's draft that is **wrong, misleading, or unverified**.

The skill flags:
- Technical claims that are demonstrably false (e.g. wrong API name, wrong version number, wrong mechanism description)
- Legal claims that are wrong (wrong statute, wrong jurisdiction, wrong rule)
- Medical or scientific claims that are wrong (wrong dosage, wrong biological mechanism)
- Common misconceptions presented as fact
- Unverified claims that could be costly if believed (legal, medical, financial advice)

The skill does NOT flag:
- Opinions ("I think X is overrated")
- Stylistic choices
- Metaphors and analogies
- Personal experiences ("I tried X and it failed")
- Predictions ("X will replace Y")
- Subjective judgments ("X is beautiful", "X is overrated")

If the user wrote something that is **wrong**, the skill flags it with the correction. If the user wrote something that is **unverifiable inside the skill**, the skill flags it as "needs verification by a qualified source". If the user wrote something that is **plausible but the skill cannot confirm**, the skill says so plainly.

---

## Prompt categories

For each factual claim in the draft, run through these prompts.

### Technical claims — software / hardware / engineering

1. **Is the version, library, API, or tool name current?**
   - "React 18 hooks" — current (as of 2026).
   - "React.createClass" — deprecated in React 16. Flag if the user presents it as current best practice.
   - "Node.js 16 LTS" — no longer LTS as of late 2023. Flag.

2. **Is the mechanism description correct?**
   - "A mutex blocks other threads from reading the variable" — correct (simplified).
   - "JavaScript is single-threaded, so callbacks cannot race" — partially correct; the callback queue is single-threaded, but the underlying async I/O can still race at the network level.
   - If the user describes a mechanism incorrectly, flag with the correct description.

3. **Is the number plausible?**
   - "HTTP requests take 50ms" — plausible.
   - "HTTP requests take 50 seconds" — implausible for normal traffic, flag.
   - "PostgreSQL can handle 10 million writes per second on a single instance" — implausible, flag.

4. **Is the security claim correct?**
   - "bcrypt is slow on purpose to prevent brute force" — correct.
   - "MD5 is cryptographically secure" — wrong, flag with "MD5 is broken; use SHA-256 or bcrypt for security".
   - "HTTPS encrypts the URL" — partially correct; HTTPS encrypts the path and query string but not the domain in DNS-over-HTTPS setups.

### Legal claims — Bangladesh / India / international

1. **Is the statute / regulation name correct?**
   - "বাংলাদেশের কপিরাইট আইন 2000" — Bangladesh Copyright Act 2000. Correct (the act is from 2000, with later amendments).
   - "বাংলাদেশের তথ্য ও যোগাযোগ প্রযুক্তি আইন 2006" — ICT Act 2006 (now amended as the Digital Security Act 2018). Flag if user presents the 2006 act as current.

2. **Is the jurisdiction right?**
   - If the user is writing about Bangladesh, Bangladesh law applies. Do not apply US or Indian law unless the user explicitly references another jurisdiction.
   - If the user mixes jurisdictions (e.g. mentions both Bangladesh and US law), flag the inconsistency.

3. **Is the rule current?**
   - "Fair use" — US concept (Copyright Act 1976, §107).
   - "Fair dealing" — Bangladesh / UK / Canadian concept. Bangladesh does not have a strict "10% = fair" rule; fair dealing is case-by-case. Flag if the user presents a number.
   - "GDPR applies to all websites globally" — incorrect; GDPR applies to data of EU residents regardless of where the company is. Flag if user says "all websites".

4. **Is the penalty / consequence accurate?**
   - "Pirating software is a civil matter in Bangladesh" — actually a criminal matter under the Copyright Act 2000 §17. Flag if user understates.

5. **Is the case law / precedent correctly cited?**
   - If the user cites a specific case name, verify it. If you cannot verify inside the skill, flag as "needs verification by a qualified legal source".

### Medical claims

1. **Is the dosage correct?**
   - If the user gives a specific dosage, flag as "needs verification by a qualified medical source" — do not attempt to correct.

2. **Is the interaction correct?**
   - "Drug X interacts with drug Y" — if you are not 100% sure, flag as "needs verification".

3. **Is the mechanism correct?**
   - "Vitamin C prevents colds" — disputed (some studies show mild reduction in duration, not prevention). Flag if presented as fact.
   - "Vaccines cause autism" — wrong, dangerous. Flag explicitly as a misconception.

### Scientific claims

1. **Is the physical / chemical / biological mechanism correct?**
   - "Water boils at 100°C at sea level" — correct.
   - "Humans use only 10% of their brain" — wrong, common misconception. Flag.
   - "The Earth is flat" — wrong. Flag.

2. **Is the source cited correctly?**
   - "According to a 2019 study by..." — if you cannot verify the study, flag as "needs verification".

### Financial claims

1. **Is the return / risk accurate?**
   - "Stock X will return 20% annually" — prediction, not flag-worthy.
   - "Crypto is risk-free" — wrong, flag.

2. **Is the tax / regulatory rule correct? (Bangladesh context)**
   - "Capital gains tax on stocks is 10%" — varies by holding period. Flag if user oversimplifies.

---

## How to flag

For each flagged claim, the output format is:

```
MISUNDERSTANDING: "<the line as written>"

What is wrong: <one-line explanation>
Correction: <the correct version, or "needs verification by a qualified source">
Source: <where the correction comes from, e.g. "Bangladesh Copyright Act 2000 §17" or "React 18 docs" or "common misconception">
```

Example:

```
MISUNDERSTANDING: "বাংলাদেশে কপিরাইট আইন অনুযায়ী, আপনি যদি কোনো বইয়ের ১০% কপি করেন তাহলে সেটা বৈধ।"

What is wrong: Bangladesh copyright law does not have a "10% = fair dealing" rule. Fair dealing is judged case-by-case based on purpose, nature, and amount.
Correction: Fair dealing in Bangladesh (Copyright Act 2000 §17(1)) is judged by purpose (research, criticism, review, news reporting) and the amount used, not by a fixed percentage.
Source: Bangladesh Copyright Act 2000, §17(1)
```

Example 2:

```
MISUNDERSTANDING: "React.createClass এখনো React এর স্ট্যান্ডার্ড।"

What is wrong: React.createClass was deprecated in React 16 (released 2017) and removed in later versions. The current standard is class components or function components with hooks.
Correction: Use React.Component (class) or function components with hooks (React 16.8+).
Source: React 16 release notes (2017); React docs current.
```

---

## Tone

When flagging, the tone is calm and specific. Do not lecture. Do not moralize. Just state what is wrong, what is right, and where the correction comes from.

Do not write things like "this is a serious error" or "you should know this". The user might be a beginner; condescension does not help.

---

## What this skill does NOT do

- It does not flag opinions as misunderstandings.
- It does not flag predictions as misunderstandings.
- It does not flag personal experiences as misunderstandings.
- It does not flag metaphors or analogies as misunderstandings.
- It does not flag every technical claim — only the ones that are demonstrably wrong or misleading.
- It does not flag claims that are plausible but the skill cannot verify. Those go in "needs verification".

---

## Self-check before output

For each flagged item, ask:
1. Am I certain the claim is wrong? If not, downgrade to "needs verification".
2. Is the correction accurate? If not, leave it out.
3. Is the source cited correctly? If not, mark as "needs verification by a qualified source".
4. Is this an opinion or a verifiable fact? If opinion, do not flag.

When in doubt, mark as **needs verification** rather than guessing.