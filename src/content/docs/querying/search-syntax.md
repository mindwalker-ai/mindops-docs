---
title: Search and Filter Syntax
description: The MindOps search and filter syntax - operators (=, !=, IN, NOT_IN, EXISTS, CONTAINS), AND logic, and full-text search, with examples.
---

Filters are how you narrow metrics, logs, and traces to the records you care about. MindOps uses a consistent filter syntax across the Query Builder and the explore views: an attribute, an operator, and a value.

## Filter shape

```text
attribute  operator  value
```

For example:

```text
service_name = "checkout"
http_status_code >= 500
```

## Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equals | `service_name = "checkout"` |
| `!=` | Not equal | `severity_text != "INFO"` |
| `>` `>=` `<` `<=` | Numeric comparison | `duration_ms > 200` |
| `IN` | Matches any in a list | `service_name IN ("cart","checkout")` |
| `NOT_IN` | Matches none in a list | `status_code NOT_IN (200, 204)` |
| `EXISTS` | Attribute is present | `user_id EXISTS` |
| `NOT_EXISTS` | Attribute is absent | `error_code NOT_EXISTS` |
| `CONTAINS` | Substring match | `body CONTAINS "timeout"` |
| `NOT_CONTAINS` | Substring absent | `body NOT_CONTAINS "healthcheck"` |

## Combining filters with AND

Adding multiple filter rows combines them with **AND** — every condition must hold:

```text
service_name = "checkout"
http_status_code >= 500
environment = "prod"
```

This returns only prod checkout records with a 5xx status. To express OR within a single attribute, use `IN`:

```text
http_status_code IN (500, 502, 503, 504)
```

:::note
The Builder joins filter rows with AND. For complex boolean logic mixing AND and OR across different attributes, drop to [ClickHouse SQL](/querying/clickhouse-queries/) where you can write an arbitrary `WHERE` clause.
:::

## Full-text search

For logs, you can search the message body without naming an attribute. A bare term performs a full-text search across the body:

```text
timeout
```

This matches any log whose body contains `timeout`. Combine it with structured filters to scope the search:

```text
service_name = "payments"
body CONTAINS "connection refused"
```

## Working with attributes

- **String values** go in quotes: `service_name = "api-gateway"`.
- **Numbers** are bare: `duration_ms > 250`.
- **Booleans** use `true` / `false`: `has_error = true`.
- Use `EXISTS` to find records that carry an optional attribute at all, regardless of its value.

```text
http_route EXISTS
deployment_version != "v1.4.2"
```

:::tip
Start broad, then add filter rows one at a time and watch the result count fall. It is much easier to see which condition removed the records you wanted than to debug one giant filter.
:::

:::caution
`CONTAINS` does a substring scan and is slower than `=` on indexed attributes. When a structured attribute exists (for example `http_route`), prefer an exact match over searching the raw body.
:::

These filters power the Query Builder; see [Aggregation and Grouping](/querying/aggregation-grouping/) for what happens to the matching records next.
