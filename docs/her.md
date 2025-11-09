---
layout: default
title: Her
permalink: /kisskisskissheralloverthemindsconveyer/
# nav_order: 1
---

<style>
  /* Widen the content area for this page */
  .wrapper {
    max-width: 1600px !important;
    width: 95% !important;
  }

  section {
    max-width: 100% !important;
  }

  /* Masonry gallery styles */
  .masonry-gallery {
    column-count: 4;
    column-gap: 1.2em;
    padding: 1em 0;
  }

  .masonry-item {
    break-inside: avoid;
    margin-bottom: 1.2em;
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }

  .masonry-item img {
    width: 100%;
    display: block;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(139, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.4s ease;
  }

  .masonry-item:hover img {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(139, 0, 0, 0.7);
  }

  /* Responsive columns */
  @media (max-width: 1400px) {
    .masonry-gallery {
      column-count: 3;
    }
  }

  @media (max-width: 900px) {
    .masonry-gallery {
      column-count: 2;
    }
  }

  @media (max-width: 600px) {
    .masonry-gallery {
      column-count: 1;
    }
  }
</style>

<h1 style="text-align: center;">Love Invocation</h1>

---

<div class="masonry-gallery">
  {% for i in (1..219) %}
    <div class="masonry-item">
      <a href="/assets/img/her/{{ i }}.jpeg" target="_blank">
        <img src="/assets/img/her/{{ i }}.jpeg" alt="Photo {{ i }}">
      </a>
    </div>
  {% endfor %}
</div>
