import * as Lucide from 'lucide-solid';

export const MARKUP_CONFIG: Record<string, any> = {
  md: {
    label: 'Markdown',
    bold: (s:string) => `**${s || 'bold'}**`,
    italic: (s:string) => `_${s || 'italic'}_`,
    link: (s:string) => `[${s || 'link'}](url)`,
    code: (s:string) => `\`${s || 'code'}\``,
    image: (s:string) => `![${s || 'caption'}](url)`,
    viewers: [
       { id: 'hugo', label: 'Hugo', icon: <Lucide.Layout size={16}/>, description: 'The world\'s fastest static site generator. Best for Markdown sites requiring extreme speed.' },
       { id: 'jekyll', label: 'Jekyll', icon: <Lucide.Flame size={16}/>, description: 'The battle-tested Ruby generator. Native to GitHub Pages; excellent for simple Markdown blogs.' },
       { id: 'pandoc', label: 'Pandoc (Live)', icon: <Lucide.Terminal size={16}/>, description: 'The universal document converter. Provides a live HTML preview for diverse formats without an SSG.' }
    ]
  },
  adoc: {
    label: 'AsciiDoc',
    bold: (s:string) => `*${s || 'bold'}*`,
    italic: (s:string) => `_${s || 'italic'}_`,
    link: (s:string) => `link:url[${s || 'link'}]`,
    code: (s:string) => `\`${s || 'code'}\``,
    image: (s:string) => `image::url[${s || 'caption'}]`,
    viewers: [
       { id: 'asciidoctor', label: 'Asciidoctor', icon: <Lucide.Coffee size={16}/>, description: 'The industry-standard Ruby-based processor for AsciiDoc. Reliable and highly compatible.' },
       { id: 'antora', label: 'Antora', icon: <Lucide.Zap size={16}/>, description: 'The multi-repo documentation site generator for AsciiDoc. Ideal for large, versioned sets.' }
    ]
  },
  cmk: {
     label: 'CentrMark',
     bold: (s:string) => `*${s || 'bold'}*`,
     italic: (s:string) => `_${s || 'italic'}_`,
     link: (s:string) => `[${s || 'link'}](url)`,
     code: (s:string) => `\`${s || 'code'}\``,
     image: (s:string) => `![${s || 'caption'}](url)`,
     viewers: [
        { id: 'centrmark', label: 'CentrMark Engine', icon: <Lucide.Cpu size={16}/>, description: 'The native renderer for the CentrMark specification. Supports advanced block directives.' },
        { id: 'pandoc', label: 'Pandoc (Live)', icon: <Lucide.Terminal size={16}/>, description: 'The universal document converter. Used as a fallback for CMK preview.' }
     ]
  },
  org: {
    label: 'Org-mode',
    bold: (s:string) => `*${s || 'bold'}*`,
    italic: (s:string) => `/${s || 'italic'}/`,
    link: (s:string) => `[[url][${s || 'link'}]]`,
    code: (s:string) => `~${s || 'code'}~`,
    image: (s:string) => `[[url]]`,
    viewers: [ { id: 'pandoc', label: 'Pandoc Render', icon: <Lucide.Terminal size={16}/>, description: 'Converts Org-mode documents to live HTML for browser simulation.' } ]
  },
  rst: {
    label: 'ReStructuredText',
    bold: (s:string) => `**${s || 'bold'}**`,
    italic: (s:string) => `*${s || 'italic'}*`,
    link: (s:string) => `\`${s || 'link'} <url>\`_`,
    code: (s:string) => `\`\`${s || 'code'}\`\``,
    image: (s:string) => `.. image:: url\n   :alt: ${s || 'caption'}`,
    viewers: [ { id: 'pandoc', label: 'Pandoc Render', icon: <Lucide.Terminal size={16}/>, description: 'Converts ReStructuredText documents to live HTML for browser simulation.' } ]
  },
  textile: {
    label: 'Textile',
    bold: (s:string) => `*${s || 'bold'}*`,
    italic: (s:string) => `_${s || 'italic'}_`,
    link: (s:string) => `"${s || 'link'}":url`,
    code: (s:string) => `@${s || 'code'}@`,
    image: (s:string) => `!url(${s || 'caption'})!`,
    viewers: [ { id: 'pandoc', label: 'Pandoc Render', icon: <Lucide.Terminal size={16}/>, description: 'Converts Textile documents to live HTML for browser simulation.' } ]
  },
  wiki: {
    label: 'WikiText',
    bold: (s:string) => `'''${s || 'bold'}'''`,
    italic: (s:string) => `''${s || 'italic'}''`,
    link: (s:string) => `[url ${s || 'link'}]`,
    code: (s:string) => `<code>${s || 'code'}</code>`,
    image: (s:string) => `[[File:url|thumb|${s || 'caption'}]]`,
    viewers: [ { id: 'pandoc', label: 'Pandoc Render', icon: <Lucide.Terminal size={16}/>, description: 'Converts MediaWiki/WikiText documents to live HTML for browser simulation.' } ]
  }
};
