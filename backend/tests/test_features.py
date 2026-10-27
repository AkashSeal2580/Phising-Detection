from app.ml.features import extract_url_features, FEATURE_NAMES

def test_features():
    result = extract_url_features("https://example.com/login")
    assert set(result) == set(FEATURE_NAMES)
    assert result["uses_https"] == 1
