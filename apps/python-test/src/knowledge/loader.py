from pathlib import Path
from typing import List

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def load_markdown_files() -> list[tuple[str, str]]:
    files = sorted(DATA_DIR.glob("*.md"))
    if not files:
        raise FileNotFoundError(f"No .md files found in {DATA_DIR}")
    return [(f.stem, f.read_text(encoding="utf-8")) for f in files]


def chunk_markdown(text: str, source: str, min_chunk_chars: int = 200) -> list[dict]:
    chunks: list[dict] = []
    lines = text.split("\n")
    current_section = "general"
    current_buffer: list[str] = []

    def flush():
        content = "\n".join(current_buffer).strip()
        if len(content) >= min_chunk_chars:
            chunks.append({"content": content, "source": source, "section": current_section})

    for line in lines:
        if line.startswith("## ") or line.startswith("# "):
            flush()
            current_buffer = [line]
            current_section = line.lstrip("#").strip()
        else:
            current_buffer.append(line)
    flush()
    return chunks


def load_and_chunk_all(min_chunk_chars: int = 200) -> list[dict]:
    all_chunks: list[dict] = []
    for stem, content in load_markdown_files():
        all_chunks.extend(chunk_markdown(content, stem, min_chunk_chars))
    return all_chunks
