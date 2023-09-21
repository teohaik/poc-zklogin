# POC TEMPLATE - NextJS version

This repo is a template POC, that will be used for initializing future POCs easier.

- Inspired by: [POC Template](https://github.com/MystenLabs/poc-template)

### TODO
- Add the new version of the Sui TS SDK
- Rethink of the directories structure in a future refactoring
  - Suggested options:
    - The components, hooks, contexts, etc. directories could be in the same level as the `app/src/app` directory
    - There could be multiple components, hooks, contexts, etc. directories, with each one being under the corresponding directory of the page where it is being used

### Directories structure

- move:

  - Contains the Move code of the smart contracts
  - Contains a sample package named `poc` where the developer can add a move module and start building

- app

  - Contains a Typescript NextJS App, with ready-to-use:
    - three (four) different user roles:
      - admin
      - moderator
      - member
      - (anonymous user)
    - routing based on the permissions of the current user
    - `api` directory, to utilize vercel serverless functions upon deployment
    - integration with [Vercel KV](https://vercel.com/docs/storage/vercel-kv/quickstart) for having a persistent storage without managing the deployment of a database
    - `Sui TS SDK` integration
    - `Sui Wallet` connection
    - `environment variables` file reading

- setup
  - A Typescript project, with ready-to-use:
    - environment variable (.env) file reading
    - Sui SDK integration
    - publish shell script

### Adding a new page to the UI

- This NextJS project was bootstrapped with the [NextJS App Router](https://nextjs.org/docs/app/building-your-application/routing)
- To add a new page in the `/example` path, head into `/app/src/app` directory, and:
  - create an `example` directory
  - create a `page.tsx` (naming convention of the framework) file under it
  - export your component as the `default export`
- In the same way, to add a new page in the `example/of/nested/path`, head into the `/app/src/app` directory, and:
  - create the nested `example/of/nested/path` directories:
  - create a `page.tsx` file under it
  - export your component as the `default export`
  - you can check the existing `/admin/test` page as an example

### Adding a new endpoint to the API

- This NextJS project was bootstrapped with the [NextJS App Router](https://nextjs.org/docs/app/building-your-application/routing)
- To add a new endpoint in the `/api/example` path, head into `/app/src/app/api` directory, and:
  - create an `example` directory
  - create a `route.ts` (naming convention of the framework) file under it
  - name your function based on the HTTP method you would like to use
    - For example export const `GET`, export const `POST`
  - in case of integrating with the `vercel KV storage`, add the following lines to disable the default caching behaviour on the deployed environment (see `api/visits/route.ts` as an example)
    - before the function:
      - export const fetchCache = "force-no-store";
      - export const revalidate = 1;
    - inside the function:
      - const path = request.nextUrl.searchParams.get("path") || "/";
      - revalidatePath(path);

### User roles & Authenticated routing

- The current user roles are defined as a type in the file `/app/src/app/types/Authentication.ts`, and as a dictionary in the `app/src/app/constants/USER_ROLES.ts` file
- The pages that should be accessible by each role are placed under the corresponding routing directories
  - the `admin` pages, are all placed under the `/app/src/app/admin` directory
  - the `moderator` pages are all placed under the `/app/src/app/moderator` directory
  - the `member` pages are all placed under the `/app/src/app/member` directory
- We utilize the `layout.tsx` (naming convention by the framework) files, under each one of the previous directories to act as an authentication middleware, and for example prevent a `member` user from visiting the `admin` pages
- The navigation links that each role sees in the Navbar are provided by the `app/src/app/hooks/useGetNavigations.ts` hook

### Developing a new PoC with different names of the user roles

- In case that the names of the user roles are not suitable for your PoC, for example if you want to rename `moderator` to `publisher`, take the following steps:
  - In the `app/src/app/constants/USER_ROLES.ts` file:
    - change the value of the corresponding key: - ROLE_2: "publisher",
      -In the `app/src/app/types/Authentication.ts` file:
    - change the corresponding choice for the UserRole type:
      - export type UserRole = "admin" | "publisher" | "member" | "anonymous";
  - Rename the corresponding directory so that NextJS auto-updates the routes:
    - rename the `app/src/app/moderator` directory to `app/src/app/publisher`
  - Edit the auth middleware in the corresponding `layout.tsx` file:
    - in the `app/src/app/publisher/layout.tsx` file:
      - change the condition to: `if (user?.role !== "publisher")`
  - (Optional) You can also rename the components in the `app/src/app/publisher/page.tsx` file from `ModeratorHomePage` to `PublisherHomePage` for homogeneity

### Local development with Vercel KV

- Of course at first:
  - create a `new project` in the vercel UI
  - `import` the corresponding `GitHub repo` from MystenLabs (need to ask for access if it is not listed)
  - In the `Storage` tab create and attach a Vercel KV Storage instance
- To be able to connect with the vercel KV storage in the local development environment, please follow the steps:
  - install vercel cli
  - run `vercel link` in the root directory of the project
  - select `Mysten Labs`
  - link to existing project
  - run `vercel env pull app/.env.development.local`
    - the created `app/.env.development.local` file should have the same format with the `app/.env.development.local.example` directory
  - start the dev server with:
    - `pnpm run dev` inside the app directory
    - or `vercel dev` in the project's root directory
  - visit the url: `http://localhost:3000/api/visits` in your browser, and observe the `pageVisits` counter being incremented with each visit
