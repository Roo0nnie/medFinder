"""
Custom authentication backend that trusts Better Auth session cookies.

Reads the `better-auth.session_token` (or `authjs.session-token`) cookie,
looks up the matching session in the shared Postgres `sessions` table, and
attaches the corresponding user to `request.user`.
"""
from datetime import datetime

from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import BetterAuthSession, User


class BetterAuthSessionAuthentication(authentication.BaseAuthentication):
    """Authenticate using Better Auth session cookies shared with the Next.js app."""

    COOKIE_KEYS = [
        "better-auth.session_token",
        "better-auth.session-token",
        "authjs.session-token",
    ]

    def authenticate(self, request):
        token = self._get_token_from_cookies(request)
        if not token:
            return None

        # Better Auth session cookies append a signature after a dot; DB stores the raw token.
        token_core = token.split(".", 1)[0]

        session = (
            BetterAuthSession.objects.select_related("user")
            .filter(token=token_core, expires_at__gt=timezone.now())
            .first()
        )
        if not session:
            # Return None so AllowAny views still work even with stale cookies.
            return None

        user: User = session.user
        return (user, None)

    def _get_token_from_cookies(self, request):
        cookies = request.COOKIES or {}
        for key in self.COOKIE_KEYS:
            if key in cookies:
                return cookies.get(key)
        return None
