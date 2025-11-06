---
layout: default
title: Now
---

# What I'm Up To Now

*Last updated: {{ "now" | date: "%B %d, %Y" }}*

## Currently Reading
{% assign reading = site.data.now.reading %}
- **{{ reading.title }}** by {{ reading.author }}

## Currently Watching
{% assign watching = site.data.now.watching %}
- {{ watching.show }} ({{ watching.status }})

## Current Projects
{% for project in site.data.now.projects %}
- {{ project }}
{% endfor %}
