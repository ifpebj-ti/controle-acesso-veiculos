import importlib.util
import json
import subprocess
import tempfile
from pathlib import Path
import unittest
from unittest import mock

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
        with mock.patch.object(release, 'api', return_value=ref) as api:
            with self.assertRaises(ValueError):
                release.verify_or_create_tag('0.5.0', 'b' * 40, 'Notes')
            self.assertEqual(api.call_count, 1)

    def test_existing_matching_tag_preserved(self):
        ref = {'object': {'type': 'commit', 'sha': 'a' * 40}}
        with mock.patch.object(release, 'api', return_value=ref) as api:
            release.verify_or_create_tag('0.5.0', 'a' * 40, 'Notes')
            self.assertEqual(api.call_count, 1)

    def test_new_tag_is_annotated_without_force_update(self):
        with mock.patch.object(release, 'api', side_effect=[None, {'sha': 't' * 40}, {}]) as api:
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
            with mock.patch.object(release, 'run', side_effect=results) as run, \
                 mock.patch.dict(release.os.environ, {'GITHUB_STEP_SUMMARY': str(summary)}):
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
            with mock.patch.object(release, 'run', side_effect=results), self.assertRaises(RuntimeError):
                release.main(['propose', '--plan', str(plan)])

    def test_source_must_be_full_sha_before_any_git_or_api_call(self):
        with mock.patch.object(release, 'run') as run:
            with self.assertRaises(ValueError):
                release.source_notes('HEAD; echo bad', '0.5.0')
            run.assert_not_called()


if __name__ == '__main__':
    unittest.main()
