"""Exercise the real scanner against isolated Git histories, never project history."""

import hashlib
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

SCANNER = os.environ.get("GITLEAKS_BINARY") or shutil.which("gitleaks")


@unittest.skipUnless(SCANNER, "Set GITLEAKS_BINARY or install Gitleaks on PATH")
class HistoryScanTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="incidentlens-secret-scan-")
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.git("init", "--quiet")

    def git(self, *args):
        return subprocess.run(
            ["git", *args], cwd=self.root, check=True, capture_output=True, text=True
        )

    def commit(self):
        self.git("add", "--all")
        # Use the verified project identity only inside this disposable fixture.
        self.git(
            "-c", "user.name=Rifatur Rahman",
            "-c", "user.email=rifaturrahman1131@gmail.com",
            "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Scanner fixture",
        )

    def scan(self):
        return subprocess.run(
            [SCANNER, "git", "--log-opts=--all", "--redact", "--exit-code=1", "--no-banner",
             "--report-format=json", "--report-path=scan.json", "."],
            cwd=self.root, capture_output=True, text=True, timeout=30, check=False,
        )

    def test_root_commit_without_parent_scans_successfully(self):
        (self.root / "README.md").write_text("Clean initial commit\n", encoding="utf-8")
        self.commit()
        result = self.scan()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_deleted_synthetic_secret_in_root_is_detected(self):
        # Generated, deliberately invalid test credential; never a live secret.
        fixture = "ghp_" + hashlib.sha256(b"invalid-scanner-fixture").hexdigest()[:36]
        path = self.root / "fixture.txt"
        path.write_text("credential=" + fixture + "\n", encoding="utf-8")
        self.commit()
        path.write_text("Credential removed\n", encoding="utf-8")
        self.commit()
        result = self.scan()
        self.assertEqual(result.returncode, 1, "Historical fixture must fail the scan")
        report = (self.root / "scan.json").read_text(encoding="utf-8")
        self.assertIn("github-pat", [item["RuleID"] for item in json.loads(report)])
        self.assertNotIn(fixture, report + result.stdout + result.stderr,
                         "Scanner output must redact secrets")


if __name__ == "__main__":
    unittest.main()
