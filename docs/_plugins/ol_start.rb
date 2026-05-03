# frozen_string_literal: true

# Restore source-driven start numbers on ordered lists.
#
# Kramdown 2.4 unconditionally renumbers <ol> elements from 1, ignoring the
# leading number in the markdown source. This plugin scans the markdown
# pre-render for ordered-list openings, remembers each list's first number,
# then post-render injects start="N" into each <ol> in document order.
#
# Loaded only when Jekyll runs locally or in CI (e.g. GitHub Actions).
# The default GitHub Pages auto-build runs in safe mode and ignores _plugins/.

module Jekyll
  module OlStart
    LIST_OPEN = /\A([ \t]{0,3})(\d+)\.[ \t]+\S/.freeze
    OL_TAG = /<ol(?![^>]*\bstart=)([^>]*)>/.freeze

    module_function

    def collect_starts(content)
      starts = []
      in_list = false
      prev_blank = true
      content.each_line do |raw|
        line = raw.chomp
        if line.strip.empty?
          in_list = false
          prev_blank = true
        elsif (m = line.match(LIST_OPEN)) && (prev_blank || in_list)
          starts << m[2].to_i unless in_list
          in_list = true
          prev_blank = false
        else
          in_list = false unless line.start_with?("    ", "\t")
          prev_blank = false
        end
      end
      starts
    end

    def markdown?(doc)
      ext = doc.respond_to?(:extname) ? doc.extname : File.extname(doc.path.to_s)
      [".md", ".markdown"].include?(ext.to_s.downcase)
    end

    Jekyll::Hooks.register %i[pages documents], :pre_render do |doc|
      next unless markdown?(doc)
      next unless doc.respond_to?(:content) && doc.content.is_a?(String)

      doc.data["_ol_starts"] = OlStart.collect_starts(doc.content)
    end

    Jekyll::Hooks.register %i[pages documents], :post_render do |doc|
      starts = doc.data["_ol_starts"]
      next if starts.nil? || starts.empty? || doc.output.nil?

      i = 0
      doc.output = doc.output.gsub(OL_TAG) do
        attrs = Regexp.last_match(1)
        n = starts[i]
        i += 1
        n && n != 1 ? %(<ol start="#{n}"#{attrs}>) : "<ol#{attrs}>"
      end
    end
  end
end
