import json
from ..tool_registry import Tool
from app.rag.embedder import Embedder
from app.rag.vector_store import VectorStore

class KnowledgeRetrievalTool(Tool):
    def __init__(self):
        super().__init__(name="retrieve_knowledge", description="检索穿搭知识库中的搭配规则、场合礼仪、风格指南等文本资料")
        self.embedder = Embedder()
        self.vector_store = VectorStore()

    def get_definition(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "搜索关键词或问题描述，例如：婚礼穿搭、职场正装、夏季清凉搭配"}
                    },
                    "required": ["query"]
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        query = arguments.get("query", "")
        if not query:
            return json.dumps({"rules": []}, ensure_ascii=False)

        vec = self.embedder.embed(query)
        if vec is None:
            return json.dumps({"error": "embedding 服务暂不可用，无法检索知识库"}, ensure_ascii=False)

        results = self.vector_store.search(vec, top_k=4)
        texts = []
        for r in results:
            text = r.get("text", "").strip()
            if text:
                texts.append(text)

        if not texts:
            return json.dumps({"rules": []}, ensure_ascii=False)

        return json.dumps({"rules": texts}, ensure_ascii=False)
