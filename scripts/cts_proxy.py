#!/usr/bin/env python3
"""
Standalone CTS API proxy for local development.

Proxies requests from localhost:8080 to ci.kbase.us/services/cts
with CORS headers to allow browser requests.

Usage:
    pip install flask flask-cors requests
    python scripts/cts_proxy.py

Then set in browser console:
    window.__CTS_API_BASE__ = 'http://localhost:8080'
"""

import os
import requests
from flask import Flask, request, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

CTS_API_BASE = os.environ.get("CTS_API_BASE", "https://ci.kbase.us/services/cts")
PROXY_PORT = int(os.environ.get("PROXY_PORT", "8080"))


@app.route("/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def proxy(path):
    """Proxy all requests to CTS API."""
    url = f"{CTS_API_BASE}/{path}"
    if request.query_string:
        url = f"{url}?{request.query_string.decode()}"

    # Forward relevant headers
    headers = {}
    if auth := request.headers.get("Authorization"):
        headers["Authorization"] = auth
    if content_type := request.headers.get("Content-Type"):
        headers["Content-Type"] = content_type

    # Make the proxied request
    try:
        resp = requests.request(
            method=request.method,
            url=url,
            headers=headers,
            data=request.get_data(),
            timeout=30,
        )

        # Build response with CORS headers
        response = Response(
            resp.content,
            status=resp.status_code,
        )
        if ct := resp.headers.get("Content-Type"):
            response.headers["Content-Type"] = ct
        return response

    except requests.RequestException as e:
        return Response(
            f'{{"error": "Proxy error: {str(e)}"}}',
            status=502,
            content_type="application/json",
        )


@app.route("/")
def health():
    """Health check endpoint."""
    return {"status": "ok", "proxying_to": CTS_API_BASE}


if __name__ == "__main__":
    print(f"CTS Proxy starting on http://localhost:{PROXY_PORT}")
    print(f"Proxying to: {CTS_API_BASE}")
    print()
    print("Set in browser console:")
    print(f"  window.__CTS_API_BASE__ = 'http://localhost:{PROXY_PORT}'")
    print()
    app.run(host="0.0.0.0", port=PROXY_PORT, debug=True)
