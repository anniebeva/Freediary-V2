import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from typing import Callable, Optional

from .logging import log_request


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log details"""
        start_time = time.time()
        
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log successful request
            log_request(request, response, process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            
            # Create error response
            response = Response(
                content={"detail": "Internal server error"},
                status_code=500
            )
            
            # Log error request
            log_request(request, response, process_time)
            
            # Re-raise the exception
            raise e


def create_request_logging_middleware():
    """Factory function to create request logging middleware"""
    return RequestLoggingMiddleware()