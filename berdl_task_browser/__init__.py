import os

try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'berdl_task_browser' outside a proper installation.")
    __version__ = "dev"

# Export viewer functions for notebook use
from .viewer import JobWidget, show_job

__all__ = [
    '__version__',
    'JobWidget',
    'show_job',
]


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "berdl-task-browser"
    }]


def _jupyter_server_extension_points():
    return [{"module": "berdl_task_browser"}]


def _load_jupyter_server_extension(server_app):
    """Expose config via PageConfig for dev.

    TODO: This should probably move to CoreUI eventually.
    """
    page_config = server_app.web_app.settings.setdefault("page_config_data", {})

    if token := os.environ.get("KBASE_AUTH_TOKEN"):
        page_config["kbaseAuthToken"] = token

    if cts_url := os.environ.get("CDM_TASK_SERVICE_URL"):
        page_config["ctsApiBase"] = cts_url.rstrip('/')

    if os.environ.get("CTS_MOCK_MODE", "").lower() in ("true", "1", "yes"):
        page_config["ctsMockMode"] = "true"
        page_config.setdefault("hubUser", "testuser")

    if hub_user := os.environ.get("NB_USER"):
        page_config["hubUser"] = hub_user

    if bucket := os.environ.get("CDM_DEFAULT_BUCKET"):
        page_config["cdmDefaultBucket"] = bucket

    server_app.log.info("Registered berdl_task_browser server extension")
