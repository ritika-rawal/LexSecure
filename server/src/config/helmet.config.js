export const helmetOptions = {
  /*
   * The API currently returns JSON only. Keeping Helmet defaults enabled gives
   * us baseline protection such as frameguard, no-sniff, and referrer policy.
   */
  crossOriginResourcePolicy: {
    policy: 'same-site',
  },
};
