import json
from datetime import date, datetime
from typing import Any, Dict, NamedTuple, Optional

import requests

# See: https://restfulapi.net/http-status-codes/
STATUS_OK = 200
STATUS_NO_CONTENT = 204
STATUS_BAD_REQUEST = 400


class Response(NamedTuple):
    """A REST response."""

    status_code: int
    reason: Optional[str] = None
    content: Optional[str] = None


def clean_reason(reason: Optional[str]) -> Optional[str]:
    r"""By RFC 2616, new lines in the header MUST be \r\n

    But even then, tornado does not allow any \n
    """
    if not reason:
        return reason
    return " ".join(reason.splitlines())


def post_to_server(url: str, data: Dict[str, Any]) -> Response:
    """Post to an external server."""
    try:
        response = requests.post(url, data=json.dumps(data))
    except Exception as exc:
        return Response(STATUS_BAD_REQUEST, reason=f"Post request failed: {exc}")
    return Response(response.status_code, response.reason, response.content)


def _json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    return str(obj)


def serialize(obj) -> str:
    # TODO there is probably a better way to do this
    return json.dumps(obj, default=_json_serial)
