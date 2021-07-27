interface ILoggerOption {
  type: `info` | `warning` | `error`;
  errorObj?: Error;
  message: string;
}

// This is just a placeholder, will add more handling logic later
const log = ({ type, errorObj, message }: ILoggerOption): void => {
  console.log(`${type}: ${message}`, errorObj);
};

log.info = (message: string, errorObj?: Error): void => {
  log({
    type: `info`,
    errorObj,
    message,
  });
};

log.warning = (message: string, errorObj?: Error): void => {
  log({
    type: `warning`,
    errorObj,
    message,
  });
};

log.error = (message: string, errorObj?: Error): void => {
  log({
    type: `error`,
    errorObj,
    message,
  });
};

export default log;
