from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api import user, stylist, config, auth, notification, features, admin
from app.models import Base, engine, get_db
from app.agent.init_tools import tool_registry
from app.config import CORS_ORIGINS


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # 老库新列补齐（create_all 不负责加列）
    try:
        from app.models.migrate import run_schema_upgrades
        run_schema_upgrades(engine)
    except Exception as e:
        print(f"[lifespan] schema upgrade skipped: {e}")
    from app.api.auth import ensure_seed_users
    db = next(get_db())
    try:
        ensure_seed_users(db)
        # 检测向量库维度一致性，若切换了 embedding 模型则自动重建
        try:
            from app.rag.vector_store import VectorStore
            from app.rag.embedder import rebuild_vectors, _default_client
            vs = VectorStore()
            # 预热模型以拿到真实输出维度（本地模型首次 embed 时才加载，dimension 才会更新）
            try:
                _default_client.embed("__warmup__")
            except Exception as e:
                print(f"[lifespan] warmup embed failed: {e}")
            if vs._vectors:
                first_vec = next(iter(vs._vectors.values()))
                if len(first_vec) != _default_client.dimension:
                    print(f"[lifespan] Vector dimension mismatch: store={len(first_vec)} model={_default_client.dimension}, rebuilding...")
                    rebuild_vectors(db, vs)
        except Exception as e:
            print(f"[lifespan] Vector rebuild check skipped: {e}")
    finally:
        db.close()
    from app.services.scheduled import init_scheduler
    init_scheduler()
    yield


app = FastAPI(title='AI Wardrobe Agent', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

from fastapi.staticfiles import StaticFiles
import os as _os
_upload_dir = _os.path.join(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))), 'uploads')
_os.makedirs(_upload_dir, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=_upload_dir), name='uploads')

app.include_router(user.router)
app.include_router(stylist.router)
app.include_router(config.router)
app.include_router(auth.router)
app.include_router(notification.router)
app.include_router(features.router)
app.include_router(admin.router)


@app.get('/')
def root():
    return {
        'message': 'AI Wardrobe Agent',
        'status': 'running',
        'tools': [t.name for t in tool_registry.all_tools()]
    }


@app.get('/api/chat')
def chat(user_input: str, user_id: int = 1):
    from app.agent.react_agent import ReActAgent
    agent = ReActAgent(tool_registry)
    result = agent.run(user_input, user_id=user_id)
    return {'response': result, 'steps': agent.logger.steps}


# ===== WebSocket for real-time notifications =====
active_connections: dict[int, WebSocket] = {}


@app.websocket('/ws/{user_id}')
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)


async def notify_user(user_id: int, message: dict):
    ws = active_connections.get(user_id)
    if ws:
        try:
            await ws.send_json(message)
        except Exception:
            active_connections.pop(user_id, None)
