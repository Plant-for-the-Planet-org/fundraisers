# Fundraiser API — Response Payloads

Maps to `Fundraiser` in [src/lib/types/fundraiser.ts](../../src/lib/types/fundraiser.ts).

The response shape is identical across all three endpoints:
- `POST /fundraisers` (create)
- `GET /fundraisers/:id` (single, authenticated)
- `GET /fundraisers` (list — individual items within `fundraisers[]`)

## POST /fundraisers

```json
{
    "id": "fr_GhHeVDCYkqsh",
    "slug": "GHHEVDCYKQSH",
    "hid": "260MYJVQ2P",
    "title": "test mohit - swiss 2",
    "description": "<p>test description </p>",
    "content": null,
    "goalAmount": 500000,
    "donationCount": 0,
    "totalRaised": 0,
    "currency": "CHF",
    "visibility": "public",
    "canDonate": false,
    "startDate": "2026-03-03T00:00:00+00:00",
    "endDate": "2026-04-02T00:00:00+00:00",
    "image": "69a6758a7f458002804055.jpg",
    "workspace": {
        "country": "CH",
        "name": "Plant-for-the-Planet Schweiz",
        "address": {
            "address": "Centralstrasse 34",
            "city": "Sursee",
            "zipCode": "6210",
            "country": "CH"
        }
    },
    "hosts": [{}],
    "projectAllocations": [
        {
            "project": {
                "id": "proj_bFH0BU0Qw02RuetpQlLOMVYX",
                "name": "Support Plant-for-the-Planet",
                "description": "...",
                "image": "6852bd2495cde981886580.png"
            },
            "percentage": 100
        }
    ],
    "settings": {
        "theme": {
            "base_id": "spring",
            "mode": "light",
            "accent": "emerald",
            "background": "bg-gradient-to-br from-emerald-300/25 via-pink-200/20 via-sky-200/15 to-lime-300/20",
            "body_font": "open-sans",
            "title_font": "poppins",
            "animation": "none"
        },
        "modules": {
            "leaderboard": {
                "enabled": true,
                "view_all": false,
                "anonymize": false,
                "default_tab": "recent",
                "show_amount": true,
                "show_avatar": true,
                "show_top_list": true,
                "show_recent_list": true
            },
            "contribution": {
                "options": [],
                "allow_dedication": true,
                "allow_recurrency": true
            },
            "donor_score": {
                "enabled": true,
                "show_goal": true,
                "showdays_left": true
            },
            "projects_supported": {
                "enabled": true
            },
            "custom_fields": []
        }
    },
    "metadata": null
}
```

## GET /fundraisers/:id (authenticated)

Same shape as POST response. Example with a different workspace and two project allocations:

```json
{
    "id": "fr_CjOfrvpBN4rz",
    "slug": "CJOFRVPBN4RZ",
    "hid": "26OK6HHQ10",
    "title": "test mohit - germany",
    "description": "<p>this is a test description</p>",
    "content": null,
    "goalAmount": 500000,
    "donationCount": 0,
    "totalRaised": 0,
    "currency": "EUR",
    "visibility": "public",
    "canDonate": true,
    "startDate": "2026-02-26T00:00:00+00:00",
    "endDate": "2026-03-28T00:00:00+00:00",
    "image": "69a04b645b021410596886.jpg",
    "workspace": {
        "country": "DE",
        "name": "Plant-for-the-Planet Foundation",
        "address": {
            "address": "Lindemannstr. 13",
            "city": "Tutzing",
            "zipCode": "82327",
            "country": "DE"
        }
    },
    "hosts": [{}],
    "projectAllocations": [
        {
            "project": {
                "id": "proj_bFH0BU0Qw02RuetpQlLOMVYX",
                "name": "Support Plant-for-the-Planet",
                "description": "...",
                "image": "6852bd2495cde981886580.png"
            },
            "percentage": 50
        },
        {
            "project": {
                "id": "proj_fsj4WiG71hgjnSKe0PqBdthJ",
                "name": "Agroforestry for rural livelihoods improvements in Kenya",
                "description": "...",
                "image": "6792310bc8d5f543214453.jpg"
            },
            "percentage": 50
        }
    ],
    "settings": {
        "theme": {
            "base_id": "spring",
            "mode": "light",
            "accent": "emerald",
            "background": "bg-gradient-to-br from-emerald-300/25 via-pink-200/20 via-sky-200/15 to-lime-300/20",
            "body_font": "open-sans",
            "title_font": "poppins",
            "animation": "none"
        },
        "modules": {
            "donor_score": {
                "enabled": true,
                "show_goal": true,
                "showdays_left": true
            },
            "leaderboard": {
                "enabled": true,
                "view_all": false,
                "anonymize": false,
                "default_tab": "recent",
                "show_amount": true,
                "show_avatar": true,
                "show_top_list": true,
                "show_recent_list": true
            },
            "contribution": {
                "options": [],
                "allow_dedication": true,
                "allow_recurrency": true
            },
            "custom_fields": [],
            "projects_supported": {
                "enabled": true
            }
        }
    },
    "metadata": null
}
```

## GET /fundraisers (list)

The list endpoint wraps items in a `category` + `fundraisers` envelope:

```json
{
    "category": {
        "slug": "all",
        "name": "All Fundraisers",
        "id": null
    },
    "fundraisers": [ ]
}
```

Individual items have the same shape as above. Some fields can be `null` when not configured:

```json
{
    "id": "fr_zoxHYgU1wP2i",
    "slug": "spendermailing-2024-11-transparenzb-",
    "hid": "24WV1G1JR0",
    "title": "Spendermailing 2024/11 - Transparenzb.",
    "description": "Track donations - Mailing November 2024",
    "content": null,
    "goalAmount": 0,
    "donationCount": 1,
    "totalRaised": 5000,
    "currency": "EUR",
    "visibility": "public",
    "canDonate": true,
    "startDate": "2024-10-29T00:00:00+00:00",
    "endDate": "2030-12-31T00:00:00+00:00",
    "image": null,
    "workspace": null,
    "hosts": [{}],
    "projectAllocations": [],
    "settings": null,
    "metadata": null
}
```

### Notes

- `goalAmount` and `totalRaised` are returned as numbers in cents (e.g. `500000` = 5000.00)
- `startDate` / `endDate` are returned as full ISO datetimes (`YYYY-MM-DDTHH:mm:ss+00:00`)
- `workspace`, `settings`, `image`, and `metadata` can all be `null`
- `hosts` is `[{}]` in current test data — full host objects expected in production
- `contribution.options` is returned as an array (even when empty)
