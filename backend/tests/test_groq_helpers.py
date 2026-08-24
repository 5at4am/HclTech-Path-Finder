from __future__ import annotations

from app.services.groq_service import prose_or_json


def test_unwraps_single_string_json_wrapper():
    raw = '{"explanation": "This step is next because it closes your Python gap before ML."}'
    assert prose_or_json(raw) == "This step is next because it closes your Python gap before ML."


def test_plain_prose_passes_through():
    txt = "Statistics comes before Machine Learning because models need probability foundations."
    assert prose_or_json(txt) == txt


def test_structured_multi_field_json_is_untouched():
    raw = '{"goal": "AI/ML Engineer", "timeline_months": 8}'
    assert prose_or_json(raw) == raw


def test_none_and_empty_are_safe():
    assert prose_or_json(None) is None
    assert prose_or_json("") == ""
