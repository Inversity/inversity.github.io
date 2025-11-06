---
layout: default
title: Cool Stuff
---

# Cool Stuff I've Found

A collection of interesting things I've discovered around the internet.

---

## All Items

{% for item in site.stuff reversed %}
<div style="margin-bottom: 2em; padding-bottom: 1.5em; border-bottom: 1px solid #444;">

  ### [{{ item.title }}]({{ item.url }})

  <p style="color: #888; font-size: 0.9em;">
    {% assign cat = site.data.categories | where: "name", item.category | first %}
    {% if cat %}{{ cat.icon }} {{ cat.display }}{% endif %}
    &nbsp;•&nbsp; {{ item.date | date: "%B %d, %Y" }}
  </p>

  {{ item.excerpt }}

  <a href="{{ item.url }}">View details →</a>

</div>
{% endfor %}

---

## By Category

{% for category in site.data.categories %}
  {% assign items = site.stuff | where: "category", category.name %}
  {% if items.size > 0 %}

  ### {{ category.icon }} {{ category.display }} ({{ items.size }})

  <ul>
  {% for item in items %}
    <li><a href="{{ item.url }}">{{ item.title }}</a> - {{ item.date | date: "%b %d, %Y" }}</li>
  {% endfor %}
  </ul>

  {% endif %}
{% endfor %}
