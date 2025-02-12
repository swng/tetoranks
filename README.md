# **tetoranks**

Quick node.js script to generate a tetoranks card. Takes a teto rank as an arg. Generated image saved to `output.png`

Example usage:

```bash
node tetoranks.js ss
```

## **Prerequisites**

node.js dependencies:
   ```bash
   npm install puppeteer
   ```

It console.errors() stuff if you give it improper args or a bad rank arg or there's a network error.

Caching not currently implemented in here. Parent wrapper handles caching.
