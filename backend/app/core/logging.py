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
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add message (can be string or dict)
        if isinstance(record.msg, dict):
            for key, value in record.msg.items():
                log_data[key] = value
        else:
            log_data["message"] = record.getMessage()
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else "UnknownError",
                "message": str(record.exc_info[1]) if record.exc_info[1] else "Unknown error",
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        return json.dumps(log_data, ensure_ascii=False, default=str)


def setup_logging():
    """Configure application logging"""
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
    
    # Configure uvicorn loggers
    for log_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        uvicorn_logger = logging.getLogger(log_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(console_handler)
        uvicorn_logger.propagate = False
    
    return logger


def get_logger(name: str = "freediary") -> logging.Logger:
    """Get logger with specified name"""
    return logging.getLogger(name)


def log_request(request: Request, response: Response, process_time: float):
    """Log HTTP request details"""
    logger = get_logger("freediary")
    
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    
    logger.info({
        "type": "http_request",
        "method": request.method,
        "url": str(request.url),
        "status_code": response.status_code,
        "process_time_ms": round(process_time * 1000, 2),
        "client_ip": client_ip,
        "user_agent": user_agent,
    })


def log_error(error: Exception, context: Optional[Dict[str, Any]] = None):
    """Log application error with context"""
    logger = get_logger("freediary")
    
    error_data: Dict[str, Any] = {
        "type": "application_error",
        "error_type": error.__class__.__name__,
        "error_message": str(error),
        "traceback": traceback.format_exc(),
    }
    
    if context:
        error_data["context"] = context
    
    logger.error(error_data)


def log_business_event(event_type: str, event_data: Dict[str, Any]):
    """Log business event"""
    logger = get_logger("freediary")
    
    log_data: Dict[str, Any] = {
        "type": "business_event",
        "business_event": event_type,
    }
    
    for key, value in event_data.items():
        log_data[key] = value
    
    logger.info(log_data)