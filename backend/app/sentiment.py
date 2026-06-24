import os
from functools import lru_cache
from typing import Any

from transformers import pipeline


MODEL_NAME = os.getenv(
    "SENTIMENT_MODEL",
    "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
)


@lru_cache(maxsize=1)
def _get_pipeline() -> Any:
    """Load and retain one sentiment pipeline for the process lifetime."""
    return pipeline("sentiment-analysis", model=MODEL_NAME)


def analyze_sentiment(text: str) -> tuple[str, float]:
    """Return the lowercase sentiment label and confidence score."""
    result = _get_pipeline()(text, truncation=True)[0]
    return str(result["label"]).lower(), float(result["score"])
