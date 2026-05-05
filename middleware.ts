import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Si NO hay usuario y quiere entrar al dashboard -> Al login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Si HAY usuario, verificar el estado de su perfil
  if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('perfil_completado, role')
      .eq('id', user.id)
      .single()

    // Si el perfil NO está completado -> Lo mandamos a completar-perfil
    if (profile && !profile.perfil_completado && profile.role === 'director') {
      return NextResponse.redirect(new URL('/auth/completar-perfil', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  // Ajustamos el matcher para que incluya los dashboards y la validación
  matcher: ['/dashboard/:path*'],
}