from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request
from typing import Union


def get_validation_error_detail(exc: RequestValidationError) -> str:
    """
    Extract meaningful error details from RequestValidationError.
    
    Args:
        exc: The RequestValidationError exception
        
    Returns:
        A user-friendly error message
    """
    for error in exc.errors():
        error_type = error.get('type', '')
        field = error.get('loc', [''])[-1]
        
        if error_type == 'value_error.email':
            return f"Invalid email format for field '{field}'"
        elif error_type == 'value_error.missing':
            return f"Missing required field '{field}'"
        elif error_type == 'string_too_short':
            min_length = error.get('ctx', {}).get('min_length', '')
            return f"Field '{field}' is too short. Minimum length is {min_length} characters"
        elif error_type == 'string_too_long':
            max_length = error.get('ctx', {}).get('max_length', '')
            return f"Field '{field}' is too long. Maximum length is {max_length} characters"
        elif error_type == 'type_error.integer':
            return f"Field '{field}' must be an integer"
        elif error_type == 'type_error.float':
            return f"Field '{field}' must be a number"
        elif error_type == 'type_error.bool':
            return f"Field '{field}' must be a boolean"
        elif error_type == 'type_error.str':
            return f"Field '{field}' must be a string"
        elif error_type == 'value_error.any_str.min_length':
            min_length = error.get('ctx', {}).get('limit_value', '')
            return f"Field '{field}' must be at least {min_length} characters"
        elif error_type == 'value_error.any_str.max_length':
            max_length = error.get('ctx', {}).get('limit_value', '')
            return f"Field '{field}' must be at most {max_length} characters"
    
    # Default error message
    return "Validation error. Please check your input data."


async def validation_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for RequestValidationError.
    
    Returns a consistent 400 response with a user-friendly error message.
    """
    if not isinstance(exc, RequestValidationError):
        # If it's not a RequestValidationError, re-raise it
        raise exc
    
    error_detail = get_validation_error_detail(exc)
    
    return JSONResponse(
        status_code=400,
        content={
            "detail": error_detail,
            "error_type": "validation_error"
        }
    )
