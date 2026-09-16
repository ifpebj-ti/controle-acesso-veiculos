# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
from its first published release.

## [Unreleased]

### Added

- Structured Issue forms for defects, improvements, and documentation.
- Pull Request checklist for traceability, validation, security, privacy, and operations.
- Project favicon based on the vehicle-access artwork.
- Multi-platform `linux/amd64` and `linux/arm64` container validation and publication.
- Architecture-specific SPDX SBOMs attached to each published multi-platform manifest.
- Reproducible frontend coverage and protected centralized Quality Gate workflow.
- Passive OWASP ZAP baseline reports for the disposable integrated stack.

### Changed

- Container scanning now rejects every critical vulnerability, including findings
  without an available fix, while continuing to reject fixable high-severity findings.

## Release process

Before publishing a release:

1. review the changes accumulated under `Unreleased` against merged Pull Requests;
2. move those entries to a new `MAJOR.MINOR.PATCH` section with the release date;
3. keep only user-facing, security, operational, and compatibility-relevant changes;
4. create the Git tag and GitHub Release from the reviewed commit on `main`;
5. open a new empty `Unreleased` section for subsequent work.

Changes merged before this changelog was introduced remain traceable through the
Git history, Pull Requests, Issues, and project Wiki. They must not be
retroactively presented as a published release without an evidence-based review.

[Unreleased]: https://github.com/ifpebj-ti/controle-acesso-veiculos/commits/main
