export default function route(page) {
  switch (page) {
    case 'biz-ui-main':
      import('./pages/main')
      return page
  }
}
