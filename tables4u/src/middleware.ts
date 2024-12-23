import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { JwtPayload } from './lib/jwtPayload';

const protectedRoutes = ['/manage-restaurant', '/admin-dashboard'];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    const isProtectedRoute = protectedRoutes.includes(path)

    if (isProtectedRoute) {
        // grab token and check if it exists
        const token = request.cookies.get("jwt")?.value;
        if (!token) {
            // determine what login to send the user to
            if (path == '/manage-restaurant') return NextResponse.redirect(new URL('/owner-login', request.url));
            else if (path == '/admin-dashboard') return NextResponse.redirect(new URL('/admin-login', request.url));
            return NextResponse.redirect(new URL('/', request.url));
        }

        try {
            // attempt to verify token
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload, protectedHeader: _protectedHeader } = await jwtVerify(token, secret);
            const decoded = payload as JwtPayload;

            // jwt is valid
            if (path == '/manage-restaurant' && decoded.isAdmin
                || path == '/admin-dashboard' && !decoded.isAdmin) {
                
                // redirect to correct login
                const redirectURL = (decoded.isAdmin) ? "/owner-login" : "/admin-login";
                const response = NextResponse.redirect(new URL(redirectURL, request.url));
                response.cookies.delete("jwt");
                return response;
            }
        } catch(error) {
            // jwt is invalid, determine if user was previously an owner or admin
            const decoded = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
            
            // redirect to correct login
            const redirectURL = (decoded.isAdmin) ? "/admin-login" : "/owner-login"
            const response = NextResponse.redirect(new URL(redirectURL, request.url));
            response.cookies.delete("jwt");
            return response;
        }
    }

    // redirect if bad find-reservation queries
    if (path == '/find-reservation') {
        // grab search params
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");
        const email = searchParams.get("email");
        const validCode = code && !isNaN(Number(code));

        // determine if request has one query but not the other and clear them if so
        if (validCode && !email || email && !validCode)
            return NextResponse.redirect(new URL("/find-reservation", request.url));
    }

    return NextResponse.next();
}


export const config = {
    matcher: [
      /*
       * Match all request paths except for the ones starting with:
       * - _next/static (static files)
       * - _next/image (image optimization files)
       * - favicon.ico, sitemap.xml, robots.txt (metadata files)
       */
      '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}