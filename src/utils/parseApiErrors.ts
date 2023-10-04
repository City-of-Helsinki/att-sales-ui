import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

type ApiArrayValidationError = ApiValidationError[];
type ApiValidationError = Record<string, ApiValidationErrorDetail[]>;
type ApiValidationErrorDetail = {
  message: string;
  code: string;
};

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

function isApiArrayValidationError(data: unknown): data is ApiArrayValidationError {
  return Array.isArray(data) && data.reduce((previous, next) => previous && isApiValidationError(next), true);
}

function isApiValidationError(data: unknown): data is ApiValidationError {
  return (
    typeof data === 'object' &&
    data != null &&
    Object.values(data).reduce((previous, next) => previous && isArrayApiValidationErrorDetail(next), true)
  );
}

function isArrayApiValidationErrorDetail(data: unknown): data is ApiValidationErrorDetail[] {
  return Array.isArray(data) && data.reduce((previous, next) => previous && isApiValidationErrorDetail(next), true);
}

function isApiValidationErrorDetail(data: unknown): data is ApiValidationErrorDetail {
  return typeof data === 'object' && data !== null && 'message' in data && 'code' in data;
}

export default function parseApiErrors(err: unknown): string[] {
  let errorMessages: string[] = [];

  if (isFetchBaseQueryError(err)) {
    const errorCode = err.status;
    const errorData = err.data;

    if (isApiArrayValidationError(errorData)) {
      errorData.forEach((row, index: number) => {
        Object.entries(row).forEach(([key, value]) => {
          errorMessages.push(`Row ${index + 1} - ${key}: ${value[0].message}`);
        });
      });
    } else if (isApiValidationError(errorData)) {
      Object.entries(errorData).forEach(([key, value]) => {
        errorMessages.push(`${key}: ${value[0].message}`);
      });
    } else if (isApiValidationErrorDetail(errorData)) {
      errorMessages.push(errorData.message);
    } else {
      errorMessages.push(`${errorCode} - Error`);
    }
  }
  return errorMessages;
}
