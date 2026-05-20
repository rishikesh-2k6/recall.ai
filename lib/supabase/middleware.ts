import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Helper to ensure returnUrl is a safe relative path
  const getSafeReturnUrl = (urlStr: string | null, fallback: string = "/dashboard"): string => {
    if (!urlStr) return fallback
    try {
      // Decode URL in case it's double encoded
      const decoded = decodeURIComponent(urlStr)
      // Only allow relative paths starting with / and not starting with // or /\ (which can be interpreted as protocols in some browsers)
      if (decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.startsWith("/\\")) {
        return decoded
      }
    } catch {
      // ignore parsing error
    }
    return fallback
  }

  const currentPath = request.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (user && (currentPath.startsWith("/auth/login") || currentPath.startsWith("/auth/signup"))) {
    const returnUrl = getSafeReturnUrl(request.nextUrl.searchParams.get("returnUrl"))
    return NextResponse.redirect(new URL(returnUrl, request.url))
  }

  // Redirect unauthenticated users from protected routes
  const protectedRoutes = ["/dashboard", "/meetings", "/profile", "/upgrade"]
  const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route))

  if (!user && isProtectedRoute) {
    const loginUrl = new URL("/auth/login", request.url)
    const returnPath = currentPath + request.nextUrl.search
    loginUrl.searchParams.set("returnUrl", returnPath)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

