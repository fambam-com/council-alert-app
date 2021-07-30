interface ILoggerOption {
  type: `info` | `warning` | `error`;
  errorObj?: Error;
  message: string;
}

const _getUTCNow = (): number => {
  return new Date().getTime();
};

// This is just a placeholder, will add more handling logic later
const log = ({ type, errorObj, message }: ILoggerOption): void => {
  const utcNow = _getUTCNow();
  console.log(`${type}(${utcNow}): ${message}`, errorObj);
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
