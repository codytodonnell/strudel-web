import path from "path";
import type { GatsbyNode } from "gatsby";

/**
 * Possible properties for a page object in strudel-config.json.
 */
interface StrudelPage {
  name: string;
  path: string;
  markdownId?: string;
  layoutComponent?: string;
  children?: StrudelPage[];
}

/**
 * Shape of the result from the graphql query
 * for the strudel config json and the markdown (MDX)
 * content files.
 */
interface Result {
  errors?: any;
  data?: {
    configJson: {
      pages: StrudelPage[]
    },
    allMdx: {
      nodes: {
        frontmatter: {
          id: string;
        },
        internal: {
          contentFilePath: string;
        }
      }[]
    }
  }
}

/**
 * Special gatsby method for creating pages programatically.
 * Here we are pulling data from strudel-config.json to generate 
 * pages from the markdown files that correspond to each page.
 */
export const createPages: GatsbyNode["createPages"] = async ({
  graphql, 
  actions,
  reporter
}) => {
  const { createPage } = actions;

  /**
   * Graphql query for the page objects in strudel-config.json
   * and the mdx files in the content directory.
   */
  const result: Result = await graphql(
    `
      {
        configJson {
          pages {
            markdownId
            name
            path
            layoutComponent
            children {
              markdownId
              name
              path
              layoutComponent
              children {
                markdownId
                name
                path
                layoutComponent
              }
            }
          }
        }
        allMdx {
          nodes {
            frontmatter {
              id
            }
            internal {
              contentFilePath
            }
          }
        }
      }
    `
  );

  if (result.errors) {
    reporter.panicOnBuild(`Error while running GraphQL query.`);
    return;
  }

  const nestedPages = result.data?.configJson.pages;

  /**
   * Build a flat list of page objects from the json
   */
  const flattenPages = (pages: StrudelPage[]) => { 
    return pages.reduce((flattened: StrudelPage[], { children, ...rest }) => {      
      return flattened
        .concat([{ ...rest }])
        .concat(children ? flattenPages(children) : []);
    }, []);
  }

  const pages = nestedPages && flattenPages(nestedPages);
  const mdxPages = result.data?.allMdx.nodes;

  /**
   * Create a page for each page object that has an associated markdown file.
   * Pages that don't have a markdownId are assumed to have a custom page in
   * the pages directory.
   * 
   * Page objects are linked to markdown files by an id in the file's frontmatter metadata
   * (markdownId === frontmatter.id).
   */
  if (pages) {
    pages.forEach((page) => {
      if (page.markdownId) {
        const mdx = mdxPages?.find((d) => d.frontmatter.id === page.markdownId);
        if (mdx) {
          /**
           * The layoutComponent prop will fallback to SidebarLayout if none exists on the page object.
           * Because gatsby graphql looks at the existing properties of strudel-config.json to determine
           * what the queryable properties are, the layoutComponent property has been included in the json 
           * for each object to ensure layoutComponent remains queryable at every page level.
           * Technically each property only needs to exist in one object per child-level to be queryable.
           */
          page.layoutComponent = page.layoutComponent || 'SidebarLayout';
          const pageTemplate = path.resolve(`src/components/layouts/${page.layoutComponent}.tsx`);
          createPage({
            path: page.path,
            /**
             * This will pass the formatted markdown file to the page template via the children prop
             */
            component: `${pageTemplate}?__contentFilePath=${mdx.internal.contentFilePath}`,
          });
        }
      }
    });
  }
};

