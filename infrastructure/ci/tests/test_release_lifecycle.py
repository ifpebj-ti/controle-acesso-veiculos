import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path
import unittest
import unittest.mock

spec = importlib.util.spec_from_file_location('release_lifecycle', Path(__file__).resolve().parents[1] / 'release_lifecycle.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
SAMPLE = "# Changelog\n\n## [Unreleased]\n\nNot published.\n\n### Fixed\n\n- Correct a fictitious defect.\n\n## [0.4.0] - 2026-10-22\n\n### Added\n\n- Previous release.\n"


class ReleaseTests(unittest.TestCase):
    def test_patch_proposal_preserves_baseline_and_is_extractable(self):
        text, plan = release.prepare(SAMPLE, 'patch', '686', '2026-11-12')
        self.assertEqual(plan['version'], '0.4.1')
        self.assertEqual(plan['branch'], 'chore/issue-686-release-v0.4.1')
        self.assertIn('## [0.4.0] - 2026-10-22', text)
        body = release.notes(text, '0.4.1')
        self.assertIn('Correct a fictitious defect.', body)
        self.assertNotIn('Previous release.', body)
        self.assertNotIn('Not published.', body)

    def test_minor_resets_patch(self):
        _, plan = release.prepare(SAMPLE.replace('0.4.0', '0.4.7'), 'minor', '686', '2026-11-12')
        self.assertEqual(plan['version'], '0.5.0')

    def test_versions_reject_shell_payload_and_leading_zeros(self):
        for version in ('01.2.3', '1.2', '1.2.3-rc.1', '1.2.3;echo bad', '../1.2.3'):
            with self.subTest(version=version), self.assertRaises(ValueError):
                release.valid_version(version)

    def test_branch_must_match_preparation_contract(self):
        self.assertEqual(release.branch_version('chore/issue-686-release-v0.5.0'), '0.5.0')
        for branch in ('main', 'chore/issue-698-release-automation', 'fork/release-v0.5.0', 'chore/issue-0-release-v0.5.0'):
            with self.subTest(branch=branch), self.assertRaises(ValueError):
                release.branch_version(branch)

    def test_requires_incorporated_changes(self):
        empty = SAMPLE.replace('### Fixed\n\n- Correct a fictitious defect.', '')
        with self.assertRaises(ValueError):
            release.prepare(empty, 'minor', '686', '2026-11-12')

    def test_missing_unreleased_or_baseline_rejected(self):
        for text in ('', '## [Unreleased]\n- Change\n', SAMPLE.replace('[Unreleased]', '[Pending]')):
            with self.subTest(text=text), self.assertRaises(ValueError):
                release.prepare(text, 'patch', '686', '2026-11-12')

    def test_invalid_issue_and_bump_rejected(self):
        for bump, issue in [('major', '686'), ('patch', '0'), ('patch', '686;echo bad')]:
            with self.subTest(bump=bump, issue=issue), self.assertRaises(ValueError):
                release.prepare(SAMPLE, bump, issue, '2026-11-12')

    def test_duplicate_release_section_rejected(self):
        text, _ = release.prepare(SAMPLE, 'minor', '686', '2026-11-12')
        with self.assertRaises(ValueError):
            release.notes(text + '\n## [0.5.0] - 2026-11-12\n- Duplicate\n', '0.5.0')

    def test_missing_notes_rejected(self):
        with self.assertRaises(ValueError):
            release.notes(SAMPLE, '0.5.0')

    def test_existing_wrong_tag_never_written(self):
        ref = {'object': {'type': 'commit', 'sha': 'a' * 40}}
        with unittest.mock.patch.object(release, 'api', return_value=ref) as api:
            with self.assertRaises(ValueError):
                release.verify_or_create_tag('0.5.0', 'b' * 40, 'Notes')
            self.assertEqual(api.call_count, 1)

    def test_existing_matching_tag_preserved(self):
        ref = {'object': {'type': 'commit', 'sha': 'a' * 40}}
        with unittest.mock.patch.object(release, 'api', return_value=ref) as api:
            release.verify_or_create_tag('0.5.0', 'a' * 40, 'Notes')
            self.assertEqual(api.call_count, 1)

    def test_new_tag_is_annotated_without_force_update(self):
        with unittest.mock.patch.object(release, 'api', side_effect=[None, {'sha': 't' * 40}, {}]) as api:
            release.verify_or_create_tag('0.5.0', 'a' * 40, 'Notes')
            self.assertEqual(api.call_args_list[1].args[0], 'git/tags')
            self.assertEqual(api.call_args_list[2].args[0], 'git/refs')
            self.assertEqual(api.call_args_list[2].args[1]['ref'], 'refs/tags/v0.5.0')

    def test_proposal_keeps_review_link_when_bot_prs_are_disallowed(self):
        with tempfile.TemporaryDirectory() as directory:
            plan = Path(directory) / 'plan.json'
            summary = Path(directory) / 'summary.md'
            plan.write_text(json.dumps({'branch': 'chore/issue-698-release-v0.4.1',
                                        'version': '0.4.1', 'issue': 698}), encoding='utf-8')
            results = [subprocess.CompletedProcess([], 0, '{"state":"OPEN"}', '')]
            results += [subprocess.CompletedProcess([], 0, '', '')] * 4
            results += [subprocess.CompletedProcess([], 1, '', 'GitHub Actions is not permitted to create pull requests')]
            with unittest.mock.patch.object(release, 'run', side_effect=results) as run, \
                 unittest.mock.patch.dict(release.os.environ, {'GITHUB_STEP_SUMMARY': str(summary)}):
                self.assertEqual(release.main(['propose', '--plan', str(plan)]), 0)
            self.assertIn('/compare/main...chore/issue-698-release-v0.4.1', summary.read_text(encoding='utf-8'))
            self.assertEqual(run.call_count, 6)

    def test_unexpected_proposal_failure_is_not_reported_as_success(self):
        with tempfile.TemporaryDirectory() as directory:
            plan = Path(directory) / 'plan.json'
            plan.write_text(json.dumps({'branch': 'chore/issue-698-release-v0.4.1',
                                        'version': '0.4.1', 'issue': 698}), encoding='utf-8')
            results = [subprocess.CompletedProcess([], 0, '{"state":"OPEN"}', '')]
            results += [subprocess.CompletedProcess([], 0, '', '')] * 4
            results += [subprocess.CompletedProcess([], 1, '', 'Network unreachable')]
            with unittest.mock.patch.object(release, 'run', side_effect=results), self.assertRaises(RuntimeError):
                release.main(['propose', '--plan', str(plan)])

    def test_source_must_be_full_sha_before_any_git_or_api_call(self):
        with unittest.mock.patch.object(release, 'run') as run:
            with self.assertRaises(ValueError):
                release.source_notes('HEAD; echo bad', '0.5.0')
            run.assert_not_called()


REVIEWED = "## Technical MVP release\n\nTechnical homologation only.\n\n### Highlights\n\n- Preserve tested vehicle flows.\n\n### Known limits\n\n- Physical pilot remains pending.\n"
SHA = "a" * 40
DIGEST = "sha256:" + "b" * 64
RAW = {"schemaVersion": 2, "manifests": [{"platform": {"os": "linux", "architecture": x}} for x in ["amd64", "arm64"]]}


class PublicationNotesTests(unittest.TestCase):
    def test_preparation_creates_reviewable_file_and_requires_edit(self):
        script = Path(release.__file__).resolve()
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            (folder / "CHANGELOG.md").write_text(SAMPLE, encoding="utf-8")
            subprocess.run([__import__("sys").executable, str(script), "prepare", "--bump", "patch", "--issue", "763", "--plan", "plan.json"], cwd=folder, capture_output=True, check=True)
            text = (folder / "docs/releases/0.4.1.md").read_text(encoding="utf-8")
            self.assertIn("Correct a fictitious defect.", text)
            self.assertNotIn("Previous release.", text)
            with self.assertRaises(ValueError):
                release.validate_reviewed_notes(text)

    def test_existing_review_file_is_not_overwritten_and_changelog_stays_unchanged(self):
        script = Path(release.__file__).resolve()
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            (folder / "CHANGELOG.md").write_text(SAMPLE, encoding="utf-8")
            notes = folder / "docs/releases/0.4.1.md"
            notes.parent.mkdir(parents=True)
            notes.write_text(REVIEWED, encoding="utf-8")
            result = subprocess.run([__import__("sys").executable, str(script), "prepare", "--bump", "patch", "--issue", "763", "--plan", "plan.json"], cwd=folder, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((folder / "CHANGELOG.md").read_text(encoding="utf-8"), SAMPLE)
            self.assertEqual(notes.read_text(encoding="utf-8"), REVIEWED)

    def test_incomplete_or_duplicate_sections_are_rejected(self):
        for text in [REVIEWED.replace("### Highlights", "### Other"), REVIEWED + "\n### Known limits\n- Duplicated\n", REVIEWED + "\n<!-- REVIEW_REQUIRED -->", REVIEWED.replace("- Physical pilot remains pending.", ""), REVIEWED + "\n### Container images\n"]:
            with self.subTest(text=text), self.assertRaises(ValueError):
                release.validate_reviewed_notes(text)

    def test_preview_does_not_claim_verified_publication(self):
        body = release.publication_notes(REVIEWED, "0.5.1", SHA)
        self.assertIn("Publication pending", body)
        self.assertNotIn("gates and integrated smoke completed", body)
        self.assertIn("-backend:0.5.1", body)
        self.assertIn("-frontend:0.5.1", body)
        self.assertNotIn(DIGEST, body)

    def test_published_notes_keep_format_install_commands_source_limits_and_links(self):
        with unittest.mock.patch.dict(release.os.environ, {"GITHUB_RUN_ID": "123456"}):
            body = release.publication_notes(REVIEWED, "0.5.1", SHA, {"backend": DIGEST, "frontend": DIGEST})
        self.assertTrue(body.startswith("## Technical MVP release"))
        self.assertIn("docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-backend:0.5.1", body)
        self.assertIn("docker pull ghcr.io/ifpebj-ti/controle-acesso-veiculos-frontend:0.5.1", body)
        self.assertIn(DIGEST, body)
        self.assertIn(SHA, body)
        self.assertIn("Physical pilot remains pending.", body)
        self.assertIn("blob/v0.5.1/CHANGELOG.md", body)
        self.assertIn("actions/runs/123456", body)
        self.assertIn("does not deploy a VM", body)

    def test_wrong_architecture_or_source_digest_blocks_publication(self):
        wrong = {"schemaVersion": 2, "manifests": [{"platform": {"os": "linux", "architecture": "amd64"}}]}
        for replies in [[wrong], [RAW, DIGEST, "sha256:" + "c" * 64], [RAW, "not-a-digest"], [None]]:
            results = [subprocess.CompletedProcess([], 0, json.dumps(x), "") for x in replies]
            with self.subTest(replies=replies), unittest.mock.patch.object(release, "run", side_effect=results), self.assertRaises(ValueError):
                release.verified_manifests("0.5.1", SHA)

    def test_both_manifest_architectures_and_source_tags_are_checked(self):
        replies = [RAW, DIGEST, DIGEST] * 2
        results = [subprocess.CompletedProcess([], 0, json.dumps(x), "") for x in replies]
        with unittest.mock.patch.object(release, "run", side_effect=results) as run:
            self.assertEqual(release.verified_manifests("0.5.1", SHA), {"backend": DIGEST, "frontend": DIGEST})
        self.assertEqual(sum(":sha-" + SHA in " ".join(call.args[0]) for call in run.call_args_list), 2)

    def test_existing_published_release_does_not_read_notes_manifests_or_overwrite(self):
        ref = {"object": {"type": "commit", "sha": SHA}}
        with unittest.mock.patch.object(release, "api", return_value=ref), unittest.mock.patch.object(release, "run", return_value=subprocess.CompletedProcess([], 0, '{"isDraft": false}', "")) as run, unittest.mock.patch.object(release, "source_reviewed_notes") as source, unittest.mock.patch.object(release, "verified_manifests") as manifests:
            self.assertEqual(release.publish_release("0.5.1", SHA, Path("unused.md")), 0)
        source.assert_not_called()
        manifests.assert_not_called()
        self.assertEqual(run.call_count, 1)

    def test_new_and_draft_releases_publish_only_after_verified_manifests(self):
        ref = {"object": {"type": "commit", "sha": SHA}}
        for existing in [subprocess.CompletedProcess([], 1, "", "not found"), subprocess.CompletedProcess([], 0, '{"isDraft": true}', "")]:
            with self.subTest(existing=existing.returncode), tempfile.TemporaryDirectory() as directory, unittest.mock.patch.object(release, "api", return_value=ref), unittest.mock.patch.object(release, "run", side_effect=[existing, subprocess.CompletedProcess([], 0, "", "")]) as run, unittest.mock.patch.object(release, "source_reviewed_notes", return_value=REVIEWED), unittest.mock.patch.object(release, "verified_manifests", return_value={"backend": DIGEST, "frontend": DIGEST}):
                target = Path(directory) / "notes.md"
                release.publish_release("0.5.1", SHA, target)
                command = run.call_args.args[0]
                self.assertEqual(command[2], "create" if existing.returncode else "edit")
                self.assertIn("--notes-file", command)
                self.assertIn(DIGEST, target.read_text(encoding="utf-8"))

    def test_bad_manifest_prevents_mutating_gh_command(self):
        ref = {"object": {"type": "commit", "sha": SHA}}
        with tempfile.TemporaryDirectory() as directory, unittest.mock.patch.object(release, "api", return_value=ref), unittest.mock.patch.object(release, "run", return_value=subprocess.CompletedProcess([], 1, "", "not found")) as run, unittest.mock.patch.object(release, "source_reviewed_notes", return_value=REVIEWED), unittest.mock.patch.object(release, "verified_manifests", side_effect=ValueError("mismatch")), self.assertRaises(ValueError):
            release.publish_release("0.5.1", SHA, Path(directory) / "notes.md")
        self.assertEqual(run.call_count, 1)


class ProposalReviewGateTests(unittest.TestCase):
    def test_unreviewed_proposal_fails_before_tag_and_reviewed_copy_passes(self):
        script = Path(release.__file__).resolve()
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            text, _ = release.prepare(SAMPLE, "patch", "763", "2026-11-18")
            (folder / "CHANGELOG.md").write_text(text, encoding="utf-8")
            target = folder / "docs/releases/0.4.1.md"
            target.parent.mkdir(parents=True)
            target.write_text(release.review_template(release.notes(text, "0.4.1"), "0.4.1"), encoding="utf-8")
            command = [__import__("sys").executable, str(script), "check-proposal", "--branch", "chore/issue-763-release-v0.4.1"]
            self.assertNotEqual(subprocess.run(command, cwd=folder, capture_output=True).returncode, 0)
            target.write_text(REVIEWED, encoding="utf-8")
            self.assertEqual(subprocess.run(command, cwd=folder, capture_output=True).returncode, 0)

    def test_unrelated_pr_does_not_require_release_files(self):
        script = Path(release.__file__).resolve()
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([__import__("sys").executable, str(script), "check-proposal", "--branch", "fix/issue-763-reviewed-release-notes"], cwd=directory, capture_output=True)
            self.assertEqual(result.returncode, 0)


class LegacyReleaseTests(unittest.TestCase):
    def test_existing_legacy_release_needs_no_retroactive_review_file_or_rebuild(self):
        ref = {"object": {"type": "commit", "sha": SHA}}
        with unittest.mock.patch.object(release, "source_notes"), unittest.mock.patch.object(release, "api", return_value=ref), unittest.mock.patch.object(release, "run", return_value=subprocess.CompletedProcess([], 0, '{"isDraft": false}', "")) as run, unittest.mock.patch.object(release, "source_reviewed_notes") as reviewed:
            self.assertEqual(release.main(["tag", "--branch", "chore/issue-713-release-v0.5.0", "--commit", SHA]), 0)
        reviewed.assert_not_called()
        self.assertEqual(run.call_count, 1)

    def test_existing_wrong_tag_is_rejected_before_curation_or_dispatch(self):
        ref = {"object": {"type": "commit", "sha": "c" * 40}}
        with unittest.mock.patch.object(release, "source_notes"), unittest.mock.patch.object(release, "api", return_value=ref), unittest.mock.patch.object(release, "run") as run, unittest.mock.patch.object(release, "source_reviewed_notes") as reviewed, self.assertRaises(ValueError):
            release.main(["tag", "--branch", "chore/issue-713-release-v0.5.0", "--commit", SHA])
        run.assert_not_called()
        reviewed.assert_not_called()


if __name__ == '__main__':
    unittest.main()
