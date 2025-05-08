# 🌊 Algerian Maritime Monitor - المرصد البحري الجزائري

**Advanced real-time monitoring and alert system for ensuring safety and security within Algerian waters.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.x-blueviolet?logo=convex)](https://convex.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-brightgreen?logo=clerk)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Mapbox GL JS](https://img.shields.io/badge/Mapbox_GL_JS-2.x-blue?logo=mapbox)](https://www.mapbox.com/mapbox-gljs)

---

## 🎯 Overview

The Algerian Maritime Monitor is a full-stack web application designed for authorized administrative personnel to oversee maritime activities. It provides real-time vessel tracking, geofenced zone alerts, and comprehensive administrative tools for managing users, fisher profiles, and restricted zones. The platform aims to enhance situational awareness and enable rapid response to ensure the security and lawful use of Algerian territorial waters.

## ✨ Key Features

*   **🚢 Live Vessel Tracking:** Interactive map displaying real-time AIS (Automatic Identification System) vessel positions.
*   **ोن Restricted Zone Management:** Admins can define, view, and edit geofenced restricted maritime zones.
*   **🔔 Instant Alerts:** Notifications for vessels entering or exiting restricted zones (future enhancement: SMS/email alerts).
*   **👤 User Authentication & Authorization:** Secure sign-up/sign-in via Clerk, with role-based access control (Admin, Fisher).
*   **📧 Invite-Only System:** New users (Admins or Fishers) can only be added via a secure, token-based invitation system managed by Admins.
    *   Invite creation, listing, and revocation.
    *   Email allow-listing with Clerk.
    *   Secure invite redemption page.
*   **🎣 Fisher Profile Management:** Admins can manage fisher contact details and alert preferences.
*   **🛡️ Admin Dashboard:** Centralized interface for managing invites, user roles, fisher profiles, and restricted zones.
*   **🌐 SSR & Optimized UX:** Built with Next.js for server-side rendering and a responsive, modern UI using TailwindCSS and Shadcn/ui components.

## 🛠️ Technology Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [React](https://reactjs.org/)
    *   [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
    *   [Shadcn/ui](https://ui.shadcn.com/) (UI component library - implicitly used)
    *   [Mapbox GL JS](https://www.mapbox.com/mapbox-gljs) (via `react-map-gl`) for interactive maps
*   **Backend & Database:**
    *   [Convex](https://convex.dev/) (Serverless backend platform with real-time database, functions, and file storage)
*   **Authentication:**
    *   [Clerk](https://clerk.com/) (User management and authentication)
*   **Deployment:**
    *   Frontend: Vercel, Netlify, or similar Next.js hosting.
    *   Backend: Convex Cloud.

## 🚀 Local Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up Convex:**
    *   Install Convex CLI: `npm install -g convex`
    *   Login: `npx convex login`
    *   Initialize project (if first time): `npx convex dev` (This will guide you through creating a project and link your local `convex/` directory to a dev deployment).

4.  **Set up Clerk:**
    *   Create an account at [Clerk.com](https://clerk.com/).
    *   Create a new application and note your **Publishable Key** and **Secret Key**.
    *   Configure your Clerk instance (e.g., allow email/password, social logins).

5.  **Set up Mapbox:**
    *   Create an account at [Mapbox.com](https://www.mapbox.com/).
    *   Get your **Public Access Token**.

6.  **Environment Variables:**
    Create a `.env.local` file in the root of your project with the following (replace placeholders with your actual keys):

    ```env
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
    CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY

    # Convex (dev - typically set by `npx convex dev`)
    # NEXT_PUBLIC_CONVEX_URL should point to your Convex dev deployment URL
    # e.g., https://your-project-name.convex.cloud
    # This is usually handled automatically by the ConvexProvider setup if CONVEX_DEPLOYMENT is in .env.local

    # Mapbox
    NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_MAPBOX_PUBLIC_ACCESS_TOKEN
    ```

    And for your Convex backend (managed via Convex dashboard or CLI for dev, and specifically for prod):
    *   `CLERK_SECRET_KEY`: (Same as above, needed for Node.js actions in Convex)
    *   `MAPBOX_TOKEN`: (Same as above, if any backend functions were to use it - currently frontend only)


7.  **Push Convex schema and functions (if not done by `convex dev`):**
    The `npx convex dev` command usually handles this automatically by watching your `convex/` directory.

8.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js frontend (usually on `http://localhost:3000`) and the Convex dev server, which syncs your backend code.

## ☁️ Deployment

### Backend (Convex)

1.  **Link to Production Project (if not already done):**
    If you have a separate Convex project for production:
    ```bash
    npx convex link https://<your-prod-project-name>.convex.cloud
    ```
    Or ensure your current project has a "prod" deployment.

2.  **Deploy Functions & Schema to Production:**
    ```bash
    npx convex deploy --prod
    ```

3.  **Set Production Environment Variables in Convex:**
    Use the Convex dashboard or CLI to set `CLERK_SECRET_KEY` for your production deployment:
    ```bash
    npx convex env set --prod CLERK_SECRET_KEY sk_live_YOUR_CLERK_PROD_SECRET_KEY
    # Add any other backend-specific prod env vars
    ```

4.  **Migrate Data (Optional, e.g., dev to prod):**
    *   Export from source (e.g., dev deployment):
        ```bash
        npx convex export --path dev_backup.zip # (ensure CLI is pointed to dev)
        ```
    *   Import to target (e.g., prod deployment):
        ```bash
        npx convex import --prod --replace dev_backup.zip
        ```

### Frontend (Next.js - e.g., Vercel)

1.  **Connect your Git repository** to your hosting provider (Vercel, Netlify, etc.).

2.  **Configure Build Settings:**
    *   Build Command: `npm run build` (or `yarn build`, `pnpm build`)
    *   Output Directory: `.next`

3.  **Set Production Environment Variables on your hosting platform:**
    *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your **production** Clerk Publishable Key (e.g., `pk_live_...`).
    *   `CLERK_SECRET_KEY`: Your **production** Clerk Secret Key (e.g., `sk_live_...`) - *Note: while also in Convex, Next.js might need it during build or for API routes if any were not using Convex actions directly*.
    *   `NEXT_PUBLIC_CONVEX_URL`: The URL of your **production** Convex deployment (e.g., `https://your-prod-project-name.convex.cloud`).
    *   `NEXT_PUBLIC_MAPBOX_TOKEN`: Your Mapbox Public Access Token.

4.  **Trigger a deploy.**

## ⚙️ Convex CLI Usage Highlights

*   **Run dev server (watches files, pushes to dev deployment):**
    ```bash
    npx convex dev
    ```
*   **Deploy to production:**
    ```bash
    npx convex deploy --prod
    ```
*   **Manage environment variables (use `--prod` for production):**
    ```bash
    npx convex env list
    npx convex env set <NAME> <VALUE>
    npx convex env get <NAME>
    npx convex env remove <NAME>
    ```
*   **Import/Export data (use `--prod` for production):**
    ```bash
    npx convex export --path backup.zip
    npx convex import --table <tableName> data.jsonl
    npx convex import --replace backup.zip
    ```
*   **View logs (use `--prod` for production):**
    ```bash
    npx convex logs
    ```
*   **Run a function (use `--prod` for production):**
    ```bash
    npx convex run myModule:myFunction '{"arg1": "value"}'
    ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details (assuming you'll add one).

---

Generated by AI for the Algerian Maritime Monitor project.
Adjust paths, URLs, and specific commands as per your final setup.
