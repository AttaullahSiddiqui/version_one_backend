import errorObject from './errorObject.js';

export default (nextFunc, err, req, errStatusCode = 500) => {
  const errorObj = errorObject(err, req, errStatusCode);
  return nextFunc(errorObj);
};
