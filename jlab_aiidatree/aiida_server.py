"""This server queries AiiDA for the required data.

AiiDA can be queried in one of two ways:

1. Using a REST client to forward the call on to an AiiDA REST server
2. Directly using the aiida-core API

We decide this by trying to extract a 'url' key from the post data
and, if not ``None``, we do (1), otherwise (2).

"""
from typing import Any, Dict, List

from .utils import STATUS_BAD_REQUEST, STATUS_OK, Response, post_to_server, serialize


def clean_qb_dict(data: Dict[str, Any]) -> List[str]:
    """In-place cleaning of dict

    We should only be returning JSONable data,
    and so replace any '*' which returns the ORM object

    adapted from: ``aiida.restapi.resources.QueryBuilder.post``

    :returns: list of tags that have projections
    """
    try:
        all_projections = data["project"]
        label = data["path"][-1]["tag"]
    except (KeyError, IndexError) as exc:
        raise ValueError(str(exc))

    # Handle empty list projections
    projected_tags = []
    for tag, projections in tuple(all_projections.items()):
        if projections == [{"*": {}}]:
            projections[tag] = ["**"]
        if projections:
            projected_tags.append(tag)

    if not projected_tags:
        # No projections have been specified in the queryhelp.
        # To be true to the QueryBuilder response, the last entry in path
        # is the only entry to be returned, all without edges/links.
        all_projections[label] = ["**"]
        projected_tags.append(label)

    return projected_tags


def post_to_query_builder(data: Dict[str, Any]) -> Response:
    """This should essentially mimic ``aiida.restapi.resources.QueryBuilder.post``

    Thus far, I haven't found a good way to directly use that.

    An example of input data::

        {"path": [{'entity_type': 'data.dict.Dict.', 'tag': 'data'}], "project": {"data": "**"}}

    An the resonse.data::

        '[{"dict": {
            "id": 1, "uuid": "934afd6c-8988-4a30-b10d-eb838ad0f5e5", "node_type": "data.dict.Dict.",
            "process_type": null, "label": "", "description": "",
            "ctime": "2021-05-13T12:49:19.779994+00:00",
            "mtime": "2021-05-13T12:49:19.807974+00:00",
            "user_id": 1, "dbcomputer_id": null, "attributes": {},
            "extras": {"_aiida_hash": "4e48409d38d2662ef9d3ce089fef1290f0ca3da4bd62bd9dbbf3ccf0d871085b"}}
        }]'

    """
    # check if we actually have any data?
    # if not data:
    #     return Response(STATUS_NO_CONTENT)

    url = data.pop("url", None)
    if url is not None:
        return post_to_server(url.rstrip("/") + "/querybuilder/", data)

    # format the query dict
    try:
        projected_tags = clean_qb_dict(data)
    except Exception as exc:
        return Response(STATUS_BAD_REQUEST, reason=f"Invalid query dict: {exc}")

    # import aiida
    try:
        from aiida.manage.configuration import load_profile
        from aiida.orm import QueryBuilder
    except ImportError:
        return Response(STATUS_BAD_REQUEST, reason="aiida not installed")

    # load aiida profile
    try:
        load_profile()
    except Exception as exc:
        return Response(STATUS_BAD_REQUEST, reason=str(exc))

    # initialise query builder
    try:
        qb = QueryBuilder(**data)
    except Exception as exc:  # InputValidationError
        return Response(
            STATUS_BAD_REQUEST, reason=f"QueryBuilder initialisation: {exc}"
        )

    # run query
    try:
        rows = qb.dict()
    except Exception as exc:  # InputValidationError
        return Response(
            STATUS_BAD_REQUEST, reason=f"QueryBuilder initialisation: {exc}"
        )

    # format result equal to AiiDA REST API
    data = {tag: [row[tag] for row in rows] for tag in projected_tags}

    # serialize data
    try:
        content = serialize({"data": data})
    except Exception as exc:
        return Response(
            STATUS_BAD_REQUEST, reason=f"QueryBuilder dict not serialisable: {exc}"
        )

    # return query
    return Response(STATUS_OK, reason="OK", content=content)
