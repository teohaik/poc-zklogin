# ZK Login Flow Tester


This is a simple React App that demonstrates the [Sui ZK Login flow](https://docs.sui.io/concepts/cryptography/zklogin).

> ##### Runs on Sui Testnet 

Logic is included in two main React files:

 - `src/app/page.tsx` which contains the initial page with the login button.
 - `src/app/auth/page.tsx` which contains the page that users get redirected after successful login. It also handles:
   - The decoding of the jwt token
   - The verification of the token
   - The generation of the ZK Proof
   - Execution of a simple Transaction to verify the validity of the proof.


Invocation of Mysten Labs APIs happens in the backend part:

- `src/api/userinfo/get/salt/route.tsx` - Retrieves salt from DB if stored previously or invokes Mysten Labs api to get a new one
- `src/api/userinfo/store/route.tsx` - Saves user data, critical for transaction signing (Salt), to DB. Key = subject Id
- `src/api/zkp/get/route.tsx` - Invokes Mysten Labs api to get the ZK Proof

---

### Development

Just navigate to the `/src/app` folder and run
 -   `npm install`
 -   `npm run dev`

This will fire up a local development server at your machine.

#### Dependencies

 - An active SUI account loaded with SUI should exist on testnet to be used as faucet. To use it, set  the `NEXT_PUBLIC_ADMIN_SECRET_KEY=` environment variable in your .env file. You can use `.env.development.local.example` as a template.
 - Vercel KV storage is used as a database. To use it, create your own KV instance and set details in .env. You can use `.env.development.local.example` as a template.
