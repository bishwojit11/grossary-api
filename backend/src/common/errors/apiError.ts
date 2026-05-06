import { ReasonPhrases, StatusCodes } from 'http-status-codes';

interface ApiErrorOptions {
  details?: string;
  appCode?: number | null;
  httpReasonPhrase?: ReasonPhrases;
  httpStatusCode?: StatusCodes;
}

export class ApiError extends Error {
  public details?: string;
  public appCode?: number | null;
  public httpReasonPhrase?: string;
  public httpStatusCode?: number;
  public timestamp: Date;
  public isOperational: boolean;

  constructor(
    message = '',
    options: ApiErrorOptions = {
      details: '',
      appCode: null,
      httpReasonPhrase: ReasonPhrases.INTERNAL_SERVER_ERROR,
      httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    },
  ) {
    super(message);
    this.details = options?.details;
    this.httpStatusCode = options?.httpStatusCode;
    this.httpReasonPhrase = options?.httpReasonPhrase;
    this.appCode = options?.appCode;
    this.timestamp = new Date();
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  get name() {
    return 'ApiError';
  }
}

export class NotFoundException extends ApiError {
  constructor(message = 'Not Found.') {
    super(message, {
      httpStatusCode: StatusCodes.NOT_FOUND,
      httpReasonPhrase: ReasonPhrases.NOT_FOUND,
    });
  }
}

export class BadRequestException extends ApiError {
  constructor(message = 'Bad Request.') {
    super(message, {
      httpStatusCode: StatusCodes.BAD_REQUEST,
      httpReasonPhrase: ReasonPhrases.BAD_REQUEST,
    });
  }
}

export class UnauthorizedException extends ApiError {
  constructor(message = 'Unauthorized.') {
    super(message, {
      httpStatusCode: StatusCodes.UNAUTHORIZED,
      httpReasonPhrase: ReasonPhrases.UNAUTHORIZED,
    });
  }
}

export class ForbiddenException extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, {
      httpStatusCode: StatusCodes.FORBIDDEN,
      httpReasonPhrase: ReasonPhrases.FORBIDDEN,
    });
  }
}

export class ConflictException extends ApiError {
  constructor(message = 'Conflict.') {
    super(message, {
      httpStatusCode: StatusCodes.CONFLICT,
      httpReasonPhrase: ReasonPhrases.CONFLICT,
    });
  }
}
