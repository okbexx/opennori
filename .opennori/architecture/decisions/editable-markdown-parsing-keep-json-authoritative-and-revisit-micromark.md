# editable-markdown-parsing-keep-json-authoritative-and-revisit-micromark Build-vs-Buy Decision

Area: generated-markdown-review-surface
Need: Allow agents and review tools to read OpenNori-generated Markdown summaries without turning Markdown into an import path or state authority
Recommendation: self-build

## Summary

OpenNori keeps JSON evidence, contract, profile, architecture, and ledger files authoritative and uses Markdown as generated review surface. The local helper is limited to OpenNori-owned generated acceptance review Markdown with an explicit marker and returns review-surface-only metadata. It must not become an authoritative import path, editable Markdown pipeline, frontmatter parser, or general Markdown parser without a new build-vs-buy decision.

## Candidates Checked

- Current project: Current project writes structured JSON as source of truth. Goal dossiers include `contract.json`, `ledger.json`, per-criterion JSON files, evidence records, and generated README.md review surfaces. The old `parseAcceptanceMarkdown` helper had no runtime call sites and risked implying Markdown import authority.
- Standard library: Node has no Markdown or frontmatter parser.
- Official SDK: No official OpenNori Markdown SDK exists; CommonMark-compatible libraries are the relevant ecosystem option.
- Open source: micromark 4.0.2 MIT, unified 11.0.5 MIT, remark 15.0.1 MIT, and gray-matter 4.0.3 MIT were checked on npm by 2026-06-23. They remain the candidates if frontmatter, AST editing, arbitrary Markdown parsing, or editable Markdown import becomes product scope.

## Self-build Reason

Self-build is limited to rendering and parsing OpenNori's own generated acceptance review Markdown marker as a read-only review helper. Arbitrary Markdown without the marker is not parsed as OpenNori state, and parsed results declare `authority: review-surface-only` plus `side_effect: none`. If Markdown editing/import becomes product scope, OpenNori must re-evaluate micromark, remark, gray-matter, unified, and schema-backed conversion before expanding local parsing.
