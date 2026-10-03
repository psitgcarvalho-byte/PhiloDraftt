const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  // Static assets
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  eleventyConfig.addPassthroughCopy({ "src/editor": "editor" });

  // Filters
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).setLocale("pt-BR").toFormat("dd 'de' LLLL 'de' yyyy");
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toISODate();
  });

  // Collections
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md").sort((a,b) => b.date - a.date);
  });

  eleventyConfig.addCollection("featured", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/posts/*.md")
      .filter(item => item.data.featured === true)
      .sort((a,b) => b.date - a.date)
      .slice(0, 6);
  });

  eleventyConfig.addCollection("tagList", function(collectionApi) {
    const set = new Set();
    collectionApi.getFilteredByGlob("src/posts/*.md").forEach(p => (p.data.tags || []).forEach(t => t !== "posts" && set.add(t)));
    return [...set].sort();
  });

  // Prefixo de caminho (GitHub Pages em subcaminho). Vazio com domínio próprio.
  const prefix = (process.env.PATH_PREFIX || "").replace(/\/$/, "");
  if (prefix) {
    eleventyConfig.addTransform("prefix", function(content) {
      if (!(this.page.outputPath || "").endsWith(".html")) return content;
      return content.replace(/(href|src|action)="\/(?!\/)/g, `$1="${prefix}/`);
    });
  }

  // Watch targets
  eleventyConfig.addWatchTarget("src/assets");

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: prefix ? prefix + "/" : "/"
  };
};
