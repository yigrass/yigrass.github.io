# Release Package Layout Refinement

Project: yigrass.github.io. Task path: Personal Website / Release Package Layout Refinement. Active task: Release Package Layout Refinement. Status: completed. Position: main. Date: 2026-09-25. Parent: Personal Website. Return point: Personal Website / Review release package layout.

## Result

Implemented the user's fixed received-artifact layout with exactly text/, images/, README.md and release.json at the novel root. Book README and volume README now resolve from fixed locations without manifest fields. Chapter files resolve as text/<volume-id>/<chapter-id>.md; public book/volume/chapter URLs and manifest array ordering remain unchanged. IDs are supplied by the producer, including nonnumeric names and repeated chapter IDs across volumes. The receiver does not scan directories to infer order or perform producer naming/content validation.

Chapter illustrations belong under images/<volume-id>/<chapter-id>/ and retain their supplied filenames/extensions. Book-level icon assets are grouped under images/book/; volume README illustrations, when supplied, use images/<volume-id>/README/. The existing sword image moved without changing its bytes. The demo Markdown and icon moves were hash-verified; moved-files.json records those bytes at the time of moving. The book and first volume README subsequently received only the necessary internal-link path edits. The five chapter texts are unchanged.

novelFiles in src/shared/novel/model.js is the shared location mapping used by the receiver and harness. The current novel-v4 contract removes readme/file configuration, documents producer array order and exports a complete example. The active v3 contract was retired; prior completed QA and v3 ZIP remain intact. No reader UI, styling, parser dependency, artwork, Git write or remote operation was performed in this iteration.

## Verification

The full check in check.log passed all 20 tests, including 231 desktop assertions, actual dist HTTP entries and release-byte receipts, a clean input-copy build, task controls and syntax. Revised tests verify fixed README discovery, manifest order differing from alphabetical file order, repeated scoped IDs, nonnumeric IDs, two differently suffixed chapter images, missing fixed-file failures and exactly four root entries in the demo/source and built release. Existing reader menu, sizing, copy/progress and history tests continue to pass. Node's VM-module warning comes from the existing test harness.

Browser verification reloaded the long chapter at /file-explorer/a-floppy-disk/sh-tales/case-01/ep-02/. The expected H1 and 10% initial progress appeared. All visible novel icon instances loaded from releases/sh-tales/images/book/sword.png. Clicking the first volume title loaded its fixed README; its link opened the first chapter. Clicking the book title loaded the root README and exposed the same correct public chapter link. No browser error or warning was captured. The long-chapter preview was left open. The old preview process was stopped before migration and restarted after verification as hidden PID 8944; logs are retained here.

novel-release-v4.zip contains 12 files. Each archived file's SHA-256 was compared directly with its contract source and the file counts matched. contract-package.json records the ZIP and per-file hashes. Local diff whitespace checks passed. The installed shared runtime was verified as Node v24.19.0 and npm 11.17.0.

## Markdown explanation and boundaries

The documentation now separates markdown-it syntax parsing, presentation CSS and additional rendering capabilities. VS Code official documentation was checked on 2026-09-25: https://code.visualstudio.com/api/extension-guides/markdown-extension describes CSS, markdown-it plugins and preview scripts; https://code.visualstudio.com/docs/languages/markdown documents built-in Mermaid and KaTeX math support. These capabilities are broader than the parser itself. This website retains its own Win95 styles and current basic Markdown features; no math, Mermaid, footnote or other extension was added.

Existing package-root-relative Markdown links remain the accepted convention. Root-layout rules and optional producer-side Schema are a producer responsibility; the receiver does not introduce a root-entry or file-format validator. Filesystem boundary protection and ordinary read/JSON errors remain. Remote deployment is a later user-operated step.
