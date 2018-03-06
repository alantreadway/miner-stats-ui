// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  apiEndpoint: 'https://fvwrb8hbta.execute-api.eu-west-1.amazonaws.com/dev/',
  firebase: {
    apiKey: 'AIzaSyDCCrkLTTbd6CpEbdLjRtesRIvJod3UpRc',
    authDomain: 'miner-stats-dev.firebaseapp.com',
    databaseURL: 'https://miner-stats-dev.firebaseio.com',
    messagingSenderId: '568136785010',
    projectId: 'miner-stats-dev',
    storageBucket: 'miner-stats-dev.appspot.com',
  },
  production: false,
};
