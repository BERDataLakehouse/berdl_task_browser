"""
CTS Job Viewer - IPython widget for viewing CTS job status.

Uses the JupyterLab extension's React components via window.kbase.task_browser.renderJobWidget().
Automatically uses mock data when window.kbase.task_browser.mockMode = true.
"""

import uuid

import ipywidgets as widgets
from IPython.display import display, Javascript


class JobWidget(widgets.HTML):
    """
    Job status widget that renders using the CTS extension's React components.

    Parameters
    ----------
    job_id : str
        The CTS job ID to display
    """

    def __init__(self, job_id: str):
        self.job_id = job_id
        self._widget_id = f'cts-job-widget-{uuid.uuid4().hex[:8]}'

        html = f'''
        <div id="{self._widget_id}" style="min-width: 200px;">
            <span style="font-size: 11px; color: #666;">Loading...</span>
        </div>
        '''

        super().__init__(value=html, layout=widgets.Layout(margin='4px 0'))

    def _get_render_js(self) -> str:
        """Get JavaScript code to render the React component."""
        return f'''
        (function() {{
            function tryRender(attempts) {{
                var container = document.getElementById('{self._widget_id}');
                if (!container) {{
                    if (attempts < 20) {{
                        setTimeout(function() {{ tryRender(attempts + 1); }}, 100);
                    }} else {{
                        console.error('[CTS Widget] Container not found: {self._widget_id}');
                    }}
                    return;
                }}

                var cts = window.kbase && window.kbase.task_browser;
                if (!cts || !cts.renderJobWidget) {{
                    container.innerHTML = '<span style="color: #c62828; font-size: 11px;">CTS extension not loaded</span>';
                    return;
                }}

                var cleanup = cts.renderJobWidget(container, '{self.job_id}');
                container._ctsCleanup = cleanup;
            }}
            tryRender(0);
        }})();
        '''


def show_job(job_id: str) -> None:
    """
    Display a job status widget with auto-refresh.

    Uses the CTS extension's React components. Enable mock mode via browser console:
    window.kbase.task_browser.mockMode = true

    Parameters
    ----------
    job_id : str
        The CTS job ID to display
    """
    widget = JobWidget(job_id)
    display(widget)
    display(Javascript(widget._get_render_js()))
