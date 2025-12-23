import {addSnackbar, SnackbarType} from '../Redux/snackbarSlice';
import strings from '../Constants/strings';

/**
 * Error utility functions following reference project pattern
 */

export const ErrorUtils = {
  /**
   * Handle API error and show snackbar
   */
  handleApiError: (
    error: any,
    dispatch: any,
    defaultMessage?: string,
  ): void => {
    let message = defaultMessage || strings.somethingWentWrong;

    if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    dispatch(
      addSnackbar({
        message,
        type: SnackbarType.ERROR,
      }),
    );
  },

  /**
   * Handle PUT API error (following reference project pattern)
   */
  handlePutApiError: (
    error: any,
    dispatch: any,
    defaultMessage?: string,
  ): void => {
    ErrorUtils.handleApiError(error, dispatch, defaultMessage);
  },

  /**
   * Handle POST API error
   */
  handlePostApiError: (
    error: any,
    dispatch: any,
    defaultMessage?: string,
  ): void => {
    ErrorUtils.handleApiError(error, dispatch, defaultMessage);
  },

  /**
   * Handle GET API error
   */
  handleGetApiError: (
    error: any,
    dispatch: any,
    defaultMessage?: string,
  ): void => {
    ErrorUtils.handleApiError(error, dispatch, defaultMessage);
  },

  /**
   * Handle DELETE API error
   */
  handleDeleteApiError: (
    error: any,
    dispatch: any,
    defaultMessage?: string,
  ): void => {
    ErrorUtils.handleApiError(error, dispatch, defaultMessage);
  },

  /**
   * Extract error message from error object
   */
  getErrorMessage: (error: any): string => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    } else if (error?.message) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    }
    return strings.somethingWentWrong;
  },
};

