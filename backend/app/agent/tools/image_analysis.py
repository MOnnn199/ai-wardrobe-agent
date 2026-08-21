from ..tool_registry import Tool

class ImageAnalysisTool(Tool):
    def __init__(self):
        super().__init__(name='analyze_image', description='分析衣物图片，识别类别、颜色、风格等信息')

    def get_definition(self) -> dict:
        return {
            'type': 'function',
            'function': {
                'name': self.name,
                'description': self.description,
                'parameters': {
                    'type': 'object',
                    'properties': {
                        'image_url': {'type': 'string', 'description': '图片URL'},
                        'prompt': {'type': 'string', 'description': '分析提示'}
                    },
                    'required': ['image_url']
                }
            }
        }

    def execute(self, arguments: dict) -> str:
        import base64
        from app.llm.tongyi_vl import TongyiVLClient
        client = TongyiVLClient()
        image = arguments.get('image_url', '')
        prompt = arguments.get('prompt', '请描述这张图片中的衣物类别、颜色、风格')
        # 通义 VL 需要 base64；若是 URL 先下载再转码，否则当作 base64 原样传
        b64 = image
        if image.startswith(('http://', 'https://')):
            try:
                import httpx
                resp = httpx.get(image, timeout=30)
                resp.raise_for_status()
                b64 = base64.b64encode(resp.content).decode('utf-8')
            except Exception as e:
                return f'（图片下载失败：{e}）'
        return client.analyze_image(b64, prompt)
