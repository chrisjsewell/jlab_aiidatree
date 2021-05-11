import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

from . import postgres


class NodeEndpoint(APIHandler):
    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        try:
            data = postgres.query_node(pk=input_data.get("pk", 1))
            json_data = postgres.serialize(data)
        except Exception as error:
            json_data = postgres.serialize({"error": str(error)})
        self.finish(json_data)

class ProcessesEndpoint(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    # @tornado.web.authenticated
    # def get(self):
    #     try:
    #         settings = postgres.query_processes()
    #     except Exception as err:
    #         settings = f"Error: {err}"
    #     self.finish(
    #         json.dumps(
    #             {"data": f"This is /jlab_aiidatree/get_example endpoint!: {settings}"}
    #         )
    #     )

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        try:
            data = postgres.query_processes(max_records=input_data.get("max_records", 1))
            json_data = postgres.serialize(data)
        except Exception as error:
            json_data = postgres.serialize({"error": str(error)})
        self.finish(json_data)


class LinksEndpoint(APIHandler):
    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        pk = input_data.get("pk", 1)
        direction = input_data.get("direction", "incoming")
        try:
            if direction == "incoming":
                data = postgres.query_incoming(pk=pk)
            else:
                data = postgres.query_outgoing(pk=pk)
            json_data = postgres.serialize(data)
        except Exception as error:
            json_data = postgres.serialize({"error": str(error)})
        self.finish(json_data)


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, "jlab_aiidatree", endpoint), handler)
        for endpoint, handler in [("processes", ProcessesEndpoint), ("node", NodeEndpoint), ("links", LinksEndpoint)]
    ]
    web_app.add_handlers(host_pattern, handlers)
