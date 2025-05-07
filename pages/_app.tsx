import '../styles/globals.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { AppProps } from 'next/app'

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

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider 
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      {...pageProps}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

export default MyApp
