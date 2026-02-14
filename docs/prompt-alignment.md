# Prompt Alignment Baseline (xxcoder -> OMO)

## Scope

This document defines how xxcoder prompt design aligns with the OMO baseline while preserving the xxcoder thin-proxy runtime.

- Baseline source: `/mnt/d/dev/opensource/code-agent-workflow/oh-my-opencode`
- Target scope:
  - `templates/config/CLAUDE.md.example`
  - `templates/prompts/*.md`
- Non-goal: rewrite thin proxy agent wrappers (`templates/agents/xx/*.md`)

## Mapping Table

| xxcoder file | OMO source of truth | Alignment focus |
|---|---|---|
| `templates/config/CLAUDE.md.example` | `sisyphus-prompt.md`, `src/agents/sisyphus.ts` | skills-first routing, intent gate, delegation guardrails |
| `templates/prompts/developer.md` | `src/agents/hephaestus.ts` | autonomous execution discipline, completion contract, recovery |
| `templates/prompts/explorer.md` | `src/agents/explore.ts` | intent-analysis + parallel search + structured result contract |
| `templates/prompts/librarian.md` | `src/agents/librarian.ts` | A/B/C/D request classification, evidence-first external research |
| `templates/prompts/oracle.md` | `src/agents/oracle.ts` | pragmatic minimalism, concise advisory output contract |
| `templates/prompts/planner.md` | `src/agents/metis.ts` | intent-first pre-planning, anti-slop directives, QA guardrails |
| `templates/prompts/reviewer.md` | `src/agents/momus.ts` | blocker-only review, approval bias, max-3 blocking issues |
| `templates/prompts/looker.md` | `src/agents/multimodal-looker.ts` | multimodal extraction boundaries and delivery rules |

## Allowed Divergence (explicit)

Only these divergences are allowed:

1. Tool/runtime adaptation
- OMO internal tool calls (e.g., `task(...)`, `call_omo_agent`) may be translated to xxcoder-compatible semantics.
- Prompts may stay tool-agnostic when backend tool surfaces differ.

2. Thin proxy architecture preservation
- Role logic stays in `templates/prompts/*.md`.
- `templates/agents/xx/*.md` remain wrapper-only pass-through orchestrators.

3. Path and artifact conventions
- OMO-specific path assumptions (e.g., `.sisyphus/plans`) may be adapted to xxcoder plan/doc locations.

## Not Allowed Divergence

These are considered drift from OMO:

- Changing role identity/mission (e.g., Metis no longer pre-planning, Momus no longer blocker-only)
- Removing intent classification phases where OMO requires them
- Weakening evidence requirements into opinion-only responses
- Replacing OMO's minimalism/execution discipline with generic assistant behavior

## Current Alignment Decisions

- `CLAUDE.md` enforces a Skill Gate before request classification, with `skills/xx/SKILL.md` as routing source-of-truth.
- Wrapper role prompts were rewritten to mirror OMO role logic first, while keeping xxcoder runtime-neutral where tool APIs differ.
- Reviewer plan-path validation was adapted from OMO's fixed `.sisyphus/plans/*.md` to xxcoder-compatible plan input patterns.

## Prompt Optimization Checklist

- [x] Remove low-value filler and comment-style noise from shipped prompts.
- [x] Keep role instructions dense and executable.
- [x] Preserve OMO role boundaries (Developer/Explore/Librarian/Oracle/Planner/Reviewer/Looker).
- [x] Keep thin proxy subagent wrappers free of business logic.
- [x] Keep skills-first orchestration semantics in primary prompt.

## Maintenance Rule

Any future prompt change should cite the mapped OMO source section and explain whether it is:
- alignment, or
- runtime adaptation.

If neither applies, do not merge the change.
