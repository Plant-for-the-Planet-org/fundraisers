# Fundraiser API — Request Payload

## POST /fundraisers

Creates a new fundraiser. Maps to `CreateFundraiserRequest` in [src/lib/types/fundraiser.ts](../../src/lib/types/fundraiser.ts).

```json
{
    "title": "test mohit - swiss 2",
    "description": "<p>test description </p>",
    "country": "CH",
    "tags": [],
    "content": {},
    "goalAmount": "500000",
    "currency": "CHF",
    "visibility": "public",
    "status": "draft",
    "projectAllocations": [
        {
            "percentage": 100,
            "project_id": "proj_bFH0BU0Qw02RuetpQlLOMVYX"
        }
    ],
    "startDate": "2026-03-03",
    "endDate": "2026-04-02",
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
                "show_recent_list": true,
                "show_top_list": true,
                "show_amount": true,
                "view_all": false,
                "anonymize": false,
                "default_tab": "recent",
                "show_avatar": true
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
    "metadata": {},
    "imageFile": "data:image/jpeg;base64,....."
}
```

### Notes

- `goalAmount` is sent as a string in cents (e.g. `"500000"` = 5000.00 CHF)
- `startDate` / `endDate` are sent as `YYYY-MM-DD`; the API returns them as full ISO datetimes
- `imageFile` is a base64-encoded data URI
- `projectAllocations` uses `project_id` (snake_case) in the request; the response returns a full `project` object
- `metadata` top-level field; `{}` and `null` are both valid
