# DocuSol

*Note: You will want to start by getting node v22.0.0 or greater to ensure all tooling works*

# Setup
### PNPM
- run `npm install -g pnpm`
- confirm installation with `pnpm -v`
- run `pnpm install`

### OpenSSL
- [Download](https://slproweb.com/products/Win32OpenSSL.html) latest light version
- find the download and run the installer with default settings
- run `pnpm dev` and allow it to create certs when prompted
- should see a new certificates folder with 2 .pem files (intentionally ignored by github)

### Supabase
- run  ```Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
       irm get.scoop.sh | iex```
- run `scoop install supabase`
- run `supabase start`

*Note: if you follow these steps and encounter and error, it is possible the steps have grown out of date, please make updates accordingly*