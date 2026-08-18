import pytest
from app.scraper.service import _clean_html

def test_clean_html_removes_tags():
    html = "<div><p>Hello <b>World</b></p><br/></div>"
    clean = _clean_html(html)
    assert "Hello" in clean
    assert "World" in clean
    assert "<div>" not in clean
    assert "<b>" not in clean

def test_clean_html_empty_input():
    assert _clean_html("") == ""
    assert _clean_html(None) == ""

def test_clean_html_multiline():
    html = "<p>Line 1</p><p>Line 2</p>"
    clean = _clean_html(html)
    assert "Line 1" in clean
    assert "Line 2" in clean
    assert "\n" in clean
