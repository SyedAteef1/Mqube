import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from ..core.logging import logger

class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Attach Request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # 2. Process request
        response: Response = await call_next(request)
        
        # 3. Calculate latency duration
        process_time = (time.time() - start_time) * 1000
        formatted_process_time = f"{process_time:.2f}ms"
        
        # 4. Attach request ID to response header
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = formatted_process_time
        
        # 5. Log metrics
        logger.info(
            f"ReqID: {request_id} | "
            f"Client: {request.client.host if request.client else 'unknown'} | "
            f"Method: {request.method} | "
            f"Path: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Latency: {formatted_process_time}"
        )
        
        return response
