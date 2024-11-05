// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { clearAuthCookies, getAuthCookies } from '@/lib/cookie-utils';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    // Get the access token before clearing cookies
    const { accessToken } = getAuthCookies(cookies);

    // Clear all auth cookies using the utility function
    clearAuthCookies(cookies);

    // Revoke Discord OAuth2 token if it exists
    if (accessToken) {
      try {
        const response = await fetch(
          'https://discord.com/api/oauth2/token/revoke',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: accessToken,
              client_id: import.meta.env.CLIENT_ID,
              client_secret: import.meta.env.CLIENT_SECRET,
            }),
          }
        );

        if (!response.ok) {
          console.error(
            'Failed to revoke Discord token:',
            await response.text()
          );
        }
      } catch (error) {
        console.error('Error revoking Discord token:', error);
        // Continue with logout even if token revocation fails
      }
    }

    // Return success response with redirect
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
        'Clear-Site-Data': '"cookies", "storage"', // Optional: Clear all site data
      },
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// Optionally handle GET requests to prevent CSRF
export const GET: APIRoute = async ({ redirect }) => {
  return redirect('/');
};
