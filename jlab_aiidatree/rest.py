import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from . import aiida_server
from .utils import clean_reason


class QueryBuilderEndpoint(APIHandler):
    @tornado.web.authenticated
    def post(self):
        input_data = self.get_json_body() or {}
        response = aiida_server.post_to_query_builder(input_data)
        self.set_status(
            response.status_code,
            clean_reason(response.reason),
        )
        self.finish(response.content)


def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, "jlab_aiidatree", endpoint), handler)
        for endpoint, handler in [
            ("querybuilder", QueryBuilderEndpoint),
        ]
    ]
    web_app.add_handlers(host_pattern, handlers)


# example get method
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
