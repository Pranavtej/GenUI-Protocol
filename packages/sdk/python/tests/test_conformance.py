"""Runs the shared language-neutral fixtures in /conformance against the Python implementation."""

import copy
import json
from pathlib import Path

import pytest

from genui_protocol_sdk import MISSING, PatchError, apply_patches, make_lookup, resolve_value, validate_document

ROOT = Path(__file__).resolve().parents[3].parent / "conformance"


def load(name):
    return json.loads((ROOT / f"{name}.json").read_text("utf-8"))["cases"]


@pytest.mark.parametrize("case", load("patch"), ids=lambda c: c["name"])
def test_patch(case):
    before = copy.deepcopy(case["input"])
    if case.get("error"):
        with pytest.raises(PatchError):
            apply_patches(case["input"], case["patches"])
        assert case["input"] == before
    else:
        assert apply_patches(case["input"], case["patches"]) == case["expected"]


@pytest.mark.parametrize("case", load("validation"), ids=lambda c: c["name"])
def test_validation(case):
    result = validate_document(case["document"])
    assert result.valid is case["valid"], result.errors
    if case.get("errorContains"):
        assert any(case["errorContains"] in e for e in result.errors)


@pytest.mark.parametrize("case", load("bindings"), ids=lambda c: c["name"])
def test_bindings(case):
    out = resolve_value(case["value"], make_lookup(case["data"]))
    assert (None if out is MISSING else out) == case["expected"]
