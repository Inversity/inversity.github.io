---
layout: default
title: Cool Stuff
nav_order: 2
---

# Cool Stuff I've Found

A collection of interesting things I've discovered around the internet.

---

## All Items

{% for item in site.stuff reversed %}
<div style="margin-bottom: 2em; padding-bottom: 1.5em; border-bottom: 1px solid #444;">
  <h1 style="margin: 0 0 0.3em;"><a href="{{ item.url }}">{{ item.title }}</a></h1>
  <p style="color: #888; font-size: 0.9em; margin: 0 0 1em;">
    {% assign cat = site.data.categories | where: "name", item.category | first %}
    {% if cat %}<span class="category-icon">{{ cat.icon }}</span> {{ cat.display }}{% endif %}
    &nbsp;•&nbsp; {{ item.date | date: "%B %d, %Y" }}
  </p>

  {{ item.excerpt }}

  {%- assign excerpt_text = item.excerpt | strip_html | strip -%}
  {%- assign full_text = item.content | strip_html | strip -%}
  {%- assign body_text = full_text | replace: excerpt_text, "" | strip | truncatewords: 30 -%}
  <p>{{ body_text }}</p>

  <a href="{{ item.url }}">View details →</a>
</div>
{% endfor %}

---

## By Category

{% for category in site.data.categories %}
  {% assign items = site.stuff | where: "category", category.name %}
  {% if items.size > 0 %}
<div style="margin-bottom: 2.5em;">
  <h1 style="margin: 0 0 0.4em;"><span class="category-icon">{{ category.icon }}</span> {{ category.display }} <span style="opacity: 0.6; font-size: 0.7em;">({{ items.size }})</span></h1>
  <ul style="margin: 0; padding-left: 1.5em;">
    {% for item in items %}
    <li style="margin-bottom: 0.3em;">
      <a href="{{ item.url }}">{{ item.title }}</a>
      <span style="color: #888; font-size: 0.9em;">— {{ item.date | date: "%b %d, %Y" }}</span>
    </li>
    {% endfor %}
  </ul>
</div>
  {% endif %}
{% endfor %}
