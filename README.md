# Polarfox App

[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

An open source interface for the Polarfox DEX.

- Website: [polarfox.io](https://polarfox.io/)
- App: [app.polarfox.io](https://app.polarfox.io)
- Telegram: [polarfoxdex](https://t.me/polarfoxdex)
- Twitter: [@polarfoxdex](https://twitter.com/polarfoxdex)

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

### Configuring the environment (optional)

To have the interface default to a different network when a wallet is not connected:

1. Make a copy of `.env` named `.env.local`
2. Change `REACT_APP_NETWORK_ID` to `"{YOUR_NETWORK_ID}"`
3. Change `REACT_APP_NETWORK_URL` to e.g. `"https://{YOUR_NETWORK_ID}.infura.io/v3/{YOUR_INFURA_KEY}"`

Note that the interface only works on testnets where both
[polarfox-core](https://github.com/Polarfox-DEX/polarfox-core) and
[multicall](https://github.com/makerdao/multicall) are deployed.
The interface will not work on other networks.

## Contributions

**Please open all pull requests against the `master` branch.**
CI checks will run against all PRs.
