# UOMI TWITTER BOT TEMPLATE

This is a template for creating a Twitter aget using a UOMI.
This is the web2 module of a Twitter agent used to permit the onchain agent to interact with the Twitter API.

## Requirements

- Node.js (v20+)
- Yarn (install with `npm install -g yarn`)

## Installation

```bash
git clone ...
cd uomi-twitter-bot-template
yarn install
```

## Configuration

All configuration is store on the `./config` folder. There are three files:

- `bot.js`: Bot configuration used to find arguments for the weets and user to interact with.
- `twitter.js`: Twitter API configuration used to authenticate the bot with the Twitter API.
- `chain.js`: Chain configuration used to interact with the UOMI chain.

## Usage

```bash
yarn start
```