from contextlib import contextmanager
from datetime import date, datetime
import json
from typing import Iterator

from sqlalchemy import text
from sqlalchemy.future import Connection
from sqlalchemy import create_engine as _create_engine


@contextmanager
def connection(
    user="aiida", database="aiidadb", password="password", host="localhost", port=5432
) -> Iterator[Connection]:
    engine = _create_engine(f"postgresql://{user}:{password}@{host}:{port}/{database}")
    with engine.connect() as conn:
        yield conn


def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return str(obj)


def serialize(obj) -> str:
    # TODO there is probably a sqlalchemy function for this
    return json.dumps(obj, default=_json_serial)


def query_settings(**kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(text("SELECT * from db_dbsetting"))
        output = result.all()
    return output


def query_node(pk: int, **kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(
            text("SELECT * from db_dbnode where db_dbnode.id=:pk"), pk=pk
        )
        row = result.one()
    return dict(zip(row.keys(), row))


def query_processes(max_records: int = 1, **kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(
            text(
                "SELECT n.id, n.label, n.description, n.mtime, n.node_type, n.process_type, "
                + "n.attributes -> 'process_state', n.attributes -> 'process_status', n.attributes -> 'process_label', "
                + "n.attributes -> 'exit_status', n.attributes -> 'scheduler_state', n.attributes -> 'paused', 'statusUnknown'"
                + "from db_dbnode as n where n.process_type is not null "
                + "ORDER BY n.mtime DESC LIMIT :limit",
            ),
            limit=max_records,
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


def query_incoming(pk: int, **kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(
            text(
                "SELECT 'incoming', l.label, l.type, n.id, n.label, n.description, n.node_type from db_dblink as l "
                "LEFT JOIN db_dbnode as n ON n.id = l.input_id "
                "WHERE l.output_id=:pk ORDER BY n.mtime DESC"
            ),
            pk=pk,
        )
        rows = result.all()
    names = [
        "linkDirection",
        "linkLabel",
        "linkType",
        "nodeId",
        "nodeLabel",
        "nodeDescription",
        "nodeType",
    ]
    return {"fields": names, "rows": [list(row) for row in rows]}


def query_outgoing(pk: int, **kwargs):
    with connection(**kwargs) as conn:
        result = conn.execute(
            text(
                "SELECT 'outgoing', l.label, l.type, n.id, n.label, n.description, n.node_type from db_dblink as l "
                "LEFT JOIN db_dbnode as n ON n.id = l.output_id "
                "WHERE l.input_id=:pk ORDER BY n.mtime DESC"
            ),
            pk=pk,
        )
        rows = result.all()
    names = [
        "linkDirection",
        "linkLabel",
        "linkType",
        "nodeId",
        "nodeLabel",
        "nodeDescription",
        "nodeType",
    ]
    return {"fields": names, "rows": [list(row) for row in rows]}
