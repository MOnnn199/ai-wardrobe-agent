import pdfplumber
import markdown
import re

class DocumentParser:
    @staticmethod
    def parse_pdf(filepath: str) -> list[str]:
        chunks = []
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    chunks.extend(DocumentParser._split_text(text))
        return chunks

    @staticmethod
    def parse_markdown(filepath: str) -> list[str]:
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
        return DocumentParser._split_text(text)

    @staticmethod
    def _split_text(text: str, max_len: int = 300) -> list[str]:
        chunks = []
        while len(text) > max_len:
            split_at = text.rfind("。", 0, max_len)
            if split_at == -1:
                split_at = max_len
            chunks.append(text[:split_at+1].strip())
            text = text[split_at+1:]
        if text.strip():
            chunks.append(text.strip())
        return chunks
