export const getCookieSecure = () => {
  const envValue = process.env.COOKIE_SECURE
  if (envValue === "true") {
    return true
  }
  if (envValue === "false") {
    return false
  }
  return process.env.NODE_ENV === "production"
}

