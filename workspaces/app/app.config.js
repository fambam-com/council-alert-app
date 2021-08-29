require("dotenv").config({ path: `../../.env` });

export default ({ config }) => {
  return {
    ...config,
    extra: {
      API_URI: process.env.API_URI,
    },
  };
};
