from contextlib import contextmanager
from datetime import date, datetime
import json
from typing import Iterator

from sqlalchemy import text
from sqlalchemy.future import Connection
from sqlalchemy import create_engine as _create_engine


@contextmanager
def connection(
    user="aiida", database="aiida_db", password="password", host="localhost", port=5434
) -> Iterator[Connection]:
    engine = _create_engine(f"postgresql://{user}:{password}@{host}:{port}/{database}")
    with engine.connect() as conn:
        yield conn


def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError ("Type %s not serializable" % type(obj))


def serialize(obj) -> str:
    return json.dumps(obj, default=_json_serial)


def query_settings(**kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(text("SELECT * from db_dbsetting"))
        output = result.all()
    return output


def query_processes(max_records: int = 1, **kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(
            text(
                "SELECT n.id, n.label, n.description, n.mtime, n.node_type, n.process_type, "
                + "n.attributes -> 'process_state', n.attributes -> 'process_status', n.attributes -> 'process_label', "
                + "n.attributes -> 'exit_status', n.attributes -> 'scheduler_state', n.attributes -> 'paused', 'statusUnknown'"
                + "from db_dbnode as n where n.process_type is not null "
                + "ORDER BY n.mtime DESC LIMIT :limit",
            ), limit=max_records
        )
        rows = result.all()
    names = [
        "id",
        "label",
        "description",
        "mtime",
        "nodeType",
        "processType",
        "processState",
        "processStatus",
        "processLabel",
        "exitStatus",
        "schedulerState",
        "paused",
    ]
    return {"fields": names, "rows": [list(row) for row in rows]}
