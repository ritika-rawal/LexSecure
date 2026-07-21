import { body, query } from 'express-validator';

const isEmptyObject = (value) =>
  !value
  || (
    typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length === 0
  );

export const accountExportValidator = [
  query().custom((queryValues) => {
    if (!isEmptyObject(queryValues)) {
      throw new Error('Account export does not accept query parameters.');
    }

    return true;
  }),
  body().custom((requestBody) => {
    if (!isEmptyObject(requestBody)) {
      throw new Error('Account export does not accept a request body.');
    }

    return true;
  }),
];
