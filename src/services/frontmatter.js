/**
 * Utility for parsing and serializing Markdown frontmatter.
 */

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Parses markdown content and extracts frontmatter if present.
 * @param {string} content
 * @returns {{ hasFrontmatter: boolean, frontmatter: string, body: string }}
 */
export function parseFrontmatter(content) {
  if (!content || typeof content !== 'string') {
    return {
      hasFrontmatter: false,
      frontmatter: '',
      body: content || ''
    };
  }

  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return {
      hasFrontmatter: false,
      frontmatter: '',
      body: content
    };
  }

  const frontmatter = match[1];
  const body = content.slice(match[0].length);

  return {
    hasFrontmatter: true,
    frontmatter,
    body
  };
}

/**
 * Reconstructs a complete markdown document from frontmatter and body.
 * @param {string} frontmatter
 * @param {string} body
 * @returns {string}
 */
export function stringifyFrontmatter(frontmatter, body) {
  const normalizedBody = body !== undefined && body !== null ? body : '';
  if (frontmatter === null || frontmatter === undefined) {
    return normalizedBody;
  }

  // If frontmatter is empty string but was marked as having frontmatter, maintain delimiters
  return `---\n${frontmatter}\n---\n\n${normalizedBody.replace(/^\n+/, '')}`;
}
