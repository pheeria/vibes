# 🧭 AGENT_INSTRUCTIONS.md

## Purpose

This repository is built on a philosophy of **clarity, consistency, and composability**.
The code should prioritize *understanding and reasoning* over micro-optimization or abstraction for its own sake.

This guide defines **how to think** and **how to act** when writing, refactoring, or extending code in this project — especially for LLM agents assisting in development.

---

## 🧱 Core Engineering Principles

### 1. **Preserve structure; fix what's broken**

When debugging or improving code:

* Keep the existing structure and naming whenever possible.
* Fix bugs and inconsistencies *in situ*, rather than rewriting or rearchitecting unless absolutely necessary.
* Preserve the *intent* and *style* of the original author.

If the user says “fix this,” interpret it as “fix this while keeping my architecture and patterns intact.”

---

### 2. **Recursive reasoning, not iterative rewriting**

When analyzing algorithms, especially recursive ones:

* Don’t replace recursion with iteration unless explicitly asked.
* Preserve helper functions (`can`, `check`, etc.) exactly as written, fixing logic only if needed.
* Treat recursion as a design choice reflecting clarity over speed.

---

### 3. **Favor readability and explainability over cleverness**

Follow Ousterhout’s principle: *“Complexity is anything that makes code hard to understand.”*

* Avoid inline one-liners that obscure logic.
* Prefer intermediate variables with meaningful names over deeply nested expressions.
* Each function should do **one thing clearly** and **hide unnecessary details** behind good abstraction boundaries.

Ask: “Would someone six months from now understand this without extra context?”

---

### 4. **Be local, not global**

* Work with local context first (the current class, function, or file).
* Don’t change external modules unless necessary to fix local behavior.
* Assume other components are correct unless the issue explicitly spans multiple layers.

This ensures safety, minimal surprise, and better modular reasoning.

---

### 5. **Data transformations are explicit**

For data processing (Pandas, JSON, etc.):

* Don’t overwrite original data columns when cleaning or transforming — always create new columns (e.g. `_parsed_date` instead of modifying `date`).
* When grouping or filtering, handle `NaN`/`NaT` carefully — they should *not* be treated as equal values.
* Preserve column naming and structure for downstream processes.

This keeps data pipelines **predictable and traceable**.

---

### 6. **Debugging mindset**

* When a result looks wrong, don’t jump to refactoring — *trace the logic path first*.
* Keep the shape of data consistent (same columns, same indices).
* Add temporary debug prints, assertions, or validations, but remove them after verification.

LLMs should help by suggesting **instrumentation** (e.g., logging, checks), not redesigns.

---

### 7. **Design by contract, not by convention**

Each method should have clear preconditions and postconditions, even if implicit.
If a function depends on a specific column name or data type, document it in the docstring.
When adding new functions, make them predictable — if they fail, they should fail clearly and loudly.

---

### 8. **Modularity and information hiding**

Inspired by *A Philosophy of Software Design*:

* Minimize *deep* complexity by isolating details within modules.
* Each class or function should expose a simple interface that hides messy implementation details.
* Avoid tight coupling — a function should know as little as possible about its caller or callee.

Ask: *“Can I change the internals later without breaking the rest of the system?”*

---

### 9. **Data validation philosophy**

When handling real-world messy data (e.g., healthcare reports, decrees, Excel files):

* Normalize inputs, but keep raw inputs accessible.
* Separate validation from transformation — validation functions (`has_errors`, `check_*`) should not mutate data.
* Use clear, composable steps: **parse → validate → flag → summarize**.

---

### 10. **Output consistency**

When exporting data:

* Use human-readable formats (`indent=4`, explicit column headers).
* In Excel, enable autofilters, freeze headers, and adjust widths.
* Ensure bytes-based outputs (`BytesIO`) are safe and memory-managed (context blocks, `seek(0)` before reading).

---

### 11. **Styling and CSS**

When styling and designing HTML and CSS follow these rules:

* Use semantic HTML tags
* Avoid deep div nesting, especially for centering, prefer flexbox instead
* Design mobile-first layout

---

## 🧠 Behavioral Guidelines for LLM Agents

1. **Follow user intent precisely.**
   If the user says “fix,” don’t redesign.
   If the user says “refactor,” don’t change semantics.
   If the user says “optimize,” preserve structure but improve performance.

2. **Explain your reasoning as if teaching a senior engineer.**
   The user values clarity and rationale more than brevity.

3. **Assume an asynchronous, server-based context.**
   File I/O should prefer in-memory (`BytesIO`), and Pandas/Excel transformations should not depend on local filesystem writes.

4. **When integrating LLM or AI-assisted logic (e.g., Pinecone + OpenAI)**:
   Focus on semantic structuring of knowledge — text chunking, context-rich metadata, and predictable embeddings — rather than raw retrieval performance.

5. **Document reasoning clearly** in comments or markdown where appropriate.
   Each code block should be understandable on its own, without relying on chat history.

---

## 💡 Example Thinking Pattern

When asked:

> “Why doesn’t my DataFrame filter work?”

The correct reasoning path:

1. Inspect logical condition (operator precedence, NaN handling).
2. Suggest adding helper (`nonempty`) for composability.
3. Validate output shape matches input shape (index alignment).
4. Preserve the overall structure and naming.

Do **not**:

* Suggest vectorized alternatives that change semantics.
* Replace user logic with an entirely different approach.

---

## 🧩 Summary

This repository’s north star is **clarity over cleverness**.
Every function should read like a story — simple, predictable, and locally reasoned.

When in doubt:

> **Make it obvious. Make it robust. Make it composable.**

---

Would you like me to add a short **"LLM agent workflow checklist"** section at the end — like a 5-step sequence the model should follow before outputting any code (e.g., “Understand intent → Preserve structure → Validate types → Maintain local context → Explain reasoning”)?
That’s especially useful for ensuring consistency across automated code contributions.

