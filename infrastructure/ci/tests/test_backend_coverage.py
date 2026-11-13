import contextlib
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest
import xml.etree.ElementTree as ET

MODULE = Path(__file__).resolve().parents[1] / "summarize_backend_coverage.py"
spec = importlib.util.spec_from_file_location("backend_coverage", MODULE)
coverage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coverage)


def report(hits, extra=""):
    classes = []
    for project, hit in zip(coverage.PROJECTS, hits):
        classes.append(f'<package><classes><class filename="/repo/src/backend/{project}/Service.cs"><lines><line number="10" hits="{hit}"/></lines></class></classes></package>')
    return ('<coverage><packages>' + ''.join(classes) + extra + '</packages></coverage>').encode()


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name)

    def write(self, name, raw):
        (self.path / name).write_bytes(raw)

    def test_unions_hits_across_suites_and_deduplicates_copies(self):
        raw = report([1, 0, 0, 1])
        self.write("one.cobertura.xml", raw)
        self.write("copy.cobertura.xml", raw)
        self.write("two.cobertura.xml", report([0, 1, 1, 0]))
        result = coverage.consolidate(self.path)
        self.assertEqual((result['covered'], result['valid']), (4, 4))
        self.assertEqual(result['uniqueReports'], 2)

    def test_does_not_inflate_with_generated_migrations(self):
        extra = '<package><classes><class filename="/repo/src/backend/ControleAcessoVeiculos.Infrastructure/Data/Migrations/Snapshot.cs"><lines><line number="1" hits="1"/></lines></class></classes></package>'
        self.write("one.cobertura.xml", report([1, 0, 0, 0], extra))
        self.assertEqual(coverage.consolidate(self.path)['percent'], 25)

    def test_missing_reports_fail(self):
        with self.assertRaises(ValueError):
            coverage.consolidate(self.path)

    def test_missing_project_fails(self):
        self.write("one.cobertura.xml", b'<coverage><packages/></coverage>')
        with self.assertRaises(ValueError):
            coverage.consolidate(self.path)

    def test_malformed_xml_fails(self):
        self.write("one.cobertura.xml", b'<coverage>')
        with self.assertRaises(ET.ParseError):
            coverage.consolidate(self.path)

    def test_entities_rejected(self):
        self.write("one.cobertura.xml", b'<!DOCTYPE coverage [<!ENTITY x "bad">]><coverage/>')
        with self.assertRaises(ValueError):
            coverage.consolidate(self.path)

    def test_invalid_hit_count_fails(self):
        self.write("one.cobertura.xml", report([1, 1, -1, 1]))
        with self.assertRaises(ValueError):
            coverage.consolidate(self.path)

    def test_gate_returns_nonzero_below_threshold_but_writes_evidence(self):
        self.write("one.cobertura.xml", report([1, 0, 0, 0]))
        out = self.path / 'summary'
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(coverage.main([str(self.path), '--minimum-lines', '70', '--output', str(out)]), 1)
        self.assertTrue((out / 'summary.json').exists())

    def test_gate_passes_at_threshold(self):
        self.write("one.cobertura.xml", report([1, 1, 1, 0]))
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(coverage.main([str(self.path), '--minimum-lines', '75', '--output', str(self.path/'summary')]), 0)

    def test_rounding_does_not_cross_gate(self):
        self.write("one.cobertura.xml", report([1, 1, 1, 0]))
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(coverage.main([str(self.path), '--minimum-lines', '75.000001', '--output', str(self.path/'summary')]), 1)

    def test_utf16_entity_payload_rejected(self):
        self.write("one.cobertura.xml", '<!DOCTYPE coverage [<!ENTITY x "bad">]><coverage/>'.encode('utf-16'))
        with self.assertRaises(ValueError):
            coverage.consolidate(self.path)

    def test_foreign_absolute_path_and_traversal_are_not_accepted_as_production(self):
        self.assertIsNone(coverage.source_name('/unrelated/File.cs'))
        with self.assertRaises(ValueError):
            coverage.source_name('ControleAcessoVeiculos.API/../Sensitive.cs')


if __name__ == '__main__':
    unittest.main()
