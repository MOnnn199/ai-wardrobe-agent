from typing import Any, Optional

class Tool:
    def __init__(self, name: str, description: str, enabled: bool = True):
        self.name = name
        self.description = description
        self.enabled = enabled

    def get_definition(self) -> dict:
        raise NotImplementedError

    def execute(self, arguments: dict) -> str:
        raise NotImplementedError

class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def get_enabled_definitions(self) -> list[dict]:
        return [t.get_definition() for t in self._tools.values() if t.enabled]

    def all_tools(self) -> list[Tool]:
        return list(self._tools.values())
