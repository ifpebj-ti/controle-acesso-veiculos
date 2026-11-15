import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("quality_gate", ROOT / "infrastructure/ci/quality_gate.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
HEAD = "a" * 40
BASE = "b" * 40


def workflow_run(name, conclusion="success", run_id=1, status="completed", **changes):
    result = {
        "id": run_id,
        "path": ".github/workflows/" + name,
        "event": "pull_request",
        "head_sha": HEAD,
        "status": status,
        "conclusion": conclusion,
        "pull_requests": [{"number": 12, "head": {"sha": HEAD}, "base": {"sha": BASE}}],
    }
    result.update(changes)
    return result


class QualityGateTests(unittest.TestCase):
    def test_document_only_requires_dependency_review(self):
        self.assertEqual(gate.required_workflows(["README.md", "docs/guide.md"], ROOT),
                         ["dependency-review.yml"])
        self.assertFalse(gate.requires_codeql(["README.md", "docs/guide.md"]))

    def test_backend_requires_existing_security_and_data_workflows(self):
        self.assertEqual(set(gate.required_workflows(["src/backend/API/Program.cs"], ROOT)),
                         {"ci-backend.yml", "ci-containers.yml", "ci-demo-data.yml", "dependency-review.yml"})
        self.assertTrue(gate.requires_codeql(["src/backend/API/Program.cs"]))

    def test_frontend_requires_frontend_and_container_validation(self):
        self.assertEqual(set(gate.required_workflows(["src/frontend/src/Page.tsx"], ROOT)),
                         {"ci-frontend.yml", "ci-containers.yml", "dependency-review.yml"})

    def test_workflow_and_terraform_paths_preserve_existing_triggers(self):
        cases = {
            "infrastructure/oci/backup/main.tf": {"ci-oci-backup.yml", "dependency-review.yml"},
            "infrastructure/oci/homologation/scripts/public_tls.py": {"ci-oci-homologation.yml", "dependency-review.yml"},
            "infrastructure/database/backup.ps1": {"ci-database-recovery.yml", "dependency-review.yml"},
            "infrastructure/ci/quality_gate.py": {"ci-backend.yml", "dependency-review.yml"},
            ".github/workflows/ci-containers.yml": {"ci-containers.yml", "dependency-review.yml"},
        }
        for path, expected in cases.items():
            with self.subTest(path=path):
                self.assertEqual(set(gate.required_workflows([path], ROOT)), expected)

    def test_compose_change_requires_every_existing_dependent_workflow(self):
        self.assertEqual(set(gate.required_workflows(["infrastructure/docker/docker-compose.yml"], ROOT)),
                         {"ci-containers.yml", "ci-demo-data.yml", "ci-database-recovery.yml", "dependency-review.yml"})

    def test_missing_or_unsupported_trigger_fails_instead_of_skipping_validation(self):
        for source in ["on:\n  push:\n", "on:\n  pull_request:\n    branches: [main]\n",
                       "on:\n  pull_request:\n    paths:\n", "on:\n  pull_request:\n    paths:\n      - '!src/**'\n"]:
            with self.subTest(source=source), self.assertRaises(gate.GateError):
                gate.pull_request_paths(source)

    def test_current_workflow_filters_are_all_supported(self):
        for name in gate.WORKFLOWS:
            with self.subTest(workflow=name):
                gate.pull_request_paths((ROOT / ".github/workflows" / name).read_text(encoding="utf-8"))

    def test_successful_required_run_passes(self):
        self.assertEqual(gate.assess(["ci-backend.yml"], [workflow_run("ci-backend.yml")], [],
                                     HEAD, BASE, 12, False), ([], []))

    def test_missing_and_incomplete_run_remain_pending(self):
        for runs in [[], [workflow_run("ci-backend.yml", None, status="in_progress")]]:
            self.assertEqual(gate.assess(["ci-backend.yml"], runs, [], HEAD, BASE, 12, False),
                             (["ci-backend.yml"], []))

    def test_failure_cancellation_skip_and_timeout_cannot_pass(self):
        for conclusion in ["failure", "cancelled", "timed_out", "skipped", "neutral", "action_required"]:
            with self.subTest(conclusion=conclusion):
                self.assertEqual(gate.assess(["ci-containers.yml"], [workflow_run("ci-containers.yml", conclusion)],
                                             [], HEAD, BASE, 12, False), ([], ["ci-containers.yml"]))

    def test_previous_green_run_does_not_hide_a_later_failure(self):
        runs = [workflow_run("ci-backend.yml"), workflow_run("ci-backend.yml", "failure", run_id=2)]
        self.assertEqual(gate.assess(["ci-backend.yml"], runs, [], HEAD, BASE, 12, False),
                         ([], ["ci-backend.yml"]))

    def test_rerun_in_progress_does_not_reuse_previous_success(self):
        runs = [workflow_run("ci-backend.yml", None, status="queued")]
        self.assertEqual(gate.assess(["ci-backend.yml"], runs, [], HEAD, BASE, 12, False),
                         (["ci-backend.yml"], []))

    def test_other_source_pr_base_event_or_workflow_is_not_evidence(self):
        invalid = [
            workflow_run("ci-backend.yml", head_sha="c" * 40),
            workflow_run("ci-backend.yml", event="push"),
            workflow_run("ci-frontend.yml"),
            workflow_run("ci-backend.yml", pull_requests=[]),
            workflow_run("ci-backend.yml", pull_requests=[{"number": 13, "head": {"sha": HEAD}, "base": {"sha": BASE}}]),
            workflow_run("ci-backend.yml", pull_requests=[{"number": 12, "head": {"sha": HEAD}, "base": {"sha": "c" * 40}}]),
        ]
        for run in invalid:
            with self.subTest(run=run):
                self.assertEqual(gate.assess(["ci-backend.yml"], [run], [], HEAD, BASE, 12, False),
                                 (["ci-backend.yml"], []))

    def test_codeql_requires_the_expected_github_app_and_source(self):
        check = {"id": 2, "name": "CodeQL", "head_sha": HEAD, "app": {"slug": "github-advanced-security"},
                 "status": "completed", "conclusion": "success"}
        self.assertEqual(gate.assess([], [], [check], HEAD, BASE, 12, True), ([], []))
        for invalid in [dict(check, app={"slug": "untrusted"}), dict(check, head_sha="c" * 40)]:
            self.assertEqual(gate.assess([], [], [invalid], HEAD, BASE, 12, True), (["CodeQL"], []))
        self.assertEqual(gate.assess([], [], [dict(check, conclusion="failure")], HEAD, BASE, 12, True),
                         ([], ["CodeQL"]))

    def test_api_pagination_collects_all_bounded_results(self):
        with mock.patch.object(gate, "api_get", side_effect=[{"rows": [1] * 100}, {"rows": [2]}]):
            self.assertEqual(len(gate.paginated("owner/repo", "runs", "rows", "fixture-token")), 101)

    def test_pagination_limit_fails_closed(self):
        with mock.patch.object(gate, "api_get", return_value={"rows": [1] * 100}), self.assertRaises(gate.GateError):
            gate.paginated("owner/repo", "runs", "rows", "fixture-token")

    def test_real_git_diff_includes_the_deleted_side_of_a_rename(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.check_output(["git", *args], cwd=root).decode().strip()
            git("init", "-q")
            git("config", "user.email", "qa@example.test")
            git("config", "user.name", "Fictitious gate test")
            (root / "source.py").write_text("pass\n", encoding="utf-8")
            git("add", "source.py")
            git("commit", "-qm", "test: initial fixture")
            base = git("rev-parse", "HEAD")
            git("mv", "source.py", "notes.md")
            git("commit", "-qm", "test: rename fixture")
            head = git("rev-parse", "HEAD")
            event = {"pull_request": {"number": 12, "head": {"sha": head}, "base": {"sha": base}}}
            with mock.patch.object(gate, "required_workflows", return_value=[]) as required, \
                    mock.patch.object(gate, "api_get", return_value=event["pull_request"]), \
                    mock.patch.object(gate, "paginated", return_value=[]), \
                    mock.patch.object(gate, "requires_codeql", return_value=False):
                gate.run_gate(event, root, "owner/repo", "fixture-token", 1, 1)
            self.assertEqual(set(required.call_args.args[0]), {"source.py", "notes.md"})

    def test_new_pr_source_stops_the_old_gate(self):
        event = {"pull_request": {"number": 12, "head": {"sha": HEAD}, "base": {"sha": BASE}}}
        result = mock.Mock(stdout=b"README.md\0")
        changed = {"head": {"sha": "c" * 40}, "base": {"sha": BASE}}
        with mock.patch.object(gate.subprocess, "run", return_value=result), \
                mock.patch.object(gate, "api_get", return_value=changed), self.assertRaises(gate.GateError):
            gate.run_gate(event, ROOT, "owner/repo", "fixture-token", 1, 1)

    def test_timeout_cannot_approve_missing_validation(self):
        event = {"pull_request": {"number": 12, "head": {"sha": HEAD}, "base": {"sha": BASE}}}
        result = mock.Mock(stdout=b"README.md\0")
        with mock.patch.object(gate.subprocess, "run", return_value=result), \
                mock.patch.object(gate, "api_get", return_value=event["pull_request"]), \
                mock.patch.object(gate, "paginated", return_value=[]), \
                mock.patch.object(gate.time, "monotonic", side_effect=[0, 0, 2, 2]), \
                mock.patch.object(gate.time, "sleep"), self.assertRaises(gate.GateError):
            gate.run_gate(event, ROOT, "owner/repo", "fixture-token", 1, 1)


if __name__ == "__main__":
    unittest.main()
