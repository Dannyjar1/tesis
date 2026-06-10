"""
entrenar.py — Fine-tuning de BETO para clasificación de actividades (RNF-009).

Entrena dccuchile/bert-base-spanish-wwm-cased sobre dataset_beto.csv
(generado con generar_dataset.py y completado con eventos reales) y guarda
el modelo en ./modelo-beto-distributivo, listo para subir a Cloud Storage.

Requisitos (local o Google Colab — NO van en la Cloud Function):
    pip install torch transformers scikit-learn pandas

Uso:
    python entrenar.py [dataset_beto.csv]

Al terminar imprime el classification_report (precision/recall/F1 por
categoría) — la métrica objetivo de RNF-009 es F1 >= 0.80 por categoría.
Documentar la salida en el Capítulo III de la tesis.

Despliegue del modelo entrenado:
    1. gsutil cp -r modelo-beto-distributivo gs://uide-distributivo-loja.appspot.com/modelos/
    2. En functions: CLASIFICADOR_MODO=beto y RUTA_MODELO_BETO=<ruta>
    3. Descomentar torch/transformers en functions/requirements.txt
    4. firebase deploy --only functions (memoria 2GiB en main.py)
"""
import sys

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from categorias import CATEGORIAS

MODELO_BASE = "dccuchile/bert-base-spanish-wwm-cased"
SALIDA = "./modelo-beto-distributivo"
CAT_A_IDX = {c: i for i, c in enumerate(CATEGORIAS)}


def cargar_dataset(ruta):
    df = pd.read_csv(ruta, encoding="utf-8-sig")
    df = df.dropna(subset=["texto"])
    df = df[df["texto"].str.strip() != ""]
    df = df[df["categoria"].isin(CATEGORIAS)]
    print(f"Dataset: {len(df)} ejemplos")
    print(df["categoria"].value_counts().to_string())
    if df["categoria"].value_counts().min() < 20:
        print("ADVERTENCIA: hay categorías con <20 ejemplos; el F1 >= 0.80 "
              "(RNF-009) difícilmente se alcanzará. Completar el dataset.")
    return df


def main(ruta_csv="dataset_beto.csv"):
    import torch
    from torch.utils.data import Dataset
    from transformers import (
        AutoTokenizer, AutoModelForSequenceClassification,
        Trainer, TrainingArguments,
    )

    df = cargar_dataset(ruta_csv)
    train_df, test_df = train_test_split(
        df, test_size=0.2, stratify=df["categoria"], random_state=42
    )

    tokenizer = AutoTokenizer.from_pretrained(MODELO_BASE)
    modelo = AutoModelForSequenceClassification.from_pretrained(
        MODELO_BASE, num_labels=len(CATEGORIAS)
    )

    class DS(Dataset):
        def __init__(self, frame):
            enc = tokenizer(
                list(frame["texto"]), truncation=True, padding=True, max_length=128
            )
            self.enc = enc
            self.labels = [CAT_A_IDX[c] for c in frame["categoria"]]

        def __len__(self):
            return len(self.labels)

        def __getitem__(self, i):
            item = {k: torch.tensor(v[i]) for k, v in self.enc.items()}
            item["labels"] = torch.tensor(self.labels[i])
            return item

    args = TrainingArguments(
        output_dir="./checkpoints",
        num_train_epochs=4,
        per_device_train_batch_size=8,
        learning_rate=2e-5,
        weight_decay=0.01,
        logging_steps=20,
        save_strategy="no",
        report_to="none",
    )
    Trainer(model=modelo, args=args, train_dataset=DS(train_df)).train()

    # ── Evaluación (RNF-009: F1 >= 0.80 por categoría) ───────────────────────
    modelo.eval()
    enc = tokenizer(
        list(test_df["texto"]), truncation=True, padding=True,
        max_length=128, return_tensors="pt",
    )
    with torch.no_grad():
        preds = modelo(**enc).logits.argmax(dim=-1).tolist()
    y_true = [CAT_A_IDX[c] for c in test_df["categoria"]]
    print(classification_report(y_true, preds, target_names=CATEGORIAS, digits=3))

    modelo.save_pretrained(SALIDA)
    tokenizer.save_pretrained(SALIDA)
    print(f"Modelo guardado en {SALIDA} — listo para subir a Cloud Storage.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "dataset_beto.csv")
