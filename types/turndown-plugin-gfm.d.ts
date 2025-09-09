declare module 'turndown-plugin-gfm' {
  import TurndownService from 'turndown';
  
  export interface GfmOptions {
    strikethrough?: boolean;
    tables?: boolean;
    tasklists?: boolean;
  }
  
  export const gfm: TurndownService.Plugin;
  export const strikethrough: TurndownService.Plugin;
  export const tables: TurndownService.Plugin;
  export const taskListItems: TurndownService.Plugin;
}