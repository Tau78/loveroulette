#!/usr/bin/env python3
"""Fill Love Roulette App Store listing via ASC API. Does not submit for review."""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    import jwt
except ImportError:
    raise SystemExit("pip3 install PyJWT cryptography")

HOME = Path.home()
KEY_PATH = HOME / ".app-store/asc-api/AuthKey_5WS8U99P9G.p8"
KEY_ID = "5WS8U99P9G"
ISSUER = "a5c2ff50-1df7-493e-a4fa-50ae13cbe810"
APP_ID = "6805227768"
API = "https://api.appstoreconnect.apple.com"

DESC_IT = """Love Roulette è la plancia dell’animatore per una serata live in sala.

Apri l’app, inserisci il codice della serata e comandi quiz, proiettore e telefoni dei partecipanti. Non è un casinò e non è un gioco d’azzardo: il nome “Roulette” è il format dello show, non una slot e non una puntata in denaro.

Cosa fa l’app
• Apre la dashboard della serata sullo stesso sito di proiettore e giocatori
• Tiene a portata di mano le fasi del gioco (quiz, coppie, finali)
• Resta accesa in orizzontale, pensata per iPad

Cosa non c’è
• Soldi veri, gettoni comprabili o prelievi
• Account da creare o acquisti in-app
• Pubblicità

Proiettore e telefoni dei singoli usano il sito web con lo stesso codice. Questa app è solo la plancia di chi conduce."""

PROMO_IT = "Plancia live per la serata: stesso codice di proiettore e telefoni. Non è un gioco d’azzardo."
KEYWORDS_IT = "plancia,serata,quiz,live,animatore,single,sala,show,ipad,eventi"
SUBTITLE_IT = "Plancia serata live"
WHATS_NEW_IT = "Prima versione: plancia animatore per la serata Love Roulette."
SUPPORT = "https://loveroulette.vercel.app/privacy"
PRIVACY = "https://loveroulette.vercel.app/privacy"


def token() -> str:
    now = int(time.time())
    payload = {
        "iss": ISSUER,
        "iat": now,
        "exp": now + 18 * 60,
        "aud": "appstoreconnect-v1",
    }
    return jwt.encode(
        payload,
        KEY_PATH.read_text(),
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


def req(method: str, path: str, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "Authorization": f"Bearer {token()}",
        "Accept": "application/json",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(
        API + path, data=data, headers=headers, method=method
    )
    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        err = exc.read().decode("utf-8", "replace")
        raise SystemExit(f"{method} {path} → {exc.code}\n{err}") from exc


def main() -> None:
    if not KEY_PATH.is_file():
        raise SystemExit("manca la chiave API ASC")

    versions = req(
        "GET",
        f"/v1/apps/{APP_ID}/appStoreVersions?filter[platform]=IOS&limit=5",
    )
    version = versions["data"][0]
    version_id = version["id"]
    print("version", version_id, version["attributes"].get("versionString"), version["attributes"].get("appStoreState"))

    req(
        "PATCH",
        f"/v1/appStoreVersions/{version_id}",
        {
            "data": {
                "type": "appStoreVersions",
                "id": version_id,
                "attributes": {
                    "copyright": "2026 Mauro Andreoni",
                    "reviewType": "APP_STORE",
                },
            }
        },
    )

    locs = req("GET", f"/v1/appStoreVersions/{version_id}/appStoreVersionLocalizations")
    it_loc = next(
        (row for row in locs["data"] if row["attributes"].get("locale", "").startswith("it")),
        locs["data"][0],
    )
    loc_id = it_loc["id"]
    req(
        "PATCH",
        f"/v1/appStoreVersionLocalizations/{loc_id}",
        {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": {
                    "description": DESC_IT,
                    "keywords": KEYWORDS_IT,
                    "promotionalText": PROMO_IT,
                    "supportUrl": SUPPORT,
                    "marketingUrl": "https://loveroulette.vercel.app",
                },
            }
        },
    )
    print("localization", it_loc["attributes"].get("locale"), "updated")

    infos = req("GET", f"/v1/apps/{APP_ID}/appInfos")
    info_id = infos["data"][0]["id"]
    info_locs = req("GET", f"/v1/appInfos/{info_id}/appInfoLocalizations")
    it_info = next(
        (row for row in info_locs["data"] if row["attributes"].get("locale", "").startswith("it")),
        info_locs["data"][0],
    )
    req(
        "PATCH",
        f"/v1/appInfoLocalizations/{it_info['id']}",
        {
            "data": {
                "type": "appInfoLocalizations",
                "id": it_info["id"],
                "attributes": {
                    "name": "Love Roulette",
                    "subtitle": SUBTITLE_IT,
                    "privacyPolicyUrl": PRIVACY,
                },
            }
        },
    )
    print("app info IT updated")

    cats = req("GET", "/v1/appCategories?filter[platforms]=IOS")
    ent = next(
        (row for row in cats.get("data", []) if row["id"] == "ENTERTAINMENT"),
        None,
    )
    life = next(
        (row for row in cats.get("data", []) if row["id"] == "LIFESTYLE"),
        None,
    )
    if ent:
        req(
            "PATCH",
            f"/v1/appInfos/{info_id}",
            {
                "data": {
                    "type": "appInfos",
                    "id": info_id,
                    "relationships": {
                        "primaryCategory": {"data": {"type": "appCategories", "id": ent["id"]}},
                        **(
                            {
                                "secondaryCategory": {
                                    "data": {"type": "appCategories", "id": life["id"]}
                                }
                            }
                            if life
                            else {}
                        ),
                    },
                }
            },
        )
        print("categories set")
    else:
        print("ENTERTAINMENT category not found — skip")

    # Attach latest iOS build if the version has none
    rel = req("GET", f"/v1/appStoreVersions/{version_id}/build")
    if not rel.get("data"):
        builds = req(
            "GET",
            f"/v1/builds?filter[app]={APP_ID}&sort=-uploadedDate&limit=3",
        )
        if builds.get("data"):
            build_id = builds["data"][0]["id"]
            processing = builds["data"][0]["attributes"].get("processingState")
            print("latest build", build_id, processing, builds["data"][0]["attributes"].get("version"))
            if processing == "VALID":
                req(
                    "PATCH",
                    f"/v1/appStoreVersions/{version_id}",
                    {
                        "data": {
                            "type": "appStoreVersions",
                            "id": version_id,
                            "relationships": {
                                "build": {
                                    "data": {"type": "builds", "id": build_id}
                                }
                            },
                        }
                    },
                )
                print("build attached")
            else:
                print("build not VALID yet — attach later")
        else:
            print("no builds yet")
    else:
        print("version already has a build")

    rating = req("GET", f"/v1/appStoreVersions/{version_id}/ageRatingDeclaration")
    if rating.get("data"):
        rid = rating["data"]["id"]
        # Individual account: Simulated Gambling must stay NONE.
        attrs = {
            "alcoholTobaccoOrDrugUseOrReferences": "NONE",
            "contests": "INFREQUENT_OR_MILD",
            "gamblingSimulated": "NONE",
            "horrorOrFearThemes": "NONE",
            "matureOrSuggestiveThemes": "NONE",
            "medicalOrTreatmentInformation": "NONE",
            "profanityOrCrudeHumor": "NONE",
            "sexualContentGraphicAndNudity": "NONE",
            "sexualContentOrNudity": "NONE",
            "violenceCartoonOrFantasy": "NONE",
            "violenceRealistic": "NONE",
            "violenceRealisticProlongedGraphicOrSadistic": "NONE",
            "gambling": False,
            "unrestrictedWebAccess": True,
            "kidsAgeBand": None,
        }
        req(
            "PATCH",
            f"/v1/ageRatingDeclarations/{rid}",
            {
                "data": {
                    "type": "ageRatingDeclarations",
                    "id": rid,
                    "attributes": attrs,
                }
            },
        )
        print("age rating patched")

    print("DONE — not submitted for review")


if __name__ == "__main__":
    os.environ.setdefault("PYTHONUNBUFFERED", "1")
    main()
