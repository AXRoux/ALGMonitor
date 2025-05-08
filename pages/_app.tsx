import '../styles/globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'

import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from '@clerk/nextjs'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import Layout from '../components/Layout'
import { api } from "@/convex/_generated/api"
import { useMutation } from "convex/react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      {...pageProps}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <EnsureRoleOnSignIn />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

// NEW component to trigger role setup once per sign-in
const EnsureRoleOnSignIn = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const ensureRole = useMutation(api.users.ensureRoleOnSignIn as any);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    ensureRole({}).catch(() => {/* no-op */});
  }, [isLoaded, isSignedIn]);
  return null;
};

export default MyApp
