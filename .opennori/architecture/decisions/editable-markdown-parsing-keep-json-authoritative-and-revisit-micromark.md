# editable-markdown-parsing-keep-json-authoritative-and-revisit-micromark Build-vs-Buy Decision

Area: editable-markdown-parsing
Need: Parse OpenNori generated acceptance and report markdown only where users or agents may edit reviewable documents
Recommendation: self-build

## Summary

OpenNori keeps JSON evidence and contract files authoritative and uses Markdown primarily as generated review surface. The current tiny parser only recovers the known OpenNori acceptance table shape, so it can remain local for now; if user-edited Markdown becomes authoritative, micromark/remark/frontmatter libraries must be re-evaluated before expanding parsing.

## Candidates Checked

- Current project: Current project writes structured JSON as source of truth and has one local parseAcceptanceMarkdown helper for generated acceptance markdown.
- Standard library: Node has no Markdown or frontmatter parser.
- Official SDK: No official OpenNori Markdown SDK exists; CommonMark-compatible libraries are the relevant ecosystem option.
- Open source: micromark 4.0.2 MIT was checked on npm on 2026-06-12; remark and gray-matter are follow-up candidates if frontmatter/AST editing becomes product scope.

## Self-build Reason

Self-build is limited to parsing OpenNori's own generated table as a recovery/review helper; it is not a general Markdown parser. This boundary avoids adding parser dependencies until Markdown becomes authoritative user input.
