"""SQLite 轻量列迁移。

`Base.metadata.create_all` 只会创建缺失的【表】，不会给已存在的表加【新列】。
本模块在启动时幂等执行 ALTER TABLE ADD COLUMN，保证老库平滑升级。
新增表由 create_all 自动创建，无需在此登记。
"""

from sqlalchemy import text

# (表名, 列名, 类型DDL, 追加子句如 DEFAULT '')
_COLUMNS = [
    ("clothing_items", "material", "TEXT", "DEFAULT ''"),
    ("clothing_items", "pattern", "TEXT", "DEFAULT ''"),
    ("clothing_items", "tags", "TEXT", "DEFAULT '[]'"),
    ("users", "is_active", "INTEGER", "DEFAULT 1"),
    ("users", "city", "TEXT", "DEFAULT ''"),
    ("users", "lat", "REAL", ""),
    ("users", "lon", "REAL", ""),
    ("users", "height", "INTEGER", ""),
    ("users", "weight", "INTEGER", ""),
    ("users", "skin_tone", "TEXT", "DEFAULT ''"),
    ("users", "body_type", "TEXT", "DEFAULT ''"),
    ("users", "style_preference", "TEXT", "DEFAULT ''"),
    ("users", "last_login_at", "DATETIME", ""),
    ("users", "last_login_city", "TEXT", "DEFAULT ''"),
    ("conversations", "user_image_url", "TEXT", ""),
]


def run_schema_upgrades(engine):
    """对 engine 连接的 SQLite 库执行缺失列补充；无变化时零开销。"""
    with engine.connect() as conn:
        for table, column, ddl, extra in _COLUMNS:
            try:
                row = conn.execute(
                    text("SELECT 1 FROM pragma_table_info(:t) WHERE name = :c"),
                    {"t": table, "c": column},
                ).fetchone()
            except Exception:
                row = None
            if row:
                continue
            stmt = f'ALTER TABLE "{table}" ADD COLUMN "{column}" {ddl} {extra}'.strip()
            conn.execute(text(stmt))
            print(f"[migrate] added column {table}.{column}")
        conn.commit()
