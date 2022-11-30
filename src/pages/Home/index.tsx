import { lazy } from 'react'

import { Container, ScrollToTop } from './common'

const Contact = lazy(() => import('./components/ContactForm'))
const MiddleBlock = lazy(() => import('./components/MiddleBlock'))
const ContentBlock = lazy(() => import('./components/ContentBlock'))

export default function Home() {
  return (
    <Container>
      <ScrollToTop />
      <ContentBlock
        type="right"
        title={'Landing page template for developers & startups'}
        content={
          'Beautifully designed templates using React.js, ant design and styled-components! Save weeks of time and build your landing page in minutes.'
        }
        button={'button'}
        icon="developer.svg"
        id="intro"
      />
      <MiddleBlock title={'title'} content={'text'} button={'button'} />
      <ContentBlock type="left" title={'title'} content={'text'} section={'section'} icon="graphs.svg" id="about" />
      <ContentBlock type="right" title={'title'} content={'text'} icon="product-launch.svg" id="mission" />
      <ContentBlock type="left" title={'title'} content={'text'} icon="waving.svg" id="product" />
      <Contact title={'title'} content={'text'} id="contact" />
    </Container>
  )
}
