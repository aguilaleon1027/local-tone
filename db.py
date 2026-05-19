import httpx
from supabase import create_client, Client
from config import settings

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        old = _client.postgrest.session
        _client.postgrest.session = httpx.Client(
            base_url=str(old.base_url),
            headers=dict(old.headers),
            timeout=old.timeout,
            verify=False,
        )
    return _client
