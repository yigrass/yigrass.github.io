# Reader Navigation and Release Contract

Project: yigrass.github.io. Task path: Personal Website / Reader Navigation and Release Contract. Active task: Reader Navigation and Release Contract. Status: completed. Position: main. Date: 2026-09-25. Return point: Personal Website / Review reader navigation and release contract.

## Scope and result

Implemented the user-approved markdown-it migration, producer-owned nested book/volume/chapter routes and array order, first-H1 tree titles, hidden README file rows, independent folding controls, resizable compact directory with content-sized highlights and dashed hover, spaced ASCII-pipe status text, approximate progress and the requested minimal copy barrier. Existing menu, trapezoid tab, theme, icon artwork and desktop lifecycle remain in use. Book icon and content bytes were moved to releases/sh-tales without changing Markdown or image bytes; only the current manifest changed. No Git writes, remote operations or delegation occurred.

The parser is markdown-it 15.0.2, bundled locally by esbuild 0.28.2 with licenses included in dist. VS Code documents its markdown-it extension interface at https://code.visualstudio.com/api/extension-guides/markdown-extension ; parser documentation is https://markdown-it.github.io/markdown-it/ . The website uses the same parsing core, not VS Code's complete preview UI or extensions. package-lock.json pins dependencies; the existing manual Pages workflow now installs them with npm ci --ignore-scripts.

The receiver no longer performs novel schema, ID, numbering, ordering, duplicate, format or content validation. It reads producer data and first H1 titles, preserves array order and copies all package files. Ordinary missing-file/JSON failures and filesystem escape/symlink protection remain. Production export tools own contract correctness. New v3 documentation, producer-side Schema and a two-volume/five-chapter example replace the active v2 contract. Existing historical delivery ZIPs are untouched.

## Verification

The final full check passed all 19 tests, including 231 desktop assertions, syntax, build, isolated input copy, actual HTTP/static entries, package-byte receipts and task controls. See check-verified.log. The previous count of 32 included v2 validation tests deliberately retired with the receiver's validation behavior; current tests instead cover passive receiving, scoped IDs, H1 parsing, nested Markdown, pane resizing and copy/progress behavior. Node's experimental VM warning is limited to the DOM test harness. Earlier failed checks are retained in check.log; check-final.log passed before the narrow-window refinement.

Browser verification used the local in-app browser at 127.0.0.1:4173. The long chapter opened directly at /file-explorer/a-floppy-disk/sh-tales/case-01/ep-02/. Directory width started at 220px; dragging clamped it to 160px. With directory widened to 394px, the reading pane remained 240px. Resizing the whole desktop window stopped at 416px with both pane minima satisfied. Closing and reopening through Explorer restored 220px. Narrow viewport testing at 390×844 revealed a window margin overflow; it was corrected, then verified at approximately 378px window width within the screen, with 160px/240px pane minima and internal horizontal scrolling. The temporary viewport override was reset.

Clicking a collapsed volume title opened its README without expanding it; the plus button expanded it separately. README rows were absent. At the directory minimum, the second volume label had 88px available for 96px of text, using one-line ellipsis. The second chapter's selection measured about 111px instead of filling the 220px sidebar. Hover produced a dashed outline. The ordinary long-chapter view showed 10% progress; scrolling beyond the prose showed 100% and allowed the final text line to reach the top. Ctrl+A inside the reading area left the selection empty; computed user-select was none. No browser warnings or errors were captured.

The portable novel-release-v3.zip contains 12 files. Every archived file was compared by SHA-256 to the current contract source; counts and bytes matched. contract-package.json records the ZIP hash and individual file hashes. The prior v2 ZIP remains historical evidence. Background preview PID 17828 was started with the shared Node runtime after replacing the stale preview process; its stdout/stderr are in this directory.

## Deliberate limits

Copy blocking is only a UI deterrent; public Markdown remains accessible. Progress is geometric and approximate, excluding the extra overscroll spacer. A short README or chapter can begin at 100%. Status separators are ASCII pipes with spaces; punctuation inside producer-supplied H1 titles is retained. New volume/chapter icons, persistent directory width preferences, bookmarks, configurable shortcuts and per-book styling remain future work. Remote deployment verification belongs to the user's next manual Pages run.
