// convex/auth.config.js
export default {
  providers: [
    {
      // The domain of your Clerk Convex JWT issuer.
      // This will be used to verify the JWT's "iss" claim.
      // This is typically your Clerk application's frontend API URL,
      // or your Clerk instance's domain if you're using a custom domain.
      domain: process.env.CLERK_ISSUER_URL,
      // The "applicationID" claim that will be present in the JWT.
      // For Clerk, this is usually "convex".
      applicationID: "convex",
    },
  ]
}; 