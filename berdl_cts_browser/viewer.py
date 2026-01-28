"""
CTS Job Viewer - IPython widget for viewing CTS job status.
"""

import threading
import time
from typing import Optional

import ipywidgets as widgets
import requests
from IPython.display import display

# Default CTS API endpoint
DEFAULT_CTS_API_BASE = 'https://ci.kbase.us/services/cts'

# Polling interval in seconds
POLLING_INTERVAL = 5

# State labels matching the panel widget
STATE_LABELS = {
    'created': 'Created',
    'download_submitted': 'Downloading',
    'job_submitting': 'Submitting',
    'job_submitted': 'Running',
    'upload_submitting': 'Uploading',
    'upload_submitted': 'Uploading',
    'complete': 'Complete',
    'error_processing_submitting': 'Error Processing',
    'error_processing_submitted': 'Error Processing',
    'error': 'Error',
    'canceling': 'Canceling',
    'canceled': 'Canceled',
}

# State colors matching MUI chip colors
STATE_COLORS = {
    'complete': {'bg': '#e8f5e9', 'text': '#2e7d32'},  # success/green
    'error': {'bg': '#ffebee', 'text': '#c62828'},  # error/red
    'error_processing_submitting': {'bg': '#ffebee', 'text': '#c62828'},
    'error_processing_submitted': {'bg': '#ffebee', 'text': '#c62828'},
    'canceled': {'bg': '#fff3e0', 'text': '#e65100'},  # warning/orange
    'canceling': {'bg': '#fff3e0', 'text': '#e65100'},
    'created': {'bg': '#f5f5f5', 'text': '#616161'},  # default/grey
    # Running states - info/blue
    'download_submitted': {'bg': '#e3f2fd', 'text': '#1565c0'},
    'job_submitting': {'bg': '#e3f2fd', 'text': '#1565c0'},
    'job_submitted': {'bg': '#e3f2fd', 'text': '#1565c0'},
    'upload_submitting': {'bg': '#e3f2fd', 'text': '#1565c0'},
    'upload_submitted': {'bg': '#e3f2fd', 'text': '#1565c0'},
}

DEFAULT_COLOR = {'bg': '#f5f5f5', 'text': '#616161'}


def _is_mock_token(token: str) -> bool:
    """Check if token is a mock token."""
    return token.lower() in ('mock', 'demo')


def _is_terminal_state(state: str) -> bool:
    """Check if job state is terminal (no more updates expected)."""
    return state in ('complete', 'error', 'canceled')


def _get_state_label(state: str) -> str:
    """Get display label for state."""
    return STATE_LABELS.get(state, state)


def _get_state_colors(state: str) -> dict:
    """Get background and text colors for state."""
    return STATE_COLORS.get(state, DEFAULT_COLOR)


class JobWidget(widgets.VBox):
    """
    Compact auto-refreshing job status widget.

    Parameters
    ----------
    job_id : str
        The CTS job ID to display
    token : str
        CTS API authorization token
    api_base : str, optional
        Override the default CTS API base URL
    """

    def __init__(
        self,
        job_id: str,
        token: str,
        api_base: Optional[str] = None
    ):
        self.job_id = job_id
        self.token = token
        self.api_base = api_base or DEFAULT_CTS_API_BASE
        self._stop_polling = threading.Event()
        self._polling_thread: Optional[threading.Thread] = None

        # UI components
        self._status_html = widgets.HTML(value='<span style="color:#666;">Loading...</span>')
        self._details_button = widgets.Button(description='View info')
        self._details_button.on_click(self._open_in_sidebar)
        self._error_html = widgets.HTML(value='')
        self._error_html.layout.display = 'none'
        # Hidden output widget for executing JavaScript
        self._js_output = widgets.Output(layout=widgets.Layout(display='none'))

        header = widgets.HBox(
            [self._status_html, self._details_button],
            layout=widgets.Layout(
                justify_content='space-between',
                align_items='center',
                width='100%'
            )
        )

        super().__init__(
            children=[header, self._error_html, self._js_output],
            layout=widgets.Layout(
                padding='4px 8px',
                border='1px solid #e0e0e0',
                border_radius='4px',
                margin='4px 0'
            )
        )

        self._fetch_and_update()
        # Don't poll for mock tokens
        if not _is_mock_token(self.token):
            self._start_polling()

    def _fetch_and_update(self):
        """Fetch job status and update display."""
        # Mock mode
        if _is_mock_token(self.token):
            self._update_display({'id': self.job_id, 'state': 'job_submitted'})
            return

        try:
            auth = self.token if self.token.startswith('Bearer ') else f'Bearer {self.token}'
            response = requests.get(
                f'{self.api_base}/jobs/{self.job_id}/status',
                headers={'Authorization': auth},
                timeout=10
            )
            response.raise_for_status()
            status = response.json()
            self._update_display(status)
        except requests.RequestException as e:
            self._show_error(f'Failed to fetch status: {e}')

    def _update_display(self, status: dict):
        """Update the status display."""
        state = status.get('state', 'unknown')
        label = _get_state_label(state)
        colors = _get_state_colors(state)

        chip_style = (
            f'display:inline-block;'
            f'background:{colors["bg"]};'
            f'color:{colors["text"]};'
            f'padding:2px 8px;'
            f'border-radius:10px;'
            f'font-size:12px;'
            f'font-weight:500;'
        )

        self._status_html.value = (
            f'<span style="{chip_style}">{label}</span>'
            f'<code style="font-size:12px;color:#444;margin-left:8px;">{self.job_id}</code>'
        )
        self._error_html.layout.display = 'none'

        if _is_terminal_state(state):
            self._stop_polling.set()

    def _show_error(self, message: str):
        """Display an error message."""
        self._error_html.value = (
            f'<div style="color: #c62828; font-size: 11px; margin-top: 4px;">'
            f'{message}</div>'
        )
        self._error_html.layout.display = 'block'

    def _start_polling(self):
        """Start background polling thread."""
        def poll():
            while not self._stop_polling.is_set():
                time.sleep(POLLING_INTERVAL)
                if self._stop_polling.is_set():
                    break
                self._fetch_and_update()

        self._polling_thread = threading.Thread(target=poll, daemon=True)
        self._polling_thread.start()

    def _open_in_sidebar(self, _btn):
        """Open job details in the CTS Browser sidebar."""
        try:
            from IPython.display import display as ipy_display, Javascript
            js_code = f'''
            (function() {{
                var app = window.jupyterapp || window.jupyterlab;
                if (app && app.commands) {{
                    app.commands.execute('cts-browser:select-job', {{jobId: '{self.job_id}'}});
                }} else {{
                    console.error('JupyterLab app not found');
                }}
            }})();
            '''
            with self._js_output:
                self._js_output.clear_output()
                ipy_display(Javascript(js_code))
        except Exception as e:
            self._show_error(f'Could not open sidebar: {e}')

    def stop(self):
        """Stop the polling thread."""
        self._stop_polling.set()

    def __del__(self):
        self.stop()


def show_job(job_id: str, token: str, api_base: Optional[str] = None) -> None:
    """
    Display a compact job preview widget with auto-refresh.

    Parameters
    ----------
    job_id : str
        The CTS job ID to display
    token : str
        CTS API authorization token
    api_base : str, optional
        Override the default CTS API base URL
    """
    widget = JobWidget(job_id, token, api_base)
    display(widget)
    return None  # Suppress double display from return value
