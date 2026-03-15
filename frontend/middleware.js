import { NextResponse } from 'next/server'

const publicRoutes = ['/login', '/register']

export function middleware(request) {
  const session = request.cookies.get('session_token')
  const { pathname } = request.nextUrl

  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}