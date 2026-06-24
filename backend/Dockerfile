FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/opt/hf-cache \
    MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english \
    SENTIMENT_MODEL=distilbert-base-uncased-finetuned-sst-2-english

WORKDIR /app

COPY requirements.txt .

RUN python -m pip install --upgrade pip \
    && python -m pip install --index-url https://download.pytorch.org/whl/cpu "torch>=2.6,<3.0" \
    && python -m pip install -r requirements.txt

RUN python - <<'PY'
import os
from pathlib import Path
from transformers import AutoModelForSequenceClassification, AutoTokenizer

model_name = os.environ["MODEL_NAME"]
hf_home = Path(os.environ["HF_HOME"])
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

saved_path = hf_home / "preloaded" / model_name.replace("/", "--")
tokenizer.save_pretrained(saved_path)
model.save_pretrained(saved_path)

expected_files = [saved_path / "config.json", saved_path / "tokenizer_config.json"]
missing = [str(path) for path in expected_files if not path.exists()]
if missing:
    raise RuntimeError(f"Model cache verification failed; missing: {missing}")

weight_files = [
    saved_path / "model.safetensors",
    saved_path / "pytorch_model.bin",
    saved_path / "tf_model.h5",
    saved_path / "flax_model.msgpack",
]
if not any(path.exists() for path in weight_files):
    raise RuntimeError("Model cache verification failed; no model weight file found")

print(f"Saved tokenizer and model files under {saved_path}")
PY

ENV TRANSFORMERS_OFFLINE=1

COPY app ./app

RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app "$HF_HOME"

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
