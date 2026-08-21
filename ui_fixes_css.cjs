const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');
if (!html.includes('html { scroll-behavior: smooth; }')) {
  html = html.replace(
    "</style>",
    `
      html { scroll-behavior: smooth; }
      /* Smooth transitions for all interactive elements */
      button, input, a, div, span, nav, header, main {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
      }
    </style>`
  );
  fs.writeFileSync('index.html', html);
}

