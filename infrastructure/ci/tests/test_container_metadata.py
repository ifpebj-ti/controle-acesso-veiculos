import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("container_metadata", Path(__file__).resolve().parents[1] / "container_metadata.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SHA = "a" * 40


class MetadataTests(unittest.TestCase):
    def test_release_uses_application_version_and_full_source(self):
        self.assertEqual(module.metadata("refs/tags/v0.5.1", SHA), {"version": "0.5.1", "revision": SHA})

    def test_branch_and_pr_are_not_mislabeled_as_a_release(self):
        for ref in ["refs/heads/main", "refs/pull/42/merge"]:
            self.assertEqual(module.metadata(ref, SHA)["version"], "dev-" + SHA)

    def test_invalid_releases_and_sha_cannot_inject_outputs(self):
        for ref, sha in [("refs/tags/v01.2.3", SHA), ("refs/tags/v0.5.1-rc.1", SHA), ("refs/tags/v0.5.1\nrevision=bad", SHA), ("refs/heads/main", "short"), ("unknown", SHA)]:
            with self.subTest(ref=ref, sha=sha), self.assertRaises(ValueError):
                module.metadata(ref, sha)

    def test_inherited_base_version_or_revision_is_rejected(self):
        expected = module.metadata("refs/tags/v0.5.1", SHA)
        labels = {"org.opencontainers.image.version": "0.5.1", "org.opencontainers.image.revision": SHA, "org.opencontainers.image.source": module.SOURCE}
        module.verify(labels, expected)
        for key, wrong in [("org.opencontainers.image.version", "24.04"), ("org.opencontainers.image.revision", "b" * 40), ("org.opencontainers.image.source", "https://example.test/other")]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                module.verify({**labels, key: wrong}, expected)
        with self.assertRaises(ValueError):
            module.verify({}, expected)


if __name__ == "__main__":
    unittest.main()
