const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async (): Promise<void> => {
  console.log(`Crawler is working...`);

  await delay(3000); /// waiting 3 second.

  console.log(`Crawler finished`);
};

export default run;
