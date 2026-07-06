
# How to run this
```sh
git clone https://current-repo-url.com
```

```sh
npm install -D
```
Or if you are using pnpm (if not, why not?)

```sh
pnpm install
```

Replace `store-name` to your store identifier  in `package.json` `"dev:shopify"` script 
```json
//...above settings 
"scripts": {
    //...other scripts
    "dev:shopify": "shopify theme dev --store=store-name"
  },
//..remaning settings
```

Run development mode, it will run tailwind transpiler and local development server
```sh
npm run dev 
```


## Additional directories 

### /styles 
Here you have to write additional styling for further its compilation into minified bundle with tailwindcss
dawn

