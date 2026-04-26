---
layout: default
title: Me, Kiki, Beef, Papaya(ComingSoon) and **HER**
date: 2026-04-25
tags: [dove, kiki, beef, papaya(soon™️), lanky or rotund?, bearded dragon, pacman frog, her, love, kiss, lick, dove, mine, in and out]
permalink: /kisskisskissheralloverinsideandout/
body_class: gallery-page
description: A page for you, my love. Pictures of us, of the animals, of moments — all in one place.
image: /assets/img/her/us.jpg
# nav_order: 1
---

<link rel="stylesheet" href="{{ '/assets/css/gallery.css' | relative_url }}">

<h1 class="centered">Love Invocation</h1>

---

<div class="masonry-gallery">
  {% assign her_thumbs = site.static_files
       | where_exp: "f", "f.path contains '/assets/img/her/thumb/'"
       | sort: "name" %}
  {% for img in her_thumbs %}
    <div class="masonry-item">
      <a href="{{ '/assets/img/her/full/' | append: img.name | relative_url }}"
         data-full="{{ '/assets/img/her/full/' | append: img.name | relative_url }}">
        <img src="{{ img.path | relative_url }}" alt="{{ img.basename }}" loading="lazy">
      </a>
    </div>
  {% endfor %}
</div>

<script src="{{ '/assets/js/lightbox.js' | relative_url }}" defer></script>
