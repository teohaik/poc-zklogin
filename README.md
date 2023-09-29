# ZK Login Flow Tester


This is a simple React App that demonstrates the Sui ZK Login flow.

Logic is included in two main React files:

 - `src/app/page.tsx` which contains the initial page with the login button.
 - `src/app/auth/page.tsx` which contains the page that users gets redirected after successful login. It also handles:
   - The decoding of the jwt token
   - The verification of the token
   - The generation of the ZK Proof
   - Execution of a simple Transaction to verify the validity of the proof.


Invocation of Mysten Labs APIs happens in the backend part:

- `src/api/userinfo/get/salt/route.tsx` - Retrieves salt from DB if stored previously or invokes Mysten Labs api to get a new one
- `src/api/userinfo/store/route.tsx` - Saves user data, critical for transaction signing (Salt), to DB. Key = subject Id
- `src/api/zkp/get/route.tsx` - Invokes Mysten Labs api to get the ZK Proof



