import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

const locales = ['en', 'pt', 'es', 'fr', 'it', 'de'];

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
});

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect admin sub-pages (not the login page itself). getUser() runs only
  // inside this branch, so no public request makes the Auth-server round trip.
  if (pathname.startsWith('/admin/')) {
    let response = NextResponse.next({ request });

    const { ok } = await verifyAdmin(request, (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
    });

    if (!ok) {
      return NextResponse.redirect(new URL('/admin?e=1', request.url));
    }

    return response;
  }

  // i18n routing for all public pages
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    return intlMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
