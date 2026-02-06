"""S3 path mapping endpoint for the BERDL Task Browser server extension."""

import json
import logging
import os
from typing import Any

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado.web

logger = logging.getLogger(__name__)


class S3PathMappingsHandler(APIHandler):
    """Exposes S3 path mappings from GroupedS3ContentsManager."""

    @tornado.web.authenticated
    def get(self) -> None:
        try:
            self.finish(json.dumps({"mappings": self._get_mappings()}))
        except Exception as e:
            logger.exception("Error reading S3 path mappings")
            self.set_status(500)
            self.finish(json.dumps({"error": str(e)}))

    def _get_mappings(self) -> dict[str, Any]:
        cm = self.settings.get("contents_manager")
        if cm is None:
            return self._fallback_mappings()

        # HybridContentsManager stores sub-managers in _managers dict.
        managers = getattr(cm, "_managers", None)
        if managers is None:
            managers = getattr(cm, "managers", None)
        if not isinstance(managers, dict):
            return self._fallback_mappings()

        s3_cm = managers.get("lakehouse_minio")
        if s3_cm is None:
            return self._fallback_mappings()

        raw = getattr(s3_cm, "managers", None)
        return raw if isinstance(raw, dict) else self._fallback_mappings()

    def _fallback_mappings(self) -> dict[str, Any]:
        """Derive mappings from governance API when ContentsManager unavailable."""
        try:
            from berdl_notebook_utils.minio_governance import (
                get_my_groups,
                get_my_workspace,
            )
        except ImportError:
            return {}

        username = os.environ.get("NB_USER", "")
        bucket = os.environ.get("CDM_DEFAULT_BUCKET", "cdm-lake")

        mappings: dict[str, Any] = {
            "my-files": {"bucket": bucket, "prefix": f"users-general-warehouse/{username}"},
            "my-sql": {"bucket": bucket, "prefix": f"users-sql-warehouse/{username}"},
        }

        try:
            groups = getattr(get_my_workspace(), "groups", []) or []
        except Exception:
            try:
                groups = getattr(get_my_groups(), "groups", []) or []
            except Exception:
                groups = []

        for group in groups:
            name = group if isinstance(group, str) else getattr(group, "name", str(group))
            is_ro = name.endswith("ro")
            base = name[:-2] if is_ro else name
            suffix = "-ro" if is_ro else ""
            ro_flag = {"read_only": True} if is_ro else {}
            mappings[f"{base}-files{suffix}"] = {
                "bucket": bucket, "prefix": f"tenant-general-warehouse/{base}", **ro_flag,
            }
            mappings[f"{base}-sql{suffix}"] = {
                "bucket": bucket, "prefix": f"tenant-sql-warehouse/{base}", **ro_flag,
            }

        return mappings


class MockServiceWorkerHandler(tornado.web.RequestHandler):
    """Serve MSW's mockServiceWorker.js at the site root for mock mode."""

    def get(self) -> None:
        try:
            import importlib.resources
            msw_path = importlib.resources.files("msw").joinpath("lib", "mockServiceWorker.js")
            self.set_header("Content-Type", "application/javascript")
            self.finish(msw_path.read_text())
        except Exception:
            # Fallback: find it relative to node_modules
            import pathlib
            candidates = list(pathlib.Path(__file__).parent.parent.glob(
                "node_modules/msw/lib/mockServiceWorker.js"
            ))
            if candidates:
                self.set_header("Content-Type", "application/javascript")
                self.finish(candidates[0].read_text())
            else:
                self.set_status(404)
                self.finish("mockServiceWorker.js not found")


def setup_handlers(web_app: Any) -> None:
    """Register handlers with the Jupyter server."""
    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, "api", "task-browser", "s3-path-mappings"), S3PathMappingsHandler),
    ]

    # Serve MSW service worker in mock mode
    if os.environ.get("CTS_MOCK_MODE", "").lower() in ("true", "1", "yes"):
        handlers.append(("/mockServiceWorker.js", MockServiceWorkerHandler))

    web_app.add_handlers(".*$", handlers)
