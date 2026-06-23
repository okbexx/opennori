# editable-markdown-parsing-keep-json-authoritative-and-revisit-micromark Build-vs-Buy Decision

Area: generated-markdown-review-surface
Need: Render OpenNori goal dossier README review surfaces without creating an editable Markdown import path or parser authority
Recommendation: self-build
Status: active



## Summary

OpenNori keeps JSON contract, ledger, criterion, evidence, profile, and architecture files authoritative. Goal dossier README files are generated review surfaces only; the old generated acceptance Markdown parser/helper was removed, and Markdown import/editing remains out of scope unless a new build-vs-buy decision selects micromark, remark, gray-matter, unified, or another parser stack.

## Candidates Checked

- Current project: Current goal dossiers already store authoritative contract.json, ledger.json, criteria/<AC-id>/criterion.json, status.json, and evidence JSON. README.md is regenerated from those files and is explicitly marked review-surface-only.
- Standard library: Node fs/path and string rendering are enough to write deterministic generated README surfaces. Node has no Markdown AST/frontmatter parser, and OpenNori no longer parses Markdown back into state.
- Official SDK: No official OpenNori Markdown SDK exists; no platform SDK is needed for generated README text.
- Open source: micromark, unified/remark, markdown-it, and gray-matter remain candidates only if editable Markdown import, frontmatter extraction, AST transforms, or arbitrary Markdown parsing becomes product scope. TK references such as Tolaria and compound-engineering-plugin show that Markdown-as-data products use explicit parser/model boundaries; OpenNori is not currently that product.

## Self-build Reason

Self-build is limited to deterministic README rendering for OpenNori-owned dossier projections. There is no Markdown-to-state parser, no frontmatter importer, no arbitrary Markdown ingestion, and no second protocol authority.
