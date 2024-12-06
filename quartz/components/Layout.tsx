import { FunctionComponent } from 'preact'
import { Layout } from '../../components/Layout'
import { Graph } from '../../components/Graph'
import { BackLinks } from '../../components/BackLinks'

const HomePageEN: FunctionComponent = () => {
  return (
    <Layout lang="en">
      <Graph />
      <BackLinks />
      {/* 다른 콘텐츠 */}
    </Layout>
  )
}

export default HomePageEN 