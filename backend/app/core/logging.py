import logging
import json
import time
from typing import Dict, Any, Optional
from datetime import datetime
import traceback
from fastapi import Request, Response


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON string"""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "UnknownError",
                "message": str(record.exc_info[1]) if record.exc_info[1] else "Unknown error",
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        return json.dumps(log_data, ensure_ascii=False)


def setup_logging():
    """Configure application logging"""
    # Create logger
    logger = logging.getLogger("freediary")
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Set JSON formatter
    formatter = JSONFormatter()
    console_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(console_handler)
    
    # Set logging for uvicorn
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.handlers.clear()
    uvicorn_logger.addHandler(console_handler)
    
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.handlers.clear()
    uvicorn_access_logger.addHandler(console_handler)
    
    return logger


def get_logger(name: str = "freediary") -> logging.Logger:
    """Get logger with specified name"""
    return logging.getLogger(name)


def log_request(request: Request, response: Response, process_time: float):
    """Log HTTP request details"""
    logger = get_logger("freediary.request")
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Get user agent
    user_agent = request.headers.get("user-agent", "unknown")
    
    log_data = {
        "type": "http_request",
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time_ms": round(process_time * 1000, 2),
        "client_ip": client_ip,
        "user_agent": user_agent,
    }
    
    logger.info("HTTP request processed", extra=log_data)


def log_error(error: Exception, context: Optional[Dict[str, Any]] = None):
    """Log application error with context"""
    logger = get_logger("freediary.error")
    
    error_data = {
        "type": "application_error",
        "error_type": error.__class__.__name__,
        "error_message": str(error),
        "traceback": traceback.format_exc(),
    }
    
    if context:
        error_data["context"] = context
    
    logger.error("Application error occurred", extra=error_data)


def log_business_event(event_type: str, event_data: Dict[str, Any]):
    """Log business event"""
    logger = get_logger("freediary.business")
    
    log_data = {
        "type": f"business_{event_type}",
        "timestamp": datetime.now().isoformat(),
        **event_data
    }
    
    logger.info(f"Business event: {event_type}", extra=log_data)
