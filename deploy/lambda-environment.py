"""Print the Lambda environment JSON for `aws lambda create-function --environment`.

Used by bootstrap-aws.sh so values containing &, ?, = (DATABASE_URL) are
escaped correctly. Generates a fresh SECRET_KEY; the bootstrap only calls this
when it creates the function, so an existing function keeps its key.
"""

import json
import os
import secrets

print(
    json.dumps(
        {
            "Variables": {
                "DEBUG": "False",
                "SECRET_KEY": secrets.token_urlsafe(50),
                "DATABASE_URL": os.environ["DATABASE_URL"],
                # Function URLs look like https://<id>.lambda-url.<region>.on.aws/
                "ALLOWED_HOSTS": f".lambda-url.{os.environ['AWS_REGION']}.on.aws",
                "CORS_ALLOWED_ORIGINS": os.environ["FRONTEND_ORIGIN"],
                "CORS_ALLOWED_ORIGIN_REGEXES": os.environ.get("PREVIEW_ORIGIN_REGEX", ""),
                # Open for the first sign-ups; switch to False afterwards (see README).
                "ALLOW_REGISTRATION": "True",
                # Lambda sends one request at a time per instance.
                "WEB_CONCURRENCY": "1",
            }
        }
    )
)
