<?xml version="1.0" encoding="UTF-8"?>
<!-- Makes sitemap.xml readable in browsers. Search engines ignore it and read the XML directly. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <title>Sitemap | Duct Hunt</title>
        <style>
          body { margin: 0; padding: 32px 16px; font-family: Helvetica, Arial, sans-serif; background: #e6eef5; color: #1f3a52; }
          main { max-width: 760px; margin: auto; }
          h1 { margin: 0 0 6px; font-size: 28px; }
          p { margin: 0 0 20px; color: #4b6275; }
          ol { margin: 0; padding: 0; list-style: none; background: #fff; border-radius: 12px; overflow: hidden; }
          li + li { border-top: 1px solid #d5e0ea; }
          a { display: block; padding: 14px 18px; color: #165e9e; font-weight: 600; text-decoration: none; overflow-wrap: anywhere; }
          a:hover { background: #f3f7fa; }
        </style>
      </head>
      <body>
        <main>
          <h1>Duct Hunt sitemap</h1>
          <p><xsl:value-of select="count(//s:loc)" /> pages. This file is for search engines; the list below is just for people.</p>
          <ol>
            <xsl:for-each select="//s:loc">
              <li><a href="{.}"><xsl:value-of select="." /></a></li>
            </xsl:for-each>
          </ol>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
