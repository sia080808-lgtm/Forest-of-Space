#!/usr/bin/env python3
"""Verify the approved snapshot, then import only its exact manifest paths."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import tempfile
from zipfile import ZipFile


def git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


def digest_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def prepare(archive: Path, manifest: dict, temporary: Path) -> list[dict]:
    if archive.stat().st_size != manifest["archive_size"]:
        raise RuntimeError("Archive size differs from the approved artifact")
    if digest_file(archive) != manifest["archive_sha256"]:
        raise RuntimeError("Archive SHA-256 differs from the approved artifact")
    expected = {entry["path"]: entry for entry in manifest["files"]}
    if len(expected) != manifest["file_count"]:
        raise RuntimeError("Manifest paths are not unique")
    seen = set()
    total = 0
    with ZipFile(archive) as source:
        for item in source.infolist():
            raw = PurePosixPath(item.filename)
            if raw.is_absolute() or ".." in raw.parts or not raw.parts:
                raise RuntimeError("Archive path escapes the snapshot")
            if raw.parts[0] != "Forest-of-Space" or "\\" in item.filename:
                raise RuntimeError("Unexpected archive root or separator")
            if stat.S_ISLNK(item.external_attr >> 16):
                raise RuntimeError("Symbolic links are not allowed")
            if item.is_dir():
                continue
            relative = PurePosixPath(*raw.parts[1:]).as_posix()
            if not relative or ".git" in PurePosixPath(relative).parts:
                raise RuntimeError("Archive may not write Git metadata")
            if relative in seen or relative not in expected:
                raise RuntimeError("Unexpected or duplicate archive file")
            entry = expected[relative]
            if item.file_size != entry["size"]:
                raise RuntimeError("Snapshot file size does not match manifest: " + relative)
            target = temporary / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            object_hash = hashlib.sha1(b"blob " + str(item.file_size).encode() + b"\0")
            count = 0
            with source.open(item) as reader, target.open("wb") as writer:
                for chunk in iter(lambda: reader.read(1024 * 1024), b""):
                    count += len(chunk)
                    if count > entry["size"]:
                        raise RuntimeError("Expanded file exceeded its approved size")
                    object_hash.update(chunk)
                    writer.write(chunk)
            if count != entry["size"] or object_hash.hexdigest() != entry["sha"]:
                raise RuntimeError("Snapshot bytes do not match manifest: " + relative)
            os.chmod(target, 0o755 if entry["mode"] == "100755" else 0o644)
            seen.add(relative)
            total += count
    if seen != set(expected) or total != manifest["uncompressed_size"]:
        raise RuntimeError("Snapshot is incomplete")
    return manifest["files"]


def import_snapshot(root: Path, prepared: Path, entries: list[dict], expected_head: str) -> str:
    if git(root, "rev-parse", "HEAD") != expected_head:
        raise RuntimeError("Checkout does not match the workflow commit")
    if git(root, "status", "--porcelain"):
        raise RuntimeError("Checkout must be clean before import")
    # This importer only accepts the single bootstrap directly following the
    # approved original main. It cannot be used to overwrite later versions.
    if git(root, "rev-parse", "HEAD^") != "9d94b7969ea9449a23fc0179f454d92b62d6d6c2":
        raise RuntimeError("This is not the authorized one-time bootstrap")
    bootstrap_paths = {
        ".github/workflows/import-forest-0-6-11.yml",
        "tools/import_forest_0_6_11.py",
        "tools/import_forest_0_6_11_manifest.json",
    }
    if set(git(root, "diff", "--name-only", "HEAD^", "HEAD").splitlines()) != bootstrap_paths:
        raise RuntimeError("The bootstrap contains changes outside the approved importer")
    protected = {}
    for name in ("docs/specs/Forest_Design_v1.2.pdf", "docs/specs/Forest_SRS_v2.5.pdf"):
        existing = root / name
        if existing.is_file():
            protected[name] = digest_file(existing)
    root_resolved = root.resolve()
    for entry in entries:
        destination = root / entry["path"]
        # Existing symlinks may not redirect a tracked snapshot path.
        if not destination.resolve().is_relative_to(root_resolved):
            raise RuntimeError("Existing path escapes the checkout")
        for component in [destination, *destination.parents]:
            if component == root:
                break
            if component.is_symlink():
                raise RuntimeError("Existing symlink in snapshot destination")
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(prepared / entry["path"], destination)
        os.chmod(destination, 0o755 if entry["mode"] == "100755" else 0o644)
    for name, checksum in protected.items():
        if digest_file(root / name) != checksum:
            raise RuntimeError("Existing reference document was changed")
    with tempfile.NamedTemporaryFile(mode="wb", delete=False) as paths:
        paths.write(b"\0".join(entry["path"].encode() for entry in entries) + b"\0")
        path_list = paths.name
    try:
        git(root, "--literal-pathspecs", "add", "--pathspec-from-file=" + path_list, "--pathspec-file-nul")
    finally:
        Path(path_list).unlink()
    index = subprocess.check_output(["git", "-C", str(root), "ls-files", "--stage", "-z"])
    indexed = {}
    for row in index.split(b"\0"):
        if row:
            metadata, path = row.split(b"\t", 1)
            mode, sha, stage = metadata.decode().split()
            if stage != "0":
                raise RuntimeError("Unmerged index entry")
            indexed[path.decode()] = (mode, sha)
    for entry in entries:
        if indexed.get(entry["path"]) != (entry["mode"], entry["sha"]):
            raise RuntimeError("Git index differs from verified snapshot: " + entry["path"])
    git(root, "fetch", "--no-tags", "origin", "main")
    if git(root, "rev-parse", "FETCH_HEAD") != expected_head:
        raise RuntimeError("main changed during import; no push performed")
    git(root, "config", "user.name", "github-actions[bot]")
    git(root, "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
    git(root, "commit", "-m", "Import Forest of Space 0.6.11 source, assets and SRS 2.21")
    commit = git(root, "rev-parse", "HEAD")
    # A normal fast-forward push rejects a concurrent main change.
    git(root, "push", "origin", "HEAD:refs/heads/main")
    return commit


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--apply-root", type=Path)
    parser.add_argument("--expected-head")
    args = parser.parse_args()
    if bool(args.apply_root) != bool(args.expected_head):
        parser.error("--apply-root and --expected-head must be supplied together")
    manifest = json.loads(args.manifest.read_text())
    with tempfile.TemporaryDirectory(prefix="forest-import-") as directory:
        temporary = Path(directory)
        entries = prepare(args.archive, manifest, temporary)
        result = {"archive_sha256": manifest["archive_sha256"], "verified_files": len(entries), "uncompressed_bytes": manifest["uncompressed_size"]}
        if args.apply_root:
            result["commit"] = import_snapshot(args.apply_root, temporary, entries, args.expected_head)
        print(json.dumps(result))
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
                summary.write("## Forest of Space 0.6.11 import\n\n")
                summary.write("Verified 750 source, asset, specification and QA files against the approved archive and Git blob manifest.\n\n")
                summary.write("Existing reference PDFs retained. No force push.\n\n")
                if "commit" in result:
                    summary.write("Imported commit: `" + result["commit"] + "`\n")


if __name__ == "__main__":
    main()
