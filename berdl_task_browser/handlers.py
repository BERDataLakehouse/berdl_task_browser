"""
HTTP handlers for the BERDL Task Browser server extension.

Provides a REST API endpoint that exposes the S3 path mappings from the
running GroupedS3ContentsManager, so the frontend can resolve S3 URLs to
JupyterLab file browser paths without duplicating mapping logic.
"""

import json
import logging
from typing import Any

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado.web

logger = logging.getLogger(__name__)


class BaseHandler(APIHandler):
    """Base handler with common utilities."""

    def write_json(self, data: dict[str, Any], status: int = 200) -> None:
        """Write JSON response."""
        self.set_status(status)
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps(data))

    def write_error_json(self, message: str, status: int = 500) -> None:
        """Write JSON error response."""
        self.set_status(status)
        self.set_header("Content-Type", "application/json")
        self.finish(json.dumps({"error": message}))


class S3PathMappingsHandler(BaseHandler):
    """Handler for S3 path mappings from GroupedS3ContentsManager."""

    @tornado.web.authenticated
    def get(self) -> None:
        """
        GET /api/task-browser/s3-path-mappings

        Returns the virtual directory -> bucket/prefix mapping from the
        running GroupedS3ContentsManager. This is the authoritative mapping
        computed at server startup.
        """
        try:
            mappings = self._get_mappings_from_contents_manager()
            self.write_json({"mappings": mappings})
        except Exception as e:
            logger.exception("Error reading S3 path mappings")
            self.write_error_json(str(e), status=500)

    def _get_mappings_from_contents_manager(self) -> dict[str, Any]:
        """Extract the S3 path mappings from the HybridContentsManager."""
        contents_manager = self.settings.get("contents_manager")
        if contents_manager is None:
            logger.warning("No contents_manager in server settings")
            return {}

        # HybridContentsManager stores sub-managers in _managers dict.
        # The lakehouse_minio entry is a GroupedS3ContentsManager whose
        # .managers traitlet holds the raw config dict.
        managers_dict = getattr(contents_manager, "_managers", None)
        if managers_dict is None:
            managers_dict = getattr(contents_manager, "managers", None)

        if not isinstance(managers_dict, dict):
            logger.warning(
                "Could not find _managers dict on contents_manager "
                f"(type={type(contents_manager).__name__})"
            )
            return self._fallback_governance_mappings()

        s3_cm = managers_dict.get("lakehouse_minio")
        if s3_cm is None:
            logger.warning("No lakehouse_minio entry in HybridContentsManager")
            return self._fallback_governance_mappings()

        raw = getattr(s3_cm, "managers", None)
        if not isinstance(raw, dict):
            logger.warning(
                "GroupedS3ContentsManager.managers is not a dict "
                f"(type={type(raw).__name__})"
            )
            return self._fallback_governance_mappings()

        return raw

    def _fallback_governance_mappings(self) -> dict[str, Any]:
        """
        Fall back to deriving mappings from the governance API.

        This uses the same code path as jupyter_server_config.py — same
        source of truth, just re-derived rather than read from the
        already-computed config.
        """
        try:
            from berdl_notebook_utils.minio_governance import (
                get_my_groups,
                get_my_workspace,
            )
            import os

            username = os.environ.get("NB_USER", "")
            bucket = os.environ.get("CDM_DEFAULT_BUCKET", "cdm-lake")

            mappings: dict[str, Any] = {
                "my-files": {
                    "bucket": bucket,
                    "prefix": f"users-general-warehouse/{username}",
                },
                "my-sql": {
                    "bucket": bucket,
                    "prefix": f"users-sql-warehouse/{username}",
                },
            }

            try:
                workspace = get_my_workspace()
                groups = getattr(workspace, "groups", []) or []
            except Exception:
                groups = []
                try:
                    groups_resp = get_my_groups()
                    groups = getattr(groups_resp, "groups", []) or []
                except Exception:
                    logger.warning("Could not fetch groups from governance API")

            for group in groups:
                if isinstance(group, str):
                    group_name = group
                    is_ro = group_name.endswith("ro")
                else:
                    group_name = getattr(group, "name", str(group))
                    is_ro = group_name.endswith("ro")

                base_name = group_name[:-2] if is_ro else group_name
                suffix = "-ro" if is_ro else ""

                mappings[f"{base_name}-files{suffix}"] = {
                    "bucket": bucket,
                    "prefix": f"tenant-general-warehouse/{base_name}",
                    **({"read_only": True} if is_ro else {}),
                }
                mappings[f"{base_name}-sql{suffix}"] = {
                    "bucket": bucket,
                    "prefix": f"tenant-sql-warehouse/{base_name}",
                    **({"read_only": True} if is_ro else {}),
                }

            return mappings

        except ImportError:
            logger.info(
                "berdl_notebook_utils not available; returning empty mappings"
            )
            return {}
        except Exception as e:
            logger.warning(f"Governance API fallback failed: {e}")
            return {}


def setup_handlers(web_app: Any) -> None:
    """Register handlers with the Jupyter server."""
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    handlers = [
        (
            url_path_join(base_url, "api", "task-browser", "s3-path-mappings"),
            S3PathMappingsHandler,
        ),
    ]

    web_app.add_handlers(host_pattern, handlers)
    logger.info("BERDL Task Browser handlers registered")
