# 01: Create the shared Airport Page renderer and test foundation

**What to build:** Introduce a single structured Airport Page presentation model and renderer that can display the existing six pages without changing what customers see. Establish the Playwright foundation used by later browser journeys and pure business-rule tests.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [ ] All six existing airport URLs render through one shared Airport Page presentation contract.
- [ ] The renderer accepts serializable published page data and does not directly own hardcoded airport lookup logic.
- [ ] Existing hero, terminal cards, benefits, fleet, FAQs, CTA, metadata intent, and booking links remain customer-visible.
- [ ] Existing mobile, tablet, and desktop layouts show no material visual regression.
- [ ] Preview and future database loaders can reuse the renderer without duplicating its markup.
- [ ] Playwright can run a browser smoke test and a non-browser pure-rule test through documented project commands.
- [ ] Test setup has a clear separation between authenticated admin scenarios, public scenarios, and deterministic rule tests.
- [ ] Tests assert user-visible output rather than private component structure.

## Answer

Implemented the shared Airport Page renderer, its serializable presentation model, and separate Playwright public, admin, and pure-rule test commands. The public smoke test covers all six current Airport Pages.
