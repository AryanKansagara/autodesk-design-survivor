# Design Survivor

Autodesk makes Fusion and other design/engineering software. Fusion already rebuilds parametric designs and exposes feature health; support documentation describes lost references after design changes. This independent prototype explores how to record parameter failures and dependency context.

**Fusion is unavailable here. The real CAD milestone is blocked. This repository implements an authored scalar design contract, not geometry, a Fusion SDK substitute, geometric rebuilds, reference repair or manufacturability validation.**

## Run

Node.js 22+; verified with Node 24.22.1/Linux. No dependencies, Autodesk account or SDK.

```sh
node --test
node cli.mjs
node cli.mjs /path/to/input.json
```

Optional input has `parameters` containing all six dimensions and `options` with `strategy` (`named` or `face-index`), `omitHoles`, and `includeUnknownGroup`. No files or CAD documents are mutated. Eight test groups cover valid controls, dependency failures, dimensional boundaries, unknown health, topology-contract failure and deterministic replay.

## What is evaluated

The declared bracket intent is width/height 20–80, thickness 2–10, hole diameter 2–16, edge distance 2–20 and fillet 0–8 in fictional consistent units. Finite values inside those bounds enter an ordered dependency graph:

- `base`: stock width and height are at least twice thickness.
- `hole-reference`: an **authored assumption** makes face-index references fail above thickness 6; the named strategy passes this symbolic check.
- `holes`: authored edge margin, two-hole spacing and height-clearance inequalities.
- `fillet`: an authored scalar clearance bound.
- `topology-contract`: the declared required hole count is two; an authored warning-clearing bad repair that omits holes fails this separate check.

Failed dependencies block downstream checks. The first failure is reported with feature identity and dependencies. Undeclared/nonfinite/out-of-intent dimensions yield `out_of_scope`, without pretending a healthy rebuild. An optional timeline-group observation remains unknown. Versioned inputs receive a SHA-256 fingerprint with canonical parameter ordering.

[benchmarks/demo.json](benchmarks/demo.json) records a real execution of a fixed 16-case symbolic sweep: eight parameter combinations for each authored strategy, plus out-of-intent, unknown-group and bad-repair controls. Differences between strategies follow the explicitly programmed threshold; they **are not measured Fusion robustness, geometric preservation or learned repair success**. The topology check compares authored metadata, not a B-rep hole count.

## Why this implementation and what remains

Node ESM keeps the contract evaluator directly runnable with runtime checks. C++ is appropriate for the eventual installed Fusion add-in or a real geometric kernel; using C++ for these scalar fixtures would not supply missing CAD integration. The next stage needs a licensed Fusion installation, authored bracket documents, disposable document copies, true feature-health extraction and measured geometry signatures. Only then can real strategy sweeps or bounded repair templates be evaluated. GitHub Actions runs the same tests and CLI demo; inspect the repository Actions tab for the latest hosted result.

## Sources and overlap

- [Fusion timeline warning resolution](https://help.autodesk.com/view/fusion360/ENU/?caas=caas%2Fsfdcarticles%2Fsfdcarticles%2FResolving-Timeline-Warning-or-Errors-in-Fusion-360.html): lost references and manual repair.
- [Copy/paste body warning](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/How-to-resolve-timeline-warning-or-error-on-a-copy-paste-body-in-Fusion-360.html): documented brittle-reference example.
- [TimelineObject healthState](https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/fusion_TimelineObject_healthState.htm): existing API and unknown group health.

This is unaffiliated with Autodesk. The opportunity is inferred; no confidential roadmap is claimed.
