import { customCodeRenderer, customHeadingRenderer } from './markdown_renderers';

const marked = require('marked');

export const overrideMarkedWithCustomSettings = () => {
    const renderer = new marked.Renderer();
    renderer.heading = customHeadingRenderer;
    renderer.code = customCodeRenderer;
    marked.use({ renderer });

    return marked;
};
