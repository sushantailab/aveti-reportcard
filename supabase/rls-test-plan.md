# RLS Test Plan: Centre Isolation

## Preconditions

- Run all pending migrations, including `20260603_rls_centre_isolation.sql`.
- Ensure every existing `centres` row has the correct `owner_user_id`.
- Create two Supabase Auth users:
  - Centre A user
  - Centre B user
- Create one centre row owned by each user.
- Add at least one student, test, and result for each centre.
- Make Centre B's student phone number easy to recognize, for example `9876543210`.

## Positive Test: Centre A Can Read Its Own Data

1. Sign in as Centre A and capture its access token.
2. Call:
   - `GET /rest/v1/centres?select=*`
   - `GET /rest/v1/students?select=*`
   - `GET /rest/v1/tests?select=*`
   - `GET /rest/v1/results?select=*`
   - `GET /rest/v1/chapters?select=*`
3. Expected:
   - Only Centre A rows are returned.
   - Centre A parent phone numbers are visible.
   - Centre A tests and results are visible.

## Negative Test: Centre A Cannot Read Centre B

Use Centre A's access token.

```bash
export SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
export ANON_KEY="YOUR_ANON_KEY"
export CENTRE_A_TOKEN="CENTRE_A_AUTH_ACCESS_TOKEN"
export CENTRE_B_ID="CENTRE_B_UUID"
export CENTRE_B_TEST_ID="CENTRE_B_TEST_UUID"
```

### Centre B centre row is hidden

```bash
curl -s "$SUPABASE_URL/rest/v1/centres?id=eq.$CENTRE_B_ID&select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $CENTRE_A_TOKEN"
```

Expected: `[]`

### Centre B tests are hidden

```bash
curl -s "$SUPABASE_URL/rest/v1/tests?centre_id=eq.$CENTRE_B_ID&select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $CENTRE_A_TOKEN"
```

Expected: `[]`

### Centre B results are hidden

```bash
curl -s "$SUPABASE_URL/rest/v1/results?test_id=eq.$CENTRE_B_TEST_ID&select=*" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $CENTRE_A_TOKEN"
```

Expected: `[]`

### Centre B parent phone numbers are hidden

```bash
curl -s "$SUPABASE_URL/rest/v1/students?centre_id=eq.$CENTRE_B_ID&select=name,parent_phone" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $CENTRE_A_TOKEN"
```

Expected: `[]`

Also confirm the known Centre B phone number, such as `9876543210`, does not appear anywhere in the response.

## Negative Write Test: Centre A Cannot Write Into Centre B

Use Centre A's access token.

```bash
curl -i "$SUPABASE_URL/rest/v1/tests" \
  -X POST \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $CENTRE_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "centre_id":"'"$CENTRE_B_ID"'",
    "class_level":7,
    "section":"A",
    "subject":"SST",
    "chapter_no":1,
    "chapter_name":"Blocked write",
    "test_type":"CET",
    "full_marks":25,
    "test_date":"2026-06-03"
  }'
```

Expected: HTTP `401`, `403`, or PostgREST RLS error. No row should be inserted.

## App Smoke Test

1. Sign in as Centre A in the app.
2. Confirm only Centre A students/tests appear.
3. Sign out.
4. Sign in as Centre B.
5. Confirm only Centre B students/tests appear.
6. In Parent report, confirm Centre A cannot see Centre B parent phone numbers, and vice versa.

## Pass Criteria

- Centre A cannot retrieve Centre B centres, students, tests, results, chapters, or parent phones via REST.
- Centre A cannot insert/update/delete rows under Centre B's `centre_id`.
- The app still works normally for the signed-in centre's own data.
