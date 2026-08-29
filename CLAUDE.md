# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**On Node 17+ the bare npm scripts do not work** — `npm run build` dies with `ERR_INVALID_ARG_TYPE` before compiling anything. Every `ember` invocation needs a two-part prefix:

```bash
# The prefix must be written inline on each command. Do not hoist it into a
# variable and use `env $VAR ...` - zsh does not word-split unquoted expansions,
# so env sets JOBS to the whole string and NODE_OPTIONS never gets set.
JOBS=1 NODE_OPTIONS=--openssl-legacy-provider npx ember serve               # -> :4200
JOBS=1 NODE_OPTIONS=--openssl-legacy-provider npx ember build -e production # -> dist/
JOBS=1 NODE_OPTIONS=--openssl-legacy-provider npx ember test                # headless Chrome
JOBS=1 NODE_OPTIONS=--openssl-legacy-provider npx ember test --server       # watch mode
JOBS=1 NODE_OPTIONS=--openssl-legacy-provider npx ember test --filter "a name"

npm run lint                 # lint:js + lint:hbs in parallel (no prefix needed)
npm run lint:js -- --fix     # eslint autofix
```

- `NODE_OPTIONS=--openssl-legacy-provider` — webpack 4 hashes with MD4, which OpenSSL 3 refuses (`ERR_OSSL_EVP_UNSUPPORTED`).
- `JOBS=1` — without it, the ancient `workerpool` bundled under `ember-cli-test-loader` calls `child.send()` with an array where Node now demands an object (`ERR_INVALID_ARG_TYPE`). This is why the `start` script already pins `JOBS=1`.

Notes:
- Lint currently fails on pre-existing errors (20 eslint, 18 ember-template-lint). Because `npm test` runs `lint:*` before `test:ember`, it never reaches the test run — run `ember test` directly with the prefix above. When adding lint fixes, don't treat the existing failures as regressions you introduced.
- `tests/` contains only `.gitkeep` placeholders — there are no test files yet. Test infra is ember-qunit + qunit-dom + testem (headless Chrome).
- testem is configured for `Chrome` specifically; on a machine without it, `ember test` fails with "Launcher Chrome not found" before running anything. To smoke-test without Chrome, build and boot `dist/` under jsdom — ember-data 3.18 additionally needs a `window.crypto.getRandomValues` polyfill or it throws "Cannot find a valid way to generate local identifiers".

## Architecture

Ember 3.18 (Octane edition) SPA, no backend, no routes — `Router.map` is empty and everything renders from `app/templates/application.hbs`.

### State: Ember Data as a local singleton store

There is no adapter/serializer and nothing is ever saved or fetched. Two singleton records are created in `ApplicationController`'s constructor via `wordleService.createWordleMeta()` / `createKeyboard()`:

- `wordle` id `1` — cursor `position`, `currentChance`, `freezed`, `freezeRows`, `gameOver`, `won`, `info`, `error`
- `keyboard` id `1` — `alphabets`, a hash of `letter -> "" | "correct" | "present" | "invalid"`

Everything reads them back with `store.peekRecord(...)` (`wordleService.wordleMeta` / `keyboardMeta`, and again in `wordle-component`). Models declare `attr("json")` although no `json` transform exists — harmless only because records are never serialized.

### The board's letters live in the DOM, not in the model

`wordleService._element(position)` does `document.querySelector(".wrapper div[data-test-id='<position>']")`. Typed letters are written to `element.textContent`; `_checkAnswer()` **reconstructs the submitted word by reading the five DOM cells behind the cursor**; tile results are applied by adding `correct` / `present` / `invalid` classes straight onto DOM nodes, staggered via `later()` at 650ms per tile. Consequence: changing the markup or the `data-test-id` attributes in `wordle-box-component.hbs` breaks game logic, not just styling.

### Flat position indexing

`position` is a single 0..29 index across the 6x5 grid, not `{row, col}`. Row boundaries are hardcoded in several places: `checkIfLastPositionInRow()` tests `[4, 9, 14, 19, 24, 29]`, and `checkIfCurrentRowIsFreezed()` maps position to row with an if/else ladder. `NO_OF_COLS = 5` / `CHANCES = 6` are module consts in `wordle-service.js`, but the derived literals (`5`, `- 5`, `% 5`, the boundary array, the ladder) are duplicated across the service and the mixin. Changing grid dimensions means editing all of them.

### Input flows through a mixin shared by two classic components

`app/mixins/wordle-mixin.js` exposes `callback(ev)` — the single keydown handler (letters, Backspace, Enter, freeze bookkeeping). It is mixed into:

- `wordle-component` — registers a `window` `keydown` listener throttled at 100ms in its constructor
- `keyboard-component` — on-screen buttons call `pressKey`, which synthesizes `{ keyCode: 65, key }` for letters (there is a `FIX ME` about not propagating real keycodes); Enter/Backspace bypass `callback` and call `wordleService._checkAnswer()` / `_removeCurrentLetter()` directly

Two freeze concepts, easy to confuse:
- `freezed` (boolean) — the current row is full, so further letters are ignored until Enter/Backspace
- `freezeRows` (hash row -> bool) — rows already submitted; the `freeze-helper` helper feeds this into a `.freeze-row` class (`pointer-events: none`)

### Guess evaluation

`_checkPositionLetters()` handles duplicate letters by building a map of each answer letter to its remaining unmatched indices (`_correctAnswersPositions`), then consuming positions as they are matched (`_findFirstNonMatchingIndex` / `_findFirstMatchingIndex` / `_removePositionFromArr`). Keyboard key colors never downgrade: `_addKeyboardClass` refuses to overwrite `correct`, and refuses to overwrite `present` with `invalid`.

### Word list

`app/constants/wordle-constants.js` (~2.3k lines) exports one pool and one alias:

- `ANSWER_WORDS` (2,310) — the curated pool `correctAnswer` is drawn from. Common, guessable, non-offensive.
- `Words` — currently just `[...ANSWER_WORDS]`, used to validate guesses. Kept as a separate export so a wider guess-only pool could be added here without touching the service.

So the answer pool and the accepted-guess pool are the same 2,310 words today. A ~10.7k-word dictionary (obscure entries plus slurs and profanity) used to be concatenated in as `PLURAL_WORDS`; commit `66c15f9` **deliberately deleted it**. Do not restore it — and if a wider guess list is ever wanted, it must be slur-filtered and wired to `Words` only, never to `ANSWER_WORDS`: a losing game renders the answer to the screen via ``info: `Answer is ${correctAnswer}` ``.

`wordle-service.js` builds a module-level `VALID_GUESSES = new Set(Words)` for O(1) guess checks, and draws the answer in `init()` via `pickAnswer()`. The draw must stay in `init()`: in a classic `Service.extend({...})` an expression in the object literal evaluates once at *module* load, freezing one answer onto the prototype for the whole page.

The answer is logged to the console by `{{log this.correctAnswer}}` in `info-component.hbs`, which is the easiest way to drive the game manually.

### Octane / classic mix

- Classic (`@ember/component`, `Component.extend(WordleMixin)`, `@computed`): `wordle-component`, `keyboard-component`
- Glimmer (`@glimmer/component`): `info-component`, `wordle-box-component`
- Templates are **not** co-located — they live in `app/templates/components/*.hbs`, and invocation is curly-style (`{{info-component}}`, `{{action ...}}`, contextual components yielded via `hash`). New components must follow this layout to resolve.

### Theming

`ApplicationController.setThemeBasedOnDevice()` reads `prefers-color-scheme` once at boot and adds `dark-mode` or `light-mode` to `document.body`. It does not react to later OS theme changes. All theme rules in `app/styles/theme.css` are scoped under those body classes; `app.css` imports `responsive.css` and `theme.css`.
